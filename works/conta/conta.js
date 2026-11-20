// Páginas de conta comuns a todos os produtos LLD Works: /assinar, /recuperar, /privacidade, /termos.
// Fala só com /api/conta/* do próprio endereço do produto (o roteador repassa ao LLD Works Hub).
"use strict";
(() => {
  const $ = (s, r = document) => r.querySelector(s), $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const reais = (c) => ((+c || 0) / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
  const pagina = document.body.dataset.pagina;
  async function api(acao, corpo, params = "") {
    const r = await fetch(`/api/conta/${acao}${params}`, { method: corpo ? "POST" : "GET", headers: corpo ? { "Content-Type": "application/json" } : {}, body: corpo ? JSON.stringify(corpo) : undefined, credentials: "same-origin" });
    let d = null; try { d = await r.json(); } catch {}
    if (!r.ok) throw new Error(d?.erro || "Não foi possível concluir. Tente de novo em instantes.");
    return d;
  }
  const ocupado = async (btn, fn) => { const t = btn.textContent; btn.disabled = true; btn.textContent = "Aguarde…"; try { return await fn(); } finally { btn.disabled = false; btn.textContent = t; } };
  const zap = (tel, txt) => { const d = String(tel || "").replace(/\D/g, ""); return d ? `https://wa.me/${d.length <= 11 ? "55" + d : d}${txt ? "?text=" + encodeURIComponent(txt) : ""}` : null; };
  let P = null; // dados do produto

  async function marca() {
    P = await api("produto");
    document.documentElement.style.setProperty("--p", P.produto.cor);
    $$("[data-produto]").forEach((e) => (e.textContent = P.produto.nome));
    document.title = document.title.replace("{produto}", P.produto.nome);
    $$("[data-contato-email]").forEach((e) => { if (P.contato_email) { e.innerHTML = `<a href="mailto:${esc(P.contato_email)}">${esc(P.contato_email)}</a>`; } });
    $$("[data-contato-zap]").forEach((e) => { const u = zap(P.whatsapp); if (u) e.innerHTML = `<a href="${u}" target="_blank" rel="noopener">WhatsApp</a>`; });
    $$("[data-versao]").forEach((e) => (e.textContent = P.termos_versao ? P.termos_versao.split("-").reverse().join("/") : ""));
  }

  // ---------- /assinar ----------
  const NOMES_LIMITE = { profissionais: "profissionais na agenda", produtos: "produtos na loja", atendentes: "atendentes", conversas_mes: "conversas com IA por mês", contas: "perfis do Instagram", vagas_ativas: "vagas abertas ao mesmo tempo", paginas: "páginas" };
  let S = { plano: null, versao: null, token: null, email: null, sit: null };
  const VERSOES = { pet: ["Pet shop", "Banho e tosa, veterinário, hotel"], beleza: ["Salão e estética", "Cabelo, manicure, sobrancelha, estética"], barber: ["Barbearia", "Corte, barba, clube de assinatura"], clinica: ["Clínica", "Consultório, fisioterapia, estética clínica"] };
  const INCLUI = { agentworks: "Agente de WhatsApp com IA", linkworks: "Link na bio (LinkWorks)", socialworks: "Instagram: posts e respostas automáticas", salesworks: "Loja online", rhworks: "Triagem de currículos" };
  function itensDoPlano(l) {
    const out = [];
    for (const [k, v] of Object.entries(l || {})) {
      if (k === "inclui" && v && typeof v === "object") Object.keys(v).forEach((x) => out.push(INCLUI[x] || x));
      else if (k === "pagamento_online") out.push("Pagamento online: Pix e cartão");
      else if (k === "site") out.push("Site profissional feito pela LLD Works");
      else if (typeof v === "number") out.push(`até ${v} ${NOMES_LIMITE[k] || k.replace(/_/g, " ")}`);
    }
    return out;
  }
  const semAcento = (t) => String(t || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  const ETAPAS = ["plano", "dados", "codigo", "pagamento"];
  function mostra(etapa) {
    S.etapa = etapa;
    $$("[data-etapa]").forEach((s) => s.classList.toggle("oculto", s.dataset.etapa !== etapa));
    $("#boxRecomecar")?.classList.add("oculto");
    const i = ETAPAS.indexOf(etapa);
    $$(".passos li").forEach((li, k) => { li.classList.toggle("on", k === i); li.classList.toggle("feito", i > k || etapa === "pronto"); });
    window.scrollTo(0, 0);
    if (etapa === "pagamento") esperaPagamento(); else paraEspera();
    const f = $(`[data-etapa="${etapa}"] input:not([type=checkbox])`);
    if (f && etapa !== "plano") setTimeout(() => { if (!document.activeElement || !document.activeElement.matches("input,textarea,select")) f.focus(); }, 50);
  }
  const chaveCad = () => "lw_cad_" + P.produto.slug;
  const guarda = (t) => { S.token = t; try { sessionStorage.setItem(chaveCad(), t); } catch {} history.replaceState(null, "", location.pathname + location.search + "#t=" + t); };
  const esquece = () => { S.token = null; try { sessionStorage.removeItem(chaveCad()); } catch {} history.replaceState(null, "", location.pathname + location.search); };
  const periodo = (p) => (p && p.ciclo === "anual" ? "ano" : "mês");
  function cardPlano(p, marcado) {
    const itens = (P.produto && P.produto.slug === "serviceworks" ? ["Agenda, vitrine, CRM, caixa, estoque, promoções e indicadores"] : []).concat(itensDoPlano(p.limites));
    return `<button type="button" class="plano" data-plano="${p.id}" aria-pressed="${marcado ? "true" : "false"}"><b>${esc(p.nome)}</b><span class="preco">${reais(p.preco_centavos)}<small>/${periodo(p)}</small></span>
      <ul>${itens.length ? itens.map((t) => `<li>${esc(t)}</li>`).join("") : "<li>tudo incluso</li>"}</ul></button>`;
  }
  // Desenha versões e planos. "inicial" aplica o plano e a versão vindos do link do site (?versao=&plano=).
  function desenhaPlanos(inicial) {
    const q = new URLSearchParams(location.search), pre = q.get("plano"), pv = q.get("versao");
    if (P.versoes && P.versoes.length) {
      $("#versoes").classList.remove("oculto");
      $("#versoesLista").innerHTML = P.versoes.map((v) => `<button type="button" class="versao" role="radio" aria-checked="${S.versao === v}" data-ver="${v}"><b>${esc((VERSOES[v] || [v])[0])}</b><span>${esc((VERSOES[v] || ["", ""])[1])}</span></button>`).join("");
      if (inicial && pv && P.versoes.includes(pv)) escolheVersao(pv);
    }
    $("#planos").innerHTML = P.planos.map((p) => cardPlano(p, S.plano && S.plano.id === p.id)).join("") || '<p class="aviso">Nenhum plano à venda neste momento. Fale com a LLD Works.</p>';
    if (S.plano) { const atual = P.planos.find((p) => p.id === S.plano.id); if (atual) escolhe(atual.id); else { S.plano = null; $("#irDados").disabled = true; } }
    const alvo = inicial && pre && P.planos.find((p) => String(p.id) === pre || semAcento(p.nome) === semAcento(pre));
    if (alvo) escolhe(alvo.id);
    return !!alvo;
  }
  function escolheVersao(v) {
    S.versao = v;
    $$("[data-ver]").forEach((b) => b.setAttribute("aria-checked", String(b.dataset.ver === v)));
    $("#irDados").disabled = !S.plano || !S.versao;
    if (S.plano) escolhe(S.plano.id);
  }
  function escolhe(id) {
    S.plano = P.planos.find((p) => p.id === id);
    if (!S.plano) return;
    $$("#planos .plano").forEach((b) => b.setAttribute("aria-pressed", String(+b.dataset.plano === id)));
    $("#irDados").disabled = !S.plano || (P.versoes && P.versoes.length && !S.versao);
    const ver = S.versao && VERSOES[S.versao] ? ` · ${esc(VERSOES[S.versao][0])}` : "";
    $("#resumoPlano").innerHTML = `<span>Plano <b>${esc(S.plano.nome)}</b>${ver}</span><span><b>${reais(S.plano.preco_centavos)}</b>/${periodo(S.plano)} · <button type="button" class="btn link" data-trocar-plano>trocar</button></span>`;
  }
  function resumoPagamento(sit) {
    const troca = ["email", "pagamento"].includes(sit.etapa) && P.planos.length > 1 ? ` · <button type="button" class="btn link" data-troca-pag>trocar plano</button>` : "";
    $("#resumoPag").innerHTML = `<span>${esc(P.produto.nome)} · plano <b>${esc(sit.plano?.nome || "")}</b></span><span><b>${reais(sit.plano?.preco_centavos)}</b>/${periodo(sit.plano)}${troca}</span>`;
  }
  function telaPagamento(sit) {
    S.sit = sit;
    if (sit.etapa === "ativo") return pronto();
    if (sit.etapa === "existente") return existente();
    if (sit.etapa === "cancelado") return recomeca(false);
    if (sit.etapa === "email") { S.email = sit.email; $("#emailMostra").textContent = sit.email; return mostra("codigo"); }
    resumoPagamento(sit);
    $("#trocaPlano").classList.add("oculto");
    const online = !!sit.pagamento.mercadopago, pix = sit.pagamento.pix;
    $("#pagMP").classList.toggle("oculto", !online);
    // Chave Pix manual só aparece quando o pagamento online não está ligado (o Pix com QR Code já confirma sozinho).
    $("#pagPix").classList.toggle("oculto", !pix || online);
    if (pix) { $("#pixChave").textContent = pix.chave; $("#pixTitular").textContent = pix.titular; $("#pixValor").textContent = reais(sit.plano?.preco_centavos); }
    const z = zap(sit.whatsapp, `Olá! Fiz o cadastro no ${P.produto.nome} (${sit.email}) e quero concluir o pagamento.`);
    $("#pagNada").classList.toggle("oculto", !!(pix || online));
    $$("[data-zap]").forEach((a) => { a.classList.toggle("oculto", !z); if (z) a.href = z; });
    $("#avisouOk").classList.toggle("oculto", !sit.avisou_pagamento);
    $("#jaPaguei").classList.toggle("oculto", !!sit.avisou_pagamento);
    if (S.etapa !== "pagamento") mostra("pagamento");
  }
  function pronto() { paraEspera(); $("#linkEntrar").href = S.sit?.entrar || "/entrar"; mostra("pronto"); }
  function existente() { mostra("existente"); }

  // Começar de novo: cancela o cadastro em andamento (nada foi cobrado) e volta para a escolha do plano.
  async function recomeca(cancelar) {
    paraEspera();
    if (cancelar && S.token) await api("cadastro/cancelar", { token: S.token });
    esquece();
    S = { plano: null, versao: null, token: null, email: null, sit: null, etapa: null };
    $("#fDados")?.reset(); const c = $("#cCodigo"); if (c) c.value = "";
    $("#pixBox")?.classList.add("oculto"); const g = $("#gerarPix"); if (g) { g.classList.remove("oculto"); g.textContent = "Gerar QR Code Pix"; }
    ["#erroPag", "#erroDados", "#erroCodigo"].forEach((s) => { const e = $(s); if (e) e.textContent = ""; });
    desenhaPlanos(true); // mantém o tipo do negócio e o plano que vieram do site, se houver
    mostra("plano");
  }

  // Enquanto a tela de pagamento estiver aberta, confere a cada 4 s se o pagamento caiu (o webhook libera o acesso).
  let timerEspera = null;
  function paraEspera() { if (timerEspera) { clearInterval(timerEspera); timerEspera = null; } }
  function esperaPagamento() {
    paraEspera();
    timerEspera = setInterval(async () => {
      if (document.hidden || !S.token || S.etapa !== "pagamento") return;
      try {
        const sit = await api("cadastro", null, `?token=${encodeURIComponent(S.token)}`);
        if (sit.etapa === "ativo") { S.sit = sit; return pronto(); }
        if (sit.etapa !== "pagamento") return telaPagamento(sit);
        if (sit.plano?.preco_centavos !== S.sit?.plano?.preco_centavos || sit.plano?.nome !== S.sit?.plano?.nome) { S.sit = sit; resumoPagamento(sit); }
      } catch (x) { if (/não encontrado/i.test(x.message)) recomeca(false); }
    }, 4000);
  }

  // Preços e planos ao vivo: o que for salvo no console aparece aqui sem recarregar a página.
  let assinaturaP = "";
  async function atualizaProduto() {
    try {
      const novo = await api("produto"), ass = JSON.stringify([novo.planos, novo.pagamento, novo.versoes]);
      if (ass === assinaturaP) return;
      assinaturaP = ass; P = novo;
      if (pagina !== "assinar") return;
      if (S.etapa === "plano" || S.etapa === "dados") desenhaPlanos(false);
      if (!$("#trocaPlano").classList.contains("oculto")) desenhaTroca();
      if (S.etapa === "pagamento" && S.token) telaPagamento(await api("cadastro", null, `?token=${encodeURIComponent(S.token)}`));
    } catch {}
  }
  function desenhaTroca() {
    const atual = S.sit?.plano?.id;
    $("#planosTroca").innerHTML = P.planos.map((p) => cardPlano(p, p.id === atual).replace("data-plano=", "data-plano-troca=")).join("");
  }

  async function iniciaAssinar() {
    assinaturaP = JSON.stringify([P.planos, P.pagamento, P.versoes]);
    const veioDoSite = desenhaPlanos(true);
    const t = (location.hash.match(/t=([\w-]{20,})/) || [])[1] || (() => { try { return sessionStorage.getItem(chaveCad()); } catch { return null; } })();
    if (t) {
      try { S.token = t; const sit = await api("cadastro", null, `?token=${encodeURIComponent(t)}`); return telaPagamento(sit); }
      catch { esquece(); }
    }
    // Plano (e tipo do negócio) já escolhidos no site de venda: vai direto para os dados, sem pedir o plano de novo.
    if (veioDoSite && S.plano && (!P.versoes || !P.versoes.length || S.versao)) return mostra("dados");
    mostra("plano");
  }
  document.addEventListener("click", async (e) => {
    const pl = e.target.closest("[data-plano]"); if (pl) return escolhe(+pl.dataset.plano);
    const vr = e.target.closest("[data-ver]"); if (vr) return escolheVersao(vr.dataset.ver);
    if (e.target.closest("[data-trocar-plano]")) return mostra("plano");
    if (e.target.closest("#irDados")) { if (S.plano && (!P.versoes || S.versao)) mostra("dados"); return; }
    if (e.target.closest("#verSenha")) { const i = $("#cSenha"); i.type = i.type === "password" ? "text" : "password"; e.target.closest("#verSenha").textContent = i.type === "password" ? "mostrar" : "esconder"; return; }
    if (e.target.closest("#reenviar")) {
      const b = e.target.closest("#reenviar"); $("#erroCodigo").textContent = "";
      try { await ocupado(b, () => api("cadastro/reenviar", { token: S.token })); $("#infoCodigo").textContent = "Enviamos um novo código. Ele substitui o anterior."; } catch (x) { $("#erroCodigo").textContent = x.message; }
      return;
    }
    if (e.target.closest("#corrigir")) { $("#boxCorrigir").classList.toggle("oculto"); $("#novoEmail").value = S.email || ""; $("#novoEmail").focus(); return; }
    if (e.target.closest("#salvarEmail")) {
      const b = e.target.closest("#salvarEmail"); $("#erroCodigo").textContent = "";
      try { const r = await ocupado(b, () => api("cadastro/email", { token: S.token, email: $("#novoEmail").value })); S.email = r.email; $("#emailMostra").textContent = r.email; $("#boxCorrigir").classList.add("oculto"); $("#infoCodigo").textContent = "E-mail corrigido. Enviamos um novo código para ele."; }
      catch (x) { $("#erroCodigo").textContent = x.message; }
      return;
    }
    if (e.target.closest("#pagarMP")) {
      const b = e.target.closest("#pagarMP"); $("#erroPag").textContent = "";
      try { const r = await ocupado(b, () => api("cadastro/pagar", { token: S.token })); location.href = r.link; } catch (x) { $("#erroPag").textContent = x.message; }
      return;
    }
    if (e.target.closest("#copiarPix")) { navigator.clipboard.writeText($("#pixChave").textContent).then(() => (e.target.closest("#copiarPix").textContent = "Copiado ✓")).catch(() => {}); return; }
    if (e.target.closest("#jaPaguei")) {
      const b = e.target.closest("#jaPaguei"); $("#erroPag").textContent = "";
      try { await ocupado(b, () => api("cadastro/avisar-pix", { token: S.token })); b.classList.add("oculto"); $("#avisouOk").classList.remove("oculto"); } catch (x) { $("#erroPag").textContent = x.message; }
      return;
    }
    if (e.target.closest("#atualizar")) { try { telaPagamento(await api("cadastro", null, `?token=${encodeURIComponent(S.token)}`)); } catch (x) { $("#erroPag").textContent = x.message; } return; }
    // Começar de novo (código, pagamento ou "já tem conta"): pede confirmação na própria página.
    if (e.target.closest("[data-recomecar]")) { const box = $("#boxRecomecar"); $("#erroRecomecar").textContent = ""; box.classList.remove("oculto"); box.scrollIntoView({ behavior: "smooth", block: "center" }); $("#simRecomecar").focus(); return; }
    if (e.target.closest("#naoRecomecar")) { $("#boxRecomecar").classList.add("oculto"); return; }
    if (e.target.closest("#simRecomecar")) {
      const b = e.target.closest("#simRecomecar"); $("#erroRecomecar").textContent = "";
      try { await ocupado(b, () => recomeca(true)); } catch (x) { $("#erroRecomecar").textContent = x.message; }
      return;
    }
    // Trocar o plano antes de pagar.
    if (e.target.closest("[data-troca-pag]")) { const t = $("#trocaPlano"); t.classList.toggle("oculto"); if (!t.classList.contains("oculto")) desenhaTroca(); $("#erroTroca").textContent = ""; return; }
    const pt = e.target.closest("[data-plano-troca]");
    if (pt) {
      $("#erroTroca").textContent = "";
      try {
        const sit = await api("cadastro/plano", { token: S.token, plano_id: +pt.dataset.planoTroca });
        $("#pixBox").classList.add("oculto"); $("#gerarPix").classList.remove("oculto"); $("#gerarPix").textContent = "Gerar QR Code Pix";
        telaPagamento(sit);
      } catch (x) { $("#erroTroca").textContent = x.message; }
      return;
    }
    // Pix com QR Code na tela: o acesso é liberado sozinho quando o pagamento cai.
    if (e.target.closest("#gerarPix")) {
      const b = e.target.closest("#gerarPix"); $("#erroPag").textContent = "";
      try {
        const r = await ocupado(b, () => api("cadastro/pix", { token: S.token }));
        if (!r.qr && !r.copia_cola) throw new Error("O Mercado Pago não devolveu o QR Code. Tente de novo ou pague com cartão.");
        if (r.qr) $("#pixQr").src = "data:image/png;base64," + r.qr; $("#pixQr").classList.toggle("oculto", !r.qr);
        $("#pixCopia").value = r.copia_cola || "";
        const ate = r.expira_em ? new Date(r.expira_em) : null;
        $("#pixValidade").textContent = ate && !isNaN(ate) ? `Válido até ${ate.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}. Depois disso, gere um novo.` : "";
        $("#pixBox").classList.remove("oculto"); b.classList.add("oculto");
        $("#copiarCopia").textContent = "Copiar código Pix";
      } catch (x) { $("#erroPag").textContent = x.message; }
      return;
    }
    if (e.target.closest("#copiarCopia")) {
      const b = e.target.closest("#copiarCopia"), t = $("#pixCopia");
      navigator.clipboard.writeText(t.value).then(() => (b.textContent = "Copiado ✓")).catch(() => { t.select(); document.execCommand && document.execCommand("copy"); b.textContent = "Copiado ✓"; });
    }
  });
  document.addEventListener("submit", async (e) => {
    const f = e.target;
    if (f.id === "fDados") {
      e.preventDefault(); $("#erroDados").textContent = "";
      const d = Object.fromEntries(new FormData(f).entries());
      try {
        const r = await ocupado(f.querySelector("button[type=submit]"), () => api("cadastro", { plano_id: S.plano.id, versao: S.versao || undefined, nome: d.nome, empresa: d.empresa, telefone: d.telefone, email: d.email, email_confirma: d.email_confirma, documento: d.documento, senha: d.senha, termos: !!d.termos, novidades: !!d.novidades }));
        guarda(r.token); S.email = r.email; $("#emailMostra").textContent = r.email; $("#cSenha").value = "";
        mostra("codigo");
      } catch (x) { $("#erroDados").textContent = x.message; }
    }
    if (f.id === "fCodigo") {
      e.preventDefault(); $("#erroCodigo").textContent = "";
      try { telaPagamento(await ocupado(f.querySelector("button[type=submit]"), () => api("cadastro/confirmar", { token: S.token, codigo: $("#cCodigo").value.replace(/\D/g, "") }))); }
      catch (x) { $("#erroCodigo").textContent = x.message; }
    }
    // ---------- /recuperar ----------
    if (f.id === "fPedir") {
      e.preventDefault(); $("#erroPedir").textContent = "";
      try { await ocupado(f.querySelector("button[type=submit]"), () => api("senha/pedir", { email: $("#rEmail").value })); $("#rEmailMostra").textContent = $("#rEmail").value.trim().toLowerCase(); $("#fPedir").classList.add("oculto"); $("#passo2").classList.remove("oculto"); $("#rCodigo").focus(); }
      catch (x) { $("#erroPedir").textContent = x.message; }
    }
    if (f.id === "passo2") {
      e.preventDefault(); $("#erroTrocar").textContent = "";
      if ($("#rSenha").value !== $("#rSenha2").value) { $("#erroTrocar").textContent = "As duas senhas não são iguais."; return; }
      try { await ocupado(f.querySelector("button[type=submit]"), () => api("senha/trocar", { email: $("#rEmailMostra").textContent, codigo: $("#rCodigo").value.replace(/\D/g, ""), senha: $("#rSenha").value })); $("#passo2").classList.add("oculto"); $("#passo3").classList.remove("oculto"); }
      catch (x) { $("#erroTrocar").textContent = x.message; }
    }
  });
  document.addEventListener("click", (e) => { if (e.target.closest("#rVoltar")) { $("#passo2").classList.add("oculto"); $("#fPedir").classList.remove("oculto"); } });

  marca().then(() => {
    if (pagina === "assinar") {
      iniciaAssinar();
      setInterval(() => { if (!document.hidden) atualizaProduto(); }, 30000);
      document.addEventListener("visibilitychange", () => { if (!document.hidden) atualizaProduto(); });
    }
    if (pagina === "recuperar" && new URLSearchParams(location.search).get("primeiro")) { $$("[data-primeiro]").forEach((x) => x.classList.remove("oculto")); $$("[data-esqueci]").forEach((x) => x.classList.add("oculto")); }
  }).catch((x) => { const m = $("main"); if (m) m.insertAdjacentHTML("afterbegin", `<p class="aviso">${esc(x.message)}</p>`); });
})();
