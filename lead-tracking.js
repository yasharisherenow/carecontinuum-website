/**
 * Lead attribution tracking.
 *
 * Captures UTM campaign parameters from the landing URL, remembers them for the session so they survive
 * internal navigation before the visitor submits, and injects an individual
 * hidden <input> for each value into every <form> on the page. Each parameter
 * is submitted to Formspree as its own field so it can be tracked separately.
 */
(function () {
    'use strict';

    // Parameters captured as their own form field.
    var TRACKED_PARAMS = [
        'utm_source',
        'utm_medium',
        'utm_campaign',
        'utm_content',
        'utm_term',
        'utm_id',
        'landing_page',
        'referrer'
    ];

    var STORAGE_KEY = 'carecontinuum_attribution';

    function readStored() {
        try {
            return JSON.parse(window.sessionStorage.getItem(STORAGE_KEY)) || {};
        } catch (e) {
            return {};
        }
    }

    function writeStored(data) {
        try {
            window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(data));
        } catch (e) {
            /* storage unavailable (private mode) â€” fall back to in-memory only */
        }
    }

    function collect() {
        var stored = readStored();
        var params = new URLSearchParams(window.location.search);

        // Any param present in the URL wins (and is remembered first-touch).
        params.forEach(function (value, key) {
            if (value !== '' && (TRACKED_PARAMS.indexOf(key) !== -1 || key.indexOf('utm_') === 0)) {
                stored[key] = value;
            }
        });

        // Landing page + referrer are first-touch only.
        if (!stored.landing_page) stored.landing_page = window.location.href;
        if (!stored.referrer && document.referrer) stored.referrer = document.referrer;

        writeStored(stored);
        return stored;
    }

    function injectInto(form, data) {
        // Always emit the predefined set (empty when unknown) so Formspree
        // submissions have a consistent shape, plus any extra utm_* captured.
        var fields = TRACKED_PARAMS.slice();
        Object.keys(data).forEach(function (key) {
            if (fields.indexOf(key) === -1) fields.push(key);
        });

        fields.forEach(function (name) {
            var input = form.querySelector('input[name="' + name + '"]');
            if (!input) {
                input = document.createElement('input');
                input.type = 'hidden';
                input.name = name;
                form.appendChild(input);
            }
            input.value = data[name] || '';
        });
    }

    function run() {
        var data = collect();
        var forms = document.querySelectorAll('form');
        for (var i = 0; i < forms.length; i++) {
            injectInto(forms[i], data);
        }
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', run);
    } else {
        run();
    }
})();

