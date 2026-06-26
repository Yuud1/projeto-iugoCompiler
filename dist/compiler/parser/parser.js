"use strict";
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
Object.defineProperty(exports, "__esModule", { value: true });
exports.Parser = exports.ParseError = void 0;
const tokenTypes_1 = require("../lexer/tokenTypes");
const ast_1 = require("./ast");
// ── Erro do Parser ────────────────────────────────────────────────────────
/**
 * ParseError — exceção lançada quando o parser encontra uma construção
 * sintática inesperada.
 *
 * Carrega linha e coluna do token ofensor para que ferramentas de
 * diagnóstico possam apontar exatamente onde o erro ocorreu.
 */
class ParseError extends Error {
    constructor(message, line, column) {
        super(`[ParseError] Linha ${line}, Coluna ${column}: ${message}`);
        this.line = line;
        this.column = column;
        this.name = "ParseError";
    }
}
exports.ParseError = ParseError;
// ── Classe Parser ─────────────────────────────────────────────────────────
class Parser {
    constructor(tokens) {
        /** Índice do token que está sendo analisado no momento */
        this.current = 0;
        this.tokens = tokens;
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
    parseProgram() {
        const statements = [];
        while (!this.isAtEnd()) {
            const stmt = this.parseStatement();
            // parseStatement retorna null em casos de tokens inesperados que
            // foram descartados — simplesmente não os incluímos na AST
            if (stmt !== null) {
                statements.push(stmt);
            }
        }
        return {
            kind: ast_1.NodeKind.Program,
            statements,
            loc: { line: 1, column: 1 },
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
    parseStatement() {
        const token = this.peek();
        switch (token.type) {
            case tokenTypes_1.TokenType.LET:
                return this.parseVariableDeclaration();
            case tokenTypes_1.TokenType.PRINT:
                return this.parsePrintStatement();
            case tokenTypes_1.TokenType.IF:
                return this.parseIfStatement();
            case tokenTypes_1.TokenType.WHILE:
                return this.parseWhileStatement();
            case tokenTypes_1.TokenType.IDENTIFIER:
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
    parseVariableDeclaration() {
        const loc = this.location();
        this.consume(tokenTypes_1.TokenType.LET, "Esperado 'let'");
        const nameToken = this.consume(tokenTypes_1.TokenType.IDENTIFIER, "Esperado nome de variável após 'let'");
        this.consume(tokenTypes_1.TokenType.EQUAL, `Esperado '=' após o nome '${nameToken.value}'`);
        const initializer = this.parseExpression();
        this.consume(tokenTypes_1.TokenType.SEMICOLON, "Esperado ';' após a declaração de variável");
        return {
            kind: ast_1.NodeKind.VariableDeclaration,
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
    parseAssignment() {
        const loc = this.location();
        const nameToken = this.consume(tokenTypes_1.TokenType.IDENTIFIER, "Esperado identificador");
        this.consume(tokenTypes_1.TokenType.EQUAL, `Esperado '=' após '${nameToken.value}'. Para declarar, use 'let ${nameToken.value} = ...'`);
        const value = this.parseExpression();
        this.consume(tokenTypes_1.TokenType.SEMICOLON, "Esperado ';' após a atribuição");
        return {
            kind: ast_1.NodeKind.Assignment,
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
    parsePrintStatement() {
        const loc = this.location();
        this.consume(tokenTypes_1.TokenType.PRINT, "Esperado 'print'");
        this.consume(tokenTypes_1.TokenType.LPAREN, "Esperado '(' após 'print'");
        const argument = this.parseExpression();
        this.consume(tokenTypes_1.TokenType.RPAREN, "Esperado ')' após o argumento de 'print'");
        this.consume(tokenTypes_1.TokenType.SEMICOLON, "Esperado ';' após 'print(...)'");
        return {
            kind: ast_1.NodeKind.PrintStatement,
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
    parseIfStatement() {
        const loc = this.location();
        this.consume(tokenTypes_1.TokenType.IF, "Esperado 'if'");
        this.consume(tokenTypes_1.TokenType.LPAREN, "Esperado '(' após 'if'");
        const condition = this.parseExpression();
        this.consume(tokenTypes_1.TokenType.RPAREN, "Esperado ')' após a condição do 'if'");
        const consequent = this.parseBlock();
        // O ramo else é opcional — só consome se o próximo token for "else"
        let alternate;
        if (this.check(tokenTypes_1.TokenType.ELSE)) {
            this.advance(); // consome "else"
            alternate = this.parseBlock();
        }
        return {
            kind: ast_1.NodeKind.IfStatement,
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
    parseWhileStatement() {
        const loc = this.location();
        this.consume(tokenTypes_1.TokenType.WHILE, "Esperado 'while'");
        this.consume(tokenTypes_1.TokenType.LPAREN, "Esperado '(' após 'while'");
        const condition = this.parseExpression();
        this.consume(tokenTypes_1.TokenType.RPAREN, "Esperado ')' após a condição do 'while'");
        const body = this.parseBlock();
        return {
            kind: ast_1.NodeKind.WhileStatement,
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
    parseBlock() {
        const loc = this.location();
        this.consume(tokenTypes_1.TokenType.LBRACE, "Esperado '{' para iniciar bloco");
        const statements = [];
        // Consome statements até fechar o bloco ou chegar ao EOF
        while (!this.check(tokenTypes_1.TokenType.RBRACE) && !this.isAtEnd()) {
            const stmt = this.parseStatement();
            if (stmt !== null) {
                statements.push(stmt);
            }
        }
        this.consume(tokenTypes_1.TokenType.RBRACE, "Esperado '}' para fechar o bloco");
        return {
            kind: ast_1.NodeKind.BlockStatement,
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
    parseExpression() {
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
    parseLogicalOr() {
        let left = this.parseLogicalAnd();
        while (this.match(tokenTypes_1.TokenType.OR)) {
            const operator = "||";
            const loc = this.location();
            const right = this.parseLogicalAnd();
            left = {
                kind: ast_1.NodeKind.BinaryExpression,
                operator,
                left,
                right,
                loc,
            };
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
    parseLogicalAnd() {
        let left = this.parseEquality();
        while (this.match(tokenTypes_1.TokenType.AND)) {
            const operator = "&&";
            const loc = this.location();
            const right = this.parseEquality();
            left = {
                kind: ast_1.NodeKind.BinaryExpression,
                operator,
                left,
                right,
                loc,
            };
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
    parseEquality() {
        let left = this.parseComparison();
        while (this.match(tokenTypes_1.TokenType.EQUAL_EQUAL, tokenTypes_1.TokenType.BANG_EQUAL)) {
            const op = this.previous();
            const operator = (op.type === tokenTypes_1.TokenType.EQUAL_EQUAL ? "==" : "!=");
            const loc = this.location();
            const right = this.parseComparison();
            left = {
                kind: ast_1.NodeKind.BinaryExpression,
                operator,
                left,
                right,
                loc,
            };
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
    parseComparison() {
        let left = this.parseTerm();
        while (this.match(tokenTypes_1.TokenType.GREATER, tokenTypes_1.TokenType.GREATER_EQUAL, tokenTypes_1.TokenType.LESS, tokenTypes_1.TokenType.LESS_EQUAL)) {
            const op = this.previous();
            const loc = this.location();
            const operatorMap = {
                [tokenTypes_1.TokenType.GREATER]: ">",
                [tokenTypes_1.TokenType.GREATER_EQUAL]: ">=",
                [tokenTypes_1.TokenType.LESS]: "<",
                [tokenTypes_1.TokenType.LESS_EQUAL]: "<=",
            };
            const operator = operatorMap[op.type];
            const right = this.parseTerm();
            left = {
                kind: ast_1.NodeKind.BinaryExpression,
                operator,
                left,
                right,
                loc,
            };
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
    parseTerm() {
        let left = this.parseFactor();
        while (this.match(tokenTypes_1.TokenType.PLUS, tokenTypes_1.TokenType.MINUS)) {
            const op = this.previous();
            const operator = (op.type === tokenTypes_1.TokenType.PLUS ? "+" : "-");
            const loc = this.location();
            const right = this.parseFactor();
            left = {
                kind: ast_1.NodeKind.BinaryExpression,
                operator,
                left,
                right,
                loc,
            };
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
    parseFactor() {
        let left = this.parseUnary();
        while (this.match(tokenTypes_1.TokenType.STAR, tokenTypes_1.TokenType.SLASH)) {
            const op = this.previous();
            const operator = (op.type === tokenTypes_1.TokenType.STAR ? "*" : "/");
            const loc = this.location();
            const right = this.parseUnary();
            left = {
                kind: ast_1.NodeKind.BinaryExpression,
                operator,
                left,
                right,
                loc,
            };
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
    parseUnary() {
        if (this.match(tokenTypes_1.TokenType.BANG, tokenTypes_1.TokenType.MINUS)) {
            const op = this.previous();
            const operator = (op.type === tokenTypes_1.TokenType.BANG ? "!" : "-");
            const loc = this.location();
            const operand = this.parseUnary(); // recursão para suportar dupla negação
            return {
                kind: ast_1.NodeKind.UnaryExpression,
                operator,
                operand,
                loc,
            };
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
    parsePrimary() {
        const loc = this.location();
        // Literal numérico
        if (this.match(tokenTypes_1.TokenType.NUMBER)) {
            const token = this.previous();
            return {
                kind: ast_1.NodeKind.NumberLiteral,
                value: parseFloat(token.value),
                loc,
            };
        }
        // Literal string
        if (this.match(tokenTypes_1.TokenType.STRING)) {
            const token = this.previous();
            return {
                kind: ast_1.NodeKind.StringLiteral,
                value: token.value,
                loc,
            };
        }
        // Literal booleano true
        if (this.match(tokenTypes_1.TokenType.TRUE)) {
            return {
                kind: ast_1.NodeKind.BooleanLiteral,
                value: true,
                loc,
            };
        }
        // Literal booleano false
        if (this.match(tokenTypes_1.TokenType.FALSE)) {
            return {
                kind: ast_1.NodeKind.BooleanLiteral,
                value: false,
                loc,
            };
        }
        // Identificador (referência a variável)
        if (this.match(tokenTypes_1.TokenType.IDENTIFIER)) {
            const token = this.previous();
            return {
                kind: ast_1.NodeKind.Identifier,
                name: token.value,
                loc,
            };
        }
        // Expressão agrupada entre parênteses: ( expression )
        if (this.match(tokenTypes_1.TokenType.LPAREN)) {
            const inner = this.parseExpression();
            this.consume(tokenTypes_1.TokenType.RPAREN, "Esperado ')' para fechar a expressão");
            return inner;
        }
        // Nenhum token primário reconhecido — erro sintático
        const t = this.peek();
        throw new ParseError(`Token inesperado '${t.value}' (${t.type}) — esperado expressão`, t.line, t.column);
    }
    // ═══════════════════════════════════════════════════════════════════════════
    // Utilitários de navegação
    // ═══════════════════════════════════════════════════════════════════════════
    /**
     * peek()
     * Retorna o token atual sem consumi-lo.
     * Usado para inspecionar o próximo token antes de decidir qual regra aplicar.
     */
    peek() {
        return this.tokens[this.current];
    }
    /**
     * previous()
     * Retorna o último token consumido por advance().
     * Muito útil após match() para obter o token que foi aceito.
     */
    previous() {
        return this.tokens[this.current - 1];
    }
    /**
     * advance()
     * Consome o token atual e avança o ponteiro.
     * Retorna o token consumido (equivalente a previous() após a chamada).
     */
    advance() {
        if (!this.isAtEnd())
            this.current++;
        return this.previous();
    }
    /**
     * check(type)
     * Verifica se o token atual é do tipo informado sem consumi-lo.
     * Retorna false se já chegou ao EOF.
     */
    check(type) {
        if (this.isAtEnd())
            return false;
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
    match(...types) {
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
    consume(type, errorMessage) {
        if (this.check(type))
            return this.advance();
        const t = this.peek();
        throw new ParseError(errorMessage, t.line, t.column);
    }
    /**
     * isAtEnd()
     * Verifica se chegou ao token EOF (fim da entrada).
     */
    isAtEnd() {
        return this.peek().type === tokenTypes_1.TokenType.EOF;
    }
    /**
     * location()
     * Captura a posição do token atual como SourceLocation.
     * Deve ser chamado NO INÍCIO de cada método parseX() para que o nó
     * gerado registre onde a construção começa no código-fonte.
     */
    location() {
        const t = this.peek();
        return { line: t.line, column: t.column };
    }
}
exports.Parser = Parser;
//# sourceMappingURL=parser.js.map