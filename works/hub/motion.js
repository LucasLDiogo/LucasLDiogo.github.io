/* LLD Works Console — movimento (GSAP). Arquivo externo por causa da CSP (script-src 'self').
   Só anima o que app.js já desenhou; não altera dados nem eventos. Desligado com prefers-reduced-motion. */
(() => {
  "use strict";
  if (!window.gsap || matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  document.documentElement.classList.add("gs");
  const view = document.getElementById("view");
  gsap.from(".brand", { y: -10, opacity: 0, duration: .6, ease: "power3.out" });
  gsap.from("nav a", { x: -14, opacity: 0, duration: .45, stagger: .03, ease: "power3.out", delay: .1, clearProps: "transform,opacity" });
  gsap.to(".brand .sg", { scale: 1.3, opacity: .95, transformOrigin: "50% 50%", duration: 1.2, repeat: -1, yoyo: true, ease: "sine.inOut" });
  const brl = (n) => n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
  const countUp = (b) => {
    const txt = b.textContent.trim(), orig = b.innerHTML;
    let alvo, fmt;
    if (/^\d+$/.test(txt)) { alvo = +txt; fmt = (v) => String(Math.round(v)); }
    else if (/^R\$\s?[\d.]+,\d{2}$/.test(txt.replace(/ /g, " "))) { alvo = parseFloat(txt.replace(/[^\d,]/g, "").replace(",", ".")); fmt = brl; }
    else return;
    if (!alvo) return;
    const o = { v: 0 };
    gsap.to(o, { v: alvo, duration: 1.1, ease: "power2.out", onUpdate: () => (b.textContent = fmt(o.v)), onComplete: () => (b.innerHTML = orig) });
  };
  const animar = () => {
    const blocos = view.querySelectorAll(":scope > .top, :scope > .card, :scope > .grid > .card, :scope > .note, :scope > .tabs, :scope > p");
    gsap.fromTo(blocos, { y: 14, opacity: 0 }, { y: 0, opacity: 1, duration: .5, stagger: .045, ease: "power3.out", clearProps: "transform,opacity" });
    gsap.fromTo([...view.querySelectorAll("tbody tr")].slice(0, 24), { opacity: 0, x: -6 }, { opacity: 1, x: 0, duration: .35, stagger: .018, delay: .15, ease: "power2.out", clearProps: "transform,opacity" });
    view.querySelectorAll(".kpi b").forEach(countUp);
    gsap.fromTo(view.querySelectorAll(".bar i"), { scaleX: 0, transformOrigin: "0 50%" }, { scaleX: 1, duration: .9, ease: "power3.out", stagger: .03, clearProps: "transform" });
  };
  new MutationObserver((ms) => {
    if (ms.some((m) => [...m.addedNodes].some((n) => n.nodeType === 1 && !n.classList.contains("carregando")))) animar();
  }).observe(view, { childList: true });
  if (view.firstElementChild && !view.firstElementChild.classList.contains("carregando")) animar();
})();
