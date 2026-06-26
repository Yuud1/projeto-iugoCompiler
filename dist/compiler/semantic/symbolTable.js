"use strict";
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
Object.defineProperty(exports, "__esModule", { value: true });
exports.SymbolTable = void 0;
const semanticError_1 = require("./semanticError");
class SymbolTable {
    constructor(parent = null) {
        this.symbols = new Map();
        this.parent = parent;
        this.scopeLevel = parent === null ? 0 : parent.scopeLevel + 1;
    }
    /** Verifica se o nome já existe apenas no escopo atual (não sobe ao pai). */
    existsInCurrentScope(name) {
        return this.symbols.has(name);
    }
    /**
     * Registra um símbolo no escopo atual.
     * Lança SemanticError se houver redeclaração no mesmo escopo.
     */
    define(name, type, line, column) {
        if (this.existsInCurrentScope(name)) {
            throw new semanticError_1.SemanticError(`Variável '${name}' já declarada neste escopo`, line, column);
        }
        this.symbols.set(name, {
            name,
            type,
            scopeLevel: this.scopeLevel,
        });
    }
    /**
     * Busca o símbolo no escopo atual e, se não achar, nos pais.
     * Retorna undefined se o nome não existir em nenhum nível.
     */
    lookup(name) {
        const local = this.symbols.get(name);
        if (local !== undefined)
            return local;
        return this.parent?.lookup(name);
    }
    /** Retorna todos os símbolos definidos neste escopo (sem subir ao pai). */
    entries() {
        return [...this.symbols.values()];
    }
}
exports.SymbolTable = SymbolTable;
//# sourceMappingURL=symbolTable.js.map