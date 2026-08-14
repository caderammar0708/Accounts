import React from 'react';

const FormSection = ({ title, children, show = true }) => {
    if (!show) return null;
    return (
        <div className="pt-4 border-t border-slate-150 space-y-3">
            <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{title}</h3>
            <div className="space-y-3">
                {children}
            </div>
        </div>
    );
};

export default FormSection;
