# Paralelismo de Instrução e Otimização de Localidade — iuGo Compiler

## 1. Contexto

Esta seção aborda os itens 10 e 11 do trabalho:

- **Item 10**: Análise de paralelismo de instrução — identificar instruções
  do TAC que podem ser executadas em paralelo (sem dependência de dados).
- **Item 11**: Otimização de paralelismo e localidade — técnicas de
  reordenação e ganhos teóricos de desempenho.

A análise é realizada sobre o **Three-Address Code (TAC)** gerado pelo
`IRGenerator`, pois é na forma linear do TAC que as dependências entre
instruções ficam explícitas.

---

## 2. Dependências de Dados

Duas instruções `I1` e `I2` (nessa ordem no TAC) têm uma **dependência
de dados** se qualquer das condições abaixo for verdadeira:

| Tipo | Condição | Exemplo |
|------|----------|---------|
| **RAW** (Read After Write) | `I2` lê uma variável que `I1` escreve | `I1: t0 = x + 1` / `I2: y = t0 * 2` |
| **WAW** (Write After Write) | `I2` escreve a mesma variável que `I1` | `I1: t0 = a` / `I2: t0 = b` |
| **WAR** (Write After Read)  | `I2` escreve uma variável que `I1` lê   | `I1: y = t0` / `I2: t0 = b` |

Instruções **sem nenhuma dependência** entre si podem ser executadas em
paralelo em um processador superescalar ou em threads.

---

## 3. Análise por Bloco Básico

Um **bloco básico** é uma sequência máxima de instruções sem rótulos
internos nem saltos. O TAC iuGo é dividido em blocos básicos nos pontos
onde aparecem `label:`, `goto` e `iffalse`.

### 3.1 Exemplo: análise do programa padrão

Fonte iuGo:
```
let idade = 20;
print(idade);
if (idade >= 18) { print("Maior"); }
while (idade < 25) { idade = idade + 1; }
```

TAC gerado (após otimização):
```
; Bloco B0
    idade = 20
    print 20

; Bloco B1 (condição do if)
    t0 = idade >= 18
    iffalse t0 goto L0

; Bloco B2 (corpo do if)
    print "Maior"
    goto L1

; L0: (bloco B3 — continuação após if)
L0:
L1:

; Bloco B4 (cabeçalho do while)
L2:
    t1 = idade < 25
    iffalse t1 goto L3

; Bloco B5 (corpo do while)
    t2 = idade + 1
    idade = t2
    goto L2

; L3:
L3:
```

### 3.2 Grafo de Dependências — Bloco B0

```
instrução 1:  idade = 20      (define: idade)
instrução 2:  print 20        (usa: literal — independente de instrução 1)
```

**Resultado**: `instrução 1` e `instrução 2` são **independentes** → podem
ser executadas em paralelo (o `print 20` já usa o literal, não lê `idade`
graças à propagação de constantes).

### 3.3 Grafo de Dependências — Bloco B5 (corpo do while)

```
instrução A:  t2 = idade + 1  (lê: idade; define: t2)
instrução B:  idade = t2      (lê: t2; define: idade)
```

Dependências:
- B depende de A por **RAW** (`t2`): B lê `t2` que A escreveu.
- A depende de B (iteração anterior) por **RAW** (`idade`): A lê `idade`
  que B escreveu na iteração anterior.

**Resultado**: neste bloco, as duas instruções são **sequencialmente
dependentes** — não há paralelismo disponível dentro de uma única iteração.

---

## 4. Grafo de Dependências (DAG de Instruções)

Para o bloco B0, o Directed Acyclic Graph (DAG) de dependências é:

```
[idade = 20] ──(sem aresta para print 20)──  [print 20]
```

Ambos podem ser emitidos para unidades funcionais distintas de um
processador superescalar (ex.: unidade de load/store e unidade de I/O).

Para o bloco B5:

```
[t2 = idade + 1] ──RAW(t2)──► [idade = t2]
         ▲                            │
         └──────────RAW(idade)────────┘
         (dependência de loop — ciclo entre iterações)
```

O ciclo indica que não há paralelismo intrabloqueio dentro do laço.

---

## 5. Técnicas Aplicáveis

### 5.1 Loop Unrolling (Desenrolamento de Laço)

Para o `while`, poderíamos replicar o corpo N vezes e reduzir o número
de avaliações de condição:

```
; while (idade < 25) { idade = idade + 1; } — unrolled 2x
L_start:
    t0 = idade < 25
    iffalse t0 goto L_end
    t1 = idade + 1
    idade = t1
    t2 = idade < 25          ; segunda iteração sem salto de volta
    iffalse t2 goto L_end
    t3 = idade + 1
    idade = t3
    goto L_start
L_end:
```

**Ganho teórico**: reduz em 50% o número de avaliações de condição e
saltos para o laço acima. Em processadores com branch prediction, cada
salto mal-previsto custa ~15 ciclos; desenrolar 2× elimina 50% desses custos.

### 5.2 Strength Reduction

Substituir operações caras por equivalentes mais baratas. Aplicável quando
se detecta uma expressão da forma `i * C` dentro de um laço:

```
; Original: i = i * 2  (multiplicação — ~3 ciclos)
; Reduzido: i = i + i  (adição — ~1 ciclo)
```

No contexto iuGo, `i + 1` já é a forma mais simples; não há redução
adicional para este padrão.

### 5.3 Constant Propagation (já implementada)

A propagação de constantes já foi aplicada pelo Optimizer antes da geração
do TAC. O resultado (`print 20` ao invés de `print idade`) elimina uma
leitura de memória e aumenta a independência entre instruções.

---

## 6. Análise de Localidade de Memória

iuGo não possui arrays, portanto não há cache misses por acesso não-linear.
Todavia, a análise de localidade temporal se aplica às variáveis:

| Variável | Última escrita | Próxima leitura | Localidade temporal |
|----------|---------------|-----------------|---------------------|
| `idade`  | corpo do while | cabeçalho do while | **alta** — reutilizada a cada iteração |
| `t0`, `t1`, `t2` | instrução de binop | instrução seguinte | **alta** — uso imediato |

Variáveis temporárias (`t0`, `t1`, …) têm **localidade temporal perfeita**:
são criadas e consumidas na instrução imediatamente seguinte, garantindo
que residam em registradores sem necessidade de spill para memória.

---

## 7. Relação com Compiladores Reais

| Técnica discutida | Onde é usada em produção |
|-------------------|--------------------------|
| Grafos de dependência (DAG) | GCC `-O2`, LLVM SelectionDAG |
| Loop unrolling | GCC `-funroll-loops`, LLVM loop-unroll pass |
| Strength reduction | GCC scalar-evolution, LLVM SCEV |
| Constant propagation | LLVM `mem2reg` + GVN pass |
| Localidade de cache | Polly (GCC), Pluto (pesquisa) para arrays |

O compilador iuGo implementa um subconjunto educacional dessas técnicas,
suficiente para demonstrar os conceitos fundamentais de análise de
dependência e transformações de código.
