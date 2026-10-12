const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const root = path.resolve(__dirname, "..");
const html = fs.readFileSync(path.join(root, "index.html"), "utf8");
const script = fs.readFileSync(path.join(root, "script.js"), "utf8");

test("CSPとreferrer制御を設定し、無効なセキュリティmetaを書かない", () => {
  assert.match(html, /Content-Security-Policy/);
  assert.match(html, /name="referrer"/);
  assert.doesNotMatch(html, /http-equiv="X-Content-Type-Options"/i);
  assert.doesNotMatch(html, /<script[^>]+src="https?:/i);
});

test("利用者入力をHTMLとして挿入しない", () => {
  assert.doesNotMatch(script, /innerHTML|outerHTML|insertAdjacentHTML|eval\s*\(/);
  assert.match(script, /textContent = value/);
});

test("タブのARIA関連付けと言語切り替えを持つ", () => {
  assert.equal((html.match(/role="tab"/g) || []).length, 3);
  assert.equal((html.match(/role="tabpanel"/g) || []).length, 3);
  assert.match(html, /id="language-toggle"/);
  assert.ok(html.indexOf('src="i18n.js"') < html.indexOf('src="script.js"'));
});

test("Unicode比較ラボと入力上限を持つ", () => {
  for (const id of ["tab-lab", "input-lab", "lab-line", "lab-n", "segmentation-mode", "unicode-counts", "codepoint-tokens", "grapheme-tokens", "variant-results"]) {
    assert.match(html, new RegExp(`id="${id}"`));
  }
  assert.equal((html.match(/maxlength="100000"/g) || []).length, 3);
  assert.match(script, /AcrosticCore\.analyzeText/);
  assert.match(script, /AcrosticCore\.compareVariants/);
});

test("追跡表とUnicode処理のコントロールを持つ", () => {
  for (const id of ["trace-basic", "trace-adv", "normalization-basic", "normalization-adv", "punctuation", "trim-basic", "trim-adv"]) {
    assert.match(html, new RegExp(`id="${id}"`));
  }
});

test("必須ドキュメントとローカルスクリプトが存在する", () => {
  for (const file of ["README.md", "README.en.md", "acrostic-core.js", "i18n.js", "script.js"]) {
    assert.ok(fs.existsSync(path.join(root, file)), file);
  }
});
