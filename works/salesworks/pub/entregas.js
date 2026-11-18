// SalesWorks — página do entregador (link próprio, sem senha): lista os pedidos atribuídos e marca saiu/entregue.
(() => {
"use strict";
const $ = (s) => document.querySelector(s);
const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const brl = (c) => ((c || 0) / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
const tk = (location.pathname.match(/\/entregas\/([a-f0-9]{24})/) || [])[1];
const PAG = { pix: "Pix", dinheiro: "Dinheiro", cartao: "Cartão (maquininha)", online: "Pago online" };
const toast = (m, t = "") => { const d = document.createElement("div"); d.className = "toast " + t; d.textContent = m; $("#toasts").append(d); setTimeout(() => d.remove(), 4000); };
async function carrega() {
  const r = await fetch(`/api/publico/entregas/${tk}`); const d = await r.json().catch(() => ({}));
  if (!r.ok) { $("#app").innerHTML = `<h1>Link indisponível</h1><p>${esc(d.erro || "Peça um novo link para a loja.")}</p>`; return; }
  document.documentElement.style.setProperty("--c", d.loja.cor || "#EA580C");
  const abertos = d.pedidos.filter((p) => p.status !== "entregue"), feitos = d.pedidos.filter((p) => p.status === "entregue");
  const cartao = (p) => { const end = [p.endereco, p.bairro, p.complemento].filter(Boolean).join(", "); const cobrar = !p.pago && p.pagamento !== "online";
    return `<section class="pe ${p.status === "entregue" ? "feito" : ""}"><h2>#${p.numero} · ${esc(p.nome)}<span>${p.status === "saiu" ? "A caminho" : p.status === "entregue" ? "Entregue" : "Pronto"}</span></h2>
     <p>${esc(end || "Retirada")}${p.referencia ? `<br><small>Ref.: ${esc(p.referencia)}</small>` : ""}</p>${p.agendado_para ? `<p>📅 ${esc(p.agendado_para.slice(8, 10) + "/" + p.agendado_para.slice(5, 7) + " " + p.agendado_para.slice(11))}</p>` : ""}
     <p><b>${cobrar ? "Cobrar " + brl(p.total) : "Já pago"}</b> · ${PAG[p.pagamento]}${p.troco_para && cobrar ? ` · troco para ${brl(p.troco_para)} (levar ${brl(p.troco_para - p.total)})` : ""}</p>${p.observacoes ? `<p class="alerta">${esc(p.observacoes)}</p>` : ""}
     ${p.status !== "entregue" ? `<div class="g2"><a class="b" target="_blank" rel="noopener" href="https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(end)}">Abrir rota</a>${p.whatsapp ? `<a class="b zap" target="_blank" rel="noopener" href="https://wa.me/${esc(p.whatsapp)}?text=${encodeURIComponent(`Oi, ${p.nome.split(" ")[0]}! Sou o entregador da ${d.loja.nome} com o pedido #${p.numero}.`)}">WhatsApp</a>` : ""}</div>
     <p></p>${p.status === "pronto" ? `<button class="b" data-a="saiu" data-id="${p.id}">Saí para entrega</button>` : ""}<button class="b pri" data-a="entregue" data-id="${p.id}">Entreguei ✓</button>` : ""}</section>`; };
  $("#app").innerHTML = `<p style="font-weight:800;color:var(--c2);margin:0">${esc(d.loja.nome)}</p><h1>Entregas de ${esc(d.entregador)}</h1><p class="dica">Atualiza sozinho a cada 30 segundos.</p>
   ${abertos.length ? abertos.map(cartao).join("") : `<div class="vazio">Nenhuma entrega agora. 🎉</div>`}${feitos.length ? `<h2 style="margin-top:22px;font-size:17px">Entregues hoje (${feitos.length})</h2>${feitos.map(cartao).join("")}` : ""}`;
}
document.addEventListener("click", async (e) => {
  const b = e.target.closest("[data-a]"); if (!b) return;
  if (b.dataset.a === "entregue" && !confirm("Confirmar que o pedido foi entregue?")) return;
  b.disabled = true;
  const r = await fetch(`/api/publico/entregas/${tk}/${b.dataset.id}`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ acao: b.dataset.a }) });
  const d = await r.json().catch(() => ({}));
  if (r.ok) { toast(b.dataset.a === "entregue" ? "Entrega confirmada!" : "Boa viagem!"); carrega(); } else { b.disabled = false; toast(d.erro || "Não deu certo.", "err"); }
});
carrega(); setInterval(carrega, 30000);
})();
