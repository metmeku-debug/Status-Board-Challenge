import React, { useEffect, useState } from 'react';
import WebApp from '@twa-dev/sdk';

const API_BASE = 'https://arrogant-chloe-metmeku-dab124e3.koyeb.app';

export default function MiniApp() {
  const [userName, setUserName] = useState('User');
  const [statusText, setStatusText] = useState('');
  const [latestStatuses, setLatestStatuses] = useState([]);
  const [message, setMessage] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    try {
      // Make sure Telegram WebApp is available
      if (!WebApp) {
        setMessage({ type: 'error', text: 'This is a web app for a telegram bot, please try again from out bot, @status_boardbot' });
        return;
      }

      const user = WebApp.initDataUnsafe?.user;

      if (!user) {
        setMessage({ type: 'error', text: "No user info provided by Telegram." });
        return;
      }

      setUserName(user.first_name || "");
      WebApp.ready();
    } catch (err) {
      console.error("Telegram init error:", err);
      setMessage({ type: 'error', text: "Failed to initialize Telegram WebApp." });
    }
  }, []);

  const handlePostStatus = async () => {
    if (!statusText.trim()) {
      setMessage({ type: 'error', text: 'Status cannot be empty!' });
      return;
    }
    setLoading(true);
    setMessage(null);

    try {
      const userId = WebApp.initDataUnsafe.user?.id;  // matches 'id' in backend
      if (!userId) throw new Error('your userId can not be found, please try again from the telegram bot.');
      const res = await fetch(`${API_BASE}/status`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: userId,         // changed from userId to id
          name: userName,     // keep as is
          status: statusText.trim(),  // keep as is
        }),
      });

      const result = await res.json();
      if (!res.ok) throw new Error(result.error || 'Failed to post status');

      setMessage({ type: 'success', text: 'Status posted successfully! 🎉' });
      setStatusText('');
    } catch (error) {
      setMessage({ type: 'error', text: error.message });
    } finally {
      setLoading(false);
    }
  };



  return (
    <div className="max-w-md mx-auto p-6 bg-white rounded-lg shadow-md font-sans">
      <h2 className="text-2xl font-semibold mb-6">Hello, {userName}! 👋</h2>

      <textarea
        rows={3}
        placeholder="What's on your mind today?"
        value={statusText}
        onChange={(e) => setStatusText(e.target.value)}
        className="w-full p-3 mb-4 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        disabled={loading}
      />

      <button
        onClick={handlePostStatus}
        disabled={loading}
        className={`w-full py-3 mb-4 text-white rounded-md transition-colors ${loading ? 'bg-blue-300 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'
          }`}
      >
        {loading ? 'Posting...' : 'Post Status'}
      </button>

      {message && (
        <p
          className={`mb-4 font-semibold ${message.type === 'error' ? 'text-red-600' : 'text-green-600'
            }`}
        >
          {message.text}
        </p>
      )}
    </div>
  );
}
