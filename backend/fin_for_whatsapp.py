from flask import Flask, request, send_from_directory
from twilio.twiml.messaging_response import MessagingResponse
import os
from fpdf import FPDF
from twilio.rest import Client
from dotenv import load_dotenv
import yfinance as yf
import pandas as pd
import numpy as np
from ta.trend import MACD, EMAIndicator
from ta.momentum import RSIIndicator, StochasticOscillator
from ta.volatility import BollingerBands
from ta.volume import OnBalanceVolumeIndicator, AccDistIndexIndicator
from groq import Groq
import warnings
from scipy.stats import norm
import cloudinary
import cloudinary.uploader
from cloudinary.utils import cloudinary_url

# Configuration       
cloudinary.config(
    cloud_name="dvuhwiv40",  # Replace with your Cloudinary cloud name
    api_key="461426341452697",        # Replace with your Cloudinary API key
    api_secret=os.getenv('CLOUDINARY_API_KEY'),  # Replace with your Cloudinary API secret
    secure=True
)

# Suppress the specific RuntimeWarnings
warnings.filterwarnings('ignore', category=RuntimeWarning)

# Load environment variables
load_dotenv()

# Initialize Flask app
app = Flask(__name__)

# Twilio credentials
account_sid = os.getenv("TWILIO_ACCOUNT_SID")
auth_token = os.getenv("TWILIO_AUTH_TOKEN")
client = Client(account_sid, auth_token)

# Groq API key
groq_api_key = os.getenv("GROQ_API_KEY")

