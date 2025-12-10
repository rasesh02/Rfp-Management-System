import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Trash2, Edit, Search } from 'lucide-react'
import { vendorAPI } from '../../api'
import Loading from '../../components/Loading'
import Alert from '../../components/Alert'
import Button from '../../components/Button'

export default function VendorList() {
  const [vendors, setVendors] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)

  useEffect(() => {
    fetchVendors()
  }, [page, search])

  const fetchVendors = async () => {
    try {
      setLoading(true)
      let res
      if (search) {
        res = await vendorAPI.search(search)
        const vendors = Array.isArray(res.data) ? res.data : (res.data.vendors || [])
        setVendors(vendors)
        setTotal(vendors.length)
      } else {
        res = await vendorAPI.getAll(page, 10)
        const vendors = Array.isArray(res.data) ? res.data : (res.data.vendors || [])
        setVendors(vendors)
        setTotal(res.data.count || vendors.length)
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load vendors')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this vendor?')) return
    try {
      await vendorAPI.delete(id)
      setVendors(vendors.filter(v => v.id !== id))
    } catch (err) {
      setError('Failed to delete vendor')
    }
  }

  if (loading) return <Loading message="Loading vendors..." />

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Vendors</h1>
        <Link to="/vendors/create">
          <Button>+ Add Vendor</Button>
        </Link>
      </div>

      {/* Alerts */}
      {error && <Alert type="error" message={error} onClose={() => setError(null)} />}

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-3 text-gray-400" size={20} />
        <input
          type="text"
          placeholder="Search vendors..."
          value={search}
          onChange={(e) => {
            setSearch(e.target.value)
            setPage(1)
          }}
          className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
        />
      </div>

      {/* Vendor List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {vendors.length === 0 ? (
          <div className="col-span-full text-center py-12">
            <p className="text-gray-600">
              No vendors found. <Link to="/vendors/create" className="text-primary hover:underline">Add one</Link>
            </p>
          </div>
        ) : (
          vendors.map(vendor => (
            <div key={vendor.id} className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition">
              <h3 className="text-lg font-semibold text-gray-900">{vendor.name}</h3>
              <p className="text-sm text-gray-600 mt-2">{vendor.contact_email}</p>
              {vendor.phone && <p className="text-sm text-gray-600">{vendor.phone}</p>}
              {vendor.contact_person && <p className="text-sm text-gray-600">Contact: {vendor.contact_person}</p>}
              
              <div className="flex space-x-2 mt-4">
                <Link to={`/vendors/${vendor.id}`} className="flex-1">
                  <Button size="sm" variant="outline" className="w-full">
                    <Edit size={16} className="mr-2 inline" />
                    Edit
                  </Button>
                </Link>
                <button
                  onClick={() => handleDelete(vendor.id)}
                  className="flex-1 px-3 py-2 text-sm text-red-600 border border-red-300 rounded-lg hover:bg-red-50 transition"
                >
                  <Trash2 size={16} className="mr-2 inline" />
                  Delete
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Pagination */}
      {!search && total > 10 && (
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
