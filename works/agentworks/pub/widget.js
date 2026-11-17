// AgentWorks — botão de chat para colocar no site do cliente:
// <script src="https://agentworks.lldworks.com.br/pub/widget.js" data-agente="SEU-ENDERECO" async></script>
// Opcional: data-cor="#0E9F6E" e data-texto="Fale conosco".
(() => {
  const s = document.currentScript;
  const slug = s && s.dataset.agente;
  if (!slug || !/^[a-z0-9][a-z0-9-]{2,39}$/.test(slug) || window.__agentworks) return;
  window.__agentworks = true;
  const origem = new URL(s.src).origin, cor = /^#[0-9a-f]{6}$/i.test(s.dataset.cor || "") ? s.dataset.cor : "#0E9F6E";
  const pequeno = () => window.innerWidth < 520;
  const bt = document.createElement("button");
  bt.type = "button"; bt.setAttribute("aria-label", s.dataset.texto || "Abrir o chat de atendimento");
  bt.innerHTML = '<svg viewBox="0 0 24 24" width="28" height="28" aria-hidden="true"><path fill="#fff" d="M4 4h16a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H9l-5 4v-4a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z"/></svg>';
  Object.assign(bt.style, { position: "fixed", right: "20px", bottom: "20px", width: "60px", height: "60px", borderRadius: "50%", border: "0", background: cor, cursor: "pointer", zIndex: "2147483646", boxShadow: "0 10px 30px rgba(0,0,0,.25)", display: "grid", placeItems: "center", transition: "transform .15s" });
  const caixa = document.createElement("div");
  Object.assign(caixa.style, { position: "fixed", zIndex: "2147483647", display: "none", overflow: "hidden", background: "#fff", boxShadow: "0 20px 60px rgba(0,0,0,.3)" });
  const fr = document.createElement("iframe");
  fr.title = "Chat de atendimento"; fr.setAttribute("allow", "clipboard-write");
  Object.assign(fr.style, { width: "100%", height: "100%", border: "0", display: "block" });
  caixa.appendChild(fr);
  function posiciona() {
    if (pequeno()) Object.assign(caixa.style, { inset: "0", width: "100%", height: "100%", borderRadius: "0", right: "", bottom: "" });
    else Object.assign(caixa.style, { inset: "", right: "20px", bottom: "92px", width: "380px", height: "min(620px, calc(100vh - 120px))", borderRadius: "18px" });
  }
  let aberto = false;
  function alterna(v) {
    aberto = v ?? !aberto;
    if (aberto && !fr.src) fr.src = `${origem}/c/${slug}?embed=1`;
    posiciona(); caixa.style.display = aberto ? "block" : "none";
    bt.style.display = aberto && pequeno() ? "none" : "grid";
    bt.setAttribute("aria-expanded", String(aberto));
  }
  bt.addEventListener("click", () => alterna());
  window.addEventListener("message", (e) => { if (e.origin === origem && e.data && e.data.tipo === "agentworks:fechar") alterna(false); });
  window.addEventListener("resize", () => aberto && alterna(true));
  const pronto = () => { document.body.appendChild(caixa); document.body.appendChild(bt); };
  document.body ? pronto() : document.addEventListener("DOMContentLoaded", pronto);
})();
