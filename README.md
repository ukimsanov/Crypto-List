# 📊 CryptoLive

> A modern, real-time cryptocurrency tracking application with professional TradingView-style charts and live WebSocket price updates.

**[Live Demo](#) • [Features](#-features) • [Tech Stack](#-tech-stack) • [Setup](#-quick-start)**

---

## 🎯 What It Does

CryptoLive provides **real-time cryptocurrency market tracking** with interactive charts and live price updates. Built for traders and crypto enthusiasts who need instant market data visualization.

**Key Capabilities:**
- 📈 Real-time price streaming via Kraken WebSocket
- 📉 Interactive TradingView-style candlestick charts
- 🔍 Search and filter through top cryptocurrencies
- 📱 Fully responsive design for desktop and mobile
- ⚡ Flash price notifications (green/red) on updates
- 🎨 Modern glassmorphic UI with smooth animations

## 🛠️ Built With

**Frontend:** React • Vite • Ant Design • Tailwind CSS • Lightweight Charts  
**Backend:** Python • FastAPI • WebSockets • Async HTTPX  
**APIs:** CoinMarketCap • Kraken WebSocket v2 • CoinGecko

## ✨ Features

### 📊 Real-Time Data
- Live price updates via **Kraken WebSocket API** with sub-second latency
- Instant visual flash animations (green ↑ / red ↓) on price changes
- Real-time chart updates showing latest market movements

### 📈 Professional Charts
- **TradingView-style candlestick charts** using lightweight-charts library
- Multiple timeframes: **1m, 5m, 15m, 30m, 1h, 4h, 1D**
- Interactive features: zoom, pan, crosshair, and price tooltips
- OHLC (Open, High, Low, Close) data from Kraken

### 🎨 Modern UI/UX
- **Glassmorphism design** with backdrop blur effects
- Dark theme optimized for extended viewing
- **Search functionality** to filter cryptocurrencies by name or symbol
- Responsive layout adapting to all screen sizes
- Smooth CSS animations and micro-interactions
- Loading skeletons and error states for better UX

### 📡 Data Integration
- **CoinMarketCap API** - Market data and cryptocurrency listings
- **Kraken WebSocket v2** - Real-time price streaming
- **Kraken OHLC API** - Historical candlestick data
- **CoinGecko API** - High-resolution coin images

## � Quick Start

### Prerequisites
```
Python 3.9+
Node.js 16+
CoinMarketCap API key (free tier available)
CoinGecko API key (optional)
```

### Installation

#### 1️⃣ Backend Setup

```bash
cd backend

# Create virtual environment
python -m venv venv
source venv/bin/activate  # macOS/Linux
# OR: venv\Scripts\activate  (Windows)

# Install dependencies
pip install -r requirements.txt
```

Create `.env` file in `backend` directory:
```env
CMC_API_KEY=your_coinmarketcap_api_key
COINGECKO_API_KEY=your_coingecko_api_key  # Optional
```

> 🔑 Get API keys: [CoinMarketCap](https://coinmarketcap.com/api/) • [CoinGecko](https://www.coingecko.com/en/api)

Start the server:
```bash
uvicorn src.main:app --reload --port 8000
```
✅ Backend running at **http://127.0.0.1:8000**

#### 2️⃣ Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Start development server
npm run dev
```
✅ Open **http://localhost:5173** in your browser 🚀

---

## 🏗️ Tech Stack

### Backend
| Technology | Purpose |
|------------|---------|
| **FastAPI** | High-performance Python web framework |
| **WebSockets** | Real-time bidirectional communication |
| **async-lru** | Async LRU caching for API optimization |
| **httpx** | Async HTTP client for external APIs |

### Frontend
| Technology | Purpose |
|------------|---------|
| **React 18** | Component-based UI framework |
| **Vite** | Lightning-fast build tool & dev server |
| **Ant Design** | Professional UI component library |
| **Tailwind CSS** | Utility-first styling framework |
| **lightweight-charts** | TradingView-style charting library |

---

## 📡 API Documentation

### REST Endpoints
```
GET  /cryptocurrencies              → List all supported cryptocurrencies
GET  /cryptocurrencies/{id}          → Get detailed cryptocurrency info
GET  /cryptocurrencies/{id}/history  → Get OHLC candlestick data
     ?interval={minutes}             → (1, 5, 15, 30, 60, 240, 1440)
```

### WebSocket
```
WS   /ws/prices/{currency_id}       → Real-time price stream from Kraken
```

---

## 🎨 Design Highlights

- 🌌 **Glassmorphism UI** with frosted glass sidebar and backdrop blur
- 🌈 **Purple gradient theme** with professional dark mode palette
- ⚡ **Micro-interactions** - Flash animations on price changes (green ↑ / red ↓)
- 📱 **Mobile-responsive** with hamburger menu and touch-optimized controls
- 🔍 **Smart search** - Filter cryptocurrencies by name or symbol
- 💫 **Smooth animations** - Custom CSS keyframes for all transitions
- 🎯 **Loading states** - Skeleton screens and error boundaries

---

## 🤝 Contributing

Contributions are welcome! Feel free to:
- 🐛 Report bugs
- 💡 Suggest new features
- 🔧 Submit pull requests

---

## 📄 License

This project is open source and available under the [MIT License](LICENSE).

---

<div align="center">

**Built with ❤️ using React and FastAPI**

⭐ Star this repo if you found it useful!

</div>