/**
 * optimizer.ts — Visitor de otimização sobre a AST (Sprint 5)
 *
 * Pipeline conceitual:
 *   ProgramNode original → [Optimizer.optimize] → ProgramNode otimizado
 *
 * Otimizações (nesta ordem interna por expressão/statement):
 *   1. Constant folding — só quando **todos** os operandos já são literais
 *      (ex.: `2 + 3` → `5`; **não** folda `x + 3`).
 *   2. Dead code elimination — `if (false) { ... }` removido;
 *      `if (false) { A } else { B }` → só `B`; `while (false) { ... }` removido.
 *   3. Constant propagation — substitui identificador por cópia literal quando
 *      `let x = <literal>` no mesmo fluxo de escopo e sem reatribuição a `x`.
 *
 * ── Exemplo comentado (AST antes / depois / JS) ────────────────────────────
 *
 * Antes (equivalente a `let x = 2 + 3 * 4;`):
 *   VariableDeclaration { name: "x", initializer:
 *     BinaryExpression { op: "+", left: 2,
 *       right: BinaryExpression { op: "*", left: 3, right: 4 } } }
 *
 * Depois (fold numérico):
 *   VariableDeclaration { name: "x", initializer: NumberLiteral { value: 14 } }
 *
 * JS gerado (CodeGenerator):
 *   const x = 14;
 *
 *   4. Loop unrolling — `while (x < N) { print(x); x = x + 1; }` com x inicial literal.
 *
 * TODO: register allocation
 * TODO: bytecode backend
 */

import {
  ASTNode,
  ProgramNode,
  StatementNode,
  ExpressionNode,
  NodeKind,
  BinaryExpressionNode,
  UnaryExpressionNode,
  NumberLiteralNode,
  StringLiteralNode,
  BooleanLiteralNode,
  BlockStatementNode,
  AssignmentNode,
  PrintStatementNode,
  IfStatementNode,
  WhileStatementNode,
} from "../parser/ast";
import {
  OptimizationContext,
  isPropagatableLiteral,
} from "./optimizationContext";

export class Optimizer {
  /**
   * Ponto de entrada: retorna **nova** AST (não muta a entrada).
   *
   * Passo final: remove `let x = <literal>` quando **nenhum** `Identifier(x)`
   * aparece na árvore após propagação (caso `let x = 5; print(x);` → só `print(5);`).
   *
   * TODO: remoção escopo-a-escopo com sombreamento — evitar manter `let` morto
   *       quando um `x` interior sombreia o exterior.
   */
  optimize(program: ProgramNode): ProgramNode {
    const ctx = new OptimizationContext();
    let statements = this.optimizeStatements(program.statements, ctx);
    statements = this.unrollBoundedLoops(statements);
    statements = this.eliminateDeadCode(statements);
    statements = this.stripUnusedPropagatedLiteralDeclarations(statements);
    return {
      kind:       NodeKind.Program,
      statements,
      loc:        program.loc,
    };
  }

  /**
   * Visitor genérico — útil para ferramentas e testes; delega por `kind`.
   */
  visit(node: ASTNode): ASTNode {
    switch (node.kind) {
      case NodeKind.Program:
        return this.optimize(node);
      case NodeKind.BlockStatement:
        return this.optimizeBlockNode(node, new OptimizationContext());
      default:
        if (this.isStatement(node)) {
          const ctx = new OptimizationContext();
          const list = this.optimizeStatement(node, ctx);
          return list[0] ?? node;
        }
        return this.optimizeExpression(node as ExpressionNode, new OptimizationContext());
    }
  }

  // ── Statements ────────────────────────────────────────────────────────────

  private optimizeStatements(
    statements: StatementNode[],
    ctx: OptimizationContext
  ): StatementNode[] {
    const out: StatementNode[] = [];
    for (const stmt of statements) {
      out.push(...this.optimizeStatement(stmt, ctx));
    }
    return out;
  }

