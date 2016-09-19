// CodeMirror, copyright (c) by Marijn Haverbeke and others
// Distributed under an MIT license: http://codemirror.net/LICENSE

import { off, on } from "../util/event";
import { e_preventDefault, e_stop, e_stopPropagation } from "../util/event";
import { keyMap, keyName, isModifierKey, lookupKey, normalizeKeyMap } from "../input/keymap";
import { addClass, contains, rmClass } from "../util/dom";
import { keyNames } from "../input/keynames";
import StringStream from "../util/StringStream";
import { wheelEventPixels } from "../display/scroll_events";
import Doc from "../model/Doc";
import { splitLinesAuto } from "../util/feature_detection";
import { countColumn, findColumn, isWordCharBasic, Pass } from "../util/misc";
import { signal } from "../util/event";
import { Line } from "../line/line_data";
import { changeEnd } from "../model/change_measurement";
import { commands } from "./commands";
import { scrollbarModel } from "../display/scrollbars";
import { cmp, Pos } from "../line/pos";
import { extendMode, getMode, mimeModes, modeExtensions, modes, resolveMode } from "../modes";
import { copyState, innerMode, startState } from "../modes";
import { LineWidget } from "../model/line_widget";
import { SharedTextMarker, TextMarker } from "../model/mark_text";

export function addLegacyProps(CodeMirror) {
  CodeMirror.off = off;
  CodeMirror.on = on;
  CodeMirror.wheelEventPixels = wheelEventPixels;
  CodeMirror.Doc = Doc;
  CodeMirror.splitLines = splitLinesAuto;
  CodeMirror.countColumn = countColumn;
  CodeMirror.findColumn = findColumn;
  CodeMirror.isWordChar = isWordCharBasic;
  CodeMirror.Pass = Pass;
  CodeMirror.signal = signal;
  CodeMirror.Line = Line;
  CodeMirror.changeEnd = changeEnd;
  CodeMirror.scrollbarModel = scrollbarModel;
  CodeMirror.Pos = Pos;
  CodeMirror.cmpPos = cmp;
  CodeMirror.modes = modes;
  CodeMirror.mimeModes = mimeModes;
  CodeMirror.resolveMode = resolveMode;
  CodeMirror.getMode = getMode;
  CodeMirror.modeExtensions = modeExtensions;
  CodeMirror.extendMode = extendMode;
  CodeMirror.copyState = copyState;
  CodeMirror.startState = startState;
  CodeMirror.innerMode = innerMode;
  CodeMirror.commands = commands;
  CodeMirror.keyMap = keyMap;
  CodeMirror.keyName = keyName;
  CodeMirror.isModifierKey = isModifierKey;
  CodeMirror.lookupKey = lookupKey;
  CodeMirror.normalizeKeyMap = normalizeKeyMap;
  CodeMirror.StringStream = StringStream;
  CodeMirror.SharedTextMarker = SharedTextMarker;
  CodeMirror.TextMarker = TextMarker;
  CodeMirror.LineWidget = LineWidget;
  CodeMirror.e_preventDefault = e_preventDefault;
  CodeMirror.e_stopPropagation = e_stopPropagation;
  CodeMirror.e_stop = e_stop;
  CodeMirror.addClass = addClass;
  CodeMirror.contains = contains;
  CodeMirror.rmClass = rmClass;
  CodeMirror.keyNames = keyNames;
}
