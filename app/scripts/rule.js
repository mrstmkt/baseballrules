var searchTimeoutId = null;
function start() {
  showLoading();
  
  $(window).on('popstate', function(jqevent) {
    var state = jqevent.originalEvent.state;
    if (state) {
      if(state.mode ==="heading") {
        searchHeadingRule(state.option.level, state.option.keys);    
      }
      else if(state.mode ==="key") {
        searchRuleByKey(state.option.keys);    
      }
      else if(state.mode ==="search") {
        show('#search');
      }
    }
  });
  

  $('#navindex').click(function(e) {
    e.preventDefault();
    showLoading();
    pushHeadingState(1, []);  
    searchHeadingRule(1, []);
  });
  $('#navsearch').click(function(e) {
    e.preventDefault();
    pushSearchState();
    show('#search');
  });
  $('#searchButton').click(function(e) {
    e.preventDefault();
    var word = $('#searchWord').val();
    if(word.length > 0) {
      if(searchTimeoutId) {
        clearTimeout(searchTimeoutId);
        searchTimeoutId = null;
      }
      showLoading();
      getData(function (data) {
        var word = $('#searchWord').val();
        var resultObj = searchKeysListByhWord(data, word, 100);
        show('#search');
        updateResult(resultObj);
      }); 
    }
  });
  
  $('#searchWord').on('keydown', function(e) {
    if ((e.which && e.which === 13) || (e.keyCode && e.keyCode === 13)) {
      $('#searchButton').click();
    } 
    else {
      delaySearch();
    }
  });
  
  var keys = [];
  var href = window.location.href;
  var q = href.split('?');
  if(q.length > 1) {
    var query = q[1].split('=');
    if(query.length > 1) {
      keys = keyStrToKeys(decodeURI(query[1]));
    }
  }
  getData(function(data) {
    if(data.length > 0 && data[0].level === 0 && data[0].text.length > 0) {
      updateTitle(data[0].text);
    }
    
    if(keys.length > 0) {
      pushKeyState(keys);
      searchRuleByKey(keys);
      
    }
    else {
      pushHeadingState(1, []);  
      searchHeadingRule(1, []);
    }
    
  });
}
function delaySearch() {
  if(searchTimeoutId) {
    clearTimeout(searchTimeoutId);
    searchTimeoutId = null;
  }
  searchTimeoutId = setTimeout(function() {
      searchTimeoutId = null;
      $('#searchButton').click();
  }, 2000);
}
function findData(data, checkFunc, num) {
  var ret = [];
  var n = 0;
  for(var i = 0; i < data.length; i++) {
    if(num && n >= num) {
      break;
    }
    if(!num || num < 0 || n < num) {
      if( checkFunc(data[i]) ) {
        ret.push(data[i]);
        n++;
      }
    }
  }
  return ret;  
}
function findHeadingText(headingData, level, keys) {
  var result = findData(headingData,function(d) {
    var key1 = keysToKeyStr(d.keys);
    var key2 = keysToKeyStr(keys);
    if(d.level == level
      && key1 === key2) {
      return true;
    } 
    else {
      return false;
    }
  }, 1);
  if(result && result.length == 1) {
    return result[0].text;
  }
  else {
    return '';
  }
}
function keysToKeyStr(keys) {
  var ret = '';
  for(var i = 0; i < keys.length; i++) {
    if(ret.length !== 0) {
      ret = ret + '-';
    }
    if(keys[i].length < 10) {
      ret = ret + ('__________' + keys[i]).slice(-10);
    }
    else {
      ret = ret + keys[i];
    }
  }
  return ret;
}
function keysToKeyStrForLink(keys) {
  var ret = '';
  for(var i = 0; i < keys.length; i++) {
    if(ret.length !== 0) {
      ret = ret + '-';
    }
    ret = ret + keys[i];
  }
  return ret;
}
function keyStrToKeys(keyStr) {
  var ret = [];
  var sp = keyStr.split('-');
  for(var i = 0; i < sp.length; i++) {
    ret.push(sp[i].replace(/_/g, ''));
  }
  
  return ret;
}
function searchKeysListByhWord(data, word, num) {
  var retObj = {};
  var keyList = [];
  var wordList = [];
  var over = false;
  for(var i = 0; i < data.length; i++) {
    if(num && keyList.length >= num) {
      over = true;
      break;
    }
    var key = keysToKeyStr(data[i].keys);
    var found = data[i].text.match(new RegExp('(.{0,21})(' + word+ ')(.{0,21})'));
    if( found && found.length > 1  ) {
      keyList.push(key);
      if(found[1].length >=21) {
        found[1] = '...' + found[1].substring(1, found[1].length);
      }
      if(found[3].length >=21) {
        found[3] = found[3].substring(0, found[3].length - 1) + '...';
      }
      wordList.push(found.slice(1, found.length).join(''));
    }
  }
  retObj['keyList'] = keyList;
  retObj['count'] = keyList.length + '' + ( over? '+': '');
  retObj['wordList'] = wordList;
  return retObj;  
}

