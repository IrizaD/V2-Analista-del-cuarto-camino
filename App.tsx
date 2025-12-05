import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Send, AlertCircle, Cpu, Sun, Moon } from 'lucide-react';
import { Message, LoadingState } from './types';
import { sendMessageToGemini } from './services/geminiService';
import { ChatBubble } from './components/ChatBubble';

const App: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [loadingState, setLoadingState] = useState<LoadingState>(LoadingState.IDLE);
  const [isInitialized, setIsInitialized] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(true);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const hasStartedInit = useRef(false);

  // Auto-scroll to bottom
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loadingState]);

  // Lógica de inicio extraída para ser reutilizable
  const startDiagnostics = useCallback(async () => {
    setLoadingState(LoadingState.LOADING);
    try {
        const responseText = await sendMessageToGemini("Hola. Salúdame y pídeme mi nombre para comenzar.");
        
        setMessages([
            {
                id: 'init-' + Date.now(),
                role: 'model',
                text: responseText,
                timestamp: new Date(),
            },
        ]);
    } catch (error) {
        console.error("Error initializing chat:", error);
        setMessages([
            {
                id: 'init-error',
                role: 'model',
                text: "No se pudo conectar con el Analista. Por favor revisa tu conexión.",
                timestamp: new Date(),
            },
        ]);
    } finally {
        setLoadingState(LoadingState.IDLE);
        setIsInitialized(true);
    }
  }, []);

  // Initial dynamic greeting - Run once
  useEffect(() => {
    if (!hasStartedInit.current) {
        hasStartedInit.current = true;
        startDiagnostics();
    }
  }, [startDiagnostics]);

  // Modificado para aceptar texto opcional (override) desde los clicks de opciones
  const handleSendMessage = async (textOverride?: string) => {
    // Usamos el override si existe, de lo contrario el input state
    const textToSend = textOverride || inputText.trim();
    
    if (!textToSend || loadingState === LoadingState.LOADING) return;

    // Si fue un click, no limpiamos el input porque probablemente estaba vacío
    if (!textOverride) {
        setInputText('');
    }
    
    setLoadingState(LoadingState.LOADING);

    const newUserMsg: Message = {
      id: Date.now().toString(),
      role: 'user',
      text: textToSend,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, newUserMsg]);

    try {
      const responseText = await sendMessageToGemini(textToSend);

      const newBotMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: 'model',
        text: responseText,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, newBotMsg]);
      setLoadingState(LoadingState.IDLE);
    } catch (error) {
      console.error(error);
      setLoadingState(LoadingState.ERROR);
    }
    
    // Devolvemos el foco al input
    setTimeout(() => {
        inputRef.current?.focus();
    }, 100);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const toggleTheme = () => {
    setIsDarkMode(!isDarkMode);
  };

  // Styles definition based on theme
  const bgClass = isDarkMode ? 'bg-[#121212]' : 'bg-gray-50';
  const textClass = isDarkMode ? 'text-gray-100' : 'text-gray-900';
  const headerBgClass = isDarkMode ? 'bg-[#121212]/95 border-gray-800' : 'bg-white/95 border-gray-200 shadow-sm';
  const inputBgClass = isDarkMode ? 'bg-[#1E1E1E] text-white border-gray-800 placeholder-gray-500' : 'bg-white text-gray-900 border-gray-300 placeholder-gray-400';
  const footerBgClass = isDarkMode ? 'bg-[#121212] border-gray-800' : 'bg-white border-gray-200';

  return (
    <div className={`flex flex-col h-screen font-sans overflow-hidden transition-colors duration-300 ${bgClass}`}>
      {/* Header */}
      <header className={`flex-shrink-0 h-16 border-b backdrop-blur-md flex items-center justify-between px-4 md:px-8 z-10 transition-colors duration-300 ${headerBgClass}`}>
        <div className="flex items-center gap-3">
            <div className="w-2 h-2 rounded-full bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.6)] animate-pulse"></div>
            <h1 className={`text-lg md:text-xl font-medium tracking-wide ${textClass}`}>
              Analista del <span className="text-amber-600 font-bold">Cuarto Camino</span>
            </h1>
        </div>
        <div className="flex items-center gap-2">
            <button
                onClick={toggleTheme}
                className={`p-2 transition-colors rounded-full ${isDarkMode ? 'text-gray-500 hover:text-amber-500 hover:bg-white/5' : 'text-gray-400 hover:text-amber-600 hover:bg-gray-100'}`}
                title={isDarkMode ? "Modo Claro" : "Modo Oscuro"}
            >
                {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
            </button>
        </div>
      </header>

      {/* Chat Area */}
      <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:px-24 scroll-smooth">
        <div className="max-w-4xl mx-auto flex flex-col min-h-full">
            {messages.map((msg) => (
            <ChatBubble 
                key={msg.id} 
                message={msg} 
                isDarkMode={isDarkMode} 
                onOptionClick={(text) => handleSendMessage(text)} 
            />
            ))}

            {/* Loading Indicator */}
            {loadingState === LoadingState.LOADING && (
            <div className="flex justify-start mb-6 animate-pulse">
                <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${isDarkMode ? 'bg-gray-700' : 'bg-gray-200'}`}>
                        <Cpu size={16} className={isDarkMode ? "text-cyan-400" : "text-cyan-600"} />
                    </div>
                    <div className={`px-4 py-3 rounded-2xl rounded-tl-none border ${isDarkMode ? 'bg-[#1E1E1E] border-gray-800' : 'bg-white border-gray-200 shadow-sm'}`}>
                        <span className={`text-sm flex items-center gap-2 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                            Analizando mecanicidad
                            <span className="flex gap-1">
                                <span className={`w-1 h-1 rounded-full animate-bounce [animation-delay:-0.3s] ${isDarkMode ? 'bg-gray-400' : 'bg-gray-500'}`}></span>
                                <span className={`w-1 h-1 rounded-full animate-bounce [animation-delay:-0.15s] ${isDarkMode ? 'bg-gray-400' : 'bg-gray-500'}`}></span>
                                <span className={`w-1 h-1 rounded-full animate-bounce ${isDarkMode ? 'bg-gray-400' : 'bg-gray-500'}`}></span>
                            </span>
                        </span>
                    </div>
                </div>
            </div>
            )}

            {/* Error Message */}
            {loadingState === LoadingState.ERROR && (
                <div className="flex justify-center mb-6">
                    <div className="bg-red-900/20 border border-red-900/50 text-red-400 px-4 py-2 rounded-lg text-sm flex items-center gap-2">
                        <AlertCircle size={16} />
                        Error de conexión. Intenta nuevamente.
                    </div>
                </div>
            )}

            <div ref={messagesEndRef} className="h-4" />
        </div>
      </main>

      {/* Input Area */}
      <footer className={`flex-shrink-0 p-4 border-t transition-colors duration-300 ${footerBgClass}`}>
        <div className="max-w-4xl mx-auto relative">
          <input
            ref={inputRef}
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={loadingState === LoadingState.LOADING}
            placeholder="Describe tu reacción..."
            className={`w-full rounded-xl pl-5 pr-14 py-4 focus:outline-none focus:ring-1 focus:ring-amber-600/50 border transition-all shadow-lg ${inputBgClass}`}
          />
          <button
            onClick={() => handleSendMessage()}
            disabled={!inputText.trim() || loadingState === LoadingState.LOADING}
            className="absolute right-2 top-2 bottom-2 aspect-square flex items-center justify-center bg-amber-600 hover:bg-amber-500 disabled:bg-gray-400/50 disabled:cursor-not-allowed text-white rounded-lg transition-all duration-200 group"
          >
            <Send size={18} className={`group-hover:translate-x-0.5 transition-transform ${loadingState === LoadingState.LOADING ? 'opacity-0' : 'opacity-100'}`} />
          </button>
        </div>
        <div className="text-center mt-2">
            <p className={`text-[10px] ${isDarkMode ? 'text-gray-600' : 'text-gray-400'}`}>
                La auto-observación es el primer paso hacia la consciencia.
            </p>
        </div>
      </footer>
    </div>
  );
};

export default App;