#!/usr/bin/env node
import { readFile, writeFile } from 'node:fs/promises';
import process from 'node:process';
import { decodeTranscript } from './adapters/index.js';
import { fromCodexJsonl } from './adapters/codex.js';
import { compactMessages } from './core.js';
import { resolveApiKey } from './client.js';
import { handleCodexHook } from './integrations/codex.js';
import { summarizeCompaction } from './render.js';
import { startDashboard } from './dashboard.js';
import type { DashboardOptions } from './dashboard.js';

async function stdin(): Promise<string> {
  const chunks: Buffer[] = [];
  for await (const chunk of process.stdin) chunks.push(Buffer.from(chunk));
  return Buffer.concat(chunks).toString('utf8');
}

function valueAfter(args: string[], name: string): string | undefined {
  const index = args.indexOf(name);
  return index >= 0 ? args[index + 1] : undefined;
}

function numberAfter(args: string[], name: string, fallback: number): number {
  const value = Number(valueAfter(args, name));
  return Number.isFinite(value) ? value : fallback;
}

// Compacts the summary & directly calls the Jev API to call tools
async function runCompact(args: string[]): Promise<void> {
  const inputPath = valueAfter(args, '--input');
  const outputPath = valueAfter(args, '--output');
  const format = valueAfter(args, '--format') ?? 'auto';
  const source = inputPath ? await readFile(inputPath, 'utf8') : await stdin();
  const messages = format === 'codex-jsonl' ? fromCodexJsonl(source) : decodeTranscript(JSON.parse(source), format);
  const result = await compactMessages(messages);
  const output = `${JSON.stringify({ messages: result.messages, decisions: result.decisions, stats: result.stats }, null, 2)}\n`;
  if (outputPath) await writeFile(outputPath, output);
  else process.stdout.write(output);
  process.stderr.write(`${summarizeCompaction(result)}\n`);
}

async function runDashboard(args: string[]): Promise<void> {
  const options: DashboardOptions = {
    port: numberAfter(args, '--port', 0),
    host: valueAfter(args, '--host') ?? '127.0.0.1',
  };
  const dataDir = valueAfter(args, '--data-dir');
  if (dataDir) options.dataDir = dataDir;
  const dashboard = await startDashboard(options);
  process.stdout.write(`save-token-jev dashboard: ${dashboard.url}\n`);
}

function usage(): string {
  return `save-token-jev

Usage:
  save-token-jev compact [--input FILE] [--output FILE] [--format auto|generic|anthropic|openai-chat|openai-responses|opencode|codex-jsonl]
  save-token-jev dashboard [--port PORT] [--data-dir DIR]
  save-token-jev hook codex
  `;
}

async function main(): Promise<void> {
  const args = process.argv.slice(2);
  if (args[0] === 'compact') return runCompact(args.slice(1));
  if (args[0] === 'dashboard' || args[0] === 'serve') return runDashboard(args.slice(1));
  if (args[0] === 'hook' && args[1] === 'codex') {
    const input = JSON.parse(await stdin());
    process.stdout.write(`${JSON.stringify(await handleCodexHook(input))}\n`);
    return;
  }
  process.stdout.write(usage());
  if (args.length && !['--help', '-h'].includes(args[0]!)) process.exitCode = 1;
}

main().catch((error) => {
  process.stderr.write(`save-token-jev: ${error instanceof Error ? error.message : String(error)}\n`);
  process.exitCode = 1;
});
