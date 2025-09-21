// src/components/ErrorBoundary.tsx
import React from "react";

type Props = {
  /** UI hiển thị khi có lỗi */
  fallback?: React.ReactNode;
  /** Các giá trị mà khi thay đổi thì boundary sẽ reset lỗi */
  resetKeys?: unknown[];
  /** Gọi khi boundary được reset */
  onReset?: () => void;
  children: React.ReactNode;
};

type State = { hasError: boolean };

function areArraysDifferent(a: unknown[] = [], b: unknown[] = []) {
  if (a.length !== b.length) return true;
  for (let i = 0; i < a.length; i++) {
    if (Object.is(a[i], b[i]) === false) return true;
  }
  return false;
}

export default class ErrorBoundary extends React.Component<Props, State> {
  state: State = { hasError: false };

  // Khi con ném lỗi -> cập nhật state để render fallback
  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  // Log lỗi (tùy bạn thay bằng Sentry/LogRocket…)
  componentDidCatch(error: unknown, info: React.ErrorInfo) {
    // eslint-disable-next-line no-console
    console.error("ErrorBoundary caught:", error, info);
  }

  // Nếu resetKeys thay đổi -> reset lỗi
  componentDidUpdate(prevProps: Readonly<Props>) {
    if (this.state.hasError && areArraysDifferent(prevProps.resetKeys, this.props.resetKeys)) {
      this.reset();
    }
  }

  reset = () => {
    this.setState({ hasError: false });
    this.props.onReset?.();
  };

  render() {
    if (this.state.hasError) {
      // Có fallback tùy biến -> dùng, nếu không render fallback mặc định kèm nút thử lại
      return (
        this.props.fallback ?? (
          <div className="rounded-lg border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
            Đã xảy ra lỗi.{" "}
            <button
              type="button"
              onClick={this.reset}
              className="ml-1 rounded bg-rose-600 px-2 py-1 text-white hover:bg-rose-700"
            >
              Thử lại
            </button>
          </div>
        )
      );
    }
    return this.props.children;
  }
}
