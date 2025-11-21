"use client";

import Image from "next/image";
import { api } from "@/trpc/react";
import { Loader2, Send } from "lucide-react";

const PostModal = ({ postId, onClose }: { postId: string, onClose: () => void }) => {

  const {
    data: post,
    isLoading,
    isError,
  } = api.post.getById.useQuery({ id: postId });

  // Mutations for like, unlike, bookmark, etc. would go here, similar to PostPage
  // For brevity, they are omitted, but would be implemented with optimistic updates

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-pink-600" />
      </div>
    );
  }

  if (isError || !post) {
    return (
      <div className="flex h-full items-center justify-center text-red-500">
        <p>Post not found or could not be loaded.</p>
      </div>
    );
  }

  const authorProfile = post.author.vendorProfile ?? post.author.clientProfile;

  return (
    <div className="bg-white rounded-lg shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col lg:flex-row overflow-hidden" onClick={(e) => e.stopPropagation()}>
        {/* Media Section */}
        <div className="w-full lg:w-2/3 bg-gray-900 flex items-center justify-center relative">
            {post.assets.length > 0 && (
                <Image
                    src={post.assets[0]?.url ?? ""}
                    alt={post.caption ?? "Post image"}
                    fill
                    className="object-contain"
                />
            )}
        </div>
        {/* Content Section */}
        <div className="w-full lg:w-1/3 flex flex-col">
            <div className="p-4 border-b border-gray-200 flex items-center justify-between">
                <div className="flex items-center">
                    <Image src={authorProfile?.avatarUrl ?? ""} className="w-10 h-10 rounded-full mr-3" alt="User avatar" width={40} height={40}/>
                    <div>
                        <p className="font-bold text-gray-800">{post.author.username}</p>
                        <p className="text-xs text-gray-500">{authorProfile?.location}</p>
                    </div>
                </div>
                <button onClick={onClose} className="text-gray-500 hover:text-gray-800 text-3xl leading-none">&times;</button>
            </div>
            <div className="p-4 flex-grow overflow-y-auto">
                <p className="text-gray-700 mb-6">{post.caption}</p>
                {/* Comments Section */}
                <h3 className="font-bold text-gray-800 mb-4">Comments</h3>
                <div className="space-y-4">
                    {post.comments.map(comment => (
                        <div key={comment.id} className="flex items-start">
                            <Image src={comment.author.vendorProfile?.avatarUrl ?? comment.author.clientProfile?.avatarUrl ?? ""} className="w-8 h-8 rounded-full mr-3" alt="Commenter avatar" width={32} height={32}/>
                            <div>
                                <p className="text-sm"><span className="font-bold text-gray-800">{comment.author.username}</span> {comment.text}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
             <div className="p-4 border-t border-gray-200">
                <div className="relative">
                    <input type="text" placeholder="Add a comment..." className="w-full pr-10 py-2 border border-gray-300 rounded-full focus:ring-2 focus:ring-pink-500 focus:outline-none"/>
                    <button className="absolute right-3 top-1/2 -translate-y-1/2 text-pink-500 hover:text-pink-700">
                        <Send className="w-5 h-5"/>
                    </button>
                </div>
            </div>
        </div>
    </div>
  );
};


export default PostModal;
