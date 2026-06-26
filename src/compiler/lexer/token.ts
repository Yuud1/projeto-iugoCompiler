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

import { TokenType } from "./tokenTypes";

export interface Token {
  type:   TokenType;
  value:  string;
  line:   number;
  column: number;
}

/**
 * Cria um Token com os campos fornecidos.
 * Função auxiliar para garantir consistência na criação de tokens.
 */
export function createToken(
  type:   TokenType,
  value:  string,
  line:   number,
  column: number
): Token {
  return { type, value, line, column };
}
