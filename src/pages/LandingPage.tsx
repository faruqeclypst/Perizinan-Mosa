import React from 'react';
import { Link } from 'react-router-dom';

const LandingPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-100">
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex">
              <div className="flex-shrink-0 flex items-center">
                <span className="text-2xl font-bold text-indigo-600">Perizinan Siswa</span>
              </div>
            </div>
            <div className="flex items-center">
              <Link to="/login" className="text-gray-700 hover:bg-gray-100 px-3 py-2 rounded-md">
                Login
              </Link>
            </div>
          </div>
        </div>
      </nav>

      <main>
        <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
          <div className="px-4 py-6 sm:px-0">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">Welcome to Perizinan Siswa</h1>
            <p className="text-xl text-gray-600 mb-8">
              Manage student permissions efficiently and effectively.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white p-6 rounded-lg shadow">
                <h2 className="text-2xl font-bold text-gray-900 mb-2">For Students</h2>
                <p className="text-gray-600">Submit and track your permission requests easily.</p>
              </div>
              <div className="bg-white p-6 rounded-lg shadow">
                <h2 className="text-2xl font-bold text-gray-900 mb-2">For Teachers</h2>
                <p className="text-gray-600">Manage and approve student permissions efficiently.</p>
              </div>
              <div className="bg-white p-6 rounded-lg shadow">
                <h2 className="text-2xl font-bold text-gray-900 mb-2">For Administrators</h2>
                <p className="text-gray-600">Oversee the entire permission system with ease.</p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default LandingPage;