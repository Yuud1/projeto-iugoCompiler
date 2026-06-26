import type { Token } from '@compiler/lexer/token';
import type { ProgramNode } from '@compiler/parser/ast';
import type { IRProgram } from '@compiler/ir/ir';

export type { Token, IRProgram };

export interface CompileError {
  phase: string;
  message: string;
  line?: number;
  column?: number;
}

/** Fase atual do pipeline — usada pelo PipelineStepper para visualização. */
export type CompilePhase =
  | 'idle'
  | 'lexer'
  | 'parser'
  | 'semantic'
  | 'optimizer'
  | 'ir'
  | 'codegen'
  | 'success'
  | 'error';

export interface CompileResult {
  tokens: Token[];
  ast: ProgramNode | null;
  optimizedAst: ProgramNode | null;
  ir: IRProgram | null;
  generatedCode: string;
  errors: CompileError[];
  phase: CompilePhase;
  optimizationLogs: string[];
  /** name → inferred type string (NUMBER | STRING | BOOLEAN) — para hover na IDE */
  symbolInfo: Record<string, string>;
}

export interface ExecuteResult {
  output: string[];
  error: string | null;
}
