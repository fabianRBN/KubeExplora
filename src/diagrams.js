import {escapeHTML as e} from './core.js';

const shades={blue:['#8cc5ff','#438df4','#2667d9'],mint:['#89e3c8','#39b68e','#18896a'],amber:['#ffe39b','#f7bd52','#d89329']};
export function icon(kind='cube',size=52,tone='blue') {
  const [light,front,side]=shades[tone]||shades.blue;
  const cube=`<path fill="${light}" d="M40 5 72 23 40 42 8 23Z"/><path fill="${front}" d="M8 23 40 42v35L8 58Z"/><path fill="${side}" d="m40 42 32-19v35L40 77Z"/><path d="M18 37v16m8-12v16" stroke="${side}" stroke-width="3" stroke-linecap="round"/>`;
  const drawings={
    cube,pod:`<rect x="3" y="2" width="74" height="76" rx="13" fill="#e1f0ff"/>${cube}`,
    node:`<rect x="12" y="5" width="56" height="70" rx="8" fill="${light}"/><rect x="18" y="13" width="44" height="21" rx="4" fill="${side}"/><rect x="18" y="41" width="44" height="23" rx="4" fill="${front}"/><path d="M25 23h12m-12 29h12" stroke="white" stroke-width="3" stroke-linecap="round"/><circle cx="54" cy="23" r="2" fill="white"/>`,
    storage:`<path d="M14 17v43c0 18 52 18 52 0V17Z" fill="${front}"/><ellipse cx="40" cy="17" rx="26" ry="12" fill="${light}"/><path d="M14 34c0 16 52 16 52 0m-52 16c0 16 52 16 52 0" fill="none" stroke="${side}" stroke-width="3"/>`,
    network:`<path d="m40 19-21 39m21-39 21 39M19 58h42" fill="none" stroke="${side}" stroke-width="5"/><circle cx="40" cy="16" r="13" fill="${front}"/><circle cx="17" cy="61" r="13" fill="${front}"/><circle cx="63" cy="61" r="13" fill="${light}"/>`,
    config:`<path d="M17 5h34l13 14v55H17Z" fill="${light}"/><path d="M51 5v16h13" fill="${front}"/><path d="M26 32h29m-29 11h23m-23 11h29" stroke="${side}" stroke-width="4" stroke-linecap="round"/>`,
    shield:`<path d="m40 5 29 12v23c0 20-29 35-29 35S11 60 11 40V17Z" fill="${front}"/><path d="m25 39 11 11 21-25" fill="none" stroke="white" stroke-width="6" stroke-linecap="round" stroke-linejoin="round"/>`,
    scale:`<path d="M9 68h62M16 62V44h11v18m8 0V29h11v33m8 0V12h11v50" fill="${front}" stroke="${side}" stroke-width="3"/><path d="m13 29 20-14 14 4L68 5" fill="none" stroke="${side}" stroke-width="3"/>`,
    terminal:`<rect x="5" y="13" width="70" height="53" rx="9" fill="${side}"/><path d="m17 30 12 10-12 10m21 0h22" fill="none" stroke="white" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>`,
    clock:`<circle cx="40" cy="40" r="31" fill="${light}"/><path d="M40 20v22l14 9" stroke="${side}" stroke-width="5" fill="none" stroke-linecap="round"/>`,
    cluster:`<path d="m40 5 32 18v34L40 75 8 57V23Z" fill="${light}"/><g fill="${side}"><circle cx="40" cy="24" r="9"/><circle cx="24" cy="52" r="9"/><circle cx="56" cy="52" r="9"/></g><path d="m40 24-16 28h32Z" fill="none" stroke="${front}" stroke-width="4"/>`,
    controller:`<path d="M16 21h48v40H16Z" fill="${light}"/><path d="m30 12-14 9 14 8m20 43 14-11-14-8" stroke="${side}" stroke-width="5" fill="none" stroke-linecap="round" stroke-linejoin="round"/><path d="M40 29v22m-9-11h18" stroke="${front}" stroke-width="4"/>`
  };
  return `<svg class="object-icon" width="${size}" height="${size}" viewBox="0 0 80 80" aria-hidden="true">${drawings[kind]||cube}</svg>`;
}

