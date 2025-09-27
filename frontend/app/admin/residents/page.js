"use client"

import { useEffect, useState } from 'react'
import ApiClient from '../../../lib/apiClient'
import ResidentsContainer from '../../../components/authenticated/admin/ResidentsContainer'
import ResidentsView from '../../../components/authenticated/admin/ResidentsView'
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
  const [name, setName] = useState('')

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

  async function handleAdd(e) {
    e.preventDefault()
    try {
      // Demo: Add resident to local state only (no backend persistence yet)
      const newResident = {
        id: Date.now(),
        name: name.trim(),
        address: 'New Address - Please update',
        is_active: 1, // 1 means active
        phone: 'Not provided',
        email: 'Not provided',
        created_at: new Date().toISOString()
      }
      setResidentsData(prev => [...(prev || []), newResident])
      setName('')
      setShowAdd(false)
    } catch (err) {
      console.error(err)
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
<<<<<<< HEAD
      <ResidentsContainer
=======
      <ResidentsTable
>>>>>>> f637394 (Add resident management)
        residents={residentsData}
        loading={loading}
        onView={handleView}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onRefresh={loadResidents}
        onAdd={() => setShowAdd(true)}
      />

      {/* Add Resident Modal */}
      {showAdd && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Add New Resident</h3>
              <button 
                onClick={() => setShowAdd(false)} 
                className="text-gray-400 hover:text-gray-600 cursor-pointer"
              >
                <i className="bi bi-x-lg"></i>
              </button>
            </div>
            <form onSubmit={handleAdd} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Full Name
                </label>
                <input 
                  value={name} 
                  onChange={e => setName(e.target.value)} 
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-green-500" 
                  placeholder="Enter full name"
                  required
                />
              </div>
              <div className="flex justify-end gap-2 pt-4">
                <button 
                  type="button" 
                  onClick={() => setShowAdd(false)} 
                  className="px-4 py-2 text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200 cursor-pointer"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 cursor-pointer"
                  disabled={!name.trim()}
                >
                  Add Resident
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

<<<<<<< HEAD
      {/* View Resident Slide Panel */}
      <ResidentsView open={showView} onClose={() => setShowView(false)}>
        {selectedResident}
      </ResidentsView>
=======
      {/* View Resident Modal */}
      <Modal
        isOpen={showView}
        onClose={() => setShowView(false)}
        title="Resident Details"
        type="info"
      >
        {selectedResident && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-500">Name</label>
                <p className="text-gray-900">{selectedResident.name}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">ID</label>
                <p className="text-gray-900">{selectedResident.id}</p>
              </div>
              <div className="col-span-2">
                <label className="text-sm font-medium text-gray-500">Address</label>
                <p className="text-gray-900">{selectedResident.address}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Phone</label>
                <p className="text-gray-900">{selectedResident.phone}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Email</label>
                <p className="text-gray-900">{selectedResident.email}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Status</label>
                <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                  selectedResident.status === 'Active' 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-red-100 text-red-800'
                }`}>
                  {selectedResident.status}
                </span>
              </div>
            </div>
          </div>
        )}
      </Modal>
>>>>>>> f637394 (Add resident management)

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
