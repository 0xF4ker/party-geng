"use client";
// @ts-nocheck

import React, { useState, useEffect, useRef, useLayoutEffect } from "react";
import {
  Star,
  Heart,
  Check,
  MapPin,
  Languages,
  Award,
  MessageSquare,
  Clock,
  Briefcase,
  Users,
  Plus,
  List,
  Edit,
  Image as ImageIcon,
  MessageCircle,
  Calendar,
  Search,
  Gift,
  ChevronRight,
  LayoutGrid,
  DollarSign,
  TrendingUp,
  AlertTriangle,
  Mail,
  ToggleLeft,
  ToggleRight,
  Eye,
  MoreVertical,
  BarChart,
  MousePointerClick,
  Trash2,
  CheckCircle,
  ChevronDown,
  UploadCloud, // For image upload
  Circle, // For stepper
  X, // For removing items
} from "lucide-react";

// Mock cn function for demonstration
const cn = (...inputs: (string | boolean | undefined | null)[]) => {
  return inputs.filter(Boolean).join(" ");
};

// --- Mock Data ---
const categories = [
  { name: "Music & DJs", services: ["DJ", "Live Band", "Solo Musician", "MC"] },
  {
    name: "Food & Beverage",
    services: ["Catering", "Bartender", "Cake Artist"],
  },
  { name: "Media", services: ["Photographer", "Videographer", "Photobooth"] },
  { name: "Planning", services: ["Event Planner", "Day-of Coordinator"] },
];

const steps = [
  { id: 1, name: "Overview", icon: Edit },
  { id: 2, name: "Pricing", icon: DollarSign },
  { id: 3, name: "Description & FAQ", icon: List },
  { id: 4, name: "Gallery", icon: ImageIcon },
  { id: 5, name: "Publish", icon: CheckCircle },
];
// --- End Mock Data ---

