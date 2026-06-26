/**
 * presenter.ts — Formata saída de cada fase para o terminal
 */

import { TokenType } from "../compiler/lexer/tokenTypes";
import { ASTNode, ProgramNode } from "../compiler/parser/ast";
import { formatIR } from "../compiler/ir/ir";
import { PipelineResult } from "./pipeline";
import { bold, cyan, green, yellow, red, gray, dim, rule, paint, reset } from "./ansi";

export function printSource(source: string): void {
  console.log(rule("Código-fonte iuGo"));
  source.split("\n").forEach((line, i) => {
    const num = String(i + 1).padStart(3);
    console.log(`${gray}${num}${reset} │ ${line}`);
  });
  console.log("");
}

export function printTokens(result: PipelineResult): void {
  console.log(rule("Fase 1 — Tokens (Lexer)"));
  console.log(
    "TOKEN".padEnd(18) + "VALOR".padEnd(18) + "LINHA".padEnd(8) + "COL"
  );
  console.log(gray + "─".repeat(56) + reset);
  for (const t of result.tokens) {
    if (t.type === TokenType.EOF) break;
    const flag = t.type === TokenType.UNKNOWN ? paint(red, " ← ERRO") : "";
    console.log(
      t.type.padEnd(18) +
      `"${t.value}"`.padEnd(18) +
      String(t.line).padEnd(8) +
      String(t.column) +
      flag
    );
  }
  const count = result.tokens.filter((t) => t.type !== TokenType.EOF).length;
  console.log(`\n${dim}Total: ${count} tokens${reset}\n`);
}

export function printAST(node: ASTNode, title: string): void {
  console.log(rule(title));
  walkAST(node, 0);
  console.log("");
}

function walkAST(node: ASTNode, indent: number): void {
  const pad     = "  ".repeat(indent);
  const nodeObj = node as unknown as Record<string, unknown>;
  const kind    = nodeObj["kind"] as string;

  const fields = Object.entries(nodeObj)
    .filter(([k, v]) => k !== "kind" && k !== "loc" && (typeof v !== "object" || v === null))
    .map(([k, v]) => `${k}: ${JSON.stringify(v)}`)
    .join(", ");

  console.log(`${pad}${cyan}[${kind}]${reset}${fields ? " " + fields : ""}`);

  for (const [key, value] of Object.entries(nodeObj)) {
    if (key === "kind" || key === "loc") continue;
    if (Array.isArray(value)) {
      console.log(`${pad}  ${dim}${key}:${reset}`);
      for (const child of value) {
        if (child && typeof child === "object" && "kind" in (child as object)) {
          walkAST(child as ASTNode, indent + 2);
        }
      }
    } else if (value && typeof value === "object" && "kind" in (value as object)) {
      console.log(`${pad}  ${dim}${key}:${reset}`);
      walkAST(value as ASTNode, indent + 2);
    }
  }
}

export function printSemantic(result: PipelineResult): void {
  console.log(rule("Fase 3 — Análise Semântica"));
  if (result.errors.length > 0) {
    for (const e of result.errors) printError(e);
    return;
  }
  console.log(paint(green, "✓ Programa semanticamente válido") + "\n");
  const entries = Object.entries(result.symbolInfo);
  if (entries.length > 0) {
    console.log(bold + "Tabela de símbolos (global):" + reset);
    for (const [name, type] of entries) {
      console.log(`  ${cyan}${name}${reset} : ${yellow}${type}${reset}`);
    }
  }
  console.log("");
}

export function printOptimizer(result: PipelineResult, original: ProgramNode | null): void {
  console.log(rule("Fase 4 — Otimização"));
  for (const log of result.optimizationLogs) {
    console.log(`  ${green}•${reset} ${log}`);
  }
  console.log("");
  if (original && result.optimizedAst) {
    console.log(dim + "AST original → otimizada (compare abaixo na demo passo a passo)" + reset);
  }
  console.log("");
}

export function printIR(result: PipelineResult): void {
  console.log(rule("Fase 5 — IR (Three-Address Code)"));
  if (result.ir) console.log(formatIR(result.ir));
  console.log("");
}

export function printCodegen(result: PipelineResult): void {
  console.log(rule("Fase 6 — JavaScript gerado"));
  console.log(result.generatedCode);
  console.log("");
}

export function printError(err: { phase: string; message: string; line?: number; column?: number }): void {
  console.log(paint(red, `\n✗ Erro na fase ${err.phase}`));
  console.log(paint(red, err.message));
  if (err.line !== undefined) {
    console.log(dim + `  Linha ${err.line}, Coluna ${err.column ?? "?"}` + reset);
  }
  console.log("");
}

export function printRunOutput(stdout: string, stderr: string, exitCode: number): void {
  console.log(rule("Execução — node dist/output.js"));
  if (stdout.trim()) {
    console.log(bold + "Saída:" + reset);
    stdout.split("\n").forEach((l) => console.log(`  ${l}`));
  }
  if (stderr.trim()) {
    console.log(paint(red, "Stderr:"));
    console.log(stderr);
  }
  console.log(
    exitCode === 0
      ? paint(green, `\n✓ Exit code: 0`)
      : paint(red, `\n✗ Exit code: ${exitCode}`)
  );
  console.log("");
}
