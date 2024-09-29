// src/hooks/useForm.ts

import { useState, ChangeEvent } from 'react';

type ValidationRule<T> = (value: T) => string | null;

interface FormField<T> {
  value: T;
  validate: ValidationRule<T>;
}

export const useForm = <T extends Record<string, any>>(initialState: { [K in keyof T]: FormField<T[K]> }) => {
  const [formData, setFormData] = useState(initialState);
  const [errors, setErrors] = useState<{ [K in keyof T]?: string | null }>({});

  const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: { ...prev[name as keyof T], value }
    }));
  };

  const validateForm = () => {
    const newErrors: { [K in keyof T]?: string | null } = {};
    let isValid = true;

    (Object.keys(formData) as Array<keyof T>).forEach(key => {
      const error = formData[key].validate(formData[key].value);
      newErrors[key] = error;
      if (error) isValid = false;
    });

    setErrors(newErrors);
    return isValid;
  };

  const resetForm = () => {
    const resetData = Object.keys(formData).reduce((acc, key) => {
      acc[key as keyof T] = { ...formData[key as keyof T], value: '' };
      return acc;
    }, {} as { [K in keyof T]: FormField<T[K]> });
    setFormData(resetData);
    setErrors({});
  };

  return { formData, handleChange, errors, validateForm, resetForm };
};