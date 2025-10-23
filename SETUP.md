# ??? Настройка локального окружения Creatix

## Быстрый старт

### Что нужно установить:
1. Node.js 20+ 
2. PostgreSQL 16
3. Git
4. VS Code (опционально)

## Пошаговая инструкция

### 1. Установка PostgreSQL

**Скачать:**
https://sbp.enterprisedb.com/getfile.jsp?fileid=1259079

**При установке:**
- Пароль для postgres: 
- Порт: 
- Остальное по умолчанию

**Проверка:**


### 2. Создание локальной базы данных



### 3. Установка зависимостей


> creatix@1.0.0 postinstall
> prisma generate

Prisma schema loaded from prisma\schema.prisma

? Generated Prisma Client (v6.17.1) to .\node_modules\@prisma\client in 282ms

Start by importing your Prisma Client (See: https://pris.ly/d/importing-client)

Tip: Interested in query caching in just a few lines of code? Try Accelerate today! https://pris.ly/tip-3-accelerate


up to date, audited 659 packages in 7s

178 packages are looking for funding
  run `npm fund` for details

4 vulnerabilities (3 low, 1 high)

To address all issues possible (including breaking changes), run:
  npm audit fix --force

Some issues need review, and may require choosing
a different dependency.

Run `npm audit` for details.

### 4. Проверка .env.local

Файл уже создан! Проверьте что DATABASE_URL указывает на localhost:


### 5. Запуск приложения


> creatix@1.0.0 dev
> next dev -p 3000

   ^ Next.js 15.5.4
   - Local:        http://localhost:3000
   - Network:      http://172.19.0.1:3000
   - Environments: .env.local, .env

 ? Starting...
 ? Ready in 4.3s
[?25h

Откройте: http://localhost:3000

## Готово! ??

Теперь вы можете:
- Разрабатывать локально (npm run dev)
- Смотреть БД в VS Code (расширение PostgreSQL)
- Деплоить на продакшен одной командой

## Проблемы?

См. .ai/context.md раздел "Известные проблемы"
