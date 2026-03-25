import { useState, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { useTranslations, ui } from '../i18n/ui';

interface ChatWidgetProps {
  lang: keyof typeof ui;
}

interface Profile {
  id: string;
  full_name: string;
  avatar_url: string;
}

interface Conversation {
  id: string;
  otherParticipant: Profile;
}

interface Message {
  id: string;
  sender_id: string;
  content: string;
  created_at: string;
}

export default function ChatWidget({ lang }: ChatWidgetProps) {
  const t = useTranslations(lang);
  const [isOpen, setIsOpen] = useState(false);
  const [session, setSession] = useState<any>(null);
  
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConv, setActiveConv] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // 1. Initial Auth Check & Listeners
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) fetchConversations(session.user.id);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session) fetchConversations(session.user.id);
    });

    return () => subscription.unsubscribe();
  }, []);

  // 2. Fetch Conversations
  const fetchConversations = async (userId: string) => {
    setLoading(true);
    // Fetch conversations where user is participant 1 or 2
    const { data: convData, error } = await supabase
      .from('conversations')
      .select('*')
      .or(`participant1_id.eq.${userId},participant2_id.eq.${userId}`);

    if (error || !convData) {
      setLoading(false);
      return;
    }

    // Extract other participant IDs
    const otherParticipantIds = convData.map(c => 
      c.participant1_id === userId ? c.participant2_id : c.participant1_id
    );

    if (otherParticipantIds.length === 0) {
      setConversations([]);
      setLoading(false);
      return;
    }

    // Fetch profiles of other participants
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, full_name, avatar_url')
      .in('id', otherParticipantIds);

    if (profiles) {
      const formattedConvs = convData.map(c => {
        const otherId = c.participant1_id === userId ? c.participant2_id : c.participant1_id;
        const otherProfile = profiles.find(p => p.id === otherId) || { id: otherId, full_name: 'Unknown User', avatar_url: '' };
        return {
          id: c.id,
          otherParticipant: otherProfile
        };
      });
      setConversations(formattedConvs);
    }
    setLoading(false);
  };

  // 3. Fetch Messages for an Active Conversation
  useEffect(() => {
    if (!activeConv) return;
    
    const fetchMessages = async () => {
      const { data, error } = await supabase
        .from('chat_messages')
        .select('*')
        .eq('conversation_id', activeConv.id)
        .order('created_at', { ascending: true });

      if (data) setMessages(data);
    };

    fetchMessages();

    // Setup Realtime Subscription
    const channel = supabase.channel(`realtime:chat_messages:${activeConv.id}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'chat_messages', filter: `conversation_id=eq.${activeConv.id}` },
        (payload) => {
          setMessages(prev => [...prev, payload.new as Message]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [activeConv]);

  // Scroll to bottom on new message
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  // 4. Send Message
  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !session || !activeConv) return;

    const messageContent = newMessage;
    setNewMessage(''); // optimistic clear

    const { error } = await supabase
      .from('chat_messages')
      .insert({
        conversation_id: activeConv.id,
        sender_id: session.user.id,
        content: messageContent
      });

    if (error) {
      console.error("Error sending message", error);
    }
  };

  // Not logged in? Don't show the widget
  if (!session) return null;

  return (
    <div className="fixed bottom-0 right-4 sm:right-10 z-50 font-sans flex flex-col items-end">
      
      {/* Widget Body */}
      {isOpen && (
        <div className="w-80 sm:w-96 h-[500px] bg-white rounded-t-xl shadow-2xl border border-gray-200 flex flex-col overflow-hidden mb-0">
          
          {/* Header */}
          <div className="bg-uapa-blue text-white p-3 flex justify-between items-center cursor-pointer" onClick={() => setIsOpen(false)}>
            <div className="flex items-center gap-2">
              {activeConv && (
                <button 
                  onClick={(e) => { e.stopPropagation(); setActiveConv(null); }}
                  className="hover:bg-white/20 p-1 rounded-full transition"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7"></path></svg>
                </button>
              )}
              {activeConv ? (
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-white/20 overflow-hidden flex-shrink-0">
                    {activeConv.otherParticipant.avatar_url ? (
                      <img src={activeConv.otherParticipant.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
                    ) : (
                      <svg className="w-full h-full text-white/50 m-1" fill="currentColor" viewBox="0 0 24 24"><path d="M24 20.993V24H0v-2.996A14.977 14.977 0 0112.004 15c4.904 0 9.26 2.354 11.996 5.993zM16.002 8.999a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
                    )}
                  </div>
                  <span className="font-bold whitespace-nowrap overflow-hidden text-ellipsis max-w-[150px]">{activeConv.otherParticipant.full_name || 'User'}</span>
                </div>
              ) : (
                <span className="font-bold">{t('chat.messaging')}</span>
              )}
            </div>
            <div className="flex items-center gap-2">
               <button className="hover:text-gray-200">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
               </button>
            </div>
          </div>

          {/* Body Content */}
          <div className="flex-1 overflow-y-auto bg-gray-50 p-2">
             {!activeConv ? (
               // Conversations List View
               loading ? (
                <div className="p-4 text-center text-gray-500 shrink-0">{t('chat.loading')}</div>
               ) : conversations.length === 0 ? (
                 <div className="p-8 text-center text-gray-400 flex flex-col items-center">
                   <svg className="w-12 h-12 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"></path></svg>
                   {t('chat.no_conversations')}
                 </div>
               ) : (
                 <div className="flex flex-col">
                   {conversations.map(conv => (
                     <button 
                       key={conv.id}
                       onClick={() => setActiveConv(conv)}
                       className="flex items-center gap-3 p-3 hover:bg-white transition bg-transparent border-b border-gray-100 last:border-0 text-left"
                     >
                       <div className="w-12 h-12 rounded-full bg-gray-200 overflow-hidden flex-shrink-0">
                          {conv.otherParticipant.avatar_url ? (
                            <img src={conv.otherParticipant.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
                          ) : (
                            <svg className="w-full h-full text-gray-400 m-2" fill="currentColor" viewBox="0 0 24 24"><path d="M24 20.993V24H0v-2.996A14.977 14.977 0 0112.004 15c4.904 0 9.26 2.354 11.996 5.993zM16.002 8.999a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
                          )}
                       </div>
                       <div className="overflow-hidden">
                         <h4 className="font-bold text-gray-900 truncate">{conv.otherParticipant.full_name || 'User'}</h4>
                         <p className="text-sm text-gray-500 truncate">Ver conversación...</p>
                       </div>
                     </button>
                   ))}
                 </div>
               )
             ) : (
               // Active Chat View
               <div className="flex flex-col min-h-full justify-end">
                 <div className="flex flex-col gap-3 p-2">
                   {messages.map(msg => {
                     const isMine = msg.sender_id === session.user.id;
                     return (
                       <div key={msg.id} className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
                         <div className={`max-w-[75%] px-4 py-2 rounded-2xl text-sm ${
                           isMine ? 'bg-uapa-blue text-white rounded-br-sm' : 'bg-white border border-gray-200 text-gray-800 rounded-bl-sm shadow-sm'
                         }`}>
                           {msg.content}
                         </div>
                       </div>
                     );
                   })}
                   <div ref={messagesEndRef} />
                 </div>
               </div>
             )}
          </div>

          {/* Footer (Input) */}
          {activeConv && (
            <div className="p-3 bg-white border-t border-gray-200">
              <form onSubmit={sendMessage} className="flex gap-2">
                <input 
                  type="text" 
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder={t('chat.placeholder')}
                  className="flex-1 bg-gray-100 border-transparent focus:bg-white focus:border-uapa-orange focus:ring-2 focus:ring-uapa-orange/20 rounded-full px-4 py-2 text-sm outline-none transition"
                />
                <button 
                  type="submit"
                  disabled={!newMessage.trim()}
                  className="p-2 bg-uapa-orange text-white rounded-full hover:bg-orange-600 transition disabled:opacity-50 flex items-center justify-center flex-shrink-0"
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z"></path></svg>
                </button>
              </form>
            </div>
          )}
        </div>
      )}

      {/* Widget Toggle Button (Always visible when closed, or acts as header when open depending on design. Here we separate it) */}
      {!isOpen && (
        <button 
          onClick={() => setIsOpen(true)}
          className="bg-uapa-blue text-white px-6 py-3 rounded-t-xl shadow-2xl hover:bg-blue-900 transition flex items-center gap-2 font-bold mb-0 border border-transparent shadow-[0_-4px_10px_rgba(0,0,0,0.1)]"
        >
          <div className="relative">
            <img src="/avatar-placeholder.png" alt="" className="w-8 h-8 rounded-full bg-white/20 hidden" />
            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C6.477 2 2 6.136 2 11.239c0 2.946 1.488 5.568 3.824 7.29A10.824 10.824 0 014.28 21.6a.498.498 0 00-.096.535A.499.499 0 004.62 22.4a11.166 11.166 0 005.656-1.57h1.724C17.523 20.83 22 16.694 22 11.615 22 6.537 17.523 2 12 2zm0 17.13H10.59a.5.5 0 00-.256.071A9.169 9.169 0 016.27 20.4a8.847 8.847 0 001.127-2.316.502.502 0 00-.083-.497C5.353 16.14 4 13.882 4 11.615 4 6.942 7.589 3.5 12 3.5s8 3.442 8 8.115c0 4.673-3.589 8.115-8 8.115z"/></svg>
            {/* Notification Badge Example */}
            {conversations.length > 0 && (
               <span className="absolute -top-1 -right-1 flex h-3 w-3">
                 <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-uapa-orange opacity-75"></span>
                 <span className="relative inline-flex rounded-full h-3 w-3 bg-uapa-orange"></span>
               </span>
            )}
          </div>
          {t('chat.messaging')}
          <span className="ml-2 w-5 h-5 bg-white text-uapa-blue flex items-center justify-center rounded-full text-xs">{conversations.length}</span>
          <svg className="w-5 h-5 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 15l7-7 7 7"></path></svg>
        </button>
      )}
    </div>
  );
}
