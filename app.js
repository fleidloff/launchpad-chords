const NAMES=['C','D♭','D','E♭','E','F','G♭','G','A♭','A','B♭','B'];
const SCALE=new Set([0,2,4,5,7,9,11]);
const ROMAN=['I','♭II','II','♭III','III','IV','♭V','V','♭VI','VI','♭VII','VII'];
const CYCLE=[0,5,10,3,8,1,6,11,4,9,2,7];
// Each family: brightness level -> ordered tones above the root (added in this order as the chord gets richer) and names by tone count
const FAM={
 maj:{'-1':{t:[4,9,14,7],n:{2:'6',3:'6/9'}},
      '0':{t:[4,11,14,7,21],n:{2:'maj7',3:'maj9',5:'maj13'}},
      '1':{t:[4,11,18,14,21],n:{2:'maj7',3:'maj7♯11',4:'maj9♯11',5:'maj13♯11'}}},
 min:{'-1':{t:[3,10,20,14,7],n:{2:'m7',3:'m7♭13',4:'m9♭13'}},
      '0':{t:[3,10,14,7,17],n:{2:'m7',3:'m9',5:'m11'}},
      '1':{t:[3,9,14,7],n:{2:'m6',3:'m6/9'}},
      '2':{t:[3,11,14,7],n:{2:'m(maj7)',3:'m(maj9)'}}},
 dom:{'-2':{t:[4,10,13,20,15],n:{2:'7',3:'7♭9',4:'7♭9♭13',5:'7alt'}},
      '-1':{t:[4,10,13,21,7],n:{2:'7',3:'7♭9',4:'13♭9'}},
      '0':{t:[4,10,14,21,7],n:{2:'7',3:'9',4:'13'}},
      '1':{t:[4,10,18,14,21],n:{2:'7',3:'7♯11',4:'9♯11',5:'13♯11'}}},
 half:{'-1':{t:[3,6,10,13,17],n:{2:'°',3:'m7♭5',4:'m7♭5♭9',5:'m11♭5♭9'}},
      '0':{t:[3,6,10,17],n:{2:'°',3:'m7♭5',4:'m11♭5'}},
      '1':{t:[3,6,10,14,17],n:{2:'°',3:'m7♭5',4:'m9♭5',5:'m11♭5'}}}
};
const QMAP={maj7:['maj',0],m7:['min',0],m6:['min',1],'7':['dom',0],alt:['dom',-2],m7b5:['half',0]};
const PROGS=[
 {name:'ii–V–I',key:0,c:[[2,'m7'],[7,'7'],[0,'maj7'],[0,'maj7']]},
 {name:'Minor ii–V–i',key:0,minor:true,c:[[2,'m7b5'],[7,'alt'],[0,'m6'],[0,'m6']]},
 {name:'I–VI–ii–V turnaround',key:0,c:[[0,'maj7'],[9,'7'],[2,'m7'],[7,'7']]},
 {name:'iii–VI–ii–V–I',key:0,c:[[4,'m7'],[9,'7'],[2,'m7'],[7,'7'],[0,'maj7']]},
 {name:'Tritone substitution',key:0,c:[[2,'m7'],[1,'7'],[0,'maj7'],[0,'maj7']]},
 {name:'Backdoor ii–V',key:0,c:[[5,'m7'],[10,'7'],[0,'maj7'],[0,'maj7']]},
 {name:'Descending ii–Vs',key:0,c:[[4,'m7'],[9,'7'],[2,'m7'],[7,'7'],[0,'m7'],[5,'7'],[10,'maj7'],[10,'maj7']]},
 {name:'Rhythm changes, A',key:10,c:[[0,'maj7'],[9,'7'],[2,'m7'],[7,'7'],[4,'m7'],[9,'7'],[2,'m7'],[7,'7']]},
 {name:'Autumn Leaves, A',key:10,c:[[2,'m7'],[7,'7'],[0,'maj7'],[5,'maj7'],[11,'m7b5'],[4,'alt'],[9,'m6'],[9,'m6']]},
 {name:'Jazz blues, bars 1–4',key:0,c:[[0,'7'],[5,'7'],[0,'7'],[7,'m7'],[0,'7']]}
];

function degName(iv,fam){iv=((iv%12)+12)%12;return {0:'R',1:'♭9',2:'9',3:(fam==='dom'?'♯9':'♭3'),4:'3',5:'11',6:(fam==='maj'||fam==='dom'?'♯11':'♭5'),7:'5',8:'♭13',9:(fam==='dom'?'13':'6'),10:'♭7',11:'7'}[iv];}
function nameFor(n,u){let k=u;while(k>1&&!(k in n))k--;return n[k];}

