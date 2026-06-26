/**
 * demo.ts — Modo demonstração passo a passo (para apresentação acadêmica)
 */

import * as fs from "fs";
import * as path from "path";
import { spawnSync } from "child_process";
import { compileSource } from "./pipeline";
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
import { phaseMessage } from "./messages";
import { clearScreen, waitEnter, print } from "./prompt";
import { banner, bold, dim, green, rule, reset } from "./ansi";

const OUTPUT_JS = path.join(process.cwd(), "dist", "output.js");

interface DemoStep {
  title: string;
  speechKey: string;
  run: () => boolean;
}

export async function runDemo(source: string, sourceLabel: string): Promise<void> {
  const result = compileSource(source);

  clearScreen();
  print(banner("iuGo Compiler", "Modo Demonstração — Passo a Passo"));
  print("");
  print(phaseMessage("demo"));
  print(`${dim}Fonte: ${sourceLabel}${reset}`);
  await waitEnter(`${dim}Pressione ENTER para iniciar...${reset}`);

  const steps: DemoStep[] = [
    {
      title: "Código-fonte",
      speechKey: "welcome",
      run: () => {
        printSource(source);
        return true;
      },
    },
    {
      title: "Fase 1 — Análise Léxica",
      speechKey: "lexer",
      run: () => {
        const lexErrs = result.errors.filter((e) => e.phase === "Lexer");
        if (lexErrs.length) {
          lexErrs.forEach(printError);
          return false;
        }
        printTokens(result);
        return true;
      },
    },
    {
      title: "Fase 2 — Análise Sintática",
      speechKey: "parser",
      run: () => {
        const parseErrs = result.errors.filter((e) => e.phase === "Parser");
        if (parseErrs.length) {
          parseErrs.forEach(printError);
          return false;
        }
        if (result.ast) printAST(result.ast, "AST (Parser)");
        return true;
      },
    },
    {
      title: "Fase 3 — Análise Semântica",
      speechKey: "semantic",
      run: () => {
        const semErrs = result.errors.filter((e) => e.phase === "Semântico");
        if (semErrs.length) {
          semErrs.forEach(printError);
          return false;
        }
        printSemantic(result);
        return true;
      },
    },
    {
      title: "Fase 4 — Otimização",
      speechKey: "optimizer",
      run: () => {
        if (result.ast && result.optimizedAst) {
          printOptimizer(result, result.ast);
          printAST(result.optimizedAst, "AST otimizada");
        }
        return true;
      },
    },
    {
      title: "Fase 5 — IR (Three-Address Code)",
      speechKey: "ir",
      run: () => {
        printIR(result);
        return true;
      },
    },
    {
      title: "Fase 6 — Geração de JavaScript",
      speechKey: "codegen",
      run: () => {
        if (!result.generatedCode) return false;
        const outDir = path.dirname(OUTPUT_JS);
        if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });
        fs.writeFileSync(OUTPUT_JS, result.generatedCode, "utf8");
        printCodegen(result);
        print(`${dim}Salvo: ${OUTPUT_JS}${reset}\n`);
        return true;
      },
    },
    {
      title: "Execução do programa",
      speechKey: "run",
      run: () => {
        if (result.phase !== "done") return false;
        const proc = spawnSync("node", [OUTPUT_JS], { encoding: "utf8" });
        printRunOutput(proc.stdout ?? "", proc.stderr ?? "", proc.status ?? 1);
        return true;
      },
    },
  ];

  for (let i = 0; i < steps.length; i++) {
    const step = steps[i]!;
    clearScreen();
    print(banner("iuGo Compiler", `Passo ${i + 1}/${steps.length} — ${step.title}`));
    print("");
    print(phaseMessage(step.speechKey));
    print(rule(step.title));
    print("");

    const ok = step.run();

    if (!ok) {
      await waitEnter(`${dim}ENTER para voltar ao menu${reset}`);
      print(phaseMessage("error"));
      return;
    }

    if (i < steps.length - 1) {
      await waitEnter();
    }
  }

  clearScreen();
  print(phaseMessage("done"));
  print(`${green}${bold}Demonstração concluída!${reset}`);
  print(`${dim}Pipeline: Source → Lexer → Parser → Semântica → Optimizer → IR → JS → Execução${reset}`);
  await waitEnter(`${dim}ENTER para voltar ao menu${reset}`);
}
