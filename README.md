# GrowthKit

Ваш стратег и двигатель роста в Telegram. Единый командный центр: глубокая аналитика канала, AI-генерация контента, поиск партнёров и умные уведомления.

## Стек

- **Backend:** Python (FastAPI), PostgreSQL, Redis
- **Frontend:** Next.js 14, TypeScript, Tailwind CSS, Apache ECharts
- **Telegram:** бот (Node.js), Mini App (веб)
- **AI:** OpenAI API (генерация постов)
- **Инфраструктура:** Docker, docker-compose

## Требования

- Node.js 20+, Python 3.11+, Docker
- Переменные: `TELEGRAM_BOT_TOKEN`, `OPENAI_API_KEY` (опционально для AI), `SECRET_KEY` (бэкенд)

## Запуск

1. Клонировать репозиторий и перейти в каталог проекта.

2. Backend:
   ```
   cd backend
   python -m venv .venv
   .venv\Scripts\activate   (Windows) или source .venv/bin/activate (Linux/macOS)
   pip install -r requirements.txt
   cp .env.example .env   (при наличии) и задать DATABASE_URL, SECRET_KEY, TELEGRAM_BOT_TOKEN
   uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
   ```

3. База и кэш (через Docker):
   ```
   docker-compose up -d postgres redis
   ```

4. Frontend:
   ```
   cd frontend
   npm install
   npm run dev
   ```
   В `.env.local` задать `NEXT_PUBLIC_API_URL=http://localhost:8000` при необходимости.

5. Всё разом (backend + frontend + bot + postgres + redis):
   ```
   docker-compose up --build
   ```
   API: http://localhost:8000, веб: http://localhost:3000. Для бота нужен `TELEGRAM_BOT_TOKEN` в окружении.

## MVP (Квартал 1)

- Регистрация по Telegram (виджет / Mini App initData).
- Дашборд с базовой аналитикой своего канала (рост, подписчики; ER — заглушка).
- Ручной поиск каналов (по своим подключённым).
- AI-генератор постов (5 генераций в неделю на тарифе «Создатель»).

## Тарифы (из ТЗ)

| Тариф        | Цена    | Каналы | AI генерации/нед | Остальное              |
|-------------|---------|--------|-------------------|-------------------------|
| Создатель   | 0 ₽     | 1      | 5                 | Базовая аналитика      |
| Стратег     | 890 ₽/мес | 3    | 100               | Полная аналитика, пиар  |
| Агентство   | 3 900 ₽/мес | 10  | без лимита        | Переговорный бот, API   |

## Структура репозитория

- `backend/` — FastAPI: auth, analytics, content, channels API
- `frontend/` — Next.js: лендинг, вход, дашборд, аналитика канала, генератор постов
- `telegram-bot/` — бот для входа и открытия Mini App
- `docker-compose.yml` — сборка и запуск всех сервисов

Дальнейшие этапы: глубокая аналитика (HeatMap, психографика), конкурентная разведка, нейрокомментинг, AI Скаут, переговорный бот — по roadmap из ТЗ.
