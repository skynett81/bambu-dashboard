---
sidebar_position: 1
title: Bem-vindo ao Bambu Dashboard
description: Um poderoso dashboard auto-hospedado para impressoras 3D Bambu Lab
---

# Bem-vindo ao Bambu Dashboard

O **Bambu Dashboard** é um painel de controle auto-hospedado e completo para impressoras 3D Bambu Lab. Ele oferece visibilidade e controle completos sobre sua impressora, estoque de filamentos, histórico de impressão e muito mais — tudo a partir de uma única aba do navegador.

## O que é o Bambu Dashboard?

O Bambu Dashboard conecta-se diretamente à sua impressora via MQTT pela LAN, sem dependência dos servidores da Bambu Lab. Você também pode se conectar à Bambu Cloud para sincronização de modelos e histórico de impressão.

### Principais recursos

- **Dashboard ao vivo** — temperatura em tempo real, progresso, câmera, status do AMS
- **Estoque de filamentos** — rastreie todos os carretéis, cores, sincronização do AMS, secagem
- **Histórico de impressão** — log completo com estatísticas e exportação
- **Agendador** — visualização de calendário e fila de impressão
- **Controle da impressora** — temperatura, velocidade, ventiladores, console G-code
- **Notificações** — 7 canais (Telegram, Discord, e-mail, ntfy, Pushover, SMS, webhook)
- **Multi-impressora** — suporta toda a linha Bambu Lab: X1C, X1E, P1S, P1P, P2S, A1, A1 mini, A1 Combo, H2S, H2D, H2C e mais
- **Auto-hospedado** — sem dependência de nuvem, seus dados na sua máquina

## Início rápido

| Tarefa | Link |
|--------|------|
| Instalar o dashboard | [Instalação](./kom-i-gang/installasjon) |
| Configurar a primeira impressora | [Configuração](./kom-i-gang/oppsett) |
| Conectar ao Bambu Cloud | [Bambu Cloud](./kom-i-gang/bambu-cloud) |
| Explorar todos os recursos | [Funcionalidades](./funksjoner/oversikt) |
| Documentação da API | [API](./avansert/api) |

:::tip Modo demo
Você pode experimentar o dashboard sem uma impressora física executando `npm run demo`. Isso inicia 3 impressoras simuladas com ciclos de impressão ao vivo.
:::

## Impressoras suportadas

- **Série X1**: X1C, X1C Combo, X1E
- **Série P1**: P1S, P1S Combo, P1P
- **Série P2**: P2S, P2S Combo
- **Série A**: A1, A1 Combo, A1 mini
- **Série H2**: H2S, H2D (bico duplo), H2C (trocador de ferramenta, 6 cabeças)

## Visão geral técnica

O Bambu Dashboard é construído com Node.js 22 e HTML/CSS/JS puro — sem frameworks pesados, sem etapa de build. O banco de dados é SQLite, integrado ao Node.js 22. Veja [Arquitetura](./avansert/arkitektur) para detalhes.
