import React, { useEffect, useState } from 'react';

interface NotificationToastProps {
  id: string;
  type: 'task_assigned' | 'task_completed' | 'task_updated';
  title: string;
  message: string;
  senderName?: string;
  onClose: (id: string) => void;
}

const NotificationToast: React.FC<NotificationToastProps> = ({
  id,
  type,
  title,
  message,
  senderName,
  onClose
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [isExiting, setIsExiting] = useState(false);

  console.log('🍞 NotificationToast rendered:', id, title, 'isVisible:', isVisible);

  useEffect(() => {
    console.log('🍞 NotificationToast mounted:', id);
    // Slide in animation
    setTimeout(() => {
      console.log('🍞 Setting isVisible to true for:', id);
      setIsVisible(true);
    }, 10);

    // Auto-dismiss after 5 seconds
    const timer = setTimeout(() => {
      handleClose();
    }, 5000);

    return () => clearTimeout(timer);
  }, []);

  const handleClose = () => {
    setIsExiting(true);
    setTimeout(() => {
      onClose(id);
    }, 300);
  };

  const getIcon = () => {
    switch (type) {
      case 'task_assigned':
        return '📝';
      case 'task_completed':
        return '✅';
      case 'task_updated':
        return '🔄';
      default:
        return '🔔';
    }
  };

  const getColors = () => {
    switch (type) {
      case 'task_assigned':
        return 'from-blue-500 to-blue-600';
      case 'task_completed':
        return 'from-green-500 to-green-600';
      case 'task_updated':
        return 'from-purple-500 to-purple-600';
      default:
        return 'from-indigo-500 to-indigo-600';
    }
  };

  return (
    <div
      className={`transition-all duration-300 transform ${
        isVisible && !isExiting ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'
      }`}
      style={{ width: '380px' }}
    >
      <div className="bg-white rounded-xl shadow-2xl border border-gray-200 overflow-hidden">
        {/* Colored Header Bar */}
        <div className={`h-1 bg-gradient-to-r ${getColors()}`} />
        
        {/* Content */}
        <div className="p-4">
          <div className="flex gap-3">
            {/* Icon */}
            <div className="text-3xl flex-shrink-0">
              {getIcon()}
            </div>
            
            {/* Text Content */}
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2 mb-1">
                <h4 className="font-bold text-sm text-gray-900">
                  {title}
                </h4>
                <button
                  onClick={handleClose}
                  className="text-gray-400 hover:text-gray-600 text-xl leading-none flex-shrink-0"
                >
                  ×
                </button>
              </div>
              <p className="text-sm text-gray-700 mb-2 line-clamp-2">
                {message}
              </p>
              {senderName && (
                <p className="text-xs text-gray-500">
                  from {senderName}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="h-1 bg-gray-100">
          <div
            className={`h-full bg-gradient-to-r ${getColors()} transition-all duration-[5000ms] ease-linear`}
            style={{ width: isVisible ? '0%' : '100%' }}
          />
        </div>
      </div>
    </div>
  );
};

export default NotificationToast;
