import React, { useState, useEffect } from 'react';
import { ref, onValue, remove } from 'firebase/database';
import { db } from '../firebaseConfig';

interface Notification {
  id: string;
  message: string;
  timestamp: number;
}

const Notifications: React.FC<{ userId: string }> = ({ userId }) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);

  useEffect(() => {
    const notificationsRef = ref(db, `notifications/${userId}`);
    const unsubscribe = onValue(notificationsRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const notificationList = Object.entries(data).map(([id, value]) => ({
          id,
          ...(value as Omit<Notification, 'id'>),
        }));
        setNotifications(notificationList.sort((a, b) => b.timestamp - a.timestamp));
      } else {
        setNotifications([]);
      }
    });

    return () => unsubscribe();
  }, [userId]);

  const handleDismiss = (id: string) => {
    const notificationRef = ref(db, `notifications/${userId}/${id}`);
    remove(notificationRef);
  };

  return (
    <div className="fixed bottom-4 right-4 max-w-sm">
      {notifications.map((notification) => (
        <div
          key={notification.id}
          className="bg-white shadow-lg rounded-lg p-4 mb-2 flex justify-between items-center"
        >
          <p>{notification.message}</p>
          <button
            onClick={() => handleDismiss(notification.id)}
            className="ml-2 text-gray-500 hover:text-gray-700"
          >
            Dismiss
          </button>
        </div>
      ))}
    </div>
  );
};

export default Notifications;