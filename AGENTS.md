# AGENTS.md

## Cursor Cloud specific instructions

### Overview

This is **Acne Oracle**, a Flutter mobile/web app for AI-powered acne tracking. It is a purely client-side Flutter app — there is no local backend server. All backend services (auth, database, storage) are cloud-hosted via Supabase, and AI features use external APIs (Grok / OpenAI).

### Prerequisites

- **Flutter SDK 3.24+** installed at `/opt/flutter_sdk/flutter/bin` (add to `PATH`)
- **Chrome** is available for Flutter web development

### Key commands

All commands run from `/workspace/acne_oracle`:

| Task | Command |
|------|---------|
| Install deps | `flutter pub get` |
| Lint / analyze | `flutter analyze` |
| Run tests | `flutter test` |
| Build web | `flutter build web` |
| Run dev server (web) | `flutter run -d web-server --web-port=8080 --web-hostname=0.0.0.0` |

### Secrets

The file `lib/core/constants/secrets.dart` (gitignored) must exist. Copy from `secrets.dart.example` if missing:

```
cp lib/core/constants/secrets.dart.example lib/core/constants/secrets.dart
```

Without real Supabase/API credentials the app builds and renders the UI, but login and data features will not work.

### Gotchas

- The project has **no local backend** — Supabase is fully cloud-hosted. Do not look for docker-compose or local DB setup.
- `flutter analyze` returns only info-level lint suggestions (no errors). Exit code 1 is expected due to informational hints; this does not indicate a broken build.
- The web platform is added via `flutter create --platforms=web .` if the `web/` directory is missing.
- Asset directories (`assets/images/`, `assets/icons/`, `assets/lottie/`, `assets/fonts/`) contain placeholder files and must exist for the build to succeed.
- RevenueCat monetization code is commented out in `main.dart`; no RevenueCat configuration is needed.
- **Secrets must be populated with real values** from environment variables `SUPABASE_URL`, `SUPABASE_ANON_KEY`, and `GROK_API_KEY`. The update script copies the example file but does not inject real values. To write real secrets, replace the placeholder values in `secrets.dart` with the env var values.
- **Supabase free-tier email rate limit** is very strict (~3–4 emails/hour). Registration attempts from automated testing can exhaust it quickly. Space out signup attempts or use a Supabase project with higher rate limits.
- **Supabase `mailer_autoconfirm` is `false`** by default, meaning new accounts require email confirmation. For end-to-end testing, either enable autoconfirm in the Supabase dashboard or provide a pre-confirmed test account.
- After updating `secrets.dart`, you must run `flutter clean && flutter pub get` and restart the dev server for the new credentials to take effect. Hot restart alone does not recompile constants baked into the web build.
