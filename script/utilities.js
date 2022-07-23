var stockPriceInput = null;
var chartLoaded = false, 
	bodydisabler = document.getElementById("bodydisabler"),
	handlerElement = document.getElementById("handler"),
	stockList = document.getElementById("stockList"),
	stockSymbol = document.getElementById("stockSymbol"),
	loadingData = false,
	showingList = false,
	PonEElement = null,
	chartsHandler = null,
	chartsSlider = null,
	searchTimeout = null,
	PonETimer = null,
	errormessagetime = null
;

stockSymbol.oninput = function()
{
	searchStock(stockSymbol);
};

//*****************************************************//
//                  Dynamic
//*****************************************************//
function HOOKValueWithInput(element, haspercentage)
{
	element.ondblclick = function()
	{
		let originalCellContent = element.innerText;
		if (element.children.length == 0)
		{
			element.firstChild.remove();
			
			var inputElement = document.createElement("input");
			inputElement.className = "form-control tableInput";
			if (!haspercentage)
				inputElement.style = "min-width: 75px;";
			inputElement.value = originalCellContent;			
			inputElement.onblur = function()
			{
				var newValue = parseInt(inputElement.value.replaceAll("%", "").replaceAll(",", ""));
				if (!isNaN(newValue))
				{
					if (haspercentage)
					{
						updateCalculcations(parseInt(originalCellContent.replaceAll("%", "").replaceAll(",", "")), newValue);
						element.innerHTML = newValue + "%";
					}
					else
					{
						element.innerHTML = newValue.toString().split(/(?=(?:\d{3})+$)/).join(",");				
						if (stockPriceInput != null)
						{
							var theVal = parseInt(stockPriceInput.value.replaceAll(",", ""));
							if (!isNaN(theVal) && theVal > 0)
								CalculatePE(theVal, true);
						}
					}
					
						
				}
			};
			inputElement.onkeydown = function(event)
			{
				if (event.keyCode == 13)
					inputElement.blur();
			};
			element.appendChild(inputElement);
			inputElement.focus();
			if (haspercentage)
				inputElement.setSelectionRange(0, originalCellContent.length - 1);
			else
				inputElement.setSelectionRange(0, originalCellContent.length);
			//cell.innerHTML = "<input class='' value='" + originalCellContent + "' onblur='this.parentNode.innerHTML = t' />";
		}
	};
}

function updateCalculcations(originalValue, newValue)
{
	var tables = document.getElementsByTagName("table");
	if (tables.length > 0)
	{
		tables = tables[0];
		var rows = tables.getElementsByTagName("td");
		for (var i = 0, j = rows.length; i < j; i++)
		{
			if (rows[i].innerText.startsWith("EPS") && !rows[i].innerText.includes("Previous"))
			{
				var EPS = parseInt(rows[i + 1].innerText.replaceAll(",", ""));			
				rows[i + 1].innerText = Math.round((EPS / originalValue) * newValue).toString().split(/(?=(?:\d{3})+$)/).join(",");
			}
		}
	}
	if (stockPriceInput != null)
	{
		var theVal = parseInt(stockPriceInput.value.replaceAll(",", ""));
		if (!isNaN(theVal) && theVal > 0)
			CalculatePE(theVal, true);
	}
}

function CalculatePE(input, system)
{
	if (!isNaN(input))
	{
		var tables = document.getElementsByTagName("table");
		if (tables.length > 0)
		{
			var EPSValues = 0, EPSCounter = 0;
			
			tables = tables[0];
			var rows = tables.getElementsByTagName("td");
			for (var i = 0, j = rows.length; i < j; i++)
			{
				if (rows[i].innerText.startsWith("EPS") && !rows[i].innerText.includes("Previous"))
				{
					var currentEPS = parseInt(rows[i + 1].innerText.replaceAll(",", ""));
					if (i > 0 && currentEPS > 0)
					{
						if (EPSCounter > 0 && EPSValues == 0)
							EPSCounter = 0;
						EPSValues += currentEPS;
						EPSCounter++;
					}
					else if (i == 0)
					{
						EPSValues += currentEPS;
						EPSCounter++;
					}
					console.log(rows[i].innerText + " | " + rows[i + 1].innerText);
				}
			}
			
			if (EPSCounter > 0)
			{
				var averageEPS = (EPSValues / EPSCounter), PonE = input / averageEPS;
				if (averageEPS == 0)
					PonE = 0;
					
				if(Math.round(PonE) !== PonE)
					PonE = PonE.toFixed(2);
				
				if (PonEElement == null)
				{
					var row = tables.getElementsByTagName('tbody')[0].insertRow();
					var cell = row.insertCell();
					cell.innerHTML = "P/E <span class='smalltext'>Forward</span>";
					
					cell = row.insertCell();
					cell.innerText = PonE;
					PonEElement = cell;
					
					if (!system)
						tables.parentNode.scrollTo(0, tables.parentNode.scrollHeight);
				}
				else
				{
					PonEElement.innerText = PonE;
				}
			}
		}
		return true;
	}
	return false;
}

