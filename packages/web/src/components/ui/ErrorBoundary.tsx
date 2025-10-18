'use client';

import React from 'react';
import { Button } from './Button';
import { ApiError, isNetworkError, isAuthError } from '@/lib/api';
import { BugReportModal } from './BugReportModal';

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
  errorInfo?: React.ErrorInfo;
  showBugReport: boolean;
}

interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ComponentType<{ error?: Error; resetError: () => void }>;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
}

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, showBugReport: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error, showBugReport: false };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
    
    this.setState({ errorInfo });
    
    // Call custom error handler if provided
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }

    // Log to external service in production
    if (process.env.NODE_ENV === 'production') {
      // TODO: Send to error tracking service (Sentry, LogRocket, etc.)
    }
  }

  resetError = () => {
    this.setState({ hasError: false, error: undefined, errorInfo: undefined, showBugReport: false });
  };

  showBugReport = () => {
    this.setState({ showBugReport: true });
  };

  hideBugReport = () => {
    this.setState({ showBugReport: false });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        const FallbackComponent = this.props.fallback;
        return <FallbackComponent error={this.state.error} resetError={this.resetError} />;
      }

      return (
        <>
          <DefaultErrorFallback 
            error={this.state.error} 
            resetError={this.resetError}
            showBugReport={this.showBugReport}
          />
          <BugReportModal
            isOpen={this.state.showBugReport}
            onClose={this.hideBugReport}
            error={this.state.error}
            context={{
              page: window.location.pathname,
              userAction: 'Component error occurred',
            }}
          />
        </>
      );
    }

    return this.props.children;
  }
}

function DefaultErrorFallback({ 
  error, 
  resetError, 
  showBugReport 
}: { 
  error?: Error; 
  resetError: () => void;
  showBugReport?: () => void;
}) {
  const getErrorDetails = () => {
    if (error instanceof ApiError) {
      if (isNetworkError(error)) {
        return {
          title: 'Problema de Conexão',
          message: 'Não foi possível conectar ao servidor. Verifique sua conexão com a internet.',
          actionText: 'Tentar Novamente',
          showHome: true,
        };
      }

      if (isAuthError(error)) {
        return {
          title: 'Sessão Expirada',
          message: 'Sua sessão expirou. Por favor, faça login novamente.',
          actionText: 'Fazer Login',
          showHome: false,
          redirectTo: '/login',
        };
      }

      return {
        title: 'Erro do Servidor',
        message: error.message || 'Ocorreu um erro no servidor. Tente novamente em alguns instantes.',
        actionText: 'Tentar Novamente',
        showHome: true,
      };
    }

    return {
      title: 'Ops! Algo deu errado',
      message: error?.message || 'Ocorreu um erro inesperado. Tente novamente.',
      actionText: 'Tentar Novamente',
      showHome: true,
    };
  };

  const { title, message, actionText, showHome, redirectTo } = getErrorDetails();

  const handlePrimaryAction = () => {
    if (redirectTo) {
      window.location.href = redirectTo;
    } else {
      resetError();
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-6 text-center">
        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
        </div>
        
        <h2 className="text-xl font-semibold text-gray-900 mb-2">
          {title}
        </h2>
        
        <p className="text-gray-600 mb-6">
          {message}
        </p>
        
        <div className="space-y-3">
          <Button onClick={handlePrimaryAction} className="w-full">
            {actionText}
          </Button>
          
          {showHome && (
            <Button 
              variant="outline" 
              onClick={() => window.location.href = '/'}
              className="w-full"
            >
              Voltar ao Início
            </Button>
          )}

          {showBugReport && (
            <Button 
              variant="outline" 
              onClick={showBugReport}
              className="w-full"
            >
              Reportar Problema
            </Button>
          )}

          {!redirectTo && (
            <Button 
              variant="outline" 
              onClick={() => window.location.reload()}
              className="w-full"
            >
              Recarregar Página
            </Button>
          )}
        </div>
        
        {process.env.NODE_ENV === 'development' && error && (
          <details className="mt-4 text-left">
            <summary className="text-sm text-gray-500 cursor-pointer">
              Detalhes do erro (desenvolvimento)
            </summary>
            <pre className="mt-2 text-xs text-gray-600 bg-gray-100 p-2 rounded overflow-auto">
              {error.stack}
            </pre>
          </details>
        )}
      </div>
    </div>
  );
}

// Hook for handling async errors in functional components
export const useErrorHandler = () => {
  return (error: Error) => {
    // Trigger error boundary by throwing in next tick
    setTimeout(() => {
      throw error;
    }, 0);
  };
};