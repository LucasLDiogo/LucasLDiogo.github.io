// ServiceWorks — site de venda: escolha da versão (pet, beleza, barber, clínica), recursos, planos vindos do Hub e animações (GSAP).
"use strict";
(() => {
  const $ = (s, r = document) => r.querySelector(s), $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const brl = (c) => (Number(c || 0) / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL", minimumFractionDigits: c % 100 ? 2 : 0 });
  const calmo = matchMedia("(prefers-reduced-motion: reduce)").matches;

  const I = {
    agenda: '<rect x="3" y="5" width="18" height="16" rx="3"/><path d="M3 10h18M8 3v4M16 3v4M8 15l2 2 4-4"/>',
    vitrine: '<circle cx="12" cy="12" r="10"/><path d="M2 12h20M12 2a15 15 0 0 1 0 20M12 2a15 15 0 0 0 0 20"/>',
    crm: '<circle cx="9" cy="8" r="4"/><path d="M2 21a7 7 0 0 1 14 0M16 3.5a4 4 0 0 1 0 8M22 21a7 7 0 0 0-4-6.3"/>',
    caixa: '<rect x="2" y="6" width="20" height="13" rx="2"/><path d="M2 10h20M6 15h3M15 15h3"/>',
    estoque: '<path d="M21 8l-9-5-9 5v8l9 5 9-5z"/><path d="M3 8l9 5 9-5M12 13v8"/>',
    promo: '<path d="M20.6 13.4l-7.2 7.2a2 2 0 0 1-2.8 0L3 13V3h10l7.6 7.6a2 2 0 0 1 0 2.8z"/><circle cx="7.5" cy="7.5" r="1.5"/>',
    grafico: '<path d="M4 20V10M10 20V4M16 20v-7M22 20H2"/>',
    espera: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
    wa: '<path d="M3 21l1.7-5A9 9 0 1 1 8 19.3z"/><path d="M9 10c.5 2 2 3.5 4 4l1.2-1.2 2 .8-.4 2c-4 .4-8.4-4-8-8l2-.4.8 2z"/>',
    pix: '<path d="M12 2l4 4-4 4-4-4zM12 14l4 4-4 4-4-4zM2 12l4-4 4 4-4 4zM14 12l4-4 4 4-4 4z"/>',
    insta: '<rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.5" cy="6.5" r=".8" fill="currentColor"/>',
    site: '<rect x="2" y="4" width="20" height="16" rx="2"/><path d="M2 9h20M6 6.5h.01M9 6.5h.01"/>',
  };
  const ic = (n) => `<span class="ic"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${I[n]}</svg></span>`;
  const RECURSOS = [
    ["agenda", "Agenda inteligente", "Por profissional, com horários, folgas, encaixe e repetição. Mostra a ocupação do dia e da semana.", "Todos os planos"],
    ["vitrine", "Vitrine com o seu nome", "sualoja.lldworks.com.br: serviços, preços, promoções, produtos e agendamento 24h, com a sua logo.", "Todos os planos"],
    ["crm", "CRM de clientes", "Quanto cada um gastou, quando veio pela última vez, aniversário, fichas e histórico.", "Todos os planos"],
    ["caixa", "Caixa e comandas", "Serviço + produto na mesma comanda, desconto, forma de pagamento e comissão da equipe calculada.", "Todos os planos"],
    ["estoque", "Produtos e estoque", "Preço, custo e margem. Baixa automática na venda e aviso de estoque baixo.", "Todos os planos"],
    ["promo", "Promoções no WhatsApp", "Monte a oferta, escolha o público (sumidos, aniversariantes, VIP) e envie com mensagem pronta.", "Todos os planos"],
    ["espera", "Encaixe automático", "Cancelou? O sistema sugere quem está na lista de espera, quem pode antecipar e quem está na hora de voltar.", "Todos os planos"],
    ["grafico", "Indicadores", "Faturamento, ticket médio, recorrência, faltas, margem e ranking da equipe.", "Todos os planos"],
    ["wa", "Agente de WhatsApp com IA", "Responde 24h com as suas informações e passa para a equipe quando precisa.", "Pro e Premium"],
    ["pix", "Pagamento online", "Link de Pix e cartão na comanda e sinal no agendamento, direto na sua conta Mercado Pago.", "Pro e Premium"],
    ["insta", "Instagram no piloto automático", "Calendário de posts, legendas com IA e respostas automáticas em comentários e directs.", "Premium"],
    ["site", "Site profissional", "Feito pela nossa equipe em até 5 dias úteis, integrado à vitrine, WhatsApp, Instagram e Google Maps.", "Premium"],
  ];
  const VERSOES = {
    pet: { nome: "Pet shop", demo: "https://serviceworks-demo.lldworks.com.br/pet", lead: "Banho e tosa, veterinário e hotel: agenda por porte, ficha do pet com vacinas e pacotes mensais, com o tutor agendando pela vitrine.",
      itens: [["Pets por tutor", "Espécie, raça, porte e cuidados aparecem em destaque no agendamento."], ["Preço e tempo por porte", "Banho do mini ao gigante, cada um com o seu valor e duração."], ["Vacinas e retornos", "Próxima dose avisada no painel, com mensagem pronta para o tutor."], ["Pacotes de banho", "4 banhos no mês com sessões descontadas automaticamente."], ["“Seu pet está pronto”", "Mensagem pronta no WhatsApp quando o atendimento termina."]],
      frase: "“O tutor marca o banho pela vitrine às 23h e eu só confirmo de manhã.”", ag: [["09:00", "Banho · Thor", "porte grande"], ["10:30", "Tosa · Mel", "gato · arisca"], ["14:00", "Banho e tosa · Luna", "pacote 3/4"]] },
    beleza: { nome: "Salão e estética", demo: "https://serviceworks-demo.lldworks.com.br/barbearia", lead: "Cabelo, manicure, sobrancelha e estética: agenda por profissional, comissão automática, fichas de preferências e pacotes de sessões.",
      itens: [["Comissão por profissional", "Calculada na comanda, com relatório para pagar a equipe."], ["Ficha da cliente", "Alergias, química recente e preferências sempre à mão."], ["Pacotes de sessões", "Venda 10 sessões e acompanhe o saldo de cada cliente."], ["Produtos com margem", "Esmaltes, shampoos e cremes com custo, estoque e lucro."], ["Aniversariantes", "Lista do mês com mensagem de parabéns e mimo."]],
      frase: "“As clientes voltam porque eu lembro o que cada uma gosta.”", ag: [["09:00", "Escova · Ana", "Carla"], ["10:00", "Unhas · Bia", "pé e mão"], ["15:00", "Limpeza de pele · Lu", "pacote 2/10"]] },
    barber: { nome: "Barbearia", demo: "https://serviceworks-demo.lldworks.com.br/barbearia", lead: "Corte, barba e clube de assinatura: cada barbeiro com a sua agenda, comissão calculada e o cliente agendando pela vitrine ou pelo WhatsApp.",
      itens: [["Agenda por barbeiro", "Cada um com o seu horário, folgas e serviços."], ["Clube de assinatura", "Pacote mensal de cortes com sessões controladas."], ["Comissão automática", "Percentual por barbeiro ou padrão da casa."], ["Retorno no tempo certo", "Quem costuma voltar a cada 20 dias aparece na hora certa."], ["Venda de produtos", "Pomadas e óleos com estoque e margem no caixa."]],
      frase: "“Cancelou às 15h? O sistema já me mostra quem chamar para o encaixe.”", ag: [["10:00", "Corte · João", "com Rafa"], ["10:40", "Barba · Pedro", "clube 2/4"], ["11:20", "Corte e barba · Léo", "com Duda"]] },
    clinica: { nome: "Clínica", demo: "https://serviceworks-demo.lldworks.com.br/barbearia", lead: "Consultório, fisioterapia e estética clínica: anamnese, evolução por sessão, retornos e pacotes de tratamento, com o paciente agendando online.",
      itens: [["Anamnese", "Queixa, alergias, medicamentos e objetivo do tratamento."], ["Evolução por sessão", "Anotações datadas no histórico do paciente."], ["Retornos", "Próximo retorno marcado na ficha e avisado no painel."], ["Pacotes de tratamento", "10 sessões de fisioterapia com saldo controlado."], ["Sinal online", "Cobre um sinal no agendamento e reduza faltas."]],
      frase: "“Meus pacientes recebem o lembrete e quase não faltam mais.”", ag: [["08:00", "Avaliação · Marta", "1ª consulta"], ["09:00", "Fisioterapia · José", "sessão 4/10"], ["11:00", "Retorno · Clara", "evolução"]] },
  };
  const PARA = { "básico": "Para organizar a agenda, o caixa e os clientes.", pro: "Para vender mais com WhatsApp e pagamento online.", premium: "Para ter tudo, com site e Instagram." };
  const INCLUI = { agentworks: "Agente de WhatsApp com IA", linkworks: "Link na bio (LinkWorks)", socialworks: "Instagram: posts e respostas automáticas" };
  const sa = (t) => String(t || "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
  let V = new URLSearchParams(location.search).get("versao"); if (!VERSOES[V]) V = "pet";
  let P = null;

  function itens(p) {
    const l = p.limites || {}, out = ["Agenda, vitrine, CRM, caixa, estoque, promoções e indicadores"];
    if (l.profissionais) out.push(`Até ${l.profissionais} profissionais`);
    if (l.inclui) Object.keys(l.inclui).forEach((k) => out.push(INCLUI[k] || k));
    if (l.pagamento_online) out.push("Pagamento online: Pix e cartão");
    if (l.site) out.push("Site profissional feito pela LLD Works");
    return out;
  }
  function desenhaPlanos() {
    const v = VERSOES[V];
    $("#planosVer").textContent = v.nome;
    if (!P) return;
    const lst = P.planos.slice().sort((a, b) => a.preco_centavos - b.preco_centavos);
    $("#cardsPlanos").innerHTML = lst.map((p, i) => { const d = sa(p.nome) === "pro" || (lst.length === 3 && i === 1);
      return `<article class="plano ${d ? "destaque" : ""}">${d ? '<span class="selo">MAIS ESCOLHIDO</span>' : ""}<h3>${esc(p.nome)}</h3><p class="para">${esc(PARA[sa(p.nome)] || PARA[p.nome.toLowerCase()] || "")}</p>
        <div class="preco">${brl(p.preco_centavos)}<small>/${p.ciclo === "anual" ? "ano" : "mês"}</small></div>
        <ul>${itens(p).map((t, k) => `<li class="${k && (t.includes("WhatsApp") || t.includes("Site") || t.includes("Instagram")) ? "mais" : ""}">${esc(t)}</li>`).join("")}</ul>
        <a class="b ${d ? "pri" : ""} grande" href="/assinar?versao=${V}&plano=${p.id}">Assinar ${esc(p.nome)}</a></article>`; }).join("") || '<p class="carregando">Nenhum plano à venda agora. Fale com a gente no WhatsApp.</p>';
    if (window.gsap && !calmo) gsap.from(".plano", { y: 20, opacity: 0, duration: 0.5, stagger: 0.08, ease: "power2.out" });
  }
  function aplica(v, animar = true) {
    V = v; const d = VERSOES[v];
    document.body.dataset.v = v;
    $$("#seg button, #seg2 button").forEach((b) => b.setAttribute("aria-selected", String(b.dataset.v === v)));
    $("#heroLead").textContent = d.lead;
    $("#ctaHero").textContent = `Ver planos para ${d.nome.toLowerCase()}`;
    $("#demoHero").href = d.demo;
    $("#mkNome").textContent = `${{ pet: "Pet Feliz", beleza: "Studio Bella", barber: "Barbearia Navalha", clinica: "Clínica Viva" }[v]} · Painel`;
    $("#mkAg").innerHTML = '<span></span><span class="t">Ana</span><span class="t">Bia</span><span class="t">Caio</span>' + d.ag.map(([h, t, s], i) => `<span class="h">${h}</span>${[0, 1, 2].map((c) => (c === i % 3 ? `<span class="e">${esc(t)}<small>${esc(s)}</small></span>` : `<span class="v"></span>`)).join("")}`).join("");
    $("#verTitulo").textContent = `Versão ${d.nome}`;
    $("#verLista").innerHTML = d.itens.map(([t, s]) => `<li><span class="ck">✓</span><div><b>${esc(t)}</b><span>${esc(s)}</span></div></li>`).join("");
    $("#verCard").innerHTML = `<h3>ServiceWorks ${esc(d.nome)}</h3><p class="quote">${esc(d.frase)}</p><p>Tudo do ServiceWorks, com os detalhes do seu ramo prontos para usar.</p><a class="b branco" href="#planos">Ver planos</a> <a class="b ghost" style="color:#fff" href="${d.demo}" target="_blank" rel="noopener">Ver demonstração →</a>`;
    desenhaPlanos();
    document.dispatchEvent(new CustomEvent("sw:versao", { detail: { v, nome: d.nome, animar } }));
    if (animar && window.gsap && !calmo) { gsap.from("#mkAg .e", { scale: 0.9, opacity: 0, duration: 0.4, stagger: 0.06, ease: "back.out(2)" }); gsap.from("#verLista li", { x: -12, opacity: 0, duration: 0.35, stagger: 0.05 }); }
  }

  $("#recursosLista").innerHTML = RECURSOS.map(([i, t, d, p]) => `<article class="rec">${ic(i)}<h3>${esc(t)}</h3><p>${esc(d)}</p><span class="pl">${esc(p)}</span></article>`).join("");
  $("#seg2").innerHTML = $("#seg").innerHTML;
  document.addEventListener("click", (e) => { const b = e.target.closest("#seg button, #seg2 button"); if (b) { aplica(b.dataset.v); history.replaceState(null, "", `?versao=${b.dataset.v}${location.hash}`); } });
  addEventListener("scroll", () => $(".topo").classList.toggle("rolou", scrollY > 10), { passive: true });
  aplica(V, false);

  fetch("/api/conta/produto").then((r) => (r.ok ? r.json() : Promise.reject())).then((d) => {
    P = d; desenhaPlanos();
    if (d.whatsapp) $("#ctaZap").href = `https://wa.me/${d.whatsapp.startsWith("55") ? d.whatsapp : "55" + d.whatsapp}?text=${encodeURIComponent("Olá! Quero conhecer o ServiceWorks.")}`;
    else $("#ctaZap").remove();
  }).catch(() => { $("#cardsPlanos").innerHTML = '<p class="carregando">Não consegui carregar os planos agora. <a href="/assinar">Ver na página de assinatura</a>.</p>'; $("#ctaZap").remove(); });

  // ---------- animações ----------
  addEventListener("load", () => {
    const g = window.gsap; if (!g || calmo) return;
    if (window.ScrollTrigger) g.registerPlugin(ScrollTrigger);
    g.timeline({ defaults: { ease: "power3.out" } })
      .from(".hero .eti", { y: 12, opacity: 0, duration: 0.5 })
      .from(".hero h1 span", { y: 40, opacity: 0, duration: 0.7, stagger: 0.12 }, "-=0.2")
      .from(".lead, #seg, .hero .cta, .hero .nota", { y: 16, opacity: 0, duration: 0.5, stagger: 0.08 }, "-=0.35")
      .from(".tela", { y: 40, opacity: 0, rotate: 3, duration: 0.9 }, 0.2)
      .from(".flut", { scale: 0.8, opacity: 0, duration: 0.5, stagger: 0.15, ease: "back.out(1.8)" }, 0.8);
    g.to(".f1", { y: -10, duration: 2.4, yoyo: true, repeat: -1, ease: "sine.inOut" });
    g.to(".f2", { y: 8, duration: 2.8, yoyo: true, repeat: -1, ease: "sine.inOut" });
    g.to(".f3", { y: -6, duration: 2.2, yoyo: true, repeat: -1, ease: "sine.inOut" });
    if (!window.ScrollTrigger) return;
    g.utils.toArray(".sec .eti").forEach((el) => g.from(el, { y: 24, opacity: 0, duration: 0.6, scrollTrigger: { trigger: el, start: "top 88%" } }));
    g.from(".rec", { y: 30, opacity: 0, duration: 0.5, stagger: 0.05, ease: "power2.out", scrollTrigger: { trigger: "#recursosLista", start: "top 82%" } });
    g.from(".faixa div", { y: 20, opacity: 0, duration: 0.5, stagger: 0.08, scrollTrigger: { trigger: ".faixa", start: "top 90%" } });
    g.from(".como li", { y: 26, opacity: 0, duration: 0.5, stagger: 0.1, scrollTrigger: { trigger: ".como .passos", start: "top 85%" } });
    g.from(".final", { scale: 0.96, opacity: 0, duration: 0.7, scrollTrigger: { trigger: ".final", start: "top 85%" } });
  });
})();

// ---------- v3: fotos por versão, galeria horizontal, letreiro, títulos palavra a palavra, botões magnéticos ----------
(() => {
  const $ = (s, r = document) => r.querySelector(s), $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const calmo = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const fino = matchMedia("(hover: hover) and (pointer: fine)").matches;
  const NOMES = { pet: "Pet shop", beleza: "Salão e estética", barber: "Barbearia", clinica: "Clínica" };
  function versao(v, animar) {
    $$(".foto-hero img").forEach((im) => im.classList.toggle("on", im.dataset.v === v));
    const selo = $("#seloFoto"); if (selo) selo.textContent = NOMES[v] || "";
    const card = $("#verCard"); if (card) card.style.setProperty("--vfoto", `url(/pub/img/v-${v}.webp)`);
    if (animar && window.gsap && !calmo) {
      gsap.fromTo(".foto-hero img.on", { scale: 1.12 }, { scale: 1, duration: 1.1, ease: "power3.out" });
      gsap.fromTo("#verCard", { clipPath: "inset(0 0 100% 0 round 26px)" }, { clipPath: "inset(0 0 0% 0 round 26px)", duration: 0.8, ease: "power3.inOut" });
    }
  }
  document.addEventListener("sw:versao", (e) => versao(e.detail.v, e.detail.animar));
  versao(document.body.dataset.v || "pet", false);

  // barra de progresso da leitura
  const barra = $(".progresso i");
  const prog = () => { const h = document.documentElement.scrollHeight - innerHeight; if (barra) barra.style.transform = `scaleX(${h > 0 ? Math.min(1, scrollY / h) : 0})`; };
  addEventListener("scroll", prog, { passive: true }); prog();

  // luz que segue o mouse nos cartões de recursos
  if (fino) document.addEventListener("pointermove", (e) => { const c = e.target.closest && e.target.closest(".rec"); if (!c) return; const r = c.getBoundingClientRect(); c.style.setProperty("--mx", `${e.clientX - r.left}px`); c.style.setProperty("--my", `${e.clientY - r.top}px`); }, { passive: true });

  addEventListener("load", () => {
    const g = window.gsap; if (!g || calmo) return;
    const ST = window.ScrollTrigger; if (ST) g.registerPlugin(ST);

    // letreiro infinito
    const tr = $(".letreiro .trilho");
    if (tr) { tr.innerHTML += tr.innerHTML; const larg = tr.scrollWidth / 2; g.to(tr, { x: -larg, duration: larg / 70, ease: "none", repeat: -1 }); }

    // foto do hero: entrada, parallax no scroll e leve inclinação com o mouse
    g.from(".foto-hero", { y: 60, rotate: 9, opacity: 0, duration: 1.1, ease: "power3.out", delay: 0.15 });
    if (ST) g.to(".foto-hero img", { yPercent: -10, ease: "none", scrollTrigger: { trigger: ".hero", start: "top top", end: "bottom top", scrub: true } });
    const vis = $(".hero-vis");
    if (fino && vis) {
      const rx = g.quickTo(".foto-hero", "rotationY", { duration: 0.6, ease: "power3" }), ry = g.quickTo(".foto-hero", "rotationX", { duration: 0.6, ease: "power3" });
      const tx = g.quickTo(".tela", "x", { duration: 0.8, ease: "power3" }), ty = g.quickTo(".tela", "y", { duration: 0.8, ease: "power3" });
      g.set(".foto-hero", { transformPerspective: 900 });
      vis.addEventListener("pointermove", (e) => { const r = vis.getBoundingClientRect(), px = (e.clientX - r.left) / r.width - 0.5, py = (e.clientY - r.top) / r.height - 0.5; rx(px * 10); ry(-py * 8); tx(px * -14); ty(py * -10); });
      vis.addEventListener("pointerleave", () => { rx(0); ry(0); tx(0); ty(0); });
    }

    // números contando
    $$("[data-num]").forEach((el) => { const n = +el.dataset.num, o = { v: 0 }; g.to(o, { v: n, duration: 1.6, ease: "power2.out", delay: 0.6, onUpdate: () => (el.textContent = "R$ " + Math.round(o.v).toLocaleString("pt-BR")) }); });
    $$(".faixa b").forEach((el) => { const m = el.textContent.match(/^(\d+)(.*)$/); if (!m || +m[1] < 2) return; const o = { v: 0 }; g.to(o, { v: +m[1], duration: 1.2, ease: "power2.out", onUpdate: () => (el.textContent = Math.round(o.v) + m[2]), scrollTrigger: ST ? { trigger: ".faixa", start: "top 90%" } : undefined }); });

    // títulos palavra a palavra (o texto continua o mesmo para leitores de tela)
    $$(".sec h2").forEach((h) => {
      if (h.dataset.dividido || h.id === "verTitulo") return; h.dataset.dividido = "1";
      h.innerHTML = h.innerHTML.split(/(\s+)/).map((t) => (/^\s+$/.test(t) || !t ? t : `<span class="palavra">${t}</span>`)).join("");
      g.from(h.querySelectorAll(".palavra"), { yPercent: 70, opacity: 0, rotate: 4, duration: 0.7, stagger: 0.04, ease: "power3.out", scrollTrigger: ST ? { trigger: h, start: "top 88%" } : undefined });
    });

    // galeria: rolagem horizontal presa no desktop, com parallax nas fotos
    const pin = $("#vidaPin"), trilho = $("#vidaTrilho");
    if (ST && pin && trilho) {
      const mm = g.matchMedia();
      mm.add("(min-width: 981px)", () => {
        const dist = () => Math.max(0, trilho.scrollWidth - innerWidth + 40);
        const anim = g.to(trilho, { x: () => -dist(), ease: "none", scrollTrigger: { trigger: pin, start: "center center", end: () => "+=" + dist(), pin: true, scrub: 0.8, invalidateOnRefresh: true, anticipatePin: 1 } });
        $$(".vf img", trilho).forEach((im) => g.fromTo(im, { xPercent: -6 }, { xPercent: 6, ease: "none", scrollTrigger: { trigger: im.parentNode, containerAnimation: anim, start: "left right", end: "right left", scrub: true } }));
        $$(".vf figcaption", trilho).forEach((c) => g.from(c, { y: 30, opacity: 0, duration: 0.6, scrollTrigger: { trigger: c.parentNode, containerAnimation: anim, start: "left 80%" } }));
      });
      mm.add("(max-width: 980px)", () => { g.from(".vf", { y: 40, opacity: 0, duration: 0.6, stagger: 0.08, scrollTrigger: { trigger: pin, start: "top 85%" } }); });
      $$("img").forEach((im) => { if (!im.complete) im.addEventListener("load", () => ST.refresh(), { once: true }); });
    }

    // botões principais magnéticos
    if (fino) $$(".b.pri.grande, .b.grande").forEach((b) => {
      const x = g.quickTo(b, "x", { duration: 0.4, ease: "power3" }), y = g.quickTo(b, "y", { duration: 0.4, ease: "power3" });
      b.addEventListener("pointermove", (e) => { const r = b.getBoundingClientRect(); x((e.clientX - r.left - r.width / 2) * 0.25); y((e.clientY - r.top - r.height / 2) * 0.35); });
      b.addEventListener("pointerleave", () => { x(0); y(0); });
    });
  });
})();
