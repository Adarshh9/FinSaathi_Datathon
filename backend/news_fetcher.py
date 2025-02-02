import feedparser
from datetime import datetime
from typing import List, Dict, Optional
import xml.etree.ElementTree as ET
import requests
from concurrent.futures import ThreadPoolExecutor
from dataclasses import dataclass
from functools import lru_cache
import time


@dataclass
class NewsItem:
    title: str
    link: str
    description: str
    pub_date: str
    image_url: Optional[str]
    source: str


class NewsFetcher:
    def __init__(self, rss_feeds: List[Dict[str, str]], cache_timeout: int = 300):
        """
        Initialize NewsFetcher with RSS feed URLs and cache timeout.

        Args:
            rss_feeds: List of dictionaries containing RSS feed information
                      [{"url": "feed_url", "name": "source_name"}]
            cache_timeout: Cache timeout in seconds (default: 5 minutes)
        """
        self.rss_feeds = rss_feeds
        self.cache_timeout = cache_timeout

    def _parse_date(self, date_str: str) -> datetime:
        """Parse various date formats to datetime object."""
        try:
            # Try different date formats
            date_formats = [
                "%a, %d %b %Y %H:%M:%S %z",
                "%a, %d %b %Y %H:%M:%S %Z",
                "%Y-%m-%dT%H:%M:%SZ",
            ]

            for format in date_formats:
                try:
                    return datetime.strptime(date_str, format)
                except ValueError:
                    continue

            # If no format matches, return current time
            return datetime.now()
        except Exception:
            return datetime.now()

    def _extract_image_url(self, entry) -> Optional[str]:
        """Extract image URL from various RSS feed formats."""
        try:
            # Try media:content
            if "media_content" in entry:
                for media in entry.media_content:
                    if "url" in media:
                        return media["url"]

            # Try enclosures
            if "enclosures" in entry and entry.enclosures:
                for enclosure in entry.enclosures:
                    if "type" in enclosure and enclosure.type.startswith("image/"):
                        return enclosure.href

            # Try content
            if "content" in entry and entry.content:
                content = entry.content[0].value
                root = ET.fromstring(content)
                img = root.find(".//img")
                if img is not None:
                    return img.get("src")

            return None
        except Exception:
            return None

    def _fetch_single_feed(self, feed_info: Dict[str, str]) -> List[NewsItem]:
        """Fetch and parse a single RSS feed."""
        try:
            feed = feedparser.parse(feed_info["url"])
            news_items = []

            for entry in feed.entries:
                news_item = NewsItem(
                    title=entry.get("title", "")
                    .replace("<![CDATA[", "")
                    .replace("]]>", ""),
                    link=entry.get("link", ""),
                    description=entry.get("description", "")
                    .replace("<![CDATA[", "")
                    .replace("]]>", ""),
                    pub_date=self._parse_date(entry.get("published", "")).isoformat(),
                    image_url=self._extract_image_url(entry),
                    source=feed_info["name"],
                )
                news_items.append(news_item)

            return news_items
        except Exception as e:
            print(f"Error fetching feed {feed_info['url']}: {str(e)}")
            return []

    @lru_cache(maxsize=1)
    def _get_cached_timestamp(self) -> float:
        """Get current timestamp for cache invalidation."""
        return time.time()

    def fetch_all_news(self) -> List[Dict]:
        """
        Fetch news from all configured RSS feeds.
        Returns cached results if within cache timeout.
        """
        # Check cache invalidation
        current_time = time.time()
        if (
            hasattr(self, "_cached_news")
            and (current_time - self._get_cached_timestamp()) < self.cache_timeout
        ):
            return self._cached_news

        all_news = []

        # Use ThreadPoolExecutor for parallel fetching
        with ThreadPoolExecutor(max_workers=10) as executor:
            results = list(executor.map(self._fetch_single_feed, self.rss_feeds))

        # Flatten results and sort by publication date
        for result in results:
            all_news.extend(result)

        # Sort by publication date (newest first)
        all_news.sort(key=lambda x: x.pub_date, reverse=True)

        # Convert to dictionary format
        news_dict = [
            {
                "title": item.title,
                "link": item.link,
                "description": item.description,
                "publishedAt": item.pub_date,
                "imageUrl": item.image_url,
                "source": item.source,
            }
            for item in all_news
        ]

        # Cache the results
        self._cached_news = news_dict
        self._get_cached_timestamp.cache_clear()
        self._get_cached_timestamp()

        return news_dict
