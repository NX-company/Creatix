# 🔑 Быстрая настройка SSH ключей для деплоя

## ✅ Ключ уже создан!

Ваш SSH ключ находится здесь: `C:\Users\Александр\.ssh\id_rsa`

---

## 📋 Вариант 1: Копирование через PuTTY (рекомендую)

### Шаг 1: Скопируйте публичный ключ

Выполните в PowerShell:
```powershell
Get-Content "$env:USERPROFILE\.ssh\id_rsa.pub"
```

Скопируйте весь вывод (начинается с `ssh-rsa AAAA...`)

### Шаг 2: Подключитесь к серверу через PuTTY

- **Host:** 45.129.128.121
- **Port:** 22
- **User:** root
- **Password:** pzaNtMznbq@hw3

### Шаг 3: Выполните команды на сервере

```bash
mkdir -p ~/.ssh
chmod 700 ~/.ssh
echo "ВАWH_СКОПИРОВАННЫЙ_КЛЮЧ" >> ~/.ssh/authorized_keys
chmod 600 ~/.ssh/authorized_keys
exit
```

### Шаг 4: Проверка

В PowerShell выполните:
```powershell
ssh root@45.129.128.121 "echo 'SSH key works!'"
```

Если увидите `SSH key works!` БЕЗ запроса пароля - готово!

---

## 📋 Вариант 2: Автоматическая настройка (используем готовый скрипт)

Я создам файл `setup-ssh-key.sh` на сервере. Выполните:

1. Откройте PuTTY
2. Подключитесь: root@45.129.128.121 (пароль: pzaNtMznbq@hw3)
3. Выполните:

```bash
cat > /root/setup-ssh-key.sh << 'EOF'
#!/bin/bash
mkdir -p ~/.ssh
chmod 700 ~/.ssh
cat >> ~/.ssh/authorized_keys << 'SSHKEY'
ssh-rsa AAAAB3NzaC1yc2EAAAADAQABAAACAQDCVEnXFkbugBmUqvE7i9tGsdXW6S8oy9Qg8aJbrKC2Li3hGkMxqYcwzRs7DW2Sh4hRaJj17rkP2Q/1A/XDQvssHDauEW3TJA+zZVJCcIWXNbOIun6g346qcYtry1yuvV3pxso/BrYhCeV31xvLdI5NB5QnpEL+V32Cl1cRpz2ujC28qn8S5H0kFDGMFtFT4DWWTc5i8gLmqxL926o1wTUxrhzNwpTlwDTWccpelV8WmKjfsrTEbNDFa8so2OqyDbL8pKyY5AM6Veu7zdnmNqZS8fBzUQemRP6eKZLVsTZwT1xUKboMpUIyGWUFw72KhnEtQsQs4bSiiR+VjlCooCmJV3HaEjKvsRQU2h6mLT/BsTwwG53HuuSYKHrIlOfEVXFoUXxTcGDvGyMFo4Xb81CEwShl2Ujc0EuncK72nx/7B6Hh03FnCINimkJ7ha/gmkr0uh2kVP6cvDXxBIstlOtdlSwKmO7d8jezHUQ2NbYJPuxZATPZirvutmhk+dAx9dmNjfaIeiX29y56WEvmP3wqSur3NuMJ8O86G+C/wnu5HQ3V7EdvOcM8kaqw3w7A9IM8x1Zng0Q/TfsrmCGhPXqIRzxH3GWgB/a1PintAt+hRTpYtDfLNYo1zcZ3oXvwRs603Rol1pvAF6wnG4rc7SQ5G5BoendyyW+ySKISGZvpTw== creatix-deploy
SSHKEY
chmod 600 ~/.ssh/authorized_keys
echo "✅ SSH key added successfully!"
EOF

bash /root/setup-ssh-key.sh
```

4. Закройте PuTTY и проверьте в PowerShell:
```powershell
ssh root@45.129.128.121 "echo 'SSH key works!'"
```

---

## 🚀 После настройки SSH ключей

Теперь я смогу делать автоматический деплой одной командой БЕЗ пароля!

Попросите меня "сделай деплой" и я выполню:
```powershell
ssh root@45.129.128.121 "cd /root/Creatix && git pull && npm install && npx prisma generate && npx prisma migrate deploy && ESLINT_NO_DEV_ERRORS=true npm run build && pm2 restart creatix"
```

Все автоматически и быстро!

