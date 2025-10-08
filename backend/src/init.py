from src.config import settings
from src.http_client import CMCHTTPClient, CoinGeckoClient, KrakenClient

# CoinMarketCap client for current prices and listings
cmc_client = CMCHTTPClient(
    base_url="https://pro-api.coinmarketcap.com",
    api_key=settings.CMC_API_KEY
)

# CoinGecko client for high-quality coin images
coingecko_client = CoinGeckoClient(
    api_key=settings.COINGECKO_API_KEY
)

# Kraken client for OHLC data with proper intervals
kraken_client = KrakenClient()