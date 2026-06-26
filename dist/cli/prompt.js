"use strict";
/**
 * prompt.ts — Entrada interativa no terminal (readline)
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
exports.clearScreen = clearScreen;
exports.sleep = sleep;
exports.print = print;
exports.waitEnter = waitEnter;
exports.ask = ask;
exports.closePrompt = closePrompt;
exports.selectMenu = selectMenu;
exports.confirm = confirm;
exports.playIntro = playIntro;
const readline = __importStar(require("readline"));
const ansi_1 = require("./ansi");
let rl = null;
function getRL() {
    if (!rl) {
        rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout,
        });
    }
    return rl;
}
function clearScreen() {
    process.stdout.write("\x1b[2J\x1b[H");
}
function sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}
function print(text) {
    console.log(text);
}
function waitEnter(message = `${ansi_1.dim}Pressione ENTER para continuar...${ansi_1.reset}`) {
    return new Promise((resolve) => {
        getRL().question(`\n${message} `, () => resolve());
    });
}
function ask(question) {
    return new Promise((resolve) => {
        getRL().question(`${ansi_1.cyan}?${ansi_1.reset} ${question} `, (answer) => resolve(answer.trim()));
    });
}
function closePrompt() {
    rl?.close();
    rl = null;
}
/** Menu numérico estilo CLI moderna. */
async function selectMenu(title, options) {
    print("");
    print(`${ansi_1.bold}${title}${ansi_1.reset}`);
    print(ansi_1.gray + "─".repeat(40) + ansi_1.reset);
    options.forEach((opt, i) => {
        const hint = opt.hint ? ` ${ansi_1.dim}(${opt.hint})${ansi_1.reset}` : "";
        print(`  ${ansi_1.cyan}${i + 1}.${ansi_1.reset} ${opt.label}${hint}`);
    });
    print("");
    while (true) {
        const raw = await ask(`Escolha [1-${options.length}]:`);
        const n = parseInt(raw, 10);
        if (n >= 1 && n <= options.length)
            return options[n - 1].value;
        print(`${ansi_1.gray}Opção inválida. Digite um número de 1 a ${options.length}.${ansi_1.reset}`);
    }
}
async function confirm(question) {
    const raw = await ask(`${question} ${ansi_1.dim}(s/n)${ansi_1.reset}:`);
    return raw.toLowerCase() === "s" || raw.toLowerCase() === "sim" || raw === "";
}
async function playIntro(render, frames, msPerFrame) {
    for (let i = 0; i < frames; i++) {
        clearScreen();
        render(i);
        await sleep(msPerFrame);
    }
}
//# sourceMappingURL=prompt.js.map