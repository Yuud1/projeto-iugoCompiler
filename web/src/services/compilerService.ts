/**
 * compilerService.ts — Integração entre a UI React e o pipeline do compilador iuGo.
 *
 * Responsabilidade:
 *   Orquestrar as 5 fases do compilador (Lexer → Parser → Semântica →
 *   Optimizer → CodeGen) e retornar um resultado tipado para o hook
 *   useCompiler consumir.
 *
 * Cada fase produz dados que alimentam painéis diferentes da UI:
 *   Lexer    → TokensPanel
 *   Parser   → ASTViewer (aba "Original")
 *   Semântica → validação (erros no ConsolePanel)
 *   Optimizer → ASTViewer (aba "Otimizada") + optimizationLogs
 *   CodeGen  → OutputPanel
 *
 * Comunicação com o compilador:
 *   Os módulos do compilador são TypeScript puro — sem APIs do Node.js —
 *   então podem ser importados diretamente pelo Vite e rodados no browser.
 *   O alias "@compiler" aponta para ../src/compiler via vite.config.ts.
 *
 * Execução do JS gerado:
 *   executeCode() cria uma função isolada via new Function() e passa um
 *   console fake para capturar a saída sem poluir o console real.
 */

import { Lexer } from '@compiler/lexer/lexer';
import { Parser, ParseError } from '@compiler/parser/parser';
import { SemanticAnalyzer } from '@compiler/semantic/analyzer';
import { SemanticError } from '@compiler/semantic/semanticError';
import { Optimizer } from '@compiler/optimizer/optimizer';
import { IRGenerator } from '@compiler/ir/irGenerator';
import { CodeGenerator } from '@compiler/codegen/generator';
import { TokenType } from '@compiler/lexer/tokenTypes';
import { NodeKind, type ProgramNode } from '@compiler/parser/ast';
import type { IRProgram } from '@compiler/ir/ir';
import type { CompileResult, CompileError, ExecuteResult } from '../types';

// ── Utilitários de diff entre ASTs ────────────────────────────────────────

/** Conta nós de determinado(s) kind(s) na árvore inteira. */
function countNodesByKind(root: ProgramNode, kinds: NodeKind[]): number {
  let count = 0;
  const traverse = (n: unknown): void => {
    if (!n || typeof n !== 'object') return;
    const obj = n as Record<string, unknown>;
    if ('kind' in obj && kinds.includes(obj.kind as NodeKind)) count++;
    for (const val of Object.values(obj)) {
      if (Array.isArray(val)) val.forEach(traverse);
      else if (val && typeof val === 'object') traverse(val);
    }
  };
  traverse(root);
  return count;
}

/**
 * Compara a AST original com a otimizada e produz mensagens legíveis
 * descrevendo quais otimizações foram aplicadas.
 */
function computeOptimizationLogs(original: ProgramNode, optimized: ProgramNode): string[] {
  const logs: string[] = [];

  // Dead code elimination → menos statements no nível raiz
  const origStmts = original.statements.length;
  const optStmts  = optimized.statements.length;
  if (origStmts > optStmts) {
    logs.push(`Dead code elimination: ${origStmts - optStmts} statement(s) removido(s) da raiz`);
  }

  const origWhile = countNodesByKind(original, [NodeKind.WhileStatement]);
  const optWhile  = countNodesByKind(optimized, [NodeKind.WhileStatement]);
  if (origWhile > optWhile) {
    logs.push(`Loop unrolling: ${origWhile - optWhile} loop(s) desenrolado(s) em prints literais`);
  }

  // Constant folding → menos BinaryExpression nodes
  const origBin = countNodesByKind(original, [NodeKind.BinaryExpression]);
  const optBin  = countNodesByKind(optimized, [NodeKind.BinaryExpression]);
  if (origBin > optBin) {
    logs.push(`Constant folding: ${origBin - optBin} expressão(ões) calculada(s) em compile-time`);
  }

  // Constant propagation → menos Identifier nodes
  const origId = countNodesByKind(original, [NodeKind.Identifier]);
  const optId  = countNodesByKind(optimized, [NodeKind.Identifier]);
  if (origId > optId) {
    logs.push(`Constant propagation: ${origId - optId} identificador(es) substituído(s) por literal`);
  }

  if (logs.length === 0) {
    logs.push('Nenhuma otimização adicional detectada para este código');
  }

  return logs;
}

// ── Pipeline de compilação ────────────────────────────────────────────────

