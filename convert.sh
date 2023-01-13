rm -rf ./Music
adb pull /storage/emulated/0/netease/cloudmusic/Music
node ./src/ncm-api.js
adb push ./Music/*.mp3 /sdcard/Download/musics/
adb shell rm -rf /storage/emulated/0/netease/cloudmusic/Music/*