  /** Remove declarações de literal que não têm mais nenhuma leitura pelo nome. */
  private stripUnusedPropagatedLiteralDeclarations(
    statements: StatementNode[]
  ): StatementNode[] {
    const readIds = new Set<string>();
    this.collectReadIdentifiersFromStatements(statements, readIds);
    return this.filterUnusedLiteralDeclarations(statements, readIds);
  }

  private collectReadIdentifiersFromStatements(
    statements: StatementNode[],
    out: Set<string>
  ): void {
    for (const stmt of statements) {
      this.collectReadIdentifiersFromStatement(stmt, out);
    }
  }

  private collectReadIdentifiersFromStatement(
    stmt: StatementNode,
    out: Set<string>
  ): void {
    switch (stmt.kind) {
      case NodeKind.VariableDeclaration:
        this.collectReadIdentifiersFromExpression(stmt.initializer, out);
        break;
      case NodeKind.Assignment:
        this.collectReadIdentifiersFromExpression(stmt.value, out);
        break;
      case NodeKind.PrintStatement:
        this.collectReadIdentifiersFromExpression(stmt.argument, out);
        break;
      case NodeKind.BlockStatement:
        this.collectReadIdentifiersFromStatements(stmt.statements, out);
        break;
      case NodeKind.IfStatement:
        this.collectReadIdentifiersFromExpression(stmt.condition, out);
        this.collectReadIdentifiersFromStatements(stmt.consequent.statements, out);
        if (stmt.alternate) {
          this.collectReadIdentifiersFromStatements(stmt.alternate.statements, out);
        }
        break;
      case NodeKind.WhileStatement:
        this.collectReadIdentifiersFromExpression(stmt.condition, out);
        this.collectReadIdentifiersFromStatements(stmt.body.statements, out);
        break;
      default: {
        const _n: never = stmt;
        void _n;
      }
    }
  }

  private collectReadIdentifiersFromExpression(
    expr: ExpressionNode,
    out: Set<string>
  ): void {
    switch (expr.kind) {
      case NodeKind.Identifier:
        out.add(expr.name);
        break;
      case NodeKind.BinaryExpression:
        this.collectReadIdentifiersFromExpression(expr.left, out);
        this.collectReadIdentifiersFromExpression(expr.right, out);
        break;
      case NodeKind.UnaryExpression:
        this.collectReadIdentifiersFromExpression(expr.operand, out);
        break;
      default:
        break;
    }
  }

  private filterUnusedLiteralDeclarations(
    statements: StatementNode[],
    readIds: Set<string>
  ): StatementNode[] {
    const result: StatementNode[] = [];
    for (const stmt of statements) {
      if (stmt.kind === NodeKind.VariableDeclaration) {
        if (
          isPropagatableLiteral(stmt.initializer) &&
          !readIds.has(stmt.name)
        ) {
          continue;
        }
        result.push(stmt);
        continue;
      }
      if (stmt.kind === NodeKind.BlockStatement) {
        result.push({
          ...stmt,
          statements: this.filterUnusedLiteralDeclarations(
            stmt.statements,
            readIds
          ),
        });
        continue;
      }
      if (stmt.kind === NodeKind.IfStatement) {
        result.push({
          ...stmt,
          consequent: {
            ...stmt.consequent,
            statements: this.filterUnusedLiteralDeclarations(
              stmt.consequent.statements,
              readIds
            ),
          },
          alternate: stmt.alternate
            ? {
                ...stmt.alternate,
                statements: this.filterUnusedLiteralDeclarations(
                  stmt.alternate.statements,
                  readIds
                ),
              }
            : undefined,
        });
        continue;
      }
      if (stmt.kind === NodeKind.WhileStatement) {
        result.push({
          ...stmt,
          body: {
            ...stmt.body,
            statements: this.filterUnusedLiteralDeclarations(
              stmt.body.statements,
              readIds
            ),
          },
        });
        continue;
      }
      result.push(stmt);
    }
    return result;
  }

