/**
 * parser.ts  —  Análise Sintática (Fase 2 do compilador iuGo)
 *
 * Responsabilidade:
 *   Receber a lista de Tokens produzida pelo Lexer e construir a AST
 *   (Árvore Sintática Abstrata) que representa a estrutura hierárquica
 *   do programa iuGo.
 *
 * Estratégia: Recursive Descent Parser
 *   Cada método privado corresponde exatamente a uma regra da gramática.
 *   É a abordagem mais didática e extensível para linguagens simples.
 *
 * ── Gramática BNF da linguagem iuGo ──────────────────────────────────────
 *
 *   program     → statement* EOF
 *   statement   → varDecl | assignment | printStmt | ifStmt | whileStmt
 *
 *   varDecl     → "let" IDENTIFIER "=" expression ";"
 *   assignment  → IDENTIFIER "=" expression ";"
 *   printStmt   → "print" "(" expression ")" ";"
 *   ifStmt      → "if" "(" expression ")" block ( "else" block )?
 *   whileStmt   → "while" "(" expression ")" block
 *   block       → "{" statement* "}"
 *
 *   expression  → logicalOr
 *   logicalOr   → logicalAnd  ( "||" logicalAnd  )*
 *   logicalAnd  → equality    ( "&&" equality    )*
 *   equality    → comparison  ( ( "==" | "!=" ) comparison  )*
 *   comparison  → term        ( ( ">" | ">=" | "<" | "<=" ) term )*
 *   term        → factor      ( ( "+" | "-" ) factor )*
 *   factor      → unary       ( ( "*" | "/" ) unary )*
 *   unary       → ( "!" | "-" ) unary | primary
 *   primary     → NUMBER | STRING | "true" | "false"
 *               | IDENTIFIER | "(" expression ")"
 *
 * ── Exemplo de entrada e AST gerada ──────────────────────────────────────
 *
 * Entrada:
 *   let idade = 20;
 *   print(idade);
 *
 * AST produzida:
 *   ProgramNode {
 *     kind: "Program",
 *     statements: [
 *       VariableDeclarationNode {
 *         kind: "VariableDeclaration",
 *         name: "idade",
 *         initializer: NumberLiteralNode { kind: "NumberLiteral", value: 20 }
 *       },
 *       PrintStatementNode {
 *         kind: "PrintStatement",
 *         argument: IdentifierNode { kind: "Identifier", name: "idade" }
 *       }
 *     ]
 *   }
 *
 * ── Como estender ─────────────────────────────────────────────────────────
 *   - Novo statement: adicione um caso em parseStatement() e crie o método.
 *   - Novo operador: adicione no nível correto da hierarquia de expressões.
 *   - Novo nó AST: declare a interface em ast.ts e atualize os union types.
 */

import { Token } from "../lexer/token";
import { TokenType } from "../lexer/tokenTypes";
import {
  ProgramNode,
  StatementNode,
  ExpressionNode,
  BlockStatementNode,
  VariableDeclarationNode,
  AssignmentNode,
  PrintStatementNode,
  IfStatementNode,
  WhileStatementNode,
  BinaryExpressionNode,
  BinaryOperator,
  UnaryExpressionNode,
  UnaryOperator,
  IdentifierNode,
  NumberLiteralNode,
  StringLiteralNode,
  BooleanLiteralNode,
  NodeKind,
  SourceLocation,
} from "./ast";

// ── Erro do Parser ────────────────────────────────────────────────────────

/**
 * ParseError — exceção lançada quando o parser encontra uma construção
 * sintática inesperada.
 *
 * Carrega linha e coluna do token ofensor para que ferramentas de
 * diagnóstico possam apontar exatamente onde o erro ocorreu.
 */
export class ParseError extends Error {
  constructor(
    message: string,
    public readonly line:   number,
    public readonly column: number
  ) {
    super(`[ParseError] Linha ${line}, Coluna ${column}: ${message}`);
    this.name = "ParseError";
  }
}

// ── Classe Parser ─────────────────────────────────────────────────────────

export class Parser {
  /** Lista completa de tokens produzida pelo Lexer */
  private tokens: Token[];

  /** Índice do token que está sendo analisado no momento */
  private current: number = 0;

