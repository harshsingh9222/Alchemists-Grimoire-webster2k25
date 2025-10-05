import React, { useState, useEffect } from 'react';
import { 
  Sparkles, 
  Beaker, 
  Clock, 
  TrendingUp, 
  AlertCircle,
  Calendar,
  Activity,
  Star,
  Moon,
  Sun,
  Zap,
  Heart,
  Shield,
  Award,
  Target,
  CheckCircle,
  XCircle,
  Pill
} from 'lucide-react';
import { 
  LineChart, 
  Line, 
  BarChart, 
  Bar,
  RadarChart,
  Radar,
  PieChart, 
  Pie, 
  Cell,
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend,
  ResponsiveContainer,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis
} from 'recharts';

// Reusable Magical Card Component
const MagicalCard = ({ children, className = "", glowColor = "purple", title, icon: Icon }) => {
  const [isHovered, setIsHovered] = useState(false);
  
  return (
    <div 
      className={`relative group ${className}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Magical glow effect */}
      <div className={`absolute inset-0 bg-gradient-to-r from-${glowColor}-500/20 to-pink-500/20 rounded-2xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500`} />
      
      {/* Card content */}
      <div className="relative bg-gradient-to-br from-purple-950/90 via-purple-900/80 to-indigo-950/90 backdrop-blur-sm rounded-2xl border border-purple-500/30 overflow-hidden">
        {/* Animated sparkles background */}
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

// Reusable Stats Orb Component
const StatsOrb = ({ value, label, icon: Icon, color, trend }) => {
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

// Magical Progress Ring
const MagicalProgressRing = ({ percentage, size = 120, strokeWidth = 8 }) => {
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
          stroke="url(#gradient)"
          strokeWidth={strokeWidth}
          fill="none"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className="transition-all duration-500"
        />
        
        {/* Gradient definition */}
        <defs>
          <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
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
        <div className="text-xs text-purple-400">Wellness</div>
      </div>
    </div>
  );
};

// Main Dashboard Component
const AlchemistDashboard = () => {
  const [selectedTimeRange, setSelectedTimeRange] = useState('week');
  const [activePotion, setActivePotion] = useState(null);
  
  // Sample data - replace with actual API calls
  const adherenceData = [
    { day: 'Mon', taken: 85, missed: 15 },
    { day: 'Tue', taken: 92, missed: 8 },
    { day: 'Wed', taken: 78, missed: 22 },
    { day: 'Thu', taken: 95, missed: 5 },
    { day: 'Fri', taken: 88, missed: 12 },
    { day: 'Sat', taken: 90, missed: 10 },
    { day: 'Sun', taken: 82, missed: 18 },
  ];
  
  const potionEffectiveness = [
    { potion: 'Morning Elixir', effectiveness: 95, time: 'morning' },
    { potion: 'Noon Tonic', effectiveness: 88, time: 'noon' },
    { potion: 'Evening Draft', effectiveness: 92, time: 'evening' },
    { potion: 'Night Serum', effectiveness: 78, time: 'night' },
  ];
  
  const wellnessRadar = [
    { aspect: 'Energy', score: 85, fullMark: 100 },
    { aspect: 'Focus', score: 92, fullMark: 100 },
    { aspect: 'Mood', score: 78, fullMark: 100 },
    { aspect: 'Sleep', score: 88, fullMark: 100 },
    { aspect: 'Vitality', score: 90, fullMark: 100 },
    { aspect: 'Balance', score: 75, fullMark: 100 },
  ];
  
  const upcomingDoses = [
    { id: 1, name: 'Morning Elixir', time: '8:00 AM', icon: Sun, color: 'yellow' },
    { id: 2, name: 'Focus Potion', time: '12:00 PM', icon: Zap, color: 'blue' },
    { id: 3, name: 'Evening Draft', time: '6:00 PM', icon: Moon, color: 'indigo' },
  ];
  
  const pieData = [
    { name: 'Taken', value: 87, color: '#a78bfa' },
    { name: 'Missed', value: 13, color: '#ec4899' },
  ];
  
  // Custom tooltip for charts
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-purple-950/95 backdrop-blur-sm border border-purple-500/30 rounded-lg p-3">
          <p className="text-purple-300 font-semibold">{label}</p>
          {payload.map((entry, index) => (
            <p key={index} className="text-sm" style={{ color: entry.color }}>
              {entry.name}: {entry.value}%
            </p>
          ))}
        </div>
      );
    }
    return null;
  };
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-950 via-indigo-950 to-purple-900 p-6">
      {/* Animated background elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        {[...Array(5)].map((_, i) => (
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
      </div>
      
      {/* Main Content */}
      <div className="relative z-10 max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">
            <span className="bg-gradient-to-r from-purple-300 via-pink-300 to-yellow-300 bg-clip-text text-transparent">
              Your Mystical Wellness Journey
            </span>
          </h1>
          <p className="text-purple-300/70">Track your alchemical potions and enhance your vitality</p>
        </div>
        
        {/* Time Range Selector */}
        <div className="flex gap-2 mb-6">
          {['day', 'week', 'month'].map(range => (
            <button
              key={range}
              onClick={() => setSelectedTimeRange(range)}
              className={`px-4 py-2 rounded-lg font-semibold transition-all ${
                selectedTimeRange === range
                  ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white'
                  : 'bg-purple-900/50 text-purple-300 hover:bg-purple-800/50'
              }`}
            >
              {range.charAt(0).toUpperCase() + range.slice(1)}
            </button>
          ))}
        </div>
        
        {/* Stats Orbs Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatsOrb value="87%" label="Adherence Rate" icon={Target} color="purple" trend={5} />
          <StatsOrb value="23" label="Active Potions" icon={Beaker} color="pink" trend={-2} />
          <StatsOrb value="156" label="Doses Taken" icon={CheckCircle} color="green" />
          <StatsOrb value="4.8" label="Wellness Score" icon={Star} color="yellow" trend={8} />
        </div>
        
        {/* Main Dashboard Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Adherence Chart */}
          <MagicalCard className="lg:col-span-2" title="Potion Adherence Pattern" icon={Activity}>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={adherenceData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(139, 92, 246, 0.1)" />
                <XAxis dataKey="day" stroke="#a78bfa" />
                <YAxis stroke="#a78bfa" />
                <Tooltip content={<CustomTooltip />} />
                <Legend />
                <Bar dataKey="taken" fill="url(#takenGradient)" radius={[8, 8, 0, 0]} />
                <Bar dataKey="missed" fill="url(#missedGradient)" radius={[8, 8, 0, 0]} />
                <defs>
                  <linearGradient id="takenGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#a78bfa" />
                    <stop offset="100%" stopColor="#6d28d9" />
                  </linearGradient>
                  <linearGradient id="missedGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#ec4899" />
                    <stop offset="100%" stopColor="#be185d" />
                  </linearGradient>
                </defs>
              </BarChart>
            </ResponsiveContainer>
          </MagicalCard>
          
          {/* Wellness Score */}
          <MagicalCard title="Mystical Wellness" icon={Heart}>
            <div className="flex flex-col items-center py-4">
              <MagicalProgressRing percentage={87} />
              <div className="mt-4 text-center">
                <p className="text-purple-300/70 text-sm">Your potions are working!</p>
                <p className="text-xs text-purple-400/50 mt-1">+5% from last week</p>
              </div>
            </div>
          </MagicalCard>
          
          {/* Upcoming Doses */}
          <MagicalCard title="Upcoming Potions" icon={Clock}>
            <div className="space-y-3">
              {upcomingDoses.map(dose => {
                const Icon = dose.icon;
                return (
                  <div
                    key={dose.id}
                    className="flex items-center justify-between p-3 bg-purple-900/30 rounded-lg hover:bg-purple-900/50 transition-colors cursor-pointer"
                  >
                    <div className="flex items-center gap-3">
                      <div className={`p-2 bg-${dose.color}-500/20 rounded-lg`}>
                        <Icon className={`w-4 h-4 text-${dose.color}-400`} />
                      </div>
                      <div>
                        <p className="text-purple-200 font-medium text-sm">{dose.name}</p>
                        <p className="text-purple-400/60 text-xs">{dose.time}</p>
                      </div>
                    </div>
                    <button className="px-3 py-1 bg-purple-500/20 hover:bg-purple-500/30 rounded-lg text-purple-300 text-xs font-medium transition-colors">
                      Take
                    </button>
                  </div>
                );
              })}
            </div>
          </MagicalCard>
          
          {/* Wellness Radar */}
          <MagicalCard title="Vitality Matrix" icon={Shield}>
            <ResponsiveContainer width="100%" height={250}>
              <RadarChart data={wellnessRadar}>
                <PolarGrid stroke="rgba(139, 92, 246, 0.2)" />
                <PolarAngleAxis dataKey="aspect" stroke="#a78bfa" />
                <PolarRadiusAxis angle={90} domain={[0, 100]} stroke="#a78bfa" />
                <Radar
                  name="Wellness"
                  dataKey="score"
                  stroke="#ec4899"
                  fill="url(#radarGradient)"
                  fillOpacity={0.6}
                />
                <defs>
                  <linearGradient id="radarGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#a78bfa" stopOpacity={0.8} />
                    <stop offset="100%" stopColor="#ec4899" stopOpacity={0.4} />
                  </linearGradient>
                </defs>
              </RadarChart>
            </ResponsiveContainer>
          </MagicalCard>
          
          {/* Potion Effectiveness */}
          <MagicalCard title="Potion Potency" icon={Zap}>
            <div className="space-y-3">
              {potionEffectiveness.map((potion, index) => (
                <div key={index} className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-purple-300">{potion.potion}</span>
                    <span className="text-purple-400">{potion.effectiveness}%</span>
                  </div>
                  <div className="w-full bg-purple-900/30 rounded-full h-2 overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-purple-500 to-pink-500 rounded-full transition-all duration-500"
                      style={{ width: `${potion.effectiveness}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </MagicalCard>
          
          {/* Recent Activity */}
          <MagicalCard className="lg:col-span-2" title="Alchemical Insights" icon={Award}>
            <div className="space-y-3">
              <div className="p-4 bg-gradient-to-r from-green-900/30 to-emerald-900/30 rounded-lg border border-green-500/20">
                <div className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-green-400 mt-1" />
                  <div>
                    <p className="text-green-300 font-medium">Excellent Morning Routine!</p>
                    <p className="text-green-400/70 text-sm mt-1">
                      You've taken your morning elixir consistently for 7 days. Your energy levels show a 15% improvement!
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="p-4 bg-gradient-to-r from-yellow-900/30 to-amber-900/30 rounded-lg border border-yellow-500/20">
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-yellow-400 mt-1" />
                  <div>
                    <p className="text-yellow-300 font-medium">Pattern Detected</p>
                    <p className="text-yellow-400/70 text-sm mt-1">
                      Evening doses are frequently missed on weekends. Consider setting a special reminder!
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="p-4 bg-gradient-to-r from-purple-900/30 to-indigo-900/30 rounded-lg border border-purple-500/20">
                <div className="flex items-start gap-3">
                  <Sparkles className="w-5 h-5 text-purple-400 mt-1" />
                  <div>
                    <p className="text-purple-300 font-medium">New Achievement Unlocked!</p>
                    <p className="text-purple-400/70 text-sm mt-1">
                      "Consistency Conjurer" - Maintained 85%+ adherence for 2 weeks straight!
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </MagicalCard>
          
          {/* Pie Chart */}
          <MagicalCard title="This Week's Balance" icon={Pill}>
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
            <div className="flex justify-center gap-6 mt-4">
              {pieData.map((entry, index) => (
                <div key={index} className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: entry.color }} />
                  <span className="text-purple-300 text-sm">{entry.name}: {entry.value}%</span>
                </div>
              ))}
            </div>
          </MagicalCard>
        </div>
      </div>
      
      {/* CSS for custom animations */}
      <style jsx>{`
        @keyframes float {
          0%, 100% { transform: translateY(0) rotate(0deg); }
          33% { transform: translateY(-20px) rotate(120deg); }
          66% { transform: translateY(-10px) rotate(240deg); }
        }
      `}</style>
    </div>
  );
};

export default AlchemistDashboard;