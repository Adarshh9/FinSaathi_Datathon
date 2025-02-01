# financial_analyzer.py

import yfinance as yf
import pandas as pd
import numpy as np
from ta.trend import MACD, EMAIndicator
from ta.momentum import RSIIndicator, StochasticOscillator
from ta.volatility import BollingerBands
from ta.volume import OnBalanceVolumeIndicator, AccDistIndexIndicator
from groq import Groq
import re

class FinancialAnalyzer:
    def __init__(self, symbol, api_key):
        self.symbol = symbol
        self.stock = yf.Ticker(symbol)
        self.client = Groq(api_key=api_key)
    
    def fetch_historical_data(self, period="1y"):
        """Fetch and process historical data with technical indicators"""
        try:
            df = self.stock.history(period=period)
            
            if df.empty:
                raise ValueError(f"No data found for symbol {self.symbol}")
            
            # Fill NaN values
            df = df.fillna(method='ffill').fillna(method='bfill')
            
            # Calculate technical indicators
            df['50_MA'] = df['Close'].rolling(window=50, min_periods=1).mean()
            df['200_MA'] = df['Close'].rolling(window=200, min_periods=1).mean()
            df['20_EMA'] = EMAIndicator(close=df['Close'], window=20).ema_indicator()
            
            # MACD
            macd = MACD(df['Close'])
            df['MACD'] = macd.macd()
            df['MACD_Signal'] = macd.macd_signal()
            df['MACD_Histogram'] = macd.macd_diff()
            
            # RSI and Stochastic
            df['RSI'] = RSIIndicator(df['Close']).rsi()
            stoch = StochasticOscillator(df['High'], df['Low'], df['Close'])
            df['Stoch_K'] = stoch.stoch()
            df['Stoch_D'] = stoch.stoch_signal()
            
            # Bollinger Bands
            bollinger = BollingerBands(df['Close'])
            df['Bollinger_Upper'] = bollinger.bollinger_hband()
            df['Bollinger_Lower'] = bollinger.bollinger_lband()
            df['BB_Width'] = (df['Bollinger_Upper'] - df['Bollinger_Lower']) / df['Close']
            
            # Volume Indicators
            df['OBV'] = OnBalanceVolumeIndicator(df['Close'], df['Volume']).on_balance_volume()
            df['ADI'] = AccDistIndexIndicator(df['High'], df['Low'], df['Close'], df['Volume']).acc_dist_index()
            
            # Volatility
            df['Daily_Return'] = df['Close'].pct_change()
            df['Volatility'] = df['Daily_Return'].rolling(window=20).std() * np.sqrt(252)
            
            # Clean up any remaining NaN values
            df = df.fillna(0)
            
            # Convert DataFrame to dict for JSON serialization
            df.index = df.index.strftime('%Y-%m-%d')
            return df.reset_index().to_dict('records')
            
        except Exception as e:
            raise Exception(f"Error processing data: {str(e)}")
    


    def get_analysis(self, data):
        """Generate AI analysis of the financial data"""
        try:
            # Convert list of dicts back to DataFrame for analysis
            df = pd.DataFrame(data)
            latest_data = df.iloc[-1]

            prompt = f"""
            Comprehensive Technical Analysis for {self.symbol}

            Current Metrics:
            - Price: ${latest_data['Close']:.2f}
            - RSI: {latest_data['RSI']:.2f}
            - MACD: {latest_data['MACD']:.2f}
            - Volatility: {latest_data['Volatility']*100:.2f}%

            Please provide a detailed technical analysis including:
            1. Overall Trend Analysis
            2. Key Technical Signals
            3. Support/Resistance Levels
            4. Risk Assessment
            5. Short-term Outlook
            """

            completion = self.client.chat.completions.create(
                messages=[{"role": "user", "content": prompt}],
                model="deepseek-r1-distill-llama-70b",
                temperature=0.7,
                max_tokens=2000,
                top_p=0.95,
                stream=False
            )

            response = completion.choices[0].message.content

            # Remove <think>...</think> using regex
            response = re.sub(r"<think>.*?</think>", "", response, flags=re.DOTALL).strip()

            return response

        except Exception as e:
            raise Exception(f"Error generating analysis: {str(e)}")
