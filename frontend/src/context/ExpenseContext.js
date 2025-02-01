'use client'
// context/ExpenseContext.js
import React, { createContext, useContext, useState, useEffect } from 'react';

const ExpenseContext = createContext();

export const useExpense = () => {
  const context = useContext(ExpenseContext);
  if (!context) {
    throw new Error('useExpense must be used within an ExpenseProvider');
  }
  return context;
};

export const ExpenseProvider = ({ children }) => {
  // Initialize with default values
  const defaultExpenses = [
    {
      id: 1,
      amount: 2500,
      category: 'food',
      description: 'Monthly groceries',
      date: '2024-10-20'
    }
  ];

  const defaultFinancialGoal = {
    description: '',
    amount: '20000'
  };

  // Initialize state with default values
  const [expenses, setExpenses] = useState(defaultExpenses);
  const [monthlyExpense, setMonthlyExpense] = useState('20000');
  const [currentSavings, setCurrentSavings] = useState('80000');
  const [financialGoal, setFinancialGoal] = useState(defaultFinancialGoal);
  const [isInitialized, setIsInitialized] = useState(false);

  // Load data from localStorage once component is mounted
  useEffect(() => {
    try {
      const savedExpenses = localStorage.getItem('expenses');
      const savedMonthlyExpense = localStorage.getItem('monthlyExpense');
      const savedCurrentSavings = localStorage.getItem('currentSavings');
      const savedFinancialGoal = localStorage.getItem('financialGoal');

      if (savedExpenses) setExpenses(JSON.parse(savedExpenses));
      if (savedMonthlyExpense) setMonthlyExpense(savedMonthlyExpense);
      if (savedCurrentSavings) setCurrentSavings(savedCurrentSavings);
      if (savedFinancialGoal) setFinancialGoal(JSON.parse(savedFinancialGoal));
      
      setIsInitialized(true);
    } catch (error) {
      console.error('Error loading data from localStorage:', error);
      setIsInitialized(true);
    }
  }, []);

  // Save to localStorage whenever data changes (only after initial load)
  useEffect(() => {
    if (!isInitialized) return;

    try {
      localStorage.setItem('expenses', JSON.stringify(expenses));
      localStorage.setItem('monthlyExpense', monthlyExpense);
      localStorage.setItem('currentSavings', currentSavings);
      localStorage.setItem('financialGoal', JSON.stringify(financialGoal));
    } catch (error) {
      console.error('Error saving data to localStorage:', error);
    }
  }, [expenses, monthlyExpense, currentSavings, financialGoal, isInitialized]);

  // Calculate statistics
  const calculateStats = () => {
    const totalExpenses = expenses.reduce((sum, exp) => sum + parseFloat(exp.amount), 0);
    
    const categoryTotals = expenses.reduce((acc, exp) => {
      acc[exp.category] = (acc[exp.category] || 0) + parseFloat(exp.amount);
      return acc;
    }, {});

    // Calculate weekly data
    const now = new Date();
    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const weeklyExpenses = expenses.filter(exp => new Date(exp.date) >= oneWeekAgo);
    
    const dailyTotals = weeklyExpenses.reduce((acc, exp) => {
      const day = new Date(exp.date).toLocaleDateString('en-US', { weekday: 'short' });
      acc[day] = (acc[day] || 0) + parseFloat(exp.amount);
      return acc;
    }, {});

    const weeklyCategoryTotals = weeklyExpenses.reduce((acc, exp) => {
      acc[exp.category] = (acc[exp.category] || 0) + parseFloat(exp.amount);
      return acc;
    }, {});

    return {
      totalExpenses,
      categoryTotals,
      dailyTotals,
      weeklyCategoryTotals,
      weeklyTotal: weeklyExpenses.reduce((sum, exp) => sum + parseFloat(exp.amount), 0)
    };
  };

  const addExpense = (newExpense) => {
    setExpenses(prev => [...prev, { ...newExpense, id: Date.now() }]);
  };

  const deleteExpense = (id) => {
    setExpenses(prev => prev.filter(expense => expense.id !== id));
  };

  const updateExpense = (id, updatedExpense) => {
    setExpenses(prev => prev.map(expense => 
      expense.id === id ? { ...expense, ...updatedExpense } : expense
    ));
  };

  const updateFinancialGoal = (newGoal) => {
    setFinancialGoal(newGoal);
  };

  return (
    <ExpenseContext.Provider value={{
      expenses,
      monthlyExpense,
      currentSavings,
      financialGoal,
      stats: calculateStats(),
      addExpense,
      deleteExpense,
      updateExpense,
      setMonthlyExpense,
      setCurrentSavings,
      updateFinancialGoal
    }}>
      {children}
    </ExpenseContext.Provider>
  );
};