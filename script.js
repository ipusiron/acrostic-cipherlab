document.addEventListener('DOMContentLoaded', () => {
  // タブ切り替え処理
  const tabs = document.querySelectorAll('.tab');
  const tabContents = document.querySelectorAll('.tab-content');

  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      const targetTab = tab.dataset.tab;

      tabs.forEach(t => t.classList.remove('active'));
      tabContents.forEach(c => c.classList.remove('active'));

      tab.classList.add('active');
      document.getElementById(`tab-${targetTab}`).classList.add('active');
    });
  });

  // 基本タブ：行頭文字抽出
  const runBasic = document.getElementById('run-basic');
  const inputBasic = document.getElementById('input-basic');
  const outputBasic = document.getElementById('output-basic');

  runBasic.addEventListener('click', () => {
    const lines = inputBasic.value.split(/\r?\n/);
    let result = '';

    for (const line of lines) {
      if (line.length > 0) {
        result += line[0];
      }
    }

    outputBasic.value = result;
  });

  // 拡張タブ：モード別文字抽出
  const runAdv = document.getElementById('run-adv');
  const inputAdv = document.getElementById('input-adv');
  const outputAdv = document.getElementById('output-adv');
  const modeSelect = document.getElementById('mode');
  const nInput = document.getElementById('n');

  runAdv.addEventListener('click', () => {
    const lines = inputAdv.value.split(/\r?\n/);
    const mode = modeSelect.value;
    const n = parseInt(nInput.value, 10);

    if (isNaN(n) || n < 1) {
      outputAdv.value = 'エラー: n は1以上の整数を入力してください';
      return;
    }

    let result = '';

    for (const line of lines) {
      if (line.length === 0) continue;

      if (mode === 'head') {
        // 行頭から n 文字目
        if (line.length >= n) {
          result += line[n - 1];
        }
      } else if (mode === 'tail') {
        // 行末から前に n 文字目
        if (line.length >= n) {
          result += line[line.length - n];
        }
      } else if (mode === 'symbol') {
        // カンマ・ピリオド前の n 文字目
        const pos = line.search(/[,.]/);
        if (pos >= 0 && pos - n >= 0) {
          result += line[pos - n];
        }
      }
    }

    outputAdv.value = result;
  });
});
