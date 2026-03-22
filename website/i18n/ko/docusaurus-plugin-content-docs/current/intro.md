---
sidebar_position: 1
title: Bambu Dashboard에 오신 것을 환영합니다
description: Bambu Lab 3D 프린터를 위한 강력한 셀프 호스팅 대시보드
---

# Bambu Dashboard에 오신 것을 환영합니다

**Bambu Dashboard**는 Bambu Lab 3D 프린터를 위한 셀프 호스팅 완전 기능 제어판입니다. 프린터, 필라멘트 재고, 인쇄 기록 등 모든 것을 하나의 브라우저 탭에서 완전히 파악하고 제어할 수 있습니다.

## Bambu Dashboard란?

Bambu Dashboard는 LAN을 통한 MQTT로 프린터에 직접 연결하며, Bambu Lab 서버에 의존하지 않습니다. 모델 및 인쇄 기록 동기화를 위해 Bambu Cloud에도 연결할 수 있습니다.

### 주요 기능

- **라이브 대시보드** — 실시간 온도, 진행 상황, 카메라, AMS 상태
- **필라멘트 재고** — 모든 스풀, 색상, AMS 동기화, 건조 추적
- **인쇄 기록** — 통계 및 내보내기가 포함된 완전한 로그
- **스케줄러** — 캘린더 보기 및 인쇄 대기열
- **프린터 제어** — 온도, 속도, 팬, G-code 콘솔
- **알림** — 7개 채널 (Telegram, Discord, 이메일, ntfy, Pushover, SMS, webhook)
- **멀티 프린터** — 전체 Bambu Lab 시리즈 지원: X1C, X1E, P1S, P1P, P2S, A1, A1 mini, A1 Combo, H2S, H2D, H2C 등
- **셀프 호스팅** — 클라우드 의존성 없음, 데이터는 내 컴퓨터에

## 빠른 시작

| 작업 | 링크 |
|------|------|
| 대시보드 설치 | [설치](./kom-i-gang/installasjon) |
| 첫 번째 프린터 구성 | [설정](./kom-i-gang/oppsett) |
| Bambu Cloud에 연결 | [Bambu Cloud](./kom-i-gang/bambu-cloud) |
| 모든 기능 탐색 | [기능](./funksjoner/oversikt) |
| API 문서 | [API](./avansert/api) |

:::tip 데모 모드
`npm run demo`를 실행하여 물리적 프린터 없이 대시보드를 사용해볼 수 있습니다. 이렇게 하면 라이브 인쇄 사이클이 있는 3개의 시뮬레이션 프린터가 시작됩니다.
:::

## 지원 프린터

- **X1 시리즈**: X1C, X1C Combo, X1E
- **P1 시리즈**: P1S, P1S Combo, P1P
- **P2 시리즈**: P2S, P2S Combo
- **A 시리즈**: A1, A1 Combo, A1 mini
- **H2 시리즈**: H2S, H2D (듀얼 노즐), H2C (툴 체인저, 6 헤드)

## 기술 개요

Bambu Dashboard는 Node.js 22와 바닐라 HTML/CSS/JS로 구축되었습니다 — 무거운 프레임워크 없음, 빌드 단계 없음. 데이터베이스는 Node.js 22에 내장된 SQLite입니다. 자세한 내용은 [아키텍처](./avansert/arkitektur)를 참조하세요.
