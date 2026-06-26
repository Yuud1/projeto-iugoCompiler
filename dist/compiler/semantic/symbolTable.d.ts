/**
 * symbolTable.ts — Tabela de símbolos com escopos aninhados (cadeia pai)
 *
 * Cada instância representa um escopo léxico (global, bloco de if, while, etc.).
 * Escopos internos apontam para o escopo pai via `parent`.
 *
 * Exemplo de uso (escopos aninhados):
 *
 *   const global = new SymbolTable();
 *   global.define("x", ValueType.NUMBER, 1, 1);
 *
 *   const local = new SymbolTable(global);
 *   local.define("y", ValueType.STRING, 2, 5);
 *   local.lookup("x");  // encontra no pai
 *   local.lookup("y");  // encontra no escopo atual
 *
 * TODO: function scope support — Sprint 6
 */
import { ValueType } from "./types";
/** Entrada na tabela de símbolos de um escopo. */
export interface SymbolEntry {
    name: string;
    type: ValueType;
    /** 0 = global, 1 = primeiro bloco aninhado, … */
    scopeLevel: number;
}
export declare class SymbolTable {
    readonly parent: SymbolTable | null;
    readonly scopeLevel: number;
    private readonly symbols;
    constructor(parent?: SymbolTable | null);
    /** Verifica se o nome já existe apenas no escopo atual (não sobe ao pai). */
    existsInCurrentScope(name: string): boolean;
    /**
     * Registra um símbolo no escopo atual.
     * Lança SemanticError se houver redeclaração no mesmo escopo.
     */
    define(name: string, type: ValueType, line: number, column: number): void;
    /**
     * Busca o símbolo no escopo atual e, se não achar, nos pais.
     * Retorna undefined se o nome não existir em nenhum nível.
     */
    lookup(name: string): SymbolEntry | undefined;
    /** Retorna todos os símbolos definidos neste escopo (sem subir ao pai). */
    entries(): SymbolEntry[];
}
//# sourceMappingURL=symbolTable.d.ts.map