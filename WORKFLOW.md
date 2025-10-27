# ?? Workflow разработки Creatix

## Ежедневная разработка

### 1. Запуск локально

> creatix@1.0.0 dev
> next dev -p 3000

[?25h
Приложение на http://localhost:3000

### 2. Внесение изменений
- Редактируйте код
- Изменения применяются автоматически (hot reload)
- Тестируйте локально

### 3. Коммит изменений
[main b4312ac] Описание изменений
 11 files changed, 1994 insertions(+), 116 deletions(-)
 create mode 100644 .ai/context.md
 create mode 100644 .env.production.server
 create mode 100644 .vscode/settings.json
 create mode 100644 app/api/payments/test-retailers/route.ts
 create mode 100644 check-payment-status.js
 create mode 100644 check-transactions.js
 create mode 100644 creatix_db_backup.sql
 create mode 100644 creatix_local_backup.sql
 create mode 100644 verify-admin-password.js

### 4. Деплой на продакшен


Или вручную:
Welcome to Ubuntu 24.04.3 LTS (GNU/Linux 6.8.0-85-generic x86_64)

 * Documentation:  https://help.ubuntu.com
 * Management:     https://landscape.canonical.com
 * Support:        https://ubuntu.com/pro

 System information as of Wed Oct 22 09:37:52 PM MSK 2025

  System load:  0.16               Processes:             138
  Usage of /:   22.1% of 49.12GB   Users logged in:       0
  Memory usage: 25%                IPv4 address for eth0: 45.129.128.121
  Swap usage:   0%

  => There is 1 zombie process.


Expanded Security Maintenance for Applications is not enabled.

2 updates can be applied immediately.
To see these additional updates run: apt list --upgradable

Enable ESM Apps to receive additional future security updates.
See https://ubuntu.com/esm or run: sudo pro status


Already up to date.

## Работа с базой данных

### Обновить локальную БД с продакшена


### Создать миграцию
Prisma schema loaded from prisma\schema.prisma
Datasource "db": PostgreSQL database "creatix_db", schema "public" at "localhost:5432"

### Применить миграции на продакшене
На сервере после деплоя миграции применяются автоматически через docker-entrypoint.sh

### Просмотр данных
- VS Code: расширение PostgreSQL
- Или: Prisma schema loaded from prisma\schema.prisma
Prisma Studio is up on http://localhost:5555
Prisma schema loaded from prisma\schema.prisma

## Проверка на продакшене

### Посмотреть логи

No migration found in prisma/migrations


No pending migrations to apply.
? Database setup complete!
?? Starting Next.js application...
   ^ Next.js 15.5.4
   - Local:        http://localhost:3000
   - Network:      http://0.0.0.0:3000

 ? Starting...
 ? Ready in 231ms
?? [FREE] Mode check: used=0/10, available=10
?? [FREE] Mode check: used=0/10, available=10
?? [FREE] Mode check: used=0/10, available=10
?? [FREE] Mode check: used=0/10, available=10
? Mode switched: FREE > FREE for user ivanovvier@gmail.com [FREE]
?? Token updated for user c9e03b9a-090f-4784-8875-a685af8399eb: appMode=FREE, trialGenerations=0, trialEndsAt=null
?? [FREE] Mode check: used=0/10, available=10
?? [FREE] Mode check: used=0/10, available=10
?? [FREE] Mode check: used=0/10, available=10
?? Creating subscription payment for ADVANCED: 10?
? Tochka Bank OAuth credentials configured
?? Creating Tochka payment: {
  amount: '10',
  purpose: 'Подписка Creatix ADVANCED',
  paymentMode: [ 'card', 'sbp' ],
  ttl: 60
}
?? Token invalid or expired, getting new OAuth token...
? Payment link created: https://merch.tochka.com/order/?uuid=f7206e33-889e-43b4-8b3d-96f9bd013888
   Operation ID: f7206e33-889e-43b4-8b3d-96f9bd013888
   Status: CREATED
? Payment link created: {
  operationId: 'f7206e33-889e-43b4-8b3d-96f9bd013888',
  amount: 10,
  type: 'subscription'
}
?? Looking for latest pending transaction for user: useneurox@gmail.com
?? No pending transaction found
?? Looking for latest pending transaction for user: useneurox@gmail.com
?? No pending transaction found
?? [FREE] Mode check: used=0/10, available=10
?? [FREE] Mode check: used=0/10, available=10
?? [FREE] Mode check: used=0/10, available=10
?? [FREE] Mode check: used=0/10, available=10
? Mode switched: FREE > FREE for user ivanovvier@gmail.com [FREE]
?? Token updated for user c9e03b9a-090f-4784-8875-a685af8399eb: appMode=FREE, trialGenerations=0, trialEndsAt=null
?? [FREE] Mode check: used=0/10, available=10
?? [FREE] Mode check: used=0/10, available=10
?? [FREE] Mode check: used=0/10, available=10
?? Sign in attempt: {
  provider: 'google',
  email: 'frctlai@gmail.com',
  name: 'Александр Иванов'
}
?? Found user in DB: Yes
? Mode switched: FREE > FREE for user frctlai@gmail.com [FREE]
?? Token updated for user c9a0acbf-b0cf-4fee-8ca7-523db3c05833: appMode=FREE, trialGenerations=0, trialEndsAt=Sun Oct 26 2025 12:26:42 GMT+0000 (Coordinated Universal Time)
?? Sign in attempt: {
  provider: 'google',
  email: 'frctlai@gmail.com',
  name: 'Александр Иванов'
}
?? Found user in DB: Yes
? Mode switched: FREE > FREE for user frctlai@gmail.com [FREE]
?? Token updated for user c9a0acbf-b0cf-4fee-8ca7-523db3c05833: appMode=FREE, trialGenerations=0, trialEndsAt=Sun Oct 26 2025 12:26:42 GMT+0000 (Coordinated Universal Time)
?? Sign in attempt: {
  provider: 'google',
  email: 'ivanovvier@gmail.com',
  name: 'Александр Иванов'
}
?? Found user in DB: Yes
? Trial set for user: ivanovvier@gmail.com

### Проверить статус
CONTAINER ID   IMAGE                COMMAND                  CREATED         STATUS                  PORTS                                         NAMES
f87f832f321b   creatix-app          "./docker-entrypoint…"   8 minutes ago   Up 8 minutes            0.0.0.0:3000->3000/tcp, [::]:3000->3000/tcp   creatix-app
916930850b6f   postgres:15-alpine   "docker-entrypoint.s…"   19 hours ago    Up 19 hours (healthy)   5432/tcp                                      creatix-postgres

### Перезапустить если нужно


## Откат изменений

### Если что-то сломалось:
[main 04e980b] Revert "Fix generation limits and create comprehensive test script"
 Date: Thu Oct 23 15:47:33 2025 +0300
 2 files changed, 2 insertions(+), 293 deletions(-)
 delete mode 100644 scripts/fix-and-test-all.ts

## Полезные команды


> creatix@1.0.0 dev
> next dev -p 3000

   ^ Next.js 15.5.4
   - Local:        http://localhost:3000
   - Network:      http://172.19.0.1:3000
   - Environments: .env.local, .env

 ? Starting...
 ? Ready in 3.7s
 0 Compiling /middleware ...
 ? Compiled /middleware in 596ms (292 modules)
 0 Compiling /api/auth/[...nextauth] ...
 ? Compiled /api/auth/[...nextauth] in 1404ms (598 modules)
 GET /api/auth/signin?csrf=true 302 in 3887ms
[?25h

> creatix@1.0.0 build
> next build

   ^ Next.js 15.5.4
   - Environments: .env.local, .env.production, .env

   Creating an optimized production build ...

> creatix@1.0.0 lint
> next lint
