declare module 'react-spreadsheet-grid' {
  export interface Column {
    id: string
    title: string
    value: (row: any) => any
  }

  export interface GridProps {
    rows: any[]
    columns: Column[]
    getRowKey: (row: any) => string | number
    isColumnsResizable?: boolean
    height?: number
  }

  export const Grid: React.FC<GridProps>
} 