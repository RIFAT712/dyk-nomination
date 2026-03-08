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

    // In a real GitHub-based setup, these would be the URLs to your hosted files
    const SCRIPTS = [
        'dyk-core.js',
        'dyk-ui.js'
    ];

    async function loadScripts() {
        for (const script of SCRIPTS) {
            // Use local paths for now, or full URLs if on GitHub
            await $.getScript(mw.config.get('wgExtensionAssetsPath') ? script : `/w/index.php?title=User:R1F4T/${script}&action=raw&ctype=text/javascript`);
        }
    }

    $(document).ready(() => {
        mw.loader.using(dependencies).then(async () => {
            // If we are on Wikipedia, we might need to load the other files manually 
            // if they aren't bundled.
            // For development, we assume they are already available in the global scope 
            // if this is a concatenated script, or we load them:
            
            if (typeof DYKCore === 'undefined' || typeof DYKUI === 'undefined') {
                // Try to load them from the user's subpages or a CDN
                // This part depends on how the user prefers to sync.
                // For now, let's assume the user will concatenate them or load them via loader.
            }

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
                    'à¦†à¦œà¦¾à¦•à¦¿ à¦®à¦¨à§‹à¦¨à¦¯à¦¼à¦¨',
                    'ca-azaki-dyk',
                    'Open DYK nomination dialog'
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
            if (mw.config.get('wgPageName') === 'à¦Ÿà§‡à¦®à¦ªà§à¦²à§‡à¦Ÿ_à¦†à¦²à§‹à¦šà¦¨à¦¾:à¦†à¦ªà¦¨à¦¿_à¦œà¦¾à¦¨à§‡à¦¨_à¦•à¦¿' && location.search.includes('withJS')) {
                initApp();
            }
        });
    });

})(jQuery);
