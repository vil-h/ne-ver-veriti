#!/bin/zsh
# Local launch of the already-built game; no npm installation is required.
cd "$(dirname "$0")" || exit 1
if [ ! -f dist/index.html ]; then
  echo 'Сначала создайте сборку: npm install && npm run build'
  read '?Нажмите Enter для выхода…'
  exit 1
fi
if ! command -v python3 >/dev/null 2>&1; then
  echo 'Не найден Python 3. Используйте Node.js: npm install && npm run dev'
  read '?Нажмите Enter для выхода…'
  exit 1
fi
local_port=4175
( sleep 1; open "http://127.0.0.1:$local_port" ) &
echo "Игра: http://127.0.0.1:$local_port"
echo 'Не закрывайте это окно во время игры. Для остановки нажмите Ctrl+C.'
python3 -m http.server "$local_port" --bind 127.0.0.1 --directory dist
