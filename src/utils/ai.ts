import { Node } from '@xyflow/react';
import { StatusMap, AssigneeMap, DueDateMap, MemoMap } from './excelStatus';

// こちらにユーザー様のCloudflare Workers URLをセットします
const WORKER_URL = "https://hsflow.tomohiroyamazaki0.workers.dev/";

export const analyzeProjectStatus = async (
    nodes: Node[],
    statusMap: StatusMap,
    assigneeMap: AssigneeMap,
    dueDateMap: DueDateMap,
    memoMap: MemoMap,
    projectName: string
): Promise<string> => {
    // 現在のタスク一覧をAI向けのテキストに変換
    const taskList = nodes.map(n => {
        const id = n.id;
        const data = n.data as any;
        const title = data.label || '無題のタスク';
        const status = statusMap[id] || '未設定';
        const assignee = assigneeMap[id] || '未定';
        const dueDate = dueDateMap[id] || '未設定';
        const memo = memoMap[id] || '';

        // APIの通信量節約と分析の焦点化のため、すでに「100% (完了)」のタスクは除外して送ります
        if (status === '100%') return null;

        return `- タスク名: ${title}\n  (担当: ${assignee}, 期日: ${dueDate}, 状態: ${status})\n  説明: ${data.description || '特になし'}\n  メモ: ${memo ? memo : '特になし'}`;
    }).filter(Boolean).join('\n\n');

    const today = new Date();
    const todayStr = `${today.getFullYear()}年${today.getMonth() + 1}月${today.getDate()}日`;

    const promptValue = `今日は${todayStr}です。
以下のプロジェクト「${projectName || 'Helios Flow 案件'}」の現在のタスク状況を整理し、客観的な事実ベースで簡潔にまとめてください。

【解析の特別ルール】
各タスクの「説明」欄を確認してください。「〇ヶ月前」「〇日前」といった期限に関する具体的な条件が記載されている場合、今日の日付（${todayStr}）と、入力されている「期日」「状態」を照らし合わせてチェックしてください。
もし説明にある期限を過ぎている、または守られていない可能性がある場合は、最優先で「要注意タスク」として抽出し、理由とともに報告してください。

【報告内容】
1. 【最優先・要注意タスク】 期限切れ、または説明欄の条件（「〇日前までに」など）に照らして遅延の恐れがあるタスク
2. 【現状の進捗状況】 各担当者のメモから読み取れる、現在の具体的な進捗や課題の整理

推測や個人的なアドバイスは不要です。視覚的に非常に読みやすいMarkdown形式で出力してください。

【タスク一覧】
${taskList || '現在進行中のタスクはありません。'}`;

    try {
        const response = await fetch(WORKER_URL, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ prompt: promptValue }),
        });

        if (!response.ok) {
            const errorData = await response.json();
            console.error("AI Proxy Error details:", errorData);
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        return data.text;
    } catch (error) {
        console.error("AI解析通信失敗:", error);
        throw error;
    }
};
