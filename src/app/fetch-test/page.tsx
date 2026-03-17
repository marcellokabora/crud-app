import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface PlaceholderPost {
  id: number;
  userId: number;
  title: string;
  body: string;
}

async function fetchPosts(): Promise<PlaceholderPost[]> {
  const res = await fetch("https://jsonplaceholder.typicode.com/posts?_limit=10", {
    cache: "no-store",
  });
  if (!res.ok) throw new Error("Failed to fetch posts from JSONPlaceholder");
  return res.json();
}

export default async function FetchTestPage() {
  const posts = await fetchPosts();

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Fetch Test</h1>
        <p className="text-muted-foreground mt-1">
          Data fetched live from{" "}
          <span className="font-mono text-sm">jsonplaceholder.typicode.com</span>
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {posts.map((post) => (
          <Card key={post.id}>
            <CardHeader>
              <CardTitle className="text-base">
                #{post.id} — {post.title}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">{post.body}</p>
              <p className="text-xs text-muted-foreground mt-3">User ID: {post.userId}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
