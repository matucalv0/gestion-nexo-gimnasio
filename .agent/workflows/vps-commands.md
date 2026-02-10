---
description: Comandos para configurar y desplegar en un VPS
---

### 1. Preparar el servidor (Ubuntu)
// turbo
Ejecuta esto para instalar Docker rápidamente:
```bash
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh
```

### 2. Crear carpeta de la aplicación
```bash
mkdir -p ~/gestion && cd ~/gestion
```

### 3. Desplegar
Una vez que hayas subido los archivos (`.jar`, `docker-compose.yml`, `.env`):
// turbo
```bash
docker compose up -d --build
```

### 4. Ver logs en el servidor
```bash
docker compose logs -f
```

### 5. Firewall básico (UFW)
// turbo
```bash
ufw allow 22/tcp
ufw allow 80/tcp
ufw allow 443/tcp
ufw allow 8080/tcp
ufw enable
```
