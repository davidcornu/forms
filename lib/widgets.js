/*jslint node: true */
'use strict';
var htmlEscape = require('./htmlEscape');

// generates a string for common widget attributes
var attrs = function (a) {
    if (typeof a.id === 'boolean') {
        a.id = a.id ? 'id_' + a.name : null;
    }
    if (Array.isArray(a.classes) && a.classes.length > 0) {
        a['class'] = a.classes.join(' ');
    }
    a.classes = null;
    var pairs = [];
    Object.keys(a).map(function (field) {
        var value = a[field];
        if (typeof value === 'boolean') {
            value = value ? field : null;
        } else if (typeof value === 'string' && value.length === 0) {
            value = null;
        } else if (typeof value === 'number' && isNaN(value)) {
            value = null;
        }
        if (typeof value !== 'undefined' && value !== null) {
            pairs.push(htmlEscape(field) + '="' + htmlEscape(value) + '"');
        }
    });
    return pairs.length > 0 ? ' ' + pairs.join(' ') : '';
};

var tag = function tag(tagName, attrsMap, content) {
    tagName = htmlEscape(tagName);
    var attrsHTML = !Array.isArray(attrsMap) ? attrs(attrsMap) :
        attrsMap.reduce(function (html, attrsMap) {
            return html + attrs(attrsMap);
        }, '');
    return '<' + tagName + attrsHTML + '>' + content + '</' + tagName + '>';
};

var singleTag = function tag(tagName, attrsMap) {
    tagName = htmlEscape(tagName);
    var attrsHTML = !Array.isArray(attrsMap) ? attrs(attrsMap) :
        attrsMap.reduce(function (html, attrsMap) {
            return html + attrs(attrsMap);
        }, '');
    return '<' + tagName + attrsHTML + ' />';
};

// used to generate different input elements varying only by type attribute
var input = function (type) {
    var dataRegExp = /^data-[a-z]+$/,
        ariaRegExp = /^aria-[a-z]+$/,
        legalAttrs = ['autocomplete', 'autocorrect', 'autofocus', 'autosuggest', 'checked', 'dirname', 'disabled', 'list', 'max', 'maxlength', 'min', 'multiple', 'novalidate', 'pattern', 'placeholder', 'readonly', 'required', 'size', 'step'],
        ignoreAttrs = ['id', 'name', 'class', 'classes', 'type', 'value'];
    return function (opt) {
        if (!opt) { opt = {}; }
        var w = {
            classes: opt.classes,
            type: type
        };
        var userAttrs = Object.keys(opt).reduce(function (attrs, k) {
            if ((ignoreAttrs.indexOf(k) === -1 && legalAttrs.indexOf(k) > -1) || dataRegExp.test(k) || ariaRegExp.test(k)) {
                attrs[k] = opt[k];
            }
            return attrs;
        }, {});
        w.toHTML = function (name, f) {
            if (!f) { f = {}; }
            return singleTag('input', [{
                type: type,
                name: name,
                id: f.id || true,
                classes: w.classes,
                value: f.value || null
            }, userAttrs]);
        };
        w.getDataRegExp = function () {
            return dataRegExp;
        };
        w.getAriaRegExp = function () {
            return ariaRegExp;
        };
        return w;
    };
};

exports.text = input('text');
exports.password = input('password');
exports.hidden = input('hidden');
exports.color = input('color');
exports.date = input('date');

exports.checkbox = function (opt) {
    if (!opt) { opt = {}; }
    var w = {
        classes: opt.classes,
        type: 'checkbox'
    };
    w.toHTML = function (name, f) {
        if (!f) { f = {}; }
        return singleTag('input', {
            type: 'checkbox',
            name: name,
            id: f.id || true,
            classes: w.classes,
            checked: !!f.value,
            value: 'on'
        });
    };
    return w;
};

exports.select = function (opt) {
    if (!opt) { opt = {}; }
    var w = {
        classes: opt.classes,
        type: 'select'
    };
    w.toHTML = function (name, f) {
        if (!f) { f = {}; }
        var optionsHTML = Object.keys(f.choices).reduce(function (html, k) {
            return html + tag('option', {
                value: k,
                selected: !!(f.value && f.value === k)
            }, f.choices[k]);
        }, '');
        return tag('select', {
            name: name,
            id: f.id || true,
            classes: w.classes
        }, optionsHTML);
    };
    return w;
};

exports.textarea = function (opt) {
    if (!opt) { opt = {}; }
    var w = {
        classes: opt.classes,
        type: 'textarea'
    };
    w.toHTML = function (name, f) {
        if (!f) { f = {}; }
        return tag('textarea', {
            name: name,
            id: f.id || true,
            classes: w.classes,
            rows: opt.rows || null,
            cols: opt.cols || null
        }, f.value || '');
    };
    return w;
};

exports.multipleCheckbox = function (opt) {
    if (!opt) { opt = {}; }
    var w = {
        classes: opt.classes,
        type: 'multipleCheckbox'
    };
    w.toHTML = function (name, f) {
        if (!f) { f = {}; }
        return Object.keys(f.choices).reduce(function (html, k) {
            // input element
            var id = f.id ? f.id + '_' + k : 'id_' + name + '_' + k;
            var checked = Array.isArray(f.value) ? f.value.some(function (v) { return v === k; }) : f.value === k;

            html += singleTag('input', {
                type: 'checkbox',
                name: name,
                id: id,
                classes: w.classes,
                value: k,
                checked: !!checked
            });

            // label element
            html += tag('label', {for: id}, f.choices[k]);

            return html;
        }, '');
    };
    return w;
};

exports.label = function (opt) {
    if (!opt) { opt = {}; }
    var w = {
        classes: opt.classes || []
    };
    w.toHTML = function (forID, f) {
        var labelAttrs = {
            for: forID,
            classes: w.classes
        };
        return tag('label', labelAttrs, opt.content);
    };
    return w;
};

exports.multipleRadio = function (opt) {
    if (!opt) { opt = {}; }
    var w = {
        classes: opt.classes,
        type: 'multipleRadio'
    };
    w.toHTML = function (name, f) {
        if (!f) { f = {}; }
        return Object.keys(f.choices).reduce(function (html, k) {
            // input element
            var id = f.id ? f.id + '_' + k : 'id_' + name + '_' + k;
            var checked = Array.isArray(f.value) ? f.value.some(function (v) { return v === k; }) : f.value === k;

            html += singleTag('input', {
                type: 'radio',
                name: name,
                id: id,
                classes: w.classes,
                value: k,
                checked: !!checked
            });
            // label element
            html += tag('label', {for: id}, f.choices[k]);

            return html;
        }, '');
    };
    return w;
};

exports.multipleSelect = function (opt) {
    if (!opt) { opt = {}; }
    var w = {
        classes: opt.classes,
        type: 'multipleSelect'
    };
    w.toHTML = function (name, f) {
        if (!f) { f = {}; }
        var optionsHTML = Object.keys(f.choices).reduce(function (html, k) {
            var selected = Array.isArray(f.value) ? f.value.some(function (v) { return v === k; }) : (f.value && f.value === k);
            return html + tag('option', {
                value: k,
                selected: !!selected
            }, f.choices[k]);
        }, '');
        return tag('select', {
            multiple: true,
            name: name,
            id: f.id || true,
            classes: w.classes
        }, optionsHTML);
    };
    return w;
};

