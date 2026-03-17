import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Post } from "@/lib/types";

interface PostCardProps {
  post: Post;
  viewMode?: "grid" | "list";
}

export function PostCard({ post, viewMode = "grid" }: PostCardProps) {
  if (viewMode === "list") {
    return (
      <Card className="hover:shadow-md transition-shadow">
        <CardContent className="flex items-center justify-between gap-4 py-4">
          <div className="flex-1 min-w-0">
            <Link
              href={`/posts/${post.id}`}
              className="font-medium hover:text-blue-600 transition-colors line-clamp-1"
            >
              {post.title}
            </Link>
            <p className="text-sm text-muted-foreground line-clamp-1 mt-0.5">
              {post.body}
            </p>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <span className="text-sm text-muted-foreground">
              {post.createdAt.toLocaleDateString()}
            </span>
            <Button variant="outline" size="sm" asChild>
              <Link href={`/posts/${post.id}`}>Read More</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader>
        <CardTitle className="line-clamp-1">
          <Link
            href={`/posts/${post.id}`}
            className="hover:text-blue-600 transition-colors"
          >
            {post.title}
          </Link>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-muted-foreground line-clamp-2 mb-4">{post.body}</p>
        <div className="flex justify-between items-center">
          <span className="text-sm text-muted-foreground">
            {post.createdAt.toLocaleDateString()}
          </span>
          <Button variant="outline" size="sm" asChild>
            <Link href={`/posts/${post.id}`}>Read More</Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
