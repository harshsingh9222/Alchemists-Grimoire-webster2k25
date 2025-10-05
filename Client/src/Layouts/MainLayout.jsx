import Navbar from "../Components/Navbar"
import Sidebar from "../Components/Sidebar"
import Footer from "../Components/Footer"
import PropTypes from 'prop-types'

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
