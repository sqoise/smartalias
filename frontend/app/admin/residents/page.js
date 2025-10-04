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

  const handleView = (resident) => {
    setSelectedResident(resident)
    setShowView(true)
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
      <ResidentsView open={showView} onClose={() => setShowView(false)}>
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
