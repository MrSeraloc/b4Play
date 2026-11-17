# b4Play 0.4.2 — standalone

**English** · [Português](README.pt-BR.md)

YouTube transcript summaries in up to 200 words, using your OpenRouter or OpenAI API key. This rebuild removes the local Node.js service, extra token and .env files. Users only need a browser.

> **0.3.0 is deprecated and unsupported.** Defender flagged its files. Do not install or redistribute its packages. Version 0.4.2 replaces it as the current beta. See [migration and deprecation details](DEPRECATED.md).

## Download 0.4.2 beta

> **Detection under investigation:** Defender also flagged 0.4.1, including in a repeated local scan. Version 0.4.2 improves popup security and accessibility and passed its initial local scan, but Microsoft has not confirmed a false positive and future alerts are possible. Keep flagged files blocked. Read [the investigation record](DEFENDER-INVESTIGATION.md).

| Browser | Prepared package |
| --- | --- |
| Opera | **[Click here to download the Opera ZIP](https://github.com/MrSeraloc/b4Play/raw/refs/heads/main/downloads/b4play-opera-0.4.2.zip)** |
| Chrome / Chromium | **[Click here to download the Chrome ZIP](https://github.com/MrSeraloc/b4Play/raw/refs/heads/main/downloads/b4play-chrome-0.4.2.zip)** |

Only one download is needed. [SHA-256](downloads/SHA256SUMS.txt) · [Privacy](PRIVACY.md) · [MIT license](LICENSE) · [Support](https://github.com/MrSeraloc/b4Play/issues) · [Changelog](CHANGELOG.md)

## Three-step setup

1. Extract `downloads/b4play-opera-0.4.2.zip` or `downloads/b4play-chrome-0.4.2.zip` into a permanent folder. Choose one browser package.
2. Open `opera://extensions` or `chrome://extensions`, enable **Developer mode**, choose **Load unpacked**, and select the folder with **manifest.json**.
3. Settings open automatically. Choose your provider, enter your API key and exact Chat Completions model ID, read/accept the disclosure and **Save**. Allow access to your selected provider. No Node.js or other application is needed.

Reload YouTube, open a standard video and click b4Play → **Summarize current video**. Optionally enable thumbnail hover in settings. Hover waits 1.5 seconds and may incur API charges. A temporary Tactiq tab supplies the transcript; if it fails, import a .txt in settings.

By default the key lasts until the browser closes. Remember optionally stores it unencrypted locally. **Delete settings, key and summaries** clears extension data and revokes provider access.

### Updating from 0.4.0

Extract 0.4.2 into the same folder used by the installed extension, replacing its files. On your browser's extensions page, **Reload** b4Play, then reload YouTube. Check that the displayed version is 0.4.2. Re-enter your key if it was only stored in session storage. Enable **Summarize after hovering a thumbnail for 1.5 seconds** in settings and save to use hover; this feature starts disabled. Do not keep two active copies of the extension.

## Security and limits

- Defender flagged 0.3.0 and 0.4.1. The 0.4.2 popup revision is not an antivirus certification. Keep blocked files blocked. No Defender exclusions or protection changes are used.
- No credentials are migrated from 0.3.0. Disable/remove the old extension to avoid duplicate work/charges. Close the old companion's window when no longer needed. The old source remains in Git history; its ZIPs and companion service have been removed from the current branch.
- Tactiq is a third-party website, not a supported API. Verification, changes, missing captions and unsupported video languages can prevent retrieval. Portuguese UI does not guarantee Portuguese transcription. Shorts are unsupported.
- AI receives title/transcript and can charge for usage. Long transcripts require additional section requests. Failed requests are not retried automatically. Summaries may contain mistakes and do not analyze visual-only content.
- Keys and jobs are restricted to trusted extension contexts. Content scripts never receive the API key. No telemetry or developer backend. See [privacy](PRIVACY.md). Offline help is bundled in the extension.
- This is a manually installed beta. Real Opera/Chrome/provider and cross-platform tests and store approval remain necessary.

## Development

Node.js 22+: `npm test`, `npm run build`. Windows packaging: `npm run package`, using the standard Windows ZIP library, an explicit file list and SHA-256. Development tools are not needed by users. Browser ZIPs contain extension files, help and MIT license with manifest at root, no nested ZIPs, installers, shell scripts or local service.

`extension/` is the whole application, `tests/` mocks providers/browser APIs without real keys or charges, and `scripts/` holds development tooling. Both browser packages are maintained in this repository. GitHub's automatic **Download ZIP** downloads the source; use the prepared browser downloads above to install.

The initial local Defender scan of the new HTML and 0.4.2 packages reported **no threats found**. The 17 automated tests passed with mocked AI/extension messages. Since 0.4.1 initially passed and was later detected, this does not resolve the investigation or guarantee the download. Read [validation details and remaining checks](VALIDATION.md).
