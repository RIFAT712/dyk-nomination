// <nowiki>
/**
 * UI components for the DYK nomination tool.
 */
/* eslint-disable no-redeclare, no-unused-vars */
const getDYKApp = (require, initialState) => {
/* eslint-enable no-redeclare, no-unused-vars */
  const { ref, reactive, computed, watch, nextTick, onMounted, onUnmounted } = require('vue');
  const {
    CdxDialog, CdxButton, CdxTextInput, CdxTextArea,
    CdxSelect, CdxField, CdxProgressBar, CdxIcon, CdxRadio, CdxMessage, CdxCheckbox
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
                        <div style="display: flex; justify-content: space-between; align-items: flex-start;">
                            <cdx-field :status="errors.article ? 'error' : 'default'" :messages="errors.article ? { error: errors.article } : {}" style="flex-grow: 1; margin-right: 16px;">
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

                            <cdx-checkbox v-model="form.isTesting" style="margin-top: 32px;">
                                পরীক্ষামূলক মোড
                            </cdx-checkbox>
                        </div>

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
      CdxDialog, CdxButton, CdxTextInput, CdxTextArea, CdxSelect, CdxField, CdxProgressBar, CdxIcon, CdxRadio, CdxMessage, CdxCheckbox
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
        altHooks: [],
        isTesting: false
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
          const targetPage = form.isTesting ? DYKCore.TEST_PAGE : DYKCore.DYK_PAGE;
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
          const targetPage = form.isTesting ? DYKCore.TEST_PAGE : DYKCore.DYK_PAGE;
          const summary = form.isTesting ? 'আজাকি মনোনয়ন (পরীক্ষামূলক)' : 'আজাকি মনোনয়ন যোগ করা হয়েছে';
          
          await DYKCore.postNomination(targetPage, wikitext, summary);
          mw.notify(form.isTesting ? 'সফলভাবে পরীক্ষামূলক মনোনয়ন জমা হয়েছে!' : 'সফলভাবে আজাকি মনোনয়ন যুক্ত হয়েছে!');
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



/* global define, module, require, global */
/**
 * Core logic for the DYK nomination tool.
 * Handles API calls, wikitext generation, and other data-related tasks.
 */

(function(root, factory) {
  if (typeof define === 'function' && define.amd) {
    define(['jquery'], factory);
  } else if (typeof module === 'object' && module.exports) {
    module.exports = factory(require('jquery'));
  } else {
    root.DYKCore = factory(root.jQuery);
  }
}(typeof self !== 'undefined' ? self : this, function($) {
  // We don't initialize mw.Api here directly to allow mocking in tests
  const DYK_PAGE = 'টেমপ্লেট_আলোচনা:আপনি_জানেন_কি';
  const TEST_PAGE = 'ব্যবহারকারী:R1F4T/খেলাঘর';

  /**
   * Get the MediaWiki API instance.
   */
  function getApi() {
    if (typeof mw !== 'undefined' && mw.Api) {
      return new mw.Api();
    }
    // In test environment, we expect global.mw to be mocked
    if (typeof global !== 'undefined' && global.mw && global.mw.Api) {
      return new global.mw.Api();
    }
    throw new Error('MediaWiki API not found');
  }

  /**
   * Check if a page exists and return its details.
   */
  async function checkPageExists(title) {
    const api = getApi();
    try {
      const response = await api.get({
        action: 'query',
        titles: title,
        formatversion: 2
      });
      const page = response.query.pages[0];
      return {
        exists: !page.missing,
        invalid: page.invalid,
        namespace: page.ns
      };
    } catch (error) {
      console.error('Error checking page existence:', error);
      return { exists: false, error: error };
    }
  }

  /**
   * Parse wikitext to HTML for previewing.
   */
  async function getPreview(wikitext, title) {
    const api = getApi();
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
      throw new Error('প্রাকদর্শন লোড করতে সমস্যা হয়েছে। অনুগ্রহ করে আবার চেষ্টা করুন।');
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
    const api = getApi();
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
      if (!page || page.missing) {
        throw new Error(`নিবন্ধটি পাওয়া যায়নি: ${title}`);
      }
      return page.revisions[0].user;
    } catch (error) {
      console.error('Error fetching article creator:', error);
      const userName = (typeof mw !== 'undefined' && mw.config) ? mw.config.get('wgUserName') : 'TestUser';
      return userName;
    }
  }

  /**
   * Generate the final wikitext for the nomination.
   */
  function generateWikitext(data) {
    const { article, mainHook, altHooks = [], image = '', caption = '', status, nominator, articleCreator } = data;
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
    const api = getApi();
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
        text: currentContent + '\n\n' + text
      });
    } catch (error) {
      console.error('Post nomination error:', error);
      throw new Error('মনোনয়ন জমা দিতে সমস্যা হয়েছে। অনুগ্রহ করে আপনার ইন্টারনেট সংযোগ পরীক্ষা করুন।');
    }
  }

  /**
   * Search for article titles based on user input.
   */
  async function fetchSuggestions(query) {
    if (!query) return [];
    const api = getApi();
    try {
      const response = await api.get({
        action: 'query',
        generator: 'prefixsearch',
        gpssearch: query,
        gpslimit: 10,
        redirects: 1,
        formatversion: 2
      });
      if (!response.query || !response.query.pages) return [];
      return response.query.pages.map(p => p.title);
    } catch (error) {
      console.error('Fetch suggestions error:', error);
      return [];
    }
  }

  /**
   * Search for images based on user input.
   */
  async function fetchImageSuggestions(query) {
    if (!query) return [];
    const api = getApi();
    try {
      const response = await api.get({
        action: 'query',
        generator: 'prefixsearch',
        gpssearch: query,
        gpsnamespace: 6,
        gpslimit: 10,
        redirects: 1,
        prop: 'pageimages',
        piprop: 'thumbnail',
        pithumbsize: 50,
        formatversion: 2
      });
      if (!response.query || !response.query.pages) return [];
      return response.query.pages.map(p => ({
        title: p.title.replace(/^[^:]+:/, ''), // Strip "File:" prefix
        thumb: p.thumbnail ? p.thumbnail.source : null
      }));
    } catch (error) {
      console.error('Fetch image suggestions error:', error);
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
    TEST_PAGE,
    checkPageExists,
    getPreview,
    fixLazyImages,
    getArticleCreator,
    generateWikitext,
    postNomination,
    fetchSuggestions,
    fetchImageSuggestions,
    toBengaliDigits
  };

}));



