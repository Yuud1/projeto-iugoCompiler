"use strict";
/**
 * types.ts — Tipos de valor da linguagem iuGo (camada semântica)
 *
 * ValueType representa o tipo inferido ou armazenado na tabela de símbolos.
 * UNKNOWN é usado quando ainda não há informação suficiente (ex.: erro em cascata).
 *
 * TODO: array type checking — future version
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.ValueType = void 0;
var ValueType;
(function (ValueType) {
    ValueType["NUMBER"] = "NUMBER";
    ValueType["STRING"] = "STRING";
    ValueType["BOOLEAN"] = "BOOLEAN";
    ValueType["UNKNOWN"] = "UNKNOWN";
})(ValueType || (exports.ValueType = ValueType = {}));
//# sourceMappingURL=types.js.map