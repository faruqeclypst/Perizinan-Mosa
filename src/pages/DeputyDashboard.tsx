import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { signOut } from 'firebase/auth';
import { auth, db } from '../firebaseConfig';
import { ref, onValue, update } from 'firebase/database';
import { Menu, Transition } from '@headlessui/react';
import { ChevronDownIcon } from '@heroicons/react/20/solid';
import SortableTable from '../components/SortableTable';
import { Perizinan, Student } from '../types/index';

const ITEMS_PER_PAGE = 10;

const DeputyDashboard: React.FC = () => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [perizinan, setPerizinan] = useState<Perizinan[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');
  const [dateRange, setDateRange] = useState({ start: '', end: '' });
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    const perizinanRef = ref(db, 'perizinan');
    const studentsRef = ref(db, 'students');

    const unsubscribePerizinan = onValue(perizinanRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const perizinanList: Perizinan[] = Object.entries(data).map(([id, value]) => ({
          id,
          ...(value as Omit<Perizinan, 'id'>),
        }));
        setPerizinan(perizinanList);
      } else {
        setPerizinan([]);
      }
    });

    const unsubscribeStudents = onValue(studentsRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const studentList: Student[] = Object.entries(data).map(([id, value]) => ({
          id,
          ...(value as Omit<Student, 'id'>),
        }));
        setStudents(studentList);
      } else {
        setStudents([]);
      }
    });

    return () => {
      unsubscribePerizinan();
      unsubscribeStudents();
    };
  }, []);

  const perizinanWithStudentData = useMemo(() => {
    return perizinan.map(p => {
      const student = students.find(s => s.namasiswa === p.namasiswa);
      return {
        ...p,
        kelas: student?.kelas || p.kelas || 'Unknown',
        asrama: student?.asrama || p.asrama || 'Unknown',
      };
    });
  }, [perizinan, students]);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigate('/login');
    } catch (error) {
      console.error('Failed to log out', error);
    }
  };

  const handleStatusChange = (id: string, newStatus: 'approved' | 'rejected') => {
    const perizinanRef = ref(db, `perizinan/${id}`);
    update(perizinanRef, { status: newStatus });
  };

  const filteredPerizinan = perizinanWithStudentData.filter((p) => {
    if (!p || typeof p !== 'object') return false;
    
    const matchesSearch = (p.namasiswa?.toLowerCase().includes(searchTerm.toLowerCase()) ?? false) ||
                          (p.kelas?.toLowerCase().includes(searchTerm.toLowerCase()) ?? false) ||
                          (p.asrama?.toLowerCase().includes(searchTerm.toLowerCase()) ?? false);
    const matchesStatus = statusFilter === 'all' || p.status === statusFilter;
    const matchesDate = (!dateRange.start || (p.keluar && p.keluar >= dateRange.start)) &&
                        (!dateRange.end || (p.keluar && p.keluar <= dateRange.end));
    return matchesSearch && matchesStatus && matchesDate;
  });

  const paginatedPerizinan = filteredPerizinan.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const totalPages = Math.ceil(filteredPerizinan.length / ITEMS_PER_PAGE);

  const handleSort = (key: keyof Perizinan, direction: 'asc' | 'desc') => {
    const sorted = [...filteredPerizinan].sort((a, b) => {
      const aValue = a[key];
      const bValue = b[key];
      if (aValue != null && bValue != null) {
        if (aValue < bValue) return direction === 'asc' ? -1 : 1;
        if (aValue > bValue) return direction === 'asc' ? 1 : -1;
      }
      return 0;
    });
    setPerizinan(sorted);
  };

  const columns: {key: keyof Perizinan; label: string}[] = [
    { key: 'namasiswa', label: 'Nama Siswa' },
    { key: 'kelas', label: 'Kelas' },
    { key: 'asrama', label: 'Asrama' },
    { key: 'alasan', label: 'Alasan' },
    { key: 'keluar', label: 'Keluar' },
    { key: 'kembali', label: 'Kembali' },
    { key: 'status', label: 'Status' },
  ];

  return (
    <div className="min-h-screen bg-gray-100">
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex">
              <div className="flex-shrink-0 flex items-center">
                <span className="text-2xl font-bold text-indigo-600">Deputy Dashboard</span>
              </div>
            </div>
            <div className="flex items-center">
              <Menu as="div" className="relative inline-block text-left">
                <div>
                  <Menu.Button className="inline-flex justify-center w-full rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-100 focus:ring-indigo-500">
                    {currentUser?.email}
                    <ChevronDownIcon className="-mr-1 ml-2 h-5 w-5" aria-hidden="true" />
                  </Menu.Button>
                </div>
                <Transition
                  as={React.Fragment}
                  enter="transition ease-out duration-100"
                  enterFrom="transform opacity-0 scale-95"
                  enterTo="transform opacity-100 scale-100"
                  leave="transition ease-in duration-75"
                  leaveFrom="transform opacity-100 scale-100"
                  leaveTo="transform opacity-0 scale-95"
                >
                  <Menu.Items className="origin-top-right absolute right-0 mt-2 w-56 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 focus:outline-none">
                    <div className="py-1">
                      <Menu.Item>
                        {({ active }) => (
                          <button
                            onClick={handleLogout}
                            className={`${
                              active ? 'bg-gray-100 text-gray-900' : 'text-gray-700'
                            } block w-full text-left px-4 py-2 text-sm`}
                          >
                            Log out
                          </button>
                        )}
                      </Menu.Item>
                    </div>
                  </Menu.Items>
                </Transition>
              </Menu>
            </div>
          </div>
        </div>
      </nav>

      <div className="py-10">
        <main>
          <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
            <div className="px-4 py-8 sm:px-0">
              <h2 className="text-2xl font-bold mb-4">Perizinan List</h2>
              <div className="mb-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <input
                  type="text"
                  placeholder="Search..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="border p-2 rounded"
                />
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value as any)}
                  className="border p-2 rounded"
                >
                  <option value="all">All Status</option>
                  <option value="pending">Pending</option>
                  <option value="approved">Approved</option>
                  <option value="rejected">Rejected</option>
                </select>
                <input
                  type="date"
                  value={dateRange.start}
                  onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
                  className="border p-2 rounded"
                />
                <input
                  type="date"
                  value={dateRange.end}
                  onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
                  className="border p-2 rounded"
                />
              </div>
              <SortableTable<Perizinan>
                data={paginatedPerizinan}
                columns={columns}
                onSort={handleSort}
                customRenderers={{
                  status: (item: Perizinan) => (
                    <>
                      {item.status}
                      {item.status === 'pending' && (
                        <div className="mt-2">
                          <button
                            onClick={() => handleStatusChange(item.id, 'approved')}
                            className="mr-2 px-2 py-1 bg-green-500 text-white rounded hover:bg-green-600"
                          >
                            Approve
                          </button>
                          <button
                            onClick={() => handleStatusChange(item.id, 'rejected')}
                            className="px-2 py-1 bg-red-500 text-white rounded hover:bg-red-600"
                          >
                            Reject
                          </button>
                        </div>
                      )}
                    </>
                  )
                }}
              />
              <div className="mt-4 flex justify-between items-center">
                <button
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                  className="px-4 py-2 bg-gray-300 text-gray-700 rounded disabled:opacity-50"
                >
                  Previous
                </button>
                <span>Page {currentPage} of {totalPages}</span>
                <button
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages}
                  className="px-4 py-2 bg-gray-300 text-gray-700 rounded disabled:opacity-50"
                >
                  Next
                </button>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default DeputyDashboard;