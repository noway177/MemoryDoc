import { useState, useEffect } from "react";
import { X, UploadCloud, XCircle, FileText } from "lucide-react";

export function DocumentForm({ document, onClose, onSave, types }) {
    const [formData, setFormData] = useState({
        title: "",
        rating: 3,
        mini_summary: "",
        keywords: [],
    });

    const [pdfFile, setPdfFile] = useState(null);
    const [summaryPdfFile, setSummaryPdfFile] = useState(null);
    const [keywordInput, setKeywordInput] = useState("");
    const [errors, setErrors] = useState({});
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Animation states for slide over
    const [isClosing, setIsClosing] = useState(false);

    useEffect(() => {
        if (document) {
            setFormData({
                title: document.title,
                rating: document.rating,
                mini_summary: document.mini_summary,
                keywords: document.keywords,
            });
        }

        // Lock body scroll
        window.document.body.style.overflow = 'hidden';
        return () => {
            window.document.body.style.overflow = 'auto';
        };
    }, [document]);

    const handleClose = () => {
        setIsClosing(true);
        setTimeout(onClose, 300); // Wait for exit animation
    };

    const handleAddKeyword = (e) => {
        if (e.key === "Enter" && keywordInput.trim()) {
            e.preventDefault();
            if (!formData.keywords.includes(keywordInput.trim())) {
                setFormData({
                    ...formData,
                    keywords: [...formData.keywords, keywordInput.trim()],
                });
            }
            setKeywordInput("");
        }
    };

    const removeKeyword = (keywordToRemove) => {
        setFormData({
            ...formData,
            keywords: formData.keywords.filter((k) => k !== keywordToRemove),
        });
    };

    const validate = () => {
        const newErrors = {};
        if (!formData.title.trim()) newErrors.title = "Title is required";
        if (!formData.mini_summary.trim()) newErrors.mini_summary = "Mini summary is required";
        if (formData.keywords.length === 0) newErrors.keywords = "At least one keyword is required";
        if (!document && !pdfFile) newErrors.pdf = "PDF file is required";

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!validate()) return;

        setIsSubmitting(true);

        const data = new FormData();
        data.append("title", formData.title);
        data.append("type", "article"); // Hardcode type as article since it's the only one
        data.append("rating", formData.rating);
        data.append("mini_summary", formData.mini_summary);
        data.append("summary", "");
        data.append("keywords", JSON.stringify(formData.keywords));

        if (pdfFile) {
            data.append("pdf_file", pdfFile);
        }
        if (summaryPdfFile) {
            data.append("summary_pdf_file", summaryPdfFile);
        }

        try {
            await onSave(document?.id, data);
            handleClose();
        } catch (error) {
            setErrors({ submit: error.message || "Failed to save document" });
            setIsSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex justify-end">
            {/* Backdrop */}
            <div
                className={cn("absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity duration-300", isClosing ? "opacity-0" : "animate-in fade-in")}
                onClick={handleClose}
            />

            {/* SlideOver Panel */}
            <div className={cn(
                "w-full max-w-xl h-full bg-[#050505]/95 backdrop-blur-xl border-l border-white/10 flex flex-col relative z-10 shadow-[-10px_0_30px_rgba(0,0,0,0.5)] transform transition-transform duration-300 ease-in-out",
                isClosing ? "translate-x-full" : "animate-in slide-in-from-right"
            )}
            >
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-white/10 bg-indigo-500/5">
                    <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-xl bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center shadow-inner">
                            <FileText className="w-5 h-5 text-indigo-400" />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-white tracking-wide">
                                {document ? "Edit Document" : "New Document"}
                            </h2>
                            <p className="text-xs text-indigo-300/80 mt-0.5 font-medium">{document ? 'Update meta or attach new PDF' : 'Add a new record to your library'}</p>
                        </div>
                    </div>
                    <button
                        onClick={handleClose}
                        className="text-slate-400 hover:text-white hover:bg-white/10 hover:rotate-90 transition-all duration-300 p-2 rounded-full"
                    >
                        <X className="h-5 w-5" />
                    </button>
                </div>

                {/* Body */}
                <div className="p-6 overflow-y-auto flex-1 custom-scrollbar">
                    {errors.submit && (
                        <div className="mb-6 p-4 bg-rose-500/10 border border-rose-500/20 text-rose-400 rounded-xl text-sm shadow-inner">
                            <span className="font-semibold">Error:</span> {errors.submit}
                        </div>
                    )}

                    <form id="document-form" onSubmit={handleSubmit} className="space-y-6 pb-10">
                        {/* Title */}
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-300">Document Title <span className="text-rose-500">*</span></label>
                            <input
                                type="text"
                                className={cn("input-field block w-full text-base", errors.title && "border-rose-500/50 focus:border-rose-500/50 focus:ring-rose-500/50")}
                                value={formData.title}
                                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                placeholder="E.g. Q4 Financial Report"
                            />
                            {errors.title && <p className="text-xs text-rose-400 mt-1">{errors.title}</p>}
                        </div>

                        <div className="grid grid-cols-2 gap-5">

                            {/* Rating */}
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-slate-300 flex justify-between items-center">
                                    <span>Importance</span>
                                    <span className="text-indigo-400 font-bold bg-indigo-500/10 px-2 py-0.5 text-xs rounded-full border border-indigo-500/20">{formData.rating}/5</span>
                                </label>
                                <div className="pt-2">
                                    <input
                                        type="range"
                                        min="0"
                                        max="5"
                                        step="1"
                                        className="w-full h-2 bg-black/50 border border-white/5 rounded-lg appearance-none cursor-pointer accent-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-shadow block"
                                        value={formData.rating}
                                        onChange={(e) => setFormData({ ...formData, rating: Number(e.target.value) })}
                                    />
                                    <div className="flex justify-between text-xs text-slate-500 px-1 mt-1 font-medium">
                                        <span>Low</span>
                                        <span>High</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* PDF Uploads */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mt-2">
                            {/* Main PDF Upload */}
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-slate-300">
                                    Article PDF {document ? "" : <span className="text-rose-500">*</span>}
                                </label>
                                <div className={cn(
                                    "relative flex items-center justify-center w-full h-32 border-2 border-dashed rounded-xl transition-all duration-300 cursor-pointer overflow-hidden group",
                                    errors.pdf ? "border-rose-500/50 bg-rose-500/5 hover:bg-rose-500/10" : "border-white/20 bg-black/20 hover:bg-indigo-500/10 hover:border-indigo-500/50",
                                    pdfFile && "border-emerald-500/50 bg-emerald-500/10"
                                )}>
                                    {/* Hover Gradient Overlay */}
                                    <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/10 to-transparent opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity duration-500" />

                                    <div className="flex flex-col items-center justify-center p-4 relative z-10 w-full">
                                        <UploadCloud className={cn("w-8 h-8 mb-3 transition-transform duration-300 group-hover:-translate-y-1", pdfFile ? "text-emerald-400" : (errors.pdf ? "text-rose-400" : "text-indigo-400"))} />

                                        {pdfFile ? (
                                            <span className="text-emerald-300 text-sm font-medium">{pdfFile.name} (Ready)</span>
                                        ) : (document && document.pdf_file ? (
                                            <span className="text-slate-300 text-xs text-center">Currently: {document.pdf_file}<br /><span className="text-indigo-400 font-medium mt-1 inline-block">Click to overwrite file</span></span>
                                        ) : (
                                            <span className="text-slate-300 text-sm font-medium">Drop your PDF here or click to browse</span>
                                        ))}
                                    </div>
                                    <input
                                        type="file"
                                        accept="application/pdf"
                                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-20"
                                        onChange={(e) => {
                                            if (e.target.files && e.target.files[0]) {
                                                setPdfFile(e.target.files[0]);
                                                setErrors({ ...errors, pdf: null });
                                            }
                                        }}
                                    />
                                </div>
                                {errors.pdf && <p className="text-xs text-rose-400 mt-1">{errors.pdf}</p>}
                            </div>

                            {/* Summary PDF Upload (Optional, only for articles) */}
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-slate-300">Summary PDF <span className="text-slate-500 font-normal">(Optional)</span></label>
                                <div className={cn(
                                    "relative flex items-center justify-center w-full h-32 border-2 border-dashed rounded-xl transition-all duration-300 cursor-pointer overflow-hidden group border-white/20 bg-black/20 hover:bg-indigo-500/10 hover:border-indigo-500/50",
                                    summaryPdfFile && "border-emerald-500/50 bg-emerald-500/10"
                                )}>
                                    <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/10 to-transparent opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity duration-500" />

                                    <div className="flex flex-col items-center justify-center p-4 relative z-10 w-full">
                                        <UploadCloud className={cn("w-8 h-8 mb-3 transition-transform duration-300 group-hover:-translate-y-1", summaryPdfFile ? "text-emerald-400" : "text-indigo-400")} />

                                        {summaryPdfFile ? (
                                            <span className="text-emerald-300 text-sm font-medium line-clamp-1 break-all px-2">{summaryPdfFile.name} (Ready)</span>
                                        ) : (document && document.summary_pdf_file ? (
                                            <span className="text-slate-300 text-xs text-center px-1">Currently: <span className="line-clamp-1 break-all">{document.summary_pdf_file}</span><span className="text-indigo-400 font-medium mt-1 inline-block">Click to overwrite</span></span>
                                        ) : (
                                            <span className="text-slate-300 text-sm font-medium text-center">Drop summary PDF here</span>
                                        ))}
                                    </div>
                                    <input
                                        type="file"
                                        accept="application/pdf"
                                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-20"
                                        onChange={(e) => {
                                            if (e.target.files && e.target.files[0]) {
                                                setSummaryPdfFile(e.target.files[0]);
                                            }
                                        }}
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Mini Summary */}
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-300">Quick Summary <span className="text-rose-500">*</span></label>
                            <input
                                type="text"
                                className={cn("input-field", errors.mini_summary && "border-rose-500/50 focus:border-rose-500/50 focus:ring-rose-500/50")}
                                value={formData.mini_summary}
                                onChange={(e) => setFormData({ ...formData, mini_summary: e.target.value })}
                                placeholder="A brief 1-2 sentence description for the card view"
                                maxLength={150}
                            />
                            <div className="flex justify-between mt-1.5">
                                {errors.mini_summary ? <p className="text-xs text-rose-400 font-medium">{errors.mini_summary}</p> : <span />}
                                <span className={cn("text-xs font-medium", formData.mini_summary.length > 130 ? "text-amber-400" : "text-slate-500")}>
                                    {formData.mini_summary.length}/150
                                </span>
                            </div>
                        </div>

                        {/* Keywords */}
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-300">Keywords/Tags <span className="text-rose-500">*</span></label>
                            <div className="flex gap-3">
                                <div className="flex-1 relative">
                                    <input
                                        type="text"
                                        className={cn("input-field w-full", errors.keywords && formData.keywords.length === 0 && "border-rose-500/50 focus:border-rose-500/50 focus:ring-rose-500/50")}
                                        value={keywordInput}
                                        onChange={(e) => setKeywordInput(e.target.value)}
                                        onKeyDown={handleAddKeyword}
                                        placeholder="Type a tag and press Enter..."
                                    />
                                </div>
                                <button
                                    type="button"
                                    onClick={() => {
                                        if (keywordInput.trim() && !formData.keywords.includes(keywordInput.trim())) {
                                            setFormData({ ...formData, keywords: [...formData.keywords, keywordInput.trim()] });
                                            setKeywordInput("");
                                        }
                                    }}
                                    className="btn-secondary whitespace-nowrap px-6 border-indigo-500/30 hover:bg-indigo-500/20 hover:border-indigo-500/50 hover:text-indigo-300"
                                >
                                    Add Tag
                                </button>
                            </div>
                            {errors.keywords && formData.keywords.length === 0 && <p className="text-xs text-rose-400 mt-1">{errors.keywords}</p>}

                            {formData.keywords.length > 0 && (
                                <div className="flex flex-wrap gap-2 mt-4 p-4 bg-black/40 shadow-inner rounded-xl border border-white/5 min-h-[3.5rem]">
                                    {formData.keywords.map((keyword) => (
                                        <span
                                            key={keyword}
                                            className="inline-flex items-center justify-center gap-1.5 bg-indigo-500/10 text-indigo-200 text-sm px-3 py-1.5 rounded-lg border border-indigo-500/20 shadow-sm transition-transform hover:scale-105"
                                        >
                                            #{keyword}
                                            <button
                                                type="button"
                                                onClick={() => removeKeyword(keyword)}
                                                className="text-indigo-400/70 hover:text-rose-400 hover:bg-rose-400/10 rounded-full p-0.5 transition-colors focus:outline-none focus:ring-2 focus:ring-rose-500/50"
                                                title="Remove tag"
                                            >
                                                <XCircle className="h-4 w-4" />
                                            </button>
                                        </span>
                                    ))}
                                </div>
                            )}
                        </div>

                    </form>
                </div>

                {/* Footer */}
                <div className="p-6 border-t border-white/10 bg-black/40 backdrop-blur-md flex justify-end gap-3 shrink-0">
                    <button
                        type="button"
                        onClick={handleClose}
                        className="btn-secondary px-6"
                        disabled={isSubmitting}
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        form="document-form"
                        className="btn-primary min-w-[160px] flex justify-center items-center gap-2"
                        disabled={isSubmitting}
                    >
                        {isSubmitting ? (
                            <>
                                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin shadow-sm" />
                                <span>Saving...</span>
                            </>
                        ) : (
                            document ? "Save Changes" : "Save Document"
                        )}
                    </button>
                </div>
            </div>

            <style dangerouslySetInnerHTML={{
                __html: `
        .custom-scrollbar::-webkit-scrollbar {
            width: 8px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
            background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
            background: rgba(255,255,255,0.1);
            border-radius: 4px;
            border: 1px solid rgba(255,255,255,0.05);
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
            background: rgba(255,255,255,0.2);
        }
      `}} />
        </div>
    );
}

// Ensure cn is accessible
function cn(...classes) {
    return classes.filter(Boolean).join(" ");
}
