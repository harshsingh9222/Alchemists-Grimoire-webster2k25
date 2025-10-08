import React, { useState, useEffect, useRef } from "react";
import {
  getAllChats,
  getChatHistory,
  sendChatMessage,
  deleteChat,
  clearAllChats,
} from "../api.js";
import {
  Bot,
  Send,
  User,
  MessageSquarePlus,
  Trash2,
  MoreVertical,
  Loader2,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

/**
 * HealthChat.jsx
 * Uses your api.js methods exactly:
 * - getAllChats()
 * - getChatHistory(id)
 * - sendChatMessage(message, chatId)
 * - deleteChat(id)
 * - clearAllChats()
 */
const HealthChat = () => {
  const [chats, setChats] = useState([]); // list of chat meta { _id, title, createdAt, updatedAt }
  const [messages, setMessages] = useState([]); // current chat messages [{ sender, text, timestamp? }]
  const [activeChatId, setActiveChatId] = useState(null);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [menuOpen, setMenuOpen] = useState(null);
  const messagesEndRef = useRef(null);

  // Load chat list on mount
  useEffect(() => {
    fetchChats();
  }, []);

  // Auto scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Fetch all chats, set list and Auto-load latest (if any)
  const fetchChats = async () => {
    try {
      const data = await getAllChats();
      setChats(data || []);
      if (data && data.length > 0) {
        // load the most recently-updated chat (backend should return sorted)
        await loadChat(data[0]._id);
      } else {
        // no chats -> start a new empty chat with welcome message
        startNewChat();
      }
    } catch (err) {
      console.error("Error fetching chats:", err);
      // if no chats returned or API fails, still show a fresh chat
      startNewChat();
    }
  };

  // Load messages for a specific chat
  const loadChat = async (chatId) => {
    try {
      const msgs = await getChatHistory(chatId);
      setMessages(msgs || []);
      setActiveChatId(chatId);
      setMenuOpen(null);
    } catch (err) {
      console.error("Error loading chat:", err);
    }
  };

  // Start a new (unsaved) chat — does NOT delete old chats
  const startNewChat = () => {
    setActiveChatId(null);
    setMessages([
      {
        sender: "bot",
        text: "👋 Hi — I'm your AI Health Assistant. Ask me about your medicines or schedule.",
      },
    ]);
    setMenuOpen(null);
  };

  // Send message (either continue existing chat or create a new one)
  const handleSend = async () => {
    if (!input.trim()) return;

    const text = input.trim();
    // Optimistic UI: append user's message
    setMessages((prev) => [...prev, { sender: "user", text }]);
    setInput("");
    setLoading(true);

    try {
      // sendChatMessage(message, chatId)
      const res = await sendChatMessage(text, activeChatId); // res expected { reply, chatId? }
      const botReply = res?.reply ?? "Sorry, no response.";

      // append bot reply
      setMessages((prev) => [...prev, { sender: "bot", text: botReply }]);

      // if a new chat was created, API should return chatId
      if (!activeChatId && res?.chatId) {
        // refresh chats and set the newly created chat as active
        await fetchChats();
        setActiveChatId(res.chatId);
        // load messages of the newly created chat (optional: ensures server-side copy)
        const serverMsgs = await getChatHistory(res.chatId);
        setMessages(serverMsgs || [{ sender: "bot", text: botReply }]);
      } else {
        // update chat list order (refresh)
        await fetchChats();
      }
    } catch (err) {
      console.error("Error sending message:", err);
      setMessages((prev) => [
        ...prev,
        { sender: "bot", text: "⚠️ Sorry — I couldn't connect right now." },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter") handleSend();
  };

  // Delete a single chat (from sidebar menu)
  const handleDeleteChat = async (chatId) => {
    try {
      await deleteChat(chatId);
      // remove from list
      setChats((prev) => prev.filter((c) => c._id !== chatId));
      // if deleted chat was active -> pick another or start new chat
      if (activeChatId === chatId) {
        const remaining = chats.filter((c) => c._id !== chatId);
        if (remaining.length > 0) {
          await loadChat(remaining[0]._id);
        } else {
          startNewChat();
        }
      }
      setMenuOpen(null);
    } catch (err) {
      console.error("Error deleting chat:", err);
    }
  };

  // Clear all chats
  const handleClearAll = async () => {
    try {
      await clearAllChats();
      setChats([]);
      startNewChat();
    } catch (err) {
      console.error("Error clearing all chats:", err);
    }
  };

  return (
    <div className="flex h-[85vh] bg-gradient-to-br from-[#1b003a] via-[#2d0b63] to-[#0a001f] rounded-2xl shadow-2xl overflow-hidden text-white">
      {/* Sidebar */}
      <div className="w-72 bg-[#12002f]/80 border-r border-purple-600/30 flex flex-col p-4 backdrop-blur-md">
        <div className="flex items-center gap-2 mb-4">
          <Bot className="w-6 h-6 text-purple-300" />
          <h2 className="text-lg font-semibold text-purple-100">
            Health Assistant
          </h2>
        </div>

        <div className="flex gap-2 mb-4">
          <button
            onClick={startNewChat}
            className="flex-1 flex items-center gap-2 bg-purple-600 hover:bg-purple-700 px-3 py-2 rounded-lg text-sm font-medium transition"
          >
            <MessageSquarePlus className="w-4 h-4" />
            New Chat
          </button>

          <button
            onClick={handleClearAll}
            className="px-3 py-2 rounded-lg bg-transparent border border-purple-600/40 text-sm hover:bg-purple-700/20 transition"
            title="Clear all chats"
          >
            Clear
          </button>
        </div>

        <div className="flex-1 overflow-y-auto space-y-2 scrollbar-thin scrollbar-thumb-purple-700/40">
          {chats.length === 0 ? (
            <p className="text-sm text-purple-300/70 italic">
              No previous chats
            </p>
          ) : (
            chats.map((chat) => (
              <div
                key={chat._id}
                onClick={() => loadChat(chat._id)}
                className={`group flex items-center justify-between gap-2 px-3 py-2 rounded-md cursor-pointer transition ${
                  activeChatId === chat._id
                    ? "bg-purple-800/50"
                    : "hover:bg-purple-800/30"
                }`}
              >
                <div className="truncate text-sm">
                  {chat.title ||
                    `Chat ${new Date(chat.createdAt).toLocaleString()}`}
                </div>

                <div className="relative" onClick={(e) => e.stopPropagation()}>
                  <MoreVertical
                    className="w-4 h-4 text-purple-300 opacity-0 group-hover:opacity-100 transition"
                    onClick={() =>
                      setMenuOpen(menuOpen === chat._id ? null : chat._id)
                    }
                  />
                  <AnimatePresence>
                    {menuOpen === chat._id && (
                      <motion.div
                        initial={{ opacity: 0, y: -6 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -6 }}
                        className="absolute right-0 top-5 bg-[#24113d] rounded-md shadow-lg border border-purple-500/30 z-20"
                      >
                        <button
                          onClick={() => handleDeleteChat(chat._id)}
                          className="flex items-center gap-2 text-sm px-3 py-2 hover:bg-purple-700/30 w-full text-left"
                        >
                          <Trash2 className="w-4 h-4 text-red-400" />
                          Delete
                        </button>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Chat Window */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="flex items-center gap-2 px-6 py-4 bg-gradient-to-r from-purple-700/80 to-indigo-700/60 border-b border-purple-400/30 backdrop-blur-md">
          <Bot className="w-5 h-5 text-purple-100" />
          <h1 className="text-lg font-semibold text-purple-50">
            AI Health Assistant
          </h1>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-[#0d0024]/60 backdrop-blur-lg">
          {messages.map((msg, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.18 }}
              className={`flex ${
                msg.sender === "user" ? "justify-end" : "justify-start"
              }`}
            >
              <div
                className={`flex items-start gap-3 max-w-[75%] ${
                  msg.sender === "user" ? "flex-row-reverse" : ""
                }`}
              >
                <div
                  className={`p-2 rounded-full bg-gradient-to-br ${
                    msg.sender === "user"
                      ? "from-indigo-500 to-purple-600"
                      : "from-purple-700 to-pink-600"
                  } shadow-lg`}
                >
                  {msg.sender === "bot" ? (
                    <Bot className="w-4 h-4 text-white" />
                  ) : (
                    <User className="w-4 h-4 text-white" />
                  )}
                </div>
                <div
                  className={`px-4 py-3 rounded-2xl text-sm leading-relaxed backdrop-blur-md shadow-md ${
                    msg.sender === "user"
                      ? "bg-indigo-600/60 text-white rounded-br-none"
                      : "bg-purple-800/40 text-purple-100 rounded-bl-none"
                  }`}
                >
                  {msg.text}
                </div>
              </div>
            </motion.div>
          ))}

          {loading && (
            <div className="flex items-center gap-2 text-purple-300 text-sm">
              <Loader2 className="animate-spin w-4 h-4" />
              Thinking...
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="flex items-center p-4 border-t border-purple-400/20 bg-[#1a0037]/70 backdrop-blur-md">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyPress}
            placeholder="Ask about your medicines..."
            className="flex-1 bg-purple-900/40 text-purple-100 placeholder-purple-300 px-4 py-2 text-sm rounded-xl border border-purple-600/40 focus:outline-none focus:ring-2 focus:ring-purple-500 transition"
          />
          <button
            onClick={handleSend}
            disabled={loading}
            className={`ml-3 p-3 rounded-xl shadow-md transition ${
              loading
                ? "bg-purple-400/40 cursor-not-allowed"
                : "bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500"
            }`}
          >
            <Send className="w-5 h-5 text-white" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default HealthChat;
