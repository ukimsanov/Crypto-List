import React from 'react';
import { Card } from 'antd';

/**
 * Skeleton loader for cryptocurrency card
 * Displays a loading placeholder while data is being fetched
 */
function SkeletonCard() {
  return (
    <Card
      className="crypto-card animate-fade-in"
      headStyle={{
        padding: '20px 24px',
        borderBottom: '1px solid rgba(148, 163, 184, 0.1)',
      }}
      bodyStyle={{
        padding: '24px',
      }}
      style={{
        background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.95) 0%, rgba(30, 27, 75, 0.95) 100%)',
        backdropFilter: 'blur(30px)',
        border: '1px solid rgba(139, 92, 246, 0.2)',
        borderRadius: '28px',
        boxShadow: '0 25px 70px rgba(0, 0, 0, 0.6), 0 0 0 1px rgba(255, 255, 255, 0.05) inset',
      }}
      title={
        <div className="flex items-center gap-3">
          <div className="skeleton w-14 h-14 rounded-xl flex-shrink-0 shadow-lg"></div>
          <div className="flex-1 min-w-0">
            <div className="skeleton w-32 h-5 mb-1 rounded-lg"></div>
            <div className="skeleton w-20 h-4 rounded-full"></div>
          </div>
        </div>
      }
    >

      {/* Price Section Skeleton */}
      <div className="p-5 -mx-6 mb-5 bg-gradient-to-br from-purple-900/20 to-blue-900/20 rounded-2xl border border-purple-500/20">
        <div className="flex justify-between mb-2">
          <div className="skeleton w-24 h-3 rounded"></div>
          <div className="skeleton w-20 h-4 rounded"></div>
        </div>
        <div className="skeleton w-48 h-10 rounded-lg"></div>
      </div>

      {/* Stats Grid Skeleton - 2x2 */}
      <div className="grid grid-cols-2 gap-3 mb-5">
        <div className="p-3 bg-slate-900/40 rounded-xl border border-slate-700/30">
          <div className="skeleton w-12 h-3 mb-1 rounded"></div>
          <div className="skeleton w-16 h-4 rounded"></div>
        </div>
        <div className="p-3 bg-slate-900/40 rounded-xl border border-slate-700/30">
          <div className="skeleton w-12 h-3 mb-1 rounded"></div>
          <div className="skeleton w-16 h-4 rounded"></div>
        </div>
        <div className="p-3 bg-slate-900/40 rounded-xl border border-slate-700/30">
          <div className="skeleton w-16 h-3 mb-1 rounded"></div>
          <div className="skeleton w-20 h-4 rounded"></div>
        </div>
        <div className="p-3 bg-slate-900/40 rounded-xl border border-slate-700/30">
          <div className="skeleton w-16 h-3 mb-1 rounded"></div>
          <div className="skeleton w-20 h-4 rounded"></div>
        </div>
      </div>

      {/* Live Indicator Skeleton */}
      <div className="flex items-center gap-3 mb-5 p-3 bg-gradient-to-r from-green-900/20 to-emerald-900/20 border border-green-500/30 rounded-xl">
        <div className="skeleton w-2.5 h-2.5 rounded-full flex-shrink-0"></div>
        <div className="flex-1 min-w-0">
          <div className="skeleton w-20 h-3 mb-1 rounded"></div>
          <div className="skeleton w-28 h-3 rounded"></div>
        </div>
      </div>

      {/* Button Skeleton */}
      <div className="skeleton w-full h-14 rounded-xl"></div>
    </Card>
  );
}

export default SkeletonCard;
