"use strict";
/**
 * ansi.ts — Cores e formatação terminal (sem dependências externas)
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.gray = exports.white = exports.magenta = exports.blue = exports.red = exports.yellow = exports.green = exports.cyan = exports.dim = exports.bold = exports.reset = void 0;
exports.paint = paint;
exports.banner = banner;
exports.rule = rule;
exports.reset = "\x1b[0m";
exports.bold = "\x1b[1m";
exports.dim = "\x1b[2m";
exports.cyan = "\x1b[36m";
exports.green = "\x1b[32m";
exports.yellow = "\x1b[33m";
exports.red = "\x1b[31m";
exports.blue = "\x1b[34m";
exports.magenta = "\x1b[35m";
exports.white = "\x1b[37m";
exports.gray = "\x1b[90m";
function paint(color, text) {
    return `${color}${text}${exports.reset}`;
}
function banner(title, subtitle) {
    const w = 52;
    const line = "═".repeat(w);
    const pad = (s) => {
        const vis = s.replace(/\x1b\[[0-9;]*m/g, "");
        const padLen = Math.max(0, w - vis.length);
        return s + " ".repeat(padLen);
    };
    const rows = [
        `╔${line}╗`,
        `║${pad(` ${exports.bold}${exports.cyan}${title}${exports.reset}`)}║`,
    ];
    if (subtitle)
        rows.push(`║${pad(` ${exports.dim}${subtitle}${exports.reset}`)}║`);
    rows.push(`╚${line}╝`);
    return rows.join("\n");
}
function rule(label) {
    if (!label)
        return exports.gray + "─".repeat(60) + exports.reset;
    return exports.gray + "── " + exports.reset + exports.bold + label + exports.reset + exports.gray + " " + "─".repeat(Math.max(0, 48 - label.length)) + exports.reset;
}
//# sourceMappingURL=ansi.js.map