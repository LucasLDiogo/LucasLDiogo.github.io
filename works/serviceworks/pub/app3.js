// ServiceWorks — Gestão 360 (20/11/2026): painel gerencial do dono, montado só com as APIs que já existem
// (indicadores, ocupacao, relatorio, clientes, espera, produtos). Carregado depois do app2.js; usa window.SW.
// Inspirado no que Fresha, Booksy, Trinks, AvecSalão e SimplesVet mostram ao dono: ocupação das vagas, previsão
// do mês, receita perdida com faltas e horários vazios, clientes sumidos e ações prontas para encher a agenda.
"use strict";
(() => {
  const SW = window.SW; if (!SW) return;
  const { api, toast, aba, S, esc, brl, hojeBR, somaDias, fmtD, CARREGA, waLink } = SW;
  const $ = (s, r = document) => r.querySelector(s), $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const G = window.gsap, calmo = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const DIAS = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"], DIAS_L = ["domingo", "segunda", "terça", "quarta", "quinta", "sexta", "sábado"];
  const pct = (n) => `${Math.round(n || 0)}%`;
  const cap = (t) => t.charAt(0).toUpperCase() + t.slice(1);
  const dow = (d) => new Date(d + "T12:00:00").getDay();
  const fimMes = (d) => { const x = new Date(+d.slice(0, 4), +d.slice(5, 7), 0); return `${d.slice(0, 8)}${String(x.getDate()).padStart(2, "0")}`; };
  const mesAnt = (d) => { const x = new Date(+d.slice(0, 4), +d.slice(5, 7) - 2, 1); return `${x.getFullYear()}-${String(x.getMonth() + 1).padStart(2, "0")}-01`; };
  const nomeMes = (d) => new Date(d.slice(0, 7) + "-15T12:00:00").toLocaleDateString("pt-BR", { month: "long" });
  const termo = () => ({ petshop: ["tutor", "tutores"], clinica: ["paciente", "pacientes"] }[S.emp?.segmento] || ["cliente", "clientes"]);
  const chaveMeta = () => `sw-meta-${S.emp?.slug || "loja"}-${hojeBR().slice(0, 7)}`;
  const lerMeta = () => { try { return Number(localStorage.getItem(chaveMeta())) || 0; } catch { return 0; } };
  const gravarMeta = (v) => { try { localStorage.setItem(chaveMeta(), String(v)); } catch {} };
  const cor = (p) => (p >= 85 ? "q4" : p >= 60 ? "q3" : p >= 35 ? "q2" : p > 0 ? "q1" : "q0");
  const vitrine = () => (S.emp?.slug ? `https://${S.emp.slug}.lldworks.com.br` : "");

  function secao(v) {
    let s = $(`#v-${v}`);
    if (!s) { s = document.createElement("section"); s.className = "view"; s.id = `v-${v}`; s.setAttribute("role", "tabpanel"); $("main").appendChild(s); }
    return s;
  }
  function anel(p, rotulo) {
    const r = 52, c = 2 * Math.PI * r, v = Math.max(0, Math.min(100, p || 0)), o = c * (1 - v / 100);
    return `<svg class="g360-anel" viewBox="0 0 128 128" role="img" aria-label="${esc(rotulo)}: ${pct(p)}">
      <circle cx="64" cy="64" r="${r}" class="t"/><circle cx="64" cy="64" r="${r}" class="v" stroke-dasharray="${c.toFixed(1)}" stroke-dashoffset="${o.toFixed(1)}" data-c="${c.toFixed(1)}" data-o="${o.toFixed(1)}"/>
      <text x="64" y="64" text-anchor="middle" class="n">${pct(p)}</text><text x="64" y="84" text-anchor="middle" class="l">${esc(rotulo)}</text></svg>`;
  }
  const delta = (a, b) => {
    if (!b) return '<span class="g360-d neu">sem base no mês anterior</span>';
    const d = ((a - b) / b) * 100;
    return `<span class="g360-d ${d >= 0 ? "up" : "down"}">${d >= 0 ? "▲" : "▼"} ${Math.abs(d).toFixed(0)}% vs mesmo período de ${esc(nomeMes(mesAnt(hojeBR())))}</span>`;
  };

  async function gestao() {
    const s = secao("gestao");
    if (!s.innerHTML) s.innerHTML = '<p class="mute">Montando o seu painel…</p>';
    const hoje = hojeBR(), ini = `${hoje.slice(0, 8)}01`, fim = fimMes(hoje);
    const aIni = mesAnt(hoje), diaN = +hoje.slice(8, 10), aFim = fimMes(aIni), aAte = `${aIni.slice(0, 8)}${String(Math.min(diaN, +aFim.slice(8, 10))).padStart(2, "0")}`;
    const [ind, indA, ocF, ocP, rel, sumidos, aniv, espera, produtos] = await Promise.all([
      api("GET", `indicadores?de=${ini}&ate=${hoje}`),
      api("GET", `indicadores?de=${aIni}&ate=${aAte}`).catch(() => null),
      api("GET", `ocupacao?de=${hoje}&dias=14`).catch(() => []),
      api("GET", `ocupacao?de=${somaDias(hoje, -28)}&dias=28`).catch(() => []),
      api("GET", `relatorio?de=${ini}&ate=${fim}`).catch(() => null),
      api("GET", "clientes?filtro=sumidos").catch(() => []),
      api("GET", "clientes?filtro=aniversariantes").catch(() => []),
      api("GET", "espera").catch(() => []),
      api("GET", "produtos").catch(() => []),
    ]);
    // ---- números ----
    const prox7 = ocF.slice(0, 7), cap7 = prox7.reduce((a, d) => a + d.capacidade_min, 0), ocu7 = prox7.reduce((a, d) => a + d.ocupado_min, 0);
    const ocup7 = cap7 ? (100 * ocu7) / cap7 : 0, livreMin7 = Math.max(0, cap7 - ocu7);
    const capP = ocP.reduce((a, d) => a + d.capacidade_min, 0), ocuP = ocP.reduce((a, d) => a + d.ocupado_min, 0), ocupP = capP ? (100 * ocuP) / capP : 0;
    const ticket = ind.ticket_medio_centavos || (ind.vendas ? ind.faturamento_centavos / ind.vendas : 0);
    const sv = (S.servicos || []).filter((x) => x.ativo !== 0), durMed = sv.length ? sv.reduce((a, x) => a + (x.duracao_min || 30), 0) / sv.length : 45;
    const vagasLivres = Math.floor(livreMin7 / Math.max(15, durMed)), potencialLivre = Math.round(vagasLivres * ticket);
    const st = (k, campo) => (rel ? (rel.por_status || []).filter((x) => x.status === k).reduce((a, x) => a + x[campo], 0) : 0);
    const confirmado = st("confirmado", "v"), concluido = st("concluido", "v"), faltasN = st("faltou", "n"), perdidoFaltas = Math.round(faltasN * ticket);
    const diasMes = +fim.slice(8, 10), ritmo = diaN ? ind.faturamento_centavos / diaN : 0;
    const previsao = Math.max(ind.faturamento_centavos + confirmado, Math.round(ritmo * diasMes));
    const base = indA && indA.faturamento_centavos ? (indA.faturamento_centavos / Math.max(1, diaN)) * diasMes : previsao;
    const meta = lerMeta() || Math.max(10000, Math.round((base * 1.1) / 10000) * 10000);
    const falta = Math.max(0, meta - ind.faturamento_centavos), diasRest = Math.max(1, diasMes - diaN + 1);
    const potSumidos = sumidos.reduce((a, c) => a + (c.ticket_centavos || 0), 0);
    const baixo = produtos.filter((p) => p.ativo !== 0 && p.controla_estoque && p.estoque <= (p.estoque_min || 0));
    // ocupação por dia da semana (últimas 4 semanas) e por profissional (próximos 14 dias)
    const porDow = Array.from({ length: 7 }, () => ({ c: 0, o: 0 }));
    for (const d of ocP) { const k = dow(d.dia); porDow[k].c += d.capacidade_min; porDow[k].o += d.ocupado_min; }
    const dowPct = porDow.map((x) => (x.c ? (100 * x.o) / x.c : null));
    const abertos = dowPct.map((p, i) => [p, i]).filter(([p]) => p != null);
    const pior = abertos.length ? abertos.reduce((a, b) => (b[0] < a[0] ? b : a)) : null;
    const melhor = abertos.length ? abertos.reduce((a, b) => (b[0] > a[0] ? b : a)) : null;
    const profs = new Map();
    for (const d of ocF) for (const p of d.profissionais || []) { const x = profs.get(p.id) || { nome: p.nome, dias: {} }; x.dias[d.dia] = p.capacidade_min ? p.pct : null; profs.set(p.id, x); }
    const [t1, tN] = termo();
    // ---- ações inteligentes (regras simples e explicadas) ----
    const acoes = [];
    if (pior && pior[0] < 50) acoes.push({ ic: "📉", t: `${cap(DIAS_L[pior[1]])} é o dia mais vazio (${pct(pior[0])} nas últimas 4 semanas)`, d: `Uma promoção só para ${DIAS_L[pior[1]]} puxa quem tem horário flexível. Exemplo: 15% no ${sv[0]?.nome || "serviço principal"}.`, b: "Criar promoção", v: "promocoes" });
    if (sumidos.length) acoes.push({ ic: "💬", t: `${sumidos.length} ${sumidos.length === 1 ? t1 : tN} sumidos valem ${brl(potSumidos)} em uma visita`, d: "Mande a mensagem de volta pelo WhatsApp com um cupom. Os primeiros da lista estão há mais tempo sem vir.", b: `Chamar ${tN}`, v: "clientes" });
    if (vagasLivres >= 3) acoes.push({ ic: "🗓️", t: `${vagasLivres} horários livres nos próximos 7 dias (≈ ${brl(potencialLivre)})`, d: espera.length ? `Há ${espera.length} na lista de espera: encaixe primeiro quem já pediu.` : "Divulgue o link de agendamento da vitrine no status do WhatsApp e no Instagram.", b: espera.length ? "Ver lista de espera" : "Marca e vitrine", v: espera.length ? "espera" : "marca" });
    if (faltasN > 0) acoes.push({ ic: "⏰", t: `${faltasN} ${faltasN === 1 ? "falta" : "faltas"} no mês (≈ ${brl(perdidoFaltas)} perdidos)`, d: "Lembrete automático na véspera pelo AgentWorks e sinal no agendamento online reduzem as faltas.", b: "WhatsApp e pagamentos", v: "integracoes" });
    if (melhor && melhor[0] >= 85) acoes.push({ ic: "🔥", t: `${cap(DIAS_L[melhor[1]])} está quase lotado (${pct(melhor[0])})`, d: "Vale abrir mais horários, escalar outro profissional ou não dar desconto nesse dia.", b: "Equipe e horários", v: "equipe" });
    if (aniv.length) acoes.push({ ic: "🎂", t: `${aniv.length} ${aniv.length === 1 ? "aniversariante" : "aniversariantes"} este mês`, d: "Um presente simples (desconto ou brinde) traz a visita do mês.", b: `Ver ${tN}`, v: "clientes" });
    if (baixo.length) acoes.push({ ic: "📦", t: `${baixo.length} ${baixo.length === 1 ? "produto" : "produtos"} com estoque baixo`, d: baixo.slice(0, 3).map((p) => `${p.nome} (${p.estoque})`).join(" · "), b: "Produtos e estoque", v: "produtos" });
    if (!acoes.length) acoes.push({ ic: "✅", t: "Tudo em dia", d: "Agenda saudável, sem faltas e sem clientes sumidos. Continue assim.", b: null });

    const dias14 = ocF.map((d) => d.dia), mxF = Math.max(1, concluido + confirmado, meta, ind.faturamento_centavos);
    const funil = [["Meta do mês", meta, "meta"], ["Previsto (atendido + agendado)", concluido + confirmado, "prev"], ["Atendido", concluido, "feito"], ["Recebido no caixa", ind.faturamento_centavos, "rec"]];
    s.innerHTML = `<div class="head"><div><h1>Gestão 360</h1><p>Como está o negócio agora e o que fazer para encher a agenda. Atualizado às ${new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}.</p></div>
      <div class="row"><button class="btn ghost sm" id="g360Csv" type="button">Baixar resumo (CSV)</button><button class="btn sm" id="g360Atual" type="button">Atualizar</button></div></div>
      <div class="g360-hero card">
        <div class="g360-aneis">${anel(ocup7, "vagas ocupadas · 7 dias")}${anel(meta ? (100 * ind.faturamento_centavos) / meta : 0, "da meta do mês")}</div>
        <div class="g360-meta">
          <div class="l">Faturamento de ${esc(nomeMes(hoje))}</div>
          <div class="v" data-g360="${ind.faturamento_centavos}">${brl(ind.faturamento_centavos)}</div>
          ${delta(ind.faturamento_centavos, indA && indA.faturamento_centavos)}
          <div class="g360-linha"><span>Previsão para o mês</span><b>${brl(previsao)}</b></div>
          <div class="g360-linha"><span>Meta <button class="lnk" id="g360Meta" type="button">editar</button></span><b>${brl(meta)}</b></div>
          <div class="g360-linha"><span>Falta para a meta</span><b>${brl(falta)} <small class="mute">(${brl(Math.round(falta / diasRest))} por dia)</small></b></div>
        </div>
      </div>
      <div class="kpis g360-kpis">
        <div class="card kpi"><div class="l">Ticket médio</div><div class="v">${brl(ticket)}</div><div class="tiny mute">${ind.vendas} vendas no mês</div></div>
        <div class="card kpi"><div class="l">Agendado até o fim do mês</div><div class="v">${brl(confirmado)}</div><div class="tiny mute">confirmados ainda por atender</div></div>
        <div class="card kpi"><div class="l">Horários livres · 7 dias</div><div class="v">${vagasLivres}</div><div class="tiny mute">≈ ${brl(potencialLivre)} em jogo</div></div>
        <div class="card kpi"><div class="l">${cap(tN)} que voltam</div><div class="v">${pct(ind.recorrencia_pct)}</div><div class="tiny mute">${ind.clientes_atendidos} atendidos · ${ind.clientes_novos} novos</div></div>
        <div class="card kpi"><div class="l">Faltas no mês</div><div class="v">${pct(ind.faltas_pct)}</div><div class="tiny mute">${faltasN ? `≈ ${brl(perdidoFaltas)} perdidos` : "nenhum prejuízo"}</div></div>
        <div class="card kpi"><div class="l">Ocupação · 4 semanas</div><div class="v">${pct(ocupP)}</div><div class="tiny mute">média de todas as vagas</div></div>
      </div>
      <div class="grid g360-g2">
        <div class="card"><h2>O que fazer agora</h2><ol class="g360-acoes">${acoes.map((a) => `<li><span class="e" aria-hidden="true">${a.ic}</span><div><b>${esc(a.t)}</b><p>${esc(a.d)}</p></div>${a.b ? `<button class="btn sm ghost" type="button" data-ir="${a.v}">${esc(a.b)}</button>` : ""}</li>`).join("")}</ol></div>
        <div class="card"><h2>Ocupação por dia da semana</h2><p class="tiny mute">Últimas 4 semanas. Dias fechados ficam com traço.</p>
          <div class="g360-dow">${DIAS.map((n, i) => `<div><span class="b ${dowPct[i] == null ? "fech" : cor(dowPct[i])}" style="--h:${dowPct[i] == null ? 3 : Math.max(5, dowPct[i]).toFixed(0)}%"></span><b>${dowPct[i] == null ? "—" : pct(dowPct[i])}</b><small>${n}</small></div>`).join("")}</div>
          <h2 style="margin-top:20px">Funil do mês</h2>
          <div class="g360-funil">${funil.map(([n, v, c]) => `<div class="f ${c}"><span>${esc(n)}</span><i style="--w:${Math.max(2, (100 * v) / mxF).toFixed(1)}%"></i><b>${brl(v)}</b></div>`).join("")}</div>
        </div>
      </div>
      <div class="card"><h2>Mapa de ocupação · próximos 14 dias</h2><p class="tiny mute">Cada quadrado é o dia de um profissional. Quanto mais forte, mais cheio. Traço = folga ou fora do expediente.</p>
        <div class="g360-scroll"><div class="g360-mapa" style="--n:${dias14.length}"><div class="h"></div>${dias14.map((d) => `<div class="h"><small>${DIAS[dow(d)]}</small>${d.slice(8, 10)}</div>`).join("")}
        ${[...profs.values()].map((p) => `<div class="nm">${esc(p.nome)}</div>${dias14.map((d) => { const v = p.dias[d]; return `<div class="c ${v == null ? "fech" : cor(v)}" title="${esc(p.nome)} · ${fmtD(d)}: ${v == null ? "fechado" : pct(v)}">${v == null ? "–" : Math.round(v)}</div>`; }).join("")}`).join("")}
        </div></div>
        <div class="g360-leg"><span class="c q0"></span>vazio <span class="c q1"></span>até 35% <span class="c q2"></span>até 60% <span class="c q3"></span>até 85% <span class="c q4"></span>lotado</div>
      </div>
      <div class="grid g360-g2">
        <div class="card"><h2>${cap(tN)} sumidos que valem a pena chamar</h2>${sumidos.length ? `<ol class="rank">${sumidos.slice(0, 6).map((c) => `<li><b>${esc(c.nome)}</b><span>${c.dias_sem_vir} dias · ticket ${brl(c.ticket_centavos || 0)}${c.whatsapp ? ` · <a class="lnk" target="_blank" rel="noopener" href="${esc(waLink(c.whatsapp, `Oi, ${(c.nome || "").split(" ")[0]}! Sentimos sua falta aqui na ${S.emp?.nome || "loja"}. Que tal marcar um horário esta semana? ${vitrine()}`))}">chamar</a>` : ""}</span></li>`).join("")}</ol>` : '<p class="mute small">Ninguém sumido. Ótimo sinal!</p>'}</div>
        <div class="card"><h2>Serviços que mais faturam no mês</h2>${rel && rel.servicos && rel.servicos.length ? `<ol class="rank">${rel.servicos.slice(0, 6).map((x) => `<li><b>${esc(x.nome)}</b><span>${x.n}× · ${brl(x.v)}</span></li>`).join("")}</ol>` : '<p class="mute small">Sem atendimentos no mês ainda.</p>'}</div>
      </div>`;
    // ---- interações ----
    $$("[data-ir]", s).forEach((b) => (b.onclick = () => aba(b.dataset.ir)));
    $("#g360Atual", s).onclick = () => gestao().catch((e) => toast(e.message, true));
    $("#g360Meta", s).onclick = () => {
      const v = prompt("Meta de faturamento do mês (R$):", String(Math.round(meta / 100)));
      if (v == null) return; const n = Math.round(Number(String(v).replace(/\./g, "").replace(",", ".")) * 100);
      if (!(n > 0)) return toast("Digite um valor em reais, por exemplo 15000.", true);
      gravarMeta(n); gestao().catch((e) => toast(e.message, true));
    };
    $("#g360Csv", s).onclick = () => {
      const L = [["Indicador", "Valor"], ["Faturamento do mês (R$)", (ind.faturamento_centavos / 100).toFixed(2)], ["Previsão do mês (R$)", (previsao / 100).toFixed(2)], ["Meta (R$)", (meta / 100).toFixed(2)],
        ["Ticket médio (R$)", (ticket / 100).toFixed(2)], ["Ocupação próximos 7 dias (%)", ocup7.toFixed(1)], ["Ocupação 4 semanas (%)", ocupP.toFixed(1)], ["Horários livres 7 dias", vagasLivres],
        ["Recorrência (%)", ind.recorrencia_pct], ["Faltas (%)", ind.faltas_pct], ["Clientes sumidos", sumidos.length], ...DIAS.map((n, i) => [`Ocupação ${n} (%)`, dowPct[i] == null ? "fechado" : dowPct[i].toFixed(1)])];
      const csv = "﻿" + L.map((r) => r.map((x) => `"${String(x).replace(/"/g, '""').replace(/^[=+\-@]/, "'$&")}"`).join(";")).join("\r\n");
      const a = document.createElement("a"); a.href = "data:text/csv;charset=utf-8," + encodeURIComponent(csv); a.download = `gestao-360-${hoje}.csv`; document.body.appendChild(a); a.click(); a.remove();
    };
    // ---- movimento (respeita "reduzir movimento") ----
    if (G && !calmo) {
      G.from($$(".card", s), { opacity: 0, y: 12, duration: 0.45, stagger: 0.05, ease: "power2.out" });
      $$(".g360-anel .v", s).forEach((c) => G.fromTo(c, { attr: { "stroke-dashoffset": c.dataset.c } }, { attr: { "stroke-dashoffset": c.dataset.o }, duration: 1.2, ease: "power3.out" }));
      G.from($$(".g360-dow .b", s), { scaleY: 0, transformOrigin: "bottom", duration: 0.6, stagger: 0.05, ease: "power2.out" });
      G.from($$(".g360-funil i", s), { scaleX: 0, transformOrigin: "left", duration: 0.8, stagger: 0.08, ease: "power2.out" });
      G.from($$(".g360-mapa .c", s), { opacity: 0, scale: 0.6, duration: 0.3, stagger: 0.004, ease: "power1.out" });
      const v = $("[data-g360]", s), alvo = +v.dataset.g360, o = { n: 0 };
      G.to(o, { n: alvo, duration: 1.1, ease: "power2.out", onUpdate: () => (v.textContent = brl(Math.round(o.n))) });
    }
  }

  // ---------- registra no menu (grupo "Vender mais", primeiro item) ----------
  function registra() {
    if ($('.nav button[data-v="gestao"]')) return;
    const g = $$(".nav .nav-g").find((x) => /Vender mais/i.test(x.querySelector(".nav-t")?.textContent || ""));
    const b = Object.assign(document.createElement("button"), { type: "button" });
    b.dataset.v = "gestao"; b.setAttribute("role", "tab"); b.setAttribute("aria-selected", "false");
    b.innerHTML = '<svg class="ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M21 12a9 9 0 1 1-9-9"/><path d="M21 3v9h-9"/><path d="M12 12l6-6"/></svg><span>Gestão 360</span><em class="g360-novo">novo</em>';
    if (g) g.querySelector(".nav-t").after(b); else $(".nav")?.appendChild(b);
  }
  CARREGA.gestao = gestao;
  secao("gestao");
  registra();
  // no celular o menu é uma faixa que rola de lado: mantém a aba escolhida à vista
  const nav = $(".nav");
  if (nav) new MutationObserver(() => { const b = $('.nav button[aria-selected="true"]'); if (b && innerWidth <= 900) b.scrollIntoView({ inline: "nearest", block: "nearest" }); })
    .observe(nav, { subtree: true, attributes: true, attributeFilter: ["aria-selected"] });
})();
