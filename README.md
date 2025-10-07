<p align="center">
  <a href="http://nestjs.com/" target="blank"><img src="https://nestjs.com/img/logo-small.svg" width="120" alt="Nest Logo" /></a>
</p>

[circleci-image]: https://img.shields.io/circleci/build/github/nestjs/nest/master?token=abc123def456
[circleci-url]: https://circleci.com/gh/nestjs/nest

  <p align="center">A progressive <a href="http://nodejs.org" target="_blank">Node.js</a> framework for building efficient and scalable server-side applications.</p>
    <p align="center">
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/v/@nestjs/core.svg" alt="NPM Version" /></a>
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/l/@nestjs/core.svg" alt="Package License" /></a>
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/dm/@nestjs/common.svg" alt="NPM Downloads" /></a>
<a href="https://circleci.com/gh/nestjs/nest" target="_blank"><img src="https://img.shields.io/circleci/build/github/nestjs/nest/master" alt="CircleCI" /></a>
<a href="https://discord.gg/G7Qnnhy" target="_blank"><img src="https://img.shields.io/badge/discord-online-brightgreen.svg" alt="Discord"/></a>
<a href="https://opencollective.com/nest#backer" target="_blank"><img src="https://opencollective.com/nest/backers/badge.svg" alt="Backers on Open Collective" /></a>
<a href="https://opencollective.com/nest#sponsor" target="_blank"><img src="https://opencollective.com/nest/sponsors/badge.svg" alt="Sponsors on Open Collective" /></a>
  <a href="https://paypal.me/kamilmysliwiec" target="_blank"><img src="https://img.shields.io/badge/Donate-PayPal-ff3f59.svg" alt="Donate us"/></a>
    <a href="https://opencollective.com/nest#sponsor"  target="_blank"><img src="https://img.shields.io/badge/Support%20us-Open%20Collective-41B883.svg" alt="Support us"></a>
  <a href="https://twitter.com/nestframework" target="_blank"><img src="https://img.shields.io/twitter/follow/nestframework.svg?style=social&label=Follow" alt="Follow us on Twitter"></a>
