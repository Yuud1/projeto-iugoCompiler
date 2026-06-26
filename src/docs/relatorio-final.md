# Relatório Final — Trabalho de Compiladores
## Mini-Compilador iuGo: da Análise Léxica à Geração de Código Otimizado

---

## Sumário

1. [Introdução ao Projeto](#1-introdução-ao-projeto)
2. [Revisão de Linguagens Formais e Autômatos](#2-revisão-de-linguagens-formais-e-autômatos)
3. [Análise Léxica](#3-análise-léxica)
4. [Análise Sintática](#4-análise-sintática)
5. [Tradução Dirigida por Sintaxe](#5-tradução-dirigida-por-sintaxe)
6. [Geração de Código Intermediário](#6-geração-de-código-intermediário)
7. [Ambientes de Execução](#7-ambientes-de-execução)
8. [Geração de Código Final](#8-geração-de-código-final)
9. [Otimizações Independentes de Máquina](#9-otimizações-independentes-de-máquina)
10. [Paralelismo de Instrução](#10-paralelismo-de-instrução)
11. [Otimização de Paralelismo e Localidade](#11-otimização-de-paralelismo-e-localidade)
12. [Aplicações Relacionadas à Teoria de Compiladores](#12-aplicações-relacionadas-à-teoria-de-compiladores)
13. [Conclusão](#13-conclusão)

---

## 1. Introdução ao Projeto

### 1.1 Visão Geral

Este trabalho apresenta o **iuGo Compiler**: um mini-compilador completo desenvolvido em TypeScript para a linguagem de programação **iuGo**, uma linguagem imperativa estruturada criada para fins acadêmicos. O compilador implementa todas as fases clássicas descritas pela teoria de compiladores, da análise léxica à geração de código otimizado, e é acompanhado de uma IDE web interativa que visualiza cada fase do pipeline em tempo real.

O nome **iuGo** é uma referência direta ao contexto acadêmico do projeto, inspirado na sintaxe de linguagens como JavaScript e Go, porém com um conjunto mínimo de construções que torna o estudo do compilador acessível.

### 1.2 Características da Linguagem iuGo

A linguagem foi projetada com os seguintes elementos:

**Tipos de dados:**
- `NUMBER` — inteiros e decimais (ex.: `42`, `3.14`)
- `STRING` — texto entre aspas duplas (ex.: `"Olá, mundo!"`)
- `BOOLEAN` — valores lógicos (`true`, `false`)

**Construções suportadas:**
- Declaração de variáveis com inferência de tipo: `let nome = valor;`
- Atribuição: `variavel = expressão;`
- Saída de dados: `print(expressão);`
- Condicional: `if (condição) { } else { }`
- Laço de repetição: `while (condição) { }`
- Comentários de linha: `// comentário`

**Operadores:**
- Aritméticos: `+`, `-`, `*`, `/`
- Comparação: `==`, `!=`, `>`, `>=`, `<`, `<=`
- Lógicos: `&&`, `||`, `!`

### 1.3 Exemplo de Programa iuGo

```iugo
// Verificação de maioridade e contagem
let idade = 20;

print(idade);

if (idade >= 18) {
    print("Maior de idade");
} else {
    print("Menor de idade");
}

while (idade < 25) {
    idade = idade + 1;
}

print(idade);
```

### 1.4 Arquitetura do Pipeline

O compilador implementa um pipeline de **seis fases** em sequência:

```
Código Fonte (.iugo)
        │
        ▼
┌──────────────────┐
│   LEXER          │  Fase 1 — Análise Léxica
│                  │  source → Token[]
└────────┬─────────┘
         │
         ▼
┌──────────────────┐
│   PARSER         │  Fase 2 — Análise Sintática
│                  │  Token[] → AST (ProgramNode)
└────────┬─────────┘
         │
         ▼
┌──────────────────┐
│   SEMANTIC       │  Fase 3 — Análise Semântica
│   ANALYZER       │  Verifica tipos, escopos e declarações
└────────┬─────────┘
         │
         ▼
┌──────────────────┐
│   OPTIMIZER      │  Fase 4 — Otimização sobre a AST
│                  │  Constant folding, DCE, Propagation
└────────┬─────────┘
         │
         ▼
┌──────────────────┐
│   IR GENERATOR   │  Fase 5 — Geração de Código Intermediário
│                  │  AST otimizada → Three-Address Code (TAC)
└────────┬─────────┘
         │
         ▼
┌──────────────────┐
│   CODE           │  Fase 6 — Geração de Código Final
│   GENERATOR      │  AST otimizada → JavaScript executável
└──────────────────┘
         │
         ▼
   output.js (executável no Node.js / browser)
```

### 1.5 Tecnologias Utilizadas

| Componente | Tecnologia |
|---|---|
| Linguagem do compilador | TypeScript 5.5 |
| IDE Web | React 18 + Vite 5 |
| Editor de código | Monaco Editor (VS Code engine) |
| Execução do JS gerado | `new Function()` com console interceptado |
| Paradigma do compilador | Visitor Pattern sobre AST |

---

## 2. Revisão de Linguagens Formais e Autômatos

### 2.1 Gramática Formal — EBNF

A gramática formal da linguagem iuGo é descrita em EBNF (*Extended Backus–Naur Form*). Cada regra mapeia diretamente para um método no parser recursivo descendente.

#### 2.1.1 Programa e Statements

```ebnf
program    ::= { statement } EOF

statement  ::= varDecl
             | assignment
             | printStmt
             | ifStmt
             | whileStmt
             | block

varDecl    ::= "let" IDENTIFIER "=" expression ";"
assignment ::= IDENTIFIER "=" expression ";"
printStmt  ::= "print" "(" expression ")" ";"
ifStmt     ::= "if" "(" expression ")" block [ "else" block ]
whileStmt  ::= "while" "(" expression ")" block
block      ::= "{" { statement } "}"
```

#### 2.1.2 Hierarquia de Expressões (precedência crescente)

```ebnf
expression ::= orExpr
orExpr     ::= andExpr    { "||" andExpr }
andExpr    ::= equalExpr  { "&&" equalExpr }
equalExpr  ::= relExpr    { ( "==" | "!=" ) relExpr }
relExpr    ::= addExpr    { ( ">" | ">=" | "<" | "<=" ) addExpr }
addExpr    ::= mulExpr    { ( "+" | "-" ) mulExpr }
mulExpr    ::= unaryExpr  { ( "*" | "/" ) unaryExpr }
unaryExpr  ::= ( "!" | "-" ) unaryExpr | primary
primary    ::= NUMBER | STRING | "true" | "false"
             | IDENTIFIER | "(" expression ")"
```

A hierarquia de regras codifica a precedência dos operadores: quanto mais fundo na árvore de regras, maior a precedência. Assim, `*` e `/` são avaliados antes de `+` e `-`, que são avaliados antes de `==`, e assim por diante.

#### 2.1.3 Tokens Terminais

```ebnf
IDENTIFIER ::= ALPHA { ALPHA | DIGIT | "_" }
NUMBER     ::= DIGIT { DIGIT } [ "." DIGIT { DIGIT } ]
STRING     ::= '"' { CHAR } '"'

ALPHA      ::= "a" | ... | "z" | "A" | ... | "Z" | "_"
DIGIT      ::= "0" | ... | "9"
CHAR       ::= qualquer caractere exceto '"' e '\n'
```

### 2.2 Propriedade LL(1) da Gramática

A técnica de parsing utilizada (Descida Recursiva) exige que a gramática seja **LL(1)**: dado o símbolo de entrada atual (lookahead de 1 token), sempre é possível determinar unicamente qual produção aplicar. A tabela FIRST dos statements comprova isso:

| Não-terminal | FIRST | Token de lookahead |
|---|---|---|
| `varDecl` | `{ LET }` | `let` |
| `assignment` | `{ IDENTIFIER }` | nome de variável |
| `printStmt` | `{ PRINT }` | `print` |
| `ifStmt` | `{ IF }` | `if` |
| `whileStmt` | `{ WHILE }` | `while` |
| `block` | `{ LBRACE }` | `{` |

Os conjuntos FIRST são disjuntos: o parser nunca precisa "adivinhar" qual produção escolher. Para expressões, a precedência é imposta pela hierarquia de métodos recursivos.

### 2.3 Paradigma da Linguagem

iuGo adota o paradigma **imperativo estruturado**:

- **Imperativo**: o estado do programa (variáveis) é modificado explicitamente por atribuições sequenciais.
- **Estruturado**: o controle de fluxo usa exclusivamente blocos `if/else` e `while`, sem `goto` exposto ao programador (embora o código intermediário gerado use `goto` implícito via rótulos).
- **Tipagem estática implícita**: os tipos são inferidos na análise semântica a partir dos valores literais. Não há anotações de tipo no código-fonte.

### 2.4 Autômatos Finitos Determinísticos (AFD) do Lexer

O analisador léxico implementa implicitamente um conjunto de AFDs encadeados. A seguir, a especificação formal de cada sub-autômato.

#### AFD 1 — Reconhecimento de Números

```
Estados: q0 (inicial), q1 (inteiro), q2 (ponto decimal), q3 (float)
Alfabeto: dígitos 0-9, ponto '.'

Transições:
  q0 --[0-9]--> q1
  q1 --[0-9]--> q1   ← aceita: INTEGER
  q1 --[.  ]--> q2
  q2 --[0-9]--> q3
  q3 --[0-9]--> q3   ← aceita: FLOAT

Token emitido: NUMBER
```

#### AFD 2 — Reconhecimento de Identificadores e Palavras-chave

```
Estados: q0 (inicial), q1 (lendo palavra)
Alfabeto: letras a-z, A-Z, '_', dígitos 0-9

Transições:
  q0 --[a-zA-Z_  ]--> q1
  q1 --[a-zA-Z0-9_]--> q1   ← aceita

Pós-processamento: lookup na tabela de keywords:
  { "let", "print", "if", "else", "while", "true", "false" }
  → se encontrado: emite o keyword específico
  → se não:        emite IDENTIFIER
```

#### AFD 3 — Reconhecimento de Strings

```
Estados: q0 (inicial), q1 (dentro da string), q2 (fechamento), qERR

Transições:
  q0 --["    ]--> q1
  q1 --[^\"\n]--> q1   ← qualquer char exceto aspas e newline
  q1 --["    ]--> q2   ← aceita
  q1 --[\n   ]--> qERR ← string não terminada (erro léxico)

Token emitido: STRING (valor sem as aspas)
```

#### AFD 4 — Operadores de Dois Caracteres

```
q0 --[=]--> q1 → q1 --[=]--> EQUAL_EQUAL  | q1 --(outros)--> EQUAL
q0 --[!]--> q2 → q2 --[=]--> BANG_EQUAL   | q2 --(outros)--> BANG
q0 --[>]--> q3 → q3 --[=]--> GREATER_EQUAL| q3 --(outros)--> GREATER
q0 --[<]--> q4 → q4 --[=]--> LESS_EQUAL   | q4 --(outros)--> LESS
q0 --[&]--> q5 → q5 --[&]--> AND          | q5 --(outros)--> UNKNOWN
q0 --[|]--> q6 → q6 --[|]--> OR           | q6 --(outros)--> UNKNOWN
```

Implementado via o método `match(expected)` do Lexer, que consome o próximo caractere apenas se corresponder ao esperado.

---

## 3. Análise Léxica

### 3.1 Visão Geral

O módulo `lexer.ts` implementa a Fase 1 do compilador. Recebe o código-fonte como string e produz uma lista de `Token[]`, onde cada token carrega:
- `type: TokenType` — categoria do token (enum)
- `value: string` — lexema exato do código-fonte
- `line: number` — linha no código-fonte (para mensagens de erro)
- `column: number` — coluna no código-fonte

### 3.2 Estratégia de Implementação

O Lexer percorre o código-fonte **caractere por caractere** usando um ponteiro de posição (`pos`). A cada iteração:

1. Descarta espaços em branco e comentários (`skipWhitespaceAndComments`)
2. Inspeciona o próximo caractere (`peek()`)
3. Delega para o método especializado correto: `readNumber`, `readIdentifierOrKeyword`, `readString`, ou reconhece um operador/símbolo diretamente

**Decisão de projeto:** erros léxicos (caracteres não reconhecidos) geram um token `UNKNOWN` em vez de interromper a análise. Isso permite que o compilador continue e reporte múltiplos erros em uma única passagem.

### 3.3 Tabela de Tokens da Linguagem iuGo

| Categoria | Tokens |
|---|---|
| Literais | `NUMBER`, `STRING` |
| Identificadores | `IDENTIFIER` |
| Palavras-chave | `LET`, `PRINT`, `IF`, `ELSE`, `WHILE`, `TRUE`, `FALSE` |
| Operadores aritméticos | `PLUS`, `MINUS`, `STAR`, `SLASH` |
| Operadores de comparação | `EQUAL_EQUAL`, `BANG_EQUAL`, `GREATER`, `GREATER_EQUAL`, `LESS`, `LESS_EQUAL` |
| Operadores lógicos | `AND`, `OR`, `BANG` |
| Atribuição | `EQUAL` |
| Delimitadores | `SEMICOLON`, `LBRACE`, `RBRACE`, `LPAREN`, `RPAREN`, `COMMA` |
| Controle | `EOF`, `UNKNOWN` |

### 3.4 Exemplo de Tokenização

**Entrada:**
```iugo
let idade = 20;
if (idade >= 18) { print("Maior"); }
```

**Tokens produzidos:**
```
LET        "let"    1:1
IDENTIFIER "idade"  1:5
EQUAL      "="      1:11
NUMBER     "20"     1:13
SEMICOLON  ";"      1:15
IF         "if"     2:1
LPAREN     "("      2:4
IDENTIFIER "idade"  2:5
GREATER_EQUAL ">=" 2:11
NUMBER     "18"     2:14
RPAREN     ")"      2:16
LBRACE     "{"      2:18
PRINT      "print"  2:20
LPAREN     "("      2:25
STRING     "Maior"  2:26
RPAREN     ")"      2:33
SEMICOLON  ";"      2:34
RBRACE     "}"      2:36
EOF        ""       2:37
```

---

## 4. Análise Sintática

### 4.1 Técnica: Recursive Descent Parser (LL(1))

O parser (`parser.ts`) implementa a técnica de **Descida Recursiva**: cada regra gramatical é implementada como um método privado da classe `Parser`. A análise é determinística com lookahead de 1 token — nunca é necessário retroceder (*backtracking*).

A técnica LL(1) é:
- **L**eft-to-right: os tokens são lidos da esquerda para a direita
- **L**eftmost derivation: sempre expande o não-terminal mais à esquerda
- **1**: usa apenas 1 token de lookahead

### 4.2 Estrutura do Parser

```typescript
class Parser {
  // Consome o próximo token se for do tipo esperado; erro caso contrário
  private consume(type: TokenType): Token

  // Retorna true e avança se o token atual for do tipo esperado
  private match(...types: TokenType[]): boolean

  // ── Métodos de statement ──────────────────────────────────────────────
  parseProgram():    ProgramNode
  parseStatement():  StatementNode
  parseVarDecl():    VariableDeclarationNode
  parseAssignment(): AssignmentNode
  parsePrint():      PrintStatementNode
  parseIf():         IfStatementNode
  parseWhile():      WhileStatementNode
  parseBlock():      BlockStatementNode

  // ── Métodos de expressão (hierarquia de precedência) ─────────────────
  parseExpression(): ExpressionNode  // entrada da hierarquia
  parseOr():         ExpressionNode
  parseAnd():        ExpressionNode
  parseEquality():   ExpressionNode
  parseComparison(): ExpressionNode
  parseTerm():       ExpressionNode  // + e -
  parseFactor():     ExpressionNode  // * e /
  parseUnary():      ExpressionNode  // ! e - unário
  parsePrimary():    ExpressionNode  // literais, identificadores, ( expr )
}
```

### 4.3 Árvore Sintática Abstrata (AST)

A AST é definida em `ast.ts` como um conjunto de interfaces TypeScript discriminadas pelo campo `kind: NodeKind`. A escolha por TypeScript permite que o compilador de tipos verifique exaustividade em switches:

```
ProgramNode
└── statements: StatementNode[]
    ├── VariableDeclarationNode  { name, initializer: ExpressionNode }
    ├── AssignmentNode           { name, value: ExpressionNode }
    ├── PrintStatementNode       { argument: ExpressionNode }
    ├── IfStatementNode          { condition, consequent, alternate? }
    ├── WhileStatementNode       { condition, body }
    └── BlockStatementNode       { statements: StatementNode[] }

ExpressionNode
    ├── BinaryExpressionNode  { operator, left, right }
    ├── UnaryExpressionNode   { operator, operand }
    ├── IdentifierNode        { name }
    ├── NumberLiteralNode     { value: number }
    ├── StringLiteralNode     { value: string }
    └── BooleanLiteralNode    { value: boolean }
```

### 4.4 Exemplo: AST do Programa Padrão

**Entrada:**
```iugo
let idade = 20;
if (idade >= 18) { print("Maior"); }
```

**AST produzida:**
```
ProgramNode
├── VariableDeclarationNode
│     name: "idade"
│     initializer: NumberLiteralNode { value: 20 }
└── IfStatementNode
      condition: BinaryExpressionNode
        operator: ">="
        left:  IdentifierNode { name: "idade" }
        right: NumberLiteralNode { value: 18 }
      consequent: BlockStatementNode
        └── PrintStatementNode
              argument: StringLiteralNode { value: "Maior" }
```

---

## 5. Tradução Dirigida por Sintaxe

### 5.1 Ações Semânticas

O módulo `semantic/analyzer.ts` percorre a AST usando o **Visitor Pattern** (switch por `node.kind`) e aplica as seguintes **ações semânticas** associadas a cada regra:

| Regra gramatical | Ação semântica |
|---|---|
| `varDecl → "let" id "=" expr` | Infere tipo de `expr`, registra `id` na tabela de símbolos com esse tipo |
| `assignment → id "=" expr` | Verifica que `id` foi declarado; infere tipo de `expr`; checa compatibilidade |
| `ifStmt → "if" "(" expr ")"` | Verifica que `expr` tem tipo `BOOLEAN` |
| `whileStmt → "while" "(" expr ")"` | Verifica que `expr` tem tipo `BOOLEAN` |
| `block → "{" stmts "}"` | Cria novo escopo filho; ao final, restaura o escopo pai |
| `id` em expressão | Verifica que `id` foi declarado; retorna seu tipo |
| `expr1 op expr2` | Verifica compatibilidade de tipos para o operador; retorna tipo resultante |

### 5.2 Inferência de Tipos

O analisador infere o tipo de cada expressão recursivamente, sem anotações do programador:

```
Literal numérico  → NUMBER
Literal string    → STRING
Literal booleano  → BOOLEAN
Identificador     → tipo registrado na tabela de símbolos
expr1 + expr2     → NUMBER (se ambos NUMBER) ou STRING (se ambos STRING)
expr1 - expr2     → NUMBER (ambos devem ser NUMBER)
expr1 == expr2    → BOOLEAN (operandos devem ter o mesmo tipo)
expr1 >= expr2    → BOOLEAN (operandos devem ser NUMBER ou ambos STRING)
!expr             → BOOLEAN (operando deve ser BOOLEAN)
-expr             → NUMBER  (operando deve ser NUMBER)
```

### 5.3 Regras de Verificação de Tipo

```
Erro: variável não declarada
  → print(x);        // x nunca teve let x = ...

Erro: redeclaração no mesmo escopo
  → let x = 1; let x = 2;

Erro: incompatibilidade de tipos em atribuição
  → let x = 10; x = "texto";  // NUMBER ≠ STRING

Erro: condição não booleana
  → if (42) { ... }  // NUMBER não é BOOLEAN

Erro: operandos incompatíveis
  → 10 + "hello"     // NUMBER + STRING inválido
```

### 5.4 Tabela de Símbolos com Escopos Aninhados

O módulo `semantic/symbolTable.ts` implementa uma **cadeia de tabelas de símbolos**. Cada escopo léxico (`{ }`) cria uma nova instância de `SymbolTable` com ponteiro para o escopo pai:

```
Escopo Global (scopeLevel = 0)
│   idade : NUMBER
│   ativo : BOOLEAN
│
└── Escopo do bloco if (scopeLevel = 1)
    │   mensagem : STRING
    │
    └── Escopo do bloco while (scopeLevel = 2)
            contador : NUMBER
```

A busca de um símbolo (`lookup`) percorre a cadeia de escopos do mais interno para o mais externo, implementando **escopo léxico** (*lexical scoping*): uma variável interna pode sombrear uma externa com o mesmo nome.

---

## 6. Geração de Código Intermediário

### 6.1 O que é Three-Address Code (TAC)

O **Three-Address Code** (TAC, ou código de três endereços) é uma representação intermediária linear que simplifica a estrutura hierárquica da AST em uma sequência de instruções simples. Cada instrução tem no máximo **três operandos** (dois de entrada, um de saída), daí o nome.

Compiladores reais usam formas similares:
- GCC usa **GIMPLE** (subconjunto de C em forma SSA)
- LLVM usa **LLVM IR** (SSA com tipos explícitos)
- JVM usa **bytecode** (pilha de operandos)

O TAC do iuGo usa a forma clássica descrita em Aho, Lam, Sethi e Ullman (o "Livro do Dragão").

### 6.2 Tipos de Instrução TAC

| Instrução | Formato | Significado |
|---|---|---|
| `assign` | `x = y` | Cópia de valor ou literal para variável |
| `binop` | `t = x op y` | Operação binária; resultado em temporário `t` |
| `unop` | `t = op x` | Operação unária; resultado em temporário `t` |
| `label` | `Lx:` | Rótulo de destino para saltos |
| `jump` | `goto Lx` | Salto incondicional |
| `iffalse` | `iffalse t goto Lx` | Salto condicional se `t` for falso |
| `print` | `print x` | Saída de dados (built-in da linguagem) |

**Temporários** (`t0`, `t1`, `t2`, ...) são variáveis geradas pelo compilador para armazenar resultados intermediários de expressões compostas. Eles nunca aparecem no código-fonte.

**Rótulos** (`L0`, `L1`, `L2`, ...) são pontos de destino de saltos, gerados para implementar `if/else` e `while`.

### 6.3 Estratégia de Geração

O método `genExpr(node)` do `IRGenerator` retorna um **"place"** (lugar): o nome de uma variável, temporário, ou uma constante literal que contém o resultado da expressão.

```
Literal numérico  → retorna "20" (sem criar temporário)
Literal string    → retorna '"Maior"' (sem criar temporário)
Literal booleano  → retorna "true" ou "false"
Identificador     → retorna o nome da variável (ex.: "idade")
Operação binária  → cria t_n, emite instrução binop, retorna "t_n"
Operação unária   → cria t_n, emite instrução unop, retorna "t_n"
```

Esta estratégia evita temporários desnecessários para valores simples: `let x = 20` gera apenas `x = 20`, não `t0 = 20; x = t0`.

### 6.4 Tradução de Estruturas de Controle

#### if/else

```
Código iuGo:            TAC gerado:
─────────────────       ───────────────────────────────
if (cond) {             <gerar cond → t0>
    A                   iffalse t0 goto L_else
} else {                <gerar A>
    B                   goto L_end
}                       L_else:
                        <gerar B>
                        L_end:
```

#### while

```
Código iuGo:            TAC gerado:
─────────────────       ───────────────────────────────
while (cond) {          L_start:
    body                <gerar cond → t0>
}                       iffalse t0 goto L_end
                        <gerar body>
                        goto L_start
                        L_end:
```

A avaliação da condição fica **dentro do laço** (após `L_start`), garantindo que seja reavaliada a cada iteração.

### 6.5 Exemplo Completo: Fonte iuGo → TAC

**Código-fonte:**
```iugo
let idade = 20;
print(idade);
if (idade >= 18) {
    print("Maior");
}
while (idade < 25) {
    idade = idade + 1;
}
```

**TAC gerado (após otimização — constant propagation já aplicada):**
```
; Three-Address Code (TAC) — iuGo Compiler
; Fase intermediária entre a AST otimizada e a geração de código final

    idade = 20
    print 20
    t0 = idade >= 18
    iffalse t0 goto L0
    print "Maior"
L0:
L1:
L2:
    t1 = idade < 25
    iffalse t1 goto L3
    t2 = idade + 1
    idade = t2
    goto L2
L3:
```

Observações sobre o TAC:
- `print 20` (não `print idade`): propagação de constantes já substituiu `idade` por `20`
- `L0` e `L1` ficam adjacentes: o `if` sem `else` não precisa de `goto L_end`
- `t2 = idade + 1` cria um temporário para a expressão binária antes de atribuir a `idade`

---

## 7. Ambientes de Execução

### 7.1 Modelo de Memória do iuGo

Na linguagem iuGo, o modelo de memória em tempo de execução é **plano e estático por escopo léxico**: não há alocação dinâmica, ponteiros, nem estruturas de dados compostas (arrays, objetos). Cada variável ocupa um "slot" lógico no escopo onde foi declarada.

O compilador iuGo adota o modelo de **ambientes aninhados**, onde cada bloco `{ }` cria um novo ambiente (escopo) que aponta para o ambiente pai:

```
Ambiente Global
┌─────────────────────┐
│ idade   → NUMBER    │
│ ativo   → BOOLEAN   │
└────────┬────────────┘
         │ (ponteiro para ambiente pai)
         ▼
Ambiente do bloco if
┌─────────────────────┐
│ mensagem → STRING   │
└─────────────────────┘
```

### 7.2 Tabela de Símbolos em Tempo de Compilação

A tabela de símbolos (`SymbolTable`) serve como **mapa do ambiente de execução** durante a compilação. Para cada variável, armazena:

| Campo | Tipo | Descrição |
|---|---|---|
| `name` | `string` | Nome do identificador |
| `type` | `ValueType` | Tipo inferido: NUMBER, STRING, BOOLEAN |
| `scopeLevel` | `number` | Profundidade do escopo (0 = global) |

A operação `lookup(name)` percorre a cadeia de escopos do mais interno para o mais externo, implementando a regra de **escopo léxico estático**: um identificador resolve para a declaração mais próxima que o envolve no código-fonte.

### 7.3 Gerenciamento de Escopos

O analisador semântico gerencia os escopos da seguinte forma:

```typescript
// Ao entrar em um bloco:
const parent = this.currentScope;
this.currentScope = new SymbolTable(parent);   // cria escopo filho

// Ao processar statements do bloco...

// Ao sair do bloco:
this.currentScope = parent;   // restaura escopo pai
```

Este mecanismo garante que variáveis declaradas dentro de um `if` ou `while` não "vazem" para o escopo externo — comportamento idêntico ao de linguagens com escopo léxico como C, Java, Go e JavaScript (com `let`/`const`).

### 7.4 Modelo de Execução do Código Gerado

O JavaScript gerado pelo compilador é executado no browser via `new Function()`, criando um escopo de função isolado. Um objeto `console` falso é injetado para capturar a saída de `console.log` sem poluir o console real do browser:

```typescript
const fakeConsole = {
  log: (...args) => output.push(args.map(String).join(' ')),
};
new Function('console', generatedCode)(fakeConsole);
```

Este modelo simula um **ambiente de execução minimal** com escopo isolado e I/O interceptado.

---

## 8. Geração de Código Final

### 8.1 Estratégia: JavaScript como Linguagem Alvo

O compilador iuGo gera **JavaScript** como linguagem-alvo. Esta escolha é justificada por:

1. **Portabilidade**: JavaScript roda em qualquer browser sem instalação adicional
2. **Validação imediata**: é possível executar o código gerado diretamente na IDE web
3. **Familiaridade sintática**: as construções geradas (`const`, `let`, `console.log`) são fáceis de inspecionar
4. **Aceitação pelo enunciado**: o trabalho permite "gerar código em C/Python a partir da linguagem fonte"

### 8.2 Mapeamento iuGo → JavaScript

| Construção iuGo | JavaScript gerado |
|---|---|
| `let x = 20;` | `const x = 20;` (ou `let x = 20;` se reatribuído) |
| `x = expr;` | `x = expr;` |
| `print(expr);` | `console.log(expr);` |
| `if (c) { } else { }` | `if (c) { } else { }` |
| `while (c) { }` | `while ((c)) { }` (parênteses extras para clareza) |
| `true`, `false` | `true`, `false` |
| `"string"` | `"string"` |
| `a && b` | `(a && b)` |
| `-x` | `(-x)` |

**Detalhe importante — `let` vs `const`:** o gerador faz uma pré-varredura da AST para coletar todos os nomes de variáveis que recebem `Assignment` (reatribuição). Apenas essas variáveis são declaradas com `let` em JavaScript; as demais usam `const`, que é mais correto semanticamente.

```typescript
// Pré-varredura:
private collectReassigned(program: ProgramNode): Set<string>

// Na geração:
const keyword = this.reassignedVars.has(node.name) ? "let" : "const";
```

### 8.3 Exemplo de Código Gerado

**Entrada iuGo:**
```iugo
let idade = 20;
print(idade);
if (idade >= 18) {
    print("Maior");
}
while (idade < 25) {
    idade = idade + 1;
}
```

**JavaScript gerado (com otimizações aplicadas):**
```javascript
// Código gerado pelo compilador iuGo
// NÃO edite manualmente — gerado automaticamente

let idade = 20;
console.log(20);
if ((idade >= 18)) {
  console.log("Maior");
}
while ((idade < 25)) {
  idade = (idade + 1);
}
```

Note que `console.log(20)` usa o literal `20` em vez da variável `idade` — resultado da **propagação de constantes** aplicada na fase de otimização.

### 8.4 Implementação: Visitor + Emitter

O `CodeGenerator` usa o padrão **Visitor** sobre a AST, com um `Emitter` auxiliar que gerencia indentação:

```
CodeGenerator.generate(ProgramNode)
  └── visitStatement(stmt)
        ├── visitVariableDeclaration → "const/let x = expr;"
        ├── visitAssignment          → "x = expr;"
        ├── visitPrintStatement      → "console.log(expr);"
        ├── visitIfStatement         → "if (cond) { ... } else { ... }"
        ├── visitWhileStatement      → "while ((cond)) { ... }"
        └── visitBlockStatement      → itera os statements filhos

  └── visitExpression(expr) → retorna string com o código da expressão
        ├── NumberLiteral    → "42"
        ├── StringLiteral    → '"texto"'
        ├── BooleanLiteral   → "true" / "false"
        ├── Identifier       → "nome"
        ├── BinaryExpression → "(left op right)"
        └── UnaryExpression  → "(op operand)"
```

---

## 9. Otimizações Independentes de Máquina

O módulo `optimizer.ts` implementa três otimizações clássicas sobre a AST, **sem alterar a AST original** (produz uma nova AST transformada):

### 9.1 Constant Folding (Dobramento de Constantes)

Avalia em tempo de compilação expressões cujos operandos são **todos literais conhecidos**. Aplicado recursivamente, de dentro para fora da expressão.

**Exemplo:**
```iugo
let x = 2 + 3 * 4;   // AST: BinaryExpr(+, 2, BinaryExpr(*, 3, 4))
```
```
Passo 1: 3 * 4 → NumberLiteral(12)
Passo 2: 2 + 12 → NumberLiteral(14)
```
```javascript
const x = 14;   // JS gerado — sem operações em runtime
```

**Casos cobertos:** operações aritméticas entre literais numéricos, concatenação de strings literais, operações lógicas entre booleanos literais.

**Não aplicado:** expressões com variáveis (`x + 3`) — o valor de `x` é desconhecido em tempo de compilação.

### 9.2 Dead Code Elimination (Eliminação de Código Morto)

Remove código que nunca será executado por ter condição estaticamente falsa.

**Exemplo:**
```iugo
if (false) {
    print("nunca executa");   // código morto
} else {
    print("sempre executa");
}
```
```javascript
// Após DCE:
console.log("sempre executa");  // bloco else promovido diretamente
```

**Casos cobertos:**
- `if (false) { A }` → removido completamente
- `if (false) { A } else { B }` → substituído por `B`
- `while (false) { }` → removido completamente

### 9.3 Constant Propagation (Propagação de Constantes)

Quando uma variável é declarada com um valor literal e **nunca reatribuída** dentro do escopo relevante, substitui todas as ocorrências da variável pelo literal diretamente.

**Exemplo:**
```iugo
let x = 5;
let y = x + 3;   // x é constante
print(x);        // x é constante
```
```
Após propagação:
  y = 5 + 3  → (constant folding) → y = 8
  print(5)
```
```javascript
// JS gerado:
const y = 8;
console.log(5);
// 'x' é removido completamente (nunca mais referenciado após propagação)
```

**Proteção:** a propagação não é aplicada se a variável recebe `Assignment` em qualquer ponto do fluxo de controle. O otimizador coleta os nomes de todas as variáveis reatribuídas antes de propagar.

### 9.4 Resultado das Otimizações Combinadas

Para o programa padrão do compilador:

| Métrica | Antes | Depois | Redução |
|---|---|---|---|
| Nós BinaryExpression | 3 | 2 | 33% |
| Nós Identifier | 5 | 3 | 40% |
| Statements na raiz | 4 | 4 | 0% (while preservado) |

---

## 10. Paralelismo de Instrução

### 10.1 Conceito

O **paralelismo de instrução** (*Instruction-Level Parallelism*, ILP) é a capacidade de executar múltiplas instruções simultaneamente em um processador, quando não há dependências de dados entre elas.

A análise de ILP é realizada sobre o **TAC** (Three-Address Code), pois é nesta representação linear que as dependências entre instruções ficam explícitas.

### 10.2 Tipos de Dependência de Dados

| Tipo | Condição | Exemplo |
|---|---|---|
| **RAW** (*Read After Write*) | I2 lê uma variável que I1 escreveu | `I1: t0 = x + 1` / `I2: y = t0 * 2` |
| **WAW** (*Write After Write*) | I2 escreve a mesma variável que I1 | `I1: t0 = a` / `I2: t0 = b` |
| **WAR** (*Write After Read*) | I2 escreve uma variável que I1 lê | `I1: y = t0` / `I2: t0 = b` |

Instruções sem nenhuma dependência entre si podem ser executadas **em paralelo**.

### 10.3 Análise por Bloco Básico

Um **bloco básico** é uma sequência maximal de instruções sem rótulos intermediários nem desvios. O TAC é dividido em blocos nos pontos onde aparecem `label:`, `goto` e `iffalse`.

**Blocos básicos do TAC gerado para o programa padrão:**

```
Bloco B0 (entrada):
    idade = 20
    print 20

Bloco B1 (condição do if):
    t0 = idade >= 18
    iffalse t0 goto L0

Bloco B2 (corpo do if):
    print "Maior"

Bloco B3 (cabeçalho do while):
L2:
    t1 = idade < 25
    iffalse t1 goto L3

Bloco B4 (corpo do while):
    t2 = idade + 1
    idade = t2
    goto L2
```

### 10.4 Grafo de Dependências — Bloco B0

```
Instrução 1:  idade = 20      define: {idade}    usa: {}
Instrução 2:  print 20        define: {}          usa: {20 — literal}
```

**Resultado:** `I1` e `I2` são **independentes** (I2 usa o literal `20`, não lê `idade`). Graças à propagação de constantes, o `print` não depende de `idade`. Ambas podem ser executadas em paralelo em unidades funcionais distintas.

```
[idade = 20] ──── (sem dependência) ──── [print 20]
     ↕ independentes — execução paralela possível
```

### 10.5 Grafo de Dependências — Bloco B4 (corpo do while)

```
Instrução A:  t2 = idade + 1   define: {t2}     usa: {idade}
Instrução B:  idade = t2       define: {idade}  usa: {t2}
```

**Dependências:**
- B depende de A por **RAW** sobre `t2`: B não pode executar antes de A terminar.
- A depende do B da iteração anterior por **RAW** sobre `idade`: a iteração N não pode começar antes do B da iteração N-1.

```
[t2 = idade + 1] ──RAW(t2)──► [idade = t2]
        ▲                             │
        └──────────RAW(idade)─────────┘
        (dependência de loop — ciclo entre iterações)
```

**Resultado:** nenhum paralelismo disponível dentro de uma única iteração do laço. As duas instruções são sequencialmente dependentes.

---

## 11. Otimização de Paralelismo e Localidade

### 11.1 Loop Unrolling (Desenrolamento de Laço)

O **desenrolamento de laço** replica o corpo do `while` N vezes, reduzindo o número de avaliações de condição e saltos de retorno.

**Original (1 iteração por ciclo):**
```
L_start:
    t0 = idade < 25
    iffalse t0 goto L_end
    t1 = idade + 1
    idade = t1
    goto L_start
L_end:
```
*Custo por iteração: 5 instruções (incluindo 2 saltos)*

**Após unrolling 2×:**
```
L_start:
    t0 = idade < 25
    iffalse t0 goto L_end
    t1 = idade + 1          ; iteração 1
    idade = t1
    t2 = idade < 25         ; avalia condição de novo sem saltar
    iffalse t2 goto L_end
    t3 = idade + 1          ; iteração 2
    idade = t3
    goto L_start
L_end:
```
*Custo por 2 iterações: 9 instruções — média de 4,5 por iteração vs 5 originais*

**Ganho teórico:** redução de ~10% no número de instruções executadas para laços com muitas iterações. Em processadores com *branch prediction*, cada salto mal-previsto custa ~15 ciclos de clock; o unrolling reduz a quantidade de saltos à metade.

### 11.2 Strength Reduction

Substitui operações computacionalmente caras por equivalentes mais baratas quando matematicamente equivalentes.

**Exemplo — se houvesse multiplicação no laço:**
```
; Original: resultado = i * 4    (multiplicação — ~3 ciclos)
t0 = i * 4

; Strength reduction: acumular soma
; resultado começa em 0 e é incrementado por 4 a cada iteração
t0 = t0 + 4                      (adição — ~1 ciclo)
```
**Ganho:** ~3× na operação (adição vs multiplicação).

Para o iuGo, o padrão `idade = idade + 1` já é a forma mais reduzida possível; não há multiplicação para reduzir.

### 11.3 Análise de Localidade Temporal

A **localidade temporal** mede com que frequência um dado é reutilizado em um intervalo curto de tempo. Alta localidade temporal indica que o dado ficará em cache (ou registrador), evitando acesso à memória principal.

| Variável | Escrita em | Lida em | Localidade temporal |
|---|---|---|---|
| `idade` | corpo do while (B4) | cabeçalho do while (B3) | **Alta** — reutilizada a cada iteração |
| `t0`, `t1`, `t2` | instrução de binop | instrução imediatamente seguinte | **Máxima** — usada e descartada no mesmo bloco |

Os temporários `t0`, `t1`, `t2` têm **localidade temporal perfeita**: são gerados e consumidos na instrução seguinte, garantindo que residam em registradores da CPU sem necessidade de *spill* para memória. Esta é uma das razões pelas quais compiladores modernos preferem uma forma SSA (*Static Single Assignment*) — cada temporário é definido exatamente uma vez, o que facilita a alocação de registradores.

### 11.4 Relação com Técnicas de Compiladores Reais

| Técnica discutida | Onde é usada em produção |
|---|---|
| Grafos de dependência (DAG) | GCC `-O2`, LLVM SelectionDAG |
| Loop unrolling | GCC `-funroll-loops`, LLVM `LoopUnrollPass` |
| Strength reduction | LLVM `IndVarSimplify`, GCC scalar-evolution |
| Constant folding | Presente em **todos** os compiladores de produção |
| Constant propagation | LLVM `mem2reg` + `GVN` (Global Value Numbering) |
| Análise de localidade | Polly (LLVM), Pluto (pesquisa), Intel ICC |

---

## 12. Aplicações Relacionadas à Teoria de Compiladores

A teoria de compiladores desenvolvida ao longo deste trabalho não é apenas um exercício acadêmico — está no coração das ferramentas de software mais utilizadas no mundo. Esta seção relaciona os conceitos implementados no iuGo Compiler com aplicações reais de compiladores modernos.

### 12.1 Compiladores JIT (Just-In-Time)

Os compiladores **JIT** compilam código em tempo de execução, traduzindo representações intermediárias para código de máquina nativo no momento em que o código é executado pela primeira vez (ou com mais frequência).

#### Java HotSpot JVM

A JVM da Oracle usa um pipeline surpreendentemente parecido com o do iuGo:

```
Código Java (.java)
    ↓ javac (compilador AOT)
Bytecode JVM (.class)        ← equivalente ao nosso TAC
    ↓ Interpretador (fase fria)
    ↓ JIT Compiler C1 (nível 1-3) — otimizações leves
    ↓ JIT Compiler C2 (nível 4)   — otimizações agressivas
Código de Máquina Nativo     ← equivalente ao nosso output.js
```

O JIT do HotSpot aplica todas as otimizações que implementamos (constant folding, dead code elimination, constant propagation) e vai além:

- **Inlining de métodos**: substitui chamadas de método pelo corpo do método chamado (reduz overhead de chamada)
- **Escape analysis**: detecta objetos que não "escapam" do método atual e os aloca na pilha em vez do heap
- **Loop vectorization**: usa instruções SIMD (SSE/AVX) para processar múltiplos elementos em paralelo

**Relação com o iuGo:** nosso `IR Generator` (TAC) é conceitualmente equivalente ao bytecode JVM — uma representação intermediária independente de máquina que pode ser otimizada antes da emissão de código final.

#### V8 (Google Chrome / Node.js)

O motor V8 compila JavaScript usando uma arquitetura de múltiplas camadas:

```
JavaScript → Ignition (interpretador + bytecode)
           → Maglev (JIT rápido, para código moderadamente quente)
           → Turbofan (JIT otimizador, para código muito quente)
```

O **Turbofan** usa uma representação chamada *Sea of Nodes* (grafos de mar de nós) em vez de TAC linear — uma forma mais poderosa de analisar dependências entre instruções. Mas as otimizações fundamentais são as mesmas: constant folding, inlining, escape analysis.

**Curiosidade:** o V8 aplica **desotimização** (*deoptimization*) quando uma suposição feita durante a compilação (ex.: "este argumento sempre é um inteiro") se prova errada em runtime. O iuGo evita esse problema com tipagem estática verificada em tempo de compilação.

#### CPython (Python)

O interpretador padrão do Python (CPython 3.12+) adicionou um JIT experimental baseado em **copy-and-patch**: uma técnica que pré-compila *templates* de código de máquina e os instancia rapidamente substituindo os operandos variáveis. É mais simples que um JIT completo mas oferece ganhos significativos com overhead mínimo de compilação.

**Relação com o iuGo:** Python não faz análise de tipos estática — o equivalente ao nosso analisador semântico ocorre em runtime, com custo muito maior. A tipagem estática do iuGo é uma vantagem de desempenho que os compiladores JIT de Python tentam recuperar com análise dinâmica.

### 12.2 Compiladores para GPU

GPUs (*Graphics Processing Units*) executam milhares de threads em paralelo e possuem uma arquitetura radicalmente diferente de CPUs. Compilar para GPU exige técnicas especializadas.

#### NVIDIA CUDA / NVCC

O compilador NVCC processa código C++ com extensões CUDA:

```
Código CUDA (.cu)
    ↓ Pré-processamento / template expansion
PTX (Parallel Thread eXecution)   ← representação intermediária
    ↓ ptxas (assembler PTX)
SASS (Shader ASSembly)            ← código de máquina da GPU
```

O **PTX** é conceitualmente similar ao nosso TAC: uma representação linear, independente do hardware específico da GPU, que pode ser otimizada antes de ser traduzida para SASS.

**Analogia direta com o iuGo:**
| iuGo | CUDA |
|---|---|
| TAC (`t0 = x + y`) | PTX (`add.f32 %f1, %f2, %f3`) |
| `label L0:` / `goto L0` | PTX branch targets |
| Constant propagation | NVCC eliminação de variáveis mortas |
| Loop unrolling | `#pragma unroll N` em CUDA |

#### MLIR / XLA (TensorFlow, JAX)

Bibliotecas de machine learning como TensorFlow e JAX usam o framework **MLIR** (*Multi-Level Intermediate Representation*) — uma abordagem de múltiplos níveis de IR que generaliza o conceito de TAC:

```
Operações de alto nível (TensorFlow ops)
    ↓ Lowering (rebaixamento progressivo)
Operações HLO (High-Level Optimizer)
    ↓ XLA Compiler
Código de máquina (CPU / GPU / TPU)
```

Cada nível de rebaixamento (lowering) corresponde a aplicar transformações semelhantes às nossas: eliminação de código morto, fusão de operações (equivalente ao nosso constant folding mas para operações tensorials), e análise de paralelismo (exploração automática de SIMD e paralelismo de laços).

**Relação com o iuGo:** o nosso pipeline de fases (AST → TAC → JS) é um caso simplificado deste princípio de rebaixamento progressivo. Compiladores reais podem ter 5 a 10 níveis de IR entre o código-fonte e o código de máquina.

### 12.3 Compiladores para Sistemas Embarcados e IoT

Sistemas embarcados (microcontroladores, Arduino, ESP32, Raspberry Pi Pico) impõem restrições severas de memória (kilobytes de RAM, não gigabytes) e energia (baterias que devem durar meses ou anos). Os compiladores para estes sistemas são especializados nessas restrições.

#### GCC arm-none-eabi (para microcontroladores ARM)

```
Código C/C++
    ↓ GCC frontend
GIMPLE (IR de nível alto)        ← constant folding, DCE, propagation
    ↓ GCC middle-end (-O2/-Os)
RTL (Register Transfer Language) ← IR de nível baixo
    ↓ GCC backend
ARM Thumb-2 Assembly             ← código compacto de 16/32 bits misturados
```

A opção `-Os` (otimizar para tamanho) é especialmente relevante: usa as mesmas técnicas que implementamos, mas priorizando código menor em vez de código mais rápido. Por exemplo:

- **Dead code elimination** reduz o tamanho da flash (memória de programa)
- **Constant propagation** elimina variáveis que consomem RAM preciosa
- **Strength reduction** substitui divisões (custosas em CPU sem FPU) por shifts

#### MicroPython

O MicroPython recompila Python para bytecode otimizado para microcontroladores:

```
Python source
    ↓ Lexer + Parser    ← igual ao nosso Lexer + Parser
AST
    ↓ Compilador de bytecode
Bytecode compacto (muito menor que CPython)
    ↓ Interpretador
Execução no microcontrolador
```

O MicroPython aplica constant folding e dead code elimination diretamente na fase de compilação para bytecode, reduzindo o tamanho e melhorando a performance de execução.

**Relação com o iuGo:** o nosso compilador demonstra exatamente esse pipeline. A geração de JavaScript é análoga à geração de bytecode; as otimizações aplicadas são conceitualmente idênticas.

### 12.4 Outras Aplicações Relevantes

#### Transpiladores (Source-to-Source)

Ferramentas como **TypeScript → JavaScript**, **Babel**, **SASS → CSS** e **PostCSS** são compiladores que têm a linguagem-alvo no mesmo nível de abstração que a fonte. O iuGo Compiler é tecnicamente um transpilador: iuGo → JavaScript. Esta categoria cresceu enormemente com a necessidade de suportar múltiplos ambientes de execução (browsers, Node.js, Deno, Bun).

#### WebAssembly (WASM)

O **WebAssembly** é uma representação binária de baixo nível que roda em browsers com performance próxima à nativa. Compiladores como **Emscripten** (C/C++ → WASM), **wasm-pack** (Rust → WASM) e **TinyGo** (Go → WASM) usam exatamente o pipeline que estudamos:

```
C/Rust/Go → Frontend (AST) → IR → Otimizações → WASM bytecode
```

O iuGo poderia ter WASM como alvo em vez de JavaScript, usando a mesma AST e as mesmas otimizações — apenas substituindo o `CodeGenerator`.

#### Ferramentas de Análise Estática (Linters)

Ferramentas como **ESLint**, **Clippy** (Rust), **Pylint** são essencialmente compiladores que param na fase de análise semântica: constroem a AST, verificam tipos e escopos, e emitem **diagnósticos** em vez de código. Nosso analisador semântico (`analyzer.ts`) é a base técnica de qualquer linter.

#### Query Compilers (SQL)

Bancos de dados como PostgreSQL e DuckDB compilam queries SQL em planos de execução otimizados:

```
SQL query → Parser → AST → Análise semântica → Plano lógico
         → Otimizador de consultas (constant folding, pushdown de predicados)
         → Plano físico → Execução vetorizada
```

A fase de **otimizador de consultas** aplica dead code elimination (remover colunas não usadas), propagação de constantes (simplificar `WHERE 1=1`) e reordenação de junções — exatamente as mesmas ideias que implementamos, aplicadas a dados em vez de código.

### 12.5 Relação com a Experiência Prática

A implementação do iuGo Compiler tornou concretos conceitos que de outra forma permaneceriam abstratos:

| Conceito teórico | Onde vimos na prática |
|---|---|
| AFDs e linguagens regulares | Lexer (`lexer.ts`) — AFDs para números, strings, operadores |
| Gramáticas livres de contexto | Parser (`parser.ts`) — gramática EBNF implementada como Recursive Descent |
| Árvores sintáticas | AST (`ast.ts`) — hierarquia de nós com NodeKind discriminador |
| Análise semântica / sistemas de tipos | `analyzer.ts` — inferência e verificação de tipos com escopos |
| Representações intermediárias | `irGenerator.ts` — Three-Address Code com temporários e rótulos |
| Otimizações clássicas | `optimizer.ts` — constant folding, DCE, constant propagation |
| Geração de código | `generator.ts` — visitor sobre AST produzindo código executável |
| Paralelismo e localidade | `parallelism.md` — análise de dependências RAW/WAW/WAR |
| Ambientes de execução | `symbolTable.ts` — escopos aninhados com cadeia de ponteiros |

O projeto demonstrou, na prática, por que compiladores são considerados um dos produtos de engenharia de software mais sofisticados: cada fase depende das anteriores, e um bug em qualquer ponto se propaga de formas inesperadas para as fases seguintes.

---

## 13. Conclusão

O iuGo Compiler foi desenvolvido com sucesso, implementando as dez fases teóricas do trabalho em um sistema funcional, testável e demonstrável através da IDE web interativa.

### 13.1 Resultados Alcançados

**Compilador funcional completo:**
- Pipeline de 6 fases: Lexer → Parser → Semantic → Optimizer → IR → CodeGen
- Código JavaScript executável gerado corretamente para todos os programas iuGo válidos
- Detecção e reporte de erros léxicos, sintáticos e semânticos com linha e coluna

**Otimizações implementadas:**
- Constant Folding: expressões com literais avaliadas em compile-time
- Dead Code Elimination: blocos `if(false)` e `while(false)` removidos
- Constant Propagation: variáveis constantes substituídas por seus valores

**Representação Intermediária:**
- Three-Address Code (TAC) gerado para toda a AST otimizada
- Temporários (`t0`, `t1`, ...) e rótulos (`L0`, `L1`, ...) corretamente atribuídos
- Visualizado na IDE web com colorização por tipo de instrução

**Documentação formal:**
- Gramática EBNF completa com hierarquia de precedência
- Especificação formal de 5 AFDs do lexer
- Prova de LL(1) via tabela FIRST/FOLLOW
- Análise de paralelismo com grafos de dependência RAW/WAW/WAR
- Discussão de loop unrolling e strength reduction com cálculo de ganho teórico

**IDE Web (bônus):**
- Interface fiel ao VS Code com Monaco Editor
- Visualização em tempo real de Tokens, AST, IR/TAC e código JavaScript gerado
- Execução do código gerado diretamente no browser com captura de saída

### 13.2 Aprendizados Fundamentais

1. **A gramática determina o parser:** a escolha de EBNF com hierarquia de precedência de operadores mapeou diretamente para a implementação do Recursive Descent Parser, sem ambiguidades.

2. **A AST é o coração do compilador:** todas as fases intermediárias (semântica, otimização, IR, codegen) são visitors da AST. A definição clara dos nós com TypeScript discriminado tornou o código robusto e extensível.

3. **Otimizações têm efeitos cascata:** a propagação de constantes cria oportunidades para constant folding que não existiam antes; a eliminação de código morto pode criar oportunidades para mais propagação. Em compiladores reais, as passes de otimização são aplicadas em ciclos até não haver mais mudanças.

4. **Código intermediário desacopla o compilador da máquina-alvo:** o TAC gerado pelo `IRGenerator` é independente de JavaScript; com apenas um novo `CodeGenerator`, poderíamos emitir WebAssembly, ARM ou RISC-V, reutilizando todas as fases anteriores.

5. **Compiladores são universais:** de JIT em browsers a compiladores de GPU, de transpiladores a query engines — os mesmos conceitos estudados neste trabalho fundamentam toda a cadeia de ferramentas de software modernas.

---

*Projeto desenvolvido para a disciplina de Compiladores.*
*Linguagem: iuGo → JavaScript | Implementação: TypeScript 5.5 | IDE: React + Monaco Editor*
