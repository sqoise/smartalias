'use client'

import { useState } from 'react'

export default function RequestHistory() {
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [showRequestDetails, setShowRequestDetails] = useState(false)
  const [selectedRequest, setSelectedRequest] = useState(null)

  // Demo: Sample request data
  const requests = [
    {
      id: 'REQ-2024-001',
      document: 'Barangay Clearance',
      purpose: 'Employment',
      status: 'completed',
      requestDate: '2024-09-15',
      completedDate: '2024-09-17',
      notes: 'For job application at ABC Company',
      fee: '50.00'
    },
    {
      id: 'REQ-2024-002',
      document: 'Certificate of Residency',
      purpose: 'School Enrollment',
      status: 'processing',
      requestDate: '2024-09-16',
      completedDate: null,
      notes: 'For college admission requirements',
      fee: '30.00'
    },
    {
      id: 'REQ-2024-003',
      document: 'Business Permit',
      purpose: 'Business Registration',
      status: 'pending',
      requestDate: '2024-09-17',
      completedDate: null,
      notes: 'Small sari-sari store permit',
      fee: '150.00'
    },
    {
      id: 'REQ-2024-004',
      document: 'Indigency Certificate',
      purpose: 'Medical Assistance',
      status: 'rejected',
      requestDate: '2024-09-10',
      completedDate: '2024-09-12',
      notes: 'For hospital bill assistance',
      fee: '0.00',
      rejectionReason: 'Incomplete supporting documents'
    },
    {
      id: 'REQ-2024-005',
      document: 'Barangay Clearance',
      purpose: 'Business Registration',
      status: 'ready',
      requestDate: '2024-09-14',
      completedDate: '2024-09-16',
      notes: 'For business permit application',
      fee: '50.00'
    }
  ]

  // Filter requests based on search and status
  const filteredRequests = requests.filter(request => {
    const matchesSearch = request.document.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         request.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         request.purpose.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === 'all' || request.status === statusFilter
    return matchesSearch && matchesStatus
  })

  // Status badge styling
  const getStatusBadge = (status) => {
    const styles = {
      pending: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      processing: 'bg-blue-100 text-blue-800 border-blue-200',
      ready: 'bg-green-100 text-green-800 border-green-200',
      completed: 'bg-gray-100 text-gray-800 border-gray-200',
      rejected: 'bg-red-100 text-red-800 border-red-200'
    }
    
    const labels = {
      pending: 'Pending Review',
      processing: 'Processing',
      ready: 'Ready for Pickup',
      completed: 'Completed',
      rejected: 'Rejected'
    }

    return (
      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${styles[status]}`}>
        {labels[status]}
      </span>
    )
  }

  // Status icon
  const getStatusIcon = (status) => {
    const icons = {
      pending: 'bi-clock',
      processing: 'bi-gear',
      ready: 'bi-check-circle',
      completed: 'bi-check-circle-fill',
      rejected: 'bi-x-circle'
    }
    
    const colors = {
      pending: 'text-yellow-600',
      processing: 'text-blue-600',
      ready: 'text-green-600',
      completed: 'text-gray-600',
      rejected: 'text-red-600'
    }

    return <i className={`${icons[status]} ${colors[status]}`}></i>
  }

  const openRequestDetails = (request) => {
    setSelectedRequest(request)
    setShowRequestDetails(true)
  }

  return (
    <>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Request History</h1>
            <p className="text-sm text-gray-600 mt-1">Track your document requests and their status</p>
          </div>
          <div className="flex items-center gap-2">
            <i className="bi bi-clock-history text-xl text-gray-400"></i>
          </div>
        </div>

        {/* Search and Filter Bar */}
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
          <div className="flex flex-col sm:flex-row gap-4">
            {/* Search */}
            <div className="flex-1">
              <div className="relative">
                <i className="bi bi-search absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"></i>
                <input
                  type="text"
                  placeholder="Search by document type, request ID, or purpose..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>
            
            {/* Status Filter */}
            <div className="sm:w-48">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="all">All Status</option>
                <option value="pending">Pending Review</option>
                <option value="processing">Processing</option>
                <option value="ready">Ready for Pickup</option>
                <option value="completed">Completed</option>
                <option value="rejected">Rejected</option>
              </select>
            </div>
          </div>
        </div>

        {/* Request Summary Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 text-center">
            <div className="text-2xl font-bold text-gray-900">{requests.length}</div>
            <div className="text-sm text-gray-600">Total Requests</div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 text-center">
            <div className="text-2xl font-bold text-blue-600">{requests.filter(r => r.status === 'processing').length}</div>
            <div className="text-sm text-gray-600">Processing</div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 text-center">
            <div className="text-2xl font-bold text-green-600">{requests.filter(r => r.status === 'ready').length}</div>
            <div className="text-sm text-gray-600">Ready</div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 text-center">
            <div className="text-2xl font-bold text-gray-600">{requests.filter(r => r.status === 'completed').length}</div>
            <div className="text-sm text-gray-600">Completed</div>
          </div>
        </div>

        {/* Request Timeline */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-100">
            <h3 className="text-lg font-semibold text-gray-900">Request Timeline</h3>
            <p className="text-sm text-gray-500 mt-0.5">Track your document requests</p>
          </div>
          
          <div className="p-6">
            {filteredRequests.length === 0 ? (
              <div className="text-center py-8">
                <i className="bi bi-inbox text-3xl text-gray-300 mb-3 block"></i>
                <p className="text-gray-500 text-sm">No requests found</p>
              </div>
            ) : (
              <div className="relative">
                {/* Vertical Timeline Line */}
                <div className="absolute left-4 top-2 bottom-0 w-px bg-gray-200"></div>
                
                <div className="space-y-4">
                  {filteredRequests.map((request, index) => (
                    <div
                      key={request.id}
                      className="relative flex gap-3 group cursor-pointer"
                      onClick={() => openRequestDetails(request)}
                    >
                      {/* Timeline Icon */}
                      <div className="relative z-10 flex-shrink-0">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 border-white shadow-sm ${
                          request.status === 'completed' ? 'bg-gray-100' :
                          request.status === 'ready' ? 'bg-green-500' :
                          request.status === 'processing' ? 'bg-blue-500' :
                          request.status === 'pending' ? 'bg-yellow-500' :
                          'bg-red-500'
                        }`}>
                          <i className={`text-xs ${
                            request.status === 'completed' ? 'bi bi-check text-gray-600' :
                            request.status === 'ready' ? 'bi bi-check text-white' :
                            request.status === 'processing' ? 'bi bi-clock text-white' :
                            request.status === 'pending' ? 'bi bi-clock text-white' :
                            'bi bi-x text-white'
                          }`}></i>
                        </div>
                      </div>
                      
                      {/* Content Card */}
                      <div className="flex-1 min-w-0 pb-4">
                        <div className="bg-gray-50/50 rounded-lg p-3 border border-gray-100 group-hover:bg-white group-hover:border-gray-200 group-hover:shadow-sm transition-all duration-200">
                          <div className="flex items-center justify-between gap-3">
                            <div className="flex-1 min-w-0">
                              {/* Header */}
                              <div className="flex items-center gap-2 mb-1">
                                <h4 className="font-medium text-gray-900 text-sm truncate">{request.document}</h4>
                                <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium ${
                                  request.status === 'completed' ? 'bg-gray-100 text-gray-700' :
                                  request.status === 'ready' ? 'bg-green-100 text-green-700' :
                                  request.status === 'processing' ? 'bg-blue-100 text-blue-700' :
                                  request.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                                  'bg-red-100 text-red-700'
                                }`}>
                                  {request.status === 'completed' ? 'Completed' :
                                   request.status === 'ready' ? 'Ready' :
                                   request.status === 'processing' ? 'Processing' :
                                   request.status === 'pending' ? 'Pending' :
                                   'Rejected'}
                                </span>
                              </div>
                              
                              {/* Compact Details */}
                              <div className="space-y-0.5">
                                <p className="text-xs text-gray-600">
                                  {request.id} • {request.purpose}
                                </p>
                                <p className="text-xs text-gray-500 truncate">{request.notes}</p>
                              </div>
                              
                              {/* Meta Info */}
                              <div className="flex items-center gap-3 mt-2 text-xs text-gray-400">
                                <span>{new Date(request.requestDate).toLocaleDateString()}</span>
                                <span>₱{request.fee}</span>
                                {request.status === 'processing' && (
                                  <span className="text-blue-600 flex items-center gap-1">
                                    <i className="bi bi-clock animate-pulse"></i>
                                    Processing
                                  </span>
                                )}
                                {request.status === 'ready' && (
                                  <span className="text-green-600 flex items-center gap-1">
                                    <i className="bi bi-check-circle"></i>
                                    Ready
                                  </span>
                                )}
                              </div>
                            </div>
                            
                            {/* Arrow */}
                            <div className="flex-shrink-0">
                              <i className="bi bi-chevron-right text-gray-300 group-hover:text-gray-400 transition-colors text-sm"></i>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Request Details Modal */}
      {showRequestDetails && selectedRequest && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Request Details</h3>
                <button
                  onClick={() => setShowRequestDetails(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <i className="bi bi-x text-xl"></i>
                </button>
              </div>

              <div className="space-y-4">
                {/* Request Info */}
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <h4 className="font-medium text-gray-900">{selectedRequest.document}</h4>
                    {getStatusBadge(selectedRequest.status)}
                  </div>
                  <p className="text-sm text-gray-600">Request ID: {selectedRequest.id}</p>
                </div>

                {/* Details */}
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Purpose</label>
                    <p className="text-sm text-gray-900">{selectedRequest.purpose}</p>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Notes</label>
                    <p className="text-sm text-gray-900">{selectedRequest.notes}</p>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Processing Fee (Payable on Pickup)</label>
                    <p className="text-sm text-gray-900">₱{selectedRequest.fee}</p>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Request Date</label>
                    <p className="text-sm text-gray-900">{new Date(selectedRequest.requestDate).toLocaleDateString()}</p>
                  </div>
                  
                  {selectedRequest.completedDate && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Completed Date</label>
                      <p className="text-sm text-gray-900">{new Date(selectedRequest.completedDate).toLocaleDateString()}</p>
                    </div>
                  )}

                  {selectedRequest.status === 'rejected' && selectedRequest.rejectionReason && (
                    <div>
                      <label className="block text-sm font-medium text-red-700">Rejection Reason</label>
                      <p className="text-sm text-red-900">{selectedRequest.rejectionReason}</p>
                    </div>
                  )}
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3 pt-4">
                  {selectedRequest.status === 'ready' && (
                    <button className="flex-1 bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 text-sm font-medium">
                      Schedule Pickup & Payment
                    </button>
                  )}
                  {selectedRequest.status === 'rejected' && (
                    <button className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 text-sm font-medium">
                      Resubmit Request
                    </button>
                  )}
                  <button
                    onClick={() => setShowRequestDetails(false)}
                    className="flex-1 border border-gray-300 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-50 text-sm font-medium"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}