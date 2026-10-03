/* ============================================================
 * 宠物精灵 · 核心逻辑 (属性/成长/战斗引擎)
 * ============================================================ */

/* ---------- 属性工具 ---------- */
function typeMultiplier(attackType, defenderTypes) {
  let m = 1;
  for (const dt of defenderTypes) {
    if (TYPES[attackType].beats.includes(dt)) m *= 2;
    if (TYPES[dt].beats.includes(attackType)) m *= 0.5;
  }
  return m;
}
function effectivenessText(m) {
  if (m === 0) return '没有效果……';
  if (m >= 4) return '效果拔群至极!!';
  if (m >= 2) return '效果拔群!';
  if (m <= 0.25) return '收效甚微……';
  if (m < 1) return '效果不理想……';
  return '';
}

/* ---------- 精灵实例 ---------- */
let MON_COUNTER = 0;
class Mon {
  constructor(speciesId, level, opts = {}) {
    this.uid = ++MON_COUNTER;
    this.speciesId = speciesId;
    this.species = SPECIES[speciesId];
    this.level = level;
    this.nickname = opts.nickname || null;
    this.ivs = opts.ivs || Array.from({ length: 6 }, () => 1 + Math.floor(Math.random() * 15));
    const g = (base, iv) => Math.floor(((base + iv) * 2 * level) / 100) + 5;
    const hpCalc = (base, iv) => Math.floor(((base + iv) * 2 * level) / 100) + level + 10;
    const b = this.species.base, iv = this.ivs;
    this.stats = { maxHp: hpCalc(b[0], iv[0]), atk: g(b[1], iv[1]), def: g(b[2], iv[2]), spa: g(b[3], iv[3]), spd: g(b[4], iv[4]), spe: g(b[5], iv[5]) };
    this.hp = this.stats.maxHp;
    this.exp = expForLevel(level);
    this.skills = (opts.skills || this.learnableAt(level)).map(id => ({ id, pp: SKILLS[id].pp, maxPp: SKILLS[id].pp }));
    this.stages = { atk: 0, def: 0, spa: 0, spd: 0, spe: 0 };
    this.status = null; // 'psn' | 'brn' | 'par' | 'frz'
    this.statusCounter = 0;
  }
  get name() { return this.nickname || this.species.name; }
  get types() { return [this.species.type]; }
  learnableAt(level) {
    const list = [];
    Object.entries(this.species.learnset).forEach(([lv, skills]) => {
      if (+lv <= level) skills.forEach(s => { if (!list.includes(s)) list.push(s); });
    });
    return list.slice(-4);
  }
  nextLevelSkills(targetLevel) {
    const out = [];
    Object.entries(this.species.learnset).forEach(([lv, skills]) => {
      if (+lv === targetLevel) out.push(...skills);
    });
    return out;
  }
  stageMul(s) {
    const st = this.stages[s];
    return st >= 0 ? (2 + st) / 2 : 2 / (2 - st);
  }
  effStat(s) {
    let v = this.stats[s] * this.stageMul(s);
    if (this.status === 'brn' && s === 'atk') v *= 0.5;
    if (this.status === 'par' && s === 'spe') v *= 0.5;
    return Math.max(1, Math.floor(v));
  }
  alive() { return this.hp > 0; }
  hpRatio() { return this.hp / this.stats.maxHp; }
}
function expForLevel(lv) { return Math.floor((6 * lv ** 3) / 5); }
function expToNext(mon) { return expForLevel(mon.level + 1) - mon.exp; }
function grantExp(mon, amount, logs) {
  mon.exp += amount;
  let leveled = false;
  while (mon.level < 50 && mon.exp >= expForLevel(mon.level + 1)) {
    mon.level++;
    leveled = true;
    const old = mon.stats;
    const b = mon.species.base, iv = mon.ivs;
    const g = (base, iv0) => Math.floor(((base + iv0) * 2 * mon.level) / 100) + 5;
    mon.stats = { maxHp: Math.floor(((b[0] + iv[0]) * 2 * mon.level) / 100) + mon.level + 10, atk: g(b[1], iv[1]), def: g(b[2], iv[2]), spa: g(b[3], iv[3]), spd: g(b[4], iv[4]), spe: g(b[5], iv[5]) };
    mon.hp = Math.min(mon.stats.maxHp, mon.hp + (mon.stats.maxHp - old.maxHp));
    logs.push(`🎉 ${mon.name} 升到了 Lv.${mon.level}!`);
    const newSkills = mon.nextLevelSkills(mon.level);
    newSkills.forEach(skid => {
      if (mon.skills.length < 4) {
        mon.skills.push({ id: skid, pp: SKILLS[skid].pp, maxPp: SKILLS[skid].pp });
        logs.push(`${mon.name} 学会了新技能「${SKILLS[skid].name}」!`);
      } else {
        logs.push(`${mon.name} 已经领悟了「${SKILLS[skid].name}」,但技能栏已满 (可在宠物面板中替换)。`);
        mon.pendingLearn = mon.pendingLearn || [];
        if (!mon.pendingLearn.includes(skid)) mon.pendingLearn.push(skid);
      }
    });
    if (mon.species.evolveTo && mon.level >= mon.species.evolveLevel && mon.speciesId !== mon.species.evolveTo) {
      const from = mon.species.name;
      mon.speciesId = mon.species.evolveTo;
      mon.species = SPECIES[mon.speciesId];
      const b2 = mon.species.base, iv2 = mon.ivs;
      const g = (base, iv0) => Math.floor(((base + iv0) * 2 * mon.level) / 100) + 5;
      mon.stats = { maxHp: Math.floor(((b2[0] + iv2[0]) * 2 * mon.level) / 100) + mon.level + 10, atk: g(b2[1], iv2[1]), def: g(b2[2], iv2[2]), spa: g(b2[3], iv2[3]), spd: g(b2[4], iv2[4]), spe: g(b2[5], iv2[5]) };
      mon.hp = Math.min(mon.stats.maxHp, mon.hp + 20);
      logs.push(`✨ 恭喜!${from} 进化成了 ${mon.species.name}!`);
    }
  }
  return leveled;
}

