import React from "react";
import Pagination from "@/src/components/ui/Pagination";
import clsx from "clsx";

interface TableColumn<T> {
  key: keyof T | string;
  label: string;
  render?: (item: T) => React.ReactNode;
  className?: string;
}

interface TableProps<T> {
  columns: TableColumn<T>[];
  data: T[];
  emptyMessage?: string;
  pagination?: {
    currentPage: number;
    totalPages: number;
    totalItems: number;
    itemsPerPage: number;
    onPageChange: (page: number) => void;
  };
  bordered?: boolean;
  striped?: boolean;
  hover?: boolean;
}

function Table<T extends { id?: number | string }>({
  columns,
  data,
  emptyMessage = "No data found.",
  pagination,
  bordered = true,
  striped = false,
  hover = true,
}: TableProps<T>) {
  return (
    <div className="overflow-x-auto">
      <table
        className={clsx(
          "min-w-full text-sm divide-y divide-gray-200",
          bordered && "border border-gray-200 rounded-lg",
          striped && "divide-y divide-gray-100"
        )}
      >
        <thead className="bg-gray-50">
          <tr>
            {columns.map((col) => (
              <th
                key={String(col.key)}
                className={clsx(
                  "px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider",
                  col.className
                )}
              >
                {col.label}
              </th>
            ))}
          </tr>
        </thead>

        <tbody
          className={clsx(
            "bg-white",
            striped && "divide-y divide-gray-100",
            hover && "hover:[&>tr]:bg-gray-50"
          )}
        >
          {data.length > 0 ? (
            data.map((item, index) => (
              <tr key={item.id || index}>
                {columns.map((col) => (
                  <td
                    key={String(col.key)}
                    className={clsx("px-6 py-4 whitespace-nowrap", col.className)}
                  >
                    {col.render ? col.render(item) : (item as any)[col.key]}
                  </td>
                ))}
              </tr>
            ))
          ) : (
            <tr>
              <td
                colSpan={columns.length}
                className="text-center py-10 text-gray-500"
              >
                {emptyMessage}
              </td>
            </tr>
          )}
        </tbody>
      </table>

      {pagination && (
        <div className="mt-4">
          <Pagination
            currentPage={pagination.currentPage}
            totalPages={pagination.totalPages}
            totalItems={pagination.totalItems}
            itemsPerPage={pagination.itemsPerPage}
            onPageChange={pagination.onPageChange}
          />
        </div>
      )}
    </div>
  );
}

export default Table;
