// LLD Works — motor comum dos sites de venda (RHWorks, SocialWorks): planos do Hub, vídeo, passos com cena e animações GSAP.
// Respeita "reduzir movimento": sem animação, tudo aparece no lugar.
function LWSite(cfg) {
  "use strict";
  const $ = (s, r = document) => r.querySelector(s), $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const calmo = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const brl = (c) => (c / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL", minimumFractionDigits: c % 100 ? 2 : 0 });
  const ic = (n) => `<span class="ic" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${cfg.icones[n] || ""}</svg></span>`;

  // recursos
  const lr = $("#recursosLista");
  if (lr) lr.innerHTML = cfg.recursos.map(([i, t, d, p]) => `<article class="rec">${ic(i)}<h3>${esc(t)}</h3><p>${esc(d)}</p>${p ? `<span class="pl">${esc(p)}</span>` : ""}</article>`).join("");

  // planos do Hub (mesmos preços do /assinar)
  const cards = $("#cardsPlanos");
  function desenha(P) {
    const lst = (P.planos || []).slice().sort((a, b) => a.preco_centavos - b.preco_centavos);
    cards.innerHTML = lst.map((p, i) => {
      const d = lst.length > 1 && i === lst.length - 1;
      return `<article class="plano ${d ? "destaque" : ""}">${d ? `<span class="selo">${esc(cfg.seloDestaque || "MAIS COMPLETO")}</span>` : ""}
        <h3>${esc(p.nome)}</h3><p class="para">${esc(cfg.para(p, i, lst.length))}</p>
        <div class="preco">${brl(p.preco_centavos)}<small>/${p.ciclo === "anual" ? "ano" : "mês"}</small></div>
        <ul>${cfg.itens(p).map((t) => `<li>${esc(t)}</li>`).join("")}</ul>
        <a class="b ${d ? "pri" : ""} grande" href="/assinar?plano=${encodeURIComponent(p.id)}">Assinar ${esc(p.nome)}</a></article>`;
    }).join("") || '<p class="carregando">Nenhum plano à venda agora. <a href="/assinar">Ver a página de assinatura</a>.</p>';
    if (window.gsap && !calmo) gsap.from(".plano", { y: 30, opacity: 0, duration: 0.6, stagger: 0.1, ease: "power3.out" });
  }
  fetch("/api/conta/produto", { credentials: "same-origin" }).then((r) => (r.ok ? r.json() : Promise.reject())).then((d) => {
    desenha(d);
    const z = $("#ctaZap");
    if (z && d.whatsapp) { const n = String(d.whatsapp).replace(/\D/g, ""); z.href = `https://wa.me/${n.startsWith("55") ? n : "55" + n}?text=${encodeURIComponent(`Olá! Quero conhecer o ${cfg.nome}.`)}`; z.hidden = false; }
  }).catch(() => { cards.innerHTML = '<p class="carregando">Não consegui carregar os planos agora. <a href="/assinar">Ver os planos na página de assinatura</a>.</p>'; });

  // quem já tem sessão vê "Ir para o painel"
  if (document.querySelector('meta[name="lw-logado"]')) $$("[data-entrar]").forEach((a) => { a.textContent = "Ir para o painel"; a.href = cfg.painel || "/app"; });

  // vídeo: o botão grande dá o play
  const vb = $(".video-box"), v = $("#tour");
  if (vb && v) {
    $(".play", vb)?.addEventListener("click", () => { vb.classList.add("tocando"); v.play().catch(() => {}); });
    v.addEventListener("play", () => vb.classList.add("tocando"));
  }

  // topo e barra de progresso
  const topo = $(".topo"), barra = $(".progresso i");
  const rolar = () => { topo.classList.toggle("rolou", scrollY > 10); if (barra) barra.style.transform = `scaleX(${Math.min(1, scrollY / Math.max(1, document.documentElement.scrollHeight - innerHeight))})`; };
  addEventListener("scroll", rolar, { passive: true }); rolar();

  // passos: a cena do palco acompanha o passo em foco (funciona sem GSAP)
  const passos = $$(".passo"), cenas = $$(".cena");
  const ativa = (k) => { passos.forEach((p, i) => p.classList.toggle("ativo", i === k)); cenas.forEach((c, i) => c.classList.toggle("ativa", i === k)); };
  if (passos.length && cenas.length) {
    ativa(0);
    const io = new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting) ativa(passos.indexOf(e.target)); }), { rootMargin: "-45% 0px -45% 0px" });
    passos.forEach((p) => { io.observe(p); p.addEventListener("mouseenter", () => ativa(passos.indexOf(p))); p.addEventListener("focusin", () => ativa(passos.indexOf(p))); });
  }
  if (cfg.depois) cfg.depois({ $, $$, calmo, esc });

  if (calmo) return;
  // botões magnéticos
  $$(".mag").forEach((b) => {
    b.addEventListener("pointermove", (e) => { const r = b.getBoundingClientRect(); b.style.transform = `translate(${(e.clientX - r.left - r.width / 2) * 0.18}px,${(e.clientY - r.top - r.height / 2) * 0.28}px)`; });
    b.addEventListener("pointerleave", () => { b.style.transform = ""; });
  });

  addEventListener("load", () => {
    const g = window.gsap; if (!g) return;
    if (window.ScrollTrigger) g.registerPlugin(ScrollTrigger);
    const tl = g.timeline({ defaults: { ease: "power4.out" } });
    tl.from(".hero .eti", { y: 14, opacity: 0, duration: 0.5 })
      .from(".titulo .ln", { yPercent: 60, opacity: 0, rotate: 2, duration: 0.9, stagger: 0.12 }, "-=0.2")
      .from(".hero .lead, .hero .cta, .hero .selos", { y: 18, opacity: 0, duration: 0.6, stagger: 0.08 }, "-=0.5")
      .from(cfg.heroVisual || ".hero-vis > :first-child", { scale: 0.92, opacity: 0, duration: 1.1, ease: "expo.out" }, 0.15)
      .from(".hero .cartao", { y: 30, scale: 0.85, opacity: 0, duration: 0.7, stagger: 0.14, ease: "back.out(1.7)" }, 0.7);
    if (cfg.heroExtra) cfg.heroExtra(g, tl);
    g.to(".hero .cartao", { y: (i) => (i % 2 ? 9 : -9), duration: 2.6, yoyo: true, repeat: -1, ease: "sine.inOut", stagger: 0.4, delay: 1.8 });
    if (!window.ScrollTrigger) return;
    g.utils.toArray(".sec h2, .sec > .eti, .sec .sub").forEach((el) => g.from(el, { y: 34, opacity: 0, duration: 0.8, ease: "power3.out", scrollTrigger: { trigger: el, start: "top 88%" } }));
    g.from(".faixa > div", { y: 26, opacity: 0, duration: 0.6, stagger: 0.08, scrollTrigger: { trigger: ".faixa", start: "top 92%" } });
    g.from(".rec", { y: 40, opacity: 0, duration: 0.6, stagger: 0.05, ease: "power2.out", scrollTrigger: { trigger: "#recursosLista", start: "top 82%" } });
    g.from(".passo", { x: -30, opacity: 0, duration: 0.6, stagger: 0.1, scrollTrigger: { trigger: ".passos", start: "top 80%" } });
    g.from(".video-box", { scale: 0.9, opacity: 0, duration: 1, ease: "expo.out", scrollTrigger: { trigger: ".video-box", start: "top 85%" } });
    g.from(".faq details", { y: 18, opacity: 0, duration: 0.45, stagger: 0.06, scrollTrigger: { trigger: ".faq", start: "top 85%" } });
    g.from(".final", { y: 60, opacity: 0, duration: 1, ease: "expo.out", scrollTrigger: { trigger: ".final", start: "top 88%" } });
    if (cfg.scroll) cfg.scroll(g);
  });
}
// RHWorks — configuração do site de venda (rhworks.lldworks.com.br).
LWSite({
  nome: "RHWorks",
  painel: "/app",
  seloDestaque: "PARA QUEM CONTRATA MUITO",
  icones: {
    vaga: '<rect x="3" y="7" width="18" height="13" rx="2"/><path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M3 13h18"/>',
    link: '<path d="M10 13a5 5 0 0 0 7.1 0l3-3a5 5 0 0 0-7.1-7.1l-1.7 1.7"/><path d="M14 11a5 5 0 0 0-7.1 0l-3 3a5 5 0 0 0 7.1 7.1l1.7-1.7"/>',
    doc: '<path d="M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"/><path d="M14 3v6h6M8 13h8M8 17h5"/>',
    alvo: '<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1.5"/>',
    ia: '<path d="M12 3l1.8 5 5.2 1.8-5.2 1.8L12 17l-1.8-5.4L5 9.8 10.2 8z"/><path d="M19 15l.8 2 2 .8-2 .8-.8 2-.8-2-2-.8 2-.8z"/>',
    ranking: '<path d="M8 21V11M12 21V5M16 21v-7M4 21h16"/>',
    comparar: '<rect x="3" y="4" width="7" height="16" rx="2"/><rect x="14" y="4" width="7" height="16" rx="2"/>',
    roteiro: '<path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/><path d="M8 9h8M8 13h5"/>',
    olho: '<path d="M3 3l18 18M10.6 10.6a2 2 0 0 0 2.8 2.8M9.9 5.1A10 10 0 0 1 12 5c6.4 0 10 7 10 7a17 17 0 0 1-3.1 3.9M6.6 6.6C3.9 8.4 2 12 2 12s3.6 7 10 7a9.6 9.6 0 0 0 5.4-1.6"/>',
    relatorio: '<path d="M6 2h9l5 5v15H6z"/><path d="M14 2v6h6M9 13h6M9 17h6"/>',
    equipe: '<circle cx="9" cy="8" r="3.5"/><path d="M2.5 20c.8-3.6 3.4-5.5 6.5-5.5s5.7 1.9 6.5 5.5"/><circle cx="17" cy="9" r="2.6"/><path d="M16.5 14.5c2.6 0 4.4 1.6 5 4.5"/>',
    escudo: '<path d="M12 3l8 3v6c0 4.5-3.4 8.3-8 9-4.6-.7-8-4.5-8-9V6z"/><path d="M9 12l2 2 4-4"/>',
  },
  recursos: [
    ["vaga", "Vaga com critérios e pesos", "Competências obrigatórias e desejáveis, experiência, formação, idiomas, cidade e modelo de trabalho. Você decide quanto cada um vale.", ""],
    ["link", "Link de candidatura", "Um endereço por vaga para divulgar no LinkedIn, no WhatsApp e no site. O candidato envia tudo pelo celular.", "Novo"],
    ["doc", "PDF, Word e LinkedIn", "Lê currículos em PDF e Word e o PDF do perfil do LinkedIn. Nome, e-mail, telefone e LinkedIn saem do próprio texto.", ""],
    ["alvo", "Nota de aderência 0 a 100", "Cada critério vira uma nota com a evidência encontrada no currículo. Sem caixa-preta.", ""],
    ["ia", "Parecer da IA", "Resumo, pontos fortes, pontos de atenção e o que validar, escritos em português simples.", ""],
    ["ranking", "Ranking por vaga", "Quem tem mais aderência aparece primeiro, com filtro por indicação e busca por palavra.", ""],
    ["comparar", "Comparar candidatos", "Lado a lado, critério por critério, para decidir entre os finalistas.", ""],
    ["roteiro", "Roteiro de entrevista", "Perguntas sugeridas para cada pessoa, a partir do que falta confirmar no currículo.", ""],
    ["olho", "Triagem às cegas", "Esconde nome e dados pessoais durante a análise para reduzir vieses.", ""],
    ["relatorio", "Relatório da vaga", "Quem vale conversar, ranking completo e o perfil usado, pronto para imprimir ou salvar em PDF.", ""],
    ["equipe", "Decisão do RH", "Chamar para entrevista, manter em análise ou não seguir, com anotações por candidato.", ""],
    ["escudo", "Dados protegidos", "Login e senha, conexão protegida e os dados de cada empresa separados.", ""],
  ],
  para: (p, i, n) => (i === 0 && n > 1 ? "Para quem abre poucas vagas por vez." : "Para quem contrata o ano todo ou faz recrutamento para clientes."),
  itens: (p) => {
    const l = p.limites || {}, o = [];
    o.push(l.vagas_ativas ? `Até ${l.vagas_ativas} vagas abertas ao mesmo tempo` : "Vagas abertas conforme o plano");
    o.push("Link de candidatura por vaga", "Nota de aderência e parecer da IA", "Ranking, comparação e roteiro de entrevista", "Relatório da vaga em PDF", "Suporte LLD Works");
    return o;
  },
  heroVisual: ".foto",
  heroExtra(g, tl) {
    // contadores das notas e anel de aderência
    document.querySelectorAll(".nota-c").forEach((el, i) => { const o = { v: 0 }; tl.to(o, { v: +el.dataset.n, duration: 1.4, ease: "power2.out", onUpdate: () => (el.textContent = Math.round(o.v)) }, 0.9 + i * 0.12); });
    const an = document.querySelector(".anel-n"), o = { v: 0 };
    tl.fromTo(".anel .arco", { strokeDashoffset: 201 }, { strokeDashoffset: 16, duration: 1.6, ease: "power3.out" }, 0.8)
      .to(o, { v: 92, duration: 1.6, ease: "power3.out", onUpdate: () => (an.textContent = Math.round(o.v)) }, 0.8);
  },
  scroll(g) {
    g.to(".foto img", { yPercent: 8, scale: 1.08, ease: "none", scrollTrigger: { trigger: ".hero", start: "top top", end: "bottom top", scrub: true } });
    g.from(".foto2", { x: -60, opacity: 0, duration: 1, ease: "expo.out", scrollTrigger: { trigger: ".link-sec", start: "top 75%" } });
    g.from(".fone", { y: 120, rotate: 8, opacity: 0, duration: 1.1, ease: "expo.out", scrollTrigger: { trigger: ".link-sec", start: "top 70%" } });
    g.from(".justo-grid article", { y: 40, opacity: 0, duration: 0.7, stagger: 0.12, scrollTrigger: { trigger: ".justo-card", start: "top 78%" } });
    g.from(".lista-ck li", { x: -20, opacity: 0, duration: 0.5, stagger: 0.08, scrollTrigger: { trigger: ".lista-ck", start: "top 85%" } });
  },
});
