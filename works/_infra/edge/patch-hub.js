// Mudanças de 20/11/2026 no lldworks-hub (código no ar = fonte). Cada trecho precisa aparecer 1 vez.
// H1. Limite de tentativas de login no banco (tabela freio, já usada pelos códigos): 10 por e-mail e 40 por IP a cada 15 min.
// H2. /interno/usuario: o roteador pergunta se o usuário da sessão continua ativo (derruba a sessão de quem foi desativado).
function aplicarHub(src) {
  const de = 'if (p === "/interno/login" && met === "POST") return login(req, env);';
  const para = `if (p === "/interno/login" && met === "POST") {
          let __b = {}; try { __b = await req.clone().json(); } catch {}
          const __em = String(__b.email || "").trim().toLowerCase().slice(0, 200), __ip = String(__b.ip || "").slice(0, 64);
          if (__em && !(await freio(env, "login:" + __em, 10, 900))) return h2.json({ ok: false, motivo: "freio" }, 429);
          if (__ip && __ip !== "?" && !(await freio(env, "loginip:" + __ip, 40, 900))) return h2.json({ ok: false, motivo: "freio" }, 429);
          return login(req, env);
        }
        if (p === "/interno/usuario" && met === "GET") {
          const __cli = h2.inteiro(url.searchParams.get("cliente")), __pr = h2.txt(url.searchParams.get("produto"), 40), __e = h2.txt(url.searchParams.get("email"), 200).toLowerCase();
          if (!(__cli > 0) || !__pr || !__e) return h2.json({ existe: false, ativo: false });
          const __u = await env.DB.prepare("SELECT ativo FROM usuarios WHERE cliente_id = ? AND produto = ? AND email = ?").bind(__cli, __pr, __e).first();
          return h2.json({ existe: !!__u, ativo: !!(__u && __u.ativo) });
        }`;
  const n = src.split(de).length - 1;
  if (n !== 1) throw new Error("Trecho do login encontrado " + n + " vezes");
  if (!/\nasync function freio\(env, chave, max, janelaSeg\)/.test(src)) throw new Error("freio() não encontrado no topo do módulo");
  return src.replace(de, () => para);
}
if (typeof module !== "undefined") module.exports = { aplicarHub };
