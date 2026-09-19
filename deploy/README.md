# UniFlow — AWS EC2 ga deploy (CI/CD)

## Qanday ishlaydi

```
git push (main)
   │
   ├─ Backend repo  → CI: install, prisma, tsc, build → Docker image → ghcr.io/bakhtiyorovv9/uniflow-backend
   │                 → SSH: /opt/uniflow da backend yangilanadi (migratsiyalar avtomatik)
   │
   └─ Frontend repo → CI: install, typecheck, build → Docker image → ghcr.io/bakhtiyorovv9/uniflow-frontend
                     → SSH: /opt/uniflow da frontend yangilanadi

Serverda (EC2): Caddy (80/443, avtomatik HTTPS)
   ├─ /api/*, /uploads/*  → backend:3000
   └─ qolgan hammasi      → frontend:3000
   PostgreSQL faqat ichki tarmoqda (tashqariga ochiq emas)
```

Pull request ochilganda faqat CI (tekshiruv) ishlaydi, serverga chiqarilmaydi.

## 1. AWS EC2 yaratish (bir marta)

1. EC2 → Launch instance: **Ubuntu 24.04**, kamida **t3.small** (2 GB RAM), disk 20–30 GB.
2. Key pair yarating (`.pem` faylni saqlab qo'ying).
3. Security group: **22** (faqat o'z IP'ingiz), **80** va **443** (hamma uchun) portlarini oching.
4. Elastic IP ajratib, instansiyaga bog'lang (IP o'zgarmasligi uchun).
5. Domen bo'lsa, DNS'da `A` yozuvini shu IP ga qarating.

## 2. Serverni tayyorlash (bir marta)

```bash
ssh -i key.pem ubuntu@SERVER_IP 'bash -s' < deploy/setup-server.sh
```

Keyin serverda `.env` yarating:

```bash
ssh -i key.pem ubuntu@SERVER_IP
nano /opt/uniflow/.env     # deploy/.env.production.example dan nusxa olib to'ldiring
chmod 600 /opt/uniflow/.env
```

Tasodifiy kalitlar uchun: `openssl rand -hex 32`.

## 3. GitHub sozlamalari (ikkala repoda ham)

**Settings → Secrets and variables → Actions → Secrets:**

| Nomi | Qiymati |
|---|---|
| `EC2_HOST` | Server IP yoki domen |
| `EC2_USER` | `ubuntu` |
| `EC2_SSH_KEY` | `.pem` faylning to'liq matni |

**Frontend repo → Variables:**

| Nomi | Qiymati |
|---|---|
| `NEXT_PUBLIC_API_URL` | `/api` (standart, o'zgartirish shart emas) |

**Settings → Environments → `production`** yarating (xohlasangiz "Required reviewers" qo'yib, deploy'ni qo'lda tasdiqlaysiz).

## 4. Birinchi deploy

1. **Avval backend** repoga push qiling (`main`). U `docker-compose.prod.yml` va `Caddyfile` ni serverga nusxalaydi.
2. Keyin **frontend** repoga push qiling.
3. Birinchi SUPERADMIN yaratish (bir marta):

```bash
cd /opt/uniflow
docker compose -f docker-compose.prod.yml exec backend node dist/src/core/seed/seed.js
```

## Foydali buyruqlar (serverda)

```bash
cd /opt/uniflow
docker compose -f docker-compose.prod.yml ps                 # holat
docker compose -f docker-compose.prod.yml logs -f backend    # loglar
docker compose -f docker-compose.prod.yml restart backend

# Oldingi versiyaga qaytish: .env da BACKEND_TAG=<commit sha> yozing, keyin:
docker compose -f docker-compose.prod.yml up -d backend

# Baza zaxirasi
docker compose -f docker-compose.prod.yml exec -T postgres pg_dump -U postgres -Fc uniflow > backup_$(date +%F).dump
```

Yuklangan fayllar `/opt/uniflow/uploads` da, baza `postgres_data` volume'ida saqlanadi — deploy ularni o'chirmaydi.
