'use client';

import posthog from 'posthog-js';
import { PostHogProvider as PHProvider, usePostHog } from 'posthog-js/react';
import { useEffect, useState } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';

// Page view tracker component
function PostHogPageView() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const posthogClient = usePostHog();

  useEffect(() => {
    if (pathname && posthogClient) {
      let url = window.origin + pathname;
      if (searchParams.toString()) {
        url = url + '?' + searchParams.toString();
      }
      posthogClient.capture('$pageview', { $current_url: url });
    }
  }, [pathname, searchParams, posthogClient]);

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
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    // Only initialize on client side, not localhost
    const isLocalhost = window.location.hostname === 'localhost' ||
                        window.location.hostname === '127.0.0.1';

    const posthogKey = process.env.NEXT_PUBLIC_POSTHOG_KEY;

    if (posthogKey && !isLocalhost && !posthog.__loaded) {
      posthog.init(posthogKey, {
        api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST || 'https://us.i.posthog.com',
        person_profiles: 'identified_only',
        capture_pageview: false,
        capture_pageleave: true,
        autocapture: true,
        loaded: (ph) => {
          setIsInitialized(true);
          console.log('PostHog initialized successfully');
        }
      });
    }
  }, []);

  return (
    <PHProvider client={posthog}>
      <PostHogPageView />
      {children}
    </PHProvider>
  );
}
