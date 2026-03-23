---
sidebar_position: 4
title: Defeitos de superfície
description: Diagnóstico e correção de problemas comuns de superfície — blobs, zits, linhas de camada, elephant foot e mais
---

# Defeitos de superfície

A superfície de uma impressão 3D revela muito sobre o que está acontecendo no sistema. A maioria dos defeitos de superfície tem uma ou duas causas claras — com o diagnóstico correto, são surpreendentemente fáceis de corrigir.

## Visão geral rápida de diagnóstico

| Sintoma | Causa mais comum | Primeira ação |
|---|---|---|
| Blobs e zits | Superextrusão, posicionamento da costura | Ajuste a costura, calibre o fluxo |
| Linhas de camada visíveis | Z-wobble, camadas muito grossas | Mude para camadas mais finas, verifique eixo Z |
| Elephant foot | Primeira camada muito larga | Compensação de elephant foot |
| Ringing/ghosting | Vibrações em alta velocidade | Reduza velocidade, ative input shaper |
| Subextrusão | Bico entupido, temperatura muito baixa | Limpe o bico, aumente a temperatura |
| Superextrusão | Taxa de fluxo muito alta | Calibre a taxa de fluxo |
| Pillowing | Poucas camadas superiores, pouco resfriamento | Aumente o número de camadas superiores, aumente o ventilador |
| Separação de camadas | Temperatura muito baixa, resfriamento excessivo | Aumente temperatura, reduza ventilador |

---

## Blobs e zits

Blobs são aglomerados irregulares na superfície. Zits são pontos parecidos com espinhas — geralmente ao longo da linha de costura.

### Causas

- **Superextrusão** — plástico demais é extrudado e empurrado para os lados
- **Posicionamento ruim da costura** — a costura padrão "nearest" concentra todas as transições no mesmo lugar
- **Problema de retração** — retração insuficiente cria acúmulo de pressão no bico
- **Filamento úmido** — umidade cria microbolhas e gotejamento

### Soluções

**Configurações de costura no Bambu Studio:**
```
Bambu Studio → Qualidade → Posição da costura
- Aligned: Todas as costuras no mesmo lugar (visível, mas organizado)
- Nearest: Ponto mais próximo (espalha blobs aleatoriamente)
- Back: Atrás do objeto (recomendado para qualidade visual)
- Random: Distribuição aleatória (melhor camuflagem da costura)
```

**Calibração da taxa de fluxo:**
```
Bambu Studio → Calibração → Taxa de fluxo
Ajuste em passos de ±2% até os blobs desaparecerem
```

:::tip Costura em "Back" para qualidade visual
Coloque a costura na parte de trás do objeto para que seja menos visível. Combine com "Wipe on retract" para um acabamento de costura mais limpo.
:::

---

## Linhas de camada visíveis

Todas as impressões FDM têm linhas de camada, mas devem ser consistentes e quase invisíveis em impressões normais. Visibilidade anormal aponta para problemas concretos.

### Causas

- **Z-wobble** — o eixo Z vibra ou não está reto, cria padrão ondulado em toda a altura
- **Camadas muito grossas** — altura de camada acima de 0,28 mm é perceptível mesmo em impressões perfeitas
- **Flutuações de temperatura** — temperatura de fusão inconsistente gera larguras de camada variáveis
- **Diâmetro de filamento inconsistente** — filamento barato com diâmetro variável

### Soluções

**Z-wobble:**
- Verifique se o fuso (Z-leadscrew) está limpo e lubrificado
- Verifique se o fuso não está dobrado (inspeção visual ao girar)
- Veja o artigo de manutenção sobre [lubrificação do eixo Z](/docs/kb/vedlikehold/smoring)

**Altura da camada:**
- Mude para 0,12 mm ou 0,16 mm para uma superfície mais uniforme
- Lembre-se que reduzir a altura pela metade dobra o tempo de impressão

**Flutuações de temperatura:**
- Use calibração PID (disponível no menu de manutenção do Bambu Studio)
- Evite correntes de ar que resfriam o bico durante a impressão

