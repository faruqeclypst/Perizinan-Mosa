import React, { useState, useEffect } from 'react';
import { ref, push, onValue, remove, update } from 'firebase/database';
import { db } from '../firebaseConfig';
import { CSVLink } from 'react-csv';
import { useForm } from '../hooks/useForm';
import InlineEdit from './InlineEdit';
import { Schedule, Teacher } from '../types';

const ITEMS_PER_PAGE = 10;

const ScheduleManagement: React.FC = () => {
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [currentPage, setCurrentPage] = useState(1);

  const { formData, handleChange, errors, validateForm } = useForm({
    date: { 
      value: '', 
      validate: (value: string) => value ? null : 'Date is required'
    },
    guruPiket: { 
      value: [] as string[], 
      validate: (value: string[]) => value.length > 0 ? null : 'At least one Guru Piket must be selected'
    },
    wakil: { 
      value: '', 
      validate: (value: string) => value ? null : 'Wakil must be selected'
    },
  });

  useEffect(() => {
    const schedulesRef = ref(db, 'schedules');
    onValue(schedulesRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const scheduleList = Object.entries(data).map(([id, value]) => ({
          id,
          ...(value as Omit<Schedule, 'id'>),
        }));
        setSchedules(scheduleList);
      }
    });

    const teachersRef = ref(db, 'teachers');
    onValue(teachersRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const teacherList = Object.entries(data).map(([id, value]) => ({
          id,
          ...(value as Omit<Teacher, 'id'>),
        }));
        setTeachers(teacherList);
      }
    });
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateForm()) {
      const schedulesRef = ref(db, 'schedules');
      push(schedulesRef, {
        date: formData.date.value,
        guruPiket: formData.guruPiket.value,
        wakil: formData.wakil.value,
      });
    }
  };

  const handleDelete = (id: string) => {
    if (window.confirm('Are you sure you want to delete this schedule?')) {
      const scheduleRef = ref(db, `schedules/${id}`);
      remove(scheduleRef);
    }
  };

  const handleEdit = (schedule: Schedule, field: keyof Schedule, value: string | string[]) => {
    const scheduleRef = ref(db, `schedules/${schedule.id}`);
    update(scheduleRef, { [field]: value });
  };

  const paginatedSchedules = schedules.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const totalPages = Math.ceil(schedules.length / ITEMS_PER_PAGE);

  return (
    <div>
      <h2 className="text-2xl font-bold mb-4">Schedule Management</h2>
      <form onSubmit={handleSubmit} className="mb-6">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <input
              type="date"
              name="date"
              value={formData.date.value}
              onChange={handleChange}
              className="border p-2 rounded w-full"
            />
            {errors.date && <p className="text-red-500 text-sm">{errors.date}</p>}
          </div>
          <div>
            <select
              name="guruPiket"
              multiple
              value={formData.guruPiket.value}
              onChange={handleChange}
              className="border p-2 rounded w-full"
            >
              {teachers
                .filter((teacher) => teacher.role === 'gurupiket')
                .map((teacher) => (
                  <option key={teacher.id} value={teacher.id}>
                    {teacher.name}
                  </option>
                ))}
            </select>
            {errors.guruPiket && <p className="text-red-500 text-sm">{errors.guruPiket}</p>}
          </div>
          <div>
            <select
              name="wakil"
              value={formData.wakil.value}
              onChange={handleChange}
              className="border p-2 rounded w-full"
            >
              <option value="">Select Wakil</option>
              {teachers
                .filter((teacher) => teacher.role === 'wakil')
                .map((teacher) => (
                  <option key={teacher.id} value={teacher.id}>
                    {teacher.name}
                  </option>
                ))}
            </select>
            {errors.wakil && <p className="text-red-500 text-sm">{errors.wakil}</p>}
          </div>
        </div>
        <button
          type="submit"
          className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Add Schedule
        </button>
      </form>

      <CSVLink
        data={schedules}
        filename={"schedules.csv"}
        className="mb-4 px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
      >
        Export to CSV
      </CSVLink>

      <table className="w-full border-collapse border">
        <thead>
          <tr>
            <th className="border p-2">Date</th>
            <th className="border p-2">Guru Piket</th>
            <th className="border p-2">Wakil</th>
            <th className="border p-2">Actions</th>
          </tr>
        </thead>
        <tbody>
          {paginatedSchedules.map((schedule) => (
            <tr key={schedule.id}>
              <td className="border p-2">
                <InlineEdit
                  value={schedule.date}
                  onSave={(value) => handleEdit(schedule, 'date', value)}
                />
              </td>
              <td className="border p-2">
                <select
                  multiple
                  value={schedule.guruPiket}
                  onChange={(e) => handleEdit(schedule, 'guruPiket', Array.from(e.target.selectedOptions, option => option.value))}
                  className="border p-1 rounded w-full"
                >
                  {teachers
                    .filter((teacher) => teacher.role === 'gurupiket')
                    .map((teacher) => (
                      <option key={teacher.id} value={teacher.id}>
                        {teacher.name}
                      </option>
                    ))}
                </select>
              </td>
              <td className="border p-2">
                <select
                  value={schedule.wakil}
                  onChange={(e) => handleEdit(schedule, 'wakil', e.target.value)}
                  className="border p-1 rounded w-full"
                >
                  {teachers
                    .filter((teacher) => teacher.role === 'wakil')
                    .map((teacher) => (
                      <option key={teacher.id} value={teacher.id}>
                        {teacher.name}
                      </option>
                    ))}
                </select>
              </td>
              <td className="border p-2">
                <button
                  onClick={() => handleDelete(schedule.id)}
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

export default ScheduleManagement;