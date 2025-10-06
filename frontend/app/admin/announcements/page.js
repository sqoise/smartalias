"use client"

import { useEffect, useState } from 'react'
import ApiClient from '../../../lib/apiClient'
import AnnouncementsContainer from '../../../components/authenticated/admin/AnnouncementsContainer'
import AnnouncementDetailView from '../../../components/authenticated/admin/AnnouncementDetailView'
import AddAnnouncementView from '../../../components/authenticated/admin/AddAnnouncementView'
import Modal from '../../../components/common/Modal'
import ToastNotification from '../../../components/common/ToastNotification'

export default function AnnouncementsPage() {
  const [announcementsData, setAnnouncementsData] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [showAdd, setShowAdd] = useState(false)
  const [showView, setShowView] = useState(false)
  const [showDelete, setShowDelete] = useState(false)
  const [selectedAnnouncement, setSelectedAnnouncement] = useState(null)
  const [addLoading, setAddLoading] = useState(false)
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' })

  useEffect(() => {
    loadAnnouncements()
  }, [])

  const loadAnnouncements = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const response = await ApiClient.request('/announcements')
      
      if (response.success) {
        setAnnouncementsData(response.data || [])
      } else {
        setError('Failed to load announcements')
      }
    } catch (err) {
      console.error('Error loading announcements:', err)
      setError('Failed to load announcements')
    } finally {
      setLoading(false)
    }
  }

  const handleView = (announcement) => {
    setSelectedAnnouncement(announcement)
    setShowView(true)
  }

  const handleDelete = (announcement) => {
    // Only allow deletion of unpublished announcements
    if (announcement.status === 'published') {
      return // Do nothing if announcement is published
    }
    setSelectedAnnouncement(announcement)
    setShowDelete(true)
  }

  const confirmDelete = async () => {
    try {
      const response = await ApiClient.request(`/announcements/${selectedAnnouncement.id}`, {
        method: 'DELETE'
      })

      if (response.success) {
        setAnnouncementsData(prev => prev.filter(a => a.id !== selectedAnnouncement.id))
        setShowDelete(false)
        setSelectedAnnouncement(null)
      }
    } catch (err) {
      console.error('Error deleting announcement:', err)
    }
  }

  const handleAddAnnouncement = async (newAnnouncement) => {
    try {
      setAddLoading(true)
      setAnnouncementsData(prev => [...(prev || []), newAnnouncement])
      setShowAdd(false)
      await loadAnnouncements()
    } catch (err) {
      console.error('Error handling added announcement:', err)
    } finally {
      setAddLoading(false)
    }
  }

  const handleUpdateAnnouncement = async () => {
    setShowView(false)
    setSelectedAnnouncement(null)
    await loadAnnouncements()
  }

  const handleUpdateAnnouncementKeepOpen = async () => {
    const currentAnnouncementId = selectedAnnouncement?.id
    
    // Refresh announcements list first
    await loadAnnouncements()
    
    // Toggle panel off and back on with fresh announcement data
    if (currentAnnouncementId) {
      // Close panel briefly
      setShowView(false)
      setSelectedAnnouncement(null)
      
      // Small delay to ensure clean state reset, then fetch fresh data
      setTimeout(async () => {
        try {
          const response = await ApiClient.request(`/announcements/${currentAnnouncementId}`)
          if (response.success && response.data) {
            setSelectedAnnouncement(response.data)
            setShowView(true)
          }
        } catch (error) {
          console.error('Error fetching updated announcement:', error)
        }
      }, 100)
    }
  }

  const showToast = (message, type = 'success') => {
    console.log('showToast called:', { message, type })
    setToast({ show: true, message, type })
    console.log('Toast state will be updated to:', { show: true, message, type })
  }

  return (
    <div className="space-y-2">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-center">
          <i className="bi bi-exclamation-triangle mr-2"></i>
          {error}
        </div>
      )}

      <AnnouncementsContainer
        announcements={announcementsData}
        loading={loading}
        onView={handleView}
        onDelete={handleDelete}
        onRefresh={loadAnnouncements}
        onAdd={() => setShowAdd(true)}
      />

      <AddAnnouncementView 
        open={showAdd} 
        onClose={() => setShowAdd(false)}
        onSubmit={handleAddAnnouncement}
        loading={addLoading}
      />

      <AnnouncementDetailView 
        open={showView} 
        onClose={() => setShowView(false)}
        announcement={selectedAnnouncement}
        onUpdate={handleUpdateAnnouncement}
        onUpdateKeepOpen={handleUpdateAnnouncementKeepOpen}
        onToast={showToast}
      />

      <Modal
        isOpen={showDelete}
        onClose={() => setShowDelete(false)}
        title="Delete Announcement"
        type="confirm"
        confirmText="Delete"
        cancelText="Cancel"
        onConfirm={confirmDelete}
        confirmButtonClass="text-white bg-red-600 hover:bg-red-700"
      >
        {selectedAnnouncement && (
          <div>
            <p className="text-gray-600 mb-4">
              Are you sure you want to delete this announcement? This action cannot be undone.
            </p>
            <div className="bg-gray-50 p-3 rounded border">
              <p className="font-medium text-gray-900">{selectedAnnouncement.title}</p>
              <p className="text-sm text-gray-600">
                {selectedAnnouncement.status === 'published' ? 'Published' : 'Draft'}
              </p>
            </div>
          </div>
        )}
      </Modal>

      <ToastNotification
        show={toast.show}
        message={toast.message}
        type={toast.type}
        onClose={() => setToast({ show: false, message: '', type: 'success' })}
      />
    </div>
  )
}
