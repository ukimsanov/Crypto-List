from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from src.router import router as router_crypto
from fastapi.middleware.cors import CORSMiddleware
from src.kraken_ws import kraken_ws_manager
from src.init import cmc_client

app = FastAPI()

app.include_router(router_crypto)


@app.websocket("/ws/prices/{currency_id}")
async def websocket_endpoint(websocket: WebSocket, currency_id: int):
    """
    WebSocket endpoint for real-time cryptocurrency prices via Kraken
    """
    try:
        # Get currency symbol from CoinMarketCap
        currency_data = await cmc_client.get_currency(currency_id)
        symbol = currency_data.get("symbol", "")

        # Connect client and subscribe to symbol (all in one)
        await kraken_ws_manager.connect_client(websocket, symbol)

        # Keep connection alive
        while True:
            # Wait for client messages (ping/pong or subscription changes)
            data = await websocket.receive_text()
            # Echo back for heartbeat
            await websocket.send_json({"type": "pong"})

    except WebSocketDisconnect:
        kraken_ws_manager.disconnect_client(websocket)


origins = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",

]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
