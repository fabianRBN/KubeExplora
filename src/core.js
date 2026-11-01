export const categories = [
  {id:'fundamentos',name:'Fundamentos',icon:'cluster',description:'Las piezas que dan forma al clúster.'},
  {id:'arquitectura',name:'Arquitectura',icon:'controller',description:'Quién decide, reconcilia y ejecuta.'},
  {id:'cargas',name:'Aplicaciones',icon:'cube',description:'Cómo ejecutar y mantener tus cargas.'},
  {id:'red',name:'Red y acceso',icon:'network',description:'Cómo se encuentran y comunican las aplicaciones.'},
  {id:'almacenamiento',name:'Almacenamiento',icon:'storage',description:'Datos que acompañan a tu aplicación.'},
  {id:'configuracion',name:'Configuración',icon:'config',description:'Ajustes, recursos y salud de tus cargas.'},
  {id:'seguridad',name:'Seguridad',icon:'shield',description:'Identidad, permisos y aislamiento.'},
  {id:'operacion',name:'Escala y disponibilidad',icon:'scale',description:'Capacidad, ubicación y continuidad.'},
  {id:'extensiones',name:'Extensiones y operación',icon:'controller',description:'Cómo ampliar y observar Kubernetes.'}
];

export const escapeHTML = value => String(value ?? '').replace(/[&<>"']/g,character=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[character]));
export const normalize = value => String(value).normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
export function searchComponents(catalog, query='', category='all') {
  const words=normalize(query).trim().split(/\s+/).filter(Boolean);
  return catalog.filter(component=>{
    if(category!=='all' && component.category!==category) return false;
    const searchable=normalize([component.name,component.tagline,component.summary,component.category,...component.problems.map(p=>`${p.name} ${p.symptom} ${p.cause}`)].join(' '));
    return words.every(word=>searchable.includes(word));
  });
}
export function readProgress(storage) {
  try { const data=JSON.parse(storage.getItem('kubeexplora.progress')||'[]');return new Set(Array.isArray(data)?data.filter(v=>typeof v==='string'):[]); }
  catch { return new Set(); }
}
export function memoryState(usage, limit) {
  return {usage:Number(usage),limit:Number(limit),failed:Number(usage)>Number(limit),ratio:Math.min(Number(usage)/Number(limit),1)};
}
export function scheduleReplicas(replicas, nodes=2, capacity=3) {
  const allocation=Array.from({length:nodes},()=>0);let pending=0;
  for(let i=0;i<Number(replicas);i++) {
    const available=allocation.map((n,index)=>({n,index})).filter(v=>v.n<capacity).sort((a,b)=>a.n-b.n);
    if(available.length) allocation[available[0].index]++; else pending++;
  }
  return {allocation,pending,ready:allocation.reduce((sum,n)=>sum+n,0),desired:Number(replicas)};
}
export function serviceEndpoints(selector, pods) {
  return pods.filter(pod=>pod.ready && Object.entries(selector).every(([key,value])=>pod.labels[key]===value));
}
export const learningPaths = [
  {name:'Tu primer clúster',description:'Ubica las piezas antes de escribir un manifiesto.',icon:'cluster',ids:['cluster','node','namespace','pod','container','labels']},
  {name:'Del código a una carga',description:'Replica, actualiza y ejecuta trabajos.',icon:'cube',ids:['deployment','replicaset','statefulset','daemonset','job','cronjob']},
  {name:'Conecta las aplicaciones',description:'Descubre servicios, rutas y políticas.',icon:'network',ids:['service','endpointslice','coredns','ingress','gateway','networkpolicy']},
  {name:'Configura y guarda datos',description:'Separa configuración, recursos y persistencia.',icon:'storage',ids:['configmap','secret','resources','probes','pvc','storageclass']},
  {name:'Piensa en producción',description:'Identidad, disponibilidad y diagnóstico.',icon:'shield',ids:['serviceaccount','role','rolebinding','securitycontext','hpa','pdb']},
  {name:'Mira detrás del clúster',description:'Entiende la reconciliación y las extensiones.',icon:'controller',ids:['api-server','etcd','scheduler','kubelet','crd','operator']}
];

export function highlightCode(code,format='yaml') {
  return String(code).split('\n').map(line=>{
    if(format==='yaml') {
      const match=line.match(/^(\s*(?:- )?)([\w.-]+):(.*)$/);
      if(match) return `${escapeHTML(match[1])}<span class="code-key">${escapeHTML(match[2])}</span>:<span class="code-value">${escapeHTML(match[3])}</span>`;
    }
    if(line.trim().startsWith('#')) return `<span class="code-comment">${escapeHTML(line)}</span>`;
    return escapeHTML(line);
  }).join('\n');
}
