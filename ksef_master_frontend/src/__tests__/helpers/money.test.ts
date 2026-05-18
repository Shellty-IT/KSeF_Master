import { describe, it, expect } from 'vitest'
import { round2, parseNumberLike } from '../../helpers/money'

describe('round2', () => {
    it('rounds to 2 decimal places', () => {
        expect(round2(1.005)).toBe(1.01) // floating-point trap — EPSILON handles this
        expect(round2(1.004)).toBe(1.00)
        expect(round2(2.555)).toBe(2.56)
    })

    it('leaves already-rounded values unchanged', () => {
        expect(round2(100)).toBe(100)
        expect(round2(0)).toBe(0)
        expect(round2(9.99)).toBe(9.99)
    })

    it('handles negative numbers', () => {
        // EPSILON shifts -100.5 to -100.4999... → Math.round → -100 → -1.00
        expect(round2(-1.005)).toBe(-1)
        expect(round2(-100)).toBe(-100)
        expect(round2(-9.99)).toBe(-9.99)
    })
})

describe('parseNumberLike', () => {
    it('parses plain integers', () => {
        expect(parseNumberLike('100')).toBe(100)
        expect(parseNumberLike('0')).toBe(0)
    })

    it('parses floats with dot separator', () => {
        expect(parseNumberLike('1234.56')).toBe(1234.56)
    })

    it('parses floats with comma separator (Polish locale)', () => {
        expect(parseNumberLike('1234,56')).toBe(1234.56)
    })

    it('strips whitespace', () => {
        expect(parseNumberLike('  1 234,56 ')).toBe(1234.56)
    })

    it('parses negative numbers', () => {
        expect(parseNumberLike('-150,99')).toBe(-150.99)
    })

    it('returns undefined for empty string', () => {
        expect(parseNumberLike('')).toBeUndefined()
    })

    it('returns undefined for bare minus or dot', () => {
        expect(parseNumberLike('-')).toBeUndefined()
        expect(parseNumberLike('.')).toBeUndefined()
        expect(parseNumberLike('-.')).toBeUndefined()
    })

    it('returns undefined for non-numeric strings', () => {
        expect(parseNumberLike('abc')).toBeUndefined()
        expect(parseNumberLike('PLN')).toBeUndefined()
    })

    it('returns undefined for Infinity', () => {
        expect(parseNumberLike('Infinity')).toBeUndefined()
    })
})
