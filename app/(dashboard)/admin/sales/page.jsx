'use client'
import DailySalesForm from '@/components/Employee/daily-sales-form';
import { useSession } from 'next-auth/react';

export default function Page() {
  const {data: session, status} = useSession();
  if (status === 'loading') {
    return <div>Loading...</div>;
  }
  if (status === 'unauthenticated') {
    return <div>Not logged in</div>;
  }
  return (
    <div><DailySalesForm session={session} /></div>
  )
}
