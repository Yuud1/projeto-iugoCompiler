"use strict";
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
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const child_process_1 = require("child_process");
const ansi_1 = require("./ansi");
const messages_1 = require("./messages");
const introAnimation_1 = require("./introAnimation");
const prompt_1 = require("./prompt");
const pipeline_1 = require("./pipeline");
const demo_1 = require("./demo");
const presenter_1 = require("./presenter");
const EXAMPLES_DIR = path.join(process.cwd(), "examples");
const OUTPUT_JS = path.join(process.cwd(), "dist", "output.js");
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
async function playIntro() {
    await (0, introAnimation_1.playStartupAnimation)({ clearScreen: prompt_1.clearScreen, print: prompt_1.print, sleep: prompt_1.sleep });
}
// ── Compilação rápida (sem passo a passo) ───────────────────────────────
function quickCompile(source, runAfter = true) {
    (0, prompt_1.print)("");
    (0, presenter_1.printSource)(source);
    const result = (0, pipeline_1.compileSource)(source);
    if (result.errors.length > 0) {
        result.errors.forEach(presenter_1.printError);
        (0, prompt_1.print)((0, messages_1.phaseMessage)("error"));
        return;
    }
    (0, presenter_1.printTokens)(result);
    if (result.ast)
        (0, presenter_1.printAST)(result.ast, "AST");
    (0, presenter_1.printSemantic)(result);
    if (result.ast && result.optimizedAst) {
        (0, presenter_1.printOptimizer)(result, result.ast);
        (0, presenter_1.printAST)(result.optimizedAst, "AST otimizada");
    }
    (0, presenter_1.printIR)(result);
    (0, presenter_1.printCodegen)(result);
    const outDir = path.dirname(OUTPUT_JS);
    if (!fs.existsSync(outDir))
        fs.mkdirSync(outDir, { recursive: true });
    fs.writeFileSync(OUTPUT_JS, result.generatedCode, "utf8");
    (0, prompt_1.print)(`${ansi_1.green}✓${ansi_1.reset} Gravado: ${OUTPUT_JS}\n`);
    if (runAfter) {
        const proc = (0, child_process_1.spawnSync)("node", [OUTPUT_JS], { encoding: "utf8" });
        (0, presenter_1.printRunOutput)(proc.stdout ?? "", proc.stderr ?? "", proc.status ?? 1);
    }
}
function listExamples() {
    if (!fs.existsSync(EXAMPLES_DIR))
        return [];
    return fs
        .readdirSync(EXAMPLES_DIR)
        .filter((f) => f.endsWith(".iugo"))
        .map((file) => {
        const base = file.replace(".iugo", "");
        const descriptions = {
            idade: "Programa completo — demo principal",
            fold: "Constant folding — 2 + 3 * 4",
            propagacao: "Propagação — let x = 5; print(x)",
            "dead-code": "Dead code — if (false) { ... }",
            "erro-semantico": "Erro — variável não declarada",
        };
        return {
            name: base,
            file: path.join(EXAMPLES_DIR, file),
            description: descriptions[base] ?? "Exemplo iuGo",
        };
    });
}
async function pickExample() {
    const examples = listExamples();
    if (examples.length === 0) {
        (0, prompt_1.print)(`${ansi_1.gray}Nenhum exemplo em examples/*.iugo${ansi_1.reset}`);
        return null;
    }
    const choice = await (0, prompt_1.selectMenu)("Escolha um exemplo:", examples.map((e) => ({
        label: `${e.name} — ${e.description}`,
        value: e.file,
    })));
    const source = fs.readFileSync(choice, "utf8");
    return { source, label: path.basename(choice) };
}
// ── Menu principal ────────────────────────────────────────────────────────
async function mainMenu() {
    while (true) {
        (0, prompt_1.clearScreen)();
        (0, prompt_1.print)((0, ansi_1.banner)("iuGo Compiler CLI", "Mini-compilador acadêmico"));
        (0, prompt_1.print)("");
        (0, prompt_1.print)((0, messages_1.phaseMessage)("welcome"));
        (0, prompt_1.print)("");
        const action = await (0, prompt_1.selectMenu)("O que deseja fazer?", [
            { label: "Modo demonstração (passo a passo)", value: "demo", hint: "apresentação" },
            { label: "Compilar arquivo .iugo", value: "file" },
            { label: "Digitar código inline", value: "inline" },
            { label: "Usar exemplo pronto", value: "example" },
            { label: "Compilação rápida (pipeline completo)", value: "quick" },
            { label: "Sobre o projeto", value: "about" },
            { label: "Sair", value: "exit" },
        ]);
        switch (action) {
            case "demo": {
                const ex = await pickExample();
                const source = ex?.source ?? DEFAULT_SOURCE;
                const label = ex?.label ?? "programa padrão";
                await (0, demo_1.runDemo)(source, label);
                break;
            }
            case "file": {
                const p = await (0, prompt_1.ask)("Caminho do arquivo .iugo:");
                if (!fs.existsSync(p)) {
                    (0, prompt_1.print)(`${ansi_1.gray}Arquivo não encontrado: ${p}${ansi_1.reset}`);
                    await (0, prompt_1.waitEnter)();
                    break;
                }
                quickCompile(fs.readFileSync(p, "utf8"));
                await (0, prompt_1.waitEnter)();
                break;
            }
            case "inline": {
                (0, prompt_1.print)(`${ansi_1.dim}Digite o código iuGo (linha vazia + ENTER para compilar):${ansi_1.reset}`);
                const lines = [];
                while (true) {
                    const line = await (0, prompt_1.ask)("");
                    if (line === "" && lines.length > 0)
                        break;
                    lines.push(line);
                }
                quickCompile(lines.join("\n"));
                await (0, prompt_1.waitEnter)();
                break;
            }
            case "example": {
                const ex = await pickExample();
                if (ex) {
                    quickCompile(ex.source);
                    await (0, prompt_1.waitEnter)();
                }
                else
                    await (0, prompt_1.waitEnter)();
                break;
            }
            case "quick": {
                quickCompile(DEFAULT_SOURCE);
                await (0, prompt_1.waitEnter)();
                break;
            }
            case "about": {
                (0, prompt_1.clearScreen)();
                (0, prompt_1.print)((0, ansi_1.banner)("Sobre", "Trabalho de Compiladores — iuGo"));
                (0, prompt_1.print)(`
${ansi_1.bold}Pipeline:${ansi_1.reset}
  Source → Lexer → Parser → Semântica → Optimizer → IR (TAC) → JavaScript

${ansi_1.bold}Linguagem iuGo:${ansi_1.reset}
  let, print, if/else, while, tipos inferidos (NUMBER, STRING, BOOLEAN)

${ansi_1.bold}Documentação:${ansi_1.reset}
  src/docs/relatorio-final.md
  src/docs/grammar.md
  src/docs/parallelism.md

${ansi_1.bold}Comandos:${ansi_1.reset}
  npm start          menu interativo
  npm run demo       demonstração direta
        `);
                await (0, prompt_1.waitEnter)();
                break;
            }
            case "exit":
                (0, prompt_1.clearScreen)();
                (0, prompt_1.print)((0, messages_1.phaseMessage)("done"));
                (0, prompt_1.print)(`${ansi_1.dim}Até logo! Boa apresentação.${ansi_1.reset}\n`);
                (0, prompt_1.closePrompt)();
                return;
        }
    }
}
// ── Args CLI ──────────────────────────────────────────────────────────────
async function main() {
    const args = process.argv.slice(2);
    const demoFlag = args.includes("--demo") || args.includes("-d");
    const noIntro = args.includes("--no-intro");
    const fileIdx = args.findIndex((a) => a === "--file" || a === "-f");
    const filePath = fileIdx >= 0 ? args[fileIdx + 1] : undefined;
    let source = DEFAULT_SOURCE;
    let label = "programa padrão";
    if (filePath && fs.existsSync(filePath)) {
        source = fs.readFileSync(filePath, "utf8");
        label = path.basename(filePath);
    }
    if (demoFlag) {
        if (!noIntro)
            await playIntro();
        await (0, demo_1.runDemo)(source, label);
        (0, prompt_1.closePrompt)();
        return;
    }
    if (filePath && !demoFlag) {
        quickCompile(source);
        (0, prompt_1.closePrompt)();
        return;
    }
    if (!noIntro)
        await playIntro();
    await mainMenu();
}
main().catch((err) => {
    console.error(err);
    (0, prompt_1.closePrompt)();
    process.exit(1);
});
//# sourceMappingURL=index.js.map