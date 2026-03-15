import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, X } from 'lucide-react';
import { audioManager } from '@/lib/audioManager';

interface Props {
    title: string;
    description: React.ReactNode;
    icon?: string;
    onClose?: () => void;
    autoCloseMs?: number;
}

export default function TutorialOverlay({ title, description, icon = '✨', onClose, autoCloseMs }: Props) {
    const [isVisible, setIsVisible] = useState(true);

    useEffect(() => {
        // play a sound when tutorial pops up (only once)
        audioManager.playSFX('crystal');

        if (autoCloseMs) {
            const timer = setTimeout(() => handleClose(), autoCloseMs);
            return () => clearTimeout(timer);
        }
    }, [autoCloseMs]);

    function handleClose() {
        if (!isVisible) return;
        audioManager.playSFX('click');
        setIsVisible(false);
        if (onClose) setTimeout(onClose, 300);
    }

    return (
        <AnimatePresence>
            {isVisible && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center pointer-events-auto px-4"
                    style={{ background: 'rgba(10, 6, 24, 0.7)', backdropFilter: 'blur(5px)' }}>
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: 20 }}
                        className="relative max-w-sm w-full rounded-2xl p-6"
                        style={{
                            background: 'linear-gradient(135deg, rgba(30, 20, 60, 0.95), rgba(15, 10, 40, 0.98))',
                            border: '1px solid rgba(139, 92, 246, 0.4)',
                            boxShadow: '0 0 40px rgba(124, 58, 237, 0.2), inset 0 0 20px rgba(139, 92, 246, 0.1)'
                        }}
                    >
                        <button
                            onClick={handleClose}
                            className="absolute top-4 right-4 text-purple-400 hover:text-white transition-colors"
                        >
                            <X size={20} />
                        </button>

                        <div className="flex flex-col items-center text-center">
                            <div className="w-16 h-16 rounded-full flex items-center justify-center text-3xl mb-4"
                                style={{ background: 'rgba(124, 58, 237, 0.2)', border: '2px solid rgba(139, 92, 246, 0.5)', boxShadow: '0 0 15px rgba(124, 58, 237, 0.3)' }}
                            >
                                {icon}
                            </div>

                            <h3 className="text-xl font-black mb-2 text-white flex items-center gap-2">
                                <Sparkles size={18} className="text-purple-400" />
                                {title}
                            </h3>

                            <div className="text-sm leading-relaxed mb-6" style={{ color: 'rgba(196, 181, 253, 0.8)' }}>
                                {description}
                            </div>

                            <button
                                onClick={handleClose}
                                className="w-full py-3 rounded-xl font-bold text-white transition-all hover:scale-[1.02] active:scale-[0.98]"
                                style={{ background: 'linear-gradient(135deg, #7c3aed, #5b21b6)', boxShadow: '0 0 15px rgba(124, 58, 237, 0.4)' }}
                            >
                                미션 시작하기
                            </button>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}
