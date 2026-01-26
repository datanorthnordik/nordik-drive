export interface User {
  id: number;
  firstname: string;
  lastname: string;
  email: string;
  phonenumber: string;
  role: string;
}

export interface AccessModalProps {
  open: boolean;
  onClose: () => void;
  file: { fileId: string; fileName: string };
}
