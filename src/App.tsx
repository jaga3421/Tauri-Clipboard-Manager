import { useState, useEffect } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { Toaster } from 'react-hot-toast';
import toast from 'react-hot-toast';
import FilterInput from './components/FilterInput';
import "./App.css";

interface ClipboardItem {
  text: string;
  source: string;
}

const STORAGE_KEY = 'clipboard-history';

function App() {
  const [items, setItems] = useState<ClipboardItem[]>(() => {

    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? JSON.parse(saved) : [];
  });
  const [filter, setFilter] = useState('');

  useEffect(() => {
    const checkClipboard = async () => {
      try {
        const data = await invoke<ClipboardData>('get_clipboard_text');
        if (data.text && !items.some(item => item.text === data.text)) {
          const newItems = [{
            text: data.text,
            source: data.source
          }, ...items].slice(0, 9);
          setItems(newItems);
          localStorage.setItem(STORAGE_KEY, JSON.stringify(newItems));
        }
      } catch (error) {
        console.error('Failed to read clipboard:', error);
      }
    };

    const interval = setInterval(checkClipboard, 1000);
    return () => clearInterval(interval);
  }, [items]);

  const handleCopy = async (text: string) => {
    try {
      await invoke('set_clipboard_text', { text });
      toast.success('Copied to clipboard!');
    } catch (error) {
      console.error('Failed to copy:', error);
      toast.error('Failed to copy');
    }
  };

  const handleClearAll = () => {
    setItems([]);
    localStorage.removeItem(STORAGE_KEY);
    toast.success('History cleared');
  };

  const filteredItems = items.filter(item => {
    if (typeof item.text !== 'string') return false;
    return item.text.toLowerCase().includes(filter.toLowerCase());
  });

  return (
    <div className="flex flex-col h-screen">
      {/* Fixed Header */}
      <div className="p-6 bg-gray-50 dark:bg-gray-800">
        <h1 className="text-2xl font-bold mb-4">Clipboard History</h1>
        <FilterInput value={filter} onChange={setFilter} />
      </div>

      {/* Scrollable Card Section */}
      <div className="flex-1 overflow-auto p-6 pt-2">
        <div className="grid grid-cols-3 gap-4">
          {filteredItems.map((item, index) => (
            <div 
              key={index} 
              className="bg-white rounded-lg shadow-md overflow-hidden cursor-pointer hover:shadow-lg transition-shadow h-24 flex flex-col"
              onClick={() => handleCopy(item.text)}
            >
              <div className="flex-1 p-3 overflow-hidden">
                <p className="text-gray-800 line-clamp-4">{item.text}</p>
              </div>
              <div className="px-3 py-1 bg-gray-100 dark:bg-gray-700 text-xs text-gray-600 dark:text-gray-300">
                {item.source || 'System Clipboard'}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Fixed Footer */}
      {items.length > 0 && (
        <div className="fixed bottom-4 left-0 right-0 flex justify-center z-50">
          <button
            onClick={handleClearAll}
            className="px-3 py-1 bg-red-500/50 text-white text-sm rounded hover:bg-red-600/50 transition-colors"
          >
            Clear All
          </button>
        </div>
      )}
      <Toaster position="bottom-right" />
    </div>
  );
}

export default App;
