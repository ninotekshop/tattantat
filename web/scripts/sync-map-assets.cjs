// Mechanical copy of reviewed shared assets; no network access.
const {copyFileSync,mkdirSync}=require('node:fs');
const {resolve}=require('node:path');
const source=resolve(__dirname,'../../shared/map-picker'),target=resolve(__dirname,'../public/map-picker');
mkdirSync(target,{recursive:true});
for(const name of ['index.html','picker.js','picker.css','leaflet.js','leaflet.css','LICENSE'])copyFileSync(resolve(source,name),resolve(target,name));
