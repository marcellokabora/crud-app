# CRUD App

A full-stack posts management application built with [Next.js](https://nextjs.org) 16 and React 19. It demonstrates how to implement **Create, Read, Update, and Delete** operations using Next.js Server Actions, the App Router, and an in-memory database — with no external backend required.

## Features

- Browse a list of posts with filtering support
- View individual post details
- Create new posts via a form
- Edit existing posts
- Delete posts with confirmation
- Dark/light theme toggle (via `next-themes`)
- Responsive UI built with [shadcn/ui](https://ui.shadcn.com) and Tailwind CSS
- TypeScript throughout

## Tech Stack

| Layer     | Technology                       |
| --------- | -------------------------------- |
| Framework | Next.js 16 (App Router)          |
| Language  | TypeScript                       |
| Styling   | Tailwind CSS + shadcn/ui         |
| State     | Zustand (`ui-store`)             |
| Data      | In-memory database (`lib/db.ts`) |
| Mutations | Next.js Server Actions           |

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Project Structure

```
src/
├── app/
│   ├── posts/          # Posts list, detail, create, and edit pages
│   └── page.tsx        # Home page
├── components/
│   ├── posts/          # PostCard, PostForm, DeleteButton, PostsFilter
│   └── ui/             # shadcn/ui primitives
└── lib/
    ├── actions/posts.ts # Server Actions (CRUD)
    ├── db.ts            # In-memory data store
    └── types.ts         # Shared TypeScript types
```

For a detailed breakdown of the architecture, caching, and hooks used, see [DOCUMENTATION.md](DOCUMENTATION.md).
