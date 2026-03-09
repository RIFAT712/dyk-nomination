/**
 * DYKUI.js - UI components for the Did You Know (DYK) nomination tool.
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
                    <!-- Article and Nominator Section -->
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

                    <!-- Image and Caption Section -->
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

                    <!-- Hooks Section -->
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

                    <!-- Loading State -->
                    <div v-if="loading" class="dyk-loading">
                        <cdx-progress-bar />
                        <p style="color: #72777d; margin-top: 8px;">অনুগ্রহ করে অপেক্ষা করুন...</p>
                    </div>

                    <!-- Preview Section -->
                    <div v-if="previewHtml" class="dyk-preview-container">
                        <div class="dyk-preview-label">
                            <cdx-icon :icon="icons.cdxIconEye" size="small" style="margin-right: 8px;"></cdx-icon>
                            প্রাকদর্শন:
                        </div>
                        <div class="dyk-preview mw-parser-output" v-html="previewHtml"></div>
                    </div>
                </div>

                <!-- Dialog Footer -->
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

            async function handlePreview() {
                if (!validate()) return;
                loading.value = true;
                try {
                    const creator = await DYKCore.getArticleCreator(form.article);
                    const wikitext = DYKCore.generateWikitext({ ...form, articleCreator: creator });
                    previewHtml.value = await DYKCore.getPreview(wikitext, 'টেমপ্লেট আলোচনা:আপনি জানেন কি');
                    nextTick(() => DYKCore.fixLazyImages($('.dyk-preview')));
                } catch (e) { previewHtml.value = `<div style="color:#d33">${e.message}</div>`; }
                finally { loading.value = false; }
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
                } catch (e) { mw.notify(e.message, { type: 'error' }); }
                finally { loading.value = false; }
            }

            return {
                visible, loading, form, errors, statusOptions, title, isNamespace0,
                previewHtml, suggestions, remainingChars, bDigits, icons,
                open, close, handleArticleInput, selectSuggestion,
                addAltHook, removeAltHook, handlePreview, handleSubmit,
                openMainPage: () => window.open(mw.util.getUrl('উইকিপিডিয়া:আপনি জানেন কি'), '_blank')
            };        }
    };
};
