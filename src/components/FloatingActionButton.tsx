'use client';

import { useState } from 'react';
import { MessageCircle, Github, X, ExternalLink, MessageSquare } from 'lucide-react';
import FeedbackModal from './FeedbackModal';
import { analytics } from './PostHogProvider';

export default function FloatingActionButton() {
  const [isOpen, setIsOpen] = useState(false);
  const [showFeedback, setShowFeedback] = useState(false);

  const handleFeedbackClick = () => {
    setIsOpen(false);
    setShowFeedback(true);
    analytics.feedbackOpened();
  };

  const handleGithubClick = () => {
    analytics.githubClicked('fab');
  };

  return (
    <>
      <div className="fixed bottom-6 right-6 z-50">
        {/* Menu items */}
        <div className={`absolute bottom-16 right-0 transition-all duration-300 ${
          isOpen ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 pointer-events-none'
        }`}>
          <div className="flex flex-col gap-2 items-end">
            {/* Feedback button */}
            <button
              onClick={handleFeedbackClick}
              className="flex items-center gap-3 px-4 py-2.5 rounded-xl bg-emerald-600/80 hover:bg-emerald-600 text-white shadow-lg transition-all duration-200"
              style={{
                transitionDelay: isOpen ? '0ms' : '0ms',
                transform: isOpen ? 'translateX(0)' : 'translateX(20px)',
                opacity: isOpen ? 1 : 0,
              }}
            >
              <div className="flex flex-col items-end">
                <span className="text-sm font-medium whitespace-nowrap">Feedback</span>
                <span className="text-[10px] text-white/70 whitespace-nowrap">Bugs, ideas & inquiries</span>
              </div>
              <MessageSquare className="w-5 h-5 flex-shrink-0" />
            </button>

            {/* GitHub */}
            <a
              href="https://github.com/vj-09/codeblue-env"
              target="_blank"
              rel="noopener noreferrer"
              onClick={handleGithubClick}
              className="flex items-center gap-3 px-4 py-2.5 rounded-xl bg-gray-700 hover:bg-gray-600 text-white shadow-lg transition-all duration-200"
              style={{
                transitionDelay: isOpen ? '50ms' : '0ms',
                transform: isOpen ? 'translateX(0)' : 'translateX(20px)',
                opacity: isOpen ? 1 : 0,
              }}
            >
              <div className="flex flex-col items-end">
                <span className="text-sm font-medium whitespace-nowrap">GitHub</span>
                <span className="text-[10px] text-white/70 whitespace-nowrap">View source code</span>
              </div>
              <Github className="w-5 h-5 flex-shrink-0" />
              <ExternalLink className="w-3 h-3 opacity-50 flex-shrink-0" />
            </a>
          </div>
        </div>

        {/* FAB button */}
        <button
          onClick={() => setIsOpen(!isOpen)}
          className={`w-14 h-14 rounded-full shadow-xl flex items-center justify-center transition-all duration-300 ${
            isOpen
              ? 'bg-gray-800 hover:bg-gray-700 rotate-0'
              : 'bg-gradient-to-br from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 rotate-0'
          }`}
          aria-label={isOpen ? 'Close menu' : 'Open menu'}
        >
          {isOpen ? (
            <X className="w-6 h-6 text-white" />
          ) : (
            <MessageCircle className="w-6 h-6 text-white" />
          )}
        </button>

        {/* Backdrop */}
        {isOpen && (
          <div
            className="fixed inset-0 -z-10"
            onClick={() => setIsOpen(false)}
          />
        )}
      </div>

      {/* Feedback Modal */}
      <FeedbackModal isOpen={showFeedback} onClose={() => setShowFeedback(false)} />
    </>
  );
}
