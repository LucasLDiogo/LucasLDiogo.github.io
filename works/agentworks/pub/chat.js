// AgentWorks — chat público: o cliente conversa com o assistente (e com a equipe, quando ela assume) sem login.
"use strict";
(() => {
  const $ = (s) => document.querySelector(s);
  const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const slug = decodeURIComponent(location.pathname.split("/")[2] || "").toLowerCase();
  const embed = new URLSearchParams(location.search).get("embed") === "1";
  const BASE = `/api/publico/${encodeURIComponent(slug)}`, CH = `agentworks:${slug}`;
  const guarda = { get(k) { try { return JSON.parse(localStorage.getItem(`${CH}:${k}`)); } catch { return null; } }, set(k, v) { try { localStorage.setItem(`${CH}:${k}`, JSON.stringify(v)); } catch {} } };
  const E = { info: null, hist: guarda.get("hist") || [], status: "robo", ultimo: 0, enviando: false };
  let sid = guarda.get("sid");
  if (!/^[A-Za-z0-9_-]{16,64}$/.test(sid || "")) { sid = btoa(String.fromCharCode(...crypto.getRandomValues(new Uint8Array(18)))).replace(/\+/g, "-").replace(/\//g, "_"); guarda.set("sid", sid); }
  async function api(c, opt = {}) {
    const r = await fetch(BASE + c, { ...opt, headers: opt.body ? { "Content-Type": "application/json" } : {} });
    let d = null; try { d = await r.json(); } catch {}
    if (!r.ok) { const e = new Error(d?.erro || "Não foi possível enviar. Tente de novo."); e.status = r.status; throw e; }
    return d;
  }
  const hora = (s) => (s ? String(s).slice(11, 16) : "");
  const QUEM = { robo: () => E.info?.nome_agente || "Assistente", humano: () => "Equipe" };
  function bolha(m, extra = "") {
    if (m.autor === "sistema") return `<div class="m sistema">${esc(m.texto)}</div>`;
    return `<div class="m ${m.autor} ${extra}" ${m.id ? `data-id="${m.id}"` : ""}>${QUEM[m.autor] ? `<span class="quem">${esc(QUEM[m.autor]())}</span>` : ""}${esc(m.texto)}<small>${hora(m.criado_em)}</small></div>`;
  }
  const rola = () => { const c = $("#msgs"); c.scrollTop = c.scrollHeight; };
  function desenha() {
    const saud = { autor: "robo", texto: E.info.saudacao };
    $("#msgs").innerHTML = `<p class="aviso-ia">Você está conversando com um assistente virtual com inteligência artificial. Se precisar, ele chama alguém da equipe.</p>` + [saud, ...E.hist].map((m) => bolha(m)).join("");
    rola();
  }
  function guardaHist() { E.hist = E.hist.slice(-60); guarda.set("hist", E.hist); }
  function sub() { $("#cSub").textContent = E.status === "humano" ? "Uma pessoa da equipe vai responder aqui" : "Assistente virtual · responde na hora"; }
  function junta(ms) {
    for (const m of ms) { if (m.id && E.hist.some((x) => x.id === m.id)) continue; E.hist.push(m); if (m.id && m.id < 1e12) E.ultimo = Math.max(E.ultimo, m.id); }
    guardaHist();
  }
  async function iniciar() {
    if (embed) { $("#fechar").hidden = false; $("#fechar").addEventListener("click", () => parent.postMessage({ tipo: "agentworks:fechar" }, "*")); }
    try { E.info = await api(""); }
    catch (e) { $("#cEmp").textContent = "Atendimento"; $("#msgs").innerHTML = `<div class="m sistema">${e.status === 404 ? "Este atendimento não existe. Confira o endereço." : esc(e.message)}</div>`; $("#fMsg").hidden = true; return; }
    document.documentElement.style.setProperty("--p", E.info.cor);
    document.querySelector('meta[name="theme-color"]').content = E.info.cor;
    document.title = `${E.info.empresa} · Atendimento`;
    $("#cEmp").textContent = E.info.empresa; $("#av").textContent = (E.info.nome_agente || "A").trim()[0].toUpperCase();
    if (!E.info.demonstracao) {
      try { const r = await api(`/mensagens?sid=${encodeURIComponent(sid)}&depois=0`); E.hist = []; E.ultimo = 0; junta(r.mensagens); E.status = r.status; } catch {}
    }
    sub(); desenha(); $("#texto").focus();
    if (!E.info.demonstracao) setInterval(buscar, 5000);
  }
  async function buscar() {
    if (document.hidden || E.enviando) return;
    try {
      const r = await api(`/mensagens?sid=${encodeURIComponent(sid)}&depois=${E.ultimo}`);
      const novas = r.mensagens.filter((m) => !E.hist.some((x) => x.id === m.id));
      if (r.status !== E.status) { E.status = r.status; sub(); }
      if (novas.length) { junta(novas); $("#msgs").insertAdjacentHTML("beforeend", novas.map((m) => bolha(m)).join("")); rola(); }
    } catch {}
  }
  $("#fMsg").addEventListener("submit", async (e) => {
    e.preventDefault();
    const t = $("#texto"), texto = t.value.trim();
    if (!texto || E.enviando) return;
    E.enviando = true; $("#btEnv").disabled = true; t.value = ""; ajusta();
    $("#msgs").insertAdjacentHTML("beforeend", bolha({ autor: "cliente", texto }, "pend") + (E.status === "humano" ? "" : '<div class="dig" id="dig"><i></i><i></i><i></i></div>')); rola();
    const historico = E.info.demonstracao ? E.hist.filter((m) => m.autor !== "sistema").slice(-8).map((m) => ({ autor: m.autor, texto: m.texto })) : undefined;
    try {
      const r = await api("/mensagem", { method: "POST", body: JSON.stringify({ sid, texto, historico }) });
      $("#dig")?.remove(); document.querySelector(".m.pend")?.remove();
      const ms = E.info.demonstracao ? [{ autor: "cliente", texto, criado_em: r.mensagens[0]?.criado_em }, ...r.mensagens] : r.mensagens;
      junta(ms); $("#msgs").insertAdjacentHTML("beforeend", ms.map((m) => bolha(m)).join(""));
      if (r.status !== E.status) { E.status = r.status; sub(); }
    } catch (x) {
      $("#dig")?.remove(); const p = document.querySelector(".m.pend"); if (p) { p.classList.remove("pend"); p.classList.add("falhou"); }
      $("#msgs").insertAdjacentHTML("beforeend", bolha({ autor: "sistema", texto: x.message }));
      t.value = texto;
    } finally { E.enviando = false; $("#btEnv").disabled = false; rola(); t.focus(); }
  });
  function ajusta() { const t = $("#texto"); t.style.height = "auto"; t.style.height = Math.min(t.scrollHeight, 130) + "px"; }
  $("#texto").addEventListener("input", ajusta);
  $("#texto").addEventListener("keydown", (e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); $("#fMsg").requestSubmit(); } });
  iniciar();
})();
