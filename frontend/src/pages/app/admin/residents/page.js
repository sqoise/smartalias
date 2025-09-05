"use client"

import { useEffect, useState } from 'react'
import { residents } from '../../../lib/frontend-auth'

export default function ResidentsPage() {
  const [residentsData, setResidentsData] = useState([])
  const [loading, setLoading] = useState(true)
  const [showAdd, setShowAdd] = useState(false)
  const [name, setName] = useState('')

  useEffect(() => {
    // Load residents data from frontend utility
    try {
      const data = residents.getAll()
      setResidentsData(data || [])
    } catch (e) {
      console.error('Error loading residents:', e)
    } finally {
      setLoading(false)
    }
  }, [])

  async function handleAdd(e) {
    e.preventDefault()
    try {
      // For demo purposes, add resident to local state
      const newResident = {
        id: Date.now(),
        name: name.trim(),
        address: 'New Address',
        status: 'Active'
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
        <h2 className="text-xl font-semibold">Residents</h2>
        <div>
          <button onClick={() => setShowAdd(true)} className="px-3 py-2 bg-green-600 text-white rounded hover:bg-green-700 cursor-pointer">Add Resident</button>
        </div>
      </div>

      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        {loading ? (
          <p className="text-gray-500">Loading...</p>
        ) : residentsData.length === 0 ? (
          <p className="text-gray-500">No residents found.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-100">
                {residentsData.map((r, idx) => (
                  <tr key={idx} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{r.name || 'Unnamed'}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{r.id || 'N/A'}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button className="text-blue-600 hover:underline mr-4 cursor-pointer">View</button>
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
                <button type="button" onClick={() => setShowAdd(false)} className="px-4 py-2 border rounded">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-green-600 text-white rounded">Add</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
