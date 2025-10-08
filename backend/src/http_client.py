from aiohttp import ClientSession
from async_lru import alru_cache


class HTTPClient:
    """Base HTTP client for API calls"""
    def __init__(self, base_url: str, api_key: str):
        self.session = ClientSession(
            base_url=base_url,
            headers={
                'X-CMC_PRO_API_KEY': api_key,
            }
        )


class CMCHTTPClient(HTTPClient):
    """CoinMarketCap API client for current prices and listings"""

    @alru_cache
    async def get_listings(self):
        async with self.session.get("/v1/cryptocurrency/listings/latest") as resp:
            result = await resp.json()
            return result["data"]

    @alru_cache
    async def get_currency(self, currency_id: int):
        async with self.session.get(
                "/v2/cryptocurrency/quotes/latest",
                     params={"id": currency_id}
        ) as resp:
            result = await resp.json()
            return result["data"][str(currency_id)]


class CoinGeckoClient:
    """CoinGecko API client for historical OHLC data"""

    def __init__(self, api_key: str | None = None):
        """
        Initialize CoinGecko client

        Args:
            api_key: Optional API key for Demo/Pro plans. If None, uses public API.
        """
        self.base_url = "https://api.coingecko.com/api/v3/"  # Note: aiohttp requires trailing slash
        self.api_key = api_key
        # Create session with API key in headers if provided
        headers = {}
        if api_key:
            headers['x-cg-demo-api-key'] = api_key
        self.session = ClientSession(
            base_url=self.base_url,
            headers=headers
        )

    @alru_cache(maxsize=128)
    async def get_ohlc(self, coin_id: str, vs_currency: str = "usd", days: int | str = 7):
        """
        Get OHLC (candlestick) data for a coin

        Args:
            coin_id: CoinGecko coin ID (e.g., 'bitcoin', 'ethereum')
            vs_currency: Target currency (default: 'usd')
            days: Number of days (1/7/14/30/90/180/365/max)

        Returns:
            List of [timestamp, open, high, low, close] arrays
        """
        async with self.session.get(
            f"coins/{coin_id}/ohlc",  # No leading slash - base_url already ends with /
            params={"vs_currency": vs_currency, "days": days}
        ) as resp:
            return await resp.json()

    @alru_cache(maxsize=256)
    async def get_coin_info(self, coin_id: str):
        """
        Get coin metadata including name, symbol, and image URLs

        Args:
            coin_id: CoinGecko coin ID (e.g., 'bitcoin', 'ethereum')

        Returns:
            Dict with coin info including image URLs
        """
        async with self.session.get(
            f"coins/{coin_id}",
            params={"localization": "false", "tickers": "false", "market_data": "false",
                    "community_data": "false", "developer_data": "false"}
        ) as resp:
            data = await resp.json()
            return {
                "id": data.get("id"),
                "symbol": data.get("symbol"),
                "name": data.get("name"),
                "image": data.get("image", {})  # Contains thumb, small, large URLs
            }

    async def close(self):
        """Close the HTTP session"""
        await self.session.close()


class KrakenClient:
    """Kraken API client for OHLC data with proper intervals"""

    def __init__(self):
        self.base_url = "https://api.kraken.com/0/public/"
        self.session = ClientSession(base_url=self.base_url)

    @alru_cache(maxsize=128)
    async def get_ohlc(self, pair: str, interval: int = 60):
        """
        Get OHLC data from Kraken

        Args:
            pair: Kraken trading pair (e.g., 'XBTUSD', 'ETHUSD')
            interval: Time frame interval in minutes (1, 5, 15, 30, 60, 240, 1440, 10080, 21600)
                     1 = 1min, 5 = 5min, 15 = 15min, 30 = 30min, 60 = 1hour,
                     240 = 4hours, 1440 = 1day, 10080 = 1week, 21600 = 15days

        Returns:
            List of [timestamp, open, high, low, close, vwap, volume, count] arrays
        """
        async with self.session.get(
            "OHLC",
            params={"pair": pair, "interval": interval}
        ) as resp:
            data = await resp.json()
            if data.get("error") and len(data["error"]) > 0:
                raise Exception(f"Kraken API error: {data['error']}")

            # Get the pair key (Kraken returns normalized pair name)
            result_keys = [k for k in data['result'].keys() if k != 'last']
            if not result_keys:
                raise Exception("No OHLC data returned")

            pair_key = result_keys[0]
            return data['result'][pair_key]

    async def close(self):
        """Close the HTTP session"""
        await self.session.close()
