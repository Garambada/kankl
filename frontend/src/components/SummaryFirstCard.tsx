
import React, { useState } from 'react';

interface Layer {
    level: number;
    title: string;
    content: string;
    icon: string;
    expandable?: boolean;
}

interface Props {
    layers: Layer[];
    nextActions?: string[];
}

export const SummaryFirstCard: React.FC<Props> = ({ layers, nextActions }) => {
    const [expandedLevels, setExpandedLevels] = useState<Set<number>>(new Set([1]));

    const toggleLevel = (level: number) => {
        const newExpanded = new Set(expandedLevels);
        if (newExpanded.has(level)) {
            newExpanded.delete(level);
        } else {
            newExpanded.add(level);
        }
        setExpandedLevels(newExpanded);
    };

    return (
        <div className="space-y-4">
            {layers.map((layer) => (
                <div
                    key={layer.level}
                    className={`border transition-all duration-200 overflow-hidden ${expandedLevels.has(layer.level)
                            ? 'bg-white shadow-card border-blue-100 ring-1 ring-blue-50 sm:rounded-xl'
                            : 'bg-white/50 border-gray-200 rounded-lg hover:bg-gray-50'
                        }`}
                >
                    <div
                        className="flex items-center justify-between p-5 cursor-pointer"
                        onClick={() => layer.expandable && toggleLevel(layer.level)}
                    >
                        <div className="flex items-center space-x-3">
                            <span className="text-2xl filter drop-shadow-sm">{layer.icon}</span>
                            <h3 className={`font-semibold text-lg ${expandedLevels.has(layer.level) ? 'text-slate-800' : 'text-slate-600'
                                }`}>{layer.title}</h3>
                        </div>
                        {layer.expandable && (
                            <span className={`text-slate-400 transform transition-transform duration-200 ${expandedLevels.has(layer.level) ? 'rotate-180' : ''
                                }`}>▼</span>
                        )}
                    </div>

                    {(layer.level === 1 || expandedLevels.has(layer.level)) && (
                        <div className="px-5 pb-5 pt-0 text-slate-600 leading-relaxed border-t border-dashed border-gray-100 mt-2 pt-4">
                            {layer.content}
                        </div>
                    )}
                </div>
            ))}

            {nextActions && nextActions.length > 0 && (
                <div className="bg-gradient-to-br from-slate-50 to-white border border-slate-200 rounded-xl p-6 shadow-sm mt-6">
                    <h4 className="font-bold mb-4 text-slate-800 flex items-center">
                        <span className="w-1.5 h-6 bg-blue-600 rounded-full mr-3"></span>
                        Recommended Next Steps
                    </h4>
                    <ul className="space-y-3">
                        {nextActions.map((action, i) => (
                            <li key={i} className="flex items-start text-slate-700 bg-white p-3 rounded-lg border border-slate-100 shadow-sm">
                                <span className="text-blue-500 mr-2 mt-0.5">▪</span>
                                {action}
                            </li>
                        ))}
                    </ul>
                </div>
            )}
        </div>
    );
};
