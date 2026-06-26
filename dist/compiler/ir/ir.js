"use strict";
/**
 * ir.ts — Representação Intermediária (IR) do compilador iuGo
 *
 * Implementa Three-Address Code (TAC / 3AC) — representação clássica
 * usada em compiladores reais (GCC GIMPLE, LLVM IR, JVM bytecode).
 *
 * Cada instrução tem no máximo três "endereços" (operandos):
 *
 *   dest = src1  operator  src2
 *
 * Um "endereço" (place) pode ser:
 *   - Nome de variável do programa: x, idade
 *   - Temporário gerado pelo compilador: t0, t1, t2, …
 *   - Constante literal: 20, "Maior", true
 *
 * ── Formato textual de cada instrução ──────────────────────────────────────
 *
 *   assign     t0 = 20               (cópia / literal)
 *   binop      t1 = idade + 1        (operação binária)
 *   unop       t2 = -x               (operação unária)
 *   label      L0:                   (rótulo de destino para saltos)
 *   jump       goto L0               (salto incondicional)
 *   iffalse    iffalse t1 goto L2    (salto condicional — se falso, salta)
 *   print      print t0              (instrução de saída)
 *
 * ── Exemplo completo ────────────────────────────────────────────────────────
 *
 * Fonte iuGo:
 *   let idade = 20;
 *   if (idade >= 18) { print("Maior"); }
 *
 * TAC gerado:
 *   idade = 20
 *   t0 = idade >= 18
 *   iffalse t0 goto L0
 *   print "Maior"
 *   L0:
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.formatIR = formatIR;
// ── Formatação textual ─────────────────────────────────────────────────────
/**
 * Converte o IRProgram em texto legível para exibição na IDE.
 * Labels ficam alinhados à esquerda; demais instruções são indentadas.
 */
function formatIR(program) {
    const lines = [
        '; Three-Address Code (TAC) — iuGo Compiler',
        '; Fase intermediária entre a AST otimizada e a geração de código final',
        '',
    ];
    for (const instr of program.instructions) {
        switch (instr.kind) {
            case 'assign':
                lines.push(`    ${instr.dest} = ${instr.src}`);
                break;
            case 'binop':
                lines.push(`    ${instr.dest} = ${instr.left} ${instr.op} ${instr.right}`);
                break;
            case 'unop':
                lines.push(`    ${instr.dest} = ${instr.op}${instr.operand}`);
                break;
            case 'label':
                lines.push(`${instr.name}:`);
                break;
            case 'jump':
                lines.push(`    goto ${instr.target}`);
                break;
            case 'iffalse':
                lines.push(`    iffalse ${instr.cond} goto ${instr.target}`);
                break;
            case 'print':
                lines.push(`    print ${instr.value}`);
                break;
        }
    }
    return lines.join('\n');
}
//# sourceMappingURL=ir.js.map