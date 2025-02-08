// components/layout/Sidebar.tsx
"use client";

import { Home, Receipt, FileText, Settings, HelpCircle, LogOut } from 'lucide-react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';

interface SidebarItem {
  title: string;
  icon: React.ReactNode;
  href: string;
  badge?: number;
}

export const Sidebar = () => {
  const pathname = usePathname();
  
  const sidebarItems: SidebarItem[] = [
    { title: 'Dashboard', icon: <Home size={20} />, href: '/employee-claims' },
    { title: 'My Expenses', icon: <Receipt size={20} />, href: '/expenses', badge: 3 },
    { title: 'Reports', icon: <FileText size={20} />, href: '/reports' },
    { title: 'Settings', icon: <Settings size={20} />, href: '/settings' },
    { title: 'Help & Support', icon: <HelpCircle size={20} />, href: '/support' },
  ];

  return (
    <div className="hidden lg:flex flex-col h-screen w-64 bg-white border-r border-gray-200 px-4 py-6">
      <div className="flex items-center gap-2 px-2 mb-8">
        <div className="w-8 h-8 rounded-full bg-black flex items-center justify-center">
          <span className="text-white font-bold">X</span>
        </div>
        <span className="text-xl font-bold">XtractPay</span>
      </div>

      <nav className="flex-1 space-y-1">
        {sidebarItems.map((item) => (
          <Link
            key={item.title}
            href={item.href}
            className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors
              ${pathname === item.href 
                ? 'bg-blue-50 text-blue-700' 
                : 'text-gray-700 hover:bg-gray-100'
              }`}
          >
            {item.icon}
            <span>{item.title}</span>
            {item.badge && (
              <span className="ml-auto bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full text-xs">
                {item.badge}
              </span>
            )}
          </Link>
        ))}
      </nav>

      <div className="border-t border-gray-200 pt-4 mt-6">
        <button className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-100 w-full">
          <LogOut size={20} />
          <span>Logout</span>
        </button>
      </div>
    </div>
  );
};