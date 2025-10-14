'use client'

import { useState, useMemo, useEffect } from 'react'
import SlidePanel from '../../common/SlidePanel'
import Modal from '../../common/Modal'
import CustomSelect from '../../common/CustomSelect'
import PageLoadingV2 from '../../common/PageLoadingV2'

export default function UserManagementContainer({
  accessControlData = [],
  accessRequestsData = [],
  loading = false,
  error = null,
  currentUser = null,
  onRevokeAccess,
  onGrantAccess,
  onApproveRequest,
  onDeleteRequest,
  onRefresh,
  onSearchUsers,
  onUpdateUserRole
}) {
  // Access Control Table State
  const [acCurrentPage, setAcCurrentPage] = useState(1)
  const [acItemsPerPage, setAcItemsPerPage] = useState(15)
  const [acSearchQuery, setAcSearchQuery] = useState('')
  const [acRoleFilter, setAcRoleFilter] = useState('all')

  // Access Requests Table State
  const [arCurrentPage, setArCurrentPage] = useState(1)
  const [arItemsPerPage, setArItemsPerPage] = useState(15)
  const [arSearchQuery, setArSearchQuery] = useState('')

  // Modal states
  const [showRevokeModal, setShowRevokeModal] = useState(false)
  const [showGrantModal, setShowGrantModal] = useState(false)
  const [showChangeRoleModal, setShowChangeRoleModal] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [showGrantConfirmModal, setShowGrantConfirmModal] = useState(false)
  const [showApprovalModal, setShowApprovalModal] = useState(false)
  const [selectedUser, setSelectedUser] = useState(null)
  const [selectedRole, setSelectedRole] = useState('staff')

  // SlidePanel states
  const [selectedRequest, setSelectedRequest] = useState(null)
  const [showRequestPanel, setShowRequestPanel] = useState(false)
  const [selectedAccessUser, setSelectedAccessUser] = useState(null)
  const [showAccessPanel, setShowAccessPanel] = useState(false)
  const [showAddAccessPanel, setShowAddAccessPanel] = useState(false)
  const [showUserDetails, setShowUserDetails] = useState(false)
  const [showAddUserSearch, setShowAddUserSearch] = useState(false)
  
  // Loading states
  const [accessPanelLoading, setAccessPanelLoading] = useState(false)
  const [addAccessLoading, setAddAccessLoading] = useState(false)
  const [isLoadingUserDetails, setIsLoadingUserDetails] = useState(false)
  const [isLoadingUserSearch, setIsLoadingUserSearch] = useState(false)
  const [isRefreshingUserPermissions, setIsRefreshingUserPermissions] = useState(false)
  const [isRefreshingAccessRequests, setIsRefreshingAccessRequests] = useState(false)
  
  // Add Access functionality with lazy loading
  const [allUsers, setAllUsers] = useState([])
  const [userSearchQuery, setUserSearchQuery] = useState('')
  const [userSearchResults, setUserSearchResults] = useState([])
  const [newUserRole, setNewUserRole] = useState('staff')
  const [usersPage, setUsersPage] = useState(1)
  const [hasMoreUsers, setHasMoreUsers] = useState(true)
  const [isLoadingMoreUsers, setIsLoadingMoreUsers] = useState(false)
  const [searchTimeout, setSearchTimeout] = useState(null)

  // Filter and paginate Access Control data
  const filteredAccessControl = useMemo(() => {
    let filtered = accessControlData.filter(user => {
      // Only show users with roles 1 or 2 (admin or staff) and active status
      const roleAllowed = user.role === 1 || user.role === 2 || user.role === 'admin' || user.role === 'staff'
      const isActiveUser = user.is_active === 1 || user.is_active === true
      
      const searchMatch = !acSearchQuery || 
        user.username?.toLowerCase().includes(acSearchQuery.toLowerCase()) ||
        user.first_name?.toLowerCase().includes(acSearchQuery.toLowerCase()) ||
        user.last_name?.toLowerCase().includes(acSearchQuery.toLowerCase())
      
      const roleMatch = acRoleFilter === 'all' || user.role === acRoleFilter

      return roleAllowed && isActiveUser && searchMatch && roleMatch
    })



    const startIndex = (acCurrentPage - 1) * acItemsPerPage
    return filtered.slice(startIndex, startIndex + acItemsPerPage)
  }, [accessControlData, acSearchQuery, acRoleFilter, acCurrentPage, acItemsPerPage])

  // Filter and paginate Access Requests data
  const filteredAccessRequests = useMemo(() => {
    let filtered = accessRequestsData.filter(request => {
      const searchMatch = !arSearchQuery || 
        request.username?.toLowerCase().includes(arSearchQuery.toLowerCase()) ||
        request.first_name?.toLowerCase().includes(arSearchQuery.toLowerCase()) ||
        request.last_name?.toLowerCase().includes(arSearchQuery.toLowerCase())

      return searchMatch
    })

    const startIndex = (arCurrentPage - 1) * arItemsPerPage
    return filtered.slice(startIndex, startIndex + arItemsPerPage)
  }, [accessRequestsData, arSearchQuery, arCurrentPage, arItemsPerPage])

  const handleViewDocument = (request) => {
    setSelectedRequest(request)
    setShowRequestPanel(true)
  }

  const handleRevokeClick = (user) => {
    setSelectedUser(user)
    setShowRevokeModal(true)
  }

  const handleGrantClick = (user) => {
    setSelectedUser(user)
    setSelectedRole('staff')
    setShowGrantModal(true)
  }

  const handleDeleteClick = (request) => {
    setSelectedUser(request)
    setShowDeleteModal(true)
  }

  const confirmRevoke = () => {
    if (selectedUser && onRevokeAccess) {
      onRevokeAccess(selectedUser.id, selectedUser.username)
    }
    setShowRevokeModal(false)
    setSelectedUser(null)
  }

  const confirmGrant = () => {
    if (selectedUser && onGrantAccess) {
      onGrantAccess(selectedUser.id, selectedUser.username, selectedRole)
    }
    setShowGrantModal(false)
    setSelectedUser(null)
  }

  const confirmGrantPermission = () => {
    if (selectedUser && onGrantAccess) {
      handleAddUserAccess(selectedUser, selectedRole)
      setShowGrantConfirmModal(false)
      setShowAddUserSearch(false)
      setSelectedUser(null)
      setSelectedRole('staff')
      setUserSearchQuery('')
      setUserSearchResults([])
    }
  }

  const confirmDelete = () => {
    if (selectedUser && onDeleteRequest) {
      onDeleteRequest(selectedUser.user_id || selectedUser.id, selectedUser.username)
    }
    setShowDeleteModal(false)
    setSelectedUser(null)
  }

  const handleApprove = (request) => {
    setSelectedUser(request)
    setShowApprovalModal(true)
    // Keep the slide panel open when showing approval modal
  }

  const confirmApproval = () => {
    if (selectedUser && onApproveRequest) {
      onApproveRequest(selectedUser.user_id || selectedUser.id, selectedUser.username)
    }
    setShowApprovalModal(false)
    setSelectedUser(null)
    setShowRequestPanel(false) // Close the slide panel after approval
  }

  // New handlers for Access Control
  const handleViewUser = async (user) => {
    setAccessPanelLoading(true)
    setSelectedAccessUser(user)
    setShowAccessPanel(true)
    
    // Simulate loading time for skeleton effect
    setTimeout(() => {
      setAccessPanelLoading(false)
    }, 800)
  }

  const handleChangeRoleClick = (user) => {
    setSelectedUser(user)
    setSelectedRole(user.role)
    setShowChangeRoleModal(true)
  }

  // Load users using the onSearchUsers prop
  const loadUsers = async (page = 1, searchQuery = '', append = false) => {
    try {
      if (page === 1 && !append) {
        setIsLoadingUserSearch(true)
      } else if (append) {
        setIsLoadingMoreUsers(true)
      }

      if (onSearchUsers) {
        // Use the onSearchUsers prop which should handle the API call
        const users = await onSearchUsers(searchQuery, {
          role: 3, // Only residents (role = 3)
          include_inactive: false, // Only active users (is_active=1)
          is_active: 1, // Explicitly request only active users
          page: page,
          limit: 20
        })

        if (users && Array.isArray(users)) {
          // Filter for active users only (users.is_active = 1) and exclude users who already have staff/admin access
          const availableUsers = users.filter(user => {
            // Check if user is active in users table (users.is_active = 1) - THIS IS THE KEY CHECK
            const isUserActive = user.is_active === 1 || user.is_active === true
            
            // Check if user doesn't already have staff/admin access
            const doesntHaveAccess = !accessControlData.some(acUser => acUser.id === user.id)
            
            // Only include users who are ACTIVE in users table (users.is_active=1) and don't have existing access
            // We only care about users.is_active, not residents.is_active for staff role assignment
            return isUserActive && doesntHaveAccess
          })

          if (append) {
            setAllUsers(prev => [...prev, ...availableUsers])
            setUserSearchResults(prev => [...prev, ...availableUsers])
          } else {
            setAllUsers(availableUsers)
            setUserSearchResults(availableUsers)
          }

          setHasMoreUsers(users.length === 20)
          setUsersPage(page)
        } else {
          setAllUsers([])
          setUserSearchResults([])
          setHasMoreUsers(false)
        }
      }
    } catch (error) {
      // Error loading users
    } finally {
      setIsLoadingUserSearch(false)
      setIsLoadingMoreUsers(false)
    }
  }

  const handleAddAccessClick = async () => {
    setShowAddUserSearch(true)
    setUserSearchQuery('')
    setUsersPage(1)
    setAllUsers([])
    setUserSearchResults([])
    setHasMoreUsers(true)
    await loadUsers(1, '', false)
  }

  const handleUserSearchChange = (query) => {
    setUserSearchQuery(query)
  }

  const confirmChangeRole = () => {
    if (selectedUser && onUpdateUserRole) {
      onUpdateUserRole(selectedUser.id, selectedUser.username, selectedRole)
    }
    setShowChangeRoleModal(false)
    setSelectedUser(null)
  }

  const handleGrantAccessToUser = (user) => {
    if (onGrantAccess) {
      onGrantAccess(user.id, user.username, newUserRole)
    }
    setShowAddAccessPanel(false)
    setNewUserRole('staff')
  }

  const handleRoleChange = async (user, newRole) => {
    if (newRole === user.role) return
    
    try {
      setIsLoadingUserDetails(true)
      if (onGrantAccess && newRole === 'admin') {
        await onGrantAccess(user.id, user.username, 'admin')
      } else if (onUpdateUserRole) {
        await onUpdateUserRole(user.id, user.username, newRole)
      }
      setSelectedUser({ ...user, role: newRole })
    } catch (error) {
      // Error updating user role
    } finally {
      setIsLoadingUserDetails(false)
    }
  }

  const handleAddUserAccess = async (user, role) => {
    if (onGrantAccess) {
      await onGrantAccess(user.id, user.username, role)
      setShowAddUserSearch(false)
      setUserSearchQuery('')
      setUserSearchResults([])
    }
  }

  // Handle refresh for user permissions
  const handleRefreshUserPermissions = async () => {
    if (onRefresh) {
      setIsRefreshingUserPermissions(true)
      try {
        await onRefresh('user_permissions')
      } finally {
        setIsRefreshingUserPermissions(false)
      }
    }
  }

  // Handle refresh for access requests
  const handleRefreshAccessRequests = async () => {
    if (onRefresh) {
      setIsRefreshingAccessRequests(true)
      try {
        await onRefresh('access_requests')
      } finally {
        setIsRefreshingAccessRequests(false)
      }
    }
  }

  // Real-time search with debouncing (like residents container)
  useEffect(() => {
    if (searchTimeout) {
      clearTimeout(searchTimeout)
    }

    const newTimeout = setTimeout(() => {
      if (userSearchQuery.trim()) {
        // Reset pagination and search from server
        setUsersPage(1)
        setAllUsers([])
        setUserSearchResults([])
        setHasMoreUsers(true)
        loadUsers(1, userSearchQuery, false)
      } else {
        // If empty search, load all users
        setUsersPage(1)
        setAllUsers([])
        setUserSearchResults([])
        setHasMoreUsers(true)
        loadUsers(1, '', false)
      }
    }, 300) // 300ms debounce like residents

    setSearchTimeout(newTimeout)

    return () => {
      if (newTimeout) {
        clearTimeout(newTimeout)
      }
    }
  }, [userSearchQuery])

  // Load more users (pagination)
  const loadMoreUsers = () => {
    if (hasMoreUsers && !isLoadingMoreUsers) {
      loadUsers(usersPage + 1, userSearchQuery, true)
    }
  }

  // Check if current user is admin or staff
  const isCurrentUserAdmin = currentUser?.role === 'admin' || currentUser?.role === 1
  const hasManagementAccess = isCurrentUserAdmin

  // Check if user can be edited (admins can edit anyone except themselves, staff can view but not edit)
  const canEditUser = (user) => {
    return currentUser?.id !== user.id && isCurrentUserAdmin // Only admins can edit
  }

  if (loading) {
    return <PageLoadingV2 message="Loading user management data..." />
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <div className="flex">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-red-800">Error Loading Data</h3>
            <p className="mt-1 text-sm text-red-700">{error}</p>
            <button
              onClick={onRefresh}
              className="mt-2 text-sm bg-red-100 hover:bg-red-200 text-red-800 px-3 py-1 rounded"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Two-column layout for larger screens */}
      <div className="grid grid-cols-1 xl:grid-cols-2 space-y-3 xl:space-y-0 xl:space-x-3">
        {/* User Permission Panel - Admin and Staff */}
        {hasManagementAccess && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="px-4 py-3 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">Manage User Permission</h2>
                  <p className="text-sm text-gray-500 mt-1">Manage user permissions and control</p>
                </div>
                <div className="flex items-center space-x-3">
                  {isCurrentUserAdmin && (
                    <button
                      onClick={handleAddAccessClick}
                      className="cursor-pointer bg-green-600 text-white px-3 py-2 text-sm font-medium rounded-md hover:bg-green-700 transition-colors"
                    >
                      Add Staff
                    </button>
                  )}
                  {onRefresh && (
                    <button
                      onClick={handleRefreshUserPermissions}
                      disabled={isRefreshingUserPermissions}
                      className="inline-flex items-center justify-center w-9 h-9 text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200 focus:ring-1 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors cursor-pointer"
                      title="Refresh user permissions"
                    >
                      <i className={`bi ${isRefreshingUserPermissions ? 'bi-arrow-clockwise animate-spin' : 'bi-arrow-clockwise'} text-md`}></i>
                    </button>
                  )}
                </div>
              </div>
              
              {/* Search and filters */}
              <div className="mt-3 flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-3">
                <div className="flex-1">
                  <input
                    type="text"
                    placeholder="Search users..."
                    value={acSearchQuery}
                    onChange={(e) => setAcSearchQuery(e.target.value)}
                    className="w-full rounded-md px-3 py-2 text-sm border border-gray-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  />
                </div>
                <CustomSelect
                  value={acRoleFilter}
                  onChange={setAcRoleFilter}
                  options={[
                    { value: 'all', label: 'All Roles' },
                    { value: 'admin', label: 'Admin Only' },
                    { value: 'staff', label: 'Staff Only' }
                  ]}
                  placeholder="All Roles"
                  title="Filter by Role"
                  className="w-full sm:w-50 sm:h-10"
                />
              </div>
            </div>

            {/* Access Control Table - Compact Design */}
            <div className="overflow-x-auto overflow-y-auto max-h-[calc(100vh-400px)] min-h-[300px]">
              <table className="w-full text-sm">
                <thead className="bg-gray-100 sticky top-0 z-10">
                  <tr className="h-8">
                    <th className="px-3 py-1 text-left text-xs font-medium text-gray-600 uppercase tracking-wide">User</th>
                    <th className="px-3 py-1 text-left text-xs font-medium text-gray-600 uppercase tracking-wide">Role</th>
                    <th className="px-3 py-1 text-center text-xs font-medium text-gray-600 uppercase tracking-wide">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-100">
                  {isRefreshingUserPermissions ? (
                    // Skeleton loading rows
                    [...Array(5)].map((_, index) => (
                      <tr key={`skeleton-ac-${index}`} className="h-12 animate-pulse">
                        <td className="px-3 py-1">
                          <div>
                            <div className="h-4 bg-gray-200 rounded w-32 mb-1"></div>
                            <div className="h-3 bg-gray-200 rounded w-24"></div>
                          </div>
                        </td>
                        <td className="px-3 py-1">
                          <div className="h-5 bg-gray-200 rounded-full w-16"></div>
                        </td>
                        <td className="px-3 py-1">
                          <div className="flex items-center justify-center">
                            <div className="h-6 bg-gray-200 rounded w-16"></div>
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : filteredAccessControl.length === 0 ? (
                    <tr>
                      <td colSpan="3" className="px-6 py-12">
                        <div className="text-center">
                          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m3 5.197V9a3 3 0 00-6 0v12" />
                            </svg>
                          </div>
                          <h3 className="text-sm font-medium text-gray-900 mb-1">No staff members yet</h3>
                          <p className="text-xs text-gray-500 mb-4">Get started by adding staff members to help manage your barangay</p>
                          <button
                            onClick={handleAddAccessClick}
                            className="inline-flex items-center px-3 py-2 text-sm font-medium text-white bg-green-600 rounded-md hover:bg-green-700 transition-colors"
                          >
                            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                            </svg>
                            Add First Staff Member
                          </button>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    filteredAccessControl.map((user) => (
                      <tr key={user.id} className="h-12 hover:bg-gray-50 transition-colors">
                        <td className="px-3 py-1">
                          <div>
                            <p className="text-sm font-medium text-gray-900 truncate leading-tight">
                              {user.first_name && user.last_name 
                                ? `${user.first_name} ${user.last_name}` 
                                : user.username
                              }
                            </p>
                            <p className="text-xs text-gray-500 truncate leading-tight">@{user.username}</p>
                          </div>
                        </td>
                        <td className="px-3 py-1">
                          <span className={`inline-flex px-2 py-0.5 text-xs font-medium rounded-full ${
                            user.role === 'admin' 
                              ? 'bg-red-100 text-red-700' 
                              : 'bg-blue-100 text-blue-700'
                          }`}>
                            {user.role === 'admin' ? 'Admin' : 'Staff'}
                          </span>
                        </td>
                        <td className="px-3 py-1">
                          <div className="flex items-center justify-center">
                            {canEditUser(user) ? (
                              <button
                                onClick={() => handleRevokeClick(user)}
                                className="px-2 py-1 text-xs font-medium text-red-700 bg-red-50 border border-red-200 rounded hover:bg-red-100 hover:border-red-300 transition-colors cursor-pointer"
                              >
                                Revoke
                              </button>
                            ) : (
                              <span className="text-xs text-gray-400 italic">
                                Own Account
                              </span>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Access Requests Panel */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="p-3 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Access Requests</h2>
                <p className="text-sm text-gray-500 mt-1">Pending registration approvals</p>
              </div>
              <div className="flex items-center space-x-3">
                <span className="bg-orange-100 text-orange-800 text-xs font-medium px-2.5 py-1 rounded-full">
                  {accessRequestsData.length} Pending
                </span>
                {onRefresh && (
                  <button
                    onClick={handleRefreshAccessRequests}
                    disabled={isRefreshingAccessRequests}
                    className="inline-flex items-center justify-center w-9 h-9 text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200 focus:ring-1 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors cursor-pointer"
                    title="Refresh access requests"
                  >
                    <i className={`bi ${isRefreshingAccessRequests ? 'bi-arrow-clockwise animate-spin' : 'bi-arrow-clockwise'} text-md`}></i>
                  </button>
                )}
              </div>
            </div>
            
            {/* Search */}
            <div className="mt-3">
              <input
                type="text"
                placeholder="Search by name or username..."
                value={arSearchQuery}
                onChange={(e) => setArSearchQuery(e.target.value)}
                className="w-full rounded-md px-3 py-2 text-sm border border-gray-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Access Requests Table - Compact Design */}
          <div className="overflow-x-auto overflow-y-auto max-h-[calc(100vh-400px)] min-h-[300px]">
            <table className="w-full text-sm">
              <thead className="bg-gray-100 sticky top-0 z-10">
                <tr className="h-8">
                  <th className="px-3 py-1 text-left text-xs font-medium text-gray-600 uppercase tracking-wide">Applicant</th>
                  <th className="px-3 py-1 text-left text-xs font-medium text-gray-600 uppercase tracking-wide">Registered at</th>
                  <th className="px-3 py-1 text-center text-xs font-medium text-gray-600 uppercase tracking-wide">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-100">
                {isRefreshingAccessRequests ? (
                  // Skeleton loading rows
                  [...Array(5)].map((_, index) => (
                    <tr key={`skeleton-ar-${index}`} className="h-12 animate-pulse">
                      <td className="px-3 py-1">
                        <div>
                          <div className="h-4 bg-gray-200 rounded w-32 mb-1"></div>
                          <div className="h-3 bg-gray-200 rounded w-24"></div>
                        </div>
                      </td>
                      <td className="px-3 py-1">
                        <div className="h-4 bg-gray-200 rounded w-40"></div>
                      </td>
                      <td className="px-3 py-1">
                        <div className="flex items-center justify-center">
                          <div className="h-6 bg-gray-200 rounded w-16"></div>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : filteredAccessRequests.length === 0 ? (
                  <tr>
                    <td colSpan="3" className="px-6 py-12">
                      <div className="text-center">
                        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                          <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                        </div>
                        <h3 className="text-sm font-medium text-gray-900 mb-1">No pending requests</h3>
                        <p className="text-xs text-gray-500">Access requests from residents will appear here for your review</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredAccessRequests.map((request) => (
                    <tr 
                      key={request.id} 
                      className="h-12 hover:bg-gray-50 transition-colors"
                    >
                      <td className="px-3 py-1">
                        <div>
                          <p className="text-sm font-medium text-gray-900 truncate leading-tight">
                            {request.first_name} {request.last_name}
                          </p>
                          <p className="text-xs text-gray-500 truncate leading-tight">@{request.username}</p>
                        </div>
                      </td>
                      <td className="px-3 py-1">
                        <div className="text-sm text-gray-700">
                          {new Date(request.created_at).toLocaleString('en-US', { 
                            month: 'short', 
                            day: 'numeric',
                            year: 'numeric',
                            hour: 'numeric',
                            minute: '2-digit',
                            hour12: true
                          })}
                        </div>
                      </td>
                      <td className="px-3 py-1">
                        <div className="flex items-center justify-center">
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              handleViewDocument(request)
                            }}
                            className="px-2 py-1 text-xs font-medium text-gray-700 bg-white border border-gray-300 rounded hover:bg-gray-50 transition-colors inline-flex items-center cursor-pointer"
                          >
                            <i className="bi bi-eye text-xs mr-1"></i>
                            View
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Modals */}
      <Modal
        isOpen={showRevokeModal}
        onClose={() => setShowRevokeModal(false)}
        title="Confirm Revoke Access"
        type="confirm"
        variant="danger"
        confirmText="Revoke Access"
        cancelText="Cancel"
        onConfirm={confirmRevoke}
        size="sm"
      >
        <p className="text-gray-700">
          Are you sure you want to revoke access privileges for this user?
        </p>
      </Modal>

      <Modal
        isOpen={showGrantModal}
        onClose={() => setShowGrantModal(false)}
        title="Grant Access"
        type="custom"
        size="sm"
      >
        <div>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">Role</label>
            <CustomSelect
              value={selectedRole}
              onChange={setSelectedRole}
              options={[
                { value: 'staff', label: 'Staff' },
                { value: 'admin', label: 'Administrator' }
              ]}
              placeholder="Select Role"
              title="Select Role"
              className="w-full !px-3 !py-1.5 !min-h-[36px] text-sm"
            />
          </div>
          <div className="flex justify-end space-x-3">
            <button
              onClick={() => setShowGrantModal(false)}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              onClick={confirmGrant}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700"
            >
              Grant Access
            </button>
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        title="Confirm Deletion"
        type="confirm"
        variant="danger"
        confirmText="Delete Registration"
        cancelText="Cancel"
        onConfirm={confirmDelete}
        size="sm"
      >
        <p className="text-gray-700">
          Are you sure you want to delete this registration? This action cannot be undone.
        </p>
      </Modal>

      <Modal
        isOpen={showApprovalModal}
        onClose={() => setShowApprovalModal(false)}
        title="Confirm Activation"
        type="confirm"
        variant="success"
        confirmText="Yes, Confirm"
        cancelText="Cancel"
        onConfirm={confirmApproval}
        size="md"
      >
        <div className="space-y-3">
          <p className="text-sm text-gray-600">
            Are you sure you want to approve and activate this user account?
          </p>
          
          <div className="bg-gray-50 rounded border border-gray-200 p-3">
            <div className="space-y-2">
              <div className="flex items-center text-sm text-gray-600">
                <i className="bi bi-check-circle text-green-500 mr-2"></i>
                <span>Activate user account</span>
              </div>
              <div className="flex items-center text-sm text-gray-600">
                <i className="bi bi-check-circle text-green-500 mr-2"></i>
                <span>Grant resident access</span>
              </div>
              <div className="flex items-center text-sm text-gray-600">
                <i className="bi bi-check-circle text-green-500 mr-2"></i>
                <span>Send SMS notification</span>
              </div>
            </div>
          </div>
        </div>
      </Modal>

      {/* Grant Permission Confirmation Modal */}
      <Modal
        isOpen={showGrantConfirmModal}
        onClose={() => setShowGrantConfirmModal(false)}
        title="Confirm Grant Permission"
        type="confirm"
        variant="success"
        confirmText="Yes, Confirm"
        cancelText="Back"
        onConfirm={confirmGrantPermission}
        size="sm"
      >
        <p className="text-sm text-gray-600">
          Are you sure you want to grant <span className="font-semibold">{selectedRole === 'admin' ? 'Admin' : 'Staff'}</span> access to <span className="font-semibold">{selectedUser?.username}</span>?
        </p>
      </Modal>

      {/* User Details SlidePanel */}
      <SlidePanel
        open={showUserDetails}
        onClose={() => setShowUserDetails(false)}
        title="User Details"
        size="md"
      >
        {isLoadingUserDetails ? (
          <div className="space-y-6 p-6">
            {/* User Info Skeleton */}
            <div className="space-y-4">
              <div className="h-4 bg-gray-200 rounded animate-pulse w-1/3"></div>
              <div className="space-y-2">
                <div className="h-3 bg-gray-200 rounded animate-pulse w-2/3"></div>
                <div className="h-3 bg-gray-200 rounded animate-pulse w-1/2"></div>
                <div className="h-3 bg-gray-200 rounded animate-pulse w-3/4"></div>
              </div>
            </div>
            
            {/* Role Section Skeleton */}
            <div className="space-y-3">
              <div className="h-4 bg-gray-200 rounded animate-pulse w-1/4"></div>
              <div className="h-10 bg-gray-200 rounded animate-pulse"></div>
            </div>
            
            {/* Actions Skeleton */}
            <div className="space-y-3">
              <div className="h-4 bg-gray-200 rounded animate-pulse w-1/3"></div>
              <div className="flex space-x-2">
                <div className="h-9 bg-gray-200 rounded animate-pulse w-20"></div>
                <div className="h-9 bg-gray-200 rounded animate-pulse w-24"></div>
              </div>
            </div>
          </div>
        ) : selectedUser ? (
          <div className="space-y-3 p-3">
            {/* User Information */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">User Information</h3>
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Username</label>
                  <p className="mt-1 text-sm text-gray-900">@{selectedUser.username}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Full Name</label>
                  <p className="mt-1 text-sm text-gray-900">
                    {selectedUser.first_name} {selectedUser.last_name}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Role</label>
                  <span className={`mt-1 inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                    selectedUser.role === 'admin' 
                      ? 'bg-red-100 text-red-800' 
                      : 'bg-blue-100 text-blue-800'
                  }`}>
                    {selectedUser.role === 'admin' ? 'Administrator' : 'Staff'}
                  </span>
                </div>
              </div>
            </div>

            {/* Role Management - Only if user can edit */}
            {canEditUser(selectedUser) && (
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">Role Management</h3>
                <div className="space-y-3">
                  <label className="block text-sm font-medium text-gray-700">
                    Change Role
                  </label>
                  <CustomSelect
                    value={selectedUser.role}
                    onChange={(newRole) => handleRoleChange(selectedUser, newRole)}
                    options={[
                      { value: 'staff', label: 'Staff' },
                      { value: 'admin', label: 'Administrator' }
                    ]}
                    placeholder="Select role"
                    title="User Role"
                    className="!px-3 !py-1.5 !min-h-[36px] text-sm"
                  />
                  <p className="text-xs text-gray-500">
                    Changing a user's role will immediately update their access permissions.
                  </p>
                </div>
              </div>
            )}

            {/* Actions */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">Actions</h3>
              <div className="space-y-3">
                {canEditUser(selectedUser) && (
                  <>
                    {selectedUser.role === 'staff' && (
                      <button
                        onClick={() => handleGrantClick(selectedUser)}
                        className="w-full text-left px-4 py-2 text-sm text-blue-600 hover:bg-blue-50 rounded-md border border-blue-200 hover:border-blue-300"
                      >
                        Promote to Administrator
                      </button>
                    )}
                    <button
                      onClick={() => handleRevokeClick(selectedUser)}
                      className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 rounded-md border border-red-200 hover:border-red-300"
                    >
                      Revoke Access
                    </button>
                  </>
                )}
                {!canEditUser(selectedUser) && (
                  <div className="text-sm text-gray-500 italic">
                    You cannot modify your own account permissions.
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : null}
      </SlidePanel>

      {/* Manage Permission SlidePanel */}
      <SlidePanel
        open={showAddUserSearch}
        onClose={() => {
          setShowAddUserSearch(false)
          setSelectedUser(null)
          setSelectedRole('staff')
          setUserSearchQuery('')
          setUserSearchResults([])
        }}
        title="Manage User Permission"
        size="md"
        showFooter={true}
        cancelText="Cancel"
        confirmText="Grant Permission"
        confirmDisabled={!selectedUser}
        onConfirm={() => {
          if (selectedUser) {
            setShowGrantConfirmModal(true)
          }
        }}
      >
        <div>
          {/* Main Card Container */}
          <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
            {/* Search Header */}
            <div className="p-3 border-b border-gray-200">
              <input
                type="text"
                placeholder="Search by name or username..."
                value={userSearchQuery}
                onChange={(e) => handleUserSearchChange(e.target.value)}
                className="w-full rounded-md p-3 text-sm border border-gray-300 focus:border-green-500 focus:ring-1 focus:ring-green-500 focus:outline-none"
              />
            </div>

            {/* Users List */}
            <div className="max-h-80 overflow-y-auto">
              {isLoadingUserSearch ? (
                <div className="text-center py-8 text-gray-500 text-sm">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-gray-400 mx-auto mb-2"></div>
                  Loading users...
                </div>
              ) : userSearchResults.length === 0 ? (
                  <div className="text-center py-8 text-gray-500 text-sm">
                    {userSearchQuery ? 'No users found matching your search' : 'No active resident users available'}
                  </div>
                ) : (
                  <div className="divide-y divide-gray-100">
                    {userSearchResults.map(user => (
                      <div 
                        key={user.id} 
                        className="p-3 cursor-pointer transition-colors hover:bg-gray-50"
                        onClick={() => setSelectedUser(user)}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0">
                              <span className="text-white text-sm font-medium">
                                {user.first_name?.charAt(0)}{user.last_name?.charAt(0)}
                              </span>
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="text-sm font-medium text-gray-900 truncate">
                                {user.first_name} {user.last_name}
                              </p>
                              <p className="text-sm text-gray-500 truncate">
                                {user.mobile_number || 'No contact number'}
                              </p>
                            </div>
                          </div>
                          {selectedUser?.id === user.id && (
                            <div className="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0">
                              <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                              </svg>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                    
                    {/* Load More Button */}
                    {hasMoreUsers && (
                      <div className="p-4 text-center border-t border-gray-100">
                        <button
                          onClick={loadMoreUsers}
                          disabled={isLoadingMoreUsers}
                          className="inline-flex items-center justify-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {isLoadingMoreUsers ? (
                            <>
                              <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-gray-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                              </svg>
                              Loading more...
                            </>
                          ) : (
                            'Load More Users'
                          )}
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Role Selection */}
            {selectedUser && (
              <div className="mt-4 rounded-lg border border-gray-200 shadow-sm p-4">
                <p className="text-sm font-medium text-gray-900 mb-3">
                  Selected: {selectedUser.first_name} {selectedUser.last_name}
                </p>
                <CustomSelect
                  value={selectedRole}
                  onChange={setSelectedRole}
                  options={[
                    { value: 'staff', label: 'Staff Access' },
                    { value: 'admin', label: 'Admin Access' }
                  ]}
                  placeholder="Select role to grant"
                  title="Select Role"
                  className="w-full !px-3 !py-1.5 !min-h-[36px] text-sm"
                />
              </div>
            )}
          </div>
      </SlidePanel>

      {/* SlidePanel for viewing documents */}
      <SlidePanel
        open={showRequestPanel}
        onClose={() => setShowRequestPanel(false)}
        title={selectedRequest ? `Access Review: ${selectedRequest.first_name} ${selectedRequest.last_name}` : 'Review Registration'}
        size="lg"
        showFooter={true}
        cancelText="Cancel"
        confirmText="Approve & Activate"
        onConfirm={() => {
          if (selectedRequest) {
            handleApprove(selectedRequest)
          }
        }}
      >
        {selectedRequest && (
          <div className="p-3 space-y-4">
            {/* Personal Information Card */}
            <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Personal Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-medium text-gray-700">Name:</span>
                  <p className="text-gray-900 mt-1">{selectedRequest.first_name} {selectedRequest.middle_name} {selectedRequest.last_name}</p>
                </div>
                <div>
                  <span className="font-medium text-gray-700">Username:</span>
                  <p className="text-gray-900 mt-1">@{selectedRequest.username}</p>
                </div>
                <div>
                  <span className="font-medium text-gray-700">Mobile:</span>
                  <p className="text-gray-900 mt-1">{selectedRequest.mobile_number || '-'}</p>
                </div>
                <div>
                  <span className="font-medium text-gray-700">Address:</span>
                  <p className="text-gray-900 mt-1">{selectedRequest.address || '-'}</p>
                </div>
              </div>
            </div>

            {/* Submitted Document Card */}
            <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Submitted Document</h3>
              {selectedRequest.attachment_image ? (
                <div className="border border-gray-200 rounded-lg p-4 overflow-auto bg-gray-50">
                  <img
                    src={`${process.env.NEXT_PUBLIC_UPLOADS_URL || 'http://localhost:9000/uploads'}/${selectedRequest.attachment_image}`}
                    alt="Proof of Residency"
                    className="max-w-full max-h-[600px] h-auto rounded object-contain mx-auto"
                    onError={(e) => {
                      e.target.style.display = 'none'
                      e.target.nextSibling.style.display = 'block'
                    }}
                  />
                  <div style={{ display: 'none' }} className="text-center py-8 text-gray-500">
                    <svg className="w-12 h-12 mx-auto mb-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    Document could not be loaded
                  </div>
                </div>
              ) : (
                <div className="border border-gray-200 rounded-lg p-8 text-center text-gray-500 bg-gray-50">
                  <svg className="w-12 h-12 mx-auto mb-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  No document attached
                </div>
              )}
            </div>
          </div>
        )}
      </SlidePanel>

    </div>
  )
}
