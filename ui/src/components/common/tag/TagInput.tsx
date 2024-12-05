import React, { useState } from "react";
import { Input, Tag, Button } from "antd";
import { PlusOutlined } from "@ant-design/icons";

interface TagInputProps {
    tags: string[];
    onTagAdd: (tag: string) => void;
    onTagRemove: (tag: string) => void;
}

const TagInput: React.FC<TagInputProps> = ({ tags, onTagAdd, onTagRemove }) => {
    const [currentTag, setCurrentTag] = useState<string>("");

    const handleAddTag = () => {
        if (currentTag && currentTag.length <= 50 && !tags.includes(currentTag)) {
            onTagAdd(currentTag);
            setCurrentTag("");
        }
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setCurrentTag(e.target.value);
    };

    const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            handleAddTag();
        }
    };

    return (
        <div>
            {tags.map((tag) => (
                <Tag
                    key={tag}
                    closable
                    onClose={() => onTagRemove(tag)}
                    style={{ marginBottom: 8 }}
                >
                    {tag}
                </Tag>
            ))}
            <Input
                type="text"
                value={currentTag}
                onChange={handleInputChange}
                onKeyDown={handleKeyPress}
                style={{ width: 200, marginRight: 8, marginBottom: 8 }}
                placeholder="New tag"
                suffix={<Button icon={<PlusOutlined />} onClick={handleAddTag} />}
            />
        </div>
    );
};

export default TagInput;