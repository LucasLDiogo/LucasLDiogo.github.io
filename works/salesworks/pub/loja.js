// SalesWorks v2 — vitrine da loja (<loja>.lldworks.com.br) e acompanhamento do pedido (/pedido/<código>).
(() => {
"use strict";
const $ = (s, r = document) => r.querySelector(s), $$ = (s, r = document) => [...r.querySelectorAll(s)];
const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const brl = (c) => ((c || 0) / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
const fq = (q, u) => `${String(+(+q).toFixed(3)).replace(".", ",")} ${u}`;
const calmo = matchMedia("(prefers-reduced-motion: reduce)").matches;
const host = location.hostname.split(".")[0];
const params = new URLSearchParams(location.search);
const SLUG = (params.get("loja") && /^(localhost|127\.)/.test(location.hostname)) ? params.get("loja") : host;
const API = `/api/publico/${SLUG}`;
const PREVIA = params.get("previa") || "";
const store = { get(k, d) { try { return JSON.parse(localStorage.getItem(`sw:${SLUG}:${k}`)) ?? d; } catch { return d; } }, set(k, v) { try { localStorage.setItem(`sw:${SLUG}:${k}`, JSON.stringify(v)); } catch {} } };
const DIAS = ["domingo", "segunda", "terça", "quarta", "quinta", "sexta", "sábado"];
const EMOJI = { hortifruti: "🥬", mercado: "🛒", padaria: "🥖", acougue: "🥩", bebidas: "🥤", moda: "👗", cosmeticos: "💄", petshop: "🐾", farmacia: "💊", presentes: "🎁", eletronicos: "🎧", outro: "🛍️" };
const I = { mais: '<path d="M12 5v14M5 12h14"/>', zap: '<path d="M3 21l1.6-4.8A8.5 8.5 0 1 1 8 19.6z"/>', insta: '<rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.5" cy="6.5" r=".6"/>', info: '<circle cx="12" cy="12" r="9"/><path d="M12 11v6M12 7.5h.01"/>', share: '<circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><path d="M8.6 13.5l6.8 4M15.4 6.5l-6.8 4"/>', busca: '<circle cx="11" cy="11" r="7"/><path d="M21 21l-4.3-4.3"/>', moto: '<circle cx="6" cy="17" r="3"/><circle cx="18" cy="17" r="3"/><path d="M9 17h6l-2-7H9M13 10h3l2 7"/>', relogio: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>', sacola: '<path d="M6 8h12l-1 12H7z"/><path d="M9 8V6a3 3 0 0 1 6 0v2"/>', check: '<path d="M5 12l5 5L20 7"/>' };
const ic = (n) => `<svg viewBox="0 0 24 24" aria-hidden="true">${I[n]}</svg>`;
let L = null, PRODS = [], CATS = [], car = store.get("car", {}), cupom = null, evCarrinho = false;
const toast = (m, t = "") => { const d = document.createElement("div"); d.className = "toast " + t; d.textContent = m; $("#toasts").append(d); setTimeout(() => d.remove(), 4500); };
async function api(m, p, b) {
  const r = await fetch(API + p + (PREVIA && m === "GET" && !p ? `?previa=${encodeURIComponent(PREVIA)}` : ""), { method: m, headers: b ? { "content-type": "application/json" } : {}, body: b ? JSON.stringify(b) : undefined });
  const j = await r.json().catch(() => ({}));
  if (!r.ok) { const e = new Error(j.erro || "Não deu certo. Tente de novo."); e.j = j; e.status = r.status; throw e; }
  return j;
}
const evento = (t) => fetch(API + "/evento", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ t }) }).catch(() => {});
function tema(cor) {
  document.documentElement.style.setProperty("--c", cor);
  const m = document.querySelector('meta[name="theme-color"]'); if (m) m.content = cor;
}

// ---------- gaveta ----------
let pilha = [];
function gaveta(tit, corpo, rod = "", voltar = null) {
  $("#gTit").textContent = tit; $("#gCorpo").innerHTML = corpo; $("#gRod").innerHTML = rod; $("#gaveta").hidden = false; document.body.style.overflow = "hidden";
  $("#gVolta").hidden = !voltar; $("#gVolta").onclick = voltar; $("#gCorpo").scrollTop = 0;
  setTimeout(() => { const f = $("#gCorpo input:not(.hp input),#gCorpo button,#gRod button"); (f || $(".x")).focus({ preventScroll: true }); }, 50);
}
function fecharG() { $("#gaveta").hidden = true; document.body.style.overflow = ""; }
document.addEventListener("click", (e) => { if (e.target.closest("[data-fechar]")) fecharG(); });
document.addEventListener("keydown", (e) => { if (e.key === "Escape" && !$("#gaveta").hidden) fecharG(); });

// ---------- carrinho ----------
const P = (id) => PRODS.find((p) => p.id === +id);
const unit = (p, q) => (p.at && q >= p.at.q && p.at.p < p.p ? p.at.p : p.p);
const itensCar = () => Object.entries(car).map(([id, x]) => ({ p: P(id), q: x.q, obs: x.obs })).filter((x) => x.p && !x.p.esg);
const subtotal = () => itensCar().reduce((s, x) => s + Math.round(unit(x.p, x.q) * x.q), 0);
function mudaQ(id, delta, abs) {
  const p = P(id); if (!p) return;
  let q = abs != null ? abs : (car[id]?.q || 0) + delta * p.passo;
  q = +q.toFixed(3);
  if (q > 0 && q < p.min) q = delta > 0 ? p.min : 0;
  if (p.max != null && q > p.max) { q = p.max; toast(`Temos só ${fq(p.max, p.u)} de ${p.n}.`); }
  if (q <= 0) delete car[id]; else car[id] = { q, obs: car[id]?.obs || "" };
  store.set("car", car);
  if (!evCarrinho && q > 0) { evCarrinho = true; evento("c"); }
  desenhaBotoes(id); barraCar();
}
function desenhaBotoes(id) {
  $$(`[data-pd="${id}"] .ctrl`).forEach((el) => {
    const q = car[id]?.q, p = P(id);
    el.innerHTML = p.esg ? "" : q ? `<div class="qtd-in"><button type="button" data-menos="${id}" aria-label="Diminuir">−</button><span>${fq(q, p.u)}</span><button type="button" data-mais="${id}" aria-label="Aumentar">+</button></div>` : `<button type="button" class="add" data-mais="${id}" aria-label="Adicionar ${esc(p.n)}">${ic("mais")}</button>`;
  });
}
function barraCar() {
  let b = $("#carr");
  const its = itensCar();
  if (!its.length) { if (b) b.remove(); return; }
  if (!b) { b = document.createElement("button"); b.id = "carr"; b.className = "carr"; b.type = "button"; b.onclick = abrirCarrinho; document.body.append(b); if (window.gsap && !calmo) gsap.from(b, { y: 80, opacity: 0, duration: 0.5, ease: "back.out(1.6)" }); }
  b.innerHTML = `<span class="n">${its.length}</span><span>Ver carrinho</span><b>${brl(subtotal())}</b>`;
  if (window.gsap && !calmo) gsap.fromTo(b, { scale: 0.96 }, { scale: 1, duration: 0.3, ease: "back.out(3)" });
}
document.addEventListener("click", (e) => {
  const m = e.target.closest("[data-mais]"), n = e.target.closest("[data-menos]");
  if (m) { e.stopPropagation(); mudaQ(m.dataset.mais, 1); return; }
  if (n) { e.stopPropagation(); mudaQ(n.dataset.menos, -1); return; }
  const c = e.target.closest("[data-pd]"); if (c && !e.target.closest("button")) detalhe(+c.dataset.pd);
});
document.addEventListener("keydown", (e) => { const c = e.target.closest && e.target.closest("[data-pd]"); if (c && e.key === "Enter" && e.target === c) detalhe(+c.dataset.pd); });

function cartao(p) {
  const pct = p.de ? Math.round((1 - p.p / p.de) * 100) : 0;
  return `<article class="pd ${p.esg ? "esg" : ""}" data-pd="${p.id}" tabindex="0" aria-label="${esc(p.n)}, ${brl(p.p)} por ${esc(p.u)}">${pct ? `<span class="selo">−${pct}%</span>` : p.dq ? `<span class="selo dq">Destaque</span>` : ""}
   <div class="ft" style="position:relative">${p.f ? `<img src="${esc(p.f)}" alt="" loading="lazy" width="400" height="400">` : EMOJI[L.segmento] || "🛍️"}</div>
   <div class="tx"><span class="nm">${esc(p.n)}</span>${p.d ? `<span class="ds">${esc(p.d)}</span>` : ""}<span class="pr"><b>${brl(p.p)}</b>${p.de ? `<s>${brl(p.de)}</s>` : ""}<small>/${esc(p.u)}</small></span></div><div class="ctrl"></div></article>`;
}
function detalhe(id) {
  const p = P(id); if (!p) return;
  let q = car[id]?.q || p.min;
  const corpo = () => `<div class="det-ft">${p.f ? `<img src="${esc(p.f)}" alt="${esc(p.n)}">` : EMOJI[L.segmento] || "🛍️"}</div><h2 style="font-size:22px">${esc(p.n)}</h2>${p.d ? `<p style="color:var(--mute)">${esc(p.d)}</p>` : ""}
   <p style="font:900 24px Montserrat;margin:8px 0 0">${brl(unit(p, q))} <small style="font:600 14px Inter;color:var(--mute)">/${esc(p.u)}</small> ${p.de ? `<s style="font:600 15px Inter;color:var(--mute)">${brl(p.de)}</s>` : ""}</p>
   ${p.at ? `<p class="dica">Atacado: a partir de ${fq(p.at.q, p.u)} sai por ${brl(p.at.p)}/${esc(p.u)}.</p>` : ""}${p.u === "kg" ? `<p class="dica">Produto pesado na hora: o valor pode variar um pouco na entrega.</p>` : ""}
   ${p.esg ? `<p class="alerta">Esgotado no momento.</p>` : `<div class="passo-q"><button type="button" id="dMenos" aria-label="Diminuir">−</button><b id="dQ">${fq(q, p.u)}</b><button type="button" id="dMais" aria-label="Aumentar">+</button><span class="dica" style="margin-left:auto">${p.max != null ? `${fq(p.max, p.u)} disponíveis` : ""}</span></div>
   <div class="campo"><label for="dObs">Alguma observação?</label><input id="dObs" maxlength="120" placeholder="Ex.: bananas mais verdes" value="${esc(car[id]?.obs || "")}"></div>`}`;
  gaveta("Detalhes do produto", corpo(), p.esg ? "" : `<button class="b pri" id="dAdd">Adicionar · <span id="dTot">${brl(Math.round(unit(p, q) * q))}</span></button>`);
  if (p.esg) return;
  const at = () => { $("#dQ").textContent = fq(q, p.u); $("#dTot").textContent = brl(Math.round(unit(p, q) * q)); };
  $("#dMais").onclick = () => { if (p.max == null || q + p.passo <= p.max + 1e-9) { q = +(q + p.passo).toFixed(3); at(); } };
  $("#dMenos").onclick = () => { if (q - p.passo >= p.min - 1e-9) { q = +(q - p.passo).toFixed(3); at(); } };
  $("#dAdd").onclick = () => { mudaQ(id, 0, q); if (car[id]) { car[id].obs = $("#dObs").value.slice(0, 120); store.set("car", car); } fecharG(); toast(`${p.n} no carrinho.`); };
}

// ---------- vitrine ----------
function horarioTexto() {
  if (L.aberta) { const h = (L.horarios[new Date().getDay()] || []).find(([a, b]) => true); return h ? `Aberta agora` : "Aberta agora"; }
  if (L.fechada_manual) return "Fechada no momento";
  if (L.proxima) return `Fechada · abre ${L.proxima.hoje ? "hoje" : L.proxima.amanha ? "amanhã" : DIAS[L.proxima.dia]} às ${L.proxima.hora}`;
  return "Fechada agora";
}
function vitrine(d) {
  L = d.loja; PRODS = d.produtos; CATS = d.categorias; tema(L.cor);
  document.title = `${L.nome} · Peça online`;
  const desc = document.querySelector('meta[name="description"]'); if (desc) desc.content = L.descricao || `Faça seu pedido na ${L.nome}.`;
  const man = document.createElement("link"); man.rel = "manifest"; man.href = API + "/manifest"; document.head.append(man);
  for (const id of Object.keys(car)) if (!P(id)) delete car[id];
  const promos = PRODS.filter((p) => p.de && !p.esg), dest = PRODS.filter((p) => p.dq && !p.esg);
  const semCat = PRODS.filter((p) => !CATS.find((c) => c.id === p.c));
  const secoes = [...CATS.map((c) => ({ id: "c" + c.id, nome: `${c.emoji ? c.emoji + " " : ""}${c.nome}`, ps: PRODS.filter((p) => p.c === c.id) })), ...(semCat.length ? [{ id: "outros", nome: "Outros", ps: semCat }] : [])];
  const infos = [L.entrega ? `${ic("moto")}Entrega ${L.taxa_entrega ? brl(L.taxa_entrega) : "grátis"}` : "", L.entrega ? `${ic("relogio")}~${L.prazo_min} min` : "", L.retirada ? `${ic("sacola")}Retirada na loja` : "", L.pedido_minimo ? `Mínimo ${brl(L.pedido_minimo)}` : "", L.frete_gratis_acima ? `Entrega grátis acima de ${brl(L.frete_gratis_acima)}` : ""].filter(Boolean);
  $("#app").innerHTML = `${L.demo ? `<div class="faixa-demo">Loja de demonstração do SalesWorks: navegue e monte o carrinho à vontade; o pedido não é enviado. <a href="https://salesworks.lldworks.com.br" target="_blank" rel="noopener">Quero uma loja assim →</a></div>` : ""}${d.previa ? `<div class="faixa-demo">Pré-visualização: só você vê. Publique a loja no painel para receber pedidos.</div>` : ""}${L.aviso ? `<div class="faixa-aviso">${esc(L.aviso)}</div>` : ""}
   <div class="capa">${L.banner ? `<img src="${esc(L.banner)}" alt="" fetchpriority="high">` : ""}</div>
   <div class="wrap"><header class="topo"><div class="cab"><div class="logo">${L.logo ? `<img src="${esc(L.logo)}" alt="Logo ${esc(L.nome)}">` : esc(L.nome[0])}</div>
    <div><h1>${esc(L.nome)}</h1>${L.descricao ? `<p>${esc(L.descricao)}</p>` : ""}<span class="estado ${L.aberta ? "ab" : "fe"}"><i></i>${horarioTexto()}</span></div>
    <div class="acoes">${L.whatsapp ? `<a class="ic-b" href="https://wa.me/${esc(L.whatsapp)}?text=${encodeURIComponent(`Olá, ${L.nome}! Vim pela loja online.`)}" target="_blank" rel="noopener" aria-label="WhatsApp da loja">${ic("zap")}</a>` : ""}${L.instagram ? `<a class="ic-b" href="https://instagram.com/${esc(L.instagram)}" target="_blank" rel="noopener" aria-label="Instagram da loja">${ic("insta")}</a>` : ""}<button class="ic-b" type="button" id="btInfo" aria-label="Informações da loja">${ic("info")}</button><button class="ic-b" type="button" id="btShare" aria-label="Compartilhar a loja">${ic("share")}</button></div></div>
    <div class="infos">${infos.map((x) => `<span>${x}</span>`).join("")}</div>
    ${!L.aberta ? `<p class="alerta" style="margin-top:12px">${L.agendamento ? "A loja está fechada agora, mas você pode montar o pedido e agendar a entrega." : "A loja está fechada agora. Você pode montar o carrinho e enviar quando abrir."}</p>` : ""}</header>
   <div class="barra" id="barra"><div class="busca">${ic("busca")}<input type="search" id="busca" placeholder="Buscar em ${esc(L.nome)}" aria-label="Buscar produto"></div><nav class="cats" id="cats" aria-label="Categorias">${secoes.map((s) => `<a href="#${s.id}">${esc(s.nome)}</a>`).join("")}</nav></div>
   <div id="lista">
    ${promos.length ? `<section class="secao"><h2>🔥 Ofertas <small>${promos.length} produto(s)</small></h2><div class="carrossel">${promos.map(cartao).join("")}</div></section>` : ""}
    ${dest.length && dest.length < PRODS.length ? `<section class="secao"><h2>⭐ Destaques</h2><div class="carrossel">${dest.map(cartao).join("")}</div></section>` : ""}
    ${secoes.map((s) => `<section class="secao" id="${s.id}"><h2>${esc(s.nome)} <small>${s.ps.length}</small></h2><div class="grade">${s.ps.map(cartao).join("")}</div></section>`).join("")}
    ${!PRODS.length ? `<div class="vazio">Os produtos aparecem aqui em breve.</div>` : ""}</div>
   <div id="resultado" hidden></div>
   <footer class="rod"><b style="color:var(--ink)">${esc(L.nome)}</b>${[L.endereco, L.bairro, L.cidade && `${L.cidade}${L.uf ? "/" + L.uf : ""}`].filter(Boolean).map(esc).join(" · ")}<span>${L.politica ? `<a href="#" id="btPol">Trocas, entregas e privacidade</a> · ` : ""}<a href="#" id="btHor">Horários</a></span><a class="sw" href="https://salesworks.lldworks.com.br" target="_blank" rel="noopener"><img src="/pub/icone.svg" alt="" width="18" height="18">Loja criada com SalesWorks · LLD Works</a></footer></div>`;
  PRODS.forEach((p) => desenhaBotoes(p.id)); barraCar();
  // busca
  $("#busca").oninput = (e) => {
    const s = e.target.value.trim().toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
    $("#lista").hidden = !!s; $("#resultado").hidden = !s;
    if (s) { const r = PRODS.filter((p) => (p.n + " " + (p.d || "")).toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").includes(s)); $("#resultado").innerHTML = `<section class="secao"><h2>Resultado <small>${r.length}</small></h2>${r.length ? `<div class="grade">${r.map(cartao).join("")}</div>` : `<div class="vazio">Nada encontrado. Que tal perguntar no WhatsApp da loja?</div>`}</section>`; r.forEach((p) => desenhaBotoes(p.id)); }
  };
  // categoria ativa
  const links = $$("#cats a"), io = new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting) { links.forEach((a) => a.classList.toggle("ativo", a.getAttribute("href") === "#" + e.target.id)); const a = links.find((x) => x.classList.contains("ativo")); if (a) a.scrollIntoView({ block: "nearest", inline: "center", behavior: calmo ? "auto" : "smooth" }); } }), { rootMargin: "-40% 0px -55% 0px" });
  secoes.forEach((s) => { const el = document.getElementById(s.id); if (el) io.observe(el); });
  addEventListener("scroll", () => $("#barra").classList.toggle("rolou", scrollY > 300), { passive: true });
  $("#btInfo").onclick = info; $("#btHor").onclick = (e) => { e.preventDefault(); info(); };
  if ($("#btPol")) $("#btPol").onclick = (e) => { e.preventDefault(); gaveta("Trocas, entregas e privacidade", `<div style="white-space:pre-wrap">${esc(L.politica)}</div>`); };
  $("#btShare").onclick = () => { const u = `https://${L.slug}.lldworks.com.br`; if (navigator.share) navigator.share({ title: L.nome, text: `Peça online na ${L.nome}`, url: u }).catch(() => {}); else { navigator.clipboard?.writeText(u); toast("Link da loja copiado!"); } };
  try { if (!sessionStorage.getItem("sw-v-" + SLUG)) { sessionStorage.setItem("sw-v-" + SLUG, "1"); if (!d.previa) evento("v"); } } catch {}
  if (window.gsap && !calmo) {
    gsap.from(".capa img", { scale: 1.12, duration: 1.4, ease: "power2.out" });
    gsap.from(".cab", { y: 30, opacity: 0, duration: 0.7, ease: "power3.out" });
    gsap.from(".infos span", { y: 10, opacity: 0, duration: 0.4, stagger: 0.04, delay: 0.25 });
    const pds = $$(".pd"); const vis = new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting) { gsap.fromTo(e.target, { y: 24, opacity: 0 }, { y: 0, opacity: 1, duration: 0.5, ease: "power2.out" }); vis.unobserve(e.target); } }), { rootMargin: "0px 0px -8% 0px" });
    pds.forEach((p) => vis.observe(p));
  }
  if (location.hash === "#carrinho" && itensCar().length) abrirCarrinho();
}
function info() {
  const linhas = DIAS.map((d, i) => { const h = L.horarios[i] || []; return `<p style="display:flex;justify-content:space-between;margin:0;padding:7px 0;border-bottom:1px solid var(--line)${new Date().getDay() === i ? ";font-weight:800" : ""}"><span style="text-transform:capitalize">${d}</span><span>${h.length ? h.map(([a, b]) => `${a}–${b}`).join(" · ") : "Fechado"}</span></p>`; }).join("");
  gaveta(L.nome, `${L.descricao ? `<p>${esc(L.descricao)}</p>` : ""}<h3 style="margin:14px 0 6px">Horário de funcionamento</h3>${Object.values(L.horarios).some((x) => x && x.length) ? linhas : "<p>Consulte a loja.</p>"}
   ${L.endereco || L.cidade ? `<h3 style="margin:16px 0 6px">Endereço</h3><p>${esc([L.endereco, L.bairro, L.cidade, L.uf].filter(Boolean).join(", "))}<br><a href="https://www.google.com/maps/search/?api=1&query=${encodeURIComponent([L.nome, L.endereco, L.cidade].filter(Boolean).join(", "))}" target="_blank" rel="noopener">Como chegar ↗</a></p>` : ""}
   <h3 style="margin:16px 0 6px">Entrega e pagamento</h3><p>${L.entrega ? `Entrega a partir de ${L.taxa_entrega ? brl(L.taxa_entrega) : "grátis"}${L.zonas.length ? " (varia por bairro)" : ""}, em cerca de ${L.prazo_min} min.` : "Não faz entrega."} ${L.retirada ? "Retirada na loja." : ""}</p>
   <p>Pagamento: ${[L.pagamentos.pix && "Pix", L.pagamentos.dinheiro && "dinheiro", L.pagamentos.cartao && "cartão na entrega", L.pagamentos.online && "online (Pix ou cartão em até 12x)"].filter(Boolean).join(", ")}.</p>`);
}

