/**
 * DYKUI.js - UI components for the Did You Know (DYK) nomination tool using Codex.
 */

window.DYKUI = (function() {
    let Vue, Cdx;
    let appInstance = null;
    let vm = null;

    function getApp(v, c, i, initialState) {
        const { ref, reactive, computed, watch } = v;
        const { 
            CdxDialog, CdxButton, CdxTextInput, CdxTextArea, 
            CdxSelect, CdxField, CdxProgressBar, CdxIcon
        } = c;

        // Extract icon objects safely
        const icons = i || {};
        const iconSearch = icons.cdxIconSearch;
        const iconUser = icons.cdxIconUserAvatar;
        const iconArticle = icons.cdxIconArticle;
        const iconImage = icons.cdxIconImage;
        const iconEdit = icons.cdxIconEdit;
        const iconAdd = icons.cdxIconAdd;
        const iconTrash = icons.cdxIconTrash;
        const iconHelp = icons.cdxIconHelpNotice;
        const iconEye = icons.cdxIconEye;
        const iconCheck = icons.cdxIconCheck;

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
                        <div class="dyk-form-section">
                            <cdx-field :status="errors.article ? 'error' : 'default'" :messages="errors.article ? { error: errors.article } : {}">
                                <template #label>নিবন্ধের নাম</template>
                                <cdx-text-input 
                                    v-model="form.article" 
                                    :disabled="isNamespace0"
                                    placeholder="নিবন্ধের নাম প্রদান করুন..."
                                    v-bind="iconSearch ? { 'start-icon': iconSearch } : {}"
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
                                <cdx-text-input 
                                    v-model="form.nominator" 
                                    disabled 
                                    v-bind="iconUser ? { 'start-icon': iconUser } : {}" 
                                />
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

                        <div class="dyk-form-section">
                            <cdx-field :status="errors.image ? 'error' : 'default'" :messages="errors.image ? { error: errors.image } : {}">
                                <template #label>ছবি প্রদান করুন (ঐচ্ছিক)</template>
                                <cdx-text-input 
                                    v-model="form.image" 
                                    placeholder="উদাহরণ: Example.jpg"
                                    v-bind="iconImage ? { 'start-icon': iconImage } : {}"
                                />
                            </cdx-field>

                            <cdx-field>
                                <template #label>ছবির শিরোনাম</template>
                                <cdx-text-input 
                                    v-model="form.caption" 
                                    :disabled="!form.image"
                                    placeholder="ছবির সংক্ষিপ্ত শিরোনাম বা বর্ণনা লিখুন..."
                                    v-bind="iconEdit ? { 'start-icon': iconEdit } : {}"
                                />
                            </cdx-field>
                        </div>

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
                                    <cdx-icon v-if="iconTrash" :icon="iconTrash" />
                                    <span v-else>✕</span>
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
                                <cdx-icon v-if="iconAdd" :icon="iconAdd" /> 
                                <span>{{ iconAdd ? '' : '+' }} বিকল্প ভুক্তি যোগ করুন</span>
                            </cdx-button>
                        </div>

                        <div v-if="loading" class="dyk-loading">
                            <cdx-progress-bar />
                            <p style="color: #72777d; margin-top: 8px;">অনুগ্রহ করে অপেক্ষা করুন...</p>
                        </div>

                        <div v-if="previewHtml" class="dyk-preview-container">
                            <div class="dyk-preview-label">
                                <cdx-icon v-if="iconEye" :icon="iconEye" size="small" style="margin-right: 8px;" />
                                প্রাকদর্শন:
                            </div>
                            <div class="dyk-preview mw-parser-output" v-html="previewHtml"></div>
                        </div>
                    </div>

                    <template #footer>
                        <div class="dyk-footer-container">
                            <div class="dyk-footer-left">
                                <cdx-button @click="openMainPage" class="dyk-secondary-btn">
                                    <cdx-icon v-if="iconHelp" :icon="iconHelp" /> 
                                    <span>নির্দেশিকা</span>
                                </cdx-button>
                                <cdx-button @click="handlePreview" :disabled="loading || !form.article || !form.mainHook" class="dyk-secondary-btn">
                                    <cdx-icon v-if="iconArticle" :icon="iconArticle" />
                                    <span>প্রাকদর্শন</span>
                                </cdx-button>
                            </div>
                            <div class="dyk-footer-right">
                                <cdx-button @click="handleSubmit" action="progressive" weight="primary" :disabled="loading || !form.article || !form.mainHook" class="dyk-submit-btn">
                                    <cdx-icon v-if="iconCheck" :icon="iconCheck" />
                                    <span>জমা দিন</span>
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

                const form = reactive({
                    article: initialState.article || '',
                    nominator: initialState.userName || '',
                    status: 'নতুন',
                    image: '',
                    caption: '',
                    mainHook: '',
                    altHooks: []
                });

                const errors = reactive({
                    article: '', image: '', mainHook: ''
                });

                const statusOptions = [
                    { value: 'নতুন', label: 'নতুন' },
                    { value: 'বর্ধিত', label: 'বর্ধিত' }
                ];

                const bDigits = DYKCore.toBengaliDigits;

                watch(() => form.mainHook, (newVal) => {
                    if (!newVal.trim()) previewHtml.value = '';
                });

                const remainingChars = computed(() => {
                    const MAX = 200;
                    const stripWikitext = (t) => t.replace(/\[\[(?:[^\|\]]*\|)?([^\]]+)\]\]/g, '$1');
                    const len = stripWikitext(form.mainHook).length;
                    return MAX - len;
                });

                function open(state) {
                    visible.value = true;
                    if (state) {
                        form.article = state.article;
                        form.nominator = state.userName;
                        isNamespace0.value = state.isNamespace0;
                    }
                }

                function close() {
                    visible.value = false;
                    reset();
                }

                function reset() {
                    if (!isNamespace0.value) form.article = '';
                    form.image = ''; form.caption = '';
                    form.mainHook = ''; form.altHooks = [];
                    previewHtml.value = ''; suggestions.value = [];
                }

                async function handleArticleInput() {
                    if (!isNamespace0.value && form.article.length > 2) {
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
                    if (form.altHooks.length < 4) form.altHooks.push('');
                }

                function removeAltHook(index) {
                    form.altHooks.splice(index, 1);
                }

                function validate() {
                    let valid = true;
                    errors.article = ''; errors.image = '';
                    if (!form.article.trim()) { errors.article = 'নিবন্ধের নাম প্রয়োজনীয়'; valid = false; }
                    if (!form.mainHook.trim()) valid = false;
                    if (form.image.trim()) {
                        const ext = form.image.split('.').pop().toLowerCase();
                        if (!['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'].includes(ext)) {
                            errors.image = 'অবৈধ ছবির ফরম্যাট';
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
                        const wikitext = DYKCore.generateWikitext({ ...form, articleCreator: creator });
                        const html = await DYKCore.getPreview(wikitext, 'টেমপ্লেট আলোচনা:আপনি জানেন কি');
                        previewHtml.value = html;
                        v.nextTick(() => {
                            const $preview = $('.dyk-preview');
                            DYKCore.fixLazyImages($preview);
                        });
                    } catch (e) {
                        previewHtml.value = `<div style="color:#d33">প্রাকদর্শন লোড করতে ব্যর্থ: ${e.message}</div>`;
                    } finally {
                        loading.value = false;
                    }
                }

                async function handleSubmit() {
                    if (!validate()) return;
                    loading.value = true;
                    try {
                        const creator = await DYKCore.getArticleCreator(form.article);
                        const wikitext = DYKCore.generateWikitext({ ...form, articleCreator: creator });
                        await DYKCore.postNomination('টেমপ্লেট আলোচনা:আপনি জানেন কি', wikitext, 'আজাকি মনোনয়ন যোগ করা হয়েছে');
                        mw.notify('সফলভাবে আজাকি মনোনয়ন যুক্ত হয়েছে!');
                        close();
                        if (mw.config.get('wgPageName') === 'টেমপ্লেট_আলোচনা:আপনি_জানেন_কি') location.reload();
                    } catch (e) {
                        mw.notify('সম্পাদনা সংরক্ষণে সমস্যা হয়েছে: ' + e.message, { type: 'error' });
                    } finally {
                        loading.value = false;
                    }
                }

                function openMainPage() {
                    window.open(mw.util.getUrl('উইকিপিডিয়া:আপনি জানেন কি'), '_blank');
                }

                return {
                    visible, loading, form, errors, statusOptions, title, isNamespace0,
                    previewHtml, suggestions, remainingChars,
                    open, close, handleArticleInput, selectSuggestion,
                    addAltHook, removeAltHook, handlePreview, handleSubmit,
                    openMainPage, bDigits,
                    iconSearch, iconUser, iconArticle, iconImage, iconEdit,
                    iconAdd, iconTrash, iconHelp, iconEye, iconCheck
                };
            }
        };
    }

    return {
        init: (v, c, i, state) => {
            if (appInstance) return;
            Vue = v || window.Vue;
            Cdx = c || window.Codex || window.cx;

            if (!Cdx || !Vue) {
                console.error('Vue or Codex not found');
                return;
            }

            const container = document.createElement('div');
            container.id = 'dyk-nomination-app';
            document.body.appendChild(container);

            const DYKApp = getApp(Vue, Cdx, i, state);
            appInstance = Vue.createApp(DYKApp);
            vm = appInstance.mount('#dyk-nomination-app');

            const style = document.createElement('style');
            style.textContent = `
                .dyk-form { padding: 4px; }
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
                
                .dyk-secondary-btn { border: 1px solid #a2a9b1 !important; font-weight: bold !important; display: flex; align-items: center; }
                .dyk-submit-btn { font-weight: bold !important; padding: 0 24px !important; display: flex; align-items: center; }
                .dyk-add-btn { border: 1px dashed #a2a9b1 !important; width: 100%; justify-content: center; display: flex; align-items: center; }

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
        },
        show: (v, c, i, state) => {
            DYKUI.init(v, c, i, state);
            if (vm) vm.open(state);
        }
    };

})();
