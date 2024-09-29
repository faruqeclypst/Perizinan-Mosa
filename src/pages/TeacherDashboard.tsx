import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { signOut } from 'firebase/auth';
import { auth, db } from '../firebaseConfig';
import { ref, onValue, push, remove, update } from 'firebase/database';
import { Menu, Transition } from '@headlessui/react';
import { ChevronDownIcon } from '@heroicons/react/20/solid';
import Select from 'react-select';
import { Perizinan, Student } from '../types/index';
import SortableTable from '../components/SortableTable';
import FileUpload from '../components/FileUpload';
import InlineEdit from '../components/InlineEdit';
import { Document, Page, pdfjs } from 'react-pdf';

// Important: you need to set the worker source for react-pdf
pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`;

interface StudentOption {
  value: string;
  label: string;
  kelas: string;
  asrama: string;
}

const TeacherDashboard: React.FC = () => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [perizinan, setPerizinan] = useState<Perizinan[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [studentOptions, setStudentOptions] = useState<StudentOption[]>([]);
  const [newPerizinan, setNewPerizinan] = useState<Omit<Perizinan, 'id' | 'status' | 'documentUrl'>>({
    namasiswa: '',
    kelas: '',
    asrama: '',
    alasan: '',
    keluar: '',
    kembali: '',
  });
  const [documentUrl, setDocumentUrl] = useState('');
  const [selectedStudent, setSelectedStudent] = useState<Perizinan | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [changingDocumentForId, setChangingDocumentForId] = useState<string | null>(null);

  useEffect(() => {
    const perizinanRef = ref(db, 'perizinan');
    const studentsRef = ref(db, 'students');

    const unsubscribePerizinan = onValue(perizinanRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const perizinanList = Object.entries(data).map(([id, value]) => ({
          id,
          ...(value as Omit<Perizinan, 'id'>),
        }));
        setPerizinan(perizinanList);
      }
    });

    const unsubscribeStudents = onValue(studentsRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const studentList = Object.entries(data).map(([id, value]) => ({
          id,
          ...(value as Omit<Student, 'id'>),
        }));
        setStudents(studentList);
        const options = studentList.map(student => ({
          value: student.id,
          label: student.namasiswa,
          kelas: student.kelas,
          asrama: student.asrama,
        }));
        setStudentOptions(options);
      }
    });

    return () => {
      unsubscribePerizinan();
      unsubscribeStudents();
    };
  }, []);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigate('/login');
    } catch (error) {
      console.error('Failed to log out', error);
    }
  };

  const handleStudentSelect = (selectedOption: StudentOption | null) => {
    if (selectedOption) {
      setNewPerizinan({
        ...newPerizinan,
        namasiswa: selectedOption.label,
        kelas: selectedOption.kelas,
        asrama: selectedOption.asrama,
      });
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setNewPerizinan({ ...newPerizinan, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isUploading) {
      alert("Please wait for the document to finish uploading.");
      return;
    }
    const perizinanRef = ref(db, 'perizinan');
    push(perizinanRef, { ...newPerizinan, status: 'pending', documentUrl });
    setNewPerizinan({
      namasiswa: '',
      kelas: '',
      asrama: '',
      alasan: '',
      keluar: '',
      kembali: '',
    });
    setDocumentUrl('');
  };

  const handleFileUpload = async (url: string) => {
    if (changingDocumentForId) {
      const perizinanRef = ref(db, `perizinan/${changingDocumentForId}`);
      await update(perizinanRef, { documentUrl: url });
      
      setPerizinan(prev => prev.map(p => 
        p.id === changingDocumentForId ? { ...p, documentUrl: url } : p
      ));
      
      if (selectedStudent && selectedStudent.id === changingDocumentForId) {
        setSelectedStudent(prev => prev ? { ...prev, documentUrl: url } : null);
      }
      
      setChangingDocumentForId(null);
    } else {
      setDocumentUrl(url);
    }
    setIsUploading(false);
  };

  const handleDelete = (id: string) => {
    if (window.confirm('Are you sure you want to delete this perizinan?')) {
      const perizinanRef = ref(db, `perizinan/${id}`);
      remove(perizinanRef);
    }
  };

  const handleEdit = (id: string, field: keyof Perizinan, value: string) => {
    const perizinanRef = ref(db, `perizinan/${id}`);
    update(perizinanRef, { [field]: value });
  };

  const perizinanWithStudentData = useMemo(() => {
    return perizinan.map(p => {
      const student = students.find(s => s.namasiswa === p.namasiswa);
      return {
        ...p,
        kelas: student?.kelas || p.kelas,
        asrama: student?.asrama || p.asrama,
      };
    });
  }, [perizinan, students]);

  const columns: {key: keyof Perizinan; label: string}[] = [
    { key: 'namasiswa', label: 'Nama Siswa' },
    { key: 'kelas', label: 'Kelas' },
    { key: 'asrama', label: 'Asrama' },
    { key: 'alasan', label: 'Alasan' },
    { key: 'keluar', label: 'Keluar' },
    { key: 'kembali', label: 'Kembali' },
    { key: 'status', label: 'Status' },
  ];

  const customRenderers = {
    alasan: (item: Perizinan) => (
      <InlineEdit value={item.alasan} onSave={(value) => handleEdit(item.id, 'alasan', value)} />
    ),
    keluar: (item: Perizinan) => (
      <InlineEdit value={item.keluar} onSave={(value) => handleEdit(item.id, 'keluar', value)} />
    ),
    kembali: (item: Perizinan) => (
      <InlineEdit value={item.kembali} onSave={(value) => handleEdit(item.id, 'kembali', value)} />
    ),
    status: (item: Perizinan) => (
      <InlineEdit value={item.status} onSave={(value) => handleEdit(item.id, 'status', value)} />
    ),
  };

  const handleDetailClick = (student: Perizinan) => {
    setSelectedStudent(student);
    setIsModalOpen(true);
  };

  const handleChangeDocument = (studentId: string) => {
    setChangingDocumentForId(studentId);
  };

  const StudentDetails = ({ student }: { student: Perizinan }) => (
    <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left flex-1">
      <h3 className="text-lg leading-6 font-medium text-gray-900" id="modal-title">
        Student Details
      </h3>
      <div className="mt-2 space-y-2">
        {[
          { label: "Name", value: student.namasiswa },
          { label: "Class", value: student.kelas },
          { label: "Dormitory", value: student.asrama },
          { label: "Reason", value: student.alasan },
          { label: "Leave", value: student.keluar },
          { label: "Return", value: student.kembali },
          { label: "Status", value: student.status },
        ].map(({ label, value }) => (
          <p key={label} className="text-sm text-gray-500">
            <strong>{label}:</strong> {value}
          </p>
        ))}
      </div>
    </div>
  );

  const DocumentPreview = ({ documentUrl, onChangeDocument }: { documentUrl: string | undefined, onChangeDocument: () => void }) => {
    const [pageNumber, setPageNumber] = useState(1);
    const isPdf = documentUrl?.toLowerCase().endsWith('.pdf');
  
    function onDocumentLoadSuccess() {
      setPageNumber(1); // Reset to first page when a new document is loaded
    }
  
    return (
      <div className="mt-5 sm:mt-0 sm:ml-4 flex-1">
        <p className="text-sm font-medium text-gray-700 mb-2">Document Preview:</p>
        <div className="relative group max-w-xs mx-auto">
          {documentUrl ? (
            <>
              {isPdf ? (
                <Document
                  file={documentUrl}
                  onLoadSuccess={onDocumentLoadSuccess}
                  className="border border-gray-300 rounded"
                >
                  <Page pageNumber={pageNumber} width={300} />
                </Document>
              ) : (
                <img 
                  src={documentUrl} 
                  alt="Document Preview" 
                  className="max-w-full max-h-[300px] object-contain border border-gray-300 rounded mx-auto"
                />
              )}
              <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <button 
                  onClick={onChangeDocument}
                  className="bg-white text-gray-800 px-3 py-1 text-sm rounded-md hover:bg-gray-100"
                >
                  Change Document
                </button>
              </div>
            </>
          ) : (
            <div className="w-full h-[300px] border border-gray-300 rounded flex items-center justify-center bg-gray-100">
              <button 
                onClick={onChangeDocument}
                className="bg-blue-500 text-white px-3 py-1 text-sm rounded-md hover:bg-blue-600"
              >
                Upload Document
              </button>
            </div>
          )}
        </div>
        {documentUrl && (
          <div className="text-center mt-2">
            <a 
              href={documentUrl} 
              target="_blank" 
              rel="noopener noreferrer" 
              className="text-blue-500 hover:underline inline-block text-sm"
            >
              Open Full Document
            </a>
          </div>
        )}
      </div>
    );
  };

  const ModalFooter = ({ onClose }: { onClose: () => void }) => (
    <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
      <button
        type="button"
        className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:ml-3 sm:w-auto sm:text-sm"
        onClick={onClose}
      >
        Close
      </button>
    </div>
  );

  return (
    <div className="bg-gray-100 min-h-screen">
      <nav className="bg-white shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <span className="text-2xl font-bold text-gray-800">Teacher Dashboard</span>
            <Menu as="div" className="relative inline-block text-left">
              <Menu.Button className="inline-flex justify-center w-full px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
                {currentUser?.email}
                <ChevronDownIcon className="-mr-1 ml-2 h-5 w-5" aria-hidden="true" />
              </Menu.Button>
              <Transition
                as={React.Fragment}
                enter="transition ease-out duration-100"
                enterFrom="transform opacity-0 scale-95"
                enterTo="transform opacity-100 scale-100"
                leave="transition ease-in duration-75"
                leaveFrom="transform opacity-100 scale-100"
                leaveTo="transform opacity-0 scale-95"
              >
                <Menu.Items className="absolute right-0 w-56 mt-2 origin-top-right bg-white rounded-md shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
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
      </nav>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="bg-white p-8 rounded-lg shadow-md mb-8">
          <h2 className="text-2xl font-bold mb-6 text-center text-gray-800">Submit New Perizinan</h2>
          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
              <div>
                <label htmlFor="student" className="block text-gray-700 text-sm font-bold mb-2">Student</label>
                <Select
                  options={studentOptions}
                  onChange={handleStudentSelect}
                  placeholder="Select student"
                  isClearable
                  isSearchable
                  className="w-full"
                  classNamePrefix="react-select"
                />
              </div>
              <div>
                <label htmlFor="kelas" className="block text-gray-700 text-sm font-bold mb-2">Kelas</label>
                <input
                  type="text"
                  name="kelas"
                  id="kelas"
                  value={newPerizinan.kelas}
                  readOnly
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label htmlFor="asrama" className="block text-gray-700 text-sm font-bold mb-2">Asrama</label>
                <input
                  type="text"
                  name="asrama"
                  id="asrama"
                  value={newPerizinan.asrama}
                  readOnly
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
            <div className="mb-6">
              <label htmlFor="alasan" className="block text-gray-700 text-sm font-bold mb-2">Alasan</label>
              <textarea
                id="alasan"
                name="alasan"
                rows={3}
                value={newPerizinan.alasan}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
              <div>
                <label htmlFor="keluar" className="block text-gray-700 text-sm font-bold mb-2">Keluar</label>
                <input
                  type="datetime-local"
                  name="keluar"
                  id="keluar"
                  value={newPerizinan.keluar}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              <div>
                <label htmlFor="kembali" className="block text-gray-700 text-sm font-bold mb-2">Kembali</label>
                <input
                  type="datetime-local"
                  name="kembali"
                  id="kembali"
                  value={newPerizinan.kembali}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              <div>
                <label className="block text-gray-700 text-sm font-bold mb-2">Document</label>
                <div className="flex items-center space-x-2">
                  <FileUpload 
                    onFileUpload={handleFileUpload} 
                    onUploadStart={() => setIsUploading(true)}
                    acceptedFileTypes={['image/*', 'application/pdf']}
                  />
                  {isUploading ? (
                    <span className="text-sm text-yellow-600">
                      Uploading...
                    </span>
                  ) : documentUrl && (
                    <span className="text-sm text-green-600">
                      ✓ Uploaded
                    </span>
                  )}
                </div>
              </div>
            </div>
            <button
              type="submit"
              className="w-full bg-blue-500 text-white py-2 px-4 rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50"
              disabled={isUploading}
            >
              {isUploading ? 'Uploading...' : 'Submit Perizinan'}
            </button>
          </form>
        </div>

        <div className="bg-white p-8 rounded-lg shadow-md">
          <h2 className="text-2xl font-bold mb-6 text-center text-gray-800">Perizinan List</h2>
          <div className="overflow-x-auto">
            <SortableTable
              data={perizinanWithStudentData}
              columns={columns}
              onSort={() => {}}
              customRenderers={customRenderers}
              actions={(item: Perizinan) => (
                <>
                  <button
                    onClick={() => handleDetailClick(item)}
                    className="text-indigo-600 hover:text-indigo-900 mr-2"
                  >
                    Detail
                  </button>
                  <button
                    onClick={() => handleDelete(item.id)}
                    className="text-red-600 hover:text-red-900"
                  >
                    Delete
                  </button>
                </>
              )}
            />
          </div>
        </div>
      </main>

      {isModalOpen && selectedStudent && (
        <div className="fixed z-10 inset-0 overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
          <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" aria-hidden="true" />

            <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>

            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-4xl sm:w-full">
              <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <div className="sm:flex sm:items-start">
                  <StudentDetails student={selectedStudent} />
                  <DocumentPreview 
                    documentUrl={selectedStudent.documentUrl} 
                    onChangeDocument={() => handleChangeDocument(selectedStudent.id)} 
                  />
                </div>
              </div>
              <ModalFooter onClose={() => setIsModalOpen(false)} />
            </div>
          </div>
        </div>
      )}

      {changingDocumentForId && (
        <div className="fixed z-20 inset-0 overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
          <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" aria-hidden="true" />
            <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
              <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">Change Document</h3>
                <FileUpload 
                  onFileUpload={handleFileUpload} 
                  onUploadStart={() => setIsUploading(true)}
                  acceptedFileTypes={['image/*', 'application/pdf']}
                />
              </div>
              <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                <button
                  type="button"
                  className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                  onClick={() => setChangingDocumentForId(null)}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TeacherDashboard;