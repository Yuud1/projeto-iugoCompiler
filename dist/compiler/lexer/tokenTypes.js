"use strict";
/**
 * tokenTypes.ts
 *
 * Define o enum TokenType com todos os tipos de tokens reconhecidos
 * pelo lexer da linguagem iuGo.
 *
 * Organização:
 *  - LITERALS: valores literais (números, strings)
 *  - IDENTIFIERS: nomes de variáveis e funções
 *  - KEYWORDS: palavras reservadas da linguagem
 *  - OPERATORS: operadores aritméticos, lógicos e de atribuição
 *  - SYMBOLS: delimitadores e pontuação
 *  - SPECIAL: tokens de controle interno (EOF, UNKNOWN)
 *
 * Para adicionar um novo token: inclua aqui e atualize o lexer.ts.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.KEYWORDS = exports.TokenType = void 0;
var TokenType;
(function (TokenType) {
    // ── Literais ──────────────────────────────────────────────────────────────
    TokenType["NUMBER"] = "NUMBER";
    TokenType["STRING"] = "STRING";
    // ── Identificadores ───────────────────────────────────────────────────────
    TokenType["IDENTIFIER"] = "IDENTIFIER";
    // ── Palavras-chave ────────────────────────────────────────────────────────
    TokenType["LET"] = "LET";
    TokenType["PRINT"] = "PRINT";
    TokenType["IF"] = "IF";
    TokenType["ELSE"] = "ELSE";
    TokenType["WHILE"] = "WHILE";
    TokenType["TRUE"] = "TRUE";
    TokenType["FALSE"] = "FALSE";
    // ── Operadores aritméticos ────────────────────────────────────────────────
    TokenType["PLUS"] = "PLUS";
    TokenType["MINUS"] = "MINUS";
    TokenType["STAR"] = "STAR";
    TokenType["SLASH"] = "SLASH";
    // ── Operadores de comparação ──────────────────────────────────────────────
    TokenType["EQUAL"] = "EQUAL";
    TokenType["EQUAL_EQUAL"] = "EQUAL_EQUAL";
    TokenType["BANG_EQUAL"] = "BANG_EQUAL";
    TokenType["GREATER"] = "GREATER";
    TokenType["GREATER_EQUAL"] = "GREATER_EQUAL";
    TokenType["LESS"] = "LESS";
    TokenType["LESS_EQUAL"] = "LESS_EQUAL";
    // ── Operadores lógicos ────────────────────────────────────────────────────
    TokenType["AND"] = "AND";
    TokenType["OR"] = "OR";
    TokenType["BANG"] = "BANG";
    // ── Símbolos / delimitadores ──────────────────────────────────────────────
    TokenType["SEMICOLON"] = "SEMICOLON";
    TokenType["LBRACE"] = "LBRACE";
    TokenType["RBRACE"] = "RBRACE";
    TokenType["LPAREN"] = "LPAREN";
    TokenType["RPAREN"] = "RPAREN";
    TokenType["COMMA"] = "COMMA";
    // ── Tokens especiais de controle ──────────────────────────────────────────
    TokenType["EOF"] = "EOF";
    TokenType["UNKNOWN"] = "UNKNOWN";
})(TokenType || (exports.TokenType = TokenType = {}));
/**
 * Mapa de palavras-chave da linguagem iuGo.
 * Usado pelo lexer para distinguir identificadores de palavras reservadas.
 *
 * Para adicionar uma nova palavra-chave:
 *  1. Adicione o TokenType correspondente acima.
 *  2. Adicione a entrada neste mapa.
 */
exports.KEYWORDS = {
    let: TokenType.LET,
    print: TokenType.PRINT,
    if: TokenType.IF,
    else: TokenType.ELSE,
    while: TokenType.WHILE,
    true: TokenType.TRUE,
    false: TokenType.FALSE,
};
//# sourceMappingURL=tokenTypes.js.map