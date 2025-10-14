"use client"

import { useEffect, useState } from 'react'
import ApiClient from '../../../../lib/apiClient'
import UserManagementContainer from '../../../../components/authenticated/admin/UserManagementContainer'
import ToastNotification from '../../../../components/common/ToastNotification'
import PageLoadingV2 from '../../../../components/common/PageLoadingV2'
import { alertToast } from '../../../../lib/utility'
import { useRef } from 'react'

export default function UserManagementPage() {
  const [accessControlData, setAccessControlData] = useState([])
  const [accessRequestsData, setAccessRequestsData] = useState([])
  const [currentUser, setCurrentUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const toastRef = useRef()

  // Toast helper
  const handleAlert = (message, type = 'info') => alertToast(toastRef, message, type)

  useEffect(() => {
    loadUserManagementData()
  }, [])

  const loadUserManagementData = async () => {
    try {
      setLoading(true)
      setError(null)

      // Get current user info first
      const currentUserResponse = await ApiClient.getCurrentUser()
      if (currentUserResponse.success) {
        setCurrentUser(currentUserResponse.data)
      }

      // Load access control data (staff and admin users)
      const accessControlResponse = await ApiClient.getUsersWithRoles(['admin', 'staff'])
      
      // Load access requests (inactive users pending approval)
      const accessRequestsResponse = await ApiClient.getPendingAccessRequests()
      
      if (accessControlResponse.success) {
        setAccessControlData(accessControlResponse.data || [])
      } else {
        throw new Error(accessControlResponse.error || 'Failed to load access control data')
      }

      if (accessRequestsResponse.success) {
        setAccessRequestsData(accessRequestsResponse.data || [])
      } else {
        throw new Error(accessRequestsResponse.error || 'Failed to load access requests')
      }

    } catch (err) {
      console.error('Error loading user management data:', err)
      setError(err.message || 'Failed to load user management data')
      handleAlert(err.message || 'Failed to load user management data', 'error')
    } finally {
      setLoading(false)
    }
  }

  const handleRevokeAccess = async (userId, username) => {
    try {
      const response = await ApiClient.revokeUserAccess(userId)
      
      if (response.success) {
        handleAlert(`Access revoked for ${username}`, 'success')
        loadUserManagementData() // Refresh data
      } else {
        throw new Error(response.error || 'Failed to revoke access')
      }
    } catch (error) {
      console.error('Error revoking access:', error)
      handleAlert(error.message || 'Failed to revoke access', 'error')
    }
  }

  const handleGrantAccess = async (userId, username, role) => {
    try {
      const response = await ApiClient.grantUserAccess(userId, role)
      
      if (response.success) {
        handleAlert(`${role === 'admin' ? 'Admin' : 'Staff'} access granted to ${username}`, 'success')
        loadUserManagementData() // Refresh data
      } else {
        throw new Error(response.error || 'Failed to grant access')
      }
    } catch (error) {
      console.error('Error granting access:', error)
      handleAlert(error.message || 'Failed to grant access', 'error')
    }
  }

  const handleApproveRequest = async (userId, username) => {
    try {
      const response = await ApiClient.approveAccessRequest(userId)
      
      if (response.success) {
        handleAlert(`Account activated for ${username}. SMS notification sent.`, 'success')
        loadUserManagementData() // Refresh data
      } else {
        throw new Error(response.error || 'Failed to approve request')
      }
    } catch (error) {
      console.error('Error approving request:', error)
      handleAlert(error.message || 'Failed to approve request', 'error')
    }
  }

  const handleDeleteRequest = async (userId, username) => {
    try {
      const response = await ApiClient.deleteAccessRequest(userId)
      
      if (response.success) {
        handleAlert(`Registration deleted for ${username}`, 'success')
        loadUserManagementData() // Refresh data
      } else {
        throw new Error(response.error || 'Failed to delete request')
      }
    } catch (error) {
      console.error('Error deleting request:', error)
      handleAlert(error.message || 'Failed to delete request', 'error')
    }
  }

  const handleSearchUsers = async (query, options = {}) => {
    try {
      const response = await ApiClient.getAvailableUsersForAccess(
        query, 
        options.page || 1, 
        options.limit || 20
      )
      if (response.success) {
        return response.data?.users || []
      } else {
        console.error('Search failed:', response.error)
        return []
      }
    } catch (error) {
      console.error('Error searching users:', error)
      return []
    }
  }

  return (
    <>
      <PageLoadingV2 isLoading={loading} />
      <div className="p-3 sm:p-3 lg:p-3">
        {/* Breadcrumbs */}
      <nav className="flex mb-6" aria-label="Breadcrumb">
        <ol className="flex items-center space-x-2 text-sm">
          <li>
            <a href="/admin" className="text-gray-500 hover:text-gray-700">
              Dashboard
            </a>
          </li>
          <li>
            <svg className="w-4 h-4 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
            </svg>
          </li>
          <li>
            <a href="/admin/settings" className="text-gray-500 hover:text-gray-700">
              Maintenance
            </a>
          </li>
          <li>
            <svg className="w-4 h-4 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
            </svg>
          </li>
          <li>
            <span className="font-medium text-gray-900">User Management</span>
          </li>
        </ol>
      </nav>

      {/* Page Title */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">User Management</h1>
        <p className="text-sm text-gray-500 mt-1">Manage user access and review registration requests</p>
      </div>

      {/* Main Content */}
      <UserManagementContainer
        accessControlData={accessControlData}
        accessRequestsData={accessRequestsData}
        loading={loading}
        error={error}
        currentUser={currentUser}
        onRevokeAccess={handleRevokeAccess}
        onGrantAccess={handleGrantAccess}
        onApproveRequest={handleApproveRequest}
        onDeleteRequest={handleDeleteRequest}
        onSearchUsers={handleSearchUsers}
        onRefresh={loadUserManagementData}
      />

        <ToastNotification ref={toastRef} />
      </div>
    </>
  )
}
