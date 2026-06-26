import { useState, useCallback, useEffect, useRef } from 'react';
import { compile, executeCode } from '../services/compilerService';
import { formatCompileOutput, type OutputLine } from '../services/compileOutput';
import { createInterpreter, type DebugState, type DebugSession } from '../compiler/tacInterpreter';
import type { CompileResult, ExecuteResult, CompilePhase } from '../types';

export const DEFAULT_SOURCE = `let idade = 20;

print(idade);

if (idade >= 18) {
    print("Maior");
}

while (idade < 25) {
    print(idade);
    idade = idade + 1;
}`.trim();

const PIPELINE_PHASES: CompilePhase[] = ['lexer', 'parser', 'semantic', 'optimizer', 'ir', 'codegen'];

export interface UseCompilerReturn {
  source: string;
  setSource: (s: string) => void;
  result: CompileResult | null;
  /** Erros ao vivo — sublinhado vermelho no editor enquanto digita */
  liveErrors: CompileResult['errors'];
  /** Erros da última compilação explícita — aba Problems */
  problemsErrors: CompileResult['errors'];
  /** Log da última compilação — aba Output */
  outputLog: OutputLine[];
  execution: ExecuteResult | null;
  isCompiling: boolean;
  currentPhase: CompilePhase;
  triggerCompile: () => void;
  triggerExecute: () => void;
  clearExecution: () => void;
  // Debug
  debugState: DebugState | null;
  stepDebug: () => void;
  resetDebug: () => void;
  runDebug: () => void;
}

export function useCompiler(): UseCompilerReturn {
  const [source, setSource]       = useState(DEFAULT_SOURCE);
  const [result, setResult]       = useState<CompileResult | null>(null);
  const [liveErrors, setLiveErrors]       = useState<CompileResult['errors']>([]);
  const [problemsErrors, setProblemsErrors] = useState<CompileResult['errors']>([]);
  const [outputLog, setOutputLog] = useState<OutputLine[]>([]);
  const [execution, setExecution] = useState<ExecuteResult | null>(null);
  const [isCompiling, setIsCompiling] = useState(false);
  const [currentPhase, setCurrentPhase] = useState<CompilePhase>('idle');
  const [debugState, setDebugState] = useState<DebugState | null>(null);

  const isCompilingRef  = useRef(false);
  const debounceRef     = useRef<ReturnType<typeof setTimeout> | null>(null);
  const interpreterRef  = useRef<DebugSession | null>(null);

  // Keep isCompilingRef in sync
  useEffect(() => { isCompilingRef.current = isCompiling; }, [isCompiling]);

  // Compilação inicial silenciosa — popula sidebar, sem abrir Problems
  useEffect(() => {
    const res = compile(DEFAULT_SOURCE);
    setResult(res);
    setLiveErrors(res.errors);
  }, []);

  // ── Diagnóstico ao vivo (debounced) — só sublinhados no editor ───────────
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);

    debounceRef.current = setTimeout(() => {
      if (isCompilingRef.current) return;
      const res = compile(source);
      setLiveErrors(res.errors);
    }, 550);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [source]);

  // ── Reinicia o interpretador TAC quando o IR muda ────────────────────────
  useEffect(() => {
    if (!result?.ir) {
      interpreterRef.current = null;
      setDebugState(null);
      return;
    }
    const interp = createInterpreter(result.ir);
    interpreterRef.current = interp;
    setDebugState({ ...interp.getState() });
  }, [result?.ir]);

  // ── Compilação animada (botão Compilar) ──────────────────────────────────
  const triggerCompile = useCallback(() => {
    if (isCompiling) return;

    void (async () => {
      setIsCompiling(true);
      setExecution(null);

      const res = compile(source);
      setResult(res);

      // Animação visual — result já disponível para a sidebar mostrar cada fase
      for (const phase of PIPELINE_PHASES) {
        setCurrentPhase(phase);
        await new Promise<void>(r => setTimeout(r, 90));
      }

      setLiveErrors(res.errors);
      setProblemsErrors(res.errors);
      setOutputLog(formatCompileOutput(res));
      setCurrentPhase(res.errors.length > 0 ? res.phase : 'success');
      setIsCompiling(false);
    })();
  }, [source, isCompiling]);

  // ── Execução do JS gerado ────────────────────────────────────────────────
  const triggerExecute = useCallback(() => {
    if (!result?.generatedCode) return;
    setExecution(executeCode(result.generatedCode));
  }, [result]);

  const clearExecution = useCallback(() => setExecution(null), []);

  // ── Debug controls ───────────────────────────────────────────────────────
  const stepDebug = useCallback(() => {
    if (!interpreterRef.current) return;
    setDebugState({ ...interpreterRef.current.step() });
  }, []);

  const resetDebug = useCallback(() => {
    if (!interpreterRef.current) return;
    setDebugState({ ...interpreterRef.current.reset() });
  }, []);

  const runDebug = useCallback(() => {
    if (!interpreterRef.current) return;
    setDebugState({ ...interpreterRef.current.runAll() });
  }, []);

  return {
    source, setSource,
    result, liveErrors, problemsErrors, outputLog, execution,
    isCompiling, currentPhase,
    triggerCompile, triggerExecute, clearExecution,
    debugState, stepDebug, resetDebug, runDebug,
  };
}
