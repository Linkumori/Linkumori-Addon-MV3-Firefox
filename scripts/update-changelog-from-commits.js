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
import fs from "node:fs";
import { execSync } from "node:child_process";

const CHANGELOG_PATH = "CHANGELOG.md";
const MAX_COMMITS = Number.parseInt(process.argv[2] || "80", 10);

function run(command) {
  return execSync(command, { encoding: "utf8" }).trim();
}

function readChangelog() {
  if (!fs.existsSync(CHANGELOG_PATH)) {
    throw new Error(`${CHANGELOG_PATH} not found`);
  }
  return fs.readFileSync(CHANGELOG_PATH, "utf8");
}

function collectLoggedHashes(changelog) {
  const hashes = new Set();
  const hashMatches = changelog.matchAll(/hash:\s*`?([0-9a-f]{7,40})`?/gi);
  for (const m of hashMatches) {
    hashes.add(m[1].toLowerCase());
  }
  return hashes;
}

function getRecentCommits(limit) {
  const format = "%h%x1f%s%x1f%ad";
  const output = run(`git log -n ${limit} --date=short --pretty=format:${JSON.stringify(format)}`);
  if (!output) return [];
  return output
    .split("\n")
    .map((line) => {
      const [hash, subject, date] = line.split("\x1f");
      return { hash, subject: (subject || "").trim(), date: (date || "").trim() };
    })
    .filter((c) => c.hash && c.subject);
}

function takeCommitsAfterLatestRelease(commits) {
  const releaseIndex = commits.findIndex((c) => /^release\s+\d+\.\d+(?:\.\d+)?/i.test(c.subject));
  if (releaseIndex === -1) {
    return commits;
  }
  return commits.slice(0, releaseIndex);
}

function normalizeVersion(version) {
  // Version format is MAJOR.MINOR (e.g. "1.0", "2.0"). Return as-is.
  return version;
}

function getReleaseCommits(commits) {
  return commits
    .map((commit) => {
      const m = commit.subject.match(/^release\s+(\d+\.\d+(?:\.\d+)?)/i);
      if (!m) return null;
      return { ...commit, version: `v${normalizeVersion(m[1])}` };
    })
    .filter(Boolean);
}

function getChangedFilesForCommit(hash) {
  const output = run(`git show --name-only --pretty=format: ${hash}`);
  if (!output) return [];
  return output
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.length > 0);
}

function getCommitRange(fromExclusiveHash, toInclusiveHash) {
  const format = "%h%x1f%s%x1f%ad";
  const range = fromExclusiveHash ? `${fromExclusiveHash}..${toInclusiveHash}` : toInclusiveHash;
  const output = run(`git log --reverse --date=short --pretty=format:${JSON.stringify(format)} ${range}`);
  if (!output) return [];
  return output
    .split("\n")
    .map((line) => {
      const [hash, subject, date] = line.split("\x1f");
      return { hash, subject: (subject || "").trim(), date: (date || "").trim() };
    })
    .filter((c) => c.hash && c.subject);
}

