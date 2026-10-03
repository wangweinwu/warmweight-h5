/* ============================================================
 * 宠物精灵 · 世界地图 + 玩法主循环 (Canvas)
 * ============================================================ */
const TILE = 44;
const MAPW = 30, MAPH = 22;

/* 地图符号: #树 ~水 ,草丛(遇敌) .路 r路标 H房子 S商店入口 G道馆入口 */
const MAP_LAYOUT = [
  '##############################',
  '##############################',
  '##....~~~~~.....#####........##',
  '#..,..~~~~~~..,..###..,..,...##',
  '#.....~~~~~~......H..........##',
  '#..,....~~~....,..#....,.,...##',
  '#..........,,.....#..........##',
  '#.,...#........,..#...,,..,..##',
  '#.....#..,.......S#..........##',
  '#.,,..#........,..#####..#####',
  '#.....#....,.....#...#..#...,#',
  '##.###############...#..#...,##',
  '##.#..........,..#...#..#....##',
  '##.#..,....,.....#...#..#..,..#',
  '##.#........,,...#...#..#....##',
  '##.#..,....,.....G...#..#..,.#',
  '##.#.............#...#..#....##',
  '##.#..,......,..#....#..#....##',
  '##.#############.....#..######',
  '##...................#.....,##',
  '##..,.....,....,.....#......##',
  '##############################',
];

const TILE_DEFS = {
  '#': { solid: true, base: '#2e7d46', top: '#3fa160', deco: 'tree' },
  '~': { solid: true, base: '#3d9be9', deco: 'water' },
  '.': { solid: false, base: '#c9e6a8' },
  ',': { solid: false, base: '#a9d67f', deco: 'tallgrass' },
  'H': { solid: true, base: '#c9e6a8', deco: 'house' },
  'S': { solid: true, base: '#c9e6a8', deco: 'shop' },
  'G': { solid: true, base: '#c9e6a8', deco: 'gym' },
  'r': { solid: false, base: '#d9c9a0', deco: 'sign' },
};

const game = {
  ctx: null, canvas: null,
  px: 15, py: 6,            // 玩家出生点(新手村草地上)
  keys: {},
  mode: 'world',            // world | battle | team | bag | start | gym
  facing: 'down',
  steps: 0,
  encounterCooldown: 0,
  player: null,             // { team:[Mon], bag:{}, money, balls, seen, caught }
  battle: null,
  msg: null,
  camera: { x: 0, y: 0 },
};

function tileAt(x, y) {
  if (x < 0 || y < 0 || x >= MAPW || y >= MAPH) return '#';
  return MAP_LAYOUT[y][x];
}
function isSolid(x, y) {
  const t = tileAt(x, y);
  return TILE_DEFS[t] && TILE_DEFS[t].solid;
}

/* ---------- 输入 ---------- */
const DIRS = { ArrowUp: [0, -1], ArrowDown: [0, 1], ArrowLeft: [-1, 0], ArrowRight: [1, 0] };
window.addEventListener('keydown', e => {
  if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' '].includes(e.key)) e.preventDefault();
  game.keys[e.key] = true;
  if (e.key === 'Escape') { if (game.mode === 'team' || game.mode === 'bag') closePanel(); }
});
window.addEventListener('keyup', e => { game.keys[e.key] = false; });

/* ---------- 移动与遇敌 ---------- */
function tryMove(dx, dy) {
  game.facing = dy < 0 ? 'up' : dy > 0 ? 'down' : dx < 0 ? 'left' : 'right';
  const nx = game.px + dx, ny = game.py + dy;
  if (isSolid(nx, ny)) return;
  game.px = nx; game.py = ny;
  game.steps++;
  game.encounterCooldown = Math.max(0, game.encounterCooldown - 1);
  const t = tileAt(nx, ny);
  if (t === ',' && game.encounterCooldown === 0 && Math.random() < 0.14) {
    startWildBattle();
  }
}

/* ---------- 交互 ---------- */
function interact() {
  const d = { up: [0, -1], down: [0, 1], left: [-1, 0], right: [1, 0] }[game.facing];
  const tx = game.px + d[0], ty = game.py + d[1];
  const t = tileAt(tx, ty);
  if (t === 'S') { openShop(); return; }
  if (t === 'G') { openGym(); return; }
  if (t === 'H') { showMsg('这是你的家。妈妈:「路上小心,记得常回家看看!」'); return; }
  if (t === 'r') { showMsg('路标:→ 东边是商业营地(S) | ↓ 南边是石英道馆(G) | 草丛里有野生精灵出没'); return; }
  // 4向再扫一格(站在建筑旁)
  showMsg('这里什么也没有。去草丛里走走,或按 E 与面前的设施互动。');
}

