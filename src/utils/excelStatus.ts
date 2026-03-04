import * as XLSX from 'xlsx';
import { NODE_STATUSES, CATEGORY_LABELS } from '@/constants';

// ステータスマップの型: { [nodeId]: statusKey }
export type StatusMap = Record<string, string>;

// 担当者割り当ての型: { [nodeId]: assigneeName }
export type AssigneeMap = Record<string, string>;

// 期日の型: { [nodeId]: dateString(YYYY-MM-DD or undefined) }
export type DueDateMap = Record<string, string>;

// メモの型: { [nodeId]: memoText }
export type MemoMap = Record<string, string>;

// ローカルストレージのキー
const LS_KEY_STATUS = 'heliosflow_status';
const LS_KEY_ASSIGNEE = 'heliosflow_assignee';
const LS_KEY_DUEDATE = 'heliosflow_duedate';
const LS_KEY_MEMO = 'heliosflow_memo';

/**
 * ローカルストレージからステータスを読み込む
 */
export const loadStatusFromStorage = (): StatusMap => {
    try {
        const raw = localStorage.getItem(LS_KEY_STATUS);
        return raw ? JSON.parse(raw) : {};
    } catch {
        return {};
    }
};

/**
 * ローカルストレージから担当者を読み込む
 */
export const loadAssigneeFromStorage = (): AssigneeMap => {
    try {
        const raw = localStorage.getItem(LS_KEY_ASSIGNEE);
        return raw ? JSON.parse(raw) : {};
    } catch {
        return {};
    }
};

/**
 * ローカルストレージから期日を読み込む
 */
export const loadDueDateFromStorage = (): DueDateMap => {
    try {
        const raw = localStorage.getItem(LS_KEY_DUEDATE);
        return raw ? JSON.parse(raw) : {};
    } catch {
        return {};
    }
};

/**
 * ローカルストレージにステータスを保存する
 */
export const saveStatusToStorage = (statusMap: StatusMap): void => {
    localStorage.setItem(LS_KEY_STATUS, JSON.stringify(statusMap));
};

/**
 * ローカルストレージに担当者を保存する
 */
export const saveAssigneeToStorage = (assigneeMap: AssigneeMap): void => {
    localStorage.setItem(LS_KEY_ASSIGNEE, JSON.stringify(assigneeMap));
};

/**
 * ローカルストレージに期日を保存する
 */
export const saveDueDateToStorage = (dueDateMap: DueDateMap): void => {
    localStorage.setItem(LS_KEY_DUEDATE, JSON.stringify(dueDateMap));
};

/**
 * ローカルストレージからメモを読み込む
 */
export const loadMemoFromStorage = (): MemoMap => {
    try {
        const raw = localStorage.getItem(LS_KEY_MEMO);
        return raw ? JSON.parse(raw) : {};
    } catch {
        return {};
    }
};

/**
 * ローカルストレージにメモを保存する
 */
export const saveMemoToStorage = (memoMap: MemoMap): void => {
    localStorage.setItem(LS_KEY_MEMO, JSON.stringify(memoMap));
};



/**
 * ノードデータをExcelファイルとしてエクスポートする
 */
