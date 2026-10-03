/* ============================================================
 * 宠物精灵 · 战斗 UI + 流程 (Canvas)
 * ============================================================ */

const battle = {
  ctx: null,
  state: null,        // engine state
  phase: 'intro',     // intro | menu | skill | bag | team | anim | message | end
  menuIndex: 0,
  skillIndex: 0,
  bagIndex: 0,
  teamIndex: 0,
  msgQueue: [],
  currentMsg: null,
  onEnd: null,        // 回调(world)
  anim: null,
  shakeUntil: 0,
  flashUntil: 0,
  isGym: false,
  gym: null,
  isTrainer: false,
};

function startWildBattle() {
  const lead = firstAlive();
  const wild = makeWild(3 + Math.floor(game.player.badges * 2.5 + game.steps / 90) || 4);
  beginBattle({ enemy: wild, isTrainer: false, title: `野生 ${wild.name} 出现了!` });
}
function firstAlive() { return game.player.team.find(m => m.alive()); }

function beginBattle(opts) {
  const lead = firstAlive();
  if (!lead) { showMsg('队伍里没有能战斗的精灵!先去休息或使用复活草。'); return; }
  battle.state = {
    playerMon: lead, enemyMon: opts.enemy, logs: [],
    finished: false, enemyFainted: false, playerFainted: false,
    caught: false, ran: false, isTrainer: opts.isTrainer, trainerName: opts.trainerName,
    rewards: opts.rewards || null,
  };
  battle.phase = 'intro';
  battle.isGym = !!opts.isGym;
  battle.gym = opts.gym || null;
  battle.msgQueue = [opts.title, `${lead.name} 就决定是你了!`];
  battle.menuIndex = battle.skillIndex = battle.bagIndex = battle.teamIndex = 0;
  game.mode = 'battle';
  Sfx.play('encounter');
}

function queueMsgs(arr) { battle.msgQueue.push(...arr); }

/* ---------- 战斗输入 ---------- */
function battleKey(e) {
  const ph = battle.phase;
  if (ph === 'message' || ph === 'intro') { advanceMsg(); return; }
  if (ph === 'menu') {
    const items = 4;
    if (e.key === 'ArrowRight') battle.menuIndex = (battle.menuIndex + 1) % items;
    if (e.key === 'ArrowLeft') battle.menuIndex = (battle.menuIndex + items - 1) % items;
    if (e.key === 'ArrowDown') battle.menuIndex = (battle.menuIndex + 1) % items;
    if (e.key === 'ArrowUp') battle.menuIndex = (battle.menuIndex + items - 1) % items;
    if (e.key === ' ' || e.key === 'Enter') chooseMenu(battle.menuIndex);
  } else if (ph === 'skill') {
    const skills = battle.state.playerMon.skills;
    if (e.key === 'ArrowRight' || e.key === 'ArrowDown') battle.skillIndex = (battle.skillIndex + 1) % skills.length;
    if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') battle.skillIndex = (battle.skillIndex + skills.length - 1) % skills.length;
    if (e.key === 'Escape') { battle.phase = 'menu'; return; }
    if (e.key === ' ' || e.key === 'Enter') {
      const sk = skills[battle.skillIndex];
      if (sk.pp <= 0) { queueMsgs(['PP 不足!']); return; }
      doTurn({ kind: 'skill', skillId: sk.id });
    }
  } else if (ph === 'bag') {
    const ids = battleBagIds();
    if (!ids.length) { battle.phase = 'menu'; return; }
    if (e.key === 'ArrowDown') battle.bagIndex = (battle.bagIndex + 1) % ids.length;
    if (e.key === 'ArrowUp') battle.bagIndex = (battle.bagIndex + ids.length - 1) % ids.length;
    if (e.key === 'Escape') { battle.phase = 'menu'; return; }
    if (e.key === ' ' || e.key === 'Enter') {
      const id = ids[battle.bagIndex];
      const it = BAG[id];
      if (it.kind === 'ball') {
        if (battle.state.isTrainer) { queueMsgs(['训练家对战中不能捕捉别人的精灵!']); return; }
        battle.state.ballUsed = id;
        doTurn({ kind: 'ball' });
      } else {
        if (!battle.state.playerMon.alive() && it.kind !== 'revive') { queueMsgs(['当前精灵已倒下,请先换人或复活!']); return; }
        doTurn({ kind: 'item', item: { id, target: battle.state.playerMon } });
      }
    }
  } else if (ph === 'team') {
    const team = game.player.team;
    if (e.key === 'ArrowDown') battle.teamIndex = (battle.teamIndex + 1) % team.length;
    if (e.key === 'ArrowUp') battle.teamIndex = (battle.teamIndex + team.length - 1) % team.length;
    if (e.key === 'Escape') { battle.phase = 'menu'; return; }
    if (e.key === ' ' || e.key === 'Enter') {
      const mon = team[battle.teamIndex];
      if (!mon.alive()) { queueMsgs([`${mon.name} 已失去战斗能力!`]); return; }
      if (mon === battle.state.playerMon) { queueMsgs([`${mon.name} 已经在战斗中了!`]); return; }
      battle.state.playerMon = mon;
      const logs = [];
      logs.push(`回来吧,${battle.state.playerMon === mon ? '' : ''}`);
      logs.push(`就决定是你了,${mon.name}!`);
      // 敌方追打一回合
      const st = battle.state;
      const enemySkill = pickEnemySkill(st.enemyMon, mon);
      doEnemyFreeHit(st, enemySkill, logs);
      queueMsgs(logs);
      battle.phase = 'message';
    }
  } else if (ph === 'end') {
    if (e.key === ' ' || e.key === 'Enter') endBattle();
  }
}

