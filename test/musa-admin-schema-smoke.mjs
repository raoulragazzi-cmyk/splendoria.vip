import assert from 'node:assert/strict';
import {DatabaseSync} from 'node:sqlite';
import {readFileSync} from 'node:fs';
import bcrypt from 'bcryptjs';
import base from '../src/worker.js';
import {createMusaWorker} from '../src/musa-live-worker.js';
const worker=createMusaWorker(base);
const db=new DatabaseSync(':memory:');
db.exec(readFileSync(new URL('./fixtures/staging-admin-schema-before.sql',import.meta.url),'utf8'));
db.prepare('INSERT INTO User(id,email,passwordHash,nome) VALUES (?,?,?,?)').run('synthetic-admin','admin@example.test',await bcrypt.hash('synthetic-test-only',4),'Test');
const DB={prepare(sql){let args=[];return {bind(...values){args=values;return this;},async first(){return db.prepare(sql).get(...args)||null;},async all(){return {results:db.prepare(sql).all(...args)};},async run(){const r=db.prepare(sql).run(...args);return {success:true,meta:{changes:r.changes}};}};},async batch(queries){const out=[];for(const q of queries)out.push(await q.run());return out;}};
let sentCode='';let sends=0;
const origin='https://splendoria-v2-staging.raoulragazzi.workers.dev';
const env={DB,APP_URL:origin,ENVIRONMENT:'staging',MUSA_LIVE_ENABLED:'true',MUSA_LIVE_EMBED_URL:'https://embed.liveavatar.com/v1/11111111-1111-1111-1111-111111111111',ADMIN_EMAIL:'admin@example.test',EMAIL_FROM:'test@example.test',ADMIN_EMAIL_NOTIFICATION:{async send(message){sends++;sentCode=message.text.match(/\b\d{6}\b/)[0];return {};}}};
async function post(path,fields){return worker.fetch(new Request(origin+path,{method:'POST',headers:{origin,'content-type':'application/x-www-form-urlencoded'},body:new URLSearchParams(fields)}),env);}
const fields={email:'admin@example.test',password:'synthetic-test-only'};
assert.equal((await post('/area-amministratore',fields)).status,500,'reproduce original missing table failure');
assert.equal(sends,0);
db.exec(readFileSync(new URL('../ops/staging-admin-repair-20260925.sql',import.meta.url),'utf8'));
const login=await post('/area-amministratore',fields);
assert.equal(login.status,303);assert.equal(sends,1);
const challenge=new URL(login.headers.get('location'),origin).searchParams.get('challenge');
assert.ok(challenge&&sentCode);
const wrong=await post('/verifica-amministratore',{challenge,code:sentCode==='000000'?'111111':'000000'});
assert.equal(wrong.headers.get('set-cookie'),null,'incorrect code must not grant session');
const verified=await post('/verifica-amministratore',{challenge,code:sentCode});assert.equal(verified.status,303);
const cookie=verified.headers.get('set-cookie').split(';')[0];
for(const path of ['/admin','/admin/musa-live']){
 const r=await worker.fetch(new Request(origin+path,{headers:{cookie}}),env);assert.equal(r.status,200,path);
 const html=await r.text();assert.ok(html.includes(path==='/admin'?'Prova la Musa in video':'Inizia la prova con la Musa'));
}
const replay=await post('/verifica-amministratore',{challenge,code:sentCode});assert.equal(replay.headers.get('set-cookie'),null,'OTP replay must not grant session');
assert.equal(db.prepare('SELECT COUNT(*) AS n FROM User').get().n,1);
db.close();
console.log('PASS: original failure reproduced; repair; password + OTP + dashboard + Musa; invalid/replayed OTP rejected. Synthetic local data only; no emails sent.');
