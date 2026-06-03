import { Modal } from "../../../components/ui/modal";
import Button from "../../../components/ui/button/Button";

export type ModalMode = "view" | "create" | "edit" | "delete";

interface CrudModalProps {
  isOpen: boolean;
  onClose: () => void;
  mode: ModalMode;
  title: string;
  description?: string;
  loading?: boolean;
  onSave?: () => void;
  onUpdate?: () => void;
  onDelete?: () => void;
  deleteLabel?: string;
  children: React.ReactNode;
}

export default function CrudModal({
  isOpen,
  onClose,
  mode,
  title,
  description,
  loading = false,
  onSave,
  onUpdate,
  onDelete,
  deleteLabel = "item ini",
  children,
}: CrudModalProps) {
  const renderActions = () => {
    if (mode === "view") {
      return (
        <Button size="sm" variant="outline" type="button" onClick={onClose}>Tutup</Button>
      );
    }
    if (mode === "delete") {
      return (
        <>
          <Button size="sm" variant="outline" type="button" onClick={onClose} disabled={loading}>Batal</Button>
          <Button size="sm" type="button" onClick={onDelete} disabled={loading}
            className="bg-red-600 hover:bg-red-700 text-white">
            {loading ? <Spinner /> : "Hapus"}
          </Button>
        </>
      );
    }
    return (
      <>
        <Button size="sm" variant="outline" type="button" onClick={onClose} disabled={loading}>Batal</Button>
        <Button size="sm" type="button" onClick={mode === "create" ? onSave : onUpdate}
          disabled={loading} className="bg-brand-500 hover:bg-brand-600 text-white">
          {loading ? <Spinner /> : mode === "create" ? "Simpan" : "Perbarui"}
        </Button>
      </>
    );
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} className="max-w-[500px] m-4">
      <div className="no-scrollbar relative w-full max-w-[500px] overflow-y-auto rounded-3xl bg-white p-4 dark:bg-gray-900 lg:p-10">
        <div className="px-2 pr-14 mb-6">
          <h4 className="text-2xl font-semibold text-gray-800 dark:text-white">{title}</h4>
          {description && (
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{description}</p>
          )}
        </div>

        {mode === "delete" ? (
          <div className="px-2">
            <div className="text-center">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 dark:bg-red-900/20 mb-4">
                <svg className="h-6 w-6 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Apakah Anda yakin ingin menghapus <strong>{deleteLabel}</strong>?
                Data yang dihapus tidak dapat dikembalikan.
              </p>
            </div>
          </div>
        ) : (
          <div className="custom-scrollbar max-h-[400px] overflow-y-auto px-2 pb-3 space-y-5">
            {children}
          </div>
        )}

        <div className="flex items-center gap-3 px-2 mt-6 lg:justify-end">
          {renderActions()}
        </div>
      </div>
    </Modal>
  );
}

function Spinner() {
  return <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />;
}
