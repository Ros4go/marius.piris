// Harnais de test : implémente les formules/algos du SPEC pour les valider.
// Ce n'est PAS le jeu final, c'est un banc d'essai des règles.

// ---------- RNG seedé (mulberry32, cf. SPEC) ----------
export function mulberry32(seed){let a=seed>>>0;return()=>{a|=0;a=a+0x6D2B79F5|0;
  let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296;};}
export const pick=(rng,arr)=>arr[Math.floor(rng()*arr.length)];
export function weighted(rng,items){const tot=items.reduce((s,i)=>s+i.weight,0);let r=rng()*tot;
  for(const it of items){if((r-=it.weight)<0)return it;}return items[items.length-1];}

// ---------- Stats (SPEC §3) ----------
export const BASE={dgt:2,prc:5,per:4,oui:3,brt:3,vit:5,arm:2,fam:3,lum:2,ryt:1};
const STAT_KEYS=Object.keys(BASE);
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));

// ---------- Pool d'organes de test (chiffré selon les budgets du GDD) ----------
export const ORGANS={
  // humains (neutres)
  eye_human:{id:'eye_human',type:'eye',arcana:0,tier:'common',hp:5,layer:'mid',stats:{},humanity:0,price:8},
  ear_human:{id:'ear_human',type:'ear',arcana:0,tier:'common',hp:4,layer:'mid',stats:{},humanity:0,price:8},
  arm_human:{id:'arm_human',type:'arm',arcana:0,tier:'common',hp:6,layer:'outer',stats:{dgt:0},humanity:0,abilities:['strike'],price:10},
  legs_human:{id:'legs_human',type:'legs',arcana:0,tier:'common',hp:5,layer:'outer',stats:{},humanity:0,abilities:['dodge'],price:10},
  heart_human:{id:'heart_human',type:'heart',arcana:0,tier:'common',hp:6,layer:'deep',stats:{},humanity:0,abilities:['heart_ultimate'],price:15},
  skin_human:{id:'skin_human',type:'skin',arcana:0,tier:'common',hp:4,layer:'outer',stats:{},humanity:0,price:12},
  brain_human:{id:'brain_human',type:'brain',arcana:0,tier:'common',hp:5,layer:'deep',stats:{},humanity:0,price:30},
  stomach_human:{id:'stomach_human',type:'stomach',arcana:0,tier:'common',hp:5,layer:'mid',stats:{},humanity:0,price:20},
  tongue_human:{id:'tongue_human',type:'tongue',arcana:0,tier:'common',hp:4,layer:'mid',stats:{},humanity:0,price:12},
  // monstrueux
  eye_beholder:{id:'eye_beholder',type:'eye',arcana:9,tier:'rare',hp:6,layer:'mid',stats:{per:3,prc:1},abilities:['see_invisible'],triggers:[{on:'onKill',do:'purge_infection'}],curses:['paranoia'],humanity:-15,harvest:{fragileTo:['fire']},price:70},
  arm_troll:{id:'arm_troll',type:'arm',arcana:5,tier:'common',hp:8,layer:'outer',stats:{dgt:3},abilities:['strike'],curses:['hunger_x2'],humanity:-10,price:30},
  arm_pierce:{id:'arm_pierce',type:'arm',arcana:6,tier:'rare',hp:5,layer:'outer',stats:{dgt:1,prc:1},abilities:['pierce_layer'],humanity:-8,price:55},
  heart_lich:{id:'heart_lich',type:'heart',arcana:16,tier:'epic',hp:8,layer:'deep',stats:{ryt:1},abilities:['heart_ultimate'],curses:['heal_hurts'],humanity:-25,price:160},
  legs_spider:{id:'legs_spider',type:'legs',arcana:7,tier:'rare',hp:6,layer:'outer',stats:{vit:1,brt:-2},abilities:['dodge'],humanity:-15,price:50},
  skin_stone:{id:'skin_stone',type:'skin',arcana:8,tier:'rare',hp:9,layer:'outer',stats:{arm:3,vit:-2},humanity:-12,price:60},
  ear_bat:{id:'ear_bat',type:'ear',arcana:10,tier:'rare',hp:4,layer:'mid',stats:{oui:4},abilities:['echolocate'],humanity:-12,price:55},
};

