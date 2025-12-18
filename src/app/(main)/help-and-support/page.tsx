"use client";

import React, { useState } from "react";
import { Mail, Phone, MapPin, Send, MessageSquare } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useUiStore } from "@/stores/ui";

export default function HelpSupportPage() {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    subject: "",
    message: "",
  });
  const { headerHeight } = useUiStore();

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1500));

    toast.success("Message sent successfully! We'll get back to you soon.");
    setFormData({ name: "", email: "", subject: "", message: "" });
    setLoading(false);
  };

  return (
    <div className="bg-white min-h-screen" style={{ paddingTop: headerHeight }}>
      {/* Header */}
      <div className="bg-pink-50 py-12 md:py-20">
        <div className="container mx-auto px-4 md:px-6">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-3xl md:text-5xl font-bold text-gray-900 mb-6">
              Help & Support
            </h1>
            <p className="text-lg md:text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
              Have a question or need assistance? We&apos;re here to help! 
              Reach out to us via the form below or visit our office.
            </p>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 md:px-6 py-12">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 max-w-6xl mx-auto">
          {/* Contact Form */}
          <div className="bg-white rounded-2xl p-6 md:p-8 shadow-sm border border-gray-100 h-fit">
            <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
              <MessageSquare className="h-6 w-6 text-pink-600" />
              Send us a message
            </h2>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label htmlFor="name" className="text-sm font-medium text-gray-700">
                    Full Name
                  </label>
                  <input
                    id="name"
                    name="name"
                    type="text"
                    required
                    value={formData.name}
                    onChange={handleChange}
                    placeholder="John Doe"
                    className="w-full rounded-lg border border-gray-300 p-3 outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent transition-all"
                  />
                </div>
                <div className="space-y-2">
                  <label htmlFor="email" className="text-sm font-medium text-gray-700">
                    Email Address
                  </label>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    required
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="john@example.com"
                    className="w-full rounded-lg border border-gray-300 p-3 outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent transition-all"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label htmlFor="subject" className="text-sm font-medium text-gray-700">
                  Subject
                </label>
                <select
                  id="subject"
                  name="subject"
                  required
                  value={formData.subject}
                  onChange={handleChange}
                  className="w-full rounded-lg border border-gray-300 p-3 outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent transition-all bg-white"
                >
                  <option value="" disabled>Select a topic</option>
                  <option value="General Inquiry">General Inquiry</option>
                  <option value="Support">Technical Support</option>
                  <option value="Billing">Billing & Payments</option>
                  <option value="Partnership">Partnership Opportunities</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div className="space-y-2">
                <label htmlFor="message" className="text-sm font-medium text-gray-700">
                  Message
                </label>
                <textarea
                  id="message"
                  name="message"
                  required
                  rows={5}
                  value={formData.message}
                  onChange={handleChange}
                  placeholder="How can we help you today?"
                  className="w-full rounded-lg border border-gray-300 p-3 outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent transition-all resize-none"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className={cn(
                  "w-full flex items-center justify-center gap-2 rounded-lg bg-pink-600 px-8 py-3.5 text-base font-semibold text-white shadow-sm transition-all hover:bg-pink-700 focus:ring-2 focus:ring-pink-500 focus:ring-offset-2",
                  loading && "opacity-70 cursor-not-allowed"
                )}
              >
                {loading ? (
                  "Sending..."
                ) : (
                  <>
                    Send Message
                    <Send className="h-4 w-4" />
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Contact Details & Map */}
          <div className="space-y-8">
            <div className="bg-gray-50 rounded-2xl p-6 md:p-8 border border-gray-100">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Contact Information</h2>
              <div className="space-y-6">
                <div className="flex items-start gap-4">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white text-pink-600 shadow-sm border border-gray-100">
                    <MapPin className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">Visit Us</h3>
                    <p className="mt-1 text-gray-600 leading-relaxed">
                      123 Party Avenue, Ikeja<br />
                      Lagos State, Nigeria
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white text-pink-600 shadow-sm border border-gray-100">
                    <Mail className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">Email Us</h3>
                    <p className="mt-1 text-gray-600">
                      <a href="mailto:support@partygeng.com" className="hover:text-pink-600 transition-colors">
                        support@partygeng.com
                      </a>
                    </p>
                    <p className="text-sm text-gray-500 mt-0.5">We reply within 24 hours.</p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white text-pink-600 shadow-sm border border-gray-100">
                    <Phone className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">Call Us</h3>
                    <p className="mt-1 text-gray-600">
                      <a href="tel:+2348001234567" className="hover:text-pink-600 transition-colors">
                        +234 800 123 4567
                      </a>
                    </p>
                    <p className="text-sm text-gray-500 mt-0.5">Mon-Fri from 9am to 6pm.</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Map Section */}
            <div className="rounded-2xl overflow-hidden border border-gray-200 shadow-sm h-[300px] relative bg-gray-100">
              <iframe
                width="100%"
                height="100%"
                frameBorder="0"
                scrolling="no"
                marginHeight={0}
                marginWidth={0}
                src="https://www.openstreetmap.org/export/embed.html?bbox=3.3300,6.5800,3.3700,6.6200&amp;layer=mapnik&amp;marker=6.6000,3.3500"
                className="absolute inset-0 w-full h-full"
                title="PartyGeng Office Location"
              ></iframe>
              <div className="absolute bottom-2 left-2 bg-white/90 px-2 py-1 text-xs rounded shadow-sm z-10 pointer-events-none">
                <span className="font-semibold text-gray-700">© OpenStreetMap contributors</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
