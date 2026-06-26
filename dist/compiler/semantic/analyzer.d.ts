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
import { ASTNode, ProgramNode, ExpressionNode } from "../parser/ast";
import { ValueType } from "./types";
export declare class SemanticAnalyzer {
    private readonly globalScope;
    private currentScope;
    constructor();
    /**
     * Ponto de entrada: valida o programa inteiro ou lança SemanticError.
     */
    analyze(program: ProgramNode): void;
    /**
     * Retorna todos os símbolos coletados em todos os escopos durante a análise,
     * como um mapa name → type. Usado pela IDE para hover de tipo.
     */
    getAllSymbols(): Record<string, string>;
    /**
     * Visitor principal: despacha pelo tipo de nó (`kind`).
     */
    visit(node: ASTNode): void;
    /** Infere o tipo de uma expressão e, como efeito colateral, valida a subárvore. */
    inferExpressionType(expression: ExpressionNode): ValueType;
    private visitProgram;
    private visitVariableDeclaration;
    private visitAssignment;
    private visitPrintStatement;
    private visitIfStatement;
    private visitWhileStatement;
    /**
     * Bloco: novo escopo filho do atual; ao sair, restaura o escopo anterior.
     * Garante que `let` dentro de `{ }` não vaze para fora.
     */
    private visitBlockStatement;
    private inferIdentifierType;
    private inferUnaryType;
    private inferBinaryType;
    private assertBooleanCondition;
    private lookupOrThrow;
    private assertCompatible;
    private expectType;
    private assertSameComparableTypes;
    private assertOrderedComparison;
    private isNumericPair;
    private isStringPair;
    private locOf;
}
//# sourceMappingURL=analyzer.d.ts.map