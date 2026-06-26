/**
 * index.ts — CLI interativa do iuGo Compiler (estilo assistente terminal)
 *
 * Uso:
 *   npm start              → menu interativo com animação de abertura
 *   npm start -- --no-intro → pula animação
 *   npm run demo           → demonstração passo a passo direto
 *   npm start -- --file examples/idade.iugo
 *   npm start -- --demo --file examples/fold.iugo
 */

import * as fs from "fs";
import * as path from "path";
import { spawnSync } from "child_process";
import { banner, bold, cyan, dim, green, gray, reset } from "./ansi";
import { phaseMessage } from "./messages";
import { playStartupAnimation } from "./introAnimation";
import {
  clearScreen,
  waitEnter,
  print,
  selectMenu,
  ask,
  closePrompt,
  sleep,
} from "./prompt";
import { compileSource } from "./pipeline";
import { runDemo } from "./demo";
import {
  printSource,
  printTokens,
  printAST,
  printSemantic,
  printOptimizer,
  printIR,
  printCodegen,
  printError,
  printRunOutput,
} from "./presenter";

const EXAMPLES_DIR = path.join(process.cwd(), "examples");
const OUTPUT_JS    = path.join(process.cwd(), "dist", "output.js");

const DEFAULT_SOURCE = `
let idade = 20;
print(idade);

if (idade >= 18) {
    print("Maior");
}

while (idade < 30) {
    idade = idade + 1;
}
`.trim();

// ── Intro animada ─────────────────────────────────────────────────────────

async function playIntro(): Promise<void> {
  await playStartupAnimation({ clearScreen, print, sleep });
}

// ── Compilação rápida (sem passo a passo) ───────────────────────────────

function quickCompile(source: string, runAfter = true): void {
  print("");
  printSource(source);
  const result = compileSource(source);

  if (result.errors.length > 0) {
    result.errors.forEach(printError);
    print(phaseMessage("error"));
    return;
  }

  printTokens(result);
  if (result.ast) printAST(result.ast, "AST");
  printSemantic(result);
  if (result.ast && result.optimizedAst) {
    printOptimizer(result, result.ast);
    printAST(result.optimizedAst, "AST otimizada");
  }
  printIR(result);
  printCodegen(result);

  const outDir = path.dirname(OUTPUT_JS);
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });
  fs.writeFileSync(OUTPUT_JS, result.generatedCode, "utf8");
  print(`${green}✓${reset} Gravado: ${OUTPUT_JS}\n`);

  if (runAfter) {
    const proc = spawnSync("node", [OUTPUT_JS], { encoding: "utf8" });
    printRunOutput(proc.stdout ?? "", proc.stderr ?? "", proc.status ?? 1);
  }
}

// ── Exemplos ──────────────────────────────────────────────────────────────

interface ExampleFile {
  name: string;
  file: string;
  description: string;
}

function listExamples(): ExampleFile[] {
  if (!fs.existsSync(EXAMPLES_DIR)) return [];
  return fs
    .readdirSync(EXAMPLES_DIR)
    .filter((f) => f.endsWith(".iugo"))
    .map((file) => {
      const base = file.replace(".iugo", "");
      const descriptions: Record<string, string> = {
        idade:          "Programa completo — demo principal",
        fold:           "Constant folding — 2 + 3 * 4",
        propagacao:     "Propagação — let x = 5; print(x)",
        "dead-code":    "Dead code — if (false) { ... }",
        "erro-semantico": "Erro — variável não declarada",
      };
      return {
        name: base,
        file: path.join(EXAMPLES_DIR, file),
        description: descriptions[base] ?? "Exemplo iuGo",
      };
    });
}

async function pickExample(): Promise<{ source: string; label: string } | null> {
  const examples = listExamples();
  if (examples.length === 0) {
    print(`${gray}Nenhum exemplo em examples/*.iugo${reset}`);
    return null;
  }
  const choice = await selectMenu(
    "Escolha um exemplo:",
    examples.map((e) => ({
      label: `${e.name} — ${e.description}`,
      value: e.file,
    }))
  );
  const source = fs.readFileSync(choice, "utf8");
  return { source, label: path.basename(choice) };
}

