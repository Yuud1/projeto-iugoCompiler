/**
 * analyzer.ts — Análise semântica (Sprint 4) do compilador iuGo
 *
 * Percorre a AST com Visitor Pattern (switch por `kind` — na AST iuGo o
 * discriminador é `kind`, equivalente ao conceito de "type" do nó).
 *
 * Regras implementadas:
 *   - variável declarada antes do uso (lookup em expressões)
 *   - redeclaração no mesmo escopo (define + existsInCurrentScope)
 *   - escopos aninhados: cada bloco `{ }` cria SymbolTable(parent)
 *   - inferência de tipo em `let nome = expr`
 *   - compatibilidade de tipos em operadores binários/unários
 *   - condições de `if` e `while` devem ser BOOLEAN
 *
 * ── Exemplo: programa válido ─────────────────────────────────────────────
 *
 *   let idade = 20;
 *   if (idade >= 18) {
 *     let nome = "Maior";
 *     print(nome);
 *   }
 *   print(idade);
 *
 *   → Sem erros. `nome` só existe dentro do bloco; `idade` no escopo global.
 *
 * ── Exemplo: programa inválido (variável não declarada) ─────────────────
 *
 *   print(nome);
 *
 *   → SemanticError: Variável 'nome' não declarada
 *     Linha 1, Coluna 7
 *
 * ── Exemplo: programa inválido (redeclaração) ───────────────────────────
 *
 *   let idade = 20;
 *   let idade = 30;
 *
 *   → SemanticError: Variável 'idade' já declarada neste escopo
 *     Linha 2, Coluna 5
 *
 * ── Exemplo: programa inválido (condição não booleana) ─────────────────
 *
 *   if (10) { }
 *
 *   → SemanticError: Condição do 'if' deve ser do tipo BOOLEAN
 *
 * TODO: function scope support — Sprint 6
 * TODO: array type checking — future version
 */

import {
  ASTNode,
  ProgramNode,
  ExpressionNode,
  NodeKind,
  SourceLocation,
  BinaryExpressionNode,
  UnaryExpressionNode,
  VariableDeclarationNode,
  AssignmentNode,
  PrintStatementNode,
  IfStatementNode,
  WhileStatementNode,
  BlockStatementNode,
  IdentifierNode,
} from "../parser/ast";
import { SymbolTable, SymbolEntry } from "./symbolTable";
import { SemanticError } from "./semanticError";
import { ValueType } from "./types";

export class SemanticAnalyzer {
  private readonly globalScope: SymbolTable;
  private currentScope: SymbolTable;

  constructor() {
    this.globalScope  = new SymbolTable(null);
    this.currentScope = this.globalScope;
  }

  /**
   * Ponto de entrada: valida o programa inteiro ou lança SemanticError.
   */
  analyze(program: ProgramNode): void {
    this.currentScope = this.globalScope;
    this.visit(program);
  }

  /**
   * Retorna todos os símbolos coletados em todos os escopos durante a análise,
   * como um mapa name → type. Usado pela IDE para hover de tipo.
   */
  getAllSymbols(): Record<string, string> {
    const result: Record<string, string> = {};
    const collectScope = (scope: SymbolTable): void => {
      for (const entry of scope.entries()) {
        if (!(entry.name in result)) result[entry.name] = entry.type;
      }
    };
    collectScope(this.globalScope);
    return result;
  }

  /**
   * Visitor principal: despacha pelo tipo de nó (`kind`).
   */
  visit(node: ASTNode): void {
    switch (node.kind) {
      case NodeKind.Program:
        this.visitProgram(node);
        break;
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

      // Expressões puras não aparecem como nós raiz de visit a partir do
      // programa, mas podem ser visitadas no futuro por ferramentas.
      case NodeKind.BinaryExpression:
      case NodeKind.UnaryExpression:
      case NodeKind.Identifier:
      case NodeKind.NumberLiteral:
      case NodeKind.StringLiteral:
      case NodeKind.BooleanLiteral:
        this.inferExpressionType(node as ExpressionNode);
        break;

      default: {
        const _exhaustive: never = node;
        void _exhaustive;
      }
    }
  }

