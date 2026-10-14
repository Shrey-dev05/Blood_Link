import type { Metadata } from 'next';
import './globals.css';
import { Navbar } from '@/components/layout/Navbar';
import { BloodBuddyDrawer } from '@/components/ui/BloodBuddyDrawer';

export const metadata: Metadata = {
  title: 'BloodLink | Emergency Blood Donation & Hospital Dispatch',
  description: 'AI-assisted emergency blood matching, blood-bank inventory freshness, registered donor Twilio alerts, and secure QR arrival verification.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen flex flex-col font-sans antialiased text-slate-900 bg-slate-50">
        <Navbar />
        <main className="flex-1">
          {children}
        </main>
        <BloodBuddyDrawer />
        
        {/* Footer */}
        <footer className="bg-slate-900 text-slate-400 py-8 border-t border-slate-800 text-xs">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-4">
            <div>
              <span className="text-white font-bold text-sm">BloodLink</span> — Medical Emergency Blood Coordination

              <p className="text-slate-500 mt-1">
                Built to clinical governance standards. Parallel source discovery with strict donor privacy.
              </p>
            </div>
            <div className="flex flex-wrap gap-6 text-slate-400">
              <a href="/hospital" className="hover:text-white transition-colors">Hospital Command</a>
              <a href="/donor" className="hover:text-white transition-colors">Donor Hub</a>
              <a href="/patient" className="hover:text-white transition-colors">Family Tracker</a>
              <a href="/blood-bank" className="hover:text-white transition-colors">Blood Banks</a>
              <a href="/camps" className="hover:text-white transition-colors">Donation Camps</a>
              <a href="/map" className="hover:text-white transition-colors">Live Leaflet Map</a>
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}
