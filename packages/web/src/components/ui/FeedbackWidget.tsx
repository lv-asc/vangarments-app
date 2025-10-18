'use client';

import React, { useState } from 'react';
import { Button } from './Button';
import { BugReportModal } from './BugReportModal';
import { apiClient } from '@/lib/api';

interface FeedbackWidgetProps {
  position?: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left';
  context?: {
    page?: string;
    feature?: string;
  };
}

interface FeedbackForm {
  type: 'general' | 'feature' | 'usability' | 'performance' | 'content' | 'support';
  rating?: number;
  title?: string;
  message: string;
  category?: string;
}

export function FeedbackWidget({ position = 'bottom-right', context }: FeedbackWidgetProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [showBugReport, setShowBugReport] = useState(false);
  const [feedbackType, setFeedbackType] = useState<'feedback' | 'bug' | null>(null);
  const [form, setForm] = useState<FeedbackForm>({
    type: 'general',
    message: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const positionClasses = {
    'bottom-right': 'bottom-4 right-4',
    'bottom-left': 'bottom-4 left-4',
    'top-right': 'top-4 right-4',
    'top-left': 'top-4 left-4',
  };

  const handleSubmitFeedback = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      await apiClient.post('/monitoring/feedback/general', {
        ...form,
        page: context?.page || window.location.pathname,
        feature: context?.feature,
      });

      setSubmitted(true);
      setTimeout(() => {
        setIsOpen(false);
        setSubmitted(false);
        setFeedbackType(null);
        setForm({ type: 'general', message: '' });
      }, 2000);
    } catch (error) {
      console.error('Failed to submit feedback:', error);
      alert('Falha ao enviar feedback. Tente novamente.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const StarRating = ({ rating, onRatingChange }: { rating?: number; onRatingChange: (rating: number) => void }) => (
    <div className="flex space-x-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          onClick={() => onRatingChange(star)}
          className={`w-6 h-6 ${
            rating && star <= rating ? 'text-yellow-400' : 'text-gray-300'
          } hover:text-yellow-400 transition-colors`}
        >
          <svg fill="currentColor" viewBox="0 0 20 20">
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
          </svg>
        </button>
      ))}
    </div>
  );

  if (submitted) {
    return (
      <div className={`fixed ${positionClasses[position]} z-50`}>
        <div className="bg-green-500 text-white px-4 py-2 rounded-lg shadow-lg">
          <div className="flex items-center space-x-2">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            <span>Feedback enviado com sucesso!</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className={`fixed ${positionClasses[position]} z-50`}>
        {!isOpen ? (
          <button
            onClick={() => setIsOpen(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white p-3 rounded-full shadow-lg transition-colors"
            title="Enviar Feedback"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
          </button>
        ) : (
          <div className="bg-white rounded-lg shadow-xl p-6 w-80 max-h-96 overflow-y-auto">
            {!feedbackType ? (
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Como podemos ajudar?
                </h3>
                <div className="space-y-3">
                  <button
                    onClick={() => setFeedbackType('feedback')}
                    className="w-full text-left p-3 rounded-lg border border-gray-200 hover:border-blue-300 hover:bg-blue-50 transition-colors"
                  >
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                        <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
                        </svg>
                      </div>
                      <div>
                        <div className="font-medium text-gray-900">Enviar Feedback</div>
                        <div className="text-sm text-gray-500">Compartilhe sua opinião</div>
                      </div>
                    </div>
                  </button>

                  <button
                    onClick={() => setShowBugReport(true)}
                    className="w-full text-left p-3 rounded-lg border border-gray-200 hover:border-red-300 hover:bg-red-50 transition-colors"
                  >
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
                        <svg className="w-4 h-4 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                        </svg>
                      </div>
                      <div>
                        <div className="font-medium text-gray-900">Reportar Problema</div>
                        <div className="text-sm text-gray-500">Encontrou um bug?</div>
                      </div>
                    </div>
                  </button>
                </div>

                <button
                  onClick={() => setIsOpen(false)}
                  className="w-full mt-4 text-gray-500 hover:text-gray-700 text-sm"
                >
                  Fechar
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmitFeedback}>
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">
                    Seu Feedback
                  </h3>
                  <button
                    type="button"
                    onClick={() => setFeedbackType(null)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                    </svg>
                  </button>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Tipo de Feedback
                    </label>
                    <select
                      value={form.type}
                      onChange={(e) => setForm(prev => ({ ...prev, type: e.target.value as any }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                    >
                      <option value="general">Geral</option>
                      <option value="feature">Sugestão de Funcionalidade</option>
                      <option value="usability">Usabilidade</option>
                      <option value="performance">Performance</option>
                      <option value="content">Conteúdo</option>
                      <option value="support">Suporte</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Como você avalia sua experiência?
                    </label>
                    <StarRating
                      rating={form.rating}
                      onRatingChange={(rating) => setForm(prev => ({ ...prev, rating }))}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Título (opcional)
                    </label>
                    <input
                      type="text"
                      value={form.title || ''}
                      onChange={(e) => setForm(prev => ({ ...prev, title: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                      placeholder="Resumo do seu feedback"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Mensagem
                    </label>
                    <textarea
                      value={form.message}
                      onChange={(e) => setForm(prev => ({ ...prev, message: e.target.value }))}
                      rows={4}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                      placeholder="Compartilhe seus pensamentos..."
                      required
                    />
                  </div>

                  <div className="flex space-x-3">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setFeedbackType(null)}
                      className="flex-1 text-sm"
                      disabled={isSubmitting}
                    >
                      Voltar
                    </Button>
                    <Button
                      type="submit"
                      className="flex-1 text-sm"
                      disabled={isSubmitting || !form.message.trim()}
                    >
                      {isSubmitting ? 'Enviando...' : 'Enviar'}
                    </Button>
                  </div>
                </div>
              </form>
            )}
          </div>
        )}
      </div>

      <BugReportModal
        isOpen={showBugReport}
        onClose={() => setShowBugReport(false)}
        context={context}
      />
    </>
  );
}