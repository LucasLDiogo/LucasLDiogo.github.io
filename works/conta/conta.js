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
    $$("[data-etapa]").forEach((s) => s.classList.toggle("oculto", s.dataset.etapa !== etapa));
    const i = ETAPAS.indexOf(etapa);
    $$(".passos li").forEach((li, k) => { li.classList.toggle("on", k === i); li.classList.toggle("feito", i > k || etapa === "pronto"); });
    window.scrollTo(0, 0);
    const f = $(`[data-etapa="${etapa}"] input:not([type=checkbox])`);
    if (f && etapa !== "plano") setTimeout(() => { if (!document.activeElement || !document.activeElement.matches("input,textarea,select")) f.focus(); }, 50);
  }
  const guarda = (t) => { S.token = t; try { sessionStorage.setItem("lw_cad_" + P.produto.slug, t); } catch {} history.replaceState(null, "", "#t=" + t); };
  function desenhaPlanos() {
    const q = new URLSearchParams(location.search), pre = q.get("plano"), pv = q.get("versao");
    if (P.versoes && P.versoes.length) {
      $("#versoes").classList.remove("oculto");
      $("#versoesLista").innerHTML = P.versoes.map((v) => `<button type="button" class="versao" role="radio" aria-checked="false" data-ver="${v}"><b>${esc((VERSOES[v] || [v])[0])}</b><span>${esc((VERSOES[v] || ["", ""])[1])}</span></button>`).join("");
      if (pv && P.versoes.includes(pv)) escolheVersao(pv);
    }
    $("#planos").innerHTML = P.planos.map((p) => { const itens = itensDoPlano(p.limites); return `<button type="button" class="plano" data-plano="${p.id}" aria-pressed="false"><b>${esc(p.nome)}</b><span class="preco">${reais(p.preco_centavos)}<small>/${p.ciclo === "anual" ? "ano" : "mês"}</small></span>
      <ul>${itens.length ? itens.map((t) => `<li>${esc(t)}</li>`).join("") : "<li>tudo incluso</li>"}</ul></button>`; }).join("") || '<p class="aviso">Nenhum plano à venda neste momento. Fale com a LLD Works.</p>';
    const alvo = pre && P.planos.find((p) => String(p.id) === pre || semAcento(p.nome) === semAcento(pre));
    if (alvo) escolhe(alvo.id);
  }
  function escolheVersao(v) {
    S.versao = v;
    $$("[data-ver]").forEach((b) => b.setAttribute("aria-checked", String(b.dataset.ver === v)));
    $("#irDados").disabled = !S.plano || !S.versao;
  }
  function escolhe(id) {
    S.plano = P.planos.find((p) => p.id === id);
    $$(".plano").forEach((b) => b.setAttribute("aria-pressed", String(+b.dataset.plano === id)));
    $("#irDados").disabled = !S.plano || (P.versoes && P.versoes.length && !S.versao);
    $("#resumoPlano").innerHTML = `<span>Plano <b>${esc(S.plano.nome)}</b></span><span><b>${reais(S.plano.preco_centavos)}</b>/${S.plano.ciclo === "anual" ? "ano" : "mês"} · <button type="button" class="btn link" data-trocar-plano>trocar</button></span>`;
  }
  function telaPagamento(sit) {
    S.sit = sit;
    if (sit.etapa === "ativo") return pronto();
    if (sit.etapa === "existente") return existente();
    if (sit.etapa === "email") { S.email = sit.email; $("#emailMostra").textContent = sit.email; return mostra("codigo"); }
    $("#resumoPag").innerHTML = `<span>${esc(P.produto.nome)} · plano <b>${esc(sit.plano?.nome || "")}</b></span><span><b>${reais(sit.plano?.preco_centavos)}</b>/${sit.plano?.ciclo === "anual" ? "ano" : "mês"}</span>`;
    $("#pagMP").classList.toggle("oculto", !sit.pagamento.mercadopago);
    $("#atualizar").classList.toggle("oculto", !sit.pagamento.mercadopago);
    const pix = sit.pagamento.pix;
    $("#pagPix").classList.toggle("oculto", !pix);
    if (pix) { $("#pixChave").textContent = pix.chave; $("#pixTitular").textContent = pix.titular; $("#pixValor").textContent = reais(sit.plano?.preco_centavos); }
    const z = zap(sit.whatsapp, `Olá! Fiz o cadastro no ${P.produto.nome} (${sit.email}) e quero concluir o pagamento.`);
    $("#pagNada").classList.toggle("oculto", !!(pix || sit.pagamento.mercadopago));
    $$("[data-zap]").forEach((a) => { a.classList.toggle("oculto", !z); if (z) a.href = z; });
    $("#avisouOk").classList.toggle("oculto", !sit.avisou_pagamento);
    $("#jaPaguei").classList.toggle("oculto", !!sit.avisou_pagamento);
    mostra("pagamento");
  }
  function pronto() { $("#linkEntrar").href = S.sit?.entrar || "/entrar"; mostra("pronto"); }
  function existente() { mostra("existente"); }

  async function iniciaAssinar() {
    desenhaPlanos();
    const t = (location.hash.match(/t=([\w-]{20,})/) || [])[1] || (() => { try { return sessionStorage.getItem("lw_cad_" + P.produto.slug); } catch { return null; } })();
    if (t) {
      try { S.token = t; const sit = await api("cadastro", null, `?token=${encodeURIComponent(t)}`); return telaPagamento(sit); }
      catch { try { sessionStorage.removeItem("lw_cad_" + P.produto.slug); } catch {} history.replaceState(null, "", location.pathname + location.search); }
    }
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
    if (e.target.closest("#atualizar")) { try { telaPagamento(await api("cadastro", null, `?token=${encodeURIComponent(S.token)}`)); } catch (x) { $("#erroPag").textContent = x.message; } }
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
    if (pagina === "assinar") iniciaAssinar();
    if (pagina === "recuperar" && new URLSearchParams(location.search).get("primeiro")) { $$("[data-primeiro]").forEach((x) => x.classList.remove("oculto")); $$("[data-esqueci]").forEach((x) => x.classList.add("oculto")); }
  }).catch((x) => { const m = $("main"); if (m) m.insertAdjacentHTML("afterbegin", `<p class="aviso">${esc(x.message)}</p>`); });
})();
