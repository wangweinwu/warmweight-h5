/* ============================================================
 * 宠物精灵 · 面板 UI (队伍 / 背包 / 商店 / 图鉴 / 御三家选择)
 * ============================================================ */

/* ---------- 遮罩 & 容器 ---------- */
function ensurePanelRoot() {
  let root = document.getElementById('panel-root');
  if (!root) {
    root = document.createElement('div');
    root.id = 'panel-root';
    document.body.appendChild(root);
  }
  return root;
}
function openPanel(title, html, onMount) {
  const root = ensurePanelRoot();
  root.innerHTML = `
    <div class="overlay">
      <div class="panel">
        <div class="panel-head">
          <h2>${title}</h2>
          <button class="close-btn" onclick="closePanel()">✕ 关闭 (Esc)</button>
        </div>
        <div class="panel-body">${html}</div>
      </div>
    </div>`;
  if (onMount) onMount(root);
  if (game.mode !== 'battle') game.mode = 'panel';
}
function closePanel() {
  const root = ensurePanelRoot();
  root.innerHTML = '';
  if (game.mode === 'panel') game.mode = 'world';
}

/* ---------- 队伍面板 ---------- */
function openTeam() {
  if (!game.player) return;
  const team = game.player.team;
  let html = '<div class="team-grid">';
  team.forEach((mon, i) => {
    const sk = mon.skills.map(s => `<span class="skill-chip" style="border-color:${TYPES[SKILLS[s.id].type].color}">${SKILLS[s.id].name}</span>`).join('');
    const hpPct = Math.max(0, mon.hp / mon.stats.maxHp * 100);
    const statusHtml = mon.status ? `<span class="st">${STATUS_INFO[mon.status][1]} ${STATUS_INFO[mon.status][0]}</span>` : '';
    html += `
    <div class="mon-card ${mon.alive() ? '' : 'fainted'}" onclick="monDetail(${i})">
      <img src="assets/img/${mon.speciesId}.jpg" alt="${mon.name}">
      <div class="mon-info">
        <div class="mon-name">${mon.name} <small>Lv.${mon.level}</small> ${statusHtml}
          <span class="type-badge" style="background:${TYPES[mon.species.type].color}">${TYPES[mon.species.type].name}</span>
        </div>
        <div class="bar"><div class="bar-fill ${hpPct > 50 ? 'g' : hpPct > 20 ? 'y' : 'r'}" style="width:${hpPct}%"></div></div>
        <div class="mono small">${mon.hp}/${mon.stats.maxHp} HP · 经验 ${expToNext(mon)} 到下一级</div>
        <div class="skills">${sk}</div>
        ${mon.pendingLearn && mon.pendingLearn.length ? `<div class="learn-tip">💡 有可替换的新技能!</div>` : ''}
      </div>
    </div>`;
  });
  html += '</div><p class="hint">💡 队伍最多 6 只 · 点击卡片查看详情与替换技能 · 重复挑战道馆可继续拿徽章</p>';
  openPanel('🐾 我的队伍', html);
}

function monDetail(i) {
  const mon = game.player.team[i];
  const statRows = [['HP', mon.stats.maxHp], ['攻击', mon.stats.atk], ['防御', mon.stats.def], ['特攻', mon.stats.spa], ['特防', mon.stats.spd], ['速度', mon.stats.spe]];
  const learnHtml = Object.entries(mon.species.learnset).map(([lv, ss]) => {
    const known = mon.skills.some(x => ss.includes(x.id));
    const pend = mon.pendingLearn && mon.pendingLearn.filter(x => ss.includes(x));
    return `<tr class="${+lv <= mon.level ? (known ? 'known' : 'missed') : 'future'}"><td>Lv.${lv}</td><td>${ss.map(s => SKILLS[s].name).join(' / ')}</td><td>${+lv <= mon.level ? (known ? '✔ 已掌握' : (pend && pend.length ? '🔄 可替换' : '—')) : ''}</td></tr>`;
  }).join('');
  let replaceHtml = '';
  if (mon.pendingLearn && mon.pendingLearn.length) {
    replaceHtml = `<div class="replace-box"><h3>🔄 替换技能</h3><p>选择要遗忘的技能:</p><div class="replace-btns">` +
      mon.skills.map((s, si) => `<button onclick="replaceSkill(${i},${si})">遗忘「${SKILLS[s.id].name}」</button>`).join('') + `</div></div>`;
  }
  openPanel(`${mon.name} · Lv.${mon.level}`, `
    <div class="detail-wrap">
      <img class="detail-img" src="assets/img/${mon.speciesId}.jpg">
      <div>
        <p class="flavor">"${mon.species.flavor}"</p>
        <table class="stats"><tr><th>种族</th><td>${mon.species.name}</td></tr>${statRows.map(r => `<tr><th>${r[0]}</th><td>${r[1]}</td></tr>`).join('')}</table>
      </div>
    </div>
    ${replaceHtml}
    <h3 style="margin:14px 0 8px">📖 技能学习表</h3>
    <table class="learn"><tr><th>等级</th><th>技能</th><th>状态</th></tr>${learnHtml}</table>
  `);
}
function replaceSkill(monIdx, skillIdx) {
  const mon = game.player.team[monIdx];
  const newId = mon.pendingLearn.shift();
  if (newId == null) return;
  const old = SKILLS[mon.skills[skillIdx].id].name;
  mon.skills[skillIdx] = { id: newId, pp: SKILLS[newId].pp, maxPp: SKILLS[newId].pp };
  Sfx.play('levelup');
  saveGame();
  monDetail(monIdx);
  showToast(`${mon.name} 遗忘了「${old}」,学会了「${SKILLS[newId].name}」!`);
}

