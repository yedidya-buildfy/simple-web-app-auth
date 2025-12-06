/**
 * Matching Engine Module
 * Export all matching-related functions and types
 */

export {
  // Core matching functions
  runAutoMatching,
  findPotentialMatches,
  findFuzzyMatches,
  createMatch,
  unmatchTransaction,
  getMatchStatistics,

  // Utility functions
  stringSimilarity,
  getMatchColor,

  // Types
  type MatchQuality,
  type MatchResult,
  type PotentialMatch,
  type MatchStatistics
} from './matchingEngine'
