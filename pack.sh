#/bin/bash
NAME="$(basename $(PWD))"
fgrep '"key"' manifest.json && exit 1
egrep '^\s*//' manifest.json && exit 1
cd ..
rm -f "$NAME.zip"
zip "$NAME.zip" `find "$NAME" -type f | egrep -v "(/\.git|\.sw[^\.*]$|DS_Store|/style\.css$|/url\.txt$|/readme\.txt$|\.pl$|\.sh$|\.tmpl\.|TODO)"`
