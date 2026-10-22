# Откат дизайна «Тёплое городское бистро»

Версия до редизайна сохранена целиком, включая фотографии блюд и напитков:

- Ветка: `backup/rosalia-before-bistro-2026-10-22`.
- Коммит: `23fbb80741aefdf17c57326b846bdbb3eb9c5fa3`.
- Разработка: `design/warm-city-bistro`.
- Применение к main: merge-коммит с меткой `bistro-redesign-2026-10-22`.

## Вернуть прежний сайт

В PowerShell откройте каталог проекта. Рабочая копия должна быть чистой; свои последующие изменения сначала сохраните коммитом.

```powershell
cd C:\Users\Admin\Documents\GitHub\websites\restaurant-site-demo
git -c safe.directory=C:/Users/Admin/Documents/GitHub/websites/restaurant-site-demo switch main
git -c safe.directory=C:/Users/Admin/Documents/GitHub/websites/restaurant-site-demo revert --no-edit -m 1 bistro-redesign-2026-10-22
```

Revert создаёт новый коммит, возвращающий палитру, шапку, баннеры, карточки, контент и конфигурацию админки к состоянию до редизайна. История и новая версия остаются доступны. Обратный патч проверен в отдельном Git-индексе: полученное дерево совпадает с исходным коммитом.

Для отправки отката в приватный репозиторий:

```powershell
git -c safe.directory=C:/Users/Admin/Documents/GitHub/websites/restaurant-site-demo -c http.sslBackend=openssl push origin main
```

Если после редизайна редактировались те же строки, Git может попросить разрешить конфликт. Отменить незавершённую попытку можно командой `git revert --abort`, сохранив предыдущее состояние.

## Только посмотреть исходную версию

```powershell
git -c safe.directory=C:/Users/Admin/Documents/GitHub/websites/restaurant-site-demo switch backup/rosalia-before-bistro-2026-10-22
```

Вернуться к текущей версии:

```powershell
git -c safe.directory=C:/Users/Admin/Documents/GitHub/websites/restaurant-site-demo switch main
```

Переключение выбирает сохранённую версию в рабочем каталоге. GitHub Pages остаётся выключенным; публикация выполняется только после «публикуем».
