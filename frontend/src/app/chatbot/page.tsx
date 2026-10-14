'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { 
  Bot, Send, AlertTriangle, ExternalLink, RefreshCw, 
  Sparkles, ArrowLeft, ShieldCheck
} from 'lucide-react';
import { api } from '@/lib/api';
import { ChatMessage } from '@/types';

export default function ChatbotPage() {
  const [language, setLanguage] = useState<'en' | 'hi' | 'hinglish'>('en');
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'init-1',
      sender: 'bloodbuddy',
      text: "Welcome to BloodBuddy! I am your educational assistant on blood donation facts, recovery guidelines, eligibility thresholds, and myths. How can I help you today?",
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      citations: [
        { title: 'National Blood Policy & Donor Selection', publisher: 'National Blood Transfusion Council', url: 'https://eraktkosh.mohfw.gov.in/' }
      ]
    }
  ]);

  const starterQuestions = [
    { en: 'Does blood donation cause long-term weakness?', hi: 'क्या रक्तदान से शारीरिक कमजोरी होती है?', hinglish: 'Blood donation se kamzori aati hai kya?' },
    { en: 'Can I donate blood after getting a tattoo?', hi: 'टैटू बनवाने के कितने समय बाद रक्तदान कर सकते हैं?', hinglish: 'Tattoo banwane ke baad donate kar sakte hain?' },
    { en: 'How often can an adult safely donate blood?', hi: 'कितने अंतराल में रक्तदान किया जाना चाहिए?', hinglish: 'Kitne din ke interval par donate kar sakte hain?' },
    { en: 'What is the minimum weight and hemoglobin requirement?', hi: 'न्यूनतम वजन और हीमोग्लोबिन कितना होना चाहिए?', hinglish: 'Minimum weight aur hemoglobin kitna hona chahiye?' }
  ];

  const handleSend = async (customText?: string) => {
    const text = (customText || input).trim();
    if (!text || loading) return;

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      sender: 'user',
      text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const res = await api.sendChatMessage(text, language);
      const botMsg: ChatMessage = {
        id: `bot-${Date.now()}`,
        sender: 'bloodbuddy',
        text: res.answer,
        citations: res.citations,
        isMedicalRefusal: res.is_medical_refusal,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages(prev => [...prev, botMsg]);
    } catch (err: any) {
      setMessages(prev => [
        ...prev,
        {
          id: `bot-err-${Date.now()}`,
          sender: 'bloodbuddy',
          text: "I am unable to reach the knowledge service at this moment. Please check your network connection.",
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <Link
        href="/"
        className="inline-flex items-center space-x-1.5 text-xs font-semibold text-slate-500 hover:text-slate-900 transition-colors"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        <span>Back to Home</span>
      </Link>

      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm flex flex-col h-[700px] overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-blood-800 to-rose-700 text-white p-5 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-white/20 flex items-center justify-center backdrop-blur">
              <Bot className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold leading-tight">BloodBuddy Awareness AI</h1>
              <p className="text-xs text-rose-100">Reviewed Guidelines & Mythbuster Knowledge Base</p>
            </div>
          </div>

          {/* Language Selector */}
          <div className="flex space-x-1 bg-black/20 p-1 rounded-xl text-xs">
            <button
              onClick={() => setLanguage('en')}
              className={`px-3 py-1 rounded-lg font-medium transition-colors ${language === 'en' ? 'bg-white text-blood-800 shadow' : 'text-rose-100 hover:text-white'}`}
            >
              English
            </button>
            <button
              onClick={() => setLanguage('hi')}
              className={`px-3 py-1 rounded-lg font-medium transition-colors ${language === 'hi' ? 'bg-white text-blood-800 shadow' : 'text-rose-100 hover:text-white'}`}
            >
              हिन्दी
            </button>
            <button
              onClick={() => setLanguage('hinglish')}
              className={`px-3 py-1 rounded-lg font-medium transition-colors ${language === 'hinglish' ? 'bg-white text-blood-800 shadow' : 'text-rose-100 hover:text-white'}`}
            >
              Hinglish
            </button>
          </div>
        </div>

        {/* Clinical Disclaimer */}
        <div className="bg-amber-50 border-b border-amber-200 px-4 py-2.5 flex items-center space-x-2 text-xs text-amber-900">
          <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
          <span>
            <strong>Medical Boundary Notice:</strong> BloodBuddy is an awareness tool. It does not certify individual donor fitness or evaluate personal medical conditions.
          </span>
        </div>

        {/* Message Stream */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-slate-50/50">
          {messages.map((m) => (
            <div
              key={m.id}
              className={`flex flex-col ${m.sender === 'user' ? 'items-end' : 'items-start'}`}
            >
              <div
                className={`max-w-[80%] rounded-3xl p-4 text-xs sm:text-sm shadow-sm ${
                  m.sender === 'user'
                    ? 'bg-blood-700 text-white rounded-br-none'
                    : m.isMedicalRefusal
                    ? 'bg-amber-50 border border-amber-300 text-amber-900 rounded-bl-none'
                    : 'bg-white border border-slate-200 text-slate-800 rounded-bl-none'
                }`}
              >
                <p className="whitespace-pre-wrap leading-relaxed">{m.text}</p>

                {m.citations && m.citations.length > 0 && (
                  <div className="mt-3 pt-2.5 border-t border-slate-100 text-xs">
                    <span className="font-bold text-slate-500 block mb-1">Source Reference:</span>
                    <div className="space-y-1">
                      {m.citations.map((c, idx) => (
                        <a
                          key={idx}
                          href={c.url}
                          target="_blank"
                          rel="noreferrer"
                          className="flex items-center text-blood-600 hover:underline"
                        >
                          <ExternalLink className="w-3.5 h-3.5 mr-1 shrink-0" />
                          <span>{c.title} — {c.publisher}</span>
                        </a>
                      ))}
                    </div>
                  </div>
                )}
              </div>
              <span className="text-[10px] text-slate-400 mt-1 px-1">{m.timestamp}</span>
            </div>
          ))}

          {loading && (
            <div className="flex items-center space-x-2 text-slate-500 text-xs italic">
              <RefreshCw className="w-3.5 h-3.5 animate-spin text-blood-600" />
              <span>BloodBuddy is consulting verified medical guidelines...</span>
            </div>
          )}
        </div>

        {/* Suggestions Bar */}
        <div className="p-3 bg-white border-t border-slate-200">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5 px-1">
            Common Inquiries
          </span>
          <div className="flex flex-wrap gap-2">
            {starterQuestions.map((q, idx) => {
              const promptText = q[language] || q.en;
              return (
                <button
                  key={idx}
                  onClick={() => handleSend(promptText)}
                  className="text-left text-xs bg-slate-100 hover:bg-rose-50 hover:text-blood-700 text-slate-700 border border-slate-200 rounded-xl px-3 py-1.5 transition-colors"
                >
                  {promptText}
                </button>
              );
            })}
          </div>
        </div>

        {/* Input Bar */}
        <div className="p-4 bg-white border-t border-slate-200 flex items-center space-x-3">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder={language === 'hi' ? 'रक्तदान संबंधी प्रश्न पूछें...' : language === 'hinglish' ? 'Apna sawal yahan likhein...' : 'Type your question about donation, safety, myths...'}
            className="flex-1 text-sm border border-slate-300 rounded-2xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blood-500"
          />
          <button
            onClick={() => handleSend()}
            disabled={!input.trim() || loading}
            className="bg-blood-700 hover:bg-blood-800 disabled:bg-slate-300 text-white px-5 py-3 rounded-2xl font-bold text-xs shadow-md transition-colors flex items-center space-x-1.5"
          >
            <span>Ask</span>
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
