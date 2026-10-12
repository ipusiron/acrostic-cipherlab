(function (root, factory) {
  const api = factory(root);
  if (typeof module === "object" && module.exports) module.exports = api;
  if (root) root.I18n = api;
})(typeof window !== "undefined" ? window : null, function (root) {
  "use strict";

  const translations = {
    "表示言語を英語に切り替える": "Switch the display language to English",
    "行ごとの文字位置をたどり、隠れたメッセージと抽出根拠を確認する学習ツール": "A learning tool for tracing character positions, hidden messages, and extraction evidence",
    "抽出方法": "Extraction methods",
    "アクロスティック": "Acrostic",
    "拡張アクロスティック": "Extended Acrostic",
    "入力テキスト": "Input Text",
    "複数行のテキストを入力してください": "Enter text on multiple lines",
    "Unicode正規化": "Unicode normalization",
    "正規化しない": "Do not normalize",
    "行頭の空白を無視する": "Ignore leading whitespace",
    "抽出する": "Extract",
    "抽出結果": "Extraction Result",
    "抽出された文字列がここに表示されます": "The extracted text appears here",
    "結果をコピー": "Copy result",
    "コピー": "Copy",
    "コピー完了": "Copied",
    "失敗": "Failed",
    "クリア": "Clear",
    "抽出の追跡表": "Extraction Trace",
    "基本抽出の追跡表": "Basic extraction trace",
    "拡張抽出の追跡表": "Extended extraction trace",
    "行": "Line",
    "処理": "Action",
    "位置": "Position",
    "文字": "Character",
    "理由": "Reason",
    "抽出モード": "Extraction mode",
    "行頭から n 文字目": "nth character from start",
    "行末から前に n 文字目": "nth character from end",
    "カンマ・ピリオド前の n 文字目": "nth character before punctuation",
    "対象の句読点": "Target punctuation",
    "n の値": "Value of n",
    "採用": "Selected",
    "除外": "Excluded",
    "空行": "Empty line",
    "空白だけの行": "Whitespace-only line",
    "対象の句読点なし": "Target punctuation not found",
    "指定位置まで文字がない": "Line is too short for the selected position",
    "採用 {selected} 行・除外 {excluded} 行": "{selected} selected / {excluded} excluded",
    "エラー: n は1以上の整数を入力してください": "Error: enter an integer of at least 1 for n",
    "🔗 GitHubリポジトリはこちら（": "🔗 GitHub repository (",
    "）": ")"
  };
  const originals = new WeakMap();
  const originalAttributes = new WeakMap();
  const attrs = ["aria-label", "placeholder", "title"];
  let language = "ja";

  function t(value) {
    return language === "en" && translations[value] ? translations[value] : value;
  }

  function translateDocument(next) {
    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
    let node;
    while ((node = walker.nextNode())) {
      if (!originals.has(node)) originals.set(node, node.nodeValue);
      const original = originals.get(node);
      const trimmed = original.trim();
      node.nodeValue = next === "en" && translations[trimmed]
        ? original.replace(trimmed, translations[trimmed])
        : original;
    }
    document.querySelectorAll("[aria-label], [placeholder], [title]").forEach(element => {
      if (!originalAttributes.has(element)) originalAttributes.set(element, {});
      const saved = originalAttributes.get(element);
      attrs.forEach(attr => {
        if (!element.hasAttribute(attr)) return;
        if (!saved[attr]) saved[attr] = element.getAttribute(attr);
        element.setAttribute(attr, next === "en" ? t(saved[attr]) : saved[attr]);
      });
    });
    const toggle = document.getElementById("language-toggle");
    toggle.textContent = next === "en" ? "日本語" : "English";
    toggle.setAttribute("aria-label", next === "en" ? "Switch the display language to Japanese" : "表示言語を英語に切り替える");
    document.documentElement.lang = next;
  }

  function setLanguage(next, persist = true) {
    language = next === "en" ? "en" : "ja";
    translateDocument(language);
    if (persist && root.localStorage) localStorage.setItem("acrostic-cipherlab-language", language);
    root.dispatchEvent(new CustomEvent("languagechange", { detail: { language } }));
  }

  function init() {
    setLanguage(localStorage.getItem("acrostic-cipherlab-language") === "en" ? "en" : "ja", false);
    document.getElementById("language-toggle").addEventListener("click", () => setLanguage(language === "ja" ? "en" : "ja"));
  }

  if (root && root.document) {
    if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
    else init();
  }
  return { t, setLanguage, getLanguage: () => language, translations };
});
