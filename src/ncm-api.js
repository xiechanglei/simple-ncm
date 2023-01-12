import fs from 'fs'
import { parseNcmFile } from './ncm-parse.js'
import NodeID3 from "node-id3"

const convertFile = (filePath) => {
    if (filePath.endsWith("ncm")) {
        let [musicBuffer, imageBuffer, metaObject] = parseNcmFile(fs.readFileSync(filePath))
        const newName = filePath.replace(/\.ncm$/, '.mp3')
        fs.writeFileSync(newName, musicBuffer)
        // 发现音乐部分的数据真的是啥都没有，就手动增加一些音乐的描述信息，把音乐封面文件也写入进去
        // 这样很多的播放器就可以自动生成对应的ui了
        const options = {
            title: metaObject.musicName,
            album: metaObject.album,
            artist: metaObject.artist.map(item => item[0]).join(','),
            TALB: metaObject.album,
            TIT2: metaObject.musicName,
            image: {
                mime: "image/jpeg",
                type: {
                    id: 3,
                    name: "timeone"
                },
                description: "ncm-job",
                imageBuffer: imageBuffer
            }
        }
        NodeID3.write(options, newName)
    }
}

const convertDictory = (dir) => {
    dir.endsWith('/') || dir.endsWith('\\') || (dir += '/')
    const list = fs.readdirSync(dir)
    list.forEach(file => convertFile(dir + file))
}

convertDictory('./Music/')

