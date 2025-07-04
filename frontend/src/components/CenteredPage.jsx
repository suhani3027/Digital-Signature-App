export default function CenteredPage({ children, bg = "bg-gray-100" }) {
  const isHex = typeof bg === 'string' && bg.startsWith('#');
  return (
    <div
      className={isHex ? undefined : bg}
      style={{ minHeight: '100vh', width: '100vw', backgroundColor: isHex ? bg : undefined }}
    >
      {children}
    </div>
  );
} 