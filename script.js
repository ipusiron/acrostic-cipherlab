document.addEventListener("DOMContentLoaded", () => {
  "use strict";

  const tabs = Array.from(document.querySelectorAll(".tab"));
  const tabContents = Array.from(document.querySelectorAll(".tab-content"));
  const modeSelect = document.getElementById("mode");
  const punctuationGroup = document.getElementById("punctuation-group");
  const reasonLabels = {
    selected: "採用",
    "empty-line": "空行",
    "whitespace-only": "空白だけの行",
    "symbol-not-found": "対象の句読点なし",
    "too-short": "指定位置まで文字がない"
  };
  const variantLabels = {
    "raw-keep": "正規化なし・空白を保持",
    "raw-trim": "正規化なし・行頭空白を無視",
    "nfc-trim": "NFC・行頭空白を無視",
    "nfkc-trim": "NFKC・行頭空白を無視"
  };
  const labSamples = {
    emoji: "😀 alpha\n👨‍👩‍👧‍👦 family\n🧪 beta",
    combining: "e\u0301clair\nécole\nか\u3099く",
    whitespace: "  SPACE\n\tTAB\nNO SPACE",
    compatibility: "Ａ fullwidth\nA ASCII\n① circled"
  };
  let labHasRun = false;

  function tr(value) {
    return window.I18n ? window.I18n.t(value) : value;
  }

  function errorMessage(error) {
    if (error && error.code === "text-too-long") return tr("エラー: 入力は100,000 UTF-16コード単位以内にしてください");
    if (error && error.code === "too-many-lines") return tr("エラー: 入力は2,000行以内にしてください");
    return tr("エラー: 位置は1から10,000までの整数を入力してください");
  }

  function appendCell(row, value) {
    const cell = document.createElement("td");
    cell.textContent = value;
    row.appendChild(cell);
  }

  function renderSegmentationMode() {
    document.getElementById("segmentation-mode").textContent = AcrosticCore.segmentationMode === "grapheme"
      ? tr("このブラウザーでは書記素クラスタで分割します")
      : tr("このブラウザーではコードポイント単位へフォールバックします");
  }

  function activateTab(tab, focus) {
    const targetId = `tab-${tab.dataset.tab}`;
    tabs.forEach(item => {
      const selected = item === tab;
      item.classList.toggle("active", selected);
      item.setAttribute("aria-selected", String(selected));
      item.tabIndex = selected ? 0 : -1;
    });
    tabContents.forEach(content => {
      const selected = content.id === targetId;
      content.classList.toggle("active", selected);
      content.hidden = !selected;
    });
    if (focus) tab.focus();
    tab.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "nearest" });
  }

  tabs.forEach((tab, index) => {
    tab.addEventListener("click", () => activateTab(tab, false));
    tab.addEventListener("keydown", event => {
      let nextIndex = null;
      if (event.key === "ArrowRight") nextIndex = (index + 1) % tabs.length;
      if (event.key === "ArrowLeft") nextIndex = (index - 1 + tabs.length) % tabs.length;
      if (event.key === "Home") nextIndex = 0;
      if (event.key === "End") nextIndex = tabs.length - 1;
      if (nextIndex !== null) {
        event.preventDefault();
        activateTab(tabs[nextIndex], true);
      }
    });
  });
  activateTab(tabs.find(tab => tab.classList.contains("active")) || tabs[0], false);

  function copyToClipboard(textareaId, buttonId) {
    const textarea = document.getElementById(textareaId);
    const button = document.getElementById(buttonId);
    button.addEventListener("click", async () => {
      if (!textarea.value) return;
      try {
        await navigator.clipboard.writeText(textarea.value);
        button.dataset.state = "copied";
        button.classList.add("copied");
        button.textContent = tr("コピー完了");
      } catch {
        button.dataset.state = "failed";
        button.textContent = tr("失敗");
      }
      setTimeout(() => {
        button.dataset.state = "idle";
        button.textContent = tr("コピー");
        button.classList.remove("copied");
      }, 1500);
    });
  }

  function clearResult(prefix) {
    document.getElementById(`input-${prefix}`).value = "";
    document.getElementById(`output-${prefix === "adv" ? "adv" : "basic"}`).value = "";
    document.getElementById(`trace-${prefix}`).replaceChildren();
    document.getElementById(`summary-${prefix}`).textContent = "";
    document.getElementById(`input-${prefix}`).focus();
  }

  document.getElementById("clear-basic").addEventListener("click", () => clearResult("basic"));
  document.getElementById("clear-adv").addEventListener("click", () => clearResult("adv"));
  copyToClipboard("output-basic", "copy-basic");
  copyToClipboard("output-adv", "copy-adv");

  function renderTrace(targetId, summaryId, extraction) {
    const body = document.getElementById(targetId);
    body.replaceChildren();
    extraction.trace.forEach(row => {
      const trElement = document.createElement("tr");
      trElement.className = row.status;
      const values = [
        String(row.lineNumber),
        row.status === "selected" ? tr("採用") : tr("除外"),
        row.position === null ? "—" : String(row.position),
        row.selected || "—",
        tr(reasonLabels[row.reason] || row.reason)
      ];
      values.forEach(value => appendCell(trElement, value));
      body.appendChild(trElement);
    });
    document.getElementById(summaryId).textContent = tr("採用 {selected} 行・除外 {excluded} 行")
      .replace("{selected}", extraction.selectedCount)
      .replace("{excluded}", extraction.excludedCount);
  }

  function runBasic() {
    const output = document.getElementById("output-basic");
    try {
      const extraction = AcrosticCore.extract(document.getElementById("input-basic").value, {
        mode: "head",
        n: 1,
        normalization: document.getElementById("normalization-basic").value,
        ignoreLeadingWhitespace: document.getElementById("trim-basic").checked
      });
      output.value = extraction.result;
      renderTrace("trace-basic", "summary-basic", extraction);
    } catch (error) {
      output.value = errorMessage(error);
      document.getElementById("trace-basic").replaceChildren();
      document.getElementById("summary-basic").textContent = "";
    }
  }

  function runAdvanced() {
    const output = document.getElementById("output-adv");
    try {
      const extraction = AcrosticCore.extract(document.getElementById("input-adv").value, {
        mode: modeSelect.value,
        n: Number(document.getElementById("n").value),
        normalization: document.getElementById("normalization-adv").value,
        ignoreLeadingWhitespace: document.getElementById("trim-adv").checked,
        punctuation: document.getElementById("punctuation").value
      });
      output.value = extraction.result;
      renderTrace("trace-adv", "summary-adv", extraction);
    } catch (error) {
      output.value = errorMessage(error);
      document.getElementById("trace-adv").replaceChildren();
      document.getElementById("summary-adv").textContent = "";
    }
  }

  function visibleToken(value) {
    if (value === " ") return "␠";
    if (value === "\t") return "⇥";
    if (value === "") return "∅";
    return /^\p{Mark}/u.test(value) ? `◌${value}` : value;
  }

  function visibleString(value) {
    return AcrosticCore.splitGraphemes(value).map(visibleToken).join("");
  }

  function renderTokens(targetId, tokens, codeProperty) {
    const target = document.getElementById(targetId);
    target.replaceChildren();
    tokens.forEach(token => {
      const item = document.createElement("span");
      item.className = "unicode-token";
      const character = document.createElement("strong");
      character.textContent = visibleToken(token.char);
      const codes = document.createElement("small");
      codes.textContent = Array.isArray(token[codeProperty]) ? token[codeProperty].join(" ") : token[codeProperty];
      item.append(character, codes);
      target.appendChild(item);
    });
    if (!tokens.length) target.textContent = tr("空の行です");
  }

  function clearLabOutput() {
    document.getElementById("unicode-counts").replaceChildren();
    document.getElementById("codepoint-tokens").replaceChildren();
    document.getElementById("grapheme-tokens").replaceChildren();
    document.getElementById("variant-results").replaceChildren();
    document.getElementById("summary-lab").textContent = "";
  }

  function runLab() {
    const input = document.getElementById("input-lab").value;
    const summary = document.getElementById("summary-lab");
    try {
      const rows = AcrosticCore.analyzeText(input);
      const requestedLine = Number(document.getElementById("lab-line").value);
      if (!Number.isInteger(requestedLine) || requestedLine < 1 || requestedLine > rows.length) {
        const error = new RangeError("invalid line");
        error.code = "invalid-line";
        throw error;
      }
      const counts = document.getElementById("unicode-counts");
      counts.replaceChildren();
      rows.forEach(line => {
        const row = document.createElement("tr");
        [
          String(line.lineNumber),
          line.source ? visibleString(line.source) : tr("空行"),
          String(line.utf16Count),
          String(line.codePointCount),
          String(line.graphemeCount),
          tr(line.nfcChanged ? "あり" : "なし"),
          tr(line.nfkcChanged ? "あり" : "なし")
        ].forEach(value => appendCell(row, value));
        counts.appendChild(row);
      });
      const selected = rows[requestedLine - 1];
      renderTokens("codepoint-tokens", selected.codePoints, "code");
      renderTokens("grapheme-tokens", selected.graphemes, "codes");

      const variants = AcrosticCore.compareVariants(input, Number(document.getElementById("lab-n").value));
      const variantBody = document.getElementById("variant-results");
      variantBody.replaceChildren();
      variants.forEach(variant => {
        const row = document.createElement("tr");
        [tr(variantLabels[variant.id]), variant.result ? visibleString(variant.result) : "—", String(variant.selectedCount), String(variant.excludedCount)]
          .forEach(value => appendCell(row, value));
        variantBody.appendChild(row);
      });
      summary.textContent = tr("{lines}行を比較・選択行は{line}行目")
        .replace("{lines}", rows.length)
        .replace("{line}", requestedLine);
      labHasRun = true;
    } catch (error) {
      clearLabOutput();
      summary.textContent = error && error.code === "invalid-line"
        ? tr("エラー: 分割表示する行は入力範囲内で指定してください")
        : errorMessage(error);
      labHasRun = true;
    }
  }

  function updateModeOptions() {
    punctuationGroup.hidden = modeSelect.value !== "symbol";
  }

  document.getElementById("run-basic").addEventListener("click", runBasic);
  document.getElementById("run-adv").addEventListener("click", runAdvanced);
  document.getElementById("run-lab").addEventListener("click", runLab);
  document.getElementById("clear-lab").addEventListener("click", () => {
    document.getElementById("input-lab").value = "";
    document.getElementById("lab-line").value = "1";
    document.getElementById("lab-n").value = "1";
    clearLabOutput();
    labHasRun = false;
    document.getElementById("input-lab").focus();
  });
  document.querySelectorAll(".lab-sample").forEach(button => {
    button.addEventListener("click", () => {
      document.getElementById("input-lab").value = labSamples[button.dataset.sample];
      document.getElementById("lab-line").value = "1";
      runLab();
    });
  });
  document.getElementById("input-lab").addEventListener("input", () => { if (labHasRun) runLab(); });
  document.getElementById("lab-line").addEventListener("input", () => { if (labHasRun) runLab(); });
  document.getElementById("lab-n").addEventListener("input", () => { if (labHasRun) runLab(); });
  modeSelect.addEventListener("change", updateModeOptions);
  updateModeOptions();
  renderSegmentationMode();

  window.addEventListener("languagechange", () => {
    document.querySelectorAll(".btn-action[data-state]").forEach(button => {
      if (button.dataset.state === "idle") button.textContent = tr("コピー");
    });
    if (document.getElementById("trace-basic").children.length) runBasic();
    if (document.getElementById("trace-adv").children.length) runAdvanced();
    if (labHasRun) runLab();
    renderSegmentationMode();
  });
});
