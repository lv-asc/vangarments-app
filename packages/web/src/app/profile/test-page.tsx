'use client';


import { useAuth } from '@/contexts/AuthWrapper';

export default function TestProfilePage() {
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-gray-50">
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Profile Test Page</h1>
          {user ? (
            <div>
              <p><strong>Name:</strong> {user.name}</p>
              <p><strong>Email:</strong> {user.email}</p>
              <p><strong>ID:</strong> {user.id}</p>
              <p><strong>Is Developer:</strong> {user.isDeveloper ? 'Yes' : 'No'}</p>
              <p><strong>Has Full Access:</strong> {user.hasFullAccess ? 'Yes' : 'No'}</p>
            </div>
          ) : (
            <p>No user logged in</p>
          )}
        </div>
      </main>
    </div>
  );
}