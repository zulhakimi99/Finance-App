
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
    function validate_store(store, name) {
        if (store != null && typeof store.subscribe !== 'function') {
            throw new Error(`'${name}' is not a store with a 'subscribe' method`);
        }
    }
    function subscribe(store, ...callbacks) {
        if (store == null) {
            return noop;
        }
        const unsub = store.subscribe(...callbacks);
        return unsub.unsubscribe ? () => unsub.unsubscribe() : unsub;
    }
    function component_subscribe(component, store, callback) {
        component.$$.on_destroy.push(subscribe(store, callback));
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
    function to_number(value) {
        return value === '' ? undefined : +value;
    }
    function children(element) {
        return Array.from(element.childNodes);
    }
    function set_input_value(input, value) {
        input.value = value == null ? '' : value;
    }
    function set_style(node, key, value, important) {
        node.style.setProperty(key, value, important ? 'important' : '');
    }
    function select_option(select, value) {
        for (let i = 0; i < select.options.length; i += 1) {
            const option = select.options[i];
            if (option.__value === value) {
                option.selected = true;
                return;
            }
        }
    }
    function select_value(select) {
        const selected_option = select.querySelector(':checked') || select.options[0];
        return selected_option && selected_option.__value;
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
            throw new Error(`Function called outside component initialization`);
        return current_component;
    }
    function onMount(fn) {
        get_current_component().$$.on_mount.push(fn);
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
        document.dispatchEvent(custom_event(type, Object.assign({ version: '3.24.1' }, detail)));
    }
    function append_dev(target, node) {
        dispatch_dev("SvelteDOMInsert", { target, node });
        append(target, node);
    }
    function insert_dev(target, node, anchor) {
        dispatch_dev("SvelteDOMInsert", { target, node, anchor });
        insert(target, node, anchor);
    }
    function detach_dev(node) {
        dispatch_dev("SvelteDOMRemove", { node });
        detach(node);
    }
    function listen_dev(node, event, handler, options, has_prevent_default, has_stop_propagation) {
        const modifiers = options === true ? ["capture"] : options ? Array.from(Object.keys(options)) : [];
        if (has_prevent_default)
            modifiers.push('preventDefault');
        if (has_stop_propagation)
            modifiers.push('stopPropagation');
        dispatch_dev("SvelteDOMAddEventListener", { node, event, handler, modifiers });
        const dispose = listen(node, event, handler, options);
        return () => {
            dispatch_dev("SvelteDOMRemoveEventListener", { node, event, handler, modifiers });
            dispose();
        };
    }
    function attr_dev(node, attribute, value) {
        attr(node, attribute, value);
        if (value == null)
            dispatch_dev("SvelteDOMRemoveAttribute", { node, attribute });
        else
            dispatch_dev("SvelteDOMSetAttribute", { node, attribute, value });
    }
    function set_data_dev(text, data) {
        data = '' + data;
        if (text.wholeText === data)
            return;
        dispatch_dev("SvelteDOMSetData", { node: text, data });
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
    class SvelteComponentDev extends SvelteComponent {
        constructor(options) {
            if (!options || (!options.target && !options.$$inline)) {
                throw new Error(`'target' is a required option`);
            }
            super();
        }
        $destroy() {
            super.$destroy();
            this.$destroy = () => {
                console.warn(`Component was already destroyed`); // eslint-disable-line no-console
            };
        }
        $capture_state() { }
        $inject_state() { }
    }

    /* src\component\Footer.svelte generated by Svelte v3.24.1 */

    const file = "src\\component\\Footer.svelte";

    function create_fragment(ctx) {
    	let footer;
    	let div;

    	const block = {
    		c: function create() {
    			footer = element("footer");
    			div = element("div");
    			div.textContent = "Copyright 2020 Zulhakimi";
    			attr_dev(div, "class", "copyright svelte-16uwzkt");
    			add_location(div, file, 1, 4, 14);
    			attr_dev(footer, "class", "svelte-16uwzkt");
    			add_location(footer, file, 0, 0, 0);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, footer, anchor);
    			append_dev(footer, div);
    		},
    		p: noop,
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(footer);
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

    function instance($$self, $$props) {
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Footer> was created with unknown prop '${key}'`);
    	});

    	let { $$slots = {}, $$scope } = $$props;
    	validate_slots("Footer", $$slots, []);
    	return [];
    }

    class Footer extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance, create_fragment, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Footer",
    			options,
    			id: create_fragment.name
    		});
    	}
    }

    /* src\component\Tab.svelte generated by Svelte v3.24.1 */
    const file$1 = "src\\component\\Tab.svelte";

    function get_each_context(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[4] = list[i];
    	return child_ctx;
    }

    // (13:8) {#each items as item }
    function create_each_block(ctx) {
    	let li;
    	let div;
    	let t0_value = /*item*/ ctx[4] + "";
    	let t0;
    	let t1;
    	let mounted;
    	let dispose;

    	function click_handler(...args) {
    		return /*click_handler*/ ctx[3](/*item*/ ctx[4], ...args);
    	}

    	const block = {
    		c: function create() {
    			li = element("li");
    			div = element("div");
    			t0 = text(t0_value);
    			t1 = space();
    			attr_dev(div, "class", "svelte-33j2ub");
    			toggle_class(div, "active", /*item*/ ctx[4] === /*activeItem*/ ctx[1]);
    			add_location(div, file$1, 14, 12, 312);
    			attr_dev(li, "class", "svelte-33j2ub");
    			add_location(li, file$1, 13, 8, 249);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, li, anchor);
    			append_dev(li, div);
    			append_dev(div, t0);
    			append_dev(li, t1);

    			if (!mounted) {
    				dispose = listen_dev(li, "click", click_handler, false, false, false);
    				mounted = true;
    			}
    		},
    		p: function update(new_ctx, dirty) {
    			ctx = new_ctx;
    			if (dirty & /*items*/ 1 && t0_value !== (t0_value = /*item*/ ctx[4] + "")) set_data_dev(t0, t0_value);

    			if (dirty & /*items, activeItem*/ 3) {
    				toggle_class(div, "active", /*item*/ ctx[4] === /*activeItem*/ ctx[1]);
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(li);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block.name,
    		type: "each",
    		source: "(13:8) {#each items as item }",
    		ctx
    	});

    	return block;
    }

    function create_fragment$1(ctx) {
    	let div;
    	let ul;
    	let each_value = /*items*/ ctx[0];
    	validate_each_argument(each_value);
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block(get_each_context(ctx, each_value, i));
    	}

    	const block = {
    		c: function create() {
    			div = element("div");
    			ul = element("ul");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			attr_dev(ul, "class", "svelte-33j2ub");
    			add_location(ul, file$1, 11, 4, 203);
    			attr_dev(div, "class", "tabs svelte-33j2ub");
    			add_location(div, file$1, 10, 0, 179);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, ul);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(ul, null);
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*dispatch, items, activeItem*/ 7) {
    				each_value = /*items*/ ctx[0];
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
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			destroy_each(each_blocks, detaching);
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
    	let dispatch = createEventDispatcher();
    	let { items } = $$props;
    	let { activeItem } = $$props;
    	const writable_props = ["items", "activeItem"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Tab> was created with unknown prop '${key}'`);
    	});

    	let { $$slots = {}, $$scope } = $$props;
    	validate_slots("Tab", $$slots, []);
    	const click_handler = item => dispatch("tabChange", item);

    	$$self.$$set = $$props => {
    		if ("items" in $$props) $$invalidate(0, items = $$props.items);
    		if ("activeItem" in $$props) $$invalidate(1, activeItem = $$props.activeItem);
    	};

    	$$self.$capture_state = () => ({
    		createEventDispatcher,
    		dispatch,
    		items,
    		activeItem
    	});

    	$$self.$inject_state = $$props => {
    		if ("dispatch" in $$props) $$invalidate(2, dispatch = $$props.dispatch);
    		if ("items" in $$props) $$invalidate(0, items = $$props.items);
    		if ("activeItem" in $$props) $$invalidate(1, activeItem = $$props.activeItem);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [items, activeItem, dispatch, click_handler];
    }

    class Tab extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$1, create_fragment$1, safe_not_equal, { items: 0, activeItem: 1 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Tab",
    			options,
    			id: create_fragment$1.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*items*/ ctx[0] === undefined && !("items" in props)) {
    			console.warn("<Tab> was created without expected prop 'items'");
    		}

    		if (/*activeItem*/ ctx[1] === undefined && !("activeItem" in props)) {
    			console.warn("<Tab> was created without expected prop 'activeItem'");
    		}
    	}

    	get items() {
    		throw new Error("<Tab>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set items(value) {
    		throw new Error("<Tab>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get activeItem() {
    		throw new Error("<Tab>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set activeItem(value) {
    		throw new Error("<Tab>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    // Unique ID creation requires a high quality random # generator. In the browser we therefore
    // require the crypto API and do not support built-in fallback to lower quality random number
    // generators (like Math.random()).
    // getRandomValues needs to be invoked in a context where "this" is a Crypto implementation. Also,
    // find the complete implementation of crypto (msCrypto) on IE11.
    var getRandomValues = typeof crypto !== 'undefined' && crypto.getRandomValues && crypto.getRandomValues.bind(crypto) || typeof msCrypto !== 'undefined' && typeof msCrypto.getRandomValues === 'function' && msCrypto.getRandomValues.bind(msCrypto);
    var rnds8 = new Uint8Array(16);
    function rng() {
      if (!getRandomValues) {
        throw new Error('crypto.getRandomValues() not supported. See https://github.com/uuidjs/uuid#getrandomvalues-not-supported');
      }

      return getRandomValues(rnds8);
    }

    var REGEX = /^(?:[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}|00000000-0000-0000-0000-000000000000)$/i;

    function validate(uuid) {
      return typeof uuid === 'string' && REGEX.test(uuid);
    }

    /**
     * Convert array of 16 byte values to UUID string format of the form:
     * XXXXXXXX-XXXX-XXXX-XXXX-XXXXXXXXXXXX
     */

    var byteToHex = [];

    for (var i = 0; i < 256; ++i) {
      byteToHex.push((i + 0x100).toString(16).substr(1));
    }

    function stringify(arr) {
      var offset = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 0;
      // Note: Be careful editing this code!  It's been tuned for performance
      // and works in ways you may not expect. See https://github.com/uuidjs/uuid/pull/434
      var uuid = (byteToHex[arr[offset + 0]] + byteToHex[arr[offset + 1]] + byteToHex[arr[offset + 2]] + byteToHex[arr[offset + 3]] + '-' + byteToHex[arr[offset + 4]] + byteToHex[arr[offset + 5]] + '-' + byteToHex[arr[offset + 6]] + byteToHex[arr[offset + 7]] + '-' + byteToHex[arr[offset + 8]] + byteToHex[arr[offset + 9]] + '-' + byteToHex[arr[offset + 10]] + byteToHex[arr[offset + 11]] + byteToHex[arr[offset + 12]] + byteToHex[arr[offset + 13]] + byteToHex[arr[offset + 14]] + byteToHex[arr[offset + 15]]).toLowerCase(); // Consistency check for valid UUID.  If this throws, it's likely due to one
      // of the following:
      // - One or more input array values don't map to a hex octet (leading to
      // "undefined" in the uuid)
      // - Invalid input values for the RFC `version` or `variant` fields

      if (!validate(uuid)) {
        throw TypeError('Stringified UUID is invalid');
      }

      return uuid;
    }

    function v4(options, buf, offset) {
      options = options || {};
      var rnds = options.random || (options.rng || rng)(); // Per 4.4, set bits for version and `clock_seq_hi_and_reserved`

      rnds[6] = rnds[6] & 0x0f | 0x40;
      rnds[8] = rnds[8] & 0x3f | 0x80; // Copy bytes to buffer, if provided

      if (buf) {
        offset = offset || 0;

        for (var i = 0; i < 16; ++i) {
          buf[offset + i] = rnds[i];
        }

        return buf;
      }

      return stringify(rnds);
    }

    /* src\router\Add.svelte generated by Svelte v3.24.1 */
    const file$2 = "src\\router\\Add.svelte";

    function create_fragment$2(ctx) {
    	let div17;
    	let form;
    	let div3;
    	let div2;
    	let div0;
    	let label0;
    	let t1;
    	let div1;
    	let input0;
    	let t2;
    	let div7;
    	let div6;
    	let div4;
    	let label1;
    	let t4;
    	let div5;
    	let input1;
    	let t5;
    	let div11;
    	let div10;
    	let div8;
    	let label2;
    	let t7;
    	let div9;
    	let input2;
    	let t8;
    	let div15;
    	let div14;
    	let div12;
    	let label3;
    	let t10;
    	let div13;
    	let select;
    	let option0;
    	let option1;
    	let option2;
    	let option3;
    	let option4;
    	let t16;
    	let div16;
    	let center;
    	let button;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			div17 = element("div");
    			form = element("form");
    			div3 = element("div");
    			div2 = element("div");
    			div0 = element("div");
    			label0 = element("label");
    			label0.textContent = "Title :";
    			t1 = space();
    			div1 = element("div");
    			input0 = element("input");
    			t2 = space();
    			div7 = element("div");
    			div6 = element("div");
    			div4 = element("div");
    			label1 = element("label");
    			label1.textContent = "Description :";
    			t4 = space();
    			div5 = element("div");
    			input1 = element("input");
    			t5 = space();
    			div11 = element("div");
    			div10 = element("div");
    			div8 = element("div");
    			label2 = element("label");
    			label2.textContent = "Amount :";
    			t7 = space();
    			div9 = element("div");
    			input2 = element("input");
    			t8 = space();
    			div15 = element("div");
    			div14 = element("div");
    			div12 = element("div");
    			label3 = element("label");
    			label3.textContent = "Label :";
    			t10 = space();
    			div13 = element("div");
    			select = element("select");
    			option0 = element("option");
    			option0.textContent = "Select a Label";
    			option1 = element("option");
    			option1.textContent = "Groceries";
    			option2 = element("option");
    			option2.textContent = "Bills";
    			option3 = element("option");
    			option3.textContent = "Utilities";
    			option4 = element("option");
    			option4.textContent = "Personal";
    			t16 = space();
    			div16 = element("div");
    			center = element("center");
    			button = element("button");
    			button.textContent = "Submit Now";
    			attr_dev(label0, "for", "title");
    			attr_dev(label0, "class", "svelte-11wv1a5");
    			add_location(label0, file$2, 50, 8, 1093);
    			attr_dev(div0, "class", "col-25 svelte-11wv1a5");
    			add_location(div0, file$2, 49, 12, 1063);
    			attr_dev(input0, "type", "text");
    			attr_dev(input0, "class", "form-control svelte-11wv1a5");
    			attr_dev(input0, "id", "detail");
    			attr_dev(input0, "placeholder", "Title");
    			add_location(input0, file$2, 53, 8, 1192);
    			attr_dev(div1, "class", "col-75 svelte-11wv1a5");
    			add_location(div1, file$2, 52, 12, 1162);
    			attr_dev(div2, "class", "row svelte-11wv1a5");
    			add_location(div2, file$2, 48, 8, 1032);
    			attr_dev(div3, "class", "form-group svelte-11wv1a5");
    			add_location(div3, file$2, 47, 4, 998);
    			attr_dev(label1, "for", "description");
    			attr_dev(label1, "class", "svelte-11wv1a5");
    			add_location(label1, file$2, 65, 8, 1465);
    			attr_dev(div4, "class", "col-25 svelte-11wv1a5");
    			add_location(div4, file$2, 64, 8, 1435);
    			attr_dev(input1, "type", "text");
    			attr_dev(input1, "class", "form-control svelte-11wv1a5");
    			attr_dev(input1, "id", "detail");
    			attr_dev(input1, "placeholder", "Description");
    			add_location(input1, file$2, 68, 8, 1568);
    			attr_dev(div5, "class", "col-75 svelte-11wv1a5");
    			add_location(div5, file$2, 67, 8, 1538);
    			attr_dev(div6, "class", "row svelte-11wv1a5");
    			add_location(div6, file$2, 63, 4, 1408);
    			attr_dev(div7, "class", "form-group svelte-11wv1a5");
    			add_location(div7, file$2, 62, 4, 1378);
    			attr_dev(label2, "for", "amount");
    			attr_dev(label2, "class", "svelte-11wv1a5");
    			add_location(label2, file$2, 81, 8, 1863);
    			attr_dev(div8, "class", "col-25 svelte-11wv1a5");
    			add_location(div8, file$2, 80, 12, 1833);
    			attr_dev(input2, "type", "number");
    			attr_dev(input2, "class", "form-control svelte-11wv1a5");
    			attr_dev(input2, "id", "detail");
    			attr_dev(input2, "placeholder", "amount");
    			add_location(input2, file$2, 84, 8, 1956);
    			attr_dev(div9, "class", "col-75 svelte-11wv1a5");
    			add_location(div9, file$2, 83, 8, 1926);
    			attr_dev(div10, "class", "row svelte-11wv1a5");
    			add_location(div10, file$2, 79, 8, 1802);
    			attr_dev(div11, "class", "form-group svelte-11wv1a5");
    			add_location(div11, file$2, 78, 4, 1768);
    			attr_dev(label3, "for", "label");
    			attr_dev(label3, "class", "svelte-11wv1a5");
    			add_location(label3, file$2, 97, 8, 2247);
    			attr_dev(div12, "class", "col-25 svelte-11wv1a5");
    			add_location(div12, file$2, 96, 12, 2217);
    			option0.selected = true;
    			option0.disabled = true;
    			option0.__value = "Select a Label";
    			option0.value = option0.__value;
    			attr_dev(option0, "class", "svelte-11wv1a5");
    			add_location(option0, file$2, 104, 8, 2448);
    			option1.__value = "groceries";
    			option1.value = option1.__value;
    			attr_dev(option1, "class", "svelte-11wv1a5");
    			add_location(option1, file$2, 105, 8, 2507);
    			option2.__value = "bills";
    			option2.value = option2.__value;
    			attr_dev(option2, "class", "svelte-11wv1a5");
    			add_location(option2, file$2, 106, 8, 2561);
    			option3.__value = "utilities";
    			option3.value = option3.__value;
    			attr_dev(option3, "class", "svelte-11wv1a5");
    			add_location(option3, file$2, 107, 8, 2607);
    			option4.__value = "personal";
    			option4.value = option4.__value;
    			attr_dev(option4, "class", "svelte-11wv1a5");
    			add_location(option4, file$2, 108, 8, 2661);
    			attr_dev(select, "class", "form-control svelte-11wv1a5");
    			attr_dev(select, "id", "label");
    			if (/*expen*/ ctx[0].label === void 0) add_render_callback(() => /*select_change_handler*/ ctx[5].call(select));
    			add_location(select, file$2, 100, 8, 2346);
    			attr_dev(div13, "class", "col-75 svelte-11wv1a5");
    			add_location(div13, file$2, 99, 12, 2316);
    			attr_dev(div14, "class", "row svelte-11wv1a5");
    			add_location(div14, file$2, 95, 8, 2186);
    			attr_dev(div15, "class", "form-group svelte-11wv1a5");
    			add_location(div15, file$2, 94, 4, 2152);
    			attr_dev(button, "type", "submit");
    			attr_dev(button, "class", "btn submit svelte-11wv1a5");
    			add_location(button, file$2, 115, 4, 2809);
    			attr_dev(center, "class", "svelte-11wv1a5");
    			add_location(center, file$2, 114, 8, 2795);
    			attr_dev(div16, "class", "row svelte-11wv1a5");
    			add_location(div16, file$2, 113, 4, 2768);
    			attr_dev(form, "class", "svelte-11wv1a5");
    			add_location(form, file$2, 45, 0, 943);
    			attr_dev(div17, "class", "container svelte-11wv1a5");
    			add_location(div17, file$2, 44, 0, 918);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div17, anchor);
    			append_dev(div17, form);
    			append_dev(form, div3);
    			append_dev(div3, div2);
    			append_dev(div2, div0);
    			append_dev(div0, label0);
    			append_dev(div2, t1);
    			append_dev(div2, div1);
    			append_dev(div1, input0);
    			set_input_value(input0, /*expen*/ ctx[0].title);
    			append_dev(form, t2);
    			append_dev(form, div7);
    			append_dev(div7, div6);
    			append_dev(div6, div4);
    			append_dev(div4, label1);
    			append_dev(div6, t4);
    			append_dev(div6, div5);
    			append_dev(div5, input1);
    			set_input_value(input1, /*expen*/ ctx[0].description);
    			append_dev(form, t5);
    			append_dev(form, div11);
    			append_dev(div11, div10);
    			append_dev(div10, div8);
    			append_dev(div8, label2);
    			append_dev(div10, t7);
    			append_dev(div10, div9);
    			append_dev(div9, input2);
    			set_input_value(input2, /*expen*/ ctx[0].amount);
    			append_dev(form, t8);
    			append_dev(form, div15);
    			append_dev(div15, div14);
    			append_dev(div14, div12);
    			append_dev(div12, label3);
    			append_dev(div14, t10);
    			append_dev(div14, div13);
    			append_dev(div13, select);
    			append_dev(select, option0);
    			append_dev(select, option1);
    			append_dev(select, option2);
    			append_dev(select, option3);
    			append_dev(select, option4);
    			select_option(select, /*expen*/ ctx[0].label);
    			append_dev(form, t16);
    			append_dev(form, div16);
    			append_dev(div16, center);
    			append_dev(center, button);

    			if (!mounted) {
    				dispose = [
    					listen_dev(input0, "input", /*input0_input_handler*/ ctx[2]),
    					listen_dev(input1, "input", /*input1_input_handler*/ ctx[3]),
    					listen_dev(input2, "input", /*input2_input_handler*/ ctx[4]),
    					listen_dev(select, "change", /*select_change_handler*/ ctx[5]),
    					listen_dev(form, "submit", prevent_default(/*SubmitHandler*/ ctx[1]), false, true, false)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*expen*/ 1 && input0.value !== /*expen*/ ctx[0].title) {
    				set_input_value(input0, /*expen*/ ctx[0].title);
    			}

    			if (dirty & /*expen*/ 1 && input1.value !== /*expen*/ ctx[0].description) {
    				set_input_value(input1, /*expen*/ ctx[0].description);
    			}

    			if (dirty & /*expen*/ 1 && to_number(input2.value) !== /*expen*/ ctx[0].amount) {
    				set_input_value(input2, /*expen*/ ctx[0].amount);
    			}

    			if (dirty & /*expen*/ 1) {
    				select_option(select, /*expen*/ ctx[0].label);
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div17);
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
    	let dispatch = createEventDispatcher();

    	let expen = {
    		id: v4(),
    		title: "",
    		description: "",
    		amount: "",
    		label: "",
    		complated: false
    	};

    	const addExpen = () => {
    		const newExpen = {
    			id: v4(),
    			title: expen.title,
    			description: expen.description,
    			amount: expen.amount,
    			label: expen.label,
    			complated: false
    		};

    		cleanExpen();
    		dispatch("add", newExpen);
    	};

    	const cleanExpen = () => {
    		$$invalidate(0, expen = {
    			id: v4(),
    			title: "",
    			description: "",
    			amount: 0,
    			label: "",
    			complated: false
    		});
    	};

    	const SubmitHandler = () => {
    		addExpen();
    	};

    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Add> was created with unknown prop '${key}'`);
    	});

    	let { $$slots = {}, $$scope } = $$props;
    	validate_slots("Add", $$slots, []);

    	function input0_input_handler() {
    		expen.title = this.value;
    		$$invalidate(0, expen);
    	}

    	function input1_input_handler() {
    		expen.description = this.value;
    		$$invalidate(0, expen);
    	}

    	function input2_input_handler() {
    		expen.amount = to_number(this.value);
    		$$invalidate(0, expen);
    	}

    	function select_change_handler() {
    		expen.label = select_value(this);
    		$$invalidate(0, expen);
    	}

    	$$self.$capture_state = () => ({
    		v4,
    		createEventDispatcher,
    		dispatch,
    		expen,
    		addExpen,
    		cleanExpen,
    		SubmitHandler
    	});

    	$$self.$inject_state = $$props => {
    		if ("dispatch" in $$props) dispatch = $$props.dispatch;
    		if ("expen" in $$props) $$invalidate(0, expen = $$props.expen);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [
    		expen,
    		SubmitHandler,
    		input0_input_handler,
    		input1_input_handler,
    		input2_input_handler,
    		select_change_handler
    	];
    }

    class Add extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$2, create_fragment$2, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Add",
    			options,
    			id: create_fragment$2.name
    		});
    	}
    }

    /* src\component\Modal.svelte generated by Svelte v3.24.1 */

    const file$3 = "src\\component\\Modal.svelte";

    // (44:2) {#if shown}
    function create_if_block(ctx) {
    	let div1;
    	let div0;
    	let span;
    	let t1;
    	let current;
    	let mounted;
    	let dispose;
    	const default_slot_template = /*$$slots*/ ctx[4].default;
    	const default_slot = create_slot(default_slot_template, ctx, /*$$scope*/ ctx[3], null);

    	const block = {
    		c: function create() {
    			div1 = element("div");
    			div0 = element("div");
    			span = element("span");
    			span.textContent = "×";
    			t1 = space();
    			if (default_slot) default_slot.c();
    			attr_dev(span, "class", "close svelte-gfwgh5");
    			add_location(span, file$3, 46, 8, 847);
    			attr_dev(div0, "class", "modal svelte-gfwgh5");
    			add_location(div0, file$3, 45, 6, 818);
    			attr_dev(div1, "class", "modal-wrapper svelte-gfwgh5");
    			add_location(div1, file$3, 44, 4, 783);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div1, anchor);
    			append_dev(div1, div0);
    			append_dev(div0, span);
    			append_dev(div0, t1);

    			if (default_slot) {
    				default_slot.m(div0, null);
    			}

    			current = true;

    			if (!mounted) {
    				dispose = listen_dev(span, "click", /*click_handler*/ ctx[6], false, false, false);
    				mounted = true;
    			}
    		},
    		p: function update(ctx, dirty) {
    			if (default_slot) {
    				if (default_slot.p && dirty & /*$$scope*/ 8) {
    					update_slot(default_slot, default_slot_template, ctx, /*$$scope*/ ctx[3], dirty, null, null);
    				}
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
    			if (detaching) detach_dev(div1);
    			if (default_slot) default_slot.d(detaching);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block.name,
    		type: "if",
    		source: "(44:2) {#if shown}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$3(ctx) {
    	let if_block_anchor;
    	let current;
    	let mounted;
    	let dispose;
    	let if_block = /*shown*/ ctx[1] && create_if_block(ctx);

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
    			current = true;

    			if (!mounted) {
    				dispose = listen_dev(window, "keydown", /*keydown_handler*/ ctx[5], false, false, false);
    				mounted = true;
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (/*shown*/ ctx[1]) {
    				if (if_block) {
    					if_block.p(ctx, dirty);

    					if (dirty & /*shown*/ 2) {
    						transition_in(if_block, 1);
    					}
    				} else {
    					if_block = create_if_block(ctx);
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
    			mounted = false;
    			dispose();
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
    	let shown = false;

    	function show() {
    		$$invalidate(1, shown = true);
    	}

    	function hide() {
    		$$invalidate(1, shown = false);
    	}

    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Modal> was created with unknown prop '${key}'`);
    	});

    	let { $$slots = {}, $$scope } = $$props;
    	validate_slots("Modal", $$slots, ['default']);

    	const keydown_handler = e => {
    		if (e.keyCode == 27) {
    			hide();
    		}
    	};

    	const click_handler = () => hide();

    	$$self.$$set = $$props => {
    		if ("$$scope" in $$props) $$invalidate(3, $$scope = $$props.$$scope);
    	};

    	$$self.$capture_state = () => ({ shown, show, hide });

    	$$self.$inject_state = $$props => {
    		if ("shown" in $$props) $$invalidate(1, shown = $$props.shown);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [hide, shown, show, $$scope, $$slots, keydown_handler, click_handler];
    }

    class Modal extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$3, create_fragment$3, safe_not_equal, { show: 2, hide: 0 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Modal",
    			options,
    			id: create_fragment$3.name
    		});
    	}

    	get show() {
    		return this.$$.ctx[2];
    	}

    	set show(value) {
    		throw new Error("<Modal>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get hide() {
    		return this.$$.ctx[0];
    	}

    	set hide(value) {
    		throw new Error("<Modal>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src\router\Display.svelte generated by Svelte v3.24.1 */

    const { console: console_1 } = globals;
    const file$4 = "src\\router\\Display.svelte";

    function get_each_context$1(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[21] = list[i];
    	child_ctx[22] = list;
    	child_ctx[23] = i;
    	return child_ctx;
    }

    // (94:12) {#if expens != null}
    function create_if_block$1(ctx) {
    	let each_1_anchor;
    	let each_value = /*expens*/ ctx[0];
    	validate_each_argument(each_value);
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block$1(get_each_context$1(ctx, each_value, i));
    	}

    	let each_1_else = null;

    	if (!each_value.length) {
    		each_1_else = create_else_block(ctx);
    	}

    	const block = {
    		c: function create() {
    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			each_1_anchor = empty();

    			if (each_1_else) {
    				each_1_else.c();
    			}
    		},
    		m: function mount(target, anchor) {
    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(target, anchor);
    			}

    			insert_dev(target, each_1_anchor, anchor);

    			if (each_1_else) {
    				each_1_else.m(target, anchor);
    			}
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*deleteexpens, updatecomplate, expens*/ 49) {
    				each_value = /*expens*/ ctx[0];
    				validate_each_argument(each_value);
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context$1(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    					} else {
    						each_blocks[i] = create_each_block$1(child_ctx);
    						each_blocks[i].c();
    						each_blocks[i].m(each_1_anchor.parentNode, each_1_anchor);
    					}
    				}

    				for (; i < each_blocks.length; i += 1) {
    					each_blocks[i].d(1);
    				}

    				each_blocks.length = each_value.length;

    				if (each_value.length) {
    					if (each_1_else) {
    						each_1_else.d(1);
    						each_1_else = null;
    					}
    				} else if (!each_1_else) {
    					each_1_else = create_else_block(ctx);
    					each_1_else.c();
    					each_1_else.m(each_1_anchor.parentNode, each_1_anchor);
    				}
    			}
    		},
    		d: function destroy(detaching) {
    			destroy_each(each_blocks, detaching);
    			if (detaching) detach_dev(each_1_anchor);
    			if (each_1_else) each_1_else.d(detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$1.name,
    		type: "if",
    		source: "(94:12) {#if expens != null}",
    		ctx
    	});

    	return block;
    }

    // (111:12) {:else}
    function create_else_block(ctx) {
    	let t;

    	const block = {
    		c: function create() {
    			t = text("No Expenses...");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, t, anchor);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(t);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_else_block.name,
    		type: "else",
    		source: "(111:12) {:else}",
    		ctx
    	});

    	return block;
    }

    // (96:12) {#each expens as expenses ,i }
    function create_each_block$1(ctx) {
    	let div;
    	let h3;
    	let strong;
    	let t0;
    	let t1_value = /*expenses*/ ctx[21].title + "";
    	let t1;
    	let t2;
    	let span0;
    	let t3;
    	let t4_value = /*expenses*/ ctx[21].description + "";
    	let t4;
    	let br0;
    	let t5;
    	let label;
    	let input;
    	let t6;
    	let span1;
    	let t7;
    	let span2;
    	let t8;
    	let t9_value = /*expenses*/ ctx[21].amount + "";
    	let t9;
    	let t10;
    	let br1;
    	let t11;
    	let span3;
    	let t12;
    	let t13_value = /*expenses*/ ctx[21].label + "";
    	let t13;
    	let t14;
    	let br2;
    	let br3;
    	let t15;
    	let button0;
    	let t17;
    	let button1;
    	let t19;
    	let mounted;
    	let dispose;

    	function input_change_handler() {
    		/*input_change_handler*/ ctx[10].call(input, /*each_value*/ ctx[22], /*i*/ ctx[23]);
    	}

    	function click_handler_1(...args) {
    		return /*click_handler_1*/ ctx[11](/*i*/ ctx[23], ...args);
    	}

    	function click_handler_2(...args) {
    		return /*click_handler_2*/ ctx[12](/*i*/ ctx[23], ...args);
    	}

    	const block = {
    		c: function create() {
    			div = element("div");
    			h3 = element("h3");
    			strong = element("strong");
    			t0 = text("Title : ");
    			t1 = text(t1_value);
    			t2 = space();
    			span0 = element("span");
    			t3 = text("Description : ");
    			t4 = text(t4_value);
    			br0 = element("br");
    			t5 = space();
    			label = element("label");
    			input = element("input");
    			t6 = space();
    			span1 = element("span");
    			t7 = space();
    			span2 = element("span");
    			t8 = text("Amount :  ");
    			t9 = text(t9_value);
    			t10 = space();
    			br1 = element("br");
    			t11 = space();
    			span3 = element("span");
    			t12 = text("Label :  ");
    			t13 = text(t13_value);
    			t14 = space();
    			br2 = element("br");
    			br3 = element("br");
    			t15 = space();
    			button0 = element("button");
    			button0.textContent = "Update";
    			t17 = space();
    			button1 = element("button");
    			button1.textContent = "Delete";
    			t19 = space();
    			add_location(strong, file$4, 98, 16, 2003);
    			add_location(h3, file$4, 97, 17, 1981);
    			attr_dev(span0, "class", "svelte-63m9fl");
    			add_location(span0, file$4, 100, 16, 2085);
    			add_location(br0, file$4, 100, 65, 2134);
    			attr_dev(input, "type", "checkbox");
    			attr_dev(input, "class", "svelte-63m9fl");
    			add_location(input, file$4, 102, 20, 2203);
    			attr_dev(span1, "class", "checkmark svelte-63m9fl");
    			add_location(span1, file$4, 103, 20, 2279);
    			attr_dev(label, "class", "container svelte-63m9fl");
    			add_location(label, file$4, 101, 16, 2156);
    			attr_dev(span2, "class", "svelte-63m9fl");
    			add_location(span2, file$4, 105, 16, 2354);
    			add_location(br1, file$4, 105, 57, 2395);
    			attr_dev(span3, "class", "svelte-63m9fl");
    			add_location(span3, file$4, 106, 16, 2417);
    			add_location(br2, file$4, 106, 55, 2456);
    			add_location(br3, file$4, 106, 59, 2460);
    			attr_dev(button0, "class", "btn update svelte-63m9fl");
    			add_location(button0, file$4, 107, 16, 2482);
    			attr_dev(button1, "class", "btn danger svelte-63m9fl");
    			add_location(button1, file$4, 108, 16, 2579);
    			attr_dev(div, "class", "detail svelte-63m9fl");
    			add_location(div, file$4, 96, 12, 1942);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, h3);
    			append_dev(h3, strong);
    			append_dev(strong, t0);
    			append_dev(strong, t1);
    			append_dev(div, t2);
    			append_dev(div, span0);
    			append_dev(span0, t3);
    			append_dev(span0, t4);
    			append_dev(div, br0);
    			append_dev(div, t5);
    			append_dev(div, label);
    			append_dev(label, input);
    			input.checked = /*expenses*/ ctx[21].select;
    			append_dev(label, t6);
    			append_dev(label, span1);
    			append_dev(div, t7);
    			append_dev(div, span2);
    			append_dev(span2, t8);
    			append_dev(span2, t9);
    			append_dev(span2, t10);
    			append_dev(div, br1);
    			append_dev(div, t11);
    			append_dev(div, span3);
    			append_dev(span3, t12);
    			append_dev(span3, t13);
    			append_dev(span3, t14);
    			append_dev(div, br2);
    			append_dev(div, br3);
    			append_dev(div, t15);
    			append_dev(div, button0);
    			append_dev(div, t17);
    			append_dev(div, button1);
    			append_dev(div, t19);

    			if (!mounted) {
    				dispose = [
    					listen_dev(input, "change", input_change_handler),
    					listen_dev(button0, "click", click_handler_1, false, false, false),
    					listen_dev(button1, "click", click_handler_2, false, false, false)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(new_ctx, dirty) {
    			ctx = new_ctx;
    			if (dirty & /*expens*/ 1 && t1_value !== (t1_value = /*expenses*/ ctx[21].title + "")) set_data_dev(t1, t1_value);
    			if (dirty & /*expens*/ 1 && t4_value !== (t4_value = /*expenses*/ ctx[21].description + "")) set_data_dev(t4, t4_value);

    			if (dirty & /*expens*/ 1) {
    				input.checked = /*expenses*/ ctx[21].select;
    			}

    			if (dirty & /*expens*/ 1 && t9_value !== (t9_value = /*expenses*/ ctx[21].amount + "")) set_data_dev(t9, t9_value);
    			if (dirty & /*expens*/ 1 && t13_value !== (t13_value = /*expenses*/ ctx[21].label + "")) set_data_dev(t13, t13_value);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block$1.name,
    		type: "each",
    		source: "(96:12) {#each expens as expenses ,i }",
    		ctx
    	});

    	return block;
    }

    // (120:8) <Modal bind:this={update}>
    function create_default_slot(ctx) {
    	let form;
    	let div3;
    	let div2;
    	let div0;
    	let label0;
    	let t1;
    	let div1;
    	let input0;
    	let t2;
    	let div7;
    	let div6;
    	let div4;
    	let label1;
    	let t4;
    	let div5;
    	let input1;
    	let t5;
    	let div11;
    	let div10;
    	let div8;
    	let label2;
    	let t7;
    	let div9;
    	let input2;
    	let t8;
    	let div15;
    	let div14;
    	let div12;
    	let label3;
    	let t10;
    	let div13;
    	let select;
    	let option0;
    	let option1;
    	let option2;
    	let option3;
    	let option4;
    	let t16;
    	let div16;
    	let center;
    	let button;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			form = element("form");
    			div3 = element("div");
    			div2 = element("div");
    			div0 = element("div");
    			label0 = element("label");
    			label0.textContent = "Title :";
    			t1 = space();
    			div1 = element("div");
    			input0 = element("input");
    			t2 = space();
    			div7 = element("div");
    			div6 = element("div");
    			div4 = element("div");
    			label1 = element("label");
    			label1.textContent = "Description :";
    			t4 = space();
    			div5 = element("div");
    			input1 = element("input");
    			t5 = space();
    			div11 = element("div");
    			div10 = element("div");
    			div8 = element("div");
    			label2 = element("label");
    			label2.textContent = "Amount :";
    			t7 = space();
    			div9 = element("div");
    			input2 = element("input");
    			t8 = space();
    			div15 = element("div");
    			div14 = element("div");
    			div12 = element("div");
    			label3 = element("label");
    			label3.textContent = "Label :";
    			t10 = space();
    			div13 = element("div");
    			select = element("select");
    			option0 = element("option");
    			option0.textContent = "Select a Label";
    			option1 = element("option");
    			option1.textContent = "Groceries";
    			option2 = element("option");
    			option2.textContent = "Bills";
    			option3 = element("option");
    			option3.textContent = "Utilities";
    			option4 = element("option");
    			option4.textContent = "Personal";
    			t16 = space();
    			div16 = element("div");
    			center = element("center");
    			button = element("button");
    			button.textContent = "Submit Now";
    			attr_dev(label0, "for", "title");
    			attr_dev(label0, "class", "svelte-63m9fl");
    			add_location(label0, file$4, 124, 8, 3083);
    			attr_dev(div0, "class", "col-25 svelte-63m9fl");
    			add_location(div0, file$4, 123, 12, 3053);
    			attr_dev(input0, "type", "text");
    			attr_dev(input0, "class", "form-control svelte-63m9fl");
    			attr_dev(input0, "id", "detail");
    			attr_dev(input0, "placeholder", "Title");
    			add_location(input0, file$4, 127, 8, 3182);
    			attr_dev(div1, "class", "col-75 svelte-63m9fl");
    			add_location(div1, file$4, 126, 12, 3152);
    			attr_dev(div2, "class", "row svelte-63m9fl");
    			add_location(div2, file$4, 122, 8, 3022);
    			attr_dev(div3, "class", "form-group");
    			add_location(div3, file$4, 121, 4, 2988);
    			attr_dev(label1, "for", "description");
    			attr_dev(label1, "class", "svelte-63m9fl");
    			add_location(label1, file$4, 139, 8, 3455);
    			attr_dev(div4, "class", "col-25 svelte-63m9fl");
    			add_location(div4, file$4, 138, 8, 3425);
    			attr_dev(input1, "type", "text");
    			attr_dev(input1, "class", "form-control svelte-63m9fl");
    			attr_dev(input1, "id", "detail");
    			attr_dev(input1, "placeholder", "Description");
    			add_location(input1, file$4, 142, 8, 3558);
    			attr_dev(div5, "class", "col-75 svelte-63m9fl");
    			add_location(div5, file$4, 141, 8, 3528);
    			attr_dev(div6, "class", "row svelte-63m9fl");
    			add_location(div6, file$4, 137, 4, 3398);
    			attr_dev(div7, "class", "form-group");
    			add_location(div7, file$4, 136, 4, 3368);
    			attr_dev(label2, "for", "amount");
    			attr_dev(label2, "class", "svelte-63m9fl");
    			add_location(label2, file$4, 155, 8, 3853);
    			attr_dev(div8, "class", "col-25 svelte-63m9fl");
    			add_location(div8, file$4, 154, 12, 3823);
    			attr_dev(input2, "type", "number");
    			attr_dev(input2, "class", "form-control svelte-63m9fl");
    			attr_dev(input2, "id", "detail");
    			attr_dev(input2, "placeholder", "amount");
    			add_location(input2, file$4, 158, 8, 3946);
    			attr_dev(div9, "class", "col-75 svelte-63m9fl");
    			add_location(div9, file$4, 157, 8, 3916);
    			attr_dev(div10, "class", "row svelte-63m9fl");
    			add_location(div10, file$4, 153, 8, 3792);
    			attr_dev(div11, "class", "form-group");
    			add_location(div11, file$4, 152, 4, 3758);
    			attr_dev(label3, "for", "label");
    			attr_dev(label3, "class", "svelte-63m9fl");
    			add_location(label3, file$4, 171, 8, 4237);
    			attr_dev(div12, "class", "col-25 svelte-63m9fl");
    			add_location(div12, file$4, 170, 12, 4207);
    			option0.selected = true;
    			option0.disabled = true;
    			option0.__value = "Select a Label";
    			option0.value = option0.__value;
    			add_location(option0, file$4, 178, 8, 4438);
    			option1.__value = "groceries";
    			option1.value = option1.__value;
    			add_location(option1, file$4, 179, 8, 4497);
    			option2.__value = "bills";
    			option2.value = option2.__value;
    			add_location(option2, file$4, 180, 8, 4551);
    			option3.__value = "utilities";
    			option3.value = option3.__value;
    			add_location(option3, file$4, 181, 8, 4597);
    			option4.__value = "personal";
    			option4.value = option4.__value;
    			add_location(option4, file$4, 182, 8, 4651);
    			attr_dev(select, "class", "form-control svelte-63m9fl");
    			attr_dev(select, "id", "label");
    			if (/*expen*/ ctx[1].label === void 0) add_render_callback(() => /*select_change_handler*/ ctx[16].call(select));
    			add_location(select, file$4, 174, 8, 4336);
    			attr_dev(div13, "class", "col-75 svelte-63m9fl");
    			add_location(div13, file$4, 173, 12, 4306);
    			attr_dev(div14, "class", "row svelte-63m9fl");
    			add_location(div14, file$4, 169, 8, 4176);
    			attr_dev(div15, "class", "form-group");
    			add_location(div15, file$4, 168, 4, 4142);
    			attr_dev(button, "type", "submit");
    			attr_dev(button, "class", "btn submit1 svelte-63m9fl");
    			add_location(button, file$4, 189, 4, 4799);
    			add_location(center, file$4, 188, 8, 4785);
    			attr_dev(div16, "class", "row svelte-63m9fl");
    			add_location(div16, file$4, 187, 4, 4758);
    			add_location(form, file$4, 120, 0, 2933);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, form, anchor);
    			append_dev(form, div3);
    			append_dev(div3, div2);
    			append_dev(div2, div0);
    			append_dev(div0, label0);
    			append_dev(div2, t1);
    			append_dev(div2, div1);
    			append_dev(div1, input0);
    			set_input_value(input0, /*expen*/ ctx[1].title);
    			append_dev(form, t2);
    			append_dev(form, div7);
    			append_dev(div7, div6);
    			append_dev(div6, div4);
    			append_dev(div4, label1);
    			append_dev(div6, t4);
    			append_dev(div6, div5);
    			append_dev(div5, input1);
    			set_input_value(input1, /*expen*/ ctx[1].description);
    			append_dev(form, t5);
    			append_dev(form, div11);
    			append_dev(div11, div10);
    			append_dev(div10, div8);
    			append_dev(div8, label2);
    			append_dev(div10, t7);
    			append_dev(div10, div9);
    			append_dev(div9, input2);
    			set_input_value(input2, /*expen*/ ctx[1].amount);
    			append_dev(form, t8);
    			append_dev(form, div15);
    			append_dev(div15, div14);
    			append_dev(div14, div12);
    			append_dev(div12, label3);
    			append_dev(div14, t10);
    			append_dev(div14, div13);
    			append_dev(div13, select);
    			append_dev(select, option0);
    			append_dev(select, option1);
    			append_dev(select, option2);
    			append_dev(select, option3);
    			append_dev(select, option4);
    			select_option(select, /*expen*/ ctx[1].label);
    			append_dev(form, t16);
    			append_dev(form, div16);
    			append_dev(div16, center);
    			append_dev(center, button);

    			if (!mounted) {
    				dispose = [
    					listen_dev(input0, "input", /*input0_input_handler*/ ctx[13]),
    					listen_dev(input1, "input", /*input1_input_handler*/ ctx[14]),
    					listen_dev(input2, "input", /*input2_input_handler*/ ctx[15]),
    					listen_dev(select, "change", /*select_change_handler*/ ctx[16]),
    					listen_dev(form, "submit", prevent_default(/*onSubmitHandler*/ ctx[8]), false, true, false)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*expen*/ 2 && input0.value !== /*expen*/ ctx[1].title) {
    				set_input_value(input0, /*expen*/ ctx[1].title);
    			}

    			if (dirty & /*expen*/ 2 && input1.value !== /*expen*/ ctx[1].description) {
    				set_input_value(input1, /*expen*/ ctx[1].description);
    			}

    			if (dirty & /*expen*/ 2 && to_number(input2.value) !== /*expen*/ ctx[1].amount) {
    				set_input_value(input2, /*expen*/ ctx[1].amount);
    			}

    			if (dirty & /*expen*/ 2) {
    				select_option(select, /*expen*/ ctx[1].label);
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(form);
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot.name,
    		type: "slot",
    		source: "(120:8) <Modal bind:this={update}>",
    		ctx
    	});

    	return block;
    }

    function create_fragment$4(ctx) {
    	let div0;
    	let t0;
    	let t1_value = /*totalExpenses*/ ctx[3]() + "";
    	let t1;
    	let t2;
    	let button0;
    	let t4;
    	let div1;
    	let t5;
    	let button1;
    	let t7;
    	let modal;
    	let current;
    	let mounted;
    	let dispose;
    	let if_block = /*expens*/ ctx[0] != null && create_if_block$1(ctx);

    	let modal_props = {
    		$$slots: { default: [create_default_slot] },
    		$$scope: { ctx }
    	};

    	modal = new Modal({ props: modal_props, $$inline: true });
    	/*modal_binding*/ ctx[17](modal);

    	const block = {
    		c: function create() {
    			div0 = element("div");
    			t0 = text("Your Total Expenses :  RM");
    			t1 = text(t1_value);
    			t2 = space();
    			button0 = element("button");
    			button0.textContent = "Reset";
    			t4 = space();
    			div1 = element("div");
    			if (if_block) if_block.c();
    			t5 = space();
    			button1 = element("button");
    			button1.textContent = "Clear Selected";
    			t7 = space();
    			create_component(modal.$$.fragment);
    			attr_dev(button0, "class", "btn danger svelte-63m9fl");
    			add_location(button0, file$4, 88, 4, 1717);
    			attr_dev(div0, "class", "display-total svelte-63m9fl");
    			add_location(div0, file$4, 86, 0, 1633);
    			attr_dev(div1, "class", "display svelte-63m9fl");
    			add_location(div1, file$4, 92, 8, 1811);
    			attr_dev(button1, "class", "btn danger svelte-63m9fl");
    			add_location(button1, file$4, 116, 8, 2801);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div0, anchor);
    			append_dev(div0, t0);
    			append_dev(div0, t1);
    			append_dev(div0, t2);
    			append_dev(div0, button0);
    			insert_dev(target, t4, anchor);
    			insert_dev(target, div1, anchor);
    			if (if_block) if_block.m(div1, null);
    			insert_dev(target, t5, anchor);
    			insert_dev(target, button1, anchor);
    			insert_dev(target, t7, anchor);
    			mount_component(modal, target, anchor);
    			current = true;

    			if (!mounted) {
    				dispose = [
    					listen_dev(button0, "click", /*click_handler*/ ctx[9], false, false, false),
    					listen_dev(button1, "click", /*clearCompleted*/ ctx[7], false, false, false)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if ((!current || dirty & /*totalExpenses*/ 8) && t1_value !== (t1_value = /*totalExpenses*/ ctx[3]() + "")) set_data_dev(t1, t1_value);

    			if (/*expens*/ ctx[0] != null) {
    				if (if_block) {
    					if_block.p(ctx, dirty);
    				} else {
    					if_block = create_if_block$1(ctx);
    					if_block.c();
    					if_block.m(div1, null);
    				}
    			} else if (if_block) {
    				if_block.d(1);
    				if_block = null;
    			}

    			const modal_changes = {};

    			if (dirty & /*$$scope, expen*/ 16777218) {
    				modal_changes.$$scope = { dirty, ctx };
    			}

    			modal.$set(modal_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(modal.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(modal.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div0);
    			if (detaching) detach_dev(t4);
    			if (detaching) detach_dev(div1);
    			if (if_block) if_block.d();
    			if (detaching) detach_dev(t5);
    			if (detaching) detach_dev(button1);
    			if (detaching) detach_dev(t7);
    			/*modal_binding*/ ctx[17](null);
    			destroy_component(modal, detaching);
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
    	let { expens = [] } = $$props;
    	let currentFilter = "all";

    	let expen = {
    		title: "",
    		description: "",
    		amount: "",
    		label: ""
    	};

    	let update;

    	function updatecomplate(index) {
    		console.log(index);
    		update.show();
    		var userExpen = expens[index];
    		console.log({ userExpen });
    		$$invalidate(1, expen = userExpen);
    	}

    	function deleteexpens(index) {
    		var target = expens[index].id;
    		deleteExpen(target);
    	}

    	const deleteExpen = id => {
    		console.log(id);
    		$$invalidate(0, expens = expens.filter(expenses => expenses.id !== id));
    	};

    	const deleteAll = () => {
    		$$invalidate(0, expens = expens.filter(expenses => !expenses));
    	};

    	function clearCompleted() {
    		$$invalidate(0, expens = expens.filter(expenses => !expenses.select));
    	}

    	const updateExpenses = () => {
    		let updatedExpenses = {
    			title: expen.title,
    			description: expen.description,
    			amount: expen.amount,
    			label: expen.lebel
    		};

    		const expenIndex = expens.findIndex(p => p.id === expen.id);
    		$$invalidate(0, expens[expenIndex] = updatedExpenses, expens);
    	};

    	const onSubmitHandler = () => {
    		updateExpenses();
    	};

    	const writable_props = ["expens"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console_1.warn(`<Display> was created with unknown prop '${key}'`);
    	});

    	let { $$slots = {}, $$scope } = $$props;
    	validate_slots("Display", $$slots, []);
    	const click_handler = () => deleteAll();

    	function input_change_handler(each_value, i) {
    		each_value[i].select = this.checked;
    		($$invalidate(0, expens), $$invalidate(18, currentFilter));
    	}

    	const click_handler_1 = i => updatecomplate(i);
    	const click_handler_2 = i => deleteexpens(i);

    	function input0_input_handler() {
    		expen.title = this.value;
    		$$invalidate(1, expen);
    	}

    	function input1_input_handler() {
    		expen.description = this.value;
    		$$invalidate(1, expen);
    	}

    	function input2_input_handler() {
    		expen.amount = to_number(this.value);
    		$$invalidate(1, expen);
    	}

    	function select_change_handler() {
    		expen.label = select_value(this);
    		$$invalidate(1, expen);
    	}

    	function modal_binding($$value) {
    		binding_callbacks[$$value ? "unshift" : "push"](() => {
    			update = $$value;
    			$$invalidate(2, update);
    		});
    	}

    	$$self.$$set = $$props => {
    		if ("expens" in $$props) $$invalidate(0, expens = $$props.expens);
    	};

    	$$self.$capture_state = () => ({
    		Modal,
    		expens,
    		currentFilter,
    		expen,
    		update,
    		updatecomplate,
    		deleteexpens,
    		deleteExpen,
    		deleteAll,
    		clearCompleted,
    		updateExpenses,
    		onSubmitHandler,
    		totalExpenses
    	});

    	$$self.$inject_state = $$props => {
    		if ("expens" in $$props) $$invalidate(0, expens = $$props.expens);
    		if ("currentFilter" in $$props) $$invalidate(18, currentFilter = $$props.currentFilter);
    		if ("expen" in $$props) $$invalidate(1, expen = $$props.expen);
    		if ("update" in $$props) $$invalidate(2, update = $$props.update);
    		if ("totalExpenses" in $$props) $$invalidate(3, totalExpenses = $$props.totalExpenses);
    	};

    	let totalExpenses;

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*expens*/ 1) {
    			 $$invalidate(0, expens = currentFilter === "all"
    			? expens
    			: currentFilter === "selected"
    				? expens.filter(expenses => expenses.select)
    				: expens.filter(expenses => !expenses.select));
    		}

    		if ($$self.$$.dirty & /*expens*/ 1) {
    			 $$invalidate(3, totalExpenses = () => {
    				let total = 0;

    				for (let index = 0; index < expens.length; index++) {
    					const element = expens[index];
    					total += element.amount;
    				}

    				return total;
    			});
    		}
    	};

    	return [
    		expens,
    		expen,
    		update,
    		totalExpenses,
    		updatecomplate,
    		deleteexpens,
    		deleteAll,
    		clearCompleted,
    		onSubmitHandler,
    		click_handler,
    		input_change_handler,
    		click_handler_1,
    		click_handler_2,
    		input0_input_handler,
    		input1_input_handler,
    		input2_input_handler,
    		select_change_handler,
    		modal_binding
    	];
    }

    class Display extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$4, create_fragment$4, safe_not_equal, { expens: 0 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Display",
    			options,
    			id: create_fragment$4.name
    		});
    	}

    	get expens() {
    		throw new Error("<Display>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set expens(value) {
    		throw new Error("<Display>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src\router\Home.svelte generated by Svelte v3.24.1 */

    const { console: console_1$1 } = globals;
    const file$5 = "src\\router\\Home.svelte";

    // (35:35) 
    function create_if_block_1(ctx) {
    	let add;
    	let current;
    	add = new Add({ $$inline: true });
    	add.$on("add", /*handleAdd*/ ctx[4]);

    	const block = {
    		c: function create() {
    			create_component(add.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(add, target, anchor);
    			current = true;
    		},
    		p: noop,
    		i: function intro(local) {
    			if (current) return;
    			transition_in(add.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(add.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(add, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_1.name,
    		type: "if",
    		source: "(35:35) ",
    		ctx
    	});

    	return block;
    }

    // (33:4) {#if activeItem === 'Display'}
    function create_if_block$2(ctx) {
    	let display;
    	let updating_expens;
    	let current;

    	function display_expens_binding(value) {
    		/*display_expens_binding*/ ctx[5].call(null, value);
    	}

    	let display_props = {};

    	if (/*expens*/ ctx[1] !== void 0) {
    		display_props.expens = /*expens*/ ctx[1];
    	}

    	display = new Display({ props: display_props, $$inline: true });
    	binding_callbacks.push(() => bind(display, "expens", display_expens_binding));

    	const block = {
    		c: function create() {
    			create_component(display.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(display, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const display_changes = {};

    			if (!updating_expens && dirty & /*expens*/ 2) {
    				updating_expens = true;
    				display_changes.expens = /*expens*/ ctx[1];
    				add_flush_callback(() => updating_expens = false);
    			}

    			display.$set(display_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(display.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(display.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(display, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$2.name,
    		type: "if",
    		source: "(33:4) {#if activeItem === 'Display'}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$5(ctx) {
    	let main;
    	let tabs;
    	let t0;
    	let current_block_type_index;
    	let if_block;
    	let t1;
    	let footer;
    	let current;

    	tabs = new Tab({
    			props: {
    				activeItem: /*activeItem*/ ctx[0],
    				items: /*items*/ ctx[2]
    			},
    			$$inline: true
    		});

    	tabs.$on("tabChange", /*tabChange*/ ctx[3]);
    	const if_block_creators = [create_if_block$2, create_if_block_1];
    	const if_blocks = [];

    	function select_block_type(ctx, dirty) {
    		if (/*activeItem*/ ctx[0] === "Display") return 0;
    		if (/*activeItem*/ ctx[0] === "Add") return 1;
    		return -1;
    	}

    	if (~(current_block_type_index = select_block_type(ctx))) {
    		if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);
    	}

    	footer = new Footer({ $$inline: true });

    	const block = {
    		c: function create() {
    			main = element("main");
    			create_component(tabs.$$.fragment);
    			t0 = space();
    			if (if_block) if_block.c();
    			t1 = space();
    			create_component(footer.$$.fragment);
    			attr_dev(main, "class", "svelte-16evd6r");
    			add_location(main, file$5, 29, 0, 736);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, main, anchor);
    			mount_component(tabs, main, null);
    			append_dev(main, t0);

    			if (~current_block_type_index) {
    				if_blocks[current_block_type_index].m(main, null);
    			}

    			insert_dev(target, t1, anchor);
    			mount_component(footer, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			const tabs_changes = {};
    			if (dirty & /*activeItem*/ 1) tabs_changes.activeItem = /*activeItem*/ ctx[0];
    			tabs.$set(tabs_changes);
    			let previous_block_index = current_block_type_index;
    			current_block_type_index = select_block_type(ctx);

    			if (current_block_type_index === previous_block_index) {
    				if (~current_block_type_index) {
    					if_blocks[current_block_type_index].p(ctx, dirty);
    				}
    			} else {
    				if (if_block) {
    					group_outros();

    					transition_out(if_blocks[previous_block_index], 1, 1, () => {
    						if_blocks[previous_block_index] = null;
    					});

    					check_outros();
    				}

    				if (~current_block_type_index) {
    					if_block = if_blocks[current_block_type_index];

    					if (!if_block) {
    						if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);
    						if_block.c();
    					}

    					transition_in(if_block, 1);
    					if_block.m(main, null);
    				} else {
    					if_block = null;
    				}
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(tabs.$$.fragment, local);
    			transition_in(if_block);
    			transition_in(footer.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(tabs.$$.fragment, local);
    			transition_out(if_block);
    			transition_out(footer.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(main);
    			destroy_component(tabs);

    			if (~current_block_type_index) {
    				if_blocks[current_block_type_index].d();
    			}

    			if (detaching) detach_dev(t1);
    			destroy_component(footer, detaching);
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
    	let items = ["Display", "Add"];
    	let activeItem = "Display";
    	const tabChange = e => $$invalidate(0, activeItem = e.detail);

    	let expens = [
    		{
    			id: "dsvswewfsaassdvefqffq",
    			title: "Kereta",
    			description: "Beli Kereta",
    			amount: 2000,
    			label: "personal",
    			complated: false
    		}
    	];

    	const handleAdd = e => {
    		const expen = e.detail;
    		$$invalidate(1, expens = [expen, ...expens]);
    		console.log(expens);
    	};

    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console_1$1.warn(`<Home> was created with unknown prop '${key}'`);
    	});

    	let { $$slots = {}, $$scope } = $$props;
    	validate_slots("Home", $$slots, []);

    	function display_expens_binding(value) {
    		expens = value;
    		$$invalidate(1, expens);
    	}

    	$$self.$capture_state = () => ({
    		Footer,
    		Tabs: Tab,
    		Add,
    		Display,
    		items,
    		activeItem,
    		tabChange,
    		expens,
    		handleAdd
    	});

    	$$self.$inject_state = $$props => {
    		if ("items" in $$props) $$invalidate(2, items = $$props.items);
    		if ("activeItem" in $$props) $$invalidate(0, activeItem = $$props.activeItem);
    		if ("expens" in $$props) $$invalidate(1, expens = $$props.expens);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [activeItem, expens, items, tabChange, handleAdd, display_expens_binding];
    }

    class Home extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$5, create_fragment$5, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Home",
    			options,
    			id: create_fragment$5.name
    		});
    	}
    }

    /* src\router\About.svelte generated by Svelte v3.24.1 */
    const file$6 = "src\\router\\About.svelte";

    function create_fragment$6(ctx) {
    	let body;
    	let div0;
    	let h1;
    	let t1;
    	let p0;
    	let t3;
    	let p1;
    	let t5;
    	let h20;
    	let t7;
    	let div4;
    	let div3;
    	let div2;
    	let div1;
    	let h21;
    	let t9;
    	let p2;
    	let t11;
    	let p3;
    	let t13;
    	let p4;
    	let t15;
    	let p5;
    	let button;
    	let t17;
    	let footer;
    	let current;
    	footer = new Footer({ $$inline: true });

    	const block = {
    		c: function create() {
    			body = element("body");
    			div0 = element("div");
    			h1 = element("h1");
    			h1.textContent = "About Us Page";
    			t1 = space();
    			p0 = element("p");
    			p0.textContent = "Some text about who we are and what we do.";
    			t3 = space();
    			p1 = element("p");
    			p1.textContent = "Resize the browser window to see that this page is responsive by the way.";
    			t5 = space();
    			h20 = element("h2");
    			h20.textContent = "Our Team";
    			t7 = space();
    			div4 = element("div");
    			div3 = element("div");
    			div2 = element("div");
    			div1 = element("div");
    			h21 = element("h2");
    			h21.textContent = "Zulhaimi";
    			t9 = space();
    			p2 = element("p");
    			p2.textContent = "Developer";
    			t11 = space();
    			p3 = element("p");
    			p3.textContent = "Some text that describes me lorem ipsum ipsum lorem.";
    			t13 = space();
    			p4 = element("p");
    			p4.textContent = "Zulhaimi@gmail.com";
    			t15 = space();
    			p5 = element("p");
    			button = element("button");
    			button.textContent = "Contact";
    			t17 = space();
    			create_component(footer.$$.fragment);
    			attr_dev(h1, "class", "svelte-y1q841");
    			add_location(h1, file$6, 75, 6, 1319);
    			attr_dev(p0, "class", "svelte-y1q841");
    			add_location(p0, file$6, 76, 6, 1349);
    			attr_dev(p1, "class", "svelte-y1q841");
    			add_location(p1, file$6, 77, 6, 1406);
    			attr_dev(div0, "class", "about-section svelte-y1q841");
    			add_location(div0, file$6, 74, 4, 1284);
    			set_style(h20, "text-align", "center");
    			attr_dev(h20, "class", "svelte-y1q841");
    			add_location(h20, file$6, 80, 4, 1510);
    			attr_dev(h21, "class", "svelte-y1q841");
    			add_location(h21, file$6, 86, 12, 1689);
    			attr_dev(p2, "class", "title svelte-y1q841");
    			add_location(p2, file$6, 87, 12, 1720);
    			attr_dev(p3, "class", "svelte-y1q841");
    			add_location(p3, file$6, 88, 12, 1764);
    			attr_dev(p4, "class", "svelte-y1q841");
    			add_location(p4, file$6, 89, 12, 1837);
    			attr_dev(button, "class", "button svelte-y1q841");
    			add_location(button, file$6, 90, 15, 1879);
    			attr_dev(p5, "class", "svelte-y1q841");
    			add_location(p5, file$6, 90, 12, 1876);
    			attr_dev(div1, "class", "container svelte-y1q841");
    			add_location(div1, file$6, 85, 10, 1652);
    			attr_dev(div2, "class", "card svelte-y1q841");
    			add_location(div2, file$6, 84, 8, 1622);
    			attr_dev(div3, "class", "column svelte-y1q841");
    			add_location(div3, file$6, 83, 6, 1592);
    			attr_dev(div4, "class", "row svelte-y1q841");
    			add_location(div4, file$6, 81, 4, 1559);
    			attr_dev(body, "class", "svelte-y1q841");
    			add_location(body, file$6, 72, 4, 1266);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, body, anchor);
    			append_dev(body, div0);
    			append_dev(div0, h1);
    			append_dev(div0, t1);
    			append_dev(div0, p0);
    			append_dev(div0, t3);
    			append_dev(div0, p1);
    			append_dev(body, t5);
    			append_dev(body, h20);
    			append_dev(body, t7);
    			append_dev(body, div4);
    			append_dev(div4, div3);
    			append_dev(div3, div2);
    			append_dev(div2, div1);
    			append_dev(div1, h21);
    			append_dev(div1, t9);
    			append_dev(div1, p2);
    			append_dev(div1, t11);
    			append_dev(div1, p3);
    			append_dev(div1, t13);
    			append_dev(div1, p4);
    			append_dev(div1, t15);
    			append_dev(div1, p5);
    			append_dev(p5, button);
    			append_dev(body, t17);
    			mount_component(footer, body, null);
    			current = true;
    		},
    		p: noop,
    		i: function intro(local) {
    			if (current) return;
    			transition_in(footer.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(footer.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(body);
    			destroy_component(footer);
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
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<About> was created with unknown prop '${key}'`);
    	});

    	let { $$slots = {}, $$scope } = $$props;
    	validate_slots("About", $$slots, []);
    	$$self.$capture_state = () => ({ Footer });
    	return [];
    }

    class About extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$6, create_fragment$6, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "About",
    			options,
    			id: create_fragment$6.name
    		});
    	}
    }

    const subscriber_queue = [];
    /**
     * Create a `Writable` store that allows both updating and reading by subscription.
     * @param {*=}value initial value
     * @param {StartStopNotifier=}start start and stop notifications for subscriptions
     */
    function writable(value, start = noop) {
        let stop;
        const subscribers = [];
        function set(new_value) {
            if (safe_not_equal(value, new_value)) {
                value = new_value;
                if (stop) { // store is ready
                    const run_queue = !subscriber_queue.length;
                    for (let i = 0; i < subscribers.length; i += 1) {
                        const s = subscribers[i];
                        s[1]();
                        subscriber_queue.push(s, value);
                    }
                    if (run_queue) {
                        for (let i = 0; i < subscriber_queue.length; i += 2) {
                            subscriber_queue[i][0](subscriber_queue[i + 1]);
                        }
                        subscriber_queue.length = 0;
                    }
                }
            }
        }
        function update(fn) {
            set(fn(value));
        }
        function subscribe(run, invalidate = noop) {
            const subscriber = [run, invalidate];
            subscribers.push(subscriber);
            if (subscribers.length === 1) {
                stop = start(set) || noop;
            }
            run(value);
            return () => {
                const index = subscribers.indexOf(subscriber);
                if (index !== -1) {
                    subscribers.splice(index, 1);
                }
                if (subscribers.length === 0) {
                    stop();
                    stop = null;
                }
            };
        }
        return { set, update, subscribe };
    }

    const router = {
         '/': Home,
         '/home': Home,
         '/about': About,
    };
    const curRoute = writable('/');

    /* src\RouterLink.svelte generated by Svelte v3.24.1 */
    const file$7 = "src\\RouterLink.svelte";

    function create_fragment$7(ctx) {
    	let a;
    	let t_value = /*page*/ ctx[0].name + "";
    	let t;
    	let a_href_value;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			a = element("a");
    			t = text(t_value);
    			attr_dev(a, "href", a_href_value = /*page*/ ctx[0].path);
    			attr_dev(a, "class", "svelte-18jurij");
    			add_location(a, file$7, 29, 0, 581);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, a, anchor);
    			append_dev(a, t);

    			if (!mounted) {
    				dispose = listen_dev(a, "click", prevent_default(/*redirecTo*/ ctx[1]), false, true, false);
    				mounted = true;
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*page*/ 1 && t_value !== (t_value = /*page*/ ctx[0].name + "")) set_data_dev(t, t_value);

    			if (dirty & /*page*/ 1 && a_href_value !== (a_href_value = /*page*/ ctx[0].path)) {
    				attr_dev(a, "href", a_href_value);
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(a);
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
    	let { page = {
    		path: "/",
    		name: "Home",
    		path: "/about",
    		name: "About"
    	} } = $$props;

    	function redirecTo(event) {
    		curRoute.set(event.target.pathname);
    		window.history.pushState({ path: page.path }, "", window.location.origin + page.path);
    	}

    	const writable_props = ["page"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<RouterLink> was created with unknown prop '${key}'`);
    	});

    	let { $$slots = {}, $$scope } = $$props;
    	validate_slots("RouterLink", $$slots, []);

    	$$self.$$set = $$props => {
    		if ("page" in $$props) $$invalidate(0, page = $$props.page);
    	};

    	$$self.$capture_state = () => ({ curRoute, page, redirecTo });

    	$$self.$inject_state = $$props => {
    		if ("page" in $$props) $$invalidate(0, page = $$props.page);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [page, redirecTo];
    }

    class RouterLink extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$7, create_fragment$7, safe_not_equal, { page: 0 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "RouterLink",
    			options,
    			id: create_fragment$7.name
    		});
    	}

    	get page() {
    		throw new Error("<RouterLink>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set page(value) {
    		throw new Error("<RouterLink>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src\component\nav.svelte generated by Svelte v3.24.1 */
    const file$8 = "src\\component\\nav.svelte";

    function create_fragment$8(ctx) {
    	let body;
    	let div0;
    	let routerlink0;
    	let t0;
    	let routerlink1;
    	let t1;
    	let div1;
    	let switch_instance;
    	let current;

    	routerlink0 = new RouterLink({
    			props: { page: { path: "/", name: "Home" } },
    			$$inline: true
    		});

    	routerlink1 = new RouterLink({
    			props: { page: { path: "/about", name: "About" } },
    			$$inline: true
    		});

    	var switch_value = router[/*$curRoute*/ ctx[0]];

    	function switch_props(ctx) {
    		return { $$inline: true };
    	}

    	if (switch_value) {
    		switch_instance = new switch_value(switch_props());
    	}

    	const block = {
    		c: function create() {
    			body = element("body");
    			div0 = element("div");
    			create_component(routerlink0.$$.fragment);
    			t0 = space();
    			create_component(routerlink1.$$.fragment);
    			t1 = space();
    			div1 = element("div");
    			if (switch_instance) create_component(switch_instance.$$.fragment);
    			attr_dev(div0, "class", "topnav svelte-1oq1k3l");
    			add_location(div0, file$8, 21, 4, 357);
    			attr_dev(div1, "id", "pageContent");
    			add_location(div1, file$8, 26, 4, 519);
    			attr_dev(body, "class", "svelte-1oq1k3l");
    			add_location(body, file$8, 20, 0, 345);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, body, anchor);
    			append_dev(body, div0);
    			mount_component(routerlink0, div0, null);
    			append_dev(div0, t0);
    			mount_component(routerlink1, div0, null);
    			append_dev(body, t1);
    			append_dev(body, div1);

    			if (switch_instance) {
    				mount_component(switch_instance, div1, null);
    			}

    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			if (switch_value !== (switch_value = router[/*$curRoute*/ ctx[0]])) {
    				if (switch_instance) {
    					group_outros();
    					const old_component = switch_instance;

    					transition_out(old_component.$$.fragment, 1, 0, () => {
    						destroy_component(old_component, 1);
    					});

    					check_outros();
    				}

    				if (switch_value) {
    					switch_instance = new switch_value(switch_props());
    					create_component(switch_instance.$$.fragment);
    					transition_in(switch_instance.$$.fragment, 1);
    					mount_component(switch_instance, div1, null);
    				} else {
    					switch_instance = null;
    				}
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(routerlink0.$$.fragment, local);
    			transition_in(routerlink1.$$.fragment, local);
    			if (switch_instance) transition_in(switch_instance.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(routerlink0.$$.fragment, local);
    			transition_out(routerlink1.$$.fragment, local);
    			if (switch_instance) transition_out(switch_instance.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(body);
    			destroy_component(routerlink0);
    			destroy_component(routerlink1);
    			if (switch_instance) destroy_component(switch_instance);
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
    	let $curRoute;
    	validate_store(curRoute, "curRoute");
    	component_subscribe($$self, curRoute, $$value => $$invalidate(0, $curRoute = $$value));
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Nav> was created with unknown prop '${key}'`);
    	});

    	let { $$slots = {}, $$scope } = $$props;
    	validate_slots("Nav", $$slots, []);

    	$$self.$capture_state = () => ({
    		router,
    		curRoute,
    		RouterLink,
    		onMount,
    		$curRoute
    	});

    	return [$curRoute];
    }

    class Nav extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$8, create_fragment$8, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Nav",
    			options,
    			id: create_fragment$8.name
    		});
    	}
    }

    /* src\App.svelte generated by Svelte v3.24.1 */
    const file$9 = "src\\App.svelte";

    function create_fragment$9(ctx) {
    	let div;
    	let nav;
    	let current;
    	nav = new Nav({ $$inline: true });

    	const block = {
    		c: function create() {
    			div = element("div");
    			create_component(nav.$$.fragment);
    			attr_dev(div, "class", "nav");
    			add_location(div, file$9, 4, 0, 64);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			mount_component(nav, div, null);
    			current = true;
    		},
    		p: noop,
    		i: function intro(local) {
    			if (current) return;
    			transition_in(nav.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(nav.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			destroy_component(nav);
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
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<App> was created with unknown prop '${key}'`);
    	});

    	let { $$slots = {}, $$scope } = $$props;
    	validate_slots("App", $$slots, []);
    	$$self.$capture_state = () => ({ Nav });
    	return [];
    }

    class App extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$9, create_fragment$9, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "App",
    			options,
    			id: create_fragment$9.name
    		});
    	}
    }

    const app = new App({
    	target: document.body,
    	props: {

    	}
    });

    return app;

}());
//# sourceMappingURL=bundle.js.map
