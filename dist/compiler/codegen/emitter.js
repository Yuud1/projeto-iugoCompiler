"use strict";
/**
 * emitter.ts — Saída de texto com indentação (2 espaços por nível)
 *
 * O CodeGenerator delega a formatação ao Emitter para:
 *   - manter indentação consistente;
 *   - centralizar quebras de linha;
 *   - facilitar futuros alvos (bytecode textual, IR, etc.).
 *
 * TODO: bytecode backend
 * TODO: source maps (mapear linhas iuGo → JS)
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.Emitter = void 0;
const INDENT_UNIT = "  ";
class Emitter {
    constructor() {
        this.indentLevel = 0;
        this.lines = [];
    }
    /** Aumenta um nível de indentação (ex.: ao entrar em bloco). */
    pushIndent() {
        this.indentLevel++;
    }
    popIndent() {
        if (this.indentLevel > 0)
            this.indentLevel--;
    }
    /** Adiciona uma linha já com indentação atual. */
    emitLine(line) {
        this.lines.push(INDENT_UNIT.repeat(this.indentLevel) + line);
    }
    /** Linha em branco (sem indentação relevante). */
    emitBlank() {
        this.lines.push("");
    }
    /** Texto final concatenado com `\n` (sem newline final extra). */
    toString() {
        return this.lines.join("\n");
    }
    reset() {
        this.indentLevel = 0;
        this.lines.length = 0;
    }
}
exports.Emitter = Emitter;
//# sourceMappingURL=emitter.js.map