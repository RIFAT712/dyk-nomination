/**
 * DYK.js - Entry point for the Did You Know (DYK) nomination tool.
 */
(function ($) {
    mw.loader.using(['vue', '@wikimedia/codex', 'mediawiki.api', 'mediawiki.util', 'mediawiki.user']).then((require) => {
        let vm = null;

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
            
            // Call the open method on the mounted component instance
            if (vm && typeof vm.open === 'function') {
                vm.open(mw.config.get('wgNamespaceNumber') === 0 ? mw.config.get('wgTitle') : '');
            }
        }

        $(document).ready(() => {
            if (mw.config.get('wgNamespaceNumber') === 0) {
                const portletLink = mw.util.addPortletLink('p-cactions', '#', 'আজাকি মনোনয়ন', 'ca-dyk');
                if (portletLink) $(portletLink).on('click', (e) => { e.preventDefault(); initApp(); });
            }
            if (mw.util.getParamValue('dyk-open') === '1' || (mw.config.get('wgPageName') === 'টেমপ্লেট_আলোচনা:আপনি_জানেন_কি' && location.search.includes('withJS'))) {
                initApp();
            }
        });
    });
})(jQuery);
