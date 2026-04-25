import { describe, expect, it } from 'vitest'
import { toChineseNumerals } from './chineseNumerals'

describe('toChineseNumerals', () => {
  it('maps a single digit', () => {
    expect(toChineseNumerals('0')).toBe('零')
    expect(toChineseNumerals('7')).toBe('柒')
  })

  it('maps a 4-digit pick number', () => {
    expect(toChineseNumerals('2428')).toBe('貳肆貳捌')
  })

  it('preserves leading zeros', () => {
    expect(toChineseNumerals('0042')).toBe('零零肆貳')
  })

  it('handles 5-digit overflow', () => {
    expect(toChineseNumerals('10001')).toBe('壹零零零壹')
  })

  it('returns empty string for empty input', () => {
    expect(toChineseNumerals('')).toBe('')
  })

  it('leaves non-digit characters unchanged', () => {
    expect(toChineseNumerals('a1b2')).toBe('a壹b貳')
  })
})
