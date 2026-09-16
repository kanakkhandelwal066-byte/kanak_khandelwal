import type { Metadata } from 'next';
import './globals.css';
import { UserProvider } from './context/UserContext';
import Header from './components/Header';
import Sidebar from './components/Sidebar';

export const metadata: Metadata = {
  title: 'College AV Gear Lending System',
  description: 'Manage AV gear inventory, multi-unit availability, borrowing, returns, late fees & deposits.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-slate-50 text-slate-900 antialiased font-sans min-h-screen">
        <UserProvider>
          <div className="flex flex-col min-h-screen">
            <Header />
            <div className="flex flex-1">
              <Sidebar />
              <main className="flex-1 p-6 md:p-8 max-w-7xl mx-auto w-full">{children}</main>
            </div>
          </div>
        </UserProvider>
      </body>
    </html>
  );
}
