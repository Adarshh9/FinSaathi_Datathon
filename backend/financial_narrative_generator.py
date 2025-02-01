import yfinance as yf
import pandas as pd
import numpy as np
from datetime import datetime, timedelta
import plotly.graph_objects as go
from plotly.subplots import make_subplots
from ta.trend import MACD, EMAIndicator
from ta.momentum import RSIIndicator, StochasticOscillator
from ta.volatility import BollingerBands
from ta.volume import OnBalanceVolumeIndicator, AccDistIndexIndicator
from groq import Groq
import warnings
from scipy.stats import norm, skew
from scipy import stats

warnings.filterwarnings('ignore')
pd.options.mode.chained_assignment = None

# Suppress the specific RuntimeWarnings
warnings.filterwarnings('ignore', category=RuntimeWarning)

class ConfidenceScorer:
    def __init__(self):
        self.weight_technical = 0.3
        self.weight_statistical = 0.4
        self.weight_market = 0.3
        
    def calculate_technical_confidence(self, data):
        """Calculate confidence score based on technical indicators"""
        scores = {}
        
        # Trend Agreement Score (Moving Averages)
        ma_agreement = (
            (data['50_MA'].iloc[-1] > data['200_MA'].iloc[-1]) == 
            (data['20_EMA'].iloc[-1] > data['50_MA'].iloc[-1])
        )
        scores['trend_agreement'] = 1 if ma_agreement else 0
        
        # RSI Confidence
        rsi = data['RSI'].iloc[-1]
        scores['rsi_confidence'] = 1 - (abs(50 - rsi) / 50)  # Higher when RSI is balanced
        
        # MACD Signal Strength
        macd_signal_ratio = abs(data['MACD_Histogram'].iloc[-1] / data['MACD'].iloc[-1])
        scores['macd_strength'] = min(macd_signal_ratio, 1) if not np.isnan(macd_signal_ratio) else 0.5
        
        # ADX Trend Strength
        adx = data['ADX'].iloc[-1]
        scores['trend_strength'] = min(adx / 50, 1)  # Normalized ADX
        
        # Volume Confirmation
        vol_avg = data['Volume'].rolling(window=20).mean().iloc[-1]
        vol_current = data['Volume'].iloc[-1]
        scores['volume_confidence'] = min(vol_current / vol_avg, 1.5) / 1.5
        
        # Weight and combine technical scores
        weights = {
            'trend_agreement': 0.25,
            'rsi_confidence': 0.15,
            'macd_strength': 0.20,
            'trend_strength': 0.25,
            'volume_confidence': 0.15
        }
        
        technical_score = sum(score * weights[key] for key, score in scores.items())
        return technical_score, scores
    
    def calculate_statistical_confidence(self, risk_metrics, sim_results):
        """Calculate confidence score based on statistical measures"""
        scores = {}
        
        # Distribution Skewness Score (using last year's daily returns for demonstration)
        returns_distribution = sim_results['mean_path'].pct_change().dropna() 

        # Check if enough samples for skew calculation
        if len(returns_distribution) >= 8:
            _, p_value = stats.skewtest(returns_distribution)
            scores['skewness'] = min(p_value, 0.05) / 0.05  # Higher when distribution is closer to normal
        else:
            scores['skewness'] = 0.5  # Assign a moderate score if not enough samples

        # Volatility Score (inverse relationship)
        vol_score = 1 - min(risk_metrics['Return_Volatility'], 0.5) / 0.5
        scores['volatility'] = max(vol_score, 0)
        
        # VaR Confidence
        var_ratio = abs(risk_metrics['VaR_95'] / risk_metrics['VaR_99'])
        scores['var_confidence'] = min(var_ratio, 1)
        
        # Prediction Interval Width (smaller width = higher confidence)
        interval_width = (sim_results['upper_95'].iloc[-1] - sim_results['lower_95'].iloc[-1]) / sim_results['mean_path'].iloc[-1]
        scores['interval_confidence'] = max(1 - interval_width, 0)
        
        # Weight and combine statistical scores
        weights = {
            'skewness': 0.25,
            'volatility': 0.25,
            'var_confidence': 0.25,
            'interval_confidence': 0.25
        }
        
        statistical_score = sum(score * weights[key] for key, score in scores.items())
        return statistical_score, scores
    
    def calculate_market_confidence(self, data, backtest_metrics):
        """Calculate confidence score based on market conditions and backtest performance"""
        scores = {}
        
        # Sharpe Ratio Score
        sharpe_score = min(backtest_metrics['Sharpe_Ratio'] / 3, 1)  # Normalized to max of 3
        scores['sharpe_ratio'] = max(sharpe_score, 0)
        
        # Win Rate Score
        scores['win_rate'] = backtest_metrics['Win_Rate']
        
        # Market Trend Stability
        price_stability = 1 - (data['Volatility'].iloc[-1] / data['Volatility'].rolling(window=252).max().iloc[-1])
        scores['market_stability'] = price_stability
        
        # Excess Return Score
        excess_return_score = min(backtest_metrics['Excess_Return'] / 0.2, 1)  # Normalized to 20% excess return
        scores['excess_return'] = max(excess_return_score, 0)
        
        # Weight and combine market scores
        weights = {
            'sharpe_ratio': 0.3,
            'win_rate': 0.3,
            'market_stability': 0.2,
            'excess_return': 0.2
        }
        
        market_score = sum(score * weights[key] for key, score in scores.items())
        return market_score, scores
    
    def calculate_overall_confidence(self, data, risk_metrics, sim_results, backtest_metrics):
        """Calculate overall confidence score and detailed breakdown"""
        # Calculate individual component scores
        technical_score, technical_breakdown = self.calculate_technical_confidence(data)
        statistical_score, statistical_breakdown = self.calculate_statistical_confidence(risk_metrics, sim_results)
        market_score, market_breakdown = self.calculate_market_confidence(data, backtest_metrics)
        
        # Calculate weighted overall confidence score
        overall_confidence = (
            technical_score * self.weight_technical +
            statistical_score * self.weight_statistical +
            market_score * self.weight_market
        )
        
        # Prepare detailed confidence report
        confidence_report = {
            'overall_confidence': overall_confidence,
            'technical_confidence': {
                'score': technical_score,
                'breakdown': technical_breakdown
            },
            'statistical_confidence': {
                'score': statistical_score,
                'breakdown': statistical_breakdown
            },
            'market_confidence': {
                'score': market_score,
                'breakdown': market_breakdown
            }
        }
        
        return confidence_report

    def get_confidence_interpretation(self, confidence_score):
        """Provide interpretation of confidence scores"""
        if confidence_score >= 0.8:
            return "Very High Confidence"
        elif confidence_score >= 0.6:
            return "High Confidence"
        elif confidence_score >= 0.4:
            return "Moderate Confidence"
        elif confidence_score >= 0.2:
            return "Low Confidence"
        else:
            return "Very Low Confidence"

