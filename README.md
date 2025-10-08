# Crypto Tracker

A modern, real-time cryptocurrency tracking application with professional TradingView-style charts and live price updates via WebSocket. Built with FastAPI (backend) and React (frontend).

## ✨ Features

### Real-Time Data
- **Live Price Updates** via Kraken WebSocket API
- **Instant Price Notifications** with visual flash animations
- **Real-time Chart Updates** showing the latest price movements

### Professional Charts
- **TradingView-Style Candlestick Charts** using lightweight-charts
- **Multiple Timeframes**: 1m, 5m, 15m, 30m, 1h, 4h, 1D intervals
- **OHLC Data** from Kraken with proper interval-based candles
- **Interactive Charts** with zoom, pan, and crosshair features

### Modern UI/UX
- **Glassmorphism Design** with backdrop blur effects
- **Dark Mode Theme** optimized for crypto trading
- **Smooth Animations** and hover effects
- **Responsive Layout** for all screen sizes
- **High-Quality Coin Images** from CoinGecko API

### Data Sources
- **CoinMarketCap API** for cryptocurrency listings and market data
- **Kraken WebSocket v2** for real-time price streaming
- **Kraken OHLC API** for historical candlestick data
- **CoinGecko API** for high-resolution coin images

## 🛠️ Prerequisites
- Python 3.9+
- Node.js 16+
- CoinMarketCap API key
- CoinGecko API key (optional, for better images)

## 🚀 Setup

### Backend

1. **Navigate to backend directory**:
   ```bash
   cd backend
   ```

2. **Create virtual environment** (recommended):
   ```bash
   python -m venv venv
   source venv/bin/activate  # On macOS/Linux
   venv\Scripts\activate     # On Windows
   ```

3. **Install dependencies**:
   ```bash
   pip install -r requirements.txt
   ```

4. **Configure environment variables**:
   Create a `.env` file in the `backend` directory:
   ```env
   CMC_API_KEY=your_coinmarketcap_api_key_here
   COINGECKO_API_KEY=your_coingecko_api_key_here  # Optional
   ```

   Get your API keys:
   - CoinMarketCap: https://coinmarketcap.com/api/
   - CoinGecko: https://www.coingecko.com/en/api

5. **Start the backend server**:
   ```bash
   uvicorn src.main:app --reload --port 8000
   ```
   Backend will run on http://127.0.0.1:8000

### Frontend

1. **Navigate to frontend directory**:
   ```bash
   cd frontend
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Start development server**:
   ```bash
   npm run dev
   ```

4. **Open in browser**:
   Navigate to http://localhost:5173

## 🏗️ Tech Stack

### Backend
- **FastAPI** - Modern Python web framework
- **async-lru** - Async LRU cache for API responses
- **websockets** - WebSocket client for Kraken
- **httpx** - Async HTTP client
- **python-dotenv** - Environment variable management

### Frontend
- **React** - UI framework
- **Vite** - Build tool and dev server
- **Ant Design** - UI component library
- **Tailwind CSS** - Utility-first CSS framework
- **lightweight-charts** - TradingView charts library
- **axios** - HTTP client

## 📡 API Endpoints

### REST Endpoints
- `GET /cryptocurrencies` - List all supported cryptocurrencies
- `GET /cryptocurrencies/{id}` - Get detailed info for a specific cryptocurrency
- `GET /cryptocurrencies/{id}/history?interval={minutes}` - Get OHLC candlestick data
  - Supported intervals: 1, 5, 15, 30, 60, 240, 1440 (minutes)

### WebSocket Endpoints
- `WS /ws/prices/{currency_id}` - Real-time price updates via Kraken WebSocket

## 🎨 UI Features

- **Glassmorphism Sidebar** with frosted glass effect
- **Gradient Backgrounds** for modern aesthetic
- **Live Price Flash** - Green for price increases, red for decreases
- **Smooth Transitions** on all interactive elements
- **Professional Color Scheme** - Slate, purple, and blue gradients
- **Custom Scrollbar** styling for better appearance
- **Hover Effects** with scale transforms and shadow enhancements

## 📝 License
MIT