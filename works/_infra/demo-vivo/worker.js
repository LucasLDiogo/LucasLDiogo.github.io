// lldworks-demo-vivo — mantém as demonstrações do ServiceWorks sempre "vivas" (20/11/2026).
// Todo dia às 03:17 (Brasília) recria, de forma determinística, a agenda das contas de demonstração
// (cliente 1 = Barbearia Modelo, cliente 2 = Pet Shop Modelo): 8 semanas para trás e 2 para a frente,
// com ocupação realista por dia da semana, faltas, cancelamentos, clientes fiéis e sumidos e vendas de balcão.
// Só mexe em linhas com id na faixa reservada (9.100.000–9.999.999) e só nos clientes 1 e 2.
const CLIENTES = [1, 2];
const FAIXA = { ag: [9100000, 9799999], ct: [9800000, 9849999], vd: [9850000, 9899999], vi: [9900000, 9999999] };
const NOMES = ["Lucas Andrade", "Pedro Henrique", "Gabriel Souza", "Matheus Lima", "Rafael Costa", "Bruno Martins", "Felipe Rocha", "Thiago Alves", "Gustavo Pereira", "André Ribeiro",
  "Diego Fernandes", "Leonardo Gomes", "Marcelo Dias", "Eduardo Nunes", "João Vitor", "Caio Mendes", "Vinícius Barros", "Rodrigo Teixeira", "Daniel Moraes", "Henrique Pires",
  "Fernanda Silva", "Juliana Castro", "Camila Duarte", "Patrícia Lopes", "Aline Freitas", "Beatriz Ramos", "Larissa Melo", "Renata Cardoso", "Carla Monteiro", "Tatiane Vieira",
  "Otávio Brito", "Samuel Cunha", "Igor Batista", "Murilo Farias", "Arthur Campos", "Enzo Rezende"];
