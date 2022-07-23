var chartIDNumber = 0, isMixedChart = false;
//*****************************************************//
//                  First Column
//*****************************************************//
function drawColumn(stockItemData, Title, Data)
{
	var parent = document.createElement("div");
	parent.className = "ptable";
	parent.innerHTML = "<div class='chartTitle'>" + Title + "</div>";
	handlerElement.appendChild(parent);
	
	var handler = document.createElement("div");
	handler.className = "tableHandler";
	var table = document.createElement("table");
	table.className = "table";
	var header = table.createTHead();
	var row = header.insertRow(0);
	for (var i = 0, j = Data[0].length; i < j; i++)
	{
		var head = document.createElement("th");
		head.innerText = Data[0][i];
		row.appendChild(head);
	}
	
	var body = table.createTBody(), startIndex = 1, defaultPrice = null;
	if (typeof(Data[1][0]) == "number")
	{
		defaultPrice = Data[1];
		startIndex = 2;
	}
	
	for (var i = startIndex, j = Data.length; i < j; i++)
	{
		var row = body.insertRow(i - startIndex);
		let cell = row.insertCell(0);
		cell.innerHTML = Data[i][0];
		
		if (Data[i].length > 2)
		{
			cell.setAttribute("title", Data[i][2]);
		}
		
		cell = row.insertCell(1);
		cell.innerText = Data[i][1];
		
		if (Data[i][0] == "حاشیه سود خالص")
			HOOKValueWithInput(cell, true);
		else if(Data[i][0].includes("EPS") && !Data[i][0].includes("Previous"))
			HOOKValueWithInput(cell, false);
	}
	
	handler.appendChild(table);
	
	var theInput = document.createElement("input");
	stockPriceInput = theInput;
	theInput.setAttribute("placeholder", "قیمت سهم");
	theInput.setAttribute("autocomplete", "off");
	theInput.oninput = function(event)
	{
		var theVal = parseInt(theInput.value.replaceAll(",", ""));
		
		if (!isNaN(theVal) && theVal > 0)
		{
			theInput.value = theVal.toString().split(/(?=(?:\d{3})+$)/).join(",");
			if (PonETimer != null)
				clearTimeout(PonETimer);
			
			PonETimer = setTimeout(function() {
				if (CalculatePE(theVal, false))
					localStorage.setItem(stockItemData["enSymbol"] + "price", JSON.stringify([theVal, Date.now()]));
			}, 500);
		}		
	};
	theInput.className = "form-control pInput";
	
	PonEElement = null;
	var lastPrice = localStorage.getItem(stockItemData["enSymbol"] + "price");
	if (lastPrice != null)
	{
		lastPrice = JSON.parse(lastPrice);
		if (defaultPrice != null && defaultPrice[1] > lastPrice[1])
			lastPrice = defaultPrice;
		
		theInput.value = lastPrice[0].toString().split(/(?=(?:\d{3})+$)/).join(",");
	}
	else if (defaultPrice != null)
	{
		lastPrice = defaultPrice;
		theInput.value = defaultPrice[0].toString().split(/(?=(?:\d{3})+$)/).join(",");
	}
	
	handler.appendChild(theInput);
	
	var button = document.createElement("button");
	button.className = "btn cbutton";
	button.innerText = "TSETMC";	
	var targetTsetmc = "http://www.tsetmc.com/Loader.aspx?ParTree=151311&i=" + stockItemData["tseCode"];
	button.onclick = function()
	{
		window.open(targetTsetmc, "_blank");
	};
	handler.appendChild(button);
	
	if (typeof(stockItemData["Rahavard"]) != "undefined")
	{
		button = document.createElement("button");
		button.className = "btn cbutton";
		button.innerText = "Rahavard 365";
		var targetRahavard = "https://rahavard365.com/asset/" + stockItemData["Rahavard"] + "/chart";
		button.onclick = function()
		{
			window.open(targetRahavard, "_blank");
		};
		handler.appendChild(button);
	}
	/*
	<input autocomplete="off" id="stockSymbol" insider="true" dir="rtl" lang="fa" type="text" class="form-control" oninput="searchStock(this)" placeholder="قیمت" style="
    display: block;
    margin: 0px 20px 20px;
    max-width: calc(100% - 40px);
    text-align: center;
">*/

	parent.appendChild(handler);
	
	if (lastPrice != null)
		CalculatePE(lastPrice[0], true);
}

