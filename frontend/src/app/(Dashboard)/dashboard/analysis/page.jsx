'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  Legend
} from 'recharts';
import {
  TrendingUp,
  TrendingDown,
  Activity,
  Banknote,
  DollarSign,
  RefreshCcw,
  Search,
  AlertCircle,
  ArrowUpRight,
  ArrowDownRight,
  Info,
  Percent,
  BarChart2
} from 'lucide-react';
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm"; // Enables tables, footnotes, and strikethroughs

// API Functions
const executeAnalysis = async (symbol) => {
  try {
    const response = await fetch('http://localhost:5000/api/analyze', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ symbol }),
    });

    if (!response.ok) throw new Error('Failed to execute analysis');
    const result = await response.json();
    if (result.status !== 'success') throw new Error(result.message || 'Analysis failed');
    return result.data;
  } catch (error) {
    console.error('Error executing analysis:', error);
    throw error;
  }
};

const searchSymbols = async (query) => {
  try {
    const response = await fetch(`http://localhost:5000/api/symbols/search?q=${encodeURIComponent(query)}`);
    if (!response.ok) throw new Error('Failed to search symbols');
    const data = await response.json();
    return data.results || [];
  } catch (error) {
    console.error('Error searching symbols:', error);
    return [];
  }
};

// Metric Card Component
const MetricCard = ({ title, value, change, icon: Icon, description }) => {
  const isPositive = change >= 0;
  const changeColor = isPositive ? 'text-green-500' : 'text-red-500';
  const bgColor = isPositive ? 'bg-green-50' : 'bg-red-50';
  const ChangeIcon = isPositive ? ArrowUpRight : ArrowDownRight;
  
  return (
    <Card className="hover:shadow-lg transition-shadow duration-200">
      <CardContent className="pt-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className={`p-2 rounded-full ${bgColor}`}>
              <Icon className="h-5 w-5 text-muted-foreground" />
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">{title}</p>
              <div className="flex items-center mt-1">
                <span className="text-2xl font-bold">{value}</span>
                <div className={`ml-2 flex items-center ${changeColor}`}>
                  <ChangeIcon className="h-4 w-4" />
                  <span className="text-sm font-medium ml-1">
                    {Math.abs(change).toFixed(2)}%
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
        <p className="text-sm text-muted-foreground">{description}</p>
      </CardContent>
    </Card>
  );
};

// Chart Components
const ChartCard = ({ title, children, info }) => (
  <Card className="hover:shadow-lg transition-shadow duration-200">
    <CardHeader className="flex flex-row items-center justify-between pb-2">
      <CardTitle className="text-lg font-semibold">{title}</CardTitle>
      <div className="relative group">
        <Info className="h-4 w-4 text-muted-foreground cursor-help" />
        <div className="absolute hidden group-hover:block right-0 w-64 p-2 bg-white border rounded-md shadow-lg text-sm z-10">
          {info}
        </div>
      </div>
    </CardHeader>
    <CardContent>{children}</CardContent>
  </Card>
);

