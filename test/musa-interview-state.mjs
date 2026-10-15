import assert from "node:assert/strict";
import {changeMuseSessionStatus} from "../src/musa-interview-state.js";
let changes=1,seen;
const db={prepare(sql){return {bind(...args){seen={sql,args};return this},async run(){return {meta:{changes}}}}}};
const owner={authorized:true,userId:"u1",projectId:"p1"};
for(const [action,from,to] of [["pause","active","paused"],["resume","paused","active"],["complete","active","completed"]]){
 const response=await changeMuseSessionStatus(db,"s1",owner,action,2);
 assert.deepEqual(response,{status:to,version:3});
 assert.ok(seen.sql.includes('"version"=?'));
 assert.ok(seen.sql.includes('EXISTS(SELECT 1 FROM "BookProject"'));
 assert.equal(seen.args[5],from);
}
await assert.rejects(changeMuseSessionStatus(db,"s1",{...owner,authorized:false},"pause",2),/access_denied/);
await assert.rejects(changeMuseSessionStatus(db,"s1",owner,"resume",-1),/invalid_version/);
await assert.rejects(changeMuseSessionStatus(db,"s1",owner,"restart",2),/invalid_action/);
changes=0;
await assert.rejects(changeMuseSessionStatus(db,"s1",owner,"pause",2),/state_conflict/);
console.log("Musa state transitions and optimistic locking passed");
