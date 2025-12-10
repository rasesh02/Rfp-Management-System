export default function Button({ 
  children, 
  variant = 'primary', 
  size = 'md', 
  disabled = false,
  loading = false,
  ...props 
}) {
  const baseStyles = 'font-medium rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed'
  
  const variants = {
    primary: 'bg-primary text-white hover:bg-blue-600',
    secondary: 'bg-gray-200 text-gray-900 hover:bg-gray-300',
    success: 'bg-success text-white hover:bg-green-600',
    danger: 'bg-danger text-white hover:bg-red-600',
    outline: 'border border-gray-300 text-gray-700 hover:bg-gray-50',
  }

  const sizes = {
    sm: 'px-3 py-1 text-sm',
    md: 'px-4 py-2',
    lg: 'px-6 py-3 text-lg',
  }

  return (
    <button 
      disabled={disabled || loading}
      className={`${baseStyles} ${variants[variant]} ${sizes[size]}`}
      {...props}
    >
      {loading ? '...' : children}
    </button>
  )
}
