"use client";

import { api } from "@/trpc/react";
import { useAuthStore } from "@/stores/auth";
import { useState, useEffect } from "react";
import {
  User,
  ShieldCheck,
  Building,
  Briefcase,
  Bell,
  Lock,
  CreditCard,
  ChevronDown,
  UploadCloud,
  X,
  Plus,
  AlertTriangle,
  ToggleLeft, // Added missing import
  ToggleRight, // Added missing import
} from "lucide-react";

// Mock cn function for demonstration
const cn = (...inputs: (string | boolean | undefined | null)[]) => {
  return inputs.filter(Boolean).join(" ");
};

// --- Mock Data ---
// For the State/LGA dropdowns
const statesInNigeria = {
  Lagos: [
    "Agege",
    "Alimosho",
    "Ifako-Ijaiye",
    "Ikeja",
    "Kosofe",
    "Mushin",
    "Oshodi-Isolo",
    "Shomolu",
    "Eti-Osa",
    "Lagos Island",
    "Lagos Mainland",
    "Surulere",
    "Apapa",
    "Ajeromi-Ifelodun",
    "Amuwo-Odofin",
    "Ojo",
    "Badagry",
    "Ikorodu",
    "Ibeju-Lekki",
    "Epe",
  ],
  "Abuja (FCT)": [
    "Abaji",
    "Bwari",
    "Gwagwalada",
    "Kuje",
    "Kwali",
    "Municipal Area Council",
  ],
  Rivers: ["Port Harcourt", "Obio-Akpor", "Eleme", "Okrika"],
};
// --- End Mock Data ---

