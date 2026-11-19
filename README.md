# b4Play 0.4.3 — standalone

**English** · [Português](README.pt-BR.md)

YouTube transcript summaries in 150–250, 300–500 or 500–750 words, using your OpenRouter or OpenAI API key. This rebuild removes the local Node.js service, extra token and .env files. Users only need a browser.

> **0.4.3 downloads restored on 2026-11-18.** The maintainer reported that Microsoft cleared this version. A new local Defender scan found no threats in the original Opera and Chrome ZIPs. [Investigation record](DEFENDER-INVESTIGATION.md)

## Download 0.4.3 beta

| Browser | Package |
| --- | --- |
| Opera | **[Download the Opera ZIP](https://github.com/MrSeraloc/b4Play/raw/refs/tags/v0.4.3/downloads/b4play-opera-0.4.3.zip)** |
| Chrome / Chromium | **[Download the Chrome ZIP](https://github.com/MrSeraloc/b4Play/raw/refs/tags/v0.4.3/downloads/b4play-chrome-0.4.3.zip)** |

[SHA-256](downloads/SHA256SUMS.txt) · [Privacy](PRIVACY.md) · [MIT license](LICENSE) · [Support](https://github.com/MrSeraloc/b4Play/issues) · [Changelog](CHANGELOG.md)

## Three-step setup

1. Extract `downloads/b4play-opera-0.4.3.zip` or `downloads/b4play-chrome-0.4.3.zip` into a permanent folder. Choose one browser package.
2. Open `opera://extensions` or `chrome://extensions`, enable **Developer mode**, choose **Load unpacked**, and select the folder with **manifest.json**.
3. Settings open automatically. Choose your provider, enter your API key and exact Chat Completions model ID, read/accept the disclosure and **Save**. Allow access to your selected provider. No Node.js or other application is needed.

Reload YouTube, open a standard video and click b4Play → **Summarize current video**. Optionally enable thumbnail hover in settings. Hover waits 1.5 seconds and may incur API charges. A temporary Tactiq tab supplies the transcript; if it fails, import a .txt in settings.

By default the key lasts until the browser closes. Remember optionally stores it unencrypted locally. **Delete settings, key and summaries** clears extension data and revokes provider access.

### Reasoning and output limits

Under **Settings → AI generation**, select **Reasoning effort** and **Output token limit**, then save. The default increased from 1,600 to **4,096 tokens per request**, including reasoning and final answer. Choose a summary target of 150–250, 300–500 or 500–750 words; its upper limit is enforced, while short sources may produce less text. Higher limits may increase cost and latency.

For OpenRouter's `deepseek/deepseek-v4.1-flash`, start with **Low + 4,096**. On 2026-11-16 its public catalog advertised High as default and supported Low, High, Maximum and None. **Automatic preserves the model default**, rather than selecting low reasoning. **Check model options (no text generation)** reads public metadata without keys/transcripts or inference and disables unadvertised efforts.

Token exhaustion and reasoning-only responses now have specific messages instead of a generic invalid-summary error. Lower effort or increase the budget if supported; requests are not retried automatically. Truncated answers and internal reasoning are not displayed as summaries. [OpenRouter documentation](https://openrouter.ai/docs/guides/best-practices/reasoning-tokens).

### Updating from 0.4.0

Extract 0.4.3 into the same folder used by the installed extension, replacing its files. On your browser's extensions page, **Reload** b4Play, then reload YouTube. Check that the displayed version is 0.4.3. Re-enter your key if it was only stored in session storage. Enable **Summarize after hovering a thumbnail for 1.5 seconds** in settings and save to use hover; this feature starts disabled. Do not keep two active copies of the extension.

## Security and limits

- Version 0.3.0 remains deprecated. See the [investigation record](DEFENDER-INVESTIGATION.md) for past detections and the restoration of 0.4.3 downloads.
- No credentials are migrated from 0.3.0. Disable/remove the old extension to avoid duplicate work/charges. Close the old companion's window when no longer needed. The old source remains in Git history; its ZIPs and companion service have been removed from the current branch.
- Tactiq is a third-party website, not a supported API. Verification, changes, missing captions and unsupported video languages can prevent retrieval. Portuguese UI does not guarantee Portuguese transcription. Shorts are unsupported.
- AI receives title/transcript and can charge for usage. Long transcripts require additional section requests. Failed requests are not retried automatically. Summaries may contain mistakes and do not analyze visual-only content.
- Keys and jobs are restricted to trusted extension contexts. Content scripts never receive the API key. No telemetry or developer backend. See [privacy](PRIVACY.md). Offline help is bundled in the extension.
- This is a manually installed beta. Real Opera/Chrome/provider and cross-platform tests and store approval remain necessary.

## Development

Node.js 22+: `npm test`, `npm run build`. Windows packaging: `npm run package`, using the standard Windows ZIP library, an explicit file list and SHA-256. Development tools are not needed by users. Browser ZIPs contain extension files, help and MIT license with manifest at root, no nested ZIPs, installers, shell scripts or local service.

`extension/` is the whole application, `tests/` mocks providers/browser APIs without real keys or charges, and `scripts/` holds development tooling. Both browser packages are maintained in this repository. GitHub's automatic **Download ZIP** downloads the source; use the prepared browser downloads above to install.

The 23 functional tests used simulated AI and browser behavior. See [validation details](VALIDATION.md) for the ZIP scan history and checksums.
