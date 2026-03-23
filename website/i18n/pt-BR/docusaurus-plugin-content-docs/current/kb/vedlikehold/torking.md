---
sidebar_position: 5
title: Secagem de filamento
description: Por que, quando e como secar filamento — temperaturas, tempos e dicas de armazenamento para todos os materiais
---

# Secagem de filamento

Filamento úmido é uma das causas mais comuns e subestimadas de impressões ruins. Mesmo filamento que parece seco pode ter absorvido umidade suficiente para estragar o resultado — especialmente para materiais como nylon e PVA.

## Por que secar filamento?

Muitos tipos de plástico são **higroscópicos** — absorvem umidade do ar ao longo do tempo. Quando filamento úmido passa pelo bico quente, a água evapora abruptamente e cria microbolhas no plástico fundido. O resultado é:

- **Sons de estalo e crepitação** durante a impressão
- **Névoa ou vapor** visível saindo do bico
- **Stringing e hairing** que não podem ser corrigidos com ajustes
- **Superfície áspera ou granulada** — especialmente nas camadas superiores
- **Peças fracas** com má adesão de camadas e microfissuras
- **Acabamento fosco ou opaco** em materiais que normalmente devem ser brilhantes ou sedosos

:::warning Seque o filamento ANTES de ajustar configurações
Muitas pessoas passam horas ajustando retração e temperatura sem ver melhoras — porque a causa é filamento úmido. Sempre seque o filamento e teste novamente antes de alterar as configurações de impressão.
:::

## Quais materiais precisam ser secos?

Todos os tipos de plástico podem ficar úmidos, mas o grau de higroscopicidade varia enormemente:

| Material | Higroscópico | Temperatura de secagem | Tempo de secagem | Prioridade |
|---|---|---|---|---|
| PLA | Baixo | 45–50 °C | 4–6 horas | Opcional |
| PETG | Médio | 65 °C | 4–6 horas | Recomendado |
| ABS | Médio | 65–70 °C | 4 horas | Recomendado |
| TPU | Médio | 50–55 °C | 4–6 horas | Recomendado |
| ASA | Médio | 65 °C | 4 horas | Recomendado |
| PC | Alto | 70–80 °C | 6–8 horas | Necessário |
| PA/Nylon | Extremamente alto | 70–80 °C | 8–12 horas | NECESSÁRIO |
| PA-CF | Extremamente alto | 70–80 °C | 8–12 horas | NECESSÁRIO |
| PVA | Extremamente alto | 45–50 °C | 4–6 horas | NECESSÁRIO |

:::tip Nylon e PVA são críticos
PA/Nylon e PVA podem absorver umidade suficiente para se tornarem impossíveis de imprimir em **algumas horas** em clima interno normal. Nunca abra um novo carretel desses materiais sem secá-lo imediatamente — e sempre imprima de uma caixa fechada ou secador.
:::

## Sinais de filamento úmido

Nem sempre é necessário secar filamento com base em uma tabela. Aprenda a reconhecer os sintomas:

| Sintoma | Umidade? | Outras possíveis causas |
|---|---|---|
| Sons de estalo/crepitação | Sim, muito provável | Bico parcialmente entupido |
| Névoa/vapor do bico | Sim, quase certeza | Nenhuma outra causa |
| Superfície áspera, granulada | Sim, possível | Temperatura muito baixa, velocidade muito alta |
| Stringing que não desaparece | Sim, possível | Retração errada, temperatura muito alta |
| Peças fracas e quebradiças | Sim, possível | Temperatura muito baixa, preenchimento errado |
| Mudança de cor ou acabamento fosco | Sim, possível | Temperatura errada, plástico queimado |

## Métodos de secagem

### Secador de filamento (recomendado)

Secadores de filamento dedicados são a solução mais simples e segura. Eles mantêm a temperatura com precisão e permitem imprimir diretamente do secador durante todo o trabalho.

Modelos populares:
- **eSun eBOX** — preço acessível, pode imprimir da caixa, suporta a maioria dos materiais
- **Bambu Lab Filament Dryer** — otimizado para Bambu AMS, suporta altas temperaturas
- **Polymaker PolyDryer** — bom termômetro e boa regulação de temperatura
- **Sunlu S2 / S4** — econômico, vários carretéis ao mesmo tempo

