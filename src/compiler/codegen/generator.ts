/**
 * generator.ts — Geração de JavaScript a partir da AST iuGo (Sprint 5)
 *
 * Estratégia:
 *   - Visitor recursivo por `kind` (statements e expressões).
 *   - Expressões binárias são parentizadas para preservar precedência no JS.
 *   - `let` iuGo → `const` em JS (variável de binding único por escopo léxico).
 *   - `print(e)` → `console.log(e)`.
 *
 * Formatação: delegada a `Emitter` (2 espaços por nível).
 *
 * ── Exemplo (AST otimizada → JS) ──────────────────────────────────────────
 *
 * AST (após propagação + fold):
 *   PrintStatement { argument: NumberLiteral { value: 5 } }
 *
 * JavaScript:
 *   console.log(5);
 *
 * TODO: register allocation
 * TODO: SSA form optimization (duplicado com optimizer — manter referência cruzada)
 */

import {
  ProgramNode,
  StatementNode,
  ExpressionNode,
  NodeKind,
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
} from "../parser/ast";
import { Emitter } from "./emitter";

export class CodeGenerator {
  private readonly emitter = new Emitter();
  // Variáveis que recebem Assignment em qualquer ponto do programa → devem
  // ser declaradas com `let` em JS, não `const`.
  private reassignedVars = new Set<string>();

  /**
   * Gera o programa completo como string JavaScript.
   */
  generate(program: ProgramNode): string {
    this.emitter.reset();
    this.reassignedVars = this.collectReassigned(program);

    this.emitter.emitLine("// Código gerado pelo compilador iuGo");
    this.emitter.emitLine("// NÃO edite manualmente — gerado automaticamente");
    this.emitter.emitBlank();

    for (const stmt of program.statements) {
      this.visitStatement(stmt);
    }

    return this.emitter.toString();
  }

  /** Percorre toda a AST e coleta nomes de variáveis que sofrem Assignment. */
  private collectReassigned(program: ProgramNode): Set<string> {
    const out = new Set<string>();
    this.collectReassignedFromStatements(program.statements, out);
    return out;
  }

  private collectReassignedFromStatements(stmts: StatementNode[], out: Set<string>): void {
    for (const stmt of stmts) {
      this.collectReassignedFromStatement(stmt, out);
    }
  }

  private collectReassignedFromStatement(stmt: StatementNode, out: Set<string>): void {
    switch (stmt.kind) {
      case NodeKind.Assignment:
        out.add(stmt.name);
        break;
      case NodeKind.BlockStatement:
        this.collectReassignedFromStatements(stmt.statements, out);
        break;
      case NodeKind.IfStatement:
        this.collectReassignedFromStatements(stmt.consequent.statements, out);
        if (stmt.alternate) this.collectReassignedFromStatements(stmt.alternate.statements, out);
        break;
      case NodeKind.WhileStatement:
        this.collectReassignedFromStatements(stmt.body.statements, out);
        break;
      default:
        break;
    }
  }

  private visitStatement(node: StatementNode): void {
    switch (node.kind) {
      case NodeKind.VariableDeclaration:
        this.visitVariableDeclaration(node);
        break;
      case NodeKind.Assignment:
        this.visitAssignment(node);
        break;
      case NodeKind.PrintStatement:
        this.visitPrintStatement(node);
        break;
      case NodeKind.IfStatement:
        this.visitIfStatement(node);
        break;
      case NodeKind.WhileStatement:
        this.visitWhileStatement(node);
        break;
      case NodeKind.BlockStatement:
        this.visitBlockStatement(node);
        break;
      default: {
        const _n: never = node;
        void _n;
        this.emitter.emitLine(`/* statement não suportado */`);
      }
    }
  }

  /** iuGo `let x = v;` → JS `const x = v;` (ou `let` se x for reatribuído) */
  private visitVariableDeclaration(node: VariableDeclarationNode): void {
    const keyword = this.reassignedVars.has(node.name) ? "let" : "const";
    const rhs = this.visitExpression(node.initializer);
    this.emitter.emitLine(`${keyword} ${node.name} = ${rhs};`);
  }

  private visitAssignment(node: AssignmentNode): void {
    const rhs = this.visitExpression(node.value);
    this.emitter.emitLine(`${node.name} = ${rhs};`);
  }

  private visitPrintStatement(node: PrintStatementNode): void {
    const arg = this.visitExpression(node.argument);
    this.emitter.emitLine(`console.log(${arg});`);
  }

  private visitIfStatement(node: IfStatementNode): void {
    const cond = this.visitExpression(node.condition);
    this.emitter.emitLine(`if (${cond}) {`);
    this.emitter.pushIndent();
    for (const s of node.consequent.statements) {
      this.visitStatement(s);
    }
    this.emitter.popIndent();

    if (node.alternate) {
      this.emitter.emitLine("} else {");
      this.emitter.pushIndent();
      for (const s of node.alternate.statements) {
        this.visitStatement(s);
      }
      this.emitter.popIndent();
    }
    this.emitter.emitLine("}");
  }

  private visitWhileStatement(node: WhileStatementNode): void {
    const cond = this.visitExpression(node.condition);
    this.emitter.emitLine(`while (${cond}) {`);
    this.emitter.pushIndent();
    for (const s of node.body.statements) {
      this.visitStatement(s);
    }
    this.emitter.popIndent();
    this.emitter.emitLine("}");
  }

  private visitBlockStatement(node: BlockStatementNode): void {
    for (const s of node.statements) {
      this.visitStatement(s);
    }
  }

  private visitExpression(node: ExpressionNode): string {
    switch (node.kind) {
      case NodeKind.BinaryExpression:
        return this.visitBinaryExpression(node);
      case NodeKind.UnaryExpression:
        return this.visitUnaryExpression(node);
      case NodeKind.Identifier:
        return this.visitIdentifier(node);
      case NodeKind.NumberLiteral:
        return this.visitNumberLiteral(node);
      case NodeKind.StringLiteral:
        return this.visitStringLiteral(node);
      case NodeKind.BooleanLiteral:
        return this.visitBooleanLiteral(node);
      default: {
        const _n: never = node;
        void _n;
        return "/* expressão desconhecida */";
      }
    }
  }

  private visitBinaryExpression(node: BinaryExpressionNode): string {
    const left  = this.visitExpressionNested(node.left);
    const right = this.visitExpressionNested(node.right);
    return `${left} ${node.operator} ${right}`;
  }

  private visitUnaryExpression(node: UnaryExpressionNode): string {
    const inner = this.visitExpressionNested(node.operand);
    return node.operator === "!" ? `!${inner}` : `-${inner}`;
  }

  /** Wraps in parens only when the sub-expression itself has operators (to preserve precedence). */
  private visitExpressionNested(node: ExpressionNode): string {
    const s = this.visitExpression(node);
    return node.kind === NodeKind.BinaryExpression || node.kind === NodeKind.UnaryExpression
      ? `(${s})`
      : s;
  }

  private visitIdentifier(node: IdentifierNode): string {
    return node.name;
  }

  private visitNumberLiteral(node: NumberLiteralNode): string {
    return String(node.value);
  }

  /** Aspas e escapes compatíveis com JavaScript. */
  private visitStringLiteral(node: StringLiteralNode): string {
    return JSON.stringify(node.value);
  }

  private visitBooleanLiteral(node: BooleanLiteralNode): string {
    return node.value ? "true" : "false";
  }
}
