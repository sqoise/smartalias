'use client'

import React, { useState, useRef, useEffect } from 'react'

export default function CustomSelect({
  value,
  onChange,
  options = [],
  placeholder = "Select an option",
  error = false,
  className = "",
  disabled = false,
  name = "",
  id = "",
  required = false,
  title = "Select Option", // For mobile sheet title
  focusColor = "blue" // blue, green, etc.
}) {
  const [isOpen, setIsOpen] = useState(false)
  const [highlightedIndex, setHighlightedIndex] = useState(-1)
  const dropdownRef = useRef(null)
  const optionsRef = useRef([])

  // Convert options to consistent format
  const normalizedOptions = options.map(option => {
    if (typeof option === 'string') {
      return { value: option, label: option }
    }
    return option
  })

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false)
        setHighlightedIndex(-1)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (event) => {
      if (!isOpen) return

      switch (event.key) {
        case 'ArrowDown':
          event.preventDefault()
          setHighlightedIndex(prev => 
            prev < normalizedOptions.length - 1 ? prev + 1 : 0
          )
          break
        case 'ArrowUp':
          event.preventDefault()
          setHighlightedIndex(prev => 
            prev > 0 ? prev - 1 : normalizedOptions.length - 1
          )
          break
        case 'Enter':
          event.preventDefault()
          if (highlightedIndex >= 0) {
            handleSelect(normalizedOptions[highlightedIndex])
          }
          break
        case 'Escape':
          setIsOpen(false)
          setHighlightedIndex(-1)
          break
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, highlightedIndex, normalizedOptions])

  // Scroll highlighted option into view
  useEffect(() => {
    if (highlightedIndex >= 0 && optionsRef.current[highlightedIndex]) {
      optionsRef.current[highlightedIndex].scrollIntoView({
        block: 'nearest',
        behavior: 'smooth'
      })
    }
  }, [highlightedIndex])

  const handleSelect = (option) => {
    onChange(option.value)
    setIsOpen(false)
    setHighlightedIndex(-1)
  }

  const toggleDropdown = () => {
    if (!disabled) {
      setIsOpen(!isOpen)
      setHighlightedIndex(-1)
    }
  }

  const selectedOption = normalizedOptions.find(opt => opt.value === value)

  // Focus color classes
  const focusClasses = {
    blue: 'focus:ring-blue-500 focus:border-blue-500',
    green: 'focus:ring-green-500 focus:border-green-500',
    red: 'focus:ring-red-500 focus:border-red-500'
  }

  const highlightClasses = {
    blue: 'bg-blue-100 text-blue-800',
    green: 'bg-green-100 text-green-800',
    red: 'bg-red-100 text-red-800'
  }

  const selectedClasses = {
    blue: 'bg-blue-100 text-blue-800',
    green: 'bg-green-100 text-green-800',
    red: 'bg-red-100 text-red-800'
  }

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      {/* Select Button */}
      <button
        type="button"
        onClick={toggleDropdown}
        disabled={disabled}
        name={name}
        id={id}
        aria-required={required}
        className={`w-full px-3 py-2.5 text-left border rounded-lg ${focusClasses[focusColor] || focusClasses.blue} transition-colors min-h-[42px] flex items-center justify-between bg-white ${className} ${
          error ? 'border-red-500' : 'border-gray-300'
        } ${disabled ? 'bg-gray-100 cursor-not-allowed' : 'hover:border-gray-400 cursor-pointer'}`}
        style={{ fontSize: '15px', lineHeight: '1.4' }}
      >
        <span className={selectedOption ? 'text-gray-900' : 'text-gray-500'}>
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <i className={`bi bi-chevron-down text-gray-400 text-sm transition-transform duration-200 ${
          isOpen ? 'rotate-180' : ''
        }`}></i>
      </button>

      {/* Dropdown Options */}
      {isOpen && (
        <>
          {/* Mobile Backdrop */}
          <div className="fixed inset-0 bg-black/20 z-40 sm:hidden" onClick={() => setIsOpen(false)} />
          
          {/* Desktop Dropdown */}
          <div className="hidden sm:block absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-52 overflow-auto">
            {normalizedOptions.map((option, index) => (
              <button
                key={option.value}
                ref={el => optionsRef.current[index] = el}
                type="button"
                onClick={() => handleSelect(option)}
                className={`w-full px-3 py-2.5 text-left hover:bg-gray-50 focus:bg-gray-50 focus:outline-none transition-colors ${
                  highlightedIndex === index ? highlightClasses[focusColor] || highlightClasses.blue : 'text-gray-900'
                } ${index === 0 ? 'rounded-t-lg' : ''} ${index === normalizedOptions.length - 1 ? 'rounded-b-lg' : 'border-b border-gray-100'}`}
                style={{ fontSize: '14px', lineHeight: '1.4' }}
              >
                {option.label}
              </button>
            ))}
          </div>

          {/* Mobile Bottom Sheet */}
          <div className="sm:hidden fixed inset-x-0 bottom-0 z-50 bg-white rounded-t-xl shadow-2xl max-h-[45vh] overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-medium text-gray-900">{title}</h3>
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="p-1.5 hover:bg-gray-100 rounded-full transition-colors"
                >
                  <i className="bi bi-x text-lg text-gray-500"></i>
                </button>
              </div>
            </div>
            <div className="overflow-auto max-h-72">
              {normalizedOptions.map((option, index) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => handleSelect(option)}
                  className={`w-full px-4 py-3.5 text-left hover:bg-gray-50 active:bg-gray-100 transition-colors border-b border-gray-100 ${
                    value === option.value ? selectedClasses[focusColor] || selectedClasses.blue + ' font-medium' : 'text-gray-900'
                  }`}
                  style={{ fontSize: '15px', lineHeight: '1.4', minHeight: '50px' }}
                >
                  <div className="flex items-center justify-between">
                    <span>{option.label}</span>
                    {value === option.value && (
                      <i className="bi bi-check2 text-blue-600 text-lg"></i>
                    )}
                  </div>
                </button>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  )
}
