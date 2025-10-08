"use client"

import { useEffect, useState } from 'react'
import ApiClient from '../../../lib/apiClient'
import ResidentsContainer from '../../../components/authenticated/admin/ResidentsContainer'
import ResidentsView from '../../../components/authenticated/admin/ResidentsView'
import AddResidentsView from '../../../components/authenticated/admin/AddResidentsView'
import Modal from '../../../components/common/Modal'

export default function ResidentsPage() {
  const [residentsData, setResidentsData] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [showAdd, setShowAdd] = useState(false)
  const [showView, setShowView] = useState(false)
  const [showEdit, setShowEdit] = useState(false)
  const [showDelete, setShowDelete] = useState(false)
  const [selectedResident, setSelectedResident] = useState(null)
  const [addLoading, setAddLoading] = useState(false)

  useEffect(() => {
    loadResidents()
  }, [])

  const loadResidents = async () => {
    try {
      setLoading(true)
      setError(null)
      const response = await ApiClient.getResidents()
      
      if (response.success) {
        console.log('=== LOADED RESIDENTS FROM API ===')
        console.log('Total residents:', response.data?.length || 0)
        console.log('Active residents:', response.data?.filter(r => r.is_active === 1).length || 0)
        console.log('Inactive residents:', response.data?.filter(r => r.is_active === 0).length || 0)
        console.log('Sample data:', response.data?.slice(0, 3).map(r => ({
          id: r.id,
          name: `${r.first_name} ${r.last_name}`,
          is_active: r.is_active
        })))
        
        setResidentsData(response.data || [])
      } else {
        setError(response.error || 'Failed to load residents')
      }
    } catch (err) {
      console.error('Error loading residents:', err)
      setError('Failed to load residents')
    } finally {
      setLoading(false)
    }
  }

  const handleView = async (resident) => {
    try {
      // Fetch complete resident details including user credentials
      const response = await ApiClient.getResident(resident.id)
      
      if (response.success && response.data) {
        setSelectedResident(response.data)
        setShowView(true)
      } else {
        console.error('Failed to fetch resident details:', response.error)
        // Fallback to list data if detail fetch fails
        setSelectedResident(resident)
        setShowView(true)
      }
    } catch (error) {
      console.error('Error fetching resident details:', error)
      // Fallback to list data on error
      setSelectedResident(resident)
      setShowView(true)
    }
  }

  const handleEdit = (resident) => {
    setSelectedResident(resident)
    setShowEdit(true)
  }

  const handleDelete = (resident) => {
    setSelectedResident(resident)
    setShowDelete(true)
  }

  const confirmDelete = () => {
    // Demo: Remove from local state only
    setResidentsData(prev => prev.filter(r => r.id !== selectedResident.id))
    setShowDelete(false)
    setSelectedResident(null)
  }

  const handleAddResident = async (newResident) => {
    try {
      setAddLoading(true)
      
      // Add new resident to local state for immediate UI update
      setResidentsData(prev => [...(prev || []), newResident])
      
      // Optionally reload all residents to ensure data consistency
      // await loadResidents()
      
      setShowAdd(false)
    } catch (err) {
      console.error('Error handling added resident:', err)
    } finally {
      setAddLoading(false)
    }
  }

  const handleStatusUpdate = async (id, newStatus) => {
    try {
      // Call API to update status in database
      const response = await ApiClient.updateResidentStatus(id, newStatus)
      
      if (response && response.success) {
        // Parse ID to ensure consistent comparison (handles both "00042" and 42)
        const numericId = parseInt(id, 10)
        
        // Update local state to reflect the change
        setResidentsData(prev => 
          prev.map(r => {
            const residentId = parseInt(r.id, 10)
            return residentId === numericId ? { ...r, is_active: newStatus } : r
          })
        )
        
        // Update selected resident if it's the one being updated
        if (selectedResident) {
          const selectedId = parseInt(selectedResident.id, 10)
          if (selectedId === numericId) {
            setSelectedResident(prev => ({ ...prev, is_active: newStatus }))
          }
        }
        
        return response
      } else {
        throw new Error(response?.error || 'Failed to update status')
      }
    } catch (error) {
      console.error('Error updating resident status:', error)
      throw error
    }
  }

  const handleEditComplete = async (id) => {
    try {
      // Reload all residents to get updated data including special categories
      await loadResidents()
      
      // Also update the selected resident with fresh data
      const response = await ApiClient.getResidents()
      if (response.success) {
        const numericId = parseInt(id, 10)
        const updatedResident = response.data.find(r => parseInt(r.id, 10) === numericId)
        if (updatedResident) {
          setSelectedResident(updatedResident)
        }
      }
    } catch (err) {
      console.error('Error refreshing resident data:', err)
    }
  }

  return (
    <div className="space-y-2">

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-center">
          <i className="bi bi-exclamation-triangle mr-2"></i>
          {error}
        </div>
      )}

      {/* Advanced Residents Table */}
      <ResidentsContainer
        residents={residentsData}
        loading={loading}
        onView={handleView}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onRefresh={loadResidents}
        onAdd={() => setShowAdd(true)}
      />

      {/* Add Resident Slide Panel */}
      <AddResidentsView 
        open={showAdd} 
        onClose={() => setShowAdd(false)}
        onSubmit={handleAddResident}
        loading={addLoading}
      />

      {/* View Resident Slide Panel */}
      <ResidentsView 
        open={showView} 
        onClose={() => setShowView(false)}
        onStatusUpdate={handleStatusUpdate}
        onEditComplete={handleEditComplete}
      >
        {selectedResident}
      </ResidentsView>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={showDelete}
        onClose={() => setShowDelete(false)}
        title="Delete Resident"
        type="confirm"
        confirmText="Delete"
        cancelText="Cancel"
        onConfirm={confirmDelete}
        confirmButtonClass="text-white bg-red-600 hover:bg-red-700"
      >
        {selectedResident && (
          <div>
            <p className="text-gray-600 mb-4">
              Are you sure you want to delete this resident? This action cannot be undone.
            </p>
            <div className="bg-gray-50 p-3 rounded border">
              <p className="font-medium text-gray-900">{selectedResident.name}</p>
              <p className="text-sm text-gray-600">ID: {selectedResident.id}</p>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}
