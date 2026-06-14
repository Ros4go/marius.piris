import {mulberry32,ORGANS,emptyBody,initHp,stat,humanity,isAlive,attack,harvest,
  graft,amputate,hungerTick,sellPrice,buyPrice,genMob,BASE} from './engine.mjs';

let pass=0,fail=0;const fails=[];
function ok(name,cond,extra=''){if(cond){pass++;/*console.log('  ✓',name);*/}else{fail++;fails.push(name+' '+extra);console.log('  ✗ FAIL:',name,extra);}}
function section(t){console.log('\n=== '+t+' ===');}

// ---------------- 1. STATS ----------------
section('1. STATS DÉRIVÉES');
{
  const b=initHp(emptyBody());
  ok('corps humain vit=5',stat(b,'vit')===5,'got '+stat(b,'vit'));
  ok('corps humain prc=5',stat(b,'prc')===5);
  ok('humanité humaine=100',humanity(b)===100,'got '+humanity(b));
  // greffer un bras de troll : +3 dgt, -10 humanité
  graft(b,'arm_l','arm_troll');
  ok('arm_troll +dgt',stat(b,'dgt')===BASE.dgt+3,'got '+stat(b,'dgt'));
  ok('arm_troll baisse humanité',humanity(b)===90,'got '+humanity(b));
  // greffer 2e organe monstrueux : humanité cumule
  graft(b,'eye_l','eye_beholder');
  ok('humanité cumule (-25)',humanity(b)===75,'got '+humanity(b));
  ok('eye_beholder +per',stat(b,'per')===BASE.per+3,'got '+stat(b,'per'));
  // stat plafonne à 10
  const c=initHp(emptyBody());graft(c,'skin','skin_stone');
  ok('arm cap≤10',stat(c,'arm')<=10);
}

// ---------------- 2. GREFFE / AMPUTATION ----------------
section('2. GREFFE / AMPUTATION');
{
  const b=initHp(emptyBody());
  ok('greffe type correct',graft(b,'arm_l','arm_troll').ok===true);
  ok('greffe type INCORRECT refusée',graft(b,'arm_l','eye_beholder').ok===false);
  ok('greffe slot inconnu refusée',graft(b,'xyz','arm_troll').ok===false);
  const r=amputate(b,'arm_l');
  ok('amputation rend organe',r.ok&&r.organ==='arm_troll');
  ok('amputation libère slot',b.slots.arm_l===null);
  ok('amputation remonte humanité',r.humanity===100,'got '+r.humanity);
  // regreffer dans slot amputé
  ok('regreffe après amputation',graft(b,'arm_l','arm_human').ok===true);
}

// ---------------- 3. COMBAT : couches ----------------
section('3. COMBAT — COUCHES & CIBLAGE');
{
  const atk=initHp(emptyBody());graft(atk,'arm_l','arm_troll'); // dgt 5
  const def=initHp(emptyBody());
  // on ne peut pas toucher le cœur (deep) tant que outer tient
  const segs0=[];let r=attack(atk,def,{aimSlot:'heart'});
  ok('cœur protégé par couches',r.hitSlot!=='heart','toucha '+r.hitSlot);
  ok('frappe touche outer en premier',['arm_l','arm_r','legs','skin'].includes(r.hitSlot),'got '+r.hitSlot);
  // détruire tout l'outer puis vérifier que mid devient ciblable
  let guard=0;
  while(['arm_l','arm_r','legs','skin'].some(s=>def.organHp[s]>0)&&guard++<200){attack(atk,def);}
  r=attack(atk,def);
  ok('après outer détruit → mid exposé',['eye_l','eye_r','ear_l','ear_r','stomach','tongue'].includes(r.hitSlot),'got '+r.hitSlot);
}

// ---------------- 4. COMBAT : pierce ----------------
section('4. COMBAT — PERFORATION');
{
  const atk=initHp(emptyBody());graft(atk,'arm_l','arm_pierce');
  const def=initHp(emptyBody());
  const r=attack(atk,def,{aimSlot:'eye_l'}); // pierce saute outer -> mid direct
  ok('pierce atteint mid à travers outer',['eye_l','eye_r','ear_l','ear_r','stomach','tongue'].includes(r.hitSlot),'got '+r.hitSlot);
}

// ---------------- 5. COMBAT : mort par cœur ----------------
section('5. COMBAT — MORT');
{
  const atk=initHp(emptyBody());graft(atk,'arm_l','arm_troll');
  const def=initHp(emptyBody());
  // vider jusqu'à la mort
  let guard=0,killed=false;
  while(isAlive(def)&&guard++<500){const r=attack(atk,def);if(r.dead){killed=true;break;}}
  ok('un corps finit par mourir',killed);
  ok('cœur à 0 = mort',def.organHp.heart===0||!isAlive(def));
  // golem sans cœur : meurt quand tout est à 0
  const golem=initHp(emptyBody());golem.slots.heart=null;delete golem.organHp.heart;
  ok('golem sans cœur vivant au départ',isAlive(golem));
  guard=0;while(isAlive(golem)&&guard++<999){attack(atk,golem);}
  ok('golem meurt quand tout détruit',!isAlive(golem));
}

