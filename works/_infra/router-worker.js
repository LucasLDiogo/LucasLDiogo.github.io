// LLD Works — roteador do domínio lldworks.com.br
// Serve o portfólio e os sites (conteúdo no GitHub Pages em /works/), redireciona aliases
// e hospeda o console central (login por senha + cookie assinado; trocar por Cloudflare Access quando ativado).
const ORIGEM = "https://lucasldiogo.lldworks.com.br/works/";
const SITES = { "lldworks.com.br": "portfolio", "www.lldworks.com.br": "portfolio", "clinica.lldworks.com.br": "clinica", "imobiliaria.lldworks.com.br": "imobiliaria" };
const ALIASES = {
  "agentworks.lldworks.com.br": "https://atende.lldworks.com.br/painel",
  "rhworks.lldworks.com.br": "https://crivo.lldworks.com.br/",
  "serviceworks.lldworks.com.br": "https://lldworks.com.br/demos/serviceworks.html",
  "salesworks.lldworks.com.br": "https://lldworks.com.br/demos/salesworks.html",
  "linkworks.lldworks.com.br": "https://lldworks.com.br/demos/linkworks.html",
  "socialworks.lldworks.com.br": "https://lldworks.com.br/demos/socialworks.html",
  "pageworks.lldworks.com.br": "https://lldworks.com.br/#pageworks",
  "proworks.lldworks.com.br": "https://lucasldiogo.lldworks.com.br/",
};
const SEG = {
  "Strict-Transport-Security": "max-age=31536000; includeSubDomains",
  "X-Content-Type-Options": "nosniff",
  "Referrer-Policy": "strict-origin-when-cross-origin",
  "Permissions-Policy": "camera=(), microphone=(), geolocation=()",
  "X-Frame-Options": "SAMEORIGIN",
};
const APPS = [
  { n: "Portfólio LLD Works", u: "https://lldworks.com.br/", cli: "https://lldworks.com.br/", emp: null, lld: null },
  { n: "AgentWorks (LLD Atende)", u: "https://atende.lldworks.com.br/painel", cli: "WhatsApp da empresa", emp: "https://atende.lldworks.com.br/painel", lld: "https://atende.lldworks.com.br/painel", pc: true },
  { n: "Gateway WhatsApp (WA-AKG)", u: "https://wa.lldworks.com.br/", cli: null, emp: null, lld: "https://wa.lldworks.com.br/", pc: true },
  { n: "RHWorks · Triagem (Crivo)", u: "https://crivo.lldworks.com.br/", cli: null, emp: "https://crivo.lldworks.com.br/", lld: null },
  { n: "PageWorks · Clínica Vértice", u: "https://clinica.lldworks.com.br/", cli: "https://clinica.lldworks.com.br/", emp: null, lld: null },
  { n: "PageWorks · Araucária Imóveis", u: "https://imobiliaria.lldworks.com.br/", cli: "https://imobiliaria.lldworks.com.br/", emp: null, lld: null },
  { n: "ProWorks · Lucas L. Diogo", u: "https://lucasldiogo.lldworks.com.br/", cli: "https://lucasldiogo.lldworks.com.br/", emp: null, lld: null },
  { n: "Rancho Flores (cliente)", u: "https://ranchofloresloja.com/", cli: "https://ranchofloresloja.com/loja", emp: "https://ranchofloresloja.com/admin/login", lld: null },
];
const enc = new TextEncoder();
const b64 = (buf) => btoa(String.fromCharCode(...new Uint8Array(buf)));
const ub64 = (s) => Uint8Array.from(atob(s), (c) => c.charCodeAt(0));
async function hmac(key, msg) {
  const k = await crypto.subtle.importKey("raw", enc.encode(key), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  return b64(await crypto.subtle.sign("HMAC", k, enc.encode(msg))).replace(/[+/=]/g, (c) => ({ "+": "-", "/": "_", "=": "" }[c]));
}
async function senhaOk(senha, guardado) {
  const [salt, hash] = guardado.split(".");
  const k = await crypto.subtle.importKey("raw", enc.encode(senha), "PBKDF2", false, ["deriveBits"]);
  const bits = await crypto.subtle.deriveBits({ name: "PBKDF2", salt: ub64(salt), iterations: 100000, hash: "SHA-256" }, k, 256);
  const a = new Uint8Array(bits), b = ub64(hash);
  if (a.length !== b.length) return false;
  let d = 0; for (let i = 0; i < a.length; i++) d |= a[i] ^ b[i];
  return d === 0;
}
async function sessaoValida(req, env) {
  const c = (req.headers.get("Cookie") || "").match(/(?:^|;\s*)lldc=([^;]+)/);
  if (!c) return false;
  const [exp, sig] = c[1].split(".");
  if (!exp || !sig || Date.now() > +exp) return false;
  return (await hmac(env.SESSION_KEY, "console:" + exp)) === sig;
}
function html(body, status = 200, extra = {}) {
  return new Response(body, { status, headers: { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "no-store", "Content-Security-Policy": "default-src 'self'; style-src 'self' 'unsafe-inline'; script-src 'self' 'unsafe-inline'; frame-ancestors 'none'", ...SEG, ...extra } });
}
const CSS = `:root{--co:#1240E0;--ink:#0B1020;--mute:#566079;--line:#E3E7F0;--bg:#F3F5FA}*{box-sizing:border-box}body{margin:0;font:15px/1.55 Inter,system-ui,sans-serif;background:var(--bg);color:var(--ink)}
h1,h2{margin:0}a{color:var(--co)}.top{background:#0B1020;color:#fff;padding:14px max(4vw,16px);display:flex;align-items:center;gap:14px}
.top b{font-weight:800;font-size:19px}.top b i{font-style:normal;color:#7C9BFF}.top span{opacity:.7;font-size:13px}.top form{margin-left:auto}
main{max-width:1240px;margin:0 auto;padding:24px max(4vw,16px) 60px}table{width:100%;border-collapse:collapse;background:#fff;border-radius:14px;overflow:hidden;margin-top:14px}
th,td{padding:12px 14px;border-bottom:1px solid var(--line);text-align:left;font-size:14px;vertical-align:top}th{background:#EEF1F8;color:var(--mute);font-size:12.5px}
.st{display:inline-block;padding:3px 10px;border-radius:99px;font-weight:700;font-size:12px;background:#EEF1F8;color:var(--mute);white-space:nowrap}.st.ok{background:#E3F6EC;color:#0E7A50}.st.bad{background:#FDECEC;color:#C02626}
.btn{border:0;background:var(--co);color:#fff;font-weight:700;border-radius:10px;padding:10px 16px;cursor:pointer;font-size:15px}.card{background:#fff;border-radius:16px;padding:22px;border:1px solid var(--line)}
input{width:100%;min-height:46px;border:1.5px solid var(--line);border-radius:10px;padding:10px 12px;font-size:16px;margin:8px 0 14px}.grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(260px,1fr));gap:14px;margin-top:18px}
.pc{color:#B45309;font-size:12px;font-weight:600}@media(max-width:700px){td:nth-child(3),th:nth-child(3){display:none}}`;
function loginPage(erro) {
  return `<!DOCTYPE html><html lang="pt-BR"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex"><title>Console LLD Works</title><style>${CSS}</style></head>
<body><div class="top"><b>LLD <i>Works</i></b><span>Console central</span></div><main style="max-width:420px"><div class="card" style="margin-top:40px"><h1 style="font-size:22px">Entrar no console</h1>
<p style="color:var(--mute)">Acesso restrito ao responsável pela LLD Works.</p><form method="post" action="/login"><label for="s">Senha</label><input id="s" name="senha" type="password" autocomplete="current-password" required autofocus>
${erro ? `<p style="color:#C02626;margin-top:0">${erro}</p>` : ""}<button class="btn" style="width:100%">Entrar</button></form></div></main></body></html>`;
}
function consolePage() {
  const linha = (a, i) => `<tr><td><b>${a.n}</b>${a.pc ? '<br><span class="pc">roda no PC do Lucas (Docker + túnel)</span>' : ""}</td><td><span class="st" id="s${i}">verificando…</span></td>
<td>${a.cli ? (a.cli.startsWith("http") ? `<a href="${a.cli}" target="_blank" rel="noopener">abrir</a>` : a.cli) : "—"}</td><td>${a.emp ? `<a href="${a.emp}" target="_blank" rel="noopener">painel</a>` : "—"}</td><td>${a.lld ? `<a href="${a.lld}" target="_blank" rel="noopener">admin</a>` : "—"}</td></tr>`;
  return `<!DOCTYPE html><html lang="pt-BR"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex"><title>Console LLD Works</title><style>${CSS}</style></head>
<body><div class="top"><b>LLD <i>Works</i></b><span>Console central · todas as aplicações</span><form method="post" action="/sair"><button class="btn" style="background:#2A3350">Sair</button></form></div><main>
<h1 style="font-size:26px">Aplicações</h1><p style="color:var(--mute)">Status verificado agora pelo servidor. Cliente = o que o consumidor final usa; Empresa = painel do estabelecimento; LLD = administração da LLD Works.</p>
<table><thead><tr><th>Aplicação</th><th>Status</th><th>Cliente</th><th>Empresa</th><th>LLD</th></tr></thead><tbody>${APPS.map(linha).join("")}</tbody></table>
<div class="grid"><div class="card"><h2 style="font-size:17px">Infraestrutura</h2><p><a href="https://dash.cloudflare.com/" target="_blank" rel="noopener">Cloudflare</a> · <a href="https://github.com/LucasLDiogo" target="_blank" rel="noopener">GitHub</a> · <a href="https://supabase.com/dashboard" target="_blank" rel="noopener">Supabase</a></p></div>
<div class="card"><h2 style="font-size:17px">Segurança do console</h2><p style="color:var(--mute);margin:6px 0 0">Senha com hash PBKDF2, sessão assinada de 12 h. Próximo passo: ativar o Cloudflare Access (código por e-mail) na frente deste endereço.</p></div></div>
</main><script>fetch('/api/status').then(r=>r.json()).then(l=>l.forEach((s,i)=>{const e=document.getElementById('s'+i);e.textContent=s.ok?('no ar · '+s.ms+' ms'):('fora · '+(s.code||'sem resposta'));e.className='st '+(s.ok?'ok':'bad')})).catch(()=>{})</script></body></html>`;
}
async function consoleApp(req, env, url) {
  if (url.pathname === "/login" && req.method === "POST") {
    const f = await req.formData();
    const senha = String(f.get("senha") || "").slice(0, 200);
    if (!(await senhaOk(senha, env.CONSOLE_PASS_HASH))) {
      await new Promise((r) => setTimeout(r, 900));
      return html(loginPage("Senha incorreta."), 401);
    }
    const exp = Date.now() + 12 * 3600e3;
    const cookie = `lldc=${exp}.${await hmac(env.SESSION_KEY, "console:" + exp)}; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=43200`;
    return new Response(null, { status: 303, headers: { Location: "/", "Set-Cookie": cookie, ...SEG } });
  }
  if (url.pathname === "/sair") return new Response(null, { status: 303, headers: { Location: "/", "Set-Cookie": "lldc=; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=0", ...SEG } });
  if (!(await sessaoValida(req, env))) return url.pathname.startsWith("/api/") ? new Response("{}", { status: 401 }) : html(loginPage(""));
  if (url.pathname === "/api/status") {
    const res = await Promise.all(APPS.map(async (a) => {
      const t = Date.now();
      try { const r = await fetch(a.u, { method: "GET", redirect: "manual", signal: AbortSignal.timeout(8000) }); return { ok: r.status > 0 && r.status < 500, code: r.status, ms: Date.now() - t }; }
      catch { return { ok: false, code: 0, ms: Date.now() - t }; }
    }));
    return new Response(JSON.stringify(res), { headers: { "Content-Type": "application/json", "Cache-Control": "no-store" } });
  }
  return html(consolePage());
}
export default {
  async fetch(req, env) {
    const url = new URL(req.url);
    const host = url.hostname;
    if (host === "console.lldworks.com.br") return consoleApp(req, env, url);
    if (host === "rancho.lldworks.com.br") return Response.redirect("https://ranchofloresloja.com/", 302);
    if (ALIASES[host]) return Response.redirect(ALIASES[host], 302);
    const dir = SITES[host];
    if (!dir) return new Response("Não encontrado", { status: 404 });
    if (req.method !== "GET" && req.method !== "HEAD") return new Response("Método não permitido", { status: 405 });
    let path = url.pathname;
    if (path.includes("..")) return new Response("Inválido", { status: 400 });
    if (path.endsWith("/")) path += "index.html";
    const r = await fetch(ORIGEM + dir + path, { cf: { cacheTtl: 300, cacheEverything: true } });
    if (r.status === 404) return new Response("Página não encontrada", { status: 404, headers: { "Content-Type": "text/plain; charset=utf-8" } });
    const h = new Headers(r.headers);
    for (const [k, v] of Object.entries(SEG)) h.set(k, v);
    for (const k of ["x-github-request-id", "via", "x-served-by", "x-fastly-request-id", "x-proxy-cache", "x-cache", "x-cache-hits", "x-timer"]) h.delete(k);
    return new Response(r.body, { status: r.status, headers: h });
  },
};
