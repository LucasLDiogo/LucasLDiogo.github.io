// Valida todos os links dos produtos LLD Works (regra: works/REGRA-FUNCIONALIDADES-COMUNS.md).
// Uso: node works/_infra/validar-links.mjs   (Node 18+). Sai com código 1 se algum link falhar.
const D = "lldworks.com.br";
const PRODUTOS = ["serviceworks", "agentworks", "salesworks", "linkworks", "rhworks", "socialworks", "pageworks", "proworks"];
const COMUNS = { "/": [200], "/assinar": [200], "/entrar": [200], "/recuperar": [200], "/termos": [200], "/privacidade": [200], "/robots.txt": [200], "/api/conta/produto": [200] };
const PAINEL = { serviceworks: "/app", agentworks: "/painel", salesworks: "/app", rhworks: "/app", socialworks: "/app", pageworks: "/app", proworks: "/app" };
const EXTRAS = [
  ["https://lldworks.com.br/", [200]], ["https://www." + D + "/", [200, 301]], ["https://produtos." + D + "/", [200]],
  ["https://console." + D + "/", [302]], ["https://pagar." + D + "/", [404]], ["https://lucasldiogo." + D + "/", [200]],
  ["https://serviceworks-demo." + D + "/", [200]], ["https://agentworks-demo." + D + "/", [200]], ["https://salesworks-demo." + D + "/", [200]],
  ["https://linkworks-demo." + D + "/", [200]], ["https://rhworks-demo." + D + "/", [200]], ["https://socialworks-demo." + D + "/", [200]],
  ["https://pageworks-demo." + D + "/", [200]], ["https://proworks-demo." + D + "/", [200]],
  ["https://demo." + D + "/", [200]], ["https://demo-pet." + D + "/", [200]], ["https://loja-demo." + D + "/", [200]],
  ["https://clinica." + D + "/", [200]], ["https://imobiliaria." + D + "/", [200]], ["https://wellington." + D + "/", [200]],
];
const lista = [...EXTRAS];
for (const p of PRODUTOS) {
  for (const [c, ok] of Object.entries(COMUNS)) lista.push([`https://${p}.${D}${c}`, ok]);
  if (PAINEL[p]) lista.push([`https://${p}.${D}${PAINEL[p]}`, [302, 303]]); // sem login → manda para /entrar
}
const falhas = [];
async function testa([url, ok]) {
  try {
    const r = await fetch(url, { redirect: "manual", headers: { "User-Agent": "LLDWorks-validar-links/1" } });
    const corpo = r.status === 200 ? await r.text() : "";
    let nota = "";
    if (url.endsWith("/api/conta/produto") && r.status === 200) {
      const j = JSON.parse(corpo);
      if (!j.pagamento?.mercadopago) nota += " [Mercado Pago desligado]";
      if (!j.contato_email) nota += " [sem contato_email em Config]";
    }
    if (/\/(termos|privacidade)$/.test(url) && r.status === 200 && !/LGPD|Defesa do Consumidor/.test(corpo)) nota += " [texto legal incompleto]";
    const bom = ok.includes(r.status) && !nota;
    if (!bom) falhas.push(`${r.status} ${url}${nota}`);
    return `${bom ? "ok " : "ERRO"} ${r.status} ${url}${nota}`;
  } catch (e) { falhas.push(`--- ${url} (${e.message})`); return `ERRO --- ${url} (${e.message})`; }
}
const res = [];
for (let i = 0; i < lista.length; i += 8) res.push(...(await Promise.all(lista.slice(i, i + 8).map(testa))));
console.log(res.join("\n"));
console.log(`\n${lista.length - falhas.length}/${lista.length} links ok`);
if (falhas.length) { console.log("Falhas:\n" + falhas.join("\n")); process.exit(1); }
