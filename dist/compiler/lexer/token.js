"use strict";
/**
 * token.ts
 *
 * Define a interface Token — unidade atômica produzida pelo lexer.
 *
 * Cada token carrega:
 *  - type:    categoria léxica (TokenType)
 *  - value:   texto original encontrado no código-fonte
 *  - line:    linha onde o token aparece (para mensagens de erro)
 *  - column:  coluna onde o token começa (para mensagens de erro)
 *
 * Manter metadados de posição desde o início facilita a geração de
 * mensagens de erro precisas em fases posteriores (parser, semântica).
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.createToken = createToken;
/**
 * Cria um Token com os campos fornecidos.
 * Função auxiliar para garantir consistência na criação de tokens.
 */
function createToken(type, value, line, column) {
    return { type, value, line, column };
}
//# sourceMappingURL=token.js.map