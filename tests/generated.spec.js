import { test, expect } from "@playwright/test";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { fileURLToPath } from "node:url";
import { dirname } from "node:path";

const run = promisify(execFile);
const ROOT = dirname(dirname(fileURLToPath(import.meta.url)));

/* The third seam, and the only one that isn't the page or a font file.
 *
 * Ten pages are generated from i18n.js and committed. The failure this guards
 * against is silent and cheap to cause: edit the words, forget to run the
 * script, and the site keeps serving the old ones while the file that claims
 * to be the source of truth says otherwise. Nothing rendered can reveal that
 * — every page still looks correct, just wrong.
 *
 * It asserts a product, not an implementation: "what is committed is what
 * i18n.js says it should be". */
test("the committed pages match i18n.js", async () => {
  await expect(
    run("node", ["scripts/build.js", "--check"], { cwd: ROOT })
  ).resolves.toBeTruthy();
});
