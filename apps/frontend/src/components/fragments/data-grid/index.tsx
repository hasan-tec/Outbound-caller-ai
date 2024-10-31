import {
  flexRender,
  Table
} from '@tanstack/react-table';
import { useEffect, useRef, useState } from 'react';
import styled from 'styled-components';

interface DataGridProps {
  table: Table<any>;
  freezeColumns?: number;
  onCellEdit?: (rowIndex: number, columnId: string, value: any) => void;
}

const DataGrid = ({ 
  table, 
  freezeColumns = 1,
  onCellEdit
}: DataGridProps) => {
  const [selectedCell, setSelectedCell] = useState<{ rowIndex: number; columnIndex: number } | null>(null);
  const [editingCell, setEditingCell] = useState<{ rowIndex: number; columnIndex: number } | null>(null);
  const [editValue, setEditValue] = useState<string>('');
  const inputRef = useRef<HTMLInputElement>(null);

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

  const moveToNextCell = (rowIndex: number, columnIndex: number, direction: 'right' | 'down' | 'up') => {
    // Save the current cell value before moving
    if (editingCell) {
      const currentColumnId = table.getAllColumns()[editingCell.columnIndex].id;
      handleEditComplete(editingCell.rowIndex, currentColumnId);
    }

    const rowsCount = table.getRowModel().rows.length;
    const columnsCount = table.getAllColumns().length;

    let newRowIndex = rowIndex;
    let newColumnIndex = columnIndex;

    switch (direction) {
      case 'right':
        newColumnIndex = (columnIndex + 1) % columnsCount;
        if (newColumnIndex === 0) newRowIndex = (rowIndex + 1) % rowsCount;
        break;
      case 'down':
        newRowIndex = (rowIndex + 1) % rowsCount;
        break;
      case 'up':
        newRowIndex = (rowIndex - 1 + rowsCount) % rowsCount;
        break;
    }

    setSelectedCell({ rowIndex: newRowIndex, columnIndex: newColumnIndex });
    setEditingCell({ rowIndex: newRowIndex, columnIndex: newColumnIndex });
    const newCellValue = table.getRowModel().rows[newRowIndex].getAllCells()[newColumnIndex].getValue();
    setEditValue(String(newCellValue));
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, rowIndex: number, columnIndex: number) => {
    switch (e.key) {
      case 'Enter':
        if (e.shiftKey) {
          moveToNextCell(rowIndex, columnIndex, 'up');
        } else {
          moveToNextCell(rowIndex, columnIndex, 'down');
        }
        e.preventDefault();
        break;
      case 'Tab':
        moveToNextCell(rowIndex, columnIndex, 'right');
        e.preventDefault();
        break;
      case 'Escape':
        setEditingCell(null);
        break;
    }
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
              {headerGroup.headers.map((header, index) => (
                <StyledTh 
                  key={header.id} 
                  $isSticky={index < freezeColumns}
                  $left={index === 0 ? '0px' : `${64 + (index - 1) * 180}px`}
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
            <StyledTr key={row.id}>
              {row.getVisibleCells().map((cell, columnIndex) => (
                <StyledTd 
                  key={cell.id} 
                  $isSticky={columnIndex < freezeColumns}
                  $left={columnIndex === 0 ? '0px' : `${64 + (columnIndex - 1) * 180}px`}
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
                      onKeyDown={(e) => handleKeyDown(e, rowIndex, columnIndex)}
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
