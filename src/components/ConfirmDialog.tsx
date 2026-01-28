import { AlertTriangle, CheckCircle, Info, XCircle } from 'lucide-react';

export interface ConfirmDialogProps {
  isOpen: boolean;
  title: string;
  message: string | React.ReactNode;
  confirmText?: string;
  cancelText?: string;
  type?: 'info' | 'warning' | 'danger' | 'success';
  onConfirm: () => void;
  onCancel: () => void;
  showIcon?: boolean;
}

export default function ConfirmDialog({
  isOpen,
  title,
  message,
  confirmText = '确认',
  cancelText = '取消',
  type = 'warning',
  onConfirm,
  onCancel,
  showIcon = true,
}: ConfirmDialogProps) {
  if (!isOpen) return null;

  const icons = {
    info: <Info className="w-6 h-6 text-blue-600" />,
    warning: <AlertTriangle className="w-6 h-6 text-yellow-600" />,
    danger: <XCircle className="w-6 h-6 text-red-600" />,
    success: <CheckCircle className="w-6 h-6 text-green-600" />,
  };

  const iconBackgrounds = {
    info: 'bg-blue-100',
    warning: 'bg-yellow-100',
    danger: 'bg-red-100',
    success: 'bg-green-100',
  };

  const confirmButtonStyles = {
    info: 'bg-blue-600 hover:bg-blue-700',
    warning: 'bg-yellow-600 hover:bg-yellow-700',
    danger: 'bg-red-600 hover:bg-red-700',
    success: 'bg-green-600 hover:bg-green-700',
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden animate-in fade-in zoom-in duration-200">
        {showIcon && (
          <div className={`${iconBackgrounds[type]} p-6 flex justify-center`}>
            <div className="w-16 h-16 rounded-full bg-white flex items-center justify-center shadow-lg">
              {icons[type]}
            </div>
          </div>
        )}

        <div className="p-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-3 text-center">
            {title}
          </h2>

          <div className="text-gray-600 text-center mb-6">
            {typeof message === 'string' ? (
              <p className="whitespace-pre-line leading-relaxed">{message}</p>
            ) : (
              message
            )}
          </div>

          <div className="flex gap-3">
            <button
              onClick={onCancel}
              className="flex-1 px-4 py-3 border-2 border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors font-medium"
            >
              {cancelText}
            </button>
            <button
              onClick={onConfirm}
              className={`flex-1 px-4 py-3 text-white rounded-lg transition-colors font-medium ${confirmButtonStyles[type]}`}
            >
              {confirmText}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
