"use strict";
/**
 * presenter.ts — Formata saída de cada fase para o terminal
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.printSource = printSource;
exports.printTokens = printTokens;
exports.printAST = printAST;
exports.printSemantic = printSemantic;
exports.printOptimizer = printOptimizer;
exports.printIR = printIR;
exports.printCodegen = printCodegen;
exports.printError = printError;
exports.printRunOutput = printRunOutput;
const tokenTypes_1 = require("../compiler/lexer/tokenTypes");
const ir_1 = require("../compiler/ir/ir");
const ansi_1 = require("./ansi");
function printSource(source) {
    console.log((0, ansi_1.rule)("Código-fonte iuGo"));
    source.split("\n").forEach((line, i) => {
        const num = String(i + 1).padStart(3);
        console.log(`${ansi_1.gray}${num}${ansi_1.reset} │ ${line}`);
    });
    console.log("");
}
function printTokens(result) {
    console.log((0, ansi_1.rule)("Fase 1 — Tokens (Lexer)"));
    console.log("TOKEN".padEnd(18) + "VALOR".padEnd(18) + "LINHA".padEnd(8) + "COL");
    console.log(ansi_1.gray + "─".repeat(56) + ansi_1.reset);
    for (const t of result.tokens) {
        if (t.type === tokenTypes_1.TokenType.EOF)
            break;
        const flag = t.type === tokenTypes_1.TokenType.UNKNOWN ? (0, ansi_1.paint)(ansi_1.red, " ← ERRO") : "";
        console.log(t.type.padEnd(18) +
            `"${t.value}"`.padEnd(18) +
            String(t.line).padEnd(8) +
            String(t.column) +
            flag);
    }
    const count = result.tokens.filter((t) => t.type !== tokenTypes_1.TokenType.EOF).length;
    console.log(`\n${ansi_1.dim}Total: ${count} tokens${ansi_1.reset}\n`);
}
function printAST(node, title) {
    console.log((0, ansi_1.rule)(title));
    walkAST(node, 0);
    console.log("");
}
function walkAST(node, indent) {
    const pad = "  ".repeat(indent);
    const nodeObj = node;
    const kind = nodeObj["kind"];
    const fields = Object.entries(nodeObj)
        .filter(([k, v]) => k !== "kind" && k !== "loc" && (typeof v !== "object" || v === null))
        .map(([k, v]) => `${k}: ${JSON.stringify(v)}`)
        .join(", ");
    console.log(`${pad}${ansi_1.cyan}[${kind}]${ansi_1.reset}${fields ? " " + fields : ""}`);
    for (const [key, value] of Object.entries(nodeObj)) {
        if (key === "kind" || key === "loc")
            continue;
        if (Array.isArray(value)) {
            console.log(`${pad}  ${ansi_1.dim}${key}:${ansi_1.reset}`);
            for (const child of value) {
                if (child && typeof child === "object" && "kind" in child) {
                    walkAST(child, indent + 2);
                }
            }
        }
        else if (value && typeof value === "object" && "kind" in value) {
            console.log(`${pad}  ${ansi_1.dim}${key}:${ansi_1.reset}`);
            walkAST(value, indent + 2);
        }
    }
}
function printSemantic(result) {
    console.log((0, ansi_1.rule)("Fase 3 — Análise Semântica"));
    if (result.errors.length > 0) {
        for (const e of result.errors)
            printError(e);
        return;
    }
    console.log((0, ansi_1.paint)(ansi_1.green, "✓ Programa semanticamente válido") + "\n");
    const entries = Object.entries(result.symbolInfo);
    if (entries.length > 0) {
        console.log(ansi_1.bold + "Tabela de símbolos (global):" + ansi_1.reset);
        for (const [name, type] of entries) {
            console.log(`  ${ansi_1.cyan}${name}${ansi_1.reset} : ${ansi_1.yellow}${type}${ansi_1.reset}`);
        }
    }
    console.log("");
}
function printOptimizer(result, original) {
    console.log((0, ansi_1.rule)("Fase 4 — Otimização"));
    for (const log of result.optimizationLogs) {
        console.log(`  ${ansi_1.green}•${ansi_1.reset} ${log}`);
    }
    console.log("");
    if (original && result.optimizedAst) {
        console.log(ansi_1.dim + "AST original → otimizada (compare abaixo na demo passo a passo)" + ansi_1.reset);
    }
    console.log("");
}
function printIR(result) {
    console.log((0, ansi_1.rule)("Fase 5 — IR (Three-Address Code)"));
    if (result.ir)
        console.log((0, ir_1.formatIR)(result.ir));
    console.log("");
}
function printCodegen(result) {
    console.log((0, ansi_1.rule)("Fase 6 — JavaScript gerado"));
    console.log(result.generatedCode);
    console.log("");
}
function printError(err) {
    console.log((0, ansi_1.paint)(ansi_1.red, `\n✗ Erro na fase ${err.phase}`));
    console.log((0, ansi_1.paint)(ansi_1.red, err.message));
    if (err.line !== undefined) {
        console.log(ansi_1.dim + `  Linha ${err.line}, Coluna ${err.column ?? "?"}` + ansi_1.reset);
    }
    console.log("");
}
function printRunOutput(stdout, stderr, exitCode) {
    console.log((0, ansi_1.rule)("Execução — node dist/output.js"));
    if (stdout.trim()) {
        console.log(ansi_1.bold + "Saída:" + ansi_1.reset);
        stdout.split("\n").forEach((l) => console.log(`  ${l}`));
    }
    if (stderr.trim()) {
        console.log((0, ansi_1.paint)(ansi_1.red, "Stderr:"));
        console.log(stderr);
    }
    console.log(exitCode === 0
        ? (0, ansi_1.paint)(ansi_1.green, `\n✓ Exit code: 0`)
        : (0, ansi_1.paint)(ansi_1.red, `\n✗ Exit code: ${exitCode}`));
    console.log("");
}
//# sourceMappingURL=presenter.js.map