// ---------- Camada de borda do roteador (20/11/2026) ----------
// Entra por cima do export do roteador (__lwMe). Não muda nenhuma rota existente; só:
// 1) robots.txt e sitemap.xml próprios em cada produto (antes caíam no login);
// 2) páginas de erro 404/5xx com a marca, no lugar do texto puro;
// 3) demonstração automática: /_lw/tour.js e tour.css + injeção do script nas páginas *-demo;
// 4) cabeçalhos de segurança que faltavam (CSP mínima, nosniff, HSTS) e Cloudflare Web Analytics liberado na CSP;
// 5) sessão revogada na hora quando o usuário é desativado no console (pergunta ao Hub, cache de 60 s).
// Tudo dentro de uma função: nenhum nome colide com os do roteador (ex.: __lwB64 já existe na camada de SSO).
var __lwEdge = (() => {
var __LW_ORIGEM = "https://lucasldiogo.lldworks.com.br/works/";
var __LW_PROD = {
  serviceworks: { n: "ServiceWorks", c: "#7C3AED" },
  salesworks: { n: "SalesWorks", c: "#EA580C" },
  agentworks: { n: "AgentWorks", c: "#0E9F6E" },
  linkworks: { n: "LinkWorks", c: "#DB2777" },
  rhworks: { n: "RHWorks", c: "#A16207" },
  socialworks: { n: "SocialWorks", c: "#DC2626" },
  pageworks: { n: "PageWorks", c: "#2563EB" },
  proworks: { n: "ProWorks", c: "#0891B2" },
};
function __lwHost(url) {
  const h = url.hostname.replace(/\.$/, "");
  const m = h.match(/^([a-z]+?)(-demo)?\.lldworks\.com\.br$/);
  return { host: h, slug: m && __LW_PROD[m[1]] ? m[1] : null, demo: !!(m && m[2] && __LW_PROD[m[1]]) };
}
function __lwEsc(s) { return String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]); }
function __lwErro(status, info) {
  const p = info.slug ? __LW_PROD[info.slug] : { n: "LLD Works", c: "#1240E0" };
  const nf = status === 404, cor = p.c;
  const titulo = nf ? "Essa página não existe (ou mudou de endereço)" : status === 429 ? "Muitas tentativas em pouco tempo" : "Tivemos uma instabilidade rápida";
  const texto = nf
    ? "O link pode estar incompleto ou a página foi movida. Nada se perdeu: volte ao início ou veja os produtos da LLD Works."
    : status === 429 ? "Por segurança, seguramos novas tentativas por alguns minutos. Espere um pouco e tente de novo."
    : "O sistema não respondeu como devia. Seus dados estão seguros. A página tenta de novo sozinha em alguns segundos.";
  const tentar = !nf && status !== 429;
  const body = `<!DOCTYPE html><html lang="pt-BR"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="robots" content="noindex"><title>${status} · ${__lwEsc(titulo)} · ${__lwEsc(p.n)}</title><meta name="theme-color" content="${cor}">
${tentar ? '<meta http-equiv="refresh" content="20">' : ""}
<style>
:root{--p:${cor};--t:#14122A;--m:#5B5870}
*{box-sizing:border-box}html,body{margin:0;height:100%}
body{font:16px/1.6 Inter,system-ui,-apple-system,"Segoe UI",Roboto,sans-serif;color:var(--t);background:#F6F5FB;display:grid;place-items:center;padding:24px;overflow:hidden}
.bg{position:fixed;inset:-20%;background:radial-gradient(40% 40% at 20% 20%,color-mix(in oklab,var(--p) 28%,transparent),transparent 70%),radial-gradient(35% 35% at 85% 80%,color-mix(in oklab,var(--p) 18%,transparent),transparent 70%);filter:blur(10px);animation:f 14s ease-in-out infinite alternate}
@keyframes f{to{transform:translate3d(3%,-2%,0) scale(1.05)}}
.c{position:relative;max-width:560px;width:100%;background:rgba(255,255,255,.86);backdrop-filter:blur(14px);border:1px solid rgba(20,18,42,.07);border-radius:24px;padding:40px 36px;box-shadow:0 30px 80px -40px rgba(20,18,42,.45);text-align:left}
.brand{display:flex;align-items:center;gap:10px;font-weight:800;letter-spacing:-.01em;margin-bottom:26px;color:var(--t);text-decoration:none}
.dot{width:30px;height:30px;border-radius:9px;background:linear-gradient(145deg,var(--p),color-mix(in oklab,var(--p) 60%,#000));position:relative}
.dot:after{content:"";position:absolute;right:-3px;top:-3px;width:9px;height:9px;border-radius:50%;background:#FDE68A;box-shadow:0 0 0 2px #fff}
.code{font:800 76px/1 Sora,Inter,system-ui,sans-serif;letter-spacing:-.05em;background:linear-gradient(120deg,var(--p),color-mix(in oklab,var(--p) 45%,#14122A));-webkit-background-clip:text;background-clip:text;color:transparent;margin:0 0 6px}
h1{font:800 26px/1.2 Sora,Inter,system-ui,sans-serif;letter-spacing:-.02em;margin:0 0 10px}
p{color:var(--m);margin:0 0 24px}
.a{display:flex;flex-wrap:wrap;gap:10px}
.b{display:inline-flex;align-items:center;gap:8px;padding:13px 20px;border-radius:14px;font-weight:700;text-decoration:none;border:0;cursor:pointer;font-size:15px;transition:transform .15s ease,box-shadow .15s ease}
.b1{background:var(--p);color:#fff;box-shadow:0 10px 24px -12px var(--p)}.b2{background:#fff;color:var(--t);border:1px solid rgba(20,18,42,.12)}
.b:hover{transform:translateY(-1px)}.b:focus-visible{outline:3px solid color-mix(in oklab,var(--p) 50%,#fff);outline-offset:2px}
small{display:block;margin-top:22px;color:#8A879C;font-size:12.5px}
@media (prefers-reduced-motion:reduce){.bg{animation:none}.b{transition:none}}
</style></head><body><div class="bg" aria-hidden="true"></div>
<main class="c"><a class="brand" href="/"><span class="dot" aria-hidden="true"></span>${__lwEsc(p.n)}</a>
<div class="code" aria-hidden="true">${status}</div><h1>${__lwEsc(titulo)}</h1><p>${__lwEsc(texto)}</p>
<div class="a">${tentar ? '<a class="b b1" href="">Tentar de novo</a><a class="b b2" href="/">Ir para o início</a>' : '<a class="b b1" href="/">Ir para o início</a><a class="b b2" href="https://produtos.lldworks.com.br/">Conhecer os produtos</a>'}</div>
<small>Código ${status}${info.ray ? " · ref. " + __lwEsc(info.ray) : ""} · LLD Works</small></main></body></html>`;
  return new Response(body, { status, headers: { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "no-store", "X-Robots-Tag": "noindex",
    "Content-Security-Policy": "default-src 'none'; style-src 'unsafe-inline'; img-src data:; base-uri 'none'; form-action 'none'; frame-ancestors 'none'",
    "X-Content-Type-Options": "nosniff", "Referrer-Policy": "strict-origin-when-cross-origin", "Strict-Transport-Security": "max-age=31536000; includeSubDomains" } });
}
function __lwRobots(info) {
  if (info.demo) return "User-agent: *\nDisallow: /\n";
  return `User-agent: *\nAllow: /\nDisallow: /app\nDisallow: /painel\nDisallow: /api/\nDisallow: /entrar\nDisallow: /sair\nDisallow: /recuperar\nDisallow: /conta\nDisallow: /webhook/\nDisallow: /sso\nDisallow: /ir/\n\nSitemap: https://${info.host}/sitemap.xml\n`;
}
function __lwSitemap(info) {
  const hoje = new Date().toISOString().slice(0, 10);
  const urls = [["/", "1.0", "weekly"], ["/assinar", "0.8", "monthly"], ["/termos", "0.3", "yearly"], ["/privacidade", "0.3", "yearly"]];
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.map(([u, pr, f]) => `  <url><loc>https://${info.host}${u}</loc><lastmod>${hoje}</lastmod><changefreq>${f}</changefreq><priority>${pr}</priority></url>`).join("\n")}\n</urlset>\n`;
}
var __LW_CSP_MIN = "base-uri 'self'; object-src 'none'; frame-ancestors 'self' https://*.lldworks.com.br; upgrade-insecure-requests";
function __lwCabecalhos(resp, info) {
  const ct = resp.headers.get("Content-Type") || "";
  if (!ct.includes("text/html")) return resp;
  const h = new Headers(resp.headers);
  const csp = h.get("Content-Security-Policy");
  if (!csp) h.set("Content-Security-Policy", __LW_CSP_MIN);
  else if (/script-src/.test(csp) && !csp.includes("cloudflareinsights")) {
    h.set("Content-Security-Policy", csp.replace(/script-src([^;]*)/, "script-src$1 https://static.cloudflareinsights.com").replace(/connect-src([^;]*)/, "connect-src$1 https://cloudflareinsights.com"));
  }
  if (!h.has("X-Content-Type-Options")) h.set("X-Content-Type-Options", "nosniff");
  if (!h.has("Strict-Transport-Security")) h.set("Strict-Transport-Security", "max-age=31536000; includeSubDomains");
  if (!h.has("Referrer-Policy")) h.set("Referrer-Policy", "strict-origin-when-cross-origin");
  if (info.demo) h.set("X-Robots-Tag", "noindex");
  return new Response(resp.body, { status: resp.status, statusText: resp.statusText, headers: h });
}
async function __lwTourArquivo(nome) {
  const r = await fetch(__LW_ORIGEM + "_tour/" + nome, { cf: { cacheTtl: 300, cacheEverything: true } });
  if (!r.ok) return new Response("", { status: 404 });
  return new Response(r.body, { status: 200, headers: { "Content-Type": nome.endsWith(".css") ? "text/css; charset=utf-8" : "application/javascript; charset=utf-8", "Cache-Control": "public, max-age=300", "X-Content-Type-Options": "nosniff" } });
}
// Sessão: o cookie lw_s é assinado pelo roteador; aqui só lemos quem é para perguntar ao Hub se o usuário
// continua ativo. A assinatura do cookie continua sendo conferida pelo roteador logo em seguida.
var __LW_USU = new Map();
function __lwB64(s) { const b = atob(s.replace(/-/g, "+").replace(/_/g, "/") + "===".slice((s.length + 3) % 4)); return new TextDecoder().decode(Uint8Array.from(b, (c) => c.charCodeAt(0))); }
async function __lwUsuarioAtivo(env, req, info) {
  if (!env.HUB || info.demo) return true;
  const m = (req.headers.get("Cookie") || "").match(/(?:^|;\s*)lw_s=([^;.]+)\./);
  if (!m) return true;
  let s; try { s = JSON.parse(__lwB64(m[1])); } catch { return true; }
  if (!s || s.demo || !s.e || !s.c || !s.p) return true;
  const k = `${s.p}:${s.c}:${s.e}`, c = __LW_USU.get(k);
  if (c && c.ate > Date.now()) return c.v;
  let v = true;
  try { const r = await env.HUB.fetch(`https://hub.interno/interno/usuario?produto=${encodeURIComponent(s.p)}&cliente=${encodeURIComponent(s.c)}&email=${encodeURIComponent(s.e)}`); if (r.ok) { const d = await r.json(); if (d && d.existe && !d.ativo) v = false; } } catch {}
  __LW_USU.set(k, { v, ate: Date.now() + 60e3 }); if (__LW_USU.size > 5000) __LW_USU.clear();
  return v;
}
class __LwInjeta { element(el) { el.append('<link rel="stylesheet" href="/_lw/tour.css"><script src="/_lw/tour.js" defer></script>', { html: true }); } }
return { async fetch(req, env, ctx) {
  const url = new URL(req.url), info = __lwHost(url), leitura = req.method === "GET" || req.method === "HEAD";
  info.ray = req.headers.get("cf-ray") || "";
  try {
    if (leitura && /^\/_lw\/tour\.(js|css)$/.test(url.pathname)) return __lwTourArquivo(url.pathname.slice(5));
    if (info.slug && leitura && url.pathname === "/robots.txt") return new Response(__lwRobots(info), { headers: { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "public, max-age=3600" } });
    if (info.slug && !info.demo && leitura && url.pathname === "/sitemap.xml") return new Response(__lwSitemap(info), { headers: { "Content-Type": "application/xml; charset=utf-8", "Cache-Control": "public, max-age=3600" } });
    if (info.slug && !info.demo && !(await __lwUsuarioAtivo(env, req, info))) {
      return new Response(null, { status: 303, headers: { Location: "/entrar", "Cache-Control": "no-store", "Set-Cookie": "lw_s=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0" } });
    }
  } catch (e) { console.error("borda", e && e.message); }
  let r;
  try { r = await __lwMe.fetch(req, env, ctx); }
  catch (e) {
    console.error("roteador", (e && e.stack) || e);
    return (req.headers.get("Accept") || "").includes("text/html") ? __lwErro(500, info) : new Response(JSON.stringify({ erro: "Erro interno. Tente de novo." }), { status: 500, headers: { "Content-Type": "application/json" } });
  }
  try {
    const ct = r.headers.get("Content-Type") || "", aceitaHtml = (req.headers.get("Accept") || "").includes("text/html");
    if (leitura && aceitaHtml && (r.status === 404 || r.status >= 500) && !ct.includes("json") && !url.pathname.startsWith("/api/")) return __lwErro(r.status === 404 ? 404 : r.status, info);
    r = __lwCabecalhos(r, info);
    if (info.demo && leitura && r.status === 200 && ct.includes("text/html")) r = new HTMLRewriter().on("body", new __LwInjeta()).transform(r);
  } catch (e) { console.error("borda resp", e && e.message); }
  return r;
} };
})();
