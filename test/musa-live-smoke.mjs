import assert from 'node:assert/strict';
import base from '../src/worker.js';
import {createMusaWorker} from '../src/musa-live-worker.js';
const worker=createMusaWorker(base);
import {validMusaEmbed} from '../src/musa-live.js';
const origin='https://splendoria-v2-staging.raoulragazzi.workers.dev';
const embed='https://embed.liveavatar.com/v1/11111111-1111-1111-1111-111111111111?orientation=horizontal';
function env(role='admin', extra={}) {
  return {APP_URL:origin,ENVIRONMENT:'staging',MUSA_LIVE_ENABLED:'true',MUSA_LIVE_EMBED_URL:embed,ADMIN_EMAIL:'admin@example.test',DB:{prepare(sql){return {bind(){return this;},async first(){return sql.includes('JOIN "User"') ? {id:'test',email:role==='admin'?'admin@example.test':'client@example.test',emailVerifiedAt:'2026-01-01'}:{};},async all(){return {results:[]};},async run(){return {success:true};}};}},...extra};
}
async function get(environment,authenticated=true,path='/admin/musa-live') {
 return worker.fetch(new Request(origin+path,{headers:authenticated?{cookie:'spl_session=test'}:{}}),environment);
}
for (const [role,authenticated] of [['admin',false],['client',true]]) {
 const r=await get(env(role),authenticated); assert.equal(r.status,303); assert.equal(r.headers.get('location'),'/area-amministratore'); assert.ok(!(await r.text()).includes(embed)); assert.match(r.headers.get('permissions-policy'),/microphone=\(self\)/);
}
for(const extra of [{MUSA_LIVE_ENABLED:'false'},{ENVIRONMENT:'production'},{APP_URL:'https://www.splendoria.vip'}]) assert.equal((await get(env('admin',extra))).status,404);
const r=await get(env());const html=await r.text();
assert.equal(r.status,200);assert.match(r.headers.get('cache-control'),/no-store/);assert.match(r.headers.get('x-robots-tag'),/noindex/);assert.match(r.headers.get('permissions-policy'),/microphone=\(self "https:\/\/embed.liveavatar.com"\)/);
assert.ok(html.includes(embed));assert.ok(!html.includes('<iframe'));assert.ok(html.includes('video.replaceChildren()'));assert.ok(html.includes('non salva la trascrizione'));
const missing=await get(env('admin',{MUSA_LIVE_EMBED_URL:''}));assert.ok((await missing.text()).includes('non è ancora configurato'));
for(const bad of ['javascript:alert(1)','https://embed.liveavatar.com.evil.test/v1/x',embed+'&x=%22',embed+'#x',embed.replace('https:','http:'),embed.replace('embed.','user:pass@embed.')]) assert.equal(validMusaEmbed(bad),'');
const home=await get(env(),false,'/');assert.match(home.headers.get('permissions-policy'),/microphone=\(self\)/);
console.log('Musa live: auth, staging isolation, disabled/missing config, URL validation, no autoplay, privacy headers and scoped microphone passed.');
