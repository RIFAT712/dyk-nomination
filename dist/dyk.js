// <nowiki>
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
        const statusText = status === 'Ã Â¦Â¨Ã Â¦Â¤Ã Â§Ã Â¦Â¨' ? 'Ã Â¦â€¢Ã Â¦Â°Ã Â§Ã Â¦Â¤Ã Â§Æ’Ã Â¦â€¢ Ã Â¦ÂªÃ Â§Ã Â¦Â°Ã Â¦Â£Ã Â§â‚¬Ã Â¦Â¤ Ã Â¦Â¨Ã Â¦Â¤Ã Â§Ã Â¦Â¨ Ã Â¦Â¨Ã Â¦Â¿Ã Â¦Â¬Ã Â¦Â¨Ã Â§Ã Â¦Â§' : 'Ã Â¦Â¦Ã Â§Ã Â¦Â¬Ã Â¦Â¾Ã Â¦Â°Ã Â¦Â¾ Ã Â¦â€°Ã Â¦Â²Ã Â§Ã Â¦Â²Ã Â§â€¡Ã Â¦â€“Ã Â¦Â¯Ã Â§â€¹Ã Â¦â€”Ã Â§Ã Â¦Â¯Ã Â¦Â­Ã Â¦Â¾Ã Â¦Â¬Ã Â§â€¡ Ã Â¦Â¬Ã Â¦Â°Ã Â§Ã Â¦Â§Ã Â¦Â¿Ã Â¦Â¤ Ã Â¦Â¨Ã Â¦Â¿Ã Â¦Â¬Ã Â¦Â¨Ã Â§Ã Â¦Â§;';
        const nominatorText = isSelfNom ? 'Ã Â¦Â¸Ã Â§Ã Â¦Â¬Ã Â¦Â®Ã Â¦Â¨Ã Â§â€¹Ã Â¦Â¨Ã Â§â‚¬Ã Â¦Â¤;' : `Ã Â¦Â®Ã Â¦Â¨Ã Â§â€¹Ã Â¦Â¨Ã Â¦Â¯Ã Â¦Â¼Ã Â¦Â¨ Ã Â¦â€¢Ã Â¦Â°Ã Â§â€¡Ã Â¦â€ºÃ Â§â€¡Ã Â¦Â¨ [[Ã Â¦Â¬Ã Â§Ã Â¦Â¯Ã Â¦Â¬Ã Â¦Â¹Ã Â¦Â¾Ã Â¦Â°Ã Â¦â€¢Ã Â¦Â¾Ã Â¦Â°Ã Â§â‚¬:${nominator}|${nominator}]] ([[Ã Â¦Â¬Ã Â§Ã Â¦Â¯Ã Â¦Â¬Ã Â¦Â¹Ã Â¦Â¾Ã Â¦Â°Ã Â¦â€¢Ã Â¦Â¾Ã Â¦Â°Ã Â§â‚¬ Ã Â¦â€ Ã Â¦Â²Ã Â¦Â¾Ã Â¦Âª:${nominator}|Ã Â¦â€ Ã Â¦Â²Ã Â¦Â¾Ã Â¦Âª]])`;
        
        const hooksText = [`*...${mainHook}?`, ...altHooks.map((h, i) => `${'*'.repeat(i + 2)}'''Ã Â¦Â¬Ã Â¦Â¿Ã Â¦â€¢Ã Â¦Â²Ã Â§Ã Â¦Âª:''' ...${h}?`)].join('\n');
        
        const footer = `-- Ã Â¦Â¬Ã Â§Ã Â¦Â¯Ã Â¦Â¬Ã Â¦Â¹Ã Â¦Â¾Ã Â¦Â°Ã Â¦â€¢Ã Â¦Â¾Ã Â¦Â°Ã Â§â‚¬ [[Ã Â¦Â¬Ã Â§Ã Â¦Â¯Ã Â¦Â¬Ã Â¦Â¹Ã Â¦Â¾Ã Â¦Â°Ã Â¦â€¢Ã Â¦Â¾Ã Â¦Â°Ã Â§â‚¬:${articleCreator}|${articleCreator}]] ([[Ã Â¦Â¬Ã Â§Ã Â¦Â¯Ã Â¦Â¬Ã Â¦Â¹Ã Â¦Â¾Ã Â¦Â°Ã Â¦â€¢Ã Â¦Â¾Ã Â¦Â°Ã Â§â‚¬ Ã Â¦â€ Ã Â¦Â²Ã Â¦Â¾Ã Â¦Âª:${articleCreator}|Ã Â¦â€ Ã Â¦Â²Ã Â¦Â¾Ã Â¦Âª]]) ${statusText} Ã Â¦â€œ ${nominatorText} ~~~~~`;

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
        return num.toString().replace(/\d/g, d => 'Ã Â§Â¦Ã Â§Â§Ã Â§Â¨Ã Â§Â©Ã Â§ÂªÃ Â§Â«Ã Â§Â¬Ã Â§Â­Ã Â§Â®Ã Â§Â¯'[d]);
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


