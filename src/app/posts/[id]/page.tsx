import Link from "next/link";
import { notFound } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DeleteButton } from "@/components/posts/delete-button";
import { getPostById } from "@/lib/db";

interface PostPageProps {
  params: Promise<{ id: string }>;
}

export default async function PostPage({ params }: PostPageProps) {
  const { id } = await params;
  const post = await getPostById(id);

  if (!post) {
    notFound();
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-4">
        <Button variant="outline" asChild>
          <Link href="/posts">← Back to Posts</Link>
        </Button>
      </div>

      <Card className="max-w-3xl mx-auto">
        <CardHeader>
          <CardTitle className="text-3xl">{post.title}</CardTitle>
          <div className="flex gap-4 text-sm text-muted-foreground">
            <span>Created: {post.createdAt.toLocaleDateString()}</span>
            {post.updatedAt > post.createdAt && (
              <span>Updated: {post.updatedAt.toLocaleDateString()}</span>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="prose max-w-none">
            <p className="whitespace-pre-wrap">{post.body}</p>
          </div>

          <div className="flex gap-4 pt-6 border-t">
            <Button asChild>
              <Link href={`/posts/${post.id}/edit`}>Edit Post</Link>
            </Button>
            <DeleteButton postId={post.id} />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