// --- Main Page Component ---
const CreateGigPage = () => {
  const [isSidebarSticky, setIsSidebarSticky] = useState(false);
  const [sidebarWidth, setSidebarWidth] = useState(0);
  const sidebarRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const [activeStep, setActiveStep] = useState(1);

  // --- Form State ---
  // Step 1
  const [selectedCategory, setSelectedCategory] = useState(categories[0]);
  const [gigTitle, setGigTitle] = useState("");
  // Step 2
  const [basePrice, setBasePrice] = useState("");
  const [baseIncludes, setBaseIncludes] = useState(
    "- 4 hours of service\n- Professional sound system\n- MC services",
  );
  const [addOns, setAddOns] = useState([
    { title: "Extra Hour", price: 25000 },
    { title: "Dance Floor Lighting", price: 40000 },
  ]);
  // Step 3
  const [description, setDescription] = useState("");
  const [faqs, setFaqs] = useState([
    {
      q: "Do you take song requests?",
      a: "Yes, I'm happy to take requests on the night, as long as they fit the vibe of the event!",
    },
  ]);

  // Effect to capture sidebar width
  useLayoutEffect(() => {
    const sidebarEl = sidebarRef.current;
    if (sidebarEl && window.innerWidth >= 1024) {
      setSidebarWidth(sidebarEl.offsetWidth);
    }

    const handleResize = () => {
      if (sidebarEl && window.innerWidth >= 1024) {
        if (!isSidebarSticky) {
          sidebarEl.style.width = "auto"; // Reset to get natural width
        }
        setSidebarWidth(sidebarEl.offsetWidth);
      }
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [isSidebarSticky]);

  // Effect for sticky sidebar
  useEffect(() => {
    if (window.innerWidth < 1024) return; // Only run sticky logic on desktop

    const sidebarEl = sidebarRef.current;
    const contentEl = contentRef.current;
    if (!sidebarEl || !contentEl) return;

    const topOffset = 127; // Your header height

    const handleScroll = () => {
      if (!sidebarEl || !contentEl) return;

      const contentRect = contentEl.getBoundingClientRect();
      const sidebarRect = sidebarEl.getBoundingClientRect();
      const contentBottom = contentRect.bottom + window.scrollY - topOffset;
      const sidebarHeight = sidebarEl.offsetHeight;
      const stickyTop = document.documentElement.scrollTop + topOffset;

      const startStickyOffset = contentEl.offsetTop;

      if (stickyTop > startStickyOffset) {
        setIsSidebarSticky(true);
      } else {
        setIsSidebarSticky(false);
      }

      if (isSidebarSticky && stickyTop + sidebarHeight > contentBottom) {
        sidebarEl.style.transform = `translateY(${contentBottom - (stickyTop + sidebarHeight)}px)`;
      } else {
        sidebarEl.style.transform = "translateY(0px)";
      }
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, [isSidebarSticky]);

  const handleNextStep = () => {
    if (activeStep < steps.length) {
      setActiveStep(activeStep + 1);
      window.scrollTo(0, 0); // Scroll to top on step change
    }
  };

  const handlePrevStep = () => {
    if (activeStep > 1) {
      setActiveStep(activeStep - 1);
      window.scrollTo(0, 0);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 pt-[122px] text-gray-900 lg:pt-[127px]">
      {/* Stepper Header */}
      <div className="sticky top-[122px] z-20 border-b border-gray-200 bg-white lg:top-[127px]">
        <div className="container mx-auto px-4 sm:px-8">
          {/* FIX: Stepper is now clickable */}
          <GigFormStepper
            currentStep={activeStep}
            onStepClick={setActiveStep}
          />
        </div>
      </div>

      {/* Container */}
      <div className="container mx-auto px-4 py-8 sm:px-8">
        {/* Main Layout Grid */}
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
          {/* Left Column (Main Form) */}
          <div className="space-y-8 lg:col-span-2" ref={contentRef}>
            {/* --- STEP 1: OVERVIEW --- */}
            {activeStep === 1 && (
              <OverviewForm
                gigTitle={gigTitle}
                setGigTitle={setGigTitle}
                selectedCategory={selectedCategory}
                setSelectedCategory={setSelectedCategory}
              />
            )}

            {/* --- STEP 2: PRICING --- */}
            {activeStep === 2 && (
              <PricingForm
                basePrice={basePrice}
                setBasePrice={setBasePrice}
                baseIncludes={baseIncludes}
                setBaseIncludes={setBaseIncludes}
                addOns={addOns}
                setAddOns={setAddOns}
              />
            )}

            {/* --- STEP 3: DESCRIPTION & FAQ --- */}
            {activeStep === 3 && (
              <DescriptionForm
                description={description}
                setDescription={setDescription}
                faqs={faqs}
                setFaqs={setFaqs}
              />
            )}

            {/* --- STEP 4: GALLERY --- */}
            {activeStep === 4 && <GalleryForm />}

            {/* --- STEP 5: PUBLISH --- */}
            {activeStep === 5 && <PublishForm />}

            {/* Save Button */}
            <div className="flex justify-between">
              <button
                onClick={handlePrevStep}
                className={cn(
                  "rounded-md border border-gray-300 bg-white px-6 py-3 font-semibold text-gray-700 transition-colors hover:bg-gray-100",
                  activeStep === 1 && "invisible", // Hide on first step
                )}
              >
                Back
              </button>
              <button
                onClick={handleNextStep}
                className="rounded-md bg-pink-600 px-6 py-3 font-semibold text-white transition-colors hover:bg-pink-700"
              >
                {activeStep === steps.length
                  ? "Save & Publish"
                  : "Save & Continue"}
              </button>
            </div>
          </div>

          {/* Right Column (Sticky Sidebar on Desktop) */}
          <div className="relative lg:col-span-1">
            {/* Mobile View: Static Card */}
            <div className="lg:hidden">
              <DynamicHelperCard activeStep={activeStep} />
            </div>
            {/* Desktop View: Sticky Wrapper */}
            <div
              ref={sidebarRef}
              className={cn(
                "hidden w-full transition-all duration-100 lg:block",
                isSidebarSticky ? "fixed" : "relative",
              )}
              style={
                isSidebarSticky
                  ? {
                      top: "127px",
                      width: `${sidebarWidth}px`, // Apply the saved width
                      transform: sidebarRef.current
                        ? sidebarRef.current.style.transform
                        : "translateY(0px)",
                    }
                  : {
                      width: "auto",
                      top: "auto",
                      transform: "translateY(0px)",
                    }
              }
            >
              <DynamicHelperCard activeStep={activeStep} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// --- Sub-Components ---

const GigFormStepper = ({
  currentStep,
  onStepClick,
}: {
  currentStep: number;
  onStepClick: (step: number) => void;
}) => (
  <div className="flex items-center justify-center overflow-x-auto py-4 lg:justify-start">
    {steps.map((step, index) => (
      <React.Fragment key={step.id}>
        <button
          onClick={() => onStepClick(step.id)}
          className="flex flex-col items-center gap-2 text-center sm:flex-row sm:text-left"
        >
          <div
            className={cn(
              "flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold",
              step.id === currentStep
                ? "bg-pink-600 text-white"
                : step.id < currentStep
                  ? "bg-green-500 text-white"
                  : "bg-gray-200 text-gray-500",
            )}
          >
            {step.id < currentStep ? <Check className="h-5 w-5" /> : step.id}
          </div>
          <div className="flex flex-col">
            <span
              className={cn(
                "text-xs text-gray-400 uppercase",
                step.id === currentStep && "font-semibold",
              )}
            >
              STEP {step.id}
            </span>
            <span
              className={cn(
                "font-semibold",
                step.id === currentStep ? "text-gray-800" : "text-gray-500",
              )}
            >
              {step.name}
            </span>
          </div>
        </button>
        {index < steps.length - 1 && (
          <div className="mx-2 hidden h-0.5 w-10 flex-grow bg-gray-200 sm:block sm:w-16"></div>
        )}
      </React.Fragment>
    ))}
  </div>
);

// --- Form Step Components ---

const OverviewForm = ({
  gigTitle,
  setGigTitle,
  selectedCategory,
  setSelectedCategory,
}) => (
  <div className="rounded-lg border border-gray-200 bg-white shadow-sm">
    <div className="border-b border-gray-200 p-6">
      <h2 className="text-xl font-semibold">Gig Overview</h2>
    </div>
    <form className="space-y-6 p-6">
      {/* Gig Title */}
      <div>
        <label
          htmlFor="gigTitle"
          className="mb-2 block text-sm font-semibold text-gray-700"
        >
          Gig title
          <span className="ml-1 font-normal text-gray-400">
            (Write a clear, concise title that describes the service you offer)
          </span>
        </label>
        <div className="flex items-center">
          <input
            type="text"
            id="gigTitle"
            value={gigTitle}
            onChange={(e) => setGigTitle(e.target.value)}
            maxLength={80}
            className="w-full flex-grow rounded-md border border-gray-300 p-3 focus:ring-1 focus:ring-pink-500 focus:outline-pink-500"
            placeholder="e.g. Professional Wedding DJ for Lagos & Abuja Events"
          />
        </div>
        <p className="mt-1 text-right text-xs text-gray-400">
          {gigTitle.length} / 80 max
        </p>
      </div>

      {/* Category */}
      <div>
        <label className="mb-2 block text-sm font-semibold text-gray-700">
          Category
          <span className="ml-1 font-normal text-gray-400">
            (Choose the most suitable category for your gig)
          </span>
        </label>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <SelectBox
            value={selectedCategory.name}
            options={categories.map((c) => c.name)}
            onChange={(val) =>
              setSelectedCategory(
                categories.find((c) => c.name === val) || categories[0],
              )
            }
          />
          <SelectBox options={selectedCategory.services} />
        </div>
      </div>

      {/* Search Tags */}
      <div>
        <label
          htmlFor="searchTags"
          className="mb-2 block text-sm font-semibold text-gray-700"
        >
          Search tags
          <span className="ml-1 font-normal text-gray-400">
            (Tag your gig with buzzwords that are relevant to the services you
            offer. 5 tags maximum.)
          </span>
        </label>
        <input
          type="text"
          id="searchTags"
          className="w-full rounded-md border border-gray-300 p-3 focus:ring-1 focus:ring-pink-500 focus:outline-pink-500"
          placeholder="e.g. Wedding DJ, Afrobeats, MC, Party, Lagos"
        />
        <p className="mt-1 text-xs text-gray-400">
          5 tags maximum. Use letters and numbers only.
        </p>
      </div>
    </form>
  </div>
);

const PricingForm = ({
  basePrice,
  setBasePrice,
  baseIncludes,
  setBaseIncludes,
  addOns,
  setAddOns,
}) => {
  const handleAddOnTitleChange = (index, value) => {
    const newAddOns = [...addOns];
    newAddOns[index].title = value;
    setAddOns(newAddOns);
  };

  const handleAddOnPriceChange = (index, value) => {
    const newAddOns = [...addOns];
    newAddOns[index].price = Number(value);
    setAddOns(newAddOns);
  };

  const addAddOn = () => {
    setAddOns([...addOns, { title: "", price: 0 }]);
  };

  const removeAddOn = (index) => {
    setAddOns(addOns.filter((_, i) => i !== index));
  };

  return (
    <div className="rounded-lg border border-gray-200 bg-white shadow-sm">
      <div className="border-b border-gray-200 p-6">
        <h2 className="text-xl font-semibold">Pricing</h2>
      </div>
      <form className="space-y-6 p-6">
        {/* Base Price */}
        <div>
          <label
            htmlFor="basePrice"
            className="mb-2 block text-sm font-semibold text-gray-700"
          >
            Base Price
            <span className="ml-1 font-normal text-gray-400">
              (Your "Starting at" price)
            </span>
          </label>
          <div className="relative">
            <span className="absolute top-0 bottom-0 left-0 flex items-center p-3 font-medium text-gray-500">
              ₦
            </span>
            <input
              type="number"
              id="basePrice"
              value={basePrice}
              onChange={(e) => setBasePrice(e.target.value)}
              className="w-full rounded-md border border-gray-300 p-3 pl-8 focus:ring-1 focus:ring-pink-500 focus:outline-pink-500"
              placeholder="150000"
            />
          </div>
        </div>
        {/* Base Includes */}
        <div>
          <label
            htmlFor="baseIncludes"
            className="mb-2 block text-sm font-semibold text-gray-700"
          >
            What's Included in Base Offer
            <span className="ml-1 font-normal text-gray-400">
              (List the services for your base price)
            </span>
          </label>
          <textarea
            id="baseIncludes"
            rows={4}
            value={baseIncludes}
            onChange={(e) => setBaseIncludes(e.target.value)}
            className="w-full rounded-md border border-gray-300 p-3 focus:ring-1 focus:ring-pink-500 focus:outline-pink-500"
            placeholder="e.g. - 4 hours of service..."
          ></textarea>
        </div>
        {/* Add-ons */}
        <div>
          <h3 className="mb-3 text-lg font-semibold text-gray-700">
            Add-on Services
          </h3>
          <div className="space-y-3">
            {addOns.map((addOn, index) => (
              <div key={index} className="flex flex-col gap-2 md:flex-row">
                <input
                  type="text"
                  value={addOn.title}
                  onChange={(e) =>
                    handleAddOnTitleChange(index, e.target.value)
                  }
                  placeholder="Add-on title (e.g. Extra Hour)"
                  className="flex-grow rounded-md border border-gray-300 p-3 text-sm focus:outline-pink-500"
                />
                <div className="flex flex-shrink-0 items-center gap-2">
                  <div className="relative w-32">
                    <span className="absolute top-0 bottom-0 left-0 flex items-center p-3 text-sm font-medium text-gray-500">
                      ₦
                    </span>
                    <input
                      type="number"
                      value={addOn.price}
                      onChange={(e) =>
                        handleAddOnPriceChange(index, e.target.value)
                      }
                      placeholder="Price"
                      className="w-full rounded-md border border-gray-300 p-3 pl-8 text-sm focus:outline-pink-500"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => removeAddOn(index)}
                    className="p-2 text-gray-400 hover:text-pink-600"
                  >
                    <Trash2 className="h-5 w-5" />
                  </button>
                </div>
              </div>
            ))}
            <button
              type="button"
              onClick={addAddOn}
              className="flex items-center gap-2 text-sm font-semibold text-pink-600 hover:text-pink-700"
            >
              <Plus className="h-5 w-5" /> Add an Add-on
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};

const DescriptionForm = ({ description, setDescription, faqs, setFaqs }) => {
  const [q, setQ] = useState("");
  const [a, setA] = useState("");

  const addFaq = () => {
    if (!q || !a) return;
    setFaqs([...faqs, { q, a }]);
    setQ("");
    setA("");
  };

  const removeFaq = (index) => {
    setFaqs(faqs.filter((_, i) => i !== index));
  };

  return (
    <div className="rounded-lg border border-gray-200 bg-white shadow-sm">
      <div className="border-b border-gray-200 p-6">
        <h2 className="text-xl font-semibold">Description & FAQ</h2>
      </div>
      <form className="space-y-6 p-6">
        {/* Description */}
        <div>
          <label
            htmlFor="description"
            className="mb-2 block text-sm font-semibold text-gray-700"
          >
            Gig Description
            <span className="ml-1 font-normal text-gray-400">
              (Briefly describe your gig and what makes you the best vendor)
            </span>
          </label>
          <textarea
            id="description"
            rows={8}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full rounded-md border border-gray-300 p-3 focus:ring-1 focus:ring-pink-500 focus:outline-pink-500"
            placeholder="I am a professional DJ with over 5 years of experience..."
          ></textarea>
        </div>
        {/* FAQs */}
        <div>
          <h3 className="mb-3 text-lg font-semibold text-gray-700">
            Frequently Asked Questions
          </h3>
          {/* List of existing FAQs */}
          <div className="mb-4 space-y-4">
            {faqs.map((faq, index) => (
              <div key={index} className="rounded-md border">
                <div className="flex items-center justify-between border-b p-3">
                  <h4 className="font-medium text-gray-800">{faq.q}</h4>
                  <button
                    type="button"
                    onClick={() => removeFaq(index)}
                    className="p-1 text-gray-400 hover:text-pink-600"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
                <p className="p-3 text-sm text-gray-600">{faq.a}</p>
              </div>
            ))}
          </div>
          {/* Add new FAQ form */}
          <div className="space-y-3 rounded-lg border border-gray-200 p-4">
            <input
              type="text"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Add a question (e.g. Do you take song requests?)"
              className="w-full rounded-md border border-gray-300 p-3 text-sm focus:outline-pink-500"
            />
            <textarea
              rows={3}
              value={a}
              onChange={(e) => setA(e.target.value)}
              placeholder="Add an answer"
              className="w-full rounded-md border border-gray-300 p-3 text-sm focus:outline-pink-500"
            ></textarea>
            <button
              type="button"
              onClick={addFaq}
              className="text-sm font-semibold text-pink-600 hover:text-pink-700"
            >
              + Add FAQ
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};

const GalleryForm = () => (
  <div className="rounded-lg border border-gray-200 bg-white shadow-sm">
    <div className="border-b border-gray-200 p-6">
      <h2 className="text-xl font-semibold">Gallery</h2>
    </div>
    <form className="space-y-6 p-6">
      {/* Image Upload */}
      <div>
        <label className="mb-2 block text-sm font-semibold text-gray-700">
          Gig Images
          <span className="ml-1 font-normal text-gray-400">
            (Upload up to 5 images that describe your service)
          </span>
        </label>
        <div className="mt-1 flex justify-center rounded-md border-2 border-dashed border-gray-300 px-6 pt-5 pb-6">
          <div className="space-y-1 text-center">
            <UploadCloud className="mx-auto h-12 w-12 text-gray-400" />
            <div className="flex text-sm text-gray-600">
              <label
                htmlFor="file-upload"
                className="relative cursor-pointer rounded-md bg-white font-medium text-pink-600 focus-within:outline-none hover:text-pink-500"
              >
                <span>Upload a file</span>
                <input
                  id="file-upload"
                  name="file-upload"
                  type="file"
                  className="sr-only"
                  multiple
                />
              </label>
              <p className="pl-1">or drag and drop</p>
            </div>
            <p className="text-xs text-gray-500">PNG, JPG, GIF up to 10MB</p>
          </div>
        </div>
      </div>
      {/* Video URL */}
      <div>
        <label
          htmlFor="videoUrl"
          className="mb-2 block text-sm font-semibold text-gray-700"
        >
          YouTube Video URL
          <span className="ml-1 font-normal text-gray-400">
            (Optional: Showcase your service in action)
          </span>
        </label>
        <input
          type="text"
          id="videoUrl"
          className="w-full rounded-md border border-gray-300 p-3 focus:ring-1 focus:ring-pink-500 focus:outline-pink-500"
          placeholder="https://www.youtube.com/watch?v=..."
        />
      </div>
    </form>
  </div>
);

const PublishForm = () => (
  <div className="rounded-lg border border-gray-200 bg-white shadow-sm">
    <div className="p-6 text-center">
      <CheckCircle className="mx-auto h-16 w-16 text-green-500" />
      <h2 className="mt-4 text-2xl font-semibold">You're almost there!</h2>
      <p className="mx-auto mt-2 max-w-md text-gray-600">
        Just one more step. Review your gig details and click publish to make it
        live and start receiving quotes from clients.
      </p>
    </div>
  </div>
);

const DynamicHelperCard = ({ activeStep }: { activeStep: number }) => {
  let title, videoUrl, tips;

  switch (activeStep) {
    case 1:
      title = "Tips for Your Overview";
      videoUrl =
        "https://placehold.co/300x170/e2e8f0/9ca3af?text=Overview+Tips";
      tips = [
        "Use a clear, professional title.",
        "Choose the category that best fits your service.",
        "Use relevant keywords in your search tags.",
      ];
      break;
    case 2:
      title = "Tips for Pricing";
      videoUrl = "https://placehold.co/300x170/e2e8f0/9ca3af?text=Pricing+Tips";
      tips = [
        "Set a 'Starting at' price that's competitive.",
        "Clearly list what's included in your base offer.",
        "Use add-ons for optional extras like lighting or extra hours.",
      ];
      break;
    case 3:
      title = "Tips for Description & FAQ";
      videoUrl =
        "https://placehold.co/300x170/e2e8f0/9ca3af?text=Description+Tips";
      tips = [
        "Describe your service and experience in detail.",
        "Be clear about what makes you unique.",
        "Add FAQs to answer common client questions upfront.",
      ];
      break;
    case 4:
      title = "Tips for Your Gallery";
      videoUrl = "https://placehold.co/300x170/e2e8f0/9ca3af?text=Gallery+Tips";
      tips = [
        "Use high-quality, professional photos.",
        "Showcase your work, your setup, and past events.",
        "A video is highly recommended to show your service in action.",
      ];
      break;
    case 5:
      title = "Review & Publish";
      videoUrl = "https://placehold.co/300x170/e2e8f0/9ca3af?text=Publish+Tips";
      tips = [
        "Double-check all steps for typos.",
        "Ensure your pricing is correct.",
        "Once published, you can start receiving quote requests!",
      ];
      break;
    default:
      title = "Getting Started";
      videoUrl =
        "https://placehold.co/300x170/e2e8f0/9ca3af?text=Gig+Creation+Video";
      tips = ["Follow the steps to create your gig."];
  }

  return (
    <div className="rounded-lg border border-gray-200 bg-white shadow-sm">
      <div className="p-5">
        <h3 className="mb-3 text-lg font-semibold text-gray-800">{title}</h3>
        <div className="mb-4 flex aspect-video items-center justify-center rounded-md bg-gray-200">
          <img
            src={videoUrl}
            alt="Help video"
            className="h-full w-full rounded-md object-cover"
          />
        </div>
        <ul className="space-y-3">
          {tips.map((tip, index) => (
            <li key={index} className="flex items-start gap-3 text-sm">
              <CheckCircle className="mt-0.5 h-5 w-5 flex-shrink-0 text-green-500" />
              <span className="text-gray-600">{tip}</span>
            </li>
          ))}
        </ul>
        <button className="mt-4 text-sm font-semibold text-pink-600 hover:text-pink-700">
          Read Our Gig Policy
        </button>
      </div>
    </div>
  );
};

const SelectBox = ({
  options,
  onChange,
  value,
}: {
  options: string[];
  onChange?: (value: string) => void;
  value?: string;
}) => {
  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    if (onChange) {
      onChange(e.target.value);
    }
  };

  return (
    <div className="relative">
      <select
        value={value || ""}
        onChange={handleChange}
        className="w-full appearance-none rounded-md border border-gray-300 bg-white p-3 focus:ring-1 focus:ring-pink-500 focus:outline-pink-500"
      >
        <option value="" disabled>
          Select...
        </option>
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
      <ChevronDown className="pointer-events-none absolute top-1/2 right-3 h-5 w-5 -translate-y-1/2 text-gray-400" />
    </div>
  );
};

export default CreateGigPage;
