// LLD Works — motor comum dos sites de venda (RHWorks, SocialWorks, SalesWorks, PageWorks, ProWorks): planos do Hub, vídeo, passos com cena e animações GSAP.
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

// PageWorks — configuração do site de venda (gerado por gera_sites.py).
LWSite({
  nome: "PageWorks", painel: "/app", seloDestaque: "CRIAÇÃO + 12 MESES",
  icones: {"design": "<path d=\"M12 19l7-7 3 3-7 7-3-3z\"/><path d=\"M18 13l-1.5-7.5L2 2l3.5 14.5L13 18l5-5z\"/><circle cx=\"11\" cy=\"11\" r=\"2\"/>", "raio": "<path d=\"M13 2L3 14h9l-1 8 10-12h-9l1-8z\"/>", "busca": "<circle cx=\"11\" cy=\"11\" r=\"7\"/><path d=\"M21 21l-4.3-4.3\"/>", "mapa": "<path d=\"M12 21s-7-6.2-7-12a7 7 0 0 1 14 0c0 5.8-7 12-7 12z\"/><circle cx=\"12\" cy=\"9\" r=\"2.5\"/>", "zap": "<path d=\"M3 21l1.6-4.8A8.5 8.5 0 1 1 8 19.6z\"/>", "celular": "<rect x=\"6\" y=\"2\" width=\"12\" height=\"20\" rx=\"2.5\"/><path d=\"M11 18h2\"/>", "movimento": "<path d=\"M4 12c3-6 6 6 9 0s6 6 9 0\"/>", "form": "<rect x=\"4\" y=\"3\" width=\"16\" height=\"18\" rx=\"2\"/><path d=\"M8 8h8M8 12h8M8 16h5\"/>", "cadeado": "<rect x=\"4\" y=\"11\" width=\"16\" height=\"10\" rx=\"2\"/><path d=\"M8 11V7a4 4 0 0 1 8 0v4\"/>", "grafico": "<path d=\"M4 20V10M10 20V4M16 20v-7M22 20H2\"/>", "lapis": "<path d=\"M12 20h9\"/><path d=\"M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z\"/>", "dominio": "<circle cx=\"12\" cy=\"12\" r=\"9\"/><path d=\"M3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18\"/>", "pessoa": "<circle cx=\"12\" cy=\"8\" r=\"4\"/><path d=\"M4 21c1-4.5 4.2-7 8-7s7 2.5 8 7\"/>", "trofeu": "<path d=\"M8 21h8M12 17v4M7 4h10v5a5 5 0 0 1-10 0z\"/><path d=\"M17 5h3v2a3 3 0 0 1-3 3M7 5H4v2a3 3 0 0 0 3 3\"/>", "pasta": "<path d=\"M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z\"/>", "linkedin": "<rect x=\"3\" y=\"3\" width=\"18\" height=\"18\" rx=\"3\"/><path d=\"M8 10v7M8 7v.01M12 17v-4a2 2 0 0 1 4 0v4M12 10v7\"/>", "pdf": "<path d=\"M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z\"/><path d=\"M14 3v6h6M8 14h8M8 18h5\"/>"},
  recursos: [["design", "Design exclusivo", "Layout pensado para o seu negócio, com a sua marca, fotos e cores. Nada de tema pronto.", ""], ["raio", "Rápido de verdade", "Imagens otimizadas e código enxuto para abrir em menos de 2 segundos no celular.", ""], ["busca", "Aparece no Google", "SEO técnico, título e descrição de cada página, mapa do site e dados estruturados.", ""], ["mapa", "Google Meu Negócio", "Orientação para ligar o site ao seu perfil no Maps e aparecer na busca local.", ""], ["zap", "WhatsApp com mensagem pronta", "Botão flutuante e chamadas que abrem o WhatsApp já com o assunto escrito.", ""], ["celular", "Perfeito no celular", "Pensado primeiro para a tela pequena, onde está a maior parte dos seus clientes.", ""], ["movimento", "Animações e acabamento", "Movimento suave nas seções e microinterações que passam confiança.", ""], ["form", "Formulários e agendamento", "Formulário de contato, pedido de orçamento ou agenda, conforme o seu negócio.", ""], ["cadeado", "Hospedagem e SSL", "Site na nuvem, com cadeado de segurança e cópia de segurança. Sem servidor para cuidar.", "Incluso"], ["grafico", "Métricas de visita", "Quantas pessoas entram, de onde vêm e o que mais olham.", ""], ["lapis", "Ajustes todo mês", "Troca de textos, fotos, preços e horários sem custo extra.", "Incluso"], ["dominio", "Seu domínio", "No domínio que você já tem (ou registramos um) ou em nome.lldworks.com.br.", ""]],
  para: (p, i) => "Para negócios que querem ser encontrados e atender pelo WhatsApp.",
  itens: (p) => ["Site exclusivo de até 5 seções ou páginas", "Texto profissional escrito para você", "SEO técnico e Google Meu Negócio", "Botão de WhatsApp com mensagem pronta", "Hospedagem, SSL e cópia de segurança", "Ajustes de texto e foto todo mês", "Pronto em até 5 dias úteis"].concat((p.limites && p.limites.mensal_centavos) ? ["Do 2º ano em diante: " + (p.limites.mensal_centavos / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" }) + " por mês"] : []),
  heroVisual: ".foto",
  heroExtra(g, tl) { tl.fromTo(".c2 .arco", { strokeDashoffset: 201 }, { strokeDashoffset: 6, duration: 1.6, ease: "power3.out" }, 0.8); },
  depois({ $, $$ }) {
    $$(".ex-abas button").forEach((b) => b.addEventListener("click", () => {
      $$(".ex-abas button").forEach((x) => x.setAttribute("aria-selected", String(x === b)));
      $$("[data-palco]").forEach((p) => (p.hidden = p.dataset.palco !== b.dataset.ex));
      if (window.gsap && !matchMedia("(prefers-reduced-motion: reduce)").matches) gsap.from(`[data-palco="${b.dataset.ex}"] > *`, { y: 30, opacity: 0, duration: 0.6, stagger: 0.08, ease: "power3.out" });
    }));
  },
  scroll(g) {
    g.to(".foto img", { yPercent: 8, scale: 1.08, ease: "none", scrollTrigger: { trigger: ".hero", start: "top top", end: "bottom top", scrub: true } });
    g.from(".ex-note", { y: 60, opacity: 0, duration: 1, ease: "expo.out", scrollTrigger: { trigger: ".exemplos", start: "top 70%" } });
    g.from(".ex-fone", { y: 120, rotate: 6, opacity: 0, duration: 1.1, ease: "expo.out", scrollTrigger: { trigger: ".exemplos", start: "top 65%" } });
    g.from(".ex-info > *", { x: 30, opacity: 0, duration: 0.6, stagger: 0.08, scrollTrigger: { trigger: ".ex-info", start: "top 85%" } });
  },
});
