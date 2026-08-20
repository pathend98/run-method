# Training Brain

Training Brain is a run-coaching app.

The project is currently bootstrapped as a single-package Next.js application using the App Router, TypeScript, pnpm, Node.js 24, and Docker-ready production builds.

For the broader roadmap, see [PLAN.md](PLAN.md). For architecture decisions, see [ADRs.md](ADRs.md).

## Requirements

- Node.js 24
- pnpm 11.22.0, via Corepack or a local pnpm install

## Getting Started

Install dependencies:

```bash
pnpm install
```

Create a local environment file:

```bash
cp .env.example .env.local
```

Start PostgreSQL:

```bash
pnpm db:up
```

Apply committed migrations and verify connectivity:

```bash
pnpm db:migrate
pnpm db:check
```

Start the development server:

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Useful Commands

```bash
pnpm lint
pnpm format:check
pnpm build
pnpm db:up
pnpm db:migrate
pnpm db:check
pnpm start
```

## Docker

Build the production image:

```bash
docker build -t training-brain .
```

Run the production image:

```bash
docker run --rm -p 3000:3000 training-brain
```
