'use client'

import { useState, useEffect } from 'react'
import ApiClient from '../../../lib/apiClient'
import ToastNotification from '../../common/ToastNotification'
import Modal from '../../common/Modal'

export default function HouseholdsContainer() {
  // State management
  const [residents, setResidents] = useState([])
  const [households, setHouseholds] = useState([])
  const [selectedHousehold, setSelectedHousehold] = useState(null)
  const [selectedResidents, setSelectedResidents] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  
  // Filters for resident list
  const [purokFilter, setPurokFilter] = useState('all')
  const [streetFilter, setStreetFilter] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  
  // Modals
  const [showCreateHouseholdModal, setShowCreateHouseholdModal] = useState(false)
  const [newHouseholdName, setNewHouseholdName] = useState('')
  
  // Toast
  const [toast, setToast] = useState({ show: false, message: '', type: 'info' })

  // Load data on mount
  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      setIsLoading(true)
      // TODO: Add actual API calls when backend is ready
      // const residentsResponse = await ApiClient.getResidents()
      // const householdsResponse = await ApiClient.getHouseholds()
      
      // Mock data for now
      setResidents([
        { id: 1, first_name: 'Juan', last_name: 'Dela Cruz', purok: 1, address: '123 Main St', household_id: null },
        { id: 2, first_name: 'Maria', last_name: 'Santos', purok: 1, address: '123 Main St', household_id: null },
        { id: 3, first_name: 'Pedro', last_name: 'Garcia', purok: 2, address: '456 Oak Ave', household_id: null },
        { id: 4, first_name: 'Ana', last_name: 'Reyes', purok: 2, address: '789 Pine Rd', household_id: null },
      ])
      
      setHouseholds([
        { id: 1, name: 'Dela Cruz Household', members: [], created_at: new Date().toISOString() },
      ])
    } catch (error) {
      showToast('Failed to load data', 'error')
    } finally {
      setIsLoading(false)
    }
  }

  const showToast = (message, type = 'info') => {
    setToast({ show: true, message, type })
  }

  const handleCreateHousehold = () => {
    if (!newHouseholdName.trim()) {
      showToast('Please enter a household name', 'error')
      return
    }

    const newHousehold = {
      id: Date.now(),
      name: newHouseholdName,
      members: [],
      created_at: new Date().toISOString()
    }

    setHouseholds([...households, newHousehold])
    setNewHouseholdName('')
    setShowCreateHouseholdModal(false)
    showToast('Household created successfully', 'success')
  }

  const handleAddResidentsToHousehold = () => {
    if (!selectedHousehold) {
      showToast('Please select a household first', 'error')
      return
    }

    if (selectedResidents.length === 0) {
      showToast('Please select at least one resident', 'error')
      return
    }

    // Update residents to be part of household
    const updatedResidents = residents.map(r => 
      selectedResidents.includes(r.id) 
        ? { ...r, household_id: selectedHousehold.id }
        : r
    )

    // Update household members
    const updatedHouseholds = households.map(h => 
      h.id === selectedHousehold.id
        ? { ...h, members: [...h.members, ...selectedResidents] }
        : h
    )

    setResidents(updatedResidents)
    setHouseholds(updatedHouseholds)
    setSelectedResidents([])
    showToast(`Added ${selectedResidents.length} resident(s) to household`, 'success')
  }

  const handleRemoveFromHousehold = (residentId) => {
    if (!selectedHousehold) return

    // Remove resident from household
    const updatedResidents = residents.map(r =>
      r.id === residentId ? { ...r, household_id: null } : r
    )

    const updatedHouseholds = households.map(h =>
      h.id === selectedHousehold.id
        ? { ...h, members: h.members.filter(id => id !== residentId) }
        : h
    )

    setResidents(updatedResidents)
    setHouseholds(updatedHouseholds)
    showToast('Resident removed from household', 'success')
  }

  const toggleResidentSelection = (residentId) => {
    setSelectedResidents(prev =>
      prev.includes(residentId)
        ? prev.filter(id => id !== residentId)
        : [...prev, residentId]
    )
  }

  // Filter residents
  const filteredResidents = residents.filter(r => {
    // Filter out residents already in a household
    if (r.household_id) return false
    
    // Purok filter
    if (purokFilter !== 'all' && r.purok !== parseInt(purokFilter)) return false
    
    // Street filter
    if (streetFilter && !r.address.toLowerCase().includes(streetFilter.toLowerCase())) return false
    
    // Search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      const fullName = `${r.first_name} ${r.last_name}`.toLowerCase()
      if (!fullName.includes(query)) return false
    }
    
    return true
  })

  // Get household members
  const getHouseholdMembers = (household) => {
    if (!household) return []
    return residents.filter(r => r.household_id === household.id)
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="mb-4">
        <h1 className="text-2xl font-bold text-gray-900">Household Management</h1>
        <p className="text-sm text-gray-600 mt-1">
          Group residents into households for better organization and family tracking
        </p>
      </div>

      {/* Two Column Layout */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-4 overflow-hidden">
        
        {/* LEFT COLUMN - Available Residents */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 flex flex-col overflow-hidden">
          {/* Left Column Header */}
          <div className="px-4 py-3 border-b border-gray-200 bg-gray-50">
            <h2 className="text-lg font-semibold text-gray-900 mb-3">Available Residents</h2>
            
            {/* Filters */}
            <div className="space-y-2">
              {/* Search */}
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search by name..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-md 
                           focus:border-blue-500 focus:ring-1 focus:ring-blue-500 pl-9"
                />
                <i className="bi bi-search absolute left-3 top-2.5 text-gray-400 text-sm"></i>
              </div>
              
              {/* Purok and Street filters */}
              <div className="flex gap-2">
                <select
                  value={purokFilter}
                  onChange={(e) => setPurokFilter(e.target.value)}
                  className="flex-1 px-3 py-1.5 text-sm border border-gray-300 rounded-md 
                           focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                >
                  <option value="all">All Puroks</option>
                  <option value="1">Purok 1</option>
                  <option value="2">Purok 2</option>
                  <option value="3">Purok 3</option>
                  <option value="4">Purok 4</option>
                  <option value="5">Purok 5</option>
                  <option value="6">Purok 6</option>
                  <option value="7">Purok 7</option>
                </select>
                
                <input
                  type="text"
                  placeholder="Filter by street..."
                  value={streetFilter}
                  onChange={(e) => setStreetFilter(e.target.value)}
                  className="flex-1 px-3 py-1.5 text-sm border border-gray-300 rounded-md 
                           focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>

          {/* Residents List */}
          <div className="flex-1 overflow-auto p-4">
            {filteredResidents.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <i className="bi bi-people text-4xl mb-2"></i>
                <p className="text-sm">No available residents</p>
              </div>
            ) : (
              <div className="space-y-2">
                {filteredResidents.map(resident => (
                  <div
                    key={resident.id}
                    onClick={() => toggleResidentSelection(resident.id)}
                    className={`p-3 border rounded-md cursor-pointer transition-all ${
                      selectedResidents.includes(resident.id)
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <input
                          type="checkbox"
                          checked={selectedResidents.includes(resident.id)}
                          onChange={() => {}}
                          className="w-4 h-4 text-blue-600 rounded border-gray-300 
                                   focus:ring-blue-500 cursor-pointer"
                        />
                        <div>
                          <p className="text-sm font-medium text-gray-900">
                            {resident.first_name} {resident.last_name}
                          </p>
                          <p className="text-xs text-gray-500">
                            Purok {resident.purok} • {resident.address}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Add to Household Button */}
          <div className="px-4 py-3 border-t border-gray-200 bg-gray-50">
            <button
              onClick={handleAddResidentsToHousehold}
              disabled={selectedResidents.length === 0 || !selectedHousehold}
              className={`w-full px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                selectedResidents.length === 0 || !selectedHousehold
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-blue-600 text-white hover:bg-blue-700 cursor-pointer'
              }`}
            >
              <i className="bi bi-arrow-right mr-2"></i>
              Add {selectedResidents.length > 0 ? `${selectedResidents.length} ` : ''}
              to Household
            </button>
          </div>
        </div>

        {/* RIGHT COLUMN - Households */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 flex flex-col overflow-hidden">
          {/* Right Column Header */}
          <div className="px-4 py-3 border-b border-gray-200 bg-gray-50">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-lg font-semibold text-gray-900">Households</h2>
              <button
                onClick={() => setShowCreateHouseholdModal(true)}
                className="px-3 py-1.5 text-sm font-medium bg-green-600 text-white 
                         rounded-md hover:bg-green-700 transition-colors cursor-pointer"
              >
                <i className="bi bi-plus-lg mr-1"></i>
                New Household
              </button>
            </div>

            {/* Household List/Selector */}
            <div className="space-y-2">
              {households.map(household => (
                <div
                  key={household.id}
                  onClick={() => setSelectedHousehold(household)}
                  className={`p-3 border rounded-md cursor-pointer transition-all ${
                    selectedHousehold?.id === household.id
                      ? 'border-green-500 bg-green-50'
                      : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {household.name}
                      </p>
                      <p className="text-xs text-gray-500">
                        {getHouseholdMembers(household).length} member(s)
                      </p>
                    </div>
                    <i className={`bi ${selectedHousehold?.id === household.id ? 'bi-check-circle-fill text-green-600' : 'bi-circle text-gray-300'}`}></i>
                  </div>
                </div>
              ))}

              {households.length === 0 && (
                <div className="text-center py-4 text-gray-500">
                  <p className="text-xs">No households yet. Create one to get started.</p>
                </div>
              )}
            </div>
          </div>

          {/* Household Members */}
          <div className="flex-1 overflow-auto p-4">
            {!selectedHousehold ? (
              <div className="text-center py-8 text-gray-500">
                <i className="bi bi-house text-4xl mb-2"></i>
                <p className="text-sm">Select a household to view members</p>
              </div>
            ) : (
              <>
                <h3 className="text-sm font-semibold text-gray-700 mb-3">
                  {selectedHousehold.name} - Members
                </h3>
                
                {getHouseholdMembers(selectedHousehold).length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <i className="bi bi-person-plus text-3xl mb-2"></i>
                    <p className="text-xs">No members yet. Add residents from the left.</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {getHouseholdMembers(selectedHousehold).map(member => (
                      <div
                        key={member.id}
                        className="p-3 border border-gray-200 rounded-md hover:bg-gray-50"
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium text-gray-900">
                              {member.first_name} {member.last_name}
                            </p>
                            <p className="text-xs text-gray-500">
                              Purok {member.purok} • {member.address}
                            </p>
                          </div>
                          <button
                            onClick={() => handleRemoveFromHousehold(member.id)}
                            className="text-red-600 hover:text-red-700 text-sm cursor-pointer"
                            title="Remove from household"
                          >
                            <i className="bi bi-x-circle"></i>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {/* Create Household Modal */}
      <Modal
        isOpen={showCreateHouseholdModal}
        onClose={() => {
          setShowCreateHouseholdModal(false)
          setNewHouseholdName('')
        }}
        title="Create New Household"
        type="confirm"
        confirmText="Create"
        cancelText="Cancel"
        onConfirm={handleCreateHousehold}
        confirmButtonClass="bg-green-600 hover:bg-green-700 text-white"
      >
        <div className="space-y-3">
          <p className="text-sm text-gray-600">
            Enter a name for the new household
          </p>
          <input
            type="text"
            placeholder="e.g., Dela Cruz Family"
            value={newHouseholdName}
            onChange={(e) => setNewHouseholdName(e.target.value)}
            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md 
                     focus:border-green-500 focus:ring-1 focus:ring-green-500"
            autoFocus
          />
        </div>
      </Modal>

      {/* Toast Notification */}
      {toast.show && (
        <ToastNotification
          message={toast.message}
          type={toast.type}
          onClose={() => setToast({ ...toast, show: false })}
        />
      )}
    </div>
  )
}