class FinancialNarrativeGenerator:
    def __init__(self, symbol, api_key):
        self.symbol = symbol
        self.stock = yf.Ticker(symbol)
        self.client = Groq(api_key=api_key)
        
    def fetch_historical_data(self, period="1y"):
        """Fetch historical data and calculate comprehensive technical indicators"""
        # Get base data
        df = self.stock.history(period=period)
        
        # Handle empty dataframes
        if df.empty:
            raise ValueError(f"No data found for symbol {self.symbol}")
            
        # Create a dictionary to store all indicators
        indicators = {}
        
        # Basic Moving Averages
        indicators['50_MA'] = df['Close'].rolling(window=50, min_periods=1).mean()
        indicators['200_MA'] = df['Close'].rolling(window=200, min_periods=1).mean()
        indicators['20_EMA'] = EMAIndicator(close=df['Close'], window=20).ema_indicator()
        
        # MACD
        macd = MACD(df['Close'])
        indicators['MACD'] = macd.macd()
        indicators['MACD_Signal'] = macd.macd_signal()
        indicators['MACD_Histogram'] = macd.macd_diff()
        
        # RSI and Stochastic
        indicators['RSI'] = RSIIndicator(df['Close']).rsi()
        stoch = StochasticOscillator(df['High'], df['Low'], df['Close'])
        indicators['Stoch_K'] = stoch.stoch()
        indicators['Stoch_D'] = stoch.stoch_signal()
        
        # Bollinger Bands
        bollinger = BollingerBands(df['Close'])
        indicators['Bollinger_Upper'] = bollinger.bollinger_hband()
        indicators['Bollinger_Lower'] = bollinger.bollinger_lband()
        indicators['Bollinger_Mid'] = bollinger.bollinger_mavg()
        indicators['BB_Width'] = (bollinger.bollinger_hband() - bollinger.bollinger_lband()) / bollinger.bollinger_mavg()
        
        # Volume Indicators
        indicators['OBV'] = OnBalanceVolumeIndicator(df['Close'], df['Volume']).on_balance_volume()
        indicators['ADI'] = AccDistIndexIndicator(df['High'], df['Low'], df['Close'], df['Volume']).acc_dist_index()
        
        # Price Channels
        indicators['Upper_Channel'] = df['High'].rolling(window=20, min_periods=1).max()
        indicators['Lower_Channel'] = df['Low'].rolling(window=20, min_periods=1).min()
        
        # Support and Resistance Levels
        indicators['Support'] = df['Low'].rolling(window=20, min_periods=1).min()
        indicators['Resistance'] = df['High'].rolling(window=20, min_periods=1).max()
        
        # Volatility Indicators
        indicators['Daily_Return'] = df['Close'].pct_change()
        indicators['Volatility'] = indicators['Daily_Return'].rolling(window=20, min_periods=1).std() * np.sqrt(252)
        
        # Calculate ADX
        adx_data = self.calculate_adx(df)
        indicators['ADX'] = adx_data
        
        # Trend Strength
        indicators['Trend_Strength'] = np.abs(indicators['50_MA'] - indicators['200_MA']) / indicators['200_MA']
        
        # Generate trading signals
        indicators['Signal'] = self.generate_trading_signals(df, indicators)
        
        # Combine all indicators with original data efficiently
        result_df = pd.concat([df, pd.DataFrame(indicators)], axis=1)
        
        # Final NaN cleanup
        result_df = result_df.fillna(method='ffill').fillna(method='bfill').fillna(0)
        
        return result_df
    
    def generate_trading_signals(self, df, indicators):
        """Generate trading signals based on technical indicators"""
        signals = pd.Series(index=df.index, data=0)
        
        # RSI signals
        signals += np.where(indicators['RSI'] < 30, 1, 0)  # Oversold
        signals += np.where(indicators['RSI'] > 70, -1, 0)  # Overbought
        
        # MACD signals
        signals += np.where(indicators['MACD'] > indicators['MACD_Signal'], 1, 0)
        signals += np.where(indicators['MACD'] < indicators['MACD_Signal'], -1, 0)
        
        # Moving Average signals
        signals += np.where(indicators['50_MA'] > indicators['200_MA'], 1, 0)
        signals += np.where(indicators['50_MA'] < indicators['200_MA'], -1, 0)
        
        # Bollinger Bands signals
        signals += np.where(df['Close'] < indicators['Bollinger_Lower'], 1, 0)
        signals += np.where(df['Close'] > indicators['Bollinger_Upper'], -1, 0)
        
        return signals.apply(lambda x: 1 if x > 0 else (-1 if x < 0 else 0))
    
    def monte_carlo_simulation(self, df, num_simulations=1000, forecast_days=252):
        """Perform Monte Carlo simulation for price forecasting"""
        returns = np.log(df['Close'] / df['Close'].shift(1))
        mu = returns.mean()
        sigma = returns.std()
        
        last_price = df['Close'].iloc[-1]
        simulation_df = pd.DataFrame()
        
        for i in range(num_simulations):
            prices = [last_price]
            for day in range(forecast_days):
                price = prices[-1] * np.exp(np.random.normal(mu, sigma))
                prices.append(price)
            simulation_df[f'Sim_{i}'] = prices
        
        # Calculate confidence intervals
        sim_results = {
            'mean_path': simulation_df.mean(axis=1),
            'upper_95': simulation_df.apply(lambda x: np.percentile(x, 95), axis=1),
            'lower_95': simulation_df.apply(lambda x: np.percentile(x, 5), axis=1),
            'max_path': simulation_df.max(axis=1),
            'min_path': simulation_df.min(axis=1)
        }
        
        # Calculate VaR and other risk metrics
        returns_distribution = ((simulation_df.iloc[-1] - last_price) / last_price)
        var_95 = np.percentile(returns_distribution, 5)
        var_99 = np.percentile(returns_distribution, 1)
        expected_shortfall = returns_distribution[returns_distribution <= var_95].mean()
        
        risk_metrics = {
            'VaR_95': var_95,
            'VaR_99': var_99,
            'Expected_Shortfall': expected_shortfall,
            'Expected_Return': returns_distribution.mean(),
            'Return_Volatility': returns_distribution.std()
        }
        
        return sim_results, risk_metrics

    def backtest_strategy(self, df, initial_capital=100000):
        """Backtest the trading strategy"""
        positions = pd.Series(index=df.index, data=0)
        positions[df['Signal'] == 1] = 1  # Long position
        positions[df['Signal'] == -1] = -1  # Short position
        
        # Calculate strategy returns
        df['Strategy_Returns'] = positions.shift(1) * df['Daily_Return']
        df['Strategy_Returns'] = df['Strategy_Returns'].fillna(0)
        
        # Calculate cumulative returns
        df['Cum_Market_Returns'] = (1 + df['Daily_Return']).cumprod()
        df['Cum_Strategy_Returns'] = (1 + df['Strategy_Returns']).cumprod()
        
        # Calculate portfolio value
        df['Portfolio_Value'] = initial_capital * df['Cum_Strategy_Returns']
        
        # Calculate performance metrics
        total_return = df['Cum_Strategy_Returns'].iloc[-1] - 1
        market_return = df['Cum_Market_Returns'].iloc[-1] - 1
        excess_return = total_return - market_return
        
        # Calculate Sharpe Ratio (assuming risk-free rate of 2%)
        risk_free_rate = 0.02
        sharpe_ratio = (total_return - risk_free_rate) / (df['Strategy_Returns'].std() * np.sqrt(252))
        
        # Calculate Maximum Drawdown
        rolling_max = df['Portfolio_Value'].expanding().max()
        drawdowns = df['Portfolio_Value'] / rolling_max - 1
        max_drawdown = drawdowns.min()
        
        # Calculate other metrics
        win_rate = len(df[df['Strategy_Returns'] > 0]) / len(df[df['Strategy_Returns'] != 0])
        
        metrics = {
            'Total_Return': total_return,
            'Market_Return': market_return,
            'Excess_Return': excess_return,
            'Sharpe_Ratio': sharpe_ratio,
            'Max_Drawdown': max_drawdown,
            'Win_Rate': win_rate,
            'Final_Portfolio_Value': df['Portfolio_Value'].iloc[-1]
        }
        
        return metrics, df
    
    def calculate_adx(self, df, period=14):
        """Calculate Average Directional Index (ADX)"""
        df = df.copy()
        df['TR'] = np.maximum(
            df['High'] - df['Low'],
            np.maximum(
                abs(df['High'] - df['Close'].shift(1)),
                abs(df['Low'] - df['Close'].shift(1))
            )
        )
        df['+DM'] = np.where(
            (df['High'] - df['High'].shift(1)) > (df['Low'].shift(1) - df['Low']),
            np.maximum(df['High'] - df['High'].shift(1), 0),
            0
        )
        df['-DM'] = np.where(
            (df['Low'].shift(1) - df['Low']) > (df['High'] - df['High'].shift(1)),
            np.maximum(df['Low'].shift(1) - df['Low'], 0),
            0
        )
        
        df['TR' + str(period)] = df['TR'].rolling(window=period, min_periods=1).mean()
        df['+DM' + str(period)] = df['+DM'].rolling(window=period, min_periods=1).mean()
        df['-DM' + str(period)] = df['-DM'].rolling(window=period, min_periods=1).mean()
        
        df['+DI' + str(period)] = 100 * df['+DM' + str(period)] / df['TR' + str(period)].replace(0, np.nan)
        df['-DI' + str(period)] = 100 * df['-DM' + str(period)] / df['TR' + str(period)].replace(0, np.nan)
        
        denominator = (df['+DI' + str(period)] + df['-DI' + str(period)])
        df['DX'] = 100 * abs(df['+DI' + str(period)] - df['-DI' + str(period)]) / denominator.replace(0, np.nan)
        
        df['DX'] = df['DX'].fillna(method='ffill').fillna(method='bfill').fillna(0)
        return df['DX'].rolling(window=period, min_periods=1).mean()
    
    def get_short_stock_insights(self, data):
        
        latest_data = {
                'price': data['Close'].iloc[-1],
                'volume': data['Volume'].iloc[-1],
                'daily_return': data['Daily_Return'].iloc[-1] * 100,
                'volatility': data['Volatility'].iloc[-1] * 100,
                'trend_strength': data['Trend_Strength'].iloc[-1],
                'adx': data['ADX'].iloc[-1],
                'bb_width': data['BB_Width'].iloc[-1]
            }
            
        # Base prompt with technical analysis
        prompt = f"""
        Comprehensive Technical Analysis for {self.symbol}
        
        Price Metrics:
        - Current Price: ${latest_data['price']:.2f}
        - Daily Return: {latest_data['daily_return']:.2f}%
        - Volume: {latest_data['volume']:,.0f}
        
        Moving Averages:
        - 50-day MA: ${data['50_MA'].iloc[-1]:.2f}
        - 200-day MA: ${data['200_MA'].iloc[-1]:.2f}
        - 20-day EMA: ${data['20_EMA'].iloc[-1]:.2f}
        
        Momentum Indicators:
        - RSI: {data['RSI'].iloc[-1]:.2f}
        - Stochastic K: {data['Stoch_K'].iloc[-1]:.2f}
        - Stochastic D: {data['Stoch_D'].iloc[-1]:.2f}
        
        Trend Indicators:
        - MACD: {data['MACD'].iloc[-1]:.2f}
        - MACD Signal: {data['MACD_Signal'].iloc[-1]:.2f}
        - MACD Histogram: {data['MACD_Histogram'].iloc[-1]:.2f}
        - ADX: {latest_data['adx']:.2f}
        - Trend Strength: {latest_data['trend_strength']:.2f}
        
        Volatility Metrics:
        - Current Volatility: {latest_data['volatility']:.2f}%
        - Bollinger Width: {latest_data['bb_width']:.2f}
        - Upper BB: ${data['Bollinger_Upper'].iloc[-1]:.2f}
        - Lower BB: ${data['Bollinger_Lower'].iloc[-1]:.2f}
        """
        return prompt
        
    def get_stock_insights(self, data, sim_results=None, risk_metrics=None, backtest_metrics=None):
        """Generate comprehensive stock insights using Groq LLM"""
        try:
            latest_data = {
                'price': data['Close'].iloc[-1],
                'volume': data['Volume'].iloc[-1],
                'daily_return': data['Daily_Return'].iloc[-1] * 100,
                'volatility': data['Volatility'].iloc[-1] * 100,
                'trend_strength': data['Trend_Strength'].iloc[-1],
                'adx': data['ADX'].iloc[-1],
                'bb_width': data['BB_Width'].iloc[-1]
            }
            
            # Base prompt with technical analysis
            prompt = f"""
            Comprehensive Technical Analysis for {self.symbol}
            
            Price Metrics:
            - Current Price: ${latest_data['price']:.2f}
            - Daily Return: {latest_data['daily_return']:.2f}%
            - Volume: {latest_data['volume']:,.0f}
            
            Moving Averages:
            - 50-day MA: ${data['50_MA'].iloc[-1]:.2f}
            - 200-day MA: ${data['200_MA'].iloc[-1]:.2f}
            - 20-day EMA: ${data['20_EMA'].iloc[-1]:.2f}
            
            Momentum Indicators:
            - RSI: {data['RSI'].iloc[-1]:.2f}
            - Stochastic K: {data['Stoch_K'].iloc[-1]:.2f}
            - Stochastic D: {data['Stoch_D'].iloc[-1]:.2f}
            
            Trend Indicators:
            - MACD: {data['MACD'].iloc[-1]:.2f}
            - MACD Signal: {data['MACD_Signal'].iloc[-1]:.2f}
            - MACD Histogram: {data['MACD_Histogram'].iloc[-1]:.2f}
            - ADX: {latest_data['adx']:.2f}
            - Trend Strength: {latest_data['trend_strength']:.2f}
            
            Volatility Metrics:
            - Current Volatility: {latest_data['volatility']:.2f}%
            - Bollinger Width: {latest_data['bb_width']:.2f}
            - Upper BB: ${data['Bollinger_Upper'].iloc[-1]:.2f}
            - Lower BB: ${data['Bollinger_Lower'].iloc[-1]:.2f}
            """
            
            # Add Monte Carlo simulation results if available
            if sim_results and risk_metrics:
                prompt += f"""
                
                Monte Carlo Simulation Results:
                - Expected Price (1 year): ${sim_results['mean_path'].iloc[-1]:.2f}
                - 95% Confidence Interval: ${sim_results['lower_95'].iloc[-1]:.2f} to ${sim_results['upper_95'].iloc[-1]:.2f}
                
                Risk Metrics:
                - 95% VaR: {risk_metrics['VaR_95']*100:.2f}%
                - 99% VaR: {risk_metrics['VaR_99']*100:.2f}%
                - Expected Shortfall: {risk_metrics['Expected_Shortfall']*100:.2f}%
                - Expected Return: {risk_metrics['Expected_Return']*100:.2f}%
                - Return Volatility: {risk_metrics['Return_Volatility']*100:.2f}%
                """
            
            # Add backtesting results if available
            if backtest_metrics:
                prompt += f"""
                
                Backtesting Results:
                - Total Strategy Return: {backtest_metrics['Total_Return']*100:.2f}%
                - Market Return: {backtest_metrics['Market_Return']*100:.2f}%
                - Excess Return: {backtest_metrics['Excess_Return']*100:.2f}%
                - Sharpe Ratio: {backtest_metrics['Sharpe_Ratio']:.2f}
                - Maximum Drawdown: {backtest_metrics['Max_Drawdown']*100:.2f}%
                - Win Rate: {backtest_metrics['Win_Rate']*100:.2f}%
                """
            
            prompt += """
            
            Please provide a comprehensive analysis including:
            1. Overall Trend Analysis and Strength
            2. Momentum Analysis (RSI, Stochastic, MACD)
            3. Volatility Assessment and Risk Levels
            4. Monte Carlo Simulation Insights and Risk Metrics
            5. Backtesting Performance Analysis
            6. Support/Resistance Levels and Potential Breakouts
            7. Short-term and Medium-term Technical Outlook
            8. Trading Strategy Recommendations
            """
            
            completion = self.client.chat.completions.create(
                messages=[{"role": "user", "content": prompt}],
                model="deepseek-r1-distill-llama-70b",
                temperature=0.7,
                max_tokens=4096,
                top_p=0.95,
                stream=False
            )
            
            return completion.choices[0].message.content
            
        except Exception as e:
            return f"Error generating insights: {str(e)}"
        
        