export function homeDiagram() {
  const item=(id,label,kind,tone='blue')=>`<button class="home-piece" data-home-inspect="${id}" aria-label="Explorar ${label}">${icon(kind,54,tone)}<span>${label}</span></button>`;
  return `<section class="home-map" data-ui aria-labelledby="home-map-title"><h2 id="home-map-title">Tu primer clúster</h2><div class="home-cluster">
    <span class="cluster-label">${icon('cluster',28)} Clúster</span>
    <div class="control-plane"><span class="group-title">Control plane</span><div>${item('api-server','API server','cube')}${item('scheduler','Scheduler','clock')}${item('etcd','etcd','storage')}</div></div>
    <svg class="home-links" viewBox="0 0 800 500" preserveAspectRatio="none" aria-hidden="true"><defs><marker id="home-arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="5" markerHeight="5" orient="auto"><path d="M0 0 10 5 0 10Z" fill="#2864f0"/></marker></defs><path class="stream" d="M360 270V325H125V385M360 325H525V385" fill="none" stroke="#2864f0" stroke-width="2.5" marker-end="url(#home-arrow)"/></svg>
    <div class="home-service">${item('service','Service','network')}</div>
    <div class="home-worker worker-a"><button class="worker-label" data-home-inspect="node">${icon('node',25)}Node A</button><div>${item('pod','Pod','pod')}${item('pod','Pod','cube')}</div></div>
    <div class="home-worker worker-b"><button class="worker-label" data-home-inspect="node">${icon('node',25)}Node B</button><div>${item('pod','Pod','cube')}${item('pod','Pod','cube')}</div></div>
    <div class="home-popover" id="home-popover"><div><strong>Pod</strong><button data-close-home aria-label="Cerrar explicación">×</button></div><p>Aquí vive tu aplicación.</p><a href="#/componente/pod">Abrir componente →</a></div>
  </div><div class="home-map-bottom"><span id="home-tour-text">Selecciona una pieza para descubrirla.</span><button class="soft-button" data-home-play aria-pressed="false"><span aria-hidden="true">▷</span> Ver el recorrido</button></div></section>`;
}

function nodeButton(component,position,{active=false,fault=false}={}) {
  return `<button class="graph-node ${active?'current':''} ${fault?'fault-node':''}" style="--x:${position[0]}%;--y:${position[1]}%" data-inspect="${e(component.id)}" aria-label="Inspeccionar ${e(component.name)}">${icon(component.icon,52,active?'blue':component.category==='cargas'?'mint':'blue')}<span>${e(component.name)}</span>${fault?'<span class="fault-mark" aria-label="Problema simulado">!</span>':''}</button>`;
}

export function componentDiagram(component, catalog, {fault=false,step=-1,zoom=1,caseIndex=0}={}) {
  const map=new Map(catalog.map(c=>[c.id,c]));
  if(component.id==='pod') return podDiagram(fault,step,zoom,component.problems[caseIndex]?.name);
  const links=component.diagram.links;
  const ids=[...new Set(links.flatMap(link=>link.slice(0,2)))];
  if(!ids.includes(component.id))ids.push(component.id);
  const layouts={
    1:[[50,50]],2:[[27,50],[73,50]],3:[[17,50],[50,50],[83,50]],
    4:[[22,24],[76,24],[22,76],[76,76]],
    5:[[17,20],[50,20],[83,20],[30,76],[72,76]],
    6:[[16,23],[50,23],[84,23],[16,76],[50,76],[84,76]]
  };
  const positions=Object.fromEntries(ids.map((id,i)=>[id,(layouts[Math.min(ids.length,6)]||layouts[6])[i]]));
  const lines=links.map(([from,to,label],index)=>{
    if(!positions[from]||!positions[to])return '';
    const [ax,ay]=positions[from],[bx,by]=positions[to];
    const x1=ax*8,y1=ay*4,x2=bx*8,y2=by*4;
    const angle=Math.atan2(y2-y1,x2-x1),margin=63;
    const sx=x1+Math.cos(angle)*margin,sy=y1+Math.sin(angle)*margin,ex=x2-Math.cos(angle)*margin,ey=y2-Math.sin(angle)*margin;
    return `<g class="graph-edge ${index===step?'is-lit':''} ${fault && (from===component.id || to===component.id)?'interrupted':''}"><path d="M${sx} ${sy} L${ex} ${ey}" marker-end="url(#graph-arrow)"/></g>`;
  }).join('');
  const markers=links.map(([from,to],index)=>{const [ax,ay]=positions[from],[bx,by]=positions[to];const t=ay===by?.5:.34;return `<span class="graph-edge-index ${index===step?'is-lit':''}" style="--x:${ax+(bx-ax)*t}%;--y:${ay+(by-ay)*t}%" aria-hidden="true">${index+1}</span>`;}).join('');
  const legend=`<ol class="graph-relationships" aria-label="Relaciones del diagrama">${links.map(([from,to,label],index)=>`<li class="${index===step?'is-lit':''}"><span class="relationship-index">${index+1}</span><div><strong>${e(map.get(from)?.name)} → ${e(map.get(to)?.name)}</strong><span>${e(label)}</span></div></li>`).join('')}</ol>`;
  return `<div class="architecture-viewport template-${e(component.diagram.template)}" data-graph style="--zoom:${zoom}"><div class="graph-transform"><span class="graph-cluster-label">${icon('cluster',24)} Relaciones de ${e(component.name)}</span><svg class="graph-edges" viewBox="0 0 800 400" preserveAspectRatio="none" aria-hidden="true"><defs><marker id="graph-arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="5" markerHeight="5" orient="auto"><path d="M0 0 10 5 0 10Z" fill="#5b91da"/></marker></defs>${lines}</svg>${markers}${ids.map(id=>nodeButton(map.get(id)||{id,name:id,icon:'cube'},positions[id]||[50,50],{active:id===component.id,fault:fault&&id===component.id})).join('')}</div></div>${legend}`;
}

