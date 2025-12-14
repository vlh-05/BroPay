import { configureStore } from '@reduxjs/toolkit';
import authReducer from './slices/authSlice';
import chatReducer from './slices/chatSlice';
import paymentReducer from './slices/paymentSlice';
import friendReducer from './slices/friendSlice';
import notificationReducer from './slices/notificationSlice';
import { persistChatMiddleware } from './middleware/persistChat';  

export const store = configureStore({
  reducer: {
    auth: authReducer,
    chat: chatReducer,
    payment: paymentReducer,
    friend: friendReducer,
    notification: notificationReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(persistChatMiddleware), 
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
