import { ImageResponse } from 'next/og';
export const alt = 'Nexora AI — Less busywork. More possibility.';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';
export default function OpenGraphImage() {
  return new ImageResponse(
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        padding: 85,
        background: 'linear-gradient(145deg,#09090f 30%,#231438)',
        color: '#f8fafc',
        fontFamily: 'sans-serif',
      }}
    >
      <div
        style={{ display: 'flex', alignItems: 'center', gap: 15, marginBottom: 60, fontSize: 30 }}
      >
        <div
          style={{
            display: 'flex',
            width: 30,
            height: 30,
            borderRadius: 9,
            background: '#8b5cf6',
            transform: 'rotate(-12deg)',
          }}
        />
        Nexora AI
      </div>
      <div style={{ display: 'flex', fontSize: 76, letterSpacing: -4, lineHeight: 1.1 }}>
        Less busywork.
      </div>
      <div
        style={{
          display: 'flex',
          fontSize: 76,
          letterSpacing: -4,
          lineHeight: 1.1,
          color: '#b49af5',
        }}
      >
        More possibility.
      </div>
      <div style={{ display: 'flex', fontSize: 23, marginTop: 35, color: '#92919f' }}>
        Projects. Notes. Intelligence. A little more connected.
      </div>
    </div>,
    size,
  );
}