  /**
   * Desenrola `while (x < N) { print(x); x = x + 1; }` quando o valor inicial
   * de `x` é conhecido em compile-time → sequência de `print(20)`, `print(21)`, …
   */
  private unrollBoundedLoops(statements: StatementNode[]): StatementNode[] {
    const env = new Map<string, number>();
    const out: StatementNode[] = [];

    for (const stmt of statements) {
      if (
        stmt.kind === NodeKind.VariableDeclaration &&
        this.isNumberLiteral(stmt.initializer)
      ) {
        env.set(stmt.name, stmt.initializer.value);
        out.push(stmt);
        continue;
      }

      if (stmt.kind === NodeKind.WhileStatement) {
        const unrolled = this.tryUnrollWhile(stmt, env);
        if (unrolled !== null) {
          out.push(...unrolled);
          continue;
        }
      }

      out.push(stmt);
    }

    return out;
  }

  private tryUnrollWhile(
    node: WhileStatementNode,
    env: Map<string, number>
  ): PrintStatementNode[] | null {
    const bound = this.parseNumericUpperBound(node.condition);
    if (!bound) return null;

    const { varName, limit, op } = bound;
    let val = env.get(varName);
    if (val === undefined) return null;
    if (!this.isUnrollableCountingBody(node.body, varName)) return null;

    const prints: PrintStatementNode[] = [];
    const loc = node.loc;
    const MAX = 100_000;
    let steps = 0;

    while (this.compareNumeric(val, op, limit)) {
      if (steps++ > MAX) return null;
      prints.push({
        kind:     NodeKind.PrintStatement,
        argument: { kind: NodeKind.NumberLiteral, value: val, loc },
        loc,
      });
      val += 1;
    }

    env.set(varName, val);
    return prints;
  }

  private parseNumericUpperBound(
    cond: ExpressionNode
  ): { varName: string; limit: number; op: "<" | "<=" } | null {
    if (cond.kind !== NodeKind.BinaryExpression) return null;
    const { operator, left, right } = cond;

    if (operator === "<") {
      if (left.kind === NodeKind.Identifier && this.isNumberLiteral(right)) {
        return { varName: left.name, limit: right.value, op: "<" };
      }
      if (right.kind === NodeKind.Identifier && this.isNumberLiteral(left)) {
        return { varName: right.name, limit: left.value, op: "<" };
      }
    }

    if (operator === "<=") {
      if (left.kind === NodeKind.Identifier && this.isNumberLiteral(right)) {
        return { varName: left.name, limit: right.value, op: "<=" };
      }
      if (right.kind === NodeKind.Identifier && this.isNumberLiteral(left)) {
        return { varName: right.name, limit: left.value, op: "<=" };
      }
    }

    if (operator === ">") {
      if (left.kind === NodeKind.NumberLiteral && right.kind === NodeKind.Identifier) {
        return { varName: right.name, limit: left.value, op: "<" };
      }
    }

    if (operator === ">=") {
      if (left.kind === NodeKind.NumberLiteral && right.kind === NodeKind.Identifier) {
        return { varName: right.name, limit: left.value, op: "<=" };
      }
    }

    return null;
  }

  private compareNumeric(val: number, op: "<" | "<=", limit: number): boolean {
    return op === "<" ? val < limit : val <= limit;
  }

  private isUnrollableCountingBody(
    body: BlockStatementNode,
    varName: string
  ): boolean {
    const stmts = body.statements;
    if (stmts.length !== 2) return false;

    const [a, b] = stmts;
    const printStmt =
      a.kind === NodeKind.PrintStatement ? a :
      b.kind === NodeKind.PrintStatement ? b : null;
    const assignStmt =
      a.kind === NodeKind.Assignment ? a :
      b.kind === NodeKind.Assignment ? b : null;

    if (!printStmt || !assignStmt) return false;
    if (!this.printsVariable(printStmt, varName)) return false;
    return this.isIncrementByOne(assignStmt, varName);
  }

