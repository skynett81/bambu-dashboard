---
sidebar_position: 7
title: Materiais especiais
description: ASA, PC, PP, PVA, HIPS e outros materiais especiais para aplicações avançadas
---

# Materiais especiais

Além dos materiais comuns, existe uma série de materiais especializados para casos de uso específicos — de peças externas resistentes a UV a material de suporte solúvel em água. Aqui está uma visão geral prática.

---

## ASA (Acrylonitrile Styrene Acrylate)

ASA é a melhor alternativa ao ABS para uso externo. Imprime quase de forma idêntica ao ABS, mas tolera muito melhor a luz solar e o clima.

### Configurações

| Parâmetro | Valor |
|-----------|-------|
| Temperatura do bico | 240–260 °C |
| Temperatura da mesa | 90–110 °C |
| Temperatura da câmara | 45–55 °C |
| Resfriamento de peça | 0–20% |
| Secagem | Recomendado (70 °C / 4–6 h) |

### Propriedades

- **Resistente a UV:** Projetado especificamente para exposição prolongada ao sol sem amarelamento ou rachamento
- **Estável ao calor:** Temperatura de transição vítrea ~100 °C
- **Resistente a impactos:** Melhor resistência a impactos que o ABS
- **Gabinete necessário:** Empenha da mesma forma que ABS — X1C/P1S dá os melhores resultados

:::tip ASA em vez de ABS ao ar livre
A peça vai ficar ao ar livre em clima europeu (sol, chuva, geada)? Escolha ASA em vez de ABS. ASA aguenta muitos anos sem degradação visível. O ABS começa a rachar e amarelecer após meses.
:::

### Aplicações
- Suportes, caixas e pontos de fixação externos
- Peças aerodinâmicas de carros, suportes de antena
- Móveis de jardim e ambientes externos
- Sinalização e dispensadores no exterior de edifícios

---

## PC (Policarbonato)

O policarbonato é um dos plásticos mais fortes e resistentes a impactos que podem ser impressos em 3D. É transparente e suporta temperaturas extremas.

### Configurações

| Parâmetro | Valor |
|-----------|-------|
| Temperatura do bico | 260–310 °C |
| Temperatura da mesa | 100–120 °C |
| Temperatura da câmara | 50–70 °C |
| Resfriamento de peça | 0–20% |
| Secagem | Necessário (80 °C / 8–12 h) |

:::danger PC requer hotend all-metal e alta temperatura
PC não funde nas temperaturas padrão de PLA. O Bambu X1C com a configuração de bico correta suporta PC. Sempre verifique se os componentes PTFE no hotend suportam sua temperatura — PTFE padrão não suporta acima de 240–250 °C continuamente.
:::

### Propriedades

- **Muito resistente a impactos:** Resistente a quebras mesmo em baixas temperaturas
- **Transparente:** Pode ser usado para janelas, lentes e componentes ópticos
- **Estável ao calor:** Temperatura de transição vítrea ~147 °C — mais alta dos materiais comuns
- **Higroscópico:** Absorve umidade rapidamente — sempre secar completamente
- **Warping:** Contração forte — requer gabinete e brim

### Aplicações
- Viseiras de segurança e tampas protetoras
- Invólucros elétricos que suportam calor
- Suportes de lentes e componentes ópticos
- Frames de robôs e corpos de drones

---

## PP (Polipropileno)

O polipropileno é um dos materiais mais difíceis de imprimir, mas oferece propriedades únicas que nenhum outro material plástico pode igualar.

### Configurações

| Parâmetro | Valor |
|-----------|-------|
| Temperatura do bico | 220–250 °C |
| Temperatura da mesa | 80–100 °C |
| Resfriamento de peça | 20–50% |
| Secagem | Recomendado (70 °C / 6 h) |

### Propriedades

- **Resistência química:** Suporta ácidos fortes, bases, álcool e a maioria dos solventes
- **Leve e flexível:** Baixa densidade, suporta dobramento repetido (efeito de dobradiça viva)
- **Baixa adesão:** Adere mal a si mesmo e à placa de impressão — esse é o desafio
- **Não tóxico:** Seguro para contato com alimentos (dependendo de cor e aditivos)

:::warning PP adere mal a tudo
PP é famoso por não aderir à placa de impressão. Use fita PP (como fita Tesa ou fita PP dedicada) na Engineering Plate, ou use cola em bastão formulada especificamente para PP. Brim de 15–20 mm é necessário.
:::

### Aplicações
- Garrafas de laboratório e recipientes para produtos químicos
- Armazenamento de alimentos e utensílios de cozinha
- Dobradiças vivas (tampas de caixas que suportam milhares de ciclos de abertura/fechamento)
- Componentes automotivos resistentes a produtos químicos

