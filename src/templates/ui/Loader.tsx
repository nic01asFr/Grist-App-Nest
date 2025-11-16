/**
 * Loader Component - Loading indicator
 */

export interface LoaderProps {
  size?: 'sm' | 'md' | 'lg';
  variant?: 'spinner' | 'dots' | 'pulse';
  text?: string;
  fullScreen?: boolean;
}

const sizeClasses = {
  sm: 'w-6 h-6',
  md: 'w-12 h-12',
  lg: 'w-16 h-16',
};

export default function Loader({
  size = 'md',
  variant = 'spinner',
  text,
  fullScreen = false,
}: LoaderProps) {
  const renderSpinner = () => (
    <div
      className={`
        ${sizeClasses[size]}
        border-4 border-gray-200 border-t-blue-600
        rounded-full animate-spin
      `}
    />
  );

  const renderDots = () => (
    <div className="flex gap-2">
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          className={`
            ${size === 'sm' ? 'w-2 h-2' : size === 'md' ? 'w-3 h-3' : 'w-4 h-4'}
            bg-blue-600 rounded-full animate-bounce
          `}
          style={{ animationDelay: `${i * 0.15}s` }}
        />
      ))}
    </div>
  );

  const renderPulse = () => (
    <div
      className={`
        ${sizeClasses[size]}
        bg-blue-600 rounded-full animate-pulse
      `}
    />
  );

  const renderLoader = () => {
    switch (variant) {
      case 'dots':
        return renderDots();
      case 'pulse':
        return renderPulse();
      default:
        return renderSpinner();
    }
  };

  const content = (
    <div className="flex flex-col items-center justify-center gap-4">
      {renderLoader()}
      {text && (
        <p className="text-gray-600 font-medium animate-pulse">{text}</p>
      )}
    </div>
  );

  if (fullScreen) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-white bg-opacity-90">
        {content}
      </div>
    );
  }

  return content;
}
