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

  // Panel State
  const [panelTitle, setPanelTitle] = useState('📩 聯繫客服');
  const [panelDesc, setPanelDesc] = useState('如果您有任何問題，請選擇下方對應的服務類別...');
  const [panelColor, setPanelColor] = useState('#5865F2');
  const [panelImage, setPanelImage] = useState('');
  const [panelThumb, setPanelThumb] = useState('');
  const [panelSaving, setPanelSaving] = useState(false);

  // Form State
  const [editId, setEditId] = useState<string | null>(null);
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
    fetchPanel();
  }, []);

  const fetchPanel = async () => {
    try {
      const res = await fetch('/api/panel');
      const data = await res.json();
      if (data.panel) {
        setPanelTitle(data.panel.title);
        setPanelDesc(data.panel.description);
        setPanelColor(data.panel.color);
        setPanelImage(data.panel.imageUrl || '');
        setPanelThumb(data.panel.thumbnailUrl || '');
      }
    } catch (error) {
      console.error(error);
    }
  };

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

  const handlePanelSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPanelSaving(true);
    try {
      await fetch('/api/panel', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: panelTitle, description: panelDesc, color: panelColor,
          imageUrl: panelImage, thumbnailUrl: panelThumb
        })
      });
      alert('✅ 面板設定已儲存！請至 Discord 重新輸入 /setup_ticket 以套用。');
    } catch (error) {
      console.error(error);
      alert('❌ 面板設定儲存失敗');
    } finally {
      setPanelSaving(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const url = '/api/tickets';
      const method = editId ? 'PUT' : 'POST';
      const body = {
        id: editId, code, label, emoji, channelPrefix, welcomeMessage, 
        supportRoleId, embedColor, imageUrl, thumbnailUrl
      };

      await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      fetchCategories();
      resetForm();
    } catch (error) {
      console.error(error);
      alert(editId ? '更新失敗' : '新增失敗');
    }
  };

  const resetForm = () => {
    setEditId(null);
    setCode(''); setLabel(''); setChannelPrefix(''); setEmoji('🎫');
    setWelcomeMessage('您好，請問有什麼能幫您？');
    setSupportRoleId(''); setEmbedColor('#5865F2'); setImageUrl(''); setThumbnailUrl('');
  };

  const handleEdit = (cat: TicketCategory) => {
    setEditId(cat.id);
    setCode(cat.code);
    setLabel(cat.label);
    setEmoji(cat.emoji);
    setChannelPrefix(cat.channelPrefix);
    setWelcomeMessage(cat.welcomeMessage);
    setSupportRoleId(cat.supportRoleId || '');
    setEmbedColor(cat.embedColor || '#5865F2');
    setImageUrl(cat.imageUrl || '');
    setThumbnailUrl(cat.thumbnailUrl || '');
    window.scrollTo({ top: 0, behavior: 'smooth' });
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

        {/* Panel Settings Area */}
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 shadow-xl mb-8">
          <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
            <span className="text-indigo-400">⚙️</span> 機器人主面板外觀設定
          </h2>
          <form onSubmit={handlePanelSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">主標題</label>
                <input required value={panelTitle} onChange={e => setPanelTitle(e.target.value)} className="w-full bg-gray-950 border border-gray-800 rounded-lg px-4 py-2 text-white focus:border-indigo-500 outline-none transition" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">面板描述 (支援 Discord Markdown)</label>
                <textarea required rows={4} value={panelDesc} onChange={e => setPanelDesc(e.target.value)} className="w-full bg-gray-950 border border-gray-800 rounded-lg px-4 py-2 text-white focus:border-indigo-500 outline-none transition resize-none" />
              </div>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">面板側邊顏色 (Hex)</label>
                <div className="flex gap-3">
                  <input type="color" value={panelColor} onChange={e => setPanelColor(e.target.value)} className="h-10 w-14 rounded cursor-pointer bg-gray-950 border border-gray-800" />
                  <input required value={panelColor} onChange={e => setPanelColor(e.target.value)} className="w-full bg-gray-950 border border-gray-800 rounded-lg px-4 py-2 text-white focus:border-indigo-500 outline-none transition" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">大型附圖網址 (Image URL)</label>
                <input value={panelImage} onChange={e => setPanelImage(e.target.value)} placeholder="https://..." className="w-full bg-gray-950 border border-gray-800 rounded-lg px-4 py-2 text-white focus:border-indigo-500 outline-none transition" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">右上角縮圖網址 (Thumbnail URL)</label>
                <input value={panelThumb} onChange={e => setPanelThumb(e.target.value)} placeholder="https://..." className="w-full bg-gray-950 border border-gray-800 rounded-lg px-4 py-2 text-white focus:border-indigo-500 outline-none transition" />
              </div>
            </div>
            <div className="md:col-span-2 mt-2">
              <button type="submit" disabled={panelSaving} className="w-full md:w-auto px-8 py-3 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 transition rounded-lg font-bold text-white shadow-lg shadow-indigo-600/20">
                {panelSaving ? '儲存中...' : '儲存面板設定'}
              </button>
            </div>
          </form>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Create Form */}
          <div className="lg:col-span-1 bg-gray-900 border border-gray-800 rounded-2xl p-6 shadow-xl">
            <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
              <span className="text-blue-400">✨</span> {editId ? '編輯客服類別' : '新增客服類別'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              
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

              <div className="flex gap-2 mt-4">
                <button type="submit" className="flex-1 py-3 bg-white text-black hover:bg-gray-200 transition rounded-lg font-bold">
                  {editId ? '儲存變更' : '建立新類別'}
                </button>
                {editId && (
                  <button type="button" onClick={resetForm} className="py-3 px-4 bg-gray-800 text-gray-300 hover:bg-gray-700 transition rounded-lg font-bold">
                    取消
                  </button>
                )}
              </div>
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
                      <div className="flex">
                        <button onClick={() => handleEdit(cat)} className="text-gray-500 hover:text-blue-400 p-2 opacity-0 group-hover:opacity-100 transition" title="編輯">
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                        </button>
                        <button onClick={() => handleDelete(cat.id)} className="text-gray-500 hover:text-red-400 p-2 opacity-0 group-hover:opacity-100 transition" title="刪除">
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                        </button>
                      </div>
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
