// Aplica as mudanças de 20/11/2026 no código do lldworks-router QUE ESTÁ NO AR (o código no ar é a fonte).
// Uso: dentro de uma chamada à API da Cloudflare (ver LEIA-ME.md). Cada troca precisa achar o trecho exatamente 1 vez;
// se o código no ar mudou, a função para com erro e nada é publicado.
function aplicarRouter(src, wrapper) {
  const trocas = [
    // R1. Assinatura: não liberar o acesso quando o Hub não responde (antes: liberada:true). Usa o último valor conhecido por até 6 h.
    ["if (!e.HUB || !r) return { liberada: true };", "if (!e.HUB) return { liberada: false, indisponivel: true };\n  if (!r) return { liberada: true };"],
    ["  let o = { liberada: true };\n  try {\n    let n = await e.HUB.fetch(`https://hub.interno/interno/assinatura?produto=${s.slug}&cliente=${r}`);",
     "  let o = null;\n  try {\n    let n = await e.HUB.fetch(`https://hub.interno/interno/assinatura?produto=${s.slug}&cliente=${r}`);"],
    ["  } catch {\n  }\n  return M.set(t, { v: o, ate: Date.now() + 6e4 }), M.size > 5e3 && M.clear(), o;",
     "  } catch {\n  }\n  if (!o) { if (a && a.v && a.ate > Date.now() - 6 * 36e5) return a.v; return { liberada: false, indisponivel: true }; }\n  return M.set(t, { v: o, ate: Date.now() + 6e4 }), M.size > 5e3 && M.clear(), o;"],
    // R2. Login: manda o IP ao Hub (limite de tentativas no banco, vale para todos os servidores) e mostra a mensagem certa.
    ["body: JSON.stringify({ produto: t.slug, email: d, senha: i })", "body: JSON.stringify({ produto: t.slug, email: d, senha: i, ip: a })"],
    ["if (o.n++, W.set(a, o), await new Promise((h) => setTimeout(h, 400)), l.motivo === \"sem_senha\")",
     "if (o.n++, W.set(a, o), await new Promise((h) => setTimeout(h, 400)), l.motivo === \"freio\") return R(A(t, \"Muitas tentativas. Aguarde 15 minutos e tente de novo.\", d), 429);\n    if (l.motivo === \"sem_senha\")"],
    // R3. Camada de borda por cima do export atual.
    ["export {\n  __lwMe as default\n};", wrapper + "\nexport {\n  __lwEdge as default\n};"],
  ];
  let out = src;
  for (const [de, para] of trocas) {
    const n = out.split(de).length - 1;
    if (n !== 1) throw new Error(`Trecho encontrado ${n} vezes (esperado 1): ${de.slice(0, 80)}`);
    out = out.replace(de, () => para);
  }
  return out;
}
if (typeof module !== "undefined") module.exports = { aplicarRouter };