// ---- voicing search ----
function positions(p,minRow){const o=[];for(let r=minRow;r<8;r++){const c=p-5*r;if(c>=0&&c<8)o.push({r,c,p});}return o;}
function padCost(pads){const cs=pads.map(x=>x.c),rs=pads.map(x=>x.r);const w=Math.max(...cs)-Math.min(...cs),h=Math.max(...rs)-Math.min(...rs);return (w+h)*0.8+Math.max(0,w-3)*6+Math.max(0,h-2)*5;}
function assignments(v,minRow){let combos=[[]];for(const p of v){const ps=positions(p,minRow);if(!ps.length)return[];combos=combos.flatMap(cb=>ps.map(x=>[...cb,x]));}
 return combos.map(pads=>({pads,cost:padCost(pads)})).sort((a,b)=>a.cost-b.cost);}
function voicings(ch,lo,hi,rootBottom){const pcs=[...new Set(ch.ivs.map(i=>(ch.root+i)%12))];const out=[],seen=new Set();
 for(const b of pcs){const rel=pcs.map(pc=>(pc-b+12)%12).sort((x,y)=>x-y);
  for(let bottom=b;bottom<=hi;bottom+=12){const close=rel.map(x=>bottom+x);const vars=[close];
   if(close.length>=4){const d=[...close];d[d.length-2]-=12;vars.push(d.sort((x,y)=>x-y));}
   if(close.length===3){const o=[...close];o[1]+=12;vars.push(o.sort((x,y)=>x-y));}
   for(const v of vars){if(v[0]<lo||v[v.length-1]>hi)continue;if(rootBottom&&v[0]%12!==ch.root)continue;const k=v.join();if(seen.has(k))continue;seen.add(k);out.push(v);}}}
 return out;}
const cen=ps=>[ps.reduce((s,x)=>s+x.c,0)/ps.length,ps.reduce((s,x)=>s+x.r,0)/ps.length];
function trans(A,B){let vm=0;for(const b of B.v)vm+=Math.min(...A.v.map(a=>Math.abs(a-b)));for(const a of A.v)vm+=Math.min(...B.v.map(b=>Math.abs(a-b)));vm/=2;
 const ca=cen(A.pads),cb=cen(B.pads);const pd=Math.hypot(ca[0]-cb[0],ca[1]-cb[1]);let held=0;
 for(const b of B.pads){const ap=A.pads.find(x=>x.p===b.p);if(ap&&ap.r!==b.r)held+=1.5;}
 return vm+pd*0.7+held;}
function fingers(pads){const n=pads.length;const idx=pads.map((_,i)=>i).sort((a,b)=>pads[a].c-pads[b].c||pads[a].r-pads[b].r);
 const minc=Math.min(...pads.map(x=>x.c)),span=Math.max(...pads.map(x=>x.c))-minc;let last=0;const res=[];
 idx.forEach((i,k)=>{let f=1+Math.round((pads[i].c-minc)*4/Math.max(span,4));f=Math.max(f,last+1);f=Math.min(f,5-(n-1-k));last=f;res[i]=f;});return res;}
function solve(chords,style){const two=style==='two';const lo=two?10:0,hi=42,minRow=two?2:0,target=two?25:20;
 const layers=chords.map(ch=>{const st=[];for(const v of voicings(ch,lo,hi,style==='root')){const avg=v.reduce((a,b)=>a+b,0)/v.length;
  for(const a of assignments(v,minRow).slice(0,3))st.push({v,pads:a.pads,local:a.cost+Math.abs(avg-target)*0.12});}return st;});
 let prev=layers[0].map(s=>({cost:s.local,back:-1}));const backs=[prev];
 for(let i=1;i<layers.length;i++){const cur=layers[i].map(s=>{let best=Infinity,bi=0;layers[i-1].forEach((p,j)=>{const c=prev[j].cost+trans(p,s);if(c<best){best=c;bi=j;}});return{cost:best+s.local,back:bi};});backs.push(cur);prev=cur;}
 let j=prev.reduce((bi,s,k,a)=>s.cost<a[bi].cost?k:bi,0);const out=[];
 for(let i=layers.length-1;i>=0;i--){out[i]={...layers[i][j]};j=backs[i][j].back;}
 let lastBass=null;
 out.forEach((s,i)=>{const ch=chords[i];s.chord=ch;s.fing=fingers(s.pads);
  if(two){const r=ch.root;const opts=[];if(r<=7)opts.push({r:0,c:r,p:r});if(r>=5)opts.push({r:1,c:r-5,p:r});if(r===0)opts.push({r:1,c:7,p:12});
   let b=opts[0];if(lastBass)b=opts.reduce((m,o)=>Math.hypot(o.c-lastBass.c,o.r-lastBass.r)<Math.hypot(m.c-lastBass.c,m.r-lastBass.r)?o:m);s.bass=b;lastBass=b;}});
 return out;}

