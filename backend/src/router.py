from fastapi import APIRouter, HTTPException, Query
from src.init import cmc_client, coingecko_client, kraken_client
from src.coin_mapping import get_coingecko_id, get_kraken_symbol

router = APIRouter(
    prefix="/cryptocurrencies",
)

@router.get("")
async def get_cryptocurrencies():
    """Get list of top cryptocurrencies by market cap"""
    return await cmc_client.get_listings()


@router.get("/{currency_id}")
async def get_cryptocurrency(currency_id: int):
    """Get detailed information about a specific cryptocurrency with high-quality image"""
    try:
        # Get data from CoinMarketCap
        cmc_data = await cmc_client.get_currency(currency_id)

        # Try to get CoinGecko image (high quality)
        try:
            name = cmc_data.get("name", "")
            symbol = cmc_data.get("symbol", "")
            coingecko_id = get_coingecko_id(name, symbol)
            coin_info = await coingecko_client.get_coin_info(coingecko_id)

            # Add CoinGecko image URLs to response
            cmc_data["coingecko_image"] = coin_info.get("image", {})
        except Exception as e:
            # If CoinGecko fails, just use CoinMarketCap image
            print(f"Failed to fetch CoinGecko image: {e}")

        return cmc_data
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/{currency_id}/history")
async def get_cryptocurrency_history(
    currency_id: int,
    interval: int = Query(default=60, description="Interval in minutes (1, 5, 15, 30, 60, 240, 1440)")
):
    """
    Get historical OHLC (candlestick) data for a cryptocurrency from Kraken

    Args:
        currency_id: CoinMarketCap currency ID
        interval: Timeframe interval in minutes
                 1 = 1min, 5 = 5min, 15 = 15min, 30 = 30min, 60 = 1hour,
                 240 = 4hours, 1440 = 1day

    Returns:
        OHLC data: List of [timestamp (ms), open, high, low, close]
    """
    try:
        # Get currency details from CoinMarketCap
        currency_data = await cmc_client.get_currency(currency_id)
        symbol = currency_data.get("symbol", "")

        # Map to Kraken trading pair
        kraken_pair = get_kraken_symbol(symbol)

        # Fetch OHLC data from Kraken
        raw_data = await kraken_client.get_ohlc(
            pair=kraken_pair,
            interval=interval
        )

        # Transform Kraken format [timestamp, open, high, low, close, vwap, volume, count]
        # to our format [timestamp_ms, open, high, low, close]
        ohlc_data = [
            [
                int(candle[0] * 1000),  # Convert seconds to milliseconds
                float(candle[1]),       # open
                float(candle[2]),       # high
                float(candle[3]),       # low
                float(candle[4])        # close
            ]
            for candle in raw_data
        ]

        return {
            "symbol": symbol,
            "kraken_pair": kraken_pair,
            "interval": interval,
            "data": ohlc_data
        }

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to fetch historical data: {str(e)}"
        )


