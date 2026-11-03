import {categories,escapeHTML as e,searchComponents,readProgress,learningPaths,highlightCode,memoryState,scheduleReplicas,serviceEndpoints} from './core.js';
import {renderLessonDetails, renderProblemList} from './lesson-details.js';
import {icon,homeDiagram,componentDiagram,diagramCaption,replicasIllustration} from './diagrams.js';

const main=document.querySelector('#main-content');
const searchDialog=document.querySelector('#search-dialog');
const searchInput=document.querySelector('#global-search');
let progressStorage;try{progressStorage=window.localStorage;}catch{}
const state={catalog:[],map:new Map(),progress:readProgress(progressStorage),category:'all',query:'',component:null,caseIndex:0,fault:false,step:-1,playing:false,zoom:1,pan:{x:0,y:0},inspected:null,lab:'replicas',replicas:3,usage:96,limit:128,selector:'web',crashFixed:false};
let flowTimer,homeTimer,toastTimer;
const categoryName=id=>categories.find(c=>c.id===id)?.name||id;
const href=id=>`#/componente/${encodeURIComponent(id)}`;
const get=id=>state.map.get(id);
const external=(url,label)=>`<a href="${e(url)}" target="_blank" rel="noopener noreferrer">${e(label)} ↗</a>`;

const diagnosticDialog=document.createElement('dialog');
diagnosticDialog.id='diagnostic-dialog';diagnosticDialog.className='diagnostic-dialog';
document.body.append(diagnosticDialog);

function toast(text) {
  const el=document.querySelector('#toast');el.textContent=text;el.classList.add('visible');
  clearTimeout(toastTimer);toastTimer=setTimeout(()=>el.classList.remove('visible'),3000);
}
function saveProgress() {
  try{localStorage.setItem('kubeexplora.progress',JSON.stringify([...state.progress]));}
  catch{toast('Este navegador no permite guardar el progreso. Puedes seguir aprendiendo.');}
}
function cleanup(){
  clearInterval(flowTimer);clearInterval(homeTimer);state.playing=false;
  const play=document.querySelector('[data-play]');if(play){play.setAttribute('aria-pressed','false');play.textContent='▷ Reproducir';}
  const homePlay=document.querySelector('[data-home-play]');if(homePlay){homePlay.setAttribute('aria-pressed','false');homePlay.textContent='▷ Ver el recorrido';}
  document.querySelector('.home-map')?.classList.remove('is-playing');
}
function setActiveNavigation(path) {
  document.querySelectorAll('.header-nav a').forEach(a=>a.classList.toggle('active',path.startsWith(a.hash.slice(1))));
  document.querySelector('.header-nav').classList.remove('open');
  document.querySelector('#menu-trigger').setAttribute('aria-expanded','false');
}
function route({preserveScroll=false}={}) {
  cleanup();
  const raw=location.hash.slice(1)||'/';
  const [path,params]=raw.split('?');
  setActiveNavigation(path);
  document.body.classList.toggle('detail-page',path.startsWith('/componente/'));
  if(path==='/') renderHome();
  else if(path==='/explorar') {
    state.category=new URLSearchParams(params).get('categoria')||'all';state.query='';renderCatalog();
  } else if(path.startsWith('/componente/')) {
    let id;try{id=decodeURIComponent(path.split('/')[2]);}catch{id='';}
    const component=get(id);
    if(component){state.component=component;state.caseIndex=0;state.fault=false;state.step=-1;state.zoom=1;state.pan={x:0,y:0};state.inspected=null;renderComponent(component);}
    else renderNotFound();
  } else if(path==='/ruta')renderLearningPath();
  else if(path==='/laboratorios')renderLabs();
  else renderNotFound();
  if(!preserveScroll){window.scrollTo({top:0,behavior:'instant'});main.focus({preventScroll:true});}
}

function renderHome() {
  document.title='KubeExplora · Kubernetes, pieza por pieza';
  main.innerHTML=`<section class="home-hero frame"><div class="home-copy"><h1>Kubernetes,<br>pieza por pieza.</h1><p>Explora el clúster, prueba cambios y entiende qué ocurre.</p><div class="hero-actions"><a class="button" href="#/explorar">Explorar el clúster <span aria-hidden="true">→</span></a><a class="text-link" href="#/ruta">Empezar desde cero</a></div><div class="learning-ritual" aria-label="Entiende, experimenta y resuelve"><span class="ritual-part"><span class="ritual-symbol">${icon('config',36)}</span>Entiende</span><span class="ritual-arrow" aria-hidden="true">→</span><span class="ritual-part"><span class="ritual-symbol">${icon('cube',36,'mint')}</span>Experimenta</span><span class="ritual-arrow" aria-hidden="true">→</span><span class="ritual-part"><span class="ritual-symbol">${icon('controller',36,'amber')}</span>Resuelve</span></div></div>${homeDiagram()}</section>
  <section class="quick-section frame" aria-labelledby="quick-title"><div class="section-heading"><h2 id="quick-title">Elige tu próxima pieza</h2><a class="text-link" href="#/explorar">Ver las ${state.catalog.length} unidades →</a></div><div class="quick-components">${[['pod','Pods'],['deployment','Deployments'],['service','Services'],['configmap','ConfigMaps']].map(([id,label])=>`<a class="quick-component" href="${href(id)}">${icon(get(id)?.icon||'cube',54,id==='deployment'?'mint':id==='configmap'?'amber':'blue')}<span>${label}</span><span aria-hidden="true">→</span></a>`).join('')}</div></section>
  <section class="home-more"><div class="home-more-grid frame"><div><h2>De una pieza al sistema</h2><p>Aprende qué hace cada componente, con qué se relaciona y qué revisar cuando algo falla.</p><div class="home-topic-list">${categories.map(category=>`<a href="#/explorar?categoria=${category.id}">${category.name}</a>`).join('')}</div></div><div><h2>Equivócate aquí.<br>Aprende para producción.</h2><p>Prueba réplicas, límites de memoria, selectores de red y reinicios en laboratorios guiados.</p><a class="button" href="#/laboratorios">Entrar al laboratorio →</a><p class="local-progress-note">Simulaciones locales: no se conectan a un clúster real.</p></div></div></section>`;
  main.querySelectorAll('[data-home-inspect]').forEach(button=>button.addEventListener('click',()=>inspectHome(button.dataset.homeInspect,button)));
  main.querySelector('[data-close-home]').addEventListener('click',()=>document.querySelector('#home-popover').hidden=true);
  main.querySelector('[data-home-play]').addEventListener('click',toggleHomeTour);
}

