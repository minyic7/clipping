import axios, {AxiosError, AxiosInstance, AxiosRequestConfig, AxiosResponse, InternalAxiosRequestConfig} from 'axios';

// Configurable variables
// Use VITE_API_BASE_URL if defined, otherwise fall back to /api/
const BASE_URL = '/api/';

// Hardcoded credentials (for development purposes)
const HARDCODED_CREDENTIALS = {
    username: 'minyic',

    password: '1041420051Yi@'
};

// Create an axios instance with default configurations
const apiClient: AxiosInstance = axios.create({
    baseURL: BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

const getAccessToken = (): string | null => {
    return localStorage.getItem('access_token');
};

const getRefreshToken = (): string | null => {
    return localStorage.getItem('refresh_token');
};

const setTokens = (accessToken: string, refreshToken: string): void => {
    localStorage.setItem('access_token', accessToken);
    localStorage.setItem('refresh_token', refreshToken);
};

// Function to get initial tokens using hardcoded credentials
const getInitialTokens = async (): Promise<void> => {
    console.log('Fetching initial token');
    try {
        console.log('Baseurl: ', BASE_URL);
        const response = await axios.post(`${BASE_URL}token/`, HARDCODED_CREDENTIALS);

        const { access, refresh } = response.data;
        setTokens(access, refresh);
    } catch (error) {
        console.error('Error obtaining initial tokens:', error);
        throw new Error('Failed to obtain initial tokens.');
    }
};

// Function to refresh access token using refresh token
const refreshAccessToken = async (): Promise<void> => {
    const refreshToken = getRefreshToken();
    if (!refreshToken) {
        console.warn('No refresh token available, retrieving initial tokens...');
        await getInitialTokens();
        return;
    }

    try {
        const response = await axios.post(`${BASE_URL}token/refresh/`, { refresh: refreshToken });

        const { access } = response.data;
        setTokens(access, refreshToken);
    } catch (error) {
        console.error('Error refreshing token:', error);
        console.warn('Failed to refresh access token, retrieving initial tokens...');
        await getInitialTokens();
    }
};

// Function to check if access token is valid
const isAccessTokenValid = async (accessToken: string): Promise<boolean> => {
    try {
        await axios.post(`${BASE_URL}token/verify/`, { token: accessToken });
        return true;
    } catch (error) {
        console.log('Token is invalid:', error);
        return false;
    }
};

// Request interceptor to add the access token to headers
apiClient.interceptors.request.use(
    async (config: InternalAxiosRequestConfig) => {
        let accessToken = getAccessToken();

        if (!accessToken) {
            await getInitialTokens();
            accessToken = getAccessToken();
        }

        if (accessToken && await isAccessTokenValid(accessToken)) {
            config.headers.Authorization = `Bearer ${accessToken}`;
        } else {
            await refreshAccessToken();
            accessToken = getAccessToken();
            if (accessToken) {
                config.headers.Authorization = `Bearer ${accessToken}`;
            }
        }

        return config;
    },
    (error: AxiosError) => {
        return Promise.reject(error);
    }
);

// Response interceptor to handle 401 errors and refresh the token
apiClient.interceptors.response.use(
    response => response,
    async (error: AxiosError) => {
        const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

        if (error.response?.status === 401 && !originalRequest._retry) {
            originalRequest._retry = true;

            await refreshAccessToken();
            const accessToken = getAccessToken();

            if (accessToken) {
                originalRequest.headers.Authorization = `Bearer ${accessToken}`;
                return apiClient(originalRequest);
            }
        } else if (error.response?.status === 401) {
            // Perform clean-up or redirect to login page
        }

        return Promise.reject(error);
    }
);

/**
 * Generic function to handle API requests.
 * @param endpoint - API endpoint.
 * @param options - Request options including method, headers, body, etc.
 * @returns Full response data or error.
 */
const apiRequest = async <T>(endpoint: string, options: AxiosRequestConfig = {}): Promise<AxiosResponse<T>> => {
    try {
        // Process the endpoint to remove everything before 'api/v[version_no]/'
        const processedEndpoint = endpoint.replace(/.*?(api\/v[0-9]*\/)/, '');

        return await apiClient.request({url: processedEndpoint, ...options});
    } catch (error) {
        if (axios.isAxiosError(error)) {
            console.error('AXIOS ERROR:', error.response?.data);
            throw error.response?.data || new Error('An error occurred while making the request');
        }
        throw new Error('An unexpected error occurred');
    }
};

export { apiClient, apiRequest };