//*****************************************************//
//                  MultiChart
//*****************************************************//
function ShowChartID(indexID, clickedItem)
{
	clickedItem = clickedItem || null;
	
	if (clickedItem != null)
		clickedItem.scrollIntoView({ behavior: "smooth", block: 'nearest', inline: 'center' });
	
	indexID++;
	var childrenList = chartsHandler.children, sliderChildren = chartsSlider.children;
	for(var i = 1, j = childrenList.length - 1; i < j; i++)
	{
		if (i != indexID)
		{
			childrenList[i].style.display = "none";
			sliderChildren[i - 1].style.backgroundColor = "";
		}
		else
		{
			if (clickedItem != null)
				childrenList[i].style.opacity = "0.1";
			childrenList[i].style.display = "block";
			
			let myID = i;
			setTimeout(function()
			{
				childrenList[myID].style.opacity = "1";
			}, 0);
			
			sliderChildren[i - 1].style.backgroundColor = "#0e6471";
		}
	}
}

function MultiChartDataView(dt, row)
{
	var cval = dt.getValue(row, 1), nval = dt.getValue(row, 2);
	if (nval != 0)
	{
		var showVar = Math.round(((cval - nval) / nval) * 100);
		if (showVar > 4 || showVar < -4)
		{
			return showVar.toString() + "%";
		}
		else
			return null;
	}
	else if(cval > 0)
	{
		return "100%";
	}
	else
	{
		return null;
	}
}
//*****************************************************//
//                  Draw Charts
//*****************************************************//
function getTimestamp()
{
	return Date.now();
}

function drawGraphicalChart(Type, Title, Data, rawData)
{
	if (Type == 1)
	{
		//rawData
		if ("ExtraData" in rawData)
			DrawMixedZingLineChart(Title, Data, rawData["ExtraData"]);
		else
		{
			isMixedChart = false;
			DrawZingLineChart(Title, Data, false, null, "100%");
		}
	}
	else if (Type == 0)
	{
		DrawPieBarChart(Title, Data);
	}
	else if (Type == 2 || Type == 3  || Type == 4)
	{
		DrawZingBarChart(Title, Data, Type);
	}
	else if (Type == 5)
	{
		var parent = document.createElement("div"), child = document.createElement("div");
		parent.className = "pchart";
		parent.innerHTML = "<div class='chartTitle'>" + Title + "</div>";
		parent.appendChild(child);
		handlerElement.appendChild(parent);
		
		var sliderElement = document.createElement("div");
		sliderElement.className = "slider";
		sliderElement.setAttribute("tabindex", "-1");
		chartsSlider = sliderElement; // global var
		child.style = "transition: opacity 1s";
		
		var customWidth = child.clientWidth;
		
		var start = getTimestamp();
		
		for (var i = 0, j = Data.length; i < j; i++) // data loop
		{
			DrawZingLineChart(Title, Data[i]["Chart"], true, child, customWidth); 		
			let slideItem = document.createElement("div");
			slideItem.className = "slideItem";
			slideItem.innerText = Data[i]["Title"];
			slideItem.onclick = function()
			{
				var index = Array.prototype.indexOf.call(slideItem.parentNode.children, slideItem);
				ShowChartID(index, slideItem);
			};
			sliderElement.appendChild(slideItem);
					
			if (i != (j - 1))
			{
				var oldWidth = child.clientWidth;
				child = document.createElement("div");
				child.style = "transition: opacity 1s; display: none";
				parent.appendChild(child);
			}	
		}
		
		/*
		
		demo1.addEventListener('click', function() {
  let output = zingchart.exec('demo-chart', 'hideplot', {
    'plotindex': 1,
    'toggle-action': 'remove' //toggleAction (CamelCase not supported here), only css style
  });
  zcdocs.demos.dump('hideplot', output);
});
 
demo2.addEventListener('click', function() {
  let output = zingchart.exec('demo-chart', 'showplot', {
    'plotindex': 1,
    'toggle-action': 'remove' //toggle-action must be the same for show
  });
  zcdocs.demos.dump('showplot', output);
});
		*/
		
		console.log("FINISHED, TOOK : " + (getTimestamp() - start));
		chartsHandler = parent;
		parent.style = "padding-bottom: 10px";
		parent.appendChild(sliderElement);
		
		setTimeout(function()
		{
			ShowChartID(0);
		}, 0);
	}
}

