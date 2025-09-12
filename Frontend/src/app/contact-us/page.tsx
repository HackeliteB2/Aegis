'use client';

import { useState, ChangeEvent, FormEvent } from "react";
import Head from "next/head";
import Link from "next/link";
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import MatrixBackground from '@/components/MatrixBackground';

interface FormData {
  name: string;
  email: string;
  subject: string;
  message: string;
}

const green = "#22C55E";

export default function Contact() {
  const [formData, setFormData] = useState<FormData>({
    name: "",
    email: "",
    subject: "",
    message: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);

    // Simulate sending data
    setTimeout(() => {
      setIsSubmitting(false);
      setSubmitted(true);
      setFormData({ name: "", email: "", subject: "", message: "" });
    }, 2000);
  };

  return (
    <>
      <Head>
        <title>Contact Us - Project Aegis</title>
        <meta
          name="description"
          content="Get in touch with Project Aegis team for esports tournament solutions"
        />
      </Head>

      <div className="min-h-screen bg-black text-white font-mono relative">
        <MatrixBackground />
        <Header />
        <div className="relative z-10 container mx-auto px-6 py-16 pt-20">
          <div className="text-center mb-16">
            <h1 className="text-5xl font-bold mb-6">
              Get in <span style={{ color: green }}>Touch</span>
            </h1>
            <p className="text-xl text-gray-300 max-w-3xl mx-auto">
              Ready to revolutionize your esports tournaments? We&apos;re here to help you bring transparency
              and innovation to competitive gaming.
            </p>
          </div>

          {/* Responsive grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 max-w-6xl mx-auto">
            {/* Contact Form */}
            <section className="order-1 bg-gray-900/50 rounded-xl p-8 border border-green-500/30 shadow-lg backdrop-blur-sm">
              <h2 className="text-2xl font-bold mb-6" style={{ color: green }}>
                Send us a Message
              </h2>

              {submitted ? (
                <div className="text-center py-8">
                  <div
                    className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4"
                    style={{ backgroundColor: green }}
                  >
                    <svg
                      className="w-8 h-8 text-white"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-semibold mb-2">Message Sent!</h3>
                  <p className="text-gray-300">We&apos;ll get back to you within 24 hours.</p>
                  <button
                    onClick={() => setSubmitted(false)}
                    className="mt-4 underline"
                    style={{ color: green }}
                    onMouseEnter={(e) => (e.currentTarget.style.color = "#1da64f")}
                    onMouseLeave={(e) => (e.currentTarget.style.color = green)}
                  >
                    Send another message
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-2">Name *</label>
                      <input
                        type="text"
                        name="name"
                        required
                        value={formData.name}
                        onChange={handleChange}
                        className="w-full px-4 py-3 bg-black/50 border border-gray-600 rounded-lg focus:outline-none transition-colors backdrop-blur-sm"
                        placeholder="Your name"
                        style={{ borderColor: formData.name ? green : undefined }}
                        onFocus={(e) => (e.currentTarget.style.borderColor = green)}
                        onBlur={(e) => (e.currentTarget.style.borderColor = formData.name ? green : "")}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">Email *</label>
                      <input
                        type="email"
                        name="email"
                        required
                        value={formData.email}
                        onChange={handleChange}
                        className="w-full px-4 py-3 bg-black/50 border border-gray-600 rounded-lg focus:outline-none transition-colors backdrop-blur-sm"
                        placeholder="your@email.com"
                        style={{ borderColor: formData.email ? green : undefined }}
                        onFocus={(e) => (e.currentTarget.style.borderColor = green)}
                        onBlur={(e) => (e.currentTarget.style.borderColor = formData.email ? green : "")}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">Subject *</label>
                    <input
                      type="text"
                      name="subject"
                      required
                      value={formData.subject}
                      onChange={handleChange}
                      className="w-full px-4 py-3 bg-gray-900 border border-gray-600 rounded-lg focus:outline-none transition-colors"
                      placeholder="What's this about?"
                      style={{ borderColor: formData.subject ? green : undefined }}
                      onFocus={(e) => (e.currentTarget.style.borderColor = green)}
                      onBlur={(e) => (e.currentTarget.style.borderColor = formData.subject ? green : "")}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">Message *</label>
                    <textarea
                      name="message"
                      required
                      rows={6}
                      value={formData.message}
                      onChange={handleChange}
                      className="w-full px-4 py-3 bg-black/50 border border-gray-600 rounded-lg focus:outline-none transition-colors resize-none backdrop-blur-sm"
                      placeholder="Tell us about your tournament needs..."
                      style={{ borderColor: formData.message ? green : undefined }}
                      onFocus={(e) => (e.currentTarget.style.borderColor = green)}
                      onBlur={(e) => (e.currentTarget.style.borderColor = formData.message ? green : "")}
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full text-white font-semibold py-3 px-6 rounded-lg transition-colors"
                    style={{
                      backgroundColor: isSubmitting ? "#16a34a" : green,
                      cursor: isSubmitting ? "not-allowed" : "pointer",
                    }}
                    onMouseEnter={(e) => {
                      if (!isSubmitting) e.currentTarget.style.backgroundColor = "#1da64f";
                    }}
                    onMouseLeave={(e) => {
                      if (!isSubmitting) e.currentTarget.style.backgroundColor = green;
                    }}
                  >
                    {isSubmitting ? "Sending..." : "Send Message"}
                  </button>
                </form>
              )}
            </section>

            {/* Contact Info + Socials */}
            <section className="order-2 space-y-8">
              <div className="bg-gray-900/50 rounded-xl p-8 border border-green-500/30 shadow-lg backdrop-blur-sm">
                <h3 className="text-xl font-bold mb-6" style={{ color: green }}>
                  Contact Information
                </h3>
                <div className="space-y-4">
                  {/* Email */}
                  <div className="flex items-center space-x-4">
                    <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: green }}>
                      <svg
                        className="w-5 h-5 text-white"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                        />
                      </svg>
                    </div>
                    <div>
                      <p className="font-medium">Email</p>
                      <p className="text-gray-300">hello@projectaegis.gg</p>
                    </div>
                  </div>

                  {/* Location */}
                  <div className="flex items-center space-x-4">
                    <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: green }}>
                      <svg
                        className="w-5 h-5 text-white"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                        />
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                        />
                      </svg>
                    </div>
                    <div>
                      <p className="font-medium">Location</p>
                      <p className="text-gray-300">San Francisco, CA</p>
                    </div>
                  </div>

                  {/* Response Time */}
                  <div className="flex items-center space-x-4">
                    <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: green }}>
                      <svg
                        className="w-5 h-5 text-white"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                      </svg>
                    </div>
                    <div>
                      <p className="font-medium">Response Time</p>
                      <p className="text-gray-300">Within 24 hours</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-gray-900/50 rounded-xl p-8 border border-green-500/30 shadow-lg backdrop-blur-sm">
                <h3 className="text-xl font-bold mb-4" style={{ color: green }}>
                  For Tournament Organizers
                </h3>
                <p className="text-gray-300 mb-4">
                  Ready to launch your first tournament with blockchain-verified draws and AI-powered summaries?
                </p>
                <Link
                  href="/"
                  className="inline-flex items-center space-x-2 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
                  style={{ backgroundColor: green }}
                  onMouseEnter={e => (e.currentTarget.style.backgroundColor = "#1da64f")}
                  onMouseLeave={e => (e.currentTarget.style.backgroundColor = green)}
                >
                  <span>Start Your Tournament</span>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </Link>
              </div>

              <div className="bg-gray-900/50 rounded-xl p-8 border border-green-500/30 shadow-lg backdrop-blur-sm">
                <h3 className="text-xl font-bold mb-4" style={{ color: green }}>
                  Follow Us
                </h3>
                <div className="flex space-x-4">
                  <a
                    href="#"
                    className="w-10 h-10 bg-gray-700 hover:bg-[#22C55E] rounded-lg flex items-center justify-center transition-colors"
                    aria-label="Facebook"
                  >
                    {/* Facebook SVG */}
                    <svg
                      className="w-5 h-5 text-white"
                      fill="currentColor"
                      viewBox="0 0 24 24"
                      aria-hidden="true"
                    >
                      <path d="M22.675 0H1.325C.593 0 0 .593 0 1.326v21.348C0 23.406.593 24 1.325 24H12.82v-9.294H9.692v-3.622h3.127V8.413c0-3.1 1.894-4.788 4.659-4.788 1.325 0 2.466.099 2.797.143v3.24l-1.92.001c-1.505 0-1.796.716-1.796 1.764v2.314h3.588l-.467 3.622h-3.12V24h6.116C23.406 24 24 23.406 24 22.674V1.326C24 .593 23.406 0 22.675 0z" />
                    </svg>
                  </a>

                  <a
                    href="#"
                    className="w-10 h-10 bg-gray-700 hover:b[#22C55E]g- rounded-lg flex items-center justify-center transition-colors"
                    aria-label="Instagram"
                  >
                    {/* Instagram SVG */}
                    <svg
                      className="w-5 h-5 text-white"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      viewBox="0 0 24 24"
                      aria-hidden="true"
                    >
                      <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
                      <path d="M16 11.37a4 4 0 11-4.73-4.73 4 4 0 014.73 4.73z" />
                      <line x1="17.5" y1="6.5" x2="17.5" y2="6.5" />
                    </svg>
                  </a>

                  <a
                    href="#"
                    className="w-10 h-10 bg-gray-700 hover:bg-[#22C55E] rounded-lg flex items-center justify-center transition-colors"
                    aria-label="X"
                  >
                    {/* Simple X SVG */}
                    <svg
                      className="w-5 h-5 text-white"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      viewBox="0 0 24 24"
                      aria-hidden="true"
                    >
                      <line x1="18" y1="6" x2="6" y2="18" />
                      <line x1="6" y1="6" x2="18" y2="18" />
                    </svg>
                  </a>
                </div>
              </div>
            </section>
          </div>
        </div>

        <Footer />
      </div>
    </>
  );
}
