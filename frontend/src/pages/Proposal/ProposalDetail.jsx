import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Download, FileText, AlertCircle } from 'lucide-react'
import { proposalAPI } from '../../api'
import Loading from '../../components/Loading'
import Alert from '../../components/Alert'
import Button from '../../components/Button'

export default function ProposalDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [proposal, setProposal] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    fetchProposal()
  }, [id])

  const fetchProposal = async () => {
    try {
      setLoading(true)
      const res = await proposalAPI.getById(id)
      setProposal(res.data.proposal || res.data)
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load proposal')
    } finally {
      setLoading(false)
    }
  }

  if (loading) return <Loading message="Loading proposal..." />
  if (!proposal) return <Alert type="error" message="Proposal not found" />

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold">{proposal.vendor?.name || 'Proposal'}</h1>
          <p className="text-gray-600 mt-2">
            Received: {new Date(proposal.received_at).toLocaleString()}
          </p>
        </div>
        <Button variant="secondary" onClick={() => navigate(-1)}>Back</Button>
      </div>

      {/* Alerts */}
      {error && <Alert type="error" message={error} onClose={() => setError(null)} />}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Score Card */}
          {proposal.score && (
            <div className="bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg shadow-md p-8 text-white">
              <p className="text-sm opacity-90 mb-2">AI Evaluation Score</p>
              <h2 className="text-5xl font-bold mb-4">{proposal.score}/100</h2>
              {proposal.recommendation_reason && (
                <p className="text-lg">{proposal.recommendation_reason}</p>
              )}
            </div>
          )}

          {/* Parsed Content */}
          {proposal.parsed && (
            <div className="bg-white rounded-lg shadow-md p-8 space-y-6">
              <h3 className="text-2xl font-bold">Proposal Details</h3>

              {/* Summary */}
              {proposal.parsed.summary && (
                <div>
                  <h4 className="font-semibold text-gray-900 mb-2">Executive Summary</h4>
                  <p className="text-gray-700">{proposal.parsed.summary}</p>
                </div>
              )}

              {/* Key Offerings */}
              {proposal.parsed.offerings && proposal.parsed.offerings.length > 0 && (
                <div>
                  <h4 className="font-semibold text-gray-900 mb-3">Key Offerings</h4>
                  <ul className="space-y-2">
                    {proposal.parsed.offerings.map((offering, i) => (
                      <li key={i} className="flex items-start">
                        <span className="text-primary mr-3">✓</span>
                        <span className="text-gray-700">{offering}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Pricing */}
              {proposal.parsed.pricing && (
                <div>
                  <h4 className="font-semibold text-gray-900 mb-2">Pricing</h4>
                  <p className="text-gray-700">{proposal.parsed.pricing}</p>
                </div>
              )}

              {/* Timeline */}
              {proposal.parsed.timeline && (
                <div>
                  <h4 className="font-semibold text-gray-900 mb-2">Timeline</h4>
                  <p className="text-gray-700">{proposal.parsed.timeline}</p>
                </div>
              )}

              {/* Contact Info */}
              {proposal.parsed.contact && (
                <div>
                  <h4 className="font-semibold text-gray-900 mb-2">Contact Information</h4>
                  <p className="text-gray-700">{proposal.parsed.contact}</p>
                </div>
              )}
            </div>
          )}

          {/* Raw Email */}
          <div className="bg-white rounded-lg shadow-md p-8">
            <h3 className="text-xl font-bold mb-4 flex items-center">
              <FileText className="mr-2" size={20} />
              Raw Email
            </h3>
            <div className="bg-gray-50 p-4 rounded border border-gray-200 max-h-64 overflow-y-auto font-mono text-sm text-gray-700 whitespace-pre-wrap break-words">
              {proposal.raw_email}
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Vendor Info */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h4 className="font-semibold text-gray-900 mb-4">Vendor Information</h4>
            <div className="space-y-3">
              <div>
                <p className="text-sm text-gray-600">Name</p>
                <p className="font-medium text-gray-900">{proposal.vendor?.name}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Email</p>
                <p className="font-medium text-gray-900 break-all">{proposal.vendor?.contact_email}</p>
              </div>
              {proposal.vendor?.phone && (
                <div>
                  <p className="text-sm text-gray-600">Phone</p>
                  <p className="font-medium text-gray-900">{proposal.vendor.phone}</p>
                </div>
              )}
            </div>
          </div>

          {/* RFP Info */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h4 className="font-semibold text-gray-900 mb-4">RFP Details</h4>
            <div className="space-y-3">
              <div>
                <p className="text-sm text-gray-600">Title</p>
                <p className="font-medium text-gray-900">{proposal.rfp?.title}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Status</p>
                <span className={`inline-block px-2 py-1 rounded text-xs font-medium ${
                  proposal.rfp?.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                }`}>
                  {proposal.rfp?.status || 'unknown'}
                </span>
              </div>
            </div>
          </div>

          {/* Attachments */}
          {proposal.attachments && proposal.attachments.length > 0 && (
            <div className="bg-white rounded-lg shadow-md p-6">
              <h4 className="font-semibold text-gray-900 mb-4">Attachments</h4>
              <div className="space-y-2">
                {proposal.attachments.map((att, i) => (
                  <a 
                    key={i}
                    href={att.s3_url}
                    className="flex items-center p-2 border rounded hover:bg-gray-50 transition"
                  >
                    <Download size={16} className="mr-2 text-primary" />
                    <span className="text-sm truncate">{att.filename}</span>
                  </a>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
