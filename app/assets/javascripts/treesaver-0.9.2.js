// Input 0
// Copyright 2006 The Closure Library Authors. All Rights Reserved.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//      http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS-IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

/**
 * @fileoverview Bootstrap for the Google JS Library (Closure).
 *
 * In uncompiled mode base.js will write out Closure's deps file, unless the
 * global <code>CLOSURE_NO_DEPS</code> is set to true.  This allows projects to
 * include their own deps file(s) from different locations.
 *
 */


/**
 * @define {boolean} Overridden to true by the compiler when --closure_pass
 *     or --mark_as_compiled is specified.
 */
var COMPILED = true;


/**
 * Base namespace for the Closure library.  Checks to see goog is
 * already defined in the current scope before assigning to prevent
 * clobbering if base.js is loaded more than once.
 *
 * @const
 */
var goog = goog || {};


/**
 * Reference to the global context.  In most cases this will be 'window'.
 */
goog.global = this;


/**
 * @define {boolean} DEBUG is provided as a convenience so that debugging code
 * that should not be included in a production js_binary can be easily stripped
 * by specifying --define goog.DEBUG=false to the JSCompiler. For example, most
 * toString() methods should be declared inside an "if (goog.DEBUG)" conditional
 * because they are generally used for debugging purposes and it is difficult
 * for the JSCompiler to statically determine whether they are used.
 */
goog.DEBUG = true;


/**
 * @define {string} LOCALE defines the locale being used for compilation. It is
 * used to select locale specific data to be compiled in js binary. BUILD rule
 * can specify this value by "--define goog.LOCALE=<locale_name>" as JSCompiler
 * option.
 *
 * Take into account that the locale code format is important. You should use
 * the canonical Unicode format with hyphen as a delimiter. Language must be
 * lowercase, Language Script - Capitalized, Region - UPPERCASE.
 * There are few examples: pt-BR, en, en-US, sr-Latin-BO, zh-Hans-CN.
 *
 * See more info about locale codes here:
 * http://www.unicode.org/reports/tr35/#Unicode_Language_and_Locale_Identifiers
 *
 * For language codes you should use values defined by ISO 693-1. See it here
 * http://www.w3.org/WAI/ER/IG/ert/iso639.htm. There is only one exception from
 * this rule: the Hebrew language. For legacy reasons the old code (iw) should
 * be used instead of the new code (he), see http://wiki/Main/IIISynonyms.
 */
goog.LOCALE = 'en';  // default to en


/**
 * Indicates whether or not we can call 'eval' directly to eval code in the
 * global scope. Set to a Boolean by the first call to goog.globalEval (which
 * empirically tests whether eval works for globals). @see goog.globalEval
 * @type {?boolean}
 * @private
 */
goog.evalWorksForGlobals_ = null;


/**
 * Creates object stubs for a namespace. When present in a file, goog.provide
 * also indicates that the file defines the indicated object. Calls to
 * goog.provide are resolved by the compiler if --closure_pass is set.
 * @param {string} name name of the object that this file defines.
 */
goog.provide = function(name) {
  if (!COMPILED) {
    // Ensure that the same namespace isn't provided twice. This is intended
    // to teach new developers that 'goog.provide' is effectively a variable
    // declaration. And when JSCompiler transforms goog.provide into a real
    // variable declaration, the compiled JS should work the same as the raw
    // JS--even when the raw JS uses goog.provide incorrectly.
    if (goog.getObjectByName(name) && !goog.implicitNamespaces_[name]) {
      throw Error('Namespace "' + name + '" already declared.');
    }

    var namespace = name;
    while ((namespace = namespace.substring(0, namespace.lastIndexOf('.')))) {
      goog.implicitNamespaces_[namespace] = true;
    }
  }

  goog.exportPath_(name);
};


/**
 * Marks that the current file should only be used for testing, and never for
 * live code in production.
 * @param {string=} opt_message Optional message to add to the error that's
 *     raised when used in production code.
 */
goog.setTestOnly = function(opt_message) {
  if (COMPILED && !goog.DEBUG) {
    opt_message = opt_message || '';
    throw Error('Importing test-only code into non-debug environment' +
                opt_message ? ': ' + opt_message : '.');
  }
};


if (!COMPILED) {
  /**
   * Namespaces implicitly defined by goog.provide. For example,
   * goog.provide('goog.events.Event') implicitly declares
   * that 'goog' and 'goog.events' must be namespaces.
   *
   * @type {Object}
   * @private
   */
  goog.implicitNamespaces_ = {};
}


/**
 * Builds an object structure for the provided namespace path,
 * ensuring that names that already exist are not overwritten. For
 * example:
 * "a.b.c" -> a = {};a.b={};a.b.c={};
 * Used by goog.provide and goog.exportSymbol.
 * @param {string} name name of the object that this file defines.
 * @param {*=} opt_object the object to expose at the end of the path.
 * @param {Object=} opt_objectToExportTo The object to add the path to; default
 *     is |goog.global|.
 * @private
 */
goog.exportPath_ = function(name, opt_object, opt_objectToExportTo) {
  var parts = name.split('.');
  var cur = opt_objectToExportTo || goog.global;

  // Internet Explorer exhibits strange behavior when throwing errors from
  // methods externed in this manner.  See the testExportSymbolExceptions in
  // base_test.html for an example.
  if (!(parts[0] in cur) && cur.execScript) {
    cur.execScript('var ' + parts[0]);
  }

  // Certain browsers cannot parse code in the form for((a in b); c;);
  // This pattern is produced by the JSCompiler when it collapses the
  // statement above into the conditional loop below. To prevent this from
  // happening, use a for-loop and reserve the init logic as below.

  // Parentheses added to eliminate strict JS warning in Firefox.
  for (var part; parts.length && (part = parts.shift());) {
    if (!parts.length && goog.isDef(opt_object)) {
      // last part and we have an object; use it
      cur[part] = opt_object;
    } else if (cur[part]) {
      cur = cur[part];
    } else {
      cur = cur[part] = {};
    }
  }
};


/**
 * Returns an object based on its fully qualified external name.  If you are
 * using a compilation pass that renames property names beware that using this
 * function will not find renamed properties.
 *
 * @param {string} name The fully qualified name.
 * @param {Object=} opt_obj The object within which to look; default is
 *     |goog.global|.
 * @return {Object} The object or, if not found, null.
 */
goog.getObjectByName = function(name, opt_obj) {
  var parts = name.split('.');
  var cur = opt_obj || goog.global;
  for (var part; part = parts.shift(); ) {
    if (goog.isDefAndNotNull(cur[part])) {
      cur = cur[part];
    } else {
      return null;
    }
  }
  return cur;
};


/**
 * Globalizes a whole namespace, such as goog or goog.lang.
 *
 * @param {Object} obj The namespace to globalize.
 * @param {Object=} opt_global The object to add the properties to.
 * @deprecated Properties may be explicitly exported to the global scope, but
 *     this should no longer be done in bulk.
 */
goog.globalize = function(obj, opt_global) {
  var global = opt_global || goog.global;
  for (var x in obj) {
    global[x] = obj[x];
  }
};


/**
 * Adds a dependency from a file to the files it requires.
 * @param {string} relPath The path to the js file.
 * @param {Array} provides An array of strings with the names of the objects
 *                         this file provides.
 * @param {Array} requires An array of strings with the names of the objects
 *                         this file requires.
 */
goog.addDependency = function(relPath, provides, requires) {
  if (!COMPILED) {
    var provide, require;
    var path = relPath.replace(/\\/g, '/');
    var deps = goog.dependencies_;
    for (var i = 0; provide = provides[i]; i++) {
      deps.nameToPath[provide] = path;
      if (!(path in deps.pathToNames)) {
        deps.pathToNames[path] = {};
      }
      deps.pathToNames[path][provide] = true;
    }
    for (var j = 0; require = requires[j]; j++) {
      if (!(path in deps.requires)) {
        deps.requires[path] = {};
      }
      deps.requires[path][require] = true;
    }
  }
};


/**
 * Implements a system for the dynamic resolution of dependencies
 * that works in parallel with the BUILD system. Note that all calls
 * to goog.require will be stripped by the JSCompiler when the
 * --closure_pass option is used.
 * @param {string} rule Rule to include, in the form goog.package.part.
 */
goog.require = function(rule) {

  // if the object already exists we do not need do do anything
  // TODO(user): If we start to support require based on file name this has
  //            to change
  // TODO(user): If we allow goog.foo.* this has to change
  // TODO(user): If we implement dynamic load after page load we should probably
  //            not remove this code for the compiled output
  if (!COMPILED) {
    if (goog.getObjectByName(rule)) {
      return;
    }
    var path = goog.getPathFromDeps_(rule);
    if (path) {
      goog.included_[path] = true;
      goog.writeScripts_();
    } else {
      var errorMessage = 'goog.require could not find: ' + rule;
      if (goog.global.console) {
        goog.global.console['error'](errorMessage);
      }

        throw Error(errorMessage);
    }
  }
};


/**
 * Path for included scripts
 * @type {string}
 */
goog.basePath = '';


/**
 * A hook for overriding the base path.
 * @type {string|undefined}
 */
goog.global.CLOSURE_BASE_PATH;


/**
 * Whether to write out Closure's deps file. By default,
 * the deps are written.
 * @type {boolean|undefined}
 */
goog.global.CLOSURE_NO_DEPS;


/**
 * A function to import a single script. This is meant to be overridden when
 * Closure is being run in non-HTML contexts, such as web workers. It's defined
 * in the global scope so that it can be set before base.js is loaded, which
 * allows deps.js to be imported properly.
 *
 * The function is passed the script source, which is a relative URI. It should
 * return true if the script was imported, false otherwise.
 */
goog.global.CLOSURE_IMPORT_SCRIPT;


/**
 * Null function used for default values of callbacks, etc.
 * @return {void} Nothing.
 */
goog.nullFunction = function() {};


/**
 * The identity function. Returns its first argument.
 *
 * @param {...*} var_args The arguments of the function.
 * @return {*} The first argument.
 * @deprecated Use goog.functions.identity instead.
 */
goog.identityFunction = function(var_args) {
  return arguments[0];
};


/**
 * When defining a class Foo with an abstract method bar(), you can do:
 *
 * Foo.prototype.bar = goog.abstractMethod
 *
 * Now if a subclass of Foo fails to override bar(), an error
 * will be thrown when bar() is invoked.
 *
 * Note: This does not take the name of the function to override as
 * an argument because that would make it more difficult to obfuscate
 * our JavaScript code.
 *
 * @type {!Function}
 * @throws {Error} when invoked to indicate the method should be
 *   overridden.
 */
goog.abstractMethod = function() {
  throw Error('unimplemented abstract method');
};


/**
 * Adds a {@code getInstance} static method that always return the same instance
 * object.
 * @param {!Function} ctor The constructor for the class to add the static
 *     method to.
 */
goog.addSingletonGetter = function(ctor) {
  ctor.getInstance = function() {
    return ctor.instance_ || (ctor.instance_ = new ctor());
  };
};


if (!COMPILED) {
  /**
   * Object used to keep track of urls that have already been added. This
   * record allows the prevention of circular dependencies.
   * @type {Object}
   * @private
   */
  goog.included_ = {};


  /**
   * This object is used to keep track of dependencies and other data that is
   * used for loading scripts
   * @private
   * @type {Object}
   */
  goog.dependencies_ = {
    pathToNames: {}, // 1 to many
    nameToPath: {}, // 1 to 1
    requires: {}, // 1 to many
    // used when resolving dependencies to prevent us from
    // visiting the file twice
    visited: {},
    written: {} // used to keep track of script files we have written
  };


  /**
   * Tries to detect whether is in the context of an HTML document.
   * @return {boolean} True if it looks like HTML document.
   * @private
   */
  goog.inHtmlDocument_ = function() {
    var doc = goog.global.document;
    return typeof doc != 'undefined' &&
           'write' in doc;  // XULDocument misses write.
  };


  /**
   * Tries to detect the base path of the base.js script that bootstraps Closure
   * @private
   */
  goog.findBasePath_ = function() {
    if (goog.global.CLOSURE_BASE_PATH) {
      goog.basePath = goog.global.CLOSURE_BASE_PATH;
      return;
    } else if (!goog.inHtmlDocument_()) {
      return;
    }
    var doc = goog.global.document;
    var scripts = doc.getElementsByTagName('script');
    // Search backwards since the current script is in almost all cases the one
    // that has base.js.
    for (var i = scripts.length - 1; i >= 0; --i) {
      var src = scripts[i].src;
      var qmark = src.lastIndexOf('?');
      var l = qmark == -1 ? src.length : qmark;
      if (src.substr(l - 7, 7) == 'base.js') {
        goog.basePath = src.substr(0, l - 7);
        return;
      }
    }
  };


  /**
   * Imports a script if, and only if, that script hasn't already been imported.
   * (Must be called at execution time)
   * @param {string} src Script source.
   * @private
   */
  goog.importScript_ = function(src) {
    var importScript = goog.global.CLOSURE_IMPORT_SCRIPT ||
        goog.writeScriptTag_;
    if (!goog.dependencies_.written[src] && importScript(src)) {
      goog.dependencies_.written[src] = true;
    }
  };


  /**
   * The default implementation of the import function. Writes a script tag to
   * import the script.
   *
   * @param {string} src The script source.
   * @return {boolean} True if the script was imported, false otherwise.
   * @private
   */
  goog.writeScriptTag_ = function(src) {
    if (goog.inHtmlDocument_()) {
      var doc = goog.global.document;
      doc.write(
          '<script type="text/javascript" src="' + src + '"></' + 'script>');
      return true;
    } else {
      return false;
    }
  };


  /**
   * Resolves dependencies based on the dependencies added using addDependency
   * and calls importScript_ in the correct order.
   * @private
   */
  goog.writeScripts_ = function() {
    // the scripts we need to write this time
    var scripts = [];
    var seenScript = {};
    var deps = goog.dependencies_;

    function visitNode(path) {
      if (path in deps.written) {
        return;
      }

      // we have already visited this one. We can get here if we have cyclic
      // dependencies
      if (path in deps.visited) {
        if (!(path in seenScript)) {
          seenScript[path] = true;
          scripts.push(path);
        }
        return;
      }

      deps.visited[path] = true;

      if (path in deps.requires) {
        for (var requireName in deps.requires[path]) {
          if (requireName in deps.nameToPath) {
            visitNode(deps.nameToPath[requireName]);
          } else if (!goog.getObjectByName(requireName)) {
            // If the required name is defined, we assume that this
            // dependency was bootstapped by other means. Otherwise,
            // throw an exception.
            throw Error('Undefined nameToPath for ' + requireName);
          }
        }
      }

      if (!(path in seenScript)) {
        seenScript[path] = true;
        scripts.push(path);
      }
    }

    for (var path in goog.included_) {
      if (!deps.written[path]) {
        visitNode(path);
      }
    }

    for (var i = 0; i < scripts.length; i++) {
      if (scripts[i]) {
        goog.importScript_(goog.basePath + scripts[i]);
      } else {
        throw Error('Undefined script input');
      }
    }
  };


  /**
   * Looks at the dependency rules and tries to determine the script file that
   * fulfills a particular rule.
   * @param {string} rule In the form goog.namespace.Class or project.script.
   * @return {?string} Url corresponding to the rule, or null.
   * @private
   */
  goog.getPathFromDeps_ = function(rule) {
    if (rule in goog.dependencies_.nameToPath) {
      return goog.dependencies_.nameToPath[rule];
    } else {
      return null;
    }
  };

  goog.findBasePath_();

  // Allow projects to manage the deps files themselves.
  if (!goog.global.CLOSURE_NO_DEPS) {
    goog.importScript_(goog.basePath + 'deps.js');
  }
}



//==============================================================================
// Language Enhancements
//==============================================================================


/**
 * This is a "fixed" version of the typeof operator.  It differs from the typeof
 * operator in such a way that null returns 'null' and arrays return 'array'.
 * @param {*} value The value to get the type of.
 * @return {string} The name of the type.
 */
goog.typeOf = function(value) {
  var s = typeof value;
  if (s == 'object') {
    if (value) {
      // Check these first, so we can avoid calling Object.prototype.toString if
      // possible.
      //
      // IE improperly marshals tyepof across execution contexts, but a
      // cross-context object will still return false for "instanceof Object".
      if (value instanceof Array) {
        return 'array';
      } else if (value instanceof Object) {
        return s;
      }

      // HACK: In order to use an Object prototype method on the arbitrary
      //   value, the compiler requires the value be cast to type Object,
      //   even though the ECMA spec explicitly allows it.
      var className = Object.prototype.toString.call(
          /** @type {Object} */ (value));
      // In Firefox 3.6, attempting to access iframe window objects' length
      // property throws an NS_ERROR_FAILURE, so we need to special-case it
      // here.
      if (className == '[object Window]') {
        return 'object';
      }

      // We cannot always use constructor == Array or instanceof Array because
      // different frames have different Array objects. In IE6, if the iframe
      // where the array was created is destroyed, the array loses its
      // prototype. Then dereferencing val.splice here throws an exception, so
      // we can't use goog.isFunction. Calling typeof directly returns 'unknown'
      // so that will work. In this case, this function will return false and
      // most array functions will still work because the array is still
      // array-like (supports length and []) even though it has lost its
      // prototype.
      // Mark Miller noticed that Object.prototype.toString
      // allows access to the unforgeable [[Class]] property.
      //  15.2.4.2 Object.prototype.toString ( )
      //  When the toString method is called, the following steps are taken:
      //      1. Get the [[Class]] property of this object.
      //      2. Compute a string value by concatenating the three strings
      //         "[object ", Result(1), and "]".
      //      3. Return Result(2).
      // and this behavior survives the destruction of the execution context.
      if ((className == '[object Array]' ||
           // In IE all non value types are wrapped as objects across window
           // boundaries (not iframe though) so we have to do object detection
           // for this edge case
           typeof value.length == 'number' &&
           typeof value.splice != 'undefined' &&
           typeof value.propertyIsEnumerable != 'undefined' &&
           !value.propertyIsEnumerable('splice')

          )) {
        return 'array';
      }
      // HACK: There is still an array case that fails.
      //     function ArrayImpostor() {}
      //     ArrayImpostor.prototype = [];
      //     var impostor = new ArrayImpostor;
      // this can be fixed by getting rid of the fast path
      // (value instanceof Array) and solely relying on
      // (value && Object.prototype.toString.vall(value) === '[object Array]')
      // but that would require many more function calls and is not warranted
      // unless closure code is receiving objects from untrusted sources.

      // IE in cross-window calls does not correctly marshal the function type
      // (it appears just as an object) so we cannot use just typeof val ==
      // 'function'. However, if the object has a call property, it is a
      // function.
      if ((className == '[object Function]' ||
          typeof value.call != 'undefined' &&
          typeof value.propertyIsEnumerable != 'undefined' &&
          !value.propertyIsEnumerable('call'))) {
        return 'function';
      }


    } else {
      return 'null';
    }

  } else if (s == 'function' && typeof value.call == 'undefined') {
    // In Safari typeof nodeList returns 'function', and on Firefox
    // typeof behaves similarly for HTML{Applet,Embed,Object}Elements
    // and RegExps.  We would like to return object for those and we can
    // detect an invalid function by making sure that the function
    // object has a call method.
    return 'object';
  }
  return s;
};


/**
 * Safe way to test whether a property is enumarable.  It allows testing
 * for enumerable on objects where 'propertyIsEnumerable' is overridden or
 * does not exist (like DOM nodes in IE). Does not use browser native
 * Object.propertyIsEnumerable.
 * @param {Object} object The object to test if the property is enumerable.
 * @param {string} propName The property name to check for.
 * @return {boolean} True if the property is enumarable.
 * @private
 */
goog.propertyIsEnumerableCustom_ = function(object, propName) {
  // KJS in Safari 2 is not ECMAScript compatible and lacks crucial methods
  // such as propertyIsEnumerable.  We therefore use a workaround.
  // Does anyone know a more efficient work around?
  if (propName in object) {
    for (var key in object) {
      if (key == propName &&
          Object.prototype.hasOwnProperty.call(object, propName)) {
        return true;
      }
    }
  }
  return false;
};


/**
 * Safe way to test whether a property is enumarable.  It allows testing
 * for enumerable on objects where 'propertyIsEnumerable' is overridden or
 * does not exist (like DOM nodes in IE).
 * @param {Object} object The object to test if the property is enumerable.
 * @param {string} propName The property name to check for.
 * @return {boolean} True if the property is enumarable.
 * @private
 */
goog.propertyIsEnumerable_ = function(object, propName) {
  // In IE if object is from another window, cannot use propertyIsEnumerable
  // from this window's Object. Will raise a 'JScript object expected' error.
  if (object instanceof Object) {
    return Object.prototype.propertyIsEnumerable.call(object, propName);
  } else {
    return goog.propertyIsEnumerableCustom_(object, propName);
  }
};


/**
 * Returns true if the specified value is not |undefined|.
 * WARNING: Do not use this to test if an object has a property. Use the in
 * operator instead.  Additionally, this function assumes that the global
 * undefined variable has not been redefined.
 * @param {*} val Variable to test.
 * @return {boolean} Whether variable is defined.
 */
goog.isDef = function(val) {
  return val !== undefined;
};


/**
 * Returns true if the specified value is |null|
 * @param {*} val Variable to test.
 * @return {boolean} Whether variable is null.
 */
goog.isNull = function(val) {
  return val === null;
};


/**
 * Returns true if the specified value is defined and not null
 * @param {*} val Variable to test.
 * @return {boolean} Whether variable is defined and not null.
 */
goog.isDefAndNotNull = function(val) {
  // Note that undefined == null.
  return val != null;
};


/**
 * Returns true if the specified value is an array
 * @param {*} val Variable to test.
 * @return {boolean} Whether variable is an array.
 */
goog.isArray = function(val) {
  return goog.typeOf(val) == 'array';
};


/**
 * Returns true if the object looks like an array. To qualify as array like
 * the value needs to be either a NodeList or an object with a Number length
 * property.
 * @param {*} val Variable to test.
 * @return {boolean} Whether variable is an array.
 */
goog.isArrayLike = function(val) {
  var type = goog.typeOf(val);
  return type == 'array' || type == 'object' && typeof val.length == 'number';
};


/**
 * Returns true if the object looks like a Date. To qualify as Date-like
 * the value needs to be an object and have a getFullYear() function.
 * @param {*} val Variable to test.
 * @return {boolean} Whether variable is a like a Date.
 */
goog.isDateLike = function(val) {
  return goog.isObject(val) && typeof val.getFullYear == 'function';
};


/**
 * Returns true if the specified value is a string
 * @param {*} val Variable to test.
 * @return {boolean} Whether variable is a string.
 */
goog.isString = function(val) {
  return typeof val == 'string';
};


/**
 * Returns true if the specified value is a boolean
 * @param {*} val Variable to test.
 * @return {boolean} Whether variable is boolean.
 */
goog.isBoolean = function(val) {
  return typeof val == 'boolean';
};


/**
 * Returns true if the specified value is a number
 * @param {*} val Variable to test.
 * @return {boolean} Whether variable is a number.
 */
goog.isNumber = function(val) {
  return typeof val == 'number';
};


/**
 * Returns true if the specified value is a function
 * @param {*} val Variable to test.
 * @return {boolean} Whether variable is a function.
 */
goog.isFunction = function(val) {
  return goog.typeOf(val) == 'function';
};


/**
 * Returns true if the specified value is an object.  This includes arrays
 * and functions.
 * @param {*} val Variable to test.
 * @return {boolean} Whether variable is an object.
 */
goog.isObject = function(val) {
  var type = goog.typeOf(val);
  return type == 'object' || type == 'array' || type == 'function';
};


/**
 * Gets a unique ID for an object. This mutates the object so that further
 * calls with the same object as a parameter returns the same value. The unique
 * ID is guaranteed to be unique across the current session amongst objects that
 * are passed into {@code getUid}. There is no guarantee that the ID is unique
 * or consistent across sessions. It is unsafe to generate unique ID for
 * function prototypes.
 *
 * @param {Object} obj The object to get the unique ID for.
 * @return {number} The unique ID for the object.
 */
goog.getUid = function(obj) {
  // TODO(user): Make the type stricter, do not accept null.

  // In Opera window.hasOwnProperty exists but always returns false so we avoid
  // using it. As a consequence the unique ID generated for BaseClass.prototype
  // and SubClass.prototype will be the same.
  return obj[goog.UID_PROPERTY_] ||
      (obj[goog.UID_PROPERTY_] = ++goog.uidCounter_);
};


/**
 * Removes the unique ID from an object. This is useful if the object was
 * previously mutated using {@code goog.getUid} in which case the mutation is
 * undone.
 * @param {Object} obj The object to remove the unique ID field from.
 */
goog.removeUid = function(obj) {
  // TODO(user): Make the type stricter, do not accept null.

  // DOM nodes in IE are not instance of Object and throws exception
  // for delete. Instead we try to use removeAttribute
  if ('removeAttribute' in obj) {
    obj.removeAttribute(goog.UID_PROPERTY_);
  }
  /** @preserveTry */
  try {
    delete obj[goog.UID_PROPERTY_];
  } catch (ex) {
  }
};


/**
 * Name for unique ID property. Initialized in a way to help avoid collisions
 * with other closure javascript on the same page.
 * @type {string}
 * @private
 */
goog.UID_PROPERTY_ = 'closure_uid_' +
    Math.floor(Math.random() * 2147483648).toString(36);


/**
 * Counter for UID.
 * @type {number}
 * @private
 */
goog.uidCounter_ = 0;


/**
 * Adds a hash code field to an object. The hash code is unique for the
 * given object.
 * @param {Object} obj The object to get the hash code for.
 * @return {number} The hash code for the object.
 * @deprecated Use goog.getUid instead.
 */
goog.getHashCode = goog.getUid;


/**
 * Removes the hash code field from an object.
 * @param {Object} obj The object to remove the field from.
 * @deprecated Use goog.removeUid instead.
 */
goog.removeHashCode = goog.removeUid;


/**
 * Clones a value. The input may be an Object, Array, or basic type. Objects and
 * arrays will be cloned recursively.
 *
 * WARNINGS:
 * <code>goog.cloneObject</code> does not detect reference loops. Objects that
 * refer to themselves will cause infinite recursion.
 *
 * <code>goog.cloneObject</code> is unaware of unique identifiers, and copies
 * UIDs created by <code>getUid</code> into cloned results.
 *
 * @param {*} obj The value to clone.
 * @return {*} A clone of the input value.
 * @deprecated goog.cloneObject is unsafe. Prefer the goog.object methods.
 */
goog.cloneObject = function(obj) {
  var type = goog.typeOf(obj);
  if (type == 'object' || type == 'array') {
    if (obj.clone) {
      return obj.clone();
    }
    var clone = type == 'array' ? [] : {};
    for (var key in obj) {
      clone[key] = goog.cloneObject(obj[key]);
    }
    return clone;
  }

  return obj;
};


/**
 * Forward declaration for the clone method. This is necessary until the
 * compiler can better support duck-typing constructs as used in
 * goog.cloneObject.
 *
 * TODO(user): Remove once the JSCompiler can infer that the check for
 * proto.clone is safe in goog.cloneObject.
 *
 * @type {Function}
 */
Object.prototype.clone;


/**
 * A native implementation of goog.bind.
 * @param {Function} fn A function to partially apply.
 * @param {Object|undefined} selfObj Specifies the object which |this| should
 *     point to when the function is run. If the value is null or undefined, it
 *     will default to the global object.
 * @param {...*} var_args Additional arguments that are partially
 *     applied to the function.
 * @return {!Function} A partially-applied form of the function bind() was
 *     invoked as a method of.
 * @private
 * @suppress {deprecated} The compiler thinks that Function.prototype.bind
 *     is deprecated because some people have declared a pure-JS version.
 *     Only the pure-JS version is truly deprecated.
 */
goog.bindNative_ = function(fn, selfObj, var_args) {
  return /** @type {!Function} */ (fn.call.apply(fn.bind, arguments));
};


/**
 * A pure-JS implementation of goog.bind.
 * @param {Function} fn A function to partially apply.
 * @param {Object|undefined} selfObj Specifies the object which |this| should
 *     point to when the function is run. If the value is null or undefined, it
 *     will default to the global object.
 * @param {...*} var_args Additional arguments that are partially
 *     applied to the function.
 * @return {!Function} A partially-applied form of the function bind() was
 *     invoked as a method of.
 * @private
 */
goog.bindJs_ = function(fn, selfObj, var_args) {
  var context = selfObj || goog.global;

  if (arguments.length > 2) {
    var boundArgs = Array.prototype.slice.call(arguments, 2);
    return function() {
      // Prepend the bound arguments to the current arguments.
      var newArgs = Array.prototype.slice.call(arguments);
      Array.prototype.unshift.apply(newArgs, boundArgs);
      return fn.apply(context, newArgs);
    };

  } else {
    return function() {
      return fn.apply(context, arguments);
    };
  }
};


/**
 * Partially applies this function to a particular 'this object' and zero or
 * more arguments. The result is a new function with some arguments of the first
 * function pre-filled and the value of |this| 'pre-specified'.<br><br>
 *
 * Remaining arguments specified at call-time are appended to the pre-
 * specified ones.<br><br>
 *
 * Also see: {@link #partial}.<br><br>
 *
 * Usage:
 * <pre>var barMethBound = bind(myFunction, myObj, 'arg1', 'arg2');
 * barMethBound('arg3', 'arg4');</pre>
 *
 * @param {Function} fn A function to partially apply.
 * @param {Object|undefined} selfObj Specifies the object which |this| should
 *     point to when the function is run. If the value is null or undefined, it
 *     will default to the global object.
 * @param {...*} var_args Additional arguments that are partially
 *     applied to the function.
 * @return {!Function} A partially-applied form of the function bind() was
 *     invoked as a method of.
 * @suppress {deprecated} See above.
 */
goog.bind = function(fn, selfObj, var_args) {
  // TODO(nicksantos): narrow the type signature.
  if (Function.prototype.bind &&
      // NOTE(nicksantos): Somebody pulled base.js into the default
      // Chrome extension environment. This means that for Chrome extensions,
      // they get the implementation of Function.prototype.bind that
      // calls goog.bind instead of the native one. Even worse, we don't want
      // to introduce a circular dependency between goog.bind and
      // Function.prototype.bind, so we have to hack this to make sure it
      // works correctly.
      Function.prototype.bind.toString().indexOf('native code') != -1) {
    goog.bind = goog.bindNative_;
  } else {
    goog.bind = goog.bindJs_;
  }
  return goog.bind.apply(null, arguments);
};


/**
 * Like bind(), except that a 'this object' is not required. Useful when the
 * target function is already bound.
 *
 * Usage:
 * var g = partial(f, arg1, arg2);
 * g(arg3, arg4);
 *
 * @param {Function} fn A function to partially apply.
 * @param {...*} var_args Additional arguments that are partially
 *     applied to fn.
 * @return {!Function} A partially-applied form of the function bind() was
 *     invoked as a method of.
 */
goog.partial = function(fn, var_args) {
  var args = Array.prototype.slice.call(arguments, 1);
  return function() {
    // Prepend the bound arguments to the current arguments.
    var newArgs = Array.prototype.slice.call(arguments);
    newArgs.unshift.apply(newArgs, args);
    return fn.apply(this, newArgs);
  };
};


/**
 * Copies all the members of a source object to a target object. This method
 * does not work on all browsers for all objects that contain keys such as
 * toString or hasOwnProperty. Use goog.object.extend for this purpose.
 * @param {Object} target Target.
 * @param {Object} source Source.
 */
goog.mixin = function(target, source) {
  for (var x in source) {
    target[x] = source[x];
  }

  // For IE7 or lower, the for-in-loop does not contain any properties that are
  // not enumerable on the prototype object (for example, isPrototypeOf from
  // Object.prototype) but also it will not include 'replace' on objects that
  // extend String and change 'replace' (not that it is common for anyone to
  // extend anything except Object).
};


/**
 * @return {number} An integer value representing the number of milliseconds
 *     between midnight, January 1, 1970 and the current time.
 */
goog.now = Date.now || (function() {
  // Unary plus operator converts its operand to a number which in the case of
  // a date is done by calling getTime().
  return +new Date();
});


/**
 * Evals javascript in the global scope.  In IE this uses execScript, other
 * browsers use goog.global.eval. If goog.global.eval does not evaluate in the
 * global scope (for example, in Safari), appends a script tag instead.
 * Throws an exception if neither execScript or eval is defined.
 * @param {string} script JavaScript string.
 */
goog.globalEval = function(script) {
  if (goog.global.execScript) {
    goog.global.execScript(script, 'JavaScript');
  } else if (goog.global.eval) {
    // Test to see if eval works
    if (goog.evalWorksForGlobals_ == null) {
      goog.global.eval('var _et_ = 1;');
      if (typeof goog.global['_et_'] != 'undefined') {
        delete goog.global['_et_'];
        goog.evalWorksForGlobals_ = true;
      } else {
        goog.evalWorksForGlobals_ = false;
      }
    }

    if (goog.evalWorksForGlobals_) {
      goog.global.eval(script);
    } else {
      var doc = goog.global.document;
      var scriptElt = doc.createElement('script');
      scriptElt.type = 'text/javascript';
      scriptElt.defer = false;
      // Note(user): can't use .innerHTML since "t('<test>')" will fail and
      // .text doesn't work in Safari 2.  Therefore we append a text node.
      scriptElt.appendChild(doc.createTextNode(script));
      doc.body.appendChild(scriptElt);
      doc.body.removeChild(scriptElt);
    }
  } else {
    throw Error('goog.globalEval not available');
  }
};


/**
 * Optional map of CSS class names to obfuscated names used with
 * goog.getCssName().
 * @type {Object|undefined}
 * @private
 * @see goog.setCssNameMapping
 */
goog.cssNameMapping_;


/**
 * Optional obfuscation style for CSS class names. Should be set to either
 * 'BY_WHOLE' or 'BY_PART' if defined.
 * @type {string|undefined}
 * @private
 * @see goog.setCssNameMapping
 */
goog.cssNameMappingStyle_;


/**
 * Handles strings that are intended to be used as CSS class names.
 *
 * This function works in tandem with @see goog.setCssNameMapping.
 *
 * Without any mapping set, the arguments are simple joined with a
 * hyphen and passed through unaltered.
 *
 * When there is a mapping, there are two possible styles in which
 * these mappings are used. In the BY_PART style, each part (i.e. in
 * between hyphens) of the passed in css name is rewritten according
 * to the map. In the BY_WHOLE style, the full css name is looked up in
 * the map directly. If a rewrite is not specified by the map, the
 * compiler will output a warning.
 *
 * When the mapping is passed to the compiler, it will replace calls
 * to goog.getCssName with the strings from the mapping, e.g.
 *     var x = goog.getCssName('foo');
 *     var y = goog.getCssName(this.baseClass, 'active');
 *  becomes:
 *     var x= 'foo';
 *     var y = this.baseClass + '-active';
 *
 * If one argument is passed it will be processed, if two are passed
 * only the modifier will be processed, as it is assumed the first
 * argument was generated as a result of calling goog.getCssName.
 *
 * @param {string} className The class name.
 * @param {string=} opt_modifier A modifier to be appended to the class name.
 * @return {string} The class name or the concatenation of the class name and
 *     the modifier.
 */
goog.getCssName = function(className, opt_modifier) {
  var getMapping = function(cssName) {
    return goog.cssNameMapping_[cssName] || cssName;
  };

  var renameByParts = function(cssName) {
    // Remap all the parts individually.
    var parts = cssName.split('-');
    var mapped = [];
    for (var i = 0; i < parts.length; i++) {
      mapped.push(getMapping(parts[i]));
    }
    return mapped.join('-');
  };

  var rename;
  if (goog.cssNameMapping_) {
    rename = goog.cssNameMappingStyle_ == 'BY_WHOLE' ?
        getMapping : renameByParts;
  } else {
    rename = function(a) {
      return a;
    };
  }

  if (opt_modifier) {
    return className + '-' + rename(opt_modifier);
  } else {
    return rename(className);
  }
};


/**
 * Sets the map to check when returning a value from goog.getCssName(). Example:
 * <pre>
 * goog.setCssNameMapping({
 *   "goog": "a",
 *   "disabled": "b",
 * });
 *
 * var x = goog.getCssName('goog');
 * // The following evaluates to: "a a-b".
 * goog.getCssName('goog') + ' ' + goog.getCssName(x, 'disabled')
 * </pre>
 * When declared as a map of string literals to string literals, the JSCompiler
 * will replace all calls to goog.getCssName() using the supplied map if the
 * --closure_pass flag is set.
 *
 * @param {!Object} mapping A map of strings to strings where keys are possible
 *     arguments to goog.getCssName() and values are the corresponding values
 *     that should be returned.
 * @param {string=} style The style of css name mapping. There are two valid
 *     options: 'BY_PART', and 'BY_WHOLE'.
 * @see goog.getCssName for a description.
 */
goog.setCssNameMapping = function(mapping, style) {
  goog.cssNameMapping_ = mapping;
  goog.cssNameMappingStyle_ = style;
};


/**
 * Abstract implementation of goog.getMsg for use with localized messages.
 * @param {string} str Translatable string, places holders in the form {$foo}.
 * @param {Object=} opt_values Map of place holder name to value.
 * @return {string} message with placeholders filled.
 */
goog.getMsg = function(str, opt_values) {
  var values = opt_values || {};
  for (var key in values) {
    var value = ('' + values[key]).replace(/\$/g, '$$$$');
    str = str.replace(new RegExp('\\{\\$' + key + '\\}', 'gi'), value);
  }
  return str;
};


/**
 * Exposes an unobfuscated global namespace path for the given object.
 * Note that fields of the exported object *will* be obfuscated,
 * unless they are exported in turn via this function or
 * goog.exportProperty
 *
 * <p>Also handy for making public items that are defined in anonymous
 * closures.
 *
 * ex. goog.exportSymbol('Foo', Foo);
 *
 * ex. goog.exportSymbol('public.path.Foo.staticFunction',
 *                       Foo.staticFunction);
 *     public.path.Foo.staticFunction();
 *
 * ex. goog.exportSymbol('public.path.Foo.prototype.myMethod',
 *                       Foo.prototype.myMethod);
 *     new public.path.Foo().myMethod();
 *
 * @param {string} publicPath Unobfuscated name to export.
 * @param {*} object Object the name should point to.
 * @param {Object=} opt_objectToExportTo The object to add the path to; default
 *     is |goog.global|.
 */
goog.exportSymbol = function(publicPath, object, opt_objectToExportTo) {
  goog.exportPath_(publicPath, object, opt_objectToExportTo);
};


/**
 * Exports a property unobfuscated into the object's namespace.
 * ex. goog.exportProperty(Foo, 'staticFunction', Foo.staticFunction);
 * ex. goog.exportProperty(Foo.prototype, 'myMethod', Foo.prototype.myMethod);
 * @param {Object} object Object whose static property is being exported.
 * @param {string} publicName Unobfuscated name to export.
 * @param {*} symbol Object the name should point to.
 */
goog.exportProperty = function(object, publicName, symbol) {
  object[publicName] = symbol;
};


/**
 * Inherit the prototype methods from one constructor into another.
 *
 * Usage:
 * <pre>
 * function ParentClass(a, b) { }
 * ParentClass.prototype.foo = function(a) { }
 *
 * function ChildClass(a, b, c) {
 *   ParentClass.call(this, a, b);
 * }
 *
 * goog.inherits(ChildClass, ParentClass);
 *
 * var child = new ChildClass('a', 'b', 'see');
 * child.foo(); // works
 * </pre>
 *
 * In addition, a superclass' implementation of a method can be invoked
 * as follows:
 *
 * <pre>
 * ChildClass.prototype.foo = function(a) {
 *   ChildClass.superClass_.foo.call(this, a);
 *   // other code
 * };
 * </pre>
 *
 * @param {Function} childCtor Child class.
 * @param {Function} parentCtor Parent class.
 */
goog.inherits = function(childCtor, parentCtor) {
  /** @constructor */
  function tempCtor() {};
  tempCtor.prototype = parentCtor.prototype;
  childCtor.superClass_ = parentCtor.prototype;
  childCtor.prototype = new tempCtor();
  childCtor.prototype.constructor = childCtor;
};


/**
 * Call up to the superclass.
 *
 * If this is called from a constructor, then this calls the superclass
 * contructor with arguments 1-N.
 *
 * If this is called from a prototype method, then you must pass
 * the name of the method as the second argument to this function. If
 * you do not, you will get a runtime error. This calls the superclass'
 * method with arguments 2-N.
 *
 * This function only works if you use goog.inherits to express
 * inheritance relationships between your classes.
 *
 * This function is a compiler primitive. At compile-time, the
 * compiler will do macro expansion to remove a lot of
 * the extra overhead that this function introduces. The compiler
 * will also enforce a lot of the assumptions that this function
 * makes, and treat it as a compiler error if you break them.
 *
 * @param {!Object} me Should always be "this".
 * @param {*=} opt_methodName The method name if calling a super method.
 * @param {...*} var_args The rest of the arguments.
 * @return {*} The return value of the superclass method.
 */
goog.base = function(me, opt_methodName, var_args) {
  var caller = arguments.callee.caller;
  if (caller.superClass_) {
    // This is a constructor. Call the superclass constructor.
    return caller.superClass_.constructor.apply(
        me, Array.prototype.slice.call(arguments, 1));
  }

  var args = Array.prototype.slice.call(arguments, 2);
  var foundCaller = false;
  for (var ctor = me.constructor;
       ctor; ctor = ctor.superClass_ && ctor.superClass_.constructor) {
    if (ctor.prototype[opt_methodName] === caller) {
      foundCaller = true;
    } else if (foundCaller) {
      return ctor.prototype[opt_methodName].apply(me, args);
    }
  }

  // If we did not find the caller in the prototype chain,
  // then one of two things happened:
  // 1) The caller is an instance method.
  // 2) This method was not called by the right caller.
  if (me[opt_methodName] === caller) {
    return me.constructor.prototype[opt_methodName].apply(me, args);
  } else {
    throw Error(
        'goog.base called from a method of one name ' +
        'to a method of a different name');
  }
};


/**
 * Allow for aliasing within scope functions.  This function exists for
 * uncompiled code - in compiled code the calls will be inlined and the
 * aliases applied.  In uncompiled code the function is simply run since the
 * aliases as written are valid JavaScript.
 * @param {function()} fn Function to call.  This function can contain aliases
 *     to namespaces (e.g. "var dom = goog.dom") or classes
 *    (e.g. "var Timer = goog.Timer").
 */
goog.scope = function(fn) {
  fn.call(goog.global);
};



// Input 1
/**
 * @fileoverview Basic task scheduling.
 *
 */

goog.provide('treesaver.scheduler');

// Avoid circular dependency
//goog.require('treesaver.debug');

/**
 * Milliseconds between checks for task execution
 *
 * @const
 * @type {number}
 */
treesaver.scheduler.TASK_INTERVAL = 25; // 40 per second

/**
 * Array of all tasks
 *
 * @private
 * @type {Array}
 */
treesaver.scheduler.tasks_ = [];

/**
 * Map of named tasks
 *
 * @private
 * @type {Object}
 */
treesaver.scheduler.namedTasks_ = {};

/**
 * If set, suspends all tasks except the ones named in this array
 *
 * @private
 * @type {Array.<string>}
 */
treesaver.scheduler.taskWhitelist_ = null;

/**
 * ID of the scheduler tick task
 *
 * @private
 */
treesaver.scheduler.tickID_;

/**
 * Master callback for task execution
 * @private
 */
treesaver.scheduler.tick_ = function() {
  var now = goog.now();

  treesaver.scheduler.tasks_.forEach(function(task, i) {
    // If the tick function is no longer on interval, prevent all task
    // execution
    if (!treesaver.scheduler.tickID_) {
      return;
    }

    // Was the task removed? If so, skip execution
    if (task.removed) {
      return;
    }

    // Is the whitelist active?
    if (treesaver.scheduler.taskWhitelist_) {
      if (!task.name ||
        treesaver.scheduler.taskWhitelist_.indexOf(task.name) === -1) {
        // Task is not on whitelist, go to next
        return;
      }
    }

    // Is it time to run the task yet?
    if ((now - task.last) <= task.interval) {
      return;
    }

    task.last = now;
    task.times -= 1;

    if (task.times <= 0) {
      // Immediate functions stay on the queue one extra time, meaning
      // they only get removed when their times count is -1
      if (!task.immediate || task.times < 0) {
        // Remove from registries
        treesaver.array.remove(treesaver.scheduler.tasks_, i);
        delete treesaver.scheduler.namedTasks_[task.name];

        // Exit early in order to make sure we don't execute an extra time
        if (task.immediate) {
          return;
        }
      }
    }

    task.fun.apply(task.obj, task.args);
  });

  // Don't waste cycles if there's nothing in the queue
  if (!treesaver.scheduler.tasks_.length) {
    treesaver.scheduler.stopAll();
  }
};

/**
 * Helper function for adding tasks to the execution queue
 *
 * @private
 * @param {!function()} fun
 * @param {!number}     interval
 * @param {number=}     times
 * @param {Array=}      args
 * @param {boolean=}    immediate
 * @param {string=}     name
 * @param {Object=}     obj
 */
treesaver.scheduler.addTask_ =
  function(fun, interval, times, args, immediate, name, obj) {
  var now = goog.now(),
      // Re-use previous task if it exists
      task = name ? treesaver.scheduler.namedTasks_[name] : null;

  if (goog.DEBUG) {
    if (!fun.apply) {
      treesaver.debug.error('Function without apply() not added to the scheduler');
      return;
    }
  }

  if (!task) {
    // Create a new task object
    task = {
      fun: fun,
      name: name,
      obj: obj,
      last: immediate ? -Infinity : now
    };

    // Store
    treesaver.scheduler.tasks_.push(task);
    if (name) {
      treesaver.scheduler.namedTasks_[name] = task;
    }
  }

  task.args = args || [];
  task.times = times;
  task.interval = Math.max(interval, treesaver.scheduler.TASK_INTERVAL);
  task.immediate = immediate;
  task.removed = false;

  // Restart the tick callback if it's not active
  if (!treesaver.scheduler.tickID_) {
    treesaver.scheduler.tickID_ = window.setInterval(
      treesaver.scheduler.tick_,
      treesaver.scheduler.TASK_INTERVAL
    );
  }
};

/**
 * Run a function once after a delay
 *
 * @param {!function()} fun
 * @param {!number}     delay
 * @param {Array=}      args
 * @param {string=}     name
 * @param {Object=}     obj
 */
treesaver.scheduler.delay = function(fun, delay, args, name, obj) {
  treesaver.scheduler.addTask_(fun, delay, 1, args, false, name, obj);
};

/**
 * Run a function on a repeating interval
 * @param {!function()} fun
 * @param {!number}     interval
 * @param {number=}     times
 * @param {Array=}      args
 * @param {string=}     name
 * @param {Object=}     obj
 */
treesaver.scheduler.repeat = function(fun, interval, times, args, name, obj) {
  treesaver.scheduler.addTask_(fun, interval, times, args, false, name, obj);
};

/**
 * Add a function to the execution queue
 * @param {!function()} fun
 * @param {Array=}      args
 * @param {string=}     name
 * @param {Object=}     obj
 */
treesaver.scheduler.queue = function(fun, args, name, obj) {
  treesaver.scheduler.addTask_(fun, 0, 1, args, false, name, obj);
};

/**
 * Debounce a function call, coalescing frequent function calls into one
 *
 * @param {!function()} fun
 * @param {!number}     interval
 * @param {Array=}      args
 * @param {boolean=}    immediate
 * @param {string=}     name
 * @param {Object=}     obj
 */
treesaver.scheduler.debounce =
  function(fun, interval, args, immediate, name, obj) {
  // Check if the task already exists
  var task = treesaver.scheduler.namedTasks_[name];

  if (task) {
    // Update timestamp to further delay execution
    task.last = goog.now();
  }
  else {
    treesaver.scheduler.addTask_(fun, interval, 1, args, immediate, name, obj);
  }
};

/**
 * Limit the frequency of calls to the a given task
 *
 * @param {!function()} fun
 * @param {!number}     interval
 * @param {Array=}      args
 * @param {string=}     name
 * @param {Object=}     obj
 */
treesaver.scheduler.limit = function(fun, interval, args, name, obj) {
  // Check if the task already exists
  var task = treesaver.scheduler.namedTasks_[name];

  // Ignore if already in the queue
  if (!task) {
    treesaver.scheduler.addTask_(fun, interval, 1, args, true, name, obj);
  }
};

/**
 * Pause all tasks except those named in the whitelist
 *
 * @param {Array.<string>} whitelist Names of tasks that can still execute.
 * @param {?number} timeout Timeout before auto-resume.
 */
treesaver.scheduler.pause = function(whitelist, timeout) {
  treesaver.scheduler.taskWhitelist_ = whitelist;
  if (timeout) {
    treesaver.scheduler.pauseTimeoutId_ =
      setTimeout(treesaver.scheduler.resume, timeout);
  }
};

/**
 * Resume task execution
 */
treesaver.scheduler.resume = function() {
  treesaver.scheduler.taskWhitelist_ = null;
  if (treesaver.scheduler.pauseTimeoutId_) {
    window.clearTimeout(treesaver.scheduler.pauseTimeoutId_);
    treesaver.scheduler.pauseTimeoutId_ = null;
  }
};

/**
 * Remove a task from the execution queue
 * @param {!string} name Task name.
 */
treesaver.scheduler.clear = function(name) {
  delete treesaver.scheduler.namedTasks_[name];

  treesaver.scheduler.tasks_.forEach(function(task, i) {
    if (task.name === name) {
      treesaver.array.remove(treesaver.scheduler.tasks_, i);
      // Mark task as inactive, in case there are any references left
      task.removed = true;
    }
  });
};

/**
 * Stop all functions from being executed, and clear out the queue
 */
treesaver.scheduler.stopAll = function() {
  // Stop task
  if (treesaver.scheduler.tickID_) {
    window.clearInterval(treesaver.scheduler.tickID_);
  }

  // Clear out any timeout
  treesaver.scheduler.resume();

  // Clear data stores
  treesaver.scheduler.tickID_ = null;
  treesaver.scheduler.tasks_ = [];
  treesaver.scheduler.namedTasks_ = {};
};

// Input 2
/**
 * @fileoverview Logging functions for use while debugging.
 */

goog.provide('treesaver.debug');

goog.require('treesaver.scheduler');

/**
 * Message queue for IOS debugging
 *
 * @type {Array.<string>}
 */
treesaver.debug.messageQueue_ = [];

if (goog.DEBUG && WITHIN_IOS_WRAPPER) {
  // Outputs items from the queue at a limited rate, because the logging
  // "API" used can't handle many messages at once (will merge into one)
  treesaver.scheduler.repeat(function() {
    var msg = treesaver.debug.messageQueue_.pop();

    if (msg) {
      msg = window.escape(msg);
      document.location = "ts://log/" + msg;
    }
  }, 50, Infinity);
}

/**
 * Original load time of debug code
 *
 * @const
 * @type {number}
 */
treesaver.debug.startupTime_ = goog.now();

/**
 * Creates a timestamp for a log entry
 *
 * @return {!string}
 */
treesaver.debug.timestamp_ = function() {
  return '[' + (goog.now() - treesaver.debug.startupTime_).toFixed(3) / 1000 + 's] ';
};

/**
 * Log a message
 * @param {!string} msg
 */
treesaver.debug.info = function(msg) {
  if (goog.DEBUG && window.console) {
    msg = treesaver.debug.timestamp_() + msg;

    if (window.TS_WITHIN_NATIVE_IOS_APP) {
      treesaver.debug.messageQueue_.push(msg);
    }
    else if ('info' in window.console) {
      window.console['info'](msg);
    }
    else {
      window.console.log(msg);
    }
  }
};

/**
 * Log a message
 * @param {!string} msg
 */
treesaver.debug.log = function(msg) {
  if (goog.DEBUG && window.console) {
    msg = treesaver.debug.timestamp_() + msg;

    if (window.TS_WITHIN_NATIVE_IOS_APP) {
      treesaver.debug.messageQueue_.push(msg);
    }
    else if ('debug' in window.console) {
      window.console['debug'](msg);
    }
    else {
      window.console.log(msg);
    }
  }
};

/**
 * Log a message
 * @param {!string} msg
 */
treesaver.debug.warn = function(msg) {
  if (goog.DEBUG && window.console) {
    msg = treesaver.debug.timestamp_() + msg;

    if (window.TS_WITHIN_NATIVE_IOS_APP) {
      treesaver.debug.messageQueue_.push(msg);
    }
    else if ('warn' in window.console) {
      window.console['warn'](msg);
    }
    else {
      window.console.log(msg);
    }
  }
};

/**
 * Log a message
 * @param {!string} msg
 */
treesaver.debug.error = function(msg) {
  if (goog.DEBUG && window.console) {
    msg = treesaver.debug.timestamp_() + msg;

    if (window.TS_WITHIN_NATIVE_IOS_APP) {
      treesaver.debug.messageQueue_.push(msg);
    }
    else if ('error' in window.console) {
      window.console['error'](msg);
    }
    else {
      window.console.log(msg);
    }
  }
};

treesaver.debug.info('Running in DEBUG mode');

// Input 3
/**
 * @fileoverview Definition of constants.
 */

goog.provide('treesaver.constants');

/**
 * Whether the code is loaded via modules or a single file
 *
 * @define {boolean}
 */
var USE_MODULES = false;

/**
 * Whether older browsers should be supported
 *
 * @define {boolean}
 */
var SUPPORT_LEGACY = true;

/**
 * Whether the microdata API should be supported
 *
 * @define {boolean}
 */
var SUPPORT_MICRODATA = true;

/**
 * Whether Internet Explorer should be supported
 *
 * @define {boolean}
 */
var SUPPORT_IE = true;

/**
 * How long until the UI is deemed idle
 *
 * @define {number}
 */
var UI_IDLE_INTERVAL = 5000; // 5 seconds

/**
 * How long to wait before kicking off repagination when resizing
 *
 * @define {number}
 */
var PAGINATE_DEBOUNCE_TIME = 200; // .2 seconds

/**
 * How many pixels of movement before it's considered a swipe
 *
 * @define {number}
 */
var SWIPE_THRESHOLD = 30;

/**
 * How much time can elapse before the swipe is ignored
 *
 * @define {number}
 */
var SWIPE_TIME_LIMIT = 2000; // 2 seconds

/**
 * Length of page animations
 *
 * @define {number}
 */
var MAX_ANIMATION_DURATION = 200; // .2 seconds

/**
 * How often to check for resizes and orientations
 *
 * @define {number}
 */
var CHECK_STATE_INTERVAL = 100; // .1 seconds

/**
 * How long to wait between mouse wheel events
 * Magic mouse can generate a ridiculous number of events
 *
 * @define {number}
 */
var MOUSE_WHEEL_INTERVAL = 1500; // 1.5 seconds

/**
 * Is the application being hosted within the iOS wrapper?
 *
 * @define {boolean}
 */
var WITHIN_IOS_WRAPPER = false;

// Input 4
/**
 * @fileoverview Helper functions for manipulating arrays.
 */

goog.provide('treesaver.array');

goog.require('treesaver.constants');

// IE doesn't support these
if (SUPPORT_IE) {
  // TODO: Move into legacy?
  if (!Array.prototype.forEach) {
    Array.prototype.forEach = function arrayForEach(fun /*, thisp*/) {
      var i = 0,
          len = this.length,
          thisp = arguments[1];

      for (; i < len; i += 1) {
        if (i in this) {
          fun.call(thisp, this[i], i, this);
        }
      }
    };
  }

  // Array functional helpers from MDC
  if (!Array.prototype.some) {
    Array.prototype.some = function arraySome(fun /*, thisp*/) {
      var i = 0,
          len = this.length,
          thisp = arguments[1];

      for (; i < len; i += 1) {
        if (i in this && fun.call(thisp, this[i], i, this)) {
          return true;
        }
      }

      return false;
    };
  }

  if (!Array.prototype.every) {
    Array.prototype.every = function arrayEvery(fun /*, thisp*/) {
      var i = 0,
          len = this.length,
          thisp = arguments[1];

      for (; i < len; i += 1) {
        if (i in this && !fun.call(thisp, this[i], i, this)) {
          return false;
        }
      }

      return true;
    };
  }

  if (!Array.prototype.map) {
    Array.prototype.map = function arrayMap(fun /*, thisp*/) {
      var i = 0,
          len = this.length,
          thisp = arguments[1],
          res = [];

      for (; i < len; i += 1) {
        if (i in this) {
          res[i] = fun.call(thisp, this[i], i, this);
        }
      }

      return res;
    };
  }

  if (!Array.prototype.filter) {
    Array.prototype.filter = function arrayFilter(fun /*, thisp*/) {
      var i = 0, val,
          len = this.length,
          thisp = arguments[1],
          res = [];

      for (; i < len; i += 1) {
        if (i in this) {
          val = this[i]; // In case fun mutates this
          if (fun.call(thisp, val, i, this)) {
            res.push(val);
          }
        }
      }

      return res;
    };
  }

  if (!Array.prototype.indexOf) {
    Array.prototype.indexOf = function(obj, start) {
      var i, len;
      for (i = (start || 0), len = this.length; i < len; i += 1) {
        if (this[i] === obj) {
          return i;
        }
      }
      return -1;
    };
  }
}

/**
 * Convert array-like things to an array
 *
 * @param {!Object} obj
 * @return {!Array}
 */
treesaver.array.toArray = function(obj) {
  return Array.prototype.slice.call(obj, 0);
};

/**
 * Remove an index from an array
 * By John Resig (MIT Licensed)
 *
 * @param {!number} from
 * @param {number=} to
 */
treesaver.array.remove = function(array, from, to) {
  var rest = array.slice((to || from) + 1 || array.length);
  array.length = from < 0 ? array.length + from : from;
  return array.push.apply(array, rest);
};

/**
 * Test Array-ness.
 *
 * @param {!Object} value Test if value is an array.
 * @return {!boolean} True if the given value is an array, false otherwise.
 */
treesaver.array.isArray = function(value) {
  return Object.prototype.toString.apply(value) === '[object Array]';
};

// IE doesn't let you call slice on a nodelist, so provide a backup
if (SUPPORT_IE && 'attachEvent' in document) {
  treesaver.array.toArray = function(obj) {
    var i, len, arr = [];
    for (i = 0, len = obj.length; i < len; i += 1) {
      arr.push(obj[i]);
    }
    return arr;
  };
}

// Input 5
/**
 * @fileoverview DOM helper functions.
 */

goog.provide('treesaver.dom');

goog.require('treesaver.array');
goog.require('treesaver.constants');
// Avoid circular dependency
//goog.require('treesaver.capabilities');

/**
 * Add a CSS class to an element
 * Hat Tip: Dean Edwards http://dean.edwards.name/IE7/caveats/
 *
 * @param {!Element} el
 * @param {!string} className
 */
treesaver.dom.addClass = function(el, className) {
  if (el.className) {
    if (!treesaver.dom.hasClass(el, className)) {
      el.className += ' ' + className;
    }
  }
  else {
    el.className = className;
  }

  if (SUPPORT_IE && treesaver.capabilities.IS_LEGACY) {
    // Set the className again for IE7.
    el.className = el.className;
  }
};

/**
 * Remove a CSS class to an element
 * Hat Tip: Dean Edwards http://dean.edwards.name/IE7/caveats/
 *
 * @param {!Element} el
 * @param {!string} className
 */
treesaver.dom.removeClass = function(el, className) {
  var regexp = new RegExp('(^|\\s)' + className + '(\\s|$)');
  el.className = el.className.replace(regexp, '$2');
};

/**
 * Check if an element has the given class
 * Hat Tip: Dean Edwards http://dean.edwards.name/IE7/caveats/
 *
 * @param {!Element|!HTMLDocument} el
 * @param {!string} className
 * @return {boolean} True if the element has that class.
 */
treesaver.dom.hasClass = function(el, className) {
  var regexp = new RegExp('(^|\\s)' + className + '(\\s|$)');
  return !!(el.className && regexp.test(el.className));
};

/**
 * @param {!Element} el
 * @param {boolean=} forceLowerCase
 * @return {!Array.<string>} Array of all the element's classes.
 */
treesaver.dom.classes = function(el, forceLowerCase) {
  if (!el.className) {
    return [];
  }

  var className = forceLowerCase ? el.className.toLowerCase() : el.className;

  return className.split(/\s+/);
};

/**
 * Query an element tree using a class name
 *
 * @param {!string} className
 * @param {HTMLDocument|Element=} root Element root (optional).
 * @return {!Array.<Element>} Array of matching elements.
 */
treesaver.dom.getElementsByClassName = function(className, root) {
  if (!root) {
    root = document;
  }

  var result = [];

  // Use native functions whenever possible
  if (!SUPPORT_LEGACY || 'querySelectorAll' in root) {
    // IE8 has QSA, but no getElementsByClassName
    result = treesaver.array.toArray(
      root.querySelectorAll('.' + className)
    );
  }
  else if (SUPPORT_LEGACY) {
    // Slow path for old browsers (IE7)
    // TODO: Use a faster/better implementation?
    var allElements = root.getElementsByTagName('*'),
        classPattern = new RegExp('(^|\\s)' + className + '(\\s|$)');

    treesaver.array.toArray(allElements).forEach(function(child) {
      if (classPattern.test(child.className)) {
        result.push(child);
      }
    });
  }

  return result;
};

/**
 * Query an element tree by tag name
 *
 * @param {!string} tagName
 * @param {HTMLDocument|Element=} root Element root (optional).
 * @return {!Array.<Element>} Array of matching elements.
 */
treesaver.dom.getElementsByTagName = function(tagName, root) {
  if (!root) {
    root = document;
  }

  return treesaver.array.toArray(root.getElementsByTagName(tagName));
};

/**
 * Query an element tree by query. This is a simplified version
 * of querySelectorAll.
 * @param {!string} selector A comma separated list of element names or
 * class names.
 * @param {HTMLDocument|Element=} root Element root (optional.)
 * @return {!Array.<Element>} Array of matching elements.
 */
treesaver.dom.getElementsByQuery = function (selector, root) {
  root = root || document;

  if (!SUPPORT_LEGACY || 'querySelectorAll' in root) {
    return treesaver.array.toArray(root.querySelectorAll(selector));
  } else {
    var result = [],
        elements = treesaver.dom.getElementsByTagName('*', root),
        selectors = selector.split(/,\s?/g);

    elements.forEach(function (el) {
      selectors.forEach(function (s) {
        if ((s.charAt(0) === '.' && treesaver.dom.hasClass(el, s.substr(1))) ||
              el.nodeName.toLowerCase() === s.toLowerCase()) {
          if (result.indexOf(el) === -1) {
            result.push(el);
          }
        }
      });
    });
    return result;
  }
};

/**
 * Query an element by property name and value
 *
 * In modern browsers, this wraps querySelectorAll
 *
 * @param {!string} propName Property name.
 * @param {?string=} value   Value contained (optional).
 * @param {?string=} tagName Tag name (optional).
 * @param {HTMLDocument|Element=} root    Element root (optional).
 */
treesaver.dom.getElementsByProperty = function(propName, value, tagName, root) {
  if (!root) {
    root = document;
  }

  tagName = tagName || '*';

  // Modern browsers do this quite well via querySelectorAll
  if (!SUPPORT_LEGACY || 'querySelectorAll' in root) {
    // Construct a selector via the arguments
    var selector = tagName + '[' + propName +
      // Note, this queries based on a space separated single value match
      (value ? '~="' + value + '"' : '') + ']';

    return treesaver.array.toArray(root.querySelectorAll(selector));
  }
  else {
    // Have to do the work manually
    var result = [],
        elements = treesaver.dom.getElementsByTagName(tagName, root),
        // Use a regexp to test if there is a value, otherwise mock out a test
        // function to always return true
        regexp = value ? new RegExp('(^|\\s)' + value.replace(/[.*+?\^${}()|\[\]\/\\]/g, '\\$&') + '(\\s|$)')
          : { test: function() { return true; } };

    propName = propName === 'class' ? 'className' : propName;

    // Cycle through each element and test
    // Note: This is pretty slow, but that's what you get for using an
    // old browser
    elements.forEach(function(el) {
      if (treesaver.dom.hasAttr(el, propName) &&
          regexp.test(el.getAttribute(propName))) {
        result.push(el);
      }
    });

    return result;
  }
};

/**
 * Whether the element has the given attribute. Proxy because IE doesn't
 * have the native method
 *
 * @param {!Element} el
 * @param {!string}  propName
 * @return {boolean}
 */
treesaver.dom.hasAttr = function(el, propName) {
  if (!SUPPORT_IE || 'hasAttribute' in el) {
    return el.hasAttribute(propName);
  }
  else {
    if (propName === 'className') {
      return el.className !== '';
    } else {
      return el.getAttribute(propName) !== null;
    }
  }
};

/**
 * The namespace prefix for custom elements
 *
 * @const
 * @type {string}
 */
treesaver.dom.customAttributePrefix = 'data-ts-';

/**
 * Whether the element has a custom Treesaver-namespaced attribute
 *
 * @param {!Element} el
 * @param {!string} propName Unescaped
 * @return {boolean}
 */
treesaver.dom.hasCustomAttr = function(el, propName) {
  return treesaver.dom.hasAttr(el, treesaver.dom.customAttributePrefix + propName);
};

/**
 * Whether the element has a custom Treesaver-namespaced attribute
 *
 * @param {!Element} el
 * @param {!string} propName Unescaped
 * @return {string}
 */
treesaver.dom.getCustomAttr = function(el, propName) {
  return el.getAttribute(treesaver.dom.customAttributePrefix + propName);
};

/**
 * Remove all children from an Element
 *
 * @param {!Element} el
 */
treesaver.dom.clearChildren = function(el) {
  // TODO: Blank innerHTML instead?
  while (el.firstChild) {
    el.removeChild(el.firstChild);
  }
};

/**
 * InnerText wrapper for browsers that don't have it
 *
 * @param {!Node} node
 * @return {!string} The text content of the node.
 */
treesaver.dom.innerText = function(node) {
  if (!SUPPORT_IE || 'textContent' in node) {
    return node.textContent;
  }
  else {
    // IE-only fallback
    return node.innerText;
  }
};

/**
 * OuterHTML wrapper for browsers that don't have it
 *
 * @param {!Element} el
 * @return {!string} The outer HTML of the element.
 */
treesaver.dom.outerHTML = function(el) {
  // IE, WebKit, and Opera all have outerHTML
  if ('outerHTML' in el) {
    return el.outerHTML;
  }

  // Damn you, Firefox!
  var clone = el.cloneNode(true),
      html;

  // Temporarily place the clone into an empty element
  // and extract its innerHTML
  treesaver.dom.dummyDiv_.appendChild(clone);
  html = treesaver.dom.dummyDiv_.innerHTML;
  treesaver.dom.dummyDiv_.removeChild(clone);

  return html;
};

/**
 * Make an element from HTML
 *
 * @param {!string} html
 * @return {?Element}
 */
treesaver.dom.createElementFromHTML = function(html) {
  // Container must be in tree to ensure proper HTML5 parsing by IE
  if (SUPPORT_IE) {
    document.body.appendChild(treesaver.dom.dummyDiv_);
  }

  treesaver.dom.dummyDiv_.innerHTML = html;
  // Only ever return the first child
  var node = treesaver.dom.dummyDiv_.firstChild;
  treesaver.dom.clearChildren(treesaver.dom.dummyDiv_);

  if (SUPPORT_IE) {
    document.body.removeChild(treesaver.dom.dummyDiv_);
  }

  // Make sure it's an actual Element
  if (!node || node.nodeType !== 1) {
    return null;
  }

  return /** @type {!Element} */ (node);
};

/**
 * Make a Node from HTML.
 *
 * @param {!string} html The string to parse.
 * @return {?Node} Returns the parsed representation of the
 * html as a DOM node.
 */
treesaver.dom.createDocumentFragmentFromHTML = function(html) {
  var node;

  // Container must be in tree to ensure proper HTML5 parsing by IE
  if (SUPPORT_IE) {
    document.body.appendChild(treesaver.dom.dummyDiv_);
  }

  treesaver.dom.dummyDiv_.innerHTML = html;

  if (treesaver.dom.dummyDiv_.childNodes.length === 1) {
    node = treesaver.dom.dummyDiv_.firstChild;
  } else {
    node = document.createDocumentFragment();
    while (treesaver.dom.dummyDiv_.firstChild) {
      node.appendChild(treesaver.dom.dummyDiv_.firstChild);
    }
  }
  treesaver.dom.clearChildren(treesaver.dom.dummyDiv_);

  if (SUPPORT_IE) {
    document.body.removeChild(treesaver.dom.dummyDiv_);
  }

  // Make sure it's an actual Node
  if (!node || !(node.nodeType === 1 || node.nodeType === 11)) {
    return null;
  }

  return /** @type {!Node} */ (node);
};

if ('Node' in window && Node.prototype && !Node.prototype.contains) {
  // Mozilla doesn't support contains() fix from PPK
  // http://www.quirksmode.org/blog/archives/2006/01/contains_for_mo.html
  Node.prototype.contains = function(arg) {
    return !!(this.compareDocumentPosition(arg) & 16);
  };
}

/**
 * Compares the document position of two elements.
 * MIT Licensed, John Resig: http://ejohn.org/blog/comparing-document-position/
 *
 * @param {!Element} a Element to compare with b.
 * @param {!Element} b Element to compare against a.
 */
treesaver.dom.compareDocumentPosition = function(a, b) {
  return a.compareDocumentPosition ?
    a.compareDocumentPosition(b) :
    a.contains ?
      (a != b && a.contains(b) && 16) +
      (a != b && b.contains(a) && 8) +
      (a.sourceIndex >= 0 && b.sourceIndex >= 0 ?
        (a.sourceIndex < b.sourceIndex && 4) +
        (a.sourceIndex > b.sourceIndex && 2) :
      1) +
    0 : 0;
};

/**
 * Find an appropriate element we can use as an insertion point for
 * new DOM elements
 *
 * @private
 * @type {!Element}
 */
treesaver.dom.safeInsertionPoint_ = /** @type {!Element} */
  (treesaver.dom.getElementsByTagName('base')[0] ||
  treesaver.dom.getElementsByTagName('script')[0]);

/**
 * Add an element into the tree in a safe manner. Hat tip Paul Irish:
 * http://paulirish.com/2011/surefire-dom-element-insertion/
 *
 * @param {!Element} el Element to insert into document
 */
treesaver.dom.safeAppendToDocument = function(el) {
  treesaver.dom.safeInsertionPoint_.parentNode
    .insertBefore(el, treesaver.dom.safeInsertionPoint_);
};

/**
 * Temporary element used for DOM operations
 *
 * @private
 * @type {!Element}
 */
treesaver.dom.dummyDiv_ = document.createElement('div');
// Prevent all layout on the element
treesaver.dom.dummyDiv_.style.display = 'none';

// Input 6
/**
 * @fileoverview Capability testing and tracking library.
 *
 */

goog.provide('treesaver.capabilities');

goog.require('treesaver.array'); // array.some
goog.require('treesaver.constants');
goog.require('treesaver.debug');
goog.require('treesaver.dom');
// Avoid circular dependency
// goog.require('treesaver.network');
// goog.require('treesaver.dimensions');

/**
 * Cached value of browser user agent
 *
 * @const
 * @private
 * @type {string}
 */
treesaver.capabilities.ua_ = window.navigator.userAgent.toLowerCase();

/**
 * Cached value of browser platform
 *
 * @const
 * @private
 * @type {string}
 */
treesaver.capabilities.platform_ =
  // Android 1.6 doesn't have a value for navigator.platform
  !SUPPORT_LEGACY || window.navigator.platform ?
  window.navigator.platform.toLowerCase() :
  /android/.test(treesaver.capabilities.ua_) ? 'android' : 'unknown';

/**
 * Is this an older browser that requires some patching for key functionality
 * like querySelectorAll
 *
 * @const
 * @type {boolean}
 */
treesaver.capabilities.IS_LEGACY = SUPPORT_LEGACY && !(
  // Storage
  'localStorage' in window &&
  'querySelectorAll' in document &&
  'JSON' in window
);

/**
 * Does the current browser meet the Treesaver requirements
 *
 * @const
 * @type {boolean}
 */
treesaver.capabilities.SUPPORTS_TREESAVER = !SUPPORT_LEGACY || (
  // Can't be in quirks mode (box model issues)
  document.compatMode !== 'BackCompat' &&
  // Need W3C AJAX (excludes IE6)
  'XMLHttpRequest' in window &&
  // W3C or IE Event model (should be everywhere)
  !!(document.addEventListener || document.attachEvent) &&
  // Runtime styles (needed for measuring, should be everywhere)
  !!(document.documentElement.currentStyle || window.getComputedStyle) &&
  // Require querySelectorAll in order to exclude Firefox 3.0,
  // but allow IE7 by checking for their non-W3C event model
  ('querySelectorAll' in document ||
    // Opera 9.64 passes as SUPPORT_LEGACY, does not have querySelectorAll,
    // and has both attachEvent and addEventListener. We exclude it here
    // by narrowing down the scope to browsers that do not have querySelectorAll,
    // do have attachEvent but do not have addEventListener. Hopefully that only
    // matches IE7.
    (SUPPORT_IE && 'attachEvent' in document && !('addEventListener' in document)))
);


/**
 * Is this browser IE8 running in IE7 compat mode?
 *
 * @const
 * @type {boolean}
 */
treesaver.capabilities.IS_IE8INIE7 = SUPPORT_IE &&
  'documentMode' in document && document.documentMode <= 7;

/**
 * Is the browser running on a mobile device?
 *
 * @const
 * @type {boolean}
 */
treesaver.capabilities.IS_MOBILE = WITHIN_IOS_WRAPPER ||
  treesaver.capabilities.BROWSER_OS === 'android' ||
  /mobile/.test(treesaver.capabilities.ua_);

/**
 * Does the device have a small screen?
 *
 * @const
 * @type {boolean}
 */
treesaver.capabilities.IS_SMALL_SCREEN =
  window.screen.width <= 600;

/**
 * Name of the current browser. Possible values:
 *   - msie
 *   - chrome
 *   - safari
 *   - webkit
 *   - mozilla
 *   - opera
 *   - unknown
 *
 * @const
 * @type {string}
 */
treesaver.capabilities.BROWSER_NAME = (function() {
  if (WITHIN_IOS_WRAPPER) {
    return 'safari';
  }

  // TODO: This code is all terrible
  // Luckily it runs only once
  if (/webkit/.test(treesaver.capabilities.ua_)) {
    if (/chrome|safari/.test(treesaver.capabilities.ua_)) {
      return /(chrome|safari)/.exec(treesaver.capabilities.ua_)[0];
    }
    else {
      return 'webkit';
    }
  }
  else if (/opera/.test(treesaver.capabilities.ua_)) {
    return 'opera';
  }
  else if (/msie/.test(treesaver.capabilities.ua_)) {
    return 'msie';
  }
  else if (!/compatible/.test(treesaver.capabilities.ua_) &&
    /mozilla/.test(treesaver.capabilities.ua_)) {
    return 'mozilla';
  }
  else {
    return 'unknown';
  }
}());

/**
 * Which OS is the browser running on, possible values:
 *   - win
 *   - mac
 *   - linux
 *   - iphone
 *   - ipad
 *   - ipod
 *   - android
 *   - unknown
 *
 * @const
 * @type {string}
 */
treesaver.capabilities.BROWSER_OS =
  (/(android|ipad|iphone|ipod|win|mac|linux)/.
  exec(treesaver.capabilities.platform_) || ['unknown'])[0];

/**
 * Browser engine prefix for non-standard CSS properties
 *
 * @const
 * @type {string}
 */
treesaver.capabilities.cssPrefix = (function() {
  switch (treesaver.capabilities.BROWSER_NAME) {
  case 'chrome':
  case 'safari':
  case 'webkit':
    return '-webkit-';
  case 'mozilla':
    return '-moz-'
  case 'msie':
    return '-ms-';
  case 'opera':
    return '-o-';
  default:
    return '';
  }
}());

/**
 * Browser engine prefix for non-standard CSS properties
 *
 * @const
 * @type {string}
 */
treesaver.capabilities.domCSSPrefix = (function() {
  switch (treesaver.capabilities.BROWSER_NAME) {
  case 'chrome':
  case 'safari':
  case 'webkit':
    return 'Webkit';
  case 'mozilla':
    return 'Moz'
  case 'msie':
    return 'ms';
  case 'opera':
    return 'O';
  default:
    return '';
  }
}());

/**
 * Helper function for testing CSS properties
 *
 * @private
 * @param {!string} propName
 * @param {boolean=} testPrefix
 * @param {boolean=} skipPrimary
 * @return {boolean}
 */
treesaver.capabilities.cssPropertySupported_ = function(propName, testPrefix, skipPrimary) {
  var styleObj = document.documentElement.style,
      prefixed = testPrefix && treesaver.capabilities.domCSSPrefix ?
        (treesaver.capabilities.domCSSPrefix + propName.charAt(0).toUpperCase() + propName.substr(1)) :
        false;

  return (!skipPrimary && typeof styleObj[propName] !== 'undefined') ||
         (!!prefixed && typeof styleObj[prefixed] !== 'undefined');
};

/**
 * Helper function for testing support of a CSS @media query
 * Hat tip to Modernizr for this code
 *
 * @private
 * @param {!string} queryName
 * @param {boolean=} testPrefix
 * @return {boolean}
 */
treesaver.capabilities.mediaQuerySupported_ = function(queryName, testPrefix) {
  var st = document.createElement('style'),
      div = document.createElement('div'),
      div_id = 'ts-test',
      mq = '@media (' + queryName + ')',
      result;

  if (testPrefix) {
    mq += ',(' + treesaver.capabilities.cssPrefix + queryName + ')';
  }

  st.textContent = mq + '{#' + div_id + ' {height:3px}}';
  div.setAttribute('id', div_id);
  treesaver.dom.safeAppendToDocument(st);
  treesaver.dom.safeAppendToDocument(div);

  // Confirm the style was applied
  result = div.offsetHeight === 3;

  st.parentNode.removeChild(st);
  div.parentNode.removeChild(div);

  return result;
};

/**
 * Whether the browser exposes orientation information
 *
 * @const
 * @type {boolean}
 */
treesaver.capabilities.SUPPORTS_ORIENTATION = WITHIN_IOS_WRAPPER ||
  'orientation' in window;

/**
 * Whether the browser supports touch events
 *
 * @const
 * @type {boolean}
 */
treesaver.capabilities.SUPPORTS_TOUCH = WITHIN_IOS_WRAPPER ||
  'createTouch' in document ||
  // Android doesn't expose createTouch, use quick hack
  /android/.test(treesaver.capabilities.ua_);

/**
 * Does the browser have flash support?
 *
 * @const
 * @type {boolean}
 */
treesaver.capabilities.SUPPORTS_FLASH = !WITHIN_IOS_WRAPPER && (function() {
  if (!!window.navigator.plugins && window.navigator.plugins.length) {
    // Non-IE browsers are pretty simple
    return !!window.navigator.plugins['Shockwave Flash'];
  }
  else if (SUPPORT_IE && 'ActiveXObject' in window) {
    treesaver.debug.warn('Using ActiveX detection for Flash');

    try {
      // Throws exception if not in registry
      return !!(new window.ActiveXObject('ShockwaveFlash.ShockwaveFlash.7'));
    }
    catch (e) {
      treesaver.debug.warn('ActiveX Flash detection failed with exception:' + e);

      // Instantiation failed
      return false;
    }
  }

  return false;
}());

/**
 * Does the browser support custom fonts via @font-face
 *
 * Note that this detection is fast, but imperfect. Gives a false positive
 * for a few fringe browsers.
 *
 * @const
 * @type {boolean}
 */
treesaver.capabilities.SUPPORTS_FONTFACE = (function() {
  if (SUPPORT_LEGACY && treesaver.capabilities.IS_LEGACY) {
    // Only legacy browser with @font-face support is IE7,
    // which we don't care enough about
    return false;
  }

  // Quick and easy test that works in FF2+, Safari, and Opera
  // Note: This gives a false positive for older versions of Chrome,
  // (version 3 and earlier). Market share is too low to care
  if ('CSSFontFaceRule' in window) {
    return true;
  }

  // IE fails in previous support even though it's suported EOT for a
  // long long time
  if (SUPPORT_IE && treesaver.capabilities.BROWSER_NAME === 'msie') {
    return true;
  }

  // No @font-face support
  return false;
}());

/**
 * Whether the browser has native support for the microdata API
 *
 * @const
 * @type {boolean}
 */
treesaver.capabilities.SUPPORTS_MICRODATA =
  'getItems' in document;

/**
 * Whether the browser supports <canvas>
 *
 * @const
 * @type {boolean}
 */
treesaver.capabilities.SUPPORTS_CANVAS =
  'getContext' in document.createElement('canvas');

/**
 * SVG detection based on Modernizr (http://www.modernizr.com)
 * Copyright (c) 2009-2011, Faruk Ates and Paul Irish
 * Dual-licensed under the BSD or MIT licenses.
 */
if ('createElementNS' in document) {
  /**
   * Whether the browser supports SVG
   *
   * @const
   * @type {boolean}
   */
  treesaver.capabilities.SUPPORTS_SVG = 'createSVGRect' in document.createElementNS('http://www.w3.org/2000/svg', 'svg');

  /**
   * Whether the browser supports SMIL
   *
   * @const
   * @type {boolean}
   */
  treesaver.capabilities.SUPPORTS_SMIL = /SVG/.test(document.createElementNS('http://www.w3.org/2000/svg', 'animate').toString());

  /**
   * Whether the browser supports SVG clip paths
   *
   * @const
   * @type {boolean}
   */
  treesaver.capabilities.SUPPORTS_SVGCLIPPATHS = /SVG/.test(document.createElementNS('http://www.w3.org/2000/svg', 'clipPath').toString());
} else {
  // Don't bother with SVG in IE7/8
  treesaver.capabilities.SUPPORTS_SVG = treesaver.capabilities.SUPPORTS_SMIL = treesaver.capabilities.SUPPORTS_SVGCLIPPATHS = false;
}

treesaver.capabilities.SUPPORTS_INLINESVG = (function() {
  var div = document.createElement('div');
  div.innerHTML = '<svg/>';
  return (div.firstChild && div.firstChild.namespaceURI) == 'http://www.w3.org/2000/svg';
}());

/**
 * Whether the browser can play <video>
 *
 * @const
 * @type {boolean}
 */
treesaver.capabilities.SUPPORTS_VIDEO =
  'canPlayType' in document.createElement('video');

/**
 * Whether the browser supports localStorage
 *
 * @const
 * @type {boolean}
 */
treesaver.capabilities.SUPPORTS_LOCALSTORAGE =
  'localStorage' in window &&
  // FF3 supports localStorage, but doesn't have native JSON
  !treesaver.capabilities.IS_LEGACY;

/**
 * Whether the browser supports offline web applications
 *
 * @const
 * @type {boolean}
 */
treesaver.capabilities.SUPPORTS_APPLICATIONCACHE =
  !WITHIN_IOS_WRAPPER && 'applicationCache' in window;

/**
 * Whether the browser supports CSS transforms
 *
 * @const
 * @type {boolean}
 */
treesaver.capabilities.SUPPORTS_CSSTRANSFORMS = WITHIN_IOS_WRAPPER ||
  treesaver.capabilities.cssPropertySupported_('transformProperty') ||
  // Browsers used WebkitTransform instead of WebkitTransformProperty
  treesaver.capabilities.cssPropertySupported_('transform', true, true);

/**
 * Whether the browser supports CSS 3d transforms
 *
 * @const
 * @type {boolean}
 */
treesaver.capabilities.SUPPORTS_CSSTRANSFORMS3D = WITHIN_IOS_WRAPPER ||
  (function() {
    var result = treesaver.capabilities.cssPropertySupported_('perspectiveProperty') ||
      treesaver.capabilities.cssPropertySupported_('perspective', true, true);

    // Chrome gives false positives for webkitPerspective
    // Hat tip to modernizr
    if (result && 'WebkitPerspective' in document.documentElement.style &&
      treesaver.capabilities.BROWSER_NAME !== 'safari') {
      // Confirm support via media query test
      result = treesaver.capabilities.mediaQuerySupported_('perspective', true);
    }

    return result;
  }());

/**
 * Whether the browser supports CSS transitions
 *
 * @const
 * @type {boolean}
 */
treesaver.capabilities.SUPPORTS_CSSTRANSITIONS = WITHIN_IOS_WRAPPER ||
  treesaver.capabilities.cssPropertySupported_('transitionProperty', true);

/**
 * Current browser capabilities
 *
 * @private
 * @type {Array.<string>}
 */
treesaver.capabilities.caps_;

/**
 * Mutable browser capabilities, such as online/offline, that may change
 * after a page is loaded
 *
 * @private
 * @type {Array.<string>}
 */
treesaver.capabilities.mutableCaps_;

/**
 * Return 'no-' if false
 *
 * @private
 * @param {!boolean} val
 * @return {!string} 'no-' if val is false, '' otherwise.
 */
treesaver.capabilities.doPrefix_ = function(val) {
  return val ? '' : 'no-';
};

/**
 * Test the browser's capabilities and populate the cached caps_ array
 *
 * @private
 */
treesaver.capabilities.update_ = function() {
  // Ugh, closure style makes this really gross, store function
  // for some reprieve
  var p = treesaver.capabilities.doPrefix_;

  if (!treesaver.capabilities.caps_) {
    // First run through, populate the static capabilities that never change
    treesaver.capabilities.caps_ = [];
    treesaver.capabilities.caps_.push(
      // Use the same class names as modernizr when applicable
      'js',
      p(treesaver.capabilities.SUPPORTS_CANVAS) + 'canvas',
      p(treesaver.capabilities.SUPPORTS_LOCALSTORAGE) + 'localstorage',
      p(treesaver.capabilities.SUPPORTS_VIDEO) + 'video',
      p(treesaver.capabilities.SUPPORTS_APPLICATIONCACHE) + 'applicationcache',
      p(treesaver.capabilities.SUPPORTS_FONTFACE) + 'fontface',
      p(treesaver.capabilities.SUPPORTS_TOUCH) + 'touch',
      p(treesaver.capabilities.SUPPORTS_CSSTRANSFORMS) + 'csstransforms',
      p(treesaver.capabilities.SUPPORTS_CSSTRANSFORMS3D) + 'csstransforms3d',
      p(treesaver.capabilities.SUPPORTS_CSSTRANSITIONS) + 'csstransitions',
      p(treesaver.capabilities.SUPPORTS_SVG) + 'svg',
      p(treesaver.capabilities.SUPPORTS_INLINESVG) + 'inlinesvg',
      p(treesaver.capabilities.SUPPORTS_SMIL) + 'smil',
      p(treesaver.capabilities.SUPPORTS_SVGCLIPPATHS) + 'svgclippaths',
      // Not in modernizr
      p(treesaver.capabilities.SUPPORTS_MICRODATA) + 'microdata',
      p(treesaver.capabilities.SUPPORTS_TREESAVER) + 'treesaver',
      p(treesaver.capabilities.SUPPORTS_FLASH) + 'flash',
      p(treesaver.capabilities.SUPPORTS_ORIENTATION) + 'orientation',
      p(treesaver.capabilities.IS_LEGACY) + 'legacy',
      p(treesaver.capabilities.IS_MOBILE) + 'mobile',
      p(treesaver.capabilities.IS_SMALL_SCREEN) + 'smallscreen',
      p(treesaver.network.loadedFromCache()) + 'cached',
      p(WITHIN_IOS_WRAPPER) + 'nativeapp',
      // Browser/platform info
      'browser-' + treesaver.capabilities.BROWSER_NAME,
      'os-' + treesaver.capabilities.BROWSER_OS
    );
  }

  // Always update mutable info
  treesaver.capabilities.mutableCaps_ = [
    // Online/offline
    p(!treesaver.network.isOnline()) + 'offline'
  ];

  if (treesaver.capabilities.SUPPORTS_ORIENTATION) {
    // Orientation
    treesaver.capabilities.mutableCaps_.push(
      'orientation-' + (window['orientation'] ? 'horizontal' : 'vertical')
    );
  }
};

/**
 * Have the stable capability flags been added to the <html> element?
 *
 * @private
 * @type {boolean}
 */
treesaver.capabilities.capsFlagged_ = false;

/**
 * Update the classes on the <html> element based on current capabilities
 */
treesaver.capabilities.updateClasses = function() {
  // Refresh stored capabilities
  treesaver.capabilities.update_();

  var className = document.documentElement.className;

  if (!treesaver.capabilities.capsFlagged_) {
    treesaver.capabilities.capsFlagged_ = true;

    if (className) {
      // First time through, remove no-js and no-treesaver flags, if present
      className = className.replace(/no-js|no-treesaver/g, '');
    }
    else {
      // Class was blank, give an initial value
      className = '';
    }

    // Add the non-mutable capabilities on the body
    className += ' ' + treesaver.capabilities.caps_.join(' ');

    treesaver.debug.info('Capability classes: ' + className);
  }

  // Now, remove values of mutable capabilities
  // TODO: As we get more of these, need a simpler way to filter out the old values
  className = className.replace(treesaver.capabilities.mutableCapabilityRegex_, '');

  className += ' ' + treesaver.capabilities.mutableCaps_.join(' ');

  // Now set the classes (and normalize whitespace)
  document.documentElement.className = className.split(/\s+/).join(' ');
};

/**
 * Reset the classes on the documentElement to a non-treesaver
 */
treesaver.capabilities.resetClasses = function() {
  document.documentElement.className = 'js no-treesaver';
};

/**
 * Array with all the mutable capability names
 *
 * @private
 * @type {!Array.<string>}
 */
treesaver.capabilities.mutableCapabilityList_ = [
  'offline',
  'orientation-vertical',
  'orientation-horizontal'
];

/**
 * Regex for removing mutable capabilities from a string
 *
 * @private
 * @type {!RegExp}
 */
treesaver.capabilities.mutableCapabilityRegex_ = (function() {
  var terms = treesaver.capabilities.mutableCapabilityList_.map(function(term) {
    return '((no-)?' + term + ')';
  });

  return new RegExp(terms.join('|'));
}());

/**
 * Check if a set of requirements are met by the current browser state
 *
 * @param {!Array.<string>} required Required capabilities.
 * @param {boolean=} useMutable Whether mutable capabilities should be
 *                                checked as well.
 * @return {boolean} True if requirements are met.
 */
treesaver.capabilities.check = function checkCapabilities(required, useMutable) {
  if (!required.length) {
    return true;
  }

  // Requirements are in the form of 'flash', 'offline', or 'no-orientation'
  return required.every(function(req) {
    var isNegation = req.substr(0, 3) === 'no-',
        rootReq = isNegation ? req.substr(3) : req,
        allCaps = treesaver.capabilities.caps_.concat(
          useMutable ? treesaver.capabilities.mutableCaps_ : []
        );

    if (isNegation) {
      // If it's negation, make sure the capability isn't in the capability list
      return allCaps.indexOf(rootReq) === -1;
    }
    else {
      if (allCaps.indexOf(rootReq) !== -1) {
        // Have the capability, all good
        return true;
      }

      // Requirement may be a mutable property, need to check
      if (!useMutable &&
          treesaver.capabilities.mutableCapabilityList_.indexOf(rootReq) !== -1) {
          // Requirement isn't met, but is mutable, let it pass for now
          return true;
      }

      return false;
    }
  });
};

// Input 7
/**
 * @fileoverview Create a stylesheet with the built-in styles required by Treesaver
 */

goog.provide('treesaver.styles');

goog.require('treesaver.capabilities');
goog.require('treesaver.constants');
goog.require('treesaver.debug');
goog.require('treesaver.dom');

/**
 * @param {!string} selector
 * @param {!string} text
 */
treesaver.styles.insertRule = function(selector, text) {
  if (!SUPPORT_IE || 'insertRule' in treesaver.styles.stylesheet_) {
    treesaver.styles.stylesheet_.insertRule(selector + '{' + text + '}', 0);
  }
  else {
    treesaver.styles.stylesheet_.addRule(selector, text);
  }
}

treesaver.styles.stylesheet_ = document.createElement('style');
treesaver.styles.stylesheet_.setAttribute('type', 'text/css');

if (treesaver.dom.getElementsByTagName('head').length) {
  treesaver.dom.getElementsByTagName('head')[0].appendChild(treesaver.styles.stylesheet_);
  treesaver.styles.stylesheet_ = document.styleSheets[document.styleSheets.length - 1];

  // Offscreen
  treesaver.styles.insertRule('.offscreen',
    'position:absolute;top:-200%;right:-200%;visibility:hidden;');
  // Grids & Scrollers
  treesaver.styles.insertRule('.grid', 'top:50%');
  if (treesaver.capabilities.SUPPORTS_CSSTRANSITIONS) {
    treesaver.styles.insertRule('.grid, .scroll-container',
      'transition:transform cubic-bezier(0,0,0.25,1) ' + MAX_ANIMATION_DURATION / 1000 + 's');
    if (treesaver.capabilities.cssPrefix) {
      treesaver.styles.insertRule('.grid, .scroll-container',
        treesaver.capabilities.cssPrefix + 'transition:' +
        treesaver.capabilities.cssPrefix + 'transform cubic-bezier(0,0,0.25,1) ' +
        MAX_ANIMATION_DURATION / 1000 + 's'
      );
    }
    if (treesaver.capabilities.SUPPORTS_CSSTRANSFORMS3D) {
      treesaver.styles.insertRule('.grid, .scroll-container',
          'backface-visibility:hidden');
      if (treesaver.capabilities.cssPrefix) {
        treesaver.styles.insertRule('.grid, .scroll-container',
          treesaver.capabilities.cssPrefix + 'backface-visibility:hidden');
      }
    }
  }
}
else {
  treesaver.debug.error("No head to put default stylesheet into");
}

// Input 8
/**
 * @fileoverview CSS helper functions
 */

goog.provide('treesaver.css');

/**
 * Return the computedStyle object, which varies based on
 * browsers
 * @param {?Element} el
 * @return {Object}
 */
treesaver.css.getStyleObject = function(el) {
  return document.defaultView.getComputedStyle(el, null);
};

// IE doesn't support getComputedStyle
if (SUPPORT_IE &&
    !(document.defaultView && document.defaultView.getComputedStyle)) {
  // Patch to use MSIE API
  treesaver.css.getStyleObject = function(el) {
    return el.currentStyle;
  };
}

// Input 9
/**
 * @fileoverview Helpers for measuring elements.
 */

goog.provide('treesaver.dimensions');

goog.require('treesaver.capabilities');
goog.require('treesaver.css');
goog.require('treesaver.constants');

/**
 * Alias for Size type
 *
 * @typedef {{ w: number, h: number }}
 */
treesaver.dimensions.Size;

/**
 * Alias for SizeRange type
 *
 * @typedef {{ w: number, h: number, maxW: number, maxH: number }}
 */
treesaver.dimensions.SizeRange;

/**
 * Regex to determine whether a value is a pixel value.
 * @private
 */
treesaver.dimensions.pixel = /^-?\d+(?:px)?$/i;


/**
 * Regex to determine whether a value contains a number.
 * @private
 */
treesaver.dimensions.number = /^-?\d/;

/**
 * Whether the given size fits within the bounds set by the range
 *
 * @param {treesaver.dimensions.SizeRange|treesaver.dimensions.Metrics} range
 * @param {treesaver.dimensions.Size} size
 * @return {boolean} True if both dimensions are within the min and max.
 */
treesaver.dimensions.inSizeRange = function(range, size) {
  if (!range) {
    return false;
  }

  // Use minW/minH for Metrics, w/h for a range
  // TODO: Make this consistent
  var w = (range.minW || range.minW === 0) ? range.minW : range.w,
      h = (range.minH || range.minH === 0) ? range.minH : range.h;

  return size.w >= w && size.h >= h &&
    size.w <= range.maxW && size.h <= range.maxH;
};

/**
 *
 * @param {treesaver.dimensions.SizeRange} a
 * @param {treesaver.dimensions.Metrics} b
 * @param {boolean} outer
 * @return {treesaver.dimensions.SizeRange}
 */
treesaver.dimensions.mergeSizeRange = function(a, b, outer) {
  a = a || {};
  b = b || {};

  var bpHeight = outer ? b.bpHeight || (b.outerH ? b.outerH - b.h : 0) : 0,
      bpWidth = outer ? b.bpWidth || (b.outerW ? b.outerW - b.w : 0) : 0;

  return {
    w: Math.max(a.w || 0, (b.w + bpWidth) || 0),
    h: Math.max(a.h || 0, (b.h + bpHeight) || 0),
    maxW: Math.min(a.maxW || Infinity, b.maxW + bpWidth || Infinity),
    maxH: Math.min(a.maxH || Infinity, b.maxH + bpHeight || Infinity)
  };
};

/**
 * Convert a string value to pixels
 *
 * @param {!Element} el
 * @param {?string} val
 * @return {?number} Value in pixels.
 */
treesaver.dimensions.toPixels = function(el, val) {
  if (val && treesaver.dimensions.pixel.test(val)) {
    return parseFloat(val) || 0;
  }
  return null;
};

/**
 * Return the width and height element in a simple object
 *
 * @param {Element} el
 * @return {!treesaver.dimensions.Size}
 */
treesaver.dimensions.getSize = function(el) {
  return {
    w: treesaver.dimensions.getOffsetWidth(el),
    h: treesaver.dimensions.getOffsetHeight(el)
  };
};

/**
 * Return the offsetHeight of the element.
 *
 * @param {?Element} el
 * @return {!number} Value in pixels.
 */
treesaver.dimensions.getOffsetHeight = function(el) {
  return el && el.offsetHeight || 0;
};

/**
 * Return the offsetWidth of the element.
 *
 * @param {?Element} el
 * @return {!number} Value in pixels.
 */
treesaver.dimensions.getOffsetWidth = function(el) {
  return el && el.offsetWidth || 0;
};

/**
 * Return the offsetTop of the element.
 *
 * @param {?Element} el
 * @return {!number} Value in pixels.
 */
treesaver.dimensions.getOffsetTop = function(el) {
  return el && el.offsetTop || 0;
}

/**
 * getBoundingClientRect wrapper for IE support
 *
 * @param {?Element} el
 * @return {!Object} boundingRect
 */
treesaver.dimensions.getBoundingClientRect = function(el) {
  if (!el) {
    return {};
  }

  var rect = el.getBoundingClientRect(),
      oldRect, key;

  // IE (and others?) don't include height/width in the rect, and
  // the object cannot be edited, so clone it here
  if (!('height' in rect)) {
    oldRect = rect;
    rect = {};
    for (key in oldRect) {
      rect[key] = oldRect[key];
    }
    rect.height = rect['bottom'] - rect['top'];
    rect.width  = rect['right'] - rect['left'];
  }

  return rect;
};

// IE doesn't support getComputedStyle
if (SUPPORT_IE &&
    !(document.defaultView && document.defaultView.getComputedStyle)) {
  if (treesaver.capabilities.IS_LEGACY) {
    treesaver.dimensions.getOffsetTop = function(el) {
      if (el) {
        el.style.zoom = 1;
        return el.offsetTop;
      }
      return 0;
    };

    treesaver.dimensions.getOffsetHeight = function(el) {
      if (el) {
        el.style.zoom = 1;
        return el.offsetHeight;
      }
      return 0;
    };

    treesaver.dimensions.getOffsetWidth = function(el) {
      if (el) {
        el.style.zoom = 1;
        return el.offsetWidth;
      }
      return 0;
    };
  }

  // If we are dealing with IE and the value contains some sort
  // of number we try Dean Edward's hack:
  // http://erik.eae.net/archives/2007/07/27/18.54.15/#comment-102291
  treesaver.dimensions.toPixels = function(el, val) {
    var style, runtimeStyle, value;

    if (val && treesaver.dimensions.pixel.test(val)) {
      return parseFloat(val);
    }
    else if (val && treesaver.dimensions.number.test(val)) {
      style = el.style.left;
      runtimeStyle = el.runtimeStyle.left;
      el.runtimeStyle.left = el.currentStyle.left;
      el.style.left = val || 0;
      value = el.style.pixelLeft;
      el.style.left = style;
      el.runtimeStyle.left = runtimeStyle;
      return value;
    }
    return null;
  };
}

/**
 * Helper for setting a CSS value in pixels
 *
 * @param {!Element} el
 * @param {!string} propName
 * @param {!number} val
 * @return {!number} The value supplied.
 */
treesaver.dimensions.setCssPx = function(el, propName, val) {
  el.style[propName] = val + 'px';

  return val;
};

/**
 * Helper for setting the offset on an element, using CSS transforms if
 * supported, absolute positioning if not
 *
 * @param {!Element} el
 * @param {!number} x
 * @param {!number} y
 */
treesaver.dimensions.setOffset;

/**
 * Helper for setting the x-offset on an element, using CSS transforms if
 * supported, absolute positioning if not
 *
 * @param {!Element} el
 * @param {!number} x
 */
treesaver.dimensions.setOffsetX;

if (treesaver.capabilities.SUPPORTS_CSSTRANSFORMS) {
  /**
   * Helper for setting the transform property on an element
   *
   * @param {!Element} el
   * @param {!string} val
   */
  treesaver.dimensions.setTransformProperty_ = function(el, val) {
    // TODO: Detect once
    if ('transformProperty' in el.style) {
      el.style['transformProperty'] = val;
    }
    else {
      el.style[treesaver.capabilities.domCSSPrefix + 'Transform'] = val;
    }
  };

  if (treesaver.capabilities.SUPPORTS_CSSTRANSFORMS3D) {
    treesaver.dimensions.setOffset = function(el, x, y) {
      treesaver.dimensions.setTransformProperty_(el,
        'translate3d(' + x + 'px,' + y + 'px,0)');
    };
  }
  else {
    treesaver.dimensions.setOffset = function(el, x, y) {
      treesaver.dimensions.setTransformProperty_(el,
        'translate(' + x + 'px,' + y + 'px)');
    };
  }

  // Take the easy way out of setting the x offset
  treesaver.dimensions.setOffsetX = function(el, x) {
    treesaver.dimensions.setOffset(el, x, 0);
  };
}
else {
  // Fall back to absolute positioning
  treesaver.dimensions.setOffset = function(el, x, y) {
    treesaver.dimensions.setCssPx(el, 'left', x);
    treesaver.dimensions.setCssPx(el, 'top', y);
  };

  // Take the easy way out of setting the x offset
  treesaver.dimensions.setOffsetX = function(el, x) {
    treesaver.dimensions.setCssPx(el, 'left', x);
  };
}

/**
 * Round up to the nearest multiple of the base number
 *
 * @param {!number} number
 * @param {!number} base
 * @return {number} A multiple of the base number.
 */
treesaver.dimensions.roundUp = function(number, base) {
  return Math.ceil(number) + base - (number % base);
};

/**
 * The style dimensions of an element including margin, border, and
 * padding as well as line height
 *
 * @constructor
 * @param {!Element=} el
 */
treesaver.dimensions.Metrics = function(el) {
  if (!el) {
    return;
  }

  var style = treesaver.css.getStyleObject(el),
      oldPosition = el.style.position,
      oldStyleAttribute = el.getAttribute('style'),
      tmp;

  this.display = style.display;
  this.position = style.position;

  // Webkit gives incorrect right margins for non-absolutely
  // positioned elements
  //if (this.position !== 'absolute') {
    //el.style.position = 'absolute';
  //}
  // Disable this for now, as it can give incorrect formatting
  // for elements in the flow
  // Also: Getting computed style is kinda silly if we change the
  // styling -- may affect the measurements anyway

  // Force hasLayout on IE7 so we get accurate measurements.
  if (SUPPORT_IE && treesaver.capabilities.IS_LEGACY) {
    el.style.zoom = 1;
  }

  // Margin
  this.marginTop = treesaver.dimensions.toPixels(el, style.marginTop) || 0;
  this.marginBottom = treesaver.dimensions.toPixels(el, style.marginBottom) || 0;
  this.marginLeft = treesaver.dimensions.toPixels(el, style.marginLeft) || 0;
  this.marginRight = treesaver.dimensions.toPixels(el, style.marginRight) || 0;
  // Summed totals
  this.marginHeight = this.marginTop + this.marginBottom;
  this.marginWidth = this.marginLeft + this.marginRight;

  // Border
  this.borderTop = treesaver.dimensions.toPixels(el, style.borderTopWidth);
  this.borderBottom = treesaver.dimensions.toPixels(el, style.borderBottomWidth);
  this.borderLeft = treesaver.dimensions.toPixels(el, style.borderLeftWidth);
  this.borderRight = treesaver.dimensions.toPixels(el, style.borderRightWidth);

  // Padding
  this.paddingTop = treesaver.dimensions.toPixels(el, style.paddingTop);
  this.paddingBottom = treesaver.dimensions.toPixels(el, style.paddingBottom);
  this.paddingLeft = treesaver.dimensions.toPixels(el, style.paddingLeft);
  this.paddingRight = treesaver.dimensions.toPixels(el, style.paddingRight);

  // Summed totals for border & padding
  this.bpTop = this.borderTop + this.paddingTop;
  this.bpBottom = this.borderBottom + this.paddingBottom;
  this.bpHeight = this.bpTop + this.bpBottom;
  this.bpLeft = this.borderLeft + this.paddingLeft;
  this.bpRight = this.borderRight + this.paddingRight;
  this.bpWidth = this.bpLeft + this.bpRight;

  // Outer Width & Height
  this.outerW = treesaver.dimensions.getOffsetWidth(el);
  this.outerH = treesaver.dimensions.getOffsetHeight(el);

  // Inner Width & Height
  this.w = this.outerW - this.bpWidth;
  this.h = this.outerH - this.bpHeight;

  // Min & Max : Width & Height
  this.minW = treesaver.dimensions.toPixels(el, style.minWidth) || 0;
  this.minH = treesaver.dimensions.toPixels(el, style.minHeight) || 0;

  // Opera returns -1 for a max-width or max-height that is not set.
  tmp = treesaver.dimensions.toPixels(el, style.maxWidth);
  this.maxW = (!tmp || tmp === -1) ? Infinity : tmp;

  tmp = treesaver.dimensions.toPixels(el, style.maxHeight);
  this.maxH = (!tmp || tmp === -1) ? Infinity : tmp;

  // Line height
  this.lineHeight = treesaver.dimensions.toPixels(el, style.lineHeight) || null;

  // Restore the original position property on style
  //if (this.position !== 'absolute') {
    //el.style.position = oldPosition;
    //if (!el.getAttribute('style')) {
      //el.removeAttribute('style');
    //}
  //}

  // Not sure if resetting hasLayout is the right thing to do
  // here, as it might affect the measurements we just did.
  //if (SUPPORT_IE && treesaver.capabilities.IS_LEGACY) {
  //  el.style.zoom = 'normal';
  //}
};

/**
 * Make a copy of the object
 *
 * @return {!treesaver.dimensions.Metrics}
 */
treesaver.dimensions.Metrics.prototype.clone = function() {
  var copy = new treesaver.dimensions.Metrics(),
      key;

  for (key in this) {
    if (copy[key] !== this[key]) {
      copy[key] = this[key];
    }
  }

  return copy;
};

// TODO: MergeSizeRange

if (goog.DEBUG) {
  treesaver.dimensions.Metrics.prototype.toString = function() {
    return '[Metrics: ' + this.w + 'x' + this.h + ']';
  };
}

// Input 10
/**
 * @fileoverview Event helper functions.
 */

goog.provide('treesaver.events');

goog.require('treesaver.array');
goog.require('treesaver.constants');
goog.require('treesaver.debug'); // forEach

/**
 * Create an event and fire it
 *
 * @param {!*} obj
 * @param {!string} type
 * @param {Object=} data
 */
treesaver.events.fireEvent = function(obj, type, data) {
  var e = document.createEvent('UIEvents'),
      cur,
      val;

  // TODO: Test cancelling
  e.initEvent(type, false, true);
  // Copy provided data into event object
  if (data) {
    for (cur in data) {
      e[cur] = data[cur];
    }
  }

  return obj.dispatchEvent(e);
};

/**
 * Add an event listener to an element
 *
 * @param {!*} obj
 * @param {!string} type
 * @param {!function()|Object} fn
 */
treesaver.events.addListener = function(obj, type, fn) {
  // Help out while debugging, but don't pay the performance hit
  // for a try/catch in production
  if (goog.DEBUG) {
    try {
      obj.addEventListener(type, fn, false);
    }
    catch(ex) {
      treesaver.debug.error('Could not add ' + type + ' listener to: ' + obj);
      treesaver.debug.error('Exception ' + ex);
    }
  }
  else {
    obj.addEventListener(type, fn, false);
  }
};

/**
 * Remove an event listener from an element
 *
 * @param {!*} obj
 * @param {!string} type
 * @param {!function()|Object} fn
 */
treesaver.events.removeListener = function(obj, type, fn) {
  // Help out with debugging, but only in debug
  if (goog.DEBUG) {
    try {
      obj.removeEventListener(type, fn, false);
    }
    catch (ex) {
      treesaver.debug.error('Could not remove ' + type + ' listener from: ' + obj);
      treesaver.debug.error('Exception ' + ex);
    }
  }
  else {
    obj.removeEventListener(type, fn, false);
  }
};

// Need to patch functions for IE
if (SUPPORT_IE && (!('addEventListener' in document))) {
  treesaver.debug.warn('Using IE event model');

  // IE's lack of DOM Level 2 support really sucks here, for a few reasons
  //   1. No support for custom events, only the ones built-in
  //   2. No support for EventHandler.handleEvent (makes binding easy)
  //   3. Choosing to use attachEvent instead of addEventListener in general
  //
  // So, what's a girl to do? Well, we'll just take over and deal with
  // event handling and dispatching ourselves.
  //
  // First up, we need the list of events that IE supports natively

  // From: http://msdn.microsoft.com/en-us/library/ms533051(VS.85).aspx
  /**
   * @const
   * @type {Array.<string>}
   */
  var IE_NATIVE_EVENTS = [
    'abort', 'activate', 'afterprint', 'afterupdate',
    'beforeactivate', 'beforecopy', 'beforecut',
    'beforedeactivate', 'beforeeditfocus', 'beforepaste',
    'beforeprint', 'beforeunload', 'beforeupdate', 'blur',
    'bounce', 'cellchange', 'change', 'click',
    'contextmenu', 'controlselect', 'copy', 'cut',
    'dataavailable', 'datasetchanged', 'datasetcomplete',
    'dblclick', 'deactivate', 'drag', 'dragend',
    'dragenter', 'dragleave', 'dragover', 'dragstart',
    'drop', 'error', 'error', 'errorupdate', 'filterchange',
    'finish', 'focus', 'focusin', 'focusout', 'hashchange',
    'help', 'keydown', 'keypress', 'keyup', 'layoutcomplete',
    'load', 'losecapture', 'message', 'mousedown',
    'mouseenter', 'mouseleave', 'mousemove', 'mouseout',
    'mouseover', 'mouseup', 'mousewheel', 'move',
    'moveend', 'movestart', 'offline', 'online', 'page',
    'paste', 'progress', 'propertychange', 'readystatechange',
    'readystatechange', 'reset', 'resize', 'resizeend',
    'resizestart', 'rowenter', 'rowexit', 'rowsdelete',
    'rowsinserted', 'scroll', 'select', 'selectionchange',
    'selectstart', 'start', 'stop', 'storage',
    'storagecommit', 'submit', 'timeout', 'unload'
  ];

  /**
   * @this {Event}
   */
  treesaver.events.preventDefault = function() {
    this.returnValue = false;
  };

  /**
   * @this {Event}
   */
  treesaver.events.stopPropagation = function() {
    this.cancelBubble = true;
  };

  treesaver.events.fireEvent = function(obj, type, data) {
    var e = document.createEventObject(),
        cur;

    e.type = type;

    // Copy provided data into event object
    if (data) {
      for (cur in data) {
        e[cur] = data[cur];
      }
    }

    // Add 'preventDefault' if it doesn't already exist
    if (!e.preventDefault) {
      e.preventDefault = treesaver.events.preventDefault;
    }

    if (!e.stopPropagation) {
      e.stopPropagation = treesaver.events.stopPropagation;
    }

    // If it's an event IE supports natively, fire it through the
    // event system
    if (true || IE_NATIVE_EVENTS.indexOf(type) !== -1) {
      try {
        return obj.fireEvent('on' + type, e);
      }
      catch (ex) {
        // Well, I guess it didn't support it after all, let's fallback
        // to our backup below
      }
    }

    // TODO: Need to create a new "event" object, so we can track
    // preventDefault / returnValue on our own

    // Not a native event, let's do a manual dispatch since it's a custom
    // event anyway
    if (obj.custom_handlers && obj.custom_handlers[type]) {
      obj.custom_handlers[type].master(e);
    }

    // TODO: Need to match the semantics of dispatchEvent here, and make sure
    // we send the right signals as to when to prevent default
    return false;
  };

  /**
   * @private
   * @param {Element} obj
   * @param {string} type
   * @return {!function()}
   */
  treesaver.events.createMasterHandler_ = function(obj, type) {
    return function(e) {
      // IE doesn't pass the event as a parameter :(
      e = e || window.event;

      // IE uses srcElement instead of target
      e.target = e.target || e.srcElement;

      // Need to set up preventDefault
      e.preventDefault = treesaver.events.preventDefault;

      e.stopPropagation = treesaver.events.stopPropagation;

      // Call each handler
      obj.custom_handlers[type].handlers.forEach(function(fun) {
        // For now, wrap handlers in try/catch
        // TODO: Use a better callback model
        // Hat tip to Dean Edwards for the inspiration
        // http://dean.edwards.name/weblog/2009/03/callbacks-vs-events/
        //
        // TODO: What happens if an event handler removes itself here?
        try {
          if ('handleEvent' in fun) {
            // Dispatch to handleEvent if it's an object
            fun['handleEvent'](e);
          }
          else {
            // Otherwise call handler with correct 'this'
            fun.call(obj, e);
          }
        }
        catch (ex) {
          // Some failure
          treesaver.debug.error('Exception during ' + type + ' handler: ' + ex);
        }
      });
    };
  };

  // From PPK/Dean Edwards
  // http://www.quirksmode.org/blog/archives/2005/10/_and_the_winner_1.html
  treesaver.events.addListener = function(obj, type, fn) {
    // Create storage if it's not there
    if (!obj.custom_handlers) {
      obj.custom_handlers = {};
    }

    // Create storage for this type
    if (!obj.custom_handlers[type]) {
      obj.custom_handlers[type] = {
        handlers: [],
        master: treesaver.events.createMasterHandler_(obj, type)
      };

      // Attach master event, if it's native
      if (IE_NATIVE_EVENTS.indexOf(type) !== -1) {
        obj.attachEvent('on' + type, obj.custom_handlers[type].master);
      }
    }

    // Store the handler
    obj.custom_handlers[type].handlers.push(fn);
  };

  treesaver.events.removeListener = function(obj, type, fn) {
    // Remove the event if it's there
    if (obj.custom_handlers && obj.custom_handlers[type]) {
      var index = obj.custom_handlers[type].handlers.indexOf(fn);
      if (index !== -1) {
        treesaver.array.remove(obj.custom_handlers[type].handlers, index);
      }

      // Do we have any handlers left?
      if (!obj.custom_handlers[type].handlers.length) {
        // Detach event (if necessary)
        if (IE_NATIVE_EVENTS.indexOf(type) !== -1) {
          obj.detachEvent('on' + type, obj.custom_handlers[type].master);
        }

        // Clear out everything
        obj.custom_handlers[type] = null;
      }
    }
  };
}

// Expose event helper functions via externs
goog.exportSymbol('treesaver.addListener', treesaver.events.addListener);
goog.exportSymbol('treesaver.removeListener', treesaver.events.removeListener);

// Input 11
goog.provide('treesaver.layout.ContentPosition');

/**
 * Helper class for indicating a relative position within a
 * stream of content
 *
 * @constructor
 * @param {number} block Index of the current block.
 * @param {number} figure Index of the current figure.
 * @param {number} overhang Overhang.
 */
treesaver.layout.ContentPosition = function(block, figure, overhang) {
  this.block = block;
  this.figure = figure;
  this.overhang = overhang;
};

/**
 * Position at the end of content
 *
 * @const
 * @type {!treesaver.layout.ContentPosition}
 */
treesaver.layout.ContentPosition.END =
  new treesaver.layout.ContentPosition(Infinity, Infinity, Infinity);

/**
 * Is the current content position at the beginning?
 *
 * @return {boolean} True if at beginning of content.
 */
treesaver.layout.ContentPosition.prototype.atBeginning = function() {
  return !this.block && !this.figure && !this.overhang;
};

/**
 * Sort function for ContentPositions
 *
 * @param {!treesaver.layout.ContentPosition} a
 * @param {!treesaver.layout.ContentPosition} b
 * @return {number} Negative if b is greater, 0 if equal, positive if be is lesser.
 */
treesaver.layout.ContentPosition.sort = function(a, b) {
  if (a.block !== b.block) {
    return b.block - a.block;
  }
  else if (a.overhang !== b.overhang) {
    // Less overhang = further along
    return a.overhang - b.overhang;
  }

  return b.figure - a.figure;
};

/**
 * @param {!treesaver.layout.ContentPosition} other
 * @return {boolean} True if the other breakRecord is ahead of this one.
 */
treesaver.layout.ContentPosition.prototype.lessOrEqual = function(other) {
  return treesaver.layout.ContentPosition.sort(this, other) >= 0;
};

/**
 * @param {!treesaver.layout.ContentPosition} other
 * @return {boolean} True if the other breakRecord is behind this one.
 */
treesaver.layout.ContentPosition.prototype.greater = function(other) {
  return treesaver.layout.ContentPosition.sort(this, other) < 0;
};

/**
 * Clone the ContentPosition
 * TODO: Was DEBUG only?
 *
 * @return {!treesaver.layout.ContentPosition}
 */
treesaver.layout.ContentPosition.prototype.clone = function() {
  return new this.constructor(this.block, this.figure, this.overhang);
};

// Input 12
/**
 * @fileoverview BreakRecord class.
 */

goog.provide('treesaver.layout.BreakRecord');

goog.require('treesaver.layout.ContentPosition');

/**
 * BreakRecord class
 * @constructor
 */
treesaver.layout.BreakRecord = function() {
  /**
   * @type {number}
   */
  this.index = 0;
  /**
   * @type {number}
   */
  this.figureIndex = 0;
  /**
   * @type {number}
   */
  this.overhang = 0;
  /**
   * @type {boolean}
   */
  this.finished = false;
  /**
   * @type {Array.<number>}
   */
  this.delayed = [];
  /**
   * @type {Array.<number>}
   */
  this.failed = [];
  /**
   * @type {number}
   */
  this.pageNumber = 0;
};

/**
 * Create a new copy, and return
 *
 * @return {!treesaver.layout.BreakRecord} A deep clone of the original breakRecord.
 */
treesaver.layout.BreakRecord.prototype.clone = function() {
  var clone = new this.constructor();
  clone.index = this.index;
  clone.figureIndex = this.figureIndex;
  clone.overhang = this.overhang;
  clone.finished = this.finished;
  clone.delayed = this.delayed.slice(0);
  clone.failed = this.failed.slice(0);
  clone.pageNumber = this.pageNumber;

  return clone;
};

/**
 * Check for effective equality
 *
 * @param {treesaver.layout.BreakRecord} other Object to check for equality.
 * @return {boolean} True if the breakRecord is equivalent.
 */
treesaver.layout.BreakRecord.prototype.equals = function(other) {
  return !!other &&
      other.index === this.index &&
      other.figureIndex === this.figureIndex &&
      other.overhang === this.overhang &&
      // TODO: Better detection?
      // For now this works, since it's not possible to advance
      // pagination and have these be true
      other.delayed.length === this.delayed.length;
};

/**
 * Return a new object which can be used as a marker for
 * the position in the content
 *
 * @return {!treesaver.layout.ContentPosition}
 */
treesaver.layout.BreakRecord.prototype.getPosition = function() {
  return new treesaver.layout.ContentPosition(this.index,
      this.figureIndex, this.overhang);
};

/**
 * Is the break record at the beginning of content?
 *
 * @return {boolean} True if this breakRecord is at the start
 *                   of content.
 */
treesaver.layout.BreakRecord.prototype.atStart = function() {
  return !this.index && !this.figureIndex && !this.overhang;
};

/**
 * Is the break record at the end of the content?
 *
 * @param {!treesaver.layout.Content} content The content for this breakRecord.
 * @return {boolean} True if there is no more content left to show.
 */
treesaver.layout.BreakRecord.prototype.atEnd = function(content) {
  if (this.overhang) {
    // Overhang means we're not finished, no matter what
    return false;
  }

  var i, len, block;

  // Check if there are any blocks left to layout, not including
  // fallbacks for optional (or used) figures
  for (i = this.index, len = content.blocks.length; i < len; i += 1) {
    block = content.blocks[i];

    if (!block.isFallback) {
      // We have a non-fallback block left, which means we are not done
      return false;
    }

    if (!this.figureUsed(i) && !block.figure.optional) {
      // Have the unused fallback of a required figure, we are not done
      return false;
    }
  }

  // No blocks left, check figures

  // If we've used all the figures, then we're done
  if (!this.delayed.length &&
      this.figureIndex === content.figures.length) {
    return true;
  }

  // We have some figures left, gotta figure out if any of them are
  // required
  var i, len, figure,
      delayed = this.delayed.slice(0);

  // First, check the delayed figures
  while (delayed.length) {
    figure = content.figures[delayed.pop()];
    // A required figure means we're not done yet
    if (!figure.optional) {
      return false;
    }
  }

  // Now check the remaining figures
  for (i = this.figureIndex, len = content.figures.length; i < len; i += 1) {
    figure = content.figures[i];
    // A required figure means we're not done yet
    if (!figure.optional) {
      return false;
    }
  }

  // If we made it this far, then we are done!
  return true;
};

/**
 * Update the breakRecord after using a figure. Make sure to update
 * delayed array, etc
 *
 * @param {!number} figureIndex The index of the figure just used.
 */
treesaver.layout.BreakRecord.prototype.useFigure = function(figureIndex) {
  var delayedIndex;

  if (figureIndex < 0) {
    treesaver.debug.error('Negative number passed to useFigure');
  }

  // If the index used it less than our current marker, then it
  // was probably delayed (no guarantee though)
  if (figureIndex < this.figureIndex) {
    if ((delayedIndex = this.delayed.indexOf(figureIndex)) !== -1) {
      // Remove from delayed
      treesaver.array.remove(this.delayed, delayedIndex);
    }
    else if ((delayedIndex = this.failed.indexOf(figureIndex)) !== -1) {
      // Was a failure, remove
      treesaver.array.remove(this.failed, delayedIndex);
    }
    else {
      // Do nothing
    }
  }
  else {
    // Otherwise, we need to move up our high-water mark of figureIndex,
    // adding any skipped indicies to the delayed array
    if (figureIndex > this.figureIndex) {
      for (; this.figureIndex < figureIndex; this.figureIndex += 1) {
        this.delayed.push(this.figureIndex);
      }
    }

    // Now that delayed array is updated, we can advance
    this.figureIndex = figureIndex + 1;
  }
};

/**
 * Update the break record in order to delay a figure
 *
 * @param {!number} figureIndex
 */
treesaver.layout.BreakRecord.prototype.delayFigure = function(figureIndex) {
  if (this.delayed.indexOf(figureIndex) === -1) {
    // Pretend the figure was used
    this.useFigure(figureIndex);

    // But move it into the delayed array
    this.delayed.push(figureIndex);
  }
};

/**
 * Check if the given figure index has been used
 *
 * @param {!number} figureIndex
 * @return {boolean} True if the figure index has been used.
 */
treesaver.layout.BreakRecord.prototype.figureUsed = function(figureIndex) {
  if (this.figureIndex <= figureIndex) {
    return false;
  }

  if (this.delayed.indexOf(figureIndex) !== -1) {
    return false;
  }

  if (this.failed.indexOf(figureIndex) !== -1) {
    return false;
  }

  return true;
};

/**
 * Update the breakRecord after trying to use a figure, but failing.
 *
 * @param {!number} figureIndex The index of the figure just used.
 */
treesaver.layout.BreakRecord.prototype.failedFigure = function(figureIndex) {
  // Pretend like we used the figure
  this.useFigure(figureIndex);

  // Now move the figure to the failed array
  this.failed.push(figureIndex);
};

if (goog.DEBUG) {
  treesaver.layout.BreakRecord.prototype.toString = function() {
    return '[BreakRecord ' + this.index + '/' + this.figureIndex + ']';
  };
}

// Input 13
/**
 * @fileoverview HTML and other information about a figure's content payload.
 */

goog.provide('treesaver.layout.FigureSize');

goog.require('treesaver.dom');

/**
 * HTML and other information about a figure content payload
 * @param {string} html Content payload.
 * @param {number|string} minW
 * @param {number|string} minH
 * @param {?Array.<string>} requirements
 * @constructor
 */
treesaver.layout.FigureSize = function(html, minW, minH, requirements) {
  /**
   * The full HTML content for this payload.
   *
   * @type {string}
   */
  this.html = html;

  // TODO: Use outerHTML from the node eventually in order to sanitize bad
  // HTML?

  // Provide a rough measure the element so we know if we can fit within
  // containers
  /**
   * @type {number}
   */
  this.minW = parseInt(minW || 0, 10);

  /**
   * @type {number}
   */
  this.minH = parseInt(minH || 0, 10);

  /**
   * List of required capabilities for this Chrome
   * TODO: Only store mutable capabilities
   *
   * @type {?Array.<string>}
   */
  this.requirements = requirements;
};

/**
 * @return {boolean} True if the figureSize meets current browser capabilities.
 */
treesaver.layout.FigureSize.prototype.meetsRequirements = function() {
  if (!this.requirements) {
    return true;
  }

  return treesaver.capabilities.check(this.requirements, true);
};

/**
 * Apply the figure size to the element
 * @param {!Element} container
 * @param {string=} name
 */
treesaver.layout.FigureSize.prototype.applySize = function(container, name) {
  if (name) {
    treesaver.dom.addClass(container, name);
  }

  container.innerHTML = this.html;

  // Find any cloaked images
  treesaver.dom.getElementsByProperty('data-src', null, 'img', container).
    forEach(function(e) {
      e.setAttribute('src', e.getAttribute('data-src'));
  });
};

/**
 * Back out an applied figure size after a failure
 * @param {!Element} container
 */
treesaver.layout.FigureSize.prototype.revertSize = function(container, name) {
  // Remove class
  treesaver.dom.removeClass(container, name);
  // Remove content
  treesaver.dom.clearChildren(container);
};


if (goog.DEBUG) {
  // Expose for testing
  treesaver.layout.FigureSize.prototype.toString = function() {
    return '[FigureSize: ' + this.index + '/' + this.html + ']';
  };
}

// Input 14
/**
 * @fileoverview String helper functions.
 */

goog.provide('treesaver.string');

// Add string.trim() if it's not there
if (!String.prototype.trim) {
  String.prototype.trim = function() {
    return this.replace(/^\s\s*/, '').replace(/\s\s*$/, '');
  };
}

// Input 15
goog.provide('treesaver.object');

/**
 * Returns the keys in an object.
 *
 * @param {!Object} o The object to return the keys for.
 * @return {!Array.<string>} An array of the keys.
 */
treesaver.object.keys = function(o) {
  var result = [];
  for (var name in o) {
    if (o.hasOwnProperty(name)) {
      result.push(name);
    }
  }
  return result;
};

/**
 * Test whether or not a value is an object.
 *
 * @param {!Object} value The object to test.
 * @return {!boolean} True if the value is an object, false otherwise.
 */
treesaver.object.isObject = function(value) {
  return Object.prototype.toString.apply(value) === '[object Object]';
};

/**
 * Clone an object by creating a new object and
 * setting its prototype to the original object.
 *
 * @param {!Object} o The object to be cloned.
 * @return {!Object} A clone of the given object.
 */
Object.clone = function(o) {
  /** @constructor */
  function Clone() {}
  Clone.prototype = o;
	return new Clone();
};

// Input 16
goog.provide('treesaver.template');

goog.require('treesaver.array');
goog.require('treesaver.dom');
goog.require('treesaver.object');
goog.require('treesaver.string');

/**
 * Expand a class-based template using the given view and
 * class to attribute mappings.
 *
 * @param {!Object} view The object to expand the template with.
 * @param {!Element} scope The element to use as root for template
 * expansion.
 */
treesaver.template.expand = function(view, scope) {
  treesaver.template.expandObject_(view, scope);
};

/**
 * Helper for template expansion.
 *
 * @private
 * @param {!Object} view The object to expand the template with.
 * @param {!Element} scope The element to use as root for template
 * expansion.
 */
treesaver.template.expandObject_ = function(view, scope) {
  var matches = {},
      elements = [],
      topLevelElements = [],
      i, j, len, contains;

  // Get all the elements with a data-bind attribute. Unfortunately because of the
  // way we handle key => attribute mappings we can't use the fast querySelectorAll
  // (for example *[data-bind ~= "url"] won't match data-bind="url:href")
  elements = treesaver.dom.getElementsByProperty('data-bind', null, null, scope);

  // Only keep the element if it is not contained in any other element. As soon
  // as we find one element that contains this element we can stop.
  for (i = 0, len = elements.length; i < len; i += 1) {
    contains = false;
    for (j = 0; j < len; j += 1) {
      if (elements[i] !== elements[j] && elements[j].contains(elements[i])) {
        contains = true;
        break;
      }
    }
    if (!contains) {
      topLevelElements.push(elements[i]);
    }
  }

  if (treesaver.dom.hasAttr(scope, 'data-bind')) {
    topLevelElements.push(scope);
  }

  topLevelElements.forEach(function(el) {
    // Split the data-bind value into keys.
    var keys = el.getAttribute('data-bind').split(/\s+/);

    keys.forEach(function(key) {
      var mapIndex = key.indexOf(':'),
          keyName = null,
          mapName = null,
          value = null,
          children = [],
          parent = null,
          text = '';

      if (mapIndex !== -1) {
        keyName = key.substring(0, mapIndex);
        mapName = key.substring(mapIndex + 1);
      }
      else {
        keyName = key;
      }

      if (view[keyName]) {
        value = view[keyName];

        if (treesaver.array.isArray(value)) {
          children = treesaver.array.toArray(el.childNodes);
          value.forEach(function(item) {
            children.forEach(function(child) {
              var clone = child.cloneNode(true);
              if (clone.nodeType === 1) {
                treesaver.template.expand(item, clone);
              }
              el.appendChild(clone);
            });
          });

          children.forEach(function(child) {
            el.removeChild(child);
          });
        }
        else if (treesaver.object.isObject(value)) {
          children = treesaver.array.toArray(el.childNodes);
          children.forEach(function(child) {
            if (child.nodeType === 1) {
              treesaver.template.expand(value, child);
            }
          });
        }
        else {
          if (mapName !== null) {
            if ((mapName === 'href' || mapName === 'src') && treesaver.dom.hasAttr(el, 'data-' + mapName)) {
              // We check if the target attribute exists and it still has unexpanded bindings. If not we
              // retrieve the data template.
              if (!(treesaver.dom.hasAttr(el, mapName) && /{{[^}]+}}/.test(text = el.getAttribute(mapName)))) {
                text = el.getAttribute('data-' + mapName);
              }
            }
            else if (mapName === 'class') {
              text = el.className;
            } else {
              text = el.getAttribute(mapName);
            }
          }
          else {
            text = el.innerHTML;
          }

          if (!value) {
            value = '';
          }
          value = value.toString();

          if (text && /{{[^}]+}}/.test(text)) {
            text = text.replace(/{{([^}]+)}}/g, function(m, n) {
              n = n.trim();
              if (n === keyName) {
                if (mapName !== null && (mapName === 'href' || mapName === 'src')) {
                  return encodeURIComponent(value);
                }
                else if (mapName) {
                  return value;
                }
                else {
                  // Template in normal text (escape HTML characters)
                  return treesaver.template.escapeHTML(value);
                }
              }
              else {
                return '{{' + n + '}}';
              }
            });
          }
          else {
            text = treesaver.template.escapeHTML(value);
          }

          if (mapName) {
            if (mapName === 'class') {
              el.className = text;
            }
            else {
              el.setAttribute(mapName, text);
            }
          }
          else {
            el.innerHTML = text;
          }
        }
      }
    });
  });
};

/**
 * Check if an element has the given data-bind name.
 *
 * @param {!Element|!HTMLDocument} el The element to check.
 * @param {!string} bindName The name to check for.
 * @return {boolean} True if the element has that bind name.
 */
treesaver.template.hasBindName = function(el, bindName) {
  var names = el.getAttribute('data-bind').split(/\s+/);
  return names.some(function(n) {
    var mapIndex = n.indexOf(':');
    if (mapIndex !== -1) {
      return n.substring(0, mapIndex) === bindName;
    }
    else {
      return n === bindName;
    }
  });
};

/**
 * Return elements by bind name (i.e. data-bind="...").
 *
 * @param {!string} bindName Bind name.
 * @param {?string=} tagName Tag name (optional).
 * @param {HTMLDocument|Element=} root    Element root (optional).
 */
treesaver.template.getElementsByBindName = function(bindName, tagName, root) {
  var candidates = treesaver.dom.getElementsByProperty('data-bind', null, tagName, root);

  return candidates.filter(function(candidate) {
    return treesaver.template.hasBindName(candidate, bindName);
  });
};

/**
 * Escapes a string for use in innerHTML.
 *
 * @private
 * @param {string} str The string to escape.
 * @return {!string} The escaped string.
 */
treesaver.template.escapeHTML = function(str) {
  return str.replace(/&(?!\w+;)|[<>]/g, function(s) {
    switch (s) {
      case '&': return '&amp;';
      case '<': return '&lt;';
      case '>': return '&gt;';
      default: return s;
    }
  });
};

// Input 17
goog.provide('treesaver.layout.Figure');

goog.require('treesaver.array');
goog.require('treesaver.capabilities');
goog.require('treesaver.dom');
// Block requires Figure, so avoid a circular dependency
//goog.require('treesaver.layout.Block');
goog.require('treesaver.layout.FigureSize'); // trim
goog.require('treesaver.string');
goog.require('treesaver.template');

/**
 * A figure element
 * @param {!Element} el HTML element.
 * @param {!number} baseLineHeight The normal line height used across
 *                                 the article content (in pixels).
 * @param {?Object} indices Current block and figure index.
 * @constructor
 */
treesaver.layout.Figure = function(el, baseLineHeight, indices) {
  /** @type {number} */
  this.anchorIndex = indices.index;
  /** @type {number} */
  this.figureIndex = indices.figureIndex;
  indices.figureIndex += 1;
  /** @type {?treesaver.layout.Block} */
  this.fallback = null;
  /** @type {Object.<string, Array.<treesaver.layout.FigureSize>>} */
  this.sizes = {};

  /**
   * Does this figure need to be displayed? If not, then it may be omitted
   * when there is not enough space.
   * @type {boolean}
   */
  this.optional = !treesaver.dom.hasClass(el, 'required');

  /**
   * Does the figure support zooming/lightboxing?.
   * @type {boolean}
   */
  this.zoomable = treesaver.dom.hasClass(el, 'zoomable');

  /**
   * Temporarily holds any content templates
   * @private
   * @type {Array.<!Element>}
   */
  this.templates = [];

  // Go through and process our sizes
  treesaver.array.toArray(el.childNodes).forEach(function(childNode) {
    if (childNode.nodeType !== 1) {
      // TODO: What if content is just a ext node? (take parent?)
      if (childNode.data && childNode.data.trim()) {
        treesaver.debug.info('textNode ignored in figure: ' + childNode.data);
      }

      return;
    }

    this.processElement(childNode);
  }, this);

  // Now check for a fallback, and process separately
  if (this.sizes['fallback']) {
    // TODO: Support multiple fallbacks?
    // TODO: Requirements on fallback?
    this.processFallback(this.sizes['fallback'][0].html, el, baseLineHeight, indices);

    // Remove the fallback from figure sizes
    delete this.sizes['fallback'];
  }

  // No longer needed
  delete this.templates;
};

/**
 * @param {!string} html
 * @param {!Node} node HTML node.
 * @param {!number} baseLineHeight The normal line height used across
 *                                 the article content (in pixels).
 * @param {!Object} indices Current block and figure index.
 */
treesaver.layout.Figure.prototype.processFallback = function processFallback(html,
    node, baseLineHeight, indices) {
  // Create the child node
  var parent = node.parentNode,
      fallbackContainer = document.createElement('div'),
      /** @type {!Node} */
      fallbackNode;

  fallbackContainer.innerHTML = html;
  // Is there only one element in our payload?
  if (fallbackContainer.childNodes.length === 1) {
    // Great, just use that one
    fallbackNode = /** @type {!Node} */ fallbackContainer.firstChild;
  }
  else {
    // Use the wrapper as the fallback node
    fallbackNode = fallbackContainer;
  }

  // Cast for compiler
  fallbackNode = /** @type {!Element} */ (fallbackNode);

  // Insert into the tree, to get proper styling
  parent.insertBefore(fallbackNode, node);

  // Add flags into DOM for zooming
  if (this.zoomable) {
    treesaver.dom.addClass(fallbackNode, 'zoomable');
    fallbackNode.setAttribute('data-figureindex', this.figureIndex);
    if (WITHIN_IOS_WRAPPER || treesaver.capabilities.SUPPORTS_TOUCH) {
      // Need dummy handler in order to get bubbled events
      fallbackNode.setAttribute('onclick', 'void(0)');
    }
  }

  // Figures are skipped during sanitization, so must do it manually here
  treesaver.layout.Block.sanitizeNode(fallbackNode, baseLineHeight);

  // Construct
  this.fallback = new treesaver.layout.Block(fallbackNode, baseLineHeight, indices, true);
  this.fallback.figure = this;
  if (this.fallback.blocks) {
    // Set the figure on any child blocks
    this.fallback.blocks.forEach(function(block) {
      block.figure = this;
      block.withinFallback = true;
    }, this);
  }

  // Remove the node
  parent.removeChild(fallbackNode);

  // Done
};

/**
 * Retrieve a qualifying figureSize for the given size name
 *
 * @param {!string} size
 * @return {?treesaver.layout.FigureSize} Null if not found.
 */
treesaver.layout.Figure.prototype.getSize = function(size) {
  var i, len;

  if (this.sizes[size]) {
    for (i = 0, len = this.sizes[size].length; i < len; i += 1) {
      if (this.sizes[size][i].meetsRequirements()) {
        return this.sizes[size][i];
      }
    }
  }

  // None found
  return null;
};

/**
 * Retrieve the largest figureSize that fits within the allotted space
 *
 * @param {!treesaver.dimensions.Size} maxSize
 * @return {?{name: string, figureSize: treesaver.layout.FigureSize}} Null if none fit
 */
treesaver.layout.Figure.prototype.getLargestSize = function(maxSize) {
  var maxW = -Infinity,
      maxH = -Infinity,
      max,
      current;

  for (current in this.sizes) {
    this.sizes[current].forEach(function(figureSize) {
      if (!figureSize.meetsRequirements()) {
        // Not eligible
        return;
      }

      if ((figureSize.minW && figureSize.minW > maxSize.w) ||
          (figureSize.minH && figureSize.minH > maxSize.h)) {
        // Too big
        return;
      }

      // TODO: How to estimate dimensions when no info is provided?
      if ((!figureSize.minW || figureSize.minW >= maxW) &&
          (!figureSize.minH || figureSize.minH >= maxH)) {
        maxW = figureSize.minW;
        maxH = figureSize.minH;
        max = {
          name: current,
          figureSize: figureSize
        };
      }
    });
  }

  return max;
};

/**
 * @param {!Array.<string>} sizes
 * @param {!string} html
 * @param {number} minW
 * @param {number} minH
 * @param {?Array.<string>} requirements
 */
treesaver.layout.Figure.prototype.saveSizes = function saveSizes(sizes, html, minW, minH, requirements) {
  // First, create the FigureSize
  var figureSize = new treesaver.layout.FigureSize(html, minW, minH, requirements);

  sizes.forEach(function(size) {
    if (this.sizes[size]) {
      this.sizes[size].push(figureSize);
    }
    else {
      this.sizes[size] = [figureSize];
    }
  }, this);
};

/**
 * @param {!Element} el
 */
treesaver.layout.Figure.prototype.processElement = function processElement(el) {
  var sizes = el.getAttribute('data-sizes'),
      // Use native width & height if available, otherwise use custom data- properties
      minW = parseInt(el.getAttribute(treesaver.dom.hasAttr(el, 'width') ? 'width' : 'data-minwidth'), 10),
      minH = parseInt(el.getAttribute(treesaver.dom.hasAttr(el, 'height') ? 'height' : 'data-minheight'), 10),
      requirements = treesaver.dom.hasAttr(el, 'data-requires') ?
        el.getAttribute('data-requires').split(' ') : null,
      html;

  if (requirements) {
    if (!treesaver.capabilities.check(requirements)) {
      // Does not meet requirements, skip
      return;
    }
  }

  // Remove class=hidden or hidden attribute in case used for display cloaking
  el.removeAttribute('hidden');
  treesaver.dom.removeClass(el, 'hidden');

  // TODO: Remove properties we don't need to store (data-*)

  // Grab HTML
  html = treesaver.dom.outerHTML(el);

  if (!sizes) {
    sizes = ['fallback'];
  }
  else {
    sizes = sizes.split(' ');
  }

  this.saveSizes(sizes, html, minW, minH, requirements);
};

/**
 * @param {!Element} el
 * @return {boolean} True if the element is a figure.
 */
treesaver.layout.Figure.isFigure = function isFigure(el) {
  var nodeName = el.nodeName.toLowerCase();
  return el.nodeType === 1 && nodeName === 'figure';
};

if (goog.DEBUG) {
  // Expose for testing
  treesaver.layout.Figure.prototype.toString = function toString() {
    return '[Figure: ' + this.index + '/' + this.figureIndex + ']';
  };
}

// Input 18
/**
 * @fileoverview A block element.
 */

goog.provide('treesaver.layout.Block');

goog.require('treesaver.array');
goog.require('treesaver.debug');
goog.require('treesaver.dimensions'); // forEach
goog.require('treesaver.dom');
goog.require('treesaver.layout.Figure');

/**
 * A block element. Includes paragraphs, images, lists, etc.
 * @param {!Node} node HTML node.
 * @param {!number} baseLineHeight The normal line height used across
 *                                 the article content (in pixels).
 * @param {!Object} indices Current block and figure index.
 * @param {?boolean} isFallback Whether child figures should be ignored.
 * @constructor
 */
treesaver.layout.Block = function(node, baseLineHeight, indices, isFallback) {
  var isReplacedElement = treesaver.layout.Block.isReplacedElement(node),
      hasFigures,
      figureSizes,
      html_zero = '',
      children,
      clone;

  if (goog.DEBUG) {
    if (!indices) {
      treesaver.debug.warn('Autogen indices. Will not work in production!');
      indices = {
        index: 0,
        figureIndex: 0
      };
    }
  }

  // Is this an HTML element?
  // TODO: Remove this check?
  if (node.nodeType !== 1) {
    treesaver.debug.error('Non-element sent into Block constructor: ' + node);

    // Ignore whitespace, comments, etc
    this.ignore = true;
    return;
  }

  node = /** @type {!Element} */ (node);

  // Quick check in case the element is display none and should be ignored
  if (!treesaver.dimensions.getOffsetHeight(node)) {
    // TODO: Check display: none / visibility: collapse
    // This is a very defensive move, since a display: none item that
    // is made visible when in a specific column or grid can really mess up a
    // layout
    treesaver.debug.warn('Zero-height block ignored');

    this.ignore = true;
    return;
  }

  /**
  * Index of this block within the article
  * @type {!number}
  */
  this.index = indices.index;
  indices.index += 1;

  /** @type {boolean} */
  this.hasBlockChildren = !isReplacedElement &&
    treesaver.layout.Block.hasBlockChildren(node);

  ///////////////
  // Hierarchy
  ///////////////

  /** @type {boolean } */
  this.isFallback = false; // Set during process children
  /** @type {boolean } */
  this.withinFallback = false; // Set during process children
  /** @type {boolean } */
  this.containsFallback = false;
  /** @type {?treesaver.layout.Figure} */
  this.figure = null;

  /**
   * Blocks contained within this block
   * @type {?Array.<treesaver.layout.Block>}
   */
  this.blocks = [];
  /**
   * Figures contained within this block
   * @type {?Array.<treesaver.layout.Block>}
   */
  this.figures = [];
  /** @type {?boolean} */
  hasFigures = false;
  if (this.hasBlockChildren && !treesaver.dom.hasClass(node, 'keeptogether')) {
    // Extract child blocks and figures
    treesaver.layout.Block.
      processChildren(this, node, baseLineHeight, indices, isFallback);

    // TODO: Collapse if there is only one child element

    hasFigures = !!this.figures.length;

    // An item only has block children if it actually has block children
    this.hasBlockChildren = !!this.blocks.length;
  }
  else {
    // TODO: What if there are figures within a keeptogether?
    // Or a paragraph, for that matter
  }

  // Listing and annotation of all class variables for Closure Compiler type
  // checking

  /**
   * Next Sibling
   * @type {?treesaver.layout.Block}
   */
  //this.nextSibling = null;

  /**
   * Parent block
   * @type {?treesaver.layout.Block}
   */
  //this.parent = null;

  /**
   * Can this block be broken into multiple pieces (across cols/pages)
   * @type {boolean}
   */
  this.breakable = this.breakable || !isReplacedElement;

  /**
   * Make sure this block and the next block are in the same column
   * @type {boolean}
   */
  this.keepwithnext = treesaver.dom.hasClass(node, 'keepwithnext');

  /**
   * Begin a new column before adding this block
   * @type {boolean}
   */
  this.columnBreak = treesaver.dom.hasClass(node, 'columnbreak');

  /**
   * Should this block remain unbroken, if possible
   * @type {boolean}
   */
  this.keeptogether = this.keeptogether || !this.breakable ||
                      treesaver.dom.hasClass(node, 'keeptogether');

  /////////////
  // Metrics
  /////////////

  /**
   * @type {!treesaver.dimensions.Metrics}
   */
  this.metrics = new treesaver.dimensions.Metrics(node);

  // Correct line height in case there's a funky non-pixel value
  if (!this.metrics.lineHeight) {
    this.metrics.lineHeight = baseLineHeight;
  }

  // Check if the entire element is a single line, if so then we need to
  // mark keeptogether
  if (!this.keeptogether) {
    this.keeptogether =
      (this.metrics.bpHeight + this.metrics.lineHeight) === this.metrics.outerH;
  }

  /**
   * Distance from the top edge of the border to the first line of content
   * @type {number}
   */
  this.firstLine = this.keeptogether ?
    // Unbreakable items have to take the entire content (including bp)
    this.metrics.outerH :
    // No children is just BP plus line height
    !this.hasBlockChildren ? this.metrics.bpTop + this.metrics.lineHeight :
    // With children, but no fallback children it's the border, padding,
    // and first line of first child (unless there is a bpTop, in which
    // case we must add the top margin of the first child)
    !this.containsFallback ?
        this.metrics.bpTop + this.blocks[0].firstLine +
        (this.metrics.bpTop ? this.blocks[0].metrics.marginTop : 0) :
    // When there's a fallback child, it get's tricky, since we don't know
    // whether or not we'll include the fallback element ... for now, just
    // do the same thing we do in our previous case
    // TODO: Fix this
    this.metrics.bpTop + this.blocks[0].firstLine;

  // Litter the element with debug info
  if (goog.DEBUG) {
    node.setAttribute('data-index', this.index);
    node.setAttribute('data-outerHeight', this.metrics.outerH);
    node.setAttribute('data-marginTop', this.metrics.marginTop);
    node.setAttribute('data-marginBottom', this.metrics.marginBottom);
    node.setAttribute('data-firstLine', this.firstLine);
  }

  ////////////
  // HTML
  ////////////

  /**
   * HTML for entire element (content and children)
   * @type {!string}
   */
  this.html = treesaver.dom.outerHTML(node);

  /**
   * HTML for opening tag
   * @type {?string}
   */
  this.openTag = this.hasBlockChildren ?
    this.html.substr(0, this.html.indexOf('>') + 1) : null;

  /**
   * HTML for closing tag
   * @type {?string}
   */
  this.closeTag = this.hasBlockChildren ?
    this.html.slice(this.html.lastIndexOf('<')) : null;

  // If there are figures in this element (or any child),
  // they must not be included in the html
  if (hasFigures) {
    this.html = /** @type {!string} */ (this.openTag);
    this.blocks.forEach(function(block) {
      this.html += block.html;
    }, this);
    this.html += this.closeTag;
  }

  if (this.hasBlockChildren) {
    // We filter out figures and other
    // When breaking a parent element across columns or pages, need to have
    // zero-margin/border/padding versions in order to nest correctly

    // Use a clone so we don't mess up all the HTML up the tree
    clone = /** @type {!Element} */ (node.cloneNode(true));

    if (this.metrics.marginTop) {
      treesaver.dimensions.setCssPx(clone, 'marginTop', 0);
    }
    if (this.metrics.borderTop) {
      treesaver.dimensions.setCssPx(clone, 'borderTopWidth', 0);
    }
    if (this.metrics.paddingTop) {
      treesaver.dimensions.setCssPx(clone, 'paddingTop', 0);
    }
    html_zero = treesaver.dom.outerHTML(clone);
  }

  /**
   * HTML for opening tag when in progress
   * @type {?string}
   */
  this.openTag_zero = this.hasBlockChildren ?
    html_zero.substr(0, html_zero.indexOf('>') + 1) : null;
};

/**
 * Find the next block, never going to children
 *
 * @return {?treesaver.layout.Block} The next block in content that is not
 *                                   contained within this block
 */
treesaver.layout.Block.prototype.getNextNonChildBlock = function() {
  if (this.nextSibling) {
    return this.nextSibling;
  }
  else if (this.parent) {
    return this.parent.getNextNonChildBlock();
  }
  else {
    return null;
  }
};

/**
 * Note, this function is re-used by Content
 *
 * @param {!treesaver.layout.Block|treesaver.layout.Content} owner
 * @param {!Element} node
 * @param {!number} baseLineHeight
 * @param {!Object} indices Current block and figure index.
 * @param {?boolean=} isFallback Whether child figures should be ignored.
 * @return {{blocks: Array.<treesaver.layout.Block>, figures: Array.<treesaver.layout.Figure>}}
 */
treesaver.layout.Block.processChildren =
  function(owner, node, baseLineHeight, indices, isFallback) {
  var prev,
      isBlock = owner instanceof treesaver.layout.Block,
      // Is checking 'start' enough here?
      isList = node.nodeName.toLowerCase() === 'ol' && 'start' in node,
      listIndex = isList ? node.start : null;

  // This fix is specifically for Firefox which returns -1 when the
  // `start` or `value` attribute is not set.
  if (listIndex === -1) {
    listIndex = 1;
  }

  treesaver.array.toArray(node.childNodes).forEach(function(childNode) {
    var child;

    if (isList && childNode.nodeName.toLowerCase() === 'li') {
      // Zero value is ignored (i.e. you can't have item 0)
      if (childNode.value && childNode.value !== -1) {
        listIndex = childNode.value;
      }

      childNode.setAttribute('value', listIndex);
      listIndex += 1;
    }

    if (treesaver.layout.Figure.isFigure(childNode)) {
      // Want to prevent figures nested within fallbacks (gets confusing)
      if (isFallback) {
        treesaver.debug.warn('Child figure ignored');

        return; // Next
      }

      child = new treesaver.layout.Figure(childNode, baseLineHeight, indices);
      owner.figures.push(child);
      if ((child = child.fallback)) {
        child.isFallback = true;
        if (isBlock) {
          owner.containsFallback = true;
        }
      }
    }
    else {
      child = new treesaver.layout.Block(childNode, baseLineHeight, indices, !!isFallback);
      if (isBlock && !owner.containsFallback) {
        owner.containsFallback = child.containsFallback;
      }
    }

    if (child && !child.ignore) {
      owner.blocks = owner.blocks.concat(child, child.blocks || []);
      // TODO: Clear out children references and convert to indices?

      if (child.figures.length) {
        owner.figures = owner.figures.concat(child.figures);
        // No need to keep them in memory?
        delete child.figures;
      }

      // Keep track of hierarchy
      // But only if owner is a block (i.e. not Figure or Content)
      child.parent = isBlock ? owner : null;
      if (prev) {
        prev.nextSibling = child;
      }
      prev = child;
    }
  });
};

/**
 * @param {?boolean} useZero Whether the open tags should be the
 *                          zero-margin versions.
 * @return {string}
 */
treesaver.layout.Block.prototype.openAllTags = function(useZero) {
  var cur = this.parent,
      tags = [];

  while (cur) {
    // Insert in reverse order
    tags.unshift(useZero ? cur.openTag_zero : cur.openTag);
    cur = cur.parent;
  }

  return tags.join('');
};

/**
 * @return {string}
 */
treesaver.layout.Block.prototype.closeAllTags = function() {
  var cur = this.parent,
      tags = [];

  while (cur) {
    tags.push(cur.closeTag);
    cur = cur.parent;
  }

  return tags.join('');
};

/**
 * @return {number}
 */
treesaver.layout.Block.prototype.totalBpBottom = function() {
  var cur = this,
      total = cur.metrics.bpBottom;

  while ((cur = cur.parent)) {
    total += cur.metrics.bpBottom;
  }

  return total;
};

/**
 * Tries to detect whether this element has children that are blocks,
 * and should therefore be treated more like a <div> (or whatever)
 *
 * Assumptions:
 *   - See definitions for inline_containers and block_containers
 *   - If the element is not in either of those, then we test manually
 *
 * @param {!Element} node
 * @return {boolean} True if the node has children that are blocks.
 */
treesaver.layout.Block.hasBlockChildren = function(node) {
  // Assume paragraph nodes are never block parents
  if (treesaver.layout.Block.isInlineContainer(node)) {
    return false;
  }

  // Assume lists are containers
  if (treesaver.layout.Block.isBlockContainer(node)) {
    return true;
  }

  // Go through and test the hard way
  var i, len, child,
      childStyle, child_seen = false;

  for (i = 0, len = node.childNodes.length; i < len; i += 1) {
    child = node.childNodes[i];

    // Text node -- check if it's whitespace only
    if (child.nodeType === 3 && /[^\s]/.test(child.data)) {
      // Found non-whitespace text node, bow out now
      return false;
    }
    else if (child.nodeType === 1) {
      // If we see a container, then we are definitely a container ourselves
      if (treesaver.layout.Block.isInlineContainer(child) || treesaver.layout.Block.isBlockContainer(child)) {
        return true;
      }

      child_seen = true;
      childStyle = treesaver.css.getStyleObject(child);
      if (/inline/.test(childStyle.display)) {
        // Found an inline text node, bow out
        return false;
      }
      else if (/block/.test(childStyle.display)) {
        // Found a block, means we're a block too
        return true;
      }
    }

    // Ignore non-text, non-element nodes
  }

  // If we've made it this far, it means there are no inline or non-whitespace
  // text nodes, but there could also just be no nodes ... check and make sure
  return child_seen;
};

/**
 * TODO: Textarea, fieldset, and other forms?
 * TODO: Remove table
 * @type {Array.<string>}
 */
treesaver.layout.Block.replaced_elements = ['img', 'video', 'object', 'embed',
  'iframe', 'audio', 'canvas', 'svg', 'table'];

/**
 * @param {!Node} el
 * @return {boolean} True if the element is a replaced element.
 */
treesaver.layout.Block.isReplacedElement = function(el) {
  var nodeName = el.nodeName.toLowerCase();
  return el.nodeType === 1 &&
         treesaver.layout.Block.replaced_elements.indexOf(nodeName) !== -1;
};

/**
 * @type {Array.<string>}
 */
treesaver.layout.Block.inline_containers = ['p', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6'];

/**
 * @param {!Element} el
 * @return {boolean} True if the element is a replaced element.
 */
treesaver.layout.Block.isInlineContainer = function(el) {
  var nodeName = el.nodeName.toLowerCase();
  return el.nodeType === 1 &&
         treesaver.layout.Block.inline_containers.indexOf(nodeName) !== -1;
};

/**
 * @type {Array.<string>}
 */
treesaver.layout.Block.block_containers = ['div', 'article', 'ul', 'ol', 'figure', 'aside'];

/**
 * @param {!Element} el
 * @return {boolean} True if the element is a replaced element.
 */
treesaver.layout.Block.isBlockContainer = function(el) {
  var nodeName = el.nodeName.toLowerCase();
  return el.nodeType === 1 &&
         treesaver.layout.Block.block_containers.indexOf(nodeName) !== -1;
};

/**
 * Make sure this HTML node adheres to our strict standards
 *
 * @param {!Element} node
 * @param {!number} baseLineHeight
 * @return {Element} The same node passed in (for chaining).
 */
treesaver.layout.Block.sanitizeNode = function(node, baseLineHeight) {
  // Should never get text & comment nodes
  if (node.nodeType !== 1) {
    treesaver.debug.error('Text node sent to sanitize: ' + node);
    return node;
  }

  var i, childNode;

  // Cast for compiler type checks
  node = /** @type {Element} */ (node);

  // Remove IDs, since we can end up with more than one copy of an element
  // in the tree (across column splits, etc)
  node.removeAttribute('id');

  // Assumption is that the Figure can take care of it's own metrics
  if (treesaver.layout.Figure.isFigure(node)) {
    // TODO: Is there anything that might need to be fixed here?
    //   - Default sizes
    //   - Hybrid?
    return node;
  }

  // Strip out all non-element nodes (textnodes, comments) from block nodes
  if (treesaver.layout.Block.hasBlockChildren(node) && !treesaver.dom.hasClass(node, 'keeptogether')) {
    for (i = node.childNodes.length - 1; i >= 0; i -= 1) {
      childNode = node.childNodes[i];
      if (childNode.nodeType !== 1) {
        node.removeChild(childNode);
      }
      else {
        // Sanitize child nodes
        treesaver.layout.Block.sanitizeNode(childNode, baseLineHeight);
      }
    }
  }
  else {
    // No block nodes, nothing to do?
  }

  // Make sure all our metrics line up with our vertical grid
  if (!window.TS_NO_AUTOMETRICS) {
    treesaver.layout.Block.normalizeMetrics_(node, baseLineHeight);
  }

  return node;
};

/**
 * Normalize the margin, border, and padding to line up with the base
 * line height grid
 *
 * @private
 * @param {!Element} node
 * @param {!number} baseLineHeight
 */
treesaver.layout.Block.normalizeMetrics_ = function(node, baseLineHeight) {
  if (!baseLineHeight) {
    treesaver.debug.error('No line height provided to normalizeMetrics_');
  }

  var metrics = new treesaver.dimensions.Metrics(node);

  // Enforce margins that are multiples of base line height
  if (metrics.marginTop % baseLineHeight) {
    treesaver.dimensions.setCssPx(node, 'marginTop',
      treesaver.dimensions.roundUp(metrics.marginTop, baseLineHeight));
  }
  if (metrics.marginBottom % baseLineHeight) {
    treesaver.dimensions.setCssPx(node, 'marginBottom',
      treesaver.dimensions.roundUp(metrics.marginBottom, baseLineHeight));
  }

  // Special handling for unbreakable elements
  if (treesaver.layout.Block.isReplacedElement(node) || treesaver.dom.hasClass(node, 'keeptogether')) {
    // TODO: What if there are figures within a keeptogether?
    // Currently, ignore anything in a keeptogether (figures, children, etc)

    // Can't modify the metrics within a replaced element, so just
    // make sure that the outerHeight & margins work out OK
    if (metrics.outerH % baseLineHeight) {
      treesaver.dimensions.setCssPx(node, 'paddingBottom', metrics.paddingBottom +
          baseLineHeight - metrics.outerH % baseLineHeight);
    }

    // Done
    return node;
  }

  // Enforce a line height that is a multiple of the base line height
  if (!metrics.lineHeight) {
    metrics.lineHeight = baseLineHeight;
    treesaver.dimensions.setCssPx(node, 'lineHeight', baseLineHeight);
  }
  else if (metrics.lineHeight % baseLineHeight) {
    treesaver.dimensions.setCssPx(node, 'lineHeight',
      treesaver.dimensions.roundUp(metrics.lineHeight, baseLineHeight));
  }

  // Make sure border & padding match up
  if (metrics.bpTop % baseLineHeight) {
    treesaver.dimensions.setCssPx(node, 'paddingTop',
      treesaver.dimensions.roundUp(metrics.bpTop, baseLineHeight) -
      metrics.borderTop);
  }
  if (metrics.bpBottom % baseLineHeight) {
    metrics.paddingBottom = treesaver.dimensions.setCssPx(node, 'paddingBottom',
      treesaver.dimensions.roundUp(metrics.bpBottom, baseLineHeight) -
      metrics.borderBottom);
  }

  // (Potentially) changed padding and line-height, so update outerH
  metrics.outerH = treesaver.dimensions.getOffsetHeight(node);

  // Sanity check to make sure something out of our control isn't
  // happening
  if (metrics.outerH % baseLineHeight) {
    // Shit, looks like even with the normalization, we're still out of
    // sync. Use padding bottom to fix it up
    treesaver.debug.info('Forcing padding due to mismatch: ' + node);

    metrics.paddingBottom += baseLineHeight - metrics.outerH % baseLineHeight;

    // Now re-set the paddingBottom
    treesaver.dimensions.setCssPx(node, 'paddingBottom', metrics.paddingBottom);
  }

  return node;
};

if (goog.DEBUG) {
  treesaver.layout.Block.prototype.toString = function() {
    return '[Block: ' + this.metrics.outerH + '/' +
      this.metrics.lineHeight + ']';
  };
}

// Input 19
/**
 * @fileoverview The Content class.
 */

goog.provide('treesaver.layout.Content');

goog.require('treesaver.css');
goog.require('treesaver.debug');
goog.require('treesaver.dimensions');
goog.require('treesaver.dom');
goog.require('treesaver.layout.Block');

/**
 * A chunk of content
 *
 * @constructor
 * @param {!Element} el HTML node which contains all content.
 */
treesaver.layout.Content = function(el) {
  var indices = {
    index: 0,
    figureIndex: 0
  };

  /**
   * Base line height used throughout the article
   * TODO: More intelligent back-up value
   *
   * @type {number}
   */
  this.lineHeight = treesaver.dimensions.toPixels(el,
    treesaver.css.getStyleObject(el).lineHeight
  ) || 1;

  /**
   * The column width at which this content was measured
   *
   * @type {number}
   */
  this.colWidth = el.offsetWidth;

  // In order to properly measure the dimensions of all the content,
  // we need to hide all figures to prevent them from being laid out
  // This causes no harm, since the actual <figure> element is always
  // stripped out of the content
  // TODO: Even without doing harm, this is a silly hack and it'd be
  // better to find a good way to deal with this situation.
  treesaver.dom.getElementsByTagName('figure', el).forEach(function(figure) {
    figure.style.display = 'none';
  });

  // Before we go through and construct our data objects, it really
  // pays off to sanitize all the content, correcting for invalid
  // line height, margins, etc, etc
  // Note that this modifies the tree in place
  treesaver.layout.Block.sanitizeNode(el, this.lineHeight);

  /**
   * @type {Array.<treesaver.layout.Figure>}
   */
  this.figures = [];

  /**
   * @type {Array.<treesaver.layout.Block>}
   */
  this.blocks = [];

  // Now we're ready to create our objects, re-use the processChildren
  // function because it does exactly what we need
  treesaver.layout.Block.processChildren(this, el, this.lineHeight, indices);

  /**
   * Dictionary of fields and values that can be populated
   * in a grid
   * @type {Object.<string, string>}
   */
  this.fields = {};

  // Extract the microdata items and normalize them (i.e. pick the last item
  // of each itemprop and pull properties up to the global field object.)
  treesaver.microdata.getJSONItems(null, el).forEach(function(item) {
    var scope = treesaver.microdata.normalizeItem(item),
        keys = treesaver.object.keys(scope);

    keys.forEach(function(key) {
      if (!this.fields[key]) {
        this.fields[key] = scope[key];
        treesaver.debug.info('Field found --- ' + key + ': ' + scope[key].toString());
      }
    }, this);
  }, this);
};

if (goog.DEBUG) {
  treesaver.layout.Content.prototype.toString = function() {
    return '[Content]';
  };
}

// Input 20
/**
 * @fileoverview Column data structure.
 */

goog.provide('treesaver.layout.Column');

goog.require('treesaver.dimensions');
goog.require('treesaver.dom');

/**
 * A column within a grid
 *
 * @constructor
 * @param {!Element} el         HTML element.
 * @param {number}   gridHeight The height of the grid that contains this column.
 */
treesaver.layout.Column = function(el, gridHeight) {
  var d = new treesaver.dimensions.Metrics(el);

  /**
   * @type {boolean}
   */
  this.flexible = !treesaver.dom.hasClass(el, 'fixed');

  /**
   * @type {number}
   */
  this.minH = d.minH;

  // Need to clear the minHeight, if there is one, in order to get an accurate
  // delta reading
  if (this.minH) {
    treesaver.dimensions.setCssPx(el, 'minHeight', 0);
  }

  /**
   * @type {number}
   */
  this.h = d.outerH;

  /**
   * @type {number}
   */
  this.delta = Math.max(0, gridHeight - this.h);
};

/**
 * @param {number} gridHeight
 * @return {!treesaver.layout.Column} Returns self for chaining support.
 */
treesaver.layout.Column.prototype.stretch = function stretchColumn(gridHeight) {
  if (!this.flexible) {
    return this;
  }

  this.h = Math.max(0, gridHeight - this.delta);

  return this;
};

if (goog.DEBUG) {
  treesaver.layout.Column.prototype.toString = function toString() {
    return '[Column ' + this.h + '/' + this.delta + ']';
  };
}

// Input 21
/**
 * @fileoverview Container data structure.
 */

goog.provide('treesaver.layout.Container');

goog.require('treesaver.dimensions');
goog.require('treesaver.dom');

/**
 * A column within a grid
 *
 * @constructor
 * @param {!Element} el         HTML element.
 * @param {number}   gridHeight The height of the grid that contains this container.
 */
treesaver.layout.Container = function(el, gridHeight) {
  var d = new treesaver.dimensions.Metrics(el);

  /**
   * @type {boolean}
   */
  this.flexible = !treesaver.dom.hasClass(el, 'fixed');

  /**
   * @type {number}
   */
  this.minH = d.minH;

  // Need to clear the minHeight, if there is one, in order to get an accurate
  // delta reading
  if (this.minH) {
    treesaver.dimensions.setCssPx(el, 'minHeight', 0);
  }

  /**
   * @type {number}
   */
  this.h = d.outerH;

  /**
   * @type {number}
   */
  this.delta = Math.max(0, gridHeight - this.h);

  var sizesProperty = el.getAttribute('data-sizes');

  /**
   * @type {!Array.<string>}
   */
  this.sizes = sizesProperty ? sizesProperty.split(' ') : [];
};

/**
 * @param {number} gridHeight
 * @return {!treesaver.layout.Container} Returns self for chaining support.
 */
treesaver.layout.Container.prototype.stretch = function stretchContainer(gridHeight) {
  if (!this.flexible) {
    return this;
  }

  this.h = Math.max(0, gridHeight - this.delta);

  return this;
};

if (goog.DEBUG) {
  treesaver.layout.Container.prototype.toString = function toString() {
    return '[Container ' + this.h + '/' + this.delta + ']';
  };
}

// Input 22
/**
 * @fileoverview A skeleton of page, later filled with content.
 */

goog.provide('treesaver.layout.Grid');

goog.require('treesaver.array');
goog.require('treesaver.capabilities');
goog.require('treesaver.debug');
goog.require('treesaver.dom');
goog.require('treesaver.dimensions');
goog.require('treesaver.layout.Block');
goog.require('treesaver.layout.BreakRecord');
goog.require('treesaver.layout.Column');
goog.require('treesaver.layout.Container');
goog.require('treesaver.layout.Figure');

/**
 * Grid class
 * @constructor
 * @param {!Element} node HTML root for grid.
 */
treesaver.layout.Grid = function(node) {
  if (goog.DEBUG) {
    if (!node || !treesaver.dom.hasClass(node, 'grid')) {
      treesaver.debug.error('Non grid passed to initGrid');
    }
  }

  // Insert into tree for measuring
  document.body.appendChild(node);

  /**
   * List of required capabilities for this Grid
   * TODO: Only store mutable capabilities
   *
   * @type {?Array.<string>}
   */
  this.requirements = treesaver.dom.hasAttr(node, 'data-requires') ?
    node.getAttribute('data-requires').split(' ') : null;

  /**
   * @type {Array.<string>}
   */
  this.classes = treesaver.dom.classes(node, true);

  /**
   * @type {boolean}
   */
  this.flexible = !treesaver.dom.hasClass(node, 'fixed');

  /**
   * @type {Object.<string, boolean>}
   */
  this.scoringFlags;

  /**
   * @type {?Object.<number, boolean>}
   */
  this.pageNumberFlags;

  /**
   * @type {?Object.<number, boolean>}
   */
  this.pageNumberNegationFlags;

  // Calculate all page scoring flags
  this.findScoringFlags();

  // Sizing
  // Flex grids get stretched later
  this.stretchedSize = this.size = new treesaver.dimensions.Metrics(node);
  if (!this.flexible) {
    this.size.minH = this.size.h;
    this.size.minW = this.size.w;
  }
  else {
    // Use width instead of minWidth
    this.size.minW = Math.max(this.size.minW || 0, this.size.w);
  }
  // Line height needs to be set for stretch sizing ...
  // TODO: What's a reasonable back-up value here?
  this.lineHeight = this.size.lineHeight || 1;

  /**
   * @type {number}
   */
  this.textHeight = 0;

  /**
   * @type {number}
   */
  this.maxColHeight = 0;

  /**
   * Width of columns used in this Grid
   * @type {number}
   */
  this.colWidth = 0;

  /**
   * @type {boolean}
   */
  this.error = false;

  /**
   * @type {Array.<treesaver.layout.Column>}
   */
  this.cols = [];
  treesaver.dom.getElementsByClassName('column', node).forEach(function(colNode) {
    var cur = new treesaver.layout.Column(colNode, this.size.h);
    this.cols.push(cur);

    // Calculate total height
    this.textHeight += cur.h;
    this.maxColHeight = Math.max(this.maxColHeight, cur.h);

    // Confirm column width
    if (!this.colWidth) {
      this.colWidth = colNode.offsetWidth;
    }
    else if (this.colWidth !== colNode.offsetWidth) {
      treesaver.debug.error('Inconsistent column widths in grid');

      this.error = true;
    }
  }, this);

  /**
   * @type {Array.<treesaver.layout.Container>}
   */
  this.containers = [];
  treesaver.dom.getElementsByClassName('container', node).forEach(function(containerNode) {
    var cur = new treesaver.layout.Container(containerNode, this.size.h);
    this.containers.push(cur);
  }, this);

  // Save out the HTML after processing Columns and Containers, in order to maintain
  // any sanitization that may have occurred.
  /**
   * @type {string}
   */
  this.html = treesaver.dom.outerHTML(node);

  // Remove the child
  document.body.removeChild(node);
};

treesaver.layout.Grid.knownFlags = {
  'onlypage': true,
  'odd': true,
  'even': true,
  'sizetocontainer': true
};

treesaver.layout.Grid.pageFlagRegex = /^(no-)?page-(\d+)$/;

/**
 * Parse the class array and find any scoring flags
 */
treesaver.layout.Grid.prototype.findScoringFlags = function() {
  var pageNumberFlagFound = false,
      match, index;

  this.scoringFlags = {};
  this.pageNumberFlags = {};
  this.pageNumberNegationFlags = {};

  this.classes.forEach(function(className) {
    if (className in treesaver.layout.Grid.knownFlags) {
      this.scoringFlags[className] = true;
    }
    else if ((match = treesaver.layout.Grid.pageFlagRegex.exec(className))) {
      index = parseInt(match[2], 10);

      if (!isNaN(index)) {
        if (className.substr(0, 3) === 'no-') {
          this.pageNumberNegationFlags[index] = true;
        }
        else {
          pageNumberFlagFound = true;
          this.pageNumberFlags[index] = true;
        }
      }
    }
  }, this);

  if (!pageNumberFlagFound) {
    this.pageNumberFlags = null;
  }
};

/**
 * Stretch the height of a grid
 * @param {number} totalHeight The maximum possible height (including margin,
 *                             border, and padding) of the grid.
 */
treesaver.layout.Grid.prototype.stretch = function(totalHeight) {
  if (!this.flexible) {
    return this;
  }

  var i, len, cur,
      contentHeight = totalHeight -
        (this.size.marginHeight + this.size.bpHeight),
      finalHeight = Math.min(this.size.maxH,
          Math.max(contentHeight, this.size.minH)),
      delta = finalHeight - this.size.minH || 0;

  // Our height is always min plus a multiple of lineheight
  finalHeight -= delta % this.lineHeight;

  this.maxColHeight = 0;

  this.textHeight = 0;
  // Stretch columns and compute new heights
  this.cols.forEach(function(col) {
    this.textHeight += col.stretch(finalHeight).h;
    this.maxColHeight = Math.max(this.maxColHeight, col.h);
  }, this);

  // Stretch containers
  this.containers.forEach(function(container) {
    container.stretch(finalHeight);
  }, this);

  this.stretchedSize = this.size.clone();
  this.stretchedSize.h = finalHeight;
  this.stretchedSize.outerH = finalHeight + this.size.bpHeight;

  // Max
  if (!this.scoringFlags['sizetocontainer']) {
    this.stretchedSize.maxH =
      Math.min(this.size.maxH, finalHeight + this.lineHeight * 3);
  }
  else {
    this.stretchedSize.maxH = this.size.maxH;
  }

  return this;
};

/**
  * Comparison function for sorting grids
  * @param {!treesaver.layout.Grid} a
  * @param {!treesaver.layout.Grid} b
  */
treesaver.layout.Grid.sort = function(a, b) {
  // Sort by column and container count, descending
  // Note: Grids should be stretched beforehand
  return (b.size.w + 20 * b.containers.length) -
    (a.size.w + 20 * a.containers.length);
};

/**
  * Compute the score for this grid given the current state
  * of pagination
  * @param {!treesaver.layout.Content} content
  * @param {!treesaver.layout.BreakRecord} breakRecord
  */
treesaver.layout.Grid.prototype.score = function(content, breakRecord) {
  var score = 0,
      humanPageNum = breakRecord.pageNumber + 1;

  // Bonus for higher column count
  score += this.cols.length * treesaver.layout.Grid.SCORING.COLUMN;
  // Penalize for incompatible line heights
  if (this.lineHeight !== content.lineHeight) {
    score -= treesaver.layout.Grid.SCORING.DIFFERENT_LINEHEIGHT;
  }

  if (this.colWidth && this.colWidth !== content.colWidth) {
    score -= treesaver.layout.Grid.SCORING.DIFFERENT_COLWIDTH;
  }

  // Page flags
  if (this.scoringFlags['onlypage']) {
    // TODO: Use different values for penalties and bonuses
    score += breakRecord.pageNumber ? -treesaver.layout.Grid.SCORING.NON_ONLY_PAGE :
      treesaver.layout.Grid.SCORING.ONLY_PAGE;
  }

  // Check general page number flag
  if (this.pageNumberFlags) {
    if (this.pageNumberFlags[humanPageNum]) {
      score += treesaver.layout.Grid.SCORING.PAGE_NUMBER;
    }
    else {
      score -= treesaver.layout.Grid.SCORING.NON_PAGE_NUMBER;
    }
  }

  // Check negations
  if (this.pageNumberNegationFlags[humanPageNum]) {
    score -= treesaver.layout.Grid.SCORING.NON_PAGE_NUMBER;
  }

  if (humanPageNum % 2) {
    score += this.scoringFlags['odd'] ? treesaver.layout.Grid.SCORING.ODD_PAGE :
      this.scoringFlags['even'] ? -treesaver.layout.Grid.SCORING.NON_EVEN_ODD : 0;
  }
  else {
    score += this.scoringFlags['even'] ? treesaver.layout.Grid.SCORING.EVEN_PAGE :
      this.scoringFlags['odd'] ? -treesaver.layout.Grid.SCORING.NON_EVEN_ODD : 0;
  }

  return score;
};

/**
 * Typedef for compiler
 * TODO: Make a real typedef
 *
 * @typedef {{figureIndex, figureSize, flexible}}
 */
treesaver.layout.Grid.ContainerMap;

/**
  * @param {!treesaver.layout.Content} content
  * @param {!treesaver.layout.BreakRecord} br
  * @return {!Array.<treesaver.layout.Grid.ContainerMap>}
  */
treesaver.layout.Grid.prototype.mapContainers = function(content, br) {
  var i, len, container,
      k, size,
      figureIndex, currentIndex,
      figure, figureSize, figures,
      delayed, usingDelayed,
      map = [];

  // Loop through each container and see if we have a figure that fits
  container_loop:
  for (i = 0, len = this.containers.length; i < len; i += 1) {
    container = this.containers[i];
    map[i] = null;
    figureIndex = br.figureIndex;
    // Duplicate the delayed array
    delayed = br.delayed.slice(0);

    figure_loop:
    while (delayed.length || figureIndex < content.figures.length) {
      // Go through delayed/skipped figures first
      if ((usingDelayed = !!delayed.length)) {
        // Take the oldest figure first
        currentIndex = delayed.shift();
      }
      else {
        currentIndex = figureIndex;
      }
      figure = content.figures[currentIndex];

      // Start at the end of the size list in order to find
      // the highest possible match
      size_loop:
      for (k = container.sizes.length - 1; k >= 0; k -= 1) {
        size = container.sizes[k];

        // TODO: Watch for previous failures at this size

        figureSize = figure.getSize(size);

        if (figureSize) {
          // Make sure the height fits for flexible containers
          // Fixed containers should know better than to specify
          // a size that doesn't fit
          if (container.flexible && figureSize.minH &&
              figureSize.minH > container.h) {
            // This size won't work, go to the next
            continue size_loop;
          }

          // Container fits, store mapping
          map[i] = {
            figureIndex: currentIndex,
            figureSize: figureSize,
            size: size,
            // Also used for scoring
            flexible: container.flexible
          };

          // Mark the figure as used
          br.useFigure(currentIndex);

          // This container is filled, move on to the next container
          break figure_loop;
        }
      } // size_loop

      // Required figures must occur in-order
      if (!figure.optional) {
        // Can't move on to the next figure since it might cause
        // incorrect order
        // TODO: See if this figure could fit in other containers
        // Or perhaps flip order around to look at figures first, then
        // containers
        break;
      }

      // Try the next figure
      if (!usingDelayed) {
        figureIndex += 1;
      }
    } // figure_loop
  } // container_loop

  return map;
};

/**
 * @param {!string} themeName
 * @return {boolean} True if the grid is compatible with the given theme
 */
treesaver.layout.Grid.prototype.hasTheme = function(themeName) {
  return this.classes.indexOf(themeName) !== -1;
};

/**
 * Eliminate a grid if it does not meet the current browser capabilities
 *
 * @return {boolean} False if the grid does not qualify
 */
treesaver.layout.Grid.prototype.capabilityFilter = function() {
  if (!this.requirements) {
    return true;
  }

  return treesaver.capabilities.check(this.requirements, true);
};

/**
 * Eliminate a grid if it does not fit within the specified size
 *
 * @param {!treesaver.dimensions.Size} size
 * @return {boolean} False if the grid does not qualify
 */
treesaver.layout.Grid.prototype.sizeFilter = function(size) {
  var innerSize = {
    w: size.w - this.size.bpWidth, // Don't use margin for width
    h: size.h - this.size.bpHeight - this.size.marginHeight
  };

  return treesaver.dimensions.inSizeRange(this.size, innerSize);
};

treesaver.layout.Grid.SCORING = {
  FINISH_TEXT: 250,
  FINISH_ALL: 2000,
  FIXED_CONTAINER: 5000,
  COLUMN: 50,
  EMPTINESS_PENALTY: 2000,
  EMPTY_CONTAINER_PENALTY: 5000,
  DIFFERENT_LINEHEIGHT: 2000,
  DIFFERENT_COLWIDTH: Infinity,
  CONTAINER_BONUS: 2000,
  CONTAINER_AREA_BONUS: 5,
  BLOCK_DELAY_PENALTY: 100,
  REQUIRED_BLOCK_BONUS: 4000,
  PAGE_NUMBER: 3000,
  ONLY_PAGE: 4000,
  ODD_PAGE: 2000,
  EVEN_PAGE: 2000,
  NON_EVEN_ODD: Infinity,
  NON_ONLY_PAGE: Infinity,
  NON_PAGE_NUMBER: Infinity
};

/**
  * Find the best grid for given content
  * @param {!treesaver.layout.Content} content
  * @param {!Array.<treesaver.layout.Grid>} grids
  * @param {!treesaver.layout.BreakRecord} breakRecord
  * @return {?{grid: !treesaver.layout.Grid, containers: !Array.<treesaver.layout.Grid.ContainerMap>}}
  */
treesaver.layout.Grid.best = function(content, grids, breakRecord) {
  if (goog.DEBUG) {
    if (!content) {
      treesaver.debug.error('No content passed to grid.best');
    }
    else if (!grids.length) {
      treesaver.debug.error('No grids passed to grid.best');
    }
    else if (!breakRecord) {
      treesaver.debug.error('No breakRecord passed to grid.best');
    }
  }

  var best = null,
      highScore = -Infinity,
      percentEmpty,
      containerMap,
      // Content block loop
      blockCount = content.blocks.length,
      block, blockHeightEstimate, figure,
      // Grid loop
      i, len, cur, br, score, height, remaining_height,
      // Container loop
      j, jlen, container, mapped_container, filledContainerCount, blockAdded;

  // Loop through each grid
  grid_loop:
  for (i = 0, len = grids.length; i < len; i += 1) {
    cur = grids[i];
    filledContainerCount = 0;
    blockAdded = false;
    br = breakRecord.clone();
    height = br.overhang;
    remaining_height = cur.textHeight - height;
    if (height && cur.textHeight) {
      // Overhang counts as a block
      blockAdded = true;
    }

    // Calculate score quickly based on easy information
    score = cur.score(content, br);

    // Create container map
    containerMap = cur.mapContainers(content, br);

    // Calculate container score
    container_loop:
    for (j = 0, jlen = containerMap.length; j < jlen; j += 1) {
      container = cur.containers[j];
      mapped_container = containerMap[j];

      if (mapped_container) {
        figure = content.figures[mapped_container.figureIndex];

        score += treesaver.layout.Grid.SCORING.CONTAINER_BONUS +
          (mapped_container.figureSize.minH) *
          treesaver.layout.Grid.SCORING.CONTAINER_AREA_BONUS;

        if (!figure.optional) {
          score += treesaver.layout.Grid.SCORING.REQUIRED_BLOCK_BONUS;
        }

        // Bonus for a fixed container
        if (!container.flexible) {
          score += treesaver.layout.Grid.SCORING.FIXED_CONTAINER;
        }

        filledContainerCount += 1;
      }
      else if (!container.flexible) {
        score -= treesaver.layout.Grid.SCORING.EMPTY_CONTAINER_PENALTY;
      }
    }

    // Loop through blocks to figure out text fitting
    block_loop:
    while (cur.textHeight &&
           br.index < blockCount && height <= cur.textHeight) {
      block = content.blocks[br.index];
      // Just an estimate
      blockHeightEstimate = block.metrics.outerH + block.metrics.marginTop;

      if (block.keeptogether &&
          (blockHeightEstimate > cur.maxColHeight ||
           blockHeightEstimate > remaining_height)) {
        // Can't add block, leave loop
        break block_loop;
      }

      if (blockHeightEstimate > remaining_height) {
        // Can't add the block, leave loop
        if (block.keeptogether) {
          break block_loop;
        }

        // Go to first child
        if (block.children) {
          br.index += 1;
          continue block_loop;
        }

        // Put part of the block in
        height += blockHeightEstimate;
        // TODO: Track overhang?
      }

      // Block fits, stuff it in
      height += blockHeightEstimate;
      score += blockHeightEstimate;
      remaining_height -= blockHeightEstimate;

      blockAdded = true;
      // Go to the next sibling (or pop out if there is none)
      br.index = block.nextSibling ? block.nextSibling.index : br.index + 1;
    } // block_loop

    // Check for forward progress
    if (!blockAdded) {
      if (!filledContainerCount) {
        // Avoid completely empty grids (will cause loops?)
        score = -Infinity;
      }
      else {
        // The current/next block
        block = content.blocks[br.index];

        // Is this block part of a fallback for a required figure?
        if (block && block.figure && !block.figure.optional) {
          // If so, check if we've already started displaying the fallback for this figure
          if (br.overhang || block.withinFallback) {
            treesaver.debug.warn('No forward progress on required figure fallback');
            // Must make forward progress on open required figure, penalize severely
            score = -Infinity;
          }
        }
      }
    }
    else if (remaining_height > 0) {
      // Penalize for emptiness, based on percentage
      percentEmpty = remaining_height / cur.textHeight;

      // Filled containers make it hard to estimate how full the page really
      // is, so give a 20% bonus per container
      percentEmpty -= filledContainerCount * .2;

      if (percentEmpty > .5) {
        treesaver.debug.info('Grid penalized for emptiness percentage: ' + percentEmpty * 100);
        score -= remaining_height;
        score -= percentEmpty * percentEmpty *
          treesaver.layout.Grid.SCORING.EMPTINESS_PENALTY;
      }
    }

    if (score > highScore) {
      highScore = score;
      best = {
        grid: cur,
        containers: containerMap
      };
    }
  } // grid_loop

  return best;
};

if (goog.DEBUG) {
  treesaver.layout.Grid.prototype.toString = function() {
    return "[Grid " + this.classes + "]";
  };
}

// Input 23
goog.provide('treesaver.layout.Page');

goog.require('treesaver.array');
goog.require('treesaver.dimensions');
goog.require('treesaver.dom');
goog.require('treesaver.layout.BreakRecord');
goog.require('treesaver.layout.Grid');
goog.require('treesaver.layout.Block');

/**
  * Page class
  * @constructor
  * @param {!treesaver.layout.Content} content
  * @param {!Array.<treesaver.layout.Grid>} grids
  * @param {!treesaver.layout.BreakRecord} br The current breakRecord.
  */
treesaver.layout.Page = function(content, grids, br) {
  var best = treesaver.layout.Grid.best(content, grids, br),
      host = document.createElement('div'),
      originalBr = br.clone(),
      containerFilled = false;

  /**
   * @type {boolean}
   */
  this.ignore;

  if (!best || !best.grid) {
    // Might have leftover figures that just won't fit
    br.finished = br.atEnd(content) ||
    br.figureIndex === content.figures.length;

    if (br.finished) {
      treesaver.debug.info('Finished article in face of error.');
      this.ignore = true;
    }
    else {
      treesaver.debug.error('No best grid found: ' + arguments);
      this.error = true;
    }

    return;
  }

  // Store state
  /**
   * @type {!treesaver.dimensions.Metrics}
   */
  this.size = best.grid.stretchedSize.clone();
  /**
   * @type {!treesaver.layout.ContentPosition}
   */
  this.begin = br.getPosition();

  // Create our host for measuring and producing HTML
  treesaver.dom.addClass(host, 'offscreen');
  // TODO: Only add to body if needed?
  // TODO: Perhaps not, since IE has innerHTML issues when disconnected
  document.body.appendChild(host);
  host.innerHTML = best.grid.html;
  /**
   * @type {?Element}
   */
  this.node = /** @type {!Element} */ (host.firstChild);

  // Manually set dimensions on the page
  treesaver.dimensions.setCssPx(this.node, 'width', this.size.w);
  treesaver.dimensions.setCssPx(this.node, 'height', this.size.h);

  // Fill in fields
  treesaver.object.keys(content.fields || {}).forEach(function(key) {
    var fields = treesaver.template.getElementsByBindName(key, null, this.node);

    fields.forEach(function(node) {
      var view = {};

      view[key] = content.fields[key];

      treesaver.layout.Page.fillField(node, view);
    });
  }, this);

  // Containers
  treesaver.dom.getElementsByClassName('container', this.node).forEach(function(containerNode, i) {
    var mapping = best.containers[i],
        figure, figureIndex, success;

    if (mapping) {
      figureIndex = mapping.figureIndex;
      figure = content.figures[figureIndex];
      success = treesaver.layout.Page.fillContainer(containerNode, figure, mapping,
        content.lineHeight);

      // Account for the figure we used
      if (success) {
        br.useFigure(figureIndex);
        containerFilled = true;

        // Need to store some extra data when supporting zoom
        if (figure.zoomable) {
          treesaver.dom.addClass(containerNode, 'zoomable');
          containerNode.setAttribute('data-figureindex', figureIndex);
          if (WITHIN_IOS_WRAPPER || treesaver.capabilities.SUPPORTS_TOUCH) {
            // Need dummy handler in order to get bubbled events
            containerNode.setAttribute('onclick', 'void(0)');
          }
        }

        // Size to the container
        if (i === 0 && best.grid.scoringFlags['sizetocontainer']) {
          this.size.h = treesaver.dimensions.getOffsetHeight(containerNode) +
            best.grid.containers[0].delta;
          this.size.outerH = this.size.h + this.size.bpHeight;
          treesaver.dimensions.setCssPx(/** @type {!Element} */ (this.node), 'height', this.size.h);
        }
      }
      else {
        treesaver.debug.info('Container failure, figureIndex: ' + figureIndex);

        // TODO: Note more info about failure? E.g. target size and actual size, etc
        if (!figure.optional && figure.fallback) {
          // Required figures with fallbacks must be preserved, delay instead of
          // failing
          // TODO: How to make sure we don't continually re-try the delayed figure?
          br.delayFigure(figure.figureIndex);
        }
        else {
          // Don't mark the figure as failed if the container was reduced in size
          if (!treesaver.dom.hasClass(containerNode, 'flexed')) {
            br.failedFigure(figureIndex);
          }
        }

        // Remove node for easier styling
        containerNode.parentNode.removeChild(containerNode);
      }
    }
    else {
      // No node, remove
      containerNode.parentNode.removeChild(containerNode);
    }
  }, this);

  // Columns
  treesaver.dom.getElementsByClassName('column', this.node).forEach(function(colNode, i) {
    var col = best.grid.cols[i];
    treesaver.layout.Page.fillColumn(content, br, colNode,
      best.grid.maxColHeight, col.minH);
  });

  // Check if there was forward progress made
  if (originalBr.equals(br)) {
    treesaver.debug.error('No progress made in pagination: ' + arguments + best);
    this.error = true;
  }
  else if (!containerFilled && best.grid.scoringFlags['sizetocontainer']) {
    treesaver.debug.warn('sizetocontainer not filled, page ignored');
    // Couldn't fill the container, ignore this page
    this.ignore = true;
  }
  else {
    // Centers the page vertically with less work for us
    treesaver.dimensions.setCssPx(this.node, 'marginTop', -this.size.outerH / 2);

    /**
     * @type {string}
     */
    this.html = host.innerHTML;

    /**
     * @type {!treesaver.layout.ContentPosition}
     */
    this.end = br.getPosition();

    // Page is not yet active
    /**
     * @type {boolean}
     */
    this.active = false;

    // Increment page number
    br.pageNumber += 1;

    // Are we finished?
    br.finished = best.grid.scoringFlags['onlypage'] || br.atEnd(content);
  }

  // Cleanup
  host.removeChild(this.node);
  this.node = null;
  document.body.removeChild(host);
  host = null;
};

/**
 * @param {!Element} container
 * @param {!treesaver.layout.Figure} figure
 * @param {!treesaver.layout.Grid.ContainerMap} map
 * @param {?number} lineHeight
 * @return {boolean} True if the figure fit within the container.
 */
treesaver.layout.Page.fillContainer = function(container, figure, map,
    lineHeight) {
  var size, figureSize,
      containerHeight, sibling,
      maxContainerHeight,
      anchoredTop = true;

  size = map.size;
  figureSize = map.figureSize;

  if (goog.DEBUG) {
    if (!size) {
      treesaver.debug.error('Empty size!');
    }

    if (!figureSize) {
      treesaver.debug.error('Empty figureSize!');
    }
  }

  maxContainerHeight = treesaver.dimensions.getOffsetHeight(container);

  // Do any content switching that needs to happen
  figureSize.applySize(container, size);

  // If the container is fixed, then we are done no matter what
  if (!map.flexible) {
    return true;
  }

  // Adjust flexible containers

  // Unhinge from a side before measuring
  if (treesaver.dom.hasClass(container, 'bottom')) {
    anchoredTop = false;
    container.style.top = 'auto';
  }
  else {
    container.style.bottom = 'auto';
  }

  containerHeight = treesaver.dimensions.getOffsetHeight(container);

  // Did not fit :(
  // TODO: Use something better than parent height
  if (containerHeight > maxContainerHeight) {
    treesaver.debug.info('Container failure: ' + containerHeight + ':' + maxContainerHeight);

    if (goog.DEBUG) {
      container.setAttribute('data-containerHeight', containerHeight);
      container.setAttribute('data-maxHeight', maxContainerHeight);
      container.setAttribute('data-attemptedSize', size);
    }

    // Revert after failure
    figureSize.revertSize(container, size);

    // TODO: Return style.bottom & style.top to originals?

    return false;
  }

  // Round to nearest for column adjustment to maintain grid
  if (lineHeight && containerHeight % lineHeight) {
    containerHeight = treesaver.dimensions.roundUp(containerHeight, lineHeight);
  }

  // Go through this containers siblings, adjusting their sizes
  sibling = container;
  while ((sibling = sibling.nextSibling)) {
    if (sibling.nodeType !== 1) {
      // Ignore non-elements
      continue;
    }

    // Cast for compiler
    sibling = /** @type {!Element} */ (sibling);

    // Don't touch fixed items
    if (treesaver.dom.hasClass(sibling, 'fixed')) {
      continue;
    }

    if (treesaver.dom.hasClass(sibling, 'column') ||
        treesaver.dom.hasClass(sibling, 'container') ||
        treesaver.dom.hasClass(sibling, 'group')) {
      // Add a flag for debugging / later detection
      treesaver.dom.addClass(sibling, 'flexed');

      // Make sure we don't go negative
      if (treesaver.dimensions.getOffsetHeight(sibling) <= containerHeight) {
        treesaver.debug.info('Sibling shrunk to zero height: ' + sibling);
        // TODO: Remove from tree?
        treesaver.dimensions.setCssPx(sibling, 'height', 0);
      }
      else {
        // Since items are always absolutely positioned, we can
        // adjust the position of the column directly based on it's
        // offsets
        if (anchoredTop) {
          treesaver.dimensions.setCssPx(sibling, 'top',
            treesaver.dimensions.getOffsetTop(sibling) + containerHeight);
        }
        else {
          // Compute the current 'bottom' value by using the parent's offsetHeight
          treesaver.dimensions.setCssPx(sibling, 'bottom',
            treesaver.dimensions.getOffsetHeight(sibling.offsetParent) -
            (treesaver.dimensions.getOffsetTop(sibling) + treesaver.dimensions.getOffsetHeight(sibling)) + containerHeight);
        }
      }
    }
  }

  return true;
};

/**
  * @param {!treesaver.layout.Content} content
  * @param {!treesaver.layout.BreakRecord} br
  * @param {!Element} node
  * @param {number} maxColHeight
  * @param {number} minH Minimum height of the column.
  */
treesaver.layout.Page.fillColumn = function(content, br, node, maxColHeight, minH) {
  var colHeight = treesaver.dimensions.getOffsetHeight(node),
      height = 0,
      remainingHeight,
      firstBlock,
      isFirstBlock = true,
      initMarginTop = 0,
      marginAndFirstLine = 0,
      marginTop = 0,
      marginBottom = 0,
      blockStrings = [],
      blockCount = content.blocks.length,
      block = content.blocks[br.index],
      nextSibling,
      nextNonChild,
      parent, closeTags = [],
      effectiveBlockHeight,
      finishColumn = false,
      // Dumb heuristic for indicating whether this is a "short" column
      // TODO: Any special logic with flexed columns?
      shortColumn = (maxColHeight / colHeight) > 1.5;

  // Is there any content left?
  if (!block) {
    // TODO: Remove column element altogether?
    return;
  }

  // TODO: Is this right?
  // Make sure colHeight is on our verticl grid
  if (colHeight % content.lineHeight) {
    colHeight -= colHeight % content.lineHeight;
  }

  // Can we fit any content within this column?
  if (!colHeight || colHeight < minH) {
    treesaver.debug.info('Column below minHeight: ' + block + ':' + colHeight);

    // No height, we are done here
    // TODO: Remove column element altogether?
    return;
  }

  // Open HTML from tag stack
  if (block.parent) {
    blockStrings.push(block.openAllTags(true));
  }

  // Calculate the margin we'll use in the first block of this column
  // If there's an overhang, we use a negative margin to deduct the part
  // of the block that was shown in the previous column (or page)
  // If there's no overhang, then we use zero margin due to collapsing rules
  initMarginTop = br.overhang ? block.metrics.outerH - br.overhang : 0;

  // This is by far the most complex portion of the code here, so be very
  // careful when altering it.
  //
  // The concept is very simple, we place as many blocks as we can fit into
  // this column, then exit.
  //
  // However, things get complex, because there are many scenarios in which
  // a block may or may not fit
  block_loop:
  while (br.index < blockCount && height < colHeight) {
    block = content.blocks[br.index];
    nextSibling = block.nextSibling;
    nextNonChild = nextSibling || block.getNextNonChildBlock();

    // First, we must check if this block is a figure's fallback content.
    // If so, then we must see if the figure has been used
    // Note: A fallback block could have overhang from previous column,
    // so must check for that as well
    if (block.isFallback && br.figureUsed(block.figure.figureIndex) &&
        !(isFirstBlock && br.overhang)) {
      // The figure has been used, so we can't use this block at all
      //
      // If the block was the last element in it's nesting level, then we need
      // to close the parent block
      // TODO: Back it out completely
      if (block.parent && !block.nextSibling) {
        // TODO: Close out tags by looping up parents
        treesaver.debug.error('Must close out parent tags on unused fallback!');
      }

      // Go to the next block, skipping any children of this block
      br.index = nextNonChild ? nextNonChild.index : blockCount;
      // Move on to the next block
      continue block_loop;
    }


    parent = block.parent;
    remainingHeight = colHeight - height;

    // Calculate some of the metrics we'll be using for this block. These vary
    // depending on where we are in the column and content.
    //
    // Check for an existing marginTop, which is a sign that we already opened
    // a tag
    if (isFirstBlock && !marginTop) {
      // The first block will need to account for any overhang, and
      // never has any top margin due to collapsing rules (all calculated
      // outside the block_loop)
      marginTop = -initMarginTop;
      // If we're overflowed, then we're already mid-way through the content
      // and the "first line" is really the "next line" -- which we know via
      // lineHeight. Otherwise, use the pre-computed firstLine property
      marginAndFirstLine = br.overflow ?
        block.metrics.lineHeight : block.firstLine;
    }
    else {
      // Collapse with previous margin
      marginTop = Math.max(marginTop, block.metrics.marginTop);
      marginAndFirstLine = marginTop + block.firstLine;
    }

    // Collapse the bottom margin with our next sibling, if there is one
    // TODO: What if this is the last child of a block?
    marginBottom = Math.max(block.metrics.marginBottom,
        nextSibling ? nextSibling.metrics.marginTop : 0);

    // The amount of space our block will take up in this column if inserted
    // Height plus whatever our margin ended up being
    //
    // TODO: What if this contains a fallback? We don't actually know how
    // tall it will be :(
    effectiveBlockHeight = block.metrics.outerH + marginTop;

    // Do a quick check and see if we can fit the first line of content in the
    // current block, if we can't (and shouldn't), then we'll exit the loop
    // early
    finishColumn = remainingHeight < marginAndFirstLine;

    // We may be able to fit the first line of the current block, but now we
    // need to check for a keepwithnext with next restriction.
    //
    // Note that keepwithnext is ignored if there is no next sibling, or if the
    // block was already broken (has overhang) -- or if this is the isFirstBlock
    // in a non-short column
    if (!finishColumn && block.keepwithnext && nextSibling &&
        !(br.overhang || (isFirstBlock && !shortColumn))) {
      // Keepwithnext means that we must attempt to keep this block in the same
      // column/page as it's next sibling. However, the current block can still
      // break into the next column in order to do so
      //
      // Scenarios:
      //   1) Current and next block's first line fit (all good!)
      //   2) Current only fits partially, which means that it'll likely share
      //      the next column with it's sibling, thus fufilling the requirement
      //   3) Current fits completely, but the first line of the next block 
      //      doesnt -- need to delay current (but only if this isn't a virgin
      //      column) [which we check for later]
      //
      // We are testing solely for scenario 3 here, since we're trying to figure
      // out if we need to end the column early
      finishColumn = (remainingHeight >= effectiveBlockHeight) &&
        (remainingHeight <
          (effectiveBlockHeight + marginBottom + nextSibling.firstLine));

      if (finishColumn) {
        treesaver.debug.info('Leaving column due to keepwithnext');
      }
    }

    if (finishColumn) {
      // We know that we can't cleanly fit the current block into the column
      // We have no guarantee that the block would fit in the next column,
      // so only break the current column if it's not brand new or happens to be
      // abnormally short (likely due to stretching from a figure)
      //
      // TODO: What if the next column is even shorter? Not very easy to tell
      // since the next column could be on the next page, etc.
      finishColumn = !isFirstBlock || shortColumn;

      if (finishColumn) {
        if (shortColumn) {
          treesaver.debug.info('Leaving column empty due to being short');
        }
        else if (!isFirstBlock) {
          treesaver.debug.info('Ending column early due to non-fit');
        }
      }
      else {
        treesaver.debug.info('Staying in virgin column despite non-fit');
      }
    }

    if (finishColumn) {
      // One final special case is due to fallback elements, which are a real
      // pain in the ass, since we don't know if we can account for them or not
      //
      // Instead of trying to do any fancy logic, we just punt on the entire
      // issue and take the slow route, skipping any early termination of the
      // column when we have a fallback
      finishColumn = !block.containsFallback;
    }

    if (block.columnBreak && !isFirstBlock) {
      // If it's marked as column break, obey the command
      // No matter what, this includes fallbacks
      // TODO: Any issues with this?
      finishColumn = true;
    }

    if (finishColumn) {
      // We cannot fit the current block into the column, need to exit early
      //
      // Check and see if we need to close out any open element tags.
      if (parent) {
        // Now there's at least one unclosed tag sitting on the stack
        //
        // We need to go up the parent chain and either:
        //   1) Close the tag if there are other elements at that nesting level
        //   2) Remove the tag completely so we don't have an empty tag
        //
        // Due to firstLine detection, #2 should be somewhat rare, but it can
        // happen in cases where firstLine is more complicated (keepwithnext,
        // or with fallbacks)
        //
        // We know that an element is the first child of it's parent if their
        // indices are off by one.
        while (parent && parent.index === block.index - 1) {
          treesaver.debug.info('Backing out opened tag: ' + parent.openTag);

          // The current tag level has no children, let's remove the string from
          // our stack, and adjust the break record
          blockStrings.pop();
          // TODO: Is there any risk with backing up into the br like this?
          br.index = parent.index;
          // TODO: Is there any reason we should try to update the height here?

          // Check if the parent block was a fallback
          if (parent.isFallback) { // TODO: Remove bool and check parent.fig?
            // We had previously marked the corresponding figure as used, we
            // un-use it by just adding it to the delayed blocks
            //
            // TODO: What if it was failed? We'll be placing it in the
            // wrong array
            br.delayFigure(parent.figure.figureIndex);
          }

          // Move up one level
          block = parent;
          parent = block.parent;
        }

        // If we exited the loop with an active parent, that means we still have
        // some open tags on the stack, close them out now
        if (parent) {
          blockStrings.push(block.closeAllTags());
        }
      }

      // Finish the loop and bust out of this podunk column
      break block_loop;
    }

    // We've made it this far, which means we're definitely going to insert
    // some content into the current column.

    // If we're going to use a fallback, mark the figure as used now so we don't
    // get duplicate content displayed to the user
    if (block.isFallback) {
      br.useFigure(block.figure.figureIndex);
    }

    // Scenarios:
    //   1) Contains a fallback, meaning we don't know it's true height
    //      Must open tag and recurse no matter what
    //   2) Has child blocks, but won't fit completely: Open tag and continue
    //   3) Current block fits completely: Insert and continue
    //   4) Doesn't fit, no children: Insert and overflow
    //
    // Tackle 1 & 2 first, which involve opening up the current parent element
    if (block.containsFallback ||
        (block.blocks.length && remainingHeight < effectiveBlockHeight)) {
      // Should never have an overhang when opening a parent
      if (br.overhang) {
        treesaver.debug.error('Overhang present when opening a parent block');
      }

      // Note: we are accumulating top margin, so we only add the margin in
      // when we finally insert a block, or when the margin collapsing is broken
      // by Border & Padding
      if (block.metrics.bpTop) {
        // Add the accumulated top margin, and then reset the margin since we're
        // using it up
        height += isFirstBlock ? 0 : marginTop;
        marginTop = 0;

        // Now include the BP itself
        height += block.metrics.bpTop;

        // Note that we shouldn't manually set the isFirstBlock flag here,
        // since we might get stuck as the system keeps on trying to make
        // space by breaking into a new column
      }
      else {
        // No BP = Margin keeps on collapsing
        //
        // Since this is an open tag, it means we don't worry about marginBottom
      }

      // Open the tag
      // Note: There is no need to use the _zero version here, because
      // initMarginTop takes care of the top margin setting. Also, we don't
      // want to zero out BP here
      blockStrings.push(block.openTag);

      // Move to the first child (which is always the next index)
      br.index += 1;

      // Start our loop again
      continue block_loop;
    }

    // Now we're left with:
    //   1) Insert & continue
    //   2) Insert & overflow

    // No matter what, we're inserting the block at this point
    height += effectiveBlockHeight;
    blockStrings.push(block.html);
    // Reset our flags
    isFirstBlock = false;
    firstBlock = firstBlock || block;
    br.overhang = 0;

    // Now check whether the content fits completely, with potential space
    // for the next block (let ties be processed a different fashion, since
    // we'll close out the column that way)
    if (colHeight > height + marginBottom) {
      // The full content portion of this block fits, which means we can
      // advance the breakRecord to the next block
      br.index = nextNonChild ? nextNonChild.index : blockCount;

      // Things get a little more complex now due to nesting and margin
      // collapsing.
      //
      // We need to do the following:
      //   - Close any parent elements that have been finished
      //   - Add any bottom margin / BP
      //   - Properly track margin collapsing

      if (!nextSibling && parent) {
        closeTags = [];
        do {
          // We are the final sibling in a parent container, so let's close
          // out that tag
          closeTags.push(parent.closeTag);
          // Need to figure out margin collapsing.
          // Bottom margin continues to accumulate as long as the parent doesn't
          // have a bpBottom
          if (parent.metrics.bpBottom) {
            // Collapsing is broken so add the accumulated bottom margin and BP
            height += marginBottom + parent.metrics.bpBottom;
            // Start a new margin accumulation
            marginBottom = parent.metrics.marginBottom;
          }
          else {
            // Margin collapsing not broken, accumulate
            marginBottom = Math.max(marginBottom, parent.metrics.marginBottom);
          }
        } while (!parent.nextSibling && ((parent = parent.parent)));

        // Check and see if we're now going to overflow due to excess BP
        if (colHeight > height + marginBottom) {
          // Still have more room to fit content in this column, do our partial
          // closing of tags
          blockStrings.push(closeTags.join(''));
        }
        else {
          // Close out remaining tags.
          if (parent) {
            blockStrings.push(block.closeAllTags());
          }

          // We don't want to try to calculate overhang, since all the overhang
          // is due to closing BP and bottom margins, so just set the colHeight
          // manually to bypass (clipping any excess)
          height = colHeight;

          // Get out off the loop
          break block_loop;
        }
      }

      // Propagate bottom margin (gets collapsed w/ top margin in next loop)
      marginTop = marginBottom;

      // Loop again
      continue block_loop;
    }

    // The content does not fit, we are done with this column and going to
    // overflow. Clean up before we leave

    // Close out any open parent tags
    if (parent) {
      blockStrings.push(block.closeAllTags());
    }

    // We make a special case for unbreakable elements (replaced elements like
    // img, canvas, etc). We don't want to even try to split this across a
    // column or page, so we just shove it in and let it clip
    if (!block.breakable) {
      // Just make the height the full height of the column, since this
      // will bypass any overflow calculation (and realistically look
      // the best by keeping to vertical grid). The excess clips
      height = colHeight;

      // Advance the breakRecord, so we don't repeat the block
      br.index = nextNonChild ? nextNonChild.index : blockCount;

      treesaver.debug.warn('Unbreakable element shoved into column');
    }
    else {
      // Make sure we don't process as if we have overhang, because
      // we don't (probably got here by having a large margin that
      // extends past the end of the column)
      if (height <= colHeight) {
        br.index = nextNonChild ? nextNonChild.index : blockCount;

        // Make sure we don't try to do overhang
        height = colHeight;
      }

      if (block.keeptogether) {
        treesaver.debug.warn('keeptogether element shoved into column');
      }

      // Do not advance the break record, since we need to stay on this
      // block for overflow into the next column
    }

    // We are finished with this loop. Calculate overflow on the outside
    break block_loop;
  } // block_loop

  // Do overhang calculation
  colHeight = treesaver.layout.Page.computeOverhang(br, block, colHeight, height);

  // In DEBUG, sprinkle the dom with hints
  if (goog.DEBUG) {
    node.setAttribute('data-overhang', br.overhang);
    node.setAttribute('data-contentHeight', height);
    if (firstBlock) {
      node.setAttribute('data-firstBlock', firstBlock.index);
    }
    if (block) {
      node.setAttribute('data-lastBlock', block.index);
    }
  }

  // Do a tight fix on the column height
  treesaver.dimensions.setCssPx(node, 'height', colHeight);

  // Join string array and insert into column node
  node.innerHTML = blockStrings.join("");

  // Apply overhang to the first block
  if (firstBlock && node.firstChild) {
    node.firstChild.style.marginTop = -initMarginTop + 'px';

    if (firstBlock.parent && !initMarginTop) {
      // Check if we need to zero-out margins on the children
      parent = firstBlock.parent;
      while (parent) {
        if (parent.metrics.bpTop) {
          // Has bpTop, so margins don't collapse
          firstBlock = parent;
        }
        parent = parent.parent;
      }

      // TODO: Really think about this code, it's weird

      // Have to traverse in
      if (parent !== firstBlock) {
        parent = firstBlock.parent;
        block = node.firstChild;

        while (parent) {
          block = block.firstChild;
          parent = parent.parent;
          if (block) {
            block.style.marginTop = 0;
          }
          else {
            treesaver.debug.error('No block on fucked up code');
          }
        }
      }
    }
    else if (firstBlock.blocks.length && !initMarginTop) {
      block = node.firstChild;
      while (firstBlock) {
        if (firstBlock.blocks.length && block.firstChild) {
          firstBlock = firstBlock.blocks[0];
          block = block.firstChild;
          block.style.marginTop = 0;
        }
        else {
          firstBlock = null;
        }
      }
    }
  }
  else {
    treesaver.debug.warn('Clearing column contents since no block was added');

    // Clear out column contents, since no block was added
    treesaver.dom.clearChildren(node);
  }
};

/**
 * Compute overhang
 * @param {!treesaver.layout.BreakRecord} br The lastBlock inserted into the column
 * @param {!treesaver.layout.Block} lastBlock The lastBlock inserted into the column
 * @param {number} colHeight
 * @param {number} height
 * @return {number} The final column height required for this
 */
treesaver.layout.Page.computeOverhang = function(br, lastBlock, colHeight, height) {
  var contentOnlyOverhang,
      excess;

  if (colHeight >= height || !lastBlock) {
    br.overhang = 0;
    return colHeight;
  }

  // Some sanity checks
  if (!lastBlock.breakable) {
    // Should never get to this point
    treesaver.debug.error('Overhang on unbreakable element');
  }
  if (lastBlock.blocks.length) {
    // Should never get to this point
    treesaver.debug.error('Overhang on element with children');
  }

  // We have some content peaking out from the bottom of the
  // column. Our job now is to find where we can clip this content
  // without creating any visual artifacts
  br.overhang = height - colHeight;

  // Calculate the portion of the block's content that is sticking
  // outside of the column
  contentOnlyOverhang = br.overhang - lastBlock.metrics.bpBottom;

  // What if no actual content is sticking out and it's all border & padding?
  if (contentOnlyOverhang <= 0) {
    br.overhang = 0;
    // Advance to the next block, since there's no content overhanging
    br.index = lastBlock.index + 1;
    // Note: Don't blindly increment br.index, since you'll never know
    // if it was accidently incremented or via loop triggering
  }
  else {
    // Calculate where the line boundaries occur, and figure out if
    // it's in sync with the clip point.
    // Then check to make sure that's a multiple of line height
    excess = (lastBlock.metrics.h - contentOnlyOverhang) %
             lastBlock.metrics.lineHeight;

    // NOTE: Excess can be larger than the entire block in cases
    // where there is a large top border/padding, make sure to Max w/ 0
    if (excess) {
      // Excess is currently the fraction of a line that is sticking
      // out of the column, not fitting completely

      // The portion of the block in the column is out of sync
      // reduce the column height in order to clip the partial line
      colHeight -= excess;

      // Adjust the overhang as well so we flow correctly in the next col
      br.overhang += excess;
    }
  }

  return colHeight;
};

/**
 * Fill in the data field for this node
 * @param {!Element} node
 * @param {!Object} fields
 */
treesaver.layout.Page.fillField = function(node, fields) {
  // The field name to put in this element
  treesaver.template.expand(fields, node);
};

/**
 * Initialize page as necessary before displaying
 * @return {Element}
 */
treesaver.layout.Page.prototype.activate = function() {
  // Run only once
  if (this.active) {
    return this.node;
  }

  // Re-hydrate the HTML
  this.node = treesaver.dom.createElementFromHTML(this.html);

  // Flag
  this.active = true;

  return this.node;
};

/**
 * Deactivate page
 */
treesaver.layout.Page.prototype.deactivate = function() {
  this.active = false;
  this.node = null;
};

/**
 * Clone this page.
 * @return {!treesaver.layout.Page} A clone of this page
 */
treesaver.layout.Page.prototype.clone = function() {
  var p = treesaver.object.clone(this);
  // We override the properties that are different by creating a clone
  // and setting those properties explicitly.
  p.node = /** @type {!Element} */ (this.node && this.node.cloneNode(true) || null);
  p.active = this.active;
  return /** @type {!treesaver.layout.Page} */ (p);
};

if (goog.DEBUG) {
  treesaver.layout.Page.prototype.toString = function() {
    return "[Page]";
  };
}

// Input 24
/**
 * @fileoverview Retrieve files via XMLHttpRequest.
 */

goog.provide('treesaver.network');

goog.require('treesaver.array'); // forEach
goog.require('treesaver.capabilities'); // delay
goog.require('treesaver.constants');
goog.require('treesaver.debug');
goog.require('treesaver.scheduler');

/**
 * @private
 * @const
 * @type {number}
 */
treesaver.network.DEFAULT_TIMEOUT = 10000; // 10 seconds

/**
 * Network events fired
 * @const
 * @type {Object.<string, string>}
 */
treesaver.network.events = {
  ONLINE: 'treesaver.online',
  OFFLINE: 'treesaver.offline'
};

/**
 * Browser events watched
 * @private
 * @const
 * @type {Array.<string>}
 */
treesaver.network.watchedEvents_ = [
  'offline',
  'online'
];

/**
 * Cache events watched (on document, not window)
 * @private
 * @const
 * @type {Array.<string>}
 */
treesaver.network.watchedCacheEvents_ = [
  'uncached',
  'idle',
  'checking',
  'downloading',
  'updateready',
  'obsolete'
];

/**
 * Whether the network library is loaded
 * @private
 * @type {boolean}
 */
treesaver.network.isLoaded_ = false;

/**
 * Initialize the network module, hook up event handlers, etc
 */
treesaver.network.load = function() {
  if (!treesaver.network.isLoaded_) {
    treesaver.network.isLoaded_ = true;

    // Hook up event handlers
    treesaver.network.watchedEvents_.forEach(function(evt) {
      treesaver.events.addListener(document, evt, treesaver.network);
    });

    if (treesaver.capabilities.SUPPORTS_APPLICATIONCACHE &&
        // FF3.5 gets nasty if you try to add event handlers to an uncached page
        // (specifically, it won't let you add event handlers to the cache obj)
        treesaver.network.loadedFromCache_) {
      treesaver.network.watchedCacheEvents_.forEach(function(evt) {
        treesaver.events.addListener(window.applicationCache, evt, treesaver.network);
      });
    }
  }
};

/**
 * Unload handlers and cleanup
 */
treesaver.network.unload = function() {
  if (treesaver.network.isLoaded_) {
    treesaver.network.isLoaded_ = false;

    // Unhook event handlers
    treesaver.network.watchedEvents_.forEach(function(evt) {
      treesaver.events.removeListener(window, evt, treesaver.network);
    });
    // Unhook cache handlers only if they were set (avoid FF3.5 bug from above)
    if (treesaver.capabilities.SUPPORTS_APPLICATIONCACHE &&
        treesaver.network.loadedFromCache_) {
      treesaver.network.watchedCacheEvents_.forEach(function(evt) {
        treesaver.events.removeListener(window.applicationCache, evt, treesaver.network);
      });
    }

    // TODO: Cancel outstanding requests
  }
};

/**
 * @return {boolean} True if browser has an internet connection.
 */
treesaver.network.isOnline = function() {
  if ('onLine' in window.navigator) {
    return window.navigator.onLine;
  }

  // TODO: What's a good option here? IE8, and recent FF/WebKit support
  // navigator.onLine, so perhaps we just don't worry about this too much
  return true;
};

/**
 * @private
 * @type {boolean}
 */
treesaver.network.loadedFromCache_ =
  treesaver.capabilities.SUPPORTS_APPLICATIONCACHE &&
  // 0 = UNCACHED, anything else means page was cached on load
  !!window.applicationCache.status;

/**
 * @return {boolean} True if the browser cache was active during boot.
 */
treesaver.network.loadedFromCache = function() {
  return treesaver.network.loadedFromCache_;
};

/**
 * Handle events
 * @param {Event} e
 */
treesaver.network['handleEvent'] = function(e) {
  treesaver.debug.info('Network event recieved: ' + e);

  switch (e.type) {
  case 'online':
    treesaver.debug.info('Application online');

    // TODO: Refactor this and create an event handler in capabilities
    treesaver.capabilities.updateClasses();

    treesaver.events.fireEvent(window, treesaver.network.events.ONLINE);
    return;

  case 'offline':
    treesaver.debug.info('Application offline');

    // TODO: Refactor this and create an event handler in capabilities
    treesaver.capabilities.updateClasses();

    treesaver.events.fireEvent(window, treesaver.network.events.OFFLINE);
    return;

  case 'updateready':
    treesaver.debug.info('Updating application cache');

    // New version of cached element is ready, hot swap
    window.applicationCache.swapCache();

    // Force reload of app in order to get new JS and content?

    return;

  case 'error':
    treesaver.debug.warn('Application Cache Error: ' + e);

    // TODO: ???
    return;
  }
};

/**
 * @param {!string} url
 * @return {!string} path.
 */
treesaver.network.urlToPath = function(url) {
  var a,
      div,
      path;

  if (SUPPORT_IE && treesaver.capabilities.IS_LEGACY) {
    // IE7 has buggy behavior here if you set the href property,
    // so we have to use innerHTML to get the real absolute URL
    div = document.createElement('div');
    div.style.display = 'none';
    document.body.appendChild(div);
    div.innerHTML = '<a href="' + url + '"></a>';
    a = /** @type {!Element} */ (div.firstChild);
  }
  else {
    a = document.createElement('a');
    a.href = url;
  }

  // TODO: Verify that pathname is supported everywhere
  path = a['pathname'];

  if (SUPPORT_IE && treesaver.capabilities.IS_LEGACY) {
    // Compiler's not smart enough to know that div will be set here
    document.body.removeChild(/** @type {!Element} */ (div));
    div.removeChild(a);
  }

  // IE & Opera sometimes don't prefix the path with '/'
  if (path.charAt(0) !== '/') {
    path = '/' + path;
  }

  return path;
};

/**
 * @param {!string} url
 * @return {!string} The url without the hash.
 */
treesaver.network.stripHash = function(url) {
  var hash_index = url.indexOf('#');

  if (hash_index === -1) {
    return url;
  }
  else {
    return url.substr(0, hash_index);
  }
};

/**
 * @private
 * @const
 * @type {!RegExp}
 */
treesaver.network.protocolRegex_ = /^https?:\/\//i;

/**
 * @param {!string} rel_path
 * @return {!string} An absolute URL.
 */
treesaver.network.absoluteURL = function(rel_path) {
  // Shortcut anything that starts with slash
  if (rel_path && rel_path.charAt(0) === '/' || treesaver.network.protocolRegex_.test(rel_path)) {
    return rel_path;
  }

  var a = document.createElement('a'),
      div,
      url;

  // IE7 doesn't properly compute the pathname if the link
  // is not in the tree
  if (SUPPORT_IE && treesaver.capabilities.IS_LEGACY) {
    div = document.createElement('div');
    document.body.appendChild(div);
    div.appendChild(a);
  }

  a.href = rel_path;
  url = a.href;

  // Remove element from tree
  if (SUPPORT_IE && treesaver.capabilities.IS_LEGACY) {
    document.body.removeChild(/** @type {!Element} */ (div));
    div.removeChild(a);
  }

  return url;
};

/**
 * @param {!string} url
 * @param {?function()} callback
 * @param {number=} timeout
 */
treesaver.network.get = function get(url, callback, timeout) {
  treesaver.debug.info('XHR request to: ' + url);

  var request = {
    xhr: new XMLHttpRequest(),
    url: url,
    callback: callback
  };

  treesaver.scheduler.delay(
    function() {
      treesaver.network.requestTimeout_(request);
    },
    timeout || treesaver.network.DEFAULT_TIMEOUT,
    [],
    treesaver.network.makeRequestId_(request)
  );

  // Setup timeout
  request.xhr.onreadystatechange = treesaver.network.createHandler_(request);

  try {
    // IE will throw if you try X-domain
    request.xhr.open('GET', request.url, true);
    request.xhr.send(null);
  }
  catch (e) {
    treesaver.debug.warn('XHR Request exception: ' + e);

    treesaver.network.requestError_(request);
  }
};

/**
 * @private
 */
treesaver.network.makeRequestId_ = function(request) {
  // TODO: Make unique across repeated requests?
  return 'fetch:' + request.url;
};

/**
 * @private
 */
treesaver.network.createHandler_ = function createHandler_(request) {
  return function() {
    if (request.xhr.readyState === 4) {
      // Requests from local file system give 0 status
      // This happens in IOS wrapper, as well as packaged Chrome web store
      if (request.xhr.status === 0 ||
          (request.xhr.status === 200 || request.xhr.status === 304)) {
        treesaver.debug.info('XHR response from: ' + request.url);
        request.callback(request.xhr.responseText, request.url);
        treesaver.network.cleanupRequest_(request);
      }
      else {
        treesaver.debug.warn('XHR request failed for: ' + request.url);

        treesaver.network.requestError_(request);
      }
    }
  };
};

/**
 * @private
 */
treesaver.network.cleanupRequest_ = function cleanupRequest_(request) {
  // Remove timeout
  treesaver.scheduler.clear(treesaver.network.makeRequestId_(request));
  // Clear reference
  request.xhr.onreadystatechange = null;
};

/**
 * @private
 */
treesaver.network.requestError_ = function requestError_(request) {
  // Failed for some reason; TODO: Error handling / event?
  request.callback(null, request.url);
  treesaver.network.cleanupRequest_(request);
};

/**
 * @private
 */
treesaver.network.requestTimeout_ = function requestTimeout_(request) {
  request.xhr.abort();
  treesaver.network.requestError_(request);
};

// Input 25
/**
 * @fileoverview Article class.
 */

goog.provide('treesaver.ui.Article');

goog.require('treesaver.array');
goog.require('treesaver.debug');
goog.require('treesaver.constants');
goog.require('treesaver.dimensions');
goog.require('treesaver.dom');
goog.require('treesaver.events');
goog.require('treesaver.layout.BreakRecord');
goog.require('treesaver.layout.Content');
goog.require('treesaver.layout.ContentPosition');
goog.require('treesaver.layout.Grid');
goog.require('treesaver.layout.Page');
goog.require('treesaver.network');
goog.require('treesaver.scheduler');

/**
 * A chunk of content
 *
 * @constructor
 * @param {!string} url
 * @param {!string} title
 * @param {!Array.<treesaver.layout.Grid>} grids
 * @param {string=} html
 */
treesaver.ui.Article = function(url, title, grids, html) {
  /**
   * @type {?string}
   */
  this.theme = null;

  /**
   * @type {treesaver.layout.Content} The content of this article
   */
  this.content = null;

  /**
   * @type {!string}
   */
  this.url = url;

  /**
   * @type {!string}
   */
  this.path = treesaver.network.urlToPath(url);

  /**
   * @type {string}
   */
  this.title = title;

  /**
   * @type {treesaver.layout.BreakRecord}
   */
  this.br = null;

  /**
   * @type {number}
   */
  this.pageCount = 0;

  /**
   * @type {Array.<treesaver.layout.Page>}
   */
  this.pages = [];

  /**
   * @type {boolean}
   */
  this.paginationClean = false;

  /**
   * @type {boolean}
   */
  this.paginationComplete = false;

  /**
   * @type {boolean}
   */
  this.loaded = false;

  /**
   * @type {boolean}
   */
  this.loading = false;

  /**
   * @type {boolean}
   */
  this.loadFailed = false;

  /**
   * @type {boolean}
   */
  this.error = false;

  /**
   * @type {?{ w: number, h: number }} size
   */
  this.maxPageSize = null;

  /**
   * Constraint ...
   * @type {?treesaver.dimensions.SizeRange}
   */
  this.constraint = null;

  /**
   * @type {!Array.<treesaver.layout.Grid>}
   */
  this.eligible_grids = [];

  /**
   * @type {Array.<treesaver.layout.Grid>}
   */
  this.grids = grids;

  // Automatically process the HTML, if any was given to us
  if (html) {
    this.processHTML(html);
  }
};

/**
 * Names of events fired by this class
 * @type {Object.<string, string>}
 */
treesaver.ui.Article.events = {
  LOADFAILED: 'treesaver.loadfailed',
  LOADED: 'treesaver.loaded',
  PAGINATIONERROR: 'treesaver.paginationerror',
  PAGINATIONPROGRESS: 'treesaver.paginationprogress'
};

/**
 * @type {RegExp}
 */
treesaver.ui.Article.titleRegExp = /<title>\s*(.+?)\s*<\/title>/i;

/**
 * Find and return any text within a <title>
 * @param {?string} html
 * @return {?string}
 */
treesaver.ui.Article.extractTitle = function(html) {
  var res = treesaver.ui.Article.titleRegExp.exec(html);
  if (res && res[1]) {
    return res[1];
  }
  return null;
};

/**
 * @param {?string} html  HTML for the article. May be just the
 *                        <article> node, or an entire .html page.
 */
treesaver.ui.Article.prototype.processHTML = function(html) {
  // Content is here, so we're loaded
  this.loaded = true;

  // Container used for manipulation and finding things
  var fake_grid = document.createElement('div'),
      fake_column = document.createElement('div'),
      article_node,
      title = treesaver.ui.Article.extractTitle(html);

  // Grab the title, while we've got the HTML on hand
  if (title) {
    this.title = /** @type {!string} */ (title);
  }

  // Set up a temporary container for layout
  fake_grid.style.display = 'none';
  treesaver.dom.addClass(fake_grid, 'offscreen grid');
  treesaver.dom.addClass(fake_column, 'column');

  // Container needs to be in tree for measuring, and for
  // IE HTML5 shiv to work properly as well
  document.body.appendChild(fake_grid);
  fake_grid.innerHTML = html;

  // Look for just the content node
  article_node = document.getElementById('ts_content') ||
                 treesaver.dom.getElementsByTagName('article', fake_grid)[0];

  if (!article_node) {
    treesaver.debug.error('Could not find article content in HTML: ' + html);

    // Cleanup before exiting in error
    document.body.removeChild(fake_grid);

    // TODO: Fire event?
    // this.error currently used for mis-loaded doc, does it matter?
    this.error = true;

    return false;
  }

  // Remove any ID so CSS styles don't affect the elements within
  article_node.removeAttribute('id');

  // Clear the container so node can be the only thing in it
  treesaver.dom.clearChildren(fake_grid);

  // Set up theme flag, if it exists
  // TODO: Remove compatibility data-grids parameter
  this.theme = article_node.getAttribute('data-theme') ||
    article_node.getAttribute('data-grids') || null;
  if (this.theme) {
    treesaver.dom.addClass(fake_grid, this.theme);
    treesaver.dom.addClass(fake_column, this.theme);

    // New theme means grids need to be filtered again
    this.setGrids(this.grids);
  }

  // Move the content from the article to the column
  while (article_node.firstChild) {
    fake_column.appendChild(article_node.firstChild);
  }
  fake_grid.appendChild(fake_column);
  // Re-enable visibility, so the browser can measure layout
  fake_column.style.display = 'block';
  fake_grid.style.display = 'block';

  // Construct
  this.content = new treesaver.layout.Content(fake_column);

  // Clean up the DOM
  document.body.removeChild(fake_grid);
  fake_grid.removeChild(fake_column);
  treesaver.dom.clearChildren(fake_column);

  // Reset pagination state
  this.resetPagination();

  return true;
};

/**
 * Set the grids which can be used by this article
 * Grids that don't meet theme requirements are ignored
 *
 * @param {Array.<treesaver.layout.Grid>} all_grids
 */
treesaver.ui.Article.prototype.setGrids = function(all_grids) {
  // Filter out any grids that don't match our article classes
  if (this.theme) {
    this.grids = all_grids.filter(function(grid) {
      return grid.hasTheme(this.theme);
    }, this);
  }
  else {
    // Shallow clone the array
    this.grids = all_grids.slice(0);
  }
};

/**
 * Stretch the grids into appropriate heights, and filter out any grids
 * which do not fit. Return the stretched subset of grids in an array
 * @param {{ w: number, h: number }} size
 * @return {Array.<treesaver.layout.Grid>}
 */
treesaver.ui.Article.prototype.stretchGrids = function(size) {
  this.eligible_grids = this.grids.filter(function(grid) {
    return grid.capabilityFilter() && grid.sizeFilter(size);
  }).map(function(grid) {
    // Now stretch to the space
    return grid.stretch(size.h);
  });

  // Are there any grids?
  if (!this.eligible_grids.length) {
    treesaver.debug.error('No eligible grids at ' + size.w + 'x' + size.h);
  }

  // Sort by highest text height (helps with shortcutting in scoring)
  this.eligible_grids.sort(treesaver.layout.Grid.sort);
};

/**
 * Set the maximum size pages in this article are allowed to be
 * @param {{ w: number, h: number }} size
 * @return {boolean} True if a re-layout will be required at this size.
 */
treesaver.ui.Article.prototype.setMaxPageSize = function(size) {
  if (!this.maxPageSize ||
      this.maxPageSize.w !== size.w || this.maxPageSize.h !== size.h) {
    this.maxPageSize = size;

    // Check if all the pages of our content will fit at this size
    this.paginationClean =
      treesaver.dimensions.inSizeRange(/** @type {!treesaver.dimensions.SizeRange} */ (this.constraint), size);
  }

  return !this.paginationClean;
};

/**
 * Reset all pagination data and stored pages.
 */
treesaver.ui.Article.prototype.resetPagination = function() {
  // Stop all pagination related tasks
  treesaver.scheduler.clear('paginate');

  // Clear out the old pages
  this.pages = [];
  this.pageCount = 0;

  // Filter and stretch grids to the current size
  if (this.maxPageSize) {
    this.stretchGrids(this.maxPageSize);
  }

  // Our old break record is now useless
  this.br = new treesaver.layout.BreakRecord();

  // As is the constraint
  this.constraint = null;

  // Pagination is clean (even if there are no pages right now)
  this.paginationClean = true;
  this.paginationComplete = false;
};

/**
 * Paginate the article asynchronously
 * @param {boolean} bg Paginate remainder of article in background.
 * @param {number} index Paginate synchronously until this index.
 * @param {?treesaver.layout.ContentPosition|number} pos Paginate synchronously until this position.
 * @private
 */
treesaver.ui.Article.prototype.paginate = function(bg, index, pos) {
  if (goog.DEBUG) {
    if (!this.content) {
      treesaver.debug.error('Tried to paginate missing content');
      return;
    }

    if (!this.maxPageSize) {
      treesaver.debug.error('Tried to paginate without a page size');
      return;
    }

    if (this.paginationComplete) {
      treesaver.debug.info('Needless call to paginate');
      return;
    }
  }

  // Stop any previous pagination
  // (TODO: What if this conflicts with other articles?)
  treesaver.scheduler.clear('paginate');

  var page;
  index = index || 0;

  while (!this.br.finished) {
    page = new treesaver.layout.Page(
      /** @type {!treesaver.layout.Content } */ (this.content),
      this.eligible_grids,
      /** @type {!treesaver.layout.BreakRecord} */ (this.br)
    );

    // Pagination can fail to produce a useful page
    if (page.ignore) {
      if (this.br.finished) {
        treesaver.debug.info('Page ignored during pagination and article terminated');
      }
      else {
        treesaver.debug.info('Page ignored during pagination');
      }

      if (this.br.finished) {
        break;
      }

      // Ignore this page and try again
      continue;
    }
    else if (page.error) {
      if (this.br.finished) {
        // Meh, I guess we're done
        break;
      }
      // Something went wrong
      this.error = true;

      // Fire pagination error for logging
      treesaver.events.fireEvent(
        document,
        treesaver.ui.Article.events.PAGINATIONERROR,
        { article: this }
      );

      // Put the error page in the collection

      // For now, just set finished so people can move on with their lives
      // TODO: Force re-layout?
      this.br.finished = true;

      break;
    }

    // Page is OK, add it to our collection
    this.pages.push(page);
    this.pageCount += 1;
    // Clear the error flags
    this.error = false;

    // Update page constraint
    this.constraint =
      treesaver.dimensions.mergeSizeRange(/** @type {!treesaver.dimensions.SizeRange} */ (this.constraint), page.size, true);

    if (index && this.pageCount <= index ||
        pos && ((pos === treesaver.layout.ContentPosition.END) || !pos.lessOrEqual(page.end))) {
      // Not done yet, gotta keep on going
      continue;
    }
    // Check if we can background the rest
    else if (!this.br.finished) {
      if (bg) {
        // Fire progress event, but only when async
        // TODO: Is this the right thing here?
        treesaver.events.fireEvent(
          document,
          treesaver.ui.Article.events.PAGINATIONPROGRESS,
          { article: this }
        );

        // Delay rest of pagination to make sure UI thread doesn't hang
        this.paginateAsync(treesaver.array.toArray(arguments));
      }

      // Break out of loop early
      return;
    }
  }

  // All done, fire completed event
  this.paginationComplete = true;
  treesaver.events.fireEvent(
    document,
    treesaver.ui.Article.events.PAGINATIONPROGRESS,
    { article: this, completed: true }
  );
};

/**
 * Start asynchronous pagination
 * @param {Array} args Arguments array to pass to the paginate function.
 */
treesaver.ui.Article.prototype.paginateAsync = function(args) {
  treesaver.scheduler.delay(treesaver.ui.Article.prototype.paginate,
      PAGINATE_DEBOUNCE_TIME, args, 'paginate', this);
};

/**
 * Return a width appropriate for use in the chrome for pageWidth
 * elements
 * @return {number}
 */
treesaver.ui.Article.prototype.getPageWidth = function() {
  if (this.constraint) {
    return this.constraint.w;
  }

  return 0;
};

/**
 * Return an array of pages corresponding to the pages requested.
 *
 * Pages that have been paginated and are ready are returned immediately
 * If pages are not ready, null is returned in their place
 * If the pages requested are outside the total number of pages in the
 * article, a shorter array is returned (i.e. if the first 5 pages are
 * requested, but the article only has 3 pages, then an array with 3 items
 * will be returned)
 *
 * @param {number} start  If negative, counts from end of document.
 * @param {number} count  Number of pages requested.
 * @return {Array.<treesaver.layout.Page>}
 */
treesaver.ui.Article.prototype.getPages = function(start, count) {
  if (goog.DEBUG) {
    // Do we have our content yet?
    if (!this.loaded) {
      if (!this.loading) {
        treesaver.debug.error('Tried to getPages on non-loaded article');
      }

      // Return dead pages, fire event when they are ready
      return new Array(count);
    }
  }

  // If the pages are invalid, then we're out of luck in terms of re-use
  if (!this.paginationClean) {
    // Scrap what we had before
    this.resetPagination();
  }

  var pages = [],
      max_requested = start >= 0 ? (start + count - 1) : Infinity,
      i, new_max;

  // Whatever pages we have are valid, but see if we need to get more
  if (!this.paginationComplete && max_requested > this.pages.length - 1) {
    // We are missing pages, so queue up a task to paginate the remaining
    // ones asynchronously. Client should then listen to pagination events
    // to know when to re-query for pages again
    this.paginateAsync([true, max_requested]);
  }

  if (!this.paginationComplete) {
    // No way of knowing how many total pages there will be, pad array
    // with empties
    pages.length = count;

    if (start < 0) {
      // Can't return anything sensible since we need to start at end,
      // so exit early
      return pages;
    }
  }
  else {
    // Make sure we're not trying to get more pages than we have
    count = Math.min(count, this.pageCount -
        (start >= 0 ? start : start - 1));
  }

  // Loop varies if counting backwards
  if (start < 0) {
    for (i = -start; i <= count; i += 1) {
      pages[i + start] = this.pages[this.pageCount - i];
    }
  }
  else {
    for (i = start; i < start + count; i += 1) {
      pages[i - start] = this.pages[i];
    }
  }

  return pages;
};

/**
 * Find the index of the page that contains the given position
 * will do asynchronous pagination in order to find out
 *
 * @param {?treesaver.layout.ContentPosition} position
 * @return {number} Index of the page with that position, -1 if it is
 *                  currently unknown because the content hasn't paginated
 *                  that far yet.
 */
treesaver.ui.Article.prototype.getPageIndex = function(position) {
  if (!this.content) {
    // Haven't loaded yet
    return -1;
  }

  var i, len, cur;

  // Special case for first page
  if (!position || position.atBeginning()) {
    return 0;
  }

  // If the pages are invalid, then we're out of luck
  if (!this.paginationClean) {
    // Scrap what we had before
    this.resetPagination();
  }

  // We might need to paginate more
  if (!this.paginationComplete) {
    if (position === treesaver.layout.ContentPosition.END || !this.pageCount ||
        !position.lessOrEqual(this.pages[this.pageCount - 1].end)) {
      // Need to paginate up to that position
      // TODO: Postpone this
      this.paginateAsync([true, null, position]);
      return -1;
    }
  }

  // Special case for the last page request
  if (position === treesaver.layout.ContentPosition.END) {
    // If we've paginated, give the last page, otherwise we don't know
    return this.paginationComplete ? this.pageCount - 1 : -1;
  }

  // Go through each page to find where we can stop
  for (i = 0, len = this.pageCount; i < len; i += 1) {
    if (this.pages[i].end.greater(position)) {
      return i;
    }
  }

  // If pagination is complete, then we can give out the last page since
  // that's where the content certainly occurs at this point
  // However, if pagination isn't complete, then return -1 to indicate that
  // we don't know where the position occurs
  return this.paginationComplete ? this.pageCount - 1 : -1;
};

if (goog.DEBUG) {
  treesaver.ui.Article.prototype.toString = function() {
    return '[treesaver.ui.Article]';
  };
}

// Input 26
/**
 * @fileoverview Implementation of the HTMl5 Microdata specification.
 */
goog.provide('treesaver.microdata');

goog.require('treesaver.array');
goog.require('treesaver.constants');
goog.require('treesaver.dom');
goog.require('treesaver.string');

if (SUPPORT_MICRODATA && !treesaver.capabilities.SUPPORTS_MICRODATA) {

   /**
   * Returns the itemValue of an Element.
   *
   * @param {!Element} element The element to extract the itemValue for.
   * @return {!string} The itemValue of the element.
   */
  function getItemValue(element) {
    var elementName = element.nodeName;

    if (elementName === 'META') {
      return element.content;
    } else if (['AUDIO', 'EMBED', 'IFRAME',
                'IMG', 'SOURCE', 'VIDEO'].indexOf(elementName) !== -1) {
      return element.src;
    } else if (['A', 'AREA', 'LINK'].indexOf(elementName) !== -1) {
      return element.href;
    } else if (elementName === 'OBJECT') {
      return element.data;
    } else if (elementName === 'TIME' &&
                treesaver.dom.hasAttr(element, 'datetime')) {
      return element.dateTime;
    } else {
      return treesaver.dom.innerText(element);
    }
  }

  /**
   * Returns the properties for the given item.
   *
   * @param {!Element} item The item for which to find the properties.
   * @return {!Array} The properties for the item.
   */
  function getProperties(item) {
    var root = item,
        pending = [],
        properties = [],
        references = [],
        children = [],
        current;

    children = treesaver.array.toArray(root.childNodes);

    pending = children.filter(function(element) {
      return element.nodeType === 1;
    });

    if (treesaver.dom.hasAttr(root, 'itemref')) {
      references = root.getAttribute('itemref').trim().split(/\s+/);

      references.forEach(function(reference) {
        var element = document.getElementById(reference);

        if (element) {
          pending.push(element);
        }
      });
    }

    pending = pending.filter(function(candidate, index) {
      var scope = null,
          parent = candidate,
          ancestors = [];

      // Remove duplicates
      if (pending.indexOf(candidate) !== index &&
          pending.indexOf(candidate, index) !== -1) {
        return false;
      }

      while ((parent = parent.parentNode) !== null && parent.nodeType === 1) {
        ancestors.push(parent);
        if (treesaver.dom.hasAttr(parent, 'itemscope')) {
          scope = parent;
          break;
        }
      }

      if (scope !== null) {
        // If one of the other elements in pending is an ancestor element of
        // candidate, and that element is scope, then remove candidate from
        // pending.
        if (pending.indexOf(scope) !== -1) {
          return false;
        }

        // If one of the other elements in pending is an ancestor element of
        // candidate, and either scope is null or that element also has scope
        // as its nearest ancestor element with an itemscope attribute
        // specified, then remove candidate from pending.
        return !ancestors.some(function(ancestor) {
          var elementIndex = -1,
              elementParent,
              elementScope = null;

          // If ancestor is in pending
          if ((elementIndex = pending.indexOf(ancestor)) !== -1) {
            elementParent = pending[elementIndex];

            // Find the nearest ancestor element with an itemscope attribute
            while ((elementParent = elementParent.parentNode) !== null &&
                    elementParent.nodeType === 1) {
              if (treesaver.dom.hasAttr(elementParent, 'itemscope')) {
                elementScope = elementParent;
                break;
              }
            }
            // The nearest ancestor element equals scope
            if (elementScope === scope) {
              return true;
            }
          }
          return false;
        });
      }
      return true;
    });

    pending.sort(function(a, b) {
      return 3 - (treesaver.dom.compareDocumentPosition(b, a) & 6);
    });

    while ((current = pending.pop())) {
      if (treesaver.dom.hasAttr(current, 'itemprop')) {
        properties.push(current);

        // This is a necessary deviation from the normal algorithm because
        // we can not modify the Element prototype in IE7, so we recursively
        // calculate the properties for each property that has an itemscope.
        if (treesaver.dom.hasAttr(current, 'itemscope')) {
          current['itemScope'] = true;
          current['properties'] = getProperties(current);
        }
      }
      if (!treesaver.dom.hasAttr(current, 'itemscope')) {
        // Push all the child elements of current onto pending, in tree order
        // (so the first child of current will be the next element to be
        // popped from pending).
        children = treesaver.array.toArray(current.childNodes).reverse();
        children.forEach(function(child) {
          if (child.nodeType === 1) {
            pending.push(child);
          }
        });
      }
    }

    properties.forEach(function(property) {
      // Attach the (none-live) itemValue attribute to the element
      if (treesaver.dom.hasAttr(property, 'itemscope')) {
        property['itemValue'] = property;
      } else {
        property['itemValue'] = getItemValue(property);
      }

      property['itemProp'] = property.getAttribute('itemprop');
    });

    return properties;
  }

  /**
   * Returns an Array of the elements in the Document that create items,
   * that are not part of other items, and that are of one of the types
   * given in the argument, if any are listed.
   *
   * @param {?string=} types A space-separated list of types.
   * @param {Element=} root The root element to use as
   * context.
   * @return {!Array} A non-live Array of elements.
   */
  function getItems(types, root) {
    var items = [];

    if (types && /\S/.test(types)) {
      types = types.trim().split(/\s+/);
    } else {
      types = [];
    }

    if (root && treesaver.dom.hasAttr(root, 'itemscope')) {
      items.push(root);
    }

    // Retrieve all microdata items
    items = items.concat(treesaver.dom.getElementsByProperty('itemscope', null, null, root));

    // Filter out top level items, and optionally items that match
    // the given types.
    items = items.filter(function(item) {
      if (!treesaver.dom.hasAttr(item, 'itemprop')) {
        if (types.length === 0 ||
            (treesaver.dom.hasAttr(item, 'itemtype') &&
             types.indexOf(item.getAttribute('itemtype')) !== -1)) {

          item['itemScope'] = true;

          // Attach the (none-live) properties attribute to the element
          item['properties'] = getProperties(item);

          if (treesaver.dom.hasAttr(item, 'itemid')) {
            item['itemId'] = item.getAttribute('itemid');
          }

          if (treesaver.dom.hasAttr(item, 'itemref')) {
            item['itemRef'] = item.getAttribute('itemRef');
          }

          if (treesaver.dom.hasAttr(item, 'itemtype')) {
            item['itemType'] = item.getAttribute('itemtype');
          }

          return true;
        }
      }
      return false;
    });
    return items;
  }
  document['getItems'] = getItems;
}

// This code assumes the microdata API is available. Either
// the implementation above, or a native one.
if (SUPPORT_MICRODATA) {
  /**
   * Returns the JSON representation of a microdata item.
   *
   * @private
   * @param {!Element} item The element to generate the representation for.
   * @return {!Object} The JSON representation of an item.
   */
  treesaver.microdata.getObject_ = function(item) {
    var result = {},
        properties = {},
        flags = {};

    if (item['itemType']) {
      result.type = item['itemType'];
    }
    if (item['itemId']) {
      result.id = item['itemId'];
    }

    if (treesaver.dom.hasAttr(item, 'data-properties')) {
      item.getAttribute('data-properties').split(/\s+/g).
        forEach(function(p) {
          flags[p] = true;
        });
      result.flags = flags;
    }

    item.properties.forEach(function(property) {
      var value = property['itemValue'],
          names = [];

      // If value is an item (i.e. value has an itemScope attribute)
      if (value['itemScope']) {
        value = treesaver.microdata.getObject_(value);
      }

      names = property['itemProp'].split(/\s+/g);

      names.forEach(function(n) {
        if (!properties[n]) {
          properties[n] = [];
        }
        properties[n].push(value);
      });
    });
    result.properties = properties;
    return result;
  };

  /**
   * Returns an Array of the elements in the document or descendants of
   * the root node that create items, that are not part of other items,
   * and that are of one of the types given in the argument, if any are
   * listed.
   *
   * @param {?string=} types A space-separated list of types.
   * @param {HTMLDocument|Element=} root The root element to use as
   * context.
   * @return {!Array} A non-live Array of elements.
   */
  treesaver.microdata.getItems = function(types, root) {
    if (treesaver.capabilities.SUPPORTS_MICRODATA) {
      // Fake the root parameter by filtering out microdata items
      // based on their ancestors.
      var items = treesaver.array.toArray(document.getItems(types));

      if (!root) {
        return items;
      }

      return items.filter(function(item) {
        return root.contains(item);
      });
    } else {
      // We are using our own microdata implementation,
      // which supports the context parameter.
      return document.getItems(types, root);
    }
  };

  /**
   * Returns a JSON representation of the microdata items
   * that match the given types.
   *
   * @param {?string=} types A space-separated list of types.
   * @param {HTMLDocument|Element=} root The root element to use as
   * context.
   * @return {!Array} A Array of Objects representing micro-
   * data items.
   */
  treesaver.microdata.getJSONItems = function(types, root) {
    var items = treesaver.microdata.getItems(types, root);
    return items.map(function(item) {
      return treesaver.microdata.getObject_(item);
    });
  };

  /**
   * Normalizes a microdata item by pulling out values from
   * the properties array and reducing multiple values to a
   * single value.
   *
   * @private
   * @param {!Object} obj The microdata item to normalize.
   * @return {!Object} A normalized microdata item.
   */
  treesaver.microdata.normalizeItem = function (obj) {
    var result = {},
        keys;

    if (obj.properties) {
      keys = treesaver.object.keys(obj.properties);
      keys.forEach(function(key) {
        var v = obj.properties[key][0];

        if (treesaver.object.isObject(v)) {
          v = treesaver.layout.normalizeItem(v);
        }
        result[key] = v;
      });
    }
    return result;
  };
}

// Input 27
/**
 * @fileoverview Extract resources defined in an external HTML file.
 */

goog.provide('treesaver.resources');

goog.require('treesaver.constants');
goog.require('treesaver.debug');
goog.require('treesaver.dom');
goog.require('treesaver.network');

/**
 * Loads resource file for the current document, as specified through
 * <link rel="resources" /> in the <head>
 *
 * @param {!function()} callback
 */
treesaver.resources.load = function(callback) {
  var url = treesaver.resources.getResourcesLinkUrl_();

  if (!url) {
    treesaver.debug.error('No link to resources found');

    // Technically, we're done loading
    callback();

    return;
  }

  // Are we in the loading process?
  if (treesaver.resources.loadStatus_) {
    if (treesaver.resources.loadStatus_ ===
        treesaver.resources.LoadStatus.LOADED) {
      // Already loaded, callback immediately
      callback();
    }
    else {
      // Not loaded yet, add callback to list
      treesaver.resources.callbacks_.push(callback);
    }

    return;
  }

  treesaver.debug.info('Loading resources from: ' + url);

  // Set loading flag
  treesaver.resources.loadStatus_ = treesaver.resources.LoadStatus.LOADING;
  // Create callback array
  treesaver.resources.callbacks_ = [callback];

  treesaver.network.get(url, treesaver.resources.processResourceFile);
};

/**
 *
 * @param {string} html
 */
treesaver.resources.processResourceFile = function(html) {
  // Create the main container
  treesaver.resources.container_ = document.createElement('div');

  if (html) {
    var div = document.createElement('div');
    // Prevent any layout
    div.style.display = 'none';

    // Must attach element into the tree to avoid parsing issues from
    // HTML5 shiv in IE using innerHTML
    if (SUPPORT_IE) {
      treesaver.dom.safeAppendToDocument(div);
    }

    // Parse the HTML
    div.innerHTML = html;

    // Grab all the direct <div> children and place them into the container
    treesaver.array.toArray(div.childNodes).forEach(function(child) {
      if (child.nodeType === 1 && child.nodeName.toLowerCase() === 'div') {
        treesaver.resources.container_.appendChild(child);
      } else if (child.nodeType === 1 && child.nodeName.toLowerCase() === 'body') {
        // FIXME: Find a better way to deal with the inconsistencies between browsers
        // when appending a document to an element.
        treesaver.array.toArray(child.childNodes).forEach(function(bodyChild) {
          if (bodyChild.nodeType === 1 && bodyChild.nodeName.toLowerCase() === 'div') {
            treesaver.resources.container_.appendChild(bodyChild);
          }
        });
      }
    });

    // Clean up
    if (SUPPORT_IE) {
      div.parentNode.removeChild(div);
    }
    div.innerHTML = '';
  }
  else {
    treesaver.debug.error('Could not load resource file');
  }

  treesaver.resources.loadComplete_();
};

/**
 * Called when the resource file has finished processing
 */
treesaver.resources.loadComplete_ = function() {
  treesaver.resources.loadStatus_ = treesaver.resources.LoadStatus.LOADED;

  // Clone callback array
  var callbacks = treesaver.resources.callbacks_.slice(0);

  // Clear out old callbacks
  treesaver.resources.callbacks_ = [];

  // Do callbacks
  callbacks.forEach(function(callback) {
    callback();
  });
};

/**
 * Return resources based on class name
 *
 * @param {!string} className
 * @return {!Array.<Element>} Array of matching resource elements.
 */
treesaver.resources.findByClassName = function(className) {
  // TODO: Restrict only to top-level children?
  return treesaver.resources.container_ ? treesaver.dom.
    getElementsByClassName(className, treesaver.resources.container_) :
    [];
};

/**
 * Clear all data structures
 */
treesaver.resources.unload = function() {
  treesaver.resources.container_ = null;
  treesaver.resources.loadStatus_ = treesaver.resources.LoadStatus.NOT_LOADED;
  treesaver.resources.callbacks_ = [];
};

/**
 * Find the resource URL specified in the <head> in the first <link>
 * element with rel=resources
 *
 * @private
 * @return {?string} The url, if one was found.
 */
treesaver.resources.getResourcesLinkUrl_ = function() {
  var links = document.getElementsByTagName('link'),
      i, len = links.length;

  for (i = 0; i < len; i += 1) {
    if (links[i].rel.toLowerCase().indexOf('resources') !== -1) {
      return links[i].getAttribute('href');
    }
  }

  return null;
};

/**
 * Load status enum
 * @enum {number}
 */
treesaver.resources.LoadStatus = {
  LOADED: 2,
  LOADING: 1,
  NOT_LOADED: 0
};

/**
 * Load status of resources
 *
 * @private
 * @type {treesaver.resources.LoadStatus}
 */
treesaver.resources.loadStatus_;

/**
 * Callbacks
 *
 * @private
 * @type {Array.<function()>}
 */
treesaver.resources.callbacks_;

/**
 * DOM container for all resource elements
 *
 * @private
 * @type {Element}
 */
treesaver.resources.container_;

// Input 28
/**
 * @fileoverview JSON wrapper methods for older browsers.
 */

goog.provide('treesaver.json');

goog.require('treesaver.capabilities');
goog.require('treesaver.constants');
goog.require('treesaver.debug');

/**
 * Parse JSON and return the object
 *
 * @param {!string} str
 * @return {*}
 */
treesaver.json.parse = function(str) {
  return window.JSON.parse(str);
};

/**
 * Convert a value into JSON
 *
 * @param {*} val
 * @return {!string}
 */
treesaver.json.stringify = function(val) {
  return window.JSON.stringify(val);
};

if (SUPPORT_LEGACY && !('JSON' in window)) {
  treesaver.debug.info('Non-native JSON implementation');

  // TODO: Consider a secure implementation
  treesaver.json.parse = function(str) {
    var s = '(' + str + ')';

    try {
      return eval(s);
    }
    catch (ex) {
    }

    // TODO: Throw error?
    return null;
  };

  // Only storage uses stringify, and does so only on browsers with JSON
  // support, so we don't need to support this manually
  treesaver.json.stringify = function(val) {
    return '';
  };
}

// Input 29
/**
 * @fileoverview Simple online/offline storage system.
 */

goog.provide('treesaver.storage');

goog.require('treesaver.array'); // forEach
goog.require('treesaver.debug');
goog.require('treesaver.json');

/**
 * @param {!string} key
 * @param {!*} value
 * @param {boolean=} persist
 */
treesaver.storage.set = function set(key, value, persist) {
  var store = persist ? window.localStorage : window.sessionStorage;

  // iPad throws QUOTA_EXCEEDED_ERR frequently here, even though we're not
  // using that much storage
  // Clear the storage first in order to avoid this error

  // IE9 throws if you remove an item that does not exist
  // TODO: Clean this once IE fixes the bug
  // Ref: https://connect.microsoft.com/IE/feedback/details/613497/web-storage-remove-method-not-working-according-to-the-spec#
  if (!SUPPORT_IE || store.getItem(key)) {
    store.removeItem(key);
  }

  try {
    store.setItem(key, treesaver.json.stringify(value));
  }
  catch (ex) {
    // Still happened, not much we can do about it
    // TODO: Do something about it? :)
  }
};

/**
 * @param {!string} key
 * @return {*} Previously stored value, if any.
 */
treesaver.storage.get = function set(key) {
  // Session take precedence over local
  var val = window.sessionStorage.getItem(key) || window.localStorage.getItem(key);

  if (val) {
    return treesaver.json.parse( /** @type {string} */ (val));
  }
  else {
    return null;
  }
};

/**
 * @param {!string} key
 */
treesaver.storage.clear = function set(key) {
  // IE9 goes against spec here and throws an exception
  // if the key doesn't exist. Be defensive
  if (!SUPPORT_IE || window.sessionStorage.getItem(key)) {
    window.sessionStorage.removeItem(key);
  }
  if (!SUPPORT_IE || window.localStorage.getItem(key)) {
    window.localStorage.removeItem(key);
  }
};

/**
 * Returns a list of keys currently used in storage
 *
 * @param {string=} prefix
 * @return {!Array.<string>}
 */
treesaver.storage.getKeys_ = function(prefix) {
  var all_keys = [],
      i, len, key,
      prefix_len;

  prefix = prefix || '';
  prefix_len = prefix.length;

  for (i = 0, len = window.localStorage.length; i < len; i += 1) {
    key = window.localStorage.key(i);
    if (key && (!prefix || prefix === key.substr(0, prefix_len))) {
      all_keys.push(window.localStorage.key(i));
    }
  }

  for (i = 0, len = window.sessionStorage.length; i < len; i += 1) {
    key = window.sessionStorage.key(i);
    if (all_keys.indexOf(key) === -1 &&
        (!prefix || prefix === key.substr(0, prefix_len))) {
      all_keys.push(key);
    }
  }

  return all_keys;
};

/**
 * Cleans up space in localStorage
 * @param {string=} prefix
 * @param {!Array.<string>=} whitelist
 */
treesaver.storage.clean = function clean(prefix, whitelist) {
  var blacklist = [];
  treesaver.storage.getKeys_(prefix).forEach(function(key) {
    if (!whitelist || whitelist.indexOf(key) === -1) {
      treesaver.storage.clear(key);
    }
  });
};

// Storage helper functions only needed for browsers that don't have
// native support
if (!treesaver.capabilities.SUPPORTS_LOCALSTORAGE) {
  treesaver.debug.warn('Using fake localStorage');

  /**
   * In-memory data store
   *
   * @private
   * @type {Object.<string, *>}
   */
  treesaver.storage.dataStore_ = {};

  // Override for browsers without native storage
  treesaver.storage.set = function set(key, value, persist) {
    treesaver.storage.dataStore_[key] = value;
  };

  // Override for browsers without native storage
  treesaver.storage.get = function set(key) {
    return treesaver.storage.dataStore_[key];
  };

  // Override for browsers without native storage
  treesaver.storage.clear = function set(key) {
    delete treesaver.storage.dataStore_[key];
  };

  // Override for browsers without native storage
  treesaver.storage.getKeys_ = function(prefix) {
    return [];
  };
}

// Input 30
/**
 * @fileoverview Article manager class.
 */

goog.provide('treesaver.ui.ArticleManager');

goog.require('treesaver.debug');
goog.require('treesaver.dimensions');
goog.require('treesaver.dom');
goog.require('treesaver.events');
goog.require('treesaver.microdata');
goog.require('treesaver.network');
goog.require('treesaver.resources');
goog.require('treesaver.storage');
goog.require('treesaver.ui.Article');

/**
 * @const
 * @type {!string}
 */
treesaver.ui.ArticleManager.CACHE_STORAGE_PREFIX = 'cache:';

/**
 * Initialize all content
 * @param {?string} initialHTML
 */
treesaver.ui.ArticleManager.load = function(initialHTML) {
  // Initialize state
  treesaver.ui.ArticleManager.currentArticle = null;
  treesaver.ui.ArticleManager.currentPosition = null;
  treesaver.ui.ArticleManager.currentPageIndex = -1;
  treesaver.ui.ArticleManager.currentArticleIndex = null;
  treesaver.ui.ArticleManager.currentTransitionDirection = null;
  treesaver.ui.ArticleManager.currentPageWidth = null;

  // Data store
  treesaver.ui.ArticleManager.articleOrder = [];
  treesaver.ui.ArticleManager.articleMap = {};
  treesaver.ui.ArticleManager.articles = {};
  treesaver.ui.ArticleManager.toc = [];
  /**
   * @private
   */
  treesaver.ui.ArticleManager.grids_ = treesaver.ui.ArticleManager.getGrids_();

  if (!treesaver.ui.ArticleManager.grids_) {
    treesaver.debug.error('No grids');

    return false;
  }

  // Set up the loading & error pages
  treesaver.ui.ArticleManager.initLoadingPage();
  treesaver.ui.ArticleManager.initErrorPage();

  treesaver.ui.ArticleManager.initialUrl = treesaver.network.stripHash(document.location.href);
  treesaver.ui.ArticleManager.initialHTML = initialHTML;

  // Set the display to the current article?
  if (initialHTML) {
    var initialArticle = new treesaver.ui.Article(treesaver.ui.ArticleManager.initialUrl,
                                          document.title,
                                          treesaver.ui.ArticleManager.grids_,
                                          initialHTML);

    if (!initialArticle.error) {
      treesaver.ui.ArticleManager.articles[treesaver.ui.ArticleManager.initialUrl] = initialArticle;
      treesaver.ui.ArticleManager._setArticle(initialArticle, null, 0, true);
    }
    else {
      treesaver.debug.warn('Error in initial article');

      // Unload and show plain content
      treesaver.core.unload();
    }
  }
  else {
    treesaver.debug.warn('No initial article');
    // What to do here?
  }

  // Set up event handlers
  treesaver.ui.ArticleManager.watchedEvents.forEach(function(evt) {
    treesaver.events.addListener(document, evt, treesaver.ui.ArticleManager.handleEvent);
  });

  window['onpopstate'] = treesaver.ui.ArticleManager.onPopState;

  // Download the table of contents
  treesaver.ui.ArticleManager.generateTOC();

  return true;
};

/**
 * Return an array of Grid objects, using the elements in the resources
 *
 * @private
 * @return {Array.<treesaver.layout.Grid>}
 */
treesaver.ui.ArticleManager.getGrids_ = function() {
  var grids = [];

  treesaver.resources.findByClassName('grid').forEach(function(node) {
    var requires = node.getAttribute('data-requires'),
        grid;
    // Make sure the grid meets our requirements
    if (!requires || treesaver.capabilities.check(requires.split(' '))) {
      // Initialize each grid and store
      grid = new treesaver.layout.Grid(node);
      if (!grid.error) {
        grids.push(grid);
      }
    }
  });

  return grids;
};

/**
 * Initialize the loading page
 */
treesaver.ui.ArticleManager.initLoadingPage = function() {
  var el = treesaver.resources.findByClassName('loading')[0];

  // Craft a dummy page if none is there
  if (!el) {
    el = document.createElement('div');
  }

  // Needed for correct positioning in chrome
  document.body.appendChild(el);
  el.style.top = '50%';
  treesaver.dimensions.setCssPx(el, 'margin-top', -treesaver.dimensions.getOffsetHeight(el) / 2);
  document.body.removeChild(el);

  treesaver.ui.ArticleManager.loadingPageHTML = treesaver.dom.outerHTML(el);
  el = /** @type {!Element} */ (el.cloneNode(true));
  document.body.appendChild(el);
  treesaver.ui.ArticleManager.loadingPageSize = new treesaver.dimensions.Metrics(el);
  document.body.removeChild(el);
};

/**
 * Initialize the error page
 */
treesaver.ui.ArticleManager.initErrorPage = function() {
  var el = treesaver.resources.findByClassName('error')[0];

  // Craft a dummy page if none is there
  if (!el) {
    el = document.createElement('div');
  }

  // Needed for correct positioning in chrome
  document.body.appendChild(el);
  el.style.top = '50%';
  treesaver.dimensions.setCssPx(el, 'margin-top', treesaver.dimensions.getOffsetHeight(el) / 2);
  document.body.removeChild(el);

  treesaver.ui.ArticleManager.errorPageHTML = treesaver.dom.outerHTML(el);
  el = /** @type {!Element} */ (el.cloneNode(true));
  document.body.appendChild(el);
  treesaver.ui.ArticleManager.errorPageSize = new treesaver.dimensions.Metrics(el);
  document.body.removeChild(el);
};

/**
 * Clear references and disconnect events
 */
treesaver.ui.ArticleManager.unload = function() {
  // Clear out state
  treesaver.ui.ArticleManager.currentArticle = null;
  treesaver.ui.ArticleManager.currentPosition = null;
  treesaver.ui.ArticleManager.currentPageIndex = null;
  treesaver.ui.ArticleManager.currentArticleIndex = null;
  treesaver.ui.ArticleManager.currentTransitionDirection = null;

  // Clear data store
  treesaver.ui.ArticleManager.articleOrder = null;
  treesaver.ui.ArticleManager.articleMap = null;
  treesaver.ui.ArticleManager.articles = null;
  treesaver.ui.ArticleManager.toc = null;

  treesaver.ui.ArticleManager.loadingPageHTML = null;
  treesaver.ui.ArticleManager.loadingPageSize = null;

  // Unhook events
  treesaver.ui.ArticleManager.watchedEvents.forEach(function(evt) {
    treesaver.events.removeListener(document, evt, treesaver.ui.ArticleManager.handleEvent);
  });
  window['onpopstate'] = null;
};

/**
 * @type {Object.<string, string>}
 */
treesaver.ui.ArticleManager.events = {
  TOCUPDATED: 'treesaver.tocupdated',
  ARTICLECHANGED: 'treesaver.articlechanged',
  PAGESCHANGED: 'treesaver.pageschanged'
};

/**
 * @enum {number}
 */
treesaver.ui.ArticleManager.transitionDirection = {
  FORWARD: 1,
  NEUTRAL: 0,
  BACKWARD: -1
};

/**
 * @private
 * @type {Array.<string>}
 */
treesaver.ui.ArticleManager.watchedEvents = [
  treesaver.ui.Article.events.LOADED,
  treesaver.ui.Article.events.LOADFAILED,
  treesaver.ui.Article.events.PAGINATIONPROGRESS
];

/**
 * @param {Object} e
 */
treesaver.ui.ArticleManager.handleEvent = function(e) {
  if (e.type === treesaver.ui.Article.events.PAGINATIONPROGRESS) {
    // We have new pages to display
    // TODO
    // Fire event
    treesaver.events.fireEvent(document, treesaver.ui.ArticleManager.events.PAGESCHANGED);
    return;
  }

  if (e.type === treesaver.ui.Article.events.LOADED) {
    // TODO
    // If it's the current article, kick off pagination?
    // If it's the next, kick it off too?
    // Where does size come from?
    treesaver.events.fireEvent(document, treesaver.ui.ArticleManager.events.PAGESCHANGED);
    return;
  }

  if (e.type === treesaver.ui.Article.events.LOADFAILED &&
      e.article === treesaver.ui.ArticleManager.currentArticle) {
    // The current article failed to load, redirect to it
    treesaver.ui.ArticleManager._redirectToArticle(treesaver.ui.ArticleManager.currentArticle);

    return;
  }
};

/**
 * @param {!Event} e  Event with e.state for state storage.
 */
treesaver.ui.ArticleManager.onPopState = function(e) {
  treesaver.debug.info('onPopState event received: ' +
      (e['state'] ? e['state'].url : 'No URL'));

  if (e['state']) {
    var index = e['state'].index;

    if (index || index === 0) {
      treesaver.ui.ArticleManager._setArticle(treesaver.ui.ArticleManager.articleOrder[index],
          e['state'].position, index, true);
    }
    else {
      treesaver.ui.ArticleManager.goToArticleByURL(e['state'].url);
    }
  }
  else {
    // Assume initial article
    treesaver.ui.ArticleManager.goToArticleByURL(treesaver.ui.ArticleManager.initialUrl);
  }
};

/**
 * Finds the URL of the Table of Contents, based on the <link rel="contents" />
 * element. If no such element exists, the current document is used.
 *
 * @private
 * @return {string}
 */
treesaver.ui.ArticleManager.getTOCLocation = function() {
  var link = treesaver.dom.getElementsByProperty('rel', 'contents', 'link')[0],
      url;

  // Is the current document the index?
  // Treat no TOC link as being a self-index
  if (!link || link.getAttribute('rel').indexOf('self') !== -1) {
    url = treesaver.ui.ArticleManager.initialUrl;
  }
  else {
    url = treesaver.network.absoluteURL(link.href);
  }

  return url;
};

/**
 * Create the data structure for holding articles
 * Download the table of contents for this issue asynchronously
 * @private
 */
treesaver.ui.ArticleManager.generateTOC = function() {
  var url = treesaver.ui.ArticleManager.getTOCLocation();

  // We can use the original HTML if this is the index, and we are not
  // running from an old cached version while online
  if (url === treesaver.ui.ArticleManager.initialUrl &&
      !(treesaver.network.loadedFromCache() && treesaver.network.isOnline())) {
    // Current article is the up-to-date index
    treesaver.ui.ArticleManager.findTOCLinks(treesaver.ui.ArticleManager.initialHTML, url);
  }
  else {
    // In all other cases, fetch the article, then process
    treesaver.network.get(url, treesaver.ui.ArticleManager.findTOCLinks);
  }
};

/**
 * Search the string of HTML for links that indicate the table of
 * contents. Then update the internal TOC storage
 *
 * @private
 * @param {?string} html String of HTML which may contain links.
 * @param {string} toc_url URL of the TOC.
 */
treesaver.ui.ArticleManager.findTOCLinks = function(html, toc_url) {
  var initialArticleIsTOC = (toc_url === treesaver.ui.ArticleManager.initialUrl);

  if (html) {
    // Don't use storage when native
    if (!WITHIN_IOS_WRAPPER) {
      // Cache the result no matter what
      treesaver.storage.set(treesaver.ui.ArticleManager.CACHE_STORAGE_PREFIX + toc_url,
          html, true);
    }

    // If the initial was loaded from the cache, we could have stale content in the DOM
    if (initialArticleIsTOC && treesaver.network.loadedFromCache()) {
      // Content would only be new if we are online
      if (treesaver.network.isOnline()) {
        // Re-process the current article with the updated content
        treesaver.ui.ArticleManager.currentArticle.processHTML(html);
        // Make sure chrome re-queries pages
        treesaver.events.fireEvent(document, treesaver.ui.ArticleManager.events.PAGESCHANGED);
      }
    }
  }
  else {
    // Don't use storage when native
    if (!WITHIN_IOS_WRAPPER) {
      // TOC failed to load, check the cache
      html = treesaver.storage.get(treesaver.ui.ArticleManager.CACHE_STORAGE_PREFIX + toc_url);
    }

    if (!html) {
      // We don't have content for a TOC, so there is nothing more we can do
      return;
    }
  }

  var unique_urls = [],
      foundTOC = false;

  treesaver.ui.ArticleManager.parseTOC(/** @type {!string} */ (html));

  treesaver.ui.ArticleManager.toc.forEach(function(item) {
    var url,
        article,
        i;

    // data-properties=self is used by the TOC to indicate its position in the article
    // order. Make sure to use the TOC url we already computed in order to avoid
    // duplicates such as '/' and '/index.html'.
    if (item.flags['self']) {
      url = toc_url;
      item.fields.url = toc_url;
      foundTOC = true;
    }
    else {
      url = treesaver.network.absoluteURL(item.fields['url']);
    }

    article = treesaver.ui.ArticleManager.articles[url];
    i = treesaver.ui.ArticleManager.articleOrder.length;

    // Have we seen this URL before?
    if (!article) {
      // Have not seen the url, create a new article and store
      article = new treesaver.ui.Article(url, item.fields['title'] || '', treesaver.ui.ArticleManager.grids_);
      treesaver.ui.ArticleManager.articles[url] = article;
    }

    // Now store the indicies where the article occurs (since an article can appear
    // multiple times)
    if (!treesaver.ui.ArticleManager.articleMap[url]) {
      // First time seeing the article
      treesaver.ui.ArticleManager.articleMap[url] = [i];
      unique_urls.push(treesaver.ui.ArticleManager.CACHE_STORAGE_PREFIX + url);

      if (url === treesaver.ui.ArticleManager.initialUrl) {
        // Current article is initial
        treesaver.ui.ArticleManager.currentArticleIndex = i;
      }
    }
    else {
      // Add another occurence
      treesaver.ui.ArticleManager.articleMap[url].push(i);
    }

    // Add into the order
    treesaver.ui.ArticleManager.articleOrder.push(article);
  });

  // Clear out old article storage
  if (!WITHIN_IOS_WRAPPER) {
    treesaver.storage.clean(treesaver.ui.ArticleManager.CACHE_STORAGE_PREFIX, unique_urls);
  }

  // TODO: Fire an event (let's chrome know it can display)
  treesaver.events.fireEvent(document, treesaver.ui.ArticleManager.events.TOCUPDATED);
};

/**
 * Parse the TOC using the microdata API. Out of necessity we
 * append the container node to the document first, and remove
 * it afterwards.
 *
 * @param {!string} html The string to find TOC content in.
 * @private
 */
treesaver.ui.ArticleManager.parseTOC = function(html) {
  var container = document.createElement('div'),
      items = [];

  // Must have container connected to tree for HTML5 parsing in IE
  if (SUPPORT_IE) {
    container.className = 'offscreen';
    document.body.appendChild(container);
  }

  container.innerHTML = html;
  items = treesaver.microdata.getJSONItems(null, container);

  treesaver.ui.ArticleManager.toc = items.map(function(item) {
    var keys = treesaver.object.keys(item.properties),
        result = {
          fields: {},
          flags: item.flags || {}
        };
    keys.forEach(function(key) {
      result.fields[key] = item.properties[key][0];
    });
    return result;
  });

  // Remove from tree if using HTML5 shiv
  if (SUPPORT_IE) {
    document.body.removeChild(container);
  }
};

/**
 * Can the user go to the previous page?
 *
 * @return {boolean}
 */
treesaver.ui.ArticleManager.canGoToPreviousPage = function() {
  // Do we know what page we are on?
  if (treesaver.ui.ArticleManager.currentPageIndex !== -1) {
    // Page 2 and above can always go one back
    if (treesaver.ui.ArticleManager.currentPageIndex >= 1) {
      return true;
    }
    else {
      // If on the first page, depends on whether there's another article
      return treesaver.ui.ArticleManager.canGoToPreviousArticle();
    }
  }
  else {
    // Don't know the page number, so can only go back a page if we're
    // on the first page
    return !treesaver.ui.ArticleManager.currentPosition &&
            treesaver.ui.ArticleManager.canGoToPreviousArticle();
  }
};

/**
 * Go to the previous page in the current article. If we are at
 * the first page of the article, go to the last page of the previous
 * article
 * @return {boolean} False if there is no previous page or article.
 */
treesaver.ui.ArticleManager.previousPage = function() {
  if (goog.DEBUG) {
    if (!treesaver.ui.ArticleManager.currentArticle) {
      treesaver.debug.error('Tried to go to previous article without an article');
      return false;
    }
  }

  // TODO: Try to re-use logic from canGoToPreviousPage
  if (treesaver.ui.ArticleManager.currentPageIndex === -1) {
    if (!treesaver.ui.ArticleManager.currentPosition) {
      if (treesaver.ui.ArticleManager.previousArticle(true)) {
        return true;
      }
    }

    // We have no idea what page we're on, so we can't go back a page
    // TODO: Is there something sane to do here?
    return false;
  }

  var new_index = treesaver.ui.ArticleManager.currentPageIndex - 1;

  if (new_index < 0) {
    // Go to the previous article, if it exists
    if (treesaver.ui.ArticleManager.previousArticle(true)) {
      return true;
    }

    // It doesn't exist, so just stay on the first page
    // No change in state, can return now
    return false;
  }

  treesaver.ui.ArticleManager.currentPageIndex = new_index;

  // Clear the internal position since we're on a new page
  treesaver.ui.ArticleManager.currentPosition = null;

  // Set the transition direction
  treesaver.ui.ArticleManager.currentTransitionDirection =
    treesaver.ui.ArticleManager.transitionDirection.BACKWARD;

  // Fire the change event
  treesaver.events.fireEvent(document, treesaver.ui.ArticleManager.events.PAGESCHANGED);

  return true;
};

/**
 * Can the user go to the next page?
 *
 * @return {boolean}
 */
treesaver.ui.ArticleManager.canGoToNextPage = function() {
  // Do we know what page we are on?
  if (treesaver.ui.ArticleManager.currentPageIndex !== -1) {
    // Do we know there are more pages left?
    if (treesaver.ui.ArticleManager.currentPageIndex <
        treesaver.ui.ArticleManager.currentArticle.pageCount - 1) {
      return true;
    }
    else {
      return treesaver.ui.ArticleManager.currentArticle.paginationComplete &&
             treesaver.ui.ArticleManager.canGoToNextArticle();
    }
  }
  else {
    // Perhaps we're on the last page of the article?
    if (treesaver.ui.ArticleManager.currentPosition === treesaver.layout.ContentPosition.END) {
      return treesaver.ui.ArticleManager.canGoToNextArticle();
    }
    else {
      // We have no idea what page we are on, so we don't know if we can advance
      return false;
    }
  }
};

/**
 * Go to the next page in the current article. If we are at
 * the last page of the article, go to the first page of the next
 * article
 * @return {boolean} False if there is no previous page or article.
 */
treesaver.ui.ArticleManager.nextPage = function() {
  if (goog.DEBUG) {
    if (!treesaver.ui.ArticleManager.currentArticle) {
      treesaver.debug.error('Tried to go to next page without an article');
      return false;
    }
  }

  if (treesaver.ui.ArticleManager.currentPageIndex === -1) {
    if (treesaver.ui.ArticleManager.currentPosition === treesaver.layout.ContentPosition.END) {
      if (treesaver.ui.ArticleManager.nextArticle()) {
        return true;
      }
    }

    // We have no idea what page we're on, so we can't go to the next page
    // TODO: Is there something sane to do here?
    return false;
  }

  var new_index = treesaver.ui.ArticleManager.currentPageIndex + 1;

  if (new_index >= treesaver.ui.ArticleManager.currentArticle.pageCount) {
    if (treesaver.ui.ArticleManager.currentArticle.paginationComplete) {
      // Go to the next article, if it exists
      if (treesaver.ui.ArticleManager.nextArticle()) {
        return true;
      }

      // It doesn't exist, so just stay on the current page
      // No change in state, can return now
      return false;
    }

    // We know there will be a next page, but we don't know
    // anything else yet so stay put
    // No change in state, can return now
    return false;
  }

  // Go to our new index
  treesaver.ui.ArticleManager.currentPageIndex = new_index;

  // Clear the internal position since we're on a new page
  treesaver.ui.ArticleManager.currentPosition = null;

  // Set the transition direction
  treesaver.ui.ArticleManager.currentTransitionDirection =
    treesaver.ui.ArticleManager.transitionDirection.FORWARD;

  // Fire the change event
  treesaver.events.fireEvent(document, treesaver.ui.ArticleManager.events.PAGESCHANGED);

  return true;
};

/**
 * Is there a previous article to go to?
 *
 * @return {boolean}
 */
treesaver.ui.ArticleManager.canGoToPreviousArticle = function() {
  return !!treesaver.ui.ArticleManager.currentArticleIndex;
};

/**
 * Go to the beginning of previous article in the flow
 * @param {boolean=} end Go to the end of the article.
 * @param {boolean=} fetch Only return the article, don't move.
 * @return {treesaver.ui.Article} False if there is no next article.
 */
treesaver.ui.ArticleManager.previousArticle = function(end, fetch) {
  if (!treesaver.ui.ArticleManager.canGoToPreviousArticle()) {
    return null;
  }

  var index = treesaver.ui.ArticleManager.currentArticleIndex - 1,
      article = treesaver.ui.ArticleManager.articleOrder[index];

  return fetch ? article :
    treesaver.ui.ArticleManager._setArticle(article, end ? treesaver.layout.ContentPosition.END : null, index);
};

/**
 * Is there a next article to go to?
 *
 * @return {boolean}
 */
treesaver.ui.ArticleManager.canGoToNextArticle = function() {
  return !!((treesaver.ui.ArticleManager.currentArticleIndex ||
          treesaver.ui.ArticleManager.currentArticleIndex === 0) &&
          treesaver.ui.ArticleManager.currentArticleIndex <
          treesaver.ui.ArticleManager.articleOrder.length - 1);
};

/**
 * Go to the beginning of next article in the flow
 * @param {boolean=} fetch Only return the article, don't move.
 * @return {treesaver.ui.Article} The next article.
 */
treesaver.ui.ArticleManager.nextArticle = function(fetch) {
  if (!treesaver.ui.ArticleManager.canGoToNextArticle()) {
    return null;
  }

  var index = treesaver.ui.ArticleManager.currentArticleIndex + 1,
      article = treesaver.ui.ArticleManager.articleOrder[index];

  return fetch ? article :
    treesaver.ui.ArticleManager._setArticle(article, null, index);
};

/**
 * Go to the article with the given URL, if it exists. Return false if
 * it does not exist
 *
 * @param {!string} url
 * @param {treesaver.layout.ContentPosition=} pos
 * @return {boolean} True if successful.
 */
treesaver.ui.ArticleManager.goToArticleByURL = function(url, pos) {
  var index = treesaver.ui.ArticleManager._getArticleIndex(url),
      article;

  if (!index && index !== 0) {
    return false;
  }

  article = treesaver.ui.ArticleManager.articleOrder[index];
  return treesaver.ui.ArticleManager._setArticle(article, null, index);
};

/**
 * Retrieve an array of pages around the current reading position
 *
 * @param {!treesaver.dimensions.Size} maxSize Maximum allowed size of a page.
 * @param {number}                     buffer  Number of pages on each side of
 *                                             page to retrieve.
 * @return {Array.<?treesaver.layout.Page>} Array of pages, some may be null.
 */
treesaver.ui.ArticleManager.getPages = function(maxSize, buffer) {
  // Fetching pages resets our transition direction
  treesaver.ui.ArticleManager.currentTransitionDirection =
    treesaver.ui.ArticleManager.transitionDirection.NEUTRAL;

  // Set the page size
  if (treesaver.ui.ArticleManager.currentArticle.setMaxPageSize(maxSize)) {
    // Re-layout is required, meaning our pageIndex is worthless
    treesaver.ui.ArticleManager.currentPageIndex = -1;
    // As is the page width
    treesaver.ui.ArticleManager.currentPageWidth = 0;
  }

  // First, let's implement a single page
  var pages = [],
      prevArticle,
      nextArticle,
      startIndex,
      pageCount = 2 * buffer + 1,
      missingPageCount,
      i, j, len;

  // What is the base page?
  if (treesaver.ui.ArticleManager.currentPageIndex === -1) {
    // Look up by position
    treesaver.ui.ArticleManager.currentPageIndex = treesaver.ui.ArticleManager.currentArticle.
      getPageIndex(treesaver.ui.ArticleManager.currentPosition);

    if (treesaver.ui.ArticleManager.currentPageIndex === -1) {
      // If we _still_ don't know the page index, well we need to return blanks
      pages.length = pageCount;
      // One loading page will suffice
      pages[buffer] = treesaver.ui.ArticleManager._createLoadingPage();
      // All done here
      return pages;
    }
  }

  // First page to be requested in current article
  startIndex = treesaver.ui.ArticleManager.currentPageIndex - buffer;

  if (startIndex < 0) {
    prevArticle = treesaver.ui.ArticleManager.previousArticle(false, true);

    if (prevArticle && prevArticle.content && prevArticle.paginationComplete) {
      pages = prevArticle.getPages(startIndex, -startIndex);
    }
    else {
      // Previous article isn't there or isn't ready
      for (i = 0, len = -startIndex; i < len; i += 1) {
        // Don't show loading page, looks weird in the UI and we're not loading
        pages[i] = null;
      }
    }

    missingPageCount = pageCount + startIndex;
    startIndex = 0;
  }
  else {
    missingPageCount = pageCount;
  }

  // Fetch the other pages
  pages = pages.concat(treesaver.ui.ArticleManager.currentArticle.
      getPages(startIndex, missingPageCount));

  missingPageCount = pageCount - pages.length;

  // Do we need to get pages from the next article?
  if (missingPageCount) {
    nextArticle = treesaver.ui.ArticleManager.nextArticle(true);

    if (nextArticle) {
      if (!nextArticle.content) {
        treesaver.ui.ArticleManager._loadArticle(nextArticle);
        // Set size only on first load so pagination can happen
        nextArticle.setMaxPageSize(maxSize);
        // Expand array. Will fill in loading pages below
        pages.length = pageCount;
      }
      else {
        // Always grab starting at the first page
        pages = pages.
          concat(nextArticle.getPages(0, missingPageCount));
      }
    }
    else {
      // No next article = leave blank
    }
  }

  // Use pages.length, not page count to avoid placing a loading page when
  // there isn't a next article
  for (i = buffer, len = pages.length; i < len; i += 1) {
    if (!pages[i]) {
      if (!treesaver.ui.ArticleManager.currentArticle.error) {
        pages[i] = treesaver.ui.ArticleManager._createLoadingPage();
      }
      else {
        pages[i] = treesaver.ui.ArticleManager._createErrorPage();
      }
    }
  }

  // Set our position if we don't have one
  if (!treesaver.ui.ArticleManager.currentPosition ||
      treesaver.ui.ArticleManager.currentPosition === treesaver.layout.ContentPosition.END) {
    // Loading/error pages don't have markers
    if (pages[buffer] && pages[buffer].begin) {
      treesaver.ui.ArticleManager.currentPosition = pages[buffer].begin;
    }
  }

  if (!treesaver.ui.ArticleManager.currentPageWidth) {
    // Set only if it's a real page
    treesaver.ui.ArticleManager.currentPageWidth =
      treesaver.ui.ArticleManager.currentArticle.getPageWidth();
  }

  // Clone any duplicates so we always have unique nodes
  for (i = 0; i < pages.length; i += 1) {
    for (j = i + 1; j < pages.length; j += 1) {
      if (pages[i] === pages[j]) {
        pages[j] = pages[i].clone();
      }
    }
  }

  return pages;
};

/**
 * Return the URL to the current article
 * @return {string}
 */
treesaver.ui.ArticleManager.getCurrentUrl = function() {
  return treesaver.ui.ArticleManager.currentArticle.url;
};

/**
 * Get the page number (1-based) of the current page
 * @return {number}
 */
treesaver.ui.ArticleManager.getCurrentPageNumber = function() {
  return (treesaver.ui.ArticleManager.currentPageIndex + 1) || 1;
};

/**
 * Get the number of pages in the current article
 * @return {number}
 */
treesaver.ui.ArticleManager.getCurrentPageCount = function() {
  return treesaver.ui.ArticleManager.currentArticle.pageCount || 1;
};

/**
 * Get the number of pages in the current article
 * @return {number}
 */
treesaver.ui.ArticleManager.getCurrentPageWidth = function() {
  return treesaver.ui.ArticleManager.currentPageWidth;
};

/**
 * Get the current transition direction
 * @return {number}
 */
treesaver.ui.ArticleManager.getCurrentTransitionDirection = function() {
  return treesaver.ui.ArticleManager.currentTransitionDirection;
};

/**
 * Get the figure that corresponds to the given element in the current
 * article
 *
 * @param {!Element} el
 * @return {?treesaver.layout.Figure}
 */
treesaver.ui.ArticleManager.getFigure = function(el) {
  var figureIndex = parseInt(el.getAttribute('data-figureindex'), 10);

  if (isNaN(figureIndex)) {
    return null;
  }

  // TODO: Refactor this
  return treesaver.ui.ArticleManager.currentArticle.content.figures[figureIndex];
};


/**
 * Get the current TOC.
 * @return {!Array.<Object>} An array of microdata items
 * representing the TOC.
 */
treesaver.ui.ArticleManager.getCurrentTOC = function() {
  return treesaver.ui.ArticleManager.toc || [];
};

/**
 * @private
 * @param {!string} url
 * @param {boolean=} fwd
 * @return {?number}
 */
treesaver.ui.ArticleManager._getArticleIndex = function(url, fwd) {
  var locations = treesaver.ui.ArticleManager.articleMap[url],
      i, index;

  if (!locations || !locations.length) {
    return null;
  }
  else if (locations.length === 1) {
    return locations[0];
  }
  else {
    i = locations.length - 1;
    while (i >= 0) {
      index = locations[i];

      if (index === treesaver.ui.ArticleManager.currentArticleIndex) {
        return index;
      }

      if (index < treesaver.ui.ArticleManager.currentArticleIndex) {
        return fwd && i !== locations.length - 1 ? locations[i + 1]
                                                          : index;
      }

      i -= 1;
    }

    return index;
  }
};

/**
 * Redirects the browser to the URL for the given article
 * @private
 * @param {!treesaver.ui.Article} article
 */
treesaver.ui.ArticleManager._redirectToArticle = function(article) {
  if (treesaver.network.isOnline()) {
    // TODO: Any clean up not in unload?
    document.location = article.url;
  }
  else {
    treesaver.debug.error('Tried to redirect to an article while offline');
  }
};

/**
 * Load the content for an article
 * @private
 * @param {!treesaver.ui.Article} article
 */
treesaver.ui.ArticleManager._loadArticle = function(article) {
  // Don't try to load multiple times (duh)
  if (article.loading) {
    return;
  }

  // Set flag so we don't try to paginate, etc before content loads
  article.loading = true;

  if (!WITHIN_IOS_WRAPPER) {
    var cached_text =
      /** @type {?string} */
      (treesaver.storage.get(treesaver.ui.ArticleManager.CACHE_STORAGE_PREFIX + article.url));

    if (cached_text) {
      article.processHTML(cached_text);

      // Only for article manager?
      // TODO: Don't use events for this?
      treesaver.events.fireEvent(document, treesaver.ui.Article.events.LOADED, { article: article });
    }
  }

  treesaver.debug.info('loadArticle: Downloading article: ' + article.url);

  treesaver.network.get(article.url, function(text) {
    article.loading = false;

    if (!text) {
      if (WITHIN_IOS_WRAPPER || !cached_text) {
        treesaver.debug.info('loadArticle: Load failed, no content: ' + article.url);
        // Fire event
        article.loadFailed = true;
        // TODO: Don't use events for this?
        treesaver.events.fireEvent(document, treesaver.ui.Article.events.LOADFAILED,
          { article: article });
        return;
      }
      else {
        // Stick with cached content
        treesaver.debug.log('Using cached content for article: ' + article.url);
      }
    }
    else if (WITHIN_IOS_WRAPPER || cached_text !== text) {
      if (!WITHIN_IOS_WRAPPER) {
        treesaver.debug.log('Fetched content newer than cache for article: ' + article.url);

        // Save the HTML in the cache
        treesaver.storage.set(treesaver.ui.ArticleManager.CACHE_STORAGE_PREFIX + article.url,
            text, true);
      }

      treesaver.debug.log('Processing HTML content for article: ' + article.url);

      article.processHTML(text);

      // Only for article manager?
      // TODO: Don't use events for this?
      treesaver.events.fireEvent(document, treesaver.ui.Article.events.LOADED, { article: article });
    }
    else {
      treesaver.debug.log('Fetched content same as cached');
    }
  });
};

/**
 * Move to the supplied article
 * @private
 * @param {!treesaver.ui.Article} article
 * @param {treesaver.layout.ContentPosition} pos
 * @param {number=} index
 * @param {boolean=} noHistory
 * @return {boolean} True if successful.
 */
treesaver.ui.ArticleManager._setArticle = function(article, pos, index, noHistory) {
  // TODO: Assert not null
  if (!article) {
    return false;
  }

  // Check if it's the same as the current article
  if (treesaver.ui.ArticleManager.currentArticle === article) {
    // Might be an index change, in which case we should still update
    // the index
    if (index === treesaver.ui.ArticleManager.currentArticleIndex) {
      // Same article and index, nothing to do but still counts as a success
      return true;
    }
    else {
      // TODO: What should UI do with an index change?
    }
  }

  // Change the window/tab title
  if (article.title) {
    document.title = article.title;
  }

  treesaver.ui.ArticleManager.currentArticle = article;
  // Setting article changes position and pageIndex
  treesaver.ui.ArticleManager._setPosition(pos);
  treesaver.ui.ArticleManager.currentPageIndex = -1;

  // Load the article, if it hasn't been loaded already
  if (!article.loaded) {
    treesaver.ui.ArticleManager._loadArticle(article);
  }
  else if (article.error) {
    // Article didn't load successfully on previous attempt
    treesaver.ui.ArticleManager._redirectToArticle(article);
    return false;
  }

  // Set the index
  if (index || index === 0) {
    // Set the transition direction (assume not neutral)
    treesaver.ui.ArticleManager.currentTransitionDirection =
      (treesaver.ui.ArticleManager.currentArticleIndex > index) ?
      treesaver.ui.ArticleManager.transitionDirection.BACKWARD :
      treesaver.ui.ArticleManager.transitionDirection.FORWARD;

    treesaver.ui.ArticleManager.currentArticleIndex = index;
  }
  else {
    treesaver.ui.ArticleManager.currentTransitionDirection =
      treesaver.ui.ArticleManager.transitionDirection.NEUTRAL;
    treesaver.ui.ArticleManager.currentArticleIndex =
      treesaver.ui.ArticleManager._getArticleIndex(article.url);
  }

  // Update the browser URL, but only if we are supposed to
  if (!noHistory) {
    treesaver.history.pushState({
      index: index,
      url: article.url,
      position: pos
    }, article.title, article.path);
  }
  else {
    treesaver.history.replaceState({
      index: index,
      url: article.url,
      position: pos
    }, article.title, article.path);
  }

  // Fire events
  treesaver.events.fireEvent(document, treesaver.ui.ArticleManager.events.PAGESCHANGED);
  treesaver.events.fireEvent(document, treesaver.ui.ArticleManager.events.ARTICLECHANGED, {
    article: article,
    'url': article.url,
    'path': article.path
  });

  return true;
};

/**
 * @private
 * @param {treesaver.layout.ContentPosition} position
 */
treesaver.ui.ArticleManager._setPosition = function(position) {
  if (treesaver.ui.ArticleManager.currentPosition === position) {
    // Ignore spurious
    return;
  }

  treesaver.ui.ArticleManager.currentPosition = position;
  // TODO: Automatically query?
  treesaver.ui.ArticleManager.currentPageIndex = -1;
};

/**
 * Generate a loading page
 * @private
 * @return {treesaver.layout.Page}
 */
treesaver.ui.ArticleManager._createLoadingPage = function() {
  // Constuct a mock loading page
  // TODO: Make this size reasonably
  return /** @type {treesaver.layout.Page} */ ({
    activate: treesaver.layout.Page.prototype.activate,
    deactivate: treesaver.layout.Page.prototype.deactivate,
    html: treesaver.ui.ArticleManager.loadingPageHTML,
    size: treesaver.ui.ArticleManager.loadingPageSize
  });
};

/**
 * Generate an error page
 * @private
 * @return {treesaver.layout.Page}
 */
treesaver.ui.ArticleManager._createErrorPage = function() {
  // Constuct a mock loading page
  // TODO: Make this size reasonably
  return /** @type {treesaver.layout.Page} */ ({
    activate: treesaver.layout.Page.prototype.activate,
    deactivate: treesaver.layout.Page.prototype.deactivate,
    html: treesaver.ui.ArticleManager.errorPageHTML,
    size: treesaver.ui.ArticleManager.errorPageSize
  });
};

// Expose functions when hosted within iOS wrapper
if (WITHIN_IOS_WRAPPER) {
  goog.exportSymbol('treesaver.canGoToNextPage', treesaver.ui.ArticleManager.canGoToNextPage);
  goog.exportSymbol('treesaver.canGoToPreviousPage', treesaver.ui.ArticleManager.canGoToPreviousPage);
  goog.exportSymbol('treesaver.canGoToNextArticle', treesaver.ui.ArticleManager.canGoToNextArticle);
  goog.exportSymbol('treesaver.canGoToPreviousArticle', treesaver.ui.ArticleManager.canGoToPreviousArticle);
  goog.exportSymbol('treesaver.getCurrentUrl', treesaver.ui.ArticleManager.getCurrentUrl);
  goog.exportSymbol('treesaver.getCurrentPageNumber', treesaver.ui.ArticleManager.getCurrentPageNumber);
  goog.exportSymbol('treesaver.getCurrentPageCount', treesaver.ui.ArticleManager.getCurrentPageCount);
  goog.exportSymbol('treesaver.goToArticleByURL', treesaver.ui.ArticleManager.goToArticleByURL);
}

// Input 31
/**
 * @fileoverview The scrollable class.
 */

goog.provide('treesaver.ui.Scrollable');

/**
 * Scrollable
 *
 * @param {!Element} node
 * @constructor
 */
treesaver.ui.Scrollable = function(node) {
  this.node = node;
  this.contentContainer = /** @type {Element} */ (node.firstChild);
};

/**
 * DOM reference to the content container
 *
 * @type {Element}
 */
treesaver.ui.Scrollable.prototype.contentContainer;

/**
 * DOM reference to the scroll container
 *
 * @type {Element}
 */
treesaver.ui.Scrollable.prototype.node;

/**
 * Size of viewable area within scroller
 *
 * @type {treesaver.dimensions.Size}
 */
treesaver.ui.Scrollable.prototype.viewportSize;

/**
 * Size of content within the scroller
 *
 * @type {treesaver.dimensions.Size}
 */
treesaver.ui.Scrollable.prototype.contentSize;

/**
 * Position of scroller
 *
 * @type {number}
 */
treesaver.ui.Scrollable.prototype.scrollPosX;

/**
 * Position of scroller
 *
 * @type {number}
 */
treesaver.ui.Scrollable.prototype.scrollPosY;

/**
 * Refresh the viewport and content sizes based on current DOM measurements
 */
treesaver.ui.Scrollable.prototype.refreshDimensions = function() {
  this.viewportSize = treesaver.dimensions.getSize(this.node);
  this.contentSize = treesaver.dimensions.getSize(this.contentContainer);
  this.scrollPosX = this.scrollPosX || 0;
  this.scrollPosY = this.scrollPosY || 0;
  this.setOffset(0, 0, true);
};

/**
 * Is the given node within the scroller?
 *
 * @param {!Element} node
 * @return {boolean}
 */
treesaver.ui.Scrollable.prototype.contains = function(node) {
  return this.contentContainer.contains(node);
};

/**
 * Crop the offset to be within scroll bounds
 *
 * @param {number} x
 * @param {number} y
 * @return {{ x:number, y:number }}
 */
treesaver.ui.Scrollable.prototype.cropOffset = function(x, y) {
  return {
    x: Math.max(0, Math.min(this.contentSize.w - this.viewportSize.w, x)),
    y: Math.max(0, Math.min(this.contentSize.h - this.viewportSize.h, y))
  };
};

/**
 * Set the scroll offset
 *
 * @param {number} x
 * @param {number} y
 * @param {boolean=} set
 */
treesaver.ui.Scrollable.prototype.setOffset = function(x, y, set) {
  var cropped = this.cropOffset(this.scrollPosX + x, this.scrollPosY + y);

  if (set) {
    this.scrollPosY = cropped.y;
    this.scrollPosX = cropped.x;
  }

  treesaver.dimensions.setOffset(/** @type {!Element} */ (this.contentContainer), -cropped.x, -cropped.y);
};

/**
 * Initialize the DOM for a scrollable element, creating the necessary
 * structures for later scrolling
 *
 * @param {!Element} node
 */
treesaver.ui.Scrollable.initDom = function(node) {
  // Create a container that will hold the children of the node
  var div = document.createElement('div');
  treesaver.dom.addClass(div, 'scroll-container');

  if (WITHIN_IOS_WRAPPER || treesaver.capabilities.SUPPORTS_TOUCH) {
    // Need dummy handler in order to get bubbled events
    node.setAttribute('onclick', 'void(0)');
  }

  // Move all elements into container
  while (node.firstChild) {
    div.appendChild(node.firstChild);
  }
  // Move container into prime node
  node.appendChild(div);
};

// Input 32
/**
 * @fileoverview The chrome class.
 */

goog.provide('treesaver.ui.Chrome');

goog.require('treesaver.capabilities');
goog.require('treesaver.constants');
goog.require('treesaver.debug');
goog.require('treesaver.dimensions');
goog.require('treesaver.dom');
goog.require('treesaver.network');
goog.require('treesaver.scheduler');
goog.require('treesaver.template');
goog.require('treesaver.ui.ArticleManager');
goog.require('treesaver.ui.Scrollable');

/**
 * Chrome
 * @param {!Element} node HTML node.
 * @constructor
 */
treesaver.ui.Chrome = function(node) {
  // DEBUG-only validation checks
  if (goog.DEBUG) {
    if (!treesaver.dom.getElementsByClassName('viewer', node).length) {
      treesaver.debug.error('Chrome does not have a viewer');
    }

    if (node.parentNode.childNodes.length !== 1) {
      treesaver.debug.error('Chrome is not only child in container');
    }
  }

  /**
   * List of required capabilities for this Chrome
   * TODO: Only store mutable capabilities
   *
   * @type {?Array.<string>}
   */
  this.requirements = treesaver.dom.hasAttr(node, 'data-requires') ?
    node.getAttribute('data-requires').split(' ') : null;

  // Create DOM infrastructure for scrolling elements
  treesaver.dom.getElementsByClassName('scroll', node).
    forEach(treesaver.ui.Scrollable.initDom);

  /**
   * @type {Array.<Element>}
   */
  this.scrollers = [];

  /**
   * @type {?Element}
   */
  this.node = null;

  /**
   * @type {string}
   */
  this.html = node.parentNode.innerHTML;

  /**
   * The measurements of the chrome
   * @type {!treesaver.dimensions.Metrics}
   */
  this.size = new treesaver.dimensions.Metrics(node);

  // Clean up metrics object
  delete this.size.w;
  delete this.size.h;

  /**
   * The area available to pages (i.e. the size of the viewer)
   * @type {?treesaver.dimensions.Size}
   */
  this.pageArea = null;

  /**
   * @type {boolean}
   */
  this.active = false;

  /**
   * Cached reference to viewer DOM
   * @type {?Element}
   */
  this.viewer = null;

  /**
   * Cached reference to page number DOM
   * @type {?Array.<Element>}
   */
  this.pageNum = null;

  /**
   * Cached reference to page count DOM
   * @type {?Array.<Element>}
   */
  this.pageCount = null;

  /**
   * Cached reference to page width DOM
   * @type {?Array.<Element>}
   */
  this.pageWidth = null;

  /**
   * Cached reference to the TOC DOM
   * @type {?Element}
   */
  this.toc = null;

  /**
   * Cached reference to the TOC Template DOM
   * @type {?Element}
   */
  this.tocTemplate = null;

  /**
   * @type {?Array.<treesaver.layout.Page>}
   */
  this.pages = null;

  /**
   * Whether the UI is current in active state
   * @type {boolean}
   */
  this.uiActive = false;

  /**
   * Cached references to the menu TOC
   * @type {?Element}
   */
  this.menu = null;

  /**
   * @type {boolean}
   */
  this.lightBoxActive = false;

  /**
   * @type {?treesaver.ui.LightBox}
   */
  this.lightBox = null;

  /*
   * Cached reference to article url DOM
   * @type {?Array.<Element>}
   */
  this.currentURL = null;

  /**
   * @type {?Element}
   */
  this.sidebar = null;

  /**
   * Cached reference to the next page DOM
   * @type {?Array.<Element>}
   */
  this.nextPage = null;

  /**
   * Cached reference to the next article DOM
   * @type {?Array.<Element>}
   */
  this.nextArticle = null;

  /**
   * Cached reference to the previous page DOM
   * @type {?Array.<Element>}
   */
  this.prevPage = null;

  /**
   * Cached reference to the previous article DOM
   * @type {?Array.<Element>}
   */
  this.prevArticle = null;
};

/**
 * @return {!Element} The activated node.
 */
treesaver.ui.Chrome.prototype.activate = function() {
  var toc = [],
      tocTemplates = [],
      menus = [],
      sidebars = [];

  if (!this.active) {
    this.active = true;

    this.node = treesaver.dom.createElementFromHTML(this.html);
    // Store references to the portions of the UI we must update
    this.viewer = treesaver.dom.getElementsByClassName('viewer', this.node)[0];
    this.pageNum = treesaver.template.getElementsByBindName('pagenumber', null, this.node);
    this.pageCount = treesaver.template.getElementsByBindName('pagecount', null, this.node);
    this.pageWidth = treesaver.dom.getElementsByClassName('pagewidth', this.node);
    this.currentURL = treesaver.template.getElementsByBindName('current-url', null, this.node);
    this.nextPage = treesaver.dom.getElementsByClassName('next', this.node);
    this.nextArticle = treesaver.dom.getElementsByClassName('nextArticle', this.node);
    this.prevPage = treesaver.dom.getElementsByClassName('prev', this.node);
    this.prevArticle = treesaver.dom.getElementsByClassName('prevArticle', this.node);

    this.scrollers = treesaver.dom.getElementsByClassName('scroll', this.node).
      map(function(el) {
        return new treesaver.ui.Scrollable(el);
      });

    menus = treesaver.dom.getElementsByClassName('menu', this.node);
    if (menus.length > 0) {
      this.menu = menus[0];
    }

    toc = treesaver.template.getElementsByBindName('toc', null, this.node);

    // TODO: We might want to do something smarter than just selecting the first
    // TOC template.
    if (toc.length >= 1) {
      this.toc = /** @type {!Element} */ (toc[0]);
      this.tocTemplate = /** @type {!Element} */ (this.toc.cloneNode(true));
    }

    sidebars = treesaver.dom.getElementsByClassName('sidebar', this.node);

    if (sidebars.length > 0) {
      this.sidebar = sidebars[0];
    }

    this.pages = [];

    // Setup event handlers
    treesaver.ui.Chrome.watchedEvents.forEach(function(evt) {
      treesaver.events.addListener(document, evt, this);
    }, this);

    // Always start off active
    this.uiActive = false; // Set to false to force event firing
    this.setUiActive_();
  }

  return /** @type {!Element} */ (this.node);
};

/**
 * Deactivate the chrome
 */
treesaver.ui.Chrome.prototype.deactivate = function() {
  if (!this.active) {
    return;
  }

  this.stopDelayedFunctions();
  this.active = false;

  // Remove event handlers
  treesaver.ui.Chrome.watchedEvents.forEach(function(evt) {
    treesaver.events.removeListener(document, evt, this);
  }, this);

  // Make sure to drop references
  this.node = null;
  this.viewer = null;
  this.pageNum = null;
  this.pageCount = null;
  this.pageWidth = null;
  this.menu = null;
  this.currentURL = null;
  this.toc = null;
  this.tocTemplate = null;
  this.sidebar = null;
  this.nextPage = null;
  this.nextArticle = null;
  this.prevPage = null;
  this.prevArticle = null;

  // Deactivate pages
  this.pages.forEach(function(page) {
    if (page) {
      page.deactivate();
    }
  });
  this.pages = null;
  this.pageArea = null;
};

/**
 * Stop any delayed functions
 * @private
 */
treesaver.ui.Chrome.prototype.stopDelayedFunctions = function() {
  treesaver.scheduler.clear('selectPages');
  treesaver.scheduler.clear('animatePages');
};

/**
 * Events fired by Chrome objects
 *
 * @const
 * @type {!Object.<string, string>}
 */
treesaver.ui.Chrome.events = {
  ACTIVE: 'treesaver.active',
  IDLE: 'treesaver.idle'
};

/**
 * @type {Array.<string>}
 */
treesaver.ui.Chrome.watchedEvents = [
  treesaver.ui.ArticleManager.events.TOCUPDATED,
  treesaver.ui.ArticleManager.events.PAGESCHANGED,
  treesaver.ui.ArticleManager.events.ARTICLECHANGED,
  'keydown',
  'click',
  'mousewheel',
  'DOMMouseScroll'
];

// Add touch events only if the browser supports touch
if (treesaver.capabilities.SUPPORTS_TOUCH) {
  // Note that we hook up all the event handlers immediately,
  // instead of waiting to do so during touchstart. This is
  // because removing the touch handlers causes Android 2.1
  // to stop sending all touch events
  treesaver.ui.Chrome.watchedEvents.push('touchstart', 'touchmove', 'touchend', 'touchcancel');
}
else {
  // Used for activity detection
  treesaver.ui.Chrome.watchedEvents.push('mouseover');
  // TODO: Move mousewheel in here as well?
}

/**
 * Event dispatcher for all events
 * @param {Event} e
 */
treesaver.ui.Chrome.prototype['handleEvent'] = function(e) {
  switch (e.type) {
  // Both these events mean that the pages we are displaying
  // (or trying to display) may have changed. Make sure to
  // fetch them again
  // Article changed and TOC changed will affect nav indicators
  case treesaver.ui.ArticleManager.events.PAGESCHANGED:
    return this.selectPagesDelayed();

  case treesaver.ui.ArticleManager.events.TOCUPDATED:
    this.updateTOCDelayed();
    return this.selectPagesDelayed();

  case treesaver.ui.ArticleManager.events.ARTICLECHANGED:
    this.updateTOCActive(e);
    return this.updatePageURL(e);

  case 'mouseover':
    return this.mouseOver(e);

  case 'touchstart':
    return this.touchStart(e);

  case 'touchmove':
    return this.touchMove(e);

  case 'touchend':
    return this.touchEnd(e);

  case 'touchcancel':
    return this.touchCancel(e);

  case 'keydown':
    return this.keyDown(e);

  case 'click':
    return this.click(e);

  case 'mousewheel':
  case 'DOMMouseScroll':
    return this.mouseWheel(e);
  }
};

/**
 * Whether one of the control/shift/alt/etc keys were pressed at the time
 * of the event
 *
 * @private
 * @param {!Event} e
 * @return {boolean} True if at least one of those keys was pressed.
 */
treesaver.ui.Chrome.specialKeyPressed_ = function(e) {
  return e.ctrlKey || e.shiftKey || e.altKey || e.metaKey;
};

/**
 * Handle keyboard events
 * @param {!Event} e
 */
treesaver.ui.Chrome.prototype.keyDown = function(e) {
  // Lightbox active? Hide it
  if (this.lightBoxActive) {
    this.hideLightBox();

    // Stop default actions and return early
    e.preventDefault();
    return;
  }

  // Don't override keyboard commands
  if (!treesaver.ui.Chrome.specialKeyPressed_(e)) {
    switch (e.keyCode) {
    case 34: // PageUp
    case 39: // Right && down
    case 40:
    case 74: // j
    case 32: // Space
      treesaver.ui.ArticleManager.nextPage();
      break;

    case 33: // PageDown
    case 37: // Left & up
    case 38:
    case 75: // k
      treesaver.ui.ArticleManager.previousPage();
      break;

    case 72: // h
      treesaver.ui.ArticleManager.previousArticle();
      break;

    case 76: // l
      treesaver.ui.ArticleManager.nextArticle();
      break;

    default: // Let the event through if not handled
      return;
    }

    // Handled key always causes UI idle
    this.setUiIdle_();

    // Key handled, don't want any default actions
    e.preventDefault();
  }
};

/**
 * Handle click event
 * @param {!Event} e
 */
treesaver.ui.Chrome.prototype.click = function(e) {
  // Lightbox active? Hide it
  if (this.lightBoxActive) {
    this.hideLightBox();
    e.stopPropagation();
    e.preventDefault();
    return;
  }

  // Ignore if done with a modifier key (could be opening in new tab, etc)
  if (treesaver.ui.Chrome.specialKeyPressed_(e)) {
    return true;
  }

  // Ignore if it's not a left-click
  if ('which' in e && e.which !== 1 || e.button) {
    treesaver.debug.info('Click ignored due to non-left click');

    return;
  }

  var el = treesaver.ui.Chrome.findTarget_(e.target),
      url,
      withinCurrentPage = false,
      handled = false,
      withinSidebar = false,
      withinMenu = false;

  if (this.isMenuActive()) {
    withinMenu = this.menu.contains(el);
    this.menuInactive();
  }

  if (this.isSidebarActive()) {
    withinSidebar = this.sidebar.contains(el);

    if (!withinSidebar) {
      this.sidebarInactive();
    }
  }

  // Compiler cast
  el = /** @type {!Element} */ (el);

  // Check if the target is within one of the visible pages
  // TODO: Once we have variable numbers of pages, this code will
  // need to change
  if (this.pages[0] && this.pages[0].node.contains(el)) {
    treesaver.ui.ArticleManager.previousPage();

    handled = true;
  }
  else if (this.pages[2] && this.pages[2].node.contains(el)) {
    treesaver.ui.ArticleManager.nextPage();

    handled = true;
  }
  else {
    withinCurrentPage = this.pages[1] && this.pages[1].node.contains(el);

    // Go up the tree and see if there's anything we want to process
    while (!handled && el && el !== treesaver.boot.tsContainer) {
      if (!withinCurrentPage) {
        if (treesaver.dom.hasClass(el, 'prev')) {
          treesaver.ui.ArticleManager.previousPage();

          handled = true;
        }
        else if (treesaver.dom.hasClass(el, 'next')) {
          treesaver.ui.ArticleManager.nextPage();

          handled = true;
        }
        else if (treesaver.dom.hasClass(el, 'prevArticle')) {
          treesaver.ui.ArticleManager.previousArticle();

          handled = true;
        }
        else if (treesaver.dom.hasClass(el, 'nextArticle')) {
          treesaver.ui.ArticleManager.nextArticle();

          handled = true;
        }
        else if (treesaver.dom.hasClass(el, 'menu')) {
          if (!withinMenu) {
            this.menuActive();
          }
          handled = true;
        }
        else if (treesaver.dom.hasClass(el, 'sidebar') ||
                treesaver.dom.hasClass(el, 'open-sidebar')) {
          if (!this.isSidebarActive()) {
            this.sidebarActive();
          }
          handled = true;
        }
        else if (treesaver.dom.hasClass(el, 'close-sidebar')) {
          if (this.isSidebarActive()) {
            this.sidebarInactive();
            handled = true;
          }
        }
      }
      else if (treesaver.dom.hasClass(el, 'zoomable')) {
        // Counts as handling the event only if showing is successful
        handled = this.showLightBox(el);
      }

      // Check links last since they may be used as UI commands as well
      // Links can occur in-page or in the chrome
      // IE aliases the src property to read-only href on images
      if (!handled && el.href && el.nodeName.toLowerCase() !== 'img') {
        // Lightbox-flagged elements are skipped as processing goes up the chain
        // if a zoomable is found on the way up the tree, it will be handled. If
        // not, the link is navigated as-is
        if (el.getAttribute('target') === 'lightbox') {
          // Skip this element and process the parent zoomable
          el = /** @type {!Element} */ (el.parentNode);
          continue;
        }

        url = treesaver.network.absoluteURL(el.href);
        if (!treesaver.ui.ArticleManager.goToArticleByURL(url)) {
          // The URL is not an article, let the navigation happen normally
          return;
        }

        handled = true;
      }

      el = /** @type {!Element} */ (el.parentNode);
    }
  }

  if (handled) {
    e.stopPropagation();
    e.preventDefault();
  }
};

/**
 * The last time a mousewheel event was received
 *
 * @private
 * @type {number}
 */
treesaver.ui.Chrome.prototype.lastMouseWheel_;

/**
 * Handle the mousewheel event
 * @param {!Event} e
 */
treesaver.ui.Chrome.prototype.mouseWheel = function(e) {
  if (treesaver.ui.Chrome.specialKeyPressed_(e)) {
    // Ignore if special key is down (user could be zooming)
    return true;
  }

  // Lightbox active? Hide it
  if (this.lightBoxActive) {
    this.hideLightBox();
    e.preventDefault();
    return;
  }

  var now = goog.now();

  if (this.lastMouseWheel_ &&
      (now - this.lastMouseWheel_ < MOUSE_WHEEL_INTERVAL)) {
    // Ignore if too frequent (magic mouse)
    return;
  }

  this.lastMouseWheel_ = now;

  // Firefox handles this differently than others
  // http://adomas.org/javascript-mouse-wheel/
  var delta = e.wheelDelta ? e.wheelDelta : e.detail ? -e.detail : 0,
      withinViewer = this.viewer.contains(treesaver.ui.Chrome.findTarget_(e.target));

  if (!delta || !withinViewer) {
    return;
  }

  // Handle the event
  e.preventDefault();
  e.stopPropagation();

  if (delta > 0) {
    treesaver.ui.ArticleManager.previousPage();
  }
  else {
    treesaver.ui.ArticleManager.nextPage();
  }

  // Mousewheel always deactivates UI
  this.setUiIdle_();
};

/**
 * Sanitize the event target, which can be a textNode in Safari
 *
 * @private
 * @param {?EventTarget} node
 * @return {!Element}
 */
treesaver.ui.Chrome.findTarget_ = function(node) {
  if (!node) {
    node = treesaver.boot.tsContainer;
  }
  else if (node.nodeType !== 1 && node.parentNode) {
    // Safari Bug that gives you textNode on events
    node = node.parentNode || treesaver.boot.tsContainer;
  }

  // Cast for compiler
  return /** @type {!Element} */ (node);
};

/**
 * @private
 * @type {Object}
 */
treesaver.ui.Chrome.prototype.touchData_;

/**
 * Handle the touchstart event
 * @param {!Event} e
 */
treesaver.ui.Chrome.prototype.touchStart = function(e) {
  if (!treesaver.boot.tsContainer.contains(treesaver.ui.Chrome.findTarget_(e.target))) {
    return;
  }

  // Do all the handling ourselves
  e.stopPropagation();
  e.preventDefault();

  // Lightbox active? Hide it
  if (this.lightBoxActive) {
    this.hideLightBox();
    return;
  }

  this.touchData_ = {
    startTime: goog.now(),
    deltaTime: 0,
    startX: e.touches[0].pageX,
    startY: e.touches[0].pageY,
    deltaX: 0,
    deltaY: 0,
    touchCount: e.touches.length
  };

  if (this.touchData_.touchCount === 2) {
    this.touchData_.startX2 = e.touches[1].pageX;
  }

  this.scrollers.forEach(function(s) {
    if (s.contains(treesaver.ui.Chrome.findTarget_(e.target))) {
      this.touchData_.scroller = s;
    }
  }, this);

  // Pause other work for better swipe performance
  treesaver.scheduler.pause([], 2 * SWIPE_TIME_LIMIT);
};

/**
 * Handle the touchmove event
 * @param {!Event} e
 */
treesaver.ui.Chrome.prototype.touchMove = function(e) {
  if (!this.touchData_) {
    // No touch info, nothing to do
    return;
  }

  // Do all the handling ourselves
  e.stopPropagation();
  e.preventDefault();

  this.touchData_.lastMove = goog.now();
  this.touchData_.lastX = e.touches[0].pageX;
  this.touchData_.lastY = e.touches[0].pageY;
  this.touchData_.deltaTime = this.touchData_.lastMove - this.touchData_.startTime;
  this.touchData_.deltaX = this.touchData_.lastX - this.touchData_.startX;
  this.touchData_.deltaY = this.touchData_.lastY - this.touchData_.startY;
  this.touchData_.touchCount = Math.min(e.touches.length, this.touchData_.touchCount);
  this.touchData_.swipe =
    // One-finger only
    this.touchData_.touchCount === 1 &&
    // Finger has to move far enough
    Math.abs(this.touchData_.deltaX) >= SWIPE_THRESHOLD;

  if (this.touchData_.scroller) {
    this.touchData_.scroller.setOffset(this.touchData_.deltaX, -this.touchData_.deltaY);
  }
  else if (this.touchData_.swipe) {
    this.pageOffset = this.touchData_.deltaX;
    this._updatePagePositions(true);
  }
  else if (this.pageOffset) {
    this.animationStart = goog.now();
    this._updatePagePositions(treesaver.capabilities.SUPPORTS_CSSTRANSITIONS);
  }
  else if (this.touchData_.touchCount === 2) {
    // Track second finger changes
    this.touchData_.deltaX2 = e.touches[1].pageX - this.touchData_.startX2;
  }
};

/**
 * Handle the touchend event
 * @param {!Event} e
 */
treesaver.ui.Chrome.prototype.touchEnd = function(e) {
  // Hold onto a reference before clearing
  var touchData = this.touchData_,
      // Flag to track whether we need to reset positons, etc
      actionTaken = false;

  // Clear out touch data
  this.touchCancel(e);

  if (!touchData) {
    // No touch info, nothing to do
    return;
  }

  // Do all the handling ourselves
  e.stopPropagation();
  e.preventDefault();

  if (touchData.scroller && touchData.lastMove) {
    touchData.scroller.setOffset(touchData.deltaX, -touchData.deltaY, true);
  }
  else if (touchData.touchCount === 1) {
    // No move means we create a click
    if (!touchData.lastMove) {
      // Lightbox is honorary viewer
      var target = treesaver.ui.Chrome.findTarget_(e.target),
          withinViewer = this.lightBoxActive || this.viewer.contains(target);

      // TODO: Currently this code is OK since the IE browsers don't support
      // touch. However, perhaps Windows Phone 7 will and needs a fix with
      // IE7? Need to integrate this into treesaver.events
      var evt = document.createEvent('MouseEvents');
      evt.initMouseEvent('click', true, true, e.view, 1,
          e.changedTouches[0].screenX, e.changedTouches[0].screenY,
          e.changedTouches[0].clientX, e.changedTouches[0].clientY,
          e.ctrlKey, e.altKey, e.shiftKey, e.metaKey, 0, null);

      if (target.dispatchEvent(evt) && withinViewer) {
        // Event went unhandled, toggle active state
        this.toggleUiActive_();
      }
      else if (withinViewer) {
        // Handled event within viewer = idle
        this.setUiIdle_();
      }
      else {
        // Otherwise, active
        this.setUiActive_();
      }

      // Counts as handling
      actionTaken = true;
    }
    // Check for a swipe
    // Also allow for users to swipe down in order to go to next page. This is a
    // common mistake made when users first interact with a paged UI
    else if (touchData.swipe || touchData.deltaY <= -SWIPE_THRESHOLD) {
      if (touchData.swipe && touchData.deltaX > 0) {
        actionTaken = treesaver.ui.ArticleManager.previousPage();
      }
      else {
        actionTaken = treesaver.ui.ArticleManager.nextPage();
      }

      if (!actionTaken) {
        // Failed page turn = Show UI
        this.setUiActive_();
      }
      else {
        // Successful page turn = Hide UI
        this.setUiIdle_();
      }
    }
    else {
      // No swipe and no tap, do nothing
    }
  }
  else if (touchData.touchCount === 2) {
    // Two finger swipe in the same direction is next/previous article
    if (Math.abs(touchData.deltaX2) >= SWIPE_THRESHOLD) {
      if (touchData.deltaX < 0 && touchData.deltaX2 < 0) {
        actionTaken = treesaver.ui.ArticleManager.nextArticle();
      }
      else if (touchData.deltaX > 0 && touchData.deltaX2 > 0) {
        actionTaken = treesaver.ui.ArticleManager.previousArticle();
      }

      if (!actionTaken) {
        // Failed article change = Show UI
        this.setUiActive_();
      }
      else {
        // Success = Hide UI
        this.setUiIdle_();
      }
    }
  }

  // Reset page position, if applicable
  if (!actionTaken) {
    this.animationStart = goog.now();
    this.pageOffset = 0;
    this._updatePagePositions(treesaver.capabilities.SUPPORTS_CSSTRANSITIONS);
  }
};

/**
 * Handle the touchcancel event
 * @param {!Event} e
 */
treesaver.ui.Chrome.prototype.touchCancel = function(e) {
  // Let the tasks begin again
  treesaver.scheduler.resume();

  this.touchData_ = null;
};

/**
 * Desktop-only handler to make sure we don't hide UI when the user is trying
 * to use it
 * @param {!Event} e
 */
treesaver.ui.Chrome.prototype.mouseOver = function(e) {
  // Don't do anything on touch devices
  if (!e.touches) {
    // Need to make sure UI is visible if a user is trying to click on it
    this.setUiActive_();
  }
};

/**
 * Show hidden UI controls
 * @private
 */
treesaver.ui.Chrome.prototype.setUiActive_ = function() {
  // Don't fire events needlessly
  if (!this.uiActive) {
    this.uiActive = true;
    treesaver.dom.addClass(/** @type {!Element} */ (this.node), 'active');

    treesaver.events.fireEvent(document, treesaver.ui.Chrome.events.ACTIVE);
  }

  // Fire the idle event on a timer using debouncing, which delays
  // the function when receiving multiple calls
  treesaver.scheduler.debounce(
    this.setUiIdle_,
    UI_IDLE_INTERVAL,
    null,
    false,
    'idletimer',
    this
  );
};

/**
 * Hide UI controls
 * @private
 */
treesaver.ui.Chrome.prototype.setUiIdle_ = function() {
  // Don't fire events unless needed
  if (this.uiActive) {
    this.uiActive = false;
    treesaver.dom.removeClass(/** @type {!Element} */ (this.node), 'active');

    treesaver.events.fireEvent(document, treesaver.ui.Chrome.events.IDLE);
  }

  // Clear anything that might debounce
  treesaver.scheduler.clear('idletimer');
};

/**
 * Toggle Active state
 * @private
 */
treesaver.ui.Chrome.prototype.toggleUiActive_ = function() {
  if (!this.uiActive) {
    this.setUiActive_();
  }
  else {
    this.setUiIdle_();
  }
};

/**
 * Show menu
 */
treesaver.ui.Chrome.prototype.menuActive = function() {
  treesaver.dom.addClass(/** @type {!Element} */ (this.node), 'menu-active');
};

/**
 * Hide menu
 */
treesaver.ui.Chrome.prototype.menuInactive = function() {
  treesaver.dom.removeClass(/** @type {!Element} */ (this.node), 'menu-active');
};

/**
 * Returns the current state of the menu.
 */
treesaver.ui.Chrome.prototype.isMenuActive = function() {
  return treesaver.dom.hasClass(/** @type {!Element} */ (this.node), 'menu-active');
};

/**
 * Show sidebar
 */
treesaver.ui.Chrome.prototype.sidebarActive = function() {
  treesaver.dom.addClass(/** @type {!Element} */ (this.node), 'sidebar-active');
};

/**
 * Hide sidebar
 */
treesaver.ui.Chrome.prototype.sidebarInactive = function() {
  treesaver.dom.removeClass(/** @type {!Element} */ (this.node), 'sidebar-active');
};

/**
 * Determines whether or not the sidebar is active.
 *
 * @return {boolean} true if the sidebar is active, false otherwise.
 */
treesaver.ui.Chrome.prototype.isSidebarActive = function() {
  return treesaver.dom.hasClass(/** @type {!Element} */ (this.node), 'sidebar-active');
};


/**
 * Show lightbox
 *
 * @private
 * @param {!Element} el
 * @return {boolean} True if content can be shown.
 */
treesaver.ui.Chrome.prototype.showLightBox = function(el) {
  var figure = treesaver.ui.ArticleManager.getFigure(el);

  if (!figure) {
    return false;
  }

  // Hide toolbars, etc when showing lightbox
  this.setUiIdle_();

  if (!this.lightBoxActive) {
    this.lightBox = treesaver.ui.StateManager.getLightBox();
    if (!this.lightBox) {
      // No lightbox, nothing to show
      return false;
    }

    this.lightBoxActive = true;
    this.lightBox.activate();
    // Lightbox is a sibling of the chrome root
    this.node.parentNode.appendChild(this.lightBox.node);
  }

  // Closure compiler cast
  this.lightBox.node = /** @type {!Element} */ (this.lightBox.node);

  // Cover entire chrome with the lightbox
  treesaver.dimensions.setCssPx(this.lightBox.node, 'width', treesaver.dimensions.getOffsetWidth(this.node));
  treesaver.dimensions.setCssPx(this.lightBox.node, 'height', treesaver.dimensions.getOffsetHeight(this.node));

  if (!this.lightBox.showFigure(figure)) {
    // Showing failed
    this.hideLightBox();
    return false;
  }

  // Successfully showed the figure
  return true;
};

/**
 * Dismiss lightbox
 *
 * @private
 */
treesaver.ui.Chrome.prototype.hideLightBox = function() {
  if (this.lightBoxActive) {
    this.lightBoxActive = false;
    this.node.parentNode.removeChild(this.lightBox.node);
    this.lightBox.deactivate();
    this.lightBox = null;
  }
};

/**
 * @return {boolean} True if the Chrome meets current browser capabilities.
 */
treesaver.ui.Chrome.prototype.meetsRequirements = function() {
  if (!this.requirements) {
    return true;
  }

  return treesaver.capabilities.check(this.requirements, true);
};

/**
 * @param {treesaver.dimensions.Size} availSize
 * @return {boolean} True if fits.
 */
treesaver.ui.Chrome.prototype.fits = function(availSize) {
  return treesaver.dimensions.inSizeRange(this.size, availSize);
};

/**
 * @private
 * @return {treesaver.dimensions.Size}
 */
treesaver.ui.Chrome.prototype.calculatePageArea = function() {
  if (goog.DEBUG) {
    if (!this.viewer) {
      treesaver.debug.error('No viewer in chrome');
    }
  }

  this.pageArea = {
    w: treesaver.dimensions.getOffsetWidth(this.viewer),
    h: treesaver.dimensions.getOffsetHeight(this.viewer)
  };
};

/**
 * Sets the size of the chrome
 * @param {treesaver.dimensions.Size} availSize
 */
treesaver.ui.Chrome.prototype.setSize = function(availSize) {
  treesaver.dimensions.setCssPx(/** @type {!Element} */ (this.node), 'width', availSize.w);
  treesaver.dimensions.setCssPx(/** @type {!Element} */ (this.node), 'height', availSize.h);

  // Clear out previous value
  this.pageArea = null;

  // Update to our new page area
  this.calculatePageArea();

  // Refresh the size of scrollable areas
  this.scrollers.forEach(function(s) { s.refreshDimensions(); });

  if (treesaver.ui.ArticleManager.currentArticle) {
    // Re-query for pages later
    this.selectPagesDelayed();
    this.updateTOCDelayed();
  }
};

/**
 * Update any URL bindings to the active article in the Chrome.
 * @private
 * @param {!Event} e The article changed event.
 */
treesaver.ui.Chrome.prototype.updatePageURL = function(e) {
  this.currentURL.forEach(function(el) {
    treesaver.template.expand({
        'current-url': e.url
      }, el);
  });
};

/**
 * Update the TOC's 'current' class.
 *
 * @private
 * @param {!{ url: string }} e The TOC update event.
 */
treesaver.ui.Chrome.prototype.updateTOCActive = function(e) {
  if (this.toc) {
    var tocEntries = treesaver.ui.ArticleManager.getCurrentTOC(),
        tocElements = treesaver.template.getElementsByBindName('article', null, this.toc),
        i = 0;

    tocEntries.forEach(function(entry, index) {
      if (!entry.flags['hidden'] && tocElements[i]) {
        if (index === treesaver.ui.ArticleManager.currentArticleIndex) {
          treesaver.dom.addClass(tocElements[i], 'current');
        } else {
          treesaver.dom.removeClass(tocElements[i], 'current');
        }
        i += 1;
      }
    });

    // Refresh the size of scrollable areas (often used with TOC)
    // TODO: Figure out better separate here?
    this.scrollers.forEach(function(s) { s.refreshDimensions(); });
  }
};

/**
 * Update the text of elements bound to the current page index
 * @private
 * @param {number} index
 */
treesaver.ui.Chrome.prototype.updatePageIndex = function(index) {
  this.pageNum.forEach(function(el) {
    treesaver.template.expand({
        'pagenumber': index
      }, el);
  });
};

/**
 * Update the text of elements bound to the page count
 * @private
 * @param {number} count
 */
treesaver.ui.Chrome.prototype.updatePageCount = function(count) {
  this.pageCount.forEach(function(el) {
    treesaver.template.expand({
      'pagecount': count
    }, el);
  });
};

/**
 * Update the width of elements bound to the page width
 * @private
 */
treesaver.ui.Chrome.prototype.updatePageWidth = function(width) {
  if (width) {
    this.pageWidth.forEach(function(el) {
      treesaver.dimensions.setCssPx(el, 'width', width);
    }, this);
  }
};

/**
 * Set the element state to enabled or disabled. If the element
 * is a button its disabled attribute will be set to true. Otherwise
 * the element will receive a class="disabled".
 *
 * @private
 * @param {!Element} el The element to set the state for.
 * @param {!boolean} enable True to enable the element, false to disable it.
 */
treesaver.ui.Chrome.prototype.setElementState = function(el, enable) {
  if (el.nodeName === 'BUTTON') {
    el.disabled = !enable;
  }
  else {
    if (enable) {
      treesaver.dom.removeClass(el, 'disabled');
    }
    else {
      treesaver.dom.addClass(el, 'disabled');
    }
  }
};

/**
 * Update the state of the next page elements.
 * @private
 */
treesaver.ui.Chrome.prototype.updateNextPageState = function() {
  if (this.nextPage) {
    var canGoToNextPage = treesaver.ui.ArticleManager.canGoToNextPage();

    this.nextPage.forEach(function(el) {
      this.setElementState(el, canGoToNextPage);
    }, this);
  }
};

/**
 * Update the state of the next article elements.
 * @private
 */
treesaver.ui.Chrome.prototype.updateNextArticleState = function() {
  if (this.nextArticle) {  
    var canGoToNextArticle = treesaver.ui.ArticleManager.canGoToNextArticle();

    this.nextArticle.forEach(function(el) {
      this.setElementState(el, canGoToNextArticle);
    }, this);
  }
};

/**
 * Update the state of the previous page elements.
 * @private
 */
treesaver.ui.Chrome.prototype.updatePreviousPageState = function() {
  if (this.prevPage) {
    var canGoToPreviousPage = treesaver.ui.ArticleManager.canGoToPreviousPage();

    this.prevPage.forEach(function(el) {
      this.setElementState(el, canGoToPreviousPage);
    }, this);
  }
};

/**
 * Update the state of the previous article elements.
 * @private
 */
treesaver.ui.Chrome.prototype.updatePreviousArticleState = function() {
  if (this.prevArticle) {
    var canGoToPreviousArticle = treesaver.ui.ArticleManager.canGoToPreviousArticle();

    this.prevArticle.forEach(function(el) {
      this.setElementState(el, canGoToPreviousArticle);
    }, this);
  }
};

/**
 * Run selectPages on a delay
 * @private
 */
treesaver.ui.Chrome.prototype.selectPagesDelayed = function() {
  treesaver.scheduler.queue(this.selectPages, [], 'selectPages', this);
};

/**
 * Run updateTOC on a delay
 * @private
 */
treesaver.ui.Chrome.prototype.updateTOCDelayed = function() {
  treesaver.scheduler.queue(this.updateTOC, [], 'updateTOC', this);
};

/**
 * Manages the page objects needed in order to display content,
 * including DOM insertion
 * @private
 */
treesaver.ui.Chrome.prototype.selectPages = function() {
  this.stopDelayedFunctions();

  // Save the direction
  var direction = treesaver.ui.ArticleManager.getCurrentTransitionDirection();

  // Populate the pages
  this.populatePages(direction);

  // Call layout even if pages didn't change since viewport size
  // can affect page positioning
  this.layoutPages(direction);

  // Update our field display in the chrome (page count/index changes)
  this.updateFields();

  // Update the previous/next buttons depending on the current state
  this.updateNextPageState();
  this.updateNextArticleState();
  this.updatePreviousPageState();
  this.updatePreviousArticleState();
};

/**
 * Manages the TOC.
 * @private
 */
treesaver.ui.Chrome.prototype.updateTOC = function() {
  // Stop any running TOC updates
  treesaver.scheduler.clear('updateTOC');

  if (this.toc) {
    var tocEntries = treesaver.ui.ArticleManager.getCurrentTOC(),
        newToc = /** @type {!Element} */ (this.tocTemplate.cloneNode(true)),
        tocParent = this.toc.parentNode;

    tocEntries = tocEntries.filter(function(entry) {
      return !entry.flags['hidden'];
    });

    // Format the TOC entries to fit our TOC template format.
    tocEntries = tocEntries.map(function(entry) {
      return {
        'article': entry.fields
      };
    });

    // Expand the template using the cloned template.
    treesaver.template.expand({
      'toc': tocEntries
    }, newToc);

    // And finally replace the old TOC with the new one.
    tocParent.replaceChild(newToc, this.toc);
    this.toc = newToc;

    // Update the TOC active item. We do this explicitly here
    // because we receive the article changed event (which is
    // normally used to update the active TOC) before the TOC
    // changed event.
    treesaver.events.fireEvent(document, treesaver.ui.ArticleManager.events.ARTICLECHANGED, {
      article: treesaver.ui.ArticleManager.currentArticle,
      'url': treesaver.ui.ArticleManager.currentArticle.url,
      'path': treesaver.ui.ArticleManager.currentArticle.path
    });
  }
};

/**
 * Populates the pages array for layout
 *
 * @private
 * @param {number} direction The direction to animate any transition.
 */
treesaver.ui.Chrome.prototype.populatePages = function(direction) {
  var old_pages = this.pages;

  // TODO: Master page width?
  this.pages = treesaver.ui.ArticleManager.getPages(/** @type {!treesaver.dimensions.Size} */ (this.pageArea), 1);

  old_pages.forEach(function(page) {
    // Only deactivate pages we're not about to use again
    if (page) {
      if (this.pages.indexOf(page) === -1) {
        if (page.node && page.node.parentNode === this.viewer) {
          this.viewer.removeChild(page.node);
        }
        page.deactivate();
      }
    }
  }, this);

  this.pages.forEach(function(page, i) {
    if (page) {
      if (!page.node) {
        page.activate();
      }

      if (page.node.parentNode !== this.viewer) {
        if (direction === treesaver.ui.ArticleManager.transitionDirection.BACKWARD) {
          this.viewer.insertBefore(page.node, this.viewer.firstChild);
        }
        else {
          this.viewer.appendChild(page.node);
        }
      }
    }
  }, this);
};

/**
 * Positions the current visible pages
 * @param {number} direction The direction to animate any transition.
 */
treesaver.ui.Chrome.prototype.layoutPages = function(direction) {
  // For now, hard coded to show up to three pages, in the prev/current/next
  // configuration
  //
  // Note, that a page may be null, and won't have a corresponding DOM entry
  // (later, it might have a loading/placeholder page)
  var prevPage = this.pages[0],
      currentPage = this.pages[1],
      nextPage = this.pages[2],
      leftMarginEdge,
      rightMarginEdge,
      leftMargin = Math.max(currentPage.size.marginRight, nextPage ? nextPage.size.marginLeft : 0),
      rightMargin = Math.max(currentPage.size.marginLeft, prevPage ? prevPage.size.marginRight : 0),
      oldOffset = this.pageOffset;

  // Mark the master page
  currentPage.node.setAttribute('id', 'currentPage');

  // Center the first page
  leftMarginEdge = (this.pageArea.w - currentPage.size.outerW) / 2 - leftMargin;
  rightMarginEdge = leftMarginEdge + currentPage.size.outerW + leftMargin + rightMargin;

  // Register the positions of each page
  this.pagePositions = [];
  this.pagePositions[1] = leftMarginEdge;

  if (prevPage) {
    this.pagePositions[0] = leftMarginEdge -
      (prevPage.size.outerW + prevPage.size.marginLeft);
    prevPage.node.setAttribute('id', 'previousPage');
  }

  if (nextPage) {
    this.pagePositions[2] = rightMarginEdge - nextPage.size.marginLeft;
    nextPage.node.setAttribute('id', 'nextPage');
  }

  // Calculate any page offsets to use in animation
  if (direction !== treesaver.ui.ArticleManager.transitionDirection.NEUTRAL) {
    this.animationStart = goog.now();

    if (direction === treesaver.ui.ArticleManager.transitionDirection.BACKWARD) {
      this.pageOffset = nextPage ?
          (this.pagePositions[1] - this.pagePositions[2]) : 0;

      // We might have a previous offset from the page swipe that puts,
      // us closer to the final destination
      if (oldOffset) {
        this.pageOffset += oldOffset;
      }
    }
    else {
      this.pageOffset = prevPage ?
        (this.pagePositions[1] - this.pagePositions[0]) : 0;

      // We might have a previous offset from the page swipe that puts,
      // us closer to the final destination
      if (oldOffset) {
        this.pageOffset += oldOffset;
      }
    }
  }
  else if (!this.pageOffset) {
    // Can't let pageOffset be undefined, will throw errors in IE
    this.pageOffset = 0;
  }

  if (treesaver.capabilities.SUPPORTS_CSSTRANSITIONS && this.pageOffset) {
    this.pageOffset = 0;
  }

  this._updatePagePositions(treesaver.capabilities.SUPPORTS_CSSTRANSITIONS);
};

/**
 * Run updatePagePositions on a delay
 * @private
 */
treesaver.ui.Chrome.prototype._updatePagePositionsDelayed = function() {
  treesaver.scheduler.queue(this.selectPages, [], 'animatePages', this);
};

/**
 * @private
 * @param {boolean=} preventAnimation
 */
treesaver.ui.Chrome.prototype._updatePagePositions = function(preventAnimation) {
  var offset = this.pageOffset;

  if (!preventAnimation) {
    // Pause tasks to keep animation smooth
    treesaver.scheduler.pause(['animatePages'], 2 * MAX_ANIMATION_DURATION);

    var now = goog.now(),
        percentRemaining = !preventAnimation ?
          Math.max(0, (this.animationStart || 0) +
            MAX_ANIMATION_DURATION - now) / MAX_ANIMATION_DURATION :
          1,
        ratio = -Math.cos(percentRemaining * Math.PI) / 2 + 0.5;

    offset *= ratio;

    if (Math.abs(offset) < 5) {
      this.pageOffset = offset = 0;
      // Re-enable other tasks
      treesaver.scheduler.resume();
    }
    else {
      // Queue up another call in a bit
      this._updatePagePositionsDelayed();
    }
  }

  // Update position
  this.pages.forEach(function(page, i) {
    if (page && page.node) {
      treesaver.dimensions.setOffsetX(page.node, this.pagePositions[i] + offset);
    }
  }, this);
};

/**
 * Update the display of fields like the page count
 */
treesaver.ui.Chrome.prototype.updateFields = function() {
  this.updatePageIndex(treesaver.ui.ArticleManager.getCurrentPageNumber());
  this.updatePageCount(treesaver.ui.ArticleManager.getCurrentPageCount());
  this.updatePageWidth(treesaver.ui.ArticleManager.getCurrentPageWidth());
};

/**
 * Find the first chrome that meets the current requirements
 *
 * @param {Array.<treesaver.ui.Chrome>} chromes
 * @param {treesaver.dimensions.Size} availSize
 * @return {?treesaver.ui.Chrome} A suitable Chrome, if one was found.
 */
treesaver.ui.Chrome.select = function(chromes, availSize) {
  // Cycle through chromes
  var i, len, current, chrome = null;

  for (i = 0, len = chromes.length; i < len; i += 1) {
    current = chromes[i];
    if (current.meetsRequirements() && current.fits(availSize)) {
      chrome = current;
      break;
    }
  }

  if (!chrome) {
    treesaver.debug.error('No Chrome Fits!');
  }

  return chrome;
};

if (goog.DEBUG) {
  // Expose for testing
  treesaver.ui.Chrome.prototype.toString = function() {
    return '[Chrome: ]';
  };
}

// Input 33
/**
 * @fileoverview The lightbox class.
 */

goog.provide('treesaver.ui.LightBox');

goog.require('treesaver.capabilities');
goog.require('treesaver.debug');
goog.require('treesaver.dimensions');
goog.require('treesaver.dom');
goog.require('treesaver.layout.Container');
goog.require('treesaver.layout.Figure');

/**
 * Lightbox
 *
 * @param {!Element} node HTML node.
 * @constructor
 */
treesaver.ui.LightBox = function(node) {
  var containerNode = treesaver.dom.getElementsByClassName('container', node)[0];

  // DEBUG-only validation
  if (goog.DEBUG) {
    if (!containerNode) {
      treesaver.debug.error('No container within lightbox!');
    }
  }

  /**
   * List of required capabilities for this LightBox
   * TODO: Only store mutable capabilities
   *
   * @type {?Array.<string>}
   */
  this.requirements = treesaver.dom.hasAttr(node, 'data-requires') ?
    node.getAttribute('data-requires').split(' ') : null;

  /**
   * @type {string}
   */
  this.html = node.parentNode.innerHTML;

  /**
   * The measurements of the chrome
   * @type {!treesaver.dimensions.Metrics}
   */
  this.size = new treesaver.dimensions.Metrics(node);

  // Clean up metrics object
  delete this.size.w;
  delete this.size.h;

  /**
   * @type {boolean}
   */
  this.active = false;

  /**
   * @type {?Element}
   */
  this.node = null;

  /**
   * @type {?Element}
   */
  this.container = null;
};

/**
 * @return {!Element} The activated node.
 */
treesaver.ui.LightBox.prototype.activate = function() {
  if (!this.active) {
    this.active = true;

    this.node = treesaver.dom.createElementFromHTML(this.html);
    this.container = treesaver.dom.getElementsByClassName('container', this.node)[0];
  }

  return /** @type {!Element} */ (this.node);
};

/**
 * Deactivate the lightbox
 */
treesaver.ui.LightBox.prototype.deactivate = function() {
  if (!this.active) {
    return;
  }

  this.active = false;

  // Make sure to drop references
  this.node = null;
};

/**
 * The maximum available space within the lightbox right now
 *
 * @return {!treesaver.dimensions.Size}
 */
treesaver.ui.LightBox.prototype.getMaxSize = function() {
  if (goog.DEBUG) {
    if (!this.node || !this.container) {
      treesaver.debug.error('No active container for lightbox');
    }
  }

  return {
    w: treesaver.dimensions.getOffsetWidth(this.container),
    h: treesaver.dimensions.getOffsetHeight(this.container)
  };
};


/**
 * @param {!treesaver.layout.Figure} figure
 */
treesaver.ui.LightBox.prototype.showFigure = function(figure) {
  var largest = figure.getLargestSize(this.getMaxSize()),
      w = treesaver.dimensions.getOffsetWidth(this.container.offsetParent),
      h = treesaver.dimensions.getOffsetHeight(this.container.offsetParent);

  // TODO: Provide name for sizing via CSS?

  // Closure compiler cast
  this.container = /** @type {!Element} */ (this.container);

  if (this.active && largest) {
    largest.figureSize.applySize(this.container, largest.name);
    this.container.style.bottom = 'auto';
    this.container.style.right = 'auto';
    treesaver.dimensions.setCssPx(this.container, 'left', (w - treesaver.dimensions.getOffsetWidth(this.container)) / 2);
    treesaver.dimensions.setCssPx(this.container, 'top', (h - treesaver.dimensions.getOffsetHeight(this.container)) / 2);
    // TODO: What if the figure is too large?
    return true;
  }
  else {
    return false;
  }
};

/**
 * @param {treesaver.dimensions.Size} availSize
 * @return {boolean} True if fits.
 */
treesaver.ui.LightBox.prototype.fits = function(availSize) {
  return treesaver.dimensions.inSizeRange(this.size, availSize);
};

/**
 * @return {boolean} True if the LightBox meets current browser capabilities.
 */
treesaver.ui.LightBox.prototype.meetsRequirements = function() {
  if (!this.requirements) {
    return true;
  }

  return treesaver.capabilities.check(this.requirements, true);
};

/**
 * Find the first lightbox that meets the current requirements
 *
 * @param {Array.<treesaver.ui.LightBox>} lightboxes
 * @param {treesaver.dimensions.Size} availSize
 * @return {?treesaver.ui.LightBox} A suitable LightBox, if one was found.
 */
treesaver.ui.LightBox.select = function(lightboxes, availSize) {
  // Cycle through lightboxes
  var i, len, current, lightbox = null;

  for (i = 0, len = lightboxes.length; i < len; i += 1) {
    current = lightboxes[i];
    if (current.meetsRequirements() && current.fits(availSize)) {
      lightbox = current;
      break;
    }
  }

  if (!lightbox) {
    treesaver.debug.error('No LightBox Fits!');
  }

  return lightbox;
};

// Input 34
/**
 * @fileoverview Responsible for managing the application state. Should really be called ChromeManager.
 */

goog.provide('treesaver.ui.StateManager');

goog.require('treesaver.capabilities');
goog.require('treesaver.constants');
goog.require('treesaver.debug');
goog.require('treesaver.dom');
goog.require('treesaver.events');
goog.require('treesaver.resources');
goog.require('treesaver.ui.Chrome');
goog.require('treesaver.ui.LightBox');

/**
 * Current state
 */
treesaver.ui.StateManager.state_;

/**
 * Storage for all the chromes
 *
 * @type {!Array.<treesaver.ui.Chrome>}
 */
treesaver.ui.StateManager.chromes_;

/**
 * Initialize the state manager
 *
 * @return {boolean}
 */
treesaver.ui.StateManager.load = function() {
  // Setup state
  treesaver.ui.StateManager.state_ = {
    orientation: 0,
    size: { w: 0, h: 0 }
  };

  // Clean the body
  treesaver.dom.clearChildren(/** @type {!Element} */ (treesaver.boot.tsContainer));

  // Install container for chrome used to measure screen space, etc
  treesaver.ui.StateManager.state_.chromeContainer = treesaver.ui.StateManager.getChromeContainer_();

  // Get or install the viewport
  treesaver.ui.StateManager.state_.viewport = treesaver.ui.StateManager.getViewport_();

  // Get the chromes and lightboxes
  treesaver.ui.StateManager.chromes_ = treesaver.ui.StateManager.getChromes_();
  treesaver.ui.StateManager.lightboxes_ = treesaver.ui.StateManager.getLightBoxes_();

  // Can't do anything without mah chrome
  if (!treesaver.ui.StateManager.chromes_.length) {
    treesaver.debug.error('No chromes');

    return false;
  }

  // Find and install the first chrome by calling checkState manually (this will also set up the size)
  treesaver.ui.StateManager.checkState();

  // Setup checkstate timer
  treesaver.scheduler.repeat(treesaver.ui.StateManager.checkState, CHECK_STATE_INTERVAL, Infinity, [], 'checkState');

  if (treesaver.capabilities.SUPPORTS_ORIENTATION && !treesaver.boot.inContainedMode) {
    treesaver.events.addListener(window, 'orientationchange',
      treesaver.ui.StateManager.onOrientationChange);

    // Hide the address bar on iPhone
    treesaver.scheduler.delay(function() {
      // IE's window.scrollTo is some kind of weird function without an apply()
      // so we have to wrap this call within a wrapper to avoid nasty errors
      window.scrollTo(0, 1);
    }, 100);
  }

  return true;
};

treesaver.ui.StateManager.unload = function() {
  // Remove handler
  if (treesaver.capabilities.SUPPORTS_ORIENTATION && !treesaver.boot.inContainedMode) {
    treesaver.events.removeListener(window, 'orientationchange',
      treesaver.ui.StateManager.onOrientationChange);
  }

  // Deactive any active chrome
  if (treesaver.ui.StateManager.state_.chrome) {
    treesaver.ui.StateManager.state_.chrome.deactivate();
  }

  // Lose references
  treesaver.ui.StateManager.state_ = null;
  treesaver.ui.StateManager.chromes_ = null;
  treesaver.ui.StateManager.lightboxes_ = null;
};

/**
 * @private
 * @return {!Element}
 */
treesaver.ui.StateManager.getChromeContainer_ = function() {
  if (treesaver.boot.inContainedMode) {
    return treesaver.boot.tsContainer;
  }
  else {
    var container = document.createElement('div');
    container.setAttribute('id', 'chromeContainer');
    treesaver.boot.tsContainer.appendChild(container);
    return container;
  }
};

/**
 * @private
 * @return {!Element}
 */
treesaver.ui.StateManager.getViewport_ = function() {
  var viewport = treesaver.dom.getElementsByProperty('name', 'viewport', 'meta')[0];

  if (!viewport) {
    // Create a viewport if one doesn't exist
    viewport = document.createElement('meta');
    viewport.setAttribute('name', 'viewport');
    treesaver.dom.getElementsByTagName('head')[0].appendChild(viewport);
  }

  return viewport;
};

/**
 * @private
 * @return {!Array.<treesaver.ui.Chrome>}
 */
treesaver.ui.StateManager.getChromes_ = function() {
  var chromes = [];

  treesaver.resources.findByClassName('chrome').forEach(function(node) {
    var chrome,
        requires = node.getAttribute('data-requires');

    if (requires && !treesaver.capabilities.check(requires.split(' '))) {
      // Doesn't meet our requirements, skip
      return;
    }

    treesaver.ui.StateManager.state_.chromeContainer.appendChild(node);

    chrome = new treesaver.ui.Chrome(node);
    chromes.push(chrome);

    treesaver.ui.StateManager.state_.chromeContainer.removeChild(node);
  });

  return chromes;
};

/**
 * @private
 * @return {!Array.<treesaver.ui.LightBox>}
 */
treesaver.ui.StateManager.getLightBoxes_ = function() {
  var lightboxes = [];

  treesaver.resources.findByClassName('lightbox').forEach(function(node) {
    var lightbox,
        requires = node.getAttribute('data-requires');

    if (requires && !treesaver.capabilities.check(requires.split(' '))) {
      // Doesn't meet our requirements, skip
      return;
    }

    treesaver.ui.StateManager.state_.chromeContainer.appendChild(node);

    lightbox = new treesaver.ui.LightBox(node);
    lightboxes.push(lightbox);

    treesaver.ui.StateManager.state_.chromeContainer.removeChild(node);
  });

  return lightboxes;
};

/**
 * Detect any changes in orientation, and update the viewport accordingly
 */
treesaver.ui.StateManager.onOrientationChange = function() {
  if (treesaver.ui.StateManager.state_.orientation === window['orientation']) {
    // Nothing to do (false alarm?)
    return;
  }

  // TODO: Fire event?
  //
  // TODO: Refactor this manual update
  treesaver.capabilities.updateClasses();

  treesaver.ui.StateManager.state_.orientation = window['orientation'];

  if (treesaver.ui.StateManager.state_.orientation % 180) {
    // Rotated (landscape)
    treesaver.ui.StateManager.state_.viewport.setAttribute('content',
      'width=device-height, height=device-width');
  }
  else {
    // Normal
    treesaver.ui.StateManager.state_.viewport.setAttribute('content',
      'width=device-width, height=device-height');
  }

  // Hide the address bar on the iPhone
  window.scrollTo(0, 1);

  // TODO: Update classes for styling?

  // TODO: Access widths to force layout?
};

/**
 * Gets the size currently visible within the browser
 *
 * @private
 * @return {{ w: number, h: number }}
 */
treesaver.ui.StateManager.getAvailableSize_ = function() {
  if (WITHIN_IOS_WRAPPER || !treesaver.boot.inContainedMode) {
    if (window.pageYOffset || window.pageXOffset) {
      window.scrollTo(0, 1);
    }

    // IE9+ and all other browsers
    if (!SUPPORT_IE || 'innerWidth' in window) {
      return {
        w: window.innerWidth,
        h: window.innerHeight
      };
    }
    else {
      // IE8-
      return {
        w: document.documentElement.clientWidth,
        h: document.documentElement.clientHeight
      };
    }
  }
  else {
    return treesaver.dimensions.getSize(treesaver.boot.tsContainer);
  }
};

/**
 * Get a lightbox for display
 *
 * @return {?treesaver.ui.LightBox}
 */
treesaver.ui.StateManager.getLightBox = function() {
  var availSize = treesaver.ui.StateManager.getAvailableSize_();

  return treesaver.ui.LightBox.select(treesaver.ui.StateManager.lightboxes_, availSize);
};

/**
 * Tick function
 */
treesaver.ui.StateManager.checkState = function() {
  var availSize = treesaver.ui.StateManager.getAvailableSize_(),
      newChrome;

  // Check if we're at a new size
  if (availSize.h !== treesaver.ui.StateManager.state_.size.h || availSize.w !== treesaver.ui.StateManager.state_.size.w) {
    treesaver.ui.StateManager.state_.size = availSize;

    // Check if chrome still fits
    if (!treesaver.ui.StateManager.state_.chrome ||
        !treesaver.ui.StateManager.state_.chrome.meetsRequirements() ||
        !treesaver.ui.StateManager.state_.chrome.fits(availSize)) {
      // Chrome doesn't fit, need to install a new one
      newChrome = treesaver.ui.Chrome.select(treesaver.ui.StateManager.chromes_, availSize);

      if (!newChrome) {
        // TODO: Fire chrome failed event
        // TODO: Show error page (no chrome)
        return;
      }

      // TODO: Fire chrome change event?
      // Remove existing chrome
      treesaver.dom.clearChildren(treesaver.ui.StateManager.state_.chromeContainer);
      // Deactivate previous
      if (treesaver.ui.StateManager.state_.chrome) {
        treesaver.ui.StateManager.state_.chrome.deactivate();
      }

      // Activate and store
      treesaver.ui.StateManager.state_.chromeContainer.appendChild(newChrome.activate());
      treesaver.ui.StateManager.state_.chrome = newChrome;
    }

    // Chrome handles page re-layout, if necessary
    treesaver.ui.StateManager.state_.chrome.setSize(availSize);
  }
};

// Expose special functions for use by the native app wrappers
if (WITHIN_IOS_WRAPPER) {
  // UI is shown/hidden based on the active and idle events fired by the
  // currently visible chrome.
  //
  // Since the next/prev, etc controls are contained within external UI,
  // need to expose functions that both go to next/prev and fire active
  //
  // Create a wrapper function that calls active on the current chrome
  // before calling the actual function
  var activeFunctionWrapper = function(f) {
    return (function() {
      // Manually call the chrome's function, if it exists
      if (treesaver.ui.StateManager.state_.chrome) {
        treesaver.ui.StateManager.state_.chrome.setUiActive_();
      }

      // Call original function
      f();
    });
  };

  goog.exportSymbol('treesaver.nextPage',
    activeFunctionWrapper(treesaver.ui.ArticleManager.nextPage));
  goog.exportSymbol('treesaver.previousPage',
    activeFunctionWrapper(treesaver.ui.ArticleManager.previousPage));
  goog.exportSymbol('treesaver.nextArticle',
    activeFunctionWrapper(treesaver.ui.ArticleManager.nextArticle));
  goog.exportSymbol('treesaver.previousArticle',
    activeFunctionWrapper(treesaver.ui.ArticleManager.previousArticle));
}

// Input 35
/**
 * @fileoverview Reading UI.
 */

goog.provide('treesaver.core');

goog.require('treesaver.debug');
goog.require('treesaver.styles');
goog.require('treesaver.ui.Article');
goog.require('treesaver.ui.ArticleManager');
goog.require('treesaver.ui.Chrome');
goog.require('treesaver.ui.StateManager');

/**
 * Load the UI
 */
treesaver.core.load = function() {
  treesaver.debug.info('Core load begin');

  // Make sure we clean up when leaving the page
  treesaver.events.addListener(window, 'unload', treesaver.core.unload);

  // Root element for listening to UI events
  treesaver.ui.eventRoot = treesaver.boot.inContainedMode ?
    treesaver.boot.tsContainer : window;

  // Kick off boot process, but back up if any single item fails
  if (treesaver.ui.StateManager.load() &&
      // Grids
      treesaver.ui.ArticleManager.load(treesaver.boot.originalHtml)) {
  }
  else {
    treesaver.debug.error('Load failed');

    treesaver.core.unload();
  }
};

/**
 * Unload the UI and cleanup
 */
treesaver.core.unload = function() {
  treesaver.debug.info('Core unloading');

  treesaver.events.removeListener(window, 'unload', treesaver.core.unload);

  treesaver.ui.ArticleManager.unload();
  treesaver.ui.StateManager.unload();

  treesaver.boot.unload();
};


// Input 36
/**
 * @fileoverview Fire an event when the dom is ready.
 */

goog.provide('treesaver.domready');

goog.require('treesaver.events');
goog.require('treesaver.scheduler');

/**
 * Events fired
 *
 * @const
 * @type {Object.<string, string>}
 */
treesaver.domready.events = {
  READY: 'treesaver.ready'
};

/**
 * Whether the DOM is ready
 * @return {boolean} True if ready.
 */
treesaver.domready.ready = function() {
  return treesaver.domready.documentReady_;
};

/**
 * Whether the document is fully loaded
 * @return {boolean} True if ready.
 */
treesaver.domready.loaded = function() {
  return treesaver.domready.documentLoaded_;
};

/**
 * Whether the document is ready yet
 *
 * @private
 * @type {boolean}
 */
treesaver.domready.documentReady_ = false;

/**
 * Whether the document is fully loaded yet
 *
 * @private
 * @type {boolean}
 */
treesaver.domready.documentLoaded_ = false;

/**
 * Mark document as loaded and fire event
 * @private
 */
treesaver.domready.ready_ = function() {
  // Ignore calls after load
  if (treesaver.domready.documentReady_) {
    return;
  }

  // Make sure the body is actually accessible, false positive
  // happens in some browsers
  if (!document.body) {
    treesaver.debug.error('DOMReady without document.body');

    // Strange state, re-run the handler in a bit
    treesaver.debug.info('Requeue domReady handler in order to wait for document.body');
    treesaver.scheduler.queue(treesaver.domready.ready_);
    return;
  }

  treesaver.domready.documentReady_ = true;

  treesaver.debug.info('DOM is ready');

  // Remove event handlers
  treesaver.events.removeListener(
    document,
    'DOMContentLoaded',
    treesaver.domready
  );
  treesaver.events.removeListener(
    document,
    'readystatechange',
    treesaver.domready
  );
  treesaver.events.removeListener(window, 'load', treesaver.domready);

  // No longer needed
  delete treesaver.domready.elementCount_;

  // Fire event
  treesaver.events.fireEvent(document, treesaver.domready.events.READY);
};

/**
 * Count of all the elements in the tree, used as a hacky measure
 * as to whether the document has finished loaded
 *
 * @private
 * @type {number}
 */
treesaver.domready.elementCount_;

/**
 * Check if the DOM is ready yet
 */
treesaver.domready.pollState_ = function() {
  // Use readystate for browsers that support it
  // Firefox 3.6+, Webkit/Chrome, Opera
  if ('readyState' in document) {
    if (/complete|loaded/.test(document.readyState)) {
      treesaver.domready.ready_();
    }

    return;
  }

  treesaver.debug.info('Manually polling document ready state');

  // TODO: Find a better way of detecting load?
  // Or, just don't worry about it since soon there won't be any
  // browsers left that don't support readyState

  var elementCount = document.getElementsByTagName('*').length;

  if (!treesaver.domready.elementCount_) {
    // Set the element count
    treesaver.domready.elementCount_ = elementCount;

    // Schedule another check
    treesaver.scheduler.delay(treesaver.domready.pollState_, 100);
  }
  else if (elementCount !== treesaver.domready.elementCount_) {
    // The DOM hasn't finished loading, because our element count is
    // changing.
    //
    // In this case, we don't bother setting up another timer, since
    // we can count on at least the load event firing for us
    // TODO: Confirm this
  }
  else {
    // Element count is stable, assume that means the DOM is ready
    treesaver.domready.ready_();

    return;
  }
};

/**
 * Event handler
 *
 * @param {Event=} e
 */
treesaver.domready['handleEvent'] = function(e) {
  treesaver.debug.info('DOM event received: ' + e.type);

  if (/load|DOMContentLoaded/.test(e.type)) {
    treesaver.domready.ready_();
  }
  else {
    treesaver.domready.pollState_();
  }
};

// Attach listeners to watch for loading
// Mozilla/Opera/Webkit support DOMContentLoaded
treesaver.events.addListener(document, 'DOMContentLoaded', treesaver.domready);
treesaver.events.addListener(document, 'readystatechange', treesaver.domready);
treesaver.events.addListener(window, 'load', treesaver.domready);

// Poll state manually in case we are loaded late
treesaver.domready.pollState_();

// Input 37
// This file is generated. Do not modify.
goog.provide('treesaver.modules');

treesaver.modules = {
  "treesaver-init": { target: "treesaver-init-0.9.2.js", src: "init.js" },
  "treesaver-core": { target: "treesaver-core-0.9.2.js", src: "core.js" }
};
/**
 * Returns a filename given a module name. The filename is
 * dependant on whether the application is compiled.
 *
 * @param {!string} name Module name to look up a filename for.
 * @return {!string} File name to load for the given module.
 */
treesaver.modules.get = function (name) {
  return treesaver.modules[name][COMPILED ? 'target' : 'src'];
};
// Input 38
/**
 * @fileoverview Async loading of JavaScript files.
 */

goog.provide('treesaver.scriptloader');

goog.require('treesaver.constants');
goog.require('treesaver.dom');
goog.require('treesaver.modules');

/**
 * @const {string}
 */
treesaver.scriptloader.BASE_FILENAME = treesaver.modules.get('treesaver-init');

/**
 * Load a script asynchronously
 *
 * @param {!string} name
 * @param {!function(string)} callback
 */
treesaver.scriptloader.load = function(name, callback) {
  var s = document.createElement('script');

  s.type = 'text/javascript';
  s.setAttribute('async', 'async');

  // Insert into tree
  treesaver.dom.safeAppendToDocument(s);
  // Setup callback
  s.onload = s.onreadystatechange = function(e) {
    if (!e) {
      e = window.event;
    }

    if (e.type === 'load' ||
        'readyState' in s &&
        (s.readyState === 'complete' || s.readyState === 'loaded')) {
      treesaver.debug.info('Asynchronous load complete: ' + name);

      // Clear handlers
      s.onload = s.onreadystatechange = null;

      // TODO: Use events instead?
      callback(name);
    }
    else {
      treesaver.debug.info('Extra script loading event recieved: ' + e.type);
    }
  };

  treesaver.debug.info('Begin asynchronous load: ' + name);

  // Start the script download
  s.src = treesaver.scriptloader.getUrlFromName_(name);
};

/**
 * Convert a script name into a full URL
 *
 * @private
 * @param {!string} name
 * @return {!string} Full url to the file.
 */
treesaver.scriptloader.getUrlFromName_ = function(name) {
  // Leave absolute paths alone, including ones that go to other servers
  // (check for '://' instead of http|https|file)
  if (SUPPORT_IE) {
    // IE7 flakes on name[0], have to use charAt instead
    if (name.charAt(0) === '/' || /:\/\//.test(name)) {
      return name;
    }
  }
  else {
    if (name[0] === '/' || /:\/\//.test(name)) {
      return name;
    }
  }

  // Assume relative to the base path
  return treesaver.scriptloader.getScriptPath_() + name;
};

/**
 * Cached storage for the base script path
 *
 * @private
 * @type {!string}
 */
treesaver.scriptloader.scriptPath_;

/**
 * Get the path for all script files
 *
 * @private
 * @return {!string}
 */
treesaver.scriptloader.getScriptPath_ = function() {
  // Calculate once
  if (!treesaver.scriptloader.scriptPath_) {
    var path = '',
        scripts = document.getElementsByTagName('script');

    // Search through scripts to find our base URL
    treesaver.array.toArray(scripts).forEach(function(script) {
      // TODO: Make this better
      if (!path && script.src.indexOf(treesaver.scriptloader.BASE_FILENAME) !== -1) {
        path = script.getAttribute('src');
      }
    });

    if (path) {
      treesaver.scriptloader.scriptPath_ =
        treesaver.scriptloader.getDirectoryName_(path);
    }
    else {
      treesaver.debug.error('Could not find script path');

      return '';
    }
  }

  return treesaver.scriptloader.scriptPath_;
};

/**
 * Get the directory name given a path
 *
 * @private
 * @param {!string} path
 * @return {!string} Directory name.
 */
treesaver.scriptloader.getDirectoryName_ = function(path) {
  var lastSlash = path.lastIndexOf('/');

  return path.substr(0, lastSlash + 1);
};

// Input 39
/**
 * @fileoverview Initializes the framework, loading required files and
 * resources.
 */

goog.provide('treesaver.boot');

goog.require('treesaver.capabilities');
goog.require('treesaver.constants');
goog.require('treesaver.debug');
goog.require('treesaver.dom');
goog.require('treesaver.domready');
goog.require('treesaver.events');
goog.require('treesaver.modules');
goog.require('treesaver.resources');
goog.require('treesaver.scheduler');
goog.require('treesaver.scriptloader');

/**
 * @const
 * @type {number}
 */
treesaver.boot.LOAD_TIMEOUT = 5000; // 5 seconds

/**
 * Load scripts and required resources
 */
treesaver.boot.load = function() {
  treesaver.debug.info('Begin Treesaver booting');

  if (!goog.DEBUG || !window.TS_NO_AUTOLOAD) {
    // Hide content to avoid ugly flashes
    document.documentElement.style.display = 'none';
  }

  // Initialize the network module
  treesaver.network.load();

  // Set capability flags
  treesaver.capabilities.updateClasses();

  // Load resources
  treesaver.resources.load(function() {
    treesaver.boot.resourcesLoaded_ = true;
    treesaver.boot.loadProgress_();
  });

  // Load other scripts
  if (USE_MODULES) {
    // goog.require doesn't play nice with the DOM and async loading, so
    // we require the files beforehand
    //
    // However, we must alias the goog.require call so it doesn't get caught
    // in the dependency calculations
    if (!COMPILED) {
      var gr = goog.require;

      // Wrap in a try-catch in order to avoid errors
      try {
        gr('treesaver.core');
      }
      catch (ex) {
        // Ignore
      }
    }

    treesaver.scriptloader.load(treesaver.modules.get('treesaver-core'), function(name) {
      treesaver.boot.coreLoaded_ = true;
      treesaver.boot.loadProgress_();
    });
  }

  // Watch for dom ready
  if (!treesaver.domready.ready()) {
    treesaver.events.addListener(
      document,
      treesaver.domready.events.READY,
      treesaver.boot.domReady
    );
  }
  else {
    // DOM is already ready, call directly
    treesaver.boot.domReady();
  }

  if (!goog.DEBUG || !window.TS_NO_AUTOLOAD) {
    // Fallback in case things never load
    treesaver.scheduler.delay(
      treesaver.boot.unload,
      treesaver.boot.LOAD_TIMEOUT,
      [],
      'unboot'
    );
  }
};

/**
 * Recover from errors and return the page to the original state
 */
treesaver.boot.unload = function() {
  treesaver.debug.info('Treesaver unbooting');

  // Restore HTML
  if (!WITHIN_IOS_WRAPPER && treesaver.boot.inContainedMode) {
    treesaver.boot.tsContainer.innerHTML = treesaver.boot.originalContainerHtml;
  }
  else if (treesaver.boot.originalHtml) {
    treesaver.boot.tsContainer.innerHTML = treesaver.boot.originalHtml;
  }

  // First, do standard cleanup
  treesaver.boot.cleanup_();

  // Stop all scheduled tasks
  treesaver.scheduler.stopAll();

  // Clean up libraries
  treesaver.resources.unload();
  treesaver.network.unload();

  // Setup classes
  treesaver.capabilities.resetClasses();

  // Show content again
  document.documentElement.style.display = 'block';
};

/**
 * Clean up boot-related timers and handlers
 * @private
 */
treesaver.boot.cleanup_ = function() {
  // Clear out the unboot timeout
  treesaver.scheduler.clear('unboot');

  // Remove DOM ready handler
  treesaver.events.removeListener(
    document,
    treesaver.domready.events.READY,
    treesaver.boot.domReady
  );

  // Kill loading flags
  delete treesaver.boot.resourcesLoaded_;
  if (USE_MODULES) {
    delete treesaver.boot.coreLoaded_;
  }
  delete treesaver.boot.domReady_;
};

/**
 * Receive DOM ready event
 *
 * @param {Event=} e
 */
treesaver.boot.domReady = function(e) {
  treesaver.boot.domReady_ = true;

  if (!WITHIN_IOS_WRAPPER) {
    treesaver.boot.tsContainer = document.getElementById('ts_container');
  }

  if (!WITHIN_IOS_WRAPPER && treesaver.boot.tsContainer) {
    // Is the treesaver display area contained within a portion of the page?
    treesaver.boot.inContainedMode = true;
    treesaver.boot.originalContainerHtml = treesaver.boot.tsContainer.innerHTML;
  }
  else {
    treesaver.boot.inContainedMode = false;
    treesaver.boot.tsContainer = document.body;
  }

  treesaver.boot.originalHtml = document.body.innerHTML;

  // Remove main content
  treesaver.dom.clearChildren(/** @type {!Element} */(treesaver.boot.tsContainer));

  if (!goog.DEBUG || !window.TS_NO_AUTOLOAD) {
    // Place a loading message
    treesaver.boot.tsContainer.innerHTML =
      '<div id="loading">Loading ' + document.title + '...</div>';
    // Re-enable content display
    document.documentElement.style.display = 'block';
  }

  // Update state
  treesaver.boot.loadProgress_();
};

/**
 *
 * @private
 */
treesaver.boot.loadProgress_ = function() {
  if (!treesaver.boot.resourcesLoaded_) {
    // Can't show loading screen until resources are loaded
    return;
  }

  if (USE_MODULES && !treesaver.boot.coreLoaded_) {
    // Must wait for the other modules to load
    return;
  }

  if (!treesaver.boot.domReady_) {
    treesaver.debug.info('Load progress: DOM not ready yet');

    // Can't do anything if the DOM isn't ready
    return;
  }
  else {
    // TODO: Happens once in a while, need to track down
    if (!document.body) {
      treesaver.debug.error('document.body not available after DOM ready');

      return;
    }
  }

  treesaver.debug.info('Treesaver boot complete');

  // Clean up handlers and timers
  treesaver.boot.cleanup_();

  if (!goog.DEBUG || !window.TS_NO_AUTOLOAD) {
    // Start loading the core (UI, layout, etc)

    // TODO: In compiled module mode, this function won't be visible if in a
    // closure ... may need to export
    treesaver.core.load();
  }
};

// Input 40
/**
 * @fileoverview Proxy for HTML5 window history functions for browsers that
 * do not support it.
 */

goog.provide('treesaver.history');

goog.require('treesaver.capabilities');
goog.require('treesaver.debug');
goog.require('treesaver.dom');
goog.require('treesaver.scheduler');
goog.require('treesaver.storage');

/**
 * Milliseconds between checks for hash changes on browsers that don't
 * support onhashchange
 *
 * @const
 * @type {number}
 */
treesaver.history.HASH_INTERVAL = 100;

/**
 * Hash prefix used to mark a hash generated by this library
 *
 * @const
 * @type {string}
 */
treesaver.history.DELIMITER = '-';

/**
 * Does the browser have a native implementation of the history functions
 * @const
 * @private
 * @type {boolean}
 */
treesaver.history.NATIVE_SUPPORT = 'pushState' in window.history;

/**
 * Return the value of the current document hash, minus any leading '#'
 * @private
 * @return {string} The normalized hash value.
 */
treesaver.history.getNormalizedHash_ = function() {
  // IE7 does funky things with the location.hash property when the URL contains a
  // query string. Firefox 3.5 has quirks around escaping hash values ( hat tip: blixt
  // https://github.com/blixt/js-hash/ )
  //
  // Therefore, use location.href instead of location.hash, as blixt did (MIT license)
  var index = document.location.href.indexOf('#');
  return index === -1 ? '' : document.location.href.substr(index + 1);
};

// Even if the client has a native implementation of the API, we have to check
// the hash on load just in case the visitor followed a link generated by a
// browser that does not have native support
if (document.location.hash) {
  var current_hash = treesaver.history.getNormalizedHash_();

  // Our hashes always start with the delimiter and have at least another
  // character there
  if (current_hash.charAt(0) === treesaver.history.DELIMITER &&
      current_hash.length >= 2) {
    // Redirect, stripping the intial delimiter
    // Use location.replace instead of setting document.location to avoid
    // breaking the back button
    document.location.replace(current_hash.substr(1));
  }
}

/**
 * Proxy function for window.history.pushState
 *
 * @param {!Object} data
 * @param {!string} title
 * @param {!string} url
 */
treesaver.history.pushState = function(data, title, url) {
  window.history['pushState'](data, title, url);
};

/**
 * Proxy function for window.history.replaceState
 *
 * @param {!Object} data
 * @param {!string} title
 * @param {!string} url
 */
treesaver.history.replaceState = function(data, title, url) {
  window.history['replaceState'](data, title, url);
};

// History helper functions only needed for browsers that don't
// have native support
if (!treesaver.history.NATIVE_SUPPORT) {
  treesaver.debug.info('Using non-native history implementation');

  // Override functions for browsers with non-native support
  treesaver.history.pushState = function(data, title, url) {
    treesaver.history._changeState(data, title, url, false);
  };
  treesaver.history.replaceState = function(data, title, url) {
    treesaver.history._changeState(data, title, url, true);
  };

  /**
   * Create a hash for a given URL
   *
   * @private
   * @param {!string} url
   * @return {string} String that can be safely used as hash.
   */
  treesaver.history.createHash_ = function(url) {
    // Always add delimiter and escape the URL
    return treesaver.history.DELIMITER + window.escape(url);
  };

  /**
   * Set the browser hash. Necessary in order to override behavior when
   * using IFrame for IE7
   *
   * @private
   * @param {!string} hash
   */
  treesaver.history.setLocationHash_ = function(hash) {
    document.location.hash = '#' + hash;
  };

  /**
   * Set the browser hash without adding a history entry
   *
   * @private
   * @param {!string} hash
   */
  treesaver.history.replaceLocationHash_ = function(hash) {
    document.location.replace('#' + hash);
  };

  /**
   * Storage prefix for history items
   *
   * @const
   * @private
   * @type {string}
   */
  treesaver.history.STORAGE_PREFIX = 'history:';

  /**
   * Create key name for storing history data
   *
   * @private
   * @param {!string} key
   * @return {string} String that can be safely used as storage key.
   */
  treesaver.history.createStorageKey_ = function(key) {
    return treesaver.history.STORAGE_PREFIX + key;
  };

  /**
   * @private
   * @param {?Object} data
   * @param {?string} title
   * @param {!string} url
   * @param {boolean} replace
   */
  treesaver.history._changeState = function _changeState(data, title, url, replace) {
    var hash_url = treesaver.history.createHash_(url);

    // Store data using url
    treesaver.storage.set(
      treesaver.history.createStorageKey_(hash_url),
      { state: data, title: title }
    );

    // If we're using the same URL as the current page, don't double up
    if (url === document.location.pathname) {
      hash_url = '';
    }

    // HTML5 implementation only calls popstate as a result of a user action,
    // store the hash so we don't trigger a false event
    treesaver.history.hash_ = hash_url;

    // Use the URL as a hash
    if (replace) {
      treesaver.history.replaceLocationHash_(hash_url);
    }
    else {
      treesaver.history.setLocationHash_(hash_url);
    }
  };

  /**
   * Receive the hashChanged event (native or manual) and fire the onpopstate
   * event
   * @private
   */
  treesaver.history.hashChange_ = function hashChange_() {
    var new_hash = treesaver.history.getNormalizedHash_(),
        data;

    // False alarm, ignore
    if (new_hash === treesaver.history.hash_) {
      return;
    }

    treesaver.history.hash_ = new_hash;
    data = treesaver.history.hash_ ?
      treesaver.storage.get(treesaver.history.createStorageKey_(new_hash)) :
      {};

    treesaver.debug.info('New hash: ' + treesaver.history.hash_);

    // Now, fire onpopstate with the state object
    if ('onpopstate' in window &&
        typeof window['onpopstate'] === 'function') {
      window['onpopstate'].apply(window, [{ 'state': data ? data.state : null }]);
    }
    else {
      treesaver.debug.info('State changed, but no handler!');
    }
  };

  /**
   * @return {boolean} True if the hash has changed
   */
  treesaver.history.hasHashChanged_ = function() {
    return treesaver.history.getNormalizedHash_() !== treesaver.history.hash_;
  };

  // IE8 in IE7 mode defines onhashchange, but never fires it
  if ('onhashchange' in window && !treesaver.capabilities.IS_IE8INIE7) {
    treesaver.debug.info('Browser has native onHashChange');

    window['onhashchange'] = treesaver.history.hashChange_;
  }
  else {
    treesaver.debug.info('Using manual hash change detection');

    // Need to check hash state manually
    treesaver.scheduler.repeat(function() {
      if (treesaver.history.hasHashChanged_()) {
        treesaver.history.hashChange_();
      }
    }, treesaver.history.HASH_INTERVAL, Infinity);

    // IE6 & 7 don't create history items if the hash doesn't match an
    // element's ID so we need to create an iframe which we'll use
    if (SUPPORT_IE && treesaver.capabilities.BROWSER_NAME === 'msie') {
      treesaver.debug.info('Using iFrame history for IE7');

      /**
       * iFrame used for supporting the back button in IE7
       * @private
       * @type {!Element}
       */
      treesaver.history.dummyIFrame_ = document.createElement('iframe');

      // Add the iFrame to the document
      treesaver.dom.safeAppendToDocument(treesaver.history.dummyIFrame_);

      // Redefine the hasHashChanged_ function to ensure check the iFrame
      // contents
      treesaver.history.hasHashChanged_ = function() {
        var hash = treesaver.history.dummyIFrame_.contentWindow.document.body.innerHTML;

        if (hash !== treesaver.history.hash_) {
          // Set the hash in case a user copies and pastes or shares the URL
          document.location.hash = '#' + (hash || '');
          return true;
        }
      };

      // Redefine replaceLocationHash_ to change contents of dummy iframe w/o history
      // entry
      treesaver.history.replaceLocationHash_ = function(hash) {
        var iDoc = treesaver.history.dummyIFrame_.contentWindow.document;
        if (hash !== iDoc.body.innerHTML) {
          iDoc.body.innerHTML = hash;
        }
        document.location.replace('#' + hash);
      }

      // Redefine setLocationHash_ to change the contents of the dummy iframe
      // and create a new history entry
      treesaver.history.setLocationHash_ = function(hash) {
        var iDoc = treesaver.history.dummyIFrame_.contentWindow.document;
        iDoc.open();
        iDoc.write('<html><body>' + hash + '</body></html>');
        iDoc.close();
        document.location.hash = '#' + hash;
      };
    }
  }
}

// Input 41
/**
 * @fileoverview Shiv that ensures old versions of IE properly parse HTML5
 * elements.
 */

goog.provide('treesaver.html5');

goog.require('treesaver.constants');

if (SUPPORT_IE) {
  // HTML5 shim, courtesy of: https://github.com/lindsayevans/html5-shiv
  eval("/*@cc_on (function(a,b,c){while(b--)a.createElement(c[b])})(document,21,['abbr','article','aside','audio','canvas','details','figcaption','figure','footer','header','hgroup','mark','menu','meter','nav','output','progress','section','summary','time','video'])@*/");
}

// Input 42
/**
 * @fileoverview Bootstrap for the Treesaver library.
 */

/**
 * @preserve Copyright 2011 Filipe Fortes ( www.fortes.com ).
 * Version: 0.1.
 *
 * Licensed under MIT and GPLv2.
 */

goog.provide('treesaver');

goog.require('treesaver.boot');
goog.require('treesaver.capabilities');
goog.require('treesaver.constants');
goog.require('treesaver.debug');
goog.require('treesaver.history');
goog.require('treesaver.html5');

// Begin loading
if (treesaver.capabilities.SUPPORTS_TREESAVER) {
  treesaver.boot.load();
}
else {
  treesaver.debug.warn('Treesaver not supported');
}

/**
 * The version number of the code used to build a production
 * bundle.
 *
 * @define {string}
 */
treesaver.VERSION = 'dev';

goog.exportSymbol('treesaver.VERSION', treesaver.VERSION);

// Input 43
// This file is generated. Do not modify.
goog.provide('treesaver.modules');

treesaver.modules = {
  "treesaver-init": { target: "treesaver-init-0.9.2.js", src: "init.js" },
  "treesaver-core": { target: "treesaver-core-0.9.2.js", src: "core.js" }
};
/**
 * Returns a filename given a module name. The filename is
 * dependant on whether the application is compiled.
 *
 * @param {!string} name Module name to look up a filename for.
 * @return {!string} File name to load for the given module.
 */
treesaver.modules.get = function (name) {
  return treesaver.modules[name][COMPILED ? 'target' : 'src'];
};