---

## Elephant foot

Elephant foot é quando a primeira camada é mais larga que o resto do objeto — como se o objeto estivesse "se abrindo" na base.

### Causas

- A primeira camada é esmagada com muita força contra a placa (Z-offset muito próximo)
- Temperatura da mesa muito alta mantém o plástico mole e fluido por muito tempo
- Resfriamento insuficiente na primeira camada dá mais tempo ao plástico para se espalhar

### Soluções

**Compensação de elephant foot no Bambu Studio:**
```
Bambu Studio → Qualidade → Compensação de Elephant foot
Comece com 0,1–0,2 mm e ajuste até o pé desaparecer
```

**Z-offset:**
- Recalibre a altura da primeira camada
- Aumente o Z-offset em 0,05 mm por vez até o pé sumir

**Temperatura da mesa:**
- Reduza a temperatura da mesa em 5–10 °C
- Para PLA: 55 °C geralmente é suficiente — 65 °C pode causar elephant foot

:::warning Não compense demais
Compensação de elephant foot muito alta pode criar uma lacuna entre a primeira camada e o restante. Ajuste com cuidado em passos de 0,05 mm.
:::

---

## Ringing e ghosting

Ringing (também chamado de "ghosting" ou "echoing") é um padrão ondulado na superfície logo após arestas ou cantos afiados. O padrão "ecoa" a partir da aresta.

### Causas

- **Vibrações** — aceleração e desaceleração rápidas em cantos enviam vibrações pelo frame
- **Velocidade muito alta** — especialmente velocidade de parede externa acima de 100 mm/s cria ringing notável
- **Peças soltas** — carretel solto, guia de cabo vibrando ou impressora mal fixada

### Soluções

**Bambu Lab input shaper (Compensação de ressonância):**
```
Bambu Studio → Impressora → Compensação de ressonância
Bambu Lab X1C e P1S têm acelerômetro integrado e calibram isso automaticamente
```

**Reduza a velocidade:**
```
Parede externa: Reduza para 60–80 mm/s
Aceleração: Reduza do padrão para 3000–5000 mm/s²
```

**Verificação mecânica:**
- Verifique se a impressora está em uma superfície estável
- Verifique se o carretel não está vibrando no suporte
- Aperte todos os parafusos acessíveis nos painéis externos do frame

:::tip X1C e P1S calibram ringing automaticamente
Bambu Lab X1C e P1S têm calibração integrada de acelerômetro que é executada automaticamente na inicialização. Execute "Calibração completa" no menu de manutenção se o ringing aparecer após algum tempo.
:::

---

## Subextrusão

Subextrusão é quando a impressora extruda plástico demais pouco. O resultado são paredes finas e fracas, lacunas visíveis entre camadas e superfície "desfiada".

### Causas

- **Bico parcialmente entupido** — acúmulo de carbono reduz o fluxo
- **Temperatura do bico muito baixa** — o plástico não está fluido o suficiente
- **Engrenagem desgastada** no mecanismo do extrusor não pega o filamento adequadamente
- **Velocidade muito alta** — o extrusor não consegue acompanhar o fluxo desejado

### Soluções

**Cold pull:**
```
1. Aqueça o bico a 220 °C
2. Empurre o filamento manualmente
3. Esfrie o bico até 90 °C (PLA) enquanto mantém pressão
4. Puxe o filamento rapidamente para fora
5. Repita até o material puxado sair limpo
```

**Ajuste de temperatura:**
- Aumente a temperatura do bico em 5–10 °C e teste novamente
- Temperatura muito baixa é uma causa comum de subextrusão

**Calibração da taxa de fluxo:**
```
Bambu Studio → Calibração → Taxa de fluxo
Aumente gradualmente até a subextrusão desaparecer
```

**Verifique a engrenagem do extrusor:**
- Remova o filamento e inspecione a engrenagem
- Limpe com uma escovinha pequena se houver pó de filamento nos dentes

---

## Superextrusão

A superextrusão produz um cordão muito largo — a superfície parece solta, brilhante ou irregular, com tendência a blobs.

