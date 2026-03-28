# Share — POS Digitada Online
## Especificação de Telas — Fluxo do Usuário

> **Documento:** UI/UX — Emulador de Maquininha  
> **Versão:** 1.0  
> **Escopo:** Todas as telas do fluxo padrão do usuário (operador de caixa)

---

## Índice

1. [Princípios de Design da Maquininha](#1-princípios-de-design-da-maquininha)
2. [Estrutura Global da Interface](#2-estrutura-global-da-interface)
3. [Tela 0 — Login](#3-tela-0--login)
4. [Tela 0.1 — Configuração Stripe (onboarding)](#4-tela-01--configuração-stripe-onboarding)
5. [Tela 1 — Home / Sessão Ativa](#5-tela-1--home--sessão-ativa)
6. [Fluxo de Venda — Passo 1: Informar Valor](#6-fluxo-de-venda--passo-1-informar-valor)
7. [Fluxo de Venda — Passo 2: Escolher Método](#7-fluxo-de-venda--passo-2-escolher-método)
8. [Fluxo de Venda — Passo 3A: Venda Digitada (dados do cartão)](#8-fluxo-de-venda--passo-3a-venda-digitada-dados-do-cartão)
9. [Fluxo de Venda — Passo 4: Processando](#9-fluxo-de-venda--passo-4-processando)
10. [Fluxo de Venda — Passo 5: Resultado — Aprovado](#10-fluxo-de-venda--passo-5-resultado--aprovado)
11. [Fluxo de Venda — Passo 5: Resultado — Recusado](#11-fluxo-de-venda--passo-5-resultado--recusado)
12. [Tela — Histórico de Transações](#12-tela--histórico-de-transações)
13. [Tela — Detalhe da Transação](#13-tela--detalhe-da-transação)
14. [Tela — Configurações da Conta](#14-tela--configurações-da-conta)
15. [Tela — Aviso de Bloqueio (Admin)](#15-tela--aviso-de-bloqueio-admin)
16. [Estados e Feedbacks Globais](#16-estados-e-feedbacks-globais)
17. [Especificações de Componentes](#17-especificações-de-componentes)

---

## 1. Princípios de Design da Maquininha

O sistema deve **simular fielmente a experiência de uma maquininha física**, com os seguintes princípios:

### Sensação de Dispositivo Dedicado
- A interface ocupa 100% da viewport, sem margens externas
- Fundo **escuro** (`#0D1117`) em toda a área da "maquininha" — igual ao visor de um terminal físico
- O "painel de cartão" (formulário de entrada) surge como um card branco flutuando sobre o fundo escuro, exatamente como o display de uma maquininha Stone/Cielo

### Feedback Visual Imediato
- Cada ação do operador deve ter resposta visual em < 100ms
- Sons (opcional): bip de confirmação no aprovado, bip duplo no recusado
- Animações de transição entre passos: slide horizontal (igual a avançar telas no terminal)

### Modo Operacional — Sem Distrações
- Não há menu lateral, não há navbar convencional
- A navegação é sempre linear: Valor → Método → Cartão → Processando → Resultado
- Para sair do fluxo: apenas o botão "Cancelar" no topo ou o botão físico de voltar

### Identidade White Label
- Logo e nome da marca no topo (configurável pelo Admin)
- Cores primárias aplicadas nos botões e acentos (configurável)
- O restante da UI permanece neutro (fundo escuro, cards brancos)

---

## 2. Estrutura Global da Interface

```
┌─────────────────────────────────────────┐
│              STATUS BAR                  │  ← Hora do sistema, indicador de sessão
│  ● SESSÃO ATIVA          15:17:45       │
├─────────────────────────────────────────┤
│           HEADER DA MAQUININHA           │  ← Logo White Label + botão Histórico
│   [LOGO]  NOME DA MARCA        [🕐]    │
│           VENDA DIGITADA                 │
│   TRM-2047  ·  OP: ADM-01  ·  MATRIZ   │
├─────────────────────────────────────────┤
│         BADGE DE SISTEMA                 │  ← Quando aplicável
│   ⚠ SISTEMA INTERNO – USO RESTRITO     │
├─────────────────────────────────────────┤
│                                          │
│         ÁREA DE CONTEÚDO PRINCIPAL       │  ← Muda a cada passo do fluxo
│         (fundo escuro #0D1117)           │
│                                          │
│  ┌───────────────────────────────────┐  │
│  │          CARD FLUTUANTE           │  │  ← Formulário / resultado
│  │         (fundo branco)            │  │
│  └───────────────────────────────────┘  │
│                                          │
├─────────────────────────────────────────┤
│              RODAPÉ                      │  ← Marca/versão
│   ACESSO AUTORIZADO · SHARE FINANCIAL   │
│   v1.0.0  ·  Ambiente Produção          │
└─────────────────────────────────────────┘
```

### Dimensões e Responsividade
- **Mobile first**: projetado para telas de 375px a 430px de largura (celular do operador)
- **Tablet**: layout idêntico, limitado a 480px de largura com centralização
- **Desktop**: nunca mais largo que 480px — a "maquininha" é sempre uma coluna estreita centralizada
- A altura ocupa 100dvh (dynamic viewport height) para evitar problemas com teclado virtual

---

## 3. Tela 0 — Login

**Contexto:** O operador abre o sistema. O Admin já criou a conta e repassou as credenciais.

```
┌─────────────────────────────────────────┐
│                                          │
│              [LOGO WHITE LABEL]          │
│              NOME DA MARCA              │
│                                          │
│         Bem-vindo ao sistema             │
│         de vendas digitadas.            │
│                                          │
│  ┌───────────────────────────────────┐  │
│  │                                   │  │
│  │   E-mail                          │  │
│  │   ┌─────────────────────────┐     │  │
│  │   │ operador@empresa.com    │     │  │
│  │   └─────────────────────────┘     │  │
│  │                                   │  │
│  │   Senha                           │  │
│  │   ┌─────────────────────────┐     │  │
│  │   │ ••••••••••••            │     │  │
│  │   └─────────────────────────┘     │  │
│  │                                   │  │
│  │   ┌─────────────────────────┐     │  │
│  │   │       Entrar →          │     │  │  ← Botão cor primária White Label
│  │   └─────────────────────────┘     │  │
│  │                                   │  │
│  └───────────────────────────────────┘  │
│                                          │
│   Acesso autorizado · Share Financial   │
└─────────────────────────────────────────┘
```

### Comportamentos
| Situação | Comportamento |
|----------|---------------|
| Campos vazios | Botão "Entrar" desabilitado (opaco, não clicável) |
| Credenciais incorretas | Mensagem de erro inline abaixo dos campos: _"E-mail ou senha incorretos."_ Contador de tentativas oculto |
| 5ª tentativa falha | Mensagem: _"Acesso temporariamente bloqueado. Tente novamente em 15 minutos."_ |
| Usuário bloqueado pelo Admin | Exibe o `notice_message` definido pelo admin em destaque laranja/âmbar |
| Login bem-sucedido | Animação de fade-out → redireciona para Tela 1 (Home) |
| Sem conta Stripe | Redireciona para Tela 0.1 (Configuração Stripe) |

### Estados do Botão Entrar
```
Desabilitado:  [       Entrar →       ]  ← cinza, cursor not-allowed
Pronto:        [       Entrar →       ]  ← cor primária
Carregando:    [     ⟳ Entrando...   ]  ← spinner, desabilitado
```

---

## 4. Tela 0.1 — Configuração Stripe (onboarding)

**Contexto:** Exibida APENAS se o usuário não tiver conta Stripe configurada. Aparece após o primeiro login ou quando o Admin remove as credenciais.

```
┌─────────────────────────────────────────┐
│  ● SESSÃO ATIVA          15:17:45       │
├─────────────────────────────────────────┤
│   [LOGO]   SHARE          [🕐]         │
│            VENDA DIGITADA               │
│   TRM-2047  ·  OP: ADM-01             │
├─────────────────────────────────────────┤
│                                          │
│  ┌───────────────────────────────────┐  │
│  │                                   │  │
│  │   ⚙ Configuração Inicial          │  │
│  │                                   │  │
│  │   Para começar a realizar vendas, │  │
│  │   vincule sua conta Stripe.       │  │
│  │                                   │  │
│  │   Publishable Key                 │  │
│  │   ┌─────────────────────────┐     │  │
│  │   │ pk_live_...             │     │  │
│  │   └─────────────────────────┘     │  │
│  │   ℹ Começa com pk_live_ ou pk_test_ │
│  │                                   │  │
│  │   Secret Key                      │  │
│  │   ┌─────────────────────────┐     │  │
│  │   │ sk_live_...             │     │  │  ← input type="password"
│  │   └─────────────────────────┘     │  │
│  │   ℹ Nunca compartilhe esta chave  │  │
│  │                                   │  │
│  │   ┌─────────────────────────┐     │  │
│  │   │   ✓ Vincular Conta      │     │  │
│  │   └─────────────────────────┘     │  │
│  │                                   │  │
│  │   🔒 Seus dados são criptografados │  │
│  │      e armazenados com segurança.  │  │
│  │                                   │  │
│  └───────────────────────────────────┘  │
│                                          │
└─────────────────────────────────────────┘
```

### Comportamentos
| Situação | Comportamento |
|----------|---------------|
| Chave inválida (formato) | Erro inline: _"Publishable key deve começar com pk\_"_ |
| Chave inválida (Stripe rejeita) | Erro: _"Credenciais inválidas. Verifique suas chaves no painel Stripe."_ |
| Sucesso | Toast verde: _"Conta Stripe vinculada com sucesso!"_ → redireciona para Home |
| Carregando | Spinner no botão, campos bloqueados — a validação pode levar 1-2s |

---

## 5. Tela 1 — Home / Sessão Ativa

**Contexto:** Tela inicial após login. O operador está pronto para iniciar uma venda. Esta é a tela que a maquininha mostra em "standby".

```
┌─────────────────────────────────────────┐
│  ● SESSÃO ATIVA          15:17:45       │  ← dot verde pulsando
├─────────────────────────────────────────┤
│   [S] SHARE               [🕐 HIST.]   │
│       VENDA DIGITADA                    │
│   TRM-2047  ·  OP: ADM-01 ·  MATRIZ SP │
├─────────────────────────────────────────┤
│   ⚠ SISTEMA INTERNO – USO RESTRITO     │
├─────────────────────────────────────────┤
│                                          │
│   ┌───────────────────────────────────┐  │
│   │                                   │  │
│   │   NOVA TRANSAÇÃO                  │  │  ← badge azul
│   │                                   │  │
│   │   Informe o Valor                 │  │
│   │   Digite o valor total a debitar  │  │
│   │   no cartão do cliente.           │  │
│   │                                   │  │
│   │   Valor (R$)                      │  │
│   │   ┌─────────────────────────┐     │  │
│   │   │ R$                0,00  │     │  │  ← campo limpo, cursor piscando
│   │   └─────────────────────────┘     │  │
│   │                                   │  │
│   │   ┌─────────────────────────┐     │  │
│   │   │     Continuar →         │     │  │  ← desabilitado até ter valor > 0
│   │   └─────────────────────────┘     │  │
│   │                                   │  │
│   └───────────────────────────────────┘  │
│                                          │
│   ACESSO AUTORIZADO · SHARE FINANCIAL   │
│   v1.0.0  ·  Ambiente Produção  ·  SSL  │
└─────────────────────────────────────────┘
```

### Notas de UX da Home

**Campo de valor — comportamento de maquininha:**
- O campo começa em `0,00`
- O teclado numérico abre automaticamente ao focar
- A digitação preenche da direita para esquerda, como uma maquininha real:
  - Usuário digita `1` → campo mostra `0,01`
  - Usuário digita `5` → campo mostra `0,15`
  - Usuário digita `0` → campo mostra `1,50`
  - Usuário digita `0` → campo mostra `15,00`
- Tecla backspace apaga o último dígito
- Não há ponto/vírgula manual — o sistema formata automaticamente
- Valor máximo: R$ 99.999,00 — acima disso o campo rejeita o dígito

**Botão Histórico (🕐):**
- Leva para a Tela de Histórico sem interromper a sessão
- Ao voltar do histórico, a tela de valor está limpa e pronta

**Ícone de Histórico no Header:**
```
[S] SHARE            [🕐]
    VENDA DIGITADA
```
O `[🕐]` é um botão pequeno no canto superior direito, com ícone de relógio.

---

## 6. Fluxo de Venda — Passo 1: Informar Valor

**Esta tela É a Home.** O fluxo começa imediatamente quando o operador digita o valor.

### Indicador de Progresso (Steps)

Aparece apenas após o operador digitar o valor e clicar em "Continuar". Nos passos seguintes, o indicador fica fixo no topo do card:

```
  ①──────②──────③──────④
Valor  Cartão  Proc.  Result.
```

- Passo atual: círculo preenchido + número em branco + label em bold
- Passo concluído: círculo com ✓ verde
- Passo futuro: círculo vazio + label opaco

### Estados do Campo de Valor

```
Vazio (inicial):
┌─────────────────────────┐
│ R$                0,00  │  ← placeholder opaco
└─────────────────────────┘

Digitando:
┌─────────────────────────┐
│ R$               15,00  │  ← valor formatado em tempo real
└─────────────────────────┘

Valor máximo atingido:
┌─────────────────────────┐
│ R$           99.999,00  │  ← campo fica vermelho-suave
└─────────────────────────┘
⚠ Valor máximo por transação: R$ 99.999,00
```

---

## 7. Fluxo de Venda — Passo 2: Escolher Método

**Contexto:** O operador confirmou o valor. Agora precisa escolher como o cliente vai pagar.  
Esta tela imita o momento em que a maquininha exibe "Aproxime, insira ou deslize o cartão".

```
┌─────────────────────────────────────────┐
│  ● SESSÃO ATIVA          15:17:45       │
├─────────────────────────────────────────┤
│   [S] SHARE               [🕐]         │
│       VENDA DIGITADA                    │
│   TRM-2047  ·  OP: ADM-01 · MATRIZ SP  │
├─────────────────────────────────────────┤
│   ⚠ SISTEMA INTERNO – USO RESTRITO     │
├─────────────────────────────────────────┤
│                                          │
│   ①──────②──────③──────④              │  ← progress bar — passo 1 concluído
│  ✓     Cartão   Proc.  Result.          │
│                                          │
│   ┌───────────────────────────────────┐  │
│   │                                   │  │
│   │   COBRANÇA                        │  │
│   │   R$ 150,00                       │  │  ← valor grande e em destaque
│   │                                   │  │
│   │   ┌ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ┐   │  │
│   │                                   │  │
│   │        [  💳  ]                  │  │  ← ícone de cartão NFC animado
│   │                                   │  │
│   │        Aproxime o cartão          │  │
│   │        ou insira no leitor        │  │  ← opção futura (NFC/chip)
│   │                                   │  │
│   │   └ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ┘   │  │  ← área pontilhada = indisponível no MVP
│   │             (em breve)            │  │
│   │                                   │  │
│   │         ─────── ou ───────        │  │
│   │                                   │  │
│   │   ┌─────────────────────────┐     │  │
│   │   │  💻  Venda Digitada     │     │  │  ← botão de ação principal
│   │   └─────────────────────────┘     │  │
│   │                                   │  │
│   │   ┌─────────────────────────┐     │  │
│   │   │     ← Cancelar          │     │  │  ← volta para a tela de valor
│   │   └─────────────────────────┘     │  │
│   │                                   │  │
│   └───────────────────────────────────┘  │
└─────────────────────────────────────────┘
```

### Notas de UX

**Área "Aproxime o cartão":**
- No MVP, essa área está visualmente presente mas desabilitada (fundo pontilhado, ícone opaco)
- Label discreta abaixo: _"(em breve)"_
- Não é clicável — ao tentar clicar, nada acontece
- Isso mantém a familiaridade visual com maquininhas reais sem enganar o operador

**Ícone de cartão NFC:**
- Animação suave de pulso (como o ícone de tap das maquininhas físicas)
- Apenas decorativa no MVP

**Botão "Venda Digitada":**
- Este é o caminho principal no MVP
- Cor primária do White Label
- Ao clicar: avança para Passo 3A com animação de slide da direita

**Botão "Cancelar":**
- Volta para Passo 1 (campo de valor zerado)
- Não há confirmação — o cancelamento é imediato

---

## 8. Fluxo de Venda — Passo 3A: Venda Digitada (dados do cartão)

**Contexto:** O operador vai digitar os dados do cartão que o cliente fornece verbalmente ou que está na sua frente. Esta é a tela mais crítica do fluxo.

```
┌─────────────────────────────────────────┐
│  ● SESSÃO ATIVA          15:18:02       │
├─────────────────────────────────────────┤
│   [S] SHARE               [🕐]         │
│       VENDA DIGITADA                    │
│   TRM-2047  ·  OP: ADM-01 · MATRIZ SP  │
├─────────────────────────────────────────┤
│   ⚠ SISTEMA INTERNO – USO RESTRITO     │
├─────────────────────────────────────────┤
│                                          │
│   ✓──────②──────③──────④              │
│  Valor  Cartão  Proc.  Result.          │
│                                          │
│   ┌───────────────────────────────────┐  │
│   │                                   │  │
│   │   Dados do Cartão                 │  │
│   │   Cobrança: R$ 150,00            │  │
│   │                                   │  │
│   │   Número do Cartão                │  │
│   │   ┌────────────────────────────┐  │  │
│   │   │ [💳] 1234  1234  1234  1234│  │  │  ← máscara automática com espaços
│   │   └────────────────────────────┘  │  │
│   │                      [Usar link ▼]│  │  ← botão secundário (ver abaixo)
│   │                                   │  │
│   │   Validade          CVV           │  │
│   │   ┌──────────────┐ ┌──────────┐  │  │
│   │   │   MM / AA    │ │   CVC    │  │  │
│   │   └──────────────┘ └──────────┘  │  │
│   │                                   │  │
│   │   🔒 Dados protegidos com SSL     │  │
│   │                                   │  │
│   │   ┌─────────────────────────┐     │  │
│   │   │   💳 Cobrar R$ 150,00   │     │  │  ← botão ativo apenas com dados válidos
│   │   └─────────────────────────┘     │  │
│   │                                   │  │
│   │   ┌─────────────────────────┐     │  │
│   │   │     ← Voltar            │     │  │
│   │   └─────────────────────────┘     │  │
│   │                                   │  │
│   └───────────────────────────────────┘  │
└─────────────────────────────────────────┘
```

### Comportamentos dos Campos

**Número do Cartão:**
- Máscara automática: `XXXX XXXX XXXX XXXX`
- Detecta a bandeira automaticamente pelos primeiros dígitos e exibe o logo:
  - `4...` → logo Visa
  - `5...` ou `2...` → logo Mastercard
  - `3...` → logo Amex (15 dígitos)
  - `6...` → logo Elo/Hipercard
- Validação com algoritmo de Luhn antes de habilitar o botão
- Ao completar 16 dígitos, foco muda automaticamente para "Validade"

```
Campo vazio:
┌──────────────────────────────────┐
│ [💳]  ____  ____  ____  ____    │
└──────────────────────────────────┘

Digitando:
┌──────────────────────────────────┐
│ [💳]  4111  1111  1111  ____    │
└──────────────────────────────────┘

Número inválido (Luhn):
┌──────────────────────────────────┐
│ [💳]  4111  1111  1111  1112    │  ← borda vermelha
└──────────────────────────────────┘
⚠ Número de cartão inválido
```

**Botão "Usar link":**
- Funcionalidade opcional: gera um link de pagamento seguro para enviar ao cliente
- O cliente abre o link no próprio celular e digita os dados
- No MVP v1: pode ser omitido ou marcado como "(em breve)"

**Validade:**
- Máscara: `MM/AA`
- Ao digitar `1` → `1_`; ao digitar `2` → `12`; ao pressionar próximo dígito → `12/` preenchido automaticamente
- Ao completar, foco vai para CVV

```
Vazio:       │   MM / AA    │
Digitando:   │   12 / 26    │
Vencido:     │   01 / 23    │  ← borda vermelha
             ⚠ Cartão vencido
```

**CVV:**
- 3 dígitos (4 para Amex)
- Campo `type="password"` — exibe bolinhas, não os números
- Tooltip ao lado: ícone de interrogação — ao clicar exibe _"Código de 3 dígitos no verso do cartão (4 dígitos na frente para Amex)"_

### Validação do Botão "Cobrar"

O botão só fica ativo quando TODOS os critérios são atendidos:
- Número do cartão: 16 dígitos (ou 15 para Amex) + Luhn válido
- Validade: MM entre 01-12, AA no futuro
- CVV: 3 dígitos (4 para Amex)

```
Incompleto:  [   💳 Cobrar R$ 150,00   ]  ← cinza, desabilitado
Pronto:      [   💳 Cobrar R$ 150,00   ]  ← cor primária, ativo
```

---

## 9. Fluxo de Venda — Passo 4: Processando

**Contexto:** O operador clicou em "Cobrar". O sistema criou o PaymentIntent e está aguardando a resposta da Stripe. Esta tela deve **tranquilizar** o operador — é normal levar alguns segundos.

```
┌─────────────────────────────────────────┐
│  ● SESSÃO ATIVA          15:18:15       │
├─────────────────────────────────────────┤
│   [S] SHARE               [🕐]         │
│       VENDA DIGITADA                    │
│   TRM-2047  ·  OP: ADM-01 · MATRIZ SP  │
├─────────────────────────────────────────┤
│   ⚠ SISTEMA INTERNO – USO RESTRITO     │
├─────────────────────────────────────────┤
│                                          │
│   ✓──────✓──────③──────④              │  ← passos 1 e 2 concluídos
│  Valor  Cartão  Proc.  Result.          │
│                                          │
│   ┌───────────────────────────────────┐  │
│   │                                   │  │
│   │                                   │  │
│   │         ┌─────────────┐           │  │
│   │         │  ⟳ ⟳ ⟳ ⟳  │           │  │  ← spinner animado
│   │         └─────────────┘           │  │
│   │                                   │  │
│   │      Processando pagamento...     │  │
│   │                                   │  │
│   │      R$ 150,00                    │  │  ← valor da cobrança em destaque
│   │                                   │  │
│   │   ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─  │  │
│   │                                   │  │
│   │   Aguarde. Não feche esta tela.   │  │
│   │                                   │  │
│   │    🔒 Conexão segura com a         │  │
│   │      operadora de pagamentos.     │  │
│   │                                   │  │
│   └───────────────────────────────────┘  │
└─────────────────────────────────────────┘
```

### Comportamentos Desta Tela

**Polling em background (invisível ao usuário):**
- O frontend chama `GET /api/transactions/:id/status/` a cada **1 segundo**
- Timeout máximo: **30 segundos**
- Durante esse tempo, o usuário vê apenas o spinner e a mensagem

**Mensagens dinâmicas (rotação a cada 5s):**
```
0-5s:   "Processando pagamento..."
5-10s:  "Comunicando com a operadora..."
10-15s: "Aguardando autorização do banco..."
15-20s: "Verificando a transação..."
20-25s: "Finalizando..."
```

**Timeout (após 30s sem resposta):**
- Exibe resultado de erro (ver Tela 5 — Recusado)
- Mensagem específica: _"A transação demorou mais que o esperado. Verifique o status no histórico antes de tentar novamente."_
- A transação é marcada como `failed` no banco

**NÃO há botão de cancelar nesta tela** — o pagamento está em andamento e cancelar poderia gerar inconsistência. O operador deve aguardar.

---

## 10. Fluxo de Venda — Passo 5: Resultado — Aprovado

**Contexto:** Pagamento aprovado. Esta tela é o momento de celebração — deve ser visualmente clara e satisfatória.

```
┌─────────────────────────────────────────┐
│  ● SESSÃO ATIVA          15:18:46       │
├─────────────────────────────────────────┤
│   [S] SHARE               [🕐]         │
│       VENDA DIGITADA                    │
│   TRM-2047  ·  OP: ADM-01 · MATRIZ SP  │
├─────────────────────────────────────────┤
│   ⚠ SISTEMA INTERNO – USO RESTRITO     │
├─────────────────────────────────────────┤
│                                          │
│   ✓──────✓──────✓──────④              │  ← todos os passos concluídos
│  Valor  Cartão  Proc.  Result.          │
│                                          │
│   ┌───────────────────────────────────┐  │
│   │                                   │  │
│   │         ┌─────────────┐           │  │
│   │         │      ✓      │           │  │  ← círculo verde grande
│   │         └─────────────┘           │  │     animação de "check" desenhando
│   │                                   │  │
│   │     Pagamento Aprovado!           │  │  ← texto verde
│   │         R$ 150,00                 │  │
│   │                                   │  │
│   │   ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─  │  │
│   │                                   │  │
│   │   ID da transação                 │  │
│   │   pi_3TFevsRuDYqd2z9...           │  │  ← truncado, toque para copiar
│   │                                   │  │
│   │   ○ Transação processada          │  │
│   │     com segurança                 │  │
│   │                                   │  │
│   │   ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─  │  │
│   │                                   │  │
│   │   ┌─────────────────────────┐     │  │
│   │   │  🖨 Imprimir Nota Fiscal │     │  │  ← botão secundário (outline)
│   │   └─────────────────────────┘     │  │
│   │                                   │  │
│   │   ┌─────────────────────────┐     │  │
│   │   │     → Nova Venda        │     │  │  ← botão primário (cor WL)
│   │   └─────────────────────────┘     │  │
│   │                                   │  │
│   └───────────────────────────────────┘  │
└─────────────────────────────────────────┘
```

### Animações da Tela Aprovado

**Círculo verde com check:**
```
Frame 1 (0ms):    Círculo vazio aparece com scale 0
Frame 2 (200ms):  Círculo expande para scale 1 (easing elastic)
Frame 3 (400ms):  Check começa a ser "desenhado" (stroke-dashoffset animation)
Frame 4 (700ms):  Check completo — tela estável
```

**Comportamentos:**
| Elemento | Comportamento |
|----------|---------------|
| ID da transação | Toque/clique copia para área de transferência — toast _"Copiado!"_ |
| "Imprimir Nota Fiscal" | Abre modal de confirmação → gera PDF simples com dados da venda (futuro) |
| "Nova Venda" | Volta imediatamente para Tela 1 (Home) com valor zerado |
| Auto-redirect | Após 60 segundos sem ação, redireciona automaticamente para Nova Venda |

**Barra de progresso de auto-redirect (sutil):**
```
Uma barra fina no rodapé do card que se esvazia em 60s.
Ao hover/toque, pausa o countdown.
Texto: "Nova venda em 58s | Cancelar"
```

---

## 11. Fluxo de Venda — Passo 5: Resultado — Recusado

**Contexto:** O pagamento foi recusado. A tela deve ser clara mas não alarmante — recusas são comuns e fazem parte do fluxo normal de uma maquininha.

```
┌─────────────────────────────────────────┐
│  ● SESSÃO ATIVA          15:19:03       │
├─────────────────────────────────────────┤
│   [S] SHARE               [🕐]         │
│       VENDA DIGITADA                    │
│   TRM-2047  ·  OP: ADM-01 · MATRIZ SP  │
├─────────────────────────────────────────┤
│   ⚠ SISTEMA INTERNO – USO RESTRITO     │
├─────────────────────────────────────────┤
│                                          │
│   ✓──────✓──────✓──────④              │
│  Valor  Cartão  Proc.  Result.          │
│                                          │
│   ┌───────────────────────────────────┐  │
│   │                                   │  │
│   │         ┌─────────────┐           │  │
│   │         │      ✕      │           │  │  ← círculo vermelho
│   │         └─────────────┘           │  │
│   │                                   │  │
│   │         Não Autorizado            │  │  ← texto vermelho
│   │         R$ 150,00                 │  │
│   │                                   │  │
│   │   ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─  │  │
│   │                                   │  │
│   │   Motivo                          │  │
│   │   Cartão recusado. Verifique os   │  │  ← mensagem traduzida do erro Stripe
│   │   dados ou tente outro cartão.   │  │
│   │                                   │  │
│   │   ID: pi_3TFevsRuDYqd2z9...       │  │
│   │                                   │  │
│   │   ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─  │  │
│   │                                   │  │
│   │   ┌─────────────────────────┐     │  │
│   │   │  ↺ Tentar Novamente     │     │  │  ← mantém o mesmo valor, volta ao Passo 2
│   │   └─────────────────────────┘     │  │
│   │                                   │  │
│   │   ┌─────────────────────────┐     │  │
│   │   │     → Nova Venda        │     │  │  ← zera tudo, volta ao Passo 1
│   │   └─────────────────────────┘     │  │
│   │                                   │  │
│   └───────────────────────────────────┘  │
└─────────────────────────────────────────┘
```

### Mensagens de Erro por Código Stripe

| Código Stripe | Mensagem exibida ao operador |
|--------------|------------------------------|
| `card_declined` | _"Cartão recusado. Verifique os dados ou tente outro cartão."_ |
| `insufficient_funds` | _"Saldo insuficiente. O cliente deve usar outro cartão ou meio de pagamento."_ |
| `incorrect_cvc` | _"CVV incorreto. Solicite ao cliente que verifique o código no verso do cartão."_ |
| `expired_card` | _"Cartão vencido. Solicite outro cartão ao cliente."_ |
| `incorrect_number` | _"Número do cartão inválido. Verifique os dados digitados."_ |
| `card_velocity_exceeded` | _"Limite de transações atingido. O cliente deve contatar o banco emissor."_ |
| `do_not_honor` | _"Transação não autorizada pelo banco. O cliente deve contatar o banco emissor."_ |
| `requires_action` (3DS) | _"Este cartão requer autenticação adicional não suportada neste terminal. Solicite outro cartão."_ |
| Timeout (30s) | _"A operadora demorou para responder. Verifique o histórico antes de tentar novamente."_ |
| Erro de rede | _"Erro de conexão. Verifique a internet e tente novamente."_ |

### Comportamento do "Tentar Novamente"
- Mantém o **mesmo valor** da transação anterior
- Volta para o **Passo 2 (Escolher Método)** — o operador pode digitar os dados novamente
- Um **novo PaymentIntent** é criado — a tentativa anterior é descartada
- O operador não precisa redigitar o valor

---

## 12. Tela — Histórico de Transações

**Contexto:** Acessada pelo botão 🕐 no header. Mostra as transações do operador logado.

```
┌─────────────────────────────────────────┐
│  ← Voltar          HISTÓRICO            │
├─────────────────────────────────────────┤
│                                          │
│  ┌─────────────────────────────────┐    │
│  │ 🔍 Buscar por valor ou cartão   │    │
│  └─────────────────────────────────┘    │
│                                          │
│  [ Hoje ] [ 7 dias ] [ 30 dias ] [ ... ]│  ← filtros de período (pills)
│                                          │
│  ─────────────── HOJE ────────────────  │
│                                          │
│  ┌─────────────────────────────────┐    │
│  │  15:18  ·  •••• 4242  [VISA]   │    │
│  │  R$ 150,00              ✓ Aprov.│    │
│  └─────────────────────────────────┘    │
│                                          │
│  ┌─────────────────────────────────┐    │
│  │  14:55  ·  •••• 1234  [MAST]   │    │
│  │  R$ 80,00               ✕ Recus.│    │
│  └─────────────────────────────────┘    │
│                                          │
│  ┌─────────────────────────────────┐    │
│  │  14:32  ·  •••• 9871  [ELO ]   │    │
│  │  R$ 45,00               ✓ Aprov.│    │
│  └─────────────────────────────────┘    │
│                                          │
│  ────────────── ONTEM ─────────────── │
│                                          │
│  ┌─────────────────────────────────┐    │
│  │  18:10  ·  •••• 5555  [VISA]   │    │
│  │  R$ 320,00              ✓ Aprov.│    │
│  └─────────────────────────────────┘    │
│                                          │
│          [ Carregar mais... ]            │
│                                          │
└─────────────────────────────────────────┘
```

### Especificações

**Cards de transação:**
- Toque → abre Tela de Detalhe da Transação
- Badge de status:
  - `✓ Aprovado` → badge verde
  - `✕ Recusado` → badge vermelho
  - `⟳ Processando` → badge âmbar (raro — só se ainda estiver em polling)

**Filtros de período:**
- `Hoje`, `7 dias`, `30 dias` são pills horizontais deslizáveis
- `...` abre um date picker para período customizado
- O filtro ativo tem a cor primária do White Label

**Paginação:**
- Cursor-based — botão "Carregar mais" no final
- Não há paginação numérica (UX de mobile)
- Agrupamento por data (HOJE, ONTEM, data completa para datas mais antigas)

**Resumo no topo (opcional — abaixo dos filtros):**
```
┌──────────────┬──────────────┬──────────────┐
│ 42 vendas    │ R$ 6.480,00  │ R$ 154,28    │
│ aprovadas    │ volume total │ ticket médio  │
└──────────────┴──────────────┴──────────────┘
```

---

## 13. Tela — Detalhe da Transação

**Contexto:** Acessada ao tocar em um item do histórico.

```
┌─────────────────────────────────────────┐
│  ← Voltar       DETALHE DA VENDA        │
├─────────────────────────────────────────┤
│                                          │
│   ┌───────────────────────────────────┐  │
│   │                                   │  │
│   │         ✓  Aprovado               │  │  ← ou ✕ Recusado
│   │                                   │  │
│   │         R$ 150,00                 │  │
│   │         15 de março de 2025       │  │
│   │         15:18:46                  │  │
│   │                                   │  │
│   │   ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─  │  │
│   │                                   │  │
│   │   Cartão           •••• 4242      │  │
│   │   Bandeira         Visa           │  │
│   │   Método           Venda Digitada │  │
│   │   Moeda            BRL            │  │
│   │                                   │  │
│   │   ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─  │  │
│   │                                   │  │
│   │   ID da Transação                 │  │
│   │   pi_3TFevsRuDYqd2z9...     [📋] │  │  ← toque para copiar
│   │                                   │  │
│   │   ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─  │  │
│   │                                   │  │
│   │   ┌─────────────────────────┐     │  │
│   │   │  🖨 Imprimir Nota Fiscal │     │  │
│   │   └─────────────────────────┘     │  │
│   │                                   │  │
│   └───────────────────────────────────┘  │
│                                          │
└─────────────────────────────────────────┘
```

---

## 14. Tela — Configurações da Conta

**Contexto:** Acessada por um ícone de engrenagem ⚙ no histórico ou em um menu discreto.

```
┌─────────────────────────────────────────┐
│  ← Voltar          CONFIGURAÇÕES        │
├─────────────────────────────────────────┤
│                                          │
│   ┌───────────────────────────────────┐  │
│   │                                   │  │
│   │   👤 CONTA                        │  │
│   │                                   │  │
│   │   Nome      João Silva            │  │
│   │   E-mail    joao@empresa.com      │  │
│   │   Perfil    Operador              │  │
│   │                                   │  │
│   └───────────────────────────────────┘  │
│                                          │
│   ┌───────────────────────────────────┐  │
│   │                                   │  │
│   │   💳 CONTA STRIPE                 │  │
│   │                                   │  │
│   │   Status     ● Ativa              │  │  ← dot verde
│   │   Chave      pk_live_...xxxx      │  │  ← apenas sufixo
│   │   Desde      10 de março de 2025  │  │
│   │                                   │  │
│   │   ┌─────────────────────────┐     │  │
│   │   │  🔄 Atualizar Credenciais│     │  │
│   │   └─────────────────────────┘     │  │
│   │                                   │  │
│   │   Histórico de contas (2)         │  │  ← expansível
│   │   ▸ pk_live_...aaaa — inativa     │  │
│   │     Ativa de 01/02 a 10/03/2025  │  │
│   │                                   │  │
│   └───────────────────────────────────┘  │
│                                          │
│   ┌───────────────────────────────────┐  │
│   │   Sair da conta             →     │  │
│   └───────────────────────────────────┘  │
│                                          │
└─────────────────────────────────────────┘
```

### Atualizar Credenciais Stripe
- Abre um modal sobreposto com o mesmo formulário da Tela 0.1
- Após confirmar, a conta anterior é arquivada e a nova ativada
- O histórico de contas sempre mostra todas as versões (somente leitura)

---

## 15. Tela — Aviso de Bloqueio (Admin)

**Contexto:** O Admin bloqueou o usuário e definiu uma mensagem customizada. Exibida na tela de login ao tentar acessar.

```
┌─────────────────────────────────────────┐
│                                          │
│              [LOGO WHITE LABEL]          │
│              NOME DA MARCA              │
│                                          │
│   ┌───────────────────────────────────┐  │
│   │                                   │  │
│   │   ⚠️  Acesso Temporariamente      │  │  ← ícone âmbar
│   │       Suspenso                    │  │
│   │                                   │  │
│   │   ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─  │  │
│   │                                   │  │
│   │   "Sua fatura de março está       │  │  ← notice_message do Admin
│   │    pendente. Entre em contato     │  │     exibido entre aspas
│   │    pelo WhatsApp (11) 99999-9999" │  │
│   │                                   │  │
│   │   ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─  │  │
│   │                                   │  │
│   │   Se acredita que isso é um       │  │
│   │   erro, entre em contato com      │  │
│   │   o administrador do sistema.     │  │
│   │                                   │  │
│   └───────────────────────────────────┘  │
│                                          │
│   Acesso autorizado · Share Financial   │
└─────────────────────────────────────────┘
```

**Comportamentos:**
- Não há botão de login — o usuário está completamente bloqueado
- Se não houver `notice_message`, exibe mensagem padrão: _"Sua conta está temporariamente suspensa. Entre em contato com o administrador."_
- A tela não tem campo de e-mail/senha — o bloqueio é definitivo até o Admin desbloquear

---

## 16. Estados e Feedbacks Globais

### Toast Notifications

Mensagens temporárias que aparecem no topo da tela por 3 segundos:

```
Sucesso:   ┌─────────────────────────────────┐
           │  ✓  Conta Stripe vinculada!      │  ← fundo verde
           └─────────────────────────────────┘

Erro:      ┌─────────────────────────────────┐
           │  ✕  Credenciais inválidas.       │  ← fundo vermelho
           └─────────────────────────────────┘

Info:      ┌─────────────────────────────────┐
           │  ℹ  ID copiado para a área       │  ← fundo azul
           │     de transferência.            │
           └─────────────────────────────────┘
```

### Tela de Erro de Conexão

```
┌─────────────────────────────────────────┐
│                                          │
│              Sem Conexão                 │
│                                          │
│   Não foi possível conectar ao          │
│   servidor. Verifique sua internet       │
│   e tente novamente.                    │
│                                          │
│   [ Tentar Novamente ]                  │
│                                          │
└─────────────────────────────────────────┘
```

### Loading Global (entre transições de tela)

```
┌─────────────────────────────────────────┐
│                                          │
│              ⟳                          │  ← spinner centralizado
│                                          │
└─────────────────────────────────────────┘
```
Aparece apenas em transições > 300ms. Transições rápidas não mostram loading (evita flash).

### Indicador de Sessão Ativa

O dot verde no topo indica sessão ativa. Comportamentos:

```
● SESSÃO ATIVA    → verde pulsando — tudo ok
● RECONECTANDO    → âmbar pulsando — perdeu conexão, tentando reconectar
○ OFFLINE         → cinza estático — sem conexão
```

---

## 17. Especificações de Componentes

### Paleta de Cores Base (sem White Label)

| Elemento | Cor | Uso |
|----------|-----|-----|
| Fundo da maquininha | `#0D1117` | Background principal |
| Header/status bar | `#111827` | Área do cabeçalho |
| Card flutuante | `#FFFFFF` | Formulários e resultados |
| Texto principal (no card) | `#111827` | Labels e valores |
| Texto secundário | `#6B7280` | Descrições e hints |
| Aprovado | `#16A34A` | Badge, ícone, texto |
| Recusado | `#DC2626` | Badge, ícone, texto |
| Processando | `#D97706` | Badge âmbar |
| Borda dos campos | `#E5E7EB` | Estado normal |
| Borda focus | cor primária WL | Estado ativo |
| Borda erro | `#DC2626` | Estado de erro |
| Cor primária (default) | `#1E3A5F` | Botões, acentos — substituída pelo WL |

### Tipografia

| Elemento | Font | Tamanho | Peso |
|----------|------|---------|------|
| Valor da cobrança | System | 32px | 700 |
| Título do card | System | 18px | 600 |
| Labels dos campos | System | 14px | 500 |
| Texto de apoio | System | 13px | 400 |
| Texto do rodapé | System | 11px | 400 |
| Informações do terminal | Monospace | 11px | 400 |

> Usar a fonte do sistema (`-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto`) para máxima performance e integração com o SO do dispositivo.

### Botões

```
Primário (ação principal):
┌───────────────────────────────────┐
│           Ação Principal          │  ← cor primária WL, texto branco, border-radius 8px
└───────────────────────────────────┘
Altura: 52px (área de toque confortável para dedo)

Secundário (ação alternativa):
┌───────────────────────────────────┐
│           Ação Secundária         │  ← borda cor primária, fundo transparente
└───────────────────────────────────┘
Altura: 48px

Destrutivo / Cancelar:
┌───────────────────────────────────┐
│              Cancelar             │  ← texto cinza, sem borda
└───────────────────────────────────┘
Altura: 44px
```

### Campos de Input

```
Normal:
┌─────────────────────────────────┐
│ Placeholder ou valor            │  ← borda #E5E7EB
└─────────────────────────────────┘
Altura: 52px, border-radius: 8px, padding: 0 16px

Foco:
┌─────────────────────────────────┐  ← borda 2px cor primária WL
│ Valor sendo digitado|           │
└─────────────────────────────────┘

Erro:
┌─────────────────────────────────┐  ← borda 2px #DC2626
│ Valor inválido                  │
└─────────────────────────────────┘
Mensagem de erro abaixo: texto 12px #DC2626
```

### Indicador de Progresso (Steps)

```
Concluído:   ●  (círculo preenchido verde com ✓)
Atual:       ②  (círculo preenchido cor primária WL, número branco)
Futuro:      ○  (círculo vazio, borda cinza, número opaco)

Linha entre steps:
Concluída:   ──── (linha contínua verde)
Futura:      ···· (linha pontilhada cinza)

Layout:
①──────②──────③──────④
Valor  Cartão Proc.  Result.
```

---

*Este documento deve ser usado como referência de fidelidade para a implementação das telas. Qualquer desvio de UX deve ser discutido e validado antes de implementar.*