//*****************************************************//
//                  Initializer
//*****************************************************//
window.onload = function() {
    if (screen.width < 500) {
        var mvp = document.getElementById('vp');
        mvp.setAttribute('content','width=500');
    }
	chartLoaded = true;
	loadlastStock();
}

//*****************************************************//
//                  New Mixed Charts
//*****************************************************//
function DrawMixedZingLineChart(Title, Data, ExtraData)
{
	var parent = document.createElement("div"),
		child = document.createElement("div");
	
	parent.className = "pchart";
	parent.innerHTML = "<div class='chartTitle'>" + Title + "</div>";
	parent.style = "padding-bottom: 20px";		
	child.id = getnewChartID();	
	parent.appendChild(child);
	
	handlerElement.appendChild(parent);
	
	var myConfiguration = JSON.parse(JSON.stringify(zingMixedChart));
	
	var periods = [], titles = [], values = [];

	for (var i = 0, j = Data.length; i < j; i++)
	{
		if (i == 0)
		{			
			titles = GetColumns(Data[i], titles, 1);
		}
		else
		{
			var theData = GetColumns(Data[i], [], 0);
			periods.push(theData[0]);

			let oldValue = -1;
			for(let a = 1, b = theData.length; a < b; a++)
			{
				if (typeof(values[a - 1]) == 'undefined')
					values[a - 1] = [];
				
				values[a - 1].push(theData[a]);
			}
		}
	}
	
	myConfiguration["scale-x"].values = periods;
	
	var height = 350;
	
	if (ExtraData.length == 2)
	{
		isMixedChart = true;
		height = 410;
		
		var itemObject = JSON.parse(JSON.stringify(mixedchartBarItemObject));
		itemObject["background-color"] = "#009872";
		itemObject["values"] = ArrayABS(ExtraData[0], ExtraData[1]);
		itemObject["data-values"] = ExtraData[0];
		itemObject["text"] = "سهم تعداد فروش";
		console.log(itemObject);
		myConfiguration["series"].push(itemObject);	
		
		var itemObject = JSON.parse(JSON.stringify(mixedchartBarItemObject));
		itemObject["background-color"] = "#da534d";
		itemObject["values"] = ArrayABS(ExtraData[1], ExtraData[0]);
		itemObject["data-values"] = ExtraData[1];
		itemObject["text"] = "سهم نرخ فروش";
		myConfiguration["series"].push(itemObject);
	}
	else
	{
		isMixedChart = false;
	}
	
	for (var i = 0, j = values.length; i < j; i++)
	{
		let itemObject = JSON.parse(JSON.stringify(mixedchartLineItemObject));
		itemObject["values"] = values[i];
		itemObject["text"] = titles[i];
		
		itemObject["line-color"] = lineChartsColors[i][0];
		itemObject["marker"]["background-color"] = lineChartsColors[i][0];
		itemObject["highlight-marker"]["background-color"] = lineChartsColors[i][0];
		itemObject["highlight-marker"]["background-color"] = lineChartsColors[i][0];
		
		myConfiguration["series"].push(itemObject);
	}
	
	zingchart.render({
      id: child.id,
      data: myConfiguration,
	  height: height,
      width: '100%'
    });
}

//*****************************************************//
//                  New Line Chart
//*****************************************************//
var lineChartsColors =
[
	["#007790", "#69dbf1"],
	["#da534d", "#faa39f"],
	["#009872", "#69f2d0"]
];

