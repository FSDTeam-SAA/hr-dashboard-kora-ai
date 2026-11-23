import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import ts from "typescript";
const js = ts.transpileModule(fs.readFileSync(new URL("../lib/people-purpose.ts", import.meta.url), "utf8"), {
  compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 },
}).outputText;
const { resolvePeoplePurpose, peoplePurposeHref } = await import("data:text/javascript;base64," + Buffer.from(js).toString("base64"));
test("assigned purpose survives directory, detail, section and request handoffs", () => {
  for (const path of ["/workspace/people/member", "/workspace/people/member/employment", "/workspace/requests/new?member=member"]) {
    const href = peoplePurposeHref(path, "people_operations");
    const query = new URL(href, "https://novya.invalid").searchParams;
    assert.equal(resolvePeoplePurpose(query.get("purpose")), "people_operations");
    if (path.includes("?member=")) assert.equal(query.get("member"), "member");
  }
});
test("scope links replace old purpose, preserve unrelated context and reject external routes", () => {
  const href = peoplePurposeHref("/workspace/recruiting/candidate?purpose=directory&tab=notes#details", "recruiting");
  const url = new URL(href, "https://novya.invalid");
  assert.deepEqual(url.searchParams.getAll("purpose"), ["recruiting"]);
  assert.equal(url.searchParams.get("tab"), "notes"); assert.equal(url.hash, "#details");
  assert.equal(resolvePeoplePurpose("arbitrary_grant", "recruiting"), "recruiting");
  assert.throws(() => peoplePurposeHref("https://other.example/people", "directory"));
  assert.throws(() => peoplePurposeHref("//other.example/people", "directory"));
});
