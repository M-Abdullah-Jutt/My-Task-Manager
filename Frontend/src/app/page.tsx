import { redirect } from 'next/navigation';

// This is a Server Component, so we use the Next.js redirect function
export default function HomePage() {
    // Immediately redirect the user to the login page when they visit the root '/'
    redirect('/login');
}