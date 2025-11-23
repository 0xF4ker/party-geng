"use client";

import { useParams } from "next/navigation";
import PostModal from "@/app/_components/social/PostModal";

const PostPage = () => {
  const params = useParams();
  const postId = params.id as string;

  if (!postId) {
    return <div>Post not found.</div>;
  }

  const postStub = { id: postId, caption: null, assets: [] };

  return (
    <div className="container mx-auto max-w-6xl px-4 py-8">
      <PostModal posts={[postStub]} initialIndex={0} />
    </div>
  );
};

export default PostPage;
