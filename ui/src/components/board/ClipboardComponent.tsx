import React, { useState, useCallback } from "react";
import "./ClipboardComponent.less"; // Styles for the component
import { Input, Button, message } from "antd";
import { apiRequest } from "@/services/setup.ts";

const { TextArea } = Input;

const ClipboardComponent: React.FC = () => {
    const [clipboardContent, setClipboardContent] = useState<string>("");

    // Sync content with backend
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
        try {
            const response = await apiRequest("sharedboard/", {
                method: "POST",
                data: { message: clipboardContent },
            });

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
            const response = await apiRequest<{ message: string }>("sharedboard/", {
                method: "GET",
            });

            setClipboardContent(response.data.message);
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
        </div>
    );
};

export default ClipboardComponent;