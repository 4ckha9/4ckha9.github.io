import React, { useState, useRef, useEffect } from 'react';
import { Plus, Trash2, Upload, Edit2, Save, X, Clock } from 'lucide-react';

const FF14TimelineManager = () => {
  const [timelines, setTimelines] = useState([]);
  const [images, setImages] = useState({});
  const [editingId, setEditingId] = useState(null);
  const [drawingMode, setDrawingMode] = useState(false);
  const [drawColor, setDrawColor] = useState('#ff0000');
  const [selectedImage, setSelectedImage] = useState(null);
  const [activeTab, setActiveTab] = useState('timeline'); // 'timeline' or 'image'
  const canvasRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [drawnLines, setDrawnLines] = useState({});

  // 画像アイコン用のSVGコンポーネント
  const ImageIcon = ({ size = 24, className = "" }) => (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
      <circle cx="8.5" cy="8.5" r="1.5"></circle>
      <polyline points="21 15 16 10 5 21"></polyline>
    </svg>
  );

  const colors = [
    { name: '赤', value: '#ff0000' },
    { name: '青', value: '#0000ff' },
    { name: '緑', value: '#00ff00' },
    { name: '黄', value: '#ffff00' },
    { name: '紫', value: '#ff00ff' },
    { name: '白', value: '#ffffff' },
  ];

  const addTimeline = () => {
    const newTimeline = {
      id: Date.now(),
      time: '00:00.00',
      gimmick: '',
      description: '',
      imageId: null,
    };
    setTimelines([...timelines, newTimeline]);
    setEditingId(newTimeline.id);
  };

  const deleteTimeline = (id) => {
    setTimelines(timelines.filter(t => t.id !== id));
  };

  const updateTimeline = (id, field, value) => {
    setTimelines(timelines.map(t => 
      t.id === id ? { ...t, [field]: value } : t
    ));
  };

  const handleImageUpload = (e, timelineId) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const imageId = `img_${Date.now()}`;
        setImages({ ...images, [imageId]: event.target.result });
        updateTimeline(timelineId, 'imageId', imageId);
        setDrawnLines({ ...drawnLines, [imageId]: [] });
      };
      reader.readAsDataURL(file);
    }
  };

  const openImageEditor = (imageId) => {
    setSelectedImage(imageId);
    setDrawingMode(false);
  };

  const getDrawPosition = (e) => {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const touch = e.touches ? e.touches[0] : e;
    const x = (touch.clientX - rect.left) * (canvas.width / rect.width);
    const y = (touch.clientY - rect.top) * (canvas.height / rect.height);
    return { x, y };
  };

  const startDrawing = (e) => {
    if (!drawingMode) return;
    e.preventDefault();
    setIsDrawing(true);
    const { x, y } = getDrawPosition(e);
    
    const newLine = { color: drawColor, points: [{ x, y }] };
    setDrawnLines({
      ...drawnLines,
      [selectedImage]: [...(drawnLines[selectedImage] || []), newLine]
    });
  };

  const draw = (e) => {
    if (!isDrawing || !drawingMode) return;
    e.preventDefault();
    const { x, y } = getDrawPosition(e);

    const lines = drawnLines[selectedImage] || [];
    const currentLine = lines[lines.length - 1];
    currentLine.points.push({ x, y });
    
    setDrawnLines({ ...drawnLines, [selectedImage]: [...lines] });
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  useEffect(() => {
    if (selectedImage && canvasRef.current) {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      const img = new Image();
      img.onload = () => {
        canvas.width = img.width;
        canvas.height = img.height;
        ctx.drawImage(img, 0, 0);
        
        const lines = drawnLines[selectedImage] || [];
        lines.forEach(line => {
          ctx.strokeStyle = line.color;
          ctx.lineWidth = 5;
          ctx.lineCap = 'round';
          ctx.lineJoin = 'round';
          ctx.beginPath();
          line.points.forEach((point, index) => {
            if (index === 0) {
              ctx.moveTo(point.x, point.y);
            } else {
              ctx.lineTo(point.x, point.y);
            }
          });
          ctx.stroke();
        });
      };
      img.src = images[selectedImage];
    }
  }, [selectedImage, images, drawnLines]);

  const clearDrawings = () => {
    if (selectedImage) {
      setDrawnLines({ ...drawnLines, [selectedImage]: [] });
    }
  };

  const sortedTimelines = [...timelines].sort((a, b) => {
    const timeToSeconds = (time) => {
      const [min, sec] = time.split(':');
      const [s, ms] = sec.split('.');
      return parseInt(min) * 60 + parseInt(s) + parseInt(ms || 0) / 100;
    };
    return timeToSeconds(a.time) - timeToSeconds(b.time);
  });

  const getImageTimelines = () => {
    return sortedTimelines.filter(t => t.imageId && images[t.imageId]);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* ヘッダー */}
      <div className="bg-slate-800/95 backdrop-blur sticky top-0 z-40 shadow-lg">
        <div className="p-4">
          <h1 className="text-xl font-bold text-white mb-3">FF14 タイムライン管理</h1>
          
          {/* タブ切り替え */}
          <div className="flex gap-2">
            <button
              onClick={() => setActiveTab('image')}
              className={`flex-1 py-3 px-4 rounded-lg font-semibold transition-all flex items-center justify-center gap-2 ${
                activeTab === 'image'
                  ? 'bg-purple-600 text-white shadow-lg'
                  : 'bg-slate-700 text-slate-300'
              }`}
            >
              <ImageIcon size={20} />
              画像
            </button>
            <button
              onClick={() => setActiveTab('timeline')}
              className={`flex-1 py-3 px-4 rounded-lg font-semibold transition-all flex items-center justify-center gap-2 ${
                activeTab === 'timeline'
                  ? 'bg-purple-600 text-white shadow-lg'
                  : 'bg-slate-700 text-slate-300'
              }`}
            >
              <Clock size={20} />
              タイムライン
            </button>
          </div>
        </div>
      </div>

      {/* 画像タブ */}
      {activeTab === 'image' && (
        <div className="p-4 space-y-4">
          {getImageTimelines().length === 0 ? (
            <div className="bg-slate-800/90 backdrop-blur rounded-lg p-8 text-center">
              <ImageIcon size={48} className="text-slate-600 mx-auto mb-3" />
              <p className="text-slate-400">画像が登録されていません</p>
              <p className="text-slate-500 text-sm mt-2">タイムラインに画像を追加してください</p>
            </div>
          ) : (
            getImageTimelines().map(timeline => (
              <div key={timeline.id} className="bg-slate-800/90 backdrop-blur rounded-lg overflow-hidden shadow-lg">
                <div className="p-3 bg-slate-700/50 border-b border-slate-600">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-yellow-400 font-mono font-bold">{timeline.time}</span>
                    <button
                      onClick={() => openImageEditor(timeline.imageId)}
                      className="bg-indigo-600 text-white px-3 py-1 rounded text-sm font-semibold"
                    >
                      編集
                    </button>
                  </div>
                  <h3 className="text-white font-bold text-lg">{timeline.gimmick || '未設定'}</h3>
                  {timeline.description && (
                    <p className="text-slate-300 text-sm mt-1">{timeline.description}</p>
                  )}
                </div>
                <img
                  src={images[timeline.imageId]}
                  alt={timeline.gimmick}
                  className="w-full cursor-pointer"
                  onClick={() => openImageEditor(timeline.imageId)}
                />
              </div>
            ))
          )}
        </div>
      )}

      {/* タイムラインタブ */}
      {activeTab === 'timeline' && (
        <div className="p-4">
          <button
            onClick={addTimeline}
            className="w-full mb-4 flex items-center justify-center gap-2 bg-blue-600 text-white px-4 py-3 rounded-lg font-semibold shadow-lg"
          >
            <Plus size={20} />
            新しいタイムライン追加
          </button>

          <div className="space-y-3">
            {sortedTimelines.map(timeline => (
              <div key={timeline.id} className="bg-slate-800/90 backdrop-blur rounded-lg shadow-lg overflow-hidden">
                {editingId === timeline.id ? (
                  <div className="p-4 space-y-3">
                    <div>
                      <label className="text-xs text-slate-400 mb-1 block">時間 (MM:SS.ff)</label>
                      <input
                        type="text"
                        value={timeline.time}
                        onChange={(e) => updateTimeline(timeline.id, 'time', e.target.value)}
                        placeholder="00:00.00"
                        className="w-full bg-slate-700 text-white px-3 py-2 rounded border border-slate-600 text-lg"
                      />
                    </div>

                    <div>
                      <label className="text-xs text-slate-400 mb-1 block">ギミック名</label>
                      <input
                        type="text"
                        value={timeline.gimmick}
                        onChange={(e) => updateTimeline(timeline.id, 'gimmick', e.target.value)}
                        placeholder="ギミック名"
                        className="w-full bg-slate-700 text-white px-3 py-2 rounded border border-slate-600"
                      />
                    </div>

                    <div>
                      <label className="text-xs text-slate-400 mb-1 block">説明</label>
                      <textarea
                        value={timeline.description}
                        onChange={(e) => updateTimeline(timeline.id, 'description', e.target.value)}
                        placeholder="説明"
                        rows="3"
                        className="w-full bg-slate-700 text-white px-3 py-2 rounded border border-slate-600 resize-none"
                      />
                    </div>

                    <div className="flex gap-2">
                      <label className="flex-1 cursor-pointer">
                        <div className="bg-purple-600 text-white px-4 py-3 rounded text-center font-semibold flex items-center justify-center gap-2">
                          <Upload size={18} />
                          {timeline.imageId ? '画像変更' : '画像追加'}
                        </div>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => handleImageUpload(e, timeline.id)}
                          className="hidden"
                        />
                      </label>
                      <button
                        onClick={() => setEditingId(null)}
                        className="bg-green-600 text-white px-6 py-3 rounded font-semibold flex items-center gap-2"
                      >
                        <Save size={18} />
                        保存
                      </button>
                    </div>

                    {timeline.imageId && images[timeline.imageId] && (
                      <div className="pt-2">
                        <img
                          src={images[timeline.imageId]}
                          alt="Preview"
                          className="w-full rounded border-2 border-slate-600"
                        />
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="p-4">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <div className="text-yellow-400 font-mono font-bold text-lg mb-1">
                          {timeline.time}
                        </div>
                        <h3 className="text-white font-bold text-lg">
                          {timeline.gimmick || '未設定'}
                        </h3>
                        {timeline.description && (
                          <p className="text-slate-300 text-sm mt-1">{timeline.description}</p>
                        )}
                      </div>
                      <div className="flex gap-2 ml-2">
                        <button
                          onClick={() => setEditingId(timeline.id)}
                          className="bg-slate-600 text-white p-2 rounded"
                        >
                          <Edit2 size={18} />
                        </button>
                        <button
                          onClick={() => deleteTimeline(timeline.id)}
                          className="bg-red-600 text-white p-2 rounded"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </div>

                    {timeline.imageId && images[timeline.imageId] && (
                      <div className="mt-3">
                        <img
                          src={images[timeline.imageId]}
                          alt={timeline.gimmick}
                          className="w-full rounded border-2 border-slate-600"
                          onClick={() => openImageEditor(timeline.imageId)}
                        />
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 画像エディタモーダル */}
      {selectedImage && (
        <div className="fixed inset-0 bg-black/95 z-50 flex flex-col">
          <div className="bg-slate-800 p-3 flex items-center justify-between shadow-lg">
            <h2 className="text-lg font-bold text-white">画像エディタ</h2>
            <button
              onClick={() => setSelectedImage(null)}
              className="text-white p-2"
            >
              <X size={24} />
            </button>
          </div>
          
          <div className="p-3 bg-slate-800/95 space-y-3">
            <button
              onClick={() => setDrawingMode(!drawingMode)}
              className={`w-full px-4 py-3 rounded-lg font-semibold transition-colors ${
                drawingMode ? 'bg-green-600 text-white' : 'bg-slate-700 text-slate-300'
              }`}
            >
              {drawingMode ? '✓ 描画モード ON' : '描画モード OFF'}
            </button>
            
            <div className="grid grid-cols-6 gap-2">
              {colors.map(color => (
                <button
                  key={color.value}
                  onClick={() => setDrawColor(color.value)}
                  className={`aspect-square rounded-lg border-4 transition-all ${
                    drawColor === color.value ? 'border-white scale-110' : 'border-slate-600'
                  }`}
                  style={{ backgroundColor: color.value }}
                />
              ))}
            </div>
            
            <button
              onClick={clearDrawings}
              className="w-full bg-red-600 text-white px-4 py-3 rounded-lg font-semibold"
            >
              線を全削除
            </button>
          </div>

          <div className="flex-1 overflow-auto bg-slate-900 p-2">
            <canvas
              ref={canvasRef}
              onMouseDown={startDrawing}
              onMouseMove={draw}
              onMouseUp={stopDrawing}
              onMouseLeave={stopDrawing}
              onTouchStart={startDrawing}
              onTouchMove={draw}
              onTouchEnd={stopDrawing}
              className={`w-full touch-none ${drawingMode ? 'cursor-crosshair' : 'cursor-default'}`}
              style={{ maxWidth: '100%', height: 'auto' }}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default FF14TimelineManager;
