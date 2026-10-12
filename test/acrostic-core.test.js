const test = require("node:test");
const assert = require("node:assert/strict");
const core = require("../acrostic-core.js");

test("絵文字と結合文字を表示上の一文字として分割する", () => {
  assert.deepEqual(core.splitGraphemes("👨‍👩‍👧‍👦e\u0301A"), ["👨‍👩‍👧‍👦", "e\u0301", "A"]);
});

test("基本抽出で絵文字を分断しない", () => {
  const value = core.extract("😀 alpha\n🧪 beta", { mode: "head", n: 1 });
  assert.equal(value.result, "😀🧪");
  assert.equal(value.selectedCount, 2);
});

test("行頭空白を無視する設定を切り替えられる", () => {
  assert.equal(core.extract("  A\n\tB", { mode: "head", n: 1, ignoreLeadingWhitespace: true }).result, "AB");
  assert.equal(core.extract("  A\n\tB", { mode: "head", n: 1, ignoreLeadingWhitespace: false }).result, " \t");
});

test("空行・空白行・短い行の除外理由を区別する", () => {
  const value = core.extract("\n   \nA", { mode: "head", n: 2, ignoreLeadingWhitespace: true });
  assert.deepEqual(value.trace.map(row => row.reason), ["empty-line", "whitespace-only", "too-short"]);
  assert.equal(value.excludedCount, 3);
});

test("行末からの位置を書記素単位で数える", () => {
  assert.equal(core.extract("A😀\nB🧪", { mode: "tail", n: 1 }).result, "😀🧪");
  assert.equal(core.extract("A😀\nB🧪", { mode: "tail", n: 2 }).result, "AB");
});

test("欧文と日本語の句読点セットを選べる", () => {
  const text = "AB,tail\nCD。末尾\nEF.foot\nGH、読点";
  assert.equal(core.extract(text, { mode: "symbol", n: 1, punctuation: "western" }).result, "BF");
  assert.equal(core.extract(text, { mode: "symbol", n: 1, punctuation: "japanese" }).result, "DH");
  assert.equal(core.extract(text, { mode: "symbol", n: 1, punctuation: "both" }).result, "BDFH");
});

test("対象句読点なしと句読点前の文字不足を区別する", () => {
  const value = core.extract("ABC\n。先頭", { mode: "symbol", n: 1, punctuation: "japanese" });
  assert.deepEqual(value.trace.map(row => row.reason), ["symbol-not-found", "too-short"]);
});

test("NFCとNFKCを選択的に適用する", () => {
  assert.equal(core.extract("e\u0301x", { mode: "head", n: 1, normalization: "NFC" }).result, "é");
  assert.equal(core.extract("Ａx", { mode: "head", n: 1, normalization: "NFKC" }).result, "A");
  assert.equal(core.extract("Ａx", { mode: "head", n: 1, normalization: "none" }).result, "Ａ");
});

test("CRLFを余分な文字として扱わない", () => {
  assert.equal(core.extract("A\r\nB", { mode: "tail", n: 1 }).result, "AB");
});

test("nが正の整数でなければ拒否する", () => {
  for (const n of [0, -1, 1.5, NaN]) assert.throws(() => core.extract("ABC", { n }), RangeError);
});
