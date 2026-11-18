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
// SalesWorks — configuração do site de venda (salesworks.lldworks.com.br).
LWSite({
  nome: "SalesWorks",
  painel: "/app",
  seloDestaque: "TUDO INCLUÍDO",
  icones: {
    loja: '<path d="M3 9l1.5-5h15L21 9M3 9v11h18V9M3 9h18M9 20v-6h6v6"/>',
    carrinho: '<circle cx="9" cy="20" r="1.5"/><circle cx="18" cy="20" r="1.5"/><path d="M2 3h3l2.6 12.4a2 2 0 0 0 2 1.6h8.6a2 2 0 0 0 2-1.5L22 7H6"/>',
    quadro: '<rect x="3" y="4" width="5" height="16" rx="1.5"/><rect x="10" y="4" width="5" height="11" rx="1.5"/><rect x="17" y="4" width="4" height="7" rx="1.5"/>',
    sacola: '<path d="M6 8h12l-1 12H7z"/><path d="M9 8V6a3 3 0 0 1 6 0v2"/><path d="M9 13l2 2 4-4"/>',
    moto: '<circle cx="6" cy="17" r="3"/><circle cx="18" cy="17" r="3"/><path d="M9 17h6l-2-7H9M13 10h3l2 7M5 10h4"/>',
    caixa: '<path d="M21 8l-9-5-9 5 9 5 9-5zM3 8v8l9 5 9-5V8M12 13v8"/>',
    pessoas: '<circle cx="9" cy="8" r="3.5"/><path d="M2.5 20c.8-3.6 3.4-5.5 6.5-5.5s5.7 1.9 6.5 5.5"/><circle cx="17" cy="9" r="2.6"/><path d="M16.5 14.5c2.6 0 4.4 1.6 5 4.5"/>',
    cupom: '<path d="M3 9a2 2 0 0 0 0 6v3a1 1 0 0 0 1 1h16a1 1 0 0 0 1-1v-3a2 2 0 0 0 0-6V6a1 1 0 0 0-1-1H4a1 1 0 0 0-1 1z"/><path d="M15 9l-6 6"/>',
    grafico: '<path d="M4 20V10M10 20V4M16 20v-7M22 20H2"/>',
    calc: '<rect x="4" y="2" width="16" height="20" rx="2"/><path d="M8 6h8M8 11h2M12 11h2M8 15h2M12 15h2M8 19h8"/>',
    cartao: '<rect x="2" y="5" width="20" height="14" rx="2"/><path d="M2 10h20M6 15h4"/>',
    planilha: '<rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18M3 15h18M9 3v18"/>',
  },
  recursos: [
    ["loja", "Loja com o seu endereço", "nomedaloja.lldworks.com.br com logo, capa, cor, horários, busca, ofertas e categorias. Instalável no celular.", ""],
    ["carrinho", "Carrinho e checkout em 3 passos", "Entrega ou retirada, CEP com endereço automático, taxa por bairro, cupom, troco e agendamento.", ""],
    ["cartao", "Pix, cartão e dinheiro", "Chave Pix no fim do pedido, maquininha na entrega ou pagamento online em até 12x pela sua conta do Mercado Pago.", "Pro e Premium"],
    ["quadro", "Pedidos em quadro", "Novo, confirmado, separando, pronto, saiu e entregue, com aviso sonoro, comanda para imprimir e mensagens prontas no WhatsApp.", ""],
    ["sacola", "Lista de separação", "Marque cada item ao colocar na sacola. Nada esquecido, nada trocado.", ""],
    ["moto", "Entregadores com link", "Cada entregador recebe os pedidos no celular, abre a rota no mapa e marca a entrega. Sem senha, sem app.", ""],
    ["caixa", "Estoque de verdade", "Baixa automática, esgotado na loja, entrada com custo, perdas, ajustes e aviso de estoque mínimo.", ""],
    ["planilha", "Cadastro em massa", "Importe centenas de produtos pela planilha, ajuste preços em lote e venda por kg, unidade, caixa ou dúzia.", ""],
    ["pessoas", "CRM de clientes", "Novos, fiéis, em risco e sumidos, com histórico, preferidos e mensagem de volta com cupom.", ""],
    ["cupom", "Cupons e promoções", "Desconto em %, em reais ou entrega grátis, com mínimo, validade e limite de usos. Promoção com data para começar e terminar.", ""],
    ["calc", "Precificação", "Preço sugerido a partir do custo, margem, taxa do cartão, imposto e perdas. Alerta de produto abaixo da margem.", ""],
    ["grafico", "Financeiro (DRE)", "Faturamento, custo dos produtos, taxas, impostos, despesas e lucro do mês, por dia, por pagamento e por produto.", ""],
  ],
  para: (p, i, n) => ["Para começar a vender online com tudo o que a loja precisa.", "Para quem quer receber online e atender no WhatsApp com IA.", "Para quem quer a marca completa: loja, site, Instagram e atendimento."][Math.min(i, 2)],
  itens: (p) => {
    const l = p.limites || {}, o = [], inc = l.inclui || {};
    o.push(`Até ${(l.produtos || 300).toLocaleString("pt-BR")} produtos ativos`, "Loja com link próprio e painel completo", "Pedidos, separação, entregadores e estoque", "CRM, cupons, precificação e financeiro");
    if (l.pagamento_online) o.push("Pagamento online em até 12x (Mercado Pago)");
    if (inc.agentworks) o.push("AgentWorks: WhatsApp com IA incluído");
    if (inc.linkworks) o.push("LinkWorks: link na bio incluído");
    if (inc.socialworks) o.push("SocialWorks: Instagram incluído");
    if (l.site) o.push("Site da sua marca feito pela LLD Works");
    o.push("Suporte LLD Works");
    return o;
  },
  heroVisual: ".foto",
  heroExtra(g, tl) {
    const el = document.querySelector(".cont"), o = { v: 0 };
    if (el) tl.to(o, { v: +el.dataset.n, duration: 1.8, ease: "power2.out", onUpdate: () => (el.textContent = Math.round(o.v).toLocaleString("pt-BR")) }, 0.9);
    g.to(".notif .sino", { rotate: 14, duration: 0.12, repeat: 5, yoyo: true, ease: "sine.inOut", delay: 2.2, repeatDelay: 0 });
  },
  depois({ $, $$ }) {
    // abas do painel
    const img = $("#telaPainel"), alts = { painel: "Painel do SalesWorks: vendas do dia, gráfico e clientes para trazer de volta", kanban: "Quadro de pedidos do SalesWorks: novos, confirmados, separando, prontos e concluídos", produtos: "Lista de produtos do SalesWorks com foto, preço, margem e estoque" };
    $$(".abas-p button").forEach((b) => b.addEventListener("click", () => {
      $$(".abas-p button").forEach((x) => x.setAttribute("aria-selected", String(x === b)));
      img.style.opacity = 0; setTimeout(() => { img.src = `/pub/img/tela-${b.dataset.aba}.webp`; img.alt = alts[b.dataset.aba]; img.onload = () => (img.style.opacity = 1); }, 200);
    }));
    // calculadora de comissão
    const r = $("#calcV"), out = $("#calcO"), c = $("#calcC"), brl = (v) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 });
    const at = () => { out.textContent = brl(+r.value); c.textContent = brl(+r.value * 0.12); };
    r.addEventListener("input", at); at();
  },
  scroll(g) {
    g.to(".foto img", { yPercent: 8, scale: 1.08, ease: "none", scrollTrigger: { trigger: ".hero", start: "top top", end: "bottom top", scrub: true } });
    g.from(".foto2", { x: -60, opacity: 0, duration: 1, ease: "expo.out", scrollTrigger: { trigger: ".vitrine", start: "top 75%" } });
    g.from(".fone", { y: 140, rotate: 8, opacity: 0, duration: 1.1, ease: "expo.out", scrollTrigger: { trigger: ".vitrine", start: "top 70%" } });
    g.from(".note", { y: 60, scale: 0.94, opacity: 0, duration: 1, ease: "expo.out", scrollTrigger: { trigger: ".note", start: "top 85%" } });
    g.from(".int-grid article", { y: 40, opacity: 0, duration: 0.7, stagger: 0.1, scrollTrigger: { trigger: ".int-card", start: "top 78%" } });
    g.from(".lista-ck li", { x: -20, opacity: 0, duration: 0.5, stagger: 0.08, scrollTrigger: { trigger: ".lista-ck", start: "top 85%" } });
    g.from(".com-foto", { x: 60, opacity: 0, duration: 1, ease: "expo.out", scrollTrigger: { trigger: ".comissao", start: "top 75%" } });
  },
});
