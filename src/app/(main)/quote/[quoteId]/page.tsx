"use client";

import React, { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { api } from '@/trpc/react';
import { Loader2, ArrowLeft, Calendar, User, Briefcase, Hash, FileText, Layers, Wallet } from 'lucide-react';
import Image from 'next/image';
import { useAuth } from '@/hooks/useAuth';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { PayQuoteModal } from '@/app/_components/quote/PayQuoteModal';

const QuoteDetailPage = () => {
    const params = useParams();
    const router = useRouter();
    const { user } = useAuth();
    const quoteId = params.quoteId as string;
    const [isPayModalOpen, setIsPayModalOpen] = useState(false);

    const { data: quote, isLoading, isError, error, refetch } = api.quote.getById.useQuery({ id: quoteId });
    
    const handlePayNow = () => {
        setIsPayModalOpen(true);
    }

    const updateQuoteStatus = api.quote.updateStatus.useMutation({
        onSuccess: () => {
            toast.success("Quote status updated.");
            void refetch();
        },
        onError: (error) => {
            toast.error(error.message ?? "Failed to update quote status.");
        }
    });
    
    const deleteQuote = api.quote.delete.useMutation({
        onSuccess: () => {
            toast.success("Quote deleted.");
            router.push("/manage_orders");
        },
        onError: (error) => {
            toast.error(error.message ?? "Failed to delete quote.");
        }
    });

    if (isLoading) {
        return <div className="flex h-screen items-center justify-center"><Loader2 className="h-8 w-8 animate-spin" /></div>;
    }

    if (isError) {
        return <div className="flex h-screen items-center justify-center text-red-500">{error.message}</div>;
    }

    if (!quote || !user) {
        return <div className="flex h-screen items-center justify-center">Quote not found or you are not logged in.</div>;
    }

    const isClient = user.id === quote.clientId;
    const isVendor = user.id === quote.vendorId;
    
    const services = quote.services as {id: number, name: string}[];

    return (
        <>
            <div className="min-h-screen bg-gray-50 pt-[122px] text-gray-900 lg:pt-[127px]">
                <div className="container mx-auto max-w-4xl px-4 py-8 sm:px-8">
                    <button onClick={() => router.back()} className="flex items-center gap-2 text-sm font-semibold text-gray-600 hover:text-gray-900 mb-4">
                        <ArrowLeft className="h-4 w-4" />
                        Back
                    </button>

                    <div className="bg-white shadow-lg rounded-xl border border-gray-200">
                        {/* Header */}
                        <div className="p-6 border-b">
                            <h1 className="text-3xl font-bold">{quote.title}</h1>
                            <p className="text-gray-500">Quote ID #{quote.id.substring(0, 8)}</p>
                        </div>

                        {/* Body */}
                        <div className="p-6 grid md:grid-cols-3 gap-8">
                            {/* Left Column */}
                            <div className="md:col-span-2 space-y-6">
                                <div>
                                    <h3 className="font-semibold text-lg mb-2 flex items-center gap-2"><FileText className="h-5 w-5 text-pink-600"/>What&apos;s Included</h3>
                                    <ul className="list-disc list-inside space-y-1 text-gray-700">
                                        {quote.includes.map((item, i) => <li key={i}>{item}</li>)}
                                    </ul>
                                </div>
                                <div>
                                    <h3 className="font-semibold text-lg mb-2 flex items-center gap-2"><Layers className="h-5 w-5 text-blue-600"/>Services</h3>
                                    <div className="flex flex-wrap gap-2">
                                        {services.map(service => (
                                            <span key={service.id} className="bg-blue-100 text-blue-800 text-xs font-medium px-2.5 py-0.5 rounded-full">{service.name}</span>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            {/* Right Column */}
                            <div className="space-y-6">
                                <div>
                                    <h3 className="font-semibold text-lg mb-2 flex items-center gap-2"><Briefcase className="h-5 w-5 text-purple-600"/>Vendor</h3>
                                    <div className="flex items-center gap-3">
                                        <Image src={quote.vendor.vendorProfile?.avatarUrl ?? `https://placehold.co/40x40`} alt="vendor" width={40} height={40} className="rounded-full" />
                                        <div>
                                            <p className="font-semibold">{quote.vendor.vendorProfile?.companyName ?? quote.vendor.username}</p>
                                            <p className="text-sm text-gray-500">@{quote.vendor.username}</p>
                                        </div>
                                    </div>
                                </div>
                                <div>
                                    <h3 className="font-semibold text-lg mb-2 flex items-center gap-2"><User className="h-5 w-5 text-green-600"/>Client</h3>
                                    <div className="flex items-center gap-3">
                                        <Image src={quote.client.clientProfile?.avatarUrl ?? `https://placehold.co/40x40`} alt="client" width={40} height={40} className="rounded-full" />
                                        <div>
                                            <p className="font-semibold">{quote.client.clientProfile?.name ?? quote.client.username}</p>
                                            <p className="text-sm text-gray-500">@{quote.client.username}</p>
                                        </div>
                                    </div>
                                </div>
                                <div>
                                    <h3 className="font-semibold text-lg mb-2 flex items-center gap-2"><Calendar className="h-5 w-5 text-orange-600"/>Event Date</h3>
                                    <p className="text-gray-700">{new Date(quote.eventDate).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
                                </div>
                                <div>
                                    <h3 className="font-semibold text-lg mb-2 flex items-center gap-2"><Hash className="h-5 w-5 text-indigo-600"/>Status</h3>
                                    <span className={cn("text-white text-sm font-semibold mr-2 px-2.5 py-0.5 rounded-full", {
                                        "bg-yellow-500": quote.status === 'PENDING',
                                        "bg-green-500": quote.status === 'ACCEPTED',
                                        "bg-red-500": quote.status === 'REJECTED',
                                    })}>{quote.status}</span>
                                </div>
                            </div>
                        </div>
                        
                        {/* Footer */}
                        <div className="bg-gray-50 p-6 flex justify-between items-center">
                            <div>
                                <p className="text-sm text-gray-500">Total Price</p>
                                <p className="text-3xl font-bold">₦{quote.price.toLocaleString()}</p>
                            </div>
                            <div className="flex gap-3">
                                {isClient && quote.status === 'PENDING' && (
                                    <>
                                        <Button variant="outline" onClick={() => updateQuoteStatus.mutate({ id: quote.id, status: 'REJECTED' })} disabled={updateQuoteStatus.isPending}>Decline</Button>
                                        <Button onClick={handlePayNow}><Wallet className="mr-2 h-4 w-4" />Pay Now</Button>
                                    </>
                                )}
                                {isVendor && quote.status === 'PENDING' && (
                                    <>
                                        <Button variant="outline" disabled>Edit Quote</Button>
                                        <Button variant="destructive" onClick={() => deleteQuote.mutate({ id: quote.id })} disabled={deleteQuote.isPending}>Delete Quote</Button>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            {isPayModalOpen && (
                <PayQuoteModal
                    isOpen={isPayModalOpen}
                    onClose={() => setIsPayModalOpen(false)}
                    onSuccess={() => {
                        void refetch();
                    }}
                    quoteId={quote.id}
                    quoteTitle={quote.title}
                    quoteAmount={quote.price}
                />
            )}
        </>
    );
}

export default QuoteDetailPage;

// A simple button component to avoid repetition
const Button = ({ children, ...props }: React.ComponentPropsWithoutRef<'button'> & {variant?: 'outline' | 'destructive' | 'default'}) => {
    return (
        <button {...props} className={cn("px-4 py-2 rounded-md font-semibold text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center", {
            "bg-pink-600 text-white hover:bg-pink-700": !props.variant || props.variant === 'default',
            "border border-gray-300 bg-white hover:bg-gray-100 text-gray-800": props.variant === 'outline',
            "bg-red-600 text-white hover:bg-red-700": props.variant === 'destructive'
        })}>
            {children}
        </button>
    )
}
