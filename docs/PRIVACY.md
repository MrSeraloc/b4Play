# b4Play privacy policy

[Português](PRIVACY.pt-BR.md) · Last updated: November 16, 2026 · Maintainer: MrSeraloc

b4Play summarizes video transcripts. It has no developer-operated collection endpoint, analytics, advertising, or sale of data.

When you agree to processing and request a summary, the video URL is sent to the Tactiq result page. A background tab opens and is closed after completion or timeout. Tactiq and its embedded services handle that visit according to their own policies. The title and transcript are sent through a service running on your computer to the AI provider you select: OpenAI or OpenRouter. OpenRouter may route the request to the model's hosting provider. The AI request uses `store: false`; this setting does not replace any third party's retention policy.

The toolbar action reads the active tab URL and title only when used, to determine whether it is a supported YouTube video. It does not read general browsing history. Thumbnail hover handling applies only to YouTube pages. The extension does not collect account logins, cookies, contacts, payment details, or unrelated page content.

Provider keys stay in the local service configuration (`data/ai-config.json` or `.env`) and are sent to the corresponding provider for authentication. They are never returned by configuration endpoints. **The current beta stores these local files as plaintext.** The extension saves its local connection token, preferences, consent, and up to 200 summaries in browser-local storage. Cached summaries expire after seven days and are pruned during use or the periodic cleanup. Submitted transcript files are saved in `data/transcripts/` until you delete them.

You can disable hover, withdraw consent, and clear cached summaries in settings. Withdrawing consent prevents new summary requests; a provider request already sent may still finish. To remove service data, stop the service and remove its `data/` folder and any `.env` file. Removing the extension removes its browser storage. Removing these files does not remove data retained by third parties under their own policies.

The local service listens only on `127.0.0.1` and requires a local token for processing and configuration. External provider requests use HTTPS. No API key, token, transcript, or runtime configuration is shipped in public downloads.

For support, use [GitHub Issues](https://github.com/MrSeraloc/b4Play/issues). Public issue contents are public; describe errors without including credentials or private transcripts.
