'use client'
import React from 'react';
import { ModeToggle } from '@/components/mode-toggle';
import { Button } from "@/components/ui/button"
import { ArrowRight, Check, Menu, Share2, TrendingUp } from 'lucide-react';
import Image from 'next/image';
import demo from '@/assets/demoFinsaathi.png';
import logo from '@/assets/finsaathi-logo.png';
import bg from '@/assets/bg.jpg';
import wqr from '@/assets/whatsapp-qr.png';

import {
  ClerkProvider,
  SignInButton,
  SignUpButton,
  SignedIn,
  SignedOut,
  UserButton
} from '@clerk/nextjs'

import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"

import teamIllustration from '@/assets/team-illustration.png';

const HomePage = () => {
  return (
    <div className="font-inter bg-gradient-to-b from-background to-secondary/10 min-h-screen">
      <header className="fixed w-full bg-background/80 backdrop-blur-sm z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-2 animate-fadeIn">
              <Image src={logo} alt="Logo" className="w-8 h-8" />
              <span className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-purple-600 text-xl">Fin<span className="font-['Devanagari']">साथी</span></span>
            </div>
            <nav className="hidden md:flex items-center space-x-6">
              <a href="/" className="text-foreground font-medium hover:text-primary transition-colors">Home</a>
              <a href="/dashboard" className="text-muted-foreground font-medium hover:text-primary transition-colors">Dashboard</a>
              <SignedIn>
                <UserButton />
              </SignedIn>
              <SignedOut>
                <SignInButton />
                <SignUpButton />
              </SignedOut>
              <ModeToggle />
            </nav>
            <div className="md:hidden">
              <ModeToggle />
              <Sheet>
                <SheetTrigger asChild>
                  <Button variant="ghost" size="icon">
                    <Menu />
                  </Button>
                </SheetTrigger>
                <SheetContent>
                  <SheetHeader>
                    <SheetTitle>Menu</SheetTitle>
                  </SheetHeader>
                  <div className="mt-6 flex flex-col space-y-4">
                    <a href="/" className="text-foreground font-medium hover:text-primary transition-colors">Home</a>
                    <a href="/dashboard" className="text-muted-foreground font-medium hover:text-primary transition-colors">Dashboard</a>
                    <SignedIn>
                      <UserButton />
                    </SignedIn>
                    <SignedOut>
                      <SignInButton />
                      <SignUpButton />
                    </SignedOut>
                  </div>
                </SheetContent>
              </Sheet>
            </div>
          </div>
        </div>
      </header>

      <main className="pt-24 pb-16">
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center space-y-4 animate-fadeInUp">
            <a href="">
            <div className="inline-flex items-center bg-primary/10 text-primary rounded-full px-4 py-2 text-sm font-medium">
              <TrendingUp className="w-4 h-4 mr-2" />
              Real-time Market Insights
              <span className="ml-2 px-2 py-0.5 bg-primary text-white rounded-full text-xs">New</span>
            </div>
            </a>
            <h1 className="text-5xl sm:text-6xl font-bold">
              Welcome to <span className="bg-clip-text text-transparent bg-gradient-to-r from-primary to-purple-600">Fin<span className="font-['Devanagari'] text-5xl">साथी</span></span>
            </h1>
            <p className="text-2xl sm:text-3xl text-muted-foreground">
              Your Ultimate <span className="text-primary font-semibold">Destination</span> for Financial Advice
            </p>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Platform for the Expense Tracking and Government Scheme advisor along with AI Chatbot.
            </p>
            <div className="flex justify-center gap-4 mt-8">
              <SignedOut>
                <SignInButton>
                  <Button className="rounded-full px-8 py-6 text-lg gap-2">
                    Get Started <ArrowRight size={18} />
                  </Button>
                </SignInButton>
              </SignedOut>
            </div>
          </div>

          <div className="mt-16 animate-fadeInUp">
            <Image src={demo} alt="TrueSight Demo" className="border rounded-2xl shadow-xl overflow-hidden" />
          </div>

          {/* WhatsApp Integration Section */}
          <section className="mt-24 bg-background p-8 rounded-2xl border shadow-lg">
            <div className="grid md:grid-cols-2 gap-12 items-center">
              <div className="space-y-6">
                <div className="flex items-center gap-3 mb-6">
                  <Share2 className="text-black-600 w-8 h-8" />
                  <h2 className="text-3xl font-semibold">
                    Share Insights Instantly
                  </h2>
                </div>
                <p className="text-lg text-muted-foreground">
                  Generate comprehensive reports and share directly with your 
                  team or clients via WhatsApp
                </p>
                <div className="bg-muted p-6 rounded-xl">
                  <p className="font-medium flex items-center gap-2">
                    <span className="text-black-600">➤</span> Send 
                    <code className="mx-2 px-2 py-1 bg-primary/10 text-primary rounded">
                    join label-strength
                    </code> 
                    to
                  </p>
                  <p className="text-xl font-bold mt-2 flex items-center">
                    <span className="bg-black-100 text-black-800 px-3 py-1 rounded-lg mr-2">
                      WhatsApp
                    </span>
                    +1 415 523 8886
                  </p>
                </div>
              </div>
              <div className="flex justify-center">
                <div className="rounded-xl border-2 border-purple-600 p-4 bg-white w-[220px] h-[220px] overflow-hidden ">
                  {/* Placeholder for QR Code */}
                  <Image src={wqr} alt="TrueSight Demo" className="w-fit" />
                </div>
              </div>
            </div>
          </section>

          <section className="mt-24 grid md:grid-cols-3 gap-8 animate-fadeInUp">
            {[
              {
                title: "Trend Prediction Engine",
                description: "Machine learning models analyzing historical patterns and real-time market movements"
              },
              {
                title: "Sector Analytics",
                description: "Deep dive into specific industries with comparative performance metrics"
              },
              {
                title: "Portfolio Advisor",
                description: "AI-driven recommendations based on risk profile and market conditions"
              }
            ].map((feature, index) => (
              <div 
                key={index} 
                className="bg-card p-8 rounded-xl border hover:shadow-xl transition-shadow"
              >
                <Check className="text-primary mb-4" size={24} />
                <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
                <p className="text-muted-foreground">{feature.description}</p>
              </div>
            ))}
          </section>
        </section>

        <section className="bg-primary text-primary-foreground mt-24 py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center animate-fadeInUp">
              <h2 className="text-3xl font-bold mb-4">Help Us Improve by giving your Feedback</h2>
              <p className="text-xl mb-8">
                Your Feedback helps us develop even more, write to us to let us know
              </p>
              <button className="px-6 py-3 bg-background text-primary rounded-full hover:bg-background/90 transition-all duration-300 ease-in-out hover:scale-105">
                Write us
              </button>
            </div>
          </div>
        </section>
      </main>

      <footer className="bg-background border-t">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid md:grid-cols-2 gap-8">
            <div>
              <h3 className="text-2xl font-semibold mb-4 flex items-center gap-2">
                <Image src={logo} alt="Logo" className="w-8 h-8" />
                Finsaathi
              </h3>
              <p className="text-muted-foreground">
                Mumbai Hacks, Atlas Skilltech, Kurla<br />
                25th October 2024
              </p>
            </div>
            <div className="flex flex-col items-end">
              <h4 className="text-lg font-semibold mb-4">Connect with us</h4>
              <div className="flex space-x-4">
                <a href="#" className="text-primary hover:text-primary/80">Instagram</a>
                <a href="#" className="text-primary hover:text-primary/80">Twitter</a>
                <a href="#" className="text-primary hover:text-primary/80">LinkedIn</a>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default HomePage;