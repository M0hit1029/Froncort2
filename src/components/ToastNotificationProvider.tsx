'use client';

import { useEffect, useState } from 'react';
import { useNotificationStore, Notification } from '@/store/notificationStore';
import { useUserStore } from '@/store/userStore';
import { X, Bell, CheckCircle, XCircle, Info } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface ToastNotificationProps {
  id: string;
  message: string;
  type: Notification['type'];
  onClose: () => void;
}

function ToastNotification({ message, type, onClose }: ToastNotificationProps) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, 5000); // Auto-dismiss after 5 seconds

    return () => clearTimeout(timer);
  }, [onClose]);

  // Determine icon and colors based on type
  const getToastStyle = () => {
    switch (type) {
      case 'success':
        return {
          icon: <CheckCircle className="w-5 h-5 text-[#00ff00]" />,
          borderColor: 'border-[#00ff00]',
          textColor: 'text-[#00ff00]',
        };
      case 'error':
        return {
          icon: <XCircle className="w-5 h-5 text-[#ff0000]" />,
          borderColor: 'border-[#ff0000]',
          textColor: 'text-[#ff0000]',
        };
      case 'info':
        return {
          icon: <Info className="w-5 h-5 text-[#00ffff]" />,
          borderColor: 'border-[#00ffff]',
          textColor: 'text-[#00ffff]',
        };
      default:
        return {
          icon: <Bell className="w-5 h-5 text-[#00ff00]" />,
          borderColor: 'border-[#00ff00]',
          textColor: 'text-[#00ff00]',
        };
    }
  };

  const style = getToastStyle();

  return (
    <motion.div
      initial={{ opacity: 0, y: 50, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 20, scale: 0.95 }}
      className={`bg-black border ${style.borderColor} rounded-lg shadow-lg p-4 mb-2 min-w-[300px] max-w-[400px]`}
    >
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0 mt-0.5">
          {style.icon}
        </div>
        <div className="flex-1">
          <p className={`text-sm ${style.textColor}`}>{message}</p>
        </div>
        <button
          onClick={onClose}
          className={`flex-shrink-0 ${style.textColor}/70 hover:${style.textColor} transition-colors`}
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </motion.div>
  );
}

export function ToastNotificationProvider() {
  const { currentUser } = useUserStore();
  const { getUnshownNotifications, markAsShown } = useNotificationStore();
  const [visibleNotifications, setVisibleNotifications] = useState<Array<{ id: string; message: string; type: Notification['type'] }>>([]);

  useEffect(() => {
    // Check for unshown notifications every second
    const interval = setInterval(() => {
      const unshown = getUnshownNotifications(currentUser.id);
      
      if (unshown.length > 0) {
        // Show up to 3 notifications at a time
        const toShow = unshown.slice(0, 3);
        
        setVisibleNotifications((prev) => [
          ...prev,
          ...toShow.map((notif) => ({
            id: notif.id,
            message: notif.message,
            type: notif.type,
          })),
        ]);

        // Mark them as shown
        toShow.forEach((notif) => markAsShown(notif.id));
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [currentUser.id, getUnshownNotifications, markAsShown]);

  const handleClose = (id: string) => {
    setVisibleNotifications((prev) => prev.filter((notif) => notif.id !== id));
  };

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <AnimatePresence mode="popLayout">
        {visibleNotifications.map((notif) => (
          <ToastNotification
            key={notif.id}
            id={notif.id}
            message={notif.message}
            type={notif.type}
            onClose={() => handleClose(notif.id)}
          />
        ))}
      </AnimatePresence>
    </div>
  );
}
