// LLD Works — roteador do domínio lldworks.com.br
// Serve o portfólio, os sites e os produtos (conteúdo no GitHub Pages em /works/), com login real por produto,
// O console central agora é o LLD Works Hub (Worker lldworks-hub em console.lldworks.com.br).
const ORIGEM = "https://lucasldiogo.lldworks.com.br/works/";
const SITES = { "produtos.lldworks.com.br": "portfolio", "lldworks.com.br": "portfolio", "www.lldworks.com.br": "portfolio", "clinica.lldworks.com.br": "clinica", "imobiliaria.lldworks.com.br": "imobiliaria", "wellington.lldworks.com.br": "wellington" };
const ALIASES = {
  "pageworks.lldworks.com.br": "https://produtos.lldworks.com.br/#pageworks",
  "proworks.lldworks.com.br": "https://lucasldiogo.lldworks.com.br/",
};
// Produtos com login: cada um no próprio endereço. dir = pasta em /works/, entrada = página principal.
const PRODUTOS = {
  "agentworks.lldworks.com.br": { slug: "agentworks", nome: "AgentWorks", cor: "#0E9F6E", dir: "agentworks", entrada: "index.html", aposLogin: "/painel", frase: "Atendimento com IA no WhatsApp (QR Code ou API oficial): responde, agenda, anota pedidos e chama a equipe." },
  "salesworks.lldworks.com.br": { slug: "salesworks", nome: "SalesWorks", cor: "#EA580C", dir: "salesworks", entrada: "index.html", frase: "Loja online com pedidos no WhatsApp, estoque e CRM de clientes." },
  "serviceworks.lldworks.com.br": { slug: "serviceworks", nome: "ServiceWorks", cor: "#7C3AED", dir: "serviceworks", entrada: "index.html", frase: "Agenda, vitrine de serviços, CRM e assistente para barbearia, salão, clínica e pet shop." },
  "linkworks.lldworks.com.br": { slug: "linkworks", nome: "LinkWorks", cor: "#DB2777", dir: "linkworks", entrada: "index.html", frase: "Link na bio com páginas, estatísticas e proteção." },
  "socialworks.lldworks.com.br": { slug: "socialworks", nome: "SocialWorks", cor: "#DC2626", dir: "socialworks", entrada: "index.html", frase: "Calendário de posts, automações e caixa de entrada do Instagram." },
  "rhworks.lldworks.com.br": { slug: "rhworks", nome: "RHWorks", cor: "#A16207", dir: "rhworks", entrada: "index.html", frase: "Triagem de currículos com IA: ranking, parecer e roteiro de entrevista.", api: true },
};
// Rotas do antigo endereço do Crivo que continuam no Worker "crivo" (IA na nuvem, versão para instalar e vídeo).
const CRIVO_ROTAS = /^\/(api\/|Crivo\.zip$|INICIAR-CRIVO\.bat$|CONECTAR-LLAMA\.bat$|video\/|lib\/|marca\/)/;
const ICONES = __ICONES__;
const SEG = {
  "Strict-Transport-Security": "max-age=31536000; includeSubDomains",
  "X-Content-Type-Options": "nosniff",
  "Referrer-Policy": "strict-origin-when-cross-origin",
  "Permissions-Policy": "camera=(), microphone=(), geolocation=()",
  "X-Frame-Options": "SAMEORIGIN",
};

const enc = new TextEncoder();
const b64u = (buf) => btoa(String.fromCharCode(...new Uint8Array(buf))).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
const ub64u = (s) => Uint8Array.from(atob(s.replace(/-/g, "+").replace(/_/g, "/").padEnd(Math.ceil(s.length / 4) * 4, "=")), (c) => c.charCodeAt(0));
const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
function igual(a, b) { if (a.length !== b.length) return false; let d = 0; for (let i = 0; i < a.length; i++) d |= a[i] ^ b[i]; return d === 0; }

