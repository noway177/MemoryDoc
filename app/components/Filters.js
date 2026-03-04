import { Search, Filter, X } from "lucide-react";

export function Filters({ filters, setFilters, types }) {
    const handleReset = () => {
        setFilters({
            search: "",
            type: "",
            ratingMin: 0,
            ratingMax: 5,
            sortBy: "newest",
            keyword: "",
        });
    };

    return (
        <div className="glass flex flex-col md:flex-row gap-4 mb-10 p-5 rounded-2xl relative z-10 transition-all duration-300 hover:shadow-[0_8px_32px_0_rgba(99,102,241,0.15)]">
            {/* Search */}
            <div className="flex-1 relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none transition-colors group-focus-within:text-[var(--accent)]">
                    <Search className="h-5 w-5 text-muted-foreground group-focus-within:text-indigo-400 dropdown-transition" />
                </div>
                <input
                    type="text"
                    placeholder="Search document title, summary, or keywords..."
                    className="input-field pl-12 text-base"
                    value={filters.search}
                    onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                />
            </div>

            <div className="flex flex-wrap gap-3 items-center">

                {/* Rating Filter */}
                <div className="flex items-center gap-2 bg-black/40 border border-white/10 rounded-xl px-4 py-2 text-sm shadow-inner backdrop-blur-sm">
                    <span className="text-muted-foreground font-medium">Rating</span>
                    <select
                        className="bg-transparent text-white focus:outline-none focus:text-indigo-400 font-semibold cursor-pointer appearance-none text-center min-w-[1.5rem]"
                        value={filters.ratingMin}
                        onChange={(e) => setFilters({ ...filters, ratingMin: Number(e.target.value) })}
                    >
                        {[0, 1, 2, 3, 4, 5].map((r) => (
                            <option key={r} value={r} className="bg-slate-900 text-white">
                                {r}
                            </option>
                        ))}
                    </select>
                    <span className="text-white/30">-</span>
                    <select
                        className="bg-transparent text-white focus:outline-none focus:text-indigo-400 font-semibold cursor-pointer appearance-none text-center min-w-[1.5rem]"
                        value={filters.ratingMax}
                        onChange={(e) => setFilters({ ...filters, ratingMax: Number(e.target.value) })}
                    >
                        {[1, 2, 3, 4, 5].map((r) => (
                            <option key={r} value={r} className="bg-slate-900 text-white">
                                {r}
                            </option>
                        ))}
                    </select>
                </div>

                {/* Sort By */}
                <select
                    className="input-field w-auto min-w-[150px] appearance-none bg-no-repeat bg-[right_1rem_center] bg-[url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20width%3D%2224%22%20height%3D%2224%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20fill%3D%22none%22%20stroke%3D%22%2394a3b8%22%20stroke-width%3D%222%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%3E%3Cpolyline%20points%3D%226%209%2012%2015%2018%209%22%2F%3E%3C%2Fsvg%3E')]"
                    value={filters.sortBy}
                    onChange={(e) => setFilters({ ...filters, sortBy: e.target.value })}
                >
                    <option value="newest" className="bg-slate-900 text-white">Newest First</option>
                    <option value="rating" className="bg-slate-900 text-white">Highest Rating</option>
                    <option value="title" className="bg-slate-900 text-white">A-Z</option>
                </select>

                {/* Reset */}
                <button
                    onClick={handleReset}
                    className="btn-secondary flex items-center gap-2"
                    title="Reset filters"
                >
                    <X className="h-4 w-4" />
                    <span className="hidden sm:inline">Clear</span>
                </button>
            </div>
        </div>
    );
}
