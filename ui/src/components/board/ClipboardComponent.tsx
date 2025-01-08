import React, { useState, useCallback } from "react";
import "./ClipboardComponent.less"; // Styles for the component
import { Input, Button, message } from "antd";
import { apiRequest } from "@/services/setup.ts";

const { TextArea } = Input;

const ClipboardComponent: React.FC = () => {
    const [clipboardContent, setClipboardContent] = useState<string>(""); // Current clipboard content
    const [lastSentMessage, setLastSentMessage] = useState<string>(""); // Track the latest sent message
    const [fetchedContent, setFetchedContent] = useState<string>(""); // Store fetched content

    // Sync content with backend (optional use case for extensibility)
    const syncClipboardContent = useCallback((content: string) => {
        console.log("Synchronizing clipboard content:", content);
    }, []);

    // Handle changes to the text area
    const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        const newContent = e.target.value;
        setClipboardContent(newContent); // Update local clipboard
        syncClipboardContent(newContent); // Trigger sync
    };

    // Handle sending clipboard content via POST request
    const handleSendClipboardContent = async () => {
        if (!clipboardContent.trim()) {
            message.warning("Clipboard content is empty. Please enter some text.");
            return;
        }

        try {
            const response = await apiRequest("sharedboard/", {
                method: "POST",
                data: { message: clipboardContent },
            });

            // Track the last sent message
            setLastSentMessage(clipboardContent);

            // Clear the clipboard content after sending
            setClipboardContent("");

            message.success("Clipboard content sent successfully!");
            console.log("POST Response:", response.data);
        } catch (error) {
            console.error("Error sending clipboard content:", error);
            message.error("Failed to send clipboard content.");
        }
    };

    // Handle fetching the latest clipboard content via GET request
    const handleFetchClipboardContent = async () => {
        try {
            const response = await apiRequest<{ latest_message: string }>("sharedboard/", {
                method: "GET",
            });

            // Use response.data directly to get the latest message
            setFetchedContent(response.data.latest_message);

            message.success("Clipboard content fetched successfully!");
            console.log("GET Response:", response.data);
        } catch (error) {
            console.error("Error fetching clipboard content:", error);
            message.error("Failed to fetch clipboard content.");
        }
    };

    return (
        <div className="clipboard-container">
            <h3>Shared Clipboard</h3>
            <TextArea
                value={clipboardContent}
                onChange={handleContentChange}
                placeholder="Type or paste content here..."
                autoSize={{ minRows: 5, maxRows: 10 }}
            />
            <div className="button-group">
                <Button type="primary" onClick={handleSendClipboardContent}>
                    Send
                </Button>
                <Button type="default" onClick={handleFetchClipboardContent}>
                    Fetch
                </Button>
            </div>

            {/* Last Sent Message */}
            {lastSentMessage && (
                <div className="last-sent-message">
                    <h4>Last Sent Message:</h4>
                    <p>{lastSentMessage}</p>
                </div>
            )}

            {/* Fetched Content */}
            {fetchedContent && (
                <div className="fetched-content">
                    <h4>Fetched Content:</h4>
                    <p>{fetchedContent}</p>
                </div>
            )}
        </div>
    );
};

export default ClipboardComponent;