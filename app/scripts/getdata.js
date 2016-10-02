var ruleData;
var headingData;
function getData(callback) {
  if(ruleData) {
    callback(ruleData);
  }
  else {
    loadData(callback);
  }
}
function getHeadingData(callback) {
  getData(function(data) {
    if(!headingData) {
      var heading = createHeadingData(data);
      updateHeadingData(heading);
      callback(heading);
    }
    else {
      callback(headingData);
    }
  });
}
function loadData (callback) {
  $.getJSON("scripts/data.json", function(json){
    updateRuleData(json);
    callback(json);
  });
}
function updateRuleData(data) {
  ruleData = data;
}
function updateHeadingData(data) {
  headingData = data;
}
function createHeadingData(data) {
  var heading = [];
  for(var i = 0; i < data.length; i++) {
    if(data[i].heading) {
      heading.push(data[i]);
    }
  }
  return heading;
}