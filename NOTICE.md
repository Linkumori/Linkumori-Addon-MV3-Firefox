## Important Notice

Some third-party code in this software has been modified by the first party. In accordance with license compliance requirements, these changes are disclosed. Please review the source files, as some modified files include individual modification notices.

### Viewing Modification History

To view modification history that is not included within individual source files due to space constraints, download the source code and run one of the following commands:

**With Node.js installed:**
```bash
node linkumori-cli-tool.js 
```

**Or with Bun installed:**
```bash
bun start
```

Preferably, use a Unix-based system (such as macOS or Linux) to run this script, as it is designed and tested primarily for Unix-like environments.

Then follow these steps:

1. Select **Setup Project**
2. Select **Generate Commit History**

Commit history generation requires a real Git clone (with `.git` history).  
Without `git clone`, you cannot generate commit history.

Clone command:
```bash
git clone https://github.com/Linkumori/Linkumori-Addon-MV3-Firefox.git
```

For every official release, the source package downloadable from GitHub Releases (`source code.zip`) includes `COMMIT_HISTORY.md`.
For all other source distributions, you must generate `COMMIT_HISTORY.md` manually.

**Requirements:**
- Node.js: Download from [nodejs.org](https://nodejs.org/en)
- Or Bun: [bun.com/docs/installation](https://bun.com/docs/installation)

### Important Notes

- Older modifications may not appear in the generated `COMMIT_HISTORY.md`
- Review individual modified source files for earlier notices
- Some files may not contain notices within the file itself or may not be listed in `COMMIT_HISTORY.md`; a separate notice file may be provided instead
- Not all source code files have been modified, but review notices in all source files and any separate notice files (`.md` or `.txt`)
- `git clone` is required before running **Generate Commit History**; otherwise commit history generation will not work

# Build Instructions

## Requirements
Before running the tool, install [Node.js (current version)](https://nodejs.org/en/download/current) or [Bun](https://bun.com/docs/installation).

Preferably, use a Unix-based system (such as macOS or Linux) to run this script.

## Build Unsigned Version
Run one of the following:

If Node.js is installed:
```bash
node linkumori-cli-tool.js
```

If Bun is installed:
```bash
bun start 
```

Then select: **Build Extension (Full Build)**

When prompted for rules source mode (online/offline), select **offline** for an exact reproducible build.

Output will be in `web-ext-artifacts/`

## Build Signed Version

### 1. Get Mozilla API Keys
- Log in to [addons.mozilla.org](https://addons.mozilla.org)
- Go to: **Tools → Manage API Keys**
- Generate credentials

### 2. Setup Project
Run one of the following:

If Node.js is installed:
```bash
node linkumori-cli-tool.js
```

If Bun is installed:
```bash
bun start 
```

Select: **Setup Project**

This creates `.env.template`

### 3. Add API Keys
- Paste keys into `.env.template`
- When prompted "Convert .env.template to .env now? (Y/n):" type `y`
- Exit the CLI

### 4. Build & Sign Extension
Run one of the following:

If Node.js is installed:
```bash
node linkumori-cli-tool.js
```

If Bun is installed:
```bash
bun start 
```

Select: **Build & Sign Extension**

When prompted for rules source mode (online/offline), select **offline** for an exact reproducible build.

Your signed extension will now be generated.

## Load the Built Extension in Firefox

### Temporary Load
1. Open: `about:debugging#/runtime/this-firefox`
2. Click: **Load Temporary Add-on...**
3. Select: `/<project-folder>/web-ext-artifacts/output.zip` or `output.xpi`

### Install Signed Extension
1. Open: `about:addons`
2. Drag and drop the `.xpi` file into the page
