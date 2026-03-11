import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { useUIStore } from '@/store';

const LANGUAGES = [
    { code: 'ko', label: '한국어', flag: '🇰🇷' },
    { code: 'en', label: 'English', flag: '🇺🇸' },
];

interface Props {
    compact?: boolean;  // HUD용 작은 버전
}

export default function LanguageSwitcher({ compact = false }: Props) {
    const { i18n } = useTranslation();
    const { setLanguage } = useUIStore();
    const [open, setOpen] = useState(false);

    const current = LANGUAGES.find(l => l.code === i18n.language) ?? LANGUAGES[0];

    function switchTo(code: string) {
        i18n.changeLanguage(code);
        setLanguage(code as 'ko' | 'en');
        setOpen(false);
    }

    if (compact) {
        // HUD 안에 들어가는 초소형 버전
        return (
            <div className="relative">
                <button
                    onClick={() => setOpen(v => !v)}
                    className="flex items-center gap-1 px-2 py-1.5 rounded-lg transition-all"
                    style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)' }}
                    aria-label="언어 변경"
                >
                    <span className="text-sm">{current.flag}</span>
                    <span className="text-xs font-bold text-white hidden sm:block">
                        {current.code.toUpperCase()}
                    </span>
                </button>

                <AnimatePresence>
                    {open && (
                        <>
                            <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
                            <motion.div
                                initial={{ opacity: 0, y: -6, scale: 0.95 }}
                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                exit={{ opacity: 0, y: -6, scale: 0.95 }}
                                className="absolute right-0 top-10 z-50 rounded-xl overflow-hidden min-w-[130px]"
                                style={{ background: '#1a1035', border: '1px solid rgba(124,58,237,0.3)', boxShadow: '0 10px 30px rgba(0,0,0,0.4)' }}
                            >
                                {LANGUAGES.map(lang => (
                                    <button
                                        key={lang.code}
                                        onClick={() => switchTo(lang.code)}
                                        className="w-full flex items-center gap-2 px-4 py-2.5 text-sm transition-all text-left"
                                        style={{
                                            background: lang.code === current.code ? 'rgba(124,58,237,0.2)' : 'transparent',
                                            color: lang.code === current.code ? '#fff' : 'rgba(196,181,253,0.6)',
                                        }}
                                    >
                                        <span>{lang.flag}</span>
                                        <span className="font-semibold">{lang.label}</span>
                                        {lang.code === current.code && (
                                            <span className="ml-auto text-xs" style={{ color: '#a78bfa' }}>✓</span>
                                        )}
                                    </button>
                                ))}
                            </motion.div>
                        </>
                    )}
                </AnimatePresence>
            </div>
        );
    }

    // 풀 버전 (설정 페이지 등에서 사용)
    return (
        <div className="flex gap-2">
            {LANGUAGES.map(lang => (
                <motion.button
                    key={lang.code}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => switchTo(lang.code)}
                    className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold transition-all"
                    style={{
                        background: lang.code === current.code ? 'rgba(124,58,237,0.25)' : 'rgba(255,255,255,0.04)',
                        border: `1px solid ${lang.code === current.code ? 'rgba(124,58,237,0.5)' : 'rgba(255,255,255,0.08)'}`,
                        color: lang.code === current.code ? '#fff' : 'rgba(167,139,250,0.5)',
                    }}
                >
                    <span className="text-lg">{lang.flag}</span>
                    <span>{lang.label}</span>
                </motion.button>
            ))}
        </div>
    );
}
