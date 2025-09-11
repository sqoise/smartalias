"use client"

import { useEffect, useState } from 'react'
import ApiClient from '../../../lib/apiClient'

export default function ResidentsPage() {
  const [residentsData, setResidentsData] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [showAdd, setShowAdd] = useState(false)
  const [name, setName] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')

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

  const handleSearch = async () => {
    try {
      setLoading(true)
      setError(null)
      const response = await ApiClient.searchResidents(searchQuery, statusFilter)
      
      if (response.success) {
        setResidentsData(response.data || [])
      } else {
        setError(response.error || 'Search failed')
      }
    } catch (err) {
      console.error('Error searching residents:', err)
      setError('Search failed')
    } finally {
      setLoading(false)
    }
  }

  const resetSearch = () => {
    setSearchQuery('')
    setStatusFilter('all')
    loadResidents()
  }

  async function handleAdd(e) {
    e.preventDefault()
    try {
      // Demo: Add resident to local state only (no backend persistence yet)
      const newResident = {
        id: Date.now(),
        name: name.trim(),
        address: 'New Address - Please update',
        status: 'Active',
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
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Residents Management</h2>
        <div>
          <button onClick={() => setShowAdd(true)} className="px-3 py-2 bg-green-600 text-white rounded hover:bg-green-700 cursor-pointer">Add Resident</button>
        </div>
      </div>

      {/* Search and Filter Section */}
      <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <input
              type="text"
              placeholder="Search by name, address, email, or phone..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-md"
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
            />
          </div>
          <div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="p-2 border border-gray-300 rounded-md"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleSearch}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 cursor-pointer"
            >
              Search
            </button>
            <button
              onClick={resetSearch}
              className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600 cursor-pointer"
            >
              Reset
            </button>
          </div>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      {/* Results Table */}
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        {loading ? (
          <div className="text-center py-8">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <p className="text-gray-500 mt-2">Loading residents...</p>
          </div>
        ) : residentsData.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-500">No residents found.</p>
            {(searchQuery || statusFilter !== 'all') && (
              <button
                onClick={resetSearch}
                className="mt-2 text-blue-600 hover:underline cursor-pointer"
              >
                Clear search and show all residents
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <div className="mb-4 text-sm text-gray-600">
              Found {residentsData.length} resident{residentsData.length !== 1 ? 's' : ''}
            </div>
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Address</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Contact</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-100">
                {residentsData.map((resident) => (
                  <tr key={resident.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">{resident.name}</div>
                        <div className="text-sm text-gray-500">ID: {resident.id}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900 max-w-xs truncate" title={resident.address}>
                        {resident.address}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{resident.phone}</div>
                      <div className="text-sm text-gray-500">{resident.email}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        resident.status === 'Active' 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {resident.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button className="text-blue-600 hover:underline mr-4 cursor-pointer">View</button>
                      <button className="text-amber-600 hover:underline mr-4 cursor-pointer">Edit</button>
                      <button className="text-red-600 hover:underline cursor-pointer">Delete</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showAdd && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Add Resident</h3>
              <button onClick={() => setShowAdd(false)} className="text-gray-400 hover:text-gray-600 cursor-pointer">
                ✕
              </button>
            </div>
            <form onSubmit={handleAdd} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                <input value={name} onChange={e => setName(e.target.value)} className="w-full p-2 border border-gray-300 rounded-md" />
              </div>
              <div className="flex justify-end gap-2">
                <button type="button" onClick={() => setShowAdd(false)} className="px-4 py-2 border rounded cursor-pointer">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-green-600 text-white rounded cursor-pointer">Add</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
