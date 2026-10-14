import assert from "node:assert/strict";
import {handleMuseInterviewApi} from "../src/musa-interview-api.js";
const url="https://studio.example/api/musa/libro/p1/sessioni";
const req=(path=url,method="POST",headers={})=>new Request(path,{method,headers});
const off={ENVIRONMENT:"production",MUSA_INTERVIEW_API_ENABLED:"true"};
const disabled={ENVIRONMENT:"staging"};
assert.equal((await handleMuseInterviewApi(req(),off)).status,404);
assert.equal((await handleMuseInterviewApi(req(),disabled)).status,404);
const on={ENVIRONMENT:"staging",MUSA_INTERVIEW_API_ENABLED:"true"};
assert.equal((await handleMuseInterviewApi(req(url,"POST",{"Origin":"https://elsewhere.example"}),on)).status,403);
assert.equal((await handleMuseInterviewApi(req(url,"POST",{"Origin":"https://studio.example","Sec-Fetch-Site":"cross-site"}),on)).status,403);
assert.equal((await handleMuseInterviewApi(req(url,"POST"),on)).status,403);
assert.equal((await handleMuseInterviewApi(req(url,"PUT"),on)).status,405);
// GET now lists prior sessions; without authentication it must return 404, not 405.
assert.equal((await handleMuseInterviewApi(req(url,"GET"),on)).status,404);
assert.equal((await handleMuseInterviewApi(req(url,"POST",{"Origin":"https://studio.example"}),on)).status,404);
assert.equal(await handleMuseInterviewApi(req("https://studio.example/another","GET"),on),null);
console.log("Musa API feature flag, origin and unauthenticated guards passed");
