import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Trash2, Edit, Send } from 'lucide-react'
import { rfpAPI } from '../../api'
import Loading from '../../components/Loading'
import Alert from '../../components/Alert'
import Button from '../../components/Button'

export default function RFPList() {
  const [rfps, setRfps] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)

  useEffect(() => {
    fetchRfps()
  }, [page])

  const fetchRfps = async () => {
    try {
      setLoading(true)
      const res = await rfpAPI.getAll(page, 10)
      setRfps(res.data.rfps || [])
      setTotal(res.data.total || 0)
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load RFPs')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this RFP?')) return
    try {
      await rfpAPI.delete(id)
      setRfps(rfps.filter(r => r.id !== id))
      setError(null)
    } catch (err) {
      setError('Failed to delete RFP')
    }
  }

  if (loading) return <Loading message="Loading RFPs..." />

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">RFPs</h1>
        <Link to="/rfps/create">
          <Button>+ Create RFP</Button>
        </Link>
      </div>

      {/* Alerts */}
      {error && <Alert type="error" message={error} onClose={() => setError(null)} />}

      {/* RFP List */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        {rfps.length === 0 ? (
          <div className="p-8 text-center text-gray-600">
            <p>No RFPs found. <Link to="/rfps/create" className="text-primary hover:underline">Create one</Link></p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="text-left py-4 px-6 font-semibold text-gray-700">Title</th>
                  <th className="text-left py-4 px-6 font-semibold text-gray-700">Description</th>
                  <th className="text-left py-4 px-6 font-semibold text-gray-700">Status</th>
                  <th className="text-left py-4 px-6 font-semibold text-gray-700">Created</th>
                  <th className="text-center py-4 px-6 font-semibold text-gray-700">Actions</th>
                </tr>
              </thead>
              <tbody>
                {rfps.map(rfp => (
                  <tr key={rfp.id} className="border-b hover:bg-gray-50 transition">
                    <td className="py-4 px-6 font-medium">{rfp.title}</td>
                    <td className="py-4 px-6 text-gray-600 truncate max-w-xs">{rfp.description || '-'}</td>
                    <td className="py-4 px-6">
                      <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                        rfp.status === 'active' ? 'bg-green-100 text-green-800' :
                        rfp.status === 'sent' ? 'bg-blue-100 text-blue-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {rfp.status || 'draft'}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-gray-600 text-sm">{new Date(rfp.created_at).toLocaleDateString()}</td>
                    <td className="py-4 px-6 text-center">
                      <div className="flex justify-center items-center space-x-2">
                        <Link to={`/rfps/${rfp.id}`} className="text-blue-600 hover:text-blue-800">
                          <Edit size={18} />
                        </Link>
                        <button 
                          onClick={() => handleDelete(rfp.id)}
                          className="text-red-600 hover:text-red-800"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pagination */}
      {total > 10 && (
        <div className="flex justify-center items-center space-x-4">
          <button 
            disabled={page === 1}
            onClick={() => setPage(page - 1)}
            className="px-4 py-2 border rounded-lg disabled:opacity-50"
          >
            Previous
          </button>
          <span className="text-gray-600">Page {page} of {Math.ceil(total / 10)}</span>
          <button 
            disabled={page >= Math.ceil(total / 10)}
            onClick={() => setPage(page + 1)}
            className="px-4 py-2 border rounded-lg disabled:opacity-50"
          >
            Next
          </button>
        </div>
      )}
    </div>
  )
}
