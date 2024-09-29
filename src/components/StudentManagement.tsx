import React, { useState, useEffect, useRef } from 'react';
import { ref, push, onValue, remove, update } from 'firebase/database';
import { db } from '../firebaseConfig';
import { CSVLink } from 'react-csv';
import { useForm } from '../hooks/useForm';
import InlineEdit from './InlineEdit';
import { Student } from '../types';

const ITEMS_PER_PAGE = 10;

const StudentManagement: React.FC = () => {
  const [students, setStudents] = useState<Student[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { formData, handleChange, errors, validateForm } = useForm({
    nisn: { 
      value: '', 
      validate: (value: string) => value ? null : 'NISN is required'
    },
    namasiswa: { 
      value: '', 
      validate: (value: string) => value ? null : 'Name is required'
    },
    kelas: { 
      value: '', 
      validate: (value: string) => value ? null : 'Class is required'
    },
    gender: { 
      value: 'male', 
      validate: (value: string) => ['male', 'female'].includes(value) ? null : 'Invalid gender'
    },
    asrama: { 
      value: '', 
      validate: (value: string) => value ? null : 'Dormitory is required'
    },
  });

  useEffect(() => {
    const studentsRef = ref(db, 'students');
    const unsubscribe = onValue(studentsRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const studentList = Object.entries(data).map(([id, value]) => ({
          id,
          ...(value as Omit<Student, 'id'>),
        }));
        setStudents(studentList);
      } else {
        setStudents([]);
      }
    });

    return () => unsubscribe();
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateForm()) {
      const studentsRef = ref(db, 'students');
      push(studentsRef, {
        nisn: formData.nisn.value,
        namasiswa: formData.namasiswa.value,
        kelas: formData.kelas.value,
        gender: formData.gender.value,
        asrama: formData.asrama.value,
      });
    }
  };

  const handleDelete = (id: string) => {
    if (window.confirm('Are you sure you want to delete this student?')) {
      const studentRef = ref(db, `students/${id}`);
      remove(studentRef).then(() => {
        setStudents(prevStudents => prevStudents.filter(student => student.id !== id));
      }).catch((error) => {
        console.error("Error deleting student: ", error);
      });
    }
  };

  const handleEdit = (student: Student, field: keyof Student, value: string) => {
    const studentRef = ref(db, `students/${student.id}`);
    update(studentRef, { [field]: value }).then(() => {
      setStudents(prevStudents => prevStudents.map(s => 
        s.id === student.id ? { ...s, [field]: value } : s
      ));
    }).catch((error) => {
      console.error("Error updating student: ", error);
    });
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const csv = e.target?.result as string;
        const lines = csv.split('\n');
        const headers = lines[0].split(',');

        if (headers.join(',').trim() !== 'nisn,namasiswa,kelas,gender,asrama') {
          alert('Invalid CSV format. Please ensure the CSV has the following headers: nisn,namasiswa,kelas,gender,asrama');
          return;
        }

        const studentsRef = ref(db, 'students');

        lines.slice(1).forEach((line) => {
          const values = line.split(',');
          if (values.length === headers.length) {
            const student: Omit<Student, 'id'> = {
              nisn: values[0].trim(),
              namasiswa: values[1].trim(),
              kelas: values[2].trim(),
              gender: values[3].trim() as 'male' | 'female',
              asrama: values[4].trim(),
            };
            push(studentsRef, student);
          }
        });

        alert('CSV file imported successfully!');
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
      };
      reader.readAsText(file);
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  const paginatedStudents = students.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const totalPages = Math.ceil(students.length / ITEMS_PER_PAGE);

  return (
    <div className="container mx-auto px-4 py-8">
      <h2 className="text-2xl font-bold mb-4">Student Management</h2>
      <form onSubmit={handleSubmit} className="mb-6">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <input
              type="text"
              name="nisn"
              value={formData.nisn.value}
              onChange={handleChange}
              placeholder="NISN"
              className="border p-2 rounded w-full"
            />
            {errors.nisn && <p className="text-red-500 text-sm">{errors.nisn}</p>}
          </div>
          <div>
            <input
              type="text"
              name="namasiswa"
              value={formData.namasiswa.value}
              onChange={handleChange}
              placeholder="Nama Siswa"
              className="border p-2 rounded w-full"
            />
            {errors.namasiswa && <p className="text-red-500 text-sm">{errors.namasiswa}</p>}
          </div>
          <div>
            <input
              type="text"
              name="kelas"
              value={formData.kelas.value}
              onChange={handleChange}
              placeholder="Kelas"
              className="border p-2 rounded w-full"
            />
            {errors.kelas && <p className="text-red-500 text-sm">{errors.kelas}</p>}
          </div>
          <div>
            <select
              name="gender"
              value={formData.gender.value}
              onChange={handleChange}
              className="border p-2 rounded w-full"
            >
              <option value="male">Male</option>
              <option value="female">Female</option>
            </select>
            {errors.gender && <p className="text-red-500 text-sm">{errors.gender}</p>}
          </div>
          <div>
            <input
              type="text"
              name="asrama"
              value={formData.asrama.value}
              onChange={handleChange}
              placeholder="Asrama"
              className="border p-2 rounded w-full"
            />
            {errors.asrama && <p className="text-red-500 text-sm">{errors.asrama}</p>}
          </div>
        </div>
        <button
          type="submit"
          className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Add Student
        </button>
      </form>

      <div className="flex flex-col space-y-4 mb-4">
        <div className="flex space-x-4">
          <CSVLink
            data={students}
            filename={"students.csv"}
            className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
          >
            Export to CSV
          </CSVLink>

          <input
            type="file"
            accept=".csv"
            onChange={handleFileUpload}
            ref={fileInputRef}
            className="hidden"
          />
          <button
            onClick={triggerFileInput}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Import CSV
          </button>
        </div>
        <p className="text-sm text-gray-600">
          Note: CSV file should have the following headers: "nisn,namasiswa,kelas,gender,asrama"
        </p>
      </div>

      <table className="w-full border-collapse border">
        <thead>
          <tr>
            <th className="border p-2">NISN</th>
            <th className="border p-2">Nama Siswa</th>
            <th className="border p-2">Kelas</th>
            <th className="border p-2">Gender</th>
            <th className="border p-2">Asrama</th>
            <th className="border p-2">Actions</th>
          </tr>
        </thead>
        <tbody>
          {paginatedStudents.map((student) => (
            <tr key={student.id}>
              <td className="border p-2">
                <InlineEdit
                  value={student.nisn}
                  onSave={(value) => handleEdit(student, 'nisn', value)}
                />
              </td>
              <td className="border p-2">
                <InlineEdit
                  value={student.namasiswa}
                  onSave={(value) => handleEdit(student, 'namasiswa', value)}
                />
              </td>
              <td className="border p-2">
                <InlineEdit
                  value={student.kelas}
                  onSave={(value) => handleEdit(student, 'kelas', value)}
                />
              </td>
              <td className="border p-2">
                <select
                  value={student.gender}
                  onChange={(e) => handleEdit(student, 'gender', e.target.value as 'male' | 'female')}
                  className="border p-1 rounded"
                >
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                </select>
              </td>
              <td className="border p-2">
                <InlineEdit
                  value={student.asrama}
                  onSave={(value) => handleEdit(student, 'asrama', value)}
                />
              </td>
              <td className="border p-2">
                <button
                  onClick={() => handleDelete(student.id)}
                  className="px-2 py-1 bg-red-500 text-white rounded hover:bg-red-600"
                >
                  Delete
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

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
  );
};

export default StudentManagement;