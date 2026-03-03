import { useState, useEffect, useRef } from 'react';
import { Check, ChevronDown } from 'lucide-react';
import { ASSIGNEES } from '@/constants';

type MultiSelectAssigneeProps = {
    selected: string;   // カンマ区切りの文字列
    onChange: (val: string) => void;
    variant?: 'default' | 'compact';
};

/**
 * 複数選択可能な担当者ドロップダウンコンポーネント
 */
const MultiSelectAssignee = ({ selected, onChange, variant = 'default' }: MultiSelectAssigneeProps) => {
    const [isOpen, setIsOpen] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

    const selectedList = selected ? selected.split(',').filter(Boolean) : [];

    // クリック外で閉じる
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as globalThis.Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const toggleAssignee = (name: string) => {
        let newList;
        if (selectedList.includes(name)) {
            newList = selectedList.filter(s => s !== name);
        } else {
            newList = [...selectedList, name];
        }
        onChange(newList.join(','));
    };

    const isCompact = variant === 'compact';

    return (
        <div className={`relative ${isCompact ? 'w-32' : 'w-full'}`} ref={containerRef}>
            <div
                onClick={() => setIsOpen(!isOpen)}
                className={`flex items-center justify-between bg-transparent cursor-pointer transition-colors ${isCompact
                        ? 'px-2 py-1.5 text-xs border-b border-gray-600 hover:bg-white/5'
                        : 'px-3 py-2 text-sm border rounded-lg hover:bg-white/5'
                    }`}
                style={{
                    color: 'var(--hf-text-primary)',
                    ...(isCompact ? {} : { borderColor: 'var(--hf-border)' })
                }}
            >
                <div className={`truncate mr-1 ${isCompact ? 'h-4' : 'mr-1'}`}>
                    {selectedList.length > 0 ? selectedList.join(', ') : <span className="text-gray-500">{isCompact ? '-' : '担当者を選択...'}</span>}
                </div>
                <ChevronDown size={isCompact ? 12 : 14} className="opacity-50" />
            </div>

            {isOpen && (
                <div
                    className={`absolute top-full left-0 z-50 w-full mt-1 overflow-hidden shadow-lg ${isCompact ? 'rounded-md' : 'rounded-lg py-1'
                        }`}
                    style={{
                        background: 'var(--hf-bg-elevated)',
                        border: '1px solid var(--hf-border)'
                    }}
                >
                    {ASSIGNEES.map(name => {
                        const isSelected = selectedList.includes(name);
                        return (
                            <div
                                key={name}
                                onClick={() => toggleAssignee(name)}
                                className={`flex items-center cursor-pointer hover:bg-white/10 ${isCompact ? 'px-3 py-2 text-xs' : 'px-3 py-2 text-sm'
                                    }`}
                                style={{ color: 'var(--hf-text-primary)' }}
                            >
                                <div className={`border rounded mr-2 flex items-center justify-center transition-colors ${isCompact ? 'w-3 h-3' : 'w-4 h-4 mr-2.5'
                                    } ${isSelected ? 'bg-indigo-500 border-indigo-500' : 'border-gray-500'}`}>
                                    {isSelected && <Check size={isCompact ? 10 : 12} className="text-white" />}
                                </div>
                                {name}
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
};

export default MultiSelectAssignee;
