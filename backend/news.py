from flask import Flask, render_template
import feedparser
import requests
from bs4 import BeautifulSoup
from groq import Groq
import warnings
import torch
from flask_cors import CORS

app = Flask(__name__)
CORS(app, resources={r"/*": {"origins": "http://localhost:3000"}})
# Suppress warnings
warnings.simplefilter("ignore")

# Initialize Groq client
client = Groq(api_key="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")

# Use GPU if available
device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
print(f"Using device: {device}")

# RSS feed configuration
RSS_FEEDS = {
    "livemint": "https://www.livemint.com/rss/companies",
}


def fetch_news(rss_url, source_name):
    """Fetches news articles from an RSS feed."""
    news = feedparser.parse(rss_url)
    news_items = []
    for entry in news.entries:
        title = entry.title
        link = entry.link
        description = (
            entry.description
            if hasattr(entry, "description")
            else "No description available"
        )
        pub_date = (
            entry.published
            if hasattr(entry, "published")
            else "Unknown publication date"
        )
        image_url = None
        if hasattr(entry, "media_content") and entry.media_content:
            image_url = (
                entry.media_content[0]["url"]
                if "url" in entry.media_content[0]
                else None
            )
        news_items.append(
            {
                "title": title,
                "link": link,
                "description": description,
                "pub_date": pub_date,
                "image_url": image_url,
                "source": source_name,
            }
        )
    return news_items


def extract_text_from_url(url):
    """Extracts the main text content from a news article URL."""
    try:
        response = requests.get(url)
        response.raise_for_status()
        soup = BeautifulSoup(response.content, "html.parser")

        # Remove script and style elements
        for script in soup(["script", "style"]):
            script.decompose()

        text = soup.get_text(separator=" ", strip=True)
        return text[:4000]  # Limit text length to avoid token limits
    except Exception as e:
        print(f"Error extracting text: {e}")
        return None


def analyze_text(text):
    """Analyzes the text using Groq API for both summary and sentiment."""
    try:
        prompt = f"""Analyze the following financial news article and provide:
        1. A concise 2-3 sentence summary of the key points
        2. Sentiment (positive/negative/neutral)
        3. Market impact (bullish/bearish/neutral) with brief explanation

        Article: {text}

        Format your response exactly as:
        SUMMARY: [2-3 sentence summary]
        SENTIMENT: [positive/negative/neutral]
        MARKET_IMPACT: [bullish/bearish/neutral]: [brief explanation]"""

        # Use Groq API with GPU if possible
        with torch.no_grad():
            completion = client.chat.completions.create(
                messages=[{"role": "user", "content": prompt}],
                model="llama3-70b-8192",
                temperature=0.3,
                max_tokens=200,
                top_p=1,
                stream=False,
            )

        response = completion.choices[0].message.content.strip()
        return parse_analysis_response(response)
    except Exception as e:
        print(f"Error analyzing text via Groq API: {e}")
        return None


def parse_analysis_response(response):
    """Parses the structured response from Groq API."""
    try:
        parts = response.split("\n")
        analysis = {}

        for part in parts:
            if part.startswith("SUMMARY:"):
                analysis["summary"] = part.replace("SUMMARY:", "").strip()
            elif part.startswith("SENTIMENT:"):
                analysis["sentiment"] = part.replace("SENTIMENT:", "").strip()
            elif part.startswith("MARKET_IMPACT:"):
                impact_part = part.replace("MARKET_IMPACT:", "").strip()
                analysis["market_impact"] = impact_part

        return analysis
    except Exception as e:
        print(f"Error parsing analysis response: {e}")
        return None


@app.route("/fetch")
def index():
    news_analysis = []

    for source, rss_url in RSS_FEEDS.items():
        try:
            news_items = fetch_news(rss_url, source)
            for news_item in news_items[:5]:  # Limit to 5 articles
                article_data = {
                    "title": news_item["title"],
                    "link": news_item["link"],
                    "description": news_item["description"],
                    "pub_date": news_item["pub_date"],
                    "image_url": news_item["image_url"],
                    "source": news_item["source"],
                    "summary": None,
                    "sentiment": None,
                    "market_impact": None,
                }

                full_text = extract_text_from_url(news_item["link"])
                if full_text:
                    analysis = analyze_text(full_text)
                    if analysis:
                        article_data.update(
                            {
                                "summary": analysis.get("summary"),
                                "sentiment": analysis.get("sentiment"),
                                "market_impact": analysis.get("market_impact"),
                            }
                        )

                news_analysis.append(article_data)

        except Exception as e:
            print(f"Error processing {source}: {e}")

    return {"news_analysis": news_analysis}


if __name__ == "__main__":
    app.run(port=5001, debug=True)