  private printsVariable(node: PrintStatementNode, varName: string): boolean {
    return (
      node.argument.kind === NodeKind.Identifier &&
      node.argument.name === varName
    );
  }

  private isIncrementByOne(
    node: AssignmentNode,
    varName?: string
  ): boolean {
    if (varName !== undefined && node.name !== varName) return false;
    if (node.value.kind !== NodeKind.BinaryExpression) return false;
    if (node.value.operator !== "+") return false;

    const { left, right } = node.value;
    const name = varName ?? node.name;

    return (
      (left.kind === NodeKind.Identifier &&
        left.name === name &&
        right.kind === NodeKind.NumberLiteral &&
        right.value === 1) ||
      (right.kind === NodeKind.Identifier &&
        right.name === name &&
        left.kind === NodeKind.NumberLiteral &&
        left.value === 1)
    );
  }

  /**
   * Remove loops e atribuições que não alteram a saída do programa.
   * Ex.: `while (x < 5) { x = x + 1; }` sem `print` no corpo e sem leitura
   * de `x` depois do loop.
   */
  private eliminateDeadCode(statements: StatementNode[]): StatementNode[] {
    const processed = statements.map((stmt) => this.eliminateDeadCodeInStatement(stmt));
    const result: StatementNode[] = [];

    for (let i = 0; i < processed.length; i++) {
      const stmt = processed[i]!;
      const following = processed.slice(i + 1);

      if (stmt.kind === NodeKind.WhileStatement && this.isDeadWhile(stmt, following)) {
        continue;
      }

      result.push(stmt);
    }

    return result;
  }

  private eliminateDeadCodeInStatement(stmt: StatementNode): StatementNode {
    switch (stmt.kind) {
      case NodeKind.BlockStatement:
        return {
          ...stmt,
          statements: this.eliminateDeadCode(stmt.statements),
        };
      case NodeKind.IfStatement:
        return {
          ...stmt,
          consequent: {
            ...stmt.consequent,
            statements: this.eliminateDeadCode(stmt.consequent.statements),
          },
          alternate: stmt.alternate
            ? {
                ...stmt.alternate,
                statements: this.eliminateDeadCode(stmt.alternate.statements),
              }
            : undefined,
        };
      case NodeKind.WhileStatement:
        return {
          ...stmt,
          body: {
            ...stmt.body,
            statements: this.eliminateDeadCode(stmt.body.statements),
          },
        };
      default:
        return stmt;
    }
  }

  private isDeadWhile(node: WhileStatementNode, following: StatementNode[]): boolean {
    if (this.blockHasPrint(node.body)) return false;

    const assigned = new Set<string>();
    this.collectAssignedVariableNames(node.body, assigned);

    for (const name of assigned) {
      if (this.isVarReadInStatements(name, following)) return false;
    }

    return true;
  }

  private blockHasPrint(block: BlockStatementNode): boolean {
    for (const stmt of block.statements) {
      if (this.statementHasPrint(stmt)) return true;
    }
    return false;
  }

  private statementHasPrint(stmt: StatementNode): boolean {
    switch (stmt.kind) {
      case NodeKind.PrintStatement:
        return true;
      case NodeKind.BlockStatement:
        return this.blockHasPrint(stmt);
      case NodeKind.IfStatement:
        return (
          this.blockHasPrint(stmt.consequent) ||
          (stmt.alternate !== undefined && this.blockHasPrint(stmt.alternate))
        );
      case NodeKind.WhileStatement:
        return this.blockHasPrint(stmt.body);
      default:
        return false;
    }
  }

  private isVarReadInStatements(name: string, statements: StatementNode[]): boolean {
    for (const stmt of statements) {
      if (this.statementReadsVar(stmt, name)) return true;
    }
    return false;
  }

