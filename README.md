# cardgallery
Postcards gallery.

## Быстрый локальный просмотр

1. Установи зависимости (нужны только для скриптов):  
   `npm install`
2. Скопируй тестовые данные:  
   - `npm run mock` — использует `mock-data/sample.json` и `mock-data/tags.sample.json`  
   - `npm run mock -- mock-data/asia.json mock-data/tags.sample.json` — свои файлы (2‑й аргумент необязателен)
3. Запусти Astro в режиме разработки:  
   `npm run dev`

Генератор `scripts/use-mock.mjs` проверяет JSON и закидывает его в `src/data/gallery.json` и `src/data/tags.json`. Если хочешь держать собственные моки локально — создай их в `mock-data/` и вызывай `npm run mock` с путём до файла.

Для обновления данных из Cloudinary используй `npm run fetch` (нужны `CLOUDINARY_*` переменные окружения).

## Деплой на GitHub Pages (ветка gh-pages)

- Источник Pages: Settings → Pages → Build and deployment → Deploy from a branch → `gh-pages` / `/ (root)`.
- Запуск деплоя вручную: вкладка Actions → workflow "Build and Deploy to gh-pages (Astro)" → Run workflow.
- Автодеплоя на push нет: workflow запускается только вручную (`workflow_dispatch`).
- Если используешь обновление данных из Cloudinary, добавь в Secrets репозитория `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET` — они будут использованы шагом `npm run fetch` во время сборки.