</p>
  <!--[![Backers on Open Collective](https://opencollective.com/nest/backers/badge.svg)](https://opencollective.com/nest#backer)
  [![Sponsors on Open Collective](https://opencollective.com/nest/sponsors/badge.svg)](https://opencollective.com/nest#sponsor)-->

## Description

[Nest](https://github.com/nestjs/nest) framework TypeScript starter repository.

## Project setup

```bash
$ npm install
```

## Compile and run the project

```bash
# development
$ npm run start

# watch mode
$ npm run start:dev

# production mode
$ npm run start:prod
```

## Run tests

```bash
# unit tests
$ npm run test

# e2e tests
$ npm run test:e2e

# test coverage
$ npm run test:cov
```

## Deployment

This project includes a production-ready deployment setup for a VPS using Docker, Docker Compose, and GitHub Actions (CI/CD). It also auto-runs Prisma migrations on startup.

### Overview

- Containerized app with a Dockerfile
- External Postgres (Neon) via DATABASE_URL
- CI/CD via GitHub Actions: build and push image to Docker Hub, then deploy to VPS
- Environment-driven configuration

### Prerequisites

- A VPS (e.g., Ubuntu 22.04) with SSH access
- Docker Engine and Docker Compose plugin installed
- A Docker Hub account (or other container registry)
- Optional: a domain and Nginx reverse proxy for HTTPS

### Environment variables

Create or edit `/srv/book-inventories/.env` on the VPS with these variables:

- REGISTRY_IMAGE – your Docker image, e.g. `your-dockerhub-username/book-inventories:latest`
- NODE_ENV – `production`
- PORT – external host port (default `3333` in this repo)
- DATABASE_URL – Neon Postgres connection string (DIRECT recommended): `postgresql://<user>:<password>@<neon_hostname>/<db>?sslmode=require`
- JWT_SECRET – your JWT secret
- JWT_EXPIRATION – e.g. `1d`
- JWT_REFRESH_SECRET – your refresh token secret
- JWT_REFRESH_EXPIRATION – e.g. `7d`
- SERVER_NAME – your domain for Nginx (e.g., `api.example.com`), or `_` if none yet
- ENABLE_SSL – `true` to enable automatic HTTPS via Certbot, else `false`
- CERTBOT_EMAIL – email registered with Certbot when `ENABLE_SSL=true`

Optional Nginx rate limiting (defaults shown):
- LIMIT_CONN_ZONE_NAME=`addr`, LIMIT_CONN_ZONE_SIZE=`10m`, LIMIT_CONN_PER_IP=`20`
- RATE_LIMIT_ZONE_NAME=`api_limit`, RATE_LIMIT_ZONE_SIZE=`10m`, RATE_LIMIT_REQ_RATE=`10r/s`, RATE_LIMIT_BURST=`20`, RATE_LIMIT_DELAYED=`false`

Note: This project maps host `${PORT}` to the container’s internal port `3000`. Adjust your firewall and Nginx accordingly.

### 1) Prepare the VPS

```bash
# Log in to VPS
ssh <vps-user>@<vps-host>

# Install Docker (Ubuntu)
sudo apt-get update
sudo apt-get install -y ca-certificates curl gnupg
sudo install -m 0755 -d /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg
echo \
  "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu \
  $(. /etc/os-release && echo $VERSION_CODENAME) stable" | \
  sudo tee /etc/apt/sources.list.d/docker.list > /dev/null
sudo apt-get update
sudo apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin

# Create deployment directory
sudo mkdir -p /srv/book-inventories
sudo chown -R $USER:$USER /srv/book-inventories
cd /srv/book-inventories

# Create .env from example (edit values accordingly)
cat > .env << 'EOF'
# From deploy/.env.example. Replace secrets accordingly.
REGISTRY_IMAGE=your-dockerhub-username/book-inventories:latest
NODE_ENV=production
PORT=3000
# Use the DIRECT Neon connection string (not pooled), e.g.:
# postgresql://<user>:<password>@<neon_hostname>/<db>?sslmode=require
DATABASE_URL=postgresql://user:password@your-neon-hosting-url/dbname?sslmode=require
JWT_SECRET=replace-with-strong-secret
EOF
```

Note: This setup assumes an external Postgres (Neon). The local `db` service has been removed from `docker-compose.yml`.

### 2) Configure GitHub Secrets

In your repository settings → Secrets and variables → Actions, add:

- `DOCKERHUB_USERNAME` – your Docker Hub username
- `DOCKERHUB_TOKEN` – a Docker Hub access token
- `VPS_HOST` – VPS hostname or IP
- `VPS_USER` – SSH user for the VPS
- `VPS_SSH_KEY` – private SSH key contents (e.g., `~/.ssh/id_rsa`) for the above user
- `VPS_DEPLOY_PATH` – path on VPS, e.g., `/srv/book-inventories`

### 3) First Deployment

On every push to `main`, GitHub Actions will:

1. Build and push the Docker image to Docker Hub
2. Copy `deploy/docker-compose.yml` to `${VPS_DEPLOY_PATH}` on your VPS
3. SSH into the VPS, log in to Docker Hub, pull the image, and run `docker compose up -d`

After completion, the API will be available on `http://<vps-host>:3000` (or the `PORT` you set). Swagger is at `/swagger`.

Alternatively, you can perform the first deployment and configure the reverse proxy with the helper script:

```bash
# On your local machine
scp deploy/deploy.sh <vps-user>@<vps-host>:/srv/book-inventories/

# On the VPS
ssh <vps-user>@<vps-host>
cd /srv/book-inventories
chmod +x deploy.sh
./deploy.sh
```

The script will:
- Validate `.env` for required keys
- Log in to Docker Hub if `DOCKERHUB_USERNAME` and `DOCKERHUB_TOKEN` are exported
- Pull the latest image and run `docker compose up -d`
- Install and configure Nginx as a reverse proxy to `127.0.0.1:${PORT}`
- Optionally obtain HTTPS via Certbot when `ENABLE_SSL=true` and `SERVER_NAME` + `CERTBOT_EMAIL` are set
- Write rate limit zones and apply sensible defaults (see variables above)

### 4) Install Nginx Reverse Proxy + HTTPS

Install Nginx on the VPS and proxy traffic from port 80/443 to the app:

```bash
sudo apt-get install -y nginx
sudo ufw allow 'Nginx Full' || true

# Copy the example config from the repo (adjust server_name)
sudo tee /etc/nginx/sites-available/book-inventories.conf > /dev/null <<'NGINX'
$(cat deploy/nginx.conf.example)
NGINX

sudo ln -sf /etc/nginx/sites-available/book-inventories.conf /etc/nginx/sites-enabled/book-inventories.conf
sudo nginx -t && sudo systemctl reload nginx
```

For HTTPS, obtain a certificate via Certbot:

```bash
sudo apt-get install -y certbot python3-certbot-nginx
sudo certbot --nginx -d api.example.com
```

### 5) Database Migrations

Prisma migrations run automatically on container start via `npx prisma migrate deploy`. Ensure `DATABASE_URL` is correct and reachable.

### 6) Troubleshooting

- Check container logs: `docker compose logs -f app`
- Recreate stack: `docker compose pull && docker compose up -d --remove-orphans`
- Clean up unused images: `docker image prune -f`

Nginx / SSL:
- Test config: `sudo nginx -t`; reload: `sudo systemctl reload nginx`
- If rate limits are too strict, tune `RATE_LIMIT_REQ_RATE`, `RATE_LIMIT_BURST`, `LIMIT_CONN_PER_IP`
- Certbot failures usually mean DNS not pointing at the VPS or firewall blocking 80/443
### Files added for deployment

- `Dockerfile` – production image with Prisma
- `.dockerignore` – reduce context size and exclude secrets
- `deploy/docker-compose.yml` – app + Postgres stack
- `deploy/.env.example` – example environment file for VPS (includes reverse proxy and rate limiting variables)
- `deploy/deploy.sh` – helper script to deploy, install Nginx, set up reverse proxy, optional SSL, and rate limiting
- `.github/workflows/deploy.yml` – CI/CD pipeline for build and deploy

## Resources

Check out a few resources that may come in handy when working with NestJS:

- Visit the [NestJS Documentation](https://docs.nestjs.com) to learn more about the framework.
- For questions and support, please visit our [Discord channel](https://discord.gg/G7Qnnhy).
- To dive deeper and get more hands-on experience, check out our official video [courses](https://courses.nestjs.com/).
- Deploy your application to AWS with the help of [NestJS Mau](https://mau.nestjs.com) in just a few clicks.
- Visualize your application graph and interact with the NestJS application in real-time using [NestJS Devtools](https://devtools.nestjs.com).
- Need help with your project (part-time to full-time)? Check out our official [enterprise support](https://enterprise.nestjs.com).
- To stay in the loop and get updates, follow us on [X](https://x.com/nestframework) and [LinkedIn](https://linkedin.com/company/nestjs).
- Looking for a job, or have a job to offer? Check out our official [Jobs board](https://jobs.nestjs.com).

## Support

Nest is an MIT-licensed open source project. It can grow thanks to the sponsors and support by the amazing backers. If you'd like to join them, please [read more here](https://docs.nestjs.com/support).

## Stay in touch

- Author - [Kamil Myśliwiec](https://twitter.com/kammysliwiec)
- Website - [https://nestjs.com](https://nestjs.com/)
- Twitter - [@nestframework](https://twitter.com/nestframework)

## License

Nest is [MIT licensed](https://github.com/nestjs/nest/blob/master/LICENSE).
