"use strict";
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
Object.defineProperty(exports, "__esModule", { value: true });
exports.IRGenerator = void 0;
const ast_1 = require("../parser/ast");
class IRGenerator {
    constructor() {
        this.instructions = [];
        this.tempCount = 0; // contador de temporários: t0, t1, …
        this.labelCount = 0; // contador de rótulos:     L0, L1, …
    }
    /**
     * Ponto de entrada: recebe a AST otimizada e retorna o IRProgram.
     */
    generate(program) {
        this.instructions = [];
        this.tempCount = 0;
        this.labelCount = 0;
        for (const stmt of program.statements) {
            this.genStatement(stmt);
        }
        return { instructions: this.instructions };
    }
    // ── Geradores de temporários e rótulos ────────────────────────────────────
    newTemp() {
        return `t${this.tempCount++}`;
    }
    newLabel() {
        return `L${this.labelCount++}`;
    }
    emit(instr) {
        this.instructions.push(instr);
    }
    // ── Tradução de statements ────────────────────────────────────────────────
    genStatement(stmt) {
        switch (stmt.kind) {
            case ast_1.NodeKind.VariableDeclaration:
                return this.genVarDecl(stmt);
            case ast_1.NodeKind.Assignment:
                return this.genAssignment(stmt);
            case ast_1.NodeKind.PrintStatement:
                return this.genPrint(stmt);
            case ast_1.NodeKind.IfStatement:
                return this.genIf(stmt);
            case ast_1.NodeKind.WhileStatement:
                return this.genWhile(stmt);
            case ast_1.NodeKind.BlockStatement:
                return this.genBlock(stmt);
            default: {
                const _never = stmt;
                void _never;
            }
        }
    }
    /** let x = expr  →  x = <place> */
    genVarDecl(node) {
        const src = this.genExpr(node.initializer);
        this.emit({ kind: 'assign', dest: node.name, src });
    }
    /** x = expr  →  x = <place> */
    genAssignment(node) {
        const src = this.genExpr(node.value);
        this.emit({ kind: 'assign', dest: node.name, src });
    }
    /** print(expr)  →  print <place> */
    genPrint(node) {
        const value = this.genExpr(node.argument);
        this.emit({ kind: 'print', value });
    }
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
    genIf(node) {
        const cond = this.genExpr(node.condition);
        const lElse = this.newLabel();
        this.emit({ kind: 'iffalse', cond, target: lElse });
        this.genBlock(node.consequent);
        if (node.alternate) {
            const lEnd = this.newLabel();
            this.emit({ kind: 'jump', target: lEnd });
            this.emit({ kind: 'label', name: lElse });
            this.genBlock(node.alternate);
            this.emit({ kind: 'label', name: lEnd });
        }
        else {
            this.emit({ kind: 'label', name: lElse });
        }
    }
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
    genWhile(node) {
        const lStart = this.newLabel();
        const lEnd = this.newLabel();
        this.emit({ kind: 'label', name: lStart });
        const cond = this.genExpr(node.condition);
        this.emit({ kind: 'iffalse', cond, target: lEnd });
        this.genBlock(node.body);
        this.emit({ kind: 'jump', target: lStart });
        this.emit({ kind: 'label', name: lEnd });
    }
    genBlock(node) {
        for (const stmt of node.statements) {
            this.genStatement(stmt);
        }
    }
    // ── Tradução de expressões ────────────────────────────────────────────────
    /**
     * Traduz uma expressão e retorna o "place" onde o resultado estará.
     *
     * Para literais/identificadores: retorna a representação direta (sem temp).
     * Para operações compostas: emite a instrução e retorna o nome do temp criado.
     */
    genExpr(expr) {
        switch (expr.kind) {
            case ast_1.NodeKind.NumberLiteral:
                return this.placeNum(expr);
            case ast_1.NodeKind.StringLiteral:
                return this.placeStr(expr);
            case ast_1.NodeKind.BooleanLiteral:
                return this.placeBool(expr);
            case ast_1.NodeKind.Identifier:
                return this.placeId(expr);
            case ast_1.NodeKind.BinaryExpression:
                return this.genBinary(expr);
            case ast_1.NodeKind.UnaryExpression:
                return this.genUnary(expr);
            default: {
                const _never = expr;
                void _never;
                return '__unknown__';
            }
        }
    }
    // Literais → representação textual direta
    placeNum(node) { return String(node.value); }
    placeStr(node) { return `"${node.value}"`; }
    placeBool(node) { return String(node.value); }
    placeId(node) { return node.name; }
    /**
     * left op right  →  emite BinOpInstr e retorna o nome do temporário.
     *
     * Exemplo:
     *   BinaryExpression { op: "+", left: Identifier "idade", right: NumberLiteral 1 }
     *   → emit { kind:'binop', dest:'t0', op:'+', left:'idade', right:'1' }
     *   → retorna 't0'
     */
    genBinary(node) {
        const left = this.genExpr(node.left);
        const right = this.genExpr(node.right);
        const dest = this.newTemp();
        this.emit({ kind: 'binop', dest, op: node.operator, left, right });
        return dest;
    }
    /**
     * op operand  →  emite UnOpInstr e retorna o nome do temporário.
     *
     * Exemplo:
     *   UnaryExpression { op: "!", operand: Identifier "ativo" }
     *   → emit { kind:'unop', dest:'t0', op:'!', operand:'ativo' }
     *   → retorna 't0'
     */
    genUnary(node) {
        const operand = this.genExpr(node.operand);
        const dest = this.newTemp();
        this.emit({ kind: 'unop', dest, op: node.operator, operand });
        return dest;
    }
}
exports.IRGenerator = IRGenerator;
//# sourceMappingURL=irGenerator.js.map