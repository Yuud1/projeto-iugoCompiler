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

import { cyan, green, yellow, magenta, dim, bold, reset } from "./ansi";

/** Cubo wireframe rotativo — 8 frames (animação clássica de terminal). */
const ROTATING_CUBE: string[] = [
  `
       ${cyan}+----------+${reset}
      ${cyan}/${reset}          ${cyan}/${reset}|
     ${cyan}/${reset}          ${cyan}/${reset} ${cyan}+${reset}
    ${cyan}/${reset}${cyan}----------${reset}  ${cyan}|${reset}
    ${cyan}|${reset}          ${cyan}|${reset}  ${cyan}+${reset}
    ${cyan}|${reset}          ${cyan}|${reset} ${cyan}/${reset}
    ${cyan}|${reset}          ${cyan}|${reset}${cyan}/${reset}
    ${cyan}+${reset}${cyan}----------+${reset}${cyan}/${reset}
  `,
  `
       ${cyan}.----------.${reset}
      ${cyan}/${reset}          ${cyan}/${reset} ${cyan}|${reset}
     ${cyan}+${reset}          ${cyan}+${reset} ${cyan}|${reset}
     ${cyan}|${reset}          ${cyan}|${reset} ${cyan}|${reset}
     ${cyan}|${reset}          ${cyan}|${reset} ${cyan}+${reset}
     ${cyan}|${reset}          ${cyan}|${reset} ${cyan}/${reset}
     ${cyan}+${reset}${cyan}----------+${reset} ${cyan}/${reset}
  `,
  `
      ${cyan}+----------+${reset}
      ${cyan}|${reset}          ${cyan}|${reset}
      ${cyan}|${reset}          ${cyan}|${reset}
      ${cyan}|${reset}          ${cyan}|${reset}
      ${cyan}|${reset}          ${cyan}|${reset}
      ${cyan}|${reset}          ${cyan}|${reset}
      ${cyan}+${reset}${cyan}----------+${reset}
  `,
  `
       ${cyan}+----------+${reset}
       ${cyan}|${reset}          ${cyan}|${reset}
       ${cyan}|${reset}          ${cyan}|${reset}
       ${cyan}+${reset}${cyan}----------+${reset}
      ${cyan}/${reset}          ${cyan}/${reset}
     ${cyan}/${reset}          ${cyan}/${reset}
    ${cyan}/${reset}          ${cyan}/${reset}
  `,
  `
       ${cyan}+----------+${reset}
      ${cyan}/${reset}          ${cyan}\\${reset}
     ${cyan}/${reset}          ${cyan}\\${reset}
    ${cyan}/${reset}          ${cyan}\\${reset}
    ${cyan}\\${reset}${cyan}----------${reset}
     ${cyan}\\${reset}          ${cyan}\\${reset}
      ${cyan}\\${reset}          ${cyan}\\${reset}
       ${cyan}\\${reset}${cyan}----------${reset}
  `,
  `
       ${cyan}.----------.${reset}
      ${cyan}\\${reset}          ${cyan}\\${reset}
     ${cyan}+${reset}          ${cyan}+${reset}
     ${cyan}|${reset}          ${cyan}|${reset}
     ${cyan}|${reset}          ${cyan}+${reset}
     ${cyan}|${reset}         ${cyan}/${reset}
     ${cyan}+${reset}${cyan}----------+${reset}
  `,
  `
      ${cyan}+----------+${reset}
      ${cyan}|${reset}          ${cyan}|${reset}
      ${cyan}|${reset}          ${cyan}|${reset}
      ${cyan}|${reset}          ${cyan}|${reset}
      ${cyan}|${reset}          ${cyan}|${reset}
      ${cyan}|${reset}          ${cyan}|${reset}
      ${cyan}+${reset}${cyan}----------+${reset}
  `,
  `
       ${cyan}+----------+${reset}
      ${cyan}/${reset}          ${cyan}/${reset}
     ${cyan}/${reset}          ${cyan}/${reset}
    ${cyan}/${reset}          ${cyan}/${reset}
    ${cyan}+${reset}${cyan}----------+${reset}
    ${cyan}|${reset}          ${cyan}|${reset}
    ${cyan}|${reset}          ${cyan}|${reset}
    ${cyan}|${reset}          ${cyan}|${reset}
  `,
];

