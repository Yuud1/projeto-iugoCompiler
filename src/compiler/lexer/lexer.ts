import { Token, createToken } from "./token";
import { TokenType, KEYWORDS } from "./tokenTypes";

export class Lexer {
  private source: string;
  private pos: number;      // posição atual no source
  private line: number;     // linha atual (começa em 1)
  private column: number;   // coluna atual (começa em 1)

  constructor(source: string) {
    this.source = source;
    this.pos    = 0;
    this.line   = 1;
    this.column = 1;
  }

  tokenize(): Token[] {
    const tokens: Token[] = [];

    while (!this.isAtEnd()) {
      this.skipWhitespaceAndComments();

      if (this.isAtEnd()) break;

      const token = this.nextToken();
      tokens.push(token);
    }

    tokens.push(createToken(TokenType.EOF, "", this.line, this.column));
    return tokens;
  }

  // ── Leitura do próximo token ──────────────────────────────────────────────

  private nextToken(): Token {
    const startLine   = this.line;
    const startColumn = this.column;
    const ch          = this.advance();

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
      case "+": return createToken(TokenType.PLUS,      ch, startLine, startColumn);
      case "-": return createToken(TokenType.MINUS,     ch, startLine, startColumn);
      case "*": return createToken(TokenType.STAR,      ch, startLine, startColumn);
      case "/": return createToken(TokenType.SLASH,     ch, startLine, startColumn);
      case ";": return createToken(TokenType.SEMICOLON, ch, startLine, startColumn);
      case "{": return createToken(TokenType.LBRACE,    ch, startLine, startColumn);
      case "}": return createToken(TokenType.RBRACE,    ch, startLine, startColumn);
      case "(": return createToken(TokenType.LPAREN,    ch, startLine, startColumn);
      case ")": return createToken(TokenType.RPAREN,    ch, startLine, startColumn);
      case ",": return createToken(TokenType.COMMA,     ch, startLine, startColumn);

      // Operadores que podem ser duplos (==, !=, >=, <=)
      case "=": return this.match("=")
        ? createToken(TokenType.EQUAL_EQUAL, "==", startLine, startColumn)
        : createToken(TokenType.EQUAL,       "=",  startLine, startColumn);

      case "!": return this.match("=")
        ? createToken(TokenType.BANG_EQUAL, "!=", startLine, startColumn)
        : createToken(TokenType.BANG,       "!",  startLine, startColumn);

      case ">": return this.match("=")
        ? createToken(TokenType.GREATER_EQUAL, ">=", startLine, startColumn)
        : createToken(TokenType.GREATER,       ">",  startLine, startColumn);

      case "<": return this.match("=")
        ? createToken(TokenType.LESS_EQUAL, "<=", startLine, startColumn)
        : createToken(TokenType.LESS,       "<",  startLine, startColumn);

      case "&": return this.match("&")
        ? createToken(TokenType.AND, "&&", startLine, startColumn)
        : createToken(TokenType.UNKNOWN, ch, startLine, startColumn);

      case "|": return this.match("|")
        ? createToken(TokenType.OR, "||", startLine, startColumn)
        : createToken(TokenType.UNKNOWN, ch, startLine, startColumn);

      // Caractere não reconhecido
      default:
        return createToken(TokenType.UNKNOWN, ch, startLine, startColumn);
    }
  }

  // ── Leitores especializados ───────────────────────────────────────────────

  private readNumber(first: string, line: number, column: number): Token {
    let value = first;

    while (!this.isAtEnd() && this.isDigit(this.peek())) {
      value += this.advance();
    }

    if (!this.isAtEnd() && this.peek() === "." && this.isDigit(this.peekNext())) {
      value += this.advance(); // consome o "."
      while (!this.isAtEnd() && this.isDigit(this.peek())) {
        value += this.advance();
      }
    }

    return createToken(TokenType.NUMBER, value, line, column);
  }

  private readIdentifierOrKeyword(first: string, line: number, column: number): Token {
    let value = first;

    while (!this.isAtEnd() && this.isAlphaNumeric(this.peek())) {
      value += this.advance();
    }

    const type = KEYWORDS[value] ?? TokenType.IDENTIFIER;
    return createToken(type, value, line, column);
  }

  /** Lê uma string delimitada por aspas duplas */
  private readString(line: number, column: number): Token {
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

    return createToken(TokenType.STRING, value, line, column);
  }
  
  private skipWhitespaceAndComments(): void {
    while (!this.isAtEnd()) {
      const ch = this.peek();

      if (ch === " " || ch === "\t" || ch === "\r") {
        this.advance();
      } else if (ch === "\n") {
        this.line++;
        this.column = 0; // será incrementado no advance()
        this.advance();
      } else if (ch === "/" && this.peekNext() === "/") {
        // Comentário de linha: descarta até o fim da linha
        while (!this.isAtEnd() && this.peek() !== "\n") {
          this.advance();
        }
      } else {
        break;
      }
    }
  }

  // ── Utilitários de navegação ──────────────────────────────────────────────

  /** Avança uma posição e retorna o caractere consumido */
  private advance(): string {
    const ch = this.source[this.pos++];
    this.column++;
    return ch;
  }

  /** Retorna o caractere atual sem consumir */
  private peek(): string {
    return this.source[this.pos] ?? "";
  }

  /** Retorna o caractere seguinte sem consumir */
  private peekNext(): string {
    return this.source[this.pos + 1] ?? "";
  }

  /**
   * Consome o próximo caractere apenas se ele for igual ao esperado.
   * Útil para tokens de dois caracteres como ==, !=, >=, <=.
   */
  private match(expected: string): boolean {
    if (this.isAtEnd() || this.peek() !== expected) return false;
    this.advance();
    return true;
  }

  /** Verifica se chegou ao fim do source */
  private isAtEnd(): boolean {
    return this.pos >= this.source.length;
  }

  // ── Classificadores de caractere ──────────────────────────────────────────

  private isDigit(ch: string): boolean {
    return ch >= "0" && ch <= "9";
  }

  private isAlpha(ch: string): boolean {
    return (ch >= "a" && ch <= "z") || (ch >= "A" && ch <= "Z") || ch === "_";
  }

  private isAlphaNumeric(ch: string): boolean {
    return this.isAlpha(ch) || this.isDigit(ch);
  }
}
