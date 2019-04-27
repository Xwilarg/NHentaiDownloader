#!/bin/sh
# Just a small test to be sure that we can still reach the API
code=$(curl -s -o /dev/null -w "%{http_code}" https://nhentai.net/api/gallery/161194)
if [[ $code -eq 200 ]]
then
    json=$(curl -s https://nhentai.net/api/gallery/161194)
    if [[ $json == *'pretty":"Tsuna-kan. | Tuna Can"'* ]]
    then
        exit 0
    else
        echo "Pretty title not found"
        exit 1
    fi
else
    err="Invalid HTTP code "
    err+=$code
    echo $err
    exit 1
fi