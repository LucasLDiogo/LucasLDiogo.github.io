"use strict";
// AgentWorks · site de venda (v2). Sem dependências além do GSAP local; funciona sem JS de animação.
(() => {
  const $ = (s, r = document) => r.querySelector(s), $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const reais = (c, casas = 2) => ((+c || 0) / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL", minimumFractionDigits: casas, maximumFractionDigits: casas });
  const reduz = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const G = typeof gsap !== "undefined" && !reduz ? gsap : null;
  const ST = G && typeof ScrollTrigger !== "undefined";
  if (ST) G.registerPlugin(ScrollTrigger);

  // ---------- já conectado: "Entrar" vira "Abrir meu painel" (nunca entra sozinho) ----------
  if ($('meta[name="aw-logado"]')) ["#entrar", "#entrar3"].forEach((s) => { const a = $(s); if (a) { a.textContent = "Abrir meu painel"; a.href = "/painel"; } });

  // ---------- planos ao vivo (LLD Works Hub) ----------
  const RECURSOS = {
    essencial: ["Robô com IA e menu", "Conversas e atendimento humano", "Clientes (CRM)", "Agenda com lembretes (própria ou do ServiceWorks)", "Catálogo e combos"],
    profissional: ["Tudo do Essencial", "Gestão da agenda (ocupação e alertas)", "Pedidos com aviso ao cliente", "Disparos para listas e grupos"],
    premium: ["Tudo do Profissional", "Webhooks para os seus sistemas", "Integrações e conectores"],
  };
  const PARA = {
    essencial: "Para quem está começando a atender pelo WhatsApp.",
    profissional: "Para quem tem equipe, agenda cheia e quer vender mais.",
    premium: "Para quem quer integrar o atendimento aos próprios sistemas.",
  };
  const NOMES_LIMITE = { atendentes: "usuários no painel", conversas_mes: "conversas com IA por mês" };
  const chave = (n) => String(n || "").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
  const desenhar = (planos) => {
    const box = $("#planos");
    if (!planos.length) { box.innerHTML = '<p class="carr">Nenhum plano à venda neste momento. Fale com a LLD Works: lucasldiogo@lldworks.com.br</p>'; return; }
    const ordem = [...planos].sort((a, b) => a.preco_centavos - b.preco_centavos);
    const meio = ordem.length === 3 ? ordem[1].id : null;
    box.innerHTML = ordem.map((p) => {
      const k = Object.keys(RECURSOS).find((r) => chave(p.nome).includes(r));
      const anual = p.ciclo === "anual", dia = Math.round(p.preco_centavos / (anual ? 365 : 30));
      const lim = Object.entries(p.limites || {}).map(([n, v]) => `<li class="lim">até ${Number(v).toLocaleString("pt-BR")} ${esc(NOMES_LIMITE[n] || n.replace(/_/g, " "))}</li>`).join("");
      return `<article class="pl ${p.id === meio ? "dest" : ""}">${p.id === meio ? '<span class="fita">MAIS ESCOLHIDO</span>' : ""}<h3>${esc(p.nome)}</h3>
        <p class="para">${esc(PARA[k] || "Atendimento com IA no WhatsApp do seu negócio.")}</p>
        <div class="preco">${reais(p.preco_centavos)}<small>/${anual ? "ano" : "mês"}</small></div>
        <span class="dia">≈ ${reais(dia)} por dia</span>
        <ul>${(RECURSOS[k] || []).map((r) => `<li>${esc(r)}</li>`).join("")}${lim}</ul>
        <a class="btn ${p.id === meio ? "b-pri" : "b-ver"}" href="/assinar?plano=${encodeURIComponent(p.id)}">Assinar o ${esc(p.nome)}</a></article>`;
    }).join("");
    if (G) G.from(".pl", { y: 40, opacity: 0, stagger: .1, duration: .6, ease: "power3.out", clearProps: "transform,opacity", scrollTrigger: ST ? { trigger: "#planos", start: "top 85%" } : undefined });
  };
  const RESERVA = [{ id: 1, nome: "Essencial", preco_centavos: 14900, ciclo: "mensal", limites: { atendentes: 2 } },
    { id: 2, nome: "Profissional", preco_centavos: 24900, ciclo: "mensal", limites: { atendentes: 5 } },
    { id: 3, nome: "Premium", preco_centavos: 39900, ciclo: "mensal", limites: { atendentes: 15 } }];
  fetch("/api/conta/produto", { credentials: "same-origin" }).then((r) => r.ok ? r.json() : Promise.reject(r.status))
    .then((d) => desenhar(d.planos || [])).catch(() => desenhar(RESERVA));

  // ---------- segmentos ----------
  const SEG = {
    pet: { t: "Pet shop", img: "pet", l: ["Preço por porte (P, M, G) calculado na hora", "Banho, tosa e hidratação na agenda certa", "Lembrete na véspera e aviso de “pronto para buscar”"],
      ex: [["c", "Tem horário pra tosa do Bob amanhã?"], ["a", "Tem sim! Amanhã às 14:00 ou 16:30. Qual prefere? 🐾"]] },
    salao: { t: "Salão e barbearia", img: "salao", l: ["Horário por profissional (Zé, Ana, Bia…)", "Combos como corte + barba com tempo somado", "Remarcação pelo próprio WhatsApp"],
      ex: [["c", "Corte e barba sábado de manhã?"], ["a", "Sábado com o Zé: 09:00 ou 10:30. Corte + barba sai R$ 65,00 ✂️"]] },
    clinica: { t: "Clínica e estética", img: "clinica", l: ["Confirmação de consulta com “1 Confirmar / 2 Reagendar”", "Orientações de preparo enviadas antes", "Passa para a recepção em dúvidas clínicas"],
      ex: [["c", "Quero marcar uma limpeza de pele"], ["a", "Claro! Quinta às 15:00 está livre. Posso reservar no seu nome?"]] },
    loja: { t: "Loja e delivery", img: "loja", l: ["Catálogo com preços e fotos no WhatsApp", "Pedido anotado com endereço e forma de pagamento", "Aviso automático quando o pedido sai para entrega"],
      ex: [["c", "Vocês têm ração de 15 kg?"], ["a", "Temos! Premium 15 kg por R$ 189,90. Quer que eu anote o pedido? 🛍️"]] },
  };
  const abas = $$(".abas [role=tab]");
  const mostrar = (k, foco) => {
    const d = SEG[k]; if (!d) return;
    abas.forEach((b) => { const on = b.dataset.seg === k; b.setAttribute("aria-selected", on); b.tabIndex = on ? 0 : -1; if (on && foco) b.focus(); });
    $("#painelSeg").setAttribute("aria-labelledby", "t-" + k);
    $("#segImg").src = `/pub/img/${d.img}.webp`; $("#segImg").alt = `Ilustração: ${d.t} atendendo pelo WhatsApp`;
    $("#segTit").textContent = d.t;
    $("#segLista").innerHTML = d.l.map((x) => `<li>${esc(x)}</li>`).join("");
    $("#segEx").innerHTML = d.ex.map(([t, x]) => `<div class="m ${t}">${esc(x)}</div>`).join("");
    if (G) G.from("#painelSeg img, #segTit, #segLista li, #segEx .m", { y: 18, opacity: 0, stagger: .06, duration: .45, ease: "power2.out", clearProps: "all" });
  };
  abas.forEach((b, i) => {
    b.addEventListener("click", () => mostrar(b.dataset.seg));
    b.addEventListener("keydown", (e) => {
      const n = e.key === "ArrowRight" ? 1 : e.key === "ArrowLeft" ? -1 : 0; if (!n) return;
      e.preventDefault(); mostrar(abas[(i + n + abas.length) % abas.length].dataset.seg, true);
    });
  });
  mostrar("pet");

  // ---------- calculadora ----------
  const v = (id) => +$(id).value;
  const calc = () => {
    const msg = v("#cMsg"), fora = v("#cFora") / 100, conv = v("#cConv") / 100, ticket = v("#cTicket"), min = v("#cMin");
    $("#oMsg").textContent = msg; $("#oFora").textContent = Math.round(fora * 100) + "%"; $("#oConv").textContent = Math.round(conv * 100) + "%";
    $("#oTicket").textContent = reais(ticket * 100, 0); $("#oMin").textContent = min + " min";
    const ag = Math.round(msg * 30 * fora * conv), rec = ag * ticket, horas = Math.round(msg * 30 * min / 60);
    $("#rAg").textContent = ag.toLocaleString("pt-BR"); $("#rRec").textContent = reais(rec * 100, 0); $("#rHoras").textContent = horas.toLocaleString("pt-BR") + " h";
  };
  $$(".ctrl input").forEach((i) => i.addEventListener("input", calc)); calc();

  // ---------- conversa animada do herói ----------
  const roteiro = [
    ["c", "Oi! Quanto é o banho pra um beagle?"],
    ["a", "Oi! Eu sou a Luna, do Pet Shop Patinhas 🐾 Beagle é porte médio: o banho fica R$ 70,00. Quer marcar?", "preco"],
    ["c", "Quero! Terça às 10h dá?"],
    ["tool", "consultando a agenda…", "hora"],
    ["a", "Terça às 10:00 está livre ✔ Banho (médio), R$ 70,00. Qual o nome do seu cão?"],
    ["c", "Thor. Pode marcar!"],
    ["tool", "agendando…"],
    ["a", "Marcado! Terça às 10:00, código AG-7K3M. Na véspera eu te lembro por aqui 😉", "sino"],
  ];
  const conv = $("#conv"), slot = $("#slot10"), st = $("#st");
  const chip = (k) => $$(".flutua").forEach((c) => c.classList.toggle("on", c.dataset.k === k));
  const bolha = (tipo, txt) => { const d = document.createElement("div"); d.className = "m " + tipo; if (tipo === "t") d.innerHTML = "<i></i><i></i><i></i>"; else d.textContent = txt; conv.appendChild(d); while (conv.children.length > 7) conv.firstChild.remove(); return d; };
  const marcar = () => { slot.className = "novo"; slot.textContent = "Banho · Thor"; };
  if (!G) { roteiro.filter((r) => r[0] !== "tool").slice(-5).forEach((r) => bolha(r[0], r[1])); marcar(); return estatico(); }
  const espera = (s) => new Promise((r) => setTimeout(r, s * 1000));
  const entra = (el) => G.from(el, { y: 14, opacity: 0, scale: .96, duration: .35, ease: "back.out(1.6)" });
  let visivel = true;
  if ("IntersectionObserver" in window) new IntersectionObserver(([e]) => { visivel = e.isIntersecting; }).observe($(".palco"));
  (async () => { for (;;) {
    while (!visivel || document.hidden) await espera(.5);
    conv.innerHTML = ""; chip(null); slot.className = "vz"; slot.textContent = "livre";
    for (const [tipo, txt, k] of roteiro) {
      if (tipo === "a") { st.textContent = "digitando…"; const t = bolha("t"); entra(t); G.to(t.children, { y: -3, repeat: 5, yoyo: true, stagger: .12, duration: .2 }); await espera(1.1); t.remove(); st.textContent = "online"; }
      const el = bolha(tipo, txt); entra(el); if (k) chip(k);
      if (tipo === "tool" && !k) { await espera(.9); marcar(); G.fromTo(slot, { scale: .6, opacity: 0 }, { scale: 1, opacity: 1, duration: .6, ease: "elastic.out(1,.55)" }); }
      await espera(tipo === "c" ? 1.3 : 1.6);
    }
    await espera(3.5);
  } })();

  // ---------- entrada do herói ----------
  const tl = G.timeline({ defaults: { ease: "power3.out" } });
  tl.from(".barra", { y: -30, opacity: 0, duration: .6 })
    .from(".selo-topo", { y: 16, opacity: 0, duration: .5 }, "-=.3")
    .from(".hero h1", { y: 40, opacity: 0, duration: .8 }, "-=.25")
    .from(".hero .sub, .hero .acoes, .garantias", { y: 24, opacity: 0, stagger: .08, duration: .6 }, "-=.5")
    .from(".fone", { y: 80, rotate: -4, opacity: 0, duration: 1 }, "-=.9")
    .from(".flutua", { scale: .6, opacity: 0, stagger: .12, duration: .6, ease: "back.out(1.8)" }, "-=.5")
    .from(".agendado", { x: 40, opacity: 0, duration: .6 }, "-=.4");
  G.to(".flutua.f1", { y: -10, duration: 2.6, repeat: -1, yoyo: true, ease: "sine.inOut" });
  G.to(".flutua.f2", { y: 12, duration: 3.1, repeat: -1, yoyo: true, ease: "sine.inOut" });
  G.to(".flutua.f3", { y: -8, duration: 2.2, repeat: -1, yoyo: true, ease: "sine.inOut" });
  $$(".aurora i").forEach((o, i) => G.to(o, { x: (i % 2 ? -1 : 1) * 60, y: (i < 2 ? 1 : -1) * 40, duration: 9 + i * 2, repeat: -1, yoyo: true, ease: "sine.inOut" }));

  // ---------- botões magnéticos e cartões com inclinação (só com mouse) ----------
  if (matchMedia("(hover: hover) and (pointer: fine)").matches) {
    $$(".ima").forEach((b) => {
      b.addEventListener("mousemove", (e) => { const r = b.getBoundingClientRect(); G.to(b, { x: (e.clientX - r.left - r.width / 2) * .25, y: (e.clientY - r.top - r.height / 2) * .35, duration: .3 }); });
      b.addEventListener("mouseleave", () => G.to(b, { x: 0, y: 0, duration: .5, ease: "elastic.out(1,.4)" }));
    });
    $$(".tilt").forEach((c) => {
      c.addEventListener("mousemove", (e) => { const r = c.getBoundingClientRect(), x = (e.clientX - r.left) / r.width - .5, y = (e.clientY - r.top) / r.height - .5; G.to(c, { rotateY: x * 10, rotateX: -y * 10, transformPerspective: 700, duration: .35 }); });
      c.addEventListener("mouseleave", () => G.to(c, { rotateX: 0, rotateY: 0, duration: .6 }));
    });
  }

  if (!ST) { $("#fixo").classList.add("on"); return; }
  // ---------- rolagem ----------
  G.to(".progresso", { scaleX: 1, ease: "none", scrollTrigger: { start: 0, end: "max", scrub: .2 } });
  ScrollTrigger.create({ trigger: ".hero", start: "bottom 70%", onEnter: () => $("#fixo").classList.add("on"), onLeaveBack: () => $("#fixo").classList.remove("on") });
  G.to(".hero .grid", { yPercent: -6, ease: "none", scrollTrigger: { trigger: ".hero", start: "top top", end: "bottom top", scrub: true } });
  const sobe = (sel, gat, extra = {}) => G.from(sel, { y: 40, opacity: 0, stagger: .1, duration: .7, ease: "power3.out", scrollTrigger: { trigger: gat || sel, start: "top 85%" }, ...extra });
  $$(".band h2").forEach((h) => G.from(h, { y: 30, opacity: 0, duration: .7, ease: "power3.out", scrollTrigger: { trigger: h, start: "top 88%" } }));
  sobe(".dor", ".dores", { rotate: (i) => (i - 1) * 3 });
  sobe(".virada", ".virada", { scale: .94 });
  G.to(".linha i", { scaleX: 1, ease: "none", scrollTrigger: { trigger: ".passos", start: "top 75%", end: "bottom 60%", scrub: .5 } });
  sobe(".passo", ".passos");
  G.from(".passo .n", { scale: 0, rotate: -90, stagger: .2, duration: .6, ease: "back.out(2)", scrollTrigger: { trigger: ".passos", start: "top 80%" } });
  sobe("#recursos .rec", "#recursos .g4");
  sobe(".ctrl > div", ".calc .grid");
  sobe(".res > div", ".res", { scale: .9 });
  sobe("#conexao .op", "#conexao .g2");
  sobe(".tabela tbody tr", ".tabela", { y: 16, x: -20 });
  sobe(".sw .caixa .lin", ".sw .caixa", { x: 30, y: 0 });
  sobe(".faq details", ".faq", { y: 20 });
  sobe(".fim .luna", ".fim", { scale: .5, ease: "back.out(2)" });
  // números das dores contam ao aparecer
  $$(".dor .n").forEach((n) => {
    const m = n.textContent.match(/^(\d+)(.*)$/); if (!m) return;
    const alvo = +m[1], o = { v: 0 };
    G.to(o, { v: alvo, duration: 1.2, ease: "power2.out", scrollTrigger: { trigger: n, start: "top 90%" }, onUpdate: () => { n.textContent = Math.round(o.v) + m[2]; } });
  });
  addEventListener("load", () => ScrollTrigger.refresh());

  function estatico() { /* sem animação: tudo já visível; o CTA fixo aparece sempre no celular */ $("#fixo").classList.add("on"); }
})();