function chooseMenu(i) {
  if (i === 0) battle.phase = 'skill';
  else if (i === 1) { battle.phase = 'bag'; battle.bagIndex = 0; }
  else if (i === 2) { battle.phase = 'team'; battle.teamIndex = 0; }
  else doTurn({ kind: 'run' });
}

function doTurn(action) {
  const st = battle.state;
  st.logs = [];
  executeTurn(action, st);
  // 结算奖励
  if (st.finished) settleBattle(st);
  queueMsgs(st.logs);
  battle.phase = 'message';
}
function doEnemyFreeHit(st, skillId, logs) {
  const sk = SKILLS[skillId];
  const mon = st.playerMon;
  if (st.enemyMon.status === 'frz') { logs.push(`${st.enemyMon.name} 被冻住了!`); return; }
  logs.push(`${st.enemyMon.name} 使用了「${sk.name}」!`);
  if (sk.cat === 'status') { applySkillUserEffect(st.enemyMon, mon, skillId, logs); return; }
  const { dmg, mult, crit } = calcDamage(st.enemyMon, mon, { id: skillId });
  if (mult > 0) {
    mon.hp = Math.max(0, mon.hp - dmg);
    if (crit) logs.push('会心一击!');
    logs.push(effectivenessText(mult));
    battle.shakeUntil = Date.now() + 350;
    if (!mon.alive()) logs.push(`💥 ${mon.name} 倒下了!`);
  }
}

function advanceMsg() {
  if (battle.msgQueue.length) {
    battle.currentMsg = battle.msgQueue.shift();
    return;
  }
  if (battle.currentMsg) { battle.currentMsg = null; return; }
  const st = battle.state;
  if (st.finished) { battle.phase = 'end'; return; }
  if (!st.playerMon.alive()) {
    const next = firstAlive();
    if (next) { st.playerMon = next; battle.msgQueue.push(`就决定是你了,${next.name}!`); battle.currentMsg = null; return; }
  }
  battle.phase = 'menu';
}