def generate_pdf(ticker, insights, save_path):
    """Generate a PDF file and save it locally."""
    pdf = FPDF()
    pdf.add_page()
    pdf.set_font("Arial", size=12)
    
    # Add title
    pdf.cell(200, 10, txt=f"Insights for {ticker}", ln=True, align="C")
    pdf.ln(10)
    
    # Add insights content
    pdf.multi_cell(0, 10, txt=insights)
    
    # Save the PDF file
    pdf.output(save_path)

def split_message(message, chunk_size=100):
    """Split a large message into smaller chunks."""
    return [message[i:i + chunk_size] for i in range(0, len(message), chunk_size)]

def upload_pdf_to_cloudinary(pdf_path, public_id=None):
    """
    Upload a PDF file to Cloudinary and return the secure URL.
    """
    try:
        upload_result = cloudinary.uploader.upload(
            pdf_path,
            resource_type="raw",  # Use "raw" for non-image files like PDFs
            public_id=public_id   # Optional: Specify a custom public ID
        )
        return upload_result["secure_url"]
    except Exception as e:
        print(f"Error uploading PDF to Cloudinary: {e}")
        return None

# Directory to store PDF files
PDF_DIR = "pdf_files"
os.makedirs(PDF_DIR, exist_ok=True)

@app.route("/download/<filename>")
def download_file(filename):
    """Serve the PDF file for download."""
    return send_from_directory(PDF_DIR, filename, as_attachment=True)

