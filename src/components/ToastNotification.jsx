// src/components/ToastNotification.jsx

import React, { useEffect } from "react";
import { 
  FiCheckCircle, 
  FiXCircle, 
  FiAlertTriangle, 
  FiInfo,
  FiX 
} from "react-icons/fi";

const ToastNotification = ({ toast, onClose }) => {
  const { id, type, message, duration = 5000 } = toast;

  // Auto-dismiss toast after duration
  useEffect(() => {
    if (duration > 0) {
      const timer = setTimeout(() => {
        onClose(id);
      }, duration);
      
      return () => clearTimeout(timer);
    }
  }, [id, duration, onClose]);

  // Icon mapping based on toast type
  const getIcon = () => {
    switch (type) {
      case 'success':
        return <FiCheckCircle className="text-green-500" size={20} />;
      case 'error':
        return <FiXCircle className="text-red-500" size={20} />;
      case 'warning':
        return <FiAlertTriangle className="text-yellow-500" size={20} />;
      case 'info':
      default:
        return <FiInfo className="text-blue-500" size={20} />;
    }
  };

  // Style mapping based on toast type
  const getStyles = () => {
    const baseStyles = "bg-white border-l-4 shadow-lg rounded-lg p-4 min-w-80 max-w-md transition-all duration-300 ease-in-out";
    
    switch (type) {
      case 'success':
        return `${baseStyles} border-l-green-500`;
      case 'error':
        return `${baseStyles} border-l-red-500`;
      case 'warning':
        return `${baseStyles} border-l-yellow-500`;
      case 'info':
      default:
        return `${baseStyles} border-l-blue-500`;
    }
  };

  return (
    <div className={getStyles()}>
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0 mt-0.5">
          {getIcon()}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-gray-900 leading-5">
            {message}
          </p>
        </div>
        <button
          onClick={() => onClose(id)}
          className="flex-shrink-0 ml-2 p-1 rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors duration-200"
          aria-label="Close notification"
        >
          <FiX size={16} />
        </button>
      </div>
    </div>
  );
};

export default ToastNotification;