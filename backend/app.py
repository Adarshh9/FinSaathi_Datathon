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
                        "content": """You are FinSaathi AI, an expert financial advisor specialized in Indian financial markets 
                        and investment options. Provide practical advice considering Indian context, available investment 
                        options, and typical returns in the Indian market. Use INR amounts and Indian financial terms."""
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



if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    app.run(host='0.0.0.0', port=port, debug=True)