Procedimento:
```
1. Coloque os carretéis no secador
2. Configure a temperatura a partir da tabela acima
3. Configure o temporizador para o tempo recomendado
4. Aguarde — não interrompa o processo
5. Imprima diretamente do secador ou embale imediatamente
```

### Desidratador de alimentos

Um desidratador de alimentos comum funciona surpreendentemente bem como secador de filamento:

- Preço acessível de compra
- Boa circulação de ar
- Suporta temperaturas de até 70–75 °C em muitos modelos

:::warning Verifique a temperatura máxima do seu desidratador
Muitos desidratadores de alimentos baratos têm termostatos imprecisos e podem variar ±10 °C. Meça a temperatura real com um termômetro para PA e PC que requerem calor elevado.
:::

### Forno

O forno pode ser usado em emergências, mas requer cuidado:

:::danger NUNCA use forno comum acima de 60 °C para PLA — ele deforma!
PLA começa a amolecer já em 55–60 °C. Um forno quente pode danificar carretéis, derreter o núcleo e tornar o filamento inutilizável. Nunca use o forno para PLA a menos que você saiba que a temperatura está precisamente calibrada e abaixo de 50 °C.
:::

Para materiais que suportam temperaturas mais altas (ABS, ASA, PA, PC):
```
1. Preaqueça o forno à temperatura desejada
2. Use um termômetro para verificar a temperatura real
3. Coloque os carretéis em uma grade (não diretamente no fundo do forno)
4. Deixe a porta entreaberta para deixar a umidade escapar
5. Monitore na primeira vez que usar este método
```

### Bambu Lab AMS

Bambu Lab AMS Lite e AMS Pro têm função de secagem integrada (baixo calor + circulação de ar). Isso não substitui a secagem completa, mas mantém filamento já seco durante a impressão.

- AMS Lite: Secagem passiva — limita absorção de umidade, não seca ativamente
- AMS Pro: Aquecimento ativo — alguma secagem possível, mas não tão eficaz quanto secador dedicado

## Armazenamento de filamento

O armazenamento correto após a secagem é tão importante quanto o próprio processo de secagem:

### Melhores soluções

1. **Armário seco com sílica gel** — armário dedicado com higrômetro e dessecante. Mantém a umidade estavelmente baixa (abaixo de 20% RH, idealmente)
2. **Sacos a vácuo** — remova o ar e sele com dessecante dentro. Armazenamento de longo prazo mais barato
3. **Sacos Ziplock com dessecante** — simples e eficaz para períodos mais curtos

### Sílica gel e dessecantes

- **Sílica gel azul/laranja** indica saturação — substitua ou regenere (seque no forno a 120 °C) quando a cor mudar
- **Sílica gel em grânulos** é mais eficaz do que granulado
- **Pacotes de dessecante** de fabricantes de filamento podem ser regenerados e reutilizados

### Higrômetro na caixa de armazenamento

Um higrômetro digital barato mostra a umidade atual do ar na caixa:

| Umidade relativa (RH) | Status |
|---|---|
| Abaixo de 15% | Ideal |
| 15–30% | Bom para a maioria dos materiais |
| 30–50% | Aceitável para PLA e PETG |
| Acima de 50% | Problemático — especialmente para PA, PVA, PC |

## Dicas práticas

- **Seque diretamente ANTES de imprimir** — filamento seco pode ficar úmido novamente em dias em clima interno normal
- **Imprima do secador** para PA, PC e PVA — não apenas seque e guarde
- **Novo carretel ≠ carretel seco** — fabricantes selam com dessecante, mas a cadeia de armazenamento pode ter falhado. Sempre seque novos carretéis de materiais higroscópicos
- **Marque os carretéis secos** com a data de secagem
- **Tubo PTFE dedicado** do secador à impressora minimiza a exposição durante a impressão

## Bambu Dashboard e status de secagem

O Bambu Dashboard permite registrar informações de filamento incluindo a data da última secagem nos perfis de filamento. Use isso para acompanhar quais carretéis estão recém-secos e quais precisam de uma nova rodada.
