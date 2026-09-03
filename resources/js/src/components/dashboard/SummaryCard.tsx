import React from 'react';

interface SummaryCardProps {
  title: string;
  value: string | number;
  icon: React.ComponentType<{ className?: string }>;
}

const SummaryCard: React.FC<SummaryCardProps> = ({ title, value, icon: Icon }) => {
  return (
    <div className="bg-white p-4 rounded-lg border border-gray-200 flex items-center justify-between">
      <div>
        <p className="text-sm font-medium text-gray-500">{title}</p>
        <p className="text-3xl font-bold text-gray-800">{value}</p>
      </div>
       <Icon className="h-8 w-8 text-gray-400" />
    </div>
  );
};

export default SummaryCard;