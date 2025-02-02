from flask import Flask, request, jsonify
from flask_cors import CORS
from scheme_matcher import ImprovedSchemeMatcher
from financial_report import PersonalFinanceAssistant
from werkzeug.middleware.proxy_fix import ProxyFix
from groq import Groq
from datetime import datetime
from dotenv import load_dotenv
import os
from financial_analyzer import FinancialAnalyzer
import warnings
import yfinance as yf
from financial_narrative_generator import FinancialNarrativeGenerator  # Import the new class
from dataclasses import dataclass
from news_fetcher import NewsFetcher

from flask import Flask, request, send_file, jsonify
 # You'll need to use a Python PDF library like reportlab or PyPDF2
from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import mm
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Image, Table, TableStyle
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from io import BytesIO
import base64
from PIL import Image as PILImage
import json
from datetime import datetime
import markdown
import re
import matplotlib.pyplot as plt

warnings.filterwarnings('ignore', category=RuntimeWarning)

# Load environment variables
load_dotenv()

# Initialize Flask app
app = Flask(__name__)

CORS(app, resources={r"/api/*": {"origins": "http://localhost:3000"}})
# Configure CORS properly for all routes
# CORS(app, 
#     resources={
#         r"/api/*": {  # Apply to all /api/ routes
#             "origins": ["http://localhost:3000"],  # Add any other allowed origins as needed
#             "methods": ["GET", "POST", "OPTIONS"],
#             "allow_headers": ["Content-Type", "Authorization"],
#             "supports_credentials": True
#         }
#     }
# )

# Use ProxyFix for proper handling of proxy headers
# app.wsgi_app = ProxyFix(app.wsgi_app, x_proto=1, x_host=1)

class FinSaathiAI:
    def __init__(self):
        self.api_key = os.environ.get('GROQ_API_KEY')
        if not self.api_key:
            raise ValueError("Groq API key must be provided in the GROQ_API_KEY environment variable.")
        self.client = Groq(api_key=self.api_key)
    
    def get_response(self, user_input):
        try:
            response = self.client.chat.completions.create(
                model="llama3-70b-8192",
                messages=[
                    {
                        "role": "system",
                        "content": """You are a Market Education Chatbot, designed to explain financial concepts, investment principles, and economic fundamentals in a clear and engaging way. You do not provide financial advice, stock recommendations, or market predictions. If a user asks an off-topic question, politely redirect them to market-related topics. Keep responses simple, factual, and educational."""
                    },
                    {
                        "role": "user",
                        "content": user_input
                    }
                ],
                temperature=0.7,
                max_tokens=1000
            )
            return response.choices[0].message.content.strip()
        except Exception as e:
            raise Exception(f"Error getting AI response: {str(e)}")

# Initialize components
try:
    ai_assistant = FinSaathiAI()
    # matcher = ImprovedSchemeMatcher()
    # matcher.load_schemes("./Government_Schemes-English.pdf")
except Exception as e:
    print(f"Initialization error: {str(e)}")
    ai_assistant = None
    matcher = None

def create_error_response(message, status_code=400):
    return jsonify({
        "status": "error",
        "message": message
    }), status_code

@app.route('/api/health', methods=['GET'])
def health_check():
    return jsonify({
        "status": "healthy",
        "message": "Server is running",
        "schemes_loaded": len(matcher.schemes) if matcher and hasattr(matcher, 'schemes') else 0
    })

@app.route('/api/chat', methods=['POST'])
def chat():
    if ai_assistant is None:
        return create_error_response("FinSaathi AI is not properly initialized", 500)

    try:
        data = request.get_json()
        if not data or 'message' not in data:
            return create_error_response("No message provided")

        ai_response = ai_assistant.get_response(data['message'])
        current_time = datetime.now().strftime("%I:%M %p")
        
        return jsonify({
            "status": "success",
            "response": {
                "type": "text",
                "content": ai_response,
                "timestamp": current_time,
                "status": True
            }
        })
    except Exception as e:
        return create_error_response(str(e), 500)


@app.errorhandler(404)
def not_found(error):
    return create_error_response("Resource not found", 404)

@app.errorhandler(500)
def server_error(error):
    return create_error_response("Internal server error", 500)


@app.route('/api/analyze', methods=['POST'])
def analyze_stock():
    try:
        data = request.get_json()
        if not data or 'symbol' not in data:
            return create_error_response("No symbol provided")
            
        symbol = data.get('symbol')
        
        # Use the same Groq API key that's already initialized for FinSaathiAI
        analyzer = FinancialAnalyzer(symbol, os.environ.get('GROQ_API_KEY'))
        
        # Fetch historical data
        historical_data = analyzer.fetch_historical_data()
        
        # Generate AI analysis
        analysis = analyzer.get_analysis(historical_data)
        
        # Get company info
        company_info = yf.Ticker(symbol).info
        
        response_data = {
            'symbol': symbol,
            'company_name': company_info.get('longName', symbol),
            'historical_data': historical_data,
            'narrative': analysis,
            'metadata': {
                'sector': company_info.get('sector', 'N/A'),
                'industry': company_info.get('industry', 'N/A'),
                'market_cap': company_info.get('marketCap', 'N/A'),
                'currency': company_info.get('currency', 'USD')
            }
        }
        
        return jsonify({
            "status": "success",
            "data": response_data
        })
        
    except Exception as e:
        return create_error_response(str(e), 500)

