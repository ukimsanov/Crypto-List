import React, { useEffect, useRef, useState } from 'react';
import { createChart, CandlestickSeries } from 'lightweight-charts';
import axios from 'axios';

/**
 * TradingView-style cryptocurrency chart component
 * Displays OHLC (candlestick) data with a professional dark theme and timeframe selector
 */
function CryptoChart({ currencyId, symbol, name }) {
  const chartContainerRef = useRef();
  const chartRef = useRef();
  const seriesRef = useRef();
  const wsRef = useRef(null);

  const [timeframe, setTimeframe] = useState(60); // Default: 1 hour
  const [chartData, setChartData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [lastPrice, setLastPrice] = useState(null);

  // Timeframe options with Kraken intervals (in minutes)
  const timeframes = [
    { label: '1m', interval: 1 },
    { label: '5m', interval: 5 },
    { label: '15m', interval: 15 },
    { label: '30m', interval: 30 },
    { label: '1h', interval: 60 },
    { label: '4h', interval: 240 },
    { label: '1D', interval: 1440 }
  ];

  // Fetch chart data when timeframe changes
  useEffect(() => {
    const fetchChartData = async () => {
      setLoading(true);
      try {
        const response = await axios.get(
          `http://127.0.0.1:8000/cryptocurrencies/${currencyId}/history`,
          { params: { interval: timeframe } }
        );

        // Check if API returned an error
        if (response.data.data?.error) {
          console.error('API Error:', response.data.data.error);
          setChartData(null);
          return;
        }

        setChartData(response.data.data);
      } catch (error) {
        console.error('Failed to fetch chart data:', error);
        setChartData(null);
      } finally {
        setLoading(false);
      }
    };

    fetchChartData();
  }, [currencyId, timeframe]);

  // Render chart when data is available
  useEffect(() => {
    if (!chartData || chartData.length === 0) {
      console.log('No chart data available');
      return;
    }

    console.log('Rendering chart with data:', chartData.length, 'candles');

    // Ensure container has width
    const containerWidth = chartContainerRef.current?.clientWidth || 800;

    // Chart configuration with TradingView-style dark theme
    const chart = createChart(chartContainerRef.current, {
      width: containerWidth,
      height: 450,
      layout: {
        background: { color: '#131722' },
        textColor: '#d1d4dc',
      },
      grid: {
        vertLines: {
          color: '#1e222d',
          style: 0, // Solid line
        },
        horzLines: {
          color: '#1e222d',
          style: 0,
        },
      },
      crosshair: {
        mode: 0, // Normal crosshair (magnet mode)
        vertLine: {
          width: 1,
          color: '#758696',
          style: 3, // Dashed line
          labelBackgroundColor: '#4c525e',
        },
        horzLine: {
          width: 1,
          color: '#758696',
          style: 3,
          labelBackgroundColor: '#4c525e',
        },
      },
      rightPriceScale: {
        borderColor: '#2B2B43',
        scaleMargins: {
          top: 0.1,
          bottom: 0.1,
        },
      },
      timeScale: {
        borderColor: '#2B2B43',
        timeVisible: true,
        secondsVisible: false,
        rightOffset: 12,
        barSpacing: 10,
        fixLeftEdge: false,    // Allow scrolling left
        fixRightEdge: false,   // Allow scrolling right
        lockVisibleTimeRangeOnResize: false,
        shiftVisibleRangeOnNewBar: true,
      },
      handleScroll: {
        mouseWheel: true,           // Enable mouse wheel zoom
        pressedMouseMove: true,      // Enable drag to pan
        horzTouchDrag: true,        // Enable touch drag
        vertTouchDrag: true,
      },
      handleScale: {
        axisPressedMouseMove: {     // Enable drag on axis to zoom
          time: true,
          price: true,
        },
        mouseWheel: true,           // Enable mouse wheel zoom
        pinch: true,                // Enable pinch zoom
      },
    });

    // Add candlestick series (v5 syntax)
    const candlestickSeries = chart.addSeries(CandlestickSeries, {
      upColor: '#26a69a',
      downColor: '#ef5350',
      borderVisible: false,
      wickUpColor: '#26a69a',
      wickDownColor: '#ef5350',
    });

    // Transform OHLC data: [timestamp, open, high, low, close]
    const formattedData = chartData.map(([timestamp, open, high, low, close]) => ({
      time: Math.floor(timestamp / 1000), // Convert to seconds
      open: open,
      high: high,
      low: low,
      close: close,
    }));

    candlestickSeries.setData(formattedData);
    seriesRef.current = candlestickSeries;

    // Auto-fit content
    chart.timeScale().fitContent();

    chartRef.current = chart;

    // Handle window resize
    const handleResize = () => {
      if (chartContainerRef.current && chartRef.current) {
        chartRef.current.applyOptions({
          width: chartContainerRef.current.clientWidth,
        });
      }
    };

    window.addEventListener('resize', handleResize);

    // Cleanup
    return () => {
      window.removeEventListener('resize', handleResize);
      if (chartRef.current) {
        chartRef.current.remove();
      }
    };
  }, [chartData]);

  // Real-time price updates via Kraken WebSocket
  useEffect(() => {
    if (!seriesRef.current || !chartData || chartData.length === 0) {
      return;
    }

    console.log(`🔄 Connecting to Kraken WebSocket for live chart updates: ${symbol}`);

    const ws = new WebSocket(`ws://127.0.0.1:8000/ws/prices/${currencyId}`);
    wsRef.current = ws;

    ws.onopen = () => {
      console.log(`✅ Chart WebSocket connected for ${symbol}`);
    };

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);

      if (data.type === 'price_update') {
        const price = data.price;
        setLastPrice(price);

        // Update the last candlestick with live price (TradingView-style)
        const lastCandle = chartData[chartData.length - 1];
        const [timestamp, open, high, low] = lastCandle;

        const updatedCandle = {
          time: Math.floor(timestamp / 1000),
          open: open,
          high: Math.max(high, price),
          low: Math.min(low, price),
          close: price
        };

        seriesRef.current.update(updatedCandle);
      }
    };

    ws.onerror = (error) => {
      console.error(`❌ Chart WebSocket error:`, error);
    };

    ws.onclose = () => {
      console.log(`🔌 Chart WebSocket disconnected for ${symbol}`);
    };

    // Cleanup
    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, [chartData, currencyId, symbol]);

  return (
    <div style={{ width: '100%', minHeight: '550px' }}>
      {/* Header with Title and Timeframe Selector */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '0 0 20px 0',
        color: '#d1d4dc',
        borderBottom: '1px solid rgba(139, 92, 246, 0.2)',
        marginBottom: '20px',
        flexWrap: 'wrap',
        gap: '16px'
      }}>
        <div style={{ flex: '1', minWidth: '250px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
            <h3 style={{ 
              margin: 0, 
              fontSize: '24px', 
              fontWeight: 800,
              background: 'linear-gradient(135deg, #a78bfa 0%, #60a5fa 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text'
            }}>
              {name}
            </h3>
            <span style={{ 
              fontSize: '16px', 
              color: '#94a3b8',
              fontWeight: 600,
              backgroundColor: 'rgba(148, 163, 184, 0.1)',
              padding: '4px 12px',
              borderRadius: '8px'
            }}>
              {symbol}
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
            <p style={{ margin: 0, fontSize: '13px', color: '#787b86', fontWeight: 500 }}>
              {timeframes.find(t => t.interval == timeframe)?.label} OHLC Candlestick Chart
            </p>
            {lastPrice && (
              <div style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '6px',
                backgroundColor: 'rgba(16, 185, 129, 0.15)',
                padding: '4px 10px',
                borderRadius: '8px',
                border: '1px solid rgba(16, 185, 129, 0.3)'
              }}>
                <div style={{ 
                  width: '8px', 
                  height: '8px', 
                  backgroundColor: '#10b981', 
                  borderRadius: '50%',
                  animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite'
                }}></div>
                <span style={{ color: '#22c55e', fontSize: '12px', fontWeight: 700 }}>
                  ${lastPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Chart Controls */}
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
          {/* Reset Zoom Button */}
          <button
            onClick={() => chartRef.current?.timeScale().fitContent()}
            style={{
              padding: '10px 16px',
              fontSize: '13px',
              fontWeight: 600,
              backgroundColor: '#1e222d',
              color: '#94a3b8',
              border: '1px solid rgba(139, 92, 246, 0.3)',
              borderRadius: '10px',
              cursor: 'pointer',
              transition: 'all 0.3s ease',
              fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
              boxShadow: '0 2px 8px rgba(0, 0, 0, 0.3)'
            }}
            onMouseEnter={(e) => {
              e.target.style.backgroundColor = 'rgba(139, 92, 246, 0.2)';
              e.target.style.color = '#e9d5ff';
              e.target.style.borderColor = 'rgba(139, 92, 246, 0.5)';
              e.target.style.transform = 'translateY(-2px)';
              e.target.style.boxShadow = '0 4px 12px rgba(139, 92, 246, 0.3)';
            }}
            onMouseLeave={(e) => {
              e.target.style.backgroundColor = '#1e222d';
              e.target.style.color = '#94a3b8';
              e.target.style.borderColor = 'rgba(139, 92, 246, 0.3)';
              e.target.style.transform = 'translateY(0)';
              e.target.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.3)';
            }}
          >
            🔍 Reset Zoom
          </button>

        {/* TradingView-style Timeframe Selector */}
        <div style={{
          display: 'flex',
          gap: '6px',
          backgroundColor: '#1e222d',
          padding: '6px',
          borderRadius: '12px',
          border: '1px solid rgba(139, 92, 246, 0.2)',
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.3)'
        }}>
          {timeframes.map(({ label, interval }) => (
            <button
              key={interval}
              onClick={() => setTimeframe(interval)}
              style={{
                padding: '8px 14px',
                fontSize: '13px',
                fontWeight: 600,
                backgroundColor: timeframe == interval ? 'linear-gradient(135deg, #8b5cf6 0%, #6366f1 100%)' : 'transparent',
                background: timeframe == interval ? 'linear-gradient(135deg, #8b5cf6 0%, #6366f1 100%)' : 'transparent',
                color: timeframe == interval ? '#ffffff' : '#94a3b8',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
                fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
                boxShadow: timeframe == interval ? '0 4px 12px rgba(139, 92, 246, 0.4)' : 'none'
              }}
              onMouseEnter={(e) => {
                if (timeframe != interval) {
                  e.target.style.backgroundColor = 'rgba(139, 92, 246, 0.15)';
                  e.target.style.color = '#e9d5ff';
                  e.target.style.transform = 'translateY(-2px)';
                }
              }}
              onMouseLeave={(e) => {
                if (timeframe != interval) {
                  e.target.style.backgroundColor = 'transparent';
                  e.target.style.color = '#94a3b8';
                  e.target.style.transform = 'translateY(0)';
                }
              }}
            >
              {label}
            </button>
          ))}
        </div>
      </div>
      </div>

      <div
        ref={chartContainerRef}
        style={{
          position: 'relative',
          width: '100%',
          height: '500px',
          backgroundColor: '#131722',
          borderRadius: '16px',
          overflow: 'hidden',
          border: '1px solid rgba(139, 92, 246, 0.2)',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.05)'
        }}
      >
        {/* Loading overlay - doesn't push content */}
        {loading && (
          <div style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: 'rgba(19, 23, 34, 0.95)',
            backdropFilter: 'blur(8px)',
            zIndex: 10,
            color: '#d1d4dc'
          }}>
            <div style={{
              display: 'inline-block',
              width: '40px',
              height: '40px',
              border: '3px solid rgba(139, 92, 246, 0.3)',
              borderTop: '3px solid #8b5cf6',
              borderRadius: '50%',
              animation: 'spin 0.8s linear infinite',
              marginBottom: '12px'
            }}></div>
            <p style={{ fontSize: '13px', fontWeight: 600, color: '#94a3b8', margin: 0 }}>
              Loading {timeframes.find(t => t.interval == timeframe)?.label} data...
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

export default CryptoChart;
