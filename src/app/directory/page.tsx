"use client";

import React from "react";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { AboutSection } from "@/components/AboutSection";

export default function DirectoryPage() {
  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-[#08090C] text-zinc-900 dark:text-zinc-100 flex flex-col font-space">
      {/* 1. Navbar */}
      <Navbar />

      {/* 2. Main Content */}
      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        <AboutSection />
      </main>

      {/* 3. Footer */}
      <Footer />
    </div>
  );
}
