# Next.js CRUD App Documentation

A comprehensive guide to understanding the architecture, caching mechanisms, and React hooks used in this Next.js application.

---

## Table of Contents

1. [Project Structure](#project-structure)
2. [Caching in Next.js](#caching-in-nextjs)
3. [React Hooks Used](#react-hooks-used)
4. [Server Actions](#server-actions)
5. [Data Flow](#data-flow)

---

## Project Structure

```
crud-app/
├── src/
│   ├── app/                        # App Router (pages & layouts)
│   │   ├── layout.tsx              # Root layout with header/footer
│   │   ├── page.tsx                # Home page (/)
│   │   ├── globals.css             # Global styles + Tailwind
│   │   └── posts/
│   │       ├── page.tsx            # Posts list (/posts)
│   │       ├── loading.tsx         # Loading skeleton for /posts
│   │       ├── new/
│   │       │   └── page.tsx        # Create post form (/posts/new)
│   │       └── [id]/
│   │           ├── page.tsx        # View single post (/posts/:id)
│   │           ├── not-found.tsx   # 404 for invalid post ID
│   │           └── edit/
│   │               └── page.tsx    # Edit post form (/posts/:id/edit)
│   │
│   ├── components/
│   │   ├── posts/                  # Post-specific components
│   │   │   ├── post-form.tsx       # Reusable form (create/edit)
│   │   │   ├── post-card.tsx       # Card for post list
│   │   │   └── delete-button.tsx   # Delete with confirmation
│   │   └── ui/                     # shadcn/ui components
│   │       ├── button.tsx
│   │       ├── card.tsx
│   │       ├── input.tsx
│   │       ├── label.tsx
│   │       ├── table.tsx
│   │       └── textarea.tsx
│   │
│   └── lib/
│       ├── actions/
│       │   └── posts.ts            # Server Actions (CRUD operations)
│       ├── db.ts                   # In-memory database
│       ├── types.ts                # TypeScript interfaces
│       └── utils.ts                # Utility functions (cn helper)
│
├── package.json
├── tailwind.config.ts
└── tsconfig.json
```

### Key Directories Explained

| Directory               | Purpose                                                                    |
| ----------------------- | -------------------------------------------------------------------------- |
| `src/app/`              | App Router pages. Each folder = route segment. `page.tsx` = page component |
| `src/components/ui/`    | Reusable UI primitives from shadcn/ui                                      |
| `src/components/posts/` | Domain-specific components for posts feature                               |
| `src/lib/actions/`      | Server Actions - server-side functions callable from client                |
| `src/lib/`              | Shared utilities, database, and type definitions                           |

---

## Caching in Next.js

Next.js has multiple caching layers. This app primarily uses **path-based revalidation**.

### How Caching Works in This App

#### 1. Server Component Caching (Default)

Server Components (pages without `"use client"`) are **cached by default** in production:

```tsx
// src/app/posts/page.tsx - This is a Server Component
export default function PostsPage() {
  const posts = getPosts(); // Data fetched at build/request time
  return <PostList posts={posts} />;
}
```

- In **development**: Re-renders on every request
- In **production**: Cached until explicitly revalidated

#### 2. Revalidation with `revalidatePath()`

When data changes (create/update/delete), we **invalidate the cache** using `revalidatePath()`:

```tsx
// src/lib/actions/posts.ts
import { revalidatePath } from "next/cache";

export async function createPostAction(...) {
  db.createPost(data);

  revalidatePath("/posts");  // Invalidate the posts list page
  redirect("/posts");
}

export async function updatePostAction(id, ...) {
  db.updatePost(id, data);

  revalidatePath("/posts");        // Invalidate list
  revalidatePath(`/posts/${id}`);  // Invalidate detail page
  redirect(`/posts/${id}`);
}

export async function deletePostAction(id) {
  db.deletePost(id);

  revalidatePath("/posts");  // Invalidate list
  redirect("/posts");
}
```

### Cache Invalidation Flow

```
User submits form
        │
        ▼
Server Action executes
        │
        ▼
Database updated (in-memory)
        │
        ▼
revalidatePath("/posts") called
        │
        ▼
Next.js marks cached pages as stale
        │
        ▼
redirect() navigates user
        │
        ▼
Fresh data fetched & new page rendered
```

### Types of Revalidation

| Method                           | Use Case                  | Example                              |
| -------------------------------- | ------------------------- | ------------------------------------ |
| `revalidatePath(path)`           | Invalidate specific route | `revalidatePath("/posts")`           |
| `revalidatePath(path, "page")`   | Only the page, not layout | `revalidatePath("/posts", "page")`   |
| `revalidatePath(path, "layout")` | Page + all nested layouts | `revalidatePath("/posts", "layout")` |
| `revalidateTag(tag)`             | Invalidate by cache tag   | `revalidateTag("posts")`             |

### Why Not `fetch()` Caching?

This app uses an **in-memory database** instead of external API calls, so we don't use `fetch()` caching options like:

```tsx
// NOT used in this app, but common with external APIs:
fetch("https://api.example.com/posts", {
  next: { revalidate: 60 }, // Revalidate every 60 seconds
});
```

---

## React Hooks Used

This app uses **3 key React hooks** for handling state and transitions:

### 1. `useActionState` (React 19+)

**Location:** `src/components/posts/post-form.tsx`

**Purpose:** Manages form state when using Server Actions, providing:

- Current action result (success/error state)
- A wrapped action function for forms
- Pending state indicator

```tsx
"use client";
import { useActionState } from "react";

export function PostForm({ post, mode }) {
  const initialState: ActionResult | null = null;

  const action =
    mode === "create" ? createPostAction : updatePostAction.bind(null, post.id);

  const [state, formAction, isPending] = useActionState(action, initialState);
  //     │       │           │
  //     │       │           └─ boolean: true while action is executing
  //     │       └─ function: pass to <form action={formAction}>
  //     └─ ActionResult | null: returned value from Server Action

  return (
    <form action={formAction}>
      {/* Form fields */}
      {state?.errors?.title && (
        <p className="text-red-500">{state.errors.title[0]}</p>
      )}
      <Button disabled={isPending}>{isPending ? "Saving..." : "Save"}</Button>
    </form>
  );
}
```

#### How `useActionState` Works

```
1. User submits form
        │
        ▼
2. isPending becomes `true`
        │
        ▼
3. Server Action executes on server
        │
        ▼
4. Action returns result (or redirects)
        │
        ▼
5. isPending becomes `false`
   state updates with returned value
```

#### Key Points:

- Replaces the old `useFormState` hook (deprecated)
- Works with `"use server"` functions
- Automatically handles the request lifecycle
- The action signature must be `(prevState, formData) => Promise<State>`

---

### 2. `useTransition` (React 18+)

**Location:** `src/components/posts/delete-button.tsx`

**Purpose:** Marks state updates as non-urgent, keeping UI responsive during async operations.

```tsx
"use client";
import { useTransition } from "react";

export function DeleteButton({ postId }) {
  const [isPending, startTransition] = useTransition();
  //     │           │
  //     │           └─ function: wrap async work to mark as transition
  //     └─ boolean: true while transition is in progress

  const handleDelete = () => {
    if (confirm("Are you sure?")) {
      startTransition(() => {
        deletePostAction(postId); // Server Action called inside transition
      });
    }
  };

  return (
    <Button onClick={handleDelete} disabled={isPending}>
      {isPending ? "Deleting..." : "Delete"}
    </Button>
  );
}
```

#### When to Use `useTransition` vs `useActionState`

| Hook             | Use Case                                                |
| ---------------- | ------------------------------------------------------- |
| `useActionState` | Form submissions with `<form action={...}>`             |
| `useTransition`  | Button clicks, programmatic actions, non-form mutations |

#### How `useTransition` Works

```
1. User clicks delete button
        │
        ▼
2. startTransition(() => { ... }) called
        │
        ▼
3. isPending becomes `true` immediately
        │
        ▼
4. React marks the update as "transition" (low priority)
        │
        ▼
5. Server Action executes
        │
        ▼
6. isPending becomes `false` when complete
```

---

### 3. `bind()` for Partial Application

**Location:** `src/components/posts/post-form.tsx`

While not a React hook, `Function.prototype.bind()` is used to pre-fill the `id` parameter:

```tsx
const action =
  mode === "create" ? createPostAction : updatePostAction.bind(null, post.id);
//                  │      │      │
//                  │      │      └─ Pre-filled first argument
//                  │      └─ `this` context (null for Server Actions)
//                  └─ Creates new function with bound arguments
```

This transforms the signature:

```tsx
// Original: (id, prevState, formData) => Promise<ActionResult>
// After bind: (prevState, formData) => Promise<ActionResult>
```

---

## Server Actions

Server Actions are async functions that run on the server but can be called from client components.

### Anatomy of a Server Action

```tsx
// src/lib/actions/posts.ts
"use server"; // ← Required directive - marks all exports as Server Actions

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

// Zod schema for validation
const PostSchema = z.object({
  title: z.string().min(1).max(100),
  body: z.string().min(1).max(5000),
});

export async function createPostAction(
  prevState: ActionResult | null, // Previous return value (for useActionState)
  formData: FormData, // Form data from submission
): Promise<ActionResult> {
  // 1. Extract data from FormData
  const rawData = {
    title: formData.get("title") as string,
    body: formData.get("body") as string,
  };

  // 2. Validate with Zod
  const result = PostSchema.safeParse(rawData);
  if (!result.success) {
    return {
      success: false,
      message: "Validation failed",
      errors: result.error.flatten().fieldErrors,
    };
  }

  // 3. Perform database operation
  db.createPost(result.data);

  // 4. Revalidate cache & redirect
  revalidatePath("/posts");
  redirect("/posts"); // ← Never returns, throws internally
}
```

### Server Action Rules

| Rule                              | Explanation                         |
| --------------------------------- | ----------------------------------- |
| Must have `"use server"`          | At top of file or inside function   |
| Must be `async`                   | All Server Actions are asynchronous |
| Can only accept serializable args | FormData, primitives, plain objects |
| Return serializable values        | Or use `redirect()` which throws    |

---

## Data Flow

### Create Post Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                        CLIENT                                    │
├─────────────────────────────────────────────────────────────────┤
│  PostForm Component                                              │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ const [state, formAction, isPending] = useActionState() │   │
│  │                                                          │   │
│  │ <form action={formAction}>                              │   │
│  │   <input name="title" />                                │   │
│  │   <textarea name="body" />                              │   │
│  │   <button disabled={isPending}>Create</button>          │   │
│  │ </form>                                                 │   │
│  └────────────────────────┬────────────────────────────────┘   │
│                           │ Form submitted                       │
└───────────────────────────┼─────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│                        SERVER                                    │
├─────────────────────────────────────────────────────────────────┤
│  createPostAction(prevState, formData)                          │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ 1. Extract: formData.get("title"), formData.get("body") │   │
│  │ 2. Validate: PostSchema.safeParse(data)                 │   │
│  │ 3. Create: db.createPost(validatedData)                 │   │
│  │ 4. Revalidate: revalidatePath("/posts")                 │   │
│  │ 5. Redirect: redirect("/posts")                         │   │
│  └─────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│  /posts page re-renders with fresh data from getPosts()         │
└─────────────────────────────────────────────────────────────────┘
```

### Delete Post Flow

```
DeleteButton ──onClick──► startTransition() ──► deletePostAction(id)
                               │                        │
                               │                        ▼
                         isPending=true           db.deletePost(id)
                               │                        │
                               │                        ▼
                               │                 revalidatePath()
                               │                        │
                               │                        ▼
                               │                   redirect()
                               │                        │
                               ▼                        ▼
                         isPending=false         /posts loads fresh
```

---

## Summary

| Concept                | Implementation                                  |
| ---------------------- | ----------------------------------------------- |
| **Routing**            | App Router with file-based routes in `src/app/` |
| **Data Mutations**     | Server Actions in `src/lib/actions/`            |
| **Cache Invalidation** | `revalidatePath()` after mutations              |
| **Form State**         | `useActionState` hook for form submissions      |
| **Async UI**           | `useTransition` for non-form async actions      |
| **Validation**         | Zod schemas for server-side validation          |
| **UI Components**      | shadcn/ui primitives in `src/components/ui/`    |

This architecture follows Next.js 15+ best practices with Server Components by default, Server Actions for mutations, and strategic use of Client Components only where interactivity is needed.
