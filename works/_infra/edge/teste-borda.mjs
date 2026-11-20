import { Miniflare } from "miniflare";
import fs from "node:fs";
const wrapper = fs.readFileSync("./edge-wrapper.js","utf8");
const { aplicarRouter } = (await import("./patch-router.js")).default;
// Base falsa com os mesmos trechos do roteador no ar
const base = `
var M = new Map();
async function B(e, s, r) {
  if (!e.HUB || !r) return { liberada: true };
  let t = \`\${s.slug}:\${r}\`, a = M.get(t);
  if (a && a.ate > Date.now()) return a.v;
  let o = { liberada: true };
  try {
    let n = await e.HUB.fetch(\`https://hub.interno/interno/assinatura?produto=\${s.slug}&cliente=\${r}\`);
    if (n.ok) {
      let d = await n.json();
      o = d && typeof d == "object" ? d : { liberada: false };
    }
  } catch {
  }
  return M.set(t, { v: o, ate: Date.now() + 6e4 }), M.size > 5e3 && M.clear(), o;
}
var W = new Map(); function R(x,s){return new Response(x,{status:s})} function A(t,m){return m}
async function ent(e,s,t){ let a="1.2.3.4", o={n:0}, d="x@y", i="s", l=await (await s.HUB.fetch("https://hub.interno/interno/login",{method:"POST", body: JSON.stringify({ produto: t.slug, email: d, senha: i })})).json();
  if (!l.ok) {
    if (o.n++, W.set(a, o), await new Promise((h) => setTimeout(h, 400)), l.motivo === "sem_senha") return R(A(t, "sem"), 403);
    return R("cred",401);
  } return R("ok",200); }
var __lwMe = { async fetch(req, env) { const u = new URL(req.url);
  if (u.pathname==="/ok") return new Response("<html><body><h1>oi</h1></body></html>",{headers:{"Content-Type":"text/html; charset=utf-8"}});
  if (u.pathname==="/csp") return new Response("<html><body>x</body></html>",{headers:{"Content-Type":"text/html","Content-Security-Policy":"default-src 'self'; script-src 'self'; connect-src 'self'"}});
  if (u.pathname==="/nf") return new Response("Página não encontrada",{status:404,headers:{"Content-Type":"text/plain; charset=utf-8"}});
  if (u.pathname==="/api/x") return new Response('{"erro":1}',{status:404,headers:{"Content-Type":"application/json"}});
  if (u.pathname==="/boom") throw new Error("falhou");
  if (u.pathname==="/assin") return Response.json(await B(env,{slug:"serviceworks"},7));
  if (u.pathname==="/login") return ent(req,env,{slug:"serviceworks"});
  return new Response("base:"+u.pathname,{headers:{"Content-Type":"text/plain"}});
}};
export {
  __lwMe as default
};
`;
const code = aplicarRouter(base, wrapper);
let hubModo = "ok";
const mf = new Miniflare({ modules: true, script: code, compatibilityDate: "2026-08-01",
  serviceBindings: { HUB: async (req) => { const u = new URL(req.url);
    if (u.pathname==="/interno/usuario") return Response.json(u.searchParams.get("email")==="bloq@x.com"?{existe:true,ativo:false}:{existe:true,ativo:true});
    if (u.pathname==="/interno/assinatura") { if (hubModo==="fora") throw new Error("down"); if (hubModo==="500") return new Response("x",{status:500}); return Response.json({liberada:true, plano:"Pro"}); }
    if (u.pathname==="/interno/login") { const b = await req.json(); return Response.json(b.ip==="1.2.3.4"?{ok:false,motivo:"freio"}:{ok:false}); }
    return new Response("?",{status:404}); } },
  outboundService: async (req) => new Response("/*tour*/ console.log(1)", {headers:{"Content-Type":"text/plain"}}) });
