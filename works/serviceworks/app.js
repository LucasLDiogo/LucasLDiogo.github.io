// ServiceWorks — painel da empresa. Fala só com /api/admin/* (o roteador confere a sessão e diz quem é a empresa).
"use strict";
(() => {
  const $ = (s, r = document) => r.querySelector(s), $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const brl = (c) => (Number(c || 0) / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
  const reais = (v) => { const s = String(v ?? "").trim().replace(/[^\d,.-]/g, ""); if (!s) return null; const n = Number(s.includes(",") ? s.replace(/\./g, "").replace(",", ".") : s); return Number.isFinite(n) && n >= 0 ? Math.round(n * 100) : NaN; };
  const centsTxt = (c) => (c == null ? "" : (c / 100).toFixed(2).replace(".", ","));
  const hojeBR = () => new Intl.DateTimeFormat("en-CA", { timeZone: "America/Sao_Paulo" }).format(new Date());
  const agoraHM = () => new Intl.DateTimeFormat("pt-BR", { timeZone: "America/Sao_Paulo", hour: "2-digit", minute: "2-digit", hourCycle: "h23" }).format(new Date());
  const somaDias = (d, n) => { const x = new Date(d + "T12:00:00Z"); x.setUTCDate(x.getUTCDate() + n); return x.toISOString().slice(0, 10); };
  const diaSem = (d) => new Date(d + "T12:00:00Z").getUTCDay();
  const fmtDia = (d, longo = true) => new Date(d + "T12:00:00Z").toLocaleDateString("pt-BR", { timeZone: "UTC", weekday: longo ? "long" : "short", day: "2-digit", month: "2-digit" });
  const fmtDH = (s) => (s ? `${s.slice(8, 10)}/${s.slice(5, 7)} ${s.slice(11, 16)}` : "");
  const min = (t) => { const [h, m] = t.split(":").map(Number); return h * 60 + m; };
  const hm = (m) => `${String(Math.floor(m / 60)).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`;
  const fmtWhats = (w) => { const d = String(w || "").replace(/^55/, ""); return d.length === 11 ? `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}` : d.length === 10 ? `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}` : w || ""; };
  const waLink = (w, txt = "") => `https://wa.me/${w}${txt ? "?text=" + encodeURIComponent(txt) : ""}`;
  const DIAS = ["Domingo", "Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado"];
  const ST = { confirmado: ["Confirmado", "p"], concluido: ["Concluído", "ok"], faltou: ["Faltou", "bad"], cancelado: ["Cancelado", ""] };
  const stChip = (s) => `<span class="chip ${ST[s]?.[1] || ""}">${ST[s]?.[0] || esc(s)}</span>`;

  let tt;
  function toast(m, erro = false) { const t = $("#toast"); t.textContent = m; t.classList.toggle("err", erro); t.classList.add("on"); clearTimeout(tt); tt = setTimeout(() => t.classList.remove("on"), 3200); }

  async function api(metodo, caminho, corpo) {
    const r = await fetch("/api/admin/" + caminho, { method: metodo, headers: corpo ? { "Content-Type": "application/json" } : {}, body: corpo ? JSON.stringify(corpo) : undefined, credentials: "same-origin" });
    if (r.status === 401) { location.href = "/entrar"; throw new Error("Sessão expirada. Entre de novo."); }
    let d = null; try { d = await r.json(); } catch {}
    if (!r.ok) { const e = new Error(d?.erro || "Não foi possível concluir. Tente de novo."); e.status = r.status; throw e; }
    return d;
  }
  // Formulário de <dialog>: o botão value="ok" chama fn; o erro aparece no .err do diálogo.
  function aoEnviar(dlg, fn) {
    const f = $("form", dlg);
    f.addEventListener("submit", async (e) => {
      if (e.submitter?.value !== "ok") return;
      e.preventDefault();
      const er = $(".err", f); er.textContent = "";
      const b = e.submitter; b.disabled = true;
      try { if ((await fn()) !== false) dlg.close(); } catch (x) { er.textContent = x.message; } finally { b.disabled = false; }
    });
  }

  const S = { emp: null, papel: "admin", servicos: [], profs: [], dia: hojeBR(), agenda: [], bloqueios: [], contatos: [] };
  const admin = () => S.papel === "admin";
  const profNome = (id) => S.profs.find((p) => p.id === id)?.nome || "";
  const linkVitrine = () => `${location.origin}/v/${S.emp.slug}`;

  // ---------- abas ----------
  const CARREGA = { agenda, clientes, servicos, equipe, folgas, relatorios: relatorio, config };
  function aba(v) {
    $$(".nav button").forEach((b) => b.setAttribute("aria-selected", String(b.dataset.v === v)));
    $$(".view").forEach((s) => s.classList.toggle("on", s.id === "v-" + v));
    history.replaceState(null, "", "#" + v);
    CARREGA[v]().catch((e) => toast(e.message, true));
  }
  $(".nav").addEventListener("click", (e) => { const b = e.target.closest("button[data-v]"); if (b) aba(b.dataset.v); });

  async function base() {
    const [emp, srv, prf] = await Promise.all([api("GET", "empresa"), api("GET", "servicos"), api("GET", "profissionais")]);
    S.emp = emp; S.papel = emp.papel; S.servicos = srv; S.profs = prf;
    $("#empNome").textContent = emp.nome;
    const lv = $("#lnkVitrine"); lv.href = linkVitrine(); lv.hidden = false;
    if (!admin()) $$("[data-adm]").forEach((b) => (b.hidden = true));
  }

  // ---------- agenda do dia ----------
  async function agenda() {
    const d = S.dia;
    $("#diaTxt").textContent = (d === hojeBR() ? "Hoje · " : "") + fmtDia(d);
    $("#diaSel").value = d;
    const [ag, blq, res] = await Promise.all([api("GET", `agenda?de=${d}`), api("GET", `bloqueios?de=${d}`), api("GET", `resumo?data=${d}`)]);
    S.agenda = ag; S.bloqueios = blq.filter((b) => b.inicio < somaDias(d, 1) + "T00:00");
    const aConfirmar = ag.filter((a) => a.status === "confirmado").length, online = ag.filter((a) => a.origem === "vitrine" && a.status !== "cancelado").length;
    $("#kpis").innerHTML = [
      ["Atendimentos no dia", res.atendimentos, `${aConfirmar} ainda por atender`],
      ["Faturamento previsto", brl(res.previsto_centavos), "confirmados + concluídos"],
      ["Agenda ocupada", res.ocupacao_pct + "%", `${res.profissionais} profissional(is) atendendo`],
      ["Marcados online", online, "pela vitrine, neste dia"],
      ["Faltas no mês", res.faltas_mes, "clientes que não vieram"],
    ].map(([l, v, s]) => `<div class="card kpi"><div class="l">${l}</div><div class="v">${esc(v)}</div><div class="tiny mute">${s}</div></div>`).join("");
    desenhaAgenda();
  }
  function desenhaAgenda() {
    const d = S.dia, ds = diaSem(d), el = $("#ag");
    const profs = S.profs.filter((p) => p.ativo);
    if (!profs.length) { el.style.display = "block"; el.innerHTML = `<div class="empty" style="margin:16px">Nenhum profissional cadastrado. ${admin() ? '<button class="btn sm pri" data-act="irEquipe">Cadastrar equipe</button>' : ""}</div>`; return; }
    el.style.display = "";
    const turnos = profs.flatMap((p) => p.expedientes.filter((x) => x.dia_semana === ds));
    const ativos = S.agenda.filter((a) => a.status !== "cancelado");
    let ini = Math.min(8 * 60, ...turnos.map((t) => min(t.inicio)), ...ativos.map((a) => min(a.inicio.slice(11, 16))));
    let fim = Math.max(18 * 60, ...turnos.map((t) => min(t.fim)), ...ativos.map((a) => (a.fim.slice(0, 10) > d ? 24 * 60 : min(a.fim.slice(11, 16)))));
    ini = Math.floor(ini / 60) * 60; fim = Math.min(24 * 60, Math.ceil(fim / 60) * 60);
    const PX = 1.3, alt = (fim - ini) * PX, y = (m) => (m - ini) * PX, passo = S.emp.intervalo_min || 15;
    const corta = (s) => (s.slice(0, 10) < d ? ini : s.slice(0, 10) > d ? fim : Math.max(ini, Math.min(fim, min(s.slice(11, 16)))));
    const agora = d === hojeBR() ? min(agoraHM()) : d < hojeBR() ? 24 * 60 : null;
    el.style.setProperty("--n", profs.length);
    let h = `<div class="hd c0"></div>` + profs.map((p) => `<div class="hd"><span class="av">${esc(p.nome.slice(0, 2).toUpperCase())}</span>${esc(p.nome)}</div>`).join("");
    h += `<div class="horas" style="height:${alt}px">` + Array.from({ length: (fim - ini) / 60 }, (_, i) => `<span>${hm(ini + i * 60)}</span>`).join("") + `</div>`;
    for (const p of profs) {
      const tp = p.expedientes.filter((x) => x.dia_semana === ds).map((t) => [min(t.inicio), min(t.fim)]).sort((a, b) => a[0] - b[0]);
      const ev = ativos.filter((a) => a.profissional_id === p.id);
      const bl = S.bloqueios.filter((b) => b.profissional_id === null || b.profissional_id === p.id);
      let c = `<div class="col" style="height:${alt}px">`, cur = ini;
      for (const [a, b] of tp) { if (a > cur) c += `<div class="fora" style="top:${y(cur)}px;height:${(a - cur) * PX}px"></div>`; cur = Math.max(cur, b); }
      if (cur < fim) c += `<div class="fora" style="top:${y(cur)}px;height:${(fim - cur) * PX}px"></div>`;
      const ocup = [...ev, ...bl].map((o) => [corta(o.inicio), corta(o.fim)]);
      for (const [a, b] of tp) for (let t = a; t + passo <= b; t += passo) {
        if (ocup.some(([o1, o2]) => t < o2 && o1 < t + passo) || (agora !== null && t + passo <= agora)) continue;
        c += `<button class="livre" style="top:${y(t)}px;height:${passo * PX}px" data-act="slot" data-p="${p.id}" data-h="${hm(t)}" aria-label="Agendar ${hm(t)} com ${esc(p.nome)}"></button>`;
      }
      for (const b of bl) { const a1 = corta(b.inicio), a2 = corta(b.fim); if (a2 > a1) c += `<div class="bloq" style="top:${y(a1)}px;height:${(a2 - a1) * PX}px">Bloqueado${b.motivo ? " · " + esc(b.motivo) : ""}</div>`; }
      for (const a of ev) {
        const a1 = corta(a.inicio), a2 = corta(a.fim), hgt = Math.max(22, (a2 - a1) * PX - 3);
        c += `<button class="ev ${a.status}" style="top:${y(a1) + 1}px;height:${hgt}px" data-act="ev" data-id="${a.id}"><b>${a.inicio.slice(11, 16)} ${esc(a.cliente)}</b><span class="s">${esc(a.servico)} · ${brl(a.valor_centavos)}</span>${a.origem === "vitrine" ? '<span class="on">online</span>' : ""}</button>`;
      }
      if (d === hojeBR() && agora >= ini && agora <= fim) c += `<div class="agora" style="top:${y(agora)}px"></div>`;
      h += c + `</div>`;
    }
    el.innerHTML = h;
    if (d === hojeBR()) el.scrollTop = Math.max(0, y(agora) - 120);
  }
  $("#diaSel").addEventListener("change", (e) => { if (e.target.value) { S.dia = e.target.value; agenda().catch((x) => toast(x.message, true)); } });

  // ---------- novo agendamento ----------
  const dAg = $("#dlgAg");
  function opcoesServico(sel, atual) { sel.innerHTML = S.servicos.filter((s) => s.ativo || s.id === atual).map((s) => `<option value="${s.id}">${esc(s.nome)} · ${s.duracao_min} min · ${brl(s.promo_centavos ?? s.preco_centavos)}</option>`).join(""); if (atual) sel.value = atual; }
  function opcoesProf(sel, servico, atual) {
    const ativos = S.profs.filter((p) => p.ativo), lista = ativos.filter((p) => !servico || p.servicos.includes(+servico));
    sel.innerHTML = (lista.length ? lista : ativos).map((p) => `<option value="${p.id}">${esc(p.nome)}</option>`).join("");
    if (atual && [...sel.options].some((o) => +o.value === +atual)) sel.value = atual;
  }
  async function slotsLivres() {
    const box = $("#agSlots"), s = $("#agSrv").value, p = $("#agProf").value, d = $("#agData").value;
    if (!s || !p || !d) { box.innerHTML = ""; return; }
    box.innerHTML = '<span class="small mute">Buscando…</span>';
    try {
      const r = await api("GET", `livres?data=${d}&servico=${s}&profissional=${p}`);
      const agora = d === hojeBR() ? agoraHM() : "", hs = r.horarios.filter((x) => x > agora);
      box.innerHTML = hs.length ? hs.map((x) => `<button type="button" data-h="${x}" aria-pressed="${x === $("#agHora").value}">${x}</button>`).join("") : '<span class="small mute">Sem horário livre neste dia. Marque “Encaixe” para agendar assim mesmo.</span>';
    } catch (e) { box.innerHTML = `<span class="small" style="color:var(--bad)">${esc(e.message)}</span>`; }
  }
  $("#agSlots").addEventListener("click", (e) => { const b = e.target.closest("button[data-h]"); if (!b) return; $("#agHora").value = b.dataset.h; $$("#agSlots button").forEach((x) => x.setAttribute("aria-pressed", String(x === b))); });
  $("#agSrv").addEventListener("change", () => { opcoesProf($("#agProf"), $("#agSrv").value, $("#agProf").value); slotsLivres(); });
  $("#agProf").addEventListener("change", slotsLivres);
  $("#agData").addEventListener("change", slotsLivres);
  const cliDoCampo = () => { const v = $("#agCli").value.trim(); return S.contatos.find((c) => `${c.nome} · ${fmtWhats(c.whatsapp)}` === v); };
  $("#agCli").addEventListener("input", () => { $("#agNovoCli").hidden = !!cliDoCampo(); });
  async function abrirNovo(prof, hora) {
    if (!S.servicos.some((s) => s.ativo)) { toast("Cadastre ao menos um serviço antes de agendar.", true); return; }
    opcoesServico($("#agSrv"));
    opcoesProf($("#agProf"), $("#agSrv").value, prof);
    $("#agData").value = S.dia; $("#agHora").value = hora || ""; $("#agCli").value = ""; $("#agNome").value = ""; $("#agWhats").value = ""; $("#agObs").value = ""; $("#agEnc").checked = false;
    $("#agNovoCli").hidden = false; $("#agErr").textContent = "";
    dAg.showModal(); slotsLivres();
    try { S.contatos = await api("GET", "contatos?q="); $("#agCliLista").innerHTML = S.contatos.map((c) => `<option value="${esc(c.nome)} · ${esc(fmtWhats(c.whatsapp))}">`).join(""); } catch {}
  }
  aoEnviar(dAg, async () => {
    const c = cliDoCampo(), corpo = { servico_id: +$("#agSrv").value, profissional_id: +$("#agProf").value, data: $("#agData").value, hora: $("#agHora").value, observacoes: $("#agObs").value, encaixe: $("#agEnc").checked };
    if (c) corpo.contato_id = c.id;
    else { corpo.nome = $("#agNome").value.trim(); corpo.whatsapp = $("#agWhats").value; if (!corpo.nome || !corpo.whatsapp) throw new Error("Escolha um cliente da lista ou informe nome e WhatsApp."); }
    if (!corpo.hora) throw new Error("Escolha o horário.");
    try { await api("POST", "agendamentos", corpo); }
    catch (e) { if (e.status === 409) throw new Error("Esse horário já está ocupado. Escolha outro ou marque “Encaixe”."); throw e; }
    toast("Agendado."); S.dia = corpo.data; await agenda();
  });

  // ---------- detalhe do agendamento ----------
  const dEv = $("#dlgEv"); let evAtual = null;
  function abrirEv(id) {
    const a = S.agenda.find((x) => x.id === id); if (!a) return; evAtual = a;
    $("#evTit").textContent = `${a.inicio.slice(11, 16)}–${a.fim.slice(11, 16)} · ${a.cliente}`;
    $("#evSt").innerHTML = stChip(a.status);
    $("#evInfo").innerHTML = `${esc(a.servico)} com ${esc(a.profissional)} · ${brl(a.valor_centavos)}<br>WhatsApp ${esc(fmtWhats(a.whatsapp))} · código ${esc(a.codigo)} · marcado ${a.origem === "vitrine" ? "pela vitrine" : "no painel"}`;
    $("#evWhats").href = waLink(a.whatsapp, `Olá, ${a.cliente.split(" ")[0]}! Confirmando ${a.servico} com ${a.profissional} em ${fmtDia(a.inicio.slice(0, 10), false)} às ${a.inicio.slice(11, 16)}. ${S.emp.nome}`);
    $("#evData").value = a.inicio.slice(0, 10); $("#evHora").value = a.inicio.slice(11, 16);
    opcoesProf($("#evProf"), a.servico_id, a.profissional_id);
    $("#evObs").value = a.observacoes || ""; $("#evErr").textContent = "";
    $$("#fEv [data-ev]").forEach((b) => { if (ST[b.dataset.ev]) b.hidden = b.dataset.ev === a.status; });
    dEv.showModal();
  }
  $("#fEv").addEventListener("click", async (e) => {
    const b = e.target.closest("[data-ev]"); if (!b || !evAtual) return;
    const ac = b.dataset.ev, er = $("#evErr"); er.textContent = "";
    if (ac === "cancelado" && !confirm("Cancelar este agendamento? O horário fica livre na vitrine.")) return;
    b.disabled = true;
    try {
      if (ST[ac]) { await api("PUT", `agendamentos/${evAtual.id}`, { status: ac }); toast(ST[ac][0] + "."); }
      else if (ac === "obs") { await api("PUT", `agendamentos/${evAtual.id}`, { observacoes: $("#evObs").value }); toast("Observação salva."); }
      else if (ac === "remarcar") {
        const corpo = { data: $("#evData").value, hora: $("#evHora").value, profissional_id: +$("#evProf").value };
        try { await api("PUT", `agendamentos/${evAtual.id}`, corpo); }
        catch (x) { if (x.status !== 409 || !confirm("O novo horário está ocupado. Agendar como encaixe mesmo assim?")) throw x; await api("PUT", `agendamentos/${evAtual.id}`, { ...corpo, encaixe: true }); }
        toast("Remarcado."); S.dia = corpo.data;
      }
      dEv.close(); await agenda();
    } catch (x) { er.textContent = x.message; } finally { b.disabled = false; }
  });

  // ---------- clientes ----------
  let buscaT;
  $("#cliBusca").addEventListener("input", () => { clearTimeout(buscaT); buscaT = setTimeout(() => clientes().catch((e) => toast(e.message, true)), 250); });
  async function clientes() {
    const q = $("#cliBusca").value.trim(), lst = await api("GET", "contatos?q=" + encodeURIComponent(q));
    $("#cliLista").innerHTML = lst.length ? lst.map((c) => `<tr><td><b>${esc(c.nome)}</b>${c.observacoes ? `<div class="tiny mute">${esc(c.observacoes.slice(0, 80))}</div>` : ""}</td><td><a href="${waLink(c.whatsapp)}" target="_blank" rel="noopener">${esc(fmtWhats(c.whatsapp))}</a></td><td class="n">${c.atendimentos}</td><td class="n">${c.faltas ? `<span class="chip bad">${c.faltas}</span>` : 0}</td><td>${c.ultimo ? fmtDH(c.ultimo) : '<span class="mute">—</span>'}</td><td class="n"><button class="btn sm" data-act="cli" data-id="${c.id}">Abrir</button></td></tr>`).join("")
      : `<tr><td colspan="6"><div class="empty">${q ? "Nenhum cliente encontrado." : "Nenhum cliente ainda. Eles entram aqui ao agendar."}</div></td></tr>`;
  }
  const dCli = $("#dlgCli"); let cliId = null;
  async function abrirCli(id) {
    cliId = id; $("#cliErr").textContent = ""; $("#kHist").innerHTML = "";
    if (id) {
      const c = await api("GET", `contatos/${id}`);
      $("#cliTit").textContent = c.nome; $("#kNome").value = c.nome; $("#kWhats").value = fmtWhats(c.whatsapp); $("#kObs").value = c.observacoes || "";
      $("#kWa").href = waLink(c.whatsapp); $("#kWa").hidden = false;
      $("#kHist").innerHTML = `<h3 style="margin-top:16px">Histórico</h3>` + (c.historico.length ? `<div class="scroll"><table><tbody>${c.historico.map((a) => `<tr><td>${fmtDH(a.inicio)}</td><td>${esc(a.servico)}</td><td>${esc(a.profissional)}</td><td class="n">${brl(a.valor_centavos)}</td><td>${stChip(a.status)}</td></tr>`).join("")}</tbody></table></div>` : '<p class="mute small">Sem agendamentos.</p>');
    } else { $("#cliTit").textContent = "Novo cliente"; $("#kNome").value = ""; $("#kWhats").value = ""; $("#kObs").value = ""; $("#kWa").hidden = true; }
    dCli.showModal();
  }
  aoEnviar(dCli, async () => {
    const corpo = { nome: $("#kNome").value.trim(), whatsapp: $("#kWhats").value, observacoes: $("#kObs").value };
    if (cliId) await api("PUT", `contatos/${cliId}`, corpo); else await api("POST", "contatos", corpo);
    toast("Cliente salvo."); await clientes();
  });

  // ---------- serviços ----------
  async function servicos() {
    S.servicos = await api("GET", "servicos");
    $("#srvLista").innerHTML = S.servicos.length ? S.servicos.map((s) => `<tr class="${s.ativo ? "" : "off"}"><td><b>${esc(s.nome)}</b>${s.combo ? ' <span class="chip p">combo</span>' : ""}${s.descricao ? `<div class="tiny mute">${esc(s.descricao)}</div>` : ""}</td><td>${esc(s.categoria || "—")}</td><td class="n">${s.duracao_min} min</td><td class="n">${brl(s.preco_centavos)}</td><td class="n">${s.promo_centavos != null ? brl(s.promo_centavos) : "—"}</td><td>${s.ativo ? '<span class="chip ok">Na vitrine</span>' : '<span class="chip">Arquivado</span>'}</td>
      <td class="n">${admin() ? `<button class="btn sm" data-act="srv" data-id="${s.id}">Editar</button> ${s.ativo ? `<button class="btn sm bad" data-act="srvDel" data-id="${s.id}">Arquivar</button>` : `<button class="btn sm" data-act="srvAtivar" data-id="${s.id}">Reativar</button>`}` : ""}</td></tr>`).join("")
      : `<tr><td colspan="7"><div class="empty">Nenhum serviço cadastrado.</div></td></tr>`;
  }
  const dSrv = $("#dlgSrv"); let srvId = null;
  function abrirSrv(id) {
    srvId = id; const s = S.servicos.find((x) => x.id === id) || { duracao_min: 30, ativo: 1, ordem: S.servicos.length + 1 };
    $("#srvTit").textContent = id ? "Editar serviço" : "Novo serviço";
    $("#sNome").value = s.nome || ""; $("#sCat").value = s.categoria || ""; $("#sDur").value = s.duracao_min; $("#sPreco").value = centsTxt(s.preco_centavos); $("#sPromo").value = centsTxt(s.promo_centavos);
    $("#sOrdem").value = s.ordem ?? 0; $("#sDesc").value = s.descricao || ""; $("#sCombo").checked = !!s.combo; $("#sAtivo").checked = !!s.ativo; $("#srvErr").textContent = "";
    dSrv.showModal();
  }
  const corpoSrv = (s, extra = {}) => ({ nome: s.nome, categoria: s.categoria, descricao: s.descricao, duracao_min: s.duracao_min, preco_centavos: s.preco_centavos, promo_centavos: s.promo_centavos, combo: !!s.combo, ativo: !!s.ativo, ordem: s.ordem, ...extra });
  aoEnviar(dSrv, async () => {
    const preco = reais($("#sPreco").value), promo = reais($("#sPromo").value);
    if (preco == null || Number.isNaN(preco)) throw new Error("Preço inválido. Exemplo: 45,00");
    if (Number.isNaN(promo)) throw new Error("Preço promocional inválido.");
    const corpo = { nome: $("#sNome").value.trim(), categoria: $("#sCat").value.trim(), descricao: $("#sDesc").value.trim(), duracao_min: +$("#sDur").value, preco_centavos: preco, promo_centavos: promo, combo: $("#sCombo").checked, ativo: $("#sAtivo").checked, ordem: +$("#sOrdem").value || 0 };
    if (srvId) await api("PUT", `servicos/${srvId}`, corpo); else await api("POST", "servicos", corpo);
    toast("Serviço salvo."); await servicos();
  });

  // ---------- equipe ----------
  const resumoSemana = (exps) => [1, 2, 3, 4, 5, 6, 0].map((d) => { const t = exps.filter((x) => x.dia_semana === d).map((x) => `${x.inicio}–${x.fim}`).join(", "); return `<div class="row sb small" style="padding:4px 0;border-bottom:1px solid var(--line)"><span>${DIAS[d]}</span><span class="${t ? "" : "mute"}">${t || "folga"}</span></div>`; }).join("");
  async function equipe() {
    [S.profs, S.servicos] = await Promise.all([api("GET", "profissionais"), api("GET", "servicos")]);
    $("#profLista").innerHTML = S.profs.length ? S.profs.map((p) => `<div class="card" style="${p.ativo ? "" : "opacity:.6"}"><div class="row sb"><div><h2>${esc(p.nome)}</h2><p class="small mute">${esc(p.funcao || "")}</p></div>${p.ativo ? '<span class="chip ok">Atendendo</span>' : '<span class="chip">Inativo</span>'}</div>
      <div class="row" style="gap:6px;margin:12px 0">${p.servicos.map((id) => `<span class="chip p">${esc(S.servicos.find((s) => s.id === id)?.nome || "")}</span>`).join("") || '<span class="small mute">Nenhum serviço</span>'}</div>
      ${resumoSemana(p.expedientes)}
      ${admin() ? `<div class="row" style="margin-top:12px;justify-content:flex-end"><button class="btn sm" data-act="prof" data-id="${p.id}">Editar</button>${p.ativo ? `<button class="btn sm bad" data-act="profDel" data-id="${p.id}">Desativar</button>` : ""}</div>` : ""}</div>`).join("")
      : `<div class="empty">Nenhum profissional. Cadastre quem atende para abrir a agenda.</div>`;
  }
  const dProf = $("#dlgProf"); let profId = null;
  const linhaTurno = (a = "09:00", b = "18:00") => `<div class="t"><input type="time" value="${a}" step="300" aria-label="Início do turno"><span class="mute">às</span><input type="time" value="${b}" step="300" aria-label="Fim do turno"><button type="button" class="btn sm ghost" data-turno="tirar" aria-label="Remover turno">✕</button></div>`;
  function abrirProf(id) {
    profId = id;
    const p = S.profs.find((x) => x.id === id) || { ativo: 1, ordem: S.profs.length + 1, servicos: S.servicos.filter((s) => s.ativo).map((s) => s.id), expedientes: [1, 2, 3, 4, 5].flatMap((d) => [{ dia_semana: d, inicio: "09:00", fim: "12:00" }, { dia_semana: d, inicio: "13:00", fim: "18:00" }]) };
    $("#profTit").textContent = id ? "Editar profissional" : "Novo profissional";
    $("#pNome").value = p.nome || ""; $("#pFunc").value = p.funcao || ""; $("#pOrdem").value = p.ordem ?? 0; $("#pAtivo").checked = !!p.ativo; $("#profErr").textContent = "";
    $("#pServ").innerHTML = S.servicos.filter((s) => s.ativo || p.servicos.includes(s.id)).map((s) => `<label class="chk"><input type="checkbox" value="${s.id}" ${p.servicos.includes(s.id) ? "checked" : ""}> ${esc(s.nome)}</label>`).join("") || '<span class="small mute">Cadastre serviços primeiro.</span>';
    $("#pSem").innerHTML = [1, 2, 3, 4, 5, 6, 0].map((d) => `<div class="d" data-dia="${d}"><b class="small" style="padding-top:8px">${DIAS[d]}</b><div><div class="turnos">${p.expedientes.filter((x) => x.dia_semana === d).map((x) => linhaTurno(x.inicio, x.fim)).join("")}</div><div class="row" style="margin-top:4px;gap:4px"><button type="button" class="btn sm ghost" data-turno="mais">+ turno</button>${d === 1 ? '<button type="button" class="btn sm ghost" data-turno="copiar">Repetir de terça a sexta</button>' : ""}</div></div></div>`).join("");
    dProf.showModal();
  }
  $("#pSem").addEventListener("click", (e) => {
    const b = e.target.closest("[data-turno]"); if (!b) return;
    if (b.dataset.turno === "tirar") b.closest(".t").remove();
    else if (b.dataset.turno === "mais") b.closest(".d").querySelector(".turnos").insertAdjacentHTML("beforeend", linhaTurno());
    else { const seg = $$('#pSem [data-dia="1"] .t').map((t) => $$("input", t).map((i) => i.value)); [2, 3, 4, 5].forEach((d) => { $(`#pSem [data-dia="${d}"] .turnos`).innerHTML = seg.map(([a, z]) => linhaTurno(a, z)).join(""); }); }
  });
  aoEnviar(dProf, async () => {
    const expedientes = [];
    for (const d of $$("#pSem .d")) for (const t of $$(".t", d)) {
      const [a, b] = $$("input", t).map((i) => i.value);
      if (!a || !b || b <= a) throw new Error(`${DIAS[+d.dataset.dia]}: o fim do turno precisa ser depois do início.`);
      expedientes.push({ dia_semana: +d.dataset.dia, inicio: a, fim: b });
    }
    for (let dd = 0; dd < 7; dd++) {
      const t = expedientes.filter((x) => x.dia_semana === dd).sort((x, z) => (x.inicio < z.inicio ? -1 : 1));
      for (let i = 1; i < t.length; i++) if (t[i].inicio < t[i - 1].fim) throw new Error(`${DIAS[dd]}: os turnos ${t[i - 1].inicio}–${t[i - 1].fim} e ${t[i].inicio}–${t[i].fim} se sobrepõem.`);
    }
    const corpo = { nome: $("#pNome").value.trim(), funcao: $("#pFunc").value.trim(), ordem: +$("#pOrdem").value || 0, ativo: $("#pAtivo").checked, servicos: $$("#pServ input:checked").map((i) => +i.value), expedientes };
    if (profId) await api("PUT", `profissionais/${profId}`, corpo); else await api("POST", "profissionais", corpo);
    toast("Profissional salvo."); await equipe();
  });

  // ---------- folgas ----------
  async function folgas() {
    if (!S.profs.length) S.profs = await api("GET", "profissionais");
    S.bloqueios = await api("GET", `bloqueios?de=${hojeBR()}`);
    $("#blqLista").innerHTML = S.bloqueios.length ? S.bloqueios.map((b) => `<tr><td>${fmtDH(b.inicio)}</td><td>${fmtDH(b.fim)}</td><td>${b.profissional_id ? esc(profNome(b.profissional_id)) : "<b>Empresa toda</b>"}</td><td>${esc(b.motivo || "—")}</td><td class="n"><button class="btn sm bad" data-act="blqDel" data-id="${b.id}">Remover</button></td></tr>`).join("")
      : `<tr><td colspan="5"><div class="empty">Nenhuma folga ou bloqueio daqui para frente.</div></td></tr>`;
  }
  const dBlq = $("#dlgBlq");
  function abrirBlq() {
    $("#bProf").innerHTML = `<option value="">Empresa toda (feriado, fechado)</option>` + S.profs.filter((p) => p.ativo).map((p) => `<option value="${p.id}">${esc(p.nome)}</option>`).join("");
    const d = hojeBR(); $("#bIni").value = `${d}T08:00`; $("#bFim").value = `${d}T20:00`; $("#bMot").value = ""; $("#blqErr").textContent = "";
    dBlq.showModal();
  }
  aoEnviar(dBlq, async () => {
    await api("POST", "bloqueios", { profissional_id: $("#bProf").value ? +$("#bProf").value : null, inicio: $("#bIni").value.slice(0, 16), fim: $("#bFim").value.slice(0, 16), motivo: $("#bMot").value.trim() });
    toast("Horário bloqueado."); await folgas();
  });

  // ---------- relatórios ----------
  async function relatorio() {
    if (!$("#relDe").value) { $("#relDe").value = hojeBR().slice(0, 8) + "01"; $("#relAte").value = hojeBR(); }
    const r = await api("GET", `relatorio?de=${$("#relDe").value}&ate=${$("#relAte").value}`);
    const st = Object.fromEntries(r.por_status.map((x) => [x.status, x])), n = (s) => st[s]?.n || 0, v = (s) => st[s]?.v || 0;
    const taxa = n("concluido") + n("faltou") ? Math.round((100 * n("faltou")) / (n("concluido") + n("faltou"))) : 0;
    $("#relKpis").innerHTML = [["Atendidos", n("concluido"), brl(v("concluido")) + " faturado"], ["A atender", n("confirmado"), brl(v("confirmado")) + " previsto"], ["Faltas", n("faltou"), `${taxa}% de quem deveria vir`], ["Cancelados", n("cancelado"), brl(v("cancelado")) + " que não entrou"]]
      .map(([l, a, b]) => `<div class="card kpi"><div class="l">${l}</div><div class="v">${a}</div><div class="tiny mute">${b}</div></div>`).join("");
    const barras = (lst) => { const mx = Math.max(1, ...lst.map((x) => x.n)); return lst.length ? lst.map((x) => `<div style="margin-bottom:10px"><div class="row sb small"><b>${esc(x.nome)}</b><span>${x.n} · ${brl(x.v)}</span></div><div class="bar"><i style="width:${(100 * x.n) / mx}%"></i></div></div>`).join("") : '<p class="mute small">Sem atendimentos no período.</p>'; };
    $("#relSrv").innerHTML = barras(r.servicos); $("#relProf").innerHTML = barras(r.profissionais);
  }
  $("#relForm").addEventListener("submit", (e) => { e.preventDefault(); relatorio().catch((x) => toast(x.message, true)); });

  // ---------- configurações ----------
  async function config() {
    const e = (S.emp = await api("GET", "empresa"));
    $("#cNome").value = e.nome; $("#cSeg").value = e.segmento; $("#cWhats").value = e.whatsapp ? fmtWhats(e.whatsapp) : ""; $("#cEnd").value = e.endereco || ""; $("#cSobre").value = e.sobre || ""; $("#cCor").value = e.cor;
    $("#cSlug").value = e.slug; $("#cAnt").value = e.antecedencia_min; $("#cJan").value = e.janela_dias; $("#cInt").value = String(e.intervalo_min); $("#cAtiva").checked = !!e.vitrine_ativa;
    $("#cfgAbrir").href = linkVitrine(); $("#cfgErr").textContent = "";
    $$("#cfgForm input,#cfgForm select,#cfgForm textarea").forEach((i) => (i.disabled = !admin()));
  }
  $("#cfgForm").addEventListener("submit", async (e) => {
    e.preventDefault(); const er = $("#cfgErr"); er.textContent = "";
    const corpo = { nome: $("#cNome").value.trim(), segmento: $("#cSeg").value, whatsapp: $("#cWhats").value.trim() || null, endereco: $("#cEnd").value.trim(), sobre: $("#cSobre").value.trim(), cor: $("#cCor").value, slug: $("#cSlug").value.trim().toLowerCase(), antecedencia_min: +$("#cAnt").value, janela_dias: +$("#cJan").value, intervalo_min: +$("#cInt").value, vitrine_ativa: $("#cAtiva").checked };
    try { await api("PUT", "empresa", corpo); await config(); $("#empNome").textContent = S.emp.nome; $("#lnkVitrine").href = linkVitrine(); toast("Configurações salvas."); }
    catch (x) { er.textContent = x.message; }
  });

  // ---------- ações ----------
  document.addEventListener("click", async (e) => {
    const b = e.target.closest("[data-act]"); if (!b) return;
    const id = +b.dataset.id, ac = b.dataset.act;
    try {
      if (ac === "dia") { S.dia = somaDias(S.dia, +b.dataset.d); await agenda(); }
      else if (ac === "hoje") { S.dia = hojeBR(); await agenda(); }
      else if (ac === "novo") await abrirNovo();
      else if (ac === "slot") await abrirNovo(+b.dataset.p, b.dataset.h);
      else if (ac === "ev") abrirEv(id);
      else if (ac === "irEquipe") aba("equipe");
      else if (ac === "cliNovo") await abrirCli(null);
      else if (ac === "cli") await abrirCli(id);
      else if (ac === "srvNovo") abrirSrv(null);
      else if (ac === "srv") abrirSrv(id);
      else if (ac === "srvDel") { if (!confirm("Arquivar este serviço? Ele sai da vitrine; o histórico continua.")) return; const r = await api("DELETE", `servicos/${id}`); toast(r.arquivado ? "Serviço arquivado." : "Serviço removido."); await servicos(); }
      else if (ac === "srvAtivar") { await api("PUT", `servicos/${id}`, corpoSrv(S.servicos.find((x) => x.id === id), { ativo: true })); toast("Serviço reativado."); await servicos(); }
      else if (ac === "profNovo") { S.servicos = await api("GET", "servicos"); abrirProf(null); }
      else if (ac === "prof") abrirProf(id);
      else if (ac === "profDel") { if (!confirm("Desativar este profissional? Ele sai da vitrine; os agendamentos já marcados continuam.")) return; await api("DELETE", `profissionais/${id}`); toast("Profissional desativado."); await equipe(); }
      else if (ac === "blqNovo") { if (!S.profs.length) S.profs = await api("GET", "profissionais"); abrirBlq(); }
      else if (ac === "blqDel") { if (!confirm("Remover este bloqueio? Os horários voltam a ficar livres.")) return; await api("DELETE", `bloqueios/${id}`); toast("Bloqueio removido."); await folgas(); }
      else if (ac === "copiarLink") { await navigator.clipboard.writeText(linkVitrine()); toast("Link da vitrine copiado."); }
    } catch (x) { toast(x.message, true); }
  });

  // ---------- início ----------
  base().then(() => { const v = location.hash.slice(1); aba(CARREGA[v] ? v : "agenda"); }).catch((e) => { $("#empNome").textContent = "Erro ao carregar"; toast(e.message, true); });
  setInterval(() => { if ($("#v-agenda").classList.contains("on") && !document.querySelector("dialog[open]") && document.visibilityState === "visible") agenda().catch(() => {}); }, 60000);
})();