# Flask route to handle incoming WhatsApp messages
@app.route("/webhook", methods=['POST'])
def webhook():
    # Get the incoming message from the request
    incoming_msg = request.form.get('Body').strip().lower()
    sender = request.form.get('From')

    # Create a response object
    response = MessagingResponse()

    # Logic to handle the incoming message
    if incoming_msg.startswith("info "):
        # Extract the ticker symbol from the message
        ticker = incoming_msg.split(" ")[1].upper()
        
        try:
            # Initialize the FinancialNarrativeGenerator
            generator = FinancialNarrativeGenerator(ticker, groq_api_key)
            
            # Fetch historical data
            historical_data = generator.fetch_historical_data()
            
            # Perform Monte Carlo simulation
            sim_results, risk_metrics = generator.monte_carlo_simulation(historical_data)
            
            # Perform backtesting
            backtest_metrics, historical_data = generator.backtest_strategy(historical_data)
            
            # Generate AI insights
            short_insights = generator.get_short_stock_insights(
                historical_data
            )
            
            # Generate AI insights
            insights = generator.get_stock_insights(
                historical_data,
                sim_results,
                risk_metrics,
                backtest_metrics
            )
            
            # Generate a PDF file
            pdf_filename = f"{ticker}_insights.pdf"
            pdf_path = os.path.join(PDF_DIR, pdf_filename)
            generate_pdf(ticker, insights, pdf_path)
            
            # # Create a downloadable URL
            # base_url = "https://06b7-14-142-143-98.ngrok-free.app"  # Replace with your ngrok URL
            # download_url = f"{base_url}/download/{pdf_filename}"
            
            # # Send the download URL to the user
            # print(download_url)
            # response.message(f"Here are the detailed insights for {ticker}. Download the PDF: {download_url}")
            # Upload the PDF to Cloudinary
            pdf_url = upload_pdf_to_cloudinary(pdf_path, public_id=f"{ticker}_insights")
            
            if pdf_url:
                response.message(f"Here are the insights for {ticker}. Download the PDF: {pdf_url}")
            else:
                response.message("Failed to generate the insights file. Please try again.")
                
            print(short_insights)
            print(len(short_insights))
            response.message(f"Insights for {ticker}:\n\n{short_insights}")
                
        except Exception as e:
            response.message(f"Error fetching data for {ticker}: {str(e)}")
    elif incoming_msg == "hello":
        response.message("Hi there! Send 'info <ticker>' to get insights about a stock. For example, 'info AAPL'.")
    elif incoming_msg == "bye":
        response.message("Goodbye! Have a great day!")
    else:
        response.message("I didn't understand that. Send 'info <ticker>' to get insights about a stock. For example, 'info AAPL'.")

    # Send the response back to the sender
    return str(response)

# Run the Flask app
if __name__ == "__main__":
    app.run(debug=True)