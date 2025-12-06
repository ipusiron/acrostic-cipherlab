# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Acrostic CipherLab is an educational tool for extracting acrostics and positional characters to reveal hidden messages. Part of the "生成AIで作るセキュリティツール200" (200 Security Tools Built with Generative AI) project - Day 103.

- **Type**: Single-page web application (HTML/CSS/JS)
- **Demo**: https://ipusiron.github.io/acrostic-cipherlab/
- **License**: MIT

## Development

This is a static web project with no build system. Open `index.html` directly in a browser for development.

```bash
# Preview locally (Windows)
start index.html
```

## Architecture

Follow the mobile-first web UI design approach defined in `.claude/skills/mobile-first-web-ui/SKILL.md`:

- **HTML**: Semantic HTML5 with `lang="ja"`, viewport meta tag required
- **CSS**: Mobile-first (base styles for ~360-414px), breakpoints at 600px (tablet) and 900px (PC)
- **JavaScript**: Vanilla JS only, no frameworks unless explicitly requested
- **File structure**: `index.html`, `style.css`, `script.js` as the standard pattern

## Key Constraints

- No external frameworks (React/Vue/Tailwind) unless user requests
- Design for variable content - use `gap` for spacing, avoid fixed dimensions
- Ensure 40px minimum tap targets for touch interaction
- Maintain sufficient color contrast for accessibility
