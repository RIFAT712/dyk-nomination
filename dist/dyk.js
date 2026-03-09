// <nowiki>
/**
 * UI components for the DYK nomination tool.
 */
const getDYKApp = (require, initialState) => {
    const { ref, reactive, computed, watch, nextTick, onMounted } = require('vue');
    const {
        CdxDialog, CdxButton, CdxTextInput, CdxTextArea,
        CdxSelect, CdxField, CdxProgressBar, CdxIcon
    } = require('@wikimedia/codex');

    return {
        template: `
            <cdx-dialog
                v-if="visible"
                :title="title"
                :open="visible"
                close-button-label="বন্ধ করুন"
                @update:open="close"
                size="large"
                class="dyk-custom-dialog"
            >
                <div class="dyk-form">
                    <!-- Article and Nominator section -->
                    <div class="dyk-form-section">
                        <cdx-field :status="errors.article ? 'error' : 'default'" :messages="errors.article ? { error: errors.article } : {}">
                            <template #label>নিবন্ধের নাম</template>
                            <cdx-text-input 
                                v-model="form.article" 
                                :disabled="isNamespace0"
                                placeholder="নিবন্ধের নাম প্রদান করুন..."
                                :start-icon="icons.cdxIconSearch"
                                @input="handleArticleInput"
                            />
                            <div v-if="suggestions.length && !isNamespace0" class="dyk-suggestions">
                                <div 
                                    v-for="s in suggestions" 
                                    :key="s" 
                                    @click="selectSuggestion(s)"
                                    class="dyk-suggestion-item"
                                >
                                    {{ s }}
                                </div>
                            </div>
                        </cdx-field>

                        <cdx-field>
                            <template #label>মনোনয়নকারীর নাম</template>
                            <cdx-text-input v-model="form.nominator" disabled :start-icon="icons.cdxIconUserAvatar" />
                        </cdx-field>

                        <cdx-field>
                            <template #label>নিবন্ধের অবস্থা</template>
                            <cdx-select
                                v-model:selected="form.status"
                                :menu-items="statusOptions"
                                class="dyk-full-width"
                            />
                        </cdx-field>
                    </div>

                    <!-- Image and caption section -->
                    <div class="dyk-form-section">
                        <cdx-field :status="errors.image ? 'error' : 'default'" :messages="errors.image ? { error: errors.image } : {}">
                            <template #label>ছবি প্রদান করুন (ঐচ্ছিক)</template>
                            <cdx-text-input 
                                v-model="form.image" 
                                placeholder="উদাহরণ: Example.jpg"
                                :start-icon="icons.cdxIconImage"
                            />
                        </cdx-field>

                        <cdx-field>
                            <template #label>ছবির শিরোনাম</template>
                            <cdx-text-input 
                                v-model="form.caption" 
                                :disabled="!form.image"
                                placeholder="ছবির সংক্ষিপ্ত শিরোনাম বা বর্ণনা লিখুন..."
                                :start-icon="icons.cdxIconEdit"
                            />
                        </cdx-field>
                    </div>

                    <!-- Hooks section -->
                    <div class="dyk-hooks-section">
                        <div class="dyk-hooks-header">
                            <label style="font-weight: bold; color: #202122;">ভুক্তি (Hooks)</label>
                            <span :style="{ color: remainingChars < 0 ? '#d33' : '#72777d', fontSize: '12px', fontWeight: 'bold' }">
                                {{ bDigits(remainingChars) }} অক্ষর অবশিষ্ট
                            </span>
                        </div>
                        
                        <cdx-text-area
                            v-model="form.mainHook"
                            placeholder="মূল ভুক্তি লিখুন..."
                            :rows="2"
                            autosize
                            class="dyk-full-width"
                        />

                        <div v-for="(hook, index) in form.altHooks" :key="index" class="dyk-alt-hook">
                            <cdx-text-area
                                v-model="form.altHooks[index]"
                                :placeholder="'বিকল্প ভুক্তি ' + bDigits(index + 1) + ' লিখুন...'"
                                :rows="1"
                                autosize
                                class="dyk-full-width"
                            />
                            <cdx-button action="destructive" weight="quiet" @click="removeAltHook(index)" title="মুছে ফেলুন" class="dyk-remove-btn">
                                <cdx-icon :icon="icons.cdxIconTrash"></cdx-icon>
                            </cdx-button>
                        </div>

                        <cdx-button 
                            v-if="form.altHooks.length < 4" 
                            @click="addAltHook"
                            style="margin-top: 12px;"
                            :disabled="!form.mainHook"
                            weight="quiet"
                            class="dyk-add-btn"
                        >
                            <cdx-icon :icon="icons.cdxIconAdd"></cdx-icon>
                            বিকল্প ভুক্তি যোগ করুন
                        </cdx-button>
                    </div>

                    <!-- Loading state indicator -->
                    <div v-if="loading" class="dyk-loading">
                        <cdx-progress-bar />
                        <p style="color: #72777d; margin-top: 8px;">অনুগ্রহ করে অপেক্ষা করুন...</p>
                    </div>

                    <!-- Live preview section -->
                    <div v-if="previewHtml" class="dyk-preview-container">
                        <div class="dyk-preview-label">
                            <cdx-icon :icon="icons.cdxIconEye" size="small" style="margin-right: 8px;"></cdx-icon>
                            প্রাকদর্শন:
                        </div>
                        <div class="dyk-preview mw-parser-output" v-html="previewHtml"></div>
                    </div>
                </div>

                <!-- Footer with action buttons -->
                <template #footer>
                    <div class="dyk-footer-container">
                        <div class="dyk-footer-left">
                            <cdx-button @click="openMainPage" class="dyk-secondary-btn">
                                <cdx-icon :icon="icons.cdxIconHelpNotice"></cdx-icon>
                                নির্দেশিকা
                            </cdx-button>
                            <cdx-button 
                                @click="handlePreview" 
                                :disabled="loading || !form.article || !form.mainHook" 
                                class="dyk-secondary-btn"
                            >
                                <cdx-icon :icon="icons.cdxIconArticle"></cdx-icon>
                                প্রাকদর্শন
                            </cdx-button>
                        </div>
                        <div class="dyk-footer-right">
                            <cdx-button 
                                @click="handleSubmit" 
                                action="progressive" 
                                weight="primary" 
                                :disabled="loading || !form.article || !form.mainHook" 
                                class="dyk-submit-btn"
                            >
                                <cdx-icon :icon="icons.cdxIconCheck"></cdx-icon>
                                জমা দিন
                            </cdx-button>
                        </div>
                    </div>
                </template>
            </cdx-dialog>
        `,
        components: {
            CdxDialog, CdxButton, CdxTextInput, CdxTextArea, CdxSelect, CdxField, CdxProgressBar, CdxIcon
        },
        setup() {
            const visible = ref(false);
            const loading = ref(false);
            const previewHtml = ref('');
            const suggestions = ref([]);
            const title = "আজাকি মনোনয়ন";
            const isNamespace0 = ref(initialState.isNamespace0);
            const icons = reactive({});

            const form = reactive({
                article: initialState.article || '',
                nominator: initialState.userName || '',
                status: 'নতুন',
                image: '',
                caption: '',
                mainHook: '',
                altHooks: []
            });

            const errors = reactive({ article: '', image: '' });
            const statusOptions = [{ value: 'নতুন', label: 'নতুন' }, { value: 'বর্ধিত', label: 'বর্ধিত' }];
            const bDigits = DYKCore.toBengaliDigits;

            function open(article) {
                visible.value = true;
                if (article) form.article = article;
            }

            // Load icons from the MediaWiki API on mount.
            onMounted(async () => {
                const api = new mw.Api({ userAgent: 'DYKNominationTool/1.0.0' });
                const iconNames = [
                    'cdxIconSearch', 'cdxIconUserAvatar', 'cdxIconArticle',
                    'cdxIconImage', 'cdxIconEdit', 'cdxIconAdd', 'cdxIconTrash',
                    'cdxIconHelpNotice', 'cdxIconEye', 'cdxIconCheck'
                ];
                const data = await api.get({ action: 'query', list: 'codexicons', names: iconNames });
                Object.assign(icons, data.query.codexicons);
            });

            // Calculate how many characters are left for the hook.
            const remainingChars = computed(() => {
                const MAX = 200;
                const stripWikitext = (t) => t.replace(/\[\[(?:[^\|\]]*\|)?([^\]]+)\]\]/g, '$1');
                const len = stripWikitext(form.mainHook).length;
                return MAX - len;
            });

            watch(() => form.mainHook, (newVal) => { if (!newVal.trim()) previewHtml.value = ''; });

            function close() { visible.value = false; reset(); }

            function reset() {
                if (!isNamespace0.value) form.article = '';
                form.image = ''; form.caption = ''; form.mainHook = ''; form.altHooks = [];
                previewHtml.value = ''; suggestions.value = [];
            }

            async function handleArticleInput() {
                if (!isNamespace0.value && form.article.length > 2) suggestions.value = await DYKCore.fetchSuggestions(form.article);
                else suggestions.value = [];
            }

            function selectSuggestion(s) { form.article = s; suggestions.value = []; }
            function addAltHook() { if (form.altHooks.length < 4) form.altHooks.push(''); }
            function removeAltHook(index) { form.altHooks.splice(index, 1); }

            // Basic validation for the form fields.
            function validate() {
                let isValid = true;
                errors.article = ''; errors.image = '';
                if (!form.article.trim()) { errors.article = 'নিবন্ধের নাম প্রয়োজনীয়'; isValid = false; }
                if (form.image.trim()) {
                    const ext = form.image.split('.').pop().toLowerCase();
                    if (!['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'].includes(ext)) {
                        errors.image = 'অবৈধ ছবির ফরম্যাট'; isValid = false;
                    }
                }
                return isValid && form.mainHook.trim() !== '';
            }

            // Generate wikitext and fetch its HTML preview.
            async function handlePreview() {
                if (!validate()) return;
                loading.value = true;
                try {
                    const creator = await DYKCore.getArticleCreator(form.article);
                    const wikitext = DYKCore.generateWikitext({ ...form, articleCreator: creator });
                    previewHtml.value = await DYKCore.getPreview(wikitext, DYKCore.DYK_PAGE);
                    nextTick(() => DYKCore.fixLazyImages($('.dyk-preview')));
                } catch (e) { previewHtml.value = `<div style="color:#d33">${e.message}</div>`; }
                finally { loading.value = false; }
            }

            // Post the nomination to the wiki.
            async function handleSubmit() {
                if (!validate()) return;
                loading.value = true;
                try {
                    const creator = await DYKCore.getArticleCreator(form.article);
                    const wikitext = DYKCore.generateWikitext({ ...form, articleCreator: creator });
                    await DYKCore.postNomination(DYKCore.DYK_PAGE, wikitext, 'আজাকি মনোনয়ন যোগ করা হয়েছে');
                    mw.notify('সফলভাবে আজাকি মনোনয়ন যুক্ত হয়েছে!');
                    close();
                    if (mw.config.get('wgPageName') === DYKCore.DYK_PAGE) location.reload();
                } catch (e) { mw.notify(e.message, { type: 'error' }); }
                finally { loading.value = false; }
            }

            return {
                visible, loading, form, errors, statusOptions, title, isNamespace0,
                previewHtml, suggestions, remainingChars, bDigits, icons,
                open, close, handleArticleInput, selectSuggestion,
                addAltHook, removeAltHook, handlePreview, handleSubmit,
                openMainPage: () => window.open(mw.util.getUrl('উইকিপিডিয়া:আপনি জানেন কি'), '_blank')
            };
        }
    };
};



