# Crypto-List

A simple cryptocurrency tracker built with FastAPI (backend) and React (frontend). Fetches data from the CoinMarketCap API and displays market information.

## Features
- List and search cryptocurrencies by market cap  
- Responsive UI built with React and Tailwind

## Prerequisites
- Python 3.9+  
- Node.js 16+  
- CoinMarketCap API key

## Setup

### Backend
1. Create a virtual environment (optional):
   ```bash
   python -m venv venv
   source venv/bin/activate  # On macOS/Linux
   ```
2. Install Python dependencies:
   ```bash
   pip install -r requirements.txt
   ```
3. In `.env`, add your CoinMarketCap API key.
4. Start the backend server (on localhost:8000 by default):
   ```bash
   uvicorn src.main:app --reload
   ```

### Frontend
1. Navigate to the frontend folder:
   ```bash
   cd frontend
   ```
2. Install Node.js dependencies:
   ```bash
   npm install
   ```
3. Start the development server:
   ```bash
   npm run dev
   ```
4. Open [http://localhost:5173](http://localhost:5173).

## License
MIT