### Causas

- **Taxa de fluxo muito alta** (EM — Extrusion Multiplier)
- **Diâmetro de filamento errado** — filamento 2,85 mm com perfil 1,75 mm causa superextrusão massiva
- **Temperatura do bico muito alta** deixa o plástico fluido demais

### Soluções

**Calibração da taxa de fluxo:**
```
Bambu Studio → Calibração → Taxa de fluxo
Reduza em passos de 2% até a superfície ficar uniforme e fosca
```

**Verifique o diâmetro do filamento:**
- Meça o diâmetro real do filamento com um paquímetro em 5–10 lugares ao longo do filamento
- Desvio médio acima de 0,05 mm indica filamento de baixa qualidade

---

## Pillowing

Pillowing são camadas superiores bolhosas e irregulares com "almofadas" de plástico entre as camadas. Particularmente visível com baixo preenchimento e poucas camadas superiores.

### Causas

- **Poucas camadas superiores** — o plástico sobre o preenchimento cai nas lacunas
- **Resfriamento insuficiente** — o plástico não solidifica rápido o suficiente para fazer ponte sobre os buracos do preenchimento
- **Preenchimento muito baixo** — grandes lacunas no preenchimento são difíceis de cobrir

### Soluções

**Aumente o número de camadas superiores:**
```
Bambu Studio → Qualidade → Camadas de casca superior
Mínimo: 4 camadas
Recomendado para superfície uniforme: 5–6 camadas
```

**Aumente o resfriamento:**
- PLA deve ter o ventilador em 100% a partir da camada 3
- Resfriamento insuficiente é a causa mais comum de pillowing

**Aumente o preenchimento:**
- Vá de 10–15% para 20–25% se o pillowing persistir
- O padrão Gyroid fornece uma superfície de ponte mais uniforme do que linhas

:::tip Ironing (Passar a ferro)
A função "ironing" do Bambu Studio passa o bico pela camada superior uma vez extra para nivelar a superfície. Ative em Qualidade → Ironing para o melhor acabamento de camada superior.
:::

---

## Separação de camadas (Layer separation / delamination)

A separação de camadas ocorre quando as camadas não aderem adequadamente umas às outras. No pior caso, a impressão se parte ao longo das linhas de camada.

### Causas

- **Temperatura do bico muito baixa** — o plástico não funde bem o suficiente na camada inferior
- **Resfriamento excessivo** — o plástico solidifica rápido demais antes de fundir
- **Espessura de camada muito alta** — acima de 80% do diâmetro do bico dá má fusão
- **Velocidade muito alta** — tempo de fusão reduzido por mm de caminho

### Soluções

**Aumente a temperatura:**
- Tente +10 °C acima do padrão e observe
- ABS e ASA são particularmente sensíveis — requerem aquecimento controlado da câmara

**Reduza o resfriamento:**
- ABS: ventilador DESLIGADO (0%)
- PETG: máximo 20–40%
- PLA: pode tolerar resfriamento total, mas reduza se ocorrer separação

**Espessura da camada:**
- Use no máximo 75% do diâmetro do bico
- Com bico de 0,4 mm: altura de camada máxima recomendada é 0,30 mm

**Verifique se o gabinete está quente o suficiente (ABS/ASA/PA/PC):**
```
Bambu Lab X1C/P1S: Deixe a câmara aquecer até 40–60 °C
antes de iniciar a impressão — não abra a porta durante a impressão
```

---

## Dicas gerais de resolução de problemas

1. **Mude uma coisa por vez** — teste com uma impressão de calibração pequena entre cada mudança
2. **Seque o filamento primeiro** — muitos defeitos de superfície são na verdade sintomas de umidade
3. **Limpe o bico** — obstrução parcial cria defeitos de superfície inconsistentes difíceis de diagnosticar
4. **Execute calibração completa** no menu de manutenção do Bambu Studio após grandes ajustes
5. **Use o Bambu Dashboard** para rastrear quais configurações deram o melhor resultado ao longo do tempo