/* ---------- 背包面板 ---------- */
function openBag() {
  if (!game.player) return;
  const rows = Object.entries(game.player.bag).filter(([k, v]) => v > 0 && BAG[k]);
  const html = rows.length ? '<table class="bag-table"><tr><th>道具</th><th>说明</th><th>数量</th><th></th></tr>' +
    rows.map(([id, n]) => `<tr><td>${BAG[id].name}</td><td>${BAG[id].desc}</td><td>×${n}</td>
      <td>${BAG[id].kind === 'heal' || BAG[id].kind === 'revive' ? `<select onchange="quickUse('${id}', this.value)"><option value="">对…使用</option>${game.player.team.map((m, i) => `<option value="${i}">${m.name} (HP ${m.hp}/${m.stats.maxHp})</option>`).join('')}</select>` : ''}</td></tr>`).join('') + '</table>'
    : '<p class="hint">背包空空如也。去商店(E 面向商店互动)买点道具吧!</p>';
  openPanel('🎒 背包', html + `<p class="hint">💰 当前金币:${game.player.money} · 战斗中按 B 打开战斗背包</p>`);
}
function quickUse(id, monIdxStr) {
  if (monIdxStr === '') return;
  const mon = game.player.team[+monIdxStr];
  const it = BAG[id];
  if (!mon || !it) return;
  if (it.kind === 'heal' && mon.alive() && mon.hp < mon.stats.maxHp) {
    mon.hp = Math.min(mon.stats.maxHp, mon.hp + it.value);
    game.player.bag[id]--; Sfx.play('heal');
    showToast(`${mon.name} 回复了 HP!`);
  } else if (it.kind === 'revive' && !mon.alive()) {
    mon.hp = Math.floor(mon.stats.maxHp / 2); mon.status = null;
    game.player.bag[id]--; Sfx.play('heal');
    showToast(`${mon.name} 复活了!`);
  } else showToast('现在不能使用。');
  openBag(); saveGame();
}

/* ---------- 商店 ---------- */
function openShop() {
  const stock = ['ball', 'greatball', 'potion', 'superpotion', 'revive'];
  const html = '<table class="bag-table"><tr><th>道具</th><th>说明</th><th>价格</th><th></th></tr>' +
    stock.map(id => `<tr><td>${BAG[id].name}</td><td>${BAG[id].desc}</td><td>💰${BAG[id].price}</td>
      <td><button class="buy-btn" onclick="buyItem('${id}')">购买</button></td></tr>`).join('') + '</table>' +
    `<p class="hint">💰 金币:${game.player.money} · 击败训练家和卖艺的野生精灵可获得金币(嗯,其实是道馆奖励)</p>`;
  openPanel('🏪 营地商店', html);
}
function buyItem(id) {
  const p = game.player;
  if (p.money < BAG[id].price) { showToast('金币不足!'); return; }
  p.money -= BAG[id].price;
  p.bag[id] = (p.bag[id] || 0) + 1;
  Sfx.play('buy'); saveGame(); openShop();
  showToast(`买到了 ${BAG[id].name}×1!`);
}

/* ---------- 图鉴 ---------- */
function openDex() {
  const total = Object.keys(SPECIES).length;
  let html = `<p class="hint">已捕获 ${Object.keys(game.player.caught).length} / ${total} · 走进草丛遭遇并捕捉新精灵来补全图鉴吧</p><div class="dex-grid">`;
  Object.entries(SPECIES).forEach(([id, sp]) => {
    const seen = game.player.seen[id], caught = game.player.caught[id];
    html += `<div class="dex-card ${caught ? 'caught' : seen ? 'seen' : 'unseen'}">
      <div class="dex-img"><img src="assets/img/${id}.jpg" alt="${caught || seen ? sp.name : '?'}" style="${seen ? '' : 'filter:brightness(0) opacity(.45)'}"></div>
      <div class="dex-name">${seen ? sp.name : '???'}</div>
      <div><span class="type-badge" style="background:${TYPES[sp.type].color}">${TYPES[sp.type].name}</span></div>
      <div class="dex-no">No.${String(Object.keys(SPECIES).indexOf(id) + 1).padStart(3, '0')}</div>
    </div>`;
  });
  html += '</div>';
  openPanel(`📖 精灵图鉴 (${Object.keys(game.player.caught).length}/${total})`, html);
}

