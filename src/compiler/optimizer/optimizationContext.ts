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
import { NodeKind } from "../parser/ast";

/** Literais que podem ser propagados no lugar de um identificador. */
export function isPropagatableLiteral(node: ExpressionNode): boolean {
  return (
    node.kind === NodeKind.NumberLiteral ||
    node.kind === NodeKind.StringLiteral ||
    node.kind === NodeKind.BooleanLiteral
  );
}

/** Cópia superficial de um literal (evita mutar a AST original ao propagar). */
export function cloneLiteralExpression(node: ExpressionNode): ExpressionNode {
  switch (node.kind) {
    case NodeKind.NumberLiteral:
      return { kind: NodeKind.NumberLiteral, value: node.value, loc: node.loc };
    case NodeKind.StringLiteral:
      return { kind: NodeKind.StringLiteral, value: node.value, loc: node.loc };
    case NodeKind.BooleanLiteral:
      return { kind: NodeKind.BooleanLiteral, value: node.value, loc: node.loc };
    default:
      return node;
  }
}

export class OptimizationContext {
  private readonly scopes: Map<string, ExpressionNode>[] = [new Map()];

  /** Entra num bloco `{ }`: novo mapa só para bindings locais. */
  enterScope(): void {
    this.scopes.push(new Map());
  }

  exitScope(): void {
    if (this.scopes.length <= 1) {
      throw new Error("OptimizationContext: tentativa de sair do escopo global.");
    }
    this.scopes.pop();
  }

  /**
   * Registra `nome → literal` após `let nome = literal`.
   * Só deve ser chamado quando o initializer já for literal pós-fold.
   */
  defineConst(name: string, value: ExpressionNode): void {
    if (!isPropagatableLiteral(value)) return;
    this.current().set(name, cloneLiteralExpression(value));
  }

  /**
   * Remove o nome de todos os mapas (reatribuição invalida propagação global
   * da variável com esse identificador, alinhado à restrição "sem reatribuição").
   */
  invalidate(name: string): void {
    for (const map of this.scopes) {
      map.delete(name);
    }
  }

  /**
   * Resolve identificador para uma cópia do literal, do escopo mais interno
   * para o externo; `undefined` se não houver constante conhecida.
   */
  resolveIdentifier(name: string): ExpressionNode | undefined {
    for (let i = this.scopes.length - 1; i >= 0; i--) {
      const bound = this.scopes[i]!.get(name);
      if (bound !== undefined) return cloneLiteralExpression(bound);
    }
    return undefined;
  }

  private current(): Map<string, ExpressionNode> {
    return this.scopes[this.scopes.length - 1]!;
  }
}
