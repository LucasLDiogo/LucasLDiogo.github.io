// LinkWorks — painel. Fala só com /api/admin/* (o roteador confere a sessão e diz quem é o cliente).
"use strict";
(() => {
  const $ = (s, r = document) => r.querySelector(s), $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const REDES = [["instagram", "Instagram", "@seuperfil"], ["whatsapp", "WhatsApp", "(54) 99999-0000"], ["tiktok", "TikTok", "@seuperfil"], ["youtube", "YouTube", "@seucanal"], ["facebook", "Facebook", "suapagina"], ["linkedin", "LinkedIn", "seu-nome"], ["email", "E-mail", "contato@empresa.com"]];
  const S = { pag: null, links: [], papel: "admin" };
  const admin = () => S.papel === "admin";
  let tt;
  const toast = (m, erro = false) => { const t = $("#toast"); t.textContent = m; t.classList.toggle("err", erro); t.classList.add("on"); clearTimeout(tt); tt = setTimeout(() => t.classList.remove("on"), 3000); };
  async function api(metodo, caminho, corpo, texto = false) {
    const r = await fetch("/api/admin/" + caminho, { method: metodo, headers: corpo ? { "Content-Type": "application/json" } : {}, body: corpo ? JSON.stringify(corpo) : undefined, credentials: "same-origin" });
    if (r.status === 401) { location.href = "/entrar"; throw new Error("Sessão expirada. Entre de novo."); }
    if (texto && r.ok) return r.text();
    let d = null; try { d = await r.json(); } catch {}
    if (!r.ok) throw new Error(d?.erro || "Não foi possível concluir. Tente de novo.");
    return d;
  }
  const curta = (u) => u.replace(/^https?:\/\//, "").replace(/^mailto:/, "").replace(/\/$/, "");
  const fmtDH = (s) => (s ? `${s.slice(8, 10)}/${s.slice(5, 7)} ${s.slice(11, 16)}` : "");

  // ---------- abas e prévia ----------
  function aba(v) {
    $$(".nav button").forEach((b) => b.setAttribute("aria-selected", String(b.dataset.v === v)));
    $$(".view").forEach((s) => s.classList.toggle("on", s.id === "v-" + v));
    history.replaceState(null, "", "#" + v);
    if (v === "estat") estat().catch((e) => toast(e.message, true));
    if (v === "plano") planoTela().catch((e) => toast(e.message, true));
  }
  $(".nav").addEventListener("click", (e) => { const b = e.target.closest("[data-v]"); if (b) aba(b.dataset.v); });
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
      ${!p.liberada ? `<p class="aviso">A assinatura não está liberada: a sua página pública mostra “indisponível”. Fale com a LLD Works para regularizar.</p>` : ""}
      ${lims || '<p class="small mute" style="margin-top:12px">Seu plano não tem limite de uso neste produto.</p>'}
      <div style="margin-top:16px;display:flex;flex-wrap:wrap;align-items:center;gap:10px">${p.status === "cortesia" ? "" : '<a class="btn sm pri" href="/assinar">Pagar ou trocar de plano</a><span class="small mute">Pix ou cartão em até 12x</span>'}</div><p class="small mute" style="margin-top:10px">Dúvidas sobre os planos? <a href="https://produtos.lldworks.com.br/#linkworks" target="_blank" rel="noopener">Fale com a LLD Works</a>.</p>`;
  }
  async function previa() { try { $("#previa").srcdoc = await api("GET", "previa", null, true); } catch {} }

  // ---------- links ----------
  async function links() {
    S.links = await api("GET", "links");
    const agora = new Intl.DateTimeFormat("sv-SE", { timeZone: "America/Sao_Paulo", year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit" }).format(new Date()).replace(" ", "T");
    $("#lista").innerHTML = S.links.length ? S.links.map((l, i) => {
      const agendado = l.inicio && l.inicio > agora ? `aparece em ${fmtDH(l.inicio)}` : l.fim && l.fim <= agora ? `encerrado em ${fmtDH(l.fim)}` : l.fim ? `some em ${fmtDH(l.fim)}` : "";
      return `<div class="it ${l.ativo ? "" : "off"}">
      ${admin() ? `<div class="mv"><button class="btn sm ghost" data-act="sobe" data-i="${i}" aria-label="Subir ${esc(l.titulo)}" ${i ? "" : "disabled"}>▲</button><button class="btn sm ghost" data-act="desce" data-i="${i}" aria-label="Descer ${esc(l.titulo)}" ${i < S.links.length - 1 ? "" : "disabled"}>▼</button></div>` : "<span></span>"}
      <div class="t"><b>${esc(l.titulo)} ${l.destaque ? '<span class="chip p">destaque</span>' : ""} ${!l.ativo ? '<span class="chip">oculto</span>' : ""} ${agendado ? `<span class="chip warn">${esc(agendado)}</span>` : ""}</b><span>${esc(curta(l.url))} · ${l.cliques_30d} clique(s) em 30 dias</span></div>
      ${admin() ? `<div class="row" style="gap:6px;flex-wrap:nowrap"><button class="btn sm" data-act="alterna" data-id="${l.id}">${l.ativo ? "Ocultar" : "Mostrar"}</button><button class="btn sm" data-act="editar" data-id="${l.id}">Editar</button><button class="btn sm bad" data-act="apagar" data-id="${l.id}" aria-label="Apagar ${esc(l.titulo)}">✕</button></div>` : "<span></span>"}</div>`;
    }).join("") : '<div class="empty">Nenhum link ainda. Adicione o primeiro acima: WhatsApp, cardápio, loja, agenda…</div>';
  }
  const corpoLink = (l, extra = {}) => ({ titulo: l.titulo, url: l.url, destaque: !!l.destaque, ativo: !!l.ativo, inicio: l.inicio || null, fim: l.fim || null, ...extra });
  $("#fNovo").addEventListener("submit", async (e) => {
    e.preventDefault(); const er = $("#nErr"); er.textContent = "";
    try { await api("POST", "links", { titulo: $("#nTit").value.trim(), url: $("#nUrl").value.trim() }); $("#nTit").value = ""; $("#nUrl").value = ""; toast("Link adicionado."); await links(); previa(); $("#nTit").focus(); }
    catch (x) { er.textContent = x.message; }
  });
  const dLink = $("#dLink"); let editId = null;
  function editar(id) {
    const l = S.links.find((x) => x.id === id); editId = id;
    $("#eTit").value = l.titulo; $("#eUrl").value = l.url; $("#eIni").value = l.inicio || ""; $("#eFim").value = l.fim || ""; $("#eDst").checked = !!l.destaque; $("#eAtv").checked = !!l.ativo; $("#eErr").textContent = "";
    dLink.showModal();
  }
  $("#fLink").addEventListener("submit", async (e) => {
    if (e.submitter?.value !== "ok") return; e.preventDefault();
    const er = $("#eErr"); er.textContent = "";
    try { await api("PUT", `links/${editId}`, { titulo: $("#eTit").value.trim(), url: $("#eUrl").value.trim(), inicio: $("#eIni").value.slice(0, 16) || null, fim: $("#eFim").value.slice(0, 16) || null, destaque: $("#eDst").checked, ativo: $("#eAtv").checked }); dLink.close(); toast("Link salvo."); await links(); previa(); }
    catch (x) { er.textContent = x.message; }
  });
  async function mover(i, d) { const ids = S.links.map((l) => l.id); [ids[i], ids[i + d]] = [ids[i + d], ids[i]]; await api("POST", "links/ordem", { ids }); await links(); previa(); $$(`[data-act="${d < 0 ? "sobe" : "desce"}"]`)[Math.max(0, i + d)]?.focus(); }

  // ---------- página ----------
  function preenche() {
    const p = S.pag;
    $("#nomeTopo").textContent = p.titulo; $("#verPagina").href = p.endereco; $("#verPagina").hidden = false; $("#endereco").textContent = p.endereco.replace("https://", "");
    $("#pTit").value = p.titulo; $("#pBio").value = p.bio || ""; $("#pFoto").value = p.avatar_url || ""; $("#pCor").value = p.cor; $("#pSlug").value = p.slug; $("#pPub").checked = !!p.publicada;
    $$('input[name=fundo]').forEach((r) => (r.checked = r.value === p.fundo)); $$('input[name=botao]').forEach((r) => (r.checked = r.value === p.botao));
    $("#redes").innerHTML = REDES.map(([k, n, ph]) => `<div><label for="r-${k}">${n}</label><input id="r-${k}" data-rede="${k}" maxlength="200" placeholder="${ph}" value="${esc(p.redes[k] || "")}"></div>`).join("");
    if (!admin()) $$("#fPag input,#fPag textarea").forEach((i) => (i.disabled = true));
  }
  $("#fPag").addEventListener("submit", async (e) => {
    e.preventDefault(); const er = $("#pErr"); er.textContent = "";
    const redes = Object.fromEntries($$("[data-rede]").map((i) => [i.dataset.rede, i.value.trim()]));
    try {
      await api("PUT", "pagina", { titulo: $("#pTit").value.trim(), bio: $("#pBio").value.trim(), avatar_url: $("#pFoto").value.trim(), cor: $("#pCor").value, fundo: $("input[name=fundo]:checked")?.value, botao: $("input[name=botao]:checked")?.value, redes, slug: $("#pSlug").value.trim().toLowerCase(), publicada: $("#pPub").checked });
      S.pag = await api("GET", "pagina"); preenche(); previa(); toast("Página salva.");
    } catch (x) { er.textContent = x.message; }
  });

  // ---------- estatísticas ----------
  const nf = (n) => Number(n || 0).toLocaleString("pt-BR");
  async function estat() {
    const dias = $("input[name=dias]:checked").value, r = await api("GET", `estatisticas?dias=${dias}`);
    $("#kpis").innerHTML = [["Visitas", nf(r.totais.visitas)], ["Cliques", nf(r.totais.cliques)], ["Taxa de clique", r.totais.ctr_pct.toLocaleString("pt-BR") + "%"], ["Pelo celular", r.totais.celular_pct + "%"]].map(([l, v]) => `<div class="card kpi"><div class="l">${l}</div><div class="v">${v}</div></div>`).join("");
    const mx = Math.max(1, ...r.dias.map((d) => Math.max(d.visitas, d.cliques)));
    $("#graf").innerHTML = r.dias.map((d) => `<div class="c" title="${d.dia.slice(8)}/${d.dia.slice(5, 7)}: ${d.visitas} visita(s), ${d.cliques} clique(s)"><i style="height:${(100 * d.visitas) / mx}%"></i><i class="k" style="height:${(100 * d.cliques) / mx}%"></i></div>`).join("");
    const f = (s) => `${s.slice(8)}/${s.slice(5, 7)}`; $("#grafEixo").innerHTML = `<span>${f(r.de)}</span><span>${f(r.ate)}</span>`;
    const barras = (lst, nome) => { const m = Math.max(1, ...lst.map((x) => x.n)); return lst.length && lst.some((x) => x.n) ? lst.filter((x) => x.n).map((x) => `<div style="margin-bottom:10px"><div class="row sb small"><b>${esc(x[nome])}</b><span>${nf(x.n)}</span></div><div class="bar"><i style="width:${(100 * x.n) / m}%"></i></div></div>`).join("") : '<p class="mute small">Ainda sem dados no período. Coloque o link na sua bio para começar.</p>'; };
    $("#topLinks").innerHTML = barras(r.links, "titulo"); $("#origens").innerHTML = barras(r.origens, "origem");
  }
  $$("input[name=dias]").forEach((r) => r.addEventListener("change", () => estat().catch((e) => toast(e.message, true))));

  // ---------- ações ----------
  document.addEventListener("click", async (e) => {
    const b = e.target.closest("[data-act]"); if (!b) return;
    const id = +b.dataset.id, i = +b.dataset.i;
    try {
      if (b.dataset.act === "sobe") await mover(i, -1);
      else if (b.dataset.act === "desce") await mover(i, 1);
      else if (b.dataset.act === "editar") editar(id);
      else if (b.dataset.act === "alterna") { const l = S.links.find((x) => x.id === id); await api("PUT", `links/${id}`, corpoLink(l, { ativo: !l.ativo })); await links(); previa(); }
      else if (b.dataset.act === "apagar") { if (!confirm("Apagar este link? As estatísticas dele também são apagadas.")) return; await api("DELETE", `links/${id}`); toast("Link apagado."); await links(); previa(); }
      else if (b.dataset.act === "copiar") { await navigator.clipboard.writeText(S.pag.endereco); toast("Link copiado. Cole na bio do Instagram."); }
    } catch (x) { toast(x.message, true); }
  });

  (async () => {
    try {
      S.pag = await api("GET", "pagina"); S.papel = S.pag.papel;
      if (!admin()) $$("[data-adm]").forEach((x) => (x.hidden = true));
      preenche(); await links(); previa();
      const v = location.hash.slice(1); aba(["links", "pagina", "estat", "plano"].includes(v) ? v : "links");
    } catch (e) { $("#nomeTopo").textContent = "Erro ao carregar"; toast(e.message, true); }
  })();
})();
