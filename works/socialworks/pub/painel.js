// SocialWorks — painel. Fala só com /api/admin/* (o roteador confere a sessão e diz quem é o cliente).
"use strict";
(() => {
  const $ = (s, r = document) => r.querySelector(s), $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const FUSO = "America/Sao_Paulo";
  const hojeBR = () => new Intl.DateTimeFormat("sv-SE", { timeZone: FUSO }).format(new Date());
  const agoraBR = () => new Intl.DateTimeFormat("sv-SE", { timeZone: FUSO, year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", hourCycle: "h23" }).format(new Date()).replace(" ", "T");
  const somaDias = (d, n) => { const x = new Date(d + "T12:00:00Z"); x.setUTCDate(x.getUTCDate() + n); return x.toISOString().slice(0, 10); };
  const dataBR = (d) => (d ? `${d.slice(8, 10)}/${d.slice(5, 7)}/${d.slice(0, 4)}` : "");
  const semana = (d) => new Intl.DateTimeFormat("pt-BR", { weekday: "short", timeZone: "UTC" }).format(new Date(d + "T12:00:00Z")).replace(".", "");
  const quandoTxt = (q) => (q ? `${semana(q.slice(0, 10))}, ${q.slice(8, 10)}/${q.slice(5, 7)} · ${q.slice(11, 16)}` : "Sem data");
  const curto = (s) => { if (!s) return ""; const h = hojeBR(), d = s.slice(0, 10); return d === h ? s.slice(11, 16) : `${d.slice(8, 10)}/${d.slice(5, 7)}`; };
  const MESES = ["janeiro", "fevereiro", "março", "abril", "maio", "junho", "julho", "agosto", "setembro", "outubro", "novembro", "dezembro"];
  const ST = { ideia: "Ideia", rascunho: "Rascunho", aprovado: "Aprovado", agendado: "Agendado", publicado: "Publicado", erro: "Com erro" };
  const TIPO = { feed: "Feed", carrossel: "Carrossel", reels: "Reels", story: "Story" };
  const ICO = { feed: "▣", carrossel: "❐", reels: "▶", story: "○" };
  const TOM = { proximo: "Próximo", profissional: "Profissional", divertido: "Divertido", inspirador: "Inspirador", direto: "Direto" };
  const MST = { nova: ["Nova", "p"], respondida: ["Respondida pela equipe", "ok"], automatica: ["Respondida pela automação", "ok"], arquivada: ["Arquivada", ""] };
  const S = { st: null, papel: "admin", contas: [], mes: hojeBR().slice(0, 7), filtro: "", cx: "", msgs: [], msg: null, autos: [], post: null, ideias: [], ed: null };
  const admin = () => S.papel === "admin";
  const ativas = () => S.contas.filter((c) => c.ativo);
  const contaPor = (id) => S.contas.find((c) => c.id === Number(id));
  const linhas = (t) => String(t || "").split(/\s*\n\s*/).map((x) => x.trim()).filter(Boolean);
  const video = (u) => /\.(mp4|mov)(\?|$)/i.test(u || "");
  const fundo = (raiz = document) => $$("[data-img]", raiz).forEach((el) => { el.style.backgroundImage = `url(${JSON.stringify(el.dataset.img)})`; });
  let tt;
  const toast = (m, erro = false) => { const t = $("#toast"); t.textContent = m; t.classList.toggle("err", erro); t.classList.add("on"); clearTimeout(tt); tt = setTimeout(() => t.classList.remove("on"), 3400); };
  async function api(metodo, caminho, corpo) {
    const r = await fetch("/api/admin/" + caminho, { method: metodo, headers: corpo ? { "Content-Type": "application/json" } : {}, body: corpo ? JSON.stringify(corpo) : undefined, credentials: "same-origin" });
    if (r.status === 401) { location.href = "/entrar"; throw new Error("Sessão expirada. Entre de novo."); }
    let d = null; try { d = await r.json(); } catch {}
    if (!r.ok) throw new Error(d?.erro || "Não foi possível concluir. Tente de novo.");
    return d;
  }
  const falhou = (e) => toast(e.message, true);
  const ocupado = async (btn, fn) => { const t = btn?.textContent; if (btn) { btn.disabled = true; btn.textContent = "Aguarde…"; } try { return await fn(); } finally { if (btn) { btn.disabled = false; btn.textContent = t; } } };
  const opcoes = (sel, todos) => { const v = sel.value; sel.innerHTML = (todos ? '<option value="">Todos os perfis</option>' : "") + ativas().map((c) => `<option value="${c.id}">${esc(c.nome)}${c.usuario ? ` · @${esc(c.usuario)}` : ""}</option>`).join(""); if ([...sel.options].some((o) => o.value === v)) sel.value = v; sel.closest("div,.barra") && (sel.hidden = !todos ? false : ativas().length < 2); };

  // ---------- abas ----------
  const CARGA = { calendario: () => calendario(), posts: () => posts(), ideias: () => ideias(), automacoes: () => automacoes(), caixa: () => caixa(), relatorios: () => relatorio(), config: () => perfis(), plano: () => planoTela() };
  function aba(v) {
    if (!CARGA[v]) v = "calendario";
    $$(".nav button").forEach((b) => b.setAttribute("aria-selected", String(b.dataset.v === v)));
    $$(".view").forEach((s) => s.classList.toggle("on", s.id === "v-" + v));
    history.replaceState(null, "", "#" + v);
    CARGA[v]().catch(falhou);
  }
  $(".nav").addEventListener("click", (e) => { const b = e.target.closest("[data-v]"); if (b) aba(b.dataset.v); });
  const abaAtual = () => $(".nav [aria-selected=true]")?.dataset.v;
  const recarrega = () => CARGA[abaAtual()]?.().catch(falhou);

  // ---------- início ----------
  async function carregaContas() {
    S.contas = await api("GET", "contas");
    for (const s of ["#calConta", "#pConta"]) opcoes($(s), true);
    for (const s of ["#iConta", "#pConta2", "#uConta", "#sConta"]) if ($(s)) opcoes($(s), false);
    const n = ativas().filter((c) => c.conectado).length, st = $("#stIg");
    st.hidden = false; st.className = "chip " + (n ? "ok" : "warn");
    st.textContent = n ? `Instagram conectado${ativas().length > 1 ? ` (${n} de ${ativas().length})` : ""}` : "Instagram não conectado";
  }
  async function inicio() {
    S.st = await api("GET", "status"); S.papel = S.st.papel;
    $("#nomeTopo").textContent = S.st.empresa || "Sua empresa";
    if (!admin()) $$("[data-adm]").forEach((x) => (x.hidden = true));
    await carregaContas();
    aba(location.hash.slice(1));
    setInterval(() => { if (!document.hidden) badge().catch(() => {}); }, 60000);
  }
  async function badge(r) {
    r = r || (await api("GET", "resumo"));
    const b = $("#badge"); b.hidden = !r.mensagens_novas; b.textContent = r.mensagens_novas;
    document.title = (r.mensagens_novas ? `(${r.mensagens_novas}) ` : "") + "SocialWorks · Painel";
    return r;
  }

  // ---------- calendário ----------
  async function calendario() {
    const [a, m] = S.mes.split("-").map(Number), ini = `${S.mes}-01`;
    const offset = new Date(ini + "T12:00:00Z").getUTCDay(), diasMes = new Date(Date.UTC(a, m, 0)).getUTCDate();
    const semanas = Math.ceil((offset + diasMes) / 7), de = somaDias(ini, -offset), ate = somaDias(de, semanas * 7 - 1);
    const conta = $("#calConta").value;
    const [r, lista] = await Promise.all([api("GET", "resumo"), api("GET", `posts?de=${de}&ate=${ate}${conta ? `&conta=${conta}` : ""}`)]);
    badge(r);
    $("#kpis").innerHTML = [["Posts nos próximos 7 dias", r.semana], ["Rascunhos para aprovar", r.para_aprovar, r.para_aprovar ? "warn" : ""], ["Ideias no banco", r.ideias], ["Mensagens novas", r.mensagens_novas, r.mensagens_novas ? "p" : ""], ["Respostas automáticas", r.respostas_automaticas], ["Alertas de publicação", r.alertas, r.alertas ? "bad" : ""]]
      .map(([l, v, c]) => `<div class="card kpi"><div class="l">${l}</div><div class="v" ${c ? `style="color:var(--${c})"` : ""}>${esc(v)}</div></div>`).join("");
    $("#calTit").textContent = `${MESES[m - 1]} de ${a}`;
    const porDia = {};
    for (const p of lista) if (p.quando) (porDia[p.quando.slice(0, 10)] ||= []).push(p);
    const hoje = hojeBR(), chip = (p) => `<button class="pc" data-post="${p.id}" ${p.status !== "publicado" ? 'draggable="true"' : ""} style="--c:${esc(p.cor)}" title="${esc(`${TIPO[p.tipo]} · ${ST[p.status]} · ${p.conta}`)}"><span class="st st-${p.status}"></span><span class="h">${p.quando.slice(11, 16)}</span><b>${ICO[p.tipo]} ${esc(p.titulo)}</b></button>`;
    let h = "";
    for (let i = 0; i < semanas * 7; i++) {
      const d = somaDias(de, i), ps = porDia[d] || [];
      h += `<div class="dia ${d.slice(0, 7) !== S.mes ? "fora" : ""} ${d === hoje ? "hoje" : ""}" data-dia="${d}"><span class="n">${Number(d.slice(8))}</span><button class="mais" data-novo="${d}" aria-label="Novo post em ${dataBR(d)}">+</button>${ps.map(chip).join("")}</div>`;
    }
    $("#calGr").innerHTML = h;
    const dias = Object.keys(porDia).filter((d) => d.slice(0, 7) === S.mes).sort();
    $("#agenda").innerHTML = dias.map((d) => `<div class="ag-d"><h3>${semana(d)}, ${dataBR(d).slice(0, 5)}</h3>${porDia[d].map(chip).join("")}</div>`).join("") || `<div class="empty">Nenhum post em ${MESES[m - 1]}. Toque em “+ Novo post” para começar.</div>`;
  }
  let arrastando = null;
  document.addEventListener("dragstart", (e) => { const b = e.target.closest?.(".pc[draggable]"); if (!b) return; arrastando = Number(b.dataset.post); e.dataTransfer.effectAllowed = "move"; e.dataTransfer.setData("text/plain", String(arrastando)); });
  $("#calGr").addEventListener("dragover", (e) => { const d = e.target.closest(".dia"); if (!d || !arrastando) return; e.preventDefault(); $$(".dia.alvo").forEach((x) => x !== d && x.classList.remove("alvo")); d.classList.add("alvo"); });
  $("#calGr").addEventListener("dragleave", (e) => { const d = e.target.closest(".dia"); if (d && !d.contains(e.relatedTarget)) d.classList.remove("alvo"); });
  $("#calGr").addEventListener("drop", async (e) => {
    const d = e.target.closest(".dia"); $$(".dia.alvo").forEach((x) => x.classList.remove("alvo"));
    if (!d || !arrastando) return; e.preventDefault();
    const id = arrastando; arrastando = null;
    try { const p = await api("GET", `posts/${id}`); if (p.quando?.slice(0, 10) === d.dataset.dia) return; await api("PUT", `posts/${id}`, { quando: `${d.dataset.dia}T${(p.quando || "T10:00").slice(-5)}` }); toast(`Movido para ${dataBR(d.dataset.dia)}.`); calendario().catch(falhou); }
    catch (x) { falhou(x); }
  });
  document.addEventListener("dragend", () => { arrastando = null; $$(".dia.alvo").forEach((x) => x.classList.remove("alvo")); });
  $("#calConta").addEventListener("change", () => calendario().catch(falhou));

  // ---------- lista de posts ----------
  const cartao = (p) => {
    const m = linhas(p.midia), img = m.find((u) => !video(u));
    return `<article class="pcard"><div class="th" ${img ? `data-img="${esc(img)}"` : ""}>${img ? "" : ICO[p.tipo]}<span class="chip tp">${TIPO[p.tipo]}</span></div>
      <div class="cp"><div class="row sb"><span class="chip c-${p.status}">${ST[p.status]}</span><span class="tiny mute">${esc(quandoTxt(p.quando))}</span></div>
      <b>${esc(p.titulo)}</b>${ativas().length > 1 ? `<span class="tiny mute">${esc(p.conta)}</span>` : ""}<p>${esc(p.legenda || "Sem legenda ainda.")}</p>
      ${p.erro && p.status !== "publicado" ? `<span class="er">⚠ ${esc(p.erro)}</span>` : ""}</div>
      <div class="ac"><button class="btn sm" data-post="${p.id}">${p.status === "publicado" ? "Ver" : p.status === "ideia" ? "Transformar em post" : "Editar"}</button>
      ${admin() && p.status === "rascunho" && p.quando ? `<button class="btn sm" data-aprovar="${p.id}">Aprovar</button>` : ""}
      ${p.link ? `<a class="btn sm ghost" href="${esc(p.link)}" target="_blank" rel="noopener">Abrir no Instagram ↗</a>` : ""}
      ${p.status === "ideia" ? `<button class="btn sm ghost bad" data-del="${p.id}">Descartar</button>` : ""}</div></article>`;
  };
  async function posts() {
    const c = $("#pConta").value, l = await api("GET", `posts?${S.filtro ? `status=${S.filtro}&` : ""}${c ? `conta=${c}` : ""}`);
    const ord = S.filtro ? l : l.filter((p) => p.status !== "ideia");
    $("#pLista").innerHTML = ord.map(cartao).join("") || `<div class="empty" style="grid-column:1/-1">${S.filtro ? "Nenhum post nesta etapa." : "Nenhum post ainda. Comece pelo “+ Novo post” ou peça ideias para a IA."}</div>`;
    fundo($("#pLista"));
  }
  $("#pFlt").addEventListener("click", (e) => { const b = e.target.closest("[data-f]"); if (!b) return; S.filtro = b.dataset.f; $$("#pFlt button").forEach((x) => x.setAttribute("aria-pressed", String(x === b))); posts().catch(falhou); });
  $("#pConta").addEventListener("change", () => posts().catch(falhou));

  // ---------- editor de post ----------
  const SVG = {
    cur: '<svg viewBox="0 0 24 24" fill="none" stroke="#111" stroke-width="2"><path d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10z"/></svg>',
    com: '<svg viewBox="0 0 24 24" fill="none" stroke="#111" stroke-width="2"><path d="M20 12a8 8 0 1 1-3.3-6.5L21 4l-1.3 4.2A8 8 0 0 1 20 12z"/></svg>',
    env: '<svg viewBox="0 0 24 24" fill="none" stroke="#111" stroke-width="2"><path d="M22 3 11 13M22 3l-7 18-4-8-8-4z"/></svg>',
  };
  function previa() {
    const c = contaPor($("#pConta2").value) || {}, tipo = $("#pTipo").value, m = linhas($("#pMidia").value), leg = $("#pLeg").value.trim(), tags = $("#pTags").value.trim();
    const user = c.usuario || "suamarca", vert = tipo === "reels" || tipo === "story", img = m.find((u) => !video(u));
    const ht = (t) => esc(t).replace(/(#[\p{L}\p{N}_]+)/gu, '<span class="ht">$1</span>');
    const texto = [leg, tags].filter(Boolean).join("\n\n"), corte = texto.length > 125 ? `${ht(texto.slice(0, 125))}<span class="vm">… mais</span>` : ht(texto);
    const d = $("#pData").value, qd = d ? `${Number(d.slice(8))} de ${MESES[Number(d.slice(5, 7)) - 1]}` : "";
    $("#pPrev").innerHTML = `<div class="ig ${vert ? "v" : ""}" style="--c:${esc(c.cor || "#DC2626")}">
      <div class="hd"><span class="av">${esc((c.nome || "S")[0].toUpperCase())}</span><div><b>${esc(user)}</b><small>${tipo === "reels" ? "Reels" : tipo === "story" ? "Story · 24 h" : esc(c.nome || "")}</small></div></div>
      <div class="md" ${img ? `data-img="${esc(img)}"` : ""}>${!m.length ? "Cole o link da imagem ou do vídeo para ver a prévia." : img ? "" : "▶ Vídeo"}
        ${tipo === "carrossel" && m.length > 1 ? `<span class="dots">${m.slice(0, 10).map(() => "<i></i>").join("")}</span>` : ""}
        ${tipo === "reels" && texto ? `<span class="rl"><b>${esc(user)}</b> ${esc(texto.slice(0, 90))}${texto.length > 90 ? "…" : ""}</span>` : ""}</div>
      ${tipo === "story" ? "" : `<div class="ic">${SVG.cur}${SVG.com}${SVG.env}</div>${tipo === "reels" ? "" : `<div class="lg"><b>${esc(user)}</b> ${corte || '<span class="vm">Sem legenda</span>'}</div>`}<div class="qd">${qd}</div>`}</div>`;
    fundo($("#pPrev"));
    const total = texto.length, nTags = tags.split(/\s+/).filter(Boolean).length, el = $("#pCont");
    el.textContent = `${total} de 2.200 caracteres · ${nTags} de 30 hashtags`; el.classList.toggle("alto", total > 2200 || nTags > 30);
  }
  ["#pConta2", "#pTipo", "#pMidia", "#pLeg", "#pTags", "#pData"].forEach((s) => $(s).addEventListener("input", previa));
  async function abrirPost(id, novo = {}) {
    const p = id ? await api("GET", `posts/${id}`) : { status: "rascunho", tipo: "feed", conta_id: Number($("#calConta").value) || ativas()[0]?.id, ...novo };
    S.post = p; const pub = p.status === "publicado";
    $("#dpT").textContent = id ? (pub ? "Post publicado" : "Editar post") : "Novo post";
    const ch = $("#pStChip"); ch.className = `chip c-${p.status}`; ch.textContent = id ? ST[p.status] : "Novo";
    $("#pConta2").value = p.conta_id || ""; $("#pTipo").value = p.tipo; $("#pTit").value = p.titulo || ""; $("#pPilar").value = p.pilar || "";
    $("#pData").value = p.quando ? p.quando.slice(0, 10) : novo.data || ""; $("#pHora").value = p.quando ? p.quando.slice(11, 16) : novo.data ? "10:00" : "";
    $("#pMidia").value = p.midia || ""; $("#pLeg").value = p.legenda || ""; $("#pTags").value = p.hashtags || (id ? "" : contaPor(p.conta_id)?.hashtags || "");
    $("#pSug").innerHTML = ""; $("#pErr").textContent = "";
    const info = [];
    if (p.criado_por) info.push(`Criado por ${esc(p.criado_por)}`);
    if (p.aprovado_por) info.push(`aprovado por ${esc(p.aprovado_por)}`);
    if (pub) info.push(`publicado em ${dataBR(p.publicado_em?.slice(0, 10))}${p.link ? ` · <a href="${esc(p.link)}" target="_blank" rel="noopener">abrir no Instagram ↗</a>` : ""}`);
    if (p.erro && !pub) info.push(`<span style="color:var(--bad)">⚠ ${esc(p.erro)}</span>`);
    if (p.status === "agendado" && !p.erro) info.push(contaPor(p.conta_id)?.conectado ? "Sai sozinho no horário marcado." : "Fica guardado e sai assim que o Instagram for conectado.");
    $("#pInfo").innerHTML = info.join(" · ");
    $$("#fPost input, #fPost select, #fPost textarea").forEach((x) => (x.disabled = pub));
    $$("[data-salvar], [data-act=iaLegenda]").forEach((b) => (b.hidden = pub || (b.hasAttribute("data-adm") && !admin())));
    $("#pSalvar").textContent = p.status === "ideia" ? "Salvar como rascunho" : ["aprovado", "agendado"].includes(p.status) ? "Voltar para rascunho" : "Salvar rascunho";
    $("#pApagar").hidden = !id || pub; $("#pDup").hidden = !id; $("#pManual").hidden = !id || pub || !admin();
    previa(); $("#dPost").showModal();
  }
  const corpoPost = (status) => {
    const d = $("#pData").value, h = $("#pHora").value || "10:00";
    return { conta_id: Number($("#pConta2").value), tipo: $("#pTipo").value, titulo: $("#pTit").value.trim(), pilar: $("#pPilar").value, midia: $("#pMidia").value, legenda: $("#pLeg").value, hashtags: $("#pTags").value, quando: d ? `${d}T${h}` : null, status };
  };
  $("#fPost").addEventListener("click", async (e) => {
    const b = e.target.closest("[data-salvar]"); if (!b) return;
    const corpo = corpoPost(b.dataset.salvar); $("#pErr").textContent = "";
    if (!corpo.titulo) { $("#pErr").textContent = "Dê um título ao post."; $("#pTit").focus(); return; }
    try {
      await ocupado(b, () => (S.post?.id ? api("PUT", `posts/${S.post.id}`, corpo) : api("POST", "posts", corpo)));
      $("#dPost").close(); toast({ rascunho: "Rascunho salvo.", aprovado: "Post aprovado.", agendado: "Publicação agendada." }[corpo.status]); recarrega();
    } catch (x) { $("#pErr").textContent = x.message; }
  });

  // IA de legendas
  $("#fIA").addEventListener("submit", async (e) => {
    if (e.submitter?.value !== "ok") return; e.preventDefault(); $("#aErr").textContent = "";
    try {
      const r = await ocupado($("#aBtn"), () => api("POST", "ia/legendas", { conta_id: Number($("#pConta2").value), tema: $("#aTema").value, tipo: $("#pTipo").value, objetivo: $("#aObj").value, detalhes: $("#aDet").value }));
      $("#dIA").close();
      const atuais = new Set($("#pTags").value.split(/\s+/).filter(Boolean));
      $("#pSug").innerHTML = `<p class="small mute" style="margin-top:10px">Toque numa opção para usar (você pode editar depois):</p><div class="sug">${r.legendas.map((l, i) => `<button type="button" data-leg="${i}">${esc(l)}</button>`).join("")}</div>
        ${r.hashtags.length ? `<p class="small mute" style="margin-top:10px">Hashtags sugeridas:</p><div class="tags">${r.hashtags.map((h) => `<button type="button" data-tag="${esc(h)}" aria-pressed="${atuais.has(h)}">${esc(h)}</button>`).join("")}</div>` : ""}`;
      S.sug = r.legendas;
    } catch (x) { $("#aErr").textContent = x.message; }
  });
  $("#pSug").addEventListener("click", (e) => {
    const l = e.target.closest("[data-leg]"), t = e.target.closest("[data-tag]");
    if (l) { $("#pLeg").value = S.sug[Number(l.dataset.leg)]; previa(); toast("Legenda aplicada."); }
    if (t) {
      const set = $("#pTags").value.split(/\s+/).filter(Boolean), h = t.dataset.tag, tem = set.includes(h);
      $("#pTags").value = (tem ? set.filter((x) => x !== h) : [...set, h]).join(" "); t.setAttribute("aria-pressed", String(!tem)); previa();
    }
  });

  // ---------- ideias com IA ----------
  async function ideias() {
    const [st, banco] = await Promise.all([api("GET", "status"), api("GET", "posts?status=ideia")]);
    $("#iUso").textContent = `Pedidos à IA hoje: ${st.uso_ia} de ${st.limite_ia}.`;
    $("#iN").textContent = banco.length; $("#iN").hidden = !banco.length;
    $("#iBanco").innerHTML = banco.map(cartao).join("") || `<div class="empty" style="grid-column:1/-1">O banco de ideias está vazio. Gere sugestões acima e salve as que gostar.</div>`;
    fundo($("#iBanco"));
  }
  $("#fIdeias").addEventListener("submit", async (e) => {
    e.preventDefault();
    try {
      const r = await ocupado($("#iBtn"), () => api("POST", "ia/ideias", { conta_id: Number($("#iConta").value), quantidade: Number($("#iQtd").value), periodo: $("#iPer").value, foco: $("#iFoco").value }));
      S.ideias = r.ideias;
      $("#iRes").innerHTML = r.ideias.map((x, i) => `<label class="ideia"><input type="checkbox" data-i="${i}"><span><b>${esc(x.titulo)}</b><span class="row" style="gap:5px;margin-top:4px"><span class="chip">${TIPO[x.tipo]}</span><span class="chip">${esc(x.pilar)}</span></span><p>${esc(x.roteiro)}</p></span></label>`).join("");
      $("#iSalvar").hidden = false;
    } catch (x) { falhou(x); }
  });

  // ---------- automações ----------
  async function automacoes() {
    S.autos = await api("GET", "automacoes");
    const con = ativas().some((c) => c.conectado), av = $("#auAviso");
    av.hidden = con; av.textContent = "As automações começam a responder assim que o Instagram for conectado em “Perfis e conexão”. Você já pode criar e testar as respostas agora.";
    $("#auLista").innerHTML = S.autos.map((a) => `<div class="au ${a.ativo ? "" : "off"}"><div>
      <div class="row" style="gap:6px"><b>${esc(a.nome)}</b><span class="chip ${a.gatilho === "dm" ? "p" : ""}">${a.gatilho === "dm" ? "Direct" : "Comentário"}</span>${ativas().length > 1 ? `<span class="chip">${esc(a.conta)}</span>` : ""}${a.ativo ? "" : '<span class="chip">Desligada</span>'}</div>
      <div class="kw">${a.palavras.split(",").map((k) => k.trim()).filter(Boolean).map((k) => `<span class="chip p">${esc(k)}</span>`).join("")}</div>
      ${a.resposta_publica ? `<p class="rs">💬 Responde no comentário: ${esc(a.resposta_publica)}</p>` : ""}${a.resposta_dm ? `<p class="rs">✉ Manda no direct: ${esc(a.resposta_dm)}</p>` : ""}
      <p class="tiny mute" style="margin-top:6px">Respondeu ${a.usos} ${a.usos === 1 ? "vez" : "vezes"}</p></div>
      <div class="row" style="align-items:flex-start">${admin() ? `<button class="btn sm" data-auto="${a.id}">Editar</button>` : ""}</div></div>`).join("") || `<div class="empty">Nenhuma automação ainda. Comece pela mais pedida: alguém comenta “preço” e recebe o valor no direct.</div>`;
  }
  function abrirAuto(id) {
    const a = id ? S.autos.find((x) => x.id === id) : { gatilho: "comentario", ativo: 1, conta_id: ativas()[0]?.id };
    S.auto = a; $("#dauT").textContent = id ? "Editar automação" : "Nova automação";
    $("#uConta").value = a.conta_id; $("#uGat").value = a.gatilho; $("#uNome").value = a.nome || ""; $("#uPal").value = a.palavras || "";
    $("#uPub").value = a.resposta_publica || ""; $("#uDm").value = a.resposta_dm || ""; $("#uAtv").checked = !!a.ativo; $("#uErr").textContent = "";
    $("#uApagar").hidden = !id; $("#uPubBox").hidden = a.gatilho === "dm"; $("#dAuto").showModal();
  }
  $("#uGat").addEventListener("change", () => ($("#uPubBox").hidden = $("#uGat").value === "dm"));
  $("#fAuto").addEventListener("submit", async (e) => {
    if (e.submitter?.value !== "ok") return; e.preventDefault();
    const c = { conta_id: Number($("#uConta").value), gatilho: $("#uGat").value, nome: $("#uNome").value, palavras: $("#uPal").value, resposta_publica: $("#uPub").value, resposta_dm: $("#uDm").value, ativo: $("#uAtv").checked };
    try { await (S.auto.id ? api("PUT", `automacoes/${S.auto.id}`, c) : api("POST", "automacoes", c)); $("#dAuto").close(); toast("Automação salva."); automacoes().catch(falhou); }
    catch (x) { $("#uErr").textContent = x.message; }
  });
  $("#fSim").addEventListener("submit", async (e) => {
    e.preventDefault();
    try {
      const tipo = $("#sTipo").value, user = $("#sUser").value.replace(/^@/, "") || "cliente";
      const r = await api("POST", "automacoes/simular", { conta_id: Number($("#sConta").value), tipo, texto: $("#sTxt").value, usuario: user });
      $("#sRes").innerHTML = `<div class="grid" style="gap:8px"><div class="bolha"><b>@${esc(user)}</b> ${esc($("#sTxt").value)}</div>${r.automacao
        ? `${r.resposta_publica ? `<div class="bolha r"><span class="tiny mute">Resposta no comentário</span><br>${esc(r.resposta_publica)}</div>` : ""}${r.resposta_dm ? `<div class="bolha r"><span class="tiny mute">No direct</span><br>${esc(r.resposta_dm)}</div>` : ""}<p class="small mute">Automação usada: <b>${esc(r.automacao.nome)}</b></p>`
        : `<p class="small mute">Nenhuma automação responderia. A mensagem fica na Caixa de entrada para a equipe responder.</p>`}</div>`;
    } catch (x) { falhou(x); }
  });

  // ---------- caixa de entrada ----------
  async function caixa() {
    S.msgs = await api("GET", `mensagens${S.cx ? `?status=${S.cx}` : ""}`); badge().catch(() => {});
    const av = $("#cxAviso"); av.hidden = ativas().some((c) => c.conectado);
    av.textContent = "Quando o Instagram estiver conectado, os comentários e as mensagens do direct chegam aqui sozinhos.";
    $("#cxLista").innerHTML = S.msgs.map((m) => `<button class="ms ${m.status === "nova" ? "nova" : ""}" data-msg="${m.id}" aria-current="${m.id === S.msg}">
      <div class="l1"><span>${m.tipo === "dm" ? "✉" : "💬"}</span><b>${m.de_usuario ? "@" + esc(m.de_usuario) : m.tipo === "dm" ? "Mensagem no direct" : "Comentário"}</b><span class="h">${curto(m.recebida_em)}</span></div>
      <div class="ul">${esc(m.texto)}</div></button>`).join("") || `<div class="empty" style="margin:12px">${S.cx ? "Nada por aqui." : "Nenhuma mensagem em aberto. 🎉"}</div>`;
    if (S.msg && !S.msgs.some((m) => m.id === S.msg)) { S.msg = null; $("#cxFio").innerHTML = '<div class="empty">Escolha uma mensagem para ver e responder.</div>'; }
    else if (S.msg) fio(S.msg);
  }
  function fio(id) {
    const m = S.msgs.find((x) => x.id === id); if (!m) return; S.msg = id;
    $$("#cxLista .ms").forEach((b) => b.setAttribute("aria-current", String(Number(b.dataset.msg) === id)));
    const [st, cor] = MST[m.status], con = contaPor(m.conta_id)?.conectado;
    $("#cxFio").innerHTML = `<div class="row sb"><div><b>${m.de_usuario ? "@" + esc(m.de_usuario) : "Cliente"}</b><p class="tiny mute">${m.tipo === "dm" ? "Mensagem no direct" : "Comentário em post"} · ${esc(m.conta)} · ${dataBR(m.recebida_em.slice(0, 10))} ${m.recebida_em.slice(11, 16)}</p></div><span class="chip ${cor}">${st}</span></div>
      <div class="grid" style="gap:8px;margin-top:14px"><div class="bolha">${esc(m.texto)}</div>${m.resposta ? `<div class="bolha r"><span class="tiny mute">${m.status === "automatica" ? `Automação: ${esc(m.automacao || "")}` : "Equipe"}</span><br>${esc(m.resposta)}</div>` : ""}</div>
      ${m.status !== "arquivada" ? `<form id="fResp" style="margin-top:14px"><label for="rTxt">${m.tipo === "dm" ? "Responder no direct" : "Responder ao comentário"}</label><textarea id="rTxt" maxlength="1000" ${con ? "" : "disabled"} placeholder="${con ? "Escreva a resposta…" : "Conecte o Instagram para responder por aqui."}"></textarea>
        <div class="row" style="justify-content:flex-end;margin-top:8px"><button type="button" class="btn" data-arq="${m.id}">Arquivar</button><button class="btn pri" ${con ? "" : "disabled"}>Enviar</button></div></form>`
        : `<div class="row" style="justify-content:flex-end;margin-top:14px"><button class="btn" data-reabrir="${m.id}">Voltar para a caixa</button></div>`}`;
    $("#fResp")?.addEventListener("submit", async (e) => {
      e.preventDefault();
      try { await ocupado(e.submitter, () => api("PUT", `mensagens/${id}`, { resposta: $("#rTxt").value })); toast("Resposta enviada."); caixa().catch(falhou); } catch (x) { falhou(x); }
    });
  }
  $("#cxFlt").addEventListener("click", (e) => { const b = e.target.closest("[data-f]"); if (!b) return; S.cx = b.dataset.f; S.msg = null; $$("#cxFlt button").forEach((x) => x.setAttribute("aria-pressed", String(x === b))); $("#cxFio").innerHTML = '<div class="empty">Escolha uma mensagem para ver e responder.</div>'; caixa().catch(falhou); });

  // ---------- relatórios ----------
  async function relatorio() {
    if (!$("#rDe").value) { $("#rDe").value = somaDias(hojeBR(), -29); $("#rAte").value = somaDias(hojeBR(), 30); }
    const r = await api("GET", `relatorio?de=${$("#rDe").value}&ate=${$("#rAte").value}`);
    const n = (st) => r.por_status.find((x) => x.status === st)?.n || 0, ms = (f) => r.mensagens.filter(f).reduce((s, x) => s + x.n, 0);
    $("#rKpis").innerHTML = [["Publicados", n("publicado")], ["Agendados", n("agendado")], ["Em produção", n("rascunho") + n("aprovado")], ["Com erro", n("erro"), n("erro") ? "bad" : ""], ["Mensagens recebidas", ms(() => true)], ["Respondidas pela automação", ms((x) => x.status === "automatica")]]
      .map(([l, v, c]) => `<div class="card kpi"><div class="l">${l}</div><div class="v" ${c ? `style="color:var(--${c})"` : ""}>${v}</div></div>`).join("");
    const max = Math.max(1, ...r.por_semana.map((x) => x.n));
    $("#rSem").innerHTML = r.por_semana.map((x) => `<div class="c" title="${x.n} post(s) na semana de ${dataBR(x.inicio)}"><i style="height:${(100 * x.n) / max}%"></i><span>${dataBR(x.inicio).slice(0, 5)}</span></div>`).join("") || '<p class="mute small">Sem posts no período.</p>';
    const hz = (l, rot) => { const t = Math.max(1, ...l.map((x) => x.n)); return l.map((x) => `<div class="hz"><span>${esc(rot(x))}</span><div class="bar"><i style="width:${(100 * x.n) / t}%"></i></div><span class="n">${x.n}</span></div>`).join("") || '<p class="mute small" style="margin-top:8px">Sem dados.</p>'; };
    $("#rTipo").innerHTML = hz(r.por_tipo, (x) => TIPO[x.tipo]);
    $("#rPilar").innerHTML = hz(r.por_pilar, (x) => x.pilar[0].toUpperCase() + x.pilar.slice(1));
    $("#rAuto").innerHTML = r.automacoes.map((a) => `<tr><td>${esc(a.nome)}</td><td class="n">${a.usos}</td></tr>`).join("") || '<tr><td class="mute">Nenhuma automação.</td></tr>';
    const MT = { comentario: "Comentários", dm: "Mensagens no direct" };
    $("#rMsg").innerHTML = r.mensagens.map((x) => `<tr><td>${MT[x.tipo]}</td><td>${MST[x.status][0]}</td><td class="n">${x.n}</td></tr>`).join("") || '<tr><td class="mute">Nenhuma mensagem no período.</td></tr>';
  }

  // ---------- perfis e conexão ----------
  async function perfis() {
    await carregaContas(); S.st = await api("GET", "status");
    $("#perfis").innerHTML = ativas().map((c) => `<div class="perfil"><div class="tp"><span class="av" style="background:${esc(c.cor)}">${esc(c.nome[0].toUpperCase())}</span><div style="flex:1"><h2>${esc(c.nome)}</h2><p class="small mute">${c.usuario ? "@" + esc(c.usuario) : "@ não informado"}</p></div>${admin() ? `<button class="btn sm" data-perfil="${c.id}">Editar</button>` : ""}</div>
      <div class="row" style="gap:5px"><span class="chip">Tom ${TOM[c.tom].toLowerCase()}</span>${c.nicho ? `<span class="chip">${esc(c.nicho)}</span>` : ""}</div>
      ${c.publico ? `<p class="small"><span class="mute">Público:</span> ${esc(c.publico)}</p>` : ""}${c.hashtags ? `<p class="small"><span class="mute">Hashtags fixas:</span> ${esc(c.hashtags)}</p>` : ""}
      ${c.conectado ? `<div class="ok-box">✓ Conectado ao Instagram desde ${dataBR(c.conectado_em?.slice(0, 10))}. Os posts agendados saem sozinhos e as automações respondem na hora.</div>${admin() ? `<div class="row" style="justify-content:flex-end"><button class="btn sm bad" data-desc="${c.id}">Desconectar</button></div>` : ""}`
        : !S.st.conexao ? `<div class="aviso">A conexão com o Instagram está sendo liberada pela LLD Works junto à Meta. Enquanto isso, planeje, aprove e agende: os posts ficam guardados e saem assim que a conexão for feita.</div>`
        : `<div class="aviso">Instagram ainda não conectado.<ol class="passos"><li>Deixe a conta como profissional (Empresa ou Criador).</li><li>Ligue a conta a uma página do Facebook.</li><li>Gere o token no painel da Meta (a LLD Works pode ajudar).</li></ol></div>${admin() ? `<div class="row" style="justify-content:flex-end"><button class="btn sm pri" data-con="${c.id}">Conectar o Instagram</button></div>` : ""}`}
    </div>`).join("");
  }
  function abrirPerfil(id) {
    const c = id ? contaPor(id) : { tom: "proximo", cor: "#DC2626" }; S.perfil = c;
    $("#dpfT").textContent = id ? "Editar perfil" : "Novo perfil";
    $("#fNome").value = c.nome || ""; $("#fUser").value = c.usuario || ""; $("#fNicho").value = c.nicho || ""; $("#fPub").value = c.publico || "";
    $("#fTom").value = c.tom; $("#fCor").value = c.cor; $("#fEvitar").value = c.palavras_evitar || ""; $("#fTags").value = c.hashtags || "";
    $("#fErr").textContent = ""; $("#fApagar").hidden = !id || ativas().length < 2; $("#dPerfil").showModal();
  }
  $("#fPerfil").addEventListener("submit", async (e) => {
    if (e.submitter?.value !== "ok") return; e.preventDefault();
    const c = { nome: $("#fNome").value, usuario: $("#fUser").value, nicho: $("#fNicho").value, publico: $("#fPub").value, tom: $("#fTom").value, cor: $("#fCor").value, palavras_evitar: $("#fEvitar").value, hashtags: $("#fTags").value };
    try { await (S.perfil.id ? api("PUT", `contas/${S.perfil.id}`, c) : api("POST", "contas", c)); $("#dPerfil").close(); toast("Perfil salvo."); perfis().catch(falhou); }
    catch (x) { $("#fErr").textContent = x.message; }
  });
  $("#fCon").addEventListener("submit", async (e) => {
    if (e.submitter?.value !== "ok") return; e.preventDefault();
    try { const r = await api("PUT", `contas/${S.con}/conexao`, { ig_user_id: $("#cIg").value.trim(), token: $("#cTok").value.trim() }); $("#cTok").value = ""; $("#dCon").close(); toast(`Instagram conectado${r.usuario ? ` (@${r.usuario})` : ""}.`); perfis().catch(falhou); }
    catch (x) { $("#cErr").textContent = x.message; }
  });

  // ---------- plano (assinatura e limites vindos do LLD Works Hub) ----------
  async function planoTela() {
    const p = await api("GET", "plano"), box = $("#planoBox");
    const SIT = { ativa: ["Ativa", "ok"], cortesia: ["Cortesia", "p"], teste: ["Período de teste", "warn"], pendente: ["Pagamento pendente", "warn"], inadimplente: ["Pagamento em atraso", "bad"], cancelada: ["Cancelada", "bad"], sem_assinatura: ["Sem assinatura", "bad"], desconhecida: ["Em verificação", ""] };
    const [st, cor] = SIT[p.status] || [p.status, ""];
    const lims = Object.entries(p.nomes || {}).map(([k, nome]) => {
      const max = Number(p.limites?.[k]) || 0, uso = Number(p.uso?.[k]) || 0, pct = max ? Math.min(100, Math.round((100 * uso) / max)) : 0;
      return `<div class="plano-lim"><div class="row sb small"><b>${esc(nome[0].toUpperCase() + nome.slice(1))}</b><span>${uso}${max ? ` de ${max}` : " · sem limite"}</span></div>${max ? `<div class="bar"><i class="${pct >= 100 ? "cheio" : ""}" style="width:${pct}%"></i></div>` : ""}</div>`;
    }).join("");
    box.innerHTML = `<div class="row sb"><div><p class="small mute">Plano</p><h2>${esc(p.plano || (p.status === "cortesia" ? "Cortesia LLD Works" : "Plano sob medida"))}</h2></div><span class="chip ${cor}">${st}</span></div>
      ${p.vence_em ? `<p class="small mute" style="margin-top:6px">${p.status === "teste" ? "Teste até" : "Vence em"} ${dataBR(p.vence_em)}</p>` : ""}
      ${!p.liberada ? `<p class="aviso">A assinatura não está liberada: as publicações agendadas e as automações ficam pausadas. Fale com a LLD Works para regularizar.</p>` : ""}
      ${lims || '<p class="small mute" style="margin-top:12px">Seu plano não tem limite de uso neste produto.</p>'}
      <div style="margin-top:16px;display:flex;flex-wrap:wrap;align-items:center;gap:10px">${p.status === "cortesia" ? "" : '<a class="btn sm pri" href="/assinar">Pagar ou trocar de plano</a><span class="small mute">Pix ou cartão em até 12x</span>'}</div><p class="small mute" style="margin-top:10px">Dúvidas sobre os planos? <a href="https://produtos.lldworks.com.br/#socialworks" target="_blank" rel="noopener">Fale com a LLD Works</a>.</p>`;
  }

  // ---------- cliques ----------
  document.addEventListener("click", async (e) => {
    const t = e.target.closest("[data-act],[data-post],[data-novo],[data-aprovar],[data-del],[data-auto],[data-msg],[data-arq],[data-reabrir],[data-perfil],[data-con],[data-desc]");
    if (!t) return;
    const d = t.dataset;
    try {
      if (d.post) return await abrirPost(Number(d.post));
      if (d.novo) return await abrirPost(null, { data: d.novo });
      if (d.aprovar) { await api("PUT", `posts/${d.aprovar}`, { status: "aprovado" }); toast("Post aprovado."); return recarrega(); }
      if (d.del) { if (!confirm("Descartar esta ideia?")) return; await api("DELETE", `posts/${d.del}`); toast("Ideia descartada."); return recarrega(); }
      if (d.auto) return abrirAuto(Number(d.auto));
      if (d.msg) return fio(Number(d.msg));
      if (d.arq || d.reabrir) { await api("PUT", `mensagens/${d.arq || d.reabrir}`, { status: d.arq ? "arquivada" : "nova" }); toast(d.arq ? "Mensagem arquivada." : "Mensagem de volta na caixa."); S.msg = null; $("#cxFio").innerHTML = '<div class="empty">Escolha uma mensagem para ver e responder.</div>'; return caixa(); }
      if (d.perfil) return abrirPerfil(Number(d.perfil));
      if (d.con) { S.con = Number(d.con); $("#cIg").value = ""; $("#cTok").value = ""; $("#cErr").textContent = ""; return $("#dCon").showModal(); }
      if (d.desc) { if (!confirm("Desconectar o Instagram deste perfil? Os posts agendados param de sair até conectar de novo.")) return; await api("DELETE", `contas/${d.desc}/conexao`); toast("Instagram desconectado."); return perfis(); }
      switch (d.act) {
        case "novoPost": return await abrirPost(null, {});
        case "mes": { if (d.d === "0") S.mes = hojeBR().slice(0, 7); else { const [a, m] = S.mes.split("-").map(Number), x = new Date(Date.UTC(a, m - 1 + Number(d.d), 1)); S.mes = x.toISOString().slice(0, 7); } if (abaAtual() !== "calendario") aba("calendario"); else await calendario(); return; }
        case "iaLegenda": $("#aTema").value = $("#aTema").value || $("#pTit").value; $("#aErr").textContent = ""; return $("#dIA").showModal();
        case "apagarPost": if (!confirm("Apagar este post? Não dá para desfazer.")) return; await api("DELETE", `posts/${S.post.id}`); $("#dPost").close(); toast("Post apagado."); return recarrega();
        case "duplicarPost": { const r = await api("POST", `posts/${S.post.id}/duplicar`); toast("Cópia criada como rascunho."); recarrega(); return await abrirPost(r.id); }
        case "marcarPublicado": { const link = prompt("Cole o link do post no Instagram:"); if (!link) return; await api("PUT", `posts/${S.post.id}`, { ...corpoPost("publicado"), link: link.trim() }); $("#dPost").close(); toast("Marcado como publicado."); return recarrega(); }
        case "salvarIdeias": { const sel = $$("#iRes input:checked").map((x) => S.ideias[Number(x.dataset.i)]); if (!sel.length) return toast("Marque ao menos uma ideia.", true); const r = await api("POST", "ia/salvar-ideias", { conta_id: Number($("#iConta").value), ideias: sel }); toast(`${r.criadas} ${r.criadas === 1 ? "ideia salva" : "ideias salvas"} no banco.`); $$("#iRes input:checked").forEach((x) => x.closest(".ideia").remove()); return ideias(); }
        case "novaAuto": return abrirAuto(null);
        case "apagarAuto": if (!confirm("Apagar esta automação?")) return; await api("DELETE", `automacoes/${S.auto.id}`); $("#dAuto").close(); toast("Automação apagada."); return automacoes();
        case "relatorio": return await relatorio();
        case "novoPerfil": return abrirPerfil(null);
        case "apagarPerfil": if (!confirm("Remover este perfil? A conexão com o Instagram dele é desfeita.")) return; await api("DELETE", `contas/${S.perfil.id}`); $("#dPerfil").close(); toast("Perfil removido."); return perfis();
      }
    } catch (x) { falhou(x); }
  });

  inicio().catch(falhou);
})();
