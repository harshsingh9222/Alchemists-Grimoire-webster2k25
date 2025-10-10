import React, { useState } from 'react';
import { Sparkles, Star, Moon, Sun } from 'lucide-react';

// ============================================
// THEME CONSTANTS
// ============================================
export const magicalTheme = {
  colors: {
    primary: 'purple',
    secondary: 'pink',
    accent: 'yellow',
    gradients: {
      primary: 'from-purple-500 to-pink-500',
      secondary: 'from-purple-300 to-pink-300',
      accent: 'from-yellow-300 to-orange-300',
      background: 'from-purple-950 via-indigo-950 to-purple-900',
      card: 'from-purple-950/90 via-purple-900/80 to-indigo-950/90'
    }
  },
  animations: {
    float: 'animate-float',
    pulse: 'animate-pulse',
    spin: 'animate-spin',
    bounce: 'animate-bounce'
  }
};

// ============================================
// MAGICAL BACKGROUND COMPONENT
// ============================================
export const MagicalBackground = ({ particleCount = 5 }) => {
  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none">
      {/* Floating orbs */}
      {[...Array(particleCount)].map((_, i) => (
        <div
          key={i}
          className="absolute animate-float"
          style={{
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
            animationDelay: `${i * 2}s`,
            animationDuration: `${15 + i * 5}s`
          }}
        >
          <div className="w-64 h-64 bg-purple-500/10 rounded-full blur-3xl" />
        </div>
      ))}
      
      {/* Sparkles */}
      {[...Array(10)].map((_, i) => (
        <div
          key={`sparkle-${i}`}
          className="absolute animate-pulse"
          style={{
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
            animationDelay: `${Math.random() * 5}s`
          }}
        >
          <Sparkles className="w-2 h-2 text-yellow-300/30" />
        </div>
      ))}
    </div>
  );
};

// ============================================
// MAGICAL CARD COMPONENT
// ============================================
export const MagicalCard = ({ 
  children, 
  className = "", 
  glowColor = "purple", 
  title, 
  icon: Icon,
  hoverable = true,
  sparkles = true
}) => {
  const [isHovered, setIsHovered] = useState(false);
  
  return (
    <div 
      className={`relative group ${className}`}
      onMouseEnter={() => hoverable && setIsHovered(true)}
      onMouseLeave={() => hoverable && setIsHovered(false)}
    >
      {/* Magical glow effect */}
      {hoverable && (
        <div className={`absolute inset-0 bg-gradient-to-r from-${glowColor}-500/20 to-pink-500/20 rounded-2xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500`} />
      )}
      
      {/* Card content */}
      <div className="relative bg-gradient-to-br from-purple-950/90 via-purple-900/80 to-indigo-950/90 backdrop-blur-sm rounded-2xl border border-purple-500/30 overflow-hidden">
        {/* Animated sparkles background */}
        {sparkles && (
          <div className="absolute inset-0 opacity-30">
            {[...Array(3)].map((_, i) => (
              <div
                key={i}
                className="absolute animate-pulse"
                style={{
                  left: `${20 + i * 30}%`,
                  top: `${10 + i * 25}%`,
                  animation: `float ${3 + i}s ease-in-out infinite`
                }}
              >
                <Sparkles className="w-4 h-4 text-yellow-300" />
              </div>
            ))}
          </div>
        )}
        
        {/* Header */}
        {(title || Icon) && (
          <div className="relative p-4 border-b border-purple-500/20">
            <div className="flex items-center gap-3">
              {Icon && (
                <div className="p-2 bg-gradient-to-br from-purple-500/30 to-pink-500/30 rounded-lg">
                  <Icon className="w-5 h-5 text-purple-300" />
                </div>
              )}
              {title && (
                <h3 className="text-lg font-bold bg-gradient-to-r from-purple-300 to-pink-300 bg-clip-text text-transparent">
                  {title}
                </h3>
              )}
            </div>
          </div>
        )}
        
        {/* Content */}
        <div className="relative p-4">
          {children}
        </div>
      </div>
    </div>
  );
};

