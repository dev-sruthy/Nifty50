import requests
import yfinance as yf
import pandas as pd
import json
from datetime import timedelta
from typing import Literal, cast
import os
import sqlite3
import hashlib
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from sklearn.ensemble import RandomForestRegressor
from datetime import datetime


app = FastAPI()

# Allow frontend calls (React)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], 
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ----------------------------------------------------
# Response Model
# ----------------------------------------------------
class ForecastResponse(BaseModel):
    dates: list[str]
    prices: list[float]
    explanation: str


class UserResponse(BaseModel):
    id: int
    email: str
    name: str | None = None


class RegisterRequest(BaseModel):
    email: str
    password: str
    name: str | None = None


class LoginRequest(BaseModel):
    email: str
    password: str


# ----------------------------------------------------
# Portfolio models
# ----------------------------------------------------
class HoldingDTO(BaseModel):
    symbol: str
    shares: int
    avg_cost: float


class TradeDTO(BaseModel):
    id: int
    symbol: str
    type: Literal["BUY", "SELL"]
    shares: int
    price: float
    pnl: float
    timestamp: str


class PortfolioResponse(BaseModel):
    holdings: list[HoldingDTO]
    trades: list[TradeDTO]
    realized_pnl: float


class TradeRequest(BaseModel):
    user_id: int
    symbol: str
    type: Literal["BUY", "SELL"]
    shares: int
    price: float


class TradeExecutionResponse(BaseModel):
    trade: TradeDTO
    trades: list[TradeDTO]
    holdings: list[HoldingDTO]
    realized_pnl: float


# ----------------------------------------------------
# Create lag features
# ----------------------------------------------------
def build_lag_features(close_series: pd.Series, n_lags: int = 10) -> pd.DataFrame:
    df = pd.DataFrame({"close": close_series})
    for i in range(1, n_lags + 1):
        df[f"lag_{i}"] = df["close"].shift(i)
    df["target"] = df["close"].shift(-1)
    return df.dropna()


# ------------------------------------------------------------------
#  SAFE OLLAMA STREAM PARSER (WORKS FOR ALL MODELS)
# ------------------------------------------------------------------
def ollama_generate(prompt: str) -> str:
    try:
        response = requests.post(
            "http://localhost:11434/api/generate",
            json={
                "model": "phi3",
                "prompt": prompt,
                "stream": True
            },
            timeout=180,
            stream=True
        )

        full_text = ""

        for line in response.iter_lines():
            if not line:
                continue

            decoded = line.decode("utf-8")

            # Try parsed JSON chunk
            try:
                obj = json.loads(decoded)
                if "response" in obj:
                    full_text += obj["response"]
                continue  # JSON chunk processed
            except json.JSONDecodeError:
                pass  # not JSON → fall through

            # Append raw text for non-JSON chunks
            full_text += decoded

        final = full_text.strip()

        if final == "":
            return "[Ollama Error] No explanation generated."

        return final

    except Exception as e:
        return f"[Ollama Error] {str(e)}"


# ----------------------------------------------------
# AUTH HELPERS (SQLITE)
# ----------------------------------------------------
DB_PATH = os.path.join(os.path.dirname(__file__), "auth.db")


def get_db():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn


def init_db():
    conn = get_db()
    conn.execute(
        """
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            email TEXT UNIQUE NOT NULL,
            password_hash TEXT NOT NULL,
            name TEXT,
            created_at TEXT NOT NULL
        );
        """
    )
    conn.execute(
        """
        CREATE TABLE IF NOT EXISTS trades (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            symbol TEXT NOT NULL,
            type TEXT NOT NULL,
            shares INTEGER NOT NULL,
            price REAL NOT NULL,
            pnl REAL NOT NULL,
            timestamp TEXT NOT NULL
        );
        """
    )
    conn.execute(
        """
        CREATE TABLE IF NOT EXISTS holdings (
            user_id INTEGER NOT NULL,
            symbol TEXT NOT NULL,
            shares INTEGER NOT NULL,
            avg_cost REAL NOT NULL,
            updated_at TEXT NOT NULL,
            PRIMARY KEY (user_id, symbol)
        );
        """
    )
    conn.commit()
    conn.close()


