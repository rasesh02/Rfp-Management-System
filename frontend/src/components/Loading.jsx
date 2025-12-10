import { Loader } from 'lucide-react'

export default function Loading({ message = 'Loading...' }) {
  return (
    <div className="flex flex-col items-center justify-center min-h-64">
      <Loader className="w-8 h-8 text-primary animate-spin mb-4" />
      <p className="text-gray-600">{message}</p>
    </div>
  )
}
