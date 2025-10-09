'use client'

import { useState } from 'react'

export default function ResidentDashboard() {
  const [showRequestModal, setShowRequestModal] = useState(false)
  const [selectedDocument, setSelectedDocument] = useState('')
  const [selectedImage, setSelectedImage] = useState('')

  const closeModal = () => {
    setShowRequestModal(false)
    setSelectedImage('')
  }

  return (
    <>
      {/* Demo: Dashboard Content - No sidebar/header since layout.js provides them */}
      <div className="space-y-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Online Application</h1>
            <p className="text-sm text-gray-600 mt-1">Easily submit and process barangay requests anytime, anywhere.</p>
          </div>
        {/* Document Requests Section */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="p-4">
            {/* Grid Layout for Documents */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {/* Electrical Permit */}
            <div 
              onClick={() => {
                setSelectedDocument('Electrical Permit')
                setShowRequestModal(true)
              }}
              className="group bg-white border border-gray-200 rounded-lg p-4 hover:border-gray-400 hover:shadow-md transition-all duration-300 cursor-pointer transform hover:-translate-y-1"
            >
              <div className="flex flex-col items-center text-center">
                <div className="w-12 h-12 bg-amber-500 rounded-full flex items-center justify-center mb-3 group-hover:scale-110 transition-transform duration-300 shadow-md">
                  <i className="bi bi-lightning-charge text-lg text-white"></i>
                </div>
                <h4 className="font-medium text-gray-900 mb-1 text-sm">Electrical Permit</h4>
                <p className="text-xs text-gray-600 leading-relaxed">Apply for electrical permits</p>
              </div>
            </div>

            {/* Fence Permit */}
            <div 
              onClick={() => {
                setSelectedDocument('Fence Permit')
                setShowRequestModal(true)
              }}
              className="group bg-white border border-gray-200 rounded-lg p-4 hover:border-gray-400 hover:shadow-md transition-all duration-300 cursor-pointer transform hover:-translate-y-1"
            >
              <div className="flex flex-col items-center text-center">
                <div className="w-12 h-12 bg-stone-600 rounded-full flex items-center justify-center mb-3 group-hover:scale-110 transition-transform duration-300 shadow-md">
                  <i className="bi bi-bricks text-lg text-white"></i>
                </div>
                <h4 className="font-medium text-gray-900 mb-1 text-sm">Fence Permit</h4>
                <p className="text-xs text-gray-600 leading-relaxed">Request permits to build fences</p>
              </div>
            </div>

            {/* Excavation Permit */}
            <div 
              onClick={() => {
                setSelectedDocument('Excavation Permit')
                setShowRequestModal(true)
              }}
              className="group bg-white border border-gray-200 rounded-lg p-4 hover:border-gray-400 hover:shadow-md transition-all duration-300 cursor-pointer transform hover:-translate-y-1"
            >
              <div className="flex flex-col items-center text-center">
                <div className="w-12 h-12 bg-orange-600 rounded-full flex items-center justify-center mb-3 group-hover:scale-110 transition-transform duration-300 shadow-md">
                  <i className="bi bi-tools text-lg text-white"></i>
                </div>
                <h4 className="font-medium text-gray-900 mb-1 text-sm">Excavation Permit</h4>
                <p className="text-xs text-gray-600 leading-relaxed">Get approval for excavation</p>
              </div>
            </div>

            {/* Barangay Clearance */}
            <div 
              onClick={() => {
                setSelectedDocument('Barangay Clearance')
                setShowRequestModal(true)
              }}
              className="group bg-white border border-gray-200 rounded-lg p-4 hover:border-gray-400 hover:shadow-md transition-all duration-300 cursor-pointer transform hover:-translate-y-1"
            >
              <div className="flex flex-col items-center text-center">
                <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center mb-3 group-hover:scale-110 transition-transform duration-300 shadow-md">
                  <i className="bi bi-shield-check text-lg text-white"></i>
                </div>
                <h4 className="font-medium text-gray-900 mb-1 text-sm">Barangay Clearance</h4>
                <p className="text-xs text-gray-600 leading-relaxed">Certificate of residency</p>
              </div>
            </div>

            {/* Certificate of Residency */}
            <div 
              onClick={() => {
                setSelectedDocument('Certificate of Residency')
                setShowRequestModal(true)
              }}
              className="group bg-white border border-gray-200 rounded-lg p-4 hover:border-gray-400 hover:shadow-md transition-all duration-300 cursor-pointer transform hover:-translate-y-1"
            >
              <div className="flex flex-col items-center text-center">
                <div className="w-12 h-12 bg-emerald-600 rounded-full flex items-center justify-center mb-3 group-hover:scale-110 transition-transform duration-300 shadow-md">
                  <i className="bi bi-house-heart text-lg text-white"></i>
                </div>
                <h4 className="font-medium text-gray-900 mb-1 text-sm">Certificate of Residency</h4>
                <p className="text-xs text-gray-600 leading-relaxed">Proof of residency</p>
              </div>
            </div>

            {/* Good Moral */}
            <div 
              onClick={() => {
                setSelectedDocument('Good Moral')
                setShowRequestModal(true)
              }}
              className="group bg-white border border-gray-200 rounded-lg p-4 hover:border-gray-400 hover:shadow-md transition-all duration-300 cursor-pointer transform hover:-translate-y-1"
            >
              <div className="flex flex-col items-center text-center">
                <div className="w-12 h-12 bg-violet-600 rounded-full flex items-center justify-center mb-3 group-hover:scale-110 transition-transform duration-300 shadow-md">
                  <i className="bi bi-award text-lg text-white"></i>
                </div>
                <h4 className="font-medium text-gray-900 mb-1 text-sm">Good Moral</h4>
                <p className="text-xs text-gray-600 leading-relaxed">Certificate of good moral</p>
              </div>
            </div>

            {/* Indigency - For Medical */}
            <div 
              onClick={() => {
                setSelectedDocument('Indigency - For Medical')
                setShowRequestModal(true)
              }}
              className="group bg-white border border-gray-200 rounded-lg p-4 hover:border-gray-400 hover:shadow-md transition-all duration-300 cursor-pointer transform hover:-translate-y-1"
            >
              <div className="flex flex-col items-center text-center">
                <div className="w-12 h-12 bg-rose-600 rounded-full flex items-center justify-center mb-3 group-hover:scale-110 transition-transform duration-300 shadow-md">
                  <i className="bi bi-heart-pulse text-lg text-white"></i>
                </div>
                <h4 className="font-medium text-gray-900 mb-1 text-sm">Indigency - Medical</h4>
                <p className="text-xs text-gray-600 leading-relaxed">Medical assistance</p>
              </div>
            </div>

            {/* Indigency - For Financial */}
            <div 
              onClick={() => {
                setSelectedDocument('Indigency - For Financial')
                setShowRequestModal(true)
              }}
              className="group bg-white border border-gray-200 rounded-lg p-4 hover:border-gray-400 hover:shadow-md transition-all duration-300 cursor-pointer transform hover:-translate-y-1"
            >
              <div className="flex flex-col items-center text-center">
                <div className="w-12 h-12 bg-teal-600 rounded-full flex items-center justify-center mb-3 group-hover:scale-110 transition-transform duration-300 shadow-md">
                  <i className="bi bi-cash-coin text-lg text-white"></i>
                </div>
                <h4 className="font-medium text-gray-900 mb-1 text-sm">Indigency - Financial</h4>
                <p className="text-xs text-gray-600 leading-relaxed">Financial assistance</p>
              </div>
            </div>

            {/* Business Permit */}
            <div 
              onClick={() => {
                setSelectedDocument('Business Permit')
                setShowRequestModal(true)
              }}
              className="group bg-white border border-gray-200 rounded-lg p-4 hover:border-gray-400 hover:shadow-md transition-all duration-300 cursor-pointer transform hover:-translate-y-1"
            >
              <div className="flex flex-col items-center text-center">
                <div className="w-12 h-12 bg-slate-600 rounded-full flex items-center justify-center mb-3 group-hover:scale-110 transition-transform duration-300 shadow-md">
                  <i className="bi bi-briefcase text-lg text-white"></i>
                </div>
                <h4 className="font-medium text-gray-900 mb-1 text-sm">Business Permit</h4>
                <p className="text-xs text-gray-600 leading-relaxed">Small business operations</p>
              </div>
            </div>
          </div>
          </div>
        </div>
      </div>

      {/* Document Request Modal */}
      {showRequestModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-md p-4 w-full max-w-lg">
            {/* Header */}
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-medium text-gray-900">{selectedDocument}</h3>
              <button 
                onClick={closeModal}
                className="text-gray-400 hover:text-gray-600"
              >
                <i className="bi bi-x text-lg"></i>
              </button>
            </div>

            {/* Form Body */}
            <form className="space-y-2">
              {selectedDocument === 'Barangay Clearance' ? (
                // Barangay Clearance specific fields
                <>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-0.5">Name</label>
                      <input 
                        type="text"
                        className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-green-500 focus:border-green-500 outline-none h-6" 
                        style={{fontSize: '11px'}}
                        placeholder="Full name"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-0.5">Address</label>
                      <input 
                        type="text"
                        className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-green-500 focus:border-green-500 outline-none h-6" 
                        style={{fontSize: '11px'}}
                        placeholder="Complete address"
                      />
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-0.5">Age</label>
                      <input 
                        type="number"
                        className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-green-500 focus:border-green-500 outline-none h-6" 
                        style={{fontSize: '11px'}}
                        placeholder="Age"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-0.5">Status</label>
                      <select className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-green-500 focus:border-green-500 outline-none h-6" style={{fontSize: '11px'}}>
                        <option>Select status</option>
                        <option>Single</option>
                        <option>Married</option>
                        <option>Widowed</option>
                        <option>Separated</option>
                      </select>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-0.5">Citizenship</label>
                      <input 
                        type="text"
                        className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-green-500 focus:border-green-500 outline-none h-6" 
                        style={{fontSize: '11px'}}
                        placeholder="Citizenship"
                        defaultValue="Filipino"
                      />
                    </div>
                    <div className="col-span-2">
                      <label className="block text-xs font-medium text-gray-600 mb-1">Upload Image</label>
                      
                      {/* Upload Interface */}
                      <div className="border-2 border-dashed border-gray-300 rounded p-3 text-center hover:border-green-400 transition-colors">
                        <input 
                          type="file"
                          accept="image/*"
                          id="imageUpload"
                          className="hidden"
                          onChange={(e) => {
                            const file = e.target.files[0]
                            if (file) {
                              setSelectedImage(file.name)
                            }
                          }}
                        />
                        <label htmlFor="imageUpload" className="cursor-pointer">
                          {selectedImage ? (
                            <div className="flex items-center justify-center gap-1 text-green-600">
                              <i className="bi bi-check-circle"></i>
                              <span className="text-xs">{selectedImage}</span>
                            </div>
                          ) : (
                            <div className="text-gray-500">
                              <i className="bi bi-cloud-upload text-lg mb-1 block"></i>
                              <span className="text-xs">Click to upload or drag & drop</span>
                              <div className="text-xs text-gray-400 mt-1">PNG, JPG up to 5MB</div>
                            </div>
                          )}
                        </label>
                      </div>
                    </div>
                  </div>
                </>
              ) : selectedDocument === 'Business Permit' ? (
                // Business Permit specific fields
                <>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-0.5">Name of Business</label>
                      <input 
                        type="text"
                        className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-green-500 focus:border-green-500 outline-none h-6" 
                        style={{fontSize: '11px'}}
                        placeholder="Business name"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-0.5">Name of Applicant</label>
                      <input 
                        type="text"
                        className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-green-500 focus:border-green-500 outline-none h-6" 
                        style={{fontSize: '11px'}}
                        placeholder="Applicant full name"
                      />
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-0.5">Address</label>
                      <input 
                        type="text"
                        className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-green-500 focus:border-green-500 outline-none h-6" 
                        style={{fontSize: '11px'}}
                        placeholder="Applicant address"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-0.5">Business Address/Location</label>
                      <input 
                        type="text"
                        className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-green-500 focus:border-green-500 outline-none h-6" 
                        style={{fontSize: '11px'}}
                        placeholder="Business location"
                      />
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-0.5">Tel#</label>
                      <input 
                        type="tel"
                        className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-green-500 focus:border-green-500 outline-none h-6" 
                        style={{fontSize: '11px'}}
                        placeholder="Contact number"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-0.5">Capital Investment as Date of Filing</label>
                      <input 
                        type="number"
                        className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-green-500 focus:border-green-500 outline-none h-6" 
                        style={{fontSize: '11px'}}
                        placeholder="Amount"
                      />
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-0.5">Gross Sale/Receipt for the Preceding Year</label>
                    <input 
                      type="number"
                      className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-green-500 focus:border-green-500 outline-none h-6" 
                      style={{fontSize: '11px'}}
                      placeholder="Total sales/receipts"
                    />
                  </div>
                </>
              ) : (
                // Default fields for other documents
                <>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-0.5">Purpose</label>
                    <select className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-green-500 focus:border-green-500 outline-none h-6" style={{fontSize: '11px'}}>
                      <option>Select purpose</option>
                      <option>Employment</option>
                      <option>Business Registration</option>
                      <option>School Enrollment</option>
                      <option>Medical Assistance</option>
                      <option>Others</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-0.5">Notes (optional)</label>
                    <textarea 
                      rows="2" 
                      className="w-full px-2 py-1 text-xs border border-gray-300 rounded resize-none focus:ring-1 focus:ring-green-500 focus:border-green-500 outline-none"
                      style={{fontSize: '11px'}}
                      placeholder="Additional information..."
                    ></textarea>
                  </div>
                </>
              )}
              
              {/* Info */}
              <div className="bg-blue-50 border border-blue-200 rounded p-1.5">
                <div className="flex items-start gap-1">
                  <i className="bi bi-info-circle text-blue-600 mt-0.5 text-xs"></i>
                  <div className="text-xs text-blue-700">
                    <p className="font-medium mb-1">Processing Information:</p>
                    <p>• Processing time: 2-3 business days</p>
                    <p>• Payment is made when you pickup the document at the barangay</p>
                    <p>• You will be notified when ready for collection</p>
                  </div>
                </div>
              </div>
              
              {/* Buttons */}
              <div className="flex gap-2 pt-2">
                <button 
                  type="button"
                  onClick={closeModal}
                  className="flex-1 px-3 py-1.5 text-xs font-medium text-gray-500 bg-gray-100 border border-gray-300 rounded hover:bg-gray-200"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="flex-1 px-3 py-1.5 text-xs font-medium bg-green-600 text-white rounded hover:bg-green-700"
                >
                  Submit Application
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}
