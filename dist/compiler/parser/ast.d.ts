/**
 * ast.ts  —  Nós da Árvore Sintática Abstrata (AST) do iuGo
 *
 * A AST representa a estrutura hierárquica do programa após a análise
 * sintática. Cada nó corresponde a uma construção da linguagem.
 *
 * Organização dos nós:
 *   - NodeKind: discriminador de tipo (usado com type guards)
 *   - Nós de programa e statements (declarações)
 *   - Nós de expressão (valores que podem ser avaliados)
 *   - ASTNode: union type de todos os nós possíveis
 *
 * Como navegar pela AST:
 *   Use o campo `kind` para distinguir tipos em switches/type guards.
 *   Exemplo:
 *     if (node.kind === NodeKind.BinaryExpression) { ... }
 *
 * TODO: Parser implementation - next sprint (Sprint 3)
 * TODO: Adicionar nós para funções, arrays e tipos em sprints futuras
 */
export declare enum NodeKind {
    Program = "Program",
    VariableDeclaration = "VariableDeclaration",
    Assignment = "Assignment",
    PrintStatement = "PrintStatement",
    IfStatement = "IfStatement",
    WhileStatement = "WhileStatement",
    BlockStatement = "BlockStatement",
    BinaryExpression = "BinaryExpression",
    UnaryExpression = "UnaryExpression",
    Identifier = "Identifier",
    NumberLiteral = "NumberLiteral",
    StringLiteral = "StringLiteral",
    BooleanLiteral = "BooleanLiteral"
}
/**
 * Posição no código-fonte — presente em todos os nós para rastreamento
 * de erros nas fases de análise semântica e geração de código.
 */
export interface SourceLocation {
    line: number;
    column: number;
}
interface BaseNode {
    kind: NodeKind;
    loc?: SourceLocation;
}
/**
 * ProgramNode — raiz da AST.
 * Contém a lista de todos os statements do programa.
 */
export interface ProgramNode extends BaseNode {
    kind: NodeKind.Program;
    statements: StatementNode[];
}
/**
 * VariableDeclarationNode — representa `let nome = expressão;`
 */
export interface VariableDeclarationNode extends BaseNode {
    kind: NodeKind.VariableDeclaration;
    name: string;
    initializer: ExpressionNode;
}
/**
 * AssignmentNode — representa `nome = expressão;`
 * Diferente de VariableDeclaration: não usa `let`.
 */
export interface AssignmentNode extends BaseNode {
    kind: NodeKind.Assignment;
    name: string;
    value: ExpressionNode;
}
/**
 * PrintStatementNode — representa `print(expressão);`
 */
export interface PrintStatementNode extends BaseNode {
    kind: NodeKind.PrintStatement;
    argument: ExpressionNode;
}
/**
 * IfStatementNode — representa `if (condição) { ... } else { ... }`
 * O ramo `else` é opcional.
 */
export interface IfStatementNode extends BaseNode {
    kind: NodeKind.IfStatement;
    condition: ExpressionNode;
    consequent: BlockStatementNode;
    alternate?: BlockStatementNode;
}
/**
 * WhileStatementNode — representa `while (condição) { ... }`
 */
export interface WhileStatementNode extends BaseNode {
    kind: NodeKind.WhileStatement;
    condition: ExpressionNode;
    body: BlockStatementNode;
}
/**
 * BlockStatementNode — bloco delimitado por chaves `{ statements... }`
 */
export interface BlockStatementNode extends BaseNode {
    kind: NodeKind.BlockStatement;
    statements: StatementNode[];
}
/**
 * BinaryExpressionNode — operação entre dois operandos.
 * Exemplos: `a + b`, `idade >= 18`, `x == y`
 *
 * TODO: Expandir operadores conforme a linguagem evolui
 */
export interface BinaryExpressionNode extends BaseNode {
    kind: NodeKind.BinaryExpression;
    operator: BinaryOperator;
    left: ExpressionNode;
    right: ExpressionNode;
}
/**
 * Operadores binários suportados pela linguagem iuGo.
 * Aritméticos, comparação e lógicos.
 */
export type BinaryOperator = "+" | "-" | "*" | "/" | "==" | "!=" | ">" | ">=" | "<" | "<=" | "&&" | "||";
/**
 * UnaryExpressionNode — operação sobre um único operando.
 * Exemplos: `!flag`, `-numero`
 */
export interface UnaryExpressionNode extends BaseNode {
    kind: NodeKind.UnaryExpression;
    operator: UnaryOperator;
    operand: ExpressionNode;
}
export type UnaryOperator = "!" | "-";
/**
 * IdentifierNode — referência a uma variável pelo nome.
 * Exemplo: `idade` em `print(idade)`
 */
export interface IdentifierNode extends BaseNode {
    kind: NodeKind.Identifier;
    name: string;
}
/**
 * NumberLiteralNode — valor numérico literal.
 * Exemplo: `42`, `3.14`
 */
export interface NumberLiteralNode extends BaseNode {
    kind: NodeKind.NumberLiteral;
    value: number;
}
/**
 * StringLiteralNode — valor string literal.
 * Exemplo: `"Maior"`
 */
export interface StringLiteralNode extends BaseNode {
    kind: NodeKind.StringLiteral;
    value: string;
}
/**
 * BooleanLiteralNode — valor booleano literal.
 * Exemplo: `true`, `false`
 */
export interface BooleanLiteralNode extends BaseNode {
    kind: NodeKind.BooleanLiteral;
    value: boolean;
}
/** Union de todos os nós que representam statements */
export type StatementNode = VariableDeclarationNode | AssignmentNode | PrintStatementNode | IfStatementNode | WhileStatementNode | BlockStatementNode;
/** Union de todos os nós que representam expressões */
export type ExpressionNode = BinaryExpressionNode | UnaryExpressionNode | IdentifierNode | NumberLiteralNode | StringLiteralNode | BooleanLiteralNode;
/** Union de todos os nós da AST */
export type ASTNode = ProgramNode | StatementNode | ExpressionNode;
export {};
//# sourceMappingURL=ast.d.ts.map