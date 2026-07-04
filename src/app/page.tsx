'use client';

import { useState, useEffect } from 'react';

type TicketCategory = {
  id: string;
  code: string;
  label: string;
  emoji: string;
  channelPrefix: string;
  welcomeMessage: string;
  supportRoleId: string | null;
  embedColor: string | null;
  imageUrl: string | null;
  thumbnailUrl: string | null;
};

export default function AdminDashboard() {
  const [categories, setCategories] = useState<TicketCategory[]>([]);
  const [loading, setLoading] = useState(true);

  // Form State
  const [code, setCode] = useState('');
  const [label, setLabel] = useState('');
  const [emoji, setEmoji] = useState('🎫');
  const [channelPrefix, setChannelPrefix] = useState('');
  const [welcomeMessage, setWelcomeMessage] = useState('您好，請問有什麼能幫您？');
  
  // VIP Fields
  const [supportRoleId, setSupportRoleId] = useState('');
  const [embedColor, setEmbedColor] = useState('#5865F2');
  const [imageUrl, setImageUrl] = useState('');
  const [thumbnailUrl, setThumbnailUrl] = useState('');

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const res = await fetch('/api/tickets');
      const data = await res.json();
      setCategories(data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await fetch('/api/tickets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code, label, emoji, channelPrefix, welcomeMessage, 
          supportRoleId, embedColor, imageUrl, thumbnailUrl
        }),
      });
      fetchCategories();
      // Reset basic form
      setCode(''); setLabel(''); setChannelPrefix('');
    } catch (error) {
      console.error(error);
      alert('新增失敗');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('確定要刪除嗎？')) return;
    try {
      await fetch(`/api/tickets?id=${id}`, { method: 'DELETE' });
      fetchCategories();
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <div className="min-h-screen bg-gray-950 text-white p-8 font-sans">
      <div className="max-w-6xl mx-auto">
        
        {/* Header */}
        <div className="flex items-center justify-between mb-10">
          <div>
            <h1 className="text-4xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-500">
              Ticket Bot Dashboard
            </h1>
            <p className="text-gray-400 mt-2">獨立版客服機器人管理後台 (VIP Edition)</p>
          </div>
          <div className="flex gap-4">
            <button className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 transition rounded-lg font-medium shadow-lg shadow-indigo-600/20">
              發送面板至 Discord
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Create Form */}
          <div className="lg:col-span-1 bg-gray-900 border border-gray-800 rounded-2xl p-6 shadow-xl">
            <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
              <span className="text-blue-400">✨</span> 新增客服類別
            </h2>
            <form onSubmit={handleCreate} className="space-y-4">
              
              {/* Basic Fields */}
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1">內部代號 (英文)</label>
                  <input required value={code} onChange={e => setCode(e.target.value)} placeholder="e.g. vip-support" className="w-full bg-gray-950 border border-gray-800 rounded-lg px-4 py-2 text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition" />
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <div className="col-span-2">
                    <label className="block text-sm font-medium text-gray-400 mb-1">按鈕名稱</label>
                    <input required value={label} onChange={e => setLabel(e.target.value)} placeholder="e.g. 售後服務" className="w-full bg-gray-950 border border-gray-800 rounded-lg px-4 py-2 text-white outline-none focus:border-blue-500" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-1">Emoji</label>
                    <input required value={emoji} onChange={e => setEmoji(e.target.value)} className="w-full bg-gray-950 border border-gray-800 rounded-lg px-4 py-2 text-white outline-none focus:border-blue-500 text-center" />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1">頻道前綴 (例: 售後)</label>
                  <input required value={channelPrefix} onChange={e => setChannelPrefix(e.target.value)} className="w-full bg-gray-950 border border-gray-800 rounded-lg px-4 py-2 text-white outline-none focus:border-blue-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1">歡迎訊息 (支援換行)</label>
                  <textarea required rows={3} value={welcomeMessage} onChange={e => setWelcomeMessage(e.target.value)} className="w-full bg-gray-950 border border-gray-800 rounded-lg px-4 py-2 text-white outline-none focus:border-blue-500 resize-none" />
                </div>
              </div>

              {/* VIP Fields */}
              <div className="pt-4 mt-4 border-t border-gray-800 space-y-3">
                <div className="flex items-center gap-2 mb-2">
                  <span className="bg-gradient-to-r from-amber-500 to-orange-400 text-black text-xs font-bold px-2 py-0.5 rounded uppercase tracking-wider">VIP 功能</span>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1">自動標記身分組 (Role ID)</label>
                  <input value={supportRoleId} onChange={e => setSupportRoleId(e.target.value)} placeholder="Discord 身分組 ID" className="w-full bg-gray-950 border border-gray-800 rounded-lg px-4 py-2 text-white outline-none focus:border-amber-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1">面板側邊顏色 (Hex)</label>
                  <div className="flex gap-3">
                    <input type="color" value={embedColor} onChange={e => setEmbedColor(e.target.value)} className="h-10 w-14 rounded cursor-pointer bg-gray-950 border border-gray-800" />
                    <input value={embedColor} onChange={e => setEmbedColor(e.target.value)} className="w-full bg-gray-950 border border-gray-800 rounded-lg px-4 py-2 text-white outline-none focus:border-amber-500" />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1">大型附圖網址 (Image URL)</label>
                  <input value={imageUrl} onChange={e => setImageUrl(e.target.value)} placeholder="https://..." className="w-full bg-gray-950 border border-gray-800 rounded-lg px-4 py-2 text-white outline-none focus:border-amber-500" />
                </div>
              </div>

              <button type="submit" className="w-full py-3 mt-4 bg-white text-black hover:bg-gray-200 transition rounded-lg font-bold">
                建立新類別
              </button>
            </form>
          </div>

          {/* List Area */}
          <div className="lg:col-span-2 space-y-4">
            {loading ? (
              <div className="animate-pulse flex space-x-4">
                <div className="flex-1 space-y-4 py-1">
                  <div className="h-24 bg-gray-800 rounded-2xl w-full"></div>
                  <div className="h-24 bg-gray-800 rounded-2xl w-full"></div>
                </div>
              </div>
            ) : categories.length === 0 ? (
              <div className="bg-gray-900 border border-gray-800 border-dashed rounded-2xl p-12 text-center text-gray-500">
                目前沒有任何客服類別。請從左側新增！
              </div>
            ) : (
              categories.map(cat => (
                <div key={cat.id} className="bg-gray-900 border border-gray-800 rounded-2xl p-5 hover:border-gray-700 transition group flex gap-5">
                  <div 
                    className="w-2 h-auto rounded-full shrink-0" 
                    style={{ backgroundColor: cat.embedColor || '#5865F2' }}
                  />
                  <div className="flex-1">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="text-xl font-bold flex items-center gap-2">
                          {cat.emoji} {cat.label}
                        </h3>
                        <div className="flex gap-3 mt-2 text-xs text-gray-500 font-mono">
                          <span className="bg-gray-950 px-2 py-1 rounded">ID: {cat.code}</span>
                          <span className="bg-gray-950 px-2 py-1 rounded">前綴: {cat.channelPrefix}-xxx</span>
                          {cat.supportRoleId && <span className="bg-amber-900/30 text-amber-500 px-2 py-1 rounded">@Ping Role</span>}
                        </div>
                      </div>
                      <button onClick={() => handleDelete(cat.id)} className="text-gray-500 hover:text-red-400 p-2 opacity-0 group-hover:opacity-100 transition">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                      </button>
                    </div>
                    <div className="mt-4 p-3 bg-gray-950 rounded-lg text-sm text-gray-300 whitespace-pre-wrap border border-gray-800/50">
                      {cat.welcomeMessage}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
