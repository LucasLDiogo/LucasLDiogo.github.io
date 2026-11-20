// ServiceWorks — vitrine pública premium: o cliente vê a loja, escolhe serviço, pet, horário e local e agenda sem login.
"use strict";
(() => {
  const $ = (s, r = document) => r.querySelector(s), $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const brl = (c) => (Number(c || 0) / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
  const somaDias = (d, n) => { const x = new Date(d + "T12:00:00Z"); x.setUTCDate(x.getUTCDate() + n); return x.toISOString().slice(0, 10); };
  const semana = (d) => new Date(d + "T12:00:00Z").toLocaleDateString("pt-BR", { timeZone: "UTC", weekday: "short" }).replace(".", "");
  const dataLonga = (d) => new Date(d + "T12:00:00Z").toLocaleDateString("pt-BR", { timeZone: "UTC", weekday: "long", day: "numeric", month: "long" });
  const diaSem = (d) => new Date(d + "T12:00:00Z").getUTCDay();
  const calmo = () => matchMedia("(prefers-reduced-motion: reduce)").matches;
  const SEG = { barbearia: "Barbearia", salao: "Salão de beleza", clinica: "Clínica", petshop: "Pet shop", outro: "" };
  const EMO_SEG = { barbearia: "💈", salao: "💇", clinica: "🩺", petshop: "🐾", outro: "✨" };
  const EMO = [[/banho/i, "🛁"], [/tosa|corte|cabelo/i, "✂️"], [/gato/i, "🐱"], [/unha|manicure|pedicure/i, "💅"], [/ouvido/i, "👂"], [/hidrat/i, "💧"], [/barba/i, "🧔"], [/consulta|avalia/i, "🩺"], [/vacina/i, "💉"], [/escova|penteado/i, "💁"], [/sobrancelha|cílios|cilios/i, "👁️"], [/massag/i, "💆"], [/dente|odonto/i, "🦷"]];
  const SEMANA = ["Domingo", "Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado"];
  const PORTES = [["mini", "Mini", "até 5 kg"], ["pequeno", "Pequeno", "5 a 10 kg"], ["medio", "Médio", "10 a 25 kg"], ["grande", "Grande", "25 a 45 kg"], ["gigante", "Gigante", "mais de 45 kg"]];
  const ROT = { servico: "Serviço", pet: "Pet", horario: "Horário", confirmar: "Confirmar" };

  // Endereço da loja: <loja>.lldworks.com.br (ou o antigo /v/<loja>)
  const hostLoja = location.hostname.endsWith(".lldworks.com.br") && !/^(serviceworks|serviceworks-demo)\./.test(location.hostname) ? location.hostname.split(".")[0] : "";
  const slug = (location.pathname.startsWith("/v/") ? decodeURIComponent(location.pathname.split("/")[2] || "") : hostLoja || new URLSearchParams(location.search).get("loja") || "").toLowerCase();
  const BASE = `/api/publico/${encodeURIComponent(slug)}`;
  const E = { info: null, servico: null, prof: "qualquer", dia: null, hora: null, profDoHorario: {}, porte: null, especie: "cao", livre: null, onde: "local", passo: "servico", cat: "Todos", catSh: "Todos", codigo: null, poll: null };
  const emp = () => E.info.empresa;
  const pet = () => emp().segmento === "petshop";
  const passos = () => (pet() ? ["servico", "pet", "horario", "confirmar"] : ["servico", "horario", "confirmar"]);
  const catDe = (s) => (s.combo ? "Combos" : s.categoria || "Serviços");
  const emoDe = (s) => (EMO.find(([r]) => r.test(`${s.nome} ${s.categoria || ""}`)) || [0, s.combo ? "⭐" : EMO_SEG[emp().segmento] || "✨"])[1];
  const preco = (s) => s.promo_centavos ?? s.preco_centavos;
  const faixa = (s) => { const v = [preco(s), ...(s.portes || []).map((p) => p.preco_centavos)], d = [s.duracao_min, ...(s.portes || []).map((p) => p.duracao_min)]; return { min: Math.min(...v), max: Math.max(...v), dmin: Math.min(...d), dmax: Math.max(...d) }; };
  const precoPorte = (s, k) => { const p = (s?.portes || []).find((x) => x.porte === k); return p ? p.preco_centavos : preco(s); };
  const duracaoPorte = (s, k) => { const p = (s?.portes || []).find((x) => x.porte === k); return p ? p.duracao_min : s.duracao_min; };
  const taxaBusca = () => (E.onde === "busca" && emp().busca ? emp().busca.centavos || 0 : 0);
  const valorServ = () => { const s = E.servico; if (!s) return 0; if (E.livre && E.hora) return E.livre.valor; return pet() && E.porte ? precoPorte(s, E.porte) : preco(s); };
  const ini = (n) => String(n || "?").trim().split(/\s+/).slice(0, 2).map((x) => x[0]).join("").toUpperCase();
  let tt;
  const toast = (m) => { const t = $("#toast"); t.textContent = m; t.classList.add("on"); clearTimeout(tt); tt = setTimeout(() => t.classList.remove("on"), 3200); };

  async function api(caminho, opt = {}) {
    const r = await fetch(BASE + caminho, { ...opt, headers: opt.body ? { "Content-Type": "application/json" } : {} });
    let d = null; try { d = await r.json(); } catch {}
    if (!r.ok) { const e = new Error(d?.erro || "Não foi possível concluir. Tente de novo."); e.status = r.status; throw e; }
    return d;
  }
  function erro(t, m) { document.body.classList.remove("carregando"); $("#vErroT").textContent = t; $("#vErroM").textContent = m; $("#vErro").hidden = false; $("#pagina").hidden = true; $("#abas").hidden = true; $("#barraM").hidden = true; $$("[data-agendar]").forEach((b) => (b.hidden = true)); }

  // ───────────────────────── página da loja
  async function inicio() {
    if (!slug) return erro("Endereço incompleto", "Confira o link que você recebeu.");
    try { E.info = await api(""); }
    catch (e) { return e.status === 404 ? erro("Agenda não encontrada", "Confira o link que você recebeu do estabelecimento.") : erro("Agenda indisponível", e.message); }
    const em = emp();
    if (/^#[0-9a-f]{6}$/i.test(em.cor || "")) { document.documentElement.style.setProperty("--p", em.cor); $('meta[name="theme-color"]').content = em.cor; }
    document.title = `${em.nome} · Agende online`;
    $("#vNome").textContent = em.nome; $("#vSeg").textContent = SEG[em.segmento] || ""; $("#shLoja").textContent = em.nome;
    capa(em); informacoes(em); promocoes(em); produtos(em);
    if (!E.info.servicos.length) { $("#lServ").innerHTML = '<div class="vazio">Ainda não há serviços disponíveis para agendar online.</div>'; $$("[data-agendar]").forEach((b) => (b.hidden = true)); }
    else desenhaVitrine();
    document.body.classList.remove("carregando");
    entrada();
    const q = new URLSearchParams(location.search), sv = +q.get("servico");
    if (sv && E.info.servicos.some((s) => s.id === sv)) abrir(sv); else if (location.hash === "#agendar") abrir();
  }

  function capa(em) {
    const base = location.pathname.startsWith("/v/") ? BASE : "";
    if (em.tem_logo) { const l = $("#vLogo"); l.src = base ? `${BASE}/logo` : "/logo"; l.alt = em.nome; l.hidden = false; $("#vIni").hidden = true; const ic = document.querySelector('link[rel="icon"]'); if (ic) ic.href = l.src; }
    else $("#vIni").textContent = ini(em.nome);
    if (em.tem_banner) { const b = $("#banner"); b.style.backgroundImage = `url(${base ? `${BASE}/banner` : "/banner"})`; b.classList.add("foto"); }
    const local = [em.bairro, em.cidade && `${em.cidade}${em.uf ? "/" + em.uf : ""}`].filter(Boolean).join(" · ");
    $("#vSub").textContent = local || em.sobre?.slice(0, 90) || "";
    const ch = [], st = statusAgora(em);
    if (st) ch.push(`<span class="chip${st.aberto ? "" : " fechado"}"><span class="dot"></span>${esc(st.txt)}</span>`);
    if (em.busca) ch.push(`<span class="chip">🚗 Busca e entrega</span>`);
    if (em.pagamento_online) ch.push(`<span class="chip">⚡ Pix e cartão</span>`);
    ch.push(`<span class="chip">✓ Confirmação na hora</span>`);
    $("#vChips").innerHTML = ch.join("");
    if (em.whatsapp) { const w = `https://wa.me/${em.whatsapp}?text=${encodeURIComponent(`Olá, ${em.nome}! Vim pela agenda online.`)}`; $("#vWa").href = w; $("#vWa").hidden = false; $("#vWa2").href = w; $("#vWa2").hidden = false; }
    if (em.instagram) { $("#vIg").href = /^https?:/.test(em.instagram) ? em.instagram : `https://instagram.com/${em.instagram.replace(/^@/, "")}`; $("#vIg").hidden = false; }
  }

  // aberto agora / abre às … (hora de Brasília)
  function statusAgora(em) {
    const f = em.funcionamento || []; if (!f.length) return null;
    const agora = new Date(new Date().toLocaleString("en-US", { timeZone: "America/Sao_Paulo" }));
    const dia = agora.getDay(), hm = agora.toTimeString().slice(0, 5);
    const hoje = f.filter((x) => x.dia_semana === dia).sort((a, b) => a.inicio.localeCompare(b.inicio));
    const ab = hoje.find((x) => hm >= x.inicio && hm < x.fim);
    if (ab) return { aberto: true, txt: `Aberto agora · até ${ab.fim}` };
    const depois = hoje.find((x) => x.inicio > hm);
    if (depois) return { aberto: false, txt: `Fechado · abre às ${depois.inicio}` };
    for (let i = 1; i <= 7; i++) { const d = (dia + i) % 7, p = f.filter((x) => x.dia_semana === d).sort((a, b) => a.inicio.localeCompare(b.inicio))[0]; if (p) return { aberto: false, txt: `Fechado · abre ${i === 1 ? "amanhã" : SEMANA[d].toLowerCase()} às ${p.inicio}` }; }
    return null;
  }

  function enderecoLoja(em) {
    const rua = em.rua ? `${em.rua}${em.numero ? ", " + em.numero : ""}${em.complemento ? " — " + em.complemento : ""}` : em.endereco || "";
    return [rua, em.bairro, em.cidade && `${em.cidade}${em.uf ? "/" + em.uf : ""}`, em.cep && `CEP ${String(em.cep).replace(/^(\d{5})(\d{3})$/, "$1-$2")}`].filter(Boolean).join(" · ");
  }

  function informacoes(em) {
    if (em.sobre) { $("#vSobre").textContent = em.sobre; $("#vSobreBox").hidden = false; }
    const end = enderecoLoja(em);
    const mapa = em.maps_url || (end ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${em.nome} ${end}`)}` : "");
    if (end) { $("#vEnd").textContent = end; $("#vEndBox").hidden = false; }
    if (mapa) { $("#vMapa").href = mapa; $("#vMapa").hidden = false; $("#vMapa2").href = mapa; } else $("#vMapa2").hidden = true;
    if (em.funcionamento?.length) {
      const hj = new Date(new Date().toLocaleString("en-US", { timeZone: "America/Sao_Paulo" })).getDay();
      $("#lHorario").innerHTML = [1, 2, 3, 4, 5, 6, 0].map((i) => { const f = em.funcionamento.filter((x) => x.dia_semana === i).sort((a, b) => a.inicio.localeCompare(b.inicio)); const c = i === hj ? ' class="hoje"' : ""; return `<dt${c}>${SEMANA[i]}${i === hj ? " · hoje" : ""}</dt><dd${c}>${f.length ? f.map((x) => `${x.inicio}–${x.fim}`).join(", ") : '<span class="mute">fechado</span>'}</dd>`; }).join("");
      $("#vHorBox").hidden = false;
    }
    const pct = +em.sinal_pct || 0;
    $("#vPag").textContent = em.pagamento_online
      ? pct >= 100 ? "Pagamento antecipado online, por Pix ou cartão, logo após agendar." : pct > 0 ? `Sinal de ${pct}% online (Pix ou cartão) para garantir o horário; o restante no local.` : "Pague no local. Pix e cartão aceitos."
      : "Pagamento no local, no dia do atendimento.";
    if (em.politica) { $("#vPol").textContent = em.politica; $("#vPolBox").hidden = false; $("#fPolitica").textContent = em.politica; $("#fPolitica").hidden = false; }
    const g = ["Confirmação na hora, sem cadastro", "Consulte ou cancele com o seu código"];
    if (em.busca) g.push(`Buscamos e entregamos${em.busca.centavos ? ` (+ ${brl(em.busca.centavos)})` : ""}`);
    if (em.pagamento_online) g.push("Pagamento seguro por Pix ou cartão");
    $("#vGarantias").innerHTML = g.map((x) => `<li>${esc(x)}</li>`).join("");
  }

  function promocoes(em) {
    const cupomUrl = new URLSearchParams(location.search).get("cupom");
    if (cupomUrl) $("#fCupom").value = cupomUrl.toUpperCase();
    if (!em.promocoes?.length) return;
    $("#vPromos").innerHTML = em.promocoes.map((p) => `<div class="promo"><span class="selo">${p.tipo === "percentual" ? `${esc(p.valor)}% OFF` : `${brl(p.valor)} OFF`}</span><b>${esc(p.titulo)}</b>${p.descricao ? `<p>${esc(p.descricao)}</p>` : ""}<p>até ${esc(String(p.fim).slice(8, 10))}/${esc(String(p.fim).slice(5, 7))}${p.cupom ? ` · cupom <b style="display:inline">${esc(p.cupom)}</b>` : ""}</p>${p.cupom ? `<button type="button" class="bt" data-cupom="${esc(p.cupom)}">Usar cupom</button>` : `<button type="button" class="bt" data-agendar>Aproveitar</button>`}</div>`).join("");
    $("#sPromos").hidden = false;
  }

  function produtos(em) {
    if (!em.produtos?.length) return;
    $("#lProd").innerHTML = em.produtos.map((p) => `<div class="prod">${p.tem_foto ? `<img src="${BASE}/produto-foto/${+p.id}" alt="" loading="lazy">` : '<span class="ph" aria-hidden="true"></span>'}<div class="tx"><b>${esc(p.nome)}</b><span class="pr">${brl(p.preco_centavos)}</span>${p.disponivel === false ? '<span class="pequeno mute">Indisponível</span>' : em.whatsapp ? `<a class="bt sec" target="_blank" rel="noopener" href="https://wa.me/${esc(em.whatsapp)}?text=${encodeURIComponent(`Olá! Quero o produto ${p.nome} (${brl(p.preco_centavos)}).`)}">Quero este</a>` : ""}</div></div>`).join("");
    $("#sProd").hidden = false; $("#abaProd").hidden = false;
  }

  function cardServ(s) {
    const f = pet() && s.portes?.length ? faixa(s) : null;
    const dur = f ? (f.dmin === f.dmax ? `${f.dmin} min` : `${f.dmin}–${f.dmax} min`) : `${s.duracao_min} min`;
    const promo = s.promo_centavos != null && s.promo_centavos < s.preco_centavos;
    const pr = f && f.min !== f.max ? `<small>a partir de</small>${brl(f.min)}` : `${promo ? `<s>${brl(s.preco_centavos)}</s>` : ""}${brl(f ? f.min : preco(s))}`;
    return `<button type="button" class="serv" data-abre="${s.id}">${promo ? '<span class="tag">Promoção</span>' : ""}<span class="topo"><span class="emo" aria-hidden="true">${emoDe(s)}</span><span><b>${esc(s.nome)}</b>${s.descricao ? `<span class="desc">${esc(s.descricao)}</span>` : ""}</span></span><span class="base"><span class="meta">⏱ ${dur}${f ? " · por porte" : ""}</span><span style="display:flex;align-items:center;gap:10px"><span class="pr">${pr}</span><span class="ir" aria-hidden="true">›</span></span></span></button>`;
  }
  function catsHTML(lista, atual) {
    const m = new Map(); for (const s of lista) m.set(catDe(s), (m.get(catDe(s)) || 0) + 1);
    if (m.size < 2) return "";
    return [["Todos", lista.length], ...m].map(([c, n]) => `<button type="button" data-cat="${esc(c)}" aria-pressed="${c === atual}">${esc(c)}<span class="n">${n}</span></button>`).join("");
  }
  function desenhaVitrine() {
    const l = E.info.servicos;
    $("#vCats").innerHTML = catsHTML(l, E.cat);
    $("#lServ").innerHTML = l.filter((s) => E.cat === "Todos" || catDe(s) === E.cat).map(cardServ).join("");
    $("#vQtd").textContent = `${l.length} ${l.length === 1 ? "serviço" : "serviços"}`;
    const min = Math.min(...l.map((s) => (pet() && s.portes?.length ? faixa(s).min : preco(s))));
    $("#vMin").textContent = brl(min); $("#vMinM").textContent = brl(min);
  }
  $("#vCats").addEventListener("click", (e) => {
    const b = e.target.closest("[data-cat]"); if (!b) return;
    E.cat = b.dataset.cat; desenhaVitrine();
    if (window.gsap && !calmo()) window.gsap.from("#lServ .serv", { opacity: 0, y: 12, duration: 0.35, stagger: 0.03, ease: "power2.out" });
  });
  $("#lServ").addEventListener("click", (e) => { const b = e.target.closest("[data-abre]"); if (b) abrir(+b.dataset.abre); });
  document.addEventListener("click", (e) => {
    if (e.target.closest("[data-agendar]")) { abrir(); return; }
    const c = e.target.closest("[data-cupom]"); if (c) { $("#fCupom").value = c.dataset.cupom; toast(`Cupom ${c.dataset.cupom} aplicado. Escolha o serviço.`); abrir(); }
  });

  // movimento de entrada, abas ativas e barra do celular
  function entrada() {
    const G = window.gsap;
    if (G && !calmo()) {
      G.from(".banner", { scale: 1.08, duration: 1.4, ease: "power2.out" });
      G.from(".avatar", { scale: 0.6, opacity: 0, duration: 0.7, ease: "back.out(1.7)", delay: 0.1 });
      G.from(".hero-txt > *, .hero-acoes > *", { opacity: 0, y: 18, duration: 0.6, stagger: 0.06, ease: "power3.out", delay: 0.2 });
    }
    const alvos = $$(".serv, .promo, .prod, #sInfo .cartao, #sCons .cartao, .tit");
    if ("IntersectionObserver" in window && !calmo()) {
      alvos.forEach((el) => el.classList.add("revela"));
      const io = new IntersectionObserver((es) => es.forEach((x) => { if (x.isIntersecting) { const i = alvos.indexOf(x.target) % 6; x.target.style.transitionDelay = `${i * 50}ms`; x.target.classList.add("vis"); io.unobserve(x.target); } }), { rootMargin: "0px 0px -8% 0px" });
      alvos.forEach((el) => io.observe(el));
      new IntersectionObserver(([x]) => $("#barraM").classList.toggle("on", !x.isIntersecting), { threshold: 0 }).observe($(".hero-acoes"));
      const abas = $$("#abas a"), secs = abas.map((a) => $(a.getAttribute("href")));
      const io2 = new IntersectionObserver((es) => es.forEach((x) => { if (x.isIntersecting) abas.forEach((a, i) => a.classList.toggle("on", secs[i] === x.target)); }), { rootMargin: "-40% 0px -55% 0px" });
      secs.forEach((s) => s && io2.observe(s));
    } else $("#barraM").classList.add("on");
  }

  // ───────────────────────── folha de agendamento
  function abrir(servId) {
    if (!E.info?.servicos.length) return;
    const sh = $("#sheet"); sh.hidden = false; document.body.classList.add("travado");
    if (history.state?.sw !== "sheet") history.pushState({ sw: "sheet" }, "");
    if (servId) { escolheServico(E.info.servicos.find((s) => s.id === servId), false); irPara(passos()[1]); }
    else irPara(E.passo === "ok" ? "servico" : E.passo || "servico");
    if (window.gsap && !calmo()) { window.gsap.fromTo(".sheet-box", { y: 60, opacity: 0 }, { y: 0, opacity: 1, duration: 0.45, ease: "power3.out" }); window.gsap.fromTo(".sheet-fundo", { opacity: 0 }, { opacity: 1, duration: 0.3 }); }
  }
  function fechar(doVoltar) {
    $("#sheet").hidden = true; document.body.classList.remove("travado"); pararPoll();
    if (E.passo === "ok") reinicia();
    if (!doVoltar && history.state?.sw === "sheet") history.back();
  }
  addEventListener("popstate", () => { if (!$("#sheet").hidden) fechar(true); });
  $("#sheet").addEventListener("click", (e) => { if (e.target.closest("[data-fechar]")) fechar(); });
  addEventListener("keydown", (e) => { if (e.key === "Escape" && !$("#sheet").hidden) fechar(); });
  $("#shVoltar").addEventListener("click", () => { const p = passos(), i = p.indexOf(E.passo); if (E.passo === "ok" || i <= 0) fechar(); else irPara(p[i - 1], -1); });

  function irPara(nome, dir = 1) {
    E.passo = nome;
    $$("#shCorpo .etapa").forEach((s) => (s.hidden = s.dataset.e !== nome));
    const p = passos(), i = p.indexOf(nome);
    $("#steps").hidden = nome === "ok";
    $("#steps").innerHTML = p.map((k, j) => `<li class="${j < i ? "feito" : j === i ? "atual" : ""}">${ROT[k]}</li>`).join("");
    $("#shTit").textContent = nome === "ok" ? "Tudo certo!" : { servico: "Escolha o serviço", pet: "Seu pet", horario: "Dia e horário", confirmar: "Confirmar agendamento" }[nome];
    $("#shPe").hidden = nome === "ok";
    $("#shSeguir").textContent = nome === "confirmar" ? "Confirmar agendamento" : "Continuar";
    if (nome === "servico") desenhaOpcoes();
    if (nome === "pet") desenhaPortes();
    if (nome === "horario") prepararHorario();
    if (nome === "confirmar") montarConfirmar();
    rodape(); $("#shCorpo").scrollTop = 0;
    const el = $(`#shCorpo .etapa[data-e="${nome}"]`);
    if (window.gsap && !calmo()) window.gsap.fromTo(el.children, { opacity: 0, x: 24 * dir }, { opacity: 1, x: 0, duration: 0.35, stagger: 0.04, ease: "power2.out" });
  }
  function podeSeguir() {
    if (E.passo === "servico") return !!E.servico;
    if (E.passo === "pet") return !!E.porte && $("#fPet").value.trim().length > 0;
    if (E.passo === "horario") return !!E.hora;
    return true;
  }
  function rodape() {
    const s = E.servico, partes = [];
    if (s) partes.push(s.nome);
    if (E.hora) partes.push(`${E.dia.slice(8)}/${E.dia.slice(5, 7)} às ${E.hora}`);
    $("#peLinha").textContent = partes.join(" · ") || "Escolha um serviço";
    $("#peTotal").textContent = s ? brl(valorServ() + taxaBusca()) : "";
    $("#shSeguir").disabled = !podeSeguir();
  }
  $("#shSeguir").addEventListener("click", () => {
    if (E.passo === "confirmar") return enviar();
    if (!podeSeguir()) return;
    const p = passos(); irPara(p[p.indexOf(E.passo) + 1]);
  });

  // 1. serviço
  function desenhaOpcoes() {
    const l = E.info.servicos;
    $("#shCats").innerHTML = catsHTML(l, E.catSh);
    $("#shServ").innerHTML = l.filter((s) => E.catSh === "Todos" || catDe(s) === E.catSh).map((s) => {
      const f = pet() && s.portes?.length ? faixa(s) : null;
      return `<button type="button" class="opc" data-s="${s.id}" aria-pressed="${E.servico?.id === s.id}"><span class="emo" aria-hidden="true">${emoDe(s)}</span><span class="tx"><b>${esc(s.nome)}</b><span class="meta">${f ? (f.dmin === f.dmax ? f.dmin : `${f.dmin}–${f.dmax}`) : s.duracao_min} min${f ? " · varia por porte" : ""}</span></span><span class="pr">${f && f.min !== f.max ? `<small>a partir de</small>${brl(f.min)}` : brl(f ? f.min : preco(s))}</span><span class="radio" aria-hidden="true"></span></button>`;
    }).join("");
  }
  $("#shCats").addEventListener("click", (e) => { const b = e.target.closest("[data-cat]"); if (!b) return; E.catSh = b.dataset.cat; desenhaOpcoes(); });
  function escolheServico(s, avancar = true) {
    if (!s) return;
    const mudou = E.servico?.id !== s.id;
    E.servico = s; if (mudou) { E.hora = null; E.livre = null; E.prof = "qualquer"; }
    $$("#shServ [data-s]").forEach((x) => x.setAttribute("aria-pressed", String(+x.dataset.s === s.id)));
    rodape();
    if (avancar) setTimeout(() => irPara(passos()[1]), 160);
  }
  $("#shServ").addEventListener("click", (e) => { const b = e.target.closest("[data-s]"); if (b) escolheServico(E.info.servicos.find((s) => s.id === +b.dataset.s)); });

  // 2. pet
  function desenhaPortes() {
    const s = E.servico;
    $("#lPorte").innerHTML = PORTES.map(([k, n, kg]) => `<button type="button" data-porte="${k}" aria-pressed="${k === E.porte}"><b>${n}</b><span>${kg}</span>${s ? `<span class="pr">${brl(precoPorte(s, k))}</span>` : ""}</button>`).join("");
    $$("#fEsp [data-esp]").forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.esp === E.especie)));
  }
  $("#lPorte").addEventListener("click", (e) => {
    const b = e.target.closest("[data-porte]"); if (!b) return;
    E.porte = b.dataset.porte; E.hora = null; E.livre = null;
    $$("#lPorte [data-porte]").forEach((x) => x.setAttribute("aria-pressed", String(x === b)));
    rodape();
    if (!$("#fPet").value.trim()) { $("#fPet").focus(); toast("Agora, o nome do pet."); }
  });
  $("#fEsp").addEventListener("click", (e) => { const b = e.target.closest("[data-esp]"); if (!b) return; E.especie = b.dataset.esp; desenhaPortes(); });
  $("#fPet").addEventListener("input", rodape);

  // 3. dia e horário
  function prepararHorario() {
    const profs = E.info.profissionais.filter((p) => p.servicos.includes(E.servico.id));
    if (profs.length > 1) {
      $("#lProf").innerHTML = `<button type="button" data-p="qualquer" aria-pressed="${E.prof === "qualquer"}"><span class="av">✦</span><b>Sem preferência</b><span>Primeiro horário livre</span></button>` + profs.map((p) => `<button type="button" data-p="${p.id}" aria-pressed="${E.prof === String(p.id)}"><span class="av">${esc(ini(p.nome))}</span><b>${esc(p.nome)}</b><span>${esc(p.funcao || "")}</span></button>`).join("");
      $("#boxProf").hidden = false;
    } else { E.prof = profs[0] ? String(profs[0].id) : "qualquer"; $("#boxProf").hidden = true; }
    const em = emp(), hoje = em.hoje, n = Math.min(em.janela_dias || 30, 60), f = em.funcionamento || [];
    const aberto = (d) => !f.length || f.some((x) => x.dia_semana === diaSem(d));
    if (!E.dia) { E.dia = hoje; for (let i = 0; i <= n; i++) { const d = somaDias(hoje, i); if (aberto(d)) { E.dia = d; break; } } }
    const rot = (d) => (d === hoje ? "hoje" : d === somaDias(hoje, 1) ? "amanhã" : semana(d));
    $("#lDias").innerHTML = Array.from({ length: n + 1 }, (_, i) => somaDias(hoje, i)).map((d) => `<button type="button" data-d="${d}" class="${aberto(d) ? "" : "fechado"}" aria-pressed="${d === E.dia}" aria-label="${dataLonga(d)}"><span>${rot(d)}</span><b>${d.slice(8)}</b><span>${new Date(d + "T12:00:00Z").toLocaleDateString("pt-BR", { timeZone: "UTC", month: "short" }).replace(".", "")}</span></button>`).join("");
    const sel = $(`#lDias [data-d="${E.dia}"]`); if (sel) sel.scrollIntoView({ block: "nearest", inline: "center" });
    horas();
  }
  $("#lProf").addEventListener("click", (e) => { const b = e.target.closest("[data-p]"); if (!b) return; E.prof = b.dataset.p; E.hora = null; $$("#lProf [data-p]").forEach((x) => x.setAttribute("aria-pressed", String(x === b))); rodape(); horas(); });
  $("#lDias").addEventListener("click", (e) => { const b = e.target.closest("[data-d]"); if (!b) return; E.dia = b.dataset.d; E.hora = null; $$("#lDias [data-d]").forEach((x) => x.setAttribute("aria-pressed", String(x === b))); rodape(); horas(); });
  $$("[data-rola]").forEach((b) => b.addEventListener("click", () => $("#lDias").scrollBy({ left: +b.dataset.rola * 280, behavior: calmo() ? "auto" : "smooth" })));

  let pedido = 0;
  async function horas() {
    const box = $("#lHoras"), meu = ++pedido;
    $("#diaLongo").textContent = dataLonga(E.dia);
    box.innerHTML = '<div class="slots">' + '<div class="esq"></div>'.repeat(8) + "</div>";
    try {
      const r = await api(`/livres?data=${E.dia}&servico=${E.servico.id}&profissional=${encodeURIComponent(E.prof)}${pet() && E.porte ? `&porte=${E.porte}` : ""}`);
      if (meu !== pedido) return;
      E.livre = { duracao: r.duracao_min, valor: r.valor_centavos };
      E.profDoHorario = {};
      for (const p of r.profissionais) for (const h of p.horarios) (E.profDoHorario[h] ||= []).push(p.nome);
      const hs = Object.keys(E.profDoHorario).sort();
      if (!hs.length) { box.innerHTML = `<div class="vazio">Sem horários livres neste dia.<br><button type="button" class="bt link" id="proxDia">Ver o próximo dia →</button></div>`; rodape(); return; }
      const grupos = [["Manhã", (h) => h < "12:00"], ["Tarde", (h) => h >= "12:00" && h < "18:00"], ["Noite", (h) => h >= "18:00"]];
      box.innerHTML = grupos.map(([t, f]) => { const l = hs.filter(f); return l.length ? `<div><p class="turno">${t} · ${l.length}</p><div class="slots">${l.map((h) => `<button type="button" data-h="${h}" aria-pressed="${h === E.hora}">${h}</button>`).join("")}</div></div>` : ""; }).join("");
      if (window.gsap && !calmo()) window.gsap.from("#lHoras .slots button", { opacity: 0, y: 8, duration: 0.25, stagger: 0.012, ease: "power1.out" });
      rodape();
    } catch (e) { if (meu === pedido) box.innerHTML = `<div class="vazio">${esc(e.message)}</div>`; }
  }
  $("#lHoras").addEventListener("click", (e) => {
    if (e.target.closest("#proxDia")) { const prox = $(`#lDias [data-d="${somaDias(E.dia, 1)}"]`); if (prox) { prox.click(); prox.scrollIntoView({ block: "nearest", inline: "center" }); } return; }
    const b = e.target.closest("[data-h]"); if (!b) return;
    E.hora = b.dataset.h; $$("#lHoras [data-h]").forEach((x) => x.setAttribute("aria-pressed", String(x === b))); rodape();
  });

  // 4. confirmar
  function montarConfirmar() {
    const em = emp();
    if (em.busca) {
      $("#boxOnde").hidden = false;
      $("#ondeBusca").innerHTML = em.busca.centavos ? `<span class="taxa">+ ${brl(em.busca.centavos)}</span> · táxi dog` : "Sem custo extra";
      if (em.busca.obs) $("#buscaObs").textContent = em.busca.obs;
      marcaOnde();
    } else { $("#boxOnde").hidden = true; E.onde = "local"; }
    resumo();
  }
  function marcaOnde() {
    $$("#lOnde [data-onde]").forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.onde === E.onde)));
    $("#boxEnd").hidden = E.onde !== "busca"; $("#buscaObs").hidden = E.onde !== "busca" || !emp().busca?.obs;
  }
  $("#lOnde").addEventListener("click", (e) => {
    const b = e.target.closest("[data-onde]"); if (!b) return;
    E.onde = b.dataset.onde; marcaOnde(); resumo(); rodape();
    if (E.onde === "busca") { const c = $("#eCep"); if (!c.value) c.focus(); if (window.gsap && !calmo()) window.gsap.from("#boxEnd", { opacity: 0, y: 10, duration: 0.3 }); }
  });
  function resumo() {
    const s = E.servico, quem = E.prof !== "qualquer" ? E.info.profissionais.find((p) => String(p.id) === E.prof)?.nome : E.profDoHorario[E.hora]?.length === 1 ? E.profDoHorario[E.hora][0] : "Primeiro profissional livre";
    const dur = E.livre?.duracao ?? (pet() && E.porte ? duracaoPorte(s, E.porte) : s.duracao_min);
    const L = [["Serviço", s.nome]];
    if (pet()) L.push(["Pet", `${$("#fPet").value.trim()} · ${PORTES.find((p) => p[0] === E.porte)?.[1] || ""}`]);
    L.push(["Quando", `${dataLonga(E.dia)}, ${E.hora}`], ["Com", quem], ["Duração", `${dur} min`], ["Valor do serviço", brl(valorServ())]);
    if (taxaBusca()) L.push(["Busca e entrega", brl(taxaBusca())]);
    const pct = +emp().sinal_pct || 0, total = valorServ() + taxaBusca();
    $("#resumo").innerHTML = L.map(([a, b]) => `<div class="lin"><span>${a}</span><span>${esc(b)}</span></div>`).join("") + `<div class="lin tot"><span>Total</span><span>${brl(total)}</span></div>` +
      (emp().pagamento_online && pct > 0 ? `<p class="pequeno mute">${pct >= 100 ? "Pagamento online logo após confirmar (Pix ou cartão)." : `Sinal de ${pct}% online após confirmar; o restante no local.`}</p>` : '<p class="pequeno mute">Pagamento no local.</p>');
  }

  // CEP → endereço (ViaCEP)
  $("#eCep").addEventListener("input", async (e) => {
    const v = e.target.value.replace(/\D/g, "").slice(0, 8);
    e.target.value = v.length > 5 ? `${v.slice(0, 5)}-${v.slice(5)}` : v;
    if (v.length !== 8) return;
    try {
      const r = await (await fetch(`https://viacep.com.br/ws/${v}/json/`)).json();
      if (r.erro) { toast("CEP não encontrado. Preencha o endereço."); return; }
      if (r.logradouro) $("#eRua").value = r.logradouro;
      if (r.bairro) $("#eBairro").value = r.bairro;
      if (r.localidade) $("#eCid").value = r.localidade;
      if (r.uf) $("#eUf").value = r.uf;
      $("#eNum").focus();
    } catch { /* sem acesso ao serviço de CEP: o cliente digita */ }
  });
  $$("#boxEnd input, #fNome, #fWhats, #fPet").forEach((i) => i.addEventListener("input", () => i.classList.remove("inval")));

  async function confereCupom() {
    const c = $("#fCupom").value.trim().toUpperCase(), msg = $("#fCupomMsg"); msg.textContent = ""; msg.className = "pequeno";
    if (!c || !E.servico) return;
    try { const p = await api(`/cupom?codigo=${encodeURIComponent(c)}&servico=${E.servico.id}`); msg.textContent = `✓ ${p.titulo}: ${p.tipo === "percentual" ? p.valor + "% de desconto" : brl(p.valor) + " de desconto"} (aplicado na confirmação)`; msg.className = "pequeno okt"; }
    catch (x) { msg.textContent = x.message; msg.className = "pequeno err"; }
  }
  $("#fCupomOk").addEventListener("click", confereCupom);

  const falha = (sel, m) => { const el = $(sel); el.classList.add("inval"); el.focus(); el.scrollIntoView({ block: "center", behavior: calmo() ? "auto" : "smooth" }); toast(m); };
  async function enviar() {
    const nome = $("#fNome").value.trim(), whats = $("#fWhats").value.trim();
    if (!E.hora) { irPara("horario", -1); toast("Escolha um horário."); return; }
    let endereco = null;
    if (E.onde === "busca") {
      endereco = { cep: $("#eCep").value.replace(/\D/g, ""), rua: $("#eRua").value.trim(), numero: $("#eNum").value.trim(), complemento: $("#eComp").value.trim(), bairro: $("#eBairro").value.trim(), cidade: $("#eCid").value.trim(), uf: $("#eUf").value.trim().toUpperCase(), referencia: $("#eRef").value.trim() };
      for (const [k, sel, m] of [["rua", "#eRua", "Informe a rua para a busca."], ["numero", "#eNum", "Informe o número."], ["bairro", "#eBairro", "Informe o bairro."], ["cidade", "#eCid", "Informe a cidade."]]) if (!endereco[k]) return falha(sel, m);
    }
    if (nome.length < 2) return falha("#fNome", "Informe seu nome.");
    if (whats.replace(/\D/g, "").length < 10) return falha("#fWhats", "Informe o WhatsApp com DDD.");
    const bt = $("#shSeguir"); bt.disabled = true; bt.textContent = "Confirmando…";
    try {
      const corpo = { servico_id: E.servico.id, data: E.dia, hora: E.hora, nome, whatsapp: whats, observacoes: $("#fObs").value.trim() };
      const cup = $("#fCupom").value.trim(); if (cup) corpo.cupom = cup.toUpperCase();
      if (E.prof !== "qualquer") corpo.profissional_id = +E.prof;
      if (pet()) corpo.pet = { nome: $("#fPet").value.trim(), especie: E.especie, porte: E.porte };
      if (endereco) corpo.busca = { endereco };
      const r = await api("/agendar", { method: "POST", body: JSON.stringify(corpo) });
      try { localStorage.setItem("sw_cliente", JSON.stringify({ nome, whats, pet: corpo.pet || null, endereco })); } catch {}
      confirmado(r);
    } catch (x) {
      toast(x.message);
      if (x.status === 409) { E.hora = null; irPara("horario", -1); }
    } finally { bt.disabled = !podeSeguir(); bt.textContent = E.passo === "confirmar" ? "Confirmar agendamento" : "Continuar"; }
  }

  // 5. confirmado + pagamento
  function confirmado(r) {
    E.codigo = r.codigo;
    irPara("ok");
    const extra = r.busca ? " · busca e entrega incluída" : "";
    $("#okResumo").textContent = `${r.servico}${r.pet ? ` para ${r.pet}` : ""} com ${r.profissional} · ${dataLonga(r.inicio.slice(0, 10))}, às ${r.inicio.slice(11, 16)} · ${brl(r.valor_centavos)}${extra}`;
    $("#okCod").textContent = r.codigo;
    if (r.whatsapp_link) { $("#okWa").href = r.whatsapp_link; $("#okWa").hidden = false; } else $("#okWa").hidden = true;
    $("#okPago").hidden = true; $("#okPixBox").hidden = true; $("#okPagErr").textContent = ""; $("#okPix").textContent = "Pagar com Pix";
    const pg = r.pagamento, online = !!emp().pagamento_online;
    if (pg && (pg.link || online)) {
      const pct = +emp().sinal_pct || 0;
      $("#okPagV").textContent = brl(pg.valor_centavos);
      $("#okPagM").textContent = pct >= 100 ? "Pagamento antecipado do serviço." : `Sinal de ${pct}% — o restante você paga no local.`;
      $("#okPix").hidden = !online;
      if (pg.link) { $("#okCartao").href = pg.link; $("#okCartao").hidden = false; } else $("#okCartao").hidden = true;
      $("#okPagar").hidden = false; iniciarPoll();
    } else $("#okPagar").hidden = true;
    const t = (s) => s.replace(/[-:]/g, "").slice(0, 13) + "00";
    const em = emp();
    const ics = ["BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//LLD Works//ServiceWorks//PT", "BEGIN:VEVENT", `UID:${r.codigo}-${slug}@serviceworks.lldworks.com.br`, `DTSTAMP:${new Date().toISOString().replace(/[-:]/g, "").slice(0, 15)}Z`,
      `DTSTART;TZID=America/Sao_Paulo:${t(r.inicio)}`, `DTEND;TZID=America/Sao_Paulo:${t(r.fim)}`, `SUMMARY:${r.servico} · ${em.nome}`,
      `DESCRIPTION:Com ${r.profissional}. Código ${r.codigo}.`, enderecoLoja(em) ? `LOCATION:${enderecoLoja(em).replace(/[,;]/g, " ")}` : "", "BEGIN:VALARM", "TRIGGER:-PT2H", "ACTION:DISPLAY", "DESCRIPTION:Lembrete do seu horário", "END:VALARM", "END:VEVENT", "END:VCALENDAR"].filter(Boolean).join("\r\n");
    $("#okIcs").href = URL.createObjectURL(new Blob([ics], { type: "text/calendar" }));
    if (window.gsap && !calmo()) window.gsap.from(".codigo", { scale: 0.9, opacity: 0, duration: 0.5, delay: 0.5, ease: "back.out(1.6)" });
  }
  $("#okPix").addEventListener("click", async () => {
    const b = $("#okPix"), er = $("#okPagErr"); er.textContent = ""; b.disabled = true; b.textContent = "Gerando Pix…";
    try {
      const r = await api("/v3/pix", { method: "POST", body: JSON.stringify({ codigo: E.codigo }) });
      if (r.qr) { $("#okQr").src = `data:image/png;base64,${r.qr}`; $("#okQr").hidden = false; } else $("#okQr").hidden = true;
      $("#okCopia").value = r.copia_cola || ""; $("#okPixBox").hidden = false;
      if (window.gsap && !calmo()) window.gsap.from("#okPixBox", { opacity: 0, y: 12, duration: 0.35 });
      $("#okPixBox").scrollIntoView({ block: "center", behavior: calmo() ? "auto" : "smooth" });
      b.textContent = "Gerar Pix de novo";
    } catch (x) { er.textContent = x.message + ($("#okCartao").hidden ? "" : " Você pode pagar com cartão."); b.textContent = "Tentar Pix de novo"; }
    finally { b.disabled = false; }
  });
  $("#okCopiar").addEventListener("click", async () => {
    const v = $("#okCopia").value; if (!v) return;
    try { await navigator.clipboard.writeText(v); } catch { $("#okCopia").select(); document.execCommand("copy"); }
    toast("Código Pix copiado. Cole no app do banco.");
  });
  function iniciarPoll() {
    pararPoll(); const fim = Date.now() + 20 * 60 * 1000;
    E.poll = setInterval(async () => {
      if (Date.now() > fim || !E.codigo) return pararPoll();
      try {
        const r = await api(`/v3/pagamento?codigo=${encodeURIComponent(E.codigo)}`);
        if (r.pago) { pararPoll(); $("#okPagar").hidden = true; $("#okPago").hidden = false; toast("Pagamento confirmado!"); if (window.gsap && !calmo()) window.gsap.from("#okPago", { scale: 0.92, opacity: 0, duration: 0.45, ease: "back.out(1.6)" }); }
      } catch {}
    }, 5000);
  }
  function pararPoll() { if (E.poll) clearInterval(E.poll); E.poll = null; }
  function reinicia() { E.servico = null; E.hora = null; E.livre = null; E.prof = "qualquer"; E.dia = null; E.codigo = null; E.onde = "local"; E.passo = "servico"; $("#fObs").value = ""; $("#fCupomMsg").textContent = ""; }
  $("#okNovo").addEventListener("click", () => { pararPoll(); reinicia(); irPara("servico", -1); });

  // ───────────────────────── consultar / cancelar pelo código
  $("#fCons").addEventListener("submit", async (e) => {
    e.preventDefault();
    const er = $("#cErr"), res = $("#cRes"); er.textContent = ""; res.innerHTML = "";
    const cod = $("#cCod").value.trim().toUpperCase(), whats = $("#cWhats").value.trim();
    if (!cod || whats.replace(/\D/g, "").length < 10) { er.textContent = "Informe o código e o WhatsApp com DDD."; return; }
    try {
      const a = await api(`/agendamento?codigo=${encodeURIComponent(cod)}&whatsapp=${encodeURIComponent(whats)}`);
      const st = { confirmado: "Confirmado", concluido: "Concluído", cancelado: "Cancelado", faltou: "Não compareceu" }[a.status] || a.status;
      res.innerHTML = `<div class="res"><b>${esc(a.servico)}${a.pet ? " · " + esc(a.pet) : ""} · ${esc(st)}</b><span>${dataLonga(a.inicio.slice(0, 10))}, às ${esc(a.inicio.slice(11, 16))} com ${esc(a.profissional)} · ${brl(a.valor_centavos)}</span>${a.status === "confirmado" ? '<button type="button" class="bt sec" id="cCancelar">Cancelar este horário</button>' : ""}</div>`;
    } catch (x) { er.textContent = x.message; }
  });
  $("#cRes").addEventListener("click", async (e) => {
    if (!e.target.closest("#cCancelar")) return;
    if (!confirm("Cancelar este horário? Ele fica livre para outra pessoa.")) return;
    const er = $("#cErr"); er.textContent = "";
    try {
      await api("/cancelar", { method: "POST", body: JSON.stringify({ codigo: $("#cCod").value.trim().toUpperCase(), whatsapp: $("#cWhats").value.trim() }) });
      $("#cRes").innerHTML = '<div class="res">Horário cancelado. Obrigado por avisar!</div>'; toast("Horário cancelado.");
    } catch (x) { er.textContent = x.message; }
  });

  // cliente que já agendou antes: preenche os dados
  try {
    const c = JSON.parse(localStorage.getItem("sw_cliente") || "null");
    if (c) {
      $("#fNome").value = c.nome || ""; $("#fWhats").value = c.whats || ""; $("#cWhats").value = c.whats || "";
      if (c.pet) { $("#fPet").value = c.pet.nome || ""; E.especie = c.pet.especie || "cao"; E.porte = c.pet.porte || null; }
      const en = c.endereco;
      if (en) { $("#eCep").value = en.cep ? String(en.cep).replace(/^(\d{5})(\d{3})$/, "$1-$2") : ""; $("#eRua").value = en.rua || ""; $("#eNum").value = en.numero || ""; $("#eComp").value = en.complemento || ""; $("#eBairro").value = en.bairro || ""; $("#eCid").value = en.cidade || ""; $("#eUf").value = en.uf || ""; $("#eRef").value = en.referencia || ""; }
    }
  } catch {}
  inicio();
})();
