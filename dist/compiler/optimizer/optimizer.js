"use strict";
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
Object.defineProperty(exports, "__esModule", { value: true });
exports.cloneLiteralExpression = exports.isPropagatableLiteral = exports.Optimizer = void 0;
const ast_1 = require("../parser/ast");
const optimizationContext_1 = require("./optimizationContext");
class Optimizer {
    /**
     * Ponto de entrada: retorna **nova** AST (não muta a entrada).
     *
     * Passo final: remove `let x = <literal>` quando **nenhum** `Identifier(x)`
     * aparece na árvore após propagação (caso `let x = 5; print(x);` → só `print(5);`).
     *
     * TODO: remoção escopo-a-escopo com sombreamento — evitar manter `let` morto
     *       quando um `x` interior sombreia o exterior.
     */
    optimize(program) {
        const ctx = new optimizationContext_1.OptimizationContext();
        let statements = this.optimizeStatements(program.statements, ctx);
        statements = this.unrollBoundedLoops(statements);
        statements = this.eliminateDeadCode(statements);
        statements = this.stripUnusedPropagatedLiteralDeclarations(statements);
        return {
            kind: ast_1.NodeKind.Program,
            statements,
            loc: program.loc,
        };
    }
    /**
     * Visitor genérico — útil para ferramentas e testes; delega por `kind`.
     */
    visit(node) {
        switch (node.kind) {
            case ast_1.NodeKind.Program:
                return this.optimize(node);
            case ast_1.NodeKind.BlockStatement:
                return this.optimizeBlockNode(node, new optimizationContext_1.OptimizationContext());
            default:
                if (this.isStatement(node)) {
                    const ctx = new optimizationContext_1.OptimizationContext();
                    const list = this.optimizeStatement(node, ctx);
                    return list[0] ?? node;
                }
                return this.optimizeExpression(node, new optimizationContext_1.OptimizationContext());
        }
    }
    // ── Statements ────────────────────────────────────────────────────────────
    optimizeStatements(statements, ctx) {
        const out = [];
        for (const stmt of statements) {
            out.push(...this.optimizeStatement(stmt, ctx));
        }
        return out;
    }
    /** Remove declarações de literal que não têm mais nenhuma leitura pelo nome. */
    stripUnusedPropagatedLiteralDeclarations(statements) {
        const readIds = new Set();
        this.collectReadIdentifiersFromStatements(statements, readIds);
        return this.filterUnusedLiteralDeclarations(statements, readIds);
    }
    collectReadIdentifiersFromStatements(statements, out) {
        for (const stmt of statements) {
            this.collectReadIdentifiersFromStatement(stmt, out);
        }
    }
    collectReadIdentifiersFromStatement(stmt, out) {
        switch (stmt.kind) {
            case ast_1.NodeKind.VariableDeclaration:
                this.collectReadIdentifiersFromExpression(stmt.initializer, out);
                break;
            case ast_1.NodeKind.Assignment:
                this.collectReadIdentifiersFromExpression(stmt.value, out);
                break;
            case ast_1.NodeKind.PrintStatement:
                this.collectReadIdentifiersFromExpression(stmt.argument, out);
                break;
            case ast_1.NodeKind.BlockStatement:
                this.collectReadIdentifiersFromStatements(stmt.statements, out);
                break;
            case ast_1.NodeKind.IfStatement:
                this.collectReadIdentifiersFromExpression(stmt.condition, out);
                this.collectReadIdentifiersFromStatements(stmt.consequent.statements, out);
                if (stmt.alternate) {
                    this.collectReadIdentifiersFromStatements(stmt.alternate.statements, out);
                }
                break;
            case ast_1.NodeKind.WhileStatement:
                this.collectReadIdentifiersFromExpression(stmt.condition, out);
                this.collectReadIdentifiersFromStatements(stmt.body.statements, out);
                break;
            default: {
                const _n = stmt;
                void _n;
            }
        }
    }
    collectReadIdentifiersFromExpression(expr, out) {
        switch (expr.kind) {
            case ast_1.NodeKind.Identifier:
                out.add(expr.name);
                break;
            case ast_1.NodeKind.BinaryExpression:
                this.collectReadIdentifiersFromExpression(expr.left, out);
                this.collectReadIdentifiersFromExpression(expr.right, out);
                break;
            case ast_1.NodeKind.UnaryExpression:
                this.collectReadIdentifiersFromExpression(expr.operand, out);
                break;
            default:
                break;
        }
    }
    filterUnusedLiteralDeclarations(statements, readIds) {
        const result = [];
        for (const stmt of statements) {
            if (stmt.kind === ast_1.NodeKind.VariableDeclaration) {
                if ((0, optimizationContext_1.isPropagatableLiteral)(stmt.initializer) &&
                    !readIds.has(stmt.name)) {
                    continue;
                }
                result.push(stmt);
                continue;
            }
            if (stmt.kind === ast_1.NodeKind.BlockStatement) {
                result.push({
                    ...stmt,
                    statements: this.filterUnusedLiteralDeclarations(stmt.statements, readIds),
                });
                continue;
            }
            if (stmt.kind === ast_1.NodeKind.IfStatement) {
                result.push({
                    ...stmt,
                    consequent: {
                        ...stmt.consequent,
                        statements: this.filterUnusedLiteralDeclarations(stmt.consequent.statements, readIds),
                    },
                    alternate: stmt.alternate
                        ? {
                            ...stmt.alternate,
                            statements: this.filterUnusedLiteralDeclarations(stmt.alternate.statements, readIds),
                        }
                        : undefined,
                });
                continue;
            }
            if (stmt.kind === ast_1.NodeKind.WhileStatement) {
                result.push({
                    ...stmt,
                    body: {
                        ...stmt.body,
                        statements: this.filterUnusedLiteralDeclarations(stmt.body.statements, readIds),
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
    unrollBoundedLoops(statements) {
        const env = new Map();
        const out = [];
        for (const stmt of statements) {
            if (stmt.kind === ast_1.NodeKind.VariableDeclaration &&
                this.isNumberLiteral(stmt.initializer)) {
                env.set(stmt.name, stmt.initializer.value);
                out.push(stmt);
                continue;
            }
            if (stmt.kind === ast_1.NodeKind.WhileStatement) {
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
    tryUnrollWhile(node, env) {
        const bound = this.parseNumericUpperBound(node.condition);
        if (!bound)
            return null;
        const { varName, limit, op } = bound;
        let val = env.get(varName);
        if (val === undefined)
            return null;
        if (!this.isUnrollableCountingBody(node.body, varName))
            return null;
        const prints = [];
        const loc = node.loc;
        const MAX = 100000;
        let steps = 0;
        while (this.compareNumeric(val, op, limit)) {
            if (steps++ > MAX)
                return null;
            prints.push({
                kind: ast_1.NodeKind.PrintStatement,
                argument: { kind: ast_1.NodeKind.NumberLiteral, value: val, loc },
                loc,
            });
            val += 1;
        }
        env.set(varName, val);
        return prints;
    }
    parseNumericUpperBound(cond) {
        if (cond.kind !== ast_1.NodeKind.BinaryExpression)
            return null;
        const { operator, left, right } = cond;
        if (operator === "<") {
            if (left.kind === ast_1.NodeKind.Identifier && this.isNumberLiteral(right)) {
                return { varName: left.name, limit: right.value, op: "<" };
            }
            if (right.kind === ast_1.NodeKind.Identifier && this.isNumberLiteral(left)) {
                return { varName: right.name, limit: left.value, op: "<" };
            }
        }
        if (operator === "<=") {
            if (left.kind === ast_1.NodeKind.Identifier && this.isNumberLiteral(right)) {
                return { varName: left.name, limit: right.value, op: "<=" };
            }
            if (right.kind === ast_1.NodeKind.Identifier && this.isNumberLiteral(left)) {
                return { varName: right.name, limit: left.value, op: "<=" };
            }
        }
        if (operator === ">") {
            if (left.kind === ast_1.NodeKind.NumberLiteral && right.kind === ast_1.NodeKind.Identifier) {
                return { varName: right.name, limit: left.value, op: "<" };
            }
        }
        if (operator === ">=") {
            if (left.kind === ast_1.NodeKind.NumberLiteral && right.kind === ast_1.NodeKind.Identifier) {
                return { varName: right.name, limit: left.value, op: "<=" };
            }
        }
        return null;
    }
    compareNumeric(val, op, limit) {
        return op === "<" ? val < limit : val <= limit;
    }
    isUnrollableCountingBody(body, varName) {
        const stmts = body.statements;
        if (stmts.length !== 2)
            return false;
        const [a, b] = stmts;
        const printStmt = a.kind === ast_1.NodeKind.PrintStatement ? a :
            b.kind === ast_1.NodeKind.PrintStatement ? b : null;
        const assignStmt = a.kind === ast_1.NodeKind.Assignment ? a :
            b.kind === ast_1.NodeKind.Assignment ? b : null;
        if (!printStmt || !assignStmt)
            return false;
        if (!this.printsVariable(printStmt, varName))
            return false;
        return this.isIncrementByOne(assignStmt, varName);
    }
    printsVariable(node, varName) {
        return (node.argument.kind === ast_1.NodeKind.Identifier &&
            node.argument.name === varName);
    }
    isIncrementByOne(node, varName) {
        if (varName !== undefined && node.name !== varName)
            return false;
        if (node.value.kind !== ast_1.NodeKind.BinaryExpression)
            return false;
        if (node.value.operator !== "+")
            return false;
        const { left, right } = node.value;
        const name = varName ?? node.name;
        return ((left.kind === ast_1.NodeKind.Identifier &&
            left.name === name &&
            right.kind === ast_1.NodeKind.NumberLiteral &&
            right.value === 1) ||
            (right.kind === ast_1.NodeKind.Identifier &&
                right.name === name &&
                left.kind === ast_1.NodeKind.NumberLiteral &&
                left.value === 1));
    }
    /**
     * Remove loops e atribuições que não alteram a saída do programa.
     * Ex.: `while (x < 5) { x = x + 1; }` sem `print` no corpo e sem leitura
     * de `x` depois do loop.
     */
    eliminateDeadCode(statements) {
        const processed = statements.map((stmt) => this.eliminateDeadCodeInStatement(stmt));
        const result = [];
        for (let i = 0; i < processed.length; i++) {
            const stmt = processed[i];
            const following = processed.slice(i + 1);
            if (stmt.kind === ast_1.NodeKind.WhileStatement && this.isDeadWhile(stmt, following)) {
                continue;
            }
            result.push(stmt);
        }
        return result;
    }
    eliminateDeadCodeInStatement(stmt) {
        switch (stmt.kind) {
            case ast_1.NodeKind.BlockStatement:
                return {
                    ...stmt,
                    statements: this.eliminateDeadCode(stmt.statements),
                };
            case ast_1.NodeKind.IfStatement:
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
            case ast_1.NodeKind.WhileStatement:
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
    isDeadWhile(node, following) {
        if (this.blockHasPrint(node.body))
            return false;
        const assigned = new Set();
        this.collectAssignedVariableNames(node.body, assigned);
        for (const name of assigned) {
            if (this.isVarReadInStatements(name, following))
                return false;
        }
        return true;
    }
    blockHasPrint(block) {
        for (const stmt of block.statements) {
            if (this.statementHasPrint(stmt))
                return true;
        }
        return false;
    }
    statementHasPrint(stmt) {
        switch (stmt.kind) {
            case ast_1.NodeKind.PrintStatement:
                return true;
            case ast_1.NodeKind.BlockStatement:
                return this.blockHasPrint(stmt);
            case ast_1.NodeKind.IfStatement:
                return (this.blockHasPrint(stmt.consequent) ||
                    (stmt.alternate !== undefined && this.blockHasPrint(stmt.alternate)));
            case ast_1.NodeKind.WhileStatement:
                return this.blockHasPrint(stmt.body);
            default:
                return false;
        }
    }
    isVarReadInStatements(name, statements) {
        for (const stmt of statements) {
            if (this.statementReadsVar(stmt, name))
                return true;
        }
        return false;
    }
    statementReadsVar(stmt, name) {
        switch (stmt.kind) {
            case ast_1.NodeKind.VariableDeclaration:
                return this.expressionReadsVar(stmt.initializer, name);
            case ast_1.NodeKind.Assignment:
                return stmt.name === name || this.expressionReadsVar(stmt.value, name);
            case ast_1.NodeKind.PrintStatement:
                return this.expressionReadsVar(stmt.argument, name);
            case ast_1.NodeKind.BlockStatement:
                return stmt.statements.some((s) => this.statementReadsVar(s, name));
            case ast_1.NodeKind.IfStatement:
                return (this.expressionReadsVar(stmt.condition, name) ||
                    stmt.consequent.statements.some((s) => this.statementReadsVar(s, name)) ||
                    (stmt.alternate?.statements.some((s) => this.statementReadsVar(s, name)) ?? false));
            case ast_1.NodeKind.WhileStatement:
                return (this.expressionReadsVar(stmt.condition, name) ||
                    stmt.body.statements.some((s) => this.statementReadsVar(s, name)));
            default:
                return false;
        }
    }
    expressionReadsVar(expr, name) {
        switch (expr.kind) {
            case ast_1.NodeKind.Identifier:
                return expr.name === name;
            case ast_1.NodeKind.BinaryExpression:
                return (this.expressionReadsVar(expr.left, name) ||
                    this.expressionReadsVar(expr.right, name));
            case ast_1.NodeKind.UnaryExpression:
                return this.expressionReadsVar(expr.operand, name);
            default:
                return false;
        }
    }
    optimizeStatement(stmt, ctx) {
        switch (stmt.kind) {
            case ast_1.NodeKind.VariableDeclaration: {
                const init = this.optimizeExpression(stmt.initializer, ctx);
                const next = { ...stmt, initializer: init };
                ctx.defineConst(stmt.name, init);
                return [next];
            }
            case ast_1.NodeKind.Assignment: {
                ctx.invalidate(stmt.name);
                const value = this.optimizeExpression(stmt.value, ctx);
                return [{ ...stmt, value }];
            }
            case ast_1.NodeKind.PrintStatement:
                return [
                    {
                        ...stmt,
                        argument: this.optimizeExpression(stmt.argument, ctx),
                    },
                ];
            case ast_1.NodeKind.BlockStatement:
                return [this.optimizeBlockNode(stmt, ctx)];
            case ast_1.NodeKind.IfStatement:
                return this.optimizeIfStatement(stmt, ctx);
            case ast_1.NodeKind.WhileStatement:
                return this.optimizeWhileStatement(stmt, ctx);
            default: {
                const _n = stmt;
                void _n;
                return [];
            }
        }
    }
    optimizeIfStatement(node, ctx) {
        // Variáveis escritas em qualquer ramo podem tornar condição dependente —
        // não propagar literal para lá (invalida lookups antes da condição).
        const assigned = new Set();
        this.collectAssignedVariableNames(node.consequent, assigned);
        if (node.alternate) {
            this.collectAssignedVariableNames(node.alternate, assigned);
        }
        for (const name of assigned)
            ctx.invalidate(name);
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
    optimizeWhileStatement(node, ctx) {
        const assigned = new Set();
        this.collectAssignedVariableNames(node.body, assigned);
        for (const name of assigned)
            ctx.invalidate(name);
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
    optimizeBlockNode(block, ctx) {
        ctx.enterScope();
        const statements = this.optimizeStatements(block.statements, ctx);
        ctx.exitScope();
        return {
            kind: ast_1.NodeKind.BlockStatement,
            statements,
            loc: block.loc,
        };
    }
    // ── Coleta de variáveis atribuídas dentro de um bloco ────────────────────
    // Necessário para invalidar a propagação de constantes antes de entrar em
    // ramos (if/while) onde o valor pode ser sobrescrito.
    collectAssignedVariableNames(block, out) {
        for (const stmt of block.statements) {
            this.collectAssignedNamesFromStatement(stmt, out);
        }
    }
    collectAssignedNamesFromStatement(stmt, out) {
        switch (stmt.kind) {
            case ast_1.NodeKind.Assignment:
                out.add(stmt.name);
                break;
            case ast_1.NodeKind.BlockStatement:
                this.collectAssignedVariableNames(stmt, out);
                break;
            case ast_1.NodeKind.IfStatement:
                this.collectAssignedVariableNames(stmt.consequent, out);
                if (stmt.alternate)
                    this.collectAssignedVariableNames(stmt.alternate, out);
                break;
            case ast_1.NodeKind.WhileStatement:
                this.collectAssignedVariableNames(stmt.body, out);
                break;
            default:
                break;
        }
    }
    // ── Expressões: fold + propagação de identificadores ──────────────────────
    optimizeExpression(expr, ctx) {
        let node = expr;
        switch (node.kind) {
            case ast_1.NodeKind.Identifier: {
                const rep = ctx.resolveIdentifier(node.name);
                if (rep)
                    return rep;
                return node;
            }
            case ast_1.NodeKind.BinaryExpression: {
                const left = this.optimizeExpression(node.left, ctx);
                const right = this.optimizeExpression(node.right, ctx);
                const bin = { ...node, left, right };
                return this.tryFoldBinary(bin) ?? bin;
            }
            case ast_1.NodeKind.UnaryExpression: {
                const operand = this.optimizeExpression(node.operand, ctx);
                const un = { ...node, operand };
                return this.tryFoldUnary(un) ?? un;
            }
            default:
                return node;
        }
    }
    /** Dobramento de constantes: ambos os lados devem ser literais compatíveis. */
    tryFoldBinary(node) {
        const { operator, left, right, loc } = node;
        if (operator === "+" && this.isStringLiteral(left) && this.isStringLiteral(right)) {
            return {
                kind: ast_1.NodeKind.StringLiteral,
                value: left.value + right.value,
                loc,
            };
        }
        if (this.isNumberLiteral(left) && this.isNumberLiteral(right)) {
            const a = left.value;
            const b = right.value;
            switch (operator) {
                case "+":
                    return { kind: ast_1.NodeKind.NumberLiteral, value: a + b, loc };
                case "-":
                    return { kind: ast_1.NodeKind.NumberLiteral, value: a - b, loc };
                case "*":
                    return { kind: ast_1.NodeKind.NumberLiteral, value: a * b, loc };
                case "/":
                    if (b === 0)
                        return null;
                    return { kind: ast_1.NodeKind.NumberLiteral, value: a / b, loc };
                case ">":
                    return { kind: ast_1.NodeKind.BooleanLiteral, value: a > b, loc };
                case ">=":
                    return { kind: ast_1.NodeKind.BooleanLiteral, value: a >= b, loc };
                case "<":
                    return { kind: ast_1.NodeKind.BooleanLiteral, value: a < b, loc };
                case "<=":
                    return { kind: ast_1.NodeKind.BooleanLiteral, value: a <= b, loc };
                case "==":
                    return { kind: ast_1.NodeKind.BooleanLiteral, value: a === b, loc };
                case "!=":
                    return { kind: ast_1.NodeKind.BooleanLiteral, value: a !== b, loc };
                default:
                    break;
            }
        }
        if (this.isStringLiteral(left) && this.isStringLiteral(right)) {
            const s1 = left.value;
            const s2 = right.value;
            switch (operator) {
                case ">":
                    return { kind: ast_1.NodeKind.BooleanLiteral, value: s1 > s2, loc };
                case ">=":
                    return { kind: ast_1.NodeKind.BooleanLiteral, value: s1 >= s2, loc };
                case "<":
                    return { kind: ast_1.NodeKind.BooleanLiteral, value: s1 < s2, loc };
                case "<=":
                    return { kind: ast_1.NodeKind.BooleanLiteral, value: s1 <= s2, loc };
                case "==":
                    return { kind: ast_1.NodeKind.BooleanLiteral, value: s1 === s2, loc };
                case "!=":
                    return { kind: ast_1.NodeKind.BooleanLiteral, value: s1 !== s2, loc };
                default:
                    break;
            }
        }
        if (this.isBooleanLiteral(left) && this.isBooleanLiteral(right)) {
            const p = left.value;
            const q = right.value;
            switch (operator) {
                case "&&":
                    return { kind: ast_1.NodeKind.BooleanLiteral, value: p && q, loc };
                case "||":
                    return { kind: ast_1.NodeKind.BooleanLiteral, value: p || q, loc };
                case "==":
                    return { kind: ast_1.NodeKind.BooleanLiteral, value: p === q, loc };
                case "!=":
                    return { kind: ast_1.NodeKind.BooleanLiteral, value: p !== q, loc };
                default:
                    break;
            }
        }
        return null;
    }
    tryFoldUnary(node) {
        const { operator, operand, loc } = node;
        if (operator === "!" && this.isBooleanLiteral(operand)) {
            return {
                kind: ast_1.NodeKind.BooleanLiteral,
                value: !operand.value,
                loc,
            };
        }
        if (operator === "-" && this.isNumberLiteral(operand)) {
            return {
                kind: ast_1.NodeKind.NumberLiteral,
                value: -operand.value,
                loc,
            };
        }
        return null;
    }
    // ── Predicados ───────────────────────────────────────────────────────────
    isStatement(n) {
        return (n.kind !== ast_1.NodeKind.Program &&
            n.kind !== ast_1.NodeKind.BinaryExpression &&
            n.kind !== ast_1.NodeKind.UnaryExpression &&
            n.kind !== ast_1.NodeKind.Identifier &&
            n.kind !== ast_1.NodeKind.NumberLiteral &&
            n.kind !== ast_1.NodeKind.StringLiteral &&
            n.kind !== ast_1.NodeKind.BooleanLiteral);
    }
    isNumberLiteral(n) {
        return n.kind === ast_1.NodeKind.NumberLiteral;
    }
    isStringLiteral(n) {
        return n.kind === ast_1.NodeKind.StringLiteral;
    }
    isBooleanLiteral(n) {
        return n.kind === ast_1.NodeKind.BooleanLiteral;
    }
    isBooleanLiteralWithValue(n, value) {
        return n.kind === ast_1.NodeKind.BooleanLiteral && n.value === value;
    }
}
exports.Optimizer = Optimizer;
// Re-export utilitários usados por testes ou ferramentas
var optimizationContext_2 = require("./optimizationContext");
Object.defineProperty(exports, "isPropagatableLiteral", { enumerable: true, get: function () { return optimizationContext_2.isPropagatableLiteral; } });
Object.defineProperty(exports, "cloneLiteralExpression", { enumerable: true, get: function () { return optimizationContext_2.cloneLiteralExpression; } });
//# sourceMappingURL=optimizer.js.map