/* ---------- 循环 ---------- */
let moveTick = 0;
function worldLoop() {
  const k = game.keys;
  let dx = 0, dy = 0;
  if (k.ArrowUp) dy = -1; else if (k.ArrowDown) dy = 1;
  if (k.ArrowLeft) dx = -1; else if (k.ArrowRight) dx = 1;
  if ((dx || dy) && game.moveCd <= 0) {
    tryMove(dx, dy);
    game.moveCd = 9; // 移动节奏(帧)
  }
  if (game.moveCd > 0) game.moveCd--;
  if (k['e'] || k['E']) { interact(); game.keys['e'] = game.keys['E'] = false; }
  if (k['t'] || k['T']) { openTeam(); game.keys['t'] = game.keys['T'] = false; }
  if (k['b'] || k['B']) { openBag(); game.keys['b'] = game.keys['B'] = false; }
}
game.moveCd = 0;

/* ---------- 渲染 ---------- */
function drawWorld() {
  const ctx = game.ctx, cv = game.canvas;
  ctx.fillStyle = '#1d2b1f';
  ctx.fillRect(0, 0, cv.width, cv.height);
  // 摄像机(玩家居中)
  const camX = game.px * TILE + TILE / 2 - cv.width / 2;
  const camY = game.py * TILE + TILE / 2 - cv.height / 2;
  const x0 = Math.max(0, Math.floor(camX / TILE)), y0 = Math.max(0, Math.floor(camY / TILE));
  const x1 = Math.min(MAPW - 1, Math.ceil((camX + cv.width) / TILE)), y1 = Math.min(MAPH - 1, Math.ceil((camY + cv.height) / TILE));
  for (let y = y0; y <= y1; y++) {
    for (let x = x0; x <= x1; x++) {
      const def = TILE_DEFS[tileAt(x, y)];
      const sx = x * TILE - camX, sy = y * TILE - camY;
      ctx.fillStyle = def.base;
      ctx.fillRect(sx, sy, TILE, TILE);
      if (def.deco === 'tree') {
        ctx.fillStyle = '#5b3a24'; ctx.fillRect(sx + TILE * 0.42, sy + TILE * 0.5, TILE * 0.16, TILE * 0.5);
        ctx.beginPath(); ctx.fillStyle = '#2f8747'; ctx.arc(sx + TILE / 2, sy + TILE * 0.42, TILE * 0.42, 0, 7); ctx.fill();
        ctx.beginPath(); ctx.fillStyle = '#3c9c56'; ctx.arc(sx + TILE * 0.38, sy + TILE * 0.34, TILE * 0.26, 0, 7); ctx.fill();
      } else if (def.deco === 'water') {
        ctx.strokeStyle = 'rgba(255,255,255,0.35)'; ctx.lineWidth = 2;
        ctx.beginPath();
        const ph = (Date.now() / 600 + x * 1.7 + y * 2.3) % (Math.PI * 2);
        ctx.moveTo(sx + 6, sy + TILE * 0.5 + Math.sin(ph) * 3);
        ctx.quadraticCurveTo(sx + TILE / 2, sy + TILE * 0.35 + Math.sin(ph) * 3, sx + TILE - 6, sy + TILE * 0.5 + Math.cos(ph) * 3);
        ctx.stroke();
      } else if (def.deco === 'tallgrass') {
        ctx.strokeStyle = '#7fb56a'; ctx.lineWidth = 3;
        for (let i = 0; i < 4; i++) {
          const gx = sx + 8 + i * 9, gy = sy + TILE - 6;
          ctx.beginPath(); ctx.moveTo(gx, gy); ctx.quadraticCurveTo(gx + 3, gy - 12, gx + (i % 2 ? 6 : -3), gy - 17); ctx.stroke();
        }
      } else if (def.deco === 'house') {
        ctx.fillStyle = '#e8d9b0'; ctx.fillRect(sx + 5, sy + TILE * 0.42, TILE - 10, TILE * 0.55);
        ctx.beginPath(); ctx.moveTo(sx + 2, sy + TILE * 0.45); ctx.lineTo(sx + TILE / 2, sy + 4); ctx.lineTo(sx + TILE - 2, sy + TILE * 0.45); ctx.closePath();
        ctx.fillStyle = '#c14b3a'; ctx.fill();
        ctx.fillStyle = '#7a5230'; ctx.fillRect(sx + TILE * 0.42, sy + TILE * 0.62, TILE * 0.16, TILE * 0.35);
      } else if (def.deco === 'shop') {
        ctx.fillStyle = '#f0e2c0'; ctx.fillRect(sx + 4, sy + TILE * 0.35, TILE - 8, TILE * 0.6);
        ctx.fillStyle = '#3a7bd5'; ctx.fillRect(sx + 4, sy + TILE * 0.35, TILE - 8, TILE * 0.16);
        ctx.fillStyle = '#fff'; ctx.font = 'bold 13px sans-serif'; ctx.textAlign = 'center';
        ctx.fillText('$', sx + TILE / 2, sy + TILE * 0.48);
        ctx.fillStyle = '#7a5230'; ctx.fillRect(sx + TILE * 0.4, sy + TILE * 0.6, TILE * 0.2, TILE * 0.35);
      } else if (def.deco === 'gym') {
        ctx.fillStyle = '#cfc6b8'; ctx.fillRect(sx + 3, sy + TILE * 0.3, TILE - 6, TILE * 0.65);
        ctx.fillStyle = '#8e4436'; ctx.beginPath(); ctx.moveTo(sx, sy + TILE * 0.34); ctx.lineTo(sx + TILE / 2, sy); ctx.lineTo(sx + TILE, sy + TILE * 0.34); ctx.closePath(); ctx.fill();
        ctx.fillStyle = '#f5c542'; ctx.font = 'bold 16px sans-serif'; ctx.textAlign = 'center';
        ctx.fillText('⚔', sx + TILE / 2, sy + TILE * 0.75);
      }
    }
  }
  // 玩家
  const psx = game.px * TILE - camX, psy = game.py * TILE - camY;
  ctx.fillStyle = 'rgba(0,0,0,0.25)';
  ctx.beginPath(); ctx.ellipse(psx + TILE / 2, psy + TILE * 0.9, TILE * 0.3, TILE * 0.12, 0, 0, 7); ctx.fill();
  ctx.fillStyle = '#e04b3a';
  ctx.fillRect(psx + TILE * 0.28, psy + TILE * 0.35, TILE * 0.44, TILE * 0.5); // 身体
  ctx.fillStyle = '#f2c9a0';
  ctx.beginPath(); ctx.arc(psx + TILE / 2, psy + TILE * 0.3, TILE * 0.24, 0, 7); ctx.fill(); // 头
  ctx.fillStyle = '#3a2a1a';
  ctx.beginPath(); ctx.arc(psx + TILE / 2, psy + TILE * 0.18, TILE * 0.25, Math.PI, 0); ctx.fill(); // 帽子
  ctx.fillStyle = '#fff';
  ctx.beginPath(); ctx.arc(psx + TILE / 2, psy + TILE * 0.18, TILE * 0.25, Math.PI, Math.PI * 1.5); ctx.closePath(); ctx.fill(); // 帽檐
}

