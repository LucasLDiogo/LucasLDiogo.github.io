// SalesWorks v2 — painel da loja (salesworks.lldworks.com.br/app). Sem dependências além do GSAP (animações opcionais).
// Fala só com /api/admin/* (o roteador confere o login e manda quem é o cliente para o Worker).
(() => {
"use strict";
const $ = (s, r = document) => r.querySelector(s), $$ = (s, r = document) => [...r.querySelectorAll(s)];
const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const brl = (c) => ((c || 0) / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
const reais = (c) => (c == null || c === "" ? "" : (c / 100).toFixed(2).replace(".", ","));
const cent = (v) => { v = String(v ?? "").trim().replace(/R\$\s?/, ""); if (!v) return null; if (v.includes(",")) v = v.replace(/\./g, "").replace(",", "."); const n = Math.round(parseFloat(v) * 100); return Number.isFinite(n) ? n : null; };
const numBR = (v) => { const n = parseFloat(String(v ?? "").replace(",", ".")); return Number.isFinite(n) ? n : null; };
const qtd = (q, u) => `${String(+(+q).toFixed(3)).replace(".", ",")} ${u}`;
const data = (iso) => (iso ? new Date(iso).toLocaleDateString("pt-BR", { timeZone: "America/Sao_Paulo" }) : "—");
const hora = (iso) => (iso ? new Date(iso).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit", timeZone: "America/Sao_Paulo" }) : "");
const dataHora = (iso) => (iso ? `${data(iso)} ${hora(iso)}` : "—");
const ha = (iso) => { const m = Math.round((Date.now() - Date.parse(iso)) / 60000); return m < 1 ? "agora" : m < 60 ? `há ${m} min` : m < 1440 ? `há ${Math.round(m / 60)} h` : `há ${Math.round(m / 1440)} d`; };
const hoje = () => new Intl.DateTimeFormat("en-CA", { timeZone: "America/Sao_Paulo" }).format(new Date());
const zapLink = (n, msg) => `https://wa.me/${String(n || "").replace(/\D/g, "")}?text=${encodeURIComponent(msg)}`;
const calmo = matchMedia("(prefers-reduced-motion: reduce)").matches;
const I = {
  inicio: '<path d="M3 11l9-7 9 7v9a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z"/>',
  pedidos: '<path d="M6 3h12l2 4v13a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7z"/><path d="M4 7h16M9 11h6"/>',
  separacao: '<path d="M9 11l3 3 8-8"/><path d="M20 12v7a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h9"/>',
  produtos: '<path d="M21 8l-9-5-9 5 9 5 9-5zM3 8v8l9 5 9-5V8M12 13v8"/>',
  estoque: '<path d="M3 21V8l9-5 9 5v13"/><path d="M7 21v-8h10v8M7 17h10"/>',
  clientes: '<circle cx="9" cy="8" r="3.5"/><path d="M2.5 20c.8-3.6 3.4-5.5 6.5-5.5s5.7 1.9 6.5 5.5M17 11a3 3 0 1 0 0-6M21.5 19c-.5-2.6-2-4.2-4-4.7"/>',
  cupons: '<path d="M3 9a2 2 0 0 0 0 6v3a1 1 0 0 0 1 1h16a1 1 0 0 0 1-1v-3a2 2 0 0 0 0-6V6a1 1 0 0 0-1-1H4a1 1 0 0 0-1 1z"/><path d="M9 9h.01M15 15h.01M15 9l-6 6"/>',
  financeiro: '<path d="M4 20V10M10 20V4M16 20v-7M22 20H2"/>',
  precificacao: '<rect x="4" y="2" width="16" height="20" rx="2"/><path d="M8 6h8M8 10h2M12 10h2M16 10h0M8 14h2M12 14h2M8 18h2M12 18h4"/>',
  entregadores: '<circle cx="6" cy="17" r="3"/><circle cx="18" cy="17" r="3"/><path d="M9 17h6l-2-7H9M13 10h3l2 7M5 10h4"/>',
  loja: '<path d="M3 9l1.5-5h15L21 9M3 9v11h18V9M3 9h18M9 20v-6h6v6"/>',
  integracoes: '<path d="M9 7H6a3 3 0 0 0 0 6h3M15 7h3a3 3 0 0 1 0 6h-3M8 10h8"/><path d="M12 14v6M9 20h6"/>',
  plano: '<path d="M12 2l3 6 7 1-5 5 1 7-6-3-6 3 1-7-5-5 7-1z"/>',
  ajuda: '<circle cx="12" cy="12" r="9"/><path d="M9.5 9a2.5 2.5 0 1 1 3.5 2.3c-.6.3-1 .9-1 1.6V14M12 17h.01"/>',
  zap: '<path d="M3 21l1.6-4.8A8.5 8.5 0 1 1 8 19.6z"/><path d="M9 9c.5 2.5 2.5 4.5 5 5l1-1.5 2.5 1-.5 2c-4 .5-9-4.5-8.5-8.5l2-.5 1 2.5z"/>',
  mais: '<path d="M12 5v14M5 12h14"/>', copiar: '<rect x="9" y="9" width="12" height="12" rx="2"/><path d="M5 15V5a2 2 0 0 1 2-2h10"/>',
  externo: '<path d="M14 3h7v7M10 14 21 3M19 14v5a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2h5"/>', imprimir: '<path d="M6 9V3h12v6M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><path d="M6 14h12v7H6z"/>',
};
const ic = (n, cls = "") => `<svg viewBox="0 0 24 24" class="${cls}" aria-hidden="true">${I[n] || ""}</svg>`;
const MENU = [
  ["Operação", [["inicio", "Início"], ["pedidos", "Pedidos"], ["separacao", "Separação"], ["entregadores", "Entregadores"]]],
  ["Catálogo", [["produtos", "Produtos"], ["estoque", "Estoque"], ["precificacao", "Precificação"]]],
  ["Vender mais", [["clientes", "Clientes (CRM)"], ["cupons", "Cupons e promoções"], ["financeiro", "Financeiro"]]],
  ["Sua loja", [["loja", "Minha loja"], ["integracoes", "Integrações"], ["plano", "Plano e conta"], ["ajuda", "Ajuda"]]],
];
const TITULOS = Object.fromEntries(MENU.flatMap((g) => g[1]));
const ST = { novo: "Novo", confirmado: "Confirmado", separacao: "Separando", pronto: "Pronto", saiu: "Saiu p/ entrega", entregue: "Entregue", cancelado: "Cancelado" };
const PAG = { pix: "Pix", dinheiro: "Dinheiro", cartao: "Cartão na entrega", online: "Online (Mercado Pago)" };
const UN = { un: "unidade", kg: "kg", g: "grama", l: "litro", ml: "ml", pct: "pacote", cx: "caixa", dz: "dúzia", m: "metro", par: "par" };
const SEG = { mercado: "Mercado / mercearia", hortifruti: "Hortifruti", padaria: "Padaria e confeitaria", acougue: "Açougue", bebidas: "Bebidas", moda: "Moda e acessórios", cosmeticos: "Cosméticos", petshop: "Pet shop (produtos)", farmacia: "Farmácia e saúde", presentes: "Presentes e decoração", eletronicos: "Eletrônicos", outro: "Outro" };
const S = { loja: null, plano: null, demo: false, ultimoNovo: null, cache: {} };

// ---------- API ----------
async function api(m, p, b) {
  const blob = b instanceof Blob;
  const r = await fetch("/api/admin/" + p, { method: m, credentials: "same-origin", headers: blob ? { "content-type": b.type } : b === undefined ? {} : { "content-type": "application/json" }, body: b === undefined ? undefined : blob ? b : JSON.stringify(b) });
  if (r.status === 401) { location.href = "/entrar"; throw new Error("Sessão expirada. Entre de novo."); }
  const t = await r.text(); let j = {}; try { j = JSON.parse(t); } catch {}
  if (!r.ok) { const e = new Error(j.erro || `Não deu certo (erro ${r.status}).`); e.status = r.status; throw e; }
  return j;
}
function toast(msg, tipo = "") { const t = document.createElement("div"); t.className = "toast " + tipo; t.innerHTML = esc(msg); $("#toasts").append(t); setTimeout(() => t.remove(), tipo === "err" ? 6500 : 3800); }
const erro = (e) => toast(e.message || String(e), "err");
async function tenta(fn, ok) { try { const r = await fn(); if (ok) toast(ok, "ok"); return r; } catch (e) { erro(e); return null; } }
function copiar(txt, msg = "Copiado!") { (navigator.clipboard ? navigator.clipboard.writeText(txt) : Promise.reject()).then(() => toast(msg, "ok"), () => prompt("Copie:", txt)); }

// ---------- gaveta (painel lateral) ----------
let aoFechar = null;
function abrir(titulo, html, fechar) {
  $("#gavetaTitulo").textContent = titulo; $("#gavetaCorpo").innerHTML = html; $("#gaveta").hidden = false; aoFechar = fechar || null;
  document.body.style.overflow = "hidden"; setTimeout(() => ($("#gavetaCorpo input:not([type=hidden]),#gavetaCorpo select,#gavetaCorpo button") || $(".x")).focus(), 60);
  return $("#gavetaCorpo");
}
function fechar() { $("#gaveta").hidden = true; document.body.style.overflow = ""; if (aoFechar) { const f = aoFechar; aoFechar = null; f(); } }
document.addEventListener("click", (e) => { if (e.target.closest("[data-fechar]")) fechar(); if (e.target.closest("[data-fechar-menu]")) document.body.classList.remove("menu-aberto"); });
document.addEventListener("keydown", (e) => { if (e.key === "Escape" && !$("#gaveta").hidden) fechar(); });

// ---------- imagem: reduz no navegador e envia em WEBP ----------
function reduzir(arquivo, max = 1000, q = 0.82) {
  return new Promise((res, rej) => {
    if (!/^image\//.test(arquivo.type)) return rej(new Error("Escolha uma imagem (JPG, PNG ou WEBP)."));
    const img = new Image(), url = URL.createObjectURL(arquivo);
    img.onload = () => {
      const k = Math.min(1, max / Math.max(img.width, img.height)), c = document.createElement("canvas");
      c.width = Math.round(img.width * k); c.height = Math.round(img.height * k);
      c.getContext("2d").drawImage(img, 0, 0, c.width, c.height); URL.revokeObjectURL(url);
      c.toBlob((b) => (b ? res(b) : rej(new Error("Não consegui ler a imagem."))), "image/webp", q);
    };
    img.onerror = () => rej(new Error("Não consegui abrir essa imagem."));
    img.src = url;
  });
}
async function enviarFoto(arquivo, max) { const b = await reduzir(arquivo, max); return api("POST", "midia", b); }
function campoFoto(el, idInput, max = 1000) {
  const inp = document.createElement("input"); inp.type = "file"; inp.accept = "image/*"; inp.hidden = true; el.after(inp);
  el.addEventListener("click", () => inp.click());
  el.addEventListener("keydown", (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); inp.click(); } });
  inp.addEventListener("change", async () => {
    const f = inp.files[0]; if (!f) return;
    el.style.opacity = ".5";
    const r = await tenta(() => enviarFoto(f, max));
    el.style.opacity = "";
    if (r) { idInput.value = r.id; el.style.backgroundImage = `url("${r.url}")`; el.classList.add("tem"); }
  });
}

// ---------- estrutura ----------
function montarMenu(n = 0) {
  $("#menu").innerHTML = MENU.map(([g, itens]) => `<h3>${g}</h3>` + itens.map(([k, t]) => `<a href="#/${k}" data-r="${k}">${ic(k)}<span>${t}</span>${k === "pedidos" && n ? `<span class="n">${n}</span>` : ""}</a>`).join("")).join("");
  marcarMenu();
}
function marcarMenu() { const r = rota().pag; $$("[data-r]").forEach((a) => a.classList.toggle("ativo", a.dataset.r === r)); }
function rota() { const [pag, ...resto] = location.hash.replace(/^#\/?/, "").split("/"); return { pag: pag || "inicio", arg: resto.join("/") }; }
function atualizaLoja(l) {
  S.loja = l; $("#lcNome").textContent = l.nome;
  $("#lcLogo").innerHTML = l.logo ? `<img src="${esc(l.logo)}" alt="">` : esc((l.nome || "S")[0].toUpperCase());
  const pub = l.publicada || l.demo; $("#lcLink").href = pub ? l.link : l.link_previa; $("#lcLink").textContent = pub ? "Abrir minha loja ↗" : "Pré-visualizar a loja ↗";
}
$("#abrirMenu").onclick = () => document.body.classList.add("menu-aberto");
$("#maisBaixo").onclick = () => document.body.classList.add("menu-aberto");
$("#btNovoPedido").onclick = () => novoPedido();
addEventListener("hashchange", () => { document.body.classList.remove("menu-aberto"); render(); });

const PAGINAS = {};
async function render() {
  const { pag, arg } = rota(), f = PAGINAS[pag] || PAGINAS.inicio;
  $("#titulo").textContent = TITULOS[pag] || "Início"; document.title = `${TITULOS[pag] || "Início"} · SalesWorks`;
  marcarMenu();
  const main = $("#conteudo"); main.innerHTML = '<div class="carregando">Carregando…</div>';
  try { await f(main, arg); } catch (e) { main.innerHTML = `<div class="cartao vazio"><b>Não consegui carregar esta tela.</b>${esc(e.message)}<p><a class="b" href="">Tentar de novo</a></p></div>`; }
  if (window.gsap && !calmo) gsap.from(main.children, { y: 14, opacity: 0, duration: 0.45, stagger: 0.04, ease: "power2.out", clearProps: "all" });
  main.focus({ preventScroll: true });
}

// ---------- pedidos novos: aviso com som e notificação ----------
function bip() { try { const a = new (window.AudioContext || window.webkitAudioContext)(), o = a.createOscillator(), g = a.createGain(); o.connect(g); g.connect(a.destination); o.frequency.value = 880; g.gain.setValueAtTime(0.0001, a.currentTime); g.gain.exponentialRampToValueAtTime(0.25, a.currentTime + 0.02); g.gain.exponentialRampToValueAtTime(0.0001, a.currentTime + 0.5); o.start(); o.stop(a.currentTime + 0.5); setTimeout(() => { const o2 = a.createOscillator(); o2.connect(g); o2.frequency.value = 1175; g.gain.setValueAtTime(0.25, a.currentTime); g.gain.exponentialRampToValueAtTime(0.0001, a.currentTime + 0.5); o2.start(); o2.stop(a.currentTime + 0.5); }, 220); } catch {} }
async function vigia() {
  try {
    const r = await api("GET", "pedidos?status=novo&limite=1");
    const n = r.novos || 0; $("#sinoN").hidden = !n; $("#sinoN").textContent = n; montarMenu(n);
    document.title = (n ? `(${n}) ` : "") + document.title.replace(/^\(\d+\) /, "");
    if (S.ultimoNovo !== null && r.ultimo_novo > S.ultimoNovo) {
      bip(); $("#sino").classList.add("toca"); setTimeout(() => $("#sino").classList.remove("toca"), 2200);
      toast("Pedido novo chegou! Abra em Pedidos.", "ok");
      if ("Notification" in window && Notification.permission === "granted") new Notification("Pedido novo · SalesWorks", { body: "Um cliente acabou de fazer um pedido na sua loja.", icon: "/pub/icone.svg" });
      if (rota().pag === "pedidos" || rota().pag === "inicio") render();
    }
    S.ultimoNovo = r.ultimo_novo || 0;
  } catch {}
}

// ---------- Início ----------
function grafico(serie) {
  const W = 700, H = 200, P = 26, max = Math.max(1, ...serie.map((d) => d.vendas)), maxV = Math.max(1, ...serie.map((d) => d.visitas));
  const bw = (W - P * 2) / serie.length;
  const barras = serie.map((d, i) => { const h = ((H - 50) * d.vendas) / max; return `<rect class="bar" x="${P + i * bw + 4}" y="${H - 28 - h}" width="${bw - 8}" height="${Math.max(2, h)}" rx="6"><title>${data(d.dia + "T15:00:00Z")}: ${brl(d.vendas)} em ${d.pedidos} pedido(s)</title></rect>`; }).join("");
  const pts = serie.map((d, i) => `${P + i * bw + bw / 2},${H - 28 - ((H - 50) * d.visitas) / maxV}`).join(" ");
  const rot = serie.map((d, i) => (i % 2 === 0 ? `<text x="${P + i * bw + bw / 2}" y="${H - 8}" text-anchor="middle">${d.dia.slice(8)}/${d.dia.slice(5, 7)}</text>` : "")).join("");
  return `<svg class="graf" viewBox="0 0 ${W} ${H}" role="img" aria-label="Vendas dos últimos 14 dias"><defs><linearGradient id="gb" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#F97316"/><stop offset="1" stop-color="#EA580C" stop-opacity=".55"/></linearGradient></defs>${barras}${serie.some((d) => d.visitas) ? `<polyline class="lin" points="${pts}"/>` : ""}${rot}</svg>`;
}
const ACAO_GUIA = { marca: "#/loja/marca", contato: "#/loja/contato", entrega: "#/loja/entrega", produtos: "#/produtos", publicar: "#/loja/endereco" };
PAGINAS.inicio = async (main) => {
  const r = await api("GET", "resumo"); atualizaLoja(r.loja); S.plano = r.plano; $("#planoMini").textContent = r.plano.nome ? `Plano ${r.plano.nome}` : "Plano";
  const l = r.loja, pub = l.publicada || l.demo, ab = r.abertos || {};
  const abertos = ["novo", "confirmado", "separacao", "pronto", "saiu"].map((s) => `<a class="chip st-${s}" href="#/pedidos">${ST[s]} · ${ab[s] || 0}</a>`).join(" ");
  main.innerHTML = `
  ${r.guia_pct < 100 ? `<section class="guia"><div class="anel"><svg viewBox="0 0 100 100"><circle class="t" cx="50" cy="50" r="42"/><circle class="a" cx="50" cy="50" r="42" style="stroke-dashoffset:${264 - (264 * r.guia_pct) / 100}"/></svg><b>${r.guia_pct}%</b></div>
   <div><h3>Deixe a sua loja pronta para vender</h3><p class="peq" style="margin:0 0 12px;color:#D9C6B8">Siga os passos. Ao publicar, a loja ganha o endereço <b>nome-da-loja.lldworks.com.br</b>.</p>
   <div class="passos-g">${r.guia.map((g) => `<a class="${g.ok ? "ok" : ""}" href="${ACAO_GUIA[g.k]}">${esc(g.t)}</a>`).join("")}</div></div></section>` : ""}
  <div class="cartao" style="margin-bottom:16px"><div class="linha">
   <span class="chip ${l.estado.aberta ? "ok" : "err"}">${l.estado.aberta ? "Aberta agora" : "Fechada agora"}</span>
   ${pub ? `<span class="chip p">Loja publicada</span><a class="forte" href="${esc(l.link)}" target="_blank" rel="noopener">${esc(l.link.replace("https://", ""))}</a>` : `<span class="chip warn">Ainda não publicada</span><a href="#/loja/endereco" class="forte">Escolher o endereço e publicar →</a>`}
   <span class="dir linha"><button class="b peq" data-copiar="${esc(pub ? l.link : l.link_previa)}">${ic("copiar")}Copiar link</button>${pub && l.whatsapp ? `<a class="b peq zap" target="_blank" rel="noopener" href="${esc(zapLink("", `Conheça a nossa loja online e faça o seu pedido: ${l.link}`))}">${ic("zap")}Divulgar</a>` : ""}</span></div></div>
  <div class="kpis">
   <div class="kpi dest"><span>Vendas hoje</span><b>${brl(r.hoje.vendas)}</b><small>${r.hoje.pedidos} pedido(s)</small></div>
   <div class="kpi"><span>Vendas em 30 dias</span><b>${brl(r.mes.vendas)}</b><small>${r.mes.pedidos} pedidos</small></div>
   <div class="kpi"><span>Ticket médio</span><b>${brl(r.mes.ticket)}</b><small>últimos 30 dias</small></div>
   <div class="kpi"><span>Lucro bruto estimado</span><b>${brl(r.mes.lucro_estimado)}</b><small>venda − custo dos produtos</small></div>
   <div class="kpi"><span>Conversão da loja</span><b>${r.conversao == null ? "—" : String(r.conversao).replace(".", ",") + "%"}</b><small>pedidos ÷ visitas (14 dias)</small></div>
  </div>
  <div class="col2">
   <div class="pilha">
    <section class="cartao"><h3>Vendas dos últimos 14 dias <span class="dir peq mute">barras: vendas · tracejado: visitas na loja</span></h3>${grafico(r.serie)}</section>
    <section class="cartao"><h3>Pedidos em andamento <a class="dir b peq" href="#/pedidos">Abrir quadro</a></h3><div class="linha">${abertos}</div>
     <div class="lista-ped" style="margin-top:12px">${r.ultimos.length ? r.ultimos.map(cartaoPedido).join("") : `<div class="vazio"><b>Nenhum pedido ainda.</b>Publique a loja e divulgue o link no WhatsApp e no Instagram.</div>`}</div></section>
   </div>
   <div class="pilha">
    <section class="cartao"><h3>Para fazer agora</h3>
     ${ab.novo ? `<p><a class="b pri" href="#/pedidos">${ab.novo} pedido(s) novo(s) esperando confirmação</a></p>` : ""}
     ${r.estoque_baixo.length ? `<p class="forte" style="margin:6px 0">Estoque baixo</p>${r.estoque_baixo.map((p) => `<div class="linha" style="padding:6px 0;border-bottom:1px solid var(--line)"><span>${esc(p.nome)}</span><span class="dir chip warn">${qtd(p.estoque, p.unidade)}</span></div>`).join("")}<p><a href="#/estoque">Repor estoque →</a></p>` : ""}
     ${r.sumidos.length ? `<p class="forte" style="margin:10px 0 6px">Clientes para trazer de volta</p>${r.sumidos.map((c) => `<div class="linha" style="padding:6px 0;border-bottom:1px solid var(--line)"><span>${esc(c.nome)}<br><small class="mute">${brl(c.gasto)} em ${c.pedidos} pedido(s) · último ${data(c.ultimo_pedido)}</small></span><a class="dir b peq zap" target="_blank" rel="noopener" href="${esc(zapLink(c.whatsapp, `Oi, ${c.nome.split(" ")[0]}! Sentimos sua falta na ${l.nome}. Veja as novidades e faça seu pedido: ${l.link}`))}">${ic("zap")}Chamar</a></div>`).join("")}` : ""}
     ${!ab.novo && !r.estoque_baixo.length && !r.sumidos.length ? `<div class="vazio"><b>Tudo em dia.</b>Sem pedidos esperando, sem estoque baixo e sem clientes sumidos.</div>` : ""}
    </section>
    <section class="cartao"><h3>Mais vendidos (30 dias)</h3>${r.top.length ? r.top.map((t, i) => `<div class="linha" style="padding:7px 0;border-bottom:1px solid var(--line)"><b>${i + 1}.</b><span>${esc(t.nome)}<br><small class="mute">${qtd(t.q, t.unidade)}</small></span><b class="dir">${brl(t.t)}</b></div>`).join("") : '<p class="mute">Os mais vendidos aparecem aqui depois dos primeiros pedidos.</p>'}</section>
    <section class="cartao"><h3>Seu plano</h3><p style="margin:0"><b>${esc(r.plano.nome || "—")}</b> · ${r.produtos} de ${r.plano.limites.produtos || 300} produtos ativos${r.sem_foto ? ` · <span class="chip warn">${r.sem_foto} sem foto</span>` : ""}</p><p style="margin:10px 0 0"><a href="#/integracoes">Ver integrações do plano →</a></p></section>
   </div>
  </div>`;
  if ("Notification" in window && Notification.permission === "default" && !S.demo) {
    const c = document.createElement("div"); c.className = "cartao linha"; c.style.marginTop = "16px";
    c.innerHTML = `<span>Quer um aviso na tela quando chegar pedido novo, mesmo com o painel em outra aba?</span><button class="b dir">Ativar avisos</button>`;
    c.querySelector("button").onclick = () => Notification.requestPermission().then(() => c.remove());
    main.append(c);
  }
};
document.addEventListener("click", (e) => { const b = e.target.closest("[data-copiar]"); if (b) copiar(b.dataset.copiar, "Link copiado!"); });

// ---------- Pedidos ----------
const PROX = { novo: "confirmado", confirmado: "separacao", separacao: "pronto", saiu: "entregue" };
const ROT_PROX = { novo: "Confirmar", confirmado: "Separar", separacao: "Marcar pronto", saiu: "Marcar entregue" };
const prox = (p) => (p.status === "pronto" ? (p.tipo === "entrega" ? "saiu" : "entregue") : PROX[p.status]);
const rotProx = (p) => (p.status === "pronto" ? (p.tipo === "entrega" ? "Saiu para entrega" : "Retirado (entregue)") : ROT_PROX[p.status]);
function cartaoPedido(p, comAcao) {
  const pr = prox(p);
  return `<div class="pc ${p.status === "novo" ? "novo" : ""}" role="button" tabindex="0" data-ped="${p.id}">
   <div class="t1"><b>#${p.numero}</b><span class="chip st-${p.status}">${ST[p.status]}</span><span class="tot">${brl(p.total)}</span></div>
   <div class="nm">${esc(p.nome)}</div>
   <div class="meta"><span class="chip">${p.tipo === "entrega" ? "🛵 Entrega" : "🏪 Retirada"}</span><span class="chip ${p.pago ? "ok" : ""}">${p.pago ? "Pago ✓" : PAG[p.pagamento]}</span>${p.agendado_para ? `<span class="chip p">📅 ${esc(p.agendado_para.slice(8, 10) + "/" + p.agendado_para.slice(5, 7) + " " + p.agendado_para.slice(11))}</span>` : ""}<span class="chip">${p.itens_n} ite${p.itens_n === 1 ? "m" : "ns"}</span><span class="chip">${ha(p.criado_em)}</span>${p.entregador ? `<span class="chip">${esc(p.entregador)}</span>` : ""}</div>
   ${comAcao && pr ? `<button class="b peq ${p.status === "novo" ? "pri" : ""} acao" data-avancar="${p.id}" data-para="${pr}">${rotProx(p)} →</button>` : ""}</div>`;
}
document.addEventListener("click", (e) => {
  const av = e.target.closest("[data-avancar]");
  if (av) { e.stopPropagation(); mudarStatus(+av.dataset.avancar, av.dataset.para); return; }
  const c = e.target.closest("[data-ped]"); if (c && !e.target.closest("a,button")) detalhePedido(+c.dataset.ped);
});
document.addEventListener("keydown", (e) => { const c = e.target.closest && e.target.closest("[data-ped]"); if (c && e.key === "Enter") detalhePedido(+c.dataset.ped); });
async function mudarStatus(id, st, extra = {}) {
  const r = await tenta(() => api("PUT", `pedidos/${id}/status`, { status: st, ...extra }), `Pedido atualizado: ${ST[st]}`);
  if (r) { vigia(); if (!$("#gaveta").hidden) detalhePedido(id); if (["pedidos", "inicio", "separacao"].includes(rota().pag)) render(); }
}
PAGINAS.pedidos = async (main, arg) => {
  const modo = arg === "lista" ? "lista" : "quadro";
  main.innerHTML = `<div class="ferr"><div class="abas" style="margin:0;border:0;padding:0"><a href="#/pedidos" class="${modo === "quadro" ? "ativo" : ""}">Quadro do dia</a><a href="#/pedidos/lista" class="${modo === "lista" ? "ativo" : ""}">Todos os pedidos</a></div>
   ${modo === "lista" ? `<input type="search" id="pBusca" placeholder="Nº do pedido, nome ou WhatsApp"><select id="pSt"><option value="">Todos os status</option>${Object.entries(ST).map(([k, v]) => `<option value="${k}">${v}</option>`).join("")}</select><input type="date" id="pDe" aria-label="De"><input type="date" id="pAte" aria-label="Até">` : ""}
   <span class="dir"></span><button class="b" id="pAtual">Atualizar</button></div><div id="pCorpo"></div>`;
  const corpo = $("#pCorpo");
  async function carrega() {
    if (modo === "quadro") {
      const r = await api("GET", "pedidos?status=ativos");
      const cols = [["Novos", ["novo"], "#EA580C"], ["Confirmados", ["confirmado"], "#2563EB"], ["Separando", ["separacao"], "#7C3AED"], ["Prontos e em rota", ["pronto", "saiu"], "#0D9488"], ["Concluídos hoje", ["entregue", "cancelado"], "#0F9F6E"]];
      corpo.innerHTML = `<div class="kb">${cols.map(([t, sts, cor]) => { const ps = r.pedidos.filter((p) => sts.includes(p.status)).sort((a, b) => (a.agendado_para || a.criado_em).localeCompare(b.agendado_para || b.criado_em)); return `<section class="col"><h2><i style="background:${cor}"></i>${t}<span class="chip">${ps.length}</span></h2>${ps.map((p) => cartaoPedido(p, true)).join("") || '<p class="mute peq" style="padding:0 6px">Nada aqui.</p>'}</section>`; }).join("")}</div>`;
    } else {
      const q = new URLSearchParams({ status: $("#pSt").value || "todos", q: $("#pBusca").value, de: $("#pDe").value, ate: $("#pAte").value, limite: 500 });
      const r = await api("GET", "pedidos?" + q);
      const tot = r.pedidos.filter((p) => p.status !== "cancelado").reduce((s, p) => s + p.total, 0);
      corpo.innerHTML = `<p class="mute">${r.pedidos.length} pedido(s) · ${brl(tot)} sem os cancelados</p><div class="tab-wrap"><table><thead><tr><th>Nº</th><th>Data</th><th>Cliente</th><th>Tipo</th><th>Pagamento</th><th>Status</th><th class="num">Total</th></tr></thead><tbody>${r.pedidos.map((p) => `<tr class="clica" data-ped="${p.id}"><td><b>#${p.numero}</b></td><td>${dataHora(p.criado_em)}</td><td>${esc(p.nome)}</td><td>${p.tipo === "entrega" ? "Entrega" : "Retirada"}</td><td>${PAG[p.pagamento]} ${p.pago ? "✓" : ""}</td><td><span class="chip st-${p.status}">${ST[p.status]}</span></td><td class="num"><b>${brl(p.total)}</b></td></tr>`).join("") || '<tr><td colspan="7" class="vazio">Nenhum pedido encontrado.</td></tr>'}</tbody></table></div>`;
    }
  }
  $("#pAtual").onclick = carrega;
  if (modo === "lista") { let t; $$("#pBusca,#pSt,#pDe,#pAte").forEach((el) => el.addEventListener("input", () => { clearTimeout(t); t = setTimeout(carrega, 300); })); }
  await carrega();
};
function msgsPedido(p, l) {
  const n = p.nome.split(" ")[0], link = p.acompanhar;
  const m = {
    confirmado: `Olá, ${n}! Seu pedido #${p.numero} na ${l.nome} foi confirmado ✅ Total: ${brl(p.total)}. Acompanhe aqui: ${link}`,
    separacao: `Oi, ${n}! Já estamos separando o seu pedido #${p.numero} 🧺 Acompanhe: ${link}`,
    pronto: p.tipo === "retirada" ? `Oi, ${n}! Seu pedido #${p.numero} está pronto para retirada${l.endereco ? " em " + l.endereco : ""}. Até já!` : `Oi, ${n}! Seu pedido #${p.numero} está pronto e vai sair para entrega em instantes.`,
    saiu: `Oi, ${n}! Seu pedido #${p.numero} saiu para entrega 🛵 Acompanhe: ${link}`,
    entregue: `Oi, ${n}! Pedido #${p.numero} entregue. Obrigado pela compra na ${l.nome} 💛 Volte sempre: ${l.link}`,
  };
  if (p.pagamento === "pix" && !p.pago && l.pix_chave) m.pix = `Oi, ${n}! Para pagar o pedido #${p.numero} (${brl(p.total)}) por Pix, use a chave: ${l.pix_chave}${l.pix_nome ? " (" + l.pix_nome + ")" : ""}. Depois é só mandar o comprovante aqui.`;
  return m;
}
async function detalhePedido(id) {
  const [r, ents] = await Promise.all([api("GET", `pedidos/${id}`), S.cache.ent || api("GET", "entregadores").then((x) => (S.cache.ent = x))]);
  const p = r.pedido, l = S.loja || (await api("GET", "loja")).loja, pr = prox(p), msgs = msgsPedido(p, l);
  const maps = p.endereco ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent([p.endereco, p.bairro, l.cidade].filter(Boolean).join(", "))}` : null;
  const c = abrir(`Pedido #${p.numero}`, `
   <div class="linha" style="margin-bottom:12px"><span class="chip st-${p.status}">${ST[p.status]}</span><span class="chip">${p.origem === "loja" ? "Loja online" : "Painel · " + esc(p.origem)}</span><span class="mute peq">${dataHora(p.criado_em)}</span>
    <span class="dir linha"><button class="b peq" id="dImp">${ic("imprimir")}Comanda</button><button class="b peq" data-copiar="${esc(p.acompanhar)}">${ic("copiar")}Link do cliente</button></span></div>
   <div class="grade g2"><div class="cartao"><h3>Cliente</h3><p style="margin:0"><b>${esc(p.nome)}</b>${r.cliente ? `<br><small class="mute">${r.cliente.pedidos} pedido(s) · ${brl(r.cliente.gasto)} no total</small>` : ""}</p>
     ${p.whatsapp ? `<p style="margin:8px 0 0"><a class="b peq zap" href="${esc(zapLink(p.whatsapp, ""))}" target="_blank" rel="noopener">${ic("zap")}${esc(p.whatsapp.replace(/^55(\d\d)(\d{4,5})(\d{4})$/, "($1) $2-$3"))}</a></p>` : ""}
     ${r.cliente && r.cliente.observacoes ? `<p class="peq" style="margin:8px 0 0">📝 ${esc(r.cliente.observacoes)}</p>` : ""}</div>
    <div class="cartao"><h3>${p.tipo === "entrega" ? "Entrega" : "Retirada na loja"}</h3>
     ${p.tipo === "entrega" ? `<p style="margin:0">${esc(p.endereco || "—")}${p.bairro ? `<br>${esc(p.bairro)}` : ""}${p.complemento ? `<br>${esc(p.complemento)}` : ""}${p.referencia ? `<br><small class="mute">Ref.: ${esc(p.referencia)}</small>` : ""}</p>${maps ? `<p style="margin:8px 0 0"><a href="${maps}" target="_blank" rel="noopener">Ver no mapa ↗</a></p>` : ""}` : `<p style="margin:0" class="mute">O cliente vem buscar.</p>`}
     ${p.agendado_para ? `<p style="margin:8px 0 0"><span class="chip p">📅 Agendado: ${esc(p.agendado_para.slice(8, 10) + "/" + p.agendado_para.slice(5, 7) + " · " + p.agendado_para.slice(11))}</span></p>` : ""}</div></div>
   <h3 style="margin:18px 0 10px">Itens <small class="mute peq">(marque ao separar)</small></h3>
   <div class="itens-p">${r.itens.map((i) => `<label class="it ${i.separado ? "sep" : ""}"><input type="checkbox" data-item="${i.id}" ${i.separado ? "checked" : ""} ${["entregue", "cancelado"].includes(p.status) ? "disabled" : ""}>${i.foto ? `<img class="mini" src="${esc(i.foto)}" alt="">` : `<span class="mini">🛒</span>`}<span><span class="nm">${esc(i.nome)}</span><br><small class="mute">${qtd(i.quantidade, i.unidade)} × ${brl(i.preco)}${i.obs ? " · " + esc(i.obs) : ""}</small></span><b>${brl(i.total)}</b></label>`).join("")}</div>
   <div class="tot-box"><p><span>Produtos</span><span>${brl(p.subtotal)}</span></p>${p.desconto ? `<p><span>Desconto${p.cupom ? " (" + esc(p.cupom) + ")" : ""}</span><span>− ${brl(p.desconto)}</span></p>` : ""}${p.tipo === "entrega" ? `<p><span>Entrega</span><span>${p.taxa ? brl(p.taxa) : "Grátis"}</span></p>` : ""}<p class="g"><span>Total</span><span>${brl(p.total)}</span></p>${p.troco_para ? `<p class="peq"><span>Troco para ${brl(p.troco_para)}</span><b>${brl(p.troco_para - p.total)} de troco</b></p>` : ""}</div>
   ${p.observacoes ? `<div class="cartao" style="margin-top:12px"><b>Observações do cliente</b><p style="margin:4px 0 0">${esc(p.observacoes)}</p></div>` : ""}
   <div class="grade g2" style="margin-top:14px">
    <div class="campo"><label for="dPag">Pagamento</label><select id="dPag">${Object.entries(PAG).map(([k, v]) => `<option value="${k}" ${p.pagamento === k ? "selected" : ""}>${v}</option>`).join("")}</select>
     <label class="chave" style="margin-top:8px"><input type="checkbox" id="dPago" ${p.pago ? "checked" : ""}> Pagamento recebido ${p.pago_em ? `<small class="mute">em ${dataHora(p.pago_em)}</small>` : ""}</label></div>
    <div class="campo"><label for="dEnt">Entregador</label><select id="dEnt" ${p.tipo !== "entrega" ? "disabled" : ""}><option value="">— Sem entregador —</option>${ents.entregadores.filter((e) => e.ativo).map((e) => `<option value="${e.id}" ${p.entregador_id === e.id ? "selected" : ""}>${esc(e.nome)}</option>`).join("")}</select><small><a href="#/entregadores">Cadastrar entregadores</a> · o entregador recebe um link para marcar a entrega.</small></div>
   </div>
   <h3 style="margin:16px 0 8px">Mensagem pronta no WhatsApp</h3>
   <div class="linha">${Object.keys(msgs).map((k) => `<a class="b peq" target="_blank" rel="noopener" href="${esc(zapLink(p.whatsapp, msgs[k]))}">${ic("zap")}${k === "pix" ? "Chave Pix" : ST[k]}</a>`).join("")}</div>
   <h3 style="margin:18px 0 10px">Histórico</h3><ul class="hist">${r.historico.map((h) => `<li><b>${ST[h.status] || h.status}</b> · ${dataHora(h.em)}${h.nota ? `<br><span class="mute">${esc(h.nota)}</span>` : ""}${h.por ? ` <small class="mute">· ${esc(h.por)}</small>` : ""}</li>`).join("")}</ul>
   ${p.motivo_cancel ? `<p class="chip err" style="margin-top:10px">Motivo: ${esc(p.motivo_cancel)}</p>` : ""}
   <div class="rodape-gaveta">${pr ? `<button class="b pri" data-avancar="${p.id}" data-para="${pr}">${rotProx(p)} →</button>` : ""}${!["entregue", "cancelado"].includes(p.status) ? `<button class="b perigo" id="dCanc">Cancelar pedido</button>` : ""}<button class="b" data-fechar>Fechar</button></div>`);
  c.querySelectorAll("[data-item]").forEach((cb) => cb.addEventListener("change", async () => { const x = await tenta(() => api("PUT", `pedidos/${id}/itens/${cb.dataset.item}`, { separado: cb.checked })); if (x) cb.closest(".it").classList.toggle("sep", cb.checked); if (x && x.separados === x.total && x.total) toast("Tudo separado! Marque o pedido como pronto.", "ok"); }));
  $("#dPago").onchange = (e) => tenta(() => api("PUT", `pedidos/${id}`, { pago: e.target.checked }), e.target.checked ? "Pagamento confirmado" : "Pagamento desmarcado");
  $("#dPag").onchange = (e) => tenta(() => api("PUT", `pedidos/${id}`, { pagamento: e.target.value }), "Forma de pagamento alterada");
  $("#dEnt").onchange = (e) => tenta(() => api("PUT", `pedidos/${id}`, { entregador_id: e.target.value ? +e.target.value : null }), "Entregador definido");
  if ($("#dCanc")) $("#dCanc").onclick = () => { const mot = prompt("Motivo do cancelamento (o estoque volta para a loja):", "Cliente desistiu"); if (mot !== null) mudarStatus(id, "cancelado", { motivo: mot }); };
  $("#dImp").onclick = () => imprimir(p, r.itens, l);
}
function imprimir(p, itens, l) {
  $("#impressao").innerHTML = `<h2>${esc(l.nome)}</h2><p>Pedido <b>#${p.numero}</b> · ${dataHora(p.criado_em)}<br>${esc(p.nome)} · ${esc(p.whatsapp || "")}<br>${p.tipo === "entrega" ? "ENTREGA: " + esc([p.endereco, p.bairro, p.complemento].filter(Boolean).join(" · ")) : "RETIRADA NA LOJA"}${p.agendado_para ? "<br>AGENDADO: " + esc(p.agendado_para) : ""}</p>
   <table style="width:100%">${itens.map((i) => `<tr><td>${qtd(i.quantidade, i.unidade)}</td><td>${esc(i.nome)}</td><td style="text-align:right">${brl(i.total)}</td></tr>`).join("")}</table><hr>
   <p>Produtos: ${brl(p.subtotal)}${p.desconto ? "<br>Desconto: −" + brl(p.desconto) : ""}${p.tipo === "entrega" ? "<br>Entrega: " + brl(p.taxa) : ""}<br><b>TOTAL: ${brl(p.total)}</b><br>${PAG[p.pagamento]} ${p.pago ? "(PAGO)" : ""}${p.troco_para ? "<br>Troco para " + brl(p.troco_para) : ""}</p>${p.observacoes ? `<p>Obs.: ${esc(p.observacoes)}</p>` : ""}<p style="font-size:10px">SalesWorks · LLD Works</p>`;
  print();
}

// ---------- Novo pedido (balcão, telefone ou WhatsApp) ----------
async function novoPedido() {
  const r = await tenta(() => api("GET", "produtos")); if (!r) return;
  const prods = r.produtos.filter((p) => p.ativo), carrinho = new Map();
  const c = abrir("Novo pedido", `
   <div class="grade g2"><div class="campo"><label for="nOrig">Origem</label><select id="nOrig"><option value="balcao">Balcão / loja física</option><option value="whatsapp">WhatsApp</option><option value="telefone">Telefone</option><option value="painel">Outro</option></select></div>
    <div class="campo"><label for="nTipo">Como recebe</label><select id="nTipo"><option value="retirada">Retira na loja</option><option value="entrega">Entrega</option></select></div></div>
   <div class="grade g2"><div class="campo"><label for="nNome">Nome do cliente</label><input id="nNome" placeholder="Cliente balcão"></div><div class="campo"><label for="nZap">WhatsApp</label><input id="nZap" inputmode="tel" placeholder="(54) 99999-9999"></div></div>
   <div id="nEnd" hidden class="grade g3"><div class="campo"><label for="nRua">Rua e número</label><input id="nRua"></div><div class="campo"><label for="nBairro">Bairro</label><input id="nBairro"></div><div class="campo"><label for="nTaxa">Taxa de entrega</label><div class="pre"><span>R$</span><input id="nTaxa" inputmode="decimal" placeholder="automática"></div></div></div>
   <div class="campo"><label for="nBusca">Adicionar produtos</label><input id="nBusca" type="search" placeholder="Digite o nome ou o código"><div id="nSug" class="itens-p" style="margin-top:6px"></div></div>
   <div id="nCar" class="itens-p"></div>
   <div class="grade g3" style="margin-top:12px"><div class="campo"><label for="nPag">Pagamento</label><select id="nPag">${Object.entries(PAG).filter(([k]) => k !== "online").map(([k, v]) => `<option value="${k}">${v}</option>`).join("")}</select></div>
    <div class="campo"><label for="nDesc">Desconto</label><div class="pre"><span>R$</span><input id="nDesc" inputmode="decimal" placeholder="0,00"></div></div>
    <div class="campo"><label>&nbsp;</label><label class="chave"><input type="checkbox" id="nPago" checked> Já está pago</label></div></div>
   <div class="campo"><label for="nObs">Observações</label><input id="nObs"></div>
   <div class="tot-box"><p class="g"><span>Total dos produtos</span><span id="nTot">R$ 0,00</span></p></div>
   <div class="rodape-gaveta"><button class="b pri" id="nSalvar">Lançar pedido</button><label class="chave"><input type="checkbox" id="nEntregue"> Já entregue (venda de balcão)</label></div>`);
  const desenha = () => {
    let t = 0;
    $("#nCar").innerHTML = [...carrinho.values()].map(({ p, q }) => { const v = Math.round(p.preco_atual * q); t += v; return `<div class="it" style="grid-template-columns:44px 1fr auto auto">${p.foto ? `<img class="mini" src="${esc(p.foto)}" alt="">` : `<span class="mini">🛒</span>`}<span><b>${esc(p.nome)}</b><br><small class="mute">${brl(p.preco_atual)} / ${p.unidade}</small></span><input type="number" step="${p.qtd_passo}" min="${p.qtd_min}" value="${q}" data-q="${p.id}" style="width:90px" aria-label="Quantidade de ${esc(p.nome)}"><button class="b peq leve" data-tira="${p.id}" aria-label="Tirar">✕</button></div>`; }).join("") || '<p class="mute">Nenhum produto adicionado.</p>';
    $("#nTot").textContent = brl(t);
  };
  desenha();
  $("#nTipo").onchange = (e) => ($("#nEnd").hidden = e.target.value !== "entrega");
  $("#nBusca").oninput = (e) => {
    const s = e.target.value.trim().toLowerCase();
    $("#nSug").innerHTML = s ? prods.filter((p) => p.nome.toLowerCase().includes(s) || (p.codigo || "").toLowerCase() === s).slice(0, 6).map((p) => `<button type="button" class="it" style="grid-template-columns:44px 1fr auto;text-align:left;cursor:pointer" data-add="${p.id}">${p.foto ? `<img class="mini" src="${esc(p.foto)}" alt="">` : `<span class="mini">🛒</span>`}<span><b>${esc(p.nome)}</b><br><small class="mute">${p.controla_estoque ? "estoque " + qtd(p.estoque, p.unidade) : "sem controle de estoque"}</small></span><b>${brl(p.preco_atual)}</b></button>`).join("") : "";
  };
  c.addEventListener("click", (e) => {
    const a = e.target.closest("[data-add]"); if (a) { const p = prods.find((x) => x.id === +a.dataset.add); const k = carrinho.get(p.id); carrinho.set(p.id, { p, q: k ? +(k.q + p.qtd_passo).toFixed(3) : p.qtd_min }); $("#nBusca").value = ""; $("#nSug").innerHTML = ""; desenha(); $("#nBusca").focus(); }
    const t = e.target.closest("[data-tira]"); if (t) { carrinho.delete(+t.dataset.tira); desenha(); }
  });
  c.addEventListener("change", (e) => { const q = e.target.closest("[data-q]"); if (q) { const k = carrinho.get(+q.dataset.q); k.q = Math.max(k.p.qtd_min, numBR(q.value) || k.p.qtd_min); desenha(); } });
  $("#nSalvar").onclick = async () => {
    if (!carrinho.size) return toast("Adicione pelo menos um produto.", "err");
    const b = { origem: $("#nOrig").value, tipo: $("#nTipo").value, nome: $("#nNome").value, whatsapp: $("#nZap").value, pagamento: $("#nPag").value, pago: $("#nPago").checked, observacoes: $("#nObs").value,
      itens: [...carrinho.values()].map(({ p, q }) => ({ id: p.id, qtd: q })), status: $("#nEntregue").checked ? "entregue" : "", desconto: cent($("#nDesc").value) };
    if (b.tipo === "entrega") { b.endereco = { rua: $("#nRua").value, numero: "", bairro: $("#nBairro").value }; const tx = cent($("#nTaxa").value); if (tx != null) b.taxa = tx; }
    const r = await tenta(() => api("POST", "pedidos", b), "Pedido lançado!");
    if (r) { fechar(); if (["pedidos", "inicio"].includes(rota().pag)) render(); }
  };
}

// ---------- Separação ----------
PAGINAS.separacao = async (main) => {
  const r = await api("GET", "pedidos?status=ativos");
  const ps = r.pedidos.filter((p) => ["confirmado", "separacao"].includes(p.status));
  if (!ps.length) { main.innerHTML = `<div class="cartao vazio"><b>Nada para separar agora.</b>Os pedidos confirmados aparecem aqui com a lista de itens para conferir.</div>`; return; }
  const det = await Promise.all(ps.map((p) => api("GET", `pedidos/${p.id}`)));
  main.innerHTML = `<p class="mute">Marque cada item ao colocar na sacola. Quando terminar, marque o pedido como pronto.</p><div class="grade g2">${det.map(({ pedido: p, itens }) => `<section class="cartao"><h3>#${p.numero} · ${esc(p.nome)} <span class="dir chip st-${p.status}">${ST[p.status]}</span></h3>
   <p class="peq mute" style="margin:-6px 0 10px">${p.tipo === "entrega" ? "Entrega · " + esc(p.bairro || "") : "Retirada"}${p.agendado_para ? " · 📅 " + esc(p.agendado_para.slice(11)) : ""}${p.observacoes ? " · " + esc(p.observacoes) : ""}</p>
   <div class="itens-p">${itens.map((i) => `<label class="it ${i.separado ? "sep" : ""}"><input type="checkbox" data-sep="${p.id}:${i.id}" ${i.separado ? "checked" : ""}>${i.foto ? `<img class="mini" src="${esc(i.foto)}" alt="">` : `<span class="mini">🛒</span>`}<span class="nm">${esc(i.nome)}${i.obs ? `<br><small class="mute">${esc(i.obs)}</small>` : ""}</span><b>${qtd(i.quantidade, i.unidade)}</b></label>`).join("")}</div>
   <p style="margin:12px 0 0"><button class="b pri" data-avancar="${p.id}" data-para="pronto">Marcar pronto →</button></p></section>`).join("")}</div>`;
  main.addEventListener("change", async (e) => { const cb = e.target.closest("[data-sep]"); if (!cb) return; const [pid, iid] = cb.dataset.sep.split(":"); const x = await tenta(() => api("PUT", `pedidos/${pid}/itens/${iid}`, { separado: cb.checked })); if (x) cb.closest(".it").classList.toggle("sep", cb.checked); });
};

// ---------- Produtos ----------
async function categorias() { return (S.cache.cats = (await api("GET", "categorias")).categorias); }
PAGINAS.produtos = async (main) => {
  const [r, cats, lj] = await Promise.all([api("GET", "produtos"), categorias(), S.loja ? Promise.resolve({ loja: S.loja }) : api("GET", "loja")]);
  atualizaLoja(lj.loja);
  const ativos = r.produtos.filter((p) => p.ativo).length;
  main.innerHTML = `<div class="ferr"><input type="search" id="fBusca" placeholder="Buscar produto ou código"><select id="fCat"><option value="">Todas as categorias</option>${cats.map((c) => `<option value="${c.id}">${esc(c.nome)}</option>`).join("")}<option value="0">Sem categoria</option></select>
   <select id="fSt"><option value="">Ativos e inativos</option><option value="1">Só ativos</option><option value="0">Só inativos</option><option value="promo">Em promoção</option><option value="baixo">Estoque baixo</option><option value="semfoto">Sem foto</option></select>
   <span class="dir linha"><button class="b" id="btCats">Categorias</button><button class="b" id="btImp">Importar planilha</button><button class="b pri" id="btNovo">${ic("mais")}Novo produto</button></span></div>
   <p class="mute peq">${ativos} de ${r.limite} produtos ativos no seu plano. Selecione vários para ações em lote.</p>
   <div class="linha" id="lote" hidden style="margin-bottom:10px"><b id="loteN"></b><button class="b peq" data-lote="ativar">Ativar</button><button class="b peq" data-lote="desativar">Desativar</button><button class="b peq" data-lote="destaque">Destaque liga/desliga</button><button class="b peq" data-lote="preco_pct">Reajustar preço %</button><select id="loteCat" style="max-width:200px;min-height:32px"><option value="">Mover para categoria…</option>${cats.map((c) => `<option value="${c.id}">${esc(c.nome)}</option>`).join("")}</select></div>
   <div class="tab-wrap"><table><thead><tr><th style="width:36px"><input type="checkbox" id="tTodos" aria-label="Selecionar todos"></th><th>Produto</th><th>Categoria</th><th class="num">Preço</th><th class="num">Custo / margem</th><th class="num">Estoque</th><th>Status</th></tr></thead><tbody id="tProd"></tbody></table></div>`;
  const sel = new Set();
  const lista = () => {
    const s = $("#fBusca").value.trim().toLowerCase(), cat = $("#fCat").value, st = $("#fSt").value;
    const ps = r.produtos.filter((p) => (!s || p.nome.toLowerCase().includes(s) || (p.codigo || "").toLowerCase().includes(s)) && (cat === "" || String(p.categoria_id || 0) === cat) &&
      (st === "" || (st === "1" && p.ativo) || (st === "0" && !p.ativo) || (st === "promo" && p.preco_atual < p.preco) || (st === "baixo" && p.baixo) || (st === "semfoto" && !p.foto)));
    $("#tProd").innerHTML = ps.map((p) => `<tr class="clica" data-prod="${p.id}"><td><input type="checkbox" data-sel="${p.id}" ${sel.has(p.id) ? "checked" : ""} aria-label="Selecionar ${esc(p.nome)}"></td>
     <td><div class="th-prod">${p.foto ? `<img class="mini" src="${esc(p.foto)}" alt="" loading="lazy">` : `<span class="mini">📷</span>`}<span><b>${esc(p.nome)}</b>${p.destaque ? ' <span class="chip p">Destaque</span>' : ""}<br><small class="mute">${p.codigo ? esc(p.codigo) + " · " : ""}por ${UN[p.unidade] || p.unidade}</small></span></div></td>
     <td>${esc(p.categoria || "—")}</td><td class="num">${p.preco_atual < p.preco ? `<s class="mute peq">${brl(p.preco)}</s><br><b style="color:var(--ok)">${brl(p.preco_atual)}</b>` : `<b>${brl(p.preco)}</b>`}</td>
     <td class="num">${p.custo ? brl(p.custo) : "—"}${p.margem != null ? `<br><small class="${p.margem < (S.loja?.margem_alvo || 0) ? "chip warn" : "mute"}">${String(p.margem).replace(".", ",")}%</small>` : ""}</td>
     <td class="num">${p.controla_estoque ? `<span class="chip ${p.baixo ? "warn" : ""}">${qtd(p.estoque, p.unidade)}</span>` : '<small class="mute">não controla</small>'}</td>
     <td><span class="chip ${p.ativo ? "ok" : ""}">${p.ativo ? "Ativo" : "Inativo"}</span></td></tr>`).join("") || `<tr><td colspan="7"><div class="vazio"><b>Nenhum produto aqui.</b>Cadastre o primeiro produto ou importe uma planilha.</div></td></tr>`;
  };
  lista();
  let t; $$("#fBusca,#fCat,#fSt").forEach((el) => el.addEventListener("input", () => { clearTimeout(t); t = setTimeout(lista, 150); }));
  const atualizaLote = () => { $("#lote").hidden = !sel.size; $("#loteN").textContent = `${sel.size} selecionado(s)`; };
  main.addEventListener("click", (e) => {
    const cb = e.target.closest("[data-sel]"); if (cb) { e.stopPropagation(); cb.checked ? sel.add(+cb.dataset.sel) : sel.delete(+cb.dataset.sel); atualizaLote(); return; }
    const tr = e.target.closest("[data-prod]"); if (tr && !e.target.closest("input")) editarProduto(r.produtos.find((p) => p.id === +tr.dataset.prod), cats);
    const lb = e.target.closest("[data-lote]"); if (lb) {
      const acao = lb.dataset.lote; let valor;
      if (acao === "preco_pct") { valor = prompt("Reajuste em % (use negativo para baixar, ex.: 5 ou -10):"); if (valor === null) return; valor = numBR(valor); }
      tenta(() => api("POST", "produtos/lote", { ids: [...sel], acao, valor }), "Produtos atualizados").then((x) => x && render());
    }
  });
  $("#loteCat").onchange = (e) => { if (e.target.value) tenta(() => api("POST", "produtos/lote", { ids: [...sel], acao: "categoria", valor: +e.target.value }), "Categoria alterada").then((x) => x && render()); };
  $("#tTodos").onchange = (e) => { $$("[data-sel]").forEach((cb) => { cb.checked = e.target.checked; e.target.checked ? sel.add(+cb.dataset.sel) : sel.delete(+cb.dataset.sel); }); atualizaLote(); };
  $("#btNovo").onclick = () => editarProduto(null, cats);
  $("#btCats").onclick = () => gerirCategorias();
  $("#btImp").onclick = () => importarPlanilha();
};
function sugerido(custo, l) {
  const den = 1 - ((l.margem_alvo || 0) + (l.taxa_cartao || 0) + (l.imposto || 0)) / 100;
  return den > 0.05 ? Math.ceil((custo * (1 + (l.perda || 0) / 100)) / den / 10) * 10 - 1 : null;
}
function editarProduto(p, cats) {
  const novo = !p; p = p || { unidade: "un", qtd_min: 1, qtd_passo: 1, ativo: 1, controla_estoque: 0, estoque: 0 };
  const l = S.loja || {};
  const c = abrir(novo ? "Novo produto" : "Editar produto", `
   <div class="grade" style="grid-template-columns:150px 1fr;align-items:start">
    <div><div class="foto-up ${p.foto ? "tem" : ""}" id="eFoto" tabindex="0" role="button" aria-label="Escolher foto" style="${p.foto ? `background-image:url('${esc(p.foto)}')` : ""}"><span>📷<br>Adicionar foto</span></div><input type="hidden" id="eFotoId" value="${p.foto_id || ""}"><small class="mute">A foto é reduzida e otimizada aqui mesmo.</small></div>
    <div><div class="campo"><label for="eNome">Nome do produto</label><input id="eNome" value="${esc(p.nome || "")}" maxlength="120" required></div>
     <div class="grade g2"><div class="campo"><label for="eCat">Categoria</label><select id="eCat"><option value="">Sem categoria</option>${cats.map((x) => `<option value="${x.id}" ${p.categoria_id === x.id ? "selected" : ""}>${esc(x.emoji || "")} ${esc(x.nome)}</option>`).join("")}</select></div>
      <div class="campo"><label for="eCod">Código / SKU (opcional)</label><input id="eCod" value="${esc(p.codigo || "")}"></div></div></div></div>
   <div class="campo"><label for="eDesc">Descrição</label><textarea id="eDesc" maxlength="800" placeholder="O que o cliente precisa saber: tamanho, sabor, origem, validade…">${esc(p.descricao || "")}</textarea></div>
   <div class="grade g3"><div class="campo"><label for="eUn">Vendido por</label><select id="eUn">${Object.entries(UN).map(([k, v]) => `<option value="${k}" ${p.unidade === k ? "selected" : ""}>${v}</option>`).join("")}</select></div>
    <div class="campo"><label for="eMin">Quantidade mínima</label><input id="eMin" inputmode="decimal" value="${String(p.qtd_min).replace(".", ",")}"></div>
    <div class="campo"><label for="ePasso">De quanto em quanto</label><input id="ePasso" inputmode="decimal" value="${String(p.qtd_passo).replace(".", ",")}"><small>Ex.: 0,25 kg</small></div></div>
   <h3 style="margin:8px 0 10px">Preço</h3>
   <div class="grade g3"><div class="campo"><label for="eCusto">Custo</label><div class="pre"><span>R$</span><input id="eCusto" inputmode="decimal" value="${reais(p.custo)}"></div></div>
    <div class="campo"><label for="ePreco">Preço de venda</label><div class="pre"><span>R$</span><input id="ePreco" inputmode="decimal" value="${reais(p.preco)}" required></div></div>
    <div class="campo"><label>&nbsp;</label><button type="button" class="b" id="eSug" style="width:100%">Usar preço sugerido</button></div></div>
   <div class="margem" id="eMarg"></div>
   <details ${p.promo != null || p.atacado_qtd ? "open" : ""}><summary class="forte" style="cursor:pointer;margin-bottom:10px">Promoção e preço de atacado</summary>
    <div class="grade g3"><div class="campo"><label for="ePromo">Preço promocional</label><div class="pre"><span>R$</span><input id="ePromo" inputmode="decimal" value="${reais(p.promo)}"></div></div>
     <div class="campo"><label for="ePi">Começa em</label><input type="date" id="ePi" value="${p.promo_ini || ""}"></div><div class="campo"><label for="ePf">Termina em</label><input type="date" id="ePf" value="${p.promo_fim || ""}"></div></div>
    <div class="grade g2"><div class="campo"><label for="eAq">Atacado a partir de (quantidade)</label><input id="eAq" inputmode="decimal" value="${p.atacado_qtd ? String(p.atacado_qtd).replace(".", ",") : ""}"></div><div class="campo"><label for="eAp">Preço de atacado</label><div class="pre"><span>R$</span><input id="eAp" inputmode="decimal" value="${reais(p.atacado_preco)}"></div></div></div></details>
   <h3 style="margin:12px 0 10px">Estoque</h3>
   <label class="chave"><input type="checkbox" id="eCtrl" ${p.controla_estoque ? "checked" : ""}><span>Controlar estoque<small>A loja mostra "esgotado" e não deixa vender além do que tem.</small></span></label>
   <div class="grade g2" id="eEst" style="margin-top:10px" ${p.controla_estoque ? "" : "hidden"}>
    ${novo ? `<div class="campo"><label for="eQtd">Estoque inicial</label><input id="eQtd" inputmode="decimal" value="0"></div>` : `<div class="campo"><label>Estoque atual</label><div class="linha"><b>${qtd(p.estoque, p.unidade)}</b><button type="button" class="b peq" id="eMov">Entrada / perda / ajuste</button></div></div>`}
    <div class="campo"><label for="eEmin">Avisar quando ficar abaixo de</label><input id="eEmin" inputmode="decimal" value="${p.estoque_min != null ? String(p.estoque_min).replace(".", ",") : ""}"></div></div>
   <div class="grade g2" style="margin-top:12px"><label class="chave"><input type="checkbox" id="eDest" ${p.destaque ? "checked" : ""}><span>Destaque<small>Aparece primeiro na loja.</small></span></label><label class="chave"><input type="checkbox" id="eAtivo" ${p.ativo ? "checked" : ""}><span>Ativo<small>Visível e à venda na loja.</small></span></label></div>
   <div class="rodape-gaveta"><button class="b pri" id="eSalvar">Salvar produto</button>${novo ? "" : `<button class="b perigo" id="eExcluir">Excluir</button>`}<button class="b" data-fechar>Cancelar</button></div>`);
  campoFoto($("#eFoto"), $("#eFotoId"));
  const marg = () => { const cu = cent($("#eCusto").value), pr = cent($("#ePreco").value); const s = cu ? sugerido(cu, l) : null;
    $("#eMarg").innerHTML = cu && pr ? `Margem: <span class="chip ${((pr - cu) / pr) * 100 < (l.margem_alvo || 0) ? "warn" : "ok"}">${(((pr - cu) / pr) * 100).toFixed(1).replace(".", ",")}%</span> <span class="mute peq">lucro de ${brl(pr - cu)} por ${UN[$("#eUn").value]}</span>${s ? `<span class="dir mute peq">sugerido: ${brl(s)}</span>` : ""}` : `<span class="mute peq">Informe o custo para ver a margem e o preço sugerido (margem alvo de ${l.margem_alvo || 30}% em <a href="#/precificacao">Precificação</a>).</span>`; };
  marg(); $$("#eCusto,#ePreco,#eUn").forEach((x) => x.addEventListener("input", marg));
  $("#eSug").onclick = () => { const cu = cent($("#eCusto").value); const s = cu && sugerido(cu, l); if (s) { $("#ePreco").value = reais(s); marg(); } else toast("Informe o custo primeiro.", "err"); };
  $("#eUn").onchange = (e) => { if (["kg", "l", "m"].includes(e.target.value) && $("#ePasso").value === "1") { $("#eMin").value = "0,5"; $("#ePasso").value = "0,25"; } };
  $("#eCtrl").onchange = (e) => ($("#eEst").hidden = !e.target.checked);
  if ($("#eMov")) $("#eMov").onclick = () => movimentar(p);
  $("#eSalvar").onclick = async () => {
    const b = { nome: $("#eNome").value, categoria_id: $("#eCat").value || null, codigo: $("#eCod").value, descricao: $("#eDesc").value, unidade: $("#eUn").value, qtd_min: numBR($("#eMin").value), qtd_passo: numBR($("#ePasso").value),
      custo: cent($("#eCusto").value) || 0, preco: cent($("#ePreco").value), promo: cent($("#ePromo").value), promo_ini: $("#ePi").value || null, promo_fim: $("#ePf").value || null,
      atacado_qtd: numBR($("#eAq").value), atacado_preco: cent($("#eAp").value), controla_estoque: $("#eCtrl").checked, estoque_min: numBR($("#eEmin").value), foto_id: $("#eFotoId").value || null, destaque: $("#eDest").checked, ativo: $("#eAtivo").checked };
    if (novo && $("#eQtd")) b.estoque = numBR($("#eQtd").value) || 0;
    if (b.preco == null) return toast("Informe o preço de venda.", "err");
    const r = await tenta(() => api(novo ? "POST" : "PUT", novo ? "produtos" : `produtos/${p.id}`, b), "Produto salvo!");
    if (r) { fechar(); render(); }
  };
  if ($("#eExcluir")) $("#eExcluir").onclick = async () => { if (!confirm(`Excluir "${p.nome}"? Se ele já tiver pedidos, fica só desativado.`)) return; const r = await tenta(() => api("DELETE", `produtos/${p.id}`)); if (r) { toast(r.arquivado ? "O produto tem pedidos: foi desativado." : "Produto excluído.", "ok"); fechar(); render(); } };
}
function movimentar(p) {
  abrir(`Estoque · ${p.nome}`, `<p>Estoque atual: <b>${qtd(p.estoque, p.unidade)}</b></p>
   <div class="campo"><label for="mTipo">Movimento</label><select id="mTipo"><option value="entrada">Entrada (chegou mercadoria)</option><option value="perda">Perda / quebra / vencido</option><option value="ajuste">Ajuste (contagem: informar o total certo)</option><option value="devolucao">Devolução de cliente</option></select></div>
   <div class="grade g2"><div class="campo"><label for="mQtd">Quantidade (${UN[p.unidade] || p.unidade})</label><input id="mQtd" inputmode="decimal"></div><div class="campo"><label for="mCusto">Custo unitário (entrada)</label><div class="pre"><span>R$</span><input id="mCusto" inputmode="decimal" value="${reais(p.custo)}"></div></div></div>
   <div class="campo"><label for="mNota">Observação</label><input id="mNota" placeholder="Ex.: nota fiscal 1234, fornecedor"></div>
   <div id="mHist"></div><div class="rodape-gaveta"><button class="b pri" id="mSalvar">Registrar</button><button class="b" data-fechar>Fechar</button></div>`);
  api("GET", `produtos/${p.id}/movimentos`).then((r) => { $("#mHist").innerHTML = r.movimentos.length ? `<h3 style="margin:12px 0 8px">Últimos movimentos</h3><div class="tab-wrap"><table><tr><th>Data</th><th>Tipo</th><th class="num">Qtd</th><th class="num">Saldo</th><th>Obs.</th></tr>${r.movimentos.map((m) => `<tr><td>${dataHora(m.em)}</td><td>${m.tipo}</td><td class="num">${String(m.qtd).replace(".", ",")}</td><td class="num">${String(m.saldo).replace(".", ",")}</td><td>${esc(m.nota || "")}</td></tr>`).join("")}</table></div>` : ""; }).catch(() => {});
  $("#mSalvar").onclick = async () => { const r = await tenta(() => api("POST", `produtos/${p.id}/estoque`, { tipo: $("#mTipo").value, qtd: numBR($("#mQtd").value), custo: cent($("#mCusto").value), nota: $("#mNota").value }), "Estoque atualizado"); if (r) { fechar(); render(); } };
}
async function gerirCategorias() {
  const cats = await categorias();
  const c = abrir("Categorias", `<p class="mute">A ordem aqui é a ordem na loja. Use as setas para reorganizar.</p><div id="cLista" class="itens-p"></div>
   <div class="linha" style="margin-top:14px"><input id="cEmoji" placeholder="🍎" style="width:70px" maxlength="4" aria-label="Emoji"><input id="cNome" placeholder="Nova categoria" style="flex:1"><button class="b pri" id="cAdd">Adicionar</button></div>`, () => render());
  const desenha = () => { $("#cLista").innerHTML = cats.map((x, i) => `<div class="it" style="grid-template-columns:60px 1fr auto auto auto auto"><input value="${esc(x.emoji || "")}" data-ce="${x.id}" maxlength="4" aria-label="Emoji"><input value="${esc(x.nome)}" data-cn="${x.id}" aria-label="Nome"><small class="mute">${x.produtos} prod.</small><button class="b peq leve" data-up="${i}" aria-label="Subir">↑</button><button class="b peq leve" data-dn="${i}" aria-label="Descer">↓</button><button class="b peq perigo" data-del="${x.id}" aria-label="Excluir">✕</button></div>`).join("") || '<p class="mute">Nenhuma categoria ainda.</p>'; };
  desenha();
  const ordem = () => api("POST", "categorias/ordem", { ids: cats.map((x) => x.id) }).catch(erro);
  c.addEventListener("click", async (e) => {
    const u = e.target.closest("[data-up]"), d = e.target.closest("[data-dn]"), x = e.target.closest("[data-del]");
    if (u && +u.dataset.up > 0) { const i = +u.dataset.up; [cats[i - 1], cats[i]] = [cats[i], cats[i - 1]]; desenha(); ordem(); }
    if (d && +d.dataset.dn < cats.length - 1) { const i = +d.dataset.dn; [cats[i + 1], cats[i]] = [cats[i], cats[i + 1]]; desenha(); ordem(); }
    if (x && confirm("Excluir a categoria? Os produtos dela ficam sem categoria.")) { if (await tenta(() => api("DELETE", `categorias/${x.dataset.del}`))) { cats.splice(cats.findIndex((k) => k.id === +x.dataset.del), 1); desenha(); } }
  });
  c.addEventListener("change", (e) => { const n = e.target.closest("[data-cn],[data-ce]"); if (!n) return; const id = n.dataset.cn || n.dataset.ce; tenta(() => api("PUT", `categorias/${id}`, n.dataset.cn ? { nome: n.value } : { emoji: n.value }), "Categoria salva"); });
  $("#cAdd").onclick = async () => { const r = await tenta(() => api("POST", "categorias", { nome: $("#cNome").value, emoji: $("#cEmoji").value })); if (r) { cats.push({ ...r.categoria, produtos: 0 }); $("#cNome").value = ""; $("#cEmoji").value = ""; desenha(); } };
}
function csv(texto) {
  const linhas = texto.replace(/\r/g, "").split("\n").filter((x) => x.trim());
  const sep = (linhas[0].match(/;/g) || []).length >= (linhas[0].match(/,/g) || []).length ? ";" : ",";
  const parte = (l) => { const o = []; let cur = "", q = false; for (const ch of l) { if (ch === '"') q = !q; else if (ch === sep && !q) { o.push(cur); cur = ""; } else cur += ch; } o.push(cur); return o.map((x) => x.trim()); };
  const cab = parte(linhas[0]).map((h) => h.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z]/g, ""));
  const mapa = { nome: "nome", produto: "nome", categoria: "categoria", preco: "preco", precovenda: "preco", valor: "preco", custo: "custo", unidade: "unidade", estoque: "estoque", quantidade: "estoque", descricao: "descricao", codigo: "codigo", sku: "codigo" };
  return linhas.slice(1).map((l) => { const v = parte(l), o = {}; cab.forEach((h, i) => { if (mapa[h]) o[mapa[h]] = v[i]; }); if (o.preco) o.preco = String(o.preco).replace(/R\$\s?/, "").replace(/\.(?=\d{3}(\D|$))/g, "").replace(",", "."); if (o.custo) o.custo = String(o.custo).replace(/R\$\s?/, "").replace(/\.(?=\d{3}(\D|$))/g, "").replace(",", "."); if (o.estoque) o.estoque = String(o.estoque).replace(",", "."); return o; });
}
function importarPlanilha() {
  const modelo = "nome;categoria;preco;custo;unidade;estoque;descricao;codigo\nBanana prata;Frutas;6,90;3,50;kg;40;Da serra gaúcha;\nPão de queijo 1 kg;Congelados;32,00;19,00;un;15;;789000000001\n";
  abrir("Importar planilha de produtos", `<p>Monte a planilha no Excel ou no Google Planilhas com as colunas <b>nome, categoria, preco, custo, unidade, estoque, descricao, codigo</b> e salve como <b>CSV</b>. Só nome e preço são obrigatórios.</p>
   <p><a class="b" download="modelo-produtos-salesworks.csv" href="data:text/csv;charset=utf-8,${encodeURIComponent("﻿" + modelo)}">Baixar planilha modelo</a></p>
   <div class="campo"><label for="iArq">Arquivo CSV</label><input type="file" id="iArq" accept=".csv,text/csv"></div><div class="campo"><label for="iTxt">…ou cole o conteúdo aqui</label><textarea id="iTxt" rows="7" placeholder="${esc(modelo)}"></textarea></div>
   <div id="iPrev"></div><div class="rodape-gaveta"><button class="b pri" id="iOk">Importar</button><button class="b" data-fechar>Cancelar</button></div>`);
  $("#iArq").onchange = async (e) => { const f = e.target.files[0]; if (f) $("#iTxt").value = await f.text(); prev(); };
  const prev = () => { try { const l = csv($("#iTxt").value); $("#iPrev").innerHTML = `<p class="mute">${l.length} linha(s) encontradas. Primeiras: ${l.slice(0, 3).map((x) => esc(x.nome || "?") + " (R$ " + esc(x.preco || "?") + ")").join(", ")}</p>`; } catch { $("#iPrev").innerHTML = ""; } };
  $("#iTxt").oninput = prev;
  $("#iOk").onclick = async () => { const linhas = csv($("#iTxt").value || ""); if (!linhas.length) return toast("Nada para importar.", "err"); const r = await tenta(() => api("POST", "produtos/importar", { linhas })); if (r) { toast(`${r.criados} produto(s) importado(s).${r.erros.length ? ` ${r.erros.length} linha(s) com problema.` : ""}`, r.erros.length ? "" : "ok"); if (r.erros.length) $("#iPrev").innerHTML = `<p class="chip warn">Linhas com problema: ${r.erros.map((x) => `${x.linha} (${esc(x.erro)})`).join(", ")}</p>`; else { fechar(); render(); } } };
}

// ---------- Estoque ----------
PAGINAS.estoque = async (main) => {
  const r = await api("GET", "estoque");
  main.innerHTML = `<div class="kpis"><div class="kpi"><span>Itens com estoque controlado</span><b>${r.valor.itens}</b></div><div class="kpi"><span>Estoque a preço de custo</span><b>${brl(r.valor.custo)}</b></div><div class="kpi"><span>Estoque a preço de venda</span><b>${brl(r.valor.venda)}</b></div><div class="kpi ${r.baixo.length ? "dest" : ""}"><span>Abaixo do mínimo</span><b>${r.baixo.length}</b></div></div>
   <div class="col2"><section class="cartao"><h3>Repor</h3>${r.baixo.length ? r.baixo.map((p) => `<div class="linha" style="padding:8px 0;border-bottom:1px solid var(--line)">${p.foto ? `<img class="mini" src="${esc(p.foto)}" alt="">` : `<span class="mini">📦</span>`}<span><b>${esc(p.nome)}</b><br><small class="mute">mínimo ${p.estoque_min != null ? qtd(p.estoque_min, p.unidade) : "0"}</small></span><span class="dir chip warn">${qtd(p.estoque, p.unidade)}</span><button class="b peq" data-repor="${p.id}">Entrada</button></div>`).join("") : '<div class="vazio"><b>Nada abaixo do mínimo.</b>Defina o estoque mínimo em cada produto para receber o aviso.</div>'}</section>
   <section class="cartao"><h3>Últimos movimentos</h3><div class="tab-wrap"><table><tr><th>Data</th><th>Produto</th><th>Tipo</th><th class="num">Qtd</th><th class="num">Saldo</th></tr>${r.movimentos.slice(0, 60).map((m) => `<tr><td>${dataHora(m.em)}</td><td>${esc(m.nome)}<br><small class="mute">${esc(m.nota || "")}</small></td><td>${m.tipo}</td><td class="num" style="color:${m.qtd < 0 ? "var(--err)" : "var(--ok)"}">${m.qtd > 0 ? "+" : ""}${String(m.qtd).replace(".", ",")}</td><td class="num">${String(m.saldo).replace(".", ",")}</td></tr>`).join("") || '<tr><td colspan="5" class="mute">Sem movimentos ainda.</td></tr>'}</table></div></section></div>`;
  main.addEventListener("click", (e) => { const b = e.target.closest("[data-repor]"); if (b) movimentar(r.baixo.find((p) => p.id === +b.dataset.repor)); });
};

// ---------- Clientes (CRM) ----------
const SEGN = { novo: ["Novos", "p"], fiel: ["Fiéis", "ok"], ativo: ["Ativos", ""], em_risco: ["Em risco", "warn"], sumido: ["Sumidos", "err"], sem_pedido: ["Sem pedido", ""] };
PAGINAS.clientes = async (main) => {
  let seg = "", busca = "";
  const [cup, lj] = await Promise.all([api("GET", "cupons"), S.loja ? { loja: S.loja } : api("GET", "loja")]);
  const l = lj.loja, cupons = cup.cupons.filter((c) => c.ativo);
  main.innerHTML = `<div class="ferr"><input type="search" id="cBusca" placeholder="Nome, WhatsApp ou bairro"><span class="dir linha"><button class="b" id="cCsv">Exportar CSV</button><button class="b pri" id="cNovo">${ic("mais")}Novo cliente</button></span></div><div class="seg" id="cSeg"></div><div id="cTab"></div>`;
  let dados;
  const carrega = async () => {
    dados = await api("GET", "clientes?" + new URLSearchParams({ q: busca, seg }));
    const tot = Object.values(dados.contagem).reduce((a, b) => a + b, 0);
    $("#cSeg").innerHTML = `<button class="${seg ? "" : "ativo"}" data-seg="">Todos · ${tot}</button>` + Object.entries(SEGN).map(([k, [t]]) => `<button class="${seg === k ? "ativo" : ""}" data-seg="${k}">${t} · ${dados.contagem[k] || 0}</button>`).join("");
    $("#cTab").innerHTML = `<p class="mute peq">Em risco: sem comprar há mais de ${dados.dias_inativo} dias. Sumidos: mais de ${dados.dias_inativo * 2} dias. Ajuste em Minha loja → Regras.</p><div class="tab-wrap"><table><thead><tr><th>Cliente</th><th>Bairro</th><th class="num">Pedidos</th><th class="num">Total gasto</th><th>Último pedido</th><th>Situação</th><th></th></tr></thead><tbody>${dados.clientes.map((c) => `<tr class="clica" data-cli="${c.id}"><td><b>${esc(c.nome)}</b><br><small class="mute">${esc(c.whatsapp.replace(/^55(\d\d)(\d{4,5})(\d{4})$/, "($1) $2-$3"))}${c.aceita_promos ? " · aceita novidades" : ""}</small></td><td>${esc(c.bairro || "—")}</td><td class="num">${c.pedidos}</td><td class="num"><b>${brl(c.gasto)}</b></td><td>${data(c.ultimo_pedido)}</td><td><span class="chip ${SEGN[c.segmento][1]}">${SEGN[c.segmento][0].replace(/s$/, "")}</span></td><td><a class="b peq zap" target="_blank" rel="noopener" href="${esc(zapLink(c.whatsapp, reativar(c, l, cupons[0])))}">${ic("zap")}</a></td></tr>`).join("") || '<tr><td colspan="7"><div class="vazio"><b>Nenhum cliente aqui.</b>Cada pedido da loja vira um cliente no CRM automaticamente.</div></td></tr>'}</tbody></table></div>`;
  };
  await carrega();
  let t; $("#cBusca").oninput = (e) => { busca = e.target.value; clearTimeout(t); t = setTimeout(carrega, 300); };
  main.addEventListener("click", (e) => { const s = e.target.closest("[data-seg]"); if (s) { seg = s.dataset.seg; carrega(); } const r = e.target.closest("[data-cli]"); if (r && !e.target.closest("a")) fichaCliente(+r.dataset.cli, l, cupons); });
  $("#cCsv").onclick = () => { const cab = "nome;whatsapp;email;bairro;pedidos;gasto;ultimo_pedido;situacao;aceita_novidades\n"; const b = new Blob(["﻿" + cab + dados.clientes.map((c) => [c.nome, c.whatsapp, c.email || "", c.bairro || "", c.pedidos, (c.gasto / 100).toFixed(2).replace(".", ","), data(c.ultimo_pedido), SEGN[c.segmento][0], c.aceita_promos ? "sim" : "não"].map((x) => `"${String(x).replace(/"/g, '""')}"`).join(";")).join("\n")], { type: "text/csv" }); const a = document.createElement("a"); a.href = URL.createObjectURL(b); a.download = `clientes-${hoje()}.csv`; a.click(); };
  $("#cNovo").onclick = () => { abrir("Novo cliente", `<div class="campo"><label for="nc1">Nome</label><input id="nc1"></div><div class="campo"><label for="nc2">WhatsApp</label><input id="nc2" inputmode="tel"></div><div class="grade g2"><div class="campo"><label for="nc3">E-mail</label><input id="nc3" type="email"></div><div class="campo"><label for="nc4">Bairro</label><input id="nc4"></div></div><div class="campo"><label for="nc5">Observações</label><textarea id="nc5"></textarea></div><div class="rodape-gaveta"><button class="b pri" id="ncOk">Salvar</button></div>`);
    $("#ncOk").onclick = async () => { if (await tenta(() => api("POST", "clientes", { nome: $("#nc1").value, whatsapp: $("#nc2").value, email: $("#nc3").value, bairro: $("#nc4").value, observacoes: $("#nc5").value }), "Cliente salvo")) { fechar(); carrega(); } }; };
};
function reativar(c, l, cupom) {
  const n = c.nome.split(" ")[0];
  if (c.segmento === "novo" || c.segmento === "sem_pedido") return `Oi, ${n}! Obrigado por comprar na ${l.nome}. Qualquer coisa é só chamar aqui. Nossa loja: ${l.link}`;
  return `Oi, ${n}! Sentimos sua falta na ${l.nome} 💛${cupom ? ` Use o cupom ${cupom.codigo} e ganhe ${cupom.tipo === "pct" ? cupom.valor + "% de desconto" : cupom.tipo === "valor" ? brl(cupom.valor) + " de desconto" : "entrega grátis"} no próximo pedido.` : ""} Faça seu pedido aqui: ${l.link}`;
}
async function fichaCliente(id, l, cupons) {
  const r = await api("GET", `clientes/${id}`), c = r.cliente;
  abrir(c.nome, `<div class="kpis"><div class="kpi"><span>Pedidos</span><b>${c.pedidos}</b></div><div class="kpi"><span>Total gasto</span><b>${brl(c.gasto)}</b></div><div class="kpi"><span>Ticket médio</span><b>${brl(c.ticket)}</b></div></div>
   <p><span class="chip ${SEGN[c.segmento][1]}">${SEGN[c.segmento][0]}</span> · cliente desde ${data(c.criado_em)} · último pedido ${data(c.ultimo_pedido)}</p>
   <div class="linha" style="margin-bottom:14px"><a class="b zap" target="_blank" rel="noopener" href="${esc(zapLink(c.whatsapp, ""))}">${ic("zap")}Conversar</a>${cupons.length ? `<select id="fcCup" style="max-width:220px">${cupons.map((x) => `<option value="${x.id}">Cupom ${esc(x.codigo)}</option>`).join("")}</select><a class="b" id="fcReat" target="_blank" rel="noopener">Mensagem com cupom</a>` : `<a class="b" href="#/cupons">Criar cupom de volta</a>`}</div>
   <div class="grade g2"><div class="campo"><label for="fc1">Nome</label><input id="fc1" value="${esc(c.nome)}"></div><div class="campo"><label for="fc2">E-mail</label><input id="fc2" value="${esc(c.email || "")}"></div></div>
   <div class="grade g2"><div class="campo"><label for="fc3">Endereço</label><input id="fc3" value="${esc(c.endereco || "")}"></div><div class="campo"><label for="fc4">Bairro</label><input id="fc4" value="${esc(c.bairro || "")}"></div></div>
   <div class="campo"><label for="fc5">Etiquetas</label><input id="fc5" value="${esc(c.tags || "")}" placeholder="vip, atacado, condomínio X"></div>
   <div class="campo"><label for="fc6">Observações</label><textarea id="fc6" placeholder="Preferências, alergias, melhor horário…">${esc(c.observacoes || "")}</textarea></div>
   ${r.preferidos.length ? `<h3 style="margin:8px 0">O que mais compra</h3><div class="linha">${r.preferidos.map((x) => `<span class="chip">${esc(x.nome)} · ${x.vezes}x</span>`).join("")}</div>` : ""}
   <h3 style="margin:16px 0 8px">Pedidos</h3><div class="tab-wrap"><table>${r.pedidos.map((p) => `<tr class="clica" data-ped="${p.id}"><td><b>#${p.numero}</b></td><td>${dataHora(p.criado_em)}</td><td><span class="chip st-${p.status}">${ST[p.status]}</span></td><td class="num">${brl(p.total)}</td></tr>`).join("") || '<tr><td class="mute">Sem pedidos.</td></tr>'}</table></div>
   <div class="rodape-gaveta"><button class="b pri" id="fcOk">Salvar</button><button class="b perigo" id="fcDel">Excluir cadastro (LGPD)</button></div>`);
  const atual = () => { const cu = cupons.find((x) => x.id === +$("#fcCup").value); $("#fcReat").href = zapLink(c.whatsapp, reativar({ ...c, segmento: "em_risco" }, l, cu)); };
  if ($("#fcCup")) { atual(); $("#fcCup").onchange = atual; }
  $("#fcOk").onclick = async () => { if (await tenta(() => api("PUT", `clientes/${id}`, { nome: $("#fc1").value, email: $("#fc2").value, endereco: $("#fc3").value, bairro: $("#fc4").value, tags: $("#fc5").value, observacoes: $("#fc6").value }), "Cliente salvo")) { fechar(); render(); } };
  $("#fcDel").onclick = async () => { if (confirm("Excluir os dados pessoais deste cliente? Os pedidos continuam no histórico de vendas, sem o vínculo com o cadastro.")) { if (await tenta(() => api("DELETE", `clientes/${id}`), "Cadastro excluído")) { fechar(); render(); } } };
}

// ---------- Cupons ----------
PAGINAS.cupons = async (main) => {
  const [r, lj] = await Promise.all([api("GET", "cupons"), S.loja ? { loja: S.loja } : api("GET", "loja")]);
  const l = lj.loja;
  const desc = (c) => (c.tipo === "pct" ? `${c.valor}% de desconto` : c.tipo === "valor" ? `${brl(c.valor)} de desconto` : "Entrega grátis");
  main.innerHTML = `<div class="ferr"><p class="mute" style="margin:0">Crie cupons para reativar clientes, lançar produtos ou fazer campanha no Instagram. O cliente digita o código no carrinho.</p><button class="b pri dir" id="cpNovo">${ic("mais")}Novo cupom</button></div>
   <div class="grade g3">${r.cupons.map((c) => `<div class="cupom-c" style="${c.ativo ? "" : "opacity:.55"}"><div><b>${esc(c.codigo)}</b><p style="margin:2px 0 0">${desc(c)}${c.minimo ? ` · acima de ${brl(c.minimo)}` : ""}</p><small class="mute">${c.usos} uso(s)${c.max_usos ? ` de ${c.max_usos}` : ""}${c.validade ? ` · até ${data(c.validade + "T15:00:00Z")}` : ""}${c.ativo ? "" : " · desativado"}</small></div>
    <div class="linha" style="flex-direction:column"><button class="b peq" data-cp="${c.id}">Editar</button><a class="b peq zap" target="_blank" rel="noopener" href="${esc(zapLink("", `Cupom ${c.codigo}: ${desc(c)} na ${l.nome}! Use no carrinho: ${l.link}`))}">${ic("zap")}Divulgar</a></div></div>`).join("") || `<div class="cartao vazio"><b>Nenhum cupom ainda.</b>Ex.: VOLTA10 para clientes sumidos, FRETEGRATIS para o fim de semana.</div>`}</div>`;
  const form = (c = { tipo: "pct", ativo: 1 }) => {
    abrir(c.id ? `Cupom ${c.codigo}` : "Novo cupom", `<div class="campo"><label for="k1">Código</label><input id="k1" value="${esc(c.codigo || "")}" placeholder="VOLTA10" style="text-transform:uppercase"></div>
     <div class="grade g2"><div class="campo"><label for="k2">Tipo</label><select id="k2"><option value="pct" ${c.tipo === "pct" ? "selected" : ""}>Porcentagem</option><option value="valor" ${c.tipo === "valor" ? "selected" : ""}>Valor em reais</option><option value="frete" ${c.tipo === "frete" ? "selected" : ""}>Entrega grátis</option></select></div><div class="campo"><label for="k3">Valor</label><input id="k3" inputmode="decimal" value="${c.tipo === "valor" ? reais(c.valor) : c.valor || ""}" placeholder="10"></div></div>
     <div class="grade g3"><div class="campo"><label for="k4">Compra mínima</label><div class="pre"><span>R$</span><input id="k4" inputmode="decimal" value="${reais(c.minimo || null)}"></div></div><div class="campo"><label for="k5">Válido até</label><input type="date" id="k5" value="${c.validade || ""}"></div><div class="campo"><label for="k6">Limite de usos</label><input id="k6" inputmode="numeric" value="${c.max_usos || ""}" placeholder="sem limite"></div></div>
     <label class="chave"><input type="checkbox" id="k7" ${c.ativo ? "checked" : ""}> Cupom ativo</label>
     <div class="rodape-gaveta"><button class="b pri" id="kOk">Salvar</button>${c.id ? `<button class="b perigo" id="kDel">Excluir</button>` : ""}</div>`);
    $("#kOk").onclick = async () => { const tipo = $("#k2").value; const b = { codigo: $("#k1").value, tipo, valor: tipo === "valor" ? cent($("#k3").value) : numBR($("#k3").value), minimo: cent($("#k4").value), validade: $("#k5").value, max_usos: $("#k6").value, ativo: $("#k7").checked };
      if (await tenta(() => api(c.id ? "PUT" : "POST", c.id ? `cupons/${c.id}` : "cupons", b), "Cupom salvo")) { fechar(); render(); } };
    if ($("#kDel")) $("#kDel").onclick = async () => { if (confirm("Excluir o cupom?") && (await tenta(() => api("DELETE", `cupons/${c.id}`)))) { fechar(); render(); } };
  };
  $("#cpNovo").onclick = () => form();
  main.addEventListener("click", (e) => { const b = e.target.closest("[data-cp]"); if (b) form(r.cupons.find((c) => c.id === +b.dataset.cp)); });
};

// ---------- Financeiro ----------
PAGINAS.financeiro = async (main, arg) => {
  const mes = /^\d{4}-\d{2}$/.test(arg) ? arg : hoje().slice(0, 7);
  const r = await api("GET", "financeiro?mes=" + mes);
  const linhaDre = (t, v, cls = "") => `<tr class="${cls}"><td>${t}</td><td class="num">${v < 0 ? "− " + brl(-v) : brl(v)}</td></tr>`;
  const maxD = Math.max(1, ...r.por_dia.map((d) => d.total));
  main.innerHTML = `<div class="ferr"><label for="fMes" style="margin:0">Mês</label><input type="month" id="fMes" value="${mes}" style="max-width:180px"><span class="dir"><button class="b pri" id="fDesp">${ic("mais")}Lançar despesa</button></span></div>
   <div class="kpis"><div class="kpi dest"><span>Faturamento</span><b>${brl(r.receita)}</b><small>${r.pedidos} pedidos · ticket ${brl(r.ticket)}</small></div><div class="kpi"><span>Custo dos produtos</span><b>${brl(r.cmv)}</b></div><div class="kpi"><span>Despesas</span><b>${brl(r.despesas)}</b></div><div class="kpi"><span>Lucro do mês</span><b style="color:${r.lucro < 0 ? "var(--err)" : "var(--ok)"}">${brl(r.lucro)}</b><small>${r.receita ? ((r.lucro / r.receita) * 100).toFixed(1).replace(".", ",") + "% do faturamento" : ""}</small></div></div>
   <div class="col2"><div class="pilha"><section class="cartao"><h3>Resultado do mês (DRE simplificado)</h3><div class="tab-wrap"><table>
    ${linhaDre("Venda de produtos", r.produtos)}${linhaDre("Taxas de entrega recebidas", r.entregas)}${linhaDre("Descontos e cupons", -r.descontos)}${linhaDre("<b>Faturamento</b>", r.receita, "forte")}
    ${linhaDre("Custo dos produtos vendidos", -r.cmv)}${linhaDre(`Taxas de cartão (${String(r.parametros.taxa_cartao).replace(".", ",")}%)`, -r.taxas_cartao)}${linhaDre(`Impostos (${String(r.parametros.imposto).replace(".", ",")}%)`, -r.impostos)}
    ${linhaDre("<b>Margem bruta</b>", r.margem_bruta, "forte")}${linhaDre("Despesas do mês", -r.despesas)}${linhaDre("<b>Lucro</b>", r.lucro, "forte")}</table></div><p class="mute peq">Taxa de cartão e imposto vêm de <a href="#/precificacao">Precificação</a>. O custo vem do cadastro de cada produto.</p></section>
    <section class="cartao"><h3>Vendas por dia</h3>${r.por_dia.length ? `<div style="display:flex;align-items:flex-end;gap:4px;height:160px">${r.por_dia.map((d) => `<div title="${d.dia.slice(8)}/${d.dia.slice(5, 7)}: ${brl(d.total)}" style="flex:1;background:var(--grad);border-radius:6px 6px 2px 2px;height:${Math.max(3, (d.total / maxD) * 100)}%"></div>`).join("")}</div>` : '<p class="mute">Sem vendas neste mês.</p>'}</section></div>
   <div class="pilha"><section class="cartao"><h3>Por forma de pagamento</h3>${r.por_pagamento.map((x) => `<div class="linha" style="padding:6px 0;border-bottom:1px solid var(--line)"><span>${PAG[x.pagamento]}</span><small class="mute">${x.n} pedidos</small><b class="dir">${brl(x.total)}</b></div>`).join("") || '<p class="mute">—</p>'}</section>
    <section class="cartao"><h3>Produtos que mais faturaram</h3>${r.top_produtos.map((x) => `<div class="linha" style="padding:6px 0;border-bottom:1px solid var(--line)"><span>${esc(x.nome)}<br><small class="mute">${qtd(x.q, x.unidade)} · lucro ${brl(x.lucro)}</small></span><b class="dir">${brl(x.total)}</b></div>`).join("") || '<p class="mute">—</p>'}</section>
    <section class="cartao"><h3>Despesas do mês</h3>${r.lista_despesas.map((d) => `<div class="linha" style="padding:6px 0;border-bottom:1px solid var(--line)"><span>${esc(d.descricao)}<br><small class="mute">${esc(d.categoria)} · ${data(d.data + "T15:00:00Z")}${d.pago ? "" : " · a pagar"}</small></span><b class="dir">${brl(d.valor)}</b><button class="b peq leve" data-dd="${d.id}" aria-label="Excluir">✕</button></div>`).join("") || '<p class="mute">Lance aluguel, salários, embalagens, energia… para ver o lucro de verdade.</p>'}</section></div></div>`;
  $("#fMes").onchange = (e) => (location.hash = "#/financeiro/" + e.target.value);
  $("#fDesp").onclick = () => { abrir("Lançar despesa", `<div class="campo"><label for="d1">Descrição</label><input id="d1" placeholder="Aluguel, embalagens, energia…"></div><div class="grade g3"><div class="campo"><label for="d2">Categoria</label><select id="d2">${["Fixas", "Pessoal", "Fornecedores", "Embalagens", "Marketing", "Impostos", "Entrega", "Outras"].map((x) => `<option>${x}</option>`).join("")}</select></div><div class="campo"><label for="d3">Valor</label><div class="pre"><span>R$</span><input id="d3" inputmode="decimal"></div></div><div class="campo"><label for="d4">Data</label><input type="date" id="d4" value="${hoje()}"></div></div><label class="chave"><input type="checkbox" id="d5" checked> Já está pago</label><div class="rodape-gaveta"><button class="b pri" id="dOk">Salvar</button></div>`);
    $("#dOk").onclick = async () => { if (await tenta(() => api("POST", "despesas", { descricao: $("#d1").value, categoria: $("#d2").value, valor: cent($("#d3").value), data: $("#d4").value, pago: $("#d5").checked }), "Despesa lançada")) { fechar(); render(); } }; };
  main.addEventListener("click", async (e) => { const b = e.target.closest("[data-dd]"); if (b && confirm("Excluir a despesa?") && (await tenta(() => api("DELETE", `despesas/${b.dataset.dd}`)))) render(); });
};

// ---------- Precificação ----------
PAGINAS.precificacao = async (main) => {
  const [lj, pr] = await Promise.all([api("GET", "loja"), api("GET", "produtos")]); const l = lj.loja; atualizaLoja(l);
  main.innerHTML = `<div class="col2"><section class="cartao"><h3>Calculadora de preço</h3>
   <div class="grade g2"><div class="campo"><label for="pc1">Custo do produto</label><div class="pre"><span>R$</span><input id="pc1" inputmode="decimal" value="10,00"></div></div><div class="campo"><label for="pc2">Margem de lucro desejada (%)</label><input id="pc2" inputmode="decimal" value="${l.margem_alvo}"></div>
    <div class="campo"><label for="pc3">Taxa do cartão / maquininha (%)</label><input id="pc3" inputmode="decimal" value="${l.taxa_cartao}"></div><div class="campo"><label for="pc4">Impostos sobre a venda (%)</label><input id="pc4" inputmode="decimal" value="${l.imposto}"><small>Simples Nacional: confira a sua faixa com o contador.</small></div>
    <div class="campo"><label for="pc5">Perdas e quebras (%)</label><input id="pc5" inputmode="decimal" value="${l.perda}"><small>Hortifruti costuma perder de 5% a 15%.</small></div></div>
   <div class="kpi dest"><span>Preço sugerido</span><b id="pcRes">—</b><small id="pcExp"></small></div>
   <p style="margin-top:12px"><button class="b pri" id="pcSalvar">Salvar como padrão da loja</button></p></section>
   <section class="cartao"><h3>Produtos abaixo da margem desejada</h3><div id="pcLista"></div></section></div>`;
  const calc = () => { const cu = cent($("#pc1").value) || 0, m = numBR($("#pc2").value) || 0, t = numBR($("#pc3").value) || 0, i = numBR($("#pc4").value) || 0, pe = numBR($("#pc5").value) || 0; const den = 1 - (m + t + i) / 100;
    if (den <= 0.05) { $("#pcRes").textContent = "Impossível"; $("#pcExp").textContent = "A soma de margem, taxa e imposto passa de 95%."; return; }
    const p = Math.ceil((cu * (1 + pe / 100)) / den); $("#pcRes").textContent = brl(p); $("#pcExp").textContent = `Custo com perdas ${brl(Math.round(cu * (1 + pe / 100)))} · sobra de lucro ${brl(Math.round(p * m / 100))} por unidade`; };
  calc(); $$("#pc1,#pc2,#pc3,#pc4,#pc5").forEach((x) => x.addEventListener("input", calc));
  const baixos = pr.produtos.filter((p) => p.ativo && p.margem != null && p.margem < l.margem_alvo);
  $("#pcLista").innerHTML = baixos.length ? baixos.map((p) => `<div class="linha" style="padding:7px 0;border-bottom:1px solid var(--line)"><span>${esc(p.nome)}<br><small class="mute">custo ${brl(p.custo)} · vende ${brl(p.preco_atual)}</small></span><span class="dir chip warn">${String(p.margem).replace(".", ",")}%</span><small>sugerido <b>${brl(sugerido(p.custo, l))}</b></small></div>`).join("") : '<div class="vazio"><b>Tudo certo.</b>Nenhum produto com custo cadastrado está abaixo da margem desejada.</div>';
  $("#pcSalvar").onclick = async () => { const r = await tenta(() => api("PUT", "loja", { margem_alvo: numBR($("#pc2").value), taxa_cartao: numBR($("#pc3").value), imposto: numBR($("#pc4").value), perda: numBR($("#pc5").value) }), "Parâmetros salvos"); if (r) atualizaLoja(r.loja); };
};

// ---------- Entregadores ----------
PAGINAS.entregadores = async (main) => {
  const r = await api("GET", "entregadores"); S.cache.ent = r;
  main.innerHTML = `<div class="ferr"><p class="mute" style="margin:0">Cada entregador recebe um link próprio (sem senha) com os pedidos que você atribuir a ele. Ele marca “saiu” e “entregue” pelo celular, e o pagamento em dinheiro ou cartão é baixado na entrega.</p><button class="b pri dir" id="enNovo">${ic("mais")}Novo entregador</button></div>
   <div class="grade g3">${r.entregadores.map((e) => `<section class="cartao" style="${e.ativo ? "" : "opacity:.5"}"><h3>${ic("entregadores")} ${esc(e.nome)}</h3><p class="mute peq" style="margin:0 0 10px">${e.whatsapp ? esc(e.whatsapp.replace(/^55(\d\d)(\d{4,5})(\d{4})$/, "($1) $2-$3")) : "sem WhatsApp"}${e.ativo ? "" : " · desativado"}</p>
    ${e.ativo ? `<div class="linha"><button class="b peq" data-copiar="${esc(e.link)}">${ic("copiar")}Copiar link</button>${e.whatsapp ? `<a class="b peq zap" target="_blank" rel="noopener" href="${esc(zapLink(e.whatsapp, `Olá, ${e.nome}! Este é o seu link de entregas da ${S.loja ? S.loja.nome : "loja"}: ${e.link}`))}">${ic("zap")}Enviar</a>` : ""}<button class="b peq leve" data-en="${e.id}">Editar</button></div>` : ""}</section>`).join("") || '<div class="cartao vazio"><b>Nenhum entregador.</b>Cadastre quem faz as suas entregas (funcionário, motoboy parceiro ou você mesmo).</div>'}</div>`;
  const form = (e = {}) => { abrir(e.id ? e.nome : "Novo entregador", `<div class="campo"><label for="en1">Nome</label><input id="en1" value="${esc(e.nome || "")}"></div><div class="campo"><label for="en2">WhatsApp</label><input id="en2" inputmode="tel" value="${esc(e.whatsapp || "")}"></div>${e.id ? `<label class="chave"><input type="checkbox" id="en3"> Gerar um link novo (o anterior para de funcionar)</label>` : ""}<div class="rodape-gaveta"><button class="b pri" id="enOk">Salvar</button>${e.id ? `<button class="b perigo" id="enDel">Desativar</button>` : ""}</div>`);
    $("#enOk").onclick = async () => { if (await tenta(() => api(e.id ? "PUT" : "POST", e.id ? `entregadores/${e.id}` : "entregadores", { nome: $("#en1").value, whatsapp: $("#en2").value, novo_link: $("#en3") ? $("#en3").checked : false }), "Entregador salvo")) { fechar(); render(); } };
    if ($("#enDel")) $("#enDel").onclick = async () => { if (await tenta(() => api("DELETE", `entregadores/${e.id}`), "Entregador desativado")) { fechar(); render(); } }; };
  $("#enNovo").onclick = () => form();
  main.addEventListener("click", (ev) => { const b = ev.target.closest("[data-en]"); if (b) form(r.entregadores.find((e) => e.id === +b.dataset.en)); });
};

// ---------- Minha loja ----------
const DIAS = ["Domingo", "Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado"];
const CORES = ["#EA580C", "#DC2626", "#DB2777", "#7C3AED", "#2563EB", "#0891B2", "#0F9F6E", "#65A30D", "#CA8A04", "#1C1410"];
PAGINAS.loja = async (main, arg) => {
  const aba = ["marca", "contato", "horarios", "entrega", "pagamentos", "endereco", "regras"].includes(arg) ? arg : "marca";
  const l = (await api("GET", "loja")).loja; atualizaLoja(l);
  const abas = [["marca", "Marca"], ["contato", "Contato e endereço"], ["horarios", "Horários"], ["entrega", "Entrega e retirada"], ["pagamentos", "Pagamentos"], ["endereco", "Link da loja"], ["regras", "Regras e políticas"]];
  main.innerHTML = `<div class="abas">${abas.map(([k, t]) => `<a href="#/loja/${k}" class="${aba === k ? "ativo" : ""}">${t}</a>`).join("")}</div><form id="fLoja" class="cartao" novalidate></form>`;
  const f = $("#fLoja"), salvar = '<div class="linha" style="margin-top:14px"><button class="b pri" type="submit">Salvar alterações</button></div>';
  const ok = async (b, msg = "Loja atualizada!") => { const r = await tenta(() => api("PUT", "loja", b), msg); if (r) { atualizaLoja(r.loja); render(); } };
  if (aba === "marca") {
    f.innerHTML = `<div class="grade" style="grid-template-columns:160px 1fr;gap:18px;align-items:start"><div><label>Logo</label><div class="foto-up ${l.logo ? "tem" : ""}" id="lgFoto" tabindex="0" role="button" aria-label="Escolher logo" style="${l.logo ? `background-image:url('${esc(l.logo)}');background-size:contain` : ""}"><span>Enviar logo<br><small>quadrada, PNG ou JPG</small></span></div><input type="hidden" id="lgId" value="${l.logo_id || ""}"></div>
     <div><div class="campo"><label for="m1">Nome da loja</label><input id="m1" value="${esc(l.nome)}" maxlength="80"></div><div class="campo"><label for="m2">Frase curta</label><textarea id="m2" maxlength="300" rows="2" placeholder="Ex.: Hortifruti, padaria e mercearia do bairro. Pediu até as 17h, chega hoje.">${esc(l.descricao || "")}</textarea></div>
      <div class="grade g2"><div class="campo"><label for="m3">Tipo de loja</label><select id="m3">${Object.entries(SEG).map(([k, v]) => `<option value="${k}" ${l.segmento === k ? "selected" : ""}>${v}</option>`).join("")}</select></div><div class="campo"><label for="m4">Cor da loja</label><div class="linha"><input type="color" id="m4" value="${esc(l.cor)}">${CORES.map((c) => `<button type="button" data-cor="${c}" aria-label="Cor ${c}" style="width:28px;height:28px;border-radius:50%;border:2px solid #fff;box-shadow:0 0 0 1px var(--line2);background:${c};cursor:pointer"></button>`).join("")}</div></div></div></div></div>
     <label style="margin-top:10px">Capa da loja (banner)</label><div class="foto-up banner-up ${l.banner ? "tem" : ""}" id="bnFoto" tabindex="0" role="button" aria-label="Escolher capa" style="${l.banner ? `background-image:url('${esc(l.banner)}')` : ""}"><span>Enviar foto de capa (horizontal)</span></div><input type="hidden" id="bnId" value="${l.banner_id || ""}">
     <div class="campo" style="margin-top:12px"><label for="m5">Faixa de aviso na loja (opcional)</label><input id="m5" maxlength="160" value="${esc(l.aviso || "")}" placeholder="Ex.: Entrega grátis acima de R$ 100 nesta semana!"></div>${salvar}`;
    campoFoto($("#lgFoto"), $("#lgId"), 600); campoFoto($("#bnFoto"), $("#bnId"), 1800);
    f.addEventListener("click", (e) => { const c = e.target.closest("[data-cor]"); if (c) $("#m4").value = c.dataset.cor; });
    f.onsubmit = (e) => { e.preventDefault(); ok({ nome: $("#m1").value, descricao: $("#m2").value, segmento: $("#m3").value, cor: $("#m4").value, logo_id: $("#lgId").value || null, banner_id: $("#bnId").value || null, aviso: $("#m5").value }); };
  }
  if (aba === "contato") {
    f.innerHTML = `<div class="grade g3"><div class="campo"><label for="c1">WhatsApp da loja</label><input id="c1" inputmode="tel" value="${esc(l.whatsapp || "")}" placeholder="(54) 99999-9999"><small>Os pedidos chegam com mensagem pronta para este número.</small></div><div class="campo"><label for="c2">E-mail</label><input id="c2" type="email" value="${esc(l.email || "")}"></div><div class="campo"><label for="c3">Instagram</label><input id="c3" value="${esc(l.instagram || "")}" placeholder="@sualoja"></div></div>
     <div class="grade g2"><div class="campo"><label for="c4">Endereço (rua e número)</label><input id="c4" value="${esc(l.endereco || "")}"></div><div class="campo"><label for="c5">Bairro</label><input id="c5" value="${esc(l.bairro || "")}"></div></div>
     <div class="grade g3"><div class="campo"><label for="c6">Cidade</label><input id="c6" value="${esc(l.cidade || "")}"><small>A loja só aceita entrega para CEPs desta cidade.</small></div><div class="campo"><label for="c7">UF</label><input id="c7" maxlength="2" value="${esc(l.uf || "")}"></div><div class="campo"><label for="c8">CEP</label><input id="c8" inputmode="numeric" value="${esc(l.cep || "")}"></div></div>${salvar}`;
    f.onsubmit = (e) => { e.preventDefault(); ok({ whatsapp: $("#c1").value, email: $("#c2").value, instagram: $("#c3").value, endereco: $("#c4").value, bairro: $("#c5").value, cidade: $("#c6").value, uf: $("#c7").value, cep: $("#c8").value }); };
  }
  if (aba === "horarios") {
    f.innerHTML = `<label class="chave" style="margin-bottom:14px"><input type="checkbox" id="h0" ${l.aberta ? "checked" : ""}><span>Loja recebendo pedidos<small>Desligue para fechar a loja agora (feriado, falta de entregador…). Os pedidos agendados continuam se o agendamento estiver ligado.</small></span></label>
     ${DIAS.map((d, i) => { const iv = l.horarios[i] || []; return `<div class="dia"><b>${d}</b><label class="chave" style="padding:6px 10px"><input type="checkbox" data-dia="${i}" ${iv.length ? "checked" : ""}> Aberto</label><div class="int">${[0, 1].map((k) => `<input type="time" data-h="${i}-${k}-0" value="${(iv[k] || [])[0] || (k === 0 && !iv.length ? "08:00" : "")}" aria-label="${d} início ${k + 1}"> às <input type="time" data-h="${i}-${k}-1" value="${(iv[k] || [])[1] || (k === 0 && !iv.length ? "18:00" : "")}" aria-label="${d} fim ${k + 1}">${k === 0 ? '<span class="mute peq">e</span>' : ""}`).join("")}</div></div>`; }).join("")}
     <p class="mute peq">Deixe o segundo período em branco se a loja não fecha para o almoço.</p>${salvar}`;
    f.onsubmit = (e) => { e.preventDefault(); const h = {}; for (let i = 0; i < 7; i++) { h[i] = []; if (!$(`[data-dia="${i}"]`).checked) continue; for (const k of [0, 1]) { const a = $(`[data-h="${i}-${k}-0"]`).value, b = $(`[data-h="${i}-${k}-1"]`).value; if (a && b) h[i].push([a, b]); } } ok({ aberta: $("#h0").checked, horarios: h }); };
  }
  if (aba === "entrega") {
    f.innerHTML = `<div class="grade g2"><label class="chave"><input type="checkbox" id="e1" ${l.entrega ? "checked" : ""}><span>Faz entrega</span></label><label class="chave"><input type="checkbox" id="e2" ${l.retirada ? "checked" : ""}><span>Cliente pode retirar na loja</span></label></div>
     <div class="grade g4" style="margin-top:12px"><div class="campo"><label for="e3">Taxa de entrega padrão</label><div class="pre"><span>R$</span><input id="e3" inputmode="decimal" value="${reais(l.taxa_entrega)}"></div></div><div class="campo"><label for="e4">Entrega grátis acima de</label><div class="pre"><span>R$</span><input id="e4" inputmode="decimal" value="${reais(l.frete_gratis_acima)}" placeholder="não tem"></div></div><div class="campo"><label for="e5">Pedido mínimo</label><div class="pre"><span>R$</span><input id="e5" inputmode="decimal" value="${reais(l.pedido_minimo)}"></div></div><div class="campo"><label for="e6">Prazo médio (minutos)</label><input id="e6" inputmode="numeric" value="${l.prazo_min}"></div></div>
     <h3 style="margin:10px 0">Taxa por bairro</h3><p class="mute peq" style="margin-top:-6px">Bairros fora da lista pagam a taxa padrão.</p><div id="zonas"></div><button type="button" class="b peq" id="zAdd">${ic("mais")}Adicionar bairro</button>
     <h3 style="margin:18px 0 10px">Agendamento</h3><label class="chave"><input type="checkbox" id="e7" ${l.agendamento ? "checked" : ""}><span>Cliente pode agendar o dia e o horário da entrega<small>Também permite pedido com a loja fechada, para outro dia.</small></span></label>
     <div class="grade g2" style="margin-top:10px"><div class="campo"><label for="e8">Até quantos dias à frente</label><input id="e8" inputmode="numeric" value="${l.dias_agenda}"></div><div class="campo"><label for="e9">Faixas de horário (uma por linha)</label><textarea id="e9" rows="3" placeholder="08:00-12:00">${esc(l.faixas.join("\n"))}</textarea></div></div>${salvar}`;
    const zonas = [...l.zonas];
    const dz = () => { $("#zonas").innerHTML = zonas.map((z, i) => `<div class="zona"><input value="${esc(z.nome)}" data-zn="${i}" placeholder="Bairro" aria-label="Bairro"><div class="pre"><span>R$</span><input value="${reais(z.taxa)}" data-zt="${i}" inputmode="decimal" aria-label="Taxa"></div><button type="button" class="b peq leve" data-zx="${i}" aria-label="Tirar">✕</button></div>`).join(""); };
    dz(); $("#zAdd").onclick = () => { zonas.push({ nome: "", taxa: l.taxa_entrega }); dz(); };
    f.addEventListener("input", (e) => { if (e.target.dataset.zn) zonas[+e.target.dataset.zn].nome = e.target.value; if (e.target.dataset.zt) zonas[+e.target.dataset.zt].taxa = cent(e.target.value) || 0; });
    f.addEventListener("click", (e) => { const x = e.target.closest("[data-zx]"); if (x) { zonas.splice(+x.dataset.zx, 1); dz(); } });
    f.onsubmit = (e) => { e.preventDefault(); ok({ entrega: $("#e1").checked, retirada: $("#e2").checked, taxa_entrega: cent($("#e3").value) || 0, frete_gratis_acima: cent($("#e4").value), pedido_minimo: cent($("#e5").value) || 0, prazo_min: $("#e6").value, zonas, agendamento: $("#e7").checked, dias_agenda: $("#e8").value, faixas: $("#e9").value.split("\n").map((x) => x.trim().replace(/\s/g, "")).filter(Boolean) }); };
  }
  if (aba === "pagamentos") {
    f.innerHTML = `<div class="grade g2"><label class="chave"><input type="checkbox" id="p1" ${l.aceita_pix ? "checked" : ""}><span>Pix<small>O cliente recebe a sua chave Pix ao fechar o pedido.</small></span></label><label class="chave"><input type="checkbox" id="p2" ${l.aceita_dinheiro ? "checked" : ""}><span>Dinheiro na entrega<small>Com pergunta de troco.</small></span></label><label class="chave"><input type="checkbox" id="p3" ${l.aceita_cartao ? "checked" : ""}><span>Cartão na entrega<small>Maquininha do entregador ou do balcão.</small></span></label><label class="chave"><input type="checkbox" id="p4" ${l.aceita_online ? "checked" : ""} ${l.mp_ok ? "" : "disabled"}><span>Pagamento online (Pix e cartão em até 12x)<small>${l.mp_ok ? "Mercado Pago conectado: " + esc(l.mp_conta || "") : 'Conecte o seu Mercado Pago em <a href="#/integracoes">Integrações</a> (planos Pro e Premium).'}</small></span></label></div>
     <div class="grade g2" style="margin-top:12px"><div class="campo"><label for="p5">Chave Pix</label><input id="p5" value="${esc(l.pix_chave || "")}" placeholder="CNPJ, e-mail, telefone ou chave aleatória"></div><div class="campo"><label for="p6">Nome do titular</label><input id="p6" value="${esc(l.pix_nome || "")}"></div></div>${salvar}`;
    f.onsubmit = (e) => { e.preventDefault(); ok({ aceita_pix: $("#p1").checked, aceita_dinheiro: $("#p2").checked, aceita_cartao: $("#p3").checked, aceita_online: $("#p4").checked, pix_chave: $("#p5").value, pix_nome: $("#p6").value }); };
  }
  if (aba === "endereco") {
    const pub = l.publicada || l.demo;
    f.innerHTML = `${pub ? `<div class="link-loja">${ic("loja")}<a href="${esc(l.link)}" target="_blank" rel="noopener">${esc(l.link.replace("https://", ""))}</a><span class="dir linha"><button type="button" class="b peq" data-copiar="${esc(l.link)}">${ic("copiar")}Copiar</button><a class="b peq zap" target="_blank" rel="noopener" href="${esc(zapLink("", `Conheça a ${l.nome} e faça seu pedido online: ${l.link}`))}">${ic("zap")}Divulgar</a></span></div><p class="mute peq">Coloque esse link na bio do Instagram, no status do WhatsApp e no Google Meu Negócio.</p>` : `<p class="chip warn">A loja ainda não está publicada. Escolha o endereço e publique.</p>`}
     <div class="campo" style="margin-top:14px"><label for="s1">Endereço da loja</label><div class="slug-in"><span>https://</span><input id="s1" value="${esc(l.slug)}" autocomplete="off" spellcheck="false" aria-describedby="s1m"><span>.lldworks.com.br</span></div><small id="s1m">Só letras minúsculas, números e hífen. Ex.: emporio-bom-dia</small></div>
     <div class="linha"><button type="submit" class="b pri">${pub ? "Salvar novo endereço" : "Publicar a loja"}</button><a class="b" href="${esc(l.link_previa)}" target="_blank" rel="noopener">${ic("externo")}Pré-visualizar</a>${pub && !l.demo ? `<button type="button" class="b perigo" id="sDesp">Tirar a loja do ar</button>` : ""}</div>
     ${pub ? `<p class="mute peq" style="margin-top:12px">Atenção: trocar o endereço faz o link antigo parar de funcionar.</p>` : ""}`;
    let t; $("#s1").addEventListener("input", (e) => { const v = e.target.value.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9-]/g, "-").replace(/-+/g, "-"); if (v !== e.target.value) e.target.value = v; clearTimeout(t);
      t = setTimeout(async () => { const r = await api("GET", "endereco?slug=" + encodeURIComponent(v)).catch((x) => ({ livre: false, motivo: x.message })); $("#s1m").innerHTML = r.livre ? `<span style="color:var(--ok);font-weight:700">✓ ${esc(v)}.lldworks.com.br está livre</span>` : `<span style="color:var(--err);font-weight:700">${esc(r.motivo)}</span>`; }, 350); });
    f.onsubmit = async (e) => { e.preventDefault(); const r = await tenta(() => api("POST", "publicar", { slug: $("#s1").value })); if (r) { toast("Loja publicada em " + r.link.replace("https://", ""), "ok"); atualizaLoja(r.loja); render(); if (window.gsap && !calmo) gsap.fromTo(".link-loja", { scale: 0.9 }, { scale: 1, duration: 0.6, ease: "back.out(2)" }); } };
    if ($("#sDesp")) $("#sDesp").onclick = async () => { if (confirm("Tirar a loja do ar? O link para de funcionar até você publicar de novo.") && (await tenta(() => api("POST", "despublicar"), "Loja fora do ar"))) render(); };
  }
  if (aba === "regras") {
    f.innerHTML = `<label class="chave"><input type="checkbox" id="r1" ${l.ocultar_sem_estoque ? "checked" : ""}><span>Esconder produtos esgotados<small>Se desligado, eles aparecem como “esgotado”.</small></span></label>
     <div class="campo" style="margin-top:12px"><label for="r2">Cliente “em risco” depois de quantos dias sem comprar</label><input id="r2" inputmode="numeric" value="${l.dias_inativo}" style="max-width:140px"><small>Usado no CRM e no aviso “clientes para trazer de volta”.</small></div>
     <div class="campo"><label for="r3">Política de trocas, entrega e privacidade (aparece no rodapé da loja)</label><textarea id="r3" rows="7" maxlength="3000">${esc(l.politica || "")}</textarea></div>${salvar}`;
    f.onsubmit = (e) => { e.preventDefault(); ok({ ocultar_sem_estoque: $("#r1").checked, dias_inativo: $("#r2").value, politica: $("#r3").value }); };
  }
};

// ---------- Integrações ----------
const APPS = { agentworks: ["AgentWorks", "Atendimento com IA no WhatsApp", "O robô responde os clientes 24 h, manda o link da loja, tira dúvidas e passa para você quando precisar.", "Na base de conhecimento do robô, cole o link da sua loja e as regras de entrega."],
  linkworks: ["LinkWorks", "Link na bio do Instagram", "Uma página com todos os seus links: loja, WhatsApp, Instagram e promoções, com a sua marca.", "Adicione o link da loja como primeiro botão, com destaque."],
  socialworks: ["SocialWorks", "Instagram no piloto automático", "Calendário de posts, legendas com IA e resposta automática no Direct para quem comenta.", "Programe posts com os produtos em promoção e mande o link da loja no Direct."] };
PAGINAS.integracoes = async (main) => {
  const r = await api("GET", "integracoes"), l = S.loja || (await api("GET", "loja")).loja;
  const cartao = (a) => { const [nome, sub, desc, dica] = APPS[a.slug]; const ok = a.liberada;
    return `<section class="cartao app-c"><img src="https://produtos.lldworks.com.br/logos/${a.slug}-icon.svg" alt="" width="52" height="52"><div><h3 style="margin:0">${nome} <span class="chip ${ok ? "ok" : a.incluido ? "warn" : ""}">${ok ? "Ativo · mesmo login" : a.incluido ? "Incluído no plano" : "Não incluído"}</span></h3><p class="mute" style="margin:4px 0 8px">${sub}</p><p style="margin:0 0 10px">${desc}</p>
     ${ok ? `<p class="peq" style="margin:0 0 10px">💡 ${dica}</p><div class="linha"><a class="b pri" href="${esc(a.url)}" target="_blank" rel="noopener">${ic("externo")}Abrir ${nome}</a><button class="b" data-copiar="${esc(l.link)}">${ic("copiar")}Copiar link da loja</button></div>` : `<a class="b" href="/assinar">Disponível nos planos maiores · trocar de plano</a>`}</div></section>`; };
  main.innerHTML = `<div class="cartao" style="margin-bottom:16px"><div class="linha"><span>Seu plano: <b>${esc(r.plano || "—")}</b></span><span class="mute peq">Os apps incluídos no plano usam o mesmo e-mail e senha do SalesWorks.</span><a class="dir b peq" href="#/plano">Ver plano</a></div></div>
   <div class="grade g2">
    <section class="cartao app-c"><span class="mini" style="width:52px;height:52px;background:#009EE3;color:#fff;font-weight:900;border-radius:14px">MP</span><div><h3 style="margin:0">Mercado Pago <span class="chip ${r.mercadopago.ok ? "ok" : ""}">${r.mercadopago.ok ? "Conectado" : "Não conectado"}</span></h3><p class="mute" style="margin:4px 0 8px">Pix e cartão em até 12x direto na sua conta</p>
     ${!r.mercadopago.liberado ? `<p>Receba online pela sua própria conta do Mercado Pago. Faz parte dos planos Pro e Premium.</p><a class="b" href="/assinar">Trocar de plano</a>` : r.mercadopago.ok ? `<p>Conta: <b>${esc(r.mercadopago.conta || "")}</b>. Os pedidos pagos online ficam marcados como pagos sozinhos.</p><p class="peq mute">Aviso de pagamento: ${esc(r.webhook)} (o SalesWorks já informa esse endereço em cada cobrança).</p><button class="b perigo" id="mpSai">Desconectar</button>` :
      `<ol class="peq" style="padding-left:18px;margin:0 0 10px"><li>Entre em <b>mercadopago.com.br/developers/panel</b> com a conta da loja e crie uma aplicação (Checkout Pro).</li><li>Abra <b>Credenciais de produção</b> e copie o <b>Access Token</b> (começa com APP_USR-).</li><li>Cole abaixo. O token fica cifrado e nunca aparece de novo.</li></ol><div class="linha"><input id="mpTk" placeholder="APP_USR-…" autocomplete="off" style="flex:1"><button class="b pri" id="mpOk">Conectar</button></div>`}</div></section>
    ${r.apps.map(cartao).join("")}
    <section class="cartao app-c"><span class="mini" style="width:52px;height:52px;background:#2563EB;color:#fff;font-weight:900;border-radius:14px">WEB</span><div><h3 style="margin:0">Site sob medida <span class="chip ${r.site ? "ok" : ""}">${r.site ? "Incluído no Premium" : "Plano Premium"}</span></h3><p class="mute" style="margin:4px 0 8px">Site institucional da sua marca, ligado à loja</p><div id="siteBox">${r.site ? '<p class="mute">Carregando…</p>' : '<p>No Premium a LLD Works cria um site completo para a sua marca em até 5 dias úteis.</p><a class="b" href="/assinar">Trocar de plano</a>'}</div></div></section>
   </div>`;
  if ($("#mpOk")) $("#mpOk").onclick = async () => { if (await tenta(() => api("PUT", "mercadopago", { token: $("#mpTk").value }), "Mercado Pago conectado!")) render(); };
  if ($("#mpSai")) $("#mpSai").onclick = async () => { if (confirm("Desconectar o Mercado Pago? O pagamento online sai da loja.") && (await tenta(() => api("DELETE", "mercadopago"), "Desconectado"))) render(); };
  if (r.site) {
    const s = await api("GET", "site").catch(() => ({}));
    const st = s.site;
    $("#siteBox").innerHTML = st ? `<p>Pedido <b>${{ solicitado: "recebido", em_criacao: "em criação", publicado: "publicado", cancelado: "cancelado" }[st.status] || st.status}</b>${st.prazo ? ` · prazo ${data(st.prazo + "T15:00:00Z")}` : ""}.${st.url ? ` <a href="${esc(st.url)}" target="_blank" rel="noopener">Abrir o site ↗</a>` : ""}</p>` :
      `<div class="campo"><label for="st1">O que o site precisa mostrar?</label><textarea id="st1" rows="3" placeholder="História da loja, diferenciais, fotos do espaço, horários, como chegar…"></textarea></div><div class="campo"><label for="st2">Sites que você gosta (referências)</label><input id="st2"></div><div class="campo"><label for="st3">Domínio próprio (se já tiver)</label><input id="st3" placeholder="www.sualoja.com.br"></div><button class="b pri" id="stOk">Pedir meu site</button>`;
    if ($("#stOk")) $("#stOk").onclick = async () => { if (await tenta(() => api("POST", "site", { objetivo: $("#st1").value, referencias: $("#st2").value, dominio: $("#st3").value }), "Pedido enviado! Prazo de 5 dias úteis.")) render(); };
  }
};

// ---------- Plano e conta ----------
PAGINAS.plano = async (main) => {
  const r = await api("GET", "integracoes"), lim = r.limites || {};
  const st = { ativa: ["Ativa", "ok"], cortesia: ["Cortesia", "ok"], teste: ["Período de teste", "warn"], pendente: ["Aguardando pagamento", "warn"], inadimplente: ["Pagamento em atraso", "err"] }[r.status] || [r.status || "—", ""];
  main.innerHTML = `<div class="col2"><section class="cartao"><h3>Seu plano</h3><p style="font:900 28px Montserrat;margin:0">${esc(r.plano || "—")}</p><p><span class="chip ${st[1]}">${st[0]}</span>${r.vence_em ? ` <span class="mute">válido até ${data(r.vence_em + "T15:00:00Z")}</span>` : ""}</p>
    <ul style="padding-left:18px"><li>Até <b>${lim.produtos || 300}</b> produtos ativos</li><li>Loja online, pedidos, separação, entregadores, estoque, CRM, cupons e financeiro</li>${lim.pagamento_online ? "<li>Pagamento online pela sua conta do Mercado Pago</li>" : ""}${Object.keys(lim.inclui || {}).map((k) => `<li>${APPS[k] ? APPS[k][0] : k} incluído, com o mesmo login</li>`).join("")}${lim.site ? "<li>Site sob medida feito pela LLD Works</li>" : ""}</ul>
    <div class="linha"><a class="b pri" href="/assinar">Pagar ou trocar de plano</a><a class="b" href="https://salesworks.lldworks.com.br/#planos" target="_blank" rel="noopener">Comparar planos</a></div></section>
   <section class="cartao"><h3>Sua conta</h3><p class="mute">O e-mail e a senha são os mesmos do cadastro na LLD Works.</p><div class="linha"><a class="b" href="/recuperar">Trocar a senha</a><a class="b" href="/api/admin/backup" download>Baixar backup (JSON)</a><a class="b perigo" href="/sair">Sair</a></div>
    <p class="mute peq" style="margin-top:14px">Precisa de ajuda? Fale com a LLD Works: <a href="mailto:lucasldiogo@lldworks.com.br">lucasldiogo@lldworks.com.br</a>.</p></section></div>`;
};
PAGINAS.ajuda = async (main) => {
  const passos = [["1. Cadastre os produtos", "Em Produtos, use “Novo produto” ou importe a planilha. Para frutas e frios, escolha venda por kg com mínimo de 0,5 e passo de 0,25."], ["2. Configure entrega e pagamento", "Em Minha loja → Entrega e Pagamentos: taxa, bairros, pedido mínimo, Pix, dinheiro, cartão e Mercado Pago."], ["3. Publique a loja", "Em Minha loja → Link da loja, escolha o endereço (ex.: emporio-bom-dia.lldworks.com.br) e publique."], ["4. Receba os pedidos", "O pedido aparece em Pedidos com aviso sonoro. Confirme, separe, chame o entregador e marque como entregue. O cliente acompanha tudo pelo link."], ["5. Venda de novo", "No CRM, filtre “Em risco” e mande a mensagem pronta com um cupom. Acompanhe o lucro em Financeiro."]];
  main.innerHTML = `<div class="grade g2">${passos.map(([t, d]) => `<section class="cartao"><h3>${t}</h3><p style="margin:0">${d}</p></section>`).join("")}<section class="cartao"><h3>Atalhos</h3><p style="margin:0">Botão <b>Novo pedido</b> no topo lança vendas do balcão, do telefone ou do WhatsApp. O sino mostra quantos pedidos novos estão esperando.</p></section></div>`;
};

// ---------- início ----------
(async () => {
  S.demo = !!document.querySelector('[role="note"]');
  montarMenu();
  try { const r = await api("GET", "loja"); atualizaLoja(r.loja); } catch (e) { if (e.status !== 401) toast(e.message, "err"); }
  api("GET", "integracoes").then((r) => { $("#planoMini").textContent = r.plano ? `Plano ${r.plano}` : "Plano"; }).catch(() => {});
  await render();
  vigia(); setInterval(vigia, 20000);
})();
})();
