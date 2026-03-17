import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function Home() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] space-y-8">
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-bold tracking-tight sm:text-6xl">
          Postly
        </h1>
        <p className="text-xl text-muted-foreground max-w-2xl">
          A simple posts app built with Next.js Server Actions,
          an in-memory database, and shadcn/ui components.
        </p>
      </div>

      <div className="flex gap-4">
        <Button size="lg" asChild>
          <Link href="/posts">View All Posts</Link>
        </Button>
        <Button size="lg" variant="outline" asChild>
          <Link href="/posts/new">Create New Post</Link>
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mt-12 w-full max-w-5xl">
        <Card>
          <CardHeader>
            <CardTitle className="text-green-600">Create</CardTitle>
            <CardDescription>Add new posts</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Create new posts with a title and content using a validated form.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-blue-600">Read</CardTitle>
            <CardDescription>View posts</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Browse all posts in a grid layout or view individual post details.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-yellow-600">Update</CardTitle>
            <CardDescription>Edit posts</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Modify existing posts with the same validated form interface.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-red-600">Delete</CardTitle>
            <CardDescription>Remove posts</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Delete posts with confirmation to prevent accidental removal.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
