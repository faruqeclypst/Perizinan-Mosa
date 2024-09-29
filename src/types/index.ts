export interface Perizinan {
    id: string;
    namasiswa: string;
    kelas: string;
    asrama: string;
    alasan: string;
    keluar: string;
    kembali: string;
    status: 'pending' | 'approved' | 'rejected';
    documentUrl?: string;  // Tambahkan ini
}
  
  export interface User {
    id: string;
    email: string;
    role: 'admin' | 'gurupiket' | 'wakil';
  }
  
  export interface Student {
    id: string;
    nisn: string;
    namasiswa: string;
    kelas: string;
    gender: 'male' | 'female';
    asrama: string;
  }
  
  export interface Teacher {
    id: string;
    uid: string;
    name: string;
    email: string;
    role: 'gurupiket' | 'wakil' | 'admin';
  }
  
  export interface Schedule {
    id: string;
    date: string;
    guruPiket: string[];
    wakil: string;
  }