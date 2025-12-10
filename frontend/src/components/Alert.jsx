import { AlertCircle, CheckCircle, InfoIcon, AlertTriangle } from 'lucide-react'

export default function Alert({ type = 'info', title, message, onClose }) {
  const styles = {
    info: 'bg-blue-50 border-blue-200 text-blue-800',
    success: 'bg-green-50 border-green-200 text-green-800',
    warning: 'bg-yellow-50 border-yellow-200 text-yellow-800',
    error: 'bg-red-50 border-red-200 text-red-800',
  }

  const icons = {
    info: <InfoIcon className="w-5 h-5" />,
    success: <CheckCircle className="w-5 h-5" />,
    warning: <AlertTriangle className="w-5 h-5" />,
    error: <AlertCircle className="w-5 h-5" />,
  }

  return (
    <div className={`border rounded-lg p-4 mb-4 flex items-start justify-between ${styles[type]}`}>
      <div className="flex items-start space-x-3">
        {icons[type]}
        <div>
          {title && <h3 className="font-semibold">{title}</h3>}
          {message && <p className="text-sm">{message}</p>}
        </div>
      </div>
      {onClose && (
        <button onClick={onClose} className="text-gray-500 hover:text-gray-700">×</button>
      )}
    </div>
  )
}
