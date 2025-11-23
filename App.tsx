import React, { useState, useEffect, useCallback, useRef } from 'react';
import { 
  Menu, 
  Plus, 
  MessageSquare, 
  Settings, 
  Image as ImageIcon, 
  Mic, 
  Send, 
  Trash2, 
  Sun, 
  Moon, 
  X,
  Bot,
  MoreVertical,
  Paperclip,
  CheckCircle,
  StopCircle,
  Sparkles,
  Search as SearchIcon,
  Download,
  Share2,
  Car,
  Palette,
  Tag,
  Ruler,
  GraduationCap,
  HelpCircle
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';

import { geminiService } from './services/geminiService';
import { Chat, Message, Persona, Role, ModelId, AppSettings } from './types';
import { DEFAULT_PERSONAS, MODELS } from './constants';

// --- Types for Props ---

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  chats: Chat[];
  currentChatId: string | null;
  onSelectChat: (id: string) => void;
  onNewChat: () => void;
  onDeleteChat: (id: string, e: React.MouseEvent) => void;
  toggleTheme: () => void;
  isDarkMode: boolean;
  onOpenSettings: () => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
}

interface ChatAreaProps {
  currentChat: Chat | null;
  inputMessage: string;
  setInputMessage: (msg: string) => void;
  onSendMessage: () => void;
  isStreaming: boolean;
  streamingContent: string;
  files: File[];
  onRemoveFile: (index: number) => void;
  onFileUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  messagesEndRef: React.RefObject<HTMLDivElement>;
  stopGeneration: () => void;
  settings: AppSettings;
  onGenerateImage: () => void;
  onExportChat: () => void;
  onShareChat: () => void;
}

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: AppSettings;
  onSaveSettings: (settings: AppSettings) => void;
}

// --- Components ---

