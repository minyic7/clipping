import React, { ChangeEvent, useCallback } from "react";
import { Input } from "antd";
import { useDispatch, useSelector } from "react-redux";
import { AppDispatch, RootState } from "@/store/store";
import { setSearchTerm } from "@/store/slices/gallerySlice.ts"; // Add a `setSearchTerm` reducer in gallerySlice for this

const { Search } = Input;

const SearchBar: React.FC = () => {
    const dispatch = useDispatch<AppDispatch>();
    const searchTerm = useSelector((state: RootState) => state.gallery.searchTerm);

    const handleSearchChange = useCallback((e: ChangeEvent<HTMLInputElement>) => {
        dispatch(setSearchTerm(e.target.value));
    }, [dispatch]);

    const handleSearch = (value: string) => {
        dispatch(setSearchTerm(value));
    };

    return (
        <Search
            placeholder="Search by tag, title, or description"
            onSearch={handleSearch}
            onChange={handleSearchChange}
            allowClear
            value={searchTerm}
        />
    );
};

export default SearchBar;