/* LLD Works · Demonstração guiada automática (20/11/2026)
   Injetado pelo roteador em todas as páginas <produto>-demo.lldworks.com.br. A página "anda sozinha": abre as telas,
   destaca o que importa, digita nos campos e explica cada função. Nada é salvo (a demonstração é somente leitura).
   Começa sozinha na primeira visita da sessão (ou com ?tour=1); botão "Demonstração guiada" para repetir. */
(() => {
  "use strict";
  if (window.__lwTour) return; window.__lwTour = 1;
  const host = location.hostname.split(".")[0].replace(/-demo$/, "");
  const calmo = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const COR = { serviceworks: "#7C3AED", salesworks: "#EA580C", agentworks: "#0E9F6E", linkworks: "#DB2777", rhworks: "#A16207", socialworks: "#DC2626", pageworks: "#2563EB", proworks: "#0891B2" }[host] || "#1240E0";
  const NOME = { serviceworks: "ServiceWorks", salesworks: "SalesWorks", agentworks: "AgentWorks", linkworks: "LinkWorks", rhworks: "RHWorks", socialworks: "SocialWorks", pageworks: "PageWorks", proworks: "ProWorks" }[host] || "LLD Works";
  const PLANOS = { serviceworks: "https://serviceworks.lldworks.com.br/#planos", salesworks: "https://salesworks.lldworks.com.br/#planos", agentworks: "https://agentworks.lldworks.com.br/#plano", linkworks: "https://linkworks.lldworks.com.br/#preco", rhworks: "https://rhworks.lldworks.com.br/#planos" }[host] || "https://produtos.lldworks.com.br/";
  const pet = () => /pet/i.test(document.querySelector("#empNome")?.textContent || "");

  // ---------- roteiros: ir (abre a tela) · luz (destaca) · clicar · preencher (formulário aberto) · fechar · digitar · rolar ----------
  const R = {
    serviceworks: () => [
      { ir: "inicio", t: "Seu dia em uma tela", f: "Faturamento, ocupação da agenda, faltas e o que fazer hoje: aniversariantes, clientes sumidos e estoque baixo.", luz: ".kpis" },
      { ir: "gestao", t: "Gestão 360", f: "Quantas vagas estão ocupadas, previsão e meta do mês, funil financeiro e ações prontas para encher a agenda.", luz: ".g360-hero" },
      { luz: ".g360-mapa", rolar: 1, t: "Mapa de ocupação", f: "Cada quadrado é o dia de um profissional. Dá para ver na hora onde sobra horário e onde está lotado." },
      { luz: ".g360-acoes", rolar: 1, t: "O sistema diz o que fazer", f: "Dia mais vazio, clientes sumidos com o valor em jogo, faltas e estoque: cada item tem o botão para resolver." },
      { ir: "agenda", t: "Agenda por profissional", f: "Encaixe, remarcação, bloqueios e a agenda do dia de cada pessoa da equipe.", luz: "#v-agenda" },
      { clicar: "btn:Novo agendamento", pula: 1, t: "Novo agendamento", f: "Cliente, serviço, profissional e horário livre. O cliente recebe a confirmação no WhatsApp." },
      { preencher: 1, t: "Preenchimento em segundos", f: "Os horários livres aparecem sozinhos conforme o serviço e o profissional escolhidos." },
      { fechar: 1 },
      { ir: "caixa", t: "Caixa e comandas", f: "Serviço e produto na mesma comanda, desconto, forma de pagamento, comissão e baixa de estoque automáticas.", luz: "#v-caixa" },
      { ir: "clientes", t: pet() ? "Tutores e pets" : "Clientes (CRM)", f: "Histórico, ficha, quanto gastou, quando voltou e filtros de sumidos e aniversariantes.", digitar: ["#cliBusca", "a"], luz: "#v-clientes" },
      { ir: "promocoes", t: "Promoções no WhatsApp", f: "Crie a oferta, escolha o público (sumidos, aniversariantes, VIP) e envie a mensagem pronta.", luz: "#v-promocoes .card, #v-promocoes" },
      { ir: "indicadores", t: "Indicadores", f: "Faturamento por dia, ticket médio, margem dos produtos, recorrência, comissões e ranking da equipe.", luz: "#v-indicadores .serie, #v-indicadores" },
      { ir: "marca", t: "Sua vitrine com link próprio", f: "Logo, banner, cores, endereço e horários. Os clientes agendam sozinhos em nomedaloja.lldworks.com.br.", digitar: ["#v-marca textarea[name=sobre]", " Atendimento com hora marcada."] },
      { ir: "integracoes", t: "WhatsApp com IA e pagamento online", f: "AgentWorks responde e agenda no WhatsApp, o Mercado Pago cobra sinal e Pix, LinkWorks e Instagram na mesma conta.", luz: "#v-integracoes" },
    ],
    salesworks: () => [
      { ir: "inicio", t: "Sua loja em números", f: "Vendas do dia, pedidos para agir agora, produtos acabando e clientes para chamar.", luz: "main" },
      { ir: "pedidos", t: "Pedidos em quadro", f: "Novo, confirmado, separando, saiu para entrega: o cliente acompanha pelo link e você ouve o aviso de pedido novo.", luz: "main" },
      { ir: "separacao", t: "Lista de separação", f: "Cada item marcado na hora de montar a sacola. Nada esquecido, nada trocado.", luz: "main" },
      { ir: "produtos", t: "Produtos com foto, preço e estoque", f: "Cadastro rápido, importação por planilha e reajuste em lote.", luz: "main" },
      { ir: "precificacao", t: "Precificação inteligente", f: "Preço sugerido a partir do custo, margem, taxas e impostos, com alerta de produto abaixo da margem.", luz: "main" },
      { ir: "clientes", t: "CRM de clientes", f: "Fiéis, novos, em risco e sumidos, com mensagem de volta e cupom prontos.", luz: "main" },
      { ir: "cupons", t: "Cupons e promoções", f: "Percentual, valor ou entrega grátis, com mínimo, validade e limite de usos.", luz: "main" },
      { ir: "financeiro", t: "Financeiro (DRE)", f: "Faturamento, custo dos produtos, taxas, despesas e lucro por dia e por forma de pagamento.", luz: "main" },
      { ir: "loja", t: "Minha loja", f: "Marca, horários, entrega por bairro e pagamento: Pix e cartão em até 12x pelo seu Mercado Pago.", luz: "main" },
      { ir: "integracoes", t: "Tudo conectado", f: "AgentWorks no WhatsApp, LinkWorks na bio e SocialWorks no Instagram, com o mesmo login.", luz: "main" },
    ],
    // AgentWorks: o painel do motor já tem a própria demonstração automática (?tour=1); não duplicar.
    linkworks: () => [
      { ir: "blocos", t: "Monte a página em blocos", f: "Links, Pix, agenda, produtos, formulário, vídeo e Spotify. A prévia muda na hora.", luz: "main" },
      { ir: "design", t: "A cara da sua marca", f: "Temas, degradês, fundo animado ou em vídeo, estilos de botão, fontes e efeitos de luz.", luz: "main" },
      { ir: "midia", t: "Música e vídeo", f: "Spotify tocando na página e vídeo de fundo de até 10 MB.", luz: "main" },
      { ir: "perfil", t: "Perfil e redes", f: "Logo ajustada sozinha, bio e ícones das redes sociais.", luz: "main" },
      { ir: "vendas", t: "Clientes e vendas", f: "Contatos do formulário e pedidos com Pix no valor exato, direto da bio.", luz: "main" },
      { ir: "estat", t: "Estatísticas", f: "Visitas, cliques por link e de onde vem o seu público.", luz: "main" },
      { ir: "compart", t: "Compartilhe", f: "QR Code com a sua logo, cartão de contato e link curto.", luz: "main" },
    ],
    rhworks: () => [
      { clicar: "btn:Carregar demonstração", t: "Carregando um exemplo real", f: "Vagas e currículos de exemplo para você ver a triagem funcionando." },
      { ir: "painel", t: "Painel do RH", f: "Vagas abertas, currículos recebidos e quem a IA indica chamar para entrevista.", luz: "main" },
      { ir: "vagas", t: "Vagas com link próprio", f: "Cada vaga ganha um endereço: o candidato envia o currículo ou o LinkedIn e a triagem começa sozinha.", luz: "main" },
      { ir: "candidatos", t: "Ranking com explicação", f: "Nota de aderência, pontos fortes, o que validar e o roteiro da entrevista de cada pessoa.", luz: "main" },
      { ir: "config", t: "IA e privacidade", f: "Critérios neutros (Lei 9.029/95), dados separados por empresa e conexão protegida.", luz: "main" },
    ],
  };
  if (!R[host]) return;

  // ---------- utilidades ----------
  const esperar = (ms) => new Promise((r) => setTimeout(r, calmo ? Math.min(ms, 300) : ms));
  const vis = (e) => !!(e && e.getClientRects().length && getComputedStyle(e).visibility !== "hidden");
  function achar(q) {
    if (!q) return null;
    if (q.startsWith("btn:")) { const t = q.slice(4).toLowerCase(); return [...document.querySelectorAll("button, a.btn, [role=button]")].find((b) => vis(b) && (b.innerText || "").toLowerCase().includes(t)) || null; }
    for (const s of q.split(/,\s*/)) { try { const e = [...document.querySelectorAll(s)].find(vis); if (e) return e; } catch {} }
    return null;
  }
  const alvoAba = (v) => document.querySelector(`[data-v="${v}"], [data-r="${v}"], a[href="#/${v}"], a[href="#${v}"]`);

  // ---------- interface ----------
  const ui = document.createElement("div"); ui.className = "lwt"; ui.style.setProperty("--tc", COR);
  ui.innerHTML = `<div class="lwt-luz" hidden></div><div class="lwt-mouse" hidden aria-hidden="true"></div>
    <div class="lwt-cx" role="region" aria-live="polite" aria-label="Demonstração guiada" hidden>
      <div class="lwt-top"><span class="lwt-tag">Demonstração guiada · ${NOME}</span><span class="lwt-n"></span></div>
      <b class="lwt-t"></b><p class="lwt-f"></p><div class="lwt-bar"><i></i></div>
      <div class="lwt-ac"><button type="button" data-a="pausa">Pausar</button><button type="button" data-a="prox">Próximo</button><button type="button" data-a="sair">Sair</button></div>
    </div>
    <button class="lwt-go" type="button" hidden>▶ Demonstração guiada</button>`;
  document.body.appendChild(ui);
  const $ = (s) => ui.querySelector(s), luz = $(".lwt-luz"), mouse = $(".lwt-mouse"), cx = $(".lwt-cx"), go = $(".lwt-go");
  let rodando = false, pausado = false, pular = false, sair = false, gen = 0;
  // <dialog> modal fica na "camada de topo" do navegador: luz, mouse e caixa viram popover para aparecer por cima dele
  const POP = !!HTMLElement.prototype.showPopover;
  if (POP) [luz, mouse, cx].forEach((e) => e.setAttribute("popover", "manual"));
  function mostra(e) { e.hidden = false; if (POP) { try { if (!e.matches(":popover-open")) e.showPopover(); } catch {} } }
  function topo() { if (!POP) return; for (const e of [luz, mouse, cx]) { if (e.hidden) continue; try { e.hidePopover(); } catch {} try { e.showPopover(); } catch {} } }
  async function pausaVez(ms) { const fim = Date.now() + ms; while (Date.now() < fim || pausado) { if (sair || pular) return; await new Promise((r) => setTimeout(r, 120)); } }
  function mostrarLuz(el) {
    if (!el) { luz.hidden = true; cx.classList.remove("lwt-alto"); return; }
    const r0 = el.getBoundingClientRect(); cx.classList.toggle("lwt-alto", r0.bottom > innerHeight - 200 && r0.top > 240);
    const r = r0, p = 8, top = Math.max(4, r.top - p), left = Math.max(4, r.left - p);
    mostra(luz);
    Object.assign(luz.style, { top: `${top}px`, left: `${left}px`, width: `${Math.min(innerWidth - left - 4, r.width + 2 * p)}px`, height: `${Math.max(24, Math.min(innerHeight - top - 4, r.height + 2 * p))}px` });
  }
  async function moverMouse(el) {
    if (!vis(el)) return; const r = el.getBoundingClientRect();
    mostra(mouse); mouse.style.transform = `translate(${r.left + Math.min(r.width / 2, 60)}px, ${r.top + Math.min(r.height / 2, 22)}px)`;
    await esperar(650); mouse.classList.add("clk"); await esperar(220); mouse.classList.remove("clk");
  }
  async function digitar(el, texto) {
    if (!vis(el)) return;
    el.scrollIntoView({ block: "center", behavior: calmo ? "auto" : "smooth" }); await esperar(450); await moverMouse(el); el.focus();
    for (const ch of texto) { if (sair || pular) break; el.value += ch; el.dispatchEvent(new Event("input", { bubbles: true })); await esperar(55 + Math.random() * 60); }
  }
  async function preencher() {
    const raiz = [...document.querySelectorAll("dialog[open]")].find(vis) || null; if (!raiz) return;
    const campos = [...raiz.querySelectorAll("input, select, textarea")].filter((c) => vis(c) && !c.disabled && !["hidden", "file", "checkbox", "radio", "submit", "button", "color", "date", "time", "number"].includes(c.type));
    const EX = [["cli", "Mar"], ["busca", "Mar"], ["nome", "Mariana Costa"], ["whats", "(54) 99876-5432"], ["tel", "(54) 99876-5432"], ["email", "mariana@exemplo.com"], ["obs", "Prefere atendimento pela manhã"]];
    for (const c of campos.slice(0, 5)) {
      if (sair || pular) return;
      if (c.tagName === "SELECT") { if (c.options.length > 1 && c.selectedIndex < 1) { await moverMouse(c); c.selectedIndex = 1; c.dispatchEvent(new Event("change", { bubbles: true })); await esperar(600); } continue; }
      if (c.value) continue;
      const k1 = `${c.name} ${c.id}`.toLowerCase(), k2 = (c.placeholder || "").toLowerCase();
      const par = EX.find(([x]) => k1.includes(x)) || EX.find(([x]) => k2.includes(x));
      await digitar(c, par ? par[1] : "Exemplo da demonstração");
    }
  }
  const fecharDialogos = () => document.querySelectorAll("dialog[open]").forEach((d) => { try { d.close(); } catch {} });
  function fimDaVolta() { luz.hidden = true; mouse.hidden = true; fecharDialogos(); }
  async function rodar() {
    const meu = ++gen, passos = R[host]();
    rodando = true; sair = false; pausado = false; go.hidden = true; mostra(cx); $('[data-a="prox"]').hidden = false; $('[data-a="pausa"]').textContent = "Pausar";
    try { sessionStorage.setItem("lwt-visto", "1"); } catch {}
    for (let i = 0; i < passos.length; i++) {
      if (sair || meu !== gen) break; pular = false;
      const p = passos[i];
      $(".lwt-n").textContent = `${i + 1} de ${passos.length}`; $(".lwt-bar i").style.width = `${((i + 1) / passos.length) * 100}%`;
      if (p.t) { $(".lwt-t").textContent = p.t; $(".lwt-f").textContent = p.f || ""; }
      try {
        if (p.fechar) { fecharDialogos(); continue; }
        if (p.ir) { const a = alvoAba(p.ir); if (!a) continue; if (vis(a)) await moverMouse(a); a.click(); await esperar(1300); scrollTo({ top: 0, behavior: calmo ? "auto" : "smooth" }); }
        if (p.clicar) { const el = achar(p.clicar); if (!el) { if (p.pula) i++; continue; } el.scrollIntoView({ block: "center" }); await moverMouse(el); el.click(); await esperar(900); topo(); }
        if (p.preencher) await preencher();
        if (p.digitar) await digitar(achar(p.digitar[0]), p.digitar[1]);
        const el = p.luz ? achar(p.luz) : null;
        if (el && p.rolar) { el.scrollIntoView({ block: "center", behavior: calmo ? "auto" : "smooth" }); await esperar(700); }
        mostrarLuz(el); topo();
      } catch { /* a tela mudou: segue para o próximo passo */ }
      await pausaVez(p.f ? Math.max(3800, (p.f.length / 14) * 1000) : 1200);
    }
    fimDaVolta(); rodando = false;
    if (!sair && meu === gen) {
      $(".lwt-t").textContent = `Gostou do ${NOME}?`;
      $(".lwt-f").innerHTML = `Escolha o plano, cadastre-se e comece no mesmo dia. <a class="lwt-cta" href="${PLANOS}" target="_top">Ver planos e assinar →</a>`;
      $(".lwt-n").textContent = "fim"; $('[data-a="pausa"]').textContent = "Ver de novo"; $('[data-a="prox"]').hidden = true;
    } else { cx.hidden = true; go.hidden = false; }
  }
  function parar() { sair = true; pausado = false; fimDaVolta(); cx.hidden = true; go.hidden = false; }
  ui.addEventListener("click", (e) => {
    if (e.target === go) return void rodar();
    const a = e.target.closest("[data-a]")?.dataset.a;
    if (a === "sair") parar();
    if (a === "prox") { pular = true; pausado = false; $('[data-a="pausa"]').textContent = "Pausar"; }
    if (a === "pausa") { if (!rodando) return void rodar(); pausado = !pausado; e.target.textContent = pausado ? "Continuar" : "Pausar"; }
  });
  addEventListener("keydown", (e) => { if (e.key === "Escape" && rodando) parar(); });
  addEventListener("resize", () => { luz.hidden = true; });
  addEventListener("scroll", () => { if (!rodando) luz.hidden = true; }, { passive: true });
  // ---------- início: sozinho na 1ª visita da sessão ou com ?tour=1 ----------
  let visto = false; try { visto = !!sessionStorage.getItem("lwt-visto"); } catch {}
  go.hidden = false;
  if (/[?&]tour=1/.test(location.search) || !visto) setTimeout(() => { if (!rodando) rodar(); }, 2600);
})();
