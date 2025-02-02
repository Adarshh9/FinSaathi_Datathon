'use client'
import React, { useState } from 'react';
import { UserButton } from "@clerk/nextjs";
import { 
  LayoutDashboard, 
  PiggyBank, 
  Receipt, 
  Goal, 
  Settings, 
  CreditCard,
  TrendingUp,
  Bot,
  Wallet,
  ArrowUpNarrowWide,
  Menu,
  Newspaper,
  X
} from "lucide-react";
import Link from "next/link";
import { ThemeProvider } from "@/components/theme-provider";
import { ModeToggle } from '@/components/mode-toggle';
import Image from 'next/image';
import finsaathiLogo from "@/assets/finsaathi-logo.png";

const sidebarLinks = [
  {
    title: "Analysis",
    href: "/dashboard",
    icon: LayoutDashboard,
    color: "text-blue-500"
  },
  {
    title: "FinBuddy",
    href: "/dashboard/finBuddy",
    icon: Bot,
    color: "text-blue-500"
  },
  {
    title: "Latest News",
    href: "/dashboard/news",
    icon: Newspaper,
    color: "text-blue-500"
  },
  // {
  //   title: "Govt. Scheme Advisor",
  //   href: "/dashboard/govtSchemeAdvisor",
  //   icon: PiggyBank,
  //   color: "text-blue-500"
  // },
  // {
  //   title: "Reports",
  //   href: "/dashboard/reports",
  //   icon: ArrowUpNarrowWide,
  //   color: "text-blue-500"
  // },
  // {
  //   title: "Overview", 
  //   href: "/dashboard",
  //   icon: LayoutDashboard,
  //   color: "text-blue-500"
  // },
  {
    title: "Settings",
    href: "/dashboard/settings",
    icon: Settings,
    color: "text-gray-500"
  }
];

export default function DashboardLayout({ children }) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
    >
      <div className="min-h-screen flex bg-gray-50">
        {/* Desktop Sidebar */}
        <aside className="hidden md:flex md:flex-col md:w-64 bg-white border-r border-gray-200 md:h-screen md:fixed">
          <div className="p-6">
            <a href="/">
              <div className="flex items-center gap-2">
                <Image alt="logo" src={finsaathiLogo} className="h-8 w-8" />
                <h1 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  Fin<span className="font-['Devanagari']">साथी</span>
                </h1>
              </div>
            </a>
          </div>
          
          <nav className="flex-1 px-4 pb-4">
            <div className="space-y-4">
              {sidebarLinks.map((link) => (
                <Link 
                  key={link.href}
                  href={link.href}
                  className="flex items-center gap-3 px-4 py-2 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors group"
                >
                  <link.icon className={`h-5 w-5 ${link.color} group-hover:scale-110 transition-transform`} />
                  <span className="text-sm font-medium">{link.title}</span>
                </Link>
              ))}
            </div>
          </nav>
          
          <div className="p-4 border-t border-gray-200">
            <div className="flex items-center gap-3 px-4 py-2 rounded-lg bg-gray-50">
              <UserButton
                appearance={{
                  elements: {
                    avatarBox: "h-8 w-8"
                  }
                }}
              />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">
                  Your Account
                </p>
              </div>
            </div>
          </div>
        </aside>

        {/* Main Content */}
        <div className="flex-1 flex flex-col min-h-screen">
          {/* Mobile Header */}
          <header className="md:hidden bg-white border-b border-gray-200 p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <button
                  onClick={toggleMobileMenu}
                  className="p-2 rounded-lg hover:bg-gray-100"
                >
                  {isMobileMenuOpen ? (
                    <X className="h-6 w-6 text-gray-600" />
                  ) : (
                    <Menu className="h-6 w-6 text-gray-600" />
                  )}
                </button>
                <a href="/">
                  <div className="flex items-center gap-2">
                    <Image alt="logo" src={finsaathiLogo} className="h-8 w-8" />
                    <h1 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                      Fin<span className="font-['Devanagari']">साथी</span>
                    </h1>
                  </div>
                </a>
              </div>
              <UserButton />
            </div>
          </header>

          {/* Mobile Navigation Menu */}
          {isMobileMenuOpen && (
            <div className="md:hidden fixed inset-0 z-50 bg-gray-800 bg-opacity-50">
              <div className="fixed inset-y-0 left-0 w-64 bg-white shadow-lg">
                <div className="flex flex-col h-full">
                  <div className="p-4 border-b border-gray-200">
                    <button
                      onClick={toggleMobileMenu}
                      className="p-2 rounded-lg hover:bg-gray-100"
                    >
                      <X className="h-6 w-6 text-gray-600" />
                    </button>
                  </div>
                  <nav className="flex-1 px-4 py-4">
                    <div className="space-y-4">
                      {sidebarLinks.map((link) => (
                        <Link
                          key={link.href}
                          href={link.href}
                          onClick={toggleMobileMenu}
                          className="flex items-center gap-3 px-4 py-2 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors group"
                        >
                          <link.icon className={`h-5 w-5 ${link.color} group-hover:scale-110 transition-transform`} />
                          <span className="text-sm font-medium">{link.title}</span>
                        </Link>
                      ))}
                    </div>
                  </nav>
                 
                </div>
              </div>
            </div>
          )}

          {/* Main Content Area */}
          <main className="flex-1 overflow-auto md:ml-[16rem]">
            {children}
          </main>
        </div>
      </div>
    </ThemeProvider>
  );
}