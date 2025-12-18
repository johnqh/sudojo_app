import React from 'react';

export interface SubscriptionTileProps {
  id: string;
  title: string;
  price: string;
  period?: string;
  periodDisplayName?: string;
  features: string[];
  isSelected: boolean;
  onSelect: () => void;
  topBadge?: {
    text: string;
    color: 'purple' | 'green' | 'blue';
  };
  discountBadge?: {
    text: string;
    isBestValue?: boolean;
  };
  isBestValue?: boolean;
}

const badgeColors = {
  purple: 'bg-purple-500',
  green: 'bg-green-500',
  blue: 'bg-blue-500',
};

export const SubscriptionTile: React.FC<SubscriptionTileProps> = ({
  id,
  title,
  price,
  periodDisplayName,
  features,
  isSelected,
  onSelect,
  topBadge,
  discountBadge,
  isBestValue = false,
}) => {
  const borderColor = isSelected
    ? isBestValue
      ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20 shadow-lg'
      : 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 shadow-lg'
    : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 hover:shadow-md';

  return (
    <div
      className={`relative border-2 rounded-xl p-6 cursor-pointer transition-all flex flex-col ${borderColor}`}
      onClick={onSelect}
    >
      {/* Top Badge */}
      {topBadge && (
        <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
          <span
            className={`${badgeColors[topBadge.color]} text-white px-3 py-1 rounded-full text-sm font-semibold shadow-lg whitespace-nowrap`}
          >
            {topBadge.text}
          </span>
        </div>
      )}

      {/* Main content */}
      <div className="flex flex-col flex-grow">
        {/* Title and Price */}
        <div className="text-center mb-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">{title}</h3>
          <div className="mb-3">
            <span
              className={`text-4xl font-bold ${
                isBestValue
                  ? 'text-purple-600 dark:text-purple-400'
                  : 'text-blue-600 dark:text-blue-400'
              }`}
            >
              {price}
            </span>
            {periodDisplayName && (
              <span className="text-gray-500 dark:text-gray-400 text-lg">/{periodDisplayName}</span>
            )}
          </div>

          {/* Discount Badge */}
          {discountBadge && (
            <div
              className={`inline-flex items-center px-2 py-1 rounded-full text-sm font-semibold ${
                discountBadge.isBestValue
                  ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/50 dark:text-purple-300'
                  : 'bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-300'
              }`}
            >
              {discountBadge.text}
            </div>
          )}
        </div>

        {/* Features List */}
        <div className="space-y-3 mb-6 flex-grow">
          {features.map((feature, index) => (
            <div key={index} className="flex items-start">
              <span
                className={`text-lg mr-3 flex-shrink-0 ${
                  isBestValue ? 'text-purple-500' : 'text-green-500'
                }`}
              >
                ✓
              </span>
              <span className="text-sm text-gray-700 dark:text-gray-300 text-left">
                {feature}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Radio button */}
      <div className="flex justify-center mt-auto">
        <input
          type="radio"
          name="subscription-plan"
          value={id}
          checked={isSelected}
          onChange={onSelect}
          className={`w-5 h-5 ${isBestValue ? 'text-purple-600' : 'text-blue-600'}`}
        />
      </div>
    </div>
  );
};
