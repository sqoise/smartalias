import React from 'react'

export default function ResidentsView({ open, onClose, children, onStatusUpdate }) {
  const [currentStatus, setCurrentStatus] = React.useState(children?.is_active || 0)
  const [isUpdating, setIsUpdating] = React.useState(false)

  // Update local status when children changes
  React.useEffect(() => {
    if (children?.is_active !== undefined) {
      setCurrentStatus(children.is_active)
    }
  }, [children?.is_active])

  // Handle status change
  const handleStatusChange = async (newStatus) => {
    if (isUpdating || !children?.id) return
    
    setIsUpdating(true)
    try {
      // Update local state immediately for responsive UI
      setCurrentStatus(newStatus)
      
      // Call parent component's update function if provided
      if (onStatusUpdate && typeof onStatusUpdate === 'function') {
        await onStatusUpdate(children.id, newStatus)
      }
    } catch (error) {
      // Revert on error
      setCurrentStatus(children.is_active || 0)
      console.error('Failed to update status:', error)
    } finally {
      setIsUpdating(false)
    }
  }

  // Get status info for display
  const getStatusInfo = (status) => {
    switch(status) {
      case 1: return { label: 'Active', color: 'bg-green-100 text-green-800', icon: 'bi-check-circle' }
      case 0: return { label: 'Inactive', color: 'bg-red-100 text-red-800', icon: 'bi-x-circle' }
      case 2: return { label: 'Pending', color: 'bg-yellow-100 text-yellow-800', icon: 'bi-clock' }
      case 3: return { label: 'Archived', color: 'bg-gray-100 text-gray-600', icon: 'bi-archive' }
      default: return { label: 'Unknown', color: 'bg-gray-100 text-gray-500', icon: 'bi-question-circle' }
    }
  }

  const statusInfo = getStatusInfo(currentStatus)
  // Close on Escape key
  React.useEffect(() => {
    if (!open) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onClose && onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [open, onClose]);
  return (
    <div
      className={`fixed inset-0 z-50 flex ${open ? '' : 'pointer-events-none'}`}
      aria-modal="true"
      role="dialog"
    >
      {/* Overlay - Click to close */}
      <div
        className={`absolute inset-0 bg-black/50 transition-opacity duration-300 ${open ? 'opacity-100' : 'opacity-0'}`}
        onClick={onClose}
      >
        {/* Floating Close Button next to Panel */}
        <button
          className={`absolute top-2 right-[520px] sm:right-[520px] lg:right-[650px] xl:right-[750px] w-9 h-9 bg-white/30 hover:bg-white/45 text-white hover:text-gray-100 rounded-full flex items-center justify-center transition-all duration-300 backdrop-blur-md transform -translate-x-4 cursor-pointer shadow-md hover:shadow-lg ${
            open ? 'opacity-100 scale-100' : 'opacity-10 scale-90'
          }`}
          onClick={(e) => {
            e.stopPropagation();
            onClose();
          }}
          title="Close"
        >
          <i className="bi bi-x text-3xl text-white/90" />
        </button>
      </div>
      
      {/* Slide Panel from Right */}
      <div
        className={`relative ml-auto h-full w-full sm:w-[520px] lg:w-[650px] xl:w-[750px] bg-gray-50 shadow-2xl transition-transform duration-300 ease-out transform ${
          open ? 'translate-x-0' : 'translate-x-full'
        } overflow-hidden`}
      >
        {/* Panel Header - No close button */}
        <div className="flex items-center shadow-sm justify-between p-3 px-6 border-b border-gray-200 bg-white">
          <div className="flex items-center gap-2">
            <div className="text-md font-medium tracking-normal antialiased text-gray-900">Resident Details</div>
          </div>

          <div className="flex items-center gap-2 sm:hidden">
            <button 
              className="inline-flex items-center justify-center w-7 h-7 text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200 focus:ring-1 focus:ring-blue-500 transition-colors cursor-pointer"
              onClick={onClose}
            >
              <i className="bi bi-x text-xl" />
            </button>
          </div>
        </div>

        {/* Panel Content - Scrollable */}
        <div className="h-full overflow-y-auto pb-12">
          <div className="p-4">
            {/* Sectioned resident details layout */}
            {children && typeof children === 'object' && children.id ? (
              <div className="w-full space-y-2">
              
              {/* Resident Information Card - Combined */}
              <div className="bg-white p-5 rounded-lg shadow-sm border border-gray-200 relative">
                {/* Header Section with Edit Button */}
                <div className="flex items-start justify-between mb-3 pb-2 border-b border-gray-200">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 text-sm">
                      <i className="bi bi-person-badge" />
                    </div>
                    <div>
                      <h1 className="text-sm font-medium tracking-normal antialiased text-gray-900">
                        {(() => {
                          const firstName = children.first_name || '';
                          const middleName = children.middle_name || '';
                          const lastName = children.last_name || '';
                          const fullName = `${firstName} ${middleName} ${lastName}`.replace(/\s+/g, ' ').trim();
                          return fullName || 'Unknown Resident';
                        })()}
                      </h1>
                      <p className="text-xs text-gray-500">ID: {children.id}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="text-right">
                      <div className="text-xs text-gray-500 mb-1">Status</div>
                      <span className={`inline-flex items-center px-2 py-1 text-xs font-medium tracking-normal rounded-md ${statusInfo.color}`}>
                        <i className={`${statusInfo.icon} mr-1`} />
                        {statusInfo.label}
                        {isUpdating && <i className="bi bi-arrow-clockwise animate-spin ml-1" />}
                      </span>
                    </div>
                    <button className="inline-flex items-center justify-center w-7 h-7 text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200 focus:ring-1 focus:ring-blue-500 transition-colors cursor-pointer">
                      <i className="bi bi-pencil text-xs" />
                    </button>
                  </div>
                </div>

                {/* Personal and Contact Information */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-3">
                  {/* Personal Information */}
                  <div>
                    <div className="text-xs font-medium tracking-normal antialiased text-gray-900 mb-2">Personal Information</div>
                    <div className="space-y-1">
                      <div className="flex justify-between">
                        <span className="text-xs text-gray-500">Gender</span>
                        <span className="text-xs text-gray-900">{children.gender || '-'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-xs text-gray-500">Date of Birth</span>
                        <span className="text-xs text-gray-900">
                          {children.birth_date ? new Date(children.birth_date).toLocaleDateString() : '-'}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-xs text-gray-500">Civil Status</span>
                        <span className="text-xs text-gray-900">{children.civil_status || '-'}</span>
                      </div>
                    </div>
                  </div>

                  {/* Contact Information */}
                  <div>
                    <div className="text-xs font-medium tracking-normal antialiased text-gray-900 mb-2">Contact Information</div>
                    <div className="space-y-1">
                      <div className="flex justify-between">
                        <span className="text-xs text-gray-500">Email</span>
                        <span className="text-xs text-gray-900 font-mono">{children.email || '-'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-xs text-gray-500">Phone</span>
                        <span className="text-xs text-gray-900">{children.phone || '-'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-xs text-gray-500">Address</span>
                        <span className="text-xs text-gray-900">{children.address || '-'}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Record Information */}
                <div className="pt-2 border-t border-gray-200">
                  <div className="text-xs font-medium tracking-normal antialiased text-gray-900 mb-2">Record Information</div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    <div>
                      <div className="text-xs text-gray-500 mb-1">Record ID</div>
                      <div className="text-xs font-mono text-blue-600">resident_id_{children.id}</div>
                    </div>
                    <div>
                      <div className="text-xs text-gray-500 mb-1">Created</div>
                      <div className="text-xs text-gray-900">
                        {children.created_at ? new Date(children.created_at).toLocaleDateString() : '-'}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Administrative Notes */}
                <div className="pt-2 border-t border-gray-200">
                  <div className="flex items-center mb-2">
                    <div className="text-xs font-medium tracking-normal antialiased text-gray-900 mr-2">Administrative Notes</div>
                    <i className="bi bi-journal-text text-gray-500 text-xs" />
                  </div>
                  <div className="bg-gray-100 border border-gray-300 rounded-md p-2">
                    <div className="text-xs text-gray-700 tracking-normal antialiased">
                      {children.notes || 'No administrative notes available for this resident.'}
                    </div>
                  </div>
                </div>
              </div>

              {/* Family Tree Section */}
              <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 relative">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center">
                    <h3 className="text-sm font-medium tracking-normal antialiased text-gray-900">Family Tree</h3>
                  </div>
                  <button className="inline-flex items-center justify-center w-6 h-6 text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200 focus:ring-1 focus:ring-blue-500 transition-colors cursor-pointer">
                    <i className="bi bi-pencil text-xs" />
                  </button>
                </div>

                {/* Simple Family Tree Container */}
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                  <div className="relative flex flex-col items-center">
                    
                    {/* Parent Card */}
                    <div className="flex flex-col items-center mb-3">
                      <div className="bg-white border-2 border-gray-300 rounded-lg px-4 py-2 shadow-md min-w-[200px]">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center">
                            <i className="bi bi-person text-sm text-gray-600" />
                          </div>
                          <div className="text-left">
                            <div className="text-xs font-medium text-gray-700">
                              {(() => {
                                const firstName = children.first_name || '';
                                const lastName = children.last_name || '';
                                return `${firstName} ${lastName}`.trim() || 'Parent Name';
                              })()}
                            </div>
                            <div className="text-xs text-gray-500">
                              {(() => {
                                const gender = children && children.gender ? String(children.gender).toLowerCase() : '';
                                if (gender === 'male') return 'Father';
                                if (gender === 'female') return 'Mother';
                                return 'Parent';
                              })()}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Simple Connection Line - Single vertical line */}
                    <div className="relative w-full flex justify-center mb-3">
                      {/* Vertical line down from parent */}
                      <div className="absolute top-0 w-0.5 h-12 bg-gray-300"></div>
                    </div>

                    {/* Children Section */}
                    <div className="flex flex-col items-center mt-12">
                      {/* Children Cards - Grid Layout with max 3 per row */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 w-full max-w-2xl">
                        {/* Demo children data with gender-based labels */}
                        {(() => {
                          // Demo children data - replace with actual family data
                          const demoChildren = [
                            { name: 'Maria Santos', gender: 'Female' },
                            { name: 'Juan Santos', gender: 'Male' },
                            { name: 'Ana Santos', gender: 'Female' },
                            { name: 'Carlos Santos', gender: 'Male' },
                            { name: 'Sofia Santos', gender: 'Female' }
                          ];
                          
                          return demoChildren.map((child, index) => (
                            <div key={index} className="bg-white border-2 border-gray-300 rounded-lg px-3 py-1.5 shadow-md min-w-[180px]">
                              <div className="flex items-center gap-2">
                                <div className="w-5 h-5 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0">
                                  <i className="bi bi-person text-xs text-gray-600" />
                                </div>
                                <div className="text-left min-w-0 flex-1">
                                  <div className="text-xs font-medium text-gray-700 truncate">{child.name}</div>
                                  <div className="text-xs text-gray-500">
                                    {(() => {
                                      const gender = child.gender ? String(child.gender).toLowerCase() : '';
                                      return gender === 'male' ? 'Son' : 'Daughter';
                                    })()}
                                  </div>
                                </div>
                              </div>
                            </div>
                          ));
                        })()}
                      </div>
                    </div>

                  </div>
                </div>
              </div>

            </div>
          ) : (
            children
          )}
          </div>
        </div>
      </div>
    </div>
  )
}