export function compile(source: string): CompileResult {
  const errors: CompileError[] = [];

  const empty = { symbolInfo: {} as Record<string, string> };

  // ── Fase 1: Lexer ─────────────────────────────────────────────────────
  let tokens: import('@compiler/lexer/token').Token[] = [];
  try {
    tokens = new Lexer(source).tokenize();
    tokens
      .filter(t => t.type === TokenType.UNKNOWN)
      .forEach(t =>
        errors.push({
          phase: 'Lexer',
          message: `Caractere não reconhecido: '${t.value}'`,
          line: t.line,
          column: t.column,
        })
      );
  } catch (e) {
    errors.push({ phase: 'Lexer', message: String(e) });
    return { tokens, ast: null, optimizedAst: null, ir: null, generatedCode: '', errors, phase: 'error', optimizationLogs: [], ...empty };
  }

  // ── Fase 2: Parser ────────────────────────────────────────────────────
  let ast: ProgramNode | null = null;
  try {
    ast = new Parser(tokens).parseProgram();
  } catch (e) {
    const pe = e instanceof ParseError ? e : null;
    errors.push({
      phase: 'Parser',
      message: pe ? pe.message : String(e),
      line: pe?.line,
      column: pe?.column,
    });
    return { tokens, ast, optimizedAst: null, ir: null, generatedCode: '', errors, phase: 'parser', optimizationLogs: [], ...empty };
  }

  // ── Fase 3: Análise Semântica ─────────────────────────────────────────
  const analyzer = new SemanticAnalyzer();
  try {
    analyzer.analyze(ast);
  } catch (e) {
    const se = e instanceof SemanticError ? e : null;
    errors.push({
      phase: 'Semântico',
      message: se ? se.message : String(e),
      line: se?.line,
      column: se?.column,
    });
    return { tokens, ast, optimizedAst: null, ir: null, generatedCode: '', errors, phase: 'semantic', optimizationLogs: [], ...empty };
  }

  const symbolInfo = analyzer.getAllSymbols();

  // ── Fase 4: Optimizer ─────────────────────────────────────────────────
  let optimizedAst: ProgramNode | null = null;
  try {
    optimizedAst = new Optimizer().optimize(ast);
  } catch (e) {
    errors.push({ phase: 'Optimizer', message: String(e) });
    return { tokens, ast, optimizedAst, ir: null, generatedCode: '', errors, phase: 'optimizer', optimizationLogs: [], symbolInfo };
  }

  const optimizationLogs = computeOptimizationLogs(ast, optimizedAst);

  // ── Fase 5: IR Generator (Three-Address Code) ─────────────────────────
  let ir: IRProgram | null = null;
  try {
    ir = new IRGenerator().generate(optimizedAst);
  } catch (e) {
    errors.push({ phase: 'IR', message: String(e) });
    return { tokens, ast, optimizedAst, ir, generatedCode: '', errors, phase: 'codegen', optimizationLogs, symbolInfo };
  }

  // ── Fase 6: Code Generator ────────────────────────────────────────────
  let generatedCode = '';
  try {
    generatedCode = new CodeGenerator().generate(optimizedAst);
  } catch (e) {
    errors.push({ phase: 'CodeGen', message: String(e) });
    return { tokens, ast, optimizedAst, ir, generatedCode, errors, phase: 'codegen', optimizationLogs, symbolInfo };
  }

  return { tokens, ast, optimizedAst, ir, generatedCode, errors, phase: 'success', optimizationLogs, symbolInfo };
}

// ── Execução do JS gerado ──────────────────────────────────────────────────

/**
 * Executa o JavaScript gerado em um escopo isolado via new Function().
 * O console é substituído por um objeto fake que captura toda a saída
 * sem imprimir no console real do browser.
 *
 * Limitação conhecida: loops infinitos travam a thread principal.
 * Para código educacional (sem while(true)), isso não é um problema.
 */
export function executeCode(code: string): ExecuteResult {
  const output: string[] = [];

  const fakeConsole = {
    log:   (...args: unknown[]) => output.push(args.map(String).join(' ')),
    error: (...args: unknown[]) => output.push(`[stderr] ${args.map(String).join(' ')}`),
    warn:  (...args: unknown[]) => output.push(`[warn]   ${args.map(String).join(' ')}`),
  };

  try {
    // new Function cria um escopo de função isolado; o "console" injetado
    // substitui o global dentro do código gerado.
    new Function('console', code)(fakeConsole);
    return { output, error: null };
  } catch (e) {
    return { output, error: String(e) };
  }
}
