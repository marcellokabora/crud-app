import { notFound } from "next/navigation";
import { PostForm } from "@/components/posts/post-form";
import { getPostById } from "@/lib/db";

interface EditPostPageProps {
  params: Promise<{ id: string }>;
}

export default async function EditPostPage({ params }: EditPostPageProps) {
  const { id } = await params;
  const post = await getPostById(id);

  if (!post) {
    notFound();
  }

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold text-center">Edit Post</h1>
      <PostForm mode="edit" post={post} />
    </div>
  );
}
