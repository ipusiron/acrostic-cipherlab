(function (root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  if (root) root.AcrosticCore = api;
})(typeof window !== "undefined" ? window : null, function () {
  "use strict";

  const segmenter = typeof Intl !== "undefined" && Intl.Segmenter
    ? new Intl.Segmenter(undefined, { granularity: "grapheme" })
    : null;

  function splitGraphemes(value) {
    const text = String(value ?? "");
    return segmenter ? Array.from(segmenter.segment(text), part => part.segment) : Array.from(text);
  }

  function normalizeLine(line, normalization, ignoreLeadingWhitespace) {
    let value = String(line ?? "");
    if (normalization === "NFC" || normalization === "NFKC") value = value.normalize(normalization);
    if (ignoreLeadingWhitespace) value = value.replace(/^\s+/u, "");
    return value;
  }

  function punctuationSet(kind) {
    if (kind === "western") return new Set([",", "."]);
    if (kind === "japanese") return new Set(["、", "。"]) ;
    return new Set([",", ".", "、", "。"]) ;
  }

  function extract(text, options = {}) {
    const mode = options.mode || "head";
    const n = Number(options.n ?? 1);
    if (!Number.isInteger(n) || n < 1) throw new RangeError("n must be an integer of at least 1");
    const lines = String(text ?? "").split(/\r?\n/);
    const symbols = punctuationSet(options.punctuation || "both");
    const trace = [];
    let result = "";

    lines.forEach((source, index) => {
      const line = normalizeLine(source, options.normalization || "none", Boolean(options.ignoreLeadingWhitespace));
      const graphemes = splitGraphemes(line);
      let targetIndex = -1;
      let reason = "selected";

      if (graphemes.length === 0) reason = source.length === 0 ? "empty-line" : "whitespace-only";
      else if (mode === "head") targetIndex = n - 1;
      else if (mode === "tail") targetIndex = graphemes.length - n;
      else if (mode === "symbol") {
        const symbolIndex = graphemes.findIndex(char => symbols.has(char));
        if (symbolIndex < 0) reason = "symbol-not-found";
        else targetIndex = symbolIndex - n;
      } else throw new RangeError("unknown extraction mode");

      if (reason === "selected" && (targetIndex < 0 || targetIndex >= graphemes.length)) reason = "too-short";
      const selected = reason === "selected" ? graphemes[targetIndex] : "";
      if (selected) result += selected;
      trace.push({ lineNumber: index + 1, source, normalized: line, status: selected ? "selected" : "excluded", position: selected ? targetIndex + 1 : null, selected, reason });
    });

    return { result, trace, selectedCount: trace.filter(row => row.status === "selected").length, excludedCount: trace.filter(row => row.status === "excluded").length };
  }

  return { splitGraphemes, normalizeLine, punctuationSet, extract };
});
