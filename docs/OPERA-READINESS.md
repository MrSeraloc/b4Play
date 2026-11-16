# Opera publication readiness / Alinhamento com o Opera

Version 0.3.0 beta. This is an implementation review, not an approval from Opera.

| Area | b4Play implementation | Status |
| --- | --- | --- |
| Single purpose | Transcript summaries on YouTube; toolbar button summarizes the active video | Implemented |
| Name and affiliation | b4Play; no browser vendor in the title or vendor graphics | Implemented |
| Background behavior | Tactiq tab, local service, AI requests and costs described in both READMEs and the listing | Implemented |
| User control | Hover off initially; explicit processing consent; pause and clear-cache controls | Implemented |
| Packaged code | Local readable JavaScript, no remote scripts, no eval, no injected ads | Implemented |
| Permissions | storage for preferences/cache; alarms for cleanup; activeTab for the user-invoked toolbar summary; localhost for the service | Implemented |
| Assets | Original matching PNG icons; transparent corners, antialiasing, no interlacing | Implemented |
| Package | Browser-only ZIP, manifest at root; source, tests and service excluded | Implemented |
| Licensing | MIT plus explicit end-user license in the package | Prepared |
| Metadata | English and Portuguese summaries/descriptions; Productivity category; support and privacy URLs | Prepared |
| Functionality | Automated tests with mocked AI; real Tactiq can fail | Further real-provider testing required |
| Platforms | Service is portable Node.js; full Opera tests on Windows, macOS and Linux have not been completed | Pending |
| Screenshots | Real Opera captures showing interaction and toolbar, 612×408 preferred, no unrelated tabs/extensions | Pending real-browser captures |
| Submission | Account, reviewer access/setup, uploads and review | Not submitted |

This applies the [acceptance criteria](https://help.opera.com/en/extensions/acceptance-criteria/) and [publishing guidelines](https://help.opera.com/en/extensions/publishing-guidelines/). The final distribution must behave as advertised; the companion-service and API-key requirements are prominent.

## Antes de enviar / Before submitting

Run a real transcript-to-summary test with a correctly configured provider in each supported OS; test slow connections, timeouts, import, both UI languages, and consent withdrawal. Provide a working reviewer setup through the store's private review process. Capture the actual extension running in Opera, including its toolbar entry. Demo screenshots are useful for development but do not replace this evidence.

Local credentials are plaintext in this beta and disclosed in the privacy policy. Review the target store's credential/data-storage requirements before submission. No claim of compliance or approval is made for an untested configuration.
