import Link from "next/link";
import { Button } from "@/components/ui/button";
import { PostsFilter } from "@/components/posts/posts-filter";
import { getPosts } from "@/lib/db";

export default async function PostsPage() {
  const posts = await getPosts();

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Posts</h1>
        <Button asChild>
          <Link href="/posts/new">Create New Post</Link>
        </Button>
      </div>

      {posts.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground mb-4">No posts yet.</p>
          <Button asChild>
            <Link href="/posts/new">Create your first post</Link>
          </Button>
        </div>
      ) : (
        <PostsFilter posts={posts} />
      )}
    </div>
  );
}
