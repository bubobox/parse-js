'use strict';

import _ from 'lodash';
import { Base64 } from 'js-base64';
import { ucfirst, lcfirst, trim, isBase64 } from './utils';
import { parse } from './parse.js';

const CAMELCASE = 'camelCase';
const prefixUnderscore = ( x => '_' + x );

/**
 * Ensures result is a number
 */
export
function number(value, NaNValue = 0) {
    // regex: match all dots and commas but the last one and remove
    const norm = _.isString(value) ? value.replace(/(,|\.)(?=[^,.]*(\,|\.))/g, '').replace(',', '.') : value;
    const num = parseFloat(norm);
    return isNaN(num) ? NaNValue : num;
}
number.requiresScalarInput = true;

/**
 * Ensures result is a string
 */
export
function string(value) {
    return ( _.isUndefined(value) || value === null ) ? '' : ('' + value);
}
string.requiresScalarInput = true;

/**
 * Ensures result is a boolean
 */
export
function boolean(value, defaultValue) {
    if( _.isUndefined(value) && !_.isUndefined(defaultValue) )
        return defaultValue;

    return typeof value === 'string' ?
        _.contains(['1', 'true', 'yes'], value) :
        !!value;
}
boolean.requiresScalarInput = true;

/**
 * Ensures result is a date
 */
export
function date(value, nowOnInvalid = false ) {
    const now = nowOnInvalid ? new Date() : undefined;

    if( !value )
        return now;

    const parsedDate = new Date(value);
    if( parsedDate.toString() == 'Invalid Date' )
        return now;

    return parsedDate;
}
date.requiresScalarInput = true;

/**
 * Ensures result is an array
 *
 * Converts comma separated lists to an array.
 * Detects JSON arrays and decodes them
 */
export
function array(value, valueParser ) {
    let result = [];
    let validJson = true;

    try {
        result = JSON.parse(value);
    } catch (e) {
        validJson = false;
    }

    // value was valid JSON, but not an array
    if( validJson && !_.isArray(result) )
        result = [];

    // Don't parse value as a string when it was valid JSON.
    if( !validJson && _.isString(value) && trim(value).length )
        result = value.split(','); // this will always produce an array.

    if (_.isFunction(valueParser))
        result = result.map((v, k) => parse(`[${k}]`, valueParser, result));

    return result;
}
array.requiresScalarInput = true;

/**
 * Return true if value equals the target value
 */
export
function equals(value, shouldEqual) {
    return ( value == shouldEqual );
}

/**
 * Group key with language suffixes ( testNl, testFr ) into a single object ( { nl: , fr: }).
 */
export
function multilingual(data, path, valueParser = (x => x), parseType = CAMELCASE, languages = [] ) {
    const languageTransform = ( parseType == CAMELCASE ) ? ucfirst : prefixUnderscore;
    const parser = (...args) => _.isUndefined(args[0]) ? undefined : valueParser(...args);
    const prefix = /[^\.]+$/.exec(path)[0];

    const values = {};
    languages.forEach((lang) => {
        const key = prefix + languageTransform(lang);
        const value = parse(key, parser, data);

        if( !_.isUndefined(value) )
            values[lang] = value;
    });
    return values;
}
multilingual.nestsResult = true;

/**
 * Group keys that have language suffixes as their respective prefix.
 * { testNl, testFr, abc, valueEn, valueFr } becomes { test: { nl: , fr: }, abc: , value: { en: , fr: } }
 */
export
function groupingMultilingual(data, path, valueParser = (x => x), parseType = CAMELCASE, languages = [] ) {
    const languageTransform = ( parseType == CAMELCASE ) ? ucfirst : prefixUnderscore;
    const regex = new RegExp('([^\\.]+)(' + languages.map(languageTransform).join('|') + ')$');
    const multilingualKeys = _(data)
        .keys()
        .map(key => regex.test(key) ? regex.exec(key)[1] : null)
        .unique()
        .filter()
        .value();
    const regularKeys = _(data)
        .keys(data)
        .map(key => regex.test(key) ? null : key)
        .filter()
        .value();

    const values = _.transform(multilingualKeys, ( r, k ) => {
        r[k] = multilingual(data, k, valueParser, parseType, languages);
    }, {});

    // attach regular keys to values object
    _.transform(regularKeys, (r, k) => { r[k] = data[k]; }, values);

    return values;
}
multilingual.nestsResult = true;

/**
 * Only select keys that have a match with `match`.
 * If `match` is a string this will be interpreted as `contains match`.
 * If `match` is a regex we will include the key whenever `regex.test` returns true.
 */
export
function matchKey(value, match ) {
    const result = {};
    const regex = _.isString(match) ? new RegExp(match) : match;

    for( const key in value ) {
        if( regex.test(key) )
            result[key] = value[key];
    }

    return result;
}

/**
 * Matches a specific prefix and then strips the prefix from the key.
 */
export
function matchPrefixStrip(value, match ) {
    const regex = new RegExp('^' + match);
    const matched = matchKey(value, regex);
    const result = {};

    for( const key in matched ) {
        const newKey = lcfirst(key.replace(regex, ''));
        result[newKey] = matched[key];
    }

    return result;
}

/**
 * Decodes the result from base64
 *
 * Detects Base64 strings and decodes them
 */
export
function base64(value) {
    if(isBase64(value))
        value = Base64.decode(value);

    return value;
}
base64.requiresScalarInput = true;

/**
 * Parses JSON strings
 */
export
function json(value) {
    try {
        return JSON.parse(value);
    } catch (e) {
        return undefined;
    }
}
json.requiresScalarInput = true;