// ---------------- 6. RÉCOLTE ----------------
section('6. RÉCOLTE — QUALITÉ');
{
  const b=initHp(emptyBody());graft(b,'eye_l','eye_beholder');
  // organe intact (full hp) → parfait
  let h=harvest(b,'eye_l','clean');
  ok('full hp = parfait',h.quality==='parfait'&&h.mult===1.25,JSON.stringify(h));
  // abîmer un peu
  b.organHp.eye_l=4; h=harvest(b,'eye_l','clean'); // 4/6=0.66 -> abîmé
  ok('66% = abîmé',h.quality==='abîmé',JSON.stringify(h));
  // détruit
  b.organHp.eye_l=0; h=harvest(b,'eye_l','clean');
  ok('0 hp = inutilisable',h.usable===false);
  // feu sur organe fragile au feu
  b.organHp.eye_l=6; h=harvest(b,'eye_l','fire');
  ok('feu cuit eye_beholder',h.quality==='cuit'&&h.usable,JSON.stringify(h));
}

// ---------------- 7. FAIM / AUTOPHAGIE ----------------
section('7. FAIM / AUTOPHAGIE');
{
  const b=initHp(emptyBody());graft(b,'arm_l','arm_troll'); // fam stat ?
  const fam=stat(b,'fam');
  let s=hungerTick(b,100,1).satiete;
  ok('satiété baisse au tick',s<100&&Math.abs((100-s)-0.04*fam)<1e-9,'got '+s);
  // à 0 → autophagie ronge le plus monstrueux (arm_troll hum -10 vs reste 0)
  graft(b,'eye_l','eye_beholder'); // hum -15, plus monstrueux
  const before=b.organHp.eye_l;
  const r=hungerTick(b,0,1);
  ok('autophagie déclenchée à 0',r.autophagy!==null,'got '+r.autophagy);
  ok('autophagie ronge le plus monstrueux (eye_beholder -15)',r.autophagy==='eye_l','got '+r.autophagy);
  ok('autophagie -1 PV',b.organHp.eye_l===before-1);
}

// ---------------- 8. ÉCONOMIE ----------------
section('8. ÉCONOMIE');
{
  ok('vente intact = price',sellPrice('eye_beholder','intact')===70);
  ok('vente parfait = price×1.25',sellPrice('eye_beholder','parfait')===Math.round(70*1.25));
  ok('vente cuit = price×0.5',sellPrice('eye_beholder','cuit')===35);
  ok('achat = price×1.6',buyPrice('eye_beholder')===Math.round(70*1.6));
  ok('vente > 0 pour organe commun',sellPrice('arm_human','intact')>0);
}

// ---------------- 9. GÉNÉRATION DE MOBS ----------------
section('9. GÉNÉRATION DE MOBS');
{
  const rng=mulberry32(12345);
  let respectCap=true,budgetOk=true,heartVar=new Set();
  for(let floor=1;floor<=15;floor++){
    const biome=floor<=5?'gorge':floor<=10?'estomac':'entrailles';
    for(let i=0;i<20;i++){
      const m=genMob(rng,biome,floor,i%5===0);
      // budget respecté
      if(m.budgetUsed>m.budgetMax)budgetOk=false;
      // plafond arcane
      for(const oid of Object.values(m.body.slots)){if(oid){const cap=biome==='gorge'?5:biome==='estomac'?10:15;
        if(ORGANS[oid].arcana>cap)respectCap=false;}}
      heartVar.add(m.hasHeart);
    }
  }
  ok('budget mob jamais dépassé',budgetOk);
  ok('plafond arcane respecté par biome',respectCap);
  ok('anatomie varie (avec/sans cœur)',heartVar.size===2);
  // déterminisme : même seed = même mob
  const a=genMob(mulberry32(7),'gorge',3);const b=genMob(mulberry32(7),'gorge',3);
  ok('déterminisme (même seed→même mob)',JSON.stringify(a.body.slots)===JSON.stringify(b.body.slots));
}

// ---------------- 10. SIMULATION DE COMBAT COMPLÈTE ----------------
section('10. SIMULATION COMBAT JOUEUR vs MOB');
{
  // échelle de PV validée par le banc d'essai : organes 2-5 PV
  const saved={};for(const k in ORGANS){saved[k]=ORGANS[k].hp;ORGANS[k].hp=Math.max(2,Math.round(ORGANS[k].hp*0.6));}
  const rng=mulberry32(999);
  let wins=0,turns=[];
  for(let n=0;n<200;n++){
    const player=initHp(emptyBody());graft(player,'arm_l','arm_troll');graft(player,'skin','skin_stone');
    const mob=genMob(rng,'gorge',3,false).body;
    let t=0;
    while(isAlive(player)&&isAlive(mob)&&t<300){
      attack(player,mob,{rng});if(!isAlive(mob))break;
      attack(mob,player,{rng});t++;
    }
    if(isAlive(player))wins++;
    turns.push(t);
  }
  for(const k in ORGANS)ORGANS[k].hp=saved[k];
  const avg=turns.reduce((a,b)=>a+b,0)/turns.length;
  ok('joueur gagne la majorité des combats trash',wins>140,wins+'/200 wins');
  ok('combat trash court (<25 tours moyens)',avg<25,'avg '+avg.toFixed(1));
  console.log('   → winrate',wins/2+'%, durée moyenne',avg.toFixed(1),'tours');
}

// ---------------- RÉSULTAT ----------------
console.log('\n========================================');
console.log(`RÉSULTAT : ${pass} pass, ${fail} fail`);
if(fail)console.log('ÉCHECS:',fails);
console.log('========================================');
process.exit(fail?1:0);
