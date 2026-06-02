"use client";

import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import LandingContent from "@/components/landing/LandingContent";

export default function HomePage() {
  return (
    <>
      <Navbar />
      <main className="flex-1 relative z-10">
        <LandingContent />
      </main>
      <Footer />
    </>
  );
}
