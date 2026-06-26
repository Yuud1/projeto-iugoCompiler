"use strict";
/**
 * messages.ts — Mensagens de fase do compilador (sem mascote ASCII)
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.phaseMessage = phaseMessage;
exports.getMessage = getMessage;
const ansi_1 = require("./ansi");
const MESSAGES = {
    welcome: "iuGo Compiler — pipeline: Lexer → Parser → Semântica → Optimizer → IR → JS",
    demo: "Modo demonstração. Pressione ENTER a cada passo.",
    lexer: "Fase 1 — Análise Léxica: transformo o texto em tokens.",
    parser: "Fase 2 — Análise Sintática: monto a árvore (AST) do programa.",
    semantic: "Fase 3 — Semântica: verifico tipos, escopos e declarações.",
    optimizer: "Fase 4 — Otimização: constant folding, dead code e propagação.",
    ir: "Fase 5 — IR (TAC): código de três endereços.",
    codegen: "Fase 6 — CodeGen: tradução para JavaScript.",
    run: "Execução do programa compilado.",
    done: "Demonstração concluída.",
    error: "Erro nesta fase da compilação.",
};
/** Uma linha de contexto para a fase atual (sem arte ASCII). */
function phaseMessage(key) {
    const text = MESSAGES[key] ?? key;
    return `${ansi_1.dim}→${ansi_1.reset} ${ansi_1.cyan}${text}${ansi_1.reset}\n`;
}
function getMessage(key) {
    return MESSAGES[key] ?? key;
}
//# sourceMappingURL=messages.js.map