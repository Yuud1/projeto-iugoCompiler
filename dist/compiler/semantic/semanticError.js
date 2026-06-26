"use strict";
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
Object.defineProperty(exports, "__esModule", { value: true });
exports.SemanticError = void 0;
class SemanticError extends Error {
    constructor(message, line, column) {
        super(`SemanticError: ${message}\nLinha ${line}, Coluna ${column}`);
        this.line = line;
        this.column = column;
        this.name = "SemanticError";
    }
}
exports.SemanticError = SemanticError;
//# sourceMappingURL=semanticError.js.map