// ── Menu principal ────────────────────────────────────────────────────────

async function mainMenu(): Promise<void> {
  while (true) {
    clearScreen();
    print(banner("iuGo Compiler CLI", "Mini-compilador acadêmico"));
    print("");
    print(phaseMessage("welcome"));
    print("");

    const action = await selectMenu("O que deseja fazer?", [
      { label: "Modo demonstração (passo a passo)", value: "demo" as const, hint: "apresentação" },
      { label: "Compilar arquivo .iugo",           value: "file" as const },
      { label: "Digitar código inline",            value: "inline" as const },
      { label: "Usar exemplo pronto",              value: "example" as const },
      { label: "Compilação rápida (pipeline completo)", value: "quick" as const },
      { label: "Sobre o projeto",                  value: "about" as const },
      { label: "Sair",                             value: "exit" as const },
    ]);

    switch (action) {
      case "demo": {
        const ex = await pickExample();
        const source = ex?.source ?? DEFAULT_SOURCE;
        const label  = ex?.label ?? "programa padrão";
        await runDemo(source, label);
        break;
      }
      case "file": {
        const p = await ask("Caminho do arquivo .iugo:");
        if (!fs.existsSync(p)) {
          print(`${gray}Arquivo não encontrado: ${p}${reset}`);
          await waitEnter();
          break;
        }
        quickCompile(fs.readFileSync(p, "utf8"));
        await waitEnter();
        break;
      }
      case "inline": {
        print(`${dim}Digite o código iuGo (linha vazia + ENTER para compilar):${reset}`);
        const lines: string[] = [];
        while (true) {
          const line = await ask("");
          if (line === "" && lines.length > 0) break;
          lines.push(line);
        }
        quickCompile(lines.join("\n"));
        await waitEnter();
        break;
      }
      case "example": {
        const ex = await pickExample();
        if (ex) {
          quickCompile(ex.source);
          await waitEnter();
        } else await waitEnter();
        break;
      }
      case "quick": {
        quickCompile(DEFAULT_SOURCE);
        await waitEnter();
        break;
      }
      case "about": {
        clearScreen();
        print(banner("Sobre", "Trabalho de Compiladores — iuGo"));
        print(`
${bold}Pipeline:${reset}
  Source → Lexer → Parser → Semântica → Optimizer → IR (TAC) → JavaScript

${bold}Linguagem iuGo:${reset}
  let, print, if/else, while, tipos inferidos (NUMBER, STRING, BOOLEAN)

${bold}Documentação:${reset}
  src/docs/relatorio-final.md
  src/docs/grammar.md
  src/docs/parallelism.md

${bold}Comandos:${reset}
  npm start          menu interativo
  npm run demo       demonstração direta
        `);
        await waitEnter();
        break;
      }
      case "exit":
        clearScreen();
        print(phaseMessage("done"));
        print(`${dim}Até logo! Boa apresentação.${reset}\n`);
        closePrompt();
        return;
    }
  }
}

// ── Args CLI ──────────────────────────────────────────────────────────────

async function main(): Promise<void> {
  const args = process.argv.slice(2);
  const demoFlag  = args.includes("--demo") || args.includes("-d");
  const noIntro   = args.includes("--no-intro");
  const fileIdx   = args.findIndex((a) => a === "--file" || a === "-f");
  const filePath  = fileIdx >= 0 ? args[fileIdx + 1] : undefined;

  let source = DEFAULT_SOURCE;
  let label  = "programa padrão";
  if (filePath && fs.existsSync(filePath)) {
    source = fs.readFileSync(filePath, "utf8");
    label  = path.basename(filePath);
  }

  if (demoFlag) {
    if (!noIntro) await playIntro();
    await runDemo(source, label);
    closePrompt();
    return;
  }

  if (filePath && !demoFlag) {
    quickCompile(source);
    closePrompt();
    return;
  }

  if (!noIntro) await playIntro();
  await mainMenu();
}

main().catch((err) => {
  console.error(err);
  closePrompt();
  process.exit(1);
});
