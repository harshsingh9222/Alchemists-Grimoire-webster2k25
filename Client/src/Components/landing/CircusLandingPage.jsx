import { useState, useEffect } from 'react'
import { motion, AnimatePresence, useMotionValue, useTransform } from 'framer-motion'
import { Howl } from 'howler'
import { useNavigate } from 'react-router-dom'
import drumrollUrl from '../../assets/Sounds/drumroll.wav'

const CircusLandingPage = () => {
  const navigate = useNavigate()

  const sounds = {
    drumroll: new Howl({ src: [drumrollUrl], volume: 0.15 }),
  }

  const [isLoading, setIsLoading] = useState(true)
  const [showContent, setShowContent] = useState(false)
  const [selectedCharacter, setSelectedCharacter] = useState(null)
  const [muted, setMuted] = useState(localStorage.getItem('circus_muted') === 'true')

  const mouseX = useMotionValue(0)
  const mouseY = useMotionValue(0)

  const characters = [
    { id: 'ringmaster', emoji: '🎩', title: 'The Ringmaster', power: 'Never miss a dose with commanding reminders' },
    { id: 'acrobat', emoji: '🤸', title: 'The Acrobat', power: 'Flexible scheduling for your dynamic lifestyle' },
    { id: 'magician', emoji: '🎭', title: 'The Magician', power: 'Transform your health with mystical insights' },
    { id: 'juggler', emoji: '🤹', title: 'The Juggler', power: 'Juggle multiple med schedules without dropping a beat' },
  ]

  useEffect(() => {
    const isMuted = localStorage.getItem('circus_muted') === 'true'
    if (!isMuted) {
      try {
        sounds.drumroll.play()
      } catch (e) {
        console.debug('drumroll play failed', e)
      }
    }
    return () => {
      try {
        sounds.drumroll.stop()
      } catch (e) {
        console.debug('drumroll stop failed', e)
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false)
      setTimeout(() => setShowContent(true), 500)
    }, 2000)

    let rafId
    const handleMouseMove = (e) => {
      cancelAnimationFrame(rafId)
      rafId = requestAnimationFrame(() => {
        mouseX.set(e.clientX)
        mouseY.set(e.clientY)
      })
    }

    window.addEventListener('mousemove', handleMouseMove, { passive: true })

    return () => {
      clearTimeout(timer)
      window.removeEventListener('mousemove', handleMouseMove)
      cancelAnimationFrame(rafId)
    }
  }, [mouseX, mouseY])

  useEffect(() => {
    const visited = localStorage.getItem('circus_visited') === 'true'
    if (visited) {
      const id = setTimeout(() => navigate('/home'), 350)
      return () => clearTimeout(id)
    }
  }, [navigate])

  const CurtainLoader = () => {
    const stripe = 24

    const leftCurtainBG = `linear-gradient(to right, rgba(0,0,0,0.35), rgba(0,0,0,0.15)), repeating-linear-gradient(90deg, #7f1d1d 0px, #7f1d1d ${stripe}px, #991b1b ${stripe}px, #991b1b ${stripe * 2}px)`

    const rightCurtainBG = `linear-gradient(to left, rgba(0,0,0,0.35), rgba(0,0,0,0.15)), repeating-linear-gradient(90deg, #7f1d1d 0px, #7f1d1d ${stripe}px, #991b1b ${stripe}px, #991b1b ${stripe * 2}px)`

    return (
      <motion.div className="fixed inset-0 z-50 flex items-center justify-center overflow-hidden bg-slate-900">
        <motion.div
          className="absolute left-0 top-0 h-full w-1/2 shadow-2xl"
          style={{
            backgroundImage: leftCurtainBG,
            backgroundSize: 'auto 100%',
            willChange: 'transform',
            transform: 'translateZ(0)'
          }}
          initial={{ x: 0, skewY: 0 }}
          animate={{ x: '-100%', skewY: -2 }}
          transition={{ duration: 1.5, ease: 'easeInOut', delay: 0.5 }}
        />

        <motion.div
          className="absolute right-0 top-0 h-full w-1/2 shadow-2xl"
          style={{
            backgroundImage: rightCurtainBG,
            backgroundSize: 'auto 100%',
            willChange: 'transform',
            transform: 'translateZ(0)'
          }}
          initial={{ x: 0, skewY: 0 }}
          animate={{ x: '100%', skewY: 2 }}
          transition={{ duration: 1.5, ease: 'easeInOut', delay: 0.5 }}
        />

        <motion.div className="relative z-10 text-center" initial={{ opacity: 1, scale: 1 }} animate={{ opacity: 0, scale: 1.5 }} transition={{ duration: 1, delay: 1 }}>
          <h1 className="text-5xl md:text-6xl font-bold text-yellow-400 drop-shadow-lg" style={{ fontFamily: "'Bungee', cursive" }}>
            🎪 Step Right Up! 🎪
          </h1>
        </motion.div>
      </motion.div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-900 overflow-x-hidden relative" style={{ fontFamily: "'Fredoka', sans-serif" }}>
      <div className="fixed inset-0 pointer-events-none">
        <div
          className="absolute inset-0 opacity-10"
          style={{
            backgroundImage: `repeating-linear-gradient(45deg, #FF6B6B, #FF6B6B 40px, #FFF8E1 40px, #FFF8E1 80px)`,
            animation: 'slideSmooth 30s linear infinite',
            willChange: 'transform'
          }}
        />

        <motion.div
          className="absolute inset-0 opacity-30"
          style={{
            background: useTransform([mouseX, mouseY], ([x, y]) => `radial-gradient(600px at ${x}px ${y}px, rgba(255, 215, 0, 0.15), transparent 40%)`),
            willChange: 'background'
          }}
        />

        <div className="absolute bottom-10 right-10 w-32 h-32 opacity-20">
          <div className="w-full h-full" style={{ animation: 'rotateSmooth 40s linear infinite', willChange: 'transform' }}>
            <span className="text-6xl absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">🎡</span>
          </div>
        </div>
      </div>

      <AnimatePresence>{isLoading && <CurtainLoader />}</AnimatePresence>

      <AnimatePresence>
        {showContent && (
          <motion.div className="relative z-10 px-4 py-8 max-w-7xl mx-auto" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5 }}>
            <motion.header className="text-center mb-12" initial={{ y: -50, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ type: 'spring', stiffness: 100, damping: 20 }}>
              <div className="flex justify-center gap-2 mb-4">{[...Array(10)].map((_, i) => (
                <div key={i} className="w-3 h-3 rounded-full bg-yellow-400 shadow-lg" style={{ animation: `pulse 2s ease-in-out ${i * 0.1}s infinite`, willChange: 'transform, opacity' }} />
              ))}</div>

              <h1 className="text-4xl md:text-6xl font-bold mb-4 bg-gradient-to-r from-yellow-400 via-yellow-300 to-yellow-400 bg-clip-text text-transparent animate-shimmer bg-[length:200%_100%]" style={{ fontFamily: "'Bungee', cursive" }}>
                🎪 Alchemist&apos;s Grimoire 🎪
              </h1>

              <p className="text-xl text-gray-200 font-light">
                <span className="inline-block animate-bounce-slow">✨</span> Medicine Schedules & Wellness Tracking for Performers <span className="inline-block animate-bounce-slow" style={{ animationDelay: '0.5s' }}>✨</span>
              </p>
            </motion.header>

            <motion.div className="mb-16" initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ delay: 0.2, duration: 0.5 }}>
              <div className="max-w-4xl mx-auto bg-gradient-to-br from-amber-100 to-amber-50 p-8 rounded-lg shadow-2xl transform perspective-1000 hover:scale-[1.02] transition-transform duration-300">
                <div className="border-4 border-red-600 p-6 md:p-8 rounded relative">
                  <div className="absolute -top-4 left-8 text-3xl">⭐</div>
                  <div className="absolute -bottom-4 right-8 text-3xl">⭐</div>

                  <h2 className="text-3xl md:text-4xl font-bold text-red-700 text-center mb-4" style={{ fontFamily: "'Kalam', cursive", fontWeight: 700 }}>
                    🎭 GRAND OPENING 🎭
                  </h2>

                  <div className="text-center space-y-4">
                    <p className="text-2xl font-bold text-purple-800">Ladies & Gentlemen, Boys & Girls!</p>
                    <p className="text-lg text-gray-800 leading-relaxed">Welcome to the most SPECTACULAR wellness show on Earth! Where medicine meets magic, and health becomes an extraordinary performance!</p>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">{[
                      { icon: '🎯', text: 'Never Miss' },
                      { icon: '📊', text: 'Track Progress' },
                      { icon: '🔮', text: 'AI Predictions' },
                      { icon: '📅', text: 'Calendar Sync' }
                    ].map((feature, i) => (
                      <motion.div key={i} className="bg-red-600 text-white px-3 py-2 rounded-full font-semibold shadow-lg" whileHover={{ scale: 1.1, rotate: [-2, 2, -2, 0] }} transition={{ type: 'spring', stiffness: 300 }}>
                        <span className="text-xl mr-1">{feature.icon}</span>
                        <span className="text-sm">{feature.text}</span>
                      </motion.div>
                    ))}</div>
                  </div>
                </div>
              </div>
            </motion.div>

            <motion.div className="mb-16" initial={{ opacity: 0, y: 50 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
              <h2 className="text-3xl md:text-4xl font-bold text-center text-gray-100 mb-8" style={{ fontFamily: "'Kalam', cursive", fontWeight: 700 }}>
                <span className="inline-block animate-spin-slow">⭐</span> Choose Your Circus Persona <span className="inline-block animate-spin-slow">⭐</span>
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">{characters.map((char, index) => (
                <motion.div key={char.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 * index }} whileHover={{ y: -10, transition: { duration: 0.2 } }} onClick={() => setSelectedCharacter(char)} className={`relative cursor-pointer rounded-xl p-6 transition-all duration-300 ${selectedCharacter?.id === char.id ? 'bg-gradient-to-br from-yellow-400 to-amber-500 shadow-2xl scale-105' : 'bg-gradient-to-br from-purple-600 to-indigo-700 hover:shadow-xl'}`}>
                  {selectedCharacter?.id === char.id && <div className="absolute -top-2 -right-2 bg-yellow-300 text-gray-900 px-2 py-1 rounded-full text-xs font-bold animate-bounce">⭐ SELECTED</div>}
                  <div className="text-5xl mb-3 transform transition-transform duration-300 hover:scale-110">{char.emoji}</div>
                  <h3 className="text-xl font-bold text-white mb-2" style={{ fontWeight: 600 }}>{char.title}</h3>
                  <p className="text-sm text-gray-100 opacity-90">{char.power}</p>
                </motion.div>
              ))}</div>
            </motion.div>

            <motion.div className="text-center" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.6 }}>
              <div className="bg-gradient-to-b from-red-700 to-red-900 p-8 rounded-t-3xl max-w-2xl mx-auto shadow-2xl">
                <div className="bg-yellow-400 text-gray-900 px-6 py-3 rounded-lg inline-block -mt-12 mb-6 shadow-xl" style={{ fontFamily: "'Bungee', cursive" }}>
                  <h3 className="text-2xl font-bold">🎟️ ADMISSION 🎟️</h3>
                </div>

                <div className="flex flex-col sm:flex-row gap-4 justify-center mb-6">
                  <motion.button whileHover={{ scale: 1.05, rotate: -1 }} whileTap={{ scale: 0.95 }} className="relative bg-gradient-to-br from-yellow-400 to-yellow-500 text-gray-900 px-8 py-4 rounded-lg font-bold text-lg shadow-lg transform transition-all duration-200 hover:shadow-xl" onClick={() => navigate('/signup')} style={{ fontWeight: 700 }}>
                    <div className="absolute top-2 right-3 text-xs opacity-50 font-mono">No. {Math.floor(Math.random() * 9999)}</div>
                    <div>Join the Show</div>
                    <div className="text-sm font-normal">Create Account</div>
                  </motion.button>

                  <motion.button whileHover={{ scale: 1.05, rotate: 1 }} whileTap={{ scale: 0.95 }} className="relative bg-gradient-to-br from-purple-300 to-purple-400 text-gray-900 px-8 py-4 rounded-lg font-bold text-lg shadow-lg transform transition-all duration-200 hover:shadow-xl" onClick={() => navigate('/login')} style={{ fontWeight: 700 }}>
                    <div className="absolute top-2 right-3 text-xs opacity-50 font-mono">No. {Math.floor(Math.random() * 9999)}</div>
                    <div>Return Visit</div>
                    <div className="text-sm font-normal">Sign In</div>
                  </motion.button>
                </div>

                <div className="flex items-center justify-center gap-4">
                  <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} className="border-2 border-gray-100 text-gray-100 px-6 py-3 rounded-full font-semibold hover:bg-gray-100 hover:text-red-700 transition-all duration-200" onClick={() => {
                    // Enter the show (mark visited)
                    localStorage.setItem('circus_visited', 'true')
                    try { sounds.drumroll.stop() } catch (e) { console.debug('stop failed', e) }
                    navigate('/home')
                  }}>
                    ✨ Enter the Show (Demo) ✨
                  </motion.button>

                  <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gray-800 text-white" onClick={() => {
                    const next = !muted
                    setMuted(next)
                    localStorage.setItem('circus_muted', next ? 'true' : 'false')
                    if (next) {
                      try { sounds.drumroll.stop() } catch (e) { console.debug('stop failed', e) }
                    } else {
                      try { sounds.drumroll.play() } catch (e) { console.debug('play failed', e) }
                    }
                  }}>
                    {muted ? 'Unmute' : 'Mute'}
                  </motion.button>
                </div>
              </div>
            </motion.div>

            <div className="fixed bottom-10 left-10 text-5xl animate-float pointer-events-none">🎈</div>
            <div className="fixed top-1/3 right-10 text-5xl animate-float-delay pointer-events-none">🎈</div>
          </motion.div>
        )}
      </AnimatePresence>

      <style>{`@keyframes shimmer { 0%,100% { background-position: 0% 50%; } 50% { background-position: 100% 50%; } }
        @keyframes float { 0%,100% { transform: translateY(0px); } 50% { transform: translateY(-20px); } }
        @keyframes float-delayed { 0%,100% { transform: translateY(0px); } 50% { transform: translateY(-30px); } }
        .animate-shimmer { background-size: 200% 200%; animation: shimmer 3s ease-in-out infinite; }
        .animate-float { animation: float 6s ease-in-out infinite; }
        .animate-float-delay { animation: float-delayed 8s ease-in-out infinite; }
        .magical-glow { box-shadow: 0 0 60px rgba(168,85,247,0.4), inset 0 0 60px rgba(168,85,247,0.1); }`}</style>
    </div>
  )
}

export default CircusLandingPage