# Privacy for b4Play 0.1.a

[Português](PRIVACY.pt-BR.md)

- **Tactiq** receives the YouTube URL in a temporary tab to retrieve the transcript.
- **b4Play** sends the title, transcript, browser language and summary preferences over HTTPS to the Cloudflare Worker. The Worker uses the connecting IP to rate-limit requests. The application does not log the title or transcript or store them after handling the request.
- **OpenRouter and the AI provider** receive the title and transcript, including manually imported text. OpenRouter routes requests to a provider. Send only content you may share that contains no personal or confidential data. [Model and providers](https://openrouter.ai/privacy)
- **Browser storage** holds settings and consent. Up to 30 summaries are kept in the browser session and can be reused for up to 24 hours. Clear settings to remove this data and revoke the optional permission for the summary service. The API key stays in the Cloudflare Worker's secret.
