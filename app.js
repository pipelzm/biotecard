'use strict';
const $=id=>document.getElementById(id);
const esc=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const normalize=value=>String(value).normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().trim();
const groups={animal:{label:'Animal',plural:'Animales',color:'#f4d03b'},plant:{label:'Planta',plural:'Plantas',color:'#47e33d'},fungus:{label:'Hongo',plural:'Hongos',color:'#e45770'},bacteria:{label:'Bacteria',plural:'Bacterias',color:'#af64ff'}};
const groupThemeColors={animal:'#2d260f',plant:'#122b1b',fungus:'#341820',bacteria:'#291a39'};
function applyGroupTheme(group){
 if(!Object.prototype.hasOwnProperty.call(groups,group))return;
 document.documentElement.dataset.group=group;
 const themeMeta=document.querySelector('meta[name="theme-color"]');
 if(themeMeta)themeMeta.content=groupThemeColors[group];
}
let cards=[],coverCards=[],filtered=[],selected=0,activeType='all',dialogCard=null,dialogContext=[],currentTab='science';
let pointerStart=null,suppressClick=false,wheelTotal=0,wheelTime=0,lastWheelMove=0;
const dialog=$('organism-dialog'),manualDialog=$('manual-dialog'),zoomDialog=$('zoom-dialog');
const cardMotion=window.matchMedia('(hover: hover) and (pointer: fine) and (prefers-reduced-motion: no-preference)');
function bindCardMotion(root){
 root.querySelectorAll('.cover-card,.catalog-card,.enlarge-card').forEach(button=>{
  const surface=button.querySelector('.catalog-art')||button;
  const reset=()=>{surface.classList.remove('is-tilting');surface.style.removeProperty('--card-rx');surface.style.removeProperty('--card-ry');};
  button.addEventListener('pointermove',e=>{
   if(!cardMotion.matches||e.pointerType==='touch')return;
   const bounds=button.getBoundingClientRect();
   const x=Math.max(-1,Math.min(1,(e.clientX-bounds.left)/bounds.width*2-1));
   const y=Math.max(-1,Math.min(1,(e.clientY-bounds.top)/bounds.height*2-1));
   surface.style.setProperty('--card-rx',`${(-y*3).toFixed(2)}deg`);
   surface.style.setProperty('--card-ry',`${(x*3.5).toFixed(2)}deg`);
   surface.classList.add('is-tilting');
  });
  ['pointerleave','pointercancel','blur'].forEach(event=>button.addEventListener(event,reset));
 });
}
cardMotion.addEventListener('change',()=>{
 document.querySelectorAll('.is-tilting').forEach(surface=>{surface.classList.remove('is-tilting');surface.style.removeProperty('--card-rx');surface.style.removeProperty('--card-ry');});
});
function matches(card,query){
 const q=normalize(query);if(!q)return true;
 const numeric=q.match(/^(?:bc[-\s]?)?0*(\d+)$/);
 if(numeric)return card.number===Number(numeric[1]);
 return q.split(/\s+/).every(word=>normalize([card.title,card.species,card.common,card.id,card.subgroup,card.setting,groups[card.group].label].join(' ')).includes(word));
}
function ordered(list,sort){return [...list].sort((a,b)=>sort==='number-asc'?a.number-b.number:sort==='name'?a.title.localeCompare(b.title,'es'):sort==='species'?a.species.localeCompare(b.species,'es'):b.number-a.number);}
function createCoverFlow(){
 coverCards=ordered(cards,'number-asc');
 selected=0;
 $('card-stage').innerHTML=coverCards.map((c,i)=>`<div class="flow-item" data-index="${i}"><button class="cover-card" data-index="${i}" aria-label="Seleccionar ${esc(c.title)}"><img class="flow-front" src="${c.thumbnail}" alt="Carta ${c.number}: ${esc(c.title)}, ${esc(c.species)}" width="768" height="1056" draggable="false" ${Math.abs(i-selected)>5?'loading="lazy"':''}></button><div class="reflection-mask" aria-hidden="true"><img class="flow-reflection" src="${c.thumbnail}" alt="" width="768" height="1056" draggable="false"></div></div>`).join('');
 $('card-stage').querySelectorAll('.cover-card').forEach(b=>b.addEventListener('click',()=>{if(suppressClick)return;const i=Number(b.dataset.index);if(i===selected)openCard(coverCards[i],coverCards);else select(i);}));
 bindCardMotion($('card-stage'));
 $('flow-slider').max=String(coverCards.length-1);select(selected);
}
function select(index,focus=false){
 if(!coverCards.length)return;
 selected=(index+coverCards.length)%coverCards.length;
 const mobile=window.innerWidth<=760;
 const c=coverCards[selected];
 applyGroupTheme(c.group);
 $('card-stage').querySelectorAll('.flow-item').forEach((item,i)=>{
  let offset=(i-selected+coverCards.length)%coverCards.length;
  if(offset>coverCards.length/2)offset-=coverCards.length;
  const d=Math.abs(offset),sign=Math.sign(offset),shown=d<=4;
  const x=d===0?0:sign*((mobile?174:245)+(Math.min(d,6)-1)*(mobile?61:96));
  const z=d===0?50:-110-(Math.min(d,6)-1)*44;
  item.style.transform=`translateX(calc(-50% + ${x}px)) translateZ(${z}px) rotateY(${d===0?0:-sign*61}deg)`;
  item.style.zIndex=String(15-d);item.style.opacity=shown?'1':'0';item.style.pointerEvents=shown?'auto':'none';
  item.style.setProperty('--shade',String(d===0?1:Math.max(.4,.87-(d-1)*.13)));
  item.classList.toggle('selected',d===0);item.setAttribute('aria-hidden',String(!shown));
  const btn=item.querySelector('button');btn.tabIndex=d===0?0:-1;btn.setAttribute('aria-pressed',String(d===0));btn.setAttribute('aria-label',`${d===0?'Abrir':'Seleccionar'} ${coverCards[i].title}`);
  if(d===0){item.querySelector('.flow-front').src=coverCards[i].image;if(focus)btn.focus({preventScroll:true});}
 });
 $('selection-name').innerHTML=`<span class="selected-code">${c.id}</span> ${esc(c.title)}<span class="selected-species">${esc(c.species)}</span>`;
 $('counter').innerHTML=`${String(selected+1).padStart(2,'0')} <span>/ ${coverCards.length}</span>`;
 $('flow-slider').value=String(selected);$('flow-slider').setAttribute('aria-valuetext',`${selected+1} de ${coverCards.length}: ${c.title}`);
 $('discover').setAttribute('aria-label',`Conocer ${c.common}`);
}
function renderCatalog(){
 const queried=cards.filter(c=>matches(c,$('card-search').value));
 filtered=ordered(queried.filter(c=>activeType==='all'||c.group===activeType),$('card-sort').value);
 document.querySelectorAll('[data-type]').forEach(b=>{b.setAttribute('aria-pressed',String(b.dataset.type===activeType));b.querySelector('span').textContent=String(b.dataset.type==='all'?queried.length:queried.filter(c=>c.group===b.dataset.type).length);});
 $('result-count').textContent=`${filtered.length} ${filtered.length===1?'carta':'cartas'}`;
 $('empty-catalog').hidden=filtered.length>0;
 $('catalog-grid').innerHTML=filtered.map(c=>`<button class="catalog-card" data-id="${c.id}" style="--type-color:${groups[c.group].color}" aria-label="Ver ${esc(c.title)}, ${esc(c.species)}, carta ${c.number}"><span class="catalog-art"><img src="${c.thumbnail}" alt="${esc(c.title)}" loading="lazy" width="240" height="330"></span><span class="catalog-card-meta"><span>${c.id}</span><span>${groups[c.group].label}</span></span><strong>${esc(c.title)}</strong><i>${esc(c.species)}</i></button>`).join('');
 $('catalog-grid').querySelectorAll('button').forEach(b=>b.addEventListener('click',()=>openCard(cards.find(c=>c.id===b.dataset.id),filtered)));
 bindCardMotion($('catalog-grid'));
}
function setDetailTab(name,focus=false){
 currentTab=name;
 dialog.querySelectorAll('[role=tab]').forEach(t=>{const active=t.dataset.tab===name;t.setAttribute('aria-selected',String(active));t.tabIndex=active?0:-1;if(active&&focus)t.focus();});
 dialog.querySelectorAll('[role=tabpanel]').forEach(p=>p.hidden=p.id!==`panel-${name}`);
}
function openZoom(){if(!dialogCard)return;$('zoom-image').src=dialogCard.image;$('zoom-image').alt=`Carta ${dialogCard.number}: ${dialogCard.title}`;zoomDialog.showModal();$('close-zoom').focus();}
function renderDetail(){
 const c=dialogCard,g=groups[c.group];
 const coverIndex=coverCards.findIndex(card=>card.id===c.id);
 if(coverIndex>=0)select(coverIndex);
 applyGroupTheme(c.group);
 const photo=c.photo?`<figure class="science-photo"><img src="${c.photo}" alt="${esc(c.photoCredit.caption)}" loading="lazy"><figcaption>${esc(c.photoCredit.caption)} ${esc(c.photoCredit.author)} · <a href="${esc(c.photoCredit.sourcePage)}" target="_blank" rel="noopener">${esc(c.photoCredit.license)}</a> · <a href="${esc(c.photoCredit.licenseUrl)}" target="_blank" rel="noopener">Licencia</a></figcaption></figure>`:'';
 $('organism-content').innerHTML=`<div class="new-detail-layout" style="--card-accent:${g.color}"><div class="detail-card-column"><span class="detail-card-tag">${c.id} <span>${g.label.toUpperCase()}</span></span><button id="enlarge-card" class="enlarge-card" aria-label="Ampliar carta ${esc(c.title)}"><img src="${c.image}" alt="${esc(c.title)}" width="768" height="1056"></button><button id="zoom-label" class="zoom-label">Ampliar carta <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 4H4v5m11-5h5v5M4 15v5h5m11-5v5h-5"/></svg></button><div class="detail-pagination"><button id="detail-previous" aria-label="Ficha anterior">Anterior</button><span>${dialogContext.findIndex(x=>x.id===c.id)+1} / ${dialogContext.length}</span><button id="detail-next" aria-label="Ficha siguiente">Siguiente</button></div></div><div class="detail-copy"><p class="eyebrow">${g.label.toUpperCase()} · ${esc(c.subgroup.toUpperCase())}</p><h2 id="organism-title">${esc(c.title)}</h2><p class="detail-scientific">${esc(c.species)}</p><div class="detail-tabs" role="tablist" aria-label="Contenido de la carta"><button role="tab" id="tab-science" data-tab="science" aria-controls="panel-science" aria-selected="true">El organismo real</button><button role="tab" id="tab-game" data-tab="game" aria-controls="panel-game" aria-selected="false" tabindex="-1">La carta</button></div><div class="detail-panel" role="tabpanel" id="panel-science" aria-labelledby="tab-science" tabindex="0"><p class="common-name">${esc(c.common)}</p><p>${esc(c.description)}</p><dl class="fact-grid"><div><dt>Grupo</dt><dd>${esc(c.subgroup)}</dd></div><div><dt>Entorno</dt><dd>${esc(c.setting)}</dd></div><div class="wide-fact"><dt>Conexión biológica</dt><dd>${esc(c.role)}</dd></div></dl><div class="detail-callout"><h4>Más allá del juego</h4><p>${esc(c.connection)}</p></div>${photo}<div class="source-links"><span>PARA EXPLORAR</span>${c.sources.map(s=>`<a href="${esc(s.url)}" target="_blank" rel="noopener">${esc(s.label)}</a>`).join('')}</div></div><div class="detail-panel" role="tabpanel" id="panel-game" aria-labelledby="tab-game" tabindex="0" hidden><div class="game-numbers"><div><b>${c.number}</b><small>Valor impreso</small></div><div><b style="font-size:20px">${g.label}</b><small>Grupo de la carta</small></div></div><h3 class="ability-heading">Las habilidades de ${esc(c.common)}</h3><button class="rule-crop" id="enlarge-rules" aria-label="Ampliar las habilidades de la carta"><img src="${c.image}" alt="Habilidades I y II tal como aparecen en la carta original"></button><p class="game-caption">Pulsa las habilidades para leer la carta ampliada. Los iconos y el texto se conservan tal como aparecen en el diseño original.</p><dl class="game-legend"><div><dt>I</dt><dd>Efecto al jugar la carta.</dd></div><div><dt>II</dt><dd>Condición para puntuar en el ecosistema.</dd></div></dl><p class="edition-note">Colección inicial · En desarrollo</p></div></div></div>`;
 setDetailTab(currentTab);
 bindCardMotion($('organism-content'));
 ['enlarge-card','zoom-label','enlarge-rules'].forEach(id=>$(id).addEventListener('click',openZoom));
 $('detail-previous').addEventListener('click',()=>navigateDetail(-1));$('detail-next').addEventListener('click',()=>navigateDetail(1));
 dialog.querySelectorAll('[role=tab]').forEach(t=>{t.addEventListener('click',()=>setDetailTab(t.dataset.tab));t.addEventListener('keydown',e=>{if(['ArrowLeft','ArrowRight','Home','End'].includes(e.key)){e.preventDefault();setDetailTab(e.key==='Home'?'science':e.key==='End'?'game':t.dataset.tab==='science'?'game':'science',true);}});});
}
function openCard(card,context){dialogCard=card;dialogContext=context.length?context:cards;currentTab='science';renderDetail();if(!dialog.open)dialog.showModal();$('close-organism').focus();}
function navigateDetail(direction){const idx=dialogContext.findIndex(c=>c.id===dialogCard.id);dialogCard=dialogContext[(idx+direction+dialogContext.length)%dialogContext.length];renderDetail();dialog.scrollTop=0;$(direction<0?'detail-previous':'detail-next').focus({preventScroll:true});}
$('previous').addEventListener('click',()=>select(selected-1));$('next').addEventListener('click',()=>select(selected+1));
$('discover').addEventListener('click',()=>{if(coverCards.length)openCard(coverCards[selected],coverCards);});
$('flow-slider').addEventListener('input',e=>select(Number(e.target.value)));
$('card-search').addEventListener('input',renderCatalog);$('card-sort').addEventListener('change',renderCatalog);
document.querySelectorAll('[data-type]').forEach(b=>b.addEventListener('click',()=>{activeType=b.dataset.type;renderCatalog();}));
$('reset-filters').addEventListener('click',()=>{activeType='all';$('card-search').value='';renderCatalog();$('card-search').focus();});
$('close-organism').addEventListener('click',()=>dialog.close());$('close-manual').addEventListener('click',()=>manualDialog.close());$('close-zoom').addEventListener('click',()=>zoomDialog.close());
for(const id of ['manual-link','manual-bottom'])$(id).addEventListener('click',()=>manualDialog.showModal());
for(const d of [dialog,manualDialog,zoomDialog])d.addEventListener('click',e=>{const r=d.getBoundingClientRect();if(e.target===d&&(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom))d.close();});
const carousel=document.querySelector('.carousel');
carousel.addEventListener('pointerdown',e=>{if(e.button!==0)return;pointerStart={x:e.clientX,y:e.clientY,id:e.pointerId};suppressClick=false;});
carousel.addEventListener('pointerup',e=>{if(!pointerStart||pointerStart.id!==e.pointerId)return;const dx=e.clientX-pointerStart.x,dy=e.clientY-pointerStart.y;pointerStart=null;if(Math.abs(dx)>38&&Math.abs(dx)>Math.abs(dy)*1.2){suppressClick=true;select(selected+(dx<0?1:-1)*Math.min(3,Math.max(1,Math.round(Math.abs(dx)/160))));setTimeout(()=>{suppressClick=false;},250);}});
carousel.addEventListener('pointercancel',()=>{pointerStart=null;});
carousel.addEventListener('wheel',e=>{if(Math.abs(e.deltaX)<=Math.abs(e.deltaY))return;e.preventDefault();const now=performance.now();if(now-wheelTime>170)wheelTotal=0;wheelTime=now;wheelTotal+=e.deltaX;if(Math.abs(wheelTotal)>50&&now-lastWheelMove>230){select(selected+(wheelTotal>0?1:-1));lastWheelMove=now;wheelTotal=0;}},{passive:false});
carousel.addEventListener('keydown',e=>{if(['ArrowLeft','ArrowRight','Home','End'].includes(e.key)){e.preventDefault();select(e.key==='Home'?0:e.key==='End'?coverCards.length-1:selected+(e.key==='ArrowRight'?1:-1),true);}});
window.addEventListener('resize',()=>select(selected));
async function init(){
 try{
  const r=await fetch('data/cards.json');if(!r.ok)throw new Error('Catalogue unavailable');const data=await r.json();cards=data.cards;
  if(!Array.isArray(cards)||cards.length!==40||new Set(cards.map(c=>c.id)).size!==cards.length)throw new Error('Invalid catalogue');
  createCoverFlow();renderCatalog();
 }catch(error){$('card-stage').innerHTML='<div class="catalog-error" role="alert"><p>No pudimos cargar la colección.</p><button id="retry-catalog" class="outline-button">Volver a intentar</button></div>';$('retry-catalog').addEventListener('click',init);$('result-count').textContent='Colección no disponible';$('discover').disabled=true;return;}
 $('discover').disabled=false;
}
init();

// Keep the collection index in step with the section being read.
const sectionLinks=[...document.querySelectorAll('.main-navigation [data-section]')];
let navFrame=0;
function syncSectionNavigation(){
 navFrame=0;let current=sectionLinks[0]?.dataset.section;
 for(const link of sectionLinks){const section=$(link.dataset.section);if(section&&section.getBoundingClientRect().top<=window.innerHeight*.4)current=link.dataset.section;}
 for(const link of sectionLinks){const active=link.dataset.section===current;link.classList.toggle('active',active);if(active)link.setAttribute('aria-current','location');else link.removeAttribute('aria-current');}
}
window.addEventListener('scroll',()=>{if(!navFrame)navFrame=requestAnimationFrame(syncSectionNavigation);},{passive:true});
window.addEventListener('resize',syncSectionNavigation);
syncSectionNavigation();