class FinancialNarrativeGenerator:
    def __init__(self, symbol, api_key):
        self.symbol = symbol
        self.stock = yf.Ticker(symbol)
        self.client = Groq(api_key=api_key)
        self.confidence_scorer = ConfidenceScorer()
        
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
        """Perform Monte Carlo simulation for price forecasting with optimized DataFrame creation"""
        returns = np.log(df['Close'] / df['Close'].shift(1))
        mu = returns.mean()
        sigma = returns.std()
    
        last_price = df['Close'].iloc[-1]
    
        # Pre-allocate a numpy array for all simulations
        all_simulations = np.zeros((forecast_days + 1, num_simulations))
        all_simulations[0] = last_price
    
        # Perform all simulations using numpy operations
        for day in range(1, forecast_days + 1):
            random_returns = np.random.normal(mu, sigma, num_simulations)
            all_simulations[day] = all_simulations[day-1] * np.exp(random_returns)
    
        # Convert to DataFrame efficiently
        simulation_df = pd.DataFrame(
            all_simulations,
            columns=[f'Sim_{i}' for i in range(num_simulations)]
        )
    
        # Calculate confidence intervals
        sim_results = {
            'mean_path': simulation_df.mean(axis=1),
            'upper_95': simulation_df.apply(lambda x: np.percentile(x, 95), axis=1),
            'lower_95': simulation_df.apply(lambda x: np.percentile(x, 5), axis=1),
            'max_path': simulation_df.max(axis=1),
            'min_path': simulation_df.min(axis=1)
        }
    
        # Calculate risk metrics
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
    
    def get_stock_insights(self, data, sim_results=None, risk_metrics=None, backtest_metrics=None):
        """Generate comprehensive stock insights using Groq LLM with confidence scoring"""
        try:
            # Calculate confidence scores
            confidence_report = self.confidence_scorer.calculate_overall_confidence(
                data, risk_metrics, sim_results, backtest_metrics
            )
        
            latest_data = {
                'price': data['Close'].iloc[-1],
                'volume': data['Volume'].iloc[-1],
                'daily_return': data['Daily_Return'].iloc[-1] * 100,
                'volatility': data['Volatility'].iloc[-1] * 100,
                'trend_strength': data['Trend_Strength'].iloc[-1],
                'adx': data['ADX'].iloc[-1],
                'bb_width': data['BB_Width'].iloc[-1]
            }
        
            # Base prompt with technical analysis and confidence scores
            prompt = f"""
            Comprehensive Technical Analysis for {self.symbol}
            
            Confidence Assessment:
            - Overall Analysis Confidence: {confidence_report['overall_confidence']:.2f} ({self.confidence_scorer.get_confidence_interpretation(confidence_report['overall_confidence'])})
            - Technical Analysis Confidence: {confidence_report['technical_confidence']['score']:.2f}
            - Statistical Analysis Confidence: {confidence_report['statistical_confidence']['score']:.2f}
            - Market Analysis Confidence: {confidence_report['market_confidence']['score']:.2f}
            
            Key Confidence Factors:
            - Trend Agreement: {confidence_report['technical_confidence']['breakdown']['trend_agreement']:.2f}
            - Volume Confirmation: {confidence_report['technical_confidence']['breakdown']['volume_confidence']:.2f}
            - Statistical Reliability: {confidence_report['statistical_confidence']['breakdown']['skewness']:.2f}
            - Market Stability: {confidence_report['market_confidence']['breakdown']['market_stability']:.2f}
            
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
                
                Risk Metrics (Confidence: {confidence_report['statistical_confidence']['score']:.2f}):
                - 95% VaR: {risk_metrics['VaR_95']*100:.2f}%
                - 99% VaR: {risk_metrics['VaR_99']*100:.2f}%
                - Expected Shortfall: {risk_metrics['Expected_Shortfall']*100:.2f}%
                - Expected Return: {risk_metrics['Expected_Return']*100:.2f}%
                - Return Volatility: {risk_metrics['Return_Volatility']*100:.2f}%
                """
        
            # Add backtesting results if available
            if backtest_metrics:
                prompt += f"""
                
                Backtesting Results (Confidence: {confidence_report['market_confidence']['score']:.2f}):
                - Total Strategy Return: {backtest_metrics['Total_Return']*100:.2f}%
                - Market Return: {backtest_metrics['Market_Return']*100:.2f}%
                - Excess Return: {backtest_metrics['Excess_Return']*100:.2f}%
                - Sharpe Ratio: {backtest_metrics['Sharpe_Ratio']:.2f}
                - Maximum Drawdown: {backtest_metrics['Max_Drawdown']*100:.2f}%
                - Win Rate: {backtest_metrics['Win_Rate']*100:.2f}%
                """
        
            prompt += """
            
            Please provide a comprehensive analysis including:
            1. Overall Trend Analysis and Strength (with confidence assessment)
            2. Momentum Analysis (RSI, Stochastic, MACD) and reliability
            3. Volatility Assessment and Risk Levels
            4. Monte Carlo Simulation Insights and Prediction Confidence
            5. Backtesting Performance Analysis and Strategy Reliability
            6. Support/Resistance Levels and Potential Breakouts
            7. Short-term and Medium-term Technical Outlook
            8. Trading Strategy Recommendations with Confidence Levels
            
            For each analysis component, please indicate the confidence level and explain the factors contributing to that confidence assessment.
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

    def plot_advanced_analysis(self, df):
        """Create comprehensive technical analysis plots without Monte Carlo simulation"""
        fig = make_subplots(rows=4, cols=1, 
                           subplot_titles=('Price and Moving Averages', 
                                         'Momentum Indicators',
                                         'Volume Analysis',
                                         'Strategy Performance'),
                           vertical_spacing=0.08,
                           row_heights=[0.4, 0.2, 0.2, 0.2])

        # Price and Moving Averages
        fig.add_trace(go.Candlestick(x=df.index,
                                    open=df['Open'],
                                    high=df['High'],
                                    low=df['Low'],
                                    close=df['Close'],
                                    name='Price'), row=1, col=1)
        fig.add_trace(go.Scatter(x=df.index, y=df['50_MA'], name='50MA'), row=1, col=1)
        fig.add_trace(go.Scatter(x=df.index, y=df['200_MA'], name='200MA'), row=1, col=1)
        fig.add_trace(go.Scatter(x=df.index, y=df['Bollinger_Upper'], name='BB Upper',
                                    line=dict(dash='dash')), row=1, col=1)
        fig.add_trace(go.Scatter(x=df.index, y=df['Bollinger_Lower'], name='BB Lower',
                                line=dict(dash='dash')), row=1, col=1)
    
        # Momentum Indicators
        fig.add_trace(go.Scatter(x=df.index, y=df['RSI'], name='RSI'), row=2, col=1)
        fig.add_trace(go.Scatter(x=df.index, y=df['Stoch_K'], name='Stoch K'), row=2, col=1)
        fig.add_trace(go.Scatter(x=df.index, y=df['Stoch_D'], name='Stoch D'), row=2, col=1)
    
        # Volume Analysis
        fig.add_trace(go.Bar(x=df.index, y=df['Volume'], name='Volume'), row=3, col=1)
        fig.add_trace(go.Scatter(x=df.index, y=df['OBV'], name='OBV'), row=3, col=1)
    
        # Strategy Performance
        if 'Cum_Strategy_Returns' in df.columns and 'Cum_Market_Returns' in df.columns:
            fig.add_trace(go.Scatter(x=df.index, y=df['Cum_Strategy_Returns'],
                                   name='Strategy Returns'), row=4, col=1)
            fig.add_trace(go.Scatter(x=df.index, y=df['Cum_Market_Returns'],
                                   name='Market Returns'), row=4, col=1)
    
        fig.update_layout(height=1200, 
                         title_text=f"Technical Analysis - {self.symbol}",
                         showlegend=True)
    
        # Update y-axes labels
        fig.update_yaxes(title_text="Price", row=1, col=1)
        fig.update_yaxes(title_text="Value", row=2, col=1)
        fig.update_yaxes(title_text="Volume", row=3, col=1)
        fig.update_yaxes(title_text="Returns", row=4, col=1)
    
        return fig

def main(symbol="TCS.NS", api_key="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"):
    try:
        # Initialize the generator
        generator = FinancialNarrativeGenerator(symbol, api_key)
        
        # Fetch historical data
        historical_data = generator.fetch_historical_data()
        
        # Perform Monte Carlo simulation
        sim_results, risk_metrics = generator.monte_carlo_simulation(historical_data)
        
        # Perform backtesting
        backtest_metrics, historical_data = generator.backtest_strategy(historical_data)
        
        # Generate AI insights with all metrics
        narrative = generator.get_stock_insights(
            historical_data,
            sim_results,
            risk_metrics,
            backtest_metrics
        )
        
        # Create visualization (removed sim_results parameter)
        fig = generator.plot_advanced_analysis(historical_data)
        
        # Print results
        print("\nNarrative Analysis:")
        print(narrative)
        
        print("\nMonte Carlo Risk Metrics:")
        for metric, value in risk_metrics.items():
            print(f"{metric}: {value:.4f}")
        
        print("\nBacktesting Metrics:")
        for metric, value in backtest_metrics.items():
            print(f"{metric}: {value:.4f}")
        
        # Display the plot
        fig.show()
        
        return narrative, fig, historical_data, sim_results, risk_metrics, backtest_metrics
    
    except Exception as e:
        print(f"Error in main: {str(e)}")
        return None, None, None, None, None, None

if __name__ == "__main__":
    results = main("TCS.NS")