(function() {
    const style = document.createElement('style');
    style.textContent = `.progressive-input .cdx-text-input__input:enabled~.cdx-text-input__icon-vue {
    color: var(--color-progressive, #36c) !important;
}

.destructive-input .cdx-text-input__input:enabled~.cdx-text-input__icon-vue {
    color: var(--color-destructive, #d33) !important;
}

.dyk-custom-dialog {
    /* Ensure dialog isn't too cramped */
    min-width: 500px;
}

.dyk-form {
    padding: 4px;
    overflow: visible;
}

.dyk-form-section {
    margin-bottom: 20px;
    padding-bottom: 16px;
    border-bottom: 1px solid #eaecf0;
    overflow: visible;
}

.dyk-form-section:last-child {
    border-bottom: none;
    margin-bottom: 0;
    padding-bottom: 0;
}

.dyk-row {
    display: flex;
    gap: 24px;
    align-items: flex-start;
    width: 100%;
}

.dyk-nominator-field {
    flex: 0 0 240px !important;
    margin-top: 16px !important;
}

.dyk-status-field {
    flex: 1 1 auto !important;
    margin-top: 16px !important;
}

/* Align labels in the same row */
.dyk-row .cdx-field__label {
    margin-bottom: 8px !important;
    display: flex;
    align-items: center;
    height: 20px;
    /* Force labels to have same height */
}

/* Adjust radio group to align with text input height */
.dyk-status-field .dyk-radio-group {
    height: 32px;
    display: flex;
    align-items: center;
    margin-top: 2px;
    /* Fine-tune to match text input baseline */
}

/* Ensure radio buttons themselves are centered */
.dyk-status-field .cdx-radio {
    margin-bottom: 0 !important;
    padding: 0 4px !important;
}

.dyk-suggest-wrapper {
    position: relative;
    width: 100%;
    overflow: visible;
}

.dyk-suggestions {
    position: absolute;
    top: 100%;
    left: 0;
    right: 0;
    background: white;
    border: 1px solid #a2a9b1;
    border-top: none;
    z-index: 1000;
    max-height: 250px;
    overflow-y: auto;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    margin-top: 0;
    border-radius: 0 0 2px 2px;
}

.dyk-suggestion-item {
    padding: 10px 12px;
    cursor: pointer;
    color: #202122;
    transition: background-color 0.1s ease;
    font-size: 14px;
}

.dyk-suggestion-item:hover {
    background: #eaf3ff;
    color: #36c;
}

.dyk-image-suggestion {
    display: flex;
    align-items: center;
    gap: 12px;
}

.dyk-suggestion-thumb {
    width: 40px;
    height: 40px;
    object-fit: contain;
    background: #f8f9fa;
    border: 1px solid #eaecf0;
    border-radius: 2px;
    flex-shrink: 0;
}

.dyk-suggestion-thumb-placeholder {
    width: 40px;
    height: 40px;
    display: flex;
    justify-content: center;
    align-items: center;
    background: #f8f9fa;
    border: 1px solid #eaecf0;
    border-radius: 2px;
    flex-shrink: 0;
    color: #72777d;
}

.dyk-suggestion-text {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
}

.dyk-hooks-section {
    margin-top: 12px;
}

.dyk-hooks-header {
    display: flex;
    justify-content: space-between;
    margin-bottom: 8px;
    align-items: center;
}

.dyk-alt-hook {
    display: flex;
    gap: 8px;
    align-items: flex-start;
    margin-top: 12px;
    width: 100%;
}

.dyk-remove-btn {
    flex-shrink: 0;
    margin-top: 2px;
    /* Align with text area */
}

.dyk-preview-container {
    margin-top: 24px;
    border: 1px solid #a2a9b1;
    background: #f8f9fa;
    border-radius: 2px;
    box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
}

.dyk-preview-label {
    padding: 8px 12px;
    background: #eaecf0;
    border-bottom: 1px solid #a2a9b1;
    font-weight: bold;
    color: #202122;
    font-size: 13px;
    display: flex;
    align-items: center;
    justify-content: space-between;
}

.dyk-preview {
    padding: 16px;
    max-height: 300px;
    overflow-y: auto;
    font-size: 0.95em;
    line-height: 1.6;
    background: white;
}

/* Preview Content Styling */
.dyk-preview h2,
.dyk-preview h3,
.dyk-preview h4 {
    margin-top: 1em;
    margin-bottom: 0.5em;
    border-bottom: 1px solid #eaecf0;
    font-weight: bold;
    color: #202122;
}

.dyk-preview ul,
.dyk-preview ol {
    margin: 0.5em 0 0.5em 2em;
}

.dyk-preview li {
    margin-bottom: 4px;
}

.dyk-loading {
    text-align: center;
    margin: 24px 0;
}

.dyk-footer-container {
    display: flex;
    justify-content: space-between;
    align-items: center;
    width: 100%;
    box-sizing: border-box;
}

/* Overrides for Codex Dialog */
.cdx-dialog__footer {
    padding: 12px 24px !important;
    background-color: #f8f9fa;
    border-top: 1px solid #c8ccd1;
}

.dyk-footer-left,
.dyk-footer-right {
    display: flex;
    gap: 12px;
}

.dyk-full-width {
    width: 100% !important;
}

.dyk-secondary-btn {
    font-weight: 600 !important;
}

.dyk-submit-btn {
    font-weight: 700 !important;
}

.dyk-add-btn {
    border: 1px dashed #a2a9b1 !important;
    width: 100%;
    justify-content: center;
    display: flex;
    align-items: center;
    gap: 8px;
    margin-top: 16px;
    padding: 8px 0;
}

.cdx-dialog__header {
    background: white;
    border-bottom: 1px solid #c8ccd1;
    padding: 16px 24px !important;
}

.cdx-dialog__header__title {
    font-size: 1.2em;
    font-weight: bold;
}

/* Ensure close button is positioned correctly if custom styles conflict */
.cdx-dialog .cdx-button.cdx-dialog__header__close {
    margin-left: auto;
}`;
    document.head.appendChild(style);
})();

