describe('Deployment Validation', () => {
    it('should have a valid configuration', () => {
        expect(process.env.NODE_ENV).toBeDefined();
    });
});