/* ---------- 战斗结算 ---------- */
function settleBattle(st) {
  const logs = st.logs;
  if (st.ran) return;
  if (st.caught) {
    if (game.player.team.length < 6) {
      game.player.team.push(st.enemyMon);
      logs.push(`${st.enemyMon.name} 加入了你的队伍!`);
    } else {
      logs.push(`队伍已满,${st.enemyMon.name} 被送去了博士的研究所。`);
    }
    game.player.caught[st.enemyMon.speciesId] = true;
    game.player.seen[st.enemyMon.speciesId] = true;
    return;
  }
  if (st.enemyFainted || !st.enemyMon.alive()) {
    const gain = expFromWild(st.enemyMon) * (st.isTrainer ? 1.5 : 1);
    logs.push(`${st.playerMon.name} 获得了 ${Math.floor(gain)} 点经验值!`);
    grantExp(st.playerMon, Math.floor(gain), logs);
    if (st.rewards) {
      game.player.money += st.rewards.money || 0;
      if (st.rewards.money) logs.push(`💰 获得了 ${st.rewards.money} 金币!`);
      if (st.rewards.item) {
        game.player.bag[st.rewards.item] = (game.player.bag[st.rewards.item] || 0) + 1;
        logs.push(`🎁 获得了 ${BAG[st.rewards.item].name}×1!`);
      }
      if (st.rewards.badge) {
        game.player.badges++;
        logs.push(`🏆 获得了徽章!当前徽章数:${game.player.badges}`);
      }
    }
  }
}
function endBattle() {
  const st = battle.state;
  // 道馆连战推进
  if (battle.isGym && battle.gym && !battle.gym.done && st.enemyFainted) {
    battle.gym.index++;
    if (battle.gym.index >= battle.gym.trainers.length) {
      battle.gym.done = true;
      game.mode = 'world';
      showMsg('🏅 你击败了石英道馆的全部训练家!馆主授予你「石英徽章」!');
      Sfx.play('victory');
      return;
    }
    const nextT = battle.gym.trainers[battle.gym.index];
    healTeam();
    game.mode = 'world';
    setTimeout(() => beginBattle({ enemy: makeTrainerMon(nextT.species, nextT.level), isTrainer: true, trainerName: nextT.name, isGym: true, gym: battle.gym, title: `${nextT.name}:${nextT.taunt}`, rewards: { money: 120 } }), 600);
    return;
  }
  if (!firstAlive() && !st.caught) {
    game.player.money = Math.max(0, game.player.money - 60);
    healTeam();
    game.mode = 'world';
    showMsg('💸 你的队伍全部倒下,仓皇逃回了营地……损失 60 金币,精灵已恢复。');
    return;
  }
  game.mode = 'world';
  game.encounterCooldown = 3;
}
function healTeam() { game.player.team.forEach(m => { m.hp = m.stats.maxHp; m.status = null; m.skills.forEach(s => s.pp = s.maxPp); }); }
function makeTrainerMon(species, level) { return new Mon(species, level, { ivs: Array.from({ length: 6 }, () => 8 + Math.floor(Math.random() * 8)) }); }

function battleBagIds() {
  return Object.keys(game.player.bag).filter(k => game.player.bag[k] > 0 && BAG[k]);
}

/* ---------- 战斗画面 ---------- */
const IMG = {};
function preloadImages() {
  Object.keys(SPECIES).forEach(id => {
    if (!IMG[id]) {
      const im = new Image();
      im.src = 'assets/img_png/' + id + '.png';
      IMG[id] = im;
    }
  });
}

function drawBattleScreen(t) {
  const ctx = game.ctx, cv = game.canvas, st = battle.state;
  // 背景
  const grad = ctx.createLinearGradient(0, 0, 0, cv.height);
  grad.addColorStop(0, '#9fd0ff'); grad.addColorStop(0.62, '#d3ecb4'); grad.addColorStop(1, '#b7e08a');
  ctx.fillStyle = grad; ctx.fillRect(0, 0, cv.width, cv.height);
  // 战斗台
  ctx.fillStyle = '#8ed06a';
  ctx.beginPath(); ctx.ellipse(cv.width * 0.74, cv.height * 0.56, 190, 46, 0, 0, 7); ctx.fill();
  ctx.fillStyle = '#79c258';
  ctx.beginPath(); ctx.ellipse(cv.width * 0.26, cv.height * 0.78, 220, 52, 0, 0, 7); ctx.fill();

  // 精灵立绘
  const drawMon = (mon, x, y, w, flip, isFoe) => {
    const img = IMG[mon.speciesId];
    const bob = Math.sin(t / 420 + (isFoe ? 1 : 0)) * 5;
    ctx.save();
    ctx.translate(x, y + bob);
    if (flip) ctx.scale(-1, 1);
    if (img && img.complete && img.naturalWidth) {
      ctx.drawImage(img, -w / 2, -w, w, w);
    } else {
      ctx.fillStyle = '#999'; ctx.beginPath(); ctx.arc(0, -w / 2, w / 2.4, 0, 7); ctx.fill();
      ctx.fillStyle = '#fff'; ctx.font = 'bold 18px sans-serif'; ctx.textAlign = 'center';
      ctx.fillText(mon.species.name[0], 0, -w / 2);
    }
    ctx.restore();
    if (!mon.alive()) {
      ctx.fillStyle = 'rgba(40,40,40,0.45)';
      ctx.fillRect(x - w / 2, y - w * 0.2, w, w * 0.2);
    }
  };
  const shakeP = Date.now() < battle.shakeUntil ? Math.sin(Date.now() / 18) * 7 : 0;
  drawMon(st.enemyMon, cv.width * 0.74 + shakeP, cv.height * 0.56, 190, false, true);
  drawMon(st.playerMon, cv.width * 0.26 - shakeP, cv.height * 0.78, 230, true, false);

  // HP 条
  drawHpCard(ctx, cv.width * 0.74 - 95, cv.height * 0.16, st.enemyMon, false);
  drawHpCard(ctx, 24, cv.height * 0.60, st.playerMon, true);

  // 状态徽章
  statusBadge(ctx, st.enemyMon, cv.width * 0.74 + 60, cv.height * 0.16 + 34);
  statusBadge(ctx, st.playerMon, 24 + 190, cv.height * 0.60 + 34);

  // 对话框 / 菜单
  if (battle.phase === 'message' || battle.phase === 'intro') {
    const text = battle.currentMsg || '…';
    dialogBox(ctx, cv, text, true);
  } else if (battle.phase === 'menu') {
    drawBattleMenu(ctx, cv);
  } else if (battle.phase === 'skill') {
    drawSkillMenu(ctx, cv);
  } else if (battle.phase === 'bag') {
    drawBagMenu(ctx, cv);
  } else if (battle.phase === 'team') {
    drawTeamSwitch(ctx, cv);
  } else if (battle.phase === 'end') {
    const st2 = battle.state;
    let text = '战斗结束!按 空格 继续';
    if (st2.caught) text = `成功捕捉了 ${st2.enemyMon.name}!按 空格 继续`;
    else if (st2.ran) text = '成功逃走了!按 空格 继续';
    else if (st2.enemyFainted || !st2.enemyMon.alive()) text = '你赢了!🎉 按 空格 继续';
    else text = '你输了……按 空格 继续';
    dialogBox(ctx, cv, text, false);
  }
}

