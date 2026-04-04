import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

interface Notification {
  id: string;
  type: string;
  message: string;
  link: string;
  is_read: boolean;
  created_at: string;
  actor: {
    id: string;
    full_name: string;
    avatar_url: string;
  };
}

export default function NotificationBell() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
         setUserId(session.user.id);
      }
    });

    const { data: authListener } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (session?.user) setUserId(session.user.id);
        else setUserId(null);
      }
    );

    return () => authListener.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!userId) return;

    fetchNotifications();

    // Subscribe to new notifications
    const channel = supabase
      .channel('public:notifications')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'notifications', filter: `user_id=eq.${userId}` }, payload => {
         fetchNotifications();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId]);

  const fetchNotifications = async () => {
    try {
      const { data, error } = await supabase
        .from('notifications')
        .select(`
          id, type, message, link, is_read, created_at,
          actor:actor_id (id, full_name, avatar_url)
        `)
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) throw error;
      
      // Mapped correctly when joined
      const mapped = data.map((d: any) => ({
         ...d,
         actor: d.actor || { full_name: 'Alguien', avatar_url: '' }
      }));
      setNotifications(mapped);
      setUnreadCount(mapped.filter(n => !n.is_read).length);
    } catch (e) {
      console.error("Error fetching notifications", e);
    }
  };

  const markAllAsRead = async () => {
    if (!userId || unreadCount === 0) return;
    try {
       await supabase.from('notifications').update({ is_read: true }).eq('user_id', userId).eq('is_read', false);
       setUnreadCount(0);
       setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
    } catch (e) {
       console.error("Error marking read", e);
    }
  };

  const toggleDropdown = () => {
    if (!isOpen) {
       markAllAsRead();
    }
    setIsOpen(!isOpen);
  };

  if (!userId) return null;

  return (
    <div className="relative">
      <button 
        onClick={toggleDropdown}
        className="p-2 text-white hover:text-uapa-orange transition-colors relative focus:outline-none"
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"></path>
        </svg>
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 flex h-4 w-4">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-4 w-4 bg-red-500 border-2 border-uapa-blue text-[8px] font-bold text-white items-center justify-center">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-xl border border-gray-100 overflow-hidden z-50">
          <div className="px-4 py-3 border-b border-gray-50 flex justify-between items-center bg-gray-50/50">
            <h3 className="font-bold text-gray-900">Notificaciones</h3>
            <button onClick={() => setIsOpen(false)} className="text-gray-400 hover:text-gray-600">
               <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
            </button>
          </div>
          <div className="max-h-96 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="px-4 py-6 text-center text-sm text-gray-500">
                No tienes notificaciones nuevas.
              </div>
            ) : (
              notifications.map(notif => (
                <a 
                  key={notif.id} 
                  href={notif.link || '#'} 
                  className={`block px-4 py-3 hover:bg-blue-50 transition-colors border-b border-gray-50 ${!notif.is_read ? 'bg-blue-50/50' : ''}`}
                >
                  <div className="flex items-start">
                    <img 
                       src={notif.actor?.avatar_url || 'https://upload.wikimedia.org/wikipedia/commons/7/7c/Profile_avatar_placeholder_large.png'} 
                       alt="Avatar" 
                       className="w-10 h-10 rounded-full object-cover border border-gray-200 mt-1 flex-shrink-0"
                    />
                    <div className="ml-3">
                      <p className="text-sm text-gray-800">
                        <span className="font-bold text-gray-900">{notif.actor?.full_name}</span> {notif.message}
                      </p>
                      <p className="text-xs text-gray-400 mt-1">
                        {new Date(notif.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                </a>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
