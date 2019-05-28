// The Vue build version to load with the `import` command
// (runtime-only or standalone) has been set in webpack.base.conf with an alias.
import Vue from 'vue'
import App from './App'
import router from './router'
import iView from 'iview';
import 'iview/dist/styles/iview.css'; // iview CSS
import axios from 'axios'
import VueAxios from 'vue-axios'
Vue.config.productionTip = false


Vue.use(VueAxios, axios)
/* eslint-disable no-new */
Vue.use(iView);


axios.defaults.baseURL = 'http://localhost:8080/VideoSystem/'
new Vue({
  el: '#app',
  router,
  template: '<App/>',
  components: { App }
})
