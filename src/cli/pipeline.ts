/**
 * pipeline.ts — Orquestra todas as fases do compilador iuGo
 */

import { Lexer } from "../compiler/lexer/lexer";
import { Parser, ParseError } from "../compiler/parser/parser";
import { Token } from "../compiler/lexer/token";
import { TokenType } from "../compiler/lexer/tokenTypes";
import { ProgramNode, NodeKind } from "../compiler/parser/ast";
import { SemanticAnalyzer } from "../compiler/semantic/analyzer";
import { SemanticError } from "../compiler/semantic/semanticError";
import { Optimizer } from "../compiler/optimizer/optimizer";
import { IRGenerator } from "../compiler/ir/irGenerator";
import { IRProgram } from "../compiler/ir/ir";
import { CodeGenerator } from "../compiler/codegen/generator";

export type CompilePhase =
  | "lexer"
  | "parser"
  | "semantic"
  | "optimizer"
  | "ir"
  | "codegen"
  | "done"
  | "error";

export interface CompileErrorInfo {
  phase: string;
  message: string;
  line?: number;
  column?: number;
}

export interface PipelineResult {
  source: string;
  tokens: Token[];
  ast: ProgramNode | null;
  optimizedAst: ProgramNode | null;
  ir: IRProgram | null;
  generatedCode: string;
  symbolInfo: Record<string, string>;
  optimizationLogs: string[];
  errors: CompileErrorInfo[];
  phase: CompilePhase;
}

function countNodesByKind(root: ProgramNode, kinds: NodeKind[]): number {
  let count = 0;
  const traverse = (n: unknown): void => {
    if (!n || typeof n !== "object") return;
    const obj = n as Record<string, unknown>;
    if ("kind" in obj && kinds.includes(obj.kind as NodeKind)) count++;
    for (const val of Object.values(obj)) {
      if (Array.isArray(val)) val.forEach(traverse);
      else if (val && typeof val === "object") traverse(val);
    }
  };
  traverse(root);
  return count;
}

function computeOptimizationLogs(original: ProgramNode, optimized: ProgramNode): string[] {
  const logs: string[] = [];
  const origStmts = original.statements.length;
  const optStmts  = optimized.statements.length;
  if (origStmts > optStmts) {
    logs.push(`Dead code elimination: ${origStmts - optStmts} statement(s) removido(s)`);
  }
  const origWhile = countNodesByKind(original, [NodeKind.WhileStatement]);
  const optWhile  = countNodesByKind(optimized, [NodeKind.WhileStatement]);
  if (origWhile > optWhile) {
    logs.push(`Loop unrolling: ${origWhile - optWhile} loop(s) desenrolado(s)`);
  }
  const origBin = countNodesByKind(original, [NodeKind.BinaryExpression]);
  const optBin  = countNodesByKind(optimized, [NodeKind.BinaryExpression]);
  if (origBin > optBin) {
    logs.push(`Constant folding: ${origBin - optBin} expressão(ões) simplificada(s)`);
  }
  const origId = countNodesByKind(original, [NodeKind.Identifier]);
  const optId  = countNodesByKind(optimized, [NodeKind.Identifier]);
  if (origId > optId) {
    logs.push(`Constant propagation: ${origId - optId} identificador(es) substituído(s)`);
  }
  if (logs.length === 0) logs.push("Nenhuma otimização adicional detectada");
  return logs;
}

export function compileSource(source: string): PipelineResult {
  const errors: CompileErrorInfo[] = [];
  const empty: PipelineResult = {
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

  let tokens: Token[] = [];
  try {
    tokens = new Lexer(source).tokenize();
    tokens
      .filter((t) => t.type === TokenType.UNKNOWN)
      .forEach((t) =>
        errors.push({
          phase: "Lexer",
          message: `Caractere não reconhecido: '${t.value}'`,
          line: t.line,
          column: t.column,
        })
      );
    if (errors.length > 0) return { ...empty, tokens, phase: "lexer" };
  } catch (e) {
    errors.push({ phase: "Lexer", message: String(e) });
    return empty;
  }

  let ast: ProgramNode | null = null;
  try {
    ast = new Parser(tokens).parseProgram();
  } catch (e) {
    const pe = e instanceof ParseError ? e : null;
    errors.push({
      phase: "Parser",
      message: pe?.message ?? String(e),
      line: pe?.line,
      column: pe?.column,
    });
    return { ...empty, tokens, phase: "parser" };
  }

  const analyzer = new SemanticAnalyzer();
  try {
    analyzer.analyze(ast);
  } catch (e) {
    const se = e instanceof SemanticError ? e : null;
    errors.push({
      phase: "Semântico",
      message: se?.message ?? String(e),
      line: se?.line,
      column: se?.column,
    });
    return { ...empty, tokens, ast, phase: "semantic" };
  }
  const symbolInfo = analyzer.getAllSymbols();

  let optimizedAst: ProgramNode | null = null;
  try {
    optimizedAst = new Optimizer().optimize(ast);
  } catch (e) {
    errors.push({ phase: "Optimizer", message: String(e) });
    return { ...empty, tokens, ast, symbolInfo, phase: "optimizer" };
  }
  const optimizationLogs = computeOptimizationLogs(ast, optimizedAst);

  let ir: IRProgram | null = null;
  try {
    ir = new IRGenerator().generate(optimizedAst);
  } catch (e) {
    errors.push({ phase: "IR", message: String(e) });
    return { ...empty, tokens, ast, optimizedAst, symbolInfo, optimizationLogs, phase: "ir" };
  }

  let generatedCode = "";
  try {
    generatedCode = new CodeGenerator().generate(optimizedAst);
  } catch (e) {
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
export function compileUpToPhase(
  source: string,
  stopAfter: CompilePhase
): PipelineResult {
  const full = compileSource(source);
  if (full.phase === "error" || full.errors.length > 0) return full;

  const order: CompilePhase[] = [
    "lexer",
    "parser",
    "semantic",
    "optimizer",
    "ir",
    "codegen",
    "done",
  ];
  const stopIdx = order.indexOf(stopAfter);
  if (stopIdx < 0) return full;

  const truncated: PipelineResult = { ...full };
  if (stopIdx < order.indexOf("parser")) truncated.ast = null;
  if (stopIdx < order.indexOf("optimizer")) {
    truncated.optimizedAst = null;
    truncated.optimizationLogs = [];
  }
  if (stopIdx < order.indexOf("ir")) truncated.ir = null;
  if (stopIdx < order.indexOf("codegen")) truncated.generatedCode = "";
  truncated.phase = stopAfter;
  return truncated;
}
