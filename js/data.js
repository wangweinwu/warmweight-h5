/* ============================================================
 * 宠物精灵 · 数据定义  (species + skills + learnsets)
 * ============================================================ */
const TYPES = {
  grass:  { name: '草', color: '#5FA843', beats: ['water', 'rock'] },
  water:  { name: '水', color: '#3D9BE9', beats: ['fire', 'rock'] },
  fire:   { name: '火', color: '#EE7B30', beats: ['grass', 'bug', 'ice'] },
  electric:{name: '电', color: '#E5B60C', beats: ['water'] },
  rock:   { name: '岩', color: '#A68A5C', beats: ['fire', 'bug', 'ice'] },
  bug:    { name: '虫', color: '#8CB540', beats: ['grass'] },
  ice:    { name: '冰', color: '#54C8D8', beats: ['grass', 'bug'] },
  poison: { name: '毒', color: '#9B59B6', beats: ['grass'] },
  fight:  { name: '武', color: '#D8622B', beats: ['rock'] },
  dark:   { name: '暗', color: '#6A5A9E', beats: ['dark'] },
  dragon: { name: '龙', color: '#5B6EE1', beats: ['dragon'] },
};

/* ---------- 技能表 ---------- */
const SKILLS = {
  tackle:      { name:'撞击',   type:'fight',  cat:'phys', power:40, acc:100, pp:35, priority:0, desc:'奋力冲撞对手。' },
  scratch:     { name:'抓挠',   type:'fight',  cat:'phys', power:40, acc:100, pp:35, priority:0, desc:'用利爪抓挠对手。' },
  quickAttack: { name:'电光一闪', type:'fight', cat:'phys', power:40, acc:100, pp:30, priority:1, desc:'以迅雷不及掩耳之势先制攻击。' },
  vinelash:    { name:'藤鞭',   type:'grass',  cat:'phys', power:45, acc:100, pp:25, priority:0, desc:'用藤蔓狠狠抽打对手。' },
  razorLeaf:   { name:'飞叶快刀', type:'grass', cat:'phys', power:55, acc:95,  pp:25, priority:0, desc:'锋利叶片切裂对手,容易击中要害。', critBonus:2 },
  seedBomb:    { name:'种子炸弹', type:'grass', cat:'phys', power:65, acc:85,  pp:15, priority:0, desc:'向对手发射种子炸弹。' },
  petalDance:  { name:'花瓣舞', type:'grass',  cat:'spec', power:80, acc:100, pp:12, priority:0, desc:'散落华丽花瓣攻击对手。' },
  sunbeam:     { name:'阳光烈焰', type:'grass', cat:'spec', power:100, acc:95, pp:8, priority:0, desc:'聚集阳光释放毁灭光束。' },
  bubble:      { name:'泡沫',   type:'water',  cat:'spec', power:40, acc:100, pp:30, priority:0, desc:'吐出泡泡攻击,偶尔降低对手速度。', secondary:'slow10' },
  waterGun:    { name:'水枪',   type:'water',  cat:'spec', power:50, acc:100, pp:25, priority:0, desc:'喷射强劲水流。' },
  aquaTail:    { name:'水流尾', type:'water',  cat:'phys', power:70, acc:90,  pp:15, priority:0, desc:'用裹着水流的尾巴甩打对手。' },
  surge:       { name:'巨浪冲击', type:'water', cat:'spec', power:90, acc:90,  pp:10, priority:0, desc:'掀起巨浪吞没对手。' },
  ember:       { name:'火花',   type:'fire',   cat:'spec', power:40, acc:100, pp:25, priority:0, desc:'吐出小火苗,偶尔灼伤对手。', secondary:'burn20' },
  flameFang:   { name:'火焰牙', type:'fire',   cat:'phys', power:65, acc:95,  pp:15, priority:0, desc:'用燃烧的尖牙咬住对手。' },
  blazeKick:   { name:'烈焰踢', type:'fire',   cat:'phys', power:85, acc:90,  pp:10, priority:0, desc:'带着火焰的飞踢。' },
  inferno:     { name:'大字爆炎', type:'fire', cat:'spec', power:100, acc:85, pp:8, priority:0, desc:'释放十字形烈焰。' },
  spark:       { name:'电光',   type:'electric', cat:'spec', power:45, acc:100, pp:25, priority:0, desc:'放出电光,偶尔让对手麻痹。', secondary:'para20' },
  voltFang:    { name:'雷电牙', type:'electric', cat:'phys', power:65, acc:95, pp:15, priority:0, desc:'用带电的獠牙撕咬。' },
  thunderbolt: { name:'十万伏特', type:'electric', cat:'spec', power:90, acc:100, pp:12, priority:0, desc:'释放强力电流。' },
  rockThrow:   { name:'落石',   type:'rock',   cat:'phys', power:50, acc:90,  pp:20, priority:0, desc:'投掷大石头砸向对手。' },
  rockBlast:   { name:'岩石炮', type:'rock',   cat:'phys', power:70, acc:90,  pp:15, priority:0, desc:'发射尖锐岩石。' },
  boulderCrush:{ name:'巨岩压顶', type:'rock', cat:'phys', power:90, acc:85,  pp:8,  priority:0, desc:'用巨岩般的身体压向对手。' },
  bugBite:     { name:'虫咬',   type:'bug',    cat:'phys', power:50, acc:100, pp:20, priority:0, desc:'用口器咬住对手。' },
  silverWind:  { name:'银色旋风', type:'bug',  cat:'spec', power:70, acc:100, pp:10, priority:0, desc:'刮起闪着银光的旋风。' },
  frostBreath: { name:'冰霜吐息', type:'ice',  cat:'spec', power:55, acc:95,  pp:15, priority:0, desc:'呼出零下寒气,容易击中要害。', critBonus:2 },
  iceFang:     { name:'冰冻牙', type:'ice',    cat:'phys', power:65, acc:95,  pp:15, priority:0, desc:'用寒冰包裹的牙齿咬住对手。' },
  blizzard:    { name:'暴风雪', type:'ice',    cat:'spec', power:100, acc:80, pp:8,  priority:0, desc:'召唤猛烈暴风雪,偶尔冻结对手。', secondary:'frz10' },
  toxicSpore:  { name:'毒孢子', type:'poison', cat:'spec', power:50, acc:90,  pp:20, priority:0, desc:'散播毒孢子,容易让对手中毒。', secondary:'psn40' },
  poisonFang:  { name:'毒液牙', type:'poison', cat:'phys', power:65, acc:95,  pp:15, priority:0, desc:'用浸毒尖牙撕咬。', secondary:'psn30' },
  sludgeWave:  { name:'污泥波', type:'poison', cat:'spec', power:90, acc:90,  pp:10, priority:0, desc:'掀起污泥巨浪。' },
  karateChop:  { name:'空手劈', type:'fight',  cat:'phys', power:55, acc:100, pp:20, priority:0, desc:'锋利手刀劈向对手,容易击中要害。', critBonus:2 },
  cometPunch:  { name:'连环拳', type:'fight',  cat:'phys', power:60, acc:90,  pp:15, priority:0, desc:'拳如雨点般连击。' },
  crossChop:   { name:'十字劈', type:'fight',  cat:'phys', power:90, acc:80,  pp:8,  priority:0, desc:'双手交叉全力一击。' },
  feintAttack: { name:'佯攻',   type:'dark',   cat:'phys', power:60, acc:100, pp:15, priority:0, desc:'声东击西,必定命中。', acc:'∞' },
  nightShade:  { name:'黑夜魔影', type:'dark', cat:'spec', power:70, acc:100, pp:12, priority:0, desc:'释放暗影冲击波。' },
  darkPulse:   { name:'恶之波动', type:'dark', cat:'spec', power:85, acc:100, pp:10, priority:0, desc:'释放充满恶念的波动。' },
  dragonBreath:{ name:'龙息',   type:'dragon', cat:'spec', power:60, acc:100, pp:20, priority:0, desc:'吐出古老的龙之吐息。' },
  dragonClaw:  { name:'龙爪',   type:'dragon', cat:'phys', power:80, acc:100, pp:12, priority:0, desc:'用锋利巨爪撕抓对手。' },
  outrage:     { name:'逆鳞',   type:'dragon', cat:'phys', power:100, acc:100, pp:8, priority:0, desc:'释放龙之怒,自身也会 recoil。', secondary:'recoil25' },
  rest:        { name:'歇息',   type:'grass',  cat:'status', power:0,  acc:'∞', pp:10, priority:0, desc:'小憩片刻,回复自身最大 HP 的 40%。', heal:0.40 },
  harden:      { name:'变硬',   type:'rock',   cat:'status', power:0,  acc:'∞', pp:20, priority:0, desc:'绷紧身体,提升自身防御。', buff:{ stat:'def', stages:1 } },
  growl:       { name:'嚎叫',   type:'dark',   cat:'status', power:0,  acc:100, pp:20, priority:0, desc:'发出威吓低吼,降低对手攻击。', debuff:{ stat:'atk', stages:1 } },
  agility:     { name:'高速移动', type:'electric', cat:'status', power:0, acc:'∞', pp:20, priority:0, desc:'放松身体,大幅提升自身速度。', buff:{ stat:'spe', stages:2 } },
};

