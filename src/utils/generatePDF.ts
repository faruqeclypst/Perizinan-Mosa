import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Perizinan } from '../types';

const ROWS_PER_PAGE = 20;

export const generatePDF = (data: Perizinan[], logoUrl: string, schoolName: string) => {
  const doc = new jsPDF();
  let pageNumber = 1;

  const addHeader = () => {
    if (logoUrl) {
      doc.addImage(logoUrl, 'PNG', 14, 10, 30, 30);
    }

    doc.setFontSize(18);
    doc.setTextColor(0, 102, 204);
    doc.text(schoolName, 50, 25);

    doc.setFontSize(14);
    doc.setTextColor(0);
    doc.text('Perizinan Report', 14, 45);

    const date = new Date();
    const dateStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text(`Generated on: ${dateStr}`, 14, 52);
  };

  const addFooter = () => {
    const totalPages = Math.ceil(data.length / ROWS_PER_PAGE);
    doc.setFontSize(10);
    doc.text(`Page ${pageNumber} of ${totalPages}`, 14, doc.internal.pageSize.height - 10);
    pageNumber++;
  };

  const tableColumn = ["Nama Siswa", "Kelas", "Asrama", "Alasan", "Keluar", "Kembali", "Status"];

  for (let i = 0; i < data.length; i += ROWS_PER_PAGE) {
    const pageData = data.slice(i, i + ROWS_PER_PAGE);
    const tableRows = pageData.map(perizinan => [
      perizinan.namasiswa,
      perizinan.kelas,
      perizinan.asrama,
      perizinan.alasan,
      perizinan.keluar,
      perizinan.kembali,
      perizinan.status
    ]);

    if (i > 0) {
      doc.addPage();
    }

    addHeader();

    autoTable(doc, {
      head: [tableColumn],
      body: tableRows,
      startY: 60,
      headStyles: {
        fillColor: [0, 102, 204],
        textColor: 255,
        fontSize: 10,
        halign: 'center',
      },
      bodyStyles: {
        fontSize: 9,
      },
      alternateRowStyles: {
        fillColor: [245, 245, 245],
      },
      columnStyles: {
        0: { cellWidth: 30 },
        1: { cellWidth: 15 },
        2: { cellWidth: 20 },
        3: { cellWidth: 'auto' },
        4: { cellWidth: 25 },
        5: { cellWidth: 25 },
        6: { cellWidth: 20 },
      },
    });

    addFooter();
  }

  const date = new Date();
  const dateStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
  doc.save(`perizinan_report_${dateStr}.pdf`);
};