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

  function tr(value) {
    return window.I18n ? window.I18n.t(value) : value;
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
      values.forEach(value => {
        const cell = document.createElement("td");
        cell.textContent = value;
        trElement.appendChild(cell);
      });
      body.appendChild(trElement);
    });
    document.getElementById(summaryId).textContent = tr("採用 {selected} 行・除外 {excluded} 行")
      .replace("{selected}", extraction.selectedCount)
      .replace("{excluded}", extraction.excludedCount);
  }

  function runBasic() {
    const extraction = AcrosticCore.extract(document.getElementById("input-basic").value, {
      mode: "head",
      n: 1,
      normalization: document.getElementById("normalization-basic").value,
      ignoreLeadingWhitespace: document.getElementById("trim-basic").checked
    });
    document.getElementById("output-basic").value = extraction.result;
    renderTrace("trace-basic", "summary-basic", extraction);
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
    } catch {
      output.value = tr("エラー: n は1以上の整数を入力してください");
      document.getElementById("trace-adv").replaceChildren();
      document.getElementById("summary-adv").textContent = "";
    }
  }

  function updateModeOptions() {
    punctuationGroup.hidden = modeSelect.value !== "symbol";
  }

  document.getElementById("run-basic").addEventListener("click", runBasic);
  document.getElementById("run-adv").addEventListener("click", runAdvanced);
  modeSelect.addEventListener("change", updateModeOptions);
  updateModeOptions();

  window.addEventListener("languagechange", () => {
    document.querySelectorAll(".btn-action[data-state]").forEach(button => {
      if (button.dataset.state === "idle") button.textContent = tr("コピー");
    });
    if (document.getElementById("trace-basic").children.length) runBasic();
    if (document.getElementById("trace-adv").children.length) runAdvanced();
  });
});
