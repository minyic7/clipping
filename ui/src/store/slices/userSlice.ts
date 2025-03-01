import { createSlice, PayloadAction, createAsyncThunk } from '@reduxjs/toolkit';
import { obtainNewTokens, ensureUserID } from '@/services/setup'; // Import reusable methods

// Define the initial state structure
interface UserState {
    userId: string; // Null for guests
    username: string; // Null for guests
    isGuestUser: boolean; // True if userId is null or invalid
    loading: boolean; // For tracking the login process
    error: string | null; // For handling errors during login
}

// Helper function to initialize the state dynamically from local storage
const getInitialUserState = (): UserState => {
    const userId = localStorage.getItem('user_id') || '-1';
    const username = localStorage.getItem('username') || 'guest';

    return {
        userId,
        username,
        isGuestUser: userId === '-1' || !userId,
        loading: false,
        error: null,
    };
};

// Get the initial state from local storage
const initialState: UserState = getInitialUserState();

// **Thunk for handling login actions**
export const loginThunk = createAsyncThunk(
    'user/login',
    async (
        { username, password }: { username: string; password: string },
        { rejectWithValue, dispatch }
    ) => {
        try {
            // Obtain tokens and store them in localStorage
            await obtainNewTokens({ username, password });

            // Ensure user ID is updated in localStorage
            await ensureUserID();

            const userId = localStorage.getItem('user_id') || '-1';

            // Dispatch actions to update Redux state
            dispatch(setUser({ userId, username }));

            return { userId, username };
        } catch (error: unknown) {
            console.error('Login failed:', error);
            return rejectWithValue('Login failed. Please check your credentials.');
        }
    }
);

// Thunk for handling guest login
export const guestLoginThunk = createAsyncThunk(
    'user/guestLogin',
    async (_, { rejectWithValue, dispatch }) => {
        try {
            const guestCredentials = { username: 'guest', password: 'guest' };

            // Obtain guest tokens and store them
            await obtainNewTokens(guestCredentials);

            // Set guest-specific values for `user_id` and `username`
            localStorage.setItem('user_id', '-1');
            const userId = '-1';
            const username = 'guest';

            // Update Redux store
            dispatch(setUser({ userId, username }));

            return { userId, username };
        } catch (error: unknown) {
            console.error('Guest login failed:', error);
            return rejectWithValue('Guest login failed. Please try again.');
        }
    }
);

// Create the user slice
const userSlice = createSlice({
    name: 'user',
    initialState,
    reducers: {
        setUser: (state, action: PayloadAction<{ userId: string; username: string }>) => {
            state.userId = action.payload.userId;
            state.username = action.payload.username;
            state.isGuestUser = false;

            // Update localStorage
            localStorage.setItem('user_id', action.payload.userId.toString());
            localStorage.setItem('username', action.payload.username);
        },
        setUserId: (state, action: PayloadAction<string>) => {
            state.userId = action.payload;
            state.isGuestUser = action.payload === '-1';

            // Update localStorage
            localStorage.setItem('user_id', action.payload);
        },
        setUsername: (state, action: PayloadAction<string>) => {
            state.username = action.payload;

            // Update localStorage
            localStorage.setItem('username', action.payload);
        },
        logoutUser: (state) => {
            state.userId = '-1';
            state.username = 'guest';
            state.isGuestUser = true;

            // Clear local storage
            localStorage.removeItem('user_id');
            localStorage.removeItem('username');
        },
    },
    extraReducers: (builder) => {
        // Handle login success, loading, and errors
        builder
            .addCase(loginThunk.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(loginThunk.fulfilled, (state, action) => {
                state.userId = action.payload.userId;
                state.username = action.payload.username;
                state.isGuestUser = false;
                state.loading = false;
            })
            .addCase(loginThunk.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload as string;
            });

        // Handle guest login success, loading, and errors
        builder
            .addCase(guestLoginThunk.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(guestLoginThunk.fulfilled, (state, action) => {
                state.userId = action.payload.userId;
                state.username = action.payload.username;
                state.isGuestUser = true;
                state.loading = false;
            })
            .addCase(guestLoginThunk.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload as string;
            });
    },
});

// Export actions and the reducer
export const { setUser, setUserId, setUsername, logoutUser } = userSlice.actions;
export default userSlice.reducer;