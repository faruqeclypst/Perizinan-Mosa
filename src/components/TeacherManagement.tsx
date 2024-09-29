import React, { useState, useEffect, useMemo } from 'react';
import { ref, push, onValue, remove, update, set } from 'firebase/database';
import { getAuth, createUserWithEmailAndPassword } from 'firebase/auth';
import { db } from '../firebaseConfig';
import { CSVLink } from 'react-csv';
import { useForm } from '../hooks/useForm';
import InlineEdit from './InlineEdit';
import { toast } from 'react-toastify';
import { Teacher } from '../types/index';
import { ROLES } from '../utils/roles';
import { useAuth } from '../contexts/AuthContext';

const ITEMS_PER_PAGE = 10;

const TeacherManagement: React.FC = () => {
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const auth = getAuth();
  const { currentUser, reauthenticate } = useAuth();

  const { formData, handleChange, errors, validateForm, resetForm } = useForm({
    name: { 
      value: '', 
      validate: (value: string) => value ? null : 'Name is required'
    },
    email: { 
      value: '', 
      validate: (value: string) => /\S+@\S+\.\S+/.test(value) ? null : 'Valid email is required'
    },
    password: {
      value: '',
      validate: (value: string) => value.length >= 6 ? null : 'Password must be at least 6 characters'
    },
    role: { 
      value: ROLES.GURU_PIKET as 'gurupiket' | 'wakil' | 'admin', 
      validate: (value: string) => ['gurupiket', 'wakil', 'admin'].includes(value) ? null : 'Invalid role'
    },
  });

  useEffect(() => {
    const teachersRef = ref(db, 'teachers');
    const unsubscribe = onValue(teachersRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const teacherList = Object.entries(data).map(([id, value]) => ({
          id,
          ...(value as Omit<Teacher, 'id'>),
        }));
        setTeachers(teacherList);
      } else {
        setTeachers([]);
      }
    });

    return () => {
      unsubscribe();
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (validateForm()) {
      if (currentUser?.role !== ROLES.ADMIN) {
        toast.error('Only admins can add new teachers');
        return;
      }
  
      try {
        console.log("Adding new teacher. Current user:", currentUser);
        
        // Store current admin's auth
        const adminAuth = auth.currentUser;
        
        // Create new user
        const userCredential = await createUserWithEmailAndPassword(auth, formData.email.value, formData.password.value);
        const newUser = userCredential.user;
    
        // Add user to teachers collection
        const teachersRef = ref(db, 'teachers');
        const newTeacherRef = await push(teachersRef, {
          name: formData.name.value,
          email: formData.email.value,
          role: formData.role.value,
          uid: newUser.uid,
        });
    
        // Add user role to users collection
        await set(ref(db, `users/${newUser.uid}`), {
          email: newUser.email,
          role: formData.role.value
        });
  
        // Sign back in as admin
        if (adminAuth) {
          try {
            await auth.updateCurrentUser(adminAuth);
          } catch (error) {
            console.error("Error updating current user:", error);
          }
        }
  
        // Get the new teacher's ID
        const newTeacherId = newTeacherRef.key;
    
        // Update local state to include the new teacher
        if (newTeacherId) {
          setTeachers(prevTeachers => {
            const newTeacher: Teacher = {
              id: newTeacherId,
              name: formData.name.value,
              email: formData.email.value,
              role: formData.role.value as 'gurupiket' | 'wakil' | 'admin',
              uid: newUser.uid,
            };
            const updatedTeachers = prevTeachers.filter(t => t.id !== newTeacherId);
            return [...updatedTeachers, newTeacher].sort((a, b) => a.name.localeCompare(b.name));
          });
        }
  
        console.log("Teacher added successfully. Current user:", currentUser);
        toast.success('Teacher added successfully');
        resetForm();
      } catch (error) {
        console.error('Error adding teacher:', error);
        toast.error('Failed to add teacher');
      }
    }
  };

  const handleDelete = async (id: string, uid: string) => {
    if (currentUser?.role !== ROLES.ADMIN) {
      toast.error('Only admins can delete teachers');
      return;
    }

    if (window.confirm('Are you sure you want to delete this teacher?')) {
      try {
        const adminPassword = prompt("Please enter your password to confirm this action:");
        if (!adminPassword) {
          toast.error('Password is required to delete a teacher');
          return;
        }

        await reauthenticate(adminPassword);

        // Delete teacher from the database
        const teacherRef = ref(db, `teachers/${id}`);
        await remove(teacherRef);
  
        // Delete user from users collection
        await remove(ref(db, `users/${uid}`));
  
        // Update local state to remove the deleted teacher
        setTeachers(prevTeachers => prevTeachers.filter(teacher => teacher.id !== id));
  
        toast.success('Teacher deleted successfully');
      } catch (error) {
        console.error('Error deleting teacher:', error);
        toast.error('Failed to delete teacher');
      }
    }
  };

  const handleEdit = async (teacher: Teacher, field: keyof Teacher, value: string) => {
    if (currentUser?.role !== ROLES.ADMIN) {
      toast.error('Only admins can edit teachers');
      return;
    }

    try {
      const teacherRef = ref(db, `teachers/${teacher.id}`);
      await update(teacherRef, { [field]: value });

      // If the role is being updated, also update it in the users collection
      if (field === 'role') {
        await update(ref(db, `users/${teacher.uid}`), { role: value });
      }

      toast.success('Teacher updated successfully');
    } catch (error) {
      console.error('Error updating teacher:', error);
      toast.error('Failed to update teacher');
    }
  };

  const paginatedTeachers = useMemo(() => {
    return teachers.slice(
      (currentPage - 1) * ITEMS_PER_PAGE,
      currentPage * ITEMS_PER_PAGE
    );
  }, [teachers, currentPage]);
  
  const totalPages = Math.ceil(teachers.length / ITEMS_PER_PAGE);

  return (
    <div className="container mx-auto px-4 py-8">
      <h2 className="text-3xl font-bold mb-6">Teacher Management</h2>
      {currentUser?.role === ROLES.ADMIN && (
        <form onSubmit={handleSubmit} className="mb-8 bg-white shadow-md rounded px-8 pt-6 pb-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="name">
                Name
              </label>
              <input
                id="name"
                type="text"
                name="name"
                value={formData.name.value}
                onChange={handleChange}
                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                placeholder="Name"
              />
              {errors.name && <p className="text-red-500 text-xs italic">{errors.name}</p>}
            </div>
            <div>
              <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="email">
                Email
              </label>
              <input
                id="email"
                type="email"
                name="email"
                value={formData.email.value}
                onChange={handleChange}
                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                placeholder="Email"
              />
              {errors.email && <p className="text-red-500 text-xs italic">{errors.email}</p>}
            </div>
            <div>
              <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="password">
                Password
              </label>
              <input
                id="password"
                type="password"
                name="password"
                value={formData.password.value}
                onChange={handleChange}
                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                placeholder="Password"
              />
              {errors.password && <p className="text-red-500 text-xs italic">{errors.password}</p>}
            </div>
            <div>
              <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="role">
                Role
              </label>
              <select
                id="role"
                name="role"
                value={formData.role.value}
                onChange={handleChange}
                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              >
                <option value={ROLES.GURU_PIKET}>Guru Piket</option>
                <option value={ROLES.WAKIL}>Wakil</option>
                <option value={ROLES.ADMIN}>Admin</option>
              </select>
              {errors.role && <p className="text-red-500 text-xs italic">{errors.role}</p>}
            </div>
          </div>
          <button
            type="submit"
            className="mt-4 bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
          >
            Add Teacher
          </button>
        </form>
      )}

      <div className="mb-4">
        <CSVLink
          data={teachers}
          filename={"teachers.csv"}
          className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
        >
          Export to CSV
        </CSVLink>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full table-auto">
          <thead>
            <tr className="bg-gray-200 text-gray-600 uppercase text-sm leading-normal">
              <th className="py-3 px-6 text-left">Name</th>
              <th className="py-3 px-6 text-left">Email</th>
              <th className="py-3 px-6 text-left">Role</th>
              {currentUser?.role === ROLES.ADMIN && <th className="py-3 px-6 text-center">Actions</th>}
            </tr>
          </thead>
          <tbody className="text-gray-600 text-sm font-light">
            {paginatedTeachers.map((teacher) => (
              <tr key={teacher.uid} className="border-b border-gray-200 hover:bg-gray-100">
                <td className="py-3 px-6 text-left whitespace-nowrap">
                  {currentUser?.role === ROLES.ADMIN ? (
                    <InlineEdit
                      value={teacher.name}
                      onSave={(value) => handleEdit(teacher, 'name', value)}
                    />
                  ) : (
                    teacher.name
                  )}
                </td>
                <td className="py-3 px-6 text-left">
                  {currentUser?.role === ROLES.ADMIN ? (
                    <InlineEdit
                      value={teacher.email}
                      onSave={(value) => handleEdit(teacher, 'email', value)}
                    />
                  ) : (
                    teacher.email
                  )}
                </td>
                <td className="py-3 px-6 text-left">
                  {currentUser?.role === ROLES.ADMIN ? (
                    <select
                      value={teacher.role}
                      onChange={(e) => handleEdit(teacher, 'role', e.target.value as 'gurupiket' | 'wakil' | 'admin')}
                      className="bg-transparent border-b border-gray-300 py-1 px-2 focus:outline-none focus:border-blue-500"
                    >
                      <option value="gurupiket">Guru Piket</option>
                      <option value="wakil">Wakil</option>
                      <option value="admin">Admin</option>
                    </select>
                  ) : (
                    teacher.role
                  )}
                </td>
                {currentUser?.role === ROLES.ADMIN && (
                  <td className="py-3 px-6 text-center">
                    <button
                      onClick={() => handleDelete(teacher.id, teacher.uid)}
                      className="bg-red-500 hover:bg-red-700 text-white font-bold py-1 px-3 rounded focus:outline-none focus:shadow-outline"
                    >
                      Delete
                    </button>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-4 flex justify-between items-center">
        <button
          onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
          disabled={currentPage === 1}
          className="bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold py-2 px-4 rounded-l focus:outline-none focus:shadow-outline disabled:opacity-50"
        >
          Previous
        </button>
        <span>Page {currentPage} of {totalPages}</span>
        <button
          onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
          disabled={currentPage === totalPages}
          className="bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold py-2 px-4 rounded-r focus:outline-none focus:shadow-outline disabled:opacity-50"
        >
          Next
        </button>
      </div>
    </div>
  );
};

export default TeacherManagement;