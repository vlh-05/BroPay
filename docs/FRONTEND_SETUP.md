# BroPay Frontend - Complete Setup Guide

## ✅ What Has Been Built

A complete **real-time React frontend** for the BroPay payment application with the following features:

### **10 Pages Implemented:**
1. **Home (Index)** - Landing page with features showcase
2. **Login** - User authentication page
3. **Register** - New user registration
4. **Dashboard** - Financial overview with analytics and transaction history
5. **Chat** - Real-time messaging with WebSocket support
6. **Payment** - Send payments to friends
7. **Recurring** - Set up automatic recurring payments
8. **Split** - Expense splitting with OCR receipt upload
9. **Friends** - Friend request management and friend list
10. **Profile** - User profile management and account settings
11. **Notifications** - Real-time notification center

### **Core Features:**
- ✅ **Redux State Management** - All app state centralized
- ✅ **WebSocket Real-Time** - Live chat and notifications
- ✅ **JWT Token Storage** - Secure authentication with localStorage
- ✅ **API Integration** - Axios with interceptors for all backend calls
- ✅ **Responsive Design** - Works on desktop, tablet, and mobile (no Tailwind)
- ✅ **Pure CSS** - Custom styling without Tailwind CSS
- ✅ **Protected Routes** - Authentication-based access control
- ✅ **Global Navigation** - Sticky navbar with notification badge

## 📦 Installation Steps

### 1. **Install Dependencies**
```bash
pnpm install
```

This will install:
- `redux` & `@reduxjs/toolkit` - State management
- `react-redux` - React bindings for Redux
- `socket.io-client` - WebSocket client
- `axios` - HTTP client

### 2. **Configure Backend URL**
The frontend is configured to connect to: `http://localhost:8080/api`

If your Spring Boot backend is running on a different URL, update:
```
client/services/api.ts - Line 3: API_BASE_URL
client/services/websocket.ts - Line 3: SOCKET_URL
```

### 3. **Start Development Server**
```bash
pnpm dev
```

The app will be available at: `http://localhost:8080`

### 4. **Build for Production**
```bash
pnpm build
```

This creates optimized production builds in `dist/` folder.

## 🏗️ Project Structure

```
client/
├── pages/
│   ├── Index.tsx & Index.css          # Home page
│   ├── Login.tsx & Auth.css           # Login page
│   ├── Register.tsx                   # Register page
│   ├── Dashboard.tsx & Dashboard.css  # Dashboard
│   ├── Chat.tsx & Chat.css            # Real-time chat
│   ├── Payment.tsx & Payment.css      # Send payments
│   ├── Recurring.tsx & Recurring.css  # Recurring payments
│   ├── Split.tsx & Split.css          # Expense splitting
│   ├── FriendRequest.tsx & FriendRequest.css  # Friend management
│   ├── Profile.tsx & Profile.css      # User profile
│   ├── Notifications.tsx & Notifications.css  # Notification center
│   └── NotFound.tsx & NotFound.css    # 404 page
│
├── components/
│   ├── Navigation.tsx & Navigation.css # Main navigation bar
│
├── store/
│   ├── index.ts                        # Redux store config
│   └── slices/
│       ├── authSlice.ts               # Auth state
│       ├── chatSlice.ts               # Chat state
│       ├── paymentSlice.ts            # Payment state
│       ├── friendSlice.ts             # Friend state
│       └── notificationSlice.ts       # Notification state
│
├── services/
│   ├── api.ts                         # API endpoints
│   └── websocket.ts                   # WebSocket handlers
│
├── hooks/
│   ├── useAuth.ts                     # Auth hook
│   └── useWebSocket.ts                # WebSocket hook
│
├── styles/
│   └── global.css                     # Global styles (no Tailwind)
│
├── App.tsx                            # Main app component
└── global.css                         # Global CSS
```

## 🔌 API Configuration

All API endpoints are pre-configured in `client/services/api.ts`:

### Auth Endpoints:
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - User login

### Chat Endpoints:
- `POST /api/chat/send` - Send message
- `GET /api/chat/history` - Get chat history
- `GET /api/chat/conversation/{user1}/{user2}` - Get conversation

### Payment Endpoints:
- `POST /api/payment/process` - Process payment
- `GET /api/payment/payer/{payer}` - Get payments by payer

### Recurring Endpoints:
- `POST /api/recurring/setup` - Setup recurring payment
- `GET /api/recurring/user/{userId}` - Get user's recurring payments

### Split Endpoints:
- `POST /api/split/compute` - Calculate split

### Receipt/OCR Endpoints:
- `POST /api/receipts/upload` - Upload receipt for OCR
- `POST /api/ocr/parseBase64` - Parse base64 image

### Friend Endpoints:
- `POST /api/friends/send` - Send friend request
- `POST /api/friends/respond?accept={true/false}` - Respond to request
- `GET /api/friends/{userEmail}` - Get user's friends

### Analytics Endpoints:
- `GET /api/analytics/summary/{userEmail}` - Get analytics summary

## 🔐 Authentication Flow

1. **Login/Register** → User provides credentials
2. **JWT Token** → Backend returns token, stored in localStorage
3. **Protected Routes** → Only authenticated users access protected pages
4. **Token Headers** → Automatically added to all API requests
5. **Token Refresh** → If unauthorized (401), user redirected to login

