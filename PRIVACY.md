# Privacy — b4Play 0.4.1

[Português](PRIVACY.pt-BR.md) · Updated 2026-11-16

b4Play is an independent MIT-licensed extension. It has no developer backend, telemetry, analytics or advertising. Your own provider account is required; API usage can cost money.

- **Tactiq:** the requested YouTube URL goes to Tactiq in a temporary background tab. Its website processes the transcript request and its policies apply. Verification and other restrictions are not bypassed.
- **AI:** the video title and transcript (including a manually chosen .txt file) are sent over HTTPS to your selected OpenRouter or OpenAI endpoint. The API key authenticates that provider request. OpenRouter may route to its model providers. Their retention policies apply; `store:false` does not guarantee zero retention.
- **Key:** session storage by default, until the browser closes. Remember optionally stores the key unencrypted in extension-local storage. Neither option makes the key accessible through the extension's replies to content scripts. Keys are never bundled in downloads or sent to the project developer.
- **Other local data:** provider, model, language, consent and hover preference persist in extension-local storage. Jobs and at most 30 summaries remain in session storage; cached summaries are reused for at most 24 hours. Transcripts are held temporarily during processing and are not deliberately persisted by the extension.
- **Control:** hover is off by default. Read and accept the disclosure to configure the extension. Delete settings removes keys, preferences and summaries, cancels tracked work, and revokes provider access. An already submitted API request may have been processed/billed. Uninstalling also removes the extension's local data. Disabling hover pauses automatic requests; it does not erase data or disable the manual summary button.
- **Permissions:** storage, alarms for expired work, activeTab for the toolbar action, declared scripts on YouTube/Tactiq, and optional network permission for the provider you choose. No cookies/history/native messaging permission or local companion service.

Do not put sensitive information in a transcript unless you intend to share it with your chosen provider. Summaries can contain errors and do not analyze visual-only events. Tactiq may fail or not support a video/language.

Questions: [project support](https://github.com/MrSeraloc/b4Play/issues). Do not include API keys or private transcripts in public issues. [Installation](README.md) · [0.3.0 deprecation](DEPRECATED.md)
