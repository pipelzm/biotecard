(function(root){
'use strict';
const clone=x=>JSON.parse(JSON.stringify(x));
function integer(v,min=0,max=999){const n=Number(v);if(!Number.isInteger(n)||n<min||n>max)throw Error(`Introduce un número entero entre ${min} y ${max}.`);return n;}
function board(){return Array.from({length:9},(_,i)=>({x:i%3,y:Math.floor(i/3),card:null,stars:0,checked:false}));}
function create(names,options,deck){
 if(names.length<1||names.length>8||new Set(names.map(n=>n.toLowerCase())).size!==names.length||names.some(n=>!n.trim()||n.length>40))throw Error('Usa entre 1 y 8 nombres distintos, de hasta 40 caracteres.');
 if(options.mode==='normal'&&deck.length<names.length*10)throw Error('El modo normal requiere 10 cartas por jugador registrado. Añade cartas al mazo o registra menos jugadores.');
 if(deck.length<names.length)throw Error('El mazo necesita al menos una carta por jugador.');
 return {id:Date.now().toString(36)+'-'+Math.random().toString(36).slice(2,8),name:options.name.trim().slice(0,80)||'Partida de BioteCard',createdAt:new Date().toISOString(),finishedAt:null,mode:options.mode==='normal'?'normal':'custom',roundLimit:options.mode==='normal'?9:integer(options.rounds,1,30),winPoints:options.mode==='normal'?2:integer(options.winPoints,0,20),resourcePoints:!!options.resourcePoints,deck:[...deck],discard:[],rounds:[],notes:'',players:names.map((name,i)=>({id:'p'+i,name:name.trim(),hand:[],board:board(),resources:{gen:0,nucleotide:0,atp:0},adjustment:0}))};
}
function score(m,p){const wins=m.rounds.filter(r=>r.winner===p.id).length;const tricks=wins*m.winPoints;const effects=m.rounds.reduce((sum,r)=>sum+(r.plays.find(a=>a.player===p.id)?.bonus||0),0);const stars=p.board.reduce((n,c)=>n+(c.checked?c.stars:0),0);const resources=m.resourcePoints?p.resources.gen+Math.floor(p.resources.nucleotide/2)+Math.floor(p.resources.atp/3):0;return {wins,tricks,effects,stars,resources,adjustment:p.adjustment,total:tricks+effects+stars+resources+p.adjustment,pending:p.board.filter(c=>c.card&&!c.checked).length};}
function physical(m){return [...m.discard,...m.players.flatMap(p=>[...p.hand,...p.board.map(c=>c.card).filter(Boolean)])];}
function known(m){return new Set([...physical(m),...m.rounds.flatMap(r=>r.plays.map(p=>p.card))]);}
function available(m,player){const p=m.players.find(p=>p.id===player);const occupied=new Set(physical(m).filter(id=>!p.hand.includes(id)));return m.deck.filter(id=>!occupied.has(id)&&(!known(m).has(id)||p.hand.includes(id)));}
function invalidate(m){for(const p of m.players)for(const c of p.board){c.checked=false;c.stars=0;}}
function addRound(m,plays,winner,note){
 if(m.finishedAt)throw Error('Esta partida está finalizada.');
 if(m.rounds.length>=m.roundLimit)throw Error('Ya completaste las rondas previstas. Revisa el marcador final.');
 if(plays.length!==m.players.length||new Set(plays.map(p=>p.player)).size!==m.players.length)throw Error('Registra una jugada por jugador.');
 if(new Set(plays.map(p=>p.card)).size!==plays.length)throw Error('La misma carta no puede jugarse dos veces en la baza.');
 if(winner!=='none'&&!m.players.some(p=>p.id===winner))throw Error('Confirma quién ganó o selecciona «Sin ganador».');
 for(const play of plays){const p=m.players.find(p=>p.id===play.player);if(!p||!available(m,p.id).includes(play.card))throw Error('Selecciona una carta disponible para cada jugador.');const cell=p.board[integer(play.cell,0,15)];if(!cell||cell.card)throw Error('Elige una casilla libre para cada carta.');integer(play.value,-999,999);integer(play.bonus,-999,999);}
 invalidate(m);
 for(const play of plays){const p=m.players.find(p=>p.id===play.player);p.hand=p.hand.filter(id=>id!==play.card);p.board[play.cell].card=play.card;}
 m.rounds.push({number:m.rounds.length+1,at:new Date().toISOString(),plays:clone(plays),winner,note:String(note||'').slice(0,500)});
}
function probability(N,K,n){if(!Number.isInteger(N)||!Number.isInteger(K)||!Number.isInteger(n)||N<1||K<0||K>N||n<1||n>N)return null;let miss=1;for(let i=0;i<n;i++)miss*=Math.max(0,N-K-i)/(N-i);return 1-miss;}
function extensions(p){if(p.board.length>=16)return [];const positions=new Set(p.board.map(c=>`${c.x},${c.y}`)),out=new Map();for(const c of p.board)for(const [dx,dy] of [[0,1],[0,-1],[1,0],[-1,0]]){const x=c.x+dx,y=c.y+dy,key=`${x},${y}`;if(!positions.has(key))out.set(key,{x,y,card:null,stars:0,checked:false});}return [...out.values()];}
function validate(store,ids){
 if(!store||store.version!==1||!Array.isArray(store.matches)||store.matches.length>100)throw Error('El archivo no es una bitácora compatible (máximo 100 partidas).');
 const text=(s,n)=>typeof s==='string'&&s.length<=n;const card=id=>typeof id==='string'&&ids.has(id);const unique=a=>new Set(a).size===a.length;
 if(!unique(store.matches.map(m=>m.id)))throw Error('Hay partidas duplicadas.');
 for(const m of store.matches){
  if(!text(m.id,80)||!text(m.name,80)||!text(m.notes,5000)||!text(m.createdAt,40)||!(m.finishedAt===null||text(m.finishedAt,40))||!['normal','custom'].includes(m.mode)||typeof m.resourcePoints!=='boolean')throw Error('Datos de partida inválidos.');
  integer(m.roundLimit,1,30);integer(m.winPoints,0,20);
  if(m.mode==='normal'&&(m.roundLimit!==9||m.winPoints!==2))throw Error('La configuración normal debe tener 9 rondas y 2 puntos por baza.');
  if(!Array.isArray(m.deck)||!m.deck.length||m.deck.some(id=>!card(id))||!unique(m.deck)||!Array.isArray(m.discard)||m.discard.some(id=>!m.deck.includes(id)))throw Error('Mazo inválido.');
  if(!Array.isArray(m.players)||m.players.length<1||m.players.length>8||!unique(m.players.map(p=>p.id))||!unique(m.players.map(p=>p.name.toLowerCase())))throw Error('Jugadores inválidos.');
  for(const p of m.players){
   if(!text(p.id,40)||! /^[a-zA-Z0-9_-]+$/.test(p.id)||!text(p.name,40)||!p.name.trim()||!Array.isArray(p.hand)||p.hand.some(id=>!m.deck.includes(id))||!Array.isArray(p.board)||p.board.length<9||p.board.length>16)throw Error('Tablero o mano inválidos.');
   if(!unique(p.board.map(c=>`${c.x},${c.y}`)))throw Error('Casillas duplicadas.');
   for(const c of p.board){integer(c.x,-7,9);integer(c.y,-7,9);integer(c.stars,0,999);if(typeof c.checked!=='boolean'||(c.card!==null&&!m.deck.includes(c.card))||(!c.card&&(c.stars||c.checked)))throw Error('Casilla inválida.');}
   for(const key of ['gen','nucleotide','atp'])integer(p.resources?.[key]);integer(p.adjustment,-999,999);
  }
  if(!unique(physical(m)))throw Error('Una carta ocupa más de un lugar.');
  if(!Array.isArray(m.rounds)||m.rounds.length>m.roundLimit)throw Error('Rondas inválidas.');
  for(const [i,r] of m.rounds.entries()){
   if(r.number!==i+1||!text(r.note,500)||!text(r.at,40)||!Array.isArray(r.plays)||r.plays.length!==m.players.length||!unique(r.plays.map(p=>p.player))||!unique(r.plays.map(p=>p.card))||(r.winner!=='none'&&!m.players.some(p=>p.id===r.winner)))throw Error('Registro de baza inválido.');
   for(const a of r.plays){if(!m.players.some(p=>p.id===a.player)||!m.deck.includes(a.card))throw Error('Jugada inválida.');integer(a.cell,0,15);integer(a.value,-999,999);integer(a.bonus,-999,999);}
  }
 }
 if(store.active!==null&&!store.matches.some(m=>m.id===store.active))throw Error('Partida activa inválida.');return clone(store);
}
const api={clone,integer,board,create,score,physical,known,available,invalidate,addRound,probability,extensions,validate};if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.BioteLog=api;
})(globalThis);
