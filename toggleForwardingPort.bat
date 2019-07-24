@echo off

:: 远程地址
set connectaddress=192.168.50.10
:: 远程端口
set connectArai2Port=6800
set connectDanmuPort=6801
:: 本地地址
set listenaddress=0.0.0.0
:: 远程端口
set listenArai2Port=6800
set listenDanmuPort=6801
:: 连接方式，ipv4 -> ipv4
set IP2IP=v4tov4

for /f %%i in ('netsh interface portproxy show %IP2IP% listenPort=6800') do set isProxy=%%i
if defined isProxy (
    netsh interface portproxy delete %IP2IP% listenaddress=%listenaddress% listenPort=%listenArai2Port%
    echo "Delete %listenaddress%:%listenArai2Port% ->| %connectaddress%:%connectArai2Port%"
) else (
    netsh interface portproxy add %IP2IP% listenPort=%listenArai2Port% listenaddress=%listenaddress% connectPort=%connectArai2Port% connectaddress=%connectaddress%
    echo "Add %listenaddress%:%listenArai2Port% -> %connectaddress%:%connectArai2Port%"
)
echo "Arai2 Complete"

REM for /f %%i in ('netsh interface portproxy show %IP2IP% listenPort=6801') do set isProxy=%%i
REM if defined isProxy (
REM     netsh interface portproxy delete %IP2IP% listenaddress=%listenaddress% listenPort=%listenDanmuPort%
REM     echo "Delete %listenaddress%:%listenDanmuPort% ->| %connectaddress%:%connectDanmuPort%"
REM ) else (
REM     netsh interface portproxy add %IP2IP% listenPort=%listenDanmuPort% listenaddress=%listenaddress% connectPort=%connectDanmuPort% connectaddress=%connectaddress%
REM     echo "Add %listenaddress%:%listenDanmuPort% -> %connectaddress%:%connectDanmuPort%"
REM )
REM echo "Danmu Complete"

netsh interface portproxy show all
echo "All Complete"
pause