  private statementReadsVar(stmt: StatementNode, name: string): boolean {
    switch (stmt.kind) {
      case NodeKind.VariableDeclaration:
        return this.expressionReadsVar(stmt.initializer, name);
      case NodeKind.Assignment:
        return stmt.name === name || this.expressionReadsVar(stmt.value, name);
      case NodeKind.PrintStatement:
        return this.expressionReadsVar(stmt.argument, name);
      case NodeKind.BlockStatement:
        return stmt.statements.some((s) => this.statementReadsVar(s, name));
      case NodeKind.IfStatement:
        return (
          this.expressionReadsVar(stmt.condition, name) ||
          stmt.consequent.statements.some((s) => this.statementReadsVar(s, name)) ||
          (stmt.alternate?.statements.some((s) => this.statementReadsVar(s, name)) ?? false)
        );
      case NodeKind.WhileStatement:
        return (
          this.expressionReadsVar(stmt.condition, name) ||
          stmt.body.statements.some((s) => this.statementReadsVar(s, name))
        );
      default:
        return false;
    }
  }

  private expressionReadsVar(expr: ExpressionNode, name: string): boolean {
    switch (expr.kind) {
      case NodeKind.Identifier:
        return expr.name === name;
      case NodeKind.BinaryExpression:
        return (
          this.expressionReadsVar(expr.left, name) ||
          this.expressionReadsVar(expr.right, name)
        );
      case NodeKind.UnaryExpression:
        return this.expressionReadsVar(expr.operand, name);
      default:
        return false;
    }
  }

  private optimizeStatement(
    stmt: StatementNode,
    ctx: OptimizationContext
  ): StatementNode[] {
    switch (stmt.kind) {
      case NodeKind.VariableDeclaration: {
        const init = this.optimizeExpression(stmt.initializer, ctx);
        const next: typeof stmt = { ...stmt, initializer: init };
        ctx.defineConst(stmt.name, init);
        return [next];
      }
      case NodeKind.Assignment: {
        ctx.invalidate(stmt.name);
        const value = this.optimizeExpression(stmt.value, ctx);
        return [{ ...stmt, value }];
      }
      case NodeKind.PrintStatement:
        return [
          {
            ...stmt,
            argument: this.optimizeExpression(stmt.argument, ctx),
          },
        ];
      case NodeKind.BlockStatement:
        return [this.optimizeBlockNode(stmt, ctx)];
      case NodeKind.IfStatement:
        return this.optimizeIfStatement(stmt, ctx);
      case NodeKind.WhileStatement:
        return this.optimizeWhileStatement(stmt, ctx);
      default: {
        const _n: never = stmt;
        void _n;
        return [];
      }
    }
  }

  private optimizeIfStatement(
    node: IfStatementNode,
    ctx: OptimizationContext
  ): StatementNode[] {
    // Variáveis escritas em qualquer ramo podem tornar condição dependente —
    // não propagar literal para lá (invalida lookups antes da condição).
    const assigned = new Set<string>();
    this.collectAssignedVariableNames(node.consequent, assigned);
    if (node.alternate) {
      this.collectAssignedVariableNames(node.alternate, assigned);
    }
    for (const name of assigned) ctx.invalidate(name);

    const condition = this.optimizeExpression(node.condition, ctx);

    if (this.isBooleanLiteralWithValue(condition, false)) {
      if (node.alternate) {
        return [this.optimizeBlockNode(node.alternate, ctx)];
      }
      return [];
    }

    if (this.isBooleanLiteralWithValue(condition, true)) {
      return [this.optimizeBlockNode(node.consequent, ctx)];
    }

    const consequent = this.optimizeBlockNode(node.consequent, ctx);
    const alternate = node.alternate
      ? this.optimizeBlockNode(node.alternate, ctx)
      : undefined;

    return [
      {
        ...node,
        condition,
        consequent,
        alternate,
      },
    ];
  }