// ---- app ----
const S={prog:0,key:0,style:'rootless',label:'finger',i:0,res:[],mod:[]};
const $=id=>document.getElementById(id);
const defN=()=>S.style==='root'?3:4;
function build(i){const [d,q]=PROGS[S.prog].c[i];const [fam,b0]=QMAP[q];const F=FAM[fam];const m=S.mod[i]||{};
 const levels=Object.keys(F).map(Number).sort((a,b)=>a-b);const b=m.b??b0;const V=F[b];const n=m.n??defN();
 const withRoot=S.style==='root';const u=Math.min(withRoot?n-1:n,V.t.length);
 return {root:(d+S.key)%12,deg:d,fam,b,n,ivs:(withRoot?[0]:[]).concat(V.t.slice(0,u)),name:nameFor(V.n,u),
  canDark:b>levels[0],canBright:b<levels[levels.length-1],canSimple:n>3,canRich:n<5&&u<V.t.length,edited:m.b!=null||m.n!=null};}
function compute(){const chords=PROGS[S.prog].c.map((_,i)=>build(i));S.res=solve(chords,S.style);if(S.i>=S.res.length)S.i=0;}
function numeral(ch){let r=ROMAN[ch.deg];if(ch.fam==='min'||ch.fam==='half')r=r.replace(/[IV]+/,m=>m.toLowerCase());return r+(ch.fam==='half'?'ø':ch.fam==='dom'?'7':'');}
const chordText=ch=>NAMES[ch.root]+ch.name;

function label(s,k,isBass){const pad=isBass?s.bass:s.pads[k];
 if(S.label==='note')return NAMES[pad.p%12];
 if(S.label==='degree')return degName(pad.p-s.chord.root,s.chord.fam);
 return isBass?'L':String(s.fing[k]);}

function gridSVG(i,big){const s=S.res[i],P=big&&i>0?S.res[i-1]:null,U=100,G=12,W=8*U+7*G;let o=`<svg viewBox="0 0 ${W} ${W}" role="img" aria-label="${chordText(s.chord)} on the grid">`;
 const at=(arr,r,c)=>arr?arr.findIndex(x=>x.r===r&&x.c===c):-1;
 const prevAll=P?[...P.pads,...(P.bass?[P.bass]:[])]:null;
 for(let r=0;r<8;r++)for(let c=0;c<8;c++){const p=c+5*r,pc=p%12,x=c*(U+G),y=(7-r)*(U+G);
  let cls='pad'+(pc===0?' root':SCALE.has(pc)?' scale':'');const k=at(s.pads,r,c),isB=s.bass&&s.bass.r===r&&s.bass.c===c;
  const wasPrev=P&&at(prevAll,r,c)>=0;
  if(k>=0)cls+=wasPrev?' held':' on';else if(isB)cls+=wasPrev?' held':' bass';
  o+=`<rect class="${cls}" x="${x}" y="${y}" width="${U}" height="${U}" rx="${big?14:18}"/>`;
  if(!(k>=0||isB)&&wasPrev)o+=`<rect class="ghost" x="${x+6}" y="${y+6}" width="${U-12}" height="${U-12}" rx="10"/>`;
  if(big&&(k>=0||isB)){const t=label(s,k,isB&&k<0);const lc=wasPrev?' dk':isB&&k<0?' bs':'';o+=`<text class="lbl${lc}" x="${x+U/2}" y="${y+U/2+2}">${t}</text>`;}
 }
 return o+'</svg>';}

