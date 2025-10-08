/**
 * Floating Chatbot Button
 * Triggers the chatbot interface
 */

'use client'

import { useState } from 'react'
import Chatbot from './Chatbot'

export default function ChatbotButton() {
  const [isChatbotOpen, setIsChatbotOpen] = useState(false)
  const [hasNewMessage, setHasNewMessage] = useState(false)

  const handleToggleChatbot = () => {
    setIsChatbotOpen(!isChatbotOpen)
    if (!isChatbotOpen) {
      setHasNewMessage(false)
    }
  }

  return (
    <>
      {/* Floating Button */}
      {!isChatbotOpen && (
        <button
          onClick={handleToggleChatbot}
          className="fixed bottom-6 right-6 z-[9999] w-16 h-16 bg-gradient-to-br from-green-700 to-green-800 text-white rounded-2xl shadow-lg hover:shadow-2xl hover:scale-105 transition-all duration-300 flex items-center justify-center group backdrop-blur-sm"
          aria-label="Open Chatbot"
        >
          {/* Icon - Modern message bubble with sparkle */}
          <div className="relative">
            <svg 
              className="w-8 h-8 group-hover:scale-110 transition-transform" 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={2} 
                d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" 
              />
            </svg>
            {/* AI Sparkle indicator */}
            <span className="absolute -top-1 -right-1 w-2 h-2 bg-yellow-300 rounded-full animate-pulse" />
          </div>

          {/* Notification Badge */}
          {hasNewMessage && (
            <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full border-2 border-white flex items-center justify-center text-xs font-bold shadow-lg animate-bounce" />
          )}

          {/* Subtle glow effect */}
          <span className="absolute inset-0 rounded-2xl bg-green-400 opacity-0 group-hover:opacity-20 blur-xl transition-opacity duration-300" />
        </button>
      )}

      {/* Chatbot Component */}
      <Chatbot 
        isOpen={isChatbotOpen} 
        onClose={() => setIsChatbotOpen(false)} 
      />
    </>
  )
}