// PRNG determinístico (mulberry32): a mesma data gera sempre os mesmos dados
const rng = (seed) => () => { seed |= 0; seed = (seed + 0x6d2b79f5) | 0; let t = Math.imul(seed ^ (seed >>> 15), 1 | seed); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
const hashStr = (s) => { let h = 2166136261; for (const c of s) h = Math.imul(h ^ c.charCodeAt(0), 16777619); return h >>> 0; };
const pad = (n) => String(n).padStart(2, "0");
const dataLocal = (ms) => { const d = new Date(ms - 3 * 3600e3); return `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}`; };
const somaDias = (d, n) => { const x = new Date(d + "T12:00:00Z"); x.setUTCDate(x.getUTCDate() + n); return x.toISOString().slice(0, 10); };
const dow = (d) => new Date(d + "T12:00:00Z").getUTCDay();
const min = (h) => +h.slice(0, 2) * 60 + +h.slice(3, 5);
const hhmm = (m) => `${pad(Math.floor(m / 60))}:${pad(m % 60)}`;
const OCUP = { 0: 0.35, 1: 0.55, 2: 0.45, 3: 0.6, 4: 0.68, 5: 0.82, 6: 0.93 };

export async function gerar(env, agoraMs = Date.now()) {
  const DB = env.DB, hoje = dataLocal(agoraMs);
  const agoraMin = (() => { const d = new Date(agoraMs - 3 * 3600e3); return d.getUTCHours() * 60 + d.getUTCMinutes(); })();
  const resumo = {};
  for (const cli of CLIENTES) {
    const [srv, prf, exp, prod, ctReal, pets, seedDias] = (await DB.batch([
      DB.prepare("SELECT id, nome, duracao_min, preco_centavos, promo_centavos FROM servicos WHERE cliente_id = ? AND ativo = 1 ORDER BY id").bind(cli),
      DB.prepare("SELECT id FROM profissionais WHERE cliente_id = ? AND ativo = 1 ORDER BY id").bind(cli),
      DB.prepare("SELECT profissional_id, dia_semana, inicio, fim FROM expedientes WHERE cliente_id = ?").bind(cli),
      DB.prepare("SELECT id, nome, preco_centavos, custo_centavos FROM produtos WHERE cliente_id = ? AND ativo = 1").bind(cli),
      DB.prepare(`SELECT id FROM contatos WHERE cliente_id = ? AND id NOT BETWEEN ${FAIXA.ct[0]} AND ${FAIXA.ct[1]} ORDER BY id`).bind(cli),
      DB.prepare("SELECT id, contato_id FROM pets WHERE cliente_id = ? AND ativo = 1").bind(cli),
      DB.prepare(`SELECT DISTINCT substr(inicio,1,10) d FROM agendamentos WHERE cliente_id = ? AND id NOT BETWEEN ${FAIXA.ag[0]} AND ${FAIXA.ag[1]}`).bind(cli),
    ])).map((r) => r.results);
    if (!srv.length || !prf.length) { resumo[cli] = "sem serviços/profissionais"; continue; }
    const st = [];
    // 1) remove o que esta rotina gerou antes (só a faixa reservada deste cliente)
    st.push(DB.prepare(`DELETE FROM venda_itens WHERE id BETWEEN ${FAIXA.vi[0]} AND ${FAIXA.vi[1]} AND venda_id IN (SELECT id FROM vendas WHERE cliente_id = ?)`).bind(cli));
    st.push(DB.prepare(`DELETE FROM vendas WHERE cliente_id = ? AND id BETWEEN ${FAIXA.vd[0]} AND ${FAIXA.vd[1]}`).bind(cli));
    st.push(DB.prepare(`DELETE FROM agendamentos WHERE cliente_id = ? AND id BETWEEN ${FAIXA.ag[0]} AND ${FAIXA.ag[1]}`).bind(cli));
    // 2) contatos de demonstração (só a barbearia não tem os seus)
    let contatos = ctReal.map((c) => c.id);
    const petDe = new Map(pets.map((p) => [p.contato_id, p.id]));
    if (cli === 1 && contatos.length < 10) {
      contatos = NOMES.map((_, i) => FAIXA.ct[0] + cli * 100 + i);
      NOMES.forEach((n, i) => st.push(DB.prepare("INSERT OR IGNORE INTO contatos (id, cliente_id, nome, whatsapp, criado_em, aceita_promocoes, origem) VALUES (?,?,?,?,?,1,'demo')")
        .bind(contatos[i], cli, n, `55549911${pad(cli)}${String(i).padStart(3, "0")}`, `${somaDias(hoje, -150 + i * 4)}T13:00:00Z`)));
    }
    if (!contatos.length) { resumo[cli] = "sem contatos"; continue; }
    const jaTem = new Set(seedDias.map((x) => x.d));
    const expDe = new Map(); for (const e of exp) { const k = `${e.profissional_id}:${e.dia_semana}`; if (!expDe.has(k)) expDe.set(k, []); expDe.get(k).push(e); }
    let idAg = FAIXA.ag[0] + cli * 300000, idVd = FAIXA.vd[0] + cli * 20000, idVi = FAIXA.vi[0] + cli * 40000, nAg = 0, nVd = 0;
    // 3) agenda: 56 dias para trás até 14 para a frente (dias que já têm dados próprios ficam como estão)
    for (let k = -56; k <= 14; k++) {
      const dia = somaDias(hoje, k); if (jaTem.has(dia)) continue;
      const R = rng(hashStr(`${cli}:${dia}`)), w = dow(dia);
      const fator = k < 0 ? 1 : k === 0 ? 0.95 : Math.max(0.12, 0.9 - k * 0.065);
      for (const p of prf) {
        for (const e of expDe.get(`${p.id}:${w}`) || []) {
          let t = min(e.inicio); const fim = min(e.fim);
          while (t + 15 <= fim) {
            const s = srv[Math.floor(Math.pow(R(), 1.6) * srv.length)], dur = s.duracao_min || 30;
            if (t + dur > fim) break;
            if (R() < OCUP[w] * fator * (0.85 + R() * 0.3)) {
              // fiéis (início da lista) voltam mais; os últimos 15% somem nas últimas 6 semanas
              let ci = Math.floor(Math.pow(R(), 1.8) * contatos.length);
              if (ci > contatos.length * 0.85 && k > -45) ci = Math.floor(R() * contatos.length * 0.6);
              const contato = contatos[ci], r = R();
              let status = "confirmado";
              if (k < 0 || (k === 0 && t + dur <= agoraMin)) status = r < 0.05 ? "faltou" : r < 0.1 ? "cancelado" : "concluido";
              const valor = s.promo_centavos && R() < 0.3 ? s.promo_centavos : s.preco_centavos;
              const origem = ["vitrine", "painel", "whatsapp", "vitrine", "whatsapp"][Math.floor(R() * 5)];
              st.push(DB.prepare("INSERT INTO agendamentos (id, cliente_id, profissional_id, servico_id, contato_id, inicio, fim, status, valor_centavos, origem, codigo, criado_em, pet_id) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)")
                .bind(idAg, cli, p.id, s.id, contato, `${dia}T${hhmm(t)}`, `${dia}T${hhmm(t + dur)}`, status, valor, origem, `D${idAg.toString(36).toUpperCase()}`, `${somaDias(dia, -Math.floor(R() * 6))}T12:00:00Z`, petDe.get(contato) || null));
              idAg++; nAg++;
            }
            t += dur;
          }
        }
      }
      // 4) vendas de balcão (produtos) nos dias que já passaram
      if (k <= 0 && prod.length && w !== 0) {
        const nv = Math.floor(R() * 3);
        for (let v = 0; v < nv; v++) {
          const pr = prod[Math.floor(R() * prod.length)], q = 1 + Math.floor(R() * 2), hora = 10 + Math.floor(R() * 8);
          if (k === 0 && hora * 60 > agoraMin) continue;
          const forma = ["pix", "credito", "debito", "dinheiro", "pix"][Math.floor(R() * 5)], total = pr.preco_centavos * q;
          st.push(DB.prepare("INSERT INTO vendas (id, cliente_id, codigo, contato_id, status, tipo, subtotal_centavos, desconto_centavos, total_centavos, forma, pago_em, criado_em, obs) VALUES (?,?,?,?, 'paga', 'comanda', ?, 0, ?, ?, ?, ?, 'demonstração')")
            .bind(idVd, cli, `V${idVd.toString(36).toUpperCase()}`, contatos[Math.floor(R() * contatos.length)], total, total, forma, `${dia}T${pad(hora)}:${pad(Math.floor(R() * 60))}`, `${dia}T${pad(hora)}:00`));
          st.push(DB.prepare("INSERT INTO venda_itens (id, venda_id, tipo, ref_id, nome, qtd, unit_centavos, custo_centavos, total_centavos, comissao_centavos) VALUES (?,?, 'produto', ?,?,?,?,?,?,0)")
            .bind(idVi, idVd, pr.id, pr.nome, q, pr.preco_centavos, (pr.custo_centavos || 0) * q, total));
          idVd++; idVi++; nVd++;
        }
      }
    }
    for (let i = 0; i < st.length; i += 90) await DB.batch(st.slice(i, i + 90));
    resumo[cli] = { agendamentos: nAg, vendas: nVd, comandos: st.length };
  }
  return { hoje, resumo };
}

export default {
  async scheduled(_ev, env, ctx) { ctx.waitUntil(gerar(env).then((r) => console.log("demo-vivo", JSON.stringify(r)))); },
  // Sem rota pública. O endereço workers.dev (se ligado) só informa; não gera nada.
  async fetch() { return new Response("lldworks-demo-vivo: atualiza as demonstrações sozinho todo dia às 03:17 (Brasília).", { headers: { "Content-Type": "text/plain; charset=utf-8" } }); },
};