// --- Main Page Component ---
const SettingsPage = () => {
  const { profile } = useAuthStore();
  const [activeSection, setActiveSection] = useState("profile");

  useEffect(() => {
    if (profile?.role === "CLIENT") {
      setActiveSection("profile");
    }
  }, [profile]);

  const renderSection = () => {
    switch (activeSection) {
      case "profile":
        return <PublicProfileForm isVendor={profile?.role === "VENDOR"} />;
      case "verification":
        return profile?.role === "VENDOR" ? <KycForm /> : null;
      case "security":
        return <SecuritySettings />;
      case "payments":
        return <PaymentSettings />;
      case "notifications":
        return <NotificationSettings />;
      default:
        return <PublicProfileForm isVendor={profile?.role === "VENDOR"} />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 pt-[122px] text-gray-900 lg:pt-[127px]">
      {/* Container */}
      <div className="container mx-auto px-4 py-8 sm:px-8">
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-4">
          {/* Left Column (Settings Sidebar) */}
          <div className="lg:col-span-1">
            <SettingsSidebar
              activeSection={activeSection}
              setActiveSection={setActiveSection}
              userType={profile?.role}
            />
          </div>

          {/* Right Column (Main Content) */}
          <div className="space-y-8 lg:col-span-3">
            {/* 1. Activation Status (Vendor only) */}
            {profile?.role === "VENDOR" &&
              profile.vendorProfile?.kycStatus !== "APPROVED" &&
              activeSection === "verification" && ( // Show only on verification tab
                <div className="rounded-md border-l-4 border-red-500 bg-red-50 p-4 shadow-sm">
                  <div className="flex">
                    <div className="flex-shrink-0">
                      <AlertTriangle className="h-5 w-5 text-red-500" />
                    </div>
                    <div className="ml-3">
                      <h3 className="text-lg font-semibold text-red-800">
                        Your Profile is Not Active
                      </h3>
                      <p className="mt-1 text-sm text-red-700">
                        Please complete your KYC Verification to activate your
                        profile and start offering gigs.
                      </p>
                    </div>
                  </div>
                </div>
              )}

            {/* 2. Render active section */}
            {renderSection()}
          </div>
        </div>
      </div>
    </div>
  );
};

// --- Sub-Components ---

const SettingsSidebar = ({ activeSection, setActiveSection, userType }: { activeSection: string; setActiveSection: (section: string) => void; userType: string | undefined }) => {
  const allLinks = [
    {
      id: "profile",
      name: "Public Profile",
      icon: User,
      for: ["client", "vendor"],
    },
    {
      id: "verification",
      name: "Verification (KYC)",
      icon: ShieldCheck,
      for: ["vendor"],
    }, // Vendor only
    {
      id: "security",
      name: "Password & Security",
      icon: Lock,
      for: ["client", "vendor"],
    },
    {
      id: "payments",
      name: "Payment Methods",
      icon: CreditCard,
      for: ["client", "vendor"],
    },
    {
      id: "notifications",
      name: "Notifications",
      icon: Bell,
      for: ["client", "vendor"],
    },
  ];

  // Filter links based on userType
  const visibleLinks = allLinks.filter((link) => userType && link.for.includes(userType.toLowerCase()));

  return (
    <div className="sticky top-[127px] rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
      <nav className="flex flex-col space-y-1">
        {visibleLinks.map((link) => (
          <button
            key={link.id}
            onClick={() => setActiveSection(link.id)}
            className={cn(
              "flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition-colors",
              activeSection === link.id
                ? "bg-pink-50 text-pink-700"
                : "text-gray-600 hover:bg-gray-50 hover:text-gray-900",
            )}
          >
            <link.icon className="h-5 w-5" />
            {link.name}
          </button>
        ))}
      </nav>
    </div>
  );
};

// --- CLIENT-ONLY SETTINGS ---
// No longer needed as a separate component

// --- VENDOR-ONLY SETTINGS ---
const KycForm = () => {
  const [fullName, setFullName] = useState("");
  const [cacNumber, setCacNumber] = useState("");
  const [businessAddress, setBusinessAddress] = useState("");

  const { mutate, isPending, error } = api.vendor.submitKyc.useMutation({
    onSuccess: () => {
      alert("KYC submitted successfully!");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    mutate({ fullName, cacNumber, businessAddress });
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-lg border border-gray-200 bg-white shadow-sm"
    >
      <div className="border-b border-gray-200 p-6">
        <h2 className="text-xl font-semibold">Verification (KYC)</h2>
        <p className="mt-1 text-sm text-gray-500">
          Submit your details to get verified as a Partygeng vendor.
        </p>
      </div>
      <div className="space-y-6 p-6">
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <FormInput
            label="Full Name (as on ID)"
            id="fullName"
            placeholder="Adebayo Popoola"
            value={fullName}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFullName(e.target.value)}
          />
          <FormInput
            label="CAC Number (if registered)"
            id="cacNumber"
            placeholder="RC123456"
            value={cacNumber}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setCacNumber(e.target.value)}
          />
        </div>
        <FormInput
          label="Business Address"
          id="address"
          placeholder="123, Main Street"
          value={businessAddress}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setBusinessAddress(e.target.value)}
        />
      </div>
      <div className="flex justify-end border-t border-gray-200 bg-gray-50 p-6">
        <button
          type="submit"
          className="rounded-md bg-pink-600 px-6 py-3 font-semibold text-white transition-colors hover:bg-pink-700"
          disabled={isPending}
        >
          {isPending ? "Submitting..." : "Submit for Verification"}
        </button>
      </div>
      {error && (
        <div className="border-t border-gray-200 bg-red-50 p-6 text-red-700">
          {error.message}
        </div>
      )}
    </form>
  );
};

// --- SHARED SETTINGS PAGES ---

