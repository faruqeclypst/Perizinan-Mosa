import React, { useState } from 'react';
import { storage } from '../firebaseConfig';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';

interface FileUploadProps {
  onFileUpload: (url: string) => void;
  onUploadStart?: () => void;
  acceptedFileTypes?: string[];
}

const FileUpload: React.FC<FileUploadProps> = ({ onFileUpload, onUploadStart, acceptedFileTypes }) => {
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFile(e.target.files[0]);
    }
  };

  const handleUpload = async () => {
    if (!file) return;

    setIsUploading(true);
    if (onUploadStart) {
      onUploadStart();
    }

    try {
      const storageRef = ref(storage, `documents/${file.name}`);
      await uploadBytes(storageRef, file);
      const downloadURL = await getDownloadURL(storageRef);
      onFileUpload(downloadURL);
    } catch (error) {
      console.error("Error uploading file:", error);
      // You might want to add some error handling here
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="mt-4">
      <input 
        type="file" 
        onChange={handleFileChange} 
        className="mb-2"
        accept={acceptedFileTypes ? acceptedFileTypes.join(',') : undefined}
      />
      <button
        onClick={handleUpload}
        disabled={!file || isUploading}
        className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:bg-gray-400"
      >
        {isUploading ? 'Uploading...' : 'Upload'}
      </button>
    </div>
  );
};

export default FileUpload;