/**
 * Core logic for the DYK nomination tool.
 * Handles API calls, wikitext generation, and other data-related tasks.
 */

window.DYKCore = (function($) {
    const api = new mw.Api();
    const DYK_PAGE = 'টেমপ্লেট_আলোচনা:আপনি_জানেন_কি';

    /**
     * Parse wikitext to HTML for previewing.
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
     * Fixes lazy-loaded images in the preview.
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
     * Get article creator (the user who made the first revision).
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
                throw new Error(`নিবন্ধটি পাওয়া যায়নি: ${title}`);
            }
            return page.revisions[0].user;
        } catch (error) {
            console.error('Error fetching article creator:', error);
            return mw.config.get('wgUserName'); // Default to current user
        }
    }

    /**
     * Generate the final wikitext for the nomination.
     */
    function generateWikitext(data) {
        const { article, mainHook, altHooks = [], image, caption, status, nominator, articleCreator } = data;
        const isSelfNom = nominator === articleCreator;
        const imageTemplate = image.trim() ? `<div style="float:right;margin-left:0.5em;">[[File:${image}|100x100px|${caption}]]</div>` : '';
        const statusText = status === 'নতুন' ? 'কর্তৃক প্রণীত নতুন নিবন্ধ' : 'দ্বারা উল্লেখযোগ্যভাবে বর্ধিত নিবন্ধ;';
        const nominatorText = isSelfNom ? 'স্বমনোনীত;' : `মনোনয়ন করেছেন [[ব্যবহারকারী:${nominator}|${nominator}]] ([[ব্যবহারকারী আলাপ:${nominator}|আলাপ]])`;
        
        const hooksText = [`*...${mainHook}?`, ...altHooks.map((h, i) => `${'*'.repeat(i + 2)}'''বিকল্প:''' ...${h}?`)].join('\n');
        
        const footer = `-- ব্যবহারকারী [[ব্যবহারকারী:${articleCreator}|${articleCreator}]] ([[ব্যবহারকারী আলাপ:${articleCreator}|আলাপ]]) ${statusText} ও ${nominatorText} ~~~~~`;

        return `== ${article} ==\n${imageTemplate}\n\n${hooksText}\n\n${footer}`;
    }

    /**
     * Post the nomination to the main DYK page.
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
                throw new Error(`পাতাটি পাওয়া যায়নি: ${pageTitle}`);
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
     * Search for article titles based on user input.
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
     * Simple helper to turn English numbers into Bengali ones.
     */
    function toBengaliDigits(num) {
        return num.toString().replace(/\d/g, d => '০১২৩৪৫৬৭৮৯'[d]);
    }

    return {
        DYK_PAGE,
        getPreview,
        fixLazyImages,
        getArticleCreator,
        generateWikitext,
        postNomination,
        fetchSuggestions,
        toBengaliDigits
    };

})(jQuery);

