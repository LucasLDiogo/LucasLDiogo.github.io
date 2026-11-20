// SocialWorks · painel3 (carregado depois do painel.js e do painel2.js):
//  - Perfis e conexão: botão oficial "Entrar com Instagram" (sem senha), situação da conexão, atualizar e desconectar
//  - Post: enviar fotos e vídeos (converte para JPG e recorta no formato certo), marcar pessoas, colaboradores, local,
//    texto alternativo, capa do Reels, 1º comentário, automação "quem comentar X recebe o link" e "Publicar agora"
//  - Automações: só num post, qualquer comentário, botões com link rastreado, exigir seguir; cliques nos links
//  - ServiceWorks: vitrine nos botões, promoção vira post, automação "agendar"
(() => {
  "use strict";
  const $ = (s, r = document) => r.querySelector(s), $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const num = (n) => (n == null ? "—" : Number(n).toLocaleString("pt-BR"));
  const conf = (x) => { try { return (typeof x === "string" ? JSON.parse(x) : x) || {}; } catch { return {}; } };
  const linhas = (s) => String(s || "").split(/\s*\n\s*/).map((x) => x.trim()).filter(Boolean);
  const ehVideo = (u) => /\.(mp4|mov)(\?|#|$)/i.test(u);
  const fetch0 = window.fetch.bind(window);
  const api = async (m, p, b) => {
    const r = await fetch0("/api/admin/" + p, { method: m, credentials: "same-origin", headers: { "Content-Type": "application/json" }, body: b ? JSON.stringify(b) : undefined });
    const j = await r.json().catch(() => ({}));
    if (!r.ok && r.status !== 202) throw new Error(j.erro || "Não consegui falar com o servidor.");
    return j;
  };
  let tt;
  const aviso = (msg, erro) => { const t = $("#toast"); if (!t) return alert(msg); t.textContent = msg; t.className = "toast on" + (erro ? " err" : ""); clearTimeout(tt); tt = setTimeout(() => (t.className = "toast"), erro ? 6000 : 3800); };
  const st = { status: null, ig: null, sw: undefined, post: null, getEm: 0, autos: [], op: {}, publicarDepois: false, papel: "admin" };
  const admin = () => st.papel !== "equipe";
  const recarregar = () => { const b = $(".nav button[aria-selected=true]"); if (b) b.click(); };
  const ICON_IG = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4.2"/><circle cx="17.4" cy="6.6" r="1.1" fill="currentColor" stroke="none"/></svg>';

  async function carregarStatus() {
    try { st.status = await api("GET", "status"); st.papel = st.status.papel || "admin"; } catch {}
    try { st.ig = await api("GET", "instagram/status"); } catch { st.ig = null; }
    return st.ig;
  }
  async function swDados() {
    if (st.sw !== undefined) return st.sw;
    try { const d = await api("GET", "integracoes/serviceworks"); st.sw = d.disponivel ? d : null; } catch { st.sw = null; }
    return st.sw;
  }

  // ---------------- 1) PERFIS E CONEXÃO ----------------
  const dataBR = (iso) => (iso ? new Date(iso).toLocaleDateString("pt-BR") : "");
  async function montaConexao() {
    const alvo = $("#perfis"); if (!alvo) return;
    let box = $("#igCon");
    if (!box) { box = document.createElement("div"); box.id = "igCon"; box.className = "card igcon"; alvo.before(box); }
    const d = await carregarStatus();
    if (!d) { box.innerHTML = '<p class="small mute">Não consegui ler a situação da conexão agora.</p>'; return; }
    const pronto = d.oauth; document.body.classList.toggle("igoauth", !!pronto);
    box.innerHTML = `<div class="row sb"><div><h2>Conexão oficial com o Instagram</h2><p class="small mute" style="margin-top:4px">Você entra pelo próprio Instagram e autoriza o SocialWorks. A senha nunca passa por aqui e você pode remover o acesso quando quiser, em Configurações › Apps e sites do Instagram.</p></div></div>
      <div class="req"><span>Conta profissional (Empresa ou Criador)</span><span>Não precisa de página do Facebook</span><span>Publicar, comentários, Direct e métricas</span></div>
      ${pronto ? "" : '<div class="aviso">A LLD Works está finalizando a liberação do app na Meta. Enquanto isso, planeje, aprove e agende: os posts ficam guardados e saem assim que a conexão for feita.</div>'}
      <div class="lista">${d.contas.map((c) => `<div class="igp" data-conta="${c.id}">
        ${c.foto ? `<img class="ft" src="${esc(c.foto)}" alt="" referrerpolicy="no-referrer">` : `<span class="ft" style="background:${esc(c.cor || "#DC2626")}">${esc((c.nome || "S")[0].toUpperCase())}</span>`}
        <div class="cx"><b>${esc(c.nome)}</b>
          ${c.conectado ? `<span class="small">@${esc(c.usuario || "")}${c.seguidores != null ? ` · ${num(c.seguidores)} seguidores` : ""}</span>
            <span class="row" style="gap:6px"><span class="chip ok">Conectado</span>${c.avisos ? '<span class="chip ok">Comentários e Direct ativos</span>' : '<span class="chip warn">Avisos desligados</span>'}${c.expira_em ? `<span class="chip">Renova sozinho · válido até ${dataBR(c.expira_em)}</span>` : ""}</span>`
            : `<span class="row" style="gap:6px"><span class="chip">Não conectado</span></span>`}
          ${c.problema ? `<span class="chip bad" style="white-space:normal">${esc(c.problema)}</span>` : ""}
          ${admin() ? `<div class="acoes">${c.conectado ? `<button class="btn sm" data-igat="${c.id}">Atualizar conexão</button><button class="btn sm ig" data-igcon="${c.id}">${ICON_IG} Reconectar</button><button class="btn sm bad" data-igdesc="${c.id}">Desconectar</button>` : `<button class="btn ig" data-igcon="${c.id}" ${pronto ? "" : "disabled"}>${ICON_IG} Entrar com Instagram</button>`}</div>` : ""}
        </div></div>`).join("")}</div>`;
    $$("img.ft", box).forEach((im) => im.addEventListener("error", () => { const s = document.createElement("span"); s.className = "ft"; s.style.background = "var(--p)"; s.textContent = "@"; im.replaceWith(s); }));
  }
  async function conectar(conta) {
    try { const r = await api("GET", `instagram/conectar?conta=${conta}`); location.href = r.url; }
    catch (e) { aviso(e.message, true); }
  }
  document.addEventListener("click", async (e) => {
    const b = e.target.closest("[data-igcon],[data-igat],[data-igdesc],[data-con]"); if (!b) return;
    if (b.dataset.con && !(st.ig && st.ig.oauth)) return; // sem o app liberado, o botão antigo (token manual, uso da LLD Works) continua
    e.preventDefault(); e.stopPropagation();
    if (b.dataset.igcon || b.dataset.con) return conectar(b.dataset.igcon || b.dataset.con);
    if (b.dataset.igat) { b.disabled = true; try { const r = await api("POST", `instagram/atualizar/${b.dataset.igat}`); aviso(r.avisos ? "Conexão atualizada." : "Perfil atualizado, mas os avisos de comentários/Direct não ativaram. Tente de novo em instantes.", !r.avisos); } catch (x) { aviso(x.message, true); } return montaConexao(); }
    if (b.dataset.igdesc) { if (!confirm("Desconectar o Instagram deste perfil? Os posts agendados param de sair e as automações param de responder até conectar de novo.")) return; try { await api("DELETE", `contas/${b.dataset.igdesc}/conexao`); aviso("Instagram desconectado."); } catch (x) { aviso(x.message, true); } return montaConexao(); }
  }, true);
  function retornoOAuth() {
    const q = new URLSearchParams(location.search), ig = q.get("ig"); if (!ig) return;
    if (ig === "ok") aviso(`Instagram conectado${q.get("u") ? ` (@${q.get("u")})` : ""}. Já pode publicar e automatizar.`);
    else if (ig === "cancelado") aviso("Conexão cancelada no Instagram.", true);
    else aviso(q.get("m") || "Não foi possível conectar o Instagram.", true);
    history.replaceState(null, "", location.pathname + (location.hash || "#config"));
  }

  // ---------------- 2) POST: ENVIO DE MÍDIA E OPÇÕES DO INSTAGRAM ----------------
  const PROP = { original: null, "1:1": 1, "4:5": 0.8, "1.91:1": 1.91, "9:16": 9 / 16 };
  const tipoAtual = () => ($("#pTipo") ? $("#pTipo").value : "feed");
  const vertical = () => ["reels", "story"].includes(tipoAtual());
  async function paraJpeg(arquivo, prop) {
    let bmp;
    try { bmp = await createImageBitmap(arquivo); }
    catch { throw new Error(`Não consegui abrir “${arquivo.name}”. Use JPG, PNG ou WebP (fotos HEIC do iPhone: exporte como JPG).`); }
    let alvo = PROP[prop];
    const r0 = bmp.width / bmp.height;
    if (alvo == null) alvo = vertical() ? 9 / 16 : Math.min(1.91, Math.max(0.8, r0)); // o feed aceita de 4:5 a 1,91:1
    let sw = bmp.width, sh = bmp.height, sx = 0, sy = 0;
    if (r0 > alvo) { sw = Math.round(bmp.height * alvo); sx = Math.round((bmp.width - sw) / 2); } else if (r0 < alvo) { sh = Math.round(bmp.width / alvo); sy = Math.round((bmp.height - sh) / 2); }
    const larg = Math.min(1440, sw), alt = Math.round(larg / (sw / sh));
    const c = document.createElement("canvas"); c.width = larg; c.height = alt;
    const g = c.getContext("2d"); g.fillStyle = "#fff"; g.fillRect(0, 0, larg, alt); g.drawImage(bmp, sx, sy, sw, sh, 0, 0, larg, alt);
    let q = 0.9, blob;
    do { blob = await new Promise((ok) => c.toBlob(ok, "image/jpeg", q)); q -= 0.1; } while (blob && blob.size > 7.5 * 1024 * 1024 && q > 0.4);
    return { blob, w: larg, h: alt };
  }
  const lerVideo = (arquivo) => new Promise((ok) => { const v = document.createElement("video"); v.preload = "metadata"; v.onloadedmetadata = () => { ok({ d: v.duration, w: v.videoWidth, h: v.videoHeight }); URL.revokeObjectURL(v.src); }; v.onerror = () => ok(null); v.src = URL.createObjectURL(arquivo); });
  async function subir(blob, mime, nome, w, h) {
    const q = new URLSearchParams({ nome: nome.slice(0, 100) }); if (w) q.set("w", w); if (h) q.set("h", h);
    const r = await fetch0("/api/admin/midia?" + q, { method: "POST", credentials: "same-origin", headers: { "Content-Type": mime }, body: blob });
    const j = await r.json().catch(() => ({}));
    if (!r.ok) throw new Error(j.erro || (r.status === 413 ? "Arquivo grande demais." : "Não consegui enviar o arquivo."));
    return j.url;
  }
  async function enviarArquivos(arquivos) {
    const prog = $("#upProg"), prop = $("#upProp") ? $("#upProp").value : "original";
    for (const [i, f] of [...arquivos].entries()) {
      prog.textContent = `Enviando ${i + 1} de ${arquivos.length}: ${f.name}…`;
      try {
        let url;
        if (f.type.startsWith("video/")) {
          if (f.size > 25 * 1024 * 1024) throw new Error(`“${f.name}” tem ${(f.size / 1048576).toFixed(0)} MB. O limite é 25 MB: exporte em 1080p ou use um link.`);
          const info = await lerVideo(f);
          if (info && tipoAtual() === "reels" && (info.d < 3 || info.d > 900)) throw new Error("Reels precisa ter de 3 segundos a 15 minutos.");
          if (info && tipoAtual() === "story" && info.d > 60) throw new Error("Story em vídeo pode ter até 60 segundos.");
          if (info && vertical() && info.w > info.h) aviso("Dica: Reels e Story ficam melhores na vertical (9:16).");
          url = await subir(f, f.type === "video/quicktime" ? "video/quicktime" : "video/mp4", f.name, info?.w, info?.h);
        } else if (f.type.startsWith("image/")) {
          const j = await paraJpeg(f, prop);
          url = await subir(j.blob, "image/jpeg", f.name.replace(/\.\w+$/, "") + ".jpg", j.w, j.h);
        } else throw new Error(`“${f.name}”: envie foto ou vídeo.`);
        const m = linhas($("#pMidia").value); m.push(url); setMidias(m);
      } catch (e) { aviso(e.message, true); }
    }
    prog.textContent = "";
  }
  function setMidias(lista) {
    const tipo = tipoAtual(), max = tipo === "carrossel" ? 10 : 1;
    if (lista.length > max) { if (tipo !== "carrossel" && lista.length > 1 && confirm("Mais de um arquivo: transformar o post em carrossel?")) { $("#pTipo").value = "carrossel"; $("#pTipo").dispatchEvent(new Event("input")); $("#pTipo").dispatchEvent(new Event("change")); } else lista = lista.slice(-max); }
    $("#pMidia").value = lista.slice(0, 10).join("\n");
    $("#pMidia").dispatchEvent(new Event("input"));
    desenharThumbs();
  }
  function moverMidia(i, d) {
    const m = linhas($("#pMidia").value), j = i + d; if (j < 0 || j >= m.length) return;
    [m[i], m[j]] = [m[j], m[i]];
    const troca = (k) => (k === i ? j : k === j ? i : k);
    st.op.marcacoes = (st.op.marcacoes || []).map((x) => ({ ...x, i: troca(x.i) }));
    if (st.op.alt) { const a = st.op.alt; [a[i], a[j]] = [a[j] || "", a[i] || ""]; }
    setMidias(m); desenharOpcoes();
  }
  function tirarMidia(i) {
    const m = linhas($("#pMidia").value); m.splice(i, 1);
    st.op.marcacoes = (st.op.marcacoes || []).filter((x) => x.i !== i).map((x) => ({ ...x, i: x.i > i ? x.i - 1 : x.i }));
    if (st.op.alt) st.op.alt.splice(i, 1);
    setMidias(m); desenharOpcoes();
  }
  function desenharThumbs() {
    const box = $("#upThumbs"); if (!box) return;
    const m = linhas($("#pMidia").value), ro = $("#pMidia").disabled;
    box.innerHTML = m.map((u, i) => `<div class="th">${ehVideo(u) ? `<video src="${esc(u)}" muted preload="metadata"></video><span class="vd">▶</span>` : `<img src="${esc(u)}" alt="Mídia ${i + 1}" loading="lazy">`}<span class="n">${i + 1}</span>${ro ? "" : `<span class="bt"><button type="button" data-mv="${i}" data-d="-1" aria-label="Mover para a esquerda">‹</button><button type="button" data-mv="${i}" data-d="1" aria-label="Mover para a direita">›</button><button type="button" data-rm="${i}" aria-label="Tirar a mídia ${i + 1}">✕</button></span>`}</div>`).join("");
    $("#upZona").hidden = ro;
  }

  // opções do Instagram (st.op guarda o que não cabe em campo simples: marcações e texto alternativo por mídia)
  function desenharOpcoes() {
    const box = $("#igOpCorpo"); if (!box) return;
    const tipo = tipoAtual(), m = linhas($("#pMidia").value), o = st.op, fotos = m.map((u, i) => ({ u, i })).filter((x) => !ehVideo(x.u));
    const sel = Math.min(Number(box.dataset.sel || 0), Math.max(0, m.length - 1)); box.dataset.sel = sel;
    const foto = m[sel] && !ehVideo(m[sel]) ? m[sel] : null, marc = (o.marcacoes || []).filter((x) => x.i === sel);
    box.innerHTML = `
      <label>Marcar pessoas ${tipo === "carrossel" ? "(escolha a foto)" : ""}</label>
      ${m.length > 1 ? `<div class="atalhos">${m.map((u, i) => `<button type="button" class="btn sm ${i === sel ? "pri" : ""}" data-selm="${i}">Mídia ${i + 1}</button>`).join("")}</div>` : ""}
      ${!m.length ? '<p class="help">Envie a foto primeiro.</p>' : foto ? `<div class="marcar" id="igMarcar"><img src="${esc(foto)}" alt="Toque para marcar alguém">${marc.map((x) => `<span class="pt" data-tirar="${o.marcacoes.indexOf(x)}" style="left:${x.x * 100}%;top:${x.y * 100}%" title="Tirar a marcação">@${esc(x.u)} ✕</span>`).join("")}</div><p class="help">Toque na foto onde a pessoa aparece e digite o @. Até 20 marcações.</p>`
        : `<div class="row" style="margin-top:4px"><input id="igMarcV" placeholder="@usuario (vídeo: sem posição)" maxlength="31" style="max-width:260px"><button type="button" class="btn sm" data-marcv="${sel}">Marcar</button></div>${marc.map((x) => `<span class="chip" style="margin:6px 6px 0 0">@${esc(x.u)} <a href="#" data-tirar="${o.marcacoes.indexOf(x)}" aria-label="Tirar">✕</a></span>`).join("")}`}
      ${tipo !== "story" ? `<label for="igCol">Colaboradores (até 3, o post aparece também no perfil deles)</label><input id="igCol" maxlength="100" placeholder="@parceira, @fornecedor" value="${esc((o.colaboradores || []).map((u) => "@" + u).join(", "))}">
      <div class="f2"><div><label for="igLocN">Local (nome para você)</label><input id="igLocN" maxlength="80" placeholder="Ex.: Passo Fundo" value="${esc(o.local_nome || "")}"></div><div><label for="igLoc">ID do local</label><input id="igLoc" inputmode="numeric" maxlength="25" placeholder="Opcional" value="${esc(o.local_id || "")}"></div></div>
      <p class="help">O ID do local é o número da página do local no Facebook. Se não souber, deixe em branco ou peça à LLD Works.</p>` : ""}
      ${["feed", "carrossel"].includes(tipo) && fotos.length ? `<label>Texto alternativo (acessibilidade: descreva a foto para quem usa leitor de tela)</label>${fotos.map((x) => `<input data-alt="${x.i}" maxlength="1000" placeholder="Foto ${x.i + 1}: ex.: bolo de cenoura com calda de chocolate na mesa" value="${esc((o.alt || [])[x.i] || "")}" style="margin-top:6px">`).join("")}` : ""}
      ${tipo === "reels" ? `<div class="f2"><div><label for="igCapaMs">Capa: segundo do vídeo</label><input id="igCapaMs" type="number" min="0" step="0.5" placeholder="0" value="${o.capa_ms != null ? o.capa_ms / 1000 : ""}"></div><div><label for="igAudio">Nome do áudio (opcional)</label><input id="igAudio" maxlength="60" placeholder="Som original" value="${esc(o.audio || "")}"></div></div>
        <label for="igCapaUrl">Ou uma imagem de capa</label><div class="row"><input id="igCapaUrl" placeholder="https://… (ou envie)" value="${esc(o.capa_url || "")}" style="flex:1"><label class="btn sm" style="margin:0">Enviar capa<input type="file" accept="image/*" id="igCapaArq" hidden></label></div>
        <label class="chk" style="margin-top:10px"><input type="checkbox" id="igNoFeed" ${o.no_feed === false ? "" : "checked"}> Mostrar também no feed (desmarcado: só na aba Reels)</label>` : ""}
      ${tipo !== "story" ? `<label for="igPc">Primeiro comentário (publicado logo depois do post)</label><textarea id="igPc" maxlength="2200" style="min-height:60px" placeholder="Ex.: hashtags extras ou o link do cardápio">${esc(o.primeiro_comentario || "")}</textarea>` : ""}`;
    const am = $("#autoOp"); if (am) am.hidden = tipo === "story";
  }
  function preencherAuto(a) {
    a = a || {};
    $("#apPal").value = a.palavra || ""; $("#apPub").value = a.publica || ""; $("#apDm").value = a.dm || "";
    $("#apBt").value = a.botao || ""; $("#apLink").value = a.link || ""; $("#apSeg").checked = !!a.seguir;
    $("#autoOp").open = !!a.palavra;
  }
  function coletarOpcoes() {
    const o = { ...st.op }, v = (s) => ($(s) ? $(s).value.trim() : "");
    if ($("#igCol")) o.colaboradores = v("#igCol").split(/[\s,]+/).map((x) => x.replace(/^@/, "").toLowerCase()).filter(Boolean);
    if ($("#igLoc")) { o.local_id = v("#igLoc"); o.local_nome = v("#igLocN"); }
    $$("[data-alt]").forEach((el) => { o.alt = o.alt || []; o.alt[Number(el.dataset.alt)] = el.value.trim(); });
    if (o.alt) o.alt = Array.from({ length: linhas($("#pMidia").value).length }, (_, i) => o.alt[i] || "");
    if ($("#igCapaMs")) { const s = v("#igCapaMs"); o.capa_ms = s === "" ? null : Math.round(Number(s.replace(",", ".")) * 1000); o.capa_url = v("#igCapaUrl") || null; o.audio = v("#igAudio"); o.no_feed = $("#igNoFeed").checked; }
    else { delete o.capa_ms; delete o.capa_url; delete o.audio; delete o.no_feed; }
    if ($("#igPc")) o.primeiro_comentario = v("#igPc");
    const pal = v("#apPal");
    o.auto = pal && tipoAtual() !== "story" ? { palavra: pal, publica: v("#apPub"), dm: v("#apDm"), botao: v("#apBt"), link: v("#apLink"), seguir: $("#apSeg").checked } : null;
    delete o.auto_id;
    return o;
  }
  function montaComposer() {
    const ta = $("#pMidia"); if (!ta || $("#upZona")) return;
    const lab = $('label[for="pMidia"]'), help = ta.nextElementSibling && ta.nextElementSibling.classList.contains("help") ? ta.nextElementSibling : null;
    const up = document.createElement("div");
    up.innerHTML = `<label>Foto ou vídeo</label>
      <div class="up" id="upZona" tabindex="0" role="button" aria-label="Enviar fotos ou vídeo"><b>Arraste aqui</b> ou toque para escolher fotos e vídeos<div class="tiny mute">Fotos viram JPG no formato certo · vídeo MP4/MOV até 25 MB · carrossel até 10</div><input type="file" id="upArq" accept="image/*,video/mp4,video/quicktime" multiple hidden></div>
      <div class="row" style="margin-top:8px"><label for="upProp" style="margin:0">Formato da foto</label><select id="upProp" style="width:auto;min-height:36px;padding:4px 10px"><option value="original">Automático</option><option value="1:1">Quadrado 1:1</option><option value="4:5">Retrato 4:5</option><option value="1.91:1">Paisagem 1,91:1</option><option value="9:16">Vertical 9:16</option></select></div>
      <div class="thumbs" id="upThumbs"></div><div class="prog" id="upProg" role="status" aria-live="polite"></div>
      <details class="igop" id="linkBox"><summary>Usar links em vez de enviar arquivos</summary><div></div></details>`;
    lab.before(up);
    const dentro = $("#linkBox > div"); dentro.append(lab, ta); if (help) dentro.append(help);
    const zona = $("#upZona"), arq = $("#upArq");
    zona.addEventListener("click", () => arq.click());
    zona.addEventListener("keydown", (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); arq.click(); } });
    arq.addEventListener("change", () => { if (arq.files.length) enviarArquivos(arq.files).then(() => (arq.value = "")); });
    ["dragenter", "dragover"].forEach((t) => zona.addEventListener(t, (e) => { e.preventDefault(); zona.classList.add("sobre"); }));
    ["dragleave", "drop"].forEach((t) => zona.addEventListener(t, (e) => { e.preventDefault(); zona.classList.remove("sobre"); }));
    zona.addEventListener("drop", (e) => { if (e.dataTransfer.files.length) enviarArquivos(e.dataTransfer.files); });
    ta.addEventListener("input", () => { desenharThumbs(); });
    $("#upThumbs").addEventListener("click", (e) => { const mv = e.target.closest("[data-mv]"), rm = e.target.closest("[data-rm]"); if (mv) moverMidia(Number(mv.dataset.mv), Number(mv.dataset.d)); if (rm) tirarMidia(Number(rm.dataset.rm)); });
    // opções e automação do post
    const op = document.createElement("div");
    op.innerHTML = `<details class="igop" id="igOp"><summary>Opções do Instagram <span class="chip">marcar, colaboradores, local, capa…</span></summary><div id="igOpCorpo"></div></details>
      <details class="igop" id="autoOp"><summary>Automação deste post <span class="chip p">comentou, recebeu no Direct</span></summary><div>
        <p class="help" style="margin-top:0">Quem comentar a palavra neste post recebe a mensagem no Direct (com botão de link). Ex.: “Comente QUERO que eu te mando o link”.</p>
        <div class="f2"><div><label for="apPal">Palavra (ou palavras, separadas por vírgula)</label><input id="apPal" maxlength="120" placeholder="quero"></div><div><label for="apPub">Resposta pública (opcional)</label><input id="apPub" maxlength="600" placeholder="Te mandei no Direct, {nome}! | Já chegou aí, {nome} 😉"></div></div>
        <label for="apDm">Mensagem no Direct</label><textarea id="apDm" maxlength="900" style="min-height:60px" placeholder="Oi {nome}! Aqui está o link 👇"></textarea>
        <div class="linhabt"><div><label for="apBt">Nome do botão</label><input id="apBt" maxlength="20" placeholder="Ver cardápio"></div><div><label for="apLink">Link do botão</label><input id="apLink" maxlength="600" placeholder="https://…"></div></div>
        <div class="atalhos" id="apAtalhos"></div>
        <label class="chk" style="margin-top:10px"><input type="checkbox" id="apSeg"> Só mandar o link para quem segue o perfil</label>
        <p class="help">{nome} vira o @ de quem comentou. Varie a resposta pública com “|” (o Instagram desconfia de respostas sempre iguais).</p>
      </div></details>`;
    $("#pCont").after(op);
    $("#igOp").addEventListener("toggle", () => $("#igOp").open && desenharOpcoes());
    $("#igOpCorpo").addEventListener("click", (e) => {
      const s = e.target.closest("[data-selm]"); if (s) { coletarParaSt(); $("#igOpCorpo").dataset.sel = s.dataset.selm; return desenharOpcoes(); }
      const tir = e.target.closest("[data-tirar]"); if (tir) { e.preventDefault(); e.stopPropagation(); coletarParaSt(); st.op.marcacoes.splice(Number(tir.dataset.tirar), 1); return desenharOpcoes(); }
      const mv = e.target.closest("[data-marcv]"); if (mv) { const u = $("#igMarcV").value.trim().replace(/^@/, "").toLowerCase(); if (!/^[a-z0-9._]{1,30}$/.test(u)) return aviso("Digite um @ válido.", true); coletarParaSt(); (st.op.marcacoes = st.op.marcacoes || []).push({ i: Number(mv.dataset.marcv), u, x: 0.5, y: 0.5 }); return desenharOpcoes(); }
      const img = e.target.closest("#igMarcar img"); if (img) {
        const r = img.getBoundingClientRect(), x = (e.clientX - r.left) / r.width, y = (e.clientY - r.top) / r.height;
        const u = (prompt("Quem está aqui? Digite o @ do Instagram:") || "").trim().replace(/^@/, "").toLowerCase(); if (!u) return;
        if (!/^[a-z0-9._]{1,30}$/.test(u)) return aviso("@ inválido: use letras, números, ponto e sublinhado.", true);
        if ((st.op.marcacoes || []).length >= 20) return aviso("Até 20 marcações por post.", true);
        coletarParaSt(); (st.op.marcacoes = st.op.marcacoes || []).push({ i: Number($("#igOpCorpo").dataset.sel || 0), u, x: Math.round(x * 1000) / 1000, y: Math.round(y * 1000) / 1000 }); desenharOpcoes();
      }
    });
    $("#igOpCorpo").addEventListener("change", async (e) => {
      if (e.target.id !== "igCapaArq" || !e.target.files[0]) return;
      try { $("#upProg").textContent = "Enviando a capa…"; const j = await paraJpeg(e.target.files[0], "9:16"); $("#igCapaUrl").value = await subir(j.blob, "image/jpeg", "capa.jpg", j.w, j.h); aviso("Capa enviada."); } catch (x) { aviso(x.message, true); }
      $("#upProg").textContent = "";
    });
    $("#pTipo").addEventListener("change", () => { coletarParaSt(); desenharOpcoes(); desenharThumbs(); $("#upProp").value = vertical() ? "9:16" : "original"; });
    // botão Publicar agora
    const agendar = $('#fPost [data-salvar="agendado"]');
    if (agendar) { const b = document.createElement("button"); b.type = "button"; b.className = "btn ok"; b.id = "pAgora"; b.setAttribute("data-adm", ""); b.textContent = "Publicar agora"; agendar.after(b); b.addEventListener("click", () => { st.pubEm = Date.now(); publicarAgora(); }); }
  }
  function coletarParaSt() { const o = coletarOpcoes(); const a = o.auto; st.op = { ...o }; st.op.auto = a; }
  async function abrirDialogPost() {
    const recente = Date.now() - st.getEm < 4000 && st.post ? st.post : null;
    st.post = recente; st.op = conf(recente && recente.opcoes); const a = st.op.auto; delete st.op.auto_id;
    $("#igOpCorpo").dataset.sel = 0; $("#igOp").open = false;
    $("#upProp").value = vertical() ? "9:16" : "original";
    preencherAuto(a); desenharThumbs(); desenharOpcoes();
    const sw = await swDados();
    $("#apAtalhos").innerHTML = sw ? `<span class="small mute">Atalhos:</span><button type="button" class="btn sm" data-lk="{vitrine}">Vitrine / agendar (ServiceWorks)</button>${sw.whatsapp ? '<button type="button" class="btn sm" data-lk="{whatsapp}">WhatsApp</button>' : ""}` : "";
    const pub = recente && recente.status === "publicado";
    $("#pAgora").hidden = pub || !admin();
    $$("#igOp input, #igOp textarea, #autoOp input, #autoOp textarea").forEach((x) => (x.disabled = pub));
  }
  document.addEventListener("click", (e) => { const l = e.target.closest("[data-lk]"); if (!l) return; $("#apLink").value = l.dataset.lk; if (!$("#apBt").value) $("#apBt").value = l.dataset.lk === "{whatsapp}" ? "Chamar no WhatsApp" : "Agendar agora"; });
  async function publicarAgora() {
    if (!confirm("Publicar este post no Instagram agora?")) return;
    st.publicarDepois = true;
    const salvar = $("#pSalvar"); salvar.click(); // salva (rascunho) e o fetch abaixo publica assim que o servidor confirmar
  }
  async function publicarId(id) {
    aviso("Publicando no Instagram…");
    try {
      const r = await api("POST", `posts/${id}/publicar`);
      if (r.status === "publicado") aviso("Publicado no Instagram! 🎉");
      else if (r.status === "processando") aviso(r.aviso || "O Instagram está processando o vídeo. Sai em alguns minutos.");
      else aviso(r.erro || "Não foi possível publicar agora.", true);
    } catch (x) { aviso(x.message, true); }
    recarregar();
  }

  // ---------------- 3) AUTOMAÇÕES: POST ESPECÍFICO, BOTÕES, EXIGIR SEGUIR ----------------
  function montaAuto() {
    const dm = $("#uDm"); if (!dm || $("#uExtra")) return;
    const ajuda = dm.nextElementSibling && dm.nextElementSibling.classList.contains("help") ? dm.nextElementSibling : dm;
    const box = document.createElement("div"); box.id = "uExtra";
    box.innerHTML = `<div id="uPostBox"><label for="uPost">Em qual post</label><select id="uPost"><option value="">Todos os posts</option></select><p class="help" id="uPostAj"></p></div>
      <label class="chk" id="uQualBox" style="margin-top:10px"><input type="checkbox" id="uQual"> Responder qualquer comentário (sem palavra-chave)</label>
      <label>Botões com link no Direct (até 3, com contagem de cliques)</label>
      ${[0, 1, 2].map((i) => `<div class="linhabt"><input id="uBt${i}" maxlength="20" placeholder="Nome do botão" aria-label="Nome do botão ${i + 1}"><input id="uBu${i}" maxlength="600" placeholder="https://…" aria-label="Link do botão ${i + 1}"></div>`).join("")}
      <div class="atalhos" id="uAtalhos"></div>
      <div id="uSegBox"><label class="chk" style="margin-top:12px"><input type="checkbox" id="uSeg"> Só mandar o link para quem segue o perfil</label>
      <div id="uSegMais" hidden><label for="uAbre">Mensagem com o botão “Quero o link”</label><input id="uAbre" maxlength="600" placeholder="Oi {nome}! Toque no botão abaixo que eu já te mando 😊">
      <label for="uMsgSeg">Para quem ainda não segue</label><input id="uMsgSeg" maxlength="600" placeholder="Quase lá! Siga {perfil} e toque em “Já sigo” 😉"></div></div>
      <p class="help">Variáveis: {nome} (quem escreveu), {perfil} (seu @), {vitrine} e {whatsapp} (do ServiceWorks). Resposta pública aceita variações separadas por “|”.</p>`;
    ajuda.after(box);
    $("#uSeg").addEventListener("change", () => ($("#uSegMais").hidden = !$("#uSeg").checked));
    $("#uQual").addEventListener("change", () => { const p = $("#uPal"); if ($("#uQual").checked) { p.dataset.antes = p.value === "*" ? "" : p.value; p.value = "*"; p.readOnly = true; } else { p.readOnly = false; p.value = p.dataset.antes || ""; } });
    const gat = $("#uGat"), sync = () => { const c = gat.value === "comentario"; $("#uPostBox").hidden = !c; $("#uQualBox").hidden = !c; $("#uSegBox").hidden = !c; };
    gat.addEventListener("change", sync); gat.addEventListener("input", sync);
    $("#uConta").addEventListener("change", () => carregaPostsIg());
    box.addEventListener("click", (e) => { const l = e.target.closest("[data-ulk]"); if (!l) return; const i = [0, 1, 2].find((k) => !$("#uBu" + k).value) ?? 0; $("#uBu" + i).value = l.dataset.ulk; if (!$("#uBt" + i).value) $("#uBt" + i).value = l.dataset.ulk === "{whatsapp}" ? "Chamar no WhatsApp" : "Agendar agora"; });
  }
  async function carregaPostsIg(sel) {
    const s = $("#uPost"); if (!s) return;
    const conta = $("#uConta").value; s.innerHTML = '<option value="">Todos os posts</option>';
    if (sel) s.innerHTML += `<option value="${esc(sel)}">Post ${esc(sel)}</option>`;
    s.value = sel || "";
    try {
      const r = await api("GET", `instagram/midias/${conta}`);
      $("#uPostAj").textContent = r.conectado ? "Escolha um post para a automação valer só nele." : "Conecte o Instagram para escolher um post específico.";
      s.innerHTML = '<option value="">Todos os posts</option>' + r.itens.map((m) => `<option value="${esc(m.id)}">${esc((m.quando || "").slice(0, 10).split("-").reverse().join("/"))} · ${esc(m.legenda || m.tipo)}</option>`).join("") + (sel && !r.itens.some((m) => m.id === sel) ? `<option value="${esc(sel)}">Post ${esc(sel)}</option>` : "");
      s.value = sel || "";
    } catch { $("#uPostAj").textContent = ""; }
  }
  async function abrirDialogAuto() {
    const nome = $("#uNome").value, pal = $("#uPal").value;
    const a = nome ? st.autos.find((x) => x.nome === nome && x.palavras === pal) : null, c = conf(a && a.config);
    [0, 1, 2].forEach((i) => { $("#uBt" + i).value = c.botoes?.[i]?.titulo || ""; $("#uBu" + i).value = c.botoes?.[i]?.url || ""; });
    $("#uSeg").checked = !!c.exigir_seguir; $("#uSegMais").hidden = !c.exigir_seguir; $("#uAbre").value = c.abertura || ""; $("#uMsgSeg").value = c.msg_seguir || "";
    $("#uQual").checked = pal === "*"; $("#uPal").readOnly = pal === "*";
    $("#uGat").dispatchEvent(new Event("change"));
    if (c.post_interno) { $("#uPostBox").hidden = true; $("#uPostAj").textContent = ""; } else carregaPostsIg(c.post || "");
    const sw = await swDados();
    $("#uAtalhos").innerHTML = sw ? `<span class="small mute">Atalhos do ServiceWorks:</span><button type="button" class="btn sm" data-ulk="{vitrine}">Vitrine / agendar</button>${sw.whatsapp ? '<button type="button" class="btn sm" data-ulk="{whatsapp}">WhatsApp</button>' : ""}` : "";
  }
  function coletarConfig() {
    const v = (s) => ($(s) ? $(s).value.trim() : "");
    const botoes = [0, 1, 2].map((i) => ({ titulo: v("#uBt" + i), url: v("#uBu" + i) })).filter((b) => b.titulo || b.url);
    const c = { botoes };
    if ($("#uGat").value === "comentario") { c.post = $("#uPostBox").hidden ? "" : v("#uPost"); c.exigir_seguir = $("#uSeg").checked; if (c.exigir_seguir) { c.abertura = v("#uAbre"); c.msg_seguir = v("#uMsgSeg"); } }
    return c;
  }
  async function montaLinks() {
    const alvo = $("#auLista"); if (!alvo) return;
    let box = $("#auLinks"); if (!box) { box = document.createElement("div"); box.id = "auLinks"; box.className = "card"; box.style.marginTop = "16px"; (($("#auExtras") || alvo)).after(box); }
    let d; try { d = await api("GET", "links"); } catch { box.hidden = true; return; }
    box.hidden = !d.itens.length;
    box.innerHTML = `<h2>Cliques nos links do Direct</h2><p class="small mute" style="margin-top:4px">Quantas pessoas receberam e quantas tocaram em cada botão.</p><div class="scroll" style="margin-top:10px"><table><thead><tr><th>Botão</th><th>Automação</th><th class="n">Enviados</th><th class="n">Cliques</th><th class="n">Taxa</th></tr></thead><tbody>${d.itens.map((x) => `<tr><td><b>${esc(x.titulo || "Link")}</b><div class="tiny mute">${esc(x.url)}</div></td><td>${esc(x.automacao || "—")}</td><td class="n">${num(x.envios)}</td><td class="n"><b>${num(x.cliques)}</b></td><td class="n">${String(x.ctr).replace(".", ",")}%</td></tr>`).join("")}</tbody></table></div>`;
  }

  // ---------------- 4) SERVICEWORKS ----------------
  async function montaSW() {
    const alvo = $("#v-automacoes .head"); if (!alvo) return;
    const sw = await swDados();
    let box = $("#swBox");
    if (!sw) { if (box) box.remove(); return; }
    if (!box) { box = document.createElement("div"); box.id = "swBox"; box.className = "card sw"; box.style.marginBottom = "16px"; alvo.after(box); }
    const contas = (st.ig && st.ig.contas) || [];
    const selConta = contas.length > 1 ? `<select id="swConta" style="width:auto;min-height:36px;padding:4px 10px">${contas.map((c) => `<option value="${c.id}">${esc(c.nome)}</option>`).join("")}</select>` : "";
    box.innerHTML = `<div class="row sb"><div><h2>ServiceWorks · ${esc(sw.nome || "sua loja")}</h2><p class="small mute" style="margin-top:4px">Leve quem comenta ou chama no Direct direto para a agenda: <a href="${esc(sw.vitrine)}" target="_blank" rel="noopener">${esc(sw.vitrine.replace("https://", ""))}</a>${sw.no_ar ? "" : " · <b>a vitrine ainda não está publicada</b>"}</p></div><div class="row">${selConta}${admin() ? '<button class="btn sm pri" id="swAg">Criar automação “agendar”</button>' : ""}</div></div>
      ${sw.promocoes.length ? `<h3 style="margin-top:14px">Promoções ativas</h3>${sw.promocoes.map((p) => `<div class="promo"><div><b>${esc(p.titulo)}</b><div class="small mute">${esc(p.desconto)}${p.cupom ? ` · cupom ${esc(p.cupom)}` : ""}${p.fim ? ` · até ${esc(p.fim.split("-").reverse().join("/"))}` : ""}</div></div>${admin() ? `<button class="btn sm" data-swpromo="${p.id}">Virar post</button>` : ""}</div>`).join("")}` : '<p class="small mute" style="margin-top:10px">Cadastre promoções no ServiceWorks para transformá-las em post com um toque.</p>'}`;
    const conta = () => Number(($("#swConta") || {}).value || contas[0]?.id);
    const ag = $("#swAg"); if (ag) ag.onclick = async () => { ag.disabled = true; try { const r = await api("POST", "integracoes/serviceworks/automacao-agendar", { conta_id: conta() }); aviso(r.existente ? "A automação “agendar” já existe." : "Pronto: quem escrever “agendar” recebe o botão da sua agenda."); recarregar(); } catch (x) { aviso(x.message, true); } ag.disabled = false; };
    $$("[data-swpromo]", box).forEach((b) => (b.onclick = async () => { b.disabled = true; try { await api("POST", "integracoes/serviceworks/post-promocao", { conta_id: conta(), promocao_id: Number(b.dataset.swpromo) }); aviso("Post criado em Rascunhos, com a automação “Comente QUERO”. Envie a foto e agende."); } catch (x) { aviso(x.message, true); } b.disabled = false; }));
  }

  // ---------------- 5) LIGAÇÃO COM O PAINEL (sem mexer no painel.js) ----------------
  // O painel.js salva posts e automações com fetch: acrescentamos as opções novas no corpo e guardamos o que ele leu.
  window.fetch = async (entrada, init = {}) => {
    const url = new URL(typeof entrada === "string" ? entrada : entrada.url, location.href), p = url.pathname, m = String(init.method || "GET").toUpperCase();
    let publicar = false;
    try {
      if (init.body && typeof init.body === "string") {
        if (((m === "POST" && p === "/api/admin/posts") || (m === "PUT" && /^\/api\/admin\/posts\/\d+$/.test(p))) && $("#dPost") && $("#dPost").open) {
          const b = JSON.parse(init.body); b.opcoes = coletarOpcoes(); init = { ...init, body: JSON.stringify(b) };
          publicar = st.publicarDepois && Date.now() - st.pubEm < 6000; st.publicarDepois = false;
        }
        if (((m === "POST" && p === "/api/admin/automacoes") || (m === "PUT" && /^\/api\/admin\/automacoes\/\d+$/.test(p))) && $("#dAuto") && $("#dAuto").open) {
          const b = JSON.parse(init.body); b.config = coletarConfig(); init = { ...init, body: JSON.stringify(b) };
        }
      }
    } catch (e) { console.error("painel3", e); }
    const r = await fetch0(entrada, init);
    if (r.ok && m === "GET" && /^\/api\/admin\/posts\/\d+$/.test(p)) { try { st.post = await r.clone().json(); st.getEm = Date.now(); } catch {} }
    if (r.ok && m === "GET" && p === "/api/admin/automacoes") { r.clone().json().then((j) => { st.autos = Array.isArray(j) ? j : []; }).catch(() => {}); }
    if (r.ok && publicar) {
      r.clone().json().then((j) => { const id = j.id || Number(p.split("/").pop()); if (id) setTimeout(() => publicarId(id), 300); }).catch(() => {});
    }
    return r;
  };

  function observarDialogo(id, quandoAbre) {
    const d = $(id); if (!d) return;
    new MutationObserver(() => { if (d.open) setTimeout(quandoAbre, 30); }).observe(d, { attributes: true, attributeFilter: ["open"] });
  }
  const visivel = (el) => el && el.classList.contains("on");
  const aoTrocarAba = () => {
    if (visivel($("#v-config"))) montaConexao();
    if (visivel($("#v-automacoes"))) { carregarStatus().then(montaSW); setTimeout(montaLinks, 400); }
  };
  function iniciar() {
    montaComposer(); montaAuto();
    observarDialogo("#dPost", abrirDialogPost);
    observarDialogo("#dAuto", abrirDialogAuto);
    document.addEventListener("click", (e) => { if (e.target.closest("[role=tab]")) setTimeout(aoTrocarAba, 120); });
    addEventListener("hashchange", () => setTimeout(aoTrocarAba, 120));
    carregarStatus().then(() => { retornoOAuth(); aoTrocarAba(); });
  }
  if (document.readyState === "complete") iniciar(); else addEventListener("load", () => setTimeout(iniciar, 200));
})();