//*****************************************************//
//                  Data Handler
//*****************************************************//
function DrawCharts(stockItemData, stockData)
{
	if (chartLoaded)
	{
		for (var i = 0, j = stockData.length; i < j; i++)
		{
			if (typeof(stockData[i].CharType) != 'undefined')
			{
				drawGraphicalChart(stockData[i].CharType, stockData[i].Title, stockData[i].Data, stockData[i]);
			}
			else
			{
				drawColumn(stockItemData, stockData[i].Title, stockData[i].Data);
			}
		}
	}
	else
	{
		setTimeout(function() { DrawCharts(stockItemData, stockData); }, 1000);
	}
}

//*****************************************************//
//                    UI/UX
//*****************************************************//
stockSymbol.onfocus = function(event) {
	if (loadingData)
		return;
	showingList = true;
	if (stockSymbol.value.length == 0)
	{
		searchforStock(null);
	}
	stockSymbol.parentNode.className = "input-group mx-auto limit";
	stockList.style.height = ((screen.height / 2) - 10) + "px";
	bodydisabler.style = "";
	bodydisabler.className = "bodydisabler show";
	//document.body.className = "disabled";
};

stockSymbol.onblur = function(event) {
	hideifNecessary(event);
};

stockList.onblur = function(event)
{
	hideifNecessary(event);
};

function hideifNecessary(event)
{
	if (showingList && (event == null || event.relatedTarget == null || event.relatedTarget.getAttribute("insider") != "true"))
	{
		showingList = false;
		stockSymbol.parentNode.className = "input-group mx-auto";
		stockList.style.height = "0px";
		if (event != null)
		{
			bodydisabler.className = "bodydisabler hide";
			setTimeout(function() { bodydisabler.style = "z-index: -1"; }, 400);
		}	
		//document.body.className = "";
	}
}

function searchStock(element)
{
	if (searchTimeout != null)
		clearTimeout(searchTimeout);
	
	var stockName = element.value;
	if (stockName.length > 1)
	{
		searchTimeout = setTimeout(function() {
			searchforStock(stockName);
		}, 500);
	}
	else
	{
		searchTimeout = setTimeout(function() {
			searchforStock(null);
		}, 500);
	}
}


//*****************************************************//
//                    Extras
//*****************************************************//
function sortArray(array)
{
	var len = array.length;
	for (var i = 0; i < len; i++)
	{
		for (var j = (i + 1); j < len; j++)
		{
			if (array[i][0] < array[j][0])
			{
				var tempval = array[i];
				array[i] = array[j];
				array[j] = tempval;
			}
		}
	}
}

function highlighKeyword(input, keyword)
{
	if (keyword == null)
	{
		return "<span class='highlight'>" + input + "</span>";
	}
	else
	{
		var where = input.indexOf(keyword);
		if (where != -1)
		{
			var start = 0, finish = input.length, wordlen = keyword.length;
			for (var i = where; i > -1; i--)
			{
				if (input[i] == ' ')
				{
					start = (i + 1);
					break;
				}
			}
			for (var i = where, j = input.length; i < j; i++)
			{
				if ((i - where) >= wordlen && input[i] == ' ')
				{
					finish = i;
					break;
				}
			}
			return input.substring(0, start) + "<span class='highlight'>" + input.substring(start, finish) + "</span>" + input.substring(finish);
		}
		else
		{
			return input;
		}
	}
}

function clone(obj) {
    if (null == obj || "object" != typeof obj) return obj;
    var copy = obj.constructor();
    for (var attr in obj) {
        if (obj.hasOwnProperty(attr)) copy[attr] = obj[attr];
    }
    return copy;
}

