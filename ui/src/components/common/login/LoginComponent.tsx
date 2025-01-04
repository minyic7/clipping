import React from "react";
import { Button, Form, Input, Typography } from "antd";
import { useNavigate } from "react-router-dom";
import { ensureAccessToken } from "@/services/setup"; // Use the combined ensureAccessToken here
import "./LoginComponent.less";
import axios from "axios";

const { Text, Link } = Typography;

const LoginComponent: React.FC = () => {
    const navigate = useNavigate();

    // Modified handleLogin to use ensureAccessToken
    const handleLogin = async (credentials: { username: string; password: string }) => {
        try {
            // Call ensureAccessToken with user-provided credentials
            await ensureAccessToken(credentials);

            // Navigate to the home page on successful login
            console.log(`Login successful. Navigating to home page.`);
            navigate("/");
        } catch (error: unknown) {
            console.error("Login failed:", error);

            // Check if the error is an AxiosError
            if (axios.isAxiosError(error)) {
                const errorMessage =
                    error.response?.data?.detail || "Invalid credentials";
                alert(`Login failed: ${errorMessage}`);
            } else if (error instanceof Error) {
                // Handle other possible error types (e.g., generic errors)
                alert(`Login failed: ${error.message}`);
            } else {
                // Fallback for unexpected error shapes
                alert("Login failed: An unexpected error occurred.");
            }
        }
    };

    return (
        <div className="login-container">
            <Form
                name="login_form"
                layout="vertical"
                onFinish={handleLogin} // Handles form success with user's credentials
                className="login-form"
            >
                <Form.Item
                    label="Username"
                    name="username"
                    rules={[
                        { required: true, message: "Please enter your username!" },
                    ]}
                >
                    <Input placeholder="Enter your username" />
                </Form.Item>
                <Form.Item
                    label="Password"
                    name="password"
                    rules={[
                        { required: true, message: "Please enter your password!" },
                    ]}
                >
                    <Input.Password placeholder="Enter your password" />
                </Form.Item>
                <Form.Item>
                    <Button type="primary" htmlType="submit" className="login-btn">
                        Login
                    </Button>
                </Form.Item>
                <Text type="secondary">
                    Don't have an account? <Link disabled>Sign up (Currently unavailable)</Link>
                </Text>
            </Form>
        </div>
    );
};

export default LoginComponent;