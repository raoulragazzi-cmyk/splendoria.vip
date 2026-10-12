import assert from "node:assert/strict";
import { renderMusaInterviewPrototype } from "../src/musa-interview-prototype.js";
for(const lang of ["it","de","en"]){
 const html=renderMusaInterviewPrototype(lang);
 assert.ok(html.startsWith("<!doctype html>"));
 assert.ok(html.includes('lang="'+lang+'"'));
 assert.ok(html.includes("Nessuna risposta viene salvata") || html.includes("werden nicht gespeichert") || html.includes("Answers are not saved"));
 assert.ok(html.includes('id="send"'));
 assert.ok(html.includes('id="refuse"'));
 assert.ok(html.includes('maxlength="10000"'));
 assert.ok(html.includes("textContent=value"));
 assert.ok(!html.includes('fetch('));
}
assert.throws(()=>renderMusaInterviewPrototype("fr"), /unsupported_locale/);
console.log("Musa prototype checks passed");