export function emptyBody(id='b'){return{id,slots:{eye_l:'eye_human',eye_r:'eye_human',ear_l:'ear_human',ear_r:'ear_human',
  arm_l:'arm_human',arm_r:'arm_human',legs:'legs_human',heart:'heart_human',skin:'skin_human',brain:'brain_human',
  stomach:'stomach_human',tongue:'tongue_human'},extraSlots:[],organHp:{},statusEffects:[]};}

export function initHp(body){for(const[slot,oid]of Object.entries(body.slots)){if(oid)body.organHp[slot]=ORGANS[oid].hp;}
  for(const e of body.extraSlots){if(e.organ)body.organHp[e.id]=ORGANS[e.organ].hp;}return body;}

function equippedOrgans(body){const out=[];
  for(const[slot,oid]of Object.entries(body.slots))if(oid&&(body.organHp[slot]??1)>0)out.push({slot,o:ORGANS[oid]});
  for(const e of body.extraSlots)if(e.organ&&(body.organHp[e.id]??1)>0)out.push({slot:e.id,o:ORGANS[e.organ]});
  return out;}

export function stat(body,key){let v=BASE[key];for(const{o}of equippedOrgans(body))v+=(o.stats?.[key]||0);return clamp(v,0,10);}
export function humanity(body){let v=100;for(const{o}of equippedOrgans(body))v+=(o.humanity||0);return clamp(v,0,100);}
export function isAlive(body){const h=body.slots.heart;const hp=body.organHp.heart??0;
  // si pas de cœur du tout (golem) : vivant tant qu'un segment > 0
  if(!h)return Object.values(body.organHp).some(v=>v>0);
  return hp>0;}

// ---------- Combat (SPEC §3 & §7) ----------
// couches : on ne peut frapper deep que si mid+outer du même "axe" sont à 0 ; simplifié : outer->mid->deep global
const LAYER_ORDER=['outer','mid','deep'];
function exposedSegments(body,pierce=0){
  const segs=equippedOrgans(body);
  // niveau exposé = premier layer qui a encore des PV ; pierce saute 'pierce' couches
  for(let li=0;li<LAYER_ORDER.length;li++){
    const layer=LAYER_ORDER[Math.min(li+pierce,2)];
    const inLayer=segs.filter(s=>s.o.layer===layer&&body.organHp[s.slot]>0);
    if(inLayer.length)return inLayer;
  }
  return [];
}
export function attack(attacker,defender,opts={}){
  const dgtA=stat(attacker,'dgt');
  let pierce=0;for(const{o}of equippedOrgans(attacker))if(o.abilities?.includes('pierce_layer'))pierce=1;
  let targets=exposedSegments(defender,pierce);
  // ciblage : si demandé et exposé
  let seg;
  if(opts.aimSlot&&targets.find(t=>t.slot===opts.aimSlot)){
    const hitChance=0.5+0.05*stat(attacker,'prc');
    seg=(opts.rng?opts.rng():0.5)<hitChance?targets.find(t=>t.slot===opts.aimSlot):pick(opts.rng||Math.random,targets);
  } else { seg=targets[0]; }
  if(!seg)return{dead:true,killed:'already'};
  const armReduction=seg.o.layer==='outer'?stat(defender,'arm'):0;
  const dmg=Math.max(1,dgtA-armReduction)*(opts.tempo||1);
  defender.organHp[seg.slot]=Math.max(0,defender.organHp[seg.slot]-dmg);
  const destroyed=defender.organHp[seg.slot]===0;
  return{hitSlot:seg.slot,dmg,destroyed,dead:!isAlive(defender)};
}