const Sidebar: React.FC<SidebarProps> = ({
  isOpen,
  onClose,
  chats,
  currentChatId,
  onSelectChat,
  onNewChat,
  onDeleteChat,
  toggleTheme,
  isDarkMode,
  onOpenSettings,
  searchQuery,
  setSearchQuery
}) => {
  // Enhanced search: filter by title OR message content
  const filteredChats = chats.filter(chat => {
    const query = searchQuery.toLowerCase();
    const matchesTitle = chat.title.toLowerCase().includes(query);
    const matchesContent = chat.messages.some(msg => msg.content.toLowerCase().includes(query));
    return matchesTitle || matchesContent;
  });

  return (
    <>
      {/* Mobile Overlay */}
      <div 
        className={`fixed inset-0 bg-black/50 z-20 md:hidden transition-opacity duration-200 ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        onClick={onClose}
      />
      
      {/* Sidebar Content */}
      <div className={`fixed inset-y-0 left-0 z-30 w-64 bg-gray-900 text-gray-100 transform transition-transform duration-200 ease-in-out md:relative md:translate-x-0 flex flex-col ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="p-4 space-y-3">
          <button 
            onClick={onNewChat}
            className="w-full flex items-center gap-2 bg-gray-800 hover:bg-gray-700 text-white px-4 py-3 rounded-lg border border-gray-700 transition-colors"
          >
            <Plus size={20} />
            <span className="font-medium">New Chat</span>
          </button>

          <div className="relative group">
            <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-blue-500 transition-colors" size={16} />
            <input
              type="text"
              placeholder="Search conversations..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-gray-950/50 text-gray-200 pl-9 pr-8 py-2 rounded-lg text-sm border border-transparent focus:border-blue-500/50 focus:bg-gray-900 outline-none transition-all placeholder-gray-500"
            />
            {searchQuery && (
              <button 
                onClick={() => setSearchQuery('')}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300"
              >
                <X size={14} />
              </button>
            )}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-2 space-y-1">
          {filteredChats.length === 0 && (
            <div className="text-gray-500 text-sm text-center mt-10 px-4">
              {chats.length === 0 ? 'No chat history.' : `No chats found for "${searchQuery}".`}
            </div>
          )}
          {filteredChats.map(chat => (
            <div 
              key={chat.id}
              onClick={() => {
                onSelectChat(chat.id);
                if (window.innerWidth < 768) onClose();
              }}
              className={`group flex items-center justify-between p-3 rounded-lg cursor-pointer transition-colors ${currentChatId === chat.id ? 'bg-gray-800' : 'hover:bg-gray-800/50'}`}
            >
              <div className="flex items-center gap-3 overflow-hidden">
                <MessageSquare size={16} className="text-gray-400 shrink-0" />
                <div className="flex flex-col overflow-hidden">
                  <span className="truncate text-sm text-gray-300 group-hover:text-white">
                    {chat.title || 'New Chat'}
                  </span>
                  {searchQuery && (
                    <span className="text-xs text-gray-500 truncate">
                      {chat.messages.length} msgs
                    </span>
                  )}
                </div>
              </div>
              <button 
                onClick={(e) => onDeleteChat(chat.id, e)}
                className="opacity-0 group-hover:opacity-100 p-1 hover:text-red-400 transition-opacity"
              >
                <Trash2 size={14} />
              </button>
            </div>
          ))}
        </div>

        <div className="p-4 border-t border-gray-800 space-y-2">
          <button 
            onClick={toggleTheme}
            className="flex items-center gap-3 w-full p-3 rounded-lg hover:bg-gray-800 transition-colors text-sm text-gray-300"
          >
            {isDarkMode ? <Sun size={18} /> : <Moon size={18} />}
            {isDarkMode ? 'Light Mode' : 'Dark Mode'}
          </button>
          <button 
            onClick={onOpenSettings}
            className="flex items-center gap-3 w-full p-3 rounded-lg hover:bg-gray-800 transition-colors text-sm text-gray-300"
          >
            <Settings size={18} />
            Settings & Assistants
          </button>
        </div>
      </div>
    </>
  );
};

const ChatArea: React.FC<ChatAreaProps> = ({
  currentChat,
  inputMessage,
  setInputMessage,
  onSendMessage,
  isStreaming,
  streamingContent,
  files,
  onRemoveFile,
  onFileUpload,
  messagesEndRef,
  stopGeneration,
  settings,
  onGenerateImage,
  onExportChat,
  onShareChat
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      onSendMessage();
    }
  };

  const setQuickPrompt = (prompt: string) => {
    setInputMessage(prompt);
  };

  const renderMessageContent = (content: string) => {
    if (content.startsWith('data:image')) {
      return (
        <div className="mt-2">
          <img src={content} alt="Generated or uploaded" className="max-w-full md:max-w-md rounded-lg shadow-sm border dark:border-gray-700" />
        </div>
      );
    }
    return (
      <ReactMarkdown
        components={{
          code({node, inline, className, children, ...props}: any) {
            const match = /language-(\w+)/.exec(className || '');
            return !inline && match ? (
              <div className="rounded-md overflow-hidden my-2 border border-gray-200 dark:border-gray-700">
                <div className="bg-gray-100 dark:bg-gray-800 px-3 py-1 text-xs text-gray-500 font-mono border-b border-gray-200 dark:border-gray-700">
                  {match[1]}
                </div>
                <SyntaxHighlighter
                  style={vscDarkPlus}
                  language={match[1]}
                  PreTag="div"
                  {...props}
                >
                  {String(children).replace(/\n$/, '')}
                </SyntaxHighlighter>
              </div>
            ) : (
              <code className={`${className} bg-gray-200 dark:bg-gray-800 rounded px-1 py-0.5 text-sm font-mono`} {...props}>
                {children}
              </code>
            );
          }
        }}
        className="prose dark:prose-invert max-w-none text-sm md:text-base leading-relaxed break-words"
      >
        {content}
      </ReactMarkdown>
    );
  };

  if (!currentChat) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 bg-white dark:bg-gray-900 text-center">
        <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-2xl flex items-center justify-center mb-6">
          <Bot size={32} />
        </div>
        <h2 className="text-2xl font-bold mb-2">Welcome to 1lineAi</h2>
        <p className="text-gray-500 max-w-md">
          Start a new conversation to experience the power of Gemini. 
          Use the sidebar to manage history or configure your assistant in settings.
        </p>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col h-full bg-white dark:bg-gray-900 relative">
      {/* Header */}
      <div className="h-16 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between px-4 sticky top-0 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm z-10">
        <div className="font-semibold text-lg truncate max-w-xs md:max-w-md">
          {currentChat.title || 'New Conversation'}
        </div>
        <div className="flex items-center gap-2">
          <div className="hidden md:block text-xs font-medium px-2 py-1 bg-gray-100 dark:bg-gray-800 rounded text-gray-500 mr-2">
            {MODELS.find(m => m.id === settings.defaultModel)?.name}
          </div>
          
          <button 
            onClick={onShareChat}
            className="p-2 text-gray-500 hover:text-blue-600 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
            title="Share Chat"
          >
            <Share2 size={20} />
          </button>
          
          <button 
            onClick={onExportChat}
            className="p-2 text-gray-500 hover:text-blue-600 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
            title="Export Chat to Text File"
          >
            <Download size={20} />
          </button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6 scroll-smooth pb-36">
        {currentChat.messages.length === 0 && (
           <div className="flex flex-col items-center justify-center h-full text-gray-400">
              <Sparkles size={48} className="mb-4 opacity-20" />
              <p>Ask anything or generate an image.</p>
           </div>
        )}
        
        {currentChat.messages.map((msg) => (
          <div 
            key={msg.id} 
            className={`flex gap-4 ${msg.role === Role.USER ? 'flex-row-reverse' : 'flex-row'} max-w-4xl mx-auto`}
          >
            <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${msg.role === Role.USER ? 'bg-blue-600 text-white' : 'bg-green-600 text-white'}`}>
              {msg.role === Role.USER ? 'U' : <Bot size={18} />}
            </div>
            
            <div className={`flex flex-col max-w-[85%] md:max-w-[75%] ${msg.role === Role.USER ? 'items-end' : 'items-start'}`}>
               {/* Attachments if any */}
               {msg.attachments && msg.attachments.length > 0 && (
                 <div className="mb-2 flex gap-2 flex-wrap justify-end">
                   {msg.attachments.map((att, idx) => (
                     <img key={idx} src={att} alt="attachment" className="w-32 h-32 object-cover rounded-lg border dark:border-gray-700" />
                   ))}
                 </div>
               )}
              
              <div className={`px-4 py-3 rounded-2xl shadow-sm ${
                msg.role === Role.USER 
                  ? 'bg-blue-600 text-white rounded-tr-none' 
                  : 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded-tl-none border border-gray-200 dark:border-gray-700'
              }`}>
                {renderMessageContent(msg.content)}
              </div>
              <span className="text-xs text-gray-400 mt-1 px-1">
                {new Date(msg.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
              </span>
            </div>
          </div>
        ))}

        {isStreaming && (
          <div className="flex gap-4 flex-row max-w-4xl mx-auto">
             <div className="w-8 h-8 rounded-full bg-green-600 text-white flex items-center justify-center shrink-0 animate-pulse">
                <Bot size={18} />
             </div>
             <div className="flex flex-col max-w-[85%] items-start">
               <div className="px-4 py-3 rounded-2xl rounded-tl-none bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100 border border-gray-200 dark:border-gray-700">
                 {streamingContent ? renderMessageContent(streamingContent) : <span className="animate-pulse">Thinking...</span>}
               </div>
             </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-white via-white to-transparent dark:from-gray-900 dark:via-gray-900 z-10">
        <div className="max-w-3xl mx-auto">
          
          {/* File Previews & Quick Actions */}
          {files.length > 0 && (
            <div className="mb-2 space-y-2">
               {/* Quick Actions for Images */}
               <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide snap-x">
                 
                 <button onClick={() => setQuickPrompt("Act as a gentle teacher for children. Look at this image and explain it simply. Identify colors, count objects, compare sizes (big/small, tall/short), and mention matching shapes or items.")} className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 dark:bg-gray-800 hover:bg-blue-100 dark:hover:bg-blue-900/30 text-xs font-medium rounded-full border border-gray-200 dark:border-gray-700 transition-colors whitespace-nowrap text-gray-700 dark:text-gray-300 snap-start">
                    <GraduationCap size={14} className="text-indigo-500" /> Teach Kids
                 </button>

                 <button onClick={() => setQuickPrompt("Identify the main object in this image. What is it, what is it used for? Provide a clear answer.")} className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 dark:bg-gray-800 hover:bg-blue-100 dark:hover:bg-blue-900/30 text-xs font-medium rounded-full border border-gray-200 dark:border-gray-700 transition-colors whitespace-nowrap text-gray-700 dark:text-gray-300 snap-start">
                    <HelpCircle size={14} className="text-amber-500" /> What is this?
                 </button>

                 <button onClick={() => setQuickPrompt("Identify the car brand, model, year, and key features. Estimate its price.")} className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 dark:bg-gray-800 hover:bg-blue-100 dark:hover:bg-blue-900/30 text-xs font-medium rounded-full border border-gray-200 dark:border-gray-700 transition-colors whitespace-nowrap text-gray-700 dark:text-gray-300 snap-start">
                    <Car size={14} className="text-purple-500" /> Identify Car
                 </button>

                 <button onClick={() => setQuickPrompt("Analyze the image to estimate the physical dimensions (height, width, depth) of the main objects. Compare with surrounding elements to provide a scale estimation.")} className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 dark:bg-gray-800 hover:bg-blue-100 dark:hover:bg-blue-900/30 text-xs font-medium rounded-full border border-gray-200 dark:border-gray-700 transition-colors whitespace-nowrap text-gray-700 dark:text-gray-300 snap-start">
                    <Ruler size={14} className="text-blue-500" /> Measure Size
                 </button>

                 <button onClick={() => setQuickPrompt("Identify any logos, brands, or products in this image. Provide details about the brand reputation and key product features.")} className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 dark:bg-gray-800 hover:bg-blue-100 dark:hover:bg-blue-900/30 text-xs font-medium rounded-full border border-gray-200 dark:border-gray-700 transition-colors whitespace-nowrap text-gray-700 dark:text-gray-300 snap-start">
                    <Tag size={14} className="text-green-500" /> Detect Brands
                 </button>

                 <button onClick={() => setQuickPrompt("Analyze the color palette, hex codes, and identify dominant colors.")} className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 dark:bg-gray-800 hover:bg-blue-100 dark:hover:bg-blue-900/30 text-xs font-medium rounded-full border border-gray-200 dark:border-gray-700 transition-colors whitespace-nowrap text-gray-700 dark:text-gray-300 snap-start">
                    <Palette size={14} className="text-pink-500" /> Colors
                 </button>
                 
               </div>

               <div className="flex gap-3 overflow-x-auto pb-1">
                {files.map((file, i) => (
                  <div key={i} className="relative group shrink-0">
                    <div className="w-16 h-16 rounded-lg bg-gray-100 dark:bg-gray-800 border dark:border-gray-700 flex items-center justify-center overflow-hidden">
                      {file.type.startsWith('image/') ? (
                        <img src={URL.createObjectURL(file)} alt="preview" className="w-full h-full object-cover" />
                      ) : (
                        <Paperclip size={20} className="text-gray-400" />
                      )}
                    </div>
                    <button 
                      onClick={() => onRemoveFile(i)}
                      className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full p-0.5 shadow-md opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X size={12} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-xl shadow-lg flex flex-col transition-shadow focus-within:ring-2 focus-within:ring-blue-500/50">
            <textarea
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Message 1lineAi..."
              className="w-full bg-transparent border-none p-3 max-h-48 min-h-[50px] resize-none focus:ring-0 text-gray-900 dark:text-gray-100 placeholder-gray-400"
              rows={1}
              style={{ minHeight: '52px' }}
            />
            
            <div className="flex items-center justify-between p-2 border-t border-gray-100 dark:border-gray-700">
              <div className="flex items-center gap-1">
                <input 
                  type="file" 
                  ref={fileInputRef}
                  className="hidden" 
                  onChange={onFileUpload}
                  accept="image/*"
                  multiple
                />
                <button 
                  onClick={() => fileInputRef.current?.click()}
                  className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                  title="Upload Image"
                >
                  <ImageIcon size={20} />
                </button>
                
                <button 
                  onClick={onGenerateImage}
                  className="p-2 text-gray-400 hover:text-purple-500 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                  title="Generate Image from Text"
                >
                  <Sparkles size={20} />
                </button>
              </div>

              <div className="flex items-center gap-2">
                 {isStreaming ? (
                   <button 
                    onClick={stopGeneration}
                    className="p-2 bg-gray-800 dark:bg-white text-white dark:text-gray-900 rounded-lg hover:opacity-90 transition-opacity"
                   >
                     <StopCircle size={18} />
                   </button>
                 ) : (
                   <button 
                    onClick={onSendMessage}
                    disabled={!inputMessage.trim() && files.length === 0}
                    className="p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    <Send size={18} />
                  </button>
                 )}
              </div>
            </div>
          </div>
          <div className="text-center text-xs text-gray-400 mt-2">
            AI can make mistakes. Check important info.
          </div>
        </div>
      </div>
    </div>
  );
};

const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  settings,
  onSaveSettings
}) => {
  const [localSettings, setLocalSettings] = useState(settings);
  const [isEditingPersona, setIsEditingPersona] = useState(false);
  const [newPersona, setNewPersona] = useState<Persona>({ name: '', systemPrompt: '' });

  useEffect(() => {
    setLocalSettings(settings);
  }, [settings, isOpen]);

  if (!isOpen) return null;

  const handleSave = () => {
    onSaveSettings(localSettings);
    onClose();
  };

  const handleAddPersona = () => {
    if (newPersona.name && newPersona.systemPrompt) {
       setLocalSettings(prev => ({
         ...prev,
         savedPersonas: [...prev.savedPersonas, newPersona]
       }));
       setNewPersona({ name: '', systemPrompt: '' });
       setIsEditingPersona(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl">
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700 sticky top-0 bg-white dark:bg-gray-800 z-10">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <Settings size={24} />
            Settings
          </h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="p-6 space-y-8">
          {/* Model Selection */}
          <section>
            <h3 className="text-lg font-semibold mb-4 text-blue-600 dark:text-blue-400">Model Configuration</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {MODELS.map(model => (
                <div 
                  key={model.id}
                  onClick={() => setLocalSettings(s => ({ ...s, defaultModel: model.id }))}
                  className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${localSettings.defaultModel === model.id ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' : 'border-gray-200 dark:border-gray-700 hover:border-blue-300'}`}
                >
                  <div className="font-bold flex justify-between items-center">
                    {model.name}
                    {localSettings.defaultModel === model.id && <CheckCircle size={16} className="text-blue-500" />}
                  </div>
                  <div className="text-sm text-gray-500 mt-1">{model.description}</div>
                </div>
              ))}
            </div>
          </section>

          {/* Persona / Assistant Settings */}
          <section>
            <h3 className="text-lg font-semibold mb-4 text-blue-600 dark:text-blue-400">Assistants & Personas</h3>
            <p className="text-sm text-gray-500 mb-4">Select or create a persona to define how the AI behaves.</p>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mb-4">
              {localSettings.savedPersonas.map((persona, idx) => (
                <button
                  key={idx}
                  onClick={() => setLocalSettings(s => ({ ...s, activePersona: persona }))}
                  className={`px-4 py-2 rounded-lg text-sm font-medium border transition-colors truncate ${localSettings.activePersona.name === persona.name ? 'bg-blue-600 text-white border-blue-600' : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 border-transparent hover:bg-gray-200 dark:hover:bg-gray-600'}`}
                >
                  {persona.name}
                </button>
              ))}
              <button 
                onClick={() => setIsEditingPersona(true)}
                className="px-4 py-2 rounded-lg text-sm font-medium border border-dashed border-gray-400 text-gray-500 hover:text-blue-500 hover:border-blue-500 flex items-center justify-center gap-1 transition-colors"
              >
                <Plus size={16} /> New Persona
              </button>
            </div>

            {isEditingPersona && (
              <div className="bg-gray-50 dark:bg-gray-900 p-4 rounded-xl border border-gray-200 dark:border-gray-700 space-y-4 animate-in fade-in slide-in-from-top-2">
                <input 
                  type="text" 
                  placeholder="Assistant Name (e.g., Coding Expert)" 
                  className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 focus:ring-2 focus:ring-blue-500 outline-none"
                  value={newPersona.name}
                  onChange={e => setNewPersona(p => ({ ...p, name: e.target.value }))}
                />
                <textarea 
                  placeholder="System Instructions (e.g., You are a senior React engineer...)" 
                  className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 focus:ring-2 focus:ring-blue-500 outline-none h-32 resize-none"
                  value={newPersona.systemPrompt}
                  onChange={e => setNewPersona(p => ({ ...p, systemPrompt: e.target.value }))}
                />
                <div className="flex justify-end gap-2">
                  <button onClick={() => setIsEditingPersona(false)} className="px-4 py-2 text-sm text-gray-500 hover:text-gray-700">Cancel</button>
                  <button onClick={handleAddPersona} className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700">Save Persona</button>
                </div>
              </div>
            )}
            
            <div className="bg-gray-50 dark:bg-gray-900 p-4 rounded-xl border border-gray-200 dark:border-gray-700 mt-2">
               <h4 className="text-xs font-bold uppercase text-gray-400 mb-2">Active System Instruction</h4>
               <p className="text-sm italic text-gray-600 dark:text-gray-300">
                 "{localSettings.activePersona.systemPrompt}"
               </p>
            </div>
          </section>
        </div>

        <div className="p-6 border-t border-gray-200 dark:border-gray-700 flex justify-end gap-3 bg-gray-50 dark:bg-gray-900/50">
          <button onClick={onClose} className="px-5 py-2.5 rounded-lg font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors">
            Cancel
          </button>
          <button onClick={handleSave} className="px-5 py-2.5 rounded-lg font-medium bg-blue-600 text-white hover:bg-blue-700 shadow-lg shadow-blue-500/20 transition-all">
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
};

