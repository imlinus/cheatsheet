import server from './modules/static-server/source/index.js'

server({
  src: 'build',
  port: 3000,
  main: 'index.html'
})
