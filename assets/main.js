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
      console.warn('[config] 拉取失败，使用页面默认值', e);
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
      const isAndroid = ua.includes('android');
      if(!isAndroid){
        btn.textContent = '非 Android 设备 · 仍要下载 →';
        btn.classList.add('btn-dark');
      }
    }
  }

  // ---------- 3. 维护模式 / 公告 ----------
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
          escapeHtml(c.announcement) + '</div>');
      }
    }
  }

  function escapeHtml(s){
    return String(s).replace(/[&<>"']/g, m => ({
      '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'
    })[m]);
  }

  // ---------- 4. 进场动效 ----------
  function reveal(){
    const els = document.querySelectorAll('section,header,footer,.reveal');
    els.forEach((el, i) => {
      el.classList.add('reveal');
      setTimeout(() => el.classList.add('in'), i * 60);
    });
  }

  // ---------- 5. 复制 SHA256 ----------
  function bindCopy(){
    document.querySelectorAll('[data-copy]').forEach(el => {
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

  // ---------- 6. 汉堡菜单 ----------
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