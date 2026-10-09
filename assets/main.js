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

  // ---------- 3. 渲染版本列表 ----------
  function renderVersions(list){
    const box = document.getElementById('version-list');
    if(!box) return;

    if(!Array.isArray(list) || list.length === 0){
      box.innerHTML = '<p class="muted">暂无版本记录。</p>';
      return;
    }

    const firstAvailableIdx = list.findIndex(v => v.available !== false);

    box.innerHTML = list.map((v, i) => {
      const unavailable = v.available === false;
      const removed = v.removed === true;

      let tag;
      if(removed){
        tag = '<span style="color:#8a8a8a;font-weight:900;font-size:.75rem;letter-spacing:.1em;">永久删除</span>';
      }else if(unavailable){
        tag = '<span style="color:#8a8a8a;font-weight:900;font-size:.75rem;letter-spacing:.1em;">未上传</span>';
      }else if(i === firstAvailableIdx){
        tag = '<span style="color:var(--red);font-weight:900;font-size:.75rem;letter-spacing:.1em;">当前可下载</span>';
      }else{
        tag = '<span class="muted" style="font-size:.75rem;letter-spacing:.1em;">存档</span>';
      }

      // 按钮
      let dlBtn;
      if(removed){
        dlBtn = `<button type="button" class="btn btn-dark" data-removed="${esc(v.version)}" style="font-size:.85rem;padding:.85rem 1.5rem;">已永久删除</button>`;
      }else if(unavailable){
        dlBtn = `<button type="button" class="btn btn-dark" data-unavailable="${esc(v.version)}" style="font-size:.85rem;padding:.85rem 1.5rem;">暂不可下载</button>`;
      }else{
        dlBtn = `<a class="btn ${i === firstAvailableIdx ? '' : 'btn-dark'}" href="${esc(v.apkUrl)}" download style="font-size:.85rem;padding:.85rem 1.5rem;">下载 ${esc(v.version)} →</a>`;
      }

      // SHA 块：有 sha256 就显示（无论是否可下载）
      const shaBlock = v.sha256 ? `
        <details style="margin-top:1rem;">
          <summary class="muted" style="cursor:pointer;font-size:.8rem;">查看 SHA256</summary>
          <code class="code-block" data-copy style="margin-top:.75rem;display:block;font-size:.75rem;">
            ${esc(v.sha256)}
          </code>
        </details>` : '';

      // 状态说明
      let statusNote = '';
      if(removed){
        statusNote = '<p class="muted" style="margin-top:1rem;font-size:.85rem;">该版本安装包已永久删除，无法找回，不提供下载。</p>';
      }else if(unavailable){
        statusNote = '<p class="muted" style="margin-top:1rem;font-size:.85rem;">该版本因上传服务故障暂不可下载，待恢复后开放。</p>';
      }

      return `
        <div class="card" style="margin-bottom:1.25rem;${(unavailable || removed) ? 'opacity:.7;' : ''}">
          <div style="display:flex;justify-content:space-between;align-items:baseline;flex-wrap:wrap;gap:.5rem;">
            <h4 style="color:${(unavailable || removed) ? '#8a8a8a' : 'var(--red)'};font-size:1.1rem;letter-spacing:.05em;text-decoration:${removed ? 'line-through' : 'none'};">${esc(v.version)}</h4>
            ${tag}
          </div>
          <p class="muted" style="margin-top:.75rem;font-size:.85rem;">
            ${esc(v.date)} · ${esc(v.size)}${v.channel ? ' · ' + esc(v.channel) : ''}
          </p>
          ${v.notes ? `<p class="muted" style="margin-top:.75rem;font-size:.9rem;line-height:1.6;">${esc(v.notes)}</p>` : ''}
          ${statusNote}
          ${shaBlock}
          <p style="margin-top:1.25rem;">
            ${dlBtn}
          </p>
        </div>
      `;
    }).join('');

    // 绑定弹窗
    box.querySelectorAll('[data-unavailable]').forEach(btn => {
      btn.addEventListener('click', () => {
        alert(
          '该版本因上传服务故障暂无法下载，请等待恢复。\n\n' +
          '当前可下载：' + (firstAvailableIdx >= 0 ? list[firstAvailableIdx].version : '无')
        );
      });
    });
    box.querySelectorAll('[data-removed]').forEach(btn => {
      btn.addEventListener('click', () => {
        alert(
          '该版本安装包已永久删除，无法找回。\n\n' +
          '当前可下载：' + (firstAvailableIdx >= 0 ? list[firstAvailableIdx].version : '无')
        );
      });
    });

    bindCopy();
  }

  // ---------- 4. 公告 ----------
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