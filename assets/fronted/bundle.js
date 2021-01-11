
(function(l, r) { if (l.getElementById('livereloadscript')) return; r = l.createElement('script'); r.async = 1; r.src = '//' + (window.location.host || 'localhost').split(':')[0] + ':35729/livereload.js?snipver=1'; r.id = 'livereloadscript'; l.getElementsByTagName('head')[0].appendChild(r) })(window.document);
var app = (function () {
    'use strict';

    function noop() { }
    function assign(tar, src) {
        // @ts-ignore
        for (const k in src)
            tar[k] = src[k];
        return tar;
    }
    function add_location(element, file, line, column, char) {
        element.__svelte_meta = {
            loc: { file, line, column, char }
        };
    }
    function run(fn) {
        return fn();
    }
    function blank_object() {
        return Object.create(null);
    }
    function run_all(fns) {
        fns.forEach(run);
    }
    function is_function(thing) {
        return typeof thing === 'function';
    }
    function safe_not_equal(a, b) {
        return a != a ? b == b : a !== b || ((a && typeof a === 'object') || typeof a === 'function');
    }
    function is_empty(obj) {
        return Object.keys(obj).length === 0;
    }
    function create_slot(definition, ctx, $$scope, fn) {
        if (definition) {
            const slot_ctx = get_slot_context(definition, ctx, $$scope, fn);
            return definition[0](slot_ctx);
        }
    }
    function get_slot_context(definition, ctx, $$scope, fn) {
        return definition[1] && fn
            ? assign($$scope.ctx.slice(), definition[1](fn(ctx)))
            : $$scope.ctx;
    }
    function get_slot_changes(definition, $$scope, dirty, fn) {
        if (definition[2] && fn) {
            const lets = definition[2](fn(dirty));
            if ($$scope.dirty === undefined) {
                return lets;
            }
            if (typeof lets === 'object') {
                const merged = [];
                const len = Math.max($$scope.dirty.length, lets.length);
                for (let i = 0; i < len; i += 1) {
                    merged[i] = $$scope.dirty[i] | lets[i];
                }
                return merged;
            }
            return $$scope.dirty | lets;
        }
        return $$scope.dirty;
    }
    function update_slot(slot, slot_definition, ctx, $$scope, dirty, get_slot_changes_fn, get_slot_context_fn) {
        const slot_changes = get_slot_changes(slot_definition, $$scope, dirty, get_slot_changes_fn);
        if (slot_changes) {
            const slot_context = get_slot_context(slot_definition, ctx, $$scope, get_slot_context_fn);
            slot.p(slot_context, slot_changes);
        }
    }
    function null_to_empty(value) {
        return value == null ? '' : value;
    }
    function action_destroyer(action_result) {
        return action_result && is_function(action_result.destroy) ? action_result.destroy : noop;
    }

    function append(target, node) {
        target.appendChild(node);
    }
    function insert(target, node, anchor) {
        target.insertBefore(node, anchor || null);
    }
    function detach(node) {
        node.parentNode.removeChild(node);
    }
    function destroy_each(iterations, detaching) {
        for (let i = 0; i < iterations.length; i += 1) {
            if (iterations[i])
                iterations[i].d(detaching);
        }
    }
    function element(name) {
        return document.createElement(name);
    }
    function text(data) {
        return document.createTextNode(data);
    }
    function space() {
        return text(' ');
    }
    function empty() {
        return text('');
    }
    function listen(node, event, handler, options) {
        node.addEventListener(event, handler, options);
        return () => node.removeEventListener(event, handler, options);
    }
    function prevent_default(fn) {
        return function (event) {
            event.preventDefault();
            // @ts-ignore
            return fn.call(this, event);
        };
    }
    function attr(node, attribute, value) {
        if (value == null)
            node.removeAttribute(attribute);
        else if (node.getAttribute(attribute) !== value)
            node.setAttribute(attribute, value);
    }
    function children(element) {
        return Array.from(element.childNodes);
    }
    function set_style(node, key, value, important) {
        node.style.setProperty(key, value, important ? 'important' : '');
    }
    function toggle_class(element, name, toggle) {
        element.classList[toggle ? 'add' : 'remove'](name);
    }
    function custom_event(type, detail) {
        const e = document.createEvent('CustomEvent');
        e.initCustomEvent(type, false, false, detail);
        return e;
    }

    let current_component;
    function set_current_component(component) {
        current_component = component;
    }
    function get_current_component() {
        if (!current_component)
            throw new Error('Function called outside component initialization');
        return current_component;
    }
    function onMount(fn) {
        get_current_component().$$.on_mount.push(fn);
    }
    function afterUpdate(fn) {
        get_current_component().$$.after_update.push(fn);
    }
    function createEventDispatcher() {
        const component = get_current_component();
        return (type, detail) => {
            const callbacks = component.$$.callbacks[type];
            if (callbacks) {
                // TODO are there situations where events could be dispatched
                // in a server (non-DOM) environment?
                const event = custom_event(type, detail);
                callbacks.slice().forEach(fn => {
                    fn.call(component, event);
                });
            }
        };
    }

    const dirty_components = [];
    const binding_callbacks = [];
    const render_callbacks = [];
    const flush_callbacks = [];
    const resolved_promise = Promise.resolve();
    let update_scheduled = false;
    function schedule_update() {
        if (!update_scheduled) {
            update_scheduled = true;
            resolved_promise.then(flush);
        }
    }
    function add_render_callback(fn) {
        render_callbacks.push(fn);
    }
    function add_flush_callback(fn) {
        flush_callbacks.push(fn);
    }
    let flushing = false;
    const seen_callbacks = new Set();
    function flush() {
        if (flushing)
            return;
        flushing = true;
        do {
            // first, call beforeUpdate functions
            // and update components
            for (let i = 0; i < dirty_components.length; i += 1) {
                const component = dirty_components[i];
                set_current_component(component);
                update(component.$$);
            }
            set_current_component(null);
            dirty_components.length = 0;
            while (binding_callbacks.length)
                binding_callbacks.pop()();
            // then, once components are updated, call
            // afterUpdate functions. This may cause
            // subsequent updates...
            for (let i = 0; i < render_callbacks.length; i += 1) {
                const callback = render_callbacks[i];
                if (!seen_callbacks.has(callback)) {
                    // ...so guard against infinite loops
                    seen_callbacks.add(callback);
                    callback();
                }
            }
            render_callbacks.length = 0;
        } while (dirty_components.length);
        while (flush_callbacks.length) {
            flush_callbacks.pop()();
        }
        update_scheduled = false;
        flushing = false;
        seen_callbacks.clear();
    }
    function update($$) {
        if ($$.fragment !== null) {
            $$.update();
            run_all($$.before_update);
            const dirty = $$.dirty;
            $$.dirty = [-1];
            $$.fragment && $$.fragment.p($$.ctx, dirty);
            $$.after_update.forEach(add_render_callback);
        }
    }
    const outroing = new Set();
    let outros;
    function group_outros() {
        outros = {
            r: 0,
            c: [],
            p: outros // parent group
        };
    }
    function check_outros() {
        if (!outros.r) {
            run_all(outros.c);
        }
        outros = outros.p;
    }
    function transition_in(block, local) {
        if (block && block.i) {
            outroing.delete(block);
            block.i(local);
        }
    }
    function transition_out(block, local, detach, callback) {
        if (block && block.o) {
            if (outroing.has(block))
                return;
            outroing.add(block);
            outros.c.push(() => {
                outroing.delete(block);
                if (callback) {
                    if (detach)
                        block.d(1);
                    callback();
                }
            });
            block.o(local);
        }
    }

    const globals = (typeof window !== 'undefined'
        ? window
        : typeof globalThis !== 'undefined'
            ? globalThis
            : global);

    function bind(component, name, callback) {
        const index = component.$$.props[name];
        if (index !== undefined) {
            component.$$.bound[index] = callback;
            callback(component.$$.ctx[index]);
        }
    }
    function create_component(block) {
        block && block.c();
    }
    function mount_component(component, target, anchor) {
        const { fragment, on_mount, on_destroy, after_update } = component.$$;
        fragment && fragment.m(target, anchor);
        // onMount happens before the initial afterUpdate
        add_render_callback(() => {
            const new_on_destroy = on_mount.map(run).filter(is_function);
            if (on_destroy) {
                on_destroy.push(...new_on_destroy);
            }
            else {
                // Edge case - component was destroyed immediately,
                // most likely as a result of a binding initialising
                run_all(new_on_destroy);
            }
            component.$$.on_mount = [];
        });
        after_update.forEach(add_render_callback);
    }
    function destroy_component(component, detaching) {
        const $$ = component.$$;
        if ($$.fragment !== null) {
            run_all($$.on_destroy);
            $$.fragment && $$.fragment.d(detaching);
            // TODO null out other refs, including component.$$ (but need to
            // preserve final state?)
            $$.on_destroy = $$.fragment = null;
            $$.ctx = [];
        }
    }
    function make_dirty(component, i) {
        if (component.$$.dirty[0] === -1) {
            dirty_components.push(component);
            schedule_update();
            component.$$.dirty.fill(0);
        }
        component.$$.dirty[(i / 31) | 0] |= (1 << (i % 31));
    }
    function init(component, options, instance, create_fragment, not_equal, props, dirty = [-1]) {
        const parent_component = current_component;
        set_current_component(component);
        const prop_values = options.props || {};
        const $$ = component.$$ = {
            fragment: null,
            ctx: null,
            // state
            props,
            update: noop,
            not_equal,
            bound: blank_object(),
            // lifecycle
            on_mount: [],
            on_destroy: [],
            before_update: [],
            after_update: [],
            context: new Map(parent_component ? parent_component.$$.context : []),
            // everything else
            callbacks: blank_object(),
            dirty,
            skip_bound: false
        };
        let ready = false;
        $$.ctx = instance
            ? instance(component, prop_values, (i, ret, ...rest) => {
                const value = rest.length ? rest[0] : ret;
                if ($$.ctx && not_equal($$.ctx[i], $$.ctx[i] = value)) {
                    if (!$$.skip_bound && $$.bound[i])
                        $$.bound[i](value);
                    if (ready)
                        make_dirty(component, i);
                }
                return ret;
            })
            : [];
        $$.update();
        ready = true;
        run_all($$.before_update);
        // `false` as a special case of no DOM component
        $$.fragment = create_fragment ? create_fragment($$.ctx) : false;
        if (options.target) {
            if (options.hydrate) {
                const nodes = children(options.target);
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.l(nodes);
                nodes.forEach(detach);
            }
            else {
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.c();
            }
            if (options.intro)
                transition_in(component.$$.fragment);
            mount_component(component, options.target, options.anchor);
            flush();
        }
        set_current_component(parent_component);
    }
    /**
     * Base class for Svelte components. Used when dev=false.
     */
    class SvelteComponent {
        $destroy() {
            destroy_component(this, 1);
            this.$destroy = noop;
        }
        $on(type, callback) {
            const callbacks = (this.$$.callbacks[type] || (this.$$.callbacks[type] = []));
            callbacks.push(callback);
            return () => {
                const index = callbacks.indexOf(callback);
                if (index !== -1)
                    callbacks.splice(index, 1);
            };
        }
        $set($$props) {
            if (this.$$set && !is_empty($$props)) {
                this.$$.skip_bound = true;
                this.$$set($$props);
                this.$$.skip_bound = false;
            }
        }
    }

    function dispatch_dev(type, detail) {
        document.dispatchEvent(custom_event(type, Object.assign({ version: '3.31.2' }, detail)));
    }
    function append_dev(target, node) {
        dispatch_dev('SvelteDOMInsert', { target, node });
        append(target, node);
    }
    function insert_dev(target, node, anchor) {
        dispatch_dev('SvelteDOMInsert', { target, node, anchor });
        insert(target, node, anchor);
    }
    function detach_dev(node) {
        dispatch_dev('SvelteDOMRemove', { node });
        detach(node);
    }
    function listen_dev(node, event, handler, options, has_prevent_default, has_stop_propagation) {
        const modifiers = options === true ? ['capture'] : options ? Array.from(Object.keys(options)) : [];
        if (has_prevent_default)
            modifiers.push('preventDefault');
        if (has_stop_propagation)
            modifiers.push('stopPropagation');
        dispatch_dev('SvelteDOMAddEventListener', { node, event, handler, modifiers });
        const dispose = listen(node, event, handler, options);
        return () => {
            dispatch_dev('SvelteDOMRemoveEventListener', { node, event, handler, modifiers });
            dispose();
        };
    }
    function attr_dev(node, attribute, value) {
        attr(node, attribute, value);
        if (value == null)
            dispatch_dev('SvelteDOMRemoveAttribute', { node, attribute });
        else
            dispatch_dev('SvelteDOMSetAttribute', { node, attribute, value });
    }
    function prop_dev(node, property, value) {
        node[property] = value;
        dispatch_dev('SvelteDOMSetProperty', { node, property, value });
    }
    function set_data_dev(text, data) {
        data = '' + data;
        if (text.wholeText === data)
            return;
        dispatch_dev('SvelteDOMSetData', { node: text, data });
        text.data = data;
    }
    function validate_each_argument(arg) {
        if (typeof arg !== 'string' && !(arg && typeof arg === 'object' && 'length' in arg)) {
            let msg = '{#each} only iterates over array-like objects.';
            if (typeof Symbol === 'function' && arg && Symbol.iterator in arg) {
                msg += ' You can use a spread to convert this iterable into an array.';
            }
            throw new Error(msg);
        }
    }
    function validate_slots(name, slot, keys) {
        for (const slot_key of Object.keys(slot)) {
            if (!~keys.indexOf(slot_key)) {
                console.warn(`<${name}> received an unexpected slot "${slot_key}".`);
            }
        }
    }
    /**
     * Base class for Svelte components with some minor dev-enhancements. Used when dev=true.
     */
    class SvelteComponentDev extends SvelteComponent {
        constructor(options) {
            if (!options || (!options.target && !options.$$inline)) {
                throw new Error("'target' is a required option");
            }
            super();
        }
        $destroy() {
            super.$destroy();
            this.$destroy = () => {
                console.warn('Component was already destroyed'); // eslint-disable-line no-console
            };
        }
        $capture_state() { }
        $inject_state() { }
    }

    /* src\component\TitleBar.svelte generated by Svelte v3.31.2 */

    const { console: console_1 } = globals;
    const file = "src\\component\\TitleBar.svelte";

    function create_fragment(ctx) {
    	let div33;
    	let div0;
    	let t0;
    	let div1;
    	let t1;
    	let div24;
    	let div15;
    	let div2;
    	let t3;
    	let div14;
    	let div3;
    	let t5;
    	let div4;
    	let t7;
    	let div5;
    	let t9;
    	let div6;
    	let t11;
    	let div7;
    	let t13;
    	let div8;
    	let t15;
    	let div9;
    	let t17;
    	let div10;
    	let t19;
    	let div11;
    	let t21;
    	let div12;
    	let t22;
    	let div13;
    	let t24;
    	let div23;
    	let div16;
    	let t26;
    	let div22;
    	let div17;
    	let t28;
    	let div18;
    	let t30;
    	let div19;
    	let t32;
    	let div20;
    	let t33;
    	let div21;
    	let t35;
    	let div25;
    	let t37;
    	let div32;
    	let div27;
    	let div26;
    	let t38;
    	let div29;
    	let div28;
    	let t39;
    	let div31;
    	let div30;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			div33 = element("div");
    			div0 = element("div");
    			t0 = space();
    			div1 = element("div");
    			t1 = space();
    			div24 = element("div");
    			div15 = element("div");
    			div2 = element("div");
    			div2.textContent = "系统";
    			t3 = space();
    			div14 = element("div");
    			div3 = element("div");
    			div3.textContent = "设置";
    			t5 = space();
    			div4 = element("div");
    			div4.textContent = "切换主题";
    			t7 = space();
    			div5 = element("div");
    			div5.textContent = "控制台";
    			t9 = space();
    			div6 = element("div");
    			div6.textContent = "系统日志";
    			t11 = space();
    			div7 = element("div");
    			div7.textContent = "操作历史";
    			t13 = space();
    			div8 = element("div");
    			div8.textContent = "更新日志";
    			t15 = space();
    			div9 = element("div");
    			div9.textContent = "重新登录";
    			t17 = space();
    			div10 = element("div");
    			div10.textContent = "停止loading";
    			t19 = space();
    			div11 = element("div");
    			div11.textContent = "重新启动";
    			t21 = space();
    			div12 = element("div");
    			t22 = space();
    			div13 = element("div");
    			div13.textContent = "退出";
    			t24 = space();
    			div23 = element("div");
    			div16 = element("div");
    			div16.textContent = "帮助";
    			t26 = space();
    			div22 = element("div");
    			div17 = element("div");
    			div17.textContent = "Github";
    			t28 = space();
    			div18 = element("div");
    			div18.textContent = "教程";
    			t30 = space();
    			div19 = element("div");
    			div19.textContent = "文档";
    			t32 = space();
    			div20 = element("div");
    			t33 = space();
    			div21 = element("div");
    			div21.textContent = "关于";
    			t35 = space();
    			div25 = element("div");
    			div25.textContent = "欢迎使用 - 模拟终端";
    			t37 = space();
    			div32 = element("div");
    			div27 = element("div");
    			div26 = element("div");
    			t38 = space();
    			div29 = element("div");
    			div28 = element("div");
    			t39 = space();
    			div31 = element("div");
    			div30 = element("div");
    			attr_dev(div0, "class", "window-appicon svelte-6yd5jl");
    			set_style(div0, "-webkit-app-region", "drag");
    			add_location(div0, file, 229, 4, 6801);
    			attr_dev(div1, "class", "titlebar-drag-region svelte-6yd5jl");
    			add_location(div1, file, 230, 4, 6870);
    			attr_dev(div2, "class", "menubar-menu-title svelte-6yd5jl");
    			attr_dev(div2, "role", "none");
    			attr_dev(div2, "aria-hidden", "true");
    			add_location(div2, file, 234, 12, 7028);
    			attr_dev(div3, "class", "svelte-6yd5jl");
    			add_location(div3, file, 242, 16, 7345);
    			attr_dev(div4, "class", "svelte-6yd5jl");
    			add_location(div4, file, 243, 16, 7376);
    			attr_dev(div5, "class", "svelte-6yd5jl");
    			add_location(div5, file, 244, 16, 7447);
    			attr_dev(div6, "class", "svelte-6yd5jl");
    			add_location(div6, file, 245, 16, 7519);
    			attr_dev(div7, "class", "svelte-6yd5jl");
    			add_location(div7, file, 246, 16, 7552);
    			attr_dev(div8, "class", "svelte-6yd5jl");
    			add_location(div8, file, 247, 16, 7585);
    			attr_dev(div9, "class", "svelte-6yd5jl");
    			add_location(div9, file, 248, 16, 7618);
    			attr_dev(div10, "class", "svelte-6yd5jl");
    			add_location(div10, file, 249, 16, 7651);
    			attr_dev(div11, "class", "svelte-6yd5jl");
    			add_location(div11, file, 250, 16, 7689);
    			attr_dev(div12, "class", "separator svelte-6yd5jl");
    			add_location(div12, file, 251, 16, 7722);
    			attr_dev(div13, "class", "svelte-6yd5jl");
    			add_location(div13, file, 252, 16, 7764);
    			attr_dev(div14, "class", "menu-content svelte-6yd5jl");
    			set_style(div14, "display", /*systemFlag*/ ctx[3]);
    			add_location(div14, file, 241, 12, 7253);
    			attr_dev(div15, "class", "menubar-menu-button svelte-6yd5jl");
    			add_location(div15, file, 233, 8, 6981);
    			attr_dev(div16, "class", "menubar-menu-title svelte-6yd5jl");
    			attr_dev(div16, "role", "none");
    			attr_dev(div16, "aria-hidden", "true");
    			add_location(div16, file, 256, 12, 7899);
    			attr_dev(div17, "class", "svelte-6yd5jl");
    			add_location(div17, file, 264, 16, 8193);
    			attr_dev(div18, "class", "svelte-6yd5jl");
    			add_location(div18, file, 265, 16, 8228);
    			attr_dev(div19, "class", "svelte-6yd5jl");
    			add_location(div19, file, 266, 16, 8259);
    			attr_dev(div20, "class", "separator svelte-6yd5jl");
    			add_location(div20, file, 267, 16, 8290);
    			attr_dev(div21, "class", "svelte-6yd5jl");
    			add_location(div21, file, 268, 16, 8332);
    			attr_dev(div22, "class", "menu-content svelte-6yd5jl");
    			set_style(div22, "display", /*helpFlag*/ ctx[4]);
    			add_location(div22, file, 263, 12, 8122);
    			attr_dev(div23, "class", "menubar-menu-button svelte-6yd5jl");
    			add_location(div23, file, 255, 8, 7852);
    			attr_dev(div24, "class", "menubar svelte-6yd5jl");
    			attr_dev(div24, "role", "menubar");
    			set_style(div24, "height", "30px");
    			add_location(div24, file, 232, 4, 6913);
    			attr_dev(div25, "class", "window-title svelte-6yd5jl");
    			set_style(div25, "position", "absolute");
    			set_style(div25, "left", "50%");
    			set_style(div25, "transform", "translate(-50%, 0px)");
    			add_location(div25, file, 272, 4, 8399);
    			attr_dev(div26, "class", "window-icon window-minimize svelte-6yd5jl");
    			set_style(div26, "background", /*theme*/ ctx[0].colors["menu.foreground"]);
    			add_location(div26, file, 279, 12, 8685);
    			attr_dev(div27, "class", "window-icon-bg svelte-6yd5jl");
    			add_location(div27, file, 278, 8, 8611);
    			attr_dev(div28, "class", "window-icon window-max-restore svelte-6yd5jl");
    			set_style(div28, "background", /*theme*/ ctx[0].colors["menu.foreground"]);
    			toggle_class(div28, "window-maximize", !/*max*/ ctx[1]);
    			toggle_class(div28, "window-unmaximize", /*max*/ ctx[1]);
    			add_location(div28, file, 284, 12, 8913);
    			attr_dev(div29, "class", "window-icon-bg svelte-6yd5jl");
    			add_location(div29, file, 283, 8, 8850);
    			attr_dev(div30, "class", "window-icon window-close svelte-6yd5jl");
    			set_style(div30, "background", /*theme*/ ctx[0].colors["menu.foreground"]);
    			add_location(div30, file, 291, 12, 9269);
    			attr_dev(div31, "class", "window-icon-bg window-close-bg svelte-6yd5jl");
    			add_location(div31, file, 290, 8, 9182);
    			attr_dev(div32, "class", "window-controls-container svelte-6yd5jl");
    			add_location(div32, file, 277, 4, 8562);
    			attr_dev(div33, "class", "title-bar svelte-6yd5jl");
    			set_style(div33, "--title-bar-color", /*theme*/ ctx[0].colors["titleBar.activeForeground"]);
    			set_style(div33, "--title-bar-background", /*theme*/ ctx[0].colors["titleBar.activeBackground"]);
    			set_style(div33, "--title-menu-color", /*theme*/ ctx[0].colors["menu.foreground"]);
    			set_style(div33, "--title-menu-background", /*theme*/ ctx[0].colors["dropdown.background"]);
    			add_location(div33, file, 223, 0, 6485);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div33, anchor);
    			append_dev(div33, div0);
    			append_dev(div33, t0);
    			append_dev(div33, div1);
    			append_dev(div33, t1);
    			append_dev(div33, div24);
    			append_dev(div24, div15);
    			append_dev(div15, div2);
    			append_dev(div15, t3);
    			append_dev(div15, div14);
    			append_dev(div14, div3);
    			append_dev(div14, t5);
    			append_dev(div14, div4);
    			append_dev(div14, t7);
    			append_dev(div14, div5);
    			append_dev(div14, t9);
    			append_dev(div14, div6);
    			append_dev(div14, t11);
    			append_dev(div14, div7);
    			append_dev(div14, t13);
    			append_dev(div14, div8);
    			append_dev(div14, t15);
    			append_dev(div14, div9);
    			append_dev(div14, t17);
    			append_dev(div14, div10);
    			append_dev(div14, t19);
    			append_dev(div14, div11);
    			append_dev(div14, t21);
    			append_dev(div14, div12);
    			append_dev(div14, t22);
    			append_dev(div14, div13);
    			/*div14_binding*/ ctx[15](div14);
    			append_dev(div24, t24);
    			append_dev(div24, div23);
    			append_dev(div23, div16);
    			append_dev(div23, t26);
    			append_dev(div23, div22);
    			append_dev(div22, div17);
    			append_dev(div22, t28);
    			append_dev(div22, div18);
    			append_dev(div22, t30);
    			append_dev(div22, div19);
    			append_dev(div22, t32);
    			append_dev(div22, div20);
    			append_dev(div22, t33);
    			append_dev(div22, div21);
    			append_dev(div33, t35);
    			append_dev(div33, div25);
    			append_dev(div33, t37);
    			append_dev(div33, div32);
    			append_dev(div32, div27);
    			append_dev(div27, div26);
    			append_dev(div32, t38);
    			append_dev(div32, div29);
    			append_dev(div29, div28);
    			append_dev(div32, t39);
    			append_dev(div32, div31);
    			append_dev(div31, div30);

    			if (!mounted) {
    				dispose = [
    					listen_dev(div2, "click", /*toggleSystem*/ ctx[7], false, false, false),
    					listen_dev(div4, "click", /*click_handler*/ ctx[12], false, false, false),
    					listen_dev(div5, "click", /*click_handler_1*/ ctx[13], false, false, false),
    					listen_dev(div13, "click", /*click_handler_2*/ ctx[14], false, false, false),
    					listen_dev(div16, "click", /*toggleHelp*/ ctx[8], false, false, false),
    					listen_dev(div27, "click", /*click_handler_3*/ ctx[16], false, false, false),
    					listen_dev(div29, "click", /*toggleWin*/ ctx[6], false, false, false),
    					listen_dev(div31, "click", /*click_handler_4*/ ctx[17], false, false, false)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*systemFlag*/ 8) {
    				set_style(div14, "display", /*systemFlag*/ ctx[3]);
    			}

    			if (dirty & /*helpFlag*/ 16) {
    				set_style(div22, "display", /*helpFlag*/ ctx[4]);
    			}

    			if (dirty & /*theme*/ 1) {
    				set_style(div26, "background", /*theme*/ ctx[0].colors["menu.foreground"]);
    			}

    			if (dirty & /*theme*/ 1) {
    				set_style(div28, "background", /*theme*/ ctx[0].colors["menu.foreground"]);
    			}

    			if (dirty & /*max*/ 2) {
    				toggle_class(div28, "window-maximize", !/*max*/ ctx[1]);
    			}

    			if (dirty & /*max*/ 2) {
    				toggle_class(div28, "window-unmaximize", /*max*/ ctx[1]);
    			}

    			if (dirty & /*theme*/ 1) {
    				set_style(div30, "background", /*theme*/ ctx[0].colors["menu.foreground"]);
    			}

    			if (dirty & /*theme*/ 1) {
    				set_style(div33, "--title-bar-color", /*theme*/ ctx[0].colors["titleBar.activeForeground"]);
    			}

    			if (dirty & /*theme*/ 1) {
    				set_style(div33, "--title-bar-background", /*theme*/ ctx[0].colors["titleBar.activeBackground"]);
    			}

    			if (dirty & /*theme*/ 1) {
    				set_style(div33, "--title-menu-color", /*theme*/ ctx[0].colors["menu.foreground"]);
    			}

    			if (dirty & /*theme*/ 1) {
    				set_style(div33, "--title-menu-background", /*theme*/ ctx[0].colors["dropdown.background"]);
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div33);
    			/*div14_binding*/ ctx[15](null);
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("TitleBar", slots, []);
    	let { title } = $$props;
    	let { theme } = $$props;
    	let { msg } = $$props;
    	const win = require("electron").remote.getCurrentWindow();
    	const { app, dialog } = require("electron").remote;
    	let max = win.isMaximized();

    	function toggleWin() {
    		$$invalidate(1, max = !max);

    		if (win.isMaximized()) {
    			win.restore();
    		} else {
    			win.maximize();
    		}
    	}

    	function onResize() {
    		if (win.isMaximized()) {
    			$$invalidate(1, max = true);
    		} else {
    			$$invalidate(1, max = false);
    		}
    	}

    	window.onresize = onResize;
    	let system;
    	let systemFlag = "none", fileFlag = "none", helpFlag = "none";

    	window.onclick = function (event) {
    		console.log(event);
    		const target = event.target;

    		if (!target.matches(".menubar-menu-title")) {
    			$$invalidate(3, systemFlag = "none");
    			fileFlag = "none";
    			$$invalidate(4, helpFlag = "none");
    		}
    	};

    	function toggleSystem() {
    		fileFlag = "none";
    		$$invalidate(4, helpFlag = "none");
    		$$invalidate(3, systemFlag = "block");
    	}

    	function toggleFile() {
    		fileFlag = "block";
    		$$invalidate(4, helpFlag = "none");
    		$$invalidate(3, systemFlag = "none");
    	}

    	function toggleHelp() {
    		fileFlag = "none";
    		$$invalidate(4, helpFlag = "block");
    		$$invalidate(3, systemFlag = "none");
    	}

    	function systemClick(type) {
    		switch (type) {
    			case "theme":
    				break;
    			case "console":
    				win.webContents.openDevTools();
    				break;
    		}
    	}

    	const writable_props = ["title", "theme", "msg"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console_1.warn(`<TitleBar> was created with unknown prop '${key}'`);
    	});

    	const click_handler = () => systemClick("theme");
    	const click_handler_1 = () => systemClick("console");
    	const click_handler_2 = () => win.close();

    	function div14_binding($$value) {
    		binding_callbacks[$$value ? "unshift" : "push"](() => {
    			system = $$value;
    			$$invalidate(2, system);
    		});
    	}

    	const click_handler_3 = () => win.minimize();
    	const click_handler_4 = () => win.close();

    	$$self.$$set = $$props => {
    		if ("title" in $$props) $$invalidate(10, title = $$props.title);
    		if ("theme" in $$props) $$invalidate(0, theme = $$props.theme);
    		if ("msg" in $$props) $$invalidate(11, msg = $$props.msg);
    	};

    	$$self.$capture_state = () => ({
    		title,
    		theme,
    		msg,
    		win,
    		app,
    		dialog,
    		max,
    		toggleWin,
    		onResize,
    		system,
    		systemFlag,
    		fileFlag,
    		helpFlag,
    		toggleSystem,
    		toggleFile,
    		toggleHelp,
    		systemClick
    	});

    	$$self.$inject_state = $$props => {
    		if ("title" in $$props) $$invalidate(10, title = $$props.title);
    		if ("theme" in $$props) $$invalidate(0, theme = $$props.theme);
    		if ("msg" in $$props) $$invalidate(11, msg = $$props.msg);
    		if ("max" in $$props) $$invalidate(1, max = $$props.max);
    		if ("system" in $$props) $$invalidate(2, system = $$props.system);
    		if ("systemFlag" in $$props) $$invalidate(3, systemFlag = $$props.systemFlag);
    		if ("fileFlag" in $$props) fileFlag = $$props.fileFlag;
    		if ("helpFlag" in $$props) $$invalidate(4, helpFlag = $$props.helpFlag);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [
    		theme,
    		max,
    		system,
    		systemFlag,
    		helpFlag,
    		win,
    		toggleWin,
    		toggleSystem,
    		toggleHelp,
    		systemClick,
    		title,
    		msg,
    		click_handler,
    		click_handler_1,
    		click_handler_2,
    		div14_binding,
    		click_handler_3,
    		click_handler_4
    	];
    }

    class TitleBar extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance, create_fragment, safe_not_equal, { title: 10, theme: 0, msg: 11 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "TitleBar",
    			options,
    			id: create_fragment.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*title*/ ctx[10] === undefined && !("title" in props)) {
    			console_1.warn("<TitleBar> was created without expected prop 'title'");
    		}

    		if (/*theme*/ ctx[0] === undefined && !("theme" in props)) {
    			console_1.warn("<TitleBar> was created without expected prop 'theme'");
    		}

    		if (/*msg*/ ctx[11] === undefined && !("msg" in props)) {
    			console_1.warn("<TitleBar> was created without expected prop 'msg'");
    		}
    	}

    	get title() {
    		throw new Error("<TitleBar>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set title(value) {
    		throw new Error("<TitleBar>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get theme() {
    		throw new Error("<TitleBar>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set theme(value) {
    		throw new Error("<TitleBar>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get msg() {
    		throw new Error("<TitleBar>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set msg(value) {
    		throw new Error("<TitleBar>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src\component\StatusBar.svelte generated by Svelte v3.31.2 */
    const file$1 = "src\\component\\StatusBar.svelte";

    function create_fragment$1(ctx) {
    	let div5;
    	let div1;
    	let div0;
    	let t0;
    	let t1;
    	let div3;
    	let div2;
    	let t2;
    	let t3;
    	let div4;
    	let t4;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			div5 = element("div");
    			div1 = element("div");
    			div0 = element("div");
    			t0 = text("\r\n    Console");
    			t1 = space();
    			div3 = element("div");
    			div2 = element("div");
    			t2 = text("\r\n    Terminal");
    			t3 = space();
    			div4 = element("div");
    			t4 = text(/*msg*/ ctx[1]);
    			attr_dev(div0, "class", "statusbar-item-console svelte-z0q64c");
    			add_location(div0, file$1, 66, 4, 2647);
    			attr_dev(div1, "class", "statusbar-item svelte-z0q64c");
    			add_location(div1, file$1, 65, 2, 2570);
    			attr_dev(div2, "class", "statusbar-item-termianl svelte-z0q64c");
    			add_location(div2, file$1, 70, 4, 2790);
    			attr_dev(div3, "class", "statusbar-item svelte-z0q64c");
    			add_location(div3, file$1, 69, 2, 2712);
    			attr_dev(div4, "class", "status-msg svelte-z0q64c");
    			attr_dev(div4, "title", /*msg*/ ctx[1]);
    			add_location(div4, file$1, 73, 2, 2857);
    			attr_dev(div5, "class", "statusbar svelte-z0q64c");
    			set_style(div5, "background", /*theme*/ ctx[0].colors["statusBar.background"]);
    			set_style(div5, "--statusbar-color", /*theme*/ ctx[0].colors["statusBar.foreground"]);
    			add_location(div5, file$1, 62, 0, 2418);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div5, anchor);
    			append_dev(div5, div1);
    			append_dev(div1, div0);
    			append_dev(div1, t0);
    			append_dev(div5, t1);
    			append_dev(div5, div3);
    			append_dev(div3, div2);
    			append_dev(div3, t2);
    			append_dev(div5, t3);
    			append_dev(div5, div4);
    			append_dev(div4, t4);

    			if (!mounted) {
    				dispose = [
    					listen_dev(div1, "click", /*click_handler*/ ctx[3], false, false, false),
    					listen_dev(div3, "click", /*click_handler_1*/ ctx[4], false, false, false)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*msg*/ 2) set_data_dev(t4, /*msg*/ ctx[1]);

    			if (dirty & /*msg*/ 2) {
    				attr_dev(div4, "title", /*msg*/ ctx[1]);
    			}

    			if (dirty & /*theme*/ 1) {
    				set_style(div5, "background", /*theme*/ ctx[0].colors["statusBar.background"]);
    			}

    			if (dirty & /*theme*/ 1) {
    				set_style(div5, "--statusbar-color", /*theme*/ ctx[0].colors["statusBar.foreground"]);
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div5);
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$1.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$1($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("StatusBar", slots, []);
    	let { theme } = $$props, { msg } = $$props;
    	const dispatch = createEventDispatcher();
    	const writable_props = ["theme", "msg"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<StatusBar> was created with unknown prop '${key}'`);
    	});

    	const click_handler = () => dispatch("toggleConsole");
    	const click_handler_1 = () => dispatch("toggleTerminal");

    	$$self.$$set = $$props => {
    		if ("theme" in $$props) $$invalidate(0, theme = $$props.theme);
    		if ("msg" in $$props) $$invalidate(1, msg = $$props.msg);
    	};

    	$$self.$capture_state = () => ({
    		theme,
    		msg,
    		createEventDispatcher,
    		dispatch
    	});

    	$$self.$inject_state = $$props => {
    		if ("theme" in $$props) $$invalidate(0, theme = $$props.theme);
    		if ("msg" in $$props) $$invalidate(1, msg = $$props.msg);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [theme, msg, dispatch, click_handler, click_handler_1];
    }

    class StatusBar extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$1, create_fragment$1, safe_not_equal, { theme: 0, msg: 1 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "StatusBar",
    			options,
    			id: create_fragment$1.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*theme*/ ctx[0] === undefined && !("theme" in props)) {
    			console.warn("<StatusBar> was created without expected prop 'theme'");
    		}

    		if (/*msg*/ ctx[1] === undefined && !("msg" in props)) {
    			console.warn("<StatusBar> was created without expected prop 'msg'");
    		}
    	}

    	get theme() {
    		throw new Error("<StatusBar>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set theme(value) {
    		throw new Error("<StatusBar>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get msg() {
    		throw new Error("<StatusBar>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set msg(value) {
    		throw new Error("<StatusBar>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src\component\ActivityBar.svelte generated by Svelte v3.31.2 */
    const file$2 = "src\\component\\ActivityBar.svelte";

    function create_fragment$2(ctx) {
    	let div5;
    	let div4;
    	let div3;
    	let div2;
    	let ul;
    	let li0;
    	let div0;
    	let t;
    	let li1;
    	let div1;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			div5 = element("div");
    			div4 = element("div");
    			div3 = element("div");
    			div2 = element("div");
    			ul = element("ul");
    			li0 = element("li");
    			div0 = element("div");
    			t = space();
    			li1 = element("li");
    			div1 = element("div");
    			attr_dev(div0, "class", "action-label template svelte-4h1caj");
    			add_location(div0, file$2, 111, 12, 2636);
    			attr_dev(li0, "class", "action-item svelte-4h1caj");
    			attr_dev(li0, "role", "button");
    			attr_dev(li0, "draggable", "true");
    			attr_dev(li0, "tabindex", "0");
    			attr_dev(li0, "title", "生成模板");
    			toggle_class(li0, "checked", /*action*/ ctx[1] == "template");
    			add_location(li0, file$2, 103, 10, 2387);
    			attr_dev(div1, "class", "action-label script svelte-4h1caj");
    			add_location(div1, file$2, 121, 12, 2947);
    			attr_dev(li1, "class", "action-item svelte-4h1caj");
    			attr_dev(li1, "role", "button");
    			attr_dev(li1, "draggable", "true");
    			attr_dev(li1, "tabindex", "0");
    			attr_dev(li1, "title", "数据脚本");
    			toggle_class(li1, "checked", /*action*/ ctx[1] == "script");
    			add_location(li1, file$2, 113, 10, 2702);
    			attr_dev(ul, "class", "actions-container svelte-4h1caj");
    			attr_dev(ul, "role", "toolbar");
    			attr_dev(ul, "aria-label", "活动视图切换器");
    			add_location(ul, file$2, 99, 8, 2276);
    			attr_dev(div2, "class", "monaco-action-bar vertical");
    			add_location(div2, file$2, 98, 6, 2226);
    			attr_dev(div3, "class", "composite-bar");
    			add_location(div3, file$2, 97, 4, 2191);
    			attr_dev(div4, "class", "content svelte-4h1caj");
    			set_style(div4, "width", "50px");
    			add_location(div4, file$2, 96, 2, 2143);
    			attr_dev(div5, "class", "activitybar svelte-4h1caj");
    			set_style(div5, "background", /*theme*/ ctx[0].colors["activityBar.background"]);
    			set_style(div5, "--activity-color", /*theme*/ ctx[0].colors["activityBar.inactiveForeground"]);
    			set_style(div5, "--activity-focus", /*theme*/ ctx[0].colors["activityBar.foreground"]);
    			attr_dev(div5, "role", "navigation");
    			add_location(div5, file$2, 91, 0, 1895);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div5, anchor);
    			append_dev(div5, div4);
    			append_dev(div4, div3);
    			append_dev(div3, div2);
    			append_dev(div2, ul);
    			append_dev(ul, li0);
    			append_dev(li0, div0);
    			append_dev(ul, t);
    			append_dev(ul, li1);
    			append_dev(li1, div1);

    			if (!mounted) {
    				dispose = [
    					listen_dev(li0, "click", /*toggleTemplate*/ ctx[2], false, false, false),
    					listen_dev(li1, "click", /*toggleScript*/ ctx[3], false, false, false)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*action*/ 2) {
    				toggle_class(li0, "checked", /*action*/ ctx[1] == "template");
    			}

    			if (dirty & /*action*/ 2) {
    				toggle_class(li1, "checked", /*action*/ ctx[1] == "script");
    			}

    			if (dirty & /*theme*/ 1) {
    				set_style(div5, "background", /*theme*/ ctx[0].colors["activityBar.background"]);
    			}

    			if (dirty & /*theme*/ 1) {
    				set_style(div5, "--activity-color", /*theme*/ ctx[0].colors["activityBar.inactiveForeground"]);
    			}

    			if (dirty & /*theme*/ 1) {
    				set_style(div5, "--activity-focus", /*theme*/ ctx[0].colors["activityBar.foreground"]);
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div5);
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$2.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$2($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("ActivityBar", slots, []);
    	let { theme } = $$props, { msg } = $$props;
    	const dispatch = createEventDispatcher();
    	let action = "";

    	const toggleTemplate = () => {
    		if (action == "template") {
    			$$invalidate(1, action = "");
    		} else {
    			$$invalidate(1, action = "template");
    		}
    	};

    	const toggleScript = () => {
    		if (action == "script") {
    			$$invalidate(1, action = "");
    		} else {
    			$$invalidate(1, action = "script");
    		}
    	};

    	const writable_props = ["theme", "msg"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<ActivityBar> was created with unknown prop '${key}'`);
    	});

    	$$self.$$set = $$props => {
    		if ("theme" in $$props) $$invalidate(0, theme = $$props.theme);
    		if ("msg" in $$props) $$invalidate(4, msg = $$props.msg);
    	};

    	$$self.$capture_state = () => ({
    		theme,
    		msg,
    		createEventDispatcher,
    		dispatch,
    		action,
    		toggleTemplate,
    		toggleScript
    	});

    	$$self.$inject_state = $$props => {
    		if ("theme" in $$props) $$invalidate(0, theme = $$props.theme);
    		if ("msg" in $$props) $$invalidate(4, msg = $$props.msg);
    		if ("action" in $$props) $$invalidate(1, action = $$props.action);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [theme, action, toggleTemplate, toggleScript, msg];
    }

    class ActivityBar extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$2, create_fragment$2, safe_not_equal, { theme: 0, msg: 4 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "ActivityBar",
    			options,
    			id: create_fragment$2.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*theme*/ ctx[0] === undefined && !("theme" in props)) {
    			console.warn("<ActivityBar> was created without expected prop 'theme'");
    		}

    		if (/*msg*/ ctx[4] === undefined && !("msg" in props)) {
    			console.warn("<ActivityBar> was created without expected prop 'msg'");
    		}
    	}

    	get theme() {
    		throw new Error("<ActivityBar>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set theme(value) {
    		throw new Error("<ActivityBar>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get msg() {
    		throw new Error("<ActivityBar>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set msg(value) {
    		throw new Error("<ActivityBar>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src\component\SplitBar.svelte generated by Svelte v3.31.2 */
    const file$3 = "src\\component\\SplitBar.svelte";
    const get_right_slot_changes = dirty => ({});
    const get_right_slot_context = ctx => ({});
    const get_left_slot_changes = dirty => ({});
    const get_left_slot_context = ctx => ({});

    function create_fragment$3(ctx) {
    	let div4;
    	let div2;
    	let div0;
    	let t0;
    	let div1;
    	let t1;
    	let div3;
    	let current;
    	const left_slot_template = /*#slots*/ ctx[7].left;
    	const left_slot = create_slot(left_slot_template, ctx, /*$$scope*/ ctx[6], get_left_slot_context);
    	const right_slot_template = /*#slots*/ ctx[7].right;
    	const right_slot = create_slot(right_slot_template, ctx, /*$$scope*/ ctx[6], get_right_slot_context);

    	const block = {
    		c: function create() {
    			div4 = element("div");
    			div2 = element("div");
    			div0 = element("div");
    			if (left_slot) left_slot.c();
    			t0 = space();
    			div1 = element("div");
    			t1 = space();
    			div3 = element("div");
    			if (right_slot) right_slot.c();
    			set_style(div0, "flex", "1 1 auto");
    			add_location(div0, file$3, 63, 8, 1804);
    			attr_dev(div1, "class", "drag svelte-mz1her");
    			set_style(div1, "flex", "0 0 4px");
    			add_location(div1, file$3, 66, 8, 1892);
    			attr_dev(div2, "class", "left_panel svelte-mz1her");

    			set_style(div2, "flex", /*center*/ ctx[1] == "right"
    			? "0 0 " + /*width*/ ctx[0]
    			: "1 1 auto");

    			add_location(div2, file$3, 62, 4, 1690);
    			attr_dev(div3, "class", "right_panel");

    			set_style(div3, "flex", /*center*/ ctx[1] == "left"
    			? "0 0 " + /*width*/ ctx[0]
    			: "1 1 auto");

    			add_location(div3, file$3, 68, 4, 1971);
    			attr_dev(div4, "class", "container svelte-mz1her");
    			add_location(div4, file$3, 61, 0, 1639);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div4, anchor);
    			append_dev(div4, div2);
    			append_dev(div2, div0);

    			if (left_slot) {
    				left_slot.m(div0, null);
    			}

    			append_dev(div2, t0);
    			append_dev(div2, div1);
    			/*div1_binding*/ ctx[8](div1);
    			/*div2_binding*/ ctx[9](div2);
    			append_dev(div4, t1);
    			append_dev(div4, div3);

    			if (right_slot) {
    				right_slot.m(div3, null);
    			}

    			/*div3_binding*/ ctx[10](div3);
    			/*div4_binding*/ ctx[11](div4);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			if (left_slot) {
    				if (left_slot.p && dirty & /*$$scope*/ 64) {
    					update_slot(left_slot, left_slot_template, ctx, /*$$scope*/ ctx[6], dirty, get_left_slot_changes, get_left_slot_context);
    				}
    			}

    			if (!current || dirty & /*center, width*/ 3) {
    				set_style(div2, "flex", /*center*/ ctx[1] == "right"
    				? "0 0 " + /*width*/ ctx[0]
    				: "1 1 auto");
    			}

    			if (right_slot) {
    				if (right_slot.p && dirty & /*$$scope*/ 64) {
    					update_slot(right_slot, right_slot_template, ctx, /*$$scope*/ ctx[6], dirty, get_right_slot_changes, get_right_slot_context);
    				}
    			}

    			if (!current || dirty & /*center, width*/ 3) {
    				set_style(div3, "flex", /*center*/ ctx[1] == "left"
    				? "0 0 " + /*width*/ ctx[0]
    				: "1 1 auto");
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(left_slot, local);
    			transition_in(right_slot, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(left_slot, local);
    			transition_out(right_slot, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div4);
    			if (left_slot) left_slot.d(detaching);
    			/*div1_binding*/ ctx[8](null);
    			/*div2_binding*/ ctx[9](null);
    			if (right_slot) right_slot.d(detaching);
    			/*div3_binding*/ ctx[10](null);
    			/*div4_binding*/ ctx[11](null);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$3.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$3($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("SplitBar", slots, ['left','right']);
    	let { width = "200px" } = $$props, { center = "right" } = $$props;
    	let container, left, right, handle, leftWidth;

    	onMount(() => {
    		initSplit();
    	});

    	const initSplit = () => {
    		let isResizing = false;

    		$$invalidate(
    			5,
    			handle.onmousedown = function (e) {
    				isResizing = true;
    				e.clientX;
    			},
    			handle
    		);

    		let oldX = 0;

    		container.addEventListener(
    			"mouseup",
    			function () {
    				isResizing = false;
    			},
    			true
    		);

    		container.addEventListener(
    			"mousemove",
    			function (e) {
    				e.preventDefault();

    				if (!isResizing) {
    					return;
    				}

    				if (center == "right" && leftWidth < 100 && e.x < oldX) {
    					return;
    				}

    				if (center == "right" && container.offsetWidth - leftWidth < 100 && e.x > oldX) {
    					return;
    				}

    				if (center == "left" && leftWidth < 100 && e.x > oldX) {
    					return;
    				}

    				if (center == "left" && container.offsetWidth - leftWidth < 100 && e.x < oldX) {
    					return;
    				}

    				leftWidth = e.clientX - left.getBoundingClientRect().left;

    				if (center == "left") {
    					leftWidth = container.offsetWidth - leftWidth;
    				}

    				$$invalidate(0, width = leftWidth + "px");
    				oldX = e.x;
    			},
    			true
    		);
    	};

    	const writable_props = ["width", "center"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<SplitBar> was created with unknown prop '${key}'`);
    	});

    	function div1_binding($$value) {
    		binding_callbacks[$$value ? "unshift" : "push"](() => {
    			handle = $$value;
    			$$invalidate(5, handle);
    		});
    	}

    	function div2_binding($$value) {
    		binding_callbacks[$$value ? "unshift" : "push"](() => {
    			left = $$value;
    			$$invalidate(3, left);
    		});
    	}

    	function div3_binding($$value) {
    		binding_callbacks[$$value ? "unshift" : "push"](() => {
    			right = $$value;
    			$$invalidate(4, right);
    		});
    	}

    	function div4_binding($$value) {
    		binding_callbacks[$$value ? "unshift" : "push"](() => {
    			container = $$value;
    			$$invalidate(2, container);
    		});
    	}

    	$$self.$$set = $$props => {
    		if ("width" in $$props) $$invalidate(0, width = $$props.width);
    		if ("center" in $$props) $$invalidate(1, center = $$props.center);
    		if ("$$scope" in $$props) $$invalidate(6, $$scope = $$props.$$scope);
    	};

    	$$self.$capture_state = () => ({
    		onMount,
    		width,
    		center,
    		container,
    		left,
    		right,
    		handle,
    		leftWidth,
    		initSplit
    	});

    	$$self.$inject_state = $$props => {
    		if ("width" in $$props) $$invalidate(0, width = $$props.width);
    		if ("center" in $$props) $$invalidate(1, center = $$props.center);
    		if ("container" in $$props) $$invalidate(2, container = $$props.container);
    		if ("left" in $$props) $$invalidate(3, left = $$props.left);
    		if ("right" in $$props) $$invalidate(4, right = $$props.right);
    		if ("handle" in $$props) $$invalidate(5, handle = $$props.handle);
    		if ("leftWidth" in $$props) leftWidth = $$props.leftWidth;
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [
    		width,
    		center,
    		container,
    		left,
    		right,
    		handle,
    		$$scope,
    		slots,
    		div1_binding,
    		div2_binding,
    		div3_binding,
    		div4_binding
    	];
    }

    class SplitBar extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$3, create_fragment$3, safe_not_equal, { width: 0, center: 1 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "SplitBar",
    			options,
    			id: create_fragment$3.name
    		});
    	}

    	get width() {
    		throw new Error("<SplitBar>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set width(value) {
    		throw new Error("<SplitBar>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get center() {
    		throw new Error("<SplitBar>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set center(value) {
    		throw new Error("<SplitBar>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src\component\SideBar.svelte generated by Svelte v3.31.2 */
    const file$4 = "src\\component\\SideBar.svelte";

    function get_each_context(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[15] = list[i];
    	return child_ctx;
    }

    // (139:32) {#each tools as tool}
    function create_each_block(ctx) {
    	let li;
    	let i;
    	let i_class_value;
    	let i_title_value;
    	let t;
    	let mounted;
    	let dispose;

    	function mousedown_handler() {
    		return /*mousedown_handler*/ ctx[10](/*tool*/ ctx[15]);
    	}

    	function click_handler() {
    		return /*click_handler*/ ctx[11](/*tool*/ ctx[15]);
    	}

    	const block = {
    		c: function create() {
    			li = element("li");
    			i = element("i");
    			t = space();
    			attr_dev(i, "class", i_class_value = "" + (null_to_empty("action-label icon explorer-action " + /*tool*/ ctx[15].icon) + " svelte-195lol9"));
    			attr_dev(i, "role", "button");
    			attr_dev(i, "title", i_title_value = /*tool*/ ctx[15].title);
    			add_location(i, file$4, 143, 40, 4201);
    			attr_dev(li, "class", "action-item svelte-195lol9");
    			attr_dev(li, "role", "presentation");
    			toggle_class(li, "active", /*active*/ ctx[5] == /*tool*/ ctx[15].key);
    			add_location(li, file$4, 139, 36, 3946);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, li, anchor);
    			append_dev(li, i);
    			append_dev(li, t);

    			if (!mounted) {
    				dispose = [
    					listen_dev(i, "mouseup", /*mouseup_handler*/ ctx[9], false, false, false),
    					listen_dev(i, "mousedown", mousedown_handler, false, false, false),
    					listen_dev(i, "click", click_handler, false, false, false)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(new_ctx, dirty) {
    			ctx = new_ctx;

    			if (dirty & /*tools*/ 2 && i_class_value !== (i_class_value = "" + (null_to_empty("action-label icon explorer-action " + /*tool*/ ctx[15].icon) + " svelte-195lol9"))) {
    				attr_dev(i, "class", i_class_value);
    			}

    			if (dirty & /*tools*/ 2 && i_title_value !== (i_title_value = /*tool*/ ctx[15].title)) {
    				attr_dev(i, "title", i_title_value);
    			}

    			if (dirty & /*active, tools*/ 34) {
    				toggle_class(li, "active", /*active*/ ctx[5] == /*tool*/ ctx[15].key);
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(li);
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block.name,
    		type: "each",
    		source: "(139:32) {#each tools as tool}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$4(ctx) {
    	let div9;
    	let div1;
    	let div0;
    	let h2;
    	let t0;
    	let t1;
    	let div7;
    	let div6;
    	let div5;
    	let h3;
    	let t2;
    	let t3;
    	let t4;
    	let div4;
    	let div3;
    	let div2;
    	let ul;
    	let t5;
    	let div8;
    	let current;
    	let mounted;
    	let dispose;
    	let each_value = /*tools*/ ctx[1];
    	validate_each_argument(each_value);
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block(get_each_context(ctx, each_value, i));
    	}

    	const default_slot_template = /*#slots*/ ctx[8].default;
    	const default_slot = create_slot(default_slot_template, ctx, /*$$scope*/ ctx[7], null);

    	const block = {
    		c: function create() {
    			div9 = element("div");
    			div1 = element("div");
    			div0 = element("div");
    			h2 = element("h2");
    			t0 = text(/*title*/ ctx[2]);
    			t1 = space();
    			div7 = element("div");
    			div6 = element("div");
    			div5 = element("div");
    			h3 = element("h3");
    			t2 = text("  ");
    			t3 = text(/*toolTitle*/ ctx[3]);
    			t4 = space();
    			div4 = element("div");
    			div3 = element("div");
    			div2 = element("div");
    			ul = element("ul");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			t5 = space();
    			div8 = element("div");
    			if (default_slot) default_slot.c();
    			attr_dev(h2, "title", /*title*/ ctx[2]);
    			attr_dev(h2, "class", "svelte-195lol9");
    			add_location(h2, file$4, 115, 12, 2791);
    			attr_dev(div0, "class", "title-label");
    			add_location(div0, file$4, 114, 8, 2752);
    			attr_dev(div1, "class", "composite title svelte-195lol9");
    			add_location(div1, file$4, 113, 4, 2713);
    			attr_dev(h3, "class", "title svelte-195lol9");
    			attr_dev(h3, "title", "demo");
    			add_location(h3, file$4, 130, 16, 3382);
    			attr_dev(ul, "class", "actions-container svelte-195lol9");
    			attr_dev(ul, "role", "toolbar");
    			attr_dev(ul, "aria-label", "demo操作");
    			add_location(ul, file$4, 134, 28, 3677);
    			attr_dev(div2, "class", "monaco-action-bar animated svelte-195lol9");
    			add_location(div2, file$4, 133, 24, 3607);
    			attr_dev(div3, "class", "monaco-toolbar");
    			add_location(div3, file$4, 132, 20, 3553);
    			attr_dev(div4, "class", "actions");
    			set_style(div4, "flex", "1");
    			set_style(div4, "display", /*show*/ ctx[4] ? "block" : "none");
    			add_location(div4, file$4, 131, 16, 3459);
    			attr_dev(div5, "class", "panel-header expanded svelte-195lol9");
    			attr_dev(div5, "tabindex", "0");
    			attr_dev(div5, "role", "toolbar");
    			attr_dev(div5, "aria-label", "文件资源管理器部分");
    			attr_dev(div5, "aria-expanded", "true");
    			attr_dev(div5, "draggable", "true");
    			set_style(div5, "background-color", /*theme*/ ctx[0].colors["panel.background"]);
    			add_location(div5, file$4, 120, 12, 2919);
    			attr_dev(div6, "class", "panel svelte-195lol9");
    			add_location(div6, file$4, 119, 8, 2886);
    			attr_dev(div7, "class", "content");
    			add_location(div7, file$4, 118, 4, 2855);
    			attr_dev(div8, "class", "bar-content svelte-195lol9");
    			add_location(div8, file$4, 159, 4, 4952);
    			attr_dev(div9, "class", "sidebar svelte-195lol9");
    			set_style(div9, "background", /*theme*/ ctx[0].colors["sideBar.background"]);
    			set_style(div9, "color", /*theme*/ ctx[0].colors["sideBar.foreground"]);
    			add_location(div9, file$4, 110, 0, 2565);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div9, anchor);
    			append_dev(div9, div1);
    			append_dev(div1, div0);
    			append_dev(div0, h2);
    			append_dev(h2, t0);
    			append_dev(div9, t1);
    			append_dev(div9, div7);
    			append_dev(div7, div6);
    			append_dev(div6, div5);
    			append_dev(div5, h3);
    			append_dev(h3, t2);
    			append_dev(h3, t3);
    			append_dev(div5, t4);
    			append_dev(div5, div4);
    			append_dev(div4, div3);
    			append_dev(div3, div2);
    			append_dev(div2, ul);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(ul, null);
    			}

    			append_dev(div9, t5);
    			append_dev(div9, div8);

    			if (default_slot) {
    				default_slot.m(div8, null);
    			}

    			current = true;

    			if (!mounted) {
    				dispose = [
    					listen_dev(div5, "mouseover", /*mouseover_handler*/ ctx[12], false, false, false),
    					listen_dev(div5, "mouseout", /*mouseout_handler*/ ctx[13], false, false, false)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (!current || dirty & /*title*/ 4) set_data_dev(t0, /*title*/ ctx[2]);

    			if (!current || dirty & /*title*/ 4) {
    				attr_dev(h2, "title", /*title*/ ctx[2]);
    			}

    			if (!current || dirty & /*toolTitle*/ 8) set_data_dev(t3, /*toolTitle*/ ctx[3]);

    			if (dirty & /*active, tools, toolClick*/ 98) {
    				each_value = /*tools*/ ctx[1];
    				validate_each_argument(each_value);
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    					} else {
    						each_blocks[i] = create_each_block(child_ctx);
    						each_blocks[i].c();
    						each_blocks[i].m(ul, null);
    					}
    				}

    				for (; i < each_blocks.length; i += 1) {
    					each_blocks[i].d(1);
    				}

    				each_blocks.length = each_value.length;
    			}

    			if (!current || dirty & /*show*/ 16) {
    				set_style(div4, "display", /*show*/ ctx[4] ? "block" : "none");
    			}

    			if (!current || dirty & /*theme*/ 1) {
    				set_style(div5, "background-color", /*theme*/ ctx[0].colors["panel.background"]);
    			}

    			if (default_slot) {
    				if (default_slot.p && dirty & /*$$scope*/ 128) {
    					update_slot(default_slot, default_slot_template, ctx, /*$$scope*/ ctx[7], dirty, null, null);
    				}
    			}

    			if (!current || dirty & /*theme*/ 1) {
    				set_style(div9, "background", /*theme*/ ctx[0].colors["sideBar.background"]);
    			}

    			if (!current || dirty & /*theme*/ 1) {
    				set_style(div9, "color", /*theme*/ ctx[0].colors["sideBar.foreground"]);
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(default_slot, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(default_slot, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div9);
    			destroy_each(each_blocks, detaching);
    			if (default_slot) default_slot.d(detaching);
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$4.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$4($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("SideBar", slots, ['default']);

    	let { theme } = $$props,
    		{ tools = [] } = $$props,
    		{ title = "标题" } = $$props,
    		{ toolTitle = "目录" } = $$props;

    	let show = false, active = "";
    	const dispatch = createEventDispatcher();

    	const toolClick = tool => {
    		dispatch("toolClick", tool);
    	};

    	const writable_props = ["theme", "tools", "title", "toolTitle"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<SideBar> was created with unknown prop '${key}'`);
    	});

    	const mouseup_handler = () => $$invalidate(5, active = "");
    	const mousedown_handler = tool => $$invalidate(5, active = tool.key);
    	const click_handler = tool => toolClick(tool);
    	const mouseover_handler = () => $$invalidate(4, show = true);
    	const mouseout_handler = () => $$invalidate(4, show = false);

    	$$self.$$set = $$props => {
    		if ("theme" in $$props) $$invalidate(0, theme = $$props.theme);
    		if ("tools" in $$props) $$invalidate(1, tools = $$props.tools);
    		if ("title" in $$props) $$invalidate(2, title = $$props.title);
    		if ("toolTitle" in $$props) $$invalidate(3, toolTitle = $$props.toolTitle);
    		if ("$$scope" in $$props) $$invalidate(7, $$scope = $$props.$$scope);
    	};

    	$$self.$capture_state = () => ({
    		createEventDispatcher,
    		theme,
    		tools,
    		title,
    		toolTitle,
    		show,
    		active,
    		dispatch,
    		toolClick
    	});

    	$$self.$inject_state = $$props => {
    		if ("theme" in $$props) $$invalidate(0, theme = $$props.theme);
    		if ("tools" in $$props) $$invalidate(1, tools = $$props.tools);
    		if ("title" in $$props) $$invalidate(2, title = $$props.title);
    		if ("toolTitle" in $$props) $$invalidate(3, toolTitle = $$props.toolTitle);
    		if ("show" in $$props) $$invalidate(4, show = $$props.show);
    		if ("active" in $$props) $$invalidate(5, active = $$props.active);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [
    		theme,
    		tools,
    		title,
    		toolTitle,
    		show,
    		active,
    		toolClick,
    		$$scope,
    		slots,
    		mouseup_handler,
    		mousedown_handler,
    		click_handler,
    		mouseover_handler,
    		mouseout_handler
    	];
    }

    class SideBar extends SvelteComponentDev {
    	constructor(options) {
    		super(options);

    		init(this, options, instance$4, create_fragment$4, safe_not_equal, {
    			theme: 0,
    			tools: 1,
    			title: 2,
    			toolTitle: 3
    		});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "SideBar",
    			options,
    			id: create_fragment$4.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*theme*/ ctx[0] === undefined && !("theme" in props)) {
    			console.warn("<SideBar> was created without expected prop 'theme'");
    		}
    	}

    	get theme() {
    		throw new Error("<SideBar>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set theme(value) {
    		throw new Error("<SideBar>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get tools() {
    		throw new Error("<SideBar>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set tools(value) {
    		throw new Error("<SideBar>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get title() {
    		throw new Error("<SideBar>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set title(value) {
    		throw new Error("<SideBar>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get toolTitle() {
    		throw new Error("<SideBar>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set toolTitle(value) {
    		throw new Error("<SideBar>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src\component\ListTree.svelte generated by Svelte v3.31.2 */
    const file$5 = "src\\component\\ListTree.svelte";

    function get_each_context$1(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[14] = list[i];
    	child_ctx[15] = list;
    	child_ctx[16] = i;
    	return child_ctx;
    }

    // (66:8) {#if d.type === 'folder' && d.expanded}
    function create_if_block(ctx) {
    	let listtree;
    	let updating_data;
    	let updating_now;
    	let updating_theme;
    	let updating_dispatch;
    	let current;

    	function listtree_data_binding(value) {
    		/*listtree_data_binding*/ ctx[10].call(null, value, /*d*/ ctx[14]);
    	}

    	function listtree_now_binding(value) {
    		/*listtree_now_binding*/ ctx[11].call(null, value);
    	}

    	function listtree_theme_binding(value) {
    		/*listtree_theme_binding*/ ctx[12].call(null, value);
    	}

    	function listtree_dispatch_binding(value) {
    		/*listtree_dispatch_binding*/ ctx[13].call(null, value);
    	}

    	let listtree_props = { index: /*index*/ ctx[4] + 1 };

    	if (/*d*/ ctx[14].children !== void 0) {
    		listtree_props.data = /*d*/ ctx[14].children;
    	}

    	if (/*now*/ ctx[1] !== void 0) {
    		listtree_props.now = /*now*/ ctx[1];
    	}

    	if (/*theme*/ ctx[0] !== void 0) {
    		listtree_props.theme = /*theme*/ ctx[0];
    	}

    	if (/*dispatch*/ ctx[3] !== void 0) {
    		listtree_props.dispatch = /*dispatch*/ ctx[3];
    	}

    	listtree = new ListTree({ props: listtree_props, $$inline: true });
    	binding_callbacks.push(() => bind(listtree, "data", listtree_data_binding));
    	binding_callbacks.push(() => bind(listtree, "now", listtree_now_binding));
    	binding_callbacks.push(() => bind(listtree, "theme", listtree_theme_binding));
    	binding_callbacks.push(() => bind(listtree, "dispatch", listtree_dispatch_binding));

    	const block = {
    		c: function create() {
    			create_component(listtree.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(listtree, target, anchor);
    			current = true;
    		},
    		p: function update(new_ctx, dirty) {
    			ctx = new_ctx;
    			const listtree_changes = {};
    			if (dirty & /*index*/ 16) listtree_changes.index = /*index*/ ctx[4] + 1;

    			if (!updating_data && dirty & /*data*/ 4) {
    				updating_data = true;
    				listtree_changes.data = /*d*/ ctx[14].children;
    				add_flush_callback(() => updating_data = false);
    			}

    			if (!updating_now && dirty & /*now*/ 2) {
    				updating_now = true;
    				listtree_changes.now = /*now*/ ctx[1];
    				add_flush_callback(() => updating_now = false);
    			}

    			if (!updating_theme && dirty & /*theme*/ 1) {
    				updating_theme = true;
    				listtree_changes.theme = /*theme*/ ctx[0];
    				add_flush_callback(() => updating_theme = false);
    			}

    			if (!updating_dispatch && dirty & /*dispatch*/ 8) {
    				updating_dispatch = true;
    				listtree_changes.dispatch = /*dispatch*/ ctx[3];
    				add_flush_callback(() => updating_dispatch = false);
    			}

    			listtree.$set(listtree_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(listtree.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(listtree.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(listtree, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block.name,
    		type: "if",
    		source: "(66:8) {#if d.type === 'folder' && d.expanded}",
    		ctx
    	});

    	return block;
    }

    // (55:0) {#each data as d}
    function create_each_block$1(ctx) {
    	let div5;
    	let div4;
    	let div0;
    	let t0;
    	let div1;
    	let t1;
    	let div2;
    	let t2;
    	let div3;
    	let t3_value = /*d*/ ctx[14].name + "";
    	let t3;
    	let t4;
    	let t5;
    	let current;
    	let mounted;
    	let dispose;

    	function click_handler() {
    		return /*click_handler*/ ctx[7](/*d*/ ctx[14], /*each_value*/ ctx[15], /*d_index*/ ctx[16]);
    	}

    	function click_handler_1() {
    		return /*click_handler_1*/ ctx[8](/*d*/ ctx[14]);
    	}

    	function contextmenu_handler(...args) {
    		return /*contextmenu_handler*/ ctx[9](/*d*/ ctx[14], ...args);
    	}

    	let if_block = /*d*/ ctx[14].type === "folder" && /*d*/ ctx[14].expanded && create_if_block(ctx);

    	const block = {
    		c: function create() {
    			div5 = element("div");
    			div4 = element("div");
    			div0 = element("div");
    			t0 = space();
    			div1 = element("div");
    			t1 = space();
    			div2 = element("div");
    			t2 = space();
    			div3 = element("div");
    			t3 = text(t3_value);
    			t4 = space();
    			if (if_block) if_block.c();
    			t5 = space();
    			set_style(div0, "width", /*index*/ ctx[4] * 12 + "px");
    			attr_dev(div0, "class", "svelte-1h7gu14");
    			add_location(div0, file$5, 58, 12, 1509);
    			attr_dev(div1, "class", "tree-expanded svelte-1h7gu14");
    			toggle_class(div1, "expanded", /*d*/ ctx[14].type === "folder" && /*d*/ ctx[14].expanded);
    			toggle_class(div1, "collapse", /*d*/ ctx[14].type === "folder" && !/*d*/ ctx[14].expanded);
    			add_location(div1, file$5, 59, 12, 1562);
    			attr_dev(div2, "class", "tree-icon svelte-1h7gu14");
    			set_style(div2, "background-image", "url(" + /*d*/ ctx[14].icon + ")");
    			add_location(div2, file$5, 62, 12, 1790);
    			attr_dev(div3, "class", "tree-text svelte-1h7gu14");
    			add_location(div3, file$5, 63, 12, 1873);
    			attr_dev(div4, "class", "tree-title svelte-1h7gu14");

    			set_style(div4, "background-color", /*now*/ ctx[1] == /*d*/ ctx[14].id
    			? /*theme*/ ctx[0].colors["titleBar.activeBackground"]
    			: "");

    			add_location(div4, file$5, 56, 8, 1285);
    			attr_dev(div5, "class", "tree svelte-1h7gu14");
    			add_location(div5, file$5, 55, 4, 1257);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div5, anchor);
    			append_dev(div5, div4);
    			append_dev(div4, div0);
    			append_dev(div4, t0);
    			append_dev(div4, div1);
    			append_dev(div4, t1);
    			append_dev(div4, div2);
    			append_dev(div4, t2);
    			append_dev(div4, div3);
    			append_dev(div3, t3);
    			append_dev(div5, t4);
    			if (if_block) if_block.m(div5, null);
    			append_dev(div5, t5);
    			current = true;

    			if (!mounted) {
    				dispose = [
    					listen_dev(div1, "click", click_handler, false, false, false),
    					listen_dev(div4, "click", click_handler_1, false, false, false),
    					listen_dev(div4, "contextmenu", prevent_default(contextmenu_handler), false, true, false)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(new_ctx, dirty) {
    			ctx = new_ctx;

    			if (!current || dirty & /*index*/ 16) {
    				set_style(div0, "width", /*index*/ ctx[4] * 12 + "px");
    			}

    			if (dirty & /*data*/ 4) {
    				toggle_class(div1, "expanded", /*d*/ ctx[14].type === "folder" && /*d*/ ctx[14].expanded);
    			}

    			if (dirty & /*data*/ 4) {
    				toggle_class(div1, "collapse", /*d*/ ctx[14].type === "folder" && !/*d*/ ctx[14].expanded);
    			}

    			if (!current || dirty & /*data*/ 4) {
    				set_style(div2, "background-image", "url(" + /*d*/ ctx[14].icon + ")");
    			}

    			if ((!current || dirty & /*data*/ 4) && t3_value !== (t3_value = /*d*/ ctx[14].name + "")) set_data_dev(t3, t3_value);

    			if (!current || dirty & /*now, data, theme*/ 7) {
    				set_style(div4, "background-color", /*now*/ ctx[1] == /*d*/ ctx[14].id
    				? /*theme*/ ctx[0].colors["titleBar.activeBackground"]
    				: "");
    			}

    			if (/*d*/ ctx[14].type === "folder" && /*d*/ ctx[14].expanded) {
    				if (if_block) {
    					if_block.p(ctx, dirty);

    					if (dirty & /*data*/ 4) {
    						transition_in(if_block, 1);
    					}
    				} else {
    					if_block = create_if_block(ctx);
    					if_block.c();
    					transition_in(if_block, 1);
    					if_block.m(div5, t5);
    				}
    			} else if (if_block) {
    				group_outros();

    				transition_out(if_block, 1, 1, () => {
    					if_block = null;
    				});

    				check_outros();
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(if_block);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(if_block);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div5);
    			if (if_block) if_block.d();
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block$1.name,
    		type: "each",
    		source: "(55:0) {#each data as d}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$5(ctx) {
    	let each_1_anchor;
    	let current;
    	let each_value = /*data*/ ctx[2];
    	validate_each_argument(each_value);
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block$1(get_each_context$1(ctx, each_value, i));
    	}

    	const out = i => transition_out(each_blocks[i], 1, 1, () => {
    		each_blocks[i] = null;
    	});

    	const block = {
    		c: function create() {
    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			each_1_anchor = empty();
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(target, anchor);
    			}

    			insert_dev(target, each_1_anchor, anchor);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*index, data, now, theme, dispatch, itemClick, onRightClick*/ 127) {
    				each_value = /*data*/ ctx[2];
    				validate_each_argument(each_value);
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context$1(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    						transition_in(each_blocks[i], 1);
    					} else {
    						each_blocks[i] = create_each_block$1(child_ctx);
    						each_blocks[i].c();
    						transition_in(each_blocks[i], 1);
    						each_blocks[i].m(each_1_anchor.parentNode, each_1_anchor);
    					}
    				}

    				group_outros();

    				for (i = each_value.length; i < each_blocks.length; i += 1) {
    					out(i);
    				}

    				check_outros();
    			}
    		},
    		i: function intro(local) {
    			if (current) return;

    			for (let i = 0; i < each_value.length; i += 1) {
    				transition_in(each_blocks[i]);
    			}

    			current = true;
    		},
    		o: function outro(local) {
    			each_blocks = each_blocks.filter(Boolean);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				transition_out(each_blocks[i]);
    			}

    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_each(each_blocks, detaching);
    			if (detaching) detach_dev(each_1_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$5.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$5($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("ListTree", slots, []);

    	let { theme } = $$props,
    		{ index = 0 } = $$props,
    		{ now } = $$props,
    		{ data = [] } = $$props;

    	let { dispatch = createEventDispatcher() } = $$props;

    	const itemClick = item => {
    		$$invalidate(1, now = item.id);
    		dispatch("click", item);
    	};

    	const onRightClick = (item, e) => {
    		dispatch("rightClick", { data: item, x: e.clientX, y: e.clientY });
    	};

    	const writable_props = ["theme", "index", "now", "data", "dispatch"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<ListTree> was created with unknown prop '${key}'`);
    	});

    	const click_handler = (d, each_value, d_index) => $$invalidate(2, each_value[d_index].expanded = !d.expanded, data);
    	const click_handler_1 = d => itemClick(d);
    	const contextmenu_handler = (d, e) => onRightClick(d, e);

    	function listtree_data_binding(value, d) {
    		d.children = value;
    		$$invalidate(2, data);
    	}

    	function listtree_now_binding(value) {
    		now = value;
    		$$invalidate(1, now);
    	}

    	function listtree_theme_binding(value) {
    		theme = value;
    		$$invalidate(0, theme);
    	}

    	function listtree_dispatch_binding(value) {
    		dispatch = value;
    		$$invalidate(3, dispatch);
    	}

    	$$self.$$set = $$props => {
    		if ("theme" in $$props) $$invalidate(0, theme = $$props.theme);
    		if ("index" in $$props) $$invalidate(4, index = $$props.index);
    		if ("now" in $$props) $$invalidate(1, now = $$props.now);
    		if ("data" in $$props) $$invalidate(2, data = $$props.data);
    		if ("dispatch" in $$props) $$invalidate(3, dispatch = $$props.dispatch);
    	};

    	$$self.$capture_state = () => ({
    		createEventDispatcher,
    		theme,
    		index,
    		now,
    		data,
    		dispatch,
    		itemClick,
    		onRightClick
    	});

    	$$self.$inject_state = $$props => {
    		if ("theme" in $$props) $$invalidate(0, theme = $$props.theme);
    		if ("index" in $$props) $$invalidate(4, index = $$props.index);
    		if ("now" in $$props) $$invalidate(1, now = $$props.now);
    		if ("data" in $$props) $$invalidate(2, data = $$props.data);
    		if ("dispatch" in $$props) $$invalidate(3, dispatch = $$props.dispatch);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [
    		theme,
    		now,
    		data,
    		dispatch,
    		index,
    		itemClick,
    		onRightClick,
    		click_handler,
    		click_handler_1,
    		contextmenu_handler,
    		listtree_data_binding,
    		listtree_now_binding,
    		listtree_theme_binding,
    		listtree_dispatch_binding
    	];
    }

    class ListTree extends SvelteComponentDev {
    	constructor(options) {
    		super(options);

    		init(this, options, instance$5, create_fragment$5, safe_not_equal, {
    			theme: 0,
    			index: 4,
    			now: 1,
    			data: 2,
    			dispatch: 3
    		});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "ListTree",
    			options,
    			id: create_fragment$5.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*theme*/ ctx[0] === undefined && !("theme" in props)) {
    			console.warn("<ListTree> was created without expected prop 'theme'");
    		}

    		if (/*now*/ ctx[1] === undefined && !("now" in props)) {
    			console.warn("<ListTree> was created without expected prop 'now'");
    		}
    	}

    	get theme() {
    		throw new Error("<ListTree>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set theme(value) {
    		throw new Error("<ListTree>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get index() {
    		throw new Error("<ListTree>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set index(value) {
    		throw new Error("<ListTree>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get now() {
    		throw new Error("<ListTree>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set now(value) {
    		throw new Error("<ListTree>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get data() {
    		throw new Error("<ListTree>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set data(value) {
    		throw new Error("<ListTree>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get dispatch() {
    		throw new Error("<ListTree>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set dispatch(value) {
    		throw new Error("<ListTree>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /*!
     * hotkeys-js v3.8.1
     * A simple micro-library for defining and dispatching keyboard shortcuts. It has no dependencies.
     * 
     * Copyright (c) 2020 kenny wong <wowohoo@qq.com>
     * http://jaywcjlove.github.io/hotkeys
     * 
     * Licensed under the MIT license.
     */

    var isff = typeof navigator !== 'undefined' ? navigator.userAgent.toLowerCase().indexOf('firefox') > 0 : false; // 绑定事件

    function addEvent(object, event, method) {
      if (object.addEventListener) {
        object.addEventListener(event, method, false);
      } else if (object.attachEvent) {
        object.attachEvent("on".concat(event), function () {
          method(window.event);
        });
      }
    } // 修饰键转换成对应的键码


    function getMods(modifier, key) {
      var mods = key.slice(0, key.length - 1);

      for (var i = 0; i < mods.length; i++) {
        mods[i] = modifier[mods[i].toLowerCase()];
      }

      return mods;
    } // 处理传的key字符串转换成数组


    function getKeys(key) {
      if (typeof key !== 'string') key = '';
      key = key.replace(/\s/g, ''); // 匹配任何空白字符,包括空格、制表符、换页符等等

      var keys = key.split(','); // 同时设置多个快捷键，以','分割

      var index = keys.lastIndexOf(''); // 快捷键可能包含','，需特殊处理

      for (; index >= 0;) {
        keys[index - 1] += ',';
        keys.splice(index, 1);
        index = keys.lastIndexOf('');
      }

      return keys;
    } // 比较修饰键的数组


    function compareArray(a1, a2) {
      var arr1 = a1.length >= a2.length ? a1 : a2;
      var arr2 = a1.length >= a2.length ? a2 : a1;
      var isIndex = true;

      for (var i = 0; i < arr1.length; i++) {
        if (arr2.indexOf(arr1[i]) === -1) isIndex = false;
      }

      return isIndex;
    }

    var _keyMap = {
      backspace: 8,
      tab: 9,
      clear: 12,
      enter: 13,
      return: 13,
      esc: 27,
      escape: 27,
      space: 32,
      left: 37,
      up: 38,
      right: 39,
      down: 40,
      del: 46,
      delete: 46,
      ins: 45,
      insert: 45,
      home: 36,
      end: 35,
      pageup: 33,
      pagedown: 34,
      capslock: 20,
      '⇪': 20,
      ',': 188,
      '.': 190,
      '/': 191,
      '`': 192,
      '-': isff ? 173 : 189,
      '=': isff ? 61 : 187,
      ';': isff ? 59 : 186,
      '\'': 222,
      '[': 219,
      ']': 221,
      '\\': 220
    }; // Modifier Keys

    var _modifier = {
      // shiftKey
      '⇧': 16,
      shift: 16,
      // altKey
      '⌥': 18,
      alt: 18,
      option: 18,
      // ctrlKey
      '⌃': 17,
      ctrl: 17,
      control: 17,
      // metaKey
      '⌘': 91,
      cmd: 91,
      command: 91
    };
    var modifierMap = {
      16: 'shiftKey',
      18: 'altKey',
      17: 'ctrlKey',
      91: 'metaKey',
      shiftKey: 16,
      ctrlKey: 17,
      altKey: 18,
      metaKey: 91
    };
    var _mods = {
      16: false,
      18: false,
      17: false,
      91: false
    };
    var _handlers = {}; // F1~F12 special key

    for (var k = 1; k < 20; k++) {
      _keyMap["f".concat(k)] = 111 + k;
    }

    var _downKeys = []; // 记录摁下的绑定键

    var _scope = 'all'; // 默认热键范围

    var elementHasBindEvent = []; // 已绑定事件的节点记录
    // 返回键码

    var code = function code(x) {
      return _keyMap[x.toLowerCase()] || _modifier[x.toLowerCase()] || x.toUpperCase().charCodeAt(0);
    }; // 设置获取当前范围（默认为'所有'）


    function setScope(scope) {
      _scope = scope || 'all';
    } // 获取当前范围


    function getScope() {
      return _scope || 'all';
    } // 获取摁下绑定键的键值


    function getPressedKeyCodes() {
      return _downKeys.slice(0);
    } // 表单控件控件判断 返回 Boolean
    // hotkey is effective only when filter return true


    function filter(event) {
      var target = event.target || event.srcElement;
      var tagName = target.tagName;
      var flag = true; // ignore: isContentEditable === 'true', <input> and <textarea> when readOnly state is false, <select>

      if (target.isContentEditable || (tagName === 'INPUT' || tagName === 'TEXTAREA' || tagName === 'SELECT') && !target.readOnly) {
        flag = false;
      }

      return flag;
    } // 判断摁下的键是否为某个键，返回true或者false


    function isPressed(keyCode) {
      if (typeof keyCode === 'string') {
        keyCode = code(keyCode); // 转换成键码
      }

      return _downKeys.indexOf(keyCode) !== -1;
    } // 循环删除handlers中的所有 scope(范围)


    function deleteScope(scope, newScope) {
      var handlers;
      var i; // 没有指定scope，获取scope

      if (!scope) scope = getScope();

      for (var key in _handlers) {
        if (Object.prototype.hasOwnProperty.call(_handlers, key)) {
          handlers = _handlers[key];

          for (i = 0; i < handlers.length;) {
            if (handlers[i].scope === scope) handlers.splice(i, 1);else i++;
          }
        }
      } // 如果scope被删除，将scope重置为all


      if (getScope() === scope) setScope(newScope || 'all');
    } // 清除修饰键


    function clearModifier(event) {
      var key = event.keyCode || event.which || event.charCode;

      var i = _downKeys.indexOf(key); // 从列表中清除按压过的键


      if (i >= 0) {
        _downKeys.splice(i, 1);
      } // 特殊处理 cmmand 键，在 cmmand 组合快捷键 keyup 只执行一次的问题


      if (event.key && event.key.toLowerCase() === 'meta') {
        _downKeys.splice(0, _downKeys.length);
      } // 修饰键 shiftKey altKey ctrlKey (command||metaKey) 清除


      if (key === 93 || key === 224) key = 91;

      if (key in _mods) {
        _mods[key] = false; // 将修饰键重置为false

        for (var k in _modifier) {
          if (_modifier[k] === key) hotkeys[k] = false;
        }
      }
    }

    function unbind(keysInfo) {
      // unbind(), unbind all keys
      if (!keysInfo) {
        Object.keys(_handlers).forEach(function (key) {
          return delete _handlers[key];
        });
      } else if (Array.isArray(keysInfo)) {
        // support like : unbind([{key: 'ctrl+a', scope: 's1'}, {key: 'ctrl-a', scope: 's2', splitKey: '-'}])
        keysInfo.forEach(function (info) {
          if (info.key) eachUnbind(info);
        });
      } else if (typeof keysInfo === 'object') {
        // support like unbind({key: 'ctrl+a, ctrl+b', scope:'abc'})
        if (keysInfo.key) eachUnbind(keysInfo);
      } else if (typeof keysInfo === 'string') {
        for (var _len = arguments.length, args = new Array(_len > 1 ? _len - 1 : 0), _key = 1; _key < _len; _key++) {
          args[_key - 1] = arguments[_key];
        }

        // support old method
        // eslint-disable-line
        var scope = args[0],
            method = args[1];

        if (typeof scope === 'function') {
          method = scope;
          scope = '';
        }

        eachUnbind({
          key: keysInfo,
          scope: scope,
          method: method,
          splitKey: '+'
        });
      }
    } // 解除绑定某个范围的快捷键


    var eachUnbind = function eachUnbind(_ref) {
      var key = _ref.key,
          scope = _ref.scope,
          method = _ref.method,
          _ref$splitKey = _ref.splitKey,
          splitKey = _ref$splitKey === void 0 ? '+' : _ref$splitKey;
      var multipleKeys = getKeys(key);
      multipleKeys.forEach(function (originKey) {
        var unbindKeys = originKey.split(splitKey);
        var len = unbindKeys.length;
        var lastKey = unbindKeys[len - 1];
        var keyCode = lastKey === '*' ? '*' : code(lastKey);
        if (!_handlers[keyCode]) return; // 判断是否传入范围，没有就获取范围

        if (!scope) scope = getScope();
        var mods = len > 1 ? getMods(_modifier, unbindKeys) : [];
        _handlers[keyCode] = _handlers[keyCode].map(function (record) {
          // 通过函数判断，是否解除绑定，函数相等直接返回
          var isMatchingMethod = method ? record.method === method : true;

          if (isMatchingMethod && record.scope === scope && compareArray(record.mods, mods)) {
            return {};
          }

          return record;
        });
      });
    }; // 对监听对应快捷键的回调函数进行处理


    function eventHandler(event, handler, scope) {
      var modifiersMatch; // 看它是否在当前范围

      if (handler.scope === scope || handler.scope === 'all') {
        // 检查是否匹配修饰符（如果有返回true）
        modifiersMatch = handler.mods.length > 0;

        for (var y in _mods) {
          if (Object.prototype.hasOwnProperty.call(_mods, y)) {
            if (!_mods[y] && handler.mods.indexOf(+y) > -1 || _mods[y] && handler.mods.indexOf(+y) === -1) {
              modifiersMatch = false;
            }
          }
        } // 调用处理程序，如果是修饰键不做处理


        if (handler.mods.length === 0 && !_mods[16] && !_mods[18] && !_mods[17] && !_mods[91] || modifiersMatch || handler.shortcut === '*') {
          if (handler.method(event, handler) === false) {
            if (event.preventDefault) event.preventDefault();else event.returnValue = false;
            if (event.stopPropagation) event.stopPropagation();
            if (event.cancelBubble) event.cancelBubble = true;
          }
        }
      }
    } // 处理keydown事件


    function dispatch(event) {
      var asterisk = _handlers['*'];
      var key = event.keyCode || event.which || event.charCode; // 表单控件过滤 默认表单控件不触发快捷键

      if (!hotkeys.filter.call(this, event)) return; // Gecko(Firefox)的command键值224，在Webkit(Chrome)中保持一致
      // Webkit左右 command 键值不一样

      if (key === 93 || key === 224) key = 91;
      /**
       * Collect bound keys
       * If an Input Method Editor is processing key input and the event is keydown, return 229.
       * https://stackoverflow.com/questions/25043934/is-it-ok-to-ignore-keydown-events-with-keycode-229
       * http://lists.w3.org/Archives/Public/www-dom/2010JulSep/att-0182/keyCode-spec.html
       */

      if (_downKeys.indexOf(key) === -1 && key !== 229) _downKeys.push(key);
      /**
       * Jest test cases are required.
       * ===============================
       */

      ['ctrlKey', 'altKey', 'shiftKey', 'metaKey'].forEach(function (keyName) {
        var keyNum = modifierMap[keyName];

        if (event[keyName] && _downKeys.indexOf(keyNum) === -1) {
          _downKeys.push(keyNum);
        } else if (!event[keyName] && _downKeys.indexOf(keyNum) > -1) {
          _downKeys.splice(_downKeys.indexOf(keyNum), 1);
        } else if (keyName === 'metaKey' && event[keyName] && _downKeys.length === 3) {
          /**
           * Fix if Command is pressed:
           * ===============================
           */
          if (!(event.ctrlKey || event.shiftKey || event.altKey)) {
            _downKeys = _downKeys.slice(_downKeys.indexOf(keyNum));
          }
        }
      });
      /**
       * -------------------------------
       */

      if (key in _mods) {
        _mods[key] = true; // 将特殊字符的key注册到 hotkeys 上

        for (var k in _modifier) {
          if (_modifier[k] === key) hotkeys[k] = true;
        }

        if (!asterisk) return;
      } // 将 modifierMap 里面的修饰键绑定到 event 中


      for (var e in _mods) {
        if (Object.prototype.hasOwnProperty.call(_mods, e)) {
          _mods[e] = event[modifierMap[e]];
        }
      }
      /**
       * https://github.com/jaywcjlove/hotkeys/pull/129
       * This solves the issue in Firefox on Windows where hotkeys corresponding to special characters would not trigger.
       * An example of this is ctrl+alt+m on a Swedish keyboard which is used to type μ.
       * Browser support: https://caniuse.com/#feat=keyboardevent-getmodifierstate
       */


      if (event.getModifierState && !(event.altKey && !event.ctrlKey) && event.getModifierState('AltGraph')) {
        if (_downKeys.indexOf(17) === -1) {
          _downKeys.push(17);
        }

        if (_downKeys.indexOf(18) === -1) {
          _downKeys.push(18);
        }

        _mods[17] = true;
        _mods[18] = true;
      } // 获取范围 默认为 `all`


      var scope = getScope(); // 对任何快捷键都需要做的处理

      if (asterisk) {
        for (var i = 0; i < asterisk.length; i++) {
          if (asterisk[i].scope === scope && (event.type === 'keydown' && asterisk[i].keydown || event.type === 'keyup' && asterisk[i].keyup)) {
            eventHandler(event, asterisk[i], scope);
          }
        }
      } // key 不在 _handlers 中返回


      if (!(key in _handlers)) return;

      for (var _i = 0; _i < _handlers[key].length; _i++) {
        if (event.type === 'keydown' && _handlers[key][_i].keydown || event.type === 'keyup' && _handlers[key][_i].keyup) {
          if (_handlers[key][_i].key) {
            var record = _handlers[key][_i];
            var splitKey = record.splitKey;
            var keyShortcut = record.key.split(splitKey);
            var _downKeysCurrent = []; // 记录当前按键键值

            for (var a = 0; a < keyShortcut.length; a++) {
              _downKeysCurrent.push(code(keyShortcut[a]));
            }

            if (_downKeysCurrent.sort().join('') === _downKeys.sort().join('')) {
              // 找到处理内容
              eventHandler(event, record, scope);
            }
          }
        }
      }
    } // 判断 element 是否已经绑定事件


    function isElementBind(element) {
      return elementHasBindEvent.indexOf(element) > -1;
    }

    function hotkeys(key, option, method) {
      _downKeys = [];
      var keys = getKeys(key); // 需要处理的快捷键列表

      var mods = [];
      var scope = 'all'; // scope默认为all，所有范围都有效

      var element = document; // 快捷键事件绑定节点

      var i = 0;
      var keyup = false;
      var keydown = true;
      var splitKey = '+'; // 对为设定范围的判断

      if (method === undefined && typeof option === 'function') {
        method = option;
      }

      if (Object.prototype.toString.call(option) === '[object Object]') {
        if (option.scope) scope = option.scope; // eslint-disable-line

        if (option.element) element = option.element; // eslint-disable-line

        if (option.keyup) keyup = option.keyup; // eslint-disable-line

        if (option.keydown !== undefined) keydown = option.keydown; // eslint-disable-line

        if (typeof option.splitKey === 'string') splitKey = option.splitKey; // eslint-disable-line
      }

      if (typeof option === 'string') scope = option; // 对于每个快捷键进行处理

      for (; i < keys.length; i++) {
        key = keys[i].split(splitKey); // 按键列表

        mods = []; // 如果是组合快捷键取得组合快捷键

        if (key.length > 1) mods = getMods(_modifier, key); // 将非修饰键转化为键码

        key = key[key.length - 1];
        key = key === '*' ? '*' : code(key); // *表示匹配所有快捷键
        // 判断key是否在_handlers中，不在就赋一个空数组

        if (!(key in _handlers)) _handlers[key] = [];

        _handlers[key].push({
          keyup: keyup,
          keydown: keydown,
          scope: scope,
          mods: mods,
          shortcut: keys[i],
          method: method,
          key: keys[i],
          splitKey: splitKey
        });
      } // 在全局document上设置快捷键


      if (typeof element !== 'undefined' && !isElementBind(element) && window) {
        elementHasBindEvent.push(element);
        addEvent(element, 'keydown', function (e) {
          dispatch(e);
        });
        addEvent(window, 'focus', function () {
          _downKeys = [];
        });
        addEvent(element, 'keyup', function (e) {
          dispatch(e);
          clearModifier(e);
        });
      }
    }

    var _api = {
      setScope: setScope,
      getScope: getScope,
      deleteScope: deleteScope,
      getPressedKeyCodes: getPressedKeyCodes,
      isPressed: isPressed,
      filter: filter,
      unbind: unbind
    };

    for (var a in _api) {
      if (Object.prototype.hasOwnProperty.call(_api, a)) {
        hotkeys[a] = _api[a];
      }
    }

    if (typeof window !== 'undefined') {
      var _hotkeys = window.hotkeys;

      hotkeys.noConflict = function (deep) {
        if (deep && window.hotkeys === hotkeys) {
          window.hotkeys = _hotkeys;
        }

        return hotkeys;
      };

      window.hotkeys = hotkeys;
    }

    /* src\component\Modal.svelte generated by Svelte v3.31.2 */
    const file$6 = "src\\component\\Modal.svelte";

    function create_fragment$6(ctx) {
    	let div5;
    	let div0;
    	let t0;
    	let t1;
    	let t2;
    	let a;
    	let t3;
    	let div1;
    	let t4;
    	let div4;
    	let div2;
    	let t6;
    	let div3;
    	let current;
    	let mounted;
    	let dispose;
    	const default_slot_template = /*#slots*/ ctx[8].default;
    	const default_slot = create_slot(default_slot_template, ctx, /*$$scope*/ ctx[7], null);

    	const block = {
    		c: function create() {
    			div5 = element("div");
    			div0 = element("div");
    			t0 = text("  ");
    			t1 = text(/*title*/ ctx[2]);
    			t2 = space();
    			a = element("a");
    			t3 = space();
    			div1 = element("div");
    			if (default_slot) default_slot.c();
    			t4 = space();
    			div4 = element("div");
    			div2 = element("div");
    			div2.textContent = "保存";
    			t6 = space();
    			div3 = element("div");
    			div3.textContent = "取消";
    			attr_dev(a, "class", "modal-close svelte-tgt2cf");
    			add_location(a, file$6, 122, 8, 3392);
    			attr_dev(div0, "class", "modal-header svelte-tgt2cf");
    			set_style(div0, "background-color", /*theme*/ ctx[1].colors["titleBar.activeBackground"]);
    			add_location(div0, file$6, 119, 4, 3227);
    			attr_dev(div1, "class", "modal-content svelte-tgt2cf");
    			add_location(div1, file$6, 124, 4, 3464);
    			attr_dev(div2, "class", "modal-btn svelte-tgt2cf");
    			add_location(div2, file$6, 128, 8, 3632);
    			attr_dev(div3, "class", "modal-btn svelte-tgt2cf");
    			add_location(div3, file$6, 129, 8, 3701);
    			attr_dev(div4, "class", "modal-footer svelte-tgt2cf");
    			set_style(div4, "background-color", /*theme*/ ctx[1].colors["titleBar.activeBackground"]);
    			add_location(div4, file$6, 127, 4, 3526);
    			attr_dev(div5, "class", "modal svelte-tgt2cf");
    			set_style(div5, "width", /*width*/ ctx[3] + "px");
    			set_style(div5, "background", /*theme*/ ctx[1].colors["editorWidget.background"]);
    			set_style(div5, "display", /*show*/ ctx[0] ? "block" : "none");
    			add_location(div5, file$6, 117, 0, 3062);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div5, anchor);
    			append_dev(div5, div0);
    			append_dev(div0, t0);
    			append_dev(div0, t1);
    			append_dev(div0, t2);
    			append_dev(div0, a);
    			/*div0_binding*/ ctx[10](div0);
    			append_dev(div5, t3);
    			append_dev(div5, div1);

    			if (default_slot) {
    				default_slot.m(div1, null);
    			}

    			append_dev(div5, t4);
    			append_dev(div5, div4);
    			append_dev(div4, div2);
    			append_dev(div4, t6);
    			append_dev(div4, div3);
    			/*div5_binding*/ ctx[13](div5);
    			current = true;

    			if (!mounted) {
    				dispose = [
    					listen_dev(a, "click", /*click_handler*/ ctx[9], false, false, false),
    					listen_dev(div2, "click", /*click_handler_1*/ ctx[11], false, false, false),
    					listen_dev(div3, "click", /*click_handler_2*/ ctx[12], false, false, false)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (!current || dirty & /*title*/ 4) set_data_dev(t1, /*title*/ ctx[2]);

    			if (!current || dirty & /*theme*/ 2) {
    				set_style(div0, "background-color", /*theme*/ ctx[1].colors["titleBar.activeBackground"]);
    			}

    			if (default_slot) {
    				if (default_slot.p && dirty & /*$$scope*/ 128) {
    					update_slot(default_slot, default_slot_template, ctx, /*$$scope*/ ctx[7], dirty, null, null);
    				}
    			}

    			if (!current || dirty & /*theme*/ 2) {
    				set_style(div4, "background-color", /*theme*/ ctx[1].colors["titleBar.activeBackground"]);
    			}

    			if (!current || dirty & /*width*/ 8) {
    				set_style(div5, "width", /*width*/ ctx[3] + "px");
    			}

    			if (!current || dirty & /*theme*/ 2) {
    				set_style(div5, "background", /*theme*/ ctx[1].colors["editorWidget.background"]);
    			}

    			if (!current || dirty & /*show*/ 1) {
    				set_style(div5, "display", /*show*/ ctx[0] ? "block" : "none");
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(default_slot, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(default_slot, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div5);
    			/*div0_binding*/ ctx[10](null);
    			if (default_slot) default_slot.d(detaching);
    			/*div5_binding*/ ctx[13](null);
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$6.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$6($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("Modal", slots, ['default']);

    	let { theme } = $$props,
    		{ show = false } = $$props,
    		{ title = "标题" } = $$props,
    		{ width = 200 } = $$props;

    	let offset = [0, 0];
    	let divOverlay, divDrag;
    	let isDown = false, initFlag = false;
    	const dispatch = createEventDispatcher();

    	onMount(() => {
    		initFlag = true;

    		if (show) {
    			initDrag();
    		}
    	});

    	const initPosition = () => {
    		// init modal position
    		$$invalidate(4, divOverlay.style.left = (document.body.offsetWidth - divOverlay.offsetWidth) / 2 + "px", divOverlay);

    		$$invalidate(4, divOverlay.style.top = (document.body.offsetHeight - divOverlay.offsetHeight) / 4 + "px", divOverlay);
    	};

    	const initDrag = s => {
    		if (!s || !initFlag) {
    			return;
    		}

    		setTimeout(
    			() => {
    				initPosition();
    			},
    			0
    		);

    		divDrag.addEventListener(
    			"mousedown",
    			function (e) {
    				isDown = true;
    				offset = [divOverlay.offsetLeft - e.clientX, divOverlay.offsetTop - e.clientY];
    			},
    			true
    		);

    		document.addEventListener(
    			"mouseup",
    			function () {
    				isDown = false;
    			},
    			true
    		);

    		document.addEventListener(
    			"mousemove",
    			function (e) {
    				e.preventDefault();

    				if (isDown) {
    					const x = e.clientX + offset[0];
    					const y = e.clientY + offset[1];
    					let dragX = true, dragY = true;

    					if (x < 0 || x + width > document.body.offsetWidth) {
    						dragX = false;
    					}

    					if (y < 0 || y > document.body.offsetHeight - divOverlay.offsetHeight) {
    						dragY = false;
    					}

    					if (dragX) {
    						$$invalidate(4, divOverlay.style.left = x + "px", divOverlay);
    					}

    					if (dragY) {
    						$$invalidate(4, divOverlay.style.top = y + "px", divOverlay);
    					}
    				}
    			},
    			true
    		);
    	};

    	const saveClick = () => {
    		dispatch("save");
    	};

    	hotkeys("esc", function (event, handler) {
    		event.preventDefault();
    		$$invalidate(0, show = false);
    	});

    	const writable_props = ["theme", "show", "title", "width"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Modal> was created with unknown prop '${key}'`);
    	});

    	const click_handler = () => $$invalidate(0, show = false);

    	function div0_binding($$value) {
    		binding_callbacks[$$value ? "unshift" : "push"](() => {
    			divDrag = $$value;
    			$$invalidate(5, divDrag);
    		});
    	}

    	const click_handler_1 = () => saveClick();
    	const click_handler_2 = () => $$invalidate(0, show = false);

    	function div5_binding($$value) {
    		binding_callbacks[$$value ? "unshift" : "push"](() => {
    			divOverlay = $$value;
    			$$invalidate(4, divOverlay);
    		});
    	}

    	$$self.$$set = $$props => {
    		if ("theme" in $$props) $$invalidate(1, theme = $$props.theme);
    		if ("show" in $$props) $$invalidate(0, show = $$props.show);
    		if ("title" in $$props) $$invalidate(2, title = $$props.title);
    		if ("width" in $$props) $$invalidate(3, width = $$props.width);
    		if ("$$scope" in $$props) $$invalidate(7, $$scope = $$props.$$scope);
    	};

    	$$self.$capture_state = () => ({
    		createEventDispatcher,
    		onMount,
    		hotkeys,
    		theme,
    		show,
    		title,
    		width,
    		offset,
    		divOverlay,
    		divDrag,
    		isDown,
    		initFlag,
    		dispatch,
    		initPosition,
    		initDrag,
    		saveClick
    	});

    	$$self.$inject_state = $$props => {
    		if ("theme" in $$props) $$invalidate(1, theme = $$props.theme);
    		if ("show" in $$props) $$invalidate(0, show = $$props.show);
    		if ("title" in $$props) $$invalidate(2, title = $$props.title);
    		if ("width" in $$props) $$invalidate(3, width = $$props.width);
    		if ("offset" in $$props) offset = $$props.offset;
    		if ("divOverlay" in $$props) $$invalidate(4, divOverlay = $$props.divOverlay);
    		if ("divDrag" in $$props) $$invalidate(5, divDrag = $$props.divDrag);
    		if ("isDown" in $$props) isDown = $$props.isDown;
    		if ("initFlag" in $$props) initFlag = $$props.initFlag;
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*show*/ 1) {
    			 initDrag(show);
    		}
    	};

    	return [
    		show,
    		theme,
    		title,
    		width,
    		divOverlay,
    		divDrag,
    		saveClick,
    		$$scope,
    		slots,
    		click_handler,
    		div0_binding,
    		click_handler_1,
    		click_handler_2,
    		div5_binding
    	];
    }

    class Modal extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$6, create_fragment$6, safe_not_equal, { theme: 1, show: 0, title: 2, width: 3 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Modal",
    			options,
    			id: create_fragment$6.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*theme*/ ctx[1] === undefined && !("theme" in props)) {
    			console.warn("<Modal> was created without expected prop 'theme'");
    		}
    	}

    	get theme() {
    		throw new Error("<Modal>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set theme(value) {
    		throw new Error("<Modal>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get show() {
    		throw new Error("<Modal>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set show(value) {
    		throw new Error("<Modal>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get title() {
    		throw new Error("<Modal>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set title(value) {
    		throw new Error("<Modal>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get width() {
    		throw new Error("<Modal>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set width(value) {
    		throw new Error("<Modal>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src\component\Input.svelte generated by Svelte v3.31.2 */

    const file$7 = "src\\component\\Input.svelte";

    function create_fragment$7(ctx) {
    	let input;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			input = element("input");
    			set_style(input, "background-color", /*theme*/ ctx[1].colors["input.background"]);
    			set_style(input, "color", /*theme*/ ctx[1].colors["input.foreground"]);
    			attr_dev(input, "class", "input svelte-oa9b4g");
    			attr_dev(input, "type", /*type*/ ctx[3]);
    			input.value = /*value*/ ctx[0];
    			attr_dev(input, "placeholder", /*placeholder*/ ctx[2]);
    			add_location(input, file$7, 34, 0, 824);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, input, anchor);

    			if (!mounted) {
    				dispose = listen_dev(input, "input", /*handleInput*/ ctx[4], false, false, false);
    				mounted = true;
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*theme*/ 2) {
    				set_style(input, "background-color", /*theme*/ ctx[1].colors["input.background"]);
    			}

    			if (dirty & /*theme*/ 2) {
    				set_style(input, "color", /*theme*/ ctx[1].colors["input.foreground"]);
    			}

    			if (dirty & /*type*/ 8) {
    				attr_dev(input, "type", /*type*/ ctx[3]);
    			}

    			if (dirty & /*value*/ 1 && input.value !== /*value*/ ctx[0]) {
    				prop_dev(input, "value", /*value*/ ctx[0]);
    			}

    			if (dirty & /*placeholder*/ 4) {
    				attr_dev(input, "placeholder", /*placeholder*/ ctx[2]);
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(input);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$7.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$7($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("Input", slots, []);

    	let { theme } = $$props,
    		{ placeholder } = $$props,
    		{ type = "text" } = $$props,
    		{ value } = $$props;

    	const handleInput = e => {
    		// in here, you can switch on type and implement
    		// whatever behaviour you need
    		$$invalidate(0, value = type.match(/^(number|range)$/)
    		? +e.target.value
    		: e.target.value);
    	};

    	const writable_props = ["theme", "placeholder", "type", "value"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Input> was created with unknown prop '${key}'`);
    	});

    	$$self.$$set = $$props => {
    		if ("theme" in $$props) $$invalidate(1, theme = $$props.theme);
    		if ("placeholder" in $$props) $$invalidate(2, placeholder = $$props.placeholder);
    		if ("type" in $$props) $$invalidate(3, type = $$props.type);
    		if ("value" in $$props) $$invalidate(0, value = $$props.value);
    	};

    	$$self.$capture_state = () => ({
    		theme,
    		placeholder,
    		type,
    		value,
    		handleInput
    	});

    	$$self.$inject_state = $$props => {
    		if ("theme" in $$props) $$invalidate(1, theme = $$props.theme);
    		if ("placeholder" in $$props) $$invalidate(2, placeholder = $$props.placeholder);
    		if ("type" in $$props) $$invalidate(3, type = $$props.type);
    		if ("value" in $$props) $$invalidate(0, value = $$props.value);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [value, theme, placeholder, type, handleInput];
    }

    class Input extends SvelteComponentDev {
    	constructor(options) {
    		super(options);

    		init(this, options, instance$7, create_fragment$7, safe_not_equal, {
    			theme: 1,
    			placeholder: 2,
    			type: 3,
    			value: 0
    		});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Input",
    			options,
    			id: create_fragment$7.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*theme*/ ctx[1] === undefined && !("theme" in props)) {
    			console.warn("<Input> was created without expected prop 'theme'");
    		}

    		if (/*placeholder*/ ctx[2] === undefined && !("placeholder" in props)) {
    			console.warn("<Input> was created without expected prop 'placeholder'");
    		}

    		if (/*value*/ ctx[0] === undefined && !("value" in props)) {
    			console.warn("<Input> was created without expected prop 'value'");
    		}
    	}

    	get theme() {
    		throw new Error("<Input>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set theme(value) {
    		throw new Error("<Input>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get placeholder() {
    		throw new Error("<Input>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set placeholder(value) {
    		throw new Error("<Input>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get type() {
    		throw new Error("<Input>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set type(value) {
    		throw new Error("<Input>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get value() {
    		throw new Error("<Input>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set value(value) {
    		throw new Error("<Input>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src\component\ContextMenu.svelte generated by Svelte v3.31.2 */
    const file$8 = "src\\component\\ContextMenu.svelte";

    function get_each_context$2(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[11] = list[i];
    	return child_ctx;
    }

    // (56:0) {#if show}
    function create_if_block$1(ctx) {
    	let div1;
    	let div0;
    	let mounted;
    	let dispose;
    	let each_value = /*data*/ ctx[5];
    	validate_each_argument(each_value);
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block$2(get_each_context$2(ctx, each_value, i));
    	}

    	const block = {
    		c: function create() {
    			div1 = element("div");
    			div0 = element("div");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			attr_dev(div0, "class", "context-menu svelte-8fvpaq");
    			set_style(div0, "--title-bar-color", /*theme*/ ctx[1].colors["titleBar.activeForeground"]);
    			set_style(div0, "--title-bar-background", /*theme*/ ctx[1].colors["titleBar.activeBackground"]);
    			set_style(div0, "--title-menu-color", /*theme*/ ctx[1].colors["menu.foreground"]);
    			set_style(div0, "--title-menu-background", /*theme*/ ctx[1].colors["dropdown.background"]);
    			set_style(div0, "left", /*x*/ ctx[2] + "px");
    			set_style(div0, "top", /*y*/ ctx[3] + "px");
    			set_style(div0, "width", /*width*/ ctx[4] + "px");
    			add_location(div0, file$8, 57, 8, 1441);
    			attr_dev(div1, "class", "full-screen svelte-8fvpaq");
    			add_location(div1, file$8, 56, 4, 1378);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div1, anchor);
    			append_dev(div1, div0);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(div0, null);
    			}

    			if (!mounted) {
    				dispose = listen_dev(div1, "click", /*click_handler_1*/ ctx[9], false, false, false);
    				mounted = true;
    			}
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*data, clickMenu*/ 96) {
    				each_value = /*data*/ ctx[5];
    				validate_each_argument(each_value);
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context$2(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    					} else {
    						each_blocks[i] = create_each_block$2(child_ctx);
    						each_blocks[i].c();
    						each_blocks[i].m(div0, null);
    					}
    				}

    				for (; i < each_blocks.length; i += 1) {
    					each_blocks[i].d(1);
    				}

    				each_blocks.length = each_value.length;
    			}

    			if (dirty & /*theme*/ 2) {
    				set_style(div0, "--title-bar-color", /*theme*/ ctx[1].colors["titleBar.activeForeground"]);
    			}

    			if (dirty & /*theme*/ 2) {
    				set_style(div0, "--title-bar-background", /*theme*/ ctx[1].colors["titleBar.activeBackground"]);
    			}

    			if (dirty & /*theme*/ 2) {
    				set_style(div0, "--title-menu-color", /*theme*/ ctx[1].colors["menu.foreground"]);
    			}

    			if (dirty & /*theme*/ 2) {
    				set_style(div0, "--title-menu-background", /*theme*/ ctx[1].colors["dropdown.background"]);
    			}

    			if (dirty & /*x*/ 4) {
    				set_style(div0, "left", /*x*/ ctx[2] + "px");
    			}

    			if (dirty & /*y*/ 8) {
    				set_style(div0, "top", /*y*/ ctx[3] + "px");
    			}

    			if (dirty & /*width*/ 16) {
    				set_style(div0, "width", /*width*/ ctx[4] + "px");
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div1);
    			destroy_each(each_blocks, detaching);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$1.name,
    		type: "if",
    		source: "(56:0) {#if show}",
    		ctx
    	});

    	return block;
    }

    // (65:16) {:else}
    function create_else_block(ctx) {
    	let div;
    	let i;
    	let i_class_value;
    	let t0;
    	let t1_value = /*d*/ ctx[11].name + "";
    	let t1;
    	let t2;
    	let mounted;
    	let dispose;

    	function click_handler() {
    		return /*click_handler*/ ctx[8](/*d*/ ctx[11]);
    	}

    	const block = {
    		c: function create() {
    			div = element("div");
    			i = element("i");
    			t0 = space();
    			t1 = text(t1_value);
    			t2 = space();
    			attr_dev(i, "class", i_class_value = "" + (null_to_empty(/*d*/ ctx[11].icon) + " svelte-8fvpaq"));
    			add_location(i, file$8, 66, 24, 2017);
    			attr_dev(div, "class", "svelte-8fvpaq");
    			add_location(div, file$8, 65, 20, 1941);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, i);
    			append_dev(div, t0);
    			append_dev(div, t1);
    			append_dev(div, t2);

    			if (!mounted) {
    				dispose = listen_dev(div, "click", prevent_default(click_handler), false, true, false);
    				mounted = true;
    			}
    		},
    		p: function update(new_ctx, dirty) {
    			ctx = new_ctx;

    			if (dirty & /*data*/ 32 && i_class_value !== (i_class_value = "" + (null_to_empty(/*d*/ ctx[11].icon) + " svelte-8fvpaq"))) {
    				attr_dev(i, "class", i_class_value);
    			}

    			if (dirty & /*data*/ 32 && t1_value !== (t1_value = /*d*/ ctx[11].name + "")) set_data_dev(t1, t1_value);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_else_block.name,
    		type: "else",
    		source: "(65:16) {:else}",
    		ctx
    	});

    	return block;
    }

    // (63:16) {#if d.type == 'separator'}
    function create_if_block_1(ctx) {
    	let div;

    	const block = {
    		c: function create() {
    			div = element("div");
    			attr_dev(div, "class", "separator svelte-8fvpaq");
    			add_location(div, file$8, 63, 20, 1870);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    		},
    		p: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_1.name,
    		type: "if",
    		source: "(63:16) {#if d.type == 'separator'}",
    		ctx
    	});

    	return block;
    }

    // (62:12) {#each data as d}
    function create_each_block$2(ctx) {
    	let if_block_anchor;

    	function select_block_type(ctx, dirty) {
    		if (/*d*/ ctx[11].type == "separator") return create_if_block_1;
    		return create_else_block;
    	}

    	let current_block_type = select_block_type(ctx);
    	let if_block = current_block_type(ctx);

    	const block = {
    		c: function create() {
    			if_block.c();
    			if_block_anchor = empty();
    		},
    		m: function mount(target, anchor) {
    			if_block.m(target, anchor);
    			insert_dev(target, if_block_anchor, anchor);
    		},
    		p: function update(ctx, dirty) {
    			if (current_block_type === (current_block_type = select_block_type(ctx)) && if_block) {
    				if_block.p(ctx, dirty);
    			} else {
    				if_block.d(1);
    				if_block = current_block_type(ctx);

    				if (if_block) {
    					if_block.c();
    					if_block.m(if_block_anchor.parentNode, if_block_anchor);
    				}
    			}
    		},
    		d: function destroy(detaching) {
    			if_block.d(detaching);
    			if (detaching) detach_dev(if_block_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block$2.name,
    		type: "each",
    		source: "(62:12) {#each data as d}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$8(ctx) {
    	let if_block_anchor;
    	let if_block = /*show*/ ctx[0] && create_if_block$1(ctx);

    	const block = {
    		c: function create() {
    			if (if_block) if_block.c();
    			if_block_anchor = empty();
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			if (if_block) if_block.m(target, anchor);
    			insert_dev(target, if_block_anchor, anchor);
    		},
    		p: function update(ctx, [dirty]) {
    			if (/*show*/ ctx[0]) {
    				if (if_block) {
    					if_block.p(ctx, dirty);
    				} else {
    					if_block = create_if_block$1(ctx);
    					if_block.c();
    					if_block.m(if_block_anchor.parentNode, if_block_anchor);
    				}
    			} else if (if_block) {
    				if_block.d(1);
    				if_block = null;
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (if_block) if_block.d(detaching);
    			if (detaching) detach_dev(if_block_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$8.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$8($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("ContextMenu", slots, []);

    	let { theme } = $$props,
    		{ target } = $$props,
    		{ show = false } = $$props,
    		{ x = 50 } = $$props,
    		{ y = 50 } = $$props,
    		{ width = 200 } = $$props,
    		{ data = [] } = $$props;

    	const dispatch = createEventDispatcher();

    	const clickMenu = item => {
    		$$invalidate(0, show = false);
    		dispatch("click", item);
    	};

    	hotkeys("esc", function (event, handler) {
    		event.preventDefault();
    		$$invalidate(0, show = false);
    	});

    	const writable_props = ["theme", "target", "show", "x", "y", "width", "data"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<ContextMenu> was created with unknown prop '${key}'`);
    	});

    	const click_handler = d => clickMenu(d);
    	const click_handler_1 = () => $$invalidate(0, show = false);

    	$$self.$$set = $$props => {
    		if ("theme" in $$props) $$invalidate(1, theme = $$props.theme);
    		if ("target" in $$props) $$invalidate(7, target = $$props.target);
    		if ("show" in $$props) $$invalidate(0, show = $$props.show);
    		if ("x" in $$props) $$invalidate(2, x = $$props.x);
    		if ("y" in $$props) $$invalidate(3, y = $$props.y);
    		if ("width" in $$props) $$invalidate(4, width = $$props.width);
    		if ("data" in $$props) $$invalidate(5, data = $$props.data);
    	};

    	$$self.$capture_state = () => ({
    		hotkeys,
    		createEventDispatcher,
    		theme,
    		target,
    		show,
    		x,
    		y,
    		width,
    		data,
    		dispatch,
    		clickMenu
    	});

    	$$self.$inject_state = $$props => {
    		if ("theme" in $$props) $$invalidate(1, theme = $$props.theme);
    		if ("target" in $$props) $$invalidate(7, target = $$props.target);
    		if ("show" in $$props) $$invalidate(0, show = $$props.show);
    		if ("x" in $$props) $$invalidate(2, x = $$props.x);
    		if ("y" in $$props) $$invalidate(3, y = $$props.y);
    		if ("width" in $$props) $$invalidate(4, width = $$props.width);
    		if ("data" in $$props) $$invalidate(5, data = $$props.data);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [
    		show,
    		theme,
    		x,
    		y,
    		width,
    		data,
    		clickMenu,
    		target,
    		click_handler,
    		click_handler_1
    	];
    }

    class ContextMenu extends SvelteComponentDev {
    	constructor(options) {
    		super(options);

    		init(this, options, instance$8, create_fragment$8, safe_not_equal, {
    			theme: 1,
    			target: 7,
    			show: 0,
    			x: 2,
    			y: 3,
    			width: 4,
    			data: 5
    		});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "ContextMenu",
    			options,
    			id: create_fragment$8.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*theme*/ ctx[1] === undefined && !("theme" in props)) {
    			console.warn("<ContextMenu> was created without expected prop 'theme'");
    		}

    		if (/*target*/ ctx[7] === undefined && !("target" in props)) {
    			console.warn("<ContextMenu> was created without expected prop 'target'");
    		}
    	}

    	get theme() {
    		throw new Error("<ContextMenu>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set theme(value) {
    		throw new Error("<ContextMenu>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get target() {
    		throw new Error("<ContextMenu>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set target(value) {
    		throw new Error("<ContextMenu>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get show() {
    		throw new Error("<ContextMenu>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set show(value) {
    		throw new Error("<ContextMenu>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get x() {
    		throw new Error("<ContextMenu>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set x(value) {
    		throw new Error("<ContextMenu>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get y() {
    		throw new Error("<ContextMenu>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set y(value) {
    		throw new Error("<ContextMenu>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get width() {
    		throw new Error("<ContextMenu>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set width(value) {
    		throw new Error("<ContextMenu>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get data() {
    		throw new Error("<ContextMenu>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set data(value) {
    		throw new Error("<ContextMenu>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    function isEmpty(val) {
        if (val !== undefined && val != null && (val + '').trim() !== '')
            return false;
        else
            return true;
    }
    function validateData(data, ignore) {
        let index = 0;
        for (let k in data) {
            if (!(ignore && ignore[k])) {
                if (isEmpty(data[k])) {
                    index++;
                }
            }
        }
        return index == 0;
    }
    const allTerminal = {};
    function addTerminal(id, terminal) {
        allTerminal[id] = terminal;
    }
    function closeTerminal(id) {
        allTerminal[id].destroy();
    }

    const { dialog, getCurrentWindow } = require('electron').remote;
    function showError(msg) {
        return dialog.showMessageBox(getCurrentWindow(), {
            title: '错误提示',
            message: msg,
            type: 'error',
        });
    }
    function showConfirm(msg) {
        return dialog.showMessageBox(getCurrentWindow(), {
            type: 'question',
            buttons: ['否', '是'],
            title: '提示',
            defaultId: 1,
            message: msg,
            noLink: true
        });
    }

    /* src\component\ConfigPanel.svelte generated by Svelte v3.31.2 */

    const { Object: Object_1 } = globals;

    // (167:0) <SideBar bind:theme={theme} title="所有配置" {tools} on:toolClick={toolClick}>
    function create_default_slot_2(ctx) {
    	let listtree;
    	let updating_theme;
    	let updating_data;
    	let current;

    	function listtree_theme_binding(value) {
    		/*listtree_theme_binding*/ ctx[17].call(null, value);
    	}

    	function listtree_data_binding(value) {
    		/*listtree_data_binding*/ ctx[18].call(null, value);
    	}

    	let listtree_props = {};

    	if (/*theme*/ ctx[0] !== void 0) {
    		listtree_props.theme = /*theme*/ ctx[0];
    	}

    	if (/*tree*/ ctx[3] !== void 0) {
    		listtree_props.data = /*tree*/ ctx[3];
    	}

    	listtree = new ListTree({ props: listtree_props, $$inline: true });
    	binding_callbacks.push(() => bind(listtree, "theme", listtree_theme_binding));
    	binding_callbacks.push(() => bind(listtree, "data", listtree_data_binding));
    	listtree.$on("rightClick", /*treeRightClick*/ ctx[14]);
    	listtree.$on("click", /*treeClick*/ ctx[16]);

    	const block = {
    		c: function create() {
    			create_component(listtree.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(listtree, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const listtree_changes = {};

    			if (!updating_theme && dirty[0] & /*theme*/ 1) {
    				updating_theme = true;
    				listtree_changes.theme = /*theme*/ ctx[0];
    				add_flush_callback(() => updating_theme = false);
    			}

    			if (!updating_data && dirty[0] & /*tree*/ 8) {
    				updating_data = true;
    				listtree_changes.data = /*tree*/ ctx[3];
    				add_flush_callback(() => updating_data = false);
    			}

    			listtree.$set(listtree_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(listtree.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(listtree.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(listtree, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_2.name,
    		type: "slot",
    		source: "(167:0) <SideBar bind:theme={theme} title=\\\"所有配置\\\" {tools} on:toolClick={toolClick}>",
    		ctx
    	});

    	return block;
    }

    // (172:0) <Modal bind:theme={theme} bind:show={addFolderFlag} title="新建组" on:save={saveGroup}>
    function create_default_slot_1(ctx) {
    	let input;
    	let updating_theme;
    	let updating_value;
    	let current;

    	function input_theme_binding(value) {
    		/*input_theme_binding*/ ctx[25].call(null, value);
    	}

    	function input_value_binding(value) {
    		/*input_value_binding*/ ctx[26].call(null, value);
    	}

    	let input_props = { placeholder: "名称" };

    	if (/*theme*/ ctx[0] !== void 0) {
    		input_props.theme = /*theme*/ ctx[0];
    	}

    	if (/*groupName*/ ctx[4] !== void 0) {
    		input_props.value = /*groupName*/ ctx[4];
    	}

    	input = new Input({ props: input_props, $$inline: true });
    	binding_callbacks.push(() => bind(input, "theme", input_theme_binding));
    	binding_callbacks.push(() => bind(input, "value", input_value_binding));

    	const block = {
    		c: function create() {
    			create_component(input.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(input, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const input_changes = {};

    			if (!updating_theme && dirty[0] & /*theme*/ 1) {
    				updating_theme = true;
    				input_changes.theme = /*theme*/ ctx[0];
    				add_flush_callback(() => updating_theme = false);
    			}

    			if (!updating_value && dirty[0] & /*groupName*/ 16) {
    				updating_value = true;
    				input_changes.value = /*groupName*/ ctx[4];
    				add_flush_callback(() => updating_value = false);
    			}

    			input.$set(input_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(input.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(input.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(input, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_1.name,
    		type: "slot",
    		source: "(172:0) <Modal bind:theme={theme} bind:show={addFolderFlag} title=\\\"新建组\\\" on:save={saveGroup}>",
    		ctx
    	});

    	return block;
    }

    // (175:0) <Modal bind:theme={theme} bind:show={addSSHFlag} title="新建SSH连接" on:save={saveSSH}>
    function create_default_slot(ctx) {
    	let input0;
    	let updating_theme;
    	let updating_value;
    	let t0;
    	let input1;
    	let updating_theme_1;
    	let updating_value_1;
    	let t1;
    	let input2;
    	let updating_theme_2;
    	let updating_value_2;
    	let t2;
    	let input3;
    	let updating_theme_3;
    	let updating_value_3;
    	let t3;
    	let input4;
    	let updating_theme_4;
    	let updating_value_4;
    	let current;

    	function input0_theme_binding(value) {
    		/*input0_theme_binding*/ ctx[29].call(null, value);
    	}

    	function input0_value_binding(value) {
    		/*input0_value_binding*/ ctx[30].call(null, value);
    	}

    	let input0_props = { placeholder: "名称" };

    	if (/*theme*/ ctx[0] !== void 0) {
    		input0_props.theme = /*theme*/ ctx[0];
    	}

    	if (/*editData*/ ctx[5].name !== void 0) {
    		input0_props.value = /*editData*/ ctx[5].name;
    	}

    	input0 = new Input({ props: input0_props, $$inline: true });
    	binding_callbacks.push(() => bind(input0, "theme", input0_theme_binding));
    	binding_callbacks.push(() => bind(input0, "value", input0_value_binding));

    	function input1_theme_binding(value) {
    		/*input1_theme_binding*/ ctx[31].call(null, value);
    	}

    	function input1_value_binding(value) {
    		/*input1_value_binding*/ ctx[32].call(null, value);
    	}

    	let input1_props = { placeholder: "主机" };

    	if (/*theme*/ ctx[0] !== void 0) {
    		input1_props.theme = /*theme*/ ctx[0];
    	}

    	if (/*editData*/ ctx[5].host !== void 0) {
    		input1_props.value = /*editData*/ ctx[5].host;
    	}

    	input1 = new Input({ props: input1_props, $$inline: true });
    	binding_callbacks.push(() => bind(input1, "theme", input1_theme_binding));
    	binding_callbacks.push(() => bind(input1, "value", input1_value_binding));

    	function input2_theme_binding(value) {
    		/*input2_theme_binding*/ ctx[33].call(null, value);
    	}

    	function input2_value_binding(value) {
    		/*input2_value_binding*/ ctx[34].call(null, value);
    	}

    	let input2_props = { placeholder: "端口" };

    	if (/*theme*/ ctx[0] !== void 0) {
    		input2_props.theme = /*theme*/ ctx[0];
    	}

    	if (/*editData*/ ctx[5].port !== void 0) {
    		input2_props.value = /*editData*/ ctx[5].port;
    	}

    	input2 = new Input({ props: input2_props, $$inline: true });
    	binding_callbacks.push(() => bind(input2, "theme", input2_theme_binding));
    	binding_callbacks.push(() => bind(input2, "value", input2_value_binding));

    	function input3_theme_binding(value) {
    		/*input3_theme_binding*/ ctx[35].call(null, value);
    	}

    	function input3_value_binding(value) {
    		/*input3_value_binding*/ ctx[36].call(null, value);
    	}

    	let input3_props = { placeholder: "用户名" };

    	if (/*theme*/ ctx[0] !== void 0) {
    		input3_props.theme = /*theme*/ ctx[0];
    	}

    	if (/*editData*/ ctx[5].username !== void 0) {
    		input3_props.value = /*editData*/ ctx[5].username;
    	}

    	input3 = new Input({ props: input3_props, $$inline: true });
    	binding_callbacks.push(() => bind(input3, "theme", input3_theme_binding));
    	binding_callbacks.push(() => bind(input3, "value", input3_value_binding));

    	function input4_theme_binding(value) {
    		/*input4_theme_binding*/ ctx[37].call(null, value);
    	}

    	function input4_value_binding(value) {
    		/*input4_value_binding*/ ctx[38].call(null, value);
    	}

    	let input4_props = { placeholder: "密码", type: "password" };

    	if (/*theme*/ ctx[0] !== void 0) {
    		input4_props.theme = /*theme*/ ctx[0];
    	}

    	if (/*editData*/ ctx[5].password !== void 0) {
    		input4_props.value = /*editData*/ ctx[5].password;
    	}

    	input4 = new Input({ props: input4_props, $$inline: true });
    	binding_callbacks.push(() => bind(input4, "theme", input4_theme_binding));
    	binding_callbacks.push(() => bind(input4, "value", input4_value_binding));

    	const block = {
    		c: function create() {
    			create_component(input0.$$.fragment);
    			t0 = space();
    			create_component(input1.$$.fragment);
    			t1 = space();
    			create_component(input2.$$.fragment);
    			t2 = space();
    			create_component(input3.$$.fragment);
    			t3 = space();
    			create_component(input4.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(input0, target, anchor);
    			insert_dev(target, t0, anchor);
    			mount_component(input1, target, anchor);
    			insert_dev(target, t1, anchor);
    			mount_component(input2, target, anchor);
    			insert_dev(target, t2, anchor);
    			mount_component(input3, target, anchor);
    			insert_dev(target, t3, anchor);
    			mount_component(input4, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const input0_changes = {};

    			if (!updating_theme && dirty[0] & /*theme*/ 1) {
    				updating_theme = true;
    				input0_changes.theme = /*theme*/ ctx[0];
    				add_flush_callback(() => updating_theme = false);
    			}

    			if (!updating_value && dirty[0] & /*editData*/ 32) {
    				updating_value = true;
    				input0_changes.value = /*editData*/ ctx[5].name;
    				add_flush_callback(() => updating_value = false);
    			}

    			input0.$set(input0_changes);
    			const input1_changes = {};

    			if (!updating_theme_1 && dirty[0] & /*theme*/ 1) {
    				updating_theme_1 = true;
    				input1_changes.theme = /*theme*/ ctx[0];
    				add_flush_callback(() => updating_theme_1 = false);
    			}

    			if (!updating_value_1 && dirty[0] & /*editData*/ 32) {
    				updating_value_1 = true;
    				input1_changes.value = /*editData*/ ctx[5].host;
    				add_flush_callback(() => updating_value_1 = false);
    			}

    			input1.$set(input1_changes);
    			const input2_changes = {};

    			if (!updating_theme_2 && dirty[0] & /*theme*/ 1) {
    				updating_theme_2 = true;
    				input2_changes.theme = /*theme*/ ctx[0];
    				add_flush_callback(() => updating_theme_2 = false);
    			}

    			if (!updating_value_2 && dirty[0] & /*editData*/ 32) {
    				updating_value_2 = true;
    				input2_changes.value = /*editData*/ ctx[5].port;
    				add_flush_callback(() => updating_value_2 = false);
    			}

    			input2.$set(input2_changes);
    			const input3_changes = {};

    			if (!updating_theme_3 && dirty[0] & /*theme*/ 1) {
    				updating_theme_3 = true;
    				input3_changes.theme = /*theme*/ ctx[0];
    				add_flush_callback(() => updating_theme_3 = false);
    			}

    			if (!updating_value_3 && dirty[0] & /*editData*/ 32) {
    				updating_value_3 = true;
    				input3_changes.value = /*editData*/ ctx[5].username;
    				add_flush_callback(() => updating_value_3 = false);
    			}

    			input3.$set(input3_changes);
    			const input4_changes = {};

    			if (!updating_theme_4 && dirty[0] & /*theme*/ 1) {
    				updating_theme_4 = true;
    				input4_changes.theme = /*theme*/ ctx[0];
    				add_flush_callback(() => updating_theme_4 = false);
    			}

    			if (!updating_value_4 && dirty[0] & /*editData*/ 32) {
    				updating_value_4 = true;
    				input4_changes.value = /*editData*/ ctx[5].password;
    				add_flush_callback(() => updating_value_4 = false);
    			}

    			input4.$set(input4_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(input0.$$.fragment, local);
    			transition_in(input1.$$.fragment, local);
    			transition_in(input2.$$.fragment, local);
    			transition_in(input3.$$.fragment, local);
    			transition_in(input4.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(input0.$$.fragment, local);
    			transition_out(input1.$$.fragment, local);
    			transition_out(input2.$$.fragment, local);
    			transition_out(input3.$$.fragment, local);
    			transition_out(input4.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(input0, detaching);
    			if (detaching) detach_dev(t0);
    			destroy_component(input1, detaching);
    			if (detaching) detach_dev(t1);
    			destroy_component(input2, detaching);
    			if (detaching) detach_dev(t2);
    			destroy_component(input3, detaching);
    			if (detaching) detach_dev(t3);
    			destroy_component(input4, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot.name,
    		type: "slot",
    		source: "(175:0) <Modal bind:theme={theme} bind:show={addSSHFlag} title=\\\"新建SSH连接\\\" on:save={saveSSH}>",
    		ctx
    	});

    	return block;
    }

    function create_fragment$9(ctx) {
    	let sidebar;
    	let updating_theme;
    	let t0;
    	let contextmenu;
    	let updating_theme_1;
    	let updating_data;
    	let updating_show;
    	let updating_x;
    	let updating_y;
    	let t1;
    	let modal0;
    	let updating_theme_2;
    	let updating_show_1;
    	let t2;
    	let modal1;
    	let updating_theme_3;
    	let updating_show_2;
    	let current;

    	function sidebar_theme_binding(value) {
    		/*sidebar_theme_binding*/ ctx[19].call(null, value);
    	}

    	let sidebar_props = {
    		title: "所有配置",
    		tools: /*tools*/ ctx[10],
    		$$slots: { default: [create_default_slot_2] },
    		$$scope: { ctx }
    	};

    	if (/*theme*/ ctx[0] !== void 0) {
    		sidebar_props.theme = /*theme*/ ctx[0];
    	}

    	sidebar = new SideBar({ props: sidebar_props, $$inline: true });
    	binding_callbacks.push(() => bind(sidebar, "theme", sidebar_theme_binding));
    	sidebar.$on("toolClick", /*toolClick*/ ctx[11]);

    	function contextmenu_theme_binding(value) {
    		/*contextmenu_theme_binding*/ ctx[20].call(null, value);
    	}

    	function contextmenu_data_binding(value) {
    		/*contextmenu_data_binding*/ ctx[21].call(null, value);
    	}

    	function contextmenu_show_binding(value) {
    		/*contextmenu_show_binding*/ ctx[22].call(null, value);
    	}

    	function contextmenu_x_binding(value) {
    		/*contextmenu_x_binding*/ ctx[23].call(null, value);
    	}

    	function contextmenu_y_binding(value) {
    		/*contextmenu_y_binding*/ ctx[24].call(null, value);
    	}

    	let contextmenu_props = { width: "120" };

    	if (/*theme*/ ctx[0] !== void 0) {
    		contextmenu_props.theme = /*theme*/ ctx[0];
    	}

    	if (/*menu*/ ctx[9] !== void 0) {
    		contextmenu_props.data = /*menu*/ ctx[9];
    	}

    	if (/*menuShow*/ ctx[8] !== void 0) {
    		contextmenu_props.show = /*menuShow*/ ctx[8];
    	}

    	if (/*menuX*/ ctx[6] !== void 0) {
    		contextmenu_props.x = /*menuX*/ ctx[6];
    	}

    	if (/*menuY*/ ctx[7] !== void 0) {
    		contextmenu_props.y = /*menuY*/ ctx[7];
    	}

    	contextmenu = new ContextMenu({ props: contextmenu_props, $$inline: true });
    	binding_callbacks.push(() => bind(contextmenu, "theme", contextmenu_theme_binding));
    	binding_callbacks.push(() => bind(contextmenu, "data", contextmenu_data_binding));
    	binding_callbacks.push(() => bind(contextmenu, "show", contextmenu_show_binding));
    	binding_callbacks.push(() => bind(contextmenu, "x", contextmenu_x_binding));
    	binding_callbacks.push(() => bind(contextmenu, "y", contextmenu_y_binding));
    	contextmenu.$on("click", /*menuClick*/ ctx[15]);

    	function modal0_theme_binding(value) {
    		/*modal0_theme_binding*/ ctx[27].call(null, value);
    	}

    	function modal0_show_binding(value) {
    		/*modal0_show_binding*/ ctx[28].call(null, value);
    	}

    	let modal0_props = {
    		title: "新建组",
    		$$slots: { default: [create_default_slot_1] },
    		$$scope: { ctx }
    	};

    	if (/*theme*/ ctx[0] !== void 0) {
    		modal0_props.theme = /*theme*/ ctx[0];
    	}

    	if (/*addFolderFlag*/ ctx[1] !== void 0) {
    		modal0_props.show = /*addFolderFlag*/ ctx[1];
    	}

    	modal0 = new Modal({ props: modal0_props, $$inline: true });
    	binding_callbacks.push(() => bind(modal0, "theme", modal0_theme_binding));
    	binding_callbacks.push(() => bind(modal0, "show", modal0_show_binding));
    	modal0.$on("save", /*saveGroup*/ ctx[12]);

    	function modal1_theme_binding(value) {
    		/*modal1_theme_binding*/ ctx[39].call(null, value);
    	}

    	function modal1_show_binding(value) {
    		/*modal1_show_binding*/ ctx[40].call(null, value);
    	}

    	let modal1_props = {
    		title: "新建SSH连接",
    		$$slots: { default: [create_default_slot] },
    		$$scope: { ctx }
    	};

    	if (/*theme*/ ctx[0] !== void 0) {
    		modal1_props.theme = /*theme*/ ctx[0];
    	}

    	if (/*addSSHFlag*/ ctx[2] !== void 0) {
    		modal1_props.show = /*addSSHFlag*/ ctx[2];
    	}

    	modal1 = new Modal({ props: modal1_props, $$inline: true });
    	binding_callbacks.push(() => bind(modal1, "theme", modal1_theme_binding));
    	binding_callbacks.push(() => bind(modal1, "show", modal1_show_binding));
    	modal1.$on("save", /*saveSSH*/ ctx[13]);

    	const block = {
    		c: function create() {
    			create_component(sidebar.$$.fragment);
    			t0 = space();
    			create_component(contextmenu.$$.fragment);
    			t1 = space();
    			create_component(modal0.$$.fragment);
    			t2 = space();
    			create_component(modal1.$$.fragment);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			mount_component(sidebar, target, anchor);
    			insert_dev(target, t0, anchor);
    			mount_component(contextmenu, target, anchor);
    			insert_dev(target, t1, anchor);
    			mount_component(modal0, target, anchor);
    			insert_dev(target, t2, anchor);
    			mount_component(modal1, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const sidebar_changes = {};

    			if (dirty[0] & /*theme, tree*/ 9 | dirty[1] & /*$$scope*/ 262144) {
    				sidebar_changes.$$scope = { dirty, ctx };
    			}

    			if (!updating_theme && dirty[0] & /*theme*/ 1) {
    				updating_theme = true;
    				sidebar_changes.theme = /*theme*/ ctx[0];
    				add_flush_callback(() => updating_theme = false);
    			}

    			sidebar.$set(sidebar_changes);
    			const contextmenu_changes = {};

    			if (!updating_theme_1 && dirty[0] & /*theme*/ 1) {
    				updating_theme_1 = true;
    				contextmenu_changes.theme = /*theme*/ ctx[0];
    				add_flush_callback(() => updating_theme_1 = false);
    			}

    			if (!updating_data && dirty[0] & /*menu*/ 512) {
    				updating_data = true;
    				contextmenu_changes.data = /*menu*/ ctx[9];
    				add_flush_callback(() => updating_data = false);
    			}

    			if (!updating_show && dirty[0] & /*menuShow*/ 256) {
    				updating_show = true;
    				contextmenu_changes.show = /*menuShow*/ ctx[8];
    				add_flush_callback(() => updating_show = false);
    			}

    			if (!updating_x && dirty[0] & /*menuX*/ 64) {
    				updating_x = true;
    				contextmenu_changes.x = /*menuX*/ ctx[6];
    				add_flush_callback(() => updating_x = false);
    			}

    			if (!updating_y && dirty[0] & /*menuY*/ 128) {
    				updating_y = true;
    				contextmenu_changes.y = /*menuY*/ ctx[7];
    				add_flush_callback(() => updating_y = false);
    			}

    			contextmenu.$set(contextmenu_changes);
    			const modal0_changes = {};

    			if (dirty[0] & /*theme, groupName*/ 17 | dirty[1] & /*$$scope*/ 262144) {
    				modal0_changes.$$scope = { dirty, ctx };
    			}

    			if (!updating_theme_2 && dirty[0] & /*theme*/ 1) {
    				updating_theme_2 = true;
    				modal0_changes.theme = /*theme*/ ctx[0];
    				add_flush_callback(() => updating_theme_2 = false);
    			}

    			if (!updating_show_1 && dirty[0] & /*addFolderFlag*/ 2) {
    				updating_show_1 = true;
    				modal0_changes.show = /*addFolderFlag*/ ctx[1];
    				add_flush_callback(() => updating_show_1 = false);
    			}

    			modal0.$set(modal0_changes);
    			const modal1_changes = {};

    			if (dirty[0] & /*theme, editData*/ 33 | dirty[1] & /*$$scope*/ 262144) {
    				modal1_changes.$$scope = { dirty, ctx };
    			}

    			if (!updating_theme_3 && dirty[0] & /*theme*/ 1) {
    				updating_theme_3 = true;
    				modal1_changes.theme = /*theme*/ ctx[0];
    				add_flush_callback(() => updating_theme_3 = false);
    			}

    			if (!updating_show_2 && dirty[0] & /*addSSHFlag*/ 4) {
    				updating_show_2 = true;
    				modal1_changes.show = /*addSSHFlag*/ ctx[2];
    				add_flush_callback(() => updating_show_2 = false);
    			}

    			modal1.$set(modal1_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(sidebar.$$.fragment, local);
    			transition_in(contextmenu.$$.fragment, local);
    			transition_in(modal0.$$.fragment, local);
    			transition_in(modal1.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(sidebar.$$.fragment, local);
    			transition_out(contextmenu.$$.fragment, local);
    			transition_out(modal0.$$.fragment, local);
    			transition_out(modal1.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(sidebar, detaching);
    			if (detaching) detach_dev(t0);
    			destroy_component(contextmenu, detaching);
    			if (detaching) detach_dev(t1);
    			destroy_component(modal0, detaching);
    			if (detaching) detach_dev(t2);
    			destroy_component(modal1, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$9.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$9($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("ConfigPanel", slots, []);
    	let { theme } = $$props;
    	const dispatch = createEventDispatcher();
    	let addFolderFlag = false, addSSHFlag = false;
    	const config = require("./app/data/config-data");

    	// tools
    	let tools = [
    		{
    			key: "group",
    			icon: "icofont-ui-folder",
    			title: "新建文件夹"
    		},
    		{
    			key: "config",
    			icon: "icofont-database-add",
    			title: "新建配置"
    		},
    		{
    			key: "refresh",
    			icon: "icofont-refresh",
    			title: "刷新"
    		},
    		{
    			key: "expand",
    			icon: "icofont-rounded-expand",
    			title: "展开全部"
    		},
    		{
    			key: "collapse",
    			icon: "icofont-rounded-collapse",
    			title: "收缩全部"
    		}
    	];

    	// get all config tree data
    	let tree = [];

    	const getAllTree = () => {
    		config.getAllData().then(data => {
    			$$invalidate(3, tree = data);
    		});
    	};

    	getAllTree();

    	const toggleAll = (list, flag) => {
    		list.forEach(l => {
    			if (l.type == "folder") {
    				l.expanded = flag;

    				if (l.children.length > 0) {
    					toggleAll(l.children, flag);
    				}
    			}
    		});
    	};

    	// tree data parent id
    	let parentId;

    	const toolClick = ({ detail }) => {
    		if (detail.key == "group") {
    			parentId = null;
    			$$invalidate(1, addFolderFlag = !addFolderFlag);
    		} else if (detail.key == "config") {
    			parentId = null;
    			$$invalidate(2, addSSHFlag = !addSSHFlag);
    		} else if (detail.key == "refresh") {
    			getAllTree();
    		} else if (detail.key == "expand") {
    			toggleAll(tree, true);
    			$$invalidate(3, tree = [...tree]);
    		} else {
    			toggleAll(tree, false);
    			$$invalidate(3, tree = [...tree]);
    		}
    	};

    	// new group config
    	let groupName = "", groupId;

    	const saveGroup = () => {
    		if (isEmpty(groupName)) {
    			showError("请输入名称!");
    			return;
    		}

    		$$invalidate(1, addFolderFlag = false);

    		config.insert(groupId, {
    			type: "folder",
    			key: "folder",
    			parentId,
    			name: groupName
    		}).then(() => getAllTree());

    		$$invalidate(4, groupName = "");
    	};

    	// new ssh config
    	let editData = {
    		name: null,
    		host: null,
    		port: 22,
    		username: null,
    		password: null
    	};

    	const saveSSH = () => {
    		if (!validateData(editData, {
    			parentId: true,
    			children: true,
    			icon: true,
    			id: true
    		})) {
    			showError("请填写完所有数据!");
    			return;
    		}

    		$$invalidate(2, addSSHFlag = false);
    		config.insert(editData.id, Object.assign({ type: "file", key: "ssh", parentId }, editData)).then(() => getAllTree());
    		dispatch("addSSH", editData);

    		$$invalidate(5, editData = {
    			name: null,
    			host: null,
    			port: 22,
    			username: null,
    			password: null
    		});
    	};

    	// tree right click
    	let menuX, menuY, menuShow = false, nowItem;

    	let menu = [
    		{
    			name: "新建组",
    			key: "group",
    			icon: "icofont-ui-folder"
    		},
    		{
    			name: "新建SSH配置",
    			key: "config",
    			icon: "icofont-database-add"
    		},
    		{ type: "separator" },
    		{
    			name: "复制",
    			key: "copy",
    			icon: "icofont-ui-copy"
    		},
    		{
    			name: "编辑",
    			key: "edit",
    			icon: "icofont-ui-edit"
    		},
    		{
    			name: "删除",
    			key: "delete",
    			icon: "icofont-ui-delete"
    		}
    	];

    	const treeRightClick = ({ detail }) => {
    		$$invalidate(6, menuX = detail.x);
    		$$invalidate(7, menuY = detail.y);
    		$$invalidate(8, menuShow = !menuShow);
    		nowItem = detail.data;
    	};

    	const getListId = item => {
    		let list = [];
    		list.push(item.id);

    		if (item.type == "folder") {
    			item.children.forEach(l => {
    				list = list.concat(getListId(l));
    			});
    		}

    		return list;
    	};

    	const menuClick = ({ detail }) => {
    		if (detail.key == "group") {
    			parentId = nowItem.id;
    			$$invalidate(1, addFolderFlag = !addFolderFlag);
    		} else if (detail.key == "config") {
    			parentId = nowItem.id;
    			$$invalidate(2, addSSHFlag = !addSSHFlag);
    		} else if (detail.key == "copy") {
    			parentId = nowItem.parentId;

    			if (nowItem.type == "folder") {
    				groupId = null;
    				$$invalidate(4, groupName = nowItem.name);
    				$$invalidate(1, addFolderFlag = !addFolderFlag);
    			} else {
    				$$invalidate(5, editData = nowItem);
    				$$invalidate(5, editData.id = null, editData);
    				$$invalidate(2, addSSHFlag = !addSSHFlag);
    			}
    		} else if (detail.key == "edit") {
    			parentId = nowItem.parentId;

    			if (nowItem.type == "folder") {
    				groupId = nowItem.id;
    				$$invalidate(4, groupName = nowItem.name);
    				$$invalidate(1, addFolderFlag = !addFolderFlag);
    			} else {
    				$$invalidate(5, editData = nowItem);
    				$$invalidate(2, addSSHFlag = !addSSHFlag);
    			}
    		} else {
    			showConfirm(`确认删除[${nowItem.name}]吗?`).then(({ response }) => {
    				if (response === 1) {
    					config.deleteByIdList(getListId(nowItem)).then(() => getAllTree());
    				}
    			});
    		}
    	};

    	// return list tree click func
    	const treeClick = ({ detail }) => {
    		dispatch("treeClick", detail);
    	};

    	const writable_props = ["theme"];

    	Object_1.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<ConfigPanel> was created with unknown prop '${key}'`);
    	});

    	function listtree_theme_binding(value) {
    		theme = value;
    		$$invalidate(0, theme);
    	}

    	function listtree_data_binding(value) {
    		tree = value;
    		$$invalidate(3, tree);
    	}

    	function sidebar_theme_binding(value) {
    		theme = value;
    		$$invalidate(0, theme);
    	}

    	function contextmenu_theme_binding(value) {
    		theme = value;
    		$$invalidate(0, theme);
    	}

    	function contextmenu_data_binding(value) {
    		menu = value;
    		$$invalidate(9, menu);
    	}

    	function contextmenu_show_binding(value) {
    		menuShow = value;
    		$$invalidate(8, menuShow);
    	}

    	function contextmenu_x_binding(value) {
    		menuX = value;
    		$$invalidate(6, menuX);
    	}

    	function contextmenu_y_binding(value) {
    		menuY = value;
    		$$invalidate(7, menuY);
    	}

    	function input_theme_binding(value) {
    		theme = value;
    		$$invalidate(0, theme);
    	}

    	function input_value_binding(value) {
    		groupName = value;
    		$$invalidate(4, groupName);
    	}

    	function modal0_theme_binding(value) {
    		theme = value;
    		$$invalidate(0, theme);
    	}

    	function modal0_show_binding(value) {
    		addFolderFlag = value;
    		$$invalidate(1, addFolderFlag);
    	}

    	function input0_theme_binding(value) {
    		theme = value;
    		$$invalidate(0, theme);
    	}

    	function input0_value_binding(value) {
    		editData.name = value;
    		$$invalidate(5, editData);
    	}

    	function input1_theme_binding(value) {
    		theme = value;
    		$$invalidate(0, theme);
    	}

    	function input1_value_binding(value) {
    		editData.host = value;
    		$$invalidate(5, editData);
    	}

    	function input2_theme_binding(value) {
    		theme = value;
    		$$invalidate(0, theme);
    	}

    	function input2_value_binding(value) {
    		editData.port = value;
    		$$invalidate(5, editData);
    	}

    	function input3_theme_binding(value) {
    		theme = value;
    		$$invalidate(0, theme);
    	}

    	function input3_value_binding(value) {
    		editData.username = value;
    		$$invalidate(5, editData);
    	}

    	function input4_theme_binding(value) {
    		theme = value;
    		$$invalidate(0, theme);
    	}

    	function input4_value_binding(value) {
    		editData.password = value;
    		$$invalidate(5, editData);
    	}

    	function modal1_theme_binding(value) {
    		theme = value;
    		$$invalidate(0, theme);
    	}

    	function modal1_show_binding(value) {
    		addSSHFlag = value;
    		$$invalidate(2, addSSHFlag);
    	}

    	$$self.$$set = $$props => {
    		if ("theme" in $$props) $$invalidate(0, theme = $$props.theme);
    	};

    	$$self.$capture_state = () => ({
    		createEventDispatcher,
    		SideBar,
    		ListTree,
    		Modal,
    		Input,
    		ContextMenu,
    		validateData,
    		isEmpty,
    		showConfirm,
    		showError,
    		theme,
    		dispatch,
    		addFolderFlag,
    		addSSHFlag,
    		config,
    		tools,
    		tree,
    		getAllTree,
    		toggleAll,
    		parentId,
    		toolClick,
    		groupName,
    		groupId,
    		saveGroup,
    		editData,
    		saveSSH,
    		menuX,
    		menuY,
    		menuShow,
    		nowItem,
    		menu,
    		treeRightClick,
    		getListId,
    		menuClick,
    		treeClick
    	});

    	$$self.$inject_state = $$props => {
    		if ("theme" in $$props) $$invalidate(0, theme = $$props.theme);
    		if ("addFolderFlag" in $$props) $$invalidate(1, addFolderFlag = $$props.addFolderFlag);
    		if ("addSSHFlag" in $$props) $$invalidate(2, addSSHFlag = $$props.addSSHFlag);
    		if ("tools" in $$props) $$invalidate(10, tools = $$props.tools);
    		if ("tree" in $$props) $$invalidate(3, tree = $$props.tree);
    		if ("parentId" in $$props) parentId = $$props.parentId;
    		if ("groupName" in $$props) $$invalidate(4, groupName = $$props.groupName);
    		if ("groupId" in $$props) groupId = $$props.groupId;
    		if ("editData" in $$props) $$invalidate(5, editData = $$props.editData);
    		if ("menuX" in $$props) $$invalidate(6, menuX = $$props.menuX);
    		if ("menuY" in $$props) $$invalidate(7, menuY = $$props.menuY);
    		if ("menuShow" in $$props) $$invalidate(8, menuShow = $$props.menuShow);
    		if ("nowItem" in $$props) nowItem = $$props.nowItem;
    		if ("menu" in $$props) $$invalidate(9, menu = $$props.menu);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [
    		theme,
    		addFolderFlag,
    		addSSHFlag,
    		tree,
    		groupName,
    		editData,
    		menuX,
    		menuY,
    		menuShow,
    		menu,
    		tools,
    		toolClick,
    		saveGroup,
    		saveSSH,
    		treeRightClick,
    		menuClick,
    		treeClick,
    		listtree_theme_binding,
    		listtree_data_binding,
    		sidebar_theme_binding,
    		contextmenu_theme_binding,
    		contextmenu_data_binding,
    		contextmenu_show_binding,
    		contextmenu_x_binding,
    		contextmenu_y_binding,
    		input_theme_binding,
    		input_value_binding,
    		modal0_theme_binding,
    		modal0_show_binding,
    		input0_theme_binding,
    		input0_value_binding,
    		input1_theme_binding,
    		input1_value_binding,
    		input2_theme_binding,
    		input2_value_binding,
    		input3_theme_binding,
    		input3_value_binding,
    		input4_theme_binding,
    		input4_value_binding,
    		modal1_theme_binding,
    		modal1_show_binding
    	];
    }

    class ConfigPanel extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$9, create_fragment$9, safe_not_equal, { theme: 0 }, [-1, -1]);

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "ConfigPanel",
    			options,
    			id: create_fragment$9.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*theme*/ ctx[0] === undefined && !("theme" in props)) {
    			console.warn("<ConfigPanel> was created without expected prop 'theme'");
    		}
    	}

    	get theme() {
    		throw new Error("<ConfigPanel>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set theme(value) {
    		throw new Error("<ConfigPanel>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src\component\QuickInput.svelte generated by Svelte v3.31.2 */
    const file$9 = "src\\component\\QuickInput.svelte";

    function create_fragment$a(ctx) {
    	let div8;
    	let div5;
    	let div4;
    	let div3;
    	let div2;
    	let div1;
    	let div0;
    	let input_1;
    	let t;
    	let div7;
    	let div6;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			div8 = element("div");
    			div5 = element("div");
    			div4 = element("div");
    			div3 = element("div");
    			div2 = element("div");
    			div1 = element("div");
    			div0 = element("div");
    			input_1 = element("input");
    			t = space();
    			div7 = element("div");
    			div6 = element("div");
    			set_style(input_1, "background-color", /*theme*/ ctx[1].colors["input.background"]);
    			set_style(input_1, "color", /*theme*/ ctx[1].colors["input.foreground"]);
    			attr_dev(input_1, "class", "input svelte-7q66gf");
    			attr_dev(input_1, "type", "text");
    			attr_dev(input_1, "placeholder", "选择操作");
    			attr_dev(input_1, "title", "选择操作");
    			add_location(input_1, file$9, 100, 14, 2191);
    			attr_dev(div0, "class", "wrapper svelte-7q66gf");
    			add_location(div0, file$9, 99, 12, 2154);
    			attr_dev(div1, "class", "monaco-inputbox idle svelte-7q66gf");
    			add_location(div1, file$9, 98, 10, 2106);
    			attr_dev(div2, "class", "quick-input-box svelte-7q66gf");
    			add_location(div2, file$9, 97, 8, 2065);
    			attr_dev(div3, "class", "quick-input-filter svelte-7q66gf");
    			add_location(div3, file$9, 96, 6, 2023);
    			attr_dev(div4, "class", "quick-input-and-message svelte-7q66gf");
    			add_location(div4, file$9, 95, 4, 1978);
    			attr_dev(div5, "class", "quick-input-header svelte-7q66gf");
    			add_location(div5, file$9, 94, 2, 1940);
    			attr_dev(div6, "class", "progress-bit");
    			set_style(div6, "background-color", /*theme*/ ctx[1].colors["progressBar.background"]);
    			set_style(div6, "width", "20px");
    			set_style(div6, "opacity", "1");
    			set_style(div6, "display", /*loading*/ ctx[2]);
    			add_location(div6, file$9, 116, 4, 2685);
    			attr_dev(div7, "class", "monaco-progress-container");
    			add_location(div7, file$9, 115, 2, 2640);
    			attr_dev(div8, "class", "quick-input-widget show-file-icons svelte-7q66gf");
    			set_style(div8, "display", /*show*/ ctx[0]);
    			set_style(div8, "background", /*theme*/ ctx[1].colors["editorWidget.background"]);
    			add_location(div8, file$9, 91, 0, 1803);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div8, anchor);
    			append_dev(div8, div5);
    			append_dev(div5, div4);
    			append_dev(div4, div3);
    			append_dev(div3, div2);
    			append_dev(div2, div1);
    			append_dev(div1, div0);
    			append_dev(div0, input_1);
    			/*input_1_binding*/ ctx[5](input_1);
    			append_dev(div8, t);
    			append_dev(div8, div7);
    			append_dev(div7, div6);

    			if (!mounted) {
    				dispose = listen_dev(input_1, "blur", /*blur_handler*/ ctx[6], false, false, false);
    				mounted = true;
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*theme*/ 2) {
    				set_style(input_1, "background-color", /*theme*/ ctx[1].colors["input.background"]);
    			}

    			if (dirty & /*theme*/ 2) {
    				set_style(input_1, "color", /*theme*/ ctx[1].colors["input.foreground"]);
    			}

    			if (dirty & /*theme*/ 2) {
    				set_style(div6, "background-color", /*theme*/ ctx[1].colors["progressBar.background"]);
    			}

    			if (dirty & /*loading*/ 4) {
    				set_style(div6, "display", /*loading*/ ctx[2]);
    			}

    			if (dirty & /*show*/ 1) {
    				set_style(div8, "display", /*show*/ ctx[0]);
    			}

    			if (dirty & /*theme*/ 2) {
    				set_style(div8, "background", /*theme*/ ctx[1].colors["editorWidget.background"]);
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div8);
    			/*input_1_binding*/ ctx[5](null);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$a.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$a($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("QuickInput", slots, []);

    	let { theme } = $$props,
    		{ msg } = $$props,
    		{ loading } = $$props,
    		{ show } = $$props;

    	let input;

    	afterUpdate(() => {
    		if (show == "block") {
    			input.focus();
    		}
    	});

    	const writable_props = ["theme", "msg", "loading", "show"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<QuickInput> was created with unknown prop '${key}'`);
    	});

    	function input_1_binding($$value) {
    		binding_callbacks[$$value ? "unshift" : "push"](() => {
    			input = $$value;
    			$$invalidate(3, input);
    		});
    	}

    	const blur_handler = () => $$invalidate(0, show = "none");

    	$$self.$$set = $$props => {
    		if ("theme" in $$props) $$invalidate(1, theme = $$props.theme);
    		if ("msg" in $$props) $$invalidate(4, msg = $$props.msg);
    		if ("loading" in $$props) $$invalidate(2, loading = $$props.loading);
    		if ("show" in $$props) $$invalidate(0, show = $$props.show);
    	};

    	$$self.$capture_state = () => ({
    		theme,
    		msg,
    		loading,
    		show,
    		afterUpdate,
    		input
    	});

    	$$self.$inject_state = $$props => {
    		if ("theme" in $$props) $$invalidate(1, theme = $$props.theme);
    		if ("msg" in $$props) $$invalidate(4, msg = $$props.msg);
    		if ("loading" in $$props) $$invalidate(2, loading = $$props.loading);
    		if ("show" in $$props) $$invalidate(0, show = $$props.show);
    		if ("input" in $$props) $$invalidate(3, input = $$props.input);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [show, theme, loading, input, msg, input_1_binding, blur_handler];
    }

    class QuickInput extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$a, create_fragment$a, safe_not_equal, { theme: 1, msg: 4, loading: 2, show: 0 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "QuickInput",
    			options,
    			id: create_fragment$a.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*theme*/ ctx[1] === undefined && !("theme" in props)) {
    			console.warn("<QuickInput> was created without expected prop 'theme'");
    		}

    		if (/*msg*/ ctx[4] === undefined && !("msg" in props)) {
    			console.warn("<QuickInput> was created without expected prop 'msg'");
    		}

    		if (/*loading*/ ctx[2] === undefined && !("loading" in props)) {
    			console.warn("<QuickInput> was created without expected prop 'loading'");
    		}

    		if (/*show*/ ctx[0] === undefined && !("show" in props)) {
    			console.warn("<QuickInput> was created without expected prop 'show'");
    		}
    	}

    	get theme() {
    		throw new Error("<QuickInput>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set theme(value) {
    		throw new Error("<QuickInput>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get msg() {
    		throw new Error("<QuickInput>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set msg(value) {
    		throw new Error("<QuickInput>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get loading() {
    		throw new Error("<QuickInput>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set loading(value) {
    		throw new Error("<QuickInput>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get show() {
    		throw new Error("<QuickInput>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set show(value) {
    		throw new Error("<QuickInput>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    function createCommonjsModule(fn, basedir, module) {
    	return module = {
    		path: basedir,
    		exports: {},
    		require: function (path, base) {
    			return commonjsRequire(path, (base === undefined || base === null) ? module.path : base);
    		}
    	}, fn(module, module.exports), module.exports;
    }

    function commonjsRequire () {
    	throw new Error('Dynamic requires are not currently supported by @rollup/plugin-commonjs');
    }

    var collectionUtils = createCommonjsModule(function (module) {

    var utils = module.exports = {};

    /**
     * Loops through the collection and calls the callback for each element. if the callback returns truthy, the loop is broken and returns the same value.
     * @public
     * @param {*} collection The collection to loop through. Needs to have a length property set and have indices set from 0 to length - 1.
     * @param {function} callback The callback to be called for each element. The element will be given as a parameter to the callback. If this callback returns truthy, the loop is broken and the same value is returned.
     * @returns {*} The value that a callback has returned (if truthy). Otherwise nothing.
     */
    utils.forEach = function(collection, callback) {
        for(var i = 0; i < collection.length; i++) {
            var result = callback(collection[i]);
            if(result) {
                return result;
            }
        }
    };
    });

    var elementUtils = function(options) {
        var getState = options.stateHandler.getState;

        /**
         * Tells if the element has been made detectable and ready to be listened for resize events.
         * @public
         * @param {element} The element to check.
         * @returns {boolean} True or false depending on if the element is detectable or not.
         */
        function isDetectable(element) {
            var state = getState(element);
            return state && !!state.isDetectable;
        }

        /**
         * Marks the element that it has been made detectable and ready to be listened for resize events.
         * @public
         * @param {element} The element to mark.
         */
        function markAsDetectable(element) {
            getState(element).isDetectable = true;
        }

        /**
         * Tells if the element is busy or not.
         * @public
         * @param {element} The element to check.
         * @returns {boolean} True or false depending on if the element is busy or not.
         */
        function isBusy(element) {
            return !!getState(element).busy;
        }

        /**
         * Marks the object is busy and should not be made detectable.
         * @public
         * @param {element} element The element to mark.
         * @param {boolean} busy If the element is busy or not.
         */
        function markBusy(element, busy) {
            getState(element).busy = !!busy;
        }

        return {
            isDetectable: isDetectable,
            markAsDetectable: markAsDetectable,
            isBusy: isBusy,
            markBusy: markBusy
        };
    };

    var listenerHandler = function(idHandler) {
        var eventListeners = {};

        /**
         * Gets all listeners for the given element.
         * @public
         * @param {element} element The element to get all listeners for.
         * @returns All listeners for the given element.
         */
        function getListeners(element) {
            var id = idHandler.get(element);

            if (id === undefined) {
                return [];
            }

            return eventListeners[id] || [];
        }

        /**
         * Stores the given listener for the given element. Will not actually add the listener to the element.
         * @public
         * @param {element} element The element that should have the listener added.
         * @param {function} listener The callback that the element has added.
         */
        function addListener(element, listener) {
            var id = idHandler.get(element);

            if(!eventListeners[id]) {
                eventListeners[id] = [];
            }

            eventListeners[id].push(listener);
        }

        function removeListener(element, listener) {
            var listeners = getListeners(element);
            for (var i = 0, len = listeners.length; i < len; ++i) {
                if (listeners[i] === listener) {
                  listeners.splice(i, 1);
                  break;
                }
            }
        }

        function removeAllListeners(element) {
          var listeners = getListeners(element);
          if (!listeners) { return; }
          listeners.length = 0;
        }

        return {
            get: getListeners,
            add: addListener,
            removeListener: removeListener,
            removeAllListeners: removeAllListeners
        };
    };

    var idGenerator = function() {
        var idCount = 1;

        /**
         * Generates a new unique id in the context.
         * @public
         * @returns {number} A unique id in the context.
         */
        function generate() {
            return idCount++;
        }

        return {
            generate: generate
        };
    };

    var idHandler = function(options) {
        var idGenerator     = options.idGenerator;
        var getState        = options.stateHandler.getState;

        /**
         * Gets the resize detector id of the element.
         * @public
         * @param {element} element The target element to get the id of.
         * @returns {string|number|null} The id of the element. Null if it has no id.
         */
        function getId(element) {
            var state = getState(element);

            if (state && state.id !== undefined) {
                return state.id;
            }

            return null;
        }

        /**
         * Sets the resize detector id of the element. Requires the element to have a resize detector state initialized.
         * @public
         * @param {element} element The target element to set the id of.
         * @returns {string|number|null} The id of the element.
         */
        function setId(element) {
            var state = getState(element);

            if (!state) {
                throw new Error("setId required the element to have a resize detection state.");
            }

            var id = idGenerator.generate();

            state.id = id;

            return id;
        }

        return {
            get: getId,
            set: setId
        };
    };

    /* global console: false */

    /**
     * Reporter that handles the reporting of logs, warnings and errors.
     * @public
     * @param {boolean} quiet Tells if the reporter should be quiet or not.
     */
    var reporter = function(quiet) {
        function noop() {
            //Does nothing.
        }

        var reporter = {
            log: noop,
            warn: noop,
            error: noop
        };

        if(!quiet && window.console) {
            var attachFunction = function(reporter, name) {
                //The proxy is needed to be able to call the method with the console context,
                //since we cannot use bind.
                reporter[name] = function reporterProxy() {
                    var f = console[name];
                    if (f.apply) { //IE9 does not support console.log.apply :)
                        f.apply(console, arguments);
                    } else {
                        for (var i = 0; i < arguments.length; i++) {
                            f(arguments[i]);
                        }
                    }
                };
            };

            attachFunction(reporter, "log");
            attachFunction(reporter, "warn");
            attachFunction(reporter, "error");
        }

        return reporter;
    };

    var browserDetector = createCommonjsModule(function (module) {

    var detector = module.exports = {};

    detector.isIE = function(version) {
        function isAnyIeVersion() {
            var agent = navigator.userAgent.toLowerCase();
            return agent.indexOf("msie") !== -1 || agent.indexOf("trident") !== -1 || agent.indexOf(" edge/") !== -1;
        }

        if(!isAnyIeVersion()) {
            return false;
        }

        if(!version) {
            return true;
        }

        //Shamelessly stolen from https://gist.github.com/padolsey/527683
        var ieVersion = (function(){
            var undef,
                v = 3,
                div = document.createElement("div"),
                all = div.getElementsByTagName("i");

            do {
                div.innerHTML = "<!--[if gt IE " + (++v) + "]><i></i><![endif]-->";
            }
            while (all[0]);

            return v > 4 ? v : undef;
        }());

        return version === ieVersion;
    };

    detector.isLegacyOpera = function() {
        return !!window.opera;
    };
    });

    var utils_1 = createCommonjsModule(function (module) {

    var utils = module.exports = {};

    utils.getOption = getOption;

    function getOption(options, name, defaultValue) {
        var value = options[name];

        if((value === undefined || value === null) && defaultValue !== undefined) {
            return defaultValue;
        }

        return value;
    }
    });

    var batchProcessor = function batchProcessorMaker(options) {
        options             = options || {};
        var reporter        = options.reporter;
        var asyncProcess    = utils_1.getOption(options, "async", true);
        var autoProcess     = utils_1.getOption(options, "auto", true);

        if(autoProcess && !asyncProcess) {
            reporter && reporter.warn("Invalid options combination. auto=true and async=false is invalid. Setting async=true.");
            asyncProcess = true;
        }

        var batch = Batch();
        var asyncFrameHandler;
        var isProcessing = false;

        function addFunction(level, fn) {
            if(!isProcessing && autoProcess && asyncProcess && batch.size() === 0) {
                // Since this is async, it is guaranteed to be executed after that the fn is added to the batch.
                // This needs to be done before, since we're checking the size of the batch to be 0.
                processBatchAsync();
            }

            batch.add(level, fn);
        }

        function processBatch() {
            // Save the current batch, and create a new batch so that incoming functions are not added into the currently processing batch.
            // Continue processing until the top-level batch is empty (functions may be added to the new batch while processing, and so on).
            isProcessing = true;
            while (batch.size()) {
                var processingBatch = batch;
                batch = Batch();
                processingBatch.process();
            }
            isProcessing = false;
        }

        function forceProcessBatch(localAsyncProcess) {
            if (isProcessing) {
                return;
            }

            if(localAsyncProcess === undefined) {
                localAsyncProcess = asyncProcess;
            }

            if(asyncFrameHandler) {
                cancelFrame(asyncFrameHandler);
                asyncFrameHandler = null;
            }

            if(localAsyncProcess) {
                processBatchAsync();
            } else {
                processBatch();
            }
        }

        function processBatchAsync() {
            asyncFrameHandler = requestFrame(processBatch);
        }

        function cancelFrame(listener) {
            // var cancel = window.cancelAnimationFrame || window.mozCancelAnimationFrame || window.webkitCancelAnimationFrame || window.clearTimeout;
            var cancel = clearTimeout;
            return cancel(listener);
        }

        function requestFrame(callback) {
            // var raf = window.requestAnimationFrame || window.mozRequestAnimationFrame || window.webkitRequestAnimationFrame || function(fn) { return window.setTimeout(fn, 20); };
            var raf = function(fn) { return setTimeout(fn, 0); };
            return raf(callback);
        }

        return {
            add: addFunction,
            force: forceProcessBatch
        };
    };

    function Batch() {
        var batch       = {};
        var size        = 0;
        var topLevel    = 0;
        var bottomLevel = 0;

        function add(level, fn) {
            if(!fn) {
                fn = level;
                level = 0;
            }

            if(level > topLevel) {
                topLevel = level;
            } else if(level < bottomLevel) {
                bottomLevel = level;
            }

            if(!batch[level]) {
                batch[level] = [];
            }

            batch[level].push(fn);
            size++;
        }

        function process() {
            for(var level = bottomLevel; level <= topLevel; level++) {
                var fns = batch[level];

                for(var i = 0; i < fns.length; i++) {
                    var fn = fns[i];
                    fn();
                }
            }
        }

        function getSize() {
            return size;
        }

        return {
            add: add,
            process: process,
            size: getSize
        };
    }

    var prop = "_erd";

    function initState(element) {
        element[prop] = {};
        return getState(element);
    }

    function getState(element) {
        return element[prop];
    }

    function cleanState(element) {
        delete element[prop];
    }

    var stateHandler = {
        initState: initState,
        getState: getState,
        cleanState: cleanState
    };

    var object = function(options) {
        options             = options || {};
        var reporter        = options.reporter;
        var batchProcessor  = options.batchProcessor;
        var getState        = options.stateHandler.getState;

        if(!reporter) {
            throw new Error("Missing required dependency: reporter.");
        }

        /**
         * Adds a resize event listener to the element.
         * @public
         * @param {element} element The element that should have the listener added.
         * @param {function} listener The listener callback to be called for each resize event of the element. The element will be given as a parameter to the listener callback.
         */
        function addListener(element, listener) {
            function listenerProxy() {
                listener(element);
            }

            if(browserDetector.isIE(8)) {
                //IE 8 does not support object, but supports the resize event directly on elements.
                getState(element).object = {
                    proxy: listenerProxy
                };
                element.attachEvent("onresize", listenerProxy);
            } else {
                var object = getObject(element);

                if(!object) {
                    throw new Error("Element is not detectable by this strategy.");
                }

                object.contentDocument.defaultView.addEventListener("resize", listenerProxy);
            }
        }

        function buildCssTextString(rules) {
            var seperator = options.important ? " !important; " : "; ";

            return (rules.join(seperator) + seperator).trim();
        }

        /**
         * Makes an element detectable and ready to be listened for resize events. Will call the callback when the element is ready to be listened for resize changes.
         * @private
         * @param {object} options Optional options object.
         * @param {element} element The element to make detectable
         * @param {function} callback The callback to be called when the element is ready to be listened for resize changes. Will be called with the element as first parameter.
         */
        function makeDetectable(options, element, callback) {
            if (!callback) {
                callback = element;
                element = options;
                options = null;
            }

            options = options || {};
            var debug = options.debug;

            function injectObject(element, callback) {
                var OBJECT_STYLE = buildCssTextString(["display: block", "position: absolute", "top: 0", "left: 0", "width: 100%", "height: 100%", "border: none", "padding: 0", "margin: 0", "opacity: 0", "z-index: -1000", "pointer-events: none"]);

                //The target element needs to be positioned (everything except static) so the absolute positioned object will be positioned relative to the target element.

                // Position altering may be performed directly or on object load, depending on if style resolution is possible directly or not.
                var positionCheckPerformed = false;

                // The element may not yet be attached to the DOM, and therefore the style object may be empty in some browsers.
                // Since the style object is a reference, it will be updated as soon as the element is attached to the DOM.
                var style = window.getComputedStyle(element);
                var width = element.offsetWidth;
                var height = element.offsetHeight;

                getState(element).startSize = {
                    width: width,
                    height: height
                };

                function mutateDom() {
                    function alterPositionStyles() {
                        if(style.position === "static") {
                            element.style.setProperty("position", "relative", options.important ? "important" : "");

                            var removeRelativeStyles = function(reporter, element, style, property) {
                                function getNumericalValue(value) {
                                    return value.replace(/[^-\d\.]/g, "");
                                }

                                var value = style[property];

                                if(value !== "auto" && getNumericalValue(value) !== "0") {
                                    reporter.warn("An element that is positioned static has style." + property + "=" + value + " which is ignored due to the static positioning. The element will need to be positioned relative, so the style." + property + " will be set to 0. Element: ", element);
                                    element.style.setProperty(property, "0", options.important ? "important" : "");
                                }
                            };

                            //Check so that there are no accidental styles that will make the element styled differently now that is is relative.
                            //If there are any, set them to 0 (this should be okay with the user since the style properties did nothing before [since the element was positioned static] anyway).
                            removeRelativeStyles(reporter, element, style, "top");
                            removeRelativeStyles(reporter, element, style, "right");
                            removeRelativeStyles(reporter, element, style, "bottom");
                            removeRelativeStyles(reporter, element, style, "left");
                        }
                    }

                    function onObjectLoad() {
                        // The object has been loaded, which means that the element now is guaranteed to be attached to the DOM.
                        if (!positionCheckPerformed) {
                            alterPositionStyles();
                        }

                        /*jshint validthis: true */

                        function getDocument(element, callback) {
                            //Opera 12 seem to call the object.onload before the actual document has been created.
                            //So if it is not present, poll it with an timeout until it is present.
                            //TODO: Could maybe be handled better with object.onreadystatechange or similar.
                            if(!element.contentDocument) {
                                var state = getState(element);
                                if (state.checkForObjectDocumentTimeoutId) {
                                    window.clearTimeout(state.checkForObjectDocumentTimeoutId);
                                }
                                state.checkForObjectDocumentTimeoutId = setTimeout(function checkForObjectDocument() {
                                    state.checkForObjectDocumentTimeoutId = 0;
                                    getDocument(element, callback);
                                }, 100);

                                return;
                            }

                            callback(element.contentDocument);
                        }

                        //Mutating the object element here seems to fire another load event.
                        //Mutating the inner document of the object element is fine though.
                        var objectElement = this;

                        //Create the style element to be added to the object.
                        getDocument(objectElement, function onObjectDocumentReady(objectDocument) {
                            //Notify that the element is ready to be listened to.
                            callback(element);
                        });
                    }

                    // The element may be detached from the DOM, and some browsers does not support style resolving of detached elements.
                    // The alterPositionStyles needs to be delayed until we know the element has been attached to the DOM (which we are sure of when the onObjectLoad has been fired), if style resolution is not possible.
                    if (style.position !== "") {
                        alterPositionStyles();
                        positionCheckPerformed = true;
                    }

                    //Add an object element as a child to the target element that will be listened to for resize events.
                    var object = document.createElement("object");
                    object.style.cssText = OBJECT_STYLE;
                    object.tabIndex = -1;
                    object.type = "text/html";
                    object.setAttribute("aria-hidden", "true");
                    object.onload = onObjectLoad;

                    //Safari: This must occur before adding the object to the DOM.
                    //IE: Does not like that this happens before, even if it is also added after.
                    if(!browserDetector.isIE()) {
                        object.data = "about:blank";
                    }

                    if (!getState(element)) {
                        // The element has been uninstalled before the actual loading happened.
                        return;
                    }

                    element.appendChild(object);
                    getState(element).object = object;

                    //IE: This must occur after adding the object to the DOM.
                    if(browserDetector.isIE()) {
                        object.data = "about:blank";
                    }
                }

                if(batchProcessor) {
                    batchProcessor.add(mutateDom);
                } else {
                    mutateDom();
                }
            }

            if(browserDetector.isIE(8)) {
                //IE 8 does not support objects properly. Luckily they do support the resize event.
                //So do not inject the object and notify that the element is already ready to be listened to.
                //The event handler for the resize event is attached in the utils.addListener instead.
                callback(element);
            } else {
                injectObject(element, callback);
            }
        }

        /**
         * Returns the child object of the target element.
         * @private
         * @param {element} element The target element.
         * @returns The object element of the target.
         */
        function getObject(element) {
            return getState(element).object;
        }

        function uninstall(element) {
            if (!getState(element)) {
                return;
            }

            var object = getObject(element);

            if (!object) {
                return;
            }

            if (browserDetector.isIE(8)) {
                element.detachEvent("onresize", object.proxy);
            } else {
                element.removeChild(object);
            }

            if (getState(element).checkForObjectDocumentTimeoutId) {
                window.clearTimeout(getState(element).checkForObjectDocumentTimeoutId);
            }

            delete getState(element).object;
        }

        return {
            makeDetectable: makeDetectable,
            addListener: addListener,
            uninstall: uninstall
        };
    };

    var forEach = collectionUtils.forEach;

    var scroll = function(options) {
        options             = options || {};
        var reporter        = options.reporter;
        var batchProcessor  = options.batchProcessor;
        var getState        = options.stateHandler.getState;
        var hasState        = options.stateHandler.hasState;
        var idHandler       = options.idHandler;

        if (!batchProcessor) {
            throw new Error("Missing required dependency: batchProcessor");
        }

        if (!reporter) {
            throw new Error("Missing required dependency: reporter.");
        }

        //TODO: Could this perhaps be done at installation time?
        var scrollbarSizes = getScrollbarSizes();

        var styleId = "erd_scroll_detection_scrollbar_style";
        var detectionContainerClass = "erd_scroll_detection_container";

        function initDocument(targetDocument) {
            // Inject the scrollbar styling that prevents them from appearing sometimes in Chrome.
            // The injected container needs to have a class, so that it may be styled with CSS (pseudo elements).
            injectScrollStyle(targetDocument, styleId, detectionContainerClass);
        }

        initDocument(window.document);

        function buildCssTextString(rules) {
            var seperator = options.important ? " !important; " : "; ";

            return (rules.join(seperator) + seperator).trim();
        }

        function getScrollbarSizes() {
            var width = 500;
            var height = 500;

            var child = document.createElement("div");
            child.style.cssText = buildCssTextString(["position: absolute", "width: " + width*2 + "px", "height: " + height*2 + "px", "visibility: hidden", "margin: 0", "padding: 0"]);

            var container = document.createElement("div");
            container.style.cssText = buildCssTextString(["position: absolute", "width: " + width + "px", "height: " + height + "px", "overflow: scroll", "visibility: none", "top: " + -width*3 + "px", "left: " + -height*3 + "px", "visibility: hidden", "margin: 0", "padding: 0"]);

            container.appendChild(child);

            document.body.insertBefore(container, document.body.firstChild);

            var widthSize = width - container.clientWidth;
            var heightSize = height - container.clientHeight;

            document.body.removeChild(container);

            return {
                width: widthSize,
                height: heightSize
            };
        }

        function injectScrollStyle(targetDocument, styleId, containerClass) {
            function injectStyle(style, method) {
                method = method || function (element) {
                    targetDocument.head.appendChild(element);
                };

                var styleElement = targetDocument.createElement("style");
                styleElement.innerHTML = style;
                styleElement.id = styleId;
                method(styleElement);
                return styleElement;
            }

            if (!targetDocument.getElementById(styleId)) {
                var containerAnimationClass = containerClass + "_animation";
                var containerAnimationActiveClass = containerClass + "_animation_active";
                var style = "/* Created by the element-resize-detector library. */\n";
                style += "." + containerClass + " > div::-webkit-scrollbar { " + buildCssTextString(["display: none"]) + " }\n\n";
                style += "." + containerAnimationActiveClass + " { " + buildCssTextString(["-webkit-animation-duration: 0.1s", "animation-duration: 0.1s", "-webkit-animation-name: " + containerAnimationClass, "animation-name: " + containerAnimationClass]) + " }\n";
                style += "@-webkit-keyframes " + containerAnimationClass +  " { 0% { opacity: 1; } 50% { opacity: 0; } 100% { opacity: 1; } }\n";
                style += "@keyframes " + containerAnimationClass +          " { 0% { opacity: 1; } 50% { opacity: 0; } 100% { opacity: 1; } }";
                injectStyle(style);
            }
        }

        function addAnimationClass(element) {
            element.className += " " + detectionContainerClass + "_animation_active";
        }

        function addEvent(el, name, cb) {
            if (el.addEventListener) {
                el.addEventListener(name, cb);
            } else if(el.attachEvent) {
                el.attachEvent("on" + name, cb);
            } else {
                return reporter.error("[scroll] Don't know how to add event listeners.");
            }
        }

        function removeEvent(el, name, cb) {
            if (el.removeEventListener) {
                el.removeEventListener(name, cb);
            } else if(el.detachEvent) {
                el.detachEvent("on" + name, cb);
            } else {
                return reporter.error("[scroll] Don't know how to remove event listeners.");
            }
        }

        function getExpandElement(element) {
            return getState(element).container.childNodes[0].childNodes[0].childNodes[0];
        }

        function getShrinkElement(element) {
            return getState(element).container.childNodes[0].childNodes[0].childNodes[1];
        }

        /**
         * Adds a resize event listener to the element.
         * @public
         * @param {element} element The element that should have the listener added.
         * @param {function} listener The listener callback to be called for each resize event of the element. The element will be given as a parameter to the listener callback.
         */
        function addListener(element, listener) {
            var listeners = getState(element).listeners;

            if (!listeners.push) {
                throw new Error("Cannot add listener to an element that is not detectable.");
            }

            getState(element).listeners.push(listener);
        }

        /**
         * Makes an element detectable and ready to be listened for resize events. Will call the callback when the element is ready to be listened for resize changes.
         * @private
         * @param {object} options Optional options object.
         * @param {element} element The element to make detectable
         * @param {function} callback The callback to be called when the element is ready to be listened for resize changes. Will be called with the element as first parameter.
         */
        function makeDetectable(options, element, callback) {
            if (!callback) {
                callback = element;
                element = options;
                options = null;
            }

            options = options || {};

            function debug() {
                if (options.debug) {
                    var args = Array.prototype.slice.call(arguments);
                    args.unshift(idHandler.get(element), "Scroll: ");
                    if (reporter.log.apply) {
                        reporter.log.apply(null, args);
                    } else {
                        for (var i = 0; i < args.length; i++) {
                            reporter.log(args[i]);
                        }
                    }
                }
            }

            function isDetached(element) {
                function isInDocument(element) {
                    return element === element.ownerDocument.body || element.ownerDocument.body.contains(element);
                }

                if (!isInDocument(element)) {
                    return true;
                }

                // FireFox returns null style in hidden iframes. See https://github.com/wnr/element-resize-detector/issues/68 and https://bugzilla.mozilla.org/show_bug.cgi?id=795520
                if (window.getComputedStyle(element) === null) {
                    return true;
                }

                return false;
            }

            function isUnrendered(element) {
                // Check the absolute positioned container since the top level container is display: inline.
                var container = getState(element).container.childNodes[0];
                var style = window.getComputedStyle(container);
                return !style.width || style.width.indexOf("px") === -1; //Can only compute pixel value when rendered.
            }

            function getStyle() {
                // Some browsers only force layouts when actually reading the style properties of the style object, so make sure that they are all read here,
                // so that the user of the function can be sure that it will perform the layout here, instead of later (important for batching).
                var elementStyle            = window.getComputedStyle(element);
                var style                   = {};
                style.position              = elementStyle.position;
                style.width                 = element.offsetWidth;
                style.height                = element.offsetHeight;
                style.top                   = elementStyle.top;
                style.right                 = elementStyle.right;
                style.bottom                = elementStyle.bottom;
                style.left                  = elementStyle.left;
                style.widthCSS              = elementStyle.width;
                style.heightCSS             = elementStyle.height;
                return style;
            }

            function storeStartSize() {
                var style = getStyle();
                getState(element).startSize = {
                    width: style.width,
                    height: style.height
                };
                debug("Element start size", getState(element).startSize);
            }

            function initListeners() {
                getState(element).listeners = [];
            }

            function storeStyle() {
                debug("storeStyle invoked.");
                if (!getState(element)) {
                    debug("Aborting because element has been uninstalled");
                    return;
                }

                var style = getStyle();
                getState(element).style = style;
            }

            function storeCurrentSize(element, width, height) {
                getState(element).lastWidth = width;
                getState(element).lastHeight  = height;
            }

            function getExpandChildElement(element) {
                return getExpandElement(element).childNodes[0];
            }

            function getWidthOffset() {
                return 2 * scrollbarSizes.width + 1;
            }

            function getHeightOffset() {
                return 2 * scrollbarSizes.height + 1;
            }

            function getExpandWidth(width) {
                return width + 10 + getWidthOffset();
            }

            function getExpandHeight(height) {
                return height + 10 + getHeightOffset();
            }

            function getShrinkWidth(width) {
                return width * 2 + getWidthOffset();
            }

            function getShrinkHeight(height) {
                return height * 2 + getHeightOffset();
            }

            function positionScrollbars(element, width, height) {
                var expand          = getExpandElement(element);
                var shrink          = getShrinkElement(element);
                var expandWidth     = getExpandWidth(width);
                var expandHeight    = getExpandHeight(height);
                var shrinkWidth     = getShrinkWidth(width);
                var shrinkHeight    = getShrinkHeight(height);
                expand.scrollLeft   = expandWidth;
                expand.scrollTop    = expandHeight;
                shrink.scrollLeft   = shrinkWidth;
                shrink.scrollTop    = shrinkHeight;
            }

            function injectContainerElement() {
                var container = getState(element).container;

                if (!container) {
                    container                   = document.createElement("div");
                    container.className         = detectionContainerClass;
                    container.style.cssText     = buildCssTextString(["visibility: hidden", "display: inline", "width: 0px", "height: 0px", "z-index: -1", "overflow: hidden", "margin: 0", "padding: 0"]);
                    getState(element).container = container;
                    addAnimationClass(container);
                    element.appendChild(container);

                    var onAnimationStart = function () {
                        getState(element).onRendered && getState(element).onRendered();
                    };

                    addEvent(container, "animationstart", onAnimationStart);

                    // Store the event handler here so that they may be removed when uninstall is called.
                    // See uninstall function for an explanation why it is needed.
                    getState(element).onAnimationStart = onAnimationStart;
                }

                return container;
            }

            function injectScrollElements() {
                function alterPositionStyles() {
                    var style = getState(element).style;

                    if(style.position === "static") {
                        element.style.setProperty("position", "relative",options.important ? "important" : "");

                        var removeRelativeStyles = function(reporter, element, style, property) {
                            function getNumericalValue(value) {
                                return value.replace(/[^-\d\.]/g, "");
                            }

                            var value = style[property];

                            if(value !== "auto" && getNumericalValue(value) !== "0") {
                                reporter.warn("An element that is positioned static has style." + property + "=" + value + " which is ignored due to the static positioning. The element will need to be positioned relative, so the style." + property + " will be set to 0. Element: ", element);
                                element.style[property] = 0;
                            }
                        };

                        //Check so that there are no accidental styles that will make the element styled differently now that is is relative.
                        //If there are any, set them to 0 (this should be okay with the user since the style properties did nothing before [since the element was positioned static] anyway).
                        removeRelativeStyles(reporter, element, style, "top");
                        removeRelativeStyles(reporter, element, style, "right");
                        removeRelativeStyles(reporter, element, style, "bottom");
                        removeRelativeStyles(reporter, element, style, "left");
                    }
                }

                function getLeftTopBottomRightCssText(left, top, bottom, right) {
                    left = (!left ? "0" : (left + "px"));
                    top = (!top ? "0" : (top + "px"));
                    bottom = (!bottom ? "0" : (bottom + "px"));
                    right = (!right ? "0" : (right + "px"));

                    return ["left: " + left, "top: " + top, "right: " + right, "bottom: " + bottom];
                }

                debug("Injecting elements");

                if (!getState(element)) {
                    debug("Aborting because element has been uninstalled");
                    return;
                }

                alterPositionStyles();

                var rootContainer = getState(element).container;

                if (!rootContainer) {
                    rootContainer = injectContainerElement();
                }

                // Due to this WebKit bug https://bugs.webkit.org/show_bug.cgi?id=80808 (currently fixed in Blink, but still present in WebKit browsers such as Safari),
                // we need to inject two containers, one that is width/height 100% and another that is left/top -1px so that the final container always is 1x1 pixels bigger than
                // the targeted element.
                // When the bug is resolved, "containerContainer" may be removed.

                // The outer container can occasionally be less wide than the targeted when inside inline elements element in WebKit (see https://bugs.webkit.org/show_bug.cgi?id=152980).
                // This should be no problem since the inner container either way makes sure the injected scroll elements are at least 1x1 px.

                var scrollbarWidth          = scrollbarSizes.width;
                var scrollbarHeight         = scrollbarSizes.height;
                var containerContainerStyle = buildCssTextString(["position: absolute", "flex: none", "overflow: hidden", "z-index: -1", "visibility: hidden", "width: 100%", "height: 100%", "left: 0px", "top: 0px"]);
                var containerStyle          = buildCssTextString(["position: absolute", "flex: none", "overflow: hidden", "z-index: -1", "visibility: hidden"].concat(getLeftTopBottomRightCssText(-(1 + scrollbarWidth), -(1 + scrollbarHeight), -scrollbarHeight, -scrollbarWidth)));
                var expandStyle             = buildCssTextString(["position: absolute", "flex: none", "overflow: scroll", "z-index: -1", "visibility: hidden", "width: 100%", "height: 100%"]);
                var shrinkStyle             = buildCssTextString(["position: absolute", "flex: none", "overflow: scroll", "z-index: -1", "visibility: hidden", "width: 100%", "height: 100%"]);
                var expandChildStyle        = buildCssTextString(["position: absolute", "left: 0", "top: 0"]);
                var shrinkChildStyle        = buildCssTextString(["position: absolute", "width: 200%", "height: 200%"]);

                var containerContainer      = document.createElement("div");
                var container               = document.createElement("div");
                var expand                  = document.createElement("div");
                var expandChild             = document.createElement("div");
                var shrink                  = document.createElement("div");
                var shrinkChild             = document.createElement("div");

                // Some browsers choke on the resize system being rtl, so force it to ltr. https://github.com/wnr/element-resize-detector/issues/56
                // However, dir should not be set on the top level container as it alters the dimensions of the target element in some browsers.
                containerContainer.dir              = "ltr";

                containerContainer.style.cssText    = containerContainerStyle;
                containerContainer.className        = detectionContainerClass;
                container.className                 = detectionContainerClass;
                container.style.cssText             = containerStyle;
                expand.style.cssText                = expandStyle;
                expandChild.style.cssText           = expandChildStyle;
                shrink.style.cssText                = shrinkStyle;
                shrinkChild.style.cssText           = shrinkChildStyle;

                expand.appendChild(expandChild);
                shrink.appendChild(shrinkChild);
                container.appendChild(expand);
                container.appendChild(shrink);
                containerContainer.appendChild(container);
                rootContainer.appendChild(containerContainer);

                function onExpandScroll() {
                    getState(element).onExpand && getState(element).onExpand();
                }

                function onShrinkScroll() {
                    getState(element).onShrink && getState(element).onShrink();
                }

                addEvent(expand, "scroll", onExpandScroll);
                addEvent(shrink, "scroll", onShrinkScroll);

                // Store the event handlers here so that they may be removed when uninstall is called.
                // See uninstall function for an explanation why it is needed.
                getState(element).onExpandScroll = onExpandScroll;
                getState(element).onShrinkScroll = onShrinkScroll;
            }

            function registerListenersAndPositionElements() {
                function updateChildSizes(element, width, height) {
                    var expandChild             = getExpandChildElement(element);
                    var expandWidth             = getExpandWidth(width);
                    var expandHeight            = getExpandHeight(height);
                    expandChild.style.setProperty("width", expandWidth + "px", options.important ? "important" : "");
                    expandChild.style.setProperty("height", expandHeight + "px", options.important ? "important" : "");
                }

                function updateDetectorElements(done) {
                    var width           = element.offsetWidth;
                    var height          = element.offsetHeight;

                    // Check whether the size has actually changed since last time the algorithm ran. If not, some steps may be skipped.
                    var sizeChanged = width !== getState(element).lastWidth || height !== getState(element).lastHeight;

                    debug("Storing current size", width, height);

                    // Store the size of the element sync here, so that multiple scroll events may be ignored in the event listeners.
                    // Otherwise the if-check in handleScroll is useless.
                    storeCurrentSize(element, width, height);

                    // Since we delay the processing of the batch, there is a risk that uninstall has been called before the batch gets to execute.
                    // Since there is no way to cancel the fn executions, we need to add an uninstall guard to all fns of the batch.

                    batchProcessor.add(0, function performUpdateChildSizes() {
                        if (!sizeChanged) {
                            return;
                        }

                        if (!getState(element)) {
                            debug("Aborting because element has been uninstalled");
                            return;
                        }

                        if (!areElementsInjected()) {
                            debug("Aborting because element container has not been initialized");
                            return;
                        }

                        if (options.debug) {
                            var w = element.offsetWidth;
                            var h = element.offsetHeight;

                            if (w !== width || h !== height) {
                                reporter.warn(idHandler.get(element), "Scroll: Size changed before updating detector elements.");
                            }
                        }

                        updateChildSizes(element, width, height);
                    });

                    batchProcessor.add(1, function updateScrollbars() {
                        // This function needs to be invoked event though the size is unchanged. The element could have been resized very quickly and then
                        // been restored to the original size, which will have changed the scrollbar positions.

                        if (!getState(element)) {
                            debug("Aborting because element has been uninstalled");
                            return;
                        }

                        if (!areElementsInjected()) {
                            debug("Aborting because element container has not been initialized");
                            return;
                        }

                        positionScrollbars(element, width, height);
                    });

                    if (sizeChanged && done) {
                        batchProcessor.add(2, function () {
                            if (!getState(element)) {
                                debug("Aborting because element has been uninstalled");
                                return;
                            }

                            if (!areElementsInjected()) {
                              debug("Aborting because element container has not been initialized");
                              return;
                            }

                            done();
                        });
                    }
                }

                function areElementsInjected() {
                    return !!getState(element).container;
                }

                function notifyListenersIfNeeded() {
                    function isFirstNotify() {
                        return getState(element).lastNotifiedWidth === undefined;
                    }

                    debug("notifyListenersIfNeeded invoked");

                    var state = getState(element);

                    // Don't notify if the current size is the start size, and this is the first notification.
                    if (isFirstNotify() && state.lastWidth === state.startSize.width && state.lastHeight === state.startSize.height) {
                        return debug("Not notifying: Size is the same as the start size, and there has been no notification yet.");
                    }

                    // Don't notify if the size already has been notified.
                    if (state.lastWidth === state.lastNotifiedWidth && state.lastHeight === state.lastNotifiedHeight) {
                        return debug("Not notifying: Size already notified");
                    }


                    debug("Current size not notified, notifying...");
                    state.lastNotifiedWidth = state.lastWidth;
                    state.lastNotifiedHeight = state.lastHeight;
                    forEach(getState(element).listeners, function (listener) {
                        listener(element);
                    });
                }

                function handleRender() {
                    debug("startanimation triggered.");

                    if (isUnrendered(element)) {
                        debug("Ignoring since element is still unrendered...");
                        return;
                    }

                    debug("Element rendered.");
                    var expand = getExpandElement(element);
                    var shrink = getShrinkElement(element);
                    if (expand.scrollLeft === 0 || expand.scrollTop === 0 || shrink.scrollLeft === 0 || shrink.scrollTop === 0) {
                        debug("Scrollbars out of sync. Updating detector elements...");
                        updateDetectorElements(notifyListenersIfNeeded);
                    }
                }

                function handleScroll() {
                    debug("Scroll detected.");

                    if (isUnrendered(element)) {
                        // Element is still unrendered. Skip this scroll event.
                        debug("Scroll event fired while unrendered. Ignoring...");
                        return;
                    }

                    updateDetectorElements(notifyListenersIfNeeded);
                }

                debug("registerListenersAndPositionElements invoked.");

                if (!getState(element)) {
                    debug("Aborting because element has been uninstalled");
                    return;
                }

                getState(element).onRendered = handleRender;
                getState(element).onExpand = handleScroll;
                getState(element).onShrink = handleScroll;

                var style = getState(element).style;
                updateChildSizes(element, style.width, style.height);
            }

            function finalizeDomMutation() {
                debug("finalizeDomMutation invoked.");

                if (!getState(element)) {
                    debug("Aborting because element has been uninstalled");
                    return;
                }

                var style = getState(element).style;
                storeCurrentSize(element, style.width, style.height);
                positionScrollbars(element, style.width, style.height);
            }

            function ready() {
                callback(element);
            }

            function install() {
                debug("Installing...");
                initListeners();
                storeStartSize();

                batchProcessor.add(0, storeStyle);
                batchProcessor.add(1, injectScrollElements);
                batchProcessor.add(2, registerListenersAndPositionElements);
                batchProcessor.add(3, finalizeDomMutation);
                batchProcessor.add(4, ready);
            }

            debug("Making detectable...");

            if (isDetached(element)) {
                debug("Element is detached");

                injectContainerElement();

                debug("Waiting until element is attached...");

                getState(element).onRendered = function () {
                    debug("Element is now attached");
                    install();
                };
            } else {
                install();
            }
        }

        function uninstall(element) {
            var state = getState(element);

            if (!state) {
                // Uninstall has been called on a non-erd element.
                return;
            }

            // Uninstall may have been called in the following scenarios:
            // (1) Right between the sync code and async batch (here state.busy = true, but nothing have been registered or injected).
            // (2) In the ready callback of the last level of the batch by another element (here, state.busy = true, but all the stuff has been injected).
            // (3) After the installation process (here, state.busy = false and all the stuff has been injected).
            // So to be on the safe side, let's check for each thing before removing.

            // We need to remove the event listeners, because otherwise the event might fire on an uninstall element which results in an error when trying to get the state of the element.
            state.onExpandScroll && removeEvent(getExpandElement(element), "scroll", state.onExpandScroll);
            state.onShrinkScroll && removeEvent(getShrinkElement(element), "scroll", state.onShrinkScroll);
            state.onAnimationStart && removeEvent(state.container, "animationstart", state.onAnimationStart);

            state.container && element.removeChild(state.container);
        }

        return {
            makeDetectable: makeDetectable,
            addListener: addListener,
            uninstall: uninstall,
            initDocument: initDocument
        };
    };

    var forEach$1                 = collectionUtils.forEach;









    //Detection strategies.



    function isCollection(obj) {
        return Array.isArray(obj) || obj.length !== undefined;
    }

    function toArray(collection) {
        if (!Array.isArray(collection)) {
            var array = [];
            forEach$1(collection, function (obj) {
                array.push(obj);
            });
            return array;
        } else {
            return collection;
        }
    }

    function isElement(obj) {
        return obj && obj.nodeType === 1;
    }

    /**
     * @typedef idHandler
     * @type {object}
     * @property {function} get Gets the resize detector id of the element.
     * @property {function} set Generate and sets the resize detector id of the element.
     */

    /**
     * @typedef Options
     * @type {object}
     * @property {boolean} callOnAdd    Determines if listeners should be called when they are getting added.
                                        Default is true. If true, the listener is guaranteed to be called when it has been added.
                                        If false, the listener will not be guarenteed to be called when it has been added (does not prevent it from being called).
     * @property {idHandler} idHandler  A custom id handler that is responsible for generating, setting and retrieving id's for elements.
                                        If not provided, a default id handler will be used.
     * @property {reporter} reporter    A custom reporter that handles reporting logs, warnings and errors.
                                        If not provided, a default id handler will be used.
                                        If set to false, then nothing will be reported.
     * @property {boolean} debug        If set to true, the the system will report debug messages as default for the listenTo method.
     */

    /**
     * Creates an element resize detector instance.
     * @public
     * @param {Options?} options Optional global options object that will decide how this instance will work.
     */
    var elementResizeDetector = function(options) {
        options = options || {};

        //idHandler is currently not an option to the listenTo function, so it should not be added to globalOptions.
        var idHandler$1;

        if (options.idHandler) {
            // To maintain compatability with idHandler.get(element, readonly), make sure to wrap the given idHandler
            // so that readonly flag always is true when it's used here. This may be removed next major version bump.
            idHandler$1 = {
                get: function (element) { return options.idHandler.get(element, true); },
                set: options.idHandler.set
            };
        } else {
            var idGenerator$1 = idGenerator();
            var defaultIdHandler = idHandler({
                idGenerator: idGenerator$1,
                stateHandler: stateHandler
            });
            idHandler$1 = defaultIdHandler;
        }

        //reporter is currently not an option to the listenTo function, so it should not be added to globalOptions.
        var reporter$1 = options.reporter;

        if(!reporter$1) {
            //If options.reporter is false, then the reporter should be quiet.
            var quiet = reporter$1 === false;
            reporter$1 = reporter(quiet);
        }

        //batchProcessor is currently not an option to the listenTo function, so it should not be added to globalOptions.
        var batchProcessor$1 = getOption(options, "batchProcessor", batchProcessor({ reporter: reporter$1 }));

        //Options to be used as default for the listenTo function.
        var globalOptions = {};
        globalOptions.callOnAdd     = !!getOption(options, "callOnAdd", true);
        globalOptions.debug         = !!getOption(options, "debug", false);

        var eventListenerHandler    = listenerHandler(idHandler$1);
        var elementUtils$1            = elementUtils({
            stateHandler: stateHandler
        });

        //The detection strategy to be used.
        var detectionStrategy;
        var desiredStrategy = getOption(options, "strategy", "object");
        var importantCssRules = getOption(options, "important", false);
        var strategyOptions = {
            reporter: reporter$1,
            batchProcessor: batchProcessor$1,
            stateHandler: stateHandler,
            idHandler: idHandler$1,
            important: importantCssRules
        };

        if(desiredStrategy === "scroll") {
            if (browserDetector.isLegacyOpera()) {
                reporter$1.warn("Scroll strategy is not supported on legacy Opera. Changing to object strategy.");
                desiredStrategy = "object";
            } else if (browserDetector.isIE(9)) {
                reporter$1.warn("Scroll strategy is not supported on IE9. Changing to object strategy.");
                desiredStrategy = "object";
            }
        }

        if(desiredStrategy === "scroll") {
            detectionStrategy = scroll(strategyOptions);
        } else if(desiredStrategy === "object") {
            detectionStrategy = object(strategyOptions);
        } else {
            throw new Error("Invalid strategy name: " + desiredStrategy);
        }

        //Calls can be made to listenTo with elements that are still being installed.
        //Also, same elements can occur in the elements list in the listenTo function.
        //With this map, the ready callbacks can be synchronized between the calls
        //so that the ready callback can always be called when an element is ready - even if
        //it wasn't installed from the function itself.
        var onReadyCallbacks = {};

        /**
         * Makes the given elements resize-detectable and starts listening to resize events on the elements. Calls the event callback for each event for each element.
         * @public
         * @param {Options?} options Optional options object. These options will override the global options. Some options may not be overriden, such as idHandler.
         * @param {element[]|element} elements The given array of elements to detect resize events of. Single element is also valid.
         * @param {function} listener The callback to be executed for each resize event for each element.
         */
        function listenTo(options, elements, listener) {
            function onResizeCallback(element) {
                var listeners = eventListenerHandler.get(element);
                forEach$1(listeners, function callListenerProxy(listener) {
                    listener(element);
                });
            }

            function addListener(callOnAdd, element, listener) {
                eventListenerHandler.add(element, listener);

                if(callOnAdd) {
                    listener(element);
                }
            }

            //Options object may be omitted.
            if(!listener) {
                listener = elements;
                elements = options;
                options = {};
            }

            if(!elements) {
                throw new Error("At least one element required.");
            }

            if(!listener) {
                throw new Error("Listener required.");
            }

            if (isElement(elements)) {
                // A single element has been passed in.
                elements = [elements];
            } else if (isCollection(elements)) {
                // Convert collection to array for plugins.
                // TODO: May want to check so that all the elements in the collection are valid elements.
                elements = toArray(elements);
            } else {
                return reporter$1.error("Invalid arguments. Must be a DOM element or a collection of DOM elements.");
            }

            var elementsReady = 0;

            var callOnAdd = getOption(options, "callOnAdd", globalOptions.callOnAdd);
            var onReadyCallback = getOption(options, "onReady", function noop() {});
            var debug = getOption(options, "debug", globalOptions.debug);

            forEach$1(elements, function attachListenerToElement(element) {
                if (!stateHandler.getState(element)) {
                    stateHandler.initState(element);
                    idHandler$1.set(element);
                }

                var id = idHandler$1.get(element);

                debug && reporter$1.log("Attaching listener to element", id, element);

                if(!elementUtils$1.isDetectable(element)) {
                    debug && reporter$1.log(id, "Not detectable.");
                    if(elementUtils$1.isBusy(element)) {
                        debug && reporter$1.log(id, "System busy making it detectable");

                        //The element is being prepared to be detectable. Do not make it detectable.
                        //Just add the listener, because the element will soon be detectable.
                        addListener(callOnAdd, element, listener);
                        onReadyCallbacks[id] = onReadyCallbacks[id] || [];
                        onReadyCallbacks[id].push(function onReady() {
                            elementsReady++;

                            if(elementsReady === elements.length) {
                                onReadyCallback();
                            }
                        });
                        return;
                    }

                    debug && reporter$1.log(id, "Making detectable...");
                    //The element is not prepared to be detectable, so do prepare it and add a listener to it.
                    elementUtils$1.markBusy(element, true);
                    return detectionStrategy.makeDetectable({ debug: debug, important: importantCssRules }, element, function onElementDetectable(element) {
                        debug && reporter$1.log(id, "onElementDetectable");

                        if (stateHandler.getState(element)) {
                            elementUtils$1.markAsDetectable(element);
                            elementUtils$1.markBusy(element, false);
                            detectionStrategy.addListener(element, onResizeCallback);
                            addListener(callOnAdd, element, listener);

                            // Since the element size might have changed since the call to "listenTo", we need to check for this change,
                            // so that a resize event may be emitted.
                            // Having the startSize object is optional (since it does not make sense in some cases such as unrendered elements), so check for its existance before.
                            // Also, check the state existance before since the element may have been uninstalled in the installation process.
                            var state = stateHandler.getState(element);
                            if (state && state.startSize) {
                                var width = element.offsetWidth;
                                var height = element.offsetHeight;
                                if (state.startSize.width !== width || state.startSize.height !== height) {
                                    onResizeCallback(element);
                                }
                            }

                            if(onReadyCallbacks[id]) {
                                forEach$1(onReadyCallbacks[id], function(callback) {
                                    callback();
                                });
                            }
                        } else {
                            // The element has been unisntalled before being detectable.
                            debug && reporter$1.log(id, "Element uninstalled before being detectable.");
                        }

                        delete onReadyCallbacks[id];

                        elementsReady++;
                        if(elementsReady === elements.length) {
                            onReadyCallback();
                        }
                    });
                }

                debug && reporter$1.log(id, "Already detecable, adding listener.");

                //The element has been prepared to be detectable and is ready to be listened to.
                addListener(callOnAdd, element, listener);
                elementsReady++;
            });

            if(elementsReady === elements.length) {
                onReadyCallback();
            }
        }

        function uninstall(elements) {
            if(!elements) {
                return reporter$1.error("At least one element is required.");
            }

            if (isElement(elements)) {
                // A single element has been passed in.
                elements = [elements];
            } else if (isCollection(elements)) {
                // Convert collection to array for plugins.
                // TODO: May want to check so that all the elements in the collection are valid elements.
                elements = toArray(elements);
            } else {
                return reporter$1.error("Invalid arguments. Must be a DOM element or a collection of DOM elements.");
            }

            forEach$1(elements, function (element) {
                eventListenerHandler.removeAllListeners(element);
                detectionStrategy.uninstall(element);
                stateHandler.cleanState(element);
            });
        }

        function initDocument(targetDocument) {
            detectionStrategy.initDocument && detectionStrategy.initDocument(targetDocument);
        }

        return {
            listenTo: listenTo,
            removeListener: eventListenerHandler.removeListener,
            removeAllListeners: eventListenerHandler.removeAllListeners,
            uninstall: uninstall,
            initDocument: initDocument
        };
    };

    function getOption(options, name, defaultValue) {
        var value = options[name];

        if((value === undefined || value === null) && defaultValue !== undefined) {
            return defaultValue;
        }

        return value;
    }

    var erd = elementResizeDetector({ strategy: "scroll" });
    function watchResize(element, handler) {
        erd.listenTo(element, handler);
        var currentHandler = handler;
        return {
            update: function (newHandler) {
                erd.removeListener(element, currentHandler);
                erd.listenTo(element, newHandler);
                currentHandler = newHandler;
            },
            destroy: function () {
                erd.removeListener(element, currentHandler);
            },
        };
    }

    /* src\component\Terminal.svelte generated by Svelte v3.31.2 */
    const file$a = "src\\component\\Terminal.svelte";

    function create_fragment$b(ctx) {
    	let div;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			div = element("div");
    			attr_dev(div, "class", "terminal svelte-1kmx7zy");
    			add_location(div, file$a, 39, 0, 896);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			/*div_binding*/ ctx[5](div);

    			if (!mounted) {
    				dispose = action_destroyer(watchResize.call(null, div, /*fit*/ ctx[1]));
    				mounted = true;
    			}
    		},
    		p: noop,
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			/*div_binding*/ ctx[5](null);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$b.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$b($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("Terminal", slots, []);
    	const TerminalService = require("./app/cmd/terminal-service");
    	const terminal = new TerminalService();
    	let dom, first = false;
    	let { init } = $$props, { path = null } = $$props, { id } = $$props;

    	onMount(() => {
    		first = true;

    		if (init) {
    			initTerminal();
    		}
    	});

    	const initTerminal = () => {
    		addTerminal(id, terminal);
    		terminal.init(dom, path);
    		$$invalidate(0, dom.style.background = terminal.getBackgroundColor(), dom);
    	};

    	const startTerminal = flag => {
    		if (flag && terminal.term == null && first) {
    			initTerminal();
    		}

    		if (flag) {
    			fit();
    		}
    	};

    	const fit = () => {
    		terminal.fitTerm();
    	};

    	const writable_props = ["init", "path", "id"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Terminal> was created with unknown prop '${key}'`);
    	});

    	function div_binding($$value) {
    		binding_callbacks[$$value ? "unshift" : "push"](() => {
    			dom = $$value;
    			$$invalidate(0, dom);
    		});
    	}

    	$$self.$$set = $$props => {
    		if ("init" in $$props) $$invalidate(2, init = $$props.init);
    		if ("path" in $$props) $$invalidate(3, path = $$props.path);
    		if ("id" in $$props) $$invalidate(4, id = $$props.id);
    	};

    	$$self.$capture_state = () => ({
    		watchResize,
    		onMount,
    		addTerminal,
    		TerminalService,
    		terminal,
    		dom,
    		first,
    		init,
    		path,
    		id,
    		initTerminal,
    		startTerminal,
    		fit
    	});

    	$$self.$inject_state = $$props => {
    		if ("dom" in $$props) $$invalidate(0, dom = $$props.dom);
    		if ("first" in $$props) first = $$props.first;
    		if ("init" in $$props) $$invalidate(2, init = $$props.init);
    		if ("path" in $$props) $$invalidate(3, path = $$props.path);
    		if ("id" in $$props) $$invalidate(4, id = $$props.id);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*init*/ 4) {
    			 startTerminal(init);
    		}
    	};

    	return [dom, fit, init, path, id, div_binding];
    }

    class Terminal extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$b, create_fragment$b, safe_not_equal, { init: 2, path: 3, id: 4 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Terminal",
    			options,
    			id: create_fragment$b.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*init*/ ctx[2] === undefined && !("init" in props)) {
    			console.warn("<Terminal> was created without expected prop 'init'");
    		}

    		if (/*id*/ ctx[4] === undefined && !("id" in props)) {
    			console.warn("<Terminal> was created without expected prop 'id'");
    		}
    	}

    	get init() {
    		throw new Error("<Terminal>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set init(value) {
    		throw new Error("<Terminal>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get path() {
    		throw new Error("<Terminal>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set path(value) {
    		throw new Error("<Terminal>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get id() {
    		throw new Error("<Terminal>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set id(value) {
    		throw new Error("<Terminal>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src\component\SSHClient.svelte generated by Svelte v3.31.2 */
    const file$b = "src\\component\\SSHClient.svelte";

    function create_fragment$c(ctx) {
    	let div;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			div = element("div");
    			attr_dev(div, "class", "terminal svelte-1kmx7zy");
    			add_location(div, file$b, 39, 0, 878);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			/*div_binding*/ ctx[5](div);

    			if (!mounted) {
    				dispose = action_destroyer(watchResize.call(null, div, /*fit*/ ctx[1]));
    				mounted = true;
    			}
    		},
    		p: noop,
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			/*div_binding*/ ctx[5](null);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$c.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$c($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("SSHClient", slots, []);
    	const SSHService = require("./app/cmd/ssh-service");
    	const terminal = new SSHService();
    	let dom, first = false;
    	let { init } = $$props, { config } = $$props, { id } = $$props;

    	onMount(() => {
    		first = true;

    		if (init) {
    			initTerminal();
    		}
    	});

    	const initTerminal = () => {
    		addTerminal(id, terminal);
    		terminal.init(dom, config);
    		$$invalidate(0, dom.style.background = terminal.getBackgroundColor(), dom);
    	};

    	const startTerminal = flag => {
    		if (flag && terminal.term == null && first) {
    			initTerminal();
    		}

    		if (flag) {
    			fit();
    		}
    	};

    	const fit = () => {
    		terminal.fitTerm();
    	};

    	const writable_props = ["init", "config", "id"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<SSHClient> was created with unknown prop '${key}'`);
    	});

    	function div_binding($$value) {
    		binding_callbacks[$$value ? "unshift" : "push"](() => {
    			dom = $$value;
    			$$invalidate(0, dom);
    		});
    	}

    	$$self.$$set = $$props => {
    		if ("init" in $$props) $$invalidate(2, init = $$props.init);
    		if ("config" in $$props) $$invalidate(3, config = $$props.config);
    		if ("id" in $$props) $$invalidate(4, id = $$props.id);
    	};

    	$$self.$capture_state = () => ({
    		watchResize,
    		onMount,
    		addTerminal,
    		SSHService,
    		terminal,
    		dom,
    		first,
    		init,
    		config,
    		id,
    		initTerminal,
    		startTerminal,
    		fit
    	});

    	$$self.$inject_state = $$props => {
    		if ("dom" in $$props) $$invalidate(0, dom = $$props.dom);
    		if ("first" in $$props) first = $$props.first;
    		if ("init" in $$props) $$invalidate(2, init = $$props.init);
    		if ("config" in $$props) $$invalidate(3, config = $$props.config);
    		if ("id" in $$props) $$invalidate(4, id = $$props.id);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*init*/ 4) {
    			 startTerminal(init);
    		}
    	};

    	return [dom, fit, init, config, id, div_binding];
    }

    class SSHClient extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$c, create_fragment$c, safe_not_equal, { init: 2, config: 3, id: 4 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "SSHClient",
    			options,
    			id: create_fragment$c.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*init*/ ctx[2] === undefined && !("init" in props)) {
    			console.warn("<SSHClient> was created without expected prop 'init'");
    		}

    		if (/*config*/ ctx[3] === undefined && !("config" in props)) {
    			console.warn("<SSHClient> was created without expected prop 'config'");
    		}

    		if (/*id*/ ctx[4] === undefined && !("id" in props)) {
    			console.warn("<SSHClient> was created without expected prop 'id'");
    		}
    	}

    	get init() {
    		throw new Error("<SSHClient>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set init(value) {
    		throw new Error("<SSHClient>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get config() {
    		throw new Error("<SSHClient>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set config(value) {
    		throw new Error("<SSHClient>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get id() {
    		throw new Error("<SSHClient>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set id(value) {
    		throw new Error("<SSHClient>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src\component\TabContent.svelte generated by Svelte v3.31.2 */
    const file$c = "src\\component\\TabContent.svelte";

    function get_each_context$3(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[13] = list[i];
    	child_ctx[14] = list;
    	child_ctx[15] = i;
    	return child_ctx;
    }

    function get_each_context_1(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[13] = list[i];
    	child_ctx[15] = i;
    	return child_ctx;
    }

    // (133:12) {#if tab.close === false}
    function create_if_block_2(ctx) {
    	let div2;
    	let div0;
    	let t0;
    	let div1;
    	let t1_value = /*tab*/ ctx[13].name + "";
    	let t1;
    	let t2;
    	let a;
    	let t3;
    	let mounted;
    	let dispose;

    	function click_handler(...args) {
    		return /*click_handler*/ ctx[6](/*i*/ ctx[15], ...args);
    	}

    	function click_handler_1() {
    		return /*click_handler_1*/ ctx[7](/*i*/ ctx[15]);
    	}

    	const block = {
    		c: function create() {
    			div2 = element("div");
    			div0 = element("div");
    			t0 = space();
    			div1 = element("div");
    			t1 = text(t1_value);
    			t2 = space();
    			a = element("a");
    			t3 = space();
    			attr_dev(div0, "class", "tab-icon svelte-1n9chkh");
    			set_style(div0, "background-image", "url(" + /*tab*/ ctx[13].icon + ")");
    			add_location(div0, file$c, 135, 20, 3320);
    			attr_dev(a, "class", "close-btn svelte-1n9chkh");
    			add_location(a, file$c, 138, 24, 3479);
    			add_location(div1, file$c, 136, 20, 3412);
    			attr_dev(div2, "class", "tab-title svelte-1n9chkh");

    			set_style(div2, "background-color", /*nowTab*/ ctx[1] == /*i*/ ctx[15]
    			? "var(--background)"
    			: "");

    			set_style(div2, "display", "inline-flex");
    			add_location(div2, file$c, 133, 16, 3139);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div2, anchor);
    			append_dev(div2, div0);
    			append_dev(div2, t0);
    			append_dev(div2, div1);
    			append_dev(div1, t1);
    			append_dev(div1, t2);
    			append_dev(div1, a);
    			append_dev(div2, t3);

    			if (!mounted) {
    				dispose = [
    					listen_dev(a, "click", click_handler, false, false, false),
    					listen_dev(div2, "click", click_handler_1, false, false, false)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(new_ctx, dirty) {
    			ctx = new_ctx;

    			if (dirty & /*tabs*/ 1) {
    				set_style(div0, "background-image", "url(" + /*tab*/ ctx[13].icon + ")");
    			}

    			if (dirty & /*tabs*/ 1 && t1_value !== (t1_value = /*tab*/ ctx[13].name + "")) set_data_dev(t1, t1_value);

    			if (dirty & /*nowTab*/ 2) {
    				set_style(div2, "background-color", /*nowTab*/ ctx[1] == /*i*/ ctx[15]
    				? "var(--background)"
    				: "");
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div2);
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_2.name,
    		type: "if",
    		source: "(133:12) {#if tab.close === false}",
    		ctx
    	});

    	return block;
    }

    // (132:8) {#each tabs as tab, i}
    function create_each_block_1(ctx) {
    	let if_block_anchor;
    	let if_block = /*tab*/ ctx[13].close === false && create_if_block_2(ctx);

    	const block = {
    		c: function create() {
    			if (if_block) if_block.c();
    			if_block_anchor = empty();
    		},
    		m: function mount(target, anchor) {
    			if (if_block) if_block.m(target, anchor);
    			insert_dev(target, if_block_anchor, anchor);
    		},
    		p: function update(ctx, dirty) {
    			if (/*tab*/ ctx[13].close === false) {
    				if (if_block) {
    					if_block.p(ctx, dirty);
    				} else {
    					if_block = create_if_block_2(ctx);
    					if_block.c();
    					if_block.m(if_block_anchor.parentNode, if_block_anchor);
    				}
    			} else if (if_block) {
    				if_block.d(1);
    				if_block = null;
    			}
    		},
    		d: function destroy(detaching) {
    			if (if_block) if_block.d(detaching);
    			if (detaching) detach_dev(if_block_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block_1.name,
    		type: "each",
    		source: "(132:8) {#each tabs as tab, i}",
    		ctx
    	});

    	return block;
    }

    // (149:8) {#if tab.close === false}
    function create_if_block$2(ctx) {
    	let div;
    	let current_block_type_index;
    	let if_block;
    	let t;
    	let current;
    	const if_block_creators = [create_if_block_1$1, create_else_block$1];
    	const if_blocks = [];

    	function select_block_type(ctx, dirty) {
    		if (/*tab*/ ctx[13].type === "terminal") return 0;
    		return 1;
    	}

    	current_block_type_index = select_block_type(ctx);
    	if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);

    	const block = {
    		c: function create() {
    			div = element("div");
    			if_block.c();
    			t = space();
    			attr_dev(div, "class", "tab-list svelte-1n9chkh");
    			set_style(div, "display", /*nowTab*/ ctx[1] == /*i*/ ctx[15] ? "block" : "none");
    			add_location(div, file$c, 149, 12, 3783);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			if_blocks[current_block_type_index].m(div, null);
    			append_dev(div, t);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			let previous_block_index = current_block_type_index;
    			current_block_type_index = select_block_type(ctx);

    			if (current_block_type_index === previous_block_index) {
    				if_blocks[current_block_type_index].p(ctx, dirty);
    			} else {
    				group_outros();

    				transition_out(if_blocks[previous_block_index], 1, 1, () => {
    					if_blocks[previous_block_index] = null;
    				});

    				check_outros();
    				if_block = if_blocks[current_block_type_index];

    				if (!if_block) {
    					if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);
    					if_block.c();
    				} else {
    					if_block.p(ctx, dirty);
    				}

    				transition_in(if_block, 1);
    				if_block.m(div, t);
    			}

    			if (!current || dirty & /*nowTab*/ 2) {
    				set_style(div, "display", /*nowTab*/ ctx[1] == /*i*/ ctx[15] ? "block" : "none");
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(if_block);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(if_block);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			if_blocks[current_block_type_index].d();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$2.name,
    		type: "if",
    		source: "(149:8) {#if tab.close === false}",
    		ctx
    	});

    	return block;
    }

    // (153:16) {:else}
    function create_else_block$1(ctx) {
    	let sshclient;
    	let updating_id;
    	let updating_config;
    	let current;

    	function sshclient_id_binding(value) {
    		/*sshclient_id_binding*/ ctx[10].call(null, value, /*tab*/ ctx[13]);
    	}

    	function sshclient_config_binding(value) {
    		/*sshclient_config_binding*/ ctx[11].call(null, value, /*tab*/ ctx[13]);
    	}

    	let sshclient_props = { init: /*nowTab*/ ctx[1] == /*i*/ ctx[15] };

    	if (/*tab*/ ctx[13].id !== void 0) {
    		sshclient_props.id = /*tab*/ ctx[13].id;
    	}

    	if (/*tab*/ ctx[13].config !== void 0) {
    		sshclient_props.config = /*tab*/ ctx[13].config;
    	}

    	sshclient = new SSHClient({ props: sshclient_props, $$inline: true });
    	binding_callbacks.push(() => bind(sshclient, "id", sshclient_id_binding));
    	binding_callbacks.push(() => bind(sshclient, "config", sshclient_config_binding));

    	const block = {
    		c: function create() {
    			create_component(sshclient.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(sshclient, target, anchor);
    			current = true;
    		},
    		p: function update(new_ctx, dirty) {
    			ctx = new_ctx;
    			const sshclient_changes = {};
    			if (dirty & /*nowTab*/ 2) sshclient_changes.init = /*nowTab*/ ctx[1] == /*i*/ ctx[15];

    			if (!updating_id && dirty & /*tabs*/ 1) {
    				updating_id = true;
    				sshclient_changes.id = /*tab*/ ctx[13].id;
    				add_flush_callback(() => updating_id = false);
    			}

    			if (!updating_config && dirty & /*tabs*/ 1) {
    				updating_config = true;
    				sshclient_changes.config = /*tab*/ ctx[13].config;
    				add_flush_callback(() => updating_config = false);
    			}

    			sshclient.$set(sshclient_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(sshclient.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(sshclient.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(sshclient, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_else_block$1.name,
    		type: "else",
    		source: "(153:16) {:else}",
    		ctx
    	});

    	return block;
    }

    // (151:16) {#if tab.type === 'terminal'}
    function create_if_block_1$1(ctx) {
    	let terminal;
    	let updating_id;
    	let updating_path;
    	let current;

    	function terminal_id_binding(value) {
    		/*terminal_id_binding*/ ctx[8].call(null, value, /*tab*/ ctx[13]);
    	}

    	function terminal_path_binding(value) {
    		/*terminal_path_binding*/ ctx[9].call(null, value, /*tab*/ ctx[13]);
    	}

    	let terminal_props = { init: /*nowTab*/ ctx[1] == /*i*/ ctx[15] };

    	if (/*tab*/ ctx[13].id !== void 0) {
    		terminal_props.id = /*tab*/ ctx[13].id;
    	}

    	if (/*tab*/ ctx[13].path !== void 0) {
    		terminal_props.path = /*tab*/ ctx[13].path;
    	}

    	terminal = new Terminal({ props: terminal_props, $$inline: true });
    	binding_callbacks.push(() => bind(terminal, "id", terminal_id_binding));
    	binding_callbacks.push(() => bind(terminal, "path", terminal_path_binding));

    	const block = {
    		c: function create() {
    			create_component(terminal.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(terminal, target, anchor);
    			current = true;
    		},
    		p: function update(new_ctx, dirty) {
    			ctx = new_ctx;
    			const terminal_changes = {};
    			if (dirty & /*nowTab*/ 2) terminal_changes.init = /*nowTab*/ ctx[1] == /*i*/ ctx[15];

    			if (!updating_id && dirty & /*tabs*/ 1) {
    				updating_id = true;
    				terminal_changes.id = /*tab*/ ctx[13].id;
    				add_flush_callback(() => updating_id = false);
    			}

    			if (!updating_path && dirty & /*tabs*/ 1) {
    				updating_path = true;
    				terminal_changes.path = /*tab*/ ctx[13].path;
    				add_flush_callback(() => updating_path = false);
    			}

    			terminal.$set(terminal_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(terminal.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(terminal.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(terminal, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_1$1.name,
    		type: "if",
    		source: "(151:16) {#if tab.type === 'terminal'}",
    		ctx
    	});

    	return block;
    }

    // (148:4) {#each tabs as tab, i}
    function create_each_block$3(ctx) {
    	let if_block_anchor;
    	let current;
    	let if_block = /*tab*/ ctx[13].close === false && create_if_block$2(ctx);

    	const block = {
    		c: function create() {
    			if (if_block) if_block.c();
    			if_block_anchor = empty();
    		},
    		m: function mount(target, anchor) {
    			if (if_block) if_block.m(target, anchor);
    			insert_dev(target, if_block_anchor, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			if (/*tab*/ ctx[13].close === false) {
    				if (if_block) {
    					if_block.p(ctx, dirty);

    					if (dirty & /*tabs*/ 1) {
    						transition_in(if_block, 1);
    					}
    				} else {
    					if_block = create_if_block$2(ctx);
    					if_block.c();
    					transition_in(if_block, 1);
    					if_block.m(if_block_anchor.parentNode, if_block_anchor);
    				}
    			} else if (if_block) {
    				group_outros();

    				transition_out(if_block, 1, 1, () => {
    					if_block = null;
    				});

    				check_outros();
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(if_block);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(if_block);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (if_block) if_block.d(detaching);
    			if (detaching) detach_dev(if_block_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block$3.name,
    		type: "each",
    		source: "(148:4) {#each tabs as tab, i}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$d(ctx) {
    	let div2;
    	let div0;
    	let t0;
    	let div1;
    	let t1;
    	let div3;
    	let current;
    	let each_value_1 = /*tabs*/ ctx[0];
    	validate_each_argument(each_value_1);
    	let each_blocks_1 = [];

    	for (let i = 0; i < each_value_1.length; i += 1) {
    		each_blocks_1[i] = create_each_block_1(get_each_context_1(ctx, each_value_1, i));
    	}

    	let each_value = /*tabs*/ ctx[0];
    	validate_each_argument(each_value);
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block$3(get_each_context$3(ctx, each_value, i));
    	}

    	const out = i => transition_out(each_blocks[i], 1, 1, () => {
    		each_blocks[i] = null;
    	});

    	const block = {
    		c: function create() {
    			div2 = element("div");
    			div0 = element("div");

    			for (let i = 0; i < each_blocks_1.length; i += 1) {
    				each_blocks_1[i].c();
    			}

    			t0 = space();
    			div1 = element("div");
    			t1 = space();
    			div3 = element("div");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			attr_dev(div0, "class", "tab-left svelte-1n9chkh");
    			add_location(div0, file$c, 130, 4, 3028);
    			attr_dev(div1, "class", "tab-more svelte-1n9chkh");
    			add_location(div1, file$c, 144, 4, 3643);
    			attr_dev(div2, "class", "tab-header svelte-1n9chkh");
    			set_style(div2, "background", /*theme*/ ctx[2].colors["sideBar.background"]);
    			set_style(div2, "color", /*theme*/ ctx[2].colors["sideBar.foreground"]);
    			add_location(div2, file$c, 128, 0, 2889);
    			attr_dev(div3, "class", "tab-content svelte-1n9chkh");
    			add_location(div3, file$c, 146, 0, 3681);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div2, anchor);
    			append_dev(div2, div0);

    			for (let i = 0; i < each_blocks_1.length; i += 1) {
    				each_blocks_1[i].m(div0, null);
    			}

    			append_dev(div2, t0);
    			append_dev(div2, div1);
    			insert_dev(target, t1, anchor);
    			insert_dev(target, div3, anchor);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(div3, null);
    			}

    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*nowTab, changeTab, closeTab, tabs*/ 27) {
    				each_value_1 = /*tabs*/ ctx[0];
    				validate_each_argument(each_value_1);
    				let i;

    				for (i = 0; i < each_value_1.length; i += 1) {
    					const child_ctx = get_each_context_1(ctx, each_value_1, i);

    					if (each_blocks_1[i]) {
    						each_blocks_1[i].p(child_ctx, dirty);
    					} else {
    						each_blocks_1[i] = create_each_block_1(child_ctx);
    						each_blocks_1[i].c();
    						each_blocks_1[i].m(div0, null);
    					}
    				}

    				for (; i < each_blocks_1.length; i += 1) {
    					each_blocks_1[i].d(1);
    				}

    				each_blocks_1.length = each_value_1.length;
    			}

    			if (!current || dirty & /*theme*/ 4) {
    				set_style(div2, "background", /*theme*/ ctx[2].colors["sideBar.background"]);
    			}

    			if (!current || dirty & /*theme*/ 4) {
    				set_style(div2, "color", /*theme*/ ctx[2].colors["sideBar.foreground"]);
    			}

    			if (dirty & /*nowTab, tabs*/ 3) {
    				each_value = /*tabs*/ ctx[0];
    				validate_each_argument(each_value);
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context$3(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    						transition_in(each_blocks[i], 1);
    					} else {
    						each_blocks[i] = create_each_block$3(child_ctx);
    						each_blocks[i].c();
    						transition_in(each_blocks[i], 1);
    						each_blocks[i].m(div3, null);
    					}
    				}

    				group_outros();

    				for (i = each_value.length; i < each_blocks.length; i += 1) {
    					out(i);
    				}

    				check_outros();
    			}
    		},
    		i: function intro(local) {
    			if (current) return;

    			for (let i = 0; i < each_value.length; i += 1) {
    				transition_in(each_blocks[i]);
    			}

    			current = true;
    		},
    		o: function outro(local) {
    			each_blocks = each_blocks.filter(Boolean);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				transition_out(each_blocks[i]);
    			}

    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div2);
    			destroy_each(each_blocks_1, detaching);
    			if (detaching) detach_dev(t1);
    			if (detaching) detach_dev(div3);
    			destroy_each(each_blocks, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$d.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$d($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("TabContent", slots, []);
    	const dispatch = createEventDispatcher();

    	let { theme } = $$props,
    		{ msg } = $$props,
    		{ tabs = [] } = $$props,
    		{ nowTab = 0 } = $$props;

    	const changeTab = index => {
    		$$invalidate(1, nowTab = index);
    	};

    	const closeTab = (index, e) => {
    		e.stopPropagation();
    		$$invalidate(0, tabs[index].close = true, tabs);
    		closeTerminal(tabs[index].id);
    		let i = 0;

    		tabs.forEach(t => {
    			if (t.close) i++;
    		});

    		if (i == tabs.length) {
    			$$invalidate(0, tabs.length = 0, tabs);
    		} else {
    			$$invalidate(0, tabs = [...tabs]);
    		}

    		dispatch("changeTab", tabs);

    		if (index == nowTab) {
    			let after = null, before = null;

    			tabs.some((t, i) => {
    				let f = false;

    				if (t.close === false) {
    					if (i < index) {
    						before = i;
    					}

    					if (i > index) {
    						after = i;
    						f = true;
    					}
    				}

    				return f;
    			});

    			if (after != null) {
    				$$invalidate(1, nowTab = after);
    			} else {
    				$$invalidate(1, nowTab = before);
    			}
    		}
    	};

    	const writable_props = ["theme", "msg", "tabs", "nowTab"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<TabContent> was created with unknown prop '${key}'`);
    	});

    	const click_handler = (i, e) => closeTab(i, e);
    	const click_handler_1 = i => changeTab(i);

    	function terminal_id_binding(value, tab) {
    		tab.id = value;
    		$$invalidate(0, tabs);
    	}

    	function terminal_path_binding(value, tab) {
    		tab.path = value;
    		$$invalidate(0, tabs);
    	}

    	function sshclient_id_binding(value, tab) {
    		tab.id = value;
    		$$invalidate(0, tabs);
    	}

    	function sshclient_config_binding(value, tab) {
    		tab.config = value;
    		$$invalidate(0, tabs);
    	}

    	$$self.$$set = $$props => {
    		if ("theme" in $$props) $$invalidate(2, theme = $$props.theme);
    		if ("msg" in $$props) $$invalidate(5, msg = $$props.msg);
    		if ("tabs" in $$props) $$invalidate(0, tabs = $$props.tabs);
    		if ("nowTab" in $$props) $$invalidate(1, nowTab = $$props.nowTab);
    	};

    	$$self.$capture_state = () => ({
    		Terminal,
    		SSHClient,
    		createEventDispatcher,
    		closeTerminal,
    		dispatch,
    		theme,
    		msg,
    		tabs,
    		nowTab,
    		changeTab,
    		closeTab
    	});

    	$$self.$inject_state = $$props => {
    		if ("theme" in $$props) $$invalidate(2, theme = $$props.theme);
    		if ("msg" in $$props) $$invalidate(5, msg = $$props.msg);
    		if ("tabs" in $$props) $$invalidate(0, tabs = $$props.tabs);
    		if ("nowTab" in $$props) $$invalidate(1, nowTab = $$props.nowTab);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [
    		tabs,
    		nowTab,
    		theme,
    		changeTab,
    		closeTab,
    		msg,
    		click_handler,
    		click_handler_1,
    		terminal_id_binding,
    		terminal_path_binding,
    		sshclient_id_binding,
    		sshclient_config_binding
    	];
    }

    class TabContent extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$d, create_fragment$d, safe_not_equal, { theme: 2, msg: 5, tabs: 0, nowTab: 1 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "TabContent",
    			options,
    			id: create_fragment$d.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*theme*/ ctx[2] === undefined && !("theme" in props)) {
    			console.warn("<TabContent> was created without expected prop 'theme'");
    		}

    		if (/*msg*/ ctx[5] === undefined && !("msg" in props)) {
    			console.warn("<TabContent> was created without expected prop 'msg'");
    		}
    	}

    	get theme() {
    		throw new Error("<TabContent>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set theme(value) {
    		throw new Error("<TabContent>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get msg() {
    		throw new Error("<TabContent>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set msg(value) {
    		throw new Error("<TabContent>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get tabs() {
    		throw new Error("<TabContent>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set tabs(value) {
    		throw new Error("<TabContent>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get nowTab() {
    		throw new Error("<TabContent>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set nowTab(value) {
    		throw new Error("<TabContent>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src\App.svelte generated by Svelte v3.31.2 */

    const { console: console_1$1 } = globals;
    const file$d = "src\\App.svelte";

    // (150:12) <div slot="left" style="width: 100%;height: 100%;">
    function create_left_slot_1(ctx) {
    	let div;
    	let configpanel;
    	let current;

    	configpanel = new ConfigPanel({
    			props: { theme: /*theme*/ ctx[1] },
    			$$inline: true
    		});

    	configpanel.$on("addSSH", /*treeClick*/ ctx[9]);
    	configpanel.$on("treeClick", /*treeClick*/ ctx[9]);

    	const block = {
    		c: function create() {
    			div = element("div");
    			create_component(configpanel.$$.fragment);
    			attr_dev(div, "slot", "left");
    			set_style(div, "width", "100%");
    			set_style(div, "height", "100%");
    			add_location(div, file$d, 149, 12, 3974);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			mount_component(configpanel, div, null);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const configpanel_changes = {};
    			if (dirty & /*theme*/ 2) configpanel_changes.theme = /*theme*/ ctx[1];
    			configpanel.$set(configpanel_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(configpanel.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(configpanel.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			destroy_component(configpanel);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_left_slot_1.name,
    		type: "slot",
    		source: "(150:12) <div slot=\\\"left\\\" style=\\\"width: 100%;height: 100%;\\\">",
    		ctx
    	});

    	return block;
    }

    // (155:20) <div slot="left" style="width: 100%;height: 100%;">
    function create_left_slot(ctx) {
    	let div;
    	let tabcontent;
    	let updating_msg;
    	let current;

    	function tabcontent_msg_binding(value) {
    		/*tabcontent_msg_binding*/ ctx[13].call(null, value);
    	}

    	let tabcontent_props = {
    		theme: /*theme*/ ctx[1],
    		tabs: /*tabs*/ ctx[3],
    		nowTab: /*nowTab*/ ctx[4]
    	};

    	if (/*msg*/ ctx[2] !== void 0) {
    		tabcontent_props.msg = /*msg*/ ctx[2];
    	}

    	tabcontent = new TabContent({ props: tabcontent_props, $$inline: true });
    	binding_callbacks.push(() => bind(tabcontent, "msg", tabcontent_msg_binding));
    	tabcontent.$on("changeTab", /*changeTab*/ ctx[8]);

    	const block = {
    		c: function create() {
    			div = element("div");
    			create_component(tabcontent.$$.fragment);
    			attr_dev(div, "slot", "left");
    			set_style(div, "width", "100%");
    			set_style(div, "height", "100%");
    			add_location(div, file$d, 154, 20, 4259);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			mount_component(tabcontent, div, null);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const tabcontent_changes = {};
    			if (dirty & /*theme*/ 2) tabcontent_changes.theme = /*theme*/ ctx[1];
    			if (dirty & /*tabs*/ 8) tabcontent_changes.tabs = /*tabs*/ ctx[3];
    			if (dirty & /*nowTab*/ 16) tabcontent_changes.nowTab = /*nowTab*/ ctx[4];

    			if (!updating_msg && dirty & /*msg*/ 4) {
    				updating_msg = true;
    				tabcontent_changes.msg = /*msg*/ ctx[2];
    				add_flush_callback(() => updating_msg = false);
    			}

    			tabcontent.$set(tabcontent_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(tabcontent.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(tabcontent.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			destroy_component(tabcontent);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_left_slot.name,
    		type: "slot",
    		source: "(155:20) <div slot=\\\"left\\\" style=\\\"width: 100%;height: 100%;\\\">",
    		ctx
    	});

    	return block;
    }

    // (158:20) <div slot="right" style="height: 100%;">
    function create_right_slot_1(ctx) {
    	let div;

    	const block = {
    		c: function create() {
    			div = element("div");
    			attr_dev(div, "slot", "right");
    			set_style(div, "height", "100%");
    			add_location(div, file$d, 157, 20, 4454);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_right_slot_1.name,
    		type: "slot",
    		source: "(158:20) <div slot=\\\"right\\\" style=\\\"height: 100%;\\\">",
    		ctx
    	});

    	return block;
    }

    // (154:16) <SplitBar center="left" width="150px">
    function create_default_slot_2$1(ctx) {
    	let t;

    	const block = {
    		c: function create() {
    			t = space();
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, t, anchor);
    		},
    		p: noop,
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(t);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_2$1.name,
    		type: "slot",
    		source: "(154:16) <SplitBar center=\\\"left\\\" width=\\\"150px\\\">",
    		ctx
    	});

    	return block;
    }

    // (153:12) <div slot="right" style="height: 100%;">
    function create_right_slot(ctx) {
    	let div;
    	let splitbar;
    	let current;

    	splitbar = new SplitBar({
    			props: {
    				center: "left",
    				width: "150px",
    				$$slots: {
    					default: [create_default_slot_2$1],
    					right: [create_right_slot_1],
    					left: [create_left_slot]
    				},
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			div = element("div");
    			create_component(splitbar.$$.fragment);
    			attr_dev(div, "slot", "right");
    			set_style(div, "height", "100%");
    			add_location(div, file$d, 152, 12, 4143);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			mount_component(splitbar, div, null);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const splitbar_changes = {};

    			if (dirty & /*$$scope, theme, tabs, nowTab, msg*/ 262174) {
    				splitbar_changes.$$scope = { dirty, ctx };
    			}

    			splitbar.$set(splitbar_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(splitbar.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(splitbar.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			destroy_component(splitbar);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_right_slot.name,
    		type: "slot",
    		source: "(153:12) <div slot=\\\"right\\\" style=\\\"height: 100%;\\\">",
    		ctx
    	});

    	return block;
    }

    // (149:8) <SplitBar>
    function create_default_slot_1$1(ctx) {
    	let t;

    	const block = {
    		c: function create() {
    			t = space();
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, t, anchor);
    		},
    		p: noop,
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(t);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_1$1.name,
    		type: "slot",
    		source: "(149:8) <SplitBar>",
    		ctx
    	});

    	return block;
    }

    // (170:4) <Modal {theme}>
    function create_default_slot$1(ctx) {
    	let input0;
    	let br0;
    	let t;
    	let input1;
    	let br1;

    	const block = {
    		c: function create() {
    			input0 = element("input");
    			br0 = element("br");
    			t = space();
    			input1 = element("input");
    			br1 = element("br");
    			attr_dev(input0, "type", "text");
    			add_location(input0, file$d, 170, 8, 4835);
    			add_location(br0, file$d, 170, 27, 4854);
    			attr_dev(input1, "type", "text");
    			add_location(input1, file$d, 171, 8, 4868);
    			add_location(br1, file$d, 171, 27, 4887);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, input0, anchor);
    			insert_dev(target, br0, anchor);
    			insert_dev(target, t, anchor);
    			insert_dev(target, input1, anchor);
    			insert_dev(target, br1, anchor);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(input0);
    			if (detaching) detach_dev(br0);
    			if (detaching) detach_dev(t);
    			if (detaching) detach_dev(input1);
    			if (detaching) detach_dev(br1);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot$1.name,
    		type: "slot",
    		source: "(170:4) <Modal {theme}>",
    		ctx
    	});

    	return block;
    }

    function create_fragment$e(ctx) {
    	let style;
    	let t1;
    	let div3;
    	let titlebar;
    	let updating_msg;
    	let t2;
    	let div1;
    	let div0;
    	let t3;
    	let activitybar;
    	let updating_msg_1;
    	let t4;
    	let div2;
    	let splitbar;
    	let t5;
    	let statusbar;
    	let updating_msg_2;
    	let t6;
    	let quickinput;
    	let updating_msg_3;
    	let updating_show;
    	let t7;
    	let modal;
    	let current;

    	function titlebar_msg_binding(value) {
    		/*titlebar_msg_binding*/ ctx[11].call(null, value);
    	}

    	let titlebar_props = { theme: /*theme*/ ctx[1] };

    	if (/*msg*/ ctx[2] !== void 0) {
    		titlebar_props.msg = /*msg*/ ctx[2];
    	}

    	titlebar = new TitleBar({ props: titlebar_props, $$inline: true });
    	binding_callbacks.push(() => bind(titlebar, "msg", titlebar_msg_binding));

    	function activitybar_msg_binding(value) {
    		/*activitybar_msg_binding*/ ctx[12].call(null, value);
    	}

    	let activitybar_props = { theme: /*theme*/ ctx[1] };

    	if (/*msg*/ ctx[2] !== void 0) {
    		activitybar_props.msg = /*msg*/ ctx[2];
    	}

    	activitybar = new ActivityBar({ props: activitybar_props, $$inline: true });
    	binding_callbacks.push(() => bind(activitybar, "msg", activitybar_msg_binding));

    	splitbar = new SplitBar({
    			props: {
    				$$slots: {
    					default: [create_default_slot_1$1],
    					right: [create_right_slot],
    					left: [create_left_slot_1]
    				},
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	function statusbar_msg_binding(value) {
    		/*statusbar_msg_binding*/ ctx[14].call(null, value);
    	}

    	let statusbar_props = { theme: /*theme*/ ctx[1] };

    	if (/*msg*/ ctx[2] !== void 0) {
    		statusbar_props.msg = /*msg*/ ctx[2];
    	}

    	statusbar = new StatusBar({ props: statusbar_props, $$inline: true });
    	binding_callbacks.push(() => bind(statusbar, "msg", statusbar_msg_binding));
    	statusbar.$on("toggleConsole", /*toggleConsole*/ ctx[6]);
    	statusbar.$on("toggleTerminal", /*toggleTerminal*/ ctx[7]);

    	function quickinput_msg_binding(value) {
    		/*quickinput_msg_binding*/ ctx[15].call(null, value);
    	}

    	function quickinput_show_binding(value) {
    		/*quickinput_show_binding*/ ctx[16].call(null, value);
    	}

    	let quickinput_props = { theme: /*theme*/ ctx[1] };

    	if (/*msg*/ ctx[2] !== void 0) {
    		quickinput_props.msg = /*msg*/ ctx[2];
    	}

    	if (/*quickShow*/ ctx[0] !== void 0) {
    		quickinput_props.show = /*quickShow*/ ctx[0];
    	}

    	quickinput = new QuickInput({ props: quickinput_props, $$inline: true });
    	binding_callbacks.push(() => bind(quickinput, "msg", quickinput_msg_binding));
    	binding_callbacks.push(() => bind(quickinput, "show", quickinput_show_binding));

    	modal = new Modal({
    			props: {
    				theme: /*theme*/ ctx[1],
    				$$slots: { default: [create_default_slot$1] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			style = element("style");
    			style.textContent = ":focus {\n            outline-color: var(--focus-border);\n        }\n\n        input:focus {\n            outline-width: 1px;\n            outline-style: solid;\n            outline-offset: -1px;\n            opacity: 1 !important;\n        }\n\n        .monaco-progress-container {\n            width: 100%;\n            height: 2px;\n            z-index: 2;\n            position: relative;\n            overflow: hidden;\n        }\n\n        .monaco-progress-container .progress-bit {\n            width: inherit;\n            height: 5px;\n            opacity: 1;\n            position: absolute;\n            left: 0;\n            animation: move 3s infinite;\n            display: none;\n        }\n\n        @keyframes move {\n            from {\n                left: 0px;\n                width: 5%;\n            }\n            to {\n                left: 100%;\n                width: 10%;\n            }\n        }\n\n        @-webkit-keyframes move {\n            from {\n                left: 0px;\n                width: 5%;\n            }\n            to {\n                left: 100%;\n                width: 10%;\n            }\n        }";
    			t1 = space();
    			div3 = element("div");
    			create_component(titlebar.$$.fragment);
    			t2 = space();
    			div1 = element("div");
    			div0 = element("div");
    			t3 = space();
    			create_component(activitybar.$$.fragment);
    			t4 = space();
    			div2 = element("div");
    			create_component(splitbar.$$.fragment);
    			t5 = space();
    			create_component(statusbar.$$.fragment);
    			t6 = space();
    			create_component(quickinput.$$.fragment);
    			t7 = space();
    			create_component(modal.$$.fragment);
    			add_location(style, file$d, 85, 4, 2236);
    			attr_dev(div0, "class", "progress-bit");
    			set_style(div0, "background-color", /*theme*/ ctx[1].colors["progressBar.background"]);
    			set_style(div0, "opacity", "1");
    			set_style(div0, "display", /*mainLoading*/ ctx[5]);
    			add_location(div0, file$d, 143, 8, 3730);
    			attr_dev(div1, "class", "monaco-progress-container");
    			set_style(div1, "display", "none");
    			add_location(div1, file$d, 142, 4, 3659);
    			attr_dev(div2, "class", "content svelte-wmwkx4");
    			add_location(div2, file$d, 147, 4, 3921);
    			attr_dev(div3, "class", "main svelte-wmwkx4");
    			set_style(div3, "--background", /*theme*/ ctx[1].colors.foreground);
    			set_style(div3, "--color", /*theme*/ ctx[1].colors["background"]);
    			set_style(div3, "--focus", /*theme*/ ctx[1].colors["focus"]);
    			set_style(div3, "--focus-border", /*theme*/ ctx[1].colors["focusBorder"]);
    			set_style(div3, "--shadow", /*theme*/ ctx[1].colors["widget.shadow"]);
    			add_location(div3, file$d, 138, 0, 3389);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			append_dev(document.head, style);
    			insert_dev(target, t1, anchor);
    			insert_dev(target, div3, anchor);
    			mount_component(titlebar, div3, null);
    			append_dev(div3, t2);
    			append_dev(div3, div1);
    			append_dev(div1, div0);
    			append_dev(div3, t3);
    			mount_component(activitybar, div3, null);
    			append_dev(div3, t4);
    			append_dev(div3, div2);
    			mount_component(splitbar, div2, null);
    			append_dev(div3, t5);
    			mount_component(statusbar, div3, null);
    			append_dev(div3, t6);
    			mount_component(quickinput, div3, null);
    			append_dev(div3, t7);
    			mount_component(modal, div3, null);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			const titlebar_changes = {};
    			if (dirty & /*theme*/ 2) titlebar_changes.theme = /*theme*/ ctx[1];

    			if (!updating_msg && dirty & /*msg*/ 4) {
    				updating_msg = true;
    				titlebar_changes.msg = /*msg*/ ctx[2];
    				add_flush_callback(() => updating_msg = false);
    			}

    			titlebar.$set(titlebar_changes);

    			if (!current || dirty & /*theme*/ 2) {
    				set_style(div0, "background-color", /*theme*/ ctx[1].colors["progressBar.background"]);
    			}

    			const activitybar_changes = {};
    			if (dirty & /*theme*/ 2) activitybar_changes.theme = /*theme*/ ctx[1];

    			if (!updating_msg_1 && dirty & /*msg*/ 4) {
    				updating_msg_1 = true;
    				activitybar_changes.msg = /*msg*/ ctx[2];
    				add_flush_callback(() => updating_msg_1 = false);
    			}

    			activitybar.$set(activitybar_changes);
    			const splitbar_changes = {};

    			if (dirty & /*$$scope, theme, tabs, nowTab, msg*/ 262174) {
    				splitbar_changes.$$scope = { dirty, ctx };
    			}

    			splitbar.$set(splitbar_changes);
    			const statusbar_changes = {};
    			if (dirty & /*theme*/ 2) statusbar_changes.theme = /*theme*/ ctx[1];

    			if (!updating_msg_2 && dirty & /*msg*/ 4) {
    				updating_msg_2 = true;
    				statusbar_changes.msg = /*msg*/ ctx[2];
    				add_flush_callback(() => updating_msg_2 = false);
    			}

    			statusbar.$set(statusbar_changes);
    			const quickinput_changes = {};
    			if (dirty & /*theme*/ 2) quickinput_changes.theme = /*theme*/ ctx[1];

    			if (!updating_msg_3 && dirty & /*msg*/ 4) {
    				updating_msg_3 = true;
    				quickinput_changes.msg = /*msg*/ ctx[2];
    				add_flush_callback(() => updating_msg_3 = false);
    			}

    			if (!updating_show && dirty & /*quickShow*/ 1) {
    				updating_show = true;
    				quickinput_changes.show = /*quickShow*/ ctx[0];
    				add_flush_callback(() => updating_show = false);
    			}

    			quickinput.$set(quickinput_changes);
    			const modal_changes = {};
    			if (dirty & /*theme*/ 2) modal_changes.theme = /*theme*/ ctx[1];

    			if (dirty & /*$$scope*/ 262144) {
    				modal_changes.$$scope = { dirty, ctx };
    			}

    			modal.$set(modal_changes);

    			if (!current || dirty & /*theme*/ 2) {
    				set_style(div3, "--background", /*theme*/ ctx[1].colors.foreground);
    			}

    			if (!current || dirty & /*theme*/ 2) {
    				set_style(div3, "--color", /*theme*/ ctx[1].colors["background"]);
    			}

    			if (!current || dirty & /*theme*/ 2) {
    				set_style(div3, "--focus", /*theme*/ ctx[1].colors["focus"]);
    			}

    			if (!current || dirty & /*theme*/ 2) {
    				set_style(div3, "--focus-border", /*theme*/ ctx[1].colors["focusBorder"]);
    			}

    			if (!current || dirty & /*theme*/ 2) {
    				set_style(div3, "--shadow", /*theme*/ ctx[1].colors["widget.shadow"]);
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(titlebar.$$.fragment, local);
    			transition_in(activitybar.$$.fragment, local);
    			transition_in(splitbar.$$.fragment, local);
    			transition_in(statusbar.$$.fragment, local);
    			transition_in(quickinput.$$.fragment, local);
    			transition_in(modal.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(titlebar.$$.fragment, local);
    			transition_out(activitybar.$$.fragment, local);
    			transition_out(splitbar.$$.fragment, local);
    			transition_out(statusbar.$$.fragment, local);
    			transition_out(quickinput.$$.fragment, local);
    			transition_out(modal.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			detach_dev(style);
    			if (detaching) detach_dev(t1);
    			if (detaching) detach_dev(div3);
    			destroy_component(titlebar);
    			destroy_component(activitybar);
    			destroy_component(splitbar);
    			destroy_component(statusbar);
    			destroy_component(quickinput);
    			destroy_component(modal);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$e.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$e($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("App", slots, []);
    	let { name } = $$props;
    	let { theme } = $$props;
    	let { quickShow = "none" } = $$props;
    	let mainLoading = "block";
    	let msg = "该项目进行中...";

    	const toggleConsole = () => {
    		$$invalidate(2, msg = msg + "Onion ");
    	};

    	const toggleTerminal = () => {
    		$$invalidate(2, msg = msg + "Onion ==");
    	};

    	console.log(JSON.stringify(theme.colors));
    	let tabs = [], nowTab = 0;

    	const addTab = tab => {
    		if (tab.id == null) {
    			return;
    		}

    		let addFlag = true, now;

    		tabs.some((t, i) => {
    			if (t.id == tab.id) {
    				addFlag = false;
    				now = i;

    				if (t.close) {
    					t.close = false;
    				}

    				return true;
    			}
    		});

    		if (addFlag) {
    			tabs.push(tab);
    		}

    		$$invalidate(3, tabs = [...tabs]);
    		$$invalidate(4, nowTab = null);

    		setTimeout(
    			() => {
    				if (addFlag) {
    					$$invalidate(4, nowTab = tabs.length - 1);
    				} else {
    					$$invalidate(4, nowTab = now);
    				}
    			},
    			1
    		);

    		console.log(tabs);
    	};

    	const changeTab = ({ detail }) => {
    		$$invalidate(3, tabs = detail);
    	};

    	const treeClick = ({ detail }) => {
    		if (detail.type == "folder") return;

    		if (detail.key == "ssh") {
    			addTab({
    				id: detail.id,
    				name: detail.name,
    				close: false,
    				config: detail,
    				icon: detail.icon
    			});
    		} else if (detail.key == "terminal") {
    			addTab({
    				id: detail.id,
    				name: detail.name,
    				close: false,
    				type: "terminal",
    				path: detail.path,
    				icon: detail.icon
    			});
    		}
    	};

    	const writable_props = ["name", "theme", "quickShow"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console_1$1.warn(`<App> was created with unknown prop '${key}'`);
    	});

    	function titlebar_msg_binding(value) {
    		msg = value;
    		$$invalidate(2, msg);
    	}

    	function activitybar_msg_binding(value) {
    		msg = value;
    		$$invalidate(2, msg);
    	}

    	function tabcontent_msg_binding(value) {
    		msg = value;
    		$$invalidate(2, msg);
    	}

    	function statusbar_msg_binding(value) {
    		msg = value;
    		$$invalidate(2, msg);
    	}

    	function quickinput_msg_binding(value) {
    		msg = value;
    		$$invalidate(2, msg);
    	}

    	function quickinput_show_binding(value) {
    		quickShow = value;
    		$$invalidate(0, quickShow);
    	}

    	$$self.$$set = $$props => {
    		if ("name" in $$props) $$invalidate(10, name = $$props.name);
    		if ("theme" in $$props) $$invalidate(1, theme = $$props.theme);
    		if ("quickShow" in $$props) $$invalidate(0, quickShow = $$props.quickShow);
    	};

    	$$self.$capture_state = () => ({
    		name,
    		theme,
    		quickShow,
    		mainLoading,
    		TitleBar,
    		StatusBar,
    		ActivityBar,
    		SplitBar,
    		ConfigPanel,
    		QuickInput,
    		TabContent,
    		Modal,
    		msg,
    		toggleConsole,
    		toggleTerminal,
    		tabs,
    		nowTab,
    		addTab,
    		changeTab,
    		treeClick
    	});

    	$$self.$inject_state = $$props => {
    		if ("name" in $$props) $$invalidate(10, name = $$props.name);
    		if ("theme" in $$props) $$invalidate(1, theme = $$props.theme);
    		if ("quickShow" in $$props) $$invalidate(0, quickShow = $$props.quickShow);
    		if ("mainLoading" in $$props) $$invalidate(5, mainLoading = $$props.mainLoading);
    		if ("msg" in $$props) $$invalidate(2, msg = $$props.msg);
    		if ("tabs" in $$props) $$invalidate(3, tabs = $$props.tabs);
    		if ("nowTab" in $$props) $$invalidate(4, nowTab = $$props.nowTab);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [
    		quickShow,
    		theme,
    		msg,
    		tabs,
    		nowTab,
    		mainLoading,
    		toggleConsole,
    		toggleTerminal,
    		changeTab,
    		treeClick,
    		name,
    		titlebar_msg_binding,
    		activitybar_msg_binding,
    		tabcontent_msg_binding,
    		statusbar_msg_binding,
    		quickinput_msg_binding,
    		quickinput_show_binding
    	];
    }

    class App extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$e, create_fragment$e, safe_not_equal, { name: 10, theme: 1, quickShow: 0 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "App",
    			options,
    			id: create_fragment$e.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*name*/ ctx[10] === undefined && !("name" in props)) {
    			console_1$1.warn("<App> was created without expected prop 'name'");
    		}

    		if (/*theme*/ ctx[1] === undefined && !("theme" in props)) {
    			console_1$1.warn("<App> was created without expected prop 'theme'");
    		}
    	}

    	get name() {
    		throw new Error("<App>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set name(value) {
    		throw new Error("<App>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get theme() {
    		throw new Error("<App>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set theme(value) {
    		throw new Error("<App>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get quickShow() {
    		throw new Error("<App>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set quickShow(value) {
    		throw new Error("<App>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    const app = new App({
        target: document.body,
        props: {
            name: 'world',
            theme: require('./app/utils/theme').getTheme()
        }
    });

    return app;

}());
