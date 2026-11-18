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
// SocialWorks — configuração do site de venda (socialworks.lldworks.com.br).
LWSite({
  nome: "SocialWorks",
  painel: "/app",
  seloDestaque: "PARA AGÊNCIAS",
  icones: {
    cal: '<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4"/>',
    reels: '<rect x="3" y="3" width="18" height="18" rx="4"/><path d="M3 8h18M8 3l3 5M14 3l3 5"/><path d="M10 12.5v5l4.5-2.5z"/>',
    ia: '<path d="M12 3l1.8 5 5.2 1.8-5.2 1.8L12 17l-1.8-5.4L5 9.8 10.2 8z"/><path d="M19 15l.8 2 2 .8-2 .8-.8 2-.8-2-2-.8 2-.8z"/>',
    msg: '<path d="M21 12a8 8 0 0 1-11.6 7.1L4 20.5l1.4-5.1A8 8 0 1 1 21 12z"/><path d="M8.5 12h7"/>',
    raio: '<path d="M13 2 4 14h7l-1 8 9-12h-7z"/>',
    caixa: '<path d="M22 12h-6l-2 3h-4l-2-3H2"/><path d="M5.5 5h13l3.5 7v6a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2v-6z"/>',
    grafico: '<path d="M3 17l6-6 4 4 8-8"/><path d="M15 7h6v6"/>',
    pilar: '<path d="M12 2 2 7l10 5 10-5z"/><path d="M2 17l10 5 10-5M2 12l10 5 10-5"/>',
    perfis: '<circle cx="9" cy="8" r="3.5"/><path d="M2.5 20c.8-3.6 3.4-5.5 6.5-5.5s5.7 1.9 6.5 5.5"/><circle cx="17" cy="9" r="2.6"/><path d="M16.5 14.5c2.6 0 4.4 1.6 5 4.5"/>',
    teste: '<path d="M9 3h6M10 3v6L4.5 18.5A2 2 0 0 0 6.2 21.5h11.6a2 2 0 0 0 1.7-3L14 9V3"/><path d="M7 15h10"/>',
    aviso: '<path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.7 21a2 2 0 0 1-3.4 0"/>',
    escudo: '<path d="M12 3l8 3v6c0 4.5-3.4 8.3-8 9-4.6-.7-8-4.5-8-9V6z"/><path d="M9 12l2 2 4-4"/>',
  },
  recursos: [
    ["cal", "Calendário de conteúdo", "Mês e semana com cada post no dia certo, do rascunho ao publicado.", ""],
    ["reels", "Feed, carrossel, reels e story", "Agende qualquer formato com a legenda pronta. Publicação automática no horário.", ""],
    ["ia", "Ideias e legendas com IA", "Sugestões por pilar (educar, bastidores, vender, prova social) com legendas e hashtags.", ""],
    ["msg", "Comentário → Direct", "Palavra-chave no comentário dispara resposta pública e mensagem privada.", ""],
    ["raio", "Respostas no Direct", "Palavra-chave, boas-vindas no primeiro contato e resposta a quem responde o story.", "Novo"],
    ["caixa", "Caixa de entrada", "Comentários e mensagens num só lugar, com o que já foi respondido e o que falta.", ""],
    ["grafico", "Resultados de cada post", "Alcance, curtidas, comentários, salvamentos e compartilhamentos direto da Meta.", "Novo"],
    ["pilar", "Relatórios", "Posts por semana, formatos, pilares e as automações que mais responderam.", ""],
    ["perfis", "Vários perfis", "No plano Agência, até 10 perfis do Instagram com o mesmo login.", ""],
    ["teste", "Teste antes de ligar", "Simule um comentário ou mensagem e veja a resposta antes de ativar.", ""],
    ["aviso", "Aviso de falha", "Se o Instagram recusar uma publicação, o post fica marcado com o motivo.", ""],
    ["escudo", "Conta segura", "API oficial, sem senha guardada. A chave de acesso fica cifrada.", ""],
  ],
  para: (p, i, n) => (i === 0 && n > 1 ? "Para o seu negócio: um perfil, todos os recursos." : "Para agências e social media que cuidam de vários clientes."),
  itens: (p) => {
    const l = p.limites || {}, c = +l.contas || 0, o = [];
    o.push(c ? (c === 1 ? "1 perfil do Instagram" : `Até ${c} perfis do Instagram`) : "Perfis conforme o plano");
    o.push("Agenda de feed, carrossel, reels e story", "Automações: comentário → Direct e palavras-chave", "Ideias e legendas com IA", "Caixa de entrada e resultados de cada post", "Suporte LLD Works");
    return o;
  },
  heroVisual: ".foto",
  heroExtra(g, tl) {
    tl.from(".chat .msg", { y: 16, opacity: 0, scale: 0.9, duration: 0.45, stagger: 0.55, ease: "back.out(2)", transformOrigin: "bottom" }, 1.1);
    const el = document.querySelector(".alc-n"), o = { v: 0 };
    tl.to(o, { v: 12480, duration: 1.8, ease: "power2.out", onUpdate: () => (el.textContent = Math.round(o.v).toLocaleString("pt-BR")) }, 0.9);
  },
  scroll(g) {
    g.to(".foto img", { yPercent: 8, scale: 1.08, ease: "none", scrollTrigger: { trigger: ".hero", start: "top top", end: "bottom top", scrub: true } });
    g.from(".gatilhos article", { y: 30, opacity: 0, duration: 0.6, stagger: 0.1, scrollTrigger: { trigger: ".gatilhos", start: "top 85%" } });
    g.from(".auto-vis img", { scale: 0.88, opacity: 0, duration: 1, ease: "expo.out", scrollTrigger: { trigger: ".auto-vis", start: "top 80%" } });
    g.from(".bolha", { x: (i) => (i === 2 ? 40 : -40), opacity: 0, duration: 0.6, stagger: 0.35, ease: "back.out(1.6)", scrollTrigger: { trigger: ".auto-vis", start: "top 70%" } });
    g.from(".claro-card", { y: 50, opacity: 0, duration: 0.9, ease: "expo.out", scrollTrigger: { trigger: ".claro-card", start: "top 85%" } });
  },
});
