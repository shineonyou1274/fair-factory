import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface Props {
    compact?: boolean;
}

export default function LanguageSwitcher({ compact = false }: Props) {
    const [showToast, setShowToast] = useState(false);

    useEffect(() => {
        if (showToast) {
            const timer = setTimeout(() => setShowToast(false), 2000);
            return () => clearTimeout(timer);
        }
    }, [showToast]);

    function handleClick() {
        setShowToast(true);
    }

    if (compact) {
        return (
            <div className="relative">
                <button
                    onClick={handleClick}
                    className="flex items-center gap-1 px-2 py-1.5 rounded-lg transition-all"
                    style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)' }}
                    aria-label="언어 변경"
                >
                    <span className="text-sm">🇰🇷</span>
                    <span className="text-xs font-bold text-white hidden sm:block">KO</span>
                </button>

                <AnimatePresence>
                    {showToast && (
                        <motion.div
                            initial={{ opacity: 0, y: -6, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: -6, scale: 0.95 }}
                            className="absolute right-0 top-10 z-50 rounded-xl px-4 py-2.5 whitespace-nowrap text-sm font-bold text-white"
                            style={{ background: 'rgba(124,58,237,0.9)', border: '1px solid rgba(167,139,250,0.5)', boxShadow: '0 10px 30px rgba(0,0,0,0.4)' }}
                        >
                            🌐 영어 모드 준비중
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        );
    }

    return (
        <div className="flex gap-2">
            <button
                onClick={handleClick}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold transition-all"
                style={{
                    background: 'rgba(255,255,255,0.04)',
                    border: '1px solid rgba(255,255,255,0.08)',
                    color: 'rgba(167,139,250,0.5)',
                }}
            >
                <span className="text-lg">🌐</span>
                <span>English (준비중)</span>
            </button>
        </div>
    );
}
