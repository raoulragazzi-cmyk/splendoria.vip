import assert from "node:assert/strict";
import worker from "../src/german-editorial-room-worker.js";

const env={
 APP_URL:"https://www.splendoria.vip",
 ADMIN_EMAIL:"admin@example.test",EMAIL_FROM:"contatti@example.test",
 DB:{prepare(sql){return {bind(){return this},async first(){return null},async all(){return {results:[]}},async run(){return {meta:{changes:0}}}}}},
 AI:{async run(){return {response:"Test"}}}
};
const routes=[["/","Vai al contenuto principale"],["/de/","Zum Hauptinhalt springen"],["/en/","Skip to main content"]];
for(const [path,label] of routes){
 const res=await worker.fetch(new Request("https://www.splendoria.vip"+path),env);
 assert.equal(res.status,200,path);
 const html=await res.text();
 assert.ok(html.includes('class="skip-link" href="#main-content"'),path+" missing skip link");
 assert.ok(html.includes(label),path+" missing localized label");
 assert.ok(html.includes('id="main-content"'),path+" missing main landmark");
 assert.equal((html.match(/class="skip-link" href="#main-content"/g)||[]).length,1,path+" duplicate skip link");
}
console.log("Splendoria final-entry keyboard skip-link checks passed IT/DE/EN");
