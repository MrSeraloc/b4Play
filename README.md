# b4Play 0.1.a

**English** · [Português](README.pt-BR.md)

Summarize YouTube videos by hovering over a thumbnail or clicking the b4Play toolbar icon. The service generates summaries using AI. Summaries follow the browser's display language.

## Download

- [Opera ZIP](https://github.com/MrSeraloc/b4Play/raw/refs/tags/v0.1.a/downloads/b4play-opera-0.1.0.zip)
- [Chrome ZIP](https://github.com/MrSeraloc/b4Play/raw/refs/tags/v0.1.a/downloads/b4play-chrome-0.1.0.zip)

[SHA-256](downloads/SHA256SUMS.txt) · [Privacy](PRIVACY.md) · [MIT license](LICENSE)

## Install and use

1. Extract the ZIP for your browser.
2. Open `opera://extensions` or `chrome://extensions`, enable **Developer mode**, select **Load unpacked** and choose the folder containing `manifest.json`.
3. Reload YouTube and hover over a thumbnail, or open a video and click the toolbar icon. The extension asks for permission to share the transcript on first use.

Use the gear to set **Short** (150–300 words, the default), **Medium** (300–500) or **Long** (500–750). Short transcripts may yield fewer words. If Tactiq cannot retrieve a transcript, import a `.txt` file in full settings.

To update an existing copy, extract the ZIP over the files in the extension's installation folder, click **Reload** on the browser's extensions page and reload YouTube. Check that the version shown is **0.1.a** and authorize transcript sharing once under the updated notice. The summary length you selected is preserved.

## Development and maintenance

Node.js 22+ runs `npm test` and `npm run build`. The browser code is in `extension/` and the Cloudflare Worker is in `service/`. Windows packaging uses the deployed Worker URL. [Deployment guide](DEPLOY.md)

[Support](https://github.com/MrSeraloc/b4Play/issues)
