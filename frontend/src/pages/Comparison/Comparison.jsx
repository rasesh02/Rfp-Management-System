import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Award, TrendingUp } from 'lucide-react'
import { comparisonAPI, proposalAPI, rfpAPI } from '../../api'
import Loading from '../../components/Loading'
import Alert from '../../components/Alert'
import Button from '../../components/Button'

export default function Comparison() {
  const { rfpId } = useParams()
  const navigate = useNavigate()
  const [proposals, setProposals] = useState([])
  const [selectedProposals, setSelectedProposals] = useState([])
  const [comparison, setComparison] = useState(null)
  const [rfp, setRfp] = useState(null)
  const [loading, setLoading] = useState(true)
  const [comparing, setComparing] = useState(false)
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
      setSelectedProposals((proposalRes.data.proposals || []).map(p => p.id))
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load data')
    } finally {
      setLoading(false)
    }
  }

  const handleCompare = async () => {
    if (selectedProposals.length < 2) {
      setError('Please select at least 2 proposals to compare')
      return
    }

    try {
      setComparing(true)
      const res = await comparisonAPI.evaluate(rfpId)
      setComparison(res.data)
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to compare proposals')
    } finally {
      setComparing(false)
    }
  }

  const toggleProposal = (proposalId) => {
    setSelectedProposals(prev =>
      prev.includes(proposalId)
        ? prev.filter(p => p !== proposalId)
        : [...prev, proposalId]
    )
  }

  if (loading) return <Loading message="Loading proposals..." />

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold">Compare Proposals</h1>
          {rfp && <p className="text-gray-600 mt-2">{rfp.title}</p>}
        </div>
        <Button variant="secondary" onClick={() => navigate(-1)}>Back</Button>
      </div>

      {/* Alerts */}
      {error && <Alert type="error" message={error} onClose={() => setError(null)} />}

      {/* Proposal Selection */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-xl font-bold mb-4">Select Proposals to Compare</h3>
        {proposals.length === 0 ? (
          <p className="text-gray-600">No proposals available</p>
        ) : (
          <div className="space-y-3 mb-6">
            {proposals.map(proposal => (
              <label key={proposal.id} className="flex items-center p-3 border rounded-lg hover:bg-gray-50">
                <input
                  type="checkbox"
                  checked={selectedProposals.includes(proposal.id)}
                  onChange={() => toggleProposal(proposal.id)}
                  className="w-4 h-4 text-primary rounded"
                />
                <div className="ml-3 flex-1">
                  <p className="font-medium">{proposal.vendor?.name || 'Unknown'}</p>
                  <p className="text-sm text-gray-600">Score: {proposal.score || 'Not scored'}</p>
                </div>
              </label>
            ))}
          </div>
        )}
        
        <Button 
          onClick={handleCompare}
          loading={comparing}
          disabled={selectedProposals.length < 2}
        >
          <TrendingUp size={18} className="mr-2 inline" />
          Compare {selectedProposals.length} Proposals
        </Button>
      </div>

      {/* Comparison Results */}
      {comparison && (
        <div className="space-y-6">
          {/* AI Recommendation */}
          {comparison.ai_evaluation && (
            <div className="bg-gradient-to-br from-green-50 to-blue-50 rounded-lg border-2 border-green-200 p-8">
              <div className="flex items-center mb-4">
                <Award className="text-green-600 mr-3" size={32} />
                <h2 className="text-2xl font-bold text-gray-900">AI Recommendation</h2>
              </div>
              
              {comparison.ai_evaluation.recommendations && (
                <div className="space-y-4">
                  {comparison.ai_evaluation.recommendations.map((rec, i) => (
                    <div key={i} className="bg-white rounded-lg p-4">
                      <div className="flex justify-between items-start mb-2">
                        <h3 className="text-lg font-semibold text-gray-900">
                          {i + 1}. {rec.vendor_name}
                        </h3>
                        <span className="text-2xl font-bold text-primary">{rec.score}</span>
                      </div>
                      <p className="text-gray-700">{rec.reasoning}</p>
                      {rec.strengths && (
                        <div className="mt-3">
                          <p className="text-sm font-medium text-green-700">Strengths:</p>
                          <ul className="list-disc list-inside text-sm text-gray-600 mt-1">
                            {rec.strengths.map((s, j) => <li key={j}>{s}</li>)}
                          </ul>
                        </div>
                      )}
                      {rec.concerns && (
                        <div className="mt-3">
                          <p className="text-sm font-medium text-orange-700">Concerns:</p>
                          <ul className="list-disc list-inside text-sm text-gray-600 mt-1">
                            {rec.concerns.map((c, j) => <li key={j}>{c}</li>)}
                          </ul>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Comparison Matrix */}
          {comparison.compared_proposals && (
            <div className="bg-white rounded-lg shadow-md p-6 overflow-x-auto">
              <h3 className="text-xl font-bold mb-4">Detailed Comparison</h3>
              <table className="w-full min-w-full">
                <thead>
                  <tr className="border-b bg-gray-50">
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Vendor</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Score</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {comparison.compared_proposals.map((prop, i) => (
                    <tr key={i} className="border-b hover:bg-gray-50">
                      <td className="py-3 px-4 font-medium">{prop.vendor_name}</td>
                      <td className="py-3 px-4">
                        <div className="flex items-center space-x-2">
                          <div className="w-32 bg-gray-200 rounded-full h-2">
                            <div 
                              className="bg-primary h-2 rounded-full" 
                              style={{ width: `${(prop.score / 100) * 100}%` }}
                            />
                          </div>
                          <span className="font-semibold text-primary">{prop.score}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                          prop.recommendation === 'recommended' ? 'bg-green-100 text-green-800' :
                          prop.recommendation === 'consider' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {prop.recommendation}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
