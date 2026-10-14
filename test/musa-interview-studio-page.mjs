import assert from "node:assert/strict";
import {renderMuseInterviewStudioPage,MUSA_STUDIO_CLIENT_JS} from "../src/musa-interview-studio-page.js";
for(const lang of ["it","de","en"]){
 const html=renderMuseInterviewStudioPage("book-123",lang);
 assert.ok(html.startsWith("<!doctype html>"));
 assert.ok(html.includes('lang="'+lang+'"'));
 assert.ok(html.includes('data-book="book-123"'));
 assert.ok(html.includes('src="/musa-intervista/app.js"'));
 assert.ok(html.includes('id="consent"'));
 assert.ok(html.includes('id="sessions"'));
 assert.ok(html.includes('id="transcript"'));
 assert.ok(html.includes('maxlength="10000"'));
 assert.ok(html.includes('role="status"'));
 assert.ok(!html.includes('onClick='));
}
assert.throws(()=>renderMuseInterviewStudioPage("../bad"),/invalid_book/);
assert.doesNotThrow(()=>new Function(MUSA_STUDIO_CLIENT_JS));
assert.match(MUSA_STUDIO_CLIENT_JS,/credentials:"same-origin"/);
assert.match(MUSA_STUDIO_CLIENT_JS,/textContent/);
assert.match(MUSA_STUDIO_CLIENT_JS,/expectedVersion/);
assert.match(MUSA_STUDIO_CLIENT_JS,/\/consenso/);
assert.match(MUSA_STUDIO_CLIENT_JS,/\/stato/);
assert.doesNotMatch(MUSA_STUDIO_CLIENT_JS,/innerHTML|localStorage|sessionStorage|eval\(/);
console.log("Musa interactive Studio page syntax, safety and language checks passed");