  /** Infere o tipo de uma expressão e, como efeito colateral, valida a subárvore. */
  inferExpressionType(expression: ExpressionNode): ValueType {
    switch (expression.kind) {
      case NodeKind.NumberLiteral:
        return ValueType.NUMBER;

      case NodeKind.StringLiteral:
        return ValueType.STRING;

      case NodeKind.BooleanLiteral:
        return ValueType.BOOLEAN;

      case NodeKind.Identifier:
        return this.inferIdentifierType(expression);

      case NodeKind.UnaryExpression:
        return this.inferUnaryType(expression);

      case NodeKind.BinaryExpression:
        return this.inferBinaryType(expression);

      default: {
        const _never: never = expression;
        void _never;
        return ValueType.UNKNOWN;
      }
    }
  }

  // ── Programa e statements ───────────────────────────────────────────────

  private visitProgram(node: ProgramNode): void {
    for (const stmt of node.statements) {
      this.visit(stmt as ASTNode);
    }
  }

  private visitVariableDeclaration(node: VariableDeclarationNode): void {
    const initType = this.inferExpressionType(node.initializer);
    const { line, column } = this.locOf(node);
    this.currentScope.define(node.name, initType, line, column);
  }

  private visitAssignment(node: AssignmentNode): void {
    const { line, column } = this.locOf(node);
    const entry = this.lookupOrThrow(node.name, line, column);
    const rhsType = this.inferExpressionType(node.value);
    this.assertCompatible(entry.type, rhsType, line, column, "atribuição");
  }

  private visitPrintStatement(node: PrintStatementNode): void {
    // print aceita qualquer tipo bem formado; a inferência valida a expressão
    this.inferExpressionType(node.argument);
  }

  private visitIfStatement(node: IfStatementNode): void {
    this.assertBooleanCondition(
      node.condition,
      "if",
      this.locOf(node.condition)
    );
    this.visit(node.consequent as ASTNode);
    if (node.alternate) {
      this.visit(node.alternate as ASTNode);
    }
  }

  private visitWhileStatement(node: WhileStatementNode): void {
    this.assertBooleanCondition(
      node.condition,
      "while",
      this.locOf(node.condition)
    );
    this.visit(node.body as ASTNode);
  }

  /**
   * Bloco: novo escopo filho do atual; ao sair, restaura o escopo anterior.
   * Garante que `let` dentro de `{ }` não vaze para fora.
   */
  private visitBlockStatement(node: BlockStatementNode): void {
    const parent = this.currentScope;
    this.currentScope = new SymbolTable(parent);
    for (const stmt of node.statements) {
      this.visit(stmt as ASTNode);
    }
    this.currentScope = parent;
  }

  // ── Expressões ──────────────────────────────────────────────────────────

  private inferIdentifierType(node: IdentifierNode): ValueType {
    const { line, column } = this.locOf(node);
    const entry = this.lookupOrThrow(node.name, line, column);
    return entry.type;
  }

  private inferUnaryType(node: UnaryExpressionNode): ValueType {
    const inner = this.inferExpressionType(node.operand);
    const loc     = this.locOf(node);

    if (node.operator === "!") {
      if (inner !== ValueType.UNKNOWN && inner !== ValueType.BOOLEAN) {
        throw new SemanticError(
          `Operador '!' exige operando do tipo BOOLEAN (encontrado ${inner})`,
          loc.line,
          loc.column
        );
      }
      return ValueType.BOOLEAN;
    }

    // '-'
    if (inner !== ValueType.UNKNOWN && inner !== ValueType.NUMBER) {
      throw new SemanticError(
        `Operador '-' unário exige operando numérico (encontrado ${inner})`,
        loc.line,
        loc.column
      );
    }
    return ValueType.NUMBER;
  }