// ---------- Login dos produtos ----------
// Usuários e senhas: LLD Works Hub (binding HUB → /interno/login). SESSION_KEY (secret): chave HMAC das sessões.
// A senha nunca fica no código nem no navegador.
const SESSAO_H = 8;
const TENTATIVAS = new Map();
async function hmac(env, data) {
  const k = await crypto.subtle.importKey("raw", enc.encode(env.SESSION_KEY), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  return b64u(await crypto.subtle.sign("HMAC", k, enc.encode(data)));
}
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
function telaLogin(p, erro = "", email = "", acao = null, logado = null) {
  const ic = ICONES[p.slug] || "";
  const [pre] = p.nome.split("Works");
  const painel = p.aposLogin || (p.slug === "serviceworks" ? "/app" : "/");
  const site = ["agentworks", "serviceworks", "linkworks"].includes(p.slug) ? "/" : `https://produtos.lldworks.com.br/#${p.slug}`;
  const formulario = logado ? `<div class="ja" role="status"><div class="av" aria-hidden="true">${esc((logado.e || "?").slice(0, 1).toUpperCase())}</div>
<h2>Você já está conectado</h2><p class="mute">Entrou como <b>${esc(logado.e)}</b>${logado.cn ? ` · ${esc(logado.cn)}` : ""}.</p>
<a class="btn" href="${esc(painel)}">Continuar para o painel →</a><a class="btn sec" href="/sair">Entrar com outra conta</a></div>`
    : `<form method="post" action="/entrar" autocomplete="on" novalidate>
<h2>Acesse sua conta</h2><p class="mute">Use o e-mail e a senha que você criou no cadastro.</p>
<div class="campo"><label for="email">E-mail</label><input id="email" name="email" type="email" inputmode="email" autocomplete="username" required value="${esc(email)}" ${email ? "" : "autofocus"} aria-describedby="erro"></div>
<div class="campo"><label for="senha">Senha</label><div class="senha"><input id="senha" name="senha" type="password" autocomplete="current-password" required minlength="8" ${email ? "autofocus" : ""} aria-describedby="erro"><button type="button" class="olho" aria-label="Mostrar senha" aria-pressed="false">Mostrar</button></div></div>
<p class="err" id="erro" role="alert" aria-live="assertive">${esc(erro)}${acao ? ` <a href="${esc(acao.href)}">${esc(acao.rot)}</a>` : ""}</p>
<button type="submit" class="btn"><span>Entrar</span></button>
<p class="links"><a href="/recuperar">Esqueci minha senha</a><a href="/recuperar?primeiro=1">Primeiro acesso</a></p>
<p class="demo">Ainda não tem conta? <a href="${p.slug === "agentworks" ? "/#plano" : "/assinar"}"><b>Conheça os planos do ${esc(p.nome)}</b></a>${p.slug === "linkworks" ? `<br>Cliente do ServiceWorks Pro ou Premium? Use o <b>mesmo e-mail e senha</b>.` : ""}</p></form>`;
  return `<!DOCTYPE html><html lang="pt-BR"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex">
<title>Entrar · ${p.nome}</title><meta name="theme-color" content="#070B16"><link rel="icon" href="data:image/svg+xml,${encodeURIComponent(ic)}"><style>
:root{--p:${p.cor};--p2:color-mix(in oklab,var(--p) 55%,#fff);--noite:#070B16}*{box-sizing:border-box}
html,body{height:100%}body{margin:0;min-height:100dvh;display:grid;grid-template-columns:minmax(0,1.1fr) minmax(0,1fr);font:16px/1.55 Inter,system-ui,-apple-system,"Segoe UI",sans-serif;color:#0F172A;background:#fff}
.art{position:relative;overflow:hidden;background:var(--noite);color:#fff;padding:44px clamp(28px,5vw,72px);display:flex;flex-direction:column;justify-content:space-between;gap:36px;min-height:100dvh;isolation:isolate}
.orb{position:absolute;border-radius:50%;filter:blur(8px);z-index:-1;will-change:transform}
.o1{width:640px;height:640px;right:-200px;top:-220px;background:radial-gradient(circle,var(--p) 0,transparent 64%);opacity:.75}
.o2{width:520px;height:520px;left:-200px;bottom:-200px;background:radial-gradient(circle,var(--p2) 0,transparent 66%);opacity:.32}
.o3{width:300px;height:300px;right:12%;bottom:12%;background:radial-gradient(circle,#ffffff 0,transparent 70%);opacity:.08}
.grade{position:absolute;inset:0;z-index:-1;background-image:linear-gradient(rgba(255,255,255,.05) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.05) 1px,transparent 1px);background-size:44px 44px;mask-image:radial-gradient(ellipse at 30% 40%,#000 0,transparent 70%)}
.brand{display:flex;align-items:center;gap:12px;font:500 26px/1 Montserrat,Inter,sans-serif;color:#fff;text-decoration:none}.brand svg{width:46px;height:46px;filter:drop-shadow(0 10px 24px color-mix(in srgb,var(--p) 60%,transparent))}.brand b{font-weight:800}
h1{font:800 clamp(32px,3.6vw,50px)/1.06 Montserrat,Inter,sans-serif;margin:0 0 16px;letter-spacing:-.025em}h1 em{font-style:normal;background:linear-gradient(90deg,#fff,var(--p2));-webkit-background-clip:text;background-clip:text;color:transparent}
.art p{color:#C9D1E4;max-width:46ch;margin:0;font-size:17px}
.lista{list-style:none;padding:0;margin:26px 0 0;display:grid;gap:12px}.lista li{display:flex;gap:12px;align-items:center;color:#E3E9F7;font-size:15.5px}
.lista i{flex:none;width:30px;height:30px;border-radius:9px;display:grid;place-items:center;background:color-mix(in srgb,var(--p) 26%,transparent);border:1px solid color-mix(in srgb,var(--p) 50%,transparent);font-style:normal;font-size:15px}
.rod{display:flex;justify-content:space-between;gap:12px;flex-wrap:wrap;font-size:13px;color:#8F9AB8}.rod a{color:#C9D1E4}
.frm{display:grid;place-items:center;padding:40px 24px;background:radial-gradient(900px 500px at 100% 0,color-mix(in srgb,var(--p) 7%,#fff),#fff 60%)}
form,.ja{width:min(410px,100%)}h2{font:800 28px/1.2 Montserrat,Inter,sans-serif;margin:0 0 6px;letter-spacing:-.01em}.mute{color:#5B6478;font-size:15px;margin:0 0 20px}
.voltar{display:inline-flex;gap:6px;align-items:center;color:#5B6478;font-size:14px;font-weight:600;text-decoration:none;margin-bottom:26px}.voltar:hover{color:var(--p)}
.campo{margin-top:14px}label{display:block;font-weight:700;font-size:14px;margin:0 0 6px}
input{width:100%;min-height:52px;border:1.5px solid #D5DBE7;border-radius:14px;padding:12px 14px;font-size:16px;font-family:inherit;background:#fff;transition:border-color .15s,box-shadow .15s}
input:focus{outline:none;border-color:var(--p);box-shadow:0 0 0 4px color-mix(in srgb,var(--p) 20%,transparent)}input[aria-invalid=true]{border-color:#C0262D}
.senha{position:relative}.senha input{padding-right:96px}.olho{position:absolute;right:8px;top:8px;min-height:36px;padding:0 12px;border:0;border-radius:10px;background:#F1F4F9;color:#33405C;font:600 13px Inter,sans-serif;cursor:pointer}
.olho:focus-visible,.btn:focus-visible,a:focus-visible{outline:3px solid var(--p);outline-offset:3px}
.btn{position:relative;overflow:hidden;margin-top:18px;width:100%;min-height:54px;border:0;border-radius:14px;background:var(--p);color:#fff;font:700 16px Inter,sans-serif;cursor:pointer;display:flex;align-items:center;justify-content:center;gap:8px;text-decoration:none;box-shadow:0 14px 30px -14px var(--p);transition:filter .15s,transform .15s}
.btn:hover{filter:brightness(1.07)}.btn:active{transform:translateY(1px)}.btn.sec{background:#fff;color:#1F2A44;border:1.5px solid #D5DBE7;box-shadow:none;margin-top:10px}
.btn[aria-busy=true] span{opacity:.0}.btn[aria-busy=true]:after{content:"";position:absolute;width:22px;height:22px;border-radius:50%;border:3px solid rgba(255,255,255,.4);border-top-color:#fff;animation:gira .7s linear infinite}@keyframes gira{to{transform:rotate(360deg)}}
.err{color:#B42318;font-size:14px;min-height:21px;margin:10px 0 0}.err:empty{margin:0;min-height:0}.err a{color:var(--p);font-weight:700}
.links{display:flex;justify-content:space-between;gap:10px;margin:20px 0 0;font-size:14.5px;font-weight:600}.links a,.demo a{color:color-mix(in oklab,var(--p) 80%,#000)}
.selos{display:flex;flex-wrap:wrap;gap:8px;margin-top:22px}.selos span{font-size:12.5px;background:#F2F5FA;color:#46526B;border-radius:99px;padding:5px 10px}
.demo{margin-top:16px;padding:12px 14px;border-radius:14px;background:color-mix(in srgb,var(--p) 8%,#fff);border:1px solid color-mix(in srgb,var(--p) 25%,#fff);font-size:14px;color:#334}
.ja{text-align:center}.ja .av{width:64px;height:64px;margin:0 auto 14px;border-radius:50%;display:grid;place-items:center;background:var(--p);color:#fff;font:800 26px Montserrat,sans-serif;box-shadow:0 14px 30px -12px var(--p)}
@media(max-width:900px){body{grid-template-columns:1fr}.art{min-height:auto;padding:28px 22px 32px;gap:20px}.lista,.o3{display:none}.art p{font-size:15.5px}h1{font-size:30px}}
@media(prefers-reduced-motion:reduce){*{animation:none!important;transition:none!important}}
</style></head><body>
<section class="art" aria-label="${esc(p.nome)}"><i class="orb o1"></i><i class="orb o2"></i><i class="orb o3"></i><i class="grade"></i>
<a class="brand" href="${esc(site)}">${ic}<span>${pre}<b>Works</b></span></a>
<div><h1>Bem-vindo de volta ao <em>${esc(p.nome)}</em></h1><p>${esc(p.frase)}</p>
<ul class="lista"><li><i>🔒</i>Senha conferida no servidor, conexão protegida</li><li><i>📱</i>Funciona no computador e no celular</li><li><i>💬</i>Suporte da LLD Works quando precisar</li></ul></div>
<div class="rod"><span>Uma solução LLD Works · lldworks.com.br</span><span><a href="/termos">Termos</a> · <a href="/privacidade">Privacidade</a></span></div></section>
<main class="frm"><div><a class="voltar" href="${esc(site)}">← Voltar ao site do ${esc(p.nome)}</a>${formulario}
${logado ? "" : `<div class="selos"><span>Sessão de ${SESSAO_H} h</span><span>HTTPS</span><span>Dados de cada empresa separados</span></div>`}</div></main>
<script src="/conta/gsap.min.js"></script><script>
(function(){var f=document.querySelector("form");
if(f){var b=f.querySelector(".olho"),s=document.getElementById("senha");b.onclick=function(){var v=s.type==="password";s.type=v?"text":"password";b.textContent=v?"Ocultar":"Mostrar";b.setAttribute("aria-pressed",String(v));b.setAttribute("aria-label",v?"Ocultar senha":"Mostrar senha");s.focus();};
f.addEventListener("submit",function(e){var em=document.getElementById("email"),er=document.getElementById("erro"),ok=true;[em,s].forEach(function(i){i.setAttribute("aria-invalid",String(!i.checkValidity()));if(!i.checkValidity())ok=false;});
if(!ok){e.preventDefault();er.textContent=!em.checkValidity()?"Confira o e-mail.":"A senha tem pelo menos 8 caracteres.";(em.checkValidity()?s:em).focus();return;}
var bt=f.querySelector("button[type=submit]");bt.setAttribute("aria-busy","true");bt.disabled=true;});}
var g=window.gsap;if(!g||matchMedia("(prefers-reduced-motion: reduce)").matches)return;
g.from(".brand",{y:-16,opacity:0,duration:.6,ease:"power3.out"});g.from(".art h1,.art p,.lista li",{y:24,opacity:0,duration:.7,stagger:.08,ease:"power3.out",delay:.1});
g.from(".frm .voltar,.frm h2,.frm .mute,.campo,.frm .btn,.links,.demo,.selos,.ja .av",{y:18,opacity:0,duration:.55,stagger:.05,ease:"power2.out",delay:.2});
g.to(".o1",{x:-60,y:50,scale:1.12,duration:8,repeat:-1,yoyo:true,ease:"sine.inOut"});g.to(".o2",{x:70,y:-40,scale:1.18,duration:10,repeat:-1,yoyo:true,ease:"sine.inOut"});g.to(".o3",{x:-40,y:-30,duration:6,repeat:-1,yoyo:true,ease:"sine.inOut"});
var er0=document.querySelector(".err");if(er0&&er0.textContent.trim())g.fromTo("form",{x:-10},{x:0,duration:.5,ease:"elastic.out(1,.3)"});})();
</script></body></html>`;
}
async function entrar(req, env, url, p) {
  if (req.headers.get("Origin") && req.headers.get("Origin") !== url.origin) return new Response("Origem inválida", { status: 403 });
  const ip = req.headers.get("CF-Connecting-IP") || "?";
  const t = TENTATIVAS.get(ip) || { n: 0, at: Date.now() };
  if (Date.now() - t.at > 15 * 60e3) { t.n = 0; t.at = Date.now(); }
  if (t.n >= 8) return html(telaLogin(p, "Muitas tentativas. Aguarde 15 minutos e tente de novo."), 429);
  let f; try { f = await req.formData(); } catch { return html(telaLogin(p, "Envie o formulário de novo."), 400); }
  const email = String(f.get("email") || "").trim().toLowerCase().slice(0, 200), senha = String(f.get("senha") || "").slice(0, 200);
  // Usuários, senhas e assinaturas vêm do LLD Works Hub (console.lldworks.com.br) pelo service binding HUB.
  let r = { ok: false, motivo: "credenciais" };
  if (env.HUB && env.SESSION_KEY) {
    try {
      const resp = await env.HUB.fetch("https://hub.interno/interno/login", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ produto: p.slug, email, senha }) });
      r = await resp.json();
    } catch { return html(telaLogin(p, "Serviço de login indisponível. Tente em alguns minutos.", email), 503); }
  }
  if (!r.ok) {
    t.n++; TENTATIVAS.set(ip, t);
    await new Promise((res) => setTimeout(res, 400));
    if (r.motivo === "sem_senha") return html(telaLogin(p, "Você ainda não criou a sua senha.", email, { href: "/recuperar?primeiro=1", rot: "Criar minha senha" }), 403);
    if (r.motivo === "assinatura") {
      if (r.retomar) return new Response(null, { status: 303, headers: { Location: "/assinar#t=" + encodeURIComponent(r.retomar), "Cache-Control": "no-store", ...SEG } }); // cadastro esperando pagamento
      const ate = r.vence_em ? ` em ${r.vence_em.slice(8, 10)}/${r.vence_em.slice(5, 7)}/${r.vence_em.slice(0, 4)}` : "";
      const msg = r.origem === "gratis" ? `O seu período grátis terminou${ate}. Seus dados estão guardados: assine para continuar.` : "Seu acesso está suspenso. Seus dados estão guardados: regularize a assinatura para voltar.";
      return html(telaLogin(p, msg, email, { href: "/assinar", rot: "Assinar agora" }), 403);
    }
    return html(telaLogin(p, "E-mail ou senha incorretos.", email, { href: "/recuperar", rot: "Esqueci minha senha" }), 401);
  }
  TENTATIVAS.delete(ip);
  const dados = b64u(enc.encode(JSON.stringify({ e: email, p: p.slug, c: r.cliente.id, cn: r.cliente.nome, cs: r.cliente.slug, r: r.usuario.papel, x: Math.floor(Date.now() / 1000) + SESSAO_H * 3600 })));
  const valor = dados + "." + (await hmac(env, dados));
  return new Response(null, { status: 303, headers: { Location: p.aposLogin || (p.slug === "serviceworks" ? "/app" : "/"), "Cache-Control": "no-store", "Set-Cookie": `lw_s=${valor}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${SESSAO_H * 3600}`, ...SEG } });
}
function sair() {
  return new Response(null, { status: 303, headers: { Location: "/entrar", "Cache-Control": "no-store", "Set-Cookie": "lw_s=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0", ...SEG } });
}
// ---------- API dos produtos com backend próprio (service binding) ----------
// O navegador nunca fala direto com o Worker do produto: o roteador confere a sessão e envia quem é o cliente
// em cabeçalhos x-lw-*. Cópias desses cabeçalhos vindas do navegador são descartadas.
// Demonstração: <produto>-demo.lldworks.com.br abre sem senha. Produto real = conta de demonstração do Hub em modo leitura;
// produto ainda em construção = demonstração da vitrine de produtos; PageWorks/ProWorks = exemplo real publicado.
const DEMO_SESSAO = { e: "demo@lldworks.com.br", c: 1, cn: "LLD Works · Demonstração", cs: "demo", r: "admin", demo: true };
// ServiceWorks tem duas demonstrações: barbearia (padrão) e pet shop; /pet e /barbearia trocam (cookie lw_demo, sem dado pessoal).
const DEMO_PET = { e: "demo-pet@lldworks.com.br", c: 2, cn: "LLD Works · Demonstração Pet", cs: "demo-pet", r: "admin", demo: true, pet: true };
const DEMO_EXEMPLOS = { pageworks: "https://clinica.lldworks.com.br/", proworks: "https://wellington.lldworks.com.br/" };
const faixaDemo = (p, s = {}) => `<div role="note" style="position:fixed;left:14px;bottom:14px;z-index:60;background:#17142A;color:#fff;padding:9px 14px;border-radius:999px;font:600 13px Inter,system-ui,sans-serif;box-shadow:0 8px 24px rgba(0,0,0,.25);max-width:calc(100vw - 28px)">Demonstração · somente leitura · <a href="https://produtos.lldworks.com.br/#${p.slug}" style="color:#fff">Quero o meu ${esc(p.nome)}</a>${p.slug === "serviceworks" ? ` · <a href="${s.pet ? "/barbearia" : "/pet"}" style="color:#fff">Ver ${s.pet ? "barbearia" : "pet shop"}</a>` : ""}</div>`;
async function demo(req, env, url, p) {
  const path = url.pathname;
  if (CONTA_PAGINAS[path]) return Response.redirect(`https://${p.slug}.lldworks.com.br${path}${url.search}`, 302); // cadastro e senha só no endereço real
  if (path === "/entrar" || path === "/sair") return Response.redirect(url.origin + "/", 302);
  if (p.slug === "serviceworks" && (path === "/pet" || path === "/barbearia"))
    return new Response(null, { status: 302, headers: { Location: "/", "Cache-Control": "no-store", "Set-Cookie": `lw_demo=${path === "/pet" ? "pet" : "barbearia"}; Path=/; Secure; SameSite=Lax; Max-Age=86400` } });
  if (!BACKENDS[p.slug]?.painel) {
    if (req.method !== "GET" && req.method !== "HEAD") return new Response("Método não permitido", { status: 405 });
    if (path.includes("..")) return new Response("Inválido", { status: 400 });
    return origem(req, "portfolio/demos" + (path === "/" || path === "/index.html" ? `/${p.slug}.html` : path), path === "/" ? 0 : 300);
  }
  if (p.slug === "linkworks" && (path === "/" || path === "/index.html")) return lwTela(env, req, "/ui/venda.html");
  if (path.startsWith("/api/") && req.method !== "GET" && req.method !== "HEAD") return jsonErro(403, "Demonstração em modo leitura: as alterações estão desativadas. Peça o seu acesso para testar de verdade.");
  return produto(req, env, url, p, p.slug === "serviceworks" && cookie(req, "lw_demo") === "pet" ? DEMO_PET : DEMO_SESSAO);
}

