"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { createPostAction, updatePostAction } from "@/lib/actions/posts";
import { Post, ActionResult } from "@/lib/types";
import Link from "next/link";

interface PostFormProps {
  post?: Post;
  mode: "create" | "edit";
}

export function PostForm({ post, mode }: PostFormProps) {
  const initialState: ActionResult | null = null;

  const action =
    mode === "create"
      ? createPostAction
      : updatePostAction.bind(null, post!.id);

  const [state, formAction, isPending] = useActionState(action, initialState);

  return (
    <Card className="max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>{mode === "create" ? "Create New Post" : "Edit Post"}</CardTitle>
      </CardHeader>
      <CardContent>
        <form action={formAction} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              name="title"
              defaultValue={state?.data?.title || post?.title || ""}
              placeholder="Enter post title"
              disabled={isPending}
            />
            {state?.errors?.title && (
              <p className="text-sm text-red-500">{state.errors.title[0]}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="body">Content</Label>
            <Textarea
              id="body"
              name="body"
              defaultValue={state?.data?.body || post?.body || ""}
              placeholder="Write your post content here..."
              rows={8}
              disabled={isPending}
            />
            {state?.errors?.body && (
              <p className="text-sm text-red-500">{state.errors.body[0]}</p>
            )}
          </div>
          <div className="flex gap-4">
            <Button type="submit" disabled={isPending}>
              {isPending
                ? mode === "create"
                  ? "Creating..."
                  : "Saving..."
                : mode === "create"
                ? "Create Post"
                : "Save Changes"}
            </Button>
            <Button type="button" variant="outline" asChild>
              <Link href="/posts">Cancel</Link>
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
