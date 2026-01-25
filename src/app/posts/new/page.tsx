import { PostForm } from "@/components/posts/post-form";

export default function NewPostPage() {
  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold text-center">Create New Post</h1>
      <PostForm mode="create" />
    </div>
  );
}
