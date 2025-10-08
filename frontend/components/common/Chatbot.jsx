/**
 * Chatbot Component
 * AI-powered FAQ chatbot for SmartLias
 * Provides intelligent answers to user questions
 */

'use client'

import { useState, useEffect, useRef } from 'react'
import ApiClient from '../../lib/apiClient'
import Spinner from './Spinner'

// Simple markdown parser for chatbot responses
const parseMarkdown = (text) => {
  if (!text) return ''
  
  // Parse **bold** text
  return text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
}

export default function Chatbot({ isOpen, onClose }) {
  const [messages, setMessages] = useState([])
  const [inputText, setInputText] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isLoadingHistory, setIsLoadingHistory] = useState(false)
  const [sessionId, setSessionId] = useState(() => {
    // Get existing session from localStorage or create new one
    if (typeof window !== 'undefined') {
      const existingSession = localStorage.getItem('chatbot_session_id')
      if (existingSession) {
        return existingSession
      }
    }
    const newSession = `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    if (typeof window !== 'undefined') {
      localStorage.setItem('chatbot_session_id', newSession)
    }
    return newSession
  })
  const messagesEndRef = useRef(null)
  const inputRef = useRef(null)

  // Scroll to bottom of messages
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  // Focus input when chatbot opens and load conversation history
  useEffect(() => {
    if (isOpen) {
      inputRef.current?.focus()
      loadConversationHistory()
    }
  }, [isOpen])

  // Load existing conversation history
  const loadConversationHistory = async () => {
    try {
      setIsLoadingHistory(true)
      const response = await ApiClient.getChatbotConversation(sessionId)
      
      if (response.success && response.data.messages && response.data.messages.length > 0) {
        // Convert database messages to frontend format
        const formattedMessages = response.data.messages.map(msg => ({
          type: msg.message_type,
          text: msg.message_text,
          faqId: msg.faq_id,
          timestamp: new Date(msg.created_at)
        }))
        setMessages(formattedMessages)
      } else {
        // Show welcome message for new conversations
        setMessages([{
          type: 'bot',
          text: 'Kumusta! 👋 Welcome to SmartLIAS - ang digital platform ng Barangay Lias. Makakatulong ako sa:\n\n• Document Requests and requirements\n• My Requests status tracking\n• Announcements and updates\n• Profile management\n• Office hours at contact info\n• SmartLIAS navigation help\n• At marami pang iba!\n\nYou can ask me in English, Tagalog, or Taglish!\nAno ang gusto mong malaman?',
          timestamp: new Date()
        }])
      }
    } catch (error) {
      console.error('Error loading conversation history:', error)
      // Show welcome message on error - don't fail silently
      setMessages([{
        type: 'bot',
        text: 'Kumusta! 👋 Welcome to SmartLIAS - ang digital platform ng Barangay Lias. Makakatulong ako sa:\n\n• Document Requests and requirements\n• My Requests status tracking\n• Announcements and updates\n• Profile management\n• Office hours at contact info\n• SmartLIAS navigation help\n• At marami pang iba!\n\nYou can ask me in English, Tagalog, or Taglish!\nAno ang gusto mong malaman?',
        timestamp: new Date()
      }])
    } finally {
      setIsLoadingHistory(false)
    }
  }

  // Send message
  const handleSendMessage = async () => {
    const trimmedInput = inputText.trim()
    if (!trimmedInput || isLoading) return

    // Add user message
    const userMessage = {
      type: 'user',
      text: trimmedInput,
      timestamp: new Date()
    }
    setMessages(prev => [...prev, userMessage])
    setInputText('')
    setIsLoading(true)

    try {
      // Call chatbot API
      const response = await ApiClient.processChatbotQuery(trimmedInput, sessionId)

      if (response.success) {
        const botResponse = response.data

        // Add bot message with source tracking
        const botMessage = {
          type: 'bot',
          text: botResponse.answer,
          faqId: botResponse.faqId,
          suggestions: botResponse.suggestions || [],
          data: botResponse.data,
          source: botResponse.source || 'database',
          method: botResponse.method || 'postgresql',
          aiGenerated: botResponse.aiGenerated || false,
          disclaimer: botResponse.disclaimer,
          responseTime: botResponse.responseTime,
          metadata: botResponse.metadata || {},
          timestamp: new Date()
        }
        setMessages(prev => [...prev, botMessage])
      } else {
        // Error response
        setMessages(prev => [...prev, {
          type: 'bot',
          text: 'Sorry, I encountered an error. Please try again or contact the barangay office through SmartLIAS for assistance.',
          timestamp: new Date()
        }])
      }
    } catch (error) {
      console.error('Chatbot error:', error)
      setMessages(prev => [...prev, {
        type: 'bot',
        text: 'Sorry, I\'m having trouble connecting to SmartLIAS. Please check your internet and try again.',
        timestamp: new Date()
      }])
    } finally {
      setIsLoading(false)
    }
  }

  // Handle suggestion click
  const handleSuggestionClick = (suggestion) => {
    setInputText(suggestion.question)
    inputRef.current?.focus()
  }

  // Clear conversation and start fresh
  const clearConversation = async () => {
    try {
      // End the current conversation on the backend
      if (typeof window !== 'undefined') {
        await ApiClient.endChatbotConversation(sessionId)
        localStorage.removeItem('chatbot_session_id')
      }
      
      // Generate new session ID
      const newSession = `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
      if (typeof window !== 'undefined') {
        localStorage.setItem('chatbot_session_id', newSession)
      }
      setSessionId(newSession)
      
      // Clear messages and show welcome message for new session
      setMessages([{
        type: 'bot',
        text: 'Kumusta! 👋 Welcome to SmartLIAS - ang digital platform ng Barangay Lias. Makakatulong ako sa:\n\n• Document Requests and requirements\n• My Requests status tracking\n• Announcements and updates\n• Profile management\n• Office hours at contact info\n• SmartLIAS navigation help\n• At marami pang iba!\n\nYou can ask me in English, Tagalog, or Taglish!\nAno ang gusto mong malaman?',
        timestamp: new Date()
      }])
      
      // Focus input for new conversation
      inputRef.current?.focus()
    } catch (error) {
      console.error('Error clearing conversation:', error)
      // Even if backend call fails, still clear locally
      const newSession = `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
      if (typeof window !== 'undefined') {
        localStorage.setItem('chatbot_session_id', newSession)
      }
      setSessionId(newSession)
      
      setMessages([{
        type: 'bot',
        text: 'Kumusta! 👋 Welcome to SmartLIAS - ang digital platform ng Barangay Lias. Makakatulong ako sa:\n\n• Document Requests and requirements\n• My Requests status tracking\n• Announcements and updates\n• Profile management\n• Office hours at contact info\n• SmartLIAS navigation help\n• At marami pang iba!\n\nYou can ask me in English, Tagalog, or Taglish!\nAno ang gusto mong malaman?',
        timestamp: new Date()
      }])
    }
  }

  // Handle Enter key
  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  // Render document list (for fallback responses)
  const renderDocumentList = (documents) => {
    return (
      <div className="mt-2 space-y-1">
        {documents.map((doc, index) => (
          <div key={index} className="p-2 bg-gray-50 rounded text-sm">
            <div className="font-medium text-gray-900">{doc.title}</div>
            <div className="text-gray-600 text-xs">{doc.description}</div>
            <div className="text-blue-600 font-medium text-xs mt-1">
              Fee: ₱{parseFloat(doc.fee).toFixed(2)}
            </div>
          </div>
        ))}
      </div>
    )
  }

  // Render categories list
  const renderCategoriesList = (categories) => {
    return (
      <div className="mt-2 space-y-1">
        {categories.map((cat, index) => (
          <div key={index} className="p-2 bg-gray-50 rounded text-sm">
            <div className="font-medium text-gray-900">{cat.name}</div>
            <div className="text-gray-600 text-xs">{cat.description}</div>
          </div>
        ))}
      </div>
    )
  }

  if (!isOpen) return null

  return (
    <>
      {/* Overlay - Full screen on mobile */}
      <div 
        className="fixed inset-0 bg-black/30 z-[9998]"
        onClick={onClose}
      />

      {/* Chatbot Window */}
      <div className="fixed bottom-0 right-0 lg:bottom-4 lg:right-4 w-full lg:w-96 h-[100dvh] lg:h-[550px] bg-white lg:rounded-xl shadow-2xl z-[9999] flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-green-700 to-green-800 text-white px-3 py-2.5 lg:rounded-t-xl flex justify-between items-center">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
              <span className="text-lg">🤖</span>
            </div>
            <div>
              <h3 className="font-semibold text-sm">AI Chatbot</h3>
              <p className="text-xs text-green-100">SmartLIAS Digital Helper</p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={clearConversation}
              className="cursor-pointer text-white/80 hover:text-white hover:bg-white/10 rounded p-1.5 transition-colors flex items-center justify-center w-7 h-7"
              title="Clear conversation"
            >
              <i className="bi bi-arrow-clockwise text-sm"></i>
            </button>
            <button
              onClick={onClose}
              className="cursor-pointer text-white/80 hover:text-white hover:bg-white/10 rounded p-1.5 transition-colors flex items-center justify-center w-7 h-7"
              title="Minimize"
            >
              <span className="text-2xl leading-none font-light">−</span>
            </button>
          </div>
        </div>

        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto p-3 space-y-3 bg-gray-50">
          {/* Loading conversation history */}
          {isLoadingHistory && (
            <div className="flex justify-center">
              <div className="bg-white rounded-xl px-4 py-3 shadow-sm border border-gray-100">
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <div className="flex gap-1">
                    <div className="w-2 h-2 bg-green-600 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                    <div className="w-2 h-2 bg-green-600 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                    <div className="w-2 h-2 bg-green-600 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                  </div>
                  <span>Loading conversation...</span>
                </div>
              </div>
            </div>
          )}

          {!isLoadingHistory && messages.map((message, index) => (
            <div key={index} className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[80%] rounded-xl px-3 py-2 ${
                message.type === 'user' 
                  ? 'bg-green-700 text-white' 
                  : 'bg-white text-gray-800 shadow-sm border border-gray-100'
              }`}>
                <div 
                  className="whitespace-pre-wrap text-sm leading-relaxed"
                  dangerouslySetInnerHTML={{ __html: parseMarkdown(message.text) }}
                />
                
                {/* Source Badge for Bot Messages */}
                {message.type === 'bot' && message.metadata && (
                  <div className="mt-2 flex items-center gap-2 text-xs">
                    {message.metadata.searchMethod === 'rule-based' && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-green-50 text-green-700 border border-green-200">
                        <span></span>
                        <span>FAQs</span>
                      </span>
                    )}
                    {message.metadata.searchMethod === 'ai-powered' && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-green-50 text-green-700 border border-green-200">
                        <span></span>
                        <span>AI Generated</span>
                      </span>
                    )}
                    {message.metadata.searchMethod === 'fallback' && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-gray-50 text-gray-600 border border-gray-200">
                        <span></span>
                        <span>General Info</span>
                      </span>
                    )}
                    {message.responseTime && (
                      <span className="text-gray-400">{message.responseTime}ms</span>
                    )}
                  </div>
                )}
                
                {/* AI Disclaimer */}
                {message.type === 'bot' && message.aiGenerated && message.disclaimer && (
                  <div className="mt-1.5 text-xs text-gray-500 italic">
                    {message.disclaimer}
                  </div>
                )}
                
                {/* Render document list if present */}
                {message.data?.documents && renderDocumentList(message.data.documents)}
                
                {/* Render categories list if present */}
                {message.data?.categories && renderCategoriesList(message.data.categories)}

                {/* Suggestions */}
                {message.suggestions && message.suggestions.length > 0 && (
                  <div className="mt-2 space-y-1">
                    <div className="text-xs text-gray-500 font-medium mb-1">Related questions:</div>
                    {message.suggestions.map((suggestion, idx) => (
                      <button
                        key={idx}
                        onClick={() => handleSuggestionClick(suggestion)}
                        className="block w-full text-left text-xs p-1.5 bg-gray-50 hover:bg-gray-100 rounded border border-gray-200 text-green-700 hover:text-green-800 transition-colors"
                      >
                        {suggestion.question}
                      </button>
                    ))}
                  </div>
                )}

                <div className={`text-xs mt-1 ${message.type === 'user' ? 'text-green-100' : 'text-gray-400'}`}>
                  {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>
            </div>
          ))}

          {/* Loading indicator for new messages */}
          {!isLoadingHistory && isLoading && (
            <div className="flex justify-start">
              <div className="bg-white rounded-xl px-3 py-2 shadow-sm border border-gray-100">
                <div className="flex gap-1">
                  <div className="w-2 h-2 bg-green-600 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                  <div className="w-2 h-2 bg-green-600 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                  <div className="w-2 h-2 bg-green-600 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="border-t border-gray-200 px-4 py-3 bg-white lg:rounded-b-xl">
          <div className="flex gap-2 items-center">
            <input
              ref={inputRef}
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Type your question..."
              disabled={isLoading}
              className="flex-1 px-4 py-2.5 text-xs border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-green-600 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed transition-all"
            />
            <button
              onClick={handleSendMessage}
              disabled={!inputText.trim() || isLoading}
              className="bg-green-700 text-white rounded-full p-2.5 hover:bg-green-800 disabled:bg-gray-300 disabled:cursor-not-allowed transition-all flex items-center justify-center w-10 h-10 flex-shrink-0 shadow-sm hover:shadow-md"
            >
              {isLoading ? (
                <Spinner size="small" />
              ) : (
                <span className="text-xl">➤</span>
              )}
            </button>
          </div>

          {/* Quick actions */}
          <div className="mt-2.5 flex flex-wrap gap-1.5">
            <button
              onClick={() => handleSuggestionClick({ question: 'What documents can I request?' })}
              disabled={isLoading}
              className={`text-xs px-2 py-0.5 rounded-full transition-colors border ${
                isLoading 
                  ? 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed' 
                  : 'bg-green-50 hover:bg-green-100 text-green-700 border-green-200'
              }`}
            >
              📄 Documents
            </button>
            <button
              onClick={() => handleSuggestionClick({ question: 'What are the office hours?' })}
              disabled={isLoading}
              className={`text-xs px-2 py-0.5 rounded-full transition-colors border ${
                isLoading 
                  ? 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed' 
                  : 'bg-green-50 hover:bg-green-100 text-green-700 border-green-200'
              }`}
            >
              🕐 Office Hours
            </button>
            <button
              onClick={() => handleSuggestionClick({ question: 'How do I contact the barangay through SmartLIAS?' })}
              disabled={isLoading}
              className={`text-xs px-2 py-0.5 rounded-full transition-colors border ${
                isLoading 
                  ? 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed' 
                  : 'bg-green-50 hover:bg-green-100 text-green-700 border-green-200'
              }`}
            >
              📞 Contact
            </button>
          </div>
        </div>
      </div>
    </>
  )
}
