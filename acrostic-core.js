(function (root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  if (root) root.AcrosticCore = api;
})(typeof window !== "undefined" ? window : null, function () {
  "use strict";

  const segmenter = typeof Intl !== "undefined" && Intl.Segmenter
    ? new Intl.Segmenter(undefined, { granularity: "grapheme" })
    : null;
  const limits = Object.freeze({ maxTextLength: 100000, maxLines: 2000, maxPosition: 10000 });

  function rangeError(code, message) {
    const error = new RangeError(message);
    error.code = code;
    return error;
  }

  function validateText(value) {
    const text = String(value ?? "");
    if (text.length > limits.maxTextLength) throw rangeError("text-too-long", "text is too long");
    const lines = text.split(/\r?\n/);
    if (lines.length > limits.maxLines) throw rangeError("too-many-lines", "text has too many lines");
    return { text, lines };
  }

  function validatePosition(value) {
    const n = Number(value ?? 1);
    if (!Number.isInteger(n) || n < 1 || n > limits.maxPosition) {
      throw rangeError("invalid-position", `n must be an integer from 1 to ${limits.maxPosition}`);
    }
    return n;
  }

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

  function codePointHex(char) {
    return `U+${char.codePointAt(0).toString(16).toUpperCase().padStart(4, "0")}`;
  }

  function analyzeLine(source) {
    const text = String(source ?? "");
    const codePoints = Array.from(text, char => ({ char, code: codePointHex(char) }));
    const graphemes = splitGraphemes(text).map(char => ({
      char,
      codes: Array.from(char, codePointHex)
    }));
    const nfc = text.normalize("NFC");
    const nfkc = text.normalize("NFKC");
    return {
      source: text,
      utf16Count: text.length,
      codePointCount: codePoints.length,
      graphemeCount: graphemes.length,
      codePoints,
      graphemes,
      nfc,
      nfkc,
      nfcChanged: nfc !== text,
      nfkcChanged: nfkc !== text
    };
  }

  function analyzeText(text) {
    const validated = validateText(text);
    return validated.lines.map((line, index) => ({ lineNumber: index + 1, ...analyzeLine(line) }));
  }

  function extract(text, options = {}) {
    const mode = options.mode || "head";
    const n = validatePosition(options.n);
    const lines = validateText(text).lines;
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

  function compareVariants(text, n = 1) {
    const position = validatePosition(n);
    return [
      { id: "raw-keep", normalization: "none", ignoreLeadingWhitespace: false },
      { id: "raw-trim", normalization: "none", ignoreLeadingWhitespace: true },
      { id: "nfc-trim", normalization: "NFC", ignoreLeadingWhitespace: true },
      { id: "nfkc-trim", normalization: "NFKC", ignoreLeadingWhitespace: true }
    ].map(variant => ({
      ...variant,
      ...extract(text, { mode: "head", n: position, ...variant })
    }));
  }

  return {
    limits,
    segmentationMode: segmenter ? "grapheme" : "code-point-fallback",
    splitGraphemes,
    normalizeLine,
    punctuationSet,
    analyzeLine,
    analyzeText,
    extract,
    compareVariants
  };
});
