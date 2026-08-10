import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { api, resolveImageUrl } from '../services/api';
import { getSocket } from '../services/socket';
import VerifiedBadge from './VerifiedBadge';
import ImageLightboxModal from './ImageLightboxModal';
import {
  Send,
  Image as ImageIcon,
  Search,
  MessageSquare,
  User,
  X,
  Loader,
  ArrowLeft,
  CheckCheck
} from 'lucide-react';

export default function MessagesView({ currentUser, onRequireAuth }) {
  const navigate = useNavigate();
  const { conversationId: routeConversationId } = useParams();
  const [searchParams] = useSearchParams();
  const targetUserId = searchParams.get('user');

  const [conversations, setConversations] = useState([]);
  const [loadingConversations, setLoadingConversations] = useState(true);

  const [activeConversation, setActiveConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [loadingMessages, setLoadingMessages] = useState(false);

  const [messageText, setMessageText] = useState('');
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [sending, setSending] = useState(false);

  // User Search State
  const [userSearchQuery, setUserSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searchingUsers, setSearchingUsers] = useState(false);

  // Typing state
  const [isPartnerTyping, setIsPartnerTyping] = useState(false);
  const typingTimeoutRef = useRef(null);

  // Lightbox State
  const [lightboxImage, setLightboxImage] = useState(null);

  const chatEndRef = useRef(null);
  const fileInputRef = useRef(null);

  // Auto-scroll to bottom of chat
  const scrollToBottom = (smooth = true) => {
    chatEndRef.current?.scrollIntoView({ behavior: smooth ? 'smooth' : 'auto' });
  };

  // 1. Fetch Conversations on Mount
  const fetchConversations = async () => {
    try {
      setLoadingConversations(true);
      const res = await api.getConversations();
      setConversations(res.conversations || []);
    } catch (err) {
      console.error('Failed to fetch conversations:', err);
    } finally {
      setLoadingConversations(false);
    }
  };

  useEffect(() => {
    if (!currentUser) {
      onRequireAuth('send direct messages');
      return;
    }
    fetchConversations();
  }, [currentUser]);

  // Handle route param or query param (?user=123)
  useEffect(() => {
    if (!currentUser || loadingConversations) return;

    if (routeConversationId) {
      const convId = parseInt(routeConversationId, 10);
      const found = conversations.find(c => c.id === convId);
      if (found) {
        selectConversation(found);
      } else {
        loadConversationById(convId);
      }
    } else if (targetUserId) {
      startChatWithUser(parseInt(targetUserId, 10));
    }
  }, [routeConversationId, targetUserId, loadingConversations]);

  const loadConversationById = async (convId) => {
    try {
      setLoadingMessages(true);
      const res = await api.getConversationMessages(convId);
      setActiveConversation({
        id: res.conversationId,
        otherUser: res.otherUser
      });
      setMessages(res.messages || []);
      setTimeout(() => scrollToBottom(false), 100);
    } catch (err) {
      console.error('Failed to load conversation:', err);
    } finally {
      setLoadingMessages(false);
    }
  };

  const selectConversation = async (conv) => {
    setActiveConversation(conv);
    navigate(`/messages/${conv.id}`, { replace: true });
    try {
      setLoadingMessages(true);
      const res = await api.getConversationMessages(conv.id);
      setMessages(res.messages || []);

      // Clear local unread count badge for this conversation
      setConversations(prev =>
        prev.map(c => (c.id === conv.id ? { ...c, unreadCount: 0 } : c))
      );

      // Emit socket mark_read event
      const socket = getSocket();
      if (socket && conv.otherUser) {
        socket.emit('mark_read', { conversationId: conv.id, senderId: conv.otherUser.id });
      }

      setTimeout(() => scrollToBottom(false), 100);
    } catch (err) {
      console.error('Failed to fetch messages for conversation:', err);
    } finally {
      setLoadingMessages(false);
    }
  };

  const startChatWithUser = async (userId) => {
    // Check if conversation already exists
    const existing = conversations.find(c => c.otherUser && c.otherUser.id === userId);
    if (existing) {
      selectConversation(existing);
      return;
    }

    try {
      setLoadingMessages(true);
      const targetUserRes = await api.getUserById(userId);
      if (targetUserRes && targetUserRes.user) {
        setActiveConversation({
          id: 'new',
          otherUser: targetUserRes.user
        });
        setMessages([]);
      }
    } catch (err) {
      console.error('Failed to start chat with user:', err);
    } finally {
      setLoadingMessages(false);
    }
  };

  // 2. User Directory Search
  useEffect(() => {
    if (!userSearchQuery.trim()) {
      setSearchResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      try {
        setSearchingUsers(true);
        const res = await api.searchMessagingUsers(userSearchQuery);
        setSearchResults(res.users || []);
      } catch (err) {
        console.error('User search failed:', err);
      } finally {
        setSearchingUsers(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [userSearchQuery]);

  const activeConversationRef = useRef(activeConversation);
  useEffect(() => {
    activeConversationRef.current = activeConversation;
  }, [activeConversation]);

  // 3. Socket Real-Time Event Listeners
  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;

    const handleNewMessage = (msg) => {
      const current = activeConversationRef.current;
      // Check if message belongs to active conversation
      if (
        current &&
        (current.id === msg.conversationId ||
          (current.otherUser && (msg.senderId === current.otherUser.id || msg.receiverId === current.otherUser.id)))
      ) {
        setMessages(prev => {
          if (prev.some(m => m.id === msg.id)) return prev;
          return [...prev, msg];
        });
        setTimeout(() => scrollToBottom(true), 100);

        // If active chat, mark as read immediately
        if (msg.senderId === current.otherUser?.id) {
          socket.emit('mark_read', { conversationId: msg.conversationId, senderId: msg.senderId });
        }
      }

      // Update conversation list preview
      setConversations(prev => {
        const index = prev.findIndex(c => c.id === msg.conversationId);
        if (index !== -1) {
          const updated = [...prev];
          const conv = { ...updated[index] };
          conv.lastMessage = {
            id: msg.id,
            content: msg.content,
            imageUrl: msg.imageUrl,
            senderId: msg.senderId,
            createdAt: msg.createdAt
          };
          conv.updatedAt = msg.createdAt;
          if (msg.senderId !== currentUser?.id) {
            conv.unreadCount = (conv.unreadCount || 0) + 1;
          }
          updated.splice(index, 1);
          return [conv, ...updated];
        } else {
          // Re-fetch conversation list to grab newly created conversation
          fetchConversations();
          return prev;
        }
      });
    };

    const handleUserTyping = ({ userId }) => {
      const current = activeConversationRef.current;
      if (current && current.otherUser && current.otherUser.id === userId) {
        setIsPartnerTyping(true);
      }
    };

    const handleUserStoppedTyping = ({ userId }) => {
      const current = activeConversationRef.current;
      if (current && current.otherUser && current.otherUser.id === userId) {
        setIsPartnerTyping(false);
      }
    };

    socket.on('new_direct_message', handleNewMessage);
    socket.on('user_typing', handleUserTyping);
    socket.on('user_stopped_typing', handleUserStoppedTyping);

    return () => {
      socket.off('new_direct_message', handleNewMessage);
      socket.off('user_typing', handleUserTyping);
      socket.off('user_stopped_typing', handleUserStoppedTyping);
    };
  }, [currentUser]);


  // Handle Typing Notification to Partner
  const handleInputChange = (e) => {
    setMessageText(e.target.value);

    const socket = getSocket();
    if (socket && activeConversation && activeConversation.otherUser) {
      socket.emit('typing_start', {
        recipientId: activeConversation.otherUser.id,
        conversationId: activeConversation.id
      });

      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = setTimeout(() => {
        socket.emit('typing_stop', {
          recipientId: activeConversation.otherUser.id,
          conversationId: activeConversation.id
        });
      }, 2000);
    }
  };

  // File Select Handler
  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const removeSelectedImage = () => {
    setImageFile(null);
    setImagePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // Send Message
  const handleSendMessage = async (e) => {
    e.preventDefault();
    if ((!messageText.trim() && !imageFile) || sending || !activeConversation) return;

    try {
      setSending(true);
      const recipientId = activeConversation.otherUser.id;

      const formData = new FormData();
      formData.append('recipientId', recipientId);
      if (messageText.trim()) formData.append('content', messageText.trim());
      if (imageFile) formData.append('image', imageFile);

      // Stop typing status
      const socket = getSocket();
      if (socket) {
        socket.emit('typing_stop', { recipientId, conversationId: activeConversation.id });
      }

      const res = await api.sendMessage(formData);

      setMessageText('');
      removeSelectedImage();

      if (activeConversation.id === 'new' && res.conversationId) {
        const newConv = {
          id: res.conversationId,
          otherUser: activeConversation.otherUser
        };
        setActiveConversation(newConv);
        navigate(`/messages/${res.conversationId}`, { replace: true });
        fetchConversations();
      }

      setMessages(prev => {
        if (prev.some(m => m.id === res.message.id)) return prev;
        return [...prev, res.message];
      });
      setTimeout(() => scrollToBottom(true), 100);

    } catch (err) {
      console.error('Failed to send message:', err);
      alert(err.message || 'Failed to send message');
    } finally {
      setSending(false);
    }
  };

  const formatTime = (dateStr) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="messages-container">
      {/* ── LEFT PANEL: Conversation List & Directory Search ── */}
      <div className={`messages-sidebar ${activeConversation ? 'hide-mobile' : ''}`}>
        <div className="messages-sidebar-header">
          <h2>Messages</h2>
          <div className="messages-search-box">
            <Search className="search-icon" size={18} />
            <input
              type="text"
              placeholder="Search students to message..."
              value={userSearchQuery}
              onChange={(e) => setUserSearchQuery(e.target.value)}
            />
            {userSearchQuery && (
              <button className="clear-search-btn" onClick={() => setUserSearchQuery('')}>
                <X size={16} />
              </button>
            )}
          </div>
        </div>

        {/* Directory Search Results dropdown */}
        {userSearchQuery.trim() !== '' && (
          <div className="user-search-results">
            {searchingUsers ? (
              <div className="search-loading">
                <Loader className="spinner" size={20} /> Searching students...
              </div>
            ) : searchResults.length > 0 ? (
              searchResults.map(user => (
                <div
                  key={user.id}
                  className="user-search-item"
                  onClick={() => {
                    setUserSearchQuery('');
                    startChatWithUser(user.id);
                  }}
                >
                  <div className="user-avatar-sm">
                    {user.avatarUrl ? (
                      <img src={resolveImageUrl(user.avatarUrl)} alt={user.name} />
                    ) : (
                      <div className="avatar-placeholder">{user.name.charAt(0)}</div>
                    )}
                  </div>
                  <div className="user-search-info">
                    <div className="user-name">
                      {user.name}
                      {user.isVerified && <VerifiedBadge />}
                    </div>
                    <div className="user-meta">{user.department || user.email}</div>
                  </div>
                </div>
              ))
            ) : (
              <div className="search-empty">No students found matching "{userSearchQuery}"</div>
            )}
          </div>
        )}

        {/* Conversation List */}
        <div className="conversations-list">
          {loadingConversations ? (
            <div className="conv-loading">
              <Loader className="spinner" size={24} />
              <span>Loading messages...</span>
            </div>
          ) : conversations.length === 0 ? (
            <div className="conv-empty">
              <MessageSquare size={36} />
              <p>No conversations yet.</p>
              <span>Search for a student above or message an author from any post.</span>
            </div>
          ) : (
            conversations.map(conv => {
              const isSelected = activeConversation && activeConversation.id === conv.id;
              const avatar = resolveImageUrl(conv.otherUser?.avatarUrl);
              return (
                <div
                  key={conv.id}
                  className={`conversation-card ${isSelected ? 'active' : ''}`}
                  onClick={() => selectConversation(conv)}
                >
                  <div className="conv-avatar">
                    {avatar ? (
                      <img src={avatar} alt={conv.otherUser?.name} />
                    ) : (
                      <div className="avatar-placeholder">{conv.otherUser?.name?.charAt(0) || 'U'}</div>
                    )}
                  </div>
                  <div className="conv-details">
                    <div className="conv-top">
                      <span className="conv-name">
                        {conv.otherUser?.name}
                        {conv.otherUser?.isVerified && <VerifiedBadge />}
                      </span>
                      {conv.lastMessage && (
                        <span className="conv-time">{formatTime(conv.lastMessage.createdAt)}</span>
                      )}
                    </div>
                    <div className="conv-bottom">
                      <p className="conv-preview">
                        {conv.lastMessage
                          ? conv.lastMessage.imageUrl
                            ? '📷 Image attachment'
                            : conv.lastMessage.content
                          : 'Started a conversation'}
                      </p>
                      {conv.unreadCount > 0 && (
                        <span className="conv-unread-badge">{conv.unreadCount}</span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* ── RIGHT PANEL: Active Chat Window ── */}
      <div className={`messages-chat-window ${!activeConversation ? 'no-active' : ''}`}>
        {activeConversation ? (
          <>
            {/* Header */}
            <div className="chat-header">
              <button className="mobile-back-btn" onClick={() => setActiveConversation(null)}>
                <ArrowLeft size={20} />
              </button>
              <div
                className="chat-user-profile"
                onClick={() => navigate(`/profile?id=${activeConversation.otherUser?.id}`)}
              >
                <div className="chat-avatar">
                  {activeConversation.otherUser?.avatarUrl ? (
                    <img src={resolveImageUrl(activeConversation.otherUser.avatarUrl)} alt="" />
                  ) : (
                    <div className="avatar-placeholder">{activeConversation.otherUser?.name?.charAt(0)}</div>
                  )}
                </div>
                <div className="chat-user-info">
                  <div className="chat-user-name">
                    {activeConversation.otherUser?.name}
                    {activeConversation.otherUser?.isVerified && <VerifiedBadge />}
                  </div>
                  <div className="chat-user-sub">
                    {activeConversation.otherUser?.department || 'UMT Student'}
                  </div>
                </div>
              </div>
            </div>

            {/* Messages Body */}
            <div className="chat-messages-body">
              {loadingMessages ? (
                <div className="messages-loading">
                  <Loader className="spinner" size={28} />
                  <span>Loading chat history...</span>
                </div>
              ) : messages.length === 0 ? (
                <div className="chat-start-prompt">
                  <div className="prompt-avatar">
                    {activeConversation.otherUser?.avatarUrl ? (
                      <img src={resolveImageUrl(activeConversation.otherUser.avatarUrl)} alt="" />
                    ) : (
                      <div className="avatar-placeholder">{activeConversation.otherUser?.name?.charAt(0)}</div>
                    )}
                  </div>
                  <h3>Say hello to {activeConversation.otherUser?.name}!</h3>
                  <p>Send a direct message to start this student conversation.</p>
                </div>
              ) : (
                messages.map(msg => {
                  const isMine = msg.senderId === currentUser?.id;
                  const imgUrl = resolveImageUrl(msg.imageUrl);
                  return (
                    <div key={msg.id || Math.random()} className={`message-row ${isMine ? 'mine' : 'theirs'}`}>
                      <div className="message-bubble">
                        {imgUrl && (
                          <div className="message-image-container" onClick={() => setLightboxImage(imgUrl)}>
                            <img src={imgUrl} alt="Attachment" />
                          </div>
                        )}
                        {msg.content && <p className="message-text">{msg.content}</p>}
                        <div className="message-meta">
                          <span className="message-time">{formatTime(msg.createdAt)}</span>
                          {isMine && (
                            <span className="message-status">
                              <CheckCheck size={14} className={msg.isRead ? 'read' : 'sent'} />
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}

              {/* Typing indicator */}
              {isPartnerTyping && (
                <div className="typing-indicator">
                  <div className="typing-dots">
                    <span></span>
                    <span></span>
                    <span></span>
                  </div>
                  <span className="typing-text">{activeConversation.otherUser?.name} is typing...</span>
                </div>
              )}

              <div ref={chatEndRef} />
            </div>

            {/* Selected image preview bar */}
            {imagePreview && (
              <div className="image-preview-bar">
                <div className="preview-thumb">
                  <img src={imagePreview} alt="Preview" />
                  <button type="button" className="remove-preview-btn" onClick={removeSelectedImage}>
                    <X size={14} />
                  </button>
                </div>
                <span>Image attached</span>
              </div>
            )}

            {/* Input Footer */}
            <form className="chat-input-footer" onSubmit={handleSendMessage}>
              <input
                type="file"
                ref={fileInputRef}
                accept="image/*"
                onChange={handleFileSelect}
                style={{ display: 'none' }}
              />
              <button
                type="button"
                className="attach-btn"
                title="Attach photo"
                onClick={() => fileInputRef.current?.click()}
              >
                <ImageIcon size={20} />
              </button>

              <input
                type="text"
                className="chat-text-input"
                placeholder={`Message ${activeConversation.otherUser?.name || 'student'}...`}
                value={messageText}
                onChange={handleInputChange}
              />

              <button
                type="submit"
                className="send-message-btn"
                disabled={(!messageText.trim() && !imageFile) || sending}
              >
                {sending ? <Loader className="spinner" size={18} /> : <Send size={18} />}
              </button>
            </form>
          </>
        ) : (
          <div className="chat-placeholder-state">
            <div className="placeholder-icon">
              <MessageSquare size={48} />
            </div>
            <h2>Your Student Direct Messages</h2>
            <p>Select an existing conversation from the list or search for a UMT student to start messaging.</p>
          </div>
        )}
      </div>

      {/* Lightbox Modal for attached images */}
      {lightboxImage && (
        <ImageLightboxModal imageUrl={lightboxImage} onClose={() => setLightboxImage(null)} />
      )}
    </div>
  );
}
