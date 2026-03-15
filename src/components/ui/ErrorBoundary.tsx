import { Component, type ReactNode } from 'react';

interface Props {
    children: ReactNode;
    fallbackTitle?: string;
}

interface State {
    hasError: boolean;
    error: Error | null;
}

export default class ErrorBoundary extends Component<Props, State> {
    state: State = { hasError: false, error: null };

    static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error };
    }

    render() {
        if (this.state.hasError) {
            return (
                <div className="min-h-[60vh] flex items-center justify-center px-4">
                    <div className="text-center max-w-md">
                        <div className="text-5xl mb-4">⚠️</div>
                        <h2 className="text-xl font-black text-white mb-2">
                            {this.props.fallbackTitle ?? '오류가 발생했습니다'}
                        </h2>
                        <p className="text-sm mb-6" style={{ color: 'rgba(196,181,253,0.6)' }}>
                            일시적인 문제가 발생했습니다. 아래 버튼을 눌러 다시 시도해주세요.
                        </p>
                        <button
                            onClick={() => this.setState({ hasError: false, error: null })}
                            className="px-6 py-3 rounded-xl font-bold text-white text-sm transition-all hover:scale-105"
                            style={{ background: 'linear-gradient(135deg, #7c3aed, #5b21b6)', boxShadow: '0 0 20px rgba(124,58,237,0.4)' }}
                        >
                            다시 시도
                        </button>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}
