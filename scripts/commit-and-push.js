#!/usr/bin/env node
/*
 * Copyright (C) 2026 Subham Mahesh
 *
 * This file is part of Linkumori firefox mv3 webrequest.
 *
 * Linkumori is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Lesser General Public License as published by
 * the Free Software Foundation, version 3.0 of the License.
 *
 * Linkumori is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * GNU Lesser General Public License for more details.
 *
 * You should have received a copy of the GNU Lesser General Public License
 * along with Linkumori. If not, see <https://www.gnu.org/licenses/>.
 */
import { execSync } from "node:child_process";
import readline from "node:readline/promises";
import { stdin as input, stdout as output } from "node:process";

function run(command, options = {}) {
  return execSync(command, { encoding: "utf8", stdio: ["pipe", "pipe", "pipe"], ...options }).trim();
}

function runStreaming(command) {
  execSync(command, { stdio: "inherit" });
}

function getArgValue(flag) {
  const idx = process.argv.indexOf(flag);
  if (idx === -1) return "";
  return (process.argv[idx + 1] || "").trim();
}

async function getCommitMessage() {
  const fromFlag = getArgValue("-m") || getArgValue("--message");
  if (fromFlag) return fromFlag;

  const rl = readline.createInterface({ input, output });
  try {
    const answer = await rl.question("Commit message: ");
    return answer.trim();
  } finally {
    rl.close();
  }
}

function hasChanges() {
  const status = run("git status --porcelain");
  return status.length > 0;
}

function hasStash() {
  try {
    const top = run("git stash list -n 1");
    return top.length > 0;
  } catch {
    return false;
  }
}

function getCurrentBranch() {
  return run("git rev-parse --abbrev-ref HEAD");
}

async function main() {
  try {
    run("git rev-parse --git-dir");
  } catch {
    console.error("Not inside a git repository.");
    process.exit(1);
  }

  const branch = getCurrentBranch();
  const dryRun = process.argv.includes("--dry-run");

  console.log(`Remote: origin`);
  console.log(`Branch: ${branch}`);

  if (dryRun) {
    const previewMessage = await getCommitMessage();
    console.log(`Message: ${previewMessage || "<empty>"}`);
    console.log("Dry run enabled. No git changes were made.");
    return;
  }

  // Always sync local branch with origin first.
  const hadLocalChanges = hasChanges();
  let stashed = false;
  if (hadLocalChanges) {
    runStreaming('git stash push --include-untracked -m "auto-commit-and-push-temp-stash"');
    stashed = hasStash();
  }

  try {
    runStreaming(`git pull --rebase origin ${branch}`);
  } finally {
    if (stashed) {
      runStreaming("git stash pop");
    }
  }

  if (!hasChanges()) {
    console.log("No changes to commit.");
    return;
  }

  const message = await getCommitMessage();
  if (!message) {
    console.error("Commit message is required.");
    process.exit(1);
  }
  console.log(`Message: ${message}`);

  runStreaming("git add -A");
  runStreaming(`git commit -m ${JSON.stringify(message)}`);
  runStreaming(`git push origin ${branch}`);

  console.log("Commit and push completed.");
}

await main();
