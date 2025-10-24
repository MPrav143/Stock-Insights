from flask import Flask, render_template, request, jsonify
import requests
import os

app = Flask(__name__)

# Replace with your Alpha Vantage API key
ALPHA_VANTAGE_API_KEY = "LXVUEX6IDEYL72GA"

def get_stock_symbol(company_name):
    """Convert company name to stock symbol"""
    url = "https://www.alphavantage.co/query"
    params = {
        "function": "SYMBOL_SEARCH",
        "keywords": company_name,
        "apikey": ALPHA_VANTAGE_API_KEY
    }
    
    try:
        response = requests.get(url, params=params)
        data = response.json()
        
        if "bestMatches" in data and data["bestMatches"]:
            # Return the first/best match
            best_match = data["bestMatches"][0]
            return {
                "symbol": best_match["1. symbol"],
                "name": best_match["2. name"],
                "region": best_match["4. region"],
                "currency": best_match["8. currency"]
            }
        return None
    except Exception as e:
        print(f"Error fetching symbol: {e}")
        return None

def get_stock_data(symbol):
    """Get daily time series data for the stock"""
    url = "https://www.alphavantage.co/query"
    params = {
        "function": "TIME_SERIES_DAILY",
        "symbol": symbol,
        "apikey": ALPHA_VANTAGE_API_KEY
    }
    
    try:
        response = requests.get(url, params=params)
        data = response.json()
        
        if "Time Series (Daily)" in data:
            time_series = data["Time Series (Daily)"]
            dates = sorted(time_series.keys())[-30:]  # Last 30 days
            
            chart_data = {
                "dates": dates,
                "prices": [float(time_series[date]["4. close"]) for date in dates]
            }
            
            # Latest day data
            latest_date = dates[-1]
            latest_data = time_series[latest_date]
            
            stock_info = {
                "current_price": float(latest_data["4. close"]),
                "open_price": float(latest_data["1. open"]),
                "high_price": float(latest_data["2. high"]),
                "low_price": float(latest_data["3. low"]),
                "volume": int(latest_data["5. volume"]),
                "previous_close": float(time_series[dates[-2]]["4. close"]) if len(dates) > 1 else float(latest_data["4. close"])
            }
            
            return {
                "chart_data": chart_data,
                "stock_info": stock_info,
                "success": True
            }
        else:
            return {"success": False, "error": "No data found for symbol"}
            
    except Exception as e:
        print(f"Error fetching stock data: {e}")
        return {"success": False, "error": str(e)}

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/stock', methods=['POST'])
def get_stock():
    company_name = request.json.get('company_name', '').strip()
    
    if not company_name:
        return jsonify({"success": False, "error": "Please enter a company name"})
    
    # Get stock symbol from company name
    symbol_data = get_stock_symbol(company_name)
    if not symbol_data:
        return jsonify({"success": False, "error": "Company not found. Please try a different name."})
    
    # Get stock data
    stock_data = get_stock_data(symbol_data["symbol"])
    if not stock_data["success"]:
        return jsonify({"success": False, "error": stock_data.get("error", "Failed to fetch stock data")})
    
    # Combine all data
    result = {
        "success": True,
        "company_name": symbol_data["name"],
        "symbol": symbol_data["symbol"],
        "region": symbol_data["region"],
        "currency": symbol_data["currency"],
        "chart_data": stock_data["chart_data"],
        "stock_info": stock_data["stock_info"]
    }
    
    return jsonify(result)

if __name__ == '__main__':
    app.run(debug=True)