const IUGO_LOGO = `
${bold}${cyan}  ██╗ ██╗   ██╗ ${magenta} ██████╗  ██████╗ ${reset}
${bold}${cyan}  ██║ ██║   ██║ ${magenta}██╔═══██╗██╔════╝ ${reset}
${bold}${cyan}  ██║ ██║   ██║ ${magenta}██║   ██║██║  ███╗${reset}
${bold}${cyan}  ██║ ██║   ██║ ${magenta}██║   ██║██║   ██║${reset}
${bold}${cyan}  ██║ ╚██████╔╝ ${magenta}╚██████╔╝╚██████╔╝${reset}
${bold}${cyan}  ╚═╝  ╚═════╝  ${magenta} ╚═════╝  ╚═════╝ ${reset}
${dim}        Mini-Compilador Acadêmico · TypeScript${reset}
`;

/** Caracteres estilo "matrix rain" com tokens da linguagem iuGo. */
const RAIN_CHARS = "01{}();=+-let print if while true false".split("");

const BRAILLE_SPINNER = ["⠋", "⠙", "⠹", "⠸", "⠼", "⠴", "⠦", "⠧", "⠇", "⠏"];

const BOOT_LINES = [
  { text: "Carregando analisador léxico",      color: cyan },
  { text: "Inicializando parser recursivo",    color: cyan },
  { text: "Montando tabela de símbolos",       color: yellow },
  { text: "Ativando otimizador de AST",        color: yellow },
  { text: "Preparando gerador IR (TAC)",       color: magenta },
  { text: "Code generator pronto",             color: green },
];

function generateRainFrame(tick: number, cols = 14, rows = 6): string {
  const lines: string[] = [];
  for (let r = 0; r < rows; r++) {
    let line = "    ";
    for (let c = 0; c < cols; c++) {
      const n = (tick * 3 + r * 7 + c * 11) % RAIN_CHARS.length;
      const ch = RAIN_CHARS[n]!;
      const bright = (tick + r + c) % 3 === 0;
      line += bright ? `${green}${ch}${reset}` : `${dim}${ch}${reset}`;
    }
    lines.push(line);
  }
  return lines.join("\n");
}

export interface IntroCallbacks {
  clearScreen: () => void;
  print: (text: string) => void;
  sleep: (ms: number) => Promise<void>;
}

/**
 * Animação completa de startup (~4s):
 *   1. Matrix rain com tokens iuGo
 *   2. Cubo wireframe rotativo + logo
 *   3. Linhas de boot com spinner Braille
 */
export async function playStartupAnimation(cb: IntroCallbacks): Promise<void> {
  const { clearScreen, print, sleep } = cb;

  // ── Fase 1: Matrix rain (12 frames) ─────────────────────────────────────
  for (let tick = 0; tick < 12; tick++) {
    clearScreen();
    print(`${dim}╔${"═".repeat(50)}╗${reset}`);
    print(`${dim}║${reset}  ${bold}${cyan}iuGo Compiler${reset} ${dim}— inicializando...${" ".repeat(22)}║${reset}`);
    print(`${dim}╚${"═".repeat(50)}╝${reset}\n`);
    print(generateRainFrame(tick));
    print(`\n${dim}  decodificando pipeline de compilação${".".repeat(tick % 4)}${reset}`);
    await sleep(70);
  }

  // ── Fase 2: Cubo rotativo + logo (2 ciclos) ─────────────────────────────
  for (let cycle = 0; cycle < 2; cycle++) {
    for (let i = 0; i < ROTATING_CUBE.length; i++) {
      clearScreen();
      print(IUGO_LOGO);
      print(ROTATING_CUBE[i]!.trim());
      print(`\n${dim}  wireframe loader · frame ${i + 1}/${ROTATING_CUBE.length}${reset}`);
      await sleep(90);
    }
  }

  // ── Fase 3: Boot sequence com spinner Braille ───────────────────────────
  for (let i = 0; i < BOOT_LINES.length; i++) {
    const line = BOOT_LINES[i]!;
    for (let s = 0; s < 4; s++) {
      clearScreen();
      print(IUGO_LOGO);
      print("");
      for (let j = 0; j < BOOT_LINES.length; j++) {
        const item = BOOT_LINES[j]!;
        if (j < i) {
          print(`  ${green}✓${reset} ${item.color}${item.text}${reset}`);
        } else if (j === i) {
          const spin = BRAILLE_SPINNER[(s + i) % BRAILLE_SPINNER.length];
          print(`  ${cyan}${spin}${reset} ${item.color}${item.text}${reset}${dim}...${reset}`);
        } else {
          print(`  ${dim}○ ${item.text}${reset}`);
        }
      }
      await sleep(120);
    }
  }

  clearScreen();
}