/* ---------- 伤害公式 ---------- */
function calcDamage(attacker, defender, skill) {
  if (SKILLS[skill.id].power === 0) return { dmg: 0, mult: 1 };
  const mult = typeMultiplier(SKILLS[skill.id].type, defender.types);
  if (mult === 0) return { dmg: 0, mult };
  const A = SKILLS[skill.id].cat === 'phys' ? attacker.effStat('atk') : attacker.effStat('spa');
  const D = SKILLS[skill.id].cat === 'phys' ? defender.effStat('def') : defender.effStat('spd');
  const critChance = 1 / 16 * (SKILLS[skill.id].critBonus || 1);
  const crit = Math.random() < critChance;
  const rand = 0.85 + Math.random() * 0.15;
  let dmg = Math.floor((((2 * attacker.level / 5 + 2) * SKILLS[skill.id].power * A / D) / 50 + 2) * mult * rand * (crit ? 1.6 : 1));
  return { dmg: Math.max(1, dmg), mult, crit };
}

function applySkillUserEffect(user, target, skillId, logs) {
  const sk = SKILLS[skillId];
  if (sk.heal) {
    const h = Math.floor(user.stats.maxHp * sk.heal);
    user.hp = Math.min(user.stats.maxHp, user.hp + h);
    logs.push(`${user.name} 回复了 ${h} 点 HP。`);
  }
  if (sk.buff) {
    const before = user.stages[sk.buff.stat];
    user.stages[sk.buff.stat] = Math.min(4, before + sk.buff.stages);
    if (user.stages[sk.buff.stat] !== before)
      logs.push(`${user.name} 的${statName(sk.buff.stat)}提升了!`);
  }
  if (sk.debuff && target && target.alive()) {
    const before = target.stages[sk.debuff.stat];
    target.stages[sk.debuff.stat] = Math.max(-4, before - sk.debuff.stages);
    if (target.stages[sk.debuff.stat] !== before)
      logs.push(`${target.name} 的${statName(sk.debuff.stat)}下降了!`);
  }
}
function statName(s) { return { atk: '攻击', def: '防御', spa: '特攻', spd: '特防', spe: '速度' }[s] || s; }

