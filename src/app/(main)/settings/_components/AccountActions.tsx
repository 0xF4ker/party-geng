"use client";

import React from "react";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";

const AccountActions = () => {
  const { signOut } = useAuth();

  const handleDeleteAccount = () => {
    // TODO: Implement account deletion with a confirmation modal
    alert("Account deletion functionality not yet implemented.");
  };

  return (
    <div className="space-y-4">
      <div className="rounded-lg border border-gray-200 p-4">
        <h3 className="text-lg font-medium">Account Actions</h3>
        <p className="mt-1 text-sm text-gray-600">
          Manage your account settings and actions.
        </p>
      </div>
      <div className="rounded-lg border border-gray-200 p-4">
        <div className="flex items-center justify-between">
          <div>
            <h4 className="font-medium">Sign Out</h4>
            <p className="text-sm text-gray-600">
              You will be returned to the login screen.
            </p>
          </div>
          <Button variant="outline" onClick={() => signOut()}>
            Sign Out
          </Button>
        </div>
      </div>
      <div className="rounded-lg border border-red-500 bg-red-50 p-4">
        <div className="flex items-center justify-between">
          <div>
            <h4 className="font-medium text-red-800">Delete Account</h4>
            <p className="text-sm text-red-700">
              Permanently delete your account and all of your content.
            </p>
          </div>
          <Button variant="destructive" onClick={handleDeleteAccount}>
            Delete
          </Button>
        </div>
      </div>
    </div>
  );
};

export default AccountActions;
