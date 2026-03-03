import { memo, useMemo } from 'react';
import { Handle, Position } from '@xyflow/react';
import { NodeData } from '@/types';
import { CATEGORY_COLORS, CATEGORY_LABELS, NODE_STATUSES } from '@/constants';
import { Star, AlertTriangle, MessageSquare, Calendar, CheckCircle } from 'lucide-react';

const CustomNode = memo(({ data, id }: { data: NodeData & { isFav?: boolean; nodeStatus?: string, assignee?: string, dueDate?: string, memo?: string }, id: string }) => {
    const color = CATEGORY_COLORS[data.category] || CATEGORY_COLORS.default;

    const isCompleted = data.nodeStatus === 'completed';
    const isGrayed = data.nodeStatus === 'notApplicable';
    const statusKey = data.nodeStatus || 'pending';
    const status = NODE_STATUSES[statusKey] || NODE_STATUSES.pending;
    const isInProgress = statusKey === 'inProgress';

    const isOverdue = useMemo(() => {
        if (!data.dueDate || isGrayed || isCompleted) return false;
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const [y, m, d] = data.dueDate.split('-').map(Number);
        const due = new Date(y, m - 1, d);
        return due < today;
    }, [data.dueDate, isGrayed, isCompleted]);

    const isApproaching = useMemo(() => {
        if (!data.dueDate || isGrayed || isOverdue || isCompleted) return false;
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const [y, m, d] = data.dueDate.split('-').map(Number);
        const due = new Date(y, m - 1, d);
        const timeDiff = due.getTime() - today.getTime();
        const diffDays = Math.ceil(timeDiff / (1000 * 3600 * 24));
        return diffDays >= 0 && diffDays <= 3;
    }, [data.dueDate, isGrayed, isOverdue, isCompleted]);

    return (
        <div
            className={`rounded-xl shadow-md border-2 border-transparent hover:shadow-lg transition-all w-[200px] group relative ${(isGrayed || isCompleted) ? 'opacity-40' : ''} ${isInProgress ? 'animate-gradient-bg' : ''}`}
            style={{
                borderColor: isOverdue ? '#ef4444' : (isApproaching ? '#f59e0b' : (isCompleted ? '#cbd5e1' : (isGrayed ? '#cbd5e1' : color))),
                borderWidth: (id === 'N-011' || id === 'N-021' || id === 'N-051' || id === 'N-058') ? '4px' : '2px',
                background: isInProgress ? 'var(--hf-progress-bg)' : 'var(--hf-node-bg)',
                filter: (isGrayed || isCompleted) ? 'grayscale(1)' : undefined,
                color: 'var(--hf-text-primary)',
                minHeight: '100px'
            }}
        >
            {/* 期限切れ点滅背景 */}
            {isOverdue && !isGrayed && <div className="absolute inset-0 rounded-xl animate-overdue-blink pointer-events-none z-0" />}

            {/* 期限間近（確認）点滅背景 */}
            {isApproaching && !isGrayed && <div className="absolute inset-0 rounded-xl animate-warning-blink pointer-events-none z-0" />}

            {/* 完了時：大きな透かしチェックマーク */}
            {isCompleted && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-0 overflow-hidden rounded-xl">
                    <CheckCircle className="text-green-500 opacity-60" size={110} strokeWidth={2} style={{ transform: 'rotate(-5deg)' }} />
                </div>
            )}

            {/* ... Handles ... */}
            {/* Top */}<Handle type="target" position={Position.Top} id="t-top" className="!bg-slate-500 !w-2 !h-2" /><Handle type="source" position={Position.Top} id="s-top" className="!bg-slate-500 !w-2 !h-2" />
            {/* Left */}<Handle type="target" position={Position.Left} id="t-left" className="!bg-slate-500 !w-2 !h-2" style={{ top: '40px' }} /><Handle type="source" position={Position.Left} id="s-left" className="!bg-slate-500 !w-2 !h-2" style={{ top: '40px' }} />
            {/* Right */}<Handle type="target" position={Position.Right} id="t-right" className="!bg-slate-500 !w-2 !h-2" style={{ top: '40px' }} /><Handle type="source" position={Position.Right} id="s-right" className="!bg-slate-500 !w-2 !h-2" style={{ top: '40px' }} />
            {/* Bottom */}<Handle type="target" position={Position.Bottom} id="t-bottom" className="!bg-slate-500 !w-2 !h-2" /><Handle type="source" position={Position.Bottom} id="s-bottom" className="!bg-slate-500 !w-2 !h-2" />

            {/* 期限切れ警告（右上） - お気に入りの左隣 */}
            {isOverdue && (
                <div className="absolute -top-3 right-6 flex items-center z-20" title={`期限切れ: ${data.dueDate}`}>
                    <div className="bg-red-500 text-white rounded-full p-1 shadow-md animate-pulse border border-white">
                        <AlertTriangle size={12} strokeWidth={3} />
                    </div>
                </div>
            )}

            {/* ID + お気に入り + メモアイコン（右上） */}
            <div className="absolute -top-3 -right-3 flex items-center gap-1.5">
                {data.memo && (
                    <div className="bg-blue-500 text-white rounded-full p-1 shadow-sm border border-white" title={data.memo}>
                        <MessageSquare size={10} strokeWidth={3} />
                    </div>
                )}
                <span className="text-[9px] font-mono px-1.5 py-0.5 rounded shadow-sm"
                    style={{ color: 'var(--hf-text-muted)', background: 'var(--hf-bg-card)', border: '1px solid var(--hf-border-light)' }}>
                    {id}
                </span>
                <div
                    className="rounded-full p-1 transition shadow-sm cursor-pointer z-10"
                    style={{ background: 'var(--hf-bg-card)', border: '1px solid var(--hf-border-light)' }}
                    onClick={(e) => {
                        e.stopPropagation();
                        const event = new CustomEvent('toggleFav', { detail: { id } });
                        window.dispatchEvent(event);
                    }}
                >
                    <Star size={17} className={data.isFav ? "fill-amber-400 text-amber-400" : "text-slate-400"} />
                </div>
            </div>

            {/* 提出書類バッジ（左上） - 特定ノードのみ */}
            {['N-011', 'N-021', 'N-051', 'N-058'].includes(id) && (
                <div className="absolute -top-3 left-0 flex items-center">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded shadow-sm bg-red-600 text-white border border-red-800">
                        提出書類
                    </span>
                </div>
            )}

            {/* コンテンツ */}
            <div className="p-3 pb-8 relative z-10"> {/* pb-8で下部にスペースを確保 */}
                <div className="flex items-center gap-2 mb-1">
                    <div className="w-2 h-2 rounded-full" style={{ background: color }} />
                    <span className="text-[10px] font-bold uppercase tracking-wider"
                        style={{ color: `${color}cc` }}>
                        {CATEGORY_LABELS[data.category] || data.category}
                    </span>
                </div>
                <div className="text-sm font-bold leading-tight mb-2"
                    style={{ color: 'var(--hf-text-primary)' }}>
                    {data.label}
                </div>

                {data.dueDate && (
                    <div className="flex items-center gap-1.5 opacity-90 transition-colors"
                        style={{ color: isOverdue ? '#f87171' : (isApproaching ? '#f59e0b' : 'var(--hf-text-secondary)') }}>
                        <Calendar size={11} className="shrink-0" />
                        <span className="text-[10px] font-mono font-bold tracking-tight">
                            {data.dueDate.replace(/-/g, '/')}
                            {(() => {
                                try {
                                    const [y, m, d] = data.dueDate.split('-').map(Number);
                                    const date = new Date(y, m - 1, d);
                                    const dayNames = ['日', '月', '火', '水', '木', '金', '土'];
                                    const day = dayNames[date.getDay()];
                                    return (
                                        <span className="ml-0.5 text-[8px] opacity-80" style={{ verticalAlign: 'middle' }}>
                                            ({day})
                                        </span>
                                    );
                                } catch { return null; }
                            })()}
                        </span>
                    </div>
                )}



                {/* ステータスバッジ（左下） */}
                <div className="absolute bottom-3 left-3 flex items-center">
                    <span
                        className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                        style={{ backgroundColor: status.bgColor, color: status.color }}
                    >
                        {status.label}
                    </span>
                </div>

                {/* 担当者（右下） */}
                {data.assignee && (
                    <div className="absolute bottom-3 right-3 flex flex-wrap gap-1 justify-end max-w-[120px] pointer-events-none">
                        {(() => {
                            // 担当者ごとの色定義
                            const ASSIGNEE_COLORS: Record<string, string> = {
                                '宮崎': '#d97706', // amber-600
                                '若林': '#db2777', // pink-600
                                '堀': '#2563eb',   // blue-600
                                '掘': '#2563eb',   // blue-600 (Typo対応)
                                '猪又': '#9333ea', // purple-600
                                'その他': '#475569', // slate-600
                            };

                            return data.assignee.split(',').filter(Boolean).map((name, i) => {
                                const trimName = name.trim();
                                const bgColor = ASSIGNEE_COLORS[trimName] || ASSIGNEE_COLORS['その他'];

                                const colorStyle = {
                                    backgroundColor: bgColor,
                                    color: '#fff',
                                    border: `1px solid ${bgColor}80` // 少し透明なボーダー
                                };

                                return (
                                    <span key={i} className="text-[8px] font-bold px-1.5 py-0.5 rounded shadow-sm truncate max-w-[50px]"
                                        style={colorStyle}>
                                        {trimName}
                                    </span>
                                );
                            });
                        })()}
                    </div>
                )}
            </div>
        </div>
    );
});

export default CustomNode;
