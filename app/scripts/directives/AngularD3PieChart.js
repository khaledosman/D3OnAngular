angular.module('Itonics', []) // Angular Module Name
     .directive('angulard3PieChart', function () { // Angular Directive
          return {
             restrict: 'A',
          scope: {
             datajson: '=',
             xaxisName: '=',
             xaxisPos: '=',
             yaxisName: '=',
             yaxisPos: '=',
             d3Format: '='
             // All the Angular Directive Vaiables used as d3.js parameters
       // properties are directly passed to `create` method
                       },
          link: function (scope, elem, attrs) {
                var ourGraph = new PieChart(scope.datajson);
                //d3 related Variable initialisation
                ourGraph.workOnElement('#'+elem[0].id); // Work on particular element
                ourGraph.generateGraph(); // generate the actual bar graph
         } 
     };
});