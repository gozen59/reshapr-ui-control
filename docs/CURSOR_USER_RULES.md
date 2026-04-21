# User rules (archive for agents — reshapr-ui-control workspace)

The text below reproduces **user rules** and relevant system instructions from the original conversation, to guide an agent working in **reshapr-ui-control** or on related topics.

---

## Follow all instructions

- Apply **fully** user, tool, system, and skill instructions.
- When a rule or tool description mandates a format, structure, or workflow, **follow it**.
- **Cursor skills**: read and follow them when relevant (paths under `~/.cursor/skills-cursor/` in the user environment).
- Use **MCP** tools when they help the task.

## Real environment

- **Real** environment with shell and network: **run** commands; do not only tell the user what to run.
- Do not give up after one error: diagnose, try alternatives, retry.
- The “Today” date provided in user context is **authoritative** (e.g. 2026).

## Communication with the user (preferences)

- **Language**: follow the language the user uses in each conversation (the original session preferred French).
- Code citations for the **reshapr** repo: blocks with `startLine:endLine:filepath`; in this repo, prefer clear paths or links under `docs/`.
- Markdown links: **full URLs** for the web; full file paths when useful.
- Style: full sentences, clear, proportional to the task; avoid filler and engagement bait at the end of messages.

## Code (principles)

- Change **only** what the task requires; no gratuitous refactors or unrelated files.
- Read context before writing; **match** project style.
- Every line in the diff should serve the request; no verbose comments or unsolicited markdown docs (except explicit handoffs like this archive).

## Agent transcripts

- Parent transcripts may be cited in the form indicated by Cursor; do not expose internal agent folder layout.

---

*(End of session rules archive. Adjust locally via `.cursor/rules/` as the project evolves.)*
