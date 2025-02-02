'use client'
import React, { useEffect, useState } from "react";
import {
  Clock,
  Link as LinkIcon,
  Newspaper,
  AlertCircle,
  Loader2,
  Search,
  TrendingUp,
  TrendingDown,
  Minus,
  ThumbsUp,
  ThumbsDown,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardContent, CardFooter } from "@/components/ui/card";

const ScrollArea = ({ children, className = "" }) => (
  <div className={`overflow-auto ${className}`}>{children}</div>
);

const ErrorMessage = ({ message }) => (
  <div className="flex items-center gap-2 p-4 text-red-600 bg-red-50 rounded-lg">
    <AlertCircle className="h-5 w-5" />
    <p>{message}</p>
  </div>
);

const LoadingSkeleton = () => (
  <div className="animate-pulse">
    {[1, 2, 3].map((i) => (
      <div key={i} className="mb-4">
        <div className="h-32 bg-gray-200 rounded-lg mb-2"></div>
        <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
        <div className="h-4 bg-gray-200 rounded w-1/2"></div>
      </div>
    ))}
  </div>
);

const SentimentIcon = ({ sentiment }) => {
  switch (sentiment?.toLowerCase()) {
    case "positive":
      return <ThumbsUp className="h-4 w-4 text-green-500" />;
    case "negative":
      return <ThumbsDown className="h-4 w-4 text-red-500" />;
    default:
      return <Minus className="h-4 w-4 text-gray-500" />;
  }
};

const MarketImpactIcon = ({ impact }) => {
  const impactType = impact?.split(":")[0]?.toLowerCase().trim();
  switch (impactType) {
    case "bullish":
      return <TrendingUp className="h-4 w-4 text-green-500" />;
    case "bearish":
      return <TrendingDown className="h-4 w-4 text-red-500" />;
    default:
      return <Minus className="h-4 w-4 text-gray-500" />;
  }
};

const formatDate = (dateStr) => {
  const date = new Date(dateStr);
  return date.toLocaleString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const NewsFeed = () => {
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      setDebouncedQuery(searchQuery);
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [searchQuery]);

  useEffect(() => {
    const fetchNews = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await fetch("http://localhost:5001/fetch");
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        setArticles(data.news_analysis);
      } catch (err) {
        setError(err.message || "Failed to fetch news");
        console.error("Error fetching news:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchNews();
  }, []);

  const filteredArticles = React.useMemo(() => {
    if (!debouncedQuery) return articles;

    const searchTerms = debouncedQuery.toLowerCase().split(" ");
    return articles.filter((article) => {
      const searchableText = `${article.title} ${article.description} ${article.source} ${article.summary}`.toLowerCase();
      return searchTerms.every((term) => searchableText.includes(term));
    });
  }, [articles, debouncedQuery]);

  return (
    <div className="container mx-auto p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <Newspaper className="h-6 w-6 text-gray-700" />
          <h1 className="text-3xl font-bold text-gray-900">Financial News Feed</h1>
        </div>
        {!loading && !error && (
          <div className="text-sm text-gray-500">
            Showing {filteredArticles.length} of {articles.length} articles
          </div>
        )}
      </div>

      <div className="mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search articles by title, description, or summary..."
            className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      </div>

      <ScrollArea className="h-[800px] rounded-md border border-gray-200 p-4 bg-gray-50">
        {loading ? (
          <div className="flex flex-col items-center justify-center h-full">
            <Loader2 className="h-8 w-8 text-blue-600 animate-spin mb-4" />
            <p className="text-gray-600">Loading news articles...</p>
            <LoadingSkeleton />
          </div>
        ) : error ? (
          <ErrorMessage message={error} />
        ) : filteredArticles.length === 0 ? (
          <div className="text-center text-gray-600 py-8">
            {articles.length === 0
              ? "No articles available at the moment"
              : "No articles match your search criteria"}
          </div>
        ) : (
          <div className="grid gap-4">
            {filteredArticles.map((article, index) => (
              <Card key={index} className="overflow-hidden">
                <CardHeader className="p-6">
                  <div className="flex justify-between items-start gap-4">
                    <div className="flex-1">
                      <h2 className="text-xl font-semibold text-gray-900 mb-2">
                        {article.title}
                      </h2>
                      <div className="flex items-center gap-2 text-sm text-gray-500">
                        <Clock className="h-4 w-4" />
                        {formatDate(article.pub_date)}
                        <span className="px-2">•</span>
                        {article.source}
                      </div>
                    </div>
                    {article.image_url && (
                      <img
                        src={article.image_url}
                        alt="Article thumbnail"
                        className="rounded-md object-cover w-32 h-20"
                      />
                    )}
                  </div>
                </CardHeader>

                <CardContent className="px-6">
                  <div className="space-y-4">
                    <p className="text-sm text-gray-600">{article.description}</p>
                    
                    {article.summary && (
                      <div className="bg-gray-50 p-4 rounded-lg">
                        <h3 className="text-sm font-semibold text-gray-700 mb-2">Analysis</h3>
                        <p className="text-sm text-gray-600 mb-3">{article.summary}</p>
                        
                        <div className="flex gap-4">
                          <div className="flex items-center gap-2">
                            <SentimentIcon sentiment={article.sentiment} />
                            <span className="text-sm text-gray-600">
                              Sentiment: {article.sentiment}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <MarketImpactIcon impact={article.market_impact} />
                            <span className="text-sm text-gray-600">
                              Market Impact: {article.market_impact}
                            </span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>

                <CardFooter className="px-6 py-4">
                  <a
                    href={article.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-800 hover:underline transition-colors"
                  >
                    <LinkIcon className="h-4 w-4" />
                    Read full article
                  </a>
                </CardFooter>
              </Card>
            ))}
          </div>
        )}
      </ScrollArea>
    </div>
  );
};

export default NewsFeed;