/* ---------- 道馆 ---------- */
const GYM_TRAINERS = [
  { name: '短裤少年小刚', taunt: '我的磐岩犰狳无坚不摧!', species: 'boulderarm', level: 10 },
  { name: '蜜蜂女孩小艳', taunt: '尝尝飞蛾鳞粉的厉害!', species: 'fluttermoth', level: 11 },
  { name: '馆主·石英', taunt: '我是石英道馆的馆主!接招吧!', species: 'boulderarm', level: 13, boss: true },
];
function openGym() {
  const badges = game.player.badges;
  const doneAll = badges >= 1;
  const html = `
    <div class="gym-intro">
      <p>🏟️ <b>石英道馆</b> — 岩石系道馆</p>
      <p>挑战 3 名训练家即可获得「石英徽章」。每场战斗之间你的队伍会自动恢复。</p>
      <p>当前进度:${Math.min(badges, 1)}/1 枚徽章 ${doneAll ? '🏆' : ''}</p>
      <button class="gym-btn" onclick="challengeGym()">${doneAll ? '再次挑战(刷金币)' : '⚔️ 开始挑战'}</button>
    </div>`;
  openPanel('🏟️ 石英道馆', html);
}
function challengeGym() {
  closePanel();
  const gym = { trainers: GYM_TRAINERS, index: 0, done: false };
  const first = gym.trainers[0];
  beginBattle({
    enemy: makeTrainerMon(first.species, first.level),
    isTrainer: true, trainerName: first.name, isGym: true, gym,
    title: `${first.name}:${first.taunt}`,
    rewards: first.boss ? { money: 500, badge: true } : { money: 150 },
  });
}

/* ---------- 开始界面 / 选宠 ---------- */
function openStarterSelection() {
  const starters = ['sproutling', 'emberfox', 'aquatort'];
  const html = `<p class="hint">选择你的第一只伙伴(点击卡片选择):</p><div class="starter-grid">` +
    starters.map(id => `
      <div class="starter-card" onclick="pickStarter('${id}')">
        <img src="assets/img/${id}.jpg">
        <h3>${SPECIES[id].name}</h3>
        <span class="type-badge" style="background:${TYPES[SPECIES[id].type].color}">${TYPES[SPECIES[id].type].name}</span>
        <p class="flavor">"${SPECIES[id].flavor}"</p>
      </div>`).join('') + '</div>';
  openPanel('🎓 新叶镇 · 领取初始精灵', html);
}
function pickStarter(id) {
  const mon = new Mon(id, 5);
  game.player = {
    team: [mon],
    bag: { ball: 8, potion: 3, superpotion: 0, revive: 0, greatball: 0 },
    money: 600,
    seen: { [id]: true }, caught: { [id]: true },
    badges: 0,
  };
  saveGame();
  closePanel();
  Sfx.play('levelup');
  showMsg(`🎉 ${mon.name} 成为了你的伙伴!方向键移动,走进草丛开始冒险吧!`, 5000);
}

/* ---------- Toast ---------- */
let toastTimer = null;
function showToast(text) {
  let el = document.getElementById('toast');
  if (!el) { el = document.createElement('div'); el.id = 'toast'; document.body.appendChild(el); }
  el.textContent = text;
  el.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.remove('show'), 2400);
}

/* ---------- 存档 ---------- */
const SAVE_KEY = 'petmon-save-v1';
function saveGame() {
  if (!game.player) return;
  const p = game.player;
  const data = {
    team: p.team.map(m => ({ speciesId: m.speciesId, level: m.level, exp: m.exp, hp: m.hp, ivs: m.ivs, nickname: m.nickname, skills: m.skills.map(s => ({ id: s.id, pp: s.pp })), pendingLearn: m.pendingLearn || [], status: m.status })),
    bag: p.bag, money: p.money, seen: p.seen, caught: p.caught, badges: p.badges,
    px: game.px, py: game.py, steps: game.steps,
  };
  localStorage.setItem(SAVE_KEY, JSON.stringify(data));
}
function loadGame() {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return false;
    const d = JSON.parse(raw);
    game.player = {
      team: d.team.map(sd => {
        const m = new Mon(sd.speciesId, sd.level, { ivs: sd.ivs, skills: sd.skills.map(s => s.id) });
        m.exp = sd.exp; m.hp = Math.min(m.stats.maxHp, sd.hp); m.nickname = sd.nickname;
        sd.skills.forEach((s, i) => { if (m.skills[i]) m.skills[i].pp = s.pp; });
        m.pendingLearn = sd.pendingLearn; m.status = sd.status;
        return m;
      }),
      bag: d.bag, money: d.money, seen: d.seen, caught: d.caught, badges: d.badges || 0,
    };
    game.px = d.px || 15; game.py = d.py || 6; game.steps = d.steps || 0;
    return game.player.team.length > 0;
  } catch (e) { return false; }
}
window.addEventListener('keydown', e => { if (e.key === 'F5') saveGame(); });
