/* LLD Works Hub — interface. Sem scripts inline (CSP): eventos por delegação com data-act. */
(() => {
  "use strict";
  const $ = (s, r = document) => r.querySelector(s), $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const brl = (c) => ((+c || 0) / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
  const dataBR = (s) => { if (!s) return "—"; const d = new Date(s.length === 10 ? s + "T12:00:00Z" : s); return isNaN(d) ? esc(s) : d.toLocaleDateString("pt-BR") + (s.length > 10 ? " " + d.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }) : ""); };
  const STATUS_ASS = { teste: "Teste / grátis", pendente: "Aguardando pagamento", ativa: "Ativa", inadimplente: "Inadimplente", cancelada: "Cancelada", cortesia: "Cortesia" };
  const STATUS_PAG = { pendente: "Pendente", pago: "Pago", recusado: "Recusado", estornado: "Estornado", cancelado: "Cancelado" };
  const ICON = {
    home: '<path d="M3 11l9-7 9 7v9a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z"/>',
    users: '<circle cx="9" cy="8" r="4"/><path d="M2 21a7 7 0 0 1 14 0M16 3.5a4 4 0 0 1 0 8M22 21a7 7 0 0 0-4-6.3"/>',
    card: '<rect x="2" y="5" width="20" height="14" rx="2"/><path d="M2 10h20M6 15h4"/>',
    tag: '<path d="M20.6 13.4l-7.2 7.2a2 2 0 0 1-2.8 0L3 13V3h10l7.6 7.6a2 2 0 0 1 0 2.8z"/><circle cx="7.5" cy="7.5" r="1.5"/>',
    grid: '<rect x="3" y="3" width="7" height="7" rx="2"/><rect x="14" y="3" width="7" height="7" rx="2"/><rect x="3" y="14" width="7" height="7" rx="2"/><rect x="14" y="14" width="7" height="7" rx="2"/>',
    pulse: '<path d="M3 12h4l3-8 4 16 3-8h4"/>',
    db: '<ellipse cx="12" cy="5" rx="8" ry="3"/><path d="M4 5v14c0 1.7 3.6 3 8 3s8-1.3 8-3V5M4 12c0 1.7 3.6 3 8 3s8-1.3 8-3"/>',
    list: '<path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01"/>',
    gear: '<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"/>',
    plus: '<path d="M12 5v14M5 12h14"/>', ext: '<path d="M14 3h7v7M10 14L21 3M21 14v5a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5"/>',
    refresh: '<path d="M21 12a9 9 0 1 1-2.6-6.4M21 3v6h-6"/>',
    inbox: '<path d="M22 12h-6l-2 3h-4l-2-3H2"/><path d="M5.5 5h13L22 12v6a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2v-6z"/>',
    gift: '<rect x="3" y="8" width="18" height="4" rx="1"/><path d="M12 8v13M19 12v7a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2v-7M7.5 8a2.5 2.5 0 0 1 0-5C11 3 12 8 12 8s1-5 4.5-5a2.5 2.5 0 0 1 0 5"/>',
    mail: '<rect x="2" y="4" width="20" height="16" rx="2"/><path d="M22 7l-10 6L2 7"/>',
    wa: '<path d="M3 21l1.7-5A9 9 0 1 1 8 19.3z"/>', key: '<circle cx="7.5" cy="15.5" r="4.5"/><path d="M10.7 12.3L21 2M17 6l3 3"/>',
  };
  const svg = (n) => `<span class="ic"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICON[n] || ""}</svg></span>`;
  $$("nav i[data-ic]").forEach((i) => (i.outerHTML = svg(i.dataset.ic)));

  let tt;
  const toast = (m, err) => { const t = $("#toast"); t.textContent = m; t.className = "toast on" + (err ? " err" : ""); clearTimeout(tt); tt = setTimeout(() => (t.className = "toast"), err ? 6000 : 3000); };
  async function api(caminho, opt = {}) {
    const r = await fetch("/api/" + caminho, { method: opt.method || "GET", headers: opt.body ? { "Content-Type": "application/json" } : {}, body: opt.body ? JSON.stringify(opt.body) : undefined, credentials: "same-origin" });
    if (r.status === 401) { location.reload(); throw new Error("Sessão expirada"); }
    const d = await r.json().catch(() => ({}));
    if (!r.ok) throw new Error(d.erro || "Falha " + r.status);
    return d;
  }
  let CACHE = { produtos: null, planos: null };
  const produtos = async (f) => (CACHE.produtos && !f ? CACHE.produtos : (CACHE.produtos = await api("produtos")));
  const planos = async (f) => (CACHE.planos && !f ? CACHE.planos : (CACHE.planos = await api("planos")));
  const prodTag = (slug, lista) => { const p = (lista || CACHE.produtos || []).find((x) => x.slug === slug) || { nome: slug, cor: "#999" }; return `<span class="prod"><i style="background:${esc(p.cor)}"></i>${esc(p.nome)}</span>`; };
  const pill = (st, mapa) => `<span class="pill ${esc(st)}">${esc((mapa || STATUS_ASS)[st] || st)}</span>`;

  // ---------- diálogo de formulário genérico ----------
  function formulario({ titulo, campos, ok = "Salvar", aoEnviar, descricao }) {
    const dlg = $("#dlg"), f = $("#dlgForm");
    f.innerHTML = `<header><h2>${esc(titulo)}</h2>${descricao ? `<p class="muted small" style="margin:6px 0 0">${descricao}</p>` : ""}</header><div class="body">${campos.map((c) => {
      const id = "f_" + c.nome, req = c.obrig ? " required" : "";
      const ctl = c.tipo === "select" ? `<select id="${id}" name="${c.nome}"${req}>${c.opcoes.map((o) => `<option value="${esc(o[0])}"${String(o[0]) === String(c.valor ?? "") ? " selected" : ""}>${esc(o[1])}</option>`).join("")}</select>`
        : c.tipo === "area" ? `<textarea id="${id}" name="${c.nome}"${req}>${esc(c.valor ?? "")}</textarea>`
        : `<input id="${id}" name="${c.nome}" type="${c.tipo || "text"}" value="${esc(c.valor ?? "")}"${c.passo ? ` step="${c.passo}"` : ""}${c.min != null ? ` min="${c.min}"` : ""}${c.ph ? ` placeholder="${esc(c.ph)}"` : ""}${c.auto ? ` autocomplete="${c.auto}"` : ""}${req}>`;
      return `<div class="field"><label for="${id}">${esc(c.rotulo)}</label>${ctl}${c.ajuda ? `<small>${c.ajuda}</small>` : ""}</div>`;
    }).join("")}<p class="err" id="dlgErr" role="alert"></p></div><footer><button type="button" class="btn" data-x>Cancelar</button><button type="submit" class="btn pri">${esc(ok)}</button></footer>`;
    f.querySelector("[data-x]").onclick = () => dlg.close();
    f.onsubmit = async (e) => {
      e.preventDefault();
      const dados = Object.fromEntries(new FormData(f).entries());
      const b = f.querySelector("button[type=submit]"); b.disabled = true;
      try { await aoEnviar(dados); dlg.close(); } catch (er) { $("#dlgErr").textContent = er.message; } finally { b.disabled = false; }
    };
    dlg.showModal(); const pri = f.querySelector("input,select,textarea"); if (pri) pri.focus();
  }
  function mostrarSenha(email, senha, produto) {
    const dlg = $("#dlg"), f = $("#dlgForm");
    f.innerHTML = `<header><h2>Acesso criado</h2><p class="muted small" style="margin:6px 0 0">Copie agora: por segurança a senha não fica guardada em texto e não aparece de novo.</p></header>
      <div class="body"><dl class="kv"><dt>Endereço</dt><dd><a href="https://${esc(produto)}.lldworks.com.br/entrar" target="_blank" rel="noopener">${esc(produto)}.lldworks.com.br</a></dd><dt>E-mail</dt><dd>${esc(email)}</dd></dl>
      <p class="small muted" style="margin:14px 0 6px">Senha</p><div class="secret">${esc(senha)}</div></div>
      <footer><button type="button" class="btn" data-copiar>Copiar acesso</button><button type="button" class="btn pri" data-x>Pronto</button></footer>`;
    f.querySelector("[data-x]").onclick = () => dlg.close();
    f.querySelector("[data-copiar]").onclick = () => navigator.clipboard.writeText(`Acesso ${produto}\nEndereço: https://${produto}.lldworks.com.br/entrar\nE-mail: ${email}\nSenha: ${senha}`).then(() => toast("Copiado"), () => toast("Selecione e copie manualmente", true));
    dlg.showModal();
  }
  const confirmar = (msg) => window.confirm(msg);

  // ---------- telas ----------
  const V = {};
  V.inicio = async () => {
    const [r, prods] = await Promise.all([api("resumo"), produtos(true)]);
    const a = r.assinaturas || {};
    const fora = r.status.filter((s) => !s.ok);
    return `<div class="top"><div><h1>Visão geral</h1><p>Todos os SaaS da LLD Works num só lugar.</p></div><div class="acts"><a class="btn pri" href="#/clientes/novo">${svg("plus")}Novo cliente</a></div></div>
    <div class="grid g4 mb fade">
      <div class="card kpi"><span>Receita mensal recorrente</span><b>${brl(r.mrr_centavos)}</b><small>assinaturas ativas</small></div>
      <div class="card kpi"><span>Clientes</span><b>${r.clientes}</b><small>${a.ativa || 0} ativas · ${a.teste || 0} em teste</small></div>
      <div class="card kpi"><span>A receber</span><b>${brl(r.pendentes.v)}</b><small>${r.pendentes.n} cobrança(s) pendente(s)</small></div>
      <div class="card kpi"><span>Inadimplentes</span><b style="color:${a.inadimplente ? "var(--bad)" : "inherit"}">${a.inadimplente || 0}</b><small>${a.pendente || 0} aguardando pagamento</small></div>
    </div>
    ${(r.cadastros_30d && (r.cadastros_30d.pagamento || r.cadastros_30d.email)) ? `<div class="note mb">${svg("inbox")}<div><b>Cadastros pelo site (30 dias):</b> ${r.cadastros_30d.ativo || 0} ativos · ${r.cadastros_30d.pagamento || 0} aguardando pagamento · ${r.cadastros_30d.email || 0} sem confirmar o e-mail. <a href="#/cadastros">Ver cadastros</a></div></div>` : ""}
    ${fora.length ? `<div class="note bad mb">${svg("pulse")}<div><b>${fora.length} endereço(s) fora do ar agora:</b> ${fora.map((f) => esc(f.alvo.replace("https://", ""))).join(", ")}. <a href="#/monitor">Ver detalhes</a></div></div>` : r.status.length ? `<div class="note mb">${svg("pulse")}<div>Todas as aplicações monitoradas estão no ar.</div></div>` : ""}
    <div class="card fade"><div class="pad" style="display:flex;justify-content:space-between;align-items:center"><h2>Aplicações</h2><a class="btn sm" href="#/aplicacoes">Gerenciar</a></div>
    <div class="tbl-wrap"><table><thead><tr><th>Produto</th><th>Clientes ativos</th><th>Status</th><th>Uptime 24 h</th><th>Acessos</th></tr></thead><tbody>
    ${prods.map((p) => { const s = r.status.filter((x) => x.produto === p.slug); const ok = s.length ? s.every((x) => x.ok) : null; const up = s.length && s[0].uptime24h != null ? s[0].uptime24h + "%" : "—";
      return `<tr><td>${prodTag(p.slug, prods)}</td><td class="num">${p.clientes}</td><td>${ok == null ? '<span class="pill">sem checagem</span>' : ok ? '<span class="pill ok"><span class="dot ok"></span>no ar</span>' : '<span class="pill bad"><span class="dot bad"></span>fora</span>'}</td><td>${up}</td>
      <td class="links">${p.url_admin ? `<a href="${esc(p.url_admin)}" target="_blank" rel="noopener">painel</a>` : ""}${p.url_vitrine ? `<a href="${esc(p.url_vitrine)}" target="_blank" rel="noopener">vitrine</a>` : ""}</td></tr>`; }).join("")}
    </tbody></table></div></div>`;
  };

  V.clientes = async (arg) => {
    if (arg === "novo") { setTimeout(() => novoCliente(), 0); location.hash = "#/clientes"; }
    const q = sessionStorage.getItem("hub_q") || "";
    const [lista, prods] = await Promise.all([api("clientes?q=" + encodeURIComponent(q)), produtos()]);
    return `<div class="top"><div><h1>Clientes</h1><p>Empresas que assinam algum SaaS. Clique para ver produtos, acessos, pagamentos e parâmetros.</p></div>
      <div class="acts"><input class="search" id="busca" type="search" placeholder="Buscar por nome, e-mail ou CNPJ" value="${esc(q)}" aria-label="Buscar cliente"><button class="btn pri" data-act="novoCliente">${svg("plus")}Novo cliente</button></div></div>
    <div class="card fade tbl-wrap"><table><thead><tr><th>Cliente</th><th>E-mail</th><th>Cidade</th><th>Produtos</th><th>Desde</th></tr></thead><tbody>
    ${lista.map((c) => `<tr data-go="#/cliente/${c.id}"><td><b>${esc(c.nome)}</b></td><td>${esc(c.email)}</td><td>${esc(c.cidade || "—")}</td>
      <td>${(c.assinaturas || "").split(",").filter(Boolean).map((x) => { const [p, s] = x.split(":"); return `<span style="margin-right:8px;white-space:nowrap">${prodTag(p, prods)} ${pill(s)}</span>`; }).join("") || '<span class="muted">nenhum</span>'}</td><td>${dataBR(c.criado_em)}</td></tr>`).join("") || '<tr><td colspan="5" class="empty">Nenhum cliente encontrado.</td></tr>'}
    </tbody></table></div>`;
  };
  function novoCliente(c) {
    formulario({
      titulo: c ? "Editar cliente" : "Novo cliente", ok: c ? "Salvar" : "Criar cliente",
      campos: [
        { nome: "nome", rotulo: "Nome da empresa", obrig: true, valor: c && c.nome },
        { nome: "email", rotulo: "E-mail do responsável", tipo: "email", obrig: true, valor: c && c.email, ajuda: "Recebe as cobranças do Mercado Pago." },
        { nome: "documento", rotulo: "CPF ou CNPJ (opcional)", valor: c && c.documento, ph: "só números" },
        { nome: "telefone", rotulo: "WhatsApp", valor: c && c.telefone, ph: "(54) 99999-9999" },
        { nome: "cidade", rotulo: "Cidade/UF", valor: c && c.cidade, ph: "Passo Fundo/RS" },
        { nome: "slug", rotulo: "Endereço curto", valor: c && c.slug, ajuda: "Usado na vitrine: serviceworks.lldworks.com.br/v/<b>endereço</b>. Em branco = gerado do nome." },
        { nome: "observacoes", rotulo: "Observações", tipo: "area", valor: c && c.observacoes },
      ],
      aoEnviar: async (d) => {
        if (c) { await api("clientes/" + c.id, { method: "PUT", body: d }); toast("Cliente salvo"); render(); }
        else { const r = await api("clientes", { method: "POST", body: d }); toast("Cliente criado. Agora adicione o produto."); location.hash = "#/cliente/" + r.id; }
      },
    });
  }

  let abaCliente = "produtos";
  V.cliente = async (id) => {
    const [d, prods, pls] = await Promise.all([api("clientes/" + id), produtos(), planos()]);
    const c = d.cliente;
    const abas = { produtos: "Produtos e planos", acessos: "Logins e senhas", pagamentos: "Pagamentos", parametros: "Parâmetros", dados: "Dados" };
    let corpo = "";
    if (abaCliente === "produtos") corpo = `<div class="acts mb"><button class="btn pri" data-act="novaAssinatura" data-id="${c.id}">${svg("plus")}Adicionar produto</button></div>
      <div class="card tbl-wrap"><table><thead><tr><th>Produto</th><th>Plano</th><th>Status</th><th>Vence em</th><th>Cobrança</th><th></th></tr></thead><tbody>
      ${d.assinaturas.map((a) => `<tr><td>${prodTag(a.produto, prods)}<div class="links small">${a.url_admin ? `<a href="${esc(a.url_admin)}" target="_blank" rel="noopener">painel</a>` : ""}${a.url_vitrine ? `<a href="${esc(a.url_vitrine)}" target="_blank" rel="noopener">vitrine</a>` : ""}</div></td>
        <td>${a.plano ? `${esc(a.plano)}<div class="small muted">${brl(a.preco_centavos)}/${a.ciclo === "anual" ? "ano" : "mês"}</div>` : '<span class="muted">sem plano</span>'}</td><td>${pill(a.status)}${a.origem === "gratis" ? ' <span class="pill">grátis</span>' : a.origem === "cadastro" ? ' <span class="pill">pelo site</span>' : ""}</td><td>${dataBR(a.vence_em)}</td>
        <td>${a.status === "cortesia" ? '<span class="muted small">cortesia · sem cobrança</span>' : `<button class="btn sm" data-act="linkPagamento" data-id="${a.id}">${svg("card")}Link de pagamento</button>`}${a.mp_link ? `<div class="small"><a href="${esc(a.mp_link)}" target="_blank" rel="noopener">recorrência antiga</a></div>` : ""}</td>
        <td><div class="acts"><button class="btn sm" data-act="editarAssinatura" data-id="${a.id}">Editar</button><button class="btn sm" data-act="prorrogar" data-id="${a.id}">Prorrogar</button><button class="btn sm" data-act="lancarPagamento" data-id="${a.id}" data-valor="${a.preco_centavos || 0}">Registrar pagamento</button></div></td></tr>`).join("") || '<tr><td colspan="6" class="empty">Nenhum produto ainda. Adicione o primeiro.</td></tr>'}
      </tbody></table></div>`;
    if (abaCliente === "acessos") corpo = `<div class="note mb">${svg("key")}<div>Cada login abre o painel do produto em <b>&lt;produto&gt;.lldworks.com.br</b>. A senha é guardada só como hash (PBKDF2). Se o cliente esquecer, ele usa "Esqueci minha senha" na tela de login, ou você manda o código por e-mail ou gera uma senha provisória.</div></div>
      <div class="acts mb"><button class="btn pri" data-act="novoUsuario" data-id="${c.id}">${svg("plus")}Criar login</button></div>
      <div class="card tbl-wrap"><table><thead><tr><th>Produto</th><th>E-mail</th><th>Nome</th><th>Papel</th><th>Situação</th><th>Último acesso</th><th></th></tr></thead><tbody>
      ${d.usuarios.map((u) => `<tr><td>${prodTag(u.produto, prods)}</td><td>${esc(u.email)}</td><td>${esc(u.nome || "—")}</td><td>${u.papel === "admin" ? "Administrador" : "Equipe"}</td><td>${u.ativo ? '<span class="pill ok">liberado</span>' : '<span class="pill bad">bloqueado</span>'}</td><td>${dataBR(u.ultimo_acesso)}</td>
        <td><div class="acts"><button class="btn sm" data-act="enviarAcesso" data-id="${u.id}" data-email="${esc(u.email)}">Enviar código por e-mail</button><button class="btn sm" data-act="novaSenha" data-id="${u.id}" data-email="${esc(u.email)}" data-produto="${esc(u.produto)}">Senha provisória</button><button class="btn sm" data-act="trocarEmailUsuario" data-id="${u.id}" data-email="${esc(u.email)}">Trocar e-mail</button><button class="btn sm" data-act="bloquear" data-id="${u.id}" data-ativo="${u.ativo ? 0 : 1}" data-nome="${esc(u.nome || "")}" data-papel="${u.papel}">${u.ativo ? "Bloquear" : "Liberar"}</button><button class="btn sm danger" data-act="excluirUsuario" data-id="${u.id}">Excluir</button></div></td></tr>`).join("") || '<tr><td colspan="7" class="empty">Nenhum login criado.</td></tr>'}
      </tbody></table></div>`;
    if (abaCliente === "pagamentos") corpo = tabelaPagamentos(d.pagamentos, prods, false) + tabelaCobrancas(await api("cobrancas?cliente=" + c.id), prods);
    if (abaCliente === "parametros") corpo = `<div class="note mb">${svg("gear")}<div>Parâmetros livres que cada produto lê para este cliente: horário de funcionamento, WhatsApp, cores, mensagens, limites extras etc.</div></div>
      <div class="acts mb"><button class="btn pri" data-act="novoParametro" data-id="${c.id}">${svg("plus")}Adicionar parâmetro</button></div>
      <div class="card tbl-wrap"><table><thead><tr><th>Produto</th><th>Parâmetro</th><th>Valor</th><th></th></tr></thead><tbody>
      ${d.parametros.map((p) => `<tr><td>${prodTag(p.produto, prods)}</td><td><code>${esc(p.chave)}</code></td><td>${esc(p.valor)}</td><td><div class="acts"><button class="btn sm" data-act="editarParametro" data-id="${c.id}" data-produto="${esc(p.produto)}" data-chave="${esc(p.chave)}" data-valor="${esc(p.valor)}">Editar</button><button class="btn sm danger" data-act="excluirParametro" data-id="${c.id}" data-produto="${esc(p.produto)}" data-chave="${esc(p.chave)}">Excluir</button></div></td></tr>`).join("") || '<tr><td colspan="4" class="empty">Nenhum parâmetro.</td></tr>'}
      </tbody></table></div>`;
    if (abaCliente === "dados") corpo = `<div class="card pad"><dl class="kv"><dt>Nome</dt><dd>${esc(c.nome)}</dd><dt>E-mail</dt><dd>${esc(c.email)}</dd><dt>CPF/CNPJ</dt><dd>${esc(c.documento || "—")}</dd><dt>WhatsApp</dt><dd>${esc(c.telefone || "—")}</dd><dt>Cidade</dt><dd>${esc(c.cidade || "—")}</dd><dt>Endereço curto</dt><dd>${esc(c.slug || "—")}</dd><dt>Observações</dt><dd>${esc(c.observacoes || "—")}</dd><dt>Cliente desde</dt><dd>${dataBR(c.criado_em)}</dd></dl>
      <div class="acts mt"><button class="btn" data-act="editarCliente">Editar dados</button>${c.id !== 1 ? `<button class="btn danger" data-act="excluirCliente" data-id="${c.id}">Excluir cliente</button>` : ""}</div></div>`;
    window.__cliente = { c, assinaturas: d.assinaturas, prods, pls };
    return `<div class="top"><div><a href="#/clientes" class="small">← Clientes</a><h1 style="margin-top:6px">${esc(c.nome)}</h1><p>${esc(c.email)}${c.cidade ? " · " + esc(c.cidade) : ""}</p></div></div>
      <div class="tabs" role="tablist">${Object.entries(abas).map(([k, l]) => `<button role="tab" class="${k === abaCliente ? "on" : ""}" data-aba="${k}">${l}</button>`).join("")}</div><div class="fade">${corpo}</div>`;
  };

  const STATUS_COB = { aberta: "Aguardando o cliente", paga: "Paga", expirada: "Expirou sem pagar", cancelada: "Não abriu", estornada: "Estornada" };
  function tabelaCobrancas(lista, prods) {
    return `<h2 style="margin:26px 0 4px;font-size:16px">Pedidos de pagamento · Mercado Pago</h2><p class="small muted" style="margin:0 0 10px">Cada vez que o cliente escolhe um plano no link, entra um pedido aqui. Pago, ele aparece também na lista acima.</p>
    <div class="card tbl-wrap"><table><thead><tr><th>Quando</th><th>Produto</th><th>Plano</th><th>Período</th><th class="num">Valor</th><th>Situação</th><th>Pago em</th></tr></thead><tbody>
    ${lista.map((x) => `<tr><td>${dataBR(x.criado_em)}</td><td>${prodTag(x.produto, prods)}</td><td>${esc(x.plano)}</td><td>${x.meses === 1 ? "1 mês" : x.meses + " meses"}</td><td class="num"><b>${brl(x.valor_centavos)}</b></td>
      <td><span class="pill ${x.status === "paga" ? "pago" : x.status === "aberta" ? "pendente" : x.status === "estornada" ? "recusado" : "cancelado"}"${x.erro ? ` title="${esc(x.erro)}"` : ""}>${esc(STATUS_COB[x.status] || x.status)}</span></td><td>${dataBR(x.pago_em)}</td></tr>`).join("") || '<tr><td colspan="7" class="empty">Nenhum pedido ainda. Envie o link de pagamento ao cliente.</td></tr>'}
    </tbody></table></div>`;
  }
  function mostrarLink(id, r) {
    const dlg = $("#dlg"), f = $("#dlgForm");
    const msg = `Olá! Segue o link para escolher o plano e pagar o ${r.produto}:\n${r.url}\n\nPix com liberação na hora ou cartão em até 12x. O mesmo link serve para as próximas renovações.`;
    const fone = String(r.telefone || "").replace(/\D/g, "");
    const wa = fone.length >= 10 ? `https://wa.me/${fone.length <= 11 ? "55" + fone : fone}?text=${encodeURIComponent(msg)}` : "";
    f.innerHTML = `<header><h2>Link de pagamento · ${esc(r.produto)}</h2><p class="muted small" style="margin:6px 0 0">${esc(r.cliente)} escolhe o plano e paga por Pix ou cartão em até 12x. Aprovado o pagamento, o acesso é liberado e o vencimento avança sozinho.</p></header>
      <div class="body">${r.mercadopago ? "" : `<div class="note warn mb">${svg("key")}<div>O Mercado Pago ainda não está conectado: o cliente vê os planos, mas o botão de pagar fica desativado. Veja <a href="#/config">Configurações</a>.</div></div>`}
      <p class="small muted" style="margin:0 0 6px">Link fixo deste cliente (serve todo mês)</p><div class="secret" style="word-break:break-all">${esc(r.url)}</div>
      <div class="acts mt"><a class="btn sm" href="${esc(r.url)}" target="_blank" rel="noopener">${svg("ext")}Abrir</a>${wa ? `<a class="btn sm" href="${esc(wa)}" target="_blank" rel="noopener">Enviar no WhatsApp</a>` : ""}<button type="button" class="btn sm danger" data-novo>Gerar novo link</button></div>
      <p class="small muted" style="margin:10px 0 0">"Gerar novo link" desativa o atual: use se o link foi parar com quem não deveria.</p></div>
      <footer><button type="button" class="btn" data-copiar>Copiar mensagem</button><button type="button" class="btn pri" data-x>Pronto</button></footer>`;
    f.querySelector("[data-x]").onclick = () => dlg.close();
    f.querySelector("[data-copiar]").onclick = () => navigator.clipboard.writeText(msg).then(() => toast("Mensagem copiada"), () => toast("Selecione e copie manualmente", true));
    f.querySelector("[data-novo]").onclick = async () => {
      if (!confirmar("Gerar um novo link? O link atual deixa de funcionar.")) return;
      try { const n = await api(`assinaturas/${id}/link/novo`, { method: "POST" }); toast("Novo link gerado"); mostrarLink(id, { ...r, url: n.url }); } catch (e) { toast(e.message, true); }
    };
    f.onsubmit = (e) => e.preventDefault();
    if (!dlg.open) dlg.showModal();
  }
  function tabelaPagamentos(lista, prods, comCliente) {
    return `<div class="card tbl-wrap"><table><thead><tr><th>#</th>${comCliente ? "<th>Cliente</th>" : ""}<th>Produto</th><th class="num">Valor</th><th>Status</th><th>Método</th><th>Criado</th><th>Pago em</th><th></th></tr></thead><tbody>
    ${lista.map((p) => `<tr><td class="muted">${p.id}</td>${comCliente ? `<td><a href="#/cliente/${p.cliente_id}">${esc(p.cliente)}</a></td>` : ""}<td>${prodTag(p.produto, prods)}</td><td class="num"><b>${brl(p.valor_centavos)}</b></td><td>${pill(p.status, STATUS_PAG)}</td><td>${esc(p.mp_payment_id && p.referencia ? p.referencia : p.metodo || "—")}${p.mp_payment_id ? '<div class="small muted">Mercado Pago</div>' : ""}</td><td>${dataBR(p.criado_em)}</td><td>${dataBR(p.pago_em)}</td>
      <td>${p.status !== "pago" ? `<button class="btn sm" data-act="baixar" data-id="${p.id}">Marcar como pago</button>` : `<button class="btn sm ghost" data-act="mudarPagamento" data-id="${p.id}">Alterar</button>`}</td></tr>`).join("") || `<tr><td colspan="${comCliente ? 9 : 8}" class="empty">Nenhum pagamento.</td></tr>`}
    </tbody></table></div>`;
  }

  V.pagamentos = async () => {
    const f = sessionStorage.getItem("hub_pg") || "";
    const [lista, prods] = await Promise.all([api("pagamentos" + (f ? "?status=" + f : "")), produtos()]);
    const total = lista.filter((p) => p.status === "pago").reduce((s, p) => s + p.valor_centavos, 0);
    return `<div class="top"><div><h1>Pagamentos</h1><p>Mercado Pago confirma sozinho pelo webhook. Pix ou transferência fora do Mercado Pago: registre no cliente e marque como pago.</p></div>
      <div class="acts"><select id="filtroPg" aria-label="Filtrar por status"><option value="">Todos</option>${Object.entries(STATUS_PAG).map(([k, l]) => `<option value="${k}"${k === f ? " selected" : ""}>${l}</option>`).join("")}</select></div></div>
      <p class="muted small">Recebido nesta lista: <b>${brl(total)}</b></p>${tabelaPagamentos(lista, prods, true)}`;
  };

  V.planos = async () => {
    const [pls, prods] = await Promise.all([planos(true), produtos()]);
    return `<div class="top"><div><h1>Planos e preços</h1><p>O que cada produto vende. Mudança de preço vale para novas cobranças.</p></div><div class="acts"><button class="btn pri" data-act="novoPlano">${svg("plus")}Novo plano</button></div></div>
    ${prods.filter((p) => pls.some((x) => x.produto === p.slug)).map((p) => `<div class="card mb fade"><div class="pad" style="padding-bottom:6px"><h2>${prodTag(p.slug, prods)}</h2></div><div class="tbl-wrap"><table><thead><tr><th>Plano</th><th class="num">Preço</th><th>Ciclo</th><th>Teste grátis</th><th>Limites</th><th class="num">Ativos</th><th></th></tr></thead><tbody>
      ${pls.filter((x) => x.produto === p.slug).map((x) => `<tr${x.ativo ? "" : ' style="opacity:.55"'}><td><b>${esc(x.nome)}</b>${x.ativo ? "" : ' <span class="pill">inativo</span>'}</td><td class="num">${brl(x.preco_centavos)}</td><td>${x.ciclo}</td><td>${x.trial_dias} dias</td><td><code class="small">${esc(x.limites)}</code></td><td class="num">${x.ativos}</td><td><button class="btn sm" data-act="editarPlano" data-id="${x.id}">Editar</button></td></tr>`).join("")}
      </tbody></table></div></div>`).join("")}`;
  };
  function formPlano(x) {
    const prods = CACHE.produtos || [];
    formulario({
      titulo: x ? "Editar plano" : "Novo plano",
      campos: [
        ...(x ? [] : [{ nome: "produto", rotulo: "Produto", tipo: "select", opcoes: prods.map((p) => [p.slug, p.nome]), obrig: true }]),
        { nome: "nome", rotulo: "Nome do plano", obrig: true, valor: x && x.nome },
        { nome: "preco", rotulo: "Preço (R$)", tipo: "number", passo: "0.01", min: 0, obrig: true, valor: x ? (x.preco_centavos / 100).toFixed(2) : "" },
        { nome: "ciclo", rotulo: "Ciclo de cobrança", tipo: "select", opcoes: [["mensal", "Mensal"], ["anual", "Anual"]], valor: x && x.ciclo },
        { nome: "trial_dias", rotulo: "Dias de teste grátis", tipo: "number", min: 0, valor: x ? x.trial_dias : 14 },
        { nome: "limites", rotulo: "Limites (JSON)", valor: x ? x.limites : "{}", ajuda: 'Ex.: {"profissionais":3,"agendamentos_mes":500}' },
        ...(x ? [{ nome: "ativo", rotulo: "Situação", tipo: "select", opcoes: [["1", "À venda"], ["0", "Fora de venda"]], valor: String(x.ativo) }] : []),
      ],
      aoEnviar: async (d) => {
        const body = { ...d, preco_centavos: Math.round(parseFloat(String(d.preco).replace(",", ".")) * 100), trial_dias: +d.trial_dias, ativo: d.ativo !== "0" };
        if (x) await api("planos/" + x.id, { method: "PUT", body }); else await api("planos", { method: "POST", body });
        toast("Plano salvo"); CACHE.planos = null; render();
      },
    });
  }

  V.aplicacoes = async () => {
    const prods = await produtos(true);
    return `<div class="top"><div><h1>Aplicações</h1><p>Endereço do painel (admin do cliente), da vitrine (quem compra) e do teste de "no ar".</p></div></div>
    <div class="grid g2 fade">${prods.map((p) => `<div class="card pad"><div style="display:flex;justify-content:space-between;align-items:center;gap:10px"><h2>${prodTag(p.slug, prods)}</h2>${p.ativo ? '<span class="pill ok">ativo</span>' : '<span class="pill">desligado</span>'}</div>
      <dl class="kv mt"><dt>Painel (admin)</dt><dd>${p.url_admin ? `<a href="${esc(p.url_admin)}" target="_blank" rel="noopener">${esc(p.url_admin.replace("https://", ""))}</a>` : "—"}</dd><dt>Vitrine</dt><dd>${p.url_vitrine ? `<a href="${esc(p.url_vitrine)}" target="_blank" rel="noopener">${esc(p.url_vitrine.replace("https://", ""))}</a>` : "—"}</dd><dt>Teste de status</dt><dd class="small">${esc(p.url_status || "—")}</dd><dt>Clientes ativos</dt><dd>${p.clientes}</dd></dl>
      <div class="acts mt"><button class="btn sm" data-act="editarProduto" data-slug="${p.slug}">Editar endereços</button></div></div>`).join("")}</div>`;
  };

  V.monitor = async () => {
    const lista = await api("monitor");
    return `<div class="top"><div><h1>No ar / problemas</h1><p>Verificação automática a cada 5 minutos. Barras: últimas 48 checagens (verde no ar, vermelho falha).</p></div><div class="acts"><button class="btn" data-act="checarAgora">${svg("refresh")}Verificar agora</button></div></div>
    <div class="card tbl-wrap fade"><table><thead><tr><th>Produto</th><th>Endereço</th><th>Agora</th><th>Uptime 24 h</th><th class="num">Tempo médio</th><th>Histórico</th><th>Última</th></tr></thead><tbody>
    ${lista.map((l) => `<tr><td>${prodTag(l.produto)}</td><td class="small">${esc(l.alvo.replace("https://", ""))}</td><td>${l.ok_agora ? `<span class="pill ok"><span class="dot ok"></span>${l.codigo}</span>` : `<span class="pill bad"><span class="dot bad"></span>${l.codigo || "sem resposta"}</span>`}</td>
      <td>${((100 * l.oks) / l.total).toFixed(1)}%</td><td class="num">${l.ms} ms</td><td><div class="hist">${(l.historico || "").split("").reverse().map((o) => `<i class="${o === "1" ? "" : "f"}"></i>`).join("")}</div></td><td class="small">${dataBR(l.ultima)}</td></tr>`).join("") || '<tr><td colspan="7" class="empty">Ainda sem checagens. Clique em "Verificar agora".</td></tr>'}
    </tbody></table></div>
    <p class="small muted mt">AgentWorks real e gateway WhatsApp rodam no PC do Lucas: se o PC desligar, aparecem como fora.</p>`;
  };

  V.banco = async () => {
    const b = await api("banco");
    return `<div class="top"><div><h1>Banco de dados</h1><p>Cloudflare D1 <code>lldworks-hub</code> · resposta em ${b.latencia_ms} ms.</p></div></div>
    <div class="grid g4 mb fade">${Object.entries(b.tabelas).map(([t, n]) => `<div class="card kpi"><span>${esc(t)}</span><b>${n}</b><small>registros</small></div>`).join("")}</div>
    <div class="card fade"><div class="pad"><h2>Webhooks recebidos (Mercado Pago)</h2></div><div class="tbl-wrap"><table><thead><tr><th>Quando</th><th>Tipo</th><th>Processado</th><th>Erro</th></tr></thead><tbody>
    ${b.webhooks.map((w) => `<tr><td>${dataBR(w.recebido_em)}</td><td>${esc(w.tipo)}</td><td>${w.processado ? '<span class="pill ok">sim</span>' : '<span class="pill warn">não</span>'}</td><td class="small">${esc(w.erro || "—")}</td></tr>`).join("") || '<tr><td colspan="4" class="empty">Nenhum webhook ainda.</td></tr>'}
    </tbody></table></div></div>`;
  };

  V.eventos = async () => {
    const lista = await api("eventos?limite=300");
    return `<div class="top"><div><h1>Histórico</h1><p>Tudo o que foi criado, alterado, pago ou excluído, com data e responsável.</p></div></div>
    <div class="card tbl-wrap fade"><table><thead><tr><th>Quando</th><th>O quê</th><th>Ref.</th><th>Detalhe</th><th>Quem</th></tr></thead><tbody>
    ${lista.map((e) => `<tr><td class="small">${dataBR(e.em)}</td><td><code>${esc(e.tipo)}</code></td><td class="muted">${esc(e.ref || "")}</td><td>${esc(e.detalhe || "")}</td><td class="small">${esc(e.quem)}</td></tr>`).join("") || '<tr><td colspan="5" class="empty">Sem eventos.</td></tr>'}
    </tbody></table></div>`;
  };

  V.config = async () => {
    const [eu, cfg] = await Promise.all([api("eu"), api("config")]);
    return `<div class="top"><div><h1>Configurações</h1><p>Integrações e segurança.</p></div></div>
    <form class="card pad fade mb" id="fCfg"><h2>Cadastro e pagamento pelo site</h2>
      <p class="small muted">Aparece na página de cadastro de todos os produtos (<b>&lt;produto&gt;.lldworks.com.br/assinar</b>). Sem Mercado Pago configurado, o cliente paga pelo Pix abaixo e clica em "Já paguei"; você confirma em Cadastros.</p>
      <div class="grid g2"><div class="field"><label for="cPix">Chave Pix</label><input id="cPix" name="pix_chave" value="${esc(cfg.pix_chave || "")}" autocomplete="off"></div>
        <div class="field"><label for="cPixT">Nome que aparece no Pix</label><input id="cPixT" name="pix_titular" value="${esc(cfg.pix_titular || "")}"></div>
        <div class="field"><label for="cZap">WhatsApp de atendimento</label><input id="cZap" name="whatsapp" value="${esc(cfg.whatsapp || "")}" placeholder="(54) 99999-9999"></div>
        <div class="field"><label for="cMail">E-mail de contato (aparece na Política de Privacidade)</label><input id="cMail" name="contato_email" type="email" value="${esc(cfg.contato_email || "")}"></div>
        <div class="field"><label for="cRem">Remetente dos e-mails</label><input id="cRem" name="email_remetente" type="email" value="${esc(cfg.email_remetente || "")}"><small>Precisa ser do domínio ligado ao provedor de e-mail.</small></div>
        <div class="field"><label for="cRemN">Nome do remetente</label><input id="cRemN" name="nome_remetente" value="${esc(cfg.nome_remetente || "")}"></div>
        <div class="field"><label for="cTer">Versão dos Termos e da Política</label><input id="cTer" name="termos_versao" value="${esc(cfg.termos_versao || "")}"><small>Mude a data quando alterar o texto: cada cadastro guarda a versão aceita.</small></div></div>
      <div class="acts"><button class="btn pri" type="submit">Salvar</button></div></form>
    <div class="card pad fade mb"><h2>Envio de e-mail</h2>
      <p>${eu.email_provedor ? `<span class="pill ok">ligado: ${eu.email_provedor === "cloudflare" ? "Cloudflare Email Service" : "Resend"}</span>` : '<span class="pill warn">desligado: e-mails ficam em "E-mails enviados"</span>'}</p>
      <p class="small"><b>Opção 1 · Cloudflare Email Service</b> (exige o plano Workers Paid, US$ 5/mês): no painel da Cloudflare, <b>Email → Email Sending</b>, habilite o domínio <code>lldworks.com.br</code> (os registros de DNS são criados sozinhos). Depois, no Worker <b>lldworks-hub</b>, adicione o binding <b>Send Email</b> com o nome <code>EMAIL</code>.</p>
      <p class="small"><b>Opção 2 · Resend</b> (grátis até 3 mil e-mails/mês): crie a conta, adicione e verifique o domínio <code>lldworks.com.br</code> (copie os registros de DNS para a Cloudflare), gere uma API key e crie no Worker <b>lldworks-hub</b> o segredo <code>RESEND_API_KEY</code>.</p>
      <p class="small muted">Nenhuma chave passa pelo chat: tudo fica no painel da Cloudflare.</p></div>
    <div class="grid g2 fade">
      <div class="card pad"><h2>Mercado Pago</h2>
        <p>${eu.mercadopago ? '<span class="pill ok">credencial configurada</span>' : '<span class="pill warn">falta a credencial</span>'} ${eu.webhook ? '<span class="pill ok">webhook configurado</span>' : '<span class="pill warn">falta o segredo do webhook</span>'} ${eu.links ? '<span class="pill ok">links de pagamento ativos</span>' : '<span class="pill warn">links de pagamento desligados</span>'}</p>
        <p class="small">O cliente paga em <b>pagar.lldworks.com.br</b>: escolhe o plano e paga por <b>Pix</b> ou <b>cartão em até 12x</b>. A liberação é automática (aviso do Mercado Pago, retorno do cliente e conferência a cada 5 min).</p>
        <ol class="small" style="padding-left:18px;line-height:1.7"><li>No Mercado Pago: <b>Suas integrações → Criar aplicação</b> → <i>Pagamentos online</i> → <i>Checkout Pro</i>.</li><li>Copie o <b>Access Token de produção</b>.</li><li>Em <b>Webhooks</b>, cadastre <code>https://console.lldworks.com.br/webhooks/mercadopago</code> com o evento <i>Pagamentos</i> (modo produção) e copie a <b>assinatura secreta</b>.</li><li>No Cloudflare: Workers → <b>lldworks-hub</b> → Configurações → Variáveis e segredos: crie <code>MP_ACCESS_TOKEN</code> e <code>MP_WEBHOOK_SECRET</code> (tipo Secret).</li><li>Na conta do Mercado Pago: tenha uma <b>chave Pix</b> cadastrada (sem ela o Pix não aparece) e defina em <i>Parcelamento</i> quem paga os juros das parcelas.</li></ol>
        <p class="small muted">As chaves ficam só no Cloudflare: nunca passam pelo chat nem pelo navegador.</p></div>
      <div class="card pad"><h2>Segurança</h2><dl class="kv"><dt>Este painel</dt><dd>Cloudflare Access: código no e-mail autorizado a cada 24 h</dd><dt>Login dos clientes</dt><dd>Senha com hash PBKDF2 (100 mil iterações) conferida no servidor; sessão assinada de 8 h; bloqueio após 8 tentativas</dd><dt>Webhook</dt><dd>Assinatura HMAC do Mercado Pago conferida e eventos sem duplicidade</dd><dt>Histórico</dt><dd>Toda alteração registrada em <a href="#/eventos">Histórico</a></dd></dl></div>
    </div>`;
  };

  // ---------- cadastros feitos pelos clientes (/assinar) ----------
  const PRODUTOS_LOGIN = ["agentworks", "serviceworks", "salesworks", "linkworks", "socialworks", "rhworks"];
  const ETAPA = { email: ["Confirmando o e-mail", "warn"], pagamento: ["Aguardando pagamento", "warn"], ativo: ["Ativo", "ok"], existente: ["Já tinha conta", ""], cancelado: ["Cancelado", "bad"] };
  const EMAIL_ST = { enviado: ["enviado", "ok"], sem_provedor: ["não enviado: sem provedor", "warn"], erro: ["falhou", "bad"], pendente: ["na fila", ""] };
  const zap = (tel, txt) => { const d = String(tel || "").replace(/\D/g, ""); if (!d) return ""; const n = d.length <= 11 ? "55" + d : d; return `https://wa.me/${n}${txt ? "?text=" + encodeURIComponent(txt) : ""}`; };
  const telBR = (t) => { const d = String(t || "").replace(/\D/g, ""); return d.length === 11 ? `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}` : d.length === 10 ? `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}` : d; };
  V.cadastros = async () => {
    const f = sessionStorage.getItem("hub_cad") || "", q = sessionStorage.getItem("hub_cadq") || "";
    const [lista, prods] = await Promise.all([api(`cadastros?${f ? "etapa=" + f + "&" : ""}q=${encodeURIComponent(q)}`), produtos()]);
    window.__cads = lista;
    return `<div class="top"><div><h1>Cadastros</h1><p>Quem se cadastrou pelo site em qualquer produto, inclusive quem parou no meio. Todos aceitaram os Termos e a Política de Privacidade.</p></div>
      <div class="acts"><input class="search" id="buscaCad" type="search" placeholder="Nome, e-mail, empresa ou WhatsApp" value="${esc(q)}" aria-label="Buscar cadastro">
      <select id="filtroCad" aria-label="Etapa"><option value="">Todas as etapas</option>${Object.entries(ETAPA).map(([k, [l]]) => `<option value="${k}"${k === f ? " selected" : ""}>${l}</option>`).join("")}</select></div></div>
    <div class="card fade tbl-wrap"><table><thead><tr><th>Quando</th><th>Produto e plano</th><th>Pessoa</th><th>Contato</th><th>Etapa</th><th></th></tr></thead><tbody>
    ${lista.map((c) => { const [el, ec] = ETAPA[c.etapa] || [c.etapa, ""], [ml, mc] = EMAIL_ST[c.email_status] || ["", ""];
      return `<tr><td class="small">${dataBR(c.criado_em)}</td>
        <td>${prodTag(c.produto, prods)}<div class="small muted">${esc(c.plano || "—")}${c.preco_centavos ? " · " + brl(c.preco_centavos) : ""}</div></td>
        <td><b>${esc(c.nome)}</b>${c.empresa ? `<div class="small">${esc(c.empresa)}</div>` : ""}<div class="small muted">Termos aceitos em ${dataBR(c.termos_aceite_em)}${c.aceita_novidades ? " · aceita novidades" : ""}</div></td>
        <td><div>${esc(c.email)}</div>${ml && c.etapa === "email" ? `<span class="pill ${mc}">${ml}</span>` : ""}<div><a href="${zap(c.telefone, `Olá, ${c.nome}! Aqui é da LLD Works, sobre o seu cadastro no ${c.produto_nome}.`)}" target="_blank" rel="noopener">${svg("wa")}${esc(telBR(c.telefone))}</a></div></td>
        <td><span class="pill ${ec}">${el}</span>${c.avisou_pagamento_em ? `<div class="small" style="color:var(--warn,#b45309);margin-top:4px"><b>Avisou que pagou (Pix)</b> ${dataBR(c.avisou_pagamento_em)}</div>` : ""}${c.verificado_por && c.verificado_por !== "cliente" ? `<div class="small muted">e-mail confirmado por você</div>` : ""}</td>
        <td><div class="acts">
          ${c.etapa === "email" ? `<button class="btn sm" data-act="cadCodigo" data-id="${c.id}" data-email="${esc(c.email)}">Ver código</button><button class="btn sm" data-act="cadReenviar" data-id="${c.id}">Reenviar</button><button class="btn sm" data-act="cadVerificar" data-id="${c.id}">Confirmar e-mail</button>` : ""}
          ${c.etapa === "pagamento" ? `<button class="btn sm pri" data-act="cadPago" data-id="${c.id}" data-valor="${c.preco_centavos || 0}">Confirmar pagamento</button>` : ""}
          ${["email", "pagamento", "ativo"].includes(c.etapa) ? `<button class="btn sm" data-act="cadEmail" data-id="${c.id}" data-email="${esc(c.email)}">Trocar e-mail</button>` : ""}
          ${c.cliente_id ? `<a class="btn sm ghost" href="#/cliente/${c.cliente_id}">Cliente</a>` : ""}
          ${["email", "pagamento"].includes(c.etapa) ? `<button class="btn sm ghost danger" data-act="cadCancelar" data-id="${c.id}">Cancelar</button>` : ""}
        </div></td></tr>`; }).join("") || '<tr><td colspan="6" class="empty">Nenhum cadastro ainda. A página de cadastro de cada produto fica em <b>&lt;produto&gt;.lldworks.com.br/assinar</b>.</td></tr>'}
    </tbody></table></div>`;
  };

  // ---------- liberação grátis ----------
  V.liberar = async () => {
    const [prods, lista] = await Promise.all([produtos(), api("liberacoes")]);
    const hoje = new Date().toISOString().slice(0, 10);
    return `<div class="top"><div><h1>Liberação grátis</h1><p>Libere um ou mais produtos sem cobrança por alguns dias. Quando vence, o login e o painel travam na hora; os dados ficam guardados e voltam ao renovar ou assinar.</p></div></div>
    <form class="card pad fade mb" id="fLib">
      <div class="grid g2"><div class="field"><label for="lEmail">E-mail de acesso</label><input id="lEmail" name="email" type="email" required autocomplete="off"></div>
        <div class="field"><label for="lNome">Nome da pessoa</label><input id="lNome" name="nome"></div>
        <div class="field"><label for="lTel">WhatsApp (opcional)</label><input id="lTel" name="telefone" placeholder="(54) 99999-9999"></div>
        <div class="field"><label for="lEmp">Empresa (opcional)</label><input id="lEmp" name="empresa"></div></div>
      <div class="field"><label>Produtos</label><div class="chips">${prods.filter((p) => PRODUTOS_LOGIN.includes(p.slug)).map((p) => `<label class="chip"><input type="checkbox" name="produtos" value="${p.slug}"> ${prodTag(p.slug, prods)}</label>`).join("")}</div></div>
      <div class="field"><label>Por quantos dias</label><div class="chips">${[1, 7, 10, 15, 30].map((d) => `<label class="chip"><input type="radio" name="dias" value="${d}"${d === 7 ? " checked" : ""}> ${d} ${d === 1 ? "dia" : "dias"}</label>`).join("")}<label class="chip"><input type="radio" name="dias" value="outro"> outro: <input type="number" id="lOutro" min="1" max="365" style="width:80px" aria-label="Número de dias"></label></div></div>
      <div class="field"><label>Como a pessoa recebe o acesso</label><div class="chips"><label class="chip"><input type="radio" name="acesso" value="email" checked> Código de primeiro acesso por e-mail (ela cria a senha)</label><label class="chip"><input type="radio" name="acesso" value="provisoria"> Senha provisória para eu mandar no WhatsApp</label></div></div>
      <p class="err" id="lErr" role="alert"></p>
      <div class="acts"><button class="btn pri" type="submit">${svg("gift")}Liberar acesso</button></div>
      <div id="lRes"></div>
    </form>
    <div class="card fade tbl-wrap"><div class="pad"><h2>Liberações</h2></div><table><thead><tr><th>Pessoa</th><th>Produto</th><th>Situação</th><th>Até</th><th></th></tr></thead><tbody>
    ${lista.map((a) => { const vale = a.status === "teste" && a.vence_em >= hoje;
      return `<tr><td><a href="#/cliente/${a.cliente_id}"><b>${esc(a.cliente)}</b></a><div class="small muted">${esc(a.acessos || a.email)}</div></td><td>${prodTag(a.produto, prods)}</td>
        <td>${vale ? '<span class="pill ok">liberado</span>' : a.status === "ativa" ? '<span class="pill ok">virou assinatura</span>' : '<span class="pill bad">vencido · login travado</span>'}</td><td>${dataBR(a.vence_em)}</td>
        <td><div class="acts"><button class="btn sm" data-act="prorrogar" data-id="${a.id}">Prorrogar</button>${vale ? `<button class="btn sm ghost danger" data-act="encerrar" data-id="${a.id}">Encerrar agora</button>` : ""}</div></td></tr>`; }).join("") || '<tr><td colspan="5" class="empty">Nenhuma liberação grátis ainda.</td></tr>'}
    </tbody></table></div>`;
  };

  // ---------- e-mails enviados ----------
  V.emails = async () => {
    const r = await api("emails"), TIPO = { codigo_cadastro: "Código do cadastro", codigo_senha: "Nova senha", codigo_primeiro_acesso: "Primeiro acesso", acesso_liberado: "Acesso liberado" };
    return `<div class="top"><div><h1>E-mails enviados</h1><p>Todo e-mail automático passa por aqui: códigos, primeiro acesso e acesso liberado.</p></div></div>
    ${r.provedor ? `<div class="note mb">${svg("mail")}<div>Envio ligado pelo <b>${r.provedor === "cloudflare" ? "Cloudflare Email Service" : "Resend"}</b>. Falhas são reenviadas sozinhas a cada 5 minutos (até 5 vezes).</div></div>`
      : `<div class="note bad mb">${svg("mail")}<div><b>O envio de e-mail ainda não está ligado.</b> Os e-mails ficam guardados aqui: abra, copie o código e mande pelo WhatsApp. Quando ligar o provedor (veja <a href="#/config">Configurações</a>), os das últimas 48 h saem sozinhos.</div></div>`}
    <div class="card fade tbl-wrap"><table><thead><tr><th>Quando</th><th>Para</th><th>Assunto</th><th>Tipo</th><th>Situação</th><th></th></tr></thead><tbody>
    ${r.emails.map((e) => { const [l, c] = EMAIL_ST[e.status] || [e.status, ""];
      return `<tr><td class="small">${dataBR(e.criado_em)}</td><td>${esc(e.para)}</td><td class="small">${esc(e.assunto)}</td><td class="small">${esc(TIPO[e.tipo] || e.tipo || "")}</td><td><span class="pill ${c}">${l}</span>${e.erro ? `<div class="small muted">${esc(e.erro)}</div>` : ""}</td>
        <td><div class="acts"><button class="btn sm" data-act="verEmail" data-id="${e.id}">Ver</button>${e.status !== "enviado" ? `<button class="btn sm" data-act="reenviarEmail" data-id="${e.id}">Tentar de novo</button>` : ""}</div></td></tr>`; }).join("") || '<tr><td colspan="6" class="empty">Nenhum e-mail ainda.</td></tr>'}
    </tbody></table></div>`;
  };
  function verEmail(e) {
    const dlg = $("#dlg"), f = $("#dlgForm"), cod = (String(e.texto || "").match(/\b(\d{6})\b/) || [])[1];
    f.innerHTML = `<header><h2>${esc(e.assunto)}</h2><p class="muted small" style="margin:6px 0 0">Para ${esc(e.para)} · ${dataBR(e.criado_em)}</p></header>
      <div class="body">${cod ? `<p class="small muted" style="margin:0 0 6px">Código</p><div class="secret">${cod}</div><p class="small muted">Vale por 15 minutos depois de criado. Se venceu, use "Reenviar" no cadastro.</p>` : ""}<pre class="small" style="white-space:pre-wrap;background:var(--soft,#f4f3f8);padding:12px;border-radius:10px">${esc(e.texto || "")}</pre></div>
      <footer>${cod ? `<button type="button" class="btn" data-copiar>Copiar código</button>` : ""}<button type="button" class="btn pri" data-x>Fechar</button></footer>`;
    f.querySelector("[data-x]").onclick = () => dlg.close();
    const cp = f.querySelector("[data-copiar]"); if (cp) cp.onclick = () => navigator.clipboard.writeText(cod).then(() => toast("Código copiado"), () => toast("Selecione e copie", true));
    dlg.showModal();
  }
  async function badgeCadastros() {
    try { const l = await api("cadastros?etapa=pagamento"); const n = l.filter((c) => c.avisou_pagamento_em).length + (await api("cadastros?etapa=email")).filter((c) => Date.now() - Date.parse(c.criado_em) < 3 * 864e5).length;
      const b = $("#nCad"); if (b) { b.hidden = !n; b.textContent = n; } } catch {}
  }

  // ---------- ações ----------
  const ACT = {
    novoCliente: () => novoCliente(),
    editarCliente: () => novoCliente(window.__cliente.c),
    excluirCliente: async (b) => { if (!confirmar("Excluir o cliente e TODOS os acessos, assinaturas e pagamentos dele? Não dá para desfazer.")) return; await api("clientes/" + b.dataset.id, { method: "DELETE" }); toast("Cliente excluído"); location.hash = "#/clientes"; },
    novaAssinatura: (b) => {
      const { prods, pls, assinaturas } = window.__cliente; const tem = new Set(assinaturas.map((a) => a.produto));
      const livres = prods.filter((p) => p.url_admin && !tem.has(p.slug));
      if (!livres.length) return toast("Este cliente já tem todos os produtos.");
      formulario({ titulo: "Adicionar produto ao cliente", descricao: "Em teste grátis o acesso é liberado até o fim dos dias de teste do plano.",
        campos: [{ nome: "produto", rotulo: "Produto", tipo: "select", opcoes: livres.map((p) => [p.slug, p.nome]), obrig: true },
          { nome: "plano_id", rotulo: "Plano", tipo: "select", opcoes: [["", "Escolher depois"], ...pls.filter((x) => x.ativo).map((x) => [x.id, `${(prods.find((p) => p.slug === x.produto) || {}).nome} · ${x.nome} · ${brl(x.preco_centavos)}`])] },
          { nome: "status", rotulo: "Começa como", tipo: "select", opcoes: [["teste", "Teste grátis"], ["pendente", "Aguardando pagamento"], ["ativa", "Ativa (já pagou)"], ["cortesia", "Cortesia (sem cobrança)"]] }],
        aoEnviar: async (d) => { const pl = pls.find((x) => String(x.id) === d.plano_id); if (pl && pl.produto !== d.produto) throw new Error("Esse plano é de outro produto."); await api("assinaturas", { method: "POST", body: { cliente_id: +b.dataset.id, ...d } }); toast("Produto adicionado. Crie o login em 'Logins e senhas'."); render(); } });
    },
    editarAssinatura: (b) => {
      const { prods, pls, assinaturas } = window.__cliente; const a = assinaturas.find((x) => x.id === +b.dataset.id);
      formulario({ titulo: "Editar assinatura · " + a.produto_nome,
        campos: [{ nome: "plano_id", rotulo: "Plano", tipo: "select", valor: a.plano_id || "", opcoes: [["", "Sem plano"], ...pls.filter((x) => x.produto === a.produto).map((x) => [x.id, `${x.nome} · ${brl(x.preco_centavos)}`])] },
          { nome: "status", rotulo: "Status", tipo: "select", valor: a.status, opcoes: Object.entries(STATUS_ASS) },
          { nome: "vence_em", rotulo: "Vence em", tipo: "date", valor: a.vence_em || "", ajuda: "Depois dessa data: teste vira 'aguardando pagamento' e ativa vira 'inadimplente' (3 dias de tolerância). O login é bloqueado." }],
        aoEnviar: async (d) => { await api("assinaturas/" + a.id, { method: "PUT", body: d }); toast("Assinatura salva"); render(); } });
      void prods;
    },
    linkPagamento: async (b) => { b.disabled = true; try { mostrarLink(+b.dataset.id, await api(`assinaturas/${b.dataset.id}/link`)); } finally { b.disabled = false; } },
    cobranca: async (b) => { b.disabled = true; try { const r = await api(`assinaturas/${b.dataset.id}/cobranca`, { method: "POST" }); toast("Link de pagamento criado"); await navigator.clipboard.writeText(r.link).catch(() => {}); render(); } catch (e) { toast(e.message, true); b.disabled = false; } },
    lancarPagamento: (b) => formulario({ titulo: "Registrar pagamento", descricao: "Use para Pix, transferência ou dinheiro recebidos fora do Mercado Pago. Marcado como pago, a assinatura fica ativa e o vencimento avança um ciclo.",
      campos: [{ nome: "valor", rotulo: "Valor (R$)", tipo: "number", passo: "0.01", min: 0, obrig: true, valor: (+b.dataset.valor / 100).toFixed(2) },
        { nome: "status", rotulo: "Situação", tipo: "select", opcoes: [["pago", "Pago"], ["pendente", "Pendente (cobrança em aberto)"]] },
        { nome: "metodo", rotulo: "Forma", tipo: "select", opcoes: [["pix", "Pix"], ["transferencia", "Transferência"], ["boleto", "Boleto"], ["cartao", "Cartão"], ["dinheiro", "Dinheiro"]] },
        { nome: "vencimento", rotulo: "Vencimento", tipo: "date" }, { nome: "referencia", rotulo: "Referência / comprovante", ph: "ID do Pix, nº do comprovante..." }],
      aoEnviar: async (d) => { await api("pagamentos", { method: "POST", body: { assinatura_id: +b.dataset.id, valor_centavos: Math.round(parseFloat(String(d.valor).replace(",", ".")) * 100), status: d.status, metodo: d.metodo, referencia: d.referencia, vencimento: d.vencimento } }); toast("Pagamento registrado"); render(); } }),
    baixar: async (b) => { if (!confirmar("Confirmar que este pagamento foi recebido? A assinatura fica ativa e o vencimento avança.")) return; await api("pagamentos/" + b.dataset.id, { method: "PUT", body: { status: "pago" } }); toast("Pagamento confirmado"); render(); },
    mudarPagamento: (b) => formulario({ titulo: "Alterar pagamento", campos: [{ nome: "status", rotulo: "Situação", tipo: "select", opcoes: Object.entries(STATUS_PAG) }], aoEnviar: async (d) => { await api("pagamentos/" + b.dataset.id, { method: "PUT", body: d }); toast("Pagamento alterado"); render(); } }),
    novoUsuario: (b) => {
      const { assinaturas } = window.__cliente;
      if (!assinaturas.length) return toast("Adicione um produto ao cliente antes de criar o login.", true);
      formulario({ titulo: "Criar login do cliente", descricao: "Deixe a senha em branco para gerar uma senha forte automaticamente.",
        campos: [{ nome: "produto", rotulo: "Produto", tipo: "select", opcoes: assinaturas.map((a) => [a.produto, a.produto_nome]), obrig: true },
          { nome: "email", rotulo: "E-mail de login", tipo: "email", obrig: true, valor: window.__cliente.c.email, auto: "off" }, { nome: "nome", rotulo: "Nome da pessoa" },
          { nome: "papel", rotulo: "Papel", tipo: "select", opcoes: [["admin", "Administrador (configura tudo)"], ["equipe", "Equipe (uso do dia a dia)"]] },
          { nome: "acesso", rotulo: "Como entregar o acesso", tipo: "select", opcoes: [["email", "Enviar código de primeiro acesso por e-mail (a pessoa cria a senha)"], ["senha", "Gerar senha agora (eu envio)"]] },
          { nome: "senha", rotulo: "Senha (só se escolheu gerar)", tipo: "text", auto: "new-password", ajuda: "Em branco = senha forte automática. Mínimo 10 caracteres com letras e números." }],
        aoEnviar: async (d) => { const r = await api("usuarios", { method: "POST", body: { cliente_id: +b.dataset.id, ...d, senha: d.acesso === "email" ? "" : d.senha } }); render(); if (r.convite) toast(r.email_provedor ? "Código de primeiro acesso enviado por e-mail" : "Acesso criado. O e-mail ficou em 'E-mails enviados' (envio desligado): copie o código e mande pelo WhatsApp."); else setTimeout(() => mostrarSenha(d.email, r.senha, d.produto), 50); } });
    },
    novaSenha: async (b) => { if (!confirmar("Gerar uma nova senha? A senha atual deixa de funcionar.")) return; const r = await api(`usuarios/${b.dataset.id}/senha`, { method: "POST", body: {} }); mostrarSenha(b.dataset.email, r.senha, b.dataset.produto); },
    bloquear: async (b) => { await api("usuarios/" + b.dataset.id, { method: "PUT", body: { ativo: b.dataset.ativo === "1", nome: b.dataset.nome, papel: b.dataset.papel } }); toast(b.dataset.ativo === "1" ? "Login liberado" : "Login bloqueado"); render(); },
    excluirUsuario: async (b) => { if (!confirmar("Excluir este login?")) return; await api("usuarios/" + b.dataset.id, { method: "DELETE" }); toast("Login excluído"); render(); },
    novoParametro: (b) => formParametro(+b.dataset.id),
    editarParametro: (b) => formParametro(+b.dataset.id, b.dataset),
    excluirParametro: async (b) => { await api("parametros", { method: "DELETE", body: { cliente_id: +b.dataset.id, produto: b.dataset.produto, chave: b.dataset.chave } }); toast("Parâmetro excluído"); render(); },
    novoPlano: () => formPlano(),
    editarPlano: (b) => formPlano((CACHE.planos || []).find((x) => x.id === +b.dataset.id)),
    editarProduto: (b) => { const p = CACHE.produtos.find((x) => x.slug === b.dataset.slug);
      formulario({ titulo: "Endereços · " + p.nome, campos: [{ nome: "url_admin", rotulo: "Painel (admin do cliente)", tipo: "url", valor: p.url_admin }, { nome: "url_vitrine", rotulo: "Vitrine (quem compra)", tipo: "url", valor: p.url_vitrine }, { nome: "url_status", rotulo: "Endereço para testar se está no ar", tipo: "url", valor: p.url_status }, { nome: "ativo", rotulo: "Situação", tipo: "select", valor: String(p.ativo), opcoes: [["1", "Ativo"], ["0", "Desligado"]] }],
        aoEnviar: async (d) => { await api("produtos/" + p.slug, { method: "PUT", body: { ...d, ativo: d.ativo === "1" } }); toast("Aplicação salva"); CACHE.produtos = null; render(); } }); },
    cadCodigo: async (b) => { const l = (await api("emails")).emails.filter((e) => e.para === b.dataset.email && e.tipo === "codigo_cadastro"); if (!l.length) return toast("Nenhum e-mail com código para este endereço.", true); verEmail(await api("emails/" + l[0].id)); },
    cadReenviar: async (b) => { await api(`cadastros/${b.dataset.id}/reenviar`, { method: "POST", body: {} }); toast("Novo código gerado"); render(); },
    cadVerificar: async (b) => { if (!confirmar("Confirmar o e-mail deste cadastro sem o código? Faça isso só se você falou com a pessoa e conferiu o e-mail.")) return; const r = await api(`cadastros/${b.dataset.id}/verificar`, { method: "POST", body: {} }); toast(r.etapa === "existente" ? "Este e-mail já tinha acesso ao produto" : "E-mail confirmado. Agora falta o pagamento."); render(); },
    cadPago: (b) => formulario({ titulo: "Confirmar pagamento do cadastro", descricao: "A assinatura fica ativa por um ciclo e o cliente recebe o e-mail de acesso liberado.",
      campos: [{ nome: "metodo", rotulo: "Forma", tipo: "select", opcoes: [["pix", "Pix"], ["transferencia", "Transferência"], ["cartao", "Cartão"], ["dinheiro", "Dinheiro"]] }],
      aoEnviar: async (d) => { await api(`cadastros/${b.dataset.id}/confirmar-pagamento`, { method: "POST", body: d }); toast("Pagamento confirmado: acesso liberado"); render(); } }),
    cadEmail: (b) => formulario({ titulo: "Trocar e-mail do cadastro", descricao: "Use quando a pessoa digitou errado. Antes de confirmado: um novo código vai para o e-mail novo. Depois: o login passa a ser o e-mail novo (a senha continua a mesma).",
      campos: [{ nome: "email", rotulo: "E-mail correto", tipo: "email", obrig: true, valor: b.dataset.email, auto: "off" }],
      aoEnviar: async (d) => { await api(`cadastros/${b.dataset.id}/email`, { method: "PUT", body: d }); toast("E-mail trocado"); render(); } }),
    cadCancelar: async (b) => { if (!confirmar("Cancelar este cadastro? Ele sai da lista de pendentes.")) return; await api(`cadastros/${b.dataset.id}/cancelar`, { method: "POST", body: {} }); toast("Cadastro cancelado"); render(); },
    prorrogar: (b) => formulario({ titulo: "Prorrogar acesso", descricao: "Soma dias a partir do vencimento atual (ou de hoje, se já venceu). O login destrava na hora.",
      campos: [{ nome: "dias", rotulo: "Dias", tipo: "select", opcoes: [["1", "1 dia"], ["7", "7 dias"], ["10", "10 dias"], ["15", "15 dias"], ["30", "30 dias"], ["60", "60 dias"], ["90", "90 dias"]], valor: "7" }],
      aoEnviar: async (d) => { const r = await api(`assinaturas/${b.dataset.id}/prorrogar`, { method: "POST", body: { dias: +d.dias } }); toast("Liberado até " + dataBR(r.vence_em)); render(); } }),
    encerrar: async (b) => { if (!confirmar("Encerrar a liberação agora? O login trava na hora; os dados ficam guardados.")) return; await api(`assinaturas/${b.dataset.id}/encerrar`, { method: "POST", body: {} }); toast("Liberação encerrada"); render(); },
    enviarAcesso: async (b) => { const r = await api(`usuarios/${b.dataset.id}/enviar-acesso`, { method: "POST", body: {} }); toast(r.provedor ? "Código enviado para " + b.dataset.email : "Código gerado. Envio desligado: copie em 'E-mails enviados'."); },
    trocarEmailUsuario: (b) => formulario({ titulo: "Trocar e-mail de acesso", descricao: "O login passa a ser o e-mail novo. A pessoa recebe um aviso (ou o código de primeiro acesso, se ainda não criou a senha).",
      campos: [{ nome: "email", rotulo: "E-mail novo", tipo: "email", obrig: true, valor: b.dataset.email, auto: "off" }],
      aoEnviar: async (d) => { await api(`usuarios/${b.dataset.id}/email`, { method: "PUT", body: d }); toast("E-mail trocado"); render(); } }),
    verEmail: async (b) => verEmail(await api("emails/" + b.dataset.id)),
    reenviarEmail: async (b) => { const r = await api(`emails/${b.dataset.id}/reenviar`, { method: "POST", body: {} }); toast(r.status === "enviado" ? "E-mail enviado" : r.status === "sem_provedor" ? "Envio de e-mail ainda desligado" : "Falhou: " + (r.erro || "")); render(); },
    checarAgora: async (b) => { b.disabled = true; try { await api("monitor/agora", { method: "POST" }); toast("Verificação concluída"); render(); } catch (e) { toast(e.message, true); b.disabled = false; } },
  };
  function formParametro(cid, atual) {
    const { assinaturas } = window.__cliente;
    formulario({ titulo: atual ? "Editar parâmetro" : "Novo parâmetro",
      campos: [{ nome: "produto", rotulo: "Produto", tipo: "select", valor: atual && atual.produto, opcoes: assinaturas.map((a) => [a.produto, a.produto_nome]), obrig: true },
        { nome: "chave", rotulo: "Nome", obrig: true, valor: atual && atual.chave, ph: "ex.: whatsapp, horario_abertura, cor_principal" },
        { nome: "valor", rotulo: "Valor", tipo: "area", valor: atual && atual.valor }],
      aoEnviar: async (d) => { await api("parametros", { method: "PUT", body: { cliente_id: cid, ...d } }); toast("Parâmetro salvo"); render(); } });
  }

  document.addEventListener("click", async (e) => {
    const go = e.target.closest("tr[data-go]");
    if (go && !e.target.closest("a,button")) { location.hash = go.dataset.go; return; }
    const aba = e.target.closest("[data-aba]");
    if (aba) { abaCliente = aba.dataset.aba; render(); return; }
    const b = e.target.closest("[data-act]");
    if (b && ACT[b.dataset.act]) { e.preventDefault(); try { await ACT[b.dataset.act](b); } catch (er) { toast(er.message, true); } }
  });
  document.addEventListener("input", (e) => {
    if (e.target.id === "buscaCad") { clearTimeout(window.__bt); window.__bt = setTimeout(() => { sessionStorage.setItem("hub_cadq", e.target.value); render().then(() => { const i = $("#buscaCad"); if (i) { i.focus(); i.setSelectionRange(i.value.length, i.value.length); } }); }, 300); }
    if (e.target.id === "lOutro") { const r = document.querySelector('input[name=dias][value=outro]'); if (r) r.checked = true; }
    if (e.target.id === "busca") { clearTimeout(window.__bt); window.__bt = setTimeout(() => { sessionStorage.setItem("hub_q", e.target.value); render().then(() => { const i = $("#busca"); if (i) { i.focus(); i.setSelectionRange(i.value.length, i.value.length); } }); }, 300); }
  });
  document.addEventListener("change", (e) => {
    if (e.target.id === "filtroPg") { sessionStorage.setItem("hub_pg", e.target.value); render(); }
    if (e.target.id === "filtroCad") { sessionStorage.setItem("hub_cad", e.target.value); render(); }
  });
  document.addEventListener("submit", async (e) => {
    const f = e.target;
    if (f.id === "fCfg") {
      e.preventDefault();
      try { await api("config", { method: "PUT", body: Object.fromEntries(new FormData(f).entries()) }); toast("Configurações salvas"); } catch (er) { toast(er.message, true); }
    }
    if (f.id === "fLib") {
      e.preventDefault();
      const fd = new FormData(f), dias = fd.get("dias") === "outro" ? +$("#lOutro").value : +fd.get("dias"), btn = f.querySelector("button[type=submit]");
      $("#lErr").textContent = ""; btn.disabled = true;
      try {
        const r = await api("liberacoes", { method: "POST", body: { email: fd.get("email"), nome: fd.get("nome"), telefone: fd.get("telefone"), empresa: fd.get("empresa"), produtos: fd.getAll("produtos"), dias, acesso: fd.get("acesso") } });
        const linhas = r.resultado.map((x) => `<li><b>${esc(x.nome)}</b>: ${x.aviso ? esc(x.aviso) : `liberado até ${dataBR(x.vence_em)}${x.senha ? ` · senha provisória <code>${esc(x.senha)}</code>` : x.primeiro_acesso ? " · código de primeiro acesso por e-mail" : " · já tinha senha: avisado por e-mail"}`}</li>`).join("");
        sessionStorage.setItem("hub_lib", `<div class="note mt"><div><b>Pronto.</b><ul style="margin:6px 0 0;padding-left:18px">${linhas}</ul><p class="small muted" style="margin:6px 0 0">A senha provisória aparece só agora. Sem envio de e-mail ligado, os códigos ficam em "E-mails enviados".</p></div></div>`);
        await render(); $("#lRes").innerHTML = sessionStorage.getItem("hub_lib"); sessionStorage.removeItem("hub_lib");
      } catch (er) { $("#lErr").textContent = er.message; } finally { btn.disabled = false; }
    }
  });

  // ---------- roteamento ----------
  async function render() {
    const [, rota = "inicio", arg] = (location.hash || "#/inicio").split("/");
    if (rota !== "cliente") abaCliente = abaCliente || "produtos";
    $$("#nav a").forEach((a) => a.classList.toggle("on", a.dataset.r === (rota === "cliente" ? "clientes" : rota)));
    const v = $("#view");
    try { v.innerHTML = await (V[rota] || V.inicio)(arg); }
    catch (e) { v.innerHTML = `<div class="note bad">${esc(e.message)}</div>`; }
  }
  let ultimaRota = "";
  window.addEventListener("hashchange", () => { const r = location.hash.split("/")[1]; if (r === "cliente" && ultimaRota !== location.hash) abaCliente = "produtos"; ultimaRota = location.hash; render(); window.scrollTo(0, 0); });
  badgeCadastros(); setInterval(badgeCadastros, 120000);
  api("eu").then((eu) => { $("#me").innerHTML = `<b>${esc(eu.email)}</b>Cloudflare Access · <a href="/cdn-cgi/access/logout">sair</a>`; }).catch(() => {});
  render();
})();
