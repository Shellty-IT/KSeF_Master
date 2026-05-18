import { describe, it, expect } from 'vitest'
import { isValidNip, sanitizeNip } from '../../helpers/nip'

describe('sanitizeNip', () => {
    it('strips non-digit characters and limits to 10', () => {
        expect(sanitizeNip('526-104-08-28')).toBe('5261040828')
    })

    it('returns empty string for empty input', () => {
        expect(sanitizeNip('')).toBe('')
    })

    it('trims to 10 digits if longer', () => {
        expect(sanitizeNip('12345678901234')).toBe('1234567890')
    })

    it('handles null-like input safely', () => {
        expect(sanitizeNip(undefined as unknown as string)).toBe('')
    })
})

describe('isValidNip', () => {
    // Checksums verified manually:
    // 5261040828: 6×5+5×2+7×6+2×1+3×0+4×4+5×0+6×8+7×2 = 162, 162%11=8, d9=8 ✓
    // 1111111111: 6+5+7+2+3+4+5+6+7 = 45, 45%11=1, d9=1 ✓
    it('accepts valid NIPs with correct checksums', () => {
        expect(isValidNip('5261040828')).toBe(true)
        expect(isValidNip('1111111111')).toBe(true)
    })

    it('rejects NIP with incorrect checksum', () => {
        // 5260001228: 6×5+5×2+7×6+2×0+3×0+4×0+5×1+6×2+7×2 = 113, 113%11=3, d9=8 → mismatch
        expect(isValidNip('5260001228')).toBe(false)
        expect(isValidNip('1234567890')).toBe(false)
    })

    it('rejects NIP shorter than 10 digits', () => {
        expect(isValidNip('526104082')).toBe(false)
    })

    it('validates only first 10 digits when input is longer (sanitize truncates)', () => {
        // sanitizeNip slices to 10 — extra digits at the end are ignored.
        // '52610408290' → first 10 = '5261040829', checksum 162%11=8 ≠ d9=9 → invalid
        expect(isValidNip('52610408290')).toBe(false)
        // '52610408281' → first 10 = '5261040828', checksum 8 === d9=8 → valid
        expect(isValidNip('52610408281')).toBe(true)
    })

    it('rejects NIP with letters', () => {
        expect(isValidNip('526104082A')).toBe(false)
    })

    it('rejects empty string', () => {
        expect(isValidNip('')).toBe(false)
    })

    it('strips formatting before validating', () => {
        // dashes stripped → 5261040828 which has correct checksum
        expect(isValidNip('526-104-08-28')).toBe(true)
    })

    it('rejects NIP where weighted sum mod 11 equals 10 (forbidden by spec)', () => {
        // 9000000001: 6×9 = 54, 54%11=10 → c!==10 guard triggers → invalid
        expect(isValidNip('9000000001')).toBe(false)
    })
})
