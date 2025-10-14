import React, { useEffect, useRef, useState } from 'react';
import { createChart, CandlestickSeries } from 'lightweight-charts';
import axios from 'axios';
import { API_URL, WS_URL } from '../config';

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
  const [chartVersion, setChartVersion] = useState(0); // Increments each time chart is recreated

  // Drawing tools state
  const [drawingMode, setDrawingMode] = useState(null); // 'horizontal', 'trendline', 'vertical', null
  const [drawings, setDrawings] = useState([]);
  const [tempDrawing, setTempDrawing] = useState(null);
  const drawingLayerRef = useRef(null);
  const priceLineRefsRef = useRef([]); // Store price line references
  const [svgDrawings, setSvgDrawings] = useState([]); // For rendering SVG lines
  const [mousePosition, setMousePosition] = useState(null); // Track mouse for preview

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
          `${API_URL}/cryptocurrencies/${currencyId}/history`,
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

    // Reset drawing mode when timeframe changes (but keep drawings)
    setDrawingMode(null);
    setTempDrawing(null);
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
        rightOffset: 50,  // Increased to allow drawing in future
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
      time: Number(Math.floor(timestamp / 1000)), // Ensure number type
      open: Number(open),
      high: Number(high),
      low: Number(low),
      close: Number(close),
    }));

    // Add whitespace data for future time labels (30 days ahead)
    const lastCandle = formattedData[formattedData.length - 1];
    const timeInterval = timeframe * 60; // in seconds
    const futureExtension = 30 * 24 * 60 * 60; // 30 days in seconds
    const numWhitespacePoints = Math.floor(futureExtension / timeInterval);

    const whitespaceData = [];
    for (let i = 1; i <= numWhitespacePoints; i++) {
      // WhitespaceData = just time, no OHLC
      whitespaceData.push({
        time: lastCandle.time + (i * timeInterval),
      });
    }

    // Combine real candles with whitespace for future dates
    const dataWithWhitespace = [...formattedData, ...whitespaceData];

    // Set all data including whitespace
    candlestickSeries.setData(dataWithWhitespace);
    seriesRef.current = candlestickSeries;

    // Store references for live updates
    chartRef.current = chart;
    chartRef.current._allData = dataWithWhitespace; // Full array including whitespace
    chartRef.current._lastRealCandleIndex = formattedData.length - 1; // Index of last real candle
    chartRef.current._lastRealCandleTime = lastCandle.time;

    // Set initial view to show recent data with some future space (TradingView-style)
    // Show approximately 80% real data, 20% future space
    const barsToShow = Math.min(100, formattedData.length); // Show last ~100 bars or all if less
    const futureSpaceBars = Math.floor(barsToShow * 0.2); // 20% future space

    chart.timeScale().setVisibleLogicalRange({
      from: formattedData.length - barsToShow,
      to: formattedData.length + futureSpaceBars,
    });

    console.log('📌 Chart initialized:', formattedData.length, 'candles +', numWhitespacePoints, 'whitespace points');

    // Increment chart version to trigger drawing re-render
    setChartVersion(prev => prev + 1);

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
      // Clear price line references when chart is destroyed
      priceLineRefsRef.current = [];
    };
  }, [chartData]);

  // Real-time price updates via Kraken WebSocket
  useEffect(() => {
    if (!seriesRef.current || !chartData || chartData.length === 0) {
      return;
    }

    console.log(`🔄 Connecting to Kraken WebSocket for live chart updates: ${symbol}`);

    const ws = new WebSocket(`${WS_URL}/ws/prices/${currencyId}`);
    wsRef.current = ws;

    ws.onopen = () => {
      console.log(`✅ Chart WebSocket connected for ${symbol}`);
    };

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);

      if (data.type === 'price_update') {
        const price = data.price;
        setLastPrice(price);

        // Update the last REAL candlestick with live price (not whitespace)
        const lastCandle = chartData[chartData.length - 1];
        const [timestamp, open, high, low] = lastCandle;

        // Update the last real candle in the data array
        if (seriesRef.current && chartRef.current?._allData && chartRef.current?._lastRealCandleIndex !== undefined) {
          const allData = chartRef.current._allData;
          const lastIndex = chartRef.current._lastRealCandleIndex;

          // Update the last real candle in the array
          allData[lastIndex] = {
            time: chartRef.current._lastRealCandleTime,
            open: Number(open),
            high: Number(Math.max(high, price)),
            low: Number(Math.min(low, price)),
            close: Number(price)
          };

          // Call setData with the updated array (includes whitespace)
          seriesRef.current.setData(allData);
        }
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

  // Helper function to extend trend line to chart boundaries
  const extendTrendLine = (x1, y1, x2, y2, chartWidth, chartHeight) => {
    // Calculate slope
    const dx = x2 - x1;
    const dy = y2 - y1;

    if (dx === 0) {
      // Vertical line
      return { x1, y1: 0, x2, y2: chartHeight };
    }

    const slope = dy / dx;

    // Extend to left edge (x=0)
    const leftY = y1 - (x1 * slope);

    // Extend to right edge (x=chartWidth)
    const rightY = y1 + ((chartWidth - x1) * slope);

    return {
      x1: 0,
      y1: leftY,
      x2: chartWidth,
      y2: rightY
    };
  };

  // Drawing Tools Functions
  const handleChartClick = (param) => {
    if (!drawingMode || !chartRef.current || !param.point) return;

    // Get coordinates - these work even in empty chart space
    const price = seriesRef.current.coordinateToPrice(param.point.y);
    const time = chartRef.current.timeScale().coordinateToTime(param.point.x);

    // For trendline, we allow clicking anywhere (even where there's no data)
    // For horizontal/vertical, we need valid price/time
    if (drawingMode === 'trendline') {
      // Trend line requires two clicks - allow anywhere on chart
      if (!tempDrawing) {
        // First click - start point
        if (time && price) {
          setTempDrawing({
            type: 'trendline',
            point1: { time, price },
            color: '#2962ff'
          });
        }
      } else {
        // Second click - end point (can be anywhere, even in future)
        if (time && price) {
          const newDrawing = {
            id: Date.now(),
            type: 'trendline',
            point1: tempDrawing.point1,
            point2: { time, price },
            color: '#2962ff'
          };
          setDrawings([...drawings, newDrawing]);
          setTempDrawing(null);
          setDrawingMode(null);
        }
      }
    } else if (drawingMode === 'horizontal') {
      // Horizontal line needs valid price
      if (price) {
        const newDrawing = {
          id: Date.now(),
          type: 'horizontal',
          price: price,
          color: '#2962ff'
        };
        setDrawings([...drawings, newDrawing]);
        setDrawingMode(null);
      }
    } else if (drawingMode === 'vertical') {
      // Vertical line needs valid time
      if (time) {
        const newDrawing = {
          id: Date.now(),
          type: 'vertical',
          time: time,
          color: '#2962ff'
        };
        setDrawings([...drawings, newDrawing]);
        setDrawingMode(null);
      }
    }
  };

  const clearDrawings = () => {
    setDrawings([]);
    setTempDrawing(null);
    setDrawingMode(null);
  };

  const deleteLastDrawing = () => {
    if (drawings.length > 0) {
      setDrawings(drawings.slice(0, -1));
    }
  };

  // Render drawings on the chart
  useEffect(() => {
    if (!chartRef.current || !seriesRef.current || chartVersion === 0) {
      console.log('Drawing render skipped - chart not ready');
      return;
    }

    console.log('🎨 Rendering', drawings.length, 'drawings on chart (version:', chartVersion + ')');

    // Clear all existing price lines (for horizontal lines)
    priceLineRefsRef.current = []; // Clear refs (old series is already destroyed)

    // Create new price lines for all horizontal drawings
    drawings.forEach(drawing => {
      if (drawing.type === 'horizontal') {
        try {
          const priceLine = seriesRef.current.createPriceLine({
            price: drawing.price,
            color: drawing.color,
            lineWidth: 2,
            lineStyle: 0, // Solid line (0 = Solid, 1 = Dotted, 2 = Dashed)
            axisLabelVisible: true,
            title: `${drawing.price.toFixed(2)}`,
          });
          priceLineRefsRef.current.push(priceLine);
          console.log('✅ Created horizontal line at price:', drawing.price);
        } catch (e) {
          console.error('❌ Error creating price line:', e);
        }
      }
    });

    // Convert trend lines and vertical lines to SVG coordinates
    const svgLines = [];

    drawings.forEach(drawing => {
      if (drawing.type === 'trendline' && drawing.point1 && drawing.point2) {
        try {
          // Convert time/price to x/y coordinates
          const x1 = chartRef.current.timeScale().timeToCoordinate(drawing.point1.time);
          const y1 = seriesRef.current.priceToCoordinate(drawing.point1.price);
          const x2 = chartRef.current.timeScale().timeToCoordinate(drawing.point2.time);
          const y2 = seriesRef.current.priceToCoordinate(drawing.point2.price);

          if (x1 !== null && y1 !== null && x2 !== null && y2 !== null) {
            // Draw line only between the two points (no extension)
            svgLines.push({
              id: drawing.id,
              type: 'line',
              x1, y1, x2, y2,
              color: drawing.color
            });
            console.log('✅ Rendered trend line:', { x1, y1, x2, y2 });
          } else {
            console.warn('❌ Trend line coordinates contain null:', { point1: drawing.point1, point2: drawing.point2, x1, y1, x2, y2 });
          }
        } catch (e) {
          console.error('Error rendering trend line:', e);
        }
      } else if (drawing.type === 'vertical' && drawing.time) {
        try {
          const x = chartRef.current.timeScale().timeToCoordinate(drawing.time);

          if (x !== null && chartContainerRef.current) {
            svgLines.push({
              id: drawing.id,
              type: 'vertical',
              x,
              height: chartContainerRef.current.clientHeight,
              color: drawing.color
            });
            console.log('✅ Rendered vertical line at time:', drawing.time, 'x:', x);
          } else {
            console.warn('❌ Vertical line coordinate is null:', { time: drawing.time, x });
          }
        } catch (e) {
          console.error('Error rendering vertical line:', e);
        }
      }
    });

    setSvgDrawings(svgLines);
  }, [drawings, chartVersion]);

  // Update SVG drawings when chart is scrolled/zoomed
  useEffect(() => {
    if (!chartRef.current || !seriesRef.current || chartVersion === 0) return;

    const handleVisibleRangeChange = () => {
      // Re-render SVG drawings when viewport changes
      const svgLines = [];

      drawings.forEach(drawing => {
        if (drawing.type === 'trendline' && drawing.point1 && drawing.point2) {
          try {
            const x1 = chartRef.current.timeScale().timeToCoordinate(drawing.point1.time);
            const y1 = seriesRef.current.priceToCoordinate(drawing.point1.price);
            const x2 = chartRef.current.timeScale().timeToCoordinate(drawing.point2.time);
            const y2 = seriesRef.current.priceToCoordinate(drawing.point2.price);

            if (x1 !== null && y1 !== null && x2 !== null && y2 !== null) {
              // Draw line only between the two points (no extension)
              svgLines.push({
                id: drawing.id,
                type: 'line',
                x1, y1, x2, y2,
                color: drawing.color
              });
            }
          } catch (e) {}
        } else if (drawing.type === 'vertical' && drawing.time) {
          try {
            const x = chartRef.current.timeScale().timeToCoordinate(drawing.time);

            if (x !== null && chartContainerRef.current) {
              svgLines.push({
                id: drawing.id,
                type: 'vertical',
                x,
                height: chartContainerRef.current.clientHeight,
                color: drawing.color
              });
            }
          } catch (e) {}
        }
      });

      setSvgDrawings(svgLines);
    };

    chartRef.current.timeScale().subscribeVisibleTimeRangeChange(handleVisibleRangeChange);

    return () => {
      if (chartRef.current) {
        chartRef.current.timeScale().unsubscribeVisibleTimeRangeChange(handleVisibleRangeChange);
      }
    };
  }, [drawings, chartVersion]);


  // Handle ESC key to exit drawing mode
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && drawingMode) {
        setDrawingMode(null);
        setTempDrawing(null);
        setMousePosition(null);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [drawingMode]);

  // Track mouse position for trend line preview and handle direct clicks
  useEffect(() => {
    if (!chartContainerRef.current || !drawingMode) return;

    const handleMouseMove = (e) => {
      const rect = chartContainerRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      if (x >= 0 && x <= rect.width && y >= 0 && y <= rect.height) {
        setMousePosition({ x, y });
      }
    };

    const handleMouseLeave = () => {
      setMousePosition(null);
    };

    // Handle direct container clicks (works everywhere, even in empty space)
    const handleContainerClick = (e) => {
      if (!chartRef.current || !seriesRef.current) return;

      const rect = chartContainerRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      // Convert pixel coordinates to time/price
      let time = chartRef.current.timeScale().coordinateToTime(x);
      let price = seriesRef.current.coordinateToPrice(y);

      console.log('Click detected:', { x, y, time, price });

      // If coordinateToTime returns null (beyond visible range), extrapolate
      if (!time && chartData && chartData.length > 1) {
        // Use the last two data points to calculate time per pixel
        const lastCandle = chartData[chartData.length - 1];
        const secondLastCandle = chartData[chartData.length - 2];

        const lastTime = lastCandle[0] / 1000; // Convert to seconds
        const secondLastTime = secondLastCandle[0] / 1000;

        const timeScale = chartRef.current.timeScale();
        const lastX = timeScale.timeToCoordinate(lastTime);
        const secondLastX = timeScale.timeToCoordinate(secondLastTime);

        console.log('Debug extrapolation:', {
          lastTime,
          secondLastTime,
          lastX,
          secondLastX,
          clickedX: x
        });

        if (lastX !== null && secondLastX !== null && lastX !== secondLastX) {
          // Calculate time per pixel based on actual data points
          const timePerPixel = (lastTime - secondLastTime) / (lastX - secondLastX);

          // Extrapolate time for the clicked pixel (allow clicking ahead)
          const pixelsBeyondLast = x - lastX;
          time = lastTime + (pixelsBeyondLast * timePerPixel);
          console.log('Extrapolated time:', time, 'pixelsBeyond:', pixelsBeyondLast, 'timePerPixel:', timePerPixel);
        }
      }

      // Price can be extrapolated too (click above/below visible prices)
      if (!price) {
        // For now, just use a reasonable default or skip
        console.log('Price is null, trying to click in valid Y range');
        return;
      }

      if (!time) {
        console.log('Could not determine time - click rejected');
        return;
      }

      // Handle the click based on drawing mode
      if (drawingMode === 'trendline') {
        if (!tempDrawing) {
          // First click
          setTempDrawing({
            type: 'trendline',
            point1: { time, price },
            color: '#2962ff'
          });
        } else {
          // Second click
          const newDrawing = {
            id: Date.now(),
            type: 'trendline',
            point1: tempDrawing.point1,
            point2: { time, price },
            color: '#2962ff'
          };
          console.log('Creating trend line:', newDrawing);
          setDrawings([...drawings, newDrawing]);
          setTempDrawing(null);
          setDrawingMode(null);
        }
      } else if (drawingMode === 'horizontal') {
        const newDrawing = {
          id: Date.now(),
          type: 'horizontal',
          price: price,
          color: '#2962ff'
        };
        setDrawings([...drawings, newDrawing]);
        setDrawingMode(null);
      } else if (drawingMode === 'vertical') {
        const newDrawing = {
          id: Date.now(),
          type: 'vertical',
          time: time,
          color: '#2962ff'
        };
        setDrawings([...drawings, newDrawing]);
        setDrawingMode(null);
      }
    };

    const container = chartContainerRef.current;
    container.addEventListener('mousemove', handleMouseMove);
    container.addEventListener('mouseleave', handleMouseLeave);
    container.addEventListener('click', handleContainerClick);

    return () => {
      container.removeEventListener('mousemove', handleMouseMove);
      container.removeEventListener('mouseleave', handleMouseLeave);
      container.removeEventListener('click', handleContainerClick);
    };
  }, [drawingMode, tempDrawing, drawings]);

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
          {/* TradingView-style Drawing Tools */}
          <div style={{
            display: 'flex',
            gap: '4px',
            backgroundColor: '#1e222d',
            padding: '4px',
            borderRadius: '10px',
            border: '1px solid rgba(139, 92, 246, 0.2)',
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.3)'
          }}>
            {/* Horizontal Line Tool */}
            <button
              onClick={() => setDrawingMode(drawingMode === 'horizontal' ? null : 'horizontal')}
              title="Horizontal Line (Support/Resistance)"
              style={{
                padding: '8px 12px',
                fontSize: '16px',
                backgroundColor: drawingMode === 'horizontal' ? 'rgba(41, 98, 255, 0.2)' : 'transparent',
                color: drawingMode === 'horizontal' ? '#2962ff' : '#94a3b8',
                border: drawingMode === 'horizontal' ? '1px solid #2962ff' : '1px solid transparent',
                borderRadius: '8px',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                fontFamily: 'monospace',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                minWidth: '36px',
                height: '36px'
              }}
              onMouseEnter={(e) => {
                if (drawingMode !== 'horizontal') {
                  e.target.style.backgroundColor = 'rgba(139, 92, 246, 0.1)';
                  e.target.style.color = '#c4b5fd';
                }
              }}
              onMouseLeave={(e) => {
                if (drawingMode !== 'horizontal') {
                  e.target.style.backgroundColor = 'transparent';
                  e.target.style.color = '#94a3b8';
                }
              }}
            >
              ─
            </button>

            {/* Trend Line Tool */}
            <button
              onClick={() => {
                if (drawingMode === 'trendline') {
                  setDrawingMode(null);
                  setTempDrawing(null);
                } else {
                  setDrawingMode('trendline');
                  setTempDrawing(null);
                }
              }}
              title="Trend Line (Click two points)"
              style={{
                padding: '8px 12px',
                fontSize: '16px',
                backgroundColor: drawingMode === 'trendline' ? 'rgba(41, 98, 255, 0.2)' : 'transparent',
                color: drawingMode === 'trendline' ? '#2962ff' : '#94a3b8',
                border: drawingMode === 'trendline' ? '1px solid #2962ff' : '1px solid transparent',
                borderRadius: '8px',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                fontFamily: 'monospace',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                minWidth: '36px',
                height: '36px'
              }}
              onMouseEnter={(e) => {
                if (drawingMode !== 'trendline') {
                  e.target.style.backgroundColor = 'rgba(139, 92, 246, 0.1)';
                  e.target.style.color = '#c4b5fd';
                }
              }}
              onMouseLeave={(e) => {
                if (drawingMode !== 'trendline') {
                  e.target.style.backgroundColor = 'transparent';
                  e.target.style.color = '#94a3b8';
                }
              }}
            >
              ╱
            </button>

            {/* Vertical Line Tool */}
            <button
              onClick={() => setDrawingMode(drawingMode === 'vertical' ? null : 'vertical')}
              title="Vertical Line (Mark Events)"
              style={{
                padding: '8px 12px',
                fontSize: '16px',
                backgroundColor: drawingMode === 'vertical' ? 'rgba(41, 98, 255, 0.2)' : 'transparent',
                color: drawingMode === 'vertical' ? '#2962ff' : '#94a3b8',
                border: drawingMode === 'vertical' ? '1px solid #2962ff' : '1px solid transparent',
                borderRadius: '8px',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                fontFamily: 'monospace',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                minWidth: '36px',
                height: '36px'
              }}
              onMouseEnter={(e) => {
                if (drawingMode !== 'vertical') {
                  e.target.style.backgroundColor = 'rgba(139, 92, 246, 0.1)';
                  e.target.style.color = '#c4b5fd';
                }
              }}
              onMouseLeave={(e) => {
                if (drawingMode !== 'vertical') {
                  e.target.style.backgroundColor = 'transparent';
                  e.target.style.color = '#94a3b8';
                }
              }}
            >
              │
            </button>

            {/* Divider */}
            <div style={{
              width: '1px',
              height: '32px',
              backgroundColor: 'rgba(148, 163, 184, 0.2)',
              margin: '2px 4px'
            }}></div>

            {/* Delete Last Drawing */}
            <button
              onClick={deleteLastDrawing}
              disabled={drawings.length === 0}
              title="Delete Last Drawing"
              style={{
                padding: '8px 12px',
                fontSize: '14px',
                backgroundColor: 'transparent',
                color: drawings.length === 0 ? '#4b5563' : '#94a3b8',
                border: '1px solid transparent',
                borderRadius: '8px',
                cursor: drawings.length === 0 ? 'not-allowed' : 'pointer',
                transition: 'all 0.2s ease',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                minWidth: '36px',
                height: '36px',
                opacity: drawings.length === 0 ? 0.3 : 1
              }}
              onMouseEnter={(e) => {
                if (drawings.length > 0) {
                  e.target.style.backgroundColor = 'rgba(239, 68, 68, 0.1)';
                  e.target.style.color = '#ef4444';
                }
              }}
              onMouseLeave={(e) => {
                if (drawings.length > 0) {
                  e.target.style.backgroundColor = 'transparent';
                  e.target.style.color = '#94a3b8';
                }
              }}
            >
              ↶
            </button>

            {/* Clear All Drawings */}
            <button
              onClick={clearDrawings}
              disabled={drawings.length === 0 && !drawingMode}
              title="Clear All Drawings"
              style={{
                padding: '8px 12px',
                fontSize: '14px',
                backgroundColor: 'transparent',
                color: (drawings.length === 0 && !drawingMode) ? '#4b5563' : '#94a3b8',
                border: '1px solid transparent',
                borderRadius: '8px',
                cursor: (drawings.length === 0 && !drawingMode) ? 'not-allowed' : 'pointer',
                transition: 'all 0.2s ease',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                minWidth: '36px',
                height: '36px',
                opacity: (drawings.length === 0 && !drawingMode) ? 0.3 : 1
              }}
              onMouseEnter={(e) => {
                if (drawings.length > 0 || drawingMode) {
                  e.target.style.backgroundColor = 'rgba(239, 68, 68, 0.1)';
                  e.target.style.color = '#ef4444';
                }
              }}
              onMouseLeave={(e) => {
                if (drawings.length > 0 || drawingMode) {
                  e.target.style.backgroundColor = 'transparent';
                  e.target.style.color = '#94a3b8';
                }
              }}
            >
              🗑
            </button>
          </div>

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
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.05)',
          cursor: drawingMode ? 'crosshair' : 'default'
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

        {/* SVG Overlay for Trend Lines and Vertical Lines */}
        <svg
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            pointerEvents: 'none',
            zIndex: 5
          }}
        >
          {svgDrawings.map(drawing => {
            if (drawing.type === 'line') {
              return (
                <line
                  key={drawing.id}
                  x1={drawing.x1}
                  y1={drawing.y1}
                  x2={drawing.x2}
                  y2={drawing.y2}
                  stroke={drawing.color}
                  strokeWidth={2}
                />
              );
            } else if (drawing.type === 'vertical') {
              return (
                <line
                  key={drawing.id}
                  x1={drawing.x}
                  y1={0}
                  x2={drawing.x}
                  y2={drawing.height}
                  stroke={drawing.color}
                  strokeWidth={2}
                />
              );
            }
            return null;
          })}

          {/* Preview line for trend line (first point to mouse cursor) */}
          {drawingMode === 'trendline' && tempDrawing && mousePosition && chartRef.current && seriesRef.current && (() => {
            try {
              const x1 = chartRef.current.timeScale().timeToCoordinate(tempDrawing.point1.time);
              const y1 = seriesRef.current.priceToCoordinate(tempDrawing.point1.price);

              if (x1 !== null && y1 !== null) {
                return (
                  <line
                    key="preview"
                    x1={x1}
                    y1={y1}
                    x2={mousePosition.x}
                    y2={mousePosition.y}
                    stroke="rgba(41, 98, 255, 0.5)"
                    strokeWidth={2}
                  />
                );
              }
            } catch (e) {
              return null;
            }
            return null;
          })()}
        </svg>

        {/* Drawing Mode Indicator */}
        {drawingMode && (
          <div style={{
            position: 'absolute',
            top: '16px',
            left: '16px',
            backgroundColor: 'rgba(41, 98, 255, 0.95)',
            color: 'white',
            padding: '8px 16px',
            borderRadius: '8px',
            fontSize: '13px',
            fontWeight: 600,
            zIndex: 20,
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            boxShadow: '0 4px 12px rgba(41, 98, 255, 0.4)',
            border: '1px solid rgba(255, 255, 255, 0.2)'
          }}>
            <span style={{ fontSize: '16px' }}>
              {drawingMode === 'horizontal' && '─'}
              {drawingMode === 'trendline' && '╱'}
              {drawingMode === 'vertical' && '│'}
            </span>
            <span>
              {drawingMode === 'horizontal' && 'Click to place horizontal line'}
              {drawingMode === 'trendline' && (tempDrawing ? 'Click second point' : 'Click first point')}
              {drawingMode === 'vertical' && 'Click to place vertical line'}
            </span>
            <button
              onClick={() => {
                setDrawingMode(null);
                setTempDrawing(null);
              }}
              style={{
                background: 'rgba(255, 255, 255, 0.2)',
                border: 'none',
                borderRadius: '4px',
                color: 'white',
                cursor: 'pointer',
                padding: '2px 8px',
                fontSize: '12px',
                fontWeight: 600,
                marginLeft: '4px'
              }}
            >
              ESC
            </button>
          </div>
        )}

        {/* Drawings Count Badge */}
        {drawings.length > 0 && (
          <div style={{
            position: 'absolute',
            top: '16px',
            right: '16px',
            backgroundColor: 'rgba(30, 34, 45, 0.9)',
            color: '#2962ff',
            padding: '6px 12px',
            borderRadius: '8px',
            fontSize: '12px',
            fontWeight: 600,
            zIndex: 20,
            border: '1px solid rgba(41, 98, 255, 0.3)'
          }}>
            {drawings.length} drawing{drawings.length !== 1 ? 's' : ''}
          </div>
        )}
      </div>
    </div>
  );
}

export default CryptoChart;
