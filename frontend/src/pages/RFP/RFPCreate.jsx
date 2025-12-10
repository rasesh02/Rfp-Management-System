import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { rfpAPI } from '../../api'
import Alert from '../../components/Alert'
import Button from '../../components/Button'

export default function RFPCreate() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [formData, setFormData] = useState({
    title: '',
    description: '',
  })

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!formData.title.trim()) {
      setError('Title is required')
      return
    }

    try {
      setLoading(true)
      const res = await rfpAPI.create(formData)
      navigate(`/rfps/${res.data.rfp.id}`)
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create RFP')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-3xl font-bold mb-8">Create New RFP</h1>

      {error && <Alert type="error" message={error} onClose={() => setError(null)} />}

      <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-md p-8 space-y-6">
        {/* Title */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Title *</label>
          <input
            type="text"
            name="title"
            value={formData.title}
            onChange={handleChange}
            placeholder="e.g., Cloud Infrastructure Services"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
            required
          />
        </div>

        {/* Description */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
          <textarea
            name="description"
            value={formData.description}
            onChange={handleChange}
            placeholder="Describe your RFP requirements..."
            rows={6}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
          />
        </div>

        {/* Buttons */}
        <div className="flex space-x-4 pt-4">
          <Button type="submit" loading={loading}>Create RFP</Button>
          <Button 
            type="button" 
            variant="secondary"
            onClick={() => navigate('/rfps')}
          >
            Cancel
          </Button>
        </div>
      </form>
    </div>
  )
}
