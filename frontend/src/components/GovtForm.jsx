"use client";

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import amblem from '@/assets/amblem.png';
import Image from 'next/image';

const GovtSchemeAdvisor = () => {
  const initialFormState = {
    location: '',
    occupation: '',
    category: '',
    income: '',
    gender: '',
    age: ''
  };

  // Form state
  const [formData, setFormData] = useState(initialFormState);
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Handle form input changes
  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    setError(null);
  };

  // Reset form handler
  const handleReset = () => {
    setFormData(initialFormState);
    setResults(null);
    setError(null);
  };

  // Form validation
  const validateForm = () => {
    const errors = [];
    if (!formData.location) errors.push("Location is required");
    if (!formData.occupation) errors.push("Occupation is required");
    if (!formData.category) errors.push("Category is required");
    if (!formData.income) errors.push("Income is required");
    if (!formData.gender) errors.push("Gender is required");
    if (!formData.age) errors.push("Age is required");
    
    if (formData.age && (parseInt(formData.age) < 0 || parseInt(formData.age) > 120)) {
      errors.push("Please enter a valid age between 0 and 120");
    }
    
    if (formData.income && parseInt(formData.income) < 0) {
      errors.push("Please enter a valid income");
    }

    return errors;
  };

  // Handle form submission
  const handleSubmit = async () => {
    const errors = validateForm();
    if (errors.length > 0) {
      setError(errors.join(", "));
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch('http://localhost:5000/api/match-schemes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify(formData)
      });

      if (!response.ok) {
        throw new Error('Failed to fetch matching schemes');
      }

      const data = await response.json();
      setResults(data.matches);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const formatPercentage = (decimal) => {
    return `${(decimal * 100).toFixed(1)}%`;
  };

  return (
    <div className="w-full max-w-4xl mx-auto p-4 space-y-6">
      {/* Government Logo Card */}
      <Card className="bg-white">
        <CardContent className="flex justify-center p-6">
          <Image 
            src={amblem}
            alt="Government of India Emblem"
            className="h-20"
            width={80}
            height={80}
            priority
          />
        </CardContent>
      </Card>

      {/* Error Alert */}
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Main Form Card */}
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl font-bold">
            Government Scheme Advisor
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Location */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Location</label>
              <Select value={formData.location} onValueChange={(value) => handleInputChange('location', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select location" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="rural">Rural</SelectItem>
                  <SelectItem value="urban">Urban</SelectItem>
                  <SelectItem value="semi-urban">Semi-Urban</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Occupation */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Occupation</label>
              <Select value={formData.occupation} onValueChange={(value) => handleInputChange('occupation', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select occupation" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="farmer">Farmer</SelectItem>
                  <SelectItem value="student">Student</SelectItem>
                  <SelectItem value="business">Business</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Category */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Category</label>
              <Select value={formData.category} onValueChange={(value) => handleInputChange('category', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="general">General</SelectItem>
                  <SelectItem value="obc">OBC</SelectItem>
                  <SelectItem value="sc">SC</SelectItem>
                  <SelectItem value="st">ST</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Annual Income */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Annual Income</label>
              <Input 
                type="number"
                placeholder="Enter your income"
                value={formData.income}
                onChange={(e) => handleInputChange('income', e.target.value)}
                min="0"
              />
            </div>

            {/* Gender */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Gender</label>
              <Select value={formData.gender} onValueChange={(value) => handleInputChange('gender', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select gender" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="male">Male</SelectItem>
                  <SelectItem value="female">Female</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Age */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Age</label>
              <Input 
                type="number"
                placeholder="Enter your age"
                value={formData.age}
                onChange={(e) => handleInputChange('age', e.target.value)}
                min="0"
                max="120"
              />
            </div>
          </div>

          {/* Buttons */}
          <div className="flex gap-4">
            <Button 
              variant="outline" 
              className="w-24"
              onClick={handleReset}
            >
              Reset
            </Button>
            <Button 
              className="w-24"
              onClick={handleSubmit}
              disabled={loading}
            >
              {loading ? 'Loading...' : 'Continue'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Results Card */}
      {(results || loading) && (
        <Card>
          <CardHeader>
            <CardTitle>Schemes Suitable for you</CardTitle>
          </CardHeader>
          <CardContent className="p-6 space-y-4">
            {loading ? (
              <div className="space-y-2">
                <div className="text-sm text-blue-600">Searching for matches...</div>
                <Progress value={33} className="h-2" />
              </div>
            ) : (
              <Accordion type="single" collapsible className="space-y-4">
                {results?.map((scheme, index) => (
                  <AccordionItem key={`${scheme.scheme_code}-${index}`} value={`scheme-${index}`} className="border rounded-lg p-4">
                    <AccordionTrigger className="hover:no-underline">
                      <div className="flex flex-col items-start text-left w-full">
                        <h4 className="font-semibold text-lg">{scheme.scheme_name}</h4>
                        <p className="text-sm text-gray-600">{scheme.ministry}</p>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="space-y-4 mt-4">
                      {/* Scores Section */}
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="space-y-2">
                          <div className="text-sm font-medium">Overall Match</div>
                          <Progress value={scheme.match_score * 100} className="h-2" />
                          <div className="text-sm text-gray-600">{formatPercentage(scheme.match_score)}</div>
                        </div>
                        <div className="space-y-2">
                          <div className="text-sm font-medium">Keyword Match</div>
                          <Progress value={scheme.keyword_score * 100} className="h-2" />
                          <div className="text-sm text-gray-600">{formatPercentage(scheme.keyword_score)}</div>
                        </div>
                        <div className="space-y-2">
                          <div className="text-sm font-medium">Semantic Match</div>
                          <Progress value={scheme.semantic_score * 100} className="h-2" />
                          <div className="text-sm text-gray-600">{formatPercentage(scheme.semantic_score)}</div>
                        </div>
                      </div>

                      {/* Scheme Details */}
                      <div className="space-y-4">
                        {scheme.objective && (
                          <div>
                            <h5 className="font-medium mb-2">Objective</h5>
                            <p className="text-gray-700">{scheme.objective}</p>
                          </div>
                        )}
                        
                        {scheme.beneficiary && (
                          <div>
                            <h5 className="font-medium mb-2">Beneficiaries</h5>
                            <p className="text-gray-700">{scheme.beneficiary}</p>
                          </div>
                        )}

                        {scheme.features && (
                          <div>
                            <h5 className="font-medium mb-2">Features</h5>
                            <p className="text-gray-700">{scheme.features}</p>
                          </div>
                        )}

                        {scheme.relevance_reasons?.length > 0 && (
                          <div>
                            <h5 className="font-medium mb-2">Why this scheme matches your profile</h5>
                            <div className="flex flex-wrap gap-2">
                              {scheme.relevance_reasons.map((reason, idx) => (
                                <Badge key={idx} variant="secondary">{reason}</Badge>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default GovtSchemeAdvisor;