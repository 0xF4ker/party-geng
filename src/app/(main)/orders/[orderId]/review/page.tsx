"use client";

import React, { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { api } from "@/trpc/react";
import { toast } from "sonner";
import { Star, Send, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

const StarRating = ({ rating, setRating, disabled }: { rating: number, setRating: (rating: number) => void, disabled: boolean }) => {
    return (
        <div className="flex gap-1">
            {[1, 2, 3, 4, 5].map((star) => (
                <button
                    type="button"
                    key={star}
                    onClick={() => setRating(star)}
                    className={cn(
                        "transition-all",
                        star <= rating ? "text-yellow-400" : "text-gray-300 hover:text-yellow-200",
                        disabled && "cursor-not-allowed"
                    )}
                    disabled={disabled}
                >
                    <Star className="h-8 w-8" fill="currentColor" />
                </button>
            ))}
        </div>
    );
};


const CreateReviewPage = () => {
  const router = useRouter();
  const params = useParams();
  const orderId = params.orderId as string;

  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  
  const { data: order, isLoading: isOrderLoading } = api.order.getMyOrders.useQuery({ status: "COMPLETED" }, {
      select: (data) => data.find(o => o.id === orderId)
  });

  const createReview = api.review.createForVendor.useMutation({
      onSuccess: () => {
          toast.success("Review submitted successfully!");
          router.push("/manage_orders");
      },
      onError: (error) => {
          toast.error(error.message || "Failed to submit review.");
      }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (rating === 0) {
      toast.error("Please select a rating.");
      return;
    }
    if (comment.trim().length < 10) {
        toast.error("Comment must be at least 10 characters long.");
        return;
    }

    createReview.mutate({
        orderId,
        rating,
        comment,
    });
  };

  if (isOrderLoading) {
    return <div className="flex justify-center items-center h-screen"><Loader2 className="h-8 w-8 animate-spin" /></div>;
  }
  
  if (!order) {
      return <div className="text-center py-20">Order not found or you do not have permission to review it.</div>
  }

  return (
    <div className="min-h-screen bg-gray-50 pt-[122px] text-gray-900 lg:pt-[127px]">
      <div className="container mx-auto max-w-2xl px-4 py-8 sm:px-8">
        <h1 className="text-3xl font-bold mb-2">Leave a Review</h1>
        <p className="text-gray-600 mb-6">Share your experience with <span className="font-semibold">{order.vendor.vendorProfile?.companyName ?? order.vendor.username}</span> for the order: <span className="font-semibold">{order.quote.title}</span></p>

        <form onSubmit={handleSubmit} className="bg-white p-8 rounded-lg shadow-sm border border-gray-200">
            <div className="mb-6">
                <label className="block text-lg font-semibold mb-2">Your Rating</label>
                <StarRating rating={rating} setRating={setRating} disabled={createReview.isPending} />
            </div>

            <div className="mb-6">
                <label htmlFor="comment" className="block text-lg font-semibold mb-2">Your Review</label>
                <textarea
                    id="comment"
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    placeholder="Describe your experience..."
                    className="w-full rounded-md border border-gray-300 p-3 focus:ring-1 focus:ring-pink-500 focus:outline-pink-500"
                    rows={6}
                    minLength={10}
                    maxLength={1000}
                    required
                    disabled={createReview.isPending}
                />
            </div>
            
            <div className="flex justify-end">
                 <button
                    type="submit"
                    className="flex items-center justify-center gap-2 rounded-md bg-pink-600 px-6 py-3 font-semibold text-white hover:bg-pink-700 disabled:opacity-50"
                    disabled={createReview.isPending}
                >
                    {createReview.isPending ? <Loader2 className="h-5 w-5 animate-spin"/> : <Send className="h-5 w-5"/>}
                    Submit Review
                </button>
            </div>
        </form>
      </div>
    </div>
  );
};

export default CreateReviewPage;
