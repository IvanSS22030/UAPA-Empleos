import { useState, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabase';

interface Message {
  id: string;
  sender_role: 'recruiter' | 'talent';
  content: string;
  created_at: string;
}

interface ApplicationStatusProps {
  applicationId: string;
  initialStatus: string;
}

export default function InteractiveAppStatus({ applicationId, initialStatus }: ApplicationStatusProps) {
  const [status, setStatus] = useState(initialStatus);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // 1. Fetch initial messages
    const fetchMessages = async () => {
      const { data } = await supabase
        .from('messages')
        .select('*')
        .eq('application_id', applicationId)
        .order('created_at', { ascending: true });
      if (data) setMessages(data);
    };
    fetchMessages();

    // 2. Subscribe to Realtime Updates for Application Status
    const statusSubscription = supabase
      .channel(`app-status-${applicationId}`)
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'applications', filter: `id=eq.${applicationId}` },
        (payload) => {
          setStatus(payload.new.status);
        }
      )
      .subscribe();

    // 3. Subscribe to Realtime Messages
    const messageSubscription = supabase
      .channel(`app-messages-${applicationId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages', filter: `application_id=eq.${applicationId}` },
        (payload) => {
          setMessages((prev) => [...prev, payload.new as Message]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(statusSubscription);
      supabase.removeChannel(messageSubscription);
    };
  }, [applicationId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    setIsSending(true);
    const { error } = await supabase.from('messages').insert([
      {
        application_id: applicationId,
        sender_role: 'talent', // Assume UI is for the talent
        content: newMessage.trim(),
      },
    ]);

    if (!error) {
      setNewMessage('');
    } else {
      console.error("Failed to send message", error);
    }
    setIsSending(false);
  };

  const statusColors: Record<string, string> = {
    pending: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    reviewed: 'bg-blue-100 text-blue-800 border-blue-200',
    accepted: 'bg-green-100 text-green-800 border-green-200',
    rejected: 'bg-red-100 text-red-800 border-red-200',
  };

  return (
    <div className="max-w-2xl mx-auto mt-8 bg-white rounded-2xl shadow-lg overflow-hidden border border-gray-100 flex flex-col h-[600px]">
      {/* Header / Status Banner */}
      <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Application Updates</h2>
          <p className="text-sm text-gray-500">Live feed from the recruiter</p>
        </div>
        <div className={`px-4 py-2 rounded-full border text-sm font-bold uppercase tracking-wider ${statusColors[status] || statusColors.pending}`}>
          {status}
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 p-6 overflow-y-auto bg-gray-50/50">
        {messages.length === 0 ? (
          <div className="h-full flex items-center justify-center text-gray-400 text-center">
            <p>No messages yet.<br/>When the recruiter opens the chat, messages will appear here.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {messages.map((msg) => {
              const isTalent = msg.sender_role === 'talent';
              return (
                <div key={msg.id} className={`flex ${isTalent ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[80%] rounded-2xl px-5 py-3 ${isTalent ? 'bg-indigo-600 text-white rounded-br-none' : 'bg-white border border-gray-200 text-gray-800 rounded-bl-none shadow-sm'}`}>
                    <div className="text-xs opacity-75 mb-1 font-semibold uppercase tracking-wider">
                      {isTalent ? 'You' : 'Recruiter'}
                    </div>
                    <div>{msg.content}</div>
                  </div>
                </div>
              );
            })}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Message Input (Only allowed if not rejected or explicitly allowed by logic, keeping it open for MVP) */}
      <div className="p-4 border-t border-gray-100 bg-white">
        <form onSubmit={handleSendMessage} className="flex gap-2">
          <input
            type="text"
            value={newMessage}
            disabled={status === 'rejected'}
            onChange={(e) => setNewMessage(e.target.value)}
            className="flex-1 px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition disabled:bg-gray-100 disabled:cursor-not-allowed"
            placeholder={status === 'rejected' ? "Chat closed." : "Type a message to the recruiter..."}
          />
          <button
            type="submit"
            disabled={!newMessage.trim() || isSending || status === 'rejected'}
            className="px-6 py-3 bg-indigo-600 text-white font-semibold rounded-xl hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
          >
            {isSending ? 'Sending...' : 'Send'}
          </button>
        </form>
      </div>
    </div>
  );
}
