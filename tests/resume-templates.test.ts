import assert from "node:assert/strict";
import test from "node:test";
import {
  DEFAULT_RESUME_TEMPLATE,
  isResumeTemplateId,
  RESUME_TEMPLATES,
  RESUME_SECTION_TITLES,
} from "../lib/resume-templates.ts";

test("defines a unique, usable template catalogue", () => {
  const ids = RESUME_TEMPLATES.map((template) => template.id);
  assert.equal(new Set(ids).size, ids.length);
  assert.ok(ids.includes(DEFAULT_RESUME_TEMPLATE));
  for (const template of RESUME_TEMPLATES) {
    assert.ok(template.name);
    assert.ok(template.description);
    assert.ok(template.bestFor);
    assert.equal(template.atsSafe, true);
  }
});

test("validates template ids at the boundary", () => {
  assert.equal(isResumeTemplateId("classic"), true);
  assert.equal(isResumeTemplateId("modern"), true);
  assert.equal(isResumeTemplateId("minimal"), true);
  assert.equal(isResumeTemplateId("editorial"), true);
  assert.equal(isResumeTemplateId("statement"), true);
  assert.equal(isResumeTemplateId("unknown"), false);
});

test("keeps the shared resume section headings stable", () => {
  assert.deepEqual(RESUME_SECTION_TITLES, {
    summary: "Professional Summary",
    experience: "Professional Experience",
    projects: "Projects",
    education: "Education",
    skills: "Skills",
  });
});