function inspectHome(id,button) {
  const component=get(id);if(!component)return;
  const popover=document.querySelector('#home-popover');popover.hidden=false;
  popover.innerHTML=`<div><strong>${e(component.name)}</strong><button data-close-home aria-label="Cerrar explicación">×</button></div><p>${e(component.tagline)}</p><a href="${href(id)}">Abrir componente →</a>`;
  popover.querySelector('[data-close-home]').addEventListener('click',()=>popover.hidden=true);
  document.querySelectorAll('.home-piece').forEach(b=>b.classList.remove('selected'));
  button?.classList.add('selected');
}
function toggleHomeTour() {
  const button=document.querySelector('[data-home-play]');
  const playing=button.getAttribute('aria-pressed')!=='true';
  button.setAttribute('aria-pressed',String(playing));button.innerHTML=playing?'Ⅱ Pausar recorrido':'▷ Ver el recorrido';
  document.querySelector('.home-map').classList.toggle('is-playing',playing);
  clearInterval(homeTimer);
  if(playing){
    let step=0;
    const steps=[['api-server','El estado deseado se declara a través de la API.'],['node','Los nodos ejecutan las cargas asignadas.'],['service','Un Service encuentra Pods listos mediante selectores.']];
    const advance=()=>{const [id,text]=steps[step++%steps.length];inspectHome(id,main.querySelector(`[data-home-inspect="${id}"]`));document.querySelector('#home-tour-text').textContent=text;};
    advance();homeTimer=setInterval(advance,3500);
  }
}

function card(component) {
  return `<a class="component-card" href="${href(component.id)}"><div class="card-top">${icon(component.icon,52,component.category==='almacenamiento'?'mint':'blue')}<span class="kind-label ${component.kind==='Extensión'?'extension':''}">${e(component.kind)}</span></div><h2>${e(component.name)}</h2><p>${e(component.tagline)}</p><div class="card-bottom"><span>${e(categoryName(component.category))}</span>${state.progress.has(component.id)?'<span class="completed-label">Comprendido</span>':'<span aria-hidden="true">→</span>'}</div></a>`;
}
function renderCatalog() {
  document.title='Explorar componentes · KubeExplora';
  main.innerHTML=`<div class="frame"><header class="page-header"><h1>Conecta todas las piezas.</h1><p>De la arquitectura del clúster a los recursos que usas cada día. Elige una pieza y explora sus relaciones, ejemplos e incidentes.</p></header><div class="catalog-toolbar"><label class="catalog-search"><span class="search-symbol" aria-hidden="true"></span><span class="sr-only">Buscar componentes o problemas</span><input id="catalog-search" type="search" placeholder="Busca una pieza o un problema…" value="${e(state.query)}"></label><span id="catalog-count" aria-live="polite"></span></div><div class="category-filters" role="group" aria-label="Categorías"><button data-category="all" class="${state.category==='all'?'active':''}" aria-pressed="${state.category==='all'}">Todas</button>${categories.map(c=>`<button data-category="${c.id}" class="${state.category===c.id?'active':''}" aria-pressed="${state.category===c.id}">${c.name}</button>`).join('')}</div><div id="catalog-grid" class="component-grid"></div><p class="catalog-end">Las extensiones están identificadas: requieren componentes o CRDs adicionales. Cada unidad incluye una fuente oficial.</p></div>`;
  updateCatalog();
  document.querySelector('#catalog-search').addEventListener('input',event=>{state.query=event.target.value;updateCatalog();});
  document.querySelectorAll('[data-category]').forEach(button=>button.addEventListener('click',()=>{
    state.category=button.dataset.category;
    document.querySelectorAll('[data-category]').forEach(b=>{b.classList.toggle('active',b===button);b.setAttribute('aria-pressed',String(b===button));});updateCatalog();
  }));
}
function updateCatalog() {
  const results=searchComponents(state.catalog,state.query,state.category);
  document.querySelector('#catalog-count').textContent=`${results.length} de ${state.catalog.length} unidades`;
  const grid=document.querySelector('#catalog-grid');
  grid.innerHTML=results.length?results.map(card).join(''):'<div class="empty-state"><h2>No encontramos esa pieza.</h2><p>Prueba con “Pod”, “memoria”, “DNS” o “permisos”.</p><button class="soft-button" data-clear-catalog>Limpiar búsqueda y filtros</button></div>';
  grid.style.gridTemplateColumns=results.length?'':'1fr';
  grid.querySelector('[data-clear-catalog]')?.addEventListener('click',()=>{state.query='';state.category='all';renderCatalog();document.querySelector('#catalog-search').focus();});
}

