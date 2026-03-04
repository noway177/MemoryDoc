"use client";

import { useState, useEffect, useCallback } from "react";
import { Plus } from "lucide-react";
import { toast } from "sonner";
import { DocumentList } from "./components/DocumentList";
import { DocumentForm } from "./components/DocumentForm";
import { Filters } from "./components/Filters";

const DOCUMENT_TYPES = ["article", "summary"];

export default function Home() {
    const [documents, setDocuments] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

    // Modals
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [editingDoc, setEditingDoc] = useState(null);

    // Filters
    const [filters, setFilters] = useState({
        search: "",
        type: "",
        ratingMin: 0,
        ratingMax: 5,
        sortBy: "newest",
        keyword: "",
    });

    const fetchDocuments = useCallback(async () => {
        try {
            setIsLoading(true);
            setError(null);

            const params = new URLSearchParams();
            if (filters.search) params.append("search", filters.search);
            if (filters.type) params.append("type", filters.type);
            if (filters.ratingMin) params.append("ratingMin", filters.ratingMin);
            if (filters.ratingMax) params.append("ratingMax", filters.ratingMax);
            if (filters.sortBy) params.append("sortBy", filters.sortBy);
            if (filters.keyword) params.append("keyword", filters.keyword);

            const response = await fetch(`/api/documents?${params.toString()}`);

            if (!response.ok) {
                throw new Error("Failed to fetch documents");
            }

            const data = await response.json();
            setDocuments(data);
        } catch (err) {
            setError(err.message);
            toast.error("Failed to load documents");
        } finally {
            setIsLoading(false);
        }
    }, [filters]);

    useEffect(() => {
        // Debounce the fetch when filters change
        const timeoutId = setTimeout(() => {
            fetchDocuments();
        }, 300);

        return () => clearTimeout(timeoutId);
    }, [fetchDocuments]);

    const handleSaveDocument = async (id, formData) => {
        const url = id ? `/api/documents/${id}` : "/api/documents";
        const method = id ? "PUT" : "POST";

        const promise = fetch(url, {
            method,
            body: formData,
        }).then(async (res) => {
            if (!res.ok) {
                const errorData = await res.json();
                throw new Error(errorData.error || "Failed to save document");
            }
            return res.json();
        }).then(() => {
            fetchDocuments();
        });

        toast.promise(promise, {
            loading: id ? 'Updating document...' : 'Uploading document...',
            success: id ? 'Document updated successfully' : 'Document uploaded successfully',
            error: (err) => err.message
        });

        return promise;
    };

    const handleDeleteDocument = async (id) => {
        if (!window.confirm("Are you sure you want to delete this document? This action cannot be undone.")) {
            return;
        }

        const promise = fetch(`/api/documents/${id}`, {
            method: "DELETE",
        }).then((res) => {
            if (!res.ok) throw new Error("Failed to delete document");
            return res.json();
        }).then(() => fetchDocuments());

        toast.promise(promise, {
            loading: 'Deleting document...',
            success: 'Document deleted successfully',
            error: 'Failed to delete document'
        });
    };

    const openAddModal = () => {
        setEditingDoc(null);
        setIsFormOpen(true);
    };

    const openEditModal = (doc) => {
        setEditingDoc(doc);
        setIsFormOpen(true);
    };

    return (
        <div className="flex h-screen overflow-hidden bg-[#030014] text-slate-200">
            <main className="flex-1 overflow-y-auto overflow-x-hidden relative z-10 custom-scrollbar scroll-smooth">
                <div className="p-6 md:p-10 lg:p-14 max-w-7xl mx-auto">
                    {/* Header */}
                    <header className="flex flex-col md:flex-row justify-between items-start md:items-center mb-12 gap-6 relative">
                        <div className="relative z-10 hidden md:block">
                            <h2 className="text-3xl font-bold tracking-tight mb-1 drop-shadow-sm text-white">
                                My Library
                            </h2>
                            <p className="text-slate-400 font-medium tracking-wide text-sm">
                                Manage your articles
                            </p>
                        </div>

                        <button
                            onClick={openAddModal}
                            className="btn-primary flex items-center gap-2 shadow-lg shadow-indigo-500/20 z-10 relative overflow-hidden group ml-auto md:ml-0"
                        >
                            <span className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out" />
                            <Plus className="h-5 w-5 relative z-10" />
                            <span className="relative z-10">Upload Document</span>
                        </button>
                    </header>

                    {/* Filters */}
                    <Filters
                        filters={filters}
                        setFilters={setFilters}
                        types={DOCUMENT_TYPES}
                    />

                    {/* Content Area */}
                    {error && (
                        <div className="glass bg-rose-500/5 border-rose-500/20 text-rose-200 p-5 rounded-2xl mb-8 flex items-start gap-4 animate-in fade-in slide-in-from-top-4">
                            <div className="p-2 bg-rose-500/10 rounded-lg">
                                <span className="text-rose-400 font-bold text-xl">!</span>
                            </div>
                            <div>
                                <h3 className="font-semibold text-rose-300 mb-1">Failed to Load Documents</h3>
                                <p className="text-sm text-slate-400">{error}</p>
                            </div>
                        </div>
                    )}

                    {isLoading ? (
                        <div className="flex justify-center items-center py-32">
                            <div className="relative w-16 h-16">
                                <div className="absolute inset-0 border-4 border-indigo-500/20 rounded-full" />
                                <div className="absolute inset-0 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
                            </div>
                        </div>
                    ) : (
                        <div className="animate-in fade-in duration-500 slide-in-from-bottom-4">
                            <DocumentList
                                documents={documents}
                                onEdit={openEditModal}
                                onDelete={handleDeleteDocument}
                            />
                        </div>
                    )}
                </div>
            </main>

            {/* SlideOver Form */}
            {isFormOpen && (
                <DocumentForm
                    document={editingDoc}
                    onClose={() => setIsFormOpen(false)}
                    onSave={handleSaveDocument}
                    types={DOCUMENT_TYPES}
                />
            )}
        </div>
    );
}
