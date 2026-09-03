import React from 'react';

const LoadingIndicator: React.FC = () => {
    return (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/30 backdrop-blur-sm transition-opacity duration-300">
            <div className="flex flex-col items-center p-6 bg-white rounded-xl shadow-2xl border border-gray-100">
                <div className="relative w-16 h-16">
                    {/* Outer spinning ring */}
                    <div className="absolute inset-0 border-4 border-emerald-100 rounded-full"></div>
                    {/* Inner spinning ring */}
                    <div className="absolute inset-0 border-4 border-t-emerald-600 border-r-transparent border-b-transparent border-l-transparent rounded-full animate-spin"></div>

                    {/* Center dot */}
                    <div className="absolute inset-0 m-auto w-2 h-2 bg-emerald-600 rounded-full animate-pulse"></div>
                </div>

                <div className="mt-4 flex flex-col items-center">
                    <span className="text-gray-800 font-semibold tracking-wide">Loading</span>
                    <div className="mt-1 flex space-x-1">
                        <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-[bounce_1s_infinite_0ms]"></div>
                        <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-[bounce_1s_infinite_200ms]"></div>
                        <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-[bounce_1s_infinite_400ms]"></div>
                    </div>
                </div>
            </div>

            <style dangerouslySetInnerHTML={{
                __html: `
                @keyframes bounce {
                    0%, 100% { transform: translateY(0); }
                    50% { transform: translateY(-4px); }
                }
            `}} />
        </div>
    );
};

export default LoadingIndicator;
