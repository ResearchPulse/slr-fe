import { Component, type ErrorInfo, type ReactNode } from "react";
import { FiAlertTriangle, FiRefreshCw, FiHome, FiChevronDown, FiChevronUp } from "react-icons/fi";

interface ErrorBoundaryProps {
  children: ReactNode;
  fallbackTitle?: string;
  fallbackMessage?: string;
  onReset?: () => void;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  showDetails: boolean;
}

export default class ErrorBoundary extends Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  state: ErrorBoundaryState = {
    hasError: false,
    error: null,
    errorInfo: null,
    showDetails: false,
  };

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("[ErrorBoundary caught an error]:", error, errorInfo);
    this.setState({ errorInfo });
  }

  handleReload = () => {
    if (this.props.onReset) {
      this.props.onReset();
    }
    this.setState({ hasError: false, error: null, errorInfo: null });
    window.location.reload();
  };

  handleGoProjects = () => {
    window.location.href = "/projects";
  };

  toggleDetails = () => {
    this.setState((prev) => ({ showDetails: !prev.showDetails }));
  };

  render() {
    if (this.state.hasError) {
      const {
        fallbackTitle = "Đã xảy ra lỗi khi hiển thị nội dung",
        fallbackMessage = "Hệ thống gặp sự cố không mong muốn khi tải trang này. Bạn có thể thử tải lại hoặc quay về danh sách dự án.",
      } = this.props;

      const errorMessage = this.state.error?.message || "Lỗi không xác định";
      const errorStack = this.state.error?.stack || "";
      const componentStack = this.state.errorInfo?.componentStack || "";

      return (
        <div className="flex min-h-[500px] w-full items-center justify-center p-6">
          <div className="w-full max-w-xl rounded-xl border border-red-200 bg-surface-white p-8 shadow-sm">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-red-100 text-red-600">
                <FiAlertTriangle className="h-6 w-6" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-text-primary">
                  {fallbackTitle}
                </h2>
                <p className="mt-1 text-sm text-text-secondary">
                  {fallbackMessage}
                </p>
              </div>
            </div>

            <div className="mt-5 rounded-lg bg-red-50/80 p-3 text-sm text-red-800 font-mono break-words border border-red-100">
              {errorMessage}
            </div>

            <div className="mt-6 flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={this.handleReload}
                className="inline-flex items-center gap-2 rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-accent/90"
              >
                <FiRefreshCw className="h-4 w-4" />
                Thử lại
              </button>
              <button
                type="button"
                onClick={this.handleGoProjects}
                className="inline-flex items-center gap-2 rounded-lg border border-border bg-surface-white px-4 py-2 text-sm font-medium text-text-primary transition-colors hover:bg-bg-secondary"
              >
                <FiHome className="h-4 w-4" />
                Về danh sách dự án
              </button>
              {(errorStack || componentStack) && (
                <button
                  type="button"
                  onClick={this.toggleDetails}
                  className="ml-auto inline-flex items-center gap-1 text-xs text-text-secondary hover:text-text-primary transition-colors"
                >
                  {this.state.showDetails ? "Ẩn chi tiết lỗi" : "Chi tiết kỹ thuật"}
                  {this.state.showDetails ? (
                    <FiChevronUp className="h-3.5 w-3.5" />
                  ) : (
                    <FiChevronDown className="h-3.5 w-3.5" />
                  )}
                </button>
              )}
            </div>

            {this.state.showDetails && (
              <div className="mt-4 max-h-60 overflow-auto rounded-lg bg-gray-900 p-4 text-xs font-mono text-gray-200">
                <div className="font-bold text-red-400 mb-1">Stack trace:</div>
                <pre className="whitespace-pre-wrap">{errorStack}</pre>
                {componentStack && (
                  <>
                    <div className="font-bold text-yellow-400 mt-3 mb-1">
                      Component stack:
                    </div>
                    <pre className="whitespace-pre-wrap">{componentStack}</pre>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
