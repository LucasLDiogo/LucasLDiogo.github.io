// Vitrine de exemplos ao vivo: troca de site, computador/celular e link para abrir em nova aba.
(() => {
  "use strict";
  const $ = (s) => document.querySelector(s), $$ = (s) => [...document.querySelectorAll(s)];
  const fr = $("#dFrame"), mol = $("#moldura"), url = $("#dUrl"), abrir = $("#dAbrir");
  function vai(b) {
    $$(".d-abas button").forEach((x) => x.setAttribute("aria-selected", String(x === b)));
    $$("[data-info]").forEach((d) => (d.hidden = d.dataset.info !== b.dataset.site));
    if (fr.src !== b.dataset.url) fr.src = b.dataset.url;
    fr.title = "Exemplo " + b.textContent;
    url.textContent = b.dataset.url.replace("https://", "");
    abrir.href = b.dataset.url;
    history.replaceState(null, "", "?site=" + b.dataset.site + (mol.classList.contains("m") ? "&tela=celular" : ""));
  }
  function tela(m) {
    $$(".d-disp button").forEach((x) => x.setAttribute("aria-pressed", String((x.dataset.disp === "m") === m)));
    mol.classList.toggle("m", m);
    const at = $(".d-abas button[aria-selected=true]");
    history.replaceState(null, "", "?site=" + at.dataset.site + (m ? "&tela=celular" : ""));
  }
  $$(".d-abas button").forEach((b) => b.addEventListener("click", () => vai(b)));
  $$(".d-disp button").forEach((b) => b.addEventListener("click", () => tela(b.dataset.disp === "m")));
  const q = new URLSearchParams(location.search);
  const ini = $$(".d-abas button").find((b) => b.dataset.site === q.get("site"));
  if (ini) vai(ini);
  if (q.get("tela") === "celular" || matchMedia("(max-width:640px)").matches) tela(true);
})();
