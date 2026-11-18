// Painel do cliente PageWorks/ProWorks: situação do pedido e formulário de briefing (API /api/site → Hub).
(() => {
  "use strict";
  const $ = (s) => document.querySelector(s);
  const prod = document.body.dataset.produto, nomeP = prod === "proworks" ? "página" : "site";
  const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const data = (iso) => (iso ? new Date(iso.length === 10 ? iso + "T12:00:00" : iso).toLocaleDateString("pt-BR") : "");
  const st = $("#status"), box = $("#formBox"), form = $("#form");
  const ETAPAS = [["solicitado", "Briefing recebido"], ["em_criacao", "Em criação"], ["publicado", "No ar"]];
  function desenha(d) {
    const a = d.assinatura || {}, s = d.site;
    if (!a.liberada) {
      st.innerHTML = `<p class="aviso">Sua assinatura ainda não está ativa${a.status ? ` (situação: ${esc(a.status)})` : ""}. Assim que o pagamento for confirmado, o formulário libera aqui.</p><div class="linha-st"><a class="b pri" href="/assinar">Ver plano e pagamento</a></div>`;
      box.hidden = true; return;
    }
    if (!s || s.status === "cancelado") {
      st.innerHTML = `<p class="ok-m">Plano ${esc(a.plano || "")} ativo. Agora é com você: preencha o formulário abaixo para começarmos.</p>`;
      box.hidden = false; return;
    }
    const i = ETAPAS.findIndex(([k]) => k === s.status);
    st.innerHTML = `<h2 style="font:800 22px Montserrat,sans-serif;margin:0">${s.status === "publicado" ? `${prod === "proworks" ? "Sua página está no ar 🎉" : "Seu site está no ar 🎉"}` : (prod === "proworks" ? "Sua página está sendo feita" : "Seu site está sendo feito")}</h2>
      <p class="sub" style="margin:8px 0 0">${s.status === "publicado" ? `Publicado em ${data(s.publicado_em)}.` : `Pedido em ${data(s.solicitado_em)} · previsão de entrega: <b>${data(s.prazo)}</b>.`}</p>
      <div class="etapas">${ETAPAS.map(([k, t], j) => `<div class="${j < i || s.status === "publicado" ? "feito" : j === i ? "agora" : ""}">${j < i || s.status === "publicado" ? "✓ " : ""}${t}</div>`).join("")}</div>
      <div class="linha-st">${s.url ? `<a class="b pri" href="${esc(s.url)}" target="_blank" rel="noopener">Abrir ${prod === "proworks" ? "minha página" : "meu site"} ↗</a>` : ""}<button class="b" type="button" id="btEditar">${s.status === "publicado" ? "Pedir ajuste do mês" : "Complementar as informações"}</button></div>`;
    $("#btEditar").addEventListener("click", () => { box.hidden = false; box.scrollIntoView({ behavior: "smooth" }); });
    box.hidden = true;
  }
  function carrega() {
    fetch("/api/site", { credentials: "same-origin" }).then(async (r) => {
      if (r.status === 401) { location.href = "/entrar?volta=/app"; return; }
      const d = await r.json(); if (!r.ok) throw new Error(d.erro || "Falha");
      if (d.site && d.dados) for (const [k, v] of Object.entries(d.dados)) { const el = form.elements[k]; if (el && typeof v === "string") el.value = v; }
      desenha(d);
    }).catch((e) => { st.innerHTML = `<p class="aviso">${esc(e.message || "Não consegui carregar agora.")} <a href="/app">Tentar de novo</a></p>`; });
  }
  form.addEventListener("submit", async (ev) => {
    ev.preventDefault();
    const dados = Object.fromEntries(new FormData(form));
    if (!Object.values(dados).some((v) => String(v).trim())) return;
    const bt = form.querySelector("button[type=submit]"); bt.disabled = true; bt.textContent = "Enviando…";
    try {
      const r = await fetch("/api/site", { method: "POST", credentials: "same-origin", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ dados }) });
      const d = await r.json(); if (!r.ok) throw new Error(d.erro || "Não consegui enviar.");
      carrega(); scrollTo({ top: 0, behavior: "smooth" });
    } catch (e) { alertaErro(e.message); } finally { bt.disabled = false; bt.textContent = "Enviar e começar"; }
  });
  function alertaErro(m) { let p = form.querySelector(".aviso"); if (!p) { p = document.createElement("p"); p.className = "aviso"; form.prepend(p); } p.textContent = m; }
  fetch("/api/conta/produto").then((r) => r.json()).then((d) => { if (d.whatsapp) { const n = String(d.whatsapp).replace(/\D/g, ""); $("#zapAjuda").innerHTML = ` ou pelo <a href="https://wa.me/${n.startsWith("55") ? n : "55" + n}" target="_blank" rel="noopener">WhatsApp</a>.`; } }).catch(() => {});
  carrega();
})();