// ---------- Récolte (SPEC §7) ----------
export function harvest(body,slot,killType='clean'){
  const oid=body.slots[slot]||body.extraSlots.find(e=>e.id===slot)?.organ;
  if(!oid)return null;const o=ORGANS[oid];
  const hp=body.organHp[slot];
  if(hp<=0)return{organ:oid,quality:'destroyed',usable:false};
  if(killType==='fire'&&o.harvest?.fragileTo?.includes('fire'))return{organ:oid,quality:'cuit',mult:0.5,usable:true};
  const ratio=hp/o.hp;
  let quality,mult;
  if(ratio>=0.99){quality='parfait';mult=1.25;}
  else if(ratio>=0.7){quality='intact';mult=1;}
  else if(ratio>=0.4){quality='abîmé';mult=0.75;}
  else {quality='cuit';mult=0.5;}
  return{organ:oid,quality,mult,usable:true};
}

// ---------- Greffe / amputation ----------
export function graft(body,slot,organId){
  if(!(slot in body.slots)&&!body.extraSlots.find(e=>e.id===slot))return{ok:false,err:'slot inconnu'};
  const o=ORGANS[organId];if(!o)return{ok:false,err:'organe inconnu'};
  // type doit matcher
  const slotType=slot in body.slots?slot.replace(/_[lr]$/,''):body.extraSlots.find(e=>e.id===slot).type;
  if(o.type!==slotType)return{ok:false,err:`type ${o.type} ≠ slot ${slotType}`};
  if(slot in body.slots)body.slots[slot]=organId;else body.extraSlots.find(e=>e.id===slot).organ=organId;
  body.organHp[slot]=o.hp;
  return{ok:true,humanity:humanity(body)};
}
export function amputate(body,slot){
  const oid=body.slots[slot];if(!oid)return{ok:false};
  body.slots[slot]=null;delete body.organHp[slot];
  return{ok:true,organ:oid,humanity:humanity(body)};
}

// ---------- Faim / autophagie (SPEC §3) ----------
export function hungerTick(body,satiete,ticks=1){
  const fam=stat(body,'fam');
  let s=satiete - 0.04*fam*ticks;
  let autophagy=null;
  if(s<=0){
    // ronge l'organe le plus monstrueux d'abord
    const segs=equippedOrgans(body).filter(x=>x.o.humanity<0).sort((a,b)=>a.o.humanity-b.o.humanity);
    if(segs.length){const t=segs[0];body.organHp[t.slot]=Math.max(0,body.organHp[t.slot]-1);autophagy=t.slot;}
    s=0;
  }
  return{satiete:s,autophagy};
}

// ---------- Économie ----------
export const QMULT={parfait:1.25,intact:1,'abîmé':0.75,cuit:0.5,pourri:0,destroyed:0};
export function sellPrice(organId,quality='intact'){return Math.round(ORGANS[organId].price*(QMULT[quality]??1));}
export function buyPrice(organId){return Math.round(ORGANS[organId].price*1.6);}

// ---------- Génération de mob (SPEC §6.2) ----------
const TIER_COST={common:1,rare:2,epic:4,legendary:8};
const ARCANE_CAP={gorge:5,poumons:10,estomac:10,coeur:15,entrailles:15};
export function genMob(rng,biome,floor,elite=false){
  let B=Math.round((4+floor)*(elite?1.5:1));
  const cap=ARCANE_CAP[biome]??10;
  const pool=Object.values(ORGANS).filter(o=>o.arcana<=cap);
  const body=emptyBody('mob');
  // remplace quelques slots par des organes achetés selon budget
  const buyableSlots=['arm_l','arm_r','eye_l','legs','skin','heart'];
  let spent=0,bought=0;
  for(const slot of buyableSlots){
    const type=slot.replace(/_[lr]$/,'');
    const cands=pool.filter(o=>o.type===type&&o.arcana>0);
    if(!cands.length)continue;
    const o=pick(rng,cands);const cost=TIER_COST[o.tier];
    if(spent+cost>B)continue;
    body.slots[slot]=o.id;spent+=cost;bought++;
  }
  initHp(body);
  // anatomie : parfois pas de cœur
  const roll=rng();if(roll>0.85){body.slots.heart=null;delete body.organHp.heart;}
  return{body,theme:biome,elite,budgetUsed:spent,budgetMax:B,organsBought:bought,hasHeart:!!body.slots.heart};
}
