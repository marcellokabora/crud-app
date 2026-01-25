import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function PostNotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[50vh] space-y-4">
      <h1 className="text-4xl font-bold">Post Not Found</h1>
      <p className="text-muted-foreground">
        The post you&apos;re looking for doesn&apos;t exist or has been deleted.
      </p>
      <Button asChild>
        <Link href="/posts">Back to Posts</Link>
      </Button>
    </div>
  );
}
