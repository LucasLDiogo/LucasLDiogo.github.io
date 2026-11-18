// RHWorks · página pública da vaga: mostra a vaga e recebe a candidatura.
// O currículo (PDF, Word ou TXT) é lido aqui no navegador; só o texto vai para o servidor.
(() => {
  "use strict";
  const $ = (s, r = document) => r.querySelector(s);
  const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const codigo = (location.pathname.match(/^\/vaga\/([a-z0-9]{8})\/?$/) || [])[1];
  const vg = $("#vg");
  const MODELO = { presencial: "Presencial", hibrido: "Híbrido", remoto: "Remoto" };
  const VIAGEM = { ocasionais: "Viagens ocasionais", frequentes: "Viagens frequentes" };
  const MAX_ARQ = 5 * 1024 * 1024;
  let texto = "", arquivo = null;

  const fim = (titulo, msg, icone = "✓") => { vg.innerHTML = `<div class="vg-card fim"><div class="ok" aria-hidden="true">${icone}</div><h2 tabindex="-1">${esc(titulo)}</h2><p>${msg}</p></div>`; $(".fim h2").focus(); };

  // ---------- leitura do arquivo ----------
  const script = (src) => new Promise((ok, erro) => { const s = document.createElement("script"); s.src = src; s.onload = ok; s.onerror = () => erro(new Error("Não consegui carregar o leitor de arquivos. Confira a internet e tente de novo.")); document.head.appendChild(s); });
  async function lerPDF(f) {
    if (!window.pdfjsLib) await script("/lib/pdf.min.js");
    if (!(window.pdfjsWorker && window.pdfjsWorker.WorkerMessageHandler)) await script("/lib/pdf.worker.min.js");
    const pdf = await window.pdfjsLib.getDocument({ data: new Uint8Array(await f.arrayBuffer()), isEvalSupported: false }).promise;
    let out = "";
    for (let p = 1; p <= Math.min(pdf.numPages, 12); p++) {
      const tc = await (await pdf.getPage(p)).getTextContent();
      let y = null, linha = "";
      for (const it of tc.items) {
        if (!it.transform) continue;
        const yy = it.transform[5];
        if (y !== null && Math.abs(yy - y) > 4) { out += linha.replace(/[ \t]+/g, " ").trim() + "\n"; linha = ""; }
        linha += (linha && !/\s$/.test(linha) && !/^\s/.test(it.str) ? " " : "") + it.str; y = yy;
        if (it.hasEOL) { out += linha.replace(/[ \t]+/g, " ").trim() + "\n"; linha = ""; y = null; }
      }
      out += linha.trim() + "\n\n";
    }
    return out.replace(/\n{3,}/g, "\n\n").trim();
  }
  async function lerDOCX(f) {
    if (!window.mammoth) await script("/lib/mammoth.browser.min.js");
    return (await window.mammoth.extractRawText({ arrayBuffer: await f.arrayBuffer() })).value.replace(/\n{3,}/g, "\n\n").trim();
  }
  async function lerArquivo(f) {
    const ext = (f.name.split(".").pop() || "").toLowerCase();
    if (f.size > MAX_ARQ) throw new Error("Arquivo maior que 5 MB. Envie uma versão menor.");
    let t = "";
    if (ext === "pdf") t = await lerPDF(f);
    else if (ext === "docx") t = await lerDOCX(f);
    else if (["txt", "md"].includes(ext)) t = await f.text();
    else throw new Error("Formato não aceito. Use PDF, Word (.docx) ou TXT.");
    if (t.replace(/\s/g, "").length < 200) throw new Error("Não consegui ler o texto deste arquivo (pode ser uma imagem escaneada). Envie em Word ou outro PDF.");
    return t.slice(0, 40000);
  }

  // ---------- tela ----------
  function desenha(v) {
    document.title = `${v.titulo} · ${v.empresa || "Vaga"} · RHWorks`;
    const chips = [v.nivel, v.cidade && `${v.cidade}${v.uf ? "/" + v.uf : ""}`, MODELO[v.modelo] || v.modelo, v.contrato, VIAGEM[v.viagem], v.salario].filter(Boolean);
    const req = [...v.hard.map((h) => `<span class="${h.obrigatoria ? "obr" : ""}">${esc(h.nome)}${h.obrigatoria ? " · essencial" : ""}</span>`), ...v.idiomas.map((i) => `<span>${esc(i)}</span>`), ...v.soft.map((s) => `<span>${esc(s)}</span>`)];
    vg.innerHTML = `
      <header class="vg-topo"><div class="vg-emp">${esc(v.empresa || "Vaga aberta")}</div><h1>${esc(v.titulo)}</h1><div class="vg-chips">${chips.map((c) => `<span>${esc(c)}</span>`).join("")}</div></header>
      ${v.descricao ? `<section class="vg-card"><h2>Sobre a vaga</h2><p>${esc(v.descricao)}</p></section>` : ""}
      ${v.responsabilidades ? `<section class="vg-card"><h2>O que você vai fazer</h2><p>${esc(v.responsabilidades)}</p></section>` : ""}
      ${req.length || v.expMin ? `<section class="vg-card"><h2>O que buscamos</h2>${v.expMin ? `<p>Experiência a partir de ${v.expMin} ano${v.expMin > 1 ? "s" : ""}.</p>` : ""}<div class="req">${req.join("")}</div></section>` : ""}
      <section class="vg-card"><form class="vg-form" novalidate>
        <h2>Candidate-se</h2>
        <div class="grid2">
          <div class="campo"><label for="nome">Nome completo *</label><input id="nome" name="nome" autocomplete="name" required maxlength="120"></div>
          <div class="campo"><label for="email">E-mail *</label><input id="email" name="email" type="email" inputmode="email" autocomplete="email" required maxlength="200"></div>
          <div class="campo"><label for="telefone">Celular / WhatsApp</label><input id="telefone" name="telefone" type="tel" inputmode="tel" autocomplete="tel" maxlength="30" placeholder="(54) 99999-0000"></div>
          <div class="campo"><label for="cidade">Cidade onde mora</label><input id="cidade" name="cidade" autocomplete="address-level2" maxlength="80"></div>
        </div>
        <label class="arq" id="arq"><input type="file" id="arquivo" accept=".pdf,.docx,.txt,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain" aria-describedby="arqTxt">
          <span class="ic" aria-hidden="true"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 15V3M7 8l5-5 5 5"/><path d="M4 15v4a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-4"/></svg></span>
          <div id="arqTxt"><b>Anexe o seu currículo</b><span>PDF, Word ou o PDF do seu perfil do LinkedIn · até 5 MB</span></div></label>
        <p class="dica">Dica: no LinkedIn, abra o seu perfil e toque em <b>Mais → Salvar em PDF</b>. Esse arquivo também serve como currículo.</p>
        <div class="ou">e / ou</div>
        <div class="campo"><label for="linkedin">Link do seu LinkedIn</label><input id="linkedin" name="linkedin" type="url" inputmode="url" placeholder="linkedin.com/in/seu-nome" maxlength="200"><small>Sem currículo anexado, conte também um resumo da sua experiência abaixo.</small></div>
        <div class="campo"><label for="resumo">Resumo da sua experiência <span id="resumoObr"></span></label><textarea id="resumo" name="resumo" maxlength="3000" placeholder="Onde trabalhou, o que fazia, ferramentas que domina e resultados."></textarea></div>
        <div class="armadilha" aria-hidden="true"><label for="site">Site</label><input id="site" name="site" tabindex="-1" autocomplete="off"></div>
        <label class="aceite"><input type="checkbox" id="aceite" required><span>Autorizo ${esc(v.empresa || "a empresa")} a usar os meus dados e o meu currículo neste processo seletivo, inclusive com análise apoiada por IA, conforme a <a href="/privacidade" target="_blank" rel="noopener">Política de Privacidade</a>. Posso pedir a exclusão a qualquer momento.</span></label>
        <p class="erro" id="erro" role="alert"></p>
        <button class="b pri grande" type="submit"><span>Enviar candidatura</span></button>
      </form></section>`;
    liga();
  }
  function liga() {
    const f = $(".vg-form"), arq = $("#arq"), inp = $("#arquivo"), er = $("#erro"), bt = f.querySelector("button[type=submit]");
    const marcaResumo = () => { $("#resumoObr").textContent = texto ? "(opcional)" : $("#linkedin").value.trim() ? "* (mínimo de 80 caracteres)" : "(opcional)"; };
    $("#linkedin").addEventListener("input", marcaResumo); marcaResumo();
    f.addEventListener("input", (e) => { if (e.target.removeAttribute) e.target.removeAttribute("aria-invalid"); });
    ["dragenter", "dragover"].forEach((t) => arq.addEventListener(t, () => arq.classList.add("sobre")));
    ["dragleave", "drop"].forEach((t) => arq.addEventListener(t, () => arq.classList.remove("sobre")));
    inp.addEventListener("change", async () => {
      const a = inp.files[0]; texto = ""; arquivo = null; arq.classList.remove("ok"); er.textContent = "";
      if (!a) return;
      $("#arqTxt").innerHTML = `<b>Lendo ${esc(a.name)}…</b><span>Isso leva poucos segundos.</span>`;
      try {
        texto = await lerArquivo(a); arquivo = { nome: a.name.slice(0, 140), tipo: (a.name.split(".").pop() || "").toLowerCase() };
        arq.classList.add("ok"); $("#arqTxt").innerHTML = `<b>${esc(a.name)}</b><span>Currículo lido. Pode trocar o arquivo se quiser.</span>`;
      } catch (e) { inp.value = ""; $("#arqTxt").innerHTML = `<b>Anexe o seu currículo</b><span>PDF, Word ou o PDF do LinkedIn · até 5 MB</span>`; er.textContent = e.message; }
      marcaResumo();
    });
    f.addEventListener("submit", async (e) => {
      e.preventDefault(); er.textContent = "";
      const val = (id) => $("#" + id).value.trim();
      const marca = (id, ruim) => $("#" + id).setAttribute("aria-invalid", String(!!ruim));
      const nome = val("nome"), email = val("email"), linkedin = val("linkedin"), resumo = val("resumo");
      const erros = [];
      marca("nome", nome.length < 3); if (nome.length < 3) erros.push(["nome", "Informe o seu nome completo."]);
      const emOk = /^[^\s@]+@[^\s@]+\.[a-z]{2,}$/i.test(email); marca("email", !emOk); if (!emOk) erros.push(["email", "Confira o seu e-mail."]);
      const liOk = !linkedin || /^(https?:\/\/)?([a-z]{2,3}\.)?linkedin\.com\/in\/[^\s/]{2,}\/?$/i.test(linkedin); marca("linkedin", !liOk); if (!liOk) erros.push(["linkedin", "O link do LinkedIn deve ser como linkedin.com/in/seu-nome."]);
      if (!texto && !linkedin) erros.push(["arquivo", "Anexe o currículo ou informe o link do seu LinkedIn."]);
      if (!texto && linkedin && resumo.length < 80) { marca("resumo", true); erros.push(["resumo", "Sem currículo anexado, conte a sua experiência no resumo (mínimo de 80 caracteres)."]); } else marca("resumo", false);
      if (!$("#aceite").checked) erros.push(["aceite", "Para enviar, aceite o aviso de privacidade."]);
      if (erros.length) { er.textContent = erros[0][1]; $("#" + erros[0][0]).focus(); return; }
      bt.setAttribute("aria-busy", "true"); bt.firstElementChild.textContent = "Enviando…";
      try {
        const r = await fetch(`/api/publico/vaga/${codigo}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ nome, email, telefone: val("telefone"), cidade: val("cidade"), linkedin, resumo, texto, arquivo, consentimento: true, site: $("#site").value }) });
        const j = await r.json().catch(() => ({}));
        if (r.ok) return fim("Candidatura enviada!", `Recebemos os seus dados para <b>${esc(j.titulo || "a vaga")}</b>. Se o seu perfil seguir no processo, a empresa entra em contato pelo e-mail ou telefone informado.`);
        if (r.status === 409) return fim("Você já está nesta vaga", esc(j.erro), "✓");
        er.textContent = j.erro || "Não consegui enviar agora. Tente de novo em instantes.";
      } catch { er.textContent = "Sem conexão. Confira a internet e tente de novo."; }
      bt.removeAttribute("aria-busy"); bt.firstElementChild.textContent = "Enviar candidatura";
    });
  }

  if (!codigo) { fim("Link inválido", "Confira o endereço da vaga que você recebeu.", "!"); return; }
  fetch(`/api/publico/vaga/${codigo}`).then(async (r) => {
    const j = await r.json().catch(() => ({}));
    if (r.ok && j.vaga) return desenha(j.vaga);
    if (r.status === 410) return fim("Inscrições encerradas", `A vaga <b>${esc(j.titulo || "")}</b>${j.empresa ? ` de ${esc(j.empresa)}` : ""} não está recebendo candidaturas no momento.`, "⏸");
    fim("Vaga não encontrada", "O link pode ter sido digitado errado ou a vaga foi removida.", "?");
  }).catch(() => fim("Sem conexão", "Não consegui carregar a vaga. Confira a internet e recarregue a página.", "!"));
})();