function applySecondary(user, target, sk, logs, dealt) {
  if (!sk.secondary || !target.alive()) return;
  const sec = sk.secondary;
  if (sec === 'burn20' && Math.random() < 0.2) setStatus(target, 'brn', logs);
  if (sec === 'para20' && Math.random() < 0.2) setStatus(target, 'par', logs);
  if (sec === 'frz10' && Math.random() < 0.1) setStatus(target, 'frz', logs);
  if (sec === 'psn40' && Math.random() < 0.4) setStatus(target, 'psn', logs);
  if (sec === 'psn30' && Math.random() < 0.3) setStatus(target, 'psn', logs);
  if (sec === 'slow10') {
    target.stages.spe = Math.max(-4, target.stages.spe - 1);
    logs.push(`${target.name} 的速度下降了!`);
  }
  if (sec === 'recoil25' && dealt > 0) {
    const r = Math.max(1, Math.floor(dealt * 0.25));
    user.hp = Math.max(0, user.hp - r);
    logs.push(`${user.name} 受到了反作用力伤害 ${r} 点。`);
  }
}
const STATUS_INFO = { psn: ['中毒', '☠️'], brn: ['灼伤', '🔥'], par: ['麻痹', '⚡'], frz: ['冰冻', '❄️'] };
function setStatus(mon, st, logs) {
  if (mon.status) return;
  mon.status = st;
  logs.push(`${mon.name} 陷入了${STATUS_INFO[st][0]}状态! (${STATUS_INFO[st][1]})`);
}
function endOfTurn(mon, logs) {
  if (!mon.alive()) return;
  if (mon.status === 'psn' || mon.status === 'brn') {
    const d = Math.max(1, Math.floor(mon.stats.maxHp / 12));
    mon.hp = Math.max(0, mon.hp - d);
    logs.push(`${mon.name} 因${STATUS_INFO[mon.status][0]}受到了 ${d} 点伤害。`);
  }
  if (mon.status === 'frz' && Math.random() < 0.25) {
    mon.status = null;
    logs.push(`${mon.name} 的冰冻解除了!`);
  }
}

/* ---------- 回合制引擎 ---------- */
function executeTurn(playerAction, state) {
  // state: { playerMon, enemyMon, logs }
  const { playerMon, enemyMon, logs } = state;
  const enemySkill = pickEnemySkill(enemyMon, playerMon);
  const playerSkillEntry = playerAction.kind === 'skill' ? playerMon.skills.find(s => s.id === playerAction.skillId) : null;

  const actions = [];
  if (playerAction.kind === 'skill') actions.push({ side: 'player', mon: playerMon, foe: enemyMon, skillId: playerAction.skillId, skillEntry: playerSkillEntry, priority: SKILLS[playerAction.skillId].priority });
  else actions.push({ side: 'player', mon: playerMon, foe: enemyMon, item: playerAction.item, priority: 6 });
  actions.push({ side: 'enemy', mon: enemyMon, foe: playerMon, skillId: enemySkill, skillEntry: enemyMon.skills.find(s => s.id === enemySkill), priority: SKILLS[enemySkill].priority });

  actions.sort((a, b) => b.priority - a.priority || b.mon.effStat('spe') - a.mon.effStat('spe') || (Math.random() < 0.5 ? -1 : 1));

  for (const act of actions) {
    if (state.finished) break;
    if (!act.mon.alive()) continue;
    // 玩家方道具
    if (act.side === 'player' && act.item) { useItem(state, act.item, logs); continue; }
    // 捕捉
    if (act.side === 'player' && playerAction.kind === 'ball') { throwBall(state, logs); return; }
    // 逃跑
    if (act.side === 'player' && playerAction.kind === 'run') { tryRun(state, logs); return; }

    const skill = act.skillEntry;
    const sk = SKILLS[act.skillId];
    // 状态判定
    if (act.mon.status === 'frz') { logs.push(`${act.mon.name} 被冻住了,无法行动!`); continue; }
    if (act.mon.status === 'par' && Math.random() < 0.25) { logs.push(`${act.mon.name} 麻痹了,无法行动!`); continue; }

    logs.push(`${act.mon.name} 使用了「${sk.name}」!`);
    if (!skill || skill.pp <= 0) { logs.push(`但是没有 PP 了……`); continue; }
    skill.pp--;

    if (sk.cat === 'status') {
      applySkillUserEffect(act.mon, act.foe, act.skillId, logs);
      continue;
    }
    // 命中判定
    const acc = sk.acc === '∞' ? 1000 : sk.acc;
    if (Math.random() * 100 > acc) { logs.push(`但是没有命中……`); continue; }
    const { dmg, mult, crit } = calcDamage(act.mon, act.foe, { id: act.skillId });
    if (mult === 0) { logs.push(`对 ${act.foe.name} 没有效果……`); continue; }
    act.foe.hp = Math.max(0, act.foe.hp - dmg);
    if (crit) logs.push('会心一击!');
    if (mult > 1) logs.push(effectivenessText(mult));
    else if (mult < 1) logs.push(effectivenessText(mult));
    applySecondary(act.mon, act.foe, sk, logs, dmg);
    if (!act.foe.alive()) {
      logs.push(`💥 ${act.foe.name} 倒下了!`);
      if (act.side === 'player') state.enemyFainted = true; else state.playerFainted = true;
    }
  }
  // 回合结束状态伤害
  endOfTurn(playerMon, logs);
  endOfTurn(enemyMon, logs);
  checkEnd(state, logs);
}
function checkEnd(state, logs) {
  if (!state.enemyMon.alive() || !state.playerMon.alive()) state.finished = true;
}