function DrawZingLineChart(Title, Data, ShowPercentage, targetChildren, customWidth)
{
	if (targetChildren == null)
	{
		var parent = document.createElement("div"),
			child = document.createElement("div");
		
		parent.className = "pchart";
		parent.innerHTML = "<div class='chartTitle'>" + Title + "</div>";
		parent.style = "padding-bottom: 20px";		
		child.id = getnewChartID();	
		parent.appendChild(child);
		
		handlerElement.appendChild(parent);
	}
	else
	{
		child = targetChildren;
		child.id = getnewChartID();
	}
	
	var myConfiguration = JSON.parse(JSON.stringify(zingLineChart));
	
	var periods = [], titles = [], values = [], percentages = [];

	for (var i = 0, j = Data.length; i < j; i++)
	{
		if (i == 0)
		{			
			titles = GetColumns(Data[i], titles, 1);
		}
		else
		{
			var theData = GetColumns(Data[i], [], 0);
			periods.push(theData[0]);

			let oldValue = -1;
			for(let a = 1, b = theData.length; a < b; a++)
			{
				if (typeof(values[a - 1]) == 'undefined')
					values[a - 1] = [];
				
				if (oldValue == -1)
				{
					oldValue = theData[a];
				}
				else if (oldValue != null)
				{
					let percentageValue = 100;
					if (theData[a] != 0)
						percentageValue = ((oldValue - theData[a]) / theData[a]) * 100;
					else if (oldValue == 0) // both are zero
						percentageValue = 0;
					
					if (percentageValue < -80) // way too low, ignore
						percentageValue = 0;
					else if (percentageValue > 1000) // way too high, fix
						percentageValue = 100;
					
					if (percentageValue > 5 || percentageValue < -5)
						percentages.push(percentageValue.toFixed() + "%");
					else
						percentages.push(null);
					
					oldValue = null;
				}
				
				values[a - 1].push(theData[a]);
			}
		}
	}
	
	myConfiguration["scale-x"].values = periods;
	
	for (var i = 0, j = values.length; i < j; i++)
	{
		let itemObject = JSON.parse(JSON.stringify(linechartItemObject));
		itemObject["values"] = values[i];
		itemObject["text"] = titles[i];
		
		if (ShowPercentage && i == 0)
			itemObject["data-percentage"] = percentages;
		
		itemObject["line-color"] = lineChartsColors[i][0];
		itemObject["marker"]["background-color"] = lineChartsColors[i][0];
		itemObject["highlight-marker"]["background-color"] = lineChartsColors[i][0];
		itemObject["highlight-marker"]["background-color"] = lineChartsColors[i][0];
		
		myConfiguration["series"].push(itemObject);
	}
		
	zingchart.render({
      id: child.id,
      data: myConfiguration,
	  height: '350',
      width: customWidth
    });
	
	child.style.width = "";
}

//*****************************************************//
//                  New Bar Chart
//*****************************************************//
var barChartsColors =
[
	"#3366cc",
	"#dc3912"
];

