# Validation — 0.3.0 beta

Date: 2026-11-16.

- 32 automated tests passed on Windows with Node.js 22. Tests cover URL handling, prompt boundaries, the 200-word ceiling, complete long-transcript processing, credential isolation, localized diagnostics, English/Portuguese prompts, consent gating, cache-language changes, both manifests, icon PNG structure, local authentication, origin checks and provider changes during jobs.
- The settings page was inspected in English and Brazilian Portuguese in a local mock browser preview. The summary component was inspected in both languages. No browser console errors were observed in these checks.
- `docs/images/` contains clearly labeled fictional-data demonstration captures. These are not real Opera store review screenshots.
- Browser ZIPs are built from an explicit runtime allowlist. The service archive uses an explicit source-directory allowlist, rejects runtime/environment paths and symlinks, and includes no user data.
- AI calls were simulated during automated tests. No claim is made that the beta has been tested end to end against every provider or video.
- Complete live Opera/Chrome testing, macOS/Linux browser testing, adverse-network checks, real Opera screenshots and store submission remain pending. See OPERA-READINESS.md.
