describe('React application', () => {
  describe('open page', () => {
    it('should display title', async () => {
      browser.get('/');
      const title = await $('h2').getText();
      expect(title).toBe('Hello World!');
    });
  });
});
