/**
 * presenter.ts — Formata saída de cada fase para o terminal
 */
import { ASTNode, ProgramNode } from "../compiler/parser/ast";
import { PipelineResult } from "./pipeline";
export declare function printSource(source: string): void;
export declare function printTokens(result: PipelineResult): void;
export declare function printAST(node: ASTNode, title: string): void;
export declare function printSemantic(result: PipelineResult): void;
export declare function printOptimizer(result: PipelineResult, original: ProgramNode | null): void;
export declare function printIR(result: PipelineResult): void;
export declare function printCodegen(result: PipelineResult): void;
export declare function printError(err: {
    phase: string;
    message: string;
    line?: number;
    column?: number;
}): void;
export declare function printRunOutput(stdout: string, stderr: string, exitCode: number): void;
//# sourceMappingURL=presenter.d.ts.map