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
import { ProgramNode } from "../parser/ast";
export declare class CodeGenerator {
    private readonly emitter;
    private reassignedVars;
    /**
     * Gera o programa completo como string JavaScript.
     */
    generate(program: ProgramNode): string;
    /** Percorre toda a AST e coleta nomes de variáveis que sofrem Assignment. */
    private collectReassigned;
    private collectReassignedFromStatements;
    private collectReassignedFromStatement;
    private visitStatement;
    /** iuGo `let x = v;` → JS `const x = v;` (ou `let` se x for reatribuído) */
    private visitVariableDeclaration;
    private visitAssignment;
    private visitPrintStatement;
    private visitIfStatement;
    private visitWhileStatement;
    private visitBlockStatement;
    private visitExpression;
    private visitBinaryExpression;
    private visitUnaryExpression;
    /** Wraps in parens only when the sub-expression itself has operators (to preserve precedence). */
    private visitExpressionNested;
    private visitIdentifier;
    private visitNumberLiteral;
    /** Aspas e escapes compatíveis com JavaScript. */
    private visitStringLiteral;
    private visitBooleanLiteral;
}
//# sourceMappingURL=generator.d.ts.map