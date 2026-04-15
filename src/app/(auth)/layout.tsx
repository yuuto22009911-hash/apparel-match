export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative min-h-screen flex items-center justify-center p-4 overflow-hidden noise">
      {/* Background orbs */}
      <div className="orb orb-1" style={{ top: '-20%', left: '-10%' }} />
      <div className="orb orb-2" style={{ bottom: '-15%', right: '-10%' }} />
      {/* Content */}
      <div className="relative z-10 w-full animate-fade-in">
        {children}
      </div>
    </div>
  );
}
