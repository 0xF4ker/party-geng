"use client";
import { useParams } from "next/navigation";
import { api } from "@/trpc/react";
import PostModal, {
  type PostSnapshot,
} from "@/app/_components/social/PostModal";
import { Loader2 } from "lucide-react";
const PostPage = () => {
  const params = useParams();
  const postId = params.id as string;
  const {
    data: post,
    isLoading,
    isError,
  } = api.post.getById.useQuery({ id: postId }, { enabled: !!postId });
  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-pink-600" />
      </div>
    );
  }
  if (isError || !post) {
    return <div className="p-8 text-center">Post not found.</div>;
  }
  return (
    <div className="container mx-auto max-w-6xl px-4 py-8">
      <PostModal
        posts={[post] as unknown as PostSnapshot[]}
        initialIndex={0}
      />
    </div>
  );
};
export default PostPage;
