import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { Send, FileText, Users, RefreshCw } from 'lucide-react'
import { rfpAPI, vendorAPI, proposalAPI } from '../../api'
import Loading from '../../components/Loading'
import Alert from '../../components/Alert'
import Button from '../../components/Button'

export default function RFPDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [rfp, setRfp] = useState(null)
  const [vendors, setVendors] = useState([])
  const [selectedVendors, setSelectedVendors] = useState([])
  const [proposals, setProposals] = useState([])
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [error, setError] = useState(null)
  const [activeTab, setActiveTab] = useState('overview')
  const [refreshing, setRefreshing] = useState(false)

  useEffect(() => {
    fetchData()
  }, [id])

  const fetchData = async () => {
    try {
      setLoading(true)
      const [rfpRes, vendorRes, proposalRes] = await Promise.all([
        rfpAPI.getById(id),
        vendorAPI.getAll(1, 100),
        proposalAPI.getByRfp(id),
      ])
      
      // RFP data
      setRfp(rfpRes.data.rfp || rfpRes.data)
      
      // Vendor data - API returns { success: true, data: [...vendors] }
      const vendorsArray = Array.isArray(vendorRes.data) ? vendorRes.data : (vendorRes.data.vendors || [])
      setVendors(vendorsArray)
      
      // Proposal data
      setProposals(proposalRes.data.proposals || proposalRes.data || [])
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load RFP details')
    } finally {
      setLoading(false)
    }
  }

  const handleRefreshVendors = async () => {
    try {
      setRefreshing(true)
      const vendorRes = await vendorAPI.getAll(1, 100)
      const vendorsArray = Array.isArray(vendorRes.data) ? vendorRes.data : (vendorRes.data.vendors || [])
      setVendors(vendorsArray)
    } catch (err) {
      setError('Failed to refresh vendors')
    } finally {
      setRefreshing(false)
    }
  }

  const handleSendRfp = async () => {
    if (selectedVendors.length === 0) {
      setError('Please select at least one vendor')
      return
    }

    try {
      setSending(true)
      await rfpAPI.send(id, selectedVendors)
      setError(null)
      setSelectedVendors([])
      fetchData()
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to send RFP')
    } finally {
      setSending(false)
    }
  }

  const toggleVendor = (vendorId) => {
    setSelectedVendors(prev =>
      prev.includes(vendorId)
        ? prev.filter(v => v !== vendorId)
        : [...prev, vendorId]
    )
  }

  if (loading) return <Loading message="Loading RFP details..." />
  if (!rfp) return <Alert type="error" message="RFP not found" />

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold">{rfp.title}</h1>
          <p className="text-gray-600 mt-2">{rfp.description}</p>
        </div>
        <Link to="/rfps">
          <Button variant="secondary">Back</Button>
        </Link>
      </div>

      {/* Alerts */}
      {error && <Alert type="error" message={error} onClose={() => setError(null)} />}

      {/* Tabs */}
      <div className="bg-white rounded-lg shadow-md">
        <div className="border-b flex">
          {['overview', 'vendors', 'proposals'].map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-6 py-4 font-medium transition ${
                activeTab === tab
                  ? 'text-primary border-b-2 border-primary'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>

        <div className="p-6">
          {/* Overview Tab */}
          {activeTab === 'overview' && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600">Status</p>
                  <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium mt-1 ${
                    rfp.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                  }`}>
                    {rfp.status || 'draft'}
                  </span>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Created</p>
                  <p className="font-medium mt-1">{new Date(rfp.created_at).toLocaleDateString()}</p>
                </div>
              </div>
              <div>
                <p className="text-sm text-gray-600">Full Description</p>
                <p className="mt-2 text-gray-900">{rfp.description || 'No description'}</p>
              </div>
            </div>
          )}

          {/* Vendors Tab */}
          {activeTab === 'vendors' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold mb-4">Send RFP to Vendors</h3>
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {vendors.length === 0 ? (
                    <p className="text-gray-600">
                      No vendors available. <Link to="/vendors/create" className="text-primary hover:underline">Create one</Link>
                    </p>
                  ) : (
                    vendors.map(vendor => (
                      <label key={vendor.id} className="flex items-center p-3 border rounded-lg hover:bg-gray-50">
                        <input
                          type="checkbox"
                          checked={selectedVendors.includes(vendor.id)}
                          onChange={() => toggleVendor(vendor.id)}
                          className="w-4 h-4 text-primary rounded"
                        />
                        <span className="ml-3">
                          <span className="font-medium">{vendor.name}</span>
                          <br />
                          <span className="text-sm text-gray-600">{vendor.contact_email}</span>
                        </span>
                      </label>
                    ))
                  )}
                </div>
                {selectedVendors.length > 0 && (
                  <Button 
                    onClick={handleSendRfp}
                    loading={sending}
                    className="mt-4"
                  >
                    <Send size={18} className="mr-2 inline" />
                    Send to {selectedVendors.length} vendor{selectedVendors.length !== 1 ? 's' : ''}
                  </Button>
                )}
              </div>
            </div>
          )}

          {/* Proposals Tab */}
          {activeTab === 'proposals' && (
            <div className="space-y-4">
              {proposals.length === 0 ? (
                <p className="text-gray-600">No proposals received yet</p>
              ) : (
                <div className="space-y-4">
                  {proposals.map(proposal => (
                    <div key={proposal.id} className="border rounded-lg p-4 hover:bg-gray-50">
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="font-semibold">{proposal.vendor?.name || 'Unknown Vendor'}</h4>
                          <p className="text-sm text-gray-600 mt-1">
                            Received: {new Date(proposal.received_at).toLocaleDateString()}
                          </p>
                          {proposal.score && (
                            <div className="mt-2">
                              <div className="flex items-center space-x-2">
                                <div className="w-32 bg-gray-200 rounded-full h-2">
                                  <div 
                                    className="bg-primary h-2 rounded-full" 
                                    style={{ width: `${(proposal.score / 100) * 100}%` }}
                                  />
                                </div>
                                <span className="font-semibold text-primary">{proposal.score}/100</span>
                              </div>
                            </div>
                          )}
                        </div>
                        <Link to={`/proposals/${proposal.id}`}>
                          <Button size="sm" variant="outline">View</Button>
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
