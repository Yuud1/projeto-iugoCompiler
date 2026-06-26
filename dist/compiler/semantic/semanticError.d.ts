/**
 * semanticError.ts — Erros reportados pela análise semântica
 *
 * Formato de mensagem (para integração com IDEs e ferramentas):
 *
 *   SemanticError: Variável 'nome' não declarada
 *   Linha 3, Coluna 10
 *
 * Exemplo de programa inválido e erro esperado:
 *
 *   print(nome);
 *   → SemanticError: Variável 'nome' não declarada
 *     Linha 1, Coluna 7
 */
export declare class SemanticError extends Error {
    readonly line: number;
    readonly column: number;
    constructor(message: string, line: number, column: number);
}
//# sourceMappingURL=semanticError.d.ts.map