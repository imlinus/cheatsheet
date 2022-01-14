import path from 'path'
import http from 'http'
import fs from 'fs'
import isPortAvailable from './modules/is-port-available/source/index.js'

const mimes = {
  'js': 'application/x-javascript',
  'pdf': 'application/pdf',
  'mp4': 'video/mp4',
  'css': 'text/css',
  'htm': 'text/html',
  'html': 'text/html',
  'txt': 'text/plain',
  'vcf': 'text/x-vcard',
  'xml': 'text/xml',
  'bmp': 'image/x-ms-bmp',
  'gif': 'image/gif',
  'jpeg': 'image/jpeg',
  'jpg': 'image/jpeg',
  'png': 'image/png',
}

const mime = {
  get (ext) {
    return mimes[ext] || 'application/octet-stream'
  }
}

async function server (options) {
  options.src = Array.isArray(options.src) ? options.src : [options.src]
  options.main = options.main || 'index.html'

  try {
    options.port = await isPortAvailable(options.port || 1337)
    createServer(options)
  } catch (error) {
    throw new Error('Server could not be started')
  }
}

function createServer (options) {
  let filePath = ''

  return http.createServer((request, response) => {
    const slash = request.url.split('')[request.url.split('').length - 1] === '/'

    if (request.url === '/') {
      filePath = path.resolve(options.src[0], options.main)
    } else {
      filePath = (slash
        ? path.join(options.src[0], request.url.slice(0, -1))
        : path.join(options.src[0], request.url)
      )
    }

    fs.readFile(filePath, (error, data) => {
      if (!error) {
        const ext = String(path.extname(filePath)).toLowerCase().replace('.', '')

        response.writeHead(200, {
          'Content-Type': mime.get(ext)
        })

        response.end(data, 'utf-8')
      } else {
        console.log(error)
      }
    })
  }).listen(options.port)
}

export default server
