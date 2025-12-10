import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { FileText, Users, Clock, CheckCircle } from 'lucide-react'
import { rfpAPI, vendorAPI } from '../api'
import Loading from '../components/Loading'
import Alert from '../components/Alert'
import Button from '../components/Button'

export default function Dashboard() {
  const [stats, setStats] = useState({ rfps: 0, vendors: 0, proposals: 0, sent: 0 })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [recentRfps, setRecentRfps] = useState([])

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      setLoading(true)
      const [rfpRes, vendorRes] = await Promise.all([
        rfpAPI.getAll(1, 5),
        vendorAPI.getAll(1, 100),
      ])

      setRecentRfps(rfpRes.data.rfps || [])
      setStats({
        rfps: rfpRes.data.total || 0,
        vendors: vendorRes.data.total || 0,
        proposals: 0,
        sent: 0,
      })
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load dashboard')
    } finally {
      setLoading(false)
    }
  }

  if (loading) return <Loading message="Loading dashboard..." />

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600 mt-2">Welcome to RFP Management System</p>
        </div>
        <Link to="/rfps/create">
          <Button>+ New RFP</Button>
        </Link>
      </div>

      {/* Alerts */}
      {error && <Alert type="error" message={error} onClose={() => setError(null)} />}

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard icon={<FileText />} label="Total RFPs" value={stats.rfps} color="blue" />
        <StatCard icon={<Users />} label="Vendors" value={stats.vendors} color="purple" />
        <StatCard icon={<Clock />} label="Pending Responses" value={stats.proposals} color="yellow" />
        <StatCard icon={<CheckCircle />} label="Received Proposals" value={stats.sent} color="green" />
      </div>

      {/* Recent RFPs */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-2xl font-bold mb-6">Recent RFPs</h2>
        {recentRfps.length === 0 ? (
          <p className="text-gray-600 text-center py-8">No RFPs yet. <Link to="/rfps/create" className="text-primary hover:underline">Create one</Link></p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b">
                <tr>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Title</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Status</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Created</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Action</th>
                </tr>
              </thead>
              <tbody>
                {recentRfps.map(rfp => (
                  <tr key={rfp.id} className="border-b hover:bg-gray-50">
                    <td className="py-3 px-4">{rfp.title}</td>
                    <td className="py-3 px-4">
                      <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                        rfp.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                      }`}>
                        {rfp.status || 'draft'}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-gray-600">{new Date(rfp.created_at).toLocaleDateString()}</td>
                    <td className="py-3 px-4">
                      <Link to={`/rfps/${rfp.id}`} className="text-primary hover:underline">View</Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <QuickActionCard 
          title="Create RFP" 
          description="Start a new RFP process"
          link="/rfps/create"
          icon={<FileText />}
        />
        <QuickActionCard 
          title="Manage Vendors" 
          description="Add and manage your vendor list"
          link="/vendors"
          icon={<Users />}
        />
        <QuickActionCard 
          title="View Proposals" 
          description="Check received proposals"
          link="/rfps"
          icon={<CheckCircle />}
        />
      </div>
    </div>
  )
}

function StatCard({ icon, label, value, color }) {
  const colors = {
    blue: 'bg-blue-50 text-blue-600',
    purple: 'bg-purple-50 text-purple-600',
    yellow: 'bg-yellow-50 text-yellow-600',
    green: 'bg-green-50 text-green-600',
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className={`w-12 h-12 rounded-lg ${colors[color]} flex items-center justify-center mb-4`}>
        {icon}
      </div>
      <p className="text-gray-600 text-sm">{label}</p>
      <p className="text-3xl font-bold text-gray-900 mt-1">{value}</p>
    </div>
  )
}

function QuickActionCard({ title, description, link, icon }) {
  return (
    <Link to={link}>
      <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition cursor-pointer">
        <div className="text-primary mb-3">{icon}</div>
        <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
        <p className="text-gray-600 text-sm mt-2">{description}</p>
      </div>
    </Link>
  )
}
