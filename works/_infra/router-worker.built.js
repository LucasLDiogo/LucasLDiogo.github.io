// LLD Works — roteador do domínio lldworks.com.br
// Serve o portfólio, os sites e os produtos (conteúdo no GitHub Pages em /works/), com login real por produto,
// e hospeda o console central, aberto só com token válido do Cloudflare Access.
const ORIGEM = "https://lucasldiogo.lldworks.com.br/works/";
const SITES = { "produtos.lldworks.com.br": "portfolio", "lldworks.com.br": "portfolio", "www.lldworks.com.br": "portfolio", "clinica.lldworks.com.br": "clinica", "imobiliaria.lldworks.com.br": "imobiliaria" };
const ALIASES = {
  "pageworks.lldworks.com.br": "https://produtos.lldworks.com.br/#pageworks",
  "proworks.lldworks.com.br": "https://lucasldiogo.lldworks.com.br/",
};
// Produtos com login: cada um no próprio endereço. dir = pasta em /works/, entrada = página principal.
const PRODUTOS = {
  "agentworks.lldworks.com.br": { slug: "agentworks", nome: "AgentWorks", cor: "#0E9F6E", dir: "portfolio/demos", entrada: "agentworks.html", frase: "Atendimento no WhatsApp com IA, base de conhecimento e passagem para humano." },
  "salesworks.lldworks.com.br": { slug: "salesworks", nome: "SalesWorks", cor: "#EA580C", dir: "portfolio/demos", entrada: "salesworks.html", frase: "Loja online e CRM de vendas: pipeline, clientes e campanhas." },
  "serviceworks.lldworks.com.br": { slug: "serviceworks", nome: "ServiceWorks", cor: "#7C3AED", dir: "portfolio/demos", entrada: "serviceworks.html", frase: "Agenda, vitrine de serviços, CRM e assistente para barbearia, salão, clínica e pet shop." },
  "linkworks.lldworks.com.br": { slug: "linkworks", nome: "LinkWorks", cor: "#DB2777", dir: "portfolio/demos", entrada: "linkworks.html", frase: "Link na bio com páginas, estatísticas e proteção." },
  "socialworks.lldworks.com.br": { slug: "socialworks", nome: "SocialWorks", cor: "#DC2626", dir: "portfolio/demos", entrada: "socialworks.html", frase: "Calendário de posts, automações e caixa de entrada do Instagram." },
  "rhworks.lldworks.com.br": { slug: "rhworks", nome: "RHWorks", cor: "#A16207", dir: "rhworks", entrada: "index.html", frase: "Triagem de currículos com IA: ranking, parecer e roteiro de entrevista.", api: true },
};
// Rotas do antigo endereço do Crivo que continuam no Worker "crivo" (IA na nuvem, versão para instalar e vídeo).
const CRIVO_ROTAS = /^\/(api\/|Crivo\.zip$|INICIAR-CRIVO\.bat$|CONECTAR-LLAMA\.bat$|video\/|lib\/|marca\/)/;
const ICONES = {"agentworks": "<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 64 64\"><rect width=\"64\" height=\"64\" rx=\"16\" fill=\"#0E9F6E\"/><rect x=\"2\" y=\"2\" width=\"60\" height=\"60\" rx=\"14\" fill=\"none\" stroke=\"#ffffff\" stroke-opacity=\".18\" stroke-width=\"2\"/><path fill=\"none\" stroke=\"#fff\" stroke-width=\"4\" stroke-linecap=\"round\" stroke-linejoin=\"round\" d=\"M16 20h32a4 4 0 0 1 4 4v16a4 4 0 0 1-4 4H30l-9 7v-7h-5a4 4 0 0 1-4-4V24a4 4 0 0 1 4-4z\"/><circle cx=\"24\" cy=\"32\" r=\"2.6\" fill=\"#fff\"/><circle cx=\"32\" cy=\"32\" r=\"2.6\" fill=\"#fff\"/><circle cx=\"40\" cy=\"32\" r=\"2.6\" fill=\"#fff\"/></svg>", "salesworks": "<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 64 64\"><rect width=\"64\" height=\"64\" rx=\"16\" fill=\"#EA580C\"/><rect x=\"2\" y=\"2\" width=\"60\" height=\"60\" rx=\"14\" fill=\"none\" stroke=\"#ffffff\" stroke-opacity=\".18\" stroke-width=\"2\"/><path fill=\"none\" stroke=\"#fff\" stroke-width=\"4\" stroke-linecap=\"round\" stroke-linejoin=\"round\" d=\"M17 24h30l-2.5 24a3 3 0 0 1-3 2.7H22.5a3 3 0 0 1-3-2.7z\"/><path fill=\"none\" stroke=\"#fff\" stroke-width=\"4\" stroke-linecap=\"round\" stroke-linejoin=\"round\" d=\"M25 28v-6a7 7 0 0 1 14 0v6\"/></svg>", "serviceworks": "<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 64 64\"><rect width=\"64\" height=\"64\" rx=\"16\" fill=\"#7C3AED\"/><rect x=\"2\" y=\"2\" width=\"60\" height=\"60\" rx=\"14\" fill=\"none\" stroke=\"#ffffff\" stroke-opacity=\".18\" stroke-width=\"2\"/><rect fill=\"none\" stroke=\"#fff\" stroke-width=\"4\" stroke-linecap=\"round\" stroke-linejoin=\"round\" x=\"14\" y=\"17\" width=\"36\" height=\"33\" rx=\"5\"/><path fill=\"none\" stroke=\"#fff\" stroke-width=\"4\" stroke-linecap=\"round\" stroke-linejoin=\"round\" d=\"M14 27h36M23 13v8M41 13v8\"/><path fill=\"none\" stroke=\"#fff\" stroke-width=\"4\" stroke-linecap=\"round\" stroke-linejoin=\"round\" d=\"M25 38l5 5 9-10\"/></svg>", "linkworks": "<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 64 64\"><rect width=\"64\" height=\"64\" rx=\"16\" fill=\"#DB2777\"/><rect x=\"2\" y=\"2\" width=\"60\" height=\"60\" rx=\"14\" fill=\"none\" stroke=\"#ffffff\" stroke-opacity=\".18\" stroke-width=\"2\"/><path fill=\"none\" stroke=\"#fff\" stroke-width=\"4\" stroke-linecap=\"round\" stroke-linejoin=\"round\" d=\"M29 35a8 8 0 0 0 11.3 0l6-6a8 8 0 0 0-11.3-11.3l-2.5 2.5\"/><path fill=\"none\" stroke=\"#fff\" stroke-width=\"4\" stroke-linecap=\"round\" stroke-linejoin=\"round\" d=\"M35 29a8 8 0 0 0-11.3 0l-6 6a8 8 0 0 0 11.3 11.3l2.5-2.5\"/></svg>", "socialworks": "<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 64 64\"><rect width=\"64\" height=\"64\" rx=\"16\" fill=\"#DC2626\"/><rect x=\"2\" y=\"2\" width=\"60\" height=\"60\" rx=\"14\" fill=\"none\" stroke=\"#ffffff\" stroke-opacity=\".18\" stroke-width=\"2\"/><rect fill=\"none\" stroke=\"#fff\" stroke-width=\"4\" stroke-linecap=\"round\" stroke-linejoin=\"round\" x=\"14\" y=\"14\" width=\"36\" height=\"36\" rx=\"10\"/><path d=\"M28 24.5v15l12-7.5z\" fill=\"#fff\"/><circle cx=\"43.5\" cy=\"20.5\" r=\"2.2\" fill=\"#fff\"/></svg>", "rhworks": "<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 64 64\"><rect width=\"64\" height=\"64\" rx=\"16\" fill=\"#A16207\"/><rect x=\"2\" y=\"2\" width=\"60\" height=\"60\" rx=\"14\" fill=\"none\" stroke=\"#ffffff\" stroke-opacity=\".18\" stroke-width=\"2\"/><circle fill=\"none\" stroke=\"#fff\" stroke-width=\"4\" stroke-linecap=\"round\" stroke-linejoin=\"round\" cx=\"25\" cy=\"25\" r=\"6.5\"/><circle fill=\"none\" stroke=\"#fff\" stroke-width=\"4\" stroke-linecap=\"round\" stroke-linejoin=\"round\" cx=\"41\" cy=\"27\" r=\"5\"/><path fill=\"none\" stroke=\"#fff\" stroke-width=\"4\" stroke-linecap=\"round\" stroke-linejoin=\"round\" d=\"M13 48c1.5-7 6-10.5 12-10.5S35.5 41 37 48\"/><path fill=\"none\" stroke=\"#fff\" stroke-width=\"4\" stroke-linecap=\"round\" stroke-linejoin=\"round\" d=\"M38 38.5c5.5 0 9.5 3 11 9.5\"/></svg>"};
const SEG = {
  "Strict-Transport-Security": "max-age=31536000; includeSubDomains",
  "X-Content-Type-Options": "nosniff",
  "Referrer-Policy": "strict-origin-when-cross-origin",
  "Permissions-Policy": "camera=(), microphone=(), geolocation=()",
  "X-Frame-Options": "SAMEORIGIN",
};
const APPS = [
  { n: "Portfólio LLD Works", u: "https://produtos.lldworks.com.br/", cli: "https://produtos.lldworks.com.br/", emp: null, lld: null },
  { n: "AgentWorks · demo", u: "https://agentworks.lldworks.com.br/entrar", cli: null, emp: "https://agentworks.lldworks.com.br/", lld: null },
  { n: "AgentWorks · sistema real", u: "https://atende.lldworks.com.br/painel", cli: "WhatsApp da empresa", emp: "https://atende.lldworks.com.br/painel", lld: "https://atende.lldworks.com.br/painel", pc: true },
  { n: "Gateway WhatsApp (WA-AKG)", u: "https://wa.lldworks.com.br/", cli: null, emp: null, lld: "https://wa.lldworks.com.br/", pc: true },
  { n: "RHWorks · triagem com IA", u: "https://rhworks.lldworks.com.br/entrar", cli: null, emp: "https://rhworks.lldworks.com.br/", lld: null },
  { n: "SalesWorks · demo Feira Viva", u: "https://salesworks.lldworks.com.br/entrar", cli: null, emp: "https://salesworks.lldworks.com.br/", lld: null },
  { n: "ServiceWorks · demo", u: "https://serviceworks.lldworks.com.br/entrar", cli: null, emp: "https://serviceworks.lldworks.com.br/", lld: null },
  { n: "LinkWorks · demo", u: "https://linkworks.lldworks.com.br/entrar", cli: null, emp: "https://linkworks.lldworks.com.br/", lld: null },
  { n: "SocialWorks · demo", u: "https://socialworks.lldworks.com.br/entrar", cli: null, emp: "https://socialworks.lldworks.com.br/", lld: null },
  { n: "PageWorks · Clínica Vértice", u: "https://clinica.lldworks.com.br/", cli: "https://clinica.lldworks.com.br/", emp: null, lld: null },
  { n: "PageWorks · Araucária Imóveis", u: "https://imobiliaria.lldworks.com.br/", cli: "https://imobiliaria.lldworks.com.br/", emp: null, lld: null },
  { n: "ProWorks · Lucas L. Diogo", u: "https://lucasldiogo.lldworks.com.br/", cli: "https://lucasldiogo.lldworks.com.br/", emp: null, lld: null },
  { n: "Rancho Flores (cliente)", u: "https://ranchofloresloja.com/", cli: "https://ranchofloresloja.com/loja", emp: "https://ranchofloresloja.com/admin/login", lld: null },
];

