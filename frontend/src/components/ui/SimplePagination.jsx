const SimplePagination = ({
  currentPage,
  totalPages,
  totalCount,
  onPageChange
}) => {
    if (totalPages <= 1) return null;

    return (
        <div className="flex items-center justify-between mt-4 pt-4 border-t">
            <div className="text-sm text-gray-600">
                {totalCount} registros
            </div>
            <div className="flex items-center gap-4">
                <button
                    onClick={() => onPageChange(currentPage - 1)}
                    disabled={currentPage <= 1}
                    className="px-3 py-1 text-sm text-gray-600 hover:text-gray-800 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    ← Anterior
                </button>
                <span className="text-sm text-gray-600">
                    {currentPage} de {totalPages}
                </span>
                <button
                    onClick={() => onPageChange(currentPage + 1)}
                    disabled={currentPage >= totalPages}
                    className="px-3 py-1 text-sm text-gray-600 hover:text-gray-800 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    Próximo →
                </button>
            </div>
        </div>
    );
};

export default SimplePagination;