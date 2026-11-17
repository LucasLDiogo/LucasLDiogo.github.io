// AgentWorks — painel. Fala só com /api/admin/* (o roteador confere a sessão e diz quem é o cliente).
"use strict";
(() => {
  const $ = (s, r = document) => r.querySelector(s), $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const hora = (s) => (s ? s.slice(11, 16) : "");
  const quando = (s) => { if (!s) return ""; const h = new Intl.DateTimeFormat("sv-SE", { timeZone: "America/Sao_Paulo" }).format(new Date()); return s.slice(0, 10) === h ? s.slice(11, 16) : `${s.slice(8, 10)}/${s.slice(5, 7)}`; };
  const hojeBR = () => new Intl.DateTimeFormat("sv-SE", { timeZone: "America/Sao_Paulo" }).format(new Date());
  const ST = { robo: ["Com o assistente", "ok"], humano: ["Com a equipe", "warn"], encerrada: ["Encerrada", ""] };
  const QUEM = { cliente: "Cliente", robo: "Assistente", humano: "Equipe" };
  const MOTIVO = { resolvida: "Resolvidas pelo assistente", pedido: "Cliente pediu uma pessoa", sem_resposta: "O assistente não sabia", erro: "Falha momentânea da IA", limite: "Limite diário da IA", limite_plano: "Limite de conversas do plano", desligado: "Assistente desligado", assumida: "Equipe assumiu a conversa" };
  const S = { ag: null, papel: "admin", filtro: "", convs: [], atual: null, conv: null, ultimo: 0, kb: [], teste: [] };
  const admin = () => S.papel === "admin";
  let tt;
  const toast = (m, erro = false) => { const t = $("#toast"); t.textContent = m; t.classList.toggle("err", erro); t.classList.add("on"); clearTimeout(tt); tt = setTimeout(() => t.classList.remove("on"), 3200); };
  async function api(metodo, caminho, corpo) {
    const r = await fetch("/api/admin/" + caminho, { method: metodo, headers: corpo ? { "Content-Type": "application/json" } : {}, body: corpo ? JSON.stringify(corpo) : undefined, credentials: "same-origin" });
    if (r.status === 401) { location.href = "/entrar"; throw new Error("Sessão expirada. Entre de novo."); }
    let d = null; try { d = await r.json(); } catch {}
    if (!r.ok) throw new Error(d?.erro || "Não foi possível concluir. Tente de novo.");
    return d;
  }
  const falhou = (e) => toast(e.message, true);

  // ---------- abas ----------
  const CARGA = { conversas: () => conversas(), base: () => base(), testar: async () => desenhaTeste(), relatorios: () => relatorio(), plano: () => planoTela(), config: () => preencheConfig() };
  // ---------- plano (assinatura e limites vindos do LLD Works Hub) ----------
  async function planoTela() {
    const p = await api("GET", "plano"), box = document.querySelector("#planoBox"), e = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
    const SIT = { ativa: ["Ativa", "ok"], cortesia: ["Cortesia", "p"], teste: ["Período de teste", "warn"], pendente: ["Pagamento pendente", "warn"], inadimplente: ["Pagamento em atraso", "bad"], cancelada: ["Cancelada", "bad"], sem_assinatura: ["Sem assinatura", "bad"], desconhecida: ["Em verificação", ""] };
    const [st, cor] = SIT[p.status] || [p.status, ""], dt = (d) => `${d.slice(8, 10)}/${d.slice(5, 7)}/${d.slice(0, 4)}`;
    const lims = Object.entries(p.nomes || {}).map(([k, nome]) => {
      const max = Number(p.limites?.[k]) || 0, uso = Number(p.uso?.[k]) || 0, pct = max ? Math.min(100, Math.round((100 * uso) / max)) : 0;
      return `<div class="plano-lim"><div class="row sb small"><b>${e(nome[0].toUpperCase() + nome.slice(1))}</b><span>${uso}${max ? ` de ${max}` : " · sem limite"}</span></div>${max ? `<div class="bar"><i class="${pct >= 100 ? "cheio" : ""}" style="width:${pct}%"></i></div>` : ""}</div>`;
    }).join("");
    box.innerHTML = `<div class="row sb"><div><p class="small mute">Plano</p><h2>${e(p.plano || (p.status === "cortesia" ? "Cortesia LLD Works" : "Plano sob medida"))}</h2></div><span class="chip ${cor}">${st}</span></div>
      ${p.vence_em ? `<p class="small mute" style="margin-top:6px">${p.status === "teste" ? "Teste até" : "Vence em"} ${dt(p.vence_em)}</p>` : ""}
      ${!p.liberada ? `<p class="aviso">A assinatura não está liberada: o chat do site mostra “indisponível” e o WhatsApp não responde. Fale com a LLD Works para regularizar.</p>` : ""}
      ${lims || '<p class="small mute" style="margin-top:12px">Seu plano não tem limite de uso neste produto.</p>'}
      <p class="small mute" style="margin-top:16px">Precisa de mais? <a href="https://produtos.lldworks.com.br/#agentworks" target="_blank" rel="noopener">Fale com a LLD Works</a> para mudar de plano.</p>`;
  }
  function aba(v) {
    if (!CARGA[v] || (v === "config" && !admin())) v = "conversas";
    $$(".nav button").forEach((b) => b.setAttribute("aria-selected", String(b.dataset.v === v)));
    $$(".view").forEach((s) => s.classList.toggle("on", s.id === "v-" + v));
    history.replaceState(null, "", "#" + v);
    CARGA[v]().catch(falhou);
  }
  $(".nav").addEventListener("click", (e) => { const b = e.target.closest("[data-v]"); if (b) aba(b.dataset.v); });
  const abaAtual = () => $(".nav [aria-selected=true]")?.dataset.v;

  // ---------- agente ----------
  async function carregaAgente() {
    S.ag = await api("GET", "agente"); S.papel = S.ag.papel;
    $("#nomeTopo").textContent = S.ag.empresa;
    const v = $("#verChat"); v.href = S.ag.chat_url; v.hidden = false;
    const st = $("#stAg"); st.hidden = false;
    st.className = "chip " + (S.ag.demonstracao ? "p" : S.ag.ativo ? "ok" : "bad");
    st.textContent = S.ag.demonstracao ? "Demonstração" : S.ag.ativo ? `Assistente ${S.ag.nome_agente} ligado` : "Assistente desligado";
    if (!admin()) $$("[data-adm]").forEach((x) => (x.hidden = true));
  }

  // ---------- conversas ----------
  async function conversas(auto = false) {
    const [r, lista] = await Promise.all([api("GET", "resumo"), api("GET", `conversas?filtro=${S.filtro}&q=${encodeURIComponent($("#cBusca").value.trim())}`)]);
    const pct = r.mes.resolvidas_pct == null ? "—" : `${r.mes.resolvidas_pct}%`;
    $("#kpis").innerHTML = [["Aguardando a equipe", r.aguardando, r.aguardando ? "warn" : ""], ["Com a equipe", r.com_equipe], ["Conversas hoje", r.hoje], ["Resolvidas pelo assistente (30 dias)", pct], ["Respostas da IA hoje", `${r.respostas_ia} de ${r.limite}`]]
      .map(([l, v, c]) => `<div class="card kpi"><div class="l">${l}</div><div class="v" ${c ? 'style="color:var(--warn)"' : ""}>${esc(v)}</div></div>`).join("");
    const b = $("#badge"); b.hidden = !r.aguardando; b.textContent = r.aguardando;
    if (auto && r.aguardando > (S.esperando || 0)) toast("Um cliente está esperando alguém da equipe.");
    S.esperando = r.aguardando;
    document.title = (r.aguardando ? `(${r.aguardando}) ` : "") + "AgentWorks · Painel";
    S.convs = lista;
    $("#convs").innerHTML = lista.map((c) => {
      const esp = c.status === "humano" && c.aguardando;
      return `<button class="cv ${esp ? "esp" : ""}" data-conv="${c.id}" aria-current="${c.id === S.atual}">
        <div class="l1"><b>${esc(c.contato)}</b><span class="h">${quando(c.atualizado_em)}</span></div>
        <div class="ul">${esc(c.ultima || "")}</div>
        <div class="l3"><span class="chip">${c.canal === "whatsapp" ? "WhatsApp" : "Site"}</span><span class="chip ${ST[c.status][1]}">${esp ? "Esperando resposta" : ST[c.status][0]}</span></div></button>`;
    }).join("") || `<div class="empty" style="margin:12px">${S.filtro || $("#cBusca").value ? "Nenhuma conversa com esse filtro." : "Nenhuma conversa ainda. Elas aparecem aqui quando um cliente escreve no chat do site ou no WhatsApp."}</div>`;
    if (S.atual) await atualizaFio().catch(() => {});
  }
  function bolha(m) {
    if (m.autor === "sistema") return `<div class="b sistema">${esc(m.texto)} · ${hora(m.criado_em)}</div>`;
    let fontes = "";
    if (m.autor === "robo" && m.fontes) { try { const t = JSON.parse(m.fontes).map((id) => S.kb.find((k) => k.id === id)?.titulo).filter(Boolean); if (t.length) fontes = `<div class="fontes">${t.map((x) => `<span class="chip">📄 ${esc(x)}</span>`).join("")}</div>`; } catch {} }
    return `<div class="b ${m.autor}"><span class="quem">${QUEM[m.autor]}</span>${esc(m.texto)}<small>${hora(m.criado_em)}</small>${fontes}</div>`;
  }
  async function abrir(id) {
    const c = await api("GET", `conversas/${id}`);
    S.atual = id; S.conv = c; S.ultimo = c.mensagens.at(-1)?.id || 0;
    $("#inbox").classList.add("aberta");
    $$("#convs .cv").forEach((b) => b.setAttribute("aria-current", String(+b.dataset.conv === id)));
    const nome = c.contato.nome || (c.contato.whatsapp ? `+${c.contato.whatsapp}` : "Visitante do site");
    $("#fio").innerHTML = `<div class="cab"><button class="btn sm ghost" data-act="voltar" aria-label="Voltar para a lista">←</button>
      <div class="q"><b>${esc(nome)}</b><span class="small mute">${c.canal === "whatsapp" ? `WhatsApp · +${esc(c.contato.whatsapp)}` : "Chat do site"}${c.contato.observacoes ? ` · ${esc(c.contato.observacoes)}` : ""}</span></div>
      <span class="chip ${ST[c.status][1]}" id="fioSt">${ST[c.status][0]}</span><span class="sp"></span>
      <button class="btn sm" data-act="contato">Contato</button>
      ${c.status === "robo" ? '<button class="btn sm" data-act="acao" data-acao="assumir">Assumir</button>' : ""}
      ${c.status === "humano" ? '<button class="btn sm" data-act="acao" data-acao="devolver">Devolver ao assistente</button>' : ""}
      ${c.status !== "encerrada" ? '<button class="btn sm" data-act="acao" data-acao="encerrar">Encerrar</button>' : ""}</div>
      <div class="msgs" id="fMsgs">${c.mensagens.map(bolha).join("")}</div>
      <form class="comp" id="fResp"><textarea id="rTexto" maxlength="2000" rows="1" placeholder="${c.status === "robo" ? "Escrever aqui assume a conversa no lugar do assistente…" : "Escreva sua resposta…"}" aria-label="Resposta"></textarea><button class="btn pri">Enviar</button></form>`;
    rolaFim();
  }
  const rolaFim = () => { const m = $("#fMsgs"); if (m) m.scrollTop = m.scrollHeight; };
  async function atualizaFio() {
    if (!S.atual || !$("#fMsgs")) return;
    const c = await api("GET", `conversas/${S.atual}?depois=${S.ultimo}`);
    if (c.status !== S.conv.status) return abrir(S.atual);
    if (c.mensagens.length) { const f = $("#fMsgs"), perto = f.scrollHeight - f.scrollTop - f.clientHeight < 80; f.insertAdjacentHTML("beforeend", c.mensagens.map(bolha).join("")); S.ultimo = c.mensagens.at(-1).id; if (perto) rolaFim(); }
  }
  document.addEventListener("submit", async (e) => {
    if (e.target.id !== "fResp") return; e.preventDefault();
    const t = $("#rTexto"), texto = t.value.trim(); if (!texto) return;
    const b = e.target.querySelector("button"); b.disabled = true;
    try { await api("POST", `conversas/${S.atual}/responder`, { texto }); t.value = ""; await abrir(S.atual); conversas().catch(() => {}); $("#rTexto")?.focus(); }
    catch (x) { falhou(x); } finally { b.disabled = false; }
  });
  document.addEventListener("keydown", (e) => {
    if (e.key === "Enter" && !e.shiftKey && (e.target.id === "rTexto" || e.target.id === "tTexto")) { e.preventDefault(); e.target.form.requestSubmit(); }
  });
  $(".flt").addEventListener("click", (e) => { const b = e.target.closest("[data-f]"); if (!b) return; S.filtro = b.dataset.f; $$(".flt button").forEach((x) => x.setAttribute("aria-pressed", String(x === b))); conversas().catch(falhou); });
  let tb; $("#cBusca").addEventListener("input", () => { clearTimeout(tb); tb = setTimeout(() => conversas().catch(falhou), 300); });
  $("#convs").addEventListener("click", (e) => { const b = e.target.closest("[data-conv]"); if (b) abrir(+b.dataset.conv).catch(falhou); });
  const dCont = $("#dCont");
  $("#fCont").addEventListener("submit", async (e) => {
    if (e.submitter?.value !== "ok") return; e.preventDefault();
    try { await api("PUT", `contatos/${S.conv.contato.id}`, { nome: $("#ctNome").value, observacoes: $("#ctObs").value }); dCont.close(); toast("Contato salvo."); await abrir(S.atual); conversas().catch(() => {}); }
    catch (x) { $("#ctErr").textContent = x.message; }
  });

  // ---------- base de conhecimento ----------
  async function base() {
    const [kb, lac] = await Promise.all([api("GET", "conhecimento"), api("GET", "lacunas")]);
    S.kb = kb; S.lac = lac; desenhaBase();
    $("#lacCard").hidden = !lac.length; $("#lacN").textContent = lac.length;
    $("#lacs").innerHTML = lac.map((l) => `<div class="lac"><span>“${esc(l.pergunta)}”<span class="tiny mute"> · ${quando(l.criado_em)}</span></span>${admin() ? `<button class="btn sm pri" data-act="responderLac" data-id="${l.id}">Responder</button><button class="btn sm ghost" data-act="ignorarLac" data-id="${l.id}">Ignorar</button>` : ""}</div>`).join("");
  }
  function desenhaBase() {
    const q = $("#kBusca").value.trim().toLowerCase();
    const l = S.kb.filter((k) => !q || (k.titulo + " " + k.conteudo).toLowerCase().includes(q));
    $("#kbLista").innerHTML = l.map((k) => `<div class="kb-i ${k.ativo ? "" : "off"}"><div><b>${esc(k.titulo)}</b> ${k.ativo ? "" : '<span class="chip">desligada</span>'} ${k.usos ? `<span class="chip ok">usada ${k.usos}x</span>` : ""}<p>${esc(k.conteudo)}</p></div>
      ${admin() ? `<div class="row" style="gap:6px;flex-wrap:nowrap"><button class="btn sm" data-act="editarItem" data-id="${k.id}">Editar</button><button class="btn sm bad" data-act="apagarItem" data-id="${k.id}" aria-label="Apagar ${esc(k.titulo)}">✕</button></div>` : "<span></span>"}</div>`).join("")
      || `<div class="empty">${S.kb.length ? "Nada encontrado." : "A base está vazia. Comece pelas perguntas mais comuns: horário, endereço, formas de pagamento, entrega, preços."}</div>`;
  }
  $("#kBusca").addEventListener("input", desenhaBase);
  const dItem = $("#dItem"); let itemId = null, lacDoItem = null;
  function editarItem(id, titulo = "") {
    const k = id ? S.kb.find((x) => x.id === id) : { titulo, conteudo: "", ativo: 1 }; itemId = id || null; lacDoItem = null;
    $("#diT").textContent = id ? "Editar resposta" : "Nova pergunta e resposta"; $("#iTit").value = k.titulo; $("#iCon").value = k.conteudo; $("#iAtv").checked = !!k.ativo; $("#iErr").textContent = "";
    dItem.showModal(); (titulo ? $("#iCon") : $("#iTit")).focus();
  }
  $("#fItem").addEventListener("submit", async (e) => {
    if (e.submitter?.value !== "ok") return; e.preventDefault();
    try {
      await api(itemId ? "PUT" : "POST", itemId ? `conhecimento/${itemId}` : "conhecimento", { titulo: $("#iTit").value, conteudo: $("#iCon").value, ativo: $("#iAtv").checked });
      if (lacDoItem) await api("DELETE", `lacunas/${lacDoItem}`).catch(() => {});
      lacDoItem = null; dItem.close(); toast("Resposta salva. O assistente já usa a partir de agora."); await base();
    } catch (x) { $("#iErr").textContent = x.message; }
  });
  const dImp = $("#dImp");
  $("#fImp").addEventListener("submit", async (e) => {
    if (e.submitter?.value !== "ok") return; e.preventDefault();
    try { const r = await api("POST", "conhecimento/importar", { texto: $("#impTxt").value }); dImp.close(); $("#impTxt").value = ""; toast(`${r.importados} respostas importadas.`); await base(); }
    catch (x) { $("#impErr").textContent = x.message; }
  });

  // ---------- testar ----------
  function desenhaTeste() {
    const saud = S.ag.saudacao || `Olá! Eu sou ${S.ag.nome_agente}, assistente virtual da ${S.ag.empresa}. Como posso ajudar?`;
    $("#tMsgs").innerHTML = `<div class="b robo"><span class="quem">${esc(S.ag.nome_agente)}</span>${esc(saud)}</div>` + S.teste.map((m) => m.autor === "cliente" ? `<div class="b cliente">${esc(m.texto)}</div>`
      : `<div class="b robo"><span class="quem">${esc(S.ag.nome_agente)}</span>${esc(m.texto)}${m.fontes?.length ? `<div class="fontes">${m.fontes.map((f) => `<span class="chip">📄 ${esc(f.titulo)}</span>`).join("")}</div>` : ""}</div>${m.humano ? `<div class="b sistema">Aqui a conversa passaria para a equipe (${esc(MOTIVO[m.motivo] || m.motivo)}).</div>` : ""}`).join("");
    $("#tMsgs").scrollTop = $("#tMsgs").scrollHeight;
    return Promise.resolve();
  }
  $("#fTeste").addEventListener("submit", async (e) => {
    e.preventDefault(); const t = $("#tTexto"), texto = t.value.trim(); if (!texto) return;
    const hist = S.teste.map((m) => ({ autor: m.autor, texto: m.texto }));
    S.teste.push({ autor: "cliente", texto }); t.value = ""; desenhaTeste();
    $("#tMsgs").insertAdjacentHTML("beforeend", '<div class="b sistema" id="pensando">digitando…</div>');
    try { const r = await api("POST", "testar", { texto, historico: hist }); S.teste.push({ autor: "robo", texto: r.resposta, fontes: r.fontes, humano: r.status === "humano", motivo: r.motivo }); }
    catch (x) { falhou(x); S.teste.pop(); }
    desenhaTeste(); t.focus();
  });

  // ---------- relatórios ----------
  async function relatorio() {
    if (!$("#rDe").value) { const h = hojeBR(), d = new Date(h + "T12:00:00Z"); d.setUTCDate(d.getUTCDate() - 29); $("#rDe").value = d.toISOString().slice(0, 10); $("#rAte").value = h; }
    const r = await api("GET", `relatorio?de=${$("#rDe").value}&ate=${$("#rAte").value}`);
    const n = r.por_dia.reduce((s, d) => s + d.n, 0), t = r.por_dia.reduce((s, d) => s + (d.t || 0), 0);
    $("#rKpis").innerHTML = [["Conversas", n], ["Resolvidas pelo assistente", n ? `${Math.round(((n - t) / n) * 100)}%` : "—"], ["Passaram para a equipe", t], ["Mensagens de clientes", r.mensagens.cliente || 0], ["Respostas do assistente", r.mensagens.robo || 0], ["Respostas da equipe", r.mensagens.humano || 0]]
      .map(([l, v]) => `<div class="card kpi"><div class="l">${l}</div><div class="v">${esc(v)}</div></div>`).join("");
    const mx = Math.max(1, ...r.por_dia.map((d) => d.n));
    $("#rDias").innerHTML = r.por_dia.length ? r.por_dia.map((d) => `<div class="c" title="${d.dia.slice(8)}/${d.dia.slice(5, 7)}: ${d.n} conversa(s), ${d.t || 0} com a equipe"><i class="t" style="height:${((d.t || 0) / mx) * 100}%"></i><i style="height:${((d.n - (d.t || 0)) / mx) * 100}%"></i><span>${d.dia.slice(8)}</span></div>`).join("") : '<p class="mute small">Sem conversas no período.</p>';
    $("#rMot").innerHTML = r.por_motivo.map((m) => `<tr><td>${esc(MOTIVO[m.motivo] || m.motivo)}</td><td class="n">${m.n}</td></tr>`).join("") || '<tr><td class="mute">Sem conversas no período.</td></tr>';
    $("#rTop").innerHTML = r.mais_usados.map((k, i) => `<tr><td class="mute">${i + 1}</td><td>${esc(k.titulo)}</td><td class="n">${k.usos}x</td></tr>`).join("") || '<tr><td class="mute">Ainda sem uso.</td></tr>';
  }

  // ---------- configuração ----------
  async function preencheConfig() {
    const a = S.ag;
    $("#gAtivo").checked = !!a.ativo; $("#gNome").value = a.nome_agente; $("#gEmp").value = a.empresa; $("#gSobre").value = a.sobre || ""; $("#gTom").value = a.tom; $("#gCor").value = a.cor;
    $("#gSaud").value = a.saudacao || ""; $("#gInstr").value = a.instrucoes || ""; $("#gPal").value = a.palavras_humano || ""; $("#gMsgH").value = a.msg_humano || ""; $("#gHor").value = a.horario_humano || ""; $("#gSlug").value = a.slug; $("#gErr").textContent = "";
    $("#cLink").textContent = a.chat_url; $("#cWidget").textContent = a.widget;
    const w = a.whatsapp;
    $("#cWhats").innerHTML = w.conectado ? `<p><span class="chip ok">Conectado</span> ${esc(w.numero || "")}</p><p class="small mute" style="margin-top:6px">As mensagens do WhatsApp chegam em Conversas e o assistente responde por lá.</p>`
      : w.ligado ? `<p><span class="chip warn">Em conexão</span> ${esc(w.numero || "")}</p><p class="small mute" style="margin-top:6px">O número já está cadastrado. Falta a LLD Works concluir a liberação na Meta.</p>`
      : `<p><span class="chip">Não conectado</span></p><p class="small mute" style="margin-top:6px">A LLD Works liga o número da sua empresa à API oficial do WhatsApp (Meta). Depois disso o assistente responde no WhatsApp também, com a mesma base e o mesmo painel.</p>`;
  }
  $("#fCfg").addEventListener("submit", async (e) => {
    e.preventDefault(); $("#gErr").textContent = "";
    try {
      await api("PUT", "agente", { ativo: $("#gAtivo").checked, nome_agente: $("#gNome").value, empresa: $("#gEmp").value, sobre: $("#gSobre").value, tom: $("#gTom").value, cor: $("#gCor").value, saudacao: $("#gSaud").value, instrucoes: $("#gInstr").value, palavras_humano: $("#gPal").value, msg_humano: $("#gMsgH").value, horario_humano: $("#gHor").value, slug: $("#gSlug").value.trim().toLowerCase() });
      await carregaAgente(); await preencheConfig(); toast("Configuração salva.");
    } catch (x) { $("#gErr").textContent = x.message; }
  });

  // ---------- ações ----------
  document.addEventListener("click", (e) => {
    const b = e.target.closest("[data-act]"); if (!b) return;
    const id = +b.dataset.id;
    const acoes = {
      voltar: async () => { S.atual = null; $("#inbox").classList.remove("aberta"); },
      acao: async () => { const a = b.dataset.acao; if (a === "encerrar" && !confirm("Encerrar esta conversa? Se o cliente escrever de novo, começa uma nova.")) return; await api("POST", `conversas/${S.atual}/acao`, { acao: a }); toast({ assumir: "Você assumiu a conversa.", devolver: "O assistente voltou a responder.", encerrar: "Conversa encerrada." }[a]); await abrir(S.atual); await conversas(); },
      contato: async () => { $("#ctNome").value = S.conv.contato.nome || ""; $("#ctObs").value = S.conv.contato.observacoes || ""; $("#ctErr").textContent = ""; dCont.showModal(); },
      novoItem: async () => editarItem(null), editarItem: async () => editarItem(id),
      apagarItem: async () => { const k = S.kb.find((x) => x.id === id); if (!confirm(`Apagar “${k.titulo}”?`)) return; await api("DELETE", `conhecimento/${id}`); toast("Resposta apagada."); await base(); },
      importar: async () => { $("#impErr").textContent = ""; dImp.showModal(); },
      responderLac: async () => { const l = S.lac.find((x) => x.id === id); editarItem(null, l.pergunta); lacDoItem = id; },
      ignorarLac: async () => { await api("DELETE", `lacunas/${id}`); await base(); },
      limparTeste: async () => { S.teste = []; desenhaTeste(); },
      relatorio,
      copiar: async () => { const t = $("#" + b.dataset.alvo).textContent; try { await navigator.clipboard.writeText(t); toast("Copiado."); } catch { toast("Selecione e copie o texto."); } },
    };
    if (acoes[b.dataset.act]) acoes[b.dataset.act]().catch(falhou);
  });

  setInterval(() => { if (!document.hidden && abaAtual() === "conversas" && !$("dialog[open]")) conversas(true).catch(() => {}); }, 5000);
  carregaAgente().then(() => { api("GET", "conhecimento").then((k) => (S.kb = k)).catch(() => {}); aba(location.hash.slice(1) || "conversas"); }).catch((e) => { $("#nomeTopo").textContent = "Erro ao carregar"; falhou(e); });
})();
