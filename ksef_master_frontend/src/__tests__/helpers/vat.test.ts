import { describe, it, expect } from 'vitest'
import { calcLine, sumTotals } from '../../helpers/vat'
import type { CalcInput } from '../../helpers/vat'

describe('calcLine', () => {
    it('calculates 23% VAT correctly', () => {
        const result = calcLine({ qty: 1, priceNet: 100, vatRate: 23 })
        expect(result.net).toBe(100)
        expect(result.vat).toBe(23)
        expect(result.gross).toBe(123)
    })

    it('calculates 8% VAT correctly', () => {
        const result = calcLine({ qty: 2, priceNet: 50, vatRate: 8 })
        expect(result.net).toBe(100)
        expect(result.vat).toBe(8)
        expect(result.gross).toBe(108)
    })

    it('handles ZW rate (VAT exempt)', () => {
        const result = calcLine({ qty: 3, priceNet: 100, vatRate: 'ZW' })
        expect(result.net).toBe(300)
        expect(result.vat).toBe(0)
        expect(result.gross).toBe(300)
        expect(result.rate).toBe('ZW')
    })

    it('handles NP rate (not applicable)', () => {
        const result = calcLine({ qty: 1, priceNet: 200, vatRate: 'NP' })
        expect(result.net).toBe(200)
        expect(result.vat).toBe(0)
        expect(result.gross).toBe(200)
    })

    it('applies discount correctly', () => {
        const result = calcLine({ qty: 1, priceNet: 200, vatRate: 23, discount: 50 })
        expect(result.net).toBe(100) // 200 * 0.5
        expect(result.vat).toBe(23)
        expect(result.gross).toBe(123)
    })

    it('clamps discount to 100% maximum', () => {
        const result = calcLine({ qty: 1, priceNet: 1000, vatRate: 23, discount: 150 })
        expect(result.net).toBe(0)
        expect(result.gross).toBe(0)
    })

    it('treats negative quantity as zero', () => {
        const result = calcLine({ qty: -5, priceNet: 100, vatRate: 23 })
        expect(result.net).toBe(0)
    })

    it('rounds to 2 decimal places on real-world amounts', () => {
        // 3 × 33.33 = 99.99, not 99.990000...
        const result = calcLine({ qty: 3, priceNet: 33.33, vatRate: 23 })
        expect(result.net).toBe(99.99)
        const decimals = result.vat.toString().split('.')[1]?.length ?? 0
        expect(decimals).toBeLessThanOrEqual(2)
    })

    it('calculates 0% VAT correctly', () => {
        const result = calcLine({ qty: 10, priceNet: 15, vatRate: 0 })
        expect(result.net).toBe(150)
        expect(result.vat).toBe(0)
        expect(result.gross).toBe(150)
    })
})

describe('sumTotals', () => {
    it('sums multiple lines correctly', () => {
        const lines: CalcInput[] = [
            { qty: 1, priceNet: 100, vatRate: 23 },
            { qty: 2, priceNet: 50,  vatRate: 8 },
        ]
        const totals = sumTotals(lines)
        expect(totals.net).toBe(200)    // 100 + 100
        expect(totals.vat).toBe(31)     // 23 + 8
        expect(totals.gross).toBe(231)  // 123 + 108
    })

    it('groups by VAT rate in perRate', () => {
        const lines: CalcInput[] = [
            { qty: 1, priceNet: 100, vatRate: 23 },
            { qty: 1, priceNet: 200, vatRate: 23 },
            { qty: 1, priceNet: 100, vatRate: 8 },
        ]
        const { perRate } = sumTotals(lines)
        expect(perRate['23'].net).toBe(300)
        expect(perRate['8'].net).toBe(100)
        expect(perRate['8'].vat).toBe(8)
    })

    it('returns zeros for empty list', () => {
        const totals = sumTotals([])
        expect(totals.net).toBe(0)
        expect(totals.vat).toBe(0)
        expect(totals.gross).toBe(0)
        expect(Object.keys(totals.perRate)).toHaveLength(0)
    })

    it('handles mixed numeric and exempt rates', () => {
        const lines: CalcInput[] = [
            { qty: 1, priceNet: 100, vatRate: 23 },
            { qty: 1, priceNet: 100, vatRate: 'ZW' },
        ]
        const totals = sumTotals(lines)
        expect(totals.gross).toBe(223)
        expect(totals.perRate['ZW'].vat).toBe(0)
    })
})
