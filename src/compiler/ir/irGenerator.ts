/**
 * irGenerator.ts — Gerador de Three-Address Code (TAC) a partir da AST iuGo
 *
 * Recebe a AST **otimizada** (saída do Optimizer) e produz um IRProgram
 * com instruções Three-Address Code.
 *
 * ── Estratégia ────────────────────────────────────────────────────────────
 *
 * Cada expressão é traduzida pelo método `genExpr`, que:
 *   - Retorna um "place" (string) representando onde o valor está guardado.
 *   - Para literais e identificadores, retorna o valor/nome diretamente
 *     (sem criar temporário desnecessário).
 *   - Para operações compostas, cria um temporário novo (t0, t1, …) e
 *     emite a instrução correspondente.
 *
 * Cada statement é traduzido por `genStatement`:
 *   VariableDeclaration / Assignment → assign
 *   PrintStatement                   → print
 *   IfStatement                      → iffalse + label(s) + jump
 *   WhileStatement                   → label + iffalse + jump
 *   BlockStatement                   → itera os statements filhos
 *
 * ── Tradução de controle de fluxo ────────────────────────────────────────
 *
 * if (cond) { A } else { B }:
 *   <gen cond → t>
 *   iffalse t goto L_else
 *   <gen A>
 *   goto L_end
 *   L_else:
 *   <gen B>
 *   L_end:
 *
 * while (cond) { body }:
 *   L_start:
 *   <gen cond → t>
 *   iffalse t goto L_end
 *   <gen body>
 *   goto L_start
 *   L_end:
 */

import {
  NodeKind,
  ProgramNode,
  StatementNode,
  ExpressionNode,
  VariableDeclarationNode,
  AssignmentNode,
  PrintStatementNode,
  IfStatementNode,
  WhileStatementNode,
  BlockStatementNode,
  BinaryExpressionNode,
  UnaryExpressionNode,
  IdentifierNode,
  NumberLiteralNode,
  StringLiteralNode,
  BooleanLiteralNode,
} from '../parser/ast';
import type { IRInstr, IRProgram } from './ir';

export class IRGenerator {
  private instructions: IRInstr[] = [];
  private tempCount   = 0;   // contador de temporários: t0, t1, …
  private labelCount  = 0;   // contador de rótulos:     L0, L1, …

  /**
   * Ponto de entrada: recebe a AST otimizada e retorna o IRProgram.
   */
  generate(program: ProgramNode): IRProgram {
    this.instructions = [];
    this.tempCount    = 0;
    this.labelCount   = 0;

    for (const stmt of program.statements) {
      this.genStatement(stmt);
    }

    return { instructions: this.instructions };
  }

  // ── Geradores de temporários e rótulos ────────────────────────────────────

  private newTemp(): string {
    return `t${this.tempCount++}`;
  }

  private newLabel(): string {
    return `L${this.labelCount++}`;
  }

  private emit(instr: IRInstr): void {
    this.instructions.push(instr);
  }

  // ── Tradução de statements ────────────────────────────────────────────────

  private genStatement(stmt: StatementNode): void {
    switch (stmt.kind) {
      case NodeKind.VariableDeclaration:
        return this.genVarDecl(stmt);
      case NodeKind.Assignment:
        return this.genAssignment(stmt);
      case NodeKind.PrintStatement:
        return this.genPrint(stmt);
      case NodeKind.IfStatement:
        return this.genIf(stmt);
      case NodeKind.WhileStatement:
        return this.genWhile(stmt);
      case NodeKind.BlockStatement:
        return this.genBlock(stmt);
      default: {
        const _never: never = stmt;
        void _never;
      }
    }
  }

  /** let x = expr  →  x = <place> */
  private genVarDecl(node: VariableDeclarationNode): void {
    const src = this.genExpr(node.initializer);
    this.emit({ kind: 'assign', dest: node.name, src });
  }

  /** x = expr  →  x = <place> */
  private genAssignment(node: AssignmentNode): void {
    const src = this.genExpr(node.value);
    this.emit({ kind: 'assign', dest: node.name, src });
  }

  /** print(expr)  →  print <place> */
  private genPrint(node: PrintStatementNode): void {
    const value = this.genExpr(node.argument);
    this.emit({ kind: 'print', value });
  }

