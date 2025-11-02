# cardgallery
Postcards gallery.

## Быстрый локальный просмотр

1. Установи зависимости (нужны только для скриптов):  
   `npm install`
2. Скопируй тестовые данные:  
   - `npm run mock` — использует `mock-data/sample.json` и `mock-data/tags.sample.json`  
   - `npm run mock -- mock-data/asia.json mock-data/tags.sample.json` — свои файлы (2‑й аргумент необязателен)
3. Подними статический сервер из `public/` (например, `python -m http.server 8000 -d public`) и открой `http://localhost:8000`.

Генератор `scripts/use-mock.mjs` проверяет JSON и закидывает его в `public/gallery.json` и `public/tags.json`. Если хочешь держать собственные моки локально — создай их в `mock-data/` и вызывай `npm run mock` с путём до файла.
