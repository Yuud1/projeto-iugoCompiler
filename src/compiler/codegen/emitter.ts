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

const INDENT_UNIT = "  ";

export class Emitter {
  private indentLevel = 0;
  private readonly lines: string[] = [];

  /** Aumenta um nível de indentação (ex.: ao entrar em bloco). */
  pushIndent(): void {
    this.indentLevel++;
  }

  popIndent(): void {
    if (this.indentLevel > 0) this.indentLevel--;
  }

  /** Adiciona uma linha já com indentação atual. */
  emitLine(line: string): void {
    this.lines.push(INDENT_UNIT.repeat(this.indentLevel) + line);
  }

  /** Linha em branco (sem indentação relevante). */
  emitBlank(): void {
    this.lines.push("");
  }

  /** Texto final concatenado com `\n` (sem newline final extra). */
  toString(): string {
    return this.lines.join("\n");
  }

  reset(): void {
    this.indentLevel = 0;
    this.lines.length = 0;
  }
}