// ============================================
// MAGICAL BUTTON COMPONENT
// ============================================
export const MagicalButton = ({ 
  children, 
  onClick, 
  variant = 'primary', 
  size = 'medium',
  icon: Icon,
  className = "",
  disabled = false,
  sparkle = true
}) => {
  const [isClicked, setIsClicked] = useState(false);
  
  const variants = {
    primary: 'bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white',
    secondary: 'bg-purple-900/50 hover:bg-purple-800/50 text-purple-300',
    ghost: 'bg-transparent hover:bg-purple-900/20 text-purple-300',
    danger: 'bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600 text-white',
    success: 'bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white'
  };
  
  const sizes = {
    small: 'px-3 py-1 text-sm',
    medium: 'px-4 py-2',
    large: 'px-6 py-3 text-lg'
  };
  
  const handleClick = (e) => {
    if (!disabled) {
      setIsClicked(true);
      setTimeout(() => setIsClicked(false), 400);
      onClick && onClick(e);
    }
  };
  
  return (
    <button
      onClick={handleClick}
      disabled={disabled}
      className={`
        relative overflow-hidden font-semibold rounded-lg transition-all duration-300
        ${variants[variant]} ${sizes[size]} ${className}
        ${disabled ? 'opacity-50 cursor-not-allowed' : 'transform hover:scale-105 active:scale-95'}
      `}
    >
      {/* Sparkle effect on click */}
      {sparkle && isClicked && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="absolute animate-ping">
            <Sparkles className="w-6 h-6 text-yellow-300" />
          </div>
        </div>
      )}
      
      {/* Button content */}
      <div className="flex items-center gap-2 justify-center">
        {Icon && <Icon className="w-4 h-4" />}
        {children}
      </div>
      
      {/* Shimmer effect */}
      <div className="absolute inset-0 -top-1 -bottom-1 bg-gradient-to-r from-transparent via-white/10 to-transparent -skew-x-12 transform translate-x-[-200%] group-hover:translate-x-[200%] transition-transform duration-1000" />
    </button>
  );
};

