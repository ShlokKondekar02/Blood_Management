/**
 * HomePage — Main 3-Panel Layout
 * Sidebar (groups) | Chat Panel | Details Panel
 * Telegram/Discord inspired layout
 */

import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../api/axios';
import useAuth from '../hooks/useAuth';
import useSocket from '../hooks/useSocket';
import Sidebar from '../components/layout/Sidebar';
import ChatPanel from '../components/layout/ChatPanel';
import DetailsPanel from '../components/layout/DetailsPanel';
import '../styles/layout.css';

const HomePage = () => {
  const { user } = useAuth();
  const { socket } = useSocket();
  const navigate = useNavigate();

  // State
  const [communities, setCommunities] = useState([]);
  const [allCommunities, setAllCommunities] = useState([]);
  const [selectedCommunity, setSelectedCommunity] = useState(null);
  const [messages, setMessages] = useState([]);
  const [showDetails, setShowDetails] = useState(false);
  const [showSidebar, setShowSidebar] = useState(true);
  const [sidebarTab, setSidebarTab] = useState('my'); // 'my' | 'explore'
  const [loading, setLoading] = useState(true);

  // Fetch user's communities
  const fetchMyCommunities = useCallback(async () => {
    try {
      const { data } = await API.get('/communities/my');
      if (data.success) setCommunities(data.communities);
    } catch (err) {
      console.error('Error fetching communities:', err);
    }
  }, []);

  // Fetch all communities for explore
  const fetchAllCommunities = useCallback(async () => {
    try {
      const { data } = await API.get('/communities');
      if (data.success) setAllCommunities(data.communities);
    } catch (err) {
      console.error('Error fetching all communities:', err);
    }
  }, []);

  // Fetch messages for selected community
  const fetchMessages = useCallback(async (communityId) => {
    try {
      const { data } = await API.get(`/messages/${communityId}`);
      if (data.success) setMessages(data.messages);
    } catch (err) {
      console.error('Error fetching messages:', err);
    }
  }, []);

  // Initial load
  useEffect(() => {
    const load = async () => {
      await fetchMyCommunities();
      await fetchAllCommunities();
      setLoading(false);
    };
    load();
  }, [fetchMyCommunities, fetchAllCommunities]);

  // Handle community selection
  const handleSelectCommunity = useCallback(async (community) => {
    // Leave previous room
    if (selectedCommunity && socket) {
      socket.emit('leave_community', selectedCommunity._id);
    }

    try {
      // Fetch full community details (populated members, leader, etc.)
      const { data } = await API.get(`/communities/${community._id}`);
      if (data.success) {
        setSelectedCommunity(data.community);
        await fetchMessages(community._id);

        // Join new room
        if (socket) {
          socket.emit('join_community', community._id);
        }
      }
    } catch (err) {
      console.error('Error selecting community:', err);
      // Fallback to basic data if fetch fails
      setSelectedCommunity(community);
    }

    // Close sidebar on mobile
    if (window.innerWidth < 768) {
      setShowSidebar(false);
    }
  }, [selectedCommunity, socket, fetchMessages]);

  // Socket: listen for new messages
  useEffect(() => {
    if (!socket) return;

    const handleNewMessage = (message) => {
      setMessages(prev => [...prev, message]);
    };

    socket.on('new_message', handleNewMessage);

    return () => {
      socket.off('new_message', handleNewMessage);
    };
  }, [socket]);

  // Send message
  const handleSendMessage = async (content, type = 'text', bloodRequestId = null) => {
    if (!selectedCommunity || !content.trim()) return;

    try {
      const { data } = await API.post('/messages', {
        communityId: selectedCommunity._id,
        content,
        type,
        bloodRequest: bloodRequestId
      });

      if (data.success) {
        setMessages(prev => [...prev, data.message]);

        // Broadcast via socket
        if (socket) {
          socket.emit('send_message', {
            communityId: selectedCommunity._id,
            message: data.message
          });
        }
      }
    } catch (err) {
      console.error('Error sending message:', err);
    }
  };

  // Join community
  const handleJoinCommunity = async (communityId) => {
    try {
      const { data } = await API.post(`/communities/${communityId}/join`);
      if (data.success) {
        await fetchMyCommunities();
        await fetchAllCommunities();
        setSelectedCommunity(data.community);
        setSidebarTab('my');
      }
    } catch (err) {
      console.error('Error joining community:', err);
    }
  };

  // Leave community
  const handleLeaveCommunity = async (communityId) => {
    try {
      const { data } = await API.post(`/communities/${communityId}/leave`);
      if (data.success) {
        if (selectedCommunity?._id === communityId) {
          // Leave socket room
          if (socket) {
            socket.emit('leave_community', communityId);
          }
          setSelectedCommunity(null);
          setMessages([]);
        }
        await fetchMyCommunities();
        setShowDetails(false);
      }
    } catch (err) {
      console.error('Error leaving community:', err);
    }
  };

  // Create community
  const handleCreateCommunity = async (communityData) => {
    try {
      const { data } = await API.post('/communities', communityData);
      if (data.success) {
        await fetchMyCommunities();
        await fetchAllCommunities();
        setSelectedCommunity(data.community);
        return data.community;
      }
    } catch (err) {
      console.error('Error creating community:', err);
      throw err;
    }
  };

  // Pin/delete message
  const handlePinMessage = async (messageId) => {
    try {
      await API.put(`/messages/${messageId}/pin`);
      await fetchMessages(selectedCommunity._id);
    } catch (err) {
      console.error('Error pinning message:', err);
    }
  };

  const handleDeleteMessage = async (messageId) => {
    try {
      await API.delete(`/messages/${messageId}`);
      setMessages(prev => prev.filter(m => m._id !== messageId));
    } catch (err) {
      console.error('Error deleting message:', err);
    }
  };

  // Remove member
  const handleRemoveMember = async (memberId) => {
    if (!selectedCommunity) return;
    try {
      await API.delete(`/communities/${selectedCommunity._id}/members/${memberId}`);
      // Refresh community data
      const { data } = await API.get(`/communities/${selectedCommunity._id}`);
      if (data.success) setSelectedCommunity(data.community);
    } catch (err) {
      console.error('Error removing member:', err);
    }
  };

  if (loading) {
    return (
      <div className="loading-screen">
        <div className="logo">🩸 BloodConnect</div>
        <div className="loader" />
      </div>
    );
  }

  return (
    <div className="app-layout">
      {/* Mobile overlay */}
      {showSidebar && window.innerWidth < 768 && (
        <div className="mobile-overlay" onClick={() => setShowSidebar(false)} />
      )}

      {/* Left Sidebar */}
      <Sidebar
        communities={communities}
        allCommunities={allCommunities}
        selectedCommunity={selectedCommunity}
        onSelectCommunity={handleSelectCommunity}
        onJoinCommunity={handleJoinCommunity}
        onCreateCommunity={handleCreateCommunity}
        sidebarTab={sidebarTab}
        setSidebarTab={setSidebarTab}
        isOpen={showSidebar}
        onClose={() => setShowSidebar(false)}
        navigate={navigate}
      />

      {/* Center Chat Panel */}
      <ChatPanel
        community={selectedCommunity}
        messages={messages}
        onSendMessage={handleSendMessage}
        onNewMessage={(msg) => setMessages(prev => [...prev, msg])}
        onPinMessage={handlePinMessage}
        onDeleteMessage={handleDeleteMessage}
        onToggleDetails={() => setShowDetails(!showDetails)}
        onToggleSidebar={() => setShowSidebar(!showSidebar)}
        user={user}
        socket={socket}
      />

      {/* Right Details Panel */}
      {selectedCommunity && (
        <DetailsPanel
          community={selectedCommunity}
          isOpen={showDetails}
          onClose={() => setShowDetails(false)}
          onLeaveCommunity={handleLeaveCommunity}
          onRemoveMember={handleRemoveMember}
          user={user}
        />
      )}
    </div>
  );
};

export default HomePage;