def hash_password(password: str, salt: str | None = None) -> str:
    """
    Derive a salted hash using PBKDF2 to avoid storing raw passwords.
    """
    if salt is None:
        salt_bytes = os.urandom(16)
    else:
        salt_bytes = bytes.fromhex(salt)

    derived = hashlib.pbkdf2_hmac("sha256", password.encode("utf-8"), salt_bytes, 100_000)
    return f"{salt_bytes.hex()}:{derived.hex()}"


def verify_password(password: str, stored_hash: str) -> bool:
    try:
        salt_hex, _ = stored_hash.split(":")
        comparison = hash_password(password, salt_hex)
        return comparison == stored_hash
    except Exception:
        return False


# ----------------------------------------------------
# PORTFOLIO HELPERS
# ----------------------------------------------------
def fetch_holdings(user_id: int) -> list[dict]:
    conn = get_db()
    rows = conn.execute(
        "SELECT symbol, shares, avg_cost FROM holdings WHERE user_id = ? ORDER BY symbol",
        (user_id,),
    ).fetchall()
    conn.close()
    return [dict(row) for row in rows]


def fetch_trades(user_id: int, limit: int = 50) -> list[dict]:
    conn = get_db()
    rows = conn.execute(
        "SELECT id, symbol, type, shares, price, pnl, timestamp FROM trades WHERE user_id = ? ORDER BY id DESC LIMIT ?",
        (user_id, limit),
    ).fetchall()
    conn.close()
    return [dict(row) for row in rows]


def total_realized_pnl(user_id: int) -> float:
    conn = get_db()
    row = conn.execute(
        "SELECT COALESCE(SUM(pnl), 0) AS total FROM trades WHERE user_id = ? AND type = 'SELL'",
        (user_id,),
    ).fetchone()
    conn.close()
    return float(row["total"] if row and row["total"] is not None else 0.0)


def execute_trade_db(user_id: int, symbol: str, ttype: Literal["BUY", "SELL"], shares: int, price: float) -> dict:
    if shares <= 0:
        raise HTTPException(status_code=400, detail="Shares must be positive.")

    conn = get_db()
    cur = conn.cursor()

    holding = cur.execute(
        "SELECT shares, avg_cost FROM holdings WHERE user_id = ? AND symbol = ?",
        (user_id, symbol),
    ).fetchone()

    timestamp = datetime.utcnow().isoformat()
    realized = 0.0

    if ttype == "SELL":
        if not holding or holding["shares"] < shares:
            conn.close()
            raise HTTPException(status_code=400, detail="Not enough shares to sell.")

        remaining = holding["shares"] - shares
        realized = (price - holding["avg_cost"]) * shares

        if remaining == 0:
            cur.execute("DELETE FROM holdings WHERE user_id = ? AND symbol = ?", (user_id, symbol))
        else:
            cur.execute(
                """
                UPDATE holdings
                SET shares = ?, avg_cost = ?, updated_at = ?
                WHERE user_id = ? AND symbol = ?
                """,
                (remaining, holding["avg_cost"], timestamp, user_id, symbol),
            )
    else:
        # BUY
        current_shares = holding["shares"] if holding else 0
        current_cost = holding["avg_cost"] if holding else 0.0
        new_shares = current_shares + shares
        total_cost = current_shares * current_cost + shares * price
        new_avg = total_cost / new_shares

        cur.execute(
            """
            INSERT INTO holdings (user_id, symbol, shares, avg_cost, updated_at)
            VALUES (?, ?, ?, ?, ?)
            ON CONFLICT(user_id, symbol) DO UPDATE SET
                shares = excluded.shares,
                avg_cost = excluded.avg_cost,
                updated_at = excluded.updated_at
            """,
            (user_id, symbol, new_shares, new_avg, timestamp),
        )

    cur.execute(
        """
        INSERT INTO trades (user_id, symbol, type, shares, price, pnl, timestamp)
        VALUES (?, ?, ?, ?, ?, ?, ?)
        """,
        (user_id, symbol, ttype, shares, price, realized, timestamp),
    )

    conn.commit()
    trade_id = cur.lastrowid
    conn.close()

    return {
        "id": trade_id,
        "symbol": symbol,
        "type": ttype,
        "shares": shares,
        "price": price,
        "pnl": realized,
        "timestamp": timestamp,
    }

