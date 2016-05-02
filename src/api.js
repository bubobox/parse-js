'use strict';

import { parse, reverse } from './parse';
import * as parsers from './parsers';
import * as reversers from './reversers';
import { realPath } from './utils';

export * as parsers from './parsers';
export * as reversers from './reversers';
export * from './transform';

/**
 * Generates the parser method that will invoke the real parser with the
 * correct data.
 */
export
function createParser( path, parser, ...args ) {
    const p = data => parse( path, parser, data, ...args );
    p.path = path;
    p.nestsResult = parser.nestsResult || false;
    return p;
}

/**
 * Generates the reverser method that will invoke the real reverser with
 * the correct data.
 */
export
function createReverse( path, reverser, ...args ) {
    const r = data => reverse( path, reverser, data, ...args );
    r.path = path;
    r.nestsResult = reverser.nestsResult || false;
    r.insertsParent = reverser.insertsParent || false;
    return r;
}

export
function matchKey( path, key ) {
    return createParser( path, parsers.matchKey, key );
}

export
function matchPrefixStrip( path, key, restoreCamelCase = true ) {
    const f = createParser( path, parsers.matchPrefixStrip, key);
    f.reverse = createReverse( path, reversers.matchPrefixStrip, realPath(key), restoreCamelCase );
    return f;
}

export
function boolean( path, defaultValue ) {
    const f = createParser( path, parsers.boolean, defaultValue );
    f.reverse = createReverse(path, reversers.boolean);
    return f;
}

export
function equals( path, shouldEqual, notEqualReverseValue = undefined ) {
    const f = createParser( path, parsers.equals, shouldEqual );
    f.reverse = createReverse(path, reversers.equals, shouldEqual, notEqualReverseValue );
    return f;
}

export
function number( path, NaNValue = 0 ) {
    const f = createParser( path, parsers.number, NaNValue );
    f.reverse = createReverse(path, reversers.number, NaNValue);
    return f;
}


export
function date( path, nowOnInvalid = false ) {
    const f = createParser( path, parsers.date, nowOnInvalid );
    f.reverse = createReverse(path, reversers.date);
    return f;
}

export
function array( path, valueParser ) {
    const f = createParser( path, parsers.array, valueParser );
    f.reverse = createReverse(path, reversers.array);
    return f;
}

export
function string( path ) {
    return createParser( path, parsers.string );
}

export
function multilingual( path, valueParser, group = false, parseType = null, languages = null ) {
    // const originalPath = _.isFunction(path) ? path.path : path;
    const parser = group ? parsers.groupingMultilingual : parsers.multilingual;
    const reverser = group ? reversers.groupingMultilingual : reversers.multilingual;

    parseType = parseType || multilingual.TYPE_DEFAULT || multilingual.CAMELCASE;

    const lang = languages || multilingual.AVAILABLE_LANGUAGES;
    const f = createParser(path, parser, path, valueParser, parseType, lang );
    f.reverse = createReverse(path, reverser, parseType, lang);
    return f;
}

export
function base64( path, valueParser ) {
    const f = createParser( path, parsers.base64, valueParser );
    f.reverse = createReverse(path, reversers.base64);
    return f;
}

export
function json( path, valueParser ) {
    const f = createParser( path, parsers.json, valueParser );
    f.reverse = createReverse(path, reversers.json);
    return f;
}

multilingual.TYPE_CAMELCASE = 'camelCase';
multilingual.TYPE_UNDERSCORE = 'underscore';

multilingual.AVAILABLE_LANGUAGES = [ 'en', 'nl', 'fr' ];