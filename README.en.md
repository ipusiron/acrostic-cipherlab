# Acrostic CipherLab - Acrostic and Positional Extraction Tool

[日本語](README.md) | English

[![GitHub Pages](https://img.shields.io/badge/demo-GitHub%20Pages-blue?logo=github)](https://ipusiron.github.io/acrostic-cipherlab/)

**Day103 - Security Tools Built with Generative AI 200**

Acrostic CipherLab extracts characters at specified positions across multiple lines. It shows not only the resulting message but also the source line, selected position, character, and reason for every excluded line.

## 🌐 Demo

Try it at [https://ipusiron.github.io/acrostic-cipherlab/](https://ipusiron.github.io/acrostic-cipherlab/).

## 📸 Screenshot

![Acrostic extraction and trace](assets/en/screenshot.png)

## 🔬 What is an acrostic?

An acrostic hides a word or message at repeated positions, commonly the first character of each line. From a security perspective, it can be examined as a steganographic technique. It is not encryption and does not provide confidentiality by itself.

For example, selecting the first character from four lines beginning with `C`, `O`, `D`, and `E` produces `CODE`.

## ✨ Features

- Extract the first grapheme from every nonempty line.
- Extract the nth grapheme from the start or end.
- Extract the nth grapheme before Western punctuation `, .`, Japanese punctuation `、。`, or both.
- Treat emoji and combining sequences as user-perceived characters when `Intl.Segmenter` is available.
- Optionally ignore leading whitespace.
- Select no normalization, NFC, or NFKC.
- Inspect a trace table containing line number, action, position, selected character, and exclusion reason.
- Distinguish empty lines, whitespace-only lines, short lines, and lines without target punctuation.
- Switch the complete interface between Japanese and English while preserving inputs and results.
- Use the two tabs with pointer, keyboard arrows, Home, and End.

## 📖 How to use

1. Select **Acrostic** or **Extended Acrostic**.
2. Paste or enter multiple lines.
3. Choose whitespace and normalization behavior.
4. In the extended tab, select a mode, value of n, and punctuation set when applicable.
5. Press **Extract**.
6. Compare the result with the extraction trace.

## 🎯 Practical experiments

- Enter `😀 alpha` and `🧪 beta`; first-character extraction returns `😀🧪` without splitting surrogate or joiner sequences.
- Enter `AB,tail` and `CD。末尾`, choose both punctuation sets and n=1; the result is `BD`.
- Mix an empty line, a whitespace-only line, and a one-character line with n=2; the trace reports each distinct exclusion reason.
- Compare NFC and no normalization with a decomposed sequence such as `e` plus a combining acute accent.
- Read a rectangular word-search column by selecting the same nth position from every row.
- Audit CTF or puzzle text while retaining the original line numbers used to form a candidate message.

## ⚠️ Scope and limitations

- The tool applies a user-selected positional rule. It does not prove that a hidden message was intentional.
- With `Intl.Segmenter`, positions are counted as grapheme clusters. The fallback counts Unicode code points, which can differ for complex sequences.
- NFKC can change source text, including full-width characters. For evidence preservation or exact source comparison, select no normalization and retain the original separately.
- Extracted text is not proof of successful cryptanalysis and does not provide confidentiality.

## 🔒 Privacy and security

Processing is entirely client-side. Input text is not uploaded or stored. Output is rendered with DOM APIs and `textContent`, not interpreted as HTML. The page uses a restrictive CSP and has no runtime dependencies.

## ✅ Tests

No package installation is required.

```bash
npm test
```

The suite covers emoji, combining characters, NFC/NFKC, CRLF, leading whitespace, Japanese and Western punctuation, excluded-line reasons, document security, ARIA, and primary translations.

## 📁 Project structure

```text
acrostic-cipherlab/
├── index.html
├── style.css
├── script.js
├── acrostic-core.js
├── i18n.js
├── README.md
├── README.en.md
├── package.json
├── test/
└── assets/
```

## 📄 License

Released under the [MIT License](LICENSE).

This tool is part of the [Security Tools Built with Generative AI 200](https://akademeia.info/?page_id=44607) project.
