
import React, { useEffect } from 'react';
import { toast } from 'sonner';
import { BellRing } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const RealtimeNotificationToast = ({ socket }) => {
  const navigate = useNavigate();

  useEffect(() => {
    if (!socket) return;

    const handleNewNotification = (data) => {
      toast('Nueva Reforma', {
        description: data.message || 'Se ha publicado una nueva reforma que coincide con tus suscripciones.',
        icon: <BellRing className="text-primary" size={18} />,
        action: {
          label: 'Ver',
          onClick: () => {
            if (data.reformaId) {
              navigate(`/reforma/${data.reformaId}`);
            } else {
              navigate('/notificaciones');
            }
          }
        },
        duration: 8000,
      });
    };

    socket.on('new-notification', handleNewNotification);

    return () => {
      socket.off('new-notification', handleNewNotification);
    };
  }, [socket, navigate]);

  return null; // Logic-only component
};

export default RealtimeNotificationToast;
