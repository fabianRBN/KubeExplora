import {readFile,readdir} from 'node:fs/promises';
import {resolve,dirname,extname,isAbsolute} from 'node:path';
import {fileURLToPath} from 'node:url';
import {parseAllDocuments} from 'yaml';
export const projectRoot=resolve(dirname(fileURLToPath(import.meta.url)),'..');
export const expectedIds='cluster,node,namespace,pod,container,labels,api-server,etcd,scheduler,controller-manager,cloud-controller-manager,kubelet,kube-proxy,container-runtime,kubectl,deployment,replicaset,statefulset,daemonset,job,cronjob,replicationcontroller,init-container,sidecar,ephemeral-container,service,endpointslice,ingress,ingress-controller,gateway-api,gateway,httproute,networkpolicy,coredns,cni,volume,pv,pvc,storageclass,csi,volumesnapshot,projected-volume,ephemeral-volume,configmap,secret,downward-api,probes,resources,resourcequota,limitrange,serviceaccount,role,rolebinding,clusterrole,clusterrolebinding,securitycontext,pod-security,admission-webhook,validatingadmissionpolicy,hpa,metrics-server,vpa,priorityclass,taints,affinity,topologyspread,pdb,crd,operator,apiservice,controller,event,lease,runtimeclass,csr'.split(',');
export async function readCatalog(){return JSON.parse(await readFile(resolve(projectRoot,'src/data/catalog.json'),'utf8'));}
export function validateCatalog(catalog){
  const errors=[],ids=new Set(catalog.map(c=>c.id));let yamlDocuments=0;
  if(catalog.length!==expectedIds.length||ids.size!==catalog.length)errors.push('El catálogo debe tener 75 IDs únicos.');
  for(const id of expectedIds)if(!ids.has(id))errors.push(`Falta ${id}`);
  const categories=new Set(['fundamentos','arquitectura','cargas','red','almacenamiento','configuracion','seguridad','operacion','extensiones']);
  const fields=['name','tagline','summary','purpose','analogy','kind','icon','format','example','exampleNote'];
  for(const c of catalog){
    for(const field of fields)if(typeof c[field]!=='string'||!c[field].trim())errors.push(`${c.id}: ${field} vacío.`);
    if(!categories.has(c.category))errors.push(`${c.id}: categoría no reconocida.`);
    if(c.steps?.length!==3||c.practices?.length<3||c.problems?.length<2)errors.push(`${c.id}: faltan pasos, prácticas o problemas.`);
    for(const step of c.steps||[])if(!step.title||!step.description)errors.push(`${c.id}: paso incompleto.`);
    for(const p of c.problems||[])for(const field of ['id','name','symptom','cause','fix','command'])if(!p[field])errors.push(`${c.id}: problema incompleto (${field}).`);
    if(!c.source?.url?.startsWith('https://'))errors.push(`${c.id}: fuente inválida.`);
    for(const id of c.related||[])if(!ids.has(id))errors.push(`${c.id}: relación desconocida ${id}.`);
    const nodes=new Set();
    for(const link of c.diagram?.links||[]){
      if(link.length!==3||!link[2])errors.push(`${c.id}: enlace de diagrama incompleto.`);
      for(const id of link.slice(0,2)){nodes.add(id);if(!ids.has(id))errors.push(`${c.id}: nodo desconocido ${id}.`);}
    }
    if(!nodes.has(c.id)||nodes.size>6||nodes.size<2||!c.diagram.caption)errors.push(`${c.id}: diagrama fuera de límites.`);
    if(c.format==='yaml'){
      const docs=parseAllDocuments(c.example);
      for(const doc of docs){
        if(doc.errors.length){errors.push(`${c.id}: YAML inválido: ${doc.errors.map(e=>e.message).join('; ')}`);continue;}
        const value=doc.toJS();if(!value||typeof value!=='object'||!value.apiVersion||!value.kind)errors.push(`${c.id}: documento sin apiVersion/kind.`);
        yamlDocuments++;
      }
    }else if(c.format!=='shell')errors.push(`${c.id}: formato desconocido.`);
  }
  if(errors.length)throw new Error(errors.join('\n'));
  return {components:catalog.length,problems:catalog.reduce((sum,c)=>sum+c.problems.length,0),yamlDocuments};
}
export async function walk(dir){const result=[];for(const entry of await readdir(dir,{withFileTypes:true})){const path=resolve(dir,entry.name);if(entry.isSymbolicLink())throw new Error(`Enlace simbólico no permitido: ${path}`);if(entry.isDirectory())result.push(...await walk(path));else result.push(path);}return result;}
export async function validateFiles(root=projectRoot){
  const files=[resolve(root,'index.html'),resolve(root,'credits.html'),...await walk(resolve(root,'src')),...await walk(resolve(root,'assets'))];
  const available=new Set(files);let references=0;
  const local=(source,url)=>{
    if(!url||url.startsWith('#')||/^(?:[a-z][\w+.-]*:|\/\/)/i.test(url))return;
    if(url.startsWith('/'))throw new Error(`Ruta absoluta incompatible con Pages: ${source}: ${url}`);
    const clean=decodeURIComponent(url.split(/[?#]/)[0]);
    const path=resolve(dirname(source),clean+(clean.endsWith('/')?'index.html':''));
    if(!available.has(path))throw new Error(`Recurso local inexistente: ${source}: ${url}`);
    references++;
  };
  for(const file of files){
    const extension=extname(file);if(!['.html','.css','.js'].includes(extension))continue;
    const source=await readFile(file,'utf8');
    if(extension==='.html')for(const match of source.matchAll(/(?:src|href)=["']([^"']+)["']/g))local(file,match[1]);
    if(extension==='.css')for(const match of source.matchAll(/url\(\s*["']?([^)'"\s]+)["']?\s*\)/g))local(file,match[1]);
    if(extension==='.js'){
      for(const match of source.matchAll(/(?:from\s*|import\s*)['"](\.[^'"]+)['"]/g))local(file,match[1]);
      for(const match of source.matchAll(/new URL\(['"](\.[^'"]+)['"]/g))local(file,match[1]);
    }
  }
  return {files:files.length,references};
}
