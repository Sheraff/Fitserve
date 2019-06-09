#!/bin/bash

# <bitbar.title>Fitbit</bitbar.title>
# <bitbar.version>v1.0</bitbar.version>

icon='iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAMAAAFfKj/FAAAACXBIWXMAAAsTAAALEwEAmpwYAAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAADNQTFRF////AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA8YBMDAAAABB0Uk5TABAfIDA8QFBgcJCgwNDg8Epn6XEAAABwSURBVBgZBcGBAYMwCACwVNlWRYT/r10CeUAGzwcLCucMR8+QDW6AcLkRqYE5gZUAAfSeeYG1BFVRlf1y2zsg7B3gagCu6RMAvyW33QFwh9x2B8g6KqPrqMnoSUAs6yKeL85+9sxn5gXAHQDAqgT4Azd1BBGqCkNyAAAAAElFTkSuQmCC'
fitserve=$(dirname "$0")/utils/Fitserve
node=/usr/local/bin/node
FILE=$fitserve/data/root.txt
url=$(<$FILE)


calories=$(curl -sS $url/calories)
status=$?

if test "$status" != "0"; then
	rm $FILE
	nohup $node $fitserve/app.js &>/dev/null &
	echo "... | templateImage=$icon terminal=false refresh=true"
else
	echo "$calories | templateImage=$icon"
	echo "---"
	echo "$calories kcal"
	echo "$(curl -sS $url/heart) bpm"
	echo "$(curl -sS $url/weight) kg"
	echo "---"
	echo "$(curl -sS $url/devices)"
	echo "---"
	echo "$url | href=$url"
	echo $fitserve
fi


echo "---"
echo "↻ Refresh| terminal=false refresh=true"