const PriceChart = ({ data }) => (
  <ChartCard 
    title="Price Analysis" 
    info="Historical price movement with 50-day and 200-day moving averages"
  >
    <div className="h-[400px]">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis 
            dataKey="Date" 
            tickFormatter={(date) => new Date(date).toLocaleDateString()}
            stroke="#888"
          />
          <YAxis yAxisId="left" stroke="#888" />
          <YAxis yAxisId="right" orientation="right" stroke="#888" />
          <Tooltip 
            labelFormatter={(date) => new Date(date).toLocaleDateString()}
            formatter={(value) => [`$${value.toFixed(2)}`, '']}
            contentStyle={{ borderRadius: '8px' }}
          />
          <Legend />
          <Line 
            yAxisId="left"
            type="monotone" 
            dataKey="Close" 
            stroke="#6366f1" 
            name="Price"
            strokeWidth={2}
            dot={false}
          />
          <Line 
            yAxisId="left"
            type="monotone" 
            dataKey="50_MA" 
            stroke="#22c55e" 
            name="50 MA"
            strokeWidth={1.5}
            dot={false}
          />
          <Line 
            yAxisId="left"
            type="monotone" 
            dataKey="200_MA" 
            stroke="#eab308" 
            name="200 MA"
            strokeWidth={1.5}
            dot={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  </ChartCard>
);

const IndicatorChart = ({ data }) => (
  <ChartCard 
    title="Technical Indicators" 
    info="RSI, MACD, and Volatility indicators for technical analysis"
  >
    <div className="h-[400px]">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis 
            dataKey="Date" 
            tickFormatter={(date) => new Date(date).toLocaleDateString()}
            stroke="#888"
          />
          <YAxis stroke="#888" />
          <Tooltip 
            labelFormatter={(date) => new Date(date).toLocaleDateString()}
            formatter={(value) => [value.toFixed(2), '']}
            contentStyle={{ borderRadius: '8px' }}
          />
          <Legend />
          <Line 
            type="monotone" 
            dataKey="RSI" 
            stroke="#6366f1" 
            name="RSI"
            strokeWidth={2}
            dot={false}
          />
          <Line 
            type="monotone" 
            dataKey="MACD" 
            stroke="#22c55e" 
            name="MACD"
            strokeWidth={1.5}
            dot={false}
          />
          <Line 
            type="monotone" 
            dataKey="Volatility" 
            stroke="#eab308" 
            name="Volatility"
            strokeWidth={1.5}
            dot={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  </ChartCard>
);

const VolumeChart = ({ data }) => (
  <ChartCard 
    title="Volume Analysis" 
    info="Daily trading volume analysis"
  >
    <div className="h-[300px]">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis 
            dataKey="Date" 
            tickFormatter={(date) => new Date(date).toLocaleDateString()}
            stroke="#888"
          />
          <YAxis stroke="#888" 
           tickFormatter={(value) => `${(value / 1000).toFixed(0)}k`} 
          />
          <Tooltip 
            labelFormatter={(date) => new Date(date).toLocaleDateString()}
            formatter={(value) => [new Intl.NumberFormat().format(value), 'Volume']}
            contentStyle={{ borderRadius: '8px' }}
          />
          <Legend />
          <Bar 
            dataKey="Volume" 
            fill="#6366f1" 
            name="Volume"
            radius={[4, 4, 0, 0]}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  </ChartCard>
);



const AIAnalysis = ({ narrative }) => (
  <Card className="col-span-2 hover:shadow-lg transition-shadow duration-200">
    <CardHeader>
      <CardTitle className="flex items-center space-x-2">
        <Activity className="h-5 w-5" />
        <span>AI Analysis</span>
      </CardTitle>
    </CardHeader>
    <CardContent>
      <div className="prose prose-sm max-w-none leading-relaxed">
        <ReactMarkdown remarkPlugins={[remarkGfm]}>
          {narrative}
        </ReactMarkdown>
      </div>
    </CardContent>
  </Card>
);


// Loading Skeleton Component
const LoadingSkeleton = () => (
  <div className="space-y-6">
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {[...Array(4)].map((_, i) => (
        <Card key={i}>
          <CardContent className="pt-6">
            <Skeleton className="h-4 w-[100px] mb-4" />
            <Skeleton className="h-8 w-[150px] mb-2" />
            <Skeleton className="h-4 w-[200px]" />
          </CardContent>
        </Card>
      ))}
    </div>
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {[...Array(4)].map((_, i) => (
        <Card key={i}>
          <CardHeader>
            <Skeleton className="h-6 w-[150px]" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-[300px] w-full" />
          </CardContent>
        </Card>
      ))}
    </div>
  </div>
);

// Main Component
export default function FinancialAnalysisPage() {
  const [symbol, setSymbol] = useState('TCS.NS');
  const [inputSymbol, setInputSymbol] = useState('TCS.NS');
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchResults, setSearchResults] = useState([]);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await executeAnalysis(symbol);
      setData(result);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [symbol]);

  const handleSubmit = (e) => {
    e.preventDefault();
    setSymbol(inputSymbol);
  };

  const handleSymbolSearch = async (query) => {
    if (query.length >= 2) {
      const results = await searchSymbols(query);
      setSearchResults(results);
    } else {
      setSearchResults([]);
    }
  };

  const getLatestMetrics = () => {
    if (!data?.historical_data?.length) return null;
    const latest = data.historical_data[data.historical_data.length - 1];
    const previousDay = data.historical_data[data.historical_data.length - 2];
    
    const calculateChange = (current, previous) => 
      previous ? ((current - previous) / previous) * 100 : 0;

    return {
      price: {
        value: latest.Close.toFixed(2),
        change: calculateChange(latest.Close, previousDay.Close)
      },
      rsi: {
        value: latest.RSI.toFixed(2),
        change: calculateChange(latest.RSI, previousDay.RSI)
      },
      macd: {
        value: latest.MACD.toFixed(2),
        change: calculateChange(latest.MACD, previousDay.MACD)
      },
      volatility: {
        value: (latest.Volatility * 100).toFixed(2) + '%',
        change: calculateChange(latest.Volatility, previousDay.Volatility)
      }
    };
  };

  const metrics = getLatestMetrics();

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto p-6 space-y-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center space-y-4 md:space-y-0">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
              Financial Analysis
            </h1>
            {data?.company_name && (
              <p className="text-gray-600 mt-1">{data.company_name}</p>
            )}
          </div>
          
          <form onSubmit={handleSubmit} className="flex w-full md:w-auto space-x-2">
            <div className="relative flex-1 md:flex-initial">
              <Input
                value={inputSymbol}
                onChange={(e) => {
                  setInputSymbol(e.target.value);
                  handleSymbolSearch(e.target.value);
                }}
                placeholder="Search stocks..."
                className="w-full md:w-64 pl-10"
              />
              <Search className="h-4 w-4 absolute left-3 top-3 text-gray-400" />
              
              {searchResults.length > 0 && (
                <div className="absolute z-10 w-full bg-white shadow-xl rounded-md mt-1 border border-gray-100">
                  {searchResults.map((result) => (
                    <div
                      key={result.symbol}
                      className="p-3 hover:bg-gray-50 cursor-pointer border-b last:border-b-0"
                      onClick={() => {
                        setInputSymbol(result.symbol);
                        setSearchResults([]);
                      }}
                    >
                      <div className="font-medium">{result.symbol}</div>
                      <div className="text-sm text-gray-600">{result.name}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <Button 
              type="submit"
              className="bg-indigo-600 hover:bg-indigo-700"
            >
              <Search className="h-4 w-4 mr-2" />
              Analyze
            </Button>
          </form>
        </div>

        {error && (
          <Alert variant="destructive" className="animate-in fade-in slide-in-from-top-2">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {loading ? (
          <LoadingSkeleton />
        ) : (
          <>
            {metrics && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 animate-in fade-in-50">
                <MetricCard
                  title="Current Price"
                  value={`${data?.metadata?.currency || '$'}${metrics.price.value}`}
                  change={metrics.price.change}
                  icon={Banknote}
                  description="Latest trading price and 24h change"
                />
                <MetricCard
                  title="RSI (14)"
                  value={metrics.rsi.value}
                  change={metrics.rsi.change}
                  icon={Activity}
                  description="Relative Strength Index - Momentum indicator"
                />
                <MetricCard
                  title="MACD"
                  value={metrics.macd.value}
                  change={metrics.macd.change}
                  icon={TrendingUp}
                  description="Moving Average Convergence/Divergence"
                />
                <MetricCard
                  title="Volatility"
                  value={metrics.volatility.value}
                  change={metrics.volatility.change}
                  icon={Percent}
                  description="30-day historical volatility measure"
                />
              </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-in fade-in-50 duration-500">
              <PriceChart data={data?.historical_data || []} />
              <IndicatorChart data={data?.historical_data || []} />
              <VolumeChart data={data?.historical_data || []} />
              <AIAnalysis narrative={data?.narrative || ''} />
            </div>

            {/* Additional Statistics */}
            <Card className="mt-6">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <BarChart2 className="h-5 w-5" />
                  <span>Key Statistics</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {data?.statistics && Object.entries(data.statistics).map(([key, value]) => (
                    <div key={key} className="space-y-1">
                      <p className="text-sm text-gray-500">{key}</p>
                      <p className="text-lg font-medium">{value}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </>
        )}

        {/* Mobile-friendly bottom action bar */}
        <div className="fixed bottom-0 left-0 right-0 md:hidden bg-white border-t p-4 flex justify-between items-center">
          <Button 
            variant="outline" 
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          >
            Back to Top
          </Button>
          <Button 
            onClick={fetchData}
            className="bg-indigo-600 hover:bg-indigo-700"
          >
            <RefreshCcw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>
    </div>
  );
}