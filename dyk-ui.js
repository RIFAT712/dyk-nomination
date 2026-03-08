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
                        <template #label>à¦¨à¦¿à¦¬à¦¨à§à¦§à§‡à¦° à¦¨à¦¾à¦®</template>
                        <cdx-text-input 
                            v-model="form.article" 
                            placeholder="à¦¨à¦¿à¦¬à¦¨à§à¦§à§‡à¦° à¦¨à¦¾à¦® à¦ªà§à¦°à¦¦à¦¾à¦¨ à¦•à¦°à§à¦¨..."
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
                        <template #label>à¦®à¦¨à§‹à¦¨à¦¯à¦¼à¦¨à¦•à¦¾à¦°à§€à¦° à¦¨à¦¾à¦®</template>
                        <cdx-text-input :value="form.nominator" disabled />
                    </cdx-field>

                    <cdx-field>
                        <template #label>à¦¨à¦¿à¦¬à¦¨à§à¦§à§‡à¦° à¦…à¦¬à¦¸à§à¦¥à¦¾</template>
                        <cdx-select
                            v-model:selected="form.status"
                            :menu-items="statusOptions"
                        />
                    </cdx-field>

                    <cdx-field :status="errors.image ? 'error' : 'default'" :messages="errors.image ? { error: errors.image } : {}">
                        <template #label>à¦›à¦¬à¦¿ à¦ªà§à¦°à¦¦à¦¾à¦¨ à¦•à¦°à§à¦¨ (à¦à¦šà§à¦›à¦¿à¦•)</template>
                        <cdx-text-input 
                            v-model="form.image" 
                            placeholder="à¦‰à¦¦à¦¾à¦¹à¦°à¦¨à¦ƒ Example.jpg"
                        />
                    </cdx-field>

                    <cdx-field>
                        <template #label>à¦›à¦¬à¦¿à¦° à¦¶à¦¿à¦°à§‹à¦¨à¦¾à¦®</template>
                        <cdx-text-input 
                            v-model="form.caption" 
                            :disabled="!form.image"
                            placeholder="à¦›à¦¬à¦¿à¦° à¦¸à¦‚à¦•à§à¦·à¦¿à¦ªà§à¦¤ à¦¶à¦¿à¦°à§‹à¦¨à¦¾à¦® à¦¬à¦¾ à¦¬à¦°à§à¦£à¦¨à¦¾ à¦²à¦¿à¦–à§à¦¨..."
                        />
                    </cdx-field>

                    <div class="dyk-hooks-section">
                        <div class="dyk-hooks-header">
                            <label>à¦­à§à¦•à§à¦¤à¦¿ (Hooks)</label>
                            <span :style="{ color: remainingChars < 0 ? 'red' : '#555' }">
                                {{ bDigits(remainingChars) }} à¦…à¦•à§à¦·à¦° à¦…à¦¬à¦¶à¦¿à¦·à§à¦Ÿ
                            </span>
                        </div>
                        
                        <cdx-text-area
                            v-model="form.mainHook"
                            placeholder="à¦®à§‚à¦² à¦­à§à¦•à§à¦¤à¦¿ à¦²à¦¿à¦–à§à¦¨..."
                            rows="2"
                        />

                        <div v-for="(hook, index) in form.altHooks" :key="index" class="dyk-alt-hook">
                            <cdx-text-area
                                v-model="form.altHooks[index]"
                                :placeholder="'à¦¬à¦¿à¦•à¦²à§à¦ª à¦­à§à¦•à§à¦¤à¦¿ ' + bDigits(index + 1) + ' à¦²à¦¿à¦–à§à¦¨...'"
                                rows="1"
                            />
                            <cdx-button action="destructive" weight="quiet" @click="removeAltHook(index)">
                                à¦®à§à¦›à§‡ à¦«à§‡à¦²à§à¦¨
                            </cdx-button>
                        </div>

                        <cdx-button 
                            v-if="form.altHooks.length < 4" 
                            @click="addAltHook"
                            style="margin-top: 8px;"
                            :disabled="!form.mainHook"
                        >
                            à¦¬à¦¿à¦•à¦²à§à¦ª à¦­à§à¦•à§à¦¤à¦¿ à¦¯à§‹à¦— à¦•à¦°à§à¦¨
                        </cdx-button>
                    </div>

                    <div v-if="loading" class="dyk-loading">
                        <cdx-progress-bar />
                        <p>à¦…à¦¨à§à¦—à§à¦°à¦¹ à¦•à¦°à§‡ à¦…à¦ªà§‡à¦•à§à¦·à¦¾ à¦•à¦°à§à¦¨...</p>
                    </div>

                    <div v-if="previewHtml" class="dyk-preview mw-parser-output" v-html="previewHtml"></div>
                    
                    <div style="margin-top: 16px; display: flex; gap: 8px;">
                        <cdx-button @click="handlePreview" :disabled="loading || !form.article || !form.mainHook">
                            à¦ªà§à¦°à¦¾à¦•à¦¦à¦°à§à¦¶à¦¨
                        </cdx-button>
                        <cdx-button @click="openMainPage">
                            à¦¨à¦¿à¦°à§à¦¦à§‡à¦¶à¦¿à¦•à¦¾
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
            const title = "à¦†à¦œà¦¾à¦•à¦¿ à¦®à¦¨à§‹à¦¨à¦¯à¦¼à¦¨ (Codex)";

            const form = reactive({
                article: '',
                nominator: mw.config.get('wgUserName') || '',
                status: 'à¦¨à¦¤à§à¦¨',
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
                { value: 'à¦¨à¦¤à§à¦¨', label: 'à¦¨à¦¤à§à¦¨' },
                { value: 'à¦¬à¦°à§à¦§à¦¿à¦¤', label: 'à¦¬à¦°à§à¦§à¦¿à¦¤' }
            ];

            const bDigits = DYKCore.toBengaliDigits;

            const remainingChars = computed(() => {
                const MAX = 200;
                const stripWikitext = (t) => t.replace(/\[\[(?:[^\|\]]*\|)?([^\]]+)\]\]/g, '$1');
                const len = stripWikitext(form.mainHook).length;
                return MAX - len;
            });

            const primaryAction = {
                label: 'à¦œà¦®à¦¾ à¦¦à¦¿à¦¨',
                actionType: 'progressive'
            };

            const secondaryAction = {
                label: 'à¦¬à¦¨à§à¦§ à¦•à¦°à§à¦¨'
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
                    errors.article = 'à¦¨à¦¿à¦¬à¦¨à§à¦§à§‡à¦° à¦¨à¦¾à¦® à¦ªà§à¦°à¦¯à§‹à¦œà¦¨à§€à¦¯à¦¼';
                    valid = false;
                }
                
                if (!form.mainHook.trim()) {
                    valid = false;
                }

                if (form.image.trim()) {
                    const ext = form.image.split('.').pop().toLowerCase();
                    if (!['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'].includes(ext)) {
                        errors.image = 'à¦…à¦¬à§ˆà¦§ à¦›à¦¬à¦¿à¦° à¦«à¦°à¦®à§à¦¯à¦¾à¦Ÿ';
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
                    const html = await DYKCore.getPreview(wikitext, 'à¦Ÿà§‡à¦®à¦ªà§à¦²à§‡à¦Ÿ à¦†à¦²à§‹à¦šà¦¨à¦¾:à¦†à¦ªà¦¨à¦¿ à¦œà¦¾à¦¨à§‡à¦¨ à¦•à¦¿');
                    previewHtml.value = html;
                    
                    // Wait for DOM to update then fix images
                    Vue.nextTick(() => {
                        const $preview = $('.dyk-preview');
                        DYKCore.fixLazyImages($preview);
                    });
                } catch (e) {
                    previewHtml.value = `<div style="color:red">à¦ªà§à¦°à¦¾à¦•à¦¦à¦°à§à¦¶à¦¨ à¦²à§‹à¦¡ à¦•à¦°à¦¤à§‡ à¦¬à§à¦¯à¦°à§à¦¥: ${e.message}</div>`;
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
                        'à¦Ÿà§‡à¦®à¦ªà§à¦²à§‡à¦Ÿ à¦†à¦²à§‹à¦šà¦¨à¦¾:à¦†à¦ªà¦¨à¦¿ à¦œà¦¾à¦¨à§‡à¦¨ à¦•à¦¿',
                        wikitext,
                        'à¦†à¦œà¦¾à¦•à¦¿ à¦®à¦¨à§‹à¦¨à¦¯à¦¼à¦¨ à¦¯à§‹à¦— à¦•à¦°à¦¾ à¦¹à¦¯à¦¼à§‡à¦›à§‡ (Codex)'
                    );
                    mw.notify('à¦¸à¦«à¦²à¦­à¦¾à¦¬à§‡ à¦†à¦œà¦¾à¦•à¦¿ à¦®à¦¨à§‹à¦¨à¦¯à¦¼à¦¨ à¦¯à§à¦•à§à¦•à§à¦¤ à¦¹à¦¯à¦¼à§‡à¦›à§‡!');
                    close();
                    if (mw.config.get('wgPageName') === 'à¦Ÿà§‡à¦®à¦ªà§à¦²à§‡à¦Ÿ_à¦†à¦²à§‹à¦šà¦¨à¦¾:à¦†à¦ªà¦¨à¦¿_à¦œà¦¾à¦¨à§‡à¦¨_à¦•à¦¿') {
                        location.reload();
                    }
                } catch (e) {
                    mw.notify('à¦¸à¦®à§à¦ªà¦¾à¦¦à¦¨à¦¾ à¦¸à¦‚à¦°à¦•à§à¦·à¦£à§‡ à¦¸à¦®à¦¸à§à¦¯à¦¾ à¦¹à¦¯à¦¼à§‡à¦›à§‡: ' + e.message, { type: 'error' });
                } finally {
                    loading.value = false;
                }
            }

            function openMainPage() {
                window.open(mw.util.getUrl('à¦‰à¦‡à¦•à¦¿à¦ªà¦¿à¦¡à¦¿à¦¯à¦¼à¦¾:à¦†à¦ªà¦¨à¦¿ à¦œà¦¾à¦¨à§‡à¦¨ à¦•à¦¿'), '_blank');
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