function render(){const s=S.res[S.i],ch=s.chord,p=PROGS[S.prog],P=S.i>0?S.res[S.i-1]:null;
 $('sym').innerHTML=`${NAMES[ch.root]}<sup>${ch.name}</sup>`;
 $('func').textContent=`${numeral(ch)} in ${NAMES[S.key]}${p.minor?' minor':''}, chord ${S.i+1} of ${S.res.length}, ${s.v.length+(s.bass?1:0)} notes`;
 $('dark').disabled=!ch.canDark;$('bright').disabled=!ch.canBright;$('simple').disabled=!ch.canSimple;$('rich').disabled=!ch.canRich;$('reset').disabled=!ch.edited;
 const notes=[...s.v].reverse();let h='';
 for(const n of notes){let m='';if(P){const near=P.v.reduce((a,b)=>Math.abs(b-n)<Math.abs(a-n)?b:a);const d=n-near;m=d===0?'held':`from ${NAMES[near%12]}, ${d>0?'up':'down'} ${Math.abs(d)}`;}else m='starting shape';
  h+=`<span class="n">${NAMES[n%12]}</span><span class="d">${degName(n-ch.root,ch.fam)}</span><span class="m${m==='held'?' h':''}">${m}</span>`;}
 if(s.bass)h+=`<span class="n">${NAMES[s.bass.p%12]}</span><span class="d">R</span><span class="m">left hand</span>`;
 $('tones').innerHTML=h;
 $('big').innerHTML=gridSVG(S.i,true);
 let lg=`<span style="--c:var(--lit)">Press</span><span style="--c:var(--held)">Keep holding</span>`;
 if(S.style==='two')lg+=`<span style="--c:var(--bass)">Bass, left hand</span>`;
 if(P)lg+=`<span class="g">Previous chord</span>`;
 lg+=`<span style="--c:var(--pad-root)">C</span>`;
 $('legend').innerHTML=lg;
 $('striph').textContent=`${p.name} in ${NAMES[S.key]}${p.minor?' minor':''}`;
 $('cells').innerHTML=S.res.map((r,i)=>`<button class="cell" data-i="${i}" aria-current="${i===S.i}"><div class="plate">${gridSVG(i,false)}</div><b class="${r.chord.edited?'mod':''}">${chordText(r.chord)}</b><small>${numeral(r.chord)}</small></button>`).join('');
}
function full(){compute();render();}
function go(d){S.i=(S.i+d+S.res.length)%S.res.length;render();}
function shiftKey(d){const k=CYCLE.indexOf(S.key);S.key=CYCLE[(k+d+12)%12];$('key').value=S.key;full();}
function vary(kind){const ch=S.res[S.i].chord;const m=S.mod[S.i]=S.mod[S.i]||{};
 const levels=Object.keys(FAM[ch.fam]).map(Number).sort((a,b)=>a-b);
 if(kind==='bright'&&ch.canBright)m.b=levels[levels.indexOf(ch.b)+1];
 else if(kind==='dark'&&ch.canDark)m.b=levels[levels.indexOf(ch.b)-1];
 else if(kind==='rich'&&ch.canRich)m.n=ch.n+1;
 else if(kind==='simple'&&ch.canSimple)m.n=ch.n-1;
 else return;
 const [,b0]=QMAP[PROGS[S.prog].c[S.i][1]];if(m.b===b0)delete m.b;if(m.n===defN())delete m.n;full();}

PROGS.forEach((p,i)=>$('prog').add(new Option(p.name,i)));
CYCLE.forEach(k=>$('key').add(new Option(NAMES[k],k)));
$('prog').onchange=e=>{S.prog=+e.target.value;S.key=PROGS[S.prog].key;$('key').value=S.key;S.i=0;S.mod=[];full();};
$('key').onchange=e=>{S.key=+e.target.value;full();};
$('style').onchange=e=>{S.style=e.target.value;S.mod.forEach(m=>m&&delete m.n);full();};
$('kdn').onclick=()=>shiftKey(-1);$('kup').onclick=()=>shiftKey(1);
document.querySelectorAll('.seg button').forEach(b=>b.onclick=()=>{S.label=b.dataset.l;document.querySelectorAll('.seg button').forEach(x=>x.setAttribute('aria-pressed',x===b));render();});
$('prev').onclick=()=>go(-1);$('next').onclick=()=>go(1);
['dark','bright','simple','rich'].forEach(k=>$(k).onclick=()=>vary(k));
$('reset').onclick=()=>{S.mod[S.i]=null;full();};
$('cells').onclick=e=>{const c=e.target.closest('.cell');if(c){S.i=+c.dataset.i;render();}};
document.addEventListener('keydown',e=>{if(e.target.tagName==='SELECT'||e.metaKey||e.ctrlKey)return;const k=e.key;
 if(k==='ArrowRight')go(1);else if(k==='ArrowLeft')go(-1);
 else if(k==='ArrowUp'){e.preventDefault();vary('bright');}else if(k==='ArrowDown'){e.preventDefault();vary('dark');}
 else if(k==='+'||k==='=')vary('rich');else if(k==='-'||k==='_')vary('simple');
 else if(k==='k'||k==='K')shiftKey(1);});
$('key').value=S.key;full();