// ============================================
// STATS ORB COMPONENT
// ============================================
export const StatsOrb = ({ value, label, icon: Icon, color = 'purple', trend }) => {
  return (
    <div className="relative group cursor-pointer">
      {/* Floating animation */}
      <div className="transform transition-all duration-300 group-hover:-translate-y-2">
        {/* Outer glow ring */}
        <div className={`absolute inset-0 bg-gradient-to-r from-${color}-500 to-${color}-600 rounded-full blur-2xl opacity-50 group-hover:opacity-75 transition-opacity`} />
        
        {/* Main orb */}
        <div className={`relative bg-gradient-to-br from-${color}-900/80 to-purple-950/90 backdrop-blur-sm rounded-full p-6 border-2 border-${color}-500/50`}>
          {/* Icon */}
          <div className="flex justify-center mb-2">
            {Icon && <Icon className={`w-8 h-8 text-${color}-400`} />}
          </div>
          
          {/* Value */}
          <div className={`text-3xl font-bold text-center bg-gradient-to-r from-${color}-300 to-${color}-100 bg-clip-text text-transparent`}>
            {value}
          </div>
          
          {/* Label */}
          <div className="text-xs text-center text-purple-300/70 mt-1">
            {label}
          </div>
          
          {/* Trend indicator */}
          {trend && (
            <div className={`absolute -top-2 -right-2 px-2 py-1 bg-${trend > 0 ? 'green' : 'red'}-500 rounded-full text-xs text-white font-bold`}>
              {trend > 0 ? '+' : ''}{trend}%
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// ============================================
// MAGICAL PROGRESS RING
// ============================================
export const MagicalProgressRing = ({ percentage, size = 120, strokeWidth = 8, label = "Progress" }) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (percentage / 100) * circumference;
  
  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg className="transform -rotate-90" width={size} height={size}>
        {/* Background circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="rgba(139, 92, 246, 0.2)"
          strokeWidth={strokeWidth}
          fill="none"
        />
        
        {/* Progress circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="url(#progress-gradient)"
          strokeWidth={strokeWidth}
          fill="none"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className="transition-all duration-500"
        />
        
        {/* Gradient definition */}
        <defs>
          <linearGradient id="progress-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#a78bfa" />
            <stop offset="50%" stopColor="#ec4899" />
            <stop offset="100%" stopColor="#f59e0b" />
          </linearGradient>
        </defs>
      </svg>
      
      {/* Center content */}
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <div className="text-3xl font-bold bg-gradient-to-r from-purple-300 to-pink-300 bg-clip-text text-transparent">
          {percentage}%
        </div>
        <div className="text-xs text-purple-400">{label}</div>
      </div>
    </div>
  );
};

// ============================================
// MAGICAL INPUT COMPONENT
// ============================================
export const MagicalInput = ({ 
  label, 
  type = 'text', 
  value, 
  onChange, 
  placeholder, 
  icon: Icon,
  error,
  className = ""
}) => {
  const [isFocused, setIsFocused] = useState(false);
  
  return (
    <div className={`relative ${className}`}>
      {label && (
        <label className="block text-purple-300 text-sm font-medium mb-2">
          {label}
        </label>
      )}
      
      <div className={`relative group ${isFocused ? 'scale-[1.02]' : ''} transition-transform`}>
        {/* Glow effect */}
        <div className={`absolute inset-0 bg-gradient-to-r from-purple-500/20 to-pink-500/20 rounded-lg blur-md opacity-0 ${isFocused ? 'opacity-100' : ''} transition-opacity`} />
        
        {/* Input container */}
        <div className="relative">
          {Icon && (
            <div className="absolute left-3 top-1/2 -translate-y-1/2">
              <Icon className="w-5 h-5 text-purple-400" />
            </div>
          )}
          
          <input
            type={type}
            value={value}
            onChange={onChange}
            placeholder={placeholder}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            className={`
              w-full px-4 py-3 ${Icon ? 'pl-12' : ''} 
              bg-purple-950/50 backdrop-blur-sm
              border border-purple-500/30 rounded-lg
              text-purple-100 placeholder-purple-400/50
              focus:outline-none focus:border-purple-400
              transition-all duration-300
            `}
          />
        </div>
      </div>
      
      {error && (
        <p className="mt-1 text-red-400 text-sm">{error}</p>
      )}
    </div>
  );
};

// ============================================
// NOTIFICATION TOAST COMPONENT
// ============================================
export const MagicalToast = ({ message, type = 'info', icon: CustomIcon }) => {
  const types = {
    success: {
      bg: 'from-green-900/90 to-emerald-900/90',
      border: 'border-green-500/30',
      text: 'text-green-300',
      icon: Star
    },
    error: {
      bg: 'from-red-900/90 to-pink-900/90',
      border: 'border-red-500/30',
      text: 'text-red-300',
      icon: Moon
    },
    warning: {
      bg: 'from-yellow-900/90 to-amber-900/90',
      border: 'border-yellow-500/30',
      text: 'text-yellow-300',
      icon: Sun
    },
    info: {
      bg: 'from-purple-900/90 to-indigo-900/90',
      border: 'border-purple-500/30',
      text: 'text-purple-300',
      icon: Sparkles
    }
  };
  
  const config = types[type];
  const Icon = CustomIcon || config.icon;
  
  return (
    <div className={`relative overflow-hidden bg-gradient-to-r ${config.bg} backdrop-blur-sm rounded-lg border ${config.border} p-4 shadow-2xl`}>
      {/* Sparkle animation */}
      <div className="absolute top-2 right-2 animate-pulse">
        <Sparkles className="w-3 h-3 text-yellow-300/50" />
      </div>
      
      <div className="flex items-center gap-3">
        <div className="p-2 bg-white/10 rounded-lg">
          <Icon className={`w-5 h-5 ${config.text}`} />
        </div>
        <p className={`${config.text} font-medium`}>{message}</p>
      </div>
    </div>
  );
};

// ============================================
// MAGICAL LOADER COMPONENT
// ============================================
export const MagicalLoader = ({ size = 'medium', text = 'Brewing magic...' }) => {
  const sizes = {
    small: 'w-8 h-8',
    medium: 'w-12 h-12',
    large: 'w-16 h-16'
  };
  
  return (
    <div className="flex flex-col items-center gap-4">
      <div className="relative">
        <div className={`${sizes[size]} rounded-full border-4 border-purple-500/20 border-t-purple-500 animate-spin`} />
        <div className="absolute inset-0 flex items-center justify-center">
          <Sparkles className="w-4 h-4 text-yellow-300 animate-pulse" />
        </div>
      </div>
      {text && (
        <p className="text-purple-300 text-sm animate-pulse">{text}</p>
      )}
    </div>
  );
};

// ============================================
// EXPORT ALL COMPONENTS
// ============================================
const MagicalComponents = {
  MagicalBackground,
  MagicalCard,
  MagicalButton,
  StatsOrb,
  MagicalProgressRing,
  MagicalInput,
  MagicalToast,
  MagicalLoader,
  magicalTheme
};

// Demo component to showcase all components
const ComponentShowcase = () => {
  const [inputValue, setInputValue] = useState('');
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-950 via-indigo-950 to-purple-900 p-8">
      <MagicalBackground />
      
      <div className="relative z-10 max-w-6xl mx-auto space-y-8">
        <h1 className="text-4xl font-bold text-center mb-12">
          <span className="bg-gradient-to-r from-purple-300 via-pink-300 to-yellow-300 bg-clip-text text-transparent">
            Magical Component Library
          </span>
        </h1>
        
        {/* Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <MagicalCard title="Sample Card" icon={Sparkles}>
            <p className="text-purple-300">This is a magical card component with sparkles and glow effects.</p>
          </MagicalCard>
          
          <MagicalCard title="Stats Display">
            <StatsOrb value="95%" label="Success Rate" icon={Star} color="yellow" trend={12} />
          </MagicalCard>
        </div>
        
        {/* Buttons */}
        <MagicalCard title="Button Variants">
          <div className="flex flex-wrap gap-4">
            <MagicalButton variant="primary" icon={Star}>Primary</MagicalButton>
            <MagicalButton variant="secondary">Secondary</MagicalButton>
            <MagicalButton variant="ghost">Ghost</MagicalButton>
            <MagicalButton variant="success">Success</MagicalButton>
            <MagicalButton variant="danger">Danger</MagicalButton>
          </div>
        </MagicalCard>
        
        {/* Input */}
        <MagicalCard title="Form Elements">
          <MagicalInput 
            label="Potion Name"
            placeholder="Enter your magical potion..."
            icon={Sparkles}
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
          />
        </MagicalCard>
        
        {/* Progress Ring */}
        <MagicalCard title="Progress Indicator">
          <div className="flex justify-center">
            <MagicalProgressRing percentage={75} label="Wellness" />
          </div>
        </MagicalCard>
        
        {/* Toasts */}
        <MagicalCard title="Notification Styles">
          <div className="space-y-4">
            <MagicalToast message="Success! Your potion has been created." type="success" />
            <MagicalToast message="Warning: Low potion supplies detected." type="warning" />
            <MagicalToast message="Error: Failed to brew the elixir." type="error" />
            <MagicalToast message="Info: New magical recipe available." type="info" />
          </div>
        </MagicalCard>
        
        {/* Loader */}
        <MagicalCard title="Loading States">
          <div className="flex justify-around items-center">
            <MagicalLoader size="small" text="Small" />
            <MagicalLoader size="medium" />
            <MagicalLoader size="large" text="Conjuring..." />
          </div>
        </MagicalCard>
      </div>
    </div>
  );
};

export default ComponentShowcase;