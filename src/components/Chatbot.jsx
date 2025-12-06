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
    const messagesEndRef = useRef(null);

    const suggestedPrompts = [
        "How do I prepare for a technical interview?",
        "Explain the difference between REST and GraphQL",
        "What are common behavioral interview questions?",
        "Help me understand Big O notation"
    ];

    // Auto-scroll to bottom when new messages arrive
    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

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

    return (
        <div className="chatbot-container">
            <button onClick={onBack} className="back-button nav-back-button">
                ← Back to Dashboard
            </button>
            <div className="chatbot-header">
                <div className="chatbot-title">
                    <h1>🤖 AI Interview Assistant</h1>
                    <p>Ask me anything about interview preparation!</p>
                </div>
                <button onClick={handleClearHistory} className="clear-button">
                    🗑️ Clear History
                </button>
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
                            <div className="message-time">{formatTime(message.timestamp)}</div>
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
                <textarea
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="Type your message... (Press Enter to send)"
                    disabled={isLoading}
                    rows="1"
                />
                <button
                    onClick={() => handleSendMessage()}
                    disabled={!inputValue.trim() || isLoading}
                    className="send-button"
                >
                    {isLoading ? '⏳' : '📤'}
                </button>
            </div>
        </div>
    );
};

export default Chatbot;
