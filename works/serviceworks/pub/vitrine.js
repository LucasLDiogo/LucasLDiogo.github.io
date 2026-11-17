// ServiceWorks — vitrine pública: o cliente escolhe serviço, profissional, dia e horário e agenda sem login.
"use strict";
(() => {
  const $ = (s, r = document) => r.querySelector(s), $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const brl = (c) => (Number(c || 0) / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
  const somaDias = (d, n) => { const x = new Date(d + "T12:00:00Z"); x.setUTCDate(x.getUTCDate() + n); return x.toISOString().slice(0, 10); };
  const semana = (d) => new Date(d + "T12:00:00Z").toLocaleDateString("pt-BR", { timeZone: "UTC", weekday: "short" }).replace(".", "");
  const dataLonga = (d) => new Date(d + "T12:00:00Z").toLocaleDateString("pt-BR", { timeZone: "UTC", weekday: "long", day: "numeric", month: "long" });
  const SEG = { barbearia: "Barbearia", salao: "Salão de beleza", clinica: "Clínica", petshop: "Pet shop", outro: "" };
  const slug = decodeURIComponent(location.pathname.split("/")[2] || "").toLowerCase();
  const BASE = `/api/publico/${encodeURIComponent(slug)}`;
  const E = { info: null, servico: null, prof: "qualquer", dia: null, hora: null, profDoHorario: {} };
  let tt;
  const toast = (m) => { const t = $("#toast"); t.textContent = m; t.classList.add("on"); clearTimeout(tt); tt = setTimeout(() => t.classList.remove("on"), 3000); };

  async function api(caminho, opt = {}) {
    const r = await fetch(BASE + caminho, { ...opt, headers: opt.body ? { "Content-Type": "application/json" } : {} });
    let d = null; try { d = await r.json(); } catch {}
    if (!r.ok) { const e = new Error(d?.erro || "Não foi possível concluir. Tente de novo."); e.status = r.status; throw e; }
    return d;
  }
  const mostra = (id, sim = true) => { $(id).hidden = !sim; };
  const rolar = (id) => { const el = $(id); if (el && !matchMedia("(prefers-reduced-motion: reduce)").matches) el.scrollIntoView({ behavior: "smooth", block: "start" }); };
  function erro(t, m) { $("#vNome").textContent = "Agenda online"; $("#vErroT").textContent = t; $("#vErroM").textContent = m; mostra("#vErro"); mostra("#fluxo", false); }

  async function inicio() {
    if (!slug) return erro("Endereço incompleto", "Confira o link que você recebeu.");
    try { E.info = await api(""); }
    catch (e) { return e.status === 404 ? erro("Agenda não encontrada", "Confira o link que você recebeu do estabelecimento.") : erro("Agenda indisponível", e.message); }
    const emp = E.info.empresa;
    if (/^#[0-9a-f]{6}$/i.test(emp.cor || "")) { document.documentElement.style.setProperty("--p", emp.cor); $('meta[name="theme-color"]').content = emp.cor; }
    document.title = `Agendar · ${emp.nome}`;
    $("#vNome").textContent = emp.nome; $("#vSeg").textContent = SEG[emp.segmento] || ""; $("#vSobre").textContent = emp.sobre || "";
    if (emp.endereco) { $("#vEnd").textContent = emp.endereco; mostra("#vEnd"); }
    if (emp.whatsapp) { $("#vWa").href = `https://wa.me/${emp.whatsapp}`; mostra("#vWa"); }
    if (!E.info.servicos.length) return erro("Agenda em preparação", "Ainda não há serviços disponíveis para agendar online.");
    desenhaServicos(); mostra("#fluxo");
  }

  function desenhaServicos() {
    const cats = new Map();
    for (const s of E.info.servicos) { const c = s.combo ? "Combos" : s.categoria || "Serviços"; if (!cats.has(c)) cats.set(c, []); cats.get(c).push(s); }
    $("#lServ").innerHTML = [...cats].map(([c, l]) => `${cats.size > 1 ? `<p class="cat">${esc(c)}</p>` : ""}${l.map((s) => `<button type="button" class="serv" data-s="${s.id}" aria-pressed="false"><span class="info"><b>${esc(s.nome)}</b><span>${s.duracao_min} min${s.descricao ? " · " + esc(s.descricao) : ""}</span></span><span class="preco">${s.promo_centavos != null ? `<s>${brl(s.preco_centavos)}</s>${brl(s.promo_centavos)}` : brl(s.preco_centavos)}</span></button>`).join("")}`).join("");
  }
  $("#lServ").addEventListener("click", (e) => {
    const b = e.target.closest("[data-s]"); if (!b) return;
    E.servico = E.info.servicos.find((s) => s.id === +b.dataset.s); E.prof = "qualquer"; E.hora = null;
    $$("#lServ [data-s]").forEach((x) => x.setAttribute("aria-pressed", String(x === b)));
    const profs = E.info.profissionais.filter((p) => p.servicos.includes(E.servico.id));
    if (profs.length > 1) {
      $("#lProf").innerHTML = `<button type="button" data-p="qualquer" aria-pressed="true"><b>Sem preferência</b><span>Primeiro horário livre</span></button>` + profs.map((p) => `<button type="button" data-p="${p.id}" aria-pressed="false"><b>${esc(p.nome)}</b><span>${esc(p.funcao || "")}</span></button>`).join("");
      mostra("#p2");
    } else { E.prof = profs[0] ? String(profs[0].id) : "qualquer"; mostra("#p2", false); }
    mostra("#p4", false); abrirDias(); rolar(profs.length > 1 ? "#p2" : "#p3");
  });
  $("#lProf").addEventListener("click", (e) => {
    const b = e.target.closest("[data-p]"); if (!b) return;
    E.prof = b.dataset.p; E.hora = null; $$("#lProf [data-p]").forEach((x) => x.setAttribute("aria-pressed", String(x === b)));
    mostra("#p4", false); horas(); rolar("#p3");
  });

  const rotulo = (d, hoje) => (d === hoje ? "hoje" : d === somaDias(hoje, 1) ? "amanhã" : semana(d));
  function abrirDias() {
    const hoje = E.info.empresa.hoje, n = Math.min(E.info.empresa.janela_dias || 30, 60);
    if (!E.dia) E.dia = hoje;
    $("#lDias").innerHTML = Array.from({ length: n + 1 }, (_, i) => somaDias(hoje, i)).map((d) => `<button type="button" data-d="${d}" aria-pressed="${d === E.dia}" aria-label="${dataLonga(d)}"><span>${rotulo(d, hoje)}</span><b>${d.slice(8)}</b><span>${d.slice(5, 7)}</span></button>`).join("");
    mostra("#p3"); horas();
  }
  $("#lDias").addEventListener("click", (e) => {
    const b = e.target.closest("[data-d]"); if (!b) return;
    E.dia = b.dataset.d; E.hora = null; $$("#lDias [data-d]").forEach((x) => x.setAttribute("aria-pressed", String(x === b)));
    mostra("#p4", false); horas();
  });

  let pedido = 0;
  async function horas() {
    const box = $("#lHoras"), meu = ++pedido;
    box.innerHTML = '<p class="small mute">Buscando horários…</p>';
    try {
      const r = await api(`/livres?data=${E.dia}&servico=${E.servico.id}&profissional=${E.prof}`);
      if (meu !== pedido) return;
      E.profDoHorario = {};
      for (const p of r.profissionais) for (const h of p.horarios) (E.profDoHorario[h] ||= []).push(p.nome);
      const hs = Object.keys(E.profDoHorario).sort();
      if (!hs.length) { box.innerHTML = `<div class="empty">Sem horários livres em ${dataLonga(E.dia)}. Escolha outro dia.</div>`; return; }
      const grupos = [["Manhã", (h) => h < "12:00"], ["Tarde", (h) => h >= "12:00" && h < "18:00"], ["Noite", (h) => h >= "18:00"]];
      box.innerHTML = grupos.map(([t, f]) => { const l = hs.filter(f); return l.length ? `<p class="turno">${t}</p><div class="slots">${l.map((h) => `<button type="button" data-h="${h}" aria-pressed="${h === E.hora}">${h}</button>`).join("")}</div>` : ""; }).join("");
    } catch (e) { if (meu === pedido) box.innerHTML = `<div class="empty">${esc(e.message)}</div>`; }
  }
  $("#lHoras").addEventListener("click", (e) => {
    const b = e.target.closest("[data-h]"); if (!b) return;
    E.hora = b.dataset.h; $$("#lHoras [data-h]").forEach((x) => x.setAttribute("aria-pressed", String(x === b)));
    const quem = E.prof !== "qualquer" ? E.info.profissionais.find((p) => String(p.id) === E.prof)?.nome : E.profDoHorario[E.hora]?.length === 1 ? E.profDoHorario[E.hora][0] : "o primeiro profissional livre";
    const s = E.servico;
    $("#resumo").innerHTML = `<b>${esc(s.nome)}</b>${dataLonga(E.dia)}, às ${E.hora} · ${s.duracao_min} min<br>com ${esc(quem)} · ${brl(s.promo_centavos ?? s.preco_centavos)}`;
    $("#fErr").textContent = ""; mostra("#p4"); rolar("#p4");
  });

  $("#fluxo").addEventListener("submit", async (e) => {
    e.preventDefault();
    const er = $("#fErr"), bt = $("#fOk"), nome = $("#fNome").value.trim(), whats = $("#fWhats").value.trim();
    er.textContent = "";
    if (!E.hora) { er.textContent = "Escolha um horário."; return; }
    if (nome.length < 2) { er.textContent = "Informe seu nome."; return; }
    if (whats.replace(/\D/g, "").length < 10) { er.textContent = "Informe o WhatsApp com DDD."; return; }
    bt.disabled = true; bt.textContent = "Confirmando…";
    try {
      const corpo = { servico_id: E.servico.id, data: E.dia, hora: E.hora, nome, whatsapp: whats, observacoes: $("#fObs").value.trim() };
      if (E.prof !== "qualquer") corpo.profissional_id = +E.prof;
      const r = await api("/agendar", { method: "POST", body: JSON.stringify(corpo) });
      try { localStorage.setItem("sw_cliente", JSON.stringify({ nome, whats })); } catch {}
      confirmado(r);
    } catch (x) {
      er.textContent = x.message;
      if (x.status === 409) { E.hora = null; horas(); }
    } finally { bt.disabled = false; bt.textContent = "Confirmar agendamento"; }
  });

  function confirmado(r) {
    $("#okResumo").textContent = `${r.servico} com ${r.profissional} · ${dataLonga(r.inicio.slice(0, 10))}, às ${r.inicio.slice(11, 16)} · ${brl(r.valor_centavos)}`;
    $("#okCod").textContent = r.codigo;
    if (r.whatsapp_link) { $("#okWa").href = r.whatsapp_link; mostra("#okWa"); }
    const t = (s) => s.replace(/[-:]/g, "") + "00";
    const ics = ["BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//LLD Works//ServiceWorks//PT", "BEGIN:VEVENT", `UID:${r.codigo}-${slug}@serviceworks.lldworks.com.br`, `DTSTAMP:${new Date().toISOString().replace(/[-:]/g, "").slice(0, 15)}Z`,
      `DTSTART;TZID=America/Sao_Paulo:${t(r.inicio)}`, `DTEND;TZID=America/Sao_Paulo:${t(r.fim)}`, `SUMMARY:${r.servico} · ${E.info.empresa.nome}`,
      `DESCRIPTION:Com ${r.profissional}. Código ${r.codigo}.`, E.info.empresa.endereco ? `LOCATION:${E.info.empresa.endereco}` : "", "BEGIN:VALARM", "TRIGGER:-PT2H", "ACTION:DISPLAY", "DESCRIPTION:Lembrete do seu horário", "END:VALARM", "END:VEVENT", "END:VCALENDAR"].filter(Boolean).join("\r\n");
    $("#okIcs").href = URL.createObjectURL(new Blob([ics], { type: "text/calendar" }));
    mostra("#fluxo", false); mostra("#ok"); rolar("#ok");
  }
  $("#okNovo").addEventListener("click", () => {
    E.servico = null; E.hora = null; E.prof = "qualquer";
    $$("#lServ [data-s]").forEach((x) => x.setAttribute("aria-pressed", "false"));
    ["#p2", "#p3", "#p4", "#ok", "#okWa"].forEach((i) => mostra(i, false)); mostra("#fluxo"); rolar("#p1");
  });

  // consultar / cancelar pelo código
  $("#fCons").addEventListener("submit", async (e) => {
    e.preventDefault();
    const er = $("#cErr"), res = $("#cRes"); er.textContent = ""; res.innerHTML = "";
    const cod = $("#cCod").value.trim().toUpperCase(), whats = $("#cWhats").value.trim();
    try {
      const a = await api(`/agendamento?codigo=${encodeURIComponent(cod)}&whatsapp=${encodeURIComponent(whats)}`);
      const st = { confirmado: "Confirmado", concluido: "Concluído", cancelado: "Cancelado", faltou: "Não compareceu" }[a.status] || a.status;
      res.innerHTML = `<div class="resumo" style="margin-top:12px"><b>${esc(a.servico)} · ${st}</b>${dataLonga(a.inicio.slice(0, 10))}, às ${a.inicio.slice(11, 16)} com ${esc(a.profissional)} · ${brl(a.valor_centavos)}</div>${a.status === "confirmado" ? '<button type="button" class="btn bad full" id="cCancelar" style="margin-top:10px">Cancelar este horário</button>' : ""}`;
    } catch (x) { er.textContent = x.message; }
  });
  $("#cRes").addEventListener("click", async (e) => {
    if (!e.target.closest("#cCancelar")) return;
    if (!confirm("Cancelar este horário? Ele fica livre para outra pessoa.")) return;
    const er = $("#cErr"); er.textContent = "";
    try {
      await api("/cancelar", { method: "POST", body: JSON.stringify({ codigo: $("#cCod").value.trim().toUpperCase(), whatsapp: $("#cWhats").value.trim() }) });
      $("#cRes").innerHTML = '<p class="resumo" style="margin-top:12px">Horário cancelado. Obrigado por avisar!</p>'; toast("Horário cancelado.");
      if (E.servico && E.dia) horas();
    } catch (x) { er.textContent = x.message; }
  });

  try { const c = JSON.parse(localStorage.getItem("sw_cliente") || "null"); if (c) { $("#fNome").value = c.nome || ""; $("#fWhats").value = c.whats || ""; $("#cWhats").value = c.whats || ""; } } catch {}
  inicio();
})();
