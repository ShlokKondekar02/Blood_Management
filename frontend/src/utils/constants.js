/**
 * Constants
 * App-wide constant values
 */

// Blood group options
export const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'];

// Urgency levels
export const URGENCY_LEVELS = [
  { value: 'critical', label: '🚨 Critical', color: '#ff1744' },
  { value: 'urgent', label: '⚠️ Urgent', color: '#ff9100' },
  { value: 'normal', label: '📋 Normal', color: '#00e676' }
];

// Request types
export const REQUEST_TYPES = [
  { value: 'self', label: 'For myself' },
  { value: 'family', label: 'For family member' },
  { value: 'friend', label: 'For friend' },
  { value: 'other', label: 'For someone else' }
];

// Quick reply options
export const QUICK_REPLIES = [
  { type: 'can_donate', label: '🩸 I can donate', color: '#DC143C' },
  { type: 'will_donate', label: '✅ I will donate', color: '#00c853' },
  { type: 'has_certificate', label: '📜 I have certificate', color: '#ff9800' },
  { type: 'contact_me', label: '📞 Contact me', color: '#2196f3' },
  { type: 'nearby', label: '📍 Available nearby', color: '#00c853' },
  { type: 'reaching_soon', label: '🚗 Reaching soon', color: '#2196f3' },
  { type: 'available_now', label: '⏰ Available now', color: '#9c27b0' }
];

// Status labels
export const STATUS_LABELS = {
  open: { label: 'Open', color: '#ff9100' },
  accepted: { label: 'Accepted', color: '#2196f3' },
  completed: { label: 'Completed', color: '#00c853' },
  cancelled: { label: 'Cancelled', color: '#757575' }
};