function podDiagram(fault,step,zoom,problem='CrashLoopBackOff') {
  if(fault && problem==='Pending')return `<div class="architecture-viewport pod-architecture pending-architecture" data-graph style="--zoom:${zoom}"><div class="graph-transform"><span class="graph-cluster-label">${icon('cluster',24)} Clúster · escenario FailedScheduling</span><div class="pod-owners"><button class="mini-object" data-inspect="replicaset">${icon('cube',43)}<span>ReplicaSet</span></button><span class="ownership-arrow">declara →</span><button class="mini-object" data-inspect="pod">${icon('pod',43,'amber')}<span>Pod / web</span></button></div><button class="pending-pod mini-object" data-inspect="pod">${icon('pod',62,'amber')}<strong>Pending</strong><span>Espera una ubicación</span></button><span class="pending-relation">sin asignar →</span><div class="empty-worker"><button class="node-title" data-inspect="node">${icon('node',28)}Node A</button><p>No cumple los requisitos de este escenario.</p></div></div></div>`;
  return `<div class="architecture-viewport pod-architecture" data-graph style="--zoom:${zoom}"><div class="graph-transform">
    <span class="graph-cluster-label">${icon('cluster',24)} Clúster</span>
    <div class="pod-owners"><button class="mini-object ${step===0?'step-active':''}" data-inspect="deployment">${icon('cube',43,'mint')}<span>Deployment</span></button><span class="ownership-arrow">gestiona →</span><button class="mini-object ${step===1?'step-active':''}" data-inspect="replicaset">${icon('cube',43)}<span>ReplicaSet</span></button></div>
    <div class="pod-node-box"><button class="node-title" data-inspect="node">${icon('node',24)} Node A</button></div>
    <svg class="pod-relations" viewBox="0 0 800 400" preserveAspectRatio="none" aria-hidden="true"><defs><marker id="pod-arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="5" markerHeight="5" orient="auto"><path d="M0 0 10 5 0 10Z" fill="#2864f0"/></marker></defs><path class="owner-path ${step===1?'is-lit':''}" d="M518 135V185H450V218"/><path class="traffic-path ${fault?'interrupted':''} ${step===2?'is-lit':''}" d="M133 286H325"/><path class="mount-path" d="M650 286H560"/></svg>
    <button class="pod-service-mini mini-object" data-inspect="service">${icon('network',48)}<span>Service</span></button><span class="traffic-label">${fault?'sin endpoint Ready':'tráfico'}</span>
    <button class="pod-box ${fault?'pod-failed':''}" data-inspect="pod"><strong>Pod / web</strong>${icon('cube',60)}<span>${fault&&problem==='ImagePullBackOff'?'Imagen pendiente':'Contenedor nginx'}</span><small>${fault?e(problem):'IP del Pod'}</small>${fault?'<span class="fault-mark">!</span>':''}</button>
    <button class="pod-volume mini-object" data-inspect="volume">${icon('storage',48)}<span>Volumen<br>opcional</span></button>
  </div></div>`;
}

export function diagramCaption(component,fault,caseIndex=0) {
  if(component.id==='pod' && fault) {
    const name=component.problems[caseIndex]?.name;
    if(name==='Pending')return 'En este escenario el Pod aún no tiene un Node asignado. Revisa los eventos de scheduling.';
    if(name==='ImagePullBackOff')return 'Se reintenta descargar la imagen; el contenedor todavía no puede arrancar.';
    if(name==='OOMKilled')return 'Este escenario supera el límite de memoria del contenedor. Investiga el consumo y los eventos.';
    return 'El Pod sigue existiendo; el contenedor se reinicia según su política.';
  }
  return component.diagram.caption;
}

export function replicasIllustration(state) {
  return `<div class="replicas-board">${state.allocation.map((count,index)=>`<div class="replica-node"><span>${icon('node',30)}Node ${index===0?'A':'B'}</span><div class="replica-slots">${Array.from({length:3},(_,i)=>i<count?`<span class="replica-pod">${icon('pod',48)}<small>Ready</small></span>`:'<span class="replica-empty" aria-label="Espacio disponible"></span>').join('')}</div></div>`).join('')}${state.pending?`<div class="pending-pods"><strong>${state.pending} Pending</strong><span>No caben con la capacidad de esta simulación.</span></div>`:''}</div>`;
}
