import React, { useState, useEffect, useRef } from 'react';
import '../styles/components/Chatbot.css';

const Chatbot = ({ onBack, user }) => {
    const STORAGE_KEY = `chatbot_history_${user?.id || 'guest'}`;

    const [messages, setMessages] = useState(() => {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) {
            try {
                return JSON.parse(saved);
            } catch (e) {
                console.error('Failed to parse chat history', e);
            }
        }
        return [{
            id: 1,
            role: 'assistant',
            content: `Hi ${user?.name || 'there'}! 👋 I'm your AI interview prep assistant. I can help you with:\n\n• Interview preparation strategies\n• Technical questions and concepts\n• Career advice\n• Resume tips\n• Coding explanations\n\nWhat would you like to know?`,
            timestamp: new Date()
        }];
    });
    const [inputValue, setInputValue] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isListening, setIsListening] = useState(false);
    const [isSpeaking, setIsSpeaking] = useState(false);
    const [voiceEnabled, setVoiceEnabled] = useState(false);
    const messagesEndRef = useRef(null);
    const recognitionRef = useRef(null);
    const synthesisRef = useRef(null);

    const suggestedPrompts = [
        "How do I prepare for a technical interview?",
        "Explain the difference between REST and GraphQL",
        "What are common behavioral interview questions?",
        "Help me understand Big O notation"
    ];

    // Initialize speech recognition
    useEffect(() => {
        // Check speech synthesis support and load voices
        if ('speechSynthesis' in window) {
            // Load voices
            const loadVoices = () => {
                const voices = window.speechSynthesis.getVoices();
                console.log('🔊 Available voices:', voices.length);
                if (voices.length > 0) {
                    console.log('🔊 First voice:', voices[0].name, voices[0].lang);
                }
            };
            
            loadVoices();
            window.speechSynthesis.onvoiceschanged = loadVoices;
        } else {
            console.error('🔇 Speech synthesis not supported in this browser');
        }

        if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
            const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
            recognitionRef.current = new SpeechRecognition();
            recognitionRef.current.continuous = false;
            recognitionRef.current.interimResults = false;
            recognitionRef.current.lang = 'en-US';

            recognitionRef.current.onstart = () => {
                console.log('🎤 Voice recognition started');
                setIsListening(true);
            };

            recognitionRef.current.onresult = (event) => {
                const transcript = event.results[0][0].transcript;
                console.log('🎤 Transcript:', transcript);
                setInputValue(transcript);
                setIsListening(false);
                // Automatically send the message
                setTimeout(() => handleSendMessage(transcript), 100);
            };

            recognitionRef.current.onerror = (event) => {
                console.error('🎤 Speech recognition error:', event.error);
                setIsListening(false);
            };

            recognitionRef.current.onend = () => {
                console.log('🎤 Voice recognition ended');
                setIsListening(false);
            };
        }

        return () => {
            if (recognitionRef.current) {
                recognitionRef.current.stop();
            }
            if (synthesisRef.current) {
                window.speechSynthesis.cancel();
            }
        };
    }, []);

    // Text-to-speech function
    const speakText = (text, forceSpeak = false) => {
        console.log('🔊 speakText called. Voice enabled:', voiceEnabled, 'Force speak:', forceSpeak);
        
        // If manually triggered (forceSpeak), ignore voiceEnabled state
        if (!forceSpeak && !voiceEnabled) {
            console.log('🔇 Voice mode is disabled, skipping TTS');
            return;
        }
        
        if (!('speechSynthesis' in window)) {
            console.error('🔇 Speech synthesis not supported');
            alert('Text-to-speech is not supported in your browser. Please use Chrome, Edge, or Safari.');
            return;
        }

        // Cancel any ongoing speech
        window.speechSynthesis.cancel();

        console.log('🔊 Starting speech synthesis for:', text.substring(0, 50) + '...');

        const utterance = new SpeechSynthesisUtterance(text);
        utterance.rate = 1.0;
        utterance.pitch = 1.0;
        utterance.volume = 1.0;
        utterance.lang = 'en-US';
        
        // Try to use a good English voice
        const voices = window.speechSynthesis.getVoices();
        const englishVoice = voices.find(voice => voice.lang.startsWith('en')) || voices[0];
        if (englishVoice) {
            utterance.voice = englishVoice;
            console.log('🔊 Using voice:', englishVoice.name);
        }

        utterance.onstart = () => {
            console.log('🔊 ✅ Speech STARTED successfully!');
            setIsSpeaking(true);
        };

        utterance.onend = () => {
            console.log('🔊 Speech ended normally');
            setIsSpeaking(false);
        };

        utterance.onerror = (event) => {
            console.error('🔊 ❌ Speech ERROR:', event.error, event);
            alert(`Speech error: ${event.error}. Please check your browser settings.`);
            setIsSpeaking(false);
        };

        synthesisRef.current = utterance;
        
        // Speak immediately
        try {
            window.speechSynthesis.speak(utterance);
            console.log('🔊 Speech utterance queued');
            console.log('🔊 Is speaking?', window.speechSynthesis.speaking);
            console.log('🔊 Is pending?', window.speechSynthesis.pending);
            console.log('🔊 Is paused?', window.speechSynthesis.paused);
        } catch (error) {
            console.error('🔊 Exception when calling speak():', error);
            alert('Failed to start speech: ' + error.message);
        }
    };

    // Start voice input
    const startVoiceInput = () => {
        if (!recognitionRef.current) {
            alert('Voice recognition is not supported in your browser. Please use Chrome, Edge, or Safari.');
            return;
        }

        if (isListening) {
            recognitionRef.current.stop();
        } else {
            recognitionRef.current.start();
        }
    };

    // Stop speech
    const stopSpeaking = () => {
        window.speechSynthesis.cancel();
        setIsSpeaking(false);
    };

    // Auto-scroll to bottom when new messages arrive
    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    // Log voice mode changes
    useEffect(() => {
        console.log('🔊 Voice mode changed to:', voiceEnabled ? 'ON' : 'OFF');
    }, [voiceEnabled]);

    // Auto-speak new AI messages when voice mode is enabled
    useEffect(() => {
        // Skip if voice mode is off
        if (!voiceEnabled) return;
        
        // Get the last message
        const lastMessage = messages[messages.length - 1];
        
        // Only speak if it's from the assistant and not the initial message
        if (lastMessage && lastMessage.role === 'assistant' && messages.length > 1) {
            console.log('🔊 New AI message detected, auto-speaking...');
            // Small delay to ensure message is rendered
            setTimeout(() => {
                speakText(lastMessage.content, true);
            }, 400);
        }
    }, [messages, voiceEnabled]);

    // Save to localStorage whenever messages change
    useEffect(() => {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(messages));
        scrollToBottom();
    }, [messages, STORAGE_KEY]);

    const handleSendMessage = async (messageText = inputValue) => {
        if (!messageText.trim() || isLoading) return;

        const userMessage = {
            id: Date.now(),
            role: 'user',
            content: messageText.trim(),
            timestamp: new Date()
        };

        setMessages(prev => [...prev, userMessage]);
        setInputValue('');
        setIsLoading(true);

        try {
            // Get last 10 messages for context
            const conversationHistory = messages.slice(-10).map(msg => ({
                role: msg.role,
                content: msg.content
            }));

            const response = await fetch('/api/chat', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    message: messageText.trim(),
                    conversationHistory
                })
            });

            if (!response.ok) {
                throw new Error('Failed to get response');
            }

            const data = await response.json();

            const aiMessage = {
                id: Date.now() + 1,
                role: 'assistant',
                content: data.reply,
                timestamp: new Date()
            };

            setMessages(prev => [...prev, aiMessage]);
            
            // The useEffect will automatically speak the message if voice mode is ON
            console.log('📤 AI response added to messages. Auto-speak will trigger via useEffect.');
        } catch (error) {
            console.error('Chat error:', error);
            const errorMessage = {
                id: Date.now() + 1,
                role: 'assistant',
                content: "I'm sorry, I'm having trouble responding right now. Please try again in a moment.",
                timestamp: new Date()
            };
            setMessages(prev => [...prev, errorMessage]);
        } finally {
            setIsLoading(false);
        }
    };

    const handleKeyPress = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSendMessage();
        }
    };

    const handleClearHistory = () => {
        const initialMessage = {
            id: Date.now(),
            role: 'assistant',
            content: `Chat history cleared! How can I help you today?`,
            timestamp: new Date()
        };
        setMessages([initialMessage]);
        localStorage.setItem(STORAGE_KEY, JSON.stringify([initialMessage]));
    };

    const formatTime = (timestamp) => {
        return new Date(timestamp).toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const handleVoiceToggle = () => {
        const newState = !voiceEnabled;
        console.log('🔊 Voice toggle clicked. New state:', newState ? 'ON' : 'OFF');
        setVoiceEnabled(newState);
        
        // Test speech immediately when enabling
        if (newState) {
            if ('speechSynthesis' in window) {
                const testUtterance = new SpeechSynthesisUtterance('Voice mode is now activated. I will speak all my responses.');
                testUtterance.rate = 1.0;
                testUtterance.volume = 1.0;
                testUtterance.lang = 'en-US';
                
                testUtterance.onstart = () => {
                    console.log('🔊 ✅ Test speech started - Audio is working!');
                };
                
                testUtterance.onerror = (event) => {
                    console.error('🔊 ❌ Test speech error:', event.error);
                    alert('Speech test failed: ' + event.error + '. Please check your browser audio settings.');
                };
                
                window.speechSynthesis.speak(testUtterance);
                console.log('🔊 Test utterance queued');
            } else {
                alert('Text-to-speech is not supported in your browser. Please use Chrome, Edge, or Safari.');
            }
        } else {
            // Stop any ongoing speech when disabling
            window.speechSynthesis.cancel();
            console.log('🔇 Voice mode disabled, cancelled ongoing speech');
        }
    };

    return (
        <div className="chatbot-container">
            <div className="chatbot-header">
                <div className="chatbot-title">
                    <h1>🤖 AI Interview Assistant</h1>
                    <p>Ask me anything about interview preparation!</p>
                </div>
                <div className="header-controls">
                    <button 
                        onClick={handleVoiceToggle} 
                        className={`voice-toggle ${voiceEnabled ? 'active' : ''}`}
                        title={voiceEnabled ? 'Voice Mode: ON - AI responses will be spoken automatically' : 'Voice Mode: OFF - Click to enable automatic voice responses'}
                    >
                        {voiceEnabled ? '🔊 Auto-Speak ON' : '🔇 Auto-Speak OFF'}
                    </button>
                    <button onClick={handleClearHistory} className="clear-button">
                        🗑️ Clear History
                    </button>
                </div>
            </div>

            <div className="chatbot-messages">
                {messages.map((message) => (
                    <div
                        key={message.id}
                        className={`message ${message.role === 'user' ? 'user-message' : 'ai-message'}`}
                    >
                        <div className="message-avatar">
                            {message.role === 'user' ? '👤' : '🤖'}
                        </div>
                        <div className="message-content">
                            <div className="message-text">{message.content}</div>
                            <div className="message-footer">
                                <div className="message-time">{formatTime(message.timestamp)}</div>
                                {message.role === 'assistant' && (
                                    <button 
                                        className="speak-message-btn"
                                        onClick={() => speakText(message.content, true)}
                                        disabled={isSpeaking}
                                        title="Click to hear this message"
                                    >
                                        {isSpeaking ? '🔊 Speaking...' : '🔊 Speak'}
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                ))}

                {isLoading && (
                    <div className="message ai-message">
                        <div className="message-avatar">🤖</div>
                        <div className="message-content">
                            <div className="typing-indicator">
                                <span></span>
                                <span></span>
                                <span></span>
                            </div>
                        </div>
                    </div>
                )}

                <div ref={messagesEndRef} />
            </div>

            {isSpeaking && (
                <div className="speaking-indicator">
                    🔊 AI is speaking...
                </div>
            )}

            {isListening && (
                <div className="listening-indicator">
                    🎙️ Listening... Speak now!
                </div>
            )}

            {messages.length === 1 && (
                <div className="suggested-prompts">
                    <p className="prompts-title">Try asking:</p>
                    <div className="prompts-grid">
                        {suggestedPrompts.map((prompt, index) => (
                            <button
                                key={index}
                                className="prompt-button"
                                onClick={() => handleSendMessage(prompt)}
                                disabled={isLoading}
                            >
                                {prompt}
                            </button>
                        ))}
                    </div>
                </div>
            )}

            <div className="chatbot-input">
                <button
                    onClick={startVoiceInput}
                    disabled={isLoading || isSpeaking}
                    className={`voice-button ${isListening ? 'listening' : ''}`}
                    title="Voice Input"
                >
                    {isListening ? '🎙️' : '🎤'}
                </button>
                <textarea
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder={isListening ? "Listening... Speak now!" : "Type your message... (Press Enter to send)"}
                    disabled={isLoading || isListening}
                    rows="1"
                />
                {isSpeaking ? (
                    <button
                        onClick={stopSpeaking}
                        className="stop-button"
                        title="Stop Speaking"
                    >
                        ⏹️
                    </button>
                ) : (
                    <button
                        onClick={() => handleSendMessage()}
                        disabled={!inputValue.trim() || isLoading}
                        className="send-button"
                    >
                        {isLoading ? '⏳' : '📤'}
                    </button>
                )}
            </div>
        </div>
    );
};

export default Chatbot;
