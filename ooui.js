// helper function 

// OOUI window dialog constructor with full dynamic class + dialog features
(function ($) {
    class Dialog {
        constructor(config = {}) {
            this.windowManager = new OO.ui.WindowManager();
            $(document.body).append(this.windowManager.$element);

            const self = this;

            function InnerDialog(cfg) {
                InnerDialog.super.call(this, cfg);
            }
            OO.inheritClass(InnerDialog, OO.ui.ProcessDialog);

            InnerDialog.static.name = config.name || 'DEMO';
            InnerDialog.static.title = config.title || 'DEMO';
            InnerDialog.static.actions = config.actions || [];

            InnerDialog.prototype.initialize = function () {
                InnerDialog.super.prototype.initialize.call(this);

                this.content = new OO.ui.PanelLayout({
                    padded: true,
                    expanded: false
                });

                this.$body.append(this.content.$element);

                // Apply custom classes dynamically
                if (config.classes) {
                    if (config.classes.dialog) this.$element.addClass(config.classes.dialog);
                    if (config.classes.frame) this.$frame.addClass(config.classes.frame);
                    if (config.classes.head) this.$head.addClass(config.classes.head);
                    if (config.classes.body) this.$body.addClass(config.classes.body);
                    if (config.classes.foot) this.$foot.addClass(config.classes.foot);
                    if (config.classes.content) this.content.$element.addClass(config.classes.content);
                }
            };

            InnerDialog.prototype.getActionProcess = function (action) {
                if (self._handlers && self._handlers[action]) {
                    return new OO.ui.Process(() => self._handlers[action](this));
                }
                return InnerDialog.super.prototype.getActionProcess.call(this, action);
            };

            this.dialog = new InnerDialog({
                size: config.size || 'medium'
            });
            this.windowManager.addWindows([this.dialog]);

            // references for easy access
            this.body = this.dialog.content;
            this.head = this.dialog.$head;
            this.foot = this.dialog.$foot;
            this.frame = this.dialog.$frame;
            this.root = this.dialog.$element;

            this._handlers = {};
            this._widgets = [];
        }

        set title(val) {
            this.dialog.title.setLabel(val);
        }

        setBody(element) {
            this.body.$element.empty().append(element);
        }

        addWidget(widget) {
            this._widgets.push(widget);
            this.body.$element.append(widget.$element);
        }

        reset() {
            this._widgets.forEach(widget => {
                if (widget.setValue) widget.setValue('');
                if (widget.isSelected && widget.setSelected) widget.setSelected(false);
                if (widget.clearItems) widget.clearItems();
            });
        }

        onAction(action, callback) {
            this._handlers[action] = callback;
        }

        open() {
            this.windowManager.openWindow(this.dialog);
        }

        close() {
            this.windowManager.closeWindow(this.dialog);
        }

        // Dynamic class helpers
        addClass(target, className) {
            if (target === "content") {
                this.body.$element.addClass(className);
            } else if (this.dialog[`$${target}`]) {
                this.dialog[`$${target}`].addClass(className);
            }
        }

        removeClass(target, className) {
            if (target === "content") {
                this.body.$element.removeClass(className);
            } else if (this.dialog[`$${target}`]) {
                this.dialog[`$${target}`].removeClass(className);
            }
        }
    }

    window.Dialog = Dialog;

})(jQuery);

// Alert dialog wrapper
(function ($) {
    function AlertDialogCreator(message, options = {}) {
        const messageDialog = new OO.ui.MessageDialog();
        const windowManager = new OO.ui.WindowManager();
        $(document.body).append(windowManager.$element);
        windowManager.addWindows([messageDialog]);

        this.open = function () {
            windowManager.openWindow(messageDialog, {
                message: message,
                actions: [{
                    action: 'accept',
                    label: OO.ui.deferMsg('ooui-dialog-message-accept'),
                    flags: 'primary'
                }],
                ...options
            });
        };

        this.close = function () {
            messageDialog.close();
        };
    }

    window.Alert = function (message, options = {}) {
        const dlg = new AlertDialogCreator(message, options);
        dlg.open();
        return dlg;
    };
})(jQuery);

(function ($) {

    class WidgetFactory {
        constructor() {
            this.widgets = {}; // store widgets by name
        }

        createWidget(cfg) {
            let widget;
            switch (cfg.type) {
                case 'text':
                    widget = new OO.ui.TextInputWidget({ placeholder: cfg.placeholder || '' });
                    break;
                case 'password':
                    widget = new OO.ui.TextInputWidget({ type: 'password', placeholder: cfg.placeholder || '' });
                    break;
                case 'dropdown':
                    widget = new OO.ui.DropdownInputWidget({
                        options: (cfg.options || []).map(o => ({ data: o, label: o }))
                    });
                    break;
                case 'checkbox':
                    widget = new OO.ui.CheckboxInputWidget();
                    break;
                default:
                    console.warn('Unknown widget type:', cfg.type);
            }
            this.widgets[cfg.name] = widget;
            return widget;
        }

        // Generate a form inside a Dialog from JSON config
        createFormFromJSON(jsonUrl, dialog, callback) {
            $.getJSON(jsonUrl, data => {
                const container = $('<div>');
                data.forEach(cfg => {
                    const label = new OO.ui.LabelWidget({ label: cfg.label || cfg.name });
                    const widget = this.createWidget(cfg);
                    const wrapper = $('<div>').css({ marginBottom: '8px' });
                    wrapper.append(label.$element).append(widget.$element);
                    container.append(wrapper);
                });
                dialog.setBody(container);
                if (callback) callback(this.widgets);
            }).fail(err => console.error('Failed to load JSON:', err));
        }

        // Get current values of all widgets
        getValues() {
            const values = {};
            for (let key in this.widgets) {
                const w = this.widgets[key];
                if (w instanceof OO.ui.CheckboxInputWidget) {
                    values[key] = w.isSelected();
                } else if (w.getValue) {
                    values[key] = w.getValue();
                }
            }
            return values;
        }

        // Reset all widgets
        resetAll() {
            for (let key in this.widgets) {
                const w = this.widgets[key];
                if (w.setValue) w.setValue('');
                if (w.isSelected && w.setSelected) w.setSelected(false);
            }
        }
    }

    // Attach globally
    window.WidgetFactory = WidgetFactory;

})(jQuery);
