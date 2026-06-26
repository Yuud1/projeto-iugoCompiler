"use strict";
/**
 * mascot.ts — iuBot: mascote animado do compilador iuGo
 *
 * Estados: idle | blink | think | compile | success | error | wave
 * Usado na intro e em cada fase do modo demonstração.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.renderMascot = renderMascot;
exports.mascotBlock = mascotBlock;
exports.getSpeech = getSpeech;
exports.introSequence = introSequence;
const ansi_1 = require("./ansi");
const FRAMES = {
    idle: [
        `
      ${ansi_1.cyan}    ╭───────╮${ansi_1.reset}
      ${ansi_1.cyan}    │${ansi_1.reset} ${ansi_1.bold}◕${ansi_1.reset}   ${ansi_1.bold}◕${ansi_1.reset} ${ansi_1.cyan}│${ansi_1.reset}
      ${ansi_1.cyan}    │${ansi_1.reset}   ${ansi_1.bold}▿${ansi_1.reset}   ${ansi_1.cyan}│${ansi_1.reset}
      ${ansi_1.cyan}    ╰───┬───╯${ansi_1.reset}
      ${ansi_1.cyan}   ╭───┴───╮${ansi_1.reset}
      ${ansi_1.cyan}   │${ansi_1.reset} ${ansi_1.bold}iuBot${ansi_1.reset} ${ansi_1.cyan}│${ansi_1.reset}
      ${ansi_1.cyan}   ╰───────╯${ansi_1.reset}
    `,
    ],
    blink: [
        `
      ${ansi_1.cyan}    ╭───────╮${ansi_1.reset}
      ${ansi_1.cyan}    │${ansi_1.reset} ${ansi_1.bold}─${ansi_1.reset}     ${ansi_1.bold}─${ansi_1.reset} ${ansi_1.cyan}│${ansi_1.reset}
      ${ansi_1.cyan}    │${ansi_1.reset}   ${ansi_1.bold}▿${ansi_1.reset}   ${ansi_1.cyan}│${ansi_1.reset}
      ${ansi_1.cyan}    ╰───┬───╯${ansi_1.reset}
      ${ansi_1.cyan}   ╭───┴───╮${ansi_1.reset}
      ${ansi_1.cyan}   │${ansi_1.reset} ${ansi_1.bold}iuBot${ansi_1.reset} ${ansi_1.cyan}│${ansi_1.reset}
      ${ansi_1.cyan}   ╰───────╯${ansi_1.reset}
    `,
    ],
    wave: [
        `
      ${ansi_1.cyan}  ${ansi_1.bold}👋${ansi_1.reset} ╭───────╮${ansi_1.reset}
      ${ansi_1.cyan}    │${ansi_1.reset} ${ansi_1.bold}◕${ansi_1.reset}   ${ansi_1.bold}◕${ansi_1.reset} ${ansi_1.cyan}│${ansi_1.reset}
      ${ansi_1.cyan}    │${ansi_1.reset}   ${ansi_1.bold}ω${ansi_1.reset}   ${ansi_1.cyan}│${ansi_1.reset}
      ${ansi_1.cyan}    ╰───┬───╯${ansi_1.reset}
      ${ansi_1.cyan}   ╭───┴───╮${ansi_1.reset}
      ${ansi_1.cyan}   │${ansi_1.reset} ${ansi_1.bold}iuBot${ansi_1.reset} ${ansi_1.cyan}│${ansi_1.reset}
      ${ansi_1.cyan}   ╰───────╯${ansi_1.reset}
    `,
        `
      ${ansi_1.cyan}    ╭───────╮${ansi_1.reset} ${ansi_1.bold}👋${ansi_1.reset}
      ${ansi_1.cyan}    │${ansi_1.reset} ${ansi_1.bold}◕${ansi_1.reset}   ${ansi_1.bold}◕${ansi_1.reset} ${ansi_1.cyan}│${ansi_1.reset}
      ${ansi_1.cyan}    │${ansi_1.reset}   ${ansi_1.bold}ω${ansi_1.reset}   ${ansi_1.cyan}│${ansi_1.reset}
      ${ansi_1.cyan}    ╰───┬───╯${ansi_1.reset}
      ${ansi_1.cyan}   ╭───┴───╮${ansi_1.reset}
      ${ansi_1.cyan}   │${ansi_1.reset} ${ansi_1.bold}iuBot${ansi_1.reset} ${ansi_1.cyan}│${ansi_1.reset}
      ${ansi_1.cyan}   ╰───────╯${ansi_1.reset}
    `,
    ],
    think: [
        `
      ${ansi_1.yellow}    ╭───────╮${ansi_1.reset}
      ${ansi_1.yellow}    │${ansi_1.reset} ${ansi_1.bold}◔${ansi_1.reset}   ${ansi_1.bold}◔${ansi_1.reset} ${ansi_1.yellow}│${ansi_1.reset}
      ${ansi_1.yellow}    │${ansi_1.reset}   ${ansi_1.bold}~${ansi_1.reset}   ${ansi_1.yellow}│${ansi_1.reset}
      ${ansi_1.yellow}    ╰───┬───╯${ansi_1.reset}
      ${ansi_1.yellow}   ╭───┴───╮${ansi_1.reset}  ${ansi_1.dim}...${ansi_1.reset}
      ${ansi_1.yellow}   │${ansi_1.reset} ${ansi_1.bold}iuBot${ansi_1.reset} ${ansi_1.yellow}│${ansi_1.reset}
      ${ansi_1.yellow}   ╰───────╯${ansi_1.reset}
    `,
        `
      ${ansi_1.yellow}    ╭───────╮${ansi_1.reset}
      ${ansi_1.yellow}    │${ansi_1.reset} ${ansi_1.bold}◔${ansi_1.reset}   ${ansi_1.bold}◔${ansi_1.reset} ${ansi_1.yellow}│${ansi_1.reset}
      ${ansi_1.yellow}    │${ansi_1.reset}   ${ansi_1.bold}~${ansi_1.reset}   ${ansi_1.yellow}│${ansi_1.reset}
      ${ansi_1.yellow}    ╰───┬───╯${ansi_1.reset}
      ${ansi_1.yellow}   ╭───┴───╮${ansi_1.reset} ${ansi_1.dim}....${ansi_1.reset}
      ${ansi_1.yellow}   │${ansi_1.reset} ${ansi_1.bold}iuBot${ansi_1.reset} ${ansi_1.yellow}│${ansi_1.reset}
      ${ansi_1.yellow}   ╰───────╯${ansi_1.reset}
    `,
    ],
    compile: [
        `
      ${ansi_1.cyan}    ╭───────╮${ansi_1.reset}
      ${ansi_1.cyan}    │${ansi_1.reset} ${ansi_1.bold}◉${ansi_1.reset}   ${ansi_1.bold}◉${ansi_1.reset} ${ansi_1.cyan}│${ansi_1.reset}
      ${ansi_1.cyan}    │${ansi_1.reset}   ${ansi_1.bold}◡${ansi_1.reset}   ${ansi_1.cyan}│${ansi_1.reset}
      ${ansi_1.cyan}    ╰───┬───╯${ansi_1.reset}
      ${ansi_1.cyan}   ╭───┴───╮${ansi_1.reset}  ${ansi_1.dim}⚙${ansi_1.reset}
      ${ansi_1.cyan}   │${ansi_1.reset} ${ansi_1.bold}iuBot${ansi_1.reset} ${ansi_1.cyan}│${ansi_1.reset}
      ${ansi_1.cyan}   ╰───────╯${ansi_1.reset}
    `,
        `
      ${ansi_1.cyan}    ╭───────╮${ansi_1.reset}
      ${ansi_1.cyan}    │${ansi_1.reset} ${ansi_1.bold}◉${ansi_1.reset}   ${ansi_1.bold}◉${ansi_1.reset} ${ansi_1.cyan}│${ansi_1.reset}
      ${ansi_1.cyan}    │${ansi_1.reset}   ${ansi_1.bold}◡${ansi_1.reset}   ${ansi_1.cyan}│${ansi_1.reset}
      ${ansi_1.cyan}    ╰───┬───╯${ansi_1.reset}
      ${ansi_1.cyan}   ╭───┴───╮${ansi_1.reset} ${ansi_1.dim} ⚙${ansi_1.reset}
      ${ansi_1.cyan}   │${ansi_1.reset} ${ansi_1.bold}iuBot${ansi_1.reset} ${ansi_1.cyan}│${ansi_1.reset}
      ${ansi_1.cyan}   ╰───────╯${ansi_1.reset}
    `,
    ],
    success: [
        `
      ${ansi_1.green}    ╭───────╮${ansi_1.reset}
      ${ansi_1.green}    │${ansi_1.reset} ${ansi_1.bold}^${ansi_1.reset}   ${ansi_1.bold}^${ansi_1.reset} ${ansi_1.green}│${ansi_1.reset}
      ${ansi_1.green}    │${ansi_1.reset}   ${ansi_1.bold}◡${ansi_1.reset}   ${ansi_1.green}│${ansi_1.reset}
      ${ansi_1.green}    ╰───┬───╯${ansi_1.reset}
      ${ansi_1.green}   ╭───┴───╮${ansi_1.reset}  ${ansi_1.green}✓${ansi_1.reset}
      ${ansi_1.green}   │${ansi_1.reset} ${ansi_1.bold}iuBot${ansi_1.reset} ${ansi_1.green}│${ansi_1.reset}
      ${ansi_1.green}   ╰───────╯${ansi_1.reset}
    `,
    ],
    error: [
        `
      ${ansi_1.red}    ╭───────╮${ansi_1.reset}
      ${ansi_1.red}    │${ansi_1.reset} ${ansi_1.bold}×${ansi_1.reset}   ${ansi_1.bold}×${ansi_1.reset} ${ansi_1.red}│${ansi_1.reset}
      ${ansi_1.red}    │${ansi_1.reset}   ${ansi_1.bold}︵${ansi_1.reset}   ${ansi_1.red}│${ansi_1.reset}
      ${ansi_1.red}    ╰───┬───╯${ansi_1.reset}
      ${ansi_1.red}   ╭───┴───╮${ansi_1.reset}
      ${ansi_1.red}   │${ansi_1.reset} ${ansi_1.bold}iuBot${ansi_1.reset} ${ansi_1.red}│${ansi_1.reset}
      ${ansi_1.red}   ╰───────╯${ansi_1.reset}
    `,
    ],
};
const SPEECH = {
    welcome: "Olá! Sou o iuBot — seu guia pelo pipeline do compilador iuGo.",
    demo: "Vamos percorrer cada fase juntos. Pressione ENTER a cada passo.",
    lexer: "Fase 1 — Análise Léxica: transformo o texto em tokens.",
    parser: "Fase 2 — Análise Sintática: monto a árvore (AST) do programa.",
    semantic: "Fase 3 — Semântica: verifico tipos, escopos e declarações.",
    optimizer: "Fase 4 — Otimização: dobro constantes, removo código morto e propago valores.",
    ir: "Fase 5 — IR (TAC): gero código de três endereços — ponte para o código final.",
    codegen: "Fase 6 — CodeGen: traduzo a AST otimizada para JavaScript executável.",
    run: "Hora de executar! Veja a saída do programa compilado.",
    done: "Demonstração concluída. Boa apresentação!",
    error: "Ops! Encontrei um problema nesta fase.",
};
function renderMascot(mood, frameIndex = 0) {
    const frames = FRAMES[mood];
    return frames[frameIndex % frames.length].trim();
}
function mascotBlock(mood, speechKey, frameIndex = 0) {
    const art = renderMascot(mood, frameIndex);
    const speech = SPEECH[speechKey] ?? speechKey;
    const bubble = [
        `  ${ansi_1.dim}╭${"─".repeat(46)}╮${ansi_1.reset}`,
        `  ${ansi_1.dim}│${ansi_1.reset} ${speech.padEnd(46)} ${ansi_1.dim}│${ansi_1.reset}`,
        `  ${ansi_1.dim}╰${"─".repeat(46)}╯${ansi_1.reset}`,
    ].join("\n");
    return `${art}\n${bubble}`;
}
function getSpeech(key) {
    return SPEECH[key] ?? key;
}
/** Retorna frames para animação curta de intro. */
function introSequence() {
    return [
        { mood: "wave", frame: 0, ms: 400 },
        { mood: "wave", frame: 1, ms: 400 },
        { mood: "blink", frame: 0, ms: 200 },
        { mood: "idle", frame: 0, ms: 300 },
        { mood: "idle", frame: 0, ms: 200 },
    ];
}
//# sourceMappingURL=mascot.js.map