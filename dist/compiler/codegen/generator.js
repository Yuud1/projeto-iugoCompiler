"use strict";
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
Object.defineProperty(exports, "__esModule", { value: true });
exports.CodeGenerator = void 0;
const ast_1 = require("../parser/ast");
const emitter_1 = require("./emitter");
class CodeGenerator {
    constructor() {
        this.emitter = new emitter_1.Emitter();
        // Variáveis que recebem Assignment em qualquer ponto do programa → devem
        // ser declaradas com `let` em JS, não `const`.
        this.reassignedVars = new Set();
    }
    /**
     * Gera o programa completo como string JavaScript.
     */
    generate(program) {
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
    collectReassigned(program) {
        const out = new Set();
        this.collectReassignedFromStatements(program.statements, out);
        return out;
    }
    collectReassignedFromStatements(stmts, out) {
        for (const stmt of stmts) {
            this.collectReassignedFromStatement(stmt, out);
        }
    }
    collectReassignedFromStatement(stmt, out) {
        switch (stmt.kind) {
            case ast_1.NodeKind.Assignment:
                out.add(stmt.name);
                break;
            case ast_1.NodeKind.BlockStatement:
                this.collectReassignedFromStatements(stmt.statements, out);
                break;
            case ast_1.NodeKind.IfStatement:
                this.collectReassignedFromStatements(stmt.consequent.statements, out);
                if (stmt.alternate)
                    this.collectReassignedFromStatements(stmt.alternate.statements, out);
                break;
            case ast_1.NodeKind.WhileStatement:
                this.collectReassignedFromStatements(stmt.body.statements, out);
                break;
            default:
                break;
        }
    }
    visitStatement(node) {
        switch (node.kind) {
            case ast_1.NodeKind.VariableDeclaration:
                this.visitVariableDeclaration(node);
                break;
            case ast_1.NodeKind.Assignment:
                this.visitAssignment(node);
                break;
            case ast_1.NodeKind.PrintStatement:
                this.visitPrintStatement(node);
                break;
            case ast_1.NodeKind.IfStatement:
                this.visitIfStatement(node);
                break;
            case ast_1.NodeKind.WhileStatement:
                this.visitWhileStatement(node);
                break;
            case ast_1.NodeKind.BlockStatement:
                this.visitBlockStatement(node);
                break;
            default: {
                const _n = node;
                void _n;
                this.emitter.emitLine(`/* statement não suportado */`);
            }
        }
    }
    /** iuGo `let x = v;` → JS `const x = v;` (ou `let` se x for reatribuído) */
    visitVariableDeclaration(node) {
        const keyword = this.reassignedVars.has(node.name) ? "let" : "const";
        const rhs = this.visitExpression(node.initializer);
        this.emitter.emitLine(`${keyword} ${node.name} = ${rhs};`);
    }
    visitAssignment(node) {
        const rhs = this.visitExpression(node.value);
        this.emitter.emitLine(`${node.name} = ${rhs};`);
    }
    visitPrintStatement(node) {
        const arg = this.visitExpression(node.argument);
        this.emitter.emitLine(`console.log(${arg});`);
    }
    visitIfStatement(node) {
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
    visitWhileStatement(node) {
        const cond = this.visitExpression(node.condition);
        this.emitter.emitLine(`while (${cond}) {`);
        this.emitter.pushIndent();
        for (const s of node.body.statements) {
            this.visitStatement(s);
        }
        this.emitter.popIndent();
        this.emitter.emitLine("}");
    }
    visitBlockStatement(node) {
        for (const s of node.statements) {
            this.visitStatement(s);
        }
    }
    visitExpression(node) {
        switch (node.kind) {
            case ast_1.NodeKind.BinaryExpression:
                return this.visitBinaryExpression(node);
            case ast_1.NodeKind.UnaryExpression:
                return this.visitUnaryExpression(node);
            case ast_1.NodeKind.Identifier:
                return this.visitIdentifier(node);
            case ast_1.NodeKind.NumberLiteral:
                return this.visitNumberLiteral(node);
            case ast_1.NodeKind.StringLiteral:
                return this.visitStringLiteral(node);
            case ast_1.NodeKind.BooleanLiteral:
                return this.visitBooleanLiteral(node);
            default: {
                const _n = node;
                void _n;
                return "/* expressão desconhecida */";
            }
        }
    }
    visitBinaryExpression(node) {
        const left = this.visitExpressionNested(node.left);
        const right = this.visitExpressionNested(node.right);
        return `${left} ${node.operator} ${right}`;
    }
    visitUnaryExpression(node) {
        const inner = this.visitExpressionNested(node.operand);
        return node.operator === "!" ? `!${inner}` : `-${inner}`;
    }
    /** Wraps in parens only when the sub-expression itself has operators (to preserve precedence). */
    visitExpressionNested(node) {
        const s = this.visitExpression(node);
        return node.kind === ast_1.NodeKind.BinaryExpression || node.kind === ast_1.NodeKind.UnaryExpression
            ? `(${s})`
            : s;
    }
    visitIdentifier(node) {
        return node.name;
    }
    visitNumberLiteral(node) {
        return String(node.value);
    }
    /** Aspas e escapes compatíveis com JavaScript. */
    visitStringLiteral(node) {
        return JSON.stringify(node.value);
    }
    visitBooleanLiteral(node) {
        return node.value ? "true" : "false";
    }
}
exports.CodeGenerator = CodeGenerator;
//# sourceMappingURL=generator.js.map