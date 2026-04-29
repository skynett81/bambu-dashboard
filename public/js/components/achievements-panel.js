// Achievements / Gamification Panel
(function() {
  'use strict';

  const RARITY_THRESHOLDS = [
    { pct: 0, label: 'Legendary', color: '#ff8c00', bg: 'rgba(255,140,0,0.1)', border: 'rgba(255,140,0,0.3)' },
    { pct: 0.1, label: 'Epic', color: '#a855f7', bg: 'rgba(168,85,247,0.1)', border: 'rgba(168,85,247,0.3)' },
    { pct: 0.25, label: 'Rare', color: '#3b82f6', bg: 'rgba(59,130,246,0.1)', border: 'rgba(59,130,246,0.3)' },
    { pct: 0.5, label: 'Uncommon', color: '#22c55e', bg: 'rgba(34,197,94,0.1)', border: 'rgba(34,197,94,0.3)' },
    { pct: 1, label: 'Common', color: '#6b7280', bg: 'rgba(107,114,128,0.08)', border: 'rgba(107,114,128,0.2)' }
  ];

  function getRarity(progress) {
    for (const r of RARITY_THRESHOLDS) {
      if (progress <= r.pct) return r;
    }
    return RARITY_THRESHOLDS[RARITY_THRESHOLDS.length - 1];
  }

  const CAT_ICONS = {
    prints: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="6" y="2" width="12" height="8" rx="1"/><rect x="2" y="14" width="20" height="8" rx="1"/></svg>',
    filament: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="3"/></svg>',
    time: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>',
    quality: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg>',
    exploration: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>',
    dedication: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78L12 21.23l8.84-8.84a5.5 5.5 0 000-7.78z"/></svg>',
    milestones: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"/><line x1="4" y1="22" x2="4" y2="15"/></svg>',
    collection: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z"/></svg>'
  };

  window.loadAchievementsPanel = async function() {
    const panel = document.getElementById('overlay-panel-body');
    if (!panel) return;

    try {
      const res = await fetch('/api/achievements');
      const achievements = await res.json();

      const earned = achievements.filter(a => a.earned);
      const inProgress = achievements.filter(a => !a.earned && a.progress > 0);
      const locked = achievements.filter(a => !a.earned && a.progress === 0);

      const categories = ['prints', 'filament', 'time', 'quality', 'exploration', 'dedication', 'milestones', 'collection'];
      const catNames = {
        prints: t('achievements.cat_prints', 'Prints'),
        filament: t('achievements.cat_filament', 'Filament'),
        time: t('achievements.cat_time', 'Time'),
        quality: t('achievements.cat_quality', 'Quality'),
        exploration: t('achievements.cat_exploration', 'Exploration'),
        dedication: t('achievements.cat_dedication', 'Dedication'),
        milestones: t('achievements.cat_milestones', 'Milestones'),
        collection: t('achievements.cat_collection', 'Collection')
      };

      // Per-category stats
      const catStats = {};
      for (const cat of categories) {
        const catAll = achievements.filter(a => a.category === cat);
        const catEarned = catAll.filter(a => a.earned);
        catStats[cat] = { total: catAll.length, earned: catEarned.length };
      }

      // Completion percentage
      const completionPct = achievements.length > 0 ? Math.round(earned.length / achievements.length * 100) : 0;

      // XP/level system (each earned achievement = 100 XP, progress gives partial)
      const totalXP = achievements.reduce((sum, a) => sum + (a.earned ? 100 : Math.round(a.progress * 50)), 0);
      const level = Math.floor(totalXP / 500) + 1;
      const levelXP = totalXP % 500;
      const levelTitles = ['Beginner', 'Novice', 'Apprentice', 'Maker', 'Craftsman', 'Expert', 'Master', 'Grandmaster', 'Legend', 'Mythic'];
      const levelTitle = levelTitles[Math.min(level - 1, levelTitles.length - 1)];

      let h = '<div class="achievements-container"><style>';
      h += `
        .ach-level-bar { display:flex; align-items:center; gap:12px; padding:12px 16px; background:var(--bg-secondary); border:1px solid var(--border-color); border-radius:var(--radius); margin-bottom:12px; }
        .ach-level-badge { width:48px; height:48px; border-radius:50%; display:flex; align-items:center; justify-content:center; font-size:1.2rem; font-weight:800; background:linear-gradient(135deg, var(--accent-blue), var(--accent-purple, #8b5cf6)); color:#fff; flex-shrink:0; }
        .ach-level-info { flex:1; }
        .ach-level-title { font-size:0.85rem; font-weight:700; }
        .ach-level-sub { font-size:0.7rem; color:var(--text-muted); margin-top:2px; }
        .ach-xp-bar { height:6px; background:var(--bg-tertiary); border-radius:3px; margin-top:6px; overflow:hidden; }
        .ach-xp-fill { height:100%; background:linear-gradient(90deg, var(--accent-blue), var(--accent-purple, #8b5cf6)); border-radius:3px; transition:width 0.6s ease; }
        .ach-summary { display:grid; grid-template-columns:repeat(auto-fit, minmax(90px, 1fr)); gap:8px; margin-bottom:12px; }
        .ach-summary-card { text-align:center; padding:10px 6px; background:var(--bg-secondary); border:1px solid var(--border-color); border-radius:var(--radius); }
        .ach-summary-num { font-size:1.3rem; font-weight:800; }
        .ach-summary-label { font-size:0.65rem; color:var(--text-muted); margin-top:2px; }
        .ach-cat-grid { display:grid; grid-template-columns:repeat(auto-fill, minmax(160px, 1fr)); gap:8px; margin-bottom:16px; }
        .ach-cat-card { display:flex; align-items:center; gap:8px; padding:8px 12px; background:var(--bg-secondary); border:1px solid var(--border-color); border-radius:var(--radius); cursor:pointer; transition:border-color 0.2s; }
        .ach-cat-card:hover { border-color:var(--accent-blue); }
        .ach-cat-card.active { border-color:var(--accent-blue); background:rgba(18,121,255,0.05); }
        .ach-cat-icon { width:28px; height:28px; border-radius:6px; display:flex; align-items:center; justify-content:center; background:var(--bg-tertiary); color:var(--text-muted); flex-shrink:0; }
        .ach-cat-info { flex:1; min-width:0; }
        .ach-cat-name { font-size:0.72rem; font-weight:600; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
        .ach-cat-count { font-size:0.62rem; color:var(--text-muted); }
        .ach-cat-bar { height:3px; background:var(--bg-tertiary); border-radius:2px; margin-top:3px; overflow:hidden; }
        .ach-cat-fill { height:100%; background:var(--accent-green); border-radius:2px; }
        .ach-grid { display:grid; grid-template-columns:repeat(auto-fill, minmax(260px, 1fr)); gap:10px; }
        .ach-card { display:flex; gap:10px; padding:12px; border-radius:var(--radius); border:1px solid var(--border-color); background:var(--bg-secondary); transition:transform 0.15s, box-shadow 0.15s; }
        .ach-card:hover { transform:translateY(-1px); box-shadow:0 4px 12px rgba(0,0,0,0.15); }
        .ach-earned { border-color:rgba(34,197,94,0.3); }
        .ach-earned .ach-icon { background:rgba(34,197,94,0.12); }
        .ach-progress .ach-icon { background:rgba(59,130,246,0.1); }
        .ach-locked { opacity:0.5; }
        .ach-locked .ach-icon { background:var(--bg-tertiary); filter:grayscale(1); }
        .ach-icon { width:42px; height:42px; border-radius:10px; display:flex; align-items:center; justify-content:center; font-size:1.4rem; flex-shrink:0; }
        .ach-info { flex:1; min-width:0; }
        .ach-title { font-size:0.8rem; font-weight:700; margin-bottom:2px; }
        .ach-desc { font-size:0.68rem; color:var(--text-muted); line-height:1.3; margin-bottom:4px; }
        .ach-bar { height:4px; background:var(--bg-tertiary); border-radius:2px; overflow:hidden; }
        .ach-bar-fill { height:100%; background:var(--accent-blue); border-radius:2px; transition:width 0.4s ease; }
        .ach-bar-label { font-size:0.6rem; color:var(--text-muted); margin-top:2px; }
        .ach-badge { font-size:0.6rem; font-weight:700; color:var(--accent-green); display:flex; align-items:center; gap:4px; }
        .ach-rarity { font-size:0.55rem; font-weight:600; padding:1px 5px; border-radius:3px; margin-left:auto; }
        .ach-section-title { font-size:0.8rem; font-weight:700; margin:16px 0 8px; padding-bottom:4px; border-bottom:1px solid var(--border-color); display:flex; align-items:center; gap:6px; }
        .ach-section-count { font-size:0.65rem; color:var(--text-muted); font-weight:400; }
        .ach-close-to { display:flex; gap:8px; margin-bottom:12px; overflow-x:auto; padding-bottom:4px; }
        .ach-close-card { flex-shrink:0; width:200px; display:flex; gap:8px; padding:8px 10px; background:var(--bg-secondary); border:1px solid rgba(245,158,11,0.3); border-radius:var(--radius); }
        .ach-close-icon { font-size:1.1rem; }
        .ach-close-info { flex:1; min-width:0; }
        .ach-close-title { font-size:0.7rem; font-weight:600; }
        .ach-close-pct { font-size:0.6rem; color:var(--accent-orange); font-weight:700; }
        .ach-detail-popup { position:fixed; top:50%; left:50%; transform:translate(-50%,-50%); z-index:10000; width:380px; max-width:calc(100vw - 32px); background:var(--bs-body-bg, var(--bg-card)); border:1px solid var(--border-color); border-radius:12px; padding:20px; box-shadow:0 16px 64px rgba(0,0,0,0.5); animation:achPopIn 0.2s ease; }
        @keyframes achPopIn { from { opacity:0; transform:translate(-50%,-50%) scale(0.95); } to { opacity:1; transform:translate(-50%,-50%) scale(1); } }
        .ach-detail-header { display:flex; align-items:center; gap:12px; margin-bottom:12px; }
        .ach-detail-icon { font-size:2.5rem; }
        .ach-detail-title { font-size:1.1rem; font-weight:800; color:var(--text-primary); }
        .ach-detail-cat { font-size:0.75rem; color:var(--text-secondary); }
        .ach-detail-close { margin-left:auto; background:none; border:none; color:var(--text-muted); font-size:1.5rem; cursor:pointer; padding:0 4px; line-height:1; }
        .ach-detail-close:hover { color:var(--text-primary); }
        .ach-detail-desc { font-size:0.85rem; color:var(--text-secondary); line-height:1.5; margin-bottom:12px; }
        .ach-detail-progress-section { margin-bottom:12px; }
        .ach-detail-bar { height:8px; background:var(--bg-tertiary, rgba(255,255,255,0.08)); border-radius:4px; overflow:hidden; }
        .ach-detail-bar-fill { height:100%; border-radius:4px; transition:width 0.4s ease; }
        .ach-detail-stats { display:flex; justify-content:space-between; font-size:0.75rem; color:var(--text-secondary); margin-top:4px; font-weight:600; }
        .ach-detail-grid { display:grid; grid-template-columns:1fr 1fr 1fr; gap:8px; margin-bottom:12px; }
        .ach-detail-stat { text-align:center; padding:10px 4px; background:rgba(255,255,255,0.03); border-radius:8px; }
        .ach-detail-val { display:block; font-size:1rem; font-weight:800; color:var(--text-primary); }
        .ach-detail-lbl { display:block; font-size:0.6rem; color:var(--text-muted); margin-top:2px; }
        .ach-detail-hint { font-size:0.8rem; text-align:center; padding:8px; border-radius:6px; background:rgba(255,255,255,0.02); color:var(--text-secondary); font-style:italic; }
      `;
      h += '</style>';

      // Level bar
      h += `<div class="ach-level-bar">
        <div class="ach-level-badge">${level}</div>
        <div class="ach-level-info">
          <div class="ach-level-title">${esc(levelTitle)}</div>
          <div class="ach-level-sub">${totalXP} XP \u2022 ${t('achievements.earned', 'Earned')}: ${earned.length}/${achievements.length}</div>
          <div class="ach-xp-bar"><div class="ach-xp-fill" style="width:${(levelXP / 500) * 100}%"></div></div>
        </div>
        <div style="text-align:center">
          <div style="font-size:1.4rem;font-weight:800;color:var(--accent-green)">${completionPct}%</div>
          <div style="font-size:0.6rem;color:var(--text-muted)">${t('achievements.completion', 'Completion')}</div>
        </div>
      </div>`;

      // Summary cards
      h += '<div class="ach-summary">';
      h += `<div class="ach-summary-card"><div class="ach-summary-num" style="color:var(--accent-green)">${earned.length}</div><div class="ach-summary-label">${t('achievements.earned', 'Earned')}</div></div>`;
      h += `<div class="ach-summary-card"><div class="ach-summary-num" style="color:var(--accent-blue)">${inProgress.length}</div><div class="ach-summary-label">${t('achievements.in_progress', 'In Progress')}</div></div>`;
      h += `<div class="ach-summary-card"><div class="ach-summary-num" style="color:var(--text-muted)">${locked.length}</div><div class="ach-summary-label">${t('achievements.locked', 'Locked')}</div></div>`;
      h += `<div class="ach-summary-card"><div class="ach-summary-num" style="color:var(--accent-purple, #8b5cf6)">${totalXP}</div><div class="ach-summary-label">XP</div></div>`;
      h += '</div>';

      // Almost there — achievements close to completion
      const almostThere = inProgress.filter(a => a.progress >= 0.7).sort((a, b) => b.progress - a.progress).slice(0, 6);
      if (almostThere.length > 0) {
        h += `<div class="ach-section-title">\u{1F525} ${t('achievements.almost_there', 'Almost There!')}</div>`;
        h += '<div class="ach-close-to">';
        for (const a of almostThere) {
          h += `<div class="ach-close-card">
            <div class="ach-close-icon">${a.icon}</div>
            <div class="ach-close-info">
              <div class="ach-close-title">${esc(a.title)}</div>
              <div class="ach-close-pct">${Math.round(a.progress * 100)}% \u2022 ${a.current}/${a.target}</div>
              <div class="ach-bar" style="margin-top:3px"><div class="ach-bar-fill" style="width:${a.progress * 100}%;background:var(--accent-orange)"></div></div>
            </div>
          </div>`;
        }
        h += '</div>';
      }

      // Category cards (replaces tab bar)
      h += '<div class="ach-cat-grid">';
      h += `<div class="ach-cat-card active" onclick="filterAchievements('all', this)">
        <div class="ach-cat-icon"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2"/><line x1="3" y1="9" x2="21" y2="9"/><line x1="9" y1="21" x2="9" y2="9"/></svg></div>
        <div class="ach-cat-info"><div class="ach-cat-name">${t('common.all', 'All')}</div><div class="ach-cat-count">${earned.length} / ${achievements.length}</div>
          <div class="ach-cat-bar"><div class="ach-cat-fill" style="width:${completionPct}%"></div></div>
        </div>
      </div>`;
      for (const cat of categories) {
        const cs = catStats[cat];
        const pct = cs.total > 0 ? Math.round(cs.earned / cs.total * 100) : 0;
        h += `<div class="ach-cat-card" onclick="filterAchievements('${cat}', this)">
          <div class="ach-cat-icon">${CAT_ICONS[cat] || ''}</div>
          <div class="ach-cat-info"><div class="ach-cat-name">${catNames[cat]}</div><div class="ach-cat-count">${cs.earned} / ${cs.total}</div>
            <div class="ach-cat-bar"><div class="ach-cat-fill" style="width:${pct}%"></div></div>
          </div>
        </div>`;
      }
      h += '</div>';

      // Achievement grid — grouped: earned first, then in progress, then locked
      function renderCard(a) {
        const rarity = getRarity(a.progress);
        const cls = a.earned ? 'ach-card ach-earned' : a.progress > 0 ? 'ach-card ach-progress' : 'ach-card ach-locked';
        const achData = JSON.stringify({ title: a.title, desc: a.desc, icon: a.icon, category: a.category, earned: a.earned, progress: a.progress, current: a.current, target: a.target, xp: a.xp || 0, rarity: rarity.label, rarityColor: rarity.color }).replace(/'/g, '&#39;');
        let card = `<div class="${cls}" data-category="${a.category}" style="cursor:pointer" onclick='showAchievementDetail(${achData})'>`;
        card += `<div class="ach-icon">${a.icon}</div>`;
        card += `<div class="ach-info">`;
        card += `<div style="display:flex;align-items:center;gap:4px"><div class="ach-title">${esc(a.title)}</div>`;
        if (!a.earned) card += `<span class="ach-rarity" style="color:${rarity.color};background:${rarity.bg};border:1px solid ${rarity.border}">${rarity.label}</span>`;
        card += '</div>';
        card += `<div class="ach-desc">${esc(a.desc)}</div>`;
        if (!a.earned) {
          card += `<div class="ach-bar"><div class="ach-bar-fill" style="width:${a.progress * 100}%"></div></div>`;
          card += `<div class="ach-bar-label">${a.current} / ${a.target} (${Math.round(a.progress * 100)}%)</div>`;
        } else {
          card += `<div class="ach-badge"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><polyline points="20 6 9 17 4 12"/></svg> ${t('achievements.earned', 'Earned')}</div>`;
        }
        card += '</div></div>';
        return card;
      }

      if (earned.length > 0) {
        h += `<div class="ach-section-title"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--accent-green)" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg> ${t('achievements.earned', 'Earned')} <span class="ach-section-count">(${earned.length})</span></div>`;
        h += '<div class="ach-grid" id="ach-grid-earned">';
        for (const a of earned) h += renderCard(a);
        h += '</div>';
      }

      if (inProgress.length > 0) {
        h += `<div class="ach-section-title"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--accent-blue)" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg> ${t('achievements.in_progress', 'In Progress')} <span class="ach-section-count">(${inProgress.length})</span></div>`;
        h += '<div class="ach-grid" id="ach-grid-progress">';
        for (const a of inProgress.sort((a, b) => b.progress - a.progress)) h += renderCard(a);
        h += '</div>';
      }

      if (locked.length > 0) {
        h += `<div class="ach-section-title"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" stroke-width="2"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0110 0v4"/></svg> ${t('achievements.locked', 'Locked')} <span class="ach-section-count">(${locked.length})</span></div>`;
        h += '<div class="ach-grid" id="ach-grid-locked">';
        for (const a of locked) h += renderCard(a);
        h += '</div>';
      }

      h += '</div>';
      panel.innerHTML = h;
    } catch (e) {
      panel.innerHTML = emptyState({
        icon: '<svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="12" cy="8" r="5"/><path d="M3 21v-2a7 7 0 0114 0v2"/></svg>',
        title: 'Could not load achievements',
        desc: e.message
      });
    }
  };

  window.showAchievementDetail = function(a) {
    document.querySelectorAll('.ach-detail-popup').forEach(el => el.remove());

    const pct = Math.round((a.progress || 0) * 100);
    const catName = {
      prints: t('achievements.cat_prints', 'Prints'),
      filament: t('achievements.cat_filament', 'Filament'),
      time: t('achievements.cat_time', 'Time'),
      quality: t('achievements.cat_quality', 'Quality'),
      exploration: t('achievements.cat_exploration', 'Exploration'),
      dedication: t('achievements.cat_dedication', 'Dedication'),
      milestones: t('achievements.cat_milestones', 'Milestones'),
      collection: t('achievements.cat_collection', 'Collection')
    }[a.category] || a.category;

    const popup = document.createElement('div');
    popup.className = 'ach-detail-popup';
    popup.innerHTML = `
      <div class="ach-detail-header">
        <div class="ach-detail-icon">${a.icon}</div>
        <div>
          <div class="ach-detail-title">${a.title}</div>
          <div class="ach-detail-cat">${catName} · <span style="color:${a.rarityColor}">${a.rarity}</span></div>
        </div>
        <button class="ach-detail-close" onclick="this.closest('.ach-detail-popup').remove()">×</button>
      </div>
      <div class="ach-detail-desc">${a.desc}</div>
      <div class="ach-detail-progress-section">
        <div class="ach-detail-bar"><div class="ach-detail-bar-fill" style="width:${pct}%;background:${a.earned ? 'var(--accent-green)' : a.rarityColor}"></div></div>
        <div class="ach-detail-stats">
          <span>${a.earned ? '✓ ' + (t('achievements.earned', 'Earned')) : pct + '%'}</span>
          <span>${a.current || 0} / ${a.target || '?'}</span>
        </div>
      </div>
      <div class="ach-detail-grid">
        <div class="ach-detail-stat"><span class="ach-detail-val">${a.xp || 0}</span><span class="ach-detail-lbl">XP</span></div>
        <div class="ach-detail-stat"><span class="ach-detail-val" style="color:${a.rarityColor}">${a.rarity}</span><span class="ach-detail-lbl">${t('achievements.rarity', 'Rarity')}</span></div>
        <div class="ach-detail-stat"><span class="ach-detail-val">${catName}</span><span class="ach-detail-lbl">${t('achievements.category', 'Category')}</span></div>
      </div>
      ${!a.earned ? `<div class="ach-detail-hint">${t('achievements.keep_going', 'Keep going! You are ') + pct + '% there.'}</div>` : `<div class="ach-detail-hint" style="color:var(--accent-green)">${t('achievements.completed_msg', 'Congratulations! Achievement unlocked!')}</div>`}
    `;

    document.body.appendChild(popup);
  };

  window.filterAchievements = function(category, btn) {
    const allCards = document.querySelectorAll('.ach-card');
    const allSections = document.querySelectorAll('.ach-section-title');
    const allGrids = document.querySelectorAll('.ach-grid');
    const catCards = document.querySelectorAll('.ach-cat-card');

    // Update active category card
    catCards.forEach(c => c.classList.remove('active'));
    if (btn) btn.classList.add('active');

    allCards.forEach(c => {
      c.style.display = (category === 'all' || c.dataset.category === category) ? '' : 'none';
    });

    // Show/hide section titles based on visible cards
    allGrids.forEach((grid, i) => {
      const visibleCards = grid.querySelectorAll('.ach-card:not([style*="display: none"])');
      const section = allSections[i];
      if (section) section.style.display = visibleCards.length > 0 ? '' : 'none';
    });
  };
})();
