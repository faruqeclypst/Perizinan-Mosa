import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { signOut } from 'firebase/auth';
import { auth, db } from '../firebaseConfig';
import { ref, onValue, push, remove, update } from 'firebase/database';
import FileUpload from '../components/FileUpload';
import Select from 'react-select';
import { Perizinan, Student } from '../types/index';
import InlineEdit from '../components/InlineEdit';

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

  useEffect(() => {
    const perizinanRef = ref(db, 'perizinan');
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

    const studentsRef = ref(db, 'students');
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

  const handleFileUpload = (url: string) => {
    setDocumentUrl(url);
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

  return (
    <div className="min-h-screen bg-gray-100">
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex">
              <div className="flex-shrink-0 flex items-center">
                <span className="text-2xl font-bold text-indigo-600">Teacher Dashboard</span>
              </div>
            </div>
            <div className="flex items-center">
              <span className="text-gray-700 mr-4">{currentUser?.email}</span>
              <button
                onClick={handleLogout}
                className="px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                Log out
              </button>
            </div>
          </div>
        </div>
      </nav>

      <div className="py-10">
        <main>
          <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
            <div className="px-4 py-8 sm:px-0">
              <h2 className="text-2xl font-bold mb-4">Submit New Perizinan</h2>
              <form onSubmit={handleSubmit} className="mb-8">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Select
                      options={studentOptions}
                      onChange={handleStudentSelect}
                      placeholder="Select or search student"
                      isClearable
                      isSearchable
                    />
                  </div>
                  <input
                    type="text"
                    name="kelas"
                    value={newPerizinan.kelas}
                    readOnly
                    placeholder="Kelas"
                    className="border p-2 rounded bg-gray-100"
                  />
                  <input
                    type="text"
                    name="asrama"
                    value={newPerizinan.asrama}
                    readOnly
                    placeholder="Asrama"
                    className="border p-2 rounded bg-gray-100"
                  />
                  <textarea
                    name="alasan"
                    value={newPerizinan.alasan}
                    onChange={handleInputChange}
                    placeholder="Alasan"
                    className="border p-2 rounded"
                    required
                  />
                  <input
                    type="datetime-local"
                    name="keluar"
                    value={newPerizinan.keluar}
                    onChange={handleInputChange}
                    className="border p-2 rounded"
                    required
                  />
                  <input
                    type="datetime-local"
                    name="kembali"
                    value={newPerizinan.kembali}
                    onChange={handleInputChange}
                    className="border p-2 rounded"
                    required
                  />
                </div>
                <FileUpload onFileUpload={handleFileUpload} />
                {documentUrl && <p className="mt-2">Document uploaded successfully</p>}
                <button
                  type="submit"
                  className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                >
                  Submit Perizinan
                </button>
              </form>

              <h2 className="text-2xl font-bold mb-4">Perizinan List</h2>
              <table className="w-full border-collapse border">
                <thead>
                  <tr>
                    <th className="border p-2">Nama Siswa</th>
                    <th className="border p-2">Kelas</th>
                    <th className="border p-2">Asrama</th>
                    <th className="border p-2">Alasan</th>
                    <th className="border p-2">Keluar</th>
                    <th className="border p-2">Kembali</th>
                    <th className="border p-2">Status</th>
                    <th className="border p-2">Document</th>
                    <th className="border p-2">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {perizinanWithStudentData.map((p) => (
                    <tr key={p.id}>
                      <td className="border p-2">{p.namasiswa}</td>
                      <td className="border p-2">{p.kelas}</td>
                      <td className="border p-2">{p.asrama}</td>
                      <td className="border p-2">
                        <InlineEdit value={p.alasan} onSave={(value) => handleEdit(p.id, 'alasan', value)} />
                      </td>
                      <td className="border p-2">
                        <InlineEdit value={p.keluar} onSave={(value) => handleEdit(p.id, 'keluar', value)} />
                      </td>
                      <td className="border p-2">
                        <InlineEdit value={p.kembali} onSave={(value) => handleEdit(p.id, 'kembali', value)} />
                      </td>
                      <td className="border p-2">{p.status}</td>
                      <td className="border p-2">
                        {p.documentUrl ? (
                          <InlineEdit
                            value={p.documentUrl}
                            onSave={(value) => handleEdit(p.id, 'documentUrl', value)}
                          />
                        ) : (
                          <FileUpload onFileUpload={(url) => handleEdit(p.id, 'documentUrl', url)} />
                        )}
                      </td>
                      <td className="border p-2">
                        <button
                          onClick={() => handleDelete(p.id)}
                          className="px-2 py-1 bg-red-500 text-white rounded hover:bg-red-600"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default TeacherDashboard;