# 🚀 Quick Start - BroPay Frontend

## ⚡ 5-Minute Setup

### Step 1: Install Dependencies
```bash
pnpm install
```

### Step 2: Verify Backend Running
Make sure your Spring Boot backend is running on:
```
http://localhost:8080
```

### Step 3: Start Development Server
```bash
pnpm dev
```

The app opens at: `http://localhost:8080`

### Step 4: Test the App
1. Go to the **Register** page and create an account
2. Login with your credentials
3. Explore the Dashboard, Chat, Payment, Split, and Friends features

---

## 📋 Complete File Structure Created

### Pages (11 total):
```
client/pages/
├── Index.tsx              # Home/Landing page
├── Login.tsx              # Login form
├── Register.tsx           # Registration form
├── Dashboard.tsx          # Analytics & transaction history
├── Chat.tsx               # Real-time chat
├── Payment.tsx            # Send payments
├── Recurring.tsx          # Setup recurring payments
├── Split.tsx              # Split expenses with OCR
├── FriendRequest.tsx      # Manage friends
├── Profile.tsx            # User profile
├── Notifications.tsx      # Notification center
└── NotFound.tsx           # 404 page
```

### Components:
```
client/components/
└── Navigation.tsx         # Sticky navbar with notifications
```

### State Management (Redux):
```
client/store/
├── index.ts               # Store config
└── slices/
    ├── authSlice.ts       # Auth state
    ├── chatSlice.ts       # Chat state
    ├── paymentSlice.ts    # Payments state
    ├── friendSlice.ts     # Friends state
    └── notificationSlice.ts # Notifications
```

### Services:
```
client/services/
├── api.ts                 # All API endpoints with Axios
└── websocket.ts           # WebSocket real-time events
```

### Hooks:
```
client/hooks/
├── useAuth.ts             # Authentication hook
└── useWebSocket.ts        # WebSocket hook
```

### Styling:
```
client/
├── global.css             # Global styles & design tokens
└── pages/
    ├── *.css              # Component-specific styles
    └── ... (all pages have CSS)
```

---

## ✨ Key Features Implemented

| Feature | Page | Status |
|---------|------|--------|
| User Auth | Login/Register | ✅ JWT + localStorage |
| Real-Time Chat | Chat | ✅ WebSocket |
| Send Payments | Payment | ✅ API integration |
| Recurring Payments | Recurring | ✅ Auto-setup |
| Expense Split | Split | ✅ OCR support |
| Friend Management | Friends | ✅ Request system |
| User Profile | Profile | ✅ Edit settings |
| Notifications | Notifications | ✅ Real-time center |
| Dashboard | Dashboard | ✅ Analytics |
| Navigation | Navbar | ✅ Auth-aware |

---

## 🔌 API Endpoints Connected

All endpoints are pre-configured in `client/services/api.ts`:

### Auth:
- `POST /api/auth/register`
- `POST /api/auth/login`

### Chat:
- `POST /api/chat/send`
- `GET /api/chat/history`
- `GET /api/chat/conversation/{user1}/{user2}`

### Payments:
- `POST /api/payment/process`
- `GET /api/payment/payer/{payer}`

### Recurring:
- `POST /api/recurring/setup`
- `GET /api/recurring/user/{userId}`

### Split:
- `POST /api/split/compute`

### Receipts:
- `POST /api/receipts/upload`

### Friends:
- `POST /api/friends/send`
- `POST /api/friends/respond`
- `GET /api/friends/{email}`

### Analytics:
- `GET /api/analytics/summary/{email}`

---

## 🎨 Design System

### Colors:
- Primary: `#2563eb` (Blue)
- Success: `#10b981` (Green)
- Danger: `#ef4444` (Red)
- Warning: `#f59e0b` (Orange)
- Muted: `#6b7280` (Gray)

### Spacing Scale:
- xs: 4px
- sm: 8px
- md: 16px
- lg: 24px
- xl: 32px
- 2xl: 48px

### Utilities:
- Flexbox: `.flex`, `.flex-center`, `.flex-between`, `.flex-col`
- Grid: `.grid`, `.grid-2`, `.grid-3`, `.grid-4`
- Buttons: `.btn-primary`, `.btn-secondary`, `.btn-danger`, `.btn-success`
- Forms: `.form-group`
- Cards: `.card`
- Alerts: `.alert-success`, `.alert-error`, `.alert-warning`, `.alert-info`

---

## 🔐 Authentication Flow

```
User → Register/Login → JWT Token → localStorage
                                   ↓
                          Stored in localStorage
                                   ↓
                        Added to all API requests
                                   ↓
                          Protected Routes Check
                                   ↓
                        Access Dashboard & Features
```

---

## 🌐 WebSocket Events

### Emitted Events:
- `message:send` - Send chat message
- `chat:typing` - User typing indicator
- `user:status` - Online/offline status

### Listening Events:
- `message:received` - Receive message
- `chat:typing` - Someone typing
- `friendRequest:received` - Friend request
- `notification:received` - System notification
- `payment:notification` - Payment received
- `user:online` / `user:offline` - User status

---

## 📱 Responsive Breakpoints

```
Mobile:    < 480px   (Single column)
Tablet:    480-768px (2 columns)
Desktop:   > 768px   (Full layout)
```

All pages are fully responsive!

---

## 🛠️ Available Commands

```bash
# Development
pnpm dev           # Start dev server on http://localhost:8080

# Building
pnpm build         # Build for production
pnpm build:client  # Build only client
pnpm build:server  # Build only server

# Quality
pnpm typecheck     # TypeScript validation
pnpm format.fix    # Format code with Prettier

# Testing
pnpm test          # Run tests with Vitest

# Production
pnpm start         # Start production server
```

---

## 📚 Documentation Files

- **FRONTEND_SETUP.md** - Complete setup guide
- **QUICK_START.md** - This file

---

## ⚠️ Important Notes

1. **Backend Required**: Spring Boot backend must be running on `http://localhost:8080`
2. **WebSocket Support**: Backend must support Socket.IO
3. **CORS**: Backend needs to allow requests from your frontend
4. **Database**: All data is persisted in MongoDB as per your backend setup
5. **No Tailwind**: Using pure CSS with custom design system

---

## 🐛 Common Issues

### Issue: Backend not connecting
**Solution:** Ensure Spring Boot is running on port 8080 and CORS is enabled

### Issue: WebSocket not working
**Solution:** Verify backend has Socket.IO support and same port

### Issue: Styles not showing
**Solution:** All CSS is in component `.css` files, no external framework

### Issue: Login not working
**Solution:** Check that user was registered first, verify backend auth endpoint

---

## 🎯 Next Steps

After starting the app:

1. ✅ Create an account
2. ✅ Login and explore Dashboard
3. ✅ Try sending a payment
4. ✅ Test real-time chat (use 2 browser windows)
5. ✅ Set up recurring payments
6. ✅ Create expense splits
7. ✅ Manage friends and notifications

---

## 📧 Frontend Highlights

✨ **No Tailwind CSS** - Pure CSS with custom design tokens  
✨ **Redux State Management** - Centralized state  
✨ **Real-Time WebSocket** - Live chat & notifications  
✨ **JWT Authentication** - Secure token-based auth  
✨ **Responsive Design** - Mobile-first approach  
✨ **Type-Safe** - Full TypeScript support  
✨ **API Integrated** - All endpoints connected  
✨ **Protected Routes** - Auth-based access control  

---

**Everything is ready to go!** 🎉

Run `pnpm install` and `pnpm dev` to start.
