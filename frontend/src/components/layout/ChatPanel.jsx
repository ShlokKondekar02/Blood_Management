/**
 * Chat Panel Component
 * Center panel with messages, input, and blood request functionality
 */

import { useState, useEffect, useRef } from 'react';
import { FiMenu, FiInfo, FiSend, FiAlertTriangle, FiMoreVertical, FiTrash2, FiBookmark } from 'react-icons/fi';
import { MdBloodtype } from 'react-icons/md';
import { getInitials, formatTime, getAvatarColor } from '../../utils/helpers';
import { QUICK_REPLIES } from '../../utils/constants';
import BloodRequestModal from '../blood/RequestForm';
import API from '../../api/axios';
import toast from 'react-hot-toast';

const ChatPanel = ({
  community,
  messages,
  onSendMessage,
  onNewMessage,
  onPinMessage,
  onDeleteMessage,
  onToggleDetails,
  onToggleSidebar,
  user,
  socket
}) => {
  const [newMessage, setNewMessage] = useState('');
  const [showBloodRequestModal, setShowBloodRequestModal] = useState(false);
  const [typingUser, setTypingUser] = useState(null);
  const [contextMenu, setContextMenu] = useState(null);
  const messagesEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Socket: typing indicators
  useEffect(() => {
    if (!socket) return;

    socket.on('user_typing', (data) => {
      setTypingUser(data.userName);
    });

    socket.on('user_stop_typing', () => {
      setTypingUser(null);
    });

    return () => {
      socket.off('user_typing');
      socket.off('user_stop_typing');
    };
  }, [socket]);

  // Handle send
  const handleSend = () => {
    if (!newMessage.trim()) return;
    onSendMessage(newMessage.trim());
    setNewMessage('');

    if (socket && community) {
      socket.emit('stop_typing', { communityId: community._id });
    }
  };

  // Handle typing
  const handleTyping = (e) => {
    setNewMessage(e.target.value);

    if (socket && community) {
      socket.emit('typing', { communityId: community._id });

      clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = setTimeout(() => {
        socket.emit('stop_typing', { communityId: community._id });
      }, 2000);
    }
  };

  // Handle key press
  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // Quick reply to blood request
  const handleQuickReply = async (requestId, replyType) => {
    try {
      const { data } = await API.post('/replies', {
        bloodRequestId: requestId,
        type: replyType
      });
      if (data.success) {
        toast.success('Reply sent!');
        // Send a message in chat
        const replyLabels = {
          can_donate: '🩸 I can donate blood!',
          will_donate: '✅ I will donate!',
          has_certificate: '📜 I have a donation certificate',
          contact_me: '📞 Please contact me',
          nearby: '📍 I\'m available nearby',
          reaching_soon: '🚗 I am reaching the hospital soon',
          available_now: '⏰ I am available now',
          hospital: '🏥 I know a hospital that can help',
          blood_bank: '🏦 I know a blood bank with stock'
        };
        onSendMessage(replyLabels[replyType] || 'I can help!');
      }
    } catch (err) {
      toast.error('Failed to send reply');
    }
  };

  // Check if user is community leader
  const isLeader = community?.leader?._id === user?._id || community?.leader === user?._id;

  // No community selected
  if (!community) {
    return (
      <div className="chat-panel">
        <div className="chat-empty">
          <MdBloodtype className="icon" />
          <h2>Welcome to BloodConnect</h2>
          <p>Select a community from the sidebar to start chatting, or create a new group to connect with blood donors in your area.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="chat-panel">
      {/* Chat Header */}
      <div className="chat-header">
        <div className="chat-header-info">
          <button className="btn btn-icon btn-ghost mobile-menu-btn" onClick={onToggleSidebar}>
            <FiMenu />
          </button>
          <div className="avatar" style={{ background: getAvatarColor(community.name) }}>
            {getInitials(community.name)}
          </div>
          <div>
            <h3>{community.name}</h3>
            <p>{community.members?.length || 0} members</p>
          </div>
        </div>
        <div className="chat-header-actions">
          <button
            className="btn btn-sm btn-danger"
            onClick={() => setShowBloodRequestModal(true)}
            title="Request Blood"
          >
            <MdBloodtype /> Request Blood
          </button>
          <button className="btn btn-icon btn-ghost" onClick={onToggleDetails}>
            <FiInfo />
          </button>
        </div>
      </div>

      {/* Messages */}
      <div className="messages-container">
        {messages.length === 0 ? (
          <div className="empty-state">
            <p>No messages yet. Start the conversation!</p>
          </div>
        ) : (
          messages.map((msg, idx) => {
            const isOwn = (msg.sender?._id || msg.sender) === user?._id;
            const isSystem = msg.type === 'system';
            const isEmergency = msg.type === 'emergency';
            const isBloodRequest = msg.type === 'blood_request';

            return (
              <div
                key={msg._id || idx}
                className={`message ${isOwn ? 'message-own' : 'message-other'} ${isSystem ? 'message-system' : ''} ${isEmergency ? 'message-emergency' : ''} ${msg.isPinned ? 'message-pinned' : ''}`}
                onContextMenu={(e) => {
                  if (isSystem) return;
                  e.preventDefault();
                  setContextMenu({ messageId: msg._id, x: e.clientX, y: e.clientY, isOwn, isPinned: msg.isPinned });
                }}
              >
                {!isOwn && !isSystem && (
                  <div className="avatar avatar-sm" style={{ background: getAvatarColor(msg.sender?.name) }}>
                    {getInitials(msg.sender?.name)}
                  </div>
                )}
                <div className="message-bubble">
                  {msg.isPinned && (
                    <div className="pin-indicator"><FiBookmark size={10} /> Pinned</div>
                  )}
                  {!isOwn && !isSystem && (
                    <div className="message-sender">{msg.sender?.name}</div>
                  )}
                  <div className="message-content">{msg.content}</div>

                  {/* Quick replies for blood requests */}
                  {(isBloodRequest || isEmergency) && msg.bloodRequest && !isOwn && (
                    <div className="blood-request-actions" style={{ marginTop: '8px' }}>
                      {QUICK_REPLIES.map(qr => (
                        <button
                          key={qr.type}
                          className="quick-reply-btn"
                          onClick={() => handleQuickReply(msg.bloodRequest._id || msg.bloodRequest, qr.type)}
                        >
                          {qr.label}
                        </button>
                      ))}
                    </div>
                  )}

                  {!isSystem && (
                    <div className="message-time">{formatTime(msg.createdAt)}</div>
                  )}
                </div>
              </div>
            );
          })
        )}

        {/* Typing indicator */}
        {typingUser && (
          <div className="typing-indicator">
            {typingUser} is typing...
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Context Menu */}
      {contextMenu && (
        <>
          <div
            style={{ position: 'fixed', inset: 0, zIndex: 500 }}
            onClick={() => setContextMenu(null)}
          />
          <div
            className="card"
            style={{
              position: 'fixed',
              left: contextMenu.x,
              top: contextMenu.y,
              zIndex: 501,
              padding: '4px',
              minWidth: '150px',
              animation: 'fadeIn 0.15s ease'
            }}
          >
            {isLeader && (
              <button
                className="btn btn-ghost btn-sm"
                style={{ width: '100%', justifyContent: 'flex-start' }}
                onClick={() => {
                  onPinMessage(contextMenu.messageId);
                  setContextMenu(null);
                }}
              >
                <FiBookmark /> {contextMenu.isPinned ? 'Unpin' : 'Pin'}
              </button>
            )}
            {(isLeader || contextMenu.isOwn) && (
              <button
                className="btn btn-ghost btn-sm"
                style={{ width: '100%', justifyContent: 'flex-start', color: 'var(--critical)' }}
                onClick={() => {
                  onDeleteMessage(contextMenu.messageId);
                  setContextMenu(null);
                }}
              >
                <FiTrash2 /> Delete
              </button>
            )}
          </div>
        </>
      )}

      {/* Message Input */}
      <div className="message-input-container">
        <div className="message-input-wrapper">
          <input
            type="text"
            placeholder="Type a message..."
            value={newMessage}
            onChange={handleTyping}
            onKeyDown={handleKeyPress}
          />
          <div className="message-input-actions">
            <button
              className="btn btn-icon"
              onClick={() => setShowBloodRequestModal(true)}
              title="Blood Request"
              style={{ color: 'var(--primary)' }}
            >
              <FiAlertTriangle />
            </button>
            <button className="send-btn btn btn-icon" onClick={handleSend}>
              <FiSend />
            </button>
          </div>
        </div>
      </div>

      {/* Blood Request Modal */}
      {showBloodRequestModal && (
        <BloodRequestModal
          community={community}
          onClose={() => setShowBloodRequestModal(false)}
          onSubmit={async (requestData) => {
            try {
              const { data } = await API.post('/blood-requests', {
                ...requestData,
                communityId: community._id
              });
              if (data.success) {
                toast.success('Blood request sent! 🩸');
                setShowBloodRequestModal(false);
                
                if (data.message) {
                  // Update local state
                  onNewMessage(data.message);
                  
                  // Broadcast via socket
                  if (socket) {
                    socket.emit('send_message', {
                      communityId: community._id,
                      message: data.message
                    });
                  }
                }
              }
            } catch (err) {
              toast.error('Failed to create blood request');
            }
          }}
        />
      )}
    </div>
  );
};

export default ChatPanel;
