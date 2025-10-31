interface LoadingSpinnerProps {
  message?: string;
  size?: 'small' | 'medium' | 'large';
  showSparkles?: boolean;
}

export function LoadingSpinner({
  message = 'Processing...',
  size = 'medium',
  showSparkles = true
}: LoadingSpinnerProps) {
  const sizeClasses = {
    small: 'w-6 h-6',
    medium: 'w-10 h-10',
    large: 'w-16 h-16'
  };

  return (
    <div className="flex flex-col items-center justify-center gap-4 py-6">
      {/* Animated spinner with gradient */}
      <div className="relative">
        <div className={`${sizeClasses[size]} border-4 border-gray-200 border-t-gray-900 rounded-full animate-spin`}></div>

        {/* Sparkles animation */}
        {showSparkles && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="absolute animate-ping">
              <span className="inline-flex h-3 w-3 rounded-full bg-purple-400 opacity-75"></span>
            </div>
          </div>
        )}
      </div>

      {/* Loading message */}
      {message && (
        <div className="text-center">
          <p className="text-gray-700 font-medium animate-pulse">
            {message}
          </p>
          <div className="flex items-center justify-center gap-1 mt-2">
            <span className="w-2 h-2 bg-gray-600 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
            <span className="w-2 h-2 bg-gray-600 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
            <span className="w-2 h-2 bg-gray-600 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
          </div>
        </div>
      )}
    </div>
  );
}

interface LoadingOverlayProps {
  message: string;
  subMessage?: string;
}

export function LoadingOverlay({ message, subMessage }: LoadingOverlayProps) {
  return (
    <div className="absolute inset-0 bg-white bg-opacity-90 backdrop-blur-sm flex items-center justify-center z-10 rounded-lg">
      <div className="text-center p-6">
        <LoadingSpinner message={message} size="large" />
        {subMessage && (
          <p className="text-sm text-gray-500 mt-2">{subMessage}</p>
        )}
      </div>
    </div>
  );
}

interface StreamingIndicatorProps {
  isStreaming: boolean;
}

export function StreamingIndicator({ isStreaming }: StreamingIndicatorProps) {
  if (!isStreaming) return null;

  return (
    <div className="flex items-center gap-2 text-sm text-gray-600 animate-pulse">
      <div className="flex gap-1">
        <span className="w-2 h-2 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
        <span className="w-2 h-2 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
        <span className="w-2 h-2 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
      </div>
      <span className="font-medium">AI is thinking...</span>
    </div>
  );
}
