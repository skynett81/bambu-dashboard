---
sidebar_position: 5
title: PWA
description: Instale o Bambu Dashboard como Progressive Web App para experiência similar a um aplicativo, modo offline e notificações em segundo plano
---

# PWA (Progressive Web App)

O Bambu Dashboard pode ser instalado como Progressive Web App (PWA) — uma experiência similar a um aplicativo diretamente do navegador, sem loja de aplicativos. Você obtém acesso mais rápido, notificações push em segundo plano e funcionalidade offline limitada.

## Instalar como aplicativo

### Desktop (Chrome / Edge / Chromium)

1. Abra `https://localhost:3443` no navegador
2. Procure o ícone de **Instalar** na barra de endereços (seta para baixo com ícone de tela)
3. Clique nele
4. Clique em **Instalar** no diálogo
5. O Bambu Dashboard abre como uma janela separada sem interface do navegador

Alternativamente: clique nos três pontos (⋮) → **Instalar Bambu Dashboard...**

### Desktop (Firefox)

O Firefox não suporta instalação completa de PWA diretamente. Use Chrome ou Edge para a melhor experiência.

### Celular (Android – Chrome)

1. Abra **https://ip-do-seu-servidor:3443** no Chrome
2. Toque nos três pontos → **Adicionar à tela inicial**
3. Dê um nome ao aplicativo e toque em **Adicionar**
4. O ícone aparece na tela inicial — o aplicativo abre em tela cheia sem interface do navegador

### Celular (iOS – Safari)

1. Abra **https://ip-do-seu-servidor:3443** no Safari
2. Toque no ícone de **Compartilhar** (quadrado com seta para cima)
3. Role para baixo e selecione **Adicionar à tela de início**
4. Toque em **Adicionar**

:::warning Limitações do iOS
O iOS tem suporte limitado a PWA. As notificações push funcionam apenas no iOS 16.4 e mais recente. O modo offline é limitado.
:::

## Modo offline

O PWA armazena em cache os recursos necessários para uso offline limitado:

| Funcionalidade | Disponível offline |
|---|---|
| Último status conhecido da impressora | ✅ (do cache) |
| Histórico de impressões | ✅ (do cache) |
| Estoque de filamentos | ✅ (do cache) |
| Status em tempo real (MQTT) | ❌ Requer conexão |
| Stream de câmera | ❌ Requer conexão |
| Enviar comandos para a impressora | ❌ Requer conexão |

A visualização offline exibe um banner no topo: «Conexão perdida — exibindo os últimos dados conhecidos».

## Notificações push em segundo plano

O PWA pode enviar notificações push mesmo quando o aplicativo não está aberto:

1. Abra o PWA
2. Vá em **Configurações → Alertas → Push do navegador**
3. Clique em **Ativar notificações push**
4. Aceite o diálogo de permissão
5. As notificações são entregues à central de notificações do sistema operacional

As notificações push funcionam para todos os eventos configurados em [Alertas](../funksjoner/notifications).

:::info Service Worker
As notificações push requerem que o navegador esteja em execução em segundo plano (sem desligamento completo do sistema). O PWA usa um Service Worker para recepção.
:::

## Ícone e aparência do aplicativo

O PWA usa automaticamente o ícone do Bambu Dashboard. Para personalizar:

1. Vá em **Configurações → Sistema → PWA**
2. Carregue um ícone personalizado (mínimo 512×512 px PNG)
3. Defina o **Nome do aplicativo** e o **Nome curto** (exibido abaixo do ícone no celular)
4. Selecione a **Cor do tema** para a barra de status no celular

## Atualizar o PWA

O PWA é atualizado automaticamente quando o servidor é atualizado:

- Um banner discreto é exibido: «Nova versão disponível — clique para atualizar»
- Clique no banner para carregar a nova versão
- Nenhuma reinstalação manual é necessária
