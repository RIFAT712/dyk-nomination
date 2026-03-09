/**
 * Entry point for the DYK nomination tool.
 */
(function ($) {
    mw.loader.using(['vue', '@wikimedia/codex', 'mediawiki.api', 'mediawiki.util', 'mediawiki.user']).then((require) => {
        let vm = null;

        // Initialize and mount the Vue application.
        function initApp() {
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
        }

        $(document).ready(() => {
            // Add a link in the "More" menu for articles.
            if (mw.config.get('wgNamespaceNumber') === 0) {
                const portletLink = mw.util.addPortletLink('p-cactions', '#', 'আজাকি মনোনয়ন', 'ca-dyk');
                if (portletLink) $(portletLink).on('click', (e) => { e.preventDefault(); initApp(); });
            }
            // Auto-open if the URL parameter is set or if we're on the nomination page with withJS.
            if (mw.util.getParamValue('dyk-open') === '1' || (mw.config.get('wgPageName') === DYKCore.DYK_PAGE && location.search.includes('withJS'))) {
                initApp();
            }
        });
    });
})(jQuery);

