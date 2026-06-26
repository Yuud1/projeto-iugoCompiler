/**
 * pipeline.ts — Orquestra todas as fases do compilador iuGo
 */
import { Token } from "../compiler/lexer/token";
import { ProgramNode } from "../compiler/parser/ast";
import { IRProgram } from "../compiler/ir/ir";
export type CompilePhase = "lexer" | "parser" | "semantic" | "optimizer" | "ir" | "codegen" | "done" | "error";
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
export declare function compileSource(source: string): PipelineResult;
/** Compila até uma fase específica (para demo passo a passo). */
export declare function compileUpToPhase(source: string, stopAfter: CompilePhase): PipelineResult;
//# sourceMappingURL=pipeline.d.ts.map