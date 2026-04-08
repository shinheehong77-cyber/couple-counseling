export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 9999, overflow: 'hidden' }}>
      {children}
    </div>
  );
}