  private optimizeWhileStatement(
    node: WhileStatementNode,
    ctx: OptimizationContext
  ): StatementNode[] {
    const assigned = new Set<string>();
    this.collectAssignedVariableNames(node.body, assigned);
    for (const name of assigned) ctx.invalidate(name);

    const condition = this.optimizeExpression(node.condition, ctx);
    if (this.isBooleanLiteralWithValue(condition, false)) {
      return [];
    }
    return [
      {
        ...node,
        condition,
        body: this.optimizeBlockNode(node.body, ctx),
      },
    ];
  }

  private optimizeBlockNode(
    block: BlockStatementNode,
    ctx: OptimizationContext
  ): BlockStatementNode {
    ctx.enterScope();
    const statements = this.optimizeStatements(block.statements, ctx);
    ctx.exitScope();
    return {
      kind:       NodeKind.BlockStatement,
      statements,
      loc:        block.loc,
    };
  }

  // ── Coleta de variáveis atribuídas dentro de um bloco ────────────────────
  // Necessário para invalidar a propagação de constantes antes de entrar em
  // ramos (if/while) onde o valor pode ser sobrescrito.

  private collectAssignedVariableNames(
    block: BlockStatementNode,
    out: Set<string>
  ): void {
    for (const stmt of block.statements) {
      this.collectAssignedNamesFromStatement(stmt, out);
    }
  }

  private collectAssignedNamesFromStatement(
    stmt: StatementNode,
    out: Set<string>
  ): void {
    switch (stmt.kind) {
      case NodeKind.Assignment:
        out.add(stmt.name);
        break;
      case NodeKind.BlockStatement:
        this.collectAssignedVariableNames(stmt, out);
        break;
      case NodeKind.IfStatement:
        this.collectAssignedVariableNames(stmt.consequent, out);
        if (stmt.alternate) this.collectAssignedVariableNames(stmt.alternate, out);
        break;
      case NodeKind.WhileStatement:
        this.collectAssignedVariableNames(stmt.body, out);
        break;
      default:
        break;
    }
  }

  // ── Expressões: fold + propagação de identificadores ──────────────────────

  private optimizeExpression(
    expr: ExpressionNode,
    ctx: OptimizationContext
  ): ExpressionNode {
    let node: ExpressionNode = expr;

    switch (node.kind) {
      case NodeKind.Identifier: {
        const rep = ctx.resolveIdentifier(node.name);
        if (rep) return rep;
        return node;
      }
      case NodeKind.BinaryExpression: {
        const left  = this.optimizeExpression(node.left, ctx);
        const right = this.optimizeExpression(node.right, ctx);
        const bin: BinaryExpressionNode = { ...node, left, right };
        return this.tryFoldBinary(bin) ?? bin;
      }
      case NodeKind.UnaryExpression: {
        const operand = this.optimizeExpression(node.operand, ctx);
        const un: UnaryExpressionNode = { ...node, operand };
        return this.tryFoldUnary(un) ?? un;
      }
      default:
        return node;
    }
  }

