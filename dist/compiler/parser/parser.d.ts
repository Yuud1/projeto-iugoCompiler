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
import { ProgramNode, ExpressionNode } from "./ast";
/**
 * ParseError — exceção lançada quando o parser encontra uma construção
 * sintática inesperada.
 *
 * Carrega linha e coluna do token ofensor para que ferramentas de
 * diagnóstico possam apontar exatamente onde o erro ocorreu.
 */
export declare class ParseError extends Error {
    readonly line: number;
    readonly column: number;
    constructor(message: string, line: number, column: number);
}
export declare class Parser {
    /** Lista completa de tokens produzida pelo Lexer */
    private tokens;
    /** Índice do token que está sendo analisado no momento */
    private current;
    constructor(tokens: Token[]);
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
    parseProgram(): ProgramNode;
    /**
     * parseStatement()
     *
     * Roteador de statements. Inspeciona o token atual e delega para o
     * método correto sem consumir o token (o método filho faz isso).
     *
     * Regra:
     *   statement → varDecl | assignment | printStmt | ifStmt | whileStmt
     */
    private parseStatement;
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
    private parseVariableDeclaration;
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
    private parseAssignment;
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
    private parsePrintStatement;
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
    private parseIfStatement;
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
    private parseWhileStatement;
    /**
     * parseBlock()
     *
     * Regra: block → "{" statement* "}"
     *
     * Blocos delimitam escopos léxicos. O analisador semântico (Sprint 4)
     * usará esses blocos para empilhar/desempilhar escopos na SymbolTable.
     */
    private parseBlock;
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
    parseExpression(): ExpressionNode;
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
    private parseLogicalOr;
    /**
     * parseLogicalAnd()
     *
     * Regra: logicalAnd → equality ( "&&" equality )*
     *
     * Exemplo: a && b && c
     *   → BinaryExpression(&&, BinaryExpression(&&, a, b), c)
     */
    private parseLogicalAnd;
    /**
     * parseEquality()
     *
     * Regra: equality → comparison ( ( "==" | "!=" ) comparison )*
     *
     * Exemplo: a == b, x != y
     */
    private parseEquality;
    /**
     * parseComparison()
     *
     * Regra: comparison → term ( ( ">" | ">=" | "<" | "<=" ) term )*
     *
     * Exemplo: idade >= 18, x < y
     */
    private parseComparison;
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
    private parseTerm;
    /**
     * parseFactor()
     *
     * Regra: factor → unary ( ( "*" | "/" ) unary )*
     *
     * Exemplo: a * b / c
     *   → BinaryExpression(/, BinaryExpression(*, a, b), c)
     */
    private parseFactor;
    /**
     * parseUnary()
     *
     * Regra: unary → ( "!" | "-" ) unary | primary
     *
     * Chamada recursiva: suporta `!!flag`, `--x` (dupla negação).
     *
     * Exemplo: !ativo → UnaryExpression { operator: "!", operand: Identifier("ativo") }
     */
    private parseUnary;
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
    private parsePrimary;
    /**
     * peek()
     * Retorna o token atual sem consumi-lo.
     * Usado para inspecionar o próximo token antes de decidir qual regra aplicar.
     */
    private peek;
    /**
     * previous()
     * Retorna o último token consumido por advance().
     * Muito útil após match() para obter o token que foi aceito.
     */
    private previous;
    /**
     * advance()
     * Consome o token atual e avança o ponteiro.
     * Retorna o token consumido (equivalente a previous() após a chamada).
     */
    private advance;
    /**
     * check(type)
     * Verifica se o token atual é do tipo informado sem consumi-lo.
     * Retorna false se já chegou ao EOF.
     */
    private check;
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
    private match;
    /**
     * consume(type, errorMessage)
     * Consome o token atual EXIGINDO que ele seja do tipo informado.
     * Lança ParseError com mensagem e posição se o token não corresponder.
     *
     * Padrão de uso: consumir tokens obrigatórios como ";", ")", "}"
     */
    private consume;
    /**
     * isAtEnd()
     * Verifica se chegou ao token EOF (fim da entrada).
     */
    private isAtEnd;
    /**
     * location()
     * Captura a posição do token atual como SourceLocation.
     * Deve ser chamado NO INÍCIO de cada método parseX() para que o nó
     * gerado registre onde a construção começa no código-fonte.
     */
    private location;
}
//# sourceMappingURL=parser.d.ts.map