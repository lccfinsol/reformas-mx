
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { Bell } from 'lucide-react';
import { Button } from '@/components/ui/button';

const RealtimeNotificationToast = ({ socket }) => {
  const navigate = useNavigate();
  const [soundEnabled, setSoundEnabled] = useState(() => {
    const saved = localStorage.getItem('notification-sound-enabled');
    return saved !== null ? JSON.parse(saved) : true;
  });

  useEffect(() => {
    if (!socket) return;

    const handleNewReforma = (reforma) => {
      if (soundEnabled) {
        try {
          const audio = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBzOH1fPTgjMGHm7A7+OZWA0QVK3n77BdGAg+me7+xnMoCDaM0/LPfC0GJHnJ8NmOPgsXYrfq7aVSEgxKouHyvGohBzOH1fPUgjQGHm+/7+KYVw0PVK3n77BdGAg+me7+xnMoCDaM0/LPfC0GJHnJ8NmOPgsXYrfq7aVSEgxKouHyvGohBzOH1fPUgjQGHm+/7+KYVw0PVK3n77BdGAg+me7+xnMoCDaM0/LPfC0GJHnJ8NmOPgsXYrfq7aVSEgxKouHyvGohBzOH1fPUgjQGHm+/7+KYVw0PVK3n77BdGAg+me7+xnMoCDaM0/LPfC0GJHnJ8NmOPgsXYrfq7aVSEgxKouHyvGohBzOH1fPUgjQGHm+/7+KYVw0PVK3n77BdGAg+me7+xnMoCDaM0/LPfC0GJHnJ8NmOPgsXYrfq7aVSEgxKouHyvGohBzOH1fPUgjQGHm+/7+KYVw0PVK3n77BdGAg+me7+xnMoCDaM0/LPfC0GJHnJ8NmOPgsXYrfq7aVSEgxKouHyvGohBzOH1fPUgjQGHm+/7+KYVw0PVK3n77BdGAg+me7+xnMoCDaM0/LPfC0GJHnJ8NmOPgsXYrfq7aVSEgxKouHyvGohBzOH1fPUgjQGHm+/7+KYVw0PVK3n77BdGAg+me7+xnMoCDaM0/LPfC0GJHnJ8NmOPgsXYrfq7aVSEgxKouHyvGohBzOH1fPUgjQGHm+/7+KYVw0PVK3n77BdGAg+me7+xnMoCDaM0/LPfC0GJHnJ8NmOPgsXYrfq7aVSEgxKouHyvGohBzOH1fPUgjQGHm+/7+KYVw0PVK3n77BdGAg+');
          audio.play().catch(e => console.error('Error playing notification sound:', e));
        } catch (error) {
          console.error('Error creating notification sound:', error);
        }
      }

      toast(
        <div className="flex items-start gap-3">
          <div className="bg-primary/10 rounded-lg p-2">
            <Bell className="h-5 w-5 text-primary" />
          </div>
          <div className="flex-grow">
            <h4 className="font-semibold mb-1">Nueva reforma publicada</h4>
            <p className="text-sm text-muted-foreground mb-2">{reforma.titulo}</p>
            <p className="text-xs text-muted-foreground">
              {reforma.materia_legal} • {reforma.nivel}
            </p>
          </div>
        </div>,
        {
          duration: 5000,
          action: {
            label: 'Ver',
            onClick: () => navigate(`/reforma/${reforma.id}`)
          }
        }
      );
    };

    socket.on('new-reforma', handleNewReforma);

    return () => {
      socket.off('new-reforma', handleNewReforma);
    };
  }, [socket, soundEnabled, navigate]);

  return null;
};

export default RealtimeNotificationToast;
