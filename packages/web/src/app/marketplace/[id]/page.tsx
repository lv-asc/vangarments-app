import { redirect } from 'next/navigation';

export default function RedirectPage({ params }: { params: { id: string } }) {
    // Redirect to the new marketplace home if an old ID link is accessed
    // Ideally we would look up the code by ID and redirect there, but for now 
    // redirecting to home is a safe fallback to avoid the broken page.
    redirect('/marketplace');
}
