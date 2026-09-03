import React from 'react';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  totalItems: number;
  itemsPerPage: number;
}

const Pagination: React.FC<PaginationProps> = ({ currentPage, totalPages, onPageChange, totalItems, itemsPerPage }) => {
  const startItem = totalItems > 0 ? (currentPage - 1) * itemsPerPage + 1 : 0;
  const endItem = Math.min(currentPage * itemsPerPage, totalItems);

  const handlePrevious = () => {
    if (currentPage > 1) {
      onPageChange(currentPage - 1);
    }
  };

  const handleNext = () => {
    if (currentPage < totalPages) {
      onPageChange(currentPage + 1);
    }
  };

  const getPageNumbers = () => {
    const pages = [];
    const maxPagesToShow = 5;
    
    if (totalPages <= maxPagesToShow) {
        for (let i = 1; i <= totalPages; i++) {
            pages.push(i);
        }
    } else {
        pages.push(1);
        if (currentPage > 3) {
            pages.push('...');
        }
        if (currentPage > 2) {
            pages.push(currentPage - 1);
        }
        if (currentPage !== 1 && currentPage !== totalPages) {
            pages.push(currentPage);
        }
        if (currentPage < totalPages - 1) {
            pages.push(currentPage + 1);
        }
        if (currentPage < totalPages - 2) {
            pages.push('...');
        }
        pages.push(totalPages);
    }
    
    // Simple implementation to avoid duplicate keys for '...'
    return [...new Set(pages)];
  };

  return (
    <div className="flex items-center justify-between mt-4 pt-4 border-t m-2">
      <div>
        {totalItems > 0 && (
          <p className="text-sm text-gray-700">
            Showing <span className="font-medium">{startItem}</span> to <span className="font-medium">{endItem}</span> of{' '}
            <span className="font-medium">{totalItems}</span> results
          </p>
        )}
      </div>

      {totalPages > 1 && (
        <div className="flex items-center space-x-2">
          <button
            onClick={handlePrevious}
            disabled={currentPage === 1}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Previous
          </button>
          
          <div className="hidden md:flex items-center space-x-2">
            {getPageNumbers().map((page, index) =>
                typeof page === 'number' ? (
                <button
                    key={index}
                    onClick={() => onPageChange(page)}
                    className={`px-4 py-2 text-sm font-medium border rounded-md ${
                    currentPage === page
                        ? 'bg-green-600 text-white border-green-600'
                        : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                    }`}
                >
                    {page}
                </button>
                ) : (
                <span key={index} className="px-4 py-2 text-sm text-gray-500">
                    {page}
                </span>
                )
            )}
          </div>

          <button
            onClick={handleNext}
            disabled={currentPage === totalPages}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
};

export default Pagination;
