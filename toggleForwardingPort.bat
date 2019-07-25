@echo off

:: 远程地址
set connectaddress=192.168.1.10
:: 本地地址
set listenaddress=0.0.0.0
:: 连接方式，ipv4 -> ipv4
set IP2IP=v4tov4

:: Aria2 端口
:: 远程端口
set connectAria2Port=6800
:: 本地端口
set listenAria2Port=6800
set isProxyAria2=1
for /f "skip=5 tokens=4" %%i in ('netsh interface portproxy show %IP2IP%') do (
    if "%%i"=="%connectAria2Port%" (
        netsh interface portproxy delete %IP2IP% listenaddress=%listenaddress% listenPort=%listenAria2Port%
        echo "Delete %listenaddress%:%listenAria2Port% ->| %connectaddress%:%connectAria2Port%"
        set isProxyAria2=0
    )
)
if "%isProxyAria2%"=="1"  (
    netsh interface portproxy add %IP2IP% listenPort=%listenAria2Port% listenaddress=%listenaddress% connectPort=%connectAria2Port% connectaddress=%connectaddress%
    echo "Add %listenaddress%:%listenAria2Port% -> %connectaddress%:%connectAria2Port%"
)

:: Danmu 端口，不需要则注销掉此段
:: 远程端口
set connectDanmuPort=6801
:: 本地端口
set listenDanmuPort=6801
set isProxyDanmu=1
for /f "skip=5 tokens=4" %%i in ('netsh interface portproxy show %IP2IP%') do (
    if "%%i"=="%connectDanmuPort%" (
        netsh interface portproxy delete %IP2IP% listenaddress=%listenaddress% listenPort=%listenDanmuPort%
        echo "Delete %listenaddress%:%listenDanmuPort% ->| %connectaddress%:%connectDanmuPort%"
        set isProxyDanmu=0
    )
)
if "%isProxyDanmu%"=="1" (
    netsh interface portproxy add %IP2IP% listenPort=%listenDanmuPort% listenaddress=%listenaddress% connectPort=%connectDanmuPort% connectaddress=%connectaddress%
    echo "Add %listenaddress%:%listenDanmuPort% -> %connectaddress%:%connectDanmuPort%"
)

netsh interface portproxy show all
echo "All Complete"
pause