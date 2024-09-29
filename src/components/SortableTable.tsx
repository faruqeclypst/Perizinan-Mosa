import { useState } from 'react';

interface SortableTableProps<T> {
  data: T[];
  columns: {
    key: keyof T;
    label: string;
  }[];
  onSort: (key: keyof T, direction: 'asc' | 'desc') => void;
  customRenderers?: {
    [K in keyof T]?: (item: T) => React.ReactNode;
  };
  actions?: (item: T) => React.ReactNode;
}

function SortableTable<T>({ data, columns, onSort, customRenderers, actions }: SortableTableProps<T>) {
  const [sortColumn, setSortColumn] = useState<keyof T | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  const handleSort = (key: keyof T) => {
    const newDirection = key === sortColumn && sortDirection === 'asc' ? 'desc' : 'asc';
    setSortColumn(key);
    setSortDirection(newDirection);
    onSort(key, newDirection);
  };

  return (
    <table className="min-w-full divide-y divide-gray-200">
      <thead className="bg-gray-50">
        <tr>
          {columns.map((column) => (
            <th
              key={column.key as string}
              scope="col"
              className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
              onClick={() => handleSort(column.key)}
            >
              {column.label}
              {sortColumn === column.key && (
                <span className="ml-2">
                  {sortDirection === 'asc' ? '▲' : '▼'}
                </span>
              )}
            </th>
          ))}
          {actions && <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>}
        </tr>
      </thead>
      <tbody className="bg-white divide-y divide-gray-200">
        {data.map((item, index) => (
          <tr key={index}>
            {columns.map((column) => (
              <td key={column.key as string} className="px-6 py-4 whitespace-nowrap">
                {customRenderers && column.key in customRenderers
                  ? customRenderers[column.key]!(item)
                  : String(item[column.key])}
              </td>
            ))}
            {actions && (
              <td className="px-6 py-4 whitespace-nowrap">
                {actions(item)}
              </td>
            )}
          </tr>
        ))}
      </tbody>
    </table>
  );
}

export default SortableTable;