function searchforStock(stockName)
{
	searchTimeout = null;
	var foundANyMatch = false;
	var output = [], found = 0, j = stocksData.length, cache = new Map();
	if (stockName != null)
	{
		for(var i = 0; i < j; i++)
		{
			if (stocksData[i]["symbol"] == stockName)
			{
				var pushItem = clone(stocksData[i]);
				pushItem["symbol"] = highlighKeyword(pushItem["symbol"], null);
				pushItem.indexID = i;
				output.push([4, pushItem]);			
				cache.set(stocksData[i]["enSymbol"], true);
				found++;
				foundANyMatch = true;
			}
			else if (stocksData[i]["symbol"].includes(stockName) || stockName.includes(stocksData[i]["symbol"]))
			{
				var pushItem = clone(stocksData[i]);
				pushItem["symbol"] = highlighKeyword(pushItem["symbol"], null);
				pushItem.indexID = i;
				output.push([3, pushItem]);
				cache.set(stocksData[i]["enSymbol"], true);
				found++;
				foundANyMatch = true;
			}	
			else if (stocksData[i]["title"].includes(stockName))
			{
				var pushItem = clone(stocksData[i]);
				pushItem["title"] = highlighKeyword(pushItem["title"], stockName);
				pushItem.indexID = i;
				output.push([2, pushItem]);			
				cache.set(stocksData[i]["enSymbol"], true);
				found++;
				foundANyMatch = true;
			}
			else if (stocksData[i]["sectorName"].includes(stockName))
			{
				var pushItem = clone(stocksData[i]);
				pushItem["sectorName"] = highlighKeyword(pushItem["sectorName"], stockName);
				pushItem.indexID = i;
				output.push([1, pushItem]);
				cache.set(stocksData[i]["enSymbol"], true);
				found++;
				foundANyMatch = true;
			}	
			if (found > 39)
			{
				break;
			}
		}
	}
	else
	{
		var stocksList = LoadLastStocks();
		for(var i = (stocksList.length - 1); i > -1; i--)
		{
			if (!cache.has(stocksList[i]["enSymbol"]))
			{
				var pushItem = clone(stocksList[i]);
				pushItem.indexID = pushItem.indexID;
				output.push([0, pushItem]);
				cache.set(stocksList[i]["enSymbol"], true);
				found++;
			}
		}
	}
	if (found < 40)
	{
		for(var i = 0; i < j; i++)
		{
			if (!cache.has(stocksData[i]["enSymbol"]))
			{
				var pushItem = clone(stocksData[i]);
				pushItem.indexID = i;
				output.push([0, pushItem]);
				cache.set(stocksData[i]["enSymbol"], true);
				found++;
			}
			if (found > 39)
			{
				break;
			}
		}
	}
	sortArray(output);
	
	stockList.innerHTML = "";
	for (var i = 0, j = output.length; i < j; i++)
	{
		var item = document.createElement("div");
		item.className = "stockItem";
		if (i > 0)
		{
			stockList.appendChild(document.createElement("hr"));
		}
		
		var market = "بورس";
		if (output[i][1]["marketUnit"] == "FaraPaye")
		{
			market = "بازار پایه";
		}
		else if (output[i][1]["marketUnit"] == "FaraBourse")
		{
			market = "فرابورس";
		}
		if (output[i][1]["sectorName"].length > 3)
			market += " - " + output[i][1]["sectorName"];
		item.innerHTML = output[i][1]["symbol"] + ' - ' + output[i][1]["title"] + '<br><span>' + market +'</span>';
		let itemData = output[i][1];
		
		if (output[i][1]["sectorCode"] != 39 && output[i][1]["sectorCode"] != 66 && output[i][1]["sectorCode"] != 56 && output[i][1]["sectorCode"] != 57 && output[i][1]["sectorCode"] != 58 && output[i][1]["sectorCode"] != 70 && !output[i][1]["title"].includes("ح .") && !output[i][1]["title"].includes("ح.") && !output[i][1]["title"].includes("هلدینگ") && !output[i][1]["title"].includes("سرمایه گذاری") && !output[i][1]["title"].includes("گسترش"))
		{
			item.onclick = function()
			{
				var targetItem = clone(stocksData[itemData.indexID]);
				targetItem.indexID = itemData.indexID;
				loadStockData(targetItem);
			};
		}
		else
		{
			item.className = "stockItem disabled";
		}
		
		stockList.appendChild(item);
	}
	
	stockList.scrollTo(0, 0);
}

function loadStockData(stockItemData, systemrequest)
{
	if (loadingData || stockSymbol.disabled)
		return;
	
	systemrequest = systemrequest || false;
	
	if (systemrequest == false)
		AppendLastStock(stockItemData);
	
	hideifNecessary(null);
	
	stockSymbol.value = stockItemData["symbol"];
	bodydisabler.className = "bodydisabler loading";
	stockSymbol.disabled = true;
	loadingData = true;
		
	setTimeout(function() {	
		var xhttp = new XMLHttpRequest();
		xhttp.onreadystatechange = function() {
			if (this.readyState == 4) {
				if (this.status == 200)
				{
					handlerElement.innerHTML = "";
					var resp = xhttp.responseText;
					if (!resp.includes("CharType"))
						resp = decodeURIComponent(decryptData(resp)).replaceAll("+", " ");
					console.log(resp);
					DrawCharts(stockItemData, JSON.parse(resp));
				}
				else
				{
					showErrorMessage("<strong>خطا!</strong> در هنگام لود کردن اطلاعات خطایی رخ داد.");
				}
				bodydisabler.className = "";
				loadingData = false;
				stockSymbol.disabled = false;
			}
		};
		xhttp.open("GET", "/stockData/" + stockItemData["enSymbol"] + ".hash?i=" + Date.now(), true);
		xhttp.send();
	}, 400);
}

