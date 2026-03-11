import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Volume2, VolumeX, Music, Zap } from 'lucide-react';
import { audioManager } from '@/lib/audioManager';

interface Props {
    compact?: boolean;
}

export default function AudioControls({ compact = false }: Props) {
    const [muted, setMuted] = useState(audioManager.isMuted);
    const [open, setOpen] = useState(false);
    const [bgmVol, setBgmVol] = useState(Math.round(audioManager.bgmVolumeLevel * 100));
    const [sfxVol, setSfxVol] = useState(Math.round(audioManager.sfxVolumeLevel * 100));

    function toggleMute() {
        const next = !muted;
        audioManager.setMuted(next);
        setMuted(next);
        if (!next) audioManager.playSFX('click');
    }

    function handleBGM(val: number) {
        setBgmVol(val);
        audioManager.setBGMVolume(val / 100);
    }

    function handleSFX(val: number) {
        setSfxVol(val);
        audioManager.setSFXVolume(val / 100);
        audioManager.playSFX('click');
    }

    if (compact) {
        return (
            <div className="relative">
                <button
                    onClick={() => { toggleMute(); setOpen(false); }}
                    onContextMenu={e => { e.preventDefault(); setOpen(v => !v); }}
                    className="w-8 h-8 rounded-lg flex items-center justify-center transition-all"
                    style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)' }}
                    aria-label={muted ? '음소거 해제' : '음소거'}
                    title="클릭: 음소거 토글 / 우클릭: 볼륨 조절"
                >
                    {muted
                        ? <VolumeX size={14} style={{ color: 'rgba(167,139,250,0.4)' }} />
                        : <Volume2 size={14} style={{ color: '#a78bfa' }} />
                    }
                </button>

                <AnimatePresence>
                    {open && (
                        <>
                            <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
                            <motion.div
                                initial={{ opacity: 0, y: -6, scale: 0.95 }}
                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                exit={{ opacity: 0, y: -6, scale: 0.95 }}
                                className="absolute right-0 top-10 z-50 rounded-2xl p-4 min-w-[190px]"
                                style={{ background: '#1a1035', border: '1px solid rgba(124,58,237,0.3)', boxShadow: '0 10px 30px rgba(0,0,0,0.5)' }}
                            >
                                <p className="text-xs font-bold text-white mb-3">🎵 오디오 설정</p>

                                {/* BGM */}
                                <div className="mb-3">
                                    <div className="flex items-center justify-between text-xs mb-1">
                                        <div className="flex items-center gap-1" style={{ color: 'rgba(196,181,253,0.7)' }}>
                                            <Music size={10} /> BGM
                                        </div>
                                        <span style={{ color: '#a78bfa' }}>{bgmVol}%</span>
                                    </div>
                                    <input type="range" min={0} max={100} value={bgmVol}
                                        onChange={e => handleBGM(Number(e.target.value))}
                                        className="w-full h-1.5 rounded-full appearance-none cursor-pointer"
                                        style={{ accentColor: '#7c3aed' }}
                                    />
                                </div>

                                {/* SFX */}
                                <div className="mb-3">
                                    <div className="flex items-center justify-between text-xs mb-1">
                                        <div className="flex items-center gap-1" style={{ color: 'rgba(196,181,253,0.7)' }}>
                                            <Zap size={10} /> 효과음
                                        </div>
                                        <span style={{ color: '#fbbf24' }}>{sfxVol}%</span>
                                    </div>
                                    <input type="range" min={0} max={100} value={sfxVol}
                                        onChange={e => handleSFX(Number(e.target.value))}
                                        className="w-full h-1.5 rounded-full appearance-none cursor-pointer"
                                        style={{ accentColor: '#fbbf24' }}
                                    />
                                </div>

                                {/* Mute toggle */}
                                <button
                                    onClick={toggleMute}
                                    className="w-full py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all"
                                    style={{
                                        background: muted ? 'rgba(244,63,94,0.15)' : 'rgba(124,58,237,0.15)',
                                        color: muted ? '#f43f5e' : '#a78bfa',
                                        border: `1px solid ${muted ? 'rgba(244,63,94,0.3)' : 'rgba(124,58,237,0.3)'}`,
                                    }}
                                >
                                    {muted ? <><VolumeX size={12} /> 음소거 해제</> : <><VolumeX size={12} /> 전체 음소거</>}
                                </button>
                            </motion.div>
                        </>
                    )}
                </AnimatePresence>
            </div>
        );
    }

    // Full version (settings page)
    return (
        <div className="rounded-2xl p-5" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(139,92,246,0.15)' }}>
            <h3 className="font-black text-white mb-5 flex items-center gap-2">
                <Volume2 size={16} style={{ color: '#a78bfa' }} /> 오디오 설정
            </h3>
            <div className="space-y-4">
                <div>
                    <div className="flex justify-between text-sm mb-2 text-white">
                        <span className="flex items-center gap-1"><Music size={13} /> BGM 볼륨</span>
                        <span style={{ color: '#a78bfa' }}>{bgmVol}%</span>
                    </div>
                    <input type="range" min={0} max={100} value={bgmVol}
                        onChange={e => handleBGM(Number(e.target.value))}
                        className="w-full h-2 rounded-full appearance-none cursor-pointer"
                        style={{ accentColor: '#7c3aed' }} />
                </div>
                <div>
                    <div className="flex justify-between text-sm mb-2 text-white">
                        <span className="flex items-center gap-1"><Zap size={13} /> 효과음 볼륨</span>
                        <span style={{ color: '#fbbf24' }}>{sfxVol}%</span>
                    </div>
                    <input type="range" min={0} max={100} value={sfxVol}
                        onChange={e => handleSFX(Number(e.target.value))}
                        className="w-full h-2 rounded-full appearance-none cursor-pointer"
                        style={{ accentColor: '#fbbf24' }} />
                </div>
                <motion.button
                    whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
                    onClick={toggleMute}
                    className="w-full py-3 rounded-xl font-bold flex items-center justify-center gap-2"
                    style={{
                        background: muted ? 'rgba(244,63,94,0.12)' : 'rgba(124,58,237,0.12)',
                        color: muted ? '#f43f5e' : '#a78bfa',
                        border: `1px solid ${muted ? 'rgba(244,63,94,0.25)' : 'rgba(124,58,237,0.25)'}`,
                    }}
                >
                    {muted
                        ? <><Volume2 size={15} /> 음소거 해제</>
                        : <><VolumeX size={15} /> 전체 음소거</>
                    }
                </motion.button>
            </div>
        </div>
    );
}
