/**
 * Training mode is a build-time switch. Keep it disabled for client-facing
 * builds; enable it only in a local or private field-test build.
 */
export const trainingModeEnabled = import.meta.env.VITE_TRAINING_MODE === 'true'

/** Temporary user correction UI. Set false to remove it from result screens. */
export const resultFeedbackEnabled = import.meta.env.VITE_RESULT_FEEDBACK !== 'false'

/** Send consented corrections to the private review queue when Supabase is configured. */
export const feedbackAutoUploadEnabled = import.meta.env.VITE_FEEDBACK_AUTO_UPLOAD !== 'false'