function drawHpCard(ctx, x, y, mon, showExp) {
  const w = 200, h = showExp ? 64 : 52;
  ctx.fillStyle = 'rgba(248,247,240,0.94)';
  roundRect(ctx, x, y, w, h, 8); ctx.fill();
  ctx.strokeStyle = '#4a5568'; ctx.lineWidth = 2; roundRect(ctx, x, y, w, h, 8); ctx.stroke();
  ctx.fillStyle = '#333'; ctx.font = 'bold 14px system-ui'; ctx.textAlign = 'left';
  ctx.fillText(`${mon.name}`, x + 10, y + 18);
  ctx.font = '12px system-ui'; ctx.fillStyle = '#666';
  ctx.fillText(`Lv.${mon.level}`, x + w - 44, y + 18);
  // HP
  const ratio = Math.max(0, mon.hp / mon.stats.maxHp);
  ctx.fillStyle = '#545b66'; roundRect(ctx, x + 10, y + 26, w - 20, 10, 4); ctx.fill();
  ctx.fillStyle = ratio > 0.5 ? '#4cd964' : ratio > 0.2 ? '#ffc107' : '#ff5252';
  if (ratio > 0) { roundRect(ctx, x + 10, y + 26, (w - 20) * ratio, 10, 4); ctx.fill(); }
  if (showExp) {
    const er = Math.min(1, (mon.exp - expForLevel(mon.level)) / Math.max(1, expForLevel(mon.level + 1) - expForLevel(mon.level)));
    ctx.fillStyle = '#8a94a6'; roundRect(ctx, x + 10, y + 42, w - 56, 6, 3); ctx.fill();
    ctx.fillStyle = '#5b9cf5'; if (er > 0) { roundRect(ctx, x + 10, y + 42, (w - 56) * er, 6, 3); ctx.fill(); }
    ctx.font = '11px system-ui'; ctx.fillStyle = '#444'; ctx.textAlign = 'right';
    ctx.fillText(`${mon.hp}/${mon.stats.maxHp}`, x + w - 8, y + 49);
  } else {
    ctx.font = '11px system-ui'; ctx.fillStyle = '#444'; ctx.textAlign = 'right';
    ctx.fillText(`${mon.hp}/${mon.stats.maxHp}`, x + w - 10, y + 42);
  }
}
function statusBadge(ctx, mon, x, y) {
  if (!mon.status) return;
  const [label, icon] = STATUS_INFO[mon.status];
  ctx.fillStyle = '#a26bf2';
  roundRect(ctx, x, y, 46, 18, 4); ctx.fill();
  ctx.fillStyle = '#fff'; ctx.font = 'bold 11px system-ui'; ctx.textAlign = 'center';
  ctx.fillText(icon + ' ' + label, x + 23, y + 13);
}
function dialogBox(ctx, cv, text, indicator) {
  ctx.fillStyle = 'rgba(248,247,240,0.96)';
  roundRect(ctx, 16, cv.height - 118, cv.width - 32, 100, 10); ctx.fill();
  ctx.strokeStyle = '#4a5568'; ctx.lineWidth = 2.5; roundRect(ctx, 16, cv.height - 118, cv.width - 32, 100, 10); ctx.stroke();
  ctx.fillStyle = '#2d3748'; ctx.font = '16px system-ui'; ctx.textAlign = 'left';
  const lines = wrapText(ctx, text || ' ', cv.width - 80);
  lines.slice(0, 3).forEach((l, i) => ctx.fillText(l, 36, cv.height - 86 + i * 26));
  if (indicator) {
    if (Math.floor(Date.now() / 400) % 2 === 0) {
      ctx.fillStyle = '#e04b3a';
      ctx.beginPath();
      const bx = cv.width - 48, by = cv.height - 40;
      ctx.moveTo(bx, by); ctx.lineTo(bx + 18, by); ctx.lineTo(bx + 9, by + 12);
      ctx.closePath(); ctx.fill();
    }
  }
}
const MENU_ITEMS = ['⚔️ 战斗', '🎒 背包', '🐾 精灵', '🏃 逃跑'];
function drawBattleMenu(ctx, cv) {
  ctx.fillStyle = 'rgba(248,247,240,0.96)';
  roundRect(ctx, 16, cv.height - 118, cv.width - 32, 100, 10); ctx.fill();
  ctx.strokeStyle = '#4a5568'; ctx.lineWidth = 2.5; roundRect(ctx, 16, cv.height - 118, cv.width - 32, 100, 10); ctx.stroke();
  const bw = (cv.width - 32 - 60) / 4;
  MENU_ITEMS.forEach((label, i) => {
    const x = 40 + i * (bw + 8);
    const y = cv.height - 96;
    const sel = i === battle.menuIndex;
    ctx.fillStyle = sel ? '#ffe9b8' : '#f3ede0';
    roundRect(ctx, x, y, bw, 60, 8); ctx.fill();
    ctx.strokeStyle = sel ? '#e08a00' : '#b9b2a4'; ctx.lineWidth = sel ? 3 : 1.5;
    roundRect(ctx, x, y, bw, 60, 8); ctx.stroke();
    ctx.fillStyle = sel ? '#7a4c00' : '#555';
    ctx.font = 'bold 17px system-ui'; ctx.textAlign = 'center';
    ctx.fillText(label, x + bw / 2, y + 36);
  });
}
function drawSkillMenu(ctx, cv) {
  const mon = battle.state.playerMon;
  ctx.fillStyle = 'rgba(248,247,240,0.96)';
  roundRect(ctx, 16, cv.height - 168, cv.width - 32, 150, 10); ctx.fill();
  ctx.strokeStyle = '#4a5568'; ctx.lineWidth = 2.5; roundRect(ctx, 16, cv.height - 168, cv.width - 32, 150, 10); ctx.stroke();
  ctx.font = '12px system-ui'; ctx.fillStyle = '#888'; ctx.textAlign = 'right';
  ctx.fillText('Esc 返回', cv.width - 30, cv.height - 150 + 0);
  const n = mon.skills.length;
  const bw = (cv.width - 32 - 80) / Math.max(2, Math.min(4, n));
  mon.skills.forEach((s, i) => {
    const sk = SKILLS[s.id];
    const x = 44 + i * (bw + 8);
    const y = cv.height - 138;
    const sel = i === battle.skillIndex;
    const disabled = s.pp <= 0;
    ctx.fillStyle = sel ? '#e8f4ff' : '#f6f1e6';
    roundRect(ctx, x, y, bw, 92, 8); ctx.fill();
    ctx.strokeStyle = sel ? '#2f7fd6' : '#b9b2a4'; ctx.lineWidth = sel ? 3 : 1.5;
    roundRect(ctx, x, y, bw, 92, 8); ctx.stroke();
    ctx.fillStyle = '#333'; ctx.font = 'bold 15px system-ui'; ctx.textAlign = 'left';
    ctx.fillText(sk.name, x + 10, y + 22);
    // 属性色点
    ctx.fillStyle = TYPES[sk.type].color;
    roundRect(ctx, x + 10, y + 32, 34, 18, 4); ctx.fill();
    ctx.fillStyle = '#fff'; ctx.font = '11px system-ui'; ctx.textAlign = 'center';
    ctx.fillText(TYPES[sk.type].name, x + 27, y + 45);
    ctx.fillStyle = '#666'; ctx.font = '12px system-ui'; ctx.textAlign = 'left';
    ctx.fillText(`威力 ${sk.power || '-'} · 命中 ${sk.acc}`, x + 10, y + 64);
    ctx.fillText(`PP ${s.pp}/${s.maxPp}`, x + 10, y + 82);
    if (disabled) { ctx.fillStyle = 'rgba(200,200,200,0.5)'; roundRect(ctx, x, y, bw, 92, 8); ctx.fill(); }
  });
}
function drawBagMenu(ctx, cv) {
  const ids = battleBagIds();
  ctx.fillStyle = 'rgba(248,247,240,0.96)';
  roundRect(ctx, 16, cv.height - 218, 340, 200, 10); ctx.fill();
  ctx.strokeStyle = '#4a5568'; ctx.lineWidth = 2.5; roundRect(ctx, 16, cv.height - 218, 340, 200, 10); ctx.stroke();
  ctx.fillStyle = '#333'; ctx.font = 'bold 15px system-ui'; ctx.textAlign = 'left';
  ctx.fillText('🎒 背包 (Esc 返回)', 34, cv.height - 194);
  if (!ids.length) {
    ctx.fillStyle = '#999'; ctx.font = '14px system-ui';
    ctx.fillText('背包空空如也……', 34, cv.height - 160);
    return;
  }
  ids.slice(0, 6).forEach((id, i) => {
    const it = BAG[id];
    const y = cv.height - 172 + i * 28;
    const sel = i === battle.bagIndex;
    if (sel) { ctx.fillStyle = '#ffe9b8'; roundRect(ctx, 26, y - 17, 320, 26, 4); ctx.fill(); }
    ctx.fillStyle = '#444'; ctx.font = '14px system-ui';
    ctx.fillText(`${it.name} ×${game.player.bag[id]}`, 38, y);
    ctx.fillStyle = '#999'; ctx.font = '12px system-ui';
  });
}
function drawTeamSwitch(ctx, cv) {
  const team = game.player.team;
  ctx.fillStyle = 'rgba(248,247,240,0.96)';
  roundRect(ctx, cv.width - 356, cv.height - 292, 340, 274, 10); ctx.fill();
  ctx.strokeStyle = '#4a5568'; ctx.lineWidth = 2.5; roundRect(ctx, cv.width - 356, cv.height - 292, 340, 274, 10); ctx.stroke();
  ctx.fillStyle = '#333'; ctx.font = 'bold 15px system-ui'; ctx.textAlign = 'left';
  ctx.fillText('🐾 更换精灵 (Esc 返回)', cv.width - 338, cv.height - 268);
  team.forEach((mon, i) => {
    const y = cv.height - 246 + i * 40;
    const sel = i === battle.teamIndex;
    const cur = mon === battle.state.playerMon;
    if (sel) { ctx.fillStyle = '#ffe9b8'; roundRect(ctx, cv.width - 346, y - 22, 320, 36, 6); ctx.fill(); }
    // 缩略图
    const img = IMG[mon.speciesId];
    if (img && img.complete) ctx.drawImage(img, cv.width - 342, y - 18, 30, 30);
    ctx.fillStyle = mon.alive() ? '#333' : '#b00';
    ctx.font = 'bold 14px system-ui';
    ctx.fillText(`${mon.name} Lv.${mon.level}${cur ? ' (战斗中)' : ''}`, cv.width - 306, y - 4);
    // 小血条
    const r = Math.max(0, mon.hp / mon.stats.maxHp);
    ctx.fillStyle = '#545b66'; roundRect(ctx, cv.width - 306, y + 3, 130, 8, 3); ctx.fill();
    ctx.fillStyle = r > 0.5 ? '#4cd964' : r > 0.2 ? '#ffc107' : '#ff5252';
    if (r > 0) roundRect(ctx, cv.width - 306, y + 3, 130 * r, 8, 3), ctx.fill();
  });
}
