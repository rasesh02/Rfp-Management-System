import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { Download, RefreshCw } from 'lucide-react'
import { proposalAPI, rfpAPI } from '../../api'
import Loading from '../../components/Loading'
import Alert from '../../components/Alert'
import Button from '../../components/Button'

export default function ProposalList() {
  const { rfpId } = useParams()
  const [proposals, setProposals] = useState([])
  const [rfp, setRfp] = useState(null)
  const [loading, setLoading] = useState(true)
  const [rescoring, setRescoring] = useState(null)
  const [error, setError] = useState(null)

  useEffect(() => {
    fetchData()
  }, [rfpId])

  const fetchData = async () => {
    try {
      setLoading(true)
      const [proposalRes, rfpRes] = await Promise.all([
        proposalAPI.getParsed(rfpId),
        rfpAPI.getById(rfpId),
      ])
      setProposals(proposalRes.data.proposals || [])
      setRfp(rfpRes.data.rfp || rfpRes.data)
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load proposals')
    } finally {
      setLoading(false)
    }
  }

  const handleRescore = async (proposalId) => {
    try {
      setRescoring(proposalId)
      await proposalAPI.rescore(proposalId)
      fetchData()
    } catch (err) {
      setError('Failed to rescore proposal')
    } finally {
      setRescoring(null)
    }
  }

  if (loading) return <Loading message="Loading proposals..." />

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold">Proposals</h1>
          {rfp && <p className="text-gray-600 mt-2">{rfp.title}</p>}
        </div>
        <Link to={`/rfps/${rfpId}`}>
          <Button variant="secondary">Back</Button>
        </Link>
      </div>

      {/* Alerts */}
      {error && <Alert type="error" message={error} onClose={() => setError(null)} />}

      {/* Proposals */}
      <div className="space-y-4">
        {proposals.length === 0 ? (
          <div className="bg-white rounded-lg shadow-md p-8 text-center text-gray-600">
            <p>No proposals received yet</p>
          </div>
        ) : (
          proposals.map(proposal => (
            <div key={proposal.id} className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-xl font-semibold">{proposal.vendor?.name || 'Unknown'}</h3>
                  <p className="text-sm text-gray-600">
                    Received: {new Date(proposal.received_at).toLocaleString()}
                  </p>
                </div>
                <Link to={`/proposals/${proposal.id}`}>
                  <Button size="sm">View Full Proposal</Button>
                </Link>
              </div>

              {/* Score */}
              {proposal.score && (
                <div className="mb-4 p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">AI Score</p>
                      <p className="text-3xl font-bold text-primary">{proposal.score}</p>
                    </div>
                    <div className="w-24 h-24 rounded-full bg-white flex items-center justify-center border-4 border-primary">
                      <span className="text-2xl font-bold text-primary">{proposal.score}%</span>
                    </div>
                  </div>
                  
                  {/* Recommendation */}
                  {proposal.recommendation_reason && (
                    <div className="mt-4 p-3 bg-white rounded border-l-4 border-primary">
                      <p className="text-sm font-medium text-gray-700">{proposal.recommendation_reason}</p>
                    </div>
                  )}
                </div>
              )}

              {/* Parsed Data Preview */}
              {proposal.parsed && (
                <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                  <h4 className="font-semibold text-gray-900 mb-3">Proposal Summary</h4>
                  {proposal.parsed.summary && (
                    <p className="text-gray-700 text-sm mb-3">{proposal.parsed.summary}</p>
                  )}
                  {proposal.parsed.offerings && (
                    <div>
                      <p className="text-sm font-medium text-gray-600 mb-2">Key Offerings:</p>
                      <ul className="list-disc list-inside text-sm text-gray-700">
                        {(proposal.parsed.offerings || []).slice(0, 3).map((offering, i) => (
                          <li key={i}>{offering}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}

              {/* Action Buttons */}
              <div className="mt-4 flex space-x-2">
                <button
                  onClick={() => handleRescore(proposal.id)}
                  disabled={rescoring === proposal.id}
                  className="flex items-center space-x-2 px-4 py-2 border border-primary text-primary rounded-lg hover:bg-primary hover:text-white transition disabled:opacity-50"
                >
                  <RefreshCw size={18} />
                  <span>Rescore</span>
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
