import React, { useState } from "react";
import { signIn } from "next-auth/react";
import { FcGoogle } from "react-icons/fc";
import { Mail, X, ArrowLeft, Check } from "lucide-react";
import { SiApple, SiFacebook } from "react-icons/si";

interface LoginJoinProps {
  isModal?: boolean;
  initialView?: "login" | "join";
  onClose?: () => void; // Function to close the modal
}

const LoginJoinComponent: React.FC<LoginJoinProps> = ({
  isModal = false,
  initialView = "login",
  onClose,
}) => {
  const [view, setView] = useState<"login" | "join">(initialView);
  const [showEmailForm, setShowEmailForm] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");

  const handleGoogleSignIn = () => {
    signIn("google");
  };

  const handleEmailContinue = () => {
    setShowEmailForm(true);
  };

  const handleBack = () => {
    setShowEmailForm(false);
    setEmail("");
    setPassword("");
    setUsername("");
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (view === "login") {
      signIn("credentials", { email: email || username, password });
    } else {
      // Handle join logic (e.g., register user)
      console.log("Join with:", { email, password, username });
    }
  };

  const toggleView = () => {
    setView(view === "login" ? "join" : "login");
  };

  return (
    <div
      className={`relative flex overflow-hidden bg-white shadow-xl ${
        isModal
          ? "h-full w-full sm:h-[645px] sm:max-h-[90vh] sm:max-w-4xl sm:rounded-lg"
          : "min-h-screen w-screen sm:mx-auto sm:my-12 sm:h-[645px] sm:max-h-[90vh] sm:min-h-0 sm:w-full sm:max-w-4xl sm:rounded-lg"
      }`}
    >
      {isModal && (
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-20 text-gray-400 hover:text-gray-600"
        >
          <X className="h-6 w-6" />
        </button>
      )}

      {/* Left section with background image for desktop */}
      <div
        className="relative hidden w-1/2 flex-col justify-center bg-cover bg-center p-12 lg:flex"
        style={{
          backgroundImage:
            "url(https://placehold.co/600x800/a78bfa/ffffff/png?text=Partygeng&font=inter)", // Using a relevant placeholder
        }}
      >
        {/* Overlay */}
        <div className="absolute inset-0 bg-purple-800 opacity-75"></div>

        {/* Content */}
        <div className="relative z-10 text-white">
          <h2 className="mb-6 text-4xl leading-tight font-bold">
            Success starts here.
          </h2>
          <ul className="space-y-4">
            <li className="flex items-center gap-3 text-lg">
              <Check className="h-6 w-6 flex-shrink-0" />
              <span>Over 700 categories for your events.</span>
            </li>
            <li className="flex items-center gap-3 text-lg">
              <Check className="h-6 w-6 flex-shrink-0" />
              <span>Quality work done faster.</span>
            </li>
            <li className="flex items-center gap-3 text-lg">
              <Check className="h-6 w-6 flex-shrink-0" />
              <span>Access to talent and businesses across the globe.</span>
            </li>
          </ul>
        </div>
      </div>

      {/* Right section with form */}
      <div className="w-full overflow-y-auto px-4 py-8 sm:px-8 lg:w-1/2 lg:p-8">
        {/* Logo for mobile, hidden on large screens */}
        <div className="mb-6 lg:hidden">
          <h1 className="text-3xl font-bold text-purple-600">Partygeng.</h1>
        </div>

        {!showEmailForm ? (
          <div className="flex h-full flex-col justify-between">
            <div>
              {/* Mobile heading (from reference) */}
              <h2 className="mb-2 text-3xl font-semibold text-gray-800 lg:hidden">
                Success starts here.
              </h2>
              {/* Desktop heading */}
              <h2 className="mb-2 hidden text-3xl font-semibold text-gray-800 lg:block">
                {view === "login"
                  ? "Sign in to your account"
                  : "Create a new account"}
              </h2>
              <p className="mb-8 text-gray-600">
                {view === "login"
                  ? "Don't have an account?"
                  : "Already have an account?"}{" "}
                <button
                  onClick={toggleView}
                  className="font-semibold text-purple-600 hover:text-purple-800"
                >
                  {view === "login" ? "Join here" : "Sign in"}
                </button>
              </p>

              <div className="space-y-4">
                <button
                  onClick={handleGoogleSignIn}
                  className="flex w-full items-center justify-center gap-3 rounded-lg border border-gray-300 px-4 py-3 font-semibold text-gray-700 hover:bg-gray-50"
                >
                  <FcGoogle /> Continue with Google
                </button>
                <button
                  onClick={handleEmailContinue}
                  className="flex w-full items-center justify-center gap-3 rounded-lg border border-gray-300 px-4 py-3 font-semibold text-gray-700 hover:bg-gray-50"
                >
                  <Mail className="text-xl text-gray-600" /> Continue with
                  email/username
                </button>
              </div>

              <div className="my-8 flex items-center">
                <div className="flex-grow border-t border-gray-300"></div>
                <span className="mx-4 flex-shrink text-sm font-medium text-gray-400">
                  OR
                </span>
                <div className="flex-grow border-t border-gray-300"></div>
              </div>

              <div className="flex gap-4">
                <button className="flex w-full items-center justify-center gap-3 rounded-lg border border-gray-300 px-4 py-3 font-semibold text-gray-700 hover:bg-gray-50">
                  <SiApple /> Apple
                </button>
                <button className="flex w-full items-center justify-center gap-3 rounded-lg border border-gray-300 px-4 py-3 font-semibold text-gray-700 hover:bg-gray-50">
                  <SiFacebook className="text-blue-600" /> Facebook
                </button>
              </div>
            </div>

            <p className="mt-8 text-center text-xs text-gray-500">
              By joining, you agree to the Partygeng{" "}
              <a href="#" className="text-purple-600 hover:underline">
                Terms of Service
              </a>{" "}
              and{" "}
              <a href="#" className="text-purple-600 hover:underline">
                Privacy Policy
              </a>
              .
            </p>
          </div>
        ) : (
          <div className="">
            <button
              type="button"
              onClick={handleBack}
              className="mb-6 text-gray-500 hover:text-gray-800"
            >
              <ArrowLeft className="h-6 w-6" />
            </button>
            <h2 className="mb-6 text-3xl font-semibold text-gray-800">
              {view === "login" ? "Sign in" : "Join with your email"}
            </h2>
            <form onSubmit={handleSubmit}>
              <div className="mb-4">
                <label
                  htmlFor="email"
                  className="mb-2 block text-sm font-semibold text-gray-700"
                >
                  {view === "login" ? "Email or username" : "Email"}
                </label>
                <input
                  type="text"
                  id="email"
                  className="w-full appearance-none rounded-lg border border-gray-300 px-3 py-3 leading-tight text-gray-900 shadow-sm focus:border-purple-500 focus:ring-2 focus:ring-purple-500 focus:outline-none"
                  placeholder={
                    view === "login"
                      ? "Enter email or username"
                      : "name@example.com"
                  }
                  value={view === "login" ? username : email}
                  onChange={(e) =>
                    view === "login"
                      ? setUsername(e.target.value)
                      : setEmail(e.target.value)
                  }
                  required
                />
              </div>
              <div className="mb-6">
                <label
                  htmlFor="password"
                  className="mb-2 block text-sm font-semibold text-gray-700"
                >
                  Password
                </label>
                <input
                  type="password"
                  id="password"
                  className="w-full appearance-none rounded-lg border border-gray-300 px-3 py-3 leading-tight text-gray-900 shadow-sm focus:border-purple-500 focus:ring-2 focus:ring-purple-500 focus:outline-none"
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                {view === "join" && (
                  <div className="mt-2 text-xs text-gray-500">
                    <p>At least 8 characters</p>
                    <p>Combine upper and lowercase letters and numbers</p>
                  </div>
                )}
                {view === "login" && (
                  <a
                    href="#"
                    className="mt-2 inline-block align-baseline text-sm font-semibold text-purple-600 hover:text-purple-800"
                  >
                    Forgot password?
                  </a>
                )}
              </div>
              <button
                type="submit"
                className="focus:shadow-outline w-full rounded-lg bg-purple-600 px-4 py-3 font-bold text-white hover:bg-purple-700 focus:outline-none"
              >
                {view === "login" ? "Sign In" : "Continue"}
              </button>
            </form>
            <p className="mt-8 text-center text-xs text-gray-500">
              By joining, you agree to the Partygeng{" "}
              <a href="#" className="text-purple-600 hover:underline">
                Terms of Service
              </a>{" "}
              and to occasionally receive emails from us. Please read our{" "}
              <a href="#" className="text-purple-600 hover:underline">
                Privacy Policy
              </a>{" "}
              to learn how we use your personal data.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default LoginJoinComponent;
