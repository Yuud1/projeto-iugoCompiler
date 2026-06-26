"use strict";
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
Object.defineProperty(exports, "__esModule", { value: true });
exports.Lexer = void 0;
const token_1 = require("./token");
const tokenTypes_1 = require("./tokenTypes");
class Lexer {
    constructor(source) {
        this.source = source;
        this.pos = 0;
        this.line = 1;
        this.column = 1;
    }
    // ── API pública ───────────────────────────────────────────────────────────
    /**
     * Tokeniza todo o source e retorna a lista completa de tokens.
     * O último token sempre é EOF.
     */
    tokenize() {
        const tokens = [];
        while (!this.isAtEnd()) {
            this.skipWhitespaceAndComments();
            if (this.isAtEnd())
                break;
            const token = this.nextToken();
            tokens.push(token);
        }
        tokens.push((0, token_1.createToken)(tokenTypes_1.TokenType.EOF, "", this.line, this.column));
        return tokens;
    }
    // ── Leitura do próximo token ──────────────────────────────────────────────
    nextToken() {
        const startLine = this.line;
        const startColumn = this.column;
        const ch = this.advance();
        // Números
        if (this.isDigit(ch)) {
            return this.readNumber(ch, startLine, startColumn);
        }
        // Identificadores e palavras-chave
        if (this.isAlpha(ch)) {
            return this.readIdentifierOrKeyword(ch, startLine, startColumn);
        }
        // Strings literais
        if (ch === '"') {
            return this.readString(startLine, startColumn);
        }
        // Operadores e símbolos
        switch (ch) {
            case "+": return (0, token_1.createToken)(tokenTypes_1.TokenType.PLUS, ch, startLine, startColumn);
            case "-": return (0, token_1.createToken)(tokenTypes_1.TokenType.MINUS, ch, startLine, startColumn);
            case "*": return (0, token_1.createToken)(tokenTypes_1.TokenType.STAR, ch, startLine, startColumn);
            case "/": return (0, token_1.createToken)(tokenTypes_1.TokenType.SLASH, ch, startLine, startColumn);
            case ";": return (0, token_1.createToken)(tokenTypes_1.TokenType.SEMICOLON, ch, startLine, startColumn);
            case "{": return (0, token_1.createToken)(tokenTypes_1.TokenType.LBRACE, ch, startLine, startColumn);
            case "}": return (0, token_1.createToken)(tokenTypes_1.TokenType.RBRACE, ch, startLine, startColumn);
            case "(": return (0, token_1.createToken)(tokenTypes_1.TokenType.LPAREN, ch, startLine, startColumn);
            case ")": return (0, token_1.createToken)(tokenTypes_1.TokenType.RPAREN, ch, startLine, startColumn);
            case ",": return (0, token_1.createToken)(tokenTypes_1.TokenType.COMMA, ch, startLine, startColumn);
            // Operadores que podem ser duplos (==, !=, >=, <=)
            case "=": return this.match("=")
                ? (0, token_1.createToken)(tokenTypes_1.TokenType.EQUAL_EQUAL, "==", startLine, startColumn)
                : (0, token_1.createToken)(tokenTypes_1.TokenType.EQUAL, "=", startLine, startColumn);
            case "!": return this.match("=")
                ? (0, token_1.createToken)(tokenTypes_1.TokenType.BANG_EQUAL, "!=", startLine, startColumn)
                : (0, token_1.createToken)(tokenTypes_1.TokenType.BANG, "!", startLine, startColumn);
            case ">": return this.match("=")
                ? (0, token_1.createToken)(tokenTypes_1.TokenType.GREATER_EQUAL, ">=", startLine, startColumn)
                : (0, token_1.createToken)(tokenTypes_1.TokenType.GREATER, ">", startLine, startColumn);
            case "<": return this.match("=")
                ? (0, token_1.createToken)(tokenTypes_1.TokenType.LESS_EQUAL, "<=", startLine, startColumn)
                : (0, token_1.createToken)(tokenTypes_1.TokenType.LESS, "<", startLine, startColumn);
            case "&": return this.match("&")
                ? (0, token_1.createToken)(tokenTypes_1.TokenType.AND, "&&", startLine, startColumn)
                : (0, token_1.createToken)(tokenTypes_1.TokenType.UNKNOWN, ch, startLine, startColumn);
            case "|": return this.match("|")
                ? (0, token_1.createToken)(tokenTypes_1.TokenType.OR, "||", startLine, startColumn)
                : (0, token_1.createToken)(tokenTypes_1.TokenType.UNKNOWN, ch, startLine, startColumn);
            // Caractere não reconhecido
            default:
                return (0, token_1.createToken)(tokenTypes_1.TokenType.UNKNOWN, ch, startLine, startColumn);
        }
    }
    // ── Leitores especializados ───────────────────────────────────────────────
    /** Lê uma sequência de dígitos (inteiros ou decimais) */
    readNumber(first, line, column) {
        let value = first;
        while (!this.isAtEnd() && this.isDigit(this.peek())) {
            value += this.advance();
        }
        // Suporte a decimais: "3.14"
        if (!this.isAtEnd() && this.peek() === "." && this.isDigit(this.peekNext())) {
            value += this.advance(); // consome o "."
            while (!this.isAtEnd() && this.isDigit(this.peek())) {
                value += this.advance();
            }
        }
        return (0, token_1.createToken)(tokenTypes_1.TokenType.NUMBER, value, line, column);
    }
    /** Lê um identificador ou palavra-chave */
    readIdentifierOrKeyword(first, line, column) {
        let value = first;
        while (!this.isAtEnd() && this.isAlphaNumeric(this.peek())) {
            value += this.advance();
        }
        // Verifica se o identificador é uma palavra-chave reservada
        const type = tokenTypes_1.KEYWORDS[value] ?? tokenTypes_1.TokenType.IDENTIFIER;
        return (0, token_1.createToken)(type, value, line, column);
    }
    /** Lê uma string delimitada por aspas duplas */
    readString(line, column) {
        let value = "";
        while (!this.isAtEnd() && this.peek() !== '"') {
            if (this.peek() === "\n") {
                // String não pode ter quebra de linha — erro léxico
                break;
            }
            value += this.advance();
        }
        if (!this.isAtEnd()) {
            this.advance(); // consome o '"' de fechamento
        }
        return (0, token_1.createToken)(tokenTypes_1.TokenType.STRING, value, line, column);
    }
    // ── Whitespace e comentários ──────────────────────────────────────────────
    /**
     * Descarta espaços, tabulações, quebras de linha e comentários de linha (//).
     * TODO: Adicionar suporte a comentários de bloco (/ * ... * /) em sprint futura.
     */
    skipWhitespaceAndComments() {
        while (!this.isAtEnd()) {
            const ch = this.peek();
            if (ch === " " || ch === "\t" || ch === "\r") {
                this.advance();
            }
            else if (ch === "\n") {
                this.line++;
                this.column = 0; // será incrementado no advance()
                this.advance();
            }
            else if (ch === "/" && this.peekNext() === "/") {
                // Comentário de linha: descarta até o fim da linha
                while (!this.isAtEnd() && this.peek() !== "\n") {
                    this.advance();
                }
            }
            else {
                break;
            }
        }
    }
    // ── Utilitários de navegação ──────────────────────────────────────────────
    /** Avança uma posição e retorna o caractere consumido */
    advance() {
        const ch = this.source[this.pos++];
        this.column++;
        return ch;
    }
    /** Retorna o caractere atual sem consumir */
    peek() {
        return this.source[this.pos] ?? "";
    }
    /** Retorna o caractere seguinte sem consumir */
    peekNext() {
        return this.source[this.pos + 1] ?? "";
    }
    /**
     * Consome o próximo caractere apenas se ele for igual ao esperado.
     * Útil para tokens de dois caracteres como ==, !=, >=, <=.
     */
    match(expected) {
        if (this.isAtEnd() || this.peek() !== expected)
            return false;
        this.advance();
        return true;
    }
    /** Verifica se chegou ao fim do source */
    isAtEnd() {
        return this.pos >= this.source.length;
    }
    // ── Classificadores de caractere ──────────────────────────────────────────
    isDigit(ch) {
        return ch >= "0" && ch <= "9";
    }
    isAlpha(ch) {
        return (ch >= "a" && ch <= "z") || (ch >= "A" && ch <= "Z") || ch === "_";
    }
    isAlphaNumeric(ch) {
        return this.isAlpha(ch) || this.isDigit(ch);
    }
}
exports.Lexer = Lexer;
//# sourceMappingURL=lexer.js.map