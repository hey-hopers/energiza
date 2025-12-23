
import React from 'react';
import Card from './Card';

interface Column<T> {
  key: keyof T | string;
  header: string;
  render?: (item: T) => React.ReactNode;
}

interface TableProps<T> {
  title: string;
  data: T[];
  columns: Column<T>[];
}

const Table = <T extends { id: string },>(
  { title, data, columns }: TableProps<T>
): React.ReactElement => {
  return (
    <Card>
      <h2 className="text-xl font-semibold text-secondary mb-4">{title}</h2>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              {columns.map((col) => (
                <th
                  key={String(col.key)}
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {data.map((item) => (
              <tr key={item.id} className="hover:bg-gray-50">
                {columns.map((col) => (
                  <td key={`${item.id}-${String(col.key)}`} className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                    {col.render ? col.render(item) : (item[col.key as keyof T] as unknown as React.ReactNode)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
};

export default Table;
