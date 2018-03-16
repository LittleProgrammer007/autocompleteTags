/**
 * @author magic
 * @version 1.0.0
 */

(function () {
    /**  
	 * 多语言
	 * @enum
	 * @readonly
	 */
    const language = {
        'zh-CN': 'zh-CN',
        'en': 'en',
    }

    class TagsHelper {
        constructor(selector, options) {
            this.properties = this.setProperties(selector, options);
        }

        getProperties() {
            return this.properties;
        }

        setProperties(selector, options = {}) {
            //确认参数类型正确
            if (typeof selector !== 'string') {
                throw new Error('selector must be a css selector');
            }
            const el = document.querySelector(selector);
            if (el.length === 0) {
                throw new Error('No element is found by this selector');
            }

            let source = this.getStrArrayBySource(options.source, 'source')
                , availableTags = this.getStrArrayBySource(options.availableTags, 'availableTags').filter(op => source.indexOf(op) === -1).sort();

            let { allowCreate = true, maxNum = 0, separator = ',', enterSplitEnable = true, lang = AutocompleteTags.defaultLanguage, readonly = false } = options;

            allowCreate = !!allowCreate;

            maxNum = +maxNum;
            if (isNaN(maxNum)) {
                maxNum = 0;
            }

            if (typeof separator !== 'string' || separator.length !== 1) {
                throw new Error('separator should be a character.')
            }

            enterSplitEnable = !!enterSplitEnable;

            if (!language.hasOwnProperty(lang)) {
                lang = AutocompleteTags.defaultLanguage;
            }

            readonly = !!readonly;

            const uId = Date.now();
            const widgetId = 'tags_' + uId;
            const dialogId = 'tagsDialog_' + uId;

            return Object.seal({
                selector,

                source,
                availableTags,
                allowCreate,
                maxNum,
                separator,
                enterSplitEnable,
                lang,
                readonly,

                widgetId,
                dialogId,
                el: el,
                dialogEl: null,
            });
        }

        initDOM() {
            const properties = this.properties;
            const { source, availableTags, selector, widgetId, dialogId, readonly } = properties;
            let sourceHtml = '';
            if (readonly) {
                for (let tag of source) {
                    sourceHtml += '<span class="tag selected">' + tag + '</span>';
                    properties.el.outerHTML = '<div class="auto-complete-box" id="' + widgetId + '">' + sourceHtml + '</div>';

                    let widgetEle = document.getElementById(widgetId)
                    properties.el = widgetEle;
                }
            } else {

                let allHtml = ''
                    , allOptions = [];

                for (let tag of source) {
                    sourceHtml += '<span class="tag selected">' + tag + ' <i class="iconfont icon-remove"></i></span>';
                    allOptions.push({
                        tag,
                        selected: 1,
                    });
                }

                for (let tag of availableTags) {
                    allOptions.push({
                        tag,
                        selected: 0,
                    });
                }

                allOptions.sort((a, b) => this.compareTags(a.tag, b.tag));

                for (let op of allOptions) {
                    if (op.selected) {
                        allHtml += '<span class="tag selected">' + op.tag + '</span>';
                    } else {
                        allHtml += '<span class="tag">' + op.tag + '</span>';
                    }
                }

                properties.el.outerHTML = '<div class="auto-complete-box" id="' + widgetId + '">' + sourceHtml + '<input type="text" class="tag-input"><i class="iconfont icon-plus" title="Add"></i></div>';

                let widgetEle = document.getElementById(widgetId)
                properties.el = widgetEle;

                widgetEle.addEventListener('click', event => this.handleClickAtWidget(event), false);
                widgetEle.getElementsByClassName('tag-input')[0].addEventListener('keydown', event => this.handleInput(event), false);

                let dialogEl = document.createElement('div');
                dialogEl.setAttribute('class', 'dialog');
                dialogEl.setAttribute('id', dialogId);
                dialogEl.style.display = 'none';
                dialogEl.innerHTML = '<div class="dialog-title">Add Participants <i class="iconfont icon-remove pull-right dialog-close"></i></div>' + '<div class="dialog-content"><div class="tags-container selected-area">' + sourceHtml + '</div><div class="tags-container options-area">' + allHtml + '<input type="text" placeholder="Add a new one" title="Enter to add" class="dialog-tag-input"></div><button type="button" class="dialog-close-btn">Close</button></div>'

                document.body.appendChild(dialogEl);

                properties.dialogEl = document.getElementById(dialogId);

                dialogEl.getElementsByClassName('dialog-close')[0].addEventListener('click', event => this.closeDialog(event), false);
                dialogEl.getElementsByClassName('dialog-close-btn')[0].addEventListener('click', event => this.closeDialog(event), false);
                dialogEl.getElementsByClassName('dialog-tag-input')[0].addEventListener('keydown', event => this.handleDialogInput(event), false);
                dialogEl.getElementsByClassName('selected-area')[0].addEventListener('click', event => this.handleClickAtSelectedArea(event), false);
                dialogEl.getElementsByClassName('options-area')[0].addEventListener('click', event => this.handleClickAtOptionsArea(event), false);
            }
        }

        handleClickAtWidget(event) {
            const target = event.target;
            if (target.tagName === 'I') {
                const className = target.className;
                if (className != null) {
                    if (className.indexOf('icon-remove') !== -1) {
                        this.removeTag(target);
                    } else if (className.indexOf('icon-plus') !== -1) {
                        this.openDialog();
                    }
                }
            }
        }

        handleClickAtSelectedArea(event) {
            const target = event.target;
            if (target.tagName === 'I') {
                this.removeTag(target);
            }
        }

        handleClickAtOptionsArea(event) {
            const target = event.target;
            if (target.tagName === 'SPAN') {
                this.toggleTagState(target);
            }
        }

        openDialog() {
            this.properties.dialogEl.style.display = 'block';
        }

        closeDialog() {
            this.properties.dialogEl.style.display = 'none';
        }

        handleInput(event) {
            //由于输入法，会有keycode:229的问题。据说使用keyup可以解决
            let { keyCode, key, target: { value } } = event
            if (key === this.properties.separator || (keyCode === 13 && this.properties.enterSplitEnable)) {
                //separator or enter
                event.preventDefault();
                this.addTag(value, 1);
            }

            if (keyCode === 8) {
                //backspace
                if (value.length === 0) {
                    this.removeLastTag();
                }
            }
        }

        handleDialogInput(event) {
            let { keyCode, target: { value } } = event
            if (keyCode === 13) {
                //enter
                event.preventDefault();
                this.addTag(value, 2);
            }
        }

        addTag(tag, type) {
            //can tag be added?
            if (tag.length === 0) {
                return;
            }

            const { source, availableTags, allowCreate, maxNum } = this.properties;

            //check for duplication
            if (source.indexOf(tag) !== -1) {
                return;
            }

            //check maxNum
            if (maxNum > 0 && source.length >= maxNum) {
                return;
            }

            const index = availableTags.indexOf(tag);
            if (index === -1 && allowCreate) {
                this.addNewTag(tag);
            } else {
                this.moveTagFromAvailableTosourceByIndex(index);
            }

            switch (type) {
                case 1:
                    this.cleanWidget();
                    break;
                case 2:
                    this.cleanDialog();
                    break;
            }

        }

        addNewTag(tag) {
            this.addTagToSourceArea(tag);
            this.addNewTagToOptionsArea(tag);
        }

        moveTagFromAvailableTosourceByIndex(index) {
            const tag = this.properties.availableTags.splice(index, 1)[0];
            this.addTagToSourceArea(tag);
            this.changeStateToSelected(tag);
        }

        addTagToSourceArea(tag) {
            const { source, el, dialogEl } = this.properties;

            source.push(tag);

            const spanEl = document.createElement('span');
            spanEl.setAttribute('class', 'tag selected');
            spanEl.innerHTML = tag + ' <i class="iconfont icon-remove"></i>';
            el.insertBefore(spanEl, el.getElementsByClassName('tag-input')[0]);

            const selectedEle = document.createElement('span');
            selectedEle.setAttribute('class', 'tag selected');
            selectedEle.innerHTML = tag + ' <i class="iconfont icon-remove"></i>';
            dialogEl.getElementsByClassName('selected-area')[0].appendChild(selectedEle);
        }

        addNewTagToOptionsArea(tag) {
            const option = document.createElement('span');
            option.setAttribute('class', 'tag selected');
            option.innerHTML = tag;

            const optionArea = this.properties.dialogEl.getElementsByClassName('options-area')[0];
            const options = optionArea.getElementsByClassName('tag');

            let index = -1;

            for (let i = 0, len = options.length; i < len; i++) {
                if (this.compareTags(options[i].innerText.trim(), tag)) {
                    index = i;
                    break;
                }
            }

            if (index === -1) {
                optionArea.insertBefore(option, optionArea.getElementsByClassName('dialog-tag-input')[0]);
            } else {
                optionArea.insertBefore(option, options[index]);
            }
        }

        changeStateToSelected(tag) {
            this.changeState(tag, 'tag selected');
        }

        changeStateToAvailable(tag) {
            this.changeState(tag, 'tag');
        }

        changeState(tag, state) {
            const option = this.findTagInOptionsArea(tag);
            if (option) {
                option.className = state;
            }
        }

        findTagInOptionsArea(tag) {
            const optionArea = this.properties.dialogEl.getElementsByClassName('options-area')[0];

            return [...optionArea.getElementsByClassName('tag')].find(function (el) {
                return el.innerText.trim() === tag;
            });
        }

        cleanWidget() {
            this.properties.el.getElementsByClassName('tag-input')[0].value = '';
        }

        cleanDialog() {
            this.properties.dialogEl.getElementsByClassName('dialog-tag-input')[0].value = '';
        }

        toggleTagState(target) {
            const tag = target.innerText;
            if (target.className === 'tag') {
                //check maxNum
                const { source, maxNum } = this.properties;
                if (maxNum > 0 && source.length >= maxNum) {
                    return;
                }
                target.className = 'tag selected';
                this.addTagToSourceArea(tag);
            } else {
                target.className = 'tag';
                this.removeTagFromSourceArea(tag);
            }
        }

        removeTag(target) {
            //remove tag from dom
            let index = 0;
            for (let e = target.parentNode.previousSibling; e != null;) {
                e = e.previousSibling;
                ++index;
            }
            this.removeTagFromSourceByIndex(index);
        }

        removeLastTag() {
            const { source } = this.properties;
            if (source.length > 0) {
                this.removeTagFromSourceByIndex(source.length - 1);
            }
        }

        removeTagFromSourceArea(tag) {
            const index = this.properties.source.findIndex(op => op === tag);
            this.removeTagFromSourceAreaByIndex(index);
        }

        removeTagFromSourceAreaByIndex(index) {
            const { source, availableTags, el, dialogEl } = this.properties;
            availableTags.push(source[index]);
            source.splice(index, 1);

            el.getElementsByClassName('tag')[index].remove();
            dialogEl.getElementsByClassName('selected-area')[0].getElementsByClassName('tag')[index].remove();
        }

        removeTagFromSourceByIndex(index) {
            const tag = this.properties.source[index];

            this.removeTagFromSourceAreaByIndex(index);

            this.changeStateToAvailable(tag);
        }

        compareTags(tagA, tagB) {
            return tagA > tagB;
        }

        updateOptions(options = {}) {
            const properties = this.properties;

            let { source, availableTags, allowCreate, maxNum, separator, enterSplitEnable, lang, readonly } = options;

            if (typeof allowCreate !== 'undefined') {
                properties.allowCreate = !!allowCreate;
            }

            if (typeof maxNum !== 'undefined') {
                maxNum = + maxNum;
                if (isNaN(maxNum)) {
                    maxNum = 0;
                }
                properties.maxNum = maxNum;
            }

            if (typeof separator !== 'undefined') {
                if (typeof separator !== 'string' || separator.length !== 1) {
                    throw new Error('separator should be a character.')
                }

                properties.separator = separator;
            }

            if (typeof enterSplitEnable !== 'undefined') {
                properties.enterSplitEnable = !!enterSplitEnable;
            }

            if (typeof lang !== 'undefined') {
                if (!language.hasOwnProperty(lang)) {
                    lang = AutocompleteTags.defaultLanguage;
                }
                properties.lang = lang;
                //TODO
            }

            if (typeof readonly !== 'undefined') {
                properties.readonly = !!readonly;
                //TODO
            }

            if (typeof source !== 'undefined') {
                if (typeof availableTags !== 'undefined') {
                    this.updateSourceAndAvailableTags(source, availableTags);
                } else {
                    this.updateSource(source);
                }
            } else if (typeof availableTags !== 'undefined') {
                this.updateAvailableTags(availableTags);
            }

        }

        refresh() {
            const { source, availableTags } = this.properties;

            this.updateSourceArea(source);
            this.updateAvailArea(availableTags);
            this.updateAllArea(source, availableTags)
        }

        updateSourceAndAvailableTags(source, availableTags) {
            this.properties.source = source = this.getStrArrayBySource(source, 'source');
            this.properties.availableTags = this.getStrArrayBySource(availableTags, 'availableTags').filter(op => source.indexOf(op) === -1).sort();

            this.refresh();
        }

        updateSource(source) {
            this.properties.source = source = this.getStrArrayBySource(source, 'source');
            this.properties.availableTags = this.properties.availableTags.filter(op => source.indexOf(op) === -1).sort();

            this.refresh();
        }

        updateAvailableTags(availableTags) {
            const { source } = this.properties;
            this.properties.availableTags = this.getStrArrayBySource(availableTags, 'availableTags').filter(op => source.indexOf(op) === -1).sort();

            this.updateAvailArea(availableTags);
            this.updateAllArea(source, availableTags)
        }

        updateSourceArea(source) {
            const { dialogEl, el } = this.properties;

            let sourceHtml = '';
            for (let tag of source) {
                sourceHtml += '<span class="tag selected">' + tag + ' <i class="iconfont icon-remove"></i></span>';
            }

            el.innerHTML = sourceHtml + '<input type="text" class="tag-input"><i class="iconfont icon-plus" title="Add"></i>';
            el.getElementsByClassName('tag-input')[0].addEventListener('keydown', event => this.handleInput(event), false);

            dialogEl.getElementsByClassName('selected-area')[0].innerHTML = sourceHtml;
        }

        updateAvailArea(availableTags) {
            //TODO
        }

        updateAllArea(source, availableTags) {
            const { dialogEl } = this.properties;

            let allHtml = ''
                , allOptions = [];

            for (let tag of source) {
                allOptions.push({
                    tag,
                    selected: 1,
                });
            }

            for (let tag of availableTags) {
                allOptions.push({
                    tag,
                    selected: 0,
                });
            }

            allOptions.sort((a, b) => this.compareTags(a.tag, b.tag));

            for (let op of allOptions) {
                if (op.selected) {
                    allHtml += '<span class="tag selected">' + op.tag + '</span>';
                } else {
                    allHtml += '<span class="tag">' + op.tag + '</span>';
                }
            }
            dialogEl.getElementsByClassName('options-area')[0].innerHTML = allHtml + '<input type="text" placeholder="Add a new one" title="Enter to add" class="dialog-tag-input">';
            dialogEl.getElementsByClassName('dialog-tag-input')[0].addEventListener('keydown', event => this.handleDialogInput(event), false);
        }

        getStrArrayBySource(source, propertyName) {
            let arr = [];
            if (source) {
                if (!Array.isArray(source)) {
                    throw new Error(propertyName + ' should be a array');
                }
                for (let op of source) {
                    if (typeof op === 'string') {
                        arr.push(op);
                    }
                }
            }
            return arr;
        }
    }

    /** 
	 * 标签自动补全
	 * 
	 * @param {string} selector - CSS选择器
	 * 
	 * @param {object} [options = {}] - 配置项
	 * @param {string[]} [options.source = []] - 已选标签
	 * @param {string[]} [options.availableTags = []] - 可用标签
	 * @param {boolean} [options.allowCreate = true] - 是否可添加新标签
	 * @param {number} [options.maxNum = 0] - 最大可选择数目(为非正数时不限制数目)
	 * @param {string} [options.separator = ','] - 分割字符(可见字符)
	 * @param {boolean} [options.enterSplitEnable = true] - 是否Enter分割
	 * @param {enum} [options.lang = language['en']] - 语言
	 * @param {boolean} [options.readonly = false] - 只读
	 * 
	 * @function
	 * 功能点
	 * 1.显示已选标签，按照它的添加顺序排列。
	 * 2.显示可用标签时，按照字母序排列。
	 * 3.可在输入框添加新的标签。当在输入框中输入分割字符时，分割字符前的值将作为新标签的值。
	 * 4.可在提示的下拉框中选择可用的标签。可通过上下箭头选择，点击或Enter确认。当输入框中有输入值时，根据该值进行过滤。
	 * 5.可点击‘+’，在弹出的对话框中选择。
	 * 6.弹出对话框中的输入框只通过Enter确认输入新标签。
	 * 7.添加的新标签不能和已有标签重复，但可是可选标签中存在的。如果这个标签是个新标签，即不存在可选标签中
	 * 8.只读
	 * 9.配置刷新
     * 10.多语言，国际化 
	 */
    function AutocompleteTags(selector, options) {
        const helper = new TagsHelper(selector, options);
        const properties = helper.getProperties();

        const widget = {
            get id() {
                return properties.widgetId;
            },
            get source() {
                return properties.source;
            },
            get availableTags() {
                return properties.availableTags;
            },
            get dialogId() {
                return properties.dialogId;
            },
            updateOptions: options => helper.updateOptions(options),
            updateSource: source => helper.updateSource(source),
            updateAvailableTags: availableTags => helper.updateAvailableTags(availableTags),
        }

        helper.initDOM();

        return Object.freeze(widget);
    }

    AutocompleteTags.lang = language;

    AutocompleteTags.defaultLanguage = (function () {
        let localLang = navigator.language;
        if (localLang) {
            for (let lang of Object.getOwnPropertyNames(language)) {
                if (lang.toLowerCase() === localLang.toLowerCase()) {
                    return language[lang];
                }
            }
        }
        return language.en;
    }
    );

    window.AutocompleteTags = AutocompleteTags;

}
)();