const PublicProfileForm = ({ isVendor }: { isVendor: boolean }) => {
  const [skills, setSkills] = useState(["Wedding DJ", "MC"]);
  const [skillInput, setSkillInput] = useState("");

  const addSkill = () => {
    if (skillInput.trim() && !skills.includes(skillInput.trim())) {
      setSkills([...skills, skillInput.trim()]);
      setSkillInput("");
    }
  };

  const removeSkill = (skillToRemove: string) => {
    setSkills(skills.filter((skill) => skill !== skillToRemove));
  };

  return (
    <form className="rounded-lg border border-gray-200 bg-white shadow-sm">
      <div className="border-b border-gray-200 p-6">
        <h2 className="text-xl font-semibold">Public Profile</h2>
        <p className="mt-1 text-sm text-gray-500">
          This information will be visible on your public profile.
        </p>
      </div>
      <div className="space-y-6 p-6">
        {/* Profile Picture */}
        <div>
          <label className="mb-2 block text-sm font-semibold text-gray-700">
            Profile Picture
          </label>
          <div className="flex items-center gap-4">
            <img
              src={
                isVendor
                  ? "https://placehold.co/128x128/ec4899/ffffff?text=DJ"
                  : "https://placehold.co/128x128/3b82f6/ffffff?text=A"
              }
              alt="Profile"
              className="h-20 w-20 rounded-full"
            />
            {/* FIX: Corrected the broken button tag */}
            <button
              type="button"
              className="text-sm font-semibold text-pink-600 hover:text-pink-700"
            >
              Change Photo
            </button>
          </div>
        </div>

        {/* Client Name Field */}
        {!isVendor && (
          <FormInput
            label="Full Name"
            id="clientName"
            placeholder="Adebayo Popoola"
          />
        )}

        {isVendor && (
          <>
            {/* About Me */}
            <div>
              <label
                htmlFor="aboutMe"
                className="mb-2 block text-sm font-semibold text-gray-700"
              >
                About Me
              </label>
              <textarea
                id="aboutMe"
                rows={5}
                className="w-full rounded-md border border-gray-300 p-3 focus:ring-1 focus:ring-pink-500 focus:outline-pink-500"
                placeholder="Tell clients a bit about yourself and your services..."
              ></textarea>
            </div>
            {/* Skills */}
            <div>
              <label
                htmlFor="skills"
                className="mb-2 block text-sm font-semibold text-gray-700"
              >
                Skills
              </label>
              <div className="mb-2 flex flex-wrap gap-2">
                {skills.map((skill) => (
                  <span
                    key={skill}
                    className="flex items-center gap-1.5 rounded-full bg-pink-100 px-3 py-1.5 text-sm font-medium text-pink-700"
                  >
                    {skill}
                    <button
                      type="button"
                      onClick={() => removeSkill(skill)}
                      className="text-pink-500 hover:text-pink-700"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </span>
                ))}
              </div>
              <div className="flex gap-2">
                <input
                  type="text"
                  id="skills"
                  value={skillInput}
                  onChange={(e) => setSkillInput(e.target.value)}
                  onKeyDown={(e) =>
                    e.key === "Enter" && (e.preventDefault(), addSkill())
                  }
                  className="flex-grow rounded-md border border-gray-300 p-3 focus:ring-1 focus:ring-pink-500 focus:outline-pink-500"
                  placeholder="Add a new skill (e.g. Afrobeats)"
                />
                <button
                  type="button"
                  onClick={addSkill}
                  className="rounded-md bg-gray-700 px-5 py-3 font-semibold text-white transition-colors hover:bg-gray-800"
                >
                  Add
                </button>
              </div>
            </div>
          </>
        )}
      </div>
      <div className="flex justify-end border-t border-gray-200 bg-gray-50 p-6">
        <button
          type="submit"
          className="rounded-md bg-pink-600 px-6 py-3 font-semibold text-white transition-colors hover:bg-pink-700"
        >
          Save Profile
        </button>
      </div>
    </form>
  );
};

// Placeholder for Security
const SecuritySettings = () => (
  <form className="rounded-lg border border-gray-200 bg-white shadow-sm">
    <div className="border-b border-gray-200 p-6">
      <h2 className="text-xl font-semibold">Password & Security</h2>
    </div>
    <div className="space-y-6 p-6">
      <FormInput label="Current Password" id="currentPass" type="password" />
      <FormInput label="New Password" id="newPass" type="password" />
      <FormInput
        label="Confirm New Password"
        id="confirmPass"
        type="password"
      />
    </div>
    <div className="flex justify-end border-t border-gray-200 bg-gray-50 p-6">
      <button
        type="submit"
        className="rounded-md bg-pink-600 px-6 py-3 font-semibold text-white transition-colors hover:bg-pink-700"
      >
        Update Password
      </button>
    </div>
  </form>
);

// Placeholder for Payments
const PaymentSettings = () => (
  <div className="rounded-lg border border-gray-200 bg-white shadow-sm">
    <div className="border-b border-gray-200 p-6">
      <h2 className="text-xl font-semibold">Payment Methods</h2>
    </div>
    <div className="p-6">
      <p className="text-gray-600">
        Manage your payment methods and payout accounts here.
      </p>
      {/* ...Payment form would go here... */}
    </div>
  </div>
);

