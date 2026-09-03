
import React from 'react';

const Footer: React.FC = () => {
    return (
        <footer className="bg-white border-t border-gray-200 px-6 py-3 text-center text-sm text-gray-500 shrink-0">
            <p>
                v1.0.0 &copy; {new Date().getFullYear()} -{' '}
                <a 
                    href="https://growdigitec.com" 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="text-green-600 hover:underline"
                >
                    Growdigitec
                </a>
            </p>
        </footer>
    );
};

export default Footer;