/**
 * DYKUI.js - UI components for the Did You Know (DYK) nomination tool using Codex.
 */

window.DYKUI = (function(Vue, Cdx) {
    const { ref, reactive, computed, onMounted, watch } = Vue;
    const { 
        CdxDialog, 
        CdxButton, 
        CdxTextInput, 
        CdxTextArea, 
        CdxSelect, 
        CdxField, 
        CdxLabel,
        CdxIcon,
        CdxMessage,
        CdxProgressBar
    } = Cdx;

    const DYKApp = {
        template: `
            <cdx-dialog
                v-if="visible"
                :title="title"
                :open="visible"
                @update:open="close"
                :primary-action="primaryAction"
                :secondary-action="secondaryAction"
                @primary="handleSubmit"
                @secondary="close"
                size="large"
            >
                <div class="dyk-form">
                    <cdx-field :status="errors.article ? 'error' : 'default'" :messages="errors.article ? { error: errors.article } : {}">
                        <template #label>Ã Â¦Â¨Ã Â¦Â¿Ã Â¦Â¬Ã Â¦Â¨Ã Â§Ã Â¦Â§Ã Â§â€¡Ã Â¦Â° Ã Â¦Â¨Ã Â¦Â¾Ã Â¦Â®</template>
                        <cdx-text-input 
                            v-model="form.article" 
                            placeholder="Ã Â¦Â¨Ã Â¦Â¿Ã Â¦Â¬Ã Â¦Â¨Ã Â§Ã Â¦Â§Ã Â§â€¡Ã Â¦Â° Ã Â¦Â¨Ã Â¦Â¾Ã Â¦Â® Ã Â¦ÂªÃ Â§Ã Â¦Â°Ã Â¦Â¦Ã Â¦Â¾Ã Â¦Â¨ Ã Â¦â€¢Ã Â¦Â°Ã Â§Ã Â¦Â¨..."
                            @input="handleArticleInput"
                        />
                        <div v-if="suggestions.length" class="dyk-suggestions">
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
                        <template #label>Ã Â¦Â®Ã Â¦Â¨Ã Â§â€¹Ã Â¦Â¨Ã Â¦Â¯Ã Â¦Â¼Ã Â¦Â¨Ã Â¦â€¢Ã Â¦Â¾Ã Â¦Â°Ã Â§â‚¬Ã Â¦Â° Ã Â¦Â¨Ã Â¦Â¾Ã Â¦Â®</template>
                        <cdx-text-input :value="form.nominator" disabled />
                    </cdx-field>

                    <cdx-field>
                        <template #label>Ã Â¦Â¨Ã Â¦Â¿Ã Â¦Â¬Ã Â¦Â¨Ã Â§Ã Â¦Â§Ã Â§â€¡Ã Â¦Â° Ã Â¦â€¦Ã Â¦Â¬Ã Â¦Â¸Ã Â§Ã Â¦Â¥Ã Â¦Â¾</template>
                        <cdx-select
                            v-model:selected="form.status"
                            :menu-items="statusOptions"
                        />
                    </cdx-field>

                    <cdx-field :status="errors.image ? 'error' : 'default'" :messages="errors.image ? { error: errors.image } : {}">
                        <template #label>Ã Â¦â€ºÃ Â¦Â¬Ã Â¦Â¿ Ã Â¦ÂªÃ Â§Ã Â¦Â°Ã Â¦Â¦Ã Â¦Â¾Ã Â¦Â¨ Ã Â¦â€¢Ã Â¦Â°Ã Â§Ã Â¦Â¨ (Ã Â¦Ã Â¦Å¡Ã Â§Ã Â¦â€ºÃ Â¦Â¿Ã Â¦â€¢)</template>
                        <cdx-text-input 
                            v-model="form.image" 
                            placeholder="Ã Â¦â€°Ã Â¦Â¦Ã Â¦Â¾Ã Â¦Â¹Ã Â¦Â°Ã Â¦Â¨Ã Â¦Æ’ Example.jpg"
                        />
                    </cdx-field>

                    <cdx-field>
                        <template #label>Ã Â¦â€ºÃ Â¦Â¬Ã Â¦Â¿Ã Â¦Â° Ã Â¦Â¶Ã Â¦Â¿Ã Â¦Â°Ã Â§â€¹Ã Â¦Â¨Ã Â¦Â¾Ã Â¦Â®</template>
                        <cdx-text-input 
                            v-model="form.caption" 
                            :disabled="!form.image"
                            placeholder="Ã Â¦â€ºÃ Â¦Â¬Ã Â¦Â¿Ã Â¦Â° Ã Â¦Â¸Ã Â¦â€šÃ Â¦â€¢Ã Â§Ã Â¦Â·Ã Â¦Â¿Ã Â¦ÂªÃ Â§Ã Â¦Â¤ Ã Â¦Â¶Ã Â¦Â¿Ã Â¦Â°Ã Â§â€¹Ã Â¦Â¨Ã Â¦Â¾Ã Â¦Â® Ã Â¦Â¬Ã Â¦Â¾ Ã Â¦Â¬Ã Â¦Â°Ã Â§Ã Â¦Â£Ã Â¦Â¨Ã Â¦Â¾ Ã Â¦Â²Ã Â¦Â¿Ã Â¦â€“Ã Â§Ã Â¦Â¨..."
                        />
                    </cdx-field>

                    <div class="dyk-hooks-section">
                        <div class="dyk-hooks-header">
                            <label>Ã Â¦Â­Ã Â§Ã Â¦â€¢Ã Â§Ã Â¦Â¤Ã Â¦Â¿ (Hooks)</label>
                            <span :style="{ color: remainingChars < 0 ? 'red' : '#555' }">
                                {{ bDigits(remainingChars) }} Ã Â¦â€¦Ã Â¦â€¢Ã Â§Ã Â¦Â·Ã Â¦Â° Ã Â¦â€¦Ã Â¦Â¬Ã Â¦Â¶Ã Â¦Â¿Ã Â¦Â·Ã Â§Ã Â¦Å¸
                            </span>
                        </div>
                        
                        <cdx-text-area
                            v-model="form.mainHook"
                            placeholder="Ã Â¦Â®Ã Â§â€šÃ Â¦Â² Ã Â¦Â­Ã Â§Ã Â¦â€¢Ã Â§Ã Â¦Â¤Ã Â¦Â¿ Ã Â¦Â²Ã Â¦Â¿Ã Â¦â€“Ã Â§Ã Â¦Â¨..."
                            rows="2"
                        />

                        <div v-for="(hook, index) in form.altHooks" :key="index" class="dyk-alt-hook">
                            <cdx-text-area
                                v-model="form.altHooks[index]"
                                :placeholder="'Ã Â¦Â¬Ã Â¦Â¿Ã Â¦â€¢Ã Â¦Â²Ã Â§Ã Â¦Âª Ã Â¦Â­Ã Â§Ã Â¦â€¢Ã Â§Ã Â¦Â¤Ã Â¦Â¿ ' + bDigits(index + 1) + ' Ã Â¦Â²Ã Â¦Â¿Ã Â¦â€“Ã Â§Ã Â¦Â¨...'"
                                rows="1"
                            />
                            <cdx-button action="destructive" weight="quiet" @click="removeAltHook(index)">
                                Ã Â¦Â®Ã Â§Ã Â¦â€ºÃ Â§â€¡ Ã Â¦Â«Ã Â§â€¡Ã Â¦Â²Ã Â§Ã Â¦Â¨
                            </cdx-button>
                        </div>

                        <cdx-button 
                            v-if="form.altHooks.length < 4" 
                            @click="addAltHook"
                            style="margin-top: 8px;"
                            :disabled="!form.mainHook"
                        >
                            Ã Â¦Â¬Ã Â¦Â¿Ã Â¦â€¢Ã Â¦Â²Ã Â§Ã Â¦Âª Ã Â¦Â­Ã Â§Ã Â¦â€¢Ã Â§Ã Â¦Â¤Ã Â¦Â¿ Ã Â¦Â¯Ã Â§â€¹Ã Â¦â€” Ã Â¦â€¢Ã Â¦Â°Ã Â§Ã Â¦Â¨
                        </cdx-button>
                    </div>

                    <div v-if="loading" class="dyk-loading">
                        <cdx-progress-bar />
                        <p>Ã Â¦â€¦Ã Â¦Â¨Ã Â§Ã Â¦â€”Ã Â§Ã Â¦Â°Ã Â¦Â¹ Ã Â¦â€¢Ã Â¦Â°Ã Â§â€¡ Ã Â¦â€¦Ã Â¦ÂªÃ Â§â€¡Ã Â¦â€¢Ã Â§Ã Â¦Â·Ã Â¦Â¾ Ã Â¦â€¢Ã Â¦Â°Ã Â§Ã Â¦Â¨...</p>
                    </div>

                    <div v-if="previewHtml" class="dyk-preview mw-parser-output" v-html="previewHtml"></div>
                    
                    <div style="margin-top: 16px; display: flex; gap: 8px;">
                        <cdx-button @click="handlePreview" :disabled="loading || !form.article || !form.mainHook">
                            Ã Â¦ÂªÃ Â§Ã Â¦Â°Ã Â¦Â¾Ã Â¦â€¢Ã Â¦Â¦Ã Â¦Â°Ã Â§Ã Â¦Â¶Ã Â¦Â¨
                        </cdx-button>
                        <cdx-button @click="openMainPage">
                            Ã Â¦Â¨Ã Â¦Â¿Ã Â¦Â°Ã Â§Ã Â¦Â¦Ã Â§â€¡Ã Â¦Â¶Ã Â¦Â¿Ã Â¦â€¢Ã Â¦Â¾
                        </cdx-button>
                    </div>
                </div>
            </cdx-dialog>
        `,
        components: {
            CdxDialog, CdxButton, CdxTextInput, CdxTextArea, CdxSelect, CdxField, CdxLabel, CdxIcon, CdxMessage, CdxProgressBar
        },
        setup() {
            const visible = ref(false);
            const loading = ref(false);
            const previewHtml = ref('');
            const suggestions = ref([]);
            const title = "Ã Â¦â€ Ã Â¦Å“Ã Â¦Â¾Ã Â¦â€¢Ã Â¦Â¿ Ã Â¦Â®Ã Â¦Â¨Ã Â§â€¹Ã Â¦Â¨Ã Â¦Â¯Ã Â¦Â¼Ã Â¦Â¨ (Codex)";

            const form = reactive({
                article: '',
                nominator: mw.config.get('wgUserName') || '',
                status: 'Ã Â¦Â¨Ã Â¦Â¤Ã Â§Ã Â¦Â¨',
                image: '',
                caption: '',
                mainHook: '',
                altHooks: []
            });

            const errors = reactive({
                article: '',
                image: '',
                mainHook: ''
            });

            const statusOptions = [
                { value: 'Ã Â¦Â¨Ã Â¦Â¤Ã Â§Ã Â¦Â¨', label: 'Ã Â¦Â¨Ã Â¦Â¤Ã Â§Ã Â¦Â¨' },
                { value: 'Ã Â¦Â¬Ã Â¦Â°Ã Â§Ã Â¦Â§Ã Â¦Â¿Ã Â¦Â¤', label: 'Ã Â¦Â¬Ã Â¦Â°Ã Â§Ã Â¦Â§Ã Â¦Â¿Ã Â¦Â¤' }
            ];

            const bDigits = DYKCore.toBengaliDigits;

            const remainingChars = computed(() => {
                const MAX = 200;
                const stripWikitext = (t) => t.replace(/\[\[(?:[^\|\]]*\|)?([^\]]+)\]\]/g, '$1');
                const len = stripWikitext(form.mainHook).length;
                return MAX - len;
            });

            const primaryAction = {
                label: 'Ã Â¦Å“Ã Â¦Â®Ã Â¦Â¾ Ã Â¦Â¦Ã Â¦Â¿Ã Â¦Â¨',
                actionType: 'progressive'
            };

            const secondaryAction = {
                label: 'Ã Â¦Â¬Ã Â¦Â¨Ã Â§Ã Â¦Â§ Ã Â¦â€¢Ã Â¦Â°Ã Â§Ã Â¦Â¨'
            };

            function open() {
                visible.value = true;
                if (mw.config.get('wgNamespaceNumber') === 0) {
                    form.article = mw.config.get('wgTitle');
                }
            }

            function close() {
                visible.value = false;
                reset();
            }

            function reset() {
                form.article = '';
                form.image = '';
                form.caption = '';
                form.mainHook = '';
                form.altHooks = [];
                previewHtml.value = '';
                suggestions.value = [];
            }

            async function handleArticleInput() {
                if (form.article.length > 2) {
                    suggestions.value = await DYKCore.fetchSuggestions(form.article);
                } else {
                    suggestions.value = [];
                }
            }

            function selectSuggestion(s) {
                form.article = s;
                suggestions.value = [];
            }

            function addAltHook() {
                if (form.altHooks.length < 4) {
                    form.altHooks.push('');
                }
            }

            function removeAltHook(index) {
                form.altHooks.splice(index, 1);
            }

            function validate() {
                let valid = true;
                errors.article = '';
                errors.image = '';
                
                if (!form.article.trim()) {
                    errors.article = 'Ã Â¦Â¨Ã Â¦Â¿Ã Â¦Â¬Ã Â¦Â¨Ã Â§Ã Â¦Â§Ã Â§â€¡Ã Â¦Â° Ã Â¦Â¨Ã Â¦Â¾Ã Â¦Â® Ã Â¦ÂªÃ Â§Ã Â¦Â°Ã Â¦Â¯Ã Â§â€¹Ã Â¦Å“Ã Â¦Â¨Ã Â§â‚¬Ã Â¦Â¯Ã Â¦Â¼';
                    valid = false;
                }
                
                if (!form.mainHook.trim()) {
                    valid = false;
                }

                if (form.image.trim()) {
                    const ext = form.image.split('.').pop().toLowerCase();
                    if (!['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'].includes(ext)) {
                        errors.image = 'Ã Â¦â€¦Ã Â¦Â¬Ã Â§Ë†Ã Â¦Â§ Ã Â¦â€ºÃ Â¦Â¬Ã Â¦Â¿Ã Â¦Â° Ã Â¦Â«Ã Â¦Â°Ã Â¦Â®Ã Â§Ã Â¦Â¯Ã Â¦Â¾Ã Â¦Å¸';
                        valid = false;
                    }
                }

                return valid;
            }

            async function handlePreview() {
                if (!validate()) return;
                loading.value = true;
                try {
                    const creator = await DYKCore.getArticleCreator(form.article);
                    const wikitext = DYKCore.generateWikitext({
                        ...form,
                        articleCreator: creator
                    });
                    const html = await DYKCore.getPreview(wikitext, 'Ã Â¦Å¸Ã Â§â€¡Ã Â¦Â®Ã Â¦ÂªÃ Â§Ã Â¦Â²Ã Â§â€¡Ã Â¦Å¸ Ã Â¦â€ Ã Â¦Â²Ã Â§â€¹Ã Â¦Å¡Ã Â¦Â¨Ã Â¦Â¾:Ã Â¦â€ Ã Â¦ÂªÃ Â¦Â¨Ã Â¦Â¿ Ã Â¦Å“Ã Â¦Â¾Ã Â¦Â¨Ã Â§â€¡Ã Â¦Â¨ Ã Â¦â€¢Ã Â¦Â¿');
                    previewHtml.value = html;
                    
                    // Wait for DOM to update then fix images
                    Vue.nextTick(() => {
                        const $preview = $('.dyk-preview');
                        DYKCore.fixLazyImages($preview);
                    });
                } catch (e) {
                    previewHtml.value = `<div style="color:red">Ã Â¦ÂªÃ Â§Ã Â¦Â°Ã Â¦Â¾Ã Â¦â€¢Ã Â¦Â¦Ã Â¦Â°Ã Â§Ã Â¦Â¶Ã Â¦Â¨ Ã Â¦Â²Ã Â§â€¹Ã Â¦Â¡ Ã Â¦â€¢Ã Â¦Â°Ã Â¦Â¤Ã Â§â€¡ Ã Â¦Â¬Ã Â§Ã Â¦Â¯Ã Â¦Â°Ã Â§Ã Â¦Â¥: ${e.message}</div>`;
                } finally {
                    loading.value = false;
                }
            }

            async function handleSubmit() {
                if (!validate()) return;
                loading.value = true;
                try {
                    const creator = await DYKCore.getArticleCreator(form.article);
                    const wikitext = DYKCore.generateWikitext({
                        ...form,
                        articleCreator: creator
                    });
                    await DYKCore.postNomination(
                        'Ã Â¦Å¸Ã Â§â€¡Ã Â¦Â®Ã Â¦ÂªÃ Â§Ã Â¦Â²Ã Â§â€¡Ã Â¦Å¸ Ã Â¦â€ Ã Â¦Â²Ã Â§â€¹Ã Â¦Å¡Ã Â¦Â¨Ã Â¦Â¾:Ã Â¦â€ Ã Â¦ÂªÃ Â¦Â¨Ã Â¦Â¿ Ã Â¦Å“Ã Â¦Â¾Ã Â¦Â¨Ã Â§â€¡Ã Â¦Â¨ Ã Â¦â€¢Ã Â¦Â¿',
                        wikitext,
                        'Ã Â¦â€ Ã Â¦Å“Ã Â¦Â¾Ã Â¦â€¢Ã Â¦Â¿ Ã Â¦Â®Ã Â¦Â¨Ã Â§â€¹Ã Â¦Â¨Ã Â¦Â¯Ã Â¦Â¼Ã Â¦Â¨ Ã Â¦Â¯Ã Â§â€¹Ã Â¦â€” Ã Â¦â€¢Ã Â¦Â°Ã Â¦Â¾ Ã Â¦Â¹Ã Â¦Â¯Ã Â¦Â¼Ã Â§â€¡Ã Â¦â€ºÃ Â§â€¡ (Codex)'
                    );
                    mw.notify('Ã Â¦Â¸Ã Â¦Â«Ã Â¦Â²Ã Â¦Â­Ã Â¦Â¾Ã Â¦Â¬Ã Â§â€¡ Ã Â¦â€ Ã Â¦Å“Ã Â¦Â¾Ã Â¦â€¢Ã Â¦Â¿ Ã Â¦Â®Ã Â¦Â¨Ã Â§â€¹Ã Â¦Â¨Ã Â¦Â¯Ã Â¦Â¼Ã Â¦Â¨ Ã Â¦Â¯Ã Â§Ã Â¦â€¢Ã Â§Ã Â¦â€¢Ã Â§Ã Â¦Â¤ Ã Â¦Â¹Ã Â¦Â¯Ã Â¦Â¼Ã Â§â€¡Ã Â¦â€ºÃ Â§â€¡!');
                    close();
                    if (mw.config.get('wgPageName') === 'Ã Â¦Å¸Ã Â§â€¡Ã Â¦Â®Ã Â¦ÂªÃ Â§Ã Â¦Â²Ã Â§â€¡Ã Â¦Å¸_Ã Â¦â€ Ã Â¦Â²Ã Â§â€¹Ã Â¦Å¡Ã Â¦Â¨Ã Â¦Â¾:Ã Â¦â€ Ã Â¦ÂªÃ Â¦Â¨Ã Â¦Â¿_Ã Â¦Å“Ã Â¦Â¾Ã Â¦Â¨Ã Â§â€¡Ã Â¦Â¨_Ã Â¦â€¢Ã Â¦Â¿') {
                        location.reload();
                    }
                } catch (e) {
                    mw.notify('Ã Â¦Â¸Ã Â¦Â®Ã Â§Ã Â¦ÂªÃ Â¦Â¾Ã Â¦Â¦Ã Â¦Â¨Ã Â¦Â¾ Ã Â¦Â¸Ã Â¦â€šÃ Â¦Â°Ã Â¦â€¢Ã Â§Ã Â¦Â·Ã Â¦Â£Ã Â§â€¡ Ã Â¦Â¸Ã Â¦Â®Ã Â¦Â¸Ã Â§Ã Â¦Â¯Ã Â¦Â¾ Ã Â¦Â¹Ã Â¦Â¯Ã Â¦Â¼Ã Â§â€¡Ã Â¦â€ºÃ Â§â€¡: ' + e.message, { type: 'error' });
                } finally {
                    loading.value = false;
                }
            }

            function openMainPage() {
                window.open(mw.util.getUrl('Ã Â¦â€°Ã Â¦â€¡Ã Â¦â€¢Ã Â¦Â¿Ã Â¦ÂªÃ Â¦Â¿Ã Â¦Â¡Ã Â¦Â¿Ã Â¦Â¯Ã Â¦Â¼Ã Â¦Â¾:Ã Â¦â€ Ã Â¦ÂªÃ Â¦Â¨Ã Â¦Â¿ Ã Â¦Å“Ã Â¦Â¾Ã Â¦Â¨Ã Â§â€¡Ã Â¦Â¨ Ã Â¦â€¢Ã Â¦Â¿'), '_blank');
            }

            return {
                visible, loading, form, errors, statusOptions, title,
                previewHtml, suggestions, remainingChars,
                primaryAction, secondaryAction,
                open, close, handleArticleInput, selectSuggestion,
                addAltHook, removeAltHook, handlePreview, handleSubmit,
                openMainPage, bDigits
            };
        }
    };

    let appInstance = null;
    let vm = null;

    function init() {
        if (appInstance) return;
        
        const container = document.createElement('div');
        container.id = 'dyk-nomination-app';
        document.body.appendChild(container);

        appInstance = Vue.createApp(DYKApp);
        vm = appInstance.mount('#dyk-nomination-app');

        // Add CSS
        const style = document.createElement('style');
        style.textContent = `
            .dyk-form { padding: 10px; }
            .dyk-suggestions { 
                position: absolute; background: white; border: 1px solid #ccc; 
                width: 100%; z-index: 1000; max-height: 200px; overflow-y: auto;
            }
            .dyk-suggestion-item { padding: 8px; cursor: pointer; }
            .dyk-suggestion-item:hover { background: #f0f0f0; }
            .dyk-hooks-section { margin-top: 16px; border-top: 1px solid #eee; pt: 8px; }
            .dyk-hooks-header { display: flex; justify-content: space-between; margin-bottom: 8px; font-weight: bold; }
            .dyk-alt-hook { display: flex; gap: 8px; align-items: flex-start; margin-top: 8px; }
            .dyk-preview { 
                margin-top: 16px; padding: 12px; border: 1px solid #eaecf0; 
                background: #f8f9fa; max-height: 300px; overflow-y: auto;
            }
            .dyk-loading { text-align: center; margin: 16px 0; }
        `;
        document.head.appendChild(style);
    }

    return {
        init,
        show: () => {
            init();
            vm.open();
        }
    };

})(Vue, Codex);


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
                    'Ã Â¦â€ Ã Â¦Å“Ã Â¦Â¾Ã Â¦â€¢Ã Â¦Â¿ Ã Â¦Â®Ã Â¦Â¨Ã Â§â€¹Ã Â¦Â¨Ã Â¦Â¯Ã Â¦Â¼Ã Â¦Â¨',
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
            if (mw.config.get('wgPageName') === 'Ã Â¦Å¸Ã Â§â€¡Ã Â¦Â®Ã Â¦ÂªÃ Â§Ã Â¦Â²Ã Â§â€¡Ã Â¦Å¸_Ã Â¦â€ Ã Â¦Â²Ã Â§â€¹Ã Â¦Å¡Ã Â¦Â¨Ã Â¦Â¾:Ã Â¦â€ Ã Â¦ÂªÃ Â¦Â¨Ã Â¦Â¿_Ã Â¦Å“Ã Â¦Â¾Ã Â¦Â¨Ã Â§â€¡Ã Â¦Â¨_Ã Â¦â€¢Ã Â¦Â¿' && location.search.includes('withJS')) {
                initApp();
            }
        });
    });

})(jQuery);

// </nowiki>
