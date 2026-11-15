# LLD Intelligence — Lucas Lima Diogo

Site oficial publicado em **https://lucasldiogo.lldworks.com.br/** (GitHub Pages, branch `main`, domínio próprio via `CNAME`; DNS no Cloudflare, registro CNAME sem proxy apontando para `lucasldiogo.github.io`).

## Estrutura

| Caminho | Conteúdo |
|---|---|
| `index.html` | Home institucional: hero, problema, solução, projetos, soluções e módulos, história, método, simulador, formatos e contato |
| `stok/` | Proposta dedicada à direção do Stok Center (fora do índice de busca) |
| `privacidade/` | Política de privacidade e segurança dos dados |
| `assets/` | Retrato, vídeo noir, imagem de compartilhamento (`og-lld.jpg`) e PDF da proposta |
| `robots.txt`, `sitemap.xml` | SEO técnico |

## Como publicar uma alteração

O HTML é gerado por `build.py` (v3), com `style.css` e `app.js`, mantidos fora deste repositório.

1. Edite o conteúdo ou o estilo no gerador.
2. Rode `LLD_EMAIL=seu@email python3 build.py`. Sem a variável, o site mostra só WhatsApp e LinkedIn.
3. Faça commit e push na `main`; o GitHub Pages publica em cerca de 1 minuto.

## Princípios

- Projetos reais descritos sem nomes de empregadores ou clientes, com selo de status.
- Painéis e imagens ilustrativas marcados como "Ambiente demonstrativo".
- GSAP só para revelações discretas; sem scroll hijacking; respeita `prefers-reduced-motion`.

LLD Intelligence · Rio Grande do Sul
