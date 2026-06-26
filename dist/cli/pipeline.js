"use strict";
/**
 * pipeline.ts — Orquestra todas as fases do compilador iuGo
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.compileSource = compileSource;
exports.compileUpToPhase = compileUpToPhase;
const lexer_1 = require("../compiler/lexer/lexer");
const parser_1 = require("../compiler/parser/parser");
const tokenTypes_1 = require("../compiler/lexer/tokenTypes");
const ast_1 = require("../compiler/parser/ast");
const analyzer_1 = require("../compiler/semantic/analyzer");
const semanticError_1 = require("../compiler/semantic/semanticError");
const optimizer_1 = require("../compiler/optimizer/optimizer");
const irGenerator_1 = require("../compiler/ir/irGenerator");
const generator_1 = require("../compiler/codegen/generator");
function countNodesByKind(root, kinds) {
    let count = 0;
    const traverse = (n) => {
        if (!n || typeof n !== "object")
            return;
        const obj = n;
        if ("kind" in obj && kinds.includes(obj.kind))
            count++;
        for (const val of Object.values(obj)) {
            if (Array.isArray(val))
                val.forEach(traverse);
            else if (val && typeof val === "object")
                traverse(val);
        }
    };
    traverse(root);
    return count;
}
function computeOptimizationLogs(original, optimized) {
    const logs = [];
    const origStmts = original.statements.length;
    const optStmts = optimized.statements.length;
    if (origStmts > optStmts) {
        logs.push(`Dead code elimination: ${origStmts - optStmts} statement(s) removido(s)`);
    }
    const origWhile = countNodesByKind(original, [ast_1.NodeKind.WhileStatement]);
    const optWhile = countNodesByKind(optimized, [ast_1.NodeKind.WhileStatement]);
    if (origWhile > optWhile) {
        logs.push(`Loop unrolling: ${origWhile - optWhile} loop(s) desenrolado(s)`);
    }
    const origBin = countNodesByKind(original, [ast_1.NodeKind.BinaryExpression]);
    const optBin = countNodesByKind(optimized, [ast_1.NodeKind.BinaryExpression]);
    if (origBin > optBin) {
        logs.push(`Constant folding: ${origBin - optBin} expressão(ões) simplificada(s)`);
    }
    const origId = countNodesByKind(original, [ast_1.NodeKind.Identifier]);
    const optId = countNodesByKind(optimized, [ast_1.NodeKind.Identifier]);
    if (origId > optId) {
        logs.push(`Constant propagation: ${origId - optId} identificador(es) substituído(s)`);
    }
    if (logs.length === 0)
        logs.push("Nenhuma otimização adicional detectada");
    return logs;
}
function compileSource(source) {
    const errors = [];
    const empty = {
        source,
        tokens: [],
        ast: null,
        optimizedAst: null,
        ir: null,
        generatedCode: "",
        symbolInfo: {},
        optimizationLogs: [],
        errors,
        phase: "error",
    };
    let tokens = [];
    try {
        tokens = new lexer_1.Lexer(source).tokenize();
        tokens
            .filter((t) => t.type === tokenTypes_1.TokenType.UNKNOWN)
            .forEach((t) => errors.push({
            phase: "Lexer",
            message: `Caractere não reconhecido: '${t.value}'`,
            line: t.line,
            column: t.column,
        }));
        if (errors.length > 0)
            return { ...empty, tokens, phase: "lexer" };
    }
    catch (e) {
        errors.push({ phase: "Lexer", message: String(e) });
        return empty;
    }
    let ast = null;
    try {
        ast = new parser_1.Parser(tokens).parseProgram();
    }
    catch (e) {
        const pe = e instanceof parser_1.ParseError ? e : null;
        errors.push({
            phase: "Parser",
            message: pe?.message ?? String(e),
            line: pe?.line,
            column: pe?.column,
        });
        return { ...empty, tokens, phase: "parser" };
    }
    const analyzer = new analyzer_1.SemanticAnalyzer();
    try {
        analyzer.analyze(ast);
    }
    catch (e) {
        const se = e instanceof semanticError_1.SemanticError ? e : null;
        errors.push({
            phase: "Semântico",
            message: se?.message ?? String(e),
            line: se?.line,
            column: se?.column,
        });
        return { ...empty, tokens, ast, phase: "semantic" };
    }
    const symbolInfo = analyzer.getAllSymbols();
    let optimizedAst = null;
    try {
        optimizedAst = new optimizer_1.Optimizer().optimize(ast);
    }
    catch (e) {
        errors.push({ phase: "Optimizer", message: String(e) });
        return { ...empty, tokens, ast, symbolInfo, phase: "optimizer" };
    }
    const optimizationLogs = computeOptimizationLogs(ast, optimizedAst);
    let ir = null;
    try {
        ir = new irGenerator_1.IRGenerator().generate(optimizedAst);
    }
    catch (e) {
        errors.push({ phase: "IR", message: String(e) });
        return { ...empty, tokens, ast, optimizedAst, symbolInfo, optimizationLogs, phase: "ir" };
    }
    let generatedCode = "";
    try {
        generatedCode = new generator_1.CodeGenerator().generate(optimizedAst);
    }
    catch (e) {
        errors.push({ phase: "CodeGen", message: String(e) });
        return {
            ...empty,
            tokens,
            ast,
            optimizedAst,
            ir,
            symbolInfo,
            optimizationLogs,
            phase: "codegen",
        };
    }
    return {
        source,
        tokens,
        ast,
        optimizedAst,
        ir,
        generatedCode,
        symbolInfo,
        optimizationLogs,
        errors,
        phase: "done",
    };
}
/** Compila até uma fase específica (para demo passo a passo). */
function compileUpToPhase(source, stopAfter) {
    const full = compileSource(source);
    if (full.phase === "error" || full.errors.length > 0)
        return full;
    const order = [
        "lexer",
        "parser",
        "semantic",
        "optimizer",
        "ir",
        "codegen",
        "done",
    ];
    const stopIdx = order.indexOf(stopAfter);
    if (stopIdx < 0)
        return full;
    const truncated = { ...full };
    if (stopIdx < order.indexOf("parser"))
        truncated.ast = null;
    if (stopIdx < order.indexOf("optimizer")) {
        truncated.optimizedAst = null;
        truncated.optimizationLogs = [];
    }
    if (stopIdx < order.indexOf("ir"))
        truncated.ir = null;
    if (stopIdx < order.indexOf("codegen"))
        truncated.generatedCode = "";
    truncated.phase = stopAfter;
    return truncated;
}
//# sourceMappingURL=pipeline.js.map