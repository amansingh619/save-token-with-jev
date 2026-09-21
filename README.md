# save-token-with-jev

This repo helps your coding agent to reduce the unnecessary decision time which it takes in tool calling by simply integrating the JEV based clasifier models which alike other models doesn't go through the auto-regressive loop & instead shares the result which matters.

The `save-token-with-jev` is implemented behind a normalized transcript model and host adapters so the same compaction policy works across multiple coding-agent runtimes.

## Supported hosts

| Host / format | Integration | Behavior |
| --- | --- | --- |
| Codex CLI/app | Codex plugin hooks | Scores before built-in compaction and restores retained verbatim context immediately afterward |
| Claude Code | function-hook plugin | Directly replaces compaction with the retained message list |
| Anthropic API | transcript adapter | Decodes `tool_use` / `tool_result` blocks for applications |
| OpenAI Chat Completions | transcript adapter | Decodes assistant `tool_calls` and tool messages |

## Install and build

```bash
npm install
npm run check
export TYPESAFE_API_KEY="..."
```

Node 20 or newer is required. The runtime package has no third-party dependencies.


## CLI

Compact a normalized, Anthropic, OpenAI, or OpenCode JSON transcript:

```bash
save-token-with-jev compact \
  --format anthropic \
  --input transcript.json \
  --output compacted.json
```

Read a Codex rollout JSONL:

```bash
save-token-with-jev compact --format codex-jsonl --input rollout.jsonl
```

Inspect environment readiness:

```bash
save-token-with-jev doctor
```

The CLI prints the compacted normalized transcript, decisions, and statistics as JSON. Diagnostics go to stderr, so stdout remains pipeable.

## Local savings dashboard

You can start the local dashboard manually:

```bash
node dist/cli.js dashboard
```

It prints a localhost URL such as `http://127.0.0.1:43127/`

## Configuration

| Environment variable | Default | Meaning |
| --- | --- | --- |
| `TYPESAFE_API_KEY` | required unless stored in Keychain | TypeSafe/Jev API key |
| `JEV_MODEL` | `jev-latest` | Jev model |
| `JEV_BASE_URL` | System One endpoint | Alternate compatible endpoint |
| `SAVE_TOKEN_JEV_KEEP_THRESHOLD` | `0.5` | Minimum keep probability |
| `SAVE_TOKEN_JEV_PRESERVE_RECENT` | `6` | Newest messages pinned from deletion |
| `SAVE_TOKEN_JEV_MIN_REDUCTION` | `0.15` | Minimum reduction for host integration |
| `SAVE_TOKEN_JEV_MAX_STATE_TOKENS` | `25000` | Estimated state budget |
| `SAVE_TOKEN_JEV_MAX_REQUEST_TOKENS` | `30000` | Estimated state + question budget |
| `SAVE_TOKEN_JEV_TRUNCATE_HEAD_CHARS` | `300` | Result prefix retained when only the call matters |
| `SAVE_TOKEN_JEV_MAX_CONCURRENT_REQUESTS` | `4` | Jev requests allowed in flight at once |
| `SAVE_TOKEN_JEV_TIMEOUT_MS` | `30000` | Provider request timeout before fail-open fallback |

