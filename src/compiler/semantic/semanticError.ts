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

export class SemanticError extends Error {
  constructor(
    message: string,
    public readonly line: number,
    public readonly column: number
  ) {
    super(`SemanticError: ${message}\nLinha ${line}, Coluna ${column}`);
    this.name = "SemanticError";
  }
}
