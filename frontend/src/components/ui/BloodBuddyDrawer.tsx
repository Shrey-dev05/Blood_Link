'use client';

import React, { useState } from 'react';
import { MessageSquare, X, Send, Bot, ExternalLink, AlertTriangle, Sparkles, RefreshCw } from 'lucide-react';
import { api } from '@/lib/api';
import { ChatMessage, SourceCitation } from '@/types';

export const BloodBuddyDrawer = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [language, setLanguage] = useState<'en' | 'hi' | 'hinglish'>('en');
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'init-1',
      sender: 'bloodbuddy',
      text: "Hello! I am BloodBuddy, your blood-donation educational guide. Ask me anything about donation eligibility, recovery, tattoos, myths, or how BloodLink coordinates emergencies. (Available in English, हिन्दी, & Hinglish!)",
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      citations: [

        { title: 'National Blood Policy', publisher: 'NBTC MOHFW', url: 'https://eraktkosh.mohfw.gov.in/' }
      ]
    }
  ]);

  const quickPrompts = [
    { en: 'Does blood donation cause weakness?', hi: 'क्या रक्तदान से कमजोरी आती है?', hinglish: 'Blood donate karne se weakness hoti hai kya?' },
    { en: 'Can I donate after getting a tattoo?', hi: 'टैटू बनवाने के बाद कब दान कर सकते हैं?', hinglish: 'Tattoo banwane ke kitne din baad donate kar sakte hain?' },
    { en: 'How often can I donate blood?', hi: 'कितने अंतराल में रक्तदान किया जा सकता है?', hinglish: 'Kitne mahine ke gap mein blood donate karna chahiye?' },
    { en: 'Who is eligible to donate blood in India?', hi: 'भारत में रक्तदान के लिए पात्रता क्या है?', hinglish: 'Donor eligibility criteria kya hai?' }
  ];

  const handleSend = async (textToSend?: string) => {
    const text = (textToSend || input).trim();
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
          text: "I'm having trouble connecting right now. Please try again in a moment.",
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Floating Launcher Button */}
      <div className="fixed bottom-6 right-6 z-40">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center space-x-2.5 bg-gradient-to-r from-blood-700 to-rose-600 hover:from-blood-800 hover:to-rose-700 text-white px-4 py-3 rounded-full shadow-xl shadow-rose-900/20 transition-all transform hover:scale-105 active:scale-95 group border-2 border-white/20"
          aria-label="Open BloodBuddy Assistant"
        >
          <div className="relative">
            <Bot className="w-5 h-5 group-hover:rotate-12 transition-transform" />
            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-emerald-400 rounded-full border border-blood-800 animate-ping"></span>
          </div>
          <span className="font-bold text-sm tracking-wide">BloodBuddy AI</span>
        </button>
      </div>

      {/* Slide-over Drawer */}
      {isOpen && (
        <div className="fixed inset-y-0 right-0 z-50 w-full sm:w-[440px] bg-white shadow-2xl flex flex-col border-l border-slate-200 animate-in slide-in-from-right duration-200">
          {/* Header */}
          <div className="bg-gradient-to-r from-blood-700 to-rose-600 text-white p-4 flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center backdrop-blur">
                <Bot className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="font-bold text-base leading-tight">BloodBuddy</h3>
                <p className="text-[11px] text-rose-100">Reviewed Awareness & Mythbuster AI</p>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="p-1.5 rounded-lg hover:bg-white/20 text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Language Selector */}
          <div className="bg-slate-100 p-2 flex items-center justify-between border-b border-slate-200 text-xs">
            <span className="font-semibold text-slate-500 pl-2">Language / भाषा:</span>
            <div className="flex space-x-1">
              <button
                onClick={() => setLanguage('en')}
                className={`px-2.5 py-1 rounded-md font-medium transition-colors ${language === 'en' ? 'bg-white text-blood-700 shadow-sm' : 'text-slate-600 hover:text-slate-900'}`}
              >
                English
              </button>
              <button
                onClick={() => setLanguage('hi')}
                className={`px-2.5 py-1 rounded-md font-medium transition-colors ${language === 'hi' ? 'bg-white text-blood-700 shadow-sm' : 'text-slate-600 hover:text-slate-900'}`}
              >
                हिन्दी
              </button>
              <button
                onClick={() => setLanguage('hinglish')}
                className={`px-2.5 py-1 rounded-md font-medium transition-colors ${language === 'hinglish' ? 'bg-white text-blood-700 shadow-sm' : 'text-slate-600 hover:text-slate-900'}`}
              >
                Hinglish
              </button>
            </div>
          </div>

          {/* Safety Notice */}
          <div className="bg-amber-50 border-b border-amber-200 p-2.5 flex items-start space-x-2 text-[11px] text-amber-800">
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <span>
              <strong>Medical Disclaimer:</strong> Provides reviewed public health facts only. It does not certify individual eligibility or provide medical triage.
            </span>
          </div>

          {/* Messages Container */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50/50">
            {messages.map((m) => (
              <div
                key={m.id}
                className={`flex flex-col ${m.sender === 'user' ? 'items-end' : 'items-start'}`}
              >
                <div
                  className={`max-w-[85%] rounded-2xl p-3 text-xs sm:text-sm shadow-sm ${
                    m.sender === 'user'
                      ? 'bg-blood-700 text-white rounded-br-none'
                      : m.isMedicalRefusal
                      ? 'bg-amber-50 border border-amber-300 text-amber-900 rounded-bl-none'
                      : 'bg-white border border-slate-200 text-slate-800 rounded-bl-none'
                  }`}
                >
                  <p className="whitespace-pre-wrap leading-relaxed">{m.text}</p>

                  {/* Citations */}
                  {m.citations && m.citations.length > 0 && (
                    <div className="mt-2.5 pt-2 border-t border-slate-100 text-[11px]">
                      <span className="font-bold text-slate-500 block mb-1">Reviewed Source Authorities:</span>
                      <div className="space-y-1">
                        {m.citations.map((c, idx) => (
                          <a
                            key={idx}
                            href={c.url}
                            target="_blank"
                            rel="noreferrer"
                            className="flex items-center text-blood-600 hover:underline"
                          >
                            <ExternalLink className="w-3 h-3 mr-1 shrink-0" />
                            <span className="truncate">{c.title} ({c.publisher})</span>
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

          {/* Quick Suggestions */}
          <div className="p-2.5 bg-white border-t border-slate-200">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-1.5 px-1">
              Suggested Questions
            </span>
            <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto">
              {quickPrompts.map((q, idx) => {
                const promptText = q[language] || q.en;
                return (
                  <button
                    key={idx}
                    onClick={() => handleSend(promptText)}
                    className="text-left text-[11px] bg-slate-100 hover:bg-rose-50 hover:text-blood-700 text-slate-700 border border-slate-200 rounded-lg px-2.5 py-1 transition-colors truncate max-w-full"
                  >
                    {promptText}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Input Area */}
          <div className="p-3 bg-white border-t border-slate-200 flex items-center space-x-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              placeholder={language === 'hi' ? 'रक्तदान संबंधी प्रश्न पूछें...' : language === 'hinglish' ? 'Apna question type karein...' : 'Ask about blood donation, safety, myths...'}
              className="flex-1 text-xs sm:text-sm border border-slate-300 rounded-xl px-3.5 py-2.5 focus:outline-none focus:ring-2 focus:ring-blood-500"
            />
            <button
              onClick={() => handleSend()}
              disabled={!input.trim() || loading}
              className="bg-blood-700 hover:bg-blood-800 disabled:bg-slate-300 text-white p-2.5 rounded-xl shadow-md transition-colors"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </>
  );
};
