// src/components/fragments/data-grid/index.tsx
import {
  flexRender,
  Table
} from '@tanstack/react-table';
import { useEffect, useRef, useState } from 'react';
import styled from 'styled-components';
import { cn } from '@/lib/utils';
import { Checkbox } from '@/components/elements/checkbox';

interface DataGridProps {
  table: Table<any>;
  freezeColumns?: number;
  onCellEdit?: (rowIndex: number, columnId: string, value: any) => void;
  selectedRows?: number[];
  onRowSelect?: (selectedRows: number[]) => void;
}

const DataGrid = ({ 
  table, 
  freezeColumns = 1,
  onCellEdit,
  selectedRows = [],
  onRowSelect
}: DataGridProps) => {
  const [selectedCell, setSelectedCell] = useState<{ rowIndex: number; columnIndex: number } | null>(null);
  const [editingCell, setEditingCell] = useState<{ rowIndex: number; columnIndex: number } | null>(null);
  const [editValue, setEditValue] = useState<string>('');
  const inputRef = useRef<HTMLInputElement>(null);

  const handleSelectAll = () => {
    if (!onRowSelect) return;
    
    if (selectedRows.length === table.getRowModel().rows.length) {
      onRowSelect([]);
    } else {
      const allRowIds = table.getRowModel().rows.map(row => row.original.id);
      onRowSelect(allRowIds);
    }
  };

  const handleRowSelect = (rowId: number) => {
    if (!onRowSelect) return;
    
    const newSelectedRows = selectedRows.includes(rowId)
      ? selectedRows.filter(id => id !== rowId)
      : [...selectedRows, rowId];
    
    onRowSelect(newSelectedRows);
  };

  const handleCellClick = (rowIndex: number, columnIndex: number) => {
    setSelectedCell({ rowIndex, columnIndex });
  };

  const handleCellDoubleClick = (rowIndex: number, columnIndex: number, value: any) => {
    setEditingCell({ rowIndex, columnIndex });
    setEditValue(String(value));
  };

  const handleEditComplete = (rowIndex: number, columnId: string) => {
    if (onCellEdit) {
      onCellEdit(rowIndex, columnId, editValue);
    }
    setEditingCell(null);
  };

  useEffect(() => {
    if (editingCell && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [editingCell]);

  return (
    <TableContainer>
      <StyledTable className="manrope-font">
        <thead>
          {table.getHeaderGroups().map((headerGroup) => (
            <tr key={headerGroup.id}>
              <StyledTh 
                key="selection"
                $isSticky={true}
                $left="0px"
                $isFirstColumn={true}
                style={{ width: '40px', minWidth: '40px' }}
              >
                <div className="flex items-center justify-center">
                  <Checkbox
                    checked={selectedRows.length === table.getRowModel().rows.length}
                    onCheckedChange={handleSelectAll}
                    aria-label="Select all"
                  />
                </div>
              </StyledTh>
              {headerGroup.headers.map((header, index) => (
                <StyledTh 
                  key={header.id} 
                  $isSticky={index < freezeColumns}
                  $left={index === 0 ? '40px' : `${104 + (index - 1) * 180}px`}
                  $isFirstColumn={index === 0}
                >
                  {flexRender(
                    header.column.columnDef.header,
                    header.getContext(),
                  )}
                </StyledTh>
              ))}
            </tr>
          ))}
        </thead>
        <tbody>
          {table.getRowModel().rows.map((row, rowIndex) => (
            <StyledTr 
              key={row.id}
              className={cn({
                'bg-muted/50': selectedRows.includes(row.original.id)
              })}
            >
              <StyledTd 
                $isSticky={true}
                $left="0px"
                $isFirstColumn={true}
                $isSelected={false}
                style={{ width: '40px', minWidth: '40px' }}
              >
                <div className="flex items-center justify-center">
                  <Checkbox
                    checked={selectedRows.includes(row.original.id)}
                    onCheckedChange={() => handleRowSelect(row.original.id)}
                    aria-label={`Select row ${rowIndex + 1}`}
                  />
                </div>
              </StyledTd>
              {row.getVisibleCells().map((cell, columnIndex) => (
                <StyledTd 
                  key={cell.id} 
                  $isSticky={columnIndex < freezeColumns}
                  $left={columnIndex === 0 ? '40px' : `${104 + (columnIndex - 1) * 180}px`}
                  $isFirstColumn={columnIndex === 0}
                  $isSelected={selectedCell?.rowIndex === rowIndex && selectedCell?.columnIndex === columnIndex}
                  onClick={() => handleCellClick(rowIndex, columnIndex)}
                  onDoubleClick={() => handleCellDoubleClick(rowIndex, columnIndex, cell.getValue())}
                >
                  {editingCell?.rowIndex === rowIndex && editingCell?.columnIndex === columnIndex ? (
                    <StyledInput
                      ref={inputRef}
                      value={editValue}
                      onChange={(e) => setEditValue(e.target.value)}
                      onBlur={() => handleEditComplete(rowIndex, cell.column.id)}
                    />
                  ) : (
                    flexRender(cell.column.columnDef.cell, cell.getContext())
                  )}
                </StyledTd>
              ))}
            </StyledTr>
          ))}
        </tbody>
      </StyledTable>
    </TableContainer>
  );
};

const TableContainer = styled.div`
  font-family: Arial, sans-serif;
  font-size: 13px;
  overflow-x: auto;
  position: relative;
`;

const StyledTable = styled.table`
  border-collapse: collapse;
  border-spacing: 0;
  width: 100%;
  font-size: 13px;
`;

const StyledTh = styled.th<{ $isSticky: boolean; $left: string; $isFirstColumn: boolean }>`
  background-color: #f3f3f3;
  border: 0.5px solid #e0e0e0;
  padding: 0 12px;
  text-align: left;
  font-weight: bold;
  color: #5f6368;
  word-break: keep-all;
  white-space: nowrap;
  font-size: 13px;
  height: 32px;
  min-height: 32px;
  position: ${props => props.$isSticky ? 'sticky' : 'static'};
  left: ${props => props.$isSticky ? props.$left : 'auto'};
  z-index: ${props => props.$isSticky ? 1 : 'auto'};
  width: ${props => props.$isFirstColumn ? '64px' : '180px'};
  min-width: ${props => props.$isFirstColumn ? '64px' : '180px'};
`;

const StyledTd = styled.td<{ 
  $isSticky: boolean; 
  $left: string; 
  $isFirstColumn: boolean;
  $isSelected: boolean;
}>`
  border: 0.5px solid #e0e0e0;
  padding: 0 12px;
  text-align: left;
  word-break: keep-all;
  white-space: nowrap;
  font-size: 13px;
  height: 32px;
  min-height: 32px;
  position: ${props => props.$isSticky ? 'sticky' : 'static'};
  left: ${props => props.$isSticky ? props.$left : 'auto'};
  z-index: ${props => props.$isSticky ? 1 : 'auto'};
  background-color: ${props => props.$isSelected ? '#e6f2ff' : (props.$isSticky ? '#ffffff' : 'transparent')};
  cursor: pointer;
  user-select: none;
  width: ${props => props.$isFirstColumn ? '64px' : '180px'};
  min-width: ${props => props.$isFirstColumn ? '64px' : '180px'};
`;

const StyledTr = styled.tr`
  &:hover {
    background-color: #f5f5f5;
  }
  &:last-child td {
    border-bottom: none;
  }
`;

const StyledInput = styled.input`
  width: 100%;
  height: 100%;
  border: none;
  background: transparent;
  font-size: inherit;
  font-family: inherit;
  padding: 0;
  margin: 0;
  outline: none;
`;

export default DataGrid;