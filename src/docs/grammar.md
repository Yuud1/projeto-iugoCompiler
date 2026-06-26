# Gramática Formal da Linguagem iuGo

## 1. Introdução

A linguagem **iuGo** é imperativa e estruturada. Sua gramática é descrita
aqui em duas formas complementares:

- **EBNF** (*Extended Backus–Naur Form*) — define a estrutura sintática
- **Autômato Finito Determinístico (AFD)** — descreve o reconhecimento léxico

O parser implementado (`parser.ts`) usa a técnica de **Descida Recursiva**,
que corresponde diretamente a uma gramática **LL(1)**: cada regra gramatical
mapeia para um método do parser, e o lookahead de 1 token basta para
escolher a produção correta.

---

## 2. Gramática EBNF

### Convenções

| Notação       | Significado                       |
|---------------|-----------------------------------|
| `A ::= ...`   | A é definido como                 |
| `A B`         | A seguido de B (concatenação)     |
| `A | B`       | A ou B (alternância)              |
| `{ A }`       | Zero ou mais ocorrências de A     |
| `[ A ]`       | Zero ou uma ocorrência de A       |
| `"tok"`       | Terminal literal                  |
| `MAIÚSCULO`   | Token produzido pelo lexer        |

### 2.1 Programa

```ebnf
program     ::= { statement } EOF
```

### 2.2 Statements

```ebnf
statement   ::= varDecl
              | assignment
              | printStmt
              | ifStmt
              | whileStmt
              | block

varDecl     ::= "let" IDENTIFIER "=" expression ";"
assignment  ::= IDENTIFIER "=" expression ";"
printStmt   ::= "print" "(" expression ")" ";"
ifStmt      ::= "if" "(" expression ")" block [ "else" block ]
whileStmt   ::= "while" "(" expression ")" block
block       ::= "{" { statement } "}"
```

### 2.3 Expressões (com precedência ascendente)

```ebnf
expression  ::= orExpr

orExpr      ::= andExpr { "||" andExpr }
andExpr     ::= equalExpr { "&&" equalExpr }
equalExpr   ::= relExpr { ( "==" | "!=" ) relExpr }
relExpr     ::= addExpr { ( ">" | ">=" | "<" | "<=" ) addExpr }
addExpr     ::= mulExpr { ( "+" | "-" ) mulExpr }
mulExpr     ::= unaryExpr { ( "*" | "/" ) unaryExpr }
unaryExpr   ::= ( "!" | "-" ) unaryExpr | primary
primary     ::= NUMBER
              | STRING
              | "true"
              | "false"
              | IDENTIFIER
              | "(" expression ")"
```

### 2.4 Tokens terminais (produzidos pelo Lexer)

```ebnf
IDENTIFIER  ::= ALPHA { ALPHA | DIGIT | "_" }
NUMBER      ::= DIGIT { DIGIT } [ "." DIGIT { DIGIT } ]
STRING      ::= '"' { CHAR } '"'

ALPHA       ::= "a" | ... | "z" | "A" | ... | "Z" | "_"
DIGIT       ::= "0" | ... | "9"
CHAR        ::= qualquer caractere exceto '"' e '\n'
```

### 2.5 Palavras reservadas

```
let  print  if  else  while  true  false
```

Palavras reservadas não podem ser usadas como `IDENTIFIER`.

---

## 3. Conjunto FIRST e FOLLOW (para LL(1))

A análise LL(1) exige que, para cada regra com alternativas, o FIRST
de cada alternativa seja disjunto. A tabela abaixo comprova a propriedade
para os statements:

| Não-terminal   | FIRST                                   |
|----------------|-----------------------------------------|
| `varDecl`      | `{ "let" }`                             |
| `assignment`   | `{ IDENTIFIER }`                        |
| `printStmt`    | `{ "print" }`                           |
| `ifStmt`       | `{ "if" }`                              |
| `whileStmt`    | `{ "while" }`                           |
| `block`        | `{ "{" }`                               |
| `statement`    | união dos anteriores — todos disjuntos ✓ |

Para expressões, a precedência é codificada pela hierarquia de regras
(estratégia padrão em parsers recursivos descendentes).

---

## 4. Autômato Finito Determinístico (AFD) do Lexer

O analisador léxico (`lexer.ts`) implementa implicitamente um **AFD** através
de código direto (sem gerador como Flex). Abaixo a especificação formal de
cada sub-autômato:

### 4.1 AFD de Números

```
Estado inicial: q0

q0 --[0-9]--> q1
q1 --[0-9]--> q1   (aceita: INTEGER)
q1 --[.  ]--> q2
q2 --[0-9]--> q3
q3 --[0-9]--> q3   (aceita: FLOAT)

Estados de aceitação: q1 (INTEGER), q3 (FLOAT)
Token emitido: NUMBER
```

### 4.2 AFD de Identificadores / Palavras-chave

```
Estado inicial: q0

q0 --[a-zA-Z_]--> q1
q1 --[a-zA-Z0-9_]--> q1   (aceita)

Estado de aceitação: q1
Pós-processamento: lookup na tabela de keywords → TOKEN correto
Token emitido: IDENTIFIER ou palavra-chave (LET, IF, WHILE, …)
```

### 4.3 AFD de Strings

```
Estado inicial: q0

q0 --["]--> q1
q1 --[^\"\n]--> q1   (qualquer char exceto aspas/newline)
q1 --["]--> q2        (aceita)
q1 --[\n]--> qERR     (string não terminada)

Estado de aceitação: q2
Token emitido: STRING
```

### 4.4 AFD de Operadores de dois caracteres

```
Estado inicial: q0

q0 --[=]--> q1 ;  q1 --[=]--> EQUAL_EQUAL  |  q1 → EQUAL
q0 --[!]--> q2 ;  q2 --[=]--> BANG_EQUAL   |  q2 → BANG
q0 --[>]--> q3 ;  q3 --[=]--> GREATER_EQUAL|  q3 → GREATER
q0 --[<]--> q4 ;  q4 --[=]--> LESS_EQUAL   |  q4 → LESS
q0 --[&]--> q5 ;  q5 --[&]--> AND          |  q5 → UNKNOWN
q0 --[|]--> q6 ;  q6 --[|]--> OR           |  q6 → UNKNOWN
```

Implementado em `lexer.ts` via o método `match(expected)` que consome
o próximo caractere apenas se ele corresponder ao esperado.

### 4.5 AFD de Comentários de linha

```
q0 --[/]--> q1
q1 --[/]--> q2
q2 --[^\n]--> q2   (descarta)
q2 --[\n  ]--> FIM (comentário consumido, lexer continua)
```

---

## 5. Paradigma da Linguagem

iuGo segue o paradigma **imperativo estruturado**:

- **Imperativo**: o programa é uma sequência de comandos que modificam
  o estado (variáveis) de forma explícita.
- **Estruturado**: todo controle de fluxo usa construções de bloco
  (`if/else`, `while`) sem `goto` exposto ao programador.
- **Tipagem dinâmica implícita**: os tipos são inferidos na análise semântica
  e verificados em tempo de compilação (sem anotações de tipo no código-fonte).
