"use client";

import { useState, useTransition } from "react";
import { Post } from "@/lib/types";
import { PostCard } from "./post-card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useUIStore } from "@/lib/store/ui-store";

type SortOption = "newest" | "oldest" | "title-az" | "title-za";

interface PostsFilterProps {
  posts: Post[];
}

function sortPosts(posts: Post[], sort: SortOption): Post[] {
  return [...posts].sort((a, b) => {
    switch (sort) {
      case "newest":
        return b.createdAt.getTime() - a.createdAt.getTime();
      case "oldest":
        return a.createdAt.getTime() - b.createdAt.getTime();
      case "title-az":
        return a.title.localeCompare(b.title);
      case "title-za":
        return b.title.localeCompare(a.title);
    }
  });
}

export function PostsFilter({ posts }: PostsFilterProps) {
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<SortOption>("newest");
  const { viewMode, setViewMode } = useUIStore();
  const [displayed, setDisplayed] = useState<Post[]>(() => sortPosts(posts, "newest"));
  const [isPending, startTransition] = useTransition();

  const applyFilters = (nextQuery: string, nextSort: SortOption) => {
    startTransition(async () => {
      await new Promise((resolve) => setTimeout(resolve, 800));
      const q = nextQuery.toLowerCase();
      const filtered = posts.filter(
        (post) =>
          post.title.toLowerCase().includes(q) ||
          post.body.toLowerCase().includes(q)
      );
      setDisplayed(sortPosts(filtered, nextSort));
    });
  };

  const handleSearch = (value: string) => {
    setQuery(value);
    applyFilters(value, sort);
  };

  const handleSort = (value: SortOption) => {
    setSort(value);
    applyFilters(query, value);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row gap-3">
        <Input
          placeholder="Search by title or content..."
          value={query}
          onChange={(e) => handleSearch(e.target.value)}
          className="sm:max-w-sm"
        />
        <Select value={sort} onValueChange={(value) => handleSort(value as SortOption)}>
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="Sort by" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="newest">Newest first</SelectItem>
            <SelectItem value="oldest">Oldest first</SelectItem>
            <SelectItem value="title-az">Title A → Z</SelectItem>
            <SelectItem value="title-za">Title Z → A</SelectItem>
          </SelectContent>
        </Select>
        {query && (
          <p className="text-sm text-muted-foreground self-center">
            {displayed.length} result{displayed.length !== 1 ? "s" : ""}
          </p>
        )}
        {/* View mode toggle — powered by Zustand */}
        <div className="flex gap-1 sm:ml-auto">
          <Button
            variant={viewMode === "grid" ? "default" : "outline"}
            size="sm"
            onClick={() => setViewMode("grid")}
            aria-label="Grid view"
          >
            Grid
          </Button>
          <Button
            variant={viewMode === "list" ? "default" : "outline"}
            size="sm"
            onClick={() => setViewMode("list")}
            aria-label="List view"
          >
            List
          </Button>
        </div>
      </div>

      <div
        className={`transition-opacity duration-150 ${isPending ? "opacity-40 pointer-events-none" : "opacity-100"}`}
      >
        {displayed.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">No posts match &quot;{query}&quot;.</p>
          </div>
        ) : (
          <div
            className={
              viewMode === "grid"
                ? "grid gap-6 md:grid-cols-2 lg:grid-cols-3"
                : "flex flex-col gap-3"
            }
          >
            {displayed.map((post) => (
              <PostCard key={post.id} post={post} viewMode={viewMode} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