function sidebar(component) {
  return `<aside class="component-sidebar" id="component-sidebar" aria-label="Componentes"><h2>Componentes</h2><button class="icon-button sidebar-close" aria-label="Cerrar componentes">×</button><label><span class="sr-only">Filtrar componentes del menú</span><input class="sidebar-search" type="search" placeholder="Filtrar piezas…" id="sidebar-search"></label>${categories.map(category=>`<div class="sidebar-group" data-sidebar-group><h3>${category.name}</h3>${state.catalog.filter(c=>c.category===category.id).map(c=>`<a href="${href(c.id)}" class="${component.id===c.id?'active':''}" ${component.id===c.id?'aria-current="page"':''} data-sidebar-item="${e(c.name.toLowerCase())}">${icon(c.icon,26)}<span>${e(c.name)}</span></a>`).join('')}</div>`).join('')}</aside>`;
}
function renderComponent(component) {
  document.title=`${component.name} · KubeExplora`;
  main.innerHTML=`<div class="component-layout">${sidebar(component)}<article class="component-content"><button class="soft-button mobile-components-button" aria-controls="component-sidebar" aria-expanded="false">Ver componentes</button><div class="breadcrumbs"><a href="#/explorar">Explorar</a><span aria-hidden="true">/</span><span>${e(categoryName(component.category))}</span></div><div class="component-title-row"><h1>${e(component.name)}</h1>${completionButton(component)}</div><p class="component-tagline">${e(component.tagline)}</p><p class="component-summary">${e(component.summary)}</p>${component.kind==='Extensión'?'<span class="component-kind kind-label extension">Extensión · necesita instalación adicional</span>':`<span class="component-kind">${e(component.kind)}</span>`}
  <nav class="section-tabs" aria-label="Apartados de la lección"><button data-section="concept" class="">Concepto</button><button data-section="architecture" class="active">Arquitectura</button><button data-section="example">Ejemplo</button><button data-section="properties">Propiedades</button><button data-section="commands">Comandos</button><button data-section="production">Producción</button></nav>
  <section class="architecture-panel" id="architecture" data-ui aria-labelledby="architecture-title"><div class="architecture-heading"><h2 id="architecture-title">${component.id==='pod'?'Encuentra el Pod en el clúster':`Entiende sus relaciones`}</h2><div class="graph-controls"><button class="soft-button" data-play aria-pressed="false">▷ Reproducir</button><span class="simulation-label">Simulación</span><div class="mode-switch" role="group" aria-label="Estado del escenario"><button data-mode="normal" class="active" aria-pressed="true">Normal</button><button data-mode="fault" aria-pressed="false">Fallo</button></div></div></div><div class="architecture-main"><div class="graph-column"><div id="diagram-container">${componentDiagram(component,state.catalog,state)}</div><div class="diagram-bottom"><p id="diagram-caption">${e(diagramCaption(component,false))}</p><div class="zoom-controls" aria-label="Controles del diagrama"><button data-zoom="-1" aria-label="Alejar diagrama">−</button><button data-zoom="0" aria-label="Centrar diagrama">⌖</button><button data-zoom="1" aria-label="Acercar diagrama">+</button></div></div></div><aside id="graph-insight" class="graph-insight" aria-label="Explicación del escenario"></aside></div></section>
  <div class="production-grid"><section class="learning-panel" id="example" aria-labelledby="example-title"><div class="panel-heading"><h2 id="example-title">Ejemplo mínimo</h2><button class="copy-button" data-copy-example>▣ Copiar</button></div><pre class="code-block" tabindex="0" aria-label="Ejemplo ${e(component.format)}"><code>${highlightCode(component.example,component.format)}</code></pre><p class="example-note">${e(component.exampleNote)}</p></section><section class="learning-panel" id="production" aria-labelledby="production-title"><div class="panel-heading"><h2 id="production-title">Antes de producción</h2></div><ul class="practices-list">${component.practices.map(text=>`<li><span class="practice-check" aria-hidden="true"></span><span>${e(text)}</span></li>`).join('')}</ul></section><section class="learning-panel issues-panel" aria-labelledby="issues-title"><div class="panel-heading"><h2 id="issues-title">Problemas reales</h2><span class="issue-count">${component.problems.length} casos</span></div>${renderProblemList(component.problems)}</section></div>
  <section class="concept-section" id="concept" aria-labelledby="concept-title"><div><h2 id="concept-title">Qué hace y cuándo usarlo</h2><p>${e(component.purpose)}</p>${component.details.map(paragraph=>`<p>${e(paragraph)}</p>`).join('')}<p class="analogy">${e(component.analogy)}</p></div><div><h2>Cómo funciona</h2><ol class="steps-list">${component.steps.map(s=>`<li><strong>${e(s.title)}</strong><span>${e(s.description)}</span></li>`).join('')}</ol></div></section>
  ${renderLessonDetails(component)}
  <div class="component-reference"><span>Profundiza y contrasta con la fuente original.</span>${external(component.source.url,component.source.title)}</div><section class="related-components" aria-labelledby="related-title"><h2 id="related-title">Conecta con otras piezas</h2><div class="related-list">${component.related.filter(id=>get(id)).map(id=>`<a href="${href(id)}">${icon(get(id).icon,25)}${e(get(id).name)} →</a>`).join('')}</div></section><nav class="lesson-pagination" aria-label="Otras lecciones">${pagination(component)}</nav></article></div>`;
  bindComponentEvents();updateInsight();
}
function completionButton(component) {
  const completed=state.progress.has(component.id);
  return `<button class="soft-button completion-button ${completed?'is-complete':''}" data-complete aria-pressed="${completed}">${completed?'Comprendido':'Marcar como comprendido'}</button>`;
}
function pagination(component) {
  const i=state.catalog.findIndex(c=>c.id===component.id),prev=state.catalog[i-1],next=state.catalog[i+1];
  return `${prev?`<a href="${href(prev.id)}">← ${e(prev.name)}</a>`:'<span></span>'}${next?`<a href="${href(next.id)}">${e(next.name)} →</a>`:'<a href="#/explorar">Volver al catálogo →</a>'}`;
}
function bindComponentEvents() {
  const sidebarEl=document.querySelector('#component-sidebar');
  const mobileButton=document.querySelector('.mobile-components-button');
  mobileButton.addEventListener('click',()=>{sidebarEl.classList.add('open');mobileButton.setAttribute('aria-expanded','true');sidebarEl.querySelector('input').focus();});
  sidebarEl.querySelector('.sidebar-close').addEventListener('click',()=>{sidebarEl.classList.remove('open');mobileButton.setAttribute('aria-expanded','false');mobileButton.focus();});
  document.querySelector('#sidebar-search').addEventListener('input',event=>{
    const query=event.target.value.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
    document.querySelectorAll('[data-sidebar-item]').forEach(item=>{item.hidden=!item.dataset.sidebarItem.normalize('NFD').replace(/[\u0300-\u036f]/g,'').includes(query);});
    document.querySelectorAll('[data-sidebar-group]').forEach(group=>group.hidden=![...group.querySelectorAll('a')].some(a=>!a.hidden));
  });
  document.querySelector('[data-complete]').addEventListener('click',()=>{
    const id=state.component.id;
    state.progress.has(id)?state.progress.delete(id):state.progress.add(id);saveProgress();
    document.querySelector('[data-complete]').outerHTML=completionButton(state.component);
    bindCompletionOnly();toast(state.progress.has(id)?'Pieza marcada como comprendida.':'Pieza retirada de tu progreso.');
  },{once:true});
  document.querySelectorAll('[data-section]').forEach(button=>button.addEventListener('click',()=>{
    document.querySelectorAll('[data-section]').forEach(b=>b.classList.toggle('active',b===button));
    document.getElementById(button.dataset.section).scrollIntoView({behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth',block:'start'});
  }));
  document.querySelector('[data-copy-example]').addEventListener('click',()=>copyText(state.component.example));
  document.querySelectorAll('[data-copy-lesson-command]').forEach(button => {
    button.addEventListener('click', () => {
      const command = state.component.commands[Number(button.dataset.copyLessonCommand)][1];
      copyText(command);
    });
  });
  document.querySelectorAll('[data-case-guide]').forEach(button => {
    button.addEventListener('click', () => {
      const problem = state.component.problems[Number(button.dataset.caseGuide)];
      showDiagnosis(state.component, problem);
    });
  });
  document.querySelectorAll('[data-mode]').forEach(button=>button.addEventListener('click',()=>{state.fault=button.dataset.mode==='fault';state.inspected=null;updateDiagram();}));
  document.querySelectorAll('[data-problem]').forEach(button=>button.addEventListener('click',()=>{state.caseIndex=Number(button.dataset.problem);state.fault=true;state.inspected=null;updateDiagram();document.querySelector('#architecture').scrollIntoView({behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth',block:'start'});}));
  document.querySelector('[data-play]').addEventListener('click',togglePlayback);
  document.querySelectorAll('[data-zoom]').forEach(button=>button.addEventListener('click',()=>{
    const direction=Number(button.dataset.zoom);state.zoom=direction?Math.max(.8,Math.min(1.6,state.zoom+direction*.2)):1;state.pan={x:0,y:0};updateDiagram();
    toast(`Diagrama al ${Math.round(state.zoom*100)} %${state.zoom>1?' · arrastra el fondo para desplazarlo':''}.`);
  }));
  bindDiagramEvents();
}
function bindCompletionOnly() {
  document.querySelector('[data-complete]').addEventListener('click',()=>{
    const id=state.component.id;state.progress.has(id)?state.progress.delete(id):state.progress.add(id);saveProgress();
    document.querySelector('[data-complete]').outerHTML=completionButton(state.component);bindCompletionOnly();toast('Progreso actualizado en este navegador.');
  },{once:true});
}
function bindDiagramEvents() {
  document.querySelectorAll('[data-inspect]').forEach(button=>button.addEventListener('click',()=>{state.inspected=button.dataset.inspect;updateInsight();}));
  const viewport=document.querySelector('[data-graph]');if(!viewport)return;
  viewport.classList.toggle('is-zoomed',state.zoom>1);
  let origin;
  viewport.addEventListener('pointerdown',event=>{if(state.zoom<=1||event.target.closest('button'))return;origin={x:event.clientX,y:event.clientY,pan:{...state.pan}};viewport.setPointerCapture(event.pointerId);});
  viewport.addEventListener('pointermove',event=>{if(!origin)return;state.pan={x:Math.max(-200,Math.min(200,origin.pan.x+event.clientX-origin.x)),y:Math.max(-140,Math.min(140,origin.pan.y+event.clientY-origin.y))};const transform=viewport.querySelector('.graph-transform');transform.style.setProperty('--pan-x',`${state.pan.x}px`);transform.style.setProperty('--pan-y',`${state.pan.y}px`);});
  viewport.addEventListener('pointerup',()=>origin=null);viewport.addEventListener('pointercancel',()=>origin=null);
}
function updateDiagram() {
  document.querySelector('#diagram-container').innerHTML=componentDiagram(state.component,state.catalog,state);
  document.querySelector('#diagram-caption').textContent=diagramCaption(state.component,state.fault,state.caseIndex);
  document.querySelectorAll('[data-mode]').forEach(button=>{const active=button.dataset.mode===(state.fault?'fault':'normal');button.classList.toggle('active',active);button.setAttribute('aria-pressed',String(active));});
  document.querySelectorAll('[data-problem]').forEach(button=>button.classList.toggle('active',state.fault&&Number(button.dataset.problem)===state.caseIndex));
  bindDiagramEvents();updateInsight();
}
function updateInsight() {
  const component=state.component,inspected=get(state.inspected),problem=component.problems[state.caseIndex];
  const panel=document.querySelector('#graph-insight');
  if(inspected && inspected.id!==component.id) {
    panel.innerHTML=`<h3>${e(inspected.name)}</h3><span class="state-tag">Pieza relacionada</span><p>${e(inspected.summary)}</p><a class="primary-button" href="${href(inspected.id)}">Estudiar esta pieza →</a><button class="soft-button" data-return-insight>Volver a ${e(component.name)}</button><div class="flow-caption">${e(component.diagram.caption)}</div>`;
    panel.querySelector('[data-return-insight]').addEventListener('click',()=>{state.inspected=null;updateInsight();});return;
  }
  panel.innerHTML=`<h3>${state.fault?'¿Qué está pasando?':'Conoce esta pieza'}</h3>${state.fault?`<label class="case-label" for="case-selector">Escenario de producción</label><select class="case-selector" id="case-selector">${component.problems.map((p,i)=>p.diagnosticOnly?'':`<option value="${i}" ${i===state.caseIndex?'selected':''}>${e(p.name)}</option>`).join('')}</select><span class="state-tag warning">${e(problem.name)}</span><p>${e(problem.symptom)}</p><button class="primary-button" data-diagnose>Ver diagnóstico →</button><button class="soft-button" data-reset-demo>Reiniciar demo →</button>`:`<span class="state-tag">${e(component.name)}</span><p>${e(component.summary)}</p><button class="primary-button" data-fault-now>Simular un problema →</button>`}<div class="flow-caption" id="flow-caption">${flowCaption()}</div>`;
  panel.querySelector('[data-diagnose]')?.addEventListener('click',()=>showDiagnosis(component,problem));
  panel.querySelector('[data-reset-demo]')?.addEventListener('click',()=>{state.fault=false;state.step=-1;state.inspected=null;updateDiagram();});
  panel.querySelector('[data-fault-now]')?.addEventListener('click',()=>{state.fault=true;state.inspected=null;updateDiagram();});
  panel.querySelector('#case-selector')?.addEventListener('change',event=>{state.caseIndex=Number(event.target.value);updateDiagram();});
}
function flowCaption() {
  if(state.step>=0){const step=state.component.steps[state.step%state.component.steps.length];return `<strong>${e(step.title)}</strong>${e(step.description)}`;}
  return 'Selecciona una pieza del diagrama o reproduce el recorrido. Los enlaces nombran la relación que representan.';
}
function togglePlayback() {
  if(matchMedia('(prefers-reduced-motion: reduce)').matches){state.step=(state.step+1)%state.component.steps.length;state.playing=false;state.inspected=null;updateDiagram();const button=document.querySelector('[data-play]');button.textContent='▷ Siguiente paso';button.setAttribute('aria-pressed','false');return;}
  state.playing=!state.playing;clearInterval(flowTimer);
  const button=document.querySelector('[data-play]');button.setAttribute('aria-pressed',String(state.playing));button.textContent=state.playing?'Ⅱ Pausar':'▷ Reproducir';
  if(state.playing){
    state.step=0;state.inspected=null;updateDiagram();
    if(!matchMedia('(prefers-reduced-motion: reduce)').matches)flowTimer=setInterval(()=>{state.step=(state.step+1)%state.component.steps.length;updateDiagram();},3400);
    else {state.playing=false;button.textContent='▷ Siguiente paso';button.setAttribute('aria-pressed','false');toast('Movimiento reducido: el recorrido avanza por selección manual.');}
  }
}
function showDiagnosis(component,problem) {
  diagnosticDialog.innerHTML=`<div class="search-dialog-head"><h2 id="diagnostic-title">${e(problem.name)}</h2><button class="icon-button" data-close-diagnosis aria-label="Cerrar diagnóstico">×</button></div><p>${problem.source?'Incidente documentado':problem.diagnosticOnly?'Guía de diagnóstico':'Escenario didáctico'} de ${e(component.name)}.</p><h3>Lo que observas</h3><p>${e(problem.symptom)}</p><h3>${problem.source?'Causa documentada':'Una causa posible'}</h3><p>${e(problem.cause)}</p><h3>Cómo investigarlo</h3><p>${e(problem.fix)}</p><div class="panel-heading" style="margin-top:20px"><h3>Comando de referencia</h3><button class="copy-button" data-copy-diagnosis>Copiar</button></div><pre class="code-block" tabindex="0"><code>${e(problem.command)}</code></pre>${problem.source?`<p>${external(problem.source.url,problem.source.title)}</p>`:''}<p class="notice">${problem.diagnosticOnly?'Ajusta los nombres, el contexto y el namespace antes de consultar tu entorno.':'Este laboratorio explica el diagnóstico. El comando no se ejecuta ni se conecta a tu clúster.'}</p>`;
  diagnosticDialog.setAttribute('aria-labelledby','diagnostic-title');diagnosticDialog.showModal();
  diagnosticDialog.querySelector('[data-close-diagnosis]').addEventListener('click',()=>diagnosticDialog.close());
  diagnosticDialog.querySelector('[data-copy-diagnosis]').addEventListener('click',()=>copyText(problem.command));
}
async function copyText(text) {
  try{await navigator.clipboard.writeText(text);toast('Copiado al portapapeles.');}
  catch{toast('No se pudo acceder al portapapeles. Selecciona el código para copiarlo.');}
}

function renderLearningPath() {
  document.title='Ruta de aprendizaje · KubeExplora';
  const allIds=[...new Set(learningPaths.flatMap(path=>path.ids))];
  const done=allIds.filter(id=>state.progress.has(id)).length;
  main.innerHTML=`<div class="frame"><div class="route-intro"><header class="page-header"><h1>Una ruta, pieza por pieza.</h1><p>Empieza por las bases y avanza hasta la operación. Marca una pieza cuando puedas explicar qué hace y cómo se relaciona.</p></header><div class="progress-overview"><strong>${done} de ${allIds.length} piezas de la ruta</strong><p>Tu progreso se guarda en este navegador.</p><div class="progress-track" role="progressbar" aria-label="Progreso de la ruta" aria-valuenow="${done}" aria-valuemin="0" aria-valuemax="${allIds.length}" style="--progress:${100*done/allIds.length}%"><span></span></div></div></div><div class="route-grid">${learningPaths.map(path=>{
    const completed=path.ids.filter(id=>state.progress.has(id)).length,next=path.ids.find(id=>!state.progress.has(id))||path.ids[0];
    return `<section class="route-card">${icon(path.icon,55)}<div><h2>${e(path.name)}</h2><p>${e(path.description)}</p></div><ul>${path.ids.map(id=>`<li><a href="${href(id)}"><span class="${state.progress.has(id)?'lesson-done':''}" aria-hidden="true">${state.progress.has(id)?'●':'○'}</span>${e(get(id)?.name||id)}</a></li>`).join('')}</ul><div class="route-foot"><span>${completed} de ${path.ids.length} comprendidas</span><a class="text-link" href="${href(next)}">${completed===path.ids.length?'Repasar':'Continuar'} →</a></div></section>`;
  }).join('')}</div><p class="local-progress-note">La ruta reúne las bases; el catálogo permite explorar las ${state.catalog.length} unidades. <button data-reset-progress>Reiniciar mi progreso</button></p></div>`;
  document.querySelector('[data-reset-progress]').addEventListener('click',()=>{
    diagnosticDialog.innerHTML='<div class="search-dialog-head"><h2>¿Reiniciar tu progreso?</h2><button class="icon-button" data-cancel-reset aria-label="Cerrar">×</button></div><p>Se retirarán las marcas guardadas en este navegador.</p><div class="hero-actions"><button class="primary-button" data-confirm-reset>Reiniciar progreso</button><button class="soft-button" data-cancel-reset>Conservarlo</button></div>';
    diagnosticDialog.showModal();diagnosticDialog.querySelectorAll('[data-cancel-reset]').forEach(b=>b.addEventListener('click',()=>diagnosticDialog.close()));
    diagnosticDialog.querySelector('[data-confirm-reset]').addEventListener('click',()=>{state.progress.clear();saveProgress();diagnosticDialog.close();renderLearningPath();toast('Progreso reiniciado.');});
  });
}

const labs=[{id:'replicas',name:'¿Dónde caben los Pods?',subtitle:'Réplicas y scheduling',icon:'scale'},{id:'crash',name:'La app no arranca',subtitle:'Diagnóstico de reinicios',icon:'pod'},{id:'memory',name:'Memoria bajo presión',subtitle:'Requests, límites y OOM',icon:'node'},{id:'network',name:'El Service no responde',subtitle:'Selectores y endpoints',icon:'network'}];
function renderLabs() {
  document.title='Laboratorios · KubeExplora';
  main.innerHTML=`<div class="frame"><header class="page-header"><h1>Prueba. Observa. Entiende.</h1><p>Cambia una condición y observa el resultado. Son modelos simplificados para aprender, sin conexión a un clúster.</p></header><div class="labs-layout"><nav class="lab-selector" aria-label="Laboratorios">${labs.map(lab=>`<button data-lab="${lab.id}" class="${state.lab===lab.id?'active':''}" aria-pressed="${state.lab===lab.id}">${icon(lab.icon,40)}<span>${e(lab.name)}<small>${e(lab.subtitle)}</small></span></button>`).join('')}</nav><section class="lab-workspace" id="lab-workspace" data-ui></section></div></div>`;
  document.querySelectorAll('[data-lab]').forEach(button=>button.addEventListener('click',()=>{state.lab=button.dataset.lab;document.querySelectorAll('[data-lab]').forEach(b=>{b.classList.toggle('active',b===button);b.setAttribute('aria-pressed',String(b===button));});renderLabWorkspace();}));renderLabWorkspace();
}
function renderLabWorkspace() {
  const workspace=document.querySelector('#lab-workspace');
  if(state.lab==='replicas') {
    const allocation=scheduleReplicas(state.replicas);
    workspace.innerHTML=`<h2>¿Dónde caben los Pods?</h2><p class="lab-description">En este modelo hay dos nodos con tres espacios disponibles cada uno. Aumenta las réplicas: un Pod que no cabe permanece Pending. El scheduler real también evalúa requests, restricciones y políticas.</p><div class="lab-settings"><label>Réplicas deseadas: <output id="replica-output">${state.replicas}</output><input type="range" id="replica-slider" min="1" max="8" step="1" value="${state.replicas}"></label></div><div id="replicas-illustration">${replicasIllustration(allocation)}</div><div class="lab-result" id="replicas-result">${replicaResult(allocation)}</div><div class="lab-question"><h3>¿Qué ayuda cuando no hay capacidad?</h3><div class="answer-buttons"><button data-answer="correct" data-message="Añadir capacidad o ajustar requests con evidencia puede permitir la ubicación. Revisa antes los eventos del scheduler.">Revisar requests y capacidad</button><button data-answer="wrong" data-message="Reiniciar el mismo Pod no crea capacidad. La causa sigue presente.">Reiniciar el Pod sin revisar eventos</button></div><div id="lab-feedback" aria-live="polite"></div></div><p class="lab-related">Conecta con <a href="${href('scheduler')}">Scheduler</a>, <a href="${href('resources')}">requests y limits</a> y <a href="${href('hpa')}">HPA</a>.</p>`;
    workspace.querySelector('#replica-slider').addEventListener('input',event=>{state.replicas=Number(event.target.value);const allocation=scheduleReplicas(state.replicas);workspace.querySelector('#replica-output').textContent=state.replicas;workspace.querySelector('#replicas-illustration').innerHTML=replicasIllustration(allocation);workspace.querySelector('#replicas-result').innerHTML=replicaResult(allocation);});
  } else if(state.lab==='memory') {
    workspace.innerHTML=`<h2>Memoria bajo presión</h2><p class="lab-description">Este escenario modela un contenedor que supera su límite de memoria. En un clúster también hay OOM a nivel de nodo y expulsiones: el diagnóstico depende de eventos y del estado del contenedor.</p><div class="lab-settings"><label>Memoria usada: <output id="usage-output">${state.usage} MiB</output><input id="usage-slider" type="range" min="32" max="512" step="16" value="${state.usage}"></label><label>Límite del contenedor<select id="limit-select">${[64,128,256,384].map(n=>`<option value="${n}" ${state.limit===n?'selected':''}>${n} MiB</option>`).join('')}</select></label></div><div id="memory-result">${memoryIllustration()}</div><div class="lab-question"><h3>¿Subir el límite siempre resuelve el problema?</h3><div class="answer-buttons"><button data-answer="wrong" data-message="Un límite mayor puede ocultar una fuga y presionar al nodo. Primero investiga el consumo y el patrón de la aplicación.">Sí, basta con darle más memoria</button><button data-answer="correct" data-message="Compara consumo, logs, límites y capacidad. Ajusta con evidencia y corrige fugas si las hay.">No, hay que investigar el consumo</button></div><div id="lab-feedback" aria-live="polite"></div></div><p class="lab-related">Aprende sobre <a href="${href('resources')}">recursos</a> y <a href="${href('limitrange')}">LimitRange</a>.</p>`;
    workspace.querySelector('#usage-slider').addEventListener('input',event=>{state.usage=Number(event.target.value);workspace.querySelector('#usage-output').textContent=`${state.usage} MiB`;workspace.querySelector('#memory-result').innerHTML=memoryIllustration();});
    workspace.querySelector('#limit-select').addEventListener('change',event=>{state.limit=Number(event.target.value);workspace.querySelector('#memory-result').innerHTML=memoryIllustration();});
  } else if(state.lab==='network') {
    workspace.innerHTML=`<h2>El Service no responde</h2><p class="lab-description">Un Service selecciona Pods por sus labels. Aquí solo se consideran listos los Pods Ready. Cambia el selector y observa los endpoints elegibles.</p><div class="lab-settings"><label>Selector del Service<select id="selector-select"><option value="web" ${state.selector==='web'?'selected':''}>app: web</option><option value="api" ${state.selector==='api'?'selected':''}>app: api</option><option value="wrong" ${state.selector==='wrong'?'selected':''}>app: tienda</option></select></label></div><div id="network-result">${networkIllustration()}</div><div class="lab-question"><h3>¿Un Pod con la label correcta siempre recibe tráfico?</h3><div class="answer-buttons"><button data-answer="correct" data-message="Con el comportamiento normal de un Service, la preparación del endpoint importa. Revisa readiness y EndpointSlices, además del selector.">También debe estar preparado</button><button data-answer="wrong" data-message="Una label coincidente no garantiza que el contenedor esté preparado para atender. Inspecciona EndpointSlices y readiness.">Sí, la label es suficiente</button></div><div id="lab-feedback" aria-live="polite"></div></div><p class="lab-related">Conecta con <a href="${href('service')}">Service</a>, <a href="${href('endpointslice')}">EndpointSlice</a> y <a href="${href('probes')}">probes</a>.</p>`;
    workspace.querySelector('#selector-select').addEventListener('change',event=>{state.selector=event.target.value;workspace.querySelector('#network-result').innerHTML=networkIllustration();});
  } else {
    workspace.innerHTML=`<h2>La app no arranca</h2><p class="lab-description">La aplicación de este ejemplo espera una variable de configuración. El proceso termina al no encontrarla y el kubelet aplica la política de reinicio. CrashLoopBackOff no es una fase del Pod.</p><div id="crash-result">${crashIllustration()}</div><div class="lab-question"><h3>Los logs señalan “CONFIG_PATH missing”. ¿Qué revisarías?</h3><div class="answer-buttons"><button data-crash-fix>La configuración que recibe el contenedor</button><button data-answer="wrong" data-message="Escalar replica la misma configuración defectuosa. Primero corrige la causa indicada por los logs.">Aumentaría las réplicas sin más cambios</button></div><div id="lab-feedback" aria-live="polite"></div></div><p class="lab-related">Conecta con <a href="${href('pod')}">Pod</a>, <a href="${href('configmap')}">ConfigMap</a> y <a href="${href('probes')}">probes</a>.</p>`;
    workspace.querySelector('[data-crash-fix]').addEventListener('click',()=>{state.crashFixed=true;workspace.querySelector('#crash-result').innerHTML=crashIllustration();feedback(true,'Configuración corregida en la simulación. El contenedor puede iniciar; verifica también sus probes.');});
    workspace.querySelector('#crash-result').addEventListener('click',event=>{if(event.target.closest('[data-reset-crash]')){state.crashFixed=false;renderLabWorkspace();}});
  }
  workspace.querySelectorAll('[data-answer]').forEach(button=>button.addEventListener('click',()=>feedback(button.dataset.answer==='correct',button.dataset.message)));
}
function feedback(correct,message){document.querySelector('#lab-feedback').innerHTML=`<p class="answer-feedback ${correct?'correct':'wrong'}">${correct?'Correcto:':'Revisa:'} ${e(message)}</p>`;}
function replicaResult(result){return `<div><strong>${result.ready}</strong>ubicados</div><div><strong>${result.pending}</strong>Pending</div><p class="lab-finding">${result.pending?'La capacidad simulada se agotó. Observa qué condición impide el scheduling.':'Las réplicas caben en los dos nodos de esta simulación.'}</p>`;}
function memoryIllustration(){const memory=memoryState(state.usage,state.limit);return `<div class="memory-illustration"><div class="memory-pod ${memory.failed?'failed':''}">${icon('pod',70,memory.failed?'amber':'blue')}<strong>${memory.failed?'OOMKilled (simulado)':'Dentro del límite'}</strong></div><div class="memory-meter"><strong>${memory.usage} / ${memory.limit} MiB</strong><div class="memory-track ${memory.failed?'failed':''}" style="--usage:${memory.ratio*100}%"><span></span></div><p>${memory.failed?'El uso supera el límite de este contenedor. Investiga antes de ajustar.':'Este escenario aún no supera el límite configurado.'}</p></div></div>`;}
function networkIllustration(){const pods=[{name:'web-a',labels:{app:'web'},ready:true},{name:'web-b',labels:{app:'web'},ready:false},{name:'api-a',labels:{app:'api'},ready:true}];const eligible=serviceEndpoints({app:state.selector},pods);return `<div class="network-lab-board"><div class="network-service">${icon('network',60)}<strong>Service</strong><code>app: ${e(state.selector==='wrong'?'tienda':state.selector)}</code></div><div class="lab-pods">${pods.map(pod=>`<div class="lab-pod ${eligible.includes(pod)?'matched':''}">${icon('pod',45,eligible.includes(pod)?'mint':'blue')}<strong>${pod.name}</strong><code>app: ${pod.labels.app}</code><span>${pod.ready?'Ready':'Not Ready'}</span></div>`).join('')}</div></div><div class="lab-result"><div><strong>${eligible.length}</strong>endpoints elegibles</div><p class="lab-finding">${eligible.length?'Coinciden las labels y el Pod está Ready.':'No hay un Pod listo que coincida con este selector.'}</p></div>`;}
function crashIllustration(){return `<div class="crash-board"><div class="crash-visual">${icon('pod',80,state.crashFixed?'mint':'amber')}<span class="state-tag ${state.crashFixed?'':'warning'}">${state.crashFixed?'Contenedor iniciado':'CrashLoopBackOff'}</span>${state.crashFixed?'<button class="soft-button" data-reset-crash>Reiniciar escenario</button>':''}</div><pre class="code-block" aria-label="Salida de logs simulada"><code>${state.crashFixed?'[simulación]\nCONFIG_PATH=/config/app.yaml\nConfiguration loaded\nListening on :8080':'[simulación]\nERROR: CONFIG_PATH missing\nApplication exited (code 1)\nBack-off restarting container'}</code></pre></div>`;}

function renderNotFound() {
  document.title='Pieza no encontrada · KubeExplora';main.innerHTML='<div class="frame page-header"><div class="empty-state"><h1>Esa pieza no está aquí.</h1><p>El enlace puede estar incompleto. Vuelve al catálogo para explorar el clúster.</p><a class="button" href="#/explorar">Volver al catálogo →</a></div></div>';
}

function openSearch(){searchDialog.showModal();searchInput.value='';updateSearch();searchInput.focus();}
function updateSearch(){const matches=searchComponents(state.catalog,searchInput.value).slice(0,9);document.querySelector('#search-results').innerHTML=matches.length?matches.map(c=>`<a class="search-result" href="${href(c.id)}">${icon(c.icon,34)}<div><strong>${e(c.name)}</strong><p>${e(c.tagline)}</p></div><span aria-hidden="true">→</span></a>`).join(''):'<div class="empty-state"><p>No hay coincidencias. Prueba con otra pieza o problema.</p><a class="text-link" href="#/explorar">Ver todo el catálogo →</a></div>';document.querySelectorAll('.search-results a').forEach(link=>link.addEventListener('click',()=>searchDialog.close()));}
document.querySelector('#search-trigger').addEventListener('click',openSearch);
document.querySelector('[data-close-search]').addEventListener('click',()=>searchDialog.close());
searchInput.addEventListener('input',updateSearch);
searchInput.addEventListener('keydown',event=>{if(event.key==='Enter'){const first=document.querySelector('.search-results a');if(first){event.preventDefault();first.click();}}});
document.querySelector('#menu-trigger').addEventListener('click',event=>{const open=document.querySelector('.header-nav').classList.toggle('open');event.currentTarget.setAttribute('aria-expanded',String(open));});
document.querySelector('.skip-link').addEventListener('click',event=>{event.preventDefault();main.focus({preventScroll:true});main.scrollIntoView({block:'start'});});
document.addEventListener('keydown',event=>{
  if(event.key==='/'&&!['INPUT','TEXTAREA','SELECT'].includes(document.activeElement.tagName)&&!document.querySelector('dialog[open]')){event.preventDefault();openSearch();}
  if(event.key==='Escape'){
    const drawer=document.querySelector('.component-sidebar.open');
    if(drawer){drawer.classList.remove('open');const trigger=document.querySelector('.mobile-components-button');trigger.setAttribute('aria-expanded','false');trigger.focus();}
    const menu=document.querySelector('.header-nav.open');if(menu){menu.classList.remove('open');const trigger=document.querySelector('#menu-trigger');trigger.setAttribute('aria-expanded','false');trigger.focus();}
  }
});
for(const dialog of [searchDialog,diagnosticDialog])dialog.addEventListener('click',event=>{if(event.target===dialog){const bounds=dialog.getBoundingClientRect();if(event.clientX<bounds.left||event.clientX>bounds.right||event.clientY<bounds.top||event.clientY>bounds.bottom)dialog.close();}});
window.addEventListener('hashchange',()=>route());
document.addEventListener('visibilitychange',()=>{if(document.hidden)cleanup();});
try {
  const response=await fetch(new URL('./data/catalog.json',import.meta.url));if(!response.ok)throw new Error('No se pudo cargar el catálogo');
  state.catalog=await response.json();state.map=new Map(state.catalog.map(c=>[c.id,c]));
  state.progress=new Set([...state.progress].filter(id=>state.map.has(id)));route({preserveScroll:true});
}catch(error){main.innerHTML='<div class="frame page-header"><div class="empty-state"><h1>No pudimos cargar las piezas.</h1><p>Recarga la página o comprueba tu conexión.</p><button class="button" id="retry-load">Reintentar</button></div></div>';document.querySelector('#retry-load').addEventListener('click',()=>location.reload());console.error(error);}
