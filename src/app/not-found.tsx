import Link from "next/link";
import { Home, Search } from "lucide-react";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-pink-50 via-white to-purple-50 px-4">
      <div className="text-center">
        {/* 404 Text */}
        <h1 className="brand-text-gradient mb-4 text-9xl font-bold">404</h1>
        
        {/* Message */}
        <h2 className="mb-2 text-3xl font-bold text-gray-800">
          Page Not Found
        </h2>
        <p className="mb-8 text-lg text-gray-600">
          Sorry, the page you're looking for doesn't exist or has been moved.
        </p>

        {/* Action Buttons */}
        <div className="flex flex-col gap-4 sm:flex-row sm:justify-center">
          <Link
            href="/"
            className="flex items-center justify-center gap-2 rounded-md bg-pink-600 px-6 py-3 font-semibold text-white transition-colors hover:bg-pink-700"
          >
            <Home className="h-5 w-5" />
            Go Home
          </Link>
          <Link
            href="/categories"
            className="flex items-center justify-center gap-2 rounded-md border border-pink-600 bg-white px-6 py-3 font-semibold text-pink-600 transition-colors hover:bg-pink-50"
          >
            <Search className="h-5 w-5" />
            Browse Services
          </Link>
        </div>
      </div>
    </div>
  );
}
