# 🗄️ Настройка удаленных бэкапов в S3

## Шаг 1: Создать S3 bucket

### Вариант А: Yandex Object Storage (рекомендуется)

1. Перейти в [Yandex Cloud Console](https://console.cloud.yandex.ru/)
2. Создать новый bucket:
   - Имя: `creatix-backups` (или любое другое)
   - Класс хранилища: "Холодное" (дешевле)
   - Доступ: "Ограниченный"
3. Создать сервисный аккаунт:
   - IAM → Сервисные аккаунты → Создать
   - Роль: `storage.editor`
4. Создать статический ключ доступа:
   - Идентификатор ключа (Access Key ID)
   - Секретный ключ (Secret Access Key)

**Стоимость:** ~0.50₽/GB/месяц (холодное хранилище), ~100-200₽/месяц за ~100-200GB

### Вариант Б: VK Cloud Solutions (Mail.ru Cloud)

1. Перейти в [VK Cloud](https://mcs.mail.ru/)
2. Object Storage → Создать bucket
3. API Keys → Создать новый ключ
4. Скопировать Access Key и Secret Key

**Стоимость:** ~1₽/GB/месяц

### Вариант В: AWS S3 (если нужен международный сервис)

1. [AWS Console](https://console.aws.amazon.com/)
2. S3 → Create bucket
3. IAM → Create access key

**Стоимость:** $0.023/GB/месяц (~2.3₽/GB)

---

## Шаг 2: Установить AWS CLI на сервере

```bash
ssh root@45.129.128.121

# Установить AWS CLI
apt-get update
apt-get install -y awscli

# Проверить установку
aws --version
```

---

## Шаг 3: Настроить переменные окружения

```bash
# Создать файл с креденшалами S3
cat > /root/.s3-credentials << 'EOF'
export S3_ACCESS_KEY="YOUR_ACCESS_KEY_HERE"
export S3_SECRET_KEY="YOUR_SECRET_KEY_HERE"
export S3_BUCKET="creatix-backups"
export S3_ENDPOINT="https://storage.yandexcloud.net"  # Для Yandex
# export S3_ENDPOINT="https://hb.bizmrg.com"  # Для VK Cloud
# export S3_ENDPOINT="https://s3.amazonaws.com"  # Для AWS
EOF

# Защитить файл
chmod 600 /root/.s3-credentials

# Добавить в ~/.bashrc
echo "source /root/.s3-credentials" >> ~/.bashrc
source ~/.bashrc
```

---

## Шаг 4: Загрузить скрипт на сервер

Скрипт уже создан локально: `scripts/backup-to-s3.sh`

```bash
# Скопировать скрипт на сервер
scp scripts/backup-to-s3.sh root@45.129.128.121:/root/backup-to-s3.sh

# Дать права на выполнение
ssh root@45.129.128.121 "chmod +x /root/backup-to-s3.sh"
```

---

## Шаг 5: Протестировать загрузку

```bash
ssh root@45.129.128.121

# Загрузить креденшалы
source /root/.s3-credentials

# Запустить скрипт
/root/backup-to-s3.sh
```

Вы должны увидеть:
```
[2025-10-29 12:00:00] 🚀 Запуск скрипта загрузки бэкапов в S3
[2025-10-29 12:00:01] 📤 Начинаем загрузку бэкапов в S3...
[2025-10-29 12:00:02] 📤 Загружаем creatix_db_20251029_111917.sql.gz...
[2025-10-29 12:00:05] ✅ Успешно загружен: creatix_db_20251029_111917.sql.gz
[2025-10-29 12:00:06] 📊 Статистика: загружено 1, ошибок 0
[2025-10-29 12:00:07] 🔍 Проверка последнего бэкапа в S3...
[2025-10-29 12:00:08] ✅ Последний бэкап: creatix_db_20251029_111917.sql.gz (размер: 4567890 bytes)
[2025-10-29 12:00:09] ✅ Скрипт завершен успешно
```

---

## Шаг 6: Настроить автоматическую загрузку

```bash
# Добавить в cron (запуск каждые 6 часов, через 30 минут после локального бэкапа)
ssh root@45.129.128.121 "(crontab -l 2>/dev/null; echo '30 */6 * * * source /root/.s3-credentials && /root/backup-to-s3.sh >> /root/backup-s3.log 2>&1') | crontab -"

# Проверить cron
ssh root@45.129.128.121 "crontab -l"
```

Должны увидеть:
```
*/5 * * * * /root/activate-payments-cron.sh
0 */6 * * * /root/backup-db.sh >> /root/backup.log 2>&1
30 */6 * * * source /root/.s3-credentials && /root/backup-to-s3.sh >> /root/backup-s3.log 2>&1
```

---

## Шаг 7: Обновить deploy.sh для загрузки в S3

Скрипт деплоя должен также загружать бэкапы в S3:

```bash
# Отредактировать deploy.sh, добавив после локального бэкапа:
source /root/.s3-credentials && /root/backup-to-s3.sh
```

---

## 🔍 Проверка и мониторинг

### Проверить бэкапы в S3:
```bash
source /root/.s3-credentials
aws s3 ls s3://$S3_BUCKET/ --endpoint-url $S3_ENDPOINT
```

### Скачать бэкап из S3:
```bash
source /root/.s3-credentials
aws s3 cp s3://$S3_BUCKET/creatix_db_TIMESTAMP.sql.gz /tmp/ --endpoint-url $S3_ENDPOINT
```

### Восстановить из бэкапа в S3:
```bash
# Скачать
source /root/.s3-credentials
aws s3 cp s3://$S3_BUCKET/creatix_db_TIMESTAMP.sql.gz /tmp/ --endpoint-url $S3_ENDPOINT

# Восстановить
gunzip -c /tmp/creatix_db_TIMESTAMP.sql.gz | docker exec -i creatix-postgres psql -U postgres -d creatix_db

# Перезапустить
pm2 restart creatix
```

---

## 📊 Ожидаемая стоимость

**При объеме бэкапов ~5GB:**
- Yandex Object Storage (холодное): ~50₽/месяц
- VK Cloud Solutions: ~100₽/месяц
- AWS S3: ~150₽/месяц

**При объеме бэкапов ~50GB:**
- Yandex Object Storage (холодное): ~250₽/месяц
- VK Cloud Solutions: ~500₽/месяц
- AWS S3: ~1000₽/месяц

---

## ✅ Чеклист завершения

- [ ] S3 bucket создан
- [ ] Статический ключ доступа получен
- [ ] AWS CLI установлен на сервере
- [ ] Переменные окружения настроены
- [ ] Скрипт backup-to-s3.sh загружен и работает
- [ ] Cron настроен для автозагрузки
- [ ] Deploy.sh обновлен
- [ ] Тестовая загрузка выполнена успешно
- [ ] Тестовое восстановление проверено

---

## 🆘 Что делать при потере данных

1. **Подключиться к серверу:**
   ```bash
   ssh root@45.129.128.121
   ```

2. **Посмотреть доступные бэкапы в S3:**
   ```bash
   source /root/.s3-credentials
   aws s3 ls s3://$S3_BUCKET/ --endpoint-url $S3_ENDPOINT | sort
   ```

3. **Скачать нужный бэкап:**
   ```bash
   BACKUP_FILE="creatix_db_YYYYMMDD_HHMMSS.sql.gz"
   aws s3 cp "s3://$S3_BUCKET/$BACKUP_FILE" /tmp/ --endpoint-url $S3_ENDPOINT
   ```

4. **СОЗДАТЬ БЭКАП ТЕКУЩЕГО СОСТОЯНИЯ (на всякий случай):**
   ```bash
   /root/backup-db.sh
   ```

5. **Восстановить из бэкапа:**
   ```bash
   # Остановить приложение
   pm2 stop creatix

   # Восстановить БД
   gunzip -c /tmp/$BACKUP_FILE | docker exec -i creatix-postgres psql -U postgres -d creatix_db

   # Запустить приложение
   pm2 restart creatix
   ```

6. **Проверить, что данные восстановлены:**
   ```bash
   docker exec creatix-postgres psql -U postgres -d creatix_db -c "SELECT COUNT(*) FROM \"User\";"
   ```
