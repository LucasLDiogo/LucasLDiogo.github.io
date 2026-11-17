// SalesWorks — painel. Fala só com /api/admin/* (o roteador confere a sessão e diz quem é o cliente).
"use strict";
(() => {
  const $ = (s, r = document) => r.querySelector(s), $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const brl = (c) => (c / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
  const reais = (c) => (c == null ? "" : (c / 100).toFixed(2).replace(".", ","));
  const num = (v) => { let s = String(v ?? "").trim().replace(/[R$\s]/g, ""); if (!s) return null; if (s.includes(",")) s = s.replace(/\./g, "").replace(",", "."); const n = Number(s); return Number.isFinite(n) ? n : NaN; };
  const qtd = (q, u) => (u === "kg" || u === "l" ? `${String(q).replace(".", ",")} ${u}` : `${q}x`);
  const UN = { un: "un", kg: "kg", pct: "pct", cx: "cx", l: "L" };
  const ST = { novo: "Novo", confirmado: "Confirmado", separacao: "Em separação", pronto: "Pronto", entregue: "Entregue", cancelado: "Cancelado" };
  const PROX = { novo: ["confirmado", "Confirmar"], confirmado: ["separacao", "Separar"], separacao: ["pronto", "Pronto"], pronto: ["entregue", "Entregue ✓"] };
  const PAG = { pix: "Pix", dinheiro: "Dinheiro", cartao: "Cartão" };
  const fmtDH = (s) => (s ? `${s.slice(8, 10)}/${s.slice(5, 7)} ${s.slice(11, 16)}` : "—");
  const agoraBR = () => new Intl.DateTimeFormat("sv-SE", { timeZone: "America/Sao_Paulo", year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit" }).format(new Date()).replace(" ", "T");
  const hojeBR = () => agoraBR().slice(0, 10);
  const ha = (s) => { const m = Math.round((new Date(agoraBR() + ":00Z") - new Date(s + ":00Z")) / 60000); return m < 1 ? "agora" : m < 60 ? `há ${m} min` : m < 1440 ? `há ${Math.floor(m / 60)}h${String(m % 60).padStart(2, "0")}` : fmtDH(s); };
  const fone = (w) => { const d = String(w || "").replace(/^55/, ""); return d.length === 11 ? `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}` : d.length === 10 ? `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}` : d; };
  const zap = (w, t) => `https://wa.me/${w}?text=${encodeURIComponent(t)}`;

  const S = { loja: null, papel: "admin", peds: [], vistos: null, prods: null, cats: [], clis: [], itens: [] };
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
  const CARGA = { pedidos: () => pedidos(), produtos: () => produtos(), clientes: () => clientes(), relatorios: () => relatorio(), plano: () => planoTela(), loja: () => preencheLoja() };
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
      ${!p.liberada ? `<p class="aviso">A assinatura não está liberada: a loja online mostra “indisponível” para os seus clientes. Fale com a LLD Works para regularizar.</p>` : ""}
      ${lims || '<p class="small mute" style="margin-top:12px">Seu plano não tem limite de uso neste produto.</p>'}
      <p class="small mute" style="margin-top:16px">Precisa de mais? <a href="https://produtos.lldworks.com.br/#salesworks" target="_blank" rel="noopener">Fale com a LLD Works</a> para mudar de plano.</p>`;
  }
  function aba(v) {
    if (!CARGA[v] || (v === "loja" && !admin())) v = "pedidos";
    $$(".nav button").forEach((b) => b.setAttribute("aria-selected", String(b.dataset.v === v)));
    $$(".view").forEach((s) => s.classList.toggle("on", s.id === "v-" + v));
    history.replaceState(null, "", "#" + v);
    CARGA[v]().catch(falhou);
  }
  $(".nav").addEventListener("click", (e) => { const b = e.target.closest("[data-v]"); if (b) aba(b.dataset.v); });
  const abaAtual = () => $(".nav [aria-selected=true]")?.dataset.v;

  // ---------- loja ----------
  async function carregaLoja() {
    S.loja = await api("GET", "loja"); S.papel = S.loja.papel;
    $("#nomeTopo").textContent = S.loja.nome;
    const v = $("#verLoja"); v.href = S.loja.endereco_loja; v.hidden = false;
    const st = $("#stLoja"); st.hidden = false; st.className = "chip " + (S.loja.aberta ? "ok" : "bad"); st.textContent = S.loja.aberta ? "Loja aberta" : "Loja fechada";
    if (!admin()) $$("[data-adm]").forEach((x) => (x.hidden = true));
  }
  async function preencheLoja() {
    const l = S.loja; $("#lEnd").textContent = l.endereco_loja; $("#lSlug").value = l.slug; $("#lNome").value = l.nome; $("#lDesc").value = l.descricao || "";
    $("#lWhats").value = fone(l.whatsapp); $("#lCor").value = l.cor; $("#lAberta").checked = !!l.aberta; $("#lEnt").checked = !!l.entrega; $("#lRet").checked = !!l.retirada;
    $("#lTaxa").value = reais(l.taxa_entrega); $("#lMin").value = reais(l.pedido_minimo); $("#lPix").value = l.pix_chave || ""; $("#lEndF").value = l.endereco || ""; $("#lHor").value = l.horario || ""; $("#lErr").textContent = "";
  }
  $("#fLoja").addEventListener("submit", async (e) => {
    e.preventDefault(); const er = $("#lErr"); er.textContent = "";
    const taxa = num($("#lTaxa").value) ?? 0, min = num($("#lMin").value) ?? 0;
    if (Number.isNaN(taxa) || Number.isNaN(min)) { er.textContent = "Use valores como 7,50."; return; }
    if (!$("#lEnt").checked && !$("#lRet").checked) { er.textContent = "Marque entrega, retirada ou as duas."; return; }
    try {
      await api("PUT", "loja", { slug: $("#lSlug").value.trim().toLowerCase(), nome: $("#lNome").value.trim(), descricao: $("#lDesc").value, whatsapp: $("#lWhats").value.trim(), cor: $("#lCor").value, aberta: $("#lAberta").checked, entrega: $("#lEnt").checked, retirada: $("#lRet").checked, taxa_entrega: taxa, pedido_minimo: min, pix_chave: $("#lPix").value, endereco: $("#lEndF").value, horario: $("#lHor").value });
      await carregaLoja(); await preencheLoja(); toast("Loja salva.");
    } catch (x) { er.textContent = x.message; }
  });

  // ---------- pedidos ----------
  async function pedidos(auto = false) {
    const [r, ps] = await Promise.all([api("GET", "resumo"), api("GET", "pedidos?status=abertos")]);
    const ab = r.abertos, nAb = Object.values(ab).reduce((s, n) => s + n, 0);
    $("#kpis").innerHTML = [["Pedidos hoje", r.hoje.pedidos], ["Vendido hoje", brl(r.hoje.faturamento)], ["Em andamento", nAb], ["Vendido no mês", brl(r.mes.faturamento)], ["Ticket médio do mês", brl(r.mes.ticket)], ["Estoque baixo", r.estoque_baixo]]
      .map(([l, v]) => `<div class="card kpi"><div class="l">${l}</div><div class="v">${esc(v)}</div></div>`).join("");
    const novos = ps.filter((p) => p.status === "novo");
    if (S.vistos && auto) { const n = novos.filter((p) => !S.vistos.has(p.id)).length; if (n) toast(n === 1 ? "Chegou um pedido novo!" : `Chegaram ${n} pedidos novos!`); }
    S.vistos = new Set(novos.map((p) => p.id)); S.peds = ps;
    document.title = (novos.length ? `(${novos.length}) ` : "") + "SalesWorks · Painel";
    $("#kb").innerHTML = ["novo", "confirmado", "separacao", "pronto"].map((st) => {
      const l = ps.filter((p) => p.status === st).sort((a, b) => a.criado_em.localeCompare(b.criado_em));
      return `<div class="col"><h2>${ST[st]}<span class="chip ${st === "novo" && l.length ? "p" : ""}">${l.length}</span></h2>${l.map(card).join("") || '<p class="mute small" style="padding:4px">Nenhum.</p>'}</div>`;
    }).join("");
    const fin = ps.filter((p) => p.status === "entregue" || p.status === "cancelado");
    $("#finInfo").textContent = fin.length ? `${fin.length} pedido(s)` : "";
    $("#fin").innerHTML = fin.map((p) => `<tr><td><button class="btn sm ghost" data-act="ver" data-id="${p.id}">#${esc(p.codigo)}</button></td><td>${esc(p.cliente)}</td><td>${fmtDH(p.criado_em)}</td><td><span class="chip st-${p.status}">${ST[p.status]}</span></td><td class="n">${brl(p.total)}</td></tr>`).join("") || '<tr><td colspan="5" class="mute">Nada finalizado por enquanto.</td></tr>';
  }
  function card(p) {
    const px = PROX[p.status];
    return `<div class="pc ${p.status === "novo" ? "novo" : ""}" data-act="ver" data-id="${p.id}" role="button" tabindex="0">
      <div class="l1"><b>#${esc(p.codigo)}</b><span class="h">${ha(p.criado_em)}</span></div>
      <div class="cl">${esc(p.cliente)}</div>
      <div class="l3"><span class="chip">${p.tipo === "entrega" ? "Entrega" : "Retirada"}</span><span class="chip">${PAG[p.pagamento]}</span>${p.origem === "painel" ? '<span class="chip">Balcão</span>' : ""}<span class="v">${brl(p.total)}</span></div>
      ${px ? `<div class="mini"><button class="btn sm pri" data-act="avancar" data-id="${p.id}" data-st="${px[0]}">${px[1]}</button><span class="small mute">${p.n_itens} item(ns)</span></div>` : ""}</div>`;
  }
  async function avancar(id, st) {
    try { await api("PUT", `pedidos/${id}`, { status: st }); toast(`Pedido em “${ST[st]}”.`); await pedidos(); } catch (e) { falhou(e); }
  }
  const MSG = {
    novo: (p) => `Olá, ${p.nome}! Recebemos seu pedido #${p.codigo}. Já vamos confirmar.`,
    confirmado: (p) => `Olá, ${p.nome}! Seu pedido #${p.codigo} foi confirmado ✅ Total: ${brl(p.total)}.`,
    separacao: (p) => `Olá, ${p.nome}! Estamos separando seu pedido #${p.codigo}.`,
    pronto: (p) => (p.tipo === "entrega" ? `Olá, ${p.nome}! Seu pedido #${p.codigo} saiu para entrega 🛵` : `Olá, ${p.nome}! Seu pedido #${p.codigo} está pronto para retirada.`),
    entregue: (p) => `Olá, ${p.nome}! Pedido #${p.codigo} entregue. Obrigado pela preferência!`,
    cancelado: (p) => `Olá, ${p.nome}. Precisamos cancelar o pedido #${p.codigo}. Podemos conversar?`,
  };
  const dPed = $("#dPed"); let pedAtual = null;
  async function verPedido(id) {
    const p = await api("GET", `pedidos/${id}`); pedAtual = p;
    $("#dpT").textContent = `Pedido #${p.codigo}`; const st = $("#dpSt"); st.className = `chip st-${p.status}`; st.textContent = ST[p.status];
    $("#dpQuando").textContent = `${fmtDH(p.criado_em)} · ${p.origem === "painel" ? "lançado no balcão" : "feito na loja online"}`;
    $("#dpCli").textContent = `${p.contato.nome} · ${fone(p.contato.whatsapp)}`;
    $("#dpEnd").textContent = p.tipo === "entrega" ? `Entregar em: ${p.endereco}` : "Retira na loja";
    const base = { nome: p.contato.nome.split(" ")[0], codigo: p.codigo, total: p.total, tipo: p.tipo };
    $("#dpZap").innerHTML = `<a class="btn sm ok" target="_blank" rel="noopener" href="${esc(zap(p.contato.whatsapp, MSG[p.status](base)))}">WhatsApp: avisar “${ST[p.status]}”</a><a class="btn sm" target="_blank" rel="noopener" href="https://wa.me/${esc(p.contato.whatsapp)}">Abrir conversa</a>`;
    $("#dpItens").innerHTML = p.itens.map((i) => `<tr><td>${esc(qtd(i.quantidade, i.unidade))}</td><td>${esc(i.nome)}</td><td class="n mute">${brl(i.preco_centavos)}/${UN[i.unidade]}</td><td class="n">${brl(i.total_centavos)}</td></tr>`).join("");
    $("#dpTot").innerHTML = `<span>Subtotal</span><span>${brl(p.subtotal)}</span>${p.taxa ? `<span>Entrega</span><span>${brl(p.taxa)}</span>` : ""}<span>Pagamento</span><span>${PAG[p.pagamento]}${p.troco_para ? ` · troco para ${brl(p.troco_para)}` : ""}</span><span class="g">Total</span><span class="g">${brl(p.total)}</span>`;
    $("#dpObs").value = p.observacoes || ""; $("#dpNovo").value = p.status; $("#dpErr").textContent = "";
    dPed.showModal();
  }
  $("#fPed").addEventListener("submit", async (e) => {
    if (e.submitter?.value !== "ok") return; e.preventDefault();
    const novo = $("#dpNovo").value;
    if (novo === "cancelado" && pedAtual.status !== "cancelado" && !confirm(`Cancelar o pedido #${pedAtual.codigo}? O estoque dos itens volta para a loja.`)) return;
    try { await api("PUT", `pedidos/${pedAtual.id}`, { status: novo, observacoes: $("#dpObs").value }); dPed.close(); toast("Pedido atualizado."); await pedidos(); }
    catch (x) { $("#dpErr").textContent = x.message; }
  });

  // pedido de balcão
  const dNovo = $("#dNovo");
  async function novoPedido() {
    if (!S.prods) await carregaProdutos();
    if (!S.clis.length) S.clis = await api("GET", "contatos").catch(() => []);
    $("#dlClientes").innerHTML = S.clis.map((c) => `<option value="${esc(c.nome)}">${esc(fone(c.whatsapp))}</option>`).join("");
    const vendaveis = S.prods.filter((p) => p.ativo && !(p.estoque != null && p.estoque <= 0));
    $("#nProd").innerHTML = vendaveis.map((p) => `<option value="${p.id}">${esc(p.nome)} — ${brl(p.promo_centavos ?? p.preco_centavos)}/${UN[p.unidade]}${p.estoque != null ? ` (estoque ${String(p.estoque).replace(".", ",")})` : ""}</option>`).join("") || '<option value="">Cadastre produtos primeiro</option>';
    S.itens = []; $("#nNome").value = ""; $("#nWhats").value = ""; $("#nEnd").value = ""; $("#nTipo").value = "retirada"; $("#nEndW").hidden = true; $("#nErr").textContent = ""; $("#nQtd").value = "1";
    desenhaItens(); dNovo.showModal(); $("#nNome").focus();
  }
  $("#nNome").addEventListener("change", () => { const c = S.clis.find((x) => x.nome === $("#nNome").value); if (c) { $("#nWhats").value = fone(c.whatsapp); if (c.endereco) $("#nEnd").value = c.endereco; } });
  $("#nTipo").addEventListener("change", () => { $("#nEndW").hidden = $("#nTipo").value !== "entrega"; desenhaItens(); });
  function addItem() {
    const p = S.prods.find((x) => x.id === +$("#nProd").value), q = num($("#nQtd").value);
    if (!p) return;
    if (!(q > 0) || (!["kg", "l"].includes(p.unidade) && !Number.isInteger(q))) { $("#nErr").textContent = `Quantidade inválida para ${p.nome}.`; return; }
    const ja = S.itens.find((i) => i.p.id === p.id); if (ja) ja.q = Math.round((ja.q + q) * 1000) / 1000; else S.itens.push({ p, q });
    $("#nErr").textContent = ""; $("#nQtd").value = "1"; desenhaItens();
  }
  function desenhaItens() {
    const v = (p) => p.promo_centavos ?? p.preco_centavos;
    $("#nItens").innerHTML = S.itens.map((i, k) => `<div class="i"><span>${esc(i.p.nome)}</span><span class="small mute">${esc(qtd(i.q, i.p.unidade))}</span><span class="vt small" style="text-align:right">${brl(Math.round(v(i.p) * i.q))}</span><button type="button" class="btn sm bad" data-act="tiraItem" data-i="${k}" aria-label="Tirar ${esc(i.p.nome)}">✕</button></div>`).join("") || '<p class="mute small">Nenhum item ainda.</p>';
    const sub = S.itens.reduce((s, i) => s + Math.round(v(i.p) * i.q), 0), taxa = $("#nTipo").value === "entrega" ? S.loja.taxa_entrega : 0;
    $("#nTot").innerHTML = S.itens.length ? `<span>Subtotal</span><span>${brl(sub)}</span>${taxa ? `<span>Entrega</span><span>${brl(taxa)}</span>` : ""}<span class="g">Total</span><span class="g">${brl(sub + taxa)}</span>` : "";
  }
  $("#fNovo").addEventListener("submit", async (e) => {
    if (e.submitter?.value !== "ok") return; e.preventDefault();
    if (!S.itens.length) { $("#nErr").textContent = "Adicione ao menos um item."; return; }
    try {
      const r = await api("POST", "pedidos", { nome: $("#nNome").value.trim(), whatsapp: $("#nWhats").value, tipo: $("#nTipo").value, endereco: $("#nEnd").value, pagamento: $("#nPag").value, itens: S.itens.map((i) => ({ produto_id: i.p.id, quantidade: i.q })) });
      dNovo.close(); toast(`Pedido #${r.codigo} lançado.`); S.prods = null; await pedidos();
    } catch (x) { $("#nErr").textContent = x.message; }
  });

  // ---------- produtos ----------
  async function carregaProdutos() { [S.prods, S.cats] = await Promise.all([api("GET", "produtos"), api("GET", "categorias")]); }
  async function produtos() {
    await carregaProdutos();
    const sel = $("#pCat"), at = sel.value;
    sel.innerHTML = '<option value="">Todas as categorias</option>' + S.cats.map((c) => `<option value="${c.id}">${esc(c.nome)}</option>`).join("") + '<option value="sem">Sem categoria</option>';
    sel.value = at; listaProdutos();
  }
  function listaProdutos() {
    const q = $("#pBusca").value.trim().toLowerCase(), c = $("#pCat").value, baixo = $("#pBaixo").checked;
    const l = S.prods.filter((p) => (!q || p.nome.toLowerCase().includes(q)) && (!c || (c === "sem" ? !p.categoria_id : p.categoria_id === +c)) && (!baixo || (p.estoque != null && p.estoque <= 5)));
    $("#prods").innerHTML = l.map((p) => {
      const est = p.estoque == null ? '<span class="mute small">não controla</span>' : p.estoque <= 0 ? '<span class="chip bad">esgotado</span>' : `${String(p.estoque).replace(".", ",")} ${UN[p.unidade]}${p.estoque <= 5 ? ' <span class="chip warn">baixo</span>' : ""}`;
      return `<tr class="${p.ativo ? "" : "off"}"><td>${p.imagem_url ? `<img class="thumb" src="${esc(p.imagem_url)}" alt="" loading="lazy">` : '<span class="thumb v">🛍</span>'}</td>
        <td><b>${esc(p.nome)}</b> ${p.destaque ? '<span class="chip p">destaque</span>' : ""} ${p.ativo ? "" : '<span class="chip">fora da loja</span>'}<div class="small mute">${esc(p.descricao || "")}</div></td>
        <td>${esc(p.categoria || "—")}</td>
        <td class="n">${p.promo_centavos != null ? `<s class="mute small">${brl(p.preco_centavos)}</s> ${brl(p.promo_centavos)}` : brl(p.preco_centavos)}<span class="mute small">/${UN[p.unidade]}</span></td>
        <td class="n">${est}</td><td class="n">${String(Math.round(p.vendidos_30d * 1000) / 1000).replace(".", ",")}</td>
        <td class="n">${admin() ? `<button class="btn sm" data-act="editarProduto" data-id="${p.id}">Editar</button> <button class="btn sm bad" data-act="apagarProduto" data-id="${p.id}" aria-label="Excluir ${esc(p.nome)}">✕</button>` : ""}</td></tr>`;
    }).join("") || `<tr><td colspan="7"><div class="empty">${S.prods.length ? "Nenhum produto com esse filtro." : "Nenhum produto ainda. Clique em “+ Produto” para cadastrar o primeiro."}</div></td></tr>`;
  }
  ["input", "change"].forEach((ev) => { $("#pBusca").addEventListener(ev, listaProdutos); $("#pCat").addEventListener(ev, listaProdutos); $("#pBaixo").addEventListener(ev, listaProdutos); });
  const dProd = $("#dProd"); let prodId = null;
  function editarProduto(id) {
    const p = id ? S.prods.find((x) => x.id === id) : { unidade: "un", ativo: 1, destaque: 0 }; prodId = id || null;
    $("#dprT").textContent = id ? "Editar produto" : "Novo produto";
    $("#prCat").innerHTML = '<option value="">Sem categoria</option>' + S.cats.map((c) => `<option value="${c.id}">${esc(c.nome)}</option>`).join("");
    $("#prNome").value = p.nome || ""; $("#prDesc").value = p.descricao || ""; $("#prCat").value = p.categoria_id || ""; $("#prUn").value = p.unidade;
    $("#prPreco").value = reais(p.preco_centavos); $("#prPromo").value = reais(p.promo_centavos); $("#prEst").value = p.estoque == null ? "" : String(p.estoque).replace(".", ",");
    $("#prOrd").value = p.ordem || ""; $("#prImg").value = p.imagem_url || ""; $("#prDst").checked = !!p.destaque; $("#prAtv").checked = !!p.ativo; $("#prErr").textContent = "";
    dProd.showModal(); $("#prNome").focus();
  }
  $("#fProd").addEventListener("submit", async (e) => {
    if (e.submitter?.value !== "ok") return; e.preventDefault();
    const preco = num($("#prPreco").value), promo = num($("#prPromo").value), est = num($("#prEst").value), er = $("#prErr");
    if (!(preco >= 0) || Number.isNaN(promo) || Number.isNaN(est)) { er.textContent = "Confira preço, promoção e estoque (ex.: 12,90)."; return; }
    const corpo = { nome: $("#prNome").value.trim(), descricao: $("#prDesc").value, categoria_id: $("#prCat").value ? +$("#prCat").value : null, unidade: $("#prUn").value, preco, promo, estoque: est, ordem: +$("#prOrd").value || 0, imagem_url: $("#prImg").value.trim(), destaque: $("#prDst").checked, ativo: $("#prAtv").checked };
    try { await api(prodId ? "PUT" : "POST", prodId ? `produtos/${prodId}` : "produtos", corpo); dProd.close(); toast("Produto salvo."); await produtos(); }
    catch (x) { er.textContent = x.message; }
  });
  async function apagarProduto(id) {
    const p = S.prods.find((x) => x.id === id);
    if (!confirm(`Excluir “${p.nome}”? Se ele já foi vendido, só sai da loja e o histórico fica guardado.`)) return;
    try { const r = await api("DELETE", `produtos/${id}`); toast(r.arquivado ? "Produto tirado da loja (tem vendas no histórico)." : "Produto excluído."); await produtos(); } catch (e) { falhou(e); }
  }
  // categorias
  const dCats = $("#dCats");
  function desenhaCats() {
    $("#cLista").innerHTML = S.cats.map((c) => `<div class="row" style="flex-wrap:nowrap"><input value="${esc(c.nome)}" data-cat="${c.id}" maxlength="60" aria-label="Nome da categoria"><span class="small mute" style="white-space:nowrap">${c.produtos} prod.</span><button type="button" class="btn sm" data-act="salvaCat" data-id="${c.id}">Salvar</button><button type="button" class="btn sm bad" data-act="apagaCat" data-id="${c.id}" aria-label="Apagar ${esc(c.nome)}">✕</button></div>`).join("") || '<p class="mute small">Nenhuma categoria. Ex.: Frutas, Verduras, Bebidas.</p>';
  }
  async function recarregaCats() { S.cats = await api("GET", "categorias"); desenhaCats(); }
  async function acaoCat(fn) { $("#cErr").textContent = ""; try { await fn(); await recarregaCats(); } catch (x) { $("#cErr").textContent = x.message; } }

  // ---------- clientes ----------
  async function clientes() {
    S.clis = await api("GET", "contatos?q=" + encodeURIComponent($("#cBusca").value.trim()));
    $("#clis").innerHTML = S.clis.map((c) => `<tr><td><button class="btn sm ghost" data-act="verCli" data-id="${c.id}" style="padding-left:0"><b>${esc(c.nome)}</b></button></td><td>${esc(fone(c.whatsapp))}</td><td class="n">${c.pedidos}</td><td class="n">${brl(c.gasto)}</td><td class="n">${fmtDH(c.ultimo)}</td></tr>`).join("") || '<tr><td colspan="5"><div class="empty">Nenhum cliente ainda. Eles aparecem aqui no primeiro pedido.</div></td></tr>';
  }
  let tb; $("#cBusca").addEventListener("input", () => { clearTimeout(tb); tb = setTimeout(() => clientes().catch(falhou), 300); });
  const dCli = $("#dCli"); let cliId = null;
  async function verCli(id) {
    const c = await api("GET", `contatos/${id}`); cliId = id;
    $("#dclT").textContent = c.nome; $("#clNome").value = c.nome; $("#clWhats").value = fone(c.whatsapp); $("#clEnd").value = c.endereco || ""; $("#clObs").value = c.observacoes || ""; $("#clErr").textContent = "";
    $("#clZap").innerHTML = `<a class="btn sm ok" target="_blank" rel="noopener" href="https://wa.me/${esc(c.whatsapp)}">Conversar no WhatsApp</a><a class="btn sm" target="_blank" rel="noopener" href="${esc(zap(c.whatsapp, `Olá, ${c.nome.split(" ")[0]}! Tudo bem? Passando para avisar das ofertas da semana na ${S.loja.nome}: ${S.loja.endereco_loja}`))}">Enviar ofertas</a>`;
    $("#clPeds").innerHTML = c.pedidos.map((p) => `<tr><td>#${esc(p.codigo)}</td><td>${fmtDH(p.criado_em)}</td><td><span class="chip st-${p.status}">${ST[p.status]}</span></td><td class="n">${brl(p.total)}</td></tr>`).join("") || '<tr><td class="mute">Sem pedidos.</td></tr>';
    dCli.showModal();
  }
  $("#fCli").addEventListener("submit", async (e) => {
    if (e.submitter?.value !== "ok") return; e.preventDefault();
    try { await api("PUT", `contatos/${cliId}`, { nome: $("#clNome").value.trim(), endereco: $("#clEnd").value, observacoes: $("#clObs").value }); dCli.close(); toast("Cliente salvo."); await clientes(); }
    catch (x) { $("#clErr").textContent = x.message; }
  });

  // ---------- relatórios ----------
  async function relatorio() {
    if (!$("#rDe").value) { $("#rDe").value = hojeBR().slice(0, 8) + "01"; $("#rAte").value = hojeBR(); }
    const r = await api("GET", `relatorio?de=${$("#rDe").value}&ate=${$("#rAte").value}`);
    const val = r.por_status.filter((s) => s.status !== "cancelado"), n = val.reduce((s, x) => s + x.n, 0), v = val.reduce((s, x) => s + x.v, 0), canc = r.por_status.find((s) => s.status === "cancelado");
    $("#rKpis").innerHTML = [["Pedidos", n], ["Faturamento", brl(v)], ["Ticket médio", brl(n ? Math.round(v / n) : 0)], ["Cancelados", canc ? `${canc.n} (${brl(canc.v)})` : "0"]].map(([l, x]) => `<div class="card kpi"><div class="l">${l}</div><div class="v">${esc(x)}</div></div>`).join("");
    const mx = Math.max(1, ...r.por_dia.map((d) => d.v));
    $("#rDias").innerHTML = r.por_dia.length ? r.por_dia.map((d) => `<div class="c" title="${d.dia.slice(8)}/${d.dia.slice(5, 7)}: ${brl(d.v)} em ${d.n} pedido(s)"><i style="height:${Math.max(2, (d.v / mx) * 100)}%"></i><span>${d.dia.slice(8)}</span></div>`).join("") : '<p class="mute small">Sem vendas no período.</p>';
    $("#rProd").innerHTML = r.produtos.map((p, i) => `<tr><td class="mute">${i + 1}</td><td>${esc(p.nome)}</td><td class="n mute">${esc(qtd(Math.round(p.q * 1000) / 1000, p.unidade))}</td><td class="n">${brl(p.v)}</td></tr>`).join("") || '<tr><td class="mute">Sem vendas no período.</td></tr>';
    $("#rCli").innerHTML = r.clientes.map((c, i) => `<tr><td class="mute">${i + 1}</td><td>${esc(c.nome)}</td><td class="n mute">${c.n} pedido(s)</td><td class="n">${brl(c.v)}</td></tr>`).join("") || '<tr><td class="mute">Sem vendas no período.</td></tr>';
  }
  async function csv() {
    try {
      const ps = await api("GET", `pedidos?de=${$("#rDe").value}&ate=${$("#rAte").value}`);
      const cel = (x) => `"${String(x ?? "").replace(/"/g, '""')}"`;
      const linhas = [["Pedido", "Data", "Cliente", "WhatsApp", "Situação", "Tipo", "Pagamento", "Subtotal", "Entrega", "Total", "Origem"].map(cel).join(";"),
        ...ps.map((p) => [p.codigo, fmtDH(p.criado_em), p.cliente, fone(p.whatsapp), ST[p.status], p.tipo, PAG[p.pagamento], reais(p.subtotal), reais(p.taxa), reais(p.total), p.origem === "painel" ? "Balcão" : "Loja online"].map(cel).join(";"))];
      const a = document.createElement("a"); a.href = URL.createObjectURL(new Blob(["﻿" + linhas.join("\r\n")], { type: "text/csv;charset=utf-8" }));
      a.download = `pedidos_${$("#rDe").value}_a_${$("#rAte").value}.csv`; a.click(); setTimeout(() => URL.revokeObjectURL(a.href), 2000);
    } catch (e) { falhou(e); }
  }

  // ---------- ações ----------
  document.addEventListener("click", (e) => {
    const b = e.target.closest("[data-act]"); if (!b) return;
    const id = +b.dataset.id, a = b.dataset.act;
    if (a === "avancar") { e.stopPropagation(); avancar(id, b.dataset.st); return; }
    const acoes = {
      atualizar: () => pedidos().then(() => toast("Atualizado.")),
      novoPedido, addItem: async () => addItem(), tiraItem: async () => { S.itens.splice(+b.dataset.i, 1); desenhaItens(); },
      ver: () => verPedido(id), verCli: () => verCli(id),
      novoProduto: async () => editarProduto(null), editarProduto: async () => editarProduto(id), apagarProduto: () => apagarProduto(id),
      categorias: async () => { desenhaCats(); $("#cErr").textContent = ""; dCats.showModal(); },
      addCat: () => acaoCat(async () => { const n = $("#cNova").value.trim(); if (!n) throw new Error("Digite o nome."); await api("POST", "categorias", { nome: n }); $("#cNova").value = ""; }),
      salvaCat: () => acaoCat(async () => { const c = S.cats.find((x) => x.id === id); await api("PUT", `categorias/${id}`, { nome: $(`[data-cat="${id}"]`).value.trim(), ordem: c.ordem }); toast("Categoria salva."); }),
      apagaCat: () => acaoCat(async () => { if (!confirm("Apagar a categoria? Os produtos dela ficam sem categoria.")) return; await api("DELETE", `categorias/${id}`); }),
      relatorio, csv,
      copiar: async () => { try { await navigator.clipboard.writeText(S.loja.endereco_loja); toast("Endereço copiado."); } catch { toast(S.loja.endereco_loja); } },
    };
    if (acoes[a]) acoes[a]().catch(falhou);
  });
  $("#kb").addEventListener("keydown", (e) => { if ((e.key === "Enter" || e.key === " ") && e.target.matches(".pc")) { e.preventDefault(); verPedido(+e.target.dataset.id).catch(falhou); } });
  dCats.addEventListener("close", () => { if (abaAtual() === "produtos") produtos().catch(falhou); });
  $("#cNova").addEventListener("keydown", (e) => { if (e.key === "Enter") { e.preventDefault(); $('[data-act="addCat"]').click(); } });
  $("#nQtd").addEventListener("keydown", (e) => { if (e.key === "Enter") { e.preventDefault(); addItem(); } });

  setInterval(() => { if (!document.hidden && abaAtual() === "pedidos" && !$("dialog[open]")) pedidos(true).catch(() => {}); }, 30000);

  carregaLoja().then(() => aba(location.hash.slice(1) || "pedidos")).catch((e) => { $("#nomeTopo").textContent = "Erro ao carregar"; falhou(e); });
})();
