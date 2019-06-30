@echo off

:: 远程地址
set connectaddress=192.168.10.10
:: 远程端口
set connectport=6800
:: 本地地址
set listenaddress=0.0.0.0
:: 远程端口
set listenport=6800
:: 连接方式，ipv4 -> ipv4
set IP2IP=v4tov4

for /f %%i in ('netsh interface portproxy show %IP2IP% listenport=6800') do set isProxy=%%i
if defined isProxy (
    netsh interface portproxy delete %IP2IP% listenaddress=%listenaddress% listenport=%listenport%
    echo "Delete %listenaddress%:%listenport% ->| %connectaddress%:%connectport%"
) else (
    netsh interface portproxy add %IP2IP% listenport=%listenport% listenaddress=%listenaddress% connectport=%connectport% connectaddress=%connectaddress%
    echo "Add %listenaddress%:%listenport% -> %connectaddress%:%connectport%"
)

netsh interface portproxy show all
echo "Complete"
pause