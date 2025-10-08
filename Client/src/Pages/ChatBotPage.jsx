import React, { useState, useRef, useEffect } from "react";
import { sendChatMessage } from "../api.js";
import { Bot, Send, User } from "lucide-react";
import { motion } from "framer-motion";

const HealthChat = () => {
  const [messages, setMessages] = useState([
    {
      sender: "bot",
      text: "👋 Hi! I'm your AI Health Assistant. How can I help today?",
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);

  // Scroll to bottom on new message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = async () => {
    if (!input.trim()) return;
    const userMessage = { sender: "user", text: input };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setLoading(true);

    try {
      const data = await sendChatMessage(userMessage.text); // replace userId dynamically
      const botMessage = { sender: "bot", text: data.reply };
      setMessages((prev) => [...prev, botMessage]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        { sender: "bot", text: "⚠️ Sorry, I couldn't connect right now." },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter") sendMessage();
  };

  return (
    <div className="flex flex-col h-[80vh] max-w-2xl mx-auto border rounded-2xl shadow-lg bg-white overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-2 p-4 bg-gradient-to-r from-blue-500 to-indigo-500 text-white font-semibold">
        <Bot className="w-5 h-5" />
        AI Health Assistant
      </div>

      {/* Chat Messages */}
      <div className="flex-1 overflow-y-auto p-4 bg-gray-50 space-y-3">
        {messages.map((msg, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
            className={`flex items-start gap-2 ${
              msg.sender === "user" ? "justify-end" : "justify-start"
            }`}
          >
            {msg.sender === "bot" && (
              <div className="p-2 bg-blue-100 rounded-full">
                <Bot className="w-4 h-4 text-blue-600" />
              </div>
            )}
            <div
              className={`max-w-[70%] px-3 py-2 rounded-2xl text-sm ${
                msg.sender === "user"
                  ? "bg-blue-600 text-white rounded-br-none"
                  : "bg-gray-200 text-gray-800 rounded-bl-none"
              }`}
            >
              {msg.text}
            </div>
            {msg.sender === "user" && (
              <div className="p-2 bg-blue-100 rounded-full">
                <User className="w-4 h-4 text-blue-600" />
              </div>
            )}
          </motion.div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Section */}
      <div className="flex items-center border-t p-3 bg-white">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyPress}
          placeholder="Ask about your medicines..."
          className="flex-1 px-4 py-2 text-sm border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <button
          onClick={sendMessage}
          disabled={loading}
          className={`ml-2 p-2 rounded-xl text-white transition ${
            loading
              ? "bg-gray-400 cursor-not-allowed"
              : "bg-blue-600 hover:bg-blue-700"
          }`}
        >
          <Send className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
};

export default HealthChat;