# ----------------------------------------------------
# FORECAST API
# ----------------------------------------------------
@app.get("/api/forecast/{symbol}", response_model=ForecastResponse)
def forecast(symbol: str, days: int = 60):

    # Map NIFTY to Yahoo symbol
    yf_symbol = "^NSEI" if symbol.upper() == "NIFTY" else symbol

    # DOWNLOAD FIXED CODE (YOUR MISSING PARENTHESIS WAS HERE)
    data = yf.download(
        yf_symbol,
        period="3y",
        interval="1d",
        auto_adjust=True,
        progress=False,
        threads=False
    )

    if data is None or data.empty:
        raise HTTPException(status_code=400, detail="Yahoo Finance returned no data.")

    # MultiIndex FIX
    if isinstance(data.columns, pd.MultiIndex):
        try:
            close = data["Close"].iloc[:, 0].dropna()
        except Exception:
            raise HTTPException(status_code=400, detail="Could not parse Close column.")
    else:
        close = data["Close"].dropna()

    # Normalize to a pandas Series for downstream type-safety
    close = pd.Series(close)

    # Ensure the index is a DatetimeIndex for consistent arithmetic
    if isinstance(close.index, pd.DatetimeIndex):
        close_index: pd.DatetimeIndex = close.index
    else:
        close_index = pd.DatetimeIndex(pd.to_datetime(close.index))

    if len(close) < 50:
        raise HTTPException(status_code=400, detail="Not enough data to forecast.")

    # BUILD FEATURES
    n_lags = 10
    feat_df = build_lag_features(close, n_lags=n_lags)
    X = feat_df[[f"lag_{i}" for i in range(1, n_lags + 1)]]
    y = feat_df["target"]

    # TRAIN MODEL
    model = RandomForestRegressor(n_estimators=200, random_state=42)
    model.fit(X, y)

    # FORECAST NEXT DAYS
    # Ensure we have a Python datetime for timedelta arithmetic (some index values are not)
    last_date = cast(pd.Timestamp, close_index[-1]).to_pydatetime()
    last_window = list(close.values[-n_lags:])
    future_dates, future_prices = [], []

    current_date = last_date

    for _ in range(days):
        row = pd.DataFrame(
            [last_window[::-1]],
            columns=pd.Index([f"lag_{i}" for i in range(1, n_lags + 1)])
        )
        next_price = float(model.predict(row)[0])

        next_date = current_date + timedelta(days=1)
        while next_date.weekday() >= 5:  # skip weekend
            next_date += timedelta(days=1)

        future_dates.append(next_date.strftime("%Y-%m-%d"))
        future_prices.append(next_price)

        last_window = [next_price] + last_window[:-1]
        current_date = next_date

    # LLM EXPLANATION
    recent: pd.Series = close.tail(10)
    pct_change = (future_prices[-1] - future_prices[0]) / future_prices[0] * 100

    history_lines = []
    for d, v in recent.items():
        if not isinstance(d, (pd.Timestamp, datetime)):
            continue
        ts = pd.Timestamp(d)
        if not isinstance(ts, pd.Timestamp) or ts is pd.NaT:
            continue
        history_lines.append(f"{ts.strftime('%Y-%m-%d')}: {v:.2f}")
    history_str = "\n".join(history_lines)
    forecast_str = "\n".join(
        f"{d}: {p:.2f}" for d, p in zip(future_dates, future_prices)
    )

    prompt = f"""
You are an AI that explains stock trends in simple English.
Do NOT give financial advice.

Symbol: {symbol}

Recent prices:
{history_str}

Next {days} days forecast:
{forecast_str}

Predicted Change: {pct_change:.2f}%

Explain:
- Trend (up, down, sideways)
- Why it might happen
- Risks and uncertainties
"""

    explanation = ollama_generate(prompt)

    return ForecastResponse(
        dates=future_dates,
        prices=[round(p, 2) for p in future_prices],
        explanation=explanation,
    )


