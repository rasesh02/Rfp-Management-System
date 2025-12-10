import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Menu, X } from 'lucide-react'

export default function Layout({ children }) {
  const [isMenuOpen, setIsMenuOpen] = useState(false)

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation */}
      <nav className="bg-white shadow-md sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <Link to="/" className="flex items-center space-x-2">
              <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-lg">RFP</span>
              </div>
              <span className="font-bold text-xl text-gray-900 hidden sm:inline">RFP System</span>
            </Link>

            {/* Desktop Menu */}
            <div className="hidden md:flex items-center space-x-8">
              <Link to="/" className="text-gray-700 hover:text-primary transition">Dashboard</Link>
              <Link to="/rfps" className="text-gray-700 hover:text-primary transition">RFPs</Link>
              <Link to="/vendors" className="text-gray-700 hover:text-primary transition">Vendors</Link>
              <Link to="/rfps/create" className="bg-primary text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition">
                New RFP
              </Link>
            </div>

            {/* Mobile Menu Button */}
            <button 
              className="md:hidden"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
            >
              {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>

          {/* Mobile Menu */}
          {isMenuOpen && (
            <div className="md:hidden pb-4 space-y-2">
              <Link to="/" className="block px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg">Dashboard</Link>
              <Link to="/rfps" className="block px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg">RFPs</Link>
              <Link to="/vendors" className="block px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg">Vendors</Link>
              <Link to="/rfps/create" className="block px-4 py-2 bg-primary text-white rounded-lg hover:bg-blue-600">New RFP</Link>
            </div>
          )}
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 text-center text-gray-600">
          <p>&copy; 2024 RFP Management System. All rights reserved.</p>
        </div>
      </footer>
    </div>
  )
}
