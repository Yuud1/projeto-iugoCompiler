"use strict";
/**
 * analyzer.ts — Análise semântica (Sprint 4) do compilador iuGo
 *
 * Percorre a AST com Visitor Pattern (switch por `kind` — na AST iuGo o
 * discriminador é `kind`, equivalente ao conceito de "type" do nó).
 *
 * Regras implementadas:
 *   - variável declarada antes do uso (lookup em expressões)
 *   - redeclaração no mesmo escopo (define + existsInCurrentScope)
 *   - escopos aninhados: cada bloco `{ }` cria SymbolTable(parent)
 *   - inferência de tipo em `let nome = expr`
 *   - compatibilidade de tipos em operadores binários/unários
 *   - condições de `if` e `while` devem ser BOOLEAN
 *
 * ── Exemplo: programa válido ─────────────────────────────────────────────
 *
 *   let idade = 20;
 *   if (idade >= 18) {
 *     let nome = "Maior";
 *     print(nome);
 *   }
 *   print(idade);
 *
 *   → Sem erros. `nome` só existe dentro do bloco; `idade` no escopo global.
 *
 * ── Exemplo: programa inválido (variável não declarada) ─────────────────
 *
 *   print(nome);
 *
 *   → SemanticError: Variável 'nome' não declarada
 *     Linha 1, Coluna 7
 *
 * ── Exemplo: programa inválido (redeclaração) ───────────────────────────
 *
 *   let idade = 20;
 *   let idade = 30;
 *
 *   → SemanticError: Variável 'idade' já declarada neste escopo
 *     Linha 2, Coluna 5
 *
 * ── Exemplo: programa inválido (condição não booleana) ─────────────────
 *
 *   if (10) { }
 *
 *   → SemanticError: Condição do 'if' deve ser do tipo BOOLEAN
 *
 * TODO: function scope support — Sprint 6
 * TODO: array type checking — future version
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.SemanticAnalyzer = void 0;
const ast_1 = require("../parser/ast");
const symbolTable_1 = require("./symbolTable");
const semanticError_1 = require("./semanticError");
const types_1 = require("./types");
class SemanticAnalyzer {
    constructor() {
        this.globalScope = new symbolTable_1.SymbolTable(null);
        this.currentScope = this.globalScope;
    }
    /**
     * Ponto de entrada: valida o programa inteiro ou lança SemanticError.
     */
    analyze(program) {
        this.currentScope = this.globalScope;
        this.visit(program);
    }
    /**
     * Retorna todos os símbolos coletados em todos os escopos durante a análise,
     * como um mapa name → type. Usado pela IDE para hover de tipo.
     */
    getAllSymbols() {
        const result = {};
        const collectScope = (scope) => {
            for (const entry of scope.entries()) {
                if (!(entry.name in result))
                    result[entry.name] = entry.type;
            }
        };
        collectScope(this.globalScope);
        return result;
    }
    /**
     * Visitor principal: despacha pelo tipo de nó (`kind`).
     */
    visit(node) {
        switch (node.kind) {
            case ast_1.NodeKind.Program:
                this.visitProgram(node);
                break;
            case ast_1.NodeKind.VariableDeclaration:
                this.visitVariableDeclaration(node);
                break;
            case ast_1.NodeKind.Assignment:
                this.visitAssignment(node);
                break;
            case ast_1.NodeKind.PrintStatement:
                this.visitPrintStatement(node);
                break;
            case ast_1.NodeKind.IfStatement:
                this.visitIfStatement(node);
                break;
            case ast_1.NodeKind.WhileStatement:
                this.visitWhileStatement(node);
                break;
            case ast_1.NodeKind.BlockStatement:
                this.visitBlockStatement(node);
                break;
            // Expressões puras não aparecem como nós raiz de visit a partir do
            // programa, mas podem ser visitadas no futuro por ferramentas.
            case ast_1.NodeKind.BinaryExpression:
            case ast_1.NodeKind.UnaryExpression:
            case ast_1.NodeKind.Identifier:
            case ast_1.NodeKind.NumberLiteral:
            case ast_1.NodeKind.StringLiteral:
            case ast_1.NodeKind.BooleanLiteral:
                this.inferExpressionType(node);
                break;
            default: {
                const _exhaustive = node;
                void _exhaustive;
            }
        }
    }
    /** Infere o tipo de uma expressão e, como efeito colateral, valida a subárvore. */
    inferExpressionType(expression) {
        switch (expression.kind) {
            case ast_1.NodeKind.NumberLiteral:
                return types_1.ValueType.NUMBER;
            case ast_1.NodeKind.StringLiteral:
                return types_1.ValueType.STRING;
            case ast_1.NodeKind.BooleanLiteral:
                return types_1.ValueType.BOOLEAN;
            case ast_1.NodeKind.Identifier:
                return this.inferIdentifierType(expression);
            case ast_1.NodeKind.UnaryExpression:
                return this.inferUnaryType(expression);
            case ast_1.NodeKind.BinaryExpression:
                return this.inferBinaryType(expression);
            default: {
                const _never = expression;
                void _never;
                return types_1.ValueType.UNKNOWN;
            }
        }
    }
    // ── Programa e statements ───────────────────────────────────────────────
    visitProgram(node) {
        for (const stmt of node.statements) {
            this.visit(stmt);
        }
    }
    visitVariableDeclaration(node) {
        const initType = this.inferExpressionType(node.initializer);
        const { line, column } = this.locOf(node);
        this.currentScope.define(node.name, initType, line, column);
    }
    visitAssignment(node) {
        const { line, column } = this.locOf(node);
        const entry = this.lookupOrThrow(node.name, line, column);
        const rhsType = this.inferExpressionType(node.value);
        this.assertCompatible(entry.type, rhsType, line, column, "atribuição");
    }
    visitPrintStatement(node) {
        // print aceita qualquer tipo bem formado; a inferência valida a expressão
        this.inferExpressionType(node.argument);
    }
    visitIfStatement(node) {
        this.assertBooleanCondition(node.condition, "if", this.locOf(node.condition));
        this.visit(node.consequent);
        if (node.alternate) {
            this.visit(node.alternate);
        }
    }
    visitWhileStatement(node) {
        this.assertBooleanCondition(node.condition, "while", this.locOf(node.condition));
        this.visit(node.body);
    }
    /**
     * Bloco: novo escopo filho do atual; ao sair, restaura o escopo anterior.
     * Garante que `let` dentro de `{ }` não vaze para fora.
     */
    visitBlockStatement(node) {
        const parent = this.currentScope;
        this.currentScope = new symbolTable_1.SymbolTable(parent);
        for (const stmt of node.statements) {
            this.visit(stmt);
        }
        this.currentScope = parent;
    }
    // ── Expressões ──────────────────────────────────────────────────────────
    inferIdentifierType(node) {
        const { line, column } = this.locOf(node);
        const entry = this.lookupOrThrow(node.name, line, column);
        return entry.type;
    }
    inferUnaryType(node) {
        const inner = this.inferExpressionType(node.operand);
        const loc = this.locOf(node);
        if (node.operator === "!") {
            if (inner !== types_1.ValueType.UNKNOWN && inner !== types_1.ValueType.BOOLEAN) {
                throw new semanticError_1.SemanticError(`Operador '!' exige operando do tipo BOOLEAN (encontrado ${inner})`, loc.line, loc.column);
            }
            return types_1.ValueType.BOOLEAN;
        }
        // '-'
        if (inner !== types_1.ValueType.UNKNOWN && inner !== types_1.ValueType.NUMBER) {
            throw new semanticError_1.SemanticError(`Operador '-' unário exige operando numérico (encontrado ${inner})`, loc.line, loc.column);
        }
        return types_1.ValueType.NUMBER;
    }
    inferBinaryType(node) {
        const leftT = this.inferExpressionType(node.left);
        const rightT = this.inferExpressionType(node.right);
        const loc = this.locOf(node);
        const op = node.operator;
        // --- Lógicos ---
        if (op === "&&" || op === "||") {
            this.expectType(leftT, types_1.ValueType.BOOLEAN, loc, `operador '${op}' (lado esquerdo)`);
            this.expectType(rightT, types_1.ValueType.BOOLEAN, loc, `operador '${op}' (lado direito)`);
            return types_1.ValueType.BOOLEAN;
        }
        // --- Igualdade ---
        if (op === "==" || op === "!=") {
            this.assertSameComparableTypes(leftT, rightT, op, loc);
            return types_1.ValueType.BOOLEAN;
        }
        // --- Comparação ordenada ---
        if (op === ">" || op === ">=" || op === "<" || op === "<=") {
            this.assertOrderedComparison(leftT, rightT, op, loc);
            return types_1.ValueType.BOOLEAN;
        }
        // --- Aritmético + (número ou concatenação de strings) ---
        if (op === "+") {
            if (this.isNumericPair(leftT, rightT))
                return types_1.ValueType.NUMBER;
            if (this.isStringPair(leftT, rightT))
                return types_1.ValueType.STRING;
            throw new semanticError_1.SemanticError(`Operador '+' exige dois números ou duas strings (encontrado ${leftT} e ${rightT})`, loc.line, loc.column);
        }
        // --- Aritmético - * / ---
        if (op === "-" || op === "*" || op === "/") {
            this.expectType(leftT, types_1.ValueType.NUMBER, loc, `operador '${op}'`);
            this.expectType(rightT, types_1.ValueType.NUMBER, loc, `operador '${op}'`);
            return types_1.ValueType.NUMBER;
        }
        return types_1.ValueType.UNKNOWN;
    }
    // ── Condições if / while ────────────────────────────────────────────────
    assertBooleanCondition(expr, construct, loc) {
        const t = this.inferExpressionType(expr);
        if (t !== types_1.ValueType.BOOLEAN) {
            throw new semanticError_1.SemanticError(`Condição do '${construct}' deve ser do tipo BOOLEAN (encontrado ${t})`, loc.line, loc.column);
        }
    }
    // ── Tabela de símbolos ──────────────────────────────────────────────────
    lookupOrThrow(name, line, column) {
        const entry = this.currentScope.lookup(name);
        if (!entry) {
            throw new semanticError_1.SemanticError(`Variável '${name}' não declarada`, line, column);
        }
        return entry;
    }
    // ── Regras de tipo ──────────────────────────────────────────────────────
    assertCompatible(target, value, line, column, context) {
        if (target === types_1.ValueType.UNKNOWN || value === types_1.ValueType.UNKNOWN)
            return;
        if (target !== value) {
            throw new semanticError_1.SemanticError(`Tipos incompatíveis na ${context}: variável é ${target}, expressão é ${value}`, line, column);
        }
    }
    expectType(actual, expected, loc, context) {
        if (actual === types_1.ValueType.UNKNOWN)
            return;
        if (actual !== expected) {
            throw new semanticError_1.SemanticError(`${context}: esperado ${expected}, encontrado ${actual}`, loc.line, loc.column);
        }
    }
    assertSameComparableTypes(left, right, op, loc) {
        if (left === types_1.ValueType.UNKNOWN || right === types_1.ValueType.UNKNOWN)
            return;
        if (left !== right) {
            throw new semanticError_1.SemanticError(`Operador '${op}' exige operandos do mesmo tipo (encontrado ${left} e ${right})`, loc.line, loc.column);
        }
    }
    assertOrderedComparison(left, right, op, loc) {
        if (left === types_1.ValueType.UNKNOWN || right === types_1.ValueType.UNKNOWN)
            return;
        const okNumbers = this.isNumericPair(left, right);
        const okStrings = this.isStringPair(left, right);
        if (!okNumbers && !okStrings) {
            throw new semanticError_1.SemanticError(`Operador '${op}' exige dois números ou duas strings (encontrado ${left} e ${right})`, loc.line, loc.column);
        }
    }
    isNumericPair(a, b) {
        return a === types_1.ValueType.NUMBER && b === types_1.ValueType.NUMBER;
    }
    isStringPair(a, b) {
        return a === types_1.ValueType.STRING && b === types_1.ValueType.STRING;
    }
    locOf(node) {
        return node.loc ?? { line: 1, column: 1 };
    }
}
exports.SemanticAnalyzer = SemanticAnalyzer;
//# sourceMappingURL=analyzer.js.map