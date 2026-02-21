# SECURITY.md

## Security Policy

Linkumori (Clean URLs) is committed to maintaining the highest security standards for our users. As a privacy-focused Firefox browser extension, security is a core principle of our project.

## Reporting a Vulnerability

We take all security vulnerabilities seriously. If you discover a security issue in Linkumori, please follow these steps:

1. **Do not disclose the vulnerability publicly** until it has been addressed by the maintainers
2. Report the issue by creating a new issue on our GitHub repository:
   - Go to: https://github.com/Linkumori/Linkumori-Addon-MV3-Firefox/issues
   - Mark the issue as "Security vulnerability" if such a label exists
   - For highly sensitive vulnerabilities, consider first opening an issue with minimal details and request a private communication channel
3. Include the following information in your report:
   - Type of vulnerability
   - Path or location of the affected code
   - Steps to reproduce
   - Potential impact
   - Suggested fix (if available)

## Security Response Timeline

When a vulnerability is reported, we aim to:

- Acknowledge receipt of the report within 48 hours
- Provide an initial assessment within 7 days
- Release a fix as soon as possible, depending on the severity and complexity

## Security Considerations

Linkumori implements several security-focused features:

### Extension Identity

- **Extension ID:** `Linkumori@2026`
- **Minimum Firefox Version:** 140.0
- **Manifest Version:** 3
- The extension is built exclusively for Firefox using `browser_specific_settings` (Gecko) and will not load in other browsers

### Content Security Policy

The extension enforces a strict Content Security Policy on all extension pages:

- `script-src 'self'` — only scripts bundled with the extension may execute; no inline scripts or remote scripts are permitted
- `object-src 'none'` — no plugins or embedded objects are allowed

### Permissions

Linkumori requests the following permissions, each with a specific purpose:

| Permission | Purpose |
|------------|---------|
| `storage`, `unlimitedStorage` | Saving user settings and rule data locally |
| `alarms` | Scheduling periodic background tasks |
| `contextMenus` | Adding right-click menu options |
| `webRequest`, `webRequestBlocking` | Intercepting and cleaning URLs before navigation |
| `webNavigation` | Detecting page navigation events for URL processing |
| `tabs` | Reading and updating tab URLs after cleaning |
| `downloads` | Handling download URL cleaning |
| `scripting`, `activeTab` | Injecting content scripts for Google and Yandex link fixing |
| `host_permissions` (`http://*/*`, `https://*/*`) | Required to intercept and clean URLs across all sites |

### Data Collection

- Declared data collection: **none** (as specified in `data_collection_permissions`)
- All URL cleaning is performed locally within the browser
- No user browsing data is stored or transmitted to external servers
- No remote configuration files are used that could introduce security risks

### Content Scripts

Content scripts are injected only on specific domains for link-fixing purposes:

- **Google domains** — `google_link_fix.js` is injected on Google search pages across all regional Google domains, running at `document_end`
- **Yandex domains** — `yandex_link_fix.js` is injected on `yandex.ru`, `yandex.com`, and `ya.ru`, running at `document_end`

All content scripts run in an isolated world and cannot access page JavaScript variables.

### Background Scripts

The extension uses a persistent background context (not a service worker) as supported by Firefox MV3. Background scripts handle URL cleaning, storage, context menus, history listening, eTag filtering, and watchdog processes entirely within the local browser environment.

## Code Security

### Review Process

All code contributions undergo review for:

1. Potential security vulnerabilities
2. Privacy implications
3. Proper implementation of Firefox extension security features
4. Adherence to best practices for Firefox extension development

### Third-Party Code

Linkumori incorporates code from various sources, each subject to different licenses:

- All third-party libraries are reviewed for vulnerabilities before inclusion
- Attribution is provided for all third-party code (see the License section in README.md)
- When possible, specific versions of dependencies are pinned to prevent automatic updates that might introduce vulnerabilities

## Update Policy

- Security updates are released promptly after vulnerability discovery
- Users are encouraged to keep the extension updated to the latest version
- Major security changes are documented in release notes

## Verification

Users can verify the integrity of the extension by:

1. Reviewing the source code on GitHub before installation
2. Comparing the installed version with the Firefox Addon version
3. Checking the extension's permissions in Firefox's Add-ons Manager (`about:addons`)
4. Verifying the extension ID matches `Linkumori@2026` in the add-on details

## Contact

For security-related inquiries or to report vulnerabilities:
- GitHub: Open an issue on our GitHub repository: https://github.com/Linkumori/Linkumori-Addon-MV3-Firefox/issues

---

This security policy was last updated on February 22, 2026.
