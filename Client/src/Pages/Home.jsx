// "use client"

import { ArrowRight, Sparkles, Moon, Flame, Shield, TrendingUp, Play, Stars } from "lucide-react"
import { useEffect, useRef } from "react"
import { useNavigate } from "react-router-dom"
// ...existing code...

const Home = () => {
  const navigate = useNavigate()
  const canvasRef = useRef(null)

  // Magical particle effect
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    canvas.width = window.innerWidth
    canvas.height = window.innerHeight

    const particles = []
    const particleCount = 50

    class Particle {
      constructor() {
        this.x = Math.random() * canvas.width
        this.y = Math.random() * canvas.height
        this.size = Math.random() * 2 + 0.5
        this.speedX = Math.random() * 0.5 - 0.25
        this.speedY = Math.random() * 0.5 - 0.25
        this.opacity = Math.random() * 0.5 + 0.2
      }

      update() {
        this.x += this.speedX
        this.y += this.speedY

        if (this.x > canvas.width) this.x = 0
        if (this.x < 0) this.x = canvas.width
        if (this.y > canvas.height) this.y = 0
        if (this.y < 0) this.y = canvas.height
      }

      draw() {
        ctx.fillStyle = `rgba(147, 51, 234, ${this.opacity})`
        ctx.beginPath()
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2)
        ctx.fill()
      }
    }

    for (let i = 0; i < particleCount; i++) {
      particles.push(new Particle())
    }

    function animate() {
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      particles.forEach((particle) => {
        particle.update()
        particle.draw()
      })
      requestAnimationFrame(animate)
    }

    animate()

    const handleResize = () => {
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight
    }

    window.addEventListener("resize", handleResize)
    return () => window.removeEventListener("resize", handleResize)
  }, [])

  const features = [
    {
      icon: Moon,
      title: "Circadian Tracking",
      description: "Align your medicine schedule with your body's natural rhythms and performance cycles.",
    },
    {
      icon: Shield,
      title: "Wellness Protection",
      description: "Never miss a dose with mystical reminders and protective health monitoring.",
    },
    {
      icon: Flame,
      title: "Energy Alchemy",
      description: "Transform your vitality with personalized wellness potions and supplement tracking.",
    },
    {
      icon: TrendingUp,
      title: "Performance Insights",
      description: "Unlock patterns in your health data to optimize your artistic performance.",
    },
  ]

  const stats = [
    { label: "Performers Served", value: "2.5K+" },
    { label: "Doses Tracked", value: "100K+" },
    { label: "Wellness Streaks", value: "365+" },
    { label: "Health Score", value: "98%" },
  ]

  return (
      <div className="relative min-h-screen bg-gradient-to-b from-gray-900 via-purple-900 to-gray-900 text-white overflow-hidden">
        {/* Magical particle canvas */}
        <canvas ref={canvasRef} className="fixed inset-0 pointer-events-none z-0" />

        <style>{`
          @keyframes shimmer {
            0%, 100% { background-position: 0% 50%; }
            50% { background-position: 100% 50%; }
          }
          @keyframes float {
            0%, 100% { transform: translateY(0px); }
            50% { transform: translateY(-20px); }
          }
          @keyframes float-delayed {
            0%, 100% { transform: translateY(0px); }
            50% { transform: translateY(-30px); }
          }
          .animate-shimmer {
            background-size: 200% 200%;
            animation: shimmer 3s ease-in-out infinite;
          }
          .animate-float {
            animation: float 6s ease-in-out infinite;
          }
          .animate-float-delayed {
            animation: float-delayed 8s ease-in-out infinite;
          }
          .magical-glow {
            box-shadow: 0 0 60px rgba(168, 85, 247, 0.4), inset 0 0 60px rgba(168, 85, 247, 0.1);
          }
        `}</style>

        <div className="relative z-10 space-y-16 px-4 py-8 md:px-8">
          {/* Hero Section */}
          <section className="relative overflow-hidden pt-12">
            <div className="magical-glow rounded-3xl p-8 md:p-16 backdrop-blur-sm bg-black/30 border border-purple-500/20">
              <div className="max-w-4xl mx-auto text-center">
                <div className="flex items-center justify-center space-x-2 mb-6 animate-pulse">
                  <Sparkles className="text-purple-400 w-5 h-5" />
                  <span className="text-sm font-medium bg-purple-500/20 px-3 py-1 rounded-full border border-purple-400/30">
                    ✨ Mystical Wellness
                  </span>
                </div>

                <h1 className="text-4xl md:text-6xl font-bold mb-6 leading-tight">
                  The Alchemist&apos;s
                  <span className="block text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-pink-400 to-purple-400 animate-shimmer">
                    Grimoire
                  </span>
                </h1>

                <p className="text-xl md:text-2xl text-purple-200 mb-8 max-w-3xl mx-auto leading-relaxed">
                  Ancient wisdom meets modern medicine. Track your wellness journey, manage your medicine schedules, and
                  unlock your peak performance as a performer.
                </p>

                <div className="flex flex-col sm:flex-row items-center justify-center space-y-4 sm:space-y-0 sm:space-x-4">
                  <button 
                    onClick={() => navigate('/signup')}
                    className="group w-full sm:w-auto bg-gradient-to-r from-purple-600 to-pink-600 text-white px-8 py-4 rounded-xl font-semibold hover:from-purple-500 hover:to-pink-500 transition-all duration-300 flex items-center justify-center space-x-2 shadow-lg shadow-purple-500/50 hover:shadow-purple-500/70 hover:scale-105"
                  >
                    <span>Begin Your Journey</span>
                    <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                  </button>

                  <button 
                    onClick={() => navigate('/login')}
                    className="w-full sm:w-auto border-2 border-purple-400/50 text-purple-200 px-8 py-4 rounded-xl font-semibold hover:bg-purple-500/10 hover:border-purple-400 transition-all duration-300 flex items-center justify-center space-x-2 backdrop-blur-sm"
                  >
                    <Play className="w-5 h-5" />
                    <span>See the Magic</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Floating orbs decoration */}
            <div className="absolute top-10 left-10 w-32 h-32 bg-purple-500/20 rounded-full blur-3xl animate-float"></div>
            <div className="absolute bottom-10 right-10 w-40 h-40 bg-pink-500/20 rounded-full blur-3xl animate-float-delayed"></div>
          </section>

          {/* Stats Section */}
          <section>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
              {stats.map((stat, index) => (
                <div key={index} className="text-center group">
                  <div className="text-3xl md:text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400 mb-2 group-hover:scale-110 transition-transform">
                    {stat.value}
                  </div>
                  <div className="text-purple-300 font-medium">{stat.label}</div>
                </div>
              ))}
            </div>
          </section>

          {/* Features Section */}
          <section>
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold text-white mb-4 flex items-center justify-center gap-3">
                <Stars className="text-purple-400 w-8 h-8" />
                Mystical Powers
                <Stars className="text-purple-400 w-8 h-8" />
              </h2>
              <p className="text-xl text-purple-200 max-w-3xl mx-auto">
                Harness ancient wisdom and modern technology to master your wellness journey as a performer.
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
              {features.map((feature, index) => {
                const Icon = feature.icon
                return (
                  <div
                    key={index}
                    className="group bg-gradient-to-br from-purple-900/50 to-pink-900/30 p-8 rounded-2xl backdrop-blur-sm border border-purple-500/20 hover:border-purple-400/50 transition-all duration-300 hover:scale-105 hover:shadow-xl hover:shadow-purple-500/30"
                  >
                    <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center mb-6 group-hover:rotate-12 transition-transform shadow-lg shadow-purple-500/50">
                      <Icon className="text-white w-6 h-6" />
                    </div>
                    <h3 className="text-xl font-semibold text-white mb-3">{feature.title}</h3>
                    <p className="text-purple-200 leading-relaxed">{feature.description}</p>
                  </div>
                )
              })}
            </div>
          </section>

          {/* CTA Section */}
          <section className="pb-16">
            <div className="relative bg-gradient-to-r from-purple-600/30 to-pink-600/30 rounded-3xl p-8 md:p-16 text-white text-center backdrop-blur-sm border border-purple-400/30 overflow-hidden">
              <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxwYXRoIGQ9Ik0zNiAxOGMzLjMxNCAwIDYgMi42ODYgNiA2cy0yLjY4NiA2LTYgNi02LTIuNjg2LTYtNiAyLjY4Ni02IDYtNnoiIHN0cm9rZT0iIzlkNGVkZCIgc3Ryb2tlLXdpZHRoPSIuNSIgb3BhY2l0eT0iLjIiLz48L2c+PC9zdmc+')] opacity-20"></div>

              <div className="relative z-10">
                <h2 className="text-3xl md:text-4xl font-bold mb-4">Ready to Transform Your Wellness?</h2>
                <p className="text-xl text-purple-100 mb-8 max-w-2xl mx-auto">
                  Join performers worldwide who trust the Grimoire to keep them healthy, focused, and at peak performance.
                </p>
                <div className="flex flex-col sm:flex-row items-center justify-center space-y-4 sm:space-y-0 sm:space-x-4">
                  <button 
                    onClick={() => navigate('/signup')}
                    className="w-full sm:w-auto bg-white text-purple-900 px-8 py-4 rounded-xl font-semibold hover:bg-purple-50 transition-all duration-300 shadow-lg hover:scale-105"
                  >
                    Start Free Trial
                  </button>
                  <button 
                    onClick={() => navigate('/medicine-form')}
                    className="w-full sm:w-auto border-2 border-white/50 text-white px-8 py-4 rounded-xl font-semibold hover:bg-white/10 hover:border-white transition-all duration-300 backdrop-blur-sm"
                  >
                    Learn More
                  </button>
                </div>
              </div>
            </div>
          </section>
        </div>
      </div>
    
  )
}

export default Home
