"""
Kraken WebSocket manager for real-time cryptocurrency prices
Kraken has no geo-restrictions unlike Binance
"""
import json
import asyncio
import websockets
from typing import Set, Dict
from fastapi import WebSocket
from src.coin_mapping import get_kraken_ws_symbol


class KrakenWebSocketManager:
    def __init__(self):
        # Map WebSocket connection -> subscribed symbol
        self.client_subscriptions: Dict[WebSocket, str] = {}
        # Map symbol -> set of WebSocket connections
        self.symbol_clients: Dict[str, Set[WebSocket]] = {}
        self.kraken_ws = None
        self.subscribed_symbols: Set[str] = set()
        self.current_prices: Dict[str, float] = {}
        self.running = False

    async def connect_client(self, websocket: WebSocket, symbol: str):
        """Connect a new client WebSocket and subscribe to a symbol"""
        await websocket.accept()

        kraken_symbol = get_kraken_ws_symbol(symbol)

        # Track client subscription
        self.client_subscriptions[websocket] = kraken_symbol

        # Add client to symbol's client set
        if kraken_symbol not in self.symbol_clients:
            self.symbol_clients[kraken_symbol] = set()
        self.symbol_clients[kraken_symbol].add(websocket)

        print(f"✅ Client connected for {kraken_symbol}. Total connections: {len(self.client_subscriptions)}")

        # Send current price immediately if available
        if kraken_symbol in self.current_prices:
            await websocket.send_json({
                "type": "price_update",
                "symbol": kraken_symbol.replace("XBT", "BTC"),
                "price": self.current_prices[kraken_symbol],
                "timestamp": None
            })

        # Add symbol to subscriptions if new
        if kraken_symbol not in self.subscribed_symbols:
            self.subscribed_symbols.add(kraken_symbol)

            # Start Kraken connection if not running
            if not self.running:
                self.running = True
                asyncio.create_task(self.start_kraken_connection())
            else:
                # Resubscribe with updated symbol list
                await self.resubscribe()

    def disconnect_client(self, websocket: WebSocket):
        """Disconnect a client WebSocket"""
        if websocket not in self.client_subscriptions:
            return

        # Get the symbol this client was subscribed to
        symbol = self.client_subscriptions[websocket]

        # Remove from client subscriptions
        del self.client_subscriptions[websocket]

        # Remove from symbol's client set
        if symbol in self.symbol_clients:
            self.symbol_clients[symbol].discard(websocket)

            # If no more clients for this symbol, unsubscribe
            if not self.symbol_clients[symbol]:
                del self.symbol_clients[symbol]
                self.subscribed_symbols.discard(symbol)
                print(f"📉 No more clients for {symbol}, unsubscribing")

        print(f"❌ Client disconnected. Total connections: {len(self.client_subscriptions)}")

        # Stop Kraken WS if no clients
        if not self.client_subscriptions:
            self.running = False
            print("🛑 Stopped Kraken WebSocket (no active clients)")

    async def resubscribe(self):
        """Resubscribe to Kraken with updated symbol list"""
        if self.kraken_ws and self.subscribed_symbols:
            try:
                # Unsubscribe from all
                unsubscribe_msg = {
                    "event": "unsubscribe",
                    "subscription": {"name": "ticker"}
                }
                await self.kraken_ws.send(json.dumps(unsubscribe_msg))

                # Subscribe to current symbols
                subscription_msg = {
                    "event": "subscribe",
                    "pair": list(self.subscribed_symbols),
                    "subscription": {"name": "ticker"}
                }
                await self.kraken_ws.send(json.dumps(subscription_msg))
                print(f"🔄 Resubscribed to: {', '.join(self.subscribed_symbols)}")
            except Exception as e:
                print(f"❌ Error resubscribing: {e}")

    async def start_kraken_connection(self):
        """Start connection to Kraken WebSocket API"""
        ws_url = "wss://ws.kraken.com/v2"

        print(f"🔌 Connecting to Kraken WebSocket v2")

        try:
            async with websockets.connect(ws_url) as websocket:
                self.kraken_ws = websocket
                print(f"✅ Connected to Kraken WebSocket")

                # Subscribe to ticker for all symbols (Kraken v2 API)
                subscription_msg = {
                    "method": "subscribe",
                    "params": {
                        "channel": "ticker",
                        "symbol": list(self.subscribed_symbols)
                    }
                }
                await websocket.send(json.dumps(subscription_msg))
                print(f"📡 Subscribed to Kraken ticker (v2) for: {', '.join(self.subscribed_symbols)}")

                # Listen for messages
                while self.running:
                    try:
                        message = await asyncio.wait_for(websocket.recv(), timeout=1.0)
                        data = json.loads(message)

                        # Debug: Log received messages (first few only)
                        if not hasattr(self, '_msg_count'):
                            self._msg_count = 0
                        if self._msg_count < 5:
                            print(f"📨 Kraken v2 message: {data}")
                            self._msg_count += 1

                        # Kraken v2 API returns: {"channel": "ticker", "type": "update", "data": [...]}
                        if isinstance(data, dict) and data.get("channel") == "ticker" and data.get("type") == "update":
                            ticker_list = data.get("data", [])

                            for ticker in ticker_list:
                                symbol = ticker.get("symbol", "")  # e.g., "XBT/USD"
                                last_price = ticker.get("last", 0)

                                if symbol and last_price:
                                    price = float(last_price)

                                    # Update current price
                                    self.current_prices[symbol] = price

                                    print(f"💰 {symbol}: ${price:,.2f}")

                                    # Broadcast to clients subscribed to this symbol
                                    if symbol in self.symbol_clients:
                                        await self.broadcast_to_symbol(symbol, {
                                            "type": "price_update",
                                            "symbol": symbol,
                                            "price": price,
                                            "timestamp": None
                                        })

                    except asyncio.TimeoutError:
                        continue
                    except json.JSONDecodeError as e:
                        print(f"❌ JSON decode error: {e}")
                        continue
                    except Exception as e:
                        print(f"❌ Error processing message: {e}")
                        continue

        except websockets.exceptions.WebSocketException as e:
            print(f"❌ Kraken WebSocket error: {e}")
            self.running = False
        except Exception as e:
            print(f"❌ Unexpected error: {e}")
            self.running = False

    async def broadcast_to_symbol(self, symbol: str, message: dict):
        """Broadcast message only to clients subscribed to a specific symbol"""
        if symbol not in self.symbol_clients:
            return

        disconnected = set()

        for connection in self.symbol_clients[symbol]:
            try:
                await connection.send_json(message)
            except Exception:
                disconnected.add(connection)

        # Clean up disconnected clients
        for conn in disconnected:
            self.disconnect_client(conn)


# Global instance
kraken_ws_manager = KrakenWebSocketManager()
