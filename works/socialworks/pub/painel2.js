// SocialWorks · complementos do painel (carregado depois do painel.js):
//  - Automações: "Respostas automáticas no Direct" (boas-vindas no primeiro contato e resposta ao story)
//  - Relatórios: "Resultados no Instagram" (alcance e interações de cada post publicado, lidos da Meta)
(() => {
  "use strict";
  const $ = (s, r = document) => r.querySelector(s);
  const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const num = (n) => (n == null ? "—" : Number(n).toLocaleString("pt-BR"));
  const api = async (m, p, b) => {
    const r = await fetch("/api/admin/" + p, { method: m, credentials: "same-origin", headers: { "Content-Type": "application/json" }, body: b ? JSON.stringify(b) : undefined });
    const j = await r.json().catch(() => ({}));
    if (!r.ok) throw new Error(j.erro || "Não consegui falar com o servidor.");
    return j;
  };
  const aviso = (msg, erro) => { const t = document.createElement("div"); t.setAttribute("role", "status"); t.textContent = msg; t.style.cssText = `position:fixed;left:50%;bottom:22px;transform:translateX(-50%);z-index:90;padding:11px 16px;border-radius:12px;font:600 14px Inter,sans-serif;color:#fff;background:${erro ? "#B42318" : "#17142A"};box-shadow:0 12px 30px rgba(0,0,0,.25)`; document.body.appendChild(t); setTimeout(() => t.remove(), 3500); };

  // ---------- Automações: respostas no Direct ----------
  const TIPOS = [
    ["boas_vindas", "Boas-vindas no primeiro contato", "Enviada quando alguém manda a primeira mensagem no Direct.", "Oi! Que bom ter você aqui 💕 Como posso ajudar? Veja o nosso cardápio: "],
    ["story", "Resposta a quem responde o story", "Enviada quando alguém responde um story seu.", "Obrigada por responder o story! Quer que eu mande o link?"],
  ];
  async function montaExtras() {
    const alvo = $("#auLista"); if (!alvo || $("#auExtras")) return;
    const box = document.createElement("div"); box.id = "auExtras"; box.className = "card"; box.style.marginTop = "16px";
    box.innerHTML = `<h2>Respostas automáticas no Direct</h2><p class="small mute" style="margin-top:4px">Além das palavras-chave, o SocialWorks pode responder sozinho em dois momentos. A Meta não avisa quando alguém começa a seguir; por isso a boas-vindas vai na primeira mensagem, quando a pessoa já mostrou interesse.</p><div id="auExtrasCorpo" style="margin-top:12px"><p class="small mute">Carregando…</p></div>`;
    alvo.after(box);
    let contas = [], itens = [];
    try { [contas, itens] = await Promise.all([api("GET", "contas"), api("GET", "automacoes-extra").then((j) => j.itens)]); }
    catch (e) { $("#auExtrasCorpo").innerHTML = `<p class="small mute">${esc(e.message)}</p>`; return; }
    contas = contas.filter((c) => c.ativo);
    if (!contas.length) { $("#auExtrasCorpo").innerHTML = '<p class="small mute">Cadastre um perfil em “Perfis e conexão” para ligar as respostas automáticas.</p>'; return; }
    $("#auExtrasCorpo").innerHTML = contas.map((c) => `<div style="border-top:1px solid var(--line,#eee);padding-top:12px;margin-top:12px"><b>${esc(c.nome)}</b>${c.conectado ? "" : ' <span class="small mute">· Instagram ainda não conectado: a resposta começa a valer depois da conexão</span>'}
      ${TIPOS.map(([tipo, tit, sub, ex]) => { const it = itens.find((x) => x.conta_id === c.id && x.tipo === tipo); const id = `ex-${c.id}-${tipo}`;
        return `<form class="exF" data-conta="${c.id}" data-tipo="${tipo}" style="margin-top:10px"><label style="display:flex;gap:8px;align-items:center;font-weight:700"><input type="checkbox" name="ativo" ${it && it.ativo ? "checked" : ""} style="width:18px;height:18px"> ${esc(tit)}</label>
        <p class="small mute" style="margin:2px 0 6px">${esc(sub)}${it ? ` · enviada ${num(it.usos)} vez(es)` : ""}</p>
        <label for="${id}" style="position:absolute;left:-9999px">Mensagem: ${esc(tit)}</label><textarea id="${id}" name="texto" maxlength="1000" rows="2" placeholder="${esc(ex)}" style="width:100%">${esc(it && it.texto !== "-" ? it.texto : "")}</textarea>
        <div class="row" style="justify-content:flex-end;margin-top:6px"><button class="btn sm" data-adm>Salvar</button></div></form>`; }).join("")}</div>`).join("");
    document.querySelectorAll(".exF").forEach((f) => f.addEventListener("submit", async (e) => {
      e.preventDefault(); const bt = f.querySelector("button"); bt.disabled = true;
      try { await api("PUT", "automacoes-extra", { conta_id: Number(f.dataset.conta), tipo: f.dataset.tipo, texto: f.texto.value, ativo: f.ativo.checked }); aviso(f.ativo.checked ? "Resposta automática ligada" : "Resposta automática desligada"); }
      catch (err) { aviso(err.message, true); }
      bt.disabled = false;
    }));
  }

  // ---------- Relatórios: resultados no Instagram ----------
  const TIPO = { feed: "Feed", carrossel: "Carrossel", reels: "Reels", story: "Story" };
  async function montaMetricas(atualizar = false) {
    const alvo = document.querySelector("#v-relatorios .grid"); if (!alvo) return;
    let box = $("#rIg");
    if (!box) { box = document.createElement("div"); box.id = "rIg"; box.className = "card"; box.style.marginTop = "16px"; alvo.after(box); }
    box.innerHTML = `<div class="row" style="justify-content:space-between;align-items:center"><h2>Resultados no Instagram</h2><button class="btn sm" id="rIgAt" type="button">Atualizar</button></div><p class="small mute" style="margin-top:4px">Alcance e interações de cada publicação, lidos direto da Meta. Atualiza sozinho a cada 6 horas.</p><div id="rIgCorpo" style="margin-top:12px"><p class="small mute">Carregando…</p></div>`;
    $("#rIgAt").onclick = () => montaMetricas(true);
    let d; try { d = await api("GET", "metricas" + (atualizar ? "?atualizar=1" : "")); } catch (e) { $("#rIgCorpo").innerHTML = `<p class="small mute">${esc(e.message)}</p>`; return; }
    if (!d.posts.length) { $("#rIgCorpo").innerHTML = `<p class="small mute">${d.conectado ? "Assim que um post for publicado pelo SocialWorks, os números aparecem aqui." : "Conecte o Instagram em “Perfis e conexão” para ver alcance, curtidas, comentários, salvamentos e compartilhamentos de cada post."}</p>`; return; }
    const t = d.totais || {};
    $("#rIgCorpo").innerHTML = `<div class="kpis" style="margin-bottom:12px">${[["Alcance", t.alcance], ["Curtidas", t.curtidas], ["Comentários", t.comentarios], ["Salvamentos", t.salvos], ["Compartilhamentos", t.compartilhamentos]].map(([k, v]) => `<div class="kpi"><small>${k}</small><b>${num(v)}</b></div>`).join("")}</div>
      <div style="overflow-x:auto"><table><thead><tr><th>Post</th><th>Formato</th><th>Alcance</th><th>Curtidas</th><th>Coment.</th><th>Salvos</th><th>Compart.</th></tr></thead><tbody>${d.posts.map((p) => { const m = p.metricas || {}; return `<tr><td>${p.link ? `<a href="${esc(p.link)}" target="_blank" rel="noopener">${esc(p.titulo)}</a>` : esc(p.titulo)}<div class="small mute">${esc(p.conta)} · ${esc((p.publicado_em || "").slice(0, 10).split("-").reverse().join("/"))}</div></td><td>${esc(TIPO[p.tipo] || p.tipo)}</td><td><b>${num(m.alcance)}</b></td><td>${num(m.curtidas)}</td><td>${num(m.comentarios)}</td><td>${num(m.salvos)}</td><td>${num(m.compartilhamentos)}</td></tr>`; }).join("")}</tbody></table></div>
      ${d.avisos ? `<p class="small mute" style="margin-top:8px">${d.avisos} post(s) não puderam ser lidos agora. Tente atualizar mais tarde.</p>` : ""}`;
  }

  // monta quando a aba abre (o painel troca de aba com botões role=tab)
  const visivel = (el) => el && getComputedStyle(el).display !== "none" && el.offsetParent !== null;
  const quando = () => {
    if (visivel($("#v-automacoes"))) montaExtras();
    if (visivel($("#v-relatorios")) && !$("#rIg")) montaMetricas();
  };
  document.addEventListener("click", (e) => { if (e.target.closest("[role=tab]")) setTimeout(quando, 80); });
  addEventListener("hashchange", () => setTimeout(quando, 80));
  addEventListener("load", () => setTimeout(quando, 400));
})();
