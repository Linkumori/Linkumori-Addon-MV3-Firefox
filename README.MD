# Linkumori (Clean URLs) for Firefox

<div align="center">

![Linkumori Logo](https://github.com/Linkumori/Linkumori-Addon-MV3-Firefox/blob/main/img/icon128.png)

Remove tracking parameters from URLs automatically.

[![Mozilla Add-on](https://img.shields.io/amo/v/linkumori-clean-urls?label=Firefox%20Add-on&logo=firefox)](https://addons.mozilla.org/en-US/firefox/addon/linkumori-clean-urls/)
[![GitHub release](https://img.shields.io/github/v/release/Linkumori/Linkumori-Addon-MV3-Firefox)](https://github.com/Linkumori/Linkumori-Addon-MV3-Firefox/releases)
[![License](https://img.shields.io/badge/license-GNU--LGPL--v3-green)](License.md)
[![Stars](https://img.shields.io/github/stars/Linkumori/Linkumori-Addon-MV3-Firefox?style=social)](https://github.com/Linkumori/Linkumori-Addon-MV3-Firefox/stargazers)

[Install from AMO](https://addons.mozilla.org/en-US/firefox/addon/linkumori-clean-urls/) • [Report Bug](https://github.com/Linkumori/Linkumori-Addon-MV3-Firefox/issues) • [Request Feature](https://github.com/Linkumori/Linkumori-Addon-MV3-Firefox/issues)

</div>

## What It Does

Linkumori strips known tracking and referral parameters from URLs.

Before:

```text
https://example.com/page?utm_source=twitter&utm_campaign=promo&fbclid=abc123
```

After:

```text
https://example.com/page
```

It includes built-in filtering rules and supports optional custom/remote rules.

## Features

- Automatic URL cleaning while browsing
- Privacy-first: processing is local by default
- Rule coverage based on ClearURLs data plus Linkumori additions
- Custom rule support
- Optional remote rule sources
- Open source and auditable

## Installation

### Firefox Add-ons (recommended)

1. Open [Linkumori on AMO](https://addons.mozilla.org/en-US/firefox/addon/linkumori-clean-urls/)
2. Click **Add to Firefox**
3. Confirm permissions

### Manual install (`.xpi`)

1. Download the latest package from [Releases](https://github.com/Linkumori/Linkumori-Addon-MV3-Firefox/releases)
2. In Firefox, go to `about:addons`
3. Open the gear menu and choose **Install Add-on From File**
4. Select the downloaded `.xpi`

## Privacy

Linkumori does not require telemetry or analytics to function.

- URL cleaning happens in the extension runtime
- Remote rules are optional and disabled unless configured
- If you enable remote rules, the configured rule host can see your IP address

See [privacy.md](./privacy.md) for details.

## Configuration

Open the extension popup/settings to control:

- Enable/disable cleaning
- Per-site allow/whitelist behavior
- Custom cleaning rules
- Optional remote rule source(s)

## Build From Source

### Requirements

- Firefox (manifest currently sets `strict_min_version` to `140.0`)
- Node.js `>=18` or Bun `>=1.2`
- `web-ext` (required for packaging/lint/sign flows)

### Setup

```bash
git clone https://github.com/Linkumori/Linkumori-Addon-MV3-Firefox.git
cd Linkumori-Addon-MV3-Firefox

# Install web-ext globally (choose one)
npm install --global web-ext
# or
bun add --global web-ext
```

### Run build tool

```bash
# interactive menu (Bun)
bun start

# interactive menu (Node)
node ./linkumori-cli-tool.js

# script alias for Node
npm run make
```

Build output is written to `web-ext-artifacts/`.

## Contributing

### Add or update URL rules

1. Edit `data/custom-rules.json`
2. Add/update rules using the existing schema
3. Test with the build tool
4. Open a pull request

### Report issues

Please include:

- Reproducible steps
- Expected behavior
- Actual behavior
- Firefox version and OS

Use [GitHub Issues](https://github.com/Linkumori/Linkumori-Addon-MV3-Firefox/issues).

## License

This project is licensed under **GNU LGPL-3.0-or-later**.

See [License.md](./License.md).

## Credits

- [ClearURLs](https://github.com/ClearURLs/Addon) for the original rule ecosystem and project foundation
- Linkumori contributors and community maintainers
