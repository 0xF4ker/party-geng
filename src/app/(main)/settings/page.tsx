"use client";

import { api } from "@/trpc/react";
import { useAuthStore } from "@/stores/auth";
import { useState, useEffect, useRef } from "react";
import React from "react";
import {
  User,
  ShieldCheck,
  Bell,
  Lock,
  CreditCard,
  ChevronDown,
  X,
  AlertTriangle,
  ToggleLeft, // Added missing import
  ToggleRight, // Added missing import
} from "lucide-react";
import { ImageUpload } from "@/components/ImageUpload";
import { toast } from "sonner";
import { NIGERIA_STATES_LGAS } from "@/lib/geo/nigeria";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Skeleton } from "@/components/ui/skeleton";
import {
  profileUpdateSchema,
  passwordUpdateSchema,
  kycSchema,
} from "@/lib/validations/settings";
import { type z } from "zod";
import AccountActions from "./_components/AccountActions";

// Mock cn function for demonstration
const cn = (...inputs: (string | boolean | undefined | null)[]) => {
  return inputs.filter(Boolean).join(" ");
};

// --- SKELETON COMPONENTS ---

const SettingsSidebarSkeleton = () => (
  <div className="sticky top-[127px] rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
    <div className="flex flex-col space-y-1">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="flex items-center gap-3 rounded-md px-3 py-2.5">
          <Skeleton className="h-5 w-5 rounded-md" />
          <Skeleton className="h-4 w-2/3" />
        </div>
      ))}
    </div>
  </div>
);

const PublicProfileFormSkeleton = () => (
  <div className="rounded-lg border border-gray-200 bg-white shadow-sm">
    <div className="border-b border-gray-200 p-6">
      <Skeleton className="h-6 w-1/3" />
      <Skeleton className="mt-2 h-4 w-2/3" />
    </div>
    <div className="space-y-6 p-6">
      {/* Avatar Skeleton */}
      <div className="flex items-center gap-4">
        <Skeleton className="h-24 w-24 rounded-full" />
        <div className="space-y-2">
          <Skeleton className="h-4 w-48" />
          <Skeleton className="h-4 w-64" />
        </div>
      </div>
      {/* Form Field Skeleton */}
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="space-y-2">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-12 w-full rounded-md" />
        </div>
      ))}
    </div>
    <div className="flex justify-end border-t border-gray-200 bg-gray-50 p-6">
      <Skeleton className="h-12 w-32 rounded-md" />
    </div>
  </div>
);

const SettingsPageSkeleton = () => (
  <div className="min-h-screen bg-gray-50 pt-[122px] text-gray-900 lg:pt-[127px]">
    <div className="container mx-auto px-4 py-8 sm:px-8">
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-4">
        <div className="lg:col-span-1">
          <SettingsSidebarSkeleton />
        </div>
        <div className="space-y-8 lg:col-span-3">
          <PublicProfileFormSkeleton />
        </div>
      </div>
    </div>
  </div>
);

// Use real Nigeria States/LGAs data

// --- Main Page Component ---
const SettingsPage = () => {
  const { profile, isLoading } = useAuthStore();
  const [activeSection, setActiveSection] = useState("profile");

  useEffect(() => {
    if (profile?.role === "CLIENT") {
      setActiveSection("profile");
    }
  }, [profile]);

  if (isLoading) {
    return <SettingsPageSkeleton />;
  }

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
      case "services":
        return profile?.role === "VENDOR" ? <VendorServicesForm /> : null;
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
                    <div className="shrink-0">
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

            {/* 3. Account Actions */}
            <AccountActions />
          </div>
        </div>
      </div>
    </div>
  );
};

// --- Sub-Components ---

