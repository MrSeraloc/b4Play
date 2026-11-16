# Publishing b4Play / Publicar o b4Play

## GitHub downloads

One repository contains shared source plus two browser packages. Run `npm run package` and commit the three versioned ZIPs in `downloads/` and SHA256SUMS.txt. Both READMEs link to these files through GitHub's raw download route. Do not commit `.env`, `data/`, tokens, transcripts or personal settings.

GitHub Releases are an optional alternative: create a release for the version, mark the current beta as a prerelease, and attach the same ZIPs and checksum file. Keep the browser editions under one release. The [GitHub release guide](https://docs.github.com/en/repositories/releasing-projects-on-github/managing-releases-in-a-repository) describes the process.

## Opera Add-ons

Complete the pending items in [OPERA-READINESS.md](OPERA-READINESS.md). Submit **only** `b4play-opera-0.3.0.zip` through the [Opera developer portal](https://addons.opera.com/developer/). Use the prepared English/Portuguese descriptions, MIT license and EULA, privacy/support links, real Opera screenshots, and clear reviewer instructions for the local service and API access. Follow the [official publishing guide](https://help.opera.com/en/extensions/publishing-guidelines/). Store moderation decides acceptance.

## Chrome Web Store

Register and configure the developer account, then upload **only** `b4play-chrome-0.3.0.zip` in the developer dashboard. Complete listing, privacy, distribution and test instructions, including the companion service and external data processing. Review the [Chrome publication process](https://developer.chrome.com/docs/webstore/publish) and [user-data requirements](https://developer.chrome.com/docs/webstore/program-policies/user-data-faq). This beta stores local API credentials as plaintext; assess and address store storage requirements before submitting.

## Release checks / Verificações

- Increase the version in package.json and extension/manifest.json together.
- Run build, tests, and package; verify both manifests and archive contents.
- Test real providers and Tactiq manually without placing credentials in repository files.
- Update download links in both READMEs when changing filenames.
- Keep the two browser ZIPs separate from the companion service ZIP.
- Describe limitations and pending platform tests accurately; do not label a demo as a real store review capture.

Publishing source or a downloadable beta does not mean the extension is approved by a store.
