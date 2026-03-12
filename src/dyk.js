/**
 * Entry point for the DYK nomination tool.
 */
(function ($) {
  // Ensure dependencies are loaded
  const dependencies = ['vue', '@wikimedia/codex', 'mediawiki.api', 'mediawiki.util', 'mediawiki.user', 'mediawiki.Title'];

  mw.loader.using(dependencies).then((require) => {
    let vm = null;

    // Initialize and mount the Vue application.
    function initApp() {
      try {
        if (!window.DYKCore) {
          console.error('DYKCore logic not loaded.');
          mw.notify('DYKCore মডিউল লোড হয়নি। অনুগ্রহ করে স্ক্রিপ্টটি আবার ইনস্টল করুন।', { type: 'error' });
          return;
        }

        if (!vm) {
          const container = document.body.appendChild(document.createElement('div'));
          container.id = 'dyk-nomination-app';
                    
          const initialState = {
            article: mw.config.get('wgNamespaceNumber') === 0 ? mw.config.get('wgTitle') : '',
            isNamespace0: mw.config.get('wgNamespaceNumber') === 0,
            userName: mw.user.getName() || mw.config.get('wgUserName') || ''
          };

          const app = require('vue').createApp(getDYKApp(require, initialState));
          vm = app.mount('#dyk-nomination-app');
        }
                
        // Open the nomination form.
        if (vm && typeof vm.open === 'function') {
          vm.open(mw.config.get('wgNamespaceNumber') === 0 ? mw.config.get('wgTitle') : '');
        }
      } catch (e) {
        console.error('DYK App Initialization Error:', e);
        mw.notify('DYK অ্যাপ চালু করতে সমস্যা হয়েছে: ' + e.message, { type: 'error' });
      }
    }

    $(document).ready(() => {
      // Add a link in the "More" menu for articles.
      if (mw.config.get('wgNamespaceNumber') === 0) {
        const portletLink = mw.util.addPortletLink('p-cactions', '#', 'আজাকি মনোনয়ন', 'ca-dyk');
        if (portletLink) {
          $(portletLink).on('click', (e) => { 
            e.preventDefault(); 
            initApp(); 
          });
        }
      }
            
      // Check if we should auto-open based on URL params or special page context
      const shouldAutoOpen = mw.util.getParamValue('dyk-open') === '1' || 
                                  (window.DYKCore && mw.config.get('wgPageName') === DYKCore.DYK_PAGE && location.search.includes('withJS'));

      if (shouldAutoOpen) {
        initApp();
      }
    });
  }).catch((e) => {
    console.error('Failed to load DYK dependencies:', e);
  });
})(jQuery);

