#!/bin/bash
# Скрипт для загрузки бэкапов в S3-совместимое хранилище
# Поддерживает: Yandex Object Storage, VK Cloud, AWS S3

set -e

# ═══════════════════════════════════════════════════════════
# КОНФИГУРАЦИЯ (заполнить перед использованием)
# ═══════════════════════════════════════════════════════════

# S3 Credentials (получить в консоли облака)
S3_ACCESS_KEY="${S3_ACCESS_KEY:-}"
S3_SECRET_KEY="${S3_SECRET_KEY:-}"
S3_BUCKET="${S3_BUCKET:-creatix-backups}"
S3_ENDPOINT="${S3_ENDPOINT:-https://storage.yandexcloud.net}"  # Yandex по умолчанию

# Пути
BACKUP_DIR="/root/backups"
LOG_FILE="/root/backup-s3.log"
TIMESTAMP=$(date +"%Y-%m-%d %H:%M:%S")

# ═══════════════════════════════════════════════════════════
# ФУНКЦИИ
# ═══════════════════════════════════════════════════════════

log() {
    echo "[$TIMESTAMP] $1" | tee -a "$LOG_FILE"
}

check_requirements() {
    if [ -z "$S3_ACCESS_KEY" ] || [ -z "$S3_SECRET_KEY" ]; then
        log "❌ ERROR: S3_ACCESS_KEY and S3_SECRET_KEY must be set!"
        log "   Установите переменные окружения или отредактируйте этот скрипт"
        exit 1
    fi

    if ! command -v aws &> /dev/null; then
        log "⚠️  AWS CLI не установлен. Устанавливаем..."
        apt-get update && apt-get install -y awscli
        log "✅ AWS CLI установлен"
    fi
}

upload_backups() {
    log "📤 Начинаем загрузку бэкапов в S3..."

    # Настроить AWS CLI для работы с S3-совместимым хранилищем
    export AWS_ACCESS_KEY_ID="$S3_ACCESS_KEY"
    export AWS_SECRET_ACCESS_KEY="$S3_SECRET_KEY"

    # Количество загруженных файлов
    UPLOADED=0
    FAILED=0

    # Загрузить все .gz файлы, которые еще не в S3
    for backup_file in "$BACKUP_DIR"/*.sql.gz; do
        if [ -f "$backup_file" ]; then
            filename=$(basename "$backup_file")

            # Проверить, существует ли уже в S3
            if aws s3 ls "s3://$S3_BUCKET/$filename" --endpoint-url "$S3_ENDPOINT" &> /dev/null; then
                log "⏭️  Пропускаем $filename (уже в S3)"
            else
                log "📤 Загружаем $filename..."
                if aws s3 cp "$backup_file" "s3://$S3_BUCKET/$filename" --endpoint-url "$S3_ENDPOINT"; then
                    log "✅ Успешно загружен: $filename"
                    UPLOADED=$((UPLOADED + 1))
                else
                    log "❌ Ошибка загрузки: $filename"
                    FAILED=$((FAILED + 1))
                fi
            fi
        fi
    done

    log "📊 Статистика: загружено $UPLOADED, ошибок $FAILED"
}

verify_backup() {
    log "🔍 Проверка последнего бэкапа в S3..."

    # Получить список файлов в S3 и взять последний
    LATEST_BACKUP=$(aws s3 ls "s3://$S3_BUCKET/" --endpoint-url "$S3_ENDPOINT" | sort | tail -n 1 | awk '{print $4}')

    if [ -n "$LATEST_BACKUP" ]; then
        # Проверить размер файла в S3
        SIZE=$(aws s3 ls "s3://$S3_BUCKET/$LATEST_BACKUP" --endpoint-url "$S3_ENDPOINT" | awk '{print $3}')
        log "✅ Последний бэкап: $LATEST_BACKUP (размер: $SIZE bytes)"

        if [ "$SIZE" -lt 1000 ]; then
            log "⚠️  ВНИМАНИЕ: Размер бэкапа подозрительно мал!"
        fi
    else
        log "⚠️  Бэкапы в S3 не найдены"
    fi
}

cleanup_old_backups() {
    log "🗑️  Удаление старых бэкапов из S3 (старше 90 дней)..."

    # Дата 90 дней назад
    CUTOFF_DATE=$(date -d "90 days ago" +%Y%m%d 2>/dev/null || date -v-90d +%Y%m%d)

    aws s3 ls "s3://$S3_BUCKET/" --endpoint-url "$S3_ENDPOINT" | while read -r line; do
        filename=$(echo "$line" | awk '{print $4}')
        if [ -n "$filename" ]; then
            # Извлечь дату из имени файла (формат: creatix_db_YYYYMMDD_HHMMSS.sql.gz)
            file_date=$(echo "$filename" | grep -oP '\d{8}' | head -1)

            if [ -n "$file_date" ] && [ "$file_date" -lt "$CUTOFF_DATE" ]; then
                log "🗑️  Удаляем старый бэкап: $filename"
                aws s3 rm "s3://$S3_BUCKET/$filename" --endpoint-url "$S3_ENDPOINT"
            fi
        fi
    done
}

# ═══════════════════════════════════════════════════════════
# ОСНОВНАЯ ЛОГИКА
# ═══════════════════════════════════════════════════════════

log "🚀 Запуск скрипта загрузки бэкапов в S3"

check_requirements
upload_backups
verify_backup
cleanup_old_backups

log "✅ Скрипт завершен успешно"
