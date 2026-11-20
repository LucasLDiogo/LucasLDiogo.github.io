# Rodada de validação — 20/11/2026

Branch `validacao-2026-11-20`. Tudo testado; nada publicado sem o "pode publicar" do Lucas.

## O que entra

| Peça | Onde | Como publica |
|---|---|---|
| SEO: canonical, og:url/locale/site_name, twitter:card, theme-color, JSON-LD (SoftwareApplication + Organization com preços em BRL) | `works/{agentworks,rhworks,salesworks,serviceworks,socialworks,pageworks,proworks}/site.html` | merge na `main` (GitHub Pages) |
| Gestão 360 no ServiceWorks (ocupação das vagas, meta e previsão do mês, funil, mapa de 14 dias, ações inteligentes, CSV) | `works/serviceworks/pub/app3.js`, `pub/sw.css`, `index.html` | merge na `main` |
| Menu e topo do painel no celular sem sobreposição | `works/serviceworks/pub/sw.css` | merge na `main` |
| Demonstração guiada automática (anda sozinha, preenche e explica) | `works/_tour/tour.js` e `tour.css` | merge na `main` + roteador (injeta nas páginas *-demo) |
| Camada de borda do roteador: robots.txt e sitemap.xml por produto, páginas de erro 404/5xx com a marca, CSP mínima/nosniff/HSTS, Cloudflare Web Analytics liberado na CSP, sessão derrubada quando o usuário é desativado | `edge-wrapper.js` + `patch-router.js` | API Cloudflare |
| Assinatura não libera acesso quando o Hub falha (antes: liberava) | `patch-router.js` (R1) | API Cloudflare |
| Limite de tentativas de login no banco (10 por e-mail e 40 por IP a cada 15 min) + rota `/interno/usuario` | `patch-hub.js` | API Cloudflare |
| Demonstração "viva" do ServiceWorks (agenda das contas 1 e 2 recriada todo dia às 03:17) | `works/_infra/demo-vivo/worker.js` | Worker novo `lldworks-demo-vivo` (D1 do ServiceWorks, cron `17 6 * * *`) |
| Console: Premium do ServiceWorks de R$ 1 (teste) para R$ 349; contas de demonstração 1 e 2 com ServiceWorks Premium cortesia | `console.sql` | D1 do Hub |

## Testes
- `teste-borda.mjs` (Miniflare): 21/21 — robots/sitemap, 404/500 com marca, JSON da API intacto, CSP, tour só nas demos, sessão de usuário desativado derrubada, Hub fora não libera, login freado → 429.
- Patches conferidos contra o código NO AR (cada trecho achado 1 vez) em 20/11, 01h40.
- Gestão 360 e tour testados com Playwright sobre as demos reais (desktop e celular), sem erros de console.
- `demo-vivo`: Miniflare + D1 local — idempotente, não toca nos dados semeados, ~1.400 agendamentos em 10 semanas na barbearia.

## Publicar (ordem)
1. `console.sql` no D1 do Hub.
2. Hub: baixar o código no ar, `aplicarHub()`, subir com `keep_bindings` (segredos preservados).
3. Roteador: baixar o código no ar, `aplicarRouter(src, edge-wrapper.js)`, subir com `keep_bindings`.
4. Merge da branch na `main`.
5. Worker `lldworks-demo-vivo` + cron; rodar uma vez.

## Voltar atrás
- Roteador/Hub: Cloudflare → Workers → Deployments → versão anterior.
- Pages: `git revert` do merge.
- demo-vivo: apagar o Worker; para limpar os dados gerados, apagar ids 9.100.000–9.999.999 dos clientes 1 e 2.
