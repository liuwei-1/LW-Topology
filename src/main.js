import Vue from 'vue'
import App from './App.vue'
import router from './router'
// 引入datav
import './utils/datav'

Vue.config.productionTip = false

// element组件
import ElementUI from 'element-ui';
import 'element-ui/lib/theme-chalk/index.css';
Vue.use(ElementUI);


new Vue({
  router,
  render: h => h(App)
}).$mount('#app')