// painel: true = tela própria nova (sem script embutido); corpoMax = maior envio aceito (RHWorks manda currículos).
const BACKENDS = {
  serviceworks: { binding: "SERVICEWORKS", host: "sw.interno", painel: true, corpoMax: 1024 * 1024 },
  linkworks: { binding: "LINKWORKS", host: "lw.interno", painel: true },
  salesworks: { binding: "SALESWORKS", host: "sl.interno", painel: true },
  agentworks: { binding: "AGENTWORKS", host: "ag.interno", painel: true, corpoMax: 256 * 1024 },
  socialworks: { binding: "SOCIALWORKS", host: "so.interno", painel: true },
  rhworks: { binding: "RHWORKS", host: "rh.interno", corpoMax: 4 * 1024 * 1024 },
};
// LinkWorks: linkworks.lldworks.com.br/<endereço> é a página pública; /<endereço>/l/<id> conta o clique.
const LW_PUBLICA = /^\/([a-z0-9][a-z0-9_.-]{2,29})(\/l\/\d{1,9}|\/contato\.vcf)?\/?$/;
const LW_RESERVADO = /^(entrar|sair|api|pub|conta|assinar|recuperar|termos|privacidade|index\.html|favicon\.ico|robots\.txt|painel|venda|exemplo|ui|m)$/;
// LinkWorks v2: telas, mídia (KV) e exemplos vêm do próprio Worker do produto (binding LINKWORKS: /ui, /m, /exemplo).
async function lwTela(env, req, caminho, extra = "") {
  if (!env.LINKWORKS) return new Response("Serviço indisponível", { status: 503 });
  const h = new Headers();
  for (const k of ["range", "user-agent"]) if (req.headers.get(k)) h.set(k, req.headers.get(k));
  const r = await env.LINKWORKS.fetch(new Request("https://lw.interno" + caminho, { method: req.method === "HEAD" ? "HEAD" : "GET", headers: h }));
  const rh = new Headers(r.headers);
  for (const [k, v] of Object.entries(SEG)) rh.set(k, v);
  if (!extra || r.status !== 200) return new Response(r.body, { status: r.status, headers: rh });
  rh.delete("Content-Length");
  return new Response((await r.text()).replace("</body>", extra + "</body>"), { status: 200, headers: rh });
}
// SalesWorks: salesworks.lldworks.com.br/<endereço> é a loja online pública.
const SL_LOJA = /^\/([a-z0-9][a-z0-9-]{2,39})\/?$/;
const SL_RESERVADO = /^(entrar|sair|api|pub|conta|assinar|recuperar|termos|privacidade|index|admin|painel|loja|lojas|favicon|robots|salesworks|lldworks)$/;
// A loja/vitrine "demo" é pública e o painel dela também (modo leitura): pedido ou agendamento de verdade ali
// exporia nome e WhatsApp do visitante. Nela o fluxo inteiro funciona, menos o envio final.
const DEMO_PUBLICO = /^\/api\/publico\/demo(-pet)?(\/|$)/;
// AgentWorks: /c/<endereço> é o chat público (pode abrir dentro do botão no site do cliente, por isso aceita iframe);
// /webhook/whatsapp recebe os avisos da Meta (a assinatura é conferida no Worker do produto).
const AG_CHAT = /^\/c\/([a-z0-9][a-z0-9-]{2,39})\/?$/;
const jsonErro = (s, erro) => new Response(JSON.stringify({ erro }), { status: s, headers: { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store", ...SEG } });
async function backend(req, env, url, p, s, caminho = url.pathname) {
  const b = BACKENDS[p.slug], alvo = b && env[b.binding];
  if (!alvo) return jsonErro(503, "Serviço indisponível. Tente em alguns minutos.");
  if (req.method !== "GET" && req.method !== "HEAD") {
    const o = req.headers.get("Origin");
    if (o && o !== url.origin) return jsonErro(403, "Origem inválida");
  }
  const h = new Headers();
  for (const k of ["content-type", "accept", "x-hub-signature-256", "range"]) if (req.headers.get(k)) h.set(k, req.headers.get(k));
  h.set("x-lw-ip", req.headers.get("CF-Connecting-IP") || "?");
  if (!s) for (const k of ["user-agent", "referer"]) if (req.headers.get(k)) h.set(k, req.headers.get(k).slice(0, 500));
  if (s) {
    h.set("x-lw-cliente", String(s.c)); h.set("x-lw-email", s.e); h.set("x-lw-papel", s.r || "admin");
    h.set("x-lw-slug", s.cs || ""); h.set("x-lw-nome", encodeURIComponent(s.cn || ""));
  }
  const corpo = req.method === "GET" || req.method === "HEAD" ? undefined : await req.arrayBuffer();
  const max = p.slug === "linkworks" && caminho === "/api/admin/midia" ? 10 * 1024 * 1024 + 4096 : b.corpoMax || 64 * 1024; // LinkWorks: vídeo até 10 MB
  if (corpo && corpo.byteLength > max) return jsonErro(413, max > 5e6 ? "O arquivo pode ter até 10 MB." : "Envio grande demais.");
  const r = await alvo.fetch(new Request(`https://${b.host}${caminho}${url.search}`, { method: req.method, headers: h, body: corpo, redirect: "manual" }));
  const rh = new Headers(r.headers);
  for (const [k, v] of Object.entries(SEG)) rh.set(k, v);
  return new Response(r.body, { status: r.status, headers: rh });
}

// "Pagar ou trocar de plano" (aba Plano dos painéis): leva o cliente logado ao link de pagamento dele no Hub
// (pagar.lldworks.com.br: escolhe o plano e paga por Pix ou cartão em até 12x). Demonstração não cobra.
async function assinar(env, p, s) {
  if (s.demo) return Response.redirect("https://produtos.lldworks.com.br/#" + p.slug, 302);
  try {
    const r = await env.HUB.fetch(`https://hub.interno/interno/link-pagamento?produto=${encodeURIComponent(p.slug)}&cliente=${encodeURIComponent(s.c)}`);
    const d = await r.json();
    if (r.ok && /^https:\/\/pagar\.lldworks\.com\.br\//.test(d.url || "")) return new Response(null, { status: 303, headers: { Location: d.url, "Cache-Control": "no-store", ...SEG } });
  } catch {}
  return new Response("O pagamento online ainda não está disponível. Fale com a LLD Works: lucasldiogo@lldworks.com.br", { status: 503, headers: { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "no-store", ...SEG } });
}

async function produto(req, env, url, p, sessaoFixa = null) {
  const path = url.pathname;
  if (path === "/entrar") return req.method === "POST" ? entrar(req, env, url, p) : html(telaLogin(p, "", "", null, sessaoFixa ? null : await sessao(req, env, p)));
  if (path === "/sair") return sair();
  if (BACKENDS[p.slug]) { const c = await conta(req, env, url, p); if (c) return c; }
  if (p.slug === "agentworks") { const r = await agentworks(req, env, url, p, sessaoFixa); if (r) return r; }
  if (p.slug === "serviceworks" && path.startsWith("/api/integracao/agentworks")) return swIntegracao(req, env, url);
  // LinkWorks v2: raiz sem login = site de venda; /pub, /m (fotos e vídeos dos clientes) e /exemplo vêm do Worker do produto.
  if (p.slug === "linkworks" && (req.method === "GET" || req.method === "HEAD")) {
    if (path.startsWith("/pub/") && !path.includes("..")) return lwTela(env, req, "/ui/" + path.slice(5));
    if (/^\/m\/[A-Za-z0-9_.-]{6,60}$/.test(path)) return lwTela(env, req, path);
    if (/^\/exemplo\/[a-z0-9-]{2,20}$/.test(path)) return lwTela(env, req, path);
    if (path === "/" && !sessaoFixa && !(await sessao(req, env, p))) return lwTela(env, req, "/ui/venda.html");
  }
  // Vitrine: rotas públicas, sem login, para quem vai comprar ou agendar.
  if (BACKENDS[p.slug]) {
    // Partes públicas dos produtos com backend próprio: arquivos /pub/, vitrine do ServiceWorks e páginas do LinkWorks.
    // ServiceWorks: a raiz é o site de venda; o painel fica em /app; a vitrine de cada loja mora em <loja>.lldworks.com.br
    if (p.slug === "serviceworks") {
      const v = path.match(/^\/v\/([a-z0-9-]{3,40})\/?$/);
      if (v) return Response.redirect(`https://${v[1]}.lldworks.com.br/`, 301);
      if (!sessaoFixa && (path === "/" || path === "/index.html") && (req.method === "GET" || req.method === "HEAD")) return origem(req, "serviceworks/site.html", 60);
      const aviso = path.match(/^\/webhook\/mp\/(\d{1,9})$/);
      if (aviso) return req.method === "POST" ? backend(req, env, url, p, null, `/api/aviso-mp/${aviso[1]}`) : new Response("ok");
    }
    if (path.startsWith("/pub/")) {
      if (req.method !== "GET" && req.method !== "HEAD") return new Response("Método não permitido", { status: 405 });
      if (path.includes("..")) return new Response("Inválido", { status: 400 });
      return origem(req, p.dir + path, 60);
    }
    if ((p.slug === "serviceworks" || p.slug === "salesworks") && path.startsWith("/api/publico/")) {
      if (DEMO_PUBLICO.test(path) && req.method !== "GET" && req.method !== "HEAD") return jsonErro(403, "Esta é uma demonstração: o envio está desativado. Contrate o seu para receber pedidos e agendamentos de verdade.");
      return backend(req, env, url, p, null);
    }
    // SocialWorks: /webhook/instagram recebe os avisos da Meta (a assinatura é conferida no Worker do produto).
    if (p.slug === "socialworks" && path === "/webhook/instagram") return backend(req, env, url, p, null);
    if (p.slug === "agentworks") {
      if (path.startsWith("/api/publico/") || path === "/webhook/whatsapp") return backend(req, env, url, p, null);
      if (AG_CHAT.test(path)) {
        if (req.method !== "GET" && req.method !== "HEAD") return new Response("Método não permitido", { status: 405 });
        const r = await origem(req, "agentworks/chat.html", 60), h = new Headers(r.headers);
        h.delete("X-Frame-Options"); h.set("Content-Security-Policy", "frame-ancestors *");
        return new Response(r.body, { status: r.status, headers: h });
      }
    }
    const sl = p.slug === "salesworks" && path.match(SL_LOJA);
    if (sl && !SL_RESERVADO.test(sl[1])) {
      if (req.method !== "GET" && req.method !== "HEAD") return new Response("Método não permitido", { status: 405 });
      return origem(req, "salesworks/loja.html", 60);
    }
    const lw = p.slug === "linkworks" && path.match(LW_PUBLICA);
    if (lw && !LW_RESERVADO.test(lw[1])) {
      if (req.method !== "GET" && req.method !== "HEAD") return new Response("Método não permitido", { status: 405 });
      return backend(req, env, url, p, null, `/p/${lw[1]}${lw[2] || ""}`);
    }
  }
  const s = sessaoFixa || (await sessao(req, env, p));
  if (!s) return path.startsWith("/api/") ? new Response('{"erro":"login"}', { status: 401, headers: { "Content-Type": "application/json" } }) : Response.redirect(url.origin + "/entrar", 302);
  // Acesso vencido (fim da liberação grátis ou assinatura suspensa): trava na hora, mesmo com sessão aberta. Os dados ficam guardados.
  if (!s.demo && !(await liberado(env, p, s.c))) {
    if (path.startsWith("/api/")) return jsonErro(402, "Seu acesso venceu. Seus dados estão guardados: assine para continuar.");
    return html(telaBloqueio(p), 402);
  }
  if (p.slug === "linkworks" && (path === "/" || path === "/index.html" || path === "/painel") && (req.method === "GET" || req.method === "HEAD")) {
    const r = await lwTela(env, req, "/ui/painel.html", s.demo ? faixaDemo(p, s) : "");
    const h = new Headers(r.headers); h.set("Cache-Control", "no-store");
    return new Response(r.body, { status: r.status, headers: h });
  }
  if (BACKENDS[p.slug] && path.startsWith("/api/admin/")) return backend(req, env, url, p, s);
  if (BACKENDS[p.slug] && path.startsWith("/api/") && !p.api) return jsonErro(404, "Rota não encontrada");
  if (p.api && CRIVO_ROTAS.test(path) && !path.startsWith("/lib/")) {
    if (!env.CRIVO) return new Response("Serviço indisponível", { status: 503 });
    return env.CRIVO.fetch(new Request("https://crivo.lldworks.com.br" + path + url.search, req));
  }
  if (req.method !== "GET" && req.method !== "HEAD") return new Response("Método não permitido", { status: 405 });
  if (path.includes("..")) return new Response("Inválido", { status: 400 });
  const arq = path === "/" || path === "/index.html" || (p.slug === "serviceworks" && (path === "/app" || path === "/app/")) ? "/" + p.entrada : path;
  const r = await origem(req, p.dir + arq, arq === "/" + p.entrada ? 0 : 300);
  if (arq !== "/" + p.entrada || r.status !== 200) return r;
  if (BACKENDS[p.slug]?.painel) { // painel próprio: sem script embutido (CSP); na demonstração, só a faixa de aviso
    const h = new Headers(r.headers); h.set("Cache-Control", "no-store"); h.delete("Content-Length");
    return new Response(s.demo ? (await r.text()).replace("</body>", faixaDemo(p, s) + "</body>") : r.body, { status: 200, headers: h });
  }
  // Página principal: avisa o app que o login já foi feito no servidor e põe o botão Sair.
  const marca = `<script>window.LW_AUTH=${JSON.stringify({ email: s.e, cliente: s.cn || "", slug: s.cs || "", papel: s.r || "admin" }).replace(/</g, "\\u003c")}</script>`;
  const barra = p.slug === "rhworks" ? `<a href="/sair" style="position:fixed;right:14px;bottom:14px;z-index:50;background:#16141D;color:#fff;font:600 13px Inter,sans-serif;padding:8px 14px;border-radius:99px;text-decoration:none;box-shadow:0 6px 20px rgba(0,0,0,.2)">Sair · ${esc(s.e)}</a>` : "";
  const corpo = (await r.text()).replace("</head>", marca + "</head>").replace("</body>", barra + "</body>");
  const h = new Headers(r.headers); h.set("Cache-Control", "no-store"); h.delete("Content-Length");
  return new Response(corpo, { status: 200, headers: h });
}

// ---------- Contas: cadastro (/assinar), senha (/recuperar), Termos e Privacidade ----------
// Páginas comuns em works/conta/; /api/conta/* vai para o LLD Works Hub (binding HUB), que guarda clientes, códigos e e-mails.
const CONTA_PAGINAS = { "/assinar": "conta/assinar.html", "/recuperar": "conta/recuperar.html", "/termos": "conta/termos.html", "/privacidade": "conta/privacidade.html" };
async function conta(req, env, url, p) {
  const path = url.pathname, leitura = req.method === "GET" || req.method === "HEAD";
  // Cliente já logado em /assinar ("Pagar ou trocar de plano" no painel): vai para o link de pagamento dele, mesmo com o acesso vencido.
  if (path === "/assinar" && leitura && !url.searchParams.has("plano") && !url.searchParams.has("novo")) { const s = await sessao(req, env, p); if (s && !s.demo) return assinar(env, p, s); }
  if (CONTA_PAGINAS[path] || /^\/conta\/(conta\.(css|js)|gsap\.min\.js)$/.test(path)) {
    if (!leitura) return new Response("Método não permitido", { status: 405 });
    const r = await origem(req, CONTA_PAGINAS[path] || path.slice(1), CONTA_PAGINAS[path] ? 60 : 300), h = new Headers(r.headers);
    h.set("X-Frame-Options", "DENY");
    return new Response(r.body, { status: r.status, headers: h });
  }
  const m = path.match(/^\/api\/conta\/([a-z/-]{3,40})$/);
  if (!m) return null;
  if (!env.HUB) return jsonErro(503, "Serviço indisponível. Tente em alguns minutos.");
  if (!leitura && req.method !== "POST") return jsonErro(405, "Método não permitido");
  if (!leitura && req.headers.get("Origin") && req.headers.get("Origin") !== url.origin) return jsonErro(403, "Origem inválida");
  const corpo = leitura ? undefined : await req.arrayBuffer();
  if (corpo && corpo.byteLength > 16 * 1024) return jsonErro(413, "Envio grande demais.");
  const q = new URLSearchParams(url.search); q.set("produto", p.slug);
  const r = await env.HUB.fetch(new Request(`https://hub.interno/interno/conta/${m[1]}?${q}`, { method: leitura ? "GET" : "POST", headers: { "Content-Type": "application/json", "x-lw-ip": req.headers.get("CF-Connecting-IP") || "?" }, body: corpo }));
  const h = new Headers(r.headers); for (const [k, v] of Object.entries(SEG)) h.set(k, v); h.set("Cache-Control", "no-store");
  return new Response(r.body, { status: r.status, headers: h });
}
// Assinatura liberada? (cache de 60 s; se o Hub falhar, libera e o login segue valendo)
// assinaturaHub devolve também o plano (o AgentWorks usa para ligar os módulos certos).
const LIBERADO = new Map();
async function assinaturaHub(env, p, cliente) {
  if (!env.HUB || !cliente) return { liberada: true };
  const k = `${p.slug}:${cliente}`, c = LIBERADO.get(k);
  if (c && c.ate > Date.now()) return c.v;
  let v = { liberada: true };
  try { const r = await env.HUB.fetch(`https://hub.interno/interno/assinatura?produto=${p.slug}&cliente=${cliente}`); if (r.ok) { const d = await r.json(); v = d && typeof d === "object" ? d : { liberada: false }; } } catch {}
  LIBERADO.set(k, { v, ate: Date.now() + 60e3 }); if (LIBERADO.size > 5000) LIBERADO.clear();
  return v;
}
async function liberado(env, p, cliente) { return !!(await assinaturaHub(env, p, cliente)).liberada; }
function telaBloqueio(p) {
  return `<!DOCTYPE html><html lang="pt-BR"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex"><title>Acesso suspenso · ${esc(p.nome)}</title>
<style>:root{--p:${p.cor}}body{margin:0;min-height:100vh;display:grid;place-items:center;background:#F4F3F8;font:16px/1.55 Inter,system-ui,sans-serif;color:#17142A;padding:20px}.c{background:#fff;border-radius:18px;padding:32px;max-width:460px;box-shadow:0 20px 50px -25px rgba(0,0,0,.35)}h1{font-size:24px;margin:0 0 10px}p{color:#4B4858}a.b{display:inline-block;margin:16px 10px 0 0;padding:12px 18px;border-radius:12px;background:var(--p);color:#fff;font-weight:700;text-decoration:none}a.s{color:var(--p);font-weight:600}</style></head>
<body><div class="c"><h1>Seu acesso ao ${esc(p.nome)} venceu</h1><p>O período liberado terminou ou a assinatura está suspensa. <b>Seus dados estão guardados</b> e voltam assim que o acesso for renovado.</p>
<a class="b" href="/assinar">Assinar agora</a><a class="s" href="/sair">Sair</a></div></body></html>`;
}

// ---------- AgentWorks: o painel e a IA rodam no motor (WhatsApp por QR Code ou API oficial) ----------
// O motor é o servidor do atendimento (túnel "lld-atende" da Cloudflare, mesmo endereço do console atende.lldworks.com.br).
// O navegador nunca fala com ele direto:
// o roteador confere o login no Hub e assina quem é o cliente com MOTOR_KEY (HMAC-SHA256 de horário, método,
// caminho e cabeçalhos x-lw-*). Sem assinatura válida, o motor recusa. / = site de venda; /painel = acesso direto.
const AG_MOTOR = "https://atende.lldworks.com.br";
const AG_SITE = "agentworks/site.html";
const AG_MOTOR_ROTAS = /^\/(painel\/?$|api\/(sso|painel)\/|chat$|logo\/)/;
const hex = (buf) => [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, "0")).join("");
async function hmacHex(chave, texto) {
  const k = await crypto.subtle.importKey("raw", enc.encode(chave), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  return hex(await crypto.subtle.sign("HMAC", k, enc.encode(texto)));
}
async function motor(req, env, url, p, s, caminho = url.pathname) {
  if (!env.MOTOR_KEY) return jsonErro(503, "Serviço indisponível. Tente em alguns minutos.");
  if (req.method !== "GET" && req.method !== "HEAD") {
    const o = req.headers.get("Origin");
    if (s && o && o !== url.origin) return jsonErro(403, "Origem inválida");
  }
  const alvo = caminho + url.search, h = new Headers();
  for (const k of ["content-type", "accept", "x-hub-signature-256"]) if (req.headers.get(k)) h.set(k, req.headers.get(k));
  h.set("x-lw-ip", req.headers.get("CF-Connecting-IP") || "?");
  if (s) {
    const a = s.demo ? {} : await assinaturaHub(env, p, s.c);
    const nomes = ["x-lw-cliente", "x-lw-email", "x-lw-papel", "x-lw-slug", "x-lw-nome", "x-lw-demo", "x-lw-plano"];
    const vals = [String(s.c), s.e || "", s.r || "admin", s.cs || "", encodeURIComponent(s.cn || ""), s.demo ? "1" : "", encodeURIComponent(a.plano || "")];
    const ts = String(Math.floor(Date.now() / 1000));
    nomes.forEach((n, i) => h.set(n, vals[i]));
    h.set("x-lw-ts", ts);
    h.set("x-lw-motor", await hmacHex(env.MOTOR_KEY, [ts, req.method, alvo, ...vals].join("\n")));
  }
  const corpo = req.method === "GET" || req.method === "HEAD" ? undefined : await req.arrayBuffer();
  if (corpo && corpo.byteLength > 25 * 1024 * 1024) return jsonErro(413, "Envio grande demais.");
  let r;
  try { r = await fetch(AG_MOTOR + alvo, { method: req.method, headers: h, body: corpo, redirect: "manual" }); }
  catch { r = null; }
  if (!r || r.status === 502 || r.status === 503 || r.status === 530) {
    if (caminho === "/painel") return html(telaMotorFora(p), 503);
    return jsonErro(503, "O atendimento está reiniciando. Tente de novo em instantes.");
  }
  const rh = new Headers(r.headers);
  for (const [k, v] of Object.entries(SEG)) rh.set(k, v);
  rh.set("X-Frame-Options", "DENY");
  return new Response(r.body, { status: r.status, headers: rh });
}
function telaMotorFora(p) {
  return `<!DOCTYPE html><html lang="pt-BR"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex"><meta http-equiv="refresh" content="20"><title>${esc(p.nome)} · voltando em instantes</title>
<style>:root{--p:${p.cor}}body{margin:0;min-height:100vh;display:grid;place-items:center;background:#F3F7F5;font:16px/1.55 Inter,system-ui,sans-serif;color:#10241C;padding:20px}.c{background:#fff;border-radius:18px;padding:32px;max-width:460px;box-shadow:0 20px 50px -25px rgba(0,0,0,.35)}h1{font-size:23px;margin:0 0 10px}p{color:#4B5A54}a{color:var(--p);font-weight:700}</style></head>
<body><div class="c"><h1>O painel está voltando</h1><p>O servidor do atendimento está reiniciando. Esta página tenta de novo sozinha em 20 segundos. Seus dados e conversas estão guardados.</p><p><a href="/">Voltar ao site</a> · <a href="/sair">Sair</a></p></div></body></html>`;
}
async function agentworks(req, env, url, p, sessaoFixa) {
  const path = url.pathname, leitura = req.method === "GET" || req.method === "HEAD";
  if (path === "/webhook/meta") return motor(req, env, url, p, null); // a assinatura da Meta é conferida no motor
  if (path === "/" && !sessaoFixa) { // site de venda e apresentação (planos em #plano, botão leva para /assinar)
    if (!leitura) return new Response("Método não permitido", { status: 405 });
    const r = await origem(req, AG_SITE, 0);
    if (r.status !== 200) return r;
    const s = await sessao(req, env, p);
    const h = new Headers(r.headers); h.set("Cache-Control", "no-store"); h.delete("Content-Length");
    return new Response(s ? (await r.text()).replace("</head>", '<meta name="aw-logado" content="1"></head>') : r.body, { status: 200, headers: h });
  }
  const painel = path === "/" || AG_MOTOR_ROTAS.test(path);
  if (!painel) return null;
  const s = sessaoFixa || (await sessao(req, env, p));
  if (!s) return path.startsWith("/api/") || path === "/chat" ? jsonErro(401, "login") : Response.redirect(url.origin + "/entrar", 302);
  if (s.demo && !leitura) return jsonErro(403, "Demonstração em modo leitura: as alterações estão desativadas. Peça o seu acesso para testar de verdade.");
  if (!s.demo && !(await liberado(env, p, s.c))) {
    if (path.startsWith("/api/") || path === "/chat") return jsonErro(402, "Seu acesso venceu. Seus dados estão guardados: assine para continuar.");
    return html(telaBloqueio(p), 402);
  }
  const caminho = path === "/" || path.startsWith("/painel") ? "/painel" : path;
  const r = await motor(req, env, url, p, s, caminho);
  if (!s.demo || caminho !== "/painel" || r.status !== 200) return r;
  const h = new Headers(r.headers); h.delete("Content-Length");
  return new Response((await r.text()).replace("</body>", faixaDemo(p, s) + "</body>"), { status: 200, headers: h });
}
// ServiceWorks como agenda do AgentWorks (módulo pago): o motor chama assinado; o roteador confere a assinatura,
// as duas assinaturas no Hub e a vitrine do próprio cliente, e repassa para a API pública dela.
async function swIntegracao(req, env, url) {
  if (!env.MOTOR_KEY || !env.SERVICEWORKS) return jsonErro(503, "Serviço indisponível. Tente em alguns minutos.");
  const cliente = req.headers.get("x-aw-cliente") || "", ts = req.headers.get("x-aw-ts") || "", tel = (req.headers.get("x-aw-tel") || "").slice(0, 20);
  if (!/^\d{1,9}$/.test(cliente) || !(Math.abs(Date.now() / 1000 - Number(ts)) < 300)) return jsonErro(401, "Acesso não autorizado.");
  const corpo = req.method === "GET" || req.method === "HEAD" ? new Uint8Array(0) : new Uint8Array(await req.arrayBuffer());
  if (corpo.byteLength > 16 * 1024) return jsonErro(413, "Envio grande demais.");
  const esperado = await hmacHex(env.MOTOR_KEY, [ts, req.method, url.pathname + url.search, cliente, tel, hex(await crypto.subtle.digest("SHA-256", corpo))].join("\n"));
  if (!igual(enc.encode(req.headers.get("x-aw-assinatura") || ""), enc.encode(esperado))) return jsonErro(401, "Acesso não autorizado.");
  const resto = url.pathname.slice("/api/integracao/agentworks".length);
  if (resto && !/^\/(livres|agendar|agendamento|cancelar)$/.test(resto)) return jsonErro(404, "Rota não encontrada");
  if (!(await liberado(env, PRODUTOS["serviceworks.lldworks.com.br"], +cliente))) return jsonErro(402, "A assinatura do ServiceWorks não está ativa.");
  if (!(await liberado(env, PRODUTOS["agentworks.lldworks.com.br"], +cliente))) return jsonErro(402, "A assinatura do AgentWorks não está ativa.");
  const e = await env.SERVICEWORKS.fetch(new Request("https://sw.interno/api/admin/empresa", { headers: { "x-lw-cliente": cliente, "x-lw-papel": "admin", "x-lw-email": "agentworks@lldworks.com.br", "x-lw-slug": "", "x-lw-nome": "AgentWorks", "x-lw-ip": "agentworks" } }));
  let emp = null; try { emp = e.ok ? await e.json() : null; } catch {}
  const slug = emp && (emp.slug || (emp.empresa && emp.empresa.slug));
  if (!slug) return jsonErro(404, "Este cliente ainda não configurou a vitrine do ServiceWorks.");
  const h = new Headers({ "x-lw-ip": `agentworks:${cliente}:${tel.replace(/\D/g, "").slice(-13)}` });
  if (corpo.byteLength) h.set("content-type", "application/json");
  const r = await env.SERVICEWORKS.fetch(new Request(`https://sw.interno/api/publico/${slug}${resto}${url.search}`, { method: req.method, headers: h, body: corpo.byteLength ? corpo : undefined }));
  return new Response(r.body, { status: r.status, headers: { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store", ...SEG } });
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

// ---------- Vitrine de cada loja ServiceWorks em <loja>.lldworks.com.br ----------
const LOJA_RESERVADA = new Set(("www app api admin painel console hub pagar produtos lldworks serviceworks agentworks salesworks linkworks socialworks rhworks pageworks proworks " +
  "crivo rancho clinica imobiliaria wellington lucasldiogo atende wa mail email smtp ftp ns1 ns2 suporte ajuda status blog loja lojas site sites cdn static assets " +
  "entrar sair conta assinar recuperar termos privacidade centralagrotransporte").split(" "));
async function vitrineLoja(req, env, url, slug) {
  const p = PRODUTOS["serviceworks.lldworks.com.br"], path = url.pathname, leitura = req.method === "GET" || req.method === "HEAD";
  if (path === "/" || path === "/index.html" || path === "/agendar") {
    if (!leitura) return new Response("Método não permitido", { status: 405 });
    const r = await origem(req, "serviceworks/vitrine.html", 60), h = new Headers(r.headers);
    h.set("Cache-Control", "public, max-age=60"); h.set("X-Frame-Options", "SAMEORIGIN");
    return new Response(r.body, { status: r.status, headers: h });
  }
  if (path.startsWith("/pub/")) {
    if (!leitura) return new Response("Método não permitido", { status: 405 });
    if (path.includes("..")) return new Response("Inválido", { status: 400 });
    return origem(req, "serviceworks" + path, 300);
  }
  if ((path === "/logo" || path === "/banner") && leitura) return backend(req, env, url, p, null, `/api/publico/${slug}${path}`);
  const api = path.match(/^\/api\/publico\/([a-z0-9-]{3,40})(\/.*)?$/);
  if (api && api[1] === slug) {
    if (DEMO_PUBLICO.test(path) && !leitura) return jsonErro(403, "Esta é uma demonstração: o envio está desativado.");
    return backend(req, env, url, p, null);
  }
  if (path === "/robots.txt") return new Response("User-agent: *\nAllow: /\n", { headers: { "Content-Type": "text/plain" } });
  return new Response("Página não encontrada", { status: 404, headers: { "Content-Type": "text/plain; charset=utf-8" } });
}

export default {
  async fetch(req, env) {
    const url = new URL(req.url);
    const host = url.hostname.replace(/\.$/, "");
    if (host !== url.hostname) return Response.redirect("https://" + host + url.pathname + url.search, 301);
    if (host === "rancho.lldworks.com.br") return Response.redirect("https://ranchofloresloja.com/", 302);
    if (host === "crivo.lldworks.com.br") {
      // Endereço antigo: a IA e os arquivos da versão para instalar seguem no Worker "crivo"; o site foi para o RHWorks.
      if (CRIVO_ROTAS.test(url.pathname) && env.CRIVO) return env.CRIVO.fetch(req);
      return Response.redirect("https://rhworks.lldworks.com.br/", 301);
    }
    if (PRODUTOS[host]) return produto(req, env, url, PRODUTOS[host]);
    const dm = host.match(/^([a-z]+)-demo\.lldworks\.com\.br$/);
    if (dm && PRODUTOS[`${dm[1]}.lldworks.com.br`]) return demo(req, env, url, PRODUTOS[`${dm[1]}.lldworks.com.br`]);
    if (dm && DEMO_EXEMPLOS[dm[1]]) return Response.redirect(DEMO_EXEMPLOS[dm[1]], 302);
    if (ALIASES[host]) return Response.redirect(ALIASES[host], 302);
    const dir = SITES[host];
    if (!dir) {
      const loja = host.match(/^([a-z0-9][a-z0-9-]{1,38}[a-z0-9])\.lldworks\.com\.br$/);
      if (loja && !LOJA_RESERVADA.has(loja[1])) return vitrineLoja(req, env, url, loja[1]);
      return new Response("Não encontrado", { status: 404 });
    }
    if (req.method !== "GET" && req.method !== "HEAD") return new Response("Método não permitido", { status: 405 });
    let path = url.pathname;
    if (path.includes("..")) return new Response("Inválido", { status: 400 });
    if (path.endsWith("/")) path += "index.html";
    return origem(req, dir + path);
  },
};
