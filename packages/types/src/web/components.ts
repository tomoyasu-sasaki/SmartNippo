// ========================================
// Web-specific component types
// ========================================

// Web-specific form props
export interface WebFormProps {
  className?: string;
  onSubmit?: (e: React.FormEvent) => void;
}

// Search and filter props for web
export interface WebSearchProps {
  placeholder?: string;
  className?: string;
  onSearch: (query: string) => void;
}

// Web-specific table props
export interface WebTableProps<T> {
  data: T[];
  columns: Array<{
    key: keyof T | string;
    header: string;
    cell?: (value: T) => React.ReactNode;
    sortable?: boolean;
  }>;
  className?: string;
  onRowClick?: (row: T) => void;
}

// Web-specific modal props
export interface WebModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  className?: string;
}

// File upload config for web
export interface FileUploadConfig {
  maxSize: number;
  acceptedTypes: string[];
  multiple?: boolean;
}

// Upload response for web
export interface UploadResponse {
  success: boolean;
  url?: string;
  error?: string;
}
