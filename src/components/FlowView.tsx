import { useMemo } from 'react';
import { ReactFlow, Background, Controls, MiniMap, Panel, Node, Edge } from '@xyflow/react';
import { MIN_ZOOM, CATEGORY_COLORS } from '@/constants';
import { StatusMap, AssigneeMap, DueDateMap, MemoMap } from '@/utils/excelStatus';
import CustomNode from '@/components/CustomNode';
import JunctionNode from '@/components/JunctionNode';
import { AlertTriangle } from 'lucide-react';

const FlowView = ({
    nodes, edges, statusMap, assigneeMap, dueDateMap, memoMap, onNodeClick, onInit, favorites
}: {
    nodes: Node[], edges: Edge[], statusMap: StatusMap, assigneeMap: AssigneeMap, dueDateMap: DueDateMap, memoMap: MemoMap, onNodeClick: (n: Node) => void, onInit: any, favorites: string[]
}) => {
    // ノードタイプ定義
    const nodeTypes = useMemo(() => ({ custom: CustomNode, junction: JunctionNode }), []);

    // ノードにお気に入り・ステータス情報を付与
    const nodesWithState = useMemo(() => {
        return nodes.map(n => ({
            ...n,
            type: (n.data as any).category === 'junction' ? 'junction' : 'custom',
            data: {
                ...n.data,
                isFav: favorites.includes(n.id),
                nodeStatus: statusMap[n.id] || 'pending',
                assignee: assigneeMap[n.id] || '',
                dueDate: dueDateMap[n.id] || '',
                memo: memoMap[n.id] || ''
            }
        }));
    }, [nodes, favorites, statusMap, assigneeMap, dueDateMap, memoMap]);

    // 期限切れノード抽出
    const overdueNodes = useMemo(() => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        return nodesWithState.filter(n => {
            const data = n.data as any;
            if (!data.dueDate) return false;
            // 完了・対象外は除外
            if (data.nodeStatus === 'completed' || data.nodeStatus === 'notApplicable') return false;

            try {
                const [y, m, d] = data.dueDate.split('-').map(Number);
                const due = new Date(y, m - 1, d);
                return due < today;
            } catch { return false; }
        });
    }, [nodesWithState]);

    // 期限間近ノード抽出 (あと3日以内)
    const approachingNodes = useMemo(() => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        return nodesWithState.filter(n => {
            const data = n.data as any;
            if (!data.dueDate) return false;
            // 完了・対象外は除外
            if (data.nodeStatus === 'completed' || data.nodeStatus === 'notApplicable') return false;

            try {
                const [y, m, d] = data.dueDate.split('-').map(Number);
                const due = new Date(y, m - 1, d);

                // 期限切れは除外 (due < today)
                if (due < today) return false;

                const timeDiff = due.getTime() - today.getTime();
                const diffDays = Math.ceil(timeDiff / (1000 * 3600 * 24));

                return diffDays >= 0 && diffDays <= 3;
            } catch { return false; }
        });
    }, [nodesWithState]);

    return (
        <div className="h-full w-full relative" style={{ background: 'var(--hf-bg-primary)' }}>
            <ReactFlow
                nodes={nodesWithState}
                edges={edges}
                nodeTypes={nodeTypes}
                onNodeClick={(_, node) => {
                    if (node.type !== 'junction') onNodeClick(node);
                }}
                onInit={onInit}
                fitView
                minZoom={MIN_ZOOM}
                maxZoom={2}
                defaultEdgeOptions={{
                    type: 'smoothstep',
                    animated: false,
                    style: { stroke: 'var(--hf-border-light)', strokeWidth: 2 }
                }}
                proOptions={{ hideAttribution: true }}
            >
                <Background color="var(--hf-border-light)" gap={24} size={1} />
                <Controls showInteractive={false} />
                <MiniMap
                    nodeColor={n => {
                        const cat = (n.data as any)?.category;
                        return cat ? (CATEGORY_COLORS[cat] || '#94a3b8') : '#94a3b8';
                    }}
                    nodeStrokeWidth={3}
                    maskColor="var(--hf-minimap-mask)"
                    zoomable
                    pannable
                />
                <Panel position="top-right" className="flex flex-col gap-2 items-end pointer-events-none !top-4 !right-4">
                    {/* ノード数表示 */}
                    <div className="glass rounded-lg px-3 py-1.5 text-xs font-medium pointer-events-auto" style={{ color: 'var(--hf-text-secondary)' }}>
                        <span style={{ color: 'var(--hf-accent-light)' }}>{nodes.length}</span> ノード
                        <span className="mx-1.5 opacity-30">·</span>
                        <span style={{ color: 'var(--hf-accent-light)' }}>{edges.length}</span> エッジ
                    </div>

                    {/* 期限切れアラート (赤) */}
                    {overdueNodes.map(node => (
                        <div
                            key={node.id}
                            onClick={() => onNodeClick(node)}
                            className="bg-red-500 text-white rounded-lg p-3 text-xs shadow-lg cursor-pointer hover:bg-red-600 transition-colors pointer-events-auto max-w-[240px] animate-pulse"
                            style={{ border: '1px solid rgba(255,255,255,0.3)' }}
                        >
                            <div className="font-bold truncate mb-1 flex items-center gap-1.5">
                                <AlertTriangle size={14} className="shrink-0 fill-white text-red-500" />
                                <span className="truncate">{(node.data as any).label}</span>
                            </div>
                            <div className="leading-relaxed opacity-95 text-[11px]">
                                {(() => {
                                    const data = node.data as any;
                                    const dateStr = data.dueDate as string;
                                    const [y, m, d] = dateStr.split('-').map(Number);
                                    const date = new Date(y, m - 1, d);
                                    const dayNames = ['日', '月', '火', '水', '木', '金', '土'];
                                    const day = dayNames[date.getDay()];
                                    const formattedDate = `${y}/${String(m).padStart(2, '0')}/${String(d).padStart(2, '0')} (${day})`;

                                    const today = new Date();
                                    today.setHours(0, 0, 0, 0);
                                    const diff = today.getTime() - date.getTime();
                                    const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
                                    return `${formattedDate} から ${days}日遅延しています。確認してください。`;
                                })()}
                            </div>
                        </div>
                    ))}

                    {/* 期限間近アラート (黄色) */}
                    {approachingNodes.map(node => {
                        const data = node.data as any;
                        const [y, m, d] = data.dueDate.split('-').map(Number);
                        const due = new Date(y, m - 1, d);
                        const today = new Date();
                        today.setHours(0, 0, 0, 0);
                        const diffDays = Math.ceil((due.getTime() - today.getTime()) / (1000 * 3600 * 24));

                        return (
                            <div
                                key={node.id}
                                onClick={() => onNodeClick(node)}
                                className="bg-amber-400 text-slate-900 rounded-lg p-3 text-xs shadow-lg cursor-pointer hover:bg-amber-500 transition-colors pointer-events-auto max-w-[240px] animate-pulse"
                                style={{ border: '1px solid rgba(255,255,255,0.4)' }}
                            >
                                <div className="font-bold truncate mb-1 flex items-center gap-1.5">
                                    <AlertTriangle size={14} className="shrink-0 fill-slate-900 text-amber-400" />
                                    <span className="truncate">{data.label}</span>
                                </div>
                                <div className="leading-relaxed opacity-95 font-medium">
                                    {(() => {
                                        const dateStr = data.dueDate as string;
                                        const [y, m, d] = dateStr.split('-').map(Number);
                                        const date = new Date(y, m - 1, d);
                                        const dayNames = ['日', '月', '火', '水', '木', '金', '土'];
                                        const day = dayNames[date.getDay()];
                                        const formattedDate = `${y}/${String(m).padStart(2, '0')}/${String(d).padStart(2, '0')} (${day})`;

                                        return diffDays === 0 ? (
                                            <>本日が期限の {formattedDate} です。<br />確認してください。</>
                                        ) : (
                                            <>期限まであと{diffDays}日の {formattedDate} です。<br />確認してください。</>
                                        );
                                    })()}
                                </div>
                            </div>
                        );
                    })}
                </Panel>
            </ReactFlow>
        </div>
    );
};

export default FlowView;
