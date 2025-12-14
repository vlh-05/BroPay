import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface Friend {
  id?: string;
  email: string;
  name: string;
  status?: string;
}

interface FriendRequest {
  id?: string;
  senderEmail: string;
  receiverEmail: string;
  status: string;
  timestamp?: string;
}

interface FriendState {
  friends: Friend[];
  pendingRequests: FriendRequest[];
  receivedRequests: FriendRequest[];
  isLoading: boolean;
  error: string | null;
}

const initialState: FriendState = {
  friends: [],
  pendingRequests: [],
  receivedRequests: [],
  isLoading: false,
  error: null,
};

const friendSlice = createSlice({
  name: 'friend',
  initialState,
  reducers: {
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload;
    },
    setFriends: (state, action: PayloadAction<Friend[]>) => {
      state.friends = action.payload;
    },
    addFriend: (state, action: PayloadAction<Friend>) => {
      const exists = state.friends.find(f => f.email === action.payload.email);
      if (!exists) {
        state.friends.push(action.payload);
      }
    },
    removeFriend: (state, action: PayloadAction<string>) => {
      state.friends = state.friends.filter(f => f.email !== action.payload);
    },
    setPendingRequests: (state, action: PayloadAction<FriendRequest[]>) => {
      state.pendingRequests = action.payload;
    },
    addPendingRequest: (state, action: PayloadAction<FriendRequest>) => {
      state.pendingRequests.push(action.payload);
    },
    setReceivedRequests: (state, action: PayloadAction<FriendRequest[]>) => {
      state.receivedRequests = action.payload;
    },
    addReceivedRequest: (state, action: PayloadAction<FriendRequest>) => {
      state.receivedRequests.push(action.payload);
    },
    acceptRequest: (state, action: PayloadAction<string>) => {
      state.receivedRequests = state.receivedRequests.filter(r => r.id !== action.payload);
    },
    rejectRequest: (state, action: PayloadAction<string>) => {
      state.receivedRequests = state.receivedRequests.filter(r => r.id !== action.payload);
    },
    setError: (state, action: PayloadAction<string>) => {
      state.error = action.payload;
    },
    clearError: (state) => {
      state.error = null;
    },
  },
});

export const {
  setLoading,
  setFriends,
  addFriend,
  removeFriend,
  setPendingRequests,
  addPendingRequest,
  setReceivedRequests,
  addReceivedRequest,
  acceptRequest,
  rejectRequest,
  setError,
  clearError,
} = friendSlice.actions;

export default friendSlice.reducer;
