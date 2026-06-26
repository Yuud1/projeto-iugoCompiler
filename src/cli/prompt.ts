/**
 * prompt.ts — Entrada interativa no terminal (readline)
 */

import * as readline from "readline";
import { gray, cyan, bold, reset, dim } from "./ansi";

let rl: readline.Interface | null = null;

function getRL(): readline.Interface {
  if (!rl) {
    rl = readline.createInterface({
      input:  process.stdin,
      output: process.stdout,
    });
  }
  return rl;
}

export function clearScreen(): void {
  process.stdout.write("\x1b[2J\x1b[H");
}

export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function print(text: string): void {
  console.log(text);
}

export function waitEnter(message = `${dim}Pressione ENTER para continuar...${reset}`): Promise<void> {
  return new Promise((resolve) => {
    getRL().question(`\n${message} `, () => resolve());
  });
}

export function ask(question: string): Promise<string> {
  return new Promise((resolve) => {
    getRL().question(`${cyan}?${reset} ${question} `, (answer) => resolve(answer.trim()));
  });
}

export function closePrompt(): void {
  rl?.close();
  rl = null;
}

/** Menu numérico estilo CLI moderna. */
export async function selectMenu<T extends string>(
  title: string,
  options: { label: string; value: T; hint?: string }[]
): Promise<T> {
  print("");
  print(`${bold}${title}${reset}`);
  print(gray + "─".repeat(40) + reset);
  options.forEach((opt, i) => {
    const hint = opt.hint ? ` ${dim}(${opt.hint})${reset}` : "";
    print(`  ${cyan}${i + 1}.${reset} ${opt.label}${hint}`);
  });
  print("");

  while (true) {
    const raw = await ask(`Escolha [1-${options.length}]:`);
    const n = parseInt(raw, 10);
    if (n >= 1 && n <= options.length) return options[n - 1]!.value;
    print(`${gray}Opção inválida. Digite um número de 1 a ${options.length}.${reset}`);
  }
}

export async function confirm(question: string): Promise<boolean> {
  const raw = await ask(`${question} ${dim}(s/n)${reset}:`);
  return raw.toLowerCase() === "s" || raw.toLowerCase() === "sim" || raw === "";
}

export async function playIntro(render: (frame: number) => void, frames: number, msPerFrame: number): Promise<void> {
  for (let i = 0; i < frames; i++) {
    clearScreen();
    render(i);
    await sleep(msPerFrame);
  }
}