/* 敌方 AI:期望伤害最高者优先,残血时概率用回复 */
function pickEnemySkill(enemy, player) {
  let best = null, bestScore = -1;
  for (const s of enemy.skills) {
    if (s.pp <= 0) continue;
    const sk = SKILLS[s.id];
    let score;
    if (sk.cat === 'status') {
      score = sk.heal && enemy.hpRatio() < 0.45 ? 900 + enemy.hpRatio() * 100 : 10 + Math.random() * 30;
    } else {
      const mult = typeMultiplier(sk.type, player.types);
      const A = sk.cat === 'phys' ? enemy.effStat('atk') : enemy.effStat('spa');
      const D = sk.cat === 'phys' ? player.effStat('def') : player.effStat('spd');
      const acc = sk.acc === '∞' ? 100 : sk.acc;
      score = sk.power * mult * (A / D) * (acc / 100) + Math.random() * 25;
    }
    if (score > bestScore) { bestScore = score; best = s.id; }
  }
  return best || enemy.skills[0].id;
}

/* ---------- 道具 ---------- */
const BAG = {
  potion:   { name: '伤药',   desc: '回复一只精灵 50 HP',  price: 100, kind: 'heal', value: 50 },
  superpotion:{ name: '好伤药', desc: '回复一只精灵 120 HP', price: 280, kind: 'heal', value: 120 },
  revive:   { name: '复活草', desc: '复活倒下的精灵并回复一半 HP', price: 600, kind: 'revive', value: 0.5 },
  ball:     { name: '精灵球', desc: '用于捕捉野生精灵', price: 120, kind: 'ball', value: 1 },
  greatball:{ name: '高级球', desc: '捕捉率更高的精灵球', price: 300, kind: 'ball', value: 1.6 },
};
function useItem(state, item, logs) {
  const { playerMon } = state;
  const it = BAG[item.id];
  if (item.target) {
    const t = item.target;
    if (it.kind === 'heal' && t.alive() && t.hp < t.stats.maxHp) {
      t.hp = Math.min(t.stats.maxHp, t.hp + it.value);
      logs.push(`使用了 ${it.name},${t.name} 回复了 HP!`);
    } else if (it.kind === 'revive' && !t.alive()) {
      t.hp = Math.floor(t.stats.maxHp * it.value);
      t.status = null;
      logs.push(`使用了一击复苏草!${t.name} 复活了!`);
    } else logs.push(`现在不能对 ${t.name} 使用 ${it.name}。`);
  } else logs.push(`对 ${playerMon.name} 使用了 ${it.name}。`);
}
function catchChance(targetMon, ball) {
  const ballBonus = BAG[ball].value;
  const hpFactor = (1 - 2.2 * targetMon.hpRatio() / 3);
  const lvlFactor = targetMon.level < 15 ? 1.25 : targetMon.level < 30 ? 1 : 0.8;
  return Math.max(0.06, Math.min(0.92, hpFactor * lvlFactor * 0.62 * ballBonus));
}
function throwBall(state, logs) {
  const t = state.enemyMon;
  if (state.ballUsed && game.player && game.player.bag[state.ballUsed] > 0) game.player.bag[state.ballUsed]--;
  const p = catchChance(t, state.ballUsed);
  if (Math.random() < p) {
    state.caught = true; state.finished = true;
    logs.push(`🎯 精灵球晃了三下……成功捕捉了 ${t.name}!`);
  } else {
    logs.push(`真遗憾!${t.name} 从精灵球中挣脱了!`);
  }
}
function tryRun(state, logs) {
  if (state.playerMon.effStat('spe') >= state.enemyMon.effStat('spe') || Math.random() < 0.5) {
    state.ran = true; state.finished = true;
    logs.push('成功逃走了!');
  } else logs.push('没能逃掉!');
}

/* ---------- 野怪生成 ---------- */
const WILD_POOL = ['sproutling', 'emberfox', 'voltrat', 'boulderarm', 'fluttermoth', 'venomshroom', 'bubblefish', 'frostbunny', 'boxercrab', 'shadowowl', 'drakeling', 'aquatort'];
function makeWild(level) {
  const sid = WILD_POOL[Math.floor(Math.random() * WILD_POOL.length)];
  return new Mon(sid, Math.max(2, level + [-2, -1, 0, 0, 1, 2][Math.floor(Math.random() * 6)]));
}
function expFromWild(wild) {
  return Math.max(6, Math.floor((wild.level ** 2 * 1.1) / 2));
}
