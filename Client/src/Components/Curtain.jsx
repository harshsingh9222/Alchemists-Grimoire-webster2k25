import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useLocation } from 'react-router-dom'

export default function Curtain() {
  const location = useLocation()
  const prevPathRef = useRef(location.pathname)
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    if (prevPathRef.current !== location.pathname) {
      // show the loader (closed curtains), play the open animation and hide
      setIsVisible(true)
      // after total animation time hide the curtain
      const total = 1800 // matches the earlier durations (1500 + delays)
      const t = setTimeout(() => setIsVisible(false), total)
      prevPathRef.current = location.pathname
      return () => clearTimeout(t)
    }
    // ensure we track the path even when unchanged
    prevPathRef.current = location.pathname
  }, [location.pathname])

  const CurtainLoader = () => {
    const stripe = 24

    const leftCurtainBG = `linear-gradient(to right, rgba(0,0,0,0.35), rgba(0,0,0,0.15)), repeating-linear-gradient(90deg, #7f1d1d 0px, #7f1d1d ${stripe}px, #991b1b ${stripe}px, #991b1b ${stripe * 2}px)`

    const rightCurtainBG = `linear-gradient(to left, rgba(0,0,0,0.35), rgba(0,0,0,0.15)), repeating-linear-gradient(90deg, #7f1d1d 0px, #7f1d1d ${stripe}px, #991b1b ${stripe}px, #991b1b ${stripe * 2}px)`

    return (
      // very high z-index so the curtain overlays Navbar/Sidebar and any other UI
      <motion.div className="fixed inset-0 z-[99999] flex items-center justify-center overflow-hidden bg-slate-900 pointer-events-none">
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
          transition={{ duration: 1.0, ease: 'easeInOut', delay: 0.25 }}
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
          transition={{ duration: 1.0, ease: 'easeInOut', delay: 0.25 }}
        />

        <motion.div className="relative z-10 text-center" initial={{ opacity: 1, scale: 1 }} animate={{ opacity: 0, scale: 1.5 }} transition={{ duration: 0.75, delay: 0.75 }}>
          <h1 className="text-5xl md:text-6xl font-bold text-yellow-400 drop-shadow-lg" style={{ fontFamily: "'Bungee', cursive" }}>
            🎪 Step Right Up! 🎪
          </h1>
        </motion.div>
      </motion.div>
    )
  }

  // Render via portal so the curtain is appended to document.body and
  // guaranteed to sit above other stacking contexts (Navbar/Sidebar etc).
  if (typeof document === 'undefined') {
    return <AnimatePresence>{isVisible && <CurtainLoader />}</AnimatePresence>
  }

  return createPortal(
    <AnimatePresence>{isVisible && <CurtainLoader />}</AnimatePresence>,
    document.body
  )
}
