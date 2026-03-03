import { useRef } from 'react';
import { Node } from '@xyflow/react';
import {
    StatusMap, AssigneeMap, DueDateMap, MemoMap,
    saveStatusToStorage, saveAssigneeToStorage,
    saveDueDateToStorage, saveMemoToStorage,
    exportStatusToExcel, importStatusFromExcel,
} from '@/utils/excelStatus';

/**
 * Excel入出力処理を管理するカスタムフック
 */
export const useExcelIO = ({
    nodes,
    statusMap, setStatusMap,
    assigneeMap, setAssigneeMap,
    dueDateMap, setDueDateMap,
    memoMap, setMemoMap,
    projectName, setProjectName,
    updateTimestamp,
    updateImportTimestamp,
    updateExportTimestamp,
}: {
    nodes: Node[];
    statusMap: StatusMap;
    setStatusMap: React.Dispatch<React.SetStateAction<StatusMap>>;
    assigneeMap: AssigneeMap;
    setAssigneeMap: React.Dispatch<React.SetStateAction<AssigneeMap>>;
    dueDateMap: DueDateMap;
    setDueDateMap: React.Dispatch<React.SetStateAction<DueDateMap>>;
    memoMap: MemoMap;
    setMemoMap: React.Dispatch<React.SetStateAction<MemoMap>>;
    projectName: string;
    setProjectName: (name: string) => void;
    updateTimestamp: () => void;
    updateImportTimestamp: () => void;
    updateExportTimestamp: () => void;
}) => {
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Excelエクスポート
    const handleExport = () => {
        exportStatusToExcel(
            nodes.map(n => ({ id: n.id, data: n.data as any })),
            statusMap,
            assigneeMap,
            dueDateMap,
            memoMap,
            projectName
        );
        updateExportTimestamp();
    };

    // Excelインポート
    const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        try {
            const {
                statusMap: newStatus,
                assigneeMap: newAssignee,
                dueDateMap: newDueDate,
                memoMap: newMemo,
                projectName: newProject
            } = await importStatusFromExcel(file);

            setStatusMap(newStatus);
            saveStatusToStorage(newStatus);

            setAssigneeMap(newAssignee);
            saveAssigneeToStorage(newAssignee);

            setDueDateMap(newDueDate);
            saveDueDateToStorage(newDueDate);

            setMemoMap(newMemo || {});
            saveMemoToStorage(newMemo || {});

            if (newProject) {
                setProjectName(newProject);
                localStorage.setItem('heliosflow_project', newProject);
            }
            updateImportTimestamp();
            updateTimestamp();
            alert('インポートが完了しました');
        } catch (err: any) {
            console.error(err);
            alert('インポートに失敗しました: ' + err.message);
        }

        if (e.target) e.target.value = '';
    };

    return {
        fileInputRef,
        handleExport,
        handleImport,
    };
};
