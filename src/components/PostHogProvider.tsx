'use client';

import posthog from 'posthog-js';
import { PostHogProvider as PHProvider } from 'posthog-js/react';
import { useEffect } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';

// Initialize PostHog only on client side and not on localhost
const isLocalhost = typeof window !== 'undefined' &&
  (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');

if (typeof window !== 'undefined' && process.env.NEXT_PUBLIC_POSTHOG_KEY && !isLocalhost) {
  posthog.init(process.env.NEXT_PUBLIC_POSTHOG_KEY, {
    api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST || 'https://us.i.posthog.com',
    person_profiles: 'identified_only',
    capture_pageview: false, // We'll capture manually for better control
    capture_pageleave: true,
    autocapture: true, // Auto-capture clicks, inputs, etc.
  });
}

// Page view tracker component
function PostHogPageView() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    if (pathname && posthog) {
      let url = window.origin + pathname;
      if (searchParams.toString()) {
        url = url + '?' + searchParams.toString();
      }
      posthog.capture('$pageview', { $current_url: url });
    }
  }, [pathname, searchParams]);

  return null;
}

// Custom event tracking helper
export const trackEvent = (eventName: string, properties?: Record<string, unknown>) => {
  if (typeof window !== 'undefined' && posthog) {
    posthog.capture(eventName, properties);
  }
};

// Pre-defined events for Analytics RL
export const analytics = {
  // Navigation
  tabChanged: (tab: string, page: string) =>
    trackEvent('tab_changed', { tab, page }),

  // Model interactions
  modelSelected: (model: string, context: string) =>
    trackEvent('model_selected', { model, context }),

  modelExpanded: (model: string) =>
    trackEvent('model_expanded', { model }),

  modelCompared: (models: string[]) =>
    trackEvent('models_compared', { models, count: models.length }),

  // Task/Benchmark interactions
  taskViewed: (taskId: string, dataset: string, level: string) =>
    trackEvent('task_viewed', { task_id: taskId, dataset, level }),

  trajectoryViewed: (model: string, taskId: string) =>
    trackEvent('trajectory_viewed', { model, task_id: taskId }),

  // Filters
  filterApplied: (filterType: string, value: string | string[]) =>
    trackEvent('filter_applied', { filter_type: filterType, value }),

  // Demo
  demoStarted: (scenario: string) =>
    trackEvent('demo_started', { scenario }),

  demoCompleted: (scenario: string, success: boolean) =>
    trackEvent('demo_completed', { scenario, success }),

  // Feedback
  feedbackOpened: () =>
    trackEvent('feedback_opened'),

  feedbackSubmitted: (type: string) =>
    trackEvent('feedback_submitted', { feedback_type: type }),

  // External links
  githubClicked: (source: string) =>
    trackEvent('github_clicked', { source }),

  // Theme
  themeToggled: (theme: 'light' | 'dark') =>
    trackEvent('theme_toggled', { theme }),
};

export default function PostHogProvider({ children }: { children: React.ReactNode }) {
  return (
    <PHProvider client={posthog}>
      <PostHogPageView />
      {children}
    </PHProvider>
  );
}
