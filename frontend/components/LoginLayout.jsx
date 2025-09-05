'use client'

import { cloneElement } from 'react'

export default function LoginLayout({ children }) {
  return (
    <div className="min-h-screen bg-gray-100 text-gray-800">
      <main className="min-h-screen relative">
        {/* Large screens: Two-column layout */}
        <div className="hidden lg:grid lg:grid-cols-[70%_30%] min-h-screen relative">
          {/* LEFT: Hero section with background image */}
          <section className="relative z-0">
            <img 
              src="/images/bg.jpg" 
              className="absolute inset-0 w-full h-full object-cover" 
              alt="Background"
            />
            <div className="absolute inset-0 bg-green-900/40"></div>

            <div className="relative h-full flex flex-col justify-end p-10 text-white">
              <img 
                src="/images/barangay_logo.jpg" 
                alt="Barangay Logo" 
                className="w-20 h-20 rounded-full mb-4"
              />
              <h1 className="text-4xl font-extrabold">Barangay LIAS</h1>
              <p className="mt-6 max-w-xl text-white/90">
                Access your account to our Barangay SMART LIAS Portal.
              </p>
              <p className="mt-10 text-sm text-white/70">
                &copy; {new Date().getFullYear()} Smart LIAS
              </p>
            </div>
          </section>

          {/* RIGHT: Login card */}
          <section className="flex items-center justify-center p-6 lg:p-12 relative overflow-visible">
            {/* Overlapping card - pull left on large screens */}
            <div className="lg:-ml-120">
              {/* Clone children with showLogo=false for desktop */}
              {cloneElement(children, { showLogo: false })}
            </div>
          </section>
        </div>

        {/* Small screens: Split layout (40% image, 60% white) */}
        <div className="lg:hidden min-h-screen relative">
          {/* Background image section - 40% height */}
          <section className="relative h-[40vh] z-0">
            <img 
              src="/images/bg.jpg" 
              className="absolute inset-0 w-full h-full object-cover" 
              alt="Background"
            />
            <div className="absolute inset-0 bg-green-900/40"></div>
          </section>

          {/* White background section - 60% height */}
          <section className="h-[60vh] bg-white"></section>

          {/* Login card - positioned to overlap both sections */}
          <section className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-full flex items-center justify-center p-6 z-10">
            {/* Overlapping card - centered and floating */}
            {/* Clone children with showLogo=true for mobile */}
            {cloneElement(children, { showLogo: true })}
            
            {/* Copyright for screens 1024px and below */}
            <div className="absolute bottom-6 left-0 right-0 text-center xl:hidden">
              <p className="text-sm text-gray-500">
                &copy; {new Date().getFullYear()} Smart LIAS
              </p>
            </div>
          </section>
        </div>
      </main>
    </div>
  )
}
