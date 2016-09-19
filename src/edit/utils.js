// CodeMirror, copyright (c) by Marijn Haverbeke and others
// Distributed under an MIT license: http://codemirror.net/LICENSE

import { clearCaches } from "../measurement/position_measurement";

export function themeChanged(cm) {
  cm.display.wrapper.className = cm.display.wrapper.className.replace(/\s*cm-s-\S+/g, "") +
    cm.options.theme.replace(/(^|\s)\s*/g, " cm-s-");
  clearCaches(cm);
}
