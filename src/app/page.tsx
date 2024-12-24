"use client"
import dynamic from 'next/dynamic';

// Dynamically import your client-side only component
const ClientOnlyComponent = dynamic(() => import('./inputflow'), { ssr: false });

export default function HomePage() {
  return (
    <div>
      <ClientOnlyComponent />
    </div>
  );
}