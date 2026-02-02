import type { DialectChoice } from '../prompts';

export function generateDockerfile(): string {
  return `FROM node:20-alpine
WORKDIR /app
COPY package*.json pnpm-lock.yaml* ./
RUN corepack enable && pnpm install --frozen-lockfile
COPY . .
RUN pnpm build
EXPOSE 3000
CMD ["node", "dist/index.js"]
`;
}

export function generateDockerignore(): string {
  return `node_modules
dist
*.log
.env
.git
`;
}

export function generateDockerCompose(dialect?: DialectChoice): string {
  if (dialect === 'sqlite') {
    return `services:
  app:
    build: .
    ports:
      - "\${PORT:-3000}:3000"
    volumes:
      - ./data:/app/data
    environment:
      - DATABASE_PATH=/app/data/app.db
`;
  }

  if (dialect === 'mysql') {
    return `services:
  app:
    build: .
    ports:
      - "\${PORT:-3000}:3000"
    depends_on:
      db:
        condition: service_healthy
    environment:
      - DATABASE_URL=mysql://fossyl:fossyl@db:3306/fossyl
  db:
    image: mysql:8
    environment:
      MYSQL_ROOT_PASSWORD: root
      MYSQL_USER: fossyl
      MYSQL_PASSWORD: fossyl
      MYSQL_DATABASE: fossyl
    volumes:
      - mysqldata:/var/lib/mysql
    healthcheck:
      test: ["CMD", "mysqladmin", "ping", "-h", "localhost"]
      interval: 5s
      timeout: 5s
      retries: 5

volumes:
  mysqldata:
`;
  }

  // PostgreSQL (default) or no dialect specified
  return `services:
  app:
    build: .
    ports:
      - "\${PORT:-3000}:3000"
    depends_on:
      db:
        condition: service_healthy
    environment:
      - DATABASE_URL=postgres://fossyl:fossyl@db:5432/fossyl
  db:
    image: postgres:16-alpine
    environment:
      POSTGRES_USER: fossyl
      POSTGRES_PASSWORD: fossyl
      POSTGRES_DB: fossyl
    volumes:
      - pgdata:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U fossyl"]
      interval: 5s
      timeout: 5s
      retries: 5

volumes:
  pgdata:
`;
}
