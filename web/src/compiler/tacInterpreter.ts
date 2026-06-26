/**
 * tacInterpreter.ts — Interpretador passo-a-passo de Three-Address Code
 *
 * Executa as instruções TAC uma a uma, mantendo:
 *   - PC (program counter): índice da instrução atual
 *   - env: mapa de variáveis → valores em runtime
 *   - output: linhas capturadas pela instrução print
 *
 * Permite execução step-by-step para o debugger da IDE.
 */

import type { IRInstr, IRProgram } from '@compiler/ir/ir';

export type TACValue = number | string | boolean;

export interface DebugState {
  pc: number;
  env: Record<string, TACValue>;
  output: string[];
  done: boolean;
  halted: boolean;   // atingiu limite de passos (loop infinito)
  currentInstr: IRInstr | null;
}

// ── Utilitários internos ───────────────────────────────────────────────────

/** Pré-computa o índice de cada label no array de instruções. */
function buildLabelMap(instructions: IRInstr[]): Map<string, number> {
  const map = new Map<string, number>();
  for (let i = 0; i < instructions.length; i++) {
    const instr = instructions[i];
    if (instr.kind === 'label') map.set(instr.name, i + 1);
  }
  return map;
}

/**
 * Resolve um "place" (endereço TAC) para um valor JavaScript.
 *
 * Places possíveis:
 *   "20"       → número 20
 *   '"Maior"'  → string "Maior"
 *   "true"     → boolean true
 *   "idade"    → valor de env["idade"]
 */
function resolve(place: string, env: Record<string, TACValue>): TACValue {
  if (place.startsWith('"') && place.endsWith('"')) {
    return place.slice(1, -1);
  }
  if (place === 'true')  return true;
  if (place === 'false') return false;
  const n = Number(place);
  if (!isNaN(n) && place.trim() !== '') return n;
  return env[place] ?? 0;
}

/** Avalia uma operação binária entre dois valores. */
function evalBin(op: string, l: TACValue, r: TACValue): TACValue {
  switch (op) {
    case '+':  return typeof l === 'string' || typeof r === 'string'
                 ? String(l) + String(r)
                 : (l as number) + (r as number);
    case '-':  return (l as number) - (r as number);
    case '*':  return (l as number) * (r as number);
    case '/':  return (l as number) / (r as number);
    case '==': return l === r;
    case '!=': return l !== r;
    case '>':  return (l as number) > (r as number);
    case '>=': return (l as number) >= (r as number);
    case '<':  return (l as number) < (r as number);
    case '<=': return (l as number) <= (r as number);
    case '&&': return Boolean(l) && Boolean(r);
    case '||': return Boolean(l) || Boolean(r);
    default:   return 0;
  }
}

// ── API pública ───────────────────────────────────────────────────────────

export interface DebugSession {
  getState(): DebugState;
  step(): DebugState;
  reset(): DebugState;
  runAll(maxSteps?: number): DebugState;
}

const INITIAL_STATE = (instructions: IRInstr[]): DebugState => ({
  pc: 0,
  env: {},
  output: [],
  done: instructions.length === 0,
  halted: false,
  currentInstr: instructions[0] ?? null,
});

export function createInterpreter(program: IRProgram): DebugSession {
  const { instructions } = program;
  const labelMap = buildLabelMap(instructions);

  let state: DebugState = INITIAL_STATE(instructions);

  function step(): DebugState {
    if (state.done || state.halted) return state;

    const instr = instructions[state.pc];
    if (!instr) {
      state = { ...state, done: true, currentInstr: null };
      return state;
    }

    const env  = { ...state.env };
    const output = [...state.output];
    let nextPc = state.pc + 1;

    switch (instr.kind) {
      case 'assign':
        env[instr.dest] = resolve(instr.src, env);
        break;

      case 'binop':
        env[instr.dest] = evalBin(
          instr.op,
          resolve(instr.left,  env),
          resolve(instr.right, env),
        );
        break;

      case 'unop': {
        const val = resolve(instr.operand, env);
        env[instr.dest] = instr.op === '!' ? !Boolean(val) : -(val as number);
        break;
      }

      case 'label':
        // no-op — só avança o PC
        break;

      case 'jump':
        nextPc = labelMap.get(instr.target) ?? nextPc;
        break;

      case 'iffalse': {
        const cond = resolve(instr.cond, env);
        if (!cond) nextPc = labelMap.get(instr.target) ?? nextPc;
        break;
      }

      case 'print': {
        const val = resolve(instr.value, env);
        output.push(String(val));
        break;
      }
    }

    const done = nextPc >= instructions.length;
    state = {
      pc: nextPc,
      env,
      output,
      done,
      halted: false,
      currentInstr: done ? null : instructions[nextPc] ?? null,
    };
    return state;
  }

  function reset(): DebugState {
    state = INITIAL_STATE(instructions);
    return state;
  }

  function getState(): DebugState {
    return state;
  }

  function runAll(maxSteps = 5000): DebugState {
    let steps = 0;
    while (!state.done && !state.halted && steps < maxSteps) {
      step();
      steps++;
    }
    if (!state.done) {
      state = { ...state, halted: true };
    }
    return state;
  }

  return { getState, step, reset, runAll };
}
