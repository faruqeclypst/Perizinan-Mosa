import { ref, get, set } from 'firebase/database';
import { db } from '../firebaseConfig';

export const backupData = async () => {
  const dbRef = ref(db);
  const snapshot = await get(dbRef);
  const data = snapshot.val();
  const json = JSON.stringify(data);
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `backup_${new Date().toISOString()}.json`;
  link.click();
};

export const restoreData = async (file: File) => {
  const reader = new FileReader();
  reader.onload = async (e) => {
    const data = JSON.parse(e.target?.result as string);
    await set(ref(db), data);
    alert('Data restored successfully');
  };
  reader.readAsText(file);
};