## 🔌 WebSocket Setup

The app automatically connects to WebSocket when user logs in:

### WebSocket Events:
- `message:received` - New chat message
- `chat:typing` - User typing indicator
- `friendRequest:received` - New friend request
- `notification:received` - System notification
- `payment:notification` - Payment received
- `user:online` - User came online
- `user:offline` - User went offline

**Note:** Make sure your Spring Boot backend supports WebSocket at the same URL.

## 🎨 Styling System

No Tailwind CSS! Pure CSS with custom design system:

### Design Tokens (in `client/global.css`):
- **Colors:** Primary (#2563eb), Success (#10b981), Danger (#ef4444), etc.
- **Spacing:** xs (4px), sm (8px), md (16px), lg (24px), xl (32px), 2xl (48px)
- **Shadows:** sm, md, lg
- **Border radius:** 8px, 12px, 9999px
- **Typography:** Font sizes from xs to 3xl

### Utility Classes:
- Flex & Grid: `.flex`, `.flex-center`, `.grid`, `.grid-2`, etc.
- Spacing: `.p-md`, `.m-lg`, `.mt-sm`, `.mb-md`, etc.
- Text: `.text-center`, `.text-muted`, `.font-bold`, etc.
- Buttons: `.btn`, `.btn-primary`, `.btn-secondary`, `.btn-danger`, `.btn-success`
- Cards: `.card` with hover shadow
- Forms: `.form-group`, `.form-group input/textarea`
- Alerts: `.alert`, `.alert-success`, `.alert-error`, `.alert-warning`, `.alert-info`

## 📱 Responsive Design

All pages are fully responsive:
- **Desktop:** Full featured experience
- **Tablet:** Optimized grid layouts
- **Mobile:** Single column, touch-friendly buttons

Breakpoints:
- Mobile: < 480px
- Tablet: 480px - 768px
- Desktop: > 768px

## 🚀 Running the App

### Development:
```bash
pnpm dev
```
Opens on http://localhost:8080

### Build:
```bash
pnpm build
```

### Type Check:
```bash
pnpm typecheck
```

### Format Code:
```bash
pnpm format.fix
```

## ⚙️ Redux State Structure

### Auth State:
```typescript
{
  user: { id?, email, name, role },
  token: string | null,
  isLoading: boolean,
  error: string | null,
  isAuthenticated: boolean
}
```

### Chat State:
```typescript
{
  conversations: { [key: string]: ChatMessage[] },
  activeConversation: string | null,
  newMessages: { [key: string]: number },
  isLoading: boolean,
  error: string | null
}
```

### Payment State:
```typescript
{
  payments: Payment[],
  recurring: Recurring[],
  splits: Split[],
  isLoading: boolean,
  error: string | null
}
```

### Friend State:
```typescript
{
  friends: Friend[],
  pendingRequests: FriendRequest[],
  receivedRequests: FriendRequest[],
  isLoading: boolean,
  error: string | null
}
```

### Notification State:
```typescript
{
  notifications: Notification[],
  unreadCount: number
}
```

## 🔗 Important Files to Know

| File | Purpose |
|------|---------|
| `client/App.tsx` | Main app with routing & Redux |
| `client/store/index.ts` | Redux store configuration |
| `client/services/api.ts` | All API endpoints |
| `client/services/websocket.ts` | WebSocket configuration |
| `client/hooks/useAuth.ts` | Authentication hook |
| `client/hooks/useWebSocket.ts` | WebSocket hook |
| `client/global.css` | Global styles & design tokens |
| `client/components/Navigation.tsx` | Main navigation bar |

## 🐛 Troubleshooting

### Backend Connection Issues:
- Ensure Spring Boot is running on `http://localhost:8080`
- Check CORS configuration in backend
- Verify WebSocket port is accessible

### WebSocket Not Connecting:
- Backend must have Socket.IO support
- Check WebSocket events in `client/services/websocket.ts`
- Browser console will show connection errors

### Token Issues:
- Clear localStorage and re-login
- Check that backend returns token correctly
- Verify JWT format matches expectations

### Styling Issues:
- All CSS is in individual component `.css` files
- Global styles in `client/global.css`
- No external CSS framework (no Tailwind)

## 📝 Next Steps

1. ✅ Install dependencies: `pnpm install`
2. ✅ Start dev server: `pnpm dev`
3. ✅ Register a new account
4. ✅ Test all features
5. ✅ Check browser console for any errors

## 🎯 Features Summary

- 🔐 Secure JWT authentication
- 💬 Real-time WebSocket chat
- 💰 Payment & recurring payment management
- 🔀 Expense splitting with receipt OCR
- 👥 Friend request system
- 📢 Real-time notifications
- 👤 User profile management
- 📊 Analytics & transaction history
- 🎨 Beautiful responsive UI (no Tailwind)
- ♿ Accessible components

## 📧 Support

If you encounter any issues, check:
1. Console errors in DevTools (F12)
2. Network tab for API calls
3. Redux DevTools for state changes
4. Backend logs for server errors

---

**Version:** 1.0.0
**Last Updated:** 2024
**Framework:** React 18 + Redux + Socket.IO
