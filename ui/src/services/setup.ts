// src/services/setup.ts
import axios, { AxiosRequestConfig, AxiosInstance } from 'axios';
import { ApiResponse } from '@/services/types.ts';

// Configurable variables
const API_VERSION = 'v1'; // Adjust the version as necessary
const BASE_URL = `http://127.0.0.1:5000/api/${API_VERSION}`;

// Create an axios instance with default configurations
const apiClient: AxiosInstance = axios.create({
    baseURL: BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

/**
 * Generic function to handle API requests.
 * @param endpoint - API endpoint.
 * @param options - Request options including method, headers, body, etc.
 * @returns Response data or error.
 */
const apiRequest = async <T>(endpoint: string, options: AxiosRequestConfig = {}): Promise<ApiResponse<T>> => {
    try {
        const response = await apiClient.request({ url: endpoint, ...options });
        return response.data as ApiResponse<T>;
    } catch (error) {
        if (axios.isAxiosError(error)) {
            // You can further handle or log the error as necessary
            console.error('AXIOS ERROR:', error.response?.data);
            throw error.response?.data || new Error('An error occurred while making the request');
        }
        throw new Error('An unexpected error occurred');
    }
};

export { apiClient, apiRequest };