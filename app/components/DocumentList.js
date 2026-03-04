import { FileText, Edit2, Trash2, ExternalLink, Star } from "lucide-react";
import { cn } from "@/lib/utils";

export function DocumentList({ documents, onEdit, onDelete }) {
    const handleOpenPdf = (id, type = null) => {
        let url = `/api/documents/${id}/pdf`;
        if (type === 'summary') {
            url += '?type=summary';
        }
        window.open(url, "_blank");
    };

    if (documents.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-24 text-center glass rounded-2xl relative overflow-hidden group">
                <div className="absolute inset-0 bg-gradient-to-t from-indigo-500/5 to-transparent pointer-events-none opacity-50 group-hover:opacity-100 transition-opacity duration-700" />
                <FileText className="h-14 w-14 text-indigo-400/50 mb-5 animate-pulse" />
                <h3 className="text-xl font-medium text-white mb-2 tracking-wide">No documents found</h3>
                <p className="text-slate-400 max-w-sm">
                    Try adjusting your filters or add a new document to your library.
                </p>
            </div>
        );
    }

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {documents.map((doc) => (
                <div
                    key={doc.id}
                    className="group glass-card flex flex-col overflow-hidden relative"
                >
                    {/* Decorative Top Gradient */}
                    <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-transparent via-indigo-500/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                    {/* Header */}
                    <div className="p-6 pb-4 border-b border-white/[0.05] flex justify-between items-start gap-4">
                        <div className="flex-1 min-w-0">
                            <h3 className="text-lg font-bold text-slate-100 truncate group-hover:text-white transition-colors" title={doc.title}>
                                {doc.title}
                            </h3>
                            <div className="flex items-center gap-3 mt-3">
                                <span className="text-xs font-semibold text-amber-400 flex items-center gap-1 bg-amber-400/10 px-2 py-1 rounded-full border border-amber-400/20">
                                    <Star className="h-3 w-3 fill-amber-400" /> {doc.rating}/5
                                </span>
                            </div>
                        </div>

                        {/* Quick Actions (Hover) */}
                        <div className="opacity-0 group-hover:opacity-100 transition-all duration-300 translate-x-2 group-hover:translate-x-0 flex gap-1 bg-[#0a0a0a]/90 backdrop-blur-md p-1.5 rounded-lg absolute top-4 right-4 border border-white/10 shadow-lg">
                            <button
                                onClick={() => onEdit(doc)}
                                className="p-1.5 text-slate-400 hover:text-indigo-400 hover:bg-indigo-500/10 rounded-md transition-colors"
                                title="Edit Document"
                            >
                                <Edit2 className="h-4 w-4" />
                            </button>
                            <button
                                onClick={() => onDelete(doc.id)}
                                className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-md transition-colors"
                                title="Delete Document"
                            >
                                <Trash2 className="h-4 w-4" />
                            </button>
                        </div>
                    </div>

                    {/* Body */}
                    <div className="p-6 pt-4 flex-1 flex flex-col">
                        <p className="text-sm text-slate-300/90 leading-relaxed line-clamp-3 mb-5" title={doc.mini_summary}>
                            {doc.mini_summary}
                        </p>

                        <div className="flex flex-wrap gap-2 mt-auto">
                            {doc.keywords.map((keyword, i) => (
                                <span
                                    key={i}
                                    className="inline-block text-xs font-medium text-slate-300 bg-white/5 hover:bg-white/10 px-2.5 py-1 rounded-md border border-white/10 transition-colors cursor-default"
                                >
                                    #{keyword}
                                </span>
                            ))}
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="p-4 border-t border-white/[0.05] bg-black/20 group-hover:bg-black/40 transition-colors flex gap-2">
                        <button
                            onClick={() => handleOpenPdf(doc.id)}
                            className="flex-1 btn-secondary text-sm px-3 py-2 border-none bg-white/[0.03] hover:bg-indigo-500/20 hover:text-indigo-300 hover:shadow-[0_0_15px_rgba(99,102,241,0.2)] flex items-center justify-center gap-1.5 group/btn"
                        >
                            <ExternalLink className="h-4 w-4 group-hover/btn:scale-110 transition-transform shrink-0" />
                            <span className="truncate">Open Article</span>
                        </button>

                        {doc.summary_pdf_file && (
                            <button
                                onClick={() => handleOpenPdf(doc.id, 'summary')}
                                className="flex-1 btn-secondary text-sm px-3 py-2 border-none bg-white/[0.03] hover:bg-emerald-500/20 hover:text-emerald-300 hover:shadow-[0_0_15px_rgba(16,185,129,0.2)] flex items-center justify-center gap-1.5 group/btn"
                            >
                                <ExternalLink className="h-4 w-4 group-hover/btn:scale-110 transition-transform shrink-0" />
                                <span className="truncate">Open Summary</span>
                            </button>
                        )}
                    </div>
                </div>
            ))}
        </div>
    );
}
