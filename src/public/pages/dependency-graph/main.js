$(document).ready(function ($) {
  let globalVarName = document.getElementById('global_var_name')
  let stringDot = document.getElementById('string-dot')
  let buttonGenGraph = document.getElementById('button-gen-graph')

  if (stringDot.value.length > 0) {
    d3.select("#graph").graphviz()
      .renderDot(stringDot.value);
  }

  buttonGenGraph.addEventListener('click', () => {
    document.location.href = `/insights/dependency-graph/view/graph?global_var_name=${globalVarName.value}`;
  })

  globalVarName.addEventListener('keyup', (e) => {
    if (e.code === 'Enter' || e.code === 'NumpadEnter') {
      document.location.href = `/insights/dependency-graph/view/graph?global_var_name=${globalVarName.value}`;
    }
  })
});