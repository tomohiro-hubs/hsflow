import { useState, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import { Bot, X, Sparkles } from 'lucide-react';
import { Node } from '@xyflow/react';
import { analyzeProjectStatus } from '@/utils/ai';
import { StatusMap, AssigneeMap, DueDateMap, MemoMap } from '@/utils/excelStatus';

type Props = {
    isOpen: boolean;
    onClose: () => void;
    nodes: Node[];
    statusMap: StatusMap;
    assigneeMap: AssigneeMap;
    dueDateMap: DueDateMap;
    memoMap: MemoMap;
    projectName: string;
};

const AIAnalysisModal = ({ isOpen, onClose, nodes, statusMap, assigneeMap, dueDateMap, memoMap, projectName }: Props) => {
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    // モーダルが開かれた時に自動的にAI解析をスタートする
    useEffect(() => {
        if (isOpen && !result && !loading && !error) {
            handleAnalyze();
        }
    }, [isOpen]);

    const handleAnalyze = async () => {
        setLoading(true);
        setError(null);
        try {
            const res = await analyzeProjectStatus(nodes, statusMap, assigneeMap, dueDateMap, memoMap, projectName);
            setResult(res);
        } catch (err: any) {
            setError('AIの解析中に通信エラーが発生しました。時間を置いて再度お試しください。');
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
            onClick={onClose}
        >
            <div
                className="relative w-full max-w-2xl max-h-[85vh] rounded-2xl flex flex-col shadow-2xl overflow-hidden"
                style={{ background: 'var(--hf-bg-secondary)', border: '1px solid var(--hf-border)' }}
                onClick={(e) => e.stopPropagation()}
            >
                {/* ヘッダー */}
                <div className="flex items-center justify-between px-5 py-4 border-b" style={{ borderColor: 'var(--hf-border)' }}>
                    <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-lg flex items-center justify-center text-white shadow-lg"
                            style={{ background: 'linear-gradient(135deg, #a855f7, #6366f1)' }}>
                            <Bot size={18} />
                        </div>
                        <h2 className="text-lg font-bold" style={{ color: 'var(--hf-text-primary)' }}>
                            AI プロジェクト状況解析
                        </h2>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-1.5 rounded-lg transition-colors hover:bg-slate-100/10"
                        style={{ color: 'var(--hf-text-secondary)' }}
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* ボディ（結果表示エリア） */}
                <div className="p-6 flex-1 overflow-y-auto" style={{ color: 'var(--hf-text-primary)' }}>
                    {loading ? (
                        <div className="flex flex-col items-center justify-center py-16 gap-5">
                            <Sparkles className="animate-spin" size={36} style={{ color: '#a855f7' }} />
                            <p className="text-sm font-medium animate-pulse" style={{ color: 'var(--hf-text-secondary)' }}>
                                Gemini がプロジェクトの状況を多角的に分析しています...
                            </p>
                        </div>
                    ) : error ? (
                        <div className="p-5 rounded-xl text-sm font-medium bg-red-500/10 text-red-500 border border-red-500/20 text-center shadow-inner">
                            {error}
                            <button
                                onClick={handleAnalyze}
                                className="block mx-auto mt-4 px-4 py-2 rounded-lg bg-red-500 text-white text-xs hover:bg-red-600 transition-colors shadow-md"
                            >
                                再試行する
                            </button>
                        </div>
                    ) : (
                        // 返ってきたマークダウンをきれいに表示
                        <div className="prose prose-invert max-w-none text-[14px] leading-relaxed select-text ai-content">
                            <ReactMarkdown
                                components={{
                                    h1: ({ node, ...props }) => <h3 className="text-base font-black mb-3 mt-4 text-slate-800 bg-slate-100/80 border-l-4 border-purple-500 pl-3 py-1 rounded-r-md" {...props} />,
                                    h2: ({ node, ...props }) => <h3 className="text-base font-black mb-3 mt-4 text-slate-800 bg-slate-100/80 border-l-4 border-purple-500 pl-3 py-1 rounded-r-md" {...props} />,
                                    h3: ({ node, ...props }) => <h3 className="text-base font-black mb-3 mt-4 text-slate-800 bg-slate-100/80 border-l-4 border-purple-500 pl-3 py-1 rounded-r-md" {...props} />,
                                    ul: ({ node, ...props }) => <ul className="list-disc pl-5 space-y-2 mb-4" {...props} />,
                                    strong: ({ node, ...props }) => <span className="font-bold text-purple-300" {...props} />,
                                    p: ({ node, ...props }) => <p className="mb-3 last:mb-0" {...props} />,
                                }}
                            >
                                {result}
                            </ReactMarkdown>
                        </div>
                    )}
                </div>

                {/* フッター */}
                {result && !loading && (
                    <div className="p-4 border-t flex items-center justify-between gap-4" style={{ borderColor: 'var(--hf-border)', background: 'var(--hf-bg-elevated)' }}>
                        <div className="text-[11px]" style={{ color: 'var(--hf-text-secondary)' }}>
                            ※AIは間違えることがあります。担当者は内容の確認と報告を必ず実施してください。
                        </div>
                        <div className="flex gap-2">
                            <button
                                onClick={handleAnalyze}
                                className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-colors hover:bg-slate-100/10"
                                style={{ color: 'var(--hf-text-secondary)' }}
                            >
                                <Sparkles size={14} /> 解析をやり直す
                            </button>
                            <button
                                onClick={onClose}
                                className="px-6 py-2 rounded-lg text-sm font-medium text-white transition-opacity hover:opacity-90 shadow-md"
                                style={{ background: 'linear-gradient(135deg, #a855f7, #6366f1)' }}
                            >
                                閉じる
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default AIAnalysisModal;
