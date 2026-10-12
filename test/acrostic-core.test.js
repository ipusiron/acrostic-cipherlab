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
  for (const n of [0, -1, 1.5, 10001, NaN]) assert.throws(() => core.extract("ABC", { n }), RangeError);
});

test("UTF-16・コードポイント・書記素の文字数を区別する", () => {
  assert.ok(["grapheme", "code-point-fallback"].includes(core.segmentationMode));
  const emoji = core.analyzeLine("😀");
  assert.deepEqual([emoji.utf16Count, emoji.codePointCount, emoji.graphemeCount], [2, 1, 1]);
  const combining = core.analyzeLine("e\u0301");
  assert.deepEqual([combining.utf16Count, combining.codePointCount, combining.graphemeCount], [2, 2, 1]);
  assert.deepEqual(combining.codePoints.map(item => item.code), ["U+0065", "U+0301"]);
});

test("NFCとNFKCによる変化を行ごとに示す", () => {
  const [combining, fullwidth] = core.analyzeText("e\u0301\nＡ");
  assert.equal(combining.nfc, "é");
  assert.equal(combining.nfcChanged, true);
  assert.equal(fullwidth.nfcChanged, false);
  assert.equal(fullwidth.nfkc, "A");
  assert.equal(fullwidth.nfkcChanged, true);
});

test("正規化と行頭空白の4条件を同じ入力で比較する", () => {
  const variants = core.compareVariants("  Ａlpha\n e\u0301clair", 1);
  assert.deepEqual(variants.map(item => item.id), ["raw-keep", "raw-trim", "nfc-trim", "nfkc-trim"]);
  assert.deepEqual(variants.map(item => item.result), ["  ", "Ａe\u0301", "Ａé", "Aé"]);
});

test("入力サイズと行数に上限を設ける", () => {
  assert.throws(() => core.extract("x".repeat(core.limits.maxTextLength + 1)), error => error.code === "text-too-long");
  assert.throws(() => core.analyzeText("x\n".repeat(core.limits.maxLines)), error => error.code === "too-many-lines");
});

test("行頭と行末の複数位置を一括探索する", () => {
  const scan = core.scanPositions("CATXYZ\nOPQRST\nDEABCD\nEFGHIJ", {
    maxPosition: 2,
    minCoverage: 100,
    directions: ["head", "tail"]
  });
  assert.deepEqual(scan.candidates.map(item => [item.direction, item.position, item.result]), [
    ["head", 1, "CODE"],
    ["head", 2, "APEF"],
    ["tail", 1, "ZTDJ"],
    ["tail", 2, "YSCI"]
  ]);
  assert.equal(scan.eligibleCount, 4);
  assert.equal(scan.ignoredCount, 0);
});

test("カバー率で短い行を含む候補を絞り込む", () => {
  const scan = core.scanPositions("ABC\nDE\nF", { maxPosition: 3, minCoverage: 50 });
  assert.deepEqual(scan.candidates.map(item => [item.direction, item.position, item.result, item.coverage]), [
    ["head", 1, "ADF", 100],
    ["head", 2, "BE", 66.7],
    ["tail", 1, "CEF", 100],
    ["tail", 2, "BD", 66.7]
  ]);
});

test("探索でも書記素・正規化・空白設定を維持する", () => {
  const scan = core.scanPositions("  😀A\n\n ＡB", {
    maxPosition: 1,
    minCoverage: 100,
    directions: ["head"],
    normalization: "NFKC",
    ignoreLeadingWhitespace: true
  });
  assert.equal(scan.candidates[0].result, "😀A");
  assert.equal(scan.eligibleCount, 2);
  assert.equal(scan.ignoredCount, 1);
});

test("探索上限・カバー率・方向を検証する", () => {
  assert.throws(() => core.scanPositions("ABC", { maxPosition: 101 }), error => error.code === "invalid-scan-position");
  assert.throws(() => core.scanPositions("ABC", { minCoverage: 101 }), error => error.code === "invalid-coverage");
  assert.throws(() => core.scanPositions("ABC", { directions: [] }), error => error.code === "invalid-directions");
});
