import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface Payment {
  id?: string;
  payer: string;
  receiver: string;
  amount: number;
  paymentMethod?: string;
  status?: string;
  timestamp?: string;
}

interface Recurring {
  id?: string;
  payer: string;
  receiver: string;
  amount: number;
  frequency: string;
  status?: string;
}

interface Split {
  id?: string;
  initiator: string;
  participants: string[];
  totalAmount: number;
  splitType: string;
  splits?: { [key: string]: number };
  status?: string;
}

interface PaymentState {
  payments: Payment[];
  recurring: Recurring[];
  splits: Split[];
  isLoading: boolean;
  error: string | null;
}

const initialState: PaymentState = {
  payments: [],
  recurring: [],
  splits: [],
  isLoading: false,
  error: null,
};

const paymentSlice = createSlice({
  name: 'payment',
  initialState,
  reducers: {
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload;
    },
    setPayments: (state, action: PayloadAction<Payment[]>) => {
      state.payments = action.payload;
    },
    addPayment: (state, action: PayloadAction<Payment>) => {
      state.payments.push(action.payload);
    },
    setRecurring: (state, action: PayloadAction<Recurring[]>) => {
      state.recurring = action.payload;
    },
    addRecurring: (state, action: PayloadAction<Recurring>) => {
      state.recurring.push(action.payload);
    },
    setSplits: (state, action: PayloadAction<Split[]>) => {
      state.splits = action.payload;
    },
    addSplit: (state, action: PayloadAction<Split>) => {
      state.splits.push(action.payload);
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
  setPayments,
  addPayment,
  setRecurring,
  addRecurring,
  setSplits,
  addSplit,
  setError,
  clearError,
} = paymentSlice.actions;

export default paymentSlice.reducer;
