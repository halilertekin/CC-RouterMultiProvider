# Changelog

## 2.4.4 (2026-02-15)
- **SECURITY**: Fix all reported vulnerabilities (undici, qs, semver)
- **UPDATE**: Bump dependencies:
  - undici 6.21.1 → 7.22.0 (fixes moderate vulnerability)
  - inquirer 8.2.6 → 9.3.8
  - eventsource-parser 1.1.1 → 3.0.6
  - express 4.18.2 → 4.21.2
  - fs-extra 11.1.1 → 11.3.0
- **NEW**: Add Claude Code Optimization Guide with token savings tips
- **NEW**: CLAUDE_OPTIMIZED.md for efficient token usage (90% reduction)
- **NEW**: pnpm-lock.yaml for Dependabot security analysis
- **DOCS**: Add security best practices and model selection guide
- **FIX**: Remove GitHub registry from publishConfig (use npmjs.org)

## 2.4.3
- **FIX**: glmapi now uses correct endpoint (`api/paas/v4`) for API Credits
- **NEW**: Added `glm5` alias for GLM-5 via Coding Plan
- **UPDATE**: `glm` now uses GLM-4.7 (default for Pro) instead of GLM-5
- **DOCS**: Updated all documentation to reflect correct endpoints:
  - `glm` → GLM-4.7, Coding Plan (Pro)
  - `glm5` → GLM-5, Coding Plan (Max)
  - `glmapi` → GLM-5, API Credits (pay-per-use)

## 2.4.0
- **NEW**: MiniMax support with `minimax` / `mm` aliases (M2.5 model)
- **NEW**: GLM-5 support with two endpoints:
  - `glm` → Coding Plan endpoint (3x usage)
  - `glmapi` → API Credits endpoint (pay-per-use)
- **NEW**: Complete documentation overhaul (TR/EN)
- **NEW**: GitHub Actions workflow for automated release
- **IMPROVED**: ccc.zsh now supports multiple providers with easy aliases
- **IMPROVED**: README.md with all provider details

## 2.3.0
- GLM-5 integration via z.ai

## 2.2.0
- GLM-5 support with Coding Plan and API Credit endpoints
- **NEW**: UI now supports 3 languages - Turkish (TR), Dutch (NL), and English (EN)
- **NEW**: Comprehensive provider setup guide added with multi-provider routing documentation
- **NEW**: Inter-provider routing with automatic fallback support
- **IMPROVED**: Default routing strategy now prioritizes GLM (z.ai) for cost optimization
- **IMPROVED**: Smart intent router updated with GLM-first approach for all intents
- **DOCS**: Added `docs/PROVIDER_SETUP.md` with detailed multi-language instructions

## 2.0.9
- GLM print mode disables attachments to avoid EMFILE (too many open files) watcher errors.

## 2.0.8
- GLM setup now installs direct z.ai `glm` wrapper by default and keeps `glm-ccr` for router usage.
- Safer `.env` loading in `ccc` (ignores comments/invalid lines) and updated setup docs.

## 2.0.7
- Security: qs arrayLimit bypass fix (force qs 6.14.1).

## 2.0.6
- UI sürüm etiketi artık paket versiyonunu gösteriyor.
- Dashboard dil dosyalarındaki hatalı virgüller düzeltildi (dil seçimi ve sağlayıcı listesi geri geldi).
- `ccr activate` artık yapılandırılan env dosyasını (`CCR_ENV_PATH`) export ediyor.
- GLM wrapper: z.ai için doğru auth/timeout/model eşlemeleri ve python3 fallback.

## 2.0.5
- UI üzerinden `.env` anahtarları ekleme/güncelleme eklendi.
- API tarafına `GET/POST /api/env` eklendi.

## 2.0.3
- API anahtarları için `~/.env` otomatik yükleme eklendi (CLI + health monitor).
- Sağlayıcı API key çözümleme tek noktaya alındı.

## 2.0.2
- UI sadeleştirildi, responsive hale getirildi ve Türkçe/Hollandaca desteği eklendi.

## 2.0.1
- Include router files in the published npm package.

## 2.0.0
- Unified router service built into this package (no external router dependency).
- Native CLI lifecycle commands (start/stop/restart/status/code/ui).
- Streaming translation between Anthropic and OpenAI-style endpoints.
- Dashboard now served by the router at `/ui`.
- Default config uses `smart-intent-router.js` and adds HOST/PORT.
