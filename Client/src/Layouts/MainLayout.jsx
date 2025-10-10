import Navbar from "../Components/Navbar"
import Sidebar from "../Components/Sidebar"
import Footer from "../Components/Footer"
import PropTypes from 'prop-types'
import { useSelector, useDispatch } from 'react-redux'
import { dismissRisk } from '../store/notificationsSlice'
import { remindRiskAgain as remindRiskAgainAPI } from '../api'
import { useEffect, useState } from 'react'

// Global popup component
function GlobalRiskPopup() {
  const risks = useSelector(s => s.notifications?.risks || [])
  const dispatch = useDispatch()
  const [visible, setVisible] = useState(false)
  const [busyId, setBusyId] = useState(null)

  useEffect(() => {
    if (risks && risks.length > 0) {
      setVisible(true)
    }
  }, [risks])

  if (!visible || !risks || risks.length === 0) return null

  return (
    <div className="fixed bottom-6 right-6 z-50">
      <div className="w-96 bg-white text-gray-900 rounded-lg shadow-lg overflow-hidden">
        <div className="p-3 border-b font-semibold">Alert: Upcoming risky medicines</div>
        <div className="max-h-64 overflow-auto">
          {risks.map(r => (
            <div key={r.doseId} className="p-3 border-b flex justify-between items-start">
              <div>
                <div className="font-semibold">{r.medicineName}</div>
                <div className="text-xs text-gray-600">{r.slot} — Miss chance: {Math.round((r.missedProb||0)*100)}%</div>
                <div className="text-xs text-gray-500">Scheduled: {new Date(r.scheduledTime).toLocaleTimeString()}</div>
              </div>
              <div className="ml-3 flex flex-col items-end gap-2">
                <button onClick={() => dispatch(dismissRisk(r.doseId))} className="px-2 py-1 text-xs bg-indigo-600 text-white rounded">Dismiss</button>
                <button
                  disabled={busyId === String(r.doseId)}
                  onClick={async () => {
                    try {
                      setBusyId(String(r.doseId))
                      await remindRiskAgainAPI(r.doseId)
                      // Optional: dismiss current item since user asked to be reminded later
                      dispatch(dismissRisk(r.doseId))
                    } catch (e) {
                      console.error('Failed to schedule remind-again', e)
                    } finally {
                      setBusyId(null)
                    }
                  }}
                  className={`px-2 py-1 text-xs rounded ${busyId === String(r.doseId) ? 'bg-gray-400 text-white' : 'bg-purple-600 text-white'}`}
                >
                  {busyId === String(r.doseId) ? 'Scheduling…' : 'Remind me again'}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

const MainLayout = ({ children, sidebarOpen, setSidebarOpen }) => {
  return (
    // Use site-wide dark background so content and footer align; sidebar remains white
    <div className="min-h-screen bg-slate-900 text-white">
      {/* Navbar */}
      <Navbar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />

      {/* Sidebar */}
      <Sidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />

      {/* Main Content */}
      <div className="lg:ml-64 pt-16">
        <main className="min-h-[calc(100vh-4rem)]">
          {/* center content and keep background transparent so dark site bg shows through */}
          <div className="p-6 max-w-7xl mx-auto">{children}</div>
        </main>

        {/* Global notification popup: show prominently when risks exist */}
        <GlobalRiskPopup />

        {/* Footer */}
        <Footer />
      </div>
    </div>
  )
}

export default MainLayout

MainLayout.propTypes = {
  children: PropTypes.node,
  sidebarOpen: PropTypes.bool,
  setSidebarOpen: PropTypes.func,
}