const enc = new TextEncoder();
const b64u = (buf) => btoa(String.fromCharCode(...new Uint8Array(buf))).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
const ub64u = (s) => Uint8Array.from(atob(s.replace(/-/g, "+").replace(/_/g, "/").padEnd(Math.ceil(s.length / 4) * 4, "=")), (c) => c.charCodeAt(0));
const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
function igual(a, b) { if (a.length !== b.length) return false; let d = 0; for (let i = 0; i < a.length; i++) d |= a[i] ^ b[i]; return d === 0; }

// ---------- Console: Cloudflare Access (JWT RS256 conferido no servidor) ----------
let CERTS = { at: 0, keys: [] };
async function accessOk(req, env) {
  if (!env.ACCESS_TEAM || !env.ACCESS_AUD) return false;
  const jwt = req.headers.get("Cf-Access-Jwt-Assertion");
  if (!jwt) return false;
  const [h, p, sig] = jwt.split(".");
  if (!h || !p || !sig) return false;
  let head, pay;
  try { head = JSON.parse(new TextDecoder().decode(ub64u(h))); pay = JSON.parse(new TextDecoder().decode(ub64u(p))); } catch { return false; }
  const now = Date.now() / 1000;
  const aud = Array.isArray(pay.aud) ? pay.aud : [pay.aud];
  if (head.alg !== "RS256" || !aud.includes(env.ACCESS_AUD) || pay.exp < now || pay.iss !== `https://${env.ACCESS_TEAM}.cloudflareaccess.com`) return false;
  if (Date.now() - CERTS.at > 3600e3) {
    const r = await fetch(`https://${env.ACCESS_TEAM}.cloudflareaccess.com/cdn-cgi/access/certs`);
    CERTS = { at: Date.now(), keys: (await r.json()).keys || [] };
  }
  const jwk = CERTS.keys.find((k) => k.kid === head.kid);
  if (!jwk) return false;
  const key = await crypto.subtle.importKey("jwk", jwk, { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" }, false, ["verify"]);
  return crypto.subtle.verify("RSASSA-PKCS1-v1_5", key, ub64u(sig), enc.encode(h + "." + p));
}

// ---------- Login dos produtos ----------
// DEMO_USERS (secret): JSON [{ "e": "email", "h": "pbkdf2$iter$salt_b64u$hash_b64u", "apps": "*" | ["rhworks", ...] }]
// SESSION_KEY (secret): chave HMAC das sessões. Senha nunca fica no código nem no navegador.
const SESSAO_H = 8;
const TENTATIVAS = new Map();
async function hmac(env, data) {
  const k = await crypto.subtle.importKey("raw", enc.encode(env.SESSION_KEY), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  return b64u(await crypto.subtle.sign("HMAC", k, enc.encode(data)));
}
async function senhaOk(registro, senha) {
  const [alg, it, salt, hash] = String(registro).split("$");
  if (alg !== "pbkdf2") return false;
  const base = await crypto.subtle.importKey("raw", enc.encode(senha), "PBKDF2", false, ["deriveBits"]);
  const bits = await crypto.subtle.deriveBits({ name: "PBKDF2", hash: "SHA-256", salt: ub64u(salt), iterations: +it }, base, 256);
  return igual(new Uint8Array(bits), ub64u(hash));
}
function usuarios(env) { try { return JSON.parse(env.DEMO_USERS || "[]"); } catch { return []; } }
function cookie(req, nome) { const m = (req.headers.get("Cookie") || "").match(new RegExp("(?:^|;\\s*)" + nome + "=([^;]+)")); return m ? m[1] : null; }
async function sessao(req, env, p) {
  if (!env.SESSION_KEY) return null;
  const c = cookie(req, "lw_s");
  if (!c) return null;
  const [dados, sig] = c.split(".");
  if (!dados || !sig || !igual(enc.encode(sig), enc.encode(await hmac(env, dados)))) return null;
  let s; try { s = JSON.parse(new TextDecoder().decode(ub64u(dados))); } catch { return null; }
  if (s.p !== p.slug || s.x < Date.now() / 1000) return null;
  return s;
}
function telaLogin(p, erro = "", email = "") {
  const ic = ICONES[p.slug] || "";
  const [pre] = p.nome.split("Works");
  return `<!DOCTYPE html><html lang="pt-BR"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex">
<title>Entrar · ${p.nome}</title><link rel="icon" href="data:image/svg+xml,${encodeURIComponent(ic)}"><style>
:root{--p:${p.cor}}*{box-sizing:border-box}body{margin:0;min-height:100vh;display:grid;grid-template-columns:minmax(0,1.05fr) minmax(0,1fr);font:16px/1.55 Inter,system-ui,-apple-system,"Segoe UI",sans-serif;color:#0F172A;background:#fff}
.art{position:relative;overflow:hidden;background:#0B1020;color:#fff;padding:48px clamp(28px,5vw,72px);display:flex;flex-direction:column;justify-content:space-between;gap:40px}
.art:before{content:"";position:absolute;inset:-30% -20% auto auto;width:620px;height:620px;border-radius:50%;background:radial-gradient(circle,var(--p) 0,transparent 62%);opacity:.55}
.art:after{content:"";position:absolute;inset:auto auto -35% -25%;width:520px;height:520px;border-radius:50%;background:radial-gradient(circle,var(--p) 0,transparent 65%);opacity:.25}
.art>*{position:relative;z-index:1}.brand{display:flex;align-items:center;gap:12px;font:500 26px/1 Montserrat,Inter,sans-serif;letter-spacing:-.01em}.brand svg{width:44px;height:44px}.brand b{font-weight:800}
h1{font:800 clamp(30px,3.4vw,44px)/1.1 Montserrat,Inter,sans-serif;margin:0 0 14px;letter-spacing:-.02em}.art p{color:#C7CEE0;max-width:46ch;margin:0}.lld{font-size:13px;color:#8C96B3}
.frm{display:grid;place-items:center;padding:40px 24px}form{width:min(400px,100%)}h2{font:800 26px/1.2 Montserrat,Inter,sans-serif;margin:0 0 6px}.mute{color:#5B6478;font-size:14.5px;margin:0 0 22px}
label{display:block;font-weight:600;font-size:14px;margin:14px 0 6px}input{width:100%;min-height:50px;border:1.5px solid #D9DEE8;border-radius:12px;padding:12px 14px;font-size:16px;font-family:inherit;transition:border-color .15s,box-shadow .15s}
input:focus{outline:none;border-color:var(--p);box-shadow:0 0 0 4px color-mix(in srgb,var(--p) 18%,transparent)}button{margin-top:20px;width:100%;min-height:52px;border:0;border-radius:12px;background:var(--p);color:#fff;font:700 16px Inter,sans-serif;cursor:pointer;transition:filter .15s,transform .15s}
button:hover{filter:brightness(1.08)}button:active{transform:translateY(1px)}.err{color:#C0262D;font-size:14px;min-height:21px;margin:10px 0 0}.chips{display:flex;flex-wrap:wrap;gap:8px;margin-top:22px}
.chips span{font-size:12.5px;background:#F2F4F8;color:#475069;border-radius:99px;padding:4px 10px}.demo{margin-top:18px;padding:12px 14px;border-radius:12px;background:color-mix(in srgb,var(--p) 8%,#fff);border:1px solid color-mix(in srgb,var(--p) 25%,#fff);font-size:13.5px;color:#334}
@media(max-width:860px){body{grid-template-columns:1fr}.art{padding:32px 24px;gap:22px}.art:after{display:none}}
@media(prefers-reduced-motion:no-preference){.frm form,.art>*{animation:sobe .6s cubic-bezier(.2,.7,.2,1) both}.art>*:nth-child(2){animation-delay:.08s}.art>*:nth-child(3){animation-delay:.16s}@keyframes sobe{from{opacity:0;transform:translateY(14px)}}}
</style></head><body>
<section class="art"><div class="brand">${ic}<span>${pre}<b>Works</b></span></div>
<div><h1>Entrar no ${esc(p.nome)}</h1><p>${esc(p.frase)}</p></div><p class="lld">Uma solução LLD Works · lldworks.com.br</p></section>
<main class="frm"><form method="post" action="/entrar" autocomplete="on">
<h2>Acesse sua conta</h2><p class="mute">Use o e-mail e a senha que a LLD Works enviou para você.</p>
<label for="email">E-mail</label><input id="email" name="email" type="email" autocomplete="username" required value="${esc(email)}" autofocus>
<label for="senha">Senha</label><input id="senha" name="senha" type="password" autocomplete="current-password" required minlength="8">
<p class="err" role="alert">${esc(erro)}</p><button type="submit">Entrar</button>
<div class="chips"><span>Senha conferida no servidor</span><span>Sessão de ${SESSAO_H} h</span><span>Conexão protegida (HTTPS)</span></div>
<p class="demo">Ambiente de demonstração com dados fictícios.</p></form></main></body></html>`;
}
async function entrar(req, env, url, p) {
  if (req.headers.get("Origin") && req.headers.get("Origin") !== url.origin) return new Response("Origem inválida", { status: 403 });
  const ip = req.headers.get("CF-Connecting-IP") || "?";
  const t = TENTATIVAS.get(ip) || { n: 0, at: Date.now() };
  if (Date.now() - t.at > 15 * 60e3) { t.n = 0; t.at = Date.now(); }
  if (t.n >= 8) return html(telaLogin(p, "Muitas tentativas. Aguarde 15 minutos e tente de novo."), 429);
  let f; try { f = await req.formData(); } catch { return html(telaLogin(p, "Envie o formulário de novo."), 400); }
  const email = String(f.get("email") || "").trim().toLowerCase().slice(0, 200), senha = String(f.get("senha") || "").slice(0, 200);
  const u = usuarios(env).find((x) => x.e === email && (x.apps === "*" || (x.apps || []).includes(p.slug)));
  const ok = !!u && !!env.SESSION_KEY && (await senhaOk(u.h, senha));
  if (!ok) {
    t.n++; TENTATIVAS.set(ip, t);
    await new Promise((r) => setTimeout(r, 400));
    return html(telaLogin(p, "E-mail ou senha incorretos.", email), 401);
  }
  TENTATIVAS.delete(ip);
  const dados = b64u(enc.encode(JSON.stringify({ e: email, p: p.slug, x: Math.floor(Date.now() / 1000) + SESSAO_H * 3600 })));
  const valor = dados + "." + (await hmac(env, dados));
  return new Response(null, { status: 303, headers: { Location: "/", "Cache-Control": "no-store", "Set-Cookie": `lw_s=${valor}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${SESSAO_H * 3600}`, ...SEG } });
}
function sair() {
  return new Response(null, { status: 303, headers: { Location: "/entrar", "Cache-Control": "no-store", "Set-Cookie": "lw_s=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0", ...SEG } });
}
async function produto(req, env, url, p) {
  const path = url.pathname;
  if (path === "/entrar") return req.method === "POST" ? entrar(req, env, url, p) : html(telaLogin(p));
  if (path === "/sair") return sair();
  const s = await sessao(req, env, p);
  if (!s) return path.startsWith("/api/") ? new Response('{"erro":"login"}', { status: 401, headers: { "Content-Type": "application/json" } }) : Response.redirect(url.origin + "/entrar", 302);
  if (p.api && CRIVO_ROTAS.test(path) && !path.startsWith("/lib/")) {
    if (!env.CRIVO) return new Response("Serviço indisponível", { status: 503 });
    return env.CRIVO.fetch(new Request("https://crivo.lldworks.com.br" + path + url.search, req));
  }
  if (req.method !== "GET" && req.method !== "HEAD") return new Response("Método não permitido", { status: 405 });
  if (path.includes("..")) return new Response("Inválido", { status: 400 });
  const arq = path === "/" || path === "/index.html" ? "/" + p.entrada : path;
  const r = await origem(req, p.dir + arq, arq === "/" + p.entrada ? 0 : 300);
  if (arq !== "/" + p.entrada || r.status !== 200) return r;
  // Página principal: avisa o app que o login já foi feito no servidor e põe o botão Sair.
  const marca = `<script>window.LW_AUTH=${JSON.stringify({ email: s.e })}</script>`;
  const barra = p.slug === "rhworks" ? `<a href="/sair" style="position:fixed;right:14px;bottom:14px;z-index:50;background:#16141D;color:#fff;font:600 13px Inter,sans-serif;padding:8px 14px;border-radius:99px;text-decoration:none;box-shadow:0 6px 20px rgba(0,0,0,.2)">Sair · ${esc(s.e)}</a>` : "";
  const corpo = (await r.text()).replace("</head>", marca + "</head>").replace("</body>", barra + "</body>");
  const h = new Headers(r.headers); h.set("Cache-Control", "no-store"); h.delete("Content-Length");
  return new Response(corpo, { status: 200, headers: h });
}

// ---------- Conteúdo estático (GitHub Pages em /works/) ----------
async function origem(req, caminho, ttl = 300) {
  const range = req.headers.get("Range");
  const r = await fetch(ORIGEM + caminho, { headers: range ? { Range: range } : {}, cf: ttl ? { cacheTtl: ttl, cacheEverything: true } : { cacheTtl: 0 } });
  if (r.status === 404) return new Response("Página não encontrada", { status: 404, headers: { "Content-Type": "text/plain; charset=utf-8" } });
  const h = new Headers(r.headers);
  for (const [k, v] of Object.entries(SEG)) h.set(k, v);
  for (const k of ["x-github-request-id", "via", "x-served-by", "x-fastly-request-id", "x-proxy-cache", "x-cache", "x-cache-hits", "x-timer"]) h.delete(k);
  return new Response(r.body, { status: r.status, headers: h });
}
function html(body, status = 200, extra = {}) {
  return new Response(body, { status, headers: { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "no-store", "Content-Security-Policy": "default-src 'self'; style-src 'self' 'unsafe-inline'; script-src 'self' 'unsafe-inline'; img-src 'self' data:; form-action 'self'; frame-ancestors 'none'", ...SEG, ...extra } });
}

// ---------- Console central ----------
const CSS = `:root{--co:#1240E0;--ink:#0B1020;--mute:#566079;--line:#E3E7F0;--bg:#F3F5FA}*{box-sizing:border-box}body{margin:0;font:15px/1.55 Inter,system-ui,sans-serif;background:var(--bg);color:var(--ink)}
h1,h2{margin:0}a{color:var(--co)}.top{background:#0B1020;color:#fff;padding:14px max(4vw,16px);display:flex;align-items:center;gap:14px}
.top b{font-weight:800;font-size:19px}.top b i{font-style:normal;color:#7C9BFF}.top span{opacity:.7;font-size:13px}
main{max-width:1240px;margin:0 auto;padding:24px max(4vw,16px) 60px}table{width:100%;border-collapse:collapse;background:#fff;border-radius:14px;overflow:hidden;margin-top:14px}
th,td{padding:12px 14px;border-bottom:1px solid var(--line);text-align:left;font-size:14px;vertical-align:top}th{background:#EEF1F8;color:var(--mute);font-size:12.5px}
.st{display:inline-block;padding:3px 10px;border-radius:99px;font-weight:700;font-size:12px;background:#EEF1F8;color:var(--mute);white-space:nowrap}.st.ok{background:#E3F6EC;color:#0E7A50}.st.bad{background:#FDECEC;color:#C02626}
.btn{border:0;background:var(--co);color:#fff;font-weight:700;border-radius:10px;padding:10px 16px;cursor:pointer;font-size:15px}.card{background:#fff;border-radius:16px;padding:22px;border:1px solid var(--line)}
.grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(260px,1fr));gap:14px;margin-top:18px}
.pc{color:#B45309;font-size:12px;font-weight:600}@media(max-width:700px){td:nth-child(3),th:nth-child(3){display:none}}`;
function trancado() {
  return `<!DOCTYPE html><html lang="pt-BR"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex"><title>Console LLD Works</title><style>${CSS}</style></head>
<body><div class="top"><b>LLD <i>Works</i></b><span>Console central</span></div><main style="max-width:520px"><div class="card" style="margin-top:40px"><h1 style="font-size:22px">Acesso restrito</h1>
<p style="color:var(--mute)">Este console abre somente para o responsável pela LLD Works, depois da verificação por código enviado ao e-mail autorizado (Cloudflare Access).</p></div></main></body></html>`;
}
function consolePage() {
  const linha = (a, i) => `<tr><td><b>${a.n}</b>${a.pc ? '<br><span class="pc">roda no PC do Lucas (Docker + túnel)</span>' : ""}</td><td><span class="st" id="s${i}">verificando…</span></td>
<td>${a.cli ? (a.cli.startsWith("http") ? `<a href="${a.cli}" target="_blank" rel="noopener">abrir</a>` : a.cli) : "—"}</td><td>${a.emp ? `<a href="${a.emp}" target="_blank" rel="noopener">painel</a>` : "—"}</td><td>${a.lld ? `<a href="${a.lld}" target="_blank" rel="noopener">admin</a>` : "—"}</td></tr>`;
  return `<!DOCTYPE html><html lang="pt-BR"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex"><title>Console LLD Works</title><style>${CSS}</style></head>
<body><div class="top"><b>LLD <i>Works</i></b><span>Console central · todas as aplicações</span><a class="btn" style="background:#2A3350;text-decoration:none;margin-left:auto" href="/cdn-cgi/access/logout">Sair</a></div><main>
<h1 style="font-size:26px">Aplicações</h1><p style="color:var(--mute)">Status verificado agora pelo servidor. Cliente = o que o consumidor final usa; Empresa = painel do estabelecimento; LLD = administração da LLD Works.</p>
<table><thead><tr><th>Aplicação</th><th>Status</th><th>Cliente</th><th>Empresa</th><th>LLD</th></tr></thead><tbody>${APPS.map(linha).join("")}</tbody></table>
<div class="grid"><div class="card"><h2 style="font-size:17px">Infraestrutura</h2><p><a href="https://dash.cloudflare.com/" target="_blank" rel="noopener">Cloudflare</a> · <a href="https://github.com/LucasLDiogo" target="_blank" rel="noopener">GitHub</a> · <a href="https://supabase.com/dashboard" target="_blank" rel="noopener">Supabase</a></p></div>
<div class="card"><h2 style="font-size:17px">Segurança</h2><p style="color:var(--mute);margin:6px 0 0">Console: Cloudflare Access com código no e-mail autorizado. Produtos: senha conferida no servidor (PBKDF2) e sessão assinada (HMAC) de ${SESSAO_H} h.</p></div></div>
</main><script>fetch('/api/status').then(r=>r.json()).then(l=>l.forEach((s,i)=>{const e=document.getElementById('s'+i);e.textContent=s.ok?('no ar · '+s.ms+' ms'):('fora · '+(s.code||'sem resposta'));e.className='st '+(s.ok?'ok':'bad')})).catch(()=>{})</script></body></html>`;
}
async function consoleApp(req, env, url) {
  if (!(await accessOk(req, env))) return url.pathname.startsWith("/api/") ? new Response("{}", { status: 401 }) : html(trancado(), 403);
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
    const host = url.hostname.replace(/\.$/, "");
    if (host !== url.hostname) return Response.redirect("https://" + host + url.pathname + url.search, 301);
    if (host === "console.lldworks.com.br") return consoleApp(req, env, url);
    if (host === "rancho.lldworks.com.br") return Response.redirect("https://ranchofloresloja.com/", 302);
    if (host === "crivo.lldworks.com.br") {
      // Endereço antigo: a IA e os arquivos da versão para instalar seguem no Worker "crivo"; o site foi para o RHWorks.
      if (CRIVO_ROTAS.test(url.pathname) && env.CRIVO) return env.CRIVO.fetch(req);
      return Response.redirect("https://rhworks.lldworks.com.br/", 301);
    }
    if (PRODUTOS[host]) return produto(req, env, url, PRODUTOS[host]);
    if (ALIASES[host]) return Response.redirect(ALIASES[host], 302);
    const dir = SITES[host];
    if (!dir) return new Response("Não encontrado", { status: 404 });
    if (req.method !== "GET" && req.method !== "HEAD") return new Response("Método não permitido", { status: 405 });
    let path = url.pathname;
    if (path.includes("..")) return new Response("Inválido", { status: 400 });
    if (path.endsWith("/")) path += "index.html";
    return origem(req, dir + path);
  },
};
