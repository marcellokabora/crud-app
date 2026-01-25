"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import * as db from "@/lib/db";
import { ActionResult } from "@/lib/types";

// Validation schema for posts
const PostSchema = z.object({
    title: z
        .string()
        .min(1, "Title is required")
        .max(100, "Title must be less than 100 characters"),
    body: z
        .string()
        .min(1, "Body is required")
        .max(5000, "Body must be less than 5000 characters"),
});

export async function createPostAction(
    prevState: ActionResult | null,
    formData: FormData
): Promise<ActionResult> {
    const rawData = {
        title: formData.get("title") as string,
        body: formData.get("body") as string,
    };

    // Validate input
    const validationResult = PostSchema.safeParse(rawData);

    if (!validationResult.success) {
        return {
            success: false,
            message: "Validation failed",
            errors: validationResult.error.flatten().fieldErrors,
        };
    }

    // Create the post
    await db.createPost(validationResult.data);

    // Revalidate and redirect
    revalidatePath("/posts");
    redirect("/posts");
}

export async function updatePostAction(
    id: string,
    prevState: ActionResult | null,
    formData: FormData
): Promise<ActionResult> {
    const rawData = {
        title: formData.get("title") as string,
        body: formData.get("body") as string,
    };

    // Validate input
    const validationResult = PostSchema.safeParse(rawData);

    if (!validationResult.success) {
        return {
            success: false,
            message: "Validation failed",
            errors: validationResult.error.flatten().fieldErrors,
        };
    }

    // Update the post
    const updated = await db.updatePost(id, validationResult.data);

    if (!updated) {
        return {
            success: false,
            message: "Post not found",
        };
    }

    // Revalidate and redirect
    revalidatePath("/posts");
    revalidatePath(`/posts/${id}`);
    redirect(`/posts/${id}`);
}

export async function deletePostAction(id: string): Promise<ActionResult> {
    const deleted = await db.deletePost(id);

    if (!deleted) {
        return {
            success: false,
            message: "Post not found",
        };
    }

    revalidatePath("/posts");
    redirect("/posts");
}
