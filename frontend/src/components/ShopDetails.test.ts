/**
 * Apologies, but I didn't manage to write tests for this component.
 * However, here is what I would have done:
 * - ShopDetails would be a folder including ShopDetails.vue and ShopDetails.test.ts
 * - Each API request would use a fixture with example data. Ideally, fixtures would be TS files returning data so TypeScript type-checking could be applied to them as well
 * - Each component would have a Vitest + Vue Test Utils test
 * - Each DOM element that we test would have a data-test attribute with a unique name
 * - We would mock both successful and error responses from the API
 *
 * Tests:
 * .describe('ShopDetails')
 * .it('renders the component with props')
 * .it('fetches shop detail data')
 * .it('handles shop detail data API errors')
 * .it('renders all shop details')
 * * In a real-world scenario, notes would be part of a NotesPanel component and tested there, but for the purpose of this mock:
 * .it('renders the notes list')
 * .it('shows a no-notes message')
 * .it('renders the new note form')
 * .it('handles note submission')
 * .it('handles an API error for note submission')
 * .it('shows a validation message for an empty note and removes it once fixed')
 */