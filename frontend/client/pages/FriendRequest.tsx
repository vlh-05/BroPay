import React, { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '@/store';
import Navigation from '@/components/Navigation';
import { friendAPI } from '@/services/api';
import { addFriend, addReceivedRequest, setFriends, setReceivedRequests } from '@/store/slices/friendSlice';
import { addNotification } from '@/store/slices/notificationSlice';
import './FriendRequest.css';

const FriendRequest: React.FC = () => {
  const { user } = useAuth();
  const dispatch = useDispatch<AppDispatch>();
  const { friends, receivedRequests } = useSelector(
    (state: RootState) => state.friend
  );
  const [friendEmail, setFriendEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    if (user) {
      fetchFriends();
      fetchReceivedRequests();
    }
  }, [user]);

  const fetchFriends = async () => {
    if (!user) return;
    try {
      const response = await friendAPI.getFriends(user.email);
      dispatch(setFriends(response.data));
    } catch (err) {
      console.error('Failed to fetch friends:', err);
    }
  };

  const fetchReceivedRequests = async () => {
    if (!user) return;
    try {
      const response = await friendAPI.getReceivedRequests(user.email);
      const requestsWithIds = response.data.map((req: any) => ({
        ...req,
        id: req.id || `fr_${req.senderEmail}_${Date.now()}`,
      }));
      dispatch(setReceivedRequests(requestsWithIds));
    } catch (err) {
      console.error('Failed to fetch friend requests:', err);
    }
  };

  const handleSendRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!user) {
      setError('User not authenticated');
      return;
    }

    if (!friendEmail) {
      setError('Please enter a friend email');
      return;
    }

    if (friendEmail === user.email) {
      setError('Cannot add yourself');
      return;
    }

    try {
      setIsLoading(true);
      await friendAPI.sendRequest({
        senderEmail: user.email,
        receiverEmail: friendEmail,
      });

      dispatch(
        addNotification({
          id: `fr-sent-${Date.now()}`,
          type: 'system',
          title: 'Friend Request Sent',
          message: `Friend request sent to ${friendEmail}`,
          read: false,
          timestamp: new Date().toISOString(),
        })
      );

      setSuccess(`✓ Friend request sent to ${friendEmail}`);
      setFriendEmail('');
    } catch (err: any) {
      setError(
        err.response?.data?.message ||
          'Failed to send friend request. Please try again.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleAcceptRequest = async (senderEmail: string) => {
    if (!user) return;
    try {
      await friendAPI.respondRequest(
        {
          senderEmail,
          receiverEmail: user.email,
        },
        true
      );

      dispatch(addFriend({ email: senderEmail, name: senderEmail }));

      dispatch(
        addNotification({
          id: `fr-accept-${Date.now()}`,
          type: 'system',
          title: 'Friend Request Accepted',
          message: `You are now friends with ${senderEmail}`,
          data: {},
          read: false,
          timestamp: new Date().toISOString(),
        })
      );

      await fetchFriends();
      await fetchReceivedRequests();
      setSuccess(`✓ Friend request from ${senderEmail} accepted`);
    } catch (err) {
      console.error('Failed to accept friend request:', err);
      setError('Failed to accept friend request');
    }
  };

  const handleRejectRequest = async (senderEmail: string) => {
    if (!user) return;
    try {
      await friendAPI.respondRequest(
        {
          senderEmail,
          receiverEmail: user.email,
        },
        false
      );

      setSuccess(`✓ Friend request from ${senderEmail} rejected`);
      await fetchReceivedRequests();
    } catch (err) {
      console.error('Failed to reject friend request:', err);
      setError('Failed to reject friend request');
    }
  };

  return (
    <>
      <Navigation />
      <div className="container" style={{ paddingTop: 'var(--spacing-lg)' }}>
        <div className="page-header">
          <h1>Friends & Connections</h1>
          <p>Manage your friend list</p>
        </div>

        {error && <div className="alert alert-error">{error}</div>}
        {success && <div className="alert alert-success">{success}</div>}

        <div className="friends-layout">
          <div className="send-request-card">
            <h2>Send Friend Request</h2>

            <form onSubmit={handleSendRequest}>
              <div className="form-group">
                <label htmlFor="friendEmail">Friend Email</label>
                <input
                  id="friendEmail"
                  type="email"
                  value={friendEmail}
                  onChange={(e) => setFriendEmail(e.target.value)}
                  placeholder="friend@example.com"
                  disabled={isLoading}
                />
              </div>

              <button
                type="submit"
                className="btn btn-primary btn-large"
                disabled={isLoading}
              >
                {isLoading ? 'Sending...' : 'Send Request'}
              </button>
            </form>
          </div>

          <div className="friends-grid">
            <div className="friends-section">
              <h2>My Friends</h2>
              {friends.length > 0 ? (
                <div className="friends-list">
                  {friends.map((friend) => (
                    <div key={friend.email} className="friend-item">
                      <div className="friend-info">
                        <div className="friend-name">{friend.name}</div>
                        <div className="friend-email">{friend.email}</div>
                      </div>
                      <div className="friend-status">✓ Connected</div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="empty-state">
                  <p>No friends yet. Send some friend requests!</p>
                </div>
              )}
            </div>

            {receivedRequests.length > 0 && (
              <div className="friends-section">
                <h2>Friend Requests</h2>
                <div className="requests-list">
                  {receivedRequests.map((request) => (
                    <div key={request.id} className="request-item">
                      <div className="request-info">
                        <div className="request-email">{request.senderEmail}</div>
                      </div>
                      <div className="request-actions">
                        <button
                          className="btn btn-success btn-small"
                          onClick={() => handleAcceptRequest(request.senderEmail)}
                        >
                          Accept
                        </button>
                        <button
                          className="btn btn-danger btn-small"
                          onClick={() => handleRejectRequest(request.senderEmail)}
                        >
                          Reject
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default FriendRequest;
