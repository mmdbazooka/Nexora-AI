'use client';
export default function GlobalError({ reset }: { error: Error; reset: () => void }) {
  return (
    <html lang="en">
      <body
        style={{
          background: '#09090f',
          color: '#f8fafc',
          fontFamily: 'sans-serif',
          padding: 50,
          textAlign: 'center',
        }}
      >
        <h1>Let’s find your flow again.</h1>
        <p>Nexora encountered an unexpected error.</p>
        <button onClick={reset}>Try again</button>
      </body>
    </html>
  );
}
