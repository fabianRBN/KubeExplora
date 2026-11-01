import {readFile,mkdir,rm,copyFile} from 'node:fs/promises';
import {resolve,relative,dirname,sep} from 'node:path';
import {projectRoot,walk,readCatalog,validateCatalog,validateFiles} from './validate.mjs';
const catalog=await readCatalog();const content=validateCatalog(catalog);const resources=await validateFiles();
const output=resolve(projectRoot,'dist');
if(output!==resolve(projectRoot,'dist')||!output.startsWith(projectRoot+sep))throw new Error('Salida fuera del directorio generado.');
await rm(output,{recursive:true,force:true});await mkdir(output,{recursive:true});
const files=[resolve(projectRoot,'index.html'),resolve(projectRoot,'credits.html'),...await walk(resolve(projectRoot,'src')),...await walk(resolve(projectRoot,'assets'))];
for(const file of files){const destination=resolve(output,relative(projectRoot,file));await mkdir(dirname(destination),{recursive:true});await copyFile(file,destination);}
const {writeFile}=await import('node:fs/promises');
await writeFile(resolve(output,'build.json'),JSON.stringify({app:'KubeExplora',version:JSON.parse(await readFile(resolve(projectRoot,'package.json'),'utf8')).version,commit:process.env.GITHUB_SHA||'local',...content},null,2)+'\n');
console.log(`Build correcto: ${content.components} unidades, ${content.problems} escenarios y ${content.yamlDocuments} documentos YAML.`);
console.log(`${resources.files} archivos públicos, ${resources.references} referencias locales comprobadas. Salida: dist/`);
