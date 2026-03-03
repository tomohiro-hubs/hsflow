// ========================================
// カテゴリカラー — 洗練されたプレミアムパレット
// ========================================
export const CATEGORY_COLORS: Record<string, string> = {
    contract: '#6366f1',     // インディゴ — 契約
    legal: '#f59e0b',        // アンバー — 法令
    milestone: '#ef4444',    // レッド — マイルストーン
    procurement: '#a78bfa',  // パープル — 調達
    equipment: '#22d3ee',    // シアン — 設備
    inspection: '#fb923c',   // オレンジ — 検査
    registration: '#34d399', // エメラルド — 登記
    handover: '#f472b6',     // ピンク — 引渡
    power: '#facc15',        // イエロー — 受電・運開
    waste: '#a1a1aa',        // ジンク — 廃棄物
    communication: '#38bdf8',// スカイ — 通信・監視
    construction: '#c084fc', // フクシア — 工事
    default: '#94a3b8'       // スレート — デフォルト
};

// カテゴリの日本語ラベル
export const CATEGORY_LABELS: Record<string, string> = {
    contract: '契約',
    legal: '法令',
    milestone: 'マイルストーン',
    procurement: '調達',
    equipment: '設備',
    inspection: '検査',
    registration: '登記',
    handover: '引渡',
    power: '受電・運開',
    waste: '廃棄物',
    communication: '通信・監視',
    construction: '工事',
    junction: '分岐点',
    default: 'その他'
};

// ノードのステータス定義 — ダークテーマ対応
export const NODE_STATUSES: Record<string, { label: string; color: string; bgColor: string; icon: string }> = {
    pending: { label: '未着手', color: '#94a3b8', bgColor: 'rgba(148, 163, 184, 0.12)', icon: '○' },
    inProgress: { label: '進行中', color: '#4f46e5', bgColor: 'rgba(79, 70, 229, 0.25)', icon: '◐' },
    completed: { label: '完了', color: '#22c55e', bgColor: 'rgba(34, 197, 94, 0.12)', icon: '●' },
    notApplicable: { label: '対象外', color: '#64748b', bgColor: 'rgba(100, 116, 139, 0.12)', icon: '—' },
};

export const SNAP_GRID: [number, number] = [20, 20];
export const MIN_ZOOM = 0.1;

// 担当者リスト
export const ASSIGNEES = ['宮崎', '若林', '猪又', '堀', 'その他'];
