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
  // Endereço da loja: <loja>.lldworks.com.br (ou o antigo /v/<loja>)
  const hostLoja = location.hostname.endsWith(".lldworks.com.br") && !/^(serviceworks|serviceworks-demo)\./.test(location.hostname) ? location.hostname.split(".")[0] : "";
  const slug = (location.pathname.startsWith("/v/") ? decodeURIComponent(location.pathname.split("/")[2] || "") : hostLoja || new URLSearchParams(location.search).get("loja") || "").toLowerCase();
  const BASE = `/api/publico/${encodeURIComponent(slug)}`;
  const E = { info: null, servico: null, prof: "qualquer", dia: null, hora: null, profDoHorario: {}, porte: null, livre: null };
  const PORTES = [["mini", "Mini", "até 5 kg"], ["pequeno", "Pequeno", "5 a 10 kg"], ["medio", "Médio", "10 a 25 kg"], ["grande", "Grande", "25 a 45 kg"], ["gigante", "Gigante", "mais de 45 kg"]];
  const pet = () => E.info?.empresa.segmento === "petshop";
  // numera os passos visíveis (o passo do pet só aparece no pet shop)
  const numerar = () => { let n = 0; $$("#fluxo .passo").forEach((p) => { if (!p.hidden) $(".n", p).textContent = ++n; }); };
  const faixa = (s) => { const v = [s.promo_centavos ?? s.preco_centavos, ...(s.portes || []).map((p) => p.preco_centavos)], d = [s.duracao_min, ...(s.portes || []).map((p) => p.duracao_min)]; return { min: Math.min(...v), max: Math.max(...v), dmin: Math.min(...d), dmax: Math.max(...d) }; };
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
    extras(emp);
    if (!E.info.servicos.length) return erro("Agenda em preparação", "Ainda não há serviços disponíveis para agendar online.");
    desenhaServicos(); mostra("#fluxo");
    const G = window.gsap; if (G && !matchMedia("(prefers-reduced-motion: reduce)").matches) { G.from("#capa .in > *", { opacity: 0, y: 14, duration: 0.6, stagger: 0.08, ease: "power2.out" }); G.from(".promo-v, .serv", { opacity: 0, y: 10, duration: 0.45, stagger: 0.03, delay: 0.2, ease: "power2.out" }); }
  }

  // Logo, banner, redes, mapa, horário de funcionamento, promoções e produtos.
  const SEMANA = ["Domingo", "Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado"];
  function extras(emp) {
    const base = location.pathname.startsWith("/v/") ? BASE : "";
    if (emp.tem_logo) { const l = $("#vLogo"); l.src = base ? `${BASE}/logo` : "/logo"; l.alt = emp.nome; mostra("#vLogo"); const ic = document.querySelector('link[rel="icon"]'); if (ic) ic.href = l.src; }
    if (emp.tem_banner) { $("#capa").style.backgroundImage = `linear-gradient(180deg,rgba(10,8,20,.35),rgba(10,8,20,.75)),url(${base ? `${BASE}/banner` : "/banner"})`; $("#capa").classList.add("com-banner"); }
    if (emp.instagram) { $("#vIg").href = emp.instagram; mostra("#vIg"); }
    if (emp.facebook) { $("#vFb").href = emp.facebook; mostra("#vFb"); }
    const end = [emp.endereco, emp.cidade && `${emp.cidade}${emp.uf ? "/" + emp.uf : ""}`].filter(Boolean).join(" · ");
    if (end) $("#vEnd").textContent = end;
    const mapa = emp.maps_url || (end ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${emp.nome} ${end}`)}` : "");
    if (mapa) { $("#vMapa").href = mapa; mostra("#vMapa"); }
    if (emp.politica) { $("#fPolitica").textContent = emp.politica; mostra("#fPolitica"); }
    if (emp.funcionamento?.length) {
      $("#lHorario").innerHTML = SEMANA.map((d, i) => { const f = emp.funcionamento.find((x) => x.dia_semana === i); return `<dt>${d}</dt><dd>${f ? `${f.inicio} às ${f.fim}` : '<span class="mute">fechado</span>'}</dd>`; }).join("");
      $("#vEndCompleto").innerHTML = end ? `${esc(end)}${mapa ? ` · <a href="${esc(mapa)}" target="_blank" rel="noopener">ver no mapa</a>` : ""}` : "";
      mostra("#vInfo");
    }
    const cupomUrl = new URLSearchParams(location.search).get("cupom");
    if (emp.promocoes?.length) {
      $("#vPromos").innerHTML = emp.promocoes.map((p) => `<div class="promo-v"><span class="selo2">${p.tipo === "percentual" ? `${p.valor}% OFF` : `${brl(p.valor)} OFF`}</span><div><b>${esc(p.titulo)}</b>${p.descricao ? `<p class="small">${esc(p.descricao)}</p>` : ""}<p class="tiny mute">até ${p.fim.slice(8, 10)}/${p.fim.slice(5, 7)}${p.cupom ? ` · cupom <b>${esc(p.cupom)}</b>` : ""}</p></div>${p.cupom ? `<button type="button" class="btn sm" data-cupom="${esc(p.cupom)}">Usar cupom</button>` : ""}</div>`).join("");
      mostra("#vPromos");
    }
    if (cupomUrl) { $("#fCupom").value = cupomUrl.toUpperCase(); E.cupom = cupomUrl.toUpperCase(); }
    if (emp.produtos?.length) {
      $("#lProd").innerHTML = emp.produtos.map((p) => `<div class="prod">${p.tem_foto ? `<img src="${BASE}/produto-foto/${p.id}" alt="" loading="lazy">` : `<span class="ph" aria-hidden="true"></span>`}<b>${esc(p.nome)}</b><span class="pr">${brl(p.preco_centavos)}</span>${p.disponivel ? (emp.whatsapp ? `<a class="btn sm" target="_blank" rel="noopener" href="https://wa.me/${emp.whatsapp}?text=${encodeURIComponent(`Olá! Quero ${p.nome} (${brl(p.preco_centavos)}), vi na vitrine.`)}">Pedir</a>` : "") : '<span class="chip">esgotado</span>'}</div>`).join("");
      mostra("#vProdutos");
    }
  }
  document.addEventListener("click", (e) => { const b = e.target.closest("[data-cupom]"); if (!b) return; $("#fCupom").value = b.dataset.cupom; E.cupom = b.dataset.cupom; toast(`Cupom ${b.dataset.cupom} aplicado: escolha o serviço.`); rolar("#p1"); });
  async function confereCupom() {
    const c = $("#fCupom").value.trim().toUpperCase(), msg = $("#fCupomMsg"); msg.textContent = ""; E.cupom = c || null;
    if (!c || !E.servico) return;
    try { const p = await api(`/cupom?codigo=${encodeURIComponent(c)}&servico=${E.servico.id}`); msg.textContent = `✓ ${p.titulo}: ${p.tipo === "percentual" ? p.valor + "% de desconto" : brl(p.valor) + " de desconto"}`; msg.className = "tiny ok"; }
    catch (x) { msg.textContent = x.message; msg.className = "tiny err"; E.cupom = null; }
  }
  $("#fCupomOk").addEventListener("click", confereCupom);

  function desenhaServicos() {
    const cats = new Map();
    for (const s of E.info.servicos) { const c = s.combo ? "Combos" : s.categoria || "Serviços"; if (!cats.has(c)) cats.set(c, []); cats.get(c).push(s); }
    $("#lServ").innerHTML = [...cats].map(([c, l]) => `${cats.size > 1 ? `<p class="cat">${esc(c)}</p>` : ""}${l.map((s) => { const f = pet() && s.portes?.length ? faixa(s) : null; return `<button type="button" class="serv" data-s="${s.id}" aria-pressed="false"><span class="info"><b>${esc(s.nome)}</b><span>${f ? (f.dmin === f.dmax ? f.dmin : `${f.dmin} a ${f.dmax}`) : s.duracao_min} min${f ? " conforme o porte" : ""}${s.descricao ? " · " + esc(s.descricao) : ""}</span></span><span class="preco">${f ? (f.min === f.max ? brl(f.min) : `<small>a partir de</small>${brl(f.min)}`) : s.promo_centavos != null ? `<s>${brl(s.preco_centavos)}</s>${brl(s.promo_centavos)}` : brl(s.preco_centavos)}</span></button>`; }).join("")}`).join("");
  }
  $("#lServ").addEventListener("click", (e) => {
    const b = e.target.closest("[data-s]"); if (!b) return;
    E.servico = E.info.servicos.find((s) => s.id === +b.dataset.s); E.prof = "qualquer"; E.hora = null;
    $$("#lServ [data-s]").forEach((x) => x.setAttribute("aria-pressed", String(x === b)));
    if (pet()) {
      mostra("#pPet"); desenhaPortes();
      if (!E.porte || !$("#fPet").value.trim()) { ["#p2", "#p3", "#p4"].forEach((i) => mostra(i, false)); numerar(); rolar("#pPet"); return; }
    }
    seguirDoServico();
  });
  function desenhaPortes() {
    const s = E.servico, pr = (k) => { const p = (s?.portes || []).find((x) => x.porte === k); return p ? p.preco_centavos : s ? s.promo_centavos ?? s.preco_centavos : null; };
    $("#lPorte").innerHTML = PORTES.map(([k, n, kg]) => `<button type="button" data-porte="${k}" aria-pressed="${k === E.porte}"><b>${n}</b><span>${kg}${s ? " · " + brl(pr(k)) : ""}</span></button>`).join("");
  }
  $("#lPorte").addEventListener("click", (e) => {
    const b = e.target.closest("[data-porte]"); if (!b) return;
    if (!$("#fPet").value.trim()) { $("#fPet").focus(); toast("Informe o nome do pet."); return; }
    E.porte = b.dataset.porte; E.hora = null; $$("#lPorte [data-porte]").forEach((x) => x.setAttribute("aria-pressed", String(x === b)));
    mostra("#p4", false); seguirDoServico();
  });
  $("#fPet").addEventListener("change", () => { if (E.porte && E.servico && $("#p3").hidden && $("#fPet").value.trim()) seguirDoServico(); });
  function seguirDoServico() {
    const profs = E.info.profissionais.filter((p) => p.servicos.includes(E.servico.id));
    if (profs.length > 1) {
      $("#lProf").innerHTML = `<button type="button" data-p="qualquer" aria-pressed="true"><b>Sem preferência</b><span>Primeiro horário livre</span></button>` + profs.map((p) => `<button type="button" data-p="${p.id}" aria-pressed="false"><b>${esc(p.nome)}</b><span>${esc(p.funcao || "")}</span></button>`).join("");
      mostra("#p2");
    } else { E.prof = profs[0] ? String(profs[0].id) : "qualquer"; mostra("#p2", false); }
    mostra("#p4", false); abrirDias(); numerar(); rolar(profs.length > 1 ? "#p2" : "#p3");
  }
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
      const r = await api(`/livres?data=${E.dia}&servico=${E.servico.id}&profissional=${E.prof}${pet() && E.porte ? `&porte=${E.porte}` : ""}`);
      if (meu !== pedido) return;
      E.livre = { duracao: r.duracao_min, valor: r.valor_centavos };
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
    const dur = E.livre?.duracao ?? s.duracao_min, val = E.livre?.valor ?? (s.promo_centavos ?? s.preco_centavos);
    const doPet = pet() ? ` para ${esc($("#fPet").value.trim())} (${PORTES.find((p) => p[0] === E.porte)?.[1].toLowerCase()})` : "";
    $("#resumo").innerHTML = `<b>${esc(s.nome)}${doPet}</b>${dataLonga(E.dia)}, às ${E.hora} · ${dur} min<br>com ${esc(quem)} · ${brl(val)}`;
    $("#fErr").textContent = ""; mostra("#p4"); numerar(); rolar("#p4");
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
      const cup = $("#fCupom").value.trim(); if (cup) corpo.cupom = cup;
      if (E.prof !== "qualquer") corpo.profissional_id = +E.prof;
      if (pet()) {
        const nomePet = $("#fPet").value.trim();
        if (!nomePet || !E.porte) { er.textContent = "Informe o nome e o porte do pet."; rolar("#pPet"); return; }
        corpo.pet = { nome: nomePet, especie: $("#fEsp").value, porte: E.porte };
      }
      const r = await api("/agendar", { method: "POST", body: JSON.stringify(corpo) });
      try { localStorage.setItem("sw_cliente", JSON.stringify({ nome, whats, pet: corpo.pet || null })); } catch {}
      confirmado(r);
    } catch (x) {
      er.textContent = x.message;
      if (x.status === 409) { E.hora = null; horas(); }
    } finally { bt.disabled = false; bt.textContent = "Confirmar agendamento"; }
  });

  function confirmado(r) {
    $("#okResumo").textContent = `${r.servico}${r.pet ? ` para ${r.pet}` : ""} com ${r.profissional} · ${dataLonga(r.inicio.slice(0, 10))}, às ${r.inicio.slice(11, 16)} · ${brl(r.valor_centavos)}`;
    $("#okCod").textContent = r.codigo;
    if (r.whatsapp_link) { $("#okWa").href = r.whatsapp_link; mostra("#okWa"); }
    if (r.pagamento && r.pagamento.link) { $("#okSinalV").textContent = brl(r.pagamento.valor_centavos); $("#okSinalL").href = r.pagamento.link; mostra("#okSinal"); }
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
    ["#pPet", "#p2", "#p3", "#p4", "#ok", "#okWa"].forEach((i) => mostra(i, false)); mostra("#fluxo"); numerar(); rolar("#p1");
  });

  // consultar / cancelar pelo código
  $("#fCons").addEventListener("submit", async (e) => {
    e.preventDefault();
    const er = $("#cErr"), res = $("#cRes"); er.textContent = ""; res.innerHTML = "";
    const cod = $("#cCod").value.trim().toUpperCase(), whats = $("#cWhats").value.trim();
    try {
      const a = await api(`/agendamento?codigo=${encodeURIComponent(cod)}&whatsapp=${encodeURIComponent(whats)}`);
      const st = { confirmado: "Confirmado", concluido: "Concluído", cancelado: "Cancelado", faltou: "Não compareceu" }[a.status] || a.status;
      res.innerHTML = `<div class="resumo" style="margin-top:12px"><b>${esc(a.servico)}${a.pet ? " · " + esc(a.pet) : ""} · ${st}</b>${dataLonga(a.inicio.slice(0, 10))}, às ${a.inicio.slice(11, 16)} com ${esc(a.profissional)} · ${brl(a.valor_centavos)}</div>${a.status === "confirmado" ? '<button type="button" class="btn bad full" id="cCancelar" style="margin-top:10px">Cancelar este horário</button>' : ""}`;
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

  try { const c = JSON.parse(localStorage.getItem("sw_cliente") || "null"); if (c) { $("#fNome").value = c.nome || ""; $("#fWhats").value = c.whats || ""; $("#cWhats").value = c.whats || ""; if (c.pet) { $("#fPet").value = c.pet.nome || ""; $("#fEsp").value = c.pet.especie || "cao"; E.porte = c.pet.porte || null; } } } catch {}
  inicio();
})();