// Placeholder for Notifications
const NotificationSettings = () => {
  const [toggles, setToggles] = useState({
    newMessages: true,
    quoteRequests: true,
    marketing: false,
  });

  const handleToggle = (key: keyof typeof toggles) => {
    setToggles((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <div className="rounded-lg border border-gray-200 bg-white shadow-sm">
      <div className="border-b border-gray-200 p-6">
        <h2 className="text-xl font-semibold">Notifications</h2>
      </div>
      <div className="divide-y divide-gray-200 p-6">
        <div className="flex items-center justify-between py-4">
          <div>
            <h4 className="font-medium text-gray-800">New Messages</h4>
            <p className="text-sm text-gray-500">
              Notify me when I receive a new message in my inbox.
            </p>
          </div>
          <button
            onClick={() => handleToggle("newMessages")}
            className={toggles.newMessages ? "text-pink-600" : "text-gray-400"}
          >
            {toggles.newMessages ? (
              <ToggleRight className="h-10 w-10" />
            ) : (
              <ToggleLeft className="h-10 w-10" />
            )}
          </button>
        </div>
        <div className="flex items-center justify-between py-4">
          <div>
            <h4 className="font-medium text-gray-800">New Quote Requests</h4>
            <p className="text-sm text-gray-500">
              Notify me when a client requests a quote.
            </p>
          </div>
          <button
            onClick={() => handleToggle("quoteRequests")}
            className={
              toggles.quoteRequests ? "text-pink-600" : "text-gray-400"
            }
          >
            {toggles.quoteRequests ? (
              <ToggleRight className="h-10 w-10" />
            ) : (
              <ToggleLeft className="h-10 w-10" />
            )}
          </button>
        </div>
        <div className="flex items-center justify-between py-4">
          <div>
            <h4 className="font-medium text-gray-800">Marketing Emails</h4>
            <p className="text-sm text-gray-500">
              Send me news and special offers from Partygeng.
            </p>
          </div>
          <button
            onClick={() => handleToggle("marketing")}
            className={toggles.marketing ? "text-pink-600" : "text-gray-400"}
          >
            {toggles.marketing ? (
              <ToggleRight className="h-10 w-10" />
            ) : (
              <ToggleLeft className="h-10 w-10" />
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

// --- Shared Form Utilities ---

const FormInput = ({ label, id, ...props }: { label: string; id: string; [key: string]: any }) => (
  <div>
    <label
      htmlFor={id}
      className="mb-1.5 block text-sm font-semibold text-gray-700"
    >
      {label}
    </label>
    <input
      type="text"
      id={id}
      {...props}
      className="w-full rounded-md border border-gray-300 p-3 focus:ring-1 focus:ring-pink-500 focus:outline-pink-500"
    />
  </div>
);

const FormSelect = ({ label, id, options, ...props }: { label: string; id: string; options: string[]; [key: string]: any }) => (
  <div>
    <label
      htmlFor={id}
      className="mb-1.5 block text-sm font-semibold text-gray-700"
    >
      {label}
    </label>
    <div className="relative">
      <select
        id={id}
        {...props}
        className="w-full appearance-none rounded-md border border-gray-300 bg-white p-3 focus:ring-1 focus:ring-pink-500 focus:outline-pink-500"
      >
        <option value="" disabled>
          Select...
        </option>
        {options.map((option: string) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
      <ChevronDown className="pointer-events-none absolute top-1/2 right-3 h-5 w-5 -translate-y-1/2 text-gray-400" />
    </div>
  </div>
);

const FileUpload = ({ title }: { title: string }) => (
  <div>
    <label className="mb-1.5 block text-sm font-semibold text-gray-700">
      {title}
    </label>
    <div className="mt-1 flex justify-center rounded-md border-2 border-dashed border-gray-300 px-6 pt-5 pb-6">
      <div className="space-y-1 text-center">
        <UploadCloud className="mx-auto h-12 w-12 text-gray-400" />
        <div className="flex text-sm text-gray-600">
          <label
            htmlFor={`file-upload-${title.split(" ")[0]}`}
            className="relative cursor-pointer rounded-md bg-white font-medium text-pink-600 focus-within:outline-none hover:text-pink-500"
          >
            <span>Upload a file</span>
            <input
              id={`file-upload-${title.split(" ")[0]}`}
              name="file-upload"
              type="file"
              className="sr-only"
            />
          </label>
          <p className="pl-1">or drag and drop</p>
        </div>
        <p className="text-xs text-gray-500">PDF, PNG, JPG up to 10MB</p>
      </div>
    </div>
  </div>
);

export default SettingsPage;
