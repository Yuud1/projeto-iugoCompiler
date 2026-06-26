"use strict";
/**
 * demo.ts — Modo demonstração passo a passo (para apresentação acadêmica)
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
exports.runDemo = runDemo;
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const child_process_1 = require("child_process");
const pipeline_1 = require("./pipeline");
const presenter_1 = require("./presenter");
const messages_1 = require("./messages");
const prompt_1 = require("./prompt");
const ansi_1 = require("./ansi");
const OUTPUT_JS = path.join(process.cwd(), "dist", "output.js");
async function runDemo(source, sourceLabel) {
    const result = (0, pipeline_1.compileSource)(source);
    (0, prompt_1.clearScreen)();
    (0, prompt_1.print)((0, ansi_1.banner)("iuGo Compiler", "Modo Demonstração — Passo a Passo"));
    (0, prompt_1.print)("");
    (0, prompt_1.print)((0, messages_1.phaseMessage)("demo"));
    (0, prompt_1.print)(`${ansi_1.dim}Fonte: ${sourceLabel}${ansi_1.reset}`);
    await (0, prompt_1.waitEnter)(`${ansi_1.dim}Pressione ENTER para iniciar...${ansi_1.reset}`);
    const steps = [
        {
            title: "Código-fonte",
            speechKey: "welcome",
            run: () => {
                (0, presenter_1.printSource)(source);
                return true;
            },
        },
        {
            title: "Fase 1 — Análise Léxica",
            speechKey: "lexer",
            run: () => {
                const lexErrs = result.errors.filter((e) => e.phase === "Lexer");
                if (lexErrs.length) {
                    lexErrs.forEach(presenter_1.printError);
                    return false;
                }
                (0, presenter_1.printTokens)(result);
                return true;
            },
        },
        {
            title: "Fase 2 — Análise Sintática",
            speechKey: "parser",
            run: () => {
                const parseErrs = result.errors.filter((e) => e.phase === "Parser");
                if (parseErrs.length) {
                    parseErrs.forEach(presenter_1.printError);
                    return false;
                }
                if (result.ast)
                    (0, presenter_1.printAST)(result.ast, "AST (Parser)");
                return true;
            },
        },
        {
            title: "Fase 3 — Análise Semântica",
            speechKey: "semantic",
            run: () => {
                const semErrs = result.errors.filter((e) => e.phase === "Semântico");
                if (semErrs.length) {
                    semErrs.forEach(presenter_1.printError);
                    return false;
                }
                (0, presenter_1.printSemantic)(result);
                return true;
            },
        },
        {
            title: "Fase 4 — Otimização",
            speechKey: "optimizer",
            run: () => {
                if (result.ast && result.optimizedAst) {
                    (0, presenter_1.printOptimizer)(result, result.ast);
                    (0, presenter_1.printAST)(result.optimizedAst, "AST otimizada");
                }
                return true;
            },
        },
        {
            title: "Fase 5 — IR (Three-Address Code)",
            speechKey: "ir",
            run: () => {
                (0, presenter_1.printIR)(result);
                return true;
            },
        },
        {
            title: "Fase 6 — Geração de JavaScript",
            speechKey: "codegen",
            run: () => {
                if (!result.generatedCode)
                    return false;
                const outDir = path.dirname(OUTPUT_JS);
                if (!fs.existsSync(outDir))
                    fs.mkdirSync(outDir, { recursive: true });
                fs.writeFileSync(OUTPUT_JS, result.generatedCode, "utf8");
                (0, presenter_1.printCodegen)(result);
                (0, prompt_1.print)(`${ansi_1.dim}Salvo: ${OUTPUT_JS}${ansi_1.reset}\n`);
                return true;
            },
        },
        {
            title: "Execução do programa",
            speechKey: "run",
            run: () => {
                if (result.phase !== "done")
                    return false;
                const proc = (0, child_process_1.spawnSync)("node", [OUTPUT_JS], { encoding: "utf8" });
                (0, presenter_1.printRunOutput)(proc.stdout ?? "", proc.stderr ?? "", proc.status ?? 1);
                return true;
            },
        },
    ];
    for (let i = 0; i < steps.length; i++) {
        const step = steps[i];
        (0, prompt_1.clearScreen)();
        (0, prompt_1.print)((0, ansi_1.banner)("iuGo Compiler", `Passo ${i + 1}/${steps.length} — ${step.title}`));
        (0, prompt_1.print)("");
        (0, prompt_1.print)((0, messages_1.phaseMessage)(step.speechKey));
        (0, prompt_1.print)((0, ansi_1.rule)(step.title));
        (0, prompt_1.print)("");
        const ok = step.run();
        if (!ok) {
            await (0, prompt_1.waitEnter)(`${ansi_1.dim}ENTER para voltar ao menu${ansi_1.reset}`);
            (0, prompt_1.print)((0, messages_1.phaseMessage)("error"));
            return;
        }
        if (i < steps.length - 1) {
            await (0, prompt_1.waitEnter)();
        }
    }
    (0, prompt_1.clearScreen)();
    (0, prompt_1.print)((0, messages_1.phaseMessage)("done"));
    (0, prompt_1.print)(`${ansi_1.green}${ansi_1.bold}Demonstração concluída!${ansi_1.reset}`);
    (0, prompt_1.print)(`${ansi_1.dim}Pipeline: Source → Lexer → Parser → Semântica → Optimizer → IR → JS → Execução${ansi_1.reset}`);
    await (0, prompt_1.waitEnter)(`${ansi_1.dim}ENTER para voltar ao menu${ansi_1.reset}`);
}
//# sourceMappingURL=demo.js.map