function getExistingVersionSet(changelog) {
  const versions = new Set();
  const matches = changelog.matchAll(/^## \[(v[0-9]+\.[0-9]+(?:\.[0-9]+){0,2})\]/gm);
  for (const m of matches) {
    versions.add(m[1].toLowerCase());
  }
  return versions;
}

function categorize(subject) {
  const s = subject.toLowerCase();
  if (/^(add|feat|create|introduce)\b/.test(s)) return "Added";
  if (/^(fix|bug|hotfix|patch)\b/.test(s)) return "Fixed";
  if (/^(remove|delete|drop)\b/.test(s)) return "Removed";
  return "Changed";
}

function buildUnreleasedSection(commits) {
  const groups = { Added: [], Changed: [], Fixed: [], Removed: [] };

  for (const commit of commits) {
    if (commit.subject.toLowerCase() === "push") continue;
    const type = categorize(commit.subject);
    groups[type].push(`- ${commit.subject} (\`${commit.date}\`, hash: \`${commit.hash}\`)`);
  }

  const lines = ["## [Unreleased]"];
  for (const heading of ["Added", "Changed", "Fixed", "Removed"]) {
    if (groups[heading].length > 0) {
      lines.push(`### ${heading}`);
      lines.push(...groups[heading]);
      lines.push("");
    }
  }

  if (lines.length === 1) {
    lines.push("### Changed");
    lines.push("- No unreleased commit entries.");
    lines.push("");
  }

  return lines.join("\n").trimEnd();
}

function buildReleaseSection(releaseCommit, previousReleaseCommit) {
  const rangeCommits = getCommitRange(previousReleaseCommit?.hash || "", releaseCommit.hash)
    .filter((c) => c.subject.toLowerCase() !== "push");
  const groups = { Added: [], Changed: [], Fixed: [], Removed: [] };

  for (const commit of rangeCommits) {
    const type = categorize(commit.subject);
    groups[type].push(`- ${commit.subject} (\`${commit.date}\`, hash: \`${commit.hash}\`)`);
  }

  const lines = [`## [${releaseCommit.version}] - ${releaseCommit.date}`];
  for (const heading of ["Added", "Changed", "Fixed", "Removed"]) {
    if (groups[heading].length > 0) {
      lines.push(`### ${heading}`);
      lines.push(...groups[heading]);
      lines.push("");
    }
  }

  if (lines.length === 1) {
    const files = getChangedFilesForCommit(releaseCommit.hash);
    lines.push("### Changed");
    lines.push(`- Release ${releaseCommit.version} (hash: \`${releaseCommit.hash}\`).`);
    if (files.length > 0) {
      lines.push("- Updated files:");
      for (const file of files) {
        lines.push(`  - \`${file}\``);
      }
    }
    lines.push("");
  }

  return lines.join("\n").trimEnd();
}

function replaceUnreleasedSection(changelog, unreleasedSection) {
  const start = changelog.indexOf("## [Unreleased]");
  if (start !== -1) {
    const rest = changelog.slice(start + "## [Unreleased]".length);
    const nextVersionRel = rest.search(/\n## \[(?!Unreleased\])/);
    const end = nextVersionRel === -1 ? changelog.length : start + "## [Unreleased]".length + nextVersionRel + 1;
    const before = changelog.slice(0, start).trimEnd();
    const after = changelog.slice(end).trimStart();
    return `${before}\n\n${unreleasedSection}\n\n${after}`;
  }

  const firstVersionIndex = changelog.search(/^## \[/m);
  if (firstVersionIndex === -1) {
    return `${changelog.trimEnd()}\n\n${unreleasedSection}\n`;
  }

  const before = changelog.slice(0, firstVersionIndex).trimEnd();
  const after = changelog.slice(firstVersionIndex).trimStart();
  return `${before}\n\n${unreleasedSection}\n\n${after}`;
}

function insertReleaseSections(changelog, releaseSections) {
  if (releaseSections.length === 0) {
    return changelog;
  }

  const firstReleasedHeading = changelog.search(/^## \[(?!Unreleased\]).+\]/m);
  if (firstReleasedHeading === -1) {
    return `${changelog.trimEnd()}\n\n${releaseSections.join("\n\n")}\n`;
  }

  const before = changelog.slice(0, firstReleasedHeading).trimEnd();
  const after = changelog.slice(firstReleasedHeading).trimStart();
  return `${before}\n\n${releaseSections.join("\n\n")}\n\n${after}`;
}

function main() {
  const changelogOriginal = readChangelog();
  const allCommits = getRecentCommits(MAX_COMMITS);
  const releaseCommits = getReleaseCommits(allCommits);
  const existingVersions = getExistingVersionSet(changelogOriginal);
  const missingReleaseCommits = releaseCommits.filter((r) => !existingVersions.has(r.version.toLowerCase()));
  const generatedReleaseSections = missingReleaseCommits.map((releaseCommit) => {
    const idx = releaseCommits.findIndex((r) => r.hash === releaseCommit.hash);
    const previousReleaseCommit = idx >= 0 ? releaseCommits[idx + 1] : null;
    return buildReleaseSection(releaseCommit, previousReleaseCommit);
  });

  let changelog = insertReleaseSections(changelogOriginal, generatedReleaseSections);

  const loggedHashes = collectLoggedHashes(changelog);
  const commits = takeCommitsAfterLatestRelease(allCommits);
  const unreleasedCommits = commits.filter((c) => !loggedHashes.has(c.hash.toLowerCase()));
  const unreleasedSection = buildUnreleasedSection(unreleasedCommits);
  const updated = replaceUnreleasedSection(changelog, unreleasedSection);
  fs.writeFileSync(CHANGELOG_PATH, updated);

  console.log(`Processed commits: ${allCommits.length}`);
  console.log(`Release sections generated: ${generatedReleaseSections.length}`);
  console.log(`Unreleased commits added: ${unreleasedCommits.length}`);
  console.log(`Updated: ${CHANGELOG_PATH}`);
}

main();