  /**
   * if (cond) { A } else? { B }
   *
   *   <cond → t>
   *   iffalse t goto L_else
   *   <A>
   *   goto L_end     (só se há else)
   *   L_else:
   *   <B>            (só se há else)
   *   L_end:
   */
  private genIf(node: IfStatementNode): void {
    const cond   = this.genExpr(node.condition);
    const lElse  = this.newLabel();

    this.emit({ kind: 'iffalse', cond, target: lElse });
    this.genBlock(node.consequent);

    if (node.alternate) {
      const lEnd = this.newLabel();
      this.emit({ kind: 'jump',  target: lEnd });
      this.emit({ kind: 'label', name:   lElse });
      this.genBlock(node.alternate);
      this.emit({ kind: 'label', name:   lEnd });
    } else {
      this.emit({ kind: 'label', name: lElse });
    }
  }

  /**
   * while (cond) { body }
   *
   *   L_start:
   *   <cond → t>
   *   iffalse t goto L_end
   *   <body>
   *   goto L_start
   *   L_end:
   */
  private genWhile(node: WhileStatementNode): void {
    const lStart = this.newLabel();
    const lEnd   = this.newLabel();

    this.emit({ kind: 'label',   name:   lStart });
    const cond = this.genExpr(node.condition);
    this.emit({ kind: 'iffalse', cond,   target: lEnd });
    this.genBlock(node.body);
    this.emit({ kind: 'jump',    target: lStart });
    this.emit({ kind: 'label',   name:   lEnd });
  }

  private genBlock(node: BlockStatementNode): void {
    for (const stmt of node.statements) {
      this.genStatement(stmt);
    }
  }

  // ── Tradução de expressões ────────────────────────────────────────────────

  /**
   * Traduz uma expressão e retorna o "place" onde o resultado estará.
   *
   * Para literais/identificadores: retorna a representação direta (sem temp).
   * Para operações compostas: emite a instrução e retorna o nome do temp criado.
   */
  private genExpr(expr: ExpressionNode): string {
    switch (expr.kind) {
      case NodeKind.NumberLiteral:
        return this.placeNum(expr);
      case NodeKind.StringLiteral:
        return this.placeStr(expr);
      case NodeKind.BooleanLiteral:
        return this.placeBool(expr);
      case NodeKind.Identifier:
        return this.placeId(expr);
      case NodeKind.BinaryExpression:
        return this.genBinary(expr);
      case NodeKind.UnaryExpression:
        return this.genUnary(expr);
      default: {
        const _never: never = expr;
        void _never;
        return '__unknown__';
      }
    }
  }

  // Literais → representação textual direta
  private placeNum(node: NumberLiteralNode):  string { return String(node.value); }
  private placeStr(node: StringLiteralNode):  string { return `"${node.value}"`; }
  private placeBool(node: BooleanLiteralNode): string { return String(node.value); }
  private placeId(node: IdentifierNode):      string { return node.name; }

  /**
   * left op right  →  emite BinOpInstr e retorna o nome do temporário.
   *
   * Exemplo:
   *   BinaryExpression { op: "+", left: Identifier "idade", right: NumberLiteral 1 }
   *   → emit { kind:'binop', dest:'t0', op:'+', left:'idade', right:'1' }
   *   → retorna 't0'
   */
  private genBinary(node: BinaryExpressionNode): string {
    const left  = this.genExpr(node.left);
    const right = this.genExpr(node.right);
    const dest  = this.newTemp();
    this.emit({ kind: 'binop', dest, op: node.operator, left, right });
    return dest;
  }

  /**
   * op operand  →  emite UnOpInstr e retorna o nome do temporário.
   *
   * Exemplo:
   *   UnaryExpression { op: "!", operand: Identifier "ativo" }
   *   → emit { kind:'unop', dest:'t0', op:'!', operand:'ativo' }
   *   → retorna 't0'
   */
  private genUnary(node: UnaryExpressionNode): string {
    const operand = this.genExpr(node.operand);
    const dest    = this.newTemp();
    this.emit({ kind: 'unop', dest, op: node.operator, operand });
    return dest;
  }
}
