import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

interface ConnectButtonProps {
  targetUserId: string;
}

type ConnectionStatus = 'none' | 'pending_sent' | 'pending_received' | 'accepted' | 'loading';

export default function ConnectButton({ targetUserId }: ConnectButtonProps) {
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [status, setStatus] = useState<ConnectionStatus>('loading');
  const [connectionId, setConnectionId] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        setCurrentUserId(session.user.id);
      } else {
        setStatus('none'); // User not logged in, just show nothing or handle differently
      }
    });
  }, []);

  useEffect(() => {
    if (!currentUserId || !targetUserId) return;
    checkConnection();
  }, [currentUserId, targetUserId]);

  const checkConnection = async () => {
    try {
      const { data, error } = await supabase
        .from('connections')
        .select('*')
        .or(`and(sender_id.eq.${currentUserId},receiver_id.eq.${targetUserId}),and(sender_id.eq.${targetUserId},receiver_id.eq.${currentUserId})`)
        .single();
        
      if (error && error.code !== 'PGRST116') throw error; // PGRST116 is no rows found

      if (!data) {
        setStatus('none');
      } else {
        setConnectionId(data.id);
        if (data.status === 'accepted') {
          setStatus('accepted');
        } else if (data.status === 'pending') {
          if (data.sender_id === currentUserId) setStatus('pending_sent');
          else setStatus('pending_received');
        } else {
          setStatus('none');
        }
      }
    } catch (e) {
      console.error("Error checking connection:", e);
      setStatus('none');
    }
  };

  const handleConnect = async () => {
    setStatus('loading');
    try {
      const { data: connData, error: connError } = await supabase
        .from('connections')
        .insert({
          sender_id: currentUserId,
          receiver_id: targetUserId,
          status: 'pending'
        })
        .select()
        .single();

      if (connError) throw connError;
      
      setConnectionId(connData.id);
      setStatus('pending_sent');

      // Send notification
      await supabase.from('notifications').insert({
        user_id: targetUserId,
        actor_id: currentUserId,
        type: 'connection_request',
        message: 'te ha enviado una solicitud de conexión',
        link: `/user/${currentUserId}`
      });

    } catch (e) {
      console.error("Error creating connection:", e);
      setStatus('none');
    }
  };

  const handleAccept = async () => {
    if (!connectionId) return;
    setStatus('loading');
    try {
      const { error } = await supabase
        .from('connections')
        .update({ status: 'accepted', updated_at: new Date().toISOString() })
        .eq('id', connectionId);

      if (error) throw error;
      setStatus('accepted');

      // Send notification back to sender
      await supabase.from('notifications').insert({
        user_id: targetUserId,
        actor_id: currentUserId,
        type: 'connection_accepted',
        message: 'ha aceptado tu solicitud de conexión',
        link: `/user/${currentUserId}`
      });

    } catch (e) {
      console.error("Error accepting connection:", e);
      setStatus('pending_received');
    }
  };

  if (!currentUserId || currentUserId === targetUserId) {
    return null; // Don't show connect button on your own profile
  }

  if (status === 'loading') {
    return (
      <button disabled className="bg-gray-200 text-gray-500 font-bold py-2 px-6 rounded-full shadow-sm flex items-center cursor-not-allowed">
        <svg className="animate-spin h-5 w-5 mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
        Cargando...
      </button>
    );
  }

  if (status === 'accepted') {
    return (
      <button disabled className="bg-white border-2 border-green-500 text-green-600 font-bold py-2 px-6 rounded-full shadow-sm flex items-center cursor-not-allowed">
        <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
        Conectados
      </button>
    );
  }

  if (status === 'pending_sent') {
    return (
      <button disabled className="bg-gray-100 border border-gray-300 text-gray-600 font-bold py-2 px-6 rounded-full flex items-center cursor-not-allowed">
        <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
        Pendiente
      </button>
    );
  }

  if (status === 'pending_received') {
    return (
      <button onClick={handleAccept} className="bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-6 rounded-full shadow-md transition-colors flex items-center focus:outline-none focus:ring-4 focus:ring-green-200">
        <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
        Aceptar Solicitud
      </button>
    );
  }

  // default 'none'
  return (
    <button onClick={handleConnect} className="bg-uapa-blue hover:bg-blue-900 text-white font-bold py-2 px-6 rounded-full shadow-md transition-colors flex items-center focus:outline-none focus:ring-4 focus:ring-blue-200">
      <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z"></path></svg>
      Conectar
    </button>
  );
}
