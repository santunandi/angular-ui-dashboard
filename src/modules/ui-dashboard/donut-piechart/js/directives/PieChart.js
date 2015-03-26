angular.module('ui.dashboard.DonutApp').directive('pieChart',['ui.dashboard.PieChartConfiguration','ui.dashboard.ArcService','ui.dashboard.PieService',function(PieChartConfiguration,ArcService,PieService){
	return {
		restrict: 'E',
		scope: {
			configuration: '=',
			data: '='
		},
		link: function($scope,element,attrs){
			$scope.configuration = new PieChartConfiguration($scope.configuration || {});

			$scope.previousData = [];
			angular.forEach($scope.data,function(){
				$scope.previousData.push(0);
			});

			$scope.draw = function(data){			
				var paths = $scope.widget.select('.donut-container').selectAll('path');

				var arc = ArcService.d3Arc($scope.configuration.radius, $scope.configuration.strokeWidth);
				var arcOver = ArcService.d3Arc($scope.configuration.radius + $scope.configuration.slice.hover.growBy, $scope.configuration.strokeWidth + $scope.configuration.slice.hover.growBy);

				var pie = ArcService.d3Pie($scope.configuration.amplitude,$scope.configuration.padAngle, $scope.configuration.sort);

				var previousPie = pie($scope.previousData);
				
				if($scope.configuration.legend.display){
					PieService.drawLabels($scope.widget, pie(data), $scope.configuration);
				}
				
				paths.data(pie(data),function(d,i){ return d+Math.random()/10000; })
                	.enter()
                        .append('path')
                            .attr('fill',function(d,i){
                            	return $scope.configuration.getColor(i);
                            	})
                            .attr('stroke',$scope.configuration.slice.border.color)
                            .attr('stroke-width',($scope.configuration.slice.border.display ? $scope.configuration.slice.border.width:0))
                            .attr('opacity',$scope.configuration.opacity)
                            .on('mouseover', function(d) {
				                if($scope.configuration.slice.hover.apply){
				                	$scope.configuration.slice.hover.callback(d);
					                d3.select(this).transition()
					                    .duration(200)
					                    .attr("d", arcOver);
				                }
				            })
				            .on('mouseout', function(d) {
				            	if($scope.configuration.slice.hover.apply){
					                d3.select(this).transition()
					                    .duration(200)
					                    .attr("d", arc);
					            }
				            })
				            .on('click',$scope.configuration.slice.click)
                            .attr('transform', 
                            	ArcService.computeRotation(
	                            	$scope.configuration.startAngle,
	                            	$scope.configuration.width,
	                            	$scope.configuration.height
                            	) + ' ' + 
                            	ArcService.translate(
	                            	$scope.configuration.width,
                    				$scope.configuration.height
	                            ))
                            .transition()
                                .attrTween('d',function(d,i){
                                    var interpolate = d3.interpolate({startAngle:previousPie[i].startAngle, endAngle:previousPie[i].endAngle}, d);
									return function(t) {
										return arc(interpolate(t));
									}
                                })
                                .duration($scope.configuration.transitions.arc)
                                .each("end",function(){
                                	$scope.previousData = angular.copy(data);
                                });				
                paths.remove();                
			};			

			$scope._sumData = function(data){				
				return $scope._sumDataBefore(data,data.length);
			};

			$scope._sumDataBefore = function(data,index){
				var sum = 0;
				angular.forEach(data,function(d,i){
					if(i < index){
						sum += d;
					}
				});
				return sum;
			};

			$scope.init = function(){
				$scope.widget = d3.select(element[0]);
				$scope.widget.selectAll('*').remove();

				$scope.widget = $scope.widget.append('svg')
					.attr('id',$scope.configuration.id)
					.attr('width',$scope.configuration.width)
					.attr('height',$scope.configuration.height);								
				
				if($scope.configuration.title.display){
	            	//Setting title
	            	$scope.widget.append('g')
	            		.attr('class','pie-title')
	            		.append('text')
	            			.text($scope.configuration.title.value)
	            			.attr('x',$scope.configuration.width/2)
	            			.attr('y',$scope.configuration.height+$scope.configuration.title.fontsize)
	            			.attr('opacity',$scope.configuration.title.opacity)
	            			.attr('font-size',$scope.configuration.title.fontsize+'px')
	            			.attr('fill',$scope.configuration.title.color)
	            			.style('text-anchor','middle');

	            }
	            if($scope.configuration.border.display){
	                //Setting border
	                $scope.widget.append('g')
                        .append('path')
                            .attr('d',ArcService.computeArc(
	                        	0,
	                        	$scope.configuration.amplitude,
	                        	1,
	                        	1,
	                        	$scope.configuration.width,
	                        	$scope.configuration.height,
	                        	$scope.configuration.radius + $scope.configuration.strokeWidth/2 + $scope.configuration.border.strokeWidth/2
	                        	))
                            .attr('opacity',$scope.configuration.border.opacity)
                            .attr('fill','none')
                            .attr('transform', ArcService.computeRotation(
                            	$scope.configuration.startAngle,
                            	$scope.configuration.width,
                            	$scope.configuration.height
                            	))
                            .attr('stroke',$scope.configuration.border.color)
                            .attr('stroke-width',$scope.configuration.border.strokeWidth);
	            }
	            //Main widget content
                $scope.widget.append('g')
                   	.attr('class','donut-container');  

                $scope.widget.append('g')
  					.attr("class", "label-group")
  					.attr("transform", ArcService.translate(
                    	$scope.configuration.width,
                    	$scope.configuration.height
                    ));             
			}

			$scope.init();

	        $scope.$watch('configuration',function(newVal,oldVal){
	        	$scope.configuration.update(newVal);
	        	return $scope.init();
	        });
            $scope.$watch('data', function(newVals, oldVals) {
				return $scope.draw(newVals);
			});
		}
	}
}]);