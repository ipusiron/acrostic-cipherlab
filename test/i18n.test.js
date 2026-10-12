const test = require("node:test");
const assert = require("node:assert/strict");
const i18n = require("../i18n.js");

test("主要UIと除外理由に英訳がある", () => {
  for (const key of ["アクロスティック", "拡張アクロスティック", "抽出の追跡表", "空白だけの行", "対象の句読点なし", "指定位置まで文字がない", "Unicode比較ラボ", "コードポイント", "書記素クラスタ", "正規化・空白処理による抽出差", "このブラウザーでは書記素クラスタで分割します", "位置探索", "最低カバー率（%）", "追跡表で確認", "候補 {count}件・対象 {eligible}行・対象外 {ignored}行", "エラー: 探索方向を1つ以上選んでください"]) {
    assert.ok(i18n.translations[key], key);
  }
});
