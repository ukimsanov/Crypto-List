"""
Mapping between cryptocurrency symbols/names and CoinGecko IDs
This allows us to fetch OHLC data from CoinGecko using data from CoinMarketCap
"""

# Map common cryptocurrency names/symbols to CoinGecko IDs
COIN_ID_MAP = {
    # Top cryptocurrencies by market cap
    "bitcoin": "bitcoin",
    "btc": "bitcoin",
    "ethereum": "ethereum",
    "eth": "ethereum",
    "tether": "tether",
    "usdt": "tether",
    "binance coin": "binancecoin",
    "bnb": "binancecoin",
    "solana": "solana",
    "sol": "solana",
    "xrp": "ripple",
    "ripple": "ripple",
    "usd coin": "usd-coin",
    "usdc": "usd-coin",
    "cardano": "cardano",
    "ada": "cardano",
    "avalanche": "avalanche-2",
    "avax": "avalanche-2",
    "dogecoin": "dogecoin",
    "doge": "dogecoin",
    "polkadot": "polkadot",
    "dot": "polkadot",
    "polygon": "matic-network",
    "matic": "matic-network",
    "shiba inu": "shiba-inu",
    "shib": "shiba-inu",
    "litecoin": "litecoin",
    "ltc": "litecoin",
    "chainlink": "chainlink",
    "link": "chainlink",
    "tron": "tron",
    "trx": "tron",
    "bitcoin cash": "bitcoin-cash",
    "bch": "bitcoin-cash",
    "uniswap": "uniswap",
    "uni": "uniswap",
    "stellar": "stellar",
    "xlm": "stellar",
    "cosmos": "cosmos",
    "atom": "cosmos",
    "monero": "monero",
    "xmr": "monero",
    "ethereum classic": "ethereum-classic",
    "etc": "ethereum-classic",
    "hedera": "hedera-hashgraph",
    "hbar": "hedera-hashgraph",
    "filecoin": "filecoin",
    "fil": "filecoin",
    "aptos": "aptos",
    "apt": "aptos",
    "the open network": "the-open-network",
    "ton": "the-open-network",
    "internet computer": "internet-computer",
    "icp": "internet-computer",
    "near protocol": "near",
    "near": "near",
    "vechain": "vechain",
    "vet": "vechain",
    "algorand": "algorand",
    "algo": "algorand",
}


# Map common symbols to Kraken OHLC API pairs (format: XXBTZUSD)
KRAKEN_OHLC_MAP = {
    "BTC": "XXBTZUSD",
    "ETH": "XETHZUSD",
    "SOL": "SOLUSD",
    "XRP": "XXRPZUSD",
    "ADA": "ADAUSD",
    "DOGE": "XDGUSD",
    "DOT": "DOTUSD",
    "MATIC": "MATICUSD",
    "LTC": "XLTCZUSD",
    "LINK": "LINKUSD",
    "UNI": "UNIUSD",
    "XLM": "XXLMZUSD",
    "ATOM": "ATOMUSD",
    "XMR": "XXMRZUSD",
    "ETC": "XETCZUSD",
    "FIL": "FILUSD",
    "NEAR": "NEARUSD",
    "ALGO": "ALGOUSD",
}

# Map common symbols to Kraken WebSocket v2 pairs (format: BTC/USD)
# Note: Kraken v2 uses BTC/USD not XBT/USD
KRAKEN_WS_MAP = {
    "BTC": "BTC/USD",
    "ETH": "ETH/USD",
    "SOL": "SOL/USD",
    "XRP": "XRP/USD",
    "ADA": "ADA/USD",
    "DOGE": "DOGE/USD",
    "DOT": "DOT/USD",
    "MATIC": "MATIC/USD",
    "LTC": "LTC/USD",
    "LINK": "LINK/USD",
    "UNI": "UNI/USD",
    "XLM": "XLM/USD",
    "ATOM": "ATOM/USD",
    "XMR": "XMR/USD",
    "ETC": "ETC/USD",
    "FIL": "FIL/USD",
    "NEAR": "NEAR/USD",
    "ALGO": "ALGO/USD",
}


def get_coingecko_id(name: str, symbol: str) -> str:
    """
    Get CoinGecko ID from cryptocurrency name or symbol

    Args:
        name: Full name of the cryptocurrency (e.g., "Bitcoin")
        symbol: Symbol of the cryptocurrency (e.g., "BTC")

    Returns:
        CoinGecko ID string (e.g., "bitcoin")
        Defaults to lowercased name if not found in mapping
    """
    # Try symbol first (more specific)
    symbol_lower = symbol.lower()
    if symbol_lower in COIN_ID_MAP:
        return COIN_ID_MAP[symbol_lower]

    # Try full name
    name_lower = name.lower()
    if name_lower in COIN_ID_MAP:
        return COIN_ID_MAP[name_lower]

    # Default: return lowercased name (works for many coins)
    return name_lower.replace(" ", "-")


def get_kraken_symbol(symbol: str) -> str:
    """Get Kraken OHLC API pair from crypto symbol (format: XXBTZUSD)"""
    symbol_upper = symbol.upper()
    return KRAKEN_OHLC_MAP.get(symbol_upper, f"{symbol_upper}USD")


def get_kraken_ws_symbol(symbol: str) -> str:
    """Get Kraken WebSocket pair from crypto symbol (format: XBT/USD)"""
    symbol_upper = symbol.upper()
    return KRAKEN_WS_MAP.get(symbol_upper, f"{symbol_upper}/USD")
