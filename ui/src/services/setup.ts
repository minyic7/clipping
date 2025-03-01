import axios, {
    AxiosError,
    AxiosInstance,
    AxiosRequestConfig,
    AxiosResponse,
    InternalAxiosRequestConfig,
} from 'axios';
import {useNavigate} from "react-router-dom";



// Configurable API Base URL
const BASE_URL = '/api/';

// Create an Axios instance
const apiClient: AxiosInstance = axios.create({
    baseURL: BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

/**
 * Generic function to handle API requests.
 */
const apiRequest = async <T>(endpoint: string, options: AxiosRequestConfig = {}): Promise<AxiosResponse<T>> => {
    try {
        const processedEndpoint = endpoint.replace(/.*?(api\/v[0-9]*\/)/, '');
        return await apiClient.request({url: processedEndpoint, ...options});
    } catch (error) {
        if (axios.isAxiosError(error)) {
            console.error('API Request Error:', error.response?.data);
            throw error.response?.data || new Error('API request failed');
        }
        throw new Error('Unexpected API error');
    }
};

// Token & User Handling
export const getAccessToken = (): string | null => localStorage.getItem('access_token');
export const getRefreshToken = (): string | null => localStorage.getItem('refresh_token');
export const getUsername = (): string | null => localStorage.getItem('username');
export const getUserID = (): string | null => localStorage.getItem('user_id');

export const setTokens = (accessToken: string, refreshToken: string): void => {
    localStorage.setItem('access_token', accessToken);
    localStorage.setItem('refresh_token', refreshToken);
};

/**
 * Ensures `user_id` is present in localStorage.
 */
export const ensureUserID = async (): Promise<void> => {
    const username = getUsername(); // Fetch username from a reliable source

    // Skip fetching user_id if the user is a guest
    if (username === 'guest') {
        localStorage.removeItem('user_id'); // Unset user_id for guest users
        localStorage.setItem('user_id', '-1')

        console.info('Guest user detected. Skipping user_id fetch.');
        return;
    }

    // Always fetch user_id for non-guest users to ensure it is up-to-date
    if (username) {
        try {
            console.log(`Fetching updated user_id for username: ${username}`);
            const userIdResponse = await apiRequest<{ user_id: number }>(
                `user/get_user_id/?username=${username}`,
                {method: 'GET'}
            );

            // Update localStorage with the latest user_id, overwriting old value if exists
            localStorage.setItem('user_id', String(userIdResponse.data.user_id));
            console.log(`User ID updated successfully: ${userIdResponse.data.user_id}`);
        } catch (error) {
            console.error('Failed to fetch user_id:', error);
        }
    }
};

/**
 * Ensures an access token exists and is valid.
 * Fetches new tokens or refreshes existing tokens as needed.
 */
export const ensureAccessToken = async (credentials?: { username: string; password: string }): Promise<void> => {
    const currentToken = getAccessToken();
    const refreshToken = getRefreshToken();

    if (currentToken && (await isAccessTokenValid(currentToken))) {
        console.log('Access token is valid');
        return;
    }

    console.warn('Access token missing or expired. Attempting refresh...');
    if (refreshToken) {
        await refreshAccessToken();
    } else {
        console.warn('No refresh token available. Fetching new tokens...');
        await obtainNewTokens(credentials);
    }

    // Ensure user_id is present after successful token retrieval
    await ensureUserID();
};

/**
 * Fetches new tokens when refresh token is missing/invalid.
 * Sets `user_id` to `"none"` for guest users.
 */
export const obtainNewTokens = async (credentials?: { username: string; password: string }): Promise<void> => {
    const defaultCredentials = credentials || {username: 'guest', password: 'guest'};

    try {
        const response = await axios.post(`${BASE_URL}token/`, defaultCredentials);
        const {access, refresh} = response.data;

        setTokens(access, refresh);
        localStorage.setItem('username', defaultCredentials.username);
        // Update the Redux state

        console.log('Successfully obtained new tokens.');
    } catch (error) {
        console.error('Failed to obtain new tokens:', error);
        throw new Error('Failed to authenticate.');
    }

    // Ensure user_id is set after successfully obtaining tokens
    await ensureUserID();


};

/**
 * Refreshes the access token using the refresh token.
 */
const refreshAccessToken = async (): Promise<void> => {
    const refreshToken = getRefreshToken();
    if (!refreshToken) {
        console.warn('No refresh token found. Requesting new credentials...');
        await obtainNewTokens();
        return;
    }

    try {
        const response = await axios.post(`${BASE_URL}token/refresh/`, {refresh: refreshToken});
        setTokens(response.data.access, refreshToken);
        console.log('Token refreshed successfully.');
    } catch (error) {
        console.error('Failed to refresh token:', error);
        await obtainNewTokens();
    }

    // Ensure user_id is set after token refresh
    await ensureUserID();
};

/**
 * Verifies if the access token is valid.
 */
const isAccessTokenValid = async (accessToken: string): Promise<boolean> => {
    try {
        await axios.post(`${BASE_URL}token/verify/`, {token: accessToken});
        return true;
    } catch {
        return false;
    }
};


/**
 * Logs in the user with provided credentials and navigates to a specified path.
 *
 * @param credentials - The login credentials (username and password).
 * @param navigate - A function from `useNavigate` to handle navigation.
 * @param redirectPath - The path to navigate to after successful login (default: `/gallery`).
 * @param onSuccess - Optional callback function to execute after successful login (e.g., close modal).
 * @throws Error if credentials are missing or login fails.
 */
export const login = async (
    credentials: { username: string; password: string },
    navigate: ReturnType<typeof useNavigate>,
    redirectPath: string,
    onSuccess?: () => void // Optional callback function
): Promise<void> => {
    if (!credentials || !credentials.username || !credentials.password) {
        throw new Error('Username and password must be provided for login.');
    }

    try {
        console.log(`Attempting to log in as ${credentials.username}...`);

        await obtainNewTokens(credentials)
        localStorage.setItem('username', credentials.username);

        console.log('Successfully logged in.');

        // Fetch and set user_id
        await ensureUserID();

        // Run callback function if provided (e.g., close modal)
        if (onSuccess) {
            onSuccess();
        }

        // Navigate to the provided redirectPath
        navigate(redirectPath);
    } catch (error) {
        console.error('Login failed:', error);
        throw new Error('Invalid username or password.');
    }
};

/**
 * Logs in as a guest user and navigates to a specified path.
 *
 * @param navigate - Function from `useNavigate` to handle navigation.
 * @param redirectPath - The path to navigate to after successful login (default: `/gallery`).
 * @param onGuestLogin - Optional callback function to execute after guest login (e.g., close modal).
 */
export const loginAsGuest = async (
    navigate: ReturnType<typeof useNavigate>,
    redirectPath: string = '/gallery',
    onGuestLogin?: () => void
): Promise<void> => {
    const guestCredentials = {username: 'guest', password: 'guest'}; // Default guest credentials

    try {
        console.log('Attempting to log in as guest...');

        await obtainNewTokens(guestCredentials)
        localStorage.setItem('username', guestCredentials.username);

        console.log('Successfully logged in as guest.');

        // Set `user_id` to `-1` for guest users
        localStorage.setItem('user_id', '-1');
        console.info('Guest user_id set to -1.');

        // Run callback function if provided (e.g., close modal)
        if (onGuestLogin) {
            onGuestLogin();
        }

        // Navigate to the specified redirect path
        navigate(redirectPath);
    } catch (error) {
        console.error('Guest login failed:', error);
        throw new Error('Failed to log in as guest.');
    }
};

// Interceptors

// **Request Interceptor: Adds Token & Ensures Validity**
apiClient.interceptors.request.use(
    async (config: InternalAxiosRequestConfig) => {
        const accessToken = getAccessToken();
        if (!accessToken) {
            console.warn('No access token found. Ensuring authentication...');
            await ensureAccessToken();
        }

        const newAccessToken = getAccessToken();
        if (newAccessToken) {
            config.headers.Authorization = `Bearer ${newAccessToken}`;
        }
        return config;
    },
    (error: AxiosError) => Promise.reject(error)
);

// **Response Interceptor: Handles 401 Errors & Refreshes Token**
apiClient.interceptors.response.use(
    (response) => response,
    async (error: AxiosError) => {
        const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

        if (error.response?.status === 401 && !originalRequest._retry) {
            console.warn('401 Unauthorized. Attempting token refresh...');
            originalRequest._retry = true;

            await refreshAccessToken();
            const accessToken = getAccessToken();

            if (accessToken) {
                originalRequest.headers.Authorization = `Bearer ${accessToken}`;
                return apiClient(originalRequest);
            }
        }

        return Promise.reject(error);
    }
);

export {apiClient, apiRequest};