@app.route('/api/symbols/search', methods=['GET'])
def search_symbols():
    try:
        query = request.args.get('q', '')
        if len(query) < 2:
            return jsonify([])
            
        matches = yf.Tickers(query).tickers
        
        results = []
        for symbol, ticker in matches.items():
            try:
                info = ticker.info
                results.append({
                    'symbol': symbol,
                    'name': info.get('longName', 'Unknown'),
                    'exchange': info.get('exchange', 'Unknown')
                })
            except:
                continue
                
        return jsonify({
            "status": "success",
            "results": results
        })
        
    except Exception as e:
        return create_error_response(str(e), 500)


@app.route('/api/financial/analyze', methods=['POST'])
def analyze_stock_detailed():
    """Endpoint for detailed stock analysis using FinancialNarrativeGenerator"""
    try:
        data = request.get_json()
        if not data or 'symbol' not in data:
            return create_error_response("No symbol provided")
        
        symbol = data['symbol']
        api_key = os.environ.get('GROQ_API_KEY')
        
        # Initialize the generator
        generator = FinancialNarrativeGenerator(symbol, api_key)
        
        # Fetch historical data
        historical_data = generator.fetch_historical_data()
        
        # Perform Monte Carlo simulation
        sim_results, risk_metrics = generator.monte_carlo_simulation(historical_data)
        
        # Perform backtesting
        backtest_metrics, historical_data = generator.backtest_strategy(historical_data)
        
        # Generate AI insights
        narrative = generator.get_stock_insights(
            historical_data,
            sim_results,
            risk_metrics,
            backtest_metrics
        )
        
        # Create visualization
        fig = generator.plot_advanced_analysis(historical_data)
        
        # Convert plotly figure to JSON
        plot_json = fig.to_json()
        
        # Prepare the response
        response_data = {
            'symbol': symbol,
            'narrative': narrative,
            'technical_analysis': {
                'plot': plot_json,
                'risk_metrics': {k: float(v) for k, v in risk_metrics.items()},
                'backtest_metrics': {k: float(v) if isinstance(v, (int, float)) else v 
                                   for k, v in backtest_metrics.items()}
            },
            'monte_carlo': {
                'expected_price': float(sim_results['mean_path'].iloc[-1]),
                'confidence_interval': {
                    'lower': float(sim_results['lower_95'].iloc[-1]),
                    'upper': float(sim_results['upper_95'].iloc[-1])
                }
            },
            'historical_data': historical_data.to_dict(orient='records')
        }
        
        return jsonify({
            "status": "success",
            "data": response_data
        })
        
    except Exception as e:
        return create_error_response(str(e), 500)

@app.route('/api/financial/confidence', methods=['POST'])
def get_confidence_score():
    """Endpoint to get confidence scores for a stock"""
    try:
        data = request.get_json()
        if not data or 'symbol' not in data:
            return create_error_response("No symbol provided")
        
        symbol = data['symbol']
        api_key = os.environ.get('GROQ_API_KEY')
        
        # Initialize the generator
        generator = FinancialNarrativeGenerator(symbol, api_key)
        
        # Fetch historical data
        historical_data = generator.fetch_historical_data()
        
        # Perform Monte Carlo simulation
        sim_results, risk_metrics = generator.monte_carlo_simulation(historical_data)
        
        # Perform backtesting
        backtest_metrics, historical_data = generator.backtest_strategy(historical_data)
        
        # Calculate confidence scores
        confidence_report = generator.confidence_scorer.calculate_overall_confidence(
            historical_data,
            risk_metrics,
            sim_results,
            backtest_metrics
        )
        
        # Add interpretation
        confidence_report['interpretation'] = generator.confidence_scorer.get_confidence_interpretation(
            confidence_report['overall_confidence']
        )
        
        return jsonify({
            "status": "success",
            "data": confidence_report
        })
        
    except Exception as e:
        return create_error_response(str(e), 500)

@app.route('/api/financial/backtest', methods=['POST'])
def backtest_strategy():
    """Endpoint to backtest trading strategy for a stock"""
    try:
        data = request.get_json()
        if not data or 'symbol' not in data:
            return create_error_response("No symbol provided")
        
        symbol = data['symbol']
        initial_capital = float(data.get('initial_capital', 100000))
        api_key = os.environ.get('GROQ_API_KEY')
        
        # Initialize the generator
        generator = FinancialNarrativeGenerator(symbol, api_key)
        
        # Fetch historical data
        historical_data = generator.fetch_historical_data()
        
        # Perform backtesting
        backtest_metrics, historical_data = generator.backtest_strategy(historical_data, initial_capital)
        
        response_data = {
            'metrics': {k: float(v) if isinstance(v, (int, float)) else v 
                       for k, v in backtest_metrics.items()},
            'portfolio_history': historical_data[['Portfolio_Value', 'Strategy_Returns', 'Cum_Strategy_Returns', 'Cum_Market_Returns']].to_dict(orient='records')
        }
        
        return jsonify({
            "status": "success",
            "data": response_data
        })
        
    except Exception as e:
        return create_error_response(str(e), 500)

