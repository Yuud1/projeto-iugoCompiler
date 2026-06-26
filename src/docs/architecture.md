# Arquitetura do iuGo Compiler

## Visão Geral

O **iuGo Compiler** é um mini compilador acadêmico desenvolvido em TypeScript para a linguagem iuGo — uma linguagem imperativa simplificada com fins educacionais.

O compilador segue a arquitetura clássica de **pipeline de fases**, onde cada fase transforma a representação do programa em uma forma mais próxima do código executável.

---

## Pipeline de Compilação

```
Código-fonte (.iugo)
        │
        ▼
┌──────────────────┐
│   LEXER          │  Fase 1 — Análise Léxica
│  lexer.ts        │  Transforma char[] → Token[]
└────────┬─────────┘
         │ Token[]
         ▼
┌──────────────────┐
│   PARSER         │  Fase 2 — Análise Sintática
│  parser.ts       │  Transforma Token[] → AST
└────────┬─────────┘
         │ ProgramNode (AST)
         ▼
┌──────────────────┐
│   SEMANTIC       │  Fase 3 — Análise Semântica
│  symbolTable.ts  │  Valida tipos, escopos, declarações
└────────┬─────────┘
         │ AST validada
         ▼
┌──────────────────┐
│   OPTIMIZER      │  Fase 4 — Otimização
│  optimizer.ts    │  Constant folding, dead code elimination
└────────┬─────────┘
         │ AST otimizada
         ▼
┌──────────────────┐
│   CODEGEN        │  Fase 5 — Geração de Código
│  generator.ts    │  AST → JavaScript / bytecode
└──────────────────┘
         │
         ▼
   Código de saída
```

---

## Responsabilidade de Cada Módulo

### `src/compiler/lexer/`

| Arquivo         | Responsabilidade                                              |
|-----------------|---------------------------------------------------------------|
| `tokenTypes.ts` | `enum TokenType` com todos os tokens + mapa de keywords      |
| `token.ts`      | Interface `Token` (type, value, line, column) + `createToken`|
| `lexer.ts`      | Classe `Lexer` — percorre o source e emite `Token[]`         |

**Status:** ✅ Implementado (Sprint 2)

---

### `src/compiler/parser/`

| Arquivo    | Responsabilidade                                                 |
|------------|------------------------------------------------------------------|
| `ast.ts`   | Interfaces de todos os nós da AST (`ProgramNode`, etc.)         |
| `parser.ts`| Classe `Parser` — Recursive Descent Parser (Sprint 3)           |

**Status:** 🔧 Estrutura criada, implementação pendente (Sprint 3)

---

### `src/compiler/semantic/`

| Arquivo          | Responsabilidade                                          |
|------------------|-----------------------------------------------------------|
| `symbolTable.ts` | Tabela de símbolos com suporte a escopos aninhados        |

**Status:** 🔧 Estrutura criada, implementação pendente (Sprint 4)

---

### `src/compiler/optimizer/`

| Arquivo        | Responsabilidade                                            |
|----------------|-------------------------------------------------------------|
| `optimizer.ts` | Constant folding, dead code elimination sobre a AST         |

**Status:** 🔧 Estrutura criada, implementação pendente (Sprint 5)

---

### `src/compiler/codegen/`

| Arquivo        | Responsabilidade                                            |
|----------------|-------------------------------------------------------------|
| `generator.ts` | Visitor pattern sobre a AST para emitir JavaScript          |

**Status:** 🔧 Estrutura criada, implementação pendente (Sprint 5)

---

### `src/main.ts`

Entrypoint do compilador. Orquestra o pipeline chamando cada fase em sequência e exibindo o resultado no console.

---

## Decisões Arquiteturais

### Por que TypeScript?
TypeScript oferece tipagem estática que torna o código do compilador mais seguro e autodocumentado. Os tipos das interfaces da AST servem como documentação viva da gramática.

### Por que Recursive Descent Parser?
É a abordagem mais didática, fácil de entender e de estender. Cada regra gramatical corresponde diretamente a um método no parser.

### Por que gerar JavaScript inicialmente?
Permite validar o compilador rapidamente — basta rodar `node` no arquivo gerado. Facilita comparar o comportamento esperado com o real.

### Por que separar Optimizer da AST?
O optimizer é um visitante da AST, mantendo o princípio de responsabilidade única. A AST é imutável conceitualmente; o optimizer produz uma nova AST transformada.

---

## Convenções do Projeto

- **Erros léxicos:** produzem token `UNKNOWN` (sem interromper o lexer)
- **Erros sintáticos:** lançam `ParseError` com linha e coluna
- **Erros semânticos:** lançam `SemanticError` com linha e coluna
- **TODOs:** marcados com `// TODO: descrição — Sprint N` para rastreabilidade
