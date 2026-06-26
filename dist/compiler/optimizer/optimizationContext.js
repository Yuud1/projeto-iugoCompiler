"use strict";
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
Object.defineProperty(exports, "__esModule", { value: true });
exports.OptimizationContext = void 0;
exports.isPropagatableLiteral = isPropagatableLiteral;
exports.cloneLiteralExpression = cloneLiteralExpression;
const ast_1 = require("../parser/ast");
/** Literais que podem ser propagados no lugar de um identificador. */
function isPropagatableLiteral(node) {
    return (node.kind === ast_1.NodeKind.NumberLiteral ||
        node.kind === ast_1.NodeKind.StringLiteral ||
        node.kind === ast_1.NodeKind.BooleanLiteral);
}
/** Cópia superficial de um literal (evita mutar a AST original ao propagar). */
function cloneLiteralExpression(node) {
    switch (node.kind) {
        case ast_1.NodeKind.NumberLiteral:
            return { kind: ast_1.NodeKind.NumberLiteral, value: node.value, loc: node.loc };
        case ast_1.NodeKind.StringLiteral:
            return { kind: ast_1.NodeKind.StringLiteral, value: node.value, loc: node.loc };
        case ast_1.NodeKind.BooleanLiteral:
            return { kind: ast_1.NodeKind.BooleanLiteral, value: node.value, loc: node.loc };
        default:
            return node;
    }
}
class OptimizationContext {
    constructor() {
        this.scopes = [new Map()];
    }
    /** Entra num bloco `{ }`: novo mapa só para bindings locais. */
    enterScope() {
        this.scopes.push(new Map());
    }
    exitScope() {
        if (this.scopes.length <= 1) {
            throw new Error("OptimizationContext: tentativa de sair do escopo global.");
        }
        this.scopes.pop();
    }
    /**
     * Registra `nome → literal` após `let nome = literal`.
     * Só deve ser chamado quando o initializer já for literal pós-fold.
     */
    defineConst(name, value) {
        if (!isPropagatableLiteral(value))
            return;
        this.current().set(name, cloneLiteralExpression(value));
    }
    /**
     * Remove o nome de todos os mapas (reatribuição invalida propagação global
     * da variável com esse identificador, alinhado à restrição "sem reatribuição").
     */
    invalidate(name) {
        for (const map of this.scopes) {
            map.delete(name);
        }
    }
    /**
     * Resolve identificador para uma cópia do literal, do escopo mais interno
     * para o externo; `undefined` se não houver constante conhecida.
     */
    resolveIdentifier(name) {
        for (let i = this.scopes.length - 1; i >= 0; i--) {
            const bound = this.scopes[i].get(name);
            if (bound !== undefined)
                return cloneLiteralExpression(bound);
        }
        return undefined;
    }
    current() {
        return this.scopes[this.scopes.length - 1];
    }
}
exports.OptimizationContext = OptimizationContext;
//# sourceMappingURL=optimizationContext.js.map