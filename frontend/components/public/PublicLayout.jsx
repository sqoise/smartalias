'use client'

import { cloneElement } from 'react'
import Link from 'next/link'

export default function PublicLayout({ 
  children,
  variant = 'login', // 'login', 'change-pin', 'announcement'
  showCard = true,
  showLogo = true,
  title = 'Barangay LIAS',
  subtitle = 'Digital services and document requests for residents and visitors. Access barangay services conveniently online.',
  mobileImageHeight = 30, // percentage for mobile image section
  hideBackgroundImage = false // Hide background image when keypad is active
}) {
  // Configure layout based on variant
  const getLayoutConfig = () => {
    switch (variant) {
      case 'homepage':
        return {
          desktopCols: 'lg:grid-cols-[50%_50%]', // More balanced for homepage
          showDesktopCard: showCard,
          mobileImageHeight: mobileImageHeight
        }
      case 'announcement':
        return {
          desktopCols: 'lg:grid-cols-[60%_40%]',
          showDesktopCard: false,
          mobileImageHeight: mobileImageHeight
        }
      case 'change-pin':
      case 'login':
      default:
        return {
          desktopCols: 'lg:grid-cols-[70%_30%]',
          showDesktopCard: showCard,
          mobileImageHeight: mobileImageHeight
        }
    }
  }

  const config = getLayoutConfig()

  return (
    <div className="bg-gray-100 text-gray-800 overflow-hidden" style={{ height: '100dvh', position: 'fixed', width: '100%', top: 0, left: 0 }}>
      <main className="h-full relative" style={{ height: '100dvh' }}>
        {/* Large screens: Dynamic column layout */}
        <div className={`hidden lg:grid ${config.desktopCols} h-full relative transition-all duration-500 ease-in-out`}>
          {/* LEFT: Hero section with background image */}
          <section className="relative z-0 transition-all duration-500 ease-in-out">
            <img 
              src="/images/bg.jpg" 
              className="absolute inset-0 w-full h-full object-cover" 
              style={{ objectPosition: 'left center' }}
              alt="Background"
            />
            <div className="absolute inset-0 bg-green-900/40"></div>

            <div className="relative h-full flex flex-col justify-end p-10 text-white">
              {showLogo && (
                <img 
                  src="/images/barangay_logo.jpg" 
                  alt="Barangay Logo" 
                  className="w-20 h-20 rounded-full mb-4"
                />
              )}
              <h1 className="text-4xl font-extrabold">{title}</h1>
              <p className="mt-6 max-w-xl text-white/90">
                {subtitle}
              </p>
              
              <p className="mt-10 text-sm text-white/70">
                &copy; 2025 Smart LIAS
              </p>
            </div>
          </section>

          {/* RIGHT: Content section (card or content) */}
          {config.showDesktopCard ? (
            <section className="flex items-center justify-center p-6 lg:p-12 relative overflow-visible transition-all duration-500 ease-in-out">
              {/* Overlapping card - pull left on large screens, bigger for homepage */}
              <div className={`transition-all duration-500 ease-in-out ${variant === 'homepage' ? 'lg:-ml-40' : 'lg:-ml-120'}`}>
                {/* Clone children with showLogo=false for desktop and restore card styling */}
                {cloneElement(children, { 
                  showLogo: false,
                  className: variant === 'homepage' 
                    ? "bg-white rounded-lg shadow-lg mx-auto relative z-10 p-6 sm:p-6 lg:p-12 w-full max-w-4xl min-h-[500px]"
                    : "bg-white rounded-lg shadow-lg mx-auto relative z-10 p-6 sm:p-4 lg:p-8"
                })}
              </div>
            </section>
          ) : (
            <section className="flex items-center justify-center p-6 lg:p-12 relative transition-all duration-500 ease-in-out">
              {/* Content without card styling for announcements */}
              <div className="w-full h-full flex items-center justify-center">
                {children}
              </div>
            </section>
          )}
        </div>

        {/* Small screens: Dynamic layout based on keypad state */}
        <div className="lg:hidden overflow-hidden relative" style={{ height: '100dvh', position: 'fixed', width: '100%', top: 0, left: 0 }}>
          {/* Background image - always visible */}
          <div className="absolute inset-0">
            <div 
              className="absolute inset-0 w-full h-full bg-no-repeat"
              style={{ 
                backgroundImage: 'url(/images/bg.jpg)',
                backgroundSize: 'cover',
                backgroundPosition: 'left center',
                imageRendering: 'crisp-edges'
              }}
            ></div>
            <div className="absolute inset-0 bg-green-900/40"></div>
          </div>

          {/* Layout container with transition */}
          <div className="relative z-10 flex flex-col transition-all duration-500 ease-out" style={{ height: '100dvh' }}>
            {/* Top image area - animates out when keypad is active */}
            <div className={`flex-shrink-0 transition-all duration-500 ease-out ${
              hideBackgroundImage 
                ? 'h-0 opacity-0' 
                : 'opacity-100'
            }`} style={{ 
              height: hideBackgroundImage ? '0dvh' : '20dvh'
            }}></div>
            
            {/* Logo positioned between image and white card - only when not in keypad mode */}
            {!hideBackgroundImage && (
              <div className="absolute z-20 left-1/2 transform -translate-x-1/2" style={{ top: 'calc(20dvh - 40px)' }}>
                <div className="bg-white rounded-full p-3">
                  <img 
                    src="/images/barangay_logo.jpg" 
                    alt="Barangay Logo" 
                    className="w-20 h-20 rounded-full"
                  />
                </div>
              </div>
            )}
            
            {/* White card area - expands to full height and removes styling when keypad active */}
            <div className={`flex-1 bg-white relative transition-all duration-500 ease-out ${
              hideBackgroundImage 
                ? 'rounded-none shadow-none' 
                : 'rounded-t-2xl sm:rounded-t-3xl shadow-2xl'
            }`} style={{ 
              height: hideBackgroundImage ? '100dvh' : '80dvh',
              boxShadow: hideBackgroundImage 
                ? 'none' 
                : '0 -20px 40px rgba(0, 0, 0, 0.3), 0 -10px 20px rgba(0, 0, 0, 0.2), 0 -5px 10px rgba(0, 0, 0, 0.15)'
            }}>
              {/* Additional inner shadow for depth - only when not in keypad mode */}
              {!hideBackgroundImage && (
                <div className="absolute inset-0 rounded-t-2xl sm:rounded-t-3xl" style={{ boxShadow: 'inset 0 10px 20px rgba(0, 0, 0, 0.05)' }}></div>
              )}
              
              {/* Content container with mobile-optimized padding */}
              <div className={`h-full flex flex-col relative z-30 ${
                hideBackgroundImage ? 'px-6 py-8' : 'px-4 py-4'
              }`}>
                {/* Main content area - centered with extra top padding for logo overlap */}
                <div className={`flex-1 flex items-center justify-center ${
                  hideBackgroundImage ? 'pt-4' : 'pt-10'
                } `} style={{ minHeight: 0 }}>
                  <div className="w-full max-w-md sm:max-w-sm lg:max-w-sm">
                    {showCard ? (
                      /* Clone children with proper spacing props and hide logo since it's in the middle */
                      cloneElement(children, { 
                        showLogo: hideBackgroundImage, // Only show logo in LoginCard when keypad is active
                        className: "m-0 w-full bg-transparent shadow-none border-0"
                      })
                    ) : (
                      /* Direct content without card wrapper */
                      <div className="w-full">
                        {children}
                      </div>
                    )}
                  </div>
                </div>
                
                {/* Comprehensive fixed footer - forgot credentials, access message and copyright */}
                <div className={`text-center transition-all duration-500 ease-out ${
                  hideBackgroundImage ? 'opacity-0 pointer-events-none h-0 overflow-hidden' : 'opacity-100 pb-2'
                }`}>
                  
                  {/* Back to Login link - only for change-pin variant - Mobile only */}
                  {variant === 'change-pin' && (
                    <div className="mb-2 lg:hidden">
                      <Link href="/login" className="text-xs text-gray-500 hover:text-green-600 active:text-green-700 cursor-pointer transition-colors">
                        ← Back to Login
                      </Link>
                      <p className="mx-4 my-4 text-center text-xs text-gray-500">
                        You have 24 hours before this link expires. After setting your PIN, you'll be redirected to the login page.
                      </p>
                    </div>
                  )}


                  
                  {/* Copyright - hide for change-pin variant */}
                  {variant !== 'change-pin' && (
                    <p className="text-xs text-gray-500">
                      &copy; 2025 Smart LIAS
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
