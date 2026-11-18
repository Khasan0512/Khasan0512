# БлескАвто CRM

Учебный боевой проект CRM-системы для детейлинг-студии на 3 рабочих бокса.

## Стек
- **Next.js 15** (App Router, TypeScript)
- **Tailwind CSS**
- **Prisma ORM** (SQLite локально / PostgreSQL в продакшене)
- **Vitest** (тестирование бизнес-правил)

## Быстрый старт

```bash
cp .env.example .env
npm install
npm run db:push
npm run db:seed
npm run dev
```

Проверка тестов и сборки:

```bash
npm test
npm run build
```
