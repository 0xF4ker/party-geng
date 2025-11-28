"use client";

import { useParams } from "next/navigation";
import { api } from "@/trpc/react";
import { Loader2, CheckCircle, XCircle, HelpCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { GuestStatus } from "@prisma/client";
import { useState } from "react";
import { toast } from "sonner";

const InvitationPage = () => {
    const { token } = useParams<{ token: string }>();
    const [responseSent, setResponseSent] = useState<GuestStatus | null>(null);

    const { data: guest, isLoading, error } = api.invitation.getGuestByToken.useQuery({ token });

    const respondMutation = api.invitation.respondToInvitation.useMutation({
        onSuccess: (data) => {
            setResponseSent(data.status);
            toast.success("Your response has been recorded!");
        },
        onError: (error) => {
            toast.error(error.message);
        }
    });

    if (isLoading) {
        return <div className="flex h-screen items-center justify-center"><Loader2 className="h-16 w-16 animate-spin text-pink-600" /></div>;
    }

    if (error || !guest) {
        return <div className="flex h-screen items-center justify-center"><p className="text-xl text-red-500">{error?.message ?? "Invitation not found."}</p></div>;
    }
    
    const event = guest.list.event;

    const handleResponse = (status: GuestStatus) => {
        respondMutation.mutate({ token, status });
    }

    if (responseSent) {
        return (
            <div className="flex h-screen items-center justify-center bg-gray-50">
                <Card className="w-full max-w-md text-center">
                    <CardHeader>
                        <CardTitle className="text-2xl">Thank You!</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="mb-4">Your response has been recorded as <Badge>{responseSent}</Badge>.</p>
                        <p>We've notified the host.</p>
                    </CardContent>
                </Card>
            </div>
        )
    }

    return (
        <div className="flex h-screen items-center justify-center bg-gray-50 p-4">
            <Card className="w-full max-w-md">
                <CardHeader>
                    <p className="text-sm text-muted-foreground">You are invited to</p>
                    <CardTitle className="text-2xl">{event.title}</CardTitle>
                    <CardDescription>
                        on {new Date(event.date).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div>
                        <h4 className="font-semibold">Hello, {guest.name}!</h4>
                        <p className="text-muted-foreground">Please let us know if you can make it.</p>
                    </div>
                    <div className="flex gap-2">
                        <Button className="flex-1 bg-green-500 hover:bg-green-600" onClick={() => handleResponse(GuestStatus.ATTENDING)}>
                            <CheckCircle className="mr-2 h-4 w-4" /> Attending
                        </Button>
                        <Button className="flex-1" variant="outline" onClick={() => handleResponse(GuestStatus.MAYBE)}>
                            <HelpCircle className="mr-2 h-4 w-4" /> Maybe
                        </Button>
                        <Button className="flex-1" variant="destructive" onClick={() => handleResponse(GuestStatus.DECLINED)}>
                            <XCircle className="mr-2 h-4 w-4" /> Decline
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}

export default InvitationPage;
