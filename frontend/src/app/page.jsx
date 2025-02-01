'use client'
import React from 'react';
import { ModeToggle } from '@/components/mode-toggle';
import { Button } from "@/components/ui/button"

import { ArrowRight, Check, Menu } from 'lucide-react';
import Image from 'next/image';
import demo from '@/assets/demoFinsaathi.png';
import logo from '@/assets/finsaathi-logo.png';
import bg from '@/assets/bg.jpg';

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

      <main className="pt-24 pb-16 ">
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center space-y-4 animate-fadeInUp">
            <a href="">
              <div className="inline-block bg-black-100 text-primary rounded-full px-3 py-2 text-sm font-semibold mb-4 bg-gray-100 bg-primary-foreground">
                <span className=" rounded-full py-1 px-2 bg-blue-600 text-white" >New</span>
                <span className="ml-2">Now with URL Support</span>
                <ArrowRight className="inline ml-1" size={16} />
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
            <a
              href="/dashboard"
              className="inline-flex items-center px-6 py-3 mt-4 rounded-full text-lg font-medium bg-primary text-primary-foreground hover:bg-primary/90 transition-all duration-300 ease-in-out hover:scale-105"
            >
              Get Started for Free <ArrowRight className="ml-2" />
            </a>
          </div>

          <div className="mt-16 animate-fadeInUp">
            <Image src={demo} alt="TrueSight Demo" className="" />
          </div>

          <div className="mt-16 text-center animate-fadeInUp">
            <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
              Finsaathi is a cutting-edge solution designed to combat fake news. With high credibility, it helps users verify the authenticity of information. Its intuitive interface ensures ease of use for individuals, media outlets, and social media platforms seeking reliable news sources.
            </p>
          </div>
        </section>
        <section className="w-full bg-primary text-white py-20 mt-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            {/* Main Content */}
            {/* <div className="grid md:grid-cols-2 gap-12 items-center mb-16">
              <div className="space-y-6">
                <h2 className="text-4xl font-bold leading-tight">
                  Over 50% of Indians Lack Access
                </h2>
                <p className="text-xl leading-relaxed">
                  Despite numerous beneficial government schemes, more than half of India's population remains unaware of available support and resources. Bridging this awareness gap is essential for ensuring these programs reach those who need them most.
                </p>
                <button className="bg-white text-primary px-8 py-3 rounded-full font-semibold hover:bg-opacity-90 transition-all">
                  Learn More
                </button>
              </div>
              <div className="flex justify-center">
                <Image 
                  src={teamIllustration}
                  alt="Government schemes illustration" 
                  className="rounded-xl shadow-2xl hover:scale-105 transition-transform duration-300"
                  width={500}
                  height={400}
                  priority
                />
              </div>
            </div> */}

            {/* Video Section */}
            <div className="">
              <h3 className="text-2xl font-bold text-center mb-10">Watch How We're Making a Difference</h3>
              <div className="grid md:grid-cols-2 gap-8">
                {/* Video 1 */}
                <div className="relative overflow-hidden rounded-xl shadow-xl">
                  <div className="aspect-video">
                    <iframe
                      className="absolute w-full h-full"
                      src="https://youtu.be/8zWQ9aXmeaY?si=Nf2031nz7xfd0seT"
                      title="Video 1"
                      frameBorder="0"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                    ></iframe>
                  </div>
                </div>
                
                {/* Video 2 */}
                <div className="relative overflow-hidden rounded-xl shadow-xl">
                  <div className="aspect-video">
                    <iframe
                      className="absolute w-full h-full"
                      src="https://youtu.be/8zWQ9aXmeaY?si=Nf2031nz7xfd0seT"
                      title="Video 2"
                      frameBorder="0"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                    ></iframe>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-24">
          <div className="grid md:grid-cols-3 gap-8 animate-fadeInUp">
            {[
              { title: "Advanced AI", description: "Cutting-edge algorithms to detect fake news" },
              { title: "User-Friendly", description: "Intuitive interface for all users" },
              { title: "Real-Time Analysis", description: "Get instant results on news authenticity" }
            ].map((feature, index) => (
              <div 
                key={index} 
                className="bg-card p-6 rounded-lg shadow-lg transition-all duration-300 ease-in-out hover:scale-105"
              >
                <Check className="text-primary mb-4" size={24} />
                <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
                <p className="text-muted-foreground">{feature.description}</p>
              </div>
            ))}
          </div>
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

      <footer className="bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid md:grid-cols-2 gap-8">
            <div>
              <h3 className="text-2xl font-semibold mb-4">Finsaathi</h3>
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