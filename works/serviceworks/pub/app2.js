// ServiceWorks — telas da versão completa (carregado depois do app.js): início com guia e indicadores, caixa/comanda,
// produtos e estoque, promoções, lista de espera, indicadores, marca e vitrine, integrações (WhatsApp, Mercado Pago,
// LinkWorks, Instagram), site sob demanda e CRM com fichas. Usa window.SW (exposto pelo app.js).
"use strict";
(() => {
  const SW = window.SW; if (!SW) return;
  const { api, toast, aba, S, esc, brl, reais, centsTxt, hojeBR, somaDias, fmtD, fmtDH, fmtWhats, waLink, CARREGA, admin } = SW;
  const $ = (s, r = document) => r.querySelector(s), $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const G = window.gsap, calmo = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const anima = (alvo, de) => { if (G && !calmo && alvo) G.from(alvo, { opacity: 0, y: 10, duration: 0.45, ease: "power2.out", stagger: 0.04, ...de }); };

  // ---------- ícones (traço 2px, estilo Lucide) ----------
  const P = {
    inicio: '<path d="M3 11l9-7 9 7v9a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z"/>',
    agenda: '<rect x="3" y="5" width="18" height="16" rx="3"/><path d="M3 10h18M8 3v4M16 3v4"/>',
    caixa: '<rect x="2" y="6" width="20" height="13" rx="2"/><path d="M2 10h20M6 15h3M15 15h3"/>',
    clientes: '<circle cx="9" cy="8" r="4"/><path d="M2 21a7 7 0 0 1 14 0M16 3.5a4 4 0 0 1 0 8M22 21a7 7 0 0 0-4-6.3"/>',
    servicos: '<path d="M6 3l4 8M18 3l-4 8M8 21a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM16 21a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM10 11l6 6M14 11l-6 6"/>',
    produtos: '<path d="M21 8l-9-5-9 5v8l9 5 9-5z"/><path d="M3 8l9 5 9-5M12 13v8"/>',
    equipe: '<circle cx="12" cy="7" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/>',
    folgas: '<circle cx="12" cy="12" r="9"/><path d="M5.6 5.6l12.8 12.8"/>',
    pacotes: '<rect x="3" y="8" width="18" height="13" rx="2"/><path d="M12 8v13M3 12h18M7.5 8a2.5 2.5 0 1 1 4.5-1.5A2.5 2.5 0 1 1 16.5 8"/>',
    promocoes: '<path d="M20.6 13.4l-7.2 7.2a2 2 0 0 1-2.8 0L3 13V3h10l7.6 7.6a2 2 0 0 1 0 2.8z"/><circle cx="7.5" cy="7.5" r="1.5"/>',
    espera: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
    indicadores: '<path d="M4 20V10M10 20V4M16 20v-7M22 20H2"/>',
    relatorios: '<path d="M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"/><path d="M14 3v6h6M8 13h8M8 17h5"/>',
    marca: '<circle cx="13.5" cy="6.5" r="1.5"/><circle cx="17.5" cy="10.5" r="1.5"/><circle cx="8.5" cy="7.5" r="1.5"/><circle cx="6.5" cy="12.5" r="1.5"/><path d="M12 2a10 10 0 0 0 0 20c1.1 0 2-.9 2-2 0-.5-.2-1-.5-1.3-.3-.4-.5-.8-.5-1.3 0-1.1.9-2 2-2h2.3A5.7 5.7 0 0 0 22 9.7C22 5.4 17.5 2 12 2z"/>',
    integracoes: '<path d="M9 7H6a4 4 0 0 0 0 8h3M15 7h3a4 4 0 0 1 0 8h-3M8 11h8"/>',
    site: '<circle cx="12" cy="12" r="10"/><path d="M2 12h20M12 2a15 15 0 0 1 0 20M12 2a15 15 0 0 0 0 20"/>',
    config: '<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"/>',
    plano: '<path d="M12 2l3 6.5 7 1-5 5 1.2 7L12 18l-6.2 3.5L7 14.5l-5-5 7-1z"/>',
    wa: '<path d="M3 21l1.7-5A9 9 0 1 1 8 19.3z"/><path d="M9 10c.5 2 2 3.5 4 4l1.2-1.2 2 .8-.4 2c-4 .4-8.4-4-8-8l2-.4.8 2z"/>',
    check: '<path d="M20 6L9 17l-5-5"/>', mais: '<path d="M12 5v14M5 12h14"/>', ext: '<path d="M14 3h7v7M10 14L21 3M21 14v5a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5"/>',
    copiar: '<rect x="9" y="9" width="12" height="12" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>', alerta: '<path d="M12 9v4M12 17h.01M10.3 3.9L1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z"/>',
    ficha: '<path d="M9 2h6a1 1 0 0 1 1 1v2H8V3a1 1 0 0 1 1-1z"/><path d="M8 4H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2h-2M8 12h8M8 16h5"/>',
    bolo: '<path d="M4 21h16v-8a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2zM4 16c2 1 4 1 6 0s4-1 6 0 4 1 4 0M12 11V7M12 4.5v.01"/>',
  };
  const ic = (n, cl = "") => `<svg class="ic ${cl}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${P[n] || ""}</svg>`;
  const TERMO = () => ({ petshop: ["Tutor", "Tutores"], clinica: ["Paciente", "Pacientes"] }[S.emp?.segmento] || ["Cliente", "Clientes"]);
  const pct = (n) => `${Math.round(n)}%`;
  const dataBR = (d) => (d ? `${d.slice(8, 10)}/${d.slice(5, 7)}/${d.slice(0, 4)}` : "");
  const plano = () => S.perfil?.plano || {};

  // ---------- navegação lateral com ícones e grupos ----------
  const ORDEM = [
    ["Dia a dia", [["inicio", "Início"], ["agenda", "Agenda"], ["caixa", "Caixa e comandas"], ["clientes", null], ["espera", "Lista de espera"]]],
    ["Vender mais", [["promocoes", "Promoções"], ["pacotes", null], ["indicadores", "Indicadores"], ["relatorios", "Relatório de agenda"]]],
    ["Cadastros", [["servicos", null], ["produtos", "Produtos e estoque"], ["equipe", null], ["folgas", null]]],
    ["Sua marca", [["marca", "Marca e vitrine"], ["integracoes", "WhatsApp e pagamentos"], ["site", "Seu site"], ["config", "Ajustes da agenda"], ["plano", null]]],
  ];
  function montaNav() {
    const nav = $(".nav"), velhos = Object.fromEntries($$("button[data-v]", nav).map((b) => [b.dataset.v, b]));
    nav.innerHTML = "";
    for (const [grupo, itens] of ORDEM) {
      const g = document.createElement("div"); g.className = "nav-g"; g.innerHTML = `<span class="nav-t">${grupo}</span>`;
      for (const [v, nome] of itens) {
        const b = velhos[v] || Object.assign(document.createElement("button"), { type: "button" });
        b.setAttribute("role", "tab"); b.dataset.v = v; b.setAttribute("aria-selected", "false");
        const rot = nome || b.textContent.trim();
        b.innerHTML = `${ic(v)}<span>${esc(rot)}</span>`; if (v === "clientes") b.id = "navCli";
        g.appendChild(b);
      }
      nav.appendChild(g);
    }
    document.body.classList.add("v2");
  }
  function secao(v, html) {
    let s = $(`#v-${v}`);
    if (!s) { s = document.createElement("section"); s.className = "view"; s.id = `v-${v}`; s.setAttribute("role", "tabpanel"); $("main").appendChild(s); }
    if (html != null) s.innerHTML = html;
    return s;
  }
  function dialogo(id, html, largura = 560) {
    let d = $(`#${id}`); if (d) d.remove();
    d = document.createElement("dialog"); d.id = id; d.style.width = `min(${largura}px,96vw)`;
    d.innerHTML = `<form method="dialog">${html}<p class="err" role="alert"></p></form>`;
    document.body.appendChild(d); return d;
  }
  async function perfil() { S.perfil = await api("GET", "perfil"); return S.perfil; }

  // ---------- imagem: reduz no navegador antes de enviar ----------
  function reduzir(file, maxW, maxH, maxBytes) {
    return new Promise((ok, erro) => {
      if (!/^image\/(png|jpeg|jpg|webp)$/.test(file.type) && !/\.(png|jpe?g|webp)$/i.test(file.name || "")) return erro(new Error("Use uma imagem PNG, JPG ou WEBP."));
      // Lê como data: (a política de segurança do painel não aceita blob:). Antes, PNG/JPG falhavam com "Não consegui ler a imagem".
      if (file.size > 15e6) return erro(new Error("Imagem muito grande (mais de 15 MB). Use uma foto menor."));
      const img = new Image(), leitor = new FileReader();
      img.onload = () => {
        let w = img.width, h = img.height; const k = Math.min(1, maxW / w, maxH / h); w = Math.round(w * k); h = Math.round(h * k);
        const c = document.createElement("canvas"); c.width = w; c.height = h; const x = c.getContext("2d"); x.drawImage(img, 0, 0, w, h);
        for (const q of [0.9, 0.8, 0.7, 0.6, 0.5]) {
          let d = c.toDataURL("image/webp", q); if (!d.startsWith("data:image/webp")) { x.globalCompositeOperation = "destination-over"; x.fillStyle = "#fff"; x.fillRect(0, 0, w, h); d = c.toDataURL("image/jpeg", q); }
          if (d.length * 0.75 <= maxBytes) return ok(d);
        }
        erro(new Error("Imagem pesada demais. Tente outra menor."));
      };
      img.onerror = () => erro(new Error("Não consegui ler a imagem. Tente salvar como PNG ou JPG e envie de novo."));
      leitor.onerror = () => erro(new Error("Não consegui abrir o arquivo."));
      leitor.onload = () => { img.src = leitor.result; };
      leitor.readAsDataURL(file);
    });
  }

  // ========== INÍCIO ==========
  async function inicio() {
    const s = secao("inicio", '<p class="mute">Carregando…</p>');
    const hoje = hojeBR();
    const [g, ind, oc, res, venc, aniv] = await Promise.all([api("GET", "guia"), api("GET", `indicadores?de=${hoje.slice(0, 8)}01&ate=${hoje}`), api("GET", `ocupacao?de=${hoje}&dias=7`), api("GET", `resumo?data=${hoje}`),
      api("GET", "fichas?vencendo=1").catch(() => []), api("GET", "clientes?filtro=aniversariantes").catch(() => [])]);
    await perfil();
    const [t1, tN] = TERMO(), primeiro = (S.emp.nome || "").split(" ")[0];
    const passos = g.passos.map((p) => `<li class="${p.feito ? "ok" : ""}">${p.feito ? ic("check") : `<i class="pt"></i>`}<span>${esc(p.titulo)}</span>${p.feito ? "" : p.externo ? `<a class="btn sm" href="${/\/\/(agentworks|linkworks|socialworks)\./.test(p.externo) ? "/ir/" + p.externo.match(/\/\/([a-z]+)\./)[1] : p.externo}" target="_blank" rel="noopener">Abrir ${ic("ext")}</a>` : `<button class="btn sm" data-ir="${p.ir.split("/")[0]}">Fazer agora</button>`}</li>`).join("");
    const dia = (d) => new Date(d + "T12:00:00Z").toLocaleDateString("pt-BR", { timeZone: "UTC", weekday: "short", day: "2-digit" }).replace(".", "");
    s.innerHTML = `
      <div class="hero2"><div><p class="mute small">${new Date().toLocaleDateString("pt-BR", { weekday: "long", day: "2-digit", month: "long" })}</p><h1>Olá! Aqui está o ${esc(S.emp.nome)} hoje.</h1></div>
        <div class="row"><a class="btn" href="${SW.linkVitrine()}" target="_blank" rel="noopener">${ic("site")}Ver vitrine</a><button class="btn" data-a2="copiarVitrine">${ic("copiar")}Copiar link</button><button class="btn pri" data-a2="novaVenda">${ic("caixa")}Nova venda</button></div></div>
      ${g.pct < 100 && !g.dispensado ? `<div class="card guia"><div class="row sb"><div><h2>Deixe a sua loja pronta para vender</h2><p class="mute small">Siga os passos: quando chegar a 100%, a vitrine está completa para divulgar.</p></div><div class="anel" style="--v:${g.pct}"><b>${g.pct}%</b></div></div><ol class="passos2">${passos}</ol><button class="btn ghost sm" data-a2="dispensarGuia">Esconder o guia</button></div>` : ""}
      <div class="kpis kpis2">
        <div class="card kpi"><div class="l">Faturamento no mês</div><div class="v" data-conta="${ind.faturamento_centavos}" data-moeda>${brl(ind.faturamento_centavos)}</div><div class="tiny mute">${ind.vendas} vendas · ticket ${brl(ind.ticket_medio_centavos)}</div></div>
        <div class="card kpi"><div class="l">Hoje</div><div class="v">${res.atendimentos}</div><div class="tiny mute">atendimentos · previsto ${brl(res.previsto_centavos)}</div></div>
        <div class="card kpi"><div class="l">Agenda ocupada hoje</div><div class="v">${res.ocupacao_pct}%</div><div class="bar2"><i style="width:${res.ocupacao_pct}%"></i></div></div>
        <div class="card kpi"><div class="l">${tN} que voltam</div><div class="v">${pct(ind.recorrencia_pct)}</div><div class="tiny mute">${ind.clientes_atendidos} atendidos · ${ind.clientes_novos} novos no mês</div></div>
        <div class="card kpi"><div class="l">Faltas no mês</div><div class="v">${pct(ind.faltas_pct)}</div><div class="tiny mute">dos horários marcados</div></div>
      </div>
      <div class="grid g2">
        <div class="card"><div class="row sb"><h2>Ocupação dos próximos 7 dias</h2><button class="btn sm ghost" data-ir="agenda">Abrir agenda</button></div>
          <div class="ocup">${oc.map((d) => `<button type="button" class="oc" data-dia="${d.dia}" title="${d.ocupado_min} de ${d.capacidade_min} min"><span class="ob"><i style="height:${d.pct}%"></i></span><b>${d.capacidade_min ? d.pct + "%" : "—"}</b><span>${dia(d.dia)}</span></button>`).join("")}</div>
          <p class="tiny mute">Dias abaixo de 50% têm espaço: use uma promoção ou a lista de espera para encher.</p></div>
        <div class="card"><h2>Para fazer hoje</h2><div class="avisos">
          ${ind.estoque_baixo.length ? `<button class="aviso2" data-ir="produtos">${ic("alerta")}<span><b>${ind.estoque_baixo.length} produto(s) com estoque baixo</b><small>${esc(ind.estoque_baixo.slice(0, 3).map((p) => `${p.nome} (${p.estoque})`).join(", "))}</small></span></button>` : ""}
          ${venc.length ? `<button class="aviso2" data-ir="clientes">${ic("ficha")}<span><b>${venc.length} retorno(s) ou vacina(s) vencendo</b><small>${esc(venc.slice(0, 3).map((f) => `${f.pet || f.cliente}: ${f.titulo} ${fmtD(f.proxima)}`).join(" · "))}</small></span></button>` : ""}
          ${aniv.length ? `<button class="aviso2" data-a2="aniversariantes">${ic("bolo")}<span><b>${aniv.length} aniversariante(s) no mês</b><small>Mande um parabéns com um mimo: cliente lembrado volta mais.</small></span></button>` : ""}
          <button class="aviso2" data-a2="sumidos">${ic("wa")}<span><b>Chamar quem sumiu</b><small>${t1}s que não vêm há 45+ dias, com mensagem pronta.</small></span></button>
          ${plano().site ? `<button class="aviso2" data-ir="site">${ic("site")}<span><b>Seu site</b><small>${S.perfil.site_status === "publicado" ? "No ar" : S.perfil.site_status ? "Em produção pela LLD Works" : "Peça o seu site profissional"}</small></span></button>` : ""}
        </div></div>
      </div>`;
    anima($$(".card", s)); contar(s);
  }
  function contar(raiz) {
    if (!G || calmo) return;
    $$("[data-conta]", raiz).forEach((el) => { const fim = +el.dataset.conta, o = { v: 0 }; G.to(o, { v: fim, duration: 0.9, ease: "power2.out", onUpdate: () => (el.textContent = el.hasAttribute("data-moeda") ? brl(o.v) : Math.round(o.v)) }); });
  }

  // ========== CAIXA E COMANDAS ==========
  const FORMAS = [["pix", "Pix"], ["dinheiro", "Dinheiro"], ["credito", "Cartão de crédito"], ["debito", "Cartão de débito"], ["online", "Link online"], ["outro", "Outro"]];
  const STV = { aberta: ["Aberta", "warn"], paga: ["Paga", "ok"], cancelada: ["Cancelada", ""] };
  async function caixa() {
    const s = secao("caixa", null), f = s.dataset.f || "";
    const lst = await api("GET", `vendas?de=${somaDias(hojeBR(), -30)}${f ? "&status=" + f : ""}`);
    const pagas = lst.filter((v) => v.status === "paga" && (v.pago_em || "").slice(0, 10) === hojeBR());
    s.innerHTML = `<div class="head"><div><h1>Caixa e comandas</h1><p>Toda venda passa por aqui: serviço, produto ou os dois. Ao fechar, o estoque baixa e a comissão é calculada.</p></div>
      <div class="row"><select data-f aria-label="Filtrar" style="width:auto"><option value="">Últimos 30 dias</option><option value="aberta"${f === "aberta" ? " selected" : ""}>Abertas</option><option value="paga"${f === "paga" ? " selected" : ""}>Pagas</option><option value="cancelada"${f === "cancelada" ? " selected" : ""}>Canceladas</option></select>
      <button class="btn pri" data-a2="novaVenda">${ic("mais")}Nova venda</button></div></div>
      <div class="kpis"><div class="card kpi"><div class="l">Recebido hoje</div><div class="v">${brl(pagas.reduce((a, v) => a + v.total_centavos, 0))}</div><div class="tiny mute">${pagas.length} venda(s)</div></div>
        <div class="card kpi"><div class="l">Comandas abertas</div><div class="v">${lst.filter((v) => v.status === "aberta").length}</div><div class="tiny mute">esperando pagamento</div></div></div>
      <div class="card scroll"><table><thead><tr><th>Código</th><th>${TERMO()[0]}</th><th>Itens</th><th class="n">Total</th><th>Situação</th><th>Quando</th><th></th></tr></thead><tbody>
      ${lst.map((v) => `<tr><td><b>${esc(v.codigo)}</b>${v.tipo === "sinal" ? ' <span class="chip p">sinal</span>' : ""}</td><td>${esc(v.cliente || "—")}</td><td class="small">${esc(v.itens || "")}</td><td class="n"><b>${brl(v.total_centavos)}</b></td>
        <td><span class="chip ${STV[v.status][1]}">${STV[v.status][0]}</span>${v.forma ? `<div class="tiny mute">${esc((FORMAS.find((x) => x[0] === v.forma) || [, v.forma])[1])}</div>` : ""}</td><td class="small">${fmtDH(v.pago_em || v.criado_em.replace("T", " ").slice(0, 16).replace(" ", "T"))}</td>
        <td class="n"><button class="btn sm" data-a2="venda" data-id="${v.id}">Abrir</button></td></tr>`).join("") || `<tr><td colspan="7"><div class="empty">Nenhuma venda no período. Use “Nova venda” ou “Abrir comanda” no agendamento.</div></td></tr>`}
      </tbody></table></div>`;
    $("[data-f]", s).onchange = (e) => { s.dataset.f = e.target.value; caixa().catch((x) => toast(x.message, true)); };
  }
  let vendaAtual = null, catalogo = null;
  async function carregaCatalogo() { const [srv, prd] = await Promise.all([api("GET", "servicos"), api("GET", "produtos")]); catalogo = { srv: srv.filter((x) => x.ativo), prd: prd.filter((x) => x.ativo) }; }
  async function abrirVenda(id, novo = {}) {
    await carregaCatalogo();
    if (!id) { vendaAtual = await api("POST", "vendas", { itens: [], contato_id: novo.contato_id || null }); }
    else vendaAtual = await api("GET", `vendas/${id}`);
    desenhaVenda();
  }
  function desenhaVenda() {
    const v = vendaAtual, aberta = v.status === "aberta", pro = plano().pagamento_online;
    const d = dialogo("dlgVenda", `<div class="row sb"><h2>Comanda ${esc(v.codigo)}</h2><span class="chip ${STV[v.status][1]}">${STV[v.status][0]}</span></div>
      <div class="row" style="margin-top:8px"><span class="mute small">${TERMO()[0]}:</span> <b>${esc(v.cliente || "sem cliente")}</b>${aberta ? ` <input id="vCli" placeholder="Buscar ${TERMO()[0].toLowerCase()} pelo nome" list="vCliL" style="flex:1;min-width:180px"><datalist id="vCliL"></datalist>` : ""}</div>
      <table class="itens"><tbody>${v.itens.map((i) => `<tr><td>${esc(i.nome)}${i.profissional ? `<div class="tiny mute">${esc(i.profissional)}${i.comissao_centavos ? ` · comissão ${brl(i.comissao_centavos)}` : ""}</div>` : ""}</td><td class="n">${i.qtd}×</td><td class="n">${brl(i.total_centavos)}</td><td class="n">${aberta ? `<button type="button" class="btn sm ghost" data-rem="${i.id}" aria-label="Remover">✕</button>` : ""}</td></tr>`).join("") || '<tr><td><div class="empty">Comanda vazia: adicione serviços ou produtos.</div></td></tr>'}</tbody></table>
      ${aberta ? `<div class="add-item"><select id="vTipo" style="width:auto"><option value="servico">Serviço</option><option value="produto">Produto</option><option value="avulso">Outro</option></select>
        <select id="vRef" style="flex:1;min-width:160px"></select><input id="vAvulso" placeholder="Descrição" hidden style="flex:1"><input id="vQtd" type="number" min="1" value="1" style="width:70px" aria-label="Quantidade">
        <input id="vVal" placeholder="Valor" inputmode="decimal" style="width:100px" aria-label="Valor unitário"><select id="vProf" style="width:auto" aria-label="Profissional"><option value="">Profissional</option>${S.profs.filter((p) => p.ativo).map((p) => `<option value="${p.id}">${esc(p.nome)}</option>`).join("")}</select>
        <button type="button" class="btn" data-add>Adicionar</button></div>` : ""}
      <div class="tot"><div><span>Subtotal</span><b>${brl(v.subtotal_centavos)}</b></div><div><span>Desconto</span>${aberta ? `<input id="vDesc" value="${centsTxt(v.desconto_centavos)}" inputmode="decimal" style="width:100px;text-align:right">` : `<b>${brl(v.desconto_centavos)}</b>`}</div><div class="g"><span>Total</span><b>${brl(v.total_centavos)}</b></div></div>
      ${aberta ? `<div class="row" style="margin-top:12px"><label class="small mute" for="vForma">Forma de pagamento</label><select id="vForma" style="width:auto">${FORMAS.filter((x) => x[0] !== "online").map(([k, n]) => `<option value="${k}">${n}</option>`).join("")}</select></div>` : ""}
      <div id="vLink"></div>
      <div class="acts">${aberta && admin() ? `<button type="button" class="btn bad" data-cancelar>Cancelar comanda</button>` : ""}${!aberta && v.status === "paga" && admin() ? `<button type="button" class="btn bad" data-cancelar>Estornar</button>` : ""}
        <span style="flex:1"></span>${aberta && pro ? `<button type="button" class="btn" data-link>${ic("ext")}Link de pagamento</button>` : ""}${aberta ? `<button type="button" class="btn ok" data-pagar>${ic("check")}Receber ${brl(v.total_centavos)}</button>` : ""}<button value="x" class="btn">Fechar</button></div>`, 640);
    const er = $(".err", d), roda = async (fn) => { er.textContent = ""; try { await fn(); } catch (x) { er.textContent = x.message; } };
    if (aberta) {
      const tipo = $("#vTipo", d), ref = $("#vRef", d), val = $("#vVal", d), av = $("#vAvulso", d);
      const preenche = () => {
        const t = tipo.value; av.hidden = t !== "avulso"; ref.hidden = t === "avulso";
        ref.innerHTML = (t === "servico" ? catalogo.srv.map((x) => `<option value="${x.id}" data-v="${x.promo_centavos ?? x.preco_centavos}">${esc(x.nome)} · ${brl(x.promo_centavos ?? x.preco_centavos)}</option>`) : catalogo.prd.map((x) => `<option value="${x.id}" data-v="${x.preco_centavos}" ${x.controla_estoque && x.estoque <= 0 ? "disabled" : ""}>${esc(x.nome)} · ${brl(x.preco_centavos)}${x.controla_estoque ? ` · ${x.estoque} em estoque` : ""}</option>`)).join("");
        val.value = t === "avulso" ? "" : centsTxt(+(ref.selectedOptions[0]?.dataset.v || 0));
      };
      tipo.onchange = preenche; ref.onchange = () => (val.value = centsTxt(+(ref.selectedOptions[0]?.dataset.v || 0))); preenche();
      $("[data-add]", d).onclick = () => roda(async () => {
        const it = { tipo: tipo.value, qtd: +$("#vQtd", d).value || 1, profissional_id: $("#vProf", d).value || null };
        if (tipo.value === "avulso") { it.nome = av.value.trim(); it.unit_centavos = reais(val.value); } else { it.ref_id = +ref.value; const c = reais(val.value); if (c != null) it.unit_centavos = c; }
        vendaAtual = await api("PUT", `vendas/${v.id}`, { acao: "adicionar", itens: [it] }); desenhaVenda();
      });
      $$("[data-rem]", d).forEach((b) => (b.onclick = () => roda(async () => { vendaAtual = await api("PUT", `vendas/${v.id}`, { acao: "remover", item_id: +b.dataset.rem }); desenhaVenda(); })));
      $("#vDesc", d).onchange = (e) => roda(async () => { vendaAtual = await api("PUT", `vendas/${v.id}`, { acao: "desconto", desconto_centavos: reais(e.target.value) || 0 }); desenhaVenda(); });
      const busca = $("#vCli", d); let tb;
      busca.oninput = () => { clearTimeout(tb); tb = setTimeout(async () => { const l = await api("GET", "clientes?q=" + encodeURIComponent(busca.value)); $("#vCliL", d).innerHTML = l.slice(0, 20).map((c) => `<option value="${esc(c.nome)} · ${fmtWhats(c.whatsapp)}" data-id="${c.id}">`).join(""); busca.dataset.l = JSON.stringify(l.slice(0, 20).map((c) => [c.id, `${c.nome} · ${fmtWhats(c.whatsapp)}`])); }, 250); };
      busca.onchange = () => roda(async () => { const m = JSON.parse(busca.dataset.l || "[]").find((x) => x[1] === busca.value); if (m) { vendaAtual = await api("PUT", `vendas/${v.id}`, { acao: "cliente", contato_id: m[0] }); desenhaVenda(); } });
      $("[data-pagar]", d).onclick = () => roda(async () => { vendaAtual = await api("PUT", `vendas/${v.id}`, { acao: "pagar", forma: $("#vForma", d).value }); toast("Venda recebida."); d.close(); if ($("#v-caixa.on")) caixa(); if ($("#v-agenda.on")) SW.agenda(); });
      const lk = $("[data-link]", d); if (lk) lk.onclick = () => roda(async () => {
        const r = await api("POST", `vendas/${v.id}/link`);
        $("#vLink", d).innerHTML = `<div class="note2">${ic("ext")}<div><b>Link de pagamento pronto</b> (Pix ou cartão). Quando o cliente pagar, a comanda fecha sozinha.<div class="row" style="margin-top:8px"><input readonly value="${esc(r.link)}" style="flex:1"><button type="button" class="btn sm" data-cp>Copiar</button>${r.whatsapp ? `<a class="btn sm pri" href="${r.whatsapp}" target="_blank" rel="noopener">${ic("wa")}Enviar no WhatsApp</a>` : ""}</div></div></div>`;
        $("[data-cp]", d).onclick = () => SW.copiar(r.link, "Link copiado.");
      });
    }
    const cn = $("[data-cancelar]", d); if (cn) cn.onclick = () => roda(async () => { if (!confirm(v.status === "paga" ? "Estornar esta venda? O estoque volta e ela sai do faturamento." : "Cancelar esta comanda?")) return; await api("PUT", `vendas/${v.id}`, { acao: "cancelar" }); toast("Comanda cancelada."); d.close(); if ($("#v-caixa.on")) caixa(); });
    d.showModal();
  }

  // ========== PRODUTOS ==========
  async function produtos() {
    const s = secao("produtos"), lst = await api("GET", "produtos"), baixo = lst.filter((p) => p.estoque_baixo && p.ativo);
    s.innerHTML = `<div class="head"><div><h1>Produtos e estoque</h1><p>Preço, custo, margem e estoque. Produtos marcados para a vitrine aparecem para os clientes; a venda acontece no caixa.</p></div>${admin() ? `<button class="btn pri" data-a2="produto">${ic("mais")}Produto</button>` : ""}</div>
      ${baixo.length ? `<div class="note2 warn">${ic("alerta")}<div><b>Estoque baixo:</b> ${esc(baixo.map((p) => `${p.nome} (${p.estoque})`).join(", "))}. Lance a entrada quando a mercadoria chegar.</div></div>` : ""}
      <div class="card scroll"><table><thead><tr><th></th><th>Produto</th><th>Categoria</th><th class="n">Preço</th><th class="n">Custo</th><th class="n">Margem</th><th class="n">Estoque</th><th></th></tr></thead><tbody>
      ${lst.map((p) => `<tr class="${p.ativo ? "" : "off"}"><td style="width:48px">${p.tem_foto ? `<img class="mini" src="/api/admin/produtos/${p.id}/foto" alt="" loading="lazy">` : `<span class="mini vazio">${ic("produtos")}</span>`}</td>
        <td><b>${esc(p.nome)}</b>${p.vitrine ? ' <span class="chip p">vitrine</span>' : ""}${p.sku ? `<div class="tiny mute">${esc(p.sku)}</div>` : ""}</td><td class="small">${esc(p.categoria || "—")}</td>
        <td class="n">${brl(p.preco_centavos)}</td><td class="n small">${brl(p.custo_centavos)}</td><td class="n"><span class="chip ${p.margem_pct >= 40 ? "ok" : p.margem_pct >= 20 ? "" : "warn"}">${p.margem_pct}%</span></td>
        <td class="n">${p.controla_estoque ? `<b class="${p.estoque_baixo ? "baixo" : ""}">${p.estoque}</b>` : '<span class="mute small">não controla</span>'}</td>
        <td class="n">${admin() ? `${p.controla_estoque ? `<button class="btn sm" data-a2="estoque" data-id="${p.id}">Estoque</button> ` : ""}<button class="btn sm" data-a2="produto" data-id="${p.id}">Editar</button>` : ""}</td></tr>`).join("") || `<tr><td colspan="8"><div class="empty">Nenhum produto. Cadastre o que você vende no balcão (ração, pomada, esmalte, shampoo…) para controlar estoque e margem.</div></td></tr>`}
      </tbody></table></div>`;
    S.produtos = lst;
  }
  function abrirProduto(id) {
    const p = (S.produtos || []).find((x) => x.id === id) || { ativo: 1, vitrine: 1, controla_estoque: 1, estoque_min: 0 };
    let foto;
    const d = dialogo("dlgProd", `<h2>${id ? "Editar produto" : "Novo produto"}</h2>
      <div class="grid g2" style="margin-top:12px"><label>Nome<input id="pN" required maxlength="80" value="${esc(p.nome || "")}"></label><label>Categoria<input id="pC" maxlength="40" value="${esc(p.categoria || "")}" placeholder="Ex.: Ração, Shampoo"></label>
      <label>Preço de venda (R$)<input id="pP" inputmode="decimal" required value="${centsTxt(p.preco_centavos)}"></label><label>Custo (R$)<input id="pCu" inputmode="decimal" value="${centsTxt(p.custo_centavos ?? 0)}"></label>
      ${id ? "" : '<label>Estoque inicial<input id="pE" type="number" min="0" value="0"></label>'}<label>Avisar quando chegar a<input id="pM" type="number" min="0" value="${p.estoque_min || 0}"></label>
      <label>Código / SKU<input id="pS" maxlength="40" value="${esc(p.sku || "")}"></label></div>
      <label style="margin-top:10px">Descrição<textarea id="pD" maxlength="300" rows="2">${esc(p.descricao || "")}</textarea></label>
      <div class="row" style="margin-top:10px"><label class="chk"><input type="checkbox" id="pV" ${p.vitrine ? "checked" : ""}> Mostrar na vitrine</label><label class="chk"><input type="checkbox" id="pEs" ${p.controla_estoque ? "checked" : ""}> Controlar estoque</label>${id ? `<label class="chk"><input type="checkbox" id="pA" ${p.ativo ? "checked" : ""}> Ativo</label>` : ""}</div>
      <div class="row" style="margin-top:10px"><span class="small mute">Foto</span><input type="file" id="pF" accept="image/png,image/jpeg,image/webp"><img id="pPrev" class="mini" ${p.tem_foto ? `src="/api/admin/produtos/${id}/foto"` : "hidden"} alt=""></div>
      <p class="tiny mute" id="pMg"></p>
      <div class="acts"><button value="x" class="btn">Cancelar</button><button value="ok" class="btn pri">Salvar</button></div>`);
    const mg = () => { const pr = reais($("#pP", d).value) || 0, cu = reais($("#pCu", d).value) || 0; $("#pMg", d).textContent = pr ? `Margem: ${Math.round((100 * (pr - cu)) / pr)}% · lucro de ${brl(pr - cu)} por unidade` : ""; };
    $("#pP", d).oninput = mg; $("#pCu", d).oninput = mg; mg();
    $("#pF", d).onchange = async (e) => { const f = e.target.files[0]; if (!f) return; try { foto = await reduzir(f, 800, 800, 175e3); $("#pPrev", d).src = foto; $("#pPrev", d).hidden = false; } catch (x) { $(".err", d).textContent = x.message; } };
    SW.aoEnviar(d, async () => {
      const corpo = { nome: $("#pN", d).value.trim(), categoria: $("#pC", d).value.trim(), preco_centavos: reais($("#pP", d).value), custo_centavos: reais($("#pCu", d).value) || 0, estoque_min: +$("#pM", d).value || 0, sku: $("#pS", d).value.trim(), descricao: $("#pD", d).value.trim(),
        vitrine: $("#pV", d).checked, controla_estoque: $("#pEs", d).checked, ativo: id ? $("#pA", d).checked : true, ...(foto ? { foto } : {}) };
      if (!id) corpo.estoque = +$("#pE", d).value || 0;
      await api(id ? "PUT" : "POST", id ? `produtos/${id}` : "produtos", corpo); toast("Produto salvo."); await produtos();
    });
    d.showModal();
  }
  function abrirEstoque(id) {
    const p = S.produtos.find((x) => x.id === id);
    const d = dialogo("dlgEst", `<h2>Estoque · ${esc(p.nome)}</h2><p class="mute">Agora: <b>${p.estoque}</b> unidade(s)</p>
      <div class="grid g2" style="margin-top:12px"><label>Movimento<select id="eT"><option value="entrada">Entrada (chegou mercadoria)</option><option value="saida">Saída (perda, uso interno)</option><option value="ajuste">Ajuste (contagem)</option></select></label>
      <label id="eQl">Quantidade<input id="eQ" type="number" min="0" value="1"></label><label>Custo unitário (R$, opcional)<input id="eC" inputmode="decimal" placeholder="${centsTxt(p.custo_centavos)}"></label><label>Observação<input id="eO" maxlength="120"></label></div>
      <div id="eHist" class="small" style="margin-top:12px"></div>
      <div class="acts"><button value="x" class="btn">Fechar</button><button value="ok" class="btn pri">Lançar</button></div>`);
    $("#eT", d).onchange = (e) => ($("#eQl", d).firstChild.textContent = e.target.value === "ajuste" ? "Quantidade contada" : "Quantidade");
    api("GET", `produtos/${id}/movimentos`).then((m) => ($("#eHist", d).innerHTML = m.length ? `<b>Últimos movimentos</b><div class="scroll" style="max-height:160px"><table><tbody>${m.slice(0, 15).map((x) => `<tr><td>${esc(x.em.slice(8, 10) + "/" + x.em.slice(5, 7))}</td><td>${esc(x.tipo)}</td><td class="n">${x.qtd > 0 ? "+" : ""}${x.qtd}</td><td class="mute">${esc(x.obs || "")}</td></tr>`).join("")}</tbody></table></div>` : "")).catch(() => {});
    SW.aoEnviar(d, async () => { const r = await api("POST", `produtos/${id}/estoque`, { tipo: $("#eT", d).value, qtd: +$("#eQ", d).value, custo_centavos: reais($("#eC", d).value), obs: $("#eO", d).value }); toast(`Estoque: ${r.estoque}.`); await produtos(); });
    d.showModal();
  }

  // ========== PROMOÇÕES ==========
  const PUB = { todos: "Todos os clientes", sumidos: "Quem sumiu (45+ dias)", aniversariantes: "Aniversariantes do mês", vip: "Melhores clientes (VIP)", novos: "Clientes novos (30 dias)" };
  async function promocoes() {
    const s = secao("promocoes"), lst = await api("GET", "promocoes"), h = hojeBR();
    s.innerHTML = `<div class="head"><div><h1>Promoções</h1><p>Crie a oferta, escolha para quem mandar e dispare no WhatsApp com mensagem pronta. Com cupom, o desconto entra sozinho no agendamento pela vitrine.</p></div>${admin() ? `<button class="btn pri" data-a2="promo">${ic("mais")}Promoção</button>` : ""}</div>
      <div class="grid g3">${lst.map((p) => { const vale = p.ativo && p.inicio <= h && p.fim >= h;
        return `<div class="card promo ${vale ? "" : "off"}"><div class="row sb"><span class="chip ${vale ? "ok" : ""}">${vale ? "valendo" : p.ativo ? (p.inicio > h ? "agendada" : "encerrada") : "desativada"}</span>${p.cupom ? `<code>${esc(p.cupom)}</code>` : ""}</div>
          <h3>${esc(p.titulo)}</h3><p class="big">${p.tipo === "percentual" ? `${p.valor}% OFF` : `${brl(p.valor)} OFF`}</p><p class="small mute">${dataBR(p.inicio)} a ${dataBR(p.fim)} · ${esc(PUB[p.publico])} · usada ${p.usos}×</p>
          <div class="row" style="margin-top:10px"><button class="btn sm pri" data-a2="promoPub" data-id="${p.id}">${ic("wa")}Enviar no WhatsApp</button>${admin() ? `<button class="btn sm" data-a2="promo" data-id="${p.id}">Editar</button>` : ""}</div></div>`; }).join("") || `<div class="empty" style="grid-column:1/-1">Nenhuma promoção ainda. Ideias: “Terça do banho 20% OFF” para encher dias fracos, “Volta pra cá” para quem sumiu, “Mês do aniversário”.</div>`}</div>`;
    S.promos = lst;
  }
  function abrirPromo(id) {
    const p = (S.promos || []).find((x) => x.id === id) || { tipo: "percentual", publico: "todos", na_vitrine: 1, ativo: 1, inicio: hojeBR(), fim: somaDias(hojeBR(), 14), servicos: "[]" };
    let sel = []; try { sel = JSON.parse(p.servicos || "[]"); } catch {}
    const d = dialogo("dlgPromo", `<h2>${id ? "Editar promoção" : "Nova promoção"}</h2>
      <label style="margin-top:12px">Título<input id="mT" maxlength="80" required value="${esc(p.titulo || "")}" placeholder="Ex.: Semana do banho"></label>
      <div class="grid g2" style="margin-top:8px"><label>Tipo<select id="mTp"><option value="percentual" ${p.tipo === "percentual" ? "selected" : ""}>% de desconto</option><option value="valor" ${p.tipo === "valor" ? "selected" : ""}>Valor em R$</option></select></label>
      <label>Desconto<input id="mV" inputmode="decimal" required value="${p.valor ? (p.tipo === "valor" ? centsTxt(p.valor) : p.valor) : ""}"></label>
      <label>Começa<input id="mI" type="date" value="${p.inicio}"></label><label>Termina<input id="mF" type="date" value="${p.fim}"></label>
      <label>Cupom (opcional)<input id="mC" maxlength="20" value="${esc(p.cupom || "")}" placeholder="Ex.: BANHO20" style="text-transform:uppercase"></label>
      <label>Para quem enviar<select id="mP">${Object.entries(PUB).map(([k, n]) => `<option value="${k}" ${p.publico === k ? "selected" : ""}>${n}</option>`).join("")}</select></label></div>
      <label style="margin-top:8px">Vale para<select id="mS" multiple size="4">${S.servicos.filter((x) => x.ativo).map((x) => `<option value="${x.id}" ${sel.includes(x.id) ? "selected" : ""}>${esc(x.nome)}</option>`).join("")}</select><span class="tiny mute">Nenhum marcado = todos os serviços. Segure Ctrl para marcar vários.</span></label>
      <label style="margin-top:8px">Detalhes (opcional)<textarea id="mD" rows="2" maxlength="300">${esc(p.descricao || "")}</textarea></label>
      <div class="row" style="margin-top:8px"><label class="chk"><input type="checkbox" id="mVi" ${p.na_vitrine ? "checked" : ""}> Mostrar na vitrine</label>${id ? `<label class="chk"><input type="checkbox" id="mA" ${p.ativo ? "checked" : ""}> Ativa</label>` : ""}</div>
      <div class="acts"><button value="x" class="btn">Cancelar</button><button value="ok" class="btn pri">Salvar</button></div>`);
    SW.aoEnviar(d, async () => {
      const tipo = $("#mTp", d).value, bruto = $("#mV", d).value;
      const corpo = { titulo: $("#mT", d).value.trim(), tipo, valor: tipo === "valor" ? reais(bruto) : parseInt(bruto, 10), inicio: $("#mI", d).value, fim: $("#mF", d).value, cupom: $("#mC", d).value.trim(), publico: $("#mP", d).value,
        servicos: [...$("#mS", d).selectedOptions].map((o) => +o.value), descricao: $("#mD", d).value.trim(), na_vitrine: $("#mVi", d).checked, ativo: id ? $("#mA", d).checked : true };
      await api(id ? "PUT" : "POST", id ? `promocoes/${id}` : "promocoes", corpo); toast("Promoção salva."); await promocoes();
    });
    d.showModal();
  }
  async function publicoPromo(id) {
    const r = await api("GET", `promocoes/${id}/publico`);
    const d = dialogo("dlgPub", `<h2>Enviar “${esc(r.promocao.titulo)}”</h2><p class="mute small">${esc(PUB[r.promocao.publico])} · ${r.contatos.length} pessoa(s) que aceitam receber promoções. Toque em cada nome para abrir o WhatsApp com a mensagem pronta (o WhatsApp não permite envio em massa automático sem a API oficial).</p>
      <div class="pub-lista">${r.contatos.map((c) => `<a class="pub" href="${c.link}" target="_blank" rel="noopener" data-feito><span><b>${esc(c.nome)}</b><small>${c.ultimo ? `última vez ${fmtD(c.ultimo.slice(0, 10))}` : "ainda não veio"}${c.gasto_centavos ? ` · gastou ${brl(c.gasto_centavos)}` : ""}</small></span>${ic("wa")}</a>`).join("") || '<div class="empty">Ninguém nesse público ainda.</div>'}</div>
      <div class="acts"><button value="x" class="btn">Fechar</button></div>`, 600);
    $$("[data-feito]", d).forEach((a) => a.addEventListener("click", () => a.classList.add("feito")));
    d.showModal();
  }

  // ========== LISTA DE ESPERA ==========
  const PER = { manha: "Manhã", tarde: "Tarde", noite: "Noite", qualquer: "Qualquer horário" };
  async function espera() {
    const s = secao("espera"), lst = await api("GET", "espera");
    s.innerHTML = `<div class="head"><div><h1>Lista de espera</h1><p>Quem quer um horário que está cheio, ou quer adiantar o que já marcou. Quando alguém cancela, o sistema sugere primeiro essas pessoas.</p></div><button class="btn pri" data-a2="esperaNova">${ic("mais")}Adicionar</button></div>
      <div class="card scroll"><table><thead><tr><th>${TERMO()[0]}</th><th>Serviço</th><th>Quando serve</th><th>Situação</th><th></th></tr></thead><tbody>
      ${lst.map((w) => `<tr class="${["aguardando", "avisado"].includes(w.status) ? "" : "off"}"><td><b>${esc(w.nome)}</b><div class="tiny mute">${fmtWhats(w.whatsapp)}</div></td><td>${esc(w.servico || "qualquer")}${w.profissional ? `<div class="tiny mute">com ${esc(w.profissional)}</div>` : ""}</td>
        <td class="small">${fmtD(w.data_de)} a ${fmtD(w.data_ate)} · ${PER[w.periodo]}${w.atual ? `<div class="chip p">quer antecipar ${fmtDH(w.atual)}</div>` : ""}</td><td><span class="chip ${w.status === "aguardando" ? "warn" : w.status === "atendido" ? "ok" : ""}">${esc(w.status)}</span></td>
        <td class="n"><a class="btn sm" href="${waLink(w.whatsapp)}" target="_blank" rel="noopener">${ic("wa")}</a>${w.status === "aguardando" ? ` <button class="btn sm" data-a2="esperaSt" data-id="${w.id}" data-st="atendido">Resolvido</button> <button class="btn sm ghost" data-a2="esperaSt" data-id="${w.id}" data-st="cancelado">Remover</button>` : ""}</td></tr>`).join("") || `<tr><td colspan="5"><div class="empty">Ninguém na espera. Quando a agenda lotar, anote aqui quem queria vir.</div></td></tr>`}
      </tbody></table></div>`;
  }
  function abrirEspera() {
    const d = dialogo("dlgEsp", `<h2>Adicionar à lista de espera</h2>
      <div class="grid g2" style="margin-top:12px"><label>Nome<input id="wN" required maxlength="80"></label><label>WhatsApp<input id="wW" required inputmode="tel" placeholder="(54) 99999-9999"></label>
      <label>Serviço<select id="wS"><option value="">Qualquer</option>${S.servicos.filter((x) => x.ativo).map((x) => `<option value="${x.id}">${esc(x.nome)}</option>`).join("")}</select></label>
      <label>Período<select id="wP">${Object.entries(PER).map(([k, n]) => `<option value="${k}" ${k === "qualquer" ? "selected" : ""}>${n}</option>`).join("")}</select></label>
      <label>De<input id="wD" type="date" value="${hojeBR()}"></label><label>Até<input id="wA" type="date" value="${somaDias(hojeBR(), 14)}"></label></div>
      <label style="margin-top:8px">Observação<input id="wO" maxlength="200"></label>
      <div class="acts"><button value="x" class="btn">Cancelar</button><button value="ok" class="btn pri">Adicionar</button></div>`);
    SW.aoEnviar(d, async () => { await api("POST", "espera", { nome: $("#wN", d).value, whatsapp: $("#wW", d).value, servico_id: $("#wS", d).value || null, periodo: $("#wP", d).value, data_de: $("#wD", d).value, data_ate: $("#wA", d).value, obs: $("#wO", d).value }); toast("Adicionado à lista de espera."); await espera(); });
    d.showModal();
  }

  // ========== INDICADORES ==========
  async function indicadores() {
    const s = secao("indicadores"), ate = s.dataset.ate || hojeBR(), de = s.dataset.de || `${ate.slice(0, 8)}01`;
    const r = await api("GET", `indicadores?de=${de}&ate=${ate}`), mx = Math.max(1, ...r.serie.map((x) => x.v));
    const [t1, tN] = TERMO();
    s.innerHTML = `<div class="head"><div><h1>Indicadores</h1><p>Faturamento, margem, recorrência e comissões no período.</p></div>
      <form class="row" id="indF"><input type="date" name="de" value="${de}" style="width:auto"><span class="mute">até</span><input type="date" name="ate" value="${ate}" style="width:auto"><button class="btn">Ver</button>
      <button type="button" class="btn ghost sm" data-per="7">7 dias</button><button type="button" class="btn ghost sm" data-per="30">30 dias</button><button type="button" class="btn ghost sm" data-per="90">90 dias</button></form></div>
      <div class="kpis">
        <div class="card kpi"><div class="l">Faturamento</div><div class="v" data-conta="${r.faturamento_centavos}" data-moeda>${brl(r.faturamento_centavos)}</div><div class="tiny mute">serviços ${brl(r.servicos_centavos)} · produtos ${brl(r.produtos_centavos)}</div></div>
        <div class="card kpi"><div class="l">Ticket médio</div><div class="v">${brl(r.ticket_medio_centavos)}</div><div class="tiny mute">${r.vendas} vendas</div></div>
        <div class="card kpi"><div class="l">Margem dos produtos</div><div class="v">${brl(r.margem_produtos_centavos)}</div><div class="tiny mute">preço − custo</div></div>
        <div class="card kpi"><div class="l">Comissões</div><div class="v">${brl(r.comissoes_centavos)}</div><div class="tiny mute">a pagar à equipe</div></div>
        <div class="card kpi"><div class="l">${tN} que voltam</div><div class="v">${pct(r.recorrencia_pct)}</div><div class="tiny mute">${r.clientes_atendidos} atendidos · ${r.clientes_novos} novos</div></div>
        <div class="card kpi"><div class="l">Faltas</div><div class="v">${pct(r.faltas_pct)}</div><div class="tiny mute">lembre o cliente na véspera</div></div>
      </div>
      <div class="card"><h2>Faturamento por dia</h2><div class="serie" role="img" aria-label="Faturamento por dia">${r.serie.map((x) => `<span title="${fmtD(x.dia)}: ${brl(x.v)}"><i style="height:${Math.round((100 * x.v) / mx)}%"></i></span>`).join("")}</div>
        <div class="row sb tiny mute"><span>${fmtD(de)}</span><span>${fmtD(ate)}</span></div></div>
      <div class="grid g3" style="margin-top:14px">
        <div class="card"><h2>Serviços mais feitos</h2>${lista(r.top_servicos, (x) => [x.nome, `${x.n}× · ${brl(x.v)}`])}</div>
        <div class="card"><h2>Produtos mais vendidos</h2>${lista(r.top_produtos, (x) => [x.nome, `${x.n} un · margem ${brl(x.margem)}`])}</div>
        <div class="card"><h2>Equipe</h2>${lista(r.profissionais, (x) => [x.nome, `${x.atendimentos} atend. · vendeu ${brl(x.vendido)} · comissão ${brl(x.comissao)}`])}</div>
      </div>`;
    const f = $("#indF", s);
    f.onsubmit = (e) => { e.preventDefault(); s.dataset.de = f.de.value; s.dataset.ate = f.ate.value; indicadores().catch((x) => toast(x.message, true)); };
    $$("[data-per]", f).forEach((b) => (b.onclick = () => { s.dataset.ate = hojeBR(); s.dataset.de = somaDias(hojeBR(), 1 - +b.dataset.per); indicadores().catch((x) => toast(x.message, true)); }));
    contar(s); if (G && !calmo) G.from($$(".serie i", s), { scaleY: 0, transformOrigin: "bottom", duration: 0.6, stagger: 0.01, ease: "power2.out" });
  }
  const lista = (arr, fn) => (arr.length ? `<ol class="rank">${arr.map((x) => { const [a, b] = fn(x); return `<li><b>${esc(a)}</b><span>${esc(b)}</span></li>`; }).join("")}</ol>` : '<p class="mute small">Sem dados no período.</p>');

  // ========== MARCA E VITRINE ==========
  const SEG = { petshop: "Pet shop", salao: "Salão e estética", barbearia: "Barbearia", clinica: "Clínica", outro: "Outro" };
  // ----- endereço e horário (Marca e vitrine) -----
  const DIAS = ["Domingo", "Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado"];
  function horariosHTML(json) {
    let h = null; try { h = typeof json === "string" ? JSON.parse(json) : json; } catch {}
    if (!Array.isArray(h) || h.length !== 7) h = DIAS.map((_, d) => (d === 0 ? { d, aberto: false } : { d, aberto: true, ini: "09:00", fim: d === 6 ? "13:00" : "18:00" }));
    return h.map((x, d) => `<div class="hor-l" data-d="${d}"><label class="chk"><input type="checkbox" data-h="aberto" ${x.aberto ? "checked" : ""}> ${DIAS[d]}</label>
      <input type="time" data-h="ini" value="${esc(x.ini || "09:00")}" ${x.aberto ? "" : "disabled"} aria-label="${DIAS[d]}: abre"><span class="mute">às</span><input type="time" data-h="fim" value="${esc(x.fim || "18:00")}" ${x.aberto ? "" : "disabled"} aria-label="${DIAS[d]}: fecha"><span class="tiny mute fechado">${x.aberto ? "" : "fechado"}</span></div>`).join("");
  }
  const lerHorarios = (f) => $$(".hor-l", f).map((l) => { const ab = $("[data-h=aberto]", l).checked; return ab ? { aberto: true, ini: $("[data-h=ini]", l).value, fim: $("[data-h=fim]", l).value } : { aberto: false }; });
  const enderecoTexto = (f) => { const v = (n) => (f.elements[n]?.value || "").trim(); return [[v("endereco"), v("numero")].filter(Boolean).join(", "), v("bairro"), v("cidade"), v("uf").toUpperCase(), v("cep")].filter(Boolean).join(" - "); };
  const linkMaps = (f) => { const t = enderecoTexto(f); return t ? "https://www.google.com/maps/search/?api=1&query=" + encodeURIComponent(t) : ""; };
  async function buscaCep(f) {
    const cep = (f.elements.cep.value || "").replace(/\D/g, ""), info = $("#cepInfo", f);
    if (cep.length !== 8) return;
    info.textContent = "buscando…";
    try {
      const r = await fetch(`https://viacep.com.br/ws/${cep}/json/`); const d = await r.json();
      if (!r.ok || d.erro) { info.textContent = "CEP não encontrado"; return; }
      if (d.logradouro) f.elements.endereco.value = d.logradouro;
      if (d.bairro) f.elements.bairro.value = d.bairro;
      if (d.localidade) f.elements.cidade.value = d.localidade;
      if (d.uf) f.elements.uf.value = d.uf;
      info.textContent = "endereço preenchido ✓"; f.elements.numero.focus();
    } catch { info.textContent = "não consegui buscar: preencha à mão"; }
  }

  async function marca() {
    const e = await perfil(), s = secao("marca"), ver = Date.now();
    s.innerHTML = `<div class="head"><div><h1>Marca e vitrine</h1><p>Como a sua loja aparece em <b>${esc(e.vitrine_url.replace("https://", ""))}</b>: logo, banner, cores, contatos e redes.</p></div><div class="row"><a class="btn" href="${e.vitrine_url}" target="_blank" rel="noopener">${ic("ext")}Abrir vitrine</a><button class="btn" data-a2="copiarVitrine">${ic("copiar")}Copiar link</button></div></div>
      <div class="grid g2">
        <div class="card"><h2>Logo e banner</h2>
          <div class="img-up"><div class="logo-box">${e.tem_logo ? `<img src="/api/admin/imagem/logo?v=${ver}" alt="Logo">` : `<span class="mute small">Sem logo</span>`}</div><div><label class="btn sm">Enviar logo<input type="file" accept="image/png,image/jpeg,image/webp" data-img="logo" hidden></label>${e.tem_logo ? ' <button class="btn sm ghost" data-a2="tirarImg" data-t="logo">Remover</button>' : ""}<p class="tiny mute">Quadrada, fundo transparente ou branco. Vai na vitrine, no site e nos documentos.</p></div></div>
          <div class="banner-box">${e.tem_banner ? `<img src="/api/admin/imagem/banner?v=${ver}" alt="Banner">` : `<span class="mute small">Sem banner: a vitrine usa a sua cor</span>`}</div>
          <div class="row"><label class="btn sm">Enviar banner<input type="file" accept="image/png,image/jpeg,image/webp" data-img="banner" hidden></label>${e.tem_banner ? '<button class="btn sm ghost" data-a2="tirarImg" data-t="banner">Remover</button>' : ""}<span class="tiny mute">Horizontal (1600×600), foto do espaço ou dos serviços.</span></div>
        </div>
        <form class="card" id="fMarca"><h2>Dados da loja</h2>
          <div class="grid g2"><label>Nome da loja<input name="nome" required maxlength="120" value="${esc(e.nome)}"></label><label>Tipo do negócio<select name="segmento">${Object.entries(SEG).map(([k, n]) => `<option value="${k}" ${e.segmento === k ? "selected" : ""}>${n}</option>`).join("")}</select></label>
          <label>Endereço da vitrine<div class="suf"><input name="slug" required maxlength="40" value="${esc(e.slug)}" pattern="[a-z0-9-]{3,40}"><span>.lldworks.com.br</span></div></label><label>Cor principal<input name="cor" type="color" value="${esc(e.cor)}"></label></div>
          <label>Sobre (aparece na vitrine)<textarea name="sobre" rows="3" maxlength="800">${esc(e.sobre || "")}</textarea></label>
          <h3 style="margin-top:12px">Contato e endereço</h3>
          <div class="grid g2"><label>WhatsApp<input name="whatsapp" inputmode="tel" value="${e.whatsapp ? fmtWhats(e.whatsapp) : ""}"></label>
          <label>CEP <span class="tiny mute" id="cepInfo">preenche o endereço sozinho</span><input name="cep" inputmode="numeric" maxlength="9" placeholder="00000-000" value="${esc(e.cep ? String(e.cep).replace(/^(\d{5})(\d{3})$/, "$1-$2") : "")}"></label>
          <label>Rua / avenida<input name="endereco" maxlength="200" value="${esc(e.endereco || "")}"></label><label>Número<input name="numero" maxlength="20" value="${esc(e.numero || "")}"></label>
          <label>Complemento<input name="complemento" maxlength="80" placeholder="Sala, loja, bloco…" value="${esc(e.complemento || "")}"></label><label>Bairro<input name="bairro" maxlength="80" value="${esc(e.bairro || "")}"></label>
          <label>Cidade<input name="cidade" maxlength="80" value="${esc(e.cidade || "")}"></label><label>UF<input name="uf" maxlength="2" value="${esc(e.uf || "")}" style="text-transform:uppercase"></label></div>
          <div class="mapa-box"><div><b>Google Maps</b><p class="tiny mute" style="margin:2px 0 0">O botão "Como chegar" da vitrine usa este link. Se deixar em branco, ele é montado sozinho pelo endereço.</p></div>
            <div class="row"><input name="maps_url" placeholder="Gerado pelo endereço" value="${esc(e.maps_url || "")}" style="flex:1;min-width:200px"><button type="button" class="btn sm" data-a2="gerarMaps">Gerar pelo endereço</button><a class="btn sm" id="verMapa" target="_blank" rel="noopener">${ic("ext")}Ver no mapa</a></div></div>
          <div class="grid g2"><label>Instagram<input name="instagram" placeholder="@sualoja" value="${esc(e.instagram || "")}"></label><label>Facebook<input name="facebook" placeholder="facebook.com/sualoja" value="${esc(e.facebook || "")}"></label></div>
          <h3 style="margin-top:12px">Horário de funcionamento</h3>
          <p class="tiny mute" style="margin:0 0 6px">Aparece na vitrine. Os horários livres para agendar continuam vindo da escala de cada profissional.</p>
          <div class="horarios" id="hor">${horariosHTML(e.horarios)}</div>
          <button type="button" class="btn sm ghost" data-a2="copiarSegunda" style="margin-top:6px">Repetir o horário de segunda nos dias úteis</button>
          <h3 style="margin-top:12px">Regras</h3>
          <div class="grid g2"><label>Comissão padrão da equipe (%)<input name="comissao_padrao" type="number" min="0" max="100" value="${e.comissao_padrao || 0}"></label></div>
          <label>Política de cancelamento (aparece no agendamento)<textarea name="politica" rows="2" maxlength="600" placeholder="Ex.: cancele com 2 horas de antecedência.">${esc(e.politica || "")}</textarea></label>
          <p class="err" role="alert"></p><div class="acts"><button class="btn pri">Salvar</button></div></form>
        ${e.segmento === "petshop" ? `<form class="card" id="fBusca"><h2>Buscar e entregar (táxi dog)</h2>
          <p class="small mute">Ligado, o cliente escolhe na vitrine "Buscar e entregar" e é obrigado a informar o endereço completo. A taxa soma ao valor do agendamento e o endereço aparece no pedido, com o link do Google Maps para mandar ao motorista.</p>
          <label class="row" style="gap:8px;align-items:center"><input type="checkbox" name="ativa" style="width:auto"> <b>Oferecer busca e entrega na vitrine</b></label>
          <div class="grid g2"><label>Valor da busca (R$)<input name="valor" inputmode="decimal" placeholder="Ex.: 15,00"></label><label>Aviso para o cliente <span class="tiny mute">(opcional)</span><input name="obs" maxlength="200" placeholder="Ex.: atendemos até 5 km da loja"></label></div>
          <p class="err" role="alert"></p><div class="acts"><button class="btn pri">Salvar busca e entrega</button></div></form>` : ""}
      </div>`;
    $$("[data-img]", s).forEach((inp) => (inp.onchange = async () => {
      const f = inp.files[0]; if (!f) return; const t = inp.dataset.img;
      try { const data = await reduzir(f, t === "logo" ? 512 : 1600, t === "logo" ? 512 : 700, t === "logo" ? 250e3 : 650e3); await api("PUT", `imagem/${t}`, { data }); toast(t === "logo" ? "Logo atualizada." : "Banner atualizado."); await marca(); }
      catch (x) { toast(x.message, true); }
    }));
    const f = $("#fMarca", s);
    const atualizaMapa = () => { const u = f.elements.maps_url.value.trim() || linkMaps(f); const a = $("#verMapa", f); a.href = u || "#"; a.toggleAttribute("hidden", !u); };
    f.elements.cep.oninput = (ev) => { let v = ev.target.value.replace(/\D/g, "").slice(0, 8); ev.target.value = v.length > 5 ? v.slice(0, 5) + "-" + v.slice(5) : v; if (v.length === 8) buscaCep(f).then(atualizaMapa); };
    ["endereco", "numero", "bairro", "cidade", "uf", "maps_url"].forEach((n) => f.elements[n].addEventListener("input", atualizaMapa));
    $("#hor", f).addEventListener("change", (ev) => { const l = ev.target.closest(".hor-l"); if (l && ev.target.dataset.h === "aberto") { const ab = ev.target.checked; $$("input[type=time]", l).forEach((i) => (i.disabled = !ab)); $(".fechado", l).textContent = ab ? "" : "fechado"; } });
    atualizaMapa();
    const fb = $("#fBusca", s);
    if (fb) {
      try { const b = await api("GET", "v3/busca"); fb.elements.ativa.checked = !!b.ativa; fb.elements.valor.value = b.centavos ? (b.centavos / 100).toFixed(2).replace(".", ",") : ""; fb.elements.obs.value = b.obs || ""; } catch {}
      if (!admin()) $$("input,button", fb).forEach((i) => (i.disabled = true));
      fb.onsubmit = async (ev) => {
        ev.preventDefault(); const er = $(".err", fb); er.textContent = "";
        const v = String(fb.elements.valor.value || "0").replace(/\./g, "").replace(",", "."), c = Math.round((+v || 0) * 100);
        if (c < 0 || c > 100000) { er.textContent = "Valor inválido."; return; }
        try { await api("PUT", "v3/busca", { ativa: fb.elements.ativa.checked, centavos: c, obs: fb.elements.obs.value.trim() }); toast(fb.elements.ativa.checked ? "Busca e entrega ligada na vitrine." : "Busca e entrega desligada."); } catch (x) { er.textContent = x.message; }
      };
    }
    if (!admin()) $$("input,select,textarea,button", f).forEach((i) => (i.disabled = true));
    f.onsubmit = async (ev) => {
      ev.preventDefault(); const er = $(".err", f); er.textContent = "";
      const d = Object.fromEntries(new FormData(f)); d.comissao_padrao = +d.comissao_padrao || 0;
      ["aberto", "ini", "fim"].forEach((k) => delete d[k]);
      d.horarios = lerHorarios(f); d.cep = (d.cep || "").replace(/\D/g, ""); d.uf = (d.uf || "").toUpperCase();
      if (!d.maps_url) d.maps_url = linkMaps(f);
      try { await api("PUT", "perfil", d); S.emp = await api("GET", "empresa"); $("#empNome").textContent = S.emp.nome; toast("Marca salva."); await marca(); } catch (x) { er.textContent = x.message; }
    };
  }

  // ========== INTEGRAÇÕES ==========
  async function integracoes() {
    const e = await perfil(), s = secao("integracoes"), mp = await api("GET", "mercadopago"), pl = e.plano;
    const app = (nome, txt, url, incluso, icone) => `<div class="card app"><div class="row">${ic(icone)}<h3>${nome}</h3>${incluso ? '<span class="chip ok">incluído no seu plano</span>' : '<span class="chip">plano Pro ou Premium</span>'}</div><p class="small mute">${txt}</p>${incluso ? `<a class="btn sm pri" href="${url}" target="_blank" rel="noopener">Abrir ${ic("ext")}</a> <span class="tiny mute">entra já conectado</span>` : `<a class="btn sm" href="/assinar">Ver planos</a>`}</div>`;
    s.innerHTML = `<div class="head"><div><h1>WhatsApp e pagamentos</h1><p>Os outros apps do seu plano entram com o mesmo e-mail e senha.</p></div></div>
      <div class="grid g3">
        ${app("Agente de WhatsApp", "Atende seus clientes 24h com IA e já entra com a sua marca, logo, horários, serviços, produtos, promoções e pagamento daqui — é só conectar o WhatsApp. O que ele agenda cai direto na sua agenda.", "/ir/agentworks", pl.pagamento_online, "wa")}
        ${app("Link na bio", "Uma página com todos os seus links (vitrine, WhatsApp, Instagram, mapa) para colocar na bio do Instagram.", "/ir/linkworks", pl.pagamento_online, "integracoes")}
        ${app("Instagram", "Calendário de posts, legendas com IA e respostas automáticas em comentários e directs.", "/ir/socialworks", pl.site, "marca")}
      </div>
      <div class="card" style="margin-top:14px"><div class="row sb"><h2>Receber online com o seu Mercado Pago</h2>${mp.conectado ? `<span class="chip ok">conectado · ${esc(mp.conta || "")}</span>` : ""}</div>
        ${!mp.disponivel ? `<p class="mute">Pagamento online (Pix e cartão pelo link, sinal no agendamento) faz parte dos planos Pro e Premium. <a href="/assinar">Ver planos</a></p>` : mp.conectado ? `
          <p class="small">O dinheiro cai direto na sua conta Mercado Pago. Use o botão <b>Link de pagamento</b> na comanda ou cobre um sinal no agendamento pela vitrine.</p>
          <form id="fSinal" style="margin-top:10px"><p class="small" style="margin:0 0 6px"><b>Quanto o cliente paga online ao agendar pela vitrine</b></p>
          <div class="row" style="gap:6px;flex-wrap:wrap">${[[0, "Nada (paga no local)"], [30, "Sinal 30%"], [50, "Sinal 50%"], [100, "Tudo antecipado"]].map(([v, t]) => `<button type="button" class="btn sm ${+mp.sinal_pct === v ? "pri" : ""}" data-sinal="${v}">${t}</button>`).join("")}<label class="small row" style="gap:6px">outro %<input name="sinal_pct" type="number" min="0" max="100" value="${mp.sinal_pct}" style="width:80px"></label><button class="btn sm">Salvar</button></div>
          <p class="tiny mute" style="margin:8px 0 0">Com o Mercado Pago conectado, a vitrine mostra Pix (QR Code e copia e cola) e cartão logo após o agendamento, e o sistema marca sozinho quem pagou. O que faltar aparece em "A receber" na agenda e você recebe na comanda. Sem Mercado Pago conectado, tudo é recebido no local e marcado à mão na comanda.</p></form>
          ${admin() ? '<button class="btn sm bad" data-a2="mpDesconectar" style="margin-top:12px">Desconectar</button>' : ""}` : `
          <ol class="tuto"><li>Tenha uma conta no <b>Mercado Pago</b> (pode ser a mesma do celular) com CPF ou CNPJ da loja.</li>
            <li>No computador, entre em <b>mercadopago.com.br/developers/panel/app</b> e clique em <b>Criar aplicação</b>: nome “Minha loja”, tipo <b>Pagamentos online</b>, produto <b>Checkout Pro</b>.</li>
            <li>Abra a aplicação → <b>Credenciais de produção</b> → copie o <b>Access Token</b> (começa com <code>APP_USR-</code>).</li>
            <li>Cole abaixo. A chave fica guardada criptografada e só é usada para criar os seus links de pagamento.</li></ol>
          <form class="row" id="fMp" style="margin-top:10px"><input name="access_token" placeholder="APP_USR-…" autocomplete="off" style="flex:1;min-width:260px" required><button class="btn pri">Conectar</button></form>`}
        <p class="err" id="mpErr" role="alert"></p></div>
      <div class="card" style="margin-top:14px"><div class="row sb"><h2>Chave Pix da loja</h2><span class="chip" id="pixChip">…</span></div>
        <p class="small">O agente de WhatsApp usa esta chave quando o Mercado Pago não está conectado: manda a chave para o cliente pagar e pede o comprovante. ${mp.conectado ? "Com o Mercado Pago conectado, ele manda o Pix gerado na sua conta (copia e cola) e confirma sozinho quando cai." : ""}</p>
        <form id="fPix" class="row" style="gap:8px;flex-wrap:wrap;margin-top:8px">
          <label class="small">Tipo<select name="tipo"><option value="">Escolha</option><option value="cpf">CPF</option><option value="cnpj">CNPJ</option><option value="email">E-mail</option><option value="telefone">Celular</option><option value="aleatoria">Chave aleatória</option></select></label>
          <label class="small" style="flex:1;min-width:200px">Chave<input name="chave" autocomplete="off" placeholder="Ex.: 54999990000"></label>
          <label class="small" style="flex:1;min-width:200px">Nome do titular<input name="titular" autocomplete="off" placeholder="Como aparece no app do banco"></label>
          ${admin() ? '<button class="btn sm pri">Salvar chave</button> <button type="button" class="btn sm" id="pixLimpar">Remover</button>' : ""}
        </form><p class="err" id="pixErr" role="alert"></p></div>`;
    const fp = $("#fPix", s);
    try {
      const px = await api("GET", "v4/pix");
      fp.tipo.value = px.tipo || ""; fp.chave.value = px.chave || ""; fp.titular.value = px.titular || "";
      $("#pixChip", s).textContent = px.chave ? "cadastrada" : "não cadastrada"; $("#pixChip", s).classList.toggle("ok", !!px.chave);
    } catch (x) { $("#pixChip", s).textContent = "indisponível"; }
    if (!admin()) [...fp.elements].forEach((x) => (x.disabled = true));
    fp.onsubmit = async (ev) => { ev.preventDefault(); try { const r = await api("PUT", "v4/pix", { tipo: fp.tipo.value, chave: fp.chave.value.trim(), titular: fp.titular.value.trim() }); fp.chave.value = r.chave; toast("Chave Pix salva. O agente de WhatsApp já usa."); $("#pixErr", s).textContent = ""; $("#pixChip", s).textContent = "cadastrada"; $("#pixChip", s).classList.add("ok"); } catch (x) { $("#pixErr", s).textContent = x.message; } };
    const lp = $("#pixLimpar", s); if (lp) lp.onclick = async () => { if (!confirm("Remover a chave Pix da loja?")) return; try { await api("PUT", "v4/pix", { chave: "" }); await integracoes(); } catch (x) { $("#pixErr", s).textContent = x.message; } };
    const fm = $("#fMp", s); if (fm) fm.onsubmit = async (ev) => { ev.preventDefault(); try { const r = await api("PUT", "mercadopago", { access_token: fm.access_token.value.trim() }); toast(`Mercado Pago conectado: ${r.conta}.`); await integracoes(); } catch (x) { $("#mpErr", s).textContent = x.message; } };
    const fs = $("#fSinal", s); if (fs) {
      const salvaSinal = async (v) => { try { await api("PUT", "perfil", { sinal_pct: Math.max(0, Math.min(100, +v || 0)) }); toast(+v ? `Pagamento online de ${+v}% ao agendar.` : "Sem pagamento online: o cliente paga no local."); await integracoes(); } catch (x) { $("#mpErr", s).textContent = x.message; } };
      fs.onsubmit = (ev) => { ev.preventDefault(); salvaSinal(fs.sinal_pct.value); };
      $$("[data-sinal]", fs).forEach((b) => (b.onclick = () => salvaSinal(b.dataset.sinal)));
    }
  }

  // ========== SITE ==========
  async function site() {
    const s = secao("site"), r = await api("GET", "site"), g = await api("GET", "guia");
    const st = r.site?.status, ST2 = { solicitado: "Pedido recebido", em_criacao: "Em criação", publicado: "No ar", cancelado: "Cancelado" };
    const prontos = g.passos.filter((p) => ["marca", "endereco", "servicos"].includes(p.id));
    s.innerHTML = `<div class="head"><div><h1>Seu site profissional</h1><p>Um site com a sua marca, integrado à vitrine, ao WhatsApp, ao Instagram e ao Google Maps, feito pela equipe LLD Works.</p></div></div>
      ${!r.disponivel ? `<div class="card"><p>O site profissional faz parte do plano <b>Premium</b>.</p><a class="btn pri" href="/assinar" style="margin-top:10px">Conhecer o Premium</a></div>` :
      st && st !== "cancelado" ? `<div class="card site-st"><div class="row sb"><h2>${ST2[st]}</h2><span class="chip ${st === "publicado" ? "ok" : "warn"}">${ST2[st]}</span></div>
        ${st === "publicado" ? `<p>Seu site está no ar: <a href="${esc(r.site.url)}" target="_blank" rel="noopener"><b>${esc(r.site.url)}</b></a></p>` : `<p>A equipe LLD Works está criando o seu site com a logo, as cores e os serviços cadastrados. Prazo: <b>${dataBR(r.site.prazo)}</b> (5 dias úteis). Mudou algo na marca ou nos serviços? Atualize aqui no app: o site usa o que estiver cadastrado.</p>`}
        <ol class="linha"><li class="ok">Pedido</li><li class="${["em_criacao", "publicado"].includes(st) ? "ok" : ""}">Criação</li><li class="${st === "publicado" ? "ok" : ""}">No ar</li></ol></div>` :
      `<div class="card"><h2>Antes de pedir</h2><p class="small mute">O site é criado a partir do que está cadastrado. Complete:</p>
        <ul class="passos2">${prontos.map((p) => `<li class="${p.feito ? "ok" : ""}">${p.feito ? ic("check") : '<i class="pt"></i>'}<span>${esc(p.titulo)}</span>${p.feito ? "" : `<button class="btn sm" data-ir="${p.ir.split("/")[0]}">Fazer agora</button>`}</li>`).join("")}</ul>
        <form id="fSite" style="margin-top:12px"><label>Domínio que você quer (opcional)<input name="dominio" placeholder="Ex.: petfeliz.com.br (você registra no registro.br)"></label>
          <label>Pedidos para o site (opcional)<textarea name="observacoes" rows="3" maxlength="1000" placeholder="Fotos que gostaria, textos, cores, referências…"></textarea></label>
          <p class="err" role="alert"></p><button class="btn pri" ${prontos.every((p) => p.feito) ? "" : "disabled"}>Pedir meu site</button></form></div>`}`;
    const f = $("#fSite", s); if (f) f.onsubmit = async (ev) => { ev.preventDefault(); try { await api("POST", "site", Object.fromEntries(new FormData(f))); toast("Pedido enviado! Prazo de 5 dias úteis."); await site(); } catch (x) { $(".err", f).textContent = x.message; } };
    anima($$(".card", s));
  }

  // ========== CLIENTES (CRM): métricas, filtros e fichas ==========
  function melhoraClientes() {
    const sel = $("#cliFiltro"), busca = $("#cliBusca");
    const nsel = sel.cloneNode(false), nbusca = busca.cloneNode(true);
    nsel.innerHTML = `<option value="">Todos</option><option value="sumidos">Sumidos (45+ dias)</option><option value="vip">VIP (quem mais gasta)</option><option value="recorrentes">Recorrentes (3+ visitas)</option><option value="aniversariantes">Aniversariantes do mês</option><option value="novos">Novos (30 dias)</option>`;
    sel.replaceWith(nsel); busca.replaceWith(nbusca);
    const tabela = $("#cliLista").closest("table");
    $("thead", tabela).innerHTML = `<tr><th>Nome</th><th class="soPet">Pets</th><th>Contato</th><th class="n">Visitas</th><th class="n">Gastou</th><th>Última vez</th><th>Próximo</th><th></th></tr>`;
    let t; nbusca.oninput = () => { clearTimeout(t); t = setTimeout(() => clientesV2().catch((x) => toast(x.message, true)), 250); }; nsel.onchange = () => clientesV2().catch((x) => toast(x.message, true));
  }
  async function clientesV2() {
    const q = $("#cliBusca").value.trim(), f = $("#cliFiltro").value;
    const lst = await api("GET", `clientes?q=${encodeURIComponent(q)}${f ? "&filtro=" + f : ""}${f === "vip" ? "" : "&ordem=" + (f ? "" : "ultima")}`);
    $("#cliDica").hidden = f !== "sumidos";
    const msg = (c) => f === "aniversariantes" ? `Oi, ${c.nome.split(" ")[0]}! Feliz aniversário! 🎉 Aqui no ${S.emp.nome} preparamos um mimo para você neste mês. Agende: ${SW.linkVitrine()}` : `Oi, ${c.nome.split(" ")[0]}! Faz um tempinho que não te vemos aqui no ${S.emp.nome}. Que tal agendar? ${SW.linkVitrine()}`;
    $("#cliLista").innerHTML = lst.map((c) => `<tr><td><b>${esc(c.nome)}</b>${c.visitas >= 5 ? ' <span class="chip ok">fiel</span>' : c.visitas === 0 ? ' <span class="chip">novo</span>' : ""}${c.faltas ? ` <span class="chip warn">${c.faltas} falta(s)</span>` : ""}${c.nascimento ? `<div class="tiny mute">${ic("bolo")} ${c.nascimento.slice(-5).split("-").reverse().join("/")}</div>` : ""}</td>
      <td class="soPet small">${esc(c.pets || "—")}</td><td class="small">${fmtWhats(c.whatsapp)}${c.email ? `<div class="tiny mute">${esc(c.email)}</div>` : ""}</td><td class="n">${c.visitas}</td><td class="n">${brl(c.gasto)}${c.ticket_centavos ? `<div class="tiny mute">ticket ${brl(c.ticket_centavos)}</div>` : ""}</td>
      <td class="small">${c.ultima_vez ? `${fmtD(c.ultima_vez.slice(0, 10))}<div class="tiny mute">há ${c.dias_sem_vir} dia(s)</div>` : "—"}</td><td class="small">${c.proximo ? fmtDH(c.proximo) : "—"}</td>
      <td class="n"><a class="btn sm ${f === "sumidos" || f === "aniversariantes" ? "pri" : ""}" href="${waLink(c.whatsapp, f === "sumidos" || f === "aniversariantes" ? msg(c) : "")}" target="_blank" rel="noopener" aria-label="WhatsApp">${ic("wa")}</a> <button class="btn sm" data-a2="fichas" data-id="${c.id}" data-nome="${esc(c.nome)}">${ic("ficha")}</button> <button class="btn sm" data-act="cli" data-id="${c.id}">Abrir</button></td></tr>`).join("")
      || `<tr><td colspan="8"><div class="empty">${q || f ? "Ninguém encontrado com esse filtro." : `Nenhum ${TERMO()[0].toLowerCase()} ainda. Eles entram aqui ao agendar ou comprar.`}</div></td></tr>`;
  }
  const TIPOS_FICHA = () => S.emp.segmento === "petshop" ? [["vacina", "Vacina / vermífugo"], ["observacao", "Observação"], ["evolucao", "Atendimento"]] : S.emp.segmento === "clinica" ? [["anamnese", "Anamnese"], ["evolucao", "Evolução da sessão"], ["observacao", "Observação"]] : [["observacao", "Observação"], ["anamnese", "Ficha / preferências"], ["evolucao", "Atendimento"]];
  const ANAMNESE = { clinica: ["Queixa principal", "Alergias", "Medicamentos em uso", "Doenças / cirurgias", "Gestante?", "Objetivo do tratamento"], salao: ["Alergias", "Química recente", "Tipo de cabelo/pele", "Preferências"], barbearia: ["Preferências de corte", "Alergias", "Observações"], petshop: ["Alergias", "Comportamento", "Restrições"], outro: ["Observações"] };
  async function fichas(contato, nome) {
    const lst = await api("GET", `fichas?contato=${contato}`), pets = S.emp.segmento === "petshop" ? (await api("GET", `pets?contato=${contato}`)) : [];
    const tipos = TIPOS_FICHA(), perguntas = ANAMNESE[S.emp.segmento] || ANAMNESE.outro;
    const d = dialogo("dlgFicha", `<h2>Fichas · ${esc(nome)}</h2>
      <div class="fichas">${lst.map((f) => `<div class="ficha"><div class="row sb"><b>${esc(f.titulo)}</b><span class="tiny mute">${fmtD(f.data)}/${f.data.slice(2, 4)}${f.pet ? ` · ${esc(f.pet)}` : ""}</span></div><span class="chip">${esc((tipos.find((t) => t[0] === f.tipo) || [, f.tipo])[1])}</span>${f.proxima ? ` <span class="chip ${f.proxima <= hojeBR() ? "warn" : "p"}">próxima: ${fmtD(f.proxima)}</span>` : ""}
        ${f.texto ? `<p class="small" style="white-space:pre-wrap">${esc(f.texto)}</p>` : ""}${f.dados ? `<dl class="kv small">${Object.entries(JSON.parse(f.dados)).map(([k, v]) => `<dt>${esc(k)}</dt><dd>${esc(v)}</dd>`).join("")}</dl>` : ""}</div>`).join("") || '<p class="mute small">Nenhuma ficha ainda.</p>'}</div>
      <h3 style="margin-top:14px">Nova ficha</h3>
      <div class="grid g2"><label>Tipo<select id="fT">${tipos.map(([k, n]) => `<option value="${k}">${n}</option>`).join("")}</select></label><label>Título<input id="fTi" maxlength="120" placeholder="Ex.: V10, Limpeza de pele, Corte degradê"></label>
      ${pets.length ? `<label>Pet<select id="fP"><option value="">—</option>${pets.map((p) => `<option value="${p.id}">${esc(p.nome)}</option>`).join("")}</select></label>` : ""}
      <label>Data<input id="fD" type="date" value="${hojeBR()}"></label><label>Próxima dose / retorno<input id="fPr" type="date"></label></div>
      <div id="fAn" class="grid g2" hidden>${perguntas.map((q, i) => `<label>${esc(q)}<input data-q="${esc(q)}"></label>`).join("")}</div>
      <label style="margin-top:8px">Anotações<textarea id="fTx" rows="3" maxlength="4000"></textarea></label>
      <div class="acts"><button value="x" class="btn">Fechar</button><button value="ok" class="btn pri">Salvar ficha</button></div>`, 640);
    const tp = $("#fT", d), an = $("#fAn", d); tp.onchange = () => { an.hidden = tp.value !== "anamnese"; if (!$("#fTi", d).value && tp.value === "anamnese") $("#fTi", d).value = "Anamnese"; }; tp.onchange();
    SW.aoEnviar(d, async () => {
      const dados = tp.value === "anamnese" ? Object.fromEntries($$("[data-q]", d).filter((i) => i.value.trim()).map((i) => [i.dataset.q, i.value.trim()])) : null;
      await api("POST", "fichas", { contato_id: contato, tipo: tp.value, titulo: $("#fTi", d).value.trim() || (tipos.find((t) => t[0] === tp.value) || [, ""])[1], data: $("#fD", d).value, proxima: $("#fPr", d).value || null, texto: $("#fTx", d).value, pet_id: $("#fP", d)?.value || null, dados });
      toast("Ficha salva."); await fichas(contato, nome); return false;
    });
    d.showModal();
  }

  // ---------- ações ----------
  document.addEventListener("click", async (e) => {
    const ir = e.target.closest("[data-ir]"); if (ir) { aba(ir.dataset.ir); return; }
    const oc = e.target.closest(".oc[data-dia]"); if (oc) { S.dia = oc.dataset.dia; aba("agenda"); return; }
    const b = e.target.closest("[data-a2], [data-act=abrirComanda]"); if (!b) return;
    const a = b.dataset.a2 || b.dataset.act, id = +b.dataset.id;
    try {
      if (a === "novaVenda") await abrirVenda(null);
      else if (a === "venda") await abrirVenda(id);
      else if (a === "abrirComanda") { const ev = SW.evAtual(); if (!ev) return; $("#dlgEv")?.close(); vendaAtual = await api("POST", `agendamentos/${ev.id}/comanda`); await carregaCatalogo(); desenhaVenda(); }
      else if (a === "produto") abrirProduto(id || null);
      else if (a === "estoque") abrirEstoque(id);
      else if (a === "promo") abrirPromo(id || null);
      else if (a === "promoPub") await publicoPromo(id);
      else if (a === "esperaNova") abrirEspera();
      else if (a === "esperaSt") { await api("PUT", `espera/${id}`, { status: b.dataset.st }); await espera(); }
      else if (a === "fichas") await fichas(id, b.dataset.nome);
      else if (a === "gerarMaps") { const f = $("#fMarca"); const u = linkMaps(f); if (!u) return toast("Preencha o endereço primeiro.", true); f.elements.maps_url.value = u; f.elements.maps_url.dispatchEvent(new Event("input")); toast("Link do Maps gerado. Clique em Salvar."); }
      else if (a === "copiarSegunda") { const ls = $$("#hor .hor-l"), seg = ls[1]; const ab = $("[data-h=aberto]", seg).checked, i = $("[data-h=ini]", seg).value, fm = $("[data-h=fim]", seg).value; ls.slice(2, 6).forEach((l) => { $("[data-h=aberto]", l).checked = ab; $("[data-h=ini]", l).value = i; $("[data-h=fim]", l).value = fm; $$("input[type=time]", l).forEach((x) => (x.disabled = !ab)); $(".fechado", l).textContent = ab ? "" : "fechado"; }); toast("Horário de segunda copiado para terça a sexta."); }
      else if (a === "copiarVitrine") { await SW.copiar(SW.linkVitrine(), "Link da vitrine copiado."); }
      else if (a === "dispensarGuia") { await api("PUT", "perfil", { guia_dispensado: true }); await inicio(); }
      else if (a === "tirarImg") { if (!confirm("Remover a imagem?")) return; await api("DELETE", `imagem/${b.dataset.t}`); await marca(); }
      else if (a === "mpDesconectar") { if (!confirm("Desconectar o Mercado Pago? Os links já enviados deixam de confirmar sozinhos.")) return; await api("DELETE", "mercadopago"); await integracoes(); }
      else if (a === "sumidos" || a === "aniversariantes") { aba("clientes"); $("#cliFiltro").value = a; await clientesV2(); }
    } catch (x) { toast(x.message, true); }
  });

  // ---------- registra ----------
  montaNav();
  Object.assign(CARREGA, { inicio, caixa, produtos, promocoes, espera, indicadores, marca, integracoes, site, clientes: clientesV2 });
  ["inicio", "caixa", "produtos", "promocoes", "espera", "indicadores", "marca", "integracoes", "site"].forEach((v) => secao(v));
  melhoraClientes();
  perfil().then((p) => { if (!p.plano.site) $('.nav button[data-v="site"]')?.classList.add("bloq"); }).catch(() => {});
  const cfg = $('.nav button[data-v="config"] span'); if (cfg) cfg.textContent = "Ajustes da agenda";
})();
