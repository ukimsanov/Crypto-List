import { Card, Button, Modal, Progress } from "antd"
import { LineChartOutlined, RiseOutlined, FallOutlined, ThunderboltOutlined, DollarOutlined, BarChartOutlined } from '@ant-design/icons'
import { useState, useEffect } from 'react'
import CryptoChart from './CryptoChart'

function CryptocurrencyCard(props) {

    const { currency } = props
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [priceFlash, setPriceFlash] = useState('')
    const [prevPrice, setPrevPrice] = useState(currency.quote.USD.price)

    const price = currency.quote.USD.price.toLocaleString(undefined, {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    });
    const percentChange24 = currency.quote.USD.percent_change_24h.toFixed(2);
    const percentChange7d = currency.quote.USD.percent_change_7d?.toFixed(2) || 0;
    const percentChange30d = currency.quote.USD.percent_change_30d?.toFixed(2) || 0;
    const colorChange = percentChange24 >= 0 ? 'text-green-500' : 'text-red-500';
    const colorChange7d = percentChange7d >= 0 ? 'text-green-400' : 'text-red-400';
    const colorChange30d = percentChange30d >= 0 ? 'text-green-400' : 'text-red-400';

    // Flash price on change
    useEffect(() => {
        if (prevPrice !== currency.quote.USD.price) {
            const isUp = currency.quote.USD.price > prevPrice
            setPriceFlash(isUp ? 'flash-green' : 'flash-red')
            setTimeout(() => setPriceFlash(''), 500)
            setPrevPrice(currency.quote.USD.price)
        }
    }, [currency.quote.USD.price])
    
    const marketCap = formatNumber(currency.quote.USD.market_cap);
    const volume24h = formatNumber(currency.quote.USD.volume_24h);
    const volumeChange24h = currency.quote.USD.volume_change_24h?.toFixed(2) || 0;

    const showChart = () => {
        setIsModalOpen(true)
    }

    const handleCancel = () => {
        setIsModalOpen(false)
    }

    return (
      <div>
        <Card
        title={
            <div className="flex items-center gap-3">
                <div className="flex-shrink-0">
                    <img
                        src={currency.coingecko_image?.large || `https://s2.coinmarketcap.com/static/img/coins/64x64/${currency.id}.png`}
                        alt={currency.name}
                        className="w-14 h-14 rounded-xl shadow-lg object-cover"
                    />
                </div>
                <div className="flex-1 min-w-0">
                    <div className="text-lg font-extrabold text-white mb-0.5 truncate leading-tight">{currency.name}</div>
                    <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs text-slate-400 font-semibold bg-slate-800/50 px-2.5 py-0.5 rounded-full">
                            {currency.symbol}
                        </span>
                        <span className="text-xs text-slate-500 font-medium">
                            Rank #{currency.cmc_rank || 'N/A'}
                        </span>
                    </div>
                </div>
            </div>
        }
        className="crypto-card"
        styles={{
            header: {
                padding: '20px 24px',
                borderBottom: '1px solid rgba(148, 163, 184, 0.1)',
            },
            body: {
                padding: '24px',
            }
        }}
        style={{
            background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.95) 0%, rgba(30, 27, 75, 0.95) 100%)',
            backdropFilter: 'blur(30px)',
            border: '1px solid rgba(139, 92, 246, 0.2)',
            borderRadius: '28px',
            boxShadow: '0 25px 70px rgba(0, 0, 0, 0.6), 0 0 0 1px rgba(255, 255, 255, 0.05) inset',
        }}
        >
        {/* Price Section with gradient background */}
        <div className={`${priceFlash} p-5 -mx-6 mb-5 bg-gradient-to-br from-purple-900/20 to-blue-900/20 rounded-2xl border border-purple-500/20 relative overflow-hidden`}>
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent"></div>
            <div className="relative">
                <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                        <DollarOutlined style={{ color: '#c084fc', fontSize: '16px' }} />
                        <span className="text-xs text-slate-400 font-semibold uppercase tracking-wide">Current Price</span>
                    </div>
                    <div className="flex items-center gap-2">
                        {percentChange24 >= 0 ? (
                            <RiseOutlined style={{ color: '#22c55e', fontSize: '18px' }} />
                        ) : (
                            <FallOutlined style={{ color: '#ef4444', fontSize: '18px' }} />
                        )}
                        <span className={`${colorChange} text-lg font-bold`}>
                            {percentChange24 >= 0 ? '+' : ''}{percentChange24}%
                        </span>
                        <span className="text-slate-500 text-xs font-medium">24h</span>
                    </div>
                </div>
                <div className="text-4xl font-black text-white tracking-tight drop-shadow-lg">${price}</div>
            </div>
        </div>

        {/* Stats Grid - 2 rows x 2 columns */}
        <div className="grid grid-cols-2 gap-3 mb-5">
            {/* 7 Days */}
            <div className="p-3 bg-slate-900/40 rounded-xl border border-slate-700/30 backdrop-blur-sm">
                <div className="text-xs text-slate-400 font-semibold mb-1 uppercase tracking-wider">7 Days</div>
                <div className={`${colorChange7d} text-base font-bold flex items-center gap-1`}>
                    {percentChange7d >= 0 ? '↗' : '↘'} {percentChange7d}%
                </div>
            </div>
            
            {/* 30 Days */}
            <div className="p-3 bg-slate-900/40 rounded-xl border border-slate-700/30 backdrop-blur-sm">
                <div className="text-xs text-slate-400 font-semibold mb-1 uppercase tracking-wider">30 Days</div>
                <div className={`${colorChange30d} text-base font-bold flex items-center gap-1`}>
                    {percentChange30d >= 0 ? '↗' : '↘'} {percentChange30d}%
                </div>
            </div>

            {/* Market Cap */}
            <div className="p-3 bg-gradient-to-r from-slate-900/40 to-slate-800/40 rounded-xl border border-slate-700/30 backdrop-blur-sm">
                <div className="flex items-center gap-1.5 mb-1">
                    <BarChartOutlined style={{ color: '#60a5fa', fontSize: '14px' }} />
                    <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Market Cap</span>
                </div>
                <div className="text-white text-base font-bold">${marketCap}</div>
            </div>

            {/* 24h Volume */}
            <div className="p-3 bg-gradient-to-r from-slate-900/40 to-slate-800/40 rounded-xl border border-slate-700/30 backdrop-blur-sm">
                <div className="flex items-center gap-1.5 mb-1">
                    <ThunderboltOutlined style={{ color: '#fbbf24', fontSize: '14px' }} />
                    <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Volume 24h</span>
                </div>
                <div className="flex items-center gap-1">
                    <span className="text-white text-base font-bold">${volume24h}</span>
                    <span className={`text-xs font-semibold ${volumeChange24h >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                        {volumeChange24h >= 0 ? '+' : ''}{volumeChange24h}%
                    </span>
                </div>
            </div>
        </div>

        {/* Live Indicator */}
        <div className="flex items-center gap-3 mb-5 p-3 bg-gradient-to-r from-green-900/20 to-emerald-900/20 border border-green-500/30 rounded-xl backdrop-blur-sm">
            <div className="relative flex-shrink-0">
                <div className="w-2.5 h-2.5 bg-green-500 rounded-full animate-pulse shadow-lg shadow-green-500/50"></div>
                <div className="absolute inset-0 bg-green-400 rounded-full animate-ping opacity-75"></div>
            </div>
            <div className="flex-1 min-w-0">
                <div className="text-xs text-green-400 font-bold uppercase tracking-wide">Live Data</div>
                <div className="text-xs text-green-300/70 font-medium">via Kraken WebSocket</div>
            </div>
        </div>

        {/* Chart Button */}
        <Button
            type="primary"
            icon={<LineChartOutlined style={{ fontSize: '18px' }} />}
            onClick={showChart}
            size="large"
            className="w-full h-14 text-base font-bold rounded-xl shadow-xl hover:shadow-2xl transition-all duration-300"
            style={{
                background: 'linear-gradient(135deg, #8b5cf6 0%, #6366f1 50%, #3b82f6 100%)',
                border: 'none',
                fontSize: '16px',
            }}
        >
            View Interactive Chart & Analysis
        </Button>
        </Card>

        <Modal
            title={null}
            open={isModalOpen}
            onCancel={handleCancel}
            footer={null}
            width={1200}
            centered
            styles={{
                body: {
                    background: 'linear-gradient(135deg, #1e1b4b 0%, #0f172a 100%)',
                    padding: '24px 32px',
                    minHeight: '600px',
                    borderRadius: '24px'
                },
                mask: { backgroundColor: 'rgba(0, 0, 0, 0.90)', backdropFilter: 'blur(8px)' }
            }}
            closeIcon={<span style={{ color: '#ffffff', fontSize: '32px', fontWeight: 300, textShadow: '0 0 10px rgba(139, 92, 246, 0.5)' }}>×</span>}
        >
            <CryptoChart
                currencyId={currency.id}
                symbol={currency.symbol}
                name={currency.name}
            />
        </Modal>
      </div>
    )
  }

  function formatNumber(num) {
    if (num >= 1e9) {
        return (num / 1e9).toFixed(2) + 'B';
    } else if (num >= 1e6) {
        return (num / 1e6).toFixed(2) + 'M';
    } else if (num >= 1e3) {
        return (num / 1e3).toFixed(2) + 'K';
    } else {
        return num.toFixed(2);
    }
}
  
  export default CryptocurrencyCard
  