/**
 * optimizationContext.ts — Estado do otimizador (escopos + constantes propagáveis)
 *
 * Mantém, por escopo léxico, quais variáveis foram inicializadas com literal
 * e ainda não foram invalidadas por reatribuição (`=`).
 *
 * Regras da Sprint 5 (versão inicial):
 *   - só literais imutáveis (NUMBER, STRING, BOOLEAN)
 *   - mesmo escopo da declaração (pilha de Maps)
 *   - qualquer `Assignment` ao nome remove o binding em todos os níveis
 *
 * TODO: propagação entre escopos com análise de escape — future version
 * TODO: SSA form optimization
 */
import type { ExpressionNode } from "../parser/ast";
/** Literais que podem ser propagados no lugar de um identificador. */
export declare function isPropagatableLiteral(node: ExpressionNode): boolean;
/** Cópia superficial de um literal (evita mutar a AST original ao propagar). */
export declare function cloneLiteralExpression(node: ExpressionNode): ExpressionNode;
export declare class OptimizationContext {
    private readonly scopes;
    /** Entra num bloco `{ }`: novo mapa só para bindings locais. */
    enterScope(): void;
    exitScope(): void;
    /**
     * Registra `nome → literal` após `let nome = literal`.
     * Só deve ser chamado quando o initializer já for literal pós-fold.
     */
    defineConst(name: string, value: ExpressionNode): void;
    /**
     * Remove o nome de todos os mapas (reatribuição invalida propagação global
     * da variável com esse identificador, alinhado à restrição "sem reatribuição").
     */
    invalidate(name: string): void;
    /**
     * Resolve identificador para uma cópia do literal, do escopo mais interno
     * para o externo; `undefined` se não houver constante conhecida.
     */
    resolveIdentifier(name: string): ExpressionNode | undefined;
    private current;
}
//# sourceMappingURL=optimizationContext.d.ts.map