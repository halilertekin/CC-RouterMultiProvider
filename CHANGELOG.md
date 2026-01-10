# Changelog

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
