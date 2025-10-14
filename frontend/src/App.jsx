import React, { useEffect, useState } from 'react';
import { Menu, Input } from 'antd';
import { MenuOutlined, CloseOutlined, RocketOutlined, SearchOutlined } from '@ant-design/icons';
import axios from 'axios'
import CryptocurrencyCard from './components/CryptocurrencyCard';
import SkeletonCard from './components/SkeletonCard';
import ErrorState from './components/ErrorState';
import { API_URL, WS_URL } from './config';

const { Search } = Input;

const App = () => {
  const [currencies, setCurrencies] = useState([])
  const [allCurrencies, setAllCurrencies] = useState([]) // Store all currencies for filtering
  const [currencyId, setCurrencyId] = useState(1)
  const [currencyData, setCurrencyData] = useState(null)
  const [prevPrice, setPrevPrice] = useState(null)
  const [prevCurrencyId, setPrevCurrencyId] = useState(null)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [error, setError] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [coldStartLoading, setColdStartLoading] = useState(true)
  const [loadingSeconds, setLoadingSeconds] = useState(0)



  const fetchCurrencies = () => {
    axios.get(`${API_URL}/cryptocurrencies`)
      .then(r => {
        const currenciesResponse = r.data
        setAllCurrencies(currenciesResponse) // Store all currencies
        const menuItems = [
          {
            key: 'g1',
            label: 'Cryptocurrencies',
            type: 'group',
            children: currenciesResponse.map(c => {
              return {label: `${c.symbol}/USD`, key: c.id, symbol: c.symbol, name: c.name}
            } )
          }
        ]
        setCurrencies(menuItems)
        setError(null)
        // Connection established, hide cold start screen
        setColdStartLoading(false)
      })
      .catch(err => {
        console.error('Failed to fetch currencies:', err)
        setError('Failed to load cryptocurrency list')
        // Even on error, hide cold start screen after attempt
        setColdStartLoading(false)
      })
  }

  // Filter currencies based on search query
  const filterCurrencies = (query) => {
    setSearchQuery(query)
    
    if (!query.trim()) {
      // If search is empty, show all currencies
      const menuItems = [
        {
          key: 'g1',
          label: 'Cryptocurrencies',
          type: 'group',
          children: allCurrencies.map(c => {
            return {label: `${c.symbol}/USD`, key: c.id, symbol: c.symbol, name: c.name}
          })
        }
      ]
      setCurrencies(menuItems)
      return
    }

    // Filter currencies by name or symbol
    const filtered = allCurrencies.filter(c => 
      c.name.toLowerCase().includes(query.toLowerCase()) ||
      c.symbol.toLowerCase().includes(query.toLowerCase())
    )

    const menuItems = [
      {
        key: 'g1',
        label: `Found ${filtered.length} result${filtered.length !== 1 ? 's' : ''}`,
        type: 'group',
        children: filtered.map(c => {
          return {label: `${c.symbol}/USD`, key: c.id, symbol: c.symbol, name: c.name}
        })
      }
    ]
    setCurrencies(menuItems)
  }

  const fetchCurrency = () => {
    setIsLoading(true)
    // Fetch full currency data from CoinMarketCap
    axios.get(`${API_URL}/cryptocurrencies/${currencyId}`)
      .then(r => {
        setCurrencyData(r.data)
        setError(null)
        setIsLoading(false)
      })
      .catch(err => {
        console.error('Failed to fetch currency:', err)
        setError('Failed to load cryptocurrency data')
        setIsLoading(false)
      })
  }

  const handleRetry = () => {
    setError(null)
    fetchCurrencies()
    fetchCurrency()
  }

  useEffect(() => {
    fetchCurrencies()
  }, [])

  // Timer for cold start loading screen
  useEffect(() => {
    if (coldStartLoading) {
      const interval = setInterval(() => {
        setLoadingSeconds(prev => prev + 1)
      }, 1200)

      return () => clearInterval(interval)
    }
  }, [coldStartLoading])

  // Real-time price updates using Kraken WebSocket
  useEffect(() => {
    // Don't clear currencyData immediately to prevent blink
    setPrevPrice(null)
    setPrevCurrencyId(null)
    setError(null)
    setIsLoading(true)
    console.log(`🔄 Connecting to Kraken WebSocket for currency ID: ${currencyId}`)

    // Fetch initial full data
    fetchCurrency()

    // Connect to Kraken WebSocket
    const ws = new WebSocket(`${WS_URL}/ws/prices/${currencyId}`)

    ws.onopen = () => {
      console.log(`✅ WebSocket connected (Kraken) for currency ID: ${currencyId}`)
    }

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data)
      const timestamp = new Date().toLocaleTimeString()

      if (data.type === 'price_update') {
        const price = data.price
        const symbol = data.symbol

        const formattedPrice = price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })

        // Log price change (only compare if same currency)
        if (prevPrice !== null && prevPrice !== price && prevCurrencyId === currencyId) {
          const change = price - prevPrice
          const changePercent = ((change / prevPrice) * 100).toFixed(4)
          const arrow = change > 0 ? '📈' : '📉'
          const color = change > 0 ? '\x1b[32m' : '\x1b[31m'
          const reset = '\x1b[0m'
          console.log(`${color}[${timestamp}] ${arrow} ${symbol} = $${formattedPrice} (${change > 0 ? '+' : ''}$${change.toFixed(2)} / ${change > 0 ? '+' : ''}${changePercent}%)${reset}`)
        } else {
          console.log(`[${timestamp}] 💰 ${symbol} = $${formattedPrice}`)
        }

        setPrevPrice(price)
        setPrevCurrencyId(currencyId)

        // Update price in currencyData
        setCurrencyData(prev => {
          if (!prev) return null
          return {
            ...prev,
            quote: {
              ...prev.quote,
              USD: {
                ...prev.quote.USD,
                price: price
              }
            }
          }
        })
      }
    }

    ws.onerror = (error) => {
      console.error('❌ WebSocket error:', error)
    }

    ws.onclose = () => {
      console.log(`⏹️ WebSocket closed for currency ID: ${currencyId}`)
    }

    // Send heartbeat every 30 seconds to keep connection alive
    const heartbeat = setInterval(() => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send('ping')
      }
    }, 30000)

    return () => {
      console.log(`🔌 Disconnecting WebSocket for currency ID: ${currencyId}`)
      clearInterval(heartbeat)
      ws.close()
    }
  }, [currencyId]);
  

  const onClick = (e) => {
    setCurrencyId(e.key)
    setMobileMenuOpen(false) // Close mobile menu on selection
  };


  // Cold start loading screen
  if (coldStartLoading) {
    return (
      <div className='flex items-center justify-center min-h-screen bg-gradient-to-br from-slate-950 via-purple-950 to-slate-950 relative overflow-hidden'>
        {/* Animated background elements */}
        <div className='absolute inset-0 overflow-hidden pointer-events-none'>
          <div className='absolute top-0 left-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl animate-pulse'></div>
          <div className='absolute bottom-0 right-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl animate-pulse' style={{ animationDelay: '1s' }}></div>
          <div className='absolute top-1/2 left-1/2 w-96 h-96 bg-violet-500/10 rounded-full blur-3xl animate-pulse' style={{ animationDelay: '2s' }}></div>
        </div>

        {/* Loading content */}
        <div className='relative z-10 text-center px-6'>
          <div className='w-20 h-20 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-purple-500 to-blue-600 flex items-center justify-center shadow-2xl animate-pulse'>
            <RocketOutlined className='text-white text-4xl' />
          </div>
          <h1 className='text-4xl font-extrabold bg-gradient-to-r from-purple-400 via-violet-400 to-blue-400 bg-clip-text text-transparent mb-4'>
            CryptoLive
          </h1>
          <p className='text-slate-300 text-lg font-medium mb-2'>Waking up the server...</p>

          {/* Timer display */}
          <div className='text-6xl font-bold text-white my-6'>
            {loadingSeconds}s
          </div>

          <p className='text-slate-500 text-sm'>Waiting for server response...</p>

          {/* Loading dots animation */}
          <div className='flex justify-center gap-2 mt-6'>
            <div className='w-3 h-3 bg-purple-500 rounded-full animate-bounce' style={{ animationDelay: '0s' }}></div>
            <div className='w-3 h-3 bg-violet-500 rounded-full animate-bounce' style={{ animationDelay: '0.2s' }}></div>
            <div className='w-3 h-3 bg-blue-500 rounded-full animate-bounce' style={{ animationDelay: '0.4s' }}></div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className='flex min-h-screen bg-gradient-to-br from-slate-950 via-purple-950 to-slate-950 relative overflow-hidden'>
      {/* Animated background elements */}
      <div className='absolute inset-0 overflow-hidden pointer-events-none'>
        <div className='absolute top-0 left-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl animate-pulse'></div>
        <div className='absolute bottom-0 right-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl animate-pulse' style={{ animationDelay: '1s' }}></div>
        <div className='absolute top-1/2 left-1/2 w-96 h-96 bg-violet-500/10 rounded-full blur-3xl animate-pulse' style={{ animationDelay: '2s' }}></div>
      </div>

      {/* Mobile Menu Button */}
      <button
        onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        className='lg:hidden fixed top-4 left-4 z-50 w-12 h-12 rounded-xl bg-slate-900/80 backdrop-blur-lg border border-slate-700/50 flex items-center justify-center text-slate-300 hover:text-purple-400 hover:border-purple-500/50 transition-all shadow-lg'
      >
        {mobileMenuOpen ? <CloseOutlined className='text-xl' /> : <MenuOutlined className='text-xl' />}
      </button>

      {/* Sidebar */}
      <div className={`
        fixed lg:static inset-y-0 left-0 z-40
        w-80 transform transition-transform duration-300 ease-in-out
        ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        bg-slate-950/70 backdrop-blur-2xl border-r border-slate-800/50 shadow-2xl
      `}>
        <div className='p-6 border-b border-slate-800/50 bg-gradient-to-r from-purple-900/20 to-transparent'>
          <div className='flex items-center gap-3 mb-2'>
            <div className='w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-blue-600 flex items-center justify-center shadow-lg'>
              <RocketOutlined className='text-white text-xl' />
            </div>
            <h1 className='text-2xl font-extrabold bg-gradient-to-r from-purple-400 via-violet-400 to-blue-400 bg-clip-text text-transparent'>
              CryptoLive
            </h1>
          </div>
          <p className='text-slate-400 text-sm font-medium'>Real-time market tracking</p>
          <div className='mt-3 flex items-center gap-2 text-xs'>
            <div className='w-2 h-2 bg-green-500 rounded-full animate-pulse'></div>
            <span className='text-green-400 font-semibold'>Live via Kraken</span>
          </div>
        </div>
        
        {/* Search Input */}
        <div className='p-4'>
          <Input
            placeholder="Search cryptocurrencies..."
            value={searchQuery}
            onChange={(e) => filterCurrencies(e.target.value)}
            prefix={<SearchOutlined style={{ color: '#a78bfa' }} />}
            className='crypto-search'
            style={{
              background: 'rgba(30, 41, 59, 0.5)',
              borderColor: 'rgba(139, 92, 246, 0.3)',
              color: '#e2e8f0'
            }}
          />
        </div>
        
        <Menu
          onClick={onClick}
          style={{
            background: 'transparent',
            border: 'none',
            color: '#94a3b8'
          }}
          defaultSelectedKeys={['1']}
          mode="inline"
          items={currencies}
          className='h-[calc(100vh-230px)] overflow-y-auto crypto-menu'
        />
      </div>

      {/* Overlay for mobile */}
      {mobileMenuOpen && (
        <div
          className='lg:hidden fixed inset-0 bg-black/60 backdrop-blur-sm z-30'
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Main Content */}
      <div className='flex-1 flex items-center justify-center p-4 sm:p-6 lg:p-8 relative z-10'>
        {error ? (
          <ErrorState onRetry={handleRetry} message={error} />
        ) : currencyData ? (
          <div className='w-full max-w-2xl'>
            <CryptocurrencyCard currency={currencyData}/>
          </div>
        ) : isLoading ? (
          <div className='w-full max-w-2xl'>
            <SkeletonCard />
          </div>
        ) : null}
      </div>
    </div>
  );
};
export default App;