/* ---------- 种族表 ----------
 * base: [HP, 攻, 防, 特攻, 特防, 速]
 * learnset: { 等级: [技能id,...] }   进化: evolveTo + evolveLevel
 */
const SPECIES = {
  sproutling: {
    name: '芽芽兽', type: 'grass',
    base: [55, 52, 58, 60, 58, 45],
    learnset: { 1:['tackle','vinelash'], 5:['growl'], 9:['razorLeaf'], 14:['petalDance'], 20:['seedBomb'], 27:['sunbeam'], 34:['rest'] },
    evolveTo: 'leafguard', evolveLevel: 18,
    flavor: '头顶的三片嫩叶会朝着阳光的方向生长,心情好的时候会轻轻摇摆。',
  },
  leafguard: {
    name: '叶卫兽', type: 'grass',
    base: [80, 82, 85, 90, 84, 68],
    learnset: { 1:['tackle','vinelash','razorLeaf'], 5:['growl'], 9:['harden'], 14:['petalDance'], 20:['seedBomb'], 27:['sunbeam'], 34:['rest'], 41:['agility'] },
    flavor: '双臂的叶刃锋利如剑,是森林最忠诚的守护骑士。',
  },
  aquatort: {
    name: '芡芡龟', type: 'water',
    base: [60, 55, 70, 62, 68, 38],
    learnset: { 1:['tackle','bubble'], 5:['harden'], 9:['waterGun'], 14:['quickAttack','aquaTail'], 20:['surge'], 28:['rest'], 34:['iceFang'] },
    flavor: '龟壳上的波浪纹路记录着它游过的每一条河流。',
  },
  emberfox: {
    name: '焰尾狐', type: 'fire',
    base: [50, 58, 45, 68, 52, 70],
    learnset: { 1:['scratch','ember'], 5:['quickAttack'], 9:['growl'], 14:['flameFang'], 20:['blazeKick'], 27:['inferno'], 34:['agility'] },
    flavor: '尾巴上的火焰颜色会随心情变化,开心时是最明亮的金色。',
  },
  voltrat: {
    name: '雷绒鼠', type: 'electric',
    base: [48, 50, 42, 62, 50, 82],
    learnset: { 1:['quickAttack','spark'], 5:['growl'], 9:['voltFang'], 14:['agility'], 20:['thunderbolt'], 28:['cometPunch'] },
    flavor: '摩擦脸颊就能产生电火花,冬天会被同伴们围起来当暖炉。',
  },
  boulderarm: {
    name: '磐岩犰狳', type: 'rock',
    base: [65, 72, 88, 35, 55, 30],
    learnset: { 1:['tackle','rockThrow'], 5:['harden'], 9:['karateChop'], 14:['rockBlast'], 20:['boulderCrush'], 28:['crossChop'] },
    flavor: '受惊时会缩成一个岩石圆球,从山坡上滚下来撞晕天敌。',
  },
  fluttermoth: {
    name: '粉羽蛾', type: 'bug',
    base: [52, 40, 48, 65, 60, 62],
    learnset: { 1:['bugBite'], 5:['growl'], 9:['quickAttack'], 14:['silverWind'], 22:['rest'] },
    flavor: '翅膀上的圆斑像一双大眼睛,用来吓退窥视森林的掠食者。',
  },
  frostbunny: {
    name: '霜雪兔', type: 'ice',
    base: [55, 52, 50, 70, 62, 66],
    learnset: { 1:['quickAttack','frostBreath'], 5:['growl'], 9:['iceFang'], 14:['agility'], 20:['blizzard'], 28:['feintAttack'] },
    flavor: '长耳尖的冰晶是它情绪的温度计,兴奋时会叮当作响。',
  },
  venomshroom: {
    name: '毒伞菇', type: 'poison',
    base: [62, 58, 55, 68, 58, 28],
    learnset: { 1:['tackle','toxicSpore'], 5:['growl'], 9:['poisonFang'], 14:['harden'], 20:['sludgeWave'], 28:['rest'] },
    flavor: '伞帽上的斑点越鲜艳,毒性就越强——但 它自己总是忍不住去舔一口。',
  },
  boxercrab: {
    name: '铁拳蟹', type: 'fight',
    base: [60, 85, 75, 30, 48, 55],
    learnset: { 1:['cometPunch','karateChop'], 5:['harden'], 9:['quickAttack'], 14:['crossChop'], 22:['rockBlast'] },
    flavor: '每天对着礁石练习出拳一万次,钳子上的凹痕是它的勋章。',
  },
  shadowowl: {
    name: '幽影鸮', type: 'dark',
    base: [58, 52, 52, 85, 70, 72],
    learnset: { 1:['feintAttack'], 5:['growl'], 9:['nightShade'], 14:['agility'], 20:['darkPulse'], 28:['rest'] },
    flavor: '只在月光下现身,振翅无声,被暗影眷顾的夜行者。',
  },
  drakeling: {
    name: '龙芽蜥', type: 'dragon',
    base: [62, 78, 62, 75, 62, 70],
    learnset: { 1:['scratch','dragonBreath'], 5:['growl'], 9:['dragonClaw'], 14:['agility'], 20:['outrage'], 28:['rest'] },
    flavor: '传说每只龙芽蜥的角上,都沉睡着一整片星海的倒影。',
  },
  bubblefish: {
    name: '泡鳞鱼', type: 'water',
    base: [48, 44, 45, 72, 55, 60],
    learnset: { 1:['bubble'], 5:['growl'], 9:['waterGun'], 14:['frostBreath'], 20:['surge'], 28:['agility'] },
    flavor: '生气时会鼓成一颗大泡泡,把自己弹射出去撞向对手。',
  },
};

/* 快速校验:learnset 里引用的技能必须存在 */
Object.keys(SPECIES).forEach(sid => {
  const sp = SPECIES[sid];
  Object.entries(sp.learnset).forEach(([lv, skills]) => {
    skills.forEach(skid => { if (!SKILLS[skid]) console.warn('missing skill', skid, 'for', sid); });
  });
  if (sp.evolveTo && !SPECIES[sp.evolveTo]) console.warn('missing evo', sp.evolveTo, 'for', sid);
});
