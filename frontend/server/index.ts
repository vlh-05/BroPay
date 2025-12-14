import "dotenv/config";
import express from "express";
import cors from "cors";
import { handleDemo } from "./routes/demo";

// In-memory storage for demo purposes
const users: Record<string, any> = {};
const payments: Record<string, any[]> = {};
const chats: Record<string, any[]> = {};
const friends: Record<string, any[]> = {};
const friendRequests: Record<string, any[]> = {}; // tracks pending requests
const friendsList: Record<string, Set<string>> = {}; // confirmed friendships

export function createServer() {
  const app = express();

  // Middleware
  app.use(cors());
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // Example API routes
  app.get("/api/ping", (_req, res) => {
    const ping = process.env.PING_MESSAGE ?? "ping";
    res.json({ message: ping });
  });

  app.get("/api/demo", handleDemo);

  // Auth endpoints
  app.post("/api/auth/register", (req, res) => {
    const { name, email, password } = req.body;
    if (!email || !password || !name) {
      return res.status(400).json({ error: "Missing required fields" });
    }
    users[email] = { name, email, password };
    payments[email] = [];
    friends[email] = [];
    chats[email] = [];
    res.json({ success: true, user: { name, email } });
  });

  app.post("/api/auth/login", (req, res) => {
    const { email, password } = req.body;
    const user = users[email];
    if (!user || user.password !== password) {
      return res.status(401).json({ error: "Invalid credentials" });
    }
    const token = `token_${email}_${Date.now()}`;
    res.json({
      success: true,
      user: { name: user.name, email: user.email, role: "user" },
      token,
    });
  });

  // Analytics endpoints
  app.get("/api/analytics/summary/:userEmail", (req, res) => {
    const { userEmail } = req.params;
    const userPayments = payments[userEmail] || [];
    const totalPayments = userPayments.reduce(
      (sum, p) => sum + (p.payer === userEmail ? p.amount : 0),
      0
    );
    const totalReceived = userPayments.reduce(
      (sum, p) => sum + (p.receiver === userEmail ? p.amount : 0),
      0
    );

    res.json({
      totalPayments,
      totalReceived,
      pendingPayments: 0,
      totalSplits: 0,
    });
  });

  // Payment endpoints
  app.post("/api/payment/process", (req, res) => {
    const { payer, receiver, amount } = req.body;
    const payment = {
      payer,
      receiver,
      amount,
      timestamp: new Date().toISOString(),
    };
    if (!payments[payer]) payments[payer] = [];
    if (!payments[receiver]) payments[receiver] = [];
    payments[payer].push(payment);
    payments[receiver].push(payment);
    res.json({ success: true, payment });
  });

  app.get("/api/payment/payer/:payer", (req, res) => {
    const { payer } = req.params;
    const userPayments = payments[payer] || [];
    res.json(userPayments);
  });

  // Chat endpoints
  app.post("/api/chat/send", (req, res) => {
    const io = req.app.get("io");
    const { sender, receiver, message } = req.body;

    const key = [sender, receiver].sort().join(":");
    if (!chats[key]) chats[key] = [];

    const chatMessage = {
      sender,
      receiver,
      message,
      timestamp: new Date().toISOString(),
      delivered: false,
    };

    chats[key].push(chatMessage);

    if (io) io.emit("message:received", chatMessage);

    res.json({ success: true, message: chatMessage });
  });

  // GET conversation history
  app.get("/api/chat/conversation/:user1/:user2", (req, res) => {
    const { user1, user2 } = req.params;
    const key = [user1, user2].sort().join(":");
    res.json(chats[key] || []);
  });

  // GET offline messages
  app.get("/api/chat/offline/:email", (req, res) => {
    const { email } = req.params;
    const undelivered: any[] = [];

    for (const key in chats) {
      chats[key].forEach((msg) => {
        if (msg.receiver === email && msg.delivered === false) {
          undelivered.push(msg);
          msg.delivered = true;
        }
      });
    }

    res.json({ success: true, messages: undelivered });
  });

  app.get("/api/chat/history", (req, res) => {
    const allChats = Object.values(chats).flat();
    res.json(allChats);
  });

  app.get("/api/chat/conversation/:user1/:user2", (req, res) => {
    const { user1, user2 } = req.params;
    const chatKey = [user1, user2].sort().join(":");
    const conversation = chats[chatKey] || [];
    res.json(conversation);
  });

  // Friends endpoints
  app.post("/api/friends/send", (req, res) => {
    const { senderEmail, receiverEmail } = req.body;

    // Initialize arrays if they don't exist
    if (!friendRequests[receiverEmail]) friendRequests[receiverEmail] = [];
    if (!friendsList[senderEmail]) friendsList[senderEmail] = new Set();
    if (!friendsList[receiverEmail]) friendsList[receiverEmail] = new Set();

    // Check if already friends
    if (friendsList[senderEmail].has(receiverEmail)) {
      return res.status(400).json({ error: "Already friends" });
    }

    // Check if request already exists
    const exists = friendRequests[receiverEmail].some(
      (req) => req.senderEmail === senderEmail
    );
    if (exists) {
      return res.status(400).json({ error: "Friend request already sent" });
    }

    // Add the request
    const request = {
      id: `fr_${Date.now()}_${Math.random()}`,
      senderEmail,
      receiverEmail,
      status: "pending",
      timestamp: new Date().toISOString(),
    };
    friendRequests[receiverEmail].push(request);

    res.json({ success: true, message: "Friend request sent", request });
  });

  app.post("/api/friends/respond", (req, res) => {
    const { senderEmail, receiverEmail } = req.body;
    const accept = req.query.accept === "true";

    if (!friendRequests[receiverEmail]) {
      return res.status(404).json({ error: "No friend requests" });
    }

    const requestIdx = friendRequests[receiverEmail].findIndex(
      (r) => r.senderEmail === senderEmail
    );
    if (requestIdx === -1) {
      return res.status(404).json({ error: "Friend request not found" });
    }

    if (accept) {
      // Add to both friends lists
      if (!friendsList[senderEmail]) friendsList[senderEmail] = new Set();
      if (!friendsList[receiverEmail]) friendsList[receiverEmail] = new Set();
      friendsList[senderEmail].add(receiverEmail);
      friendsList[receiverEmail].add(senderEmail);
    }

    // Remove the request
    friendRequests[receiverEmail].splice(requestIdx, 1);

    res.json({
      success: true,
      message: accept ? "Friend request accepted" : "Friend request rejected",
    });
  });

  app.get("/api/friends/:userEmail", (req, res) => {
    const { userEmail } = req.params;

    // Return list of friends
    const friendEmails = friendsList[userEmail]
      ? Array.from(friendsList[userEmail])
      : [];
    const friendList = friendEmails.map((email) => ({
      email,
      name: users[email]?.name || email,
    }));

    res.json(friendList);
  });

  // Get pending friend requests for a user
  app.get("/api/friends/requests/:userEmail", (req, res) => {
    const { userEmail } = req.params;
    const requests = friendRequests[userEmail] || [];
    res.json(requests);
  });

  // Recurring payment endpoints
  app.post("/api/recurring/setup", (req, res) => {
    const { payer, receiver, amount, frequency } = req.body;
    res.json({
      success: true,
      recurring: {
        payer,
        receiver,
        amount,
        frequency,
        id: `recurring_${Date.now()}`,
      },
    });
  });

  app.get("/api/recurring/user/:userId", (req, res) => {
    res.json([]);
  });

  // Split payment endpoints
  app.post("/api/split/compute", (req, res) => {
    const { initiatorId, lineItems, participants, splitType } = req.body;
    const totalAmount = lineItems.reduce(
      (sum: number, item: any) => sum + item.amount,
      0
    );
    const perPerson = totalAmount / (participants.length + 1);

    res.json({
      success: true,
      split: {
        total: totalAmount,
        participants: participants.map((p: any) => ({
          ...p,
          owes: perPerson,
        })),
      },
    });
  });

  // Receipt/OCR endpoints
  app.post("/api/receipts/upload", (req, res) => {
    res.json({ success: true, message: "Receipt uploaded" });
  });

  app.post("/api/ocr/parseBase64", (req, res) => {
    const { base64Image } = req.body;
    res.json({
      success: true,
      data: {
        items: [],
        total: 0,
      },
    });
  });

  return app;
}

export function attachSocketIO(io: any) {
  return (socket: any) => {
    console.log("User connected:", socket.id);

    socket.on("chat:send", (data: any) => {
      const { sender, receiver, content, message } = data;

      const chatKey = [sender, receiver].sort().join(":");

      if (!chats[chatKey]) chats[chatKey] = [];

      const chatMessage = {
        sender,
        receiver,
        message: message || content || "",
        timestamp: new Date().toISOString(),
        delivered: false,
      };

      chats[chatKey].push(chatMessage);
      io.emit("message:received", chatMessage);
    });

    socket.on("chat:typing", (data: any) => {
      io.emit("chat:typing", data);
    });

    socket.on("user:status", (data: any) => {
      if (data.status === "online") {
        io.emit("user:online", data);
      } else {
        io.emit("user:offline", data);
      }
    });

    socket.on("friendRequest:send", (data: any) => {
      io.emit("friendRequest:received", data);
    });

    socket.on("notification:send", (data: any) => {
      io.emit("notification:received", data);
    });

    socket.on("payment:notify", (data: any) => {
      io.emit("payment:notification", data);
    });

    socket.on("disconnect", () => {
      console.log("User disconnected:", socket.id);
    });
  };
}
