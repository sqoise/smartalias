import React from 'react'

export default function SMSTargetSection({ 
  sendSMS, 
  targetGroups, 
  onSendSMSChange, 
  onTargetGroupsChange, 
  disabled = false,
  hasError = false
}) {
  const handleTargetGroupToggle = (value, checked) => {
    if (value === 'all') {
      // If "All" is selected, clear other selections
      if (checked) {
        onTargetGroupsChange(['all'])
      } else {
        onTargetGroupsChange([])
      }
    } else {
      // For specific groups
      if (checked) {
        // Remove "all" if present and add the specific group
        const newGroups = targetGroups.filter(g => g !== 'all')
        onTargetGroupsChange([...newGroups, value])
      } else {
        // Remove the specific group
        onTargetGroupsChange(targetGroups.filter(g => g !== value))
      }
    }
  }

  return (
    <div className="space-y-3">
      {/* SMS Toggle - Toggle Switch Design */}
      <div>
        <label className="flex items-center cursor-pointer group py-1">
          <div className="relative">
            <input
              type="checkbox"
              checked={sendSMS}
              onChange={(e) => onSendSMSChange(e.target.checked)}
              className="sr-only"
              disabled={disabled}
            />
            {/* iOS-style Toggle Switch with Visible Labels */}
            <div className={`relative w-13 h-6 rounded-full transition-all duration-300 ease-in-out ${
              sendSMS 
                ? 'bg-green-500' 
                : 'bg-gray-300'
            } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}>
              {/* OFF Label - Right Side (visible when circle is on left) */}
              <span className={`absolute right-2 top-0 bottom-0 flex items-center text-[10px] font-bold transition-opacity duration-300 ${
                sendSMS ? 'opacity-0' : 'opacity-100 text-gray-700'
              }`}>
                OFF
              </span>
              {/* ON Label - Left Side (visible when circle is on right) */}
              <span className={`absolute left-2 top-0 bottom-0 flex items-center text-[10px] font-bold transition-opacity duration-300 ${
                sendSMS ? 'opacity-100 text-white' : 'opacity-0'
              }`}>
                ON
              </span>
              {/* Sliding Circle - Bigger */}
              <div className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow-md transition-transform duration-300 ease-in-out z-10 ${
                sendSMS ? 'translate-x-7' : 'translate-x-0'
              }`}></div>
            </div>
          </div>
          <span className={`ml-3 text-sm transition-colors ${
            sendSMS ? 'text-slate-900 font-medium' : 'text-slate-700'
          } ${disabled ? 'opacity-50' : 'group-hover:text-slate-900'}`}>
            Send SMS notifications to residents
          </span>
        </label>
      </div>

      {/* SMS Target Groups - Compact when enabled */}
      {sendSMS && (
        <div className={`bg-slate-50 border-2 border-dashed rounded-lg p-3 transition-colors ${
          hasError ? 'border-red-400' : 'border-slate-300'
        }`}>
          <div className="mb-2">
            <label className="block text-sm font-medium text-slate-700 mb-0.5">
              Target Recipients
            </label>
            <p className="text-xs text-slate-600">Select groups to receive SMS notifications</p>
          </div>
          
          <div className="space-y-2">
            {/* All Residents - Compact */}
            <label className="flex items-center cursor-pointer group py-1.5 px-2 rounded hover:bg-white transition-colors">
              <div className="relative">
                <input
                  type="checkbox"
                  checked={targetGroups.includes('all')}
                  onChange={(e) => handleTargetGroupToggle('all', e.target.checked)}
                  className="sr-only"
                  disabled={disabled}
                />
                <div className={`w-4 h-4 rounded-full border transition-all duration-200 flex items-center justify-center ${
                  targetGroups.includes('all')
                    ? 'bg-slate-600 border-slate-600' 
                    : 'bg-white border-slate-300 group-hover:border-slate-400'
                } ${disabled ? 'opacity-50 cursor-not-allowed' : 'group-hover:shadow-sm'}`}>
                  {targetGroups.includes('all') && (
                    <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  )}
                </div>
              </div>
              <div className="ml-2.5">
                <span className={`text-sm transition-colors ${
                  targetGroups.includes('all') ? 'text-slate-900 font-semibold' : 'text-slate-700'
                } ${disabled ? 'opacity-50' : 'group-hover:text-slate-900'}`}>
                  All Residents
                </span>
                <span className="ml-1 text-xs text-slate-500">(with mobile numbers)</span>
              </div>
            </label>

            {/* Special Categories - Show when 'all' is not selected OR when nothing is selected */}
            {!targetGroups.includes('all') && (
              <div className="ml-4 space-y-1.5 border-l-2 border-slate-200 pl-2">
                <p className="text-xs font-medium text-slate-600 mb-1">
                  {targetGroups.length === 0 ? 'Select target recipients:' : 'Or select specific groups:'}
                </p>
                
                {/* PWD */}
                <label className="flex items-center cursor-pointer group py-1 px-2 rounded hover:bg-white transition-colors">
                  <div className="relative">
                    <input
                      type="checkbox"
                      checked={targetGroups.includes('special_category:PWD')}
                      onChange={(e) => handleTargetGroupToggle('special_category:PWD', e.target.checked)}
                      className="sr-only"
                      disabled={disabled}
                    />
                    <div className={`w-3.5 h-3.5 rounded-full border transition-all duration-200 flex items-center justify-center ${
                      targetGroups.includes('special_category:PWD')
                        ? 'bg-slate-600 border-slate-600' 
                        : 'bg-white border-slate-300 group-hover:border-slate-400'
                    } ${disabled ? 'opacity-50 cursor-not-allowed' : 'group-hover:shadow-sm'}`}>
                      {targetGroups.includes('special_category:PWD') && (
                        <svg className="w-2.5 h-2.5 text-white" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      )}
                    </div>
                  </div>
                  <span className={`ml-2 text-sm transition-colors ${
                    targetGroups.includes('special_category:PWD') ? 'text-slate-900 font-medium' : 'text-slate-700'
                  } ${disabled ? 'opacity-50' : 'group-hover:text-slate-900'}`}>
                    Persons with Disability (PWD)
                  </span>
                </label>

                {/* Senior Citizens */}
                <label className="flex items-center cursor-pointer group py-1 px-2 rounded hover:bg-white transition-colors">
                  <div className="relative">
                    <input
                      type="checkbox"
                      checked={targetGroups.includes('special_category:SENIOR_CITIZEN')}
                      onChange={(e) => handleTargetGroupToggle('special_category:SENIOR_CITIZEN', e.target.checked)}
                      className="sr-only"
                      disabled={disabled}
                    />
                    <div className={`w-3.5 h-3.5 rounded-full border transition-all duration-200 flex items-center justify-center ${
                      targetGroups.includes('special_category:SENIOR_CITIZEN')
                        ? 'bg-slate-600 border-slate-600' 
                        : 'bg-white border-slate-300 group-hover:border-slate-400'
                    } ${disabled ? 'opacity-50 cursor-not-allowed' : 'group-hover:shadow-sm'}`}>
                      {targetGroups.includes('special_category:SENIOR_CITIZEN') && (
                        <svg className="w-2.5 h-2.5 text-white" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      )}
                    </div>
                  </div>
                  <span className={`ml-2 text-sm transition-colors ${
                    targetGroups.includes('special_category:SENIOR_CITIZEN') ? 'text-slate-900 font-medium' : 'text-slate-700'
                  } ${disabled ? 'opacity-50' : 'group-hover:text-slate-900'}`}>
                    Senior Citizens (60+ years)
                  </span>
                </label>

                {/* Solo Parents */}
                <label className="flex items-center cursor-pointer group py-1 px-2 rounded hover:bg-white transition-colors">
                  <div className="relative">
                    <input
                      type="checkbox"
                      checked={targetGroups.includes('special_category:SOLO_PARENT')}
                      onChange={(e) => handleTargetGroupToggle('special_category:SOLO_PARENT', e.target.checked)}
                      className="sr-only"
                      disabled={disabled}
                    />
                    <div className={`w-3.5 h-3.5 rounded-full border transition-all duration-200 flex items-center justify-center ${
                      targetGroups.includes('special_category:SOLO_PARENT')
                        ? 'bg-slate-600 border-slate-600' 
                        : 'bg-white border-slate-300 group-hover:border-slate-400'
                    } ${disabled ? 'opacity-50 cursor-not-allowed' : 'group-hover:shadow-sm'}`}>
                      {targetGroups.includes('special_category:SOLO_PARENT') && (
                        <svg className="w-2.5 h-2.5 text-white" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      )}
                    </div>
                  </div>
                  <span className={`ml-2 text-sm transition-colors ${
                    targetGroups.includes('special_category:SOLO_PARENT') ? 'text-slate-900 font-medium' : 'text-slate-700'
                  } ${disabled ? 'opacity-50' : 'group-hover:text-slate-900'}`}>
                    Solo Parents
                  </span>
                </label>

                {/* Age Groups */}
                <label className="flex items-center cursor-pointer group py-1 px-2 rounded hover:bg-white transition-colors">
                  <div className="relative">
                    <input
                      type="checkbox"
                      checked={targetGroups.includes('age_group:18-65')}
                      onChange={(e) => handleTargetGroupToggle('age_group:18-65', e.target.checked)}
                      className="sr-only"
                      disabled={disabled}
                    />
                    <div className={`w-3.5 h-3.5 rounded-full border transition-all duration-200 flex items-center justify-center ${
                      targetGroups.includes('age_group:18-65')
                        ? 'bg-slate-600 border-slate-600' 
                        : 'bg-white border-slate-300 group-hover:border-slate-400'
                    } ${disabled ? 'opacity-50 cursor-not-allowed' : 'group-hover:shadow-sm'}`}>
                      {targetGroups.includes('age_group:18-65') && (
                        <svg className="w-2.5 h-2.5 text-white" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      )}
                    </div>
                  </div>
                  <span className={`ml-2 text-sm transition-colors ${
                    targetGroups.includes('age_group:18-65') ? 'text-slate-900 font-medium' : 'text-slate-700'
                  } ${disabled ? 'opacity-50' : 'group-hover:text-slate-900'}`}>
                    Adults (18-59 years)
                  </span>
                </label>

                {/* Youth */}
                <label className="flex items-center cursor-pointer group py-1 px-2 rounded hover:bg-white transition-colors">
                  <div className="relative">
                    <input
                      type="checkbox"
                      checked={targetGroups.includes('age_group:13-17')}
                      onChange={(e) => handleTargetGroupToggle('age_group:13-17', e.target.checked)}
                      className="sr-only"
                      disabled={disabled}
                    />
                    <div className={`w-3.5 h-3.5 rounded-full border transition-all duration-200 flex items-center justify-center ${
                      targetGroups.includes('age_group:13-17')
                        ? 'bg-slate-600 border-slate-600' 
                        : 'bg-white border-slate-300 group-hover:border-slate-400'
                    } ${disabled ? 'opacity-50 cursor-not-allowed' : 'group-hover:shadow-sm'}`}>
                      {targetGroups.includes('age_group:13-17') && (
                        <svg className="w-2.5 h-2.5 text-white" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      )}
                    </div>
                  </div>
                  <span className={`ml-2 text-sm transition-colors ${
                    targetGroups.includes('age_group:13-17') ? 'text-slate-900 font-medium' : 'text-slate-700'
                  } ${disabled ? 'opacity-50' : 'group-hover:text-slate-900'}`}>
                    Youth (13-17 years)
                  </span>
                </label>
              </div>
            )}

            {/* Target Groups Summary - Compact */}
            {targetGroups.length > 0 && (
              <div className="mt-2 px-2 py-1.5 bg-slate-100 rounded text-xs text-slate-700">
                <span className="font-medium">Selected: </span>
                {targetGroups.includes('all') 
                  ? 'All residents with mobile numbers' 
                  : `${targetGroups.length} specific group(s)`
                }
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