  private inferBinaryType(node: BinaryExpressionNode): ValueType {
    const leftT  = this.inferExpressionType(node.left);
    const rightT = this.inferExpressionType(node.right);
    const loc      = this.locOf(node);
    const op       = node.operator;

    // --- Lógicos ---
    if (op === "&&" || op === "||") {
      this.expectType(leftT, ValueType.BOOLEAN, loc, `operador '${op}' (lado esquerdo)`);
      this.expectType(rightT, ValueType.BOOLEAN, loc, `operador '${op}' (lado direito)`);
      return ValueType.BOOLEAN;
    }

    // --- Igualdade ---
    if (op === "==" || op === "!=") {
      this.assertSameComparableTypes(leftT, rightT, op, loc);
      return ValueType.BOOLEAN;
    }

    // --- Comparação ordenada ---
    if (op === ">" || op === ">=" || op === "<" || op === "<=") {
      this.assertOrderedComparison(leftT, rightT, op, loc);
      return ValueType.BOOLEAN;
    }

    // --- Aritmético + (número ou concatenação de strings) ---
    if (op === "+") {
      if (this.isNumericPair(leftT, rightT)) return ValueType.NUMBER;
      if (this.isStringPair(leftT, rightT)) return ValueType.STRING;
      throw new SemanticError(
        `Operador '+' exige dois números ou duas strings (encontrado ${leftT} e ${rightT})`,
        loc.line,
        loc.column
      );
    }

    // --- Aritmético - * / ---
    if (op === "-" || op === "*" || op === "/") {
      this.expectType(leftT, ValueType.NUMBER, loc, `operador '${op}'`);
      this.expectType(rightT, ValueType.NUMBER, loc, `operador '${op}'`);
      return ValueType.NUMBER;
    }

    return ValueType.UNKNOWN;
  }

  // ── Condições if / while ────────────────────────────────────────────────

  private assertBooleanCondition(
    expr: ExpressionNode,
    construct: "if" | "while",
    loc: SourceLocation
  ): void {
    const t = this.inferExpressionType(expr);
    if (t !== ValueType.BOOLEAN) {
      throw new SemanticError(
        `Condição do '${construct}' deve ser do tipo BOOLEAN (encontrado ${t})`,
        loc.line,
        loc.column
      );
    }
  }

  // ── Tabela de símbolos ──────────────────────────────────────────────────

  private lookupOrThrow(name: string, line: number, column: number): SymbolEntry {
    const entry = this.currentScope.lookup(name);
    if (!entry) {
      throw new SemanticError(`Variável '${name}' não declarada`, line, column);
    }
    return entry;
  }

  // ── Regras de tipo ──────────────────────────────────────────────────────

  private assertCompatible(
    target: ValueType,
    value: ValueType,
    line: number,
    column: number,
    context: string
  ): void {
    if (target === ValueType.UNKNOWN || value === ValueType.UNKNOWN) return;
    if (target !== value) {
      throw new SemanticError(
        `Tipos incompatíveis na ${context}: variável é ${target}, expressão é ${value}`,
        line,
        column
      );
    }
  }

  private expectType(
    actual: ValueType,
    expected: ValueType,
    loc: SourceLocation,
    context: string
  ): void {
    if (actual === ValueType.UNKNOWN) return;
    if (actual !== expected) {
      throw new SemanticError(
        `${context}: esperado ${expected}, encontrado ${actual}`,
        loc.line,
        loc.column
      );
    }
  }

  private assertSameComparableTypes(
    left: ValueType,
    right: ValueType,
    op: string,
    loc: SourceLocation
  ): void {
    if (left === ValueType.UNKNOWN || right === ValueType.UNKNOWN) return;
    if (left !== right) {
      throw new SemanticError(
        `Operador '${op}' exige operandos do mesmo tipo (encontrado ${left} e ${right})`,
        loc.line,
        loc.column
      );
    }
  }

  private assertOrderedComparison(
    left: ValueType,
    right: ValueType,
    op: string,
    loc: SourceLocation
  ): void {
    if (left === ValueType.UNKNOWN || right === ValueType.UNKNOWN) return;
    const okNumbers = this.isNumericPair(left, right);
    const okStrings = this.isStringPair(left, right);
    if (!okNumbers && !okStrings) {
      throw new SemanticError(
        `Operador '${op}' exige dois números ou duas strings (encontrado ${left} e ${right})`,
        loc.line,
        loc.column
      );
    }
  }

  private isNumericPair(a: ValueType, b: ValueType): boolean {
    return a === ValueType.NUMBER && b === ValueType.NUMBER;
  }

  private isStringPair(a: ValueType, b: ValueType): boolean {
    return a === ValueType.STRING && b === ValueType.STRING;
  }

  private locOf(node: { loc?: SourceLocation }): SourceLocation {
    return node.loc ?? { line: 1, column: 1 };
  }
}