const SettingsSidebar = ({
  activeSection,
  setActiveSection,
  userType,
}: {
  activeSection: string;
  setActiveSection: (section: string) => void;
  userType: string | undefined;
}) => {
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
      id: "services",
      name: "My Services",
      icon: User, // Using User icon for now, can change later
      for: ["vendor"],
    },
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
  const visibleLinks = allLinks.filter(
    (link) => userType && link.for.includes(userType.toLowerCase()),
  );

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
  const { profile } = useAuthStore();
  const [, setIdCardUrl] = useState<string | undefined>(undefined);
  const [, setCacDocumentUrl] = useState<string | undefined>(undefined);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset, // <-- Add reset
    formState: { errors, isValid },
  } = useForm({
    resolver: zodResolver(kycSchema),
    mode: "onChange",
  });

  // Pre-fill form with existing KYC data
  useEffect(() => {
    const kyc = profile?.vendorProfile;
    if (kyc) {
      reset({
        fullName: kyc.fullName ?? "",
        businessAddress: kyc.businessAddress ?? "",
        cacNumber: kyc.cacNumber ?? "",
        meansOfId: kyc.meansOfId ?? "",
        idNumber: kyc.idNumber ?? "",
        state: kyc.state ?? "",
        lga: kyc.lga ?? "",
        idCardUrl: kyc.idCardUrl ?? undefined,
        cacDocumentUrl: kyc.cacDocumentUrl ?? undefined,
      });
      setIdCardUrl(kyc.idCardUrl ?? undefined);
      setCacDocumentUrl(kyc.cacDocumentUrl ?? undefined);
    }
  }, [profile, reset]);

  const state = watch("state");

  const { mutate, isPending } = api.settings.submitKyc.useMutation({
    onSuccess: () => {
      toast.success("KYC submitted successfully! We'll review shortly.");
    },
    onError: (err) => toast.error(err.message),
  });

  const onSubmit = (data: z.infer<typeof kycSchema>) => {
    mutate(data);
  };

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
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
          <div>
            <FormInput
              label="Full Name (as on ID)"
              id="fullName"
              placeholder="Adebayo Popoola"
              {...register("fullName")}
            />
            {errors.fullName && (
              <p className="mt-1 text-sm text-red-600">
                {errors.fullName.message}
              </p>
            )}
          </div>
          <div>
            <FormInput
              label="Business Address"
              id="address"
              placeholder="123, Main Street"
              {...register("businessAddress")}
            />
            {errors.businessAddress && (
              <p className="mt-1 text-sm text-red-600">
                {errors.businessAddress.message}
              </p>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          <div>
            <FormSelect
              label="Means of ID"
              id="meansOfId"
              options={[
                "NIN",
                "BVN",
                "International Passport",
                "Driver's License",
                "Voter's Card",
              ]}
              {...register("meansOfId")}
            />
            {errors.meansOfId && (
              <p className="mt-1 text-sm text-red-600">
                {errors.meansOfId.message}
              </p>
            )}
          </div>
          <div>
            <FormInput
              label="ID Number"
              id="idNumber"
              placeholder="Enter ID number"
              {...register("idNumber")}
            />
            {errors.idNumber && (
              <p className="mt-1 text-sm text-red-600">
                {errors.idNumber.message}
              </p>
            )}
          </div>
          <div>
            <FormInput
              label="CAC Number (if registered)"
              id="cacNumber"
              placeholder="RC123456"
              {...register("cacNumber")}
            />
            {errors.cacNumber && (
              <p className="mt-1 text-sm text-red-600">
                {errors.cacNumber.message}
              </p>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <div>
            <FormSelect
              label="State"
              id="state"
              options={Object.keys(NIGERIA_STATES_LGAS)}
              {...register("state")}
              onChange={(e) => {
                setValue("state", e.target.value);
                setValue("lga", "");
              }}
            />
            {errors.state && (
              <p className="mt-1 text-sm text-red-600">
                {errors.state.message}
              </p>
            )}
          </div>
          <div>
            <FormSelect
              label="LGA"
              id="lga"
              options={state ? (NIGERIA_STATES_LGAS[state] ?? []) : []}
              {...register("lga")}
            />
            {errors.lga && (
              <p className="mt-1 text-sm text-red-600">{errors.lga.message}</p>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <div>
            <ImageUpload
              label="Upload ID Card"
              description="PNG, JPG, PDF up to 10MB"
              bucket="kyc-documents"
              accept="image/*,application/pdf"
              onUploadComplete={(url) => {
                setIdCardUrl(url);
                setValue("idCardUrl", url);
              }}
              fileName={`id_card-${profile?.id}`}
            />
            {errors.idCardUrl && (
              <p className="mt-1 text-sm text-red-600">
                {errors.idCardUrl.message}
              </p>
            )}
          </div>
          <div>
            <ImageUpload
              label="Upload CAC Document"
              description="PNG, JPG, PDF up to 10MB"
              bucket="kyc-documents"
              accept="image/*,application/pdf"
              onUploadComplete={(url) => {
                setCacDocumentUrl(url);
                setValue("cacDocumentUrl", url);
              }}
              fileName={`cac_document-${profile?.id}`}
            />
            {errors.cacDocumentUrl && (
              <p className="mt-1 text-sm text-red-600">
                {errors.cacDocumentUrl.message}
              </p>
            )}
          </div>
        </div>
      </div>
      <div className="flex justify-end border-t border-gray-200 bg-gray-50 p-6">
        <button
          type="submit"
          className="rounded-md bg-pink-600 px-6 py-3 font-semibold text-white transition-colors hover:bg-pink-700 disabled:opacity-50"
          disabled={!isValid || isPending}
        >
          {isPending ? "Submitting..." : "Submit for Verification"}
        </button>
      </div>
    </form>
  );
};

// --- SHARED SETTINGS PAGES ---

const SkillsInput: React.FC<{
  skills: string[];
  setSkills: React.Dispatch<React.SetStateAction<string[]>>;
}> = ({ skills, setSkills }) => {
  const [skillInput, setSkillInput] = useState("");
  const inputRef = useRef<HTMLInputElement | null>(null);

  const addSkill = () => {
    const trimmedInput = skillInput.trim();
    if (trimmedInput && !skills.includes(trimmedInput)) {
      setSkills([...skills, trimmedInput]);
      setSkillInput("");
    }
  };

  const removeSkill = (skillToRemove: string) => {
    setSkills(skills.filter((skill) => skill !== skillToRemove));
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      addSkill();
    } else if (e.key === "Backspace" && !skillInput && skills.length > 0) {
      e.preventDefault();
      removeSkill(skills[skills.length - 1] ?? "");
    }
  };

  return (
    <div>
      <label
        htmlFor="skills-input"
        className="mb-2 block text-sm font-semibold text-gray-700"
      >
        Skills
      </label>
      <div
        className="flex flex-wrap items-center gap-2 rounded-md border border-gray-300 p-2 focus-within:ring-1 focus-within:ring-pink-500 focus-within:outline-pink-500"
        onClick={() => inputRef.current?.focus()} // Focus input when clicking container
      >
        {skills.map((skill) => (
          <span
            key={skill}
            className="flex items-center gap-1.5 rounded-full bg-pink-100 px-3 py-1.5 text-sm font-medium text-pink-700"
          >
            {skill}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation(); // Prevent container click
                removeSkill(skill);
              }}
              className="text-pink-500 hover:text-pink-700"
            >
              <X className="h-4 w-4" />
            </button>
          </span>
        ))}
        {/* The input is now *inside* the wrapper */}
        <input
          ref={inputRef}
          type="text"
          id="skills-input"
          value={skillInput}
          onChange={(e) => setSkillInput(e.target.value)}
          onKeyDown={handleKeyDown}
          className="-grow min-w-[150px] bg-transparent p-1.5 text-sm outline-none"
          placeholder={
            skills.length > 0
              ? "Add more..."
              : "Add a new skill (e.g. Afrobeats)"
          }
        />
      </div>
      <p className="mt-1 text-xs text-gray-400">
        Press Enter or comma to add a skill. Press Backspace to remove.
      </p>
    </div>
  );
};

const PublicProfileForm = ({ isVendor }: { isVendor: boolean }) => {
  const { profile } = useAuthStore();
  const [skillInput, setSkillInput] = useState("");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(
    isVendor
      ? (profile?.vendorProfile?.avatarUrl ?? null)
      : (profile?.clientProfile?.avatarUrl ?? null),
  );
  const [skills, setSkills] = useState<string[]>(
    profile?.vendorProfile?.skills ?? ["Wedding DJ", "MC"],
  );

  const {
    register,
    handleSubmit,
    setValue,
    reset, // <-- Add reset
    formState: { errors },
    // watch,
  } = useForm({
    resolver: zodResolver(profileUpdateSchema),
    mode: "onChange",
  });

  // const avatarUrl = watch("avatarUrl");
  // const skills = watch("skills") ?? [];

  useEffect(() => {
    if (profile) {
      const clientProfile = profile.clientProfile;
      const vendorProfile = profile.vendorProfile;

      const commonData = {
        username: profile.username ?? "",
        avatarUrl: isVendor
          ? (vendorProfile?.avatarUrl ?? null)
          : (clientProfile?.avatarUrl ?? null),
        location: isVendor
          ? (vendorProfile?.location ?? "")
          : (clientProfile?.location ?? ""),
      };

      const specificData = isVendor
        ? {
            companyName: vendorProfile?.companyName ?? "",
            title: vendorProfile?.title ?? "",
            about: vendorProfile?.about ?? "",
            skills: vendorProfile?.skills ?? [],
            languages: vendorProfile?.languages ?? [],
          }
        : {
            name: clientProfile?.name ?? "",
          };

      const data: Partial<z.infer<typeof profileUpdateSchema>> = {
        ...commonData,
        ...specificData,
      };

      reset(data);
    }
  }, [profile, isVendor, reset]);

  const utils = api.useUtils();
  const updateProfile = api.settings.updateProfile.useMutation({
    onSuccess: async () => {
      toast.success("Profile updated");
      await utils.user.getProfile.invalidate();
    },
    onError: (err) => toast.error(err.message),
  });

  const addSkill = () => {
    if (skillInput.trim() && !skills.includes(skillInput.trim())) {
      const newSkills = [...skills, skillInput.trim()];
      setSkills(newSkills);
      setValue("skills", newSkills);
      setSkillInput("");
    }
  };

  const removeSkill = (skillToRemove: string) => {
    const newSkills = skills.filter((skill) => skill !== skillToRemove);
    setSkills(newSkills);
    setValue("skills", newSkills);
  };

  const onSubmit = (data: z.infer<typeof profileUpdateSchema>) => {
    // Filter data based on user role - only send relevant fields
    const filteredData = isVendor
      ? {
          username: data.username,
          avatarUrl: data.avatarUrl,
          companyName: data.companyName,
          title: data.title,
          about: data.about,
          skills: data.skills,
          location: data.location,
          languages: data.languages,
        }
      : {
          username: data.username,
          name: data.name,
          avatarUrl: data.avatarUrl,
          location: data.location,
        };

    console.log("Submitting profile update:", filteredData);

    updateProfile.mutate(filteredData);
  };

  return (
    <form
      className="rounded-lg border border-gray-200 bg-white shadow-sm"
      onSubmit={handleSubmit(onSubmit)}
    >
      <div className="border-b border-gray-200 p-6">
        <h2 className="text-xl font-semibold">Public Profile</h2>
        <p className="mt-1 text-sm text-gray-500">
          This information will be visible on your public profile.
        </p>
      </div>
      <div className="space-y-6 p-6">
        {/* Profile Picture */}
        <ImageUpload
          label="Profile Picture"
          currentImage={avatarUrl ?? null}
          onUploadComplete={(url) => {
            setAvatarUrl(url);
            setValue("avatarUrl", url);
          }}
          bucket="profile-images"
          fileName={`avatar-${profile?.id}`}
        />

        {/* Username */}
        <div>
          <FormInput
            label="Username"
            id="username"
            placeholder="yourusername"
            {...register("username")}
          />
          {errors.username && (
            <p className="mt-1 text-sm text-red-600">
              {errors.username.message}
            </p>
          )}
        </div>

        {/* Client Fields */}
        {!isVendor && (
          <div>
            <FormInput
              label="Full Name"
              id="clientName"
              placeholder="Adebayo Popoola"
              {...register("name")}
            />
            {errors.name && (
              <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>
            )}
          </div>
        )}

        {/* Shared Location */}
        <div>
          <FormInput
            label="Location"
            id="location"
            placeholder="Lagos, Nigeria"
            {...register("location")}
          />
          {errors.location && (
            <p className="mt-1 text-sm text-red-600">
              {errors.location.message}
            </p>
          )}
        </div>

        {isVendor && (
          <>
            <div>
              <FormInput
                label="Company Name"
                id="companyName"
                placeholder="DJ SpinMaster Entertainment"
                {...register("companyName")}
              />
              {errors.companyName && (
                <p className="mt-1 text-sm text-red-600">
                  {errors.companyName.message}
                </p>
              )}
            </div>
            <div>
              <FormInput
                label="Title"
                id="title"
                placeholder="Professional Wedding & Event DJ"
                {...register("title")}
              />
              {errors.title && (
                <p className="mt-1 text-sm text-red-600">
                  {errors.title.message}
                </p>
              )}
            </div>
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
                {...register("about")}
              ></textarea>
              {errors.about && (
                <p className="mt-1 text-sm text-red-600">
                  {errors.about.message}
                </p>
              )}
            </div>
            {/* Skills */}
            <SkillsInput skills={skills} setSkills={setSkills} />

            {/* Languages */}
            <div>
              <label className="mb-2 block text-sm font-semibold text-gray-700">
                Languages
              </label>
              <div className="mb-2 flex flex-wrap gap-2">
                {(profile?.vendorProfile?.languages ?? []).map((lang) => (
                  <span
                    key={lang}
                    className="rounded-full bg-gray-100 px-3 py-1.5 text-sm text-gray-700"
                  >
                    {lang}
                  </span>
                ))}
              </div>
            </div>
          </>
        )}
      </div>
      <div className="flex justify-end border-t border-gray-200 bg-gray-50 p-6">
        <button
          type="submit"
          disabled={updateProfile.isPending}
          className="rounded-md bg-pink-600 px-6 py-3 font-semibold text-white transition-colors hover:bg-pink-700 disabled:opacity-50"
        >
          {updateProfile.isPending ? "Saving..." : "Save Profile"}
        </button>
      </div>
    </form>
  );
};

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

// --- VENDOR-ONLY SETTINGS ---
const VendorServicesForm = () => {
  const { profile } = useAuthStore();
  const [selectedServiceIds, setSelectedServiceIds] = useState<number[]>([]);

  const { data: allServices, isLoading: isLoadingAllServices } =
    api.category.getAll.useQuery();
  const { data: userProfile, isLoading: isLoadingUserProfile } =
    api.user.getProfile.useQuery();

  useEffect(() => {
    if (userProfile?.vendorProfile?.services) {
      setSelectedServiceIds(
        userProfile.vendorProfile.services.map((s) => s.serviceId),
      );
    }
  }, [userProfile]);

  const utils = api.useUtils();
  const updateServices = api.settings.updateVendorServices.useMutation({
    onSuccess: async () => {
      toast.success("Services updated successfully!");
      await utils.user.getProfile.invalidate(); // Invalidate to refetch vendor's services
    },
    onError: (err) => toast.error(err.message),
  });

  const handleServiceToggle = (serviceId: number) => {
    setSelectedServiceIds((prev) =>
      prev.includes(serviceId)
        ? prev.filter((id) => id !== serviceId)
        : [...prev, serviceId],
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateServices.mutate({ serviceIds: selectedServiceIds });
  };

  if (isLoadingAllServices || isLoadingUserProfile) {
    return (
      <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
        <Skeleton className="h-6 w-1/3" />
        <Skeleton className="mt-2 h-4 w-2/3" />
        <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-12 w-full rounded-md" />
          ))}
        </div>
        <div className="mt-6 flex justify-end">
          <Skeleton className="h-12 w-32 rounded-md" />
        </div>
      </div>
    );
  }

  if (profile?.role !== "VENDOR") {
    return (
      <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
        <p className="text-red-600">You must be a vendor to manage services.</p>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-lg border border-gray-200 bg-white shadow-sm"
    >
      <div className="border-b border-gray-200 p-6">
        <h2 className="text-xl font-semibold">My Services</h2>
        <p className="mt-1 text-sm text-gray-500">
          Select the services you offer to clients.
        </p>
      </div>
      <div className="space-y-6 p-6">
        {allServices && allServices.length > 0 ? (
          allServices.map((category) => (
            <div key={category.id}>
              <h3 className="mb-3 text-lg font-semibold text-gray-800">
                {category.name}
              </h3>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {category.services.map((service) => (
                  <label
                    key={service.id}
                    htmlFor={`service-${service.id}`}
                    className="flex cursor-pointer items-center rounded-md border border-gray-300 bg-white p-4 shadow-sm transition-all hover:border-pink-500 hover:shadow-md"
                  >
                    <input
                      type="checkbox"
                      id={`service-${service.id}`}
                      checked={selectedServiceIds.includes(service.id)}
                      onChange={() => handleServiceToggle(service.id)}
                      className="h-5 w-5 rounded border-gray-300 text-pink-600 focus:ring-pink-500"
                    />
                    <span className="ml-3 text-sm font-medium text-gray-700">
                      {service.name}
                    </span>
                  </label>
                ))}
              </div>
            </div>
          ))
        ) : (
          <p className="text-gray-600">No services available yet.</p>
        )}
      </div>
      <div className="flex justify-end border-t border-gray-200 bg-gray-50 p-6">
        <button
          type="submit"
          className="rounded-md bg-pink-600 px-6 py-3 font-semibold text-white transition-colors hover:bg-pink-700 disabled:opacity-50"
          disabled={updateServices.isPending}
        >
          {updateServices.isPending ? "Saving..." : "Save Services"}
        </button>
      </div>
    </form>
  );
};

