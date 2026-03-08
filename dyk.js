/**
 * DYK.js - Entry point for the Did You Know (DYK) nomination tool.
 * Migrated to Codex and Vue 3.
 */

(function($) {
    const baseDependencies = [
        'vue',
        'mediawiki.api',
        'mediawiki.util',
        'mediawiki.notification',
        'mediawiki.Title'
    ];

    async function discoverAndLoadCodex() {
        const allModules = mw.loader.getModuleNames();
        
        // Priority list for Codex and Icons
        const codexCandidates = ['ext.codex.v1', 'ext.codex', '@wikimedia/codex'];
        const iconCandidates = ['ext.codex.v1.icons', 'ext.codex.icons', '@wikimedia/codex-icons'];

        const codexMod = codexCandidates.find(m => allModules.includes(m)) || 
                         allModules.find(m => m.includes('codex') && !m.includes('icons') && !m.includes('styles'));
        
        const iconMod = iconCandidates.find(m => allModules.includes(m)) || 
                        allModules.find(m => m.includes('codex') && m.includes('icons'));

        console.log('Detected modules:', { codexMod, iconMod });

        try {
            const modulesToLoad = [codexMod];
            if (iconMod) modulesToLoad.push(iconMod);
            
            await mw.loader.using(modulesToLoad);
            
            const Vue = window.Vue;
            const Codex = mw.loader.require(codexMod.startsWith('@') ? codexMod : '@wikimedia/codex');
            
            let Icons = {};
            if (iconMod) {
                try {
                    Icons = mw.loader.require(iconMod.startsWith('@') ? iconMod : '@wikimedia/codex-icons');
                } catch (e) {
                    Icons = window.CodexIcons || {};
                }
            }

            return { Vue, Codex, Icons };
        } catch (e) {
            console.error('Loader error:', e);
            return { 
                Vue: window.Vue, 
                Codex: window.Codex || window.cx, 
                Icons: window.CodexIcons || {} 
            };
        }
    }

    async function initApp() {
        // Redundant cleanup of loading messages
        const clearNotify = () => {
            $('.mw-notification').each(function() {
                if ($(this).text().includes('লোড হচ্ছে')) $(this).remove();
            });
        };
        
        clearNotify();
        if (mw.notify) {
            mw.notify('লোড হচ্ছে...', { tag: 'dyk-loading', autoHide: false });
        }
        
        try {
            await mw.loader.using(baseDependencies);
            const { Vue, Codex, Icons } = await discoverAndLoadCodex();

            if (typeof DYKUI !== 'undefined') {
                clearNotify();
                const state = {
                    article: mw.config.get('wgNamespaceNumber') === 0 ? mw.config.get('wgTitle') : '',
                    isNamespace0: mw.config.get('wgNamespaceNumber') === 0,
                    userName: mw.config.get('wgUserName') || ''
                };
                DYKUI.show(Vue, Codex, Icons, state);
            } else {
                throw new Error('DYKUI logic not found');
            }
        } catch (e) {
            console.error('Failed to load DYK tool:', e);
            clearNotify();
            if (mw.notify) mw.notify('আজাকি টুল লোড করতে সমস্যা হয়েছে।', { type: 'error' });
        }
    }

    $(document).ready(() => {
        if (mw.config.get('wgNamespaceNumber') === 0) {
            const portletLink = mw.util.addPortletLink(
                'p-cactions',
                '#',
                'আজাকি মনোনয়ন',
                'ca-dyk',
                'আজাকি মনোনয়ন ডায়ালগ খুলুন'
            );
            if (portletLink) {
                $(portletLink).on('click', (e) => {
                    e.preventDefault();
                    initApp();
                });
            }
        }
        
        if (mw.util.getParamValue('dyk-open') === '1' || 
           (mw.config.get('wgPageName') === 'টেমপ্লেট_আলোচনা:আপনি_জানেন_কি' && location.search.includes('withJS'))) {
            initApp();
        }
    });

})(jQuery);
