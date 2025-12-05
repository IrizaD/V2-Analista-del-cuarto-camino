import React from 'react';
import { Message } from '../types';
import { User, Cpu } from 'lucide-react';

interface ChatBubbleProps {
  message: Message;
  isDarkMode: boolean;
  onOptionClick?: (text: string) => void;
}

export const ChatBubble: React.FC<ChatBubbleProps> = ({ message, isDarkMode, onOptionClick }) => {
  const isUser = message.role === 'user';

  // Función para procesar formato Markdown dentro de una línea (negritas, cursivas)
  const renderFormattedText = (text: string) => {
    // 1. Negritas: **texto**
    const parts = text.split(/(\*\*.*?\*\*|\*.*?\*|__.*?__)/g);
    
    return parts.map((part, index) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return <strong key={index} className={`font-bold ${isDarkMode ? 'text-amber-400' : 'text-amber-700'}`}>{part.slice(2, -2)}</strong>;
      }
      if ((part.startsWith('*') && part.endsWith('*')) || (part.startsWith('_') && part.endsWith('_'))) {
        return <em key={index} className="italic opacity-90">{part.slice(1, -1)}</em>;
      }
      return part;
    });
  };

  // Función principal que divide el mensaje en líneas y decide qué renderizar
  const renderContent = () => {
    const lines = message.text.split('\n');
    
    return lines.map((line, index) => {
      const trimmedLine = line.trim();
      if (!trimmedLine) return <div key={index} className="h-2"></div>; // Espaciado para líneas vacías

      // Detectar Encabezados (### Título)
      if (trimmedLine.startsWith('###')) {
        return (
          <h3 key={index} className={`text-lg font-bold mt-4 mb-2 ${isDarkMode ? 'text-amber-500' : 'text-amber-800'}`}>
            {renderFormattedText(trimmedLine.replace(/^###\s*/, ''))}
          </h3>
        );
      }
      if (trimmedLine.startsWith('##')) {
        return (
          <h2 key={index} className={`text-xl font-bold mt-5 mb-3 border-b pb-1 ${isDarkMode ? 'text-amber-500 border-gray-700' : 'text-amber-800 border-amber-200'}`}>
            {renderFormattedText(trimmedLine.replace(/^##\s*/, ''))}
          </h2>
        );
      }

      // Detectar Opciones Interactivas (1. Texto, a) Texto, - Texto)
      // Regex busca: (Numero + punto) O (Letra + parentesis/punto) O (Guion) al inicio
      const optionMatch = trimmedLine.match(/^(\d+\.|[a-zA-Z][\).-])\s+(.*)/);

      // Solo convertimos en botón si es un mensaje del Modelo y tenemos la función onOptionClick
      if (optionMatch && !isUser && onOptionClick) {
        const prefix = optionMatch[1]; // "1." o "a)"
        const content = optionMatch[2]; // El resto del texto

        return (
          <button
            key={index}
            onClick={() => onOptionClick(content)} // Enviamos solo el contenido, o la línea completa si prefieres
            className={`w-full text-left my-2 p-3 rounded-xl border transition-all duration-200 flex items-start group
              ${isDarkMode 
                ? 'bg-[#252525] border-gray-700 hover:bg-[#333] hover:border-amber-700 hover:shadow-[0_0_15px_rgba(245,158,11,0.1)]' 
                : 'bg-white border-gray-200 hover:bg-amber-50 hover:border-amber-300 hover:shadow-sm'
              }
            `}
          >
            <span className={`font-mono font-bold mr-3 mt-0.5 shrink-0 ${isDarkMode ? 'text-amber-500' : 'text-amber-600'}`}>
              {prefix}
            </span>
            <span className={`${isDarkMode ? 'text-gray-300 group-hover:text-white' : 'text-gray-700 group-hover:text-gray-900'}`}>
              {renderFormattedText(content)}
            </span>
          </button>
        );
      }

      // Párrafo normal con soporte de listas visuales (no interactivas) si es usuario
      return (
        <p key={index} className={`mb-1 ${isUser ? '' : 'leading-relaxed'}`}>
          {renderFormattedText(line)}
        </p>
      );
    });
  };

  // Definición de estilos base de la burbuja
  const bubbleStyles = isUser
    ? isDarkMode
      ? 'bg-[#2C2C2C] text-gray-100 border-amber-900/30'
      : 'bg-amber-100 text-gray-900 border-amber-200'
    : isDarkMode
      ? 'bg-[#1E1E1E] text-gray-200 border-gray-800'
      : 'bg-white text-gray-800 border-gray-200 shadow-sm';

  const avatarBg = isUser
    ? 'bg-amber-600'
    : isDarkMode ? 'bg-gray-700' : 'bg-gray-200';

  return (
    <div className={`flex w-full ${isUser ? 'justify-end' : 'justify-start'} mb-6 group animate-fade-in`}>
      <div className={`flex max-w-[95%] md:max-w-[85%] lg:max-w-[75%] ${isUser ? 'flex-row-reverse' : 'flex-row'} items-start gap-3`}>
        
        {/* Avatar */}
        <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center mt-1 ${avatarBg}`}>
          {isUser ? (
            <User size={16} className="text-white" />
          ) : (
            <Cpu size={16} className={isDarkMode ? "text-cyan-400" : "text-cyan-600"} />
          )}
        </div>

        {/* Bubble */}
        <div
          className={`relative p-5 rounded-2xl text-sm md:text-base border transition-colors duration-300 ${bubbleStyles} ${
            isUser ? 'rounded-tr-none' : 'rounded-tl-none'
          }`}
        >
          {renderContent()}
          
          {/* Timestamp */}
          <div className={`text-[10px] mt-3 opacity-50 uppercase tracking-wider ${isUser ? 'text-right' : 'text-left'}`}>
            {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </div>
        </div>
      </div>
    </div>
  );
};
