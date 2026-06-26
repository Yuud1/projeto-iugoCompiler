/**
 * irGenerator.ts — Gerador de Three-Address Code (TAC) a partir da AST iuGo
 *
 * Recebe a AST **otimizada** (saída do Optimizer) e produz um IRProgram
 * com instruções Three-Address Code.
 *
 * ── Estratégia ────────────────────────────────────────────────────────────
 *
 * Cada expressão é traduzida pelo método `genExpr`, que:
 *   - Retorna um "place" (string) representando onde o valor está guardado.
 *   - Para literais e identificadores, retorna o valor/nome diretamente
 *     (sem criar temporário desnecessário).
 *   - Para operações compostas, cria um temporário novo (t0, t1, …) e
 *     emite a instrução correspondente.
 *
 * Cada statement é traduzido por `genStatement`:
 *   VariableDeclaration / Assignment → assign
 *   PrintStatement                   → print
 *   IfStatement                      → iffalse + label(s) + jump
 *   WhileStatement                   → label + iffalse + jump
 *   BlockStatement                   → itera os statements filhos
 *
 * ── Tradução de controle de fluxo ────────────────────────────────────────
 *
 * if (cond) { A } else { B }:
 *   <gen cond → t>
 *   iffalse t goto L_else
 *   <gen A>
 *   goto L_end
 *   L_else:
 *   <gen B>
 *   L_end:
 *
 * while (cond) { body }:
 *   L_start:
 *   <gen cond → t>
 *   iffalse t goto L_end
 *   <gen body>
 *   goto L_start
 *   L_end:
 */
import { ProgramNode } from '../parser/ast';
import type { IRProgram } from './ir';
export declare class IRGenerator {
    private instructions;
    private tempCount;
    private labelCount;
    /**
     * Ponto de entrada: recebe a AST otimizada e retorna o IRProgram.
     */
    generate(program: ProgramNode): IRProgram;
    private newTemp;
    private newLabel;
    private emit;
    private genStatement;
    /** let x = expr  →  x = <place> */
    private genVarDecl;
    /** x = expr  →  x = <place> */
    private genAssignment;
    /** print(expr)  →  print <place> */
    private genPrint;
    /**
     * if (cond) { A } else? { B }
     *
     *   <cond → t>
     *   iffalse t goto L_else
     *   <A>
     *   goto L_end     (só se há else)
     *   L_else:
     *   <B>            (só se há else)
     *   L_end:
     */
    private genIf;
    /**
     * while (cond) { body }
     *
     *   L_start:
     *   <cond → t>
     *   iffalse t goto L_end
     *   <body>
     *   goto L_start
     *   L_end:
     */
    private genWhile;
    private genBlock;
    /**
     * Traduz uma expressão e retorna o "place" onde o resultado estará.
     *
     * Para literais/identificadores: retorna a representação direta (sem temp).
     * Para operações compostas: emite a instrução e retorna o nome do temp criado.
     */
    private genExpr;
    private placeNum;
    private placeStr;
    private placeBool;
    private placeId;
    /**
     * left op right  →  emite BinOpInstr e retorna o nome do temporário.
     *
     * Exemplo:
     *   BinaryExpression { op: "+", left: Identifier "idade", right: NumberLiteral 1 }
     *   → emit { kind:'binop', dest:'t0', op:'+', left:'idade', right:'1' }
     *   → retorna 't0'
     */
    private genBinary;
    /**
     * op operand  →  emite UnOpInstr e retorna o nome do temporário.
     *
     * Exemplo:
     *   UnaryExpression { op: "!", operand: Identifier "ativo" }
     *   → emit { kind:'unop', dest:'t0', op:'!', operand:'ativo' }
     *   → retorna 't0'
     */
    private genUnary;
}
//# sourceMappingURL=irGenerator.d.ts.map