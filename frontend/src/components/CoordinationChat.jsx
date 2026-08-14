import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { chatApi } from '../api/chatApi';
import { getSocket } from '../services/socket';
import { Button } from './ui';

const PRESET_MESSAGES = [
  "I am on my way to the hospital 🚗",
  "Arrived at the Blood Bank reception 🏥",
  "Please ask for the emergency desk",
  "Thank you so much for helping! ❤️",
];

export default function CoordinationChat({ requestId, hospitalName }) {
  const { user } = useAuth();
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Load message history
  useEffect(() => {
    let mounted = true;
    const fetchHistory = async () => {
      try {
        const res = await chatApi.getMessages(requestId);
        if (mounted) {
          setMessages(res.data.data || []);
          setLoading(false);
        }
      } catch (err) {
        if (mounted) setLoading(false);
      }
    };

    fetchHistory();
    return () => {
      mounted = false;
    };
  }, [requestId]);

  // Real-time socket message stream
  useEffect(() => {
    const socket = getSocket();

    const handleNewMessage = (payload) => {
      if (payload?.requestId === requestId && payload?.message) {
        setMessages((prev) => {
          // Avoid duplicate messages if already present
          if (prev.some((m) => m.id === payload.message.id)) return prev;
          return [...prev, payload.message];
        });
      }
    };

    socket.on('chat:message', handleNewMessage);
    return () => {
      socket.off('chat:message', handleNewMessage);
    };
  }, [requestId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async (e, customText) => {
    if (e) e.preventDefault();
    const textToSend = customText || input;
    if (!textToSend.trim() || sending) return;

    setSending(true);
    try {
      await chatApi.sendMessage(requestId, textToSend.trim());
      setInput('');
    } catch (err) {
      console.error('Failed to send message:', err);
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="flex flex-col rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden h-[450px]">
      {/* Chat Header */}
      <div className="flex items-center justify-between border-b border-gray-100 bg-gradient-to-r from-brand-50 to-white px-4 py-3">
        <div className="flex items-center gap-2.5">
          <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-brand-600 text-white text-xs font-bold shadow-xs">
            💬
          </span>
          <div>
            <h3 className="text-xs font-bold text-gray-900">Hospital Coordination Chat</h3>
            <p className="text-[11px] text-gray-500">
              Direct & secure communication for {hospitalName}
            </p>
          </div>
        </div>
        <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-800 flex items-center gap-1">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-600 animate-pulse"></span> Live
        </span>
      </div>

      {/* Messages Stream */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50/50">
        {loading ? (
          <p className="text-center text-xs text-gray-400 py-10">Loading conversation…</p>
        ) : messages.length === 0 ? (
          <div className="rounded-xl border border-dashed border-gray-200 p-6 text-center text-xs text-gray-500">
            <span className="text-2xl">🤝</span>
            <p className="mt-1 font-semibold text-gray-700">Coordinate Arrival & Logistics</p>
            <p className="text-[11px] text-gray-400 mt-0.5">
              Discuss hospital room numbers, blood bank location, or estimated arrival times safely.
            </p>
          </div>
        ) : (
          messages.map((msg) => {
            const isMe = msg.sender_id === user?.id;
            const isRequesterMsg = msg.sender_role === 'REQUESTER';

            return (
              <div
                key={msg.id || msg.created_at}
                className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}
              >
                <div className="flex items-center gap-1.5 mb-1 px-1">
                  <span className="text-[10px] font-bold text-gray-600">
                    {isMe ? 'You' : msg.sender_name}
                  </span>
                  <span
                    className={`rounded px-1.5 py-0.2 text-[9px] font-semibold ${
                      isRequesterMsg
                        ? 'bg-brand-50 text-brand-700 ring-1 ring-brand-100'
                        : 'bg-blue-50 text-blue-700 ring-1 ring-blue-100'
                    }`}
                  >
                    {isRequesterMsg ? 'Receiver' : 'Donor'}
                  </span>
                  <span className="text-[9px] text-gray-400">
                    {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>

                <div
                  className={`rounded-2xl px-3.5 py-2 text-xs max-w-[85%] shadow-xs leading-relaxed ${
                    isMe
                      ? 'bg-brand-600 text-white rounded-br-xs'
                      : 'bg-white text-gray-800 border border-gray-200/80 rounded-bl-xs'
                  }`}
                >
                  {msg.message}
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Preset Quick Chips */}
      <div className="flex gap-1.5 overflow-x-auto px-3 py-2 bg-white border-t border-gray-100 scrollbar-none">
        {PRESET_MESSAGES.map((preset) => (
          <button
            key={preset}
            type="button"
            onClick={() => handleSend(null, preset)}
            disabled={sending}
            className="shrink-0 rounded-full border border-gray-200 bg-gray-50 px-2.5 py-1 text-[11px] font-medium text-gray-600 transition hover:bg-brand-50 hover:border-brand-200 hover:text-brand-700"
          >
            {preset}
          </button>
        ))}
      </div>

      {/* Input Form */}
      <form onSubmit={(e) => handleSend(e)} className="flex items-center gap-2 border-t border-gray-200 p-2.5 bg-white">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Type coordination message..."
          className="flex-1 rounded-xl border border-gray-200 px-3 py-2 text-xs outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
        />
        <Button
          type="submit"
          disabled={sending || !input.trim()}
          className="bg-brand-600 hover:bg-brand-700 text-white text-xs font-bold px-4 py-2 rounded-xl"
        >
          {sending ? '…' : 'Send'}
        </Button>
      </form>
    </div>
  );
}
