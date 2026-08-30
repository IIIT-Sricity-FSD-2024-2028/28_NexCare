/**
 * Application Constants
 * Single source of truth for global configuration & defaults.
 */

export const DEFAULT_STAFF_PASSWORD = process.env.DEFAULT_STAFF_PASSWORD || 'NexCare@123';
export const DEFAULT_JWT_SECRET = 'nexcare_jwt_secret_key_2024_evaluation';
export const DEFAULT_SUBSCRIPTION_MONTHS = 12;
export const DEFAULT_ANNUAL_FEE = 50000;

// Billing & Transport Constants
export const FIXED_AMBULANCE_FEE = 500;
export const AMBULANCE_FEE = FIXED_AMBULANCE_FEE;
export const DEFAULT_CGST_RATE = 0.09;
export const DEFAULT_SGST_RATE = 0.09;

