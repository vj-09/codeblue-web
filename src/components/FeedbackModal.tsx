'use client';

import { useState } from 'react';
import { X, Send, Loader2, CheckCircle } from 'lucide-react';

interface FeedbackModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultType?: 'feedback' | 'collab';
}

// Google Apps Script Web App URL
const GOOGLE_SCRIPT_URL = process.env.NEXT_PUBLIC_FEEDBACK_URL || 'https://script.google.com/macros/s/AKfycbw-Di2fd5BPywdpjwuJzTbZLKceXoeV4q19jZgcFQJSFGcGS-mafqUejl6X_5f6gfvfmA/exec';

export default function FeedbackModal({ isOpen, onClose, defaultType = 'feedback' }: FeedbackModalProps) {
  const isCollab = defaultType === 'collab';
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    type: isCollab ? 'collab' : 'feedback',
    message: '',
  });
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.message.trim()) {
      setErrorMsg('Please enter a message');
      return;
    }

    setStatus('loading');
    setErrorMsg('');

    try {
      // Send to Google Apps Script
      const response = await fetch(GOOGLE_SCRIPT_URL, {
        method: 'POST',
        mode: 'no-cors', // Required for Google Apps Script
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          timestamp: new Date().toISOString(),
          source: 'analytics-rl.com',
        }),
      });

      // no-cors mode doesn't give us response, assume success
      setStatus('success');
      setFormData({ name: '', email: '', type: 'feedback', message: '' });

      // Close after 2 seconds
      setTimeout(() => {
        onClose();
        setStatus('idle');
      }, 2000);
    } catch (error) {
      setStatus('error');
      setErrorMsg('Failed to submit. Please try again.');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative w-full max-w-md bg-gray-900 border border-gray-700 rounded-2xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-700">
          <h2 className="text-lg font-semibold text-white">
            {isCollab ? 'Work With Us' : 'Send Feedback'}
          </h2>
          <button
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-gray-800 transition-colors"
          >
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        {/* Success State */}
        {status === 'success' ? (
          <div className="p-8 text-center">
            <CheckCircle className="w-16 h-16 text-emerald-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-white mb-2">Thank you!</h3>
            <p className="text-gray-400">Your feedback has been submitted.</p>
          </div>
        ) : (
          /* Form */
          <form onSubmit={handleSubmit} className="p-4 space-y-4">
            {/* Name (optional) */}
            <div>
              <label className="block text-sm text-gray-400 mb-1">Name (optional)</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-emerald-500 transition-colors"
                placeholder="Your name"
              />
            </div>

            {/* Email (optional) */}
            <div>
              <label className="block text-sm text-gray-400 mb-1">Email (optional)</label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-emerald-500 transition-colors"
                placeholder="your@email.com"
              />
            </div>

            {/* Type */}
            <div>
              <label className="block text-sm text-gray-400 mb-1">Type</label>
              <select
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-emerald-500 transition-colors"
              >
                {isCollab ? (
                  <>
                    <option value="collab">Partnership Inquiry</option>
                    <option value="consulting">Consulting / Services</option>
                    <option value="integration">Integration Support</option>
                    <option value="enterprise">Enterprise License</option>
                  </>
                ) : (
                  <>
                    <option value="feedback">General Feedback</option>
                    <option value="bug">Bug Report</option>
                    <option value="feature">Feature Request</option>
                    <option value="question">Question</option>
                  </>
                )}
              </select>
            </div>

            {/* Message */}
            <div>
              <label className="block text-sm text-gray-400 mb-1">Message *</label>
              <textarea
                value={formData.message}
                onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                rows={4}
                className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-emerald-500 transition-colors resize-none"
                placeholder={isCollab ? "Tell us about your project or how we can help..." : "Your feedback, bug report, or question..."}
                required
              />
            </div>

            {/* Error */}
            {errorMsg && (
              <p className="text-red-400 text-sm">{errorMsg}</p>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={status === 'loading'}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-emerald-500 hover:bg-emerald-600 disabled:bg-emerald-500/50 text-white font-medium rounded-lg transition-colors"
            >
              {status === 'loading' ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <Send className="w-5 h-5" />
                  {isCollab ? 'Send Inquiry' : 'Send Feedback'}
                </>
              )}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
