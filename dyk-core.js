/**
 * DYKCore.js - Core functionality for the Did You Know (DYK) nomination tool.
 * This file handles API interactions and data formatting.
 */

window.DYKCore = (function($) {
    const api = new mw.Api();

    /**
     * Parse wikitext to HTML for previewing.
     * @param {string} wikitext 
     * @param {string} title 
     * @returns {Promise<string>}
     */
    async function getPreview(wikitext, title) {
        try {
            const response = await api.post({
                action: 'parse',
                contentmodel: 'wikitext',
                text: wikitext,
                title: title,
                prop: 'text',
                format: 'json',
                pst: true,
                mobileformat: true
            });
            if (!response?.parse?.text?.['*']) {
                throw new Error('Empty result from parser');
            }
            return response.parse.text['*'];
        } catch (error) {
            console.error('Preview error:', error);
            throw error;
        }
    }

    /**
     * Fixes lazy-loaded images in the preview content.
     * @param {jQuery} $container 
     */
    function fixLazyImages($container) {
        $container.find('.lazy-image-placeholder').each(function() {
            const $placeholder = $(this);
            let src = $placeholder.attr('data-mw-src');
            if (!src) return;
            if (src.startsWith('//')) src = 'https:' + src;

            const img = new Image();
            img.src = src;
            img.width = $placeholder.attr('data-width') || '';
            img.height = $placeholder.attr('data-height') || '';
            img.className = $placeholder.attr('data-class') || '';

            const srcset = $placeholder.attr('data-mw-srcset');
            if (srcset) {
                img.setAttribute('srcset', srcset.split(',').map(s => {
                    s = s.trim();
                    return s.startsWith('//') ? 'https:' + s : s;
                }).join(', '));
            }
            $placeholder.replaceWith(img);
        });
    }

    /**
     * Get article creator (first revision user).
     * @param {string} title 
     * @returns {Promise<string>}
     */
    async function getArticleCreator(title) {
        try {
            const response = await api.get({
                action: 'query',
                titles: title,
                prop: 'revisions',
                rvprop: 'user',
                rvdir: 'newer',
                rvlimit: 1,
                formatversion: 2
            });
            const page = response.query.pages[0];
            if (page.missing) {
                throw new Error(`Page not found: ${title}`);
            }
            return page.revisions[0].user;
        } catch (error) {
            console.error('Error fetching article creator:', error);
            return mw.config.get('wgUserName'); // Fallback to current user
        }
    }

    /**
     * Generate wikitext for nomination.
     * @param {Object} data 
     * @returns {string}
     */
    function generateWikitext(data) {
        const { article, mainHook, altHooks = [], image, caption, status, nominator, articleCreator } = data;
        const isSelfNom = nominator === articleCreator;
        const imageTemplate = image.trim() ? `<div style="float:right;margin-left:0.5em;">[[File:${image}|100x100px|${caption}]]</div>` : '';
        const statusText = status === 'à¦¨à¦¤à§à¦¨' ? 'à¦•à¦°à§à¦¤à§ƒà¦• à¦ªà§à¦°à¦£à§€à¦¤ à¦¨à¦¤à§à¦¨ à¦¨à¦¿à¦¬à¦¨à§à¦§' : 'à¦¦à§à¦¬à¦¾à¦°à¦¾ à¦‰à¦²à§à¦²à§‡à¦–à¦¯à§‹à¦—à§à¦¯à¦­à¦¾à¦¬à§‡ à¦¬à¦°à§à¦§à¦¿à¦¤ à¦¨à¦¿à¦¬à¦¨à§à¦§;';
        const nominatorText = isSelfNom ? 'à¦¸à§à¦¬à¦®à¦¨à§‹à¦¨à§€à¦¤;' : `à¦®à¦¨à§‹à¦¨à¦¯à¦¼à¦¨ à¦•à¦°à§‡à¦›à§‡à¦¨ [[à¦¬à§à¦¯à¦¬à¦¹à¦¾à¦°à¦•à¦¾à¦°à§€:${nominator}|${nominator}]] ([[à¦¬à§à¦¯à¦¬à¦¹à¦¾à¦°à¦•à¦¾à¦°à§€ à¦†à¦²à¦¾à¦ª:${nominator}|à¦†à¦²à¦¾à¦ª]])`;
        
        const hooksText = [`*...${mainHook}?`, ...altHooks.map((h, i) => `${'*'.repeat(i + 2)}'''à¦¬à¦¿à¦•à¦²à§à¦ª:''' ...${h}?`)].join('\n');
        
        const footer = `-- à¦¬à§à¦¯à¦¬à¦¹à¦¾à¦°à¦•à¦¾à¦°à§€ [[à¦¬à§à¦¯à¦¬à¦¹à¦¾à¦°à¦•à¦¾à¦°à§€:${articleCreator}|${articleCreator}]] ([[à¦¬à§à¦¯à¦¬à¦¹à¦¾à¦°à¦•à¦¾à¦°à§€ à¦†à¦²à¦¾à¦ª:${articleCreator}|à¦†à¦²à¦¾à¦ª]]) ${statusText} à¦“ ${nominatorText} ~~~~~`;

        return `== ${article} ==\n${imageTemplate}\n\n${hooksText}\n\n${footer}`;
    }

    /**
     * Post the nomination to the target page.
     * @param {string} pageTitle 
     * @param {string} text 
     * @param {string} summary 
     * @returns {Promise<void>}
     */
    async function postNomination(pageTitle, text, summary) {
        try {
            const queryResponse = await api.get({
                action: 'query',
                prop: 'revisions',
                titles: pageTitle,
                rvprop: 'content',
                formatversion: 2
            });
            const page = queryResponse.query.pages[0];
            if (!page || page.missing) {
                throw new Error(`Page not found: ${pageTitle}`);
            }
            const currentContent = page.revisions[0].content || '';
            
            await api.postWithEditToken({
                action: 'edit',
                title: pageTitle,
                summary: summary,
                text: currentContent + '\n\n' + text,
                minor: true
            });
        } catch (error) {
            console.error('Post nomination error:', error);
            throw error;
        }
    }

    /**
     * Prefix search for article suggestions.
     * @param {string} query 
     * @returns {Promise<string[]>}
     */
    async function fetchSuggestions(query) {
        if (!query) return [];
        try {
            const response = await api.get({
                action: 'query',
                list: 'prefixsearch',
                pssearch: query,
                pslimit: 10,
                format: 'json'
            });
            return (response.query.prefixsearch || []).map(i => i.title);
        } catch (error) {
            console.error('Fetch suggestions error:', error);
            return [];
        }
    }

    /**
     * Helper to convert numbers to Bengali.
     * @param {number|string} num 
     * @returns {string}
     */
    function toBengaliDigits(num) {
        return num.toString().replace(/\d/g, d => 'à§¦à§§à§¨à§©à§ªà§«à§¬à§­à§®à§¯'[d]);
    }

    return {
        getPreview,
        fixLazyImages,
        getArticleCreator,
        generateWikitext,
        postNomination,
        fetchSuggestions,
        toBengaliDigits
    };

})(jQuery);
