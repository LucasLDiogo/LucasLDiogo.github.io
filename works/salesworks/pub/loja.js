// SalesWorks — loja online pública: o cliente monta o carrinho e faz o pedido sem login.
"use strict";
(() => {
  const $ = (s, r = document) => r.querySelector(s), $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const brl = (c) => (Number(c || 0) / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
  const num = (v) => { let s = String(v ?? "").trim().replace(/[R$\s]/g, ""); if (!s) return null; if (s.includes(",")) s = s.replace(/\./g, "").replace(",", "."); const n = Number(s); return Number.isFinite(n) ? n : NaN; };
  const UN = { un: "un", kg: "kg", pct: "pct", cx: "cx", l: "L" };
  const fracao = (u) => u === "kg" || u === "l";
  const passo = (u) => (fracao(u) ? 0.5 : 1);
  const qtdTxt = (q, u) => (fracao(u) ? `${String(q).replace(".", ",")} ${u}` : `${q} ${UN[u]}`);
  const ST = [["novo", "Pedido recebido"], ["confirmado", "Confirmado pela loja"], ["separacao", "Em separação"], ["pronto", "Pronto / saiu para entrega"], ["entregue", "Entregue"]];
  const slug = decodeURIComponent(location.pathname.split("/")[1] || "").toLowerCase();
  const BASE = `/api/publico/${encodeURIComponent(slug)}`;
  const CHAVE = `salesworks:${slug}`;
  const guarda = { get(k) { try { return JSON.parse(localStorage.getItem(`${CHAVE}:${k}`)); } catch { return null; } }, set(k, v) { try { localStorage.setItem(`${CHAVE}:${k}`, JSON.stringify(v)); } catch {} } };
  const E = { loja: null, cats: [], prods: [], car: {}, cat: "", ultimo: null };
  let tt;
  const toast = (m) => { const t = $("#toast"); t.textContent = m; t.classList.add("on"); clearTimeout(tt); tt = setTimeout(() => t.classList.remove("on"), 3000); };
  async function api(caminho, opt = {}) {
    const r = await fetch(BASE + caminho, { ...opt, headers: opt.body ? { "Content-Type": "application/json" } : {} });
    let d = null; try { d = await r.json(); } catch {}
    if (!r.ok) { const e = new Error(d?.erro || "Não foi possível concluir. Tente de novo."); e.status = r.status; throw e; }
    return d;
  }
  const valor = (p) => (p.promo_centavos != null ? p.promo_centavos : p.preco_centavos);
  function erro(t, m) { $("#lNome").textContent = "Loja online"; $("#lErroT").textContent = t; $("#lErroM").textContent = m; $("#lErro").hidden = false; $("#catalogo").hidden = true; }

  // ---------- carga ----------
  async function iniciar() {
    if (!/^[a-z0-9][a-z0-9-]{2,39}$/.test(slug)) return erro("Loja não encontrada", "Confira o endereço que você recebeu.");
    let d;
    try { d = await api(""); } catch (e) { return erro(e.status === 404 ? "Loja não encontrada" : "Loja indisponível", e.status === 404 ? "Confira o endereço que você recebeu." : e.message); }
    E.loja = d.loja; E.cats = d.categorias; E.prods = d.produtos;
    const l = E.loja;
    document.documentElement.style.setProperty("--p", l.cor); $('meta[name="theme-color"]').content = l.cor;
    document.title = `${l.nome} · Faça seu pedido`;
    $("#lNome").textContent = l.nome; $("#lDesc").textContent = l.descricao || "";
    const st = $("#lSt"); st.hidden = false; st.className = "chip " + (l.aberta ? "on" : "off"); st.textContent = l.aberta ? "Recebendo pedidos" : "Fechada no momento";
    if (l.horario) { $("#lHor").hidden = false; $("#lHor").textContent = l.horario; }
    const ent = [l.entrega && (l.taxa_entrega ? `Entrega ${brl(l.taxa_entrega)}` : "Entrega grátis"), l.retirada && "Retirada na loja"].filter(Boolean).join(" · ");
    $("#lEnt").hidden = !ent; $("#lEnt").textContent = ent;
    if (l.pedido_minimo) { $("#lMin").hidden = false; $("#lMin").textContent = `Pedido mínimo ${brl(l.pedido_minimo)}`; }
    if (l.whatsapp) { const w = $("#lWa"); w.hidden = false; w.href = `https://wa.me/${l.whatsapp}`; }
    // carrinho guardado: só o que ainda existe, sem passar do disponível
    const salvo = guarda.get("carrinho") || {};
    for (const [id, q] of Object.entries(salvo)) { const p = E.prods.find((x) => x.id === +id); if (p && !p.esgotado && q > 0) E.car[id] = p.ultimas != null ? Math.min(q, p.ultimas) : q; }
    const cli = guarda.get("cliente") || {}; $("#fNome").value = cli.nome || ""; $("#fWhats").value = cli.whatsapp || ""; $("#fEnd").value = cli.endereco || "";
    E.ultimo = guarda.get("ultimo");
    $("#catalogo").hidden = false; desenhaCats(); desenha(); barra();
  }

  // ---------- catálogo ----------
  function desenhaCats() {
    const usadas = E.cats.filter((c) => E.prods.some((p) => p.categoria_id === c.id));
    $("#cats").innerHTML = [["", "Tudo"], ...(E.prods.some((p) => p.destaque) ? [["dst", "Destaques"]] : []), ...usadas.map((c) => [String(c.id), c.nome])]
      .map(([v, n]) => `<button type="button" data-cat="${v}" aria-pressed="${E.cat === v}">${esc(n)}</button>`).join("");
    $("#cats").hidden = usadas.length < 2 && !E.prods.some((p) => p.destaque);
  }
  function stepper(p) {
    const q = E.car[p.id] || 0;
    if (p.esgotado) return `<button class="btn full" type="button" disabled>Esgotado</button>`;
    if (!E.loja.aberta) return `<button class="btn full" type="button" disabled>Loja fechada</button>`;
    if (!q) return `<button class="btn pri full" type="button" data-act="mais" data-id="${p.id}">Adicionar</button>`;
    return `<div class="step"><button type="button" data-act="menos" data-id="${p.id}" aria-label="Tirar ${esc(p.nome)}">−</button><output aria-live="polite">${esc(qtdTxt(q, p.unidade))}</output><button type="button" data-act="mais" data-id="${p.id}" aria-label="Mais ${esc(p.nome)}">+</button></div>`;
  }
  function cartao(p) {
    const ini = esc(p.nome.trim()[0] || "•").toUpperCase();
    const tag = p.esgotado ? '<span class="chip bad">Esgotado</span>' : p.ultimas != null ? `<span class="chip warn">Últimas ${esc(qtdTxt(p.ultimas, p.unidade))}</span>` : p.promo_centavos != null ? '<span class="chip p">Promoção</span>' : "";
    return `<article class="pd ${p.esgotado ? "esg" : ""}" id="p${p.id}">
      <div class="ft">${p.imagem_url ? `<img src="${esc(p.imagem_url)}" alt="" loading="lazy" referrerpolicy="no-referrer">` : ini}${tag}</div>
      <div class="cp"><div class="nm">${esc(p.nome)}</div>${p.descricao ? `<div class="ds">${esc(p.descricao)}</div>` : ""}
      <div class="pr">${p.promo_centavos != null ? `<s>${brl(p.preco_centavos)}</s>` : ""}<b>${brl(valor(p))}</b><span>/${UN[p.unidade]}</span></div></div>
      <div class="ac" data-step="${p.id}">${stepper(p)}</div></article>`;
  }
  function desenha() {
    const q = $("#busca").value.trim().toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
    const casa = (p) => !q || (p.nome + " " + (p.descricao || "")).toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").includes(q);
    let grupos;
    if (q) grupos = [["Resultado da busca", E.prods.filter(casa)]];
    else if (E.cat === "dst") grupos = [["Destaques", E.prods.filter((p) => p.destaque)]];
    else if (E.cat) grupos = [[E.cats.find((c) => String(c.id) === E.cat)?.nome || "", E.prods.filter((p) => String(p.categoria_id) === E.cat)]];
    else {
      grupos = E.cats.map((c) => [c.nome, E.prods.filter((p) => p.categoria_id === c.id)]);
      const sem = E.prods.filter((p) => !p.categoria_id || !E.cats.some((c) => c.id === p.categoria_id));
      if (sem.length) grupos.push([E.cats.length ? "Outros" : "Produtos", sem]);
      const dst = E.prods.filter((p) => p.destaque); if (dst.length && E.cats.length) grupos.unshift(["Destaques", dst]);
    }
    grupos = grupos.filter(([, l]) => l.length);
    $("#lista").innerHTML = grupos.length ? grupos.map(([t, l]) => `<h2 class="sec">${esc(t)}</h2><div class="prods">${l.map(cartao).join("")}</div>`).join("")
      : `<div class="empty" style="margin-top:16px">${q ? "Nenhum produto encontrado." : "A loja ainda não cadastrou produtos."}</div>`;
    // ids repetidos (destaque + categoria): mantém só o primeiro como âncora
    const vistos = new Set(); $$("#lista .pd").forEach((el) => { if (vistos.has(el.id)) el.removeAttribute("id"); vistos.add(el.id); });
  }
  function muda(id, delta) {
    const p = E.prods.find((x) => x.id === id); if (!p) return;
    let q = Math.round(((E.car[id] || 0) + delta * passo(p.unidade)) * 1000) / 1000;
    if (p.ultimas != null && q > p.ultimas) { q = p.ultimas; toast(`Só temos ${qtdTxt(p.ultimas, p.unidade)} de ${p.nome}.`); }
    if (q <= 0) delete E.car[id]; else E.car[id] = q;
    guarda.set("carrinho", E.car);
    $$(`[data-step="${id}"]`).forEach((el) => (el.innerHTML = stepper(p)));
    barra(); if ($("#dCar").open) desenhaCarrinho();
  }

  // ---------- carrinho ----------
  const linhas = () => Object.entries(E.car).map(([id, q]) => { const p = E.prods.find((x) => x.id === +id); return p && { p, q, total: Math.round(valor(p) * q) }; }).filter(Boolean);
  const subtotal = () => linhas().reduce((s, i) => s + i.total, 0);
  function barra() {
    const l = linhas(), n = l.length;
    $("#barra").hidden = !n;
    $("#bQtd").textContent = n === 1 ? "Ver carrinho · 1 produto" : `Ver carrinho · ${n} produtos`; $("#bTot").textContent = brl(subtotal());
  }
  const tipo = () => $('input[name="tipo"]:checked')?.value || "";
  const pag = () => $('input[name="pag"]:checked')?.value || "";
  function opcoes() {
    const l = E.loja, tipos = [l.entrega && ["entrega", `Entrega${l.taxa_entrega ? ` (${brl(l.taxa_entrega)})` : " grátis"}`], l.retirada && ["retirada", "Retirar na loja"]].filter(Boolean);
    const salvo = guarda.get("cliente") || {};
    const t = tipos.find((x) => x[0] === salvo.tipo)?.[0] || tipos[0][0];
    $("#oTipo").innerHTML = tipos.map(([v, n]) => `<label><input type="radio" name="tipo" value="${v}" ${v === t ? "checked" : ""}>${esc(n)}</label>`).join("");
    const pags = [l.aceita_pix && ["pix", "Pix"], ["dinheiro", "Dinheiro"], ["cartao", tipos.length === 1 && tipos[0][0] === "retirada" ? "Cartão na loja" : "Cartão (maquininha)"]].filter(Boolean);
    const pg = pags.find((x) => x[0] === salvo.pagamento)?.[0] || pags[0][0];
    $("#oPag").innerHTML = pags.map(([v, n]) => `<label><input type="radio" name="pag" value="${v}" ${v === pg ? "checked" : ""}>${esc(n)}</label>`).join("");
    reflete();
  }
  function reflete() { $("#wEnd").hidden = tipo() !== "entrega"; $("#wTroco").hidden = pag() !== "dinheiro"; desenhaTotais(); }
  function desenhaCarrinho() {
    const l = linhas();
    if (!l.length) { $("#dCar").close(); return; }
    $("#carItens").innerHTML = l.map(({ p, q, total }) => `<div class="it"><div><b>${esc(p.nome)}</b><div class="v">${brl(valor(p))}/${UN[p.unidade]} · ${brl(total)}</div></div>
      <div class="step"><button type="button" data-act="menos" data-id="${p.id}" aria-label="Tirar ${esc(p.nome)}">−</button><output>${esc(qtdTxt(q, p.unidade))}</output><button type="button" data-act="mais" data-id="${p.id}" aria-label="Mais ${esc(p.nome)}">+</button></div></div>`).join("");
    desenhaTotais();
  }
  function desenhaTotais() {
    const sub = subtotal(), taxa = tipo() === "entrega" ? E.loja.taxa_entrega : 0, falta = E.loja.pedido_minimo - sub;
    $("#carTot").innerHTML = `<span>Produtos</span><span>${brl(sub)}</span>${tipo() === "entrega" ? `<span>Entrega</span><span>${taxa ? brl(taxa) : "Grátis"}</span>` : ""}<span class="g">Total</span><span class="g">${brl(sub + taxa)}</span>`;
    const m = $("#carMin"); m.hidden = falta <= 0; m.textContent = falta > 0 ? `Faltam ${brl(falta)} para o pedido mínimo de ${brl(E.loja.pedido_minimo)}.` : "";
    $("#btFin").disabled = falta > 0;
  }
  function abrirCarrinho() { if (!E.loja.aberta) return toast("A loja está fechada no momento."); opcoes(); desenhaCarrinho(); $("#carErr").textContent = ""; $("#dCar").showModal(); }
  $("#fCar").addEventListener("change", (e) => { if (e.target.name === "tipo" || e.target.name === "pag") reflete(); });
  $("#fCar").addEventListener("submit", async (e) => {
    if (e.submitter?.value !== "ok") return; e.preventDefault();
    const er = $("#carErr"); er.textContent = "";
    const nome = $("#fNome").value.trim(), whats = $("#fWhats").value.trim(), end = $("#fEnd").value.trim(), troco = num($("#fTroco").value);
    if (nome.length < 2) { er.textContent = "Informe seu nome."; $("#fNome").focus(); return; }
    if (whats.replace(/\D/g, "").length < 10) { er.textContent = "Informe o WhatsApp com DDD."; $("#fWhats").focus(); return; }
    if (tipo() === "entrega" && end.length < 8) { er.textContent = "Informe o endereço completo para a entrega."; $("#fEnd").focus(); return; }
    if (Number.isNaN(troco)) { er.textContent = "Troco: use um valor como 100 ou 50,00."; return; }
    const b = $("#btFin"); b.disabled = true; b.textContent = "Enviando…";
    try {
      const r = await api("/pedido", { method: "POST", body: JSON.stringify({ nome, whatsapp: whats, tipo: tipo(), endereco: end, pagamento: pag(), troco_para: pag() === "dinheiro" ? troco : null, observacoes: $("#fObs").value, itens: linhas().map(({ p, q }) => ({ produto_id: p.id, quantidade: q })) }) });
      guarda.set("cliente", { nome, whatsapp: whats, endereco: end || (guarda.get("cliente") || {}).endereco || "", tipo: tipo(), pagamento: pag() });
      E.ultimo = { codigo: r.codigo, whatsapp: whats }; guarda.set("ultimo", E.ultimo);
      E.car = {}; guarda.set("carrinho", {}); $("#fObs").value = ""; $("#fTroco").value = "";
      $("#dCar").close(); sucesso(r);
      api("").then((d) => { E.prods = d.produtos; desenha(); }).catch(() => {});
      desenha(); barra();
    } catch (x) {
      er.textContent = x.message;
      if (x.status === 409) api("").then((d) => { E.prods = d.produtos; for (const id of Object.keys(E.car)) { const p = E.prods.find((y) => y.id === +id); if (!p || p.esgotado) delete E.car[id]; else if (p.ultimas != null && E.car[id] > p.ultimas) E.car[id] = p.ultimas; } guarda.set("carrinho", E.car); desenha(); barra(); desenhaCarrinho(); }).catch(() => {});
    } finally { b.textContent = "Finalizar pedido"; desenhaTotais(); }
  });
  function sucesso(r) {
    $("#okTxt").textContent = `Código do pedido: ${r.codigo} · Total ${brl(r.total)}. ${r.tipo === "entrega" ? "A loja vai confirmar e avisar quando sair para entrega." : "A loja vai avisar quando estiver pronto para retirar."}`;
    $("#okPix").hidden = !r.pix_chave; $("#okChave").textContent = r.pix_chave || "";
    const z = $("#okZap"); z.hidden = !r.whatsapp_link; if (r.whatsapp_link) z.href = r.whatsapp_link;
    $("#dOk").showModal();
  }

  // ---------- acompanhar ----------
  function abrirAcompanhar(ult = false) {
    if ($("#dOk").open) $("#dOk").close();
    $("#aCod").value = (ult || !$("#aCod").value) && E.ultimo ? E.ultimo.codigo : $("#aCod").value; $("#aWhats").value = $("#aWhats").value || E.ultimo?.whatsapp || (guarda.get("cliente") || {}).whatsapp || "";
    $("#aErr").textContent = ""; $("#aRes").innerHTML = ""; $("#dAc").showModal();
    if (ult) consultar();
  }
  async function consultar() {
    const er = $("#aErr"); er.textContent = ""; $("#aRes").innerHTML = "";
    const cod = $("#aCod").value.trim().toUpperCase(), w = $("#aWhats").value.trim();
    if (!cod || w.replace(/\D/g, "").length < 10) { er.textContent = "Informe o código e o WhatsApp do pedido."; return; }
    try {
      const p = await api(`/pedido?codigo=${encodeURIComponent(cod)}&whatsapp=${encodeURIComponent(w)}`);
      const i = ST.findIndex(([s]) => s === p.status);
      $("#aRes").innerHTML = (p.status === "cancelado" ? '<div class="aviso">Este pedido foi cancelado. Fale com a loja pelo WhatsApp.</div>'
        : `<div class="linha">${ST.map(([s, n], k) => `<div class="e ${k <= i ? "feito" : ""} ${k === i ? "atual" : ""}"><span>${n === ST[3][1] && p.tipo === "retirada" ? "Pronto para retirar" : n}</span></div>`).join("")}</div>`)
        + `<div class="card" style="margin-top:8px;padding:12px">${p.itens.map((x) => `<div class="row sb"><span>${esc(qtdTxt(x.quantidade, x.unidade))} ${esc(x.nome)}</span><span>${brl(x.total_centavos)}</span></div>`).join("")}<div class="row sb" style="margin-top:8px"><b>Total</b><b>${brl(p.total)}</b></div></div>`;
    } catch (x) { er.textContent = x.message; }
  }
  $("#fAc").addEventListener("submit", (e) => { if (e.submitter?.value !== "ok") return; e.preventDefault(); consultar(); });

  // ---------- eventos ----------
  document.addEventListener("click", (e) => {
    const c = e.target.closest("[data-cat]");
    if (c) { E.cat = c.dataset.cat; $("#busca").value = ""; $$("#cats button").forEach((b) => b.setAttribute("aria-pressed", String(b === c))); desenha(); return; }
    const b = e.target.closest("[data-act]"); if (!b) return;
    const id = +b.dataset.id;
    ({
      mais: () => muda(id, 1), menos: () => muda(id, -1), carrinho: abrirCarrinho,
      acompanhar: () => abrirAcompanhar(false), acompanharUlt: () => abrirAcompanhar(true),
      copiaPix: async () => { try { await navigator.clipboard.writeText($("#okChave").textContent); toast("Chave Pix copiada."); } catch { toast("Copie a chave manualmente."); } },
    })[b.dataset.act]?.();
  });
  let tb; $("#busca").addEventListener("input", () => { clearTimeout(tb); tb = setTimeout(desenha, 150); });

  iniciar();
})();
