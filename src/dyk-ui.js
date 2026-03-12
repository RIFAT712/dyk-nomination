/**
 * UI components for the DYK nomination tool.
 */
/* eslint-disable no-redeclare, no-unused-vars */
const getDYKApp = (require, initialState) => {
/* eslint-enable no-redeclare, no-unused-vars */
  const { ref, reactive, computed, watch, nextTick, onMounted, onUnmounted } = require('vue');
  const {
    CdxDialog, CdxButton, CdxTextInput, CdxTextArea,
    CdxSelect, CdxField, CdxProgressBar, CdxIcon, CdxRadio, CdxMessage
  } = require('@wikimedia/codex');

  return {
    template: `
            <cdx-dialog
                v-if="visible"
                :title="title"
                :open="visible"
                close-button-label="বন্ধ করুন"
                :close-on-backdrop-click="false"
                @update:open="close"
                size="large"
                class="dyk-custom-dialog"
            >
                <div class="dyk-form">
                    <!-- Global Error Message -->
                    <cdx-message v-if="globalError" type="error" :fade-in="true" style="margin-bottom: 16px;">
                        {{ globalError }}
                    </cdx-message>

                    <!-- Article and Nominator section -->
                    <div class="dyk-form-section">
                        <cdx-field :status="errors.article ? 'error' : 'default'" :messages="errors.article ? { error: errors.article } : {}">
                            <template #label>নিবন্ধের নাম</template>
                            <template #description>যে নিবন্ধটি আপনি মনোনীত করতে চান।</template>
                            <div class="dyk-suggest-wrapper" @mousedown.stop>
                                <cdx-text-input 
                                    v-model="form.article" 
                                    :disabled="isNamespace0"
                                    placeholder="নিবন্ধের নাম প্রদান করুন..."
                                    :start-icon="icons.cdxIconSearch"
                                    @input="handleArticleInput"
                                    @blur="validateArticle"
                                    class="progressive-input article-input"
                                />
                                <div v-if="suggestions.length && !isNamespace0" class="dyk-suggestions">
                                    <div 
                                        v-for="s in suggestions" 
                                        :key="s" 
                                        @click.stop="selectSuggestion(s)"
                                        class="dyk-suggestion-item"
                                    >
                                        {{ s }}
                                    </div>
                                </div>
                            </div>
                        </cdx-field>

                        <div class="dyk-row">
                            <cdx-field class="dyk-nominator-field">
                                <template #label>মনোনয়নকারীর নাম</template>
                                <cdx-text-input v-model="form.nominator" disabled :start-icon="icons.cdxIconUserAvatar" />
                            </cdx-field>

                            <cdx-field class="dyk-status-field">
                                <template #label>নিবন্ধের অবস্থা</template>
                                <div class="dyk-radio-group">
                                    <cdx-radio
                                        v-for="option in statusOptions"
                                        :key="option.value"
                                        v-model="form.status"
                                        :input-value="option.value"
                                        inline
                                    >
                                        {{ option.label }}
                                    </cdx-radio>
                                </div>
                            </cdx-field>
                        </div>
                    <!-- Image and caption section -->
                        <cdx-field :status="errors.image ? 'error' : 'default'" :messages="errors.image ? { error: errors.image } : {}">
                            <template #label>ছবি প্রদান করুন (ঐচ্ছিক)</template>
                            <div class="dyk-suggest-wrapper" @mousedown.stop>
                                <cdx-text-input 
                                    v-model="form.image" 
                                    placeholder="উদাহরণ: Example.jpg"
                                    :start-icon="icons.cdxIconImage"
                                    @input="handleImageInput"
                                    class="progressive-input image-input"
                                />
                                <div v-if="imageSuggestions.length" class="dyk-suggestions">
                                    <div 
                                        v-for="s in imageSuggestions" 
                                        :key="s.title" 
                                        @click.stop="selectImageSuggestion(s.title)"
                                        class="dyk-suggestion-item dyk-image-suggestion"
                                    >
                                        <img v-if="s.thumb" :src="s.thumb" class="dyk-suggestion-thumb" />
                                        <div v-else class="dyk-suggestion-thumb-placeholder">
                                            <cdx-icon :icon="icons.cdxIconImage" size="small"></cdx-icon>
                                        </div>
                                        <span class="dyk-suggestion-text">{{ s.title }}</span>
                                    </div>
                                </div>
                            </div>
                        </cdx-field>

                        <cdx-field>
                            <template #label>ছবির শিরোনাম</template>
                            <cdx-text-input 
                                v-model="form.caption" 
                                :disabled="!form.image"
                                placeholder="ছবির সংক্ষিপ্ত শিরোনাম বা বর্ণনা লিখুন..."
                                :start-icon="icons.cdxIconEdit"
                                class="progressive-input"
                            />
                        </cdx-field>
                    <!-- Hooks section -->
                        <div class="dyk-hooks-header">
                            <label style="font-weight: bold; color: #202122;">ভুক্তি</label>
                            <span :style="{ color: remainingChars < 0 ? '#d33' : '#72777d', fontSize: '12px', fontWeight: 'bold' }">
                                {{ bDigits(remainingChars) }} অক্ষর অবশিষ্ট
                            </span>
                        </div>
                        
                        <cdx-text-area
                            v-model="form.mainHook"
                            placeholder="মূল ভুক্তি লিখুন (যেমন: ...পাখিটি আকাশে উড়তে পারে?)"
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
                            <div style="display:flex; align-items:center;">
                                <cdx-icon :icon="icons.cdxIconEye" size="small" style="margin-right: 8px;"></cdx-icon>
                                প্রাকদর্শন
                            </div>
                            <cdx-button 
                                weight="quiet" 
                                size="small"
                                @click="copyWikitext"
                                title="উইকিটেক্সট কপি করুন"
                            >
                                <cdx-icon :icon="icons.cdxIconCopy"></cdx-icon>
                                কপি
                            </cdx-button>
                        </div>
                        <div class="dyk-preview mw-parser-output" v-html="previewHtml"></div>
                    </div>
                </div>

                <!-- Footer with action buttons -->
                <template #footer>
                    <div class="dyk-footer-container">
                        <div class="dyk-footer-left">
                            <cdx-button @click="openMainPage" class="dyk-secondary-btn" weight="quiet">
                                <cdx-icon :icon="icons.cdxIconHelpNotice"></cdx-icon>
                                নির্দেশিকা
                            </cdx-button>
                        </div>
                        <div class="dyk-footer-right">
                             <cdx-button 
                                @click="handlePreview" 
                                :disabled="loading || !form.article || !form.mainHook" 
                                class="dyk-secondary-btn"
                            >
                                <cdx-icon :icon="icons.cdxIconArticle" class="progressive-input"></cdx-icon>
                                প্রাকদর্শন
                            </cdx-button>
                            <cdx-button 
                                @click="handleSubmit" 
                                action="progressive" 
                                weight="primary" 
                                :disabled="loading || !form.article || !form.mainHook || hasErrors" 
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
      CdxDialog, CdxButton, CdxTextInput, CdxTextArea, CdxSelect, CdxField, CdxProgressBar, CdxIcon, CdxRadio, CdxMessage
    },
    setup() {
      const visible = ref(false);
      const loading = ref(false);
      const previewHtml = ref('');
      const suggestions = ref([]);
      const imageSuggestions = ref([]);
      const title = 'আজাকি মনোনয়ন';
      const isNamespace0 = ref(initialState.isNamespace0);
      const icons = reactive({});
      const globalError = ref('');

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
      const hasErrors = computed(() => !!errors.article || !!errors.image);
      const statusOptions = [{ value: 'নতুন', label: 'নতুন' }, { value: 'বর্ধিত', label: 'বর্ধিত' }];
      const bDigits = DYKCore.toBengaliDigits;

      function open(article) {
        visible.value = true;
        if (article) {
          form.article = article;
          validateArticle();
        }
      }

      // Load icons from the MediaWiki API on mount.
      onMounted(async () => {
        const api = new mw.Api({ userAgent: 'DYKNominationTool/1.0.0' });
        const iconNames = [
          'cdxIconSearch', 'cdxIconUserAvatar', 'cdxIconArticle',
          'cdxIconImage', 'cdxIconEdit', 'cdxIconAdd', 'cdxIconTrash',
          'cdxIconHelpNotice', 'cdxIconEye', 'cdxIconCheck', 'cdxIconCopy'
        ];
        const data = await api.get({ action: 'query', list: 'codexicons', names: iconNames });
        Object.assign(icons, data.query.codexicons);

        document.addEventListener('click', handleGlobalClick);
      });

      onUnmounted(() => {
        document.removeEventListener('click', handleGlobalClick);
      });

      function handleGlobalClick(e) {
        const wrapper = e.target.closest('.dyk-suggest-wrapper');
        if (!wrapper) {
          suggestions.value = [];
          imageSuggestions.value = [];
        } else {
          if (wrapper.querySelector('.article-input')) {
            imageSuggestions.value = [];
          } else if (wrapper.querySelector('.image-input')) {
            suggestions.value = [];
          }
        }
      }

      // Calculate how many characters are left for the hook.
      const remainingChars = computed(() => {
        const MAX = 200;
        const stripWikitext = (t) => t.replace(/\[\[(?:[^|\]]*\|)?([^\]]+)\]\]/g, '$1');
        const len = stripWikitext(form.mainHook).length;
        return MAX - len;
      });

      watch(() => form.mainHook, (newVal) => { if (!newVal.trim()) previewHtml.value = ''; });

      function close() { visible.value = false; reset(); }

      function reset() {
        if (!isNamespace0.value) form.article = '';
        form.image = ''; form.caption = ''; form.mainHook = ''; form.altHooks = [];
        previewHtml.value = ''; suggestions.value = []; imageSuggestions.value = [];
        globalError.value = ''; errors.article = ''; errors.image = '';
      }

      let suggestTimeout;
      async function handleArticleInput() {
        clearTimeout(suggestTimeout);
        imageSuggestions.value = []; // Clear other
        errors.article = ''; // Clear error on typing

        if (!isNamespace0.value && form.article.length > 2) {
          suggestTimeout = setTimeout(async () => {
            suggestions.value = await DYKCore.fetchSuggestions(form.article);
          }, 300);
        } else suggestions.value = [];
      }

      async function validateArticle() {
        if (!form.article.trim()) return;

        // Only validate if user stopped typing or blurred
        const result = await DYKCore.checkPageExists(form.article);
        if (!result.exists) {
          errors.article = 'নিবন্ধটি উইকিপিডিয়ায় পাওয়া যায়নি।';
        } else if (result.namespace !== 0) {
          // Check if it's main namespace (0). DYK usually only for articles.
          // But sometimes User sandbox is allowed? Strict for now.
          errors.article = 'শুধুমাত্র মূল নামস্থান (Main Namespace) এর নিবন্ধ গ্রহণযোগ্য।';
        } else {
          errors.article = '';
        }
      }

      async function handleImageInput() {
        clearTimeout(suggestTimeout);
        suggestions.value = []; // Clear other
        errors.image = '';

        if (form.image.length > 2) {
          suggestTimeout = setTimeout(async () => {
            imageSuggestions.value = await DYKCore.fetchImageSuggestions(form.image);
          }, 300);
        } else imageSuggestions.value = [];
      }

      function selectSuggestion(s) { form.article = s; suggestions.value = []; validateArticle(); }
      function selectImageSuggestion(s) { form.image = s; imageSuggestions.value = []; }
      function addAltHook() { if (form.altHooks.length < 4) form.altHooks.push(''); }
      function removeAltHook(index) { form.altHooks.splice(index, 1); }

      // Basic validation for the form fields.
      async function validate() {
        let isValid = true;
        globalError.value = '';
        errors.article = ''; errors.image = '';

        if (!form.article.trim()) { errors.article = 'নিবন্ধের নাম প্রয়োজনীয়'; isValid = false; }
        else {
          // Double check existence on submit just in case
          const result = await DYKCore.checkPageExists(form.article);
          if (!result.exists) {
            errors.article = 'নিবন্ধটি উইকিপিডিয়ায় পাওয়া যায়নি।';
            isValid = false;
          }
        }

        if (form.image.trim()) {
          const ext = form.image.split('.').pop().toLowerCase();
          if (!['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'].includes(ext)) {
            errors.image = 'অবৈধ ছবির ফরম্যাট'; isValid = false;
          }
        }

        if (!form.mainHook.trim()) {
          globalError.value = 'মূল ভুক্তি (Hook) প্রদান করা আবশ্যক।';
          isValid = false;
        }

        return isValid;
      }

      // Generate wikitext and fetch its HTML preview.
      async function handlePreview() {
        if (!(await validate())) return;
        loading.value = true;
        try {
          const creator = await DYKCore.getArticleCreator(form.article);
          const wikitext = DYKCore.generateWikitext({ ...form, articleCreator: creator });
          const targetPage = DYKCore.TEST_MODE ? DYKCore.TEST_PAGE : DYKCore.DYK_PAGE;
          previewHtml.value = await DYKCore.getPreview(wikitext, targetPage);
          nextTick(() => DYKCore.fixLazyImages($('.dyk-preview')));
        } catch (e) { previewHtml.value = `<div style="color:#d33">${e.message}</div>`; }
        finally { loading.value = false; }
      }

      async function copyWikitext() {
        try {
          const creator = await DYKCore.getArticleCreator(form.article);
          const wikitext = DYKCore.generateWikitext({ ...form, articleCreator: creator });
          navigator.clipboard.writeText(wikitext).then(() => {
            mw.notify('উইকিটেক্সট কপি করা হয়েছে!');
          });
        } catch (e) {
          mw.notify('কপি করতে ব্যর্থ: ' + e.message, { type: 'error' });
        }
      }

      // Post the nomination to the wiki.
      async function handleSubmit() {
        if (!(await validate())) return;
        loading.value = true;
        try {
          const creator = await DYKCore.getArticleCreator(form.article);
          const wikitext = DYKCore.generateWikitext({ ...form, articleCreator: creator });
          const targetPage = DYKCore.TEST_MODE ? DYKCore.TEST_PAGE : DYKCore.DYK_PAGE;
          const summary = DYKCore.TEST_MODE ? 'আজাকি মনোনয়ন (পরীক্ষামূলক)' : 'আজাকি মনোনয়ন যোগ করা হয়েছে';
          
          await DYKCore.postNomination(targetPage, wikitext, summary);
          mw.notify(DYKCore.TEST_MODE ? 'সফলভাবে পরীক্ষামূলক মনোনয়ন জমা হয়েছে!' : 'সফলভাবে আজাকি মনোনয়ন যুক্ত হয়েছে!');
          close();
          if (mw.config.get('wgPageName') === targetPage) location.reload();
        } catch (e) { mw.notify(e.message, { type: 'error' }); }
        finally { loading.value = false; }
      }

      return {
        visible, loading, form, errors, hasErrors, statusOptions, title, isNamespace0,
        previewHtml, suggestions, imageSuggestions, remainingChars, bDigits, icons, globalError,
        open, close, handleArticleInput, handleImageInput, selectSuggestion, selectImageSuggestion,
        addAltHook, removeAltHook, handlePreview, handleSubmit, validateArticle, copyWikitext,
        openMainPage: () => window.open(mw.util.getUrl('উইকিপিডিয়া:আপনি জানেন কি'), '_blank')
      };
    }
  };
};

