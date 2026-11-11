(() => {
  let theme = 'dark';

  try {
    theme = localStorage.getItem('portfolio-theme') === 'light'
      ? 'light'
      : 'dark';
  } catch (error) {
    console.warn('Unable to read the saved portfolio theme.', error);
  }

  document.documentElement.dataset.theme = theme;

  const themeColor = document.querySelector('meta[name="theme-color"]');

  if (themeColor) {
    themeColor.content = theme === 'light' ? '#F8F9F5' : '#080808';
  }
})();
