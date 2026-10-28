# Claude Code - Token Consumption Optimization

Project-independent guide: how Claude Code spends tokens and how to reduce the bill.
Copy this file into any repository (`docs/token_optimization.md`).

Based on the internal post *"Claude Code - Cost Optimization Guide"* (Bjoern Oltmanns,
Agentic Engineering, 2026-07-31) plus the official Claude Code docs listed in
[References](#13-references).

---

## 0. TL;DR

| Habit | How | Effect |
|---|---|---|
| Sonnet as default, Opus only when needed | `claude --model sonnet` / `opusplan` | ~40% cheaper than Opus |
| Resume instead of restarting | `claude --resume` or `/resume` | Avoids $3-6 full cache rewrite |
| Plan before implementing | `Shift+Tab` or `/plan` | 25-40% less rework |
| `/compact` before breaks, not `/clear` | `/compact` | Keeps cache prefix |
| Never edit CLAUDE.md mid-session | edit between sessions | Avoids full cache invalidation |
| Specific prompts | "add validation to login.ts" | 20-40% fewer file reads |
| Compress chat output | Caveman skill | ~65% fewer output tokens |
| Watch spend live | claude-monitor | Awareness drives behavior |

---

## 1. How billing works (AWS Bedrock, pay-per-token)

- Claude models are consumed through a sandboxed **AWS Bedrock** deployment, not
  through Anthropic subscriptions or the Anthropic API.
- Pure pay-per-token: no plan, no included usage, no free tier. Costs land in the AWS account.
- Anthropic plans (Pro, Max, Team, Enterprise) and their features (usage caps,
  5-hour rolling windows) **do not apply**.
- Everything is billed: every message, every file read, every response, every thinking token.

Benchmarks:

| Metric | Value |
|---|---|
| Enterprise average (Anthropic) | ~$13 / developer / active day, $150-250 / month |
| Users below $30/day | 90% |
| Internal pilot (89 users) - median | $137 / month |
| Internal pilot - mean | $405 / month |
| Top 10 users | 57% of total cost, ~$2,063 / month each |
| Full-time developers | 83% of total cost |

### Token prices on Bedrock (USD per million tokens)

Global endpoints cost the same as the Anthropic API. Regional endpoints (data stays in one
AWS region) add **+10%**.

| Model | Input | Output | Cache read | Cache write 5 min | Cache write 1 h |
|---|---|---|---|---|---|
| Opus 4.6 | $5 | $25 | $0.50 | $6.25 | $10 |
| Sonnet 4.6 | $3 | $15 | $0.30 | $3.75 | $6 |
| Haiku 4.5 | $1 | $5 | $0.10 | $1.25 | $2 |

Cache write = 1.25x input (5 min TTL) or 2x input (1 h TTL). Cache read = 0.1x input.

---

## 2. Model selection - the biggest lever

| Model | Cost | Use for |
|---|---|---|
| Opus | High | Architecture, multi-step reasoning, ambiguous requirements |
| Sonnet | Medium | General coding, refactoring, bug fixes, review (~80% of daily work) |
| Haiku | Low | Simple subagent tasks, lookups, formatting, boilerplate |

```bash
claude --model sonnet          # at startup
/model sonnet                  # mid-session (breaks cache, see section 5)
claude --model opusplan        # Opus in plan mode, Sonnet for execution
export ANTHROPIC_MODEL=sonnet  # env var
```

Persistent default in `settings.json`: `{ "model": "sonnet" }`

Example: 30-minute session, 100K input + 20K output tokens.

| Model | Input | Output | Total | 20 days | 100 devs / month |
|---|---|---|---|---|---|
| Opus 4.6 | $0.50 | $0.50 | $1.00 | $20 | $2,000 |
| Sonnet 4.6 | $0.30 | $0.30 | $0.60 | $12 | $1,200 |
| Haiku 4.5 | $0.10 | $0.10 | $0.20 | $4 | $400 |

Quick guide:

| Task | Model + effort |
|---|---|
| Formatting, renaming | haiku + low |
| Standard coding | sonnet + high |
| Complex architecture / unclear scope | opusplan |
| Hardest problems only | opus + xhigh |

---

## 3. Context management - the hidden cost driver

The whole context window is re-sent with every message. A bloated context is paid for again and again.

| Command | Purpose |
|---|---|
| `/cost` | Session token usage and estimated cost (API / Bedrock users) |
| `/stats` | Usage statistics (subscription users) |
| `/context` | What is consuming the context window |
| `/compact` | Summarize history now |
| `/compact "Focus on X"` | Summarize with instructions on what to keep |
| `/clear` | Reset context completely (between unrelated tasks only) |
| `/btw` | Side question that does not stay in context |
| `/resume` | Continue a prior session (keeps history, maybe warm cache) |
| `/cd <path>` | Change directory without breaking cache |

### /resume - the most underused saver

A new session rewrites system prompt + project context to cache (1.25x on 100-500K tokens).
`/resume` reloads the prior session instead. At Opus pricing with 500K context this saves
$3-6 per avoided restart.

```bash
claude --resume              # most recent session
claude --resume SESSION_ID   # specific session
/resume                      # inside a session
```

### Auto-compaction

Near the context limit Claude Code summarizes automatically.

- Survives: CLAUDE.md (root reloads; subdirectory files reload on next read), auto memory
  (MEMORY.md), system prompt.
- Condensed: conversation history, file contents read mid-session, exploration findings.

Guide it with a section in CLAUDE.md:

```markdown
# Compact instructions
When compacting, focus on code changes, test results, and architectural decisions.
```

### Context pollution (context rot)

Above roughly 100-200K tokens of back-and-forth (attempts, feedback, failed results) model
quality drops fast. Typical signs: self-correction loops ("but wait, the actual problem is
..."), or "you are absolutely right to push back". After ~3 failed attempts the context is
likely working against you.

Break the loop:

1. Ask Claude to write a briefing (what was done, where it got stuck) to a markdown file.
2. `/clear`.
3. Ask it to read the briefing and continue.

Further reading: Chroma "Context Rot", arXiv 2509.21361, arXiv 2506.18403, Pragmatic
Engineer podcast "Context engineering with Dex Horthy" (links in References).

---

## 4. Plan mode and opusplan

Plan mode (`Shift+Tab` or `/plan`) only reads, searches and proposes - no changes until approved.

| Flow | Tokens |
|---|---|
| No plan: implement (100K+), misunderstanding, re-implement (100K+) | 200K+ |
| Plan (30-50K), refine, implement once (100K) | 130-150K (25-40% saved) |

`claude --model opusplan`: Opus while planning, automatically Sonnet while executing.

Use plan mode for: refactors touching 5+ files, architectural changes, ambiguous
requirements, unfamiliar codebases, anything where a wrong approach is expensive.

---

## 5. Prompt caching - the #1 cost driver

Caching is automatic. Reused prompt prefixes are read at 0.1x instead of reprocessed.
Misused, it is the biggest cost driver: an internal analysis (May 2026) showed cache
**writes at 45%** of spend (healthy: 20-30%) and reads at 34% (healthy: 40-50%).

| Operation | Cost | When |
|---|---|---|
| Cache write, 5 min TTL | 1.25x | First time a prefix is sent |
| Cache write, 1 h TTL | 2x | Longer-lived cache |
| Cache read | 0.1x | Every following message with same prefix |

### The 12.5x multiplier

Default TTL is 5 minutes. With a 450K context on Opus:

- warm cache: ~$0.22 per message
- cold cache (after a break): ~$2.81 per message

At 1M context: $0.50 vs $6.25 per message. A coffee break can cost $6+ on the next prompt.

### Root causes of cache churn

| Cause | Why expensive | Fix |
|---|---|---|
| Many short sessions | Full rewrite, too few messages to amortize | `/resume` |
| Breaks > 5 min | Cache expires, next message rewrites all | `/compact` before break or 1 h TTL |
| Editing CLAUDE.md mid-session | It is part of the cached prefix | Edit between sessions only |
| Excessive `/clear` | Discards the whole cache | Prefer `/compact` |
| Model switch mid-session | Different tokenizer, cache misaligned | Choose model at start |
| Dynamic system prompt | Timestamps / paths change per request | `--exclude-dynamic-system-prompt-sections` |

Other invalidation triggers: changing `/effort`, connecting a new MCP server, enabling or
disabling a plugin mid-session.

### Healthy session pattern

- Messages 1-3: cache warming (high write cost, expected)
- Messages 4+: cache reuse (0.1x reads)
- Message 15+: `/compact` if context grows large
- Sessions under 4 messages rarely pay off; aim for 10+.

### Settings that improve hit rate

`~/.claude/settings.json` (user) or `.claude/settings.json` (project):

```json
{
  "model": "sonnet",
  "env": {
    "EXCLUDE_DYNAMIC_SYSTEM_PROMPT_SECTIONS": "1",
    "ENABLE_PROMPT_CACHING_1H": "1"
  }
}
```

- `EXCLUDE_DYNAMIC_SYSTEM_PROMPT_SECTIONS`: drops per-machine timestamps/paths, better reuse
  across sessions and machines.
- `ENABLE_PROMPT_CACHING_1H`: TTL 1 h. Writes cost 2x instead of 1.25x but happen far less often.

---

## 6. Effort levels

Thinking tokens are billed as **output** (most expensive type).

```bash
claude --effort medium   # at startup
/effort low              # mid-session (breaks cache)
```

| Level | Use for | Cost |
|---|---|---|
| low | Short, scoped, latency-sensitive tasks | Lowest |
| medium | Cost-sensitive work, some depth traded | Low |
| high | Balance of cost and quality | Medium |
| xhigh | Most coding tasks (Opus default) | High |
| max | Deepest reasoning | Highest |

---

## 7. Monitoring usage

- `/cost`: session estimate (tokens, cost, duration, lines changed).
- Authoritative numbers: AWS billing (Bedrock) or https://platform.claude.com/usage.
- Live dashboard: **Claude Code Usage Monitor** (section 8.1).
- In-house **cost-aware status line**: shows cache TTL countdown and warm vs cold cost of the
  next message, e.g.
  `~/project main Opus 4.6 ctx: 450k/1M (45%) $12.34 total | 3:42 | next: $0.22 (cold: $2.81) | /compact`.
  Install by asking Claude to build a status line from `statusline-cost-guide.md`
  (attachment of the internal post).

---

## 8. Repositories used

### 8.1 Claude Code Usage Monitor

- Repository: https://github.com/Maciek-roboblog/Claude-Code-Usage-Monitor
- PyPI: `claude-monitor` (MIT, Python 3.9+, v4.x)
- Aliases: `claude-monitor`, `claude-code-monitor`, `cmonitor`, `ccmonitor`, `ccm`
- Reads Claude Code local usage logs passively; zero impact on Claude Code. Run it in a
  separate terminal.

Install:

```bash
uv tool install claude-monitor   # recommended (isolated)
pipx install claude-monitor      # alternative
pip install claude-monitor       # alternative
```

Windows: install uv with `powershell -ExecutionPolicy ByPass -c "irm https://astral.sh/uv/install.ps1 | iex"`.

Views:

```bash
claude-monitor --view realtime                          # live session (default)
claude-monitor --view daily                             # per-day tokens + cost
claude-monitor --view monthly --timezone Europe/Berlin  # trends for budgeting
```

Relevant options:

| Option | Purpose |
|---|---|
| `--plan custom` | Default. P90 auto-detected limits from last 8 days; default cost reference $50 |
| `--custom-limit-tokens N` | Explicit token limit for the custom plan |
| `--view realtime\|daily\|monthly\|session\|sessions\|burn-rate` | View type |
| `--timezone Europe/Berlin` | Timezone for resets and tables |
| `--refresh-rate N` | Data refresh in seconds (1-60) |
| `--once --output json` | One-shot snapshot; exit codes `0` ok, `10` near limit, `11` limit hit |
| `--compact` | One-line output for status bars |
| `--warehouse` | Opt-in local history beyond Claude's 30-day cleanup |
| `--no-emoji` | Plain output (useful on Windows cp1252 consoles) |
| `--clear` | Reset saved preferences (`~/.claude-monitor/last_used.json`) |

Notes for Bedrock (pay-per-token):

- `--plan pro|max5|max20|team` are subscription limits - **not applicable**. Use
  `--plan custom` with `--custom-limit-tokens` as a personal budget, or let it auto-detect.
- The monitor prices with Anthropic list prices (= Bedrock global endpoints). For regional
  endpoints add ~10% mentally.
- The CLI has no flag for a money limit; the limit is set in **tokens**. See 8.3 to convert
  a EUR budget into tokens.

### 8.2 Caveman skill

- Repository: https://github.com/JuliusBrussee/caveman
- Claude Code skill/plugin that strips filler (articles, hedging, pleasantries) from Claude's
  chat output. Code, commits and PRs stay normal English.
- Measured: ~65% fewer output tokens on average (22-87%), ~71% output cost saved, ~3x faster
  responses. Example: "Explain React re-render bug" 1,180 -> 159 tokens (87%); "Review PR for
  security issues" 678 -> 398 (41%).

Install:

```bash
# Plugin marketplace (recommended, works on Windows, auto-activates every session)
claude plugin marketplace add JuliusBrussee/caveman && claude plugin install caveman@caveman

# Standalone hooks (macOS / Linux / WSL only)
bash <(curl -s https://raw.githubusercontent.com/JuliusBrussee/caveman/main/hooks/install.sh)
```

Usage:

| Command | Effect |
|---|---|
| `/caveman` | Activate (default `full`) |
| `/caveman lite` | Remove filler, keep grammar |
| `/caveman ultra` | Telegraphic, maximum compression |
| `/caveman-commit` | Terse conventional commit messages |
| `/caveman-review` | One-line PR review comments |
| `/caveman-compress CLAUDE.md` | Compress an input file (~46% fewer input tokens) |
| "stop caveman" / "normal mode" | Deactivate |

`/caveman-compress` writes the compressed `CLAUDE.md` (read by Claude) and keeps
`CLAUDE.original.md` (edited by humans). Code blocks, URLs, paths, commands and structure are
preserved. Edit `CLAUDE.original.md` and re-compress **between** sessions.

Safety: security warnings, irreversible actions or user confusion automatically switch back to
verbose explanations.

### 8.3 Live monitor with a 50 EUR budget

`--custom-limit-tokens` only scales the **Token Usage** bar and the "tokens will run out"
prediction. The Cost and Messages bars use their own P90 limits from your history and do not change.

The realtime view measures one **5-hour session block**, not a day. With `--plan custom` the cost
limit (e.g. `$30.15`) is the P90 of your past session costs and **cannot be set by CLI**. Fixed
plans have fixed cost limits (`pro` $18, `max5` $35, `max20` $140) but then
`--custom-limit-tokens` is ignored. `--view daily` / `--view monthly` are tables without limits:
compare the Cost column against your daily budget yourself.

The token counter excludes cache reads/writes, while the cost includes them. In a cache-heavy
Claude Code session one counted token costs roughly 100-120 USD/MTok
(observed: $4.09 for 36,530 tokens = ~112 USD/MTok). Therefore:

| Budget | Approx. counted tokens |
|---|---|
| 50 EUR (~54 USD) | ~500,000 |
| 60 EUR (~65 USD) | ~600,000 |
| 100 EUR (~108 USD) | ~1,000,000 |

```bash
claude-monitor --plan custom --custom-limit-tokens 500000 --view realtime --timezone Europe/Berlin
```

Re-check your own ratio from time to time: cost / counted tokens in `--view daily`.

### 8.4 Other community tools

| Tool | Repository | Purpose |
|---|---|---|
| CacheLane | https://github.com/Aditya-Tripuraneni/CacheLane | Cache optimization toolkit |
| claude-code-cache-fix | https://github.com/cnighswonger/claude-code-cache-fix | Fix cache invalidation issues |
| codegraph | https://github.com/colbymchenry/codegraph | Code graph for cheaper exploration |

---

## 9. CLAUDE.md best practices

CLAUDE.md is loaded at session start and sent with **every** request.

- Keep each CLAUDE.md under 200 lines.
- Clear headers and specific rules ("use 2-space indentation"); vague rules cause clarification loops.
- Move reference material to skills (loaded on demand) and path rules to `.claude/rules/`.

`.claude/rules/api.md`:

```markdown
---
paths:
  - src/api/**
---
Use snake_case for all API endpoint handlers.
Always validate request bodies with zod schemas.
```

| Content | Location | Cost |
|---|---|---|
| Build commands, core conventions | CLAUDE.md | Every request (keep small) |
| API docs, reference material | Skills | On demand, saves 50-100 tokens/request |
| Directory-specific rules | `.claude/rules/` | Only when relevant |
| Specialized procedures | Skills | Zero when not invoked |

---

## 10. Subagents - isolate expensive work

Subagents run in their own context; only a summary returns.

    Main session: 120K
    | research subagent reads 50 files, many greps (isolated)
    | returns ~5K summary
    Main session: ~125K   (without subagent: 200K+)

- Run in background by default; several can run in parallel (more simultaneous spend).
- Good for: running tests, searching docs, analyzing logs, reviewing large diffs, any verbose output.
- Route to cheaper models in the subagent frontmatter:

```yaml
model: haiku
description: Find all TODO comments in the codebase
```

- Agent teams use ~7x more tokens than a normal session (one context per teammate). Use only
  when parallelism really pays off.

---

## 11. Permission modes

| Mode | Allowed without prompt | Use for |
|---|---|---|
| default | Reads | Getting started, sensitive work |
| acceptEdits | Reads + file edits | Daily development (review with `git diff`) |
| plan | Reads, proposes first | Complex changes, unknown codebases |
| auto | Everything, safety classifier | Long trusted tasks |
| dontAsk | Only pre-approved tools | CI/CD, locked-down automation |
| bypassPermissions | Everything except protected paths | Containers / sandboxes only |

Auto mode on Bedrock (opt-in): `{ "env": { "CLAUDE_CODE_ENABLE_AUTO_MODE": "1" } }`

---

## 12. CI/CD and headless usage

```bash
claude --bare -p "Analyze this PR for security issues"                     # skip hooks/plugins/MCP/memory
claude -p "Run tests" --permission-mode dontAsk --allowedTools "Read,Bash(npm test)"
claude -p "Refactor auth module" --max-budget-usd 5.00                    # hard cost cap
claude -p "Fix lint errors" --max-turns 10                                # hard turn cap
claude -p "Continue the refactor" --resume "$SESSION_ID"                  # reuse context
claude -p "Review code" --exclude-dynamic-system-prompt-sections          # cache hits across runners
claude --bg-exec "npm test && npm run lint"                               # background session
```

| Flag | Saves |
|---|---|
| `--bare` | 5-10K tokens (no auto-discovery) |
| `--permission-mode dontAsk` | Latency, no prompts |
| `--max-budget-usd N` | Hard cost cap |
| `--max-turns N` | Prevents runaway sessions |
| `--exclude-dynamic-system-prompt-sections` | Better cache reuse |
| `--bg-exec` | Frees the terminal |

---

## 13. References

Official documentation:

| Topic | URL |
|---|---|
| Cost management | https://code.claude.com/docs/en/costs |
| Model configuration | https://code.claude.com/docs/en/model-config |
| CLI reference | https://code.claude.com/docs/en/cli-reference |
| Permission modes | https://code.claude.com/docs/en/permissions |
| Memory and CLAUDE.md | https://code.claude.com/docs/en/memory |
| Common workflows | https://code.claude.com/docs/en/common-workflows |
| Best practices | https://code.claude.com/docs/en/best-practices |
| Prompt caching | https://docs.anthropic.com/en/docs/build-with-claude/prompt-caching |
| Pricing | https://docs.anthropic.com/en/docs/about-claude/pricing |
| Amazon Bedrock pricing | https://aws.amazon.com/bedrock/pricing/ |

Context rot:

- https://www.trychroma.com/research/context-rot
- https://arxiv.org/abs/2509.21361
- https://arxiv.org/abs/2506.18403
- https://newsletter.pragmaticengineer.com/p/context-engineering-with-dex-horthy

Repositories: see [section 8](#8-repositories-used).
