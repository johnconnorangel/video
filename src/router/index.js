import Vue from 'vue'
import Router from 'vue-router'
import Main from '@/components/main'
Vue.use(Router)

export default new Router({
  routes: [
	{
      path: '/',
      redirect: "/main"
    },
    {
      path: '/main',
      name: 'main',
      component: Main
    }
  ]
})
