---
sidebar_position: 1
title: Bem-vindo ao Bambu Dashboard
description: Um poderoso dashboard auto-hospedado para impressoras 3D Bambu Lab
---

# Bem-vindo ao Bambu Dashboard

[![ko-fi](https://ko-fi.com/img/githubbutton_sm.svg)](https://ko-fi.com/V7V21NRKM7)

O **Bambu Dashboard** é um painel de controle auto-hospedado e completo para impressoras 3D Bambu Lab. Ele oferece visibilidade e controle totais sobre sua impressora, estoque de filamentos, histórico de impressão e muito mais — tudo a partir de uma única aba do navegador.

## O que é o Bambu Dashboard?

O Bambu Dashboard conecta-se diretamente à sua impressora via MQTT pela LAN, sem dependência dos servidores da Bambu Lab. Você também pode conectar ao Bambu Cloud para sincronização de modelos e histórico de impressão.

### Principais recursos

- **Dashboard ao vivo** — temperatura em tempo real, progresso, câmera, status do AMS com indicador LIVE
- **Estoque de filamentos** — gerencie todos os carretéis com sincronização AMS, suporte a EXT spool, informações de material, compatibilidade de placa e guia de secagem
- **Rastreamento de filamento** — rastreamento preciso com fallback de 4 níveis (sensor AMS → estimativa EXT → cloud → duração)
- **Guia de materiais** — 15 materiais com temperaturas, compatibilidade de placa, secagem, propriedades e dicas
- **Histórico de impressão** — log completo com nomes de modelos, links do MakerWorld, consumo de filamento e custos
- **Planejador** — visualização de calendário, fila de impressão com balanceamento de carga e verificação de filamento
- **Controle da impressora** — temperatura, velocidade, ventiladores, console G-code
- **Print Guard** — proteção automática com xcam + 5 monitores de sensores
- **Estimador de custos** — material, energia, trabalho, desgaste, markup com sugestão de preço de venda
- **Manutenção** — rastreamento com intervalos baseados em KB, vida útil do bico, vida útil da placa e guia
- **Alertas sonoros** — 9 eventos configuráveis com upload de som personalizado e alto-falante da impressora (M300)
- **Log de atividades** — linha do tempo persistente de todos os eventos (impressões, erros, manutenção, filamento)
- **Notificações** — 7 canais (Telegram, Discord, e-mail, ntfy, Pushover, SMS, webhook)
- **Multi-impressora** — suporta toda a linha Bambu Lab
- **17 idiomas** — norueguês, inglês, alemão, francês, espanhol, italiano, japonês, coreano, holandês, polonês, português, sueco, turco, ucraniano, chinês, tcheco, húngaro
- **Auto-hospedado** — sem dependência de nuvem, seus dados na sua máquina

### Novidades na v1.1.13

- **Detecção de EXT spool** para P2S/A1 via campo de mapeamento MQTT — consumo de filamento rastreado corretamente para spool externo
- **Banco de dados de materiais de filamento** com 15 materiais, compatibilidade de placa, guia de secagem e propriedades
- **Painel de manutenção** com intervalos baseados em KB, 4 novos tipos de bico, aba de guia com links para documentação
- **Alertas sonoros** com 9 eventos, upload personalizado (MP3/OGG/WAV, máx. 10s), controle de volume e alto-falante da impressora
- **Log de atividades** — linha do tempo persistente de todos os bancos de dados, independentemente de a página estar aberta
- **Códigos de erro HMS** com descrições legíveis de 270+ códigos
- **i18n completo** — todas as 2944 chaves traduzidas para 17 idiomas
- **Docs com build automático** — documentação construída automaticamente na instalação e ao iniciar o servidor

## Início rápido

| Tarefa | Link |
|--------|------|
| Instalar o dashboard | [Instalação](./kom-i-gang/installasjon) |
| Configurar a primeira impressora | [Configuração](./kom-i-gang/oppsett) |
| Conectar ao Bambu Cloud | [Bambu Cloud](./kom-i-gang/bambu-cloud) |
| Explorar todos os recursos | [Funcionalidades](./funksjoner/oversikt) |
| Guia de filamentos | [Guia de materiais](./kb/filamenter/guide) |
| Guia de manutenção | [Manutenção](./kb/vedlikehold/dyse) |
| Documentação da API | [API](./avansert/api) |

:::tip Modo demo
Você pode experimentar o dashboard sem uma impressora física executando `npm run demo`. Isso inicia 3 impressoras simuladas com ciclos de impressão ao vivo.
:::

## Impressoras suportadas

Todas as impressoras Bambu Lab com modo LAN:

- **Série X1**: X1C, X1C Combo, X1E
- **Série P1**: P1S, P1S Combo, P1P
- **Série P2**: P2S, P2S Combo
- **Série A**: A1, A1 Combo, A1 mini
- **Série H2**: H2S, H2D (bico duplo), H2C (trocador de ferramenta, 6 cabeças)

## Recursos em detalhes

### Rastreamento de filamento

O dashboard rastreia automaticamente o consumo de filamento com fallback de 4 níveis:

1. **Diff do sensor AMS** — mais preciso, compara remain% de início/fim
2. **EXT direto** — para P2S/A1 sem vt_tray, usa estimativa do cloud
3. **Estimativa do cloud** — dos dados de trabalho de impressão do Bambu Cloud
4. **Estimativa por duração** — ~30g/hora como último fallback

Todos os valores são exibidos como o mínimo entre o sensor AMS e o banco de dados do carretel para evitar erros após impressões com falha.

### Guia de materiais

Banco de dados integrado com 15 materiais incluindo:
- Temperaturas (bico, mesa, câmara)
- Compatibilidade de placa (Cool, Engineering, High Temp, Textured PEI)
- Informações de secagem (temperatura, tempo, higroscopicidade)
- 8 propriedades (resistência, flexibilidade, resistência ao calor, UV, superfície, facilidade de uso)
- Nível de dificuldade e requisitos especiais (bico endurecido, enclosure)

### Alertas sonoros

9 eventos configuráveis com suporte para:
- **Clipes de áudio personalizados** — faça upload de MP3/OGG/WAV (máx. 10 segundos, 500 KB)
- **Tons integrados** — sons metálicos/sintetizados gerados com Web Audio API
- **Alto-falante da impressora** — melodias M300 G-code diretamente no buzzer da impressora
- **Contagem regressiva** — alerta sonoro quando falta 1 minuto para terminar a impressão

### Manutenção

Sistema completo de manutenção com:
- Rastreamento de componentes (bico, tubo PTFE, hastes, rolamentos, AMS, placa, secagem)
- Intervalos baseados em KB da documentação
- Vida útil do bico por tipo (latão, aço endurecido, HS01)
- Vida útil da placa por tipo (Cool, Engineering, High Temp, Textured PEI)
- Aba de guia com dicas e links para documentação completa

## Visão geral técnica

O Bambu Dashboard é construído com Node.js 22 e HTML/CSS/JS puro — sem frameworks pesados, sem etapa de build. O banco de dados é SQLite, integrado ao Node.js 22.

- **Backend**: Node.js 22 com apenas 3 pacotes npm (mqtt, ws, basic-ftp)
- **Frontend**: HTML/CSS/JS puro, sem etapa de build
- **Banco de dados**: SQLite via `--experimental-sqlite` integrado ao Node.js 22
- **Documentação**: Docusaurus com 17 idiomas, construído automaticamente na instalação
- **API**: 177+ endpoints, documentação OpenAPI em `/api/docs`

Veja [Arquitetura](./avansert/arkitektur) para detalhes.
