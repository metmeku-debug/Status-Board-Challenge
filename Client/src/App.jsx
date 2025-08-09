import React, { useEffect, useState } from 'react';
import WebApp from '@twa-dev/sdk';

const API_BASE = 'https://arrogant-chloe-metmeku-dab124e3.koyeb.app';

export default function MiniApp() {
  const [userName, setUserName] = useState('User');
  const [statusText, setStatusText] = useState('');
  const [latestStatuses, setLatestStatuses] = useState([]);
  const [message, setMess] = useState(null);
  const [loading, setLoading] = useState(false);

  function setMessage(message) {
    setMess(message);
    setTimeout(() => {
      setMess(null);
    }, 3000);
  }

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
    if (!statusText) {
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
    <div className="max-w-md mx-auto p-6 bg-gray-50 rounded-lg shadow-md font-sans min-h-[50vh] flex flex-col">
      <header className="mb-6 text-center">
        <h2 className="text-3xl font-semibold text-blue-700">Hello, {userName}! 👋</h2>
      </header>

      <form className="flex flex-col items-center justify-around flex-grow w-full">
        <textarea
          rows={6}
          placeholder="What's on your mind today?"
          value={statusText}
          onChange={(e) => setStatusText(e.target.value)}
          className="mb-6 w-full max-w-[80vw] p-4 border border-blue-300 rounded-lg focus:outline-none focus:ring-4 focus:ring-blue-400 bg-white text-blue-900 placeholder-blue-400 resize-none"
          disabled={loading}
        />

        <button
          onClick={handlePostStatus}
          disabled={loading || !statusText}
          className={`postButton ${loading || !statusText && 'loadingButton'}`}
        >
          {loading ? 'Posting...' : 'Post Status'}
        </button>
      </form>

      {message && (
        <div className={message.type === "error" ? 'error' : 'success'}>
          <p
            className={`text-center font-semibold`}
          >
            {message.text}
          </p>
        </div>
      )}
    </div>
  );

}
