import Navbar from "../components/Navbar"
import Sidebar from "../components/Sidebar"
import Footer from "../components/Footer"

const MainLayout = ({ children, sidebarOpen, setSidebarOpen }) => {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navbar */}
      <Navbar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />

      {/* Sidebar */}
      <Sidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />

      {/* Main Content */}
      <div className="lg:ml-64 pt-16">
        <main className="min-h-[calc(100vh-4rem)]">
          <div className="p-6">{children}</div>
        </main>

        {/* Footer */}
        <Footer />
      </div>
    </div>
  )
}

export default MainLayout