// Placeholder for Security
const SecuritySettings = () => {
  const {
    register,
    handleSubmit,
    formState: { errors, isValid },
  } = useForm({
    resolver: zodResolver(passwordUpdateSchema),
    mode: "onChange",
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    },
  });

  const updatePassword = api.settings.updatePassword.useMutation({
    onSuccess: () => toast.success("Password updated"),
    onError: (err) => toast.error(err.message),
  });

  const onSubmit = (data: z.infer<typeof passwordUpdateSchema>) => {
    updatePassword.mutate({
      currentPassword: data.currentPassword,
      newPassword: data.newPassword,
    });
  };

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="rounded-lg border border-gray-200 bg-white shadow-sm"
    >
      <div className="border-b border-gray-200 p-6">
        <h2 className="text-xl font-semibold">Password & Security</h2>
      </div>
      <div className="space-y-6 p-6">
        <div>
          <FormInput
            label="Current Password"
            id="currentPass"
            type="password"
            {...register("currentPassword")}
          />
          {errors.currentPassword && (
            <p className="mt-1 text-sm text-red-600">
              {errors.currentPassword.message}
            </p>
          )}
        </div>
        <div>
          <FormInput
            label="New Password"
            id="newPass"
            type="password"
            {...register("newPassword")}
          />
          {errors.newPassword && (
            <p className="mt-1 text-sm text-red-600">
              {errors.newPassword.message}
            </p>
          )}
        </div>
        <div>
          <FormInput
            label="Confirm New Password"
            id="confirmPass"
            type="password"
            {...register("confirmPassword")}
          />
          {errors.confirmPassword && (
            <p className="mt-1 text-sm text-red-600">
              {errors.confirmPassword.message}
            </p>
          )}
        </div>
      </div>
      <div className="flex justify-end border-t border-gray-200 bg-gray-50 p-6">
        <button
          type="submit"
          disabled={!isValid || updatePassword.isPending}
          className="rounded-md bg-pink-600 px-6 py-3 font-semibold text-white transition-colors hover:bg-pink-700 disabled:opacity-50"
        >
          {updatePassword.isPending ? "Updating..." : "Update Password"}
        </button>
      </div>
    </form>
  );
};

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

const FormInput = React.forwardRef<
  HTMLInputElement,
  {
    label: string;
    id: string;
  } & React.InputHTMLAttributes<HTMLInputElement>
>(({ label, id, type = "text", ...props }, ref) => (
  <div>
    <label
      htmlFor={id}
      className="mb-1.5 block text-sm font-semibold text-gray-700"
    >
      {label}
    </label>
    <input
      ref={ref}
      type={type}
      id={id}
      {...props}
      className="w-full rounded-md border border-gray-300 p-3 focus:ring-1 focus:ring-pink-500 focus:outline-pink-500"
    />
  </div>
));
FormInput.displayName = "FormInput";

const FormSelect = React.forwardRef<
  HTMLSelectElement,
  {
    label: string;
    id: string;
    options: string[];
  } & React.SelectHTMLAttributes<HTMLSelectElement>
>(({ label, id, options, ...props }, ref) => (
  <div>
    <label
      htmlFor={id}
      className="mb-1.5 block text-sm font-semibold text-gray-700"
    >
      {label}
    </label>
    <div className="relative">
      <select
        ref={ref}
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
));
FormSelect.displayName = "FormSelect";

export default SettingsPage;