export const exportStatusToExcel = (
    nodes: Array<{ id: string; data: any }>,
    statusMap: StatusMap,
    assigneeMap: AssigneeMap,
    dueDateMap: DueDateMap,
    memoMap: MemoMap,
    projectName: string
): void => {
    // 案件名行
    const titleRow = ['案件名', projectName, '', '', '', '', ''];
    // 更新日行
    const dateRow = ['更新日', new Date().toLocaleString('ja-JP', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' }), '', '', '', '', ''];
    // 空行
    const emptyRow = ['', '', '', '', '', '', ''];
    // ヘッダー行
    const header = ['ID', 'タイトル', 'カテゴリ', 'ステータス', '担当者', '期日', 'メモ'];

    // データ行（junction以外のノードのみ）
    const rows = nodes
        .filter(n => n.data.category !== 'junction')
        .map(n => [
            n.id,
            n.data.label,
            CATEGORY_LABELS[n.data.category] || n.data.category,
            NODE_STATUSES[statusMap[n.id] || 'pending']?.label || '未着手',
            assigneeMap[n.id] || '',
            dueDateMap[n.id] || '',
            memoMap[n.id] || ''
        ]);

    // ワークシート作成
    const ws = XLSX.utils.aoa_to_sheet([titleRow, dateRow, emptyRow, header, ...rows]);

    // 列幅の設定
    ws['!cols'] = [
        { wch: 10 },  // ID
        { wch: 30 },  // タイトル
        { wch: 15 },  // カテゴリ
        { wch: 12 },  // ステータス
        { wch: 15 },  // 担当者
        { wch: 12 },  // 期日
        { wch: 40 },  // メモ
    ];

    // ワークブック作成・ダウンロード
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'ステータス管理');

    // YYYYMMDD形式の日付文字列生成
    const d = new Date();
    const yyyymmdd = `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}`;
    const hhmm = `${String(d.getHours()).padStart(2, '0')}${String(d.getMinutes()).padStart(2, '0')}`;

    let fileName = '';
    if (projectName) {
        // ファイル名として不適切な文字を置換
        const safeProjectName = projectName.replace(/[\\/:*?"<>|]/g, '_');
        fileName = `${safeProjectName}_${yyyymmdd}${hhmm}.xlsx`;
    } else {
        fileName = `${yyyymmdd}${hhmm}.xlsx`;
    }

    XLSX.writeFile(wb, fileName);
};

/**
 * Excelファイルからステータスをインポートする
 */
export const importStatusFromExcel = (file: File): Promise<{ statusMap: StatusMap; assigneeMap: AssigneeMap; dueDateMap: DueDateMap; memoMap: MemoMap; projectName: string }> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const data = new Uint8Array(e.target?.result as ArrayBuffer);
                const wb = XLSX.read(data, { type: 'array' });

                // 最初のシートを取得
                const ws = wb.Sheets[wb.SheetNames[0]];
                const rows: any[][] = XLSX.utils.sheet_to_json(ws, { header: 1 });

                // 案件名 (B1セル想定: 行インデックス0, 列インデックス1)
                const projectName = rows.length > 0 && rows[0].length > 1 ? String(rows[0][1]) : '';

                const statusMap: StatusMap = {};
                const assigneeMap: AssigneeMap = {};
                const dueDateMap: DueDateMap = {};
                const memoMap: MemoMap = {};

                // ヘッダー行を探す ('ID'が含まれる行)
                let headerIndex = -1;
                for (let i = 0; i < Math.min(rows.length, 10); i++) {
                    if (rows[i] && rows[i][0] === 'ID') {
                        headerIndex = i;
                        break;
                    }
                }

                if (headerIndex === -1) {
                    throw new Error('有効なヘッダー行(ID列)が見つかりません');
                }

                // データ行の読み込み
                for (let i = headerIndex + 1; i < rows.length; i++) {
                    const row = rows[i];
                    if (!row || !row[0]) continue;

                    const id = String(row[0]);

                    // ステータス (D列: index 3)
                    const statusLabel = row[3];
                    if (statusLabel) {
                        const entry = Object.entries(NODE_STATUSES).find(([, v]) => v.label === statusLabel);
                        if (entry) {
                            statusMap[id] = entry[0];
                        }
                    }

                    // 担当者 (E列: index 4)
                    const assignee = row[4];
                    if (assignee) {
                        assigneeMap[id] = String(assignee);
                    }

                    // 期日 (F列: index 5)
                    const dueDate = row[5];
                    if (dueDate) {
                        dueDateMap[id] = String(dueDate);
                    }

                    // メモ (G列: index 6)
                    const memo = row[6];
                    if (memo) {
                        memoMap[id] = String(memo);
                    }
                }

                resolve({ statusMap, assigneeMap, dueDateMap, memoMap, projectName });
            } catch (err) {
                console.error(err);
                reject(err);
            }
        };
        reader.onerror = () => reject(new Error('ファイルの読み込みに失敗しました。'));
        reader.readAsArrayBuffer(file);
    });
};
