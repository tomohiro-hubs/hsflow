import { useState, useEffect, useMemo } from 'react';
import { useNodesState, useEdgesState, ReactFlowProvider, Node, Edge } from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Search, List, LayoutDashboard, Info, Star, Download, Upload, Loader2, Moon, Sun, RotateCcw, Filter, BookOpen, FileDown, Sparkles } from 'lucide-react';

import { AppData, NodeData } from '@/types';
import { CATEGORY_COLORS, CATEGORY_LABELS } from '@/constants';
import { useNodeData } from '@/hooks/useNodeData';
import { useExcelIO } from '@/hooks/useExcelIO';
import FlowView from '@/components/FlowView';
import CategoryPill from '@/components/CategoryPill';
import CursorPosDisplay from '@/components/CursorPosDisplay';
import HeaderLink from '@/components/HeaderLink';
import NodeDetailModal from '@/components/NodeDetailModal';
import ListView from '@/pages/ListView';
import AboutView from '@/pages/AboutView';
import ManualView from '@/pages/ManualView';
import AIAnalysisModal from '@/components/AIAnalysisModal';

const App = () => {
    // --- ノード・エッジの基本状態 ---
    const [nodes, setNodes] = useNodesState<Node>([]);
    const [edges, setEdges] = useEdgesState<Edge>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [selectedNode, setSelectedNode] = useState<Node | null>(null);
    const [favorites, setFavorites] = useState<string[]>(() => {
        const saved = localStorage.getItem('helios_favorites');
        return saved ? JSON.parse(saved) : [];
    });
    const [searchTerm, setSearchTerm] = useState('');
    const [activeCategory, setActiveCategory] = useState('all');

    // --- AI解析モーダルの状態 ---
    const [isAIModalOpen, setIsAIModalOpen] = useState(false);

    // --- テーマ管理 ---
    const [theme, setTheme] = useState(() => localStorage.getItem('helios_theme') || 'dark');

    useEffect(() => {
        document.documentElement.setAttribute('data-theme', theme);
        localStorage.setItem('helios_theme', theme);
    }, [theme]);

    const toggleTheme = () => {
        setTheme(prev => prev === 'dark' ? 'light' : 'dark');
    };

    // --- ノードデータ管理（カスタムフック） ---
    const {
        statusMap, setStatusMap,
        assigneeMap, setAssigneeMap,
        dueDateMap, setDueDateMap,
        memoMap, setMemoMap,
        projectName,
        lastUpdated, lastImported, lastExported,
        handleStatusChange,
        handleAssigneeChange,
        handleDueDateChange,
        handleMemoChange,
        handleProjectNameChange,
        updateTimestamp, updateImportTimestamp, updateExportTimestamp,
        clearAllData,
    } = useNodeData();

    // --- Excel入出力（カスタムフック） ---
    const { fileInputRef, handleExport, handleImport } = useExcelIO({
        nodes,
        statusMap, setStatusMap,
        assigneeMap, setAssigneeMap,
        dueDateMap, setDueDateMap,
        memoMap, setMemoMap,
        projectName,
        setProjectName: handleProjectNameChange,
        updateTimestamp,
        updateImportTimestamp,
        updateExportTimestamp,
    });

    // --- データ読み込み ---
    useEffect(() => {
        fetch(`${import.meta.env.BASE_URL}data.json`)
            .then(res => {
                if (!res.ok) throw new Error("Failed to load data.json");
                return res.json();
            })
            .then((data: AppData) => {
                const nodeIds = new Set(data.nodes.map(n => n.id));
                if (nodeIds.size !== data.nodes.length) throw new Error("Duplicate Node IDs found.");

                const rfNodes = data.nodes.map(n => ({
                    id: n.id,
                    position: n.position,
                    data: {
                        label: n.title,
                        description: n.description,
                        category: n.category,
                        tags: n.tags,
                        links: n.links || [],
                        inputs: n.inputs || [],
                        outputs: n.outputs || [],
                        next: n.next || []
                    },
                    type: 'custom',
                    // ミニマップ表示に必要なサイズ情報
                    width: n.category === 'junction' ? 12 : 200,
                    height: n.category === 'junction' ? 12 : 80,
                }));

                const rfEdges = data.edges.map(e => ({
                    id: e.id,
                    source: e.source,
                    target: e.target,
                    sourceHandle: e.sourceHandle,
                    targetHandle: e.targetHandle,
                    label: e.label,
                    type: 'smoothstep',
                    animated: e.animated
                }));

                setNodes(rfNodes as Node[]);
                setEdges(rfEdges as Edge[]);
                setLoading(false);
            })
            .catch(err => {
                console.error(err);
                setError(err.message);
                setLoading(false);
            });
    }, []);

    // --- フィルターロジック ---
    const filteredNodes = useMemo(() => {
        return nodes.filter(n => {
            const data = n.data as NodeData;
            const matchesSearch = data.label.toLowerCase().includes(searchTerm.toLowerCase()) ||
                n.id.toLowerCase().includes(searchTerm.toLowerCase());

            let matchesCat = true;
            if (activeCategory === 'favorites') {
                matchesCat = favorites.includes(n.id);
            } else if (activeCategory !== 'all') {
                matchesCat = data.category === activeCategory;
            }

            return matchesSearch && matchesCat;
        });
    }, [nodes, searchTerm, activeCategory, favorites]);

    // --- お気に入りロジック ---
    useEffect(() => {
        const handleFav = (e: any) => {
            const id = e.detail.id;
            setFavorites(prev => {
                const next = prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id];
                localStorage.setItem('helios_favorites', JSON.stringify(next));
                return next;
            });
        };
        window.addEventListener('toggleFav', handleFav);
        return () => window.removeEventListener('toggleFav', handleFav);
    }, []);

    const handleToggleFav = (nodeId: string) => {
        const event = new CustomEvent('toggleFav', { detail: { id: nodeId } });
        window.dispatchEvent(event);
    };

    // --- ローディング画面 ---
    if (loading) return (
        <div className="h-screen w-screen flex flex-col items-center justify-center gap-4"
            style={{ background: 'var(--hf-bg-primary)' }}>
            <Loader2 size={32} className="animate-spin" style={{ color: 'var(--hf-accent)' }} />
            <span className="text-sm font-medium" style={{ color: 'var(--hf-text-secondary)' }}>
                フローデータを読み込み中...
            </span>
        </div>
    );

    // --- エラー画面 ---
    if (error) return (
        <div className="h-screen w-screen flex flex-col items-center justify-center gap-4"
            style={{ background: 'var(--hf-bg-primary)' }}>
            <div className="text-red-400 font-bold text-lg">エラーが発生しました</div>
            <div className="text-sm font-mono p-4 rounded-lg max-w-lg" style={{ color: 'var(--hf-text-secondary)', background: 'var(--hf-bg-elevated)', border: '1px solid rgba(239,68,68,0.3)' }}>
                {error}
            </div>
        </div>
    );

    return (
        <BrowserRouter>
            <div className="h-screen w-screen flex flex-col overflow-hidden" style={{ background: 'var(--hf-bg-primary)' }}>

                {/* ========== ヘッダー ========== */}
                <header
                    className="h-14 flex items-center px-4 justify-between shrink-0 z-20 relative transition-colors duration-300"
                    style={{
                        background: 'rgba(var(--hf-bg-elevated), 0.85)',
                        backdropFilter: 'blur(20px)',
                        WebkitBackdropFilter: 'blur(20px)',
                        borderBottom: '1px solid var(--hf-border-light)',
                    }}
                >
                    {/* ロゴ + 案件名 */}
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-[10px] font-bold shrink-0"
                            style={{ background: 'linear-gradient(135deg, #6366f1, #818cf8)' }}>
                            HF
                        </div>
                        <span className="hidden sm:inline text-sm font-bold tracking-tight" style={{ color: 'var(--hf-text-primary)' }}>
                            Helios Flow
                        </span>
                        <div className="hidden sm:block w-px h-5 mx-1" style={{ background: 'var(--hf-border-light)' }} />
                        <input
                            type="text"
                            value={projectName}
                            onChange={e => handleProjectNameChange(e.target.value)}
                            placeholder="案件名を入力"
                            className="text-sm font-medium px-2.5 py-1 rounded-md w-36 sm:w-52 outline-none transition-all duration-200 focus:ring-2"
                            style={{
                                background: 'var(--hf-bg-elevated)',
                                color: 'var(--hf-text-primary)',
                                border: '1px solid var(--hf-border-light)',
                            }}
                        />
                        <div className="hidden lg:flex flex-col gap-0 px-2 border-l border-white/5">
                            {lastUpdated && (
                                <span className="text-xs whitespace-nowrap" style={{ color: 'var(--hf-text-muted)' }}>
                                    更新: {lastUpdated}
                                </span>
                            )}
                            <div className="flex gap-2">
                                {lastImported && (
                                    <span className="text-[9px] opacity-60 whitespace-nowrap" style={{ color: 'var(--hf-text-muted)' }}>
                                        インポート: {lastImported}
                                    </span>
                                )}
                                {lastExported && (
                                    <span className="text-[9px] opacity-60 whitespace-nowrap" style={{ color: 'var(--hf-text-muted)' }}>
                                        出力: {lastExported}
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* ナビゲーション */}
                    <nav className="flex p-1 rounded-lg gap-0.5" style={{ background: 'var(--hf-bg-elevated)' }}>
                        <HeaderLink to="/" icon={<LayoutDashboard size={14} />} label="フロー" />
                        <HeaderLink to="/list" icon={<List size={14} />} label="一覧" />
                        <HeaderLink to="/about" icon={<Info size={14} />} label="情報" />
                        <HeaderLink to="/manual" icon={<BookOpen size={14} />} label="使い方" />
                    </nav>

                    {/* インポート / エクスポート / AI解析 / テーマ切り替え */}
                    <div className="flex items-center gap-1.5">
                        <button
                            onClick={() => setIsAIModalOpen(true)}
                            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium transition-all duration-200 hover:brightness-110 shadow-sm"
                            style={{ background: 'linear-gradient(135deg, #a855f7, #6366f1)', color: '#fff', border: 'none' }}
                            title="AIで進捗を解析"
                        >
                            <Sparkles size={13} />
                            <span className="hidden lg:inline">AI解析</span>
                        </button>
                        <div className="w-px h-4 mx-1" style={{ background: 'var(--hf-border-light)' }} />
                        <button
                            onClick={toggleTheme}
                            className="flex items-center justify-center w-8 h-8 rounded-md transition-all duration-200 hover:bg-slate-100/10"
                            style={{ color: 'var(--hf-text-secondary)' }}
                            title={theme === 'dark' ? 'ライトモードへ' : 'ダークモードへ'}
                        >
                            {theme === 'dark' ? <Sun size={15} /> : <Moon size={15} />}
                        </button>
                        <div className="w-px h-4 mx-1" style={{ background: 'var(--hf-border-light)' }} />
                        <button
                            onClick={() => {
                                if (window.confirm('現在の状態と案件名をすべてクリアしますか？')) {
                                    clearAllData();
                                }
                            }}
                            className="flex items-center justify-center w-8 h-8 rounded-md transition-all duration-200 hover:bg-red-500/10 hover:text-red-500"
                            style={{ color: 'var(--hf-text-secondary)' }}
                            title="状態をクリア"
                        >
                            <span className="sr-only">クリア</span>
                            <RotateCcw size={15} />
                        </button>
                        <span className="text-[10px] hidden md:inline ml-1" style={{ color: 'var(--hf-text-secondary)' }}>（←新しくつくる場合は初期化）</span>
                        <div className="w-px h-4 mx-1" style={{ background: 'var(--hf-border-light)' }} />
                        <a
                            href={`${import.meta.env.BASE_URL}format.xlsx`}
                            download="format.xlsx"
                            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium transition-all duration-200 hover:bg-slate-100/10"
                            style={{ color: 'var(--hf-text-secondary)', border: '1px solid var(--hf-border-light)' }}
                            title="Excelフォーマットをダウンロード"
                        >
                            <FileDown size={13} />
                            <span className="hidden sm:inline">フォーマット</span>
                        </a>
                        <input type="file" ref={fileInputRef} accept=".xlsx,.xls" onChange={handleImport} className="hidden" />
                        <button
                            onClick={() => fileInputRef.current?.click()}
                            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium transition-all duration-200 hover:brightness-125"
                            style={{ color: 'var(--hf-text-secondary)', border: '1px solid var(--hf-border-light)' }}
                            title="Excelインポート"
                        >
                            <Upload size={13} />
                            <span className="hidden sm:inline">インポート</span>
                        </button>
                        <button
                            onClick={handleExport}
                            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium transition-all duration-200"
                            style={{
                                background: 'var(--hf-accent)',
                                color: '#fff',
                            }}
                            title="Excelエクスポート"
                        >
                            <Download size={13} />
                            <span className="hidden sm:inline">エクスポート</span>
                        </button>
                    </div>
                </header>

                {/* カテゴリフィルター（一時的に無効化） */}
                <div className="h-10 flex items-center px-4 gap-2 overflow-x-auto shrink-0 scrollbar-hide hidden"
                    style={{ background: 'var(--hf-bg-secondary)', borderBottom: '1px solid var(--hf-border)' }}>
                    <Filter size={14} style={{ color: 'var(--hf-text-muted)' }} />
                    <CategoryPill label="すべて" color="#64748b" active={activeCategory === 'all'} onClick={() => setActiveCategory('all')} />
                    {Object.keys(CATEGORY_COLORS).filter(k => k !== 'default').map(cat => (
                        <CategoryPill key={cat} label={CATEGORY_LABELS[cat] || cat} color={CATEGORY_COLORS[cat]} active={activeCategory === cat} onClick={() => setActiveCategory(cat)} />
                    ))}
                </div>

                {/* ========== メインコンテンツ ========== */}
                <div className="flex-1 relative overflow-hidden">
                    <Routes>
                        <Route path="/" element={
                            <div className="h-full w-full relative">
                                <ReactFlowProvider>
                                    <FlowView
                                        nodes={filteredNodes}
                                        edges={edges}
                                        statusMap={statusMap}
                                        assigneeMap={assigneeMap}
                                        memoMap={memoMap}
                                        dueDateMap={dueDateMap}
                                        onNodeClick={(n) => setSelectedNode(prev => prev?.id === n.id ? null : n)}
                                        onInit={() => { }}
                                        favorites={favorites}
                                    />
                                    <CursorPosDisplay />
                                </ReactFlowProvider>

                                {/* 検索＆フィルターオーバーレイ */}
                                <div className="absolute top-4 left-4 z-10 flex gap-2">
                                    <div className="glass rounded-xl flex items-center px-3 py-2.5 gap-2.5 w-64"
                                        style={{ boxShadow: '0 8px 32px rgba(0,0,0,0.3)' }}>
                                        <Search size={15} style={{ color: 'var(--hf-accent-light)', flexShrink: 0 }} />
                                        <input
                                            className="w-full text-sm outline-none bg-transparent"
                                            style={{ color: 'var(--hf-text-primary)' }}
                                            placeholder="ノードを検索..."
                                            value={searchTerm}
                                            onChange={e => setSearchTerm(e.target.value)}
                                        />
                                    </div>

                                    {/* お気に入りフィルター */}
                                    <button
                                        onClick={() => setActiveCategory(prev => prev === 'favorites' ? 'all' : 'favorites')}
                                        className={`glass rounded-xl w-10 flex items-center justify-center transition-all duration-200 ${activeCategory === 'favorites' ? 'ring-2 ring-amber-400' : ''}`}
                                        style={{
                                            boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
                                            background: activeCategory === 'favorites' ? 'rgba(251, 191, 36, 0.2)' : undefined
                                        }}
                                        title="お気に入りのみ表示"
                                    >
                                        <Star size={16} className={activeCategory === 'favorites' ? "fill-amber-400 text-amber-400" : "text-slate-400"} />
                                    </button>
                                </div>
                            </div>
                        } />
                        <Route path="/list" element={
                            <ListView
                                nodes={nodes}
                                favorites={favorites}
                                statusMap={statusMap}
                                assigneeMap={assigneeMap}
                                onAssigneeChange={handleAssigneeChange}
                                dueDateMap={dueDateMap}
                                onDueDateChange={handleDueDateChange}
                                memoMap={memoMap}
                                onMemoChange={handleMemoChange}
                                onStatusChange={handleStatusChange}
                            />
                        } />
                        <Route path="/about" element={<AboutView />} />
                        <Route path="/manual" element={<ManualView />} />
                    </Routes>

                    {/* ========== 詳細モーダル ========== */}
                    {selectedNode && (
                        <NodeDetailModal
                            selectedNode={selectedNode}
                            onClose={() => setSelectedNode(null)}
                            statusMap={statusMap}
                            assigneeMap={assigneeMap}
                            dueDateMap={dueDateMap}
                            memoMap={memoMap}
                            favorites={favorites}
                            onStatusChange={handleStatusChange}
                            onAssigneeChange={handleAssigneeChange}
                            onDueDateChange={handleDueDateChange}
                            onMemoChange={handleMemoChange}
                            onToggleFav={handleToggleFav}
                        />
                    )}

                    {/* AI解析モーダル */}
                    <AIAnalysisModal
                        isOpen={isAIModalOpen}
                        onClose={() => setIsAIModalOpen(false)}
                        nodes={nodes}
                        statusMap={statusMap}
                        assigneeMap={assigneeMap}
                        dueDateMap={dueDateMap}
                        memoMap={memoMap}
                        projectName={projectName}
                    />
                </div>
            </div>
        </BrowserRouter>
    );
};

export default App;
