export default function MainLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen noise" style={{ background: 'var(--background)' }}>
      {children}
    </div>
  );
}
