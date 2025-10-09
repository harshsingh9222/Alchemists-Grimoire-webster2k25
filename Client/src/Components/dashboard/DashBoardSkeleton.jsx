import React from 'react';
import { Sparkles, Beaker } from 'lucide-react';

const DashboardSkeleton = () => {
  const SkeletonCard = ({ className = "" }) => (
    <div className={`bg-white rounded-2xl p-6 shadow-lg border border-gray-200 animate-pulse ${className}`}>
      <div className="space-y-3">
        <div className="flex items-center gap-3">
          <div className="w-6 h-6 bg-gray-300 rounded"></div>
          <div className="w-32 h-5 bg-gray-300 rounded"></div>
        </div>
        <div className="w-full h-4 bg-gray-200 rounded"></div>
        <div className="w-3/4 h-4 bg-gray-200 rounded"></div>
        <div className="w-1/2 h-4 bg-gray-200 rounded"></div>
      </div>
    </div>
  );

  const SkeletonChart = ({ className = "" }) => (
    <div className={`bg-white rounded-2xl p-6 shadow-lg border border-gray-200 animate-pulse ${className}`}>
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-6 h-6 bg-gray-300 rounded"></div>
          <div className="w-40 h-5 bg-gray-300 rounded"></div>
        </div>
        <div className="w-full h-64 bg-gray-100 rounded-xl"></div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-white to-orange-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8 text-center">
          <div className="flex items-center justify-center gap-3 mb-4">
            <Beaker className="w-8 h-8 text-amber-600 animate-pulse" />
            <h1 className="text-3xl font-bold bg-gradient-to-r from-amber-600 to-orange-600 bg-clip-text text-transparent">
              Alchemist Dashboard
            </h1>
            <Sparkles className="w-8 h-8 text-amber-600 animate-pulse" />
          </div>
          <p className="text-gray-600">Loading your alchemical data...</p>
        </div>

        {/* Stats Overview Skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          {[1, 2, 3, 4].map((i) => (
            <SkeletonCard key={i} />
          ))}
        </div>

        {/* Charts Section Skeleton */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <SkeletonChart />
          <SkeletonChart />
        </div>

        {/* Bottom Section Skeleton */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <SkeletonCard />
          <SkeletonCard />
        </div>
      </div>
    </div>
  );
};

const LoadingSpinner = ({ size = 'medium', color = 'amber' }) => {
  const sizeClasses = {
    small: 'w-4 h-4',
    medium: 'w-8 h-8',
    large: 'w-12 h-12'
  };

  const colorClasses = {
    amber: 'text-amber-600',
    purple: 'text-purple-600',
    green: 'text-green-600',
    blue: 'text-blue-600'
  };

  return (
    <div className="flex items-center justify-center">
      <Sparkles className={`${sizeClasses[size]} ${colorClasses[color]} animate-spin`} />
    </div>
  );
};

const ErrorState = ({ title = "Something went wrong", message, onRetry }) => (
  <div className="text-center py-8">
    <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-100 flex items-center justify-center">
      <svg className="w-8 h-8 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    </div>
    <h3 className="text-lg font-semibold text-gray-800 mb-2">{title}</h3>
    {message && <p className="text-gray-600 mb-4">{message}</p>}
    {onRetry && (
      <button
        onClick={onRetry}
        className="px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors"
      >
        Try Again
      </button>
    )}
  </div>
);

export { DashboardSkeleton, LoadingSpinner, ErrorState };
export default DashboardSkeleton;