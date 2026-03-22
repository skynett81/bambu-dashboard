---
sidebar_position: 5
title: E-commerce
description: Gerencie pedidos, clientes e faturamento para venda de impressões 3D — requer licença da geektech.no
---

# E-commerce

O módulo de e-commerce fornece um sistema completo para gerenciar clientes, pedidos e faturamento — perfeito para quem vende impressões 3D de forma profissional ou semiprofissional.

Acesse em: **https://localhost:3443/#orders**

:::danger Licença de e-commerce obrigatória
O módulo de e-commerce requer uma licença válida. As licenças **só podem ser adquiridas via [geektech.no](https://geektech.no)**. Sem uma licença ativa, o módulo está bloqueado e inacessível.
:::

## Licença — compra e ativação

### Comprar licença

1. Acesse **[geektech.no](https://geektech.no)** e crie uma conta
2. Selecione **Bambu Dashboard — Licença de e-commerce**
3. Selecione o tipo de licença:

| Tipo de licença | Descrição | Impressoras |
|---|---|---|
| **Hobby** | Uma impressora, uso pessoal e pequenas vendas | 1 |
| **Profissional** | Até 5 impressoras, uso comercial | 1–5 |
| **Enterprise** | Número ilimitado de impressoras, suporte completo | Ilimitado |

4. Conclua o pagamento
5. Você receberá uma **chave de licença** por e-mail

### Ativar licença

1. Vá em **Configurações → E-commerce** no dashboard
2. Preencha os seguintes campos:

| Campo | Descrição | Obrigatório |
|-------|-----------|-------------|
| **Chave de licença** | Chave hexadecimal de 32 caracteres da geektech.no | ✅ Sim |
| **Endereço de e-mail** | O e-mail usado na compra | ✅ Sim |
| **Domínio** | O domínio em que o dashboard é executado (sem https://) | Recomendado |
| **Telefone** | Telefone de contato (com código do país, ex.: +55) | Opcional |

### Tipo de licença — vinculação por identificador

geektech.no vincula a licença a um ou mais identificadores:

| Tipo | Valida contra | Caso de uso |
|------|---------------|-------------|
| **Domínio** | Nome de domínio (ex.: `dashboard.empresa.com.br`) | Servidor fixo com domínio próprio |
| **IP** | Endereço(s) IP público(s) | Servidor sem domínio, IP fixo |
| **MAC** | Endereço(s) MAC da placa de rede | Vinculação de hardware |
| **IP + MAC** | IP e MAC devem corresponder | Máxima segurança |

:::info Identificação automática
O dashboard envia automaticamente o endereço IP e o endereço MAC do servidor a cada validação. Você não precisa preenchê-los manualmente — geektech.no os registra na primeira ativação.
:::

Vários endereços IP e MAC podem ser permitidos (um por linha no admin geektech.no). Útil para servidores com múltiplas placas de rede ou IP dinâmico.

3. Clique em **Ativar licença**
4. O dashboard envia uma solicitação de ativação para geektech.no
5. Após a ativação bem-sucedida, são exibidos:
   - **Tipo de licença** (Hobby / Profissional / Enterprise)
   - **Data de validade**
   - **Número máximo de impressoras**
   - **Titular da licença**
   - **ID de instância** (exclusivo para sua instalação)

:::warning A chave de licença está vinculada ao seu domínio e instalação
A chave é ativada para uma instalação e domínio específicos do Bambu Dashboard. Entre em contato com o suporte da [geektech.no](https://geektech.no) se precisar:
- Transferir a licença para um novo servidor
- Alterar o domínio
- Aumentar o número de impressoras
:::

### Validação de licença

A licença é autenticada e sincronizada com geektech.no:

- **Validação na inicialização** — a licença é verificada automaticamente
- **Validação contínua** — revalidada a cada 24 horas contra geektech.no
- **Modo offline** — em caso de falha de rede, a licença funciona por até **7 dias** com validação em cache
- **Licença expirada** → o módulo é bloqueado, mas os dados existentes (pedidos, clientes) são mantidos
- **Código PIN** — geektech.no pode bloquear/desbloquear a licença pelo sistema PIN
- **Renovação** — via **[geektech.no](https://geektech.no)** → Minhas licenças → Renovar

### Tipos de licença e restrições

| Plano | Impressoras | Plataformas | Taxa | Preço |
|-------|-------------|-------------|------|-------|
| **Hobby** | 1 | 1 (Shopify OU WooCommerce) | 5% | Ver geektech.no |
| **Profissional** | 1–5 | Todas | 5% | Ver geektech.no |
| **Enterprise** | Ilimitado | Todas + API | 3% | Ver geektech.no |

### Verificar status da licença

Vá em **Configurações → E-commerce** ou chame a API:

```bash
curl -sk https://localhost:3443/api/ecommerce/license
```

A resposta contém:
```json
{
  "active": true,
  "status": "active",
  "plan": "professional",
  "holder": "Nome da empresa",
  "email": "empresa@exemplo.com.br",
  "domain": "dashboard.nomeempresa.com.br",
  "max_printers": 5,
  "expires_at": "2027-03-22",
  "provider": "geektech.no",
  "fees_pending": 2,
  "fees_this_month": 450.00,
  "orders_this_month": 12
}
```

## Clientes

### Criar um cliente

1. Vá em **E-commerce → Clientes**
2. Clique em **Novo cliente**
3. Preencha:
   - **Nome / Razão social**
   - **Pessoa de contato** (para empresas)
   - **Endereço de e-mail**
   - **Telefone**
   - **Endereço** (endereço de faturamento)
   - **CNPJ / CPF** (opcional, para registros fiscais)
   - **Observação** — nota interna
4. Clique em **Criar**

### Visão geral de clientes

A lista de clientes exibe:
- Nome e informações de contato
- Número total de pedidos
- Receita total
- Data do último pedido
- Status (Ativo / Inativo)

Clique em um cliente para ver todo o histórico de pedidos e faturamento.

## Gerenciamento de pedidos

### Criar um pedido

1. Vá em **E-commerce → Pedidos**
2. Clique em **Novo pedido**
3. Selecione o **Cliente** na lista
4. Adicione itens do pedido:
   - Selecione arquivo/modelo da biblioteca de arquivos, ou adicione um item em texto livre
   - Defina a quantidade e o preço unitário
   - O sistema calcula o custo automaticamente se vinculado a um projeto
5. Defina a **Data de entrega** (estimada)
6. Clique em **Criar pedido**

### Status do pedido

| Status | Descrição |
|---|---|
| Solicitação | Solicitação recebida, não confirmada |
| Confirmado | Cliente confirmou |
| Em produção | Impressões em andamento |
| Pronto para entrega | Concluído, aguardando retirada/envio |
| Entregue | Pedido concluído |
| Cancelado | Cancelado pelo cliente ou por você |

Atualize o status clicando no pedido → **Alterar status**.

### Vincular impressões ao pedido

1. Abra o pedido
2. Clique em **Vincular impressão**
3. Selecione impressões do histórico (seleção múltipla suportada)
4. Os dados de custo são obtidos automaticamente do histórico de impressões

## Faturamento

Veja [Projetos → Faturamento](../funksjoner/projects#fakturering) para documentação detalhada de faturamento.

A fatura pode ser gerada diretamente de um pedido:

1. Abra o pedido
2. Clique em **Gerar fatura**
3. Verifique o valor e os impostos
4. Baixe o PDF ou envie para o e-mail do cliente

### Série de numeração de faturas

Configure a série de numeração de faturas em **Configurações → E-commerce**:
- **Prefixo**: ex.: `2026-`
- **Número inicial**: ex.: `1001`
- O número da fatura é atribuído automaticamente em ordem crescente

## Relatórios e taxas

### Relatório de taxas

O sistema rastreia todas as taxas de transação:
- Veja as taxas em **E-commerce → Taxas**
- Marque as taxas como reportadas para fins contábeis
- Exporte o resumo de taxas por período

### Estatísticas

Em **E-commerce → Estatísticas**:
- Receita mensal (gráfico de barras)
- Principais clientes por receita
- Modelos/materiais mais vendidos
- Tamanho médio do pedido

Exporte para CSV para sistema contábil.

## Suporte e contato

:::info Precisa de ajuda?
- **Dúvidas sobre licença**: contate o suporte de [geektech.no](https://geektech.no)
- **Problemas técnicos**: [GitHub Issues](https://github.com/skynett81/bambu-dashboard/issues)
- **Solicitações de funcionalidades**: [GitHub Discussions](https://github.com/skynett81/bambu-dashboard/discussions)
:::
