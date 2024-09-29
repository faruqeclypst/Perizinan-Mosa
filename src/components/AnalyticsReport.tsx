import React, { useRef } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ChartData,
  ChartOptions
} from 'chart.js';
import { Bar } from 'react-chartjs-2';
import { Perizinan } from '../types';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

interface AnalyticsReportProps {
  perizinanData: Perizinan[];
}

const AnalyticsReport: React.FC<AnalyticsReportProps> = ({ perizinanData }) => {
  const chartRef1 = useRef<ChartJS<"bar", number[], string>>(null);
  const chartRef2 = useRef<ChartJS<"bar", number[], string>>(null);

  const monthlyData = perizinanData.reduce((acc, perizinan) => {
    const month = new Date(perizinan.keluar).getMonth();
    acc[month] = (acc[month] || 0) + 1;
    return acc;
  }, {} as Record<number, number>);

  const classData = perizinanData.reduce((acc, perizinan) => {
    acc[perizinan.kelas] = (acc[perizinan.kelas] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const monthlyChartData: ChartData<"bar", number[], string> = {
    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
    datasets: [{
      label: 'Perizinan per Month',
      data: Object.values(monthlyData),
      backgroundColor: 'rgba(75, 192, 192, 0.6)',
    }]
  };

  const classChartData: ChartData<"bar", number[], string> = {
    labels: Object.keys(classData),
    datasets: [{
      label: 'Perizinan per Class',
      data: Object.values(classData),
      backgroundColor: 'rgba(153, 102, 255, 0.6)',
    }]
  };

  const options: ChartOptions<"bar"> = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      title: {
        display: true,
        text: 'Perizinan Analytics',
      },
    },
    scales: {
      y: {
        beginAtZero: true
      }
    }
  };

  return (
    <div className="mt-8">
      <h2 className="text-2xl font-bold mb-4">Monthly Trend</h2>
      <Bar
        data={monthlyChartData}
        options={options}
        ref={chartRef1}
      />
      <h2 className="text-2xl font-bold mt-8 mb-4">Class Distribution</h2>
      <Bar
        data={classChartData}
        options={options}
        ref={chartRef2}
      />
    </div>
  );
};

export default AnalyticsReport;