  /** Dobramento de constantes: ambos os lados devem ser literais compatíveis. */
  private tryFoldBinary(node: BinaryExpressionNode): ExpressionNode | null {
    const { operator, left, right, loc } = node;

    if (operator === "+" && this.isStringLiteral(left) && this.isStringLiteral(right)) {
      return {
        kind:  NodeKind.StringLiteral,
        value: left.value + right.value,
        loc,
      };
    }

    if (this.isNumberLiteral(left) && this.isNumberLiteral(right)) {
      const a = left.value;
      const b = right.value;
      switch (operator) {
        case "+":
          return { kind: NodeKind.NumberLiteral, value: a + b, loc };
        case "-":
          return { kind: NodeKind.NumberLiteral, value: a - b, loc };
        case "*":
          return { kind: NodeKind.NumberLiteral, value: a * b, loc };
        case "/":
          if (b === 0) return null;
          return { kind: NodeKind.NumberLiteral, value: a / b, loc };
        case ">":
          return { kind: NodeKind.BooleanLiteral, value: a > b, loc };
        case ">=":
          return { kind: NodeKind.BooleanLiteral, value: a >= b, loc };
        case "<":
          return { kind: NodeKind.BooleanLiteral, value: a < b, loc };
        case "<=":
          return { kind: NodeKind.BooleanLiteral, value: a <= b, loc };
        case "==":
          return { kind: NodeKind.BooleanLiteral, value: a === b, loc };
        case "!=":
          return { kind: NodeKind.BooleanLiteral, value: a !== b, loc };
        default:
          break;
      }
    }

    if (this.isStringLiteral(left) && this.isStringLiteral(right)) {
      const s1 = left.value;
      const s2 = right.value;
      switch (operator) {
        case ">":
          return { kind: NodeKind.BooleanLiteral, value: s1 > s2, loc };
        case ">=":
          return { kind: NodeKind.BooleanLiteral, value: s1 >= s2, loc };
        case "<":
          return { kind: NodeKind.BooleanLiteral, value: s1 < s2, loc };
        case "<=":
          return { kind: NodeKind.BooleanLiteral, value: s1 <= s2, loc };
        case "==":
          return { kind: NodeKind.BooleanLiteral, value: s1 === s2, loc };
        case "!=":
          return { kind: NodeKind.BooleanLiteral, value: s1 !== s2, loc };
        default:
          break;
      }
    }

    if (this.isBooleanLiteral(left) && this.isBooleanLiteral(right)) {
      const p = left.value;
      const q = right.value;
      switch (operator) {
        case "&&":
          return { kind: NodeKind.BooleanLiteral, value: p && q, loc };
        case "||":
          return { kind: NodeKind.BooleanLiteral, value: p || q, loc };
        case "==":
          return { kind: NodeKind.BooleanLiteral, value: p === q, loc };
        case "!=":
          return { kind: NodeKind.BooleanLiteral, value: p !== q, loc };
        default:
          break;
      }
    }

    return null;
  }

  private tryFoldUnary(node: UnaryExpressionNode): ExpressionNode | null {
    const { operator, operand, loc } = node;
    if (operator === "!" && this.isBooleanLiteral(operand)) {
      return {
        kind:  NodeKind.BooleanLiteral,
        value: !operand.value,
        loc,
      };
    }
    if (operator === "-" && this.isNumberLiteral(operand)) {
      return {
        kind:  NodeKind.NumberLiteral,
        value: -operand.value,
        loc,
      };
    }
    return null;
  }

  // ── Predicados ───────────────────────────────────────────────────────────

  private isStatement(n: ASTNode): n is StatementNode {
    return (
      n.kind !== NodeKind.Program &&
      n.kind !== NodeKind.BinaryExpression &&
      n.kind !== NodeKind.UnaryExpression &&
      n.kind !== NodeKind.Identifier &&
      n.kind !== NodeKind.NumberLiteral &&
      n.kind !== NodeKind.StringLiteral &&
      n.kind !== NodeKind.BooleanLiteral
    );
  }

  private isNumberLiteral(n: ExpressionNode): n is NumberLiteralNode {
    return n.kind === NodeKind.NumberLiteral;
  }

  private isStringLiteral(n: ExpressionNode): n is StringLiteralNode {
    return n.kind === NodeKind.StringLiteral;
  }

  private isBooleanLiteral(n: ExpressionNode): n is BooleanLiteralNode {
    return n.kind === NodeKind.BooleanLiteral;
  }

  private isBooleanLiteralWithValue(
    n: ExpressionNode,
    value: boolean
  ): n is BooleanLiteralNode {
    return n.kind === NodeKind.BooleanLiteral && n.value === value;
  }
}

// Re-export utilitários usados por testes ou ferramentas
export { isPropagatableLiteral, cloneLiteralExpression } from "./optimizationContext";
