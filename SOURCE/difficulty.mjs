import {mulberry32,ORGANS,emptyBody,initHp,stat,genMob,attack,isAlive} from './engine.mjs';

// PV échelle validée
for(const k in ORGANS)ORGANS[k].hp=Math.max(2,Math.round(ORGANS[k].hp*0.6));

// Combat RÉALISTE : esquive (jambes/RYT), riposte, le mob vise l'outer du joueur, fenêtre d'erreur.
function realFight(player,mob,rng,skill){
  let t=0;
  const ryt=stat(player,'ryt'); // largeur fenêtre de riposte
  while(isAlive(player)&&isAlive(mob)&&t<200){
    // --- tour joueur : tuer vite (estoc cœur) ou tuer bien (barre) selon skill.aggro
    if(skill.aggro&&mob.slots.heart&&mob.organHp.heart>0&&rng()<0.55){
      mob.organHp.heart=Math.max(0,mob.organHp.heart-stat(player,'dgt'));
    } else attack(player,mob,{rng});
    if(!isAlive(mob))break;
    // --- tour mob : il attaque, le joueur tente l'esquive
    // proba d'esquive = skill × (RYT mapping) ; un joueur "moyen" rate parfois
    const dodgeChance=Math.min(0.85, skill.reflex*(0.25+0.08*ryt)+0.1*stat(player,'vit')/10);
    if(rng()<dodgeChance){
      // esquive réussie → parfois contre (si bras)
      if(rng()<0.5)attack(player,mob,{rng});
    } else {
      attack(mob,player,{rng}); // le coup passe
    }
    t++;
  }
  return{win:isAlive(player),t,playerHpLeft:Object.values(player.organHp).reduce((a,b)=>a+b,0)};
}

function cohort(label,floor,skill,builds){
  const rng=mulberry32(4242+floor);
  let wins=0,ts=[],hp=[];
  const biome=floor<=5?'gorge':floor<=10?'estomac':'entrailles';
  for(let n=0;n<400;n++){
    const p=initHp(emptyBody());
    for(const[slot,org]of builds)p.slots[slot]=org;
    initHp(p);
    const m=genMob(rng,biome,floor, n%6===0).body; // 1/6 élite
    const r=realFight(p,m,rng,skill);
    if(r.win){wins++;hp.push(r.playerHpLeft);}
    ts.push(r.t);
  }
  const wr=(wins/400*100);
  console.log(`${label.padEnd(38)} winrate ${wr.toFixed(0).padStart(3)}%  durée ${(ts.reduce((a,b)=>a+b,0)/ts.length).toFixed(1).padStart(4)}t`);
  return wr;
}

const NOVICE={reflex:0.45,aggro:false};
const MOYEN ={reflex:0.7, aggro:false};
const EXPERT={reflex:0.9, aggro:true};
const humain=[];
const buildOK=[['arm_l','arm_troll'],['skin','skin_stone']];
const buildFort=[['arm_l','arm_troll'],['arm_r','arm_pierce'],['skin','skin_stone'],['legs','legs_spider'],['heart','heart_lich']];

console.log('=== LÉTALITÉ PAR PROFIL DE JOUEUR (corps humain nu) ===');
for(const f of [1,3,5,8,13]){
  console.log(`\n-- étage ${f} --`);
  cohort(`  novice (réflexe faible, prudent)`,f,NOVICE,humain);
  cohort(`  moyen`,f,MOYEN,humain);
  cohort(`  expert (greedy, vise le cœur)`,f,EXPERT,humain);
}
console.log('\n=== EFFET DU BUILD (joueur moyen, étage 8) ===');
cohort('  corps humain nu',8,MOYEN,humain);
cohort('  build correct (troll+pierre)',8,MOYEN,buildOK);
cohort('  build fort (5 organes montés)',8,MOYEN,buildFort);
