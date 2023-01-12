import fs from 'fs'
import { parseNcmFile } from './ncm-parse.js'
import NodeID3 from "node-id3"

const convertFile = (filePath) => {
    if (filePath.endsWith("ncm")) {
        let [musicBuffer, imageBuffer, metaObject] = parseNcmFile(fs.readFileSync(filePath))
        const newName = filePath.replace(/\.ncm$/, '.mp3')
        fs.writeFileSync(newName, musicBuffer)
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

