import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import Layout from './components/Layout'
import Dashboard from './pages/Dashboard'
import RFPList from './pages/RFP/RFPList'
import RFPCreate from './pages/RFP/RFPCreate'
import RFPDetail from './pages/RFP/RFPDetail'
import VendorList from './pages/Vendor/VendorList'
import VendorCreate from './pages/Vendor/VendorCreate'
import ProposalList from './pages/Proposal/ProposalList'
import ProposalDetail from './pages/Proposal/ProposalDetail'
import Comparison from './pages/Comparison/Comparison'

export default function App() {
  return (
    <Router>
      <Layout>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          
          {/* RFP Routes */}
          <Route path="/rfps" element={<RFPList />} />
          <Route path="/rfps/create" element={<RFPCreate />} />
          <Route path="/rfps/:id" element={<RFPDetail />} />
          
          {/* Vendor Routes */}
          <Route path="/vendors" element={<VendorList />} />
          <Route path="/vendors/create" element={<VendorCreate />} />
          
          {/* Proposal Routes */}
          <Route path="/rfps/:rfpId/proposals" element={<ProposalList />} />
          <Route path="/proposals/:id" element={<ProposalDetail />} />
          
          {/* Comparison Routes */}
          <Route path="/rfps/:rfpId/compare" element={<Comparison />} />
          
          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Layout>
    </Router>
  )
}