/**
 * Entry point for the DYK nomination tool.
 */
(function ($) {
  // Ensure dependencies are loaded
  const dependencies = ['vue', '@wikimedia/codex', 'mediawiki.api', 'mediawiki.util', 'mediawiki.user', 'mediawiki.Title'];

  mw.loader.using(dependencies).then((require) => {
    let vm = null;

    // Initialize and mount the Vue application.
    function initApp() {
      try {
        if (!window.DYKCore) {
          console.error('DYKCore logic not loaded.');
          mw.notify('DYKCore মডিউল লোড হয়নি। অনুগ্রহ করে স্ক্রিপ্টটি আবার ইনস্টল করুন।', { type: 'error' });
          return;
        }

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
      } catch (e) {
        console.error('DYK App Initialization Error:', e);
        mw.notify('DYK অ্যাপ চালু করতে সমস্যা হয়েছে: ' + e.message, { type: 'error' });
      }
    }

    $(document).ready(() => {
      // Add a link in the "More" menu for articles.
      if (mw.config.get('wgNamespaceNumber') === 0) {
        const portletLink = mw.util.addPortletLink('p-cactions', '#', 'আজাকি মনোনয়ন', 'ca-dyk');
        if (portletLink) {
          $(portletLink).on('click', (e) => { 
            e.preventDefault(); 
            initApp(); 
          });
        }
      }
            
      // Check if we should auto-open based on URL params or special page context
      const shouldAutoOpen = mw.util.getParamValue('dyk-open') === '1' || 
                                  (window.DYKCore && mw.config.get('wgPageName') === DYKCore.DYK_PAGE && location.search.includes('withJS'));

      if (shouldAutoOpen) {
        initApp();
      }
    });
  }).catch((e) => {
    console.error('Failed to load DYK dependencies:', e);
  });
})(jQuery);


// </nowiki>
