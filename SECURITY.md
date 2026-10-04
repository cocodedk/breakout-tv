# Security Policy

## Reporting a Vulnerability

Do **not** open a public GitHub issue for security vulnerabilities.

To report a vulnerability:
- Use the **"Report a vulnerability"** button on the Security tab of this repository (GitHub private advisory)
- Or email: babak@cocode.dk

We will acknowledge within 5 business days and aim to release a fix within 30 days of confirmation.

## Scope

Breakout runs entirely on the TV and uses no network. Reports about the app itself, the build and
release workflows, or a certificate, password or device ID committed by mistake are all welcome.
The release zip is unsigned on purpose, and every release carries a build provenance attestation
(`gh attestation verify breakout-tv-app.zip --repo cocodedk/breakout-tv`).

## Supported Versions

| Version | Supported |
|---------|-----------|
| latest  | yes |
| older   | no |
