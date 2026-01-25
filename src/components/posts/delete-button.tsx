"use client";

import { useTransition } from "react";
import { Button } from "@/components/ui/button";
import { deletePostAction } from "@/lib/actions/posts";

interface DeleteButtonProps {
  postId: string;
}

export function DeleteButton({ postId }: DeleteButtonProps) {
  const [isPending, startTransition] = useTransition();   

  const handleDelete = () => {
    if (confirm("Are you sure you want to delete this post?")) {
      startTransition(() => {
        deletePostAction(postId);
      });
    }
  };

  return (
    <Button
      variant="destructive"
      onClick={handleDelete}
      disabled={isPending}
    >
      {isPending ? "Deleting..." : "Delete"}
    </Button>
  );
}
