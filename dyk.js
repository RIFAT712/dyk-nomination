/**
 * DYK.js - Entry point for the Did You Know (DYK) nomination tool.
 * Migrated to Codex and Vue 3.
 */

(function($) {
    const dependencies = [
        'vue',
        'ext.codex.v3',
        'mediawiki.api',
        'mediawiki.util',
        'mediawiki.notify',
        'mediawiki.Title'
    ];

    $(document).ready(() => {
        mw.loader.using(dependencies).then(async () => {
            const initApp = () => {
                if (typeof DYKUI !== 'undefined') {
                    DYKUI.show();
                } else {
                    console.error('DYKUI not loaded');
                }
            };

            // Add Portlet Link
            if (mw.config.get('wgNamespaceNumber') === 0) {
                const portletLink = mw.util.addPortletLink(
                    'p-cactions',
                    '#',
                    'আজাকি মনোনয়ন',
                    'ca-azaki-dyk',
                    'আজাকি মনোনয়ন ডায়ালগ খুলুন'
                );
                $(portletLink).on('click', (e) => {
                    e.preventDefault();
                    initApp();
                });
            }

            // Also check for a specific parameter to auto-open
            if (mw.util.getParamValue('azaki-dyk-open') === '1') {
                initApp();
            }
            
            // Auto-open on the nomination page if it's a new nomination
            if (mw.config.get('wgPageName') === 'টেমপ্লেট_আলোচনা:আপনি_জানেন_কি' && location.search.includes('withJS')) {
                initApp();
            }
        });
    });

})(jQuery);
