**UNIVERSIDADE FEDERAL DO TOCANTINS**  
**CAMPUS DE PALMAS**

**CURSO DE CIÊNCIA DA COMPUTAÇÃO**

**LUCAS YUDI MODESTO**

**iuGo Compiler: Mini-Compilador com Pipeline Completo**  
**da Análise Léxica à Geração de Código Otimizado**

**Palmas, TO**  
**2026**  
**Lucas Yudi Modesto**

---

**iuGo Compiler: Mini-Compilador com Pipeline Completo da Análise Léxica à Geração de Código Otimizado**

Projeto de pesquisa apresentado à UFT – Universidade Federal do Tocantins, Campus Universitário de Palmas-TO, como requisito da disciplina de **Compiladores**.

Coordenador: *(preencher nome do professor)*

**Palmas, TO**  
**2026**

---

**LISTA DE ILUSTRAÇÕES**

Figura 1 — Pipeline de compilação do iuGo Compiler  
Figura 2 — Exemplo de programa iuGo e saída JavaScript gerada  
Figura 3 — Interface da IDE web (editor, tokens, AST e IR)

Quadro 1 — Fases do pipeline e suas responsabilidades  
Quadro 2 — Construções suportadas pela linguagem iuGo  
Quadro 3 — Otimizações implementadas no compilador  
Quadro 4 — Exemplos de programas utilizados na validação

---

**SUMÁRIO**

| 1 | INTRODUÇÃO | |
| :---- | :---- | :---- |
| 2 | OBJETIVOS | |
| 2.1 | Objetivo geral | |
| 2.2 | Objetivos específicos | |
| 3 | DESCRIÇÃO DO PROJETO E DA LINGUAGEM iuGo | |
| 4 | ARQUITETURA DO COMPILADOR | |
| 5 | METODOLOGIA DE DESENVOLVIMENTO | |
| 6 | IMPLEMENTAÇÃO DAS FASES DO PIPELINE | |
| 7 | FERRAMENTAS, VALIDAÇÃO E RESULTADOS | |
| 8 | POSSÍVEIS MELHORIAS | |
| 9 | CONCLUSÃO | |
| | REFERÊNCIAS | |

---

## 1. INTRODUÇÃO

Compiladores são programas responsáveis por traduzir código-fonte escrito em uma linguagem de programação para uma forma executável por uma máquina ou por outro ambiente de execução. Esse processo envolve diversas etapas — análise léxica, análise sintática, análise semântica, otimização, geração de código intermediário e geração de código final — que transformam gradualmente o programa de uma representação textual para estruturas cada vez mais próximas da execução.

Segundo Aho, Lam, Sethi e Ullman (2007), a construção de um compilador exige o domínio de linguagens formais, autômatos, gramáticas, árvores sintáticas e técnicas de tradução. Por isso, a implementação de um mini-compilador é uma forma eficaz de consolidar, na prática, os conteúdos teóricos da disciplina de Compiladores.

Neste contexto, o presente trabalho apresenta o **iuGo Compiler**: um mini-compilador acadêmico desenvolvido em **TypeScript** para a linguagem **iuGo**, uma linguagem imperativa simplificada inspirada em JavaScript e Go. O projeto implementa um pipeline completo de compilação, desde a tokenização do código-fonte até a geração de JavaScript executável, incluindo otimizações independentes de máquina e representação intermediária em **Three-Address Code (TAC)**.

Além da implementação em linha de comando (CLI), o projeto conta com uma **IDE web** que permite visualizar tokens, AST, IR, erros de compilação e o código gerado em tempo real, facilitando a demonstração do funcionamento interno do compilador.

---

## 2. OBJETIVOS

Esta seção apresenta os objetivos que orientam o desenvolvimento deste trabalho. Eles definem o que se pretende alcançar com a implementação do mini-compilador e servem como referência para avaliar se o projeto atende aos requisitos acadêmicos propostos.

### 2.1 Objetivo geral

Desenvolver um mini-compilador completo para a linguagem iuGo, implementando as fases clássicas de compilação e demonstrando, de forma prática, a tradução de programas imperativos para código JavaScript executável.

### 2.2 Objetivos específicos

1. Definir a gramática formal da linguagem iuGo em EBNF e implementar um analisador léxico capaz de gerar tokens a partir do código-fonte.
2. Implementar um parser recursivo descendente (LL(1)) que construa a Árvore Sintática Abstrata (AST).
3. Realizar análise semântica com inferência de tipos, verificação de escopos e detecção de erros.
4. Aplicar otimizações sobre a AST, como constant folding, eliminação de código morto, propagação de constantes e desenrolamento de loops simples.
5. Gerar código intermediário (TAC) e código final em JavaScript.
6. Disponibilizar ferramentas de apoio (CLI interativa e IDE web) para visualização e validação de cada fase do pipeline.

---

## 3. DESCRIÇÃO DO PROJETO E DA LINGUAGEM iuGo

A linguagem **iuGo** foi projetada com construções mínimas, suficientes para demonstrar os conceitos centrais de um compilador, sem a complexidade de linguagens de propósito geral.

### 3.1 Tipos de dados

Os tipos são inferidos automaticamente pelo analisador semântico:

- **NUMBER** — inteiros e decimais (ex.: `42`, `3.14`)
- **STRING** — cadeias entre aspas duplas (ex.: `"Olá"`)
- **BOOLEAN** — valores lógicos `true` e `false`

### 3.2 Construções da linguagem

| Recurso | Sintaxe |
|---------|---------|
| Declaração | `let nome = valor;` |
| Atribuição | `nome = expressao;` |
| Saída | `print(expressao);` |
| Condicional | `if (cond) { } else { }` |
| Laço | `while (cond) { }` |
| Comentário | `// linha` |

### 3.3 Exemplo de programa

```iugo
let idade = 20;

print(idade);

if (idade >= 18) {
    print("Maior");
}

while (idade < 25) {
    print(idade);
    idade = idade + 1;
}
```

Após compilação e otimização, o programa pode gerar JavaScript equivalente com literais já calculados em tempo de compilação, eliminando trechos sem efeito observável na saída.

---

## 4. ARQUITETURA DO COMPILADOR

O iuGo Compiler segue a arquitetura clássica de **pipeline de fases**, em que cada etapa consome a saída da anterior e produz uma representação mais refinada do programa.

```
Código-fonte (.iugo)
        │
        ▼
   Lexer          →  Token[]
        │
        ▼
   Parser         →  AST (ProgramNode)
        │
        ▼
   Semântica      →  validação de tipos e escopos
        │
        ▼
   Optimizer      →  AST otimizada
        │
        ▼
   IR Generator   →  Three-Address Code (TAC)
        │
        ▼
   Code Generator →  JavaScript (output.js)
```

**Quadro 1 — Fases do pipeline e suas responsabilidades**

| Fase | Entrada | Saída | Responsabilidade |
|------|---------|-------|------------------|
| Lexer | Texto fonte | `Token[]` | Reconhecer palavras, números, operadores e delimitadores |
| Parser | Tokens | AST | Verificar sintaxe e montar árvore sintática |
| Semântica | AST | AST validada | Checar tipos, declarações e uso de variáveis |
| Optimizer | AST | AST otimizada | Reduzir expressões e remover código morto |
| IR Generator | AST otimizada | TAC | Gerar instruções de três endereços |
| Code Generator | AST otimizada | JavaScript | Emitir código executável |

### 4.1 Decisões arquiteturais

- **TypeScript** foi escolhido por oferecer tipagem estática nas interfaces da AST, reduzindo erros e documentando a estrutura da linguagem.
- **Parser recursivo descendente** foi adotado por ser didático e mapear diretamente cada regra da gramática EBNF para um método do parser.
- **Visitor pattern** é utilizado nas fases de semântica, otimização e geração de código para percorrer a AST de forma organizada.
- **JavaScript** foi escolhido como alvo inicial para validação rápida com Node.js ou no navegador.

---

## 5. METODOLOGIA DE DESENVOLVIMENTO

O projeto foi desenvolvido de forma incremental, em sprints alinhadas às fases do compilador:

1. Definição da gramática EBNF e dos tokens da linguagem.
2. Implementação do lexer e do parser com tratamento de erros (linha e coluna).
3. Implementação da análise semântica com tabela de símbolos e escopos.
4. Implementação do otimizador sobre a AST.
5. Geração de código intermediário (TAC) e código JavaScript.
6. Construção da CLI interativa com modo demonstração passo a passo.
7. Desenvolvimento da IDE web para visualização do pipeline.

A validação foi feita com programas de exemplo que cobrem casos normais, otimizações e erros semânticos:

| Arquivo | Finalidade |
|---------|------------|
| `examples/idade.iugo` | Programa completo com `if`, `while` e `print` |
| `examples/fold.iugo` | Constant folding |
| `examples/propagacao.iugo` | Propagação de constantes |
| `examples/dead-code.iugo` | Eliminação de código morto |
| `examples/erro-semantico.iugo` | Detecção de erro semântico |

---

## 6. IMPLEMENTAÇÃO DAS FASES DO PIPELINE

### 6.1 Análise léxica

O lexer percorre o código-fonte caractere a caractere e emite tokens com tipo, valor, linha e coluna. Palavras reservadas (`let`, `print`, `if`, `while`, etc.) são reconhecidas por tabela de keywords. Caracteres inválidos produzem token `UNKNOWN`, permitindo reportar erro sem interromper a tokenização.

### 6.2 Análise sintática

O parser utiliza **descida recursiva** com hierarquia de expressões para respeitar a precedência de operadores (`*`, `/`, `+`, `-`, comparações, lógicos). A gramática é **LL(1)**: os conjuntos FIRST dos statements são disjuntos, permitindo escolher a produção correta com lookahead de um token.

Erros sintáticos lançam `ParseError` com posição no código-fonte.

### 6.3 Análise semântica

O analisador semântico percorre a AST e:

- verifica se variáveis foram declaradas antes do uso;
- infere tipos (`NUMBER`, `STRING`, `BOOLEAN`);
- valida operandos de operações aritméticas, comparações e condicionais;
- exige expressões booleanas em `if` e `while`.

Erros semânticos lançam `SemanticError` com linha e coluna.

### 6.4 Otimização

**Quadro 3 — Otimizações implementadas**

| Otimização | Descrição | Exemplo |
|------------|-----------|---------|
| Constant folding | Avalia expressões com literais em compile-time | `2 + 3 * 4` → `14` |
| Dead code elimination | Remove blocos inalcançáveis ou sem efeito | `if (false) { ... }` removido |
| Constant propagation | Substitui identificadores por literais conhecidos | `let x = 5; print(x)` → `print(5)` |
| Loop unrolling | Desenrola loops contados com limites literais | `while (x < 25) { print(x); x = x+1 }` → sequência de `print` |

As otimizações são aplicadas sobre a AST antes da geração de IR e de JavaScript.

### 6.5 Código intermediário (TAC)

O gerador de IR produz instruções de três endereços, como atribuições, operações binárias, saltos condicionais, labels e `print`. Essa representação linear facilita análise de fluxo de controle e estudo de paralelismo de instruções.

### 6.6 Geração de código

O gerador de JavaScript traduz a AST otimizada para código executável:

- `let` iuGo → `const` ou `let` em JS (conforme reatribuição);
- `print(expr)` → `console.log(expr)`.

A saída é gravada em `dist/output.js` e pode ser executada com `node dist/output.js`.

---

## 7. FERRAMENTAS, VALIDAÇÃO E RESULTADOS

### 7.1 CLI interativa

A interface de linha de comando oferece:

- menu interativo;
- modo demonstração passo a passo (ideal para apresentação);
- compilação direta de arquivos `.iugo`;
- exibição de tokens, AST, semântica, otimizações, IR e JavaScript.

Comandos principais:

```bash
npm start
npm run demo:idade
npm start -- --file examples/fold.iugo
node dist/output.js
```

### 7.2 IDE web

A IDE web (React + Vite + Monaco Editor) permite:

- editar código iuGo com destaque de sintaxe e diagnóstico de erros;
- visualizar tokens, AST (original e otimizada), IR e JavaScript gerado;
- acompanhar o pipeline fase a fase;
- executar o JavaScript gerado e depurar o TAC passo a passo.

### 7.3 Resultados obtidos

O compilador traduz corretamente programas iuGo válidos para JavaScript funcional. Erros léxicos, sintáticos e semânticos são reportados com fase, mensagem e posição no código. As otimizações reduzem o código gerado e demonstram análise em tempo de compilação. O modo demo e a IDE web permitem apresentar o funcionamento interno do compilador de forma clara à banca.

---

## 8. POSSÍVEIS MELHORIAS

Com base no estado atual do projeto, as seguintes extensões podem ser consideradas:

1. **Novas construções da linguagem** — funções, parâmetros, tipos explícitos, arrays e estruturas de controle adicionais.
2. **Back-end alternativo** — geração de WebAssembly ou bytecode em vez de JavaScript.
3. **Otimizações avançadas** — forma SSA, alocação de registradores, análise de fluxo de dados mais completa.
4. **Máquina virtual** — interpretador completo do TAC independente do JavaScript.
5. **Testes automatizados** — suite de testes unitários e de integração para cada fase do pipeline.
6. **Suporte a módulos** — compilação de múltiplos arquivos e linking simbólico.

Essas melhorias ampliariam o escopo do compilador, mantendo a base arquitetural já implementada.

---

## 9. CONCLUSÃO

O projeto **iuGo Compiler** atingiu o objetivo de implementar um mini-compilador educacional com pipeline completo: análise léxica, sintática, semântica, otimização, geração de IR (TAC) e geração de código JavaScript. A linguagem iuGo, embora simplificada, permite demonstrar os conceitos fundamentais da teoria de compiladores de forma prática.

As otimizações implementadas evidenciam transformações em compile-time que reduzem trabalho em tempo de execução. A CLI e a IDE web complementam a implementação, facilitando a validação, a demonstração em sala de aula e a compreensão do fluxo de compilação.

De modo geral, o trabalho consolida o conteúdo da disciplina de Compiladores e oferece uma base extensível para evoluções futuras do compilador.

---

## REFERÊNCIAS

AHO, Alfred V.; LAM, Monica S.; SETHI, Ravi; ULLMAN, Jeffrey D. **Compiladores: princípios, técnicas e ferramentas**. 2. ed. São Paulo: Pearson Education do Brasil, 2007.

COOPER, Keith D.; TORCZON, Linda. **Engenharia de Compiladores**. 2. ed. Rio de Janeiro: Elsevier, 2013.

MUCHNICK, Steven S. **Advanced Compiler Design and Implementation**. San Francisco: Morgan Kaufmann, 1997.

Documentação do projeto iuGo Compiler. Disponível em: repositório local — `README.md`, `src/docs/grammar.md`, `src/docs/architecture.md`, `src/docs/relatorio-final.md`.

**TypeScript**. Documentação oficial. Disponível em: https://www.typescriptlang.org/docs/. Acesso em: maio de 2026.

**Node.js**. Documentação oficial. Disponível em: https://nodejs.org/docs/. Acesso em: maio de 2026.