function DrawZingBarChart(Title, Data, Type)
{
	var parent = document.createElement("div"),
		child = document.createElement("div");
	
	parent.className = "pchart";
	parent.innerHTML = "<div class='chartTitle'>" + Title + "</div>";
	parent.style = "padding-bottom: 20px";		
	child.id = getnewChartID();	
	parent.appendChild(child);
	
	handlerElement.appendChild(parent);

	
	var myConfiguration = JSON.parse(JSON.stringify(zingBarChart));
	
	var periods = [], titles = [], values = [], percentages = [];

	for (var i = 0, j = Data.length; i < j; i++)
	{
		if (i == 0)
		{			
			titles = GetColumns(Data[i], titles, 1);
		}
		else
		{
			var theData = GetColumns(Data[i], [], 0);
			periods.push(fixNumbers(theData[0]));

			let oldValue = 0;
			for(let a = 1, b = theData.length; a < b; a++)
			{
				if (typeof(values[a - 1]) == 'undefined')
					values[a - 1] = [];
				
				if (Type != 4) // 4 compares next one with the previous one
				{
					if (oldValue == 0)
					{
						oldValue = theData[a];
					}
					else if (oldValue != null)
					{
						let percentageValue = 100;
						if (theData[a] != 0)
							percentageValue = ((oldValue - theData[a]) / theData[a]) * 100;
						
						percentages.push(percentageValue.toFixed());
						
						oldValue = null;
					}
				}
				else
				{
					if (i == 1)
						percentages.push(null);
					else
					{
						let percentageValue = 100;
						if (values[a - 1][i - 2] != 0)
							percentageValue = ((theData[a] - values[a - 1][i - 2]) / values[a - 1][i - 2]) * 100;
						
						percentages.push(percentageValue.toFixed() + "%");
					}
				}

				values[a - 1].push(theData[a]);
			}
		}
	}
	
	myConfiguration["scaleX"].values = periods;
	
	for (var i = 0, j = values.length; i < j; i++)
	{
		let itemObject = JSON.parse(JSON.stringify(barchartItemObject));
		
		if (Type == 2 && j == 1) // Profit percentage
		{
			myConfiguration.plot.tooltip.text = "%kl<br>%v درصد";
			itemObject["rules"] = [ { "rule": "%v<0", "background-color": "#dc3912" } ];
		}
		else if(Type == 2)
		{
			myConfiguration.plot.tooltip.text = "%t<br>%v%";
		}
		else if (Type == 3 && i == 0) // Costs
		{
			myConfiguration.plot.tooltip.text = "%t<br>%data-percentage<br>%v";
			for (var a = 0, b = percentages.length; a < b; a++)
				if (percentages[a] != null)
					percentages[a] += "%";

			itemObject["data-percentage"] = percentages;
			itemObject.valueBox.text = "%data-percentage";
		}
		else if (Type == 3 && i > 0) // Costs
		{
			itemObject.valueBox = null;
			itemObject.tooltip = { text: "%t<br>%v" };
		}
		else if(Type == 4)
		{
			myConfiguration.plot.tooltip.text = "%t<br>%v";
			itemObject["data-percentage"] = percentages;
			itemObject["data-colors"] = ["#3366cc", "#3366cc", "#3366cc", "#3366cc", "#dc3912", "#dc3912", "#dc3912", "#dc3912"];
			itemObject["rules"] = [ { "rule": "%i>3", "background-color": "#dc3912" } ];
			itemObject.valueBox.text = "%data-percentage";
		}
		
		itemObject["values"] = values[i];
		itemObject["text"] = titles[i];
		
		itemObject["backgroundColor"] = barChartsColors[i];
		
		myConfiguration["series"].push(itemObject);
	}
	
	var height = 350;
	
	if (isMixedChart && Type == 2 && values.length == 1)
		height = 410;
	
	console.log(Type + " | " + height);
	zingchart.render({
      id: child.id,
      data: myConfiguration,
	  height: height,
      width: '100%'
    });
	
	child.style.width = "";
}

//*****************************************************//
//                  New Pie Chart
//*****************************************************//
function DrawPieBarChart(Title, Data)
{
	var parent = document.createElement("div"),
		child = document.createElement("div");
	
	parent.className = "pchart";
	parent.innerHTML = "<div class='chartTitle'>" + Title + "</div>";
	parent.style = "padding-bottom: 20px";		
	child.id = getnewChartID();

	parent.appendChild(child);
	
	handlerElement.appendChild(parent);

	var myConfiguration = JSON.parse(JSON.stringify(zingPieChart));
	
	var periods = [], titles = [], values = [];

	var sumeverything = 0;
	
	for (var i = 0, j = Data.length; i < j; i++)
	{
		if (i == 0)
		{			
			titles = GetColumns(Data[i], titles, 1);
		}
		else
		{
			var theData = GetColumns(Data[i], [], 0);
			periods.push(theData[0]);

			let oldValue = 0;
			for(let a = 1, b = theData.length; a < b; a++)
			{
				if (typeof(values[a - 1]) == 'undefined')
					values[a - 1] = [];
				values[a - 1].push(theData[a]);
				
				sumeverything += theData[a];
			}
		}
	}
	
	for (var i = 0, j = values[0].length; i < j; i++)
	{
		let itemObject = { 'values': [ values[0][i] ], 'text':  periods[i] };
		
		var itemPercentage = (values[0][i] / sumeverything) * 100;
		if (itemPercentage < 2)
			itemObject.visible = false;

		myConfiguration["series"].push(itemObject);
	}
	
	zingchart.render({
      id: child.id,
      data: myConfiguration,
	  height: '350',
      width: '100%'
    });
	
	child.style.width = "";
}
//*****************************************************//
//                  Extras
//*****************************************************//
function getnewChartID()
{
	return "C" + (++chartIDNumber);
}

