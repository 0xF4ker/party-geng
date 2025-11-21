"use client";

import { useParams, useRouter } from "next/navigation";
import PostModal from "@/app/_components/social/PostModal";

const PostPage = () => {
  const params = useParams();
  const postId = params.id as string;
  const router = useRouter();

  if (!postId) {
    return <div>Post not found.</div>;
  }

  const postStub = { id: postId, caption: null, assets: [] };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <PostModal
        posts={[postStub]}
        initialIndex={0}
        onClose={() => router.push("/trending")}
      />
    </div>
  );
};

export default PostPage;
