import React from 'react';
import { Button } from 'antd';
import { ReloadOutlined, WarningOutlined } from '@ant-design/icons';

/**
 * Error state component
 * Displays when cryptocurrency data fails to load
 */
function ErrorState({ onRetry, message = "Failed to load cryptocurrency data" }) {
  return (
    <div className="flex items-center justify-center min-h-[400px] animate-fade-in">
      <div className="text-center max-w-md p-8">
        <div className="relative inline-block mb-6">
          <div className="w-24 h-24 rounded-full bg-gradient-to-br from-red-500/20 to-orange-500/20 flex items-center justify-center border border-red-500/30">
            <WarningOutlined className="text-5xl text-red-400" />
          </div>
          <div className="absolute inset-0 bg-red-500/20 rounded-full blur-2xl animate-pulse"></div>
        </div>

        <h3 className="text-2xl font-bold text-white mb-3">
          Oops! Something went wrong
        </h3>
        
        <p className="text-slate-400 text-base mb-6 leading-relaxed">
          {message}. Please check your connection and try again.
        </p>

        <Button
          type="primary"
          icon={<ReloadOutlined />}
          onClick={onRetry}
          size="large"
          className="h-12 px-8 text-base font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300"
          style={{
            background: 'linear-gradient(135deg, #8b5cf6 0%, #6366f1 100%)',
            border: 'none',
          }}
        >
          Retry Connection
        </Button>

        <div className="mt-8 text-xs text-slate-500 space-y-1">
          <p>💡 Make sure the backend server is running</p>
          <p>🔌 Check WebSocket connection to Kraken</p>
        </div>
      </div>
    </div>
  );
}

export default ErrorState;
