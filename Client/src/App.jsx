import React, { useEffect, useState } from 'react';
import WebApp from '@twa-dev/sdk';

const API_BASE = 'https://status-board-challenge.onrender.com';

export default function MiniApp() {
  const [userName, setUserName] = useState('User');
  const [statusText, setStatusText] = useState('');
  const [latestStatuses, setLatestStatuses] = useState([]);
  const [message, setMessage] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Initialize Telegram Web App SDK
  function errorViewManager(err) {
    setError(err);
    setTimeout(() => {
      setError(null);
    }, 2000);
  }

  useEffect(() => {
    try {
      // Make sure Telegram WebApp is available
      if (typeof WebApp === "undefined") {
        errorViewManager("This site only works as a Telegram WebApp.");
        return;
      }

      const user = WebApp.initDataUnsafe?.user;

      if (!user) {
        errorViewManager("No user info provided by Telegram.");
        return;
      }

      setUserName(user.first_name || "");
      WebApp.ready();
    } catch (err) {
      console.error("Telegram init error:", err);
      errorViewManager("Failed to initialize Telegram WebApp.");
    }
  }, []);

  // Fetch latest statuses
  const fetchLatest = async () => {
    try {
      const res = await fetch(`${API_BASE}/latest`);
      if (!res.ok) throw new Error('Failed to fetch latest statuses');
      const data = await res.json();
      setLatestStatuses(data);
    } catch {
      setLatestStatuses([]);
    }
  };

  useEffect(() => {
    fetchLatest();
  }, []);

  const handlePostStatus = async () => {
    if (!statusText.trim()) {
      setMessage({ type: 'error', text: 'Status cannot be empty!' });
      return;
    }
    setLoading(true);
    setMessage(null);

    try {
      const userId = webApp.initDataUnsafe.user?.id || 0;
      const res = await fetch(`${API_BASE}/status`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          name: userName,
          status: statusText.trim(),
        }),
      });

      const result = await res.json();
      if (!res.ok) throw new Error(result.error || 'Failed to post status');

      setMessage({ type: 'success', text: 'Status posted successfully! 🎉' });
      setStatusText('');
      fetchLatest(); // Refresh statuses
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

      <section>
        <h3 className="text-xl font-semibold mb-3">📰 Latest statuses</h3>
        {latestStatuses.length === 0 ? (
          <p className="text-gray-600">No statuses yet. Be the first! 🚀</p>
        ) : (
          latestStatuses.map((status, idx) => (
            <div
              key={idx}
              className="mb-3 p-4 bg-gray-100 rounded-md shadow-sm"
            >
              <strong className="block text-gray-800">{status.name}</strong>
              <p className="text-gray-700">{status.status}</p>
            </div>
          ))
        )}
      </section>
    </div>
  );
}