function ArrayABS(inputarray, rivalarray)
{
	var outputArray = [];
	for (var i = 0, j = inputarray.length; i < j; i++)
	{
		let absValue = Math.abs(inputarray[i]);
		if (absValue > 100)
			outputArray.push(100 - Math.abs(rivalarray[i]));
		else
			outputArray.push(absValue);
	}
	
	console.log(outputArray);
	return outputArray;
}

function GetColumns(targetArray, outputArray, startIndex)
{
	for (let i = startIndex, j = targetArray.length; i < j; i++)
	{
		outputArray.push(targetArray[i]);
	}	
	return outputArray;
}

var persianNumbers = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];
fixNumbers = function (str)
{
	str = str.split(' ');
	for(var i = 0, j = str.length; i < j; i++)
	{
		if (!isNaN(parseInt(str[i])))
		{
			str[i] = str[i].split("").reverse().join("");
			for(var b=0; b<10; b++)
				str[i] = str[i].replaceAll(b, persianNumbers[b]);
		}
	}
	return str.join(" ");
};
//*****************************************************//
//                  Base Configurations
//*****************************************************//
var zingPieChart =
{
    type: 'pie',
    globals: {
        fontFamily: 'paFont'
    },
    "plotarea": {
        "margin": "dynamic",
    },
	gui: {
		contextMenu: {
			empty : true
		}
	},
    backgroundColor: 'none',
    palette: ['#0099CC', '#007E33', '#FF8800', '#CC0000', '#33b5e5', '#00C851', '#ffbb33', '#ff4444'],
    plot: {
        valueBox: [{
                text: '%npv%',
                placement: 'out',
                fontWeight: "bold",
                fontSize: "13"
            }
        ],
        highlightState: {
            borderColor: '#fff',
            borderWidth: '3px'
        }
    },
    legend: {
        marginRight: '10px',
        alpha: 0.3,
        borderWidth: '0px',
		borderRadius: '4',
        highlightPlot: true,
        item: {
            fontColor: '#373a3c',
            fontSize: '13',
            "maxChars": "16"
        },
        "marker": {
            "type": "circle"
        },
        toggleAction: 'remove',
        verticalAlign: 'middle',
        "max-items": '8',
        overflow: 'page'
    },
	'scale-r': {
		'ref-angle': 90 //relative to the starting 90 degree position.
	},
    tooltip: {
		shadow: false,
        borderRadius: '4',
        text: "%t<br><br>%npv%",
		fontSize: "13"
    },
    series: []
};

var zingBarChart =
{
    type: 'bar',
    backgroundColor: 'none',
	"plotarea": {
		"margin": "40 40 40 dynamic",
	},
	gui: {
		contextMenu: {
			empty : true
		}
	},
    scaleX: {
        item: {
            'font-family': 'paFont',
            color: 'black',
            fontSize: "15",
            rtl: true
        },
        values: null
    },
    scaleY: {		
		"thousands-separator": ",",
        item: {
            fontFamily: 'paFont',
            color: 'black'
        },
        guide: {
            lineColor: '#ebebeb',
        },
		refValue: 0,
		refLine:
		{
			lineColor: 'white',
			lineStyle: 'solid',
			lineWidth: 1,
			visible: true
		}
    },
    plot: {
		showZero: true,
        borderRadius: 4,
		barMaxWidth: 100,
        tooltip: {
			shadow: false,
            fontFamily: 'paFont',
            fontSize: "13",
            text: '%t<br>درصد %v',
            borderRadius: '4'
        }
    },
    series: []
};

var barchartItemObject =
{
	values: [],
	text: '1400',
	backgroundColor: '#3366cc',
	"thousands-separator": ",",
	valueBox: {
		fontFamily: 'paFont',
		fontColor: '#fff',
		placement: 'top-in',
		fontSize: "14",
		fontWeight: "normal"
	}
};

