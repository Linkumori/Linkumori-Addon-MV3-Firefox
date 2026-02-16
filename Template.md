# LINKUMORI
## Copyright and Attribution Documentation

---

## Table of Contents

1. [First-Party Components](#1-first-party-components)
2. [Third-Party Components (Unmodified)](#2-third-party-components-unmodified)
3. [Third-Party Components from ClearURLs (Unmodified)](#3-third-party-components-from-clearurls-unmodified)
4. [Modified Third-Party Components](#4-modified-third-party-components)
5. [Third-Party Components from ClearURLs (Modified by Third Party)](#5-third-party-components-from-clearurls-modified-by-third-party)
6. [Modified ClearURLs Core Components](#6-modified-clearurls-core-components)
7. [Font Components](#7-font-components)
8. [License Information](#8-license-information)

---

## 1. First-Party Components

**Description:** Original components developed without third-party dependencies.

### 1.1 Component Files

| Category | Files |
|----------|-------|
| **JavaScript** | `external_js/IP-Ranger.js`<br>`external_js/linkumori-i18n.js`<br>`core_js/clipboard-helper.js`<br>`core_js/about.js` |
| **HTML** | `html/legal.html` |
| **CSS** | `css/settings.css`<br>`css/siteBlockedAlert.css` |
| **Icons (PNG)** | `img/icon16.png`<br>`img/icon19.png`<br>`img/icon20.png`<br>`img/icon24.png`<br>`img/icon30.png`<br>`img/icon32.png`<br>`img/icon38.png`<br>`img/icon48.png`<br>`img/icon64.png`<br>`img/icon96.png`<br>`img/icon128.png`<br>`img/icon128_gray.png` |
| **Icons (SVG)** | `img/linkumori_icon_disabled.svg`<br>`img/linkumori_icons.svg` |
| **Data** | `data/custom-rules.json` |


### 1.2 Copyright & License

**Copyright:** © 2025 Subham Mahesh

**License:** GNU Lesser General Public License (LGPL) v3.0 or later

{{LICENSE:LGPL-3.0}}

---

## 2. Third-Party Components (Unmodified)

### 2.1 Punycode.js

**File:** `external_js/punycode.js`

**Copyright:** Mathias Bynens  
**Website:** <https://mathiasbynens.be/>

**License:** MIT License

{{LICENSE:MIT}}

---

## 3. Third-Party Components from ClearURLs (Unmodified)

### 3.1 PureCleaning.js

**File:** `core_js/pureCleaning.js`  
**File:** `data/downloaded-official-rules.json`

**Copyright:** © 2017-2020

**License:** GNU Lesser General Public License (LGPL) v3.0 or later

{{LICENSE:LGPL-3.0}}

---

## 4. Modified Third-Party Components

**Description:** Third-party components modified by first party, excluding ClearURLs project.

### 4.1 Decode-URI-Component.js

**File:** `external_js/decode-uri-component.js`

#### 4.1.1 Original Copyright

**Copyright:** © 2017 Sam Verschueren  
**Contact:** <sam.verschueren@gmail.com>  
**GitHub:** [github.com/SamVerschueren](https://github.com/SamVerschueren)

**License:** MIT License

{{LICENSE:MIT}}

#### 4.1.2 First-Party Modifications
**Author:** © 2025 Subham Mahesh

**Modifications Made:**
- Removed export statements from original code to enable browser environment compatibility without a module system


**License for Modified Portions:** GNU Lesser General Public License (LGPL) v3.0 or later



{{LICENSE:LGPL-3.0}}

---

### 4.2 Linkumori-Pickr

**Files:**
- `external_js/linkumori-pickr.js`
- `css/linkumori-pickr.min.css`

#### 4.2.1 Original Copyright

**Copyright:** © 2018-2021 Simon Reinisch

**License:** MIT License

{{LICENSE:MIT}}

#### 4.2.2 First-Party Modifications

**Copyright:** © 2025 Subham Mahesh

**License:** GNU Lesser General Public License (LGPL) v3.0 or later

{{LICENSE:LGPL-3.0}}

---

### 4.3 SHA256.js

**File:** `external_js/sha256.js`

#### 4.3.1 Original Copyright

**Copyright:** © 2014-2025 Chen, Yi-Cyuan

**License:** MIT License

{{LICENSE:MIT}}

#### 4.3.2 First-Party Modifications

**Copyright:** © 2025 Subham Mahesh

**License:** GNU Lesser General Public License (LGPL) v3.0 or later

{{LICENSE:LGPL-3.0}}

---

### 4.4 Custom Rules Editor & Settings

**Files:**
- `core_js/custom_rules_editor.js`
- `html/custom_rules_editor.html`
- `html/settings.html`

#### 4.4.1 Custom Rules Editor (`html/custom_rules_editor.html`)

**Title:** LINKUMORI - Custom Rules Editor (i18n) with Provider Import Feature and Provider List Modal

**Copyright:** © 2025 Subham Mahesh

**License:** GNU Lesser General Public License (LGPL) v3.0 or later

{{LICENSE:LGPL-3.0}}

This file is part of LINKUMORI.

##### SVG Icons Attribution (HTML Embedded Only)

**Note:** All embedded SVG icons in JavaScript and HTML files have their separate original SVG files located in the `svg/material_icon/` directory. Icons marked as "heavily modified" have different path data and/or viewBox from their original source files.

###### Custom Icons

| Icon | Description | Copyright |
|------|-------------|-----------|
| Linkumori Logo | Custom design embedded inline in header | © 2025 Subham Mahesh |

###### Embedded Modified Google Material Icons (Apache License 2.0)

| Icon            | File                                       | Modifications                                                                                                                                                                                             | Used In                                |
| --------------- | ------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------- |
| FAQ/Help Icon   | `help:faq.svg`                             | width=14 (orig: 24px), height=14 (orig: 24px), fill=currentColor (orig: #e3e3e3), path=unchanged, viewBox=unchanged                                                                                       | FAQ button (embedded inline)           |
| List/Menu Icon  | `list_24dp_E3E3E3.svg` (heavily modified)  | width=14 (orig: 24px), height=14 (orig: 24px), fill=currentColor (orig: #e3e3e3), viewBox=0 -960 960 960 (orig: 0 0 24 24), path=completely redesigned. Original: bullets+lines design (2 paths in 24x24 viewBox). Modified: horizontal-lines-only design (1 path in 960x960 viewBox) | Provider List button (embedded inline) |
| Delete Icon     | `delete.svg`                               | width=14px (orig: 24px), height=14px (orig: 24px), fill=currentColor (orig: #e3e3e3), viewBox=unchanged, path=unchanged                                                                                   | Provider delete buttons                |
| Plus/Add Icon   | `plus.svg`                                 | width=14px (orig: 24px), height=14px (orig: 24px), fill=currentColor (orig: #e3e3e3), viewBox=unchanged, path=unchanged                                                                                   | Add provider buttons, create provider  |
| Close/Exit Icon | `close_24dp_E3E3E3.svg` (heavily modified) | width=14px (orig: 24px), height=14px (orig: 24px), fill=currentColor (orig: #e3e3e3), viewBox=0 -960 960 960 (orig: 0 0 24 24), path=completely different design. Original: X design (2 paths in 24x24 viewBox). Modified: X design redrawn (1 path in 960x960 viewBox) | Modal close buttons, exit editor       |
| Save Icon       | `save.svg` (heavily modified)              | width=14px (orig: 24px), height=14px (orig: 24px), fill=currentColor (orig: #e3e3e3), viewBox=0 0 24 24 (orig: 0 -960 960 960), path=completely different design. Original: detailed floppy disk (1 path in 960x960 viewBox). Modified: simplified floppy disk (1 path in 24x24 viewBox) | Save provider button                   |


**Google Material Icons License Information:**
- **Source:** <https://fonts.google.com/icons>
- **License:** Apache License 2.0
- **Documentation:** <https://developers.google.com/fonts/docs/material_icons#licensing>

{{LICENSE:APACHE-2.0}}

##### Feature Modifications

The following enhancements have been implemented:

- Added provider import functionality from bundle/remote rules
- Enhanced provider browsing with search and selection
- Support for importing from different rule sources
- Multi-select provider import with conflict resolution
- Real-time provider preview and statistics
- Enhanced UI with provider cards and filtering
- Added provider list modal for quick overview and editing
- Fully internationalized (i18n) provider list interface

#### 4.4.2 Settings Page Attribution (`html/settings.html`)

**Based On:** Linkumori Settings Page / ClearURLs Settings Page

**Original Copyright:** © 2017-2025 Kevin Röbert  
**Modified By:** Subham Mahesh © 2025  
**Header Content and SVG Implementations By:** Subham Mahesh © 2025

##### SVG Icons (Settings.html Embedded)

###### Custom Icons

| Icon | Description | Copyright |
|------|-------------|-----------|
| Linkumori Logo | Custom design | © 2025 Subham Mahesh |

###### Embedded Modified Google Material Icons (Apache License 2.0)

| Icon | Source | Modifications | Usage |
|------|--------|---------------|-------|
| Save Icon | `save.svg` | width=16, height=16, fill=currentColor | Settings save button |
| Export Icon | `export.svg` | width=16, height=16, fill=currentColor | Settings export button |
| Import/Upload Icon | `upload.svg` | width=16, height=16, fill=currentColor | Settings import button |
| Reset Icon | `reset.svg` | width=16, height=16, fill=currentColor | Settings reset button |

{{LICENSE:APACHE-2.0}}

###### External File References (Feather Icons - MIT License)

| Icon | Source | License | Copyright |
|------|--------|---------|-----------|
| Sun Icon | `sun.svg` | MIT | © 2013-2017 Cole Bemis |
| Moon Icon | `moon.svg` | MIT | © 2013-2017 Cole Bemis |

**Feather Icons Information:**
- **Source:** <https://feathericons.com/>
- **License:** MIT License
- **Copyright:** © 2013-2017 Cole Bemis

{{LICENSE:MIT}}

##### License

**License:** GNU Lesser General Public License (LGPL) v3.0 or later

{{LICENSE:LGPL-3.0}}

#### 4.4.3 core_js/custom_rules_editor.js

Copyright (c) 2025 Subham Mahesh

This program is free software: you can redistribute it and/or modify
it under the terms of the GNU Lesser General Public License as published by
the Free Software Foundation, either version 3 of the License, or
(at your option) any later version.

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
GNU Lesser General Public License for more details.

You should have received a copy of the GNU Lesser General Public License
along with this program.  If not, see <http://www.gnu.org/licenses/>.

##### SVG Icons Attribution (JavaScript Embedded)

<!--
First modified SVG Apache License icons by Google: August 21, 2025 by Subham Mahesh
Second modified SVG Apache License icons by Google: September 5, 2025 by Subham Mahesh

Due to constraints, subsequent modifications are not visible inline.
To view the full modification history, run:

    node linkumori-cli-tool.js

Then select "Generate Commit History". This will create a Markdown file
where you can browse who modified which files and on what date.
-->

ALL embedded SVG icons are Modified Google Material Icons (Apache License 2.0):

###### Embedded Modified Google Material Icons (Apache License 2.0)

| Icon | Source | Modifications | Usage |
|------|--------|---------------|-------|
| Arrow Drop Down Icon | `arrow-drop.svg` | fill=currentColor (orig: #e3e3e3), width=24px, height=24px, viewBox=unchanged, path=unchanged | FAQ accordion questions |
| Edit Icon | `edit.svg` | width=12px (orig: 24px), height=12px (orig: 24px), fill=currentColor (orig: #e3e3e3), viewBox=unchanged, path=unchanged | Provider list edit buttons |
| Copy/Duplicate Icon | `copy.svg` | width=12px (orig: 24px), height=12px (orig: 24px), fill=currentColor (orig: #e3e3e3), viewBox=unchanged, path=unchanged | Provider duplicate buttons |
| Delete Icon | `delete.svg` | width=12px (orig: 24px), height=12px (orig: 24px), fill=currentColor (orig: #e3e3e3), viewBox=unchanged, path=unchanged | Provider delete buttons, array item removal |
| Plus/Add Icon | `plus.svg` | width=14px (orig: 24px), height=14px (orig: 24px), fill=currentColor (orig: #e3e3e3), viewBox=unchanged, path=unchanged | Add provider buttons, add array items |
| Close/Exit Icon | `close_24dp_E3E3E3.svg` (heavily modified) | width=14px (orig: 24px), height=14px (orig: 24px), fill=currentColor (orig: #e3e3e3), viewBox=0 -960 960 960 (orig: 0 0 24 24), path=completely different design | Modal close buttons, exit editor |
| Save Icon | `save.svg` (heavily modified) | width=14px (orig: 24px), height=14px (orig: 24px), fill=currentColor (orig: #e3e3e3), viewBox=0 0 24 24 (orig: 0 -960 960 960), path=completely different design | Save provider button |
| Success/Check Icon | `correct-check.svg` | width=14px (orig: 24px), height=14px (orig: 24px), fill=currentColor (orig: #e3e3e3), viewBox=unchanged, path=unchanged | Enforce rules success feedback |
| Warning Triangle Icon | `warning.svg` | width=14px (orig: 24px), height=14px (orig: 24px), fill=currentColor (orig: #e3e3e3), viewBox=unchanged, path=unchanged | Enforce rules error feedback |

Google Material Icons License Information:
- Source: <https://fonts.google.com/icons>
- Licensed under Apache License 2.0
- Documentation: <https://developers.google.com/fonts/docs/material_icons#licensing>

{{LICENSE:LGPL-3.0}}

{{LICENSE:APACHE-2.0}}

---

## 5. Third-Party Components from ClearURLs (Modified by Third Party)

### 5.1 Google & Yandex Link Fix

**Files:**
- `core_js/google_link_fix.js`
- `core_js/yandex_link_fix.js`

#### 5.1.1 Copyright & License

**Copyright:** © 2017-2025 Kevin Röbert

**License:** GNU Lesser General Public License (LGPL) v3.0 or later

{{LICENSE:LGPL-3.0}}

#### 5.1.2 Based On

**Project:** Remove Google Redirection  
**Repository:** <https://github.com/kodango/Remove-Google-Redirection>  
**Copyright:** © 2017 kodango  
**License:** MIT License

{{LICENSE:MIT}}

---

## 6. Modified ClearURLs Core Components

**Description:** Core ClearURLs components modified by first party.

### 6.1 Component Files

| Category | Files |
|----------|-------|
| **Core JavaScript** | `core_js/badgedHandler.js`<br>`core_js/historyListener.js`<br>`core_js/settings.js`<br>`core_js/watchdog.js`<br>`core_js/cleaning_tool.js`<br>`core_js/log.js`<br>`core_js/siteBlockedAlert.js`<br>`core_js/write_version.js`<br>`core_js/context_menu.js`<br>`core_js/message_handler.js`<br>`core_js/storage.js`<br>`core_js/eTagFilter.js`<br>`core_js/popup.js`<br>`core_js/tools.js` |
| **HTML** | `html/popup.html`<br>`html/log.html`<br>`html/cleaningTool.html`<br>`html/siteBlockedAlert.html` |
| **Localization** | `_locales/en/messages.json` |
| **Other** | `linkumori-cli-tool.js`<br>`linkumori-clearurls-min.json` |

### 6.2 Original Copyright

**Copyright:** © 2017-2025 Kevin Röbert

**License:** GNU Lesser General Public License (LGPL) v3.0 or later

{{LICENSE:LGPL-3.0}}

### 6.3 First-Party Modifications

**Copyright:** © 2025 Subham Mahesh

**License:** GNU Lesser General Public License (LGPL) v3.0 or later

{{LICENSE:LGPL-3.0}}

---

## 7. Font Components

### 7.1 Old Country Nobility Font

**Font Files:**
- `Old-Country-Nobility/Old-Country-Nobility.ttf`
- `Old-Country-Nobility.sfd`

**Font Name:** Old Country Nobility

**Modified By:** Subham Mahesh  
**Modification Date:** September 5, 2025

#### 7.1.1 Original Source Fonts

| Source Font | Copyright | License | Repository/Source |
|-------------|-----------|---------|-------------------|
| **Google Tinos** | Digitized data © 2010-2012 Google Corporation | Apache License 2.0 | Google Corporation |
| **MFB Oldstyle** | Released to Public Domain | CC0 1.0 Universal | <https://github.com/dbenjaminmiller/mfb-oldstyle> |

**Original Designers:**
- **Steve Matteson** - Tinos font design
- **dbenjaminmiller** - MFB Oldstyle digital font creator

**Trademark Notice:** Tinos is a trademark of Google Inc. and may be registered in certain jurisdictions.

**Monotype Credits:** Monotype Imaging Inc. for Tinos fonts  
**Website:** <http://www.monotypeimaging.com>  
**Type Designer Showcase:** <http://www.monotypeimaging.com/ProductsServices/TypeDesignerShowcase>

#### 7.1.2 Description

Old Country Nobility is a merged font combining Google Tinos fonts (digitized 2010-2012 by Google Corporation, Apache License 2.0) and MFB Oldstyle (released under CC0 1.0 Universal).

#### 7.1.3 Modifications Performed

Font modifications performed by Subham Mahesh on September 5, 2025 include:

- Merged character sets from both source fonts
- Resolved glyph conflicts and overlapping Unicode points
- Added proper kerning tables
- Maintained original design integrity of both source fonts
- Updated metadata and licensing information
- Created unified font family structure

**Font Creation Tool:** FontForge 2.0

**Version:** 1.0

#### 7.1.4 License for Modified Font

**Modified Portions License:** GNU Lesser General Public License Version 3 (LGPL v3)

**Complete License Statement:**

This work contains portions with the following licenses:
- **Apache License 2.0** (Tinos portions) - <http://www.apache.org/licenses/LICENSE-2.0>
- **CC0 1.0 Universal** (MFB Oldstyle portions) - <https://creativecommons.org/publicdomain/zero/1.0/>
- **GNU Lesser General Public License Version 3** (modified portion only by Subham Mahesh) - <https://www.gnu.org/licenses/lgpl-3.0.en.html>

{{LICENSE:APACHE-2.0}}

{{LICENSE:CC0-1.0}}

{{LICENSE:LGPL-3.0}}

**Font Family Name:** Old-Country-Nobility-fonts

**Font Modifications:** September 5, 2025

---

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

**Requirements:**
- Node.js: Download from [nodejs.org](https://nodejs.org/en)
- Or Bun: [bun.com/docs/installation](https://bun.com/docs/installation)

### Important Notes

- Older modifications may not appear in the generated `COMMIT_HISTORY.md`
- Review individual modified source files for earlier notices
- Some files may not contain notices within the file itself or may not be listed in `COMMIT_HISTORY.md`; a separate notice file may be provided instead
- Not all source code files have been modified, but review notices in all source files and any separate notice files (`.md` or `.txt`)

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

Your signed extension will now be generated.

## Load the Built Extension in Firefox

### Temporary Load
1. Open: `about:debugging#/runtime/this-firefox`
2. Click: **Load Temporary Add-on...**
3. Select: `/<project-folder>/web-ext-artifacts/output.zip` or `output.xpi`

### Install Signed Extension
1. Open: `about:addons`
2. Drag and drop the `.xpi` file into the page


## Document Information

**Document Generated:** {{CURRENT-TIME-WITH-DEVICE-TIME-ZONE}}

*End of Document*