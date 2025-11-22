import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';

function MicPermission() {
  const [status, setStatus] = React.useState('Requesting microphone permission...');
  const [error, setError] = React.useState(false);

  React.useEffect(() => {
    requestMicrophonePermission();
  }, []);

  async function requestMicrophonePermission() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      console.log('Microphone access granted');
      setStatus('✅ Microphone permission granted!');
      
      stream.getTracks().forEach(track => track.stop());
      
      setTimeout(() => {
        window.close();
      }, 1500);
      
    } catch (err: any) {
      console.error('Error requesting microphone permission:', err);
      setError(true);
      
      if (err.name === 'NotAllowedError') {
        setStatus('❌ Permission denied. Please click the microphone icon in your browser address bar and allow access.');
      } else if (err.name === 'NotFoundError') {
        setStatus('❌ No microphone found. Please connect a microphone and try again.');
      } else {
        setStatus(`❌ Error: ${err.message}`);
      }
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl p-8 max-w-md w-full text-center">
        <div className="mb-4">
          {!error ? (
            <div className="w-16 h-16 mx-auto bg-purple-100 rounded-full flex items-center justify-center">
              <svg className="w-8 h-8 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
              </svg>
            </div>
          ) : (
            <div className="w-16 h-16 mx-auto bg-red-100 rounded-full flex items-center justify-center">
              <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
          )}
        </div>
        
        <h1 className="text-2xl font-bold text-gray-800 mb-2">
          InterviewCoach AI
        </h1>
        
        <p className="text-gray-600 mb-4">
          {status}
        </p>
        
        {error && (
          <button
            onClick={requestMicrophonePermission}
            className="mt-4 bg-purple-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-purple-700 transition-colors"
          >
            Try Again
          </button>
        )}
        
        {!error && (
          <div className="mt-4">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
          </div>
        )}
      </div>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <MicPermission />
  </React.StrictMode>
);