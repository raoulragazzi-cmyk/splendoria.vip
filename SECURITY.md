# Security policy — Splendoria

## Production data

Production D1, customer accounts, manuscripts, interviews, PDFs and private project content are sensitive data. They must not be copied into issues, pull requests, test fixtures or staging by default.

## Secrets

Never commit API keys, tokens, passwords, Cloudflare credentials, email credentials or `.dev.vars` / `.env` values. Only environment variable names may be documented.

## Authentication and sessions

Changes to login, password reset, email verification, admin access, sessions or authorization are high-risk changes. They require targeted tests, staging validation and a rollback plan.

## Database changes

Schema changes must be versioned as migrations. Production D1 changes require a recent backup for high-risk migrations and must be validated on an isolated non-production database first.

## AI / Muse

User-provided source material and generated manuscript content must remain isolated by account/project. Test data must be synthetic unless a specific production incident requires controlled analysis.

## Reporting a security problem

Open a private security channel or contact the repository owner directly. Do not publish secrets, personal data or exploitable production details in a public GitHub issue.
