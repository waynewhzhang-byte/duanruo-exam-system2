# Ubuntu Migration & Deployment

Scripts package the repo and run **npm install + build + PM2** on a server where
Postgres, MinIO, and Node are **already** set up like your dev environment.

## 1) Package (from project root)

**Copy your local `server/.env` into the project before packing** (same
`DATABASE_URL` / `JWT_SECRET` / MinIO settings as your dev box). The script will
include `server/.env` if the file exists (treat the `.tar.gz` as secret).

Optional: `web/.env.production` is included the same way.

```bash
bash deploy/package-project.sh
```

Archive: `dist-deploy/duanruo-exam-system2-<timestamp>.tar.gz`

The packer excludes `dist-deploy/` so the tarball is never “packed into itself”.

**If the archive has no `web/` folder:** you (or your shell) may have set
`OUTPUT_DIR=web` so `tar --exclude=web` removed the whole frontend. Do not set
`OUTPUT_DIR` to `web`, `server`, or `deploy`. Use the default `dist-deploy` or
run `unset OUTPUT_DIR` before `bash deploy/package-project.sh`. Verify with:

`tar -tzf dist-deploy/duanruo-exam-system2-*.tar.gz | grep '^web/package.json'`

## 2) Upload to server

```bash
scp dist-deploy/duanruo-exam-system2-*.tar.gz root@YOUR_SERVER:/root/
```

## 3) Extract and install

Extract to a dedicated directory (recommended):

```bash
mkdir -p /opt/duanruo-exam-system2
tar -xzf duanruo-exam-system2-*.tar.gz -C /opt/duanruo-exam-system2
cd /opt/duanruo-exam-system2
bash deploy/install-and-deploy.sh
```

You may run as **root** or a normal user. **No `apt-get` runs by default**, so a
broken MinIO apt source on the server will not block this script.

The installer will:

1. `npm ci` in `server` and `web`  
2. **`npx prisma migrate deploy`** (default `MIGRATION_MODE=deploy`) using `server/.env`  
3. **Seed a platform super-admin** (default on): username `admin`, email
   `admin@duanruo.com`, password `admin123@Abc`, roles `ADMIN` + `SUPER_ADMIN`
   (idempotent: updates password/roles if user already exists)  
4. `npm run build` for both apps, then start PM2

To skip super-admin seed:

```bash
SEED_SUPER_ADMIN=0 bash deploy/install-and-deploy.sh
```

To set password only for seed (keeps your requested defaults for name/email otherwise):

```bash
SEED_SUPER_ADMIN_PASSWORD='your-secure-secret' bash deploy/install-and-deploy.sh
```

### Defaults (match “existing environment + only PM2”)

| Variable | Default | Meaning |
|----------|---------|---------|
| `SKIP_APT` | `1` | Do not run `apt-get` |
| `USE_NVM` | `0` | Use system `node` / `npm` on `PATH` |
| `MIGRATION_MODE` | `deploy` | `prisma migrate deploy` if `prisma/migrations` exists |

### Optional

- **nvm + fixed Node** (only if the server has no suitable Node):

  ```bash
  USE_NVM=1 NODE_VERSION=22.22.2 bash deploy/install-and-deploy.sh
  ```

- **Skip DB migration** (schema already applied):

  ```bash
  MIGRATION_MODE=skip bash deploy/install-and-deploy.sh
  ```

- **First deploy without migration history**:

  ```bash
  MIGRATION_MODE=push bash deploy/install-and-deploy.sh
  ```

- **Install OS packages** (curl, build-essential, …) — opt-in:

  ```bash
  SKIP_APT=0 bash deploy/install-and-deploy.sh
  ```

## 4) Env files

If missing, the installer copies:

- `deploy/env/server.env.production.example` → `server/.env`
- `deploy/env/web.env.production.example` → `web/.env.production`

Edit real values before production.

## 5) PM2

```bash
pm2 list
pm2 logs
pm2 restart duanruo-server
pm2 restart duanruo-web
```

## 6) Ports

- Frontend: `http://SERVER_IP:3000`
- Backend: `http://SERVER_IP:8081/api/v1`

Open TCP `3000` and `8081` in firewall / security group if needed.