function showErrorMessage(text)
{
	if (errormessagetime != null)
		clearTimeout(errormessagetime);
		
	var element = document.getElementById('errormessage');
	element.innerHTML = text;
	element.style.display = "block";
	
	setTimeout(function() { element.style.opacity = "1"; }, 200);
	
	errormessagetime = setTimeout(function()
	{
		element.style.opacity = "0";
		errormessagetime = setTimeout(function() {
			element.style.display = "none";
		}, 400);	
	}, 3000);
}

function loadlastStock()
{
	var lastStocks = localStorage.getItem("lastStocks");
	if (lastStocks == null)
	{
		var foldItem = {"indexID": 71, "symbol": "فولاد", "enSymbol": "FOLD1", "title": "فولاد مبارکه اصفهان", "sectorCode": "27", "sectorName": "فلزات اساسي", "marketUnit": "Exchange", "tseCode": "46348559193224090", "Rahavard": "453"};
		localStorage.setItem("lastStocks", JSON.stringify([foldItem]));
		searchforStock("فولاد");
		loadStockData(foldItem, true);
	}
	else
	{
		lastStocks = JSON.parse(lastStocks);
		searchforStock(lastStocks[lastStocks.length - 1]["symbol"]);
		loadStockData(lastStocks[lastStocks.length - 1], true);
	}
}

function LoadLastStocks()
{
	var lastStocks = localStorage.getItem("lastStocks");
	if (lastStocks == null)
	{
		return [{"indexID": 71, "symbol": "فولاد", "enSymbol": "FOLD1", "title": "فولاد مبارکه اصفهان", "sectorCode": "27", "sectorName": "فلزات اساسي", "marketUnit": "Exchange", "tseCode": "46348559193224090", "Rahavard": "453"}];
	}
	else
	{
		lastStocks = JSON.parse(lastStocks);
		return lastStocks;
	}
}

function AppendLastStock(stockItem)
{
	var lastStocks = localStorage.getItem("lastStocks");
	if (lastStocks == null)
	{
		localStorage.setItem("lastStocks", JSON.stringify([stockItem]));
	}
	else
	{
		lastStocks = JSON.parse(lastStocks);
		var j = lastStocks.length;
		if (j > 4)
		{
			lastStocks.splice(0, 1);
			j--;
		}
		
		for (var i = 0; i < j; i++)
		{
			if (lastStocks[i]["symbol"] == stockItem["symbol"])
			{
				lastStocks.splice(i, 1);
				break;
			}
		}
		lastStocks.push(stockItem);
		localStorage.setItem("lastStocks", JSON.stringify(lastStocks));
	}
}

function decryptData(s) {
	var b64="ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_";
    var b64d={};
    for(var i=0; i<64; i++){
        b64d[b64.charAt(i)]=i;
    }
    var d=new Map();
    var num=256;
    var word=String.fromCharCode((b64d[s[0]]+(b64d[s[1]]<<6)+(b64d[s[2]]<<12)) - 0x18);
    var prev=word;
    var o=[word];
    for(var i=3; i<s.length; i+=3) {
        var key= (b64d[s[i]]+(b64d[s[i+1]]<<6)+(b64d[s[i+2]]<<12));
        word=key < 256 ? String.fromCharCode(key - 0x18) : d.has(key) ? d.get(key) : word+word.charAt(0);
        o.push(word);
        d.set(num++, prev+word.charAt(0));
        prev=word;
        if(num==(1<<18)-1) {
            d.clear();
            num=256;
        }
    }	
	return o.join("");
}

window.addEventListener("wheel", function(e)
{
	if (document.activeElement === chartsSlider)
	{
		if (e.deltaY > 0) // Down
		{
			chartsSlider.scrollTo({
			  top: 0,
			  left: chartsSlider.scrollLeft - 30,
			  behavior: 'instant'
			});
		}
		else
		{
			chartsSlider.scrollTo({
			  top: 0,
			  left: chartsSlider.scrollLeft + 30,
			  behavior: 'instant'
			})
		}
		e.preventDefault();
	}
	
}, { passive: false });