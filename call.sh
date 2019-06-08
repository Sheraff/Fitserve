#!/bin/bash

# <bitbar.title>Fitbit</bitbar.title>
# <bitbar.version>v1.0</bitbar.version>

icon='data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAAAXNSR0IArs4c6QAABKpJREFUWAnNV2tsFFUUvufObFut0khJbfRPS7EIiPjPhD82MVT/1fQx2wZ5KRpf0aCBxEcIwYhRo4aHpD8gaHm0O1sImJCAjaI/jIl/DFptpGFbDRoLbCPycNvdmeN3Zplmp9mhnU1Eb9K995xzzznfnPudO1NSJYwF/f1LnKy7VylexEofrzT46R8t60oJoZQuxSmXcw+w4gdZqTlKuV1XHX6tlDjiExnAFmZNSt0XSEhqWUCOIEQHQOSi9J8Hc9BnQXn2UmQAErq8LLYSxesmRV+hGhvXxjt2zj7l/2wnHqC00Wjbd2fZaCirML/7uaXlsh9lgW0vdphQIeWQQftT7e3Dvq3YHApAyPZJwt6pWFlMNKi1WpOyrF8lSH0i8ZRi2s3MJgKMqZjRPNLe/n1Db3K5S/wF9OVeMqJrpMzlI52tp4slF10oB3r6kp3M6jm02jzF3MQOvScOS2y7jJm2S3KRYb9T5dy3ZI3kr04l94x8K6vcJlmGjVAA6PO7gk5T8m0AdEvAxqpGZACuDughoELzpusK5VAAMYN6wfLz3mYiB0+6S9a48cYR9kRhENZ8MC/zsUK9rAHg6HRdoRwK4Ixl/VZebi7WpNtiylw62mUlfMc5c6vaEXizIjpEWq0ajcd3iK2utuZ9IjkqSgt4TbT1bLyj2/crNiPOzRtNp06Z59Lphaz1hbOtrV51bwgADhWj6fQyQ+sR30HgSqBfxi6uxak3gsYDI5Y1IHqvc+z+Dcrl1TgyhzTvHYnHPxJbvW2vYFf1gCi1IqNSidvvqHqS6vuSzVDuwmFlEGw9gn0rG8D22quO+hpJ5kPMoKfjsH0qtvo++yjY3iJrGWjRZ1PxeHddIrlJue47eW3+V2zlpnksk3WG4FNVaCOld4AD7h4w/h4YlypHeWhl0zWHn7+eXMQKPJXXao2HD88vTC5GsH+DzNizzpsLftildZmsu2J6ctmCvB2hJCyI8a8uAUCvB2OHidQgx/QLfraKMnM3Tip1Xc7gw+MNWZ9pa0thv3cU/l74fuitNe3zdf4MHuyriOkBnPklX+fPiJOckYTnxsYf4DJKRSYh4WIk3jMjCX00N2OO3Ib3HjlSPTnpPGQoY2i4s3XIB3n/yZOVl8f/fBmdsxB/J/CUB8SWb88L20DKJ1BaB0fTjYtoC8qPriw+Qkkor9uJidxPLruHsyr3Q12vHfdD/DV+qR8RtyLRSvT2/rpE4kWxjf5x/hWwfSP4XQ2G17jMmxsSyWd8v2JzKICsw10SxHNiNvBEHkFxP8xFgkcLg5Hrvf+hoqm7wbcD6GP+utgcCgAM/T3oMCVfwTX2d8BGKn+tkkoH9BAA4OJ0XaEcCmB1Z0cfzlBaMY2EX5IhpfXehpM40pdwrjmRUZkxZerXZa2Z3oZ+QtbeyH+QvOuLxeYbtmExB1834yeZ67oUM3pm+iTz4/1nc0kVkPbMTObeBOpFxHx8Taf1AXoN/y9EH953XVS3icnsQbDrEfEDyZo+TiSzWG6PGkf2h5IwLJi880G9h4N2bg7Ks5eiA0Cp8dSDgRSsTgfkCEJkABLbNPXjuCe+yb/h6FClQdsi5Axs/QfsgOkblMWjogAAAABJRU5ErkJggg=='
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
fi
  

echo "---"
echo $calories
echo $fitserve
echo $url
echo "---"
echo "↻ Refresh| terminal=false refresh=true"