/* ---------- HUD ---------- */
function drawHud() {
  const ctx = game.ctx, cv = game.canvas;
  ctx.fillStyle = 'rgba(20,26,34,0.82)';
  roundRect(ctx, 10, 10, 300, 92, 10); ctx.fill();
  ctx.fillStyle = '#fff'; ctx.textAlign = 'left'; ctx.font = '13px system-ui';
  const lead = game.player.team.find(m => m.alive());
  ctx.fillText(`🧭 方向键移动 · E 互动 · T 队伍 · B 背包`, 22, 32);
  ctx.fillText(`💰 ${game.player.money}   🎒 精灵球×${game.player.bag.ball || 0} 高级球×${game.player.bag.greatball || 0}`, 22, 52);
  ctx.fillText(`⭐ 图鉴: ${Object.keys(game.player.caught).length}/${Object.keys(SPECIES).length} 已捕获 · 图鉴`, 22, 72);
  ctx.fillText(`🎖 队长: ${lead ? lead.name + ' Lv.' + lead.level : '无'}`, 22, 92);
}
function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

/* ---------- 消息 toast ---------- */
function showMsg(text, ms = 2600) {
  game.msg = { text, until: Date.now() + ms };
}
function drawMsg() {
  if (!game.msg || Date.now() > game.msg.until) { game.msg = null; return; }
  const ctx = game.ctx, cv = game.canvas;
  ctx.fillStyle = 'rgba(15,20,28,0.88)';
  const w = Math.min(cv.width - 40, 640);
  ctx.font = '15px system-ui';
  const lines = wrapText(ctx, game.msg.text, w - 40);
  const h = 30 + lines.length * 22;
  const x = (cv.width - w) / 2, y = cv.height - h - 26;
  roundRect(ctx, x, y, w, h, 10); ctx.fill();
  ctx.fillStyle = '#fff';
  lines.forEach((l, i) => ctx.fillText(l, x + 20, y + 26 + i * 22));
}
function wrapText(ctx, text, maxW) {
  const lines = []; let cur = '';
  for (const ch of text) {
    if (ctx.measureText(cur + ch).width > maxW) { lines.push(cur); cur = ch; }
    else cur += ch;
  }
  if (cur) lines.push(cur);
  return lines;
}

/* ---------- 主循环 ---------- */
let lastT = 0;
function frame(t) {
  const dt = t - lastT; lastT = t;
  const cv = game.canvas, ctx = game.ctx;
  if (game.mode === 'world') { worldLoop(); drawWorld(); drawHud(); drawMsg(); }
  else if (game.mode === 'battle') { drawBattleScreen(t); }
  requestAnimationFrame(frame);
}

function initGame(canvasId) {
  game.canvas = document.getElementById(canvasId);
  game.ctx = game.canvas.getContext('2d');
  game.ctx.imageSmoothingEnabled = true;
  requestAnimationFrame(frame);
}