// ---------- carrinho e checkout ----------
const C = { passo: 0, tipo: null, end: store.get("end", {}), dados: store.get("dados", {}), pagamento: null, troco: "", obs: "", agenda: "", taxa: null, cepInfo: null };
function totais() {
  const sub = subtotal(); let taxa = 0;
  if (C.tipo === "entrega") { taxa = C.taxa != null ? C.taxa : L.taxa_entrega; if (L.frete_gratis_acima && sub >= L.frete_gratis_acima) taxa = 0; }
  let desc = 0; if (cupom) { if (cupom.frete_gratis) taxa = 0; desc = Math.min(sub, cupom.desconto || 0); }
  return { sub, taxa, desc, total: Math.max(0, sub - desc + taxa) };
}
function boxTotais() {
  const t = totais();
  return `<div class="totais"><p><span>Produtos</span><span>${brl(t.sub)}</span></p>${t.desc ? `<p style="color:var(--ok)"><span>Cupom ${esc(cupom.codigo)}</span><span>− ${brl(t.desc)}</span></p>` : ""}${C.tipo === "entrega" ? `<p><span>Entrega</span><span>${t.taxa ? brl(t.taxa) : "Grátis"}</span></p>` : ""}<p class="g"><span>Total</span><span>${brl(t.total)}</span></p></div>`;
}
function abrirCarrinho() {
  C.passo = 0;
  const its = itensCar();
  if (!its.length) return gaveta("Seu carrinho", `<div class="vazio">O carrinho está vazio.</div>`, `<button class="b" data-fechar>Continuar comprando</button>`);
  const sub = subtotal(), falta = Math.max(0, (L.pedido_minimo || 0) - sub), fg = L.frete_gratis_acima;
  gaveta("Seu carrinho", `${its.map(({ p, q, obs }) => `<div class="it">${p.f ? `<img src="${esc(p.f)}" alt="">` : `<span class="em">${EMOJI[L.segmento] || "🛍️"}</span>`}<div><span class="nm">${esc(p.n)}</span><br><small>${brl(unit(p, q))}/${esc(p.u)}${obs ? " · " + esc(obs) : ""}</small><div class="mini-q" style="margin-top:6px;width:max-content"><button type="button" data-cm="${p.id}" aria-label="Diminuir">−</button><span>${fq(q, p.u)}</span><button type="button" data-cp="${p.id}" aria-label="Aumentar">+</button></div></div><b>${brl(Math.round(unit(p, q) * q))}</b></div>`).join("")}
   ${falta ? `<p class="alerta" style="margin-top:12px">Faltam ${brl(falta)} para o pedido mínimo de ${brl(L.pedido_minimo)}.</p>` : ""}
   ${fg && L.entrega ? (sub >= fg ? `<p class="dica" style="margin-top:12px;color:var(--ok);font-weight:700">🎉 Você ganhou entrega grátis!</p>` : `<p class="dica" style="margin-top:12px">Faltam <b>${brl(fg - sub)}</b> para entrega grátis.</p><div class="prog"><i style="width:${Math.min(100, (sub / fg) * 100)}%"></i></div>`) : ""}
   <div class="campo" style="margin-top:14px"><label for="cupomIn">Cupom de desconto</label><div class="cupom"><input id="cupomIn" placeholder="Digite o código" value="${esc(cupom ? cupom.codigo : "")}" autocapitalize="characters"><button type="button" id="cupomOk">Aplicar</button></div><p class="dica" id="cupomMsg">${cupom ? esc(cupom.msg) : ""}</p></div>${boxTotais()}`,
   `<button class="b pri" id="irCheckout" ${falta ? "disabled" : ""}>Continuar</button><button class="b" data-fechar>Continuar comprando</button>`);
  $("#gCorpo").onclick = (e) => { const m = e.target.closest("[data-cm]"), p = e.target.closest("[data-cp]"); if (m) { mudaQ(m.dataset.cm, -1); abrirCarrinho(); } if (p) { mudaQ(p.dataset.cp, 1); abrirCarrinho(); } };
  $("#cupomOk").onclick = async () => { const cod = $("#cupomIn").value.trim(); if (!cod) { cupom = null; return abrirCarrinho(); } try { const r = await api("POST", "/cupom", { codigo: cod, subtotal: subtotal() }); if (r.ok) { cupom = { ...r, codigo: r.codigo || cod.toUpperCase() }; toast(r.msg); abrirCarrinho(); } else { cupom = null; $("#cupomMsg").textContent = r.msg; } } catch (e) { $("#cupomMsg").textContent = e.message; } };
  $("#irCheckout").onclick = () => passoEntrega();
}
function passos(n) { return `<div class="passos" aria-label="Etapa ${n} de 3">${[1, 2, 3].map((i) => `<i class="${i <= n ? "on" : ""}"></i>`).join("")}</div>`; }
function opcoesAgenda() {
  const out = [], hoje = new Date();
  for (let i = 0; i <= (L.dias_agenda || 0); i++) {
    const d = new Date(hoje.getTime() + i * 864e5), iso = new Intl.DateTimeFormat("en-CA", { timeZone: "America/Sao_Paulo" }).format(d), dow = d.getDay();
    if (!(L.horarios[dow] || []).length && Object.values(L.horarios).some((x) => x && x.length)) continue;
    for (const f of L.faixas) { const fim = f.slice(6); if (i === 0) { const agora = new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit", timeZone: "America/Sao_Paulo" }); if (fim <= agora) continue; } out.push({ v: `${iso} ${f}`, t: `${i === 0 ? "Hoje" : i === 1 ? "Amanhã" : DIAS[dow]}, ${iso.slice(8)}/${iso.slice(5, 7)} · ${f.replace("-", " às ")}` }); }
  }
  return out;
}
function passoEntrega() {
  if (!C.tipo) C.tipo = L.entrega ? "entrega" : "retirada";
  const ag = L.agendamento ? opcoesAgenda() : [];
  const e = C.end;
  gaveta("Entrega", `${passos(1)}
   ${L.entrega ? `<label class="op"><input type="radio" name="tipo" value="entrega" ${C.tipo === "entrega" ? "checked" : ""}><span>Receber em casa<small>${L.taxa_entrega || L.zonas.length ? "Taxa conforme o bairro" : "Entrega grátis"} · cerca de ${L.prazo_min} min</small></span></label>` : ""}
   ${L.retirada ? `<label class="op"><input type="radio" name="tipo" value="retirada" ${C.tipo === "retirada" ? "checked" : ""}><span>Retirar na loja<small>${esc([L.endereco, L.bairro].filter(Boolean).join(", ") || "Combine pelo WhatsApp")}</small></span></label>` : ""}
   <div id="endBox" ${C.tipo === "entrega" ? "" : "hidden"} style="margin-top:12px">
    <div class="g3"><div class="campo"><label for="eCep">CEP</label><input id="eCep" inputmode="numeric" autocomplete="postal-code" maxlength="9" value="${esc(e.cep || "")}" placeholder="00000-000"></div><div class="campo"><label for="eNum">Número</label><input id="eNum" autocomplete="address-line2" value="${esc(e.numero || "")}"></div></div>
    <div class="campo"><label for="eRua">Rua</label><input id="eRua" autocomplete="address-line1" value="${esc(e.rua || "")}"></div>
    <div class="g2"><div class="campo"><label for="eBairro">Bairro</label><input id="eBairro" list="bairros" value="${esc(e.bairro || "")}"><datalist id="bairros">${L.zonas.map((z) => `<option value="${esc(z.nome)}">`).join("")}</datalist></div><div class="campo"><label for="eComp">Complemento</label><input id="eComp" value="${esc(e.complemento || "")}" placeholder="Apto, bloco"></div></div>
    <div class="campo"><label for="eRef">Ponto de referência</label><input id="eRef" value="${esc(e.referencia || "")}"></div><p class="dica" id="cepMsg"></p></div>
   ${ag.length ? `<div class="campo" style="margin-top:6px"><label for="agenda">${L.aberta ? "Quando? (opcional)" : "Escolha quando receber"}</label><select id="agenda">${L.aberta ? `<option value="">O quanto antes</option>` : ""}${ag.map((o) => `<option value="${o.v}" ${C.agenda === o.v ? "selected" : ""}>${o.t}</option>`).join("")}</select></div>` : ""}
   ${boxTotais()}`, `<button class="b pri" id="ok1">Continuar</button>`, abrirCarrinho);
  const taxaBairro = () => { const z = L.zonas.find((x) => x.nome.toLowerCase().trim() === $("#eBairro").value.toLowerCase().trim()); C.taxa = z ? z.taxa : null; const t = $(".totais"); if (t) t.outerHTML = boxTotais(); };
  $$("[name=tipo]").forEach((r) => (r.onchange = () => { C.tipo = r.value; $("#endBox").hidden = C.tipo !== "entrega"; const t = $(".totais"); if (t) t.outerHTML = boxTotais(); }));
  if ($("#eBairro")) $("#eBairro").oninput = taxaBairro;
  if ($("#eCep")) $("#eCep").oninput = async (ev) => { let v = ev.target.value.replace(/\D/g, "").slice(0, 8); ev.target.value = v.length > 5 ? v.slice(0, 5) + "-" + v.slice(5) : v; if (v.length !== 8) return;
    $("#cepMsg").textContent = "Buscando o endereço…";
    try { const r = await api("GET", `/cep/${v}`); C.cepInfo = r; if (r.rua) $("#eRua").value = r.rua; if (r.bairro) $("#eBairro").value = r.bairro; $("#cepMsg").innerHTML = r.atende ? `${esc(r.cidade)}/${esc(r.uf)} · entrega ${r.taxa ? brl(r.taxa) : "grátis"}` : `<span style="color:var(--err)">${esc(r.msg)}</span>`; C.taxa = r.taxa; const t = $(".totais"); if (t) t.outerHTML = boxTotais(); $("#eNum").focus(); }
    catch (e) { $("#cepMsg").textContent = e.message; } };
  $("#ok1").onclick = () => {
    if (C.tipo === "entrega") {
      C.end = { cep: $("#eCep").value, numero: $("#eNum").value.trim(), rua: $("#eRua").value.trim(), bairro: $("#eBairro").value.trim(), complemento: $("#eComp").value.trim(), referencia: $("#eRef").value.trim(), cidade: C.cepInfo ? C.cepInfo.cidade : "" };
      const falt = [["eRua", C.end.rua.length >= 3], ["eNum", !!C.end.numero], ["eBairro", C.end.bairro.length >= 2]].filter(([, ok]) => !ok);
      $$("#endBox input").forEach((i) => i.removeAttribute("aria-invalid")); falt.forEach(([id]) => $("#" + id).setAttribute("aria-invalid", "true"));
      if (falt.length) { toast("Preencha rua, número e bairro.", "err"); $("#" + falt[0][0]).focus(); return; }
      if (C.cepInfo && C.cepInfo.atende === false) return toast(C.cepInfo.msg, "err");
      store.set("end", C.end);
    }
    C.agenda = $("#agenda") ? $("#agenda").value : "";
    if (!L.aberta && !C.agenda) return toast(L.agendamento ? "Escolha um dia e horário." : "A loja está fechada agora.", "err");
    passoDados();
  };
}
function passoDados() {
  const d = C.dados;
  gaveta("Seus dados", `${passos(2)}<div class="campo"><label for="dNome">Seu nome</label><input id="dNome" autocomplete="name" value="${esc(d.nome || "")}"></div>
   <div class="campo"><label for="dZap">WhatsApp (com DDD)</label><input id="dZap" type="tel" inputmode="tel" autocomplete="tel" value="${esc(d.whatsapp || "")}" placeholder="(54) 99999-9999"><p class="dica">A loja confirma o pedido por aqui.</p></div>
   <label class="op"><input type="checkbox" id="dNov" ${d.aceita ? "checked" : ""}><span>Quero receber ofertas da ${esc(L.nome)} no WhatsApp<small>Você pode pedir para sair quando quiser.</small></span></label>
   <div class="hp" aria-hidden="true"><label for="site">Site</label><input id="site" tabindex="-1" autocomplete="off"></div>`, `<button class="b pri" id="ok2">Continuar</button>`, passoEntrega);
  $("#dZap").oninput = (e) => { let v = e.target.value.replace(/\D/g, "").slice(0, 11); e.target.value = v.length > 6 ? `(${v.slice(0, 2)}) ${v.slice(2, v.length - 4)}-${v.slice(-4)}` : v.length > 2 ? `(${v.slice(0, 2)}) ${v.slice(2)}` : v; };
  $("#ok2").onclick = () => {
    C.dados = { nome: $("#dNome").value.trim(), whatsapp: $("#dZap").value, aceita: $("#dNov").checked };
    const z = C.dados.whatsapp.replace(/\D/g, "");
    if (C.dados.nome.length < 2) { $("#dNome").setAttribute("aria-invalid", "true"); $("#dNome").focus(); return toast("Informe o seu nome.", "err"); }
    if (z.length < 10) { $("#dZap").setAttribute("aria-invalid", "true"); $("#dZap").focus(); return toast("Informe o WhatsApp com DDD.", "err"); }
    store.set("dados", C.dados); C.hp = $("#site").value; passoPagamento();
  };
}
function passoPagamento() {
  const pg = L.pagamentos, t = totais();
  const ops = [pg.online && ["online", "Pagar agora (Pix ou cartão)", "Pagamento seguro pelo Mercado Pago, em até 12x no cartão"], pg.pix && ["pix", "Pix", "A chave aparece ao finalizar"], pg.dinheiro && ["dinheiro", "Dinheiro", C.tipo === "entrega" ? "Pago na entrega" : "Pago na retirada"], pg.cartao && ["cartao", "Cartão (maquininha)", C.tipo === "entrega" ? "Débito ou crédito na entrega" : "Débito ou crédito na retirada"]].filter(Boolean);
  if (!C.pagamento || !ops.find((o) => o[0] === C.pagamento)) C.pagamento = ops[0] ? ops[0][0] : null;
  gaveta("Pagamento", `${passos(3)}${ops.map(([v, t1, t2]) => `<label class="op"><input type="radio" name="pg" value="${v}" ${C.pagamento === v ? "checked" : ""}><span>${t1}<small>${t2}</small></span></label>`).join("")}
   <div class="campo" id="trocoBox" ${C.pagamento === "dinheiro" ? "" : "hidden"}><label for="troco">Troco para quanto? (opcional)</label><input id="troco" inputmode="decimal" placeholder="Ex.: 100" value="${esc(C.troco)}"></div>
   <div class="campo"><label for="obs">Observações do pedido</label><textarea id="obs" maxlength="500" placeholder="Ex.: interfone com defeito, ligar ao chegar">${esc(C.obs)}</textarea></div>
   <h3 style="margin:8px 0 6px">Resumo</h3><p class="dica" style="margin:0">${itensCar().length} item(ns) · ${C.tipo === "entrega" ? `Entrega em ${esc(C.end.rua)}, ${esc(C.end.numero)} – ${esc(C.end.bairro)}` : "Retirada na loja"}${C.agenda ? ` · ${esc(C.agenda.slice(8, 10) + "/" + C.agenda.slice(5, 7) + " " + C.agenda.slice(11))}` : ""}</p>${boxTotais()}
   ${L.demo ? `<p class="alerta">Loja de demonstração: ao enviar, mostramos o aviso, mas nenhum pedido é criado.</p>` : ""}`, `<button class="b pri" id="enviar">Enviar pedido · ${brl(t.total)}</button>`, passoDados);
  $$("[name=pg]").forEach((r) => (r.onchange = () => { C.pagamento = r.value; $("#trocoBox").hidden = r.value !== "dinheiro"; }));
  $("#enviar").onclick = async (ev) => {
    const b = ev.currentTarget; C.troco = $("#troco").value; C.obs = $("#obs").value;
    if (!C.pagamento) return toast("Escolha a forma de pagamento.", "err");
    const tr = C.troco ? Math.round(parseFloat(C.troco.replace(/\./g, "").replace(",", ".")) * 100) : null;
    b.disabled = true; b.textContent = "Enviando…";
    try {
      const r = await api("POST", "/pedido", { nome: C.dados.nome, whatsapp: C.dados.whatsapp, aceita_promos: C.dados.aceita, tipo: C.tipo, endereco: C.tipo === "entrega" ? C.end : null, pagamento: C.pagamento, troco_para: tr, observacoes: C.obs, cupom: cupom ? cupom.codigo : null, agendado_para: C.agenda || null, site: C.hp || "", itens: itensCar().map((x) => ({ id: x.p.id, qtd: x.q, obs: x.obs })) });
      car = {}; store.set("car", car); cupom = null; barraCar(); PRODS.forEach((p) => desenhaBotoes(p.id));
      const ped = store.get("pedidos", []); ped.unshift({ t: r.token, n: r.numero, em: Date.now() }); store.set("pedidos", ped.slice(0, 10));
      sucesso(r);
    } catch (e) { b.disabled = false; b.textContent = "Tentar de novo"; toast(e.message, "err"); }
  };
}
function sucesso(r) {
  gaveta("Pedido enviado!", `<div class="centro"><div class="ok-anim"><svg viewBox="0 0 24 24"><path d="M5 12l5 5L20 7"/></svg></div><h2 style="font-size:24px">Pedido #${r.numero} recebido!</h2><p>A ${esc(L.nome)} já recebeu o seu pedido de <b>${brl(r.total)}</b>. Você acompanha cada etapa pelo link abaixo.</p></div>
   ${r.pagamento_url ? `<a class="b pri" href="${esc(r.pagamento_url)}">Pagar agora com Pix ou cartão</a>` : ""}
   ${r.pix ? `<p style="margin:16px 0 0;font-weight:700">Pague com Pix (${esc(r.pix.nome)}):</p><div class="pix"><span style="flex:1">${esc(r.pix.chave)}</span><button type="button" id="cpPix">Copiar chave</button></div><p class="dica">Depois, mande o comprovante no WhatsApp da loja.</p>` : ""}
   ${r.whatsapp_url ? `<a class="b zap" href="${esc(r.whatsapp_url)}" target="_blank" rel="noopener">Avisar a loja no WhatsApp</a>` : ""}
   <a class="b" href="${esc(new URL(r.acompanhar).pathname)}">Acompanhar o pedido</a>`, `<button class="b" data-fechar>Voltar para a loja</button>`);
  if ($("#cpPix")) $("#cpPix").onclick = () => { navigator.clipboard?.writeText(r.pix.chave); toast("Chave Pix copiada!"); };
  if (window.gsap && !calmo) gsap.from(".ok-anim", { scale: 0.4, opacity: 0, duration: 0.6, ease: "back.out(2)" });
}

// ---------- acompanhar pedido ----------
const ETAPAS = [["novo", "Pedido recebido", "A loja já viu o seu pedido."], ["confirmado", "Confirmado", "A loja aceitou o pedido."], ["separacao", "Separando", "Os produtos estão sendo separados."], ["pronto", "Pronto", "Tudo separado e conferido."], ["saiu", "Saiu para entrega", "O entregador está a caminho."], ["entregue", "Entregue", "Bom proveito!"]];
async function acompanhar(token) {
  let d;
  try { d = await api("GET", `/pedido/${encodeURIComponent(token)}`); } catch (e) { $("#app").innerHTML = `<div class="embreve"><div><h1>Pedido não encontrado</h1><p>Confira o link que você recebeu.</p><a class="b pri" href="/" style="max-width:280px;margin:auto">Ir para a loja</a></div></div>`; return; }
  const p = d.pedido; tema(d.loja.cor); document.title = `Pedido #${p.numero} · ${d.loja.nome}`;
  const etapas = ETAPAS.filter(([k]) => !(p.tipo === "retirada" && k === "saiu"));
  const idx = etapas.findIndex(([k]) => k === p.status), feito = (i) => p.status !== "cancelado" && i <= idx;
  $("#app").innerHTML = `<div class="cart-acomp"><a href="/" style="display:flex;align-items:center;gap:10px;text-decoration:none;color:var(--ink);font-weight:800">${d.loja.logo ? `<img src="${esc(d.loja.logo)}" alt="" width="40" height="40" style="border-radius:12px">` : ""}${esc(d.loja.nome)}</a>
   <h1 style="margin:22px 0 4px;font-size:28px">Pedido #${p.numero}</h1><p class="dica" style="margin:0">Feito em ${new Date(p.criado_em).toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo", dateStyle: "short", timeStyle: "short" })} · ${p.tipo === "entrega" ? "Entrega" + (p.bairro ? " em " + esc(p.bairro) : "") : "Retirada na loja"}${p.agendado_para ? " · agendado " + esc(p.agendado_para.slice(8, 10) + "/" + p.agendado_para.slice(5, 7) + " " + p.agendado_para.slice(11)) : ""}</p>
   ${p.status === "cancelado" ? `<p class="alerta" style="margin-top:16px">Este pedido foi cancelado.${p.motivo_cancel ? " Motivo: " + esc(p.motivo_cancel) : ""}</p>` : `<ol class="trilha">${etapas.map(([k, t, s], i) => `<li class="${feito(i) ? "feito" : ""} ${i === idx ? "atual" : ""}"><span class="bola">${feito(i) ? "✓" : i + 1}</span><div><b>${t}</b>${i <= idx ? `<span>${s}${(d.historico.find((h) => h.status === k) || {}).em ? " · " + new Date(d.historico.find((h) => h.status === k).em).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit", timeZone: "America/Sao_Paulo" }) : ""}</span>` : ""}</div></li>`).join("")}</ol>`}
   ${!p.pago && p.link_pagamento && p.status !== "cancelado" ? `<a class="b pri" href="${esc(p.link_pagamento)}">Pagar agora com Pix ou cartão</a>` : ""}
   ${!p.pago && d.loja.pix_chave && p.status !== "cancelado" ? `<p style="font-weight:700;margin:16px 0 0">Pagamento por Pix (${esc(d.loja.pix_nome)}):</p><div class="pix"><span style="flex:1">${esc(d.loja.pix_chave)}</span><button type="button" id="cpPix">Copiar</button></div>` : ""}
   ${p.pago ? `<p style="color:var(--ok);font-weight:800">✓ Pagamento confirmado</p>` : ""}
   <h3 style="margin:22px 0 6px">Itens</h3>${d.itens.map((i) => `<p style="display:flex;justify-content:space-between;gap:10px;margin:0;padding:8px 0;border-bottom:1px solid var(--line)"><span>${fq(i.quantidade, i.unidade)} · ${esc(i.nome)}</span><b>${brl(i.total)}</b></p>`).join("")}
   <div class="totais"><p><span>Produtos</span><span>${brl(p.subtotal)}</span></p>${p.desconto ? `<p><span>Desconto</span><span>− ${brl(p.desconto)}</span></p>` : ""}${p.tipo === "entrega" ? `<p><span>Entrega</span><span>${p.taxa ? brl(p.taxa) : "Grátis"}</span></p>` : ""}<p class="g"><span>Total</span><span>${brl(p.total)}</span></p>${p.troco_para ? `<p class="dica"><span>Troco para ${brl(p.troco_para)}</span></p>` : ""}</div>
   ${d.loja.whatsapp ? `<a class="b zap" target="_blank" rel="noopener" href="https://wa.me/${esc(d.loja.whatsapp)}?text=${encodeURIComponent(`Olá! Sobre o meu pedido #${p.numero}…`)}">Falar com a loja no WhatsApp</a>` : ""}<a class="b" href="/">Fazer outro pedido</a>
   <p class="dica centro" style="margin-top:20px">Esta página se atualiza sozinha.</p></div>`;
  if ($("#cpPix")) $("#cpPix").onclick = () => { navigator.clipboard?.writeText(d.loja.pix_chave); toast("Chave Pix copiada!"); };
  if (window.gsap && !calmo) gsap.from(".trilha li", { x: -16, opacity: 0, duration: 0.45, stagger: 0.08, ease: "power2.out" });
  if (!["entregue", "cancelado"].includes(p.status)) setTimeout(() => acompanhar(token), 20000);
}

// ---------- início ----------
(async () => {
  const m = location.pathname.match(/^\/pedido\/([a-f0-9]{24})\/?$/);
  if (m) return acompanhar(m[1]);
  try { vitrine(await api("GET", "")); }
  catch (e) {
    if (e.j && e.j.em_breve) $("#app").innerHTML = `<div class="embreve"><div><img src="/pub/icone.svg" alt="" width="64" height="64" style="margin:auto"><h1>${esc(e.j.nome)} está chegando</h1><p>A loja online está sendo preparada. Volte em breve!</p></div></div>`;
    else $("#app").innerHTML = `<div class="embreve"><div><h1>Loja não encontrada</h1><p>Confira o endereço digitado.</p><a class="b pri" href="https://salesworks.lldworks.com.br" style="max-width:320px;margin:auto">Crie a sua loja com o SalesWorks</a></div></div>`;
  }
})();
})();
