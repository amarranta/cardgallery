# cardgallery
postcards gallery

## Local quick preview

1. Populate `public/gallery.json` with mock data:
   - `npm install`
   - `npm run mock` (copies `mock-data/sample.json` → `public/gallery.json`)
   - или `npm run mock -- mock-data/another.json` для другого файла.
2. Открой `public/index.html` в браузере (двойной клик) или через локальный сервер (`npx serve public`).
3. Обновляй JSON → перезагружай страницу.

Создавай свои наборы данных в `mock-data/`, потом быстро переключайся между ними теми же командами.
