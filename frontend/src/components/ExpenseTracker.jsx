"use client";
import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';

const ExpenseTracker = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [report, setReport] = useState(null);
  const [formData, setFormData] = useState({
    income: '',
    expenses: {
      Rent: '',
      Groceries: '',
      Utilities: '',
      Transport: '',
      Healthcare: '',
      Entertainment: '',
      Education: '',
      Others: ''
    },
    savings: '',
    goals: ['']
  });

  const handleExpenseChange = (category, value) => {
    setFormData(prev => ({
      ...prev,
      expenses: {
        ...prev.expenses,
        [category]: value
      }
    }));
  };

  const handleGoalChange = (index, value) => {
    const newGoals = [...formData.goals];
    newGoals[index] = value;
    setFormData(prev => ({
      ...prev,
      goals: newGoals
    }));
  };

  const addGoal = () => {
    setFormData(prev => ({
      ...prev,
      goals: [...prev.goals, '']
    }));
  };

  const generateReport = async () => {
    try {
      setLoading(true);
      setError('');

      // Convert string values to numbers and format goals
      const payload = {
        income: parseFloat(formData.income),
        expenses: Object.fromEntries(
          Object.entries(formData.expenses)
            .map(([key, value]) => [key, parseFloat(value) || 0])
        ),
        savings: parseFloat(formData.savings),
        goals: formData.goals.filter(goal => goal.trim() !== '')
      };

      const response = await fetch('http://localhost:5000/api/generate-report', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        throw new Error('Failed to generate report');
      }

      const data = await response.json();
      setReport(data.report); // Update this line to access the nested report
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <Card>
        <CardHeader>
          <CardTitle>Financial Report Generator</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Income Input */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Monthly Income (₹)</label>
            <Input
              type="number"
              value={formData.income}
              onChange={(e) => setFormData(prev => ({...prev, income: e.target.value}))}
              placeholder="Enter monthly income"
            />
          </div>

          {/* Expenses Section */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Monthly Expenses</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {Object.keys(formData.expenses).map((category) => (
                <div key={category} className="space-y-2">
                  <label className="text-sm font-medium">{category} (₹)</label>
                  <Input
                    type="number"
                    value={formData.expenses[category]}
                    onChange={(e) => handleExpenseChange(category, e.target.value)}
                    placeholder={`Enter ${category.toLowerCase()} expense`}
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Savings Input */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Current Savings (₹)</label>
            <Input
              type="number"
              value={formData.savings}
              onChange={(e) => setFormData(prev => ({...prev, savings: e.target.value}))}
              placeholder="Enter current savings"
            />
          </div>

          {/* Financial Goals Section */}
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-medium">Financial Goals</h3>
              <Button onClick={addGoal} size="sm">Add Goal</Button>
            </div>
            <div className="space-y-2">
              {formData.goals.map((goal, index) => (
                <Input
                  key={index}
                  value={goal}
                  onChange={(e) => handleGoalChange(index, e.target.value)}
                  placeholder="Enter goal (e.g., Emergency Fund: 30000)"
                  className="mt-2"
                />
              ))}
            </div>
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <Button 
            onClick={generateReport} 
            className="w-full"
            disabled={loading}
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Generating Report
              </>
            ) : (
              'Generate Report'
            )}
          </Button>

          {/* Report Display */}
          {report && (
            <div className="mt-6 space-y-4">
              <h3 className="text-xl font-bold">Financial Report</h3>
              
              {/* Financial Analysis */}
              <div className="space-y-2">
                <h4 className="font-medium">Budget Analysis</h4>
                <div className="grid grid-cols-2 gap-2">
                  <div>Income Status:</div>
                  <div>{report.financial_analysis.budget_analysis.income_status}</div>
                  <div>Expense Ratio:</div>
                  <div>{report.financial_analysis.budget_analysis.expense_ratio}%</div>
                </div>
              </div>

              {/* Savings Plans */}
              {report.savings_plans.length > 0 && (
                <div className="space-y-2">
                  <h4 className="font-medium">Savings Plans</h4>
                  {report.savings_plans.map((plan, index) => (
                    <div key={index} className="p-4 bg-gray-50 rounded-lg">
                      <div className="font-medium">{plan.goal}</div>
                      <div className="text-sm text-gray-600">
                        Monthly Target: ₹{plan.plan.monthly_target}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Assistance Programs */}
              {report.assistance_programs.length > 0 && (
                <div className="space-y-2">
                  <h4 className="font-medium">Available Assistance Programs</h4>
                  {report.assistance_programs.map((program, index) => (
                    <div key={index} className="p-4 bg-gray-50 rounded-lg">
                      <div className="font-medium">{program.program_name}</div>
                      <div className="text-sm text-gray-600">{program.description}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ExpenseTracker;