var zingLineChart =
{
    "type": "line",
	gui: {
		contextMenu: {
			empty : true
		}
	},
    backgroundColor: 'none',
	"plotarea": {
		"margin": "40 40 40 dynamic",
	},
    "scale-x": {
        offset: 20,
        item: {
            'font-family': 'paFont',
            color: 'black',
            fontSize: "15"
        },
        values: null
    },
    "scale-y": {
        "line-color": "#f6f7f8",
        "shadow": 0,
        "thousands-separator": ",",
        item: {
            'font-family': 'paFont',
            color: 'black'
        },
        guide: {
            lineColor: '#ebebeb',
            "line-style": "dashed"
        }
    },
    "crosshair-x": {
        "line-color": "#efefef",
        "plot-label": {
            "thousands-separator": ",",
            "border-radius": "5px",
            "border-width": "1px",
            "border-color": "#f6f7f8",
            "padding": "8px",
            'font-family': 'paFont',
            "font-size": "14",
            "font-color": "black",
            "font-weight": "bold",
			shadow: false
        },
        "scale-label": {
            "background-color": "#f6f7f8",
            "border-radius": "5px",
            'font-family': 'paFont',
            "font-size": "15",
            "font-color": "black",
            "font-weight": "bold",
			shadow: false
        }
    },
    "tooltip": {
        "visible": false
    },
    "plot": {
        "highlight": true,
        "shadow": 0,
        "line-width": "2px",
        "aspect": "spline",
        "marker": {
            "type": "circle",
            "size": 3
        },
        "highlight-state": {
            "line-width": 3
        },
    },
    "series": []
};

var linechartItemObject =
{
	"values": [],
	"data-percentage": [],
	"text": "TITLE",
	"line-color": "#007790",
	"marker": {
		"background-color": "#007790",
		"border-width": 1,
		"shadow": 0,
		"border-color": "#69dbf1"
	},
	"highlight-marker": {
		"size": 6,
		"background-color": "#007790",
	},
	valueBox: {
		text: "%data-percentage",
		backgroundColor: '#007790',
		padding: '4px 8px',
		color: 'white',
		fontSize: "13",
		shadow: 0,
		'border-radius': "5px",
		placement: 'top',
		"font-family": "paFont",
		"font-weight": "normal"
	}
};

var zingMixedChart =
{
    "type": "mixed",
	gui: {
		contextMenu: {
			empty : true
		}
	},
    backgroundColor: 'none',
	"plotarea": {
		"margin": "40 40 40 dynamic",
	},
    "scale-x": {
        offset: 20,
        item: {
            'font-family': 'paFont',
            color: 'black',
            fontSize: "15"
        },
        values: null
    },
    "scale-y": {
		offsetStart: 70,
        "line-color": "#f6f7f8",
        "shadow": 0,
        "thousands-separator": ",",
        item: {
            'font-family': 'paFont',
            color: 'black'
        },
        guide: {
            lineColor: '#ebebeb',
            "line-style": "dashed"
        }
    },
	"scale-y-2": {	
		values: "0:400:50",
        visible: false
    },
    "crosshair-x": {
        "line-color": "#efefef",
        "plot-label": {
            "thousands-separator": ",",
            "border-radius": "5px",
            "border-width": "1px",
            "border-color": "#f6f7f8",
            "padding": "8px",
            'font-family': 'paFont',
            "font-size": "14",
            "font-color": "black",
            "font-weight": "bold",
			shadow: false
        },
        "scale-label": {
            "background-color": "#f6f7f8",
            "border-radius": "5px",
            'font-family': 'paFont',
            "font-size": "15",
            "font-color": "black",
            "font-weight": "bold",
			shadow: false
        }
    },
    "series": []
};

var mixedchartLineItemObject =
{
	"type": "line",
	"values": [],
	"text": "TITLE",
	"line-color": "#007790",
	"marker": {
		"background-color": "#007790",
		"border-width": 1,
		"shadow": 0,
		"border-color": "#69dbf1",
		"type": "circle",
        "size": 3
	},
	"highlight-marker": {
		"size": 6,
		"background-color": "#007790",
	},
	"highlight": true,
	"shadow": 0,
	"line-width": "2px",
	"aspect": "spline",
	"highlight-state": {
		"line-width": 3
	},
	"tooltip": {
        "visible": false
    }
};

var mixedchartBarItemObject =
{
	"type": "bar",
	"scales": "scale-x,scale-y-2",
	"values": [],
	showZero: true,
	"text": "TITLE",
	shadow: 0,
	"border-radius": '3px 3px 0px 0px',
	tooltip: {
		fontFamily: 'paFont',
		fontSize: "13",
		text: '%t<br><br>%data-values%',
		borderRadius: '7',
		shadow: false
	},
	guideLabel: { text: "Hello", visible: false }
  
};
