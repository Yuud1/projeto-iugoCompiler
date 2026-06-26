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
import { ASTNode, ProgramNode } from "../parser/ast";
export declare class Optimizer {
    /**
     * Ponto de entrada: retorna **nova** AST (não muta a entrada).
     *
     * Passo final: remove `let x = <literal>` quando **nenhum** `Identifier(x)`
     * aparece na árvore após propagação (caso `let x = 5; print(x);` → só `print(5);`).
     *
     * TODO: remoção escopo-a-escopo com sombreamento — evitar manter `let` morto
     *       quando um `x` interior sombreia o exterior.
     */
    optimize(program: ProgramNode): ProgramNode;
    /**
     * Visitor genérico — útil para ferramentas e testes; delega por `kind`.
     */
    visit(node: ASTNode): ASTNode;
    private optimizeStatements;
    /** Remove declarações de literal que não têm mais nenhuma leitura pelo nome. */
    private stripUnusedPropagatedLiteralDeclarations;
    private collectReadIdentifiersFromStatements;
    private collectReadIdentifiersFromStatement;
    private collectReadIdentifiersFromExpression;
    private filterUnusedLiteralDeclarations;
    /**
     * Desenrola `while (x < N) { print(x); x = x + 1; }` quando o valor inicial
     * de `x` é conhecido em compile-time → sequência de `print(20)`, `print(21)`, …
     */
    private unrollBoundedLoops;
    private tryUnrollWhile;
    private parseNumericUpperBound;
    private compareNumeric;
    private isUnrollableCountingBody;
    private printsVariable;
    private isIncrementByOne;
    /**
     * Remove loops e atribuições que não alteram a saída do programa.
     * Ex.: `while (x < 5) { x = x + 1; }` sem `print` no corpo e sem leitura
     * de `x` depois do loop.
     */
    private eliminateDeadCode;
    private eliminateDeadCodeInStatement;
    private isDeadWhile;
    private blockHasPrint;
    private statementHasPrint;
    private isVarReadInStatements;
    private statementReadsVar;
    private expressionReadsVar;
    private optimizeStatement;
    private optimizeIfStatement;
    private optimizeWhileStatement;
    private optimizeBlockNode;
    private collectAssignedVariableNames;
    private collectAssignedNamesFromStatement;
    private optimizeExpression;
    /** Dobramento de constantes: ambos os lados devem ser literais compatíveis. */
    private tryFoldBinary;
    private tryFoldUnary;
    private isStatement;
    private isNumberLiteral;
    private isStringLiteral;
    private isBooleanLiteral;
    private isBooleanLiteralWithValue;
}
export { isPropagatableLiteral, cloneLiteralExpression } from "./optimizationContext";
//# sourceMappingURL=optimizer.d.ts.map