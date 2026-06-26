/**
 * lexer.ts  —  Análise Léxica (Fase 1 do compilador iuGo)
 *
 * Responsabilidade:
 *   Receber o código-fonte como string e produzir uma lista de Tokens.
 *   Caracteres inválidos geram tokens UNKNOWN (sem travar o processo).
 *
 * Fluxo interno:
 *   source → [Lexer] → Token[]
 *
 * Estratégia:
 *   - Percorre o source caractere por caractere usando um ponteiro (pos).
 *   - Mantém linha e coluna para rastreamento preciso de posição.
 *   - Consome sequências inteiras (strings, números, identificadores) em
 *     métodos auxiliares dedicados.
 *
 * Para estender:
 *   - Adicione novos casos no método `nextToken()`.
 *   - Adicione o TokenType correspondente em tokenTypes.ts.
 */
import { Token } from "./token";
export declare class Lexer {
    private source;
    private pos;
    private line;
    private column;
    constructor(source: string);
    /**
     * Tokeniza todo o source e retorna a lista completa de tokens.
     * O último token sempre é EOF.
     */
    tokenize(): Token[];
    private nextToken;
    /** Lê uma sequência de dígitos (inteiros ou decimais) */
    private readNumber;
    /** Lê um identificador ou palavra-chave */
    private readIdentifierOrKeyword;
    /** Lê uma string delimitada por aspas duplas */
    private readString;
    /**
     * Descarta espaços, tabulações, quebras de linha e comentários de linha (//).
     * TODO: Adicionar suporte a comentários de bloco (/ * ... * /) em sprint futura.
     */
    private skipWhitespaceAndComments;
    /** Avança uma posição e retorna o caractere consumido */
    private advance;
    /** Retorna o caractere atual sem consumir */
    private peek;
    /** Retorna o caractere seguinte sem consumir */
    private peekNext;
    /**
     * Consome o próximo caractere apenas se ele for igual ao esperado.
     * Útil para tokens de dois caracteres como ==, !=, >=, <=.
     */
    private match;
    /** Verifica se chegou ao fim do source */
    private isAtEnd;
    private isDigit;
    private isAlpha;
    private isAlphaNumeric;
}
//# sourceMappingURL=lexer.d.ts.map