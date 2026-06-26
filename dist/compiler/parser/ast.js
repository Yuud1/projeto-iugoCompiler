"use strict";
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
Object.defineProperty(exports, "__esModule", { value: true });
exports.NodeKind = void 0;
// ── Discriminador de tipo ──────────────────────────────────────────────────
var NodeKind;
(function (NodeKind) {
    // Programa
    NodeKind["Program"] = "Program";
    // Statements (declarações)
    NodeKind["VariableDeclaration"] = "VariableDeclaration";
    NodeKind["Assignment"] = "Assignment";
    NodeKind["PrintStatement"] = "PrintStatement";
    NodeKind["IfStatement"] = "IfStatement";
    NodeKind["WhileStatement"] = "WhileStatement";
    NodeKind["BlockStatement"] = "BlockStatement";
    // Expressões
    NodeKind["BinaryExpression"] = "BinaryExpression";
    NodeKind["UnaryExpression"] = "UnaryExpression";
    NodeKind["Identifier"] = "Identifier";
    NodeKind["NumberLiteral"] = "NumberLiteral";
    NodeKind["StringLiteral"] = "StringLiteral";
    NodeKind["BooleanLiteral"] = "BooleanLiteral";
})(NodeKind || (exports.NodeKind = NodeKind = {}));
//# sourceMappingURL=ast.js.map