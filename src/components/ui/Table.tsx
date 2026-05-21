import React from "react";
import { cn } from "../../utils/cn";

interface TableProps extends React.HTMLAttributes<HTMLTableElement> {
  children: React.ReactNode;
}

const Table: React.FC<TableProps> = ({ children, className, ...props }) => {
  return (
    <div className="w-full overflow-hidden">
      <table className={cn("w-full border-collapse text-left", className)} {...props}>
        {children}
      </table>
    </div>
  );
};

interface TableHeaderProps extends React.HTMLAttributes<HTMLTableSectionElement> {
  children: React.ReactNode;
}

const TableHeader: React.FC<TableHeaderProps> = ({ children, className, ...props }) => {
  return (
    <thead className={cn("bg-[#ECE8E1] border-b border-[#D8D2C8]", className)} {...props}>
      {children}
    </thead>
  );
};

interface TableBodyProps extends React.HTMLAttributes<HTMLTableSectionElement> {
  children: React.ReactNode;
}

const TableBody: React.FC<TableBodyProps> = ({ children, className, ...props }) => {
  return (
    <tbody className={cn("divide-y divide-[#D8D2C8]", className)} {...props}>
      {children}
    </tbody>
  );
};

interface TableRowProps extends React.HTMLAttributes<HTMLTableRowElement> {
  children: React.ReactNode;
}

const TableRow: React.FC<TableRowProps> = ({ children, className, ...props }) => {
  return (
    <tr
      className={cn(
        "transition-colors hover:bg-[#ECE8E1]/60 group cursor-pointer",
        className
      )}
      {...props}
    >
      {children}
    </tr>
  );
};

interface TableHeadProps extends React.ThHTMLAttributes<HTMLTableCellElement> {
  children: React.ReactNode;
}

const TableHead: React.FC<TableHeadProps> = ({ children, className, ...props }) => {
  return (
    <th
      className={cn(
        "p-4 text-[10px] font-medium text-[#5C5C5C] uppercase tracking-[0.15em]",
        className
      )}
      {...props}
    >
      {children}
    </th>
  );
};

interface TableCellProps extends React.TdHTMLAttributes<HTMLTableCellElement> {
  children: React.ReactNode;
}

const TableCell: React.FC<TableCellProps> = ({ children, className, ...props }) => {
  return (
    <td className={cn("p-4 align-middle", className)} {...props}>
      {children}
    </td>
  );
};

export { Table, TableHeader, TableBody, TableHead, TableRow, TableCell };
