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
export declare class Emitter {
    private indentLevel;
    private readonly lines;
    /** Aumenta um nível de indentação (ex.: ao entrar em bloco). */
    pushIndent(): void;
    popIndent(): void;
    /** Adiciona uma linha já com indentação atual. */
    emitLine(line: string): void;
    /** Linha em branco (sem indentação relevante). */
    emitBlank(): void;
    /** Texto final concatenado com `\n` (sem newline final extra). */
    toString(): string;
    reset(): void;
}
//# sourceMappingURL=emitter.d.ts.map