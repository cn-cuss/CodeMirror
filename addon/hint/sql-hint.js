// CodeMirror, copyright (c) by Marijn Haverbeke and others
// Distributed under an MIT license: http://codemirror.net/LICENSE

(function (mod) {
  if (typeof exports == "object" && typeof module == "object") // CommonJS
    mod(require("../../lib/codemirror"), require("../../mode/sql/sql"));
  else if (typeof define == "function" && define.amd) // AMD
    define(["../../lib/codemirror", "../../mode/sql/sql"], mod);
  else // Plain browser env
    mod(CodeMirror);
})(function (CodeMirror) {
  "use strict";

  var tables;
  var defaultTable;
  var keywords;
  var CONS = {
    QUERY_DIV: ";",
    ALIAS_KEYWORD: "AS"
  };
  var Pos = CodeMirror.Pos, cmpPos = CodeMirror.cmpPos;

  function isArray(val) {
    return Object.prototype.toString.call(val) == "[object Array]"
  }

  function getKeyMode(editor) {
    var mode = editor.doc.modeOption;
    if (mode === "sql") mode = "text/x-sql";
    //修改为获取关键字 hintTips
    return CodeMirror.resolveMode(mode);
  }

  function getText(item) {
    return typeof item == "string" ? item : item.text;
  }

  function wrapTable(name, value) {
    if (isArray(value)) value = {columns: value}
    if (!value.text) value.text = name
    return value
  }

  function parseTables(input) {
    var result = {}
    if (isArray(input)) {
      for (var i = input.length - 1; i >= 0; i--) {
        var item = input[i]
        result[getText(item).toUpperCase()] = wrapTable(getText(item), item)
      }
    } else if (input) {
      for (var name in input)
        result[name.toUpperCase()] = wrapTable(name, input[name])
    }
    return result
  }

  function getTable(name) {
    return tables[name.toUpperCase()]
  }

  function shallowClone(object) {
    var result = {};
    for (var key in object) if (object.hasOwnProperty(key))
      result[key] = object[key];
    return result;
  }

  function match(string, word) {
    var len = string.length;
    var sub = getText(word).substr(0, len);
    return string.toUpperCase() === sub.toUpperCase();
  }

  function addMatches(result, search, wordlist, formatter, type) {
    if (isArray(wordlist)) {
      for (var i = 0; i < wordlist.length; i++)
        if (match(search, wordlist[i])) result.push({key: formatter(wordlist[i]), type: type})
    } else {
      for (var word in wordlist) if (wordlist.hasOwnProperty(word)) {
        var val = wordlist[word]
        if (!val || val === true)
          val = word
        else
          val = val.displayText ? {text: val.text, displayText: val.displayText} : val.text
        if (match(search, val)) result.push({key: formatter(val), type: type})
      }
    }
  }

  function cleanName(name) {
    // Get rid name from backticks(`) and preceding dot(.)
    if (name.charAt(0) == ".") {
      name = name.substr(1);
    }
    return name.replace(/`/g, "");
  }

  function insertBackticks(name) {
    var nameParts = getText(name).split(".");
    for (var i = 0; i < nameParts.length; i++)
      nameParts[i] = "`" + nameParts[i] + "`";
    var escaped = nameParts.join(".");
    if (typeof name == "string") return escaped;
    name = shallowClone(name);
    name.text = escaped;
    return name;
  }

  function nameCompletion(cur, token, result, editor) {
    // Try to complete table, column names and return start position of completion
    var useBacktick = false;
    var nameParts = [];
    var start = token.start;
    var cont = true;
    while (cont) {
      cont = (token.string.charAt(0) == ".");
      useBacktick = useBacktick || (token.string.charAt(0) == "`");

      start = token.start;
      nameParts.unshift(cleanName(token.string));

      token = editor.getTokenAt(Pos(cur.line, token.start));
      if (token.string == ".") {
        cont = true;
        token = editor.getTokenAt(Pos(cur.line, token.start));
      }
    }

    // Try to complete table names
    var string = nameParts.join(".");
    addMatches(result, string, tables, function (w) {
      return useBacktick ? insertBackticks(w) : w;
    });

    // Try to complete columns from defaultTable
    addMatches(result, string, defaultTable, function (w) {
      return useBacktick ? insertBackticks(w) : w;
    });

    // Try to complete columns
    string = nameParts.pop();
    var table = nameParts.join(".");

    var alias = false;
    var aliasTable = table;
    // Check if table is available. If not, find table by Alias
    if (!getTable(table)) {
      var oldTable = table;
      table = findTableByAlias(table, editor);
      if (table !== oldTable) alias = true;
    }

    var columns = getTable(table);
    if (columns && columns.columns)
      columns = columns.columns;

    if (columns) {
      addMatches(result, string, columns, function (w) {
        var tableInsert = table;
        if (alias == true) tableInsert = aliasTable;
        if (typeof w == "string") {
          w = tableInsert + "." + w;
        } else {
          w = shallowClone(w);
          w.text = tableInsert + "." + w.text;
        }
        return useBacktick ? insertBackticks(w) : w;
      });
    }

    return start;
  }

  function eachWord(lineText, f) {
    if (!lineText) return;
    var excepted = /[,;]/g;
    var words = lineText.split(" ");
    for (var i = 0; i < words.length; i++) {
      f(words[i] ? words[i].replace(excepted, '') : '');
    }
  }

  function findTableByAlias(alias, editor) {
    var doc = editor.doc;
    var fullQuery = doc.getValue();
    var aliasUpperCase = alias.toUpperCase();
    var previousWord = "";
    var table = "";
    var separator = [];
    var validRange = {
      start: Pos(0, 0),
      end: Pos(editor.lastLine(), editor.getLineHandle(editor.lastLine()).length)
    };

    //add separator
    var indexOfSeparator = fullQuery.indexOf(CONS.QUERY_DIV);
    while (indexOfSeparator != -1) {
      separator.push(doc.posFromIndex(indexOfSeparator));
      indexOfSeparator = fullQuery.indexOf(CONS.QUERY_DIV, indexOfSeparator + 1);
    }
    separator.unshift(Pos(0, 0));
    separator.push(Pos(editor.lastLine(), editor.getLineHandle(editor.lastLine()).text.length));

    //find valid range
    var prevItem = null;
    var current = editor.getCursor()
    for (var i = 0; i < separator.length; i++) {
      if ((prevItem == null || cmpPos(current, prevItem) > 0) && cmpPos(current, separator[i]) <= 0) {
        validRange = {start: prevItem, end: separator[i]};
        break;
      }
      prevItem = separator[i];
    }

    var query = doc.getRange(validRange.start, validRange.end, false);

    for (var i = 0; i < query.length; i++) {
      var lineText = query[i];
      eachWord(lineText, function (word) {
        var wordUpperCase = word.toUpperCase();
        if (wordUpperCase === aliasUpperCase && getTable(previousWord))
          table = previousWord;
        if (wordUpperCase !== CONS.ALIAS_KEYWORD)
          previousWord = word;
      });
      if (table) break;
    }
    return table;
  }

  //sql  帮助类

  function extend(obj, src, dist) {
    for (var j in src) {
      obj[j + ''] = src[j + ''];
    }
    for (var j in dist) {
      obj[j] = dist[j];
    }
    return obj;
  }

  CodeMirror.registerHelper("hint", "sql", function (editor, options) {
    tables = parseTables(options && options.tables)
    var defaultTableName = options && options.defaultTable;
    var disableKeywords = options && options.disableKeywords;
    defaultTable = defaultTableName && getTable(defaultTableName);

    var model = getKeyMode(editor);
    keywords = model.keywords;

    var keys = extend({}, model.atoms, model.keys),
                                              funcs = model.functions,
                                              table = model.tables;
    keys = extend(keys, model.keywords);

    if (defaultTableName && !defaultTable)
      defaultTable = findTableByAlias(defaultTableName, editor);

    defaultTable = defaultTable || [];

    if (defaultTable.columns)
      defaultTable = defaultTable.columns;

    var cur = editor.getCursor();
    var result = [];
    var token = editor.getTokenAt(cur), start, end, search;
    if (token.end > cur.ch) {
      token.end = cur.ch;
      token.string = token.string.slice(0, cur.ch - token.start);
    }

    if (token.string.match(/^[.`\w@]\w*$/)) {
      search = token.string;
      start = token.start;
      end = token.end;
    } else {
      start = end = cur.ch;
      search = "";
    }
    if (search.charAt(0) == "." || search.charAt(0) == "`") {
      start = nameCompletion(cur, token, result, editor);
    } else {
      //判断前面的一个值是不是 from
      //1. from x
      //2.from x
      var val = editor.getValue();
      var frontKey = val.slice(val.length - search.length - 6 ,val.length - search.length).toUpperCase();
      var frontKey1 = val.slice(val.length - search.length - 5 ,val.length - search.length).toUpperCase();
      if ( frontKey == ' FROM '|| (cur.ch -  search.length  ===5 )&&frontKey1 == 'FROM '|| frontKey == '\nFROM ' ||  frontKey == '\rFROM ' || frontKey  == ' JOIN '|| (cur.ch -  search.length  ===5 )&& frontKey1 == 'JOIN '||  frontKey == '\rJOIN ' ||  frontKey == '\nJOIN ') {
        addMatches(result, search, table, function (w) {
          return w;
        }, 'Table');
      } else {
        addMatches(result, search, keys, function (w) {
          return w;
        }, 'Keywords');
        addMatches(result, search, funcs, function (w) {
          return w;
        }, 'Function');
      }

    }

    return {list: result, from: Pos(cur.line, start), to: Pos(cur.line, end)};
  });
});
