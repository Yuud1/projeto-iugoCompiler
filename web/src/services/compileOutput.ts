import { TokenType } from '@compiler/lexer/tokenTypes';
import type { CompileResult } from '../types';

export type OutputLineStyle = 'default' | 'dim' | 'success' | 'error' | 'phase' | 'header' | 'code';

export interface OutputLine {
  text: string;
  style: OutputLineStyle;
}

const PHASE_ORDER = ['Lexer', 'Parser', 'Semântico', 'Optimizer', 'IR', 'CodeGen'] as const;

function countStatements(result: CompileResult): number {
  return result.ast?.statements.length ?? 0;
}

function failedAtPhase(result: CompileResult): string | null {
  if (result.errors.length === 0) return null;
  return result.errors[0]?.phase ?? null;
}

function phaseReached(result: CompileResult, phase: typeof PHASE_ORDER[number]): boolean {
  switch (phase) {
    case 'Lexer':     return result.tokens.length > 0;
    case 'Parser':    return result.ast !== null;
    case 'Semântico':
      return result.ast !== null && (result.optimizedAst !== null || failedAtPhase(result) === 'Semântico');
    case 'Optimizer': return result.optimizedAst !== null;
    case 'IR':        return result.ir !== null;
    case 'CodeGen':   return result.generatedCode.length > 0;
    default:          return false;
  }
}

function phaseDetail(result: CompileResult, phase: typeof PHASE_ORDER[number]): string {
  switch (phase) {
    case 'Lexer': {
      const n = result.tokens.filter(t => t.type !== TokenType.EOF).length;
      return `${n} token(s) reconhecido(s)`;
    }
    case 'Parser':
      return `AST com ${countStatements(result)} statement(s) no nível raiz`;
    case 'Semântico': {
      const n = Object.keys(result.symbolInfo).length;
      return n > 0 ? `${n} símbolo(s) na tabela global` : 'programa semanticamente válido';
    }
    case 'Optimizer':
      return result.optimizationLogs.length > 0
        ? `${result.optimizationLogs.length} otimização(ões) detectada(s)`
        : 'AST otimizada';
    case 'IR':
      return `${result.ir?.instructions.length ?? 0} instrução(ões) TAC`;
    case 'CodeGen': {
      const lines = result.generatedCode.split('\n').length;
      return `output.js — ${lines} linha(s)`;
    }
    default:
      return '';
  }
}

/** Monta o log completo da compilação — estilo canal Output do VS Code. */
export function formatCompileOutput(result: CompileResult): OutputLine[] {
  const lines: OutputLine[] = [];
  const ts = new Date().toLocaleTimeString('pt-BR');
  const failPhase = failedAtPhase(result);

  lines.push({ text: `[${ts}] iuGo Compiler`, style: 'header' });
  lines.push({ text: 'Compilando source.iugo → output.js', style: 'dim' });
  lines.push({ text: '─'.repeat(52), style: 'dim' });
  lines.push({ text: '', style: 'default' });

  for (const phase of PHASE_ORDER) {
    const reached = phaseReached(result, phase);
    const failed  = failPhase === phase;

    if (failed) {
      lines.push({ text: `  [${phase.padEnd(10)}]  FAIL  Falhou`, style: 'error' });
      for (const err of result.errors.filter(e => e.phase === phase)) {
        const loc = err.line ? ` (${err.line}:${err.column ?? '?'})` : '';
        lines.push({ text: `         ${err.message}${loc}`, style: 'error' });
      }
      break;
    }

    if (reached) {
      lines.push({
        text: `  [${phase.padEnd(10)}]  OK   ${phaseDetail(result, phase)}`,
        style: 'success',
      });
    }
  }

  // Otimizações (quando passou pelo optimizer)
  if (result.optimizedAst && result.optimizationLogs.length > 0) {
    lines.push({ text: '', style: 'default' });
    lines.push({ text: '— Otimizações —', style: 'phase' });
    for (const log of result.optimizationLogs) {
      lines.push({ text: `  ${log}`, style: 'default' });
    }
  }

  // Tabela de símbolos
  const symbols = Object.entries(result.symbolInfo);
  if (symbols.length > 0 && !failPhase) {
    lines.push({ text: '', style: 'default' });
    lines.push({ text: '— Tabela de símbolos —', style: 'phase' });
    for (const [name, type] of symbols) {
      lines.push({ text: `  ${name} : ${type}`, style: 'default' });
    }
  }

  // JS gerado
  if (result.generatedCode && result.errors.length === 0) {
    lines.push({ text: '', style: 'default' });
    lines.push({ text: '— JavaScript gerado (output.js) —', style: 'phase' });
    for (const line of result.generatedCode.split('\n')) {
      lines.push({ text: line, style: 'code' });
    }
  }

  lines.push({ text: '', style: 'default' });
  lines.push({ text: '─'.repeat(52), style: 'dim' });

  if (result.errors.length === 0) {
    lines.push({ text: 'Compilação concluída com sucesso.', style: 'success' });
  } else {
    lines.push({
      text: `Compilação falhou na fase ${failPhase ?? result.phase}.`,
      style: 'error',
    });
  }

  return lines;
}
