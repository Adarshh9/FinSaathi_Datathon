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
  Legend,
  AreaChart,
  Area
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
  BarChart2,
  Target,
  TrendingUp as TrendingUpIcon,
  Shield,
  Navigation
} from 'lucide-react';
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import showdown from 'showdown'

// API Functions
const executeAnalysis = async (symbol) => {
  try {
    const response = await fetch('http://localhost:5000/api/analyze', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ symbol }),
    });
    if (!response.ok) throw new Error('Failed to execute analysis');
    return await response.json();
  } catch (error) {
    console.error('Error executing analysis:', error);
    throw error;
  }
};

const executeDetailedAnalysis = async (symbol) => {
  try {
    const response = await fetch('http://localhost:5000/api/financial/analyze', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ symbol }),
    });
    if (!response.ok) throw new Error('Failed to execute detailed analysis');
    return await response.json();
  } catch (error) {
    console.error('Error executing detailed analysis:', error);
    throw error;
  }
};
const getConfidenceScore = async (symbol) => {
  try {
    const response = await fetch('http://localhost:5000/api/financial/confidence', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ symbol }),
    });
    
    if (!response.ok) throw new Error('Failed to get confidence score');
    
    // Preprocess the response text to replace NaN with null
    const responseText = await response.text();
    const sanitizedText = responseText.replace(/NaN/g, 'null');
    const data = JSON.parse(sanitizedText);
    
    // Sanitize the confidence data to handle NaN values
    const sanitizedData = {
      overall_confidence: parseFloat(data.data.overall_confidence) || 0,
      technical_confidence: parseFloat(data.data.technical_confidence.score) || 0,
      statistical_confidence: parseFloat(data.data.statistical_confidence.score) || 0,
      market_confidence: parseFloat(data.data.market_confidence.score) || 0
    };
    
    return { status: data.status, data: sanitizedData };
  } catch (error) {
    console.error('Error getting confidence score:', error);
    // Return default values if there's an error
    return {
      status: "error",
      data: {
        overall_confidence: 0,
        technical_confidence: 0,
        statistical_confidence: 0,
        market_confidence: 0
      }
    };
  }
};

const backtestStrategy = async (symbol, initialCapital = 100000) => {
  try {
    const response = await fetch('http://localhost:5000/api/financial/backtest', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ symbol, initial_capital: initialCapital }),
    });
    if (!response.ok) throw new Error('Failed to backtest strategy');
    return await response.json();
  } catch (error) {
    console.error('Error backtesting strategy:', error);
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

// Components
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

// Updated ConfidenceScore component
const ConfidenceScore = ({ score, interpretation, technical, statistical, market }) => {
  // Ensure score is a valid number between 0 and 1
  const validScore = score !== null ? Math.min(Math.max(parseFloat(score) || 0, 0), 1) : null;

  return (
    <Card className="hover:shadow-lg transition-shadow duration-200">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Target className="h-5 w-5" />
          <span>Confidence Score</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {validScore !== 0 && (
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Overall Confidence</span>
                <span className="text-sm font-bold">{(validScore * 100).toFixed(1)}%</span>
              </div>
              <Progress value={validScore * 100} className="h-2" />
            </div>
          )}
          {technical !== 0 && (
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Technical Confidence</span>
                <span className="text-sm font-bold">{(technical * 100).toFixed(1)}%</span>
              </div>
              <Progress value={technical * 100} className="h-2" />
            </div>
          )}
          {statistical !== 0 && (
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Statistical Confidence</span>
                <span className="text-sm font-bold">{(statistical * 100).toFixed(1)}%</span>
              </div>
              <Progress value={statistical * 100} className="h-2" />
            </div>
          )}
          {market !== 0 && (
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Market Confidence</span>
                <span className="text-sm font-bold">{(market * 100).toFixed(1)}%</span>
              </div>
              <Progress value={market * 100} className="h-2" />
            </div>
          )}
          </div>
      </CardContent>
    </Card>
  );
};

const BacktestResults = ({ data }) => (
  <Card className="col-span-2 hover:shadow-lg transition-shadow duration-200">
    <CardHeader>
      <CardTitle className="flex items-center space-x-2">
        <TrendingUpIcon className="h-5 w-5" />
        <span>Strategy Performance</span>
      </CardTitle>
    </CardHeader>
    <CardContent>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {Object.entries(data.metrics).map(([key, value]) => (
          <div key={key} className="space-y-1">
            <p className="text-sm text-gray-500">{key.replace(/_/g, ' ')}</p>
            <p className="text-lg font-medium">
              {typeof value === 'number' ? value.toFixed(2) : value}
            </p>
          </div>
        ))}
      </div>
      <div className="h-[300px]">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data.portfolio_history}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Area
              type="monotone"
              dataKey="Portfolio_Value"
              stroke="#8884d8"
              fill="#8884d8"
              fillOpacity={0.3}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </CardContent>
  </Card>
);

const RiskMetrics = ({ metrics }) => (
  <Card className="hover:shadow-lg transition-shadow duration-200">
    <CardHeader>
      <CardTitle className="flex items-center space-x-2">
        <Shield className="h-5 w-5" />
        <span>Risk Metrics</span>
      </CardTitle>
    </CardHeader>
    <CardContent>
      <div className="grid grid-cols-2 gap-4">
        {Object.entries(metrics).map(([key, value]) => (
          <div key={key} className="space-y-1">
            <p className="text-sm text-gray-500">{key.replace(/_/g, ' ')}</p>
            <p className="text-lg font-medium">{(value * 100).toFixed(2)} %</p>
          </div>
        ))}
      </div>
    </CardContent>
  </Card>
);

// Analysis Dropdown Component
const AnalysisDropdown = ({ analysis }) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <Card className="hover:shadow-lg transition-shadow duration-200">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Button onClick={() => setIsOpen(!isOpen)}>
            {isOpen ? 'Hide Analysis Steps' : 'Show Analysis Steps'}
          </Button>
        </CardTitle>
      </CardHeader>
      {isOpen && (
        <CardContent>
          <div className="prose prose-sm max-w-none">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>
              {analysis}
            </ReactMarkdown>
          </div>
        </CardContent>
      )}
    </Card>
  );
};

const extractAnalysisSteps = (narrative) => {
  const thinkTagContent = narrative.match(/<think>([\s\S]*?)<\/think>/);
  return thinkTagContent ? thinkTagContent[1] : '';
};

const removeThinkTagContent = (narrative) => {
  return narrative.replace(/<think>[\s\S]*?<\/think>/, '');
};

// Main Component
export default function FinancialAnalysisPage() {
  const [symbol, setSymbol] = useState('AAPL');
  const [inputSymbol, setInputSymbol] = useState('AAPL');
  const [basicData, setBasicData] = useState(null);
  const [detailedData, setDetailedData] = useState(null);
  const [confidenceData, setConfidenceData] = useState(null);
  const [backtestData, setBacktestData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchResults, setSearchResults] = useState([]);

  const fetchAllData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Fetch all data in parallel
      const [basicResult, detailedResult, confidenceResult, backtestResult] = await Promise.all([
        executeAnalysis(symbol),
        executeDetailedAnalysis(symbol),
        getConfidenceScore(symbol),
        backtestStrategy(symbol)
      ]);
      // Validate confidence data before setting state
      const validConfidenceData = confidenceResult?.data || {
        overall_confidence: 0,
        technical_confidence: 0,
        statistical_confidence: 0,
        market_confidence: 0,
        interpretation: "No confidence data available"
      };
  
      setBasicData(basicResult.data);
      setDetailedData(detailedResult.data);
      setConfidenceData(validConfidenceData);
      setBacktestData(backtestResult.data);
    } catch (err) {
      setError(err.message);
      // Set default values for confidence data in case of error
      setConfidenceData({
        overall_confidence: 0,
        technical_confidence: 0,
        statistical_confidence: 0,
        market_confidence: 0,
        interpretation: "Error loading confidence data"
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllData();
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
  const exportToPDF = async () => {
    const pdf = new jsPDF('p', 'mm', 'a4');
    const margin = 15;
    const pageWidth = pdf.internal.pageSize.getWidth() - margin * 2;
    let y = margin;
  
    // Helper functions
    const addNewPageIfNeeded = (requiredSpace) => {
      if (y + requiredSpace > pdf.internal.pageSize.getHeight() - margin) {
        pdf.addPage();
        y = margin;
        return true;
      }
      return false;
    };
  
    const formatCurrency = (value, currency = 'USD') => {
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: currency,
        notation: 'compact',
        maximumFractionDigits: 1
      }).format(value);
    };
  
    // Create a promise-based chart capture function
    const captureChart = async (elementId) => {
      const chartElement = document.getElementById(elementId);
      if (!chartElement) return null;
  
      // Get the SVG element directly if it exists
      const svgElement = chartElement.querySelector('svg');
      if (!svgElement) return null;
  
      try {
        // Convert SVG to canvas for better quality
        const svgData = new XMLSerializer().serializeToString(svgElement);
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        // Set canvas size to match SVG
        const svgRect = svgElement.getBoundingClientRect();
        canvas.width = svgRect.width * 2; // 2x for better quality
        canvas.height = svgRect.height * 2;
        
        // Create image from SVG
        const img = new Image();
        img.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgData)));
        
        await new Promise((resolve) => {
          img.onload = () => {
            ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
            resolve();
          };
        });
        
        return canvas.toDataURL('image/png');
      } catch (error) {
        console.error('Error capturing chart:', error);
        return null;
      }
    };
  
    try {
      // Start loading logo early
      const logoPromise = new Promise((resolve) => {
        const logo = new Image();
        logo.src = 'https://github.com/yashgv/FinSaathi_Datathon/blob/main/frontend/src/assets/finsaathi-logo.png'; // Update path to match your logo location
        logo.onload = () => resolve(logo);
        logo.onerror = () => resolve(null);
      });
  
      // Capture charts in parallel
      const [priceChartData, volumeChartData, rsiMacdChartData] = await Promise.all([
        captureChart('price-chart'),
        captureChart('volume-chart'),
        captureChart('rsi-macd-chart')
      ]);
  
      // Add logo if loaded successfully
      const logo = await logoPromise;
      if (logo) {
        pdf.addImage(logo, 'PNG', margin, margin, 30, 30);
      }
  
      // Title and Header
      pdf.setFillColor(52, 86, 153);
      pdf.rect(0, 0, pdf.internal.pageSize.getWidth(), 50, 'F');
      pdf.setTextColor(255);
      pdf.setFontSize(28);
      pdf.setFont(undefined, 'bold');
      pdf.text('Financial Analysis Report', 50, 35);
  
      // Subtitle with date
      pdf.setFontSize(12);
      pdf.setFont(undefined, 'normal');
      const dateStr = new Date().toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
      pdf.text(dateStr, 50, 45);
      y = 70;
  
      // Company Information Section
      pdf.setDrawColor(52, 86, 153);
      pdf.setFillColor(245, 247, 250);
      pdf.roundedRect(margin, y, pageWidth, 40, 3, 3, 'FD');
      
      pdf.setTextColor(40);
      pdf.setFontSize(20);
      pdf.setFont(undefined, 'bold');
      pdf.text(`${basicData?.company_name || symbol}`, margin + 5, y + 15);
      
      pdf.setFontSize(12);
      pdf.setFont(undefined, 'normal');
      pdf.text(`Sector: ${basicData?.metadata?.sector || 'N/A'}`, margin + 5, y + 30);
      pdf.text(`Industry: ${basicData?.metadata?.industry || 'N/A'}`, margin + pageWidth/2, y + 30);
      y += 50;
  
      // Key Metrics Section
      const metrics = [
        ['Current Price', `${basicData?.metadata?.currency || '$'}${basicData?.historical_data?.[basicData?.historical_data?.length - 1]?.Close.toFixed(2)}`],
        ['Trading Volume', new Intl.NumberFormat().format(basicData?.historical_data?.[0]?.Volume)],
        ['Market Cap', formatCurrency(basicData?.metadata?.market_cap)],
        ['Confidence Score', `${(confidenceData?.overall_confidence * 100).toFixed(1)}%`]
      ];
  
      pdf.setFillColor(52, 86, 153, 0.1);
      pdf.rect(margin, y, pageWidth, 8, 'F');
      pdf.setTextColor(52, 86, 153);
      pdf.setFontSize(16);
      pdf.setFont(undefined, 'bold');
      pdf.text('Key Metrics', margin + 5, y + 6);
      y += 15;
  
      // Create a grid for metrics
      const colWidth = pageWidth / 2;
      metrics.forEach(([label, value], index) => {
        const xPos = margin + (index % 2) * colWidth;
        pdf.setFontSize(11);
        pdf.setFont(undefined, 'bold');
        pdf.setTextColor(80);
        pdf.text(label, xPos, y);
        pdf.setFont(undefined, 'normal');
        pdf.setTextColor(40);
        pdf.text(value, xPos, y + 6);
        if (index % 2 === 1) y += 15;
      });
      y += 15;
  
      // Add charts if captured successfully
      const addChartToPDF = (chartData, title) => {
        if (chartData) {
          addNewPageIfNeeded(160);
          pdf.setFillColor(52, 86, 153, 0.1);
          pdf.rect(margin, y, pageWidth, 8, 'F');
          pdf.setTextColor(52, 86, 153);
          pdf.setFontSize(16);
          pdf.setFont(undefined, 'bold');
          pdf.text(title, margin + 5, y + 6);
          y += 15;
  
          const imgProps = pdf.getImageProperties(chartData);
          const imgHeight = (imgProps.height * pageWidth) / imgProps.width;
          pdf.addImage(chartData, 'PNG', margin, y, pageWidth, imgHeight);
          y += imgHeight + 15;
        }
      };
  
      // Add charts in sequence
      addChartToPDF(priceChartData, 'Price Analysis');
      addChartToPDF(volumeChartData, 'Volume Analysis');
      addChartToPDF(rsiMacdChartData, 'Technical Indicators');
  
      // Add narrative content
      if (narrativeWithoutThinkTag) {
        addNewPageIfNeeded(100);
        pdf.setFillColor(52, 86, 153, 0.1);
        pdf.rect(margin, y, pageWidth, 8, 'F');
        pdf.setTextColor(52, 86, 153);
        pdf.setFontSize(16);
        pdf.setFont(undefined, 'bold');
        pdf.text('AI Analysis', margin + 5, y + 6);
        y += 15;
  
        pdf.setFontSize(11);
        pdf.setFont(undefined, 'normal');
        pdf.setTextColor(60);
        const lines = pdf.splitTextToSize(narrativeWithoutThinkTag, pageWidth);
        lines.forEach(line => {
          addNewPageIfNeeded(8);
          pdf.text(line, margin, y);
          y += 6;
        });
      }
  
      // Add footers
      const totalPages = pdf.internal.getNumberOfPages();
      for (let i = 1; i <= totalPages; i++) {
        pdf.setPage(i);
        pdf.setDrawColor(200, 200, 200);
        pdf.line(margin, pdf.internal.pageSize.getHeight() - 20, 
                 pdf.internal.pageSize.getWidth() - margin, 
                 pdf.internal.pageSize.getHeight() - 20);
        
        pdf.setFontSize(10);
        pdf.setTextColor(150);
        pdf.text(
          `Page ${i} of ${totalPages}`,
          pdf.internal.pageSize.getWidth() / 2,
          pdf.internal.pageSize.getHeight() - 10,
          { align: 'center' }
        );
        
        pdf.setTextColor(100);
        pdf.text(
          basicData?.company_name || symbol,
          margin,
          pdf.internal.pageSize.getHeight() - 10
        );
      }
  
      // Save the PDF
      pdf.save(`${symbol}_analysis_${new Date().toISOString().split('T')[0]}.pdf`);
  
    } catch (error) {
      console.error('Error generating PDF:', error);
      // You might want to show an error message to the user here
    }
  };

  const analysisSteps = extractAnalysisSteps(detailedData?.narrative || '');
  const narrativeWithoutThinkTag = removeThinkTagContent(detailedData?.narrative || '');

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto p-6 space-y-6" id="analysis-content">
        {/* Header and Search */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center space-y-4 md:space-y-0">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
              Financial Analysis
            </h1>
            {basicData?.company_name && (
              <p className="text-gray-600 mt-1">{basicData.company_name}</p>
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
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {loading ? (
          <LoadingSkeleton />
        ) : (
          <Tabs defaultValue="overview" className="space-y-6">
           {/* Export Button */}
           <Button onClick={exportToPDF} className="bg-indigo-600 hover:bg-indigo-700">
              Export as PDF
            </Button>
            <TabsList className="grid w-full grid-cols-2 lg:grid-cols-4">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="technical">Technical Analysis</TabsTrigger>
              <TabsTrigger value="backtest">Backtest Results</TabsTrigger>
              <TabsTrigger value="risk">Risk Analysis</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-6">
              {/* Overview Metrics */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <MetricCard
                  title="Current Price"
                  value={`${basicData?.metadata?.currency || '$'}${basicData?.historical_data?.[basicData?.historical_data?.length - 1]?.Close.toFixed(2)}`}
                  change={((basicData?.historical_data?.[0]?.Close - basicData?.historical_data?.[1]?.Close) / basicData?.historical_data?.[1]?.Close * 100) || 0}
                  icon={Banknote}
                  description="Latest trading price and 24h change"
                />
                <MetricCard
                  title="Volume"
                  value={new Intl.NumberFormat().format(basicData?.historical_data?.[0]?.Volume)}
                  change={((basicData?.historical_data?.[0]?.Volume -basicData?.historical_data?.[1]?.Volume) / basicData?.historical_data?.[1]?.Volume * 100) || 0}
                  icon={Activity}
                  description="Trading volume and 24h change"
                />
                <MetricCard
                  title="Volatility"
                  value={`${(detailedData?.technical_analysis?.risk_metrics?.Return_Volatility * 100 || 0).toFixed(2)}%`}
                  change={0}
                  icon={TrendingUp}
                  description="30-day historical volatility"
                />
                <ConfidenceScore 
                  score={confidenceData?.overall_confidence || 0}
                  interpretation={confidenceData?.interpretation || ''}
                  technical={confidenceData?.technical_confidence || 0}
                  statistical={confidenceData?.statistical_confidence?.score || 0}
                  market={confidenceData?.market_confidence?.score || 0}
                />
                
              </div>

              {/* Company Overview */}
              <Card className="hover:shadow-lg transition-shadow duration-200">
                <CardHeader>
                  <CardTitle>Company Overview</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div>
                      <p className="text-sm text-gray-500">Sector</p>
                      <p className="font-medium">{basicData?.metadata?.sector || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Industry</p>
                      <p className="font-medium">{basicData?.metadata?.industry || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Market Cap</p>
                      <p className="font-medium">
                        {basicData?.metadata?.market_cap 
                          ? new Intl.NumberFormat('en-US', {
                              style: 'currency',
                              currency: basicData?.metadata?.currency || 'USD',
                              notation: 'compact',
                              maximumFractionDigits: 1
                            }).format(basicData.metadata.market_cap)
                          : 'N/A'}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Currency</p>
                      <p className="font-medium">{basicData?.metadata?.currency || 'USD'}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* AI Analysis */}
              <Card className="hover:shadow-lg transition-shadow duration-200">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Activity className="h-5 w-5" />
                    <span>AI Analysis</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="prose prose-sm max-w-none">
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>
                      {narrativeWithoutThinkTag}
                    </ReactMarkdown>
                  </div>
                </CardContent>
              </Card>

              {/* Analysis Steps Dropdown */}
              <AnalysisDropdown analysis={analysisSteps} />

             
            </TabsContent>

            <TabsContent value="technical" className="space-y-6">
              {/* Price Chart */}
              <Card className="hover:shadow-lg transition-shadow duration-200" id="price-chart">
                <CardHeader>
                  <CardTitle>Price Analysis</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-[400px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={basicData?.historical_data || []}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis 
                          dataKey="Date" 
                          tickFormatter={(date) => new Date(date).toLocaleDateString()}
                        />
                        <YAxis />
                        <Tooltip 
                          labelFormatter={(date) => new Date(date).toLocaleDateString()}
                          formatter={(value) => [`$${value.toFixed(2)}`, '']}
                        />
                        <Legend />
                        <Line 
                          type="monotone" 
                          dataKey="Close" 
                          stroke="#6366f1" 
                          name="Price"
                          dot={false}
                        />
                        <Line 
                          type="monotone" 
                          dataKey="50_MA" 
                          stroke="#22c55e" 
                          name="50 MA"
                          dot={false}
                        />
                        <Line 
                          type="monotone" 
                          dataKey="200_MA" 
                          stroke="#eab308" 
                          name="200 MA"
                          dot={false}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              {/* Technical Indicators */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card className="hover:shadow-lg transition-shadow duration-200" id="rsi-macd-chart">
                  <CardHeader>
                    <CardTitle>RSI & MACD</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="h-[300px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={basicData?.historical_data || []}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis 
                            dataKey="Date" 
                            tickFormatter={(date) => new Date(date).toLocaleDateString()}
                          />
                          <YAxis />
                          <Tooltip 
                            labelFormatter={(date) => new Date(date).toLocaleDateString()}
                          />
                          <Legend />
                          <Line 
                            type="monotone" 
                            dataKey="RSI" 
                            stroke="#6366f1" 
                            name="RSI"
                            dot={false}
                          />
                          <Line 
                            type="monotone" 
                            dataKey="MACD" 
                            stroke="#22c55e" 
                            name="MACD"
                            dot={false}
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>

                <Card className="hover:shadow-lg transition-shadow duration-200" id="volume-chart">
                  <CardHeader>
                    <CardTitle>Volume Analysis</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="h-[300px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={basicData?.historical_data || []}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis 
                            dataKey="Date" 
                            tickFormatter={(date) => new Date(date).toLocaleDateString()}
                          />
                          <YAxis 
                            tickFormatter={(value) => `${(value / 1000000).toFixed(0)}M`}
                          />
                          <Tooltip 
                            labelFormatter={(date) => new Date(date).toLocaleDateString()}
                            formatter={(value) => [new Intl.NumberFormat().format(value), 'Volume']}
                          />
                          <Legend />
                          <Bar 
                            dataKey="Volume" 
                            fill="#6366f1" 
                            name="Volume"
                          />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="backtest" className="space-y-6">
              <BacktestResults data={backtestData || { metrics: {}, portfolio_history: [] }} />
            </TabsContent>

            <TabsContent value="risk" className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <RiskMetrics metrics={detailedData?.technical_analysis?.risk_metrics || {}} />
                <Card className="hover:shadow-lg transition-shadow duration-200" id="risk-chart">
                  <CardHeader>
                    <CardTitle>Monte Carlo Simulation</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div>
                        <p className="text-sm text-gray-500">Expected Price</p>
                        <p className="text-lg font-medium">
                          ${detailedData?.monte_carlo?.expected_price?.toFixed(2)}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">95% Confidence Interval</p>
                        <p className="text-lg font-medium">
                          ${detailedData?.monte_carlo?.confidence_interval?.lower?.toFixed(2)} - 
                          ${detailedData?.monte_carlo?.confidence_interval?.upper?.toFixed(2)}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        )}
      </div>
    </div>
  );
}

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