const H = { headers: { Accept: "text/html" } };
const ck = (e) => { const p = Buffer.from(JSON.stringify({e, p:"serviceworks", c:7, x: 9e9})).toString("base64url"); return { headers: { Accept:"text/html", Cookie: `lw_s=${p}.assin` }, redirect:"manual" }; };
const t = [];
const ok = (n, c) => { t.push([c?"OK ":"FALHOU", n]); };
let r;
r = await mf.dispatchFetch("https://serviceworks.lldworks.com.br/robots.txt"); let s = await r.text(); ok("robots produto", r.status===200 && s.includes("Sitemap: https://serviceworks.lldworks.com.br/sitemap.xml") && s.includes("Disallow: /app"));
r = await mf.dispatchFetch("https://serviceworks-demo.lldworks.com.br/robots.txt"); s = await r.text(); ok("robots demo bloqueia", s.includes("Disallow: /\n"));
r = await mf.dispatchFetch("https://salesworks.lldworks.com.br/sitemap.xml"); s = await r.text(); ok("sitemap", r.headers.get("content-type").includes("xml") && s.includes("<loc>https://salesworks.lldworks.com.br/assinar</loc>"));
r = await mf.dispatchFetch("https://loja-x.lldworks.com.br/robots.txt"); s = await r.text(); ok("robots loja vai para o roteador", s==="base:/robots.txt");
r = await mf.dispatchFetch("https://serviceworks.lldworks.com.br/nf", H); s = await r.text(); ok("404 com marca", r.status===404 && s.includes("ServiceWorks") && s.includes("#7C3AED") && s.includes("noindex"));
r = await mf.dispatchFetch("https://serviceworks.lldworks.com.br/nf"); s = await r.text(); ok("404 sem html (asset) fica texto", s==="Página não encontrada");
r = await mf.dispatchFetch("https://serviceworks.lldworks.com.br/api/x", H); s = await r.text(); ok("404 json da API intacto", s==='{"erro":1}');
r = await mf.dispatchFetch("https://agentworks.lldworks.com.br/boom", H); s = await r.text(); ok("500 com marca", r.status===500 && s.includes("AgentWorks") && s.includes("Tentar de novo"));
r = await mf.dispatchFetch("https://agentworks.lldworks.com.br/boom"); s = await r.text(); ok("500 json sem html", r.status===500 && s.includes("erro"));
r = await mf.dispatchFetch("https://naoexiste.lldworks.com.br/nf", H); s = await r.text(); ok("404 loja com marca LLD", s.includes("LLD Works"));
r = await mf.dispatchFetch("https://serviceworks.lldworks.com.br/ok", H); ok("CSP mínima adicionada", (r.headers.get("content-security-policy")||"").includes("object-src 'none'") && r.headers.get("x-content-type-options")==="nosniff");
r = await mf.dispatchFetch("https://linkworks.lldworks.com.br/csp", H); ok("CSP existente + insights", r.headers.get("content-security-policy").includes("script-src 'self' https://static.cloudflareinsights.com") && r.headers.get("content-security-policy").includes("connect-src 'self' https://cloudflareinsights.com"));
r = await mf.dispatchFetch("https://serviceworks-demo.lldworks.com.br/ok", H); s = await r.text(); ok("demo recebe tour", s.includes('/_lw/tour.js') && r.headers.get("x-robots-tag")==="noindex");
r = await mf.dispatchFetch("https://serviceworks.lldworks.com.br/ok", H); s = await r.text(); ok("produto não recebe tour", !s.includes('/_lw/tour.js'));
r = await mf.dispatchFetch("https://serviceworks-demo.lldworks.com.br/_lw/tour.js"); s = await r.text(); ok("tour.js servido", r.status===200 && r.headers.get("content-type").includes("javascript") && s.includes("tour"));
r = await mf.dispatchFetch("https://serviceworks.lldworks.com.br/ok", ck("bloq@x.com")); ok("usuário desativado: sessão derrubada", r.status===303 && r.headers.get("location")==="/entrar" && r.headers.get("set-cookie").includes("Max-Age=0"));
r = await mf.dispatchFetch("https://serviceworks.lldworks.com.br/ok", ck("ativo@x.com")); ok("usuário ativo segue", r.status===200);
r = await mf.dispatchFetch("https://serviceworks.lldworks.com.br/assin"); s = await r.json(); ok("assinatura ok", s.liberada===true);
hubModo="fora"; r = await mf.dispatchFetch("https://serviceworks.lldworks.com.br/assin"); s = await r.json(); ok("Hub fora: usa último valor (cache vencido < 6 h)", s.liberada===true);
await mf.dispose();
// sem cache: Hub fora => bloqueia
const mf2 = new Miniflare({ modules: true, script: code, compatibilityDate: "2026-08-01", serviceBindings: { HUB: async (req) => { const u=new URL(req.url); if (u.pathname==="/interno/assinatura") return new Response("x",{status:500}); if (u.pathname==="/interno/login"){const b=await req.json(); return Response.json(b.ip?{ok:false,motivo:"freio"}:{ok:false});} return Response.json({}); } } });
r = await mf2.dispatchFetch("https://serviceworks.lldworks.com.br/assin"); s = await r.json(); ok("Hub com erro e sem cache: NÃO libera", s.liberada===false && s.indisponivel===true);
r = await mf2.dispatchFetch("https://serviceworks.lldworks.com.br/login"); s = await r.text(); ok("login freado pelo Hub => 429", r.status===429 && s.includes("Muitas tentativas"));
await mf2.dispose();
for (const x of t) console.log(x.join(" "));
console.log(t.filter(x=>x[0]==="OK ").length + "/" + t.length);
