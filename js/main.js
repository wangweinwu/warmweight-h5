/* ============================================================
 * 宠物精灵 · 主入口 (事件分发 / 启动)
 * ============================================================ */

/* 战斗阶段的键盘走 battleKey;其余走 worldLoop 轮询 */
window.addEventListener('keydown', e => {
  if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' '].includes(e.key)) e.preventDefault();
  if (game.mode === 'battle') battleKey(e);
  else if (game.mode === 'panel') {
    if (e.key === 'Escape') closePanel();
    return;
  }
});
window.addEventListener('keyup', e => { game.keys[e.key] = false; });

/* 战斗里的菜单音效 */
const _origChoose = null;

/* 移动端按钮 → 注入按键事件 */
document.querySelectorAll('#mobile-pad button').forEach(btn => {
  const k = btn.dataset.k;
  const press = ev => { ev.preventDefault(); dispatchKey(k, true); };
  const release = ev => { ev.preventDefault(); dispatchKey(k, false); };
  btn.addEventListener('touchstart', press, { passive: false });
  btn.addEventListener('touchend', release, { passive: false });
  btn.addEventListener('mousedown', press);
  btn.addEventListener('mouseup', release);
});
function dispatchKey(k, down) {
  if (game.mode === 'battle') {
    if (down) battleKey({ key: k, preventDefault() {} });
    return;
  }
  if (down) game.keys[k] = true; else game.keys[k] = false;
}

/* 图鉴按钮:世界模式下按 P */
window.addEventListener('keydown', e => {
  if ((e.key === 'p' || e.key === 'P') && game.mode === 'world' && game.player) openDex();
});

/* 自动存档:战斗结束 / 面板关闭 / 每 20 秒 */
setInterval(() => { if (game.player) saveGame(); }, 20000);
window.addEventListener('beforeunload', () => { if (game.player) saveGame(); });

function wipeSave() {
  if (!confirm('确定清除存档并重新开始吗?')) return;
  localStorage.removeItem(SAVE_KEY);
  location.reload();
}

/* ---------- 启动 ---------- */
window.addEventListener('load', () => {
  initGame('game-canvas');
  preloadImages();
  const had = loadGame();
  if (had) {
    showMsg(`欢迎回来!队伍:${game.player.team[0].name} Lv.${game.player.team[0].level}`, 3200);
  } else {
    openStarterSelection();
  }
});
