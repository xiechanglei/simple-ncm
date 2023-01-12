import aes from 'aes-js'

const aesEcb = new aes.ModeOfOperation.ecb(new Uint8Array([0x68, 0x7A, 0x48, 0x52, 0x41, 0x6D, 0x73, 0x6F, 0x35, 0x6B, 0x49, 0x6E, 0x62, 0x61, 0x78, 0x57]))
const aseMeta = new aes.ModeOfOperation.ecb(new Uint8Array([0x23, 0x31, 0x34, 0x6C, 0x6A, 0x6B, 0x5F, 0x21, 0x5C, 0x5D, 0x26, 0x30, 0x55, 0x3C, 0x27, 0x28]));
const dataOffset = 10 //数据起始位置

/**
 * 解析ncm文件信息
 */
export const parseNcmFile = (file) => {
    const [trimKeyData, keyEndIndex] = parseKey(file)
    const [metaObject, metaEneIndex] = parseMeta(file, keyEndIndex)
    const [imageBuffer, globalOffset] = parseImage(file, metaEneIndex + 9)
    const musicBuffer = parseMusicData(file, globalOffset, trimKeyData)
    return [musicBuffer, imageBuffer, metaObject]
}


/**
 * 从ncm文件的头部抽出key信息
 */
export const parseKey = (file, offset = dataOffset) => {
    let [keyData, endIndex] = parseData(file, offset, 0x64)
    const decodedKeyData = aes.padding.pkcs7.strip(aesEcb.decrypt(keyData))
    return [decodedKeyData.slice(17), endIndex]
}

/**
 * 从ncm文件的头部抽出音乐meta信息
 */
export const parseMeta = (file, offset) => {
    let [metaData, endIndex] = parseData(file, offset, 0x63)
    const base64decode = Buffer.from(Buffer.from(metaData.slice(22)).toString('ascii'), 'base64')
    const meatArray = aes.padding.pkcs7.strip(aseMeta.decrypt(base64decode))
    const metaJson = Buffer.from(meatArray).toString('utf8')
    const metaObject = JSON.parse(metaJson.substring(6))
    return [metaObject, endIndex]
}

/**
 * 从ncm文件的头部抽出音乐封面信息
 */
export const parseImage = (file, offset) => {
    const imageLength = file.readUInt32LE(offset)
    const imageBuffer = Buffer.alloc(imageLength)
    file.copy(imageBuffer, 0, offset + 4, offset + 4 + imageLength);
    return [imageBuffer, offset + 4 + imageLength]
}

/**
 * 从ncm文件的头部抽出音乐数据
 */
export const parseMusicData = (file, offset, key) => {
    const box = buildKeyBox(key)
    let n = 0x8000
    let fmusic = []
    while (n > 1) {
        const buffer = Buffer.alloc(n)
        n = file.copy(buffer, 0, offset, offset + n)
        offset += n

        for (let i = 0; i < n; i++) {
            let j = (i + 1) & 0xff
            buffer[i] ^= box[(box[j] + box[(box[j] + j) & 0xff]) & 0xff]
        }

        fmusic.push(buffer)
    }
    return Buffer.concat(fmusic)

}

const parseData = (file, offset, key) => {
    const length = file.readUInt32LE(offset)
    const data = Buffer.alloc(length)
    file.copy(data, 0, offset + 4, offset + 4 + length)
    for (let i = 0; i < length; i++) {
        data[i] ^= key
    }
    return [data, offset + 4 + length]

}


const buildKeyBox = (key) => {
    const keyLength = key.length
    const box = Buffer.alloc(256)
    for (let i = 0; i < 256; i++) {
        box[i] = i
    }
    let swap = 0, c = 0, lastByte = 0, keyOffset = 0
    for (let i = 0; i < 256; ++i) {
        swap = box[i]
        c = ((swap + lastByte + key[keyOffset++]) & 0xff)
        if (keyOffset >= keyLength) {
            keyOffset = 0
        }
        box[i] = box[c]
        box[c] = swap
        lastByte = c
    }
    return box
}
