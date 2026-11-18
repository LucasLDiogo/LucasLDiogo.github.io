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
  const PORTES = [["mini", "Mini", "até 5 kg"], ["pequeno", "Pequeno", "5 a 10 kg"], ["medio", "Médio", "10 a 25 kg"], ["grande", "Grande", "25 a 45 kg"], ["gigante", "Gigante", "mais de 45 kg"]];
  const PORTE = Object.fromEntries(PORTES.map(([k, n]) => [k, n]));
  const ESP = { cao: "Cão", gato: "Gato", outro: "Outro" };
  const opPortes = (sel) => PORTES.map(([k, n, kg]) => `<option value="${k}" ${k === sel ? "selected" : ""}>${n} (${kg})</option>`).join("");
  const fmtD = (d) => (d ? `${d.slice(8, 10)}/${d.slice(5, 7)}` : "");
  const restam = (v) => v.sessoes - v.usadas;
  const saldo = (v) => `<span class="saldo" aria-label="${v.usadas} de ${v.sessoes} sessões usadas">${Array.from({ length: Math.min(v.sessoes, 12) }, (_, i) => `<i class="${i < v.usadas ? "u" : ""}"></i>`).join("")}</span>`;

  let tt;
  function toast(m, erro = false, ms = 3200) { const t = $("#toast"); t.textContent = m; t.classList.toggle("err", erro); t.classList.add("on"); clearTimeout(tt); tt = setTimeout(() => t.classList.remove("on"), ms); }

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
  const linkVitrine = () => `https://${S.emp.slug}.lldworks.com.br`;

  // ---------- abas ----------
  const CARREGA = { agenda, clientes, servicos, equipe, folgas, pacotes, relatorios: relatorio, config, plano };
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
    modoSegmento();
    $("#empNome").textContent = emp.nome;
    const lv = $("#lnkVitrine"); lv.href = linkVitrine(); lv.hidden = false;
    if (!admin()) $$("[data-adm]").forEach((b) => (b.hidden = true));
  }

  // Pet shop: pets, porte e textos de tutor aparecem só quando o segmento é "petshop".
  function modoSegmento() {
    S.pet = S.emp.segmento === "petshop";
    document.body.classList.toggle("pet", S.pet);
    { const n = $("#navCli"), t = S.pet ? "Tutores e pets" : "Clientes", s = n.querySelector("span"); if (s) s.textContent = t; else n.textContent = t; }
    $("#cliH1").textContent = S.pet ? "Tutores e pets" : "Clientes";
    $("#cliSub").textContent = S.pet ? "Tutores com os pets, histórico, pacotes, atendimentos e faltas." : "Quem já agendou com você, com histórico, atendimentos e faltas.";
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
        const quem = a.pet ? `${a.pet} · ${a.cliente.split(" ")[0]}` : a.cliente;
        c += `<button class="ev ${a.status}" style="top:${y(a1) + 1}px;height:${hgt}px" data-act="ev" data-id="${a.id}"><b>${a.inicio.slice(11, 16)} ${esc(quem)}</b><span class="s">${esc(a.servico)}${a.pet_porte ? " · " + PORTE[a.pet_porte] : ""} · ${a.pacote ? "pacote" : brl(a.valor_centavos)}</span>${a.origem === "vitrine" ? '<span class="on">online</span>' : ""}</button>`;
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
  function opcoesServico(sel, atual) { sel.innerHTML = S.servicos.filter((s) => s.ativo || s.id === atual).map((s) => `<option value="${s.id}">${esc(s.nome)} · ${S.pet && s.portes?.length ? "conforme o porte" : `${s.duracao_min} min · ${brl(s.promo_centavos ?? s.preco_centavos)}`}</option>`).join(""); if (atual) sel.value = atual; }
  function opcoesProf(sel, servico, atual) {
    const ativos = S.profs.filter((p) => p.ativo), lista = ativos.filter((p) => !servico || p.servicos.includes(+servico));
    sel.innerHTML = (lista.length ? lista : ativos).map((p) => `<option value="${p.id}">${esc(p.nome)}</option>`).join("");
    if (atual && [...sel.options].some((o) => +o.value === +atual)) sel.value = atual;
  }
  // porte usado para calcular duração e preço: o do pet escolhido ou o informado para o pet novo
  const porteDoAg = () => { if (!S.pet) return ""; const v = $("#agPet").value; return v && v !== "novo" ? (S.agCli?.pets.find((p) => p.id === +v)?.porte || "") : $("#agPetPorte").value; };
  async function slotsLivres() {
    const box = $("#agSlots"), s = $("#agSrv").value, p = $("#agProf").value, d = $("#agData").value;
    if (!s || !p || !d) { box.innerHTML = ""; return; }
    box.innerHTML = '<span class="small mute">Buscando…</span>';
    try {
      const r = await api("GET", `livres?data=${d}&servico=${s}&profissional=${p}&porte=${porteDoAg()}`);
      const agora = d === hojeBR() ? agoraHM() : "", hs = r.horarios.filter((x) => x > agora);
      box.innerHTML = hs.length ? hs.map((x) => `<button type="button" data-h="${x}" aria-pressed="${x === $("#agHora").value}">${x}</button>`).join("") : '<span class="small mute">Sem horário livre neste dia. Marque “Encaixe” para agendar assim mesmo.</span>';
      const pk = $("#agPk").value, porte = porteDoAg();
      $("#agValor").textContent = `${r.duracao_min} min${porte ? ` (porte ${PORTE[porte].toLowerCase()})` : ""} · ${pk ? "pelo pacote, sem cobrança" : brl(r.valor_centavos)}`;
    } catch (e) { box.innerHTML = `<span class="small" style="color:var(--bad)">${esc(e.message)}</span>`; }
  }
  // pacotes com saldo do cliente para o serviço escolhido
  function opcoesPacote() {
    const sid = +$("#agSrv").value, lst = (S.agCli?.pacotes || []).filter((v) => v.status === "ativo" && v.servico_id === sid && restam(v) > 0 && v.vence_em >= hojeBR());
    $("#agPk").innerHTML = `<option value="">Avulso</option>` + lst.map((v) => `<option value="${v.id}">${esc(v.nome)}${v.pet ? " · " + esc(v.pet) : ""} · ${restam(v)} de ${v.sessoes} restantes · vence ${fmtD(v.vence_em)}</option>`).join("");
  }
  function opcoesPet() {
    const pets = (S.agCli?.pets || []).filter((p) => p.ativo);
    $("#agPet").innerHTML = pets.map((p) => `<option value="${p.id}">${esc(p.nome)} · ${PORTE[p.porte]}${p.raca ? " · " + esc(p.raca) : ""}</option>`).join("") + `<option value="novo">+ Novo pet</option>`;
    mostraPetNovo();
  }
  const mostraPetNovo = () => { const novo = $("#agPet").value === "novo"; $("#agPetNovo").hidden = !novo; $("#agPetPorteBox").hidden = !novo; };
  $("#agSlots").addEventListener("click", (e) => { const b = e.target.closest("button[data-h]"); if (!b) return; $("#agHora").value = b.dataset.h; $$("#agSlots button").forEach((x) => x.setAttribute("aria-pressed", String(x === b))); });
  $("#agSrv").addEventListener("change", () => { opcoesProf($("#agProf"), $("#agSrv").value, $("#agProf").value); opcoesPacote(); slotsLivres(); });
  $("#agProf").addEventListener("change", slotsLivres);
  $("#agData").addEventListener("change", slotsLivres);
  $("#agPet").addEventListener("change", () => { mostraPetNovo(); slotsLivres(); });
  $("#agPetPorte").addEventListener("change", slotsLivres);
  $("#agPk").addEventListener("change", slotsLivres);
  $("#agRep").addEventListener("change", () => { $("#agVezes").disabled = $("#agRep").value === "0"; });
  const cliDoCampo = () => { const v = $("#agCli").value.trim(); return S.contatos.find((c) => `${c.nome} · ${fmtWhats(c.whatsapp)}` === v); };
  let cliPedido = 0;
  $("#agCli").addEventListener("input", async () => {
    const c = cliDoCampo(), meu = ++cliPedido;
    $("#agNovoCli").hidden = !!c;
    S.agCli = null;
    if (c) { try { const d = await api("GET", `contatos/${c.id}`); if (meu === cliPedido) S.agCli = d; } catch {} }
    if (meu !== cliPedido) return;
    opcoesPet(); opcoesPacote(); slotsLivres();
  });
  async function abrirNovo(prof, hora, cliente) {
    if (!S.servicos.some((s) => s.ativo)) { toast("Cadastre ao menos um serviço antes de agendar.", true); return; }
    opcoesServico($("#agSrv"));
    opcoesProf($("#agProf"), $("#agSrv").value, prof);
    $("#agData").value = S.dia; $("#agHora").value = hora || ""; $("#agCli").value = ""; $("#agNome").value = ""; $("#agWhats").value = ""; $("#agObs").value = ""; $("#agEnc").checked = false;
    $("#agPetNome").value = ""; $("#agPetPorte").innerHTML = opPortes("medio"); $("#agRep").value = "0"; $("#agVezes").value = 4; $("#agVezes").disabled = true; $("#agValor").textContent = "";
    $("#agNovoCli").hidden = false; $("#agErr").textContent = ""; S.agCli = null; opcoesPet(); opcoesPacote();
    dAg.showModal(); slotsLivres();
    try { S.contatos = await api("GET", "contatos?q="); $("#agCliLista").innerHTML = S.contatos.map((c) => `<option value="${esc(c.nome)} · ${esc(fmtWhats(c.whatsapp))}">`).join(""); } catch {}
    if (cliente) { const c = S.contatos.find((x) => x.id === cliente); if (c) { $("#agCli").value = `${c.nome} · ${fmtWhats(c.whatsapp)}`; $("#agCli").dispatchEvent(new Event("input")); } }
  }
  aoEnviar(dAg, async () => {
    const c = cliDoCampo(), corpo = { servico_id: +$("#agSrv").value, profissional_id: +$("#agProf").value, data: $("#agData").value, hora: $("#agHora").value, observacoes: $("#agObs").value, encaixe: $("#agEnc").checked };
    if (c) corpo.contato_id = c.id;
    else { corpo.nome = $("#agNome").value.trim(); corpo.whatsapp = $("#agWhats").value; if (!corpo.nome || !corpo.whatsapp) throw new Error("Escolha um cliente da lista ou informe nome e WhatsApp."); }
    if (S.pet) {
      const v = $("#agPet").value;
      if (v && v !== "novo") corpo.pet_id = +v;
      else { const nome = $("#agPetNome").value.trim(); if (!nome) throw new Error("Informe o nome do pet."); corpo.pet = { nome, porte: $("#agPetPorte").value }; }
    }
    if ($("#agPk").value) corpo.pacote_vendido_id = +$("#agPk").value;
    if ($("#agRep").value !== "0") corpo.repetir = { semanas: +$("#agRep").value, vezes: +$("#agVezes").value };
    if (!corpo.hora) throw new Error("Escolha o horário.");
    let r;
    try { r = await api("POST", "agendamentos", corpo); }
    catch (e) { if (e.status === 409 && !corpo.pacote_vendido_id) throw new Error("Esse horário já está ocupado. Escolha outro ou marque “Encaixe”."); throw e; }
    if (r.conflitos?.length) toast(`Agendados ${r.criados.length} de ${r.criados.length + r.conflitos.length}. Não deu: ${r.conflitos.map((x) => `${fmtD(x.data)} (${x.motivo})`).join(", ")}.`, true, 9000);
    else toast(r.criados?.length > 1 ? `${r.criados.length} horários agendados.` : "Agendado.");
    S.dia = corpo.data; await agenda();
  });

  // ---------- detalhe do agendamento ----------
  const dEv = $("#dlgEv"); let evAtual = null;
  let evPacotes = [];
  async function abrirEv(id) {
    const a = S.agenda.find((x) => x.id === id); if (!a) return; evAtual = a;
    $("#evTit").textContent = `${a.inicio.slice(11, 16)}–${a.fim.slice(11, 16)} · ${a.pet ? a.pet + " · " : ""}${a.cliente}`;
    $("#evSt").innerHTML = stChip(a.status);
    const pet = a.pet ? `<br>Pet: <b>${esc(a.pet)}</b> · ${ESP[a.pet_especie] || ""} · porte ${PORTE[a.pet_porte]?.toLowerCase() || ""}` : "";
    $("#evInfo").innerHTML = `${esc(a.servico)} com ${esc(a.profissional)} · ${a.pacote ? `pacote “${esc(a.pacote)}”` : brl(a.valor_centavos)}${pet}<br>WhatsApp ${esc(fmtWhats(a.whatsapp))} · código ${esc(a.codigo)} · marcado ${a.origem === "vitrine" ? "pela vitrine" : "no painel"}${a.serie ? " · faz parte de uma série" : ""}`;
    $("#evPet").hidden = !a.pet_obs; $("#evPet").textContent = a.pet_obs ? `Cuidados com ${a.pet}: ${a.pet_obs}` : "";
    const msg = `Olá, ${a.cliente.split(" ")[0]}! Confirmando ${a.servico}${a.pet ? ` para ${a.pet}` : ""} com ${a.profissional} em ${fmtDia(a.inicio.slice(0, 10), false)} às ${a.inicio.slice(11, 16)}. ${S.emp.nome}`;
    $("#evWhats").href = waLink(a.whatsapp, msg);
    $("#evData").value = a.inicio.slice(0, 10); $("#evHora").value = a.inicio.slice(11, 16);
    opcoesProf($("#evProf"), a.servico_id, a.profissional_id);
    $("#evObs").value = a.observacoes || ""; $("#evErr").textContent = "";
    $$("#fEv [data-ev]").forEach((b) => { if (ST[b.dataset.ev]) b.hidden = b.dataset.ev === a.status; });
    const aberto = a.status !== "cancelado";
    $('[data-ev="tirarPk"]').hidden = !(a.pacote_vendido_id && aberto);
    $('[data-ev="serie"]').hidden = !(a.serie && a.status === "confirmado");
    $('[data-ev="usarPk"]').hidden = true; evPacotes = [];
    dEv.showModal();
    if (!a.pacote_vendido_id && aberto) {
      try {
        evPacotes = (await api("GET", `pacotes-vendidos?contato=${a.contato_id}&situacao=ativos`)).filter((v) => v.servico_id === a.servico_id && v.vence_em >= a.inicio.slice(0, 10) && v.inicio <= a.inicio.slice(0, 10)).sort((x, z) => (x.vence_em < z.vence_em ? -1 : 1));
        const b = $('[data-ev="usarPk"]');
        if (evPacotes.length && evAtual === a) { b.hidden = false; b.textContent = `Usar pacote (${restam(evPacotes[0])} de ${evPacotes[0].sessoes} restantes)`; }
      } catch {}
    }
  }
  // horário liberado: sugere quem costuma fazer o serviço e não tem nada marcado
  async function vagaLiberada(a) {
    if (a.inicio < `${hojeBR()}T${agoraHM()}`) return;
    const lst = (await api("GET", `encaixe?agendamento=${a.id}`)).sugestoes;
    if (!lst.length) return;
    const quando = `${fmtDia(a.inicio.slice(0, 10), false)} às ${a.inicio.slice(11, 16)}`;
    $("#vgInfo").textContent = `${a.servico} · ${quando} com ${a.profissional}`;
    $("#vgLista").innerHTML = lst.map((c) => `<div class="sug"><div><b>${esc(c.nome)}</b> <span class="chip ${c.motivo === "lista de espera" || c.motivo === "quer antecipar" ? "ok" : "p"}">${esc(c.motivo)}</span><div class="tiny mute">${esc(c.detalhe || "")}</div></div><a class="btn sm" href="${c.link}" target="_blank" rel="noopener">Oferecer no WhatsApp ↗</a></div>`).join("");
    $("#dlgVaga").showModal();
  }
  $("#fEv").addEventListener("click", async (e) => {
    const b = e.target.closest("[data-ev]"); if (!b || !evAtual) return;
    const ac = b.dataset.ev, er = $("#evErr"); er.textContent = "";
    if (ac === "cancelado" && !confirm("Cancelar este agendamento? O horário fica livre na vitrine.")) return;
    if (ac === "serie" && !confirm("Cancelar este horário e os próximos da mesma série? Os anteriores continuam.")) return;
    b.disabled = true;
    try {
      if (ST[ac]) { await api("PUT", `agendamentos/${evAtual.id}`, { status: ac }); toast(ST[ac][0] + "."); if (ac === "cancelado") { const a = evAtual; dEv.close(); await agenda(); vagaLiberada(a).catch(() => {}); return; } }
      else if (ac === "serie") { const r = await api("PUT", `agendamentos/${evAtual.id}`, { cancelar_serie: true }); toast(`${r.cancelados} horário(s) da série cancelado(s).`); }
      else if (ac === "usarPk") { await api("PUT", `agendamentos/${evAtual.id}`, { pacote_vendido_id: evPacotes[0].id }); toast("Agendamento passou para o pacote."); }
      else if (ac === "tirarPk") { if (!confirm("Tirar do pacote? A sessão volta para o pacote e o agendamento passa a ser cobrado.")) return; await api("PUT", `agendamentos/${evAtual.id}`, { pacote_vendido_id: null }); toast("Agendamento fora do pacote."); }
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
  $("#cliFiltro").addEventListener("change", () => clientes().catch((e) => toast(e.message, true)));
  const chamarDeVolta = (c) => {
    const quem = c.pets ? c.pets.split(", ").join(" e ") : "você";
    return `Oi, ${c.nome.split(" ")[0]}! Faz um tempinho que ${quem} não ${c.pets && c.pets.includes(", ") ? "vêm" : "vem"} aqui no ${S.emp.nome}. Que tal agendar um horário? ${linkVitrine()}`;
  };
  async function clientes() {
    const q = $("#cliBusca").value.trim(), sum = $("#cliFiltro").value;
    const lst = await api("GET", "contatos?q=" + encodeURIComponent(q) + (sum ? `&sumidos=${sum}` : ""));
    $("#cliDica").hidden = !sum;
    $("#cliLista").innerHTML = lst.length ? lst.map((c) => `<tr><td><b>${esc(c.nome)}</b>${c.observacoes ? `<div class="tiny mute">${esc(c.observacoes.slice(0, 80))}</div>` : ""}</td><td class="soPet">${c.pets ? esc(c.pets) : '<span class="mute">—</span>'}</td><td><a href="${waLink(c.whatsapp)}" target="_blank" rel="noopener">${esc(fmtWhats(c.whatsapp))}</a></td><td class="n">${c.atendimentos}</td><td class="n">${c.faltas ? `<span class="chip bad">${c.faltas}</span>` : 0}</td><td>${c.ultimo ? fmtDH(c.ultimo) : '<span class="mute">—</span>'}</td>
      <td class="n">${sum ? `<a class="btn sm pri" href="${waLink(c.whatsapp, chamarDeVolta(c))}" target="_blank" rel="noopener">Chamar de volta ↗</a> ` : ""}<button class="btn sm" data-act="cli" data-id="${c.id}">Abrir</button></td></tr>`).join("")
      : `<tr><td colspan="7"><div class="empty">${sum ? `Ninguém sumido há mais de ${sum} dias. Ótimo sinal!` : q ? "Nenhum cliente encontrado." : "Nenhum cliente ainda. Eles entram aqui ao agendar."}</div></td></tr>`;
  }
  const dCli = $("#dlgCli"); let cliId = null, cliAtual = null;
  function preencheCli(c) {
    cliAtual = c;
    const pets = c.pets || [];
    $("#kPets").innerHTML = `<div class="row sb" style="margin-top:16px"><h3>Pets</h3><button type="button" class="btn sm" data-act="petNovo">+ Pet</button></div>` +
      (pets.length ? `<div class="pets">${pets.map((p) => `<button type="button" class="pet ${p.ativo ? "" : "off"}" data-act="pet" data-id="${p.id}"><b>${esc(p.nome)}</b><span>${ESP[p.especie]} · ${PORTE[p.porte]}${p.raca ? " · " + esc(p.raca) : ""}${p.ativo ? "" : " · inativo"}</span>${p.observacoes ? `<span style="display:block;color:var(--warn)">⚠ ${esc(p.observacoes.slice(0, 60))}</span>` : ""}</button>`).join("")}</div>` : '<p class="mute small">Nenhum pet cadastrado.</p>');
    const pk = c.pacotes || [];
    $("#kPk").innerHTML = `<div class="row sb" style="margin-top:16px"><h3>Pacotes</h3><button type="button" class="btn sm" data-act="venderCli">Vender pacote</button></div>` +
      (pk.length ? `<div class="scroll"><table><tbody>${pk.map((v) => `<tr class="${v.status === "ativo" ? "" : "off"}"><td><b>${esc(v.nome)}</b>${v.pet ? `<div class="tiny mute">${esc(v.pet)}</div>` : ""}</td><td>${saldo(v)} <span class="small">${v.usadas}/${v.sessoes}</span></td><td class="small">vence ${fmtD(v.vence_em)}</td><td>${v.status !== "ativo" ? '<span class="chip">Cancelado</span>' : v.vence_em < hojeBR() ? '<span class="chip warn">Vencido</span>' : restam(v) ? '<span class="chip ok">Com saldo</span>' : '<span class="chip">Usado</span>'}</td></tr>`).join("")}</tbody></table></div>` : '<p class="mute small">Nenhum pacote.</p>');
    $("#kHist").innerHTML = `<h3 style="margin-top:16px">Histórico</h3>` + (c.historico.length ? `<div class="scroll"><table><tbody>${c.historico.map((a) => `<tr><td>${fmtDH(a.inicio)}</td><td>${esc(a.servico)}${a.pet ? `<div class="tiny mute">${esc(a.pet)}</div>` : ""}</td><td>${esc(a.profissional)}</td><td class="n">${a.pacote_vendido_id ? "pacote" : brl(a.valor_centavos)}</td><td>${stChip(a.status)}</td></tr>`).join("")}</tbody></table></div>` : '<p class="mute small">Sem agendamentos.</p>');
  }
  async function abrirCli(id) {
    cliId = id; cliAtual = null; $("#cliErr").textContent = ""; $("#kHist").innerHTML = ""; $("#kPets").innerHTML = ""; $("#kPk").innerHTML = "";
    if (id) {
      const c = await api("GET", `contatos/${id}`);
      $("#cliTit").textContent = c.nome; $("#kNome").value = c.nome; $("#kWhats").value = fmtWhats(c.whatsapp); $("#kObs").value = c.observacoes || "";
      $("#kWa").href = waLink(c.whatsapp); $("#kWa").hidden = false;
      preencheCli(c);
    } else { $("#cliTit").textContent = S.pet ? "Novo tutor" : "Novo cliente"; $("#kNome").value = ""; $("#kWhats").value = ""; $("#kObs").value = ""; $("#kWa").hidden = true; }
    if (!dCli.open) dCli.showModal();
  }

  // ---------- pets ----------
  const dPet = $("#dlgPet"); let petCtx = null;
  function abrirPet(contato, id) {
    const p = (cliAtual?.pets || []).find((x) => x.id === id) || { especie: "cao", porte: "medio", ativo: 1 };
    petCtx = { contato, id };
    $("#petTit").textContent = id ? `Editar ${p.nome}` : "Novo pet";
    $("#ptNome").value = p.nome || ""; $("#ptEsp").value = p.especie; $("#ptRaca").value = p.raca || ""; $("#ptPorte").innerHTML = opPortes(p.porte);
    $("#ptPel").value = p.pelagem || ""; $("#ptNasc").value = p.nascimento || ""; $("#ptObs").value = p.observacoes || ""; $("#petErr").textContent = "";
    $("#petDel").hidden = !id || !p.ativo;
    dPet.showModal();
  }
  aoEnviar(dPet, async () => {
    const corpo = { contato_id: petCtx.contato, nome: $("#ptNome").value.trim(), especie: $("#ptEsp").value, raca: $("#ptRaca").value.trim(), porte: $("#ptPorte").value, pelagem: $("#ptPel").value || null, nascimento: $("#ptNasc").value || null, observacoes: $("#ptObs").value.trim() };
    if (petCtx.id) await api("PUT", `pets/${petCtx.id}`, corpo); else await api("POST", "pets", corpo);
    toast("Pet salvo."); preencheCli(await api("GET", `contatos/${petCtx.contato}`));
  });
  $("#petDel").addEventListener("click", async () => {
    if (!confirm("Desativar este pet? O histórico continua.")) return;
    try { await api("DELETE", `pets/${petCtx.id}`); dPet.close(); toast("Pet desativado."); preencheCli(await api("GET", `contatos/${petCtx.contato}`)); } catch (x) { $("#petErr").textContent = x.message; }
  });
  aoEnviar(dCli, async () => {
    const corpo = { nome: $("#kNome").value.trim(), whatsapp: $("#kWhats").value, observacoes: $("#kObs").value };
    if (cliId) await api("PUT", `contatos/${cliId}`, corpo); else await api("POST", "contatos", corpo);
    toast("Cliente salvo."); await clientes();
  });

  // ---------- serviços ----------
  async function servicos() {
    S.servicos = await api("GET", "servicos");
    const faixa = (s) => { if (!S.pet || !s.portes?.length) return null; const v = [s.preco_centavos, ...s.portes.map((p) => p.preco_centavos)], d = [s.duracao_min, ...s.portes.map((p) => p.duracao_min)]; return { p: `${brl(Math.min(...v))} a ${brl(Math.max(...v))}`, d: `${Math.min(...d)}–${Math.max(...d)} min` }; };
    $("#srvLista").innerHTML = S.servicos.length ? S.servicos.map((s) => { const f = faixa(s); return `<tr class="${s.ativo ? "" : "off"}"><td><b>${esc(s.nome)}</b>${s.combo ? ' <span class="chip p">combo</span>' : ""}${f ? ' <span class="chip">por porte</span>' : ""}${s.descricao ? `<div class="tiny mute">${esc(s.descricao)}</div>` : ""}</td><td>${esc(s.categoria || "—")}</td><td class="n">${f ? f.d : s.duracao_min + " min"}</td><td class="n">${f ? f.p : brl(s.preco_centavos)}</td><td class="n">${s.promo_centavos != null ? brl(s.promo_centavos) : "—"}</td><td>${s.ativo ? '<span class="chip ok">Na vitrine</span>' : '<span class="chip">Arquivado</span>'}</td>
      <td class="n">${admin() ? `<button class="btn sm" data-act="srv" data-id="${s.id}">Editar</button> ${s.ativo ? `<button class="btn sm bad" data-act="srvDel" data-id="${s.id}">Arquivar</button>` : `<button class="btn sm" data-act="srvAtivar" data-id="${s.id}">Reativar</button>`}` : ""}</td></tr>`; }).join("")
      : `<tr><td colspan="7"><div class="empty">Nenhum serviço cadastrado.</div></td></tr>`;
  }
  const dSrv = $("#dlgSrv"); let srvId = null;
  function abrirSrv(id) {
    srvId = id; const s = S.servicos.find((x) => x.id === id) || { duracao_min: 30, ativo: 1, ordem: S.servicos.length + 1 };
    $("#srvTit").textContent = id ? "Editar serviço" : "Novo serviço";
    $("#sNome").value = s.nome || ""; $("#sCat").value = s.categoria || ""; $("#sDur").value = s.duracao_min; $("#sPreco").value = centsTxt(s.preco_centavos); $("#sPromo").value = centsTxt(s.promo_centavos);
    $("#sOrdem").value = s.ordem ?? 0; $("#sDesc").value = s.descricao || ""; $("#sCombo").checked = !!s.combo; $("#sAtivo").checked = !!s.ativo; $("#srvErr").textContent = "";
    const pt = s.portes || [];
    $("#sPortes").innerHTML = `<span class="cab">Porte</span><span class="cab">Duração (min)</span><span class="cab">Preço (R$)</span>` + PORTES.map(([k, n, kg]) => { const p = pt.find((x) => x.porte === k); return `<b>${n} <span class="tiny mute">${kg}</span></b><input type="number" min="5" max="600" step="5" data-pd="${k}" value="${p ? p.duracao_min : ""}" aria-label="Duração para porte ${n}"><input inputmode="decimal" data-pp="${k}" value="${p ? centsTxt(p.preco_centavos) : ""}" aria-label="Preço para porte ${n}">`; }).join("");
    dSrv.showModal();
  }
  // portes preenchidos (campo vazio = usa o padrão do serviço)
  function lerPortes(durPadrao, precoPadrao) {
    return PORTES.flatMap(([k, n]) => {
      const d = $(`[data-pd="${k}"]`).value.trim(), p = $(`[data-pp="${k}"]`).value.trim();
      if (!d && !p) return [];
      const c = p ? reais(p) : precoPadrao;
      if (Number.isNaN(c) || c == null) throw new Error(`Preço inválido no porte ${n}.`);
      const dm = d ? +d : durPadrao;
      if (!(dm >= 5 && dm <= 600)) throw new Error(`Duração inválida no porte ${n} (5 a 600 min).`);
      return [{ porte: k, duracao_min: dm, preco_centavos: c }];
    });
  }
  const corpoSrv = (s, extra = {}) => ({ nome: s.nome, categoria: s.categoria, descricao: s.descricao, duracao_min: s.duracao_min, preco_centavos: s.preco_centavos, promo_centavos: s.promo_centavos, combo: !!s.combo, ativo: !!s.ativo, ordem: s.ordem, ...extra });
  aoEnviar(dSrv, async () => {
    const preco = reais($("#sPreco").value), promo = reais($("#sPromo").value);
    if (preco == null || Number.isNaN(preco)) throw new Error("Preço inválido. Exemplo: 45,00");
    if (Number.isNaN(promo)) throw new Error("Preço promocional inválido.");
    const corpo = { nome: $("#sNome").value.trim(), categoria: $("#sCat").value.trim(), descricao: $("#sDesc").value.trim(), duracao_min: +$("#sDur").value, preco_centavos: preco, promo_centavos: promo, combo: $("#sCombo").checked, ativo: $("#sAtivo").checked, ordem: +$("#sOrdem").value || 0 };
    if (S.pet) corpo.portes = lerPortes(corpo.duracao_min, preco);
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

  // ---------- pacotes ----------
  async function pacotes() {
    const [pk, pv] = await Promise.all([api("GET", "pacotes"), api("GET", "pacotes-vendidos" + ($("#pvFiltro").value ? "?situacao=ativos" : ""))]);
    S.pacotes = pk;
    $("#pkLista").innerHTML = pk.length ? pk.map((p) => `<tr class="${p.ativo ? "" : "off"}"><td><b>${esc(p.nome)}</b>${p.descricao ? `<div class="tiny mute">${esc(p.descricao)}</div>` : ""}</td><td>${esc(p.servico)}</td><td class="n">${p.sessoes}</td><td class="n">${p.validade_dias} dias</td><td class="n">${brl(p.preco_centavos)}<div class="tiny mute">${brl(Math.round(p.preco_centavos / p.sessoes))} por sessão</div></td><td>${p.ativo ? '<span class="chip ok">À venda</span>' : '<span class="chip">Arquivado</span>'}</td>
      <td class="n">${admin() ? `<button class="btn sm" data-act="pk" data-id="${p.id}">Editar</button>${p.ativo ? ` <button class="btn sm bad" data-act="pkDel" data-id="${p.id}">Arquivar</button>` : ""}` : ""}</td></tr>`).join("")
      : `<tr><td colspan="7"><div class="empty">Nenhum pacote à venda. ${admin() ? "Crie um, por exemplo “4 banhos no mês”." : ""}</div></td></tr>`;
    $("#pvLista").innerHTML = pv.length ? pv.map((v) => `<tr class="${v.status === "ativo" ? "" : "off"}"><td><button class="btn sm ghost" data-act="cli" data-id="${v.contato_id}">${esc(v.cliente)}</button></td><td class="soPet">${esc(v.pet || "—")}</td><td>${esc(v.nome)}</td><td class="n">${saldo(v)} ${v.usadas}/${v.sessoes}</td><td>${fmtD(v.vence_em)}</td><td class="n">${brl(v.valor_centavos)}</td>
      <td>${v.status !== "ativo" ? '<span class="chip">Cancelado</span>' : v.vence_em < hojeBR() ? '<span class="chip warn">Vencido</span>' : restam(v) ? '<span class="chip ok">Com saldo</span>' : '<span class="chip">Usado</span>'}</td>
      <td class="n">${v.status === "ativo" && restam(v) > 0 && v.vence_em >= hojeBR() ? `<button class="btn sm" data-act="pvAgendar" data-id="${v.contato_id}" data-s="${v.servico_id}">Agendar</button> <button class="btn sm bad" data-act="pvCancelar" data-id="${v.id}">Cancelar</button>` : ""}</td></tr>`).join("")
      : `<tr><td colspan="8"><div class="empty">${$("#pvFiltro").value ? "Nenhum pacote com saldo." : "Nenhum pacote vendido ainda."}</div></td></tr>`;
  }
  $("#pvFiltro").addEventListener("change", () => pacotes().catch((e) => toast(e.message, true)));
  const dPk = $("#dlgPk"); let pkId = null;
  const contaPk = () => { const c = reais($("#pkPreco").value), n = +$("#pkSes").value, s = S.servicos.find((x) => x.id === +$("#pkSrv").value); $("#pkConta").textContent = c > 0 && n > 1 && s ? `${brl(Math.round(c / n))} por sessão · avulso sairia ${brl((s.promo_centavos ?? s.preco_centavos) * n)}${S.pet ? " (preço padrão)" : ""}` : ""; };
  ["#pkPreco", "#pkSes", "#pkSrv"].forEach((i) => $(i).addEventListener("input", contaPk));
  async function abrirPk(id) {
    if (!S.servicos.length) S.servicos = await api("GET", "servicos");
    pkId = id; const p = (S.pacotes || []).find((x) => x.id === id) || { sessoes: 4, validade_dias: 30, ativo: 1 };
    $("#pkTit").textContent = id ? "Editar pacote" : "Novo pacote à venda";
    $("#pkSrv").innerHTML = S.servicos.filter((s) => s.ativo || s.id === p.servico_id).map((s) => `<option value="${s.id}">${esc(s.nome)}</option>`).join("");
    if (p.servico_id) $("#pkSrv").value = p.servico_id;
    $("#pkNome").value = p.nome || ""; $("#pkSes").value = p.sessoes; $("#pkVal").value = p.validade_dias; $("#pkPreco").value = centsTxt(p.preco_centavos); $("#pkDesc").value = p.descricao || ""; $("#pkAtivo").checked = !!p.ativo; $("#pkErr").textContent = "";
    contaPk(); dPk.showModal();
  }
  aoEnviar(dPk, async () => {
    const preco = reais($("#pkPreco").value); if (preco == null || Number.isNaN(preco)) throw new Error("Preço inválido. Exemplo: 180,00");
    const corpo = { nome: $("#pkNome").value.trim(), servico_id: +$("#pkSrv").value, sessoes: +$("#pkSes").value, validade_dias: +$("#pkVal").value, preco_centavos: preco, descricao: $("#pkDesc").value.trim(), ativo: $("#pkAtivo").checked };
    if (pkId) await api("PUT", `pacotes/${pkId}`, corpo); else await api("POST", "pacotes", corpo);
    toast("Pacote salvo."); await pacotes();
  });
  const dVd = $("#dlgVender"); let vdCli = null;
  const vdResumo = () => { const p = (S.pacotes || []).find((x) => x.id === +$("#vdPk").value), i = $("#vdIni").value; $("#vdResumo").textContent = p && i ? `${p.sessoes} sessões de ${p.servico}, válido de ${fmtD(i)} até ${fmtD(somaDias(i, p.validade_dias - 1))}.` : ""; };
  $("#vdPk").addEventListener("change", () => { const p = (S.pacotes || []).find((x) => x.id === +$("#vdPk").value); if (p) $("#vdValor").value = centsTxt(p.preco_centavos); vdResumo(); });
  $("#vdIni").addEventListener("change", vdResumo);
  $("#vdCli").addEventListener("input", async () => {
    const v = $("#vdCli").value.trim(), c = S.contatos.find((x) => `${x.nome} · ${fmtWhats(x.whatsapp)}` === v);
    vdCli = c ? c.id : null; $("#vdPet").innerHTML = `<option value="">—</option>`;
    if (c && S.pet) { try { const d = await api("GET", `contatos/${c.id}`); $("#vdPet").innerHTML = `<option value="">Qualquer pet do tutor</option>` + d.pets.filter((p) => p.ativo).map((p) => `<option value="${p.id}">${esc(p.nome)} · ${PORTE[p.porte]}</option>`).join(""); if (d.pets.filter((p) => p.ativo).length === 1) $("#vdPet").selectedIndex = 1; } catch {} }
  });
  async function abrirVender(contato) {
    S.pacotes = await api("GET", "pacotes");
    const ativos = S.pacotes.filter((p) => p.ativo);
    if (!ativos.length) { toast(admin() ? "Crie um pacote à venda primeiro (aba Pacotes)." : "Nenhum pacote à venda. Peça ao administrador para criar.", true); return; }
    $("#vdPk").innerHTML = ativos.map((p) => `<option value="${p.id}">${esc(p.nome)} · ${brl(p.preco_centavos)}</option>`).join("");
    $("#vdValor").value = centsTxt(ativos[0].preco_centavos); $("#vdIni").value = hojeBR(); $("#vdErr").textContent = ""; $("#vdCli").value = ""; vdCli = null; $("#vdPet").innerHTML = "";
    S.contatos = await api("GET", "contatos?q=");
    $("#vdCliLista").innerHTML = S.contatos.map((c) => `<option value="${esc(c.nome)} · ${esc(fmtWhats(c.whatsapp))}">`).join("");
    if (contato) { const c = S.contatos.find((x) => x.id === contato); if (c) { $("#vdCli").value = `${c.nome} · ${fmtWhats(c.whatsapp)}`; $("#vdCli").dispatchEvent(new Event("input")); } }
    vdResumo(); dVd.showModal();
  }
  aoEnviar(dVd, async () => {
    if (!vdCli) throw new Error("Escolha o cliente na lista (cadastre-o antes, se for novo).");
    const valor = reais($("#vdValor").value); if (Number.isNaN(valor)) throw new Error("Valor inválido.");
    await api("POST", "pacotes-vendidos", { pacote_id: +$("#vdPk").value, contato_id: vdCli, pet_id: $("#vdPet").value ? +$("#vdPet").value : null, inicio: $("#vdIni").value, valor_centavos: valor });
    toast("Pacote vendido. Agende as sessões escolhendo “Pagamento: pacote”.", false, 5000);
    if ($("#v-pacotes").classList.contains("on")) await pacotes();
    if (dCli.open && cliId === vdCli) preencheCli(await api("GET", `contatos/${vdCli}`));
  });

  // ---------- plano ----------
  async function plano() {
    const p = await api("GET", "plano"), box = $("#planoBox");
    const SIT = { ativa: ["Ativa", "ok"], cortesia: ["Cortesia", "p"], teste: ["Período de teste", "warn"], pendente: ["Pagamento pendente", "warn"], inadimplente: ["Pagamento em atraso", "bad"], cancelada: ["Cancelada", "bad"], sem_assinatura: ["Sem assinatura", "bad"], desconhecida: ["Em verificação", ""] };
    const [st, cor] = SIT[p.status] || [p.status, ""];
    const lims = Object.entries(p.nomes || {}).map(([k, nome]) => {
      const max = Number(p.limites?.[k]) || 0, uso = Number(p.uso?.[k]) || 0, pct = max ? Math.min(100, Math.round((100 * uso) / max)) : 0;
      return `<div class="plano-lim"><div class="row sb small"><b>${esc(nome[0].toUpperCase() + nome.slice(1))}</b><span>${uso}${max ? ` de ${max}` : " · sem limite"}</span></div>${max ? `<div class="bar"><i class="${pct >= 100 ? "cheio" : ""}" style="width:${pct}%"></i></div>` : ""}</div>`;
    }).join("");
    box.innerHTML = `<div class="row sb"><div><p class="small mute">Plano</p><h2>${esc(p.plano || (p.status === "cortesia" ? "Cortesia LLD Works" : "Plano sob medida"))}</h2></div><span class="chip ${cor}">${st}</span></div>
      ${p.vence_em ? `<p class="small mute" style="margin-top:6px">${p.status === "teste" ? "Teste até" : "Vence em"} ${fmtD(p.vence_em)}/${p.vence_em.slice(0, 4)}</p>` : ""}
      ${!p.liberada ? '<p class="aviso">A assinatura não está liberada: a vitrine mostra “indisponível” para os seus clientes. Fale com a LLD Works para regularizar.</p>' : ""}
      ${lims}
      <div style="margin-top:16px;display:flex;flex-wrap:wrap;align-items:center;gap:10px">${p.status === "cortesia" ? "" : '<a class="btn sm pri" href="/assinar">Pagar ou trocar de plano</a><span class="small mute">Pix ou cartão em até 12x</span>'}</div><p class="small mute" style="margin-top:10px">Dúvidas sobre os planos? <a href="https://produtos.lldworks.com.br/#serviceworks" target="_blank" rel="noopener">Fale com a LLD Works</a>.</p>`;
  }

  // ---------- relatórios ----------
  async function relatorio() {
    if (!$("#relDe").value) { $("#relDe").value = hojeBR().slice(0, 8) + "01"; $("#relAte").value = hojeBR(); }
    const r = await api("GET", `relatorio?de=${$("#relDe").value}&ate=${$("#relAte").value}`);
    const st = Object.fromEntries(r.por_status.map((x) => [x.status, x])), n = (s) => st[s]?.n || 0, v = (s) => st[s]?.v || 0;
    const taxa = n("concluido") + n("faltou") ? Math.round((100 * n("faltou")) / (n("concluido") + n("faltou"))) : 0;
    $("#relKpis").innerHTML = [["Atendidos", n("concluido"), brl(v("concluido")) + " faturado"], ["A atender", n("confirmado"), brl(v("confirmado")) + " previsto"], ["Faltas", n("faltou"), `${taxa}% de quem deveria vir`], ["Cancelados", n("cancelado"), brl(v("cancelado")) + " que não entrou"], ["Pacotes vendidos", r.pacotes?.n || 0, brl(r.pacotes?.v || 0) + " recebido"]]
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
    try { await api("PUT", "empresa", corpo); await config(); modoSegmento(); $("#empNome").textContent = S.emp.nome; $("#lnkVitrine").href = linkVitrine(); toast("Configurações salvas."); }
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
      else if (ac === "petNovo") abrirPet(cliId, null);
      else if (ac === "pet") abrirPet(cliId, id);
      else if (ac === "venderCli") await abrirVender(cliId);
      else if (ac === "venderNovo") await abrirVender(null);
      else if (ac === "pkNovo") await abrirPk(null);
      else if (ac === "pk") await abrirPk(id);
      else if (ac === "pkDel") { if (!confirm("Arquivar este pacote? Ele sai da venda; os já vendidos continuam valendo.")) return; await api("DELETE", `pacotes/${id}`); toast("Pacote arquivado."); await pacotes(); }
      else if (ac === "pvCancelar") { if (!confirm("Cancelar este pacote vendido? As sessões restantes deixam de valer; os agendamentos já marcados continuam.")) return; await api("PUT", `pacotes-vendidos/${id}`, { status: "cancelado" }); toast("Pacote cancelado."); await pacotes(); }
      else if (ac === "pvAgendar") { await abrirNovo(null, null, id); $("#agSrv").value = b.dataset.s; $("#agSrv").dispatchEvent(new Event("change")); }
    } catch (x) { toast(x.message, true); }
  });

  // ---------- extensões (app2.js: início, caixa, produtos, promoções, espera, integrações...) ----------
  window.SW = { api, toast, aba, S, esc, brl, reais, centsTxt, hojeBR, somaDias, fmtD, fmtDH, fmtDia, fmtWhats, waLink, abrirCli, CARREGA, admin, agenda, aoEnviar, linkVitrine, evAtual: () => evAtual };

  // ---------- início ----------
  base().then(() => { const v = location.hash.slice(1); aba(CARREGA[v] ? v : CARREGA.inicio ? "inicio" : "agenda"); }).catch((e) => { $("#empNome").textContent = "Erro ao carregar"; toast(e.message, true); });
  setInterval(() => { if ($("#v-agenda").classList.contains("on") && !document.querySelector("dialog[open]") && document.visibilityState === "visible") agenda().catch(() => {}); }, 60000);
})();
