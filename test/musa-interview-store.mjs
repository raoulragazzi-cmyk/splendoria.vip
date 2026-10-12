import assert from "node:assert/strict";
import {appendMuseAuthorTurn} from "../src/musa-interview-store.js";
const db={prepare(){return {bind(){return this},async run(){return {meta:{changes:1}}}}}};
const owner={authorized:true,userId:"test-user",projectId:"test-project"};
await assert.rejects(appendMuseAuthorTurn(db,"session",{...owner,authorized:false},1,"text"),/access_denied/);
await assert.rejects(appendMuseAuthorTurn(db,"session",owner,0,"text"),/invalid_turn/);
await assert.rejects(appendMuseAuthorTurn(db,"session",owner,1," "),/invalid_turn/);
assert.equal((await appendMuseAuthorTurn(db,"session",owner,1,"valid")).ordinal,1);
console.log("Musa persistence smoke passed");