/**
 * Core logic for the DYK nomination tool.
 * Handles API calls, wikitext generation, and other data-related tasks.
 */

window.DYKCore = (function ($) {
    const api = new mw.Api();
    const DYK_PAGE = 'টেমপ্লেট_আলোচনা:আপনি_জানেন_কি'; //After deploying
    // const DYK_PAGE = 'User:R1F4T/খেলাঘর'; // For Testing 
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
        $container.find('.lazy-image-placeholder').each(function () {
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




(function () {
    const style = document.createElement('style');
    style.textContent = `.dyk-form { padding: 4px; }
.dyk-form-section { margin-bottom: 16px; padding-bottom: 16px; border-bottom: 1px solid #eaecf0; }
.dyk-suggestions { 
    position: absolute; background: white; border: 1px solid #a2a9b1; 
    width: 100%; z-index: 1000; max-height: 200px; overflow-y: auto;
    box-shadow: 0 2px 2px 0 rgba(0,0,0,0.25);
}
.dyk-suggestion-item { padding: 8px 12px; cursor: pointer; color: #202122; }
.dyk-suggestion-item:hover { background: #eaf3ff; color: #36c; }
.dyk-hooks-section { margin-top: 8px; }
.dyk-hooks-header { display: flex; justify-content: space-between; margin-bottom: 10px; align-items: center; }
.dyk-alt-hook { display: flex; gap: 8px; align-items: flex-start; margin-top: 10px; width: 100%; }
.dyk-remove-btn { flex-shrink: 0; }
.dyk-preview-container { 
    margin-top: 20px; border: 1px solid #a2a9b1; background: #f8f9fa; border-radius: 2px;
}
.dyk-preview-label { 
    padding: 8px 12px; background: #eaecf0; border-bottom: 1px solid #a2a9b1;
    font-weight: bold; color: #202122; font-size: 13px; display: flex; align-items: center;
}
.dyk-preview { padding: 12px; max-height: 250px; overflow-y: auto; }
.dyk-loading { text-align: center; margin: 20px 0; }
.dyk-footer-container { 
    display: flex; justify-content: space-between; align-items: center;
    width: 100%; box-sizing: border-box; padding: 4px 0;
}
.cdx-dialog__footer { padding: 8px 16px !important; }
.dyk-footer-left, .dyk-footer-right { display: flex; gap: 12px; }
.dyk-full-width { width: 100% !important; }

.dyk-secondary-btn { border: 1px solid #a2a9b1 !important; font-weight: bold !important; display: flex; align-items: center; gap: 8px; }
.dyk-submit-btn { font-weight: bold !important; padding: 0 24px !important; display: flex; align-items: center; gap: 8px; }
.dyk-add-btn { border: 1px dashed #a2a9b1 !important; width: 100%; justify-content: center; display: flex; align-items: center; gap: 8px; }

.cdx-dialog__header {
    background: #f8f9fa; border-bottom: 1px solid #eaecf0;
    padding: 8px 16px !important; display: flex !important; align-items: center !important;
    position: relative !important;
}
.cdx-dialog__header__title { 
    text-align: center; width: 100%; font-weight: bold; color: #202122;
}
.cdx-dialog .cdx-button.cdx-dialog__header__close {
    background-color: #d33 !important; color: white !important;
    border: 2px solid #b32424 !important; border-radius: 4px !important; 
    position: absolute !important; right: 8px !important; 
    width: 28px !important; height: 28px !important;
    display: flex !important; justify-content: center !important; align-items: center !important;
}
.cdx-dialog .cdx-button.cdx-dialog__header__close:hover { background-color: #b32424 !important; }
.cdx-dialog .cdx-button.cdx-dialog__header__close .cdx-button__icon { filter: brightness(0) invert(1) !important; }
`;
    document.head.appendChild(style);
})();

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


// </nowiki>
