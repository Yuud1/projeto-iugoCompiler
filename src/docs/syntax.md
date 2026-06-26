# Sintaxe da Linguagem iuGo

## Introdução

**iuGo** é uma linguagem imperativa simplificada criada para fins acadêmicos. Sua sintaxe é inspirada em linguagens como JavaScript e Go, mas com um conjunto mínimo de construções que facilitam o aprendizado de compiladores.

---

## Elementos Básicos

### Comentários

```iugo
// Isto é um comentário de linha
```

> Comentários de bloco (`/* */`) serão adicionados em versão futura.

---

### Literais

| Tipo      | Exemplo          | Descrição                     |
|-----------|------------------|-------------------------------|
| Número    | `42`, `3.14`     | Inteiros e decimais           |
| String    | `"Olá, mundo!"`  | Texto entre aspas duplas      |
| Booleano  | `true`, `false`  | Valores lógicos               |

---

### Identificadores

Nomes de variáveis devem começar com letra ou `_`, seguidos de letras, dígitos ou `_`.

```iugo
idade
nomeCompleto
_valor
contador1
```

---

## Declaração de Variáveis

Usa a palavra-chave `let`. Toda variável deve ser inicializada na declaração.

```iugo
let nome = "Ana";
let idade = 25;
let ativo = true;
let pi = 3.14;
```

---

## Atribuição

Variáveis já declaradas podem receber novos valores com `=`.

```iugo
idade = 26;
nome = "Carlos";
```

---

## Saída de Dados

A função `print` exibe um valor no console.

```iugo
print(idade);
print("Olá, mundo!");
print(10 + 5);
```

---

## Operadores

### Aritméticos

| Operador | Significado  | Exemplo     |
|----------|-------------|-------------|
| `+`      | Adição      | `a + b`     |
| `-`      | Subtração   | `a - b`     |
| `*`      | Multiplicação | `a * b`   |
| `/`      | Divisão     | `a / b`     |

### Comparação

| Operador | Significado       | Exemplo     |
|----------|-------------------|-------------|
| `==`     | Igual             | `a == b`    |
| `!=`     | Diferente         | `a != b`    |
| `>`      | Maior que         | `a > b`     |
| `>=`     | Maior ou igual    | `a >= b`    |
| `<`      | Menor que         | `a < b`     |
| `<=`     | Menor ou igual    | `a <= b`    |

### Lógicos

| Operador | Significado | Exemplo        |
|----------|-------------|----------------|
| `&&`     | E (and)     | `a && b`       |
| `\|\|`   | Ou (or)     | `a \|\| b`     |
| `!`      | Não (not)   | `!flag`        |

---

## Precedência de Operadores

Do menor para o maior precedência:

| Nível | Operadores          |
|-------|---------------------|
| 1     | `\|\|`              |
| 2     | `&&`                |
| 3     | `==`, `!=`          |
| 4     | `>`, `>=`, `<`, `<=`|
| 5     | `+`, `-`            |
| 6     | `*`, `/`            |
| 7     | `!`, `-` (unário)   |

---

## Estruturas de Controle

### Condicional `if`

```iugo
if (condição) {
    // bloco verdadeiro
}
```

Com `else`:

```iugo
if (idade >= 18) {
    print("Maior de idade");
} else {
    print("Menor de idade");
}
```

### Laço `while`

Executa enquanto a condição for verdadeira.

```iugo
while (contador < 10) {
    contador = contador + 1;
}
```

---

## Exemplo Completo

```iugo
let idade = 20;
let mensagem = "Verificando maioridade...";

print(mensagem);

if (idade >= 18) {
    print("Maior de idade");
} else {
    print("Menor de idade");
}

while (idade < 25) {
    idade = idade + 1;
    print(idade);
}

print("Fim do programa");
```

---

## Regras da Linguagem

1. Todo statement termina com `;`
2. Blocos são delimitados por `{` e `}`
3. Variáveis devem ser declaradas com `let` antes de usar
4. Não existe declaração de tipo explícita — a linguagem infere o tipo pelo valor inicial
5. Strings usam aspas duplas `"` (aspas simples não são suportadas)

---

## Palavras Reservadas

As seguintes palavras não podem ser usadas como identificadores:

```
let    print    if    else    while    true    false
```

---

## Limitações da Versão Atual (v0.1)

- Sem suporte a funções definidas pelo usuário
- Sem suporte a arrays ou estruturas de dados
- Sem suporte a tipos explícitos
- Sem suporte a importação de módulos
- `print` aceita apenas um argumento

> Essas limitações serão progressivamente removidas nas próximas sprints.
