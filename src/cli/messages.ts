/**
 * messages.ts — Mensagens de fase do compilador (sem mascote ASCII)
 */

import { dim, cyan, reset } from "./ansi";

const MESSAGES: Record<string, string> = {
  welcome:
    "iuGo Compiler — pipeline: Lexer → Parser → Semântica → Optimizer → IR → JS",
  demo:
    "Modo demonstração. Pressione ENTER a cada passo.",
  lexer:
    "Fase 1 — Análise Léxica: transformo o texto em tokens.",
  parser:
    "Fase 2 — Análise Sintática: monto a árvore (AST) do programa.",
  semantic:
    "Fase 3 — Semântica: verifico tipos, escopos e declarações.",
  optimizer:
    "Fase 4 — Otimização: constant folding, dead code e propagação.",
  ir:
    "Fase 5 — IR (TAC): código de três endereços.",
  codegen:
    "Fase 6 — CodeGen: tradução para JavaScript.",
  run:
    "Execução do programa compilado.",
  done:
    "Demonstração concluída.",
  error:
    "Erro nesta fase da compilação.",
};

/** Uma linha de contexto para a fase atual (sem arte ASCII). */
export function phaseMessage(key: keyof typeof MESSAGES | string): string {
  const text = MESSAGES[key] ?? key;
  return `${dim}→${reset} ${cyan}${text}${reset}\n`;
}

export function getMessage(key: keyof typeof MESSAGES): string {
  return MESSAGES[key] ?? key;
}
