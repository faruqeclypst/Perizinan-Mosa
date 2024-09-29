import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { signOut } from 'firebase/auth';
import { auth, db } from '../firebaseConfig';
import { ref, onValue } from 'firebase/database';
import { Menu, Transition } from '@headlessui/react';
import { ChevronDownIcon } from '@heroicons/react/20/solid';
import StudentManagement from '../components/StudentManagement';
import TeacherManagement from '../components/TeacherManagement';
import ScheduleManagement from '../components/ScheduleManagement';
import AnalyticsReport from '../components/AnalyticsReport';
import { exportToCSV } from '../utils/exportToCSV';
import { generatePDF } from '../utils/generatePDF';
import { backupData, restoreData } from '../utils/backupRestore';
import SortableTable from '../components/SortableTable';
import logoUrl from '../assets/tes.png';
import { Perizinan, Student } from '../types/index';

const ITEMS_PER_PAGE = 10;

const AdminDashboard: React.FC = () => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('reports');
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
          const perizinanList: Perizinan[] = Object.entries(data)
            .map(([id, value]: [string, any]) => {
              if (value && typeof value === 'object' && 'namasiswa' in value) {
                return {
                  id,
                  ...(value as Omit<Perizinan, 'id'>),
                };
              }
              return null;
            })
            .filter((item): item is Perizinan => item !== null);
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

  const filteredPerizinan = perizinanWithStudentData.filter((p) => {
    if (!p || typeof p !== 'object' || !('namasiswa' in p)) return false;
    
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

  const handleExportCSV = () => {
    exportToCSV(filteredPerizinan, 'perizinan_report.csv');
  };

  const handleExportPDF = () => {
    generatePDF(filteredPerizinan, logoUrl, 'Your School Name');
  };

  const handleBackup = () => {
    backupData();
  };

  const handleRestore = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      restoreData(e.target.files[0]);
    }
  };

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
                <span className="text-2xl font-bold text-indigo-600">Admin Dashboard</span>
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
              <div className="border-b border-gray-200">
                <nav className="-mb-px flex space-x-8" aria-label="Tabs">
                  {['reports', 'students', 'teachers', 'schedule'].map((tab) => (
                    <button
                      key={tab}
                      onClick={() => setActiveTab(tab)}
                      className={`${
                        activeTab === tab
                          ? 'border-indigo-500 text-indigo-600'
                          : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                      } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
                    >
                      {tab.charAt(0).toUpperCase() + tab.slice(1)}
                    </button>
                  ))}
                </nav>
              </div>

              <div className="mt-6">
                {activeTab === 'reports' && (
                  <div>
                    <h2 className="text-2xl font-bold mb-4">Perizinan Reports</h2>
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
                    <div className="mb-4 flex space-x-2">
                      <button
                        onClick={handleExportCSV}
                        className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
                      >
                        Export to CSV
                      </button>
                      <button
                        onClick={handleExportPDF}
                        className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                      >
                        Download PDF
                      </button>
                      <button
                        onClick={handleBackup}
                        className="px-4 py-2 bg-yellow-500 text-white rounded hover:bg-yellow-600"
                      >
                        Backup Data
                      </button>
                      <input
                        type="file"
                        onChange={handleRestore}
                        className="hidden"
                        id="restore-file"
                      />
                      <label
                        htmlFor="restore-file"
                        className="px-4 py-2 bg-purple-500 text-white rounded hover:bg-purple-600 cursor-pointer"
                      >
                        Restore Data
                      </label>
                    </div>
                    <SortableTable<Perizinan>
                      data={paginatedPerizinan}
                      columns={columns}
                      onSort={handleSort}
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
                    <AnalyticsReport perizinanData={perizinan} />
                  </div>
                )}
                {activeTab === 'students' && <StudentManagement />}
                {activeTab === 'teachers' && <TeacherManagement />}
                {activeTab === 'schedule' && <ScheduleManagement />}
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default AdminDashboard;