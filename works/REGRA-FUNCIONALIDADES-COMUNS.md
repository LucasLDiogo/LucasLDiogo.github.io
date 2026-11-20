# REGRA — Funcionalidades comuns a todos os produtos LLD Works

Decisão do Lucas (20/11/2026): algumas funcionalidades valem para **todos** os produtos. Quando uma delas for alterada, a mudança tem que valer para **todos os links** ao mesmo tempo.

Produtos: AgentWorks, ServiceWorks, SalesWorks, LinkWorks, SocialWorks, RHWorks, PageWorks e ProWorks (+ demos, vitrines, lojas, console e pagar).

## 1. As regras
1. **Um lugar só.** Cada funcionalidade comum tem uma única fonte (tabela abaixo). Nunca copie esse código ou texto para dentro da pasta de um produto. Se um produto precisa de algo diferente, use um parâmetro (produto, cor, versão, plano) vindo do Hub, não uma cópia.
2. **Mudou, vale para todos.** Toda alteração numa funcionalidade comum é feita na fonte única e publicada de uma vez. Proibido corrigir "só no ServiceWorks" algo que é comum.
3. **Testar todos os links.** Depois de publicar, rode `node works/_infra/validar-links.mjs` (todos os produtos × site, assinar, entrar, recuperar, termos, privacidade, painel e demo). Só está pronto com 0 falhas.
4. **Texto legal mudou → subir a versão.** Alterou Termos ou Privacidade: atualize `termos_versao` em Config no console (data AAAA-MM-DD). A data aparece em todas as páginas.
5. **Hub e roteador: uma sessão por vez**, sempre partindo do código que está no ar (ver claude/console-vitrines-suporte.md e claude/lldworks-catalogo.md no projeto PROJETOS MONEY).
6. **Produto novo** entra já usando todas as funcionalidades comuns: tela de conta (`works/conta/`), login pelo Hub, página de erro, robots/sitemap, Termos/Privacidade, limite de login e regra de borda. Inclua os links dele em `validar-links.mjs`.

## 2. Funcionalidades comuns e onde ficam
| Funcionalidade | Fonte única | Vale para |
|---|---|---|
| Cadastro `/assinar`, código no e-mail, pagamento (Pix com QR e cartão), "Começar de novo" | `works/conta/assinar.html` + `conta.js` + `conta.css` (GitHub Pages) e Hub `/api/conta/*` | todos |
| Recuperar senha `/recuperar` e primeira senha | `works/conta/recuperar.html` + Hub | todos |
| Termos de Uso `/termos` e Privacidade `/privacidade` (LGPD) | `works/conta/termos.html` e `privacidade.html` | todos |
| Contato do encarregado, WhatsApp, Pix manual, versão dos termos | Console → Config (tabela `config` do Hub) | todos |
| Login `/entrar`, sessão (cookie `lw_s`, 8 h), sair | `lldworks-router` + Hub `/interno/login` | todos |
| Limite de tentativas de login | Hub (tabela `freio`: 10 por e-mail e 40 por IP a cada 15 min) + regra de borda da Cloudflare (10 POST em 10 s por IP em /entrar e /api/conta/*) | todos |
| Bloquear/excluir usuário encerra a sessão (até 60 s) | `lldworks-router` (`__lwUsuarioAtivo`) + Hub `/interno/usuario` | todos |
| Hub fora do ar = acesso fechado (usa a última resposta boa por até 6 h, depois bloqueia) | `lldworks-router` (`assinaturaHub`) | todos |
| Planos, limites, pacotes, preços | Console → Planos e preços (Hub) | todos |
| Pagamento das mensalidades (Mercado Pago) e webhook | Hub (`MP_ACCESS_TOKEN`, `MP_WEBHOOK_SECRET`) | todos |
| E-mails transacionais (código, senha, acesso liberado) | Hub + Resend (`RESEND_API_KEY`), remetente nao-responda@lldworks.com.br | todos |
| Página de erro 404/429/5xx com a marca, robots.txt, sitemap.xml, cabeçalhos de segurança (CSP, nosniff) | `lldworks-router`, camada `__lwEdge` (fonte: `works/_infra/edge/`) | todos |
| Demonstração guiada nas *-demo | `works/_tour/` servido em `/_lw/tour.js` | todas as demos |
| Modo suporte (entrar como cliente) | `lldworks-router` camada `__lwSup` + Hub | todos |

## 3. Checklist de cada mudança comum
- [ ] Alterei só a fonte única.
- [ ] Publiquei (GitHub Pages / Worker) e esperei o cache (o roteador guarda `conta.js` por até 5 min).
- [ ] `node works/_infra/validar-links.mjs` sem falhas.
- [ ] Se foi texto legal: `termos_versao` atualizado.
- [ ] Anotei no projeto PROJETOS MONEY o que mudou e a versão anterior para voltar atrás.