---

## PVA (Polyvinyl Alcohol) — material de suporte solúvel em água

PVA é um material especial usado exclusivamente como material de suporte. Dissolve-se em água e deixa uma superfície limpa no modelo.

### Configurações

| Parâmetro | Valor |
|-----------|-------|
| Temperatura do bico | 180–220 °C |
| Temperatura da mesa | 35–60 °C |
| Secagem | Crítico (55 °C / 6–8 h) |

:::danger PVA é extremamente higroscópico
PVA absorve umidade mais rápido do que qualquer outro filamento comum. Seque o PVA completamente ANTES de imprimir, e sempre armazene em caixa fechada com sílica. PVA úmido gruda no bico e é muito difícil de remover.
:::

### Uso e dissolução

1. Imprima o modelo com PVA como material de suporte (requer impressora multi-material — AMS)
2. Coloque a impressão acabada em água morna (30–40 °C)
3. Deixe por 30–120 minutos, troque a água se necessário
4. Enxágue com água limpa e deixe secar

**Sempre use um extrusor dedicado para PVA** se possível — resíduos de PVA em um extrusor padrão podem estragar a próxima impressão.

### Aplicações
- Estruturas de suporte complexas impossíveis de remover manualmente
- Suporte interno de balanços sem marca visível na superfície
- Modelos com cavidades e canais internos

---

## HIPS (High Impact Polystyrene) — material de suporte solúvel em solvente

HIPS é outro material de suporte, projetado para ser usado com ABS. Dissolve-se em **limoneno** (solvente cítrico).

### Configurações

| Parâmetro | Valor |
|-----------|-------|
| Temperatura do bico | 220–240 °C |
| Temperatura da mesa | 90–110 °C |
| Temperatura da câmara | 45–55 °C |
| Secagem | Recomendado (65 °C / 4–6 h) |

### Uso com ABS

O HIPS imprime nas mesmas temperaturas que o ABS e adere bem a ele. Após a impressão, o HIPS se dissolve mergulhando a impressão em D-limoneno por 30–60 minutos.

:::warning Limoneno não é água
D-limoneno é um solvente extraído de cascas de laranja. É relativamente inofensivo, mas use luvas e trabalhe em local ventilado. Não descarte limoneno usado no ralo — leve a um ponto de coleta de resíduos.
:::

### Comparação: PVA vs HIPS

| Propriedade | PVA | HIPS |
|----------|-----|------|
| Solvente | Água | D-limoneno |
| Material próprio | Compatível com PLA | Compatível com ABS |
| Sensibilidade à umidade | Extremamente alta | Moderada |
| Custo | Alto | Moderado |
| Disponibilidade | Boa | Moderada |

---

## PVB / Fibersmooth — material alisável com etanol

PVB (Polyvinyl Butyral) é um material único que pode ser **alisado com etanol (álcool)** — da mesma forma que o ABS pode ser alisado com acetona, mas muito mais seguro.

### Configurações

| Parâmetro | Valor |
|-----------|-------|
| Temperatura do bico | 190–210 °C |
| Temperatura da mesa | 35–55 °C |
| Resfriamento de peça | 80–100% |
| Secagem | Recomendado (55 °C / 4 h) |

### Alisamento com etanol

1. Imprima o modelo nas configurações padrão de PVB
2. Aplique álcool isopropílico (IPA) 99% ou etanol com pincel
3. Deixe secar por 10–15 minutos — a superfície nivela uniformemente
4. Repita se necessário para superfície mais lisa
5. Alternativa: Aplique e coloque em recipiente fechado por 5 minutos para tratamento por vapor

:::tip Mais seguro que acetona
IPA/etanol é muito mais seguro de manusear do que acetona. O ponto de fulgor é mais alto e os vapores são muito menos tóxicos. Boa ventilação ainda é recomendada.
:::

### Aplicações
- Figuras e decorações onde superfície lisa é desejada
- Protótipos para apresentação
- Peças que serão pintadas — superfície lisa dá melhor acabamento de tinta

---

## Placas de impressão recomendadas para materiais especiais

| Material | Placa recomendada | Cola em bastão? |
|----------|------------------|-----------------|
| ASA | Engineering Plate / High Temp Plate | Sim |
| PC | High Temp Plate | Sim (necessário) |
| PP | Engineering Plate + fita PP | Fita específica para PP |
| PVA | Cool Plate / Textured PEI | Não |
| HIPS | Engineering Plate / High Temp Plate | Sim |
| PVB | Cool Plate / Textured PEI | Não |
