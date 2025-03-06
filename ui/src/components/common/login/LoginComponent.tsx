import React, { useState } from "react";
import "./LoginComponent.less";
import { useAppDispatch, useAppSelector } from "@/store/hook"; // Import hooks
import { loginThunk, guestLoginThunk } from "@/store/slices/userSlice";
import { useNavigate } from "react-router-dom";


interface LoginComponentProps {
    redirectPath?: string; // Optional redirect path (default is /gallery)
    onSuccess?: () => void; // Optional callback to execute on successful login
    onGuestLogin?: () => void; // Optional callback to execute on failed login
}

const LoginComponent: React.FC<LoginComponentProps> = ({redirectPath = "/gallery", onSuccess, onGuestLogin}) => {
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const dispatch = useAppDispatch();
    const navigate = useNavigate();

    const { loading, error } = useAppSelector((state) => state.user); // Get loading & error states

    // Handle login
    const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        await dispatch(loginThunk({ username, password })).unwrap();
        navigate(redirectPath);
        if (onSuccess) {
            onSuccess();
        }
    };

    // Handle guest login
    const handleGuestLogin = async () => {
        await dispatch(guestLoginThunk()).unwrap();
        if (onGuestLogin) {
            onGuestLogin();
        } else {
            navigate(redirectPath);
        }
    };

    return (
        <div className="login-container">
            <form className="login-form" onSubmit={handleLogin}>
                <label htmlFor="username">Username</label>
                <input
                    type="text"
                    id="username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="Enter your username"
                />
                <label htmlFor="password">Password</label>
                <input
                    type="password"
                    id="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your password"
                />
                {error && <p className="error-message">{error}</p>}
                <button type="submit" disabled={loading}>
                    {loading ? "Logging in..." : "Login"}
                </button>
            </form>
            <p className="no-signup-note">
                Sign-up is not available at the moment.
                <a className="guest-login-link" onClick={handleGuestLogin}>
                    {loading ? "Logging in as Guest..." : "Login as Guest"}
                </a>
            </p>
        </div>
    );
};

export default LoginComponent;