'use client';
import React, { useState, useMemo, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertCircle, PieChart, Plus, Ban, Trash2 } from 'lucide-react';
import { useExpense } from '@/context/ExpenseContext';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, PieChart as RePieChart, Pie, Cell, Legend
} from 'recharts';

// Constants
const CATEGORIES = ['food', 'transport', 'utilities', 'entertainment', 'shopping'];
const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];
const INITIAL_EXPENSE_STATE = {
  amount: '',
  category: 'food',
  description: '',
  date: new Date().toISOString().split('T')[0]
};

// Reusable Components
const EmptyState = ({ message }) => (
  <div className="flex flex-col items-center justify-center p-6 text-center text-muted-foreground">
    <Ban className="h-12 w-12 mb-4" />
    <p>{message}</p>
  </div>
);

const ChartWrapper = ({ children, data, height = "300px" }) => {
  if (!data?.length) {
    return <EmptyState message="No data available" />;
  }
  return (
    <div style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        {children}
      </ResponsiveContainer>
    </div>
  );
};

const ExpenseForm = ({ onSubmit, initialState }) => {
  const [formData, setFormData] = useState(initialState);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.amount || !formData.category) return;
    
    onSubmit({
      ...formData,
      amount: parseFloat(formData.amount)
    });
    setFormData(initialState);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Input
        type="number"
        placeholder="Amount"
        value={formData.amount}
        onChange={(e) => setFormData(prev => ({ ...prev, amount: e.target.value }))}
        className="mb-2"
        required
      />
      <Select
        value={formData.category}
        onValueChange={(value) => setFormData(prev => ({ ...prev, category: value }))}
      >
        <SelectTrigger>
          <SelectValue placeholder="Category" />
        </SelectTrigger>
        <SelectContent>
          {CATEGORIES.map(category => (
            <SelectItem key={category} value={category}>
              {category.charAt(0).toUpperCase() + category.slice(1)}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Input
        type="text"
        placeholder="Description"
        value={formData.description}
        onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
        className="mb-2"
      />
      <Input
        type="date"
        value={formData.date}
        onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))}
        className="mb-2"
        required
      />
      <Button type="submit" className="w-full">
        <Plus className="w-4 h-4 mr-2" /> Add Expense
      </Button>
    </form>
  );
};

const Dashboard = () => {
  const { expenses = [], stats = {}, addExpense, deleteExpense } = useExpense();

  // Memoized data transformations
  const getHighestCategory = useMemo(() => {
    const categoryTotals = stats.categoryTotals || {};
    const entries = Object.entries(categoryTotals);
    return entries.length > 0 
      ? entries.sort(([,a], [,b]) => b - a)[0][0]
      : 'No data';
  }, [stats.categoryTotals]);

  const monthlyTrends = useMemo(() => {
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const monthlyTotals = new Map();
    const today = new Date();
    const sixMonthsAgo = new Date(today.getFullYear(), today.getMonth() - 5, 1);

    // Initialize last 6 months with zero values
    for (let i = 0; i < 6; i++) {
      const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
      const monthKey = `${monthNames[d.getMonth()]} ${d.getFullYear()}`;
      monthlyTotals.set(monthKey, 0);
    }

    // Sum expenses by month
    expenses.forEach(expense => {
      const expenseDate = new Date(expense.date);
      if (expenseDate >= sixMonthsAgo) {
        const monthKey = `${monthNames[expenseDate.getMonth()]} ${expenseDate.getFullYear()}`;
        if (monthlyTotals.has(monthKey)) {
          monthlyTotals.set(monthKey, monthlyTotals.get(monthKey) + expense.amount);
        }
      }
    });

    // Convert to array and sort chronologically
    return Array.from(monthlyTotals.entries())
      .map(([month, amount]) => ({ month, amount }))
      .reverse();
  }, [expenses]);

  const weeklyData = useMemo(() => 
    Object.entries(stats.dailyTotals || {}).map(([day, amount]) => ({
      day,
      amount: amount || 0
    })), [stats.dailyTotals]);

  const pieChartData = useMemo(() => 
    Object.entries(stats.weeklyCategoryTotals || {}).map(([name, value]) => ({
      name,
      value: value || 0
    })), [stats.weeklyCategoryTotals]);

  // Handlers
  const handleAddExpense = useCallback((newExpense) => {
    addExpense(newExpense);
  }, [addExpense]);

  const handleDeleteExpense = useCallback((id) => {
    deleteExpense(id);
  }, [deleteExpense]);

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-6">Financial Dashboard</h1>
      
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="weekly">Weekly Analysis</TabsTrigger>
          <TabsTrigger value="expenses">Expenses</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Add New Expense</CardTitle>
              </CardHeader>
              <CardContent>
                <ExpenseForm 
                  onSubmit={handleAddExpense}
                  initialState={INITIAL_EXPENSE_STATE}
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Expenses</CardTitle>
                <AlertCircle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  ₹{(stats.totalExpenses || 0).toLocaleString()}
                </div>
                <p className="text-xs text-muted-foreground">
                  {expenses.length} total transactions
                </p>
                <p className="text-sm mt-2 text-muted-foreground">
                  Highest category: {getHighestCategory}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Category Breakdown</CardTitle>
                <PieChart className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                {Object.keys(stats.categoryTotals || {}).length > 0 ? (
                  <div className="space-y-2">
                    {Object.entries(stats.categoryTotals || {}).map(([category, amount]) => (
                      <div key={category} className="flex justify-between">
                        <span className="capitalize">{category}</span>
                        <span>₹{amount.toLocaleString()}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <EmptyState message="No category data available" />
                )}
              </CardContent>
            </Card>
          </div>

          <Card className="mt-4">
            <CardHeader>
              <CardTitle>Monthly Trends</CardTitle>
            </CardHeader>
            <CardContent>
              <ChartWrapper data={monthlyTrends}>
                <LineChart data={monthlyTrends}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Line 
                    type="monotone" 
                    dataKey="amount" 
                    stroke="#8884d8"
                    strokeWidth={2}
                    dot={{ r: 4 }}
                  />
                </LineChart>
              </ChartWrapper>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="weekly" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Weekly Total Expenses</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  ₹{(stats.weeklyTotal || 0).toLocaleString()}
                </div>
                <p className="text-sm text-muted-foreground mt-2">
                  {Object.keys(stats.dailyTotals || {}).length} days with transactions
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Weekly Breakdown</CardTitle>
              </CardHeader>
              <CardContent>
                <ChartWrapper data={weeklyData}>
                  <BarChart data={weeklyData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="day" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="amount" fill="#82ca9d" />
                  </BarChart>
                </ChartWrapper>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="expenses" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Expenses List</CardTitle>
            </CardHeader>
            <CardContent>
              {expenses.length > 0 ? (
                <div className="space-y-4">
                  {expenses
                    .sort((a, b) => new Date(b.date) - new Date(a.date))
                    .map((expense) => (
                      <div key={expense.id} className="flex justify-between items-center border-b pb-2">
                        <div>
                          <p className="font-medium">
                            {expense.description || 'No description'}
                          </p>
                          <p className="text-sm text-muted-foreground capitalize">
                            {expense.category} - {new Date(expense.date).toLocaleDateString()}
                          </p>
                        </div>
                        <div className="flex items-center gap-4">
                          <span className="font-semibold">
                            ₹{expense.amount.toLocaleString()}
                          </span>
                          <Button 
                            variant="ghost" 
                            size="icon"
                            className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                            onClick={() => handleDeleteExpense(expense.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                </div>
              ) : (
                <EmptyState message="No expenses recorded yet" />
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Category Distribution</CardTitle>
            </CardHeader>
            <CardContent>
              <ChartWrapper data={pieChartData}>
                <RePieChart>
                  <Pie 
                    data={pieChartData} 
                    dataKey="value" 
                    nameKey="name" 
                    cx="50%" 
                    cy="50%" 
                    outerRadius={80}
                  >
                    {pieChartData.map((entry, index) => (
                      <Cell 
                        key={`cell-${index}`} 
                        fill={COLORS[index % COLORS.length]} 
                      />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </RePieChart>
              </ChartWrapper>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Dashboard;