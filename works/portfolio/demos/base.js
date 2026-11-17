/* Núcleo dos demos LLD Works: login em 2 etapas (demo), topo, abas, toast e utilitários. */
window.LW = (() => {
  const $ = (s, r = document) => r.querySelector(s), $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const brl = v => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  let tt;
  const toast = m => { const t = $('#toast'); t.textContent = m; t.classList.add('on'); clearTimeout(tt); tt = setTimeout(() => t.classList.remove('on'), 2600); };
  const ss = { get(k) { try { return sessionStorage.getItem(k) } catch { return null } }, set(k, v) { try { sessionStorage.setItem(k, v) } catch { } } };

  function init(o) {
    document.documentElement.style.setProperty('--p', o.color);
    document.title = o.name + ' — demo';
    const [pre] = o.name.split('Works');
    const logo = `<span class="brand">${o.icon}<span>${pre}<b>Works</b></span></span>`;
    document.body.insertAdjacentHTML('beforeend', '<div class="toast" id="toast" role="status" aria-live="polite"></div>');

    // Login (protótipo: valida formato; no produto real = Supabase Auth + MFA TOTP)
    $('#auth').innerHTML = `<div class="login">
      <div class="art"><div class="ring"></div><div>${logo.replace('class="brand"', 'class="brand" style="color:#fff"').replace('<b>', '<b style="color:#fff">')}</div>
        <div><h1>${o.loginTitle}</h1><p>${o.loginText}</p><ul>${o.bullets.map(b => `<li>${b}</li>`).join('')}</ul></div>
        <p class="small">Uma solução LLD Works · lldworks.com.br</p></div>
      <div class="frm"><form id="f1" novalidate>
        <h2 style="font-size:24px">Entrar no painel</h2><p class="mute small">Acesso restrito à equipe do estabelecimento.</p>
        <label for="em">E-mail</label><input id="em" type="email" autocomplete="username" value="${o.demoUser}" required>
        <label for="pw">Senha</label><input id="pw" type="password" autocomplete="current-password" value="demo-LLD-2026" required minlength="8">
        <p id="er" class="small" style="color:var(--bad);min-height:20px;margin:6px 0 0"></p>
        <button class="btn pri full" style="margin-top:6px">Continuar</button>
        <div class="row sb small" style="margin-top:10px"><span class="mute">Esqueci minha senha</span><span class="mute">Entrar com Google</span></div>
        <div class="sec"><span class="chip ok">2FA obrigatório p/ admin</span><span class="chip">Sessão expira em 8 h</span><span class="chip">Bloqueio após 5 tentativas</span></div>
        <p class="hint">Demonstração: credenciais já preenchidas; o código 2FA é 123456.</p>
      </form>
      <form id="f2" hidden novalidate><h2 style="font-size:24px">Verificação em 2 etapas</h2>
        <p class="mute small">Digite o código de 6 dígitos do seu app autenticador.</p>
        <div class="otp" style="margin:16px 0">${[0,1,2,3,4,5].map(i => `<input inputmode="numeric" maxlength="1" aria-label="Dígito ${i+1}">`).join('')}</div>
        <button class="btn pri full">Verificar e entrar</button><p class="hint">Demo: use 123456.</p></form></div></div>`;
    const go = () => { $('#auth').hidden = true; $('#app').hidden = false; ss.set('lw_sess', '1'); o.onEnter && o.onEnter(); };
    $('#f1').onsubmit = e => { e.preventDefault(); const em = $('#em').value.trim(), pw = $('#pw').value;
      if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(em)) return $('#er').textContent = 'Informe um e-mail válido.';
      if (pw.length < 8) return $('#er').textContent = 'A senha precisa ter ao menos 8 caracteres.';
      $('#f1').hidden = true; $('#f2').hidden = false; $$('#f2 .otp input')[0].focus(); };
    $$('#f2 .otp input').forEach((i, k, a) => { i.oninput = () => { i.value = i.value.replace(/\D/g, ''); if (i.value && a[k + 1]) a[k + 1].focus(); };
      i.onpaste = e => { const d = (e.clipboardData.getData('text') || '').replace(/\D/g, '').slice(0, 6); if (d.length) { e.preventDefault(); a.forEach((x, j) => x.value = d[j] || ''); } }; });
    $('#f2').onsubmit = e => { e.preventDefault(); const c = $$('#f2 .otp input').map(i => i.value).join('');
      if (c !== '123456') return toast('Código inválido. Na demo, use 123456.'); go(); };

    // Topo e abas
    $('#app').insertAdjacentHTML('afterbegin', `<header class="top">${logo}<span class="sub">${o.sub}</span><span class="sp"></span>
      <span class="demo-tag">Demonstração · dados fictícios</span>
      <span class="user"><span class="av">${o.initials || 'AD'}</span><span class="sub">${o.org}</span></span>
      <button class="btn sm" id="sair">Sair</button></header><nav class="tabs" role="tablist"></nav>`);
    const views = $$('#app .view'), nav = $('#app .tabs');
    nav.innerHTML = views.map((v, i) => `<button class="tab${i ? '' : ' on'}" role="tab" data-i="${i}">${v.dataset.tab}</button>`).join('');
    views[0].classList.add('on');
    nav.onclick = e => { const b = e.target.closest('.tab'); if (b) show(+b.dataset.i); };
    $('#sair').onclick = () => { ss.set('lw_sess', ''); location.hash = ''; location.reload(); };
    if (location.hash === '#painel' || ss.get('lw_sess') === '1') go(); else $('#app').hidden = true;
  }
  function show(i) { $$('#app .tab').forEach((t, k) => t.classList.toggle('on', k === i)); $$('#app .view').forEach((v, k) => v.classList.toggle('on', k === i)); }
  function kanban(root, onMove) {
    root.addEventListener('dragstart', e => { const c = e.target.closest('.kc'); if (c) e.dataTransfer.setData('text/plain', c.dataset.id); });
    root.addEventListener('dragover', e => { const col = e.target.closest('.col'); if (col) { e.preventDefault(); col.classList.add('over'); } });
    root.addEventListener('dragleave', e => { const col = e.target.closest('.col'); if (col) col.classList.remove('over'); });
    root.addEventListener('drop', e => { const col = e.target.closest('.col'); if (!col) return; e.preventDefault(); col.classList.remove('over'); onMove(e.dataTransfer.getData('text/plain'), col.dataset.s); });
  }
  const modal = { open(id) { $('#' + id).classList.add('on'); const f = $('#' + id + ' input,#' + id + ' select'); f && f.focus(); }, close(id) { $('#' + id).classList.remove('on'); } };
  document.addEventListener('keydown', e => { if (e.key === 'Escape') $$('.modal.on').forEach(m => m.classList.remove('on')); });
  document.addEventListener('click', e => { if (e.target.classList && e.target.classList.contains('modal')) e.target.classList.remove('on'); });
  return { init, show, $, $$, brl, esc, toast, kanban, modal };
})();
