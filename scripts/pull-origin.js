#!/usr/bin/env node
/* * Copyright (C) 2026 Subham Mahesh
 *
 * This file is part of Linkumori firefox mv3 webrequest.
 *
 * Linkumori is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Lesser General Public License as published by
 * the Free Software Foundation, version 3.0 of the License.
 *
 * [Project Name] is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * GNU Lesser General Public License for more details.
 *
 * You should have received a copy of the GNU Lesser General Public License
 * along with [Project Name]. If not, see <https://www.gnu.org/licenses/>.

  *

 */
import { execSync } from "node:child_process";

function runStreaming(command) {
  execSync(command, { stdio: "inherit" });
}

function run(command) {
  return execSync(command, { encoding: "utf8" }).trim();
}

try {
  run("git rev-parse --git-dir");
} catch {
  console.error("Not inside a git repository.");
  process.exit(1);
}

const branch = run("git rev-parse --abbrev-ref HEAD");
console.log(`Remote: origin`);
console.log(`Branch: ${branch}`);
runStreaming(`git pull origin ${branch}`);
