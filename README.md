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
