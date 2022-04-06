/**
 * 封装axios
 */
import axios from 'axios'
import { Message } from 'element-ui'
// import { Loading } from 'element-ui'

// 配置请求的基准URL地址

axios.defaults.baseURL = process.env.VUE_APP_BASE_URL;
console.log(process.env.VUE_APP_BASE_URL);
// let loadingInstance;

axios.create({
    //以application / x-www-form-urlencoded格式发送数据 
    headers: { "content-type": "application/x-www-form-urlencoded" },
    //带cookie请求
    withCredentials: true,
});
// 请求拦截器
axios.interceptors.request.use(config => {
    // loadingInstance = Loading.service({
    //     lock:true,
    //     text:'玩命加载中...',
    //     spinner: 'el-icon-loading',
    //     background:'rgba(0, 0, 0, 0.7)'
    // });
    // setTimeout(() => {
        // loadingInstance.close()
    // }, 2000);
    return config;
}, error => {
    return Promise.reject(error)
})
// 响应拦截器
axios.interceptors.response.use(response => {
    // loadingInstance.close();
    return response;
}, error => {
    return Message.error(error)
})
export default axios;