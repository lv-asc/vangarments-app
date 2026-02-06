// @ts-nocheck
'use client';

import React, { useState } from 'react';
import { Button } from './Button';
import { apiClient } from '@/lib/api';
import toast from 'react-hot-toast';

interface BugReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  error?: Error;
  context?: {
    page?: string;
    feature?: string;
    userAction?: string;
  };
}

interface BugReportForm {
  type: 'bug' | 'performance_issue' | 'ui_issue' | 'data_issue' | 'other';
  severity: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  description: string;
  steps: string[];
  expectedBehavior: string;
  actualBehavior: string;
}

export function BugReportModal({ isOpen, onClose, error, context }: BugReportModalProps) {
  const [form, setForm] = useState<BugReportForm>({
    type: 'bug',
    severity: 'medium',
    title: error?.message || '',
    description: '',
    steps: [''],
    expectedBehavior: '',
    actualBehavior: error?.message || '',
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Collect additional context
      const environment = {
        userAgent: navigator.userAgent,
        platform: 'web',
        url: window.location.href,
        timestamp: new Date(),
      };

      // Prepare attachments with error details
      const attachments = {
        logs: error ? [error.stack || error.message] : [],
        networkLogs: [], // Could be populated with network request logs
      };

      await apiClient.post('/monitoring/feedback/bug-report', {
        ...form,
        steps: form.steps.filter(step => step.trim()),
        environment,
        attachments,
      });

      setSubmitted(true);
      setTimeout(() => {
        onClose();
        setSubmitted(false);
      }, 2000);
    } catch (error) {
      console.error('Failed to submit bug report:', error);
      toast.error('Failed to submit bug report. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const addStep = () => {
    setForm(prev => ({
      ...prev,
      steps: [...prev.steps, ''],
    }));
  };

  const updateStep = (index: number, value: string) => {
    setForm(prev => ({
      ...prev,
      steps: prev.steps.map((step, i) => i === index ? value : step),
    }));
  };

  const removeStep = (index: number) => {
    setForm(prev => ({
      ...prev,
      steps: prev.steps.filter((_, i) => i !== index),
    }));
  };

  if (submitted) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-lg p-6 max-w-md w-full text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Report Submitted!
          </h3>
          <p className="text-gray-600">
            Thank you for reporting the issue. Our team will review and respond soon.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold text-gray-900">
            Report Issue
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Type and Severity */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Issue Type
              </label>
              <select
                value={form.type}
                onChange={(e) => setForm(prev => ({ ...prev, type: e.target.value as any }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              >
                <option value="bug">Bug/Error</option>
                <option value="performance_issue">Performance Issue</option>
                <option value="ui_issue">Interface Issue</option>
                <option value="data_issue">Data Issue</option>
                <option value="other">Other</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Severity
              </label>
              <select
                value={form.severity}
                onChange={(e) => setForm(prev => ({ ...prev, severity: e.target.value as any }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="critical">Critical</option>
              </select>
            </div>
          </div>

          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Issue Title
            </label>
            <input
              type="text"
              value={form.title}
              onChange={(e) => setForm(prev => ({ ...prev, title: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Briefly describe the problem"
              required
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Detailed Description
            </label>
            <textarea
              value={form.description}
              onChange={(e) => setForm(prev => ({ ...prev, description: e.target.value }))}
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Describe the problem in detail..."
              required
            />
          </div>

          {/* Steps to Reproduce */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Steps to Reproduce
            </label>
            {form.steps.map((step, index) => (
              <div key={index} className="flex gap-2 mb-2">
                <span className="flex-shrink-0 w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center text-sm font-medium text-gray-600">
                  {index + 1}
                </span>
                <input
                  type="text"
                  value={step}
                  onChange={(e) => updateStep(index, e.target.value)}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder={`Step ${index + 1}`}
                />
                {form.steps.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeStep(index)}
                    className="flex-shrink-0 w-8 h-8 text-red-500 hover:text-red-700"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                )}
              </div>
            ))}
            <button
              type="button"
              onClick={addStep}
              className="text-blue-600 hover:text-blue-800 text-sm font-medium"
            >
              + Add Step
            </button>
          </div>

          {/* Expected vs Actual Behavior */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Expected Behavior
              </label>
              <textarea
                value={form.expectedBehavior}
                onChange={(e) => setForm(prev => ({ ...prev, expectedBehavior: e.target.value }))}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="What should happen?"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Actual Behavior
              </label>
              <textarea
                value={form.actualBehavior}
                onChange={(e) => setForm(prev => ({ ...prev, actualBehavior: e.target.value }))}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="What actually happens?"
              />
            </div>
          </div>

          {/* Context Information */}
          {(context || error) && (
            <div className="bg-gray-50 p-4 rounded-md">
              <h4 className="text-sm font-medium text-gray-700 mb-2">
                Context Information
              </h4>
              <div className="text-sm text-gray-600 space-y-1">
                {context?.page && <div>Page: {context.page}</div>}
                {context?.feature && <div>Feature: {context.feature}</div>}
                {context?.userAction && <div>User Action: {context.userAction}</div>}
                {error && (
                  <div>
                    <div>Error: {error.message}</div>
                    {error.stack && (
                      <details className="mt-2">
                        <summary className="cursor-pointer text-blue-600">
                          View technical details
                        </summary>
                        <pre className="mt-2 text-xs bg-gray-100 p-2 rounded overflow-auto">
                          {error.stack}
                        </pre>
                      </details>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Submit Buttons */}
          <div className="flex justify-end space-x-3 pt-4 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Submitting...' : 'Submit Report'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}