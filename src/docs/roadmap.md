# Roadmap do iuGo Compiler

## Visão Geral

O compilador iuGo é desenvolvido de forma incremental, com cada sprint adicionando uma nova fase ao pipeline. Ao final do roadmap, teremos um compilador completo capaz de analisar, validar e transpiliar programas iuGo para JavaScript.

---

## Sprint 1 — Linguagem iuGo

**Objetivo:** Definir e documentar a linguagem iuGo antes de implementar qualquer código.

**Entregas:**
- [x] Definição da sintaxe básica (variáveis, print, if, while)
- [x] Documentação da gramática em `syntax.md`
- [x] Definição dos tipos de tokens em `tokenTypes.ts`
- [x] Identificação das palavras-chave reservadas
- [x] Definição da estratégia de erros léxicos/sintáticos

**Resultado:** A linguagem está especificada. Qualquer desenvolvedor pode ler `syntax.md` e saber o que o compilador deve aceitar.

---

## Sprint 2 — Lexer (Análise Léxica)

**Objetivo:** Implementar o lexer que transforma código-fonte em tokens.

**Entregas:**
- [x] `token.ts` — interface `Token` com metadados de posição
- [x] `tokenTypes.ts` — enum `TokenType` completo + mapa de keywords
- [x] `lexer.ts` — classe `Lexer` com tokenização completa
  - [x] Números inteiros e decimais
  - [x] Strings entre aspas duplas
  - [x] Identificadores e palavras-chave
  - [x] Operadores simples e compostos (`>=`, `==`, `!=`, etc.)
  - [x] Operadores lógicos (`&&`, `||`, `!`)
  - [x] Comentários de linha (`//`)
  - [x] Rastreamento de linha e coluna
  - [x] Tratamento de erros léxicos (token `UNKNOWN`)

**Status:** ✅ Concluído

---

## Sprint 3 — Parser (Análise Sintática)

**Objetivo:** Implementar o Recursive Descent Parser que constrói a AST.

**Entregas:**
- [x] `ast.ts` — interfaces de todos os nós da AST
- [ ] `parser.ts` — implementação completa do parser
  - [ ] `parseVariableDeclaration()` — `let x = expr;`
  - [ ] `parseAssignment()` — `x = expr;`
  - [ ] `parsePrintStatement()` — `print(expr);`
  - [ ] `parseIfStatement()` — `if (cond) { } else { }`
  - [ ] `parseWhileStatement()` — `while (cond) { }`
  - [ ] `parseExpression()` — hierarquia de precedência completa
  - [ ] Tratamento de erros sintáticos com posição

**Dependências:** Sprint 2 (Lexer)

**Estimativa:** 1 semana

---

## Sprint 4 — Análise Semântica

**Objetivo:** Validar o programa na AST, verificando tipos e escopos.

**Entregas:**
- [x] `symbolTable.ts` — tabela de símbolos com escopos aninhados
- [ ] `semantic/analyzer.ts` — analisador semântico (visitante da AST)
  - [ ] Verificar variável não declarada antes do uso
  - [ ] Verificar redeclaração de variável no mesmo escopo
  - [ ] Inferir tipos a partir dos valores iniciais
  - [ ] Verificar compatibilidade de tipos em operações binárias
  - [ ] Verificar tipos em condições de `if` e `while`

**Dependências:** Sprint 3 (Parser)

**Estimativa:** 1 semana

---

## Sprint 5 — Otimização e Geração de Código

**Objetivo:** Otimizar a AST e gerar código JavaScript executável.

**Entregas:**
- [ ] `optimizer.ts` — implementar otimizações:
  - [ ] Constant Folding: `2 + 3` → `5`
  - [ ] Dead Code Elimination: `if (false) { }` → removido
  - [ ] Constant Propagation: `let x = 5; print(x);` → `print(5);`
- [ ] `generator.ts` — implementar geração de JavaScript:
  - [ ] Transpilação de todos os nós da AST
  - [ ] Indentação correta do código gerado
  - [ ] Saída como arquivo `.js`

**Dependências:** Sprint 4 (Semântica)

**Estimativa:** 1-2 semanas

---

## Sprint 6 — Interface de Usuário (UI) *(bônus)*

**Objetivo:** Criar uma interface web para interagir com o compilador.

**Entregas:**
- [ ] Editor de código com syntax highlight para iuGo
- [ ] Painel de tokens (saída do lexer)
- [ ] Visualização gráfica da AST
- [ ] Console de saída do programa compilado
- [ ] Exibição de erros léxicos/sintáticos em linha

**Tecnologias sugeridas:** React, Monaco Editor, D3.js para a árvore

**Estimativa:** 2-3 semanas

---

## Sprint 7 — Representação Intermediária *(avançado)*

**Objetivo:** Gerar uma IR (Intermediate Representation) ao invés de JavaScript direto.

**Entregas:**
- [ ] Definir formato de IR para iuGo (inspirado em LLVM IR ou bytecode de JVM)
- [ ] `ir/irGenerator.ts` — gerar IR a partir da AST
- [ ] `ir/irInterpreter.ts` — executar a IR (máquina virtual simples)

**Estimativa:** 2-3 semanas

---

## Estado Atual

```
Sprint 1 ✅  Linguagem definida
Sprint 2 ✅  Lexer implementado
Sprint 3 🔧  AST definida, parser pendente
Sprint 4 🔧  SymbolTable estruturada, análise semântica pendente
Sprint 5 🔧  Estrutura do optimizer e codegen criada, implementação pendente
Sprint 6 ⏳  Não iniciada
Sprint 7 ⏳  Não iniciada
```
