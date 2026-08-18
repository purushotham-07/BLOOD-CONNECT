import { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { chatApi } from '../api/chatApi';
import { getSocket } from '../services/socket';
import { Button } from './ui';

const PRESET_MESSAGES = [
  'I am on my way to the hospital 🚗',
  'Arrived at Blood Bank reception 🏥',
  'Which floor/ward is the patient in?',
  'Thank you so much for your help! ❤️',
  'Donation completed successfully! 🩸',
];

export default function CoordinationChat({ requestId, hospitalName }) {
  const { user } = useAuth();
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const messagesEndRef = useRef(null);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  // 1. Fetch Chat History
  useEffect(() => {
    let active = true;
    const loadMessages = async () => {
      try {
        const res = await chatApi.getMessages(requestId);
        if (active) {
          setMessages(res.data.data || []);
          setLoading(false);
        }
      } catch (err) {
        if (active) {
          setError(err.response?.data?.message || null);
          setLoading(false);
        }
      }
    };

    loadMessages();
    return () => {
      active = false;
    };
  }, [requestId]);

  // 2. Real-Time Socket.IO Synchronization
  useEffect(() => {
    if (!requestId) return;
    const socket = getSocket();

    // Explicitly join request chat room
    socket.emit('join:request', requestId);

    const onIncomingMessage = (payload) => {
      if (payload?.requestId === requestId && payload?.message) {
        setMessages((prev) => {
          if (prev.some((m) => m.id === payload.message.id)) return prev;
          return [...prev, payload.message];
        });
      }
    };

    socket.on('chat:message', onIncomingMessage);

    return () => {
      socket.emit('leave:request', requestId);
      socket.off('chat:message', onIncomingMessage);
    };
  }, [requestId]);

  // Scroll to bottom when messages update
  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  // 3. Send Message Handler
  const handleSend = async (e, customText) => {
    if (e) e.preventDefault();
    const text = customText || input;
    if (!text.trim() || sending) return;

    setSending(true);
    try {
      const res = await chatApi.sendMessage(requestId, text.trim());
      if (res.data?.data) {
        setMessages((prev) => {
          if (prev.some((m) => m.id === res.data.data.id)) return prev;
          return [...prev, res.data.data];
        });
      }
      setInput('');
    } catch (err) {
      console.error('Failed to send coordination message:', err);
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="flex flex-col rounded-2xl border border-gray-200/90 bg-white shadow-xs overflow-hidden h-[420px]">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-gray-100 bg-gradient-to-r from-brand-50/70 to-white px-3.5 py-2.5">
        <div className="flex items-center gap-2">
          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-brand-600 text-white text-xs font-bold shadow-2xs">
            💬
          </span>
          <div>
            <h3 className="text-xs font-bold text-gray-900 leading-tight">Live Coordination Chat</h3>
            <p className="text-[10px] text-gray-500 truncate max-w-[200px] sm:max-w-none">
              Direct communication for {hospitalName}
            </p>
          </div>
        </div>

        <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[9px] font-bold text-emerald-800 flex items-center gap-1">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-600 animate-pulse"></span>
          Live Socket
        </span>
      </div>

      {/* Messages Stream */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2.5 bg-gray-50/60">
        {loading ? (
          <p className="text-center text-xs text-gray-400 py-10">Connecting to coordination room…</p>
        ) : error ? (
          <div className="rounded-xl border border-gray-200 bg-white p-6 text-center text-xs text-gray-500">
            <span className="text-2xl">🔒</span>
            <p className="mt-1 font-semibold text-gray-700">{error}</p>
          </div>
        ) : messages.length === 0 ? (
          <div className="rounded-xl border border-dashed border-gray-200 bg-white p-6 text-center text-xs text-gray-500">
            <span className="text-2xl">🤝</span>
            <p className="mt-1 font-semibold text-gray-800">Coordinate Arrival & Hospital Logistics</p>
            <p className="text-[11px] text-gray-400 mt-0.5">
              Discuss hospital room numbers, blood bank counter, or arrival updates securely.
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
                <div className="flex items-center gap-1.5 mb-0.5 px-1">
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
                  className={`rounded-2xl px-3.5 py-2 text-xs max-w-[85%] shadow-2xs leading-relaxed break-words ${
                    isMe
                      ? 'bg-brand-600 text-white rounded-br-xs font-medium'
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
      <div className="flex gap-1.5 overflow-x-auto px-3 py-1.5 bg-white border-t border-gray-100 scrollbar-none">
        {PRESET_MESSAGES.map((preset) => (
          <button
            key={preset}
            type="button"
            onClick={() => handleSend(null, preset)}
            disabled={sending || Boolean(error)}
            className="shrink-0 rounded-full border border-gray-200 bg-gray-50 px-2.5 py-1 text-[10px] font-medium text-gray-600 transition hover:bg-brand-50 hover:border-brand-200 hover:text-brand-700"
          >
            {preset}
          </button>
        ))}
      </div>

      {/* Input Form */}
      <form onSubmit={(e) => handleSend(e)} className="flex items-center gap-2 border-t border-gray-200 p-2 bg-white">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Type message to coordinate..."
          disabled={Boolean(error)}
          className="flex-1 rounded-xl border border-gray-200 px-3 py-2 text-xs outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
        />
        <Button
          type="submit"
          disabled={sending || !input.trim() || Boolean(error)}
          className="bg-brand-600 hover:bg-brand-700 text-white text-xs font-bold px-3.5 py-2 rounded-xl shrink-0"
        >
          {sending ? '…' : 'Send'}
        </Button>
      </form>
    </div>
  );
}
