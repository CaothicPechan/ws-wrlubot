/**
 * Copyright 2017, Google, Inc.
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *    http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

/**
 * @fileoverview Utilities for converting between JSON and goog.protobuf.Struct
 * proto.
 */

'use strict';

var _JSON_SIMPLE_TYPE_TO_;

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

function jsonToStructProto(json) {
  var fields = {};
  for (var k in json) {
    fields[k] = jsonValueToProto(json[k]);
  }

  return { fields: fields };
}

var JSON_SIMPLE_TYPE_TO_PROTO_KIND_MAP = (_JSON_SIMPLE_TYPE_TO_ = {}, _defineProperty(_JSON_SIMPLE_TYPE_TO_, _typeof(0), 'numberValue'), _defineProperty(_JSON_SIMPLE_TYPE_TO_, _typeof(''), 'stringValue'), _defineProperty(_JSON_SIMPLE_TYPE_TO_, _typeof(false), 'boolValue'), _JSON_SIMPLE_TYPE_TO_);

var JSON_SIMPLE_VALUE_KINDS = new Set(['numberValue', 'stringValue', 'boolValue']);

function jsonValueToProto(value) {
  var valueProto = {};

  if (value === null) {
    valueProto.kind = 'nullValue';
    valueProto.nullValue = 'NULL_VALUE';
  } else if (value instanceof Array) {
    valueProto.kind = 'listValue';
    valueProto.listValue = { values: value.map(jsonValueToProto) };
  } else if ((typeof value === 'undefined' ? 'undefined' : _typeof(value)) === 'object') {
    valueProto.kind = 'structValue';
    valueProto.structValue = jsonToStructProto(value);
  } else if ((typeof value === 'undefined' ? 'undefined' : _typeof(value)) in JSON_SIMPLE_TYPE_TO_PROTO_KIND_MAP) {
    var kind = JSON_SIMPLE_TYPE_TO_PROTO_KIND_MAP[typeof value === 'undefined' ? 'undefined' : _typeof(value)];
    valueProto.kind = kind;
    valueProto[kind] = value;
  } else {
    console.warn('Unsupported value type ', typeof value === 'undefined' ? 'undefined' : _typeof(value));
  }
  return valueProto;
}

function structProtoToJson(proto) {
  if (!proto || !proto.fields) {
    return {};
  }
  var json = {};
  for (var k in proto.fields) {
    json[k] = valueProtoToJson(proto.fields[k]);
  }
  return json;
}

function valueProtoToJson(proto) {
  if (!proto || !proto.kind) {
    return null;
  }

  if (JSON_SIMPLE_VALUE_KINDS.has(proto.kind)) {
    return proto[proto.kind];
  } else if (proto.kind === 'nullValue') {
    return null;
  } else if (proto.kind === 'listValue') {
    if (!proto.listValue || !proto.listValue.values) {
      console.warn('Invalid JSON list value proto: ', JSON.stringify(proto));
    }
    return proto.listValue.values.map(valueProtoToJson);
  } else if (proto.kind === 'structValue') {
    return structProtoToJson(proto.structValue);
  } else {
    console.warn('Unsupported JSON value proto kind: ', proto.kind);
    return null;
  }
}

module.exports = {
  jsonToStructProto: jsonToStructProto,
  structProtoToJson: structProtoToJson
};
//# sourceMappingURL=structjson.js.map