"use strict";
/**
 * introAnimation.ts — Animação de abertura no terminal
 *
 * Inspirado em animações ASCII clássicas da web:
 *   - "line cube" (wireframe rotativo) — ascii.co.uk/animated, estética BBS/retro
 *   - "matrix rain" com caracteres de código — demos de terminal / hacker aesthetic
 *   - Sequência de boot estilo ferramentas CLI modernas (Claude Code, npm, etc.)
 *
 * Referências:
 *   https://ascii.co.uk/animated
 *   https://ascii.co.uk/animated-art/line-cube-animated-ascii-art.html
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.playStartupAnimation = playStartupAnimation;
const ansi_1 = require("./ansi");
/** Cubo wireframe rotativo — 8 frames (animação clássica de terminal). */
const ROTATING_CUBE = [
    `
       ${ansi_1.cyan}+----------+${ansi_1.reset}
      ${ansi_1.cyan}/${ansi_1.reset}          ${ansi_1.cyan}/${ansi_1.reset}|
     ${ansi_1.cyan}/${ansi_1.reset}          ${ansi_1.cyan}/${ansi_1.reset} ${ansi_1.cyan}+${ansi_1.reset}
    ${ansi_1.cyan}/${ansi_1.reset}${ansi_1.cyan}----------${ansi_1.reset}  ${ansi_1.cyan}|${ansi_1.reset}
    ${ansi_1.cyan}|${ansi_1.reset}          ${ansi_1.cyan}|${ansi_1.reset}  ${ansi_1.cyan}+${ansi_1.reset}
    ${ansi_1.cyan}|${ansi_1.reset}          ${ansi_1.cyan}|${ansi_1.reset} ${ansi_1.cyan}/${ansi_1.reset}
    ${ansi_1.cyan}|${ansi_1.reset}          ${ansi_1.cyan}|${ansi_1.reset}${ansi_1.cyan}/${ansi_1.reset}
    ${ansi_1.cyan}+${ansi_1.reset}${ansi_1.cyan}----------+${ansi_1.reset}${ansi_1.cyan}/${ansi_1.reset}
  `,
    `
       ${ansi_1.cyan}.----------.${ansi_1.reset}
      ${ansi_1.cyan}/${ansi_1.reset}          ${ansi_1.cyan}/${ansi_1.reset} ${ansi_1.cyan}|${ansi_1.reset}
     ${ansi_1.cyan}+${ansi_1.reset}          ${ansi_1.cyan}+${ansi_1.reset} ${ansi_1.cyan}|${ansi_1.reset}
     ${ansi_1.cyan}|${ansi_1.reset}          ${ansi_1.cyan}|${ansi_1.reset} ${ansi_1.cyan}|${ansi_1.reset}
     ${ansi_1.cyan}|${ansi_1.reset}          ${ansi_1.cyan}|${ansi_1.reset} ${ansi_1.cyan}+${ansi_1.reset}
     ${ansi_1.cyan}|${ansi_1.reset}          ${ansi_1.cyan}|${ansi_1.reset} ${ansi_1.cyan}/${ansi_1.reset}
     ${ansi_1.cyan}+${ansi_1.reset}${ansi_1.cyan}----------+${ansi_1.reset} ${ansi_1.cyan}/${ansi_1.reset}
  `,
    `
      ${ansi_1.cyan}+----------+${ansi_1.reset}
      ${ansi_1.cyan}|${ansi_1.reset}          ${ansi_1.cyan}|${ansi_1.reset}
      ${ansi_1.cyan}|${ansi_1.reset}          ${ansi_1.cyan}|${ansi_1.reset}
      ${ansi_1.cyan}|${ansi_1.reset}          ${ansi_1.cyan}|${ansi_1.reset}
      ${ansi_1.cyan}|${ansi_1.reset}          ${ansi_1.cyan}|${ansi_1.reset}
      ${ansi_1.cyan}|${ansi_1.reset}          ${ansi_1.cyan}|${ansi_1.reset}
      ${ansi_1.cyan}+${ansi_1.reset}${ansi_1.cyan}----------+${ansi_1.reset}
  `,
    `
       ${ansi_1.cyan}+----------+${ansi_1.reset}
       ${ansi_1.cyan}|${ansi_1.reset}          ${ansi_1.cyan}|${ansi_1.reset}
       ${ansi_1.cyan}|${ansi_1.reset}          ${ansi_1.cyan}|${ansi_1.reset}
       ${ansi_1.cyan}+${ansi_1.reset}${ansi_1.cyan}----------+${ansi_1.reset}
      ${ansi_1.cyan}/${ansi_1.reset}          ${ansi_1.cyan}/${ansi_1.reset}
     ${ansi_1.cyan}/${ansi_1.reset}          ${ansi_1.cyan}/${ansi_1.reset}
    ${ansi_1.cyan}/${ansi_1.reset}          ${ansi_1.cyan}/${ansi_1.reset}
  `,
    `
       ${ansi_1.cyan}+----------+${ansi_1.reset}
      ${ansi_1.cyan}/${ansi_1.reset}          ${ansi_1.cyan}\\${ansi_1.reset}
     ${ansi_1.cyan}/${ansi_1.reset}          ${ansi_1.cyan}\\${ansi_1.reset}
    ${ansi_1.cyan}/${ansi_1.reset}          ${ansi_1.cyan}\\${ansi_1.reset}
    ${ansi_1.cyan}\\${ansi_1.reset}${ansi_1.cyan}----------${ansi_1.reset}
     ${ansi_1.cyan}\\${ansi_1.reset}          ${ansi_1.cyan}\\${ansi_1.reset}
      ${ansi_1.cyan}\\${ansi_1.reset}          ${ansi_1.cyan}\\${ansi_1.reset}
       ${ansi_1.cyan}\\${ansi_1.reset}${ansi_1.cyan}----------${ansi_1.reset}
  `,
    `
       ${ansi_1.cyan}.----------.${ansi_1.reset}
      ${ansi_1.cyan}\\${ansi_1.reset}          ${ansi_1.cyan}\\${ansi_1.reset}
     ${ansi_1.cyan}+${ansi_1.reset}          ${ansi_1.cyan}+${ansi_1.reset}
     ${ansi_1.cyan}|${ansi_1.reset}          ${ansi_1.cyan}|${ansi_1.reset}
     ${ansi_1.cyan}|${ansi_1.reset}          ${ansi_1.cyan}+${ansi_1.reset}
     ${ansi_1.cyan}|${ansi_1.reset}         ${ansi_1.cyan}/${ansi_1.reset}
     ${ansi_1.cyan}+${ansi_1.reset}${ansi_1.cyan}----------+${ansi_1.reset}
  `,
    `
      ${ansi_1.cyan}+----------+${ansi_1.reset}
      ${ansi_1.cyan}|${ansi_1.reset}          ${ansi_1.cyan}|${ansi_1.reset}
      ${ansi_1.cyan}|${ansi_1.reset}          ${ansi_1.cyan}|${ansi_1.reset}
      ${ansi_1.cyan}|${ansi_1.reset}          ${ansi_1.cyan}|${ansi_1.reset}
      ${ansi_1.cyan}|${ansi_1.reset}          ${ansi_1.cyan}|${ansi_1.reset}
      ${ansi_1.cyan}|${ansi_1.reset}          ${ansi_1.cyan}|${ansi_1.reset}
      ${ansi_1.cyan}+${ansi_1.reset}${ansi_1.cyan}----------+${ansi_1.reset}
  `,
    `
       ${ansi_1.cyan}+----------+${ansi_1.reset}
      ${ansi_1.cyan}/${ansi_1.reset}          ${ansi_1.cyan}/${ansi_1.reset}
     ${ansi_1.cyan}/${ansi_1.reset}          ${ansi_1.cyan}/${ansi_1.reset}
    ${ansi_1.cyan}/${ansi_1.reset}          ${ansi_1.cyan}/${ansi_1.reset}
    ${ansi_1.cyan}+${ansi_1.reset}${ansi_1.cyan}----------+${ansi_1.reset}
    ${ansi_1.cyan}|${ansi_1.reset}          ${ansi_1.cyan}|${ansi_1.reset}
    ${ansi_1.cyan}|${ansi_1.reset}          ${ansi_1.cyan}|${ansi_1.reset}
    ${ansi_1.cyan}|${ansi_1.reset}          ${ansi_1.cyan}|${ansi_1.reset}
  `,
];
const IUGO_LOGO = `
${ansi_1.bold}${ansi_1.cyan}  ██╗ ██╗   ██╗ ${ansi_1.magenta} ██████╗  ██████╗ ${ansi_1.reset}
${ansi_1.bold}${ansi_1.cyan}  ██║ ██║   ██║ ${ansi_1.magenta}██╔═══██╗██╔════╝ ${ansi_1.reset}
${ansi_1.bold}${ansi_1.cyan}  ██║ ██║   ██║ ${ansi_1.magenta}██║   ██║██║  ███╗${ansi_1.reset}
${ansi_1.bold}${ansi_1.cyan}  ██║ ██║   ██║ ${ansi_1.magenta}██║   ██║██║   ██║${ansi_1.reset}
${ansi_1.bold}${ansi_1.cyan}  ██║ ╚██████╔╝ ${ansi_1.magenta}╚██████╔╝╚██████╔╝${ansi_1.reset}
${ansi_1.bold}${ansi_1.cyan}  ╚═╝  ╚═════╝  ${ansi_1.magenta} ╚═════╝  ╚═════╝ ${ansi_1.reset}
${ansi_1.dim}        Mini-Compilador Acadêmico · TypeScript${ansi_1.reset}
`;
/** Caracteres estilo "matrix rain" com tokens da linguagem iuGo. */
const RAIN_CHARS = "01{}();=+-let print if while true false".split("");
const BRAILLE_SPINNER = ["⠋", "⠙", "⠹", "⠸", "⠼", "⠴", "⠦", "⠧", "⠇", "⠏"];
const BOOT_LINES = [
    { text: "Carregando analisador léxico", color: ansi_1.cyan },
    { text: "Inicializando parser recursivo", color: ansi_1.cyan },
    { text: "Montando tabela de símbolos", color: ansi_1.yellow },
    { text: "Ativando otimizador de AST", color: ansi_1.yellow },
    { text: "Preparando gerador IR (TAC)", color: ansi_1.magenta },
    { text: "Code generator pronto", color: ansi_1.green },
];
function generateRainFrame(tick, cols = 14, rows = 6) {
    const lines = [];
    for (let r = 0; r < rows; r++) {
        let line = "    ";
        for (let c = 0; c < cols; c++) {
            const n = (tick * 3 + r * 7 + c * 11) % RAIN_CHARS.length;
            const ch = RAIN_CHARS[n];
            const bright = (tick + r + c) % 3 === 0;
            line += bright ? `${ansi_1.green}${ch}${ansi_1.reset}` : `${ansi_1.dim}${ch}${ansi_1.reset}`;
        }
        lines.push(line);
    }
    return lines.join("\n");
}
/**
 * Animação completa de startup (~4s):
 *   1. Matrix rain com tokens iuGo
 *   2. Cubo wireframe rotativo + logo
 *   3. Linhas de boot com spinner Braille
 */
