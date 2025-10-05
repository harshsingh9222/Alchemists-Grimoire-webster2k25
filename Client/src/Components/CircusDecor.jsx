import React from 'react';
import PropTypes from 'prop-types';


const CircusDecor = ({ children, className = '' }) => {
  return (
    <div className={`relative overflow-hidden ${className}`} style={{ fontFamily: "'Fredoka', sans-serif" }}>
      {/* Striped Background */}
      <div
        className="absolute inset-0 opacity-10 pointer-events-none"
        style={{
          backgroundImage: `repeating-linear-gradient(45deg, #FF6B6B, #FF6B6B 40px, #FFF8E1 40px, #FFF8E1 80px)`,
          animation: 'slideSmooth 30s linear infinite',
          willChange: 'transform',
        }}
      />

      {/* Floating Icons */}
      <div className="absolute bottom-10 left-10 text-5xl animate-float pointer-events-none">🎈</div>
      <div className="absolute top-1/3 right-10 text-5xl animate-float-delay pointer-events-none">🎡</div>

      {/* Content */}
      <div className="relative z-10">{children}</div>

      {/* Keyframes for animations */}
      <style>{`
        @keyframes slideSmooth {
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
        .animate-float { animation: float 6s ease-in-out infinite; }
        .animate-float-delay { animation: float-delayed 8s ease-in-out infinite; }
      `}</style>
    </div>
  );
};

CircusDecor.propTypes = {
  children: PropTypes.node,
  className: PropTypes.string,
};

export default CircusDecor;
