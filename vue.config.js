
module.exports = {
  
  publicPath: './', // 静态资源路径（默认/，打包后会白屏）
  outputDir: 'dist', // 打包后文件的目录 （默认为dist）
  assetsDir: '', //  outputDir的静态资源(js、css、img、fonts)目录  默认为‘’没有单独目录js/css/img在根目录中。

  //去除生产环境的productionSourceMap
  productionSourceMap: false,

  devServer: {
   open: true, // 自动启动浏览器
   host: '0.0.0.0', // localhost
   port: 8080, // 端口号
   hotOnly: false, // 热更新

   overlay: {
      //  当出现编译器错误或警告时，在浏览器中显示全屏覆盖层
      warnings: false,
      errors: true
    },
    proxy: {
      //配置跨域
      '/api': {
        // target: 'http://192.168.8.117:8080/', // 接口的域名
        target: 'http://192.168.43.117:9963/', // 接口的域名
        // ws: true, // 是否启用websockets
        changOrigin: true, // 开启代理，在本地创建一个虚拟服务端
        pathRewrite: {
          '^/api': '/'
        }
      }
    }
  }
}
