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

export enum TokenType {
  // ── Literais ──────────────────────────────────────────────────────────────
  NUMBER = "NUMBER",       // ex: 42, 3.14
  STRING = "STRING",       // ex: "hello world"

  // ── Identificadores ───────────────────────────────────────────────────────
  IDENTIFIER = "IDENTIFIER", // ex: idade, nome, resultado

  // ── Palavras-chave ────────────────────────────────────────────────────────
  LET = "LET",             // declaração de variável
  PRINT = "PRINT",         // saída padrão
  IF = "IF",               // condicional
  ELSE = "ELSE",           // ramo alternativo do if
  WHILE = "WHILE",         // laço de repetição
  TRUE = "TRUE",           // literal booleano verdadeiro
  FALSE = "FALSE",         // literal booleano falso

  // ── Operadores aritméticos ────────────────────────────────────────────────
  PLUS = "PLUS",           // +
  MINUS = "MINUS",         // -
  STAR = "STAR",           // *
  SLASH = "SLASH",         // /

  // ── Operadores de comparação ──────────────────────────────────────────────
  EQUAL = "EQUAL",         // =  (atribuição)
  EQUAL_EQUAL = "EQUAL_EQUAL", // == (igualdade)
  BANG_EQUAL = "BANG_EQUAL",   // != (diferença)
  GREATER = "GREATER",         // >
  GREATER_EQUAL = "GREATER_EQUAL", // >=
  LESS = "LESS",               // <
  LESS_EQUAL = "LESS_EQUAL",   // <=

  // ── Operadores lógicos ────────────────────────────────────────────────────
  AND = "AND",             // &&
  OR = "OR",               // ||
  BANG = "BANG",           // !  (negação)

  // ── Símbolos / delimitadores ──────────────────────────────────────────────
  SEMICOLON = "SEMICOLON", // ;
  LBRACE = "LBRACE",       // {
  RBRACE = "RBRACE",       // }
  LPAREN = "LPAREN",       // (
  RPAREN = "RPAREN",       // )
  COMMA = "COMMA",         // ,

  // ── Tokens especiais de controle ──────────────────────────────────────────
  EOF = "EOF",             // fim do arquivo / fim da entrada
  UNKNOWN = "UNKNOWN",     // caractere não reconhecido (erro léxico)
}

/**
 * Mapa de palavras-chave da linguagem iuGo.
 * Usado pelo lexer para distinguir identificadores de palavras reservadas.
 *
 * Para adicionar uma nova palavra-chave:
 *  1. Adicione o TokenType correspondente acima.
 *  2. Adicione a entrada neste mapa.
 */
export const KEYWORDS: Record<string, TokenType> = {
  let:   TokenType.LET,
  print: TokenType.PRINT,
  if:    TokenType.IF,
  else:  TokenType.ELSE,
  while: TokenType.WHILE,
  true:  TokenType.TRUE,
  false: TokenType.FALSE,
};