  constructor(tokens: Token[]) {
    this.tokens  = tokens;
    this.current = 0;
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // API pública
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * parseProgram()
   *
   * Ponto de entrada do parser. Corresponde à regra:
   *   program → statement* EOF
   *
   * Percorre todos os tokens chamando parseStatement() em loop até
   * encontrar EOF, acumulando os statements no nó raiz ProgramNode.
   *
   * Exemplo:
   *   tokens de "let x = 1; print(x);"
   *   → ProgramNode { statements: [VariableDeclarationNode, PrintStatementNode] }
   */
  parseProgram(): ProgramNode {
    const statements: StatementNode[] = [];

    while (!this.isAtEnd()) {
      const stmt = this.parseStatement();
      // parseStatement retorna null em casos de tokens inesperados que
      // foram descartados — simplesmente não os incluímos na AST
      if (stmt !== null) {
        statements.push(stmt);
      }
    }

    return {
      kind:       NodeKind.Program,
      statements,
      loc:        { line: 1, column: 1 },
    };
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // Statements
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * parseStatement()
   *
   * Roteador de statements. Inspeciona o token atual e delega para o
   * método correto sem consumir o token (o método filho faz isso).
   *
   * Regra:
   *   statement → varDecl | assignment | printStmt | ifStmt | whileStmt
   */
  private parseStatement(): StatementNode | null {
    const token = this.peek();

    switch (token.type) {
      case TokenType.LET:
        return this.parseVariableDeclaration();

      case TokenType.PRINT:
        return this.parsePrintStatement();

      case TokenType.IF:
        return this.parseIfStatement();

      case TokenType.WHILE:
        return this.parseWhileStatement();

      case TokenType.IDENTIFIER:
        // Lookahead: se o próximo token após o identificador for "=",
        // é uma atribuição. Caso contrário, é token inesperado.
        return this.parseAssignment();

      default:
        // Token não reconhecido como início de statement.
        // Avançamos para evitar loop infinito; um relatório de erros
        // mais robusto poderia coletar todos os erros em vez de parar.
        this.advance();
        return null;
    }
  }

  // ── Declaração de variável ────────────────────────────────────────────────

  /**
   * parseVariableDeclaration()
   *
   * Regra: varDecl → "let" IDENTIFIER "=" expression ";"
   *
   * Exemplo de entrada:  let idade = 20;
   * AST gerada:
   *   VariableDeclarationNode {
   *     kind:        "VariableDeclaration",
   *     name:        "idade",
   *     initializer: NumberLiteralNode { value: 20 }
   *   }
   */
  private parseVariableDeclaration(): VariableDeclarationNode {
    const loc = this.location();

    this.consume(TokenType.LET, "Esperado 'let'");

    const nameToken = this.consume(
      TokenType.IDENTIFIER,
      "Esperado nome de variável após 'let'"
    );

    this.consume(TokenType.EQUAL, `Esperado '=' após o nome '${nameToken.value}'`);

    const initializer = this.parseExpression();

    this.consume(TokenType.SEMICOLON, "Esperado ';' após a declaração de variável");

    return {
      kind: NodeKind.VariableDeclaration,
      name: nameToken.value,
      initializer,
      loc,
    };
  }

  // ── Atribuição ────────────────────────────────────────────────────────────

  /**
   * parseAssignment()
   *
   * Regra: assignment → IDENTIFIER "=" expression ";"
   *
   * Nota: diferente de VariableDeclaration, atribuição NÃO usa "let".
   *
   * Exemplo de entrada:  idade = idade + 1;
   * AST gerada:
   *   AssignmentNode {
   *     kind:  "Assignment",
   *     name:  "idade",
   *     value: BinaryExpressionNode { operator: "+", left: Identifier("idade"), right: 1 }
   *   }
   */
  private parseAssignment(): AssignmentNode {
    const loc = this.location();

    const nameToken = this.consume(TokenType.IDENTIFIER, "Esperado identificador");

    this.consume(
      TokenType.EQUAL,
      `Esperado '=' após '${nameToken.value}'. Para declarar, use 'let ${nameToken.value} = ...'`
    );

    const value = this.parseExpression();

    this.consume(TokenType.SEMICOLON, "Esperado ';' após a atribuição");

    return {
      kind: NodeKind.Assignment,
      name: nameToken.value,
      value,
      loc,
    };
  }

  // ── Print ─────────────────────────────────────────────────────────────────

  /**
   * parsePrintStatement()
   *
   * Regra: printStmt → "print" "(" expression ")" ";"
   *
   * Exemplo de entrada:  print(idade);
   * AST gerada:
   *   PrintStatementNode {
   *     kind:     "PrintStatement",
   *     argument: IdentifierNode { name: "idade" }
   *   }
   *
   * TODO: Sprint 4 — suporte a múltiplos argumentos: print(a, b, c)
   */
  private parsePrintStatement(): PrintStatementNode {
    const loc = this.location();

    this.consume(TokenType.PRINT, "Esperado 'print'");
    this.consume(TokenType.LPAREN, "Esperado '(' após 'print'");

    const argument = this.parseExpression();

    this.consume(TokenType.RPAREN, "Esperado ')' após o argumento de 'print'");
    this.consume(TokenType.SEMICOLON, "Esperado ';' após 'print(...)'");

    return {
      kind: NodeKind.PrintStatement,
      argument,
      loc,
    };
  }

  // ── Condicional ───────────────────────────────────────────────────────────

  /**
   * parseIfStatement()
   *
   * Regra: ifStmt → "if" "(" expression ")" block ( "else" block )?
   *
   * Exemplo de entrada:
   *   if (idade >= 18) { print("Maior"); } else { print("Menor"); }
   *
   * AST gerada:
   *   IfStatementNode {
   *     kind:       "IfStatement",
   *     condition:  BinaryExpressionNode { operator: ">=", ... },
   *     consequent: BlockStatementNode { statements: [PrintStatementNode] },
   *     alternate:  BlockStatementNode { statements: [PrintStatementNode] }  // opcional
   *   }
   */
  private parseIfStatement(): IfStatementNode {
    const loc = this.location();

    this.consume(TokenType.IF, "Esperado 'if'");
    this.consume(TokenType.LPAREN, "Esperado '(' após 'if'");

    const condition = this.parseExpression();

    this.consume(TokenType.RPAREN, "Esperado ')' após a condição do 'if'");

    const consequent = this.parseBlock();

    // O ramo else é opcional — só consome se o próximo token for "else"
    let alternate: BlockStatementNode | undefined;
    if (this.check(TokenType.ELSE)) {
      this.advance(); // consome "else"
      alternate = this.parseBlock();
    }

    return {
      kind: NodeKind.IfStatement,
      condition,
      consequent,
      alternate,
      loc,
    };
  }

  // ── Laço ──────────────────────────────────────────────────────────────────

  /**
   * parseWhileStatement()
   *
   * Regra: whileStmt → "while" "(" expression ")" block
   *
   * Exemplo de entrada:
   *   while (idade < 30) { idade = idade + 1; }
   *
   * AST gerada:
   *   WhileStatementNode {
   *     kind:      "WhileStatement",
   *     condition: BinaryExpressionNode { operator: "<", ... },
   *     body:      BlockStatementNode { statements: [AssignmentNode] }
   *   }
   *
   * TODO: Sprint 4 — adicionar "break" e "continue" como statements válidos
   */
  private parseWhileStatement(): WhileStatementNode {
    const loc = this.location();

    this.consume(TokenType.WHILE, "Esperado 'while'");
    this.consume(TokenType.LPAREN, "Esperado '(' após 'while'");

    const condition = this.parseExpression();

    this.consume(TokenType.RPAREN, "Esperado ')' após a condição do 'while'");

    const body = this.parseBlock();

    return {
      kind: NodeKind.WhileStatement,
      condition,
      body,
      loc,
    };
  }

  // ── Bloco ─────────────────────────────────────────────────────────────────

  /**
   * parseBlock()
   *
   * Regra: block → "{" statement* "}"
   *
   * Blocos delimitam escopos léxicos. O analisador semântico (Sprint 4)
   * usará esses blocos para empilhar/desempilhar escopos na SymbolTable.
   */
  private parseBlock(): BlockStatementNode {
    const loc = this.location();

    this.consume(TokenType.LBRACE, "Esperado '{' para iniciar bloco");

    const statements: StatementNode[] = [];

    // Consome statements até fechar o bloco ou chegar ao EOF
    while (!this.check(TokenType.RBRACE) && !this.isAtEnd()) {
      const stmt = this.parseStatement();
      if (stmt !== null) {
        statements.push(stmt);
      }
    }

    this.consume(TokenType.RBRACE, "Esperado '}' para fechar o bloco");

    return {
      kind: NodeKind.BlockStatement,
      statements,
      loc,
    };
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // Expressões — Hierarquia de Precedência (do menor para o maior)
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * parseExpression()
   *
   * Ponto de entrada da análise de expressões.
   * Delega para o nível de menor precedência (logicalOr).
   *
   * Hierarquia implementada (menor → maior precedência):
   *   logicalOr → logicalAnd → equality → comparison
   *   → term → factor → unary → primary
   *
   * Essa organização garante que `2 + 3 * 4` seja interpretado como
   * `2 + (3 * 4)` e não `(2 + 3) * 4`.
   */
  parseExpression(): ExpressionNode {
    // TODO: Sprint 5 — adicionar expressões condicionais ternárias (a ? b : c)
    return this.parseLogicalOr();
  }

  // ── Nível 1: Lógico OR ────────────────────────────────────────────────────

  /**
   * parseLogicalOr()
   *
   * Regra: logicalOr → logicalAnd ( "||" logicalAnd )*
   *
   * Exemplo: a || b || c
   *   → BinaryExpression(||, BinaryExpression(||, a, b), c)
   *
   * || tem menor precedência que &&, por isso vem primeiro.
   */
  private parseLogicalOr(): ExpressionNode {
    let left = this.parseLogicalAnd();

    while (this.match(TokenType.OR)) {
      const operator = "||" as BinaryOperator;
      const loc      = this.location();
      const right    = this.parseLogicalAnd();

      left = {
        kind: NodeKind.BinaryExpression,
        operator,
        left,
        right,
        loc,
      } as BinaryExpressionNode;
    }

    return left;
  }

  // ── Nível 2: Lógico AND ───────────────────────────────────────────────────

  /**
   * parseLogicalAnd()
   *
   * Regra: logicalAnd → equality ( "&&" equality )*
   *
   * Exemplo: a && b && c
   *   → BinaryExpression(&&, BinaryExpression(&&, a, b), c)
   */
  private parseLogicalAnd(): ExpressionNode {
    let left = this.parseEquality();

    while (this.match(TokenType.AND)) {
      const operator = "&&" as BinaryOperator;
      const loc      = this.location();
      const right    = this.parseEquality();

      left = {
        kind: NodeKind.BinaryExpression,
        operator,
        left,
        right,
        loc,
      } as BinaryExpressionNode;
    }

    return left;
  }

  // ── Nível 3: Igualdade ────────────────────────────────────────────────────

  /**
   * parseEquality()
   *
   * Regra: equality → comparison ( ( "==" | "!=" ) comparison )*
   *
   * Exemplo: a == b, x != y
   */
  private parseEquality(): ExpressionNode {
    let left = this.parseComparison();

    while (this.match(TokenType.EQUAL_EQUAL, TokenType.BANG_EQUAL)) {
      const op       = this.previous();
      const operator = (op.type === TokenType.EQUAL_EQUAL ? "==" : "!=") as BinaryOperator;
      const loc      = this.location();
      const right    = this.parseComparison();

      left = {
        kind: NodeKind.BinaryExpression,
        operator,
        left,
        right,
        loc,
      } as BinaryExpressionNode;
    }

    return left;
  }

  // ── Nível 4: Comparação ───────────────────────────────────────────────────

  /**
   * parseComparison()
   *
   * Regra: comparison → term ( ( ">" | ">=" | "<" | "<=" ) term )*
   *
   * Exemplo: idade >= 18, x < y
   */
  private parseComparison(): ExpressionNode {
    let left = this.parseTerm();

    while (
      this.match(
        TokenType.GREATER,
        TokenType.GREATER_EQUAL,
        TokenType.LESS,
        TokenType.LESS_EQUAL
      )
    ) {
      const op = this.previous();
      const loc = this.location();

      const operatorMap: Partial<Record<TokenType, BinaryOperator>> = {
        [TokenType.GREATER]:       ">",
        [TokenType.GREATER_EQUAL]: ">=",
        [TokenType.LESS]:          "<",
        [TokenType.LESS_EQUAL]:    "<=",
      };

      const operator = operatorMap[op.type]!;
      const right    = this.parseTerm();

      left = {
        kind: NodeKind.BinaryExpression,
        operator,
        left,
        right,
        loc,
      } as BinaryExpressionNode;
    }

    return left;
  }

  // ── Nível 5: Adição e Subtração ───────────────────────────────────────────

  /**
   * parseTerm()
   *
   * Regra: term → factor ( ( "+" | "-" ) factor )*
   *
   * Exemplo: a + b - c
   *   → BinaryExpression(-, BinaryExpression(+, a, b), c)
   *
   * Associatividade à esquerda garantida pelo loop while.
   */
  private parseTerm(): ExpressionNode {
    let left = this.parseFactor();

    while (this.match(TokenType.PLUS, TokenType.MINUS)) {
      const op       = this.previous();
      const operator = (op.type === TokenType.PLUS ? "+" : "-") as BinaryOperator;
      const loc      = this.location();
      const right    = this.parseFactor();

      left = {
        kind: NodeKind.BinaryExpression,
        operator,
        left,
        right,
        loc,
      } as BinaryExpressionNode;
    }

    return left;
  }

  // ── Nível 6: Multiplicação e Divisão ──────────────────────────────────────

  /**
   * parseFactor()
   *
   * Regra: factor → unary ( ( "*" | "/" ) unary )*
   *
   * Exemplo: a * b / c
   *   → BinaryExpression(/, BinaryExpression(*, a, b), c)
   */
  private parseFactor(): ExpressionNode {
    let left = this.parseUnary();

    while (this.match(TokenType.STAR, TokenType.SLASH)) {
      const op       = this.previous();
      const operator = (op.type === TokenType.STAR ? "*" : "/") as BinaryOperator;
      const loc      = this.location();
      const right    = this.parseUnary();

      left = {
        kind: NodeKind.BinaryExpression,
        operator,
        left,
        right,
        loc,
      } as BinaryExpressionNode;
    }

    return left;
  }

  // ── Nível 7: Unário ───────────────────────────────────────────────────────

  /**
   * parseUnary()
   *
   * Regra: unary → ( "!" | "-" ) unary | primary
   *
   * Chamada recursiva: suporta `!!flag`, `--x` (dupla negação).
   *
   * Exemplo: !ativo → UnaryExpression { operator: "!", operand: Identifier("ativo") }
   */
  private parseUnary(): ExpressionNode {
    if (this.match(TokenType.BANG, TokenType.MINUS)) {
      const op       = this.previous();
      const operator = (op.type === TokenType.BANG ? "!" : "-") as UnaryOperator;
      const loc      = this.location();
      const operand  = this.parseUnary(); // recursão para suportar dupla negação

      return {
        kind: NodeKind.UnaryExpression,
        operator,
        operand,
        loc,
      } as UnaryExpressionNode;
    }

    return this.parsePrimary();
  }

  // ── Nível 8: Primário (folhas da AST) ────────────────────────────────────

  /**
   * parsePrimary()
   *
   * Regra:
   *   primary → NUMBER | STRING | "true" | "false"
   *           | IDENTIFIER | "(" expression ")"
   *
   * Este é o nível mais profundo da recursão — produz folhas da AST
   * (literais e identificadores) ou reinicia a hierarquia com agrupamento.
   *
   * Exemplos:
   *   42        → NumberLiteralNode  { value: 42 }
   *   "Maior"   → StringLiteralNode  { value: "Maior" }
   *   true      → BooleanLiteralNode { value: true }
   *   idade     → IdentifierNode     { name: "idade" }
   *   (a + b)   → chama parseExpression() recursivamente
   *
   * TODO: Sprint 4 — suporte a chamadas de função: foo(arg1, arg2)
   * TODO: Sprint 5 — suporte a acesso de array: arr[0]
   */
  private parsePrimary(): ExpressionNode {
    const loc = this.location();

    // Literal numérico
    if (this.match(TokenType.NUMBER)) {
      const token = this.previous();
      return {
        kind:  NodeKind.NumberLiteral,
        value: parseFloat(token.value),
        loc,
      } as NumberLiteralNode;
    }

    // Literal string
    if (this.match(TokenType.STRING)) {
      const token = this.previous();
      return {
        kind:  NodeKind.StringLiteral,
        value: token.value,
        loc,
      } as StringLiteralNode;
    }

    // Literal booleano true
    if (this.match(TokenType.TRUE)) {
      return {
        kind:  NodeKind.BooleanLiteral,
        value: true,
        loc,
      } as BooleanLiteralNode;
    }

    // Literal booleano false
    if (this.match(TokenType.FALSE)) {
      return {
        kind:  NodeKind.BooleanLiteral,
        value: false,
        loc,
      } as BooleanLiteralNode;
    }

    // Identificador (referência a variável)
    if (this.match(TokenType.IDENTIFIER)) {
      const token = this.previous();
      return {
        kind: NodeKind.Identifier,
        name: token.value,
        loc,
      } as IdentifierNode;
    }

    // Expressão agrupada entre parênteses: ( expression )
    if (this.match(TokenType.LPAREN)) {
      const inner = this.parseExpression();
      this.consume(TokenType.RPAREN, "Esperado ')' para fechar a expressão");
      return inner;
    }

    // Nenhum token primário reconhecido — erro sintático
    const t = this.peek();
    throw new ParseError(
      `Token inesperado '${t.value}' (${t.type}) — esperado expressão`,
      t.line,
      t.column
    );
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // Utilitários de navegação
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * peek()
   * Retorna o token atual sem consumi-lo.
   * Usado para inspecionar o próximo token antes de decidir qual regra aplicar.
   */
  private peek(): Token {
    return this.tokens[this.current]!;
  }

  /**
   * previous()
   * Retorna o último token consumido por advance().
   * Muito útil após match() para obter o token que foi aceito.
   */
  private previous(): Token {
    return this.tokens[this.current - 1]!;
  }

  /**
   * advance()
   * Consome o token atual e avança o ponteiro.
   * Retorna o token consumido (equivalente a previous() após a chamada).
   */
  private advance(): Token {
    if (!this.isAtEnd()) this.current++;
    return this.previous();
  }

  /**
   * check(type)
   * Verifica se o token atual é do tipo informado sem consumi-lo.
   * Retorna false se já chegou ao EOF.
   */
  private check(type: TokenType): boolean {
    if (this.isAtEnd()) return false;
    return this.peek().type === type;
  }

  /**
   * match(...types)
   * Consome o token atual se ele corresponder a QUALQUER um dos tipos listados.
   * Retorna true se consumiu, false caso contrário.
   *
   * Padrão de uso:
   *   if (this.match(TokenType.PLUS, TokenType.MINUS)) {
   *     const op = this.previous(); // token que foi consumido
   *   }
   */
  private match(...types: TokenType[]): boolean {
    for (const type of types) {
      if (this.check(type)) {
        this.advance();
        return true;
      }
    }
    return false;
  }

  /**
   * consume(type, errorMessage)
   * Consome o token atual EXIGINDO que ele seja do tipo informado.
   * Lança ParseError com mensagem e posição se o token não corresponder.
   *
   * Padrão de uso: consumir tokens obrigatórios como ";", ")", "}"
   */
  private consume(type: TokenType, errorMessage: string): Token {
    if (this.check(type)) return this.advance();
    const t = this.peek();
    throw new ParseError(errorMessage, t.line, t.column);
  }

  /**
   * isAtEnd()
   * Verifica se chegou ao token EOF (fim da entrada).
   */
  private isAtEnd(): boolean {
    return this.peek().type === TokenType.EOF;
  }

  /**
   * location()
   * Captura a posição do token atual como SourceLocation.
   * Deve ser chamado NO INÍCIO de cada método parseX() para que o nó
   * gerado registre onde a construção começa no código-fonte.
   */
  private location(): SourceLocation {
    const t = this.peek();
    return { line: t.line, column: t.column };
  }
}