RSS_FEEDS = [
    {"url": "https://www.livemint.com/rss/companies", "name": "Livemint Companies"},
    {
        "url": "https://www.moneycontrol.com/rss/business.xml",
        "name": "MoneyControl Business",
    },
    {
        "url": "https://economictimes.indiatimes.com/markets/rssfeeds/1977021501.cms",
        "name": "Economic Times Markets",
    },
    # Add more RSS feeds as needed
]

# Initialize NewsFetcher
try:
    news_fetcher = NewsFetcher(RSS_FEEDS)
except Exception as e:
    print(f"Error initializing NewsFetcher: {str(e)}")
    news_fetcher = None


# Add this new endpoint
@app.route("/api/news", methods=["GET"])
def get_news():
    """
    Fetch news from configured RSS feeds.
    Query parameters:
    - limit (optional): Number of news items to return (default: 50)
    - source (optional): Filter by news source
    """
    try:
        if news_fetcher is None:
            return create_error_response(
                "News fetcher is not properly initialized", 500
            )

        # Get query parameters
        limit = request.args.get("limit", default=50, type=int)
        source = request.args.get("source", default=None, type=str)

        # Fetch news
        news_items = news_fetcher.fetch_all_news()

        # Apply filters
        if source:
            news_items = [
                item for item in news_items if item["source"].lower() == source.lower()
            ]

        # Apply limit
        news_items = news_items

        return jsonify(
            {
                "status": "success",
                "data": {
                    "articles": news_items,
                    "total": len(news_items),
                    "sources": [feed["name"] for feed in RSS_FEEDS],
                },
            }
        )

    except Exception as e:
        return create_error_response(str(e), 500)


def format_currency(value, currency='USD'):
    """Format currency values with abbreviations"""
    if value is None:
        return 'N/A'
    
    try:
        value = float(value)
        if value >= 1_000_000_000:
            return f'{currency}{value/1_000_000_000:.1f}B'
        elif value >= 1_000_000:
            return f'{currency}{value/1_000_000:.1f}M'
        elif value >= 1_000:
            return f'{currency}{value/1_000:.1f}K'
        else:
            return f'{currency}{value:.2f}'
    except (ValueError, TypeError):
        return 'N/A'

def create_chart_image(chart_data):
    """Convert base64 chart data to reportlab Image object"""
    try:
        # Remove data URL prefix if present
        if 'base64,' in chart_data:
            chart_data = chart_data.split('base64,')[1]
            
        # Decode base64 to image
        image_data = BytesIO(base64.b64decode(chart_data))
        img = PILImage.open(image_data)
        
        # Convert to RGB if necessary
        if img.mode != 'RGB':
            img = img.convert('RGB')
            
        # Save as PNG in memory
        img_buffer = BytesIO()
        img.save(img_buffer, format='PNG')
        img_buffer.seek(0)
        
        return Image(img_buffer, width=180*mm, height=108*mm)  # 16:9 aspect ratio
    except Exception as e:
        print(f"Error creating chart image: {e}")
        return None

def clean_markdown(text):
    """Clean markdown text and convert to plain text"""
    # Remove HTML tags
    text = re.sub(r'<[^>]+>', '', text)
    # Convert markdown to plain text
    text = markdown.markdown(text)
    # Remove any remaining HTML
    text = re.sub(r'<[^>]+>', '', text)
    return text.strip()

@app.route('/api/generate-pdf', methods=['POST'])
def generate_pdf():
    try:
        data = request.get_json()
        if not data:
            return create_error_response("Invalid data", 400)

        chartData = data.get('chartData', {})
        priceData = chartData.get('priceData', [])
        volumeData = chartData.get('volumeData', [])
        rsiMacdData = chartData.get('rsiMacdData', [])

        # Create a figure for price data
        fig1, ax1 = plt.subplots()
        dates = [d.get('Date') for d in priceData]
        prices = [d.get('Close') for d in priceData]
        ax1.plot(dates, prices, label="Close Price")
        ax1.set_title("Price Chart")
        ax1.legend()

        # Convert figure to image
        img_buf1 = BytesIO()
        fig1.savefig(img_buf1, format='png')
        img_buf1.seek(0)
        pdf_image1 = Image(img_buf1, width=180*mm, height=100*mm)

        # Repeat for volume or RSI/MACD if desired
        # ...existing code or more plots...

        # Create PDF document
        buffer = BytesIO()
        doc = SimpleDocTemplate(buffer, pagesize=A4)
        elements = []

        elements.append(pdf_image1)
        # Append additional images, text, tables, etc.

        doc.build(elements)

        buffer.seek(0)
        return send_file(buffer, mimetype='application/pdf')
    except Exception as e:
        return create_error_response(str(e), 500)

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    app.run(host='0.0.0.0', port=port, debug=True)