function updateTitle(title) {
  $('#logo').html(title);
}

function updateIndexPage(data, keys) {
  $('#indexes').empty();
  getHeadingData(function(headingData) {
    var h = createIndexHeader(keys, headingData);
    $('#indexes').append(h);
    for(var i = 0; i < data.length; i++) {
      //
      var p = createIndexParagraph(data[i]);
      if(p) {
        $('#indexes').append(p);
      }
    }  
    show('#indexes');
  });
}
function searchHeadingRule(level, keys) {
  getHeadingData(function (data) {
    var ruleData = findData(data, function(d) {
      var key1 = keysToKeyStr(d.keys);
      var key2 = keysToKeyStr(keys);
      if(d.level == level
        && key1.length >= key2.length
        && key1.substring(0, key2.length) == key2) {
        return true;
      } 
      else {
        return false;
      }
    });
    if(ruleData && ruleData.length > 0) {
      updateIndexPage(ruleData, keys);
    }
    else {
      searchRuleByKey(keys);
    }
  });
}
function searchRuleByKey(keys) {
  getData(function(data) {
    var ruleData = findData(data, function(d) {
      var key1 = keysToKeyStr(d.keys);
      var key2 = keysToKeyStr(keys);
      if(key1.length >= key2.length 
        && key1.substring(0, key2.length) == key2) {
        return true;
      }
      else {
        return false;
      }
    });
    updateRulePage(ruleData);
  });
}
function updateRulePage(data) {
  $('#rules').empty();
  if(data.length > 0) {
    var crumbs = createBreadCrumbs(data[0].keys);
    $('#rules').append(crumbs);
  }
  for(var i = 0; i < data.length; i++) {
    //
    var p = createRuleParagraph(data[i]);
    if(p) {
      $('#rules').append(p);
    }
  }  
  if(data.length > 0) {
    var share = createShareArea(data[0].keys);
    $('#rules').append(share);
  }

  show('#rules');
}
function updateResult(resultObj) {
  $('#searchResult').empty();
  getHeadingData(function(headingData) {
    for(var i = 0; i < resultObj.keyList.length; i++) {
      var r = createResult(resultObj.keyList[i], resultObj.wordList[i], headingData);
      $('#searchResult').append(r);
    }
    show('#search');
  });
}
function createIndexParagraph(d) {
  if(d.text && d.text.length > 0) {
    var a = $('<a></a>').append(d.text);
    a.attr('href', '#'+ keysToKeyStr(d.keys));
    a.attr('data-keys', keysToKeyStr(d.keys));
    a.attr('data-level', d.level);
    a.click(function(e) {
      e.preventDefault();
      var keys = keyStrToKeys($(this).attr('data-keys'));
      var level = parseInt($(this).attr('data-level'), 10) + 1;
      showLoading();
      pushHeadingState(level, keys);  
      searchHeadingRule(level, keys);
    });
    var hn = 'h' + (d.level + 2);
    var h = $('<' + hn + '></' + hn+ '>').append(a);
    h.addClass('rule-level' + d.level);
    return h;
  }
  else {
    return null;
  }
}
function createIndexHeader(keys, headingData) {
  var div = $('<div></div>');

  if(keys.length > 0) {
    var indexA = $('<a href="#ignore-click">目次</a>');
    indexA.click(function(e) {
      e.preventDefault();
      showLoading();
      pushHeadingState(1, []);  
      searchHeadingRule(1, []);
    });
    div.append(indexA);
  }

  var clickFunc = function(e) {
      e.preventDefault();
      var keys = keyStrToKeys($(this).attr('data-keys'));
      var level = parseInt($(this).attr('data-level')) + 1;
      pushHeadingState(level, keys);  
      searchHeadingRule(level, keys);
    };
  for(var i = 0; i < keys.length; i++) {
    var level = i + 1;
    var ht = findHeadingText(headingData, level, keys.slice(0, i + 1));
    if(ht.length === 0) {
      ht = keys[i];
    }
    var a = $('<a></a>');
    a.attr('href', '#' + keysToKeyStr(keys.slice(0, i + 1 )));
    a.append(ht);
    a.attr('data-keys', keysToKeyStr(keys.slice(0, i + 1 )));
    a.attr('data-level', level);
    a.click(clickFunc);
    
    var hn = 'h' + (level + 2);
    var h = $('<' + hn + '></' + hn+ '>').append(a);
    h.addClass('rule-level' + level);
    div.append(h);
  }

  return div;  
}
function createRuleParagraph(d) {
  if(d.text && d.text.length > 0) {
    var p = $('<p></p>');
    p.html(createText(d.text));
    p.addClass('rule-level' + d.level);
    p.find('a').click(function(e) {
      e.preventDefault();
      var keys = keyStrToKeys($(this).attr('data-keys'));
      var level = parseInt($(this).attr('data-level')) + 1;
      showLoading();
      pushKeyState(keys);
      searchRuleByKey(keys);
    });
    if(d.listStart === false) {
      p.addClass('normal-paragraph');
    }
    return p;
  }
  else {
    return null;
  }
}
function createBreadCrumbs(keys) {
  var div = $('<div></div>');
  var p = $('<p></p>');
  div.append(p);
  
  var indexA = $('<a href="#ignore-click">目次</a>');
  indexA.click(function(e) {
    e.preventDefault();
    pushHeadingState(1, []);  
    searchHeadingRule(1, []);
  });
  p.append(indexA);
  var clickFunc = function(e) {
      e.preventDefault();
      var keys = keyStrToKeys($(this).attr('data-keys'));
      var level = parseInt($(this).attr('data-level')) + 1;
      showLoading();
      pushHeadingState(level, keys);  
      searchHeadingRule(level, keys);
    };
  for(var i = 0; i < keys.length; i++) {
    p.append(' / ');
    var a = $('<a></a>');
    a.attr('href', '#' + keysToKeyStr(keys.slice(0, i + 1 )));
    a.append(keys[i]);
    a.attr('data-keys', keysToKeyStr(keys.slice(0, i + 1 )));
    a.attr('data-level', i + 1);
    a.click(clickFunc);
    p.append(a);
  }
  return div;
}
function createShareArea(keys) {
  var div = $('<div class="share small"></div>');
  if(window.location.href.substring(0, 4) == "http") {
    div.append($('<span>リンクを共有:</span>'));
    var text = '公認野球規則 ';
    if(keys && keys.length > 0 && keys[0].match(/^\d+.00$/)) {
      text = text + keys.slice(1, keys.length).join(' ');
    }
    else {
      text = text + keys.join(' ');
    }
    var url = createLinkUrl(keys);
    var twitter = $('<a>Twitter</a>');
    twitter.attr('href','http://twitter.com/intent/tweet?url=' + encodeURIComponent(url) + '&text=' + encodeURIComponent(text));
    div.append(twitter);
    div.append($('<span> </span>'));
    
    var facebook = $('<a>facebook</a>');
    facebook.attr('href','https://www.facebook.com/sharer/sharer.php?u=' + encodeURIComponent(url));
    div.append(facebook);
    div.append($('<span> </span>'));
    
    var gp = $('<a>google+</a>');
    gp.attr('href','https://plus.google.com/share?url=' + encodeURIComponent(url));
    div.append(gp);
    div.append($('<span> </span>'));
    
    div.append($('<a target="_blank" href="' + url +'">'+ url + '</a>'));

  }
  return div;
}
function createLinkUrl(keys) {
  var url = window.location.protocol + '//' +  window.location.host +
    window.location.pathname + '?keys=' + encodeURI(keysToKeyStrForLink(keys));
  return url;  
}
function createResult(key, word, headingData) {
  var keys = keyStrToKeys(key);
  var aText = '';
  for(var i = 0; i < keys.length; i++) {
    if(aText.length > 0) {
      aText = aText + ' > ';
    }
    var level = i + 1;
    var ht = findHeadingText(headingData, level, keys.slice(0, i + 1));
    if(ht.length > 0) {
      aText = aText + ht;
    }
    else {
      aText = aText + keys[i];
    }
  }
  var a = $('<a></a>').append(aText);
  a.attr('href', '#' + key);
  a.attr('data-keys', key);
  a.click(function(e) {
    e.preventDefault();
    var keys = keyStrToKeys($(this).attr('data-keys'));
    showLoading();
    pushKeyState(keys);
    searchRuleByKey(keys);
  });
  var li1 = a.wrap('<li></li>');

  var li2 = $('<li></li>');
  li2.append(createText(word));
  li2.find('a').click(function(e) {
    e.preventDefault();
    var keys = keyStrToKeys($(this).attr('data-keys'));
    var level = parseInt($(this).attr('data-level')) + 1;
    showLoading();
    pushKeyState(keys);
    searchRuleByKey(keys);
  });
  var ol = $('<ol class="list-links list-links--secondary"></ol>');
  ol.append(li1);
  ol.append(li2);
  return ol;
}
function createText(text) {
  var ret = text;

  ret = ret.replace(/^(\S*ペナルティ) /, '<b>$1</b>');
  ret = createAnchorText(ret);

  var searchWord = $('#searchWord').val();
  if(searchWord.length > 0) {
    ret = replaceTagWord(ret, new RegExp(searchWord,'g'), '<span class="search-word">' + searchWord + '</span>');
  }
  return ret;
}
function replaceTagWord(contentsText, regExp, tagStr) {
  var ret = '';
  var tmp = $('<p></p>');
  tmp.html(contentsText);
  var contents = tmp.contents();
  
  var t;
  for(var i = 0; i < contents.length; i++) {
    if(contents[i].nodeType == 3) { //TextNode
      t = contents[i].nodeValue;
      t = t.replace(regExp, tagStr);
      ret = ret + t;
    }
    else {
      t = contents[i].innerHTML;
      t = t.replace(regExp, tagStr);
      contents[i].innerHTML = t;
      ret = ret + contents[i].outerHTML;
    }
  }

  return ret;
}
function createKeyAnchor(keys,text) {
  var a = $('<a></a>');
  var keyStr = keysToKeyStr(keys);
  a.attr('href', '#' + keyStr);
  a.append(text);
  a.attr('data-keys', keyStr);
  a.attr('data-level', keys.length - 1);
  return a;
}
function createAnchorText(text) {
  var ret = '';
  var p = 0;
  var tmp;
  var found;
  var a;
  var index;
  var keys;
  while(p < text.length) {
    tmp = text.substring(p, text.length);
    // found = tmp.match(/(\d+)(\.\d\d)\s*((([(]?[a-zA-Z]{1,2}[)]?)|([(]?[0-9]{1,2}[)]?))*)/);
    found = tmp.match(/((\d+)(\.\d\d)\s*((([(]?[a-zA-Z]{1,2}[)]?)|([(]?[0-9]{1,2}[)]?))*))|(定義(\d+))/);
    if(found) {
      if(found[1]) {
        if(found[1].match(/^\d+\.\d\d\s*$/) 
        && found[1] == text.substring(0, found[1].length)) {
          break;
        }
        
        index = tmp.indexOf(found[1]);
        
        if(tmp.substr(index + found[1].length, 4) === "メートル"
        || tmp.substr(index + found[1].length, 3) === "インチ") {
          ret = ret + tmp.substring(0, index) + found[1];
          p = p + index + found[1].length;
          continue;      
        }
        keys = [];
        if(found[3]  === '.00') {
          keys = keys.concat([found[2] + found[3]]);
        }
        else {
          keys = keys.concat([
            found[2] + '.00',
            found[2] + found[3],
          ]);
        }
        
        if(found[4] && found[4].match(/([(][a-zA-Z0-9]{1,2}[)])+/)) {
          var sp = found[4].split(/[() ]/);
          for(var i = 0; i < sp.length; i++) {
            if(sp[i] && sp[i].length > 0) {
              keys.push('(' + sp[i] + ')');
            }
          }
        }
        else {
          var f = found[4].match(/([a-zA-Z]{1,2})\s*([0-9]{1,2})*\s*([a-zA-Z]{1,2})*/);
          if(f) {
            if(f[1]) {
              keys.push('('+ f[1] +')');
            }
            if(f[2]) {
              keys.push('('+ f[2] +')');
            }
            if(f[3]) {
              keys.push('('+ f[3] +')');
            }
          }
        }
        
      }
      else {
        index = tmp.indexOf(found[8]);
        keys = [
          "本規則における用語の定義",
          found[9]
          ];
        
      }
      a = createKeyAnchor(keys, found[0]);
      ret = ret + tmp.substring(0, index) + a.get(0).outerHTML;
      p = p + index + found[0].length;
    }
    else {
      break;
    }
  }

  ret = ret + text.substring(p, text.length);
  return ret;
}
function pushHeadingState(level, keys) {
  var historyState = {
    "mode":"heading",
    "option" : {
      "keys": keys,
      "level": level
    }
  };
  pushState(historyState);
}
function pushKeyState(keys) {
  var historyState = {
    "mode":"key",
    "option" : {
      "keys": keys
    }
  };
  pushState(historyState);
}
function pushSearchState() {
  var historyState = {
    "mode":"search"
  };
  pushState(historyState);
}

function pushState(historyState) {
  if(window.history.pushState) {
    window.history.pushState(historyState,null);
  }
}
function showLoading() {
  $('#indexes').hide();
  $('#rules').hide();
  $('#search').hide();
  $('#loading').show();  
}
function show(id) {
  $('#indexes').hide();
  $('#rules').hide();
  $('#search').hide();
  $('#loading').hide();  
  $(id).show();  
  $('body').scrollTop(0);
}
