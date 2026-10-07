/* ============================================
   虚空终端 AZ 版 — 站点脚本
   ============================================ */

(function(){
  'use strict';

  // ---------- 1. 拉取 config.json ----------
  async function loadConfig(){
    try{
      const r = await fetch('/config.json?t=' + Date.now(), {cache:'no-store'});
      if(!r.ok) throw new Error('HTTP ' + r.status);
      return await r.json();
    }catch(e){
      console.warn('[config] 拉取失败', e);
      return null;
    }
  }

  // ---------- 2. 填充下载页 ----------
  function fillDownload(c){
    if(!c) return;
    const set = (id, txt) => {
      const el = document.getElementById(id);
      if(el) el.textContent = txt || '—';
    };

    set('ver', c.latestVersion);
    set('size', c.apkSize);
    set('date', c.releaseDate);
    set('sha', c.apkSha256);
    set('android-min', c.androidMin);
    set('android-target', c.androidTarget);
    set('req-min', c.androidMin);
    set('req-target', c.androidTarget);
    set('req-size', c.apkSize);

    const btn = document.getElementById('dl-btn');
    if(btn){
      btn.href = c.apkUrl || c.downloadUrl || '#';
      btn.setAttribute('download','');

      const ua = navigator.userAgent.toLowerCase();
      if(!ua.includes('android')){
        btn.textContent = '非 Android 设备 · 仍要下载 →';
        btn.classList.add('btn-dark');
      }
    }

    renderVersions(c.versions);
  }

  // ---------- 3. 渲染历史版本列表 ----------
  function renderVersions(list){
    const box = document.getElementById('version-list');
    if(!box) return;

    if(!Array.isArray(list) || list.length === 0){
      box.innerHTML = '<p class="muted">暂无历史版本。</p>';
      return;
    }

    box.innerHTML = list.map((v, i) => {
      const isLatest = i === 0;
      const tag = isLatest
        ? '<span style="color:var(--red);font-weight:900;font-size:.75rem;letter-spacing:.1em;">最新</span>'
        : '<span class="muted" style="font-size:.75rem;letter-spacing:.1em;">存档</span>';

      return `
        <div class="card" style="margin-bottom:1.25rem;">
          <div style="display:flex;justify-content:space-between;align-items:baseline;flex-wrap:wrap;gap:.5rem;">
            <h4 style="color:var(--red);font-size:1.1rem;letter-spacing:.05em;">${esc(v.version)}</h4>
            ${tag}
          </div>
          <p class="muted" style="margin-top:.75rem;font-size:.85rem;">
            ${esc(v.date)} · ${esc(v.size)}${v.channel ? ' · ' + esc(v.channel) : ''}
          </p>
          ${v.notes ? `<p class="muted" style="margin-top:.75rem;font-size:.9rem;line-height:1.6;">${esc(v.notes)}</p>` : ''}
          <details style="margin-top:1rem;">
            <summary class="muted" style="cursor:pointer;font-size:.8rem;">查看 SHA256</summary>
            <code class="code-block" data-copy style="margin-top:.75rem;display:block;font-size:.75rem;">
              ${esc(v.sha256)}
            </code>
          </details>
          <p style="margin-top:1.25rem;">
            <a class="btn ${isLatest ? '' : 'btn-dark'}" href="${esc(v.apkUrl)}" download style="font-size:.85rem;padding:.85rem 1.5rem;">
              下载 ${esc(v.version)} →
            </a>
          </p>
        </div>
      `;
    }).join('');

    // 重新绑定复制
    bindCopy();
  }

  // ---------- 4. 维护模式 / 公告 ----------
  function fillBanner(c){
    if(!c) return;

    if(c.maintenanceMode){
      document.body.insertAdjacentHTML('afterbegin',
        '<div class="alert" style="text-align:center;padding:1rem;">' +
        '维护中 · MAINTENANCE</div>');
    }

    if(c.announcement && c.announcement.trim()){
      const bar = document.querySelector('.top-bar');
      if(bar){
        bar.insertAdjacentHTML('afterend',
          '<div style="padding:1rem 1.25rem;color:#8a8a8a;' +
          'border-bottom:3px solid #1a1a1a;letter-spacing:.05em;font-size:.9rem;">' +
          esc(c.announcement) + '</div>');
      }
    }
  }

  function esc(s){
    return String(s == null ? '' : s).replace(/[&<>"']/g, m => ({
      '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'
    })[m]);
  }

  // ---------- 5. 进场动效 ----------
  function reveal(){
    const els = document.querySelectorAll('section,header,footer,.reveal');
    els.forEach((el, i) => {
      el.classList.add('reveal');
      setTimeout(() => el.classList.add('in'), i * 60);
    });
  }

  // ---------- 6. 复制 ----------
  function bindCopy(){
    document.querySelectorAll('[data-copy]').forEach(el => {
      if(el.dataset.bound) return;
      el.dataset.bound = '1';
      el.style.cursor = 'pointer';
      el.title = '点击复制';
      el.addEventListener('click', () => {
        const txt = el.textContent.trim();
        navigator.clipboard?.writeText(txt).then(() => {
          const old = el.textContent;
          el.textContent = '已复制 ✓';
          setTimeout(() => el.textContent = old, 1200);
        });
      });
    });
  }

  // ---------- 7. 汉堡菜单 ----------
  function bindNav(){
    const toggle = document.querySelector('.nav-toggle');
    const menu = document.querySelector('.nav-menu');
    if(!toggle || !menu) return;

    toggle.addEventListener('click', () => {
      const open = menu.classList.toggle('open');
      toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
    });

    menu.querySelectorAll('a').forEach(a => {
      a.addEventListener('click', () => {
        if(window.innerWidth < 768){
          menu.classList.remove('open');
          toggle.setAttribute('aria-expanded','false');
        }
      });
    });
  }

  // ---------- 启动 ----------
  document.addEventListener('DOMContentLoaded', async () => {
    const c = await loadConfig();
    fillDownload(c);
    fillBanner(c);
    reveal();
    bindCopy();
    bindNav();
  });
})();