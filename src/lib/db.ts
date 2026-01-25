import { Post } from "./types";

// In-memory database with some initial seed data
const posts: Post[] = [
    {
        id: "1",
        title: "Getting Started with Next.js",
        body: "Next.js is a powerful React framework that enables server-side rendering, static site generation, and more. It provides an excellent developer experience with features like automatic code splitting, optimized builds, and a simple page-based routing system.",
        createdAt: new Date("2026-01-20"),
        updatedAt: new Date("2026-01-20"),
    },
    {
        id: "2",
        title: "Understanding Server Actions",
        body: "Server Actions are asynchronous functions that run on the server. They can be used in Server and Client Components to handle form submissions and data mutations in Next.js applications. They integrate seamlessly with the Next.js caching and revalidation architecture.",
        createdAt: new Date("2026-01-22"),
        updatedAt: new Date("2026-01-22"),
    },
    {
        id: "3",
        title: "Building CRUD Applications",
        body: "CRUD stands for Create, Read, Update, and Delete - the four basic operations of persistent storage. This application demonstrates how to implement these operations using Next.js Server Actions and an in-memory database for simplicity.",
        createdAt: new Date("2026-01-24"),
        updatedAt: new Date("2026-01-24"),
    },
];

let nextId = 4;

// Simulate async database delay
const delay = (ms: number = 1000) => new Promise(resolve => setTimeout(resolve, ms));

// GET all posts
export async function getPosts(): Promise<Post[]> {
    await delay(800);
    return [...posts].sort(
        (a, b) => b.createdAt.getTime() - a.createdAt.getTime()
    );
}

// GET single post by ID
export async function getPostById(id: string): Promise<Post | undefined> {
    await delay(600);
    return posts.find((post) => post.id === id);
}

// CREATE new post
export async function createPost(data: { title: string; body: string }): Promise<Post> {
    await delay(500);
    const newPost: Post = {
        id: String(nextId++),
        title: data.title,
        body: data.body,
        createdAt: new Date(),
        updatedAt: new Date(),
    };
    posts.push(newPost);
    return newPost;
}

// UPDATE existing post
export async function updatePost(
    id: string,
    data: { title: string; body: string }
): Promise<Post | null> {
    await delay(500);
    const index = posts.findIndex((post) => post.id === id);
    if (index === -1) return null;

    posts[index] = {
        ...posts[index],
        title: data.title,
        body: data.body,
        updatedAt: new Date(),
    };
    return posts[index];
}

// DELETE post
export async function deletePost(id: string): Promise<boolean> {
    await delay(400);
    const index = posts.findIndex((post) => post.id === id);
    if (index === -1) return false;

    posts.splice(index, 1);
    return true;
}
