mw.loader.using(['@wikimedia/codex', 'mediawiki.api']).then(function (require) {

    const { createApp, ref, onMounted } = require('vue');
    const { CdxIcon } = require('@wikimedia/codex');

    const App = {
        components: { CdxIcon },

        template: `
			<div>
				<cdx-icon v-if="icon" :icon="icon" />
			</div>
		`,

        setup() {
            const icon = ref(null);

            onMounted(async () => {

                const api = new mw.Api();

                const data = await api.get({
                    action: 'query',
                    list: 'codexicons',
                    names: ['cdxIconInfo']
                });

                icon.value = data.query.codexicons.cdxIconInfo;
            });

            return { icon };
        }
    };

    const container = document.createElement('div');
    document.body.appendChild(container);

    createApp(App).mount(container);

});