@app.get("/")
def root():
    return {"message": "Backend is running. Use /api/forecast/<symbol>."}


# ----------------------------------------------------
# AUTH ROUTES
# ----------------------------------------------------
@app.on_event("startup")
def on_startup():
    init_db()


@app.post("/api/auth/register", response_model=UserResponse)
def register_user(payload: RegisterRequest):
    if len(payload.password) < 6:
        raise HTTPException(status_code=400, detail="Password must be at least 6 characters.")

    email = payload.email.lower().strip()
    conn = get_db()
    cur = conn.cursor()

    existing = cur.execute("SELECT id FROM users WHERE email = ?", (email,)).fetchone()
    if existing:
        conn.close()
        raise HTTPException(status_code=400, detail="Email already registered.")

    password_hash = hash_password(payload.password)
    now = datetime.utcnow().isoformat()
    cur.execute(
        "INSERT INTO users (email, password_hash, name, created_at) VALUES (?, ?, ?, ?)",
        (email, password_hash, payload.name, now),
    )
    conn.commit()
    user_id = cur.lastrowid
    conn.close()

    if user_id is None:
        raise HTTPException(status_code=500, detail="Could not create user.")

    return UserResponse(id=user_id, email=email, name=payload.name)


@app.post("/api/auth/login", response_model=UserResponse)
def login_user(payload: LoginRequest):
    email = payload.email.lower().strip()
    conn = get_db()
    row = conn.execute(
        "SELECT id, email, name, password_hash FROM users WHERE email = ?",
        (email,),
    ).fetchone()
    conn.close()

    if not row or not verify_password(payload.password, row["password_hash"]):
        raise HTTPException(status_code=401, detail="Invalid email or password.")

    return UserResponse(id=row["id"], email=row["email"], name=row["name"])


# ----------------------------------------------------
# PORTFOLIO ROUTES
# ----------------------------------------------------
@app.get("/api/portfolio/{user_id}", response_model=PortfolioResponse)
def get_portfolio(user_id: int):
    holdings = fetch_holdings(user_id)
    trades = fetch_trades(user_id, limit=50)
    realized = total_realized_pnl(user_id)
    return PortfolioResponse(
        holdings=[HoldingDTO(**h) for h in holdings],
        trades=[TradeDTO(**t) for t in trades],
        realized_pnl=realized,
    )


@app.post("/api/trades", response_model=TradeExecutionResponse)
def execute_trade(payload: TradeRequest):
    trade = execute_trade_db(
        user_id=payload.user_id,
        symbol=payload.symbol,
        ttype=payload.type,
        shares=payload.shares,
        price=payload.price,
    )
    holdings = fetch_holdings(payload.user_id)
    trades = fetch_trades(payload.user_id, limit=50)
    realized = total_realized_pnl(payload.user_id)
    return TradeExecutionResponse(
        trade=TradeDTO(**trade),
        trades=[TradeDTO(**t) for t in trades],
        holdings=[HoldingDTO(**h) for h in holdings],
        realized_pnl=realized,
    )
