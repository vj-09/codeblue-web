'use client';

import { useState } from 'react';
import { MessageCircle, Github, X, ExternalLink, FileText, Bug, MessageSquare } from 'lucide-react';
import FeedbackModal from './FeedbackModal';

const links = [
  {
    id: 'github',
    label: 'GitHub Repo',
    icon: Github,
    href: 'https://github.com/vj-09/codeblue-env',
    color: 'bg-gray-700 hover:bg-gray-600',
    description: 'View source code'
  },
  {
    id: 'issues',
    label: 'Report Issue',
    icon: Bug,
    href: 'https://github.com/vj-09/codeblue-env/issues',
    color: 'bg-red-600/80 hover:bg-red-600',
    description: 'Report bugs on GitHub'
  },
  {
    id: 'docs',
    label: 'Documentation',
    icon: FileText,
    href: 'https://github.com/vj-09/codeblue-env#readme',
    color: 'bg-blue-600/80 hover:bg-blue-600',
    description: 'Read the docs'
  },
];

export default function FloatingActionButton() {
  const [isOpen, setIsOpen] = useState(false);
  const [showFeedback, setShowFeedback] = useState(false);

  const handleFeedbackClick = () => {
    setIsOpen(false);
    setShowFeedback(true);
  };

  return (
    <>
      <div className="fixed bottom-6 right-6 z-50">
        {/* Menu items */}
        <div className={`absolute bottom-16 right-0 transition-all duration-300 ${
          isOpen ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 pointer-events-none'
        }`}>
          <div className="flex flex-col gap-2 items-end">
            {/* Feedback button - opens modal */}
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
                <span className="text-sm font-medium whitespace-nowrap">Send Feedback</span>
                <span className="text-[10px] text-white/70 whitespace-nowrap">Share your thoughts</span>
              </div>
              <MessageSquare className="w-5 h-5 flex-shrink-0" />
            </button>

            {/* External links */}
            {links.map((link, idx) => (
              <a
                key={link.id}
                href={link.href}
                target="_blank"
                rel="noopener noreferrer"
                className={`flex items-center gap-3 px-4 py-2.5 rounded-xl ${link.color} text-white shadow-lg transition-all duration-200 group`}
                style={{
                  transitionDelay: isOpen ? `${(idx + 1) * 50}ms` : '0ms',
                  transform: isOpen ? 'translateX(0)' : 'translateX(20px)',
                  opacity: isOpen ? 1 : 0,
                }}
              >
                <div className="flex flex-col items-end">
                  <span className="text-sm font-medium whitespace-nowrap">{link.label}</span>
                  <span className="text-[10px] text-white/70 whitespace-nowrap">{link.description}</span>
                </div>
                <link.icon className="w-5 h-5 flex-shrink-0" />
                <ExternalLink className="w-3 h-3 opacity-50 flex-shrink-0" />
              </a>
            ))}
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
