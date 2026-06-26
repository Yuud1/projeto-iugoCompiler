# iuGo Compiler

Mini-compilador acadêmico para a linguagem **iuGo**, desenvolvido em **TypeScript**. O projeto implementa o pipeline clássico de compiladores — da análise léxica até a geração de código otimizado — com CLI interativa para demonstração em apresentações.

---

## Pipeline

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
   Code Generator →  JavaScript (dist/output.js)
```

---

## Linguagem iuGo

Linguagem imperativa simplificada, inspirada em JavaScript e Go.

```iugo
let idade = 20;
print(idade);

if (idade >= 18) {
    print("Maior");
}

while (idade < 30) {
    idade = idade + 1;
}
```

**Suporte atual:**

| Recurso | Sintaxe |
|---------|---------|
| Declaração | `let nome = valor;` |
| Atribuição | `nome = expressao;` |
| Saída | `print(expressao);` |
| Condicional | `if (cond) { } else { }` |
| Laço | `while (cond) { }` |
| Comentário | `// linha` |

**Tipos inferidos:** `NUMBER`, `STRING`, `BOOLEAN`

Documentação completa: [`src/docs/syntax.md`](src/docs/syntax.md) · Gramática EBNF: [`src/docs/grammar.md`](src/docs/grammar.md)

---

## Requisitos

- [Node.js](https://nodejs.org/) 18+
- npm

---

## Instalação

```bash
git clone <url-do-repositorio>
cd compiladores
npm install
npm run build
```

---

## Uso — CLI

### Menu interativo (recomendado)

```bash
npm start
```

Opções do menu:

1. **Modo demonstração** — passo a passo (ideal para apresentação)
2. Compilar arquivo `.iugo`
3. Digitar código inline
4. Exemplos prontos
5. Compilação rápida (pipeline completo)
6. Sobre o projeto

### Demonstração passo a passo

```bash
npm run demo              # programa padrão
npm run demo:idade        # exemplo examples/idade.iugo
npm run demo -- --file examples/fold.iugo
```

A cada fase, pressione **ENTER** para avançar: tokens → AST → semântica → otimização → IR → JavaScript → execução.

### Compilar arquivo direto

```bash
npm start -- --file examples/idade.iugo
npm start -- --file examples/idade.iugo --no-intro
```

Saída JavaScript gravada em **`dist/output.js`**.

### Executar o código gerado

```bash
node dist/output.js
```

---

## Exemplos

| Arquivo | O que demonstra |
|---------|-----------------|
| `examples/idade.iugo` | Programa completo (if, while, print) |
| `examples/fold.iugo` | Constant folding (`2 + 3 * 4` → `14`) |
| `examples/propagacao.iugo` | Propagação de constantes |
| `examples/dead-code.iugo` | Eliminação de código morto (`if false`) |
| `examples/erro-semantico.iugo` | Erro — variável não declarada |

---

## Estrutura do projeto

```
compiladores/
├── src/
│   ├── compiler/
│   │   ├── lexer/          # Análise léxica (Token, Lexer)
│   │   ├── parser/         # Parser recursivo + AST
│   │   ├── semantic/       # Análise semântica + SymbolTable
│   │   ├── optimizer/      # Constant folding, DCE, propagação
│   │   ├── ir/             # Three-Address Code
│   │   └── codegen/        # Geração de JavaScript
│   ├── cli/                # CLI interativa e modo demo
│   ├── docs/               # Documentação acadêmica
│   └── main.ts             # Entrypoint → CLI
├── examples/               # Programas iuGo de exemplo
├── dist/                   # Saída compilada + output.js
└── web/                    # IDE web opcional (React + Monaco)
```

---

## Scripts npm

| Comando | Descrição |
|---------|-----------|
| `npm start` | CLI interativa com animação de abertura |
| `npm run demo` | Modo demonstração passo a passo |
| `npm run demo:idade` | Demo com `examples/idade.iugo` |
| `npm run build` | Compila TypeScript → `dist/` |
| `npm run clean` | Remove `dist/` |

**Flags úteis:**

| Flag | Efeito |
|------|--------|
| `--demo` / `-d` | Inicia direto no modo demonstração |
| `--file <path>` / `-f` | Arquivo `.iugo` de entrada |
| `--no-intro` | Pula animação de abertura |

---

## Otimizações implementadas

- **Constant folding** — expressões literais avaliadas em compile-time (`2 + 3` → `5`)
- **Dead code elimination** — blocos com condição sempre falsa removidos
- **Constant propagation** — substituição de identificadores por literais conhecidos

---

## Documentação acadêmica

| Documento | Conteúdo |
|-----------|----------|
| [`src/docs/relatorio-final.md`](src/docs/relatorio-final.md) | Relatório completo do trabalho |
| [`src/docs/architecture.md`](src/docs/architecture.md) | Arquitetura e decisões técnicas |
| [`src/docs/grammar.md`](src/docs/grammar.md) | Gramática EBNF + autômato léxico |
| [`src/docs/parallelism.md`](src/docs/parallelism.md) | Paralelismo de instrução no TAC |
| [`src/docs/roadmap.md`](src/docs/roadmap.md) | Roadmap de sprints |
| [`Trabalho de Compiladores 06032026.pdf`](Trabalho%20de%20Compiladores%2006032026.pdf) | Enunciado do trabalho |

---

## IDE web (opcional)

Há uma interface web em `web/` (React + Vite + Monaco Editor) que visualiza tokens, AST, IR e código gerado no browser.

```bash
cd web
npm install
npm run dev
```

---

## Apresentação

Roteiro sugerido para demo ao vivo:

1. `npm run demo:idade` — percorrer cada fase com ENTER
2. `npm run demo -- --file examples/fold.iugo --no-intro` — mostrar otimização
3. `npm run demo -- --file examples/erro-semantico.iugo --no-intro` — mostrar erro semântico

---

## Tecnologias

- **TypeScript 5** — linguagem do compilador
- **Recursive Descent Parser** — análise sintática (LL(1))
- **Visitor Pattern** — percurso da AST (semântica, otimizador, codegen)
- **Node.js** — execução da CLI e do JavaScript gerado

---

## Licença

ISC
# projeto-iugoCompiler