// --- Main App Component ---

const App: React.FC = () => {
  // State
  const [chats, setChats] = useState<Chat[]>([]);
  const [currentChatId, setCurrentChatId] = useState<string | null>(null);
  const [inputMessage, setInputMessage] = useState('');
  const [files, setFiles] = useState<File[]>([]);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Streaming & Generation State
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamingContent, setStreamingContent] = useState('');
  
  // Settings State
  const [settings, setSettings] = useState<AppSettings>({
    defaultModel: ModelId.GEMINI_FLASH,
    activePersona: DEFAULT_PERSONAS[0],
    savedPersonas: DEFAULT_PERSONAS
  });

  // Refs
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Effects
  useEffect(() => {
    const savedChats = localStorage.getItem('aether_chats');
    if (savedChats) setChats(JSON.parse(savedChats));
    
    const savedSettings = localStorage.getItem('aether_settings');
    if (savedSettings) setSettings(JSON.parse(savedSettings));

    // Initialize logic
    const html = document.documentElement;
    if (isDarkMode) html.classList.add('dark');
    else html.classList.remove('dark');
  }, []);

  useEffect(() => {
    localStorage.setItem('aether_chats', JSON.stringify(chats));
  }, [chats]);

  useEffect(() => {
    localStorage.setItem('aether_settings', JSON.stringify(settings));
  }, [settings]);

  useEffect(() => {
    if (isDarkMode) document.documentElement.classList.add('dark');
    else document.documentElement.classList.remove('dark');
  }, [isDarkMode]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chats, streamingContent]);

  // Handlers
  const handleNewChat = () => {
    const newChat: Chat = {
      id: crypto.randomUUID(),
      title: 'New Chat',
      messages: [],
      createdAt: Date.now(),
      modelId: settings.defaultModel
    };
    setChats(prev => [newChat, ...prev]);
    setCurrentChatId(newChat.id);
    setIsSidebarOpen(false);
    setInputMessage('');
    setFiles([]);
    setSearchQuery('');
  };

  const handleDeleteChat = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setChats(prev => prev.filter(c => c.id !== id));
    if (currentChatId === id) setCurrentChatId(null);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFiles(prev => [...prev, ...Array.from(e.target.files || [])]);
    }
  };

  const handleExportChat = () => {
    if (!currentChatId) return;
    const currentChat = chats.find(c => c.id === currentChatId);
    if (!currentChat) return;

    const content = currentChat.messages.map(m => 
      `[${new Date(m.timestamp).toLocaleString()}] ${m.role === Role.USER ? 'User' : 'AI'}:\n${m.content}\n`
    ).join('\n' + '-'.repeat(40) + '\n');

    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${currentChat.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleShareChat = async () => {
    if (!currentChatId) return;
    const currentChat = chats.find(c => c.id === currentChatId);
    if (!currentChat) return;

    const text = currentChat.messages.map(m => 
      `${m.role === Role.USER ? 'User' : 'AI'}: ${m.content}`
    ).join('\n\n');

    if (navigator.share) {
      try {
        await navigator.share({
          title: currentChat.title,
          text: text,
        });
      } catch (err) {
        // share cancelled
      }
    } else {
      try {
        await navigator.clipboard.writeText(text);
        // We could show a toast here, but native alert is consistent with previous simple prompts
        alert('Conversation copied to clipboard.');
      } catch (err) {
        console.error('Failed to copy', err);
      }
    }
  };

  const handleGenerateImage = async () => {
    if (!inputMessage.trim() || !currentChatId) return;

    const chat = chats.find(c => c.id === currentChatId);
    if (!chat) return;

    const userMsg: Message = {
      id: crypto.randomUUID(),
      role: Role.USER,
      content: `Generate image: ${inputMessage}`,
      timestamp: Date.now()
    };

    const updatedChats = chats.map(c => 
      c.id === currentChatId 
        ? { ...c, messages: [...c.messages, userMsg], title: c.messages.length === 0 ? inputMessage.slice(0, 30) : c.title } 
        : c
    );
    setChats(updatedChats);
    setInputMessage('');
    setIsStreaming(true);

    try {
      const imageUrl = await geminiService.generateImage(inputMessage);
      
      const aiMsg: Message = {
        id: crypto.randomUUID(),
        role: Role.AI,
        content: imageUrl, // base64 data url
        timestamp: Date.now()
      };
      
      setChats(prev => prev.map(c => 
        c.id === currentChatId 
          ? { ...c, messages: [...c.messages, aiMsg] } 
          : c
      ));

    } catch (error) {
       const errorMsg: Message = {
        id: crypto.randomUUID(),
        role: Role.AI,
        content: `Sorry, I couldn't generate that image. Error: ${error}`,
        timestamp: Date.now()
      };
      setChats(prev => prev.map(c => c.id === currentChatId ? { ...c, messages: [...c.messages, errorMsg] } : c));
    } finally {
      setIsStreaming(false);
    }
  };

  const handleSendMessage = async () => {
    if ((!inputMessage.trim() && files.length === 0) || !currentChatId) {
      if (!currentChatId) handleNewChat(); 
      else return;
    }
    
    let activeChatId = currentChatId;
    if (!activeChatId) {
      const newChat: Chat = {
        id: crypto.randomUUID(),
        title: inputMessage.slice(0, 30) || 'New Chat',
        messages: [],
        createdAt: Date.now(),
        modelId: settings.defaultModel
      };
      setChats(prev => [newChat, ...prev]);
      activeChatId = newChat.id;
      setCurrentChatId(newChat.id);
    }

    const filePromises = files.map(file => {
      return new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.readAsDataURL(file);
      });
    });
    const attachments = await Promise.all(filePromises);

    const userMsg: Message = {
      id: crypto.randomUUID(),
      role: Role.USER,
      content: inputMessage,
      attachments: attachments,
      timestamp: Date.now()
    };

    setChats(prev => prev.map(c => 
      c.id === activeChatId 
        ? { ...c, messages: [...c.messages, userMsg], title: c.messages.length === 0 ? inputMessage.slice(0, 30) : c.title } 
        : c
    ));

    setInputMessage('');
    setFiles([]);
    setIsStreaming(true);
    setStreamingContent('');
    
    abortControllerRef.current = new AbortController();

    try {
      const currentChat = chats.find(c => c.id === activeChatId) || { messages: [] };
      const history = [...currentChat.messages, userMsg];

      await geminiService.streamChatResponse(
        history,
        settings.activePersona.systemPrompt,
        settings.defaultModel,
        files, 
        (chunk) => {
          setStreamingContent(prev => prev + chunk);
        }
      );

      setStreamingContent(finalContent => {
        const aiMsg: Message = {
          id: crypto.randomUUID(),
          role: Role.AI,
          content: finalContent,
          timestamp: Date.now()
        };
        
        setChats(prev => prev.map(c => 
          c.id === activeChatId 
            ? { ...c, messages: [...c.messages, aiMsg] } 
            : c
        ));
        return '';
      });

    } catch (error) {
      console.error(error);
      const errorMsg: Message = {
        id: crypto.randomUUID(),
        role: Role.AI,
        content: "I encountered an error processing your request. Please check your API key or connection.",
        timestamp: Date.now()
      };
      setChats(prev => prev.map(c => c.id === activeChatId ? { ...c, messages: [...c.messages, errorMsg] } : c));
    } finally {
      setIsStreaming(false);
      setStreamingContent('');
    }
  };

  const activeChat = chats.find(c => c.id === currentChatId) || null;

  return (
    <div className="flex h-screen overflow-hidden font-sans">
      <Sidebar 
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        chats={chats}
        currentChatId={currentChatId}
        onSelectChat={setCurrentChatId}
        onNewChat={handleNewChat}
        onDeleteChat={handleDeleteChat}
        toggleTheme={() => setIsDarkMode(!isDarkMode)}
        isDarkMode={isDarkMode}
        onOpenSettings={() => setIsSettingsOpen(true)}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
      />

      <div className="flex-1 flex flex-col min-w-0">
        <div className="md:hidden p-4 border-b border-gray-200 dark:border-gray-800 flex items-center bg-white dark:bg-gray-900">
           <button onClick={() => setIsSidebarOpen(true)} className="p-2 -ml-2 text-gray-600 dark:text-gray-300">
             <Menu size={24} />
           </button>
           <span className="font-semibold ml-2 text-gray-900 dark:text-white truncate">
             {activeChat?.title || 'New Chat'}
           </span>
        </div>

        <ChatArea 
          currentChat={activeChat}
          inputMessage={inputMessage}
          setInputMessage={setInputMessage}
          onSendMessage={handleSendMessage}
          isStreaming={isStreaming}
          streamingContent={streamingContent}
          files={files}
          onRemoveFile={(index) => setFiles(prev => prev.filter((_, i) => i !== index))}
          onFileUpload={handleFileUpload}
          messagesEndRef={messagesEndRef}
          stopGeneration={() => abortControllerRef.current?.abort()}
          settings={settings}
          onGenerateImage={handleGenerateImage}
          onExportChat={handleExportChat}
          onShareChat={handleShareChat}
        />
      </div>

      <SettingsModal 
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        settings={settings}
        onSaveSettings={setSettings}
      />
    </div>
  );
};

export default App;