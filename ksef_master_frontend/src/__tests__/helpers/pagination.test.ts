import { describe, it, expect } from 'vitest'
import { buildPageNumbers } from '../../helpers/pagination'

describe('buildPageNumbers', () => {
    it('returns all pages when total <= 7', () => {
        expect(buildPageNumbers(1, 5)).toEqual([1, 2, 3, 4, 5])
        expect(buildPageNumbers(3, 7)).toEqual([1, 2, 3, 4, 5, 6, 7])
    })

    it('shows dots on both sides when current is in the middle', () => {
        const pages = buildPageNumbers(10, 20)
        expect(pages[0]).toBe(1)
        expect(pages[1]).toBe('dots')
        expect(pages).toContain(10)
        expect(pages[pages.length - 2]).toBe('dots')
        expect(pages[pages.length - 1]).toBe(20)
    })

    it('no leading dots when current is near the start', () => {
        const pages = buildPageNumbers(2, 20)
        expect(pages[0]).toBe(1)
        expect(pages[1]).not.toBe('dots') // 2 is adjacent to 1, no gap
        expect(pages).toContain('dots')   // trailing dots still present
    })

    it('no trailing dots when current is near the end', () => {
        const pages = buildPageNumbers(19, 20)
        expect(pages[pages.length - 1]).toBe(20)
        expect(pages[pages.length - 2]).not.toBe('dots')
    })

    it('always includes first and last page', () => {
        const pages = buildPageNumbers(5, 100)
        expect(pages[0]).toBe(1)
        expect(pages[pages.length - 1]).toBe(100)
    })

    it('returns single page for total = 1', () => {
        expect(buildPageNumbers(1, 1)).toEqual([1])
    })

    it('never contains duplicate page numbers', () => {
        const pages = buildPageNumbers(4, 8)
        const numbers = pages.filter((p): p is number => p !== 'dots')
        expect(numbers).toHaveLength(new Set(numbers).size)
    })

    it('at most two dots tokens appear', () => {
        const pages = buildPageNumbers(50, 100)
        const dotsCount = pages.filter(p => p === 'dots').length
        expect(dotsCount).toBeLessThanOrEqual(2)
    })
})