async function playStartupAnimation(cb) {
    const { clearScreen, print, sleep } = cb;
    // ── Fase 1: Matrix rain (12 frames) ─────────────────────────────────────
    for (let tick = 0; tick < 12; tick++) {
        clearScreen();
        print(`${ansi_1.dim}╔${"═".repeat(50)}╗${ansi_1.reset}`);
        print(`${ansi_1.dim}║${ansi_1.reset}  ${ansi_1.bold}${ansi_1.cyan}iuGo Compiler${ansi_1.reset} ${ansi_1.dim}— inicializando...${" ".repeat(22)}║${ansi_1.reset}`);
        print(`${ansi_1.dim}╚${"═".repeat(50)}╝${ansi_1.reset}\n`);
        print(generateRainFrame(tick));
        print(`\n${ansi_1.dim}  decodificando pipeline de compilação${".".repeat(tick % 4)}${ansi_1.reset}`);
        await sleep(70);
    }
    // ── Fase 2: Cubo rotativo + logo (2 ciclos) ─────────────────────────────
    for (let cycle = 0; cycle < 2; cycle++) {
        for (let i = 0; i < ROTATING_CUBE.length; i++) {
            clearScreen();
            print(IUGO_LOGO);
            print(ROTATING_CUBE[i].trim());
            print(`\n${ansi_1.dim}  wireframe loader · frame ${i + 1}/${ROTATING_CUBE.length}${ansi_1.reset}`);
            await sleep(90);
        }
    }
    // ── Fase 3: Boot sequence com spinner Braille ───────────────────────────
    for (let i = 0; i < BOOT_LINES.length; i++) {
        const line = BOOT_LINES[i];
        for (let s = 0; s < 4; s++) {
            clearScreen();
            print(IUGO_LOGO);
            print("");
            for (let j = 0; j < BOOT_LINES.length; j++) {
                const item = BOOT_LINES[j];
                if (j < i) {
                    print(`  ${ansi_1.green}✓${ansi_1.reset} ${item.color}${item.text}${ansi_1.reset}`);
                }
                else if (j === i) {
                    const spin = BRAILLE_SPINNER[(s + i) % BRAILLE_SPINNER.length];
                    print(`  ${ansi_1.cyan}${spin}${ansi_1.reset} ${item.color}${item.text}${ansi_1.reset}${ansi_1.dim}...${ansi_1.reset}`);
                }
                else {
                    print(`  ${ansi_1.dim}○ ${item.text}${ansi_1.reset}`);
                }
            }
            await sleep(120);
        }
    }
    clearScreen();
}
